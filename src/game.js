/* Game shell. Owns the page around the 3D world: starts the planet, the region
   bar, the weather card and the failure/recovery path. Gameplay systems (player,
   errands, collectibles) will plug in here; see docs/DESIGN.md.

   This replaces mario-world's site.js minus everything that belonged to the
   marketing site: capability panels, the contact form, business demos and the
   local diagnostics endpoint. */

import { createController } from './game/controller.js';
import { createDialogue } from './game/dialogue.js';
import { createTargets } from './game/world-targets.js';
import { createErrands, REGION_GATES, REGION_NAMES } from './game/errands-runner.js';
import { createMarkers } from './game/markers.js';
import { createTracker } from './game/tracker.js';
import { loadSave, writeSave, clearSave, totalStamps } from './game/save.js';
import { UNLOCKS } from './content/errands.js';
import { greetingFor, nameFor } from './content/people.js';

export function startGame(root) {
  const canvas = root.querySelector('#stage');
  const pins = root.querySelector('#pins');
  const loading = root.querySelector('#loading');
  const failure = root.querySelector('#failure');
  const hud = root.querySelector('#hud');
  const regionBar = root.querySelector('#regions');
  const regionLabel = root.querySelector('#region-name');
  const live = root.querySelector('#live');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);

  let planet = null;
  let recoveries = 0;
  let showWholeIslandOnLanding = false;
  let player = null;
  const dialogue = createDialogue(root);
  const pad = root.querySelector('#pad');

  const tracker = createTracker(root);
  let save = loadSave();
  let errands = null, targets = null, markers = null;
  let saveTimer = 0, regionTimer = 0, currentRegion = null;

  function persist() { writeSave(save); }
  function refreshTracker() {
    if (!errands) return;
    tracker.show(errands.describe(), errands.idleHint());
    tracker.setStamps(totalStamps(save), (markers ? markers.total : 50) + 0);
    regionBar.querySelectorAll('button').forEach((b) => {
      const open = errands.regionOpen(b.dataset.region);
      b.dataset.locked = open ? 'false' : 'true';
      b.title = open ? '' : `需要「${UNLOCKS[REGION_GATES[b.dataset.region]].name}」`;
    });
    persist();
    if (planet) planet.requestFrame();
  }
  function toast(message) { tracker.toast(message); say(message); }

  function spawnPlayer() {
    if (player || !planet) return;
    const ctx = planet.getMapContext();
    targets = createTargets(ctx);
    errands = createErrands({
      save, targets,
      environment: () => planet && planet.getEnvironment(),
      onChange: refreshTracker,
      onToast: toast
    });
    player = createController({
      planet,
      start: save.position,
      canRun: () => errands.has('bicycle'),
      canEnter: (x, z, fromX, fromZ) => {
        const region = targets.regionAt(x, z);
        if (!region || errands.regionOpen(region.id)) return true;
        // Already standing inside (e.g. an old save): let the walker out.
        const from = targets.regionAt(fromX, fromZ);
        if (from && from.id === region.id) return true;
        return `需要「${UNLOCKS[REGION_GATES[region.id]].name}」才能去${REGION_NAMES[region.id]}`;
      },
      onBlocked: toast,
      onFrame: ({ x, y, z, dt }) => {
        errands.update({ x, z });
        markers.update(dt, { x, y, z }, errands.pointer());
        saveTimer += dt; regionTimer += dt;
        if (saveTimer > 2) { saveTimer = 0; save.position = { x, z }; persist(); }
        if (regionTimer > 0.4) {
          regionTimer = 0;
          const r = targets.regionAt(x, z);
          if (r && r.id !== currentRegion) {
            currentRegion = r.id;
            regionLabel.textContent = REGION_NAMES[r.id] || r.name;
            regionBar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.region === r.id)));
          }
        }
        return false;
      },
      onNearby: (target) => dialogue.showPrompt(target ? nameFor(target) : null),
      onInteract: (target) => {
        player.setFrozen(true);
        const base = greetingFor(target);
        const line = errands.talkTo(target, base.speaker) || base;
        dialogue.open({ ...base, ...line, title: base.title }, () => player && player.setFrozen(false));
      }
    });
    markers = createMarkers({
      group: ctx.group, walkable: player.walkable, regions: targets.regions, foundIds: save.foundStamps,
      onFound: (stamp) => {
        save.foundStamps.push(stamp.id);
        toast(`捡到一枚遗失的邮票！（${REGION_NAMES[stamp.region]}）`);
        refreshTracker();
      }
    });
    hud.dataset.player = 'on';
    // Handle for the browser console and automated play-tests.
    window.__game = { player, errands, targets, markers, save: () => save };
    errands.ensureStarted();
    refreshTracker();
    planet.requestFrame();
    say(save.completed.length ? '欢迎回来，邮差。' : '你在小岛邮局门口。用 WASD 或方向键走路，靠近居民按 E 说话。');
  }
  function removePlayer() {
    if (!player) return;
    player.destroy(); player = null;
    dialogue.close(); dialogue.showPrompt(null);
    tracker.hide();
    hud.dataset.player = 'off';
  }
  root.querySelector('#restart').addEventListener('click', () => {
    if (!confirm('重新开始会清除所有进度（委托、邮票、解锁），确定吗？')) return;
    clearSave();
    location.hash = 'island';
    location.reload();
  });

  // Touch pad: the same four directions plus "talk", for screens without a keyboard.
  pad.querySelectorAll('[data-dir]').forEach((button) => {
    const dir = button.dataset.dir;
    const down = (e) => { e.preventDefault(); button.setPointerCapture?.(e.pointerId); player && player.press(dir, true); };
    const up = () => player && player.press(dir, false);
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('lostpointercapture', up);
  });
  pad.querySelector('[data-act="talk"]').addEventListener('click', () => player && player.interact());
  const environment = { timeOfDay: 14, weather: 'clear', animate: !reducedMotion, cycle: false };
  window.addEventListener('pagehide', () => { if (player) { const p = player.position; save.position = { x: p.x, z: p.z }; persist(); } });

  const say = (text) => { live.textContent = text; };
  // Portrait phones need the camera further back for the whole globe to fit.
  const portrait = innerWidth / innerHeight < 0.75;

  for (const [id, name] of Object.entries(REGION_NAMES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.region = id;
    button.textContent = name;
    button.addEventListener('click', () => { if (player) player.stopFollowing(); if (planet) planet.enterRegion(id); });
    regionBar.appendChild(button);
  }
  root.querySelector('#to-globe').addEventListener('click', () => planet && planet.overview());
  root.querySelector('#to-postie').addEventListener('click', () => player && player.recenter());
  root.querySelector('#to-island').addEventListener('click', () => {
    if (!planet) return;
    if (planet.getMode() === 'overview') { showWholeIslandOnLanding = true; planet.enterRegion('collaboration'); }
    else { if (player) player.stopFollowing(); planet.mapOverview(); }
  });
  root.querySelector('#turn').addEventListener('click', () => {
    if (planet) { planet.rotateIso(1); say('已旋转大陆视角。'); }
  });

  const environmentUI = window.MarioEnvironmentUI.create({
    parent: root.querySelector('#stage-wrap'),
    reducedMotion,
    onChange: (patch) => {
      Object.assign(environment, patch);
      if (planet) planet.setEnvironment(patch);
      // Waiting errands (time of day, weather) can finish without the postie moving.
      if (errands && player) setTimeout(() => { const p = player.position; errands.update({ x: p.x, z: p.z }); }, 50);
    },
    onCoast: () => planet && planet.openCoast(),
    onAnnounce: say
  });

  function modeChanged(mode) {
    document.documentElement.dataset.worldMode = mode;
    const onIsland = mode === 'map' || mode === 'focus';
    hud.dataset.mode = onIsland ? 'island' : mode;
    loading.hidden = mode !== 'descending';
    if (onIsland && !player) {
      const whole = showWholeIslandOnLanding;
      showWholeIslandOnLanding = false;
      requestAnimationFrame(() => {
        spawnPlayer();
        if (whole && planet) { player && player.stopFollowing(); planet.mapOverview(); }
      });
    } else if (onIsland && showWholeIslandOnLanding) {
      showWholeIslandOnLanding = false;
      requestAnimationFrame(() => planet && planet.mapOverview());
    }
    if (mode === 'descending') loading.textContent = '正在降落到小岛…';
    if (mode === 'overview') {
      regionLabel.textContent = '星球';
      canvas.setAttribute('aria-label', '星球：拖动旋转，点击地域降落到小岛');
    } else if (onIsland) {
      canvas.setAttribute('aria-label', '小岛：拖动平移，滚轮或双指缩放，点击建筑或居民');
    }
  }

  function regionChanged(region) {
    // Once the postie is on the island, "现在在" follows the postie, not the camera.
    if (!region || player) return;
    const name = REGION_NAMES[region.id] || '整座小岛';
    regionLabel.textContent = name;
    regionBar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.region === region.id)));
    say('来到' + name + '。');
  }

  function fail(error) {
    removePlayer();
    if (planet) { planet.destroy(); planet = null; }
    environmentUI.setUnavailable(true);
    loading.hidden = true;
    canvas.hidden = true;
    pins.hidden = true;
    failure.hidden = false;
    failure.querySelector('pre').textContent = `${error.name}: ${error.message}`;
    console.warn('Island Postie: 3D failed to start.', error);
  }

  function start(compatibility = params.get('compat') === '1', restore = null) {
    failure.hidden = true;
    canvas.hidden = false;
    pins.hidden = false;
    loading.hidden = false;
    loading.textContent = '正在搭建星球…';
    try {
      planet = window.MarioPlanet.create(canvas, {
        compatibility,
        quality: restore ? 'smooth' : (params.get('quality') || 'auto'),
        environment,
        onEnvironmentChange: (value) => { if (value) { Object.assign(environment, value); environmentUI.setState(value); } },
        mapView: 'immersive',
        nodes: window.MARIO_NODES,
        pinHost: pins,
        startDistance: portrait ? 7 : 4.6, focusDistance: 3.25, initialPitch: 0.16,
        stars: false, orbits: false, autoRotate: false,
        maxPixelRatio: window.innerWidth <= 680 ? 1.25 : 1.6,
        minDistance: 2.8, maxDistance: portrait ? 7.6 : 6.3, zoom: true, pauseOffscreen: true,
        onSelect: () => {},
        onMapFrame: (dt, time) => (player ? player.frame(dt, time) : false),
        onModeChange: modeChanged,
        onRegionChange: regionChanged,
        // Placeholder until errands exist: places and residents are where they will start.
        onPlaceSelect: (place) => { if (place) say('这里以后会有居民的委托：' + (place.title || place.id) + '。'); },
        onContextState: (status) => {
          loading.hidden = status !== 'lost';
          if (status === 'lost') loading.textContent = '3D 画面暂时中断，正在恢复…';
        },
        onRecoverNeeded: (view) => {
          if (recoveries++ < 1) {
            removePlayer();
            if (planet) { planet.destroy(); planet = null; }
            requestAnimationFrame(() => start(true, view));
          } else {
            const e = new Error('浏览器未能恢复图形上下文。请关闭其他 3D 页面后重试。');
            e.code = 'WEBGL_CONTEXT_RECOVERY_FAILED';
            fail(e);
          }
        },
        onFatalError: fail
      });
      window.__planet = planet;
      environmentUI.setUnavailable(false);
      environmentUI.setState(planet.getEnvironment());
      loading.hidden = true;
      document.documentElement.dataset.webgl = 'ready';
      if (restore) planet.restoreView(restore);
      else {
        const hash = location.hash.slice(1);
        if (REGION_NAMES[hash]) planet.enterRegion(hash);
        else if (hash === 'island') { showWholeIslandOnLanding = true; planet.enterRegion('collaboration'); }
      }
    } catch (error) {
      fail(error);
    }
  }

  failure.querySelector('button').addEventListener('click', () => { recoveries = 0; start(true); });
  document.addEventListener('keydown', (event) => {
    if (!planet) return;
    if (event.key === 'Escape' && !player) {
      if (planet.getMode() !== 'overview') planet.overview();
    } else if ((event.key === 'r' || event.key === 'R') && !event.target.closest('input, select, textarea')) {
      if (planet.getMode() === 'map' || planet.getMode() === 'focus') planet.rotateIso(1);
    }
  });

  requestAnimationFrame(() => requestAnimationFrame(() => start()));
}
