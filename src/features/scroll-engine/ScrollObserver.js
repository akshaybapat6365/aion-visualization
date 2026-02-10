/**
 * ScrollObserver v2.0 — The engine of the Scrollytelling architecture.
 * 
 * Responsibilities:
 * 1. Tracks global scroll progress (0.0 - 1.0).
 * 2. Implements LERP (Linear Interpolation) for smooth values.
 * 3. Tracks active section/card overlap with hysteresis.
 * 4. Dispatches 'scroll-update' events to VizController.
 */

const LERP_FACTOR = 0.08; // Lower = smoother/slower, Higher = tighter/faster
const EPSILON = 0.0001;

function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

export default class ScrollObserver {
    constructor() {
        this.state = {
            globalProgress: 0,
            targetGlobalProgress: 0,
            activeSection: 0,
            sectionProgress: 0,
            targetSectionProgress: 0,
            scrollY: 0
        };

        this.callbacks = new Set();
        this.sections = [];
        this.isRunning = false;
        this.frameId = null;

        this._onScroll = this._onScroll.bind(this);
        this._onResize = this._onResize.bind(this);
        this._loop = this._loop.bind(this);
    }

    init(sections) {
        this.sections = Array.from(sections);
        window.addEventListener('scroll', this._onScroll, { passive: true });
        window.addEventListener('resize', this._onResize, { passive: true });
        this._measure();
        this._onScroll(); // Initial check
        this.start();
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this._loop();
        }
    }

    stop() {
        this.isRunning = false;
        if (this.frameId) cancelAnimationFrame(this.frameId);
    }

    onUpdate(callback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    _measure() {
        this.docHeight = document.documentElement.scrollHeight;
        this.winHeight = window.innerHeight;
        this.sectionRects = this.sections.map(sec => {
            const rect = sec.getBoundingClientRect();
            const top = rect.top + window.scrollY;
            return {
                top,
                height: rect.height,
                bottom: top + rect.height
            };
        });
    }

    _onScroll() {
        const scrollY = window.scrollY;
        const maxScroll = Math.max(1, this.docHeight - this.winHeight);

        // Update Targets
        this.state.scrollY = scrollY;
        this.state.targetGlobalProgress = Math.min(1, Math.max(0, scrollY / maxScroll));

        // Determine target section state
        const viewCenter = scrollY + (this.winHeight * 0.5);
        let activeIndex = 0;
        let sectionProgress = 0;

        for (let i = 0; i < this.sectionRects.length; i++) {
            const rect = this.sectionRects[i];
            // Simple check: is viewCenter within this section (mostly)?
            // Or roughly: if viewCenter < rect.top, we are before it.
            // We want the index of the section currently "in focus".
            // A simple heuristic: find the last section whose top is above center.
            if (viewCenter >= rect.top) {
                activeIndex = i;
                // Calculate progress: 0 at top overlap, 1 at bottom overlap
                // Use a generous window (viewport height) for progress calculation
                const relY = viewCenter - rect.top;
                // Normalize with height + some buffer? 
                // For now, simple 0-1 within the rect height
                sectionProgress = Math.min(1, Math.max(0, relY / rect.height));
            }
        }

        this.state.activeSection = activeIndex; // Discrete jump is okay for index
        this.state.targetSectionProgress = sectionProgress;
    }

    _onResize() {
        this._measure();
        this._onScroll();
    }

    _loop() {
        if (!this.isRunning) return;

        // LERP Global Progress
        const dGlobal = this.state.targetGlobalProgress - this.state.globalProgress;
        if (Math.abs(dGlobal) > EPSILON) {
            this.state.globalProgress = lerp(this.state.globalProgress, this.state.targetGlobalProgress, LERP_FACTOR);
        } else {
            this.state.globalProgress = this.state.targetGlobalProgress;
        }

        // LERP Section Progress
        const dSection = this.state.targetSectionProgress - this.state.sectionProgress;
        if (Math.abs(dSection) > EPSILON) {
            this.state.sectionProgress = lerp(this.state.sectionProgress, this.state.targetSectionProgress, LERP_FACTOR);
        } else {
            this.state.sectionProgress = this.state.targetSectionProgress;
        }

        // Dispatch if there was movement
        if (Math.abs(dGlobal) > EPSILON || Math.abs(dSection) > EPSILON) {
            this._dispatch();
        }

        this.frameId = requestAnimationFrame(this._loop);
    }

    _dispatch() {
        const state = {
            globalProgress: this.state.globalProgress,
            activeSection: this.state.activeSection,
            sectionProgress: this.state.sectionProgress,
            scrollY: this.state.scrollY
        };

        for (const cb of this.callbacks) {
            cb(state);
        }
    }

    dispose() {
        this.stop();
        window.removeEventListener('scroll', this._onScroll);
        window.removeEventListener('resize', this._onResize);
        this.callbacks.clear();
    }
}
