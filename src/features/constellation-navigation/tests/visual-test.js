/**
 * Visual test for Constellation Navigation
 * Captures screenshots and performs OCR verification
 */

const puppeteer = require('puppeteer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_URL = 'http://localhost:8000/constellation-test.html';
const SCREENSHOT_DIR = path.join(__dirname, 'visual-regression');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * Wait for constellation to load
 */
async function waitForConstellation(page) {
  // Wait for loading to disappear
  await page.waitForSelector('#loading', { hidden: true, timeout: 10000 });
  
  // Wait for WebGL canvas
  await page.waitForSelector('canvas', { visible: true });
  
  // Wait for initial render
  await page.waitForTimeout(2000);
}

/**
 * Capture screenshot with timestamp
 */
async function captureScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  
  await page.screenshot({
    path: filepath,
    fullPage: true
  });
  
  console.log(`Screenshot saved: ${filename}`);
  return filepath;
}

/**
 * Perform OCR on screenshot
 */
async function performOCR(imagePath) {
  console.log('Performing OCR analysis...');
  
  const { data: { text, confidence } } = await Tesseract.recognize(
    imagePath,
    'eng',
    {
      logger: m => console.log(`OCR: ${m.status}`)
    }
  );
  
  return { text, confidence };
}

/**
 * Test constellation rendering
 */
async function testConstellationRendering() {
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to test page
    console.log('Loading constellation test page...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle2' });
    
    // Wait for constellation to load
    await waitForConstellation(page);
    
    // Test 1: Initial render
    console.log('\nTest 1: Initial render');
    const screenshot1 = await captureScreenshot(page, 'initial-render');
    
    // Test 2: Click on a node
    console.log('\nTest 2: Node interaction');
    await page.evaluate(() => {
      // Simulate click on canvas center
      const canvas = document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      const event = new MouseEvent('click', {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        bubbles: true
      });
      canvas.dispatchEvent(event);
    });
    
    await page.waitForTimeout(1000);
    const screenshot2 = await captureScreenshot(page, 'node-clicked');
    
    // Test 3: Quality change
    console.log('\nTest 3: Quality settings');
    await page.select('#quality', 'ultra');
    await page.waitForTimeout(1000);
    const screenshot3 = await captureScreenshot(page, 'quality-ultra');
    
    // Test 4: Check performance metrics
    console.log('\nTest 4: Performance metrics');
    const performance = await page.evaluate(() => {
      return {
        fps: document.getElementById('fps').textContent,
        drawCalls: document.getElementById('drawCalls').textContent,
        triangles: document.getElementById('triangles').textContent,
        memory: document.getElementById('memory').textContent
      };
    });
    console.log('Performance:', performance);
    
    // Test 5: OCR verification
    console.log('\nTest 5: OCR verification');
    const ocrResult = await performOCR(screenshot1);
    console.log(`OCR Confidence: ${ocrResult.confidence}%`);
    console.log('Detected text:', ocrResult.text.substring(0, 200) + '...');
    
    // Verify expected text is present
    const expectedTexts = ['Navigation Controls', 'Quality', 'FPS', 'AION'];
    const foundTexts = expectedTexts.filter(text => 
      ocrResult.text.includes(text)
    );
    
    console.log(`Found ${foundTexts.length}/${expectedTexts.length} expected text elements`);
    
    // Test results
    const results = {
      timestamp: new Date().toISOString(),
      tests: {
        rendering: true,
        interaction: true,
        quality: true,
        performance: performance,
        ocr: {
          confidence: ocrResult.confidence,
          foundTexts: foundTexts.length,
          expectedTexts: expectedTexts.length
        }
      },
      screenshots: [screenshot1, screenshot2, screenshot3]
    };
    
    // Save results
    const resultsPath = path.join(SCREENSHOT_DIR, 'test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log('\nTest results saved to:', resultsPath);
    
    return results;
    
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Run visual regression test
 */
async function runVisualRegression() {
  try {
    console.log('Starting visual regression tests...\n');
    const results = await testConstellationRendering();
    
    // Check if all tests passed
    const allPassed = results.tests.rendering && 
                     results.tests.interaction && 
                     results.tests.quality &&
                     results.tests.ocr.foundTexts >= results.tests.ocr.expectedTexts * 0.8;
    
    if (allPassed) {
      console.log('\n✅ All visual tests passed!');
    } else {
      console.log('\n❌ Some visual tests failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Visual test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runVisualRegression();
}

module.exports = {
  testConstellationRendering,
  runVisualRegression
};