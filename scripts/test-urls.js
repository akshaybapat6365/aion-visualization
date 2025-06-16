#!/usr/bin/env node

/**
 * Simple URL Testing Script
 * Tests all critical URLs to ensure they're accessible
 */

import https from 'https';

const VERCEL_URL = 'https://aion-jung-9cgf8h99a-akshay-bapats-projects.vercel.app';

const URLS_TO_TEST = [
  '/',
  '/visualizations.html',
  '/viz.html',
  '/chapters/index.html',
  '/chapters/enhanced/chapter-1.html',
  '/chapters/enhanced/chapter-2.html',
  '/src/visualizations/shadow/shadow-demo.html',
  '/src/visualizations/constellation/anima-animus-demo.html',
  '/src/visualizations/cosmology/gnostic-map-demo.html',
  '/src/visualizations/alchemy/alchemy-lab-demo.html',
  '/src/visualizations/clock/aion-clock-demo.html',
  '/src/visualizations/chapters/chapter-4-fish/fish-timeline-showcase.html'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    const fullUrl = VERCEL_URL + url;
    
    https.get(fullUrl, (res) => {
      resolve({
        url,
        status: res.statusCode,
        ok: res.statusCode >= 200 && res.statusCode < 400
      });
    }).on('error', (err) => {
      resolve({
        url,
        status: 0,
        ok: false,
        error: err.message
      });
    });
  });
}

async function runTests() {
  console.log('🧪 Testing URLs on Vercel deployment...\n');
  console.log(`Base URL: ${VERCEL_URL}\n`);
  
  const results = await Promise.all(URLS_TO_TEST.map(testUrl));
  
  const passed = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  
  console.log('✅ PASSED:');
  passed.forEach(r => {
    console.log(`  ${r.url} - ${r.status}`);
  });
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED:');
    failed.forEach(r => {
      console.log(`  ${r.url} - ${r.status} ${r.error || ''}`);
    });
  }
  
  console.log(`\n📊 Summary: ${passed.length}/${results.length} tests passed`);
  
  if (failed.length > 0) {
    console.log('\n⚠️  Note: 401 errors indicate authentication is required.');
    console.log('The site is deployed but requires authentication to access.');
  }
}

runTests().catch(console.error);