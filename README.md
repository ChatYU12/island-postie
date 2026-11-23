# 小岛邮差 · Island Postie

一个在浏览器里玩的小岛散步游戏：从星球降落到小岛，帮居民跑腿送信，一片片打开新的地域。

**在线试玩**：https://chatyu12.github.io/island-postie/ （直接打开整座小岛：[#island](https://chatyu12.github.io/island-postie/#island)）

> 现在是第 1 步：降落到小岛后可以操控邮差走路、过桥，靠近居民按 E 对话。委托系统还在做。玩法设计见 [docs/DESIGN.md](docs/DESIGN.md)。

**操作**：WASD 或方向键走路 · Shift 快跑 · E 说话 · R 旋转视角 · 触屏用左下角方向键。

## 开发

```sh
npm install
npm run dev       # http://localhost:5173
npm run build     # 输出到 dist/
npm run preview   # 预览 dist/
```

推送到 `main` 后，GitHub Actions 会构建并发布到 GitHub Pages（`.github/workflows/pages.yml`）。

## 结构

```
index.html            页面骨架：HUD、画布、加载与失败提示
src/main.js           入口：按依赖顺序导入世界模块，然后启动游戏
src/game.js           游戏外壳：启动星球、地域导航、天气、WebGL 恢复，降落后生成邮差
src/game/             邮差模型、WASD 控制器、可行走判定、对话框
src/content/          居民与台词（people.js）、预设委托（errands.js）
src/world/            从 mario-world 迁来的 3D 世界模块（各自注册一个 window.Mario* 对象）
  three-global.js     让旧模块从 npm 的 three r147 拿到全局 THREE
  regions.js          星球上三个主地域的位置和颜色
  planet3d.js         星球 / 小岛双尺度相机、拾取、标签
  connected-map.js    大陆地形、道路、桥
  ……                  模型、地理、环境、居民、设施、地标、地被、降水
src/styles/           game.css（游戏界面）、world-ui.css（迁来的天气卡和指北针）
public/fonts/         Press Start 2P、Geist
docs/DESIGN.md        玩法设计草案
LICENSES/             第三方许可与来源说明
```

## 第三方资源

Three.js r147（MIT）、KayKit Medieval Hexagon Pack 1.0（CC0）、Press Start 2P 与 Geist（SIL OFL）。原始许可和模型来源见 [LICENSES/](LICENSES/)。
