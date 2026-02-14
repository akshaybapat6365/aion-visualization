/**
 * ImmersiveShell.js — Controller for the immersive chapter experience.
 *
 * Responsibilities:
 * - Manages HUD visibility (auto-fade, mouse-move reveal)
 * - Chapter navigation (prev/next/selector)
 * - Keyboard controls (arrows, escape, space)
 * - Loads visualization modules dynamically
 * - Info pill toggle
 */

const CHAPTERS = [
    { id: 'ch1', num: '01', title: 'The Ego', subtitle: 'The Point of Reference', thesis: 'The ego is the indispensable center of consciousness — a tiny, stable point floating above vast unknown bases, somatic and psychic.' },
    { id: 'ch2', num: '02', title: 'The Shadow', subtitle: 'The Moral Mirror', thesis: 'The shadow is a moral problem that challenges the whole ego-personality. Projections change the world into the replica of one\'s own unknown face.' },
    { id: 'ch3', num: '03', title: 'The Syzygy: Anima and Animus', subtitle: 'The Spinning Woman & The Pneumatic Sword', thesis: 'Anima and animus form a divine pair — the Spinning Woman Maya who creates illusion by her dancing, opposed by the pneumatic sword of the Logos.' },
    { id: 'ch4', num: '04', title: 'The Self', subtitle: 'Chaos into Cosmos', thesis: 'As magic circles they bind and subdue the lawless powers belonging to the world of darkness, and depict or create an order that transforms the chaos into a cosmos.' },
    { id: 'ch5', num: '05', title: 'Christ, a Symbol of the Self', subtitle: 'The Cast Shadow', thesis: 'The Antichrist develops as a perverse imitator of Christ\'s life — an imitating spirit of evil who follows like a shadow following the body.' },
    { id: 'ch6', num: '06', title: 'The Sign of the Fishes', subtitle: 'The Precession', thesis: 'The course of our religious history could have been predicted from the precession of the equinoxes through the constellation of Pisces.' },
    { id: 'ch7', num: '07', title: 'The Prophecies of Nostradamus', subtitle: 'The Projection Engine', thesis: 'Collective anxiety crystallizes into prophetic imagery — the psyche projects its fears forward in time.' },
    { id: 'ch8', num: '08', title: 'The Historical Significance of the Fish', subtitle: 'The Fossil Record', thesis: 'A motif accumulates layers of symbolic weight across centuries — from Oannes to ICHTHYS to the alchemical fish.' },
    { id: 'ch9', num: '09', title: 'The Ambivalence of the Fish Symbol', subtitle: 'The Double Nature', thesis: 'Christ has a number of symbols in common with the devil. The same symbol carries opposite meanings simultaneously.' },
    { id: 'ch10', num: '10', title: 'The Fish in Alchemy', subtitle: 'The Round Fish — Stella Maris', thesis: 'There is in the sea a round fish, lacking bones and cortex, which begins to shine when cooked on a slow fire — fire and water at once.' },
    { id: 'ch11', num: '11', title: 'The Alchemical Interpretation', subtitle: 'The Mercurial Axis', thesis: 'The heart of Mercurius is at the Pole. Fire has four aspects: intelligible, heavenly, elemental, and infernal — burning without light.' },
    { id: 'ch12', num: '12', title: 'Background to the Psychology of Christian Alchemical Symbolism', subtitle: 'The Amplification Lens', thesis: 'The interpretive lens — how to read religious symbols psychologically, revealing their hidden psychological meaning.' },
    { id: 'ch13', num: '13', title: 'Gnostic Symbols of the Self', subtitle: 'The Magnetic Ascent', thesis: 'To this water comes every nature to choose its own substances — more certainly than iron to the Heracleian stone.' },
    { id: 'ch14', num: '14', title: 'The Structure and Dynamics of the Self', subtitle: 'The Double Pyramid', thesis: 'The self is a true complexio oppositorum — circle and quaternity, from the highest Anthropos to the serpent in the depths.' },
];

export default class ImmersiveShell {
    constructor() {
        this.currentIndex = 0;
        this.isPaused = false;
        this.hudTimer = null;
        this.hudVisible = true;
        this.infoVisible = false;
        this.selectorVisible = false;
        this.currentViz = null;

        // Parse chapter from URL
        const params = new URLSearchParams(window.location.search);
        const ch = params.get('ch');
        if (ch) {
            const idx = CHAPTERS.findIndex(c => c.id === ch || c.num === ch);
            if (idx !== -1) this.currentIndex = idx;
        }

        this._bindDOM();
        this._bindEvents();
        this._updateHUD();
        this._startHUDTimer();
        this._loadVisualization();
    }

    get chapter() { return CHAPTERS[this.currentIndex]; }

    // ─── DOM Binding ───
    _bindDOM() {
        this.els = {
            canvas: document.getElementById('viz-canvas'),
            chapterId: document.getElementById('hud-chapter-id'),
            title: document.getElementById('hud-title'),
            infoToggle: document.getElementById('hud-info-toggle'),
            infoPill: document.getElementById('hud-info-pill'),
            infoText: document.getElementById('hud-info-text'),
            hud: document.getElementById('hud'),
            prevBtn: document.getElementById('nav-prev'),
            nextBtn: document.getElementById('nav-next'),
            selectorBtn: document.getElementById('nav-selector'),
            selector: document.getElementById('chapter-selector'),
            selectorGrid: document.getElementById('chapter-grid'),
            selectorClose: document.getElementById('selector-close'),
            pauseInd: document.getElementById('pause-indicator'),
            loadingScreen: document.getElementById('loading-screen'),
        };

        // Build chapter selector grid
        this._buildSelectorGrid();
    }

    _buildSelectorGrid() {
        if (!this.els.selectorGrid) return;
        this.els.selectorGrid.innerHTML = CHAPTERS.map((ch, i) => `
      <a class="chapter-card" href="?ch=${ch.id}" data-index="${i}">
        <div class="chapter-card-num">Chapter ${ch.num}</div>
        <div class="chapter-card-title">${ch.title}</div>
      </a>
    `).join('');

        // Intercept clicks for SPA-like navigation
        this.els.selectorGrid.querySelectorAll('.chapter-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = parseInt(card.dataset.index);
                this._navigateTo(idx);
            });
        });
    }

    // ─── Events ───
    _bindEvents() {
        // Keyboard
        document.addEventListener('keydown', (e) => this._onKey(e));

        // Mouse move → show HUD
        document.addEventListener('mousemove', () => this._showHUD());
        document.addEventListener('touchstart', () => this._showHUD(), { passive: true });

        // Nav buttons
        this.els.prevBtn?.addEventListener('click', () => this._prev());
        this.els.nextBtn?.addEventListener('click', () => this._next());
        this.els.selectorBtn?.addEventListener('click', () => this._toggleSelector());
        this.els.selectorClose?.addEventListener('click', () => this._closeSelector());

        // Info toggle
        this.els.infoToggle?.addEventListener('click', () => this._toggleInfo());
    }

    _onKey(e) {
        if (this.selectorVisible) {
            if (e.key === 'Escape') this._closeSelector();
            return;
        }

        switch (e.key) {
            case 'ArrowLeft': this._prev(); break;
            case 'ArrowRight': this._next(); break;
            case 'Escape': this._toggleInfo(); break;
            case ' ':
                e.preventDefault();
                this._togglePause();
                break;
        }
    }

    // ─── Navigation ───
    _prev() {
        if (this.currentIndex > 0) {
            this._navigateTo(this.currentIndex - 1);
        }
    }

    _next() {
        if (this.currentIndex < CHAPTERS.length - 1) {
            this._navigateTo(this.currentIndex + 1);
        }
    }

    _navigateTo(index) {
        if (index < 0 || index >= CHAPTERS.length) return;
        this.currentIndex = index;
        this.infoVisible = false;
        this._closeSelector();
        this._updateHUD();
        this._showHUD();
        this._loadVisualization();
        // Update URL without reload
        window.history.replaceState({}, '', `?ch=${this.chapter.id}`);
    }

    // ─── HUD Management ───
    _updateHUD() {
        const ch = this.chapter;
        if (this.els.chapterId) this.els.chapterId.textContent = `Chapter ${ch.num}`;
        if (this.els.title) this.els.title.textContent = ch.title;
        if (this.els.infoText) this.els.infoText.textContent = ch.thesis;
        if (this.els.infoPill) this.els.infoPill.classList.remove('visible');

        // Update nav button states
        if (this.els.prevBtn) this.els.prevBtn.disabled = this.currentIndex === 0;
        if (this.els.nextBtn) this.els.nextBtn.disabled = this.currentIndex === CHAPTERS.length - 1;
    }

    _showHUD() {
        if (!this.hudVisible) {
            this.hudVisible = true;
            this.els.hud?.classList.remove('faded');
        }
        this._startHUDTimer();
    }

    _startHUDTimer() {
        clearTimeout(this.hudTimer);
        this.hudTimer = setTimeout(() => {
            if (!this.infoVisible && !this.selectorVisible && !this.isPaused) {
                this.hudVisible = false;
                this.els.hud?.classList.add('faded');
            }
        }, 4000);
    }

    // ─── Info Pill ───
    _toggleInfo() {
        this.infoVisible = !this.infoVisible;
        this.els.infoPill?.classList.toggle('visible', this.infoVisible);
        if (this.infoVisible) this._showHUD();
    }

    // ─── Chapter Selector ───
    _toggleSelector() {
        this.selectorVisible ? this._closeSelector() : this._openSelector();
    }

    _openSelector() {
        this.selectorVisible = true;
        this.els.selector?.classList.add('visible');

        // Highlight current
        this.els.selectorGrid?.querySelectorAll('.chapter-card').forEach((card, i) => {
            card.style.borderColor = i === this.currentIndex ? 'rgba(212,175,55,0.4)' : '';
        });
    }

    _closeSelector() {
        this.selectorVisible = false;
        this.els.selector?.classList.remove('visible');
    }

    // ─── Pause ───
    _togglePause() {
        this.isPaused = !this.isPaused;
        this.els.pauseInd?.classList.toggle('visible', this.isPaused);

        if (this.currentViz) {
            this.isPaused ? this.currentViz.stop?.() : this.currentViz.start?.();
        }

        if (this.isPaused) this._showHUD();
    }

    // ─── Visualization Loading ───
    async _loadVisualization() {
        const ch = this.chapter;

        // Show loading
        this.els.loadingScreen?.classList.remove('hidden');

        // Dispose old viz
        if (this.currentViz) {
            this.currentViz.dispose?.();
            this.currentViz = null;
        }

        // Clear canvas container
        if (this.els.canvas) {
            this.els.canvas.innerHTML = '';
        }

        try {
            // Dynamically import the viz module
            const manifest = await import('/src/features/viz-platform/viz-manifest-v3.js');
            const vizPath = manifest.getVizPath(ch.id);

            if (vizPath) {
                const module = await import(vizPath);
                const VizClass = module.default;

                if (VizClass && this.els.canvas) {
                    this.currentViz = new VizClass(this.els.canvas, {
                        contextType: 'webgl',
                        immersive: true,
                    });
                    await this.currentViz.mount();
                }
            }
        } catch (err) {
            console.error(`[ImmersiveShell] Failed to load viz for ${ch.id}:`, err);
        }

        // Hide loading
        setTimeout(() => {
            this.els.loadingScreen?.classList.add('hidden');
        }, 300);
    }

    // ─── Cleanup ───
    dispose() {
        clearTimeout(this.hudTimer);
        if (this.currentViz) {
            this.currentViz.dispose?.();
            this.currentViz = null;
        }
    }
}

// Export chapters data for external use
export { CHAPTERS };
