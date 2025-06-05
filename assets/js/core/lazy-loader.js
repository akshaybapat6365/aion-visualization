/**
 * Lazy Loading System - Phase 5 Performance Optimization
 * Load chapters and heavy visualizations on demand
 */

class LazyLoader {
  constructor() {
    this.loadedChapters = new Set();
    this.loadingChapters = new Set();
    this.visualizationCache = new Map();
    this.observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };
    this.intersectionObserver = null;
    this.init();
  }
    
  init() {
    // Create intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        this.handleIntersection.bind(this),
        this.observerOptions
      );
    }
        
    // Setup lazy loading on page load
    document.addEventListener('DOMContentLoaded', () => {
      this.setupLazyLoading();
    });
  }
    
  setupLazyLoading() {
    // Find all lazy loadable elements
    const lazyElements = document.querySelectorAll('[data-lazy-load]');
        
    lazyElements.forEach(element => {
      if (this.intersectionObserver) {
        this.intersectionObserver.observe(element);
      }
    });
        
    console.log(`LazyLoader: Observing ${lazyElements.length} elements`);
  }
    
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadElement(entry.target);
        this.intersectionObserver.unobserve(entry.target);
      }
    });
  }
    
  async loadElement(element) {
    const loadType = element.dataset.lazyLoad;
    const loadSrc = element.dataset.lazySrc;
        
    try {
      this.showLoadingIndicator(element);
            
      switch (loadType) {
      case 'chapter':
        await this.loadChapter(loadSrc, element);
        break;
      case 'visualization':
        await this.loadVisualization(loadSrc, element);
        break;
      case 'image':
        await this.loadImage(loadSrc, element);
        break;
      default:
        console.warn('Unknown lazy load type:', loadType);
      }
            
    } catch (error) {
      console.error('Lazy loading failed:', error);
      this.showErrorIndicator(element);
    } finally {
      this.hideLoadingIndicator(element);
    }
  }
    
  async loadChapter(chapterPath, element) {
    if (this.loadedChapters.has(chapterPath)) {
      return;
    }
        
    if (this.loadingChapters.has(chapterPath)) {
      return;
    }
        
    this.loadingChapters.add(chapterPath);
        
    try {
      const response = await fetch(chapterPath);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
      const html = await response.text();
      element.innerHTML = html;
            
      this.loadedChapters.add(chapterPath);
      this.loadingChapters.delete(chapterPath);
            
      console.log('Chapter loaded:', chapterPath);
            
    } catch (error) {
      this.loadingChapters.delete(chapterPath);
      throw error;
    }
  }
    
  async loadVisualization(vizPath, element) {
    if (this.visualizationCache.has(vizPath)) {
      const cachedViz = this.visualizationCache.get(vizPath);
      element.appendChild(cachedViz.cloneNode(true));
      return;
    }
        
    try {
      // Load visualization script dynamically
      await this.loadScript(vizPath);
            
      // Initialize visualization
      const canvas = document.createElement('canvas');
      canvas.width = element.offsetWidth || 800;
      canvas.height = element.offsetHeight || 400;
            
      element.appendChild(canvas);
            
      // Cache for future use
      this.visualizationCache.set(vizPath, canvas.cloneNode(true));
            
      console.log('Visualization loaded:', vizPath);
            
    } catch (error) {
      throw new Error(`Failed to load visualization: ${error.message}`);
    }
  }
    
  async loadImage(imageSrc, element) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        element.src = imageSrc;
        element.classList.add('loaded');
        resolve();
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  }
    
  async loadScript(scriptSrc) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
    
  showLoadingIndicator(element) {
    element.classList.add('lazy-loading');
        
    if (!element.querySelector('.loading-indicator')) {
      const indicator = document.createElement('div');
      indicator.className = 'loading-indicator';
      indicator.innerHTML = `
                <div class="loading-spinner"></div>
                <span>Loading...</span>
            `;
      element.appendChild(indicator);
    }
  }
    
  hideLoadingIndicator(element) {
    element.classList.remove('lazy-loading');
    const indicator = element.querySelector('.loading-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
    
  showErrorIndicator(element) {
    element.classList.add('lazy-error');
    element.innerHTML = `
            <div class="error-indicator">
                <span>Failed to load content</span>
                <button onclick="window.lazyLoader.retryLoad(this.parentElement.parentElement)">
                    Retry
                </button>
            </div>
        `;
  }
    
  retryLoad(element) {
    element.classList.remove('lazy-error');
    this.loadElement(element);
  }
    
  // Preload critical chapters
  preloadCriticalChapters() {
    const criticalChapters = [
      'chapters/enhanced/chapter-1.html',
      'chapters/enhanced/chapter-2.html'
    ];
        
    criticalChapters.forEach(async (chapter) => {
      try {
        const response = await fetch(chapter);
        if (response.ok) {
          this.loadedChapters.add(chapter);
        }
      } catch (error) {
        console.warn('Failed to preload:', chapter);
      }
    });
  }
}

// Initialize lazy loader
window.lazyLoader = new LazyLoader();
