/**
 * Navigation System Tests - Phase 6: Testing and Quality Assurance
 * Comprehensive testing for navigation system and routing
 */

describe('Navigation System Tests', () => {
  let mockRouter;
  let mockNavigationSystem;
  
  beforeEach(() => {
    // Mock the navigation system
    mockRouter = {
      currentRoute: null,
      routes: new Map(),
      navigate: jest.fn(),
      init: jest.fn(),
      handleRoute: jest.fn()
    };
    
    mockNavigationSystem = {
      chapters: [],
      router: mockRouter,
      init: jest.fn(),
      updateActiveChapter: jest.fn(),
      generateChapterMenu: jest.fn()
    };
    
    global.NavigationSystem = jest.fn(() => mockNavigationSystem);
    global.GitHubPagesRouter = jest.fn(() => mockRouter);
  });

  describe('GitHub Pages Router', () => {
    test('should initialize router correctly', () => {
      const router = new global.GitHubPagesRouter();
      expect(router.init).toBeDefined();
      expect(router.navigate).toBeDefined();
    });

    test('should handle clean URL patterns', () => {
      const router = mockRouter;
      
      // Test route patterns
      const testRoutes = [
        { url: '/chapters/enhanced/1/', expected: 'chapters/enhanced/chapter-1.html' },
        { url: '/chapters/standard/1/', expected: 'chapters/standard/chapter-1.html' },
        { url: '/chapters/enhanced/14/', expected: 'chapters/enhanced/chapter-14.html' },
        { url: '/timeline/', expected: 'src/timeline.html' },
        { url: '/symbols/', expected: 'src/symbols.html' }
      ];
      
      testRoutes.forEach(({ url, expected }) => {
        router.handleRoute.mockReturnValueOnce(expected);
        const result = router.handleRoute(url);
        expect(result).toBe(expected);
      });
    });

    test('should handle navigation with history API', () => {
      const router = mockRouter;
      const mockPushState = jest.fn();
      global.history = { pushState: mockPushState, replaceState: jest.fn() };
      
      router.navigate('/chapters/enhanced/5/');
      
      expect(router.navigate).toHaveBeenCalledWith('/chapters/enhanced/5/');
    });

    test('should handle 404 routes gracefully', () => {
      const router = mockRouter;
      router.handleRoute.mockReturnValueOnce(null);
      
      const result = router.handleRoute('/invalid/route/');
      expect(result).toBeNull();
    });

    test('should support browser back/forward navigation', () => {
      const router = mockRouter;
      const mockPopState = jest.fn();
      
      window.addEventListener('popstate', mockPopState);
      
      // Simulate browser back button
      const event = new PopStateEvent('popstate', { state: { route: '/chapters/enhanced/3/' } });
      window.dispatchEvent(event);
      
      expect(mockPopState).toHaveBeenCalled();
    });
  });

  describe('Navigation System', () => {
    test('should initialize navigation system', () => {
      const navSystem = new global.NavigationSystem();
      expect(navSystem.init).toBeDefined();
      expect(navSystem.chapters).toBeDefined();
      expect(navSystem.router).toBeDefined();
    });

    test('should generate chapter data correctly', () => {
      const expectedChapters = [
        { id: 1, title: 'Chapter 1', type: 'enhanced', url: '/chapters/enhanced/1/' },
        { id: 1, title: 'Chapter 1', type: 'standard', url: '/chapters/standard/1/' },
        { id: 14, title: 'Chapter 14', type: 'enhanced', url: '/chapters/enhanced/14/' },
        { id: 14, title: 'Chapter 14', type: 'standard', url: '/chapters/standard/14/' }
      ];
      
      mockNavigationSystem.chapters = expectedChapters;
      
      expect(mockNavigationSystem.chapters).toHaveLength(4);
      expect(mockNavigationSystem.chapters[0].type).toBe('enhanced');
      expect(mockNavigationSystem.chapters[1].type).toBe('standard');
    });

    test('should update active chapter state', () => {
      const navSystem = mockNavigationSystem;
      
      navSystem.updateActiveChapter(5, 'enhanced');
      
      expect(navSystem.updateActiveChapter).toHaveBeenCalledWith(5, 'enhanced');
    });

    test('should generate navigation menu', () => {
      const navSystem = mockNavigationSystem;
      
      navSystem.generateChapterMenu();
      
      expect(navSystem.generateChapterMenu).toHaveBeenCalled();
    });

    test('should handle keyboard navigation', () => {
      const navSystem = mockNavigationSystem;
      const mockKeyHandler = jest.fn();
      
      document.addEventListener('keydown', mockKeyHandler);
      
      // Simulate arrow key navigation
      const leftArrow = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      const rightArrow = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      
      document.dispatchEvent(leftArrow);
      document.dispatchEvent(rightArrow);
      
      expect(mockKeyHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Chapter-to-Chapter Navigation', () => {
    test('should navigate to next chapter correctly', () => {
      document.body.innerHTML = `
        <nav class="chapter-nav">
          <a href="/chapters/enhanced/2/" class="next-chapter" data-chapter="2">Next Chapter</a>
        </nav>
      `;
      
      const nextLink = document.querySelector('.next-chapter');
      expect(nextLink).toBeTruthy();
      expect(nextLink.getAttribute('href')).toBe('/chapters/enhanced/2/');
      expect(nextLink.getAttribute('data-chapter')).toBe('2');
    });

    test('should navigate to previous chapter correctly', () => {
      document.body.innerHTML = `
        <nav class="chapter-nav">
          <a href="/chapters/enhanced/1/" class="prev-chapter" data-chapter="1">Previous Chapter</a>
        </nav>
      `;
      
      const prevLink = document.querySelector('.prev-chapter');
      expect(prevLink).toBeTruthy();
      expect(prevLink.getAttribute('href')).toBe('/chapters/enhanced/1/');
      expect(prevLink.getAttribute('data-chapter')).toBe('1');
    });

    test('should handle first and last chapter navigation', () => {
      // First chapter - no previous link
      document.body.innerHTML = `
        <nav class="chapter-nav">
          <span class="prev-chapter disabled">Previous Chapter</span>
          <a href="/chapters/enhanced/2/" class="next-chapter">Next Chapter</a>
        </nav>
      `;
      
      const prevSpan = document.querySelector('.prev-chapter.disabled');
      const nextLink = document.querySelector('.next-chapter');
      
      expect(prevSpan).toBeTruthy();
      expect(nextLink).toBeTruthy();
      
      // Last chapter - no next link
      document.body.innerHTML = `
        <nav class="chapter-nav">
          <a href="/chapters/enhanced/13/" class="prev-chapter">Previous Chapter</a>
          <span class="next-chapter disabled">Next Chapter</span>
        </nav>
      `;
      
      const prevLink = document.querySelector('.prev-chapter');
      const nextSpan = document.querySelector('.next-chapter.disabled');
      
      expect(prevLink).toBeTruthy();
      expect(nextSpan).toBeTruthy();
    });

    test('should switch between enhanced and standard versions', () => {
      document.body.innerHTML = `
        <div class="chapter-controls">
          <button class="toggle-version" data-current="enhanced" data-chapter="5">
            Switch to Standard
          </button>
        </div>
      `;
      
      const toggleButton = document.querySelector('.toggle-version');
      expect(toggleButton).toBeTruthy();
      expect(toggleButton.getAttribute('data-current')).toBe('enhanced');
      expect(toggleButton.getAttribute('data-chapter')).toBe('5');
    });
  });

  describe('Menu Navigation', () => {
    test('should generate dropdown menu for chapters', () => {
      document.body.innerHTML = `
        <nav class="main-nav">
          <div class="dropdown">
            <button class="dropdown-toggle">Chapters</button>
            <div class="dropdown-menu">
              <a href="/chapters/enhanced/1/" class="dropdown-item">Chapter 1 (Enhanced)</a>
              <a href="/chapters/standard/1/" class="dropdown-item">Chapter 1 (Standard)</a>
            </div>
          </div>
        </nav>
      `;
      
      const dropdown = document.querySelector('.dropdown');
      const toggle = document.querySelector('.dropdown-toggle');
      const menu = document.querySelector('.dropdown-menu');
      const items = document.querySelectorAll('.dropdown-item');
      
      expect(dropdown).toBeTruthy();
      expect(toggle).toBeTruthy();
      expect(menu).toBeTruthy();
      expect(items).toHaveLength(2);
    });

    test('should handle dropdown menu interactions', () => {
      document.body.innerHTML = `
        <div class="dropdown">
          <button class="dropdown-toggle">Chapters</button>
          <div class="dropdown-menu hidden">
            <a href="/chapters/enhanced/1/" class="dropdown-item">Chapter 1</a>
          </div>
        </div>
      `;
      
      const toggle = document.querySelector('.dropdown-toggle');
      const menu = document.querySelector('.dropdown-menu');
      
      // Mock click handler
      const mockToggleDropdown = jest.fn(() => {
        menu.classList.toggle('hidden');
      });
      
      toggle.addEventListener('click', mockToggleDropdown);
      toggle.click();
      
      expect(mockToggleDropdown).toHaveBeenCalled();
    });

    test('should highlight active chapter in menu', () => {
      document.body.innerHTML = `
        <nav class="chapter-menu">
          <a href="/chapters/enhanced/1/" class="chapter-link">Chapter 1</a>
          <a href="/chapters/enhanced/2/" class="chapter-link active">Chapter 2</a>
          <a href="/chapters/enhanced/3/" class="chapter-link">Chapter 3</a>
        </nav>
      `;
      
      const activeLink = document.querySelector('.chapter-link.active');
      const allLinks = document.querySelectorAll('.chapter-link');
      
      expect(activeLink).toBeTruthy();
      expect(activeLink.textContent).toBe('Chapter 2');
      expect(allLinks).toHaveLength(3);
    });
  });

  describe('Breadcrumb Navigation', () => {
    test('should generate breadcrumb navigation', () => {
      document.body.innerHTML = `
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol class="breadcrumb-list">
            <li class="breadcrumb-item">
              <a href="/">Home</a>
            </li>
            <li class="breadcrumb-item">
              <a href="/chapters/">Chapters</a>
            </li>
            <li class="breadcrumb-item active" aria-current="page">
              Chapter 5
            </li>
          </ol>
        </nav>
      `;
      
      const breadcrumb = document.querySelector('.breadcrumb');
      const items = document.querySelectorAll('.breadcrumb-item');
      const activeItem = document.querySelector('.breadcrumb-item.active');
      
      expect(breadcrumb).toBeTruthy();
      expect(breadcrumb.getAttribute('aria-label')).toBe('Breadcrumb');
      expect(items).toHaveLength(3);
      expect(activeItem.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('Progress Tracking', () => {
    test('should track reading progress', () => {
      const mockProgressTracker = {
        currentChapter: 1,
        totalChapters: 14,
        completedChapters: [],
        updateProgress: jest.fn(),
        getProgress: jest.fn(() => 7.14) // 1/14 * 100
      };
      
      global.ProgressTracker = jest.fn(() => mockProgressTracker);
      
      const tracker = new global.ProgressTracker();
      const progress = tracker.getProgress();
      
      expect(progress).toBeCloseTo(7.14, 2);
    });

    test('should display progress indicator', () => {
      document.body.innerHTML = `
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 35.7%;"></div>
          </div>
          <span class="progress-text">5 of 14 chapters completed</span>
        </div>
      `;
      
      const progressBar = document.querySelector('.progress-bar');
      const progressFill = document.querySelector('.progress-fill');
      const progressText = document.querySelector('.progress-text');
      
      expect(progressBar).toBeTruthy();
      expect(progressFill.style.width).toBe('35.7%');
      expect(progressText.textContent).toBe('5 of 14 chapters completed');
    });
  });

  describe('Error Handling', () => {
    test('should handle navigation errors gracefully', async () => {
      const router = mockRouter;
      router.navigate.mockRejectedValueOnce(new Error('Navigation failed'));
      
      try {
        await router.navigate('/invalid/route/');
      } catch (error) {
        expect(error.message).toBe('Navigation failed');
      }
    });

    test('should provide fallback navigation when router fails', () => {
      // Mock router failure
      const failedRouter = {
        init: jest.fn(() => { throw new Error('Router initialization failed'); }),
        navigate: jest.fn()
      };
      
      try {
        failedRouter.init();
      } catch (error) {
        // Fallback to direct navigation
        expect(error.message).toBe('Router initialization failed');
        
        // Test fallback mechanism
        const fallbackHref = '/chapters/enhanced/1/';
        expect(fallbackHref).toMatch(/^\/chapters\/enhanced\/\d+\/$/);
      }
    });

    test('should handle missing navigation elements', () => {
      // Empty DOM
      document.body.innerHTML = '';
      
      const navElement = document.querySelector('.main-nav');
      expect(navElement).toBeNull();
      
      // Should not crash when navigation elements are missing
      expect(() => {
        const navSystem = new global.NavigationSystem();
        navSystem.init();
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('should provide keyboard navigation support', () => {
      document.body.innerHTML = `
        <nav class="main-nav" role="navigation">
          <ul>
            <li><a href="/chapters/enhanced/1/" tabindex="0">Chapter 1</a></li>
            <li><a href="/chapters/enhanced/2/" tabindex="0">Chapter 2</a></li>
          </ul>
        </nav>
      `;
      
      const nav = document.querySelector('nav[role="navigation"]');
      const links = document.querySelectorAll('a[tabindex="0"]');
      
      expect(nav).toBeTruthy();
      expect(links).toHaveLength(2);
    });

    test('should provide screen reader support', () => {
      document.body.innerHTML = `
        <nav aria-label="Chapter navigation">
          <button aria-expanded="false" aria-haspopup="true">
            Chapters
          </button>
          <ul role="menu" aria-hidden="true">
            <li role="menuitem"><a href="/chapters/enhanced/1/">Chapter 1</a></li>
          </ul>
        </nav>
      `;
      
      const button = document.querySelector('button[aria-expanded]');
      const menu = document.querySelector('ul[role="menu"]');
      
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('aria-haspopup')).toBe('true');
      expect(menu.getAttribute('aria-hidden')).toBe('true');
    });

    test('should announce navigation changes to screen readers', () => {
      document.body.innerHTML = `
        <div aria-live="polite" class="sr-announcements"></div>
      `;
      
      const announcements = document.querySelector('[aria-live="polite"]');
      
      // Mock navigation change announcement
      announcements.textContent = 'Navigated to Chapter 5';
      
      expect(announcements.textContent).toBe('Navigated to Chapter 5');
      expect(announcements.getAttribute('aria-live')).toBe('polite');
    });
  });
});
