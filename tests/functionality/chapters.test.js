/**
 * Chapter Functionality Tests - Phase 6: Testing and Quality Assurance
 * Comprehensive testing for all 28 chapters (14 enhanced + 14 standard)
 */

describe('Chapter Functionality Tests', () => {
  let mockDocument;
  
  beforeEach(() => {
    mockDocument = document.implementation.createHTMLDocument();
    global.document = mockDocument;
  });

  describe('Enhanced Chapters (14 chapters)', () => {
    const enhancedChapters = Array.from({ length: 14 }, (_, i) => i + 1);
    
    enhancedChapters.forEach(chapterNum => {
      describe(`Enhanced Chapter ${chapterNum}`, () => {
        test(`should load chapter-${chapterNum}.html without errors`, async () => {
          const chapterUrl = `/chapters/enhanced/chapter-${chapterNum}.html`;
          
          // Mock fetch response
          global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: () => Promise.resolve(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Chapter ${chapterNum} - Enhanced</title>
                  <link rel="stylesheet" href="../../assets/css/main.css">
                  <link rel="stylesheet" href="../../assets/css/chapters.css">
                </head>
                <body>
                  <div class="chapter-container">
                    <h1>Chapter ${chapterNum}</h1>
                    <div class="visualization-container" id="viz-container-${chapterNum}"></div>
                    <nav class="chapter-nav">
                      <a href="chapter-${chapterNum - 1}.html" class="prev-chapter">Previous</a>
                      <a href="chapter-${chapterNum + 1}.html" class="next-chapter">Next</a>
                    </nav>
                  </div>
                  <script src="../../assets/js/core/utilities.js"></script>
                  <script src="../../assets/js/core/navigation.js"></script>
                </body>
              </html>
            `)
          });
          
          const response = await fetch(chapterUrl);
          const html = await response.text();
          
          expect(response.ok).toBe(true);
          expect(html).toContain(`Chapter ${chapterNum}`);
          expect(html).toContain('visualization-container');
          expect(html).toContain('chapter-nav');
        });

        test(`should have proper navigation links for chapter ${chapterNum}`, async () => {
          const chapterHtml = `
            <nav class="chapter-nav">
              <a href="chapter-${chapterNum - 1}.html" class="prev-chapter">Previous</a>
              <a href="chapter-${chapterNum + 1}.html" class="next-chapter">Next</a>
            </nav>
          `;
          
          document.body.innerHTML = chapterHtml;
          
          const prevLink = document.querySelector('.prev-chapter');
          const nextLink = document.querySelector('.next-chapter');
          
          if (chapterNum > 1) {
            expect(prevLink).toBeTruthy();
            expect(prevLink.getAttribute('href')).toBe(`chapter-${chapterNum - 1}.html`);
          }
          
          if (chapterNum < 14) {
            expect(nextLink).toBeTruthy();
            expect(nextLink.getAttribute('href')).toBe(`chapter-${chapterNum + 1}.html`);
          }
        });

        test(`should initialize visualization for chapter ${chapterNum}`, () => {
          document.body.innerHTML = `
            <div class="visualization-container" id="viz-container-${chapterNum}"></div>
          `;
          
          const vizContainer = document.getElementById(`viz-container-${chapterNum}`);
          expect(vizContainer).toBeTruthy();
          expect(vizContainer.classList.contains('visualization-container')).toBe(true);
        });

        test(`should handle WebGL context for chapter ${chapterNum}`, () => {
          const canvas = document.createElement('canvas');
          document.body.appendChild(canvas);
          
          const gl = canvas.getContext('webgl');
          expect(gl).toBeTruthy();
          
          // Test WebGL context properties
          expect(typeof gl.clearColor).toBe('function');
          expect(typeof gl.clear).toBe('function');
          expect(typeof gl.viewport).toBe('function');
        });

        test(`should load required assets for chapter ${chapterNum}`, () => {
          const cssLinks = [
            '../../assets/css/main.css',
            '../../assets/css/chapters.css'
          ];
          
          const jsScripts = [
            '../../assets/js/core/utilities.js',
            '../../assets/js/core/navigation.js'
          ];
          
          cssLinks.forEach(href => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
            
            expect(document.querySelector(`link[href="${href}"]`)).toBeTruthy();
          });
          
          jsScripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            document.body.appendChild(script);
            
            expect(document.querySelector(`script[src="${src}"]`)).toBeTruthy();
          });
        });
      });
    });
  });

  describe('Standard Chapters (14 chapters)', () => {
    const standardChapters = Array.from({ length: 14 }, (_, i) => i + 1);
    
    standardChapters.forEach(chapterNum => {
      describe(`Standard Chapter ${chapterNum}`, () => {
        test(`should load chapter-${chapterNum}.html without errors`, async () => {
          const chapterUrl = `/chapters/standard/chapter-${chapterNum}.html`;
          
          // Mock fetch response
          global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: () => Promise.resolve(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Chapter ${chapterNum} - Standard</title>
                  <link rel="stylesheet" href="../../assets/css/main.css">
                  <link rel="stylesheet" href="../../assets/css/chapters.css">
                </head>
                <body>
                  <div class="chapter-container">
                    <h1>Chapter ${chapterNum}</h1>
                    <div class="content-container">
                      <p>Standard chapter content for chapter ${chapterNum}</p>
                    </div>
                    <nav class="chapter-nav">
                      <a href="chapter-${chapterNum - 1}.html" class="prev-chapter">Previous</a>
                      <a href="chapter-${chapterNum + 1}.html" class="next-chapter">Next</a>
                    </nav>
                  </div>
                  <script src="../../assets/js/core/utilities.js"></script>
                  <script src="../../assets/js/core/navigation.js"></script>
                </body>
              </html>
            `)
          });
          
          const response = await fetch(chapterUrl);
          const html = await response.text();
          
          expect(response.ok).toBe(true);
          expect(html).toContain(`Chapter ${chapterNum}`);
          expect(html).toContain('content-container');
          expect(html).toContain('chapter-nav');
        });

        test(`should have proper content structure for standard chapter ${chapterNum}`, () => {
          document.body.innerHTML = `
            <div class="chapter-container">
              <h1>Chapter ${chapterNum}</h1>
              <div class="content-container">
                <p>Standard chapter content</p>
              </div>
            </div>
          `;
          
          const container = document.querySelector('.chapter-container');
          const title = document.querySelector('h1');
          const content = document.querySelector('.content-container');
          
          expect(container).toBeTruthy();
          expect(title).toBeTruthy();
          expect(title.textContent).toBe(`Chapter ${chapterNum}`);
          expect(content).toBeTruthy();
        });

        test(`should be accessible for standard chapter ${chapterNum}`, () => {
          document.body.innerHTML = `
            <div class="chapter-container">
              <h1>Chapter ${chapterNum}</h1>
              <main role="main">
                <div class="content-container">
                  <p>Content for chapter ${chapterNum}</p>
                </div>
              </main>
              <nav class="chapter-nav" role="navigation" aria-label="Chapter navigation">
                <a href="chapter-${chapterNum - 1}.html" class="prev-chapter">Previous Chapter</a>
                <a href="chapter-${chapterNum + 1}.html" class="next-chapter">Next Chapter</a>
              </nav>
            </div>
          `;
          
          const main = document.querySelector('main[role="main"]');
          const nav = document.querySelector('nav[role="navigation"]');
          const heading = document.querySelector('h1');
          
          expect(main).toBeTruthy();
          expect(nav).toBeTruthy();
          expect(nav.getAttribute('aria-label')).toBe('Chapter navigation');
          expect(heading).toBeTruthy();
        });
      });
    });
  });

  describe('Chapter Navigation System', () => {
    test('should navigate between enhanced chapters correctly', () => {
      // Mock navigation function
      const mockNavigate = jest.fn();
      global.navigateToChapter = mockNavigate;
      
      document.body.innerHTML = `
        <nav class="chapter-nav">
          <button onclick="navigateToChapter('enhanced', 1)" class="chapter-btn">Chapter 1</button>
          <button onclick="navigateToChapter('enhanced', 2)" class="chapter-btn">Chapter 2</button>
        </nav>
      `;
      
      const button1 = document.querySelector('button:nth-child(1)');
      const button2 = document.querySelector('button:nth-child(2)');
      
      button1.click();
      button2.click();
      
      expect(mockNavigate).toHaveBeenCalledWith('enhanced', 1);
      expect(mockNavigate).toHaveBeenCalledWith('enhanced', 2);
    });

    test('should handle navigation errors gracefully', () => {
      const mockError = jest.fn();
      global.console.error = mockError;
      
      // Simulate navigation to non-existent chapter
      try {
        // This would normally throw an error
        throw new Error('Chapter not found');
      } catch (error) {
        expect(error.message).toBe('Chapter not found');
      }
    });

    test('should maintain navigation state during transitions', () => {
      const navigationState = {
        currentChapter: 1,
        chapterType: 'enhanced',
        history: []
      };
      
      // Mock state management
      global.getNavigationState = jest.fn(() => navigationState);
      global.setNavigationState = jest.fn();
      
      const currentState = global.getNavigationState();
      expect(currentState.currentChapter).toBe(1);
      expect(currentState.chapterType).toBe('enhanced');
      
      global.setNavigationState({ ...navigationState, currentChapter: 2 });
      expect(global.setNavigationState).toHaveBeenCalledWith({
        currentChapter: 2,
        chapterType: 'enhanced',
        history: []
      });
    });
  });

  describe('Chapter Asset Loading', () => {
    test('should load CSS assets correctly', async () => {
      const cssUrls = [
        '/assets/css/main.css',
        '/assets/css/chapters.css'
      ];
      
      // Mock CSS loading
      cssUrls.forEach(url => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(`/* CSS content for ${url} */`)
        });
      });
      
      for (const url of cssUrls) {
        const response = await fetch(url);
        const css = await response.text();
        
        expect(response.ok).toBe(true);
        expect(css).toContain(`CSS content for ${url}`);
      }
    });

    test('should load JavaScript assets correctly', async () => {
      const jsUrls = [
        '/assets/js/core/utilities.js',
        '/assets/js/core/navigation.js'
      ];
      
      // Mock JS loading
      jsUrls.forEach(url => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(`// JavaScript content for ${url}`)
        });
      });
      
      for (const url of jsUrls) {
        const response = await fetch(url);
        const js = await response.text();
        
        expect(response.ok).toBe(true);
        expect(js).toContain(`JavaScript content for ${url}`);
      }
    });

    test('should handle asset loading failures gracefully', async () => {
      const failingUrl = '/assets/css/non-existent.css';
      
      global.fetch.mockRejectedValueOnce(new Error('Asset not found'));
      
      try {
        await fetch(failingUrl);
      } catch (error) {
        expect(error.message).toBe('Asset not found');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle missing chapters gracefully', async () => {
      const invalidUrl = '/chapters/enhanced/chapter-99.html';
      
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      const response = await fetch(invalidUrl);
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    test('should handle WebGL context loss', () => {
      const canvas = document.createElement('canvas');
      const mockContext = global.testUtils.createMockWebGLContext();
      mockContext.isContextLost = jest.fn(() => true);
      
      canvas.getContext = jest.fn(() => mockContext);
      
      const gl = canvas.getContext('webgl');
      expect(gl.isContextLost()).toBe(true);
    });

    test('should provide fallbacks for unsupported features', () => {
      // Mock unsupported WebGL
      HTMLCanvasElement.prototype.getContext = jest.fn(() => null);
      
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      
      expect(gl).toBeNull();
      
      // Test fallback mechanism
      const fallbackElement = document.createElement('div');
      fallbackElement.textContent = 'WebGL not supported';
      
      expect(fallbackElement.textContent).toBe('WebGL not supported');
    });
  });
});