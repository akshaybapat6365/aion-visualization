/**
 * Playwright Configuration for Cross-Browser Testing
 * Phase 6: Testing and Quality Assurance
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/cross-browser',
  
  // Timeout configuration
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  
  // Global setup and teardown
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),
  
  // Parallel testing
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'tests/reports/playwright' }],
    ['json', { outputFile: 'tests/reports/playwright-results.json' }],
    ['junit', { outputFile: 'tests/reports/playwright-results.xml' }]
  ],
  
  // Global test configuration
  use: {
    baseURL: 'http://localhost:3000',
    
    // Browser context options
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Device settings
    viewport: { width: 1280, height: 720 },
    
    // Performance settings
    permissions: ['geolocation', 'notifications'],
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'America/New_York'
  },

  // Browser configurations
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--enable-webgl',
            '--enable-accelerated-2d-canvas',
            '--enable-gpu-rasterization'
          ]
        }
      },
      testMatch: '**/*.{test,spec}.{js,ts}'
    },
    
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'webgl.force-enabled': true,
            'layers.acceleration.force-enabled': true
          }
        }
      },
      testMatch: '**/*.{test,spec}.{js,ts}'
    },
    
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: {
          args: ['--enable-webgl']
        }
      },
      testMatch: '**/*.{test,spec}.{js,ts}'
    },
    
    {
      name: 'edge-desktop',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
        launchOptions: {
          args: [
            '--enable-webgl',
            '--enable-accelerated-2d-canvas'
          ]
        }
      },
      testMatch: '**/*.{test,spec}.{js,ts}'
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        launchOptions: {
          args: ['--enable-webgl-draft-extensions']
        }
      },
      testMatch: '**/mobile/*.{test,spec}.{js,ts}'
    },
    
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
      testMatch: '**/mobile/*.{test,spec}.{js,ts}'
    },
    
    {
      name: 'mobile-samsung',
      use: {
        ...devices['Galaxy S9+'],
      },
      testMatch: '**/mobile/*.{test,spec}.{js,ts}'
    },

    // Tablet testing
    {
      name: 'tablet-ipad',
      use: {
        ...devices['iPad Pro'],
      },
      testMatch: '**/tablet/*.{test,spec}.{js,ts}'
    },

    // Legacy browser simulation
    {
      name: 'legacy-chrome',
      use: {
        ...devices['Desktop Chrome'],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        viewport: { width: 1024, height: 768 }
      },
      testMatch: '**/legacy/*.{test,spec}.{js,ts}'
    },

    // High DPI testing
    {
      name: 'high-dpi',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: '**/high-dpi/*.{test,spec}.{js,ts}'
    },

    // WebGL specific testing
    {
      name: 'webgl-testing',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--enable-webgl',
            '--enable-webgl2',
            '--enable-webgl-draft-extensions',
            '--enable-accelerated-2d-canvas',
            '--enable-gpu-rasterization',
            '--enable-zero-copy'
          ]
        }
      },
      testMatch: '**/webgl/*.{test,spec}.{js,ts}'
    }
  ],

  // Development server configuration
  webServer: {
    command: 'npm run serve',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  // Test configuration
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**'
  ],

  // Metadata
  metadata: {
    testType: 'cross-browser',
    environment: process.env.NODE_ENV || 'test',
    version: '1.0.0'
  }
});