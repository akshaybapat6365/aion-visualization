/**
 * E2E Tests for Premium Features
 * Tests liquid morphing, magnetic cursor, and visualizations
 */

import { test, expect } from '@playwright/test';

test.describe('Premium Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Liquid Morphing Transitions', () => {
    test('should show liquid transition on navigation', async ({ page }) => {
      // Click a link with morph transition
      await page.click('a[data-transition="morph"]');
      
      // Check if morph overlay appears
      const morphOverlay = await page.locator('.liquid-morph-overlay');
      await expect(morphOverlay).toBeVisible();
      
      // Wait for animation to complete
      await page.waitForTimeout(300);
      
      // Overlay should be hidden after animation
      await expect(morphOverlay).toBeHidden();
    });

    test('should apply correct animation classes', async ({ page }) => {
      const morphOverlay = await page.locator('.liquid-morph-overlay');
      
      // Trigger transition
      await page.evaluate(() => {
        window.liquidMorph?.transition();
      });
      
      // Check for enter animation class
      await expect(morphOverlay).toHaveClass(/liquid-morph-enter/);
      
      // Wait and check for exit animation
      await page.waitForTimeout(150);
      await expect(morphOverlay).toHaveClass(/liquid-morph-exit/);
    });
  });

  test.describe('Magnetic Cursor', () => {
    test('should hide default cursor and show custom cursor', async ({ page }) => {
      // Check if default cursor is hidden
      const cursorStyle = await page.evaluate(() => 
        getComputedStyle(document.documentElement).cursor
      );
      expect(cursorStyle).toBe('none');
      
      // Check if custom cursor exists
      const customCursor = await page.locator('.magnetic-cursor');
      await expect(customCursor).toBeVisible();
    });

    test('should follow mouse movement', async ({ page }) => {
      const cursor = await page.locator('.magnetic-cursor');
      
      // Move mouse to specific position
      await page.mouse.move(100, 100);
      await page.waitForTimeout(100);
      
      // Check cursor position
      const transform = await cursor.evaluate(el => el.style.transform);
      expect(transform).toContain('translate(100px, 100px)');
    });

    test('should attract to magnetic elements', async ({ page }) => {
      // Create a magnetic button
      await page.evaluate(() => {
        const button = document.createElement('button');
        button.className = 'magnetic-element';
        button.textContent = 'Test Button';
        button.style.cssText = 'position: fixed; top: 200px; left: 200px;';
        document.body.appendChild(button);
      });
      
      // Move mouse near button
      await page.mouse.move(180, 180);
      await page.waitForTimeout(100);
      
      // Check if cursor has hovering class
      const cursor = await page.locator('.magnetic-cursor');
      await expect(cursor).toHaveClass(/hovering/);
    });
  });

  test.describe('Navigation', () => {
    test('should have all navigation links', async ({ page }) => {
      const navLinks = await page.locator('.nav-link').count();
      expect(navLinks).toBeGreaterThanOrEqual(6);
    });

    test('should navigate to chapters', async ({ page }) => {
      await page.click('a[href="/chapters/"]');
      await expect(page).toHaveURL(/\/chapters\//);
    });

    test('should show chapter cards', async ({ page }) => {
      await page.goto('/chapters/');
      const chapterCards = await page.locator('.chapter-card').count();
      expect(chapterCards).toBe(14);
    });
  });

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(2000); // Under 2 seconds
    });

    test('should have optimized bundle', async ({ page }) => {
      const response = await page.goto('/');
      const html = await response.text();
      
      expect(html).toContain('bundle.min.css');
      expect(html).toContain('minimalist-background.min.css');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      const nav = await page.locator('nav[role="navigation"]');
      await expect(nav).toHaveAttribute('aria-label');
      
      const main = await page.locator('main[role="main"]');
      await expect(main).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if element is focused
      const focusedElement = await page.evaluate(() => 
        document.activeElement.tagName
      );
      expect(focusedElement).toBe('A');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check if navigation is mobile-friendly
      const nav = await page.locator('.nav');
      const isVisible = await nav.isVisible();
      expect(isVisible).toBe(true);
    });

    test('should hide magnetic cursor on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const cursor = await page.locator('.magnetic-cursor');
      const display = await cursor.evaluate(el => 
        getComputedStyle(el).display
      );
      expect(display).toBe('none');
    });
  });
});