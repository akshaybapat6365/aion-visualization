/**
 * Premium Features Integration Script
 * Adds premium features to all HTML pages
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function integratePremiumFeatures() {
  console.log('🚀 Integrating Premium Features...\n');
  
  // HTML files to update
  const htmlFiles = [
    'index.html',
    'showcase.html',
    'chapters/index.html',
    'chapters/chapter1.html',
    'chapters/chapter2.html',
    'chapters/chapter3.html',
    'chapters/chapter4.html',
    'chapters/chapter5.html',
    'chapters/chapter6.html',
    'chapters/chapter7.html',
    'chapters/chapter8.html',
    'chapters/chapter9.html',
    'chapters/chapter10.html',
    'chapters/chapter11.html',
    'chapters/chapter12.html',
    'chapters/chapter13.html',
    'chapters/chapter14.html'
  ];
  
  let updated = 0;
  
  for (const file of htmlFiles) {
    try {
      let content = await fs.readFile(file, 'utf8');
      let modified = false;
      
      // Add premium features script before closing body tag
      if (!content.includes('premium-features/index.js')) {
        const premiumScript = `
    <!-- Premium Features -->
    <script type="module">
      import '/src/premium-features/index.js';
      
      // Enable premium features
      console.log('✨ Premium features loaded');
    </script>`;
        
        content = content.replace('</body>', premiumScript + '\n</body>');
        modified = true;
      }
      
      // Add data-transition attributes to chapter links
      if (content.includes('href="/chapters/') || content.includes('href="chapter')) {
        content = content.replace(
          /href="(\/chapters\/[^"]+)"/g,
          'href="$1" data-transition="morph"'
        );
        content = content.replace(
          /href="(chapter\d+\.html)"/g,
          'href="$1" data-transition="morph"'
        );
        modified = true;
      }
      
      // Add magnetic element classes
      content = content.replace(
        /class="button([^"]*)"/g,
        'class="button$1 magnetic-element"'
      );
      content = content.replace(
        /class="card([^"]*)"/g,
        'class="card$1 magnetic-element"'
      );
      
      if (modified) {
        await fs.writeFile(file, content);
        console.log(`✅ Updated ${file}`);
        updated++;
      } else {
        console.log(`⏭️  Skipped ${file} (already updated)`);
      }
      
    } catch (error) {
      console.error(`❌ Error updating ${file}:`, error.message);
    }
  }
  
  console.log(`\n✨ Premium features integrated into ${updated} files`);
  
  // Create test page for premium features
  await createPremiumTestPage();
}

async function createPremiumTestPage() {
  const testPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Features Test - Aion Visualization</title>
    <link rel="stylesheet" href="assets/css/bundle.min.css">
    <link rel="stylesheet" href="assets/css/minimalist-background.min.css">
    <style>
        body {
            background: var(--grey-900, #0A0A0A);
            color: var(--grey-050, #F0F0F0);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 2rem;
        }
        
        .test-container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .test-section {
            margin-bottom: 4rem;
            padding: 2rem;
            background: var(--grey-800, #141414);
            border-radius: 12px;
            border: 1px solid var(--grey-700, #1F1F1F);
        }
        
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .test-card {
            padding: 2rem;
            background: var(--grey-700, #1F1F1F);
            border: 1px solid var(--grey-600, #2A2A2A);
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .test-card:hover {
            transform: translateY(-4px);
            border-color: var(--grey-500, #3F3F3F);
        }
        
        #viz-container {
            width: 100%;
            height: 500px;
            background: var(--grey-900, #0A0A0A);
            border-radius: 12px;
            overflow: hidden;
            position: relative;
        }
    </style>
</head>
<body>
    <div class="test-container">
        <h1>Premium Features Test Suite</h1>
        <p>Test and experience all premium features</p>
        
        <!-- Liquid Morphing Test -->
        <section class="test-section">
            <h2>Liquid Morphing Transitions</h2>
            <p>Click links to see liquid transition effects</p>
            <div class="test-grid">
                <a href="#test1" class="test-card magnetic-element" data-transition="morph">
                    <h3>Test Link 1</h3>
                    <p>Radial morph</p>
                </a>
                <a href="#test2" class="test-card magnetic-element" data-transition="morph">
                    <h3>Test Link 2</h3>
                    <p>Horizontal morph</p>
                </a>
                <a href="#test3" class="test-card magnetic-element" data-transition="morph">
                    <h3>Test Link 3</h3>
                    <p>Vertical morph</p>
                </a>
            </div>
        </section>
        
        <!-- Magnetic Cursor Test -->
        <section class="test-section">
            <h2>Magnetic Cursor Interactions</h2>
            <p>Move your cursor near elements to feel the magnetic attraction</p>
            <div class="test-grid">
                <button class="button magnetic-element">Magnetic Button 1</button>
                <button class="button magnetic-element">Magnetic Button 2</button>
                <button class="button magnetic-element">Magnetic Button 3</button>
            </div>
        </section>
        
        <!-- Premium Visualization Test -->
        <section class="test-section">
            <h2>Premium Chapter Visualization</h2>
            <div id="viz-container"></div>
            <div class="test-grid" style="margin-top: 2rem;">
                <button onclick="loadChapter(1)" class="button magnetic-element">Chapter 1: Ego</button>
                <button onclick="loadChapter(2)" class="button magnetic-element">Chapter 2: Shadow</button>
                <button onclick="loadChapter(3)" class="button magnetic-element">Chapter 3: Syzygy</button>
            </div>
        </section>
    </div>
    
    <!-- Three.js for visualization -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    
    <!-- Premium Features -->
    <script type="module">
        import '/src/premium-features/index.js';
        import PremiumChapterVisualization from '/src/visualizations/premium-chapter-viz.js';
        
        let currentViz = null;
        
        window.loadChapter = function(chapterId) {
            if (currentViz) {
                currentViz.destroy();
            }
            
            const container = document.getElementById('viz-container');
            currentViz = new PremiumChapterVisualization(container, {
                id: chapterId,
                title: \`Chapter \${chapterId}\`
            });
        };
        
        // Load first chapter by default
        window.addEventListener('load', () => {
            loadChapter(1);
        });
    </script>
</body>
</html>`;
  
  await fs.writeFile('premium-test.html', testPage);
  console.log('\n✅ Created premium-test.html');
}

// Run integration
integratePremiumFeatures().catch(console.error);