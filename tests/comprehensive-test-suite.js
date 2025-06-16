/**
 * Comprehensive Test Suite for Aion Visualization
 * Tests navigation, visualizations, paths, and cross-platform compatibility
 */

const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  localUrl: 'http://localhost:8080',
  vercelUrl: process.env.VERCEL_URL || 'https://aion-visualization.vercel.app',
  githubPagesUrl: 'https://akshaybapat6365.github.io/aion-visualization',
  environments: ['local', 'vercel', 'github-pages'],
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ],
  browsers: ['chromium', 'firefox', 'webkit']
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  environments: {},
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Utility functions
async function startLocalServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('python3', ['-m', 'http.server', '8080'], {
      cwd: path.resolve(__dirname, '..')
    });
    
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Serving HTTP')) {
        resolve(server);
      }
    });
    
    server.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });
    
    setTimeout(() => resolve(server), 2000); // Fallback timeout
  });
}

async function getBaseUrl(environment) {
  switch (environment) {
    case 'local':
      return TEST_CONFIG.localUrl;
    case 'vercel':
      return TEST_CONFIG.vercelUrl;
    case 'github-pages':
      return TEST_CONFIG.githubPagesUrl;
    default:
      throw new Error(`Unknown environment: ${environment}`);
  }
}

// Test Categories

// 1. Navigation Tests
async function testNavigation(browser, baseUrl, environment) {
  console.log(`\n📍 Testing navigation for ${environment}...`);
  const results = [];
  
  const navigationPaths = [
    { path: '/', name: 'Home' },
    { path: '/chapters/', name: 'Chapters Index' },
    { path: '/chapters/enhanced/chapter-1.html', name: 'Chapter 1 Enhanced' },
    { path: '/chapters/standard/chapter-1.html', name: 'Chapter 1 Standard' },
    { path: '/visualizations.html', name: 'Visualizations' },
    { path: '/404.html', name: '404 Page' },
    { path: '/src/about.html', name: 'About' },
    { path: '/src/timeline.html', name: 'Timeline' },
    { path: '/src/symbols.html', name: 'Symbols' }
  ];
  
  for (const nav of navigationPaths) {
    try {
      const page = await browser.newPage();
      const url = baseUrl + nav.path;
      
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      const status = response.status();
      const title = await page.title();
      
      // Check for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Check for broken links
      const brokenLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        return links
          .map(link => link.href)
          .filter(href => href.includes('undefined') || href.includes('null'));
      });
      
      results.push({
        path: nav.path,
        name: nav.name,
        status,
        title,
        success: status === 200,
        consoleErrors,
        brokenLinks,
        url
      });
      
      await page.close();
    } catch (error) {
      results.push({
        path: nav.path,
        name: nav.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// 2. Visualization Tests
async function testVisualizations(browser, baseUrl, environment) {
  console.log(`\n🎨 Testing visualizations for ${environment}...`);
  const results = [];
  
  const visualizations = [
    '/src/visualizations/chapters/chapter-4-fish/fish-timeline-showcase.html',
    '/src/visualizations/shadow/shadow-demo.html',
    '/src/visualizations/constellation/anima-animus-demo.html',
    '/src/visualizations/cosmology/gnostic-map-demo.html',
    '/src/visualizations/alchemy/alchemy-lab-demo.html',
    '/src/visualizations/clock/aion-clock-demo.html'
  ];
  
  for (const viz of visualizations) {
    try {
      const page = await browser.newPage();
      
      // Enable WebGL error reporting
      await page.evaluateOnNewDocument(() => {
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          const context = originalGetContext.call(this, type, ...args);
          if (type === 'webgl' || type === 'webgl2') {
            if (!context) {
              window.WEBGL_ERROR = 'Failed to create WebGL context';
            }
          }
          return context;
        };
      });
      
      const response = await page.goto(baseUrl + viz, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Wait for visualization to load
      await page.waitForTimeout(2000);
      
      // Check WebGL status
      const webglStatus = await page.evaluate(() => {
        if (window.WEBGL_ERROR) return { supported: false, error: window.WEBGL_ERROR };
        
        const canvas = document.querySelector('canvas');
        if (!canvas) return { supported: false, error: 'No canvas element found' };
        
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        return {
          supported: !!gl,
          renderer: gl ? gl.getParameter(gl.RENDERER) : null,
          vendor: gl ? gl.getParameter(gl.VENDOR) : null
        };
      });
      
      // Check for Three.js errors
      const threejsErrors = await page.evaluate(() => {
        return window.THREE ? null : 'Three.js not loaded';
      });
      
      // Take screenshot
      const screenshotPath = path.join(__dirname, `../test-results/screenshots/${environment}-${path.basename(viz, '.html')}.png`);
      await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath });
      
      results.push({
        visualization: viz,
        status: response.status(),
        success: response.status() === 200 && webglStatus.supported,
        webgl: webglStatus,
        threejsError: threejsErrors,
        screenshot: screenshotPath
      });
      
      await page.close();
    } catch (error) {
      results.push({
        visualization: viz,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// 3. Asset Loading Tests
async function testAssetLoading(browser, baseUrl, environment) {
  console.log(`\n📦 Testing asset loading for ${environment}...`);
  const results = [];
  
  const page = await browser.newPage();
  
  // Track all network requests
  const assetRequests = [];
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('.css') || url.includes('.js') || url.includes('.png') || 
        url.includes('.jpg') || url.includes('.svg') || url.includes('.woff')) {
      assetRequests.push({
        url,
        status,
        type: path.extname(url).substring(1),
        size: response.headers()['content-length']
      });
    }
  });
  
  await page.goto(baseUrl + '/', { waitUntil: 'networkidle2' });
  
  // Categorize results
  const failedAssets = assetRequests.filter(r => r.status >= 400);
  const slowAssets = assetRequests.filter(r => parseInt(r.size) > 500000); // > 500KB
  
  results.push({
    totalAssets: assetRequests.length,
    failedAssets,
    slowAssets,
    assetsByType: assetRequests.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {})
  });
  
  await page.close();
  return results;
}

// 4. Performance Tests
async function testPerformance(baseUrl, environment) {
  console.log(`\n⚡ Testing performance for ${environment}...`);
  
  const chrome = await puppeteer.launch({ headless: true });
  
  const runnerResult = await lighthouse(baseUrl + '/', {
    port: (new URL(chrome.wsEndpoint())).port,
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
  });
  
  await chrome.close();
  
  const { categories } = runnerResult.lhr;
  
  return {
    scores: {
      performance: categories.performance.score * 100,
      accessibility: categories.accessibility.score * 100,
      bestPractices: categories['best-practices'].score * 100,
      seo: categories.seo.score * 100
    },
    metrics: {
      firstContentfulPaint: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
      largestContentfulPaint: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
      totalBlockingTime: runnerResult.lhr.audits['total-blocking-time'].numericValue,
      cumulativeLayoutShift: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue
    }
  };
}

// 5. Cross-Browser Tests
async function testCrossBrowser(baseUrl, environment) {
  console.log(`\n🌐 Testing cross-browser compatibility for ${environment}...`);
  const results = {};
  
  // Test with different browser engines using Playwright
  const playwright = require('playwright');
  
  for (const browserType of ['chromium', 'firefox', 'webkit']) {
    try {
      const browser = await playwright[browserType].launch();
      const page = await browser.newPage();
      
      await page.goto(baseUrl + '/');
      
      // Check if critical elements render
      const criticalElements = await page.evaluate(() => {
        return {
          navigation: !!document.querySelector('nav'),
          mainContent: !!document.querySelector('main'),
          visualizations: !!document.querySelector('.visualization-container'),
          styles: window.getComputedStyle(document.body).backgroundColor !== ''
        };
      });
      
      results[browserType] = {
        success: true,
        elements: criticalElements
      };
      
      await browser.close();
    } catch (error) {
      results[browserType] = {
        success: false,
        error: error.message
      };
    }
  }
  
  return results;
}

// 6. API and External Resource Tests
async function testExternalResources(baseUrl, environment) {
  console.log(`\n🌍 Testing external resources for ${environment}...`);
  const results = [];
  
  const externalResources = [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'
  ];
  
  for (const resource of externalResources) {
    try {
      const response = await axios.head(resource);
      results.push({
        resource,
        status: response.status,
        success: response.status === 200,
        headers: {
          contentType: response.headers['content-type'],
          cacheControl: response.headers['cache-control']
        }
      });
    } catch (error) {
      results.push({
        resource,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// 7. Mobile Responsiveness Tests
async function testMobileResponsiveness(browser, baseUrl, environment) {
  console.log(`\n📱 Testing mobile responsiveness for ${environment}...`);
  const results = [];
  
  for (const viewport of TEST_CONFIG.viewports) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    
    await page.goto(baseUrl + '/');
    
    // Check if navigation is usable
    const navigationUsability = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) return { usable: false, reason: 'No navigation found' };
      
      const links = nav.querySelectorAll('a');
      const navHeight = nav.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      return {
        usable: navHeight < viewportHeight * 0.2, // Nav shouldn't take more than 20% of viewport
        linkCount: links.length,
        navHeight,
        viewportHeight
      };
    });
    
    // Check text readability
    const textReadability = await page.evaluate(() => {
      const body = document.body;
      const fontSize = parseInt(window.getComputedStyle(body).fontSize);
      const lineHeight = parseInt(window.getComputedStyle(body).lineHeight);
      
      return {
        fontSize,
        lineHeight,
        readable: fontSize >= 14 && lineHeight >= fontSize * 1.4
      };
    });
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, `../test-results/responsive/${environment}-${viewport.name}.png`);
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    results.push({
      viewport: viewport.name,
      dimensions: `${viewport.width}x${viewport.height}`,
      navigation: navigationUsability,
      textReadability,
      screenshot: screenshotPath
    });
    
    await page.close();
  }
  
  return results;
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Comprehensive Test Suite for Aion Visualization\n');
  
  let localServer = null;
  
  try {
    // Start local server if testing locally
    if (TEST_CONFIG.environments.includes('local')) {
      console.log('Starting local server...');
      localServer = await startLocalServer();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for server to be ready
    }
    
    // Run tests for each environment
    for (const environment of TEST_CONFIG.environments) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Testing ${environment.toUpperCase()} environment`);
      console.log(`${'='.repeat(50)}`);
      
      const baseUrl = await getBaseUrl(environment);
      testResults.environments[environment] = {};
      
      // Launch browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      try {
        // Run all test categories
        testResults.environments[environment].navigation = await testNavigation(browser, baseUrl, environment);
        testResults.environments[environment].visualizations = await testVisualizations(browser, baseUrl, environment);
        testResults.environments[environment].assetLoading = await testAssetLoading(browser, baseUrl, environment);
        testResults.environments[environment].performance = await testPerformance(baseUrl, environment);
        testResults.environments[environment].crossBrowser = await testCrossBrowser(baseUrl, environment);
        testResults.environments[environment].externalResources = await testExternalResources(baseUrl, environment);
        testResults.environments[environment].mobileResponsiveness = await testMobileResponsiveness(browser, baseUrl, environment);
        
      } catch (error) {
        console.error(`Error testing ${environment}:`, error);
        testResults.environments[environment].error = error.message;
      } finally {
        await browser.close();
      }
    }
    
    // Generate summary
    generateSummary();
    
    // Save results
    await saveResults();
    
    // Print summary
    printSummary();
    
  } finally {
    // Clean up
    if (localServer) {
      localServer.kill();
    }
  }
}

function generateSummary() {
  for (const [env, results] of Object.entries(testResults.environments)) {
    // Navigation summary
    if (results.navigation) {
      const navPassed = results.navigation.filter(r => r.success).length;
      const navTotal = results.navigation.length;
      testResults.summary.passed += navPassed;
      testResults.summary.failed += navTotal - navPassed;
    }
    
    // Visualization summary
    if (results.visualizations) {
      const vizPassed = results.visualizations.filter(r => r.success).length;
      const vizTotal = results.visualizations.length;
      testResults.summary.passed += vizPassed;
      testResults.summary.failed += vizTotal - vizPassed;
    }
    
    // Add more summaries as needed
  }
}

async function saveResults() {
  const resultsPath = path.join(__dirname, '../test-results/comprehensive-test-results.json');
  await fs.mkdir(path.dirname(resultsPath), { recursive: true });
  await fs.writeFile(resultsPath, JSON.stringify(testResults, null, 2));
  
  // Generate HTML report
  const htmlReport = generateHTMLReport();
  const htmlPath = path.join(__dirname, '../test-results/test-report.html');
  await fs.writeFile(htmlPath, htmlReport);
}

function generateHTMLReport() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>Aion Visualization Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .success { color: green; }
        .failure { color: red; }
        .warning { color: orange; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .section { margin: 30px 0; }
        .summary { background: #f0f0f0; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Aion Visualization Test Report</h1>
    <p>Generated: ${testResults.timestamp}</p>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: ${testResults.summary.passed + testResults.summary.failed}</p>
        <p class="success">Passed: ${testResults.summary.passed}</p>
        <p class="failure">Failed: ${testResults.summary.failed}</p>
    </div>
    
    ${Object.entries(testResults.environments).map(([env, results]) => `
        <div class="section">
            <h2>${env.toUpperCase()} Environment</h2>
            
            <h3>Navigation Tests</h3>
            <table>
                <tr><th>Page</th><th>Status</th><th>Title</th><th>Console Errors</th></tr>
                ${results.navigation ? results.navigation.map(nav => `
                    <tr>
                        <td>${nav.name}</td>
                        <td class="${nav.success ? 'success' : 'failure'}">${nav.status || nav.error}</td>
                        <td>${nav.title || '-'}</td>
                        <td>${nav.consoleErrors ? nav.consoleErrors.length : 0}</td>
                    </tr>
                `).join('') : '<tr><td colspan="4">No navigation tests run</td></tr>'}
            </table>
            
            <h3>Visualization Tests</h3>
            <table>
                <tr><th>Visualization</th><th>Status</th><th>WebGL</th><th>Three.js</th></tr>
                ${results.visualizations ? results.visualizations.map(viz => `
                    <tr>
                        <td>${path.basename(viz.visualization)}</td>
                        <td class="${viz.success ? 'success' : 'failure'}">${viz.success ? 'Pass' : 'Fail'}</td>
                        <td>${viz.webgl ? viz.webgl.supported ? 'Supported' : viz.webgl.error : '-'}</td>
                        <td>${viz.threejsError || 'Loaded'}</td>
                    </tr>
                `).join('') : '<tr><td colspan="4">No visualization tests run</td></tr>'}
            </table>
            
            <h3>Performance Scores</h3>
            ${results.performance ? `
                <table>
                    <tr><th>Metric</th><th>Score</th></tr>
                    <tr><td>Performance</td><td class="${results.performance.scores.performance > 80 ? 'success' : 'warning'}">${results.performance.scores.performance.toFixed(1)}</td></tr>
                    <tr><td>Accessibility</td><td class="${results.performance.scores.accessibility > 80 ? 'success' : 'warning'}">${results.performance.scores.accessibility.toFixed(1)}</td></tr>
                    <tr><td>Best Practices</td><td class="${results.performance.scores.bestPractices > 80 ? 'success' : 'warning'}">${results.performance.scores.bestPractices.toFixed(1)}</td></tr>
                    <tr><td>SEO</td><td class="${results.performance.scores.seo > 80 ? 'success' : 'warning'}">${results.performance.scores.seo.toFixed(1)}</td></tr>
                </table>
            ` : '<p>No performance tests run</p>'}
        </div>
    `).join('')}
</body>
</html>`;
}

function printSummary() {
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${testResults.summary.passed + testResults.summary.failed}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${testResults.summary.warnings}`);
  
  console.log('\n📁 Results saved to:');
  console.log('  - test-results/comprehensive-test-results.json');
  console.log('  - test-results/test-report.html');
  console.log('  - test-results/screenshots/');
  console.log('  - test-results/responsive/');
}

// Export for use as module
module.exports = {
  runTests,
  testNavigation,
  testVisualizations,
  testAssetLoading,
  testPerformance,
  testCrossBrowser,
  testExternalResources,
  testMobileResponsiveness
};

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}