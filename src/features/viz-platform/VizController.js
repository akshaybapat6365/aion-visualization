import { VIZ_MANIFEST } from './viz-manifest-v3.js?v=1';
import { cinematicLoader } from './CinematicLoader.js';
import { assetLoader } from './AssetLoader.js';
import { debugHUD } from './DebugHUD.js';
import { visualHUD } from './VisualHUD.js';
import { navCompass } from './NavCompass.js';

/**
 * VizController
 * Orchestrates the lifecycle of 3D visualisations:
 * 1. Resolves Chapter ID -> Module Path
 * 2. Manages Loading UI (CinematicLoader)
 * 3. Preloads Assets (AssetLoader)
 * 4. Mounts/Unmounts Viz Modules
 */
class VizController {
    constructor() {
        this.container = null;
        this.activeViz = null;
        this.currentChapterId = null;
    }

    init(container) {
        this.container = container;
        console.log('[VizController] Initialized with container:', container);

        // Initialize Debug HUD
        debugHUD.init();

        // Initialize Zen Mode Manager
        visualHUD.init();

        // Initialize Nav Compass
        navCompass.init();
    }

    async loadChapter(chapterId) {
        if (!this.container) {
            console.warn('[VizController] No container set. Call init(container) first.');
            return;
        }

        console.log(`[VizController] Loading chapter: ${chapterId}`);

        // 1. Show Cinematic Loader
        cinematicLoader.show(chapterId);

        try {
            // 2. Dispose previous visualization
            if (this.activeViz) {
                console.log('[VizController] Disposing previous viz...');
                if (typeof this.activeViz.dispose === 'function') {
                    this.activeViz.dispose();
                } else {
                    // Safety fallback: clear container if dispose not implemented
                    this.container.innerHTML = '';
                }
                this.activeViz = null;
            }

            this.currentChapterId = chapterId;
            const modulePath = VIZ_MANIFEST[chapterId];

            if (!modulePath) {
                throw new Error(`No visualization mapped for ${chapterId}`);
            }

            // 3. Load Module Code
            cinematicLoader.updateProgress(0.1); // Started

            // Artificial delay to let the animation breathe (and show off the loader ~Jobsian aesthetic)
            // In production we might remove this, but for "Cinematic" feel it helps.
            const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));

            const [module] = await Promise.all([
                import(modulePath /* @vite-ignore */),
                minLoadTime
            ]);

            cinematicLoader.updateProgress(0.4); // Module loaded

            const VizClass = module.default;
            if (!VizClass) {
                throw new Error(`Module ${modulePath} has no default export`);
            }

            // 4. Instantiate
            // We pass the container (and potentially an options object)
            this.activeViz = new VizClass(this.container);

            // 5. Preload Assets (if supported by Viz Class)
            // If the class has a static 'getAssets' or 'assets' list, we use it.
            if (VizClass.assets || typeof VizClass.getAssets === 'function') {
                const assets = VizClass.assets || VizClass.getAssets();
                cinematicLoader.updateProgress(0.5);

                await assetLoader.loadManifest(assets, (pct) => {
                    // Map 0.5 -> 0.9 range
                    cinematicLoader.updateProgress(0.5 + (pct * 0.4));
                });
            } else {
                cinematicLoader.updateProgress(0.8);
            }

            // 6. Mount
            if (typeof this.activeViz.mount === 'function') {
                await this.activeViz.mount();
            } else {
                // Fallback for simple classes that might just use constructor
                console.warn('[VizController] Viz class has no mount() method.');
            }

            cinematicLoader.updateProgress(1.0);

            // 7. Hide Loader
            cinematicLoader.hide();

            console.log(`[VizController] Chapter ${chapterId} mounted successfully.`);

        } catch (err) {
            console.error(`[VizController] Failed to load ${chapterId}:`, err);
            cinematicLoader.hide(); // Hide anyway so user isn't stuck
            this.showError(err.message);
        }
    }

    showError(msg) {
        if (this.container) {
            this.container.innerHTML = `
                <div style="
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    color: rgba(255,255,255,0.7); font-family: sans-serif; text-align: center;
                ">
                    <h3 style="color: #ff6b6b">Visualization Error</h3>
                    <p>${msg}</p>
                </div>
            `;
        }
    }
}

export const vizController = new VizController();
