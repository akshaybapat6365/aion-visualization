/**
 * BackstopJS Configuration
 * Visual regression testing for design consistency
 */

module.exports = {
  id: 'aion_visualization',
  viewports: [
    {
      label: 'mobile',
      width: 375,
      height: 667
    },
    {
      label: 'tablet',
      width: 768,
      height: 1024
    },
    {
      label: 'desktop',
      width: 1920,
      height: 1080
    }
  ],
  onBeforeScript: 'puppet/onBefore.js',
  onReadyScript: 'puppet/onReady.js',
  scenarios: [
    {
      label: 'Homepage',
      url: 'http://localhost:8080/',
      selectors: ['document'],
      misMatchThreshold: 0.1,
      requireSameDimensions: true
    },
    {
      label: 'Homepage - Hero Section',
      url: 'http://localhost:8080/',
      selectors: ['.hero'],
      misMatchThreshold: 0.1
    },
    {
      label: 'Navigation',
      url: 'http://localhost:8080/',
      selectors: ['.nav'],
      misMatchThreshold: 0.1
    },
    {
      label: 'Chapters Index',
      url: 'http://localhost:8080/chapters/',
      selectors: ['document'],
      misMatchThreshold: 0.1
    },
    {
      label: 'Chapter Card Grid',
      url: 'http://localhost:8080/chapters/',
      selectors: ['.chapter-grid'],
      misMatchThreshold: 0.1
    },
    {
      label: 'Showcase',
      url: 'http://localhost:8080/showcase.html',
      selectors: ['document'],
      misMatchThreshold: 0.1
    },
    {
      label: 'Loading States',
      url: 'http://localhost:8080/polish-test.html',
      clickSelector: 'button[onclick="testChapterLoader()"]',
      selectors: ['.chapter-loader'],
      misMatchThreshold: 0.1,
      delay: 500
    },
    {
      label: 'Error Toast',
      url: 'http://localhost:8080/polish-test.html',
      clickSelector: 'button[onclick="testToastError()"]',
      selectors: ['.error-toast'],
      misMatchThreshold: 0.1,
      delay: 500
    },
    {
      label: 'Magnetic Buttons',
      url: 'http://localhost:8080/showcase.html',
      hoverSelector: '.magnetic-button',
      selectors: ['.feature-section:first-child'],
      misMatchThreshold: 0.1
    },
    {
      label: 'Liquid Transitions',
      url: 'http://localhost:8080/showcase.html',
      selectors: ['.transition-demo'],
      misMatchThreshold: 0.1
    }
  ],
  paths: {
    bitmaps_reference: 'tests/visual-regression/reference',
    bitmaps_test: 'tests/visual-regression/test',
    html_report: 'tests/visual-regression/report',
    ci_report: 'tests/visual-regression/ci'
  },
  engine: 'puppeteer',
  engineOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  asyncCaptureLimit: 5,
  asyncCompareLimit: 50,
  debug: false,
  debugWindow: false
};