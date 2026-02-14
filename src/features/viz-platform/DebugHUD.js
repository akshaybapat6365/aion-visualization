import { scrollDirector } from './ScrollDirector.js';
import { vizController } from './VizController.js';

class DebugHUD {
    constructor() {
        this.element = null;
        this.isVisible = false;
        this.rafId = null;
    }

    init() {
        if (this.element) return;
        this._createDOM();
        this._bindEvents();

        // Check URL for auto-open
        if (new URLSearchParams(window.location.search).has('debug')) {
            this.toggle(true);
        }
    }

    _createDOM() {
        const hud = document.createElement('div');
        hud.className = 'debug-hud';
        hud.innerHTML = `
            <div class="debug-hud__header">
                <span class="debug-hud__title">AION DEBUG</span>
                <button class="debug-hud__toggle-btn" aria-label="Toggle Debug HUD">✕</button>
            </div>
            <div class="debug-hud__content">
                <div class="debug-hud__row">
                    <label>Narrative Time</label>
                    <span class="debug-hud__value" id="debug-global-val">0.000</span>
                </div>
                <input type="range" class="debug-hud__slider" id="debug-global-slider" min="0" max="1" step="0.001" value="0">
                
                <div class="debug-hud__row">
                    <label>Section</label>
                    <span class="debug-hud__value" id="debug-section-idx">-</span>
                </div>
                
                <div class="debug-hud__row">
                    <label>Section Progress</label>
                    <span class="debug-hud__value" id="debug-section-prog">0%</span>
                </div>
                <div class="debug-hud__bar">
                    <div class="debug-hud__bar-fill" id="debug-section-bar"></div>
                </div>

                <div class="debug-hud__actions">
                    <button class="debug-hud__btn" id="debug-reload-viz">Reload Viz</button>
                </div>
            </div>
        `;

        // Floating trigger button (visible when HUD is closed)
        const trigger = document.createElement('button');
        trigger.className = 'debug-hud__trigger';
        trigger.innerText = 'CMD';
        trigger.onclick = () => this.toggle(true);

        document.body.appendChild(hud);
        document.body.appendChild(trigger);

        this.element = hud;
        this.trigger = trigger;

        // Cache refs
        this.ui = {
            globalVal: hud.querySelector('#debug-global-val'),
            globalSlider: hud.querySelector('#debug-global-slider'),
            sectionIdx: hud.querySelector('#debug-section-idx'),
            sectionProg: hud.querySelector('#debug-section-prog'),
            sectionBar: hud.querySelector('#debug-section-bar'),
            reloadBtn: hud.querySelector('#debug-reload-viz'),
            closeBtn: hud.querySelector('.debug-hud__toggle-btn')
        };
    }

    _bindEvents() {
        // Toggle
        this.ui.closeBtn.onclick = () => this.toggle(false);

        document.addEventListener('keydown', (e) => {
            if (e.shiftKey && e.key === 'D') {
                this.toggle(!this.isVisible);
            }
        });

        // Slider scrubbing
        this.ui.globalSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.scrubTo(val);
        });

        // Listen to ScrollDirector
        scrollDirector.addEventListener('scroll-update', (e) => {
            this.update(e.detail);
        });

        // Reload Viz
        this.ui.reloadBtn.onclick = () => {
            if (vizController.currentChapterId) {
                vizController.loadChapter(vizController.currentChapterId);
            }
        };
    }

    toggle(forceState) {
        this.isVisible = typeof forceState === 'boolean' ? forceState : !this.isVisible;

        if (this.isVisible) {
            this.element.classList.add('debug-hud--visible');
            this.trigger.classList.add('debug-hud__trigger--hidden');
        } else {
            this.element.classList.remove('debug-hud--visible');
            this.trigger.classList.remove('debug-hud__trigger--hidden');
        }
    }

    scrubTo(progress) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, progress * docHeight);
    }

    update(data) {
        if (!this.isVisible) return;

        const { global, sectionIndex, sectionProgress } = data;

        // Avoid feedback loop if dragging? 
        // We only update slider if not currently dragging (document.activeElement check might be enough)
        if (document.activeElement !== this.ui.globalSlider) {
            this.ui.globalSlider.value = global;
        }

        this.ui.globalVal.textContent = global.toFixed(3);
        this.ui.sectionIdx.textContent = sectionIndex === -1 ? 'None' : `Sec ${sectionIndex}`;
        this.ui.sectionProg.textContent = `${Math.round(sectionProgress * 100)}%`;
        this.ui.sectionBar.style.width = `${sectionProgress * 100}%`;
    }
}

export const debugHUD = new DebugHUD();
