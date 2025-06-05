// Navigation System for Aion Visualization
// Unified navigation with theme support, chapter routing, and responsive design

class NavigationSystem {
  constructor() {
    this.currentPath = window.location.pathname;
    this.isMainPage = !this.currentPath.includes('chapter');
    this.progressTracker = null;
    this.chapters = this.getChapterData();
    this.router = null;
    this.init();
  }

  getChapterData() {
    return {
      standard: [
        { id: 1, title: 'The Ego', subtitle: 'The Conscious Personality' },
        { id: 2, title: 'The Shadow', subtitle: 'The Hidden Self' },
        { id: 3, title: 'The Syzygy', subtitle: 'Anima and Animus' },
        { id: 4, title: 'The Self', subtitle: 'The Unified Psyche' },
        { id: 5, title: 'Christ, A Symbol of the Self', subtitle: 'Religious Symbolism' },
        { id: 6, title: 'The Sign of the Fishes', subtitle: 'Astrological Ages' },
        { id: 7, title: 'The Prophecies of Nostradamus', subtitle: 'Collective Unconscious' },
        { id: 8, title: 'The Historical Significance of the Fish', subtitle: 'Symbolic Evolution' },
        { id: 9, title: 'The Ambivalence of the Fish Symbol', subtitle: 'Paradox and Meaning' },
        { id: 10, title: 'The Fish in Alchemy', subtitle: 'Transformation Imagery' },
        { id: 11, title: 'The Alchemical Interpretation', subtitle: 'Psychological Process' },
        { id: 12, title: 'Background to the Psychology of Christian Alchemical Symbolism', subtitle: 'Integration' },
        { id: 13, title: 'Gnostic Symbols of the Self', subtitle: 'Ancient Wisdom' },
        { id: 14, title: 'The Structure and Dynamics of the Self', subtitle: 'Psychological Architecture' }
      ],
      enhanced: [
        { id: 1, title: 'The Ego', subtitle: 'Interactive Ego-Self Axis', features: ['3D Visualization', 'Consciousness Field'] },
        { id: 2, title: 'The Shadow', subtitle: 'Shadow Recognition Mirror', features: ['Projection Animation', 'Shadow Constellation'] },
        { id: 3, title: 'The Syzygy', subtitle: 'Anima/Animus Dynamics', features: ['3D Constellation', 'Relationship Simulator'] },
        { id: 9, title: 'Ouroboros', subtitle: 'Cycles of Renewal', features: ['Living Animation', 'Lifecycle Journey'] },
        { id: 11, title: 'Christ as Symbol', subtitle: 'Self Mandala Constructor', features: ['Interactive Mandala', 'God-Image Evolution'] },
        { id: 12, title: 'Signs of the Fishes', subtitle: 'Astrological Timeline', features: ['26,000 Year Cycle', 'Age Transition'] },
        { id: 13, title: 'Fish Symbol Ambivalence', subtitle: 'Dual Dynamics', features: ['Symbol Explorer', 'Paradox Resolution'] },
        { id: 14, title: 'Structure of the Self', subtitle: 'Complete Integration', features: ['Self Mandala', 'Wholeness Synthesis'] }
      ]
    };
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.createNavigation();
      this.setupChapterRouter();
      this.setupPageTransitions();
      this.setupThemeToggle();
      this.setupKeyboardNavigation();
      this.initProgressTracking();
    });
  }

  createNavigation() {
    if (!this.isMainPage || document.querySelector('.navigation')) {
      return;
    }

    const nav = document.createElement('nav');
    nav.className = 'navigation glass-card';
        
    const isIndex = this.currentPath.endsWith('index.html') || this.currentPath.endsWith('/');
    const isChapters = this.currentPath.includes('chapters.html');
    const isJourney = this.currentPath.includes('journey.html');
    const isAbout = this.currentPath.includes('about.html');
        
    nav.innerHTML = `
            <div class="nav-brand">
                <span class="nav-logo">☯</span>
                <span class="nav-title">Aion</span>
            </div>
            <div class="nav-links">
                <a href="index.html" class="nav-item ${isIndex ? 'active' : ''}">
                    <span class="nav-icon">🏠</span>
                    <span class="nav-text">Home</span>
                </a>
                <div class="nav-dropdown">
                    <a href="#" class="nav-item dropdown-toggle ${isChapters ? 'active' : ''}" data-dropdown="chapters">
                        <span class="nav-icon">📚</span>
                        <span class="nav-text">Chapters</span>
                        <span class="dropdown-arrow">▼</span>
                    </a>
                    <div class="dropdown-menu" id="chapters-dropdown">
                        <div class="dropdown-section">
                            <h3 class="dropdown-title">Standard Chapters</h3>
                            <a href="chapters.html" class="dropdown-item">All Standard Chapters</a>
                        </div>
                        <div class="dropdown-section">
                            <h3 class="dropdown-title">Enhanced Chapters</h3>
                            <a href="enhanced-chapters.html" class="dropdown-item">All Enhanced Chapters</a>
                            ${this.generateEnhancedChapterDropdown()}
                        </div>
                    </div>
                </div>
                <a href="journey.html" class="nav-item ${isJourney ? 'active' : ''}">
                    <span class="nav-icon">🗺️</span>
                    <span class="nav-text">Journey</span>
                </a>
                <a href="about.html" class="nav-item ${isAbout ? 'active' : ''}">
                    <span class="nav-icon">ℹ️</span>
                    <span class="nav-text">About</span>
                </a>
            </div>
            <div class="nav-controls">
                <button class="theme-toggle glass-button" title="Toggle theme">
                    <span class="theme-icon">🌙</span>
                </button>
                <button class="menu-toggle glass-button" title="Menu">
                    <span class="menu-icon">☰</span>
                </button>
            </div>
        `;
        
    document.body.prepend(nav);
    this.setupNavigationEvents(nav);
  }

  createChapterNavigation() {
    if (this.isMainPage || document.querySelector('.chapter-nav')) {
      return;
    }

    const nav = document.createElement('nav');
    nav.className = 'chapter-nav';
        
    const chapterMatch = this.currentPath.match(/chapter(\d+)/);
    const chapterNum = chapterMatch ? parseInt(chapterMatch[1]) : 1;
        
    nav.innerHTML = `
            <a href="enhanced-chapters.html" class="back-button">
                <span>←</span>
                <span>Back to Chapters</span>
            </a>
            <div class="chapter-progress-mini">
                <div class="progress-bar-mini">
                    <div class="progress-fill-mini" style="width: ${(chapterNum / 14) * 100}%"></div>
                </div>
                <span class="progress-text-mini">Chapter ${chapterNum} of 14</span>
            </div>
            <div class="chapter-controls">
                ${chapterNum > 1 ? `<a href="enhanced-chapter${chapterNum - 1}.html" class="nav-button prev">←</a>` : ''}
                ${chapterNum < 14 ? `<a href="enhanced-chapter${chapterNum + 1}.html" class="nav-button next">→</a>` : ''}
            </div>
        `;
        
    document.body.prepend(nav);
  }

  setupNavigationEvents(nav) {
    // Mobile menu toggle
    const menuToggle = nav.querySelector('.menu-toggle');
    const navLinks = nav.querySelector('.nav-links');
        
    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
        menuToggle.classList.toggle('active');
      });
    }

    // Close mobile menu on link click
    nav.querySelectorAll('.nav-item').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        menuToggle.classList.remove('active');
      });
    });

    // Smooth scroll for anchor links
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  setupPageTransitions() {
    // Add page transition effects
    const links = document.querySelectorAll('a:not([href^="#"]):not([href^="http"]):not([target="_blank"])');
        
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href !== '#' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          this.transitionToPage(href);
        }
      });
    });
  }

  async transitionToPage(href) {
    // Add exit animation
    document.body.classList.add('page-transitioning');
        
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));
        
    // Navigate
    window.location.href = href;
  }

  setupThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;

    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    this.updateThemeIcon(themeToggle, currentTheme);

    themeToggle.addEventListener('click', () => {
      const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      this.updateThemeIcon(themeToggle, newTheme);
    });
  }

  updateThemeIcon(button, theme) {
    const icon = button.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // ESC to close mobile menu
      if (e.key === 'Escape') {
        const navLinks = document.querySelector('.nav-links');
        const menuToggle = document.querySelector('.menu-toggle');
        if (navLinks && menuToggle) {
          navLinks.classList.remove('mobile-open');
          menuToggle.classList.remove('active');
        }
      }

      // Arrow keys for chapter navigation
      if (this.currentPath.includes('chapter')) {
        const chapterMatch = this.currentPath.match(/chapter(\d+)/);
        const chapterNum = chapterMatch ? parseInt(chapterMatch[1]) : 1;

        if (e.key === 'ArrowLeft' && chapterNum > 1) {
          window.location.href = `enhanced-chapter${chapterNum - 1}.html`;
        } else if (e.key === 'ArrowRight' && chapterNum < 14) {
          window.location.href = `enhanced-chapter${chapterNum + 1}.html`;
        }
      }
    });
  }

  // Breadcrumb generation
  generateBreadcrumbs() {
    const path = this.currentPath.split('/').filter(p => p);
    const breadcrumbs = [{ name: 'Home', href: 'index.html' }];

    if (this.currentPath.includes('chapter')) {
      breadcrumbs.push({ name: 'Chapters', href: 'enhanced-chapters.html' });
            
      const chapterMatch = this.currentPath.match(/chapter(\d+)/);
      if (chapterMatch) {
        const chapterNum = parseInt(chapterMatch[1]);
        breadcrumbs.push({ name: `Chapter ${chapterNum}`, href: null });
      }
    } else if (this.currentPath.includes('chapters')) {
      breadcrumbs.push({ name: 'Chapters', href: null });
    } else if (this.currentPath.includes('journey')) {
      breadcrumbs.push({ name: 'Journey', href: null });
    } else if (this.currentPath.includes('about')) {
      breadcrumbs.push({ name: 'About', href: null });
    }

    return breadcrumbs;
  }

  // Progress indicator for chapter pages
  updateChapterProgress(chapterNum, sectionProgress = 0) {
    const progressFill = document.querySelector('.progress-fill-mini');
    const progressText = document.querySelector('.progress-text-mini');
        
    if (progressFill) {
      const totalProgress = ((chapterNum - 1) / 14) + (sectionProgress / 14);
      progressFill.style.width = `${totalProgress * 100}%`;
    }
        
    if (progressText) {
      progressText.textContent = `Chapter ${chapterNum} of 14`;
    }
  }

  generateEnhancedChapterDropdown() {
    return this.chapters.enhanced.map(chapter => 
      `<a href="enhanced-chapter${chapter.id}.html" class="dropdown-item">
                <span class="chapter-number">${chapter.id}</span>
                <span class="chapter-info">
                    <span class="chapter-title">${chapter.title}</span>
                    <span class="chapter-subtitle">${chapter.subtitle}</span>
                </span>
            </a>`
    ).join('');
  }

  setupChapterRouter() {
    this.router = {
      currentChapter: this.getCurrentChapter(),
      navigate: (chapterId, type = 'enhanced') => this.navigateToChapter(chapterId, type),
      getNext: () => this.getNextChapter(),
      getPrevious: () => this.getPreviousChapter()
    };

    // Setup chapter navigation if on a chapter page
    if (this.router.currentChapter) {
      this.createChapterNavigation();
      this.createBreadcrumbs();
    }
  }

  getCurrentChapter() {
    const match = this.currentPath.match(/(?:enhanced-)?chapter(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const isEnhanced = this.currentPath.includes('enhanced-');
      return { id, type: isEnhanced ? 'enhanced' : 'standard' };
    }
    return null;
  }

  navigateToChapter(chapterId, type = 'enhanced') {
    const filename = type === 'enhanced' ? `enhanced-chapter${chapterId}.html` : `chapter${chapterId}.html`;
    this.transitionToPage(filename);
  }

  getNextChapter() {
    if (!this.router.currentChapter) return null;
        
    const { id, type } = this.router.currentChapter;
    const chapters = this.chapters[type];
    const currentIndex = chapters.findIndex(ch => ch.id === id);
        
    if (currentIndex < chapters.length - 1) {
      return chapters[currentIndex + 1];
    }
    return null;
  }

  getPreviousChapter() {
    if (!this.router.currentChapter) return null;
        
    const { id, type } = this.router.currentChapter;
    const chapters = this.chapters[type];
    const currentIndex = chapters.findIndex(ch => ch.id === id);
        
    if (currentIndex > 0) {
      return chapters[currentIndex - 1];
    }
    return null;
  }

  createChapterNavigation() {
    if (document.querySelector('.chapter-nav')) return;

    const { id, type } = this.router.currentChapter;
    const nextChapter = this.getNextChapter();
    const prevChapter = this.getPreviousChapter();

    const nav = document.createElement('nav');
    nav.className = 'chapter-nav glass-card';
        
    nav.innerHTML = `
            <div class="chapter-nav-left">
                <a href="${type === 'enhanced' ? 'enhanced-chapters.html' : 'chapters.html'}" class="back-button">
                    <span class="back-icon">←</span>
                    <span class="back-text">Back to Chapters</span>
                </a>
            </div>
            
            <div class="chapter-nav-center">
                <div class="chapter-progress-mini">
                    <div class="progress-info">
                        <span class="chapter-type">${type === 'enhanced' ? 'Enhanced' : 'Standard'}</span>
                        <span class="chapter-current">Chapter ${id}</span>
                    </div>
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${(id / 14) * 100}%"></div>
                    </div>
                    <span class="progress-text-mini">${id} of ${this.chapters[type].length}</span>
                </div>
            </div>
            
            <div class="chapter-nav-right">
                ${prevChapter ? `
                    <button class="nav-button prev" onclick="navigationSystem.navigateToChapter(${prevChapter.id}, '${type}')" title="Previous Chapter">
                        <span class="nav-icon">←</span>
                        <span class="nav-label">Previous</span>
                    </button>
                ` : ''}
                ${nextChapter ? `
                    <button class="nav-button next" onclick="navigationSystem.navigateToChapter(${nextChapter.id}, '${type}')" title="Next Chapter">
                        <span class="nav-label">Next</span>
                        <span class="nav-icon">→</span>
                    </button>
                ` : ''}
            </div>
        `;
        
    document.body.prepend(nav);
  }

  createBreadcrumbs() {
    if (document.querySelector('.breadcrumbs')) return;

    const breadcrumbs = this.generateBreadcrumbs();
    const breadcrumbNav = document.createElement('nav');
    breadcrumbNav.className = 'breadcrumbs';
    breadcrumbNav.setAttribute('aria-label', 'Breadcrumb');
        
    breadcrumbNav.innerHTML = `
            <ol class="breadcrumb-list">
                ${breadcrumbs.map((crumb, index) => `
                    <li class="breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}">
                        ${crumb.href ? `<a href="${crumb.href}">${crumb.name}</a>` : crumb.name}
                        ${index < breadcrumbs.length - 1 ? '<span class="breadcrumb-separator">›</span>' : ''}
                    </li>
                `).join('')}
            </ol>
        `;
        
    const main = document.querySelector('main') || document.querySelector('.chapter-content') || document.body;
    main.insertBefore(breadcrumbNav, main.firstChild);
  }

  initProgressTracking() {
    this.progressTracker = {
      completed: JSON.parse(localStorage.getItem('aion-completed-chapters') || '{}'),
      progress: JSON.parse(localStorage.getItem('aion-chapter-progress') || '{}'),
            
      markCompleted: (chapterId, type) => {
        this.progressTracker.completed[`${type}-${chapterId}`] = true;
        localStorage.setItem('aion-completed-chapters', JSON.stringify(this.progressTracker.completed));
        this.updateProgressUI();
      },
            
      setProgress: (chapterId, type, progress) => {
        this.progressTracker.progress[`${type}-${chapterId}`] = progress;
        localStorage.setItem('aion-chapter-progress', JSON.stringify(this.progressTracker.progress));
        this.updateProgressUI();
      }
    };
  }

  isChapterCompleted(chapterId, type) {
    return this.progressTracker?.completed[`${type}-${chapterId}`] || false;
  }

  getChapterProgress(chapterId, type) {
    return this.progressTracker?.progress[`${type}-${chapterId}`] || 0;
  }

  updateProgressUI() {
    const progressFill = document.querySelector('.progress-fill-mini');
    if (progressFill && this.router.currentChapter) {
      const { id, type } = this.router.currentChapter;
      const currentProgress = this.getChapterProgress(id, type);
      const overallProgress = ((id - 1) / 14) + (currentProgress / 100 / 14);
      progressFill.style.width = `${overallProgress * 100}%`;
    }
  }

  // Global method to open chapter selection
  openChapterSelection() {
    if (document.querySelector('.chapter-selection-modal')) return;
        
    const modal = document.createElement('div');
    modal.className = 'chapter-selection-modal';
    modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h2>Select Chapter</h2>
                    <button class="modal-close glass-button" onclick="this.closest('.chapter-selection-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="chapter-tabs">
                        <button class="tab-button active" data-tab="enhanced">Enhanced Chapters</button>
                        <button class="tab-button" data-tab="standard">Standard Chapters</button>
                    </div>
                    <div class="chapter-grid" id="enhanced-chapters">
                        ${this.generateChapterGrid('enhanced')}
                    </div>
                    <div class="chapter-grid hidden" id="standard-chapters">
                        ${this.generateChapterGrid('standard')}
                    </div>
                </div>
            </div>
        `;
        
    document.body.appendChild(modal);
    this.setupModalEvents(modal);
  }

  generateChapterGrid(type) {
    return this.chapters[type].map(chapter => `
            <div class="chapter-card ${this.isChapterCompleted(chapter.id, type) ? 'completed' : ''}" 
                 onclick="navigationSystem.navigateToChapter(${chapter.id}, '${type}')">
                <div class="chapter-number">${chapter.id}</div>
                <div class="chapter-content">
                    <h3 class="chapter-title">${chapter.title}</h3>
                    <p class="chapter-subtitle">${chapter.subtitle}</p>
                    ${chapter.features ? `
                        <div class="chapter-features">
                            ${chapter.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="chapter-progress">
                    <div class="progress-bar" style="--progress: ${this.getChapterProgress(chapter.id, type)}%"></div>
                </div>
            </div>
        `).join('');
  }

  setupModalEvents(modal) {
    // Tab switching
    modal.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        modal.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        modal.querySelectorAll('.chapter-grid').forEach(g => g.classList.add('hidden'));
                
        button.classList.add('active');
        modal.querySelector(`#${button.dataset.tab}-chapters`).classList.remove('hidden');
      });
    });
  }
}

// Auto-initialize navigation
if (typeof window !== 'undefined') {
  window.navigationSystem = new NavigationSystem();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavigationSystem;
}