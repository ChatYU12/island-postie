/* Preset errands. Data only for now: the errand runner (step 2 in docs/DESIGN.md)
 * will read this table. Each errand uses something the island already has —
 * a place, a facility, a landmark, the weather or the clock.
 *
 * step types:  deliver(to)  fetch(item, at)  talk(to)  visit(at)  wait(weather|time)
 * giver/to:    a keeper place id, a region's residents ('resident@<region>'), or a named landmark
 * unlock:      what finishing it opens (see UNLOCKS)
 */

export const UNLOCKS = {
  bag:        { name: '邮包',       note: '开局就有，可以装三封信' },
  bicycle:    { name: '自行车',     note: '按住 Shift 骑得更快' },
  ferryPass:  { name: '渡船票',     note: '港口的渡船可以载你过河' },
  bigBag:     { name: '大邮包',     note: '一次能装六封信' },
  lantern:    { name: '蘑菇灯',     note: '夜里也能进巨木蘑菇林' },
  canteen:    { name: '水壶',       note: '可以穿过沙漠' },
  cartPass:   { name: '矿车通行证', note: '坐矿车进出红岩矿谷' },
  scarf:      { name: '围巾',       note: '可以登上雪山' },
  rod:        { name: '鱼竿',       note: '高山湖营地的钓鱼支线' },
  lavaBoots:  { name: '隔热靴',     note: '可以走近熔岩山口' }
};

export const ERRANDS = [
  // ── 城堡与村落（起点）────────────────────────────────────────────
  { id: 'first-day',       region: 'collaboration', giver: 'project-hall',    title: '第一天上岗',
    steps: [{ type: 'visit', at: 'automation-post' }, { type: 'talk', to: 'automation-post' }], reward: { unlock: 'bag' } },
  { id: 'three-letters',   region: 'collaboration', giver: 'automation-post', title: '村里的三封信',
    steps: [{ type: 'deliver', to: 'resident@collaboration' }, { type: 'deliver', to: 'resident@collaboration' }, { type: 'deliver', to: 'project-hall' }], reward: { stamps: 1, unlock: 'bicycle' } },
  { id: 'fountain-stamp',  region: 'collaboration', giver: 'resident@collaboration', title: '喷泉里的邮票',
    steps: [{ type: 'fetch', item: '湿透的邮票', at: 'fountain' }], reward: { stamps: 1 } },
  { id: 'clock-noon',      region: 'collaboration', giver: 'resident@collaboration', title: '正午钟声',
    steps: [{ type: 'wait', time: [11.5, 12.5] }, { type: 'visit', at: 'clock-tower' }], note: '钟楼指针按真实时间走，正午去看会响', reward: { stamps: 1 } },
  { id: 'orange-cat',      region: 'collaboration', giver: 'resident@collaboration', title: '尾巴有点歪的橘猫',
    steps: [{ type: 'fetch', item: '橘猫', at: 'market-stalls' }, { type: 'deliver', to: 'resident@collaboration' }], reward: { stamps: 1 } },
  { id: 'gate-photo',      region: 'collaboration', giver: 'project-hall',    title: '牌坊下的合影',
    steps: [{ type: 'visit', at: 'entrance-gate' }], note: '第一张明信片', reward: { postcard: 'entrance-gate' } },

  // ── 工坊与道路 ────────────────────────────────────────────────
  { id: 'jammed-sorter',   region: 'automation', giver: 'automation-post', title: '卡住的分拣机',
    steps: [{ type: 'fetch', item: '新齿轮', at: 'blacksmith' }, { type: 'deliver', to: 'automation-post' }], reward: { unlock: 'ferryPass' } },
  { id: 'forge-rhythm',    region: 'automation', giver: 'resident@automation', title: '铁匠的节拍',
    steps: [{ type: 'visit', at: 'blacksmith' }, { type: 'wait', time: [6, 18] }], note: '白天铁匠铺按周期落锤，站旁边数到第 10 下', reward: { stamps: 1 } },
  { id: 'water-wheel',     region: 'automation', giver: 'resident@automation', title: '水车转不动了',
    steps: [{ type: 'fetch', item: '木桨叶', at: 'resident@gardens' }, { type: 'visit', at: 'water-wheel' }], reward: { stamps: 1 } },
  { id: 'lost-parcel',     region: 'automation', giver: 'automation-post', title: '掉在路边的包裹',
    steps: [{ type: 'fetch', item: '包裹', at: 'roadside' }, { type: 'deliver', to: 'resident@automation' }], reward: { stamps: 1, unlock: 'bigBag' } },

  // ── 港口与水路 ────────────────────────────────────────────────
  { id: 'lighthouse-wick', region: 'connection', giver: 'data-observatory', title: '备用灯芯',
    steps: [{ type: 'fetch', item: '灯芯', at: 'dock-crane' }, { type: 'deliver', to: 'data-observatory' }, { type: 'wait', time: [19, 23] }], reward: { stamps: 1 } },
  { id: 'crane-cargo',     region: 'connection', giver: 'resident@connection', title: '吊臂上的货箱',
    steps: [{ type: 'visit', at: 'dock-crane' }, { type: 'deliver', to: 'resident@automation' }], reward: { stamps: 1 } },
  { id: 'rain-snails',     region: 'connection', giver: 'resident@connection', title: '下雨天的蜗牛信',
    steps: [{ type: 'wait', weather: 'rain' }, { type: 'fetch', item: '蜗牛信', at: 'riverbank' }, { type: 'deliver', to: 'resident@collaboration' }], note: '只有雨天河边才会出现', reward: { stamps: 2 } },

  // ── 花田风车谷 ────────────────────────────────────────────────
  { id: 'windmill-start',  region: 'gardens', giver: 'resident@gardens', title: '让风车转起来',
    steps: [{ type: 'fetch', item: '风车帆布', at: 'automation-post' }, { type: 'visit', at: 'windmill' }], note: '完成后花田开花（换花田配色）', reward: { stamps: 1, unlock: 'lantern' } },
  { id: 'bouquet',         region: 'gardens', giver: 'resident@gardens', title: '一束给图书管理员的花',
    steps: [{ type: 'fetch', item: '花束', at: 'flower-field' }, { type: 'deliver', to: 'knowledge-library' }], reward: { stamps: 1 } },
  { id: 'cherry-postcard', region: 'gardens', giver: 'resident@gardens', title: '樱花林的明信片',
    steps: [{ type: 'visit', at: 'cherry-grove' }, { type: 'wait', weather: 'clear' }], reward: { postcard: 'cherry-grove' } },

  // ── 巨木蘑菇林 ────────────────────────────────────────────────
  { id: 'glowing-night',   region: 'forest', giver: 'resident@forest', title: '会发光的蘑菇',
    steps: [{ type: 'wait', time: [20, 4] }, { type: 'visit', at: 'mushroom-grove' }], note: '需要蘑菇灯', reward: { stamps: 2 } },
  { id: 'tree-letter',     region: 'forest', giver: 'resident@forest', title: '挂在树上的信',
    steps: [{ type: 'fetch', item: '风吹走的信', at: 'giant-tree' }, { type: 'deliver', to: 'resident@desert' }], reward: { stamps: 1 } },

  // ── 沙漠边境 ──────────────────────────────────────────────────
  { id: 'oasis-water',     region: 'desert', giver: 'service-station', title: '绿洲的水',
    steps: [{ type: 'visit', at: 'oasis' }, { type: 'deliver', to: 'service-station' }], reward: { unlock: 'canteen' } },
  { id: 'pyramid-echo',    region: 'desert', giver: 'resident@desert', title: '金字塔的回声',
    steps: [{ type: 'visit', at: 'pyramid' }], reward: { stamps: 1, postcard: 'pyramid' } },
  { id: 'caravan-mail',    region: 'desert', giver: 'service-station', title: '驼队的回信',
    steps: [{ type: 'deliver', to: 'resident@canyon' }, { type: 'deliver', to: 'service-station' }], reward: { stamps: 1, unlock: 'cartPass' } },

  // ── 红岩矿谷 ──────────────────────────────────────────────────
  { id: 'mine-cart',       region: 'canyon', giver: 'resident@canyon', title: '修好矿车轨道',
    steps: [{ type: 'fetch', item: '道钉', at: 'integration-garage' }, { type: 'visit', at: 'mine-track' }], reward: { stamps: 1 } },
  { id: 'red-rock-sample', region: 'canyon', giver: 'resident@canyon', title: '红岩样本',
    steps: [{ type: 'fetch', item: '红岩样本', at: 'canyon-wall' }, { type: 'deliver', to: 'knowledge-library' }], reward: { stamps: 1, unlock: 'scarf' } },

  // ── 雪山山麓 ──────────────────────────────────────────────────
  { id: 'overdue-books',   region: 'snow', giver: 'knowledge-library', title: '逾期的书',
    steps: [{ type: 'fetch', item: '逾期的书', at: 'resident@gardens' }, { type: 'fetch', item: '逾期的书', at: 'resident@connection' }, { type: 'deliver', to: 'knowledge-library' }], reward: { stamps: 2 } },
  { id: 'first-snow',      region: 'snow', giver: 'resident@snow', title: '第一场雪',
    steps: [{ type: 'wait', weather: 'snow' }, { type: 'visit', at: 'snow-peak' }], note: '积雪会慢慢盖满屋顶', reward: { postcard: 'snow-peak' } },

  // ── 高山湖营地（可选支线）────────────────────────────────────────
  { id: 'old-fish',        region: 'lake', giver: 'resident@lake', title: '湖里的老鱼',
    steps: [{ type: 'fetch', item: '鱼饵', at: 'resident@connection' }, { type: 'visit', at: 'lake-dock' }, { type: 'wait', time: [5, 7] }], reward: { unlock: 'rod', stamps: 2 } },
  { id: 'campfire-story',  region: 'lake', giver: 'resident@lake', title: '营火故事',
    steps: [{ type: 'wait', time: [20, 23] }, { type: 'talk', to: 'resident@lake' }], reward: { stamps: 1 } },

  // ── 熔岩山口（终点）────────────────────────────────────────────
  { id: 'heat-boots',      region: 'lava', giver: 'integration-garage', title: '一双隔热靴',
    steps: [{ type: 'fetch', item: '红岩样本', at: 'canyon-wall' }, { type: 'fetch', item: '羊毛', at: 'resident@snow' }, { type: 'deliver', to: 'integration-garage' }], reward: { unlock: 'lavaBoots' } },
  { id: 'last-letter',     region: 'lava', giver: 'automation-post', title: '寄往火山的信',
    steps: [{ type: 'deliver', to: 'volcano' }], requires: { stamps: 30, unlock: 'lavaBoots' }, note: '结局：信里写着什么，等故事线定了再填', reward: { ending: true } }
];
