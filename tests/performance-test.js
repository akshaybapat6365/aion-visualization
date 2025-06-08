/**
 * Performance Testing Suite
 * Measures and validates performance metrics for premium features
 */

import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PerformanceTest {
  constructor() {
    this.browser = null;
    this.results = {
      metrics: {},
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async testPage(url, name) {
    console.log(`\n📊 Testing ${name}...`);
    const page = await this.browser.newPage();
    
    // Enable performance metrics
    await page.evaluateOnNewDocument(() => {
      window.performanceMetrics = {
        startTime: Date.now(),
        resources: [],
        animations: [],
        errors: []
      };
      
      // Track resource loading
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.performanceMetrics.resources.push({
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize || 0
          });
        }
      });
      observer.observe({ entryTypes: ['resource'] });
      
      // Track animations
      let frameCount = 0;
      let lastTime = performance.now();
      const measureFPS = () => {
        frameCount++;
        const currentTime = performance.now();
        if (currentTime >= lastTime + 1000) {
          window.performanceMetrics.animations.push({
            fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
            time: currentTime
          });
          frameCount = 0;
          lastTime = currentTime;
        }
        if (currentTime < 5000) {
          requestAnimationFrame(measureFPS);
        }
      };
      requestAnimationFrame(measureFPS);
    });
    
    // Navigate and measure
    const startTime = Date.now();
    
    try {
      await page.goto(`http://localhost:8080${url}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
    } catch (error) {
      console.error(`❌ Failed to load ${name}:`, error.message);
      return null;
    }
    
    const loadTime = Date.now() - startTime;
    
    // Wait for animations to settle
    await page.waitForTimeout(2000);
    
    // Collect metrics
    const metrics = await page.metrics();
    const performanceMetrics = await page.evaluate(() => window.performanceMetrics);
    
    // Get bundle sizes
    const coverage = await page.coverage.startCSSCoverage();
    await page.coverage.startJSCoverage();
    await page.reload({ waitUntil: 'networkidle2' });
    const cssCoverage = await page.coverage.stopCSSCoverage();
    const jsCoverage = await page.coverage.stopJSCoverage();
    
    // Calculate unused code
    let totalCSS = 0, usedCSS = 0;
    cssCoverage.forEach(entry => {
      totalCSS += entry.text.length;
      entry.ranges.forEach(range => {
        usedCSS += range.end - range.start;
      });
    });
    
    let totalJS = 0, usedJS = 0;
    jsCoverage.forEach(entry => {
      totalJS += entry.text.length;
      entry.ranges.forEach(range => {
        usedJS += range.end - range.start;
      });
    });
    
    // Performance timing
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        domComplete: nav.domComplete - nav.domInteractive,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    await page.close();
    
    return {
      name,
      loadTime,
      metrics: {
        JSHeapUsedSize: (metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2) + ' MB',
        Documents: metrics.Documents,
        Nodes: metrics.Nodes,
        LayoutCount: metrics.LayoutCount,
        RecalcStyleCount: metrics.RecalcStyleCount
      },
      timing,
      coverage: {
        cssUsage: ((usedCSS / totalCSS) * 100).toFixed(2) + '%',
        jsUsage: ((usedJS / totalJS) * 100).toFixed(2) + '%',
        totalCSS: (totalCSS / 1024).toFixed(2) + ' KB',
        totalJS: (totalJS / 1024).toFixed(2) + ' KB'
      },
      resources: performanceMetrics.resources.length,
      avgFPS: performanceMetrics.animations.length > 0 
        ? Math.round(performanceMetrics.animations.reduce((a, b) => a + b.fps, 0) / performanceMetrics.animations.length)
        : 0
    };
  }

  analyzeResults(result) {
    const tests = [];
    
    // Load time test
    tests.push({
      name: 'Page Load Time',
      expected: '< 2000ms',
      actual: result.loadTime + 'ms',
      passed: result.loadTime < 2000
    });
    
    // Memory usage test
    const heapSize = parseFloat(result.metrics.JSHeapUsedSize);
    tests.push({
      name: 'Memory Usage',
      expected: '< 50 MB',
      actual: result.metrics.JSHeapUsedSize,
      passed: heapSize < 50
    });
    
    // DOM nodes test
    tests.push({
      name: 'DOM Nodes',
      expected: '< 1500',
      actual: result.metrics.Nodes,
      passed: result.metrics.Nodes < 1500
    });
    
    // FPS test
    tests.push({
      name: 'Animation FPS',
      expected: '> 30',
      actual: result.avgFPS,
      passed: result.avgFPS > 30
    });
    
    // First Contentful Paint
    tests.push({
      name: 'First Contentful Paint',
      expected: '< 1500ms',
      actual: result.timing.firstContentfulPaint.toFixed(0) + 'ms',
      passed: result.timing.firstContentfulPaint < 1500
    });
    
    // Code usage
    const cssUsage = parseFloat(result.coverage.cssUsage);
    tests.push({
      name: 'CSS Usage',
      expected: '> 50%',
      actual: result.coverage.cssUsage,
      passed: cssUsage > 50
    });
    
    return tests;
  }

  async runAllTests() {
    console.log('🚀 Performance Testing Suite\n');
    console.log('Testing against performance criteria:');
    console.log('- Page Load: < 2s');
    console.log('- Memory: < 50MB');
    console.log('- FPS: > 30');
    console.log('- DOM Nodes: < 1500');
    
    await this.init();
    
    const pages = [
      { url: '/', name: 'Homepage' },
      { url: '/chapters/', name: 'Chapters Index' },
      { url: '/showcase.html', name: 'Showcase' },
      { url: '/premium-test.html', name: 'Premium Features' }
    ];
    
    for (const page of pages) {
      const result = await this.testPage(page.url, page.name);
      if (result) {
        const tests = this.analyzeResults(result);
        
        console.log(`\nResults for ${page.name}:`);
        console.log('─'.repeat(50));
        
        tests.forEach(test => {
          const status = test.passed ? '✅' : '❌';
          console.log(`${status} ${test.name}: ${test.actual} (expected ${test.expected})`);
          
          if (test.passed) this.results.passed++;
          else this.results.failed++;
        });
        
        console.log(`\n📊 Additional Metrics:`);
        console.log(`   Resources loaded: ${result.resources}`);
        console.log(`   CSS bundle: ${result.coverage.totalCSS}`);
        console.log(`   JS bundle: ${result.coverage.totalJS}`);
        console.log(`   Layout count: ${result.metrics.LayoutCount}`);
        console.log(`   Style recalculations: ${result.metrics.RecalcStyleCount}`);
        
        this.results.tests.push({
          page: page.name,
          result,
          tests
        });
      }
    }
    
    await this.browser.close();
    
    // Generate report
    await this.generateReport();
  }

  async generateReport() {
    console.log('\n\n📑 PERFORMANCE TEST REPORT');
    console.log('═'.repeat(60));
    
    const totalTests = this.results.passed + this.results.failed;
    const passRate = ((this.results.passed / totalTests) * 100).toFixed(2);
    
    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${this.results.passed}`);
    console.log(`   Failed: ${this.results.failed}`);
    console.log(`   Pass Rate: ${passRate}%`);
    
    // Performance grade
    let grade = 'F';
    if (passRate >= 95) grade = 'A+';
    else if (passRate >= 90) grade = 'A';
    else if (passRate >= 85) grade = 'B+';
    else if (passRate >= 80) grade = 'B';
    else if (passRate >= 75) grade = 'C+';
    else if (passRate >= 70) grade = 'C';
    else if (passRate >= 65) grade = 'D';
    
    console.log(`\n🏆 Performance Grade: ${grade}`);
    
    // Recommendations
    if (this.results.failed > 0) {
      console.log('\n💡 Recommendations:');
      
      this.results.tests.forEach(test => {
        test.tests.forEach(t => {
          if (!t.passed) {
            if (t.name === 'Page Load Time') {
              console.log('   - Optimize bundle sizes and enable caching');
            } else if (t.name === 'Memory Usage') {
              console.log('   - Review memory leaks and optimize data structures');
            } else if (t.name === 'Animation FPS') {
              console.log('   - Reduce animation complexity or use CSS transforms');
            } else if (t.name === 'DOM Nodes') {
              console.log('   - Implement virtual scrolling or lazy loading');
            }
          }
        });
      });
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'performance-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run tests
const tester = new PerformanceTest();
tester.runAllTests().catch(console.error);