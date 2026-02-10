/**
 * VisualHUD.js
 * Manages the "Head-Up Display" and Interaction Modes (Zen Mode).
 */
export default class VisualHUD {
    constructor(container) {
        this.container = container;
        this.state = {
            isZenMode: false,
            chapterTitle: 'Identity',
            chapterNum: '01',
            progress: 0
        };

        this._render();
        this._bindEvents();
    }

    init(chapterId, title) {
        // Update labels based on chapter
        const num = chapterId.replace('ch', '').padStart(2, '0');
        this.updateChapterInfo(num, title);
    }

    updateChapterInfo(num, title) {
        this.elements.num.textContent = `CHAPTER ${num}`;
        this.elements.title.textContent = title;
    }

    updateProgress(progress) {
        // progress 0.0 to 1.0 (global)
        if (this.elements.progress) {
            this.elements.progress.style.width = `${progress * 100}%`;
        }
    }

    toggleZenMode() {
        this.state.isZenMode = !this.state.isZenMode;
        document.body.classList.toggle('zen-mode', this.state.isZenMode);
        this.elements.zenBtn.classList.toggle('active', this.state.isZenMode);
    }

    _render() {
        this.container.innerHTML = `
      <div id="hud-layer">
        <div class="hud-top">
          <a href="/" class="hud-logo">AION</a>
        </div>
        
        <div class="hud-bottom">
          <div class="hud-chapter-info">
            <span class="hud-chapter-number" id="hud-num">CHAPTER 01</span>
            <span class="hud-chapter-title" id="hud-title">The Ego</span>
          </div>
          
          <div class="hud-controls">
            <button class="hud-btn" id="btn-zen" title="Zen Mode (Toggle Text)">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="hud-btn" id="btn-atlas" title="Atlas / Menu">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                 <rect x="3" y="3" width="7" height="7"></rect>
                 <rect x="14" y="3" width="7" height="7"></rect>
                 <rect x="14" y="14" width="7" height="7"></rect>
                 <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="hud-progress-container">
          <div class="hud-progress-bar" id="hud-progress"></div>
        </div>
      </div>
    `;

        this.elements = {
            num: this.container.querySelector('#hud-num'),
            title: this.container.querySelector('#hud-title'),
            progress: this.container.querySelector('#hud-progress'),
            zenBtn: this.container.querySelector('#btn-zen'),
            atlasBtn: this.container.querySelector('#btn-atlas')
        };
    }

    _bindEvents() {
        this.elements.zenBtn.addEventListener('click', () => this.toggleZenMode());
        this.elements.atlasBtn.addEventListener('click', () => {
            window.location.href = '../../src/atlas/index.html';
        });

        // Keyboard shortcut 'Z' for Zen Mode
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'z') this.toggleZenMode();
        });
    }
}
