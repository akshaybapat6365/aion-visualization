/**
 * ScrollDirector.js
 * 
 * The conductor of the "Living Canvas".
 * Maps raw scroll pixels to normalized "Narrative Time" (0.0 - 1.0).
 * 
 * Features:
 * - Global Progress: 0.0 (Top) to 1.0 (Bottom).
 * - Section Metering: Tracks which DOM section is active and interpolation within it.
 * - Damping: Smooths out jittery scroll inputs for fluid animation.
 */

export class ScrollDirector extends EventTarget {
    constructor() {
        super();
        this.progress = 0;
        this.targetProgress = 0;
        this.damping = 0.1; // Lower = smoother, Higher = more responsive

        this.sections = [];
        this.activeSectionIndex = -1;

        this._onScroll = this._onScroll.bind(this);
        this._loop = this._loop.bind(this);

        this.isActive = false;
    }

    init(scrollContainer = window) {
        this.container = scrollContainer;
        this.isActive = true;

        // Scan for sections
        this.updateMetrics();

        // Listeners
        window.addEventListener('scroll', this._onScroll, { passive: true });
        window.addEventListener('resize', () => this.updateMetrics());

        // Start loop
        this._loop();
    }

    updateMetrics() {
        // Find all narrative triggers (sections)
        const elements = document.querySelectorAll('.chapter-shell__section');
        this.sections = Array.from(elements).map(el => {
            const rect = el.getBoundingClientRect();
            const top = rect.top + window.scrollY;
            return {
                el,
                top,
                height: rect.height,
                bottom: top + rect.height
            };
        });

        // Document metrics
        this.docHeight = document.documentElement.scrollHeight - window.innerHeight;
    }

    _onScroll() {
        const y = window.scrollY;
        // Normalize 0-1
        this.targetProgress = Math.min(1, Math.max(0, y / this.docHeight));

        // Identify active section (broad phase)
        // We can do this in the loop for damping, or here for responsiveness.
        // Let's do it in loop to sync with smoothed progress.
    }

    _loop() {
        if (!this.isActive) return;

        // Damping: Lerp active progress towards target
        const diff = this.targetProgress - this.progress;

        if (Math.abs(diff) > 0.0001) {
            this.progress += diff * this.damping;

            // Calculate Section-specific progress based on SMOOTHED scroll
            const smoothedY = this.progress * this.docHeight;

            let currentSection = -1;
            let sectionProgress = 0;

            // Naive linear search (fine for < 20 sections)
            for (let i = 0; i < this.sections.length; i++) {
                const sec = this.sections[i];
                if (smoothedY >= sec.top - window.innerHeight && smoothedY < sec.bottom) {
                    currentSection = i;
                    // Provide 0.0-1.0 within this section
                    // We add a viewport buffer so 'enter' happens as it comes into view
                    const relativeY = smoothedY - (sec.top - window.innerHeight * 0.5);
                    sectionProgress = Math.min(1, Math.max(0, relativeY / sec.height));
                    break;
                }
            }

            if (currentSection !== this.activeSectionIndex) {
                this.activeSectionIndex = currentSection;
                this.dispatchEvent(new CustomEvent('section-change', { detail: { index: currentSection } }));
            }

            // Dispatch frame update
            this.dispatchEvent(new CustomEvent('scroll-update', {
                detail: {
                    global: this.progress,
                    sectionIndex: currentSection,
                    sectionProgress: sectionProgress
                }
            }));
        }

        requestAnimationFrame(this._loop);
    }

    dispose() {
        this.isActive = false;
        window.removeEventListener('scroll', this._onScroll);
    }
}

export const scrollDirector = new ScrollDirector();
