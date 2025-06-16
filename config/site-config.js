/**
 * Site Configuration for Aion Visualization
 * Handles dynamic path resolution for different deployment environments
 */

class SiteConfig {
  constructor() {
    this.detectEnvironment();
    this.setupConfig();
  }

  detectEnvironment() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // Detect deployment environment
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      this.environment = 'development';
      this.baseUrl = '';
    } else if (hostname.includes('github.io')) {
      this.environment = 'github-pages';
      this.baseUrl = '/aion-visualization';
    } else if (hostname.includes('vercel.app') || hostname.includes('vercel.sh')) {
      this.environment = 'vercel';
      this.baseUrl = '';
    } else {
      // Custom domain or other hosting
      this.environment = 'production';
      this.baseUrl = '';
    }
    
    // Allow override via meta tag
    const metaBase = document.querySelector('meta[name="base-url"]');
    if (metaBase) {
      this.baseUrl = metaBase.content;
    }
    
    // Allow override via global variable (for testing)
    if (window.FORCE_BASE_URL !== undefined) {
      this.baseUrl = window.FORCE_BASE_URL;
    }
  }

  setupConfig() {
    this.config = {
      environment: this.environment,
      baseUrl: this.baseUrl,
      apiUrl: this.baseUrl + '/api',
      assetsUrl: this.baseUrl + '/assets',
      paths: {
        home: this.baseUrl + '/',
        chapters: this.baseUrl + '/chapters/',
        chaptersEnhanced: this.baseUrl + '/chapters/enhanced/',
        chaptersStandard: this.baseUrl + '/chapters/standard/',
        visualizations: this.baseUrl + '/visualizations.html',
        src: this.baseUrl + '/src/',
        about: this.baseUrl + '/src/about.html',
        timeline: this.baseUrl + '/src/timeline.html',
        symbols: this.baseUrl + '/src/symbols.html',
        css: this.baseUrl + '/assets/css/',
        js: this.baseUrl + '/assets/js/',
        images: this.baseUrl + '/assets/images/',
        404: this.baseUrl + '/404.html',
        offline: this.baseUrl + '/offline.html'
      }
    };
    
    // Make config globally available
    window.SITE_CONFIG = this.config;
  }

  // Helper method to get absolute URL
  getUrl(path) {
    if (!path) return this.baseUrl + '/';
    
    // If path is already absolute, return as is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
      return path;
    }
    
    // Remove leading slash if present
    path = path.startsWith('/') ? path.substring(1) : path;
    
    // Return with base URL
    return this.baseUrl + '/' + path;
  }

  // Helper to get asset URL with cache busting in development
  getAssetUrl(path, bustCache = false) {
    const url = this.getUrl(path);
    
    if ((this.environment === 'development' || bustCache) && !url.includes('?')) {
      return url + '?v=' + Date.now();
    }
    
    return url;
  }

  // Get chapter URL
  getChapterUrl(chapterNumber, type = 'enhanced') {
    return `${this.baseUrl}/chapters/${type}/chapter-${chapterNumber}.html`;
  }

  // Update all links in the current document
  updateDocumentLinks() {
    // Update link elements
    document.querySelectorAll('link[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('//')) {
        link.href = this.resolveRelativePath(href);
      }
    });
    
    // Update script elements
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('//')) {
        script.src = this.resolveRelativePath(src);
      }
    });
    
    // Update anchor elements
    document.querySelectorAll('a[href]').forEach(anchor => {
      const href = anchor.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#') && !href.startsWith('mailto:')) {
        anchor.href = this.resolveRelativePath(href);
      }
    });
    
    // Update img elements
    document.querySelectorAll('img[src]').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
        img.src = this.resolveRelativePath(src);
      }
    });
  }

  // Resolve relative paths based on current location
  resolveRelativePath(path) {
    // If path starts with /, update based on environment
    if (path.startsWith('/')) {
      return this.baseUrl + path.substring('/aion-visualization'.length);
    }
    
    // If path is relative (starts with ./ or ../)
    if (path.startsWith('./') || path.startsWith('../')) {
      const currentPath = window.location.pathname;
      const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
      
      // Simple relative path resolution
      let resolvedPath = currentDir;
      const pathParts = path.split('/');
      
      for (const part of pathParts) {
        if (part === '..') {
          resolvedPath = resolvedPath.substring(0, resolvedPath.lastIndexOf('/'));
        } else if (part !== '.' && part !== '') {
          resolvedPath += '/' + part;
        }
      }
      
      return resolvedPath;
    }
    
    // If path starts with /, it's root-relative
    if (path.startsWith('/')) {
      return this.baseUrl + path;
    }
    
    // Otherwise, treat as relative to current directory
    const currentPath = window.location.pathname;
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
    return currentDir + '/' + path;
  }

  // Initialize path fixes on DOM ready
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.updateDocumentLinks());
    } else {
      this.updateDocumentLinks();
    }
    
    // Also update dynamically added content
    this.observeDynamicContent();
  }

  // Watch for dynamically added content
  observeDynamicContent() {
    if (typeof MutationObserver === 'undefined') return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            this.updateNodeLinks(node);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Update links in a specific node
  updateNodeLinks(node) {
    // Update the node itself if it has relevant attributes
    if (node.tagName === 'A' && node.href && !node.href.startsWith('http')) {
      node.href = this.resolveRelativePath(node.getAttribute('href'));
    } else if (node.tagName === 'IMG' && node.src && !node.src.startsWith('http')) {
      node.src = this.resolveRelativePath(node.getAttribute('src'));
    } else if (node.tagName === 'LINK' && node.href && !node.href.startsWith('http')) {
      node.href = this.resolveRelativePath(node.getAttribute('href'));
    } else if (node.tagName === 'SCRIPT' && node.src && !node.src.startsWith('http')) {
      node.src = this.resolveRelativePath(node.getAttribute('src'));
    }
    
    // Update child elements
    node.querySelectorAll('a[href], img[src], link[href], script[src]').forEach(el => {
      const attr = el.tagName === 'A' ? 'href' : 'src';
      const value = el.getAttribute(attr);
      if (value && !value.startsWith('http') && !value.startsWith('//')) {
        el[attr] = this.resolveRelativePath(value);
      }
    });
  }

  // Debug method
  debug() {
    console.group('Site Configuration');
    console.log('Environment:', this.environment);
    console.log('Base URL:', this.baseUrl);
    console.log('Current URL:', window.location.href);
    console.log('Config:', this.config);
    console.groupEnd();
  }
}

// Initialize and export
const siteConfig = new SiteConfig();
siteConfig.init();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = siteConfig;
}

// Make available globally
window.siteConfig = siteConfig;