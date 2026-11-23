/* Who lives where, and what they say before any errand system exists.
 * The six named keepers own the six places; the ~40 walking residents get a
 * stable name and line from their id so the same person always says the same thing.
 */

export const KEEPERS = {
  'project-hall':       { name: '栗栗', place: '村公所',   region: 'collaboration', role: '村长助理', hello: '新来的邮差？太好了！村里攒了一堆信没人送。先去邮局找豆豆领邮包吧。' },
  'automation-post':    { name: '豆豆', place: '小岛邮局', region: 'automation',    role: '邮局局长', hello: '欢迎上岗！邮包在这儿。分拣机最近老卡壳……先把村里这三封信送了，回来我再教你修它。' },
  'data-observatory':   { name: '澄澄', place: '港口灯塔', region: 'connection',    role: '灯塔看守', hello: '夜里灯塔不亮，渡船就不敢开。要是你能帮我找到备用灯芯……' },
  'service-station':    { name: '阿杏', place: '沙漠驿站', region: 'desert',        role: '驿站老板', hello: '穿过沙漠的旅人都会在我这儿歇脚。带水了吗？没带可别往绿洲那边走。' },
  'knowledge-library':  { name: '绵绵', place: '雪山图书馆', region: 'snow',         role: '图书管理员', hello: '嘘——这里很安静。有几本书逾期好久了，借书的人散在岛上各处。' },
  'integration-garage': { name: '阿栓', place: '熔岩维修铺', region: 'lava',         role: '修理匠',   hello: '火山脚下热得很，但修东西就得趁热。你那辆自行车，链条是不是该上油了？' }
};

const NAMES = ['小麦', '阿豆', '桃桃', '石头', '芽芽', '阿晴', '米粒', '团子', '小柚', '阿松', '贝贝', '可可', '阿福', '圆圆', '小蓝', '阿竹',
  '果冻', '小满', '阿禾', '朵朵', '阿岩', '糖糖', '小鹿', '阿川', '泡泡', '小舟', '阿树', '甜甜', '小雨', '阿星', '饺子', '小葵',
  '阿渔', '豆芽', '小溪', '阿莓', '布丁', '小岚', '阿麦', '栗子', '小雪', '阿橙', '暖暖', '小石'];

const LINES = [
  '今天的风有点咸，港口那边是不是又有船进来了？',
  '你就是新来的邮差呀！我等一封信等了好久。',
  '风车谷的花开了吗？我还没去看过。',
  '听说雪山上的图书馆，晚上会亮一盏小灯。',
  '下雨天的时候，河边会冒出好多蜗牛。',
  '矿谷的矿车好久没动了，大家都说是轨道坏了。',
  '要是迷路了，就朝钟楼走，总能回到村里。',
  '你看见我家的猫了吗？橘色的，尾巴有点歪。',
  '铁匠铺的锤子一响，我就知道该吃午饭了。',
  '蘑菇林里晚上会发光，可我一个人不敢去。',
  '喷泉里好像有人掉了一枚邮票，闪闪的。',
  '高山湖营地的人说，湖里住着一条很老的大鱼。'
];

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Speaker and line for whatever the postie is standing next to. */
export function greetingFor(target) {
  if (target.kind === 'place') {
    const keeper = KEEPERS[target.id];
    if (keeper) return { speaker: keeper.name, title: `${keeper.place} · ${keeper.role}`, text: keeper.hello };
    return { speaker: target.npcName || '居民', title: target.title || '', text: '你好呀，邮差！' };
  }
  const h = hash(String(target.id));
  return { speaker: NAMES[h % NAMES.length], title: '居民', text: LINES[(h >>> 8) % LINES.length] };
}

/** Short name for the "press E" prompt. */
export function nameFor(target) {
  if (target.kind === 'place') return (KEEPERS[target.id] && KEEPERS[target.id].place) || target.title || '这里';
  return NAMES[hash(String(target.id)) % NAMES.length];
}
