// Core Utilities for Aion Visualization
// Common functions, helpers, and utilities used throughout the project

class AionUtils {
  constructor() {
    this.performanceMode = this.detectPerformanceMode();
    this.isLowMemoryDevice = this.detectLowMemoryDevice();
    this.isMobile = this.detectMobile();
    this.setupGlobalErrorHandling();
  }

  // Performance and device detection
  detectPerformanceMode() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
        
    if (memory >= 8 && cores >= 4) return 'high';
    if (memory >= 4 && cores >= 2) return 'medium';
    return 'low';
  }

  detectLowMemoryDevice() {
    if (navigator.deviceMemory) {
      return navigator.deviceMemory <= 4;
    }
    return this.detectMobile();
  }

  detectMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Animation utilities
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }

  easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  easeInOutBack(t) {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  }

  // Smooth animation helper
  animate(options) {
    const {
      duration = 300,
      easing = this.easeInOutCubic,
      onUpdate,
      onComplete
    } = options;

    const startTime = performance.now();
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      if (onUpdate) onUpdate(easedProgress);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else if (onComplete) {
        onComplete();
      }
    };

    requestAnimationFrame(update);
  }

  // Debounce utility
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  // Throttle utility
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Random number utilities
  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Color utilities
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;

    const a = s * Math.min(l, 1 - l);
    const f = (n, k = (n + h / 30) % 12) =>
      l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);

    return {
      r: Math.round(f(0) * 255),
      g: Math.round(f(8) * 255),
      b: Math.round(f(4) * 255)
    };
  }

  // DOM utilities
  createElement(tag, className, innerHTML) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  }

  findParent(element, selector) {
    while (element && element !== document) {
      if (element.matches && element.matches(selector)) {
        return element;
      }
      element = element.parentNode;
    }
    return null;
  }

  // Event utilities
  once(element, event, callback) {
    const handler = (e) => {
      element.removeEventListener(event, handler);
      callback(e);
    };
    element.addEventListener(event, handler);
  }

  // Loading state utilities
  showLoading(container, message = 'Loading...') {
    const loadingDiv = this.createElement('div', 'loading-overlay', `
            <div class="loading-spinner">
                <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                </svg>
            </div>
            <p class="loading-text">${message}</p>
        `);
        
    container.appendChild(loadingDiv);
    return loadingDiv;
  }

  hideLoading(container) {
    const loading = container.querySelector('.loading-overlay');
    if (loading) {
      loading.remove();
    }
  }

  // Error handling
  setupGlobalErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      this.showUserFriendlyError('An unexpected error occurred. Please refresh the page.');
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
      this.showUserFriendlyError('A network or loading error occurred.');
    });
  }

  showUserFriendlyError(message) {
    const errorDiv = this.createElement('div', 'error-notification glass-card', `
            <div class="error-icon">⚠️</div>
            <div class="error-message">${message}</div>
            <button class="error-dismiss glass-button">Dismiss</button>
        `);

    document.body.appendChild(errorDiv);

    const dismissBtn = errorDiv.querySelector('.error-dismiss');
    dismissBtn.addEventListener('click', () => errorDiv.remove());

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  // Local storage utilities
  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }

  loadFromStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  }

  // Performance monitoring
  measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  }

  // Lazy loading observer
  createLazyObserver(callback, options = {}) {
    const defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    return new IntersectionObserver(callback, { ...defaultOptions, ...options });
  }

  // Viewport utilities
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  getViewportSize() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  }

  // Math utilities
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  lerp(start, end, factor) {
    return start + factor * (end - start);
  }

  map(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }

  // Keyboard utilities
  isKey(event, key) {
    return event.key === key || event.code === key;
  }

  hasModifier(event) {
    return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
  }
}

// Create global instance
const aionUtils = new AionUtils();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AionUtils, aionUtils };
}

// Add to global scope
if (typeof window !== 'undefined') {
  window.aionUtils = aionUtils;
}