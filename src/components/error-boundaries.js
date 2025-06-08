/**
 * Error Boundaries and Fallback UI System
 * Graceful error handling for all components
 * Provides user-friendly error states
 */

export class ErrorBoundarySystem {
  constructor() {
    this.errorHandlers = new Map();
    this.errorLog = [];
    this.maxLogSize = 50;
    this.init();
  }

  init() {
    this.injectStyles();
    this.setupGlobalErrorHandlers();
    this.createErrorContainer();
  }

  injectStyles() {
    if (document.getElementById('error-boundary-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'error-boundary-styles';
    styles.textContent = `
      /* Error Container */
      .error-boundary-container {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 600px;
        width: 90%;
        background: var(--grey-800, #141414);
        border: 1px solid var(--grey-700, #1F1F1F);
        border-radius: 12px;
        padding: 3rem;
        text-align: center;
        color: var(--grey-050, #F0F0F0);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 10000;
      }

      .error-boundary-container.active {
        opacity: 1;
        visibility: visible;
      }

      /* Error Icon */
      .error-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 2rem;
        position: relative;
      }

      .error-icon::before,
      .error-icon::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 60px;
        height: 2px;
        background: var(--grey-300, #707070);
        transform-origin: center;
      }

      .error-icon::before {
        transform: translate(-50%, -50%) rotate(45deg);
      }

      .error-icon::after {
        transform: translate(-50%, -50%) rotate(-45deg);
      }

      /* Error Content */
      .error-title {
        font-size: 2rem;
        font-weight: 300;
        margin-bottom: 1rem;
        letter-spacing: 0.05em;
      }

      .error-message {
        font-size: 1.125rem;
        color: var(--grey-300, #707070);
        margin-bottom: 2rem;
        line-height: 1.6;
      }

      .error-details {
        background: var(--grey-900, #0A0A0A);
        border: 1px solid var(--grey-700, #1F1F1F);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 2rem;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 0.875rem;
        text-align: left;
        color: var(--grey-400, #555555);
        max-height: 150px;
        overflow-y: auto;
        display: none;
      }

      .error-details.visible {
        display: block;
      }

      /* Error Actions */
      .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      .error-btn {
        padding: 0.75rem 2rem;
        background: transparent;
        border: 1px solid var(--grey-600, #2A2A2A);
        color: var(--grey-050, #F0F0F0);
        border-radius: 6px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-block;
      }

      .error-btn:hover {
        background: var(--grey-700, #1F1F1F);
        border-color: var(--grey-500, #3F3F3F);
        transform: translateY(-1px);
      }

      .error-btn.primary {
        background: var(--grey-700, #1F1F1F);
        border-color: var(--grey-600, #2A2A2A);
      }

      .error-btn.primary:hover {
        background: var(--grey-600, #2A2A2A);
        border-color: var(--grey-500, #3F3F3F);
      }

      /* Inline Error States */
      .error-inline {
        padding: 2rem;
        background: var(--grey-800, #141414);
        border: 1px solid var(--grey-700, #1F1F1F);
        border-radius: 8px;
        text-align: center;
        color: var(--grey-300, #707070);
      }

      .error-inline-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 1rem;
        opacity: 0.5;
      }

      .error-inline-title {
        font-size: 1.25rem;
        margin-bottom: 0.5rem;
        color: var(--grey-050, #F0F0F0);
      }

      .error-inline-message {
        font-size: 1rem;
        line-height: 1.5;
      }

      /* Toast Notifications */
      .error-toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--grey-800, #141414);
        border: 1px solid var(--grey-700, #1F1F1F);
        border-radius: 8px;
        padding: 1rem 1.5rem;
        color: var(--grey-050, #F0F0F0);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 10001;
        max-width: 400px;
      }

      .error-toast.active {
        transform: translateX(0);
      }

      .error-toast-content {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .error-toast-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .error-toast-close {
        margin-left: auto;
        background: none;
        border: none;
        color: var(--grey-400, #555555);
        cursor: pointer;
        padding: 0.25rem;
        transition: color 0.3s ease;
      }

      .error-toast-close:hover {
        color: var(--grey-050, #F0F0F0);
      }

      /* Animation */
      @keyframes errorShake {
        0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
        25% { transform: translate(-50%, -50%) rotate(-1deg); }
        75% { transform: translate(-50%, -50%) rotate(1deg); }
      }

      .error-boundary-container.shake {
        animation: errorShake 0.3s ease;
      }
    `;
    document.head.appendChild(styles);
  }

  setupGlobalErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error,
        type: 'runtime'
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        error: event.reason,
        type: 'promise'
      });
    });

    // Resource loading error handler
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleResourceError(event.target);
      }
    }, true);
  }

  createErrorContainer() {
    const container = document.createElement('div');
    container.className = 'error-boundary-container';
    container.id = 'global-error-boundary';
    container.innerHTML = `
      <div class="error-icon"></div>
      <h2 class="error-title">Oops! Something went wrong</h2>
      <p class="error-message">We encountered an unexpected error. Please try refreshing the page.</p>
      <pre class="error-details" id="error-details"></pre>
      <div class="error-actions">
        <button class="error-btn primary" onclick="location.reload()">Refresh Page</button>
        <button class="error-btn" id="error-details-toggle">Show Details</button>
        <a href="index.html" class="error-btn">Go Home</a>
      </div>
    `;
    document.body.appendChild(container);

    // Setup details toggle
    document.getElementById('error-details-toggle').addEventListener('click', () => {
      const details = document.getElementById('error-details');
      details.classList.toggle('visible');
      event.target.textContent = details.classList.contains('visible') ? 'Hide Details' : 'Show Details';
    });
  }

  handleError(errorInfo) {
    // Log error
    this.logError(errorInfo);

    // Check if it's a critical error
    if (this.isCriticalError(errorInfo)) {
      this.showGlobalError(errorInfo);
    } else {
      this.showToastError(errorInfo.message);
    }

    // Call registered error handlers
    const handler = this.errorHandlers.get(errorInfo.source);
    if (handler) {
      handler(errorInfo);
    }
  }

  handleResourceError(target) {
    const resourceType = target.tagName.toLowerCase();
    const resourceUrl = target.src || target.href;

    if (resourceType === 'img') {
      this.handleImageError(target);
    } else if (resourceType === 'script') {
      this.handleScriptError(target);
    } else if (resourceType === 'link') {
      this.handleStyleError(target);
    }

    this.logError({
      message: `Failed to load ${resourceType}: ${resourceUrl}`,
      type: 'resource',
      target: target
    });
  }

  handleImageError(img) {
    // Replace with fallback image
    img.onerror = null; // Prevent infinite loop
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23141414"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23555" font-family="system-ui" font-size="12"%3EImage Error%3C/text%3E%3C/svg%3E';
    img.alt = 'Image failed to load';
    img.classList.add('error-image');
  }

  handleScriptError(script) {
    console.error(`Script failed to load: ${script.src}`);
    // Could implement retry logic here
  }

  handleStyleError(link) {
    console.error(`Stylesheet failed to load: ${link.href}`);
    // Could inject fallback styles here
  }

  showGlobalError(errorInfo) {
    const container = document.getElementById('global-error-boundary');
    const details = document.getElementById('error-details');
    
    // Update error details
    details.textContent = this.formatErrorDetails(errorInfo);
    
    // Show container with animation
    container.classList.add('active', 'shake');
    setTimeout(() => container.classList.remove('shake'), 300);
  }

  showToastError(message, duration = 5000) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
      <div class="error-toast-content">
        <div class="error-toast-icon">⚠️</div>
        <span>${message}</span>
        <button class="error-toast-close">✕</button>
      </div>
    `;

    document.body.appendChild(toast);
    
    // Show toast
    requestAnimationFrame(() => {
      toast.classList.add('active');
    });

    // Setup close button
    toast.querySelector('.error-toast-close').addEventListener('click', () => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    });

    // Auto-hide after duration
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }

  createInlineError(options = {}) {
    const {
      title = 'Unable to load content',
      message = 'Please try again later.',
      icon = '⚠️'
    } = options;

    const errorElement = document.createElement('div');
    errorElement.className = 'error-inline';
    errorElement.innerHTML = `
      <div class="error-inline-icon">${icon}</div>
      <h3 class="error-inline-title">${title}</h3>
      <p class="error-inline-message">${message}</p>
    `;

    return errorElement;
  }

  wrapWithErrorBoundary(fn, fallback) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        console.error('Error in wrapped function:', error);
        this.handleError({
          message: error.message,
          error: error,
          type: 'wrapped'
        });
        
        if (typeof fallback === 'function') {
          return fallback(error);
        }
        return fallback;
      }
    };
  }

  registerErrorHandler(context, handler) {
    this.errorHandlers.set(context, handler);
  }

  isCriticalError(errorInfo) {
    // Define what constitutes a critical error
    const criticalPatterns = [
      /webgl/i,
      /three\.js/i,
      /out of memory/i,
      /security error/i,
      /syntax error/i
    ];

    return criticalPatterns.some(pattern => 
      pattern.test(errorInfo.message) || 
      (errorInfo.error && pattern.test(errorInfo.error.stack || ''))
    );
  }

  formatErrorDetails(errorInfo) {
    return `Type: ${errorInfo.type}
Message: ${errorInfo.message}
${errorInfo.source ? `Source: ${errorInfo.source}` : ''}
${errorInfo.line ? `Line: ${errorInfo.line}, Column: ${errorInfo.column}` : ''}
${errorInfo.error && errorInfo.error.stack ? `\nStack:\n${errorInfo.error.stack}` : ''}
Time: ${new Date().toISOString()}`;
  }

  logError(errorInfo) {
    this.errorLog.push({
      ...errorInfo,
      timestamp: Date.now()
    });

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Also log to console in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.error('Error logged:', errorInfo);
    }
  }

  getErrorLog() {
    return [...this.errorLog];
  }

  clearErrorLog() {
    this.errorLog = [];
  }
}

// Export singleton instance
export const errorBoundary = new ErrorBoundarySystem();

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.errorBoundary = errorBoundary;
  });
} else {
  window.errorBoundary = errorBoundary;
}