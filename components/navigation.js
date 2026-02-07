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


function bootstrapChapterShell() {
    const path = window.location.pathname;
    const isTargetPage = path === '/' || path.endsWith('/index.html') || path.includes('/chapters/');
    if (!isTargetPage) return;

    if (!document.querySelector('link[data-shell="chapter-shell"], link[href*="chapter-shell.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/assets/css/chapter-shell.css';
        link.setAttribute('data-shell', 'chapter-shell');
        document.head.appendChild(link);
    }

    if (!document.querySelector('script[data-shell="chapter-shell"], script[src*="chapter-shell.js"]')) {
        const script = document.createElement('script');
        script.src = '/assets/js/chapter-shell.js';
        script.defer = true;
        script.setAttribute('data-shell', 'chapter-shell');
        document.head.appendChild(script);
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
        
        <div class="nav-header" onclick="window.location.href='/'" style="cursor: pointer;">
            <h2>AION</h2>
            <p>Carl Jung's Masterwork</p>
        </div>
        
        <div class="chapter-list">
            ${CHAPTERS.map(chapter => `
                <div class="chapter-item" onclick="navigateToChapter(${chapter.number})">
                    <span class="chapter-number">${chapter.number}.</span>
                    <span class="chapter-title">${chapter.title}</span>
                    ${chapter.visualization ? '<span class="viz-indicator">•</span>' : ''}
                </div>
            `).join('')}
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

bootstrapChapterShell();

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