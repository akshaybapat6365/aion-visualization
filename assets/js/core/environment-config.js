/**
 * Environment Configuration - Phase 5 Production Settings
 * Handles environment-specific settings for development, staging, and production
 */

class EnvironmentConfig {
  constructor() {
    this.environment = this.detectEnvironment();
    this.config = this.loadConfig();
    this.cdnConfig = this.loadCDNConfig();
        
    // Apply environment-specific settings
    this.applySettings();
        
    console.log(`Environment: ${this.environment}`, this.config);
  }
    
  detectEnvironment() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
        
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
        
    if (hostname.includes('github.io')) {
      return 'production';
    }
        
    if (hostname.includes('staging') || hostname.includes('preview')) {
      return 'staging';
    }
        
    return 'production'; // Default to production for safety
  }
    
  loadConfig() {
    const baseConfig = {
      development: {
        debug: true,
        performance: {
          enableMonitoring: true,
          enableLogging: true,
          enableErrorReporting: true
        },
        features: {
          showDebugInfo: true,
          enableHotReload: true,
          skipMinification: true,
          enableSourceMaps: true
        },
        api: {
          timeout: 10000,
          retries: 2
        },
        assets: {
          useMinified: false,
          enableCaching: false,
          cacheBuster: Date.now()
        }
      },
            
      staging: {
        debug: true,
        performance: {
          enableMonitoring: true,
          enableLogging: true,
          enableErrorReporting: true
        },
        features: {
          showDebugInfo: true,
          enableHotReload: false,
          skipMinification: false,
          enableSourceMaps: true
        },
        api: {
          timeout: 8000,
          retries: 3
        },
        assets: {
          useMinified: true,
          enableCaching: true,
          cacheBuster: null
        }
      },
            
      production: {
        debug: false,
        performance: {
          enableMonitoring: false,
          enableLogging: false,
          enableErrorReporting: true
        },
        features: {
          showDebugInfo: false,
          enableHotReload: false,
          skipMinification: false,
          enableSourceMaps: false
        },
        api: {
          timeout: 5000,
          retries: 3
        },
        assets: {
          useMinified: true,
          enableCaching: true,
          cacheBuster: null
        }
      }
    };
        
    return {
      ...baseConfig[this.environment],
      environment: this.environment,
      baseUrl: this.getBaseUrl(),
      version: this.getVersion()
    };
  }
    
  loadCDNConfig() {
    const cdnConfig = {
      development: {
        threejs: {
          url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
          fallback: '/assets/js/vendor/three.min.js',
          integrity: null
        },
        d3: {
          url: 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js',
          fallback: '/assets/js/vendor/d3.min.js',
          integrity: null
        }
      },
            
      production: {
        threejs: {
          url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
          fallback: '/assets/js/vendor/three.min.js',
          integrity: 'sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ=='
        },
        d3: {
          url: 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js',
          fallback: '/assets/js/vendor/d3.min.js',
          integrity: 'sha512-M7nHCiNUOwFt6Us3r8alutZLm9qMt4s9951uo8jqO4UwJ1hziseL6O3ndFyigx6+LREfZqnhHxYjKRJ8ZQ69DQ=='
        }
      }
    };
        
    return cdnConfig[this.environment] || cdnConfig.production;
  }
    
  getBaseUrl() {
    if (this.environment === 'production') {
      return '/aion-visualization';
    }
    return '';
  }
    
  getVersion() {
    // In production, this could come from build process
    return '1.0.0';
  }
    
  applySettings() {
    // Apply debug settings
    if (this.config.debug) {
      window.DEBUG = true;
      localStorage.setItem('debug', 'true');
    } else {
      window.DEBUG = false;
      localStorage.removeItem('debug');
    }
        
    // Apply performance monitoring
    if (this.config.performance.enableMonitoring) {
      this.enablePerformanceMonitoring();
    }
        
    // Apply error reporting
    if (this.config.performance.enableErrorReporting) {
      this.enableErrorReporting();
    }
        
    // Apply feature flags
    this.applyFeatureFlags();
  }
    
  enablePerformanceMonitoring() {
    // Enable performance API usage
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page load performance:', {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          totalTime: perfData.loadEventEnd - perfData.navigationStart
        });
      });
    }
  }
    
  enableErrorReporting() {
    // Global error handler
    window.addEventListener('error', (event) => {
      const errorInfo = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        environment: this.environment,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
            
      this.reportError(errorInfo);
    });
        
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      const errorInfo = {
        message: event.reason,
        type: 'unhandledrejection',
        environment: this.environment,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
            
      this.reportError(errorInfo);
    });
  }
    
  reportError(errorInfo) {
    if (this.config.debug) {
      console.error('Error reported:', errorInfo);
    }
        
    // In production, you might send errors to a logging service
    if (this.environment === 'production') {
      // Example: Send to logging service
      // this.sendToLoggingService(errorInfo);
    }
        
    // Store locally for debugging
    const errors = JSON.parse(localStorage.getItem('error_log') || '[]');
    errors.push(errorInfo);
        
    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.shift();
    }
        
    localStorage.setItem('error_log', JSON.stringify(errors));
  }
    
  applyFeatureFlags() {
    // Create global feature flag object
    window.FEATURES = this.config.features;
        
    // Apply CSS classes based on environment
    document.documentElement.classList.add(`env-${this.environment}`);
        
    if (this.config.features.showDebugInfo) {
      document.documentElement.classList.add('debug-enabled');
    }
  }
    
  // CDN loading with fallback
  async loadCDNResource(name) {
    const resource = this.cdnConfig[name];
    if (!resource) {
      throw new Error(`CDN resource '${name}' not configured`);
    }
        
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = resource.url;
            
      if (resource.integrity) {
        script.integrity = resource.integrity;
        script.crossOrigin = 'anonymous';
      }
            
      script.onload = () => {
        console.log(`CDN resource loaded: ${name}`);
        resolve();
      };
            
      script.onerror = () => {
        console.warn(`CDN failed for ${name}, loading fallback`);
        this.loadFallbackResource(name, resource.fallback)
          .then(resolve)
          .catch(reject);
      };
            
      document.head.appendChild(script);
    });
  }
    
  async loadFallbackResource(name, fallbackUrl) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = fallbackUrl;
            
      script.onload = () => {
        console.log(`Fallback resource loaded: ${name}`);
        resolve();
      };
            
      script.onerror = () => {
        console.error(`Failed to load fallback for ${name}`);
        reject(new Error(`Failed to load ${name}`));
      };
            
      document.head.appendChild(script);
    });
  }
    
  // Asset URL helper
  getAssetUrl(path) {
    const baseUrl = this.config.baseUrl;
        
    // Add cache buster if configured
    if (this.config.assets.cacheBuster) {
      const separator = path.includes('?') ? '&' : '?';
      path += `${separator}v=${this.config.assets.cacheBuster}`;
    }
        
    return `${baseUrl}${path}`;
  }
    
  // Get minified asset path
  getOptimizedAssetUrl(path) {
    if (!this.config.assets.useMinified) {
      return this.getAssetUrl(path);
    }
        
    // Convert to minified version
    const extension = path.split('.').pop();
    const minifiedPath = path.replace(`.${extension}`, `.min.${extension}`);
        
    return this.getAssetUrl(minifiedPath);
  }
    
  // Performance optimization helpers
  shouldPreloadAsset(type) {
    if (this.environment === 'development') {
      return false; // Don't preload in development
    }
        
    const preloadConfig = {
      css: true,
      js: true,
      images: false, // Only preload critical images
      fonts: true
    };
        
    return preloadConfig[type] || false;
  }
    
  getImageOptimization() {
    return {
      lazy: this.environment === 'production',
      webp: 'webp' in document.createElement('canvas').getContext('2d'),
      quality: this.environment === 'production' ? 85 : 95
    };
  }
    
  // Analytics configuration
  getAnalyticsConfig() {
    return {
      enabled: this.environment === 'production',
      trackingId: this.environment === 'production' ? 'GA_TRACKING_ID' : null,
      anonymizeIp: true,
      respectDnt: true
    };
  }
    
  // Service Worker configuration
  getServiceWorkerConfig() {
    return {
      enabled: this.environment === 'production',
      scope: this.config.baseUrl + '/',
      cacheStrategy: 'cache-first',
      updateOnReload: this.environment !== 'production'
    };
  }
    
  // Development helpers
  logConfig() {
    if (this.config.debug) {
      console.group('Environment Configuration');
      console.log('Environment:', this.environment);
      console.log('Config:', this.config);
      console.log('CDN Config:', this.cdnConfig);
      console.log('Base URL:', this.getBaseUrl());
      console.groupEnd();
    }
  }
    
  // Public API
  get(key) {
    const keys = key.split('.');
    let value = this.config;
        
    for (const k of keys) {
      value = value[k];
      if (value === undefined) break;
    }
        
    return value;
  }
    
  isProduction() {
    return this.environment === 'production';
  }
    
  isDevelopment() {
    return this.environment === 'development';
  }
    
  isStaging() {
    return this.environment === 'staging';
  }
}

// Initialize environment configuration
const environmentConfig = new EnvironmentConfig();

// Make available globally
window.ENV_CONFIG = environmentConfig;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnvironmentConfig;
}

// Auto-configure based on environment
document.addEventListener('DOMContentLoaded', () => {
  environmentConfig.logConfig();
    
  // Load CDN resources if needed
  if (typeof THREE === 'undefined') {
    environmentConfig.loadCDNResource('threejs').catch(console.error);
  }
    
  if (typeof d3 === 'undefined') {
    environmentConfig.loadCDNResource('d3').catch(console.error);
  }
});