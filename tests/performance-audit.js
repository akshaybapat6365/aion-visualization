/**
 * Performance Audit Script
 * Runs Lighthouse and custom performance tests
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

const URLS_TO_TEST = [
  'http://localhost:8080/',
  'http://localhost:8080/chapters/',
  'http://localhost:8080/showcase.html',
  'http://localhost:8080/chapters/chapter1.html'
];

const PERFORMANCE_BUDGET = {
  'first-contentful-paint': 800,      // Target: <0.8s
  'largest-contentful-paint': 2500,    // Target: <2.5s
  'cumulative-layout-shift': 0.1,      // Target: <0.1
  'total-blocking-time': 300,          // Target: <300ms
  'speed-index': 2000,                 // Target: <2s
  'time-to-interactive': 1500,         // Target: <1.5s
};

async function launchChrome() {
  return await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });
}

async function runLighthouse(url, chrome) {
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
    budgets: [{
      path: '/*',
      resourceSizes: [
        { resourceType: 'script', budget: 200 },     // 200KB JS
        { resourceType: 'stylesheet', budget: 50 },   // 50KB CSS
        { resourceType: 'image', budget: 500 },       // 500KB images
        { resourceType: 'total', budget: 1000 },      // 1MB total
      ],
      resourceCounts: [
        { resourceType: 'script', budget: 10 },
        { resourceType: 'stylesheet', budget: 5 },
      ],
    }]
  };

  const config = require('./lighthouse-config.js');
  const runnerResult = await lighthouse(url, options, config);
  
  return runnerResult.lhr;
}

async function analyzeBundleSize() {
  const distPath = path.join(__dirname, '../dist');
  const files = await fs.readdir(distPath).catch(() => []);
  
  let totalSize = 0;
  const bundleSizes = {};
  
  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.css')) {
      const stats = await fs.stat(path.join(distPath, file));
      const sizeKB = Math.round(stats.size / 1024);
      bundleSizes[file] = sizeKB;
      totalSize += sizeKB;
    }
  }
  
  return { totalSize, bundleSizes };
}

async function checkCoreWebVitals(results) {
  const metrics = results.audits;
  const vitals = {
    FCP: metrics['first-contentful-paint'].numericValue,
    LCP: metrics['largest-contentful-paint'].numericValue,
    CLS: metrics['cumulative-layout-shift'].numericValue,
    TBT: metrics['total-blocking-time'].numericValue,
    SI: metrics['speed-index'].numericValue,
  };
  
  const passed = {};
  const failed = {};
  
  for (const [key, value] of Object.entries(vitals)) {
    const budgetKey = key.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
    const budget = PERFORMANCE_BUDGET[budgetKey] || Infinity;
    
    if (value <= budget) {
      passed[key] = { value, budget };
    } else {
      failed[key] = { value, budget, overBy: value - budget };
    }
  }
  
  return { vitals, passed, failed };
}

async function generateReport(allResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalUrls: allResults.length,
      averageScore: 0,
      passedBudget: 0,
      failedBudget: 0,
    },
    results: [],
  };
  
  let totalScore = 0;
  
  for (const result of allResults) {
    totalScore += result.score;
    
    if (Object.keys(result.vitals.failed).length === 0) {
      report.summary.passedBudget++;
    } else {
      report.summary.failedBudget++;
    }
    
    report.results.push({
      url: result.url,
      score: Math.round(result.score),
      vitals: result.vitals.vitals,
      passed: result.vitals.passed,
      failed: result.vitals.failed,
    });
  }
  
  report.summary.averageScore = Math.round(totalScore / allResults.length);
  
  // Bundle size analysis
  const bundleAnalysis = await analyzeBundleSize();
  report.bundleSize = bundleAnalysis;
  
  return report;
}

async function main() {
  console.log('🚀 Starting Performance Audit...\n');
  
  const chrome = await launchChrome();
  const results = [];
  
  try {
    for (const url of URLS_TO_TEST) {
      console.log(`Testing ${url}...`);
      
      const lhr = await runLighthouse(url, chrome);
      const vitals = await checkCoreWebVitals(lhr);
      
      results.push({
        url,
        score: lhr.categories.performance.score * 100,
        vitals,
      });
      
      console.log(`✅ Score: ${Math.round(lhr.categories.performance.score * 100)}/100\n`);
    }
    
    const report = await generateReport(results);
    
    // Save report
    await fs.writeFile(
      path.join(__dirname, '../performance-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    // Print summary
    console.log('\n📊 PERFORMANCE AUDIT SUMMARY');
    console.log('============================');
    console.log(`Average Score: ${report.summary.averageScore}/100`);
    console.log(`Passed Budget: ${report.summary.passedBudget}/${report.summary.totalUrls}`);
    console.log(`Bundle Size: ${report.bundleSize.totalSize}KB`);
    
    if (report.summary.averageScore >= 95) {
      console.log('\n✅ PERFORMANCE TARGET ACHIEVED!');
    } else {
      console.log('\n❌ Performance improvements needed');
      
      // Show failed metrics
      for (const result of report.results) {
        if (Object.keys(result.failed).length > 0) {
          console.log(`\n${result.url}:`);
          for (const [metric, data] of Object.entries(result.failed)) {
            console.log(`  - ${metric}: ${data.value}ms (budget: ${data.budget}ms)`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error running audit:', error);
  } finally {
    await chrome.kill();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runLighthouse, checkCoreWebVitals };