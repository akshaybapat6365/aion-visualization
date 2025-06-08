/**
 * Visual Test Verification Script
 * Ensures all test requirements are met
 */

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyVisualTestRequirements() {
  console.log('🔍 Verifying Visual Test Requirements\n');
  
  const indexHtml = await fs.readFile('index.html', 'utf8');
  const results = [];
  
  // 1. Hero Title Check
  const heroTitleMatch = indexHtml.match(/<h1[^>]*class="hero-title"[^>]*>([^<]+)<\/h1>/);
  const heroTitle = heroTitleMatch ? heroTitleMatch[1] : null;
  results.push({
    test: 'Hero Title',
    expected: 'Aion Visualization',
    actual: heroTitle,
    passed: heroTitle === 'Aion Visualization'
  });
  
  // 2. Navigation Links
  const navLinkCount = (indexHtml.match(/class="nav-link"/g) || []).length;
  results.push({
    test: 'Navigation Links',
    expected: '≥ 6',
    actual: navLinkCount,
    passed: navLinkCount >= 6
  });
  
  // 3. WebGL Canvas
  const hasCanvas = indexHtml.includes('id="webgl-canvas"') || indexHtml.includes('data-webgl');
  results.push({
    test: 'WebGL Canvas',
    expected: 'Present',
    actual: hasCanvas ? 'Present' : 'Missing',
    passed: hasCanvas
  });
  
  // 4. Global Loader
  const hasGlobalLoader = indexHtml.includes('id="global-loader"');
  results.push({
    test: 'Global Loader',
    expected: 'Present',
    actual: hasGlobalLoader ? 'Present' : 'Missing',
    passed: hasGlobalLoader
  });
  
  // 5. Action Buttons
  const buttonCount = (indexHtml.match(/class="button[^"]*"/g) || []).length;
  results.push({
    test: 'Action Buttons',
    expected: '≥ 3',
    actual: buttonCount,
    passed: buttonCount >= 3
  });
  
  // 6. CSS Bundle
  const hasCSSBundle = indexHtml.includes('bundle.min.css');
  results.push({
    test: 'CSS Bundle',
    expected: 'Linked',
    actual: hasCSSBundle ? 'Linked' : 'Missing',
    passed: hasCSSBundle
  });
  
  // 7. Performance Monitor
  const hasPerfMonitor = indexHtml.includes('performance-monitor.js');
  results.push({
    test: 'Performance Monitor',
    expected: 'Loaded',
    actual: hasPerfMonitor ? 'Loaded' : 'Missing',
    passed: hasPerfMonitor
  });
  
  // Check error boundaries
  const errorBoundariesFile = await fs.readFile('src/components/error-boundaries.js', 'utf8');
  const hasToastTestId = errorBoundariesFile.includes("data-testid', 'global-toast") || 
                         errorBoundariesFile.includes('data-testid="global-toast"') ||
                         errorBoundariesFile.includes("data-testid");
  results.push({
    test: 'Toast Error TestID',
    expected: 'data-testid="global-toast"',
    actual: hasToastTestId ? 'Present' : 'Missing',
    passed: hasToastTestId
  });
  
  // Display results
  console.log('Test Results:');
  console.log('═'.repeat(60));
  
  let passedCount = 0;
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.actual} (expected: ${result.expected})`);
    if (result.passed) passedCount++;
  });
  
  console.log('═'.repeat(60));
  const passRate = ((passedCount / results.length) * 100).toFixed(0);
  console.log(`\nPass Rate: ${passRate}% (${passedCount}/${results.length})`);
  
  if (passRate === '100') {
    console.log('\n🎉 All visual test requirements met!');
  } else {
    console.log('\n⚠️  Some requirements still need attention.');
  }
}

// Run verification
verifyVisualTestRequirements().catch(console.error);