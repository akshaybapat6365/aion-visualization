import { scrollDirector } from './ScrollDirector.js';

class NavCompass {
    constructor() {
        this.element = null;
        this.dots = [];
        this.sections = [];
    }

    init() {
        if (this.element) return;

        // Wait for sections to be ready (ScrollDirector might need a tick)
        // Or just listen for first scroll-update?
        // Better: Query sections now.
        this.sections = scrollDirector.sections || [];

        if (this.sections.length === 0) {
            // Retry once
            setTimeout(() => this.init(), 100);
            return;
        }

        this._createDOM();
        this._bindEvents();
    }

    _createDOM() {
        const compass = document.createElement('nav');
        compass.className = 'nav-compass';
        compass.ariaLabel = 'Chapter navigation';

        this.sections.forEach((sec, index) => {
            const dot = document.createElement('button');
            dot.className = 'nav-compass__dot';
            dot.ariaLabel = `Jump to section ${index + 1}`;
            dot.dataset.index = index;

            // Tooltip via title for now, or custom
            const title = sec.el.querySelector('.chapter-shell__section-title')?.textContent || `Section ${index + 1}`;
            dot.title = title;

            compass.appendChild(dot);
            this.dots.push(dot);
        });

        document.body.appendChild(compass);
        this.element = compass;
    }

    _bindEvents() {
        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-compass__dot')) {
                const index = parseInt(e.target.dataset.index, 10);
                this.jumpToSection(index);
            }
        });

        scrollDirector.addEventListener('section-change', (e) => {
            this.setActive(e.detail.index);
        });

        // Handle Zen Mode (VisualHUD handles generic .nav-compass if added to targets? 
        // No, current VisualHUD hardcodes targets. 
        // We should add .nav-compass to VisualHUD targets if possible, or just let it be.
        // Actually, let's just add the class 'chapter-shell-nav' to it if we want VisualHUD to pick it up?
        // Or updated VisualHUD to query generic selector.
        // For now, let it be always visible or handle its own fade?
        // Zen mode *should* hide compass too. I'll add logic to VisualHUD later or update NavCompass to listen for idle?
        // Let's assume VisualHUD handles .chapter-shell-topbar and debug trigger.
        // I should probably add this to VisualHUD targets.
    }

    jumpToSection(index) {
        if (index < 0 || index >= this.sections.length) return;
        const sec = this.sections[index];

        // Scroll to center of section if possible, or top
        const targetY = sec.top - (window.innerHeight * 0.1); // bit of padding

        window.scrollTo({
            top: targetY,
            behavior: 'smooth'
        });
    }

    setActive(index) {
        this.dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('nav-compass__dot--active');
            } else {
                dot.classList.remove('nav-compass__dot--active');
            }
        });
    }
}

export const navCompass = new NavCompass();
