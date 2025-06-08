/**
 * Polish Integration Script
 * Integrates all Phase 4 polish features across the site
 * Ensures consistent experience on all pages
 */

import { loadingStates } from './components/loading-states.js';
import { errorBoundary } from './components/error-boundaries.js';
import { microInteractions } from './components/micro-interactions.js';

class PolishIntegration {
  constructor() {
    this.initialized = false;
    this.init();
  }

  async init() {
    if (this.initialized) return;

    try {
      // Initialize all polish systems
      await this.initializeSystems();
      
      // Enhance page transitions
      this.setupPageTransitions();
      
      // Enhance chapter loading
      this.enhanceChapterLoading();
      
      // Setup WebGL error handling
      this.setupWebGLErrorHandling();
      
      // Enhance navigation
      this.enhanceNavigation();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      this.initialized = true;
      console.log('✨ Polish integration complete');
    } catch (error) {
      console.error('Failed to initialize polish features:', error);
      errorBoundary.handleError({
        message: 'Failed to initialize enhanced features',
        error: error,
        type: 'initialization'
      });
    }
  }

  async initializeSystems() {
    // Systems are auto-initialized, but we ensure they're ready
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  setupPageTransitions() {
    // Intercept all internal navigation
    document.addEventListener('click', async (e) => {
      const link = e.target.closest('a');
      if (!link || !this.isInternalLink(link)) return;

      // Don't intercept anchor links
      if (link.hash && link.pathname === window.location.pathname) return;

      e.preventDefault();

      // Determine the type of transition
      const transitionType = this.getTransitionType(link);
      
      // Show appropriate loading state
      if (transitionType === 'chapter') {
        const chapterMatch = link.href.match(/chapter(\d+)/);
        const chapterNum = chapterMatch ? chapterMatch[1] : '?';
        const chapterTitle = link.textContent || 'Loading Chapter';
        
        const loaderId = loadingStates.showChapterLoader(chapterNum, chapterTitle);
        
        // Add liquid morph effect if available
        this.triggerLiquidMorph();
        
        // Navigate after animation starts
        setTimeout(() => {
          window.location.href = link.href;
        }, 300);
      } else {
        // Regular page transition
        const loaderId = loadingStates.showVizLoader('Loading Page');
        
        setTimeout(() => {
          window.location.href = link.href;
        }, 200);
      }
    });
  }

  enhanceChapterLoading() {
    // If we're on a chapter page, setup enhanced loading
    if (window.location.pathname.includes('chapter')) {
      // Monitor WebGL context creation
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        if (type === 'webgl' || type === 'webgl2') {
          const loaderId = loadingStates.showVizLoader('Initializing 3D Visualization');
          
          const context = originalGetContext.call(this, type, ...args);
          
          if (context) {
            // Context created successfully
            setTimeout(() => {
              loadingStates.hideLoader(loaderId);
            }, 500);
          } else {
            // WebGL failed
            loadingStates.hideLoader(loaderId);
            errorBoundary.showToastError('3D visualization unavailable. Showing simplified view.');
          }
          
          return context;
        }
        return originalGetContext.call(this, type, ...args);
      };
    }
  }

  setupWebGLErrorHandling() {
    // Wrap Three.js initialization if it exists
    if (window.THREE) {
      const originalWebGLRenderer = window.THREE.WebGLRenderer;
      window.THREE.WebGLRenderer = function(...args) {
        try {
          const renderer = new originalWebGLRenderer(...args);
          
          // Add error handling
          renderer.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            errorBoundary.handleError({
              message: 'WebGL context lost. Attempting to restore...',
              type: 'webgl',
              error: e
            });
            
            // Attempt to restore
            setTimeout(() => {
              renderer.forceContextRestore();
            }, 1000);
          });
          
          renderer.domElement.addEventListener('webglcontextrestored', () => {
            errorBoundary.showToastError('3D visualization restored', 3000);
          });
          
          return renderer;
        } catch (error) {
          errorBoundary.handleError({
            message: 'Failed to initialize 3D renderer',
            error: error,
            type: 'webgl'
          });
          throw error;
        }
      };
    }
  }

  enhanceNavigation() {
    // Add loading states to navigation items
    const navLinks = document.querySelectorAll('nav a, .nav-link');
    navLinks.forEach(link => {
      if (!link.dataset.enhanced) {
        // Add active state based on current page
        if (this.isCurrentPage(link)) {
          link.classList.add('active');
        }

        // Add micro-interactions
        microInteractions.addTooltip(link, link.textContent);
        
        link.dataset.enhanced = 'true';
      }
    });

    // Enhance mobile menu if exists
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', () => {
        microInteractions.createRipple(event, mobileMenuToggle);
      });
    }
  }

  setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('Long task detected:', entry);
              
              // If task is too long, show subtle indicator
              if (entry.duration > 100) {
                errorBoundary.showToastError('Performance may be degraded', 2000);
              }
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // LongTasks API might not be supported
      }

      // Monitor page performance
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          if (navigation) {
            const loadTime = navigation.loadEventEnd - navigation.fetchStart;
            console.log(`Page load time: ${loadTime.toFixed(2)}ms`);
            
            // If load time is slow, optimize
            if (loadTime > 3000) {
              this.enableReducedMode();
            }
          }
        }, 0);
      });
    }
  }

  // Helper methods
  isInternalLink(link) {
    try {
      const url = new URL(link.href);
      return url.hostname === window.location.hostname;
    } catch {
      return true; // Relative URLs
    }
  }

  isCurrentPage(link) {
    const linkPath = new URL(link.href, window.location.origin).pathname;
    return linkPath === window.location.pathname;
  }

  getTransitionType(link) {
    if (link.href.includes('chapter')) return 'chapter';
    if (link.href.includes('visualization')) return 'viz';
    return 'page';
  }

  triggerLiquidMorph() {
    document.body.classList.add('liquid-morph-out');
  }

  enableReducedMode() {
    console.log('Enabling reduced performance mode');
    document.body.classList.add('reduced-performance');
    
    // Disable complex animations
    const style = document.createElement('style');
    style.textContent = `
      .reduced-performance * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
      
      .reduced-performance .magnetic-cursor {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }

  // Public API
  showLoading(type = 'page', options = {}) {
    switch (type) {
      case 'chapter':
        return loadingStates.showChapterLoader(options.number, options.title);
      case 'viz':
        return loadingStates.showVizLoader(options.message);
      case 'content':
        return loadingStates.showContentLoader(options.element, options.message);
      default:
        return loadingStates.showVizLoader('Loading...');
    }
  }

  hideLoading(loaderId) {
    loadingStates.hideLoader(loaderId);
  }

  handleError(error, options = {}) {
    errorBoundary.handleError({
      ...options,
      error: error,
      message: error.message || 'An error occurred'
    });
  }

  wrapAsync(fn, fallback) {
    return errorBoundary.wrapWithErrorBoundary(fn, fallback);
  }
}

// Create and export singleton instance
const polishIntegration = new PolishIntegration();

// Make available globally
window.polishIntegration = polishIntegration;

// Export for module usage
export default polishIntegration;