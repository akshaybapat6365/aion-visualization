(function() {
    const STORAGE_KEYS = {
        mode: 'aionContentMode',
        progress: 'aionLearningProgress'
    };

    let metadata = null;
    let chapterNumber = null;

    function getCurrentMode() {
        return localStorage.getItem(STORAGE_KEYS.mode) || 'beginner';
    }

    function getProgress() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.progress) || '{}');
        } catch (error) {
            return {};
        }
    }

    function saveProgress(progress) {
        localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
        window.dispatchEvent(new CustomEvent('aion:progress-updated', { detail: { progress } }));
    }

    function ensureModeProgress(progress, mode) {
        if (!progress[mode]) {
            progress[mode] = {
                completedChapters: {},
                conceptMastery: {}
            };
        }
        return progress[mode];
    }

    function renderDepthPanel() {
        const chapter = metadata.chapters[String(chapterNumber)];
        if (!chapter) {
            return;
        }

        const chapterContent = document.querySelector('.chapter-content');
        if (!chapterContent) {
            return;
        }

        const existingDepthBlocks = chapterContent.querySelectorAll('.depth-content[data-depth]');
        if (existingDepthBlocks.length) {
            const byMode = {
                beginner: chapter.depthContent.beginner,
                scholar: chapter.depthContent.scholar,
                practitioner: chapter.depthContent.practitioner
            };
            existingDepthBlocks.forEach((block) => {
                const mode = block.getAttribute('data-depth');
                if (byMode[mode]) {
                    block.innerHTML = `<p>${byMode[mode]}</p>`;
                }
            });
            return;
        }

        const panel = document.createElement('section');
        panel.className = 'section depth-panel';
        panel.innerHTML = `
            <h2>Choose Your Reading Depth</h2>
            <p class="depth-helper">Switch modes from the left navigation. Content below updates instantly.</p>
            <div class="depth-content" data-depth="beginner">${chapter.depthContent.beginner}</div>
            <div class="depth-content" data-depth="scholar">${chapter.depthContent.scholar}</div>
            <div class="depth-content" data-depth="practitioner">${chapter.depthContent.practitioner}</div>
        `;

        chapterContent.insertBefore(panel, chapterContent.firstChild);
    }

    function applyModeVisibility(mode) {
        document.querySelectorAll('[data-depth]').forEach((element) => {
            element.style.display = element.getAttribute('data-depth') === mode ? '' : 'none';
        });
    }

    function updateProgressPanel() {
        const chapter = metadata.chapters[String(chapterNumber)];
        if (!chapter) {
            return;
        }

        const chapterContent = document.querySelector('.chapter-content');
        if (!chapterContent) {
            return;
        }

        let panel = chapterContent.querySelector('.progress-panel');
        if (!panel) {
            panel = document.createElement('section');
            panel.className = 'section progress-panel';
            chapterContent.appendChild(panel);
        }

        const mode = getCurrentMode();
        const progress = ensureModeProgress(getProgress(), mode);
        const isComplete = Boolean(progress.completedChapters[String(chapterNumber)]);
        const mastery = progress.conceptMastery[String(chapterNumber)] || 0;

        panel.innerHTML = `
            <h2>Mode Progress</h2>
            <p><strong>Mode:</strong> ${mode}</p>
            <p><strong>Chapter completion:</strong> ${isComplete ? 'Complete ✓' : 'In progress'}</p>
            <p><strong>Concept mastery:</strong> ${mastery}%</p>
            <p class="depth-helper">Completion and mastery are tracked separately for each mode.</p>
        `;
    }

    function markChapterComplete() {
        const mode = getCurrentMode();
        const progress = getProgress();
        const modeProgress = ensureModeProgress(progress, mode);

        if (modeProgress.completedChapters[String(chapterNumber)]) {
            return;
        }

        modeProgress.completedChapters[String(chapterNumber)] = true;
        saveProgress(progress);
        updateProgressPanel();
    }

    function setupCompletionTracking() {
        let recorded = false;
        window.addEventListener('scroll', () => {
            if (recorded) {
                return;
            }

            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (totalHeight <= 0) {
                return;
            }

            const ratio = window.scrollY / totalHeight;
            if (ratio > 0.85) {
                recorded = true;
                markChapterComplete();
            }
        }, { passive: true });
    }

    function renderAssessment() {
        const chapter = metadata.chapters[String(chapterNumber)];
        if (!chapter || !Array.isArray(chapter.assessment)) {
            return;
        }

        const chapterContent = document.querySelector('.chapter-content');
        if (!chapterContent || chapterContent.querySelector('.assessment-panel')) {
            return;
        }

        const panel = document.createElement('section');
        panel.className = 'section assessment-panel';
        panel.innerHTML = `
            <h2>Check understanding</h2>
            <p class="depth-helper">Quick, non-blocking check-in. Your result updates concept mastery for this mode.</p>
            <form id="micro-assessment-form"></form>
            <button type="button" class="viz-button" id="assessment-submit">Check now</button>
            <div id="assessment-result" style="margin-top: 1rem;"></div>
        `;

        chapterContent.appendChild(panel);

        const form = panel.querySelector('#micro-assessment-form');
        chapter.assessment.forEach((item, index) => {
            const block = document.createElement('fieldset');
            block.style.marginBottom = '1rem';
            block.style.border = '1px solid rgba(212, 175, 55, 0.2)';
            block.style.padding = '1rem';
            block.innerHTML = `<legend>Q${index + 1}. ${item.question}</legend>` + item.options.map((option, optionIndex) => `
                <label style="display:block; margin: 0.4rem 0; cursor:pointer;">
                    <input type="radio" name="${item.id}" value="${optionIndex}"> ${option}
                </label>
            `).join('');
            form.appendChild(block);
        });

        panel.querySelector('#assessment-submit').addEventListener('click', () => {
            let correct = 0;
            const explanations = [];

            chapter.assessment.forEach((item) => {
                const selected = form.querySelector(`input[name="${item.id}"]:checked`);
                if (selected && Number(selected.value) === item.answer) {
                    correct += 1;
                }
                explanations.push(`• ${item.explanation}`);
            });

            const score = Math.round((correct / chapter.assessment.length) * 100);
            const mode = getCurrentMode();
            const progress = getProgress();
            const modeProgress = ensureModeProgress(progress, mode);
            const previous = modeProgress.conceptMastery[String(chapterNumber)] || 0;
            modeProgress.conceptMastery[String(chapterNumber)] = Math.max(previous, score);
            saveProgress(progress);

            panel.querySelector('#assessment-result').innerHTML = `
                <p><strong>Score:</strong> ${score}% (best for this mode: ${modeProgress.conceptMastery[String(chapterNumber)]}%)</p>
                <p>${explanations.join('<br>')}</p>
            `;

            updateProgressPanel();
        });
    }

    function injectStyles() {
        if (document.getElementById('aion-learning-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'aion-learning-styles';
        style.textContent = `
            .depth-helper { color: #aaa; font-size: 0.95rem; }
            .depth-content { padding: 1rem; border-left: 3px solid #D4AF37; background: rgba(212, 175, 55, 0.08); }
            .assessment-panel .viz-button { background: transparent; }
        `;
        document.head.appendChild(style);
    }

    async function initChapterLearning() {
        const match = window.location.pathname.match(/chapter-?(\d+)\.html/);
        if (!match) {
            return;
        }

        chapterNumber = Number(match[1]);
        try {
            const response = await fetch('/data/learning-metadata.json');
            metadata = await response.json();
        } catch (error) {
            console.warn('Unable to load learning metadata', error);
            return;
        }

        injectStyles();
        renderDepthPanel();
        renderAssessment();
        applyModeVisibility(getCurrentMode());
        updateProgressPanel();
        setupCompletionTracking();

        window.addEventListener('aion:mode-change', (event) => {
            applyModeVisibility(event.detail.mode);
            updateProgressPanel();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChapterLearning);
    } else {
        initChapterLearning();
    }
})();
