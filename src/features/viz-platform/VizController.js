import { VIZ_MANIFEST } from './viz-manifest-v2.js';
import BaseViz from './BaseViz.js';

/**
 * VizController
 * Singleton manager for the Aion visualization lifecycle.
 */
class VizController {
    constructor() {
        this.activeViz = null;
        this.container = null;
        this.currentChapterId = null;
    }

    /**
     * Initialize the controller with the global container.
     * @param {HTMLElement} container - The #viz-layer element.
     */
    init(container) {
        if (!container) throw new Error('VizController requires a container.');
        this.container = container;
    }

    /**
     * Load and mount a chapter visualization.
     * @param {string} chapterId - e.g. 'ch1'
     * @returns {Promise<void>}
     */
    async loadChapter(chapterId) {
        if (this.currentChapterId === chapterId && this.activeViz) return;

        // 1. Dispose previous
        if (this.activeViz) {
            this.activeViz.dispose();
            this.activeViz = null;
        }

        this.currentChapterId = chapterId;
        const path = VIZ_MANIFEST[chapterId];

        if (!path) {
            console.warn(`[VizController] No manifest entry for ${chapterId}`);
            return;
        }

        try {
            // 2. Dynamic Import
            const module = await import(path);
            const VizClass = module.default;

            if (!VizClass) {
                throw new Error(`Module ${path} does not export default.`);
            }

            // 3. Instantiate
            // We assume strict BaseViz contract for Phase 6, but handle legacy for now.
            this.activeViz = new VizClass(this.container);

            // 4. Start (if BaseViz)
            if (this.activeViz instanceof BaseViz) {
                // BaseViz auto-starts in constructor usually, but we ensure it here if needed
                if (!this.activeViz.isVisible) this.activeViz.start();
            }

        } catch (err) {
            console.error(`[VizController] Failed to load ${chapterId}:`, err);
            // TODO: Show fallback error UI in container?
        }
    }

    /**
     * Update the active visualization with new scroll state.
     * @param {object} scrollState - { globalProgress, sectionProgress, etc. }
     */
    onScroll(scrollState) {
        if (this.activeViz && typeof this.activeViz.onScroll === 'function') {
            this.activeViz.onScroll(scrollState);
        }
    }

    /**
     * Force a resize update.
     */
    onResize() {
        // BaseViz handles its own resize via Observer, but legacy might need help?
        // For now, no-op as BaseViz is self-sufficient.
    }
}

export const vizController = new VizController();
export default VizController;
