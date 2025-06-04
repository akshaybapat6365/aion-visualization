/**
 * Lighthouse Configuration for Performance Testing
 * Phase 6: Testing and Quality Assurance
 */

module.exports = {
  // CI configuration
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run serve',
      startServerReadyPattern: 'Server running',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/chapters/',
        'http://localhost:3000/chapters/enhanced/1/',
        'http://localhost:3000/chapters/enhanced/5/',
        'http://localhost:3000/chapters/standard/1/',
        'http://localhost:3000/chapters/standard/5/'
      ],
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        }
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './tests/reports/lighthouse'
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // Performance metrics
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 4000 }],
        'max-potential-fid': ['error', { maxNumericValue: 100 }],
        
        // Resource optimization
        'unused-css-rules': ['warn', { maxLength: 1 }],
        'unused-javascript': ['warn', { maxLength: 1 }],
        'modern-image-formats': ['warn', { maxLength: 0 }],
        'offscreen-images': ['warn', { maxLength: 0 }],
        
        // Best practices
        'uses-long-cache-ttl': ['warn', { minScore: 0.8 }],
        'uses-optimized-images': ['warn', { maxLength: 0 }],
        'uses-text-compression': ['warn', { maxLength: 0 }],
        'uses-responsive-images': ['warn', { maxLength: 0 }]
      }
    }
  },
  
  // Custom performance budgets
  budgets: [
    {
      path: '/',
      resourceSizes: [
        { resourceType: 'script', budget: 300 },
        { resourceType: 'stylesheet', budget: 150 },
        { resourceType: 'image', budget: 500 },
        { resourceType: 'media', budget: 0 },
        { resourceType: 'font', budget: 100 },
        { resourceType: 'other', budget: 100 },
        { resourceType: 'total', budget: 1200 }
      ],
      resourceCounts: [
        { resourceType: 'script', budget: 10 },
        { resourceType: 'stylesheet', budget: 5 },
        { resourceType: 'image', budget: 20 },
        { resourceType: 'font', budget: 5 },
        { resourceType: 'total', budget: 50 }
      ]
    },
    {
      path: '/chapters/enhanced/*',
      resourceSizes: [
        { resourceType: 'script', budget: 400 },
        { resourceType: 'stylesheet', budget: 200 },
        { resourceType: 'image', budget: 600 },
        { resourceType: 'total', budget: 1500 }
      ]
    }
  ],
  
  // Performance testing scenarios
  scenarios: {
    desktop: {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        }
      }
    },
    mobile: {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4
        },
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false
        }
      }
    },
    slow3g: {
      extends: 'lighthouse:default',
      settings: {
        throttling: {
          rttMs: 300,
          throughputKbps: 400,
          cpuSlowdownMultiplier: 4
        }
      }
    }
  }
};