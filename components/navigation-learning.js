(function() {
    const MODE_KEY = 'aionContentMode';
    const PROGRESS_KEY = 'aionLearningProgress';

    function getCurrentMode() {
        return localStorage.getItem(MODE_KEY) || 'beginner';
    }

    function getModeProgress() {
        try {
            const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
            return allProgress[getCurrentMode()] || { completedChapters: {}, conceptMastery: {} };
        } catch (error) {
            return { completedChapters: {}, conceptMastery: {} };
        }
    }

    function injectNavLearningStyles() {
        if (document.getElementById('aion-nav-learning-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'aion-nav-learning-styles';
        style.textContent = `
            .mode-select-wrap { margin-top: 1rem; }
            .mode-select { width: 100%; background: #111; color: #D4AF37; border: 1px solid rgba(212, 175, 55, 0.4); padding: 0.4rem 0.5rem; }
            .progress-pill { display: inline-block; margin-left: 0.35rem; padding: 0.1rem 0.4rem; border-radius: 12px; font-size: 0.7rem; color: #000; background: rgba(212, 175, 55, 0.85); }
        `;
        document.head.appendChild(style);
    }

    function addModeSelector() {
        const navHeader = document.querySelector('.aion-nav .nav-header');
        if (!navHeader || navHeader.querySelector('.mode-select-wrap')) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'mode-select-wrap';
        wrapper.innerHTML = `
            <label for="mode-select" style="font-size:0.75rem;color:#888;">Reading mode</label>
            <select id="mode-select" class="mode-select">
                <option value="beginner">Beginner</option>
                <option value="scholar">Scholar</option>
                <option value="practitioner">Practitioner</option>
            </select>
        `;
        navHeader.appendChild(wrapper);

        const modeSelect = wrapper.querySelector('#mode-select');
        modeSelect.value = getCurrentMode();
        modeSelect.addEventListener('change', (event) => {
            localStorage.setItem(MODE_KEY, event.target.value);
            window.dispatchEvent(new CustomEvent('aion:mode-change', { detail: { mode: event.target.value } }));
            refreshProgressPills();
        });
    }

    function refreshProgressPills() {
        const progress = getModeProgress();
        document.querySelectorAll('.aion-nav .chapter-item').forEach((item, index) => {
            item.querySelector('.progress-pill')?.remove();
            const chapterNumber = String(index + 1);
            const completed = progress.completedChapters[chapterNumber];
            const mastery = progress.conceptMastery[chapterNumber] || 0;
            if (!completed && mastery === 0) {
                return;
            }

            const pill = document.createElement('span');
            pill.className = 'progress-pill';
            pill.textContent = `${completed ? '✓' : ''}${mastery > 0 ? ` ${mastery}%` : ''}`.trim();
            item.appendChild(pill);
        });
    }

    function loadChapterLearning() {
        const pathname = window.location.pathname;
        if (!pathname.includes('/chapters/chapter-') && !pathname.includes('/journey/chapter-') && !/chapter-?\d+/.test(pathname)) {
            return;
        }

        if (document.querySelector('script[data-aion-learning="true"]')) {
            return;
        }

        const script = document.createElement('script');
        script.src = '/components/chapter-learning.js';
        script.dataset.aionLearning = 'true';
        document.body.appendChild(script);
    }

    function init() {
        injectNavLearningStyles();
        addModeSelector();
        refreshProgressPills();
        loadChapterLearning();

        if (!window.__aionProgressListenerBound) {
            window.addEventListener('aion:progress-updated', refreshProgressPills);
            window.__aionProgressListenerBound = true;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
