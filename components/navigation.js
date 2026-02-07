// Navigation Component for Aion Visualization
// This will be included on every page for consistent navigation

const CHAPTERS = [
    { number: 1, title: "The Ego", visualization: null },
    { number: 2, title: "The Shadow", visualization: "shadow" },
    { number: 3, title: "The Syzygy: Anima and Animus", visualization: "constellation" },
    { number: 4, title: "The Self", visualization: "fish-timeline" },
    { number: 5, title: "Christ, A Symbol of the Self", visualization: null },
    { number: 6, title: "The Sign of the Fishes", visualization: null },
    { number: 7, title: "The Prophecies of Nostradamus", visualization: null },
    { number: 8, title: "The Historical Significance of the Fish", visualization: null },
    { number: 9, title: "The Ambivalence of the Fish Symbol", visualization: null },
    { number: 10, title: "The Fish in Alchemy", visualization: "alchemy" },
    { number: 11, title: "The Alchemical Interpretation of the Fish", visualization: null },
    { number: 12, title: "Background to the Psychology of Christian Alchemical Symbolism", visualization: null },
    { number: 13, title: "Gnostic Symbols of the Self", visualization: "cosmology" },
    { number: 14, title: "The Structure and Dynamics of the Self", visualization: "clock" }
];

const MODE_KEY = 'aionContentMode';
const PROGRESS_KEY = 'aionLearningProgress';

function getCurrentMode() {
    return localStorage.getItem(MODE_KEY) || 'beginner';
}

function getModeProgress() {
    try {
        const allProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
        const mode = getCurrentMode();
        return allProgress[mode] || { completedChapters: {}, conceptMastery: {} };
    } catch (error) {
        return { completedChapters: {}, conceptMastery: {} };
    }
}

function createNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'aion-nav';
    nav.innerHTML = `
        <style>
            .aion-nav {
                position: fixed;
                left: 0;
                top: 0;
                width: 250px;
                height: 100vh;
                background: rgba(0, 0, 0, 0.95);
                border-right: 1px solid rgba(212, 175, 55, 0.1);
                box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
                overflow-y: auto;
                z-index: 1000;
                transform: translateX(0);
                transition: transform 0.3s ease;
            }
            
            .aion-nav.collapsed {
                transform: translateX(-250px);
            }
            
            .nav-toggle {
                position: fixed;
                left: 260px;
                top: 20px;
                background: #000;
                border: 1px solid #D4AF37;
                color: #D4AF37;
                padding: 0.5rem 1rem;
                cursor: pointer;
                z-index: 1001;
                transition: all 0.3s ease;
            }
            
            .nav-toggle:hover {
                background: #D4AF37;
                color: #000;
            }
            
            .nav-toggle.shifted {
                left: 10px;
            }
            
            .nav-header {
                padding: 2rem 1.5rem;
                border-bottom: 1px solid rgba(212, 175, 55, 0.1);
                transition: background 0.3s ease;
            }
            
            .nav-header:hover {
                background: rgba(212, 175, 55, 0.05);
            }
            
            .nav-header h2 {
                margin: 0;
                color: #D4AF37;
                font-size: 1.5rem;
                font-weight: 300;
                letter-spacing: 2px;
            }
            
            .nav-header p {
                margin: 0.5rem 0 0 0;
                color: #888;
                font-size: 0.875rem;
            }

            .mode-select-wrap {
                margin-top: 1rem;
            }

            .mode-select {
                width: 100%;
                background: #111;
                color: #D4AF37;
                border: 1px solid rgba(212, 175, 55, 0.4);
                padding: 0.4rem 0.5rem;
            }

            .progress-pill {
                display: inline-block;
                margin-left: 0.35rem;
                padding: 0.1rem 0.4rem;
                border-radius: 12px;
                font-size: 0.7rem;
                color: #000;
                background: rgba(212, 175, 55, 0.85);
            }
            
            .chapter-list {
                padding: 1rem 0;
            }
            
            .chapter-item {
                padding: 0.75rem 1.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
                border-left: 3px solid transparent;
            }
            
            .chapter-item:hover {
                background: rgba(212, 175, 55, 0.1);
                border-left-color: #D4AF37;
            }
            
            .chapter-item.active {
                background: rgba(212, 175, 55, 0.2);
                border-left-color: #D4AF37;
            }
            
            .chapter-number {
                color: #D4AF37;
                font-weight: bold;
                margin-right: 0.5rem;
            }
            
            .chapter-title {
                color: #ccc;
                font-size: 0.9rem;
            }
            
            .chapter-item.active .chapter-title {
                color: #fff;
            }
            
            .viz-indicator {
                display: inline-block;
                margin-left: 0.5rem;
                color: #D4AF37;
                font-size: 0.8rem;
            }
            
            .nav-footer {
                padding: 1.5rem;
                border-top: 1px solid rgba(212, 175, 55, 0.1);
                margin-top: 2rem;
            }
            
            .nav-footer a {
                color: #888;
                text-decoration: none;
                font-size: 0.875rem;
                display: block;
                margin: 0.5rem 0;
                transition: color 0.3s ease;
            }
            
            .nav-footer a:hover {
                color: #D4AF37;
            }
            
            /* Main content offset */
            .main-content {
                margin-left: 250px;
                transition: margin-left 0.3s ease;
                min-height: 100vh;
                padding: 2rem;
            }
            
            .main-content.full-width {
                margin-left: 0;
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                .aion-nav {
                    width: 100%;
                    transform: translateX(-100%);
                }
                
                .aion-nav.mobile-open {
                    transform: translateX(0);
                }
                
                .nav-toggle {
                    left: 10px;
                }
                
                .main-content {
                    margin-left: 0;
                }
            }
        </style>
        
        <button class="nav-toggle" onclick="toggleNav()">☰ Menu</button>
        
        <div class="nav-header">
            <h2>AION</h2>
            <p>Carl Jung's Masterwork</p>
            <div class="mode-select-wrap">
                <label for="mode-select" style="font-size:0.75rem;color:#888;">Reading mode</label>
                <select id="mode-select" class="mode-select">
                    <option value="beginner">Beginner</option>
                    <option value="scholar">Scholar</option>
                    <option value="practitioner">Practitioner</option>
                </select>
            </div>
        </div>
        
        <div class="chapter-list">
            ${CHAPTERS.map(chapter => {
                const progress = getModeProgress();
                const completed = progress.completedChapters[String(chapter.number)];
                const mastery = progress.conceptMastery[String(chapter.number)] || 0;
                const progressLabel = completed || mastery > 0 ? `<span class="progress-pill">${completed ? '✓' : ''}${mastery > 0 ? ` ${mastery}%` : ''}</span>` : '';
                return `
                <div class="chapter-item" onclick="navigateToChapter(${chapter.number})">
                    <span class="chapter-number">${chapter.number}.</span>
                    <span class="chapter-title">${chapter.title}</span>
                    ${progressLabel}
                    ${chapter.visualization ? '<span class="viz-indicator">•</span>' : ''}
                </div>
            `;
            }).join('')}
        </div>
        
        <div class="nav-footer">
            <a href="/">Home</a>
            <a href="/about.html">About</a>
            <a href="https://github.com/akshaybapat6365/aion-visualization" target="_blank">GitHub</a>
        </div>
    `;
    
    document.body.insertBefore(nav, document.body.firstChild);
    
    // Add main content wrapper if it doesn't exist
    if (!document.querySelector('.main-content')) {
        const mainContent = document.createElement('div');
        mainContent.className = 'main-content';
        while (document.body.children.length > 1) {
            mainContent.appendChild(document.body.children[1]);
        }
        document.body.appendChild(mainContent);
    }
    
    // Set active chapter
    const currentPath = window.location.pathname;
    const chapterMatch = currentPath.match(/chapter-?(\d+)/);
    if (chapterMatch) {
        const chapterNum = parseInt(chapterMatch[1]);
        document.querySelectorAll('.chapter-item')[chapterNum - 1]?.classList.add('active');
    }

    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) {
        modeSelect.value = getCurrentMode();
        modeSelect.addEventListener('change', (event) => {
            localStorage.setItem(MODE_KEY, event.target.value);
            window.dispatchEvent(new CustomEvent('aion:mode-change', { detail: { mode: event.target.value } }));
            refreshProgressPills();
        });
    }

    if (!window.__aionProgressListenerBound) {
        window.addEventListener('aion:progress-updated', refreshProgressPills);
        window.__aionProgressListenerBound = true;
    }

    if (window.location.pathname.includes('/chapters/chapter-') && !document.querySelector('script[data-aion-learning="true"]')) {
        const script = document.createElement('script');
        script.src = '/components/chapter-learning.js';
        script.dataset.aionLearning = 'true';
        document.body.appendChild(script);
    }
}

function refreshProgressPills() {
    const progress = getModeProgress();
    document.querySelectorAll('.chapter-item').forEach((item, index) => {
        item.querySelector('.progress-pill')?.remove();
        const chapterNumber = index + 1;
        const completed = progress.completedChapters[String(chapterNumber)];
        const mastery = progress.conceptMastery[String(chapterNumber)] || 0;
        if (!completed && mastery === 0) {
            return;
        }

        const pill = document.createElement('span');
        pill.className = 'progress-pill';
        pill.textContent = `${completed ? '✓' : ''}${mastery > 0 ? ` ${mastery}%` : ''}`.trim();
        item.appendChild(pill);
    });
}

function toggleNav() {
    const nav = document.querySelector('.aion-nav');
    const toggle = document.querySelector('.nav-toggle');
    const mainContent = document.querySelector('.main-content');
    
    nav.classList.toggle('collapsed');
    nav.classList.toggle('mobile-open');
    toggle.classList.toggle('shifted');
    mainContent.classList.toggle('full-width');
}

function navigateToChapter(chapterNumber) {
    // Navigate to chapter page
    window.location.href = `/chapters/chapter-${chapterNumber}.html`;
}

// Initialize navigation when DOM is ready
// Don't show navigation if page is in an iframe
if (window.self === window.top) {
    // Show sidebar navigation on all pages
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createNavigation);
    } else {
        createNavigation();
    }
}