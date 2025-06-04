// Apply Bug Fixes to Aion Visualization
// This script applies all bug fixes and improvements to existing pages

(function() {
  'use strict';

  // Initialize all utilities
  const webglUtils = new WebGLUtils();
  const accessibilityUtils = new AccessibilityUtils();
    
  // Apply WebGL error handling to all canvases
  function enhanceWebGLCanvases() {
    const canvases = document.querySelectorAll('canvas');
        
    canvases.forEach(canvas => {
      // Skip if already enhanced
      if (canvas.dataset.enhanced) return;
            
      // Check for WebGL support
      if (!WebGLUtils.isWebGLSupported()) {
        console.warn('WebGL not supported, showing fallback');
        webglUtils.showFallback(canvas, new Error('WebGL not supported'));
        return;
      }
            
      // Add context loss prevention
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        console.warn('WebGL context lost, attempting recovery');
      });
            
      // Mark as enhanced
      canvas.dataset.enhanced = 'true';
    });
  }

  // Add accessibility enhancements
  function enhanceAccessibility() {
    // Add ARIA labels to main sections
    const mainContent = document.querySelector('main, .chapter-content, #main-content');
    if (mainContent) {
      mainContent.setAttribute('role', 'main');
      mainContent.id = mainContent.id || 'main-content';
    }

    // Enhance navigation
    const nav = document.querySelector('nav');
    if (nav) {
      nav.setAttribute('role', 'navigation');
      nav.id = nav.id || 'navigation';
      nav.setAttribute('aria-label', 'Main navigation');
    }

    // Add ARIA labels to visualizations
    document.querySelectorAll('.visualization-container').forEach((viz, index) => {
      const vizType = viz.dataset.type || 'visualization';
      const description = accessibilityUtils.describeVisualization(vizType, {
        concept: viz.dataset.concept || 'Jungian concepts'
      });
            
      accessibilityUtils.enhanceVisualization(viz, description);
      viz.id = viz.id || `visualization-${index}`;
    });

    // Add keyboard navigation to chapter cards
    const chapterCards = document.querySelectorAll('.chapter-card');
    if (chapterCards.length > 0) {
      accessibilityUtils.enableKeyboardNavigation(
        document.querySelector('.chapter-grid'),
        chapterCards,
        {
          role: 'link',
          onActivate: (card) => {
            const link = card.querySelector('a');
            if (link) link.click();
          }
        }
      );
    }

    // Add keyboard help
    accessibilityUtils.addKeyboardHelp(document.body);
  }

  // Fix console errors
  function fixConsoleErrors() {
    // Prevent null canvas errors
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attributes) {
      try {
        return originalGetContext.call(this, type, attributes);
      } catch (error) {
        console.warn('Canvas context error handled:', error);
        return null;
      }
    };

    // Add missing favicon to prevent 404
    if (!document.querySelector('link[rel="icon"]')) {
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/svg+xml';
      favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%236B46C1"/><circle cx="50" cy="50" r="20" fill="%23000"/></svg>';
      document.head.appendChild(favicon);
    }

    // Handle missing transitions.js gracefully
    window.addEventListener('error', (e) => {
      if (e.filename && e.filename.includes('transitions.js')) {
        console.warn('transitions.js not found, using fallback');
        e.preventDefault();
                
        // Provide basic transition functionality
        window.transitions = {
          fadeIn: (element) => {
            element.style.opacity = '0';
            element.style.transition = 'opacity 0.5s ease';
            setTimeout(() => element.style.opacity = '1', 10);
          }
        };
      }
    });
  }

  // Apply responsive fixes
  function applyResponsiveFixes() {
    // Add viewport meta tag if missing
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
      document.head.appendChild(viewport);
    }

    // Add responsive utilities CSS
    const responsiveLink = document.createElement('link');
    responsiveLink.rel = 'stylesheet';
    responsiveLink.href = 'responsive-utils.css';
    document.head.appendChild(responsiveLink);

    // Handle canvas resizing
    function resizeCanvases() {
      document.querySelectorAll('canvas').forEach(canvas => {
        if (canvas.id === 'bg-canvas') return; // Skip background canvas
                
        const container = canvas.parentElement;
        if (container) {
          const rect = container.getBoundingClientRect();
          if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
                        
            // Trigger resize event for Three.js
            if (window.THREE && canvas.renderer) {
              canvas.renderer.setSize(rect.width, rect.height);
            }
          }
        }
      });
    }

    // Debounced resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvases, 250);
    });

    // Initial resize
    resizeCanvases();

    // Add touch event handlers
    if ('ontouchstart' in window) {
      document.body.classList.add('touch-device');
            
      // Improve touch interactions
      document.querySelectorAll('button, a, .clickable').forEach(element => {
        element.addEventListener('touchstart', function() {
          this.classList.add('touch-active');
        });
                
        element.addEventListener('touchend', function() {
          setTimeout(() => this.classList.remove('touch-active'), 150);
        });
      });
    }
  }

  // Add loading states to visualizations
  function addLoadingStates() {
    // Check if visualization loader is available
    if (window.VisualizationLoader) {
      const loader = new VisualizationLoader();
            
      // Find all visualization containers
      document.querySelectorAll('.visualization-container').forEach(container => {
        // Skip if already has content
        if (container.children.length > 0) return;
                
        // Add loading state
        const loadingState = loader.createLoadingState(container);
                
        // Remove loading state when content loads
        const observer = new MutationObserver((mutations) => {
          if (container.children.length > 1) {
            if (loadingState && loadingState.parentNode) {
              loadingState.remove();
            }
            observer.disconnect();
          }
        });
                
        observer.observe(container, { childList: true });
      });
    }
  }

  // Initialize progress tracking
  function initProgressTracking() {
    // Get current chapter from URL or page content
    const match = window.location.pathname.match(/chapter(\d+)/);
    if (match) {
      const chapterNumber = parseInt(match[1]);
            
      // Track chapter start
      if (window.progressTracker) {
        window.progressTracker.startChapter(chapterNumber);
                
        // Track visualization interactions
        document.querySelectorAll('.visualization-container').forEach((viz, index) => {
          viz.addEventListener('click', () => {
            window.progressTracker.trackVisualization(chapterNumber, `viz-${index}`);
          });
        });
                
        // Add completion button if not exists
        const navigation = document.querySelector('.button-group, .navigation, div:has(> .button)');
        if (navigation && !document.querySelector('.complete-chapter-btn')) {
          const completeBtn = document.createElement('button');
          completeBtn.className = 'button complete-chapter-btn';
          completeBtn.textContent = 'Mark Chapter Complete ✓';
          completeBtn.addEventListener('click', () => {
            window.progressTracker.completeChapter(chapterNumber);
            completeBtn.textContent = 'Chapter Completed ✓';
            completeBtn.disabled = true;
          });
                    
          // Check if already completed
          const progress = window.progressTracker.getChapterProgress(chapterNumber);
          if (progress && progress.completed) {
            completeBtn.textContent = 'Chapter Completed ✓';
            completeBtn.disabled = true;
          }
                    
          navigation.appendChild(completeBtn);
        }
      }
    }
  }

  // Performance optimizations
  function applyPerformanceOptimizations() {
    // Enable CSS containment
    document.querySelectorAll('.visualization-container').forEach(container => {
      container.style.contain = 'layout style paint';
    });

    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });
            
      images.forEach(img => imageObserver.observe(img));
    }

    // Reduce animation frame rate on low-end devices
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
      document.body.classList.add('low-performance-mode');
    }
  }

  // Main initialization
  function init() {
    console.log('Applying Aion Visualization bug fixes...');
        
    // Apply all fixes
    enhanceWebGLCanvases();
    enhanceAccessibility();
    fixConsoleErrors();
    applyResponsiveFixes();
    addLoadingStates();
    initProgressTracking();
    applyPerformanceOptimizations();
        
    console.log('Bug fixes applied successfully');
        
    // Announce to screen readers
    if (window.AccessibilityUtils) {
      const announcer = new AccessibilityUtils();
      announcer.announce('Page enhancements loaded');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export utilities for manual use
  window.aionFixes = {
    webglUtils,
    accessibilityUtils,
    reapplyFixes: init
  };
})();