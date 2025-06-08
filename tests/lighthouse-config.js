/**
 * Lighthouse Configuration for Performance Testing
 * Target: >95 score across all metrics
 */

module.exports = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    throttling: {
      // Simulate good 4G connection
      rttMs: 28,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      disabled: false,
    },
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
  passes: [{
    passName: 'defaultPass',
    recordTrace: true,
    useThrottling: true,
    pauseAfterLoadMs: 1000,
    networkQuietThresholdMs: 1000,
  }],
  audits: [
    'metrics/first-contentful-paint',
    'metrics/largest-contentful-paint',
    'metrics/cumulative-layout-shift',
    'metrics/total-blocking-time',
    'metrics/speed-index',
  ],
  categories: {
    performance: {
      auditRefs: [
        {id: 'first-contentful-paint', weight: 10},
        {id: 'largest-contentful-paint', weight: 25},
        {id: 'cumulative-layout-shift', weight: 15},
        {id: 'total-blocking-time', weight: 30},
        {id: 'speed-index', weight: 10},
      ],
    },
  },
};