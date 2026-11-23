/* Entry point. The world modules are side-effect imports: each registers one
   window.Mario* object, and ES module evaluation order matches the order below,
   which is the dependency order they were written for. */
// world-ui.css holds the carried-over scene controls; game.css comes after it so
// the game's own layout wins where both place the same control.
import './styles/world-ui.css';
import './styles/game.css';

import './world/three-global.js';
import './world/regions.js';
import './world/imported-models.js';
import './world/world-models.js';
import './world/world-geography.js';
import './world/story-world.js';
import './world/connected-map.js';
import './world/world-enrichment.js';
import './world/village-life.js';
import './world/frontier-scenes.js';
import './world/town-facilities.js';
import './world/island-landmarks.js';
import './world/ground-scatter.js';
import './world/render-quality.js';
import './world/map-weather.js';
import './world/world-environment.js';
import './world/planet3d.js';
import './world/environment-ui.js';

import { startGame } from './game.js';

startGame(document.getElementById('game'));
