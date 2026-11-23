/* The three home regions that carry a pin on the globe. planet3d.js reads
   window.MARIO_NODES for their id, name, colour and globe position; the other seven
   regions come from world-geography.js. (The global keeps its original name so the
   world modules work unchanged.) */
window.MARIO_NODES = [
  { id: 'collaboration', kind: 'region', name: '城堡与村落', short: '城堡与村落', lv: '城堡与村落', color: '#d66d88', lat: 35, lon: 90 },
  { id: 'automation', kind: 'region', name: '工坊与道路', short: '工坊与道路', lv: '工坊与道路', color: '#b77a25', lat: 13, lon: 116 },
  { id: 'connection', kind: 'region', name: '港口与水路', short: '港口与水路', lv: '港口与水路', color: '#277d97', lat: -12, lon: 86 }
];
