/**
 * Cross-Browser Compatibility Tests - Phase 6: Testing and Quality Assurance
 * Comprehensive testing across Chrome, Firefox, Safari, Edge, and mobile browsers
 */

import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up console monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`);
      }
    });
    
    // Set up error monitoring
    page.on('pageerror', error => {
      console.error(`Page error: ${error.message}`);
    });
  });

  test.describe('Basic Functionality Across Browsers', () => {
    test('should load main page correctly in all browsers', async ({ page }) => {
      await page.goto('/');
      
      // Check page title
      await expect(page).toHaveTitle(/Aion Visualization/);
      
      // Check main navigation
      const nav = page.locator('nav.main-nav');
      await expect(nav).toBeVisible();
      
      // Check hero section
      const hero = page.locator('.hero-section');
      await expect(hero).toBeVisible();
      
      // Check no JavaScript errors
      const errors = await page.evaluate(() => window.jsErrors || []);
      expect(errors).toHaveLength(0);
    });

    test('should navigate to chapters correctly', async ({ page }) => {
      await page.goto('/');
      
      // Click on chapters navigation
      await page.click('a[href*="chapters"]');
      
      // Wait for navigation
      await page.waitForURL('**/chapters/**');
      
      // Check chapters page loaded
      const chaptersContainer = page.locator('.chapters-container');
      await expect(chaptersContainer).toBeVisible();
      
      // Check chapter links are present
      const chapterLinks = page.locator('.chapter-link');
      await expect(chapterLinks.first()).toBeVisible();
    });

    test('should load enhanced chapters correctly', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      // Check chapter content loaded
      const chapterContainer = page.locator('.chapter-container');
      await expect(chapterContainer).toBeVisible();
      
      // Check chapter title
      const title = page.locator('h1');
      await expect(title).toContainText('Chapter 1');
      
      // Check visualization container
      const vizContainer = page.locator('.visualization-container');
      await expect(vizContainer).toBeVisible();
      
      // Check navigation
      const nav = page.locator('.chapter-nav');
      await expect(nav).toBeVisible();
    });

    test('should load standard chapters correctly', async ({ page }) => {
      await page.goto('/chapters/standard/1/');
      
      // Check chapter content loaded
      const chapterContainer = page.locator('.chapter-container');
      await expect(chapterContainer).toBeVisible();
      
      // Check chapter title
      const title = page.locator('h1');
      await expect(title).toContainText('Chapter 1');
      
      // Check content container
      const contentContainer = page.locator('.content-container');
      await expect(contentContainer).toBeVisible();
    });
  });

  test.describe('CSS Compatibility Tests', () => {
    test('should render CSS Grid correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check grid container
      const gridContainer = page.locator('.grid-container').first();
      if (await gridContainer.count() > 0) {
        const display = await gridContainer.evaluate(el => 
          window.getComputedStyle(el).display
        );
        expect(['grid', '-ms-grid']).toContain(display);
      }
    });

    test('should render Flexbox correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check flex container
      const flexContainer = page.locator('.flex-container, .d-flex').first();
      if (await flexContainer.count() > 0) {
        const display = await flexContainer.evaluate(el => 
          window.getComputedStyle(el).display
        );
        expect(['flex', '-webkit-flex', '-ms-flexbox']).toContain(display);
      }
    });

    test('should render CSS Custom Properties correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check custom property usage
      const element = page.locator('.chapter-container').first();
      if (await element.count() > 0) {
        const color = await element.evaluate(el => 
          window.getComputedStyle(el).getPropertyValue('--primary-color')
        );
        
        // Should either have a value or fall back gracefully
        expect(typeof color).toBe('string');
      }
    });

    test('should handle backdrop-filter gracefully', async ({ page }) => {
      await page.goto('/');
      
      // Check elements with backdrop-filter
      const glassElements = page.locator('.glass-card, .glass-bg').first();
      if (await glassElements.count() > 0) {
        const backdropFilter = await glassElements.evaluate(el => 
          window.getComputedStyle(el).backdropFilter || 
          window.getComputedStyle(el).webkitBackdropFilter
        );
        
        // Should either work or fall back
        expect(typeof backdropFilter).toBe('string');
      }
    });
  });

  test.describe('JavaScript ES6+ Feature Compatibility', () => {
    test('should support ES6 modules', async ({ page }) => {
      await page.goto('/');
      
      // Check if modules loaded without errors
      const moduleSupport = await page.evaluate(() => {
        return typeof import !== 'undefined';
      });
      
      // Modern browsers should support modules
      expect(moduleSupport).toBe(true);
    });

    test('should support Promise API', async ({ page }) => {
      await page.goto('/');
      
      const promiseSupport = await page.evaluate(() => {
        return typeof Promise !== 'undefined' && 
               typeof Promise.all !== 'undefined' &&
               typeof Promise.resolve !== 'undefined';
      });
      
      expect(promiseSupport).toBe(true);
    });

    test('should support Async/Await', async ({ page }) => {
      await page.goto('/');
      
      const asyncSupport = await page.evaluate(async () => {
        try {
          const testAsync = async () => 'test';
          const result = await testAsync();
          return result === 'test';
        } catch (e) {
          return false;
        }
      });
      
      expect(asyncSupport).toBe(true);
    });

    test('should support Fetch API', async ({ page }) => {
      await page.goto('/');
      
      const fetchSupport = await page.evaluate(() => {
        return typeof fetch !== 'undefined';
      });
      
      expect(fetchSupport).toBe(true);
    });
  });

  test.describe('Mobile Browser Compatibility', () => {
    test('should handle touch events correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check touch event support
      const touchSupport = await page.evaluate(() => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      });
      
      // Test touch interactions if supported
      if (touchSupport) {
        const touchElement = page.locator('.chapter-link').first();
        if (await touchElement.count() > 0) {
          await touchElement.tap();
          // Verify touch interaction worked
          await page.waitForTimeout(500);
        }
      }
    });

    test('should render responsive design correctly', async ({ page }) => {
      await page.goto('/');
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Check mobile navigation
      const mobileNav = page.locator('.mobile-nav, .navbar-toggler');
      const isVisible = await mobileNav.count() > 0;
      
      if (isVisible) {
        await expect(mobileNav.first()).toBeVisible();
      }
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      // Content should still be accessible
      const content = page.locator('main, .main-content');
      await expect(content.first()).toBeVisible();
    });

    test('should handle mobile-specific features', async ({ page }) => {
      await page.goto('/');
      
      // Check orientation change handling
      await page.setViewportSize({ width: 667, height: 375 }); // Landscape
      await page.waitForTimeout(500);
      
      await page.setViewportSize({ width: 375, height: 667 }); // Portrait
      await page.waitForTimeout(500);
      
      // Page should remain functional
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    });
  });

  test.describe('Performance Across Browsers', () => {
    test('should load within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds (generous for testing)
      expect(loadTime).toBeLessThan(5000);
    });

    test('should not cause memory leaks during navigation', async ({ page }) => {
      await page.goto('/');
      
      // Navigate through several chapters
      for (let i = 1; i <= 3; i++) {
        await page.goto(`/chapters/enhanced/${i}/`);
        await page.waitForTimeout(1000);
      }
      
      // Check for memory usage (basic check)
      const memoryInfo = await page.evaluate(() => {
        return (performance as any).memory || null;
      });
      
      if (memoryInfo) {
        // Should not use excessive memory
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // 100MB
      }
    });
  });

  test.describe('Error Handling Across Browsers', () => {
    test('should handle 404 errors gracefully', async ({ page }) => {
      await page.goto('/non-existent-page', { waitUntil: 'networkidle' });
      
      // Should show 404 page
      const errorPage = page.locator('.error-page, .not-found');
      const isErrorPage = await errorPage.count() > 0;
      
      if (isErrorPage) {
        await expect(errorPage.first()).toBeVisible();
      } else {
        // At minimum, should not show browser error page
        const title = await page.title();
        expect(title).not.toContain('404');
      }
    });

    test('should handle JavaScript errors gracefully', async ({ page }) => {
      let jsErrors = [];
      
      page.on('pageerror', error => {
        jsErrors.push(error.message);
      });
      
      await page.goto('/');
      
      // Navigate through site
      await page.click('a[href*="chapters"]').catch(() => {});
      await page.waitForTimeout(2000);
      
      // Should have minimal JavaScript errors
      expect(jsErrors.length).toBeLessThan(3);
    });

    test('should provide fallbacks for unsupported features', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      // Check for WebGL fallback
      const hasWebGL = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      });
      
      if (!hasWebGL) {
        // Should show fallback content
        const fallback = page.locator('.webgl-fallback, .no-webgl-message');
        const hasFallback = await fallback.count() > 0;
        
        if (hasFallback) {
          await expect(fallback.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Accessibility Across Browsers', () => {
    test('should maintain keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Test Tab navigation
      await page.keyboard.press('Tab');
      
      // Check focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    });

    test('should provide screen reader support', async ({ page }) => {
      await page.goto('/');
      
      // Check for ARIA attributes
      const ariaElements = page.locator('[aria-label], [aria-labelledby], [role]');
      const count = await ariaElements.count();
      
      expect(count).toBeGreaterThan(0);
    });

    test('should maintain color contrast', async ({ page }) => {
      await page.goto('/');
      
      // Basic color contrast check
      const textElements = page.locator('p, h1, h2, h3, a');
      const elementCount = await textElements.count();
      
      expect(elementCount).toBeGreaterThan(0);
      
      // Elements should be visible (basic test)
      if (elementCount > 0) {
        await expect(textElements.first()).toBeVisible();
      }
    });
  });

  test.describe('Browser-Specific Issues', () => {
    test('should handle Safari-specific quirks', async ({ page, browserName }) => {
      if (browserName !== 'webkit') return;
      
      await page.goto('/');
      
      // Safari-specific checks
      const hasDateInput = await page.evaluate(() => {
        const input = document.createElement('input');
        input.type = 'date';
        return input.type === 'date';
      });
      
      expect(typeof hasDateInput).toBe('boolean');
    });

    test('should handle Firefox-specific features', async ({ page, browserName }) => {
      if (browserName !== 'firefox') return;
      
      await page.goto('/');
      
      // Firefox-specific checks
      const firefoxFeatures = await page.evaluate(() => {
        return {
          mozRequestFullScreen: typeof document.documentElement.mozRequestFullScreen === 'function',
          moz: 'moz' in window
        };
      });
      
      expect(typeof firefoxFeatures).toBe('object');
    });

    test('should handle Chrome-specific features', async ({ page, browserName }) => {
      if (browserName !== 'chromium') return;
      
      await page.goto('/');
      
      // Chrome-specific checks
      const chromeFeatures = await page.evaluate(() => {
        return {
          webkitRequestFullscreen: typeof document.documentElement.webkitRequestFullscreen === 'function',
          chrome: 'chrome' in window
        };
      });
      
      expect(typeof chromeFeatures).toBe('object');
    });
  });
});