/* WASD / arrow-key movement for the postie on the isometric island.
 *
 * Directions are relative to the screen: W walks "up the screen", whichever way
 * the island is turned (R flips it 180°). Movement runs inside planet3d's frame
 * loop through the onMapFrame hook, so the renderer stays on-demand: it only
 * draws while a key is held or the camera is still catching up.
 */
import { createPostie } from './postie.js';
import { createWalkable } from './walkable.js';

const WALK = 5.2;     // units per second
const RUN = 8.5;      // with Shift
const TURN = 12;      // facing easing rate
const KEYS = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right'
};

export function createController({ planet, spawnPlaceId = 'automation-post', onNearby, onInteract }) {
  const ctx = planet.getMapContext();
  const walk = createWalkable(ctx);
  const postie = createPostie(1.05);
  ctx.group.add(postie.root);

  const held = new Set();
  let run = false;
  let speed = 0;
  let facing = 0;
  let follow = true;
  let frozen = false;
  let nearby = null;

  // Start a few steps in front of the post office.
  const office = ctx.places.find((p) => p.id === spawnPlaceId) || ctx.places[0];
  const origin = office ? office.position : { x: 0, z: -10 };
  const start = walk.nearestStandable(origin.x + 2.5, origin.z + 3) || walk.nearestStandable(0, -10, 30);
  const pos = { x: start.x, y: walk.standHeight(start.x, start.z), z: start.z };
  place();
  planet.follow(pos.x, pos.y + 0.9, pos.z, true);
  planet.setMapZoom(6);

  function place() {
    postie.root.position.set(pos.x, pos.y, pos.z);
    postie.root.rotation.y = facing;
    postie.root.updateMatrixWorld(true);
  }

  function typing(target) {
    return target && target.closest && target.closest('input, select, textarea, [contenteditable="true"]');
  }
  function keydown(event) {
    if (frozen || typing(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Shift') run = true;
    const dir = KEYS[event.code];
    if (dir) {
      event.preventDefault();
      held.add(dir);
      follow = true;
      planet.requestFrame();
    } else if (event.code === 'KeyE' || event.code === 'Space' || event.code === 'Enter') {
      const target = nearby || nearest();
      if (target && onInteract) { event.preventDefault(); onInteract(target); }
    }
  }
  function keyup(event) {
    if (event.key === 'Shift') run = false;
    const dir = KEYS[event.code];
    if (dir) held.delete(dir);
  }
  function blur() { held.clear(); run = false; }
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  window.addEventListener('blur', blur);

  function nearest() {
    let best = null, bestD = 2.4;
    for (const r of ctx.residents()) {
      if (!r || !isFinite(r.x)) continue;
      const d = Math.hypot(r.x - pos.x, r.z - pos.z);
      if (d < bestD) { best = { kind: 'resident', id: r.id, placeId: r.placeId, x: r.x, z: r.z }; bestD = d; }
    }
    for (const p of ctx.places) {
      const d = Math.hypot(p.position.x - pos.x, p.position.z - pos.z) - 1.6;
      if (d < bestD) { best = { kind: 'place', id: p.id, title: p.title, npcName: p.npcName, x: p.position.x, z: p.position.z }; bestD = d; }
    }
    return best;
  }

  /** Called by planet3d every island frame. Returns true while it needs more frames. */
  function frame(dt) {
    let ix = 0, iz = 0;
    if (!frozen) {
      if (held.has('up')) iz += 1;
      if (held.has('down')) iz -= 1;
      if (held.has('right')) ix += 1;
      if (held.has('left')) ix -= 1;
    }
    const len = Math.hypot(ix, iz);
    const target = len ? (run ? RUN : WALK) : 0;
    speed += (target - speed) * (1 - Math.exp(-dt * 10));

    let moved = false;
    if (len) {
      const basis = planet.getIsoBasis();
      const mx = (basis.forward.x * iz + basis.right.x * ix) / len;
      const mz = (basis.forward.z * iz + basis.right.z * ix) / len;
      const tryMove = (dx, dz) => {
        const y = walk.step(pos.y, pos.x + dx, pos.z + dz, Math.hypot(dx, dz));
        if (y === null) return false;
        pos.x += dx; pos.z += dz; pos.y = y;
        return true;
      };
      // Slow frames (dt up to 0.25 s) are split into short sub-steps so the walker
      // keeps real-time speed without tunnelling through thin obstacles.
      const subSteps = Math.max(1, Math.ceil((speed * dt) / 0.3));
      const stepLen = (speed * dt) / subSteps;
      for (let i = 0; i < subSteps; i++) {
        // Full step, else slide along whichever axis still works.
        const ok = tryMove(mx * stepLen, mz * stepLen) || tryMove(mx * stepLen, 0) || tryMove(0, mz * stepLen);
        moved = moved || ok;
        if (!ok) break;
      }
      const want = Math.atan2(mx, mz);
      let delta = want - facing;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      facing += delta * (1 - Math.exp(-dt * TURN));
    }
    postie.animate(dt, moved ? speed : 0);
    place();
    if (follow && (moved || len)) planet.follow(pos.x, pos.y + 0.9, pos.z);

    const near = nearest();
    if ((near && near.id) !== (nearby && nearby.id)) {
      nearby = near;
      if (onNearby) onNearby(nearby);
    }
    // Keep drawing while walking and for a moment after, so the legs settle.
    return len > 0 || speed > 0.05;
  }

  // Show the prompt for whoever is already beside the spawn point.
  queueMicrotask(() => { nearby = nearest(); if (nearby && onNearby) onNearby(nearby); });

  return {
    frame,
    /** On-screen pad: hold a direction (true) or release it (false). */
    press(dir, down) {
      if (frozen && down) return;
      if (down) { held.add(dir); follow = true; planet.requestFrame(); } else held.delete(dir);
    },
    interact() { const target = nearby || nearest(); if (!frozen && target && onInteract) onInteract(target); },
    get position() { return { ...pos }; },
    setFrozen(value) { frozen = !!value; if (frozen) held.clear(); },
    stopFollowing() { follow = false; },
    recenter() { follow = true; planet.follow(pos.x, pos.y + 0.9, pos.z); planet.setMapZoom(6); },
    destroy() {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      postie.root.removeFromParent();
    }
  };
}
