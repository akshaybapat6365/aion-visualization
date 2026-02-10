/**
 * BaseViz.js — Foundational abstract class for Aion visualizations.
 * 
 * Responsibilities:
 * - Manages the `requestAnimationFrame` loop.
 * - Manages `ResizeObserver` and canvas sizing (DPR-aware).
 * - Provides standardized lifecycle hooks: `init`, `update`, `render`, `dispose`.
 * - Exposes `context` (2D or WebGL) to subclasses.
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
        this.scrollState = { globalProgress: 0, sectionProgress: 0, activeSection: 0 };

        this._onResize = this._onResize.bind(this);
        this._loop = this._loop.bind(this);

        this._initCore();
    }

    _initCore() {
        console.log('[BaseViz] _initCore start');
        this.canvas = document.createElement('canvas');
        this.canvas.style.display = 'block';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext(this.options.contextType, {
            alpha: false, // Performance optimization
            desynchronized: true
        });

        this.resizeObserver = new ResizeObserver((entries) => {
            window.requestAnimationFrame(() => this._onResize());
        });
        this.resizeObserver.observe(this.container);

        // Initial resize to set dimensions
        this._onResize();

        // Lifecycle: init
        console.log('[BaseViz] Scheduling init/start');
        Promise.resolve(this.init()).then(() => {
            console.log('[BaseViz] init resolved, calling start()');
            this.start();
        }).catch(err => console.error('[BaseViz] init failed:', err));
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
    }

    _onResize() {
        if (!this.container || !this.canvas) return;

        const rect = this.container.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.dpr = window.devicePixelRatio || 1;

        // Resize canvas for high DPI
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;

        if (this.options.contextType === '2d') {
            this.ctx.scale(this.dpr, this.dpr);
        } else if (this.options.contextType === 'webgl' || this.options.contextType === 'webgl2') {
            this.ctx.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

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
