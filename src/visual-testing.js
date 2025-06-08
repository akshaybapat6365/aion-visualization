/**
 * Visual Testing with OCR Verification
 * Ensures all features are rendering correctly and match design specifications
 */

import puppeteer from 'puppeteer';
import tesseract from 'tesseract.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VisualTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  async initialize() {
    console.log('🚀 Starting Visual Testing Suite...\n');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser Error:', msg.text());
      }
    });
  }

  async runAllTests() {
    const baseUrl = 'http://localhost:8080'; // Adjust as needed
    
    // Test Suite
    const tests = [
      { name: 'Homepage Visual Test', url: '/', checks: this.homepageChecks },
      { name: 'Loading States Test', url: '/polish-test.html', checks: this.loadingStateChecks },
      { name: 'Showcase Features Test', url: '/showcase.html', checks: this.showcaseChecks },
      { name: 'Chapter Navigation Test', url: '/chapters/', checks: this.chapterChecks },
      { name: 'Error Handling Test', url: '/polish-test.html', checks: this.errorHandlingChecks },
      { name: 'Performance Test', url: '/', checks: this.performanceChecks }
    ];

    for (const test of tests) {
      console.log(`\n📋 Running: ${test.name}`);
      console.log('═'.repeat(50));
      
      try {
        await this.page.goto(baseUrl + test.url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // Wait for initial animations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Run test checks
        const results = await test.checks.call(this);
        
        // Take screenshot
        const screenshotPath = path.join(__dirname, `../test-results/${test.name.replace(/\s+/g, '-')}.png`);
        await this.page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        
        // Perform OCR on screenshot
        const ocrResults = await this.performOCR(screenshotPath);
        
        // Analyze results
        this.analyzeTestResults(test.name, results, ocrResults);
        
      } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        this.results.failed++;
        this.results.tests.push({
          name: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    await this.generateReport();
  }

  // Homepage visual checks
  async homepageChecks() {
    const checks = [];
    
    // Check hero section
    const heroTitle = await this.page.$eval('.hero-title', el => ({
      text: el.textContent,
      fontSize: window.getComputedStyle(el).fontSize,
      color: window.getComputedStyle(el).color
    }));
    
    checks.push({
      name: 'Hero Title',
      expected: 'Aion',
      actual: heroTitle.text,
      passed: heroTitle.text === 'Aion'
    });
    
    // Check navigation
    const navLinks = await this.page.$$eval('.nav-link', links => 
      links.map(link => ({
        text: link.textContent,
        href: link.href
      }))
    );
    
    checks.push({
      name: 'Navigation Links',
      expected: 6,
      actual: navLinks.length,
      passed: navLinks.length >= 6
    });
    
    // Check WebGL canvas
    const canvasExists = await this.page.$('#webgl-canvas') !== null;
    checks.push({
      name: 'WebGL Background',
      expected: true,
      actual: canvasExists,
      passed: canvasExists
    });
    
    // Check loading container
    const loaderExists = await this.page.$('#global-loader') !== null;
    checks.push({
      name: 'Global Loader',
      expected: true,
      actual: loaderExists,
      passed: loaderExists
    });
    
    // Check buttons
    const buttons = await this.page.$$eval('.button', btns => btns.length);
    checks.push({
      name: 'Action Buttons',
      expected: 3,
      actual: buttons,
      passed: buttons >= 3
    });
    
    return checks;
  }

  // Loading states checks
  async loadingStateChecks() {
    const checks = [];
    
    // Test chapter loader
    await this.page.click('button[onclick="testChapterLoader()"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const chapterLoader = await this.page.$('.chapter-loader');
    checks.push({
      name: 'Chapter Loader Display',
      expected: true,
      actual: chapterLoader !== null,
      passed: chapterLoader !== null
    });
    
    // Test visualization loader
    await this.page.click('button[onclick="testVizLoader()"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const vizLoader = await this.page.$('.viz-loader');
    checks.push({
      name: 'Visualization Loader Display',
      expected: true,
      actual: vizLoader !== null,
      passed: vizLoader !== null
    });
    
    return checks;
  }

  // Showcase feature checks
  async showcaseChecks() {
    const checks = [];
    
    // Check magnetic buttons
    const magneticButtons = await this.page.$$('.magnetic-button');
    checks.push({
      name: 'Magnetic Buttons',
      expected: 4,
      actual: magneticButtons.length,
      passed: magneticButtons.length === 4
    });
    
    // Check liquid transitions
    const liquidBoxes = await this.page.$$('.transition-box');
    checks.push({
      name: 'Liquid Transition Boxes',
      expected: 3,
      actual: liquidBoxes.length,
      passed: liquidBoxes.length === 3
    });
    
    // Test interaction
    if (liquidBoxes.length > 0) {
      await liquidBoxes[0].click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const hasActiveClass = await this.page.$('.liquid-morph-active');
      checks.push({
        name: 'Liquid Morph Activation',
        expected: true,
        actual: hasActiveClass !== null,
        passed: hasActiveClass !== null
      });
    }
    
    return checks;
  }

  // Chapter navigation checks
  async chapterChecks() {
    const checks = [];
    
    // Check chapter cards
    const chapterCards = await this.page.$$('.chapter-card');
    checks.push({
      name: 'Chapter Cards',
      expected: 14,
      actual: chapterCards.length,
      passed: chapterCards.length === 14
    });
    
    // Check chapter numbers
    const chapterNumbers = await this.page.$$eval('.chapter-card-number', 
      nums => nums.map(n => n.textContent)
    );
    
    const allNumbersCorrect = chapterNumbers.every((num, i) => 
      num === String(i + 1).padStart(2, '0')
    );
    
    checks.push({
      name: 'Chapter Numbering',
      expected: true,
      actual: allNumbersCorrect,
      passed: allNumbersCorrect
    });
    
    return checks;
  }

  // Error handling checks
  async errorHandlingChecks() {
    const checks = [];
    
    // Test toast error
    await this.page.click('button[onclick="testToastError()"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const toastError = await this.page.$('.toast-error');
    checks.push({
      name: 'Toast Error Display',
      expected: true,
      actual: toastError !== null,
      passed: toastError !== null
    });
    
    return checks;
  }

  // Performance checks
  async performanceChecks() {
    const checks = [];
    
    // Measure page load performance
    const metrics = await this.page.metrics();
    
    checks.push({
      name: 'DOM Nodes Count',
      expected: '< 1500',
      actual: metrics.Nodes,
      passed: metrics.Nodes < 1500,
      warning: metrics.Nodes > 1000
    });
    
    checks.push({
      name: 'JS Heap Size',
      expected: '< 50MB',
      actual: `${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)}MB`,
      passed: metrics.JSHeapUsedSize < 50 * 1024 * 1024
    });
    
    // Check bundle loading
    const bundleLoaded = await this.page.evaluate(() => {
      const bundleCSS = document.querySelector('link[href*="bundle.min.css"]');
      return bundleCSS !== null;
    });
    
    checks.push({
      name: 'Optimized Bundle',
      expected: true,
      actual: bundleLoaded,
      passed: bundleLoaded
    });
    
    return checks;
  }

  // Perform OCR on screenshot
  async performOCR(imagePath) {
    console.log('\n🔍 Performing OCR analysis...');
    
    try {
      const { data: { text, confidence } } = await tesseract.recognize(
        imagePath,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              process.stdout.write(`\r   Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );
      
      console.log(`\n   ✅ OCR Confidence: ${confidence}%`);
      
      // Check for key text elements
      const expectedTexts = [
        'Aion',
        'Visual Journey',
        'Jung',
        'Chapters',
        'Interactive'
      ];
      
      const foundTexts = expectedTexts.filter(expected => 
        text.toLowerCase().includes(expected.toLowerCase())
      );
      
      return {
        text,
        confidence,
        foundKeywords: foundTexts,
        totalKeywords: expectedTexts.length
      };
      
    } catch (error) {
      console.error('OCR Error:', error);
      return null;
    }
  }

  // Analyze test results
  analyzeTestResults(testName, checks, ocrResults) {
    const passed = checks.filter(c => c.passed).length;
    const failed = checks.filter(c => !c.passed).length;
    const warnings = checks.filter(c => c.warning).length;
    
    console.log(`\n📊 Results for ${testName}:`);
    console.log(`   ✅ Passed: ${passed}/${checks.length}`);
    
    if (failed > 0) {
      console.log(`   ❌ Failed: ${failed}`);
      checks.filter(c => !c.passed).forEach(check => {
        console.log(`      - ${check.name}: expected ${check.expected}, got ${check.actual}`);
      });
    }
    
    if (warnings > 0) {
      console.log(`   ⚠️  Warnings: ${warnings}`);
    }
    
    if (ocrResults) {
      console.log(`   📝 OCR: Found ${ocrResults.foundKeywords.length}/${ocrResults.totalKeywords} keywords`);
      console.log(`      Keywords: ${ocrResults.foundKeywords.join(', ')}`);
    }
    
    // Update totals
    this.results.passed += passed;
    this.results.failed += failed;
    this.results.warnings += warnings;
    
    this.results.tests.push({
      name: testName,
      passed,
      failed,
      warnings,
      checks,
      ocrResults,
      status: failed === 0 ? 'passed' : 'failed'
    });
  }

  // Generate final report
  async generateReport() {
    console.log('\n\n📑 VISUAL TESTING REPORT');
    console.log('═'.repeat(60));
    
    const totalTests = this.results.tests.length;
    const passedTests = this.results.tests.filter(t => t.status === 'passed').length;
    
    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed Tests: ${passedTests}`);
    console.log(`   Failed Tests: ${totalTests - passedTests}`);
    console.log(`   Total Checks: ${this.results.passed + this.results.failed}`);
    console.log(`   Passed Checks: ${this.results.passed}`);
    console.log(`   Failed Checks: ${this.results.failed}`);
    console.log(`   Warnings: ${this.results.warnings}`);
    
    const passRate = ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(2);
    console.log(`\n   🎯 Pass Rate: ${passRate}%`);
    
    // Quality assessment
    console.log('\n📈 Quality Assessment:');
    if (passRate >= 95) {
      console.log('   ⭐ EXCELLENT - All major features working correctly');
    } else if (passRate >= 85) {
      console.log('   ✅ GOOD - Most features working, minor issues detected');
    } else if (passRate >= 70) {
      console.log('   ⚠️  FAIR - Several issues need attention');
    } else {
      console.log('   ❌ POOR - Significant issues detected');
    }
    
    // Create test results directory
    const resultsDir = path.join(__dirname, '../test-results');
    await fs.mkdir(resultsDir, { recursive: true });
    
    // Save detailed report
    const reportPath = path.join(resultsDir, 'visual-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Recommendations
    if (this.results.failed > 0) {
      console.log('\n💡 Recommendations:');
      console.log('   1. Review failed checks in the detailed report');
      console.log('   2. Check browser console for JavaScript errors');
      console.log('   3. Verify all assets are loading correctly');
      console.log('   4. Test with different viewport sizes');
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.runAllTests();
    } catch (error) {
      console.error('Fatal error:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Export for use in other scripts
export default VisualTester;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎨 Aion Visualization - Visual Testing Suite');
  console.log('━'.repeat(60));
  console.log('\nNOTE: Make sure the site is running on localhost:8080\n');
  
  const tester = new VisualTester();
  tester.run();
}