/**
 * Privacy-Focused Analytics
 * Minimal, GDPR-compliant analytics without cookies
 * 
 * Features:
 * - No cookies or personal data collection
 * - Page view tracking
 * - Performance metrics
 * - User journey insights
 * - Respects DNT header
 */

export class PrivacyAnalytics {
  constructor(options = {}) {
    this.options = {
      endpoint: '/api/analytics',
      respectDNT: true,
      collectPerformance: true,
      sampleRate: 1.0, // 100% sampling by default
      ...options
    };
    
    this.sessionId = this.generateSessionId();
    this.pageViews = [];
    this.events = [];
    
    this.init();
  }

  init() {
    // Respect Do Not Track
    if (this.options.respectDNT && navigator.doNotTrack === '1') {
      console.log('Analytics disabled: DNT header detected');
      return;
    }
    
    // Initialize analytics
    this.trackPageView();
    this.setupEventListeners();
    
    if (this.options.collectPerformance) {
      this.collectPerformanceMetrics();
    }
  }

  generateSessionId() {
    // Generate anonymous session ID
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  trackPageView() {
    const pageView = {
      timestamp: Date.now(),
      path: window.location.pathname,
      referrer: document.referrer || 'direct',
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: this.getPlatform()
    };
    
    this.pageViews.push(pageView);
    this.send('pageview', pageView);
  }

  trackEvent(category, action, label = null, value = null) {
    if (Math.random() > this.options.sampleRate) return;
    
    const event = {
      timestamp: Date.now(),
      category,
      action,
      label,
      value,
      path: window.location.pathname
    };
    
    this.events.push(event);
    this.send('event', event);
  }

  trackTiming(category, variable, time) {
    this.send('timing', {
      timestamp: Date.now(),
      category,
      variable,
      time,
      path: window.location.pathname
    });
  }

  collectPerformanceMetrics() {
    if (!window.performance) return;
    
    // Wait for page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const metrics = {
          // Page load metrics
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          request: perfData.responseStart - perfData.requestStart,
          response: perfData.responseEnd - perfData.responseStart,
          dom: perfData.domComplete - perfData.domLoading,
          load: perfData.loadEventEnd - perfData.navigationStart,
          
          // Core Web Vitals (if available)
          fcp: this.getFirstContentfulPaint(),
          lcp: this.getLargestContentfulPaint(),
          fid: this.getFirstInputDelay(),
          cls: this.getCumulativeLayoutShift()
        };
        
        this.send('performance', metrics);
      }, 1000);
    });
  }

  getFirstContentfulPaint() {
    const entry = performance.getEntriesByType('paint')
      .find(e => e.name === 'first-contentful-paint');
    return entry ? Math.round(entry.startTime) : null;
  }

  getLargestContentfulPaint() {
    // Requires PerformanceObserver API
    return this.performanceObserver?.lcp || null;
  }

  getFirstInputDelay() {
    // Requires PerformanceObserver API
    return this.performanceObserver?.fid || null;
  }

  getCumulativeLayoutShift() {
    // Requires PerformanceObserver API
    return this.performanceObserver?.cls || null;
  }

  setupEventListeners() {
    // Track navigation
    window.addEventListener('popstate', () => this.trackPageView());
    
    // Track errors (anonymized)
    window.addEventListener('error', (e) => {
      this.trackEvent('error', 'javascript', e.message);
    });
    
    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('visibility', document.hidden ? 'hidden' : 'visible');
    });
    
    // Track chapter navigation
    document.addEventListener('chapterchange', (e) => {
      this.trackEvent('navigation', 'chapter', e.detail.chapter);
    });
    
    // Track feature usage
    this.trackFeatureUsage();
  }

  trackFeatureUsage() {
    // Premium features
    document.addEventListener('liquidmorph', () => {
      this.trackEvent('feature', 'liquid-morph');
    });
    
    document.addEventListener('magneticcursor', () => {
      this.trackEvent('feature', 'magnetic-cursor');
    });
    
    // Visualization interactions
    document.addEventListener('visualizationinteract', (e) => {
      this.trackEvent('visualization', e.detail.type, e.detail.chapter);
    });
  }

  getPlatform() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  send(type, data) {
    // In production, this would send to your analytics endpoint
    // For now, we'll use console.log in development
    if (window.location.hostname === 'localhost') {
      console.log(`[Analytics] ${type}:`, data);
      return;
    }
    
    // Send data as beacon for reliability
    const payload = JSON.stringify({
      sessionId: this.sessionId,
      type,
      data,
      timestamp: Date.now()
    });
    
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.options.endpoint, payload);
    } else {
      // Fallback to fetch
      fetch(this.options.endpoint, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(() => {
        // Silently fail - analytics should never break the app
      });
    }
  }

  // Public API for custom tracking
  page(path) {
    this.trackPageView();
  }

  event(category, action, label, value) {
    this.trackEvent(category, action, label, value);
  }

  timing(category, variable, time) {
    this.trackTiming(category, variable, time);
  }

  // Session management
  endSession() {
    this.send('session', {
      duration: Date.now() - parseInt(this.sessionId.split('-')[0]),
      pageViews: this.pageViews.length,
      events: this.events.length
    });
  }
}

// Auto-initialize
export const analytics = new PrivacyAnalytics({
  respectDNT: true,
  collectPerformance: true,
  sampleRate: 1.0
});

// Export for use in other modules
export default analytics;