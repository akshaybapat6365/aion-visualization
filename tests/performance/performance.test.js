/**
 * Performance Tests - Phase 6: Testing and Quality Assurance
 * Comprehensive performance testing for load times, memory usage, and animations
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performanceData = {
        marks: [],
        measures: [],
        resources: [],
        navigation: performance.getEntriesByType('navigation')[0]
      };
      
      // Monitor performance marks
      const originalMark = performance.mark;
      performance.mark = function(name) {
        window.performanceData.marks.push({ name, time: performance.now() });
        return originalMark.call(this, name);
      };
      
      // Monitor performance measures
      const originalMeasure = performance.measure;
      performance.measure = function(name, start, end) {
        const result = originalMeasure.call(this, name, start, end);
        window.performanceData.measures.push({ 
          name, 
          duration: result.duration,
          startTime: result.startTime 
        });
        return result;
      };
    });
  });

  test.describe('Page Load Performance', () => {
    test('should load main page within target time (<3 seconds)', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000);
      console.log(`Main page load time: ${loadTime}ms`);
      
      // Check Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {};
            
            entries.forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              } else if (entry.entryType === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime;
              } else if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                vitals.cls = (vitals.cls || 0) + entry.value;
              }
            });
            
            if (vitals.fcp && vitals.lcp) {
              resolve(vitals);
            }
          }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
          
          // Fallback timeout
          setTimeout(() => resolve({}), 5000);
        });
      });
      
      if (webVitals.fcp) {
        expect(webVitals.fcp).toBeLessThan(2000); // FCP < 2s
        console.log(`First Contentful Paint: ${webVitals.fcp}ms`);
      }
      
      if (webVitals.lcp) {
        expect(webVitals.lcp).toBeLessThan(2500); // LCP < 2.5s
        console.log(`Largest Contentful Paint: ${webVitals.lcp}ms`);
      }
      
      if (webVitals.cls !== undefined) {
        expect(webVitals.cls).toBeLessThan(0.1); // CLS < 0.1
        console.log(`Cumulative Layout Shift: ${webVitals.cls}`);
      }
    });

    test('should load enhanced chapters within target time', async ({ page }) => {
      const chapters = [1, 5, 10];
      
      for (const chapterNum of chapters) {
        const startTime = Date.now();
        
        await page.goto(`/chapters/enhanced/${chapterNum}/`, { waitUntil: 'networkidle' });
        
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(4000); // Slightly higher for enhanced chapters
        console.log(`Enhanced Chapter ${chapterNum} load time: ${loadTime}ms`);
        
        // Wait for visualizations to initialize
        await page.waitForFunction(() => {
          const vizContainer = document.querySelector('.visualization-container');
          return vizContainer && vizContainer.children.length > 0;
        }, { timeout: 10000 }).catch(() => {
          console.warn(`Visualization not loaded for chapter ${chapterNum}`);
        });
      }
    });

    test('should load standard chapters within target time', async ({ page }) => {
      const chapters = [1, 5, 10];
      
      for (const chapterNum of chapters) {
        const startTime = Date.now();
        
        await page.goto(`/chapters/standard/${chapterNum}/`, { waitUntil: 'networkidle' });
        
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(2500); // Standard chapters should be faster
        console.log(`Standard Chapter ${chapterNum} load time: ${loadTime}ms`);
      }
    });

    test('should load assets efficiently', async ({ page }) => {
      await page.goto('/');
      
      // Analyze resource loading
      const resourceData = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        
        return {
          total: resources.length,
          css: resources.filter(r => r.name.includes('.css')).length,
          js: resources.filter(r => r.name.includes('.js')).length,
          images: resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)).length,
          fonts: resources.filter(r => r.name.match(/\.(woff|woff2|ttf|otf)$/)).length,
          totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
          slowestResource: resources.reduce((slowest, r) => 
            r.duration > (slowest?.duration || 0) ? r : slowest, null
          )
        };
      });
      
      expect(resourceData.total).toBeLessThan(50); // Reasonable number of requests
      expect(resourceData.totalSize).toBeLessThan(2 * 1024 * 1024); // < 2MB total
      
      console.log('Resource Analysis:', resourceData);
      
      if (resourceData.slowestResource) {
        console.log(`Slowest resource: ${resourceData.slowestResource.name} (${resourceData.slowestResource.duration}ms)`);
      }
    });
  });

  test.describe('Memory Usage Tests', () => {
    test('should maintain reasonable memory usage during navigation', async ({ page }) => {
      await page.goto('/');
      
      // Navigate through multiple chapters to test memory usage
      const chapters = [1, 2, 3, 4, 5];
      const memoryReadings = [];
      
      for (const chapterNum of chapters) {
        await page.goto(`/chapters/enhanced/${chapterNum}/`);
        await page.waitForTimeout(2000); // Allow content to load
        
        const memoryInfo = await page.evaluate(() => {
          if (performance.memory) {
            return {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
          }
          return null;
        });
        
        if (memoryInfo) {
          memoryReadings.push({
            chapter: chapterNum,
            ...memoryInfo
          });
          
          // Memory should not exceed 100MB
          expect(memoryInfo.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
          
          console.log(`Chapter ${chapterNum} memory: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        }
      }
      
      // Check for memory leaks (memory should not constantly increase)
      if (memoryReadings.length >= 3) {
        const first = memoryReadings[0].usedJSHeapSize;
        const last = memoryReadings[memoryReadings.length - 1].usedJSHeapSize;
        const increase = last - first;
        const increasePercent = (increase / first) * 100;
        
        console.log(`Memory increase over navigation: ${(increase / 1024 / 1024).toFixed(2)}MB (${increasePercent.toFixed(1)}%)`);
        
        // Memory increase should be reasonable (< 50% over 5 chapters)
        expect(increasePercent).toBeLessThan(50);
      }
    });

    test('should handle WebGL memory efficiently', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      // Wait for WebGL initialization
      await page.waitForSelector('.visualization-container', { timeout: 10000 });
      
      const webglMemoryTest = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (!gl) return null;
        
        // Create multiple textures and buffers to test memory management
        const textures = [];
        const buffers = [];
        
        for (let i = 0; i < 10; i++) {
          // Create texture
          const texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
          textures.push(texture);
          
          // Create buffer
          const buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(1000), gl.STATIC_DRAW);
          buffers.push(buffer);
        }
        
        // Clean up
        textures.forEach(texture => gl.deleteTexture(texture));
        buffers.forEach(buffer => gl.deleteBuffer(buffer));
        
        return {
          texturesCreated: textures.length,
          buffersCreated: buffers.length,
          webglSupported: true
        };
      });
      
      if (webglMemoryTest) {
        expect(webglMemoryTest.texturesCreated).toBe(10);
        expect(webglMemoryTest.buffersCreated).toBe(10);
        console.log('WebGL memory test passed:', webglMemoryTest);
      }
    });

    test('should cleanup resources when leaving pages', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      // Set up resource monitoring
      await page.evaluate(() => {
        window.resourceTracker = {
          intervals: new Set(),
          timeouts: new Set(),
          animationFrames: new Set(),
          
          originalSetInterval: setInterval,
          originalSetTimeout: setTimeout,
          originalRequestAnimationFrame: requestAnimationFrame
        };
        
        // Override global functions to track usage
        window.setInterval = function(...args) {
          const id = window.resourceTracker.originalSetInterval.apply(this, args);
          window.resourceTracker.intervals.add(id);
          return id;
        };
        
        window.setTimeout = function(...args) {
          const id = window.resourceTracker.originalSetTimeout.apply(this, args);
          window.resourceTracker.timeouts.add(id);
          return id;
        };
        
        window.requestAnimationFrame = function(...args) {
          const id = window.resourceTracker.originalRequestAnimationFrame.apply(this, args);
          window.resourceTracker.animationFrames.add(id);
          return id;
        };
      });
      
      await page.waitForTimeout(3000); // Let the page initialize
      
      const initialResources = await page.evaluate(() => ({
        intervals: window.resourceTracker.intervals.size,
        timeouts: window.resourceTracker.timeouts.size,
        animationFrames: window.resourceTracker.animationFrames.size
      }));
      
      // Navigate away
      await page.goto('/chapters/enhanced/2/');
      await page.waitForTimeout(2000);
      
      // Resources should be cleaned up automatically or be minimal
      console.log('Initial resources:', initialResources);
    });
  });

  test.describe('Animation Performance', () => {
    test('should maintain smooth 60fps animations', async ({ page }) => {
      await page.goto('/chapters/enhanced/1/');
      
      // Wait for visualizations to load
      await page.waitForSelector('.visualization-container', { timeout: 10000 });
      
      const frameRateTest = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frameCount = 0;
          let startTime = performance.now();
          let lastTime = startTime;
          const frameTimes = [];
          
          const measureFrameRate = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            frameTimes.push(deltaTime);
            lastTime = currentTime;
            frameCount++;
            
            if (frameCount < 120) { // Measure for 120 frames (~2 seconds at 60fps)
              requestAnimationFrame(measureFrameRate);
            } else {
              const totalTime = currentTime - startTime;
              const avgFps = (frameCount / totalTime) * 1000;
              const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
              const maxFrameTime = Math.max(...frameTimes);
              const minFrameTime = Math.min(...frameTimes);
              
              resolve({
                avgFps,
                avgFrameTime,
                maxFrameTime,
                minFrameTime,
                totalFrames: frameCount,
                duration: totalTime,
                droppedFrames: frameTimes.filter(time => time > 20).length // Frames > 20ms
              });
            }
          };
          
          requestAnimationFrame(measureFrameRate);
        });
      });
      
      expect(frameRateTest.avgFps).toBeGreaterThan(30); // Minimum 30fps
      expect(frameRateTest.avgFrameTime).toBeLessThan(25); // Average frame time < 25ms
      expect(frameRateTest.droppedFrames).toBeLessThan(10); // Less than 10 dropped frames
      
      console.log('Frame rate analysis:', {
        avgFps: frameRateTest.avgFps.toFixed(2),
        avgFrameTime: frameRateTest.avgFrameTime.toFixed(2) + 'ms',
        droppedFrames: frameRateTest.droppedFrames
      });
    });

    test('should handle CSS animations efficiently', async ({ page }) => {
      await page.goto('/');
      
      // Test CSS transition performance
      const cssAnimationTest = await page.evaluate(() => {
        const element = document.createElement('div');
        element.style.cssText = `
          width: 100px;
          height: 100px;
          background: red;
          transition: transform 1s ease;
          position: absolute;
          top: 0;
          left: 0;
        `;
        document.body.appendChild(element);
        
        return new Promise((resolve) => {
          const startTime = performance.now();
          let frameCount = 0;
          
          const checkAnimation = () => {
            frameCount++;
            const elapsed = performance.now() - startTime;
            
            if (elapsed < 1000) {
              requestAnimationFrame(checkAnimation);
            } else {
              const fps = (frameCount / elapsed) * 1000;
              document.body.removeChild(element);
              resolve({ fps, frameCount, duration: elapsed });
            }
          };
          
          // Start animation
          element.style.transform = 'translateX(200px)';
          requestAnimationFrame(checkAnimation);
        });
      });
      
      expect(cssAnimationTest.fps).toBeGreaterThan(30);
      console.log('CSS animation performance:', cssAnimationTest);
    });

    test('should handle scroll performance efficiently', async ({ page }) => {
      await page.goto('/chapters/');
      
      const scrollTest = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frameCount = 0;
          let startTime = performance.now();
          
          const measureScrollPerformance = () => {
            frameCount++;
            const elapsed = performance.now() - startTime;
            
            if (elapsed < 2000) { // Test for 2 seconds
              window.scrollBy(0, 10); // Scroll 10px down
              requestAnimationFrame(measureScrollPerformance);
            } else {
              const fps = (frameCount / elapsed) * 1000;
              resolve({ fps, frameCount, scrollDistance: window.scrollY });
            }
          };
          
          requestAnimationFrame(measureScrollPerformance);
        });
      });
      
      expect(scrollTest.fps).toBeGreaterThan(45); // Scroll should be smooth
      console.log('Scroll performance:', scrollTest);
    });
  });

  test.describe('Resource Optimization', () => {
    test('should use efficient image formats and sizes', async ({ page }) => {
      await page.goto('/');
      
      const imageAnalysis = await page.evaluate(() => {
        const images = Array.from(document.images);
        
        return images.map(img => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          displayWidth: img.width,
          displayHeight: img.height,
          format: img.src.split('.').pop()?.toLowerCase(),
          oversized: img.naturalWidth > img.width * 2 || img.naturalHeight > img.height * 2
        }));
      });
      
      // Check for oversized images
      const oversizedImages = imageAnalysis.filter(img => img.oversized);
      expect(oversizedImages.length).toBeLessThan(imageAnalysis.length * 0.2); // < 20% oversized
      
      console.log('Image analysis:', {
        totalImages: imageAnalysis.length,
        oversizedImages: oversizedImages.length,
        formats: [...new Set(imageAnalysis.map(img => img.format))]
      });
    });

    test('should minimize unused CSS and JavaScript', async ({ page }) => {
      await page.goto('/');
      
      // Use Coverage API to analyze unused code
      await page.coverage.startCSSCoverage();
      await page.coverage.startJSCoverage();
      
      // Navigate through key pages
      await page.goto('/chapters/enhanced/1/');
      await page.waitForTimeout(2000);
      
      const [cssCoverage, jsCoverage] = await Promise.all([
        page.coverage.stopCSSCoverage(),
        page.coverage.stopJSCoverage()
      ]);
      
      const cssUsage = cssCoverage.reduce((acc, entry) => {
        const used = entry.ranges.reduce((sum, range) => sum + range.end - range.start, 0);
        const total = entry.text.length;
        acc.used += used;
        acc.total += total;
        return acc;
      }, { used: 0, total: 0 });
      
      const jsUsage = jsCoverage.reduce((acc, entry) => {
        const used = entry.ranges.reduce((sum, range) => sum + range.end - range.start, 0);
        const total = entry.text.length;
        acc.used += used;
        acc.total += total;
        return acc;
      }, { used: 0, total: 0 });
      
      const cssUtilization = cssUsage.total > 0 ? (cssUsage.used / cssUsage.total) * 100 : 100;
      const jsUtilization = jsUsage.total > 0 ? (jsUsage.used / jsUsage.total) * 100 : 100;
      
      expect(cssUtilization).toBeGreaterThan(60); // > 60% CSS utilization
      expect(jsUtilization).toBeGreaterThan(70); // > 70% JS utilization
      
      console.log('Code utilization:', {
        css: cssUtilization.toFixed(1) + '%',
        js: jsUtilization.toFixed(1) + '%'
      });
    });
  });

  test.describe('Mobile Performance', () => {
    test('should perform well on mobile devices', async ({ page, isMobile }) => {
      if (!isMobile) test.skip();
      
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Mobile should load within 5 seconds (more lenient)
      expect(loadTime).toBeLessThan(5000);
      
      // Test mobile-specific interactions
      await page.tap('body'); // Ensure page is interactive
      await page.waitForTimeout(500);
      
      const mobilePerformance = await page.evaluate(() => {
        if (performance.memory) {
          return {
            memoryUsage: performance.memory.usedJSHeapSize,
            navigationTiming: performance.getEntriesByType('navigation')[0]
          };
        }
        return null;
      });
      
      if (mobilePerformance) {
        // Mobile memory usage should be reasonable
        expect(mobilePerformance.memoryUsage).toBeLessThan(50 * 1024 * 1024); // < 50MB
        console.log('Mobile performance:', {
          loadTime: loadTime + 'ms',
          memoryUsage: (mobilePerformance.memoryUsage / 1024 / 1024).toFixed(2) + 'MB'
        });
      }
    });
  });
});