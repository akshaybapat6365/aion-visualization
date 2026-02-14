/**
 * VisualHUD.js
 * Manages "Zen Mode" and UI visibility.
 * Auto-hides chrome (Nav, Debug toggle) when user is idle.
 */

class VisualHUD {
    constructor() {
        this.idleTimer = null;
        this.idleDelay = 4000; // 4 seconds
        this.isZen = false;

        // Elements to toggle
        this.targets = [];
    }

    init() {
        // Identify targets
        this.targets = [
            document.querySelector('.chapter-shell-topbar'),
            document.querySelector('.debug-hud__trigger'),
            // We don't hide the main text or the active debug pane if open
        ].filter(Boolean);

        this.bindEvents();
        this.resetTimer();

        console.log('[VisualHUD] Initialized. Zen mode active after 4s idle.');
    }

    bindEvents() {
        const reset = () => this.resetTimer();

        window.addEventListener('mousemove', reset, { passive: true });
        window.addEventListener('scroll', reset, { passive: true });
        window.addEventListener('keydown', reset, { passive: true });
        window.addEventListener('click', reset, { passive: true });
        window.addEventListener('touchstart', reset, { passive: true });
    }

    resetTimer() {
        if (this.isZen) {
            this.exitZenMode();
        }

        clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            this.enterZenMode();
        }, this.idleDelay);
    }

    enterZenMode() {
        if (this.isZen) return;
        this.isZen = true;
        document.body.classList.add('zen-mode-active');

        this.targets.forEach(el => {
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
            el.style.transition = 'opacity 1.5s ease-in-out';
        });
    }

    exitZenMode() {
        if (!this.isZen) return;
        this.isZen = false;
        document.body.classList.remove('zen-mode-active');

        this.targets.forEach(el => {
            el.style.opacity = '';
            el.style.pointerEvents = '';
            el.style.transition = 'opacity 0.3s ease-out';
        });
    }
}

export const visualHUD = new VisualHUD();
