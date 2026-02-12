# Third‑Party Notices / 第三方鸣谢与声明

本项目（WB的3D容器 / wbs_simple3D）在运行时会动态加载若干第三方库与资源（主要来自 CDN）。这些第三方项目的版权与许可证归其原作者所有。

本清单依据发布文件 [wbs_simple3D.js](wbs_simple3D.js) 中出现的外链资源整理，方便开源发布时做合规与鸣谢。

## 运行时依赖（通过 CDN 加载）

### three.js（r128 / 0.128.0）
- 用途：WebGL 3D 渲染引擎
- 许可证：MIT License（以 three.js 仓库 LICENSE 为准）
- 上游项目：mrdoob/three.js
- 加载来源（多源兜底）：
  - https://unpkg.com/three@0.128.0/build/three.min.js
  - https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js

### three.js examples（与 three.js 同版本）
- 用途：模型加载器、控制器、后期处理、天空/反射/水面等功能模块
- 许可证：通常与 three.js 一致（以 three.js 仓库 LICENSE 为准）
- 相关模块与加载来源（节选，详见代码中的 URL 列表）：
  - GLTFLoader.js
    - https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js
  - OBJLoader.js
    - https://unpkg.com/three@0.128.0/examples/js/loaders/OBJLoader.js
  - OrbitControls.js
    - https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js
    - https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js
  - EffectComposer.js / RenderPass.js / ShaderPass.js / UnrealBloomPass.js
    - https://unpkg.com/three@0.128.0/examples/js/postprocessing/EffectComposer.js
    - https://unpkg.com/three@0.128.0/examples/js/postprocessing/RenderPass.js
    - https://unpkg.com/three@0.128.0/examples/js/postprocessing/ShaderPass.js
    - https://unpkg.com/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js
  - Sky.js
    - https://unpkg.com/three@0.128.0/examples/js/objects/Sky.js
    - https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/objects/Sky.js
    - https://threejs.org/examples/js/objects/Sky.js
  - ReflectorForSSRPass.js
    - https://unpkg.com/three@0.128.0/examples/js/objects/ReflectorForSSRPass.js
    - https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/objects/ReflectorForSSRPass.js
  - Water.js
    - https://unpkg.com/three@0.128.0/examples/js/objects/Water.js

### three.js examples 资源：waternormals.jpg
- 用途：Water.js 的水面法线贴图示例资源
- 来源：
  - https://threejs.org/examples/textures/waternormals.jpg
- 许可证/归属：该资源来自 three.js examples（以 three.js 仓库中对 examples 资源的版权/许可说明为准）

### cannon-es（0.20.0）
- 用途：3D 物理引擎
- 许可证：MIT License（以 cannon-es 仓库 LICENSE 为准）
- 上游项目：pmndrs/cannon-es
- 加载来源：
  - https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js

## 示例项目附带的 TurboWarp 官方扩展

### Pointerlock（ID: pointerlock）
- 用途：鼠标锁定（Pointer Lock）相关积木；锁定时 Mouse X/Y 报告每帧增量；替代旧 pointerlock experiment
- 上游：TurboWarp 官方扩展（Extension Gallery）
- 许可证：MIT AND MPL-2.0（未修改，按原项目声明）
- 加载来源：
  - https://extensions.turbowarp.org/pointerlock.js

## CDN 鸣谢
本项目通过以下站点分发/托管第三方依赖文件（它们提供的是“分发服务”，不等同于许可证主体）：
- unpkg.com
- cdnjs.cloudflare.com
- cdn.jsdelivr.net
- threejs.org

## 合规提示（建议）
- 若仅在运行时从第三方 CDN 加载依赖：建议在 README/Notices 中保留本清单，便于用户了解依赖来源与许可证。
- 若你计划把第三方库或资源打包进你的发行物（离线版/内网版/二次分发）：通常需要随发行物一并提供第三方许可证文本与版权声明，并在本清单中记录来源与版本。
- 上述许可证信息请以各上游仓库的 LICENSE 文件为最终依据。
