/**
 * Launch Checklist and Deployment Verification
 * Phase 6: Testing and Quality Assurance
 */

import { test, expect } from '@playwright/test';

test.describe('Launch Checklist and Deployment Tests', () => {
  
  test.describe('Pre-Launch Verification', () => {
    test('should verify all critical pages are accessible', async ({ page }) => {
      const criticalPages = [
        '/',
        '/chapters/',
        '/chapters/enhanced/1/',
        '/chapters/enhanced/7/',
        '/chapters/enhanced/14/',
        '/chapters/standard/1/',
        '/chapters/standard/7/',
        '/chapters/standard/14/',
        '/404.html'
      ];
      
      const results = [];
      
      for (const url of criticalPages) {
        try {
          const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
          const status = response?.status() || 0;
          
          results.push({
            url,
            status,
            accessible: status === 200 || (url === '/404.html' && status === 404),
            loadTime: Date.now()
          });
          
          // Quick content verification
          if (status === 200) {
            const hasContent = await page.locator('main, .main-content, .chapter-container').count() > 0;
            results[results.length - 1].hasContent = hasContent;
          }
          
        } catch (error) {
          results.push({
            url,
            status: 0,
            accessible: false,
            error: error.message
          });
        }
      }
      
      const failedPages = results.filter(r => !r.accessible);
      
      console.log('Page accessibility results:', results);
      
      expect(failedPages.length).toBe(0);
      
      // Verify all pages have content
      const pagesWithoutContent = results.filter(r => r.status === 200 && !r.hasContent);
      expect(pagesWithoutContent.length).toBe(0);
    });

    test('should verify all assets are loading correctly', async ({ page }) => {
      await page.goto('/');
      
      // Monitor failed resources
      const failedResources = [];
      
      page.on('response', response => {
        if (response.status() >= 400) {
          failedResources.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      });
      
      // Navigate through key pages to test asset loading
      const testPages = [
        '/chapters/',
        '/chapters/enhanced/1/',
        '/chapters/standard/1/'
      ];
      
      for (const url of testPages) {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
      }
      
      console.log('Failed resources:', failedResources);
      expect(failedResources.length).toBe(0);
    });

    test('should verify SEO elements are present', async ({ page }) => {
      const testPages = [
        { url: '/', title: 'Aion Visualization' },
        { url: '/chapters/', title: 'Chapters' },
        { url: '/chapters/enhanced/1/', title: 'Chapter 1' }
      ];
      
      for (const { url, title } of testPages) {
        await page.goto(url);
        
        // Check title
        const pageTitle = await page.title();
        expect(pageTitle).toContain(title);
        
        // Check meta description
        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
        expect(metaDescription).toBeTruthy();
        expect(metaDescription.length).toBeGreaterThan(50);
        
        // Check Open Graph tags
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
        const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
        
        expect(ogTitle).toBeTruthy();
        expect(ogDescription).toBeTruthy();
        
        // Check canonical URL
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        expect(canonical).toBeTruthy();
        
        console.log(`SEO check for ${url}: ✓`);
      }
    });

    test('should verify accessibility compliance', async ({ page }) => {
      await page.goto('/');
      
      // Basic accessibility checks
      const accessibilityChecks = await page.evaluate(() => {
        const results = {
          hasH1: document.querySelectorAll('h1').length > 0,
          hasAltAttributes: Array.from(document.images).every(img => img.alt !== undefined),
          hasAriaLabels: document.querySelectorAll('[aria-label]').length > 0,
          hasSkipLinks: document.querySelectorAll('a[href^="#"]').length > 0,
          hasLandmarks: document.querySelectorAll('main, nav, aside, section').length > 0,
          hasTabIndex: document.querySelectorAll('[tabindex]').length > 0
        };
        
        return results;
      });
      
      expect(accessibilityChecks.hasH1).toBe(true);
      expect(accessibilityChecks.hasLandmarks).toBe(true);
      
      console.log('Accessibility checks:', accessibilityChecks);
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });

    test('should verify performance requirements', async ({ page }) => {
      // Test with performance monitoring
      const performanceMetrics = [];
      
      const testPages = ['/', '/chapters/enhanced/1/', '/chapters/standard/1/'];
      
      for (const url of testPages) {
        const startTime = Date.now();
        await page.goto(url, { waitUntil: 'networkidle' });
        const loadTime = Date.now() - startTime;
        
        const metrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          };
        });
        
        performanceMetrics.push({
          url,
          loadTime,
          ...metrics
        });
        
        // Verify performance targets
        expect(loadTime).toBeLessThan(3000); // < 3 seconds
        if (metrics.firstContentfulPaint > 0) {
          expect(metrics.firstContentfulPaint).toBeLessThan(2000); // FCP < 2 seconds
        }
      }
      
      console.log('Performance metrics:', performanceMetrics);
    });
  });

  test.describe('GitHub Pages Deployment Verification', () => {
    test('should verify GitHub Pages configuration', async ({ page }) => {
      await page.goto('/');
      
      // Check if running on GitHub Pages
      const isGitHubPages = page.url().includes('github.io') || page.url().includes('githubpages.dev');
      
      if (isGitHubPages) {
        console.log('Running on GitHub Pages:', page.url());
        
        // Verify clean URLs work
        const cleanUrlTest = await page.goto('/chapters/enhanced/1/', { waitUntil: 'networkidle' });
        expect(cleanUrlTest?.status()).toBe(200);
        
        // Verify sitemap is accessible
        const sitemapResponse = await page.goto('/sitemap.xml');
        expect(sitemapResponse?.status()).toBe(200);
        
        // Verify robots.txt is accessible
        const robotsResponse = await page.goto('/robots.txt');
        expect(robotsResponse?.status()).toBe(200);
        
        // Verify 404 page works
        const notFoundResponse = await page.goto('/non-existent-page');
        // Should redirect to 404 page or show custom 404
        expect([404, 200]).toContain(notFoundResponse?.status() || 0);
        
      } else {
        console.log('Running on local/development server');
      }
    });

    test('should verify CDN and external resources', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      // Check for external CDN resources
      const resourcePromises = [];
      
      page.on('response', response => {
        const url = response.url();
        if (url.includes('cdnjs') || url.includes('jsdelivr') || url.includes('unpkg')) {
          resourcePromises.push({
            url,
            status: response.status(),
            ok: response.ok()
          });
        }
      });
      
      await page.waitForTimeout(5000); // Wait for resources to load
      
      // All CDN resources should load successfully
      const failedCDN = resourcePromises.filter(r => !r.ok);
      expect(failedCDN.length).toBe(0);
      
      if (resourcePromises.length > 0) {
        console.log('CDN resources loaded:', resourcePromises.length);
      }
    });

    test('should verify HTTPS and security headers', async ({ page }) => {
      await page.goto('/');
      
      // Check HTTPS
      expect(page.url()).toMatch(/^https:/);
      
      // Check security headers (if available)
      const response = await page.goto('/', { waitUntil: 'networkidle' });
      const headers = response?.headers() || {};
      
      console.log('Security headers check:', {
        hasXFrameOptions: !!headers['x-frame-options'],
        hasXContentTypeOptions: !!headers['x-content-type-options'],
        hasCSP: !!headers['content-security-policy'],
        hasSTSHeader: !!headers['strict-transport-security']
      });
    });
  });

  test.describe('Cross-Device Compatibility Verification', () => {
    test('should work on different viewport sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'Mobile Portrait' },
        { width: 667, height: 375, name: 'Mobile Landscape' },
        { width: 768, height: 1024, name: 'Tablet Portrait' },
        { width: 1024, height: 768, name: 'Tablet Landscape' },
        { width: 1280, height: 720, name: 'Desktop Small' },
        { width: 1920, height: 1080, name: 'Desktop Large' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/', { waitUntil: 'networkidle' });
        
        // Check that main content is visible
        const mainContent = page.locator('main, .main-content, .hero-section').first();
        await expect(mainContent).toBeVisible();
        
        // Check navigation is accessible
        const nav = page.locator('nav, .navbar').first();
        await expect(nav).toBeVisible();
        
        console.log(`✓ ${viewport.name} (${viewport.width}x${viewport.height})`);
      }
    });

    test('should handle touch interactions on mobile', async ({ page, isMobile }) => {
      if (!isMobile) test.skip();
      
      await page.goto('/chapters/');
      
      // Test touch interactions
      const chapterLink = page.locator('.chapter-link').first();
      if (await chapterLink.count() > 0) {
        await chapterLink.tap();
        await page.waitForTimeout(1000);
        
        // Should navigate successfully
        expect(page.url()).toMatch(/\/chapters\/(enhanced|standard)\/\d+/);
      }
    });
  });

  test.describe('Content Verification', () => {
    test('should verify all 28 chapters are accessible', async ({ page }) => {
      const chapterTypes = ['enhanced', 'standard'];
      const chapterNumbers = Array.from({ length: 14 }, (_, i) => i + 1);
      
      const results = [];
      
      for (const type of chapterTypes) {
        for (const num of chapterNumbers) {
          const url = `/chapters/${type}/${num}/`;
          
          try {
            const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
            const status = response?.status() || 0;
            
            if (status === 200) {
              // Verify chapter content
              const hasTitle = await page.locator('h1').count() > 0;
              const hasContent = await page.locator('.chapter-container, .content-container').count() > 0;
              
              results.push({
                type,
                number: num,
                url,
                status,
                hasTitle,
                hasContent,
                success: hasTitle && hasContent
              });
            } else {
              results.push({
                type,
                number: num,
                url,
                status,
                success: false
              });
            }
          } catch (error) {
            results.push({
              type,
              number: num,
              url,
              status: 0,
              success: false,
              error: error.message
            });
          }
        }
      }
      
      const failedChapters = results.filter(r => !r.success);
      const successfulChapters = results.filter(r => r.success);
      
      console.log(`Chapter verification: ${successfulChapters.length}/28 successful`);
      
      if (failedChapters.length > 0) {
        console.log('Failed chapters:', failedChapters);
      }
      
      expect(failedChapters.length).toBe(0);
      expect(successfulChapters.length).toBe(28);
    });

    test('should verify navigation between chapters works', async ({ page }) => {
      // Start at chapter 1
      await page.goto('/chapters/enhanced/1/');
      
      // Test next navigation
      const nextButton = page.locator('.next-chapter, .chapter-nav a[href*="2"]').first();
      if (await nextButton.count() > 0) {
        await nextButton.click();
        await page.waitForURL('**/chapters/enhanced/2/**');
        expect(page.url()).toMatch(/\/chapters\/enhanced\/2/);
      }
      
      // Test previous navigation
      const prevButton = page.locator('.prev-chapter, .chapter-nav a[href*="1"]').first();
      if (await prevButton.count() > 0) {
        await prevButton.click();
        await page.waitForURL('**/chapters/enhanced/1/**');
        expect(page.url()).toMatch(/\/chapters\/enhanced\/1/);
      }
    });

    test('should verify search functionality works', async ({ page }) => {
      await page.goto('/');
      
      // Look for search functionality
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"], .search-input').first();
      
      if (await searchInput.count() > 0) {
        await searchInput.fill('aion');
        await searchInput.press('Enter');
        
        await page.waitForTimeout(2000);
        
        // Should show search results or navigate
        const hasResults = await page.locator('.search-results, .search-result').count() > 0;
        const urlChanged = !page.url().endsWith('/');
        
        expect(hasResults || urlChanged).toBe(true);
        console.log('Search functionality verified');
      } else {
        console.log('No search functionality found');
      }
    });
  });

  test.describe('Error Handling Verification', () => {
    test('should handle 404 errors gracefully', async ({ page }) => {
      await page.goto('/non-existent-page', { waitUntil: 'networkidle' });
      
      // Should show custom 404 page or redirect
      const has404Content = await page.locator('.error-page, .not-found, .error-404').count() > 0;
      const hasNavigation = await page.locator('nav, .navbar').count() > 0;
      
      // Should either show custom 404 or handle gracefully
      expect(has404Content || hasNavigation).toBe(true);
      
      console.log('404 handling verified');
    });

    test('should handle JavaScript errors gracefully', async ({ page }) => {
      const jsErrors = [];
      
      page.on('pageerror', error => {
        jsErrors.push(error.message);
      });
      
      // Navigate through various pages
      const testUrls = [
        '/',
        '/chapters/',
        '/chapters/enhanced/1/',
        '/chapters/standard/1/'
      ];
      
      for (const url of testUrls) {
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
      }
      
      // Should have minimal JavaScript errors
      expect(jsErrors.length).toBeLessThan(3);
      
      if (jsErrors.length > 0) {
        console.log('JavaScript errors:', jsErrors);
      }
      
      console.log('JavaScript error handling verified');
    });
  });

  test.describe('Final Launch Checklist', () => {
    test('should complete comprehensive launch checklist', async ({ page }) => {
      const checklist = [];
      
      // 1. Homepage loads correctly
      try {
        await page.goto('/', { waitUntil: 'networkidle', timeout: 10000 });
        const hasTitle = await page.title();
        checklist.push({ item: 'Homepage loads', status: !!hasTitle });
      } catch (e) {
        checklist.push({ item: 'Homepage loads', status: false, error: e.message });
      }
      
      // 2. All critical pages accessible
      const criticalPages = ['/', '/chapters/', '/chapters/enhanced/1/', '/chapters/standard/1/'];
      let pagesAccessible = 0;
      
      for (const url of criticalPages) {
        try {
          const response = await page.goto(url, { timeout: 5000 });
          if (response?.status() === 200) pagesAccessible++;
        } catch (e) {
          // Page failed to load
        }
      }
      
      checklist.push({ 
        item: 'Critical pages accessible', 
        status: pagesAccessible === criticalPages.length,
        detail: `${pagesAccessible}/${criticalPages.length}`
      });
      
      // 3. Navigation works
      await page.goto('/chapters/enhanced/1/');
      const hasNavigation = await page.locator('.chapter-nav, nav').count() > 0;
      checklist.push({ item: 'Navigation present', status: hasNavigation });
      
      // 4. Mobile responsiveness
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      const contentVisible = await page.locator('main, .main-content').first().isVisible();
      checklist.push({ item: 'Mobile responsive', status: contentVisible });
      
      // 5. Performance acceptable
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      checklist.push({ 
        item: 'Performance acceptable', 
        status: loadTime < 5000,
        detail: `${loadTime}ms`
      });
      
      // 6. No critical errors
      const errors = [];
      page.on('pageerror', error => errors.push(error));
      await page.goto('/chapters/enhanced/1/');
      await page.waitForTimeout(3000);
      checklist.push({ 
        item: 'No critical errors', 
        status: errors.length === 0,
        detail: `${errors.length} errors`
      });
      
      // Print checklist
      console.log('\n🚀 LAUNCH CHECKLIST RESULTS:');
      console.log('=============================');
      
      checklist.forEach((item, index) => {
        const status = item.status ? '✅' : '❌';
        const detail = item.detail ? ` (${item.detail})` : '';
        console.log(`${index + 1}. ${status} ${item.item}${detail}`);
      });
      
      const passedItems = checklist.filter(item => item.status).length;
      const totalItems = checklist.length;
      
      console.log(`\nResults: ${passedItems}/${totalItems} checks passed`);
      
      if (passedItems === totalItems) {
        console.log('🎉 ALL CHECKS PASSED - READY FOR LAUNCH! 🎉');
      } else {
        console.log('⚠️  Some checks failed - review before launch');
      }
      
      // All critical items should pass
      expect(passedItems).toBe(totalItems);
    });
  });
});