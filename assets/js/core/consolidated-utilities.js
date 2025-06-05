/**
 * Consolidated Utilities - Phase 5 Cleanup
 * All common functions consolidated to prevent duplication
 */

// Utility namespace to prevent global pollution
const AionUtils = {
    
  // DOM utilities
  dom: {
    // Get element safely
    get(selector) {
      try {
        return document.querySelector(selector);
      } catch (error) {
        console.warn('Element not found:', selector);
        return null;
      }
    },
        
    // Get all elements safely
    getAll(selector) {
      try {
        return document.querySelectorAll(selector);
      } catch (error) {
        console.warn('Elements not found:', selector);
        return [];
      }
    },
        
    // Add event listener with error handling
    on(element, event, handler) {
      if (!element) return;
            
      try {
        element.addEventListener(event, (e) => {
          try {
            handler(e);
          } catch (error) {
            console.error('Event handler error:', error);
            AionUtils.errors.show('An error occurred while handling the event');
          }
        });
      } catch (error) {
        console.error('Failed to add event listener:', error);
      }
    },
        
    // Remove event listener safely
    off(element, event, handler) {
      if (!element) return;
            
      try {
        element.removeEventListener(event, handler);
      } catch (error) {
        console.warn('Failed to remove event listener:', error);
      }
    },
        
    // Create element with attributes
    create(tag, attributes = {}, content = '') {
      try {
        const element = document.createElement(tag);
                
        Object.keys(attributes).forEach(attr => {
          element.setAttribute(attr, attributes[attr]);
        });
                
        if (content) {
          element.innerHTML = content;
        }
                
        return element;
      } catch (error) {
        console.error('Failed to create element:', error);
        return null;
      }
    }
  },
    
  // Animation utilities
  animation: {
    // Smooth scroll to element
    scrollTo(element, duration = 500) {
      if (!element) return;
            
      const start = window.pageYOffset;
      const target = element.offsetTop;
      const distance = target - start;
      let startTime = null;
            
      const animate = (currentTime) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
                
        // Easing function
        const ease = progress * (2 - progress);
        window.scrollTo(0, start + distance * ease);
                
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
            
      requestAnimationFrame(animate);
    },
        
    // Fade in element
    fadeIn(element, duration = 300) {
      if (!element) return Promise.resolve();
            
      return new Promise(resolve => {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms`;
                
        requestAnimationFrame(() => {
          element.style.opacity = '1';
          setTimeout(resolve, duration);
        });
      });
    },
        
    // Fade out element
    fadeOut(element, duration = 300) {
      if (!element) return Promise.resolve();
            
      return new Promise(resolve => {
        element.style.transition = `opacity ${duration}ms`;
        element.style.opacity = '0';
        setTimeout(resolve, duration);
      });
    }
  },
    
  // Storage utilities
  storage: {
    // Get from localStorage with error handling
    get(key, defaultValue = null) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
      } catch (error) {
        console.warn('Failed to get from storage:', key, error);
        return defaultValue;
      }
    },
        
    // Set to localStorage with error handling
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn('Failed to set storage:', key, error);
        return false;
      }
    },
        
    // Remove from localStorage
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('Failed to remove from storage:', key, error);
        return false;
      }
    }
  },
    
  // Network utilities
  network: {
    // Fetch with error handling and timeout
    async fetch(url, options = {}) {
      const defaultOptions = {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      };
            
      const config = { ...defaultOptions, ...options };
            
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
            
      try {
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });
                
        clearTimeout(timeoutId);
                
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
                
        return response;
                
      } catch (error) {
        clearTimeout(timeoutId);
                
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
                
        throw error;
      }
    },
        
    // Check if online
    isOnline() {
      return navigator.onLine;
    },
        
    // Monitor online status
    onNetworkChange(callback) {
      window.addEventListener('online', () => callback(true));
      window.addEventListener('offline', () => callback(false));
    }
  },
    
  // Error handling utilities
  errors: {
    // Show user-friendly error message
    show(message, type = 'error') {
      const container = this.getContainer();
      const errorElement = AionUtils.dom.create('div', {
        class: `error-message error-${type}`,
        role: 'alert'
      }, `
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
                <button class="error-close" onclick="this.parentElement.remove()">×</button>
            `);
            
      container.appendChild(errorElement);
            
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (errorElement.parentElement) {
          errorElement.remove();
        }
      }, 5000);
    },
        
    // Get or create error container
    getContainer() {
      let container = AionUtils.dom.get('#error-container');
            
      if (!container) {
        container = AionUtils.dom.create('div', {
          id: 'error-container',
          class: 'error-container'
        });
        document.body.appendChild(container);
      }
            
      return container;
    },
        
    // Log error with context
    log(error, context = '') {
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        context: context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
            
      console.error('Application Error:', errorInfo);
            
      // Store error for debugging (keep last 10)
      const errors = AionUtils.storage.get('debug_errors', []);
      errors.push(errorInfo);
      if (errors.length > 10) errors.shift();
      AionUtils.storage.set('debug_errors', errors);
    }
  },
    
  // Validation utilities
  validation: {
    // Validate email
    isEmail(email) {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return pattern.test(email);
    },
        
    // Validate URL
    isUrl(url) {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
        
    // Validate number range
    isInRange(value, min, max) {
      const num = parseFloat(value);
      return !isNaN(num) && num >= min && num <= max;
    }
  },
    
  // Performance utilities
  performance: {
    // Debounce function
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
        
    // Throttle function
    throttle(func, limit) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func(...args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },
        
    // Measure execution time
    measure(name, func) {
      const start = performance.now();
      const result = func();
      const end = performance.now();
      console.log(`${name} took ${(end - start).toFixed(2)}ms`);
      return result;
    }
  }
};

// Make available globally
window.AionUtils = AionUtils;

// Global error handler
window.addEventListener('error', (event) => {
  AionUtils.errors.log(event.error, 'Global error handler');
  AionUtils.errors.show('An unexpected error occurred. Please refresh the page.');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  AionUtils.errors.log(new Error(event.reason), 'Unhandled promise rejection');
  AionUtils.errors.show('An error occurred while processing your request.');
});
