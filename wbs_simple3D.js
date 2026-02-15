// by 炒鸡无敌老王八 
// 在turbowarp中非常方便地创建精美的3D作品
// 许可证:MPLv2

class LibraryManager {
    constructor() {
        this.loadedLibraries = new Set();
        this.loadingPromises = new Map();
        this.isInitialized = false;
        this.loadTimeout = 30000; 
        this.progressBar = null;
        this.totalLibraries = 0;
        this.loadedCount = 0;
    }
    createProgressBar() {
        if (this.progressBar) return;
        const progressContainer = document.createElement('div');
        progressContainer.id = 'library-loading-progress';
        progressContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 0px;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            min-width: 300px;
        `;
        const title = document.createElement('div');
        title.textContent = '加载依赖...';
        title.style.cssText = `
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: bold;
        `;
        const progressBg = document.createElement('div');
        progressBg.style.cssText = `
            width: 100%;
            height: 20px;
            background: #333;
            border-radius: 0px;
            overflow: hidden;
            margin-bottom: 10px;
        `;
        const progressFill = document.createElement('div');
        progressFill.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #ffffffff, #ffffffff);
            border-radius: 0px;
            transition: width 0.3s ease;
        `;
        const progressText = document.createElement('div');
        progressText.style.cssText = `
            font-size: 14px;
            color: #ccc;
        `;
        progressBg.appendChild(progressFill);
        progressContainer.appendChild(title);
        progressContainer.appendChild(progressBg);
        progressContainer.appendChild(progressText);
        document.body.appendChild(progressContainer);
        this.progressBar = {
            container: progressContainer,
            fill: progressFill,
            text: progressText,
            title: title
        };
    }
    updateProgress(current, total, currentLibrary = '') {
        if (!this.progressBar) return;
        const percentage = Math.round((current / total) * 100);
        this.progressBar.fill.style.width = `${percentage}%`;
        this.progressBar.text.textContent = `${current}/${total} (${percentage}%)`;
        if (currentLibrary) {
            this.progressBar.title.textContent = `正在加载: ${currentLibrary}`;
        }
    }
    hideProgressBar() {
        if (this.progressBar) {
            this.progressBar.container.remove();
            this.progressBar = null;
        }
    }
    getLibraryConfig() {
        return [
            {
                name: 'THREE',
                check: () => window.THREE,
                urls: [
                    'https://unpkg.com/three@0.128.0/build/three.min.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
                ]
            },
            {
                name: 'CANNON',
                check: () => window.CANNON,
                module: true,
                urls: [
                    'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js'
                ]
            },
            {
                name: 'GLTFLoader',
                check: () => window.THREE && window.THREE.GLTFLoader,
                urls: [
                    'https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js',
                ],
                dependencies: ['THREE']
            },
            {
                name: 'OBJLoader',
                check: () => window.THREE && window.THREE.OBJLoader,
                urls: [
                    'https://unpkg.com/three@0.128.0/examples/js/loaders/OBJLoader.js',
                ],
                dependencies: ['THREE']
            },
            {
                name: 'OrbitControls',
                check: () => window.THREE && window.THREE.OrbitControls,
                urls: [
                    'https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js',
                    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'
                ],
                dependencies: ['THREE']
            },
            {
                name: 'EffectComposer',
                check: () => window.THREE && window.THREE.EffectComposer,
                urls: [
                    'https://unpkg.com/three@0.128.0/examples/js/postprocessing/EffectComposer.js'
                ],
                dependencies: ['THREE']
            },
            {
                name: 'RenderPass',
                check: () => window.THREE && window.THREE.RenderPass,
                urls: [
                    'https://unpkg.com/three@0.128.0/examples/js/postprocessing/RenderPass.js'
                ],
                dependencies: ['THREE', 'EffectComposer']
            },
            {
                name: 'ShaderPass',
                check: () => window.THREE && window.THREE.ShaderPass,
                urls: [
                    'https://unpkg.com/three@0.128.0/examples/js/postprocessing/ShaderPass.js'
                ],
                dependencies: ['THREE', 'EffectComposer']
            },
            {
                name: 'UnrealBloomPass',
                check: () => window.THREE && window.THREE.UnrealBloomPass,
                urls: [
                    'https://unpkg.com/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js'
                ],
                dependencies: ['THREE', 'EffectComposer', 'ShaderPass']
            },
            {
                name: 'Sky',
                check: () => window.THREE && window.THREE.Sky,
                urls: [
                    'https://unpkg.com/three@0.128.0/examples/js/objects/Sky.js',
                    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/objects/Sky.js',
                    'https://threejs.org/examples/js/objects/Sky.js'
                ],
                dependencies: ['THREE']
            },
            {
                name: 'ReflectorForSSRPass',
                check: () => window.THREE && window.THREE.ReflectorForSSRPass,
                urls: [
                    'https://unpkg.com/three@0.128.0/examples/js/objects/ReflectorForSSRPass.js',
                    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/objects/ReflectorForSSRPass.js'
                ],
                dependencies: ['THREE']
            }
        ];
    }
    async loadLibrary(config) {
        if (this.loadedLibraries.has(config.name)) {
            return true;
        }
        if (this.loadingPromises.has(config.name)) {
            return await this.loadingPromises.get(config.name);
        }
        if (config.check()) {
            this.loadedLibraries.add(config.name);
            return true;
        }
        const loadPromise = this._loadFromUrls(config);
        this.loadingPromises.set(config.name, loadPromise);
        try {
            await loadPromise;
            this.loadedLibraries.add(config.name);
            this.loadingPromises.delete(config.name);
            console.log(`✅ ${config.name} 加载成功`);
            return true;
        } catch (error) {
            this.loadingPromises.delete(config.name);
            console.error(`❌ ${config.name} 加载失败:`, error);
            throw error;
        }
    }
    async _loadFromUrls(config) {
        for (let i = 0; i < config.urls.length; i++) {
            try {
                if (config.module) {
                    await this._loadModule(config.urls[i], config.name);
                } else {
                    await this._loadScript(config.urls[i]);
                }
                await this._waitForLibrary(config.check, 5000);
                return;
            } catch (error) {
                console.warn(`${config.name} 从 ${config.urls[i]} 加载失败，尝试下一个源...`);
                if (i === config.urls.length - 1) {
                    throw new Error(`所有 ${config.name} CDN 源都加载失败`);
                }
            }
        }
    }
    _loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onerror = () => reject(new Error(`脚本加载失败: ${url}`));
            const timeout = setTimeout(() => {
                script.remove();
                reject(new Error(`脚本加载超时: ${url}`));
            }, this.loadTimeout);
            script.onload = () => {
                clearTimeout(timeout);
                resolve();
            };
            document.head.appendChild(script);
        });
    }
    _loadModule(url, globalName) {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`模块加载超时: ${url}`));
            }, this.loadTimeout);
            try {
                const mod = await import( url);
                window[globalName] = mod;
                clearTimeout(timeout);
                resolve();
            } catch (error) {
                clearTimeout(timeout);
                console.warn(`动态 import 失败，尝试使用 <script type="module"> 方式加载: ${url}`);
                try {
                    const code = `import * as Module from '${url}'; window['${globalName}'] = Module;`;
                    const blob = new Blob([code], { type: 'text/javascript' });
                    const blobUrl = URL.createObjectURL(blob);
                    const script = document.createElement('script');
                    script.type = 'module';
                    script.src = blobUrl;
                    script.onload = () => {
                        URL.revokeObjectURL(blobUrl);
                        resolve();
                    };
                    script.onerror = () => {
                        URL.revokeObjectURL(blobUrl);
                        reject(new Error(`模块脚本加载失败: ${url}`));
                    };
                    document.head.appendChild(script);
                } catch (e2) {
                    reject(e2);
                }
            }
        });
    }
    _waitForLibrary(checkFn, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const check = () => {
                if (checkFn()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('库初始化超时'));
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        });
    }
    async initializeAll() {
        if (this.isInitialized) {
            return true;
        }
        console.log('🚀 开始加载 3D 库...');
        const libraries = this.getLibraryConfig();
        this.createProgressBar();
        this.totalLibraries = libraries.length;
        this.loadedCount = 0;
        this.updateProgress(0, this.totalLibraries);
        try {
            for (const config of libraries) {
                this.updateProgress(this.loadedCount, this.totalLibraries, config.name);
                if (config.dependencies) {
                    for (const dep of config.dependencies) {
                        const depConfig = libraries.find(lib => lib.name === dep);
                        if (depConfig && !this.loadedLibraries.has(dep)) {
                            await this.loadLibrary(depConfig);
                        }
                    }
                }
                await this.loadLibrary(config);
                this.loadedCount++;
                this.updateProgress(this.loadedCount, this.totalLibraries, config.name);
            }
            this.isInitialized = true;
            this.updateProgress(this.totalLibraries, this.totalLibraries, '加载完成！');
            setTimeout(() => {
                this.hideProgressBar();
            }, 1000);
            console.log('🎉 所有 3D 库加载完成！');
            return true;
        } catch (error) {
            this.hideProgressBar();
            console.error('💥 库加载失败:', error);
            throw error;
        }
    }
    isAllLoaded() {
        const libraries = this.getLibraryConfig();
        return this.isInitialized && libraries.every(config => config.check());
    }
    async waitForAll() {
        if (this.isAllLoaded()) {
            return true;
        }
        if (!this.isInitialized) {
            await this.initializeAll();
        } else {
            while (!this.isAllLoaded()) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        return this.isAllLoaded();
    }
}
const libraryManager = new LibraryManager();
class ThreeDContainerExtension {
    constructor() {
        this.containers = new Map();
        this.textureCache = new Map();
        this.propertyCallbacks = new Map();
        this.physicsWorlds = new Map();
        this.sceneManagers = new Map();
        this.renderLoopId = null;
        this.librariesLoaded = false;
        this.needsRender = false;
        this.canvasDirty = false;
        window.threeDExtensionInstance = this;
        this.vm = Scratch.vm;
        this.renderer = this.vm.renderer;
        this.runtime = this.vm.runtime;
        this.drawableId = null;
        this.skinId = null;
        this.isRendererIntegrated = false;
        if (libraryManager.isAllLoaded()) {
            if (this.checkWebGLSupport()) {
                this.librariesLoaded = true;
                this.integrateWithScratchRenderer();
                this.startRenderLoop();
                console.log('3D容器扩展初始化完成');
            } else {
                console.error('WebGL 不受支持，3D 功能将不可用');
                this.showWebGLError();
            }
        } else {
            console.log('等待 3D 库加载...');
            this.initializeLibraries().catch(error => {
                console.error('库初始化失败:', error);
            });
        }
    }
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                console.error('WebGL 上下文创建失败');
                return false;
            }
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                console.log('WebGL 渲染器:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
                console.log('WebGL 供应商:', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
            }
            return true;
        } catch (error) {
            console.error('WebGL 支持检测失败:', error);
            return false;
        }
    }
    showWebGLError() {
        console.warn('=== WebGL 支持检测失败 ===');
        console.warn('可能的原因：');
        console.warn('1. 浏览器不支持 WebGL');
        console.warn('2. WebGL 被禁用');
        console.warn('3. 显卡驱动程序过旧');
        console.warn('4. 硬件加速被禁用');
        console.warn('请尝试：');
        console.warn('- 更新浏览器到最新版本');
        console.warn('- 启用硬件加速');
        console.warn('- 更新显卡驱动程序');
    }
    async initializeLibraries() {
        try {
            await libraryManager.initializeAll();
            if (this.checkWebGLSupport()) {
                this.librariesLoaded = true;
                console.log('🎉 3D扩展初始化完成！');
                this.integrateWithScratchRenderer();
                this.startRenderLoop();
            } else {
                console.error('WebGL 不受支持，3D 功能将不可用');
                this.showWebGLError();
                throw new Error('WebGL 不受支持');
            }
        } catch (error) {
            console.error('💥 3D扩展初始化失败:', error);
            throw error;
        }
    }
    async waitForLibraries() {
        try {
            await libraryManager.waitForAll();
            this.librariesLoaded = true;
            return true;
        } catch (error) {
            console.error('等待库加载失败:', error);
            throw error;
        }
    }
    integrateWithScratchRenderer() {
        if (this.isRendererIntegrated) return;
        try {
            let videoIndex = this.renderer._groupOrdering.indexOf("video");
            if (videoIndex === -1) videoIndex = this.renderer._groupOrdering.length - 1;
            if (!this.renderer._layerGroups["three3d"]) {
                const videoOffset = this.renderer._layerGroups["video"]?.drawListOffset ?? 0;
                this.renderer._layerGroups["three3d"] = { groupIndex: 0, drawListOffset: videoOffset };
            }
            this.renderer._groupOrdering.splice(videoIndex + 1, 0, "three3d");
            for (let i = 0; i < this.renderer._groupOrdering.length; i++) {
                const g = this.renderer._groupOrdering[i];
                if (!this.renderer._layerGroups[g]) {
                    this.renderer._layerGroups[g] = { groupIndex: i, drawListOffset: 0 };
                } else {
                    this.renderer._layerGroups[g].groupIndex = i;
                }
            }
            this.skinId = this.renderer._nextSkinId++;
            this.skin = new Three3DSkin(this.skinId, this.renderer);
            this.renderer._allSkins[this.skinId] = this.skin;
            this.drawableId = this.renderer.createDrawable("three3d");
            this.renderer.updateDrawableSkinId(this.drawableId, this.skinId);
            this.renderer.updateDrawableVisible(this.drawableId, true);
            this.renderer.updateDrawablePosition(this.drawableId, [0, 0]);
            this.renderer.updateDrawableScale(this.drawableId, [100, 100]);
            if (this.renderer.markDrawableAsNoninteractive) {
                this.renderer.markDrawableAsNoninteractive(this.drawableId);
            }
            const drawable = this.renderer._allDrawables[this.drawableId];
            drawable.customDrawableName = "Three3D Layer";
            const extensionRef = this;
            const proto = Object.getPrototypeOf(drawable);
            if (proto && proto.setHighQuality) {
                drawable.setHighQuality = function(...args) {
                    proto.setHighQuality.apply(this, args);
                    if (extensionRef.skin) extensionRef.skin.resizeCanvas();
                };
            }
            const api = this.runtime.ext_three3dapi || (this.runtime.ext_three3dapi = {});
            if (!api.redraw) {
                const originalDraw = this.renderer.draw;
                this.renderer.draw = function() {
                    if (this.dirty && api.redraw) api.redraw();
                    return originalDraw.call(this);
                };
            }
            api.redraw = () => {
                if (this.canvasDirty && this.skin) {
                    this.skin.updateContent();
                    this.canvasDirty = false;
                }
            };
            this.isRendererIntegrated = true;
            api.redraw();
        } catch (error) {
            console.error("Failed to add Three3D layer:", error);
            throw error;
        }
    }
    createSceneManager(containerId) {
        if (!this.librariesLoaded) {
            throw new Error('库尚未加载完成');
        }
        const sceneManager = new ThreeSceneManager(containerId, this);
        this.sceneManagers.set(containerId, sceneManager);
        return sceneManager;
    }
    startRenderLoop() {
        if (this.renderLoopRunning) return;
        this.renderLoopRunning = true;
        this.lastTime = performance.now();
        const renderFrame = (currentTime) => {
            if (!this.renderLoopRunning) return;
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            this.sceneManagers.forEach(sceneManager => {
                sceneManager.updateAnimations(deltaTime);
                sceneManager.updatePhysics(deltaTime);
                sceneManager.updateCollisionDetection();
            });
            if (this.sceneManagers.size > 0) {
                this.renderAllScenes();
            }
            this.renderLoopId = requestAnimationFrame(renderFrame);
        };
        this.renderLoopId = requestAnimationFrame(renderFrame);
        console.log('3D渲染循环已启动');
    }
    renderAllContainers() {
        this.sceneManagers.forEach(sceneManager => {
            sceneManager.render();
        });
    }
    renderAllScenes() {
        this.sceneManagers.forEach(sm => sm.render());
        if (this.skin && this.sceneManagers.size > 0) this.skin.updateContent();
    }
    setNeedsRender() {
        this.needsRender = true;
        if (this.renderer) this.renderer.dirty = true;
    }
    stopRenderLoop() {
        this.renderLoopRunning = false;
        if (this.renderLoopId) {
            cancelAnimationFrame(this.renderLoopId);
            this.renderLoopId = null;
        }
        console.log('3D渲染循环已停止');
    }
    setModelPhysics(args) {
        const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
        const modelId = Scratch.Cast.toString(args.MODEL_ID);
        const physicsType = Scratch.Cast.toString(args.PHYSICS_TYPE);
        const mass = Scratch.Cast.toNumber(args.MASS);
        const containerData = this.containers.get(containerId);
        if (containerData) {
            containerData.sceneManager.setModelPhysics(modelId, physicsType, mass);
            this.setNeedsRender();
        }
    }
    setMapCollision(args) {
        const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
        const modelId = Scratch.Cast.toString(args.MODEL_ID);
        const containerData = this.containers.get(containerId);
        if (containerData) {
            const model = containerData.sceneManager.models && containerData.sceneManager.models.get(modelId);
            if (model) model.userData.isMapCollision = true;
            containerData.sceneManager.createComplexCollisionForGLTF(modelId);
            this.setNeedsRender();
        }
    }
    setCollisionOptimization(args) {
        const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
        const levelText = Scratch.Cast.toString(args.LEVEL);
        const containerData = this.containers.get(containerId);
        if (!containerData) return;
        const mapping = {
            '性能': 'performance',
            '均衡': 'balanced',
            '高质量': 'quality'
        };
        const level = mapping[levelText] || 'balanced';
        containerData.sceneManager.collisionOptimizationLevel = level;
        console.log(`容器 ${containerId} 设置碰撞优化力度为: ${level}`);
    }
    createElasticConstraint(args) {
        const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
        const constraintId = Scratch.Cast.toString(args.CONSTRAINT_ID);
        const modelA = Scratch.Cast.toString(args.MODEL_A);
        const modelB = Scratch.Cast.toString(args.MODEL_B);
        const rest = Scratch.Cast.toNumber(args.REST);
        const k = Scratch.Cast.toNumber(args.K);
        const d = Scratch.Cast.toNumber(args.D);
        const br = Scratch.Cast.toNumber(args.BREAK);
        const allowRotText = Scratch.Cast.toString(args.ALLOW_ROT);
        const allowRotation = allowRotText === '开启' || allowRotText === '允许' || allowRotText === '是' || allowRotText === 'true';
        const containerData = this.containers.get(containerId);
        if (!containerData) return;
        const ok = containerData.sceneManager.addElasticConstraint(constraintId, modelA, modelB, {
            restLength: rest,
            stiffness: k,
            damping: d,
            breakFactor: br,
            allowRotation
        });
        if (!ok) console.warn(`容器 ${containerId} 创建弹性约束失败: ${constraintId}`);
        this.setNeedsRender();
    }
    removeConstraintById(args) {
        const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
        const constraintId = Scratch.Cast.toString(args.CONSTRAINT_ID);
        const containerData = this.containers.get(containerId);
        if (!containerData) return;
        const ok = containerData.sceneManager.removeConstraint(constraintId);
        if (!ok) console.warn(`容器 ${containerId} 移除约束失败或不存在: ${constraintId}`);
        this.setNeedsRender();
    }
    whenElasticConstraintDestroyed() {
        return true;
    }
    getLastDestroyedConstraintId(args) {
        const containerId = args && args.CONTAINER_ID ? Scratch.Cast.toString(args.CONTAINER_ID) : null;
        if (containerId) {
            const containerData = this.containers.get(containerId);
            const sm = containerData && containerData.sceneManager;
            return (sm && sm.lastConstraintEvent && sm.lastConstraintEvent.id) ? sm.lastConstraintEvent.id : '';
        }
        let last = null;
        this.sceneManagers.forEach(sm => { if (sm.lastConstraintEvent) last = sm.lastConstraintEvent; });
        return last ? last.id : '';
    }
    getLastDestroyedConstraintReason(args) {
        const containerId = args && args.CONTAINER_ID ? Scratch.Cast.toString(args.CONTAINER_ID) : null;
        if (containerId) {
            const containerData = this.containers.get(containerId);
            const sm = containerData && containerData.sceneManager;
            return (sm && sm.lastConstraintEvent && sm.lastConstraintEvent.reason) ? sm.lastConstraintEvent.reason : '';
        }
        let last = null;
        this.sceneManagers.forEach(sm => { if (sm.lastConstraintEvent) last = sm.lastConstraintEvent; });
        return last ? last.reason : '';
    }
    getInfo() {
        return {
            id: 'threadcontainer',
            name: 'WB的3D容器',
            color1: '#4C97FF',
            color2: '#4280D7',
            color3: '#3373CC',
            blockIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAAJcEhZcwAAXFkAAFxZAStO/ZEAAADHSURBVFiF7djBCQIxEEDRH7EkGxC0AcEGLMFCLMEGBBtQsAF7Gi962iQ72XF3cph/DQnvkoEEoiiqllo3iIjMAQFIKQ0865YDREQ229v/RN/er2NxbaU9ZE7c6VxeVwG9cKAAeuJgBOiNgwqwBxwUgL3gIDNmfnOudvWn1oqDwhzcH55Wy6DHfTdpn3oOehVAawG0FkBrAbQWQGsB1HS95F900AGwhgNn4BgOHIEaHDgBtThwALbgYGFgKw4yn0dLfw5FUWTsAwQaUB1enbxwAAAAAElFTkSuQmCC',
            menuIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAAAARzQklUCAgICHwIZIgAAAAJcEhZcwAAXFkAAFxZAStO/ZEAAAGZSURBVFiF7ZkxTsMwFEBfEHAeUnEAisjEVgmxcwRWGGHlCOwIiY2pEe0BEOmNYHIVHH/7J7HjIPGmxnas129/y3YKBE7Ovr6luhTstovCVd4pnFrMxhbdP+QWszGiB7lFQhQwv+gZdttFcdj3pWZTpnABoFw2nbKiT/SaTcnp8jWqFMDn5gpwC6rnYEq5m1u5XiWYSw4UgjnlICCYWw48gnOQA0FwLnIAnXXQrHMm9WPSVw4cggDVqh7r0mH9djHoPXEO+jq068zzUAkfqnXQFqhW9a+yFBE3eAVdQgZTllIOAoJtsdQiEsEIGrEpouVC3G7ZMlq59lSI8YeCSeLKUGluVqt6LxUr2kFBOxnMb2lJCdVHF7Sxhc2zHdVYEVRt+UPzceh81SAKaoZIM5RjZdVZ3Ma1aEvtHu9L7h66Zw0touD7yznHR9Mcm5+f3Acm8AheXn+IHcbcFPjkIPPNQkgORibJkLYGjRwMTJIh7dpo5SDDEPeRg4kF+8qB43Zr6sshH87brb6dpOb/hnUsf+cS3WYunyF+AMvA2MuwXVPuAAAAAElFTkSuQmCC',
            docsURI: 'https://space.bilibili.com/1779455171?spm_id_from=333.1007.0.0',
            blocks: [
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: "🏗️ 容器管理",
                },
                {
                    opcode: 'createContainer',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '创建3D容器 [ID]',
                    arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' } }
                },
                {
                    opcode: 'setContainerSize',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 大小 宽 [WIDTH] 高 [HEIGHT]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        WIDTH: { type: Scratch.ArgumentType.NUMBER, defaultValue: '480' },
                        HEIGHT: { type: Scratch.ArgumentType.NUMBER, defaultValue: '360' }
                    }
                },
                {
                    opcode: 'setContainerPosition',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 位置 X [X] Y [Y]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'showContainer',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '显示容器 [ID]',
                    arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' } }
                },
                {
                    opcode: 'hideContainer',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '隐藏容器 [ID]',
                    arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' } }
                },
                {
                    opcode: 'deleteContainer',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '删除容器 [ID]',
                    arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' } }
                },
                {
                    opcode: 'setContainerBackground',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 背景 [STYLE] 颜色 [COLOR]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        STYLE: { type: Scratch.ArgumentType.STRING, menu: 'backgroundStyle' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#87CEEB' }
                    }
                },
                {
                    opcode: 'setContainerPhysics',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 物理模拟 [ENABLED]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        ENABLED: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' }
                    }
                },
                {
                    opcode: 'setReflectionEnabled',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 水面反射 [ENABLED]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        ENABLED: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' }
                    }
                },
                {
                    opcode: 'setAntialiasing',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 抗锯齿 [ENABLED]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        ENABLED: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' }
                    }
                },
                {
                    opcode: 'setVSync',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 垂直同步 [ENABLED]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        ENABLED: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '📷 摄像机控制'
                },
                {
                    opcode: 'setCameraPosition',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 相机位置 X [X] Y [Y] Z [Z]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '500' }
                    }
                },
                {
                    opcode: 'setCameraRotation',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 相机旋转 X [X] Y [Y] Z [Z] 度',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'setCameraFOV',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 相机视野角度 [FOV]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        FOV: { type: Scratch.ArgumentType.NUMBER, defaultValue: '75' }
                    }
                },
                {
                    opcode: 'setCameraTarget',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 相机目标点 X [X] Y [Y] Z [Z]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'resetCameraTarget',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '重置容器 [ID] 相机目标（使用旋转控制）',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' }
                    }
                },
                {
                    opcode: 'setCameraPitchLimit',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 相机垂直角度限制 [ENABLED]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        ENABLED: { type: Scratch.ArgumentType.BOOLEAN, defaultValue: true }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '🎲 3D模型创建'
                },
                {
                    opcode: 'addCube',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '在容器 [CONTAINER_ID] 添加立方体 [MODEL_ID] 位置 X [X] Y [Y] Z [Z] 大小 [WIDTH] [HEIGHT] [DEPTH] 颜色 [COLOR]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        WIDTH: { type: Scratch.ArgumentType.NUMBER, defaultValue: '100' },
                        HEIGHT: { type: Scratch.ArgumentType.NUMBER, defaultValue: '100' },
                        DEPTH: { type: Scratch.ArgumentType.NUMBER, defaultValue: '100' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#ff0000' }
                    }
                },
                {
                    opcode: 'addSphere',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '在容器 [CONTAINER_ID] 添加球体 [MODEL_ID] 位置 X [X] Y [Y] Z [Z] 大小 [SIZE] 颜色 [COLOR]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'sphere1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        SIZE: { type: Scratch.ArgumentType.NUMBER, defaultValue: '50' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#0000FF' }
                    }
                },
                {
                    opcode: 'addWater',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '在容器 [CONTAINER_ID] 添加水面 [MODEL_ID] 位置 X [X] Y [Y] Z [Z] 宽 [WIDTH] 深 [DEPTH] 颜色 [COLOR]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'water1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        WIDTH: { type: Scratch.ArgumentType.NUMBER, defaultValue: '200' },
                        DEPTH: { type: Scratch.ArgumentType.NUMBER, defaultValue: '200' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#006994' }
                    }
                },
                {
                    opcode: 'addParticle',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '向容器 [CONTAINER_ID] 添加粒子 [PARTICLE_ID] 位置X [X] Y [Y] Z [Z] 颜色 [COLOR] 亮度 [INTENSITY] 扩散度 [SPREAD]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        PARTICLE_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'particle1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#FFFF00' },
                        INTENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' },
                        SPREAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' }
                    }
                },
                {
                    opcode: 'importModel',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '导入GLTF模型到容器 [CONTAINER_ID] 建模ID [MODEL_ID] 文件 [FILE_URL] 缩放 [SCALE]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        FILE_URL: { type: Scratch.ArgumentType.STRING, defaultValue: '' },
                        SCALE: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1.0' }
                    }
                },
                {
                    opcode: 'loadGLTFModel',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '向容器 [CONTAINER_ID] 加载GLTF模型 [MODEL_ID] Base64数据 [BASE64_DATA] 位置X [X] Y [Y] Z [Z] 缩放 [SCALE]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        BASE64_DATA: { type: Scratch.ArgumentType.STRING, defaultValue: 'data:application/octet-stream;base64,' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        SCALE: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '⚡ 物理系统'
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '🔗 物理约束'
                },
                {
                    opcode: 'createElasticConstraint',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '在容器 [CONTAINER_ID] 创建弹性约束 [CONSTRAINT_ID] 模型A [MODEL_A] 模型B [MODEL_B] 参考长度 [REST] 刚度 [K] 阻尼 [D] 断裂比例 [BREAK] 允许旋转 [ALLOW_ROT]'
                    ,arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        CONSTRAINT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'c1' },
                        MODEL_A: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        MODEL_B: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube2' },
                        REST: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 },
                        K: { type: Scratch.ArgumentType.NUMBER, defaultValue: 50 },
                        D: { type: Scratch.ArgumentType.NUMBER, defaultValue: 2 },
                        BREAK: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.6 },
                        ALLOW_ROT: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu', defaultValue: '允许' }
                    }
                },
                {
                    opcode: 'removeConstraintById',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '移除容器 [CONTAINER_ID] 约束 [CONSTRAINT_ID]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        CONSTRAINT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'c1' }
                    }
                },
                {
                    opcode: 'whenElasticConstraintDestroyed',
                    blockType: Scratch.BlockType.EVENT,
                    text: '当弹性约束被破坏'
                },
                {
                    opcode: 'getLastDestroyedConstraintId',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '最近被破坏约束ID'
                },
                {
                    opcode: 'getLastDestroyedConstraintReason',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '最近被破坏约束原因'
                },
                {
                    opcode: 'setModelPhysics',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 物理 [ENABLED] 质量 [MASS]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        ENABLED: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' },
                        MASS: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' }
                    }
                },
                {
                    opcode: 'setGlobalGravity',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 全局重力 X [GX] Y [GY] Z [GZ]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        GX: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        GY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '-9.82' },
                        GZ: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'setGlobalFriction',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 全局摩擦力 [FRICTION]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        FRICTION: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.3 }
                    }
                },
                {
                    opcode: 'setGlobalRestitution',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 全局弹性(反弹系数) [RESTITUTION]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        RESTITUTION: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.2 }
                    }
                },
                {
                    opcode: 'setModelContactProperties',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 摩擦力 [FRICTION] 弹性 [RESTITUTION]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        FRICTION: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.3 },
                        RESTITUTION: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.2 }
                    }
                },
                {
                    opcode: 'setModelDamping',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 线性阻尼 [LD] 角阻尼 [AD]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        LD: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.25 },
                        AD: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.25 }
                    }
                },
                {
                    opcode: 'setGlobalDamping',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 全局线性阻尼 [LD] 角阻尼 [AD]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        LD: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.25 },
                        AD: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.25 }
                    }
                },
                {
                    opcode: 'setModelAngularVelocityLimit',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 最大角速度 [WMAX]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        WMAX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 }
                    }
                },
                {
                    opcode: 'setGlobalAngularVelocityLimit',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 全局最大角速度 [WMAX]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        WMAX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 }
                    }
                },
                {
                    opcode: 'applyForce',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '对容器 [CONTAINER_ID] 模型 [MODEL_ID] 施加力 X [FX] Y [FY] Z [FZ]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        FX: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        FY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '100' },
                        FZ: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'setModelVelocity',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 速度 X [VX] Y [VY] Z [VZ]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        VX: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        VY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        VZ: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'setModelVelocityX',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 速度X [VX]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        VX: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'setModelVelocityY',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 速度Y [VY]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        VY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'setModelVelocityZ',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 速度Z [VZ]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        VZ: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'removeModelPhysics',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '取消容器 [CONTAINER_ID] 模型 [MODEL_ID] 物理化',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    opcode: 'fixPhysicsAlignment',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '修复容器 [CONTAINER_ID] 模型 [MODEL_ID] 的物理对齐',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'all' }
                    }
                },
                {
                    opcode: 'setMapCollision',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 为地图碰撞',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    opcode: 'setCollisionOptimization',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 碰撞优化力度 [LEVEL]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        LEVEL: { type: Scratch.ArgumentType.STRING, menu: 'optLevelMenu' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '🔄 模型变换'
                },
                {
                    opcode: 'setModelPosition',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 位置 X [X] Y [Y] Z [Z]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'setModelRotation',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 旋转 X [X] Y [Y] Z [Z]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'removeModel',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '从容器 [CONTAINER_ID] 移除模型 [MODEL_ID]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' }
                    }
                },
                {
                    opcode: 'setContainerBackground',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 背景 [STYLE] 颜色 [COLOR]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        STYLE: { type: Scratch.ArgumentType.STRING, menu: 'backgroundStyle' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#87CEEB' }
                    }
                },
                {
                    opcode: 'setContainerPhysics',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 物理模拟 [ENABLED]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        ENABLED: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' }
                    }
                },
                {
                    opcode: 'setReflectionEnabled',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [ID] 水面反射 [ENABLED]',
                    arguments: {
                        ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        ENABLED: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' }
                    }
                },
                {
                    opcode: 'showContainer',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '显示容器 [ID]',
                    arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' } }
                },
                {
                    opcode: 'hideContainer',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '隐藏容器 [ID]',
                    arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' } }
                },
                {
                    opcode: 'deleteContainer',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '删除容器 [ID]',
                    arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' } }
                },
                {
                    opcode: 'setDirectionalLight',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 方向光 [LIGHT_ID] 位置X [X] Y [Y] Z [Z] 目标X [TARGET_X] Y [TARGET_Y] Z [TARGET_Z] 强度 [INTENSITY] 颜色 [COLOR]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        LIGHT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'directional1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '100' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '100' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '50' },
                        TARGET_X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        TARGET_Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        TARGET_Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        INTENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0.8' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#FFFFFF' }
                    }
                },
                {
                    opcode: 'setSpotLight',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 聚光 [LIGHT_ID] 位置X [X] Y [Y] Z [Z] 目标X [TARGET_X] Y [TARGET_Y] Z [TARGET_Z] 角度 [ANGLE] 边缘 [PENUMBRA] 衰减 [DECAY] 距离 [DISTANCE] 强度 [INTENSITY] 颜色 [COLOR]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        LIGHT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'spot1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '10' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        TARGET_X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        TARGET_Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        TARGET_Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        ANGLE: { type: Scratch.ArgumentType.NUMBER, defaultValue: '30' },
                        PENUMBRA: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0.1' },
                        DECAY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '2' },
                        DISTANCE: { type: Scratch.ArgumentType.NUMBER, defaultValue: '200' },
                        INTENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#FFFFFF' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: "材质系统",
                },
                {
                    opcode: 'setModelMaterial',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 材质 [MATERIAL_TYPE]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        MATERIAL_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'materialTypeMenu' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: "PBR（MR/法线）",
                },
                {
                    opcode: 'setModelPBRValues',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] PBR 金属度 [METALNESS] 粗糙度 [ROUGHNESS]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        METALNESS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.0 },
                        ROUGHNESS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.6 }
                    }
                },
                {
                    opcode: 'setModelMRMap',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] MR贴图(Base64/URL) [TEXTURE]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        TEXTURE: { type: Scratch.ArgumentType.STRING, defaultValue: 'data:image/png;base64,' }
                    }
                },
                {
                    opcode: 'setModelNormalMap',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 法线贴图(Base64/URL) [TEXTURE] 强度X [SCALE_X] Y [SCALE_Y]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        TEXTURE: { type: Scratch.ArgumentType.STRING, defaultValue: 'data:image/png;base64,' },
                        SCALE_X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 },
                        SCALE_Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 }
                    }
                },
                {
                    opcode: 'setModelTextureSampling',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] [MAP_TYPE] 采样 WrapU [WRAP_S] WrapV [WRAP_T] RepeatU [REPEAT_X] RepeatV [REPEAT_Y] OffsetU [OFFSET_X] OffsetV [OFFSET_Y] 旋转(度) [ROTATION]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'cube1' },
                        MAP_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'pbrMapTypeMenu' },
                        WRAP_S: { type: Scratch.ArgumentType.STRING, menu: 'textureWrapMenu' },
                        WRAP_T: { type: Scratch.ArgumentType.STRING, menu: 'textureWrapMenu' },
                        REPEAT_X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 },
                        REPEAT_Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 },
                        OFFSET_X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.0 },
                        OFFSET_Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.0 },
                        ROTATION: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.0 }
                    }
                },
                {
                    opcode: 'addMetallicReflection',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '为容器 [CONTAINER_ID] 模型 [MODEL_ID] 添加金属反射 金属度 [METALNESS] 粗糙度 [ROUGHNESS]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        METALNESS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 },
                        ROUGHNESS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.1 }
                    }
                },
                {
                    opcode: 'addParticle',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '向容器 [CONTAINER_ID] 添加粒子 [PARTICLE_ID] 位置X [X] Y [Y] Z [Z] 颜色 [COLOR] 亮度 [INTENSITY] 扩散度 [SPREAD]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        PARTICLE_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'particle1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#FFFF00' },
                        INTENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' },
                        SPREAD: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' }
                    }
                },
                {
                    opcode: 'loadGLTFModel',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '向容器 [CONTAINER_ID] 加载GLTF模型 [MODEL_ID] Base64数据 [BASE64_DATA] 位置X [X] Y [Y] Z [Z] 缩放 [SCALE]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        BASE64_DATA: { type: Scratch.ArgumentType.STRING, defaultValue: 'data:application/octet-stream;base64,' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        SCALE: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' }
                    }
                },
                {
                    opcode: 'setModelPhysics',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 物理类型 [PHYSICS_TYPE] 质量 [MASS]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        PHYSICS_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'physicsTypeMenu' },
                        MASS: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '🎬 动画系统'
                },
                {
                    opcode: 'playModelAnimation',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '播放容器 [CONTAINER_ID] 模型 [MODEL_ID] 动画 [ANIMATION_NAME] 循环模式 [LOOP_MODE]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        ANIMATION_NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Animation' },
                        LOOP_MODE: { type: Scratch.ArgumentType.STRING, menu: 'animationLoopMenu' }
                    }
                },
                {
                    opcode: 'setModelAnimationFrameCount',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 播放帧数 [FRAME_COUNT]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        FRAME_COUNT: { type: Scratch.ArgumentType.NUMBER, defaultValue: -1 }
                    }
                },
                {
                    opcode: 'setModelAnimationProgressFrame',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 播放进度 [FRAME] 帧',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        FRAME: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                    }
                },
                {
                    opcode: 'setModelAnimationTransition',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 过渡帧 [TRANSITION_FRAMES] 帧 形式 [EASING]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        TRANSITION_FRAMES: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 },
                        EASING: { type: Scratch.ArgumentType.STRING, menu: 'animationEasingMenu' }
                    }
                },
                {
                    opcode: 'stopModelAnimation',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '停止容器 [CONTAINER_ID] 模型 [MODEL_ID] 动画',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    opcode: 'getModelAnimations',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '获取容器 [CONTAINER_ID] 模型 [MODEL_ID] 动画列表',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '🎯 碰撞检测'
                },
                {
                    opcode: 'checkModelCollision',
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: '容器 [CONTAINER_ID] 模型 [MODEL_ID1] 与 [MODEL_ID2] 发生碰撞',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID1: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        MODEL_ID2: { type: Scratch.ArgumentType.STRING, defaultValue: 'model2' }
                    }
                },
                {
                    opcode: 'getModelDistance',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '容器 [CONTAINER_ID] 模型 [MODEL_ID1] 与 [MODEL_ID2] 的距离',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID1: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        MODEL_ID2: { type: Scratch.ArgumentType.STRING, defaultValue: 'model2' }
                    }
                },
                {
                    opcode: 'checkModelInRange',
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: '容器 [CONTAINER_ID] 模型 [MODEL_ID] 在位置X [X] Y [Y] Z [Z] 范围 [RANGE] 内',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        RANGE: { type: Scratch.ArgumentType.NUMBER, defaultValue: '5' }
                    }
                },
                {
                    opcode: 'getAllCollisions',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '获取容器 [CONTAINER_ID] 所有碰撞模型对',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '💡 光照系统'
                },
                {
                    opcode: 'addLight',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '向容器 [CONTAINER_ID] 添加光源 [LIGHT_ID] 类型 [TYPE] 位置X [X] Y [Y] Z [Z] 颜色 [COLOR] 亮度 [INTENSITY]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        LIGHT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'light1' },
                        TYPE: { type: Scratch.ArgumentType.STRING, menu: 'lightTypeMenu' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '10' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#FFFFFF' },
                        INTENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' }
                    }
                },
                {
                    opcode: 'setAmbientLight',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 环境光 强度 [INTENSITY] 颜色 [COLOR]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        INTENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0.6' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#404040' }
                    }
                },
                {
                    opcode: 'setLightPosition',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 的光源 [LIGHT_ID] 位置 X [X] Y [Y] Z [Z]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        LIGHT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'light1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    opcode: 'setLightIntensity',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 的光源 [LIGHT_ID] 亮度为 [INTENSITY]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        LIGHT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'light1' },
                        INTENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: '1' }
                    }
                },
                {
                    opcode: 'setLightColor',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 的光源 [LIGHT_ID] 颜色为 [COLOR]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        LIGHT_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'light1' },
                        COLOR: { type: Scratch.ArgumentType.COLOR, defaultValue: '#FFFFFF' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '🎨 材质和特效'
                },
                {
                    opcode: 'applyFilter',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '对容器 [CONTAINER_ID] 应用滤镜 [FILTER_TYPE]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        FILTER_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'filterTypeMenu' }
                    }
                },
                {
                    opcode: 'applyFilterWithIntensity',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '对容器 [CONTAINER_ID] 应用滤镜 [FILTER_TYPE] 强度 [INTENSITY]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        FILTER_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'filterTypeMenu' },
                        INTENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 }
                    }
                },
                {
                    opcode: 'enableSkybox',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '容器 [CONTAINER_ID] [ENABLE] 天空盒',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        ENABLE: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' }
                    }
                },
                {
                    opcode: 'setSunPosition',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 太阳位置 X [X] Y [Y] Z [Z]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        X: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' },
                        Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: '10' },
                        Z: { type: Scratch.ArgumentType.NUMBER, defaultValue: '0' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '🔧 模型属性'
                },
                {
                    opcode: 'setModelRenderSide',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 渲面 [SIDE]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        SIDE: { type: Scratch.ArgumentType.STRING, menu: 'renderSideMenu' }
                    }
                },
                {
                    opcode: 'setModelOpacity',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 透明度 [ALPHA]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        ALPHA: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.2 }
                    }
                },
                {
                    opcode: 'setModelCastShadow',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 模型 [MODEL_ID] 是否遮挡光线 [ENABLED]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' },
                        ENABLED: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' }
                    }
                },
                {
                    opcode: 'showCollisionBoxes',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '容器 [CONTAINER_ID] [SHOW] 全局碰撞箱',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        SHOW: { type: Scratch.ArgumentType.STRING, menu: 'showCollisionBoxMenu' }
                    }
                },
                {
                    opcode: 'removeModelPhysics',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '取消容器 [CONTAINER_ID] 模型 [MODEL_ID] 物理化',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '📊 数据获取'
                },
                {
                    opcode: 'getModelPositionX',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '获取容器 [CONTAINER_ID] 模型 [MODEL_ID] 位置 x',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    opcode: 'getModelPositionY',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '获取容器 [CONTAINER_ID] 模型 [MODEL_ID] 位置 y',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    opcode: 'getModelPositionZ',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '获取容器 [CONTAINER_ID] 模型 [MODEL_ID] 位置 z',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    opcode: 'getModelRotationX',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '获取容器 [CONTAINER_ID] 模型 [MODEL_ID] 旋转 x',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    opcode: 'getModelRotationY',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '获取容器 [CONTAINER_ID] 模型 [MODEL_ID] 旋转 y',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    opcode: 'getModelRotationZ',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '获取容器 [CONTAINER_ID] 模型 [MODEL_ID] 旋转 z',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    opcode: 'getModelScaleX',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '获取容器 [CONTAINER_ID] 模型 [MODEL_ID] 缩放 x',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    opcode: 'getModelScaleY',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '获取容器 [CONTAINER_ID] 模型 [MODEL_ID] 缩放 y',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    opcode: 'getModelScaleZ',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '获取容器 [CONTAINER_ID] 模型 [MODEL_ID] 缩放 z',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        MODEL_ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'model1' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: "滤镜效果",
                },
                {
                    opcode: 'applyFilter',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '对容器 [CONTAINER_ID] 应用滤镜 [FILTER_TYPE]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        FILTER_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'filterTypeMenu' }
                    }
                },
                {
                    opcode: 'applyFilterWithIntensity',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '对容器 [CONTAINER_ID] 应用滤镜 [FILTER_TYPE] 强度 [INTENSITY]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        FILTER_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'filterTypeMenu' },
                        INTENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 }
                    }
                },
                {
                    opcode: 'setFilterIntensity',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 滤镜强度为 [INTENSITY]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        INTENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 }
                    }
                },
                {
                    opcode: 'getFilterIntensity',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '容器 [CONTAINER_ID] 滤镜强度',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' }
                    }
                },
                {
                    opcode: 'disableFilter',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '禁用容器 [CONTAINER_ID] 的滤镜',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' }
                    }
                },
                {
                    opcode: 'getCurrentFilter',
                    blockType: Scratch.BlockType.REPORTER,
                    text: '容器 [CONTAINER_ID] 当前滤镜',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' }
                    }
                },
                {
                    opcode: 'isFilterEnabled',
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: '容器 [CONTAINER_ID] 滤镜已启用?',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' }
                    }
                },
                {
                    blockType: Scratch.BlockType.LABEL,
                    text: '🌅 天空盒和环境'
                },
                {
                    opcode: 'enableSkybox',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '容器 [CONTAINER_ID] [ENABLE] 天空盒',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        ENABLE: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' }
                    }
                },
                {
                    opcode: 'setSunPosition',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 太阳位置 方位角 [AZIMUTH] 仰角 [ELEVATION]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        AZIMUTH: { type: Scratch.ArgumentType.NUMBER, defaultValue: 180 },
                        ELEVATION: { type: Scratch.ArgumentType.NUMBER, defaultValue: 30 }
                    }
                },
                {
                    opcode: 'setSunByDayAngle',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 日光角度 [DAY_ANGLE] (0-360°)',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        DAY_ANGLE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 90 }
                    }
                },
                {
                    opcode: 'setSunNoonVertical',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 太阳正午直射',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' }
                    }
                },
                {
                    opcode: 'setShadowQuality',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 阴影质量 [QUALITY]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        QUALITY: { type: Scratch.ArgumentType.STRING, menu: 'qualityPreset' }
                    }
                },
                {
                    opcode: 'setSkyTurbidity',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 天空浑浊度 [TURBIDITY]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        TURBIDITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: 10 }
                    }
                },
                {
                    opcode: 'setSkyRayleigh',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 天空瑞利散射 [RAYLEIGH]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        RAYLEIGH: { type: Scratch.ArgumentType.NUMBER, defaultValue: 3 }
                    }
                },
                {
                    opcode: 'setSkyTimeOfDay',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 天空时段 [TIME_OF_DAY]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        TIME_OF_DAY: { type: Scratch.ArgumentType.STRING, menu: 'timeOfDayMenu' }
                    }
                },
                {
                    opcode: 'setSkyCustomTime',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 天空自定义时间 [HOUR] 时 [MINUTE] 分',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        HOUR: { type: Scratch.ArgumentType.NUMBER, defaultValue: 12 },
                        MINUTE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                    }
                },
                {
                    opcode: 'enableSkyClouds',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '容器 [CONTAINER_ID] [ENABLE] 天空云朵',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        ENABLE: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' }
                    }
                },
                {
                    opcode: 'setSkyCloudDensity',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 云朵密度 [DENSITY]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        DENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.5 }
                    }
                },
                {
                    opcode: 'setSkyCloudType',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 云朵类型 [CLOUD_TYPE]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        CLOUD_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'cloudTypeMenu' }
                    }
                },
                {
                    opcode: 'enableSkyStars',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '容器 [CONTAINER_ID] [ENABLE] 天空星星',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        ENABLE: { type: Scratch.ArgumentType.STRING, menu: 'booleanMenu' }
                    }
                },
                {
                    opcode: 'setSkyStarIntensity',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '设置容器 [CONTAINER_ID] 星星亮度 [INTENSITY]',
                    arguments: {
                        CONTAINER_ID: { type: Scratch.ArgumentType.STRING, defaultValue: '3D1' },
                        INTENSITY: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1.0 }
                    }
                }
            ],
            menus: {
                booleanMenu: {
                    acceptReporters: false,
                    items: ['开启', '关闭']
                },
                backgroundStyle: {
                    acceptReporters: false,
                    items: ['纯色', '渐变', '天空盒', '透明']
                },
                qualityPreset: {
                acceptReporters: false,
                items: ['低', '中', '高', '超高']
            },
            lightTypeMenu: {
                acceptReporters: false,
                items: ['环境光', '方向光', '点光源', '聚光灯']
            },
            physicsTypeMenu: {
                acceptReporters: false,
                items: ['简单碰撞箱', '复杂网格碰撞', '地图碰撞']
            },
            animationLoopMenu: {
                acceptReporters: false,
                items: ['单次播放', '循环播放', '停止在最后一帧']
            },
            animationEasingMenu: {
                acceptReporters: false,
                items: ['线性', '二次', '三次', '弹性', '弹跳', '平滑']
            },
            filterTypeMenu: {
                acceptReporters: false,
                items: ['复古', '灰度', '复古色调', '黑金', '鲜艳', '褪色', '电影', '老电视', '漫画', '素描']
            },
            renderSideMenu: {
                acceptReporters: false,
                items: ['正面', '反面', '双面']
            },
            showCollisionBoxMenu: {
                acceptReporters: false,
                items: ['显示', '隐藏']
            },
            timeOfDayMenu: {
                acceptReporters: false,
                items: ['黎明', '上午', '正午', '下午', '黄昏', '夜晚', '深夜', '自定义']
            },
            cloudTypeMenu: {
                acceptReporters: false,
                items: ['贴图云', '粒子云']
            },
            materialTypeMenu: {
                acceptReporters: false,
                items: ['普通材质', '金属材质', '塑料材质', '水面材质']
            },
            pbrMapTypeMenu: {
                acceptReporters: false,
                items: ['MR贴图', '法线贴图']
            },
            textureWrapMenu: {
                acceptReporters: false,
                items: ['重复', '夹紧', '镜像']
            },
            optLevelMenu: {
                acceptReporters: false,
                items: ['性能', '均衡', '高质量']
            }
            }
        };
    }
    fixPhysicsAlignment(args) {
    const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
    const modelId = Scratch.Cast.toString(args.MODEL_ID);
    const containerData = this.containers.get(containerId);
    if (containerData && containerData.sceneManager) {
        if (modelId === 'all') {
            containerData.sceneManager.fixAllPhysicsBodies();
        } else {
            const model = containerData.sceneManager.models.get(modelId) || 
                         containerData.sceneManager.objects.get(modelId);
            if (model) {
                containerData.sceneManager.fixPhysicsBodyAlignment(model);
            }
        }
        this.setNeedsRender();
    }
    }
    async createContainer(args) {
        const id = Scratch.Cast.toString(args.ID);
        if (!libraryManager.isAllLoaded()) {
            console.log('库尚未加载，等待加载完成...');
            try {
                await libraryManager.waitForAll();
                this.librariesLoaded = true;
            } catch (error) {
                console.error('等待库加载失败:', error);
                return;
            }
        }
        if (!this.isRendererIntegrated) {
            await this.integrateWithScratchRenderer();
        }
        const sceneManager = this.createSceneManager(id);
        sceneManager.initializeScene(null); 
        this.containers.set(id, {
            sceneManager: sceneManager,
            width: 480,
            height: 360,
            x: 0,
            y: 0
        });
        console.log(`3D容器 ${id} 创建成功，已集成到 Scratch 渲染系统`);
        this.setNeedsRender();
    }
    setContainerSize(args) {
        const id = Scratch.Cast.toString(args.ID);
        const width = Scratch.Cast.toNumber(args.WIDTH);
        const height = Scratch.Cast.toNumber(args.HEIGHT);
        const containerData = this.containers.get(id);
        if (containerData) {
            containerData.width = width;
            containerData.height = height;
            containerData.sceneManager.setSize(width, height);
            if (this.skin) {
                this.skin.size = [width, height];
                this.skin.resizeCanvas();
            }
            this.setNeedsRender();
        }
    }
    setContainerPosition(args) {
        const id = Scratch.Cast.toString(args.ID);
        const x = Scratch.Cast.toNumber(args.X);
        const y = Scratch.Cast.toNumber(args.Y);
        const containerData = this.containers.get(id);
        if (containerData) {
            containerData.x = x;
            containerData.y = y;
        }
    }
    addCube(args) {
        const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
        const modelId = Scratch.Cast.toString(args.MODEL_ID);
        const x = Scratch.Cast.toNumber(args.X);
        const y = Scratch.Cast.toNumber(args.Y);
        const z = Scratch.Cast.toNumber(args.Z);
        const width = Scratch.Cast.toNumber(args.WIDTH);
        const height = Scratch.Cast.toNumber(args.HEIGHT);
        const depth = Scratch.Cast.toNumber(args.DEPTH);
        const color = Scratch.Cast.toString(args.COLOR);
        const containerData = this.containers.get(containerId);
        if (containerData) {
            containerData.sceneManager.addCube(modelId, x, y, z, width, height, depth, color);
            this.setNeedsRender();
        }
    }
    setCameraPosition(args) {
        const id = Scratch.Cast.toString(args.ID);
        const x = Scratch.Cast.toNumber(args.X);
        const y = Scratch.Cast.toNumber(args.Y);
        const z = Scratch.Cast.toNumber(args.Z);
        const containerData = this.containers.get(id);
        if (containerData) {
            containerData.sceneManager.setCameraPosition(x, y, z);
            this.setNeedsRender();
        }
    }
    setCameraRotation(args) {
        const id = Scratch.Cast.toString(args.ID);
        const x = Scratch.Cast.toNumber(args.X);
        const y = Scratch.Cast.toNumber(args.Y);
        const z = Scratch.Cast.toNumber(args.Z);
        const containerData = this.containers.get(id);
        if (containerData) {
            containerData.sceneManager.setCameraRotation(x, y, z);
            this.setNeedsRender();
        }
    }
    setCameraFOV(args) {
        const id = Scratch.Cast.toString(args.ID);
        const fov = Scratch.Cast.toNumber(args.FOV);
        const containerData = this.containers.get(id);
        if (containerData) {
            containerData.sceneManager.setCameraFOV(fov);
            this.setNeedsRender();
        }
    }
    setCameraTarget(args) {
        const id = Scratch.Cast.toString(args.ID);
        const x = Scratch.Cast.toNumber(args.X);
        const y = Scratch.Cast.toNumber(args.Y);
        const z = Scratch.Cast.toNumber(args.Z);
        const containerData = this.containers.get(id);
        if (containerData) {
            containerData.sceneManager.setCameraTarget(x, y, z);
            this.setNeedsRender();
        }
    }
    resetCameraTarget(args) {
        const id = Scratch.Cast.toString(args.ID);
        const containerData = this.containers.get(id);
        if (containerData) {
            containerData.sceneManager.resetCameraTarget();
            this.setNeedsRender();
        }
    }
    setCameraPitchLimit(args) {
        const id = Scratch.Cast.toString(args.ID);
        const enabled = Scratch.Cast.toBoolean(args.ENABLED);
        const containerData = this.containers.get(id);
        if (containerData) {
            containerData.sceneManager.setCameraPitchLimit(enabled);
        }
    }
    addSphere(args) {
        const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
        const modelId = Scratch.Cast.toString(args.MODEL_ID);
        const x = Scratch.Cast.toNumber(args.X);
        const y = Scratch.Cast.toNumber(args.Y);
        const z = Scratch.Cast.toNumber(args.Z);
        const size = Scratch.Cast.toNumber(args.SIZE);
        const color = Scratch.Cast.toString(args.COLOR);
        const containerData = this.containers.get(containerId);
        if (containerData) {
            containerData.sceneManager.addSphere(modelId, x, y, z, size, color);
            this.setNeedsRender();
        }
    }
    addWater(args) {
        const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
        const modelId = Scratch.Cast.toString(args.MODEL_ID);
        const x = Scratch.Cast.toNumber(args.X);
        const y = Scratch.Cast.toNumber(args.Y);
        const z = Scratch.Cast.toNumber(args.Z);
        const width = Scratch.Cast.toNumber(args.WIDTH);
        const depth = Scratch.Cast.toNumber(args.DEPTH);
        const color = Scratch.Cast.toString(args.COLOR);
        const containerData = this.containers.get(containerId);
        if (containerData) {
            containerData.sceneManager.addWater(modelId, x, y, z, width, depth, color);
            this.setNeedsRender();
        }
    }
    importModel(args) {
        const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
        const modelId = Scratch.Cast.toString(args.MODEL_ID);
        const fileUrl = Scratch.Cast.toString(args.FILE_URL);
        const scale = Scratch.Cast.toNumber(args.SCALE);
        const containerData = this.containers.get(containerId);
        if (containerData) {
            containerData.sceneManager.importModel(modelId, fileUrl, scale);
            this.setNeedsRender();
        }
    }
    setModelPosition(args) {
        const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
        const modelId = Scratch.Cast.toString(args.MODEL_ID);
        const x = Scratch.Cast.toNumber(args.X);
        const y = Scratch.Cast.toNumber(args.Y);
        const z = Scratch.Cast.toNumber(args.Z);
        const containerData = this.containers.get(containerId);
        if (containerData) {
            containerData.sceneManager.setModelPosition(modelId, x, y, z);
            this.setNeedsRender();
        }
    }
    setModelRotation(args) {
        const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
        const modelId = Scratch.Cast.toString(args.MODEL_ID);
        const x = Scratch.Cast.toNumber(args.X);
        const y = Scratch.Cast.toNumber(args.Y);
        const z = Scratch.Cast.toNumber(args.Z);
        const containerData = this.containers.get(containerId);
        if (containerData) {
            containerData.sceneManager.setModelRotation(modelId, x, y, z);
            this.setNeedsRender();
        }
    }
    removeModel(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.removeModel(modelId);
                this.setNeedsRender();
            }
        }
        setContainerBackground(args) {
            const containerId = Scratch.Cast.toString(args.ID);
            const style = Scratch.Cast.toString(args.STYLE);
            const color = Scratch.Cast.toString(args.COLOR);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setBackground(style, color);
                this.setNeedsRender();
            }
        }
        setContainerPhysics(args) {
            const containerId = Scratch.Cast.toString(args.ID);
            const enabled = Scratch.Cast.toString(args.ENABLED) === '开启';
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setPhysicsEnabled(enabled);
                this.setNeedsRender();
            }
        }
        setReflectionEnabled(args) {
            const containerId = Scratch.Cast.toString(args.ID);
            const enabled = Scratch.Cast.toString(args.ENABLED) === '开启';
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setReflectionEnabled(enabled);
                this.setNeedsRender();
            }
        }
        showContainer(args) {
            const containerId = Scratch.Cast.toString(args.ID);
            const containerData = this.containers.get(containerId);
            if (containerData && containerData.canvas) {
                containerData.canvas.style.display = 'block';
            }
        }
        hideContainer(args) {
            const containerId = Scratch.Cast.toString(args.ID);
            const containerData = this.containers.get(containerId);
            if (containerData && containerData.canvas) {
                containerData.canvas.style.display = 'none';
            }
        }
        deleteContainer(args) {
            const containerId = Scratch.Cast.toString(args.ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                if (containerData.sceneManager) {
                    containerData.sceneManager.dispose();
                }
                if (containerData.canvas && containerData.canvas.parentNode) {
                    containerData.canvas.parentNode.removeChild(containerData.canvas);
                }
                this.containers.delete(containerId);
                console.log(`容器 ${containerId} 已删除`);
            }
        }
        setModelMaterial(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const materialType = Scratch.Cast.toString(args.MATERIAL_TYPE);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelMaterial(modelId, materialType);
                this.setNeedsRender();
            }
        }
        setModelPBRValues(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const metalness = Scratch.Cast.toNumber(args.METALNESS);
            const roughness = Scratch.Cast.toNumber(args.ROUGHNESS);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelPBRValues(modelId, metalness, roughness);
                this.setNeedsRender();
            }
        }
        async setModelMRMap(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const texture = Scratch.Cast.toString(args.TEXTURE);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                await containerData.sceneManager.setModelMRMap(modelId, texture);
                this.setNeedsRender();
            }
        }
        async setModelNormalMap(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const texture = Scratch.Cast.toString(args.TEXTURE);
            const scaleX = Scratch.Cast.toNumber(args.SCALE_X);
            const scaleY = Scratch.Cast.toNumber(args.SCALE_Y);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                await containerData.sceneManager.setModelNormalMap(modelId, texture, scaleX, scaleY);
                this.setNeedsRender();
            }
        }
        setModelTextureSampling(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const mapType = Scratch.Cast.toString(args.MAP_TYPE);
            const wrapS = Scratch.Cast.toString(args.WRAP_S);
            const wrapT = Scratch.Cast.toString(args.WRAP_T);
            const repeatX = Scratch.Cast.toNumber(args.REPEAT_X);
            const repeatY = Scratch.Cast.toNumber(args.REPEAT_Y);
            const offsetX = Scratch.Cast.toNumber(args.OFFSET_X);
            const offsetY = Scratch.Cast.toNumber(args.OFFSET_Y);
            const rotation = Scratch.Cast.toNumber(args.ROTATION);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelTextureSampling(modelId, mapType, wrapS, wrapT, repeatX, repeatY, offsetX, offsetY, rotation);
                this.setNeedsRender();
            }
        }
        applyForce(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const fx = Scratch.Cast.toNumber(args.FX);
            const fy = Scratch.Cast.toNumber(args.FY);
            const fz = Scratch.Cast.toNumber(args.FZ);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.applyForce(modelId, fx, fy, fz);
                this.setNeedsRender();
            }
        }
        setModelVelocity(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const vx = Scratch.Cast.toNumber(args.VX);
            const vy = Scratch.Cast.toNumber(args.VY);
            const vz = Scratch.Cast.toNumber(args.VZ);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelVelocity(modelId, vx, vy, vz);
                this.setNeedsRender();
            }
        }
        setGlobalGravity(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const gx = Scratch.Cast.toNumber(args.GX);
            const gy = Scratch.Cast.toNumber(args.GY);
            const gz = Scratch.Cast.toNumber(args.GZ);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setGlobalGravity(gx, gy, gz);
                this.setNeedsRender();
            }
        }
        setGlobalFriction(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const friction = Scratch.Cast.toNumber(args.FRICTION);
            const c = this.containers.get(containerId);
            if (c) {
                c.sceneManager.setGlobalFriction(friction);
                this.setNeedsRender();
            }
        }
        setGlobalRestitution(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const restitution = Scratch.Cast.toNumber(args.RESTITUTION);
            const c = this.containers.get(containerId);
            if (c) {
                c.sceneManager.setGlobalRestitution(restitution);
                this.setNeedsRender();
            }
        }
        setModelContactProperties(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const friction = Scratch.Cast.toNumber(args.FRICTION);
            const restitution = Scratch.Cast.toNumber(args.RESTITUTION);
            const c = this.containers.get(containerId);
            if (c) {
                c.sceneManager.setModelContactProperties(modelId, friction, restitution);
                this.setNeedsRender();
            }
        }
        setModelDamping(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const ld = Scratch.Cast.toNumber(args.LD);
            const ad = Scratch.Cast.toNumber(args.AD);
            const c = this.containers.get(containerId);
            if (c) {
                c.sceneManager.setModelDamping(modelId, ld, ad);
                this.setNeedsRender();
            }
        }
        setGlobalDamping(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const ld = Scratch.Cast.toNumber(args.LD);
            const ad = Scratch.Cast.toNumber(args.AD);
            const c = this.containers.get(containerId);
            if (c) {
                c.sceneManager.setGlobalDamping(ld, ad);
                this.setNeedsRender();
            }
        }
        setModelAngularVelocityLimit(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const wmax = Scratch.Cast.toNumber(args.WMAX);
            const c = this.containers.get(containerId);
            if (c) {
                c.sceneManager.setModelAngularVelocityLimit(modelId, wmax);
                this.setNeedsRender();
            }
        }
        setGlobalAngularVelocityLimit(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const wmax = Scratch.Cast.toNumber(args.WMAX);
            const c = this.containers.get(containerId);
            if (c) {
                c.sceneManager.setGlobalAngularVelocityLimit(wmax);
                this.setNeedsRender();
            }
        }
        addLight(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const lightId = Scratch.Cast.toString(args.LIGHT_ID);
            const type = Scratch.Cast.toString(args.TYPE);
            const x = Scratch.Cast.toNumber(args.X);
            const y = Scratch.Cast.toNumber(args.Y);
            const z = Scratch.Cast.toNumber(args.Z);
            const color = Scratch.Cast.toString(args.COLOR);
            const intensity = Scratch.Cast.toNumber(args.INTENSITY);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.addLight(lightId, type, x, y, z, color, intensity);
                this.setNeedsRender();
            }
        }
        setLightPosition(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const lightId = Scratch.Cast.toString(args.LIGHT_ID);
            const x = Scratch.Cast.toNumber(args.X);
            const y = Scratch.Cast.toNumber(args.Y);
            const z = Scratch.Cast.toNumber(args.Z);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setLightPosition(lightId, x, y, z);
                this.setNeedsRender();
            }
        }
        setLightIntensity(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const lightId = Scratch.Cast.toString(args.LIGHT_ID);
            const intensity = Scratch.Cast.toNumber(args.INTENSITY);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setLightIntensity(lightId, intensity);
                this.setNeedsRender();
            }
        }
        setLightColor(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const lightId = Scratch.Cast.toString(args.LIGHT_ID);
            const color = Scratch.Cast.toString(args.COLOR);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setLightColor(lightId, color);
                this.setNeedsRender();
            }
        }
        setShadowQuality(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const quality = Scratch.Cast.toString(args.QUALITY);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setShadowQuality(quality);
                this.setNeedsRender();
            }
        }
        setModelVelocityX(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const vx = Scratch.Cast.toNumber(args.VX);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelVelocityX(modelId, vx);
                this.setNeedsRender();
            }
        }
        setModelVelocityY(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const vy = Scratch.Cast.toNumber(args.VY);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelVelocityY(modelId, vy);
                this.setNeedsRender();
            }
        }
        setModelVelocityZ(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const vz = Scratch.Cast.toNumber(args.VZ);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelVelocityZ(modelId, vz);
                this.setNeedsRender();
            }
        }
        setModelOpacity(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const alpha = Scratch.Cast.toNumber(args.ALPHA);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelOpacity(modelId, alpha);
                this.setNeedsRender();
            }
        }
        setModelCastShadow(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const enabledStr = Scratch.Cast.toString(args.ENABLED);
            const enable = enabledStr === '开启';
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelCastShadow(modelId, enable);
                this.setNeedsRender();
            }
        }
        setAmbientLight(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const intensity = Scratch.Cast.toNumber(args.INTENSITY);
            const color = Scratch.Cast.toString(args.COLOR);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setAmbientLight(intensity, color);
                this.setNeedsRender();
            }
        }
        setDirectionalLight(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const lightId = Scratch.Cast.toString(args.LIGHT_ID);
            const x = Scratch.Cast.toNumber(args.X);
            const y = Scratch.Cast.toNumber(args.Y);
            const z = Scratch.Cast.toNumber(args.Z);
            const targetX = Scratch.Cast.toNumber(args.TARGET_X);
            const targetY = Scratch.Cast.toNumber(args.TARGET_Y);
            const targetZ = Scratch.Cast.toNumber(args.TARGET_Z);
            const intensity = Scratch.Cast.toNumber(args.INTENSITY);
            const color = Scratch.Cast.toString(args.COLOR);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setDirectionalLight(lightId, x, y, z, targetX, targetY, targetZ, intensity, color);
                this.setNeedsRender();
            }
        }
        setSpotLight(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const lightId = Scratch.Cast.toString(args.LIGHT_ID);
            const x = Scratch.Cast.toNumber(args.X);
            const y = Scratch.Cast.toNumber(args.Y);
            const z = Scratch.Cast.toNumber(args.Z);
            const targetX = Scratch.Cast.toNumber(args.TARGET_X);
            const targetY = Scratch.Cast.toNumber(args.TARGET_Y);
            const targetZ = Scratch.Cast.toNumber(args.TARGET_Z);
            const angle = Scratch.Cast.toNumber(args.ANGLE);
            const penumbra = Scratch.Cast.toNumber(args.PENUMBRA);
            const decay = Scratch.Cast.toNumber(args.DECAY);
            const distance = Scratch.Cast.toNumber(args.DISTANCE);
            const intensity = Scratch.Cast.toNumber(args.INTENSITY);
            const color = Scratch.Cast.toString(args.COLOR);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setSpotLight(lightId, x, y, z, targetX, targetY, targetZ, angle, penumbra, decay, distance, intensity, color);
                this.setNeedsRender();
            }
        }
        addParticle(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const particleId = Scratch.Cast.toString(args.PARTICLE_ID);
            const x = Scratch.Cast.toNumber(args.X);
            const y = Scratch.Cast.toNumber(args.Y);
            const z = Scratch.Cast.toNumber(args.Z);
            const color = Scratch.Cast.toString(args.COLOR);
            const intensity = Scratch.Cast.toNumber(args.INTENSITY);
            const spread = Scratch.Cast.toNumber(args.SPREAD);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.addParticle(particleId, x, y, z, color, intensity, spread);
                this.setNeedsRender();
            }
        }
        loadGLTFModel(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const base64Data = Scratch.Cast.toString(args.BASE64_DATA);
            const x = Scratch.Cast.toNumber(args.X);
            const y = Scratch.Cast.toNumber(args.Y);
            const z = Scratch.Cast.toNumber(args.Z);
            const scale = Scratch.Cast.toNumber(args.SCALE);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.loadGLTFFromBase64(modelId, base64Data, x, y, z, scale)
                    .then(() => {
                        this.setNeedsRender();
                    })
                    .catch(error => {
                        console.error('GLTF模型加载失败:', error);
                    });
            }
        }
        setModelPhysics(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const physicsType = Scratch.Cast.toString(args.PHYSICS_TYPE);
            const mass = Scratch.Cast.toNumber(args.MASS);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelPhysics(modelId, physicsType, mass);
                this.setNeedsRender();
            }
        }
        playModelAnimation(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const animationName = Scratch.Cast.toString(args.ANIMATION_NAME);
            const loopMode = Scratch.Cast.toString(args.LOOP_MODE);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.playAnimation(modelId, animationName, loopMode);
                this.setNeedsRender();
            }
        }
        setModelAnimationFrameCount(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const frameCount = Scratch.Cast.toNumber(args.FRAME_COUNT);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setAnimationPlaybackFrameCount(modelId, frameCount);
                this.setNeedsRender();
            }
        }
        setModelAnimationProgressFrame(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const frame = Scratch.Cast.toNumber(args.FRAME);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setAnimationProgressFrame(modelId, frame);
                this.setNeedsRender();
            }
        }
        setModelAnimationTransition(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const transitionFrames = Scratch.Cast.toNumber(args.TRANSITION_FRAMES);
            const easing = Scratch.Cast.toString(args.EASING);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setAnimationTransition(modelId, transitionFrames, easing);
                this.setNeedsRender();
            }
        }
        stopModelAnimation(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.stopAnimation(modelId);
                this.setNeedsRender();
            }
        }
        getModelAnimations(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const animations = containerData.sceneManager.getAnimationList(modelId);
                return JSON.stringify(animations);
            }
            return '[]';
        }
        checkModelCollision(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId1 = Scratch.Cast.toString(args.MODEL_ID1);
            const modelId2 = Scratch.Cast.toString(args.MODEL_ID2);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                return containerData.sceneManager.checkCollision(modelId1, modelId2);
            }
            return false;
        }
        getModelDistance(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId1 = Scratch.Cast.toString(args.MODEL_ID1);
            const modelId2 = Scratch.Cast.toString(args.MODEL_ID2);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                return containerData.sceneManager.getModelDistance(modelId1, modelId2);
            }
            return -1;
        }
        checkModelInRange(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const x = Scratch.Cast.toNumber(args.X);
            const y = Scratch.Cast.toNumber(args.Y);
            const z = Scratch.Cast.toNumber(args.Z);
            const range = Scratch.Cast.toNumber(args.RANGE);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                return containerData.sceneManager.checkModelInRange(modelId, x, y, z, range);
            }
            return false;
        }
        getAllCollisions(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const collisions = containerData.sceneManager.getAllCollisions();
                return JSON.stringify(collisions);
            }
            return '[]';
        }
        setModelPosition(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const x = Scratch.Cast.toNumber(args.X);
            const y = Scratch.Cast.toNumber(args.Y);
            const z = Scratch.Cast.toNumber(args.Z);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelPosition(modelId, x, y, z);
            }
        }
        setModelRotation(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const x = Scratch.Cast.toNumber(args.X);
            const y = Scratch.Cast.toNumber(args.Y);
            const z = Scratch.Cast.toNumber(args.Z);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelRotation(modelId, x, y, z);
            }
        }
        setModelScale(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const x = Scratch.Cast.toNumber(args.X);
            const y = Scratch.Cast.toNumber(args.Y);
            const z = Scratch.Cast.toNumber(args.Z);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelScale(modelId, x, y, z);
            }
        }
        setModelRenderSide(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const side = Scratch.Cast.toString(args.SIDE);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setModelRenderSide(modelId, side);
            }
        }
        showCollisionBoxes(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const show = Scratch.Cast.toString(args.SHOW);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.showCollisionBoxes(show === '显示');
            }
        }
        removeModelPhysics(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.removeModelPhysics(modelId);
            }
        }
        getModelPositionX(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const position = containerData.sceneManager.getModelPosition(modelId);
                return position.x;
            }
            return 0;
        }
        getModelPositionY(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const position = containerData.sceneManager.getModelPosition(modelId);
                return position.y;
            }
            return 0;
        }
        getModelPositionZ(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const position = containerData.sceneManager.getModelPosition(modelId);
                return position.z;
            }
            return 0;
        }
        getModelRotationX(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const rotation = containerData.sceneManager.getModelRotation(modelId);
                return rotation.x;
            }
            return 0;
        }
        getModelRotationY(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const rotation = containerData.sceneManager.getModelRotation(modelId);
                return rotation.y;
            }
            return 0;
        }
        getModelRotationZ(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const rotation = containerData.sceneManager.getModelRotation(modelId);
                return rotation.z;
            }
            return 0;
        }
        getModelScaleX(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const scale = containerData.sceneManager.getModelScale(modelId);
                return scale.x;
            }
            return 1;
        }
        getModelScaleY(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const scale = containerData.sceneManager.getModelScale(modelId);
                return scale.y;
            }
            return 1;
        }
        getModelScaleZ(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const scale = containerData.sceneManager.getModelScale(modelId);
                return scale.z;
            }
            return 1;
        }
        applyFilter(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const filterType = Scratch.Cast.toString(args.FILTER_TYPE);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const filterMap = {
                    '复古': 'sepia',
                    '灰度': 'grayscale',
                    '复古色调': 'vintage',
                    '黑金': 'blackgold',
                    '鲜艳': 'vivid',
                    '褪色': 'faded',
                    '电影': 'cinematic',
                    '老电视': 'oldtv',
                    '漫画': 'comic',
                    '素描': 'sketch'
                };
                const englishFilterType = filterMap[filterType] || filterType;
                containerData.sceneManager.applyFilter(englishFilterType);
            }
        }
        disableFilter(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.disableFilter();
            }
        }
        getCurrentFilter(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const currentFilter = containerData.sceneManager.getCurrentFilter();
                const filterMap = {
                    'sepia': '复古',
                    'grayscale': '灰度',
                    'vintage': '复古色调',
                    'blackgold': '黑金',
                    'vivid': '鲜艳',
                    'faded': '褪色',
                    'cinematic': '电影',
                    'oldtv': '老电视',
                    'comic': '漫画',
                    'sketch': '素描'
                };
                return filterMap[currentFilter] || currentFilter || '无';
            }
            return '无';
        }
        isFilterEnabled(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                return containerData.sceneManager.isFilterEnabled();
            }
            return false;
        }
        applyFilterWithIntensity(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const filterType = Scratch.Cast.toString(args.FILTER_TYPE);
            const intensity = Math.max(0, Math.min(100, Scratch.Cast.toNumber(args.INTENSITY)));
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const filterMap = {
                    '复古': 'sepia',
                    '灰度': 'grayscale',
                    '复古色调': 'vintage',
                    '黑金': 'blackgold',
                    '鲜艳': 'vivid',
                    '褪色': 'faded',
                    '电影': 'cinematic',
                    '老电视': 'oldtv',
                    '漫画': 'comic',
                    '素描': 'sketch'
                };
                const englishFilterType = filterMap[filterType] || filterType;
                containerData.sceneManager.applyFilter(englishFilterType, intensity);
            }
        }
        setFilterIntensity(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const intensity = Math.max(0, Math.min(100, Scratch.Cast.toNumber(args.INTENSITY)));
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setFilterIntensity(intensity);
            }
        }
        getFilterIntensity(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                return containerData.sceneManager.getFilterIntensity();
            }
            return 1.0;
        }
        enableSkybox(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const enable = Scratch.Cast.toString(args.ENABLE) === '开启';
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.enableSkybox(enable);
            }
        }
        setSunPosition(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const azimuth = Scratch.Cast.toNumber(args.AZIMUTH);
            const elevation = Scratch.Cast.toNumber(args.ELEVATION);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                const elevationStr = Scratch.Cast.toString(args.ELEVATION);
                const hasElevation = elevationStr !== undefined && elevationStr !== null && elevationStr !== '';
                if (!hasElevation || Number.isNaN(elevation)) {
                    containerData.sceneManager.setSunByDayAngle(azimuth);
                } else {
                    containerData.sceneManager.setSunPosition(azimuth, elevation);
                }
            }
        }
        setSunByDayAngle(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const angle = Scratch.Cast.toNumber(args.DAY_ANGLE);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setSunByDayAngle(angle);
            }
        }
        setSunNoonVertical(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setSunNoonVertical();
            }
        }
        setSkyTurbidity(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const turbidity = Scratch.Cast.toNumber(args.TURBIDITY);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setSkyTurbidity(turbidity);
            }
        }
        setSkyRayleigh(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const rayleigh = Scratch.Cast.toNumber(args.RAYLEIGH);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setSkyRayleigh(rayleigh);
            }
        }
        setAntialiasing(args) {
            const containerId = Scratch.Cast.toString(args.ID);
            const enabled = args.ENABLED === '开启';
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setAntialiasing(enabled);
            }
        }
        setVSync(args) {
            const containerId = Scratch.Cast.toString(args.ID);
            const enabled = args.ENABLED === '开启';
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setVSync(enabled);
            }
        }
        setSkyTimeOfDay(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const timeOfDay = Scratch.Cast.toString(args.TIME_OF_DAY);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setSkyTimeOfDay(timeOfDay);
            }
        }
        setSkyCustomTime(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const hour = Scratch.Cast.toNumber(args.HOUR);
            const minute = Scratch.Cast.toNumber(args.MINUTE);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setSkyCustomTime(hour, minute);
            }
        }
        enableSkyClouds(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const enabled = args.ENABLE === '开启';
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.enableSkyClouds(enabled);
            }
        }
        setSkyCloudDensity(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const density = Scratch.Cast.toNumber(args.DENSITY);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setSkyCloudDensity(density);
            }
        }
        setSkyCloudType(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const cloudType = Scratch.Cast.toString(args.CLOUD_TYPE);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setSkyCloudType(cloudType);
            }
        }
        enableSkyStars(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const enabled = args.ENABLE === '开启';
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.enableSkyStars(enabled);
            }
        }
        setSkyStarIntensity(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const intensity = Scratch.Cast.toNumber(args.INTENSITY);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.setSkyStarIntensity(intensity);
            }
        }
        addMetallicReflection(args) {
            const containerId = Scratch.Cast.toString(args.CONTAINER_ID);
            const modelId = Scratch.Cast.toString(args.MODEL_ID);
            const metalness = Scratch.Cast.toNumber(args.METALNESS);
            const roughness = Scratch.Cast.toNumber(args.ROUGHNESS);
            const containerData = this.containers.get(containerId);
            if (containerData) {
                containerData.sceneManager.addMetallicReflection(modelId, metalness, roughness);
                this.setNeedsRender();
            }
        }
}
class ThreeSceneManager {
    constructor(containerId, extension) {
        this.containerId = containerId;
        this.extension = extension;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.objects = new Map();
        this.models = new Map();
        this.lights = new Map();
        this.particles = new Map();
        this.physicsWorld = null;
        this.physicsEnabled = false;
        this.reflectionEnabled = false;
        this.defaultMaterial = null;
        this.enablePhysicsDebug = false;
        this.cameraRotationX = 0;
        this.cameraRotationY = 0;
        this.cameraRotationZ = 0;
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.limitPitch = true; 
        this.composer = null;
        this.renderPass = null;
        this.currentFilterPass = null;
        this.currentFilter = null;
        this.collisionBoxes = new Map(); 
        this.showingCollisionBoxes = false;
        this.filtersEnabled = false;
        this.sky = null;
        this.sun = new THREE.Vector3();
        this.sunLight = null;
        this.skyEnabled = false;
        this.shadowMapSize = 2048;
        this.fixedShadowFrustumEnabled = false;
        this.fixedShadowCenter = new THREE.Vector3(0, 0, 0);
        this.fixedShadowSize = new THREE.Vector3(600, 300, 600);
        this.antialiasingEnabled = true;
        this.vsyncEnabled = true;
        this.currentTimeOfDay = '正午';
        this.customHour = 12;
        this.customMinute = 0;
        this.cloudsEnabled = false;
        this.cloudDensity = 0.5;
        this.cloudType = '贴图云'; 
        this.starsEnabled = false;
        this.starIntensity = 1.0;
        this.cloudParticles = [];
        this.constraints = new Map(); 
        this._destroyedConstraintsEvents = []; 
        this.lastConstraintEvent = null; 
        this.starParticles = null;
        this.collisionOptimizationLevel = 'balanced';
    }
    initializeScene(containerElement) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.camera = new THREE.PerspectiveCamera(75, 480/360, 0.1, 10000);
        this.camera.position.set(0, 0, 500);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance'
        });
        this.renderer.autoClear = true;
        this.renderer.setSize(480, 360);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.loadWaterLibrary();
        this.addBasicLights();
        this.initializePhysics();
        this.initializeFilters();
        console.log(`场景管理器 ${this.containerId} 初始化完成`);
    }
    loadWaterLibrary() {
        if (window.THREE && window.THREE.Water) {
            console.log('Water.js 已加载');
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/three@0.128.0/examples/js/objects/Water.js';
            script.onload = () => {
                console.log('Water.js 库加载成功');
                resolve();
            };
            script.onerror = (error) => {
                console.warn('外部Water.js加载失败，使用本地版本');
                const localScript = document.createElement('script');
                localScript.src = './plugins/Water.js';
                localScript.onload = () => {
                    console.log('本地Water.js库加载成功');
                    resolve();
                };
                localScript.onerror = () => {
                    console.error('Water.js库加载失败');
                    reject(error);
                };
                document.head.appendChild(localScript);
            };
            document.head.appendChild(script);
        });
    }
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                console.error('WebGL 上下文创建失败');
                return false;
            }
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                console.log('WebGL 渲染器:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
                console.log('WebGL 供应商:', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
            }
            return true;
        } catch (error) {
            console.error('WebGL 支持检测失败:', error);
            return false;
        }
    }
    addBasicLights() {
        const ambientLight = new THREE.AmbientLight(0x202040, 0.15);
        this.scene.add(ambientLight);
        this.lights.set('ambient', ambientLight);
        this.createEnvironmentMap();
    }
    initializeSky() {
        if (!window.THREE.Sky) {
            console.warn('Sky.js 未加载，无法创建天空盒');
            return;
        }
        this.sky = new THREE.Sky();
        this.sky.scale.setScalar(450000);
        this.scene.add(this.sky);
        const skyUniforms = this.sky.material.uniforms;
        skyUniforms['turbidity'].value = 10;
        skyUniforms['rayleigh'].value = 2;
        skyUniforms['mieCoefficient'].value = 0.005;
        skyUniforms['mieDirectionalG'].value = 0.8;
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(0, 100, 0); 
        this.sunLight.target.position.set(0, 0, 0); 
        this.scene.add(this.sunLight.target); 
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.scene.add(this.sunLight);
        this.lights.set('sun', this.sunLight);
        this.sunLight.shadow.bias = -0.0005;
        this.sunLight.shadow.normalBias = 0.03;
        this.updateSunShadowCameraBounds();
        this.setSunPosition(90, 45);
        this.skyEnabled = true;
    }
    setSunPosition(azimuth, elevation) {
        if (isFinite(elevation) && Math.abs(elevation - 90) < 0.0001) {
            elevation = 90;
        }
        if (!this.sky || !this.sunLight) {
            console.warn('天空盒未初始化');
            return;
        }
        const azimuthRad = THREE.MathUtils.degToRad(azimuth);
        const elevationRad = THREE.MathUtils.degToRad(elevation);
        const x = Math.cos(elevationRad) * Math.sin(azimuthRad);
        const y = Math.sin(elevationRad);
        const z = Math.cos(elevationRad) * Math.cos(azimuthRad);
        this.sun.set(x, y, z).normalize();
        this.sky.material.uniforms['sunPosition'].value.copy(this.sun);
        const sunDistance = 1000; 
        this.sunLight.position.copy(this.sun).multiplyScalar(sunDistance);
        this.sunLight.target.position.set(0, 0, 0);
        if (!this.sunLight.target.parent) {
            this.scene.add(this.sunLight.target);
        }
        this.sunLight.target.updateMatrixWorld();
        this.sunLight.updateMatrixWorld();
        const sunHeight = Math.max(0, this.sun.y);
        this.sunLight.intensity = Math.max(0.1, sunHeight * 2);
        if (sunHeight < 0.3) {
            this.sunLight.color.setHSL(0.1, 0.7, 0.9); 
        } else {
            this.sunLight.color.setHSL(0.1, 0.1, 1.0); 
        }
        this.updateSunShadowCameraBounds();
        this.sunLight.shadow.camera.updateProjectionMatrix();
        console.log(`太阳方向向量: (${this.sun.x.toFixed(3)}, ${this.sun.y.toFixed(3)}, ${this.sun.z.toFixed(3)})`);
        console.log(`光照位置: (${this.sunLight.position.x.toFixed(2)}, ${this.sunLight.position.y.toFixed(2)}, ${this.sunLight.position.z.toFixed(2)})`);
        console.log(`光照目标: (${this.sunLight.target.position.x.toFixed(2)}, ${this.sunLight.target.position.y.toFixed(2)}, ${this.sunLight.target.position.z.toFixed(2)})`);
        console.log(`光照强度: ${this.sunLight.intensity.toFixed(2)}`);
    }
    setSunByDayAngle(angleDeg) {
        if (!isFinite(angleDeg)) return;
        const a = ((angleDeg % 360) + 360) % 360; 
        let elevation;
        if (a <= 180) {
            elevation = Math.sin(a * Math.PI / 180) * 90;
        } else {
            elevation = -Math.sin((a - 180) * Math.PI / 180) * 90;
        }
        if (Math.abs(a - 90) < 1e-6) elevation = 90;
        const dir = new THREE.Vector3();
        const theta = a * Math.PI / 180;
        const phi = (90 - elevation) * Math.PI / 180;
        dir.set(
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta)
        ).normalize();
        if (this.water) {
            if (this.water.material && this.water.material.uniforms && this.water.material.uniforms.sunDirection) {
                this.water.material.uniforms.sunDirection.value.copy(dir);
            }
            if (this.water.material && this.water.material.uniforms && this.water.material.uniforms.sunColor) {
                this.water.material.uniforms.sunColor.value.set(1.0, 1.0, 0.95);
            }
        }
        const azimuth = a; 
        this.setSunPosition(azimuth, elevation);
    }
    setSunNoonVertical(azimuthOverride) {
        let az = azimuthOverride;
        if (!isFinite(az)) {
            az = Math.atan2(this.sun.z, this.sun.x) * 180 / Math.PI;
            if (!isFinite(az)) az = 0;
        }
        this.setSunPosition(az, 90);
    }
    updateSunShadowCameraBounds(padding = 50) {
        if (!this.sunLight || !this.sunLight.shadow || !this.sunLight.shadow.camera) return;
        const cam = this.sunLight.shadow.camera;
        try {
            if (this.fixedShadowFrustumEnabled && this.fixedShadowCenter && this.fixedShadowSize) {
                const center = this.fixedShadowCenter.clone();
                const size = this.fixedShadowSize.clone();
                this.sunLight.target.position.copy(center);
                this.sunLight.target.updateMatrixWorld();
                const dir = new THREE.Vector3().copy(this.sun);
                if (dir.lengthSq() < 1e-6) {
                    dir.copy(this.sunLight.position).sub(this.sunLight.target.position);
                }
                if (dir.lengthSq() < 1e-6) dir.set(0, -1, 0);
                dir.normalize();
                const halfX = Math.max(1, size.x * 0.5);
                const halfY = Math.max(1, size.y * 0.5);
                const halfZ = Math.max(1, size.z * 0.5);
                const distance = halfZ + padding + 50;
                this.sunLight.position.copy(center.clone().add(dir.multiplyScalar(distance)));
                this.sunLight.updateMatrixWorld();
                const cam = this.sunLight.shadow.camera;
                cam.position.copy(this.sunLight.position);
                cam.up.set(0, 1, 0);
                cam.lookAt(center);
                cam.updateMatrixWorld(true);
                cam.left = -halfX; cam.right = halfX; cam.top = halfY; cam.bottom = -halfY;
                cam.near = Math.max(0.1, distance - halfZ - padding);
                cam.far = Math.max(cam.near + 10, distance + halfZ + padding);
                cam.updateProjectionMatrix();
                return;
            }
            const box = new THREE.Box3();
            let hasAny = false;
            for (const child of this.scene.children) {
                if (child === this.sky || child === this.sunLight || child === this.sunLight.target) continue;
                if (child.isLight || child.isHelper) continue;
                if (child.isWater || (child.userData && child.userData.type === 'water')) continue;
                const childBox = this.getModelWorldBBox(child);
                if (!childBox.isEmpty()) {
                    if (!hasAny) {
                        box.copy(childBox);
                        hasAny = true;
                    } else {
                        box.union(childBox);
                    }
                }
            }
            if (!hasAny) {
                cam.left = -100; cam.right = 100; cam.top = 100; cam.bottom = -100;
                cam.near = 0.5; cam.far = 500;
                cam.updateProjectionMatrix();
                return;
            }
            const size = new THREE.Vector3();
            box.getSize(size);
            const center = new THREE.Vector3();
            box.getCenter(center);
            this.sunLight.target.position.copy(center);
            this.sunLight.target.updateMatrixWorld();
            const halfX = Math.max(size.x, size.z) * 0.5 + padding;
            const halfY = size.y * 0.5 + padding;
            const targetPos = center.clone();
            const dir = new THREE.Vector3().copy(this.sunLight.position).sub(this.sunLight.target.position);
            if (dir.lengthSq() < 1e-6 && this.sun) { dir.copy(this.sun); }
            dir.normalize();
            const radius = Math.max(halfX, halfY);
            this.sunLight.position.copy(targetPos.clone().add(dir.multiplyScalar(radius * 2 + padding)));
            this.sunLight.updateMatrixWorld();
            cam.position.copy(this.sunLight.position);
            cam.up.set(0, 1, 0);
            cam.lookAt(this.sunLight.target.position);
            cam.updateMatrixWorld(true);
            const points = [
                new THREE.Vector3(box.min.x, box.min.y, box.min.z),
                new THREE.Vector3(box.min.x, box.min.y, box.max.z),
                new THREE.Vector3(box.min.x, box.max.y, box.min.z),
                new THREE.Vector3(box.min.x, box.max.y, box.max.z),
                new THREE.Vector3(box.max.x, box.min.y, box.min.z),
                new THREE.Vector3(box.max.x, box.min.y, box.max.z),
                new THREE.Vector3(box.max.x, box.max.y, box.min.z),
                new THREE.Vector3(box.max.x, box.max.y, box.max.z),
            ];
            const inv = new THREE.Matrix4();
            if (typeof inv.invert === 'function') {
                inv.copy(cam.matrixWorld).invert();
            } else if (typeof inv.getInverse === 'function') {
                inv.getInverse(cam.matrixWorld);
            }
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
            for (const p of points) {
                p.applyMatrix4(inv);
                if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
                if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
            }
            cam.left = minX - padding;
            cam.right = maxX + padding;
            cam.top = maxY + padding;
            cam.bottom = minY - padding;
            cam.near = Math.max(0.1, -maxZ + 0.1);
            cam.far = Math.max(cam.near + 10, -minZ + padding);
            cam.updateProjectionMatrix();
        } catch (e) {
            console.warn('更新太阳阴影相机范围失败:', e);
        }
    }
    enableFixedShadowFrustum(enabled) {
        this.fixedShadowFrustumEnabled = !!enabled;
        this.updateSunShadowCameraBounds();
    }
    setFixedShadowCenter(x, y, z) {
        if (!this.fixedShadowCenter) this.fixedShadowCenter = new THREE.Vector3();
        this.fixedShadowCenter.set(x, y, z);
        if (this.fixedShadowFrustumEnabled) this.updateSunShadowCameraBounds();
    }
    setFixedShadowSize(width, height, depth) {
        if (!this.fixedShadowSize) this.fixedShadowSize = new THREE.Vector3();
        this.fixedShadowSize.set(Math.max(1, width), Math.max(1, height), Math.max(1, depth));
        if (this.fixedShadowFrustumEnabled) this.updateSunShadowCameraBounds();
    }
    enableSkybox(enabled) {
        if (!this.sky) {
            if (enabled) {
                this.initializeSky();
            }
            return;
        }
        this.skyEnabled = enabled;
        this.sky.visible = enabled;
        if (this.sunLight) {
            this.sunLight.visible = enabled;
        }
        if (!enabled) {
            this.scene.background = new THREE.Color(0x87CEEB);
        } else {
            this.scene.background = null; 
        }
    }
    initializeReflectionSystem() {
        if (!window.THREE.ReflectorForSSRPass) {
            console.warn('ReflectorForSSRPass.js 未加载，无法创建反射系统');
            return;
        }
        this.reflectionRenderTarget = new THREE.WebGLRenderTarget(512, 512, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBFormat
        });
        this.reflectionEnabled = true;
    }
    addMetallicReflection(target, metalness = 1.0, roughness = 0.1, reflectivity = 0.8) {
        if (!this.reflectionEnabled) {
            this.initializeReflectionSystem();
        }
        if (!window.THREE.ReflectorForSSRPass) {
            console.warn('ReflectorForSSRPass.js 未加载，无法添加反射');
            return;
        }
        const object = (typeof target === 'string') ? this.getObjectById(target) : target;
        if (!object) return;
        const m = this.clamp01(metalness);
        const r = this.clamp01(roughness);
        object.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((material) => {
                    if (material && (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial)) {
                        material.metalness = Math.max(material.metalness || 0, m);
                        material.roughness = Math.min(material.roughness || 1, r);
                        material.reflectivity = reflectivity;
                        if (this.scene.environment) {
                            material.envMap = this.scene.environment;
                            material.envMapIntensity = 1.5;
                        }
                        material.needsUpdate = true;
                    }
                });
            }
        });
    }
createComplexCollisionForGLTF(modelId) {
    const model = this.models.get(modelId);
    if (!model) {
        console.warn(`GLTF模型 ${modelId} 不存在`);
        return;
    }
    console.log(`开始为GLTF模型 ${modelId} 创建复杂碰撞体...`);
    try {
        if (model.userData.physicsBody) {
            this.physicsWorld.removeBody(model.userData.physicsBody);
            model.userData.physicsBody = null;
        }
        model.updateMatrixWorld(true);
        const rootPosWorld = new THREE.Vector3();
        const rootQuatWorld = new THREE.Quaternion();
        const rootScaleWorld = new THREE.Vector3();
        model.matrixWorld.decompose(rootPosWorld, rootQuatWorld, rootScaleWorld);
        const body = new CANNON.Body({
            mass: 0, 
            material: this.defaultMaterial
        });
        body.collisionResponse = true;
        body.type = CANNON.Body.STATIC;
        body.allowSleep = false;
        body.wakeUp();
        let totalShapes = 0;
let convexCount = 0;
let trimeshCount = 0;
let boxCount = 0;
let skippedCount = 0;
const isMapCollision = !!(model.userData && model.userData.isMapCollision);
console.log(`开始遍历模型 ${modelId} 的子网格...`);
console.log(`模型位置: (${model.position.x}, ${model.position.y}, ${model.position.z})`);
console.log(`地图碰撞标志: ${isMapCollision}`);
        model.traverse((child) => {
            if (child.isMesh && child.geometry) {
                const geometry = child.geometry;
                child.updateMatrixWorld(true);
                const vertexCount = geometry.attributes.position ? geometry.attributes.position.count : 0;
                console.log(`处理子网格 ${child.name || '未命名'}: ${vertexCount} 个顶点`);
                if (vertexCount === 0) {
                    console.log(`跳过顶点数为0的子网格: ${child.name || '未命名'}`);
                    skippedCount++;
                    return;
                }
                let shape;
                let usingTrimesh = false;
                try {
                    const nameLower = (child.name || '').toLowerCase();
                    const isLikelyBox = nameLower.includes('cube') || nameLower.includes('box') || nameLower.includes('立方') || nameLower.includes('方块');
                    const isLikelyConeOrCyl = nameLower.includes('cone') || nameLower.includes('锥') || nameLower.includes('cyl');
                    const isLikelyCone = nameLower.includes('cone') || nameLower.includes('锥');
                    const preferBox = isLikelyBox || (isLikelyConeOrCyl && false) || vertexCount <= 64; 
                    const childPosition = new THREE.Vector3();
                    const childQuaternion = new THREE.Quaternion();
                    const childScale = new THREE.Vector3();
                    child.matrixWorld.decompose(childPosition, childQuaternion, childScale);
                    const modelPosition = new THREE.Vector3();
                    const modelQuaternion = new THREE.Quaternion();
                    const modelScale = new THREE.Vector3();
                    model.matrixWorld.decompose(modelPosition, modelQuaternion, modelScale);
                    const relativePosition = new THREE.Vector3().copy(childPosition).sub(modelPosition);
                    const relativeQuaternion = new THREE.Quaternion().copy(modelQuaternion).invert().multiply(childQuaternion);
                    const relativePositionLocal = relativePosition.clone().applyQuaternion(new THREE.Quaternion().copy(modelQuaternion).invert());
                    if (isMapCollision) {
                        shape = this.createTrimeshFromGeometry(geometry, child.matrixWorld, rootPosWorld, rootQuatWorld, 'quality');
                        const offset = new CANNON.Vec3(0, 0, 0);
                        const orientation = new CANNON.Quaternion(0, 0, 0, 1);
                        body.addShape(shape, offset, orientation);
                        totalShapes++;
                        usingTrimesh = true;
                        trimeshCount++;
                        console.log(`地图碰撞：为子网格创建三角网格，顶点数: ${vertexCount}`);
                    } else if (isLikelyConeOrCyl) {
                        const bboxLocal = new THREE.Box3();
                        const posAttr = geometry.attributes.position;
                        for (let i = 0; i < posAttr.count; i++) {
                            const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
                            bboxLocal.expandByPoint(v);
                        }
                        const sizeLocal = bboxLocal.getSize(new THREE.Vector3());
                        const centerLocal = bboxLocal.getCenter(new THREE.Vector3());
                        const radiusBottom = Math.max(sizeLocal.x * childScale.x, sizeLocal.z * childScale.z) / 2;
                        const height = Math.max(0.0001, sizeLocal.y * childScale.y);
                        const radiusTop = isLikelyCone ? Math.max(0.0001, radiusBottom * 0.02) : radiusBottom;
                        const cylinder = new CANNON.Cylinder(radiusTop, radiusBottom, height, 16);
                        shape = cylinder;
                        boxCount++; 
                        const centerScaled = new THREE.Vector3(
                            centerLocal.x * childScale.x,
                            centerLocal.y * childScale.y,
                            centerLocal.z * childScale.z
                        );
                        const centerRotated = centerScaled.clone().applyQuaternion(relativeQuaternion);
                        const finalOffset = new THREE.Vector3().copy(relativePositionLocal).add(centerRotated);
                        const offset = new CANNON.Vec3(finalOffset.x, finalOffset.y, finalOffset.z);
                        const orientation = new CANNON.Quaternion(
                            relativeQuaternion.x,
                            relativeQuaternion.y,
                            relativeQuaternion.z,
                            relativeQuaternion.w
                        );
                        body.addShape(shape, offset, orientation);
                        totalShapes++;
                        console.log(`为子网格创建 Cylinder 近似: radiusTop=${radiusTop.toFixed(2)} radiusBottom=${radiusBottom.toFixed(2)} height=${height.toFixed(2)}`);
                    } else if (!isLikelyBox) {
                        shape = this.createConvexPolyhedronFromGeometry(geometry, child.matrixWorld, rootPosWorld, rootQuatWorld);
                        if (shape) {
                            const offset = new CANNON.Vec3(0, 0, 0);
                            const orientation = new CANNON.Quaternion(0, 0, 0, 1);
                            body.addShape(shape, offset, orientation);
                            totalShapes++;
                            if (shape instanceof CANNON.Trimesh) {
                                usingTrimesh = true;
                                trimeshCount++;
                                console.log(`为子网格创建三角网格/凸包回退碰撞体，顶点数: ${vertexCount}`);
                            } else {
                                convexCount++;
                                console.log(`为子网格创建凸包碰撞体，顶点数: ${vertexCount}`);
                            }
                        }
                    } else {
                        const bboxLocal = new THREE.Box3();
                        const posAttr = geometry.attributes.position;
                        for (let i = 0; i < posAttr.count; i++) {
                            const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
                            bboxLocal.expandByPoint(v);
                        }
                        const sizeLocal = bboxLocal.getSize(new THREE.Vector3());
                        const centerLocal = bboxLocal.getCenter(new THREE.Vector3());
                        const halfExtents = new CANNON.Vec3(
                            Math.max(0.0001, (sizeLocal.x * childScale.x) / 2),
                            Math.max(0.0001, (sizeLocal.y * childScale.y) / 2),
                            Math.max(0.0001, (sizeLocal.z * childScale.z) / 2)
                        );
                        shape = new CANNON.Box(halfExtents);
                        boxCount++;
                        console.log(`为子网格创建包围盒碰撞体，顶点数: ${vertexCount}`);
                        const centerScaled = new THREE.Vector3(
                            centerLocal.x * childScale.x,
                            centerLocal.y * childScale.y,
                            centerLocal.z * childScale.z
                        );
                        const centerRotated = centerScaled.clone().applyQuaternion(relativeQuaternion);
                        const finalOffset = new THREE.Vector3().copy(relativePositionLocal).add(centerRotated);
                        const offset = new CANNON.Vec3(finalOffset.x, finalOffset.y, finalOffset.z);
                        const orientation = new CANNON.Quaternion(
                            relativeQuaternion.x,
                            relativeQuaternion.y,
                            relativeQuaternion.z,
                            relativeQuaternion.w
                        );
                        body.addShape(shape, offset, orientation);
                        totalShapes++;
                        console.log(`子网格世界位置: (${childPosition.x.toFixed(2)}, ${childPosition.y.toFixed(2)}, ${childPosition.z.toFixed(2)})`);
                        console.log(`相对位置(世界): (${relativePosition.x.toFixed(2)}, ${relativePosition.y.toFixed(2)}, ${relativePosition.z.toFixed(2)})  相对位置(局部): (${relativePositionLocal.x.toFixed(2)}, ${relativePositionLocal.y.toFixed(2)}, ${relativePositionLocal.z.toFixed(2)})`);
                        console.log(`局部中心: (${centerLocal.x.toFixed(2)}, ${centerLocal.y.toFixed(2)}, ${centerLocal.z.toFixed(2)})  缩放: (${childScale.x.toFixed(2)}, ${childScale.y.toFixed(2)}, ${childScale.z.toFixed(2)})`);
                        console.log(`最终偏移: (${finalOffset.x.toFixed(2)}, ${finalOffset.y.toFixed(2)}, ${finalOffset.z.toFixed(2)})`);
                        console.log(`相对旋转(四元数): (${relativeQuaternion.x.toFixed(4)}, ${relativeQuaternion.y.toFixed(4)}, ${relativeQuaternion.z.toFixed(4)}, ${relativeQuaternion.w.toFixed(4)})`);
                        console.log(`半尺寸: (${halfExtents.x.toFixed(2)}, ${halfExtents.y.toFixed(2)}, ${halfExtents.z.toFixed(2)})`);
                    }
                } catch (error) {
                    console.warn(`为子网格 ${child.name || '未命名'} 创建碰撞体失败:`, error);
                    const fallbackShape = this.createFallbackShape(child);
                    if (fallbackShape) {
                        const childPosition = new THREE.Vector3();
                        const childQuaternion = new THREE.Quaternion();
                        const childScale = new THREE.Vector3();
                        child.matrixWorld.decompose(childPosition, childQuaternion, childScale);
                        const modelPosition = new THREE.Vector3();
                        const modelQuaternion = new THREE.Quaternion();
                        const modelScale = new THREE.Vector3();
                        model.matrixWorld.decompose(modelPosition, modelQuaternion, modelScale);
                        const relativePosition = new THREE.Vector3().copy(childPosition).sub(modelPosition);
                        const relativeQuaternion = new THREE.Quaternion().copy(modelQuaternion).invert().multiply(childQuaternion);
                        const relativePositionLocal = relativePosition.clone().applyQuaternion(new THREE.Quaternion().copy(modelQuaternion).invert());
                        const offset = new CANNON.Vec3(relativePositionLocal.x, relativePositionLocal.y, relativePositionLocal.z);
                        const orientation = new CANNON.Quaternion(
                            relativeQuaternion.x,
                            relativeQuaternion.y,
                            relativeQuaternion.z,
                            relativeQuaternion.w
                        );
                        body.addShape(fallbackShape, offset, orientation);
                        totalShapes++;
                        boxCount++;
                        console.log(`为子网格创建回退碰撞体`);
                    }
                }
                if (!shape) {
                    console.warn(`无法为子网格 ${child.name || '未命名'} 创建任何碰撞体`);
                    skippedCount++;
                }
            }
        });
        console.log(`为模型 ${modelId} 创建了 ${totalShapes} 个碰撞形状 (${convexCount} 个凸包, ${trimeshCount} 个三角网格, ${boxCount} 个包围盒, 跳过 ${skippedCount} 个)`);
        if (totalShapes === 0) {
            console.warn(`模型 ${modelId} 没有可用的碰撞形状，使用默认包围盒`);
            this.createFallbackCollisionForGLTF(modelId);
            return;
        }
        body.position.copy(model.position);
        body.quaternion.copy(model.quaternion);
        this.physicsWorld.addBody(body);
        model.userData.physicsBody = body;
        if (typeof body.updateAABB === 'function') {
            body.updateAABB();
        }
        body.wakeUp();
        console.log(`成功为模型 ${modelId} 创建复杂碰撞体`);
        console.log(`物理体位置: (${body.position.x}, ${body.position.y}, ${body.position.z})`);
    } catch (error) {
        console.error(`为模型 ${modelId} 创建复杂碰撞体失败:`, error);
        this.createFallbackCollisionForGLTF(modelId);
    }
}
createTrimeshFromGeometry(geometry, childWorldMatrix, rootPosWorld, rootQuatWorld, overrideLevel) {
    try {
        console.log(`开始创建三角网格碰撞体...`);
        if (!geometry.attributes.position) throw new Error('几何体没有位置属性');
        const posAttr = geometry.attributes.position;
        const idxAttr = geometry.index;
        const rootRT = new THREE.Matrix4().compose(rootPosWorld, rootQuatWorld, new THREE.Vector3(1,1,1));
        const invRootRT = new THREE.Matrix4().copy(rootRT).invert();
        const relativeMatrix = new THREE.Matrix4().copy(invRootRT).multiply(childWorldMatrix);
        const points = [];
        for (let i = 0; i < posAttr.count; i++) {
            const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
            v.applyMatrix4(relativeMatrix);
            points.push(v);
        }
        const bbox = new THREE.Box3();
        for (const p of points) bbox.expandByPoint(p);
        const size = bbox.getSize(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z);
        const level = overrideLevel || this.collisionOptimizationLevel || 'balanced';
        const frac = level === 'performance' ? 0.005 : (level === 'quality' ? 0.0001 : 0.001);
        const gridStep = Math.max(1e-6, maxAxis * frac);
        const qkey = (v) => `${Math.round(v.x / gridStep) * gridStep},${Math.round(v.y / gridStep) * gridStep},${Math.round(v.z / gridStep) * gridStep}`;
        const vertMap = new Map();
        const uniqueVerts = [];
        const newIndices = [];
        const addVert = (vec) => {
            const k = qkey(vec);
            let id = vertMap.get(k);
            if (id === undefined) {
                id = uniqueVerts.length;
                vertMap.set(k, id);
                uniqueVerts.push(new CANNON.Vec3(vec.x, vec.y, vec.z));
            }
            return id;
        };
        if (idxAttr) {
            for (let i = 0; i < idxAttr.count; i += 3) {
                const a = idxAttr.getX(i);
                const b = idxAttr.getX(i + 1);
                const c = idxAttr.getX(i + 2);
                const ia = addVert(points[a]);
                const ib = addVert(points[b]);
                const ic = addVert(points[c]);
                if (ia !== ib && ib !== ic && ic !== ia) newIndices.push(ia, ib, ic);
            }
        } else {
            for (let i = 0; i < points.length; i += 3) {
                const ia = addVert(points[i]);
                const ib = addVert(points[i + 1]);
                const ic = addVert(points[i + 2]);
                if (ia !== ib && ib !== ic && ic !== ia) newIndices.push(ia, ib, ic);
            }
        }
        if (uniqueVerts.length < 3 || newIndices.length < 3) {
            throw new Error(`简化后顶点或索引不足: 顶点${uniqueVerts.length}, 索引${newIndices.length}`);
        }
        const vertices = [];
        for (const v of uniqueVerts) vertices.push(v.x, v.y, v.z);
        console.log(`创建简化三角网格: 原始 ${posAttr.count} 顶点 -> ${uniqueVerts.length} 唯一顶点, 三角形 ${newIndices.length/3}`);
        const trimesh = new CANNON.Trimesh(vertices, newIndices);
        trimesh.updateAABB();
        if (typeof trimesh.updateBoundingSphereRadius === 'function') trimesh.updateBoundingSphereRadius();
        console.log('三角网格碰撞体创建成功');
        return trimesh;
    } catch (error) {
        console.warn('创建三角网格失败，使用包围盒回退:', error);
        return this.createBoundingBoxFromGeometry(geometry);
    }
}
createConvexPolyhedronFromGeometry(geometry, childWorldMatrix, rootPosWorld, rootQuatWorld) {
    try {
        console.log('开始创建凸包碰撞体...');
        if (!geometry.attributes.position) throw new Error('几何体没有位置属性');
        const posAttr = geometry.attributes.position;
        const idxAttr = geometry.index;
        const rootRT = new THREE.Matrix4().compose(rootPosWorld, rootQuatWorld, new THREE.Vector3(1,1,1));
        const invRootRT = new THREE.Matrix4().copy(rootRT).invert();
        const relativeMatrix = new THREE.Matrix4().copy(invRootRT).multiply(childWorldMatrix);
        const points = [];
        for (let i = 0; i < posAttr.count; i++) {
            const p = new THREE.Vector3().fromBufferAttribute(posAttr, i);
            p.applyMatrix4(relativeMatrix);
            points.push(p);
        }
        const bbox = new THREE.Box3();
        for (const p of points) bbox.expandByPoint(p);
        const size = bbox.getSize(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z);
        const level = this.collisionOptimizationLevel || 'balanced';
        const eps = Math.max(1e-6, maxAxis * (level === 'performance' ? 0.005 : (level === 'quality' ? 0.0001 : 0.001)));
        const key = (v) => `${Math.round(v.x/eps)*eps},${Math.round(v.y/eps)*eps},${Math.round(v.z/eps)*eps}`;
        const indexMap = new Map();
        const uniqueVerts = [];
        for (const p of points) {
            const k = key(p);
            if (!indexMap.has(k)) {
                indexMap.set(k, uniqueVerts.length);
                uniqueVerts.push(new CANNON.Vec3(p.x, p.y, p.z));
            }
        }
        if (uniqueVerts.length < 4) throw new Error('顶点不足以构成凸包');
        const faces = [];
        if (idxAttr) {
            for (let i = 0; i < idxAttr.count; i += 3) {
                const a = idxAttr.getX(i);
                const b = idxAttr.getX(i+1);
                const c = idxAttr.getX(i+2);
                const ia = indexMap.get(key(points[a]));
                const ib = indexMap.get(key(points[b]));
                const ic = indexMap.get(key(points[c]));
                if (ia !== ib && ib !== ic && ic !== ia) faces.push([ia, ib, ic]);
            }
        } else {
            for (let i = 0; i < points.length; i += 3) {
                const ia = indexMap.get(key(points[i]));
                const ib = indexMap.get(key(points[i+1]));
                const ic = indexMap.get(key(points[i+2]));
                if (ia !== ib && ib !== ic && ic !== ia) faces.push([ia, ib, ic]);
            }
        }
        const center = uniqueVerts.reduce((acc, v) => acc.vadd(v), new CANNON.Vec3(0,0,0));
        center.scale(1 / uniqueVerts.length, center);
        for (let i = 0; i < faces.length; i++) {
            const [ia, ib, ic] = faces[i];
            const a = uniqueVerts[ia];
            const b = uniqueVerts[ib];
            const c = uniqueVerts[ic];
            const ab = b.vsub(a);
            const ac = c.vsub(a);
            const normal = ab.cross(ac);
            const centroid = new CANNON.Vec3(
                (a.x + b.x + c.x) / 3,
                (a.y + b.y + c.y) / 3,
                (a.z + b.z + c.z) / 3
            );
            const outward = centroid.vsub(center);
            if (normal.dot(outward) < 0) {
                faces[i] = [ia, ic, ib];
            }
        }
        const convex = new CANNON.ConvexPolyhedron({ vertices: uniqueVerts, faces });
        if (typeof convex.computeNormals === 'function') convex.computeNormals();
        if (typeof convex.computeEdges === 'function') convex.computeEdges();
        if (typeof convex.updateBoundingSphereRadius === 'function') convex.updateBoundingSphereRadius();
        console.log(`凸包顶点: 原始 ${posAttr.count} -> 唯一 ${uniqueVerts.length}, 面数 ${faces.length}`);
        return convex;
    } catch (err) {
        console.warn('创建凸包失败，改用三角网格:', err);
        return this.createTrimeshFromGeometry(geometry, childWorldMatrix, rootPosWorld, rootQuatWorld);
    }
}
createBoundingBoxFromGeometry(geometry) {
    try {
        const bbox = new THREE.Box3();
        const positionAttribute = geometry.attributes.position;
        if (!positionAttribute || positionAttribute.count === 0) {
            throw new Error('无效的几何体');
        }
        for (let i = 0; i < positionAttribute.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(positionAttribute, i);
            bbox.expandByPoint(vertex);
        }
        const size = bbox.getSize(new THREE.Vector3());
        const center = bbox.getCenter(new THREE.Vector3());
        const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
        const boxShape = new CANNON.Box(halfExtents);
        return boxShape;
    } catch (error) {
        console.warn('创建包围盒失败，使用默认形状:', error);
        return new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    }
}
createFallbackCollisionForGLTF(modelId) {
    const model = this.models.get(modelId);
    if (!model) return;
    console.log(`为模型 ${modelId} 创建回退碰撞体`);
    const bbox = this.getModelWorldBBox(model);
    const size = bbox.getSize(new THREE.Vector3());
    const shape = new CANNON.Box(new CANNON.Vec3(
        Math.max(0.1, size.x / 2),
        Math.max(0.1, size.y / 2),
        Math.max(0.1, size.z / 2)
    ));
    const body = new CANNON.Body({
        mass: 0,
        material: this.defaultMaterial,
        shape: shape
    });
    body.position.copy(model.position);
    body.quaternion.copy(model.quaternion);
    this.physicsWorld.addBody(body);
    model.userData.physicsBody = body;
}
    createBoundingBoxFromGeometry(geometry) {
        try {
            const bbox = new THREE.Box3();
            const positionAttribute = geometry.attributes.position;
            if (!positionAttribute || positionAttribute.count === 0) {
                throw new Error('无效的几何体');
            }
            for (let i = 0; i < positionAttribute.count; i++) {
                const vertex = new THREE.Vector3();
                vertex.fromBufferAttribute(positionAttribute, i);
                bbox.expandByPoint(vertex);
            }
            const size = bbox.getSize(new THREE.Vector3());
            const center = bbox.getCenter(new THREE.Vector3());
            const offset = new CANNON.Vec3(center.x, center.y, center.z);
            const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
            const boxShape = new CANNON.Box(halfExtents);
            return boxShape;
        } catch (error) {
            console.warn('创建包围盒失败，使用默认形状:', error);
            return new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        }
    }
    createFallbackCollisionForGLTF(modelId) {
        const model = this.models.get(modelId);
        if (!model) return;
        console.log(`为模型 ${modelId} 创建回退碰撞体`);
        const bbox = this.getModelWorldBBox(model);
        const size = bbox.getSize(new THREE.Vector3());
        const shape = new CANNON.Box(new CANNON.Vec3(
            Math.max(0.1, size.x / 2),
            Math.max(0.1, size.y / 2),
            Math.max(0.1, size.z / 2)
        ));
        const body = new CANNON.Body({
            mass: 0,
            material: this.defaultMaterial,
            shape: shape
        });
        body.position.copy(model.position);
        body.quaternion.copy(model.quaternion);
        this.physicsWorld.addBody(body);
        model.userData.physicsBody = body;
    }
    createOptimizedTerrainCollision(modelId, level = 'balanced') {
        const model = this.models.get(modelId);
        if (!model) {
            console.warn(`GLTF模型 ${modelId} 不存在`);
            return;
        }
        if (model.userData.physicsBody) {
            this.physicsWorld.removeBody(model.userData.physicsBody);
            model.userData.physicsBody = null;
        }
        model.updateMatrixWorld(true);
        const rootPosWorld = new THREE.Vector3();
        const rootQuatWorld = new THREE.Quaternion();
        const rootScaleWorld = new THREE.Vector3();
        model.matrixWorld.decompose(rootPosWorld, rootQuatWorld, rootScaleWorld);
        const invRootQuatWorld = rootQuatWorld.clone().invert();
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        let vertexCountTotal = 0;
        const vWorld = new THREE.Vector3();
        const vLocalBody = new THREE.Vector3();
        model.traverse((child) => {
            if (child.isMesh && child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
                child.updateMatrixWorld(true);
                const posAttr = child.geometry.attributes.position;
                for (let i = 0; i < posAttr.count; i++) {
                    vWorld.fromBufferAttribute(posAttr, i);
                    vWorld.applyMatrix4(child.matrixWorld); 
                    vLocalBody.copy(vWorld).sub(rootPosWorld).applyQuaternion(invRootQuatWorld); 
                    if (vLocalBody.x < minX) minX = vLocalBody.x; if (vLocalBody.x > maxX) maxX = vLocalBody.x;
                    if (vLocalBody.y < minY) minY = vLocalBody.y; if (vLocalBody.y > maxY) maxY = vLocalBody.y;
                    if (vLocalBody.z < minZ) minZ = vLocalBody.z; if (vLocalBody.z > maxZ) maxZ = vLocalBody.z;
                    vertexCountTotal++;
                }
            }
        });
        if (vertexCountTotal === 0 || !isFinite(minX) || !isFinite(maxX)) {
            console.warn(`模型 ${modelId} 没有有效顶点，回退到包围盒`);
            this.createFallbackCollisionForGLTF(modelId);
            return;
        }
        const sizeX = Math.max(1e-4, maxX - minX);
        const sizeY = Math.max(1e-4, maxY - minY);
        const sizeZ = Math.max(1e-4, maxZ - minZ);
        const volume = sizeX * sizeY * sizeZ;
        const baseTarget = level === 'quality' ? 2000 : (level === 'performance' ? 400 : 800);
        const scaleVolume = Math.max(1e-6, rootScaleWorld.x * rootScaleWorld.y * rootScaleWorld.z);
        const targetVoxelCount = Math.min(500000, Math.max(200, Math.floor(baseTarget * scaleVolume)));
        let voxelSize = Math.cbrt(volume / Math.max(1, targetVoxelCount));
        const maxAxis = Math.max(sizeX, sizeY, sizeZ);
        voxelSize = Math.max(0.02, Math.min(maxAxis / 16, voxelSize));
        if (!isFinite(voxelSize) || voxelSize <= 0) voxelSize = 1.0;
        const voxelX = voxelSize;
        const voxelY = voxelSize * 0.5;
        const voxelZ = voxelSize;
        const Nx = Math.max(1, Math.ceil(sizeX / voxelX));
        const Ny = Math.max(1, Math.ceil(sizeY / voxelY));
        const Nz = Math.max(1, Math.ceil(sizeZ / voxelZ));
        const occ = new Uint8Array(Nx * Ny * Nz);
        const sampleStep = Math.max(1e-3, Math.min(voxelX, voxelY, voxelZ) * 0.75); 
        const dilateR = 1; 
        const markOccWithNeighbors = (ix, iy, iz) => {
            for (let dx = -dilateR; dx <= dilateR; dx++) {
                for (let dy = -dilateR; dy <= dilateR; dy++) {
                    for (let dz = -dilateR; dz <= dilateR; dz++) {
                        const x2 = ix + dx, y2 = iy + dy, z2 = iz + dz;
                        if (x2 >= 0 && x2 < Nx && y2 >= 0 && y2 < Ny && z2 >= 0 && z2 < Nz) {
                            occ[x2 + Nx * (y2 + Ny * z2)] = 1;
                        }
                    }
                }
            }
        };
        model.traverse((child) => {
            if (child.isMesh && child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
                child.updateMatrixWorld(true);
                const posAttr = child.geometry.attributes.position;
                const indexAttr = child.geometry.index ? child.geometry.index.array : null;
                const Aw = new THREE.Vector3();
                const Bw = new THREE.Vector3();
                const Cw = new THREE.Vector3();
                const ALocal = new THREE.Vector3();
                const BLocal = new THREE.Vector3();
                const CLocal = new THREE.Vector3();
                const ABw = new THREE.Vector3();
                const ACw = new THREE.Vector3();
                const processTriangle = (ia, ib, ic) => {
                    Aw.fromBufferAttribute(posAttr, ia).applyMatrix4(child.matrixWorld);
                    Bw.fromBufferAttribute(posAttr, ib).applyMatrix4(child.matrixWorld);
                    Cw.fromBufferAttribute(posAttr, ic).applyMatrix4(child.matrixWorld);
                    ABw.subVectors(Bw, Aw);
                    ACw.subVectors(Cw, Aw);
                    const area2 = ABw.clone().cross(ACw).length();
                    if (area2 < 1e-6) return;
                    ALocal.copy(Aw).sub(rootPosWorld).applyQuaternion(invRootQuatWorld);
                    BLocal.copy(Bw).sub(rootPosWorld).applyQuaternion(invRootQuatWorld);
                    CLocal.copy(Cw).sub(rootPosWorld).applyQuaternion(invRootQuatWorld);
                    const lenAB = ABw.length();
                    const lenAC = ACw.length();
                    let nu = Math.max(1, Math.ceil(lenAB / sampleStep));
                    let nv = Math.max(1, Math.ceil(lenAC / sampleStep));
                    const maxSamplesPerTri = 4096;
                    if (nu * nv > maxSamplesPerTri) {
                        const scale = Math.sqrt((nu * nv) / maxSamplesPerTri);
                        nu = Math.max(1, Math.ceil(nu / scale));
                        nv = Math.max(1, Math.ceil(nv / scale));
                    }
                    for (let iu = 0; iu <= nu; iu++) {
                        for (let iv = 0; iv <= nv; iv++) {
                            const u = iu / nu;
                            const v = iv / nv;
                            if (u + v > 1) continue; 
                            const Px = ALocal.x + u * (BLocal.x - ALocal.x) + v * (CLocal.x - ALocal.x);
                            const Py = ALocal.y + u * (BLocal.y - ALocal.y) + v * (CLocal.y - ALocal.y);
                            const Pz = ALocal.z + u * (BLocal.z - ALocal.z) + v * (CLocal.z - ALocal.z);
                            const ix = Math.min(Nx - 1, Math.max(0, Math.floor((Px - minX) / voxelX)));
                            const iy = Math.min(Ny - 1, Math.max(0, Math.floor((Py - minY) / voxelY)));
                            const iz = Math.min(Nz - 1, Math.max(0, Math.floor((Pz - minZ) / voxelZ)));
                            markOccWithNeighbors(ix, iy, iz);
                        }
                    }
                };
                if (indexAttr) {
                    for (let i = 0; i < indexAttr.length; i += 3) {
                        processTriangle(indexAttr[i], indexAttr[i + 1], indexAttr[i + 2]);
                    }
                } else {
                    for (let i = 0; i < posAttr.count; i += 3) {
                        processTriangle(i, i + 1, i + 2);
                    }
                }
            }
        });
        const maxShapes = level === 'quality' ? 2400 : (level === 'performance' ? 300 : 1200);
        const body = new CANNON.Body({
            mass: 0,
            material: this.defaultMaterial
        });
        body.type = CANNON.Body.STATIC;
        body.collisionResponse = true;
        body.allowSleep = false;
        const makeBox = (sx, sy, sz, cx, cy, cz) => {
            const shape = new CANNON.Box(new CANNON.Vec3(
                Math.max(0.0001, sx / 2),
                Math.max(0.0001, sy / 2),
                Math.max(0.0001, sz / 2)
            ));
            body.addShape(shape, new CANNON.Vec3(cx, cy, cz), new CANNON.Quaternion(0, 0, 0, 1));
        };
        let shapeCount = 0;
        for (let iz = 0; iz < Nz && shapeCount < maxShapes; iz++) {
            for (let iy = 0; iy < Ny && shapeCount < maxShapes; iy++) {
                let x = 0;
                while (x < Nx && shapeCount < maxShapes) {
                    while (x < Nx && occ[x + Nx * (iy + Ny * iz)] === 0) x++;
                    if (x >= Nx) break;
                    const start = x;
                    while (x < Nx && occ[x + Nx * (iy + Ny * iz)] !== 0) x++;
                    const end = x;
                    const minx = minX + start * voxelX;
                    const sizex = (end - start) * voxelX;
                    const miny = minY + iy * voxelY;
                    const minz = minZ + iz * voxelZ;
                    const cx = minx + sizex / 2;
                    const cy = miny + voxelY / 2;
                    const cz = minz + voxelZ / 2;
                    makeBox(sizex, voxelY, voxelZ, cx, cy, cz);
                    shapeCount++;
                }
            }
        }
        if (shapeCount === 0) {
            console.warn(`优化地图碰撞失败，回退到包围盒`);
            this.createFallbackCollisionForGLTF(modelId);
            return;
        }
        body.position.copy(rootPosWorld);
        body.quaternion.copy(rootQuatWorld);
        this.physicsWorld.addBody(body);
        model.userData.physicsBody = body;
        if (typeof body.updateAABB === 'function') body.updateAABB();
        body.wakeUp();
        console.log(`使用体素+轴向合并创建地形碰撞(考虑模型缩放): voxelX=${voxelX.toFixed(3)} voxelY=${voxelY.toFixed(3)} voxelZ=${voxelZ.toFixed(3)} 体素网格 ${Nx}x${Ny}x${Nz} 生成Box数=${shapeCount} (上限 ${maxShapes}) 顶点总数=${vertexCountTotal}`);
    }
    setModelPhysics(modelId, physicsType = 'simple', mass = 0) {
        if (this.enablePhysicsDebug) {
            console.log(`开始为模型 ${modelId} 设置物理碰撞，类型: ${physicsType}, 质量: ${mass}`);
        }
        try {
            const model = this.models.get(modelId) || this.objects.get(modelId);
            if (!model) {
                console.warn(`模型 ${modelId} 不存在`);
                return;
            }
            if (this.enablePhysicsDebug) {
                console.log(`找到模型 ${modelId}:`, model);
            }
            if (model.userData.physicsBody) {
                if (this.enablePhysicsDebug) {
                    console.log(`移除模型 ${modelId} 的现有物理体`);
                }
                this.physicsWorld.removeBody(model.userData.physicsBody);
                model.userData.physicsBody = null;
            }
            const isGLTFModel = this.models.has(modelId);
            const isComplexCollision = physicsType === '复杂网格碰撞' || physicsType === '地图碰撞';
            if (this.enablePhysicsDebug) {
                console.log(`isGLTFModel: ${isGLTFModel}, isComplexCollision: ${isComplexCollision}`);
            }
            if (isGLTFModel && physicsType === '地图碰撞') {
                if (this.enablePhysicsDebug) {
                    console.log(`为GLTF模型 ${modelId} 创建复杂网格碰撞（地图碰撞）`);
                }
                model.userData.isMapCollision = true;
                this.createComplexCollisionForGLTF(modelId);
                return; 
            }
            if (isGLTFModel && physicsType === '复杂网格碰撞') {
                if (this.enablePhysicsDebug) {
                    console.log(`为GLTF模型 ${modelId} 创建复杂网格碰撞`);
                }
                this.createComplexCollisionForGLTF(modelId);
                return; 
            }
            if (this.enablePhysicsDebug) {
                console.log(`为模型 ${modelId} 创建简单碰撞体`);
            }
            let shape;
            if (model.userData.geometryInfo) {
                const geoInfo = model.userData.geometryInfo;
                if (geoInfo.type === 'box') {
                    shape = new CANNON.Box(new CANNON.Vec3(geoInfo.width/2, geoInfo.height/2, geoInfo.depth/2));
                } else if (geoInfo.type === 'sphere') {
                    shape = new CANNON.Sphere(geoInfo.radius);
                }
            } else {
                shape = this.createSimpleCollisionShape(model);
            }
            if (!shape) {
                console.error(`无法为模型 ${modelId} 创建物理形状，使用默认形状`);
                shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
            }
            if (this.enablePhysicsDebug) {
                console.log(`成功创建物理形状，类型: ${shape.type || 'unknown'}`);
            }
            const body = this.createPhysicsBodyForModel(model, shape, mass);
            this.physicsWorld.addBody(body);
            model.userData.physicsBody = body;
            body._ownerRef = modelId;
            this.fixPhysicsBodyAlignment(model);
            if (this.enablePhysicsDebug) {
                console.log(`成功为模型 ${modelId} 创建物理体`);
            }
            if (this.showingCollisionBoxes) {
                this.createCollisionBoxVisualization(modelId, model);
            }
            this.addPhysicsDebugInfo(modelId, model, body);
        } catch (error) {
            console.error(`为模型 ${modelId} 设置物理碰撞时发生错误:`, error);
        }
    }
    updateMetallicMaterials() {
        this.scene.traverse((object) => {
            if (object.isMesh && object.material) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                materials.forEach((material) => {
                    if (material && (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) && 
                        material.metalness > 0.5) {
                        if (this.scene.environment) {
                            material.envMap = this.scene.environment;
                            material.envMapIntensity = 1.5;
                            material.needsUpdate = true;
                        }
                    }
                });
            }
        });
    }
    createEnvironmentMap() {
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();
        const scene = new THREE.Scene();
        const geometry = new THREE.SphereGeometry(500, 32, 16);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        const skybox = new THREE.Mesh(geometry, material);
        scene.add(skybox);
        const renderTarget = pmremGenerator.fromScene(scene);
        this.scene.environment = renderTarget.texture;
        pmremGenerator.dispose();
        scene.remove(skybox);
        geometry.dispose();
        material.dispose();
    }
initializePhysics() {
    if (window.CANNON) {
        this.physicsWorld = new CANNON.World();
        this.physicsWorld.gravity.set(0, -9.82, 0);
        this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
        this.physicsWorld.solver.iterations = 25; 
        this.physicsWorld.solver.tolerance = 0.0001; 
        this.physicsWorld.allowSleep = true;
        this.physicsWorld.sleepSpeedLimit = 0.1;
        this.physicsWorld.sleepTimeLimit = 1;
        this.physicsWorld.defaultContactMaterial.friction = 0.3;
        this.physicsWorld.defaultContactMaterial.restitution = 0.2;
        this.physicsWorld.defaultContactMaterial.contactEquationStiffness = 1e9;
        this.physicsWorld.defaultContactMaterial.contactEquationRelaxation = 4;
        this.physicsWorld.defaultContactMaterial.frictionEquationStiffness = 1e9;
        this.physicsWorld.defaultContactMaterial.frictionEquationRelaxation = 4;
        this.defaultMaterial = new CANNON.Material('default');
        this.defaultContactMaterial = new CANNON.ContactMaterial(
            this.defaultMaterial,
            this.defaultMaterial,
            {
                friction: 0.3,
                restitution: 0.2,
                contactEquationStiffness: 1e9,
                contactEquationRelaxation: 4,
                frictionEquationStiffness: 1e9,
                frictionEquationRelaxation: 4
            }
        );
        this.physicsWorld.addContactMaterial(this.defaultContactMaterial);
        this.createPhysicsGround();
        this.physicsEnabled = true;
        console.log(`物理世界 ${this.containerId} 初始化完成`);
    }
}
setGlobalFriction(mu) {
    if (!this.physicsWorld) {
        console.warn('物理世界未初始化，无法设置摩擦力');
        return;
    }
    const v = Number(mu);
    if (this.defaultContactMaterial) this.defaultContactMaterial.friction = v;
    if (this.physicsWorld.defaultContactMaterial) this.physicsWorld.defaultContactMaterial.friction = v;
    console.log(`容器 ${this.containerId} 设置全局摩擦力为 ${v}`);
}
setGlobalRestitution(e) {
    if (!this.physicsWorld) {
        console.warn('物理世界未初始化，无法设置弹性（反弹系数）');
        return;
    }
    const v = Number(e);
    if (this.defaultContactMaterial) this.defaultContactMaterial.restitution = v;
    if (this.physicsWorld.defaultContactMaterial) this.physicsWorld.defaultContactMaterial.restitution = v;
    console.log(`容器 ${this.containerId} 设置全局弹性(反弹系数) 为 ${v}`);
}
createTrimeshShapeFromModel(model) {
    try {
        console.log('开始提取模型顶点数据...');
        const vertices = [];
        const indices = [];
        let indexOffset = 0;
        model.updateMatrixWorld(true);
        const rootWorldMatrix = model.matrixWorld.clone();
        const invRootWorldMatrix = new THREE.Matrix4().copy(rootWorldMatrix).invert();
        model.traverse((child) => {
            if (child.isMesh && child.geometry) {
                const geometry = child.geometry;
                if (!geometry.attributes.position) {
                    console.warn('子网格没有位置属性，跳过');
                    return;
                }
                child.updateMatrixWorld(true);
                const relativeMatrix = new THREE.Matrix4().copy(invRootWorldMatrix).multiply(child.matrixWorld);
                const positionAttribute = geometry.attributes.position;
                const originalVertexCount = positionAttribute.count;
                for (let i = 0; i < originalVertexCount; i++) {
                    const vertex = new THREE.Vector3();
                    vertex.fromBufferAttribute(positionAttribute, i);
                    vertex.applyMatrix4(relativeMatrix);
                    vertices.push(vertex.x, vertex.y, vertex.z);
                }
                if (geometry.index) {
                    const indexAttribute = geometry.index;
                    for (let i = 0; i < indexAttribute.count; i++) {
                        indices.push(indexAttribute.getX(i) + indexOffset);
                    }
                } else {
                    for (let i = 0; i < originalVertexCount; i += 3) {
                        indices.push(i + indexOffset, i + 1 + indexOffset, i + 2 + indexOffset);
                    }
                }
                indexOffset += originalVertexCount;
            }
        });
        if (vertices.length < 9) {
            console.warn('顶点数据不足，使用包围盒回退方案');
            return this.createFallbackShape(model);
        }
        if (indices.length < 3) {
            console.warn('索引数据不足，使用包围盒回退方案');
            return this.createFallbackShape(model);
        }
        console.log(`成功提取 ${vertices.length/3} 个顶点, ${indices.length/3} 个三角形`);
        const cannonVertices = [];
        for (let i = 0; i < vertices.length; i += 3) {
            cannonVertices.push(vertices[i], vertices[i + 1], vertices[i + 2]);
        }
        const cannonIndices = [];
        for (let i = 0; i < indices.length; i++) {
            cannonIndices.push(indices[i]);
        }
        const trimeshShape = new CANNON.Trimesh(cannonVertices, cannonIndices);
        trimeshShape.updateAABB();
        trimeshShape.updateBoundingSphereRadius();
        console.log('三角网格碰撞形状创建成功');
        return trimeshShape;
    } catch (error) {
        console.error('创建三角网格形状失败:', error);
        return this.createFallbackShape(model);
    }
}
syncPhysicsWithRender() {
    this.objects.forEach((object) => {
        if (object.userData && object.userData.physicsBody) {
            const body = object.userData.physicsBody;
            if (this.isBodyValid(body)) {
                object.position.copy(body.position);
                object.quaternion.copy(body.quaternion);
                if (object.userData) object.userData.cachedBBoxWorld = null;
            } else {
                this.resetBodyToSafePosition(body);
            }
        }
    });
    this.models.forEach((model) => {
        if (model.userData && model.userData.physicsBody) {
            const body = model.userData.physicsBody;
            if (this.isBodyValid(body)) {
                model.position.copy(body.position);
                model.quaternion.copy(body.quaternion);
                if (model.userData) model.userData.cachedBBoxWorld = null;
            } else {
                this.resetBodyToSafePosition(body);
            }
        }
    });
}
isBodyValid(body) {
    const position = body.position;
    const velocity = body.velocity;
    return !(Math.abs(position.x) > 10000 || 
             Math.abs(position.y) > 10000 || 
             Math.abs(position.z) > 10000 ||
             Math.abs(velocity.x) > 1000 || 
             Math.abs(velocity.y) > 1000 || 
             Math.abs(velocity.z) > 1000);
}
resetBodyToSafePosition(body) {
    console.warn('检测到物理体异常，正在重置');
    body.position.set(0, 5, 0);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
}
    createPhysicsGround() {
        if (!this.physicsWorld) return;
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0, material: this.defaultMaterial });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.position.set(0, -100, 0);
        this.physicsWorld.addBody(groundBody);
    }
    addCube(modelId, x, y, z, width, height, depth, color) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.hexToColor(color),
            metalness: 0.0,
            roughness: 0.8
        });
        material.flatShading = false;
        material.vertexColors = false;
        material.needsUpdate = true;
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(x, y, z);
        cube.castShadow = true;
        cube.receiveShadow = true;
        if (!geometry.attributes.normal) {
            geometry.computeVertexNormals();
        }
        if (!geometry.boundingBox) geometry.computeBoundingBox();
        if (!geometry.boundingSphere) geometry.computeBoundingSphere();
        cube.userData.geometryInfo = {
            type: 'box',
            width: width,
            height: height,
            depth: depth
        };
        this.scene.add(cube);
        this.objects.set(modelId, cube);
        try { this.precomputeModelBounds(cube); } catch (e) { if (this.enablePhysicsDebug) console.warn('预计算包围盒失败:', e); }
        if (this.enablePhysicsDebug) {
            console.log(`立方体 ${modelId} 添加到容器 ${this.containerId}`);
        }
    }
    setCameraPosition(x, y, z) {
        if (this.camera) {
            this.camera.position.set(x, y, z);
            this.updateCameraLookAt();
        }
    }
    setCameraRotation(x, y, z) {
        if (this.camera) {
            let pitchRad = x * Math.PI / 180;
            if (this.limitPitch) {
                const maxPitch = 89 * Math.PI / 180; 
                pitchRad = Math.max(-maxPitch, Math.min(maxPitch, pitchRad));
            }
            this.cameraRotationX = pitchRad;
            this.cameraRotationY = y * Math.PI / 180;
            this.cameraRotationZ = z * Math.PI / 180;
            this.updateCameraLookAt();
        }
    }
    setCameraPitchLimit(enabled) {
        this.limitPitch = enabled;
    }
    setCameraFOV(fov) {
        if (this.camera) {
            this.camera.fov = fov;
            this.camera.updateProjectionMatrix();
        }
    }
    setCameraTarget(x, y, z) {
        if (this.camera) {
            this.cameraTarget.set(x, y, z);
            this.updateCameraLookAt();
        }
    }
    resetCameraTarget() {
        if (this.camera) {
            this.cameraTarget.set(0, 0, 0);
            this.updateCameraLookAt();
        }
    }
    updateCameraLookAt() {
        if (!this.camera) return;
        if (this.cameraTarget.length() > 0) {
            this.camera.lookAt(this.cameraTarget);
            return;
        }
        const phi = this.cameraRotationX;   
        const theta = this.cameraRotationY; 
        const roll = this.cameraRotationZ;  
        const forward = new THREE.Vector3(
            Math.sin(theta) * Math.cos(phi),
            -Math.sin(phi), 
            Math.cos(theta) * Math.cos(phi)
        );
        const target = new THREE.Vector3();
        target.copy(this.camera.position).add(forward);
        this.camera.lookAt(target);
        if (roll !== 0) {
            this.camera.rotateZ(roll);
        }
    }
    addSphere(modelId, x, y, z, size, color) {
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.hexToColor(color),
            metalness: 0.0,
            roughness: 0.8
        });
        material.flatShading = false;
        material.vertexColors = false;
        material.needsUpdate = true;
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(x, y, z);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        if (!geometry.attributes.normal) {
            geometry.computeVertexNormals();
        }
        if (!geometry.boundingBox) geometry.computeBoundingBox();
        if (!geometry.boundingSphere) geometry.computeBoundingSphere();
        sphere.userData.geometryInfo = {
            type: 'sphere',
            radius: size
        };
        this.scene.add(sphere);
        this.objects.set(modelId, sphere);
        try { this.precomputeModelBounds(sphere); } catch (e) { if (this.enablePhysicsDebug) console.warn('预计算包围盒失败:', e); }
        if (this.enablePhysicsDebug) {
            console.log(`球体 ${modelId} 添加到容器 ${this.containerId}`);
        }
    }
    addWater(modelId, x, y, z, width, depth, color) {
        const geometry = new THREE.PlaneGeometry(width, depth, 64, 64);
        let water;
        if (window.THREE && window.THREE.Water) {
            const waterNormals = this.createWaterNormalTexture();
            water = new THREE.Water(geometry, {
                textureWidth: 1024,  
                textureHeight: 1024,
                waterNormals: waterNormals,
                alpha: 0.8,  
                sunDirection: new THREE.Vector3(0.0, -1.0, 0.0),  
                sunColor: 0xffffff,
                waterColor: this.hexToColor(color).getHex(),
                distortionScale: 1.8,  
                fog: this.scene.fog !== undefined,
                reflectivity: 0.9,  
                shininess: 100,     
                clipBias: 0.0,      
                flowDirection: new THREE.Vector2(1.0, 1.0),  
                flowSpeed: 0.03     
            });
            water.material.transparent = true;
            water.material.opacity = 0.8;
            water.material.depthWrite = false;  
            water.renderOrder = 1000;  
            if (water.material.uniforms) {
                if (water.material.uniforms.reflectivity) {
                    water.material.uniforms.reflectivity.value = 0.9;
                }
                if (water.material.uniforms.scattering) {
                    water.material.uniforms.scattering.value = 0.3;
                }
                if (water.material.uniforms.fresnelBias) {
                    water.material.uniforms.fresnelBias.value = 0.1;
                }
                if (water.material.uniforms.fresnelScale) {
                    water.material.uniforms.fresnelScale.value = 1.0;
                }
                if (water.material.uniforms.fresnelPower) {
                    water.material.uniforms.fresnelPower.value = 2.0;
                }
            }
            water.material.roughness = 0.02;  
            water.material.metalness = 0.0;   
            water.material.envMapIntensity = 0.8;  
            if (water.material.defines) {
                water.material.defines.USE_SPECULARMAP = '';
            }
            water.material.reflectivity = 0.8;
            water.material.refractionRatio = 0.98;  
            if (water.material.uniforms) {
                if (water.material.uniforms.size) {
                    water.material.uniforms.size.value = 0.8;  
                }
                if (water.material.uniforms.eye) {
                }
                if (water.material.uniforms.sunColor) {
                    water.material.uniforms.sunColor.value.set(1.0, 1.0, 0.9);  
                }
            }
            if (water.material.fragmentShader) {
                const originalShader = water.material.fragmentShader;
                water.material.fragmentShader = originalShader.replace(
                    'sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );',
                    'sunLight( surfaceNormal, eyeDirection, 200.0, 4.0, 0.3, diffuseLight, specularLight );'
                ).replace(
                    'float rf0 = 0.3;',
                    'float rf0 = 0.04;'  
                ).replace(
                    'vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);',
                    'vec3 albedo = mix( ( sunColor * diffuseLight * 0.2 + scatter ) * getShadowMask(), ( vec3( 0.05 ) + reflectionSample * 0.95 + reflectionSample * specularLight * 2.0 ), reflectance);'
                );
                water.material.needsUpdate = true;
            }
            water.material.uniforms['time'].value = 0.0;
            if (!this.waterAnimations) {
                this.waterAnimations = new Map();
            }
            const animationData = {
                water: water,
                startTime: Date.now()
            };
            this.waterAnimations.set(modelId, animationData);
        } else {
            console.warn('Water.js未加载，使用基础水面实现');
            const material = new THREE.MeshPhysicalMaterial({ 
                color: this.hexToColor(color),
                transmission: 0.9,
                transparent: true, 
                opacity: 0.8,
                roughness: 0.1,
                metalness: 0.1,
                ior: 1.33,
                side: THREE.DoubleSide
            });
            water = new THREE.Mesh(geometry, material);
        }
        water.position.set(x, y, z);
        water.rotation.x = -Math.PI / 2; 
        water.receiveShadow = true;
        this.scene.add(water);
        this.objects.set(modelId, water);
        console.log(`水面 ${modelId} 添加到容器 ${this.containerId}`);
    }
    createWaterNormalTexture() {
        const loader = new THREE.TextureLoader();
        try {
            const texture = loader.load(
                'https://threejs.org/examples/textures/waternormals.jpg',
                function(texture) {
                    console.log('官方水面法线贴图加载成功');
                },
                function(progress) {
                },
                function(error) {
                    console.warn('官方法线贴图加载失败，使用程序生成的法线贴图:', error);
                    return this.createFallbackWaterNormalTexture();
                }.bind(this)
            );
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 4);  
            return texture;
        } catch (error) {
            console.warn('法线贴图加载器创建失败，使用程序生成的法线贴图:', error);
            return this.createFallbackWaterNormalTexture();
        }
    }
    createFallbackWaterNormalTexture() {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        const imageData = context.createImageData(size, size);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const x = (i / 4) % size;
            const y = Math.floor((i / 4) / size);
            const scale = 0.05;
            const normalX = (Math.sin(x * scale * 8) * Math.cos(y * scale * 8)) * 0.5 +
                           (Math.sin(x * scale * 16 + 1000) * Math.cos(y * scale * 16 + 1000)) * 0.3 +
                           (Math.sin(y * scale * 12 + 5000) * Math.cos(x * scale * 12 + 5000)) * 0.2;
            const normalY = (Math.cos(x * scale * 8) * Math.sin(y * scale * 8)) * 0.5 +
                           (Math.cos(x * scale * 16 + 1000) * Math.sin(y * scale * 16 + 1000)) * 0.3 +
                           (Math.sin(y * scale * 12 + 5000) * Math.cos(x * scale * 12 + 5000)) * 0.2;
            imageData.data[i] = Math.max(0, Math.min(255, 128 + normalX * 127));
            imageData.data[i + 1] = Math.max(0, Math.min(255, 128 + normalY * 127));
            imageData.data[i + 2] = 255;
            imageData.data[i + 3] = 255;
        }
        context.putImageData(imageData, 0, 0);
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }
    importModel(modelId, fileUrl, scale) {
        if (!window.THREE.GLTFLoader) {
            console.warn('GLTF Loader not available');
            return;
        }
        const loader = new THREE.GLTFLoader();
        loader.load(
            fileUrl,
            (gltf) => {
                const model = gltf.scene;
                model.scale.setScalar(scale);
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.frustumCulled = false;
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.scene.add(model);
                this.updateSunShadowCameraBounds();
                this.objects.set(modelId, model);
                console.log(`模型 ${modelId} 导入到容器 ${this.containerId}`);
            },
            (progress) => {
                console.log('Loading progress:', progress);
            },
            (error) => {
                console.error('Error loading model:', error);
            }
        );
    }
    setModelPosition(modelId, x, y, z) {
        const model = this.objects.get(modelId) || this.models.get(modelId);
        if (model) {
            const px = parseFloat(x), py = parseFloat(y), pz = parseFloat(z);
            model.position.set(px, py, pz);
            if (model.userData) model.userData.cachedBBoxWorld = null;
            if (model.userData && model.userData.physicsBody) {
                model.userData.physicsBody.position.set(px, py, pz);
            }
        }
    }
    setModelRotation(modelId, x, y, z) {
        const model = this.objects.get(modelId) || this.models.get(modelId);
        if (model) {
            const rx = THREE.MathUtils.degToRad(parseFloat(x));
            const ry = THREE.MathUtils.degToRad(parseFloat(y));
            const rz = THREE.MathUtils.degToRad(parseFloat(z));
            model.rotation.set(rx, ry, rz);
            if (model.userData) model.userData.cachedBBoxWorld = null;
            if (model.userData && model.userData.physicsBody && model.userData.physicsBody.quaternion) {
                if (typeof model.userData.physicsBody.quaternion.setFromEuler === 'function') {
                    model.userData.physicsBody.quaternion.setFromEuler(rx, ry, rz);
                } else {
                    const tq = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
                    model.userData.physicsBody.quaternion.set(tq.x, tq.y, tq.z, tq.w);
                }
            }
        }
    }
    removeModel(modelId) {
            const model = this.objects.get(modelId);
            if (model) {
                this.scene.remove(model);
                this.objects.delete(modelId);
                model.traverse((child) => {
                    if (child.isMesh) {
                        if (child.geometry) {
                            child.geometry.dispose();
                        }
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => mat.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });
                console.log(`模型 ${modelId} 从容器 ${this.containerId} 移除`);
            }
        }
        setBackground(style, color) {
            const colorObj = this.hexToColor(color);
            switch (style) {
                case '纯色':
                    this.scene.background = colorObj;
                    break;
                case '渐变':
                    const canvas = document.createElement('canvas');
                    canvas.width = 512;
                    canvas.height = 512;
                    const context = canvas.getContext('2d');
                    const gradient = context.createLinearGradient(0, 0, 0, 512);
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(1, '#ffffff');
                    context.fillStyle = gradient;
                    context.fillRect(0, 0, 512, 512);
                    const texture = new THREE.CanvasTexture(canvas);
                    this.scene.background = texture;
                    break;
                case '天空盒':
                    const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
                    const skyMaterial = new THREE.MeshBasicMaterial({
                        color: colorObj,
                        side: THREE.BackSide
                    });
                    const skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
                    this.scene.add(skyBox);
                    break;
                case '透明':
                    this.scene.background = null;
                    break;
                default:
                    this.scene.background = colorObj;
            }
            console.log(`容器 ${this.containerId} 背景设置为 ${style}`);
        }
        setPhysicsEnabled(enabled) {
            this.physicsEnabled = enabled;
            if (enabled && !this.physicsWorld) {
                this.initializePhysics();
            }
            console.log(`容器 ${this.containerId} 物理模拟 ${enabled ? '开启' : '关闭'}`);
        }
        setReflectionEnabled(enabled) {
            this.reflectionEnabled = enabled;
            console.log(`容器 ${this.containerId} 水面反射 ${enabled ? '开启' : '关闭'}`);
        }
        getObjectById(modelId) {
            return this.objects.get(modelId) || this.models.get(modelId);
        }
        traverseMeshes(object3d, callback) {
            if (!object3d) return;
            object3d.traverse((child) => {
                if (child && child.isMesh) callback(child);
            });
        }
        createStandardMaterialFrom(sourceMaterial, overrides = {}) {
            const color = sourceMaterial && sourceMaterial.color ? sourceMaterial.color.clone() : new THREE.Color(0xffffff);
            const params = {
                color,
                map: sourceMaterial && sourceMaterial.map ? sourceMaterial.map : null,
                transparent: sourceMaterial && sourceMaterial.transparent ? sourceMaterial.transparent : false,
                opacity: sourceMaterial && sourceMaterial.opacity !== undefined ? sourceMaterial.opacity : 1,
                side: sourceMaterial && sourceMaterial.side !== undefined ? sourceMaterial.side : THREE.FrontSide,
                alphaTest: sourceMaterial && sourceMaterial.alphaTest !== undefined ? sourceMaterial.alphaTest : 0,
                depthWrite: sourceMaterial && sourceMaterial.depthWrite !== undefined ? sourceMaterial.depthWrite : true,
                depthTest: sourceMaterial && sourceMaterial.depthTest !== undefined ? sourceMaterial.depthTest : true,
                skinning: !!(sourceMaterial && sourceMaterial.skinning),
                morphTargets: !!(sourceMaterial && sourceMaterial.morphTargets),
                morphNormals: !!(sourceMaterial && sourceMaterial.morphNormals),
                ...overrides
            };
            const mat = new THREE.MeshStandardMaterial(params);
            if (sourceMaterial && sourceMaterial.name) mat.name = sourceMaterial.name;
            return mat;
        }
        clamp01(value) {
            const v = Number(value);
            if (!Number.isFinite(v)) return 0;
            return Math.min(1, Math.max(0, v));
        }
        ensurePBRMaterial(sourceMaterial) {
            if (sourceMaterial && (sourceMaterial.isMeshStandardMaterial || sourceMaterial.isMeshPhysicalMaterial)) {
                return sourceMaterial;
            }
            if (sourceMaterial && sourceMaterial.isShaderMaterial) {
                return sourceMaterial;
            }
            const mat = this.createStandardMaterialFrom(sourceMaterial, {
                metalness: 0.0,
                roughness: 0.8,
                envMapIntensity: 0.6
            });
            if (this.scene && this.scene.environment) mat.envMap = this.scene.environment;
            return mat;
        }
        loadTextureFromString(source) {
            const url = typeof source === 'string' ? source.trim() : '';
            if (!url) return Promise.resolve(null);
            if (url === '无' || url === 'null' || url === 'NULL') return Promise.resolve(null);
            return new Promise((resolve, reject) => {
                try {
                    const loader = new THREE.TextureLoader();
                    loader.load(
                        url,
                        (tex) => resolve(tex),
                        undefined,
                        (err) => reject(err)
                    );
                } catch (e) {
                    reject(e);
                }
            });
        }
        textureWrapFromMenu(value) {
            switch (value) {
                case '重复':
                    return THREE.RepeatWrapping;
                case '镜像':
                    return THREE.MirroredRepeatWrapping;
                case '夹紧':
                default:
                    return THREE.ClampToEdgeWrapping;
            }
        }
        applySamplingToTexture(texture, wrapS, wrapT, repeatX, repeatY, offsetX, offsetY, rotationDeg) {
            if (!texture) return;
            texture.wrapS = this.textureWrapFromMenu(wrapS);
            texture.wrapT = this.textureWrapFromMenu(wrapT);
            texture.repeat.set(Number(repeatX) || 1, Number(repeatY) || 1);
            texture.offset.set(Number(offsetX) || 0, Number(offsetY) || 0);
            const rot = THREE.MathUtils.degToRad(Number(rotationDeg) || 0);
            texture.rotation = rot;
            if (rot !== 0) {
                texture.center.set(0.5, 0.5);
            }
            texture.needsUpdate = true;
        }
        setModelPBRValues(modelId, metalness, roughness) {
            const root = this.getObjectById(modelId);
            if (!root) return;
            const m = this.clamp01(metalness);
            const r = this.clamp01(roughness);
            this.traverseMeshes(root, (mesh) => {
                if (!mesh.material) return;
                const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                const nextMaterials = sourceMaterials.map((sourceMaterial) => {
                    const mat = this.ensurePBRMaterial(sourceMaterial);
                    if (mat && (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial)) {
                        mat.metalness = m;
                        mat.roughness = r;
                        if (this.scene && this.scene.environment) mat.envMap = this.scene.environment;
                        mat.needsUpdate = true;
                    }
                    return mat;
                });
                mesh.material = Array.isArray(mesh.material) ? nextMaterials : nextMaterials[0];
            });
        }
        async setModelMRMap(modelId, textureSource) {
            const root = this.getObjectById(modelId);
            if (!root) return;
            const texture = await this.loadTextureFromString(textureSource);
            this.traverseMeshes(root, (mesh) => {
                if (!mesh.material) return;
                const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                const nextMaterials = sourceMaterials.map((sourceMaterial) => {
                    const mat = this.ensurePBRMaterial(sourceMaterial);
                    if (mat && (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial)) {
                        mat.metalnessMap = texture;
                        mat.roughnessMap = texture;
                        mat.needsUpdate = true;
                    }
                    return mat;
                });
                mesh.material = Array.isArray(mesh.material) ? nextMaterials : nextMaterials[0];
            });
        }
        async setModelNormalMap(modelId, textureSource, scaleX, scaleY) {
            const root = this.getObjectById(modelId);
            if (!root) return;
            const texture = await this.loadTextureFromString(textureSource);
            const sx = Number(scaleX);
            const sy = Number(scaleY);
            const nx = Number.isFinite(sx) ? sx : 1;
            const ny = Number.isFinite(sy) ? sy : 1;
            this.traverseMeshes(root, (mesh) => {
                if (!mesh.material) return;
                const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                const nextMaterials = sourceMaterials.map((sourceMaterial) => {
                    const mat = this.ensurePBRMaterial(sourceMaterial);
                    if (mat && (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial)) {
                        mat.normalMap = texture;
                        if (mat.normalScale) {
                            mat.normalScale.set(nx, ny);
                        } else {
                            mat.normalScale = new THREE.Vector2(nx, ny);
                        }
                        mat.needsUpdate = true;
                    }
                    return mat;
                });
                mesh.material = Array.isArray(mesh.material) ? nextMaterials : nextMaterials[0];
            });
        }
        setModelTextureSampling(modelId, mapType, wrapS, wrapT, repeatX, repeatY, offsetX, offsetY, rotationDeg) {
            const root = this.getObjectById(modelId);
            if (!root) return;
            this.traverseMeshes(root, (mesh) => {
                if (!mesh.material) return;
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((mat) => {
                    if (!mat) return;
                    if (mapType === 'MR贴图') {
                        this.applySamplingToTexture(mat.metalnessMap, wrapS, wrapT, repeatX, repeatY, offsetX, offsetY, rotationDeg);
                        if (mat.roughnessMap !== mat.metalnessMap) {
                            this.applySamplingToTexture(mat.roughnessMap, wrapS, wrapT, repeatX, repeatY, offsetX, offsetY, rotationDeg);
                        }
                        if (mat.metalnessMap || mat.roughnessMap) mat.needsUpdate = true;
                        return;
                    }
                    if (mapType === '法线贴图') {
                        this.applySamplingToTexture(mat.normalMap, wrapS, wrapT, repeatX, repeatY, offsetX, offsetY, rotationDeg);
                        if (mat.normalMap) mat.needsUpdate = true;
                    }
                });
            });
        }
        setModelMaterial(modelId, materialType) {
            const root = this.getObjectById(modelId);
            if (!root) return;
            this.traverseMeshes(root, (mesh) => {
                if (!mesh.material) return;
                const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                const nextMaterials = sourceMaterials.map((sourceMaterial) => {
                    const originalColor = sourceMaterial && sourceMaterial.color ? sourceMaterial.color.clone() : new THREE.Color(0xffffff);
                    switch (materialType) {
                        case '普通材质':
                            return new THREE.MeshLambertMaterial({
                                color: originalColor,
                                map: sourceMaterial && sourceMaterial.map ? sourceMaterial.map : null,
                                transparent: sourceMaterial && sourceMaterial.transparent ? sourceMaterial.transparent : false,
                                opacity: sourceMaterial && sourceMaterial.opacity !== undefined ? sourceMaterial.opacity : 1,
                                side: sourceMaterial && sourceMaterial.side !== undefined ? sourceMaterial.side : THREE.FrontSide
                            });
                        case '金属材质': {
                            const mat = this.createStandardMaterialFrom(sourceMaterial, {
                                metalness: 0.8,
                                roughness: 0.2,
                                envMapIntensity: 1.0
                            });
                            if (this.scene.environment) mat.envMap = this.scene.environment;
                            return mat;
                        }
                        case '塑料材质': {
                            const mat = this.createStandardMaterialFrom(sourceMaterial, {
                                metalness: 0.0,
                                roughness: 0.55,
                                envMapIntensity: 0.6
                            });
                            if (this.scene.environment) mat.envMap = this.scene.environment;
                            return mat;
                        }
                        case '水面材质':
                            return sourceMaterial;
                        default:
                            return new THREE.MeshLambertMaterial({
                                color: originalColor,
                                map: sourceMaterial && sourceMaterial.map ? sourceMaterial.map : null,
                                transparent: sourceMaterial && sourceMaterial.transparent ? sourceMaterial.transparent : false,
                                opacity: sourceMaterial && sourceMaterial.opacity !== undefined ? sourceMaterial.opacity : 1,
                                side: sourceMaterial && sourceMaterial.side !== undefined ? sourceMaterial.side : THREE.FrontSide
                            });
                    }
                });
                mesh.material = Array.isArray(mesh.material) ? nextMaterials : nextMaterials[0];
            });
        }
        setModelMaterialLegacy(modelId, materialType) {
            const model = this.objects.get(modelId) || this.models.get(modelId);
            if (!model) return;
            let material;
            const originalColor = model.material && model.material.color ? model.material.color.clone() : new THREE.Color(0xffffff);
            switch (materialType) {
                case '水面材质':
                    if (window.THREE && window.THREE.Water && model.geometry && 
                        (model.geometry.type === 'PlaneGeometry' || model.geometry.type === 'PlaneBufferGeometry' || 
                         model.geometry.type === 'BoxGeometry' || model.geometry.type === 'BoxBufferGeometry')) {
                        const waterNormals = this.createWaterNormalTexture();
                        let waterGeometry;
                        if (model.geometry.type === 'BoxGeometry' || model.geometry.type === 'BoxBufferGeometry') {
                            const params = model.geometry.parameters;
                            waterGeometry = new THREE.PlaneGeometry(
                                params.width, 
                                params.depth, 
                                Math.max(32, Math.floor(params.width / 10)), 
                                Math.max(32, Math.floor(params.depth / 10))
                            );
                            waterGeometry.rotateX(-Math.PI / 2);
                        } else {
                            waterGeometry = model.geometry.clone();
                        }
                        const water = new THREE.Water(waterGeometry, {
                            textureWidth: 1024,  
                            textureHeight: 1024,
                            waterNormals: waterNormals,
                            alpha: 0.8,  
                            sunDirection: new THREE.Vector3(0.0, -1.0, 0.0),  
                            sunColor: 0xffffff,
                            waterColor: originalColor.getHex(),
                            distortionScale: 1.8,  
                            fog: this.scene.fog !== undefined,
                            reflectivity: 0.9,  
                            shininess: 100,     
                            clipBias: 0.0,      
                            flowDirection: new THREE.Vector2(1.0, 1.0),  
                            flowSpeed: 0.03     
                        });
                        water.material.transparent = true;
                        water.material.opacity = 0.8;
                        water.material.depthWrite = false;  
                        if (water.material.uniforms) {
                            if (water.material.uniforms.reflectivity) {
                                water.material.uniforms.reflectivity.value = 0.9;
                            }
                            if (water.material.uniforms.scattering) {
                                water.material.uniforms.scattering.value = 0.3;
                            }
                            if (water.material.uniforms.fresnelBias) {
                                water.material.uniforms.fresnelBias.value = 0.1;
                            }
                            if (water.material.uniforms.fresnelScale) {
                                water.material.uniforms.fresnelScale.value = 1.0;
                            }
                            if (water.material.uniforms.fresnelPower) {
                                water.material.uniforms.fresnelPower.value = 2.0;
                            }
                        }
                        water.material.roughness = 0.02;  
                        water.material.metalness = 0.0;   
                        water.material.envMapIntensity = 0.8;  
                        if (water.material.defines) {
                            water.material.defines.USE_SPECULARMAP = '';
                        }
                        water.material.reflectivity = 0.8;
                        water.material.refractionRatio = 0.98;  
                        if (water.material.uniforms) {
                            if (water.material.uniforms.size) {
                                water.material.uniforms.size.value = 0.8;  
                            }
                            if (water.material.uniforms.eye) {
                            }
                            if (water.material.uniforms.sunColor) {
                                water.material.uniforms.sunColor.value.set(1.0, 1.0, 0.9);  
                            }
                        }
                        if (water.material.fragmentShader) {
                            const originalShader = water.material.fragmentShader;
                            water.material.fragmentShader = originalShader.replace(
                                'sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );',
                                'sunLight( surfaceNormal, eyeDirection, 200.0, 4.0, 0.3, diffuseLight, specularLight );'
                            ).replace(
                                'float rf0 = 0.3;',
                                'float rf0 = 0.04;'  
                            ).replace(
                                'vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);',
                                'vec3 albedo = mix( ( sunColor * diffuseLight * 0.2 + scatter ) * getShadowMask(), ( vec3( 0.05 ) + reflectionSample * 0.95 + reflectionSample * specularLight * 2.0 ), reflectance);'
                            );
                            water.material.needsUpdate = true;
                        }
                        water.renderOrder = 1000;  
                        water.position.copy(model.position);
                        water.rotation.copy(model.rotation);
                        water.scale.copy(model.scale);
                        this.scene.remove(model);
                        this.scene.add(water);
                        this.objects.set(modelId, water);
                        if (!this.waterAnimations) {
                            this.waterAnimations = new Map();
                        }
                        const animationData = {
                            water: water,
                            startTime: Date.now()
                        };
                        this.waterAnimations.set(modelId, animationData);
                        console.log(`模型 ${modelId} 已转换为高级水面材质`);
                        return; 
                    } else {
                        material = new THREE.MeshPhysicalMaterial({
                            color: originalColor,
                            transmission: 0.9,
                            transparent: true,
                            opacity: 0.8,
                            roughness: 0.1,
                            metalness: 0.1,
                            ior: 1.33,
                            envMapIntensity: 1.0
                        });
                        if (!model.userData.waterAnimation && model.geometry && model.geometry.attributes.position) {
                            model.userData.waterAnimation = {
                                time: 0,
                                originalPosition: model.position.clone()
                            };
                            const animateWater = () => {
                                if (model.userData.waterAnimation) {
                                    model.userData.waterAnimation.time += 0.01;
                                    const time = model.userData.waterAnimation.time;
                                    const positions = model.geometry.attributes.position.array;
                                    const originalPositions = model.userData.originalPositions || positions.slice();
                                    if (!model.userData.originalPositions) {
                                        model.userData.originalPositions = originalPositions;
                                    }
                                    for (let i = 0; i < positions.length; i += 3) {
                                        const x = originalPositions[i];
                                        const z = originalPositions[i + 2];
                                        positions[i + 1] = originalPositions[i + 1] + 
                                            Math.sin(time + x * 0.01) * 2 + 
                                            Math.cos(time + z * 0.01) * 1.5;
                                    }
                                    model.geometry.attributes.position.needsUpdate = true;
                                    model.geometry.computeVertexNormals();
                                    requestAnimationFrame(animateWater);
                                }
                            };
                            animateWater();
                        }
                        if (this.scene.environment) {
                            material.envMap = this.scene.environment;
                        }
                    }
                    break;
                default:
                    material = new THREE.MeshLambertMaterial({
                        color: originalColor
                    });
            }
            if (model.material) {
                model.material.dispose();
            }
            model.material = material;
            if (model.type === 'Group') {
                model.traverse((child) => {
                    if (child.isMesh) {
                        if (child.material) {
                            child.material.dispose();
                        }
                        child.material = material.clone();
                    }
                });
            }
        }
        setModelOpacity(modelId, alpha) {
            const model = this.objects.get(modelId) || this.models.get(modelId);
            if (!model) return;
            const a = Math.min(1, Math.max(0, alpha));
            const applyOpacity = (mesh) => {
                if (mesh.material) {
                    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                    for (const mat of materials) {
                        if ('opacity' in mat) {
                            mat.transparent = a < 1 || mat.transparent === true;
                            mat.opacity = a;
                            mat.depthWrite = a === 1;
                            mat.needsUpdate = true;
                        }
                    }
                }
            };
            if (model.isMesh) {
                applyOpacity(model);
            }
            if (model.type === 'Group' || model.isObject3D) {
                model.traverse((child) => {
                    if (child.isMesh) applyOpacity(child);
                });
            }
        }
        setModelCastShadow(modelId, enable) {
            const model = this.objects.get(modelId) || this.models.get(modelId);
            if (!model) return;
            const flag = !!enable;
            if (model.isMesh) {
                model.castShadow = flag;
            }
            if (model.type === 'Group' || model.isObject3D) {
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = flag;
                    }
                });
            }
            if (this.directionalLight) {
                this.updateSunShadowCameraBounds();
            }
        }
        setShadowQuality(quality) {
            const qStr = typeof quality === 'string' ? quality : null;
            const synonyms = {
                '性能': '低',
                '性能优先': '低',
                '极致优化': '低',
                '均衡': '中',
                '平衡模式': '中',
                '高质量': '高',
                '质量优先': '高',
                '极致质量': '超高',
                '低': '低',
                '中': '中',
                '高': '高',
                '超高': '超高'
            };
            const normalized = qStr ? (synonyms[qStr] || qStr) : null;
            let size;
            if (typeof quality === 'number') {
                size = Math.max(512, Math.min(4096, Math.floor(quality)));
            } else {
                const map = { '低': 1024, '中': 2048, '高': 4096, '超高': 4096 };
                size = map[normalized] || 2048;
            }
            if (this.renderer && this.renderer.capabilities) {
                const maxTex = Math.max(1024, Math.min(4096, this.renderer.capabilities.maxTextureSize || 2048));
                size = Math.min(size, maxTex);
            }
            this.shadowMapSize = size;
            if (this.renderer) {
                this.renderer.shadowMap.enabled = true;
                const THREERef = THREE;
                this.renderer.shadowMap.type = THREERef.PCFSoftShadowMap;
            }
            for (const [id, l] of this.lights) {
                if (l && l.shadow) {
                    l.castShadow = true;
                    l.shadow.mapSize.width = size;
                    l.shadow.mapSize.height = size;
                    l.shadow.radius = size >= 2048 ? 4 : 2;
                    if (l instanceof THREE.DirectionalLight) {
                        l.shadow.bias = size <= 1024 ? -0.0006 : size <= 2048 ? -0.0005 : -0.0003;
                        l.shadow.normalBias = size <= 1024 ? 0.04 : size <= 2048 ? 0.03 : 0.02;
                    } else if (l instanceof THREE.SpotLight) {
                        l.shadow.bias = -0.0003;
                        l.shadow.normalBias = 0.02;
                    } else if (l instanceof THREE.PointLight) {
                        l.shadow.bias = -0.0002;
                        l.shadow.normalBias = 0.02;
                    }
                }
            }
            if (this.sunLight && this.sunLight.shadow) {
                const shadow = this.sunLight.shadow;
                shadow.mapSize.width = size;
                shadow.mapSize.height = size;
                if (size <= 1024) {
                    shadow.bias = -0.0006;
                    shadow.normalBias = 0.04;
                } else if (size <= 2048) {
                    shadow.bias = -0.0005;
                    shadow.normalBias = 0.03;
                } else {
                    shadow.bias = -0.0003;
                    shadow.normalBias = 0.02;
                }
                shadow.radius = size >= 2048 ? 4 : 2;
                shadow.needsUpdate = true;
                if (shadow.camera) shadow.camera.updateProjectionMatrix();
            }
            this.updateSunShadowCameraBounds();
        }
        applyForce(modelId, fx, fy, fz) {
            const model = this.objects.get(modelId) || this.models.get(modelId);
            if (model && model.userData && model.userData.physicsBody) {
                const body = model.userData.physicsBody;
                if (typeof body.wakeUp === 'function') body.wakeUp();
                const force = new CANNON.Vec3(fx, fy, fz);
                body.applyForce(force, body.position);
            }
        }
        setModelVelocity(modelId, vx, vy, vz) {
            const model = this.objects.get(modelId) || this.models.get(modelId);
            if (model && model.userData && model.userData.physicsBody) {
                const body = model.userData.physicsBody;
                body.velocity.set(vx, vy, vz);
                if (typeof body.wakeUp === 'function') body.wakeUp();
            }
        }
        setModelVelocityX(modelId, vx) {
            const model = this.objects.get(modelId) || this.models.get(modelId);
            if (model && model.userData && model.userData.physicsBody) {
                const body = model.userData.physicsBody;
                body.velocity.x = vx;
                if (typeof body.wakeUp === 'function') body.wakeUp();
            }
        }
        setModelVelocityY(modelId, vy) {
            const model = this.objects.get(modelId) || this.models.get(modelId);
            if (model && model.userData && model.userData.physicsBody) {
                const body = model.userData.physicsBody;
                body.velocity.y = vy;
                if (typeof body.wakeUp === 'function') body.wakeUp();
            }
        }
        setModelVelocityZ(modelId, vz) {
            const model = this.objects.get(modelId) || this.models.get(modelId);
            if (model && model.userData && model.userData.physicsBody) {
                const body = model.userData.physicsBody;
                body.velocity.z = vz;
                if (typeof body.wakeUp === 'function') body.wakeUp();
            }
        }
        setGlobalGravity(gx, gy, gz) {
            if (this.physicsWorld) {
                this.physicsWorld.gravity.set(gx, gy, gz);
            }
        }
        setModelContactProperties(modelId, friction, restitution) {
            const model = this.objects.get(modelId) || this.models.get(modelId);
            if (!model) {
                console.warn(`模型 ${modelId} 不存在，无法设置接触属性`);
                return;
            }
            if (!this.physicsWorld) {
                console.warn('物理世界未初始化，无法设置接触属性');
                return;
            }
            if (!model.userData || !model.userData.physicsBody) {
                console.warn(`模型 ${modelId} 未启用物理(没有 physicsBody)，请先设置物理再设置接触属性`);
                return;
            }
            if (!model.userData.physicsMaterial) {
                model.userData.physicsMaterial = new CANNON.Material(`mat_${modelId}`);
            }
            const body = model.userData.physicsBody;
            body.material = model.userData.physicsMaterial;
            const stiffness = (this.defaultContactMaterial && this.defaultContactMaterial.contactEquationStiffness) || 1e9;
            const relaxation = (this.defaultContactMaterial && this.defaultContactMaterial.contactEquationRelaxation) || 4;
            const fStiffness = (this.defaultContactMaterial && this.defaultContactMaterial.frictionEquationStiffness) || 1e9;
            const fRelaxation = (this.defaultContactMaterial && this.defaultContactMaterial.frictionEquationRelaxation) || 4;
            if (!model.userData.contactMaterialWithDefault) {
                model.userData.contactMaterialWithDefault = new CANNON.ContactMaterial(
                    model.userData.physicsMaterial,
                    this.defaultMaterial || new CANNON.Material('default'),
                    {
                        friction: Number(friction),
                        restitution: Number(restitution),
                        contactEquationStiffness: stiffness,
                        contactEquationRelaxation: relaxation,
                        frictionEquationStiffness: fStiffness,
                        frictionEquationRelaxation: fRelaxation
                    }
                );
                this.physicsWorld.addContactMaterial(model.userData.contactMaterialWithDefault);
            } else {
                model.userData.contactMaterialWithDefault.friction = Number(friction);
                model.userData.contactMaterialWithDefault.restitution = Number(restitution);
                model.userData.contactMaterialWithDefault.contactEquationStiffness = stiffness;
                model.userData.contactMaterialWithDefault.contactEquationRelaxation = relaxation;
                model.userData.contactMaterialWithDefault.frictionEquationStiffness = fStiffness;
                model.userData.contactMaterialWithDefault.frictionEquationRelaxation = fRelaxation;
            }
            if (typeof body.wakeUp === 'function') body.wakeUp();
            console.log(`模型 ${modelId} 接触属性设置 摩擦力=${friction} 弹性=${restitution}`);
        }
        setModelDamping(modelId, linearDamping, angularDamping) {
            const model = this.objects.get(modelId) || this.models.get(modelId);
            if (!model || !model.userData || !model.userData.physicsBody) {
                console.warn(`模型 ${modelId} 未启用物理或不存在，无法设置阻尼`);
                return;
            }
            const body = model.userData.physicsBody;
            const ld = Math.max(0, Math.min(1, Number(linearDamping)));
            const ad = Math.max(0, Math.min(1, Number(angularDamping)));
            body.linearDamping = ld;
            body.angularDamping = ad;
            if (typeof body.wakeUp === 'function') body.wakeUp();
            console.log(`模型 ${modelId} 阻尼设置 线性D=${ld} 角D=${ad}`);
        }
        setGlobalDamping(linearDamping, angularDamping) {
            if (!this.physicsWorld) {
                console.warn('物理世界未初始化，无法设置全局阻尼');
                return;
            }
            const ld = Math.max(0, Math.min(1, Number(linearDamping)));
            const ad = Math.max(0, Math.min(1, Number(angularDamping)));
            this.physicsWorld.bodies.forEach(body => {
                if (body.type === CANNON.Body.STATIC) return; 
                body.linearDamping = ld;
                body.angularDamping = ad;
                if (typeof body.wakeUp === 'function') body.wakeUp();
            });
            console.log(`全局阻尼设置 线性D=${ld} 角D=${ad}`);
        }
        setModelAngularVelocityLimit(modelId, wmax) {
            const model = this.objects.get(modelId) || this.models.get(modelId);
            if (!model || !model.userData || !model.userData.physicsBody) {
                console.warn(`模型 ${modelId} 未启用物理或不存在，无法设置最大角速度`);
                return;
            }
            const body = model.userData.physicsBody;
            const limit = Math.max(0, Number(wmax));
            model.userData.angularVelocityLimit = limit;
            body.angularVelocityLimit = limit;
            if (typeof body.wakeUp === 'function') body.wakeUp();
            console.log(`模型 ${modelId} 最大角速度限制设置为 ${limit}`);
        }
        setGlobalAngularVelocityLimit(wmax) {
            const limit = Math.max(0, Number(wmax));
            this.globalAngularVelocityLimit = limit;
            console.log(`全局最大角速度限制设置为 ${limit}`);
        }
        addLight(lightId, type, x, y, z, color, intensity) {
            if (this.lights.has(lightId)) {
                const existingLight = this.lights.get(lightId);
                this.scene.remove(existingLight);
                this.lights.delete(lightId);
            }
            let light;
            const lightColor = new THREE.Color(color);
            switch (type) {
                case '环境光':
                    light = new THREE.AmbientLight(lightColor, intensity);
                    break;
                case '方向光':
                    light = new THREE.DirectionalLight(lightColor, intensity);
                    light.position.set(x, y, z);
                    light.castShadow = true;
                    if (light.shadow) {
                        const s = this.shadowMapSize || 2048;
                        light.shadow.mapSize.width = s;
                        light.shadow.mapSize.height = s;
                        light.shadow.bias = -0.0005;
                        light.shadow.normalBias = 0.03;
                    }
                    break;
                case '点光源':
                    light = new THREE.PointLight(lightColor, intensity, 100);
                    light.position.set(x, y, z);
                    light.castShadow = true;
                    if (light.shadow) {
                        const s = this.shadowMapSize || 2048;
                        light.shadow.mapSize.width = s;
                        light.shadow.mapSize.height = s;
                        light.shadow.bias = -0.0002;
                        light.shadow.normalBias = 0.02;
                    }
                    break;
                case '聚光灯':
                    light = new THREE.SpotLight(lightColor, intensity);
                    light.position.set(x, y, z);
                    light.angle = Math.PI / 6;
                    light.penumbra = 0.1;
                    light.decay = 2;
                    light.distance = 200;
                    light.castShadow = true;
                    if (light.shadow) {
                        const s = this.shadowMapSize || 2048;
                        light.shadow.mapSize.width = s;
                        light.shadow.mapSize.height = s;
                        light.shadow.bias = -0.0003;
                        light.shadow.normalBias = 0.02;
                    }
                    this.scene.add(light.target);
                    break;
                default:
                    light = new THREE.PointLight(lightColor, intensity, 100);
                    light.position.set(x, y, z);
            }
            light.name = lightId;
            this.scene.add(light);
            this.lights.set(lightId, light);
        }
        setLightPosition(lightId, x, y, z) {
            const light = this.lights.get(lightId);
            if (light && light.position) {
                light.position.set(x, y, z);
            }
        }
        setLightIntensity(lightId, intensity) {
            const light = this.lights.get(lightId);
            if (light) {
                light.intensity = intensity;
            }
        }
        setLightColor(lightId, color) {
            const light = this.lights.get(lightId);
            if (light) {
                light.color.set(color);
            }
        }
        setAmbientLight(intensity, color) {
            let ambientLight = this.lights.get('ambient');
            if (!ambientLight) {
                ambientLight = new THREE.AmbientLight(color, intensity);
                this.scene.add(ambientLight);
                this.lights.set('ambient', ambientLight);
            } else {
                ambientLight.intensity = intensity;
                ambientLight.color.set(color);
            }
        }
        setDirectionalLight(lightId, x, y, z, targetX, targetY, targetZ, intensity, color) {
            let light = this.lights.get(lightId);
            if (!light || !(light instanceof THREE.DirectionalLight)) {
                if (light) {
                    this.scene.remove(light);
                }
                light = new THREE.DirectionalLight(color, intensity);
                light.castShadow = true;
                light.shadow.mapSize.width = 2048;
                light.shadow.mapSize.height = 2048;
                light.shadow.bias = -0.0001;
                light.shadow.radius = 8;  
                light.shadow.blurSamples = 25;  
                this.scene.add(light);
                this.lights.set(lightId, light);
            }
            light.position.set(x, y, z);
            light.target.position.set(targetX, targetY, targetZ);
            light.intensity = intensity;
            light.color.set(color);
        }
        setSpotLight(lightId, x, y, z, targetX, targetY, targetZ, angle, penumbra, decay, distance, intensity, color) {
            let light = this.lights.get(lightId);
            if (!light || !(light instanceof THREE.SpotLight)) {
                if (light) {
                    this.scene.remove(light);
                    if (light.target) {
                        this.scene.remove(light.target);
                    }
                }
                light = new THREE.SpotLight(color, intensity);
                light.castShadow = true;
                this.scene.add(light);
                this.scene.add(light.target);
                this.lights.set(lightId, light);
            }
            light.position.set(x, y, z);
            light.target.position.set(targetX, targetY, targetZ);
            light.angle = angle * Math.PI / 180; 
            light.penumbra = penumbra;
            light.decay = decay;
            light.distance = distance;
            light.intensity = intensity;
            light.color.set(color);
        }
        addParticle(particleId, x, y, z, color, intensity, spread) {
            if (this.particles.has(particleId)) {
                const existingParticle = this.particles.get(particleId);
                this.scene.remove(existingParticle);
                if (existingParticle.geometry) existingParticle.geometry.dispose();
                if (existingParticle.material) existingParticle.material.dispose();
                this.particles.delete(particleId);
            }
            const particleColor = new THREE.Color(color);
            const geometry = new THREE.SphereGeometry(0.1 * spread, 8, 6);
            const material = new THREE.MeshBasicMaterial({
                color: particleColor,
                transparent: true,
                opacity: intensity
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.position.set(x, y, z);
            particle.name = particleId;
            particle.userData = {
                type: 'particle',
                intensity: intensity,
                spread: spread,
                originalColor: particleColor.clone()
            };
            this.scene.add(particle);
            this.particles.set(particleId, particle);
        }
        loadGLTFFromBase64(modelId, base64Data, x = 0, y = 0, z = 0, scale = 1) {
            return new Promise((resolve, reject) => {
                try {
                    if (this.models.has(modelId)) {
                        this.removeModel(modelId);
                    }
                    const binaryString = atob(base64Data.split(',')[1] || base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    if (!window.THREE || !window.THREE.GLTFLoader) {
                        reject(new Error('GLTFLoader未加载，请确保库已正确初始化'));
                        return;
                    }
                    const loader = new THREE.GLTFLoader();
                    loader.parse(bytes.buffer, '', (gltf) => {
                        const model = gltf.scene;
                        model.position.set(x, y, z);
                        model.scale.setScalar(scale);
                        model.name = modelId;
                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.frustumCulled = false;
                                child.castShadow = true;
                                child.receiveShadow = true;
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                if (child.isSkinnedMesh) {
                                    materials.forEach(mat => { if (mat && 'skinning' in mat) mat.skinning = true; });
                                }
                                materials.forEach(mat => {
                                    if (mat) {
                                        if ('flatShading' in mat) mat.flatShading = false;
                                        if ('vertexColors' in mat) mat.vertexColors = false;
                                        if (mat && mat.isMeshBasicMaterial) {
                                            const standardMat = new THREE.MeshStandardMaterial({
                                                map: mat.map,
                                                color: mat.color,
                                                transparent: mat.transparent,
                                                opacity: mat.opacity,
                                                side: mat.side,
                                                skinning: child.isSkinnedMesh ? true : undefined
                                            });
                                            child.material = standardMat;
                                        } else if (mat && (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial)) {
                                            mat.metalness = mat.metalness !== undefined ? mat.metalness : 0.0;
                                            mat.roughness = mat.roughness !== undefined ? mat.roughness : 0.5;
                                            if (child.isSkinnedMesh && 'skinning' in mat) mat.skinning = true;
                                        }
                                        mat.needsUpdate = true;
                                    }
                                });
                                if (child.geometry && !child.geometry.attributes.normal) {
                                    child.geometry.computeVertexNormals();
                                }
                                if (child.geometry && child.geometry.attributes.normal) {
                                    child.geometry.normalizeNormals();
                                }
                            }
                        });
                        model.userData = {
                            type: 'gltf',
                            animations: gltf.animations || [],
                            mixer: null,
                            actions: new Map(),
                            currentAnimation: null
                        };
                        if (gltf.animations && gltf.animations.length > 0) {
                            model.userData.mixer = new THREE.AnimationMixer(model);
                            gltf.animations.forEach((clip, index) => {
                                const action = model.userData.mixer.clipAction(clip);
                                model.userData.actions.set(clip.name || `animation_${index}`, action);
                            });
                        }
                        this.scene.add(model);
                        this.models.set(modelId, model);
                        try { this.precomputeModelBounds(model); } catch (e) { console.warn('预计算包围盒失败:', e); }
                        this.updateSunShadowCameraBounds();
                        resolve({
                            model: model,
                            animations: gltf.animations || [],
                            animationNames: gltf.animations ? gltf.animations.map(clip => clip.name || `animation_${gltf.animations.indexOf(clip)}`) : []
                        });
                    }, (error) => {
                        console.error('GLTF解析失败:', error);
                        reject(error);
                    });
                } catch (error) {
                    console.error('GLTF加载失败:', error);
                    reject(error);
                }
            });
        }
fixPhysicsBodyAlignment(model) {
    if (!model.userData.physicsBody) return;
    const body = model.userData.physicsBody;
    body.position.set(model.position.x, model.position.y, model.position.z);
    body.quaternion.set(model.quaternion.x, model.quaternion.y, model.quaternion.z, model.quaternion.w);
    let modelBottom = null;
    const s = (model.scale && model.scale.y) ? model.scale.y : 1;
    const info = model.userData && model.userData.geometryInfo ? model.userData.geometryInfo : null;
    if (info && info.type === 'box' && typeof info.height === 'number') {
        modelBottom = model.position.y - (info.height * s) / 2;
    } else if (info && info.type === 'sphere' && typeof info.radius === 'number') {
        modelBottom = model.position.y - (info.radius * s);
    } else {
        const bbox = this.getModelWorldBBox(model);
        modelBottom = bbox.min.y;
    }
    if (this.enablePhysicsDebug) {
        console.log(`模型底部位置: ${modelBottom}, 物理体位置: (${body.position.x}, ${body.position.y}, ${body.position.z})`);
    }
    const groundLevel = -100; 
    if (modelBottom < groundLevel) {
        const adjustment = groundLevel - modelBottom;
        body.position.y += adjustment;
        model.position.y += adjustment;
        if (this.enablePhysicsDebug) {
            console.log(`调整模型位置以避免穿模，调整量: ${adjustment}`);
        }
    }
    body.wakeUp();
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
}
createPhysicsBodyForModel(model, shape, mass = 0) {
    const body = new CANNON.Body({ 
        mass: mass,
        material: this.defaultMaterial
    });
    if (shape.isCompound) {
        for (let i = 0; i < shape.shapes.length; i++) {
            body.addShape(
                shape.shapes[i], 
                shape.offsets[i],
                shape.orientations[i]
            );
        }
        body.shapeOffsets = shape.offsets ? shape.offsets.slice() : [];
        body.shapeOrientations = shape.orientations ? shape.orientations.slice() : [];
    } else {
        body.addShape(shape);
    }
    body.position.copy(model.position);
    body.quaternion.copy(model.quaternion);
    if (mass === 0) {
        body.type = CANNON.Body.STATIC;
        body.collisionResponse = true;
        body.sleepSpeedLimit = 0.1;
        body.sleepTimeLimit = 1;
    } else {
        body.linearDamping = 0.05;
        body.angularDamping = 0.05;
        body.sleepSpeedLimit = 0.2;
        body.sleepTimeLimit = 2;
    }
    return body;
}
addPhysicsDebugInfo(modelId, model, body) {
    if (!this.enablePhysicsDebug) return;
    console.log(`=== 物理调试信息 - ${modelId} ===`);
    console.log(`模型位置: (${model.position.x}, ${model.position.y}, ${model.position.z})`);
    console.log(`物理体位置: (${body.position.x}, ${body.position.y}, ${body.position.z})`);
    console.log(`模型旋转: (${model.quaternion.x}, ${model.quaternion.y}, ${model.quaternion.z}, ${model.quaternion.w})`);
    console.log(`物理体旋转: (${body.quaternion.x}, ${body.quaternion.y}, ${body.quaternion.z}, ${body.quaternion.w})`);
    console.log(`质量: ${body.mass}`);
    console.log(`类型: ${body.type === CANNON.Body.STATIC ? '静态' : '动态'}`);
    const bbox = this.getModelWorldBBox(model);
    const size = bbox.getSize(new THREE.Vector3());
    const center = bbox.getCenter(new THREE.Vector3());
    console.log(`模型包围盒 - 尺寸: (${size.x}, ${size.y}, ${size.z}), 中心: (${center.x}, ${center.y}, ${center.z})`);
    console.log(`模型包围盒 - 最小点: (${bbox.min.x}, ${bbox.min.y}, ${bbox.min.z})`);
    console.log(`模型包围盒 - 最大点: (${bbox.max.x}, ${bbox.max.y}, ${bbox.max.z})`);
}
updatePhysics(deltaTime) {
    if (this.physicsWorld && this.physicsEnabled) {
        const fixedTimeStep = 1/60;
        const maxSubSteps = 3;
        const clampedDeltaTime = Math.min(deltaTime, 0.1);
        try {
            this.physicsWorld.step(fixedTimeStep, clampedDeltaTime, maxSubSteps);
            if (this.physicsWorld) {
                const gLimit = (this.globalAngularVelocityLimit != null) ? Number(this.globalAngularVelocityLimit) : -1;
                this.physicsWorld.bodies.forEach(body => {
                    if (!body.angularVelocity) return;
                    let limit = (body.angularVelocityLimit != null) ? Number(body.angularVelocityLimit) : gLimit;
                    const owner = (body._ownerRef && (this.objects.get(body._ownerRef) || this.models.get(body._ownerRef))) || null;
                    if ((limit == null || limit <= 0) && owner && owner.userData && owner.userData.angularVelocityLimit != null) {
                        limit = Number(owner.userData.angularVelocityLimit);
                    }
                    if (limit == null || limit <= 0) return;
                    const w = body.angularVelocity;
                    const mag = Math.sqrt(w.x*w.x + w.y*w.y + w.z*w.z);
                    if (mag > limit) {
                        const s = limit / mag;
                        w.scale(s, w);
                    }
                });
            }
            this.objects.forEach((object) => {
                if (object.userData && object.userData.physicsBody) {
                    const body = object.userData.physicsBody;
                    if (this.isPhysicsBodyValid(body)) {
                        object.position.copy(body.position);
                        object.quaternion.copy(body.quaternion);
                        if (object.userData) object.userData.cachedBBoxWorld = null;
                        if (object.userData) object.userData.cachedBBoxWorld = null;
                    } else {
                        console.warn(`检测到物理体异常，重置: ${object.name || '未命名对象'}`);
                        this.resetPhysicsBody(object, body);
                    }
                }
            });
            this.models.forEach((model) => {
                if (model.userData && model.userData.physicsBody) {
                    const body = model.userData.physicsBody;
                    if (this.isPhysicsBodyValid(body)) {
                        model.position.copy(body.position);
                        model.quaternion.copy(body.quaternion);
                        if (model.userData) model.userData.cachedBBoxWorld = null;
                    } else {
                        console.warn(`检测到模型物理体异常，重置: ${model.name || '未命名模型'}`);
                        this.resetPhysicsBody(model, body);
                    }
                }
            });
            this.updateConstraints(clampedDeltaTime);
            if (this._destroyedConstraintsEvents && this._destroyedConstraintsEvents.length) {
                const runtime = this.extension && this.extension.runtime;
                const eventOpcodeId = 'threedcontainer_whenElasticConstraintDestroyed';
                if (runtime && runtime.startHats) {
                    for (const ev of this._destroyedConstraintsEvents) {
                        try {
                            runtime.startHats(eventOpcodeId);
                        } catch (e) {
                            console.warn('触发约束破坏事件失败:', e);
                        }
                    }
                }
                this._destroyedConstraintsEvents.length = 0;
            }
        } catch (error) {
            console.error('物理引擎更新错误:', error);
        }
    }
}
isPhysicsBodyValid(body) {
    const position = body.position;
    const velocity = body.velocity;
    return !(
        Math.abs(position.x) > 10000 || 
        Math.abs(position.y) > 10000 || 
        Math.abs(position.z) > 10000 ||
        Math.abs(velocity.x) > 1000 || 
        Math.abs(velocity.y) > 1000 || 
        Math.abs(velocity.z) > 1000
    );
}
resetPhysicsBody(model, body) {
    body.position.set(0, 5, 0);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    model.position.copy(body.position);
    model.quaternion.copy(body.quaternion);
}
fixAllPhysicsBodies() {
    console.log('开始修复所有物理体位置...');
    this.objects.forEach((object, id) => {
        if (object.userData && object.userData.physicsBody) {
            this.fixPhysicsBodyAlignment(object);
        }
    });
    this.models.forEach((model, id) => {
        if (model.userData && model.userData.physicsBody) {
            this.fixPhysicsBodyAlignment(model);
        }
    });
    console.log('所有物理体位置修复完成');
}
precomputeModelBounds(model) {
    if (!model) return;
    model.updateMatrixWorld(true);
    model.traverse((child) => {
        if (child.isMesh && child.geometry) {
            const geom = child.geometry;
            if (!geom.boundingBox) {
                geom.computeBoundingBox();
            }
            if (!geom.boundingSphere) {
                geom.computeBoundingSphere();
            }
        }
    });
    const bbox = this.getModelWorldBBox(model);
    if (!model.userData) model.userData = {};
    model.userData.cachedBBoxWorld = bbox.clone();
}
getModelWorldBBox(model) {
    if (!model) return new THREE.Box3();
    if (model.userData && model.userData.cachedBBoxWorld) {
        return model.userData.cachedBBoxWorld.clone();
    }
    const bbox = new THREE.Box3();
    model.updateMatrixWorld(true);
    model.traverse((child) => {
        if (child.isMesh && child.geometry) {
            const geom = child.geometry;
            if (!geom.boundingBox) {
                geom.computeBoundingBox();
            }
            if (geom.boundingBox) {
                const bbWorld = geom.boundingBox.clone();
                bbWorld.applyMatrix4(child.matrixWorld);
                bbox.expandByPoint(bbWorld.min);
                bbox.expandByPoint(bbWorld.max);
            }
        }
    });
    if (!model.userData) model.userData = {};
    model.userData.cachedBBoxWorld = bbox.clone();
    return bbox;
}
createSimpleCollisionShape(model) {
    const bbox = this.getModelWorldBBox(model);
    const size = bbox.getSize(new THREE.Vector3());
    if (bbox.isEmpty() || size.x <= 0 || size.y <= 0 || size.z <= 0) {
        console.warn('无效的包围盒，使用默认尺寸');
        return new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    }
    if (this.enablePhysicsDebug) {
        console.log(`简单碰撞形状尺寸: ${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}`);
    }
    return new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
}
createComplexCollisionShape(model) {
    const shapes = [];
    const offsets = [];
    const orientations = [];
    model.updateMatrixWorld(true);
    const rootWorldMatrix = model.matrixWorld.clone();
    const invRootWorldMatrix = new THREE.Matrix4().copy(rootWorldMatrix).invert();
    console.log(`开始遍历模型网格，类型: ${model.type}`);
    model.traverse((child) => {
        if (child.isMesh && child.geometry) {
            try {
                child.updateMatrixWorld(true);
                const geometry = child.geometry;
                if (!geometry.boundingBox) {
                    geometry.computeBoundingBox();
                }
                const bbox = geometry.boundingBox.clone();
                bbox.applyMatrix4(child.matrixWorld);
                bbox.applyMatrix4(invRootWorldMatrix);
                const size = bbox.getSize(new THREE.Vector3());
                const center = bbox.getCenter(new THREE.Vector3());
                if (size.x > 0 && size.y > 0 && size.z > 0) {
                    const childShape = new CANNON.Box(new CANNON.Vec3(
                        size.x / 2,
                        size.y / 2, 
                        size.z / 2
                    ));
                    const offset = new CANNON.Vec3(center.x, center.y, center.z);
                    const childWorldQuat = new THREE.Quaternion();
                    childWorldQuat.setFromRotationMatrix(child.matrixWorld);
                    const rootWorldQuat = new THREE.Quaternion();
                    rootWorldQuat.setFromRotationMatrix(rootWorldMatrix);
                    const relativeQuat = childWorldQuat.clone().multiply(rootWorldQuat.clone().invert());
                    const orientation = new CANNON.Quaternion(
                        relativeQuat.x,
                        relativeQuat.y, 
                        relativeQuat.z,
                        relativeQuat.w
                    );
                    shapes.push(childShape);
                    offsets.push(offset);
                    orientations.push(orientation);
                    console.log(`添加网格碰撞形状: 尺寸(${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}), 偏移(${offset.x.toFixed(2)}, ${offset.y.toFixed(2)}, ${offset.z.toFixed(2)})`);
                }
            } catch (error) {
                console.warn(`处理子网格碰撞失败: ${child.name || '未命名'}, 错误: ${error.message}`);
            }
        }
    });
    console.log(`总共找到 ${shapes.length} 个网格碰撞形状`);
    if (shapes.length === 0) {
        console.warn('未找到有效的网格碰撞形状，回退到简单碰撞箱');
        return this.createSimpleCollisionShape(model);
    }
    const isZero = (vec) => vec.x === 0 && vec.y === 0 && vec.z === 0;
    const isIdentity = (quat) => quat.x === 0 && quat.y === 0 && quat.z === 0 && quat.w === 1;
    if (shapes.length === 1) {
        const shape = shapes[0];
        const offset = offsets[0];
        const orientation = orientations[0];
        if (!isZero(offset) || !isIdentity(orientation)) {
            return {
                isCompound: true,
                shapes: [shape],
                offsets: [offset],
                orientations: [orientation]
            };
        }
        return shape;
    } else {
        try {
            const compound = {
                isCompound: true,
                shapes: shapes,
                offsets: offsets,
                orientations: orientations
            };
            console.log(`成功创建复合碰撞形状，包含 ${shapes.length} 个子形状`);
            return compound;
        } catch (error) {
            console.warn(`创建复合形状失败: ${error.message}，使用简单碰撞箱`);
            return this.createSimpleCollisionShape(model);
        }
    }
}
createTrimeshShapeFromModel(model) {
    try {
        console.log('开始提取模型顶点数据...');
        const vertices = [];
        const indices = [];
        let indexOffset = 0;
        model.traverse((child) => {
            if (child.isMesh && child.geometry) {
                const geometry = child.geometry;
                if (!geometry.attributes.position) {
                    console.warn('子网格没有位置属性，跳过');
                    return;
                }
                child.updateMatrixWorld(true);
                const worldMatrix = child.matrixWorld.clone();
                const positionAttribute = geometry.attributes.position;
                const originalVertexCount = positionAttribute.count;
                for (let i = 0; i < originalVertexCount; i++) {
                    const vertex = new THREE.Vector3();
                    vertex.fromBufferAttribute(positionAttribute, i);
                    vertex.applyMatrix4(worldMatrix);
                    vertices.push(vertex.x, vertex.y, vertex.z);
                }
                if (geometry.index) {
                    const indexAttribute = geometry.index;
                    for (let i = 0; i < indexAttribute.count; i++) {
                        indices.push(indexAttribute.getX(i) + indexOffset);
                    }
                } else {
                    for (let i = 0; i < originalVertexCount; i += 3) {
                        indices.push(i + indexOffset, i + 1 + indexOffset, i + 2 + indexOffset);
                    }
                }
                indexOffset += originalVertexCount;
            }
        });
        if (vertices.length < 9) { 
            console.warn('顶点数据不足，使用包围盒回退方案');
            return this.createFallbackShape(model);
        }
        if (indices.length < 3) {
            console.warn('索引数据不足，使用包围盒回退方案');
            return this.createFallbackShape(model);
        }
        console.log(`成功提取 ${vertices.length/3} 个顶点, ${indices.length/3} 个三角形`);
        const cannonVertices = [];
        for (let i = 0; i < vertices.length; i += 3) {
            cannonVertices.push(vertices[i], vertices[i + 1], vertices[i + 2]);
        }
        const cannonIndices = [];
        for (let i = 0; i < indices.length; i++) {
            cannonIndices.push(indices[i]);
        }
        const trimeshShape = new CANNON.Trimesh(cannonVertices, cannonIndices);
        trimeshShape.updateAABB();
        trimeshShape.updateBoundingSphereRadius();
        console.log('三角网格碰撞形状创建成功');
        return trimeshShape;
    } catch (error) {
        console.error('创建三角网格形状失败:', error);
        return this.createFallbackShape(model);
    }
}
createFallbackShape(model) {
    console.log('使用包围盒回退方案');
    const bbox = this.getModelWorldBBox(model);
    const size = bbox.getSize(new THREE.Vector3());
    if (bbox.isEmpty() || size.x === 0 || size.y === 0 || size.z === 0) {
        console.warn('包围盒无效，使用默认形状');
        return new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    }
    return new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
}
optimizePhysicsForMap() {
    if (!this.physicsWorld) return;
    this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
    this.physicsWorld.solver.iterations = 10;
    this.physicsWorld.solver.tolerance = 0.001;
    this.physicsWorld.allowSleep = true;
    this.physicsWorld.sleepSpeedLimit = 0.1;
    this.physicsWorld.sleepTimeLimit = 1;
    console.log('物理引擎已优化用于地图碰撞');
}
addElasticConstraint(constraintId, modelIdA, modelIdB, options = {}) {
    try {
        const modelA = this.objects.get(modelIdA) || this.models.get(modelIdA);
        const modelB = this.objects.get(modelIdB) || this.models.get(modelIdB);
        if (!modelA || !modelB) {
            console.warn(`弹性约束创建失败：模型 ${modelIdA} 或 ${modelIdB} 不存在`);
            return false;
        }
        const bodyA = modelA.userData && modelA.userData.physicsBody;
        const bodyB = modelB.userData && modelB.userData.physicsBody;
        if (!bodyA || !bodyB) {
            console.warn(`弹性约束创建失败：模型 ${modelIdA} 或 ${modelIdB} 未物理化`);
            return false;
        }
        const posA = bodyA.position;
        const posB = bodyB.position;
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const dz = posB.z - posA.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.0001;
        const constraint = {
            id: String(constraintId),
            type: 'elastic',
            bodyA,
            bodyB,
            restLength: options.restLength != null ? Number(options.restLength) : dist,
            stiffness: options.stiffness != null ? Number(options.stiffness) : 50,
            damping: options.damping != null ? Number(options.damping) : 2,
            breakFactor: options.breakFactor != null ? Number(options.breakFactor) : 0.6, 
            allowRotation: options.allowRotation != null ? !!options.allowRotation : true,
            cannonConstraint: null
        };
        this.constraints.set(String(constraintId), constraint);
        bodyA.userData = bodyA.userData || {};
        bodyB.userData = bodyB.userData || {};
        bodyA.userData.constraints = bodyA.userData.constraints || new Map();
        bodyB.userData.constraints = bodyB.userData.constraints || new Map();
        bodyA.userData.constraints.set(String(constraintId), constraint);
        bodyB.userData.constraints.set(String(constraintId), constraint);
        console.log(`弹性约束 ${constraintId} 已创建：rest=${constraint.restLength.toFixed(3)} k=${constraint.stiffness} d=${constraint.damping} break=${constraint.breakFactor}`);
        return true;
    } catch (e) {
        console.error('创建弹性约束失败:', e);
        return false;
    }
}
removeConstraint(constraintId) {
    const id = String(constraintId);
    const c = this.constraints.get(id);
    if (!c) return false;
    try {
        if (c.cannonConstraint && this.physicsWorld) {
            try { this.physicsWorld.removeConstraint(c.cannonConstraint); } catch (e) {}
        }
        if (c.bodyA && c.bodyA.userData && c.bodyA.userData.constraints) {
            c.bodyA.userData.constraints.delete(id);
        }
        if (c.bodyB && c.bodyB.userData && c.bodyB.userData.constraints) {
            c.bodyB.userData.constraints.delete(id);
        }
        this.constraints.delete(id);
        return true;
    } catch (e) {
        console.error('移除约束失败:', e);
        return false;
    }
}
updateConstraints(deltaTime) {
    if (!this.physicsEnabled || !this.physicsWorld) return;
    const toRemove = [];
    const events = [];
    const dt = Math.max(0.0001, Number(deltaTime) || 0.016);
    this.constraints.forEach((c, id) => {
        if (c.type !== 'elastic') return;
        const bodyA = c.bodyA;
        const bodyB = c.bodyB;
        if (!bodyA || !bodyB) { toRemove.push(id); return; }
        const dx = bodyB.position.x - bodyA.position.x;
        const dy = bodyB.position.y - bodyA.position.y;
        const dz = bodyB.position.z - bodyA.position.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.0001;
        const nx = dx / dist, ny = dy / dist, nz = dz / dist;
        const extension = dist - c.restLength;
        if (Math.abs(extension) > c.restLength * c.breakFactor) {
            events.push({
                type: 'destroyed',
                id: id,
                reason: 'stretch_limit_exceeded',
                containerId: this.containerId
            });
            toRemove.push(id);
            return;
        }
        const k = c.stiffness;
        const springForceMag = -k * extension;
        const dvx = bodyB.velocity.x - bodyA.velocity.x;
        const dvy = bodyB.velocity.y - bodyA.velocity.y;
        const dvz = bodyB.velocity.z - bodyA.velocity.z;
        const vrel = dvx*nx + dvy*ny + dvz*nz;
        const dampingForceMag = -c.damping * vrel;
        let totalMag = springForceMag + dampingForceMag;
        const MAX_FORCE = 1e4;
        if (totalMag > MAX_FORCE) totalMag = MAX_FORCE;
        if (totalMag < -MAX_FORCE) totalMag = -MAX_FORCE;
        const fx = totalMag * nx;
        const fy = totalMag * ny;
        const fz = totalMag * nz;
        bodyA.applyForce(new CANNON.Vec3(-fx, -fy, -fz), bodyA.position);
        bodyB.applyForce(new CANNON.Vec3(fx, fy, fz), bodyB.position);
        if (typeof bodyA.wakeUp === 'function') bodyA.wakeUp();
        if (typeof bodyB.wakeUp === 'function') bodyB.wakeUp();
        if (!c.allowRotation) {
            bodyA.angularVelocity.scale(0.90, bodyA.angularVelocity);
            bodyB.angularVelocity.scale(0.90, bodyB.angularVelocity);
        }
    });
    for (const id of toRemove) {
        this.removeConstraint(id);
    }
    if (events.length) {
        this._destroyedConstraintsEvents.push(...events);
        this.lastConstraintEvent = events[events.length - 1];
    }
}
        playAnimation(modelId, animationName, loop = 'loop') {
            const model = this.models.get(modelId);
            if (!model || !model.userData.mixer) {
                console.warn(`模型 ${modelId} 不存在或没有动画`);
                return;
            }
            const action = model.userData.actions.get(animationName);
            if (!action) {
                console.warn(`动画 ${animationName} 不存在`);
                return;
            }
            const fps = 24;
            const normalizedLoop = (() => {
                const raw = String(loop ?? '').trim();
                if (!raw) return 'loop';
                if (raw === 'loop' || raw === 'once' || raw === 'hold' || raw === 'pingpong') return raw;
                switch (raw) {
                    case '循环播放':
                    case '重复':
                    case '重复播放':
                        return 'loop';
                    case '单次播放':
                    case '一次':
                    case '一次播放':
                        return 'once';
                    case '停止在最后一帧':
                    case '停最后一帧':
                        return 'hold';
                    case '往返播放':
                    case '来回播放':
                    case '乒乓播放':
                        return 'pingpong';
                    default:
                        return 'loop';
                }
            })();
            const currentAnimation = model.userData.currentAnimation || null;
            const transitionFrames = Number(model.userData.animationTransitionFrames ?? 0);
            const transitionSeconds = Math.max(0, transitionFrames) / fps;
            const transitionEasing = String(model.userData.animationTransitionEasing ?? '线性');
            if (model.userData.animationTransitionState) {
                const { fromAction, toAction } = model.userData.animationTransitionState;
                if (fromAction && fromAction !== action) fromAction.stop();
                if (toAction && toAction !== action) toAction.stop();
                model.userData.animationTransitionState = null;
            }
            action.clampWhenFinished = false;
            switch (normalizedLoop) {
                case 'loop':
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    break;
                case 'once':
                    action.setLoop(THREE.LoopOnce, 1);
                    action.clampWhenFinished = false;
                    break;
                case 'hold':
                    action.setLoop(THREE.LoopOnce, 1);
                    action.clampWhenFinished = true;
                    break;
                case 'pingpong':
                    action.setLoop(THREE.LoopPingPong, Infinity);
                    break;
            }
            this._applyAnimationPlaybackFrameCount(model, action, fps);
            if (currentAnimation && currentAnimation !== action && transitionSeconds > 0) {
                currentAnimation.enabled = true;
                currentAnimation.setEffectiveWeight(1);
                if (!currentAnimation.isRunning()) currentAnimation.play();
                action.enabled = true;
                action.setEffectiveWeight(0);
                action.reset();
                action.play();
                model.userData.animationTransitionState = {
                    fromAction: currentAnimation,
                    toAction: action,
                    elapsed: 0,
                    duration: transitionSeconds,
                    easing: transitionEasing
                };
                model.userData.currentAnimation = action;
                return;
            }
            if (currentAnimation && currentAnimation !== action) {
                currentAnimation.stop();
            }
            action.enabled = true;
            action.setEffectiveWeight(1);
            action.reset();
            action.play();
            model.userData.currentAnimation = action;
        }
        setAnimationPlaybackFrameCount(modelId, frameCount) {
            const model = this.models.get(modelId);
            if (!model || !model.userData.mixer) {
                console.warn(`模型 ${modelId} 不存在或没有动画`);
                return;
            }
            model.userData.animationPlaybackFrameCount = Number(frameCount);
            const action = model.userData.currentAnimation;
            if (action) {
                this._applyAnimationPlaybackFrameCount(model, action, 24);
            }
        }
        setAnimationProgressFrame(modelId, frame) {
            const model = this.models.get(modelId);
            if (!model || !model.userData.mixer) {
                console.warn(`模型 ${modelId} 不存在或没有动画`);
                return;
            }
            const action = model.userData.currentAnimation;
            if (!action) {
                console.warn(`模型 ${modelId} 当前没有播放动画`);
                return;
            }
            const fps = 24;
            const targetFrame = Math.max(0, Number(frame) || 0);
            const clip = action.getClip ? action.getClip() : null;
            const duration = clip ? Number(clip.duration) || 0 : 0;
            const targetTime = targetFrame / fps;
            action.time = duration > 0 ? Math.min(duration, targetTime) : targetTime;
            model.userData.mixer.update(0);
        }
        setAnimationTransition(modelId, transitionFrames, easing) {
            const model = this.models.get(modelId);
            if (!model) {
                console.warn(`模型 ${modelId} 不存在`);
                return;
            }
            const frames = Math.max(0, Number(transitionFrames) || 0);
            model.userData.animationTransitionFrames = frames;
            model.userData.animationTransitionEasing = String(easing ?? '线性');
        }
        _applyAnimationPlaybackFrameCount(model, action, fps = 24) {
            const rawFrames = Number(model?.userData?.animationPlaybackFrameCount);
            if (!Number.isFinite(rawFrames) || rawFrames === -1) {
                action.timeScale = 1;
                return;
            }
            const frames = Math.max(1, rawFrames);
            const clip = action.getClip ? action.getClip() : null;
            const duration = clip ? Number(clip.duration) || 0 : 0;
            if (!duration) return;
            const targetSeconds = frames / fps;
            action.timeScale = targetSeconds > 0 ? duration / targetSeconds : 1;
        }
        _easeValue(easing, t) {
            const x = Math.min(1, Math.max(0, Number(t) || 0));
            const key = String(easing ?? '').trim();
            switch (key) {
                case '二次':
                case 'quadratic':
                    return x * x;
                case '三次':
                case 'cubic':
                    return x * x * x;
                case '平滑':
                case 'smooth':
                    return x * x * (3 - 2 * x);
                case '弹性':
                case 'elastic': {
                    if (x === 0 || x === 1) return x;
                    const c4 = (2 * Math.PI) / 3;
                    return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
                }
                case '弹跳':
                case 'bounce': {
                    const n1 = 7.5625;
                    const d1 = 2.75;
                    if (x < 1 / d1) return n1 * x * x;
                    if (x < 2 / d1) {
                        const y = x - 1.5 / d1;
                        return n1 * y * y + 0.75;
                    }
                    if (x < 2.5 / d1) {
                        const y = x - 2.25 / d1;
                        return n1 * y * y + 0.9375;
                    }
                    const y = x - 2.625 / d1;
                    return n1 * y * y + 0.984375;
                }
                case '线性':
                case 'linear':
                default:
                    return x;
            }
        }
        stopAnimation(modelId) {
            const model = this.models.get(modelId);
            if (!model || !model.userData.mixer) {
                console.warn(`模型 ${modelId} 不存在或没有动画`);
                return;
            }
            if (model.userData.animationTransitionState) {
                const { fromAction, toAction } = model.userData.animationTransitionState;
                if (fromAction) fromAction.stop();
                if (toAction) toAction.stop();
                model.userData.animationTransitionState = null;
            }
            if (model.userData.currentAnimation) {
                model.userData.currentAnimation.stop();
                model.userData.currentAnimation = null;
            }
        }
        getAnimationList(modelId) {
            const model = this.models.get(modelId);
            if (!model || !model.userData.animations) {
                return [];
            }
            return model.userData.animations.map((clip, index) => 
                clip.name || `animation_${index}`
            );
        }
        updateAnimations(deltaTime) {
            this.models.forEach((model) => {
                if (model.userData.mixer) {
                    const transition = model.userData.animationTransitionState;
                    if (transition) {
                        const duration = Math.max(0.000001, Number(transition.duration) || 0.000001);
                        transition.elapsed = (Number(transition.elapsed) || 0) + (Number(deltaTime) || 0);
                        const t = Math.min(1, transition.elapsed / duration);
                        const eased = this._easeValue(transition.easing, t);
                        if (transition.fromAction) {
                            transition.fromAction.enabled = true;
                            transition.fromAction.setEffectiveWeight(1 - eased);
                        }
                        if (transition.toAction) {
                            transition.toAction.enabled = true;
                            transition.toAction.setEffectiveWeight(eased);
                        }
                        if (t >= 1) {
                            if (transition.fromAction) transition.fromAction.stop();
                            if (transition.toAction) transition.toAction.setEffectiveWeight(1);
                            model.userData.animationTransitionState = null;
                        }
                    }
                    model.userData.mixer.update(deltaTime);
                }
            });
        }
        checkCollision(modelId1, modelId2) {
            const model1 = this.models.get(modelId1);
            const model2 = this.models.get(modelId2);
            if (!model1 || !model2) {
                console.warn(`模型 ${modelId1} 或 ${modelId2} 不存在`);
                return false;
            }
            if (model1.userData.physicsBody && model2.userData.physicsBody) {
                const body1 = model1.userData.physicsBody;
                const body2 = model2.userData.physicsBody;
                for (let contact of this.physicsWorld.contacts) {
                    if ((contact.bi === body1 && contact.bj === body2) ||
                        (contact.bi === body2 && contact.bj === body1)) {
                        return true;
                    }
                }
                return false;
            }
            const box1 = this.getModelWorldBBox(model1);
            const box2 = this.getModelWorldBBox(model2);
            return box1.intersectsBox(box2);
        }
        getModelDistance(modelId1, modelId2) {
            const model1 = this.models.get(modelId1);
            const model2 = this.models.get(modelId2);
            if (!model1 || !model2) {
                console.warn(`模型 ${modelId1} 或 ${modelId2} 不存在`);
                return -1;
            }
            return model1.position.distanceTo(model2.position);
        }
        checkModelInRange(modelId, x, y, z, range) {
            const model = this.models.get(modelId);
            if (!model) {
                console.warn(`模型 ${modelId} 不存在`);
                return false;
            }
            const targetPosition = new THREE.Vector3(x, y, z);
            const distance = model.position.distanceTo(targetPosition);
            return distance <= range;
        }
        getAllCollisions() {
            const collisions = [];
            const modelIds = Array.from(this.models.keys());
            for (let i = 0; i < modelIds.length; i++) {
                for (let j = i + 1; j < modelIds.length; j++) {
                    if (this.checkCollision(modelIds[i], modelIds[j])) {
                        collisions.push({
                            model1: modelIds[i],
                            model2: modelIds[j]
                        });
                    }
                }
            }
            return collisions;
        }
        setCollisionCallback(modelId1, modelId2, callback) {
            if (!this.collisionCallbacks) {
                this.collisionCallbacks = new Map();
            }
            const key = `${modelId1}_${modelId2}`;
            const reverseKey = `${modelId2}_${modelId1}`;
            this.collisionCallbacks.set(key, callback);
            this.collisionCallbacks.set(reverseKey, callback);
        }
        updateCollisionDetection() {
            if (!this.collisionCallbacks) return;
            this.collisionCallbacks.forEach((callback, key) => {
                const [modelId1, modelId2] = key.split('_');
                if (this.checkCollision(modelId1, modelId2)) {
                    callback(modelId1, modelId2);
                }
            });
        }
        setModelPosition(modelId, x, y, z) {
            const model = this.models.get(modelId) || this.objects.get(modelId);
            if (model) {
                model.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
                if (model.userData) model.userData.cachedBBoxWorld = null;
                if (model.userData && model.userData.physicsBody) {
                    model.userData.physicsBody.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
                }
            }
        }
        setModelRotation(modelId, x, y, z) {
            const model = this.models.get(modelId) || this.objects.get(modelId);
            if (model) {
                model.rotation.set(
                    THREE.MathUtils.degToRad(parseFloat(x)),
                    THREE.MathUtils.degToRad(parseFloat(y)),
                    THREE.MathUtils.degToRad(parseFloat(z))
                );
                if (model.userData) model.userData.cachedBBoxWorld = null;
                if (model.userData && model.userData.physicsBody) {
                    model.userData.physicsBody.quaternion.setFromEuler(
                        THREE.MathUtils.degToRad(parseFloat(x)),
                        THREE.MathUtils.degToRad(parseFloat(y)),
                        THREE.MathUtils.degToRad(parseFloat(z))
                    );
                }
            }
        }
        setModelScale(modelId, x, y, z) {
            const model = this.models.get(modelId) || this.objects.get(modelId);
            if (model) {
                model.scale.set(parseFloat(x), parseFloat(y), parseFloat(z));
                if (model.userData) model.userData.cachedBBoxWorld = null;
            }
        }
        setModelRenderSide(modelId, side) {
            const model = this.models.get(modelId) || this.objects.get(modelId);
            if (model) {
                let sideValue;
                switch (side) {
                    case '正面':
                        sideValue = THREE.FrontSide;
                        break;
                    case '反面':
                        sideValue = THREE.BackSide;
                        break;
                    case '双面':
                        sideValue = THREE.DoubleSide;
                        break;
                    default:
                        sideValue = THREE.FrontSide;
                }
                model.traverse((child) => {
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => {
                                mat.side = sideValue;
                                mat.needsUpdate = true;
                            });
                        } else {
                            child.material.side = sideValue;
                            child.material.needsUpdate = true;
                        }
                    }
                });
            }
        }
showCollisionBoxes(show) {
    this.showingCollisionBoxes = show;
    if (show) {
        console.log('显示所有碰撞箱...');
        this.models.forEach((model, modelId) => {
            if (model.userData.physicsBody) {
                this.createCollisionBoxVisualization(modelId, model);
            }
        });
        this.objects.forEach((object, objectId) => {
            if (object.userData.physicsBody) {
                this.createCollisionBoxVisualization(objectId, object);
            }
        });
        console.log(`总共显示了 ${this.collisionBoxes.size} 个碰撞箱`);
    } else {
        this.collisionBoxes.forEach((boxGroup, id) => {
            this.scene.remove(boxGroup);
        });
        this.collisionBoxes.clear();
        console.log('隐藏所有碰撞箱');
    }
}
createCollisionBoxVisualization(id, model) {
    if (!model.userData.physicsBody) return;
    const body = model.userData.physicsBody;
    const boxGroup = new THREE.Group();
    const wireframeMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ff00, 
        transparent: true,
        opacity: 0.8
    });
    const trimeshMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff0000, 
        transparent: true,
        opacity: 0.6
    });
    console.log(`为 ${id} 创建碰撞箱可视化，形状数量: ${body.shapes ? body.shapes.length : 1}`);
    const bodyPos = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
    const bodyQuat = new THREE.Quaternion(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
    if (body.shapes && body.shapes.length > 0) {
        for (let i = 0; i < body.shapes.length; i++) {
            const shape = body.shapes[i];
            const shapeOffset = body.shapeOffsets ? body.shapeOffsets[i] : new CANNON.Vec3(0, 0, 0);
            const shapeOrientation = body.shapeOrientations ? body.shapeOrientations[i] : new CANNON.Quaternion(0, 0, 0, 1);
            const material = shape instanceof CANNON.Trimesh ? trimeshMaterial : wireframeMaterial;
            const offset3 = new THREE.Vector3(shapeOffset.x, shapeOffset.y, shapeOffset.z);
            const worldOffset = offset3.clone().applyQuaternion(bodyQuat);
            const worldPos = bodyPos.clone().add(worldOffset);
            const orientQ = new THREE.Quaternion(shapeOrientation.x, shapeOrientation.y, shapeOrientation.z, shapeOrientation.w);
            const worldQuat = bodyQuat.clone().multiply(orientQ);
            this.createShapeWireframe(shape, new CANNON.Vec3(worldPos.x, worldPos.y, worldPos.z), new CANNON.Quaternion(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w), material, boxGroup, i);
            console.log(`形状[${i}] worldPos: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)})`);
        }
    } else if (body.shape) {
        const worldPos = bodyPos.clone();
        const worldQuat = bodyQuat.clone();
        this.createShapeWireframe(body.shape, new CANNON.Vec3(worldPos.x, worldPos.y, worldPos.z), new CANNON.Quaternion(worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w), 
                                wireframeMaterial, boxGroup, 0);
    }
    boxGroup.position.set(0, 0, 0);
    boxGroup.quaternion.set(0, 0, 0, 1);
    this.scene.add(boxGroup);
    this.collisionBoxes.set(id, boxGroup);
    console.log(`碰撞箱组加入场景（世界坐标渲染），子元素数量: ${boxGroup.children.length}`);
}
createShapeWireframe(shape, offset, orientation, material, boxGroup) {
    let geometry;
    if (shape instanceof CANNON.Box) {
        const size = shape.halfExtents;
        geometry = new THREE.BoxGeometry(size.x * 2, size.y * 2, size.z * 2);
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, material);
        wireframe.position.set(offset.x, offset.y, offset.z);
        wireframe.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
        boxGroup.add(wireframe);
    } else if (shape instanceof CANNON.Sphere) {
        geometry = new THREE.SphereGeometry(shape.radius, 16, 12);
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, material);
        wireframe.position.set(offset.x, offset.y, offset.z);
        boxGroup.add(wireframe);
    } else if (shape instanceof CANNON.ConvexPolyhedron) {
        const verts = shape.vertices || [];
        const faces = shape.faces || [];
        const edges = new Set();
        const key = (a, b) => a < b ? `${a}-${b}` : `${b}-${a}`;
        for (const face of faces) {
            for (let i = 0; i < face.length; i++) {
                const a = face[i];
                const b = face[(i + 1) % face.length];
                edges.add(key(a, b));
            }
        }
        const positions = [];
        edges.forEach(edgeStr => {
            const [ai, bi] = edgeStr.split('-').map(n => parseInt(n, 10));
            const av = verts[ai];
            const bv = verts[bi];
            if (av && bv) {
                positions.push(av.x, av.y, av.z, bv.x, bv.y, bv.z);
            }
        });
        const lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const wireframe = new THREE.LineSegments(lineGeom, material);
        wireframe.position.set(offset.x, offset.y, offset.z);
        wireframe.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
        boxGroup.add(wireframe);
    } else if (shape instanceof CANNON.Trimesh) {
        console.log(`为三角网格创建简化碰撞箱显示`);
        shape.updateAABB();
        const aabb = shape.aabb;
        const min = aabb.lowerBound;
        const max = aabb.upperBound;
        const sizeX = Math.max(0.0001, max.x - min.x);
        const sizeY = Math.max(0.0001, max.y - min.y);
        const sizeZ = Math.max(0.0001, max.z - min.z);
        geometry = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, material);
        const centerX = (min.x + max.x) / 2;
        const centerY = (min.y + max.y) / 2;
        const centerZ = (min.z + max.z) / 2;
        wireframe.position.set(
            offset.x + centerX,
            offset.y + centerY, 
            offset.z + centerZ
        );
        wireframe.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
        boxGroup.add(wireframe);
    }
}
checkPhysicsCollision() {
    if (!this.physicsWorld) return;
    console.log('=== 物理世界状态检查 ===');
    console.log(`物理世界中的物体数量: ${this.physicsWorld.bodies.length}`);
    console.log(`重力: (${this.physicsWorld.gravity.x}, ${this.physicsWorld.gravity.y}, ${this.physicsWorld.gravity.z})`);
    this.physicsWorld.bodies.forEach((body, index) => {
        console.log(`物理体 ${index}:`);
        console.log(`  - 位置: (${body.position.x.toFixed(2)}, ${body.position.y.toFixed(2)}, ${body.position.z.toFixed(2)})`);
        console.log(`  - 质量: ${body.mass}`);
        console.log(`  - 类型: ${body.type === CANNON.Body.STATIC ? '静态' : '动态'}`);
        console.log(`  - 形状数量: ${body.shapes ? body.shapes.length : 1}`);
        console.log(`  - 是否睡眠: ${body.sleepState}`);
    });
}
updatePhysics(deltaTime) {
    if (this.physicsWorld && this.physicsEnabled) {
        const fixedTimeStep = 1/60;
        const maxSubSteps = 3;
        const clampedDeltaTime = Math.min(deltaTime, 0.1);
        try {
            const contactCountBefore = this.physicsWorld.contacts.length;
            this.physicsWorld.step(fixedTimeStep, clampedDeltaTime, maxSubSteps);
            if (this.physicsWorld.contacts.length > contactCountBefore) {
            }
            this.objects.forEach((object) => {
                if (object.userData && object.userData.physicsBody) {
                    const body = object.userData.physicsBody;
                    if (this.isPhysicsBodyValid(body)) {
                        object.position.copy(body.position);
                        object.quaternion.copy(body.quaternion);
                    } else {
                        console.warn(`检测到物理体异常，重置: ${object.name || '未命名对象'}`);
                        this.resetPhysicsBody(object, body);
                    }
                }
            });
            this.models.forEach((model) => {
                if (model.userData && model.userData.physicsBody) {
                    const body = model.userData.physicsBody;
                    if (this.isPhysicsBodyValid(body)) {
                        if (body.type !== CANNON.Body.STATIC) {
                            model.position.copy(body.position);
                            model.quaternion.copy(body.quaternion);
                            if (model.userData) model.userData.cachedBBoxWorld = null;
                        }
                    } else {
                        console.warn(`检测到模型物理体异常，重置: ${model.name || '未命名模型'}`);
                        this.resetPhysicsBody(model, body);
                    }
                }
            });
            this.updateConstraints(clampedDeltaTime);
            if (this._destroyedConstraintsEvents && this._destroyedConstraintsEvents.length) {
                const runtime = this.extension && this.extension.runtime;
                const eventOpcodeId = 'threedcontainer_whenElasticConstraintDestroyed';
                if (runtime && runtime.startHats) {
                    for (const ev of this._destroyedConstraintsEvents) {
                        try {
                            runtime.startHats(eventOpcodeId);
                        } catch (e) {
                            console.warn('触发约束破坏事件失败:', e);
                        }
                    }
                }
                this._destroyedConstraintsEvents.length = 0;
            }
        } catch (error) {
            console.error('物理引擎更新错误:', error);
        }
    }
}
createShapeWireframeLegacyLocal(shape, body, index, wireframeMaterial, boxGroup) {
    let geometry;
    if (shape instanceof CANNON.Box) {
        const size = shape.halfExtents;
        geometry = new THREE.BoxGeometry(size.x * 2, size.y * 2, size.z * 2);
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
        if (body.shapeOffsets && body.shapeOffsets[index]) {
            const offset = body.shapeOffsets[index];
            wireframe.position.set(offset.x, offset.y, offset.z);
        }
        if (body.shapeOrientations && body.shapeOrientations[index]) {
            const orientation = body.shapeOrientations[index];
            wireframe.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
        }
        boxGroup.add(wireframe);
    } else if (shape instanceof CANNON.Sphere) {
        geometry = new THREE.SphereGeometry(shape.radius, 16, 12);
        const edges = new THREE.EdgesGeometry(geometry);
        const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
        if (body.shapeOffsets && body.shapeOffsets[index]) {
            const offset = body.shapeOffsets[index];
            wireframe.position.set(offset.x, offset.y, offset.z);
        }
        boxGroup.add(wireframe);
    }
}
        removeModelPhysics(modelId) {
            const model = this.models.get(modelId) || this.objects.get(modelId);
            if (!model) {
                console.warn(`模型 ${modelId} 不存在`);
                return;
            }
            if (model.userData.physicsBody) {
                this.physicsWorld.removeBody(model.userData.physicsBody);
                model.userData.physicsBody = null;
                if (this.showingCollisionBoxes && this.collisionBoxes.has(modelId)) {
                    const boxGroup = this.collisionBoxes.get(modelId);
                    this.scene.remove(boxGroup);
                    this.collisionBoxes.delete(modelId);
                }
                console.log(`已取消模型 ${modelId} 的物理化`);
            } else {
                console.warn(`模型 ${modelId} 没有物理体`);
            }
        }
        getModelPosition(modelId) {
            const model = this.models.get(modelId) || this.objects.get(modelId);
            if (model) {
                return {
                    x: model.position.x,
                    y: model.position.y,
                    z: model.position.z
                };
            }
            return { x: 0, y: 0, z: 0 };
        }
        getModelRotation(modelId) {
            const model = this.models.get(modelId) || this.objects.get(modelId);
            if (model) {
                return {
                    x: THREE.MathUtils.radToDeg(model.rotation.x),
                    y: THREE.MathUtils.radToDeg(model.rotation.y),
                    z: THREE.MathUtils.radToDeg(model.rotation.z)
                };
            }
            return { x: 0, y: 0, z: 0 };
        }
        getModelScale(modelId) {
            const model = this.models.get(modelId) || this.objects.get(modelId);
            if (model) {
                return {
                    x: model.scale.x,
                    y: model.scale.y,
                    z: model.scale.z
                };
            }
            return { x: 1, y: 1, z: 1 };
        }
        dispose() {
            this.objects.forEach((object, id) => {
                this.scene.remove(object);
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => mat.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            this.objects.clear();
            this.models.forEach((model, id) => {
                this.scene.remove(model);
                if (model.geometry) model.geometry.dispose();
                if (model.material) {
                    if (Array.isArray(model.material)) {
                        model.material.forEach(mat => mat.dispose());
                    } else {
                        model.material.dispose();
                    }
                }
            });
            this.models.clear();
            this.lights.forEach((light, id) => {
                this.scene.remove(light);
                if (light instanceof THREE.SpotLight && light.target) {
                    this.scene.remove(light.target);
                }
            });
            this.lights.clear();
            this.particles.forEach((particle, id) => {
                this.scene.remove(particle);
                if (particle.geometry) particle.geometry.dispose();
                if (particle.material) particle.material.dispose();
            });
            this.particles.clear();
            this.collisionBoxes.forEach((boxGroup, id) => {
                this.scene.remove(boxGroup);
                boxGroup.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            });
            this.collisionBoxes.clear();
            if (this.renderer) {
                if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                    this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
                }
                this.renderer.dispose();
                this.renderer = null;
            }
            if (this.physicsWorld) {
                this.physicsWorld = null;
            }
            if (this.scene) {
                this.scene.clear();
                this.scene = null;
            }
            console.log(`容器 ${this.containerId} 资源已清理`);
        }
    setSize(width, height) {
        if (this.renderer && this.camera) {
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            if (this.composer) {
                this.composer.setSize(width, height);
                console.log('滤镜分辨率已更新:', width, 'x', height);
            }
        }
    }
    initializeFilters() {
        if (!this.renderer || !this.scene || !this.camera) {
            console.warn('无法初始化滤镜系统：渲染器、场景或相机未准备就绪');
            return;
        }
        if (!window.THREE) {
            console.error('THREE.js 未加载');
            return;
        }
        const originalTraverse = THREE.Object3D.prototype.traverse;
        THREE.Object3D.prototype.traverse = function(callback) {
            try {
                return originalTraverse.call(this, function(object) {
                    try {
                        callback(object);
                    } catch (error) {
                        if (error.message && error.message.includes('isMeshStandardMaterial')) {
                            console.warn('材质访问错误已忽略:', error.message);
                            return;
                        }
                        throw error;
                    }
                });
            } catch (error) {
                console.error('traverse错误:', error);
            }
        };
        this.ensureFilterComponents();
        try {
            this.composer = new THREE.EffectComposer(this.renderer);
            this.renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.renderPass.renderToScreen = true;
            this.composer.addPass(this.renderPass);
            if (this.renderer.getSize) {
                const size = new THREE.Vector2();
                this.renderer.getSize(size);
                this.composer.setSize(size.x, size.y);
            } else if (this.renderer.domElement) {
                const canvas = this.renderer.domElement;
                const width = canvas.width || canvas.clientWidth || 480;
                const height = canvas.height || canvas.clientHeight || 360;
                this.composer.setSize(width, height);
            }
            console.log('滤镜系统初始化成功');
            console.log('滤镜分辨率:', this.composer.renderTarget1.width, 'x', this.composer.renderTarget1.height);
            console.log('渲染器分辨率:', this.renderer.domElement.width, 'x', this.renderer.domElement.height);
        } catch (error) {
            console.error('滤镜系统初始化失败:', error);
            this.composer = null;
            this.renderPass = null;
        }
    }
    ensureFilterComponents() {
        if (!THREE.EffectComposer) {
            THREE.EffectComposer = function(renderer, renderTarget) {
                this.renderer = renderer;
                const pixelRatio = 1; 
                let actualWidth, actualHeight;
                if (renderTarget) {
                    actualWidth = renderTarget.width;
                    actualHeight = renderTarget.height;
                } else if (renderer.getSize) {
                    const size = new THREE.Vector2();
                    renderer.getSize(size);
                    actualWidth = size.x;
                    actualHeight = size.y;
                } else if (renderer.domElement) {
                    actualWidth = renderer.domElement.width || renderer.domElement.clientWidth || 480;
                    actualHeight = renderer.domElement.height || renderer.domElement.clientHeight || 360;
                } else {
                    actualWidth = 480;
                    actualHeight = 360;
                }
                const width = Math.floor(actualWidth * pixelRatio);
                const height = Math.floor(actualHeight * pixelRatio);
                this.renderTarget1 = renderTarget || new THREE.WebGLRenderTarget(width, height, {
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    format: THREE.RGBAFormat,
                    stencilBuffer: false
                });
                this.renderTarget2 = this.renderTarget1.clone();
                this.writeBuffer = this.renderTarget1;
                this.readBuffer = this.renderTarget2;
                this.passes = [];
                this.copyPass = null; 
                this.pixelRatio = pixelRatio;
            };
            THREE.EffectComposer.prototype = {
                addPass: function(pass) {
                    this.passes.push(pass);
                    pass.setSize(this.renderTarget1.width, this.renderTarget1.height);
                },
                removePass: function(pass) {
                    const index = this.passes.indexOf(pass);
                    if (index !== -1) {
                        this.passes.splice(index, 1);
                    }
                },
                render: function(delta) {
                    let maskActive = false;
                    for (let i = 0; i < this.passes.length; i++) {
                        const pass = this.passes[i];
                        if (pass.enabled === false) continue;
                        pass.render(this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive);
                        if (pass.needsSwap) {
                            if (maskActive) {
                                if (!this.copyPass && THREE.ShaderPass && THREE.CopyShader) {
                                    this.copyPass = new THREE.ShaderPass(THREE.CopyShader);
                                }
                                if (this.copyPass) {
                                    const context = this.renderer.context;
                                    context.stencilFunc(context.NOTEQUAL, 1, 0xffffffff);
                                    this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, delta);
                                    context.stencilFunc(context.EQUAL, 1, 0xffffffff);
                                }
                            }
                            this.swapBuffers();
                        }
                    }
                },
                swapBuffers: function() {
                    const tmp = this.readBuffer;
                    this.readBuffer = this.writeBuffer;
                    this.writeBuffer = tmp;
                },
                setSize: function(width, height) {
                    this.renderTarget1.setSize(width, height);
                    this.renderTarget2.setSize(width, height);
                    for (let i = 0; i < this.passes.length; i++) {
                        this.passes[i].setSize(width, height);
                    }
                }
            };
        }
        if (!THREE.RenderPass) {
            THREE.RenderPass = function(scene, camera, overrideMaterial, clearColor, clearAlpha) {
                this.scene = scene;
                this.camera = camera;
                this.overrideMaterial = overrideMaterial;
                this.clearColor = clearColor;
                this.clearAlpha = clearAlpha !== undefined ? clearAlpha : 0;
                this.clear = true;
                this.clearDepth = false;
                this.needsSwap = false;
            };
            THREE.RenderPass.prototype = {
                render: function(renderer, writeBuffer, readBuffer, delta, maskActive) {
                    const oldAutoClear = renderer.autoClear;
                    renderer.autoClear = false;
                    this.scene.overrideMaterial = this.overrideMaterial;
                    let oldClearColor, oldClearAlpha;
                    if (this.clearColor) {
                        oldClearColor = renderer.getClearColor().getHex();
                        oldClearAlpha = renderer.getClearAlpha();
                        renderer.setClearColor(this.clearColor, this.clearAlpha);
                    }
                    if (this.clearDepth) {
                        renderer.clearDepth();
                    }
                    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
                    if (this.clear) renderer.clear();
                    renderer.render(this.scene, this.camera);
                    if (this.clearColor) {
                        renderer.setClearColor(oldClearColor, oldClearAlpha);
                    }
                    this.scene.overrideMaterial = null;
                    renderer.autoClear = oldAutoClear;
                },
                setSize: function(width, height) {}
            };
        }
        if (!THREE.ShaderPass) {
            const cloneUniforms = function(uniforms) {
                const cloned = {};
                for (const key in uniforms) {
                    const uniform = uniforms[key];
                    cloned[key] = { value: uniform.value };
                }
                return cloned;
            };
            THREE.ShaderPass = function(shader, textureID) {
                this.textureID = textureID !== undefined ? textureID : "tDiffuse";
                if (shader instanceof THREE.ShaderMaterial) {
                    this.uniforms = shader.uniforms;
                    this.material = shader;
                } else if (shader) {
                    this.uniforms = cloneUniforms(shader.uniforms);
                    this.material = new THREE.ShaderMaterial({
                        defines: Object.assign({}, shader.defines),
                        uniforms: this.uniforms,
                        vertexShader: shader.vertexShader,
                        fragmentShader: shader.fragmentShader
                    });
                } else {
                    console.error('ShaderPass: 无效的shader参数');
                    this.material = new THREE.MeshBasicMaterial();
                    this.uniforms = {};
                }
                this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
                this.scene = new THREE.Scene();
                let planeGeometry;
                try {
                    if (THREE.PlaneGeometry) {
                        planeGeometry = new THREE.PlaneGeometry(2, 2);
                    } else if (THREE.PlaneBufferGeometry) {
                        planeGeometry = new THREE.PlaneBufferGeometry(2, 2);
                    } else {
                        console.error('无法找到PlaneGeometry或PlaneBufferGeometry');
                        return;
                    }
                } catch (error) {
                    console.error('创建平面几何体失败:', error);
                    return;
                }
                this.quad = new THREE.Mesh(planeGeometry, this.material);
                this.quad.frustumCulled = false;
                this.scene.add(this.quad);
            };
            THREE.ShaderPass.prototype = {
                render: function(renderer, writeBuffer, readBuffer, delta, maskActive) {
                    if (this.uniforms && this.uniforms[this.textureID]) {
                        this.uniforms[this.textureID].value = readBuffer.texture;
                    }
                    if (this.material && this.quad) {
                        this.quad.material = this.material;
                    }
                    if (this.renderToScreen) {
                        renderer.setRenderTarget(null);
                        renderer.render(this.scene, this.camera);
                    } else {
                        renderer.setRenderTarget(writeBuffer);
                        if (this.clear) renderer.clear();
                        renderer.render(this.scene, this.camera);
                    }
                },
                setSize: function(width, height) {}
            };
        }
        if (!THREE.CopyShader) {
            THREE.CopyShader = {
                uniforms: {
                    "tDiffuse": { value: null },
                    "opacity": { value: 1.0 }
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float opacity;
                    uniform sampler2D tDiffuse;
                    varying vec2 vUv;
                    void main() {
                        vec4 texel = texture2D(tDiffuse, vUv);
                        gl_FragColor = opacity * texel;
                    }
                `
            };
        }
    }
    createSepiaFilter(intensity = 1.0) {
        if (!window.THREE.ShaderPass) {
            console.error('ShaderPass 不可用');
            return null;
        }
        const sepiaShader = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: intensity }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec3 c = color.rgb;
                    color.r = dot(c, vec3(.393, .769, .189));
                    color.g = dot(c, vec3(.349, .686, .168));
                    color.b = dot(c, vec3(.272, .534, .131));
                    gl_FragColor = vec4(mix(c, color.rgb, amount), color.a);
                }
            `
        };
        return new THREE.ShaderPass(sepiaShader);
    }
    createGrayscaleFilter(intensity = 1.0) {
        if (!window.THREE.ShaderPass) {
            console.error('ShaderPass 不可用');
            return null;
        }
        const grayscaleShader = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: intensity }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                    gl_FragColor = vec4(mix(color.rgb, vec3(gray), amount), color.a);
                }
            `
        };
        return new THREE.ShaderPass(grayscaleShader);
    }
    createVintageFilter(intensity = 1.0) {
        if (!window.THREE.ShaderPass) {
            console.error('ShaderPass 不可用');
            return null;
        }
        const vintageShader = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: intensity }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec3 c = color.rgb;
                    // 复古色调调整
                    c.r = c.r * 0.9 + 0.1;
                    c.g = c.g * 0.8 + 0.05;
                    c.b = c.b * 0.6;
                    // 添加暖色调
                    c.r += 0.1;
                    c.g += 0.05;
                    gl_FragColor = vec4(mix(color.rgb, c, amount), color.a);
                }
            `
        };
        return new THREE.ShaderPass(vintageShader);
    }
    createBlackGoldFilter(intensity = 1.0) {
        if (!window.THREE.ShaderPass) {
            console.error('ShaderPass 不可用');
            return null;
        }
        const blackGoldShader = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: intensity }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec3 c = color.rgb;
                    // 计算亮度
                    float luminance = dot(c, vec3(0.299, 0.587, 0.114));
                    // 黑金效果
                    vec3 blackGold = vec3(0.0);
                    if (luminance > 0.3) {
                        blackGold = vec3(luminance * 1.2, luminance * 0.8, 0.0);
                    }
                    gl_FragColor = vec4(mix(color.rgb, blackGold, amount), color.a);
                }
            `
        };
        return new THREE.ShaderPass(blackGoldShader);
    }
    createVividFilter(intensity = 1.0) {
        if (!window.THREE.ShaderPass) {
            console.error('ShaderPass 不可用');
            return null;
        }
        const vividShader = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: intensity }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec3 c = color.rgb;
                    // 增强饱和度
                    float gray = dot(c, vec3(0.299, 0.587, 0.114));
                    vec3 vivid = mix(vec3(gray), c, 1.5);
                    // 增强对比度
                    vivid = (vivid - 0.5) * 1.2 + 0.5;
                    gl_FragColor = vec4(mix(color.rgb, vivid, amount), color.a);
                }
            `
        };
        return new THREE.ShaderPass(vividShader);
    }
    createFadedFilter(intensity = 1.0) {
        if (!window.THREE.ShaderPass) {
            console.error('ShaderPass 不可用');
            return null;
        }
        const fadedShader = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: intensity }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec3 c = color.rgb;
                    // 降低饱和度和对比度
                    float gray = dot(c, vec3(0.299, 0.587, 0.114));
                    vec3 faded = mix(c, vec3(gray), 0.3);
                    faded = faded * 0.8 + 0.2;
                    gl_FragColor = vec4(mix(color.rgb, faded, amount), color.a);
                }
            `
        };
        return new THREE.ShaderPass(fadedShader);
    }
    createCinematicFilter(intensity = 1.0) {
        if (!window.THREE.ShaderPass) {
            console.error('ShaderPass 不可用');
            return null;
        }
        const cinematicShader = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: intensity }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    vec3 c = color.rgb;
                    // 电影色调
                    c.r = c.r * 1.1;
                    c.g = c.g * 0.95;
                    c.b = c.b * 0.8;
                    // 添加暗角效果
                    float vignette = distance(vUv, vec2(0.5, 0.5));
                    vignette = smoothstep(0.8, 1.2, vignette);
                    c = mix(c, c * 0.3, vignette);
                    gl_FragColor = vec4(mix(color.rgb, c, amount), color.a);
                }
            `
        };
        return new THREE.ShaderPass(cinematicShader);
    }
    createOldTVFilter(intensity = 1.0) {
        if (!window.THREE.ShaderPass) {
            console.error('ShaderPass 不可用');
            return null;
        }
        const oldTVShader = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: intensity },
                time: { value: 0.0 },
                resolution: { value: new THREE.Vector2(1, 1) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                uniform float time;
                uniform vec2 resolution;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    // 降低饱和度（老电视色彩）
                    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                    vec3 oldTV = mix(color.rgb, vec3(gray), amount * 0.5);
                    // 添加扫描线效果
                    //float scanLine = sin(vUv.y * resolution.y * 3.14159 * 2.0) * 0.1 + 0.9;
                    //oldTV *= scanLine;
                    // 添加轻微噪点
                    float noise = fract(sin(dot(vUv + time, vec2(12.9898, 78.233))) * 43758.5453);
                    oldTV += (noise - 0.5) * amount * 0.05;
                    // 添加轻微模糊（老电视分辨率低）
                    vec2 pixelSize = 1.0 / resolution;
                    vec4 blurColor = texture2D(tDiffuse, vUv + pixelSize * 0.5) * 0.25;
                    blurColor += texture2D(tDiffuse, vUv - pixelSize * 0.5) * 0.25;
                    blurColor += texture2D(tDiffuse, vUv + vec2(pixelSize.x, -pixelSize.y) * 0.5) * 0.25;
                    blurColor += texture2D(tDiffuse, vUv - vec2(pixelSize.x, -pixelSize.y) * 0.5) * 0.25;
                    oldTV = mix(oldTV, blurColor.rgb, amount * 0.3);
                    gl_FragColor = vec4(oldTV, color.a);
                }
            `
        };
        const pass = new THREE.ShaderPass(oldTVShader);
        if (!pass || !pass.material || !pass.material.uniforms) {
            console.error('老电视滤镜创建失败：ShaderPass或材质未正确初始化');
            return null;
        }
        pass.material.uniforms.time.value = 0;
        pass.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
        const animate = () => {
            if (pass.material && pass.material.uniforms && pass.material.uniforms.time) {
                pass.material.uniforms.time.value += 0.02;
            }
            requestAnimationFrame(animate);
        };
        animate();
        const resizeHandler = () => {
            if (pass.material && pass.material.uniforms && pass.material.uniforms.resolution) {
                pass.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
            }
        };
        window.addEventListener('resize', resizeHandler);
        return pass;
    }
    createComicFilter(intensity = 1.0) {
        if (!window.THREE.ShaderPass) {
            console.error('ShaderPass 不可用');
            return null;
        }
        const comicShader = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: intensity },
                resolution: { value: new THREE.Vector2(800, 600) }
            },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D tDiffuse;
                    uniform float amount;
                    uniform vec2 resolution;
                    varying vec2 vUv;
                    // 柔和颜色量化函数
                    vec3 softQuantize(vec3 color, float levels) {
                        return floor(color * levels + 0.5) / levels;
                    }
                    // 自然饱和度调整
                    vec3 adjustSaturation(vec3 color, float saturation) {
                        float gray = dot(color, vec3(0.299, 0.587, 0.114));
                        return mix(vec3(gray), color, saturation);
                    }
                    void main() {
                        vec4 originalColor = texture2D(tDiffuse, vUv);
                        // 边缘检测（使用更柔和的灰度转换）
                        vec2 pixelSize = 1.0 / resolution;
                        float edge = 0.0;
                        // Sobel边缘检测 - 使用更精确的亮度计算
                        float topLeft = dot(texture2D(tDiffuse, vUv + vec2(-pixelSize.x, pixelSize.y)).rgb, vec3(0.299, 0.587, 0.114));
                        float top = dot(texture2D(tDiffuse, vUv + vec2(0.0, pixelSize.y)).rgb, vec3(0.299, 0.587, 0.114));
                        float topRight = dot(texture2D(tDiffuse, vUv + vec2(pixelSize.x, pixelSize.y)).rgb, vec3(0.299, 0.587, 0.114));
                        float left = dot(texture2D(tDiffuse, vUv + vec2(-pixelSize.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                        float right = dot(texture2D(tDiffuse, vUv + vec2(pixelSize.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                        float bottomLeft = dot(texture2D(tDiffuse, vUv + vec2(-pixelSize.x, -pixelSize.y)).rgb, vec3(0.299, 0.587, 0.114));
                        float bottom = dot(texture2D(tDiffuse, vUv + vec2(0.0, -pixelSize.y)).rgb, vec3(0.299, 0.587, 0.114));
                        float bottomRight = dot(texture2D(tDiffuse, vUv + vec2(pixelSize.x, -pixelSize.y)).rgb, vec3(0.299, 0.587, 0.114));
                        float gx = -topLeft - 2.0 * left - bottomLeft + topRight + 2.0 * right + bottomRight;
                        float gy = -topLeft - 2.0 * top - topRight + bottomLeft + 2.0 * bottom + bottomRight;
                        edge = sqrt(gx * gx + gy * gy);
                        // 改进的颜色处理流程
                        vec3 processedColor = originalColor.rgb;
                        // 1. 轻微的颜色量化（使用更多级别保持平滑）
                        processedColor = softQuantize(processedColor, 12.0); // 从8级增加到12级
                        // 2. 轻微降低饱和度，让颜色更自然
                        processedColor = adjustSaturation(processedColor, 0.85); // 轻微降低饱和度
                        // 3. 柔和对比度增强
                        processedColor = pow(processedColor, vec3(0.95)); // 轻微对比度调整
                        // 4. 限制颜色范围，保持自然感
                        processedColor = clamp(processedColor, 0.05, 0.95); // 避免纯黑纯白
                        // 更柔和的边缘描边
                        float edgeStrength = smoothstep(0.08, 0.25, edge); // 调整阈值让描边更自然
                        vec3 finalColor = mix(processedColor, vec3(0.0), edgeStrength * amount * 0.7); // 降低描边强度
                        // 最终颜色微调，添加轻微的色彩平衡
                        finalColor = pow(finalColor, vec3(1.0 / 1.1)); // 轻微伽马校正
                        gl_FragColor = vec4(finalColor, originalColor.a);
                    }
                `
        };
        const pass = new THREE.ShaderPass(comicShader);
        if (!pass || !pass.material || !pass.material.uniforms) {
            console.error('漫画滤镜创建失败：ShaderPass或材质未正确初始化');
            return null;
        }
        pass.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
        const resizeHandler = () => {
            if (pass.material && pass.material.uniforms && pass.material.uniforms.resolution) {
                pass.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
            }
        };
        window.addEventListener('resize', resizeHandler);
        return pass;
    }
createSketchFilter(intensity = 1.0) {
    if (!window.THREE.ShaderPass) {
        console.error('ShaderPass 不可用');
        return null;
    }
    const sketchShader = {
        uniforms: {
            tDiffuse: { value: null },
            amount: { value: intensity },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform float amount;
            uniform vec2 resolution;
            varying vec2 vUv;
            // 改进的噪声函数
            float pencilNoise(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            // 多层噪声叠加，产生不均匀的铅笔质感
            float layeredNoise(vec2 uv) {
                float noise = 0.0;
                // 第一层：大颗粒噪声
                noise += pencilNoise(uv * 12.0) * 0.5; // 增加缩放和权重
                // 第二层：中等颗粒
                noise += pencilNoise(uv * 24.0 + vec2(12.34, 56.78)) * 0.4; // 增加缩放和权重
                // 第三层：小颗粒
                noise += pencilNoise(uv * 48.0 + vec2(90.12, 34.56)) * 0.3; // 增加缩放和权重
                // 第四层：微小颗粒
                noise += pencilNoise(uv * 96.0 + vec2(78.90, 12.34)) * 0.2; // 增加缩放和权重
                return noise;
            }
            // 方向性笔触 - 模拟铅笔的绘制方向
            float directionalStrokes(vec2 uv, float angle) {
                vec2 dir = vec2(cos(angle), sin(angle));
                float stroke = sin(uv.x * dir.x * 80.0 + uv.y * dir.y * 80.0); // 增加频率
                return smoothstep(-0.3, 0.3, stroke) * 0.3; // 增加强度
            }
            // 改进的边缘检测 - 降低灵敏度
            float getEdgeStrength(vec2 uv) {
                vec2 texel = 1.0 / resolution;
                float topLeft = dot(texture2D(tDiffuse, uv + vec2(-texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                float top = dot(texture2D(tDiffuse, uv + vec2(0.0, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                float topRight = dot(texture2D(tDiffuse, uv + vec2(texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                float left = dot(texture2D(tDiffuse, uv + vec2(-texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                float right = dot(texture2D(tDiffuse, uv + vec2(texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
                float bottomLeft = dot(texture2D(tDiffuse, uv + vec2(-texel.x, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                float bottom = dot(texture2D(tDiffuse, uv + vec2(0.0, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                float bottomRight = dot(texture2D(tDiffuse, uv + vec2(texel.x, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
                float gx = -topLeft - 2.0 * left - bottomLeft + topRight + 2.0 * right + bottomRight;
                float gy = -topLeft - 2.0 * top - topRight + bottomLeft + 2.0 * bottom + bottomRight;
                // 降低边缘检测的强度
                return clamp(length(vec2(gx, gy)) * 1.2, 0.0, 1.0);
            }
            float getLuminance(vec3 color) {
                return dot(color, vec3(0.299, 0.587, 0.114));
            }
            void main() {
                vec2 uv = vUv;
                vec4 color = texture2D(tDiffuse, uv);
                float luminance = getLuminance(color.rgb);
                // 计算边缘强度 - 提高阈值，减少边缘检测范围
                float edgeStrength = getEdgeStrength(uv);
                edgeStrength = smoothstep(0.1, 0.4, edgeStrength); // 提高阈值范围
                // 生成铅笔纹理
                vec2 textureUV = uv * 3.0; // 增加缩放使纹理更明显
                float pencilTexture = layeredNoise(textureUV);
                // 添加方向性笔触
                float strokes = directionalStrokes(uv, 0.785);
                strokes += directionalStrokes(uv * 1.5, 1.047) * 0.5;
                // 结合纹理和笔触 - 增加纹理的权重
                float texturePattern = pencilTexture * 0.8 + strokes * 0.4;
                // 根据亮度创建阴影层次
                float shadowIntensity = 1.0 - luminance;
                // 不均匀的铅笔效果 - 增加纹理影响
                float textureInfluence = shadowIntensity * 0.7; // 从0.4提高到0.7
                float unevenEffect = mix(1.0, texturePattern, textureInfluence);
                float sketch = 1.0;
                if (edgeStrength > 0.15) { // 提高边缘检测阈值
                    // 边缘区域 - 使用浅灰色而不是纯黑色
                    sketch = mix(0.3, 0.5, pencilTexture * 0.5); // 增加纹理影响
                } else {
                    // 非边缘区域 - 根据亮度创建阴影，加入不均匀的铅笔质感
                    sketch = luminance * unevenEffect;
                    // 增加中等亮度区域的纹理变化
                    if (luminance > 0.2 && luminance < 0.8) { // 扩大范围
                        sketch *= (0.85 + 0.3 * pencilTexture); // 增加纹理影响
                    }
                    // 降低对比度增强，使画面更明亮
                    sketch = pow(sketch, 0.9 + shadowIntensity * 0.1);
                    // 提高整体亮度，减少灰色感
                    sketch = mix(sketch, 1.0, 0.1);
                }
                // 纸张背景纹理 - 增加可见度
                vec2 paperScale = vec2(2.0, 2.0); // 减小缩放使纹理更明显
                float paperTexture = pencilNoise(uv * paperScale) * 0.1 + 0.9; // 增加强度
                sketch *= paperTexture;
                // 最终颜色，确保在合理范围内
                sketch = clamp(sketch, 0.0, 1.0);
                vec3 finalColor = vec3(sketch);
                gl_FragColor = vec4(mix(color.rgb, finalColor, amount), color.a);
            }
        `
    };
    const pass = new THREE.ShaderPass(sketchShader);
    if (!pass || !pass.material || !pass.material.uniforms) {
        console.error('素描滤镜创建失败：ShaderPass或材质未正确初始化');
        return null;
    }
    pass.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    const resizeHandler = () => {
        if (pass.material && pass.material.uniforms && pass.material.uniforms.resolution) {
            pass.material.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
        }
    };
    window.addEventListener('resize', resizeHandler);
    return pass;
}
    applyFilter(filterType, intensity = 1.0) {
        if (!this.composer) {
            console.error('滤镜系统未初始化');
            return;
        }
        intensity = Math.max(0.0, Math.min(100.0, intensity));
        if (this.currentFilterPass) {
            this.composer.removePass(this.currentFilterPass);
            this.currentFilterPass = null;
            if (this.renderPass) {
                this.renderPass.renderToScreen = true;
            }
        }
        let filterPass = null;
        switch (filterType) {
            case 'sepia':
                filterPass = this.createSepiaFilter(intensity);
                break;
            case 'grayscale':
                filterPass = this.createGrayscaleFilter(intensity);
                break;
            case 'vintage':
                filterPass = this.createVintageFilter(intensity);
                break;
            case 'blackgold':
                filterPass = this.createBlackGoldFilter(intensity);
                break;
            case 'vivid':
                filterPass = this.createVividFilter(intensity);
                break;
            case 'faded':
                filterPass = this.createFadedFilter(intensity);
                break;
            case 'cinematic':
                filterPass = this.createCinematicFilter(intensity);
                break;
            case 'oldtv':
                filterPass = this.createOldTVFilter(intensity);
                break;
            case 'comic':
                filterPass = this.createComicFilter(intensity);
                break;
            case 'sketch':
                filterPass = this.createSketchFilter(intensity);
                break;
            default:
                console.warn('未知的滤镜类型:', filterType);
                return;
        }
        if (filterPass) {
            this.renderPass.renderToScreen = false;
            filterPass.renderToScreen = true;
            this.composer.addPass(filterPass);
            this.currentFilterPass = filterPass;
            this.currentFilter = filterType;
            this.currentIntensity = intensity;
            this.filtersEnabled = true;
            console.log(`已应用滤镜: ${filterType}, 强度: ${intensity}`);
        }
    }
    setFilterIntensity(intensity) {
        if (this.currentFilterPass && this.currentFilterPass.uniforms && this.currentFilterPass.uniforms.amount) {
            intensity = Math.max(0.0, Math.min(100.0, intensity));
            this.currentFilterPass.uniforms.amount.value = intensity;
            this.currentIntensity = intensity;
            console.log(`滤镜强度已设置为: ${intensity}`);
        } else {
            console.warn('没有活动的滤镜或滤镜不支持强度调整');
        }
    }
    getFilterIntensity() {
        return this.currentIntensity || 1.0;
    }
    disableFilter() {
        if (this.currentFilterPass) {
            this.composer.removePass(this.currentFilterPass);
            this.currentFilterPass = null;
            this.currentFilter = null;
            this.filtersEnabled = false;
            if (this.renderPass) {
                this.renderPass.renderToScreen = true;
            }
            console.log('滤镜已禁用');
        }
    }
    getCurrentFilter() {
        return this.currentFilter;
    }
    isFilterEnabled() {
        return this.filtersEnabled;
    }
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.updatePhysics(1/60);
            this.updateWaterAnimations();
            if (this.filtersEnabled && this.composer) {
                this.composer.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }
        }
    }
    updateWaterAnimations() {
        if (this.waterAnimations) {
            const currentTime = Date.now();
            this.waterAnimations.forEach((animationData, modelId) => {
                const { water, startTime } = animationData;
                if (water && water.material && water.material.uniforms && water.material.uniforms['time']) {
                    water.material.uniforms['time'].value = (currentTime - startTime) * 0.0005;
                }
            });
        }
    }
    enableSkybox(enable) {
        if (enable) {
            if (!this.sky) {
                this.initializeSky();
            }
            this.skyEnabled = true;
            this.scene.background = this.sky;
        } else {
            this.skyEnabled = false;
            this.scene.background = new THREE.Color(0x87CEEB);
        }
    }
    setSkyTurbidity(turbidity) {
        if (this.sky && this.sky.material && this.sky.material.uniforms) {
            this.sky.material.uniforms['turbidity'].value = Math.max(0.1, Math.min(20, turbidity));
        }
    }
    setSkyRayleigh(rayleigh) {
        if (this.sky && this.sky.material && this.sky.material.uniforms) {
            this.sky.material.uniforms['rayleigh'].value = Math.max(0, Math.min(10, rayleigh));
        }
    }
    setAntialiasing(enabled) {
        this.antialiasingEnabled = enabled;
        if (this.renderer) {
            const oldSize = this.renderer.getSize(new THREE.Vector2());
            const container = this.renderer.domElement.parentNode;
            this.renderer.dispose();
            this.renderer = new THREE.WebGLRenderer({
                antialias: enabled,
                alpha: true,
                preserveDrawingBuffer: true,
                powerPreference: 'high-performance'
            });
            this.renderer.autoClear = true;
            this.renderer.setSize(oldSize.x, oldSize.y);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            if (container) {
                container.appendChild(this.renderer.domElement);
            }
        }
    }
    setVSync(enabled) {
        this.vsyncEnabled = enabled;
        console.log(`垂直同步${enabled ? '已启用' : '已禁用'}`);
    }
    setSkyTimeOfDay(timeOfDay) {
        this.currentTimeOfDay = timeOfDay;
        this.updateSkyForTimeOfDay();
    }
    setSkyCustomTime(hour, minute) {
        this.customHour = Math.max(0, Math.min(23, hour));
        this.customMinute = Math.max(0, Math.min(59, minute));
        if (this.currentTimeOfDay === '自定义') {
            this.updateSkyForTimeOfDay();
        }
    }
    updateSkyForTimeOfDay() {
        if (!this.sky || !this.skyEnabled) return;
        let hour = 12; 
        switch (this.currentTimeOfDay) {
            case '黎明': hour = 6; break;
            case '上午': hour = 9; break;
            case '正午': hour = 12; break;
            case '下午': hour = 15; break;
            case '黄昏': hour = 18; break;
            case '夜晚': hour = 21; break;
            case '深夜': hour = 0; break;
            case '自定义': hour = this.customHour; break;
        }
        const dayAngleDeg = (hour / 24) * 360; 
        this.setSunByDayAngle(dayAngleDeg);
        if (this.sunLight) {
            const sunHeight = Math.max(0, this.sun.y);
            const intensity = Math.max(0.05, sunHeight); 
            this.sunLight.intensity = intensity;
            if (sunHeight < 0.1) {
                this.sunLight.color.setHSL(0.6, 0.8, 0.3);
            } else if (sunHeight < 0.3) {
                this.sunLight.color.setHSL(0.08, 0.9, 0.8);
            } else {
                this.sunLight.color.setHSL(0, 0, 1);
            }
        }
        const sunAngle = (dayAngleDeg / 360) * Math.PI * 2;
        this.updateCloudAndStarVisibility(sunAngle);
    }
    updateCloudAndStarVisibility(sunAngle) {
        const sunHeight = Math.max(0, this.sun.y);
        if (this.starsEnabled && this.starParticles) {
            const shouldShowStars = sunHeight < 0.2;
            this.starParticles.visible = shouldShowStars;
            if (shouldShowStars) {
                const starOpacity = Math.max(0, (0.2 - sunHeight) / 0.2) * this.starIntensity;
                this.starParticles.material.opacity = starOpacity;
            }
        }
        if (this.cloudsEnabled && this.cloudParticles.length > 0) {
            const cloudOpacity = Math.max(0.3, sunHeight * 0.7 + 0.3);
            this.cloudParticles.forEach(cloud => {
                if (cloud.material) {
                    cloud.material.opacity = cloudOpacity * (this.cloudType === '贴图云' ? 0.8 : 1.0);
                }
            });
        }
    }
    enableSkyClouds(enabled) {
        this.cloudsEnabled = enabled;
        if (enabled) {
            this.createClouds();
        } else {
            this.removeClouds();
        }
    }
    createClouds() {
        this.removeClouds(); 
        if (this.cloudType === '贴图云') {
            this.createTextureClouds();
        } else if (this.cloudType === '粒子云') {
            this.createParticleClouds();
        }
    }
    createTextureClouds() {
        const cloudCount = Math.floor(this.cloudDensity * 50); 
        for (let i = 0; i < cloudCount; i++) {
            const cloudGeometry = new THREE.PlaneGeometry(200 + Math.random() * 300, 100 + Math.random() * 150);
            const cloudMaterial = new THREE.MeshLambertMaterial({
                map: this.createAdvancedCloudTexture(),
                transparent: true,
                opacity: 0.7 + Math.random() * 0.3,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.x = (Math.random() - 0.5) * 4000;
            cloud.position.y = 150 + Math.random() * 200;
            cloud.position.z = (Math.random() - 0.5) * 4000;
            cloud.rotation.z = Math.random() * Math.PI * 2;
            cloud.rotation.y = Math.random() * Math.PI * 2;
            const scale = 0.8 + Math.random() * 0.4;
            cloud.scale.set(scale, scale, scale);
            this.cloudParticles.push(cloud);
            this.scene.add(cloud);
        }
    }
    createParticleClouds() {
        const cloudCount = Math.floor(this.cloudDensity * 800);
        const cloudGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(cloudCount * 3);
        for (let i = 0; i < cloudCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 3000;
            positions[i3 + 1] = Math.random() * 300 + 100;
            positions[i3 + 2] = (Math.random() - 0.5) * 3000;
        }
        cloudGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const cloudMaterial = new THREE.PointsMaterial({
            size: 80,
            map: this.createSimpleCloudTexture(),
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const clouds = new THREE.Points(cloudGeometry, cloudMaterial);
        this.cloudParticles.push(clouds);
        this.scene.add(clouds);
    }
    createAdvancedCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        context.fillStyle = 'rgba(0,0,0,0)';
        context.fillRect(0, 0, 256, 256);
        const gradient1 = context.createRadialGradient(128, 128, 0, 128, 128, 120);
        gradient1.addColorStop(0, 'rgba(255,255,255,0.9)');
        gradient1.addColorStop(0.4, 'rgba(255,255,255,0.7)');
        gradient1.addColorStop(0.7, 'rgba(255,255,255,0.3)');
        gradient1.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient1;
        context.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 8; i++) {
            const x = 64 + Math.random() * 128;
            const y = 64 + Math.random() * 128;
            const radius = 20 + Math.random() * 40;
            const gradient2 = context.createRadialGradient(x, y, 0, x, y, radius);
            gradient2.addColorStop(0, 'rgba(255,255,255,0.6)');
            gradient2.addColorStop(0.5, 'rgba(255,255,255,0.3)');
            gradient2.addColorStop(1, 'rgba(255,255,255,0)');
            context.fillStyle = gradient2;
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    createSimpleCloudTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    removeClouds() {
        this.cloudParticles.forEach(cloud => {
            this.scene.remove(cloud);
            if (cloud.geometry) cloud.geometry.dispose();
            if (cloud.material) {
                if (cloud.material.map) cloud.material.map.dispose();
                cloud.material.dispose();
            }
        });
        this.cloudParticles = [];
    }
    setSkyCloudDensity(density) {
        this.cloudDensity = Math.max(0, Math.min(1, density));
        if (this.cloudsEnabled) {
            this.createClouds(); 
        }
    }
    setSkyCloudType(cloudType) {
        this.cloudType = cloudType;
        if (this.cloudsEnabled) {
            this.createClouds(); 
        }
    }
    enableSkyStars(enabled) {
        this.starsEnabled = enabled;
        if (enabled) {
            this.createStars();
        } else {
            this.removeStars();
        }
    }
    createStars() {
        this.removeStars(); 
        const starCount = 5000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const radius = 10000; 
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            starPositions[i3 + 2] = radius * Math.cos(phi);
            const color = new THREE.Color();
            const temp = Math.random();
            if (temp > 0.8) {
                color.setHSL(0.6, 0.5, 0.8 + Math.random() * 0.2); 
            } else if (temp > 0.6) {
                color.setHSL(0.1, 0.3, 0.8 + Math.random() * 0.2); 
            } else {
                color.setHSL(0, 0, 0.8 + Math.random() * 0.2); 
            }
            starColors[i3] = color.r;
            starColors[i3 + 1] = color.g;
            starColors[i3 + 2] = color.b;
        }
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        const starMaterial = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            transparent: true,
            opacity: this.starIntensity,
            sizeAttenuation: false, 
            depthTest: false, 
            depthWrite: false
        });
        this.starParticles = new THREE.Points(starGeometry, starMaterial);
        this.starParticles.renderOrder = -1; 
        this.scene.add(this.starParticles);
        this.updateSkyForTimeOfDay();
    }
    removeStars() {
        if (this.starParticles) {
            this.scene.remove(this.starParticles);
            this.starParticles.geometry.dispose();
            this.starParticles.material.dispose();
            this.starParticles = null;
        }
    }
    setSkyStarIntensity(intensity) {
        this.starIntensity = Math.max(0, Math.min(2, intensity));
        if (this.starParticles && this.starParticles.material) {
            this.starParticles.material.opacity = this.starIntensity;
        }
    }
    hexToColor(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        return new THREE.Color(r, g, b);
    }
}
class Three3DSkin extends Scratch.vm.renderer.exports.Skin {
    constructor(id, renderer) {
        super(id, renderer);
        this._renderer = renderer;
        const gl = this._renderer.gl;
        this._texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this._nativeSize = renderer.getNativeSize();
        this._boundOnNativeSizeChanged = this.onNativeSizeChanged.bind(this);
        this._rotationCenter = [this._nativeSize[0] / 2, this._nativeSize[1] / 2];
        this._renderer.on('NativeSizeChanged', this._boundOnNativeSizeChanged);
        this.canvas = document.createElement('canvas');
        this.resizeCanvas();
    }
    dispose() {
        this._renderer.removeListener('NativeSizeChanged', this._boundOnNativeSizeChanged);
        if (this._texture) {
            const gl = this._renderer.gl;
            gl.deleteTexture(this._texture);
            this._texture = null;
        }
        super.dispose();
    }
    set size(newSize) {
        this._nativeSize = newSize;
        this._rotationCenter = [newSize[0] / 2, newSize[1] / 2];
        this.resizeCanvas();
    }
    get size() {
        return this._nativeSize;
    }
    getTexture(scale) {
        return this._texture || super.getTexture();
    }
    updateContent() {
        if (!this.canvas || !this._renderer || !this._renderer.gl) return;
        if (window.threeDExtensionInstance && window.threeDExtensionInstance.sceneManagers.size > 0) {
            const firstSceneManager = window.threeDExtensionInstance.sceneManagers.values().next().value;
            if (firstSceneManager && firstSceneManager.renderer) {
                const sourceCanvas = firstSceneManager.renderer.domElement;
                const ctx = this.canvas.getContext('2d');
                ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                ctx.drawImage(sourceCanvas, 0, 0);
            }
        }
        const gl = this._renderer.gl;
        if (!this._texture) {
            this._texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this._texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        if (this._silhouette && this._silhouette.update) this._silhouette.update(this.canvas);
        if (this.emitWasAltered) this.emitWasAltered();
    }
    resizeCanvas() {
        if (!this.canvas) return;
        if (this._renderer && this._renderer.useHighQualityRender && this._renderer.canvas) {
            this.canvas.width = this._renderer.canvas.width;
            this.canvas.height = this._renderer.canvas.height;
        } else {
            this.canvas.width = this._nativeSize[0];
            this.canvas.height = this._nativeSize[1];
        }
        this.updateContent();
    }
    onNativeSizeChanged(event) {
        this._nativeSize = event.newSize;
        this._rotationCenter = [this._nativeSize[0] / 2, this._nativeSize[1] / 2];
        this.resizeCanvas();
    }
    getBounds() {
        return {
            left: 0,
            top: 0,
            right: this._nativeSize[0],
            bottom: this._nativeSize[1]
        };
    }
}
if (typeof Scratch !== 'undefined' && typeof Scratch.extensions !== 'undefined') {
    Scratch.extensions.register(new ThreeDContainerExtension());
}