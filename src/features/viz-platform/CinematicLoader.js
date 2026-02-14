

class CinematicLoader {
    constructor() {
        this.element = null;
        this.progressRing = null;
        this.progressText = null;
        this.titleElement = null;
        this.subtitleElement = null;
        this.isVisible = false;

        this._createDOM();
    }

    _createDOM() {
        // idempotent
        if (document.getElementById('cinematic-loader')) {
            this.element = document.getElementById('cinematic-loader');
            return;
        }

        const loader = document.createElement('div');
        loader.id = 'cinematic-loader';
        loader.className = 'cinematic-loader';
        loader.innerHTML = `
            <div class="cinematic-loader__content">
                <div class="cinematic-loader__ring-container">
                    <svg class="progress-ring" width="120" height="120">
                        <circle class="progress-ring__circle-bg" stroke="rgba(255,255,255,0.1)" stroke-width="2" fill="transparent" r="52" cx="60" cy="60"/>
                        <circle class="progress-ring__circle" stroke="#d4af37" stroke-width="2" fill="transparent" r="52" cx="60" cy="60"/>
                    </svg>
                    <div class="cinematic-loader__logo">AION</div>
                </div>
                <h1 class="cinematic-loader__chapter-title"></h1>
                <p class="cinematic-loader__status">Initializing...</p>
            </div>
        `;

        document.body.appendChild(loader);
        this.element = loader;

        this.progressRing = loader.querySelector('.progress-ring__circle');
        this.progressText = loader.querySelector('.cinematic-loader__status');
        this.titleElement = loader.querySelector('.cinematic-loader__chapter-title');

        // Setup ring circumference for dashoffset animation
        const radius = this.progressRing.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        this.progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
        this.progressRing.style.strokeDashoffset = circumference;
        this.circumference = circumference;
    }

    show(chapterId, title = '') {
        this.element.classList.add('cinematic-loader--visible');
        this.element.classList.remove('cinematic-loader--hidden');
        this.isVisible = true;

        // Reset state
        this.updateProgress(0);
        this.titleElement.textContent = title || `Chapter ${chapterId.replace('ch', '')}`;
        this.progressText.textContent = 'Loading Assets...';
    }

    updateProgress(pct) {
        if (!this.isVisible) return;

        // Clamp 0-1
        const value = Math.max(0, Math.min(1, pct));

        // Update Ring
        const offset = this.circumference - (value * this.circumference);
        this.progressRing.style.strokeDashoffset = offset;

        // Update Text
        this.progressText.textContent = value >= 1 ? 'Complete' : `Loading... ${Math.round(value * 100)}%`;
    }

    hide() {
        this.updateProgress(1); // Ensure full ring

        setTimeout(() => {
            this.element.classList.add('cinematic-loader--hidden');
            this.element.classList.remove('cinematic-loader--visible');
            this.isVisible = false;

            // Cleanup pointer events after transition
            setTimeout(() => {
                if (!this.isVisible) {
                    // double check race condition
                    // this.element.style.display = 'none'; // optional, CSS handles pointer-events
                }
            }, 600);
        }, 300); // Short delay to see 100%
    }
}

export const cinematicLoader = new CinematicLoader();
