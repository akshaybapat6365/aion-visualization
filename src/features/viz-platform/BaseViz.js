/**
 * BaseViz.js — Foundational abstract class for Aion visualizations.
 * 
 * Responsibilities:
 * - Manages the `requestAnimationFrame` loop.
 * - Manages `ResizeObserver` and canvas sizing (DPR-aware).
 * - Provides standardized lifecycle hooks: `init`, `update`, `render`, `dispose`.
 * - Exposes `context` (2D or WebGL) to subclasses.
 * 
 * LIFECYCLE (Phase 7 — Mount Pattern):
 * 1. constructor(container, options) — Stores refs only. Does NOT create canvas.
 * 2. mount() — Called by VizController. Creates canvas, waits for non-zero size,
 *              calls init(), starts animation loop.
 * 3. init() — Subclass override. Safe to access this.canvas, this.width, this.height.
 * 4. update(dt) / render() — Called every frame.
 * 5. dispose() — Cleanup.
 */
export default class BaseViz {
    constructor(container, options = {}) {
        if (!container) throw new Error('BaseViz requires a container element.');
        this.container = container;

        // Default options
        this.options = Object.assign({
            contextType: '2d',
            resizeDebounce: 100
        }, options);

        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.dpr = window.devicePixelRatio || 1;
        this.time = 0;
        this.frameId = null;
        this.isVisible = false;
        this.isMounted = false;
        this.scrollState = { globalProgress: 0, sectionProgress: 0, activeSection: 0 };

        this._onResize = this._onResize.bind(this);
        this._loop = this._loop.bind(this);
    }

    /**
     * Mount the visualization. Called by VizController AFTER the constructor.
     * This is the safe entry point that creates the canvas and calls init().
     */
    async mount() {
        if (this.isMounted) return;
        this.isMounted = true;

        console.log('[BaseViz] mount() start');

        // 1. Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.container.appendChild(this.canvas);

        // 2. Get context
        if (this.options.contextType === 'webgl' || this.options.contextType === 'webgl2') {
            // For WebGL, the Three.js renderer will create its own context from the canvas.
            // We store a reference but don't call getContext() — that would conflict.
            this.ctx = null;
        } else {
            this.ctx = this.canvas.getContext(this.options.contextType, {
                alpha: false,
                desynchronized: true
            });
        }

        // 3. Wait for container to have valid dimensions
        await this._ensureContainerSize();

        // 4. Resize observer for future changes
        this.resizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(() => this._onResize());
        });
        this.resizeObserver.observe(this.container);

        // 5. Initial resize
        this._onResize();

        // 6. Call subclass init
        console.log('[BaseViz] Calling init()...');
        await this.init();

        // 7. Start animation loop
        console.log('[BaseViz] init resolved, calling start()');
        this.start();
    }

    /**
     * Wait until the container has non-zero dimensions.
     * Retries up to 20 times (2 seconds total) with requestAnimationFrame.
     */
    _ensureContainerSize() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20;

            const check = () => {
                const rect = this.container.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    this.width = rect.width;
                    this.height = rect.height;
                    console.log(`[BaseViz] Container ready: ${this.width}x${this.height}`);
                    resolve();
                } else if (attempts < maxAttempts) {
                    attempts++;
                    requestAnimationFrame(check);
                } else {
                    // Fallback: use viewport size
                    console.warn('[BaseViz] Container has zero dimensions after timeout. Using viewport fallback.');
                    this.width = window.innerWidth;
                    this.height = window.innerHeight;
                    resolve();
                }
            };

            check();
        });
    }

    /* ─── Lifecycle Hooks (Override these) ─── */

    async init() { }

    update(dt) { }

    render() { }

    onResize(width, height) { }

    onScroll(scrollState) {
        this.scrollState = scrollState;
    }

    /* ─── Core Methods ─── */

    start() {
        if (!this.frameId) {
            this.isVisible = true;
            this.lastTime = performance.now();
            this._loop(this.lastTime);
        }
    }

    stop() {
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
            this.isVisible = false;
        }
    }

    dispose() {
        this.stop();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.ctx = null;
        this.isMounted = false;
    }

    _onResize() {
        if (!this.container || !this.canvas) return;

        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return; // Skip zero-size resizes

        this.width = rect.width;
        this.height = rect.height;
        this.dpr = window.devicePixelRatio || 1;

        // Resize canvas for high DPI
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;

        if (this.options.contextType === '2d' && this.ctx) {
            this.ctx.scale(this.dpr, this.dpr);
        }
        // Note: WebGL viewport is managed by Three.js renderer, not here.

        this.onResize(this.width, this.height);
    }

    _loop(timestamp) {
        if (!this.isVisible) return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        this.time += dt;

        this.update(dt);
        this.render();

        this.frameId = requestAnimationFrame(this._loop);
    }
}
