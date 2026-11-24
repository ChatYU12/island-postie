/* Runs the errands in src/content/errands.js against the live island.
 *
 * One errand is active at a time. Steps finish in three ways:
 *   - talking (E) to the right person or place: talk, deliver, fetch from a person/place
 *   - walking close enough: visit, fetch at a landmark, deliver to a landmark
 *   - the world reaching a state: wait (time of day or weather)
 * Regions open as unlocks are earned (REGION_GATES). An errand is offered only
 * when every region it sends you to is already open, so nothing dead-ends.
 */
import { ERRANDS, UNLOCKS } from '../content/errands.js';
import { KEEPERS, nameFor } from '../content/people.js';
import { totalStamps } from './save.js';

export const REGION_GATES = {
  collaboration: null, automation: null,
  connection: 'ferryPass', gardens: 'ferryPass',
  forest: 'lantern', desert: 'lantern',
  canyon: 'canteen',
  snow: 'scarf', lake: 'scarf', lava: 'scarf'
};

export const REGION_NAMES = {
  collaboration: '城堡与村落', automation: '工坊与道路', connection: '港口与水路',
  snow: '雪山山麓', desert: '沙漠边境', lava: '熔岩山口', forest: '巨木蘑菇林',
  gardens: '花田风车谷', canyon: '红岩矿谷', lake: '高山湖营地'
};

const LANDMARK_NAMES = {
  fountain: '广场喷泉', 'clock-tower': '钟楼', blacksmith: '铁匠铺', 'water-wheel': '水车', windmill: '风车',
  'dock-crane': '码头吊臂', 'market-stalls': '集市摊位', 'entrance-gate': '入口牌坊', roadside: '路边',
  riverbank: '河岸', 'flower-field': '花田', 'cherry-grove': '樱花林', 'mushroom-grove': '发光蘑菇丛',
  'giant-tree': '巨木', oasis: '绿洲', pyramid: '金字塔', 'mine-track': '矿车轨道', 'canyon-wall': '红岩崖壁',
  'snow-peak': '雪山观景点', 'lake-dock': '湖边栈桥', volcano: '火山口'
};
const WEATHER_NAMES = { clear: '晴天', cloudy: '阴天', rain: '下雨', snow: '下雪' };
const NEAR = { visit: 3.2, landmark: 2.8 };

const hash = (text) => { let h = 7; for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const inHours = (t, [a, b]) => (a <= b ? t >= a && t < b : t >= a || t < b);
const hh = (t) => `${Math.floor(t)}:${String(Math.round((t % 1) * 60)).padStart(2, '0')}`;

export function createErrands({ save, targets, environment, onChange, onToast }) {
  const byId = new Map(ERRANDS.map((e) => [e.id, e]));

  const has = (unlock) => save.unlocks.includes(unlock);
  const regionOpen = (region) => !REGION_GATES[region] || has(REGION_GATES[region]);

  function targetRegion(name, errand) {
    if (KEEPERS[name]) return KEEPERS[name].region;
    if (name.startsWith('resident@')) return name.slice(9);
    return errand.region;
  }
  function errandRegions(errand) {
    const set = new Set([errand.region, targetRegion(errand.giver, errand)]);
    for (const s of errand.steps) if (s.to || s.at) set.add(targetRegion(s.to || s.at, errand));
    return [...set];
  }
  function requirementsMet(errand) {
    const r = errand.requires || {};
    if (r.stamps && totalStamps(save) < r.stamps) return false;
    if (r.unlock && !has(r.unlock)) return false;
    return errandRegions(errand).every(regionOpen);
  }
  /** Errands in table order that can be offered now. */
  function available() {
    return ERRANDS.filter((e) => !save.completed.includes(e.id) && requirementsMet(e)
      && !(save.active && save.active.id === e.id));
  }

  /** Does `who` (a nearby target from the controller) give `errand`? */
  function gives(errand, who) {
    if (who.kind === 'place') return errand.giver === who.id;
    if (who.kind === 'resident' && errand.giver.startsWith('resident@')) {
      const region = targets.regionAt(who.x, who.z);
      return region && region.id === errand.giver.slice(9);
    }
    return false;
  }

  // ── active errand ──────────────────────────────────────────────────
  function active() { return save.active ? byId.get(save.active.id) : null; }
  function currentStep() { const e = active(); return e ? e.steps[save.active.step] : null; }

  function currentTarget() {
    const e = active(), step = currentStep();
    if (!e || !step || step.type === 'wait') return null;
    const i = save.active.step;
    if (!save.active.targets[i]) {
      const used = Object.values(save.active.targets).filter((t) => t && t.kind === 'resident').map((t) => t.id);
      save.active.targets[i] = targets.resolve(step.to || step.at, e.region, hash(e.id + i), used);
    }
    return save.active.targets[i];
  }

  function targetName(target) {
    if (!target) return '';
    if (target.kind === 'place') return (KEEPERS[target.id] && `${KEEPERS[target.id].name}（${KEEPERS[target.id].place}）`) || target.id;
    if (target.kind === 'resident') return `${nameFor(target)}（${REGION_NAMES[target.region] || '岛上'}）`;
    return LANDMARK_NAMES[target.id] || target.id;
  }

  /** Line shown in the tracker for the current step. */
  function describe() {
    const e = active(), step = currentStep();
    if (!e || !step) return null;
    const t = currentTarget(), name = targetName(t);
    let text;
    switch (step.type) {
      case 'deliver': text = `把信送给 ${name}`; break;
      case 'fetch': text = `去 ${name} 拿「${step.item}」`; break;
      case 'talk': text = `和 ${name} 聊聊`; break;
      case 'visit': text = `去 ${name}`; break;
      case 'wait':
        text = step.weather ? `等一场${WEATHER_NAMES[step.weather] || step.weather}（可以在「光照与天气」里换天气）`
          : `等到 ${hh(step.time[0])}–${hh(step.time[1])}（可以在「光照与天气」里调时间）`;
        break;
      default: text = step.type;
    }
    return { title: e.title, step: save.active.step + 1, steps: e.steps.length, text, note: e.note || '' };
  }

  function start(errand) {
    save.active = { id: errand.id, step: 0, targets: {} };
    currentTarget();
    onChange();
  }

  function finishStep(line) {
    const e = active();
    save.active.step++;
    if (save.active.step >= e.steps.length) {
      const reward = e.reward || {};
      save.completed.push(e.id);
      save.active = null;
      const parts = [];
      if (reward.stamps) { save.errandStamps += reward.stamps; parts.push(`邮票 ×${reward.stamps}`); }
      if (reward.unlock && !has(reward.unlock)) { save.unlocks.push(reward.unlock); parts.push(`「${UNLOCKS[reward.unlock].name}」：${UNLOCKS[reward.unlock].note}`); }
      if (reward.postcard && !save.postcards.includes(reward.postcard)) { save.postcards.push(reward.postcard); parts.push('一张明信片'); }
      const opened = Object.keys(REGION_GATES).filter((r) => REGION_GATES[r] === reward.unlock).map((r) => REGION_NAMES[r]);
      if (opened.length) parts.push(`现在可以去 ${opened.join('、')} 了`);
      onToast(`完成「${e.title}」${parts.length ? '：' + parts.join('；') : ''}`);
      if (reward.ending) onToast('寄往火山的信送到了。谢谢你，小岛邮差！');
    } else {
      currentTarget();
      if (line) onToast(line);
    }
    onChange();
  }

  /** Same person/place/landmark? Residents and places compare by id. */
  const sameTarget = (a, b) => a && b && a.kind === b.kind && String(a.id) === String(b.id);

  /**
   * The postie pressed E next to `who`. Returns a dialogue line for the errand, or
   * null to fall back to the ordinary greeting.
   */
  function talkTo(who, speaker) {
    const step = currentStep(), target = currentTarget();
    if (step && target && sameTarget(target, who) && ['talk', 'deliver', 'fetch'].includes(step.type)) {
      const text = step.type === 'deliver' ? '是给我的信？太好了，我等了好久！'
        : step.type === 'fetch' ? `「${step.item}」？在这儿，拿去吧。`
        : '你来啦，正等你呢！';
      finishStep(step.type === 'fetch' ? `拿到了「${step.item}」` : null);
      const next = describe();
      if (next) return { speaker, text: `${text}\n\n下一步：${next.text}` };
      // Errand done: if the same person has the next job, offer it in the same breath.
      const follow = available().find((e) => gives(e, who));
      if (follow) {
        start(follow);
        return { speaker, text: `${text}\n\n对了，还有件事——「${follow.title}」\n${describe().text}${follow.note ? `\n（${follow.note}）` : ''}` };
      }
      return { speaker, text };
    }
    if (!save.active) {
      const offer = available().find((e) => gives(e, who));
      if (offer) {
        start(offer);
        return { speaker, text: `能帮我个忙吗？「${offer.title}」\n\n${describe().text}${offer.note ? `\n（${offer.note}）` : ''}` };
      }
    }
    return null;
  }

  /** Called every moving frame with the postie's position. */
  function update(pos) {
    const step = currentStep();
    if (!step) return;
    if (step.type === 'wait') {
      const env = environment();
      if (!env) return;
      if ((step.weather && env.weather === step.weather) || (step.time && inHours(env.timeOfDay, step.time))) finishStep('时机到了！');
      return;
    }
    const target = currentTarget();
    if (!target || target.kind === 'resident') return;
    const p = targets.positionOf(target);
    if (!p) return;
    const reach = target.kind === 'place' ? 4.2 : step.type === 'visit' ? NEAR.visit : NEAR.landmark;
    if (target.kind === 'place' && step.type !== 'visit') return;
    if (Math.hypot(p.x - pos.x, p.z - pos.z) < reach) {
      finishStep(step.type === 'fetch' ? `拿到了「${step.item}」` : step.type === 'deliver' ? '送到了！' : `到了${targetName(target)}`);
    }
  }

  /** Where the arrow should point: { x, z } or null. */
  function pointer() {
    const t = currentTarget();
    return t ? targets.positionOf(t) : null;
  }

  /** Short hint when idle: who has work for you next. */
  function idleHint() {
    if (save.active) return null;
    const next = available()[0];
    if (!next) return null;
    const giver = next.giver.startsWith('resident@') ? `${REGION_NAMES[next.giver.slice(9)]}的居民` : `${KEEPERS[next.giver].name}（${KEEPERS[next.giver].place}）`;
    return `${giver} 好像有事想请你帮忙`;
  }

  function ensureStarted() {
    if (!save.active && !save.completed.length) start(byId.get('first-day'));
  }

  return { describe, talkTo, update, pointer, idleHint, regionOpen, ensureStarted, has, currentTarget };
}
