/**
 * Script to integrate all Phase 4 polish features into HTML files
 * Updates index.html, chapters, and other pages with new components
 */

import { promises as fs } from 'fs';
import path from 'path';

async function integratePolishFeatures() {
  console.log('🎨 Integrating Phase 4 Polish Features...\n');

  // Files to update
  const filesToUpdate = [
    'index.html',
    'showcase.html',
    'chapters/index.html',
    // Add standard chapters
    ...Array.from({ length: 14 }, (_, i) => `src/chapter${i + 1}.html`),
    // Add enhanced chapters
    ...Array.from({ length: 14 }, (_, i) => `chapters/enhanced/${i + 1}/index.html`)
  ];

  // Polish feature imports to add
  const polishImports = `
    <!-- Phase 4: Polish Features -->
    <link rel="preload" href="/src/components/loading-states.js" as="script" type="module">
    <link rel="preload" href="/src/components/error-boundaries.js" as="script" type="module">
    <link rel="preload" href="/src/components/micro-interactions.js" as="script" type="module">
    
    <!-- Initialize Polish Features -->
    <script type="module">
      import polishIntegration from '/src/polish-integration.js';
      
      // Initialize when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          console.log('Initializing polish features...');
        });
      }
    </script>`;

  // Performance optimization script
  const performanceScript = `
    <!-- Performance Optimization -->
    <script>
      // Early performance hints
      if ('connection' in navigator) {
        const connection = navigator.connection;
        if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          document.documentElement.classList.add('reduced-data-mode');
        }
      }
      
      // Preload critical resources
      const criticalResources = [
        '/assets/css/main.css',
        '/assets/js/core/github-pages-router.js'
      ];
      
      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = resource.endsWith('.css') ? 'style' : 'script';
        document.head.appendChild(link);
      });
    </script>`;

  let successCount = 0;
  let errorCount = 0;

  for (const filePath of filesToUpdate) {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      let content = await fs.readFile(filePath, 'utf8');
      let modified = false;

      // Check if polish features are already integrated
      if (!content.includes('Polish Features')) {
        // Add imports before </head>
        content = content.replace(
          '</head>',
          `${polishImports}\n</head>`
        );
        modified = true;
      }

      // Add performance script if not present
      if (!content.includes('Performance Optimization') && !content.includes('Early performance hints')) {
        // Add after <head> tag
        content = content.replace(
          '<head>',
          `<head>\n${performanceScript}`
        );
        modified = true;
      }

      // Add loading container if not present
      if (!content.includes('global-loader') && content.includes('<body')) {
        const loadingContainer = `
    <!-- Global Loading Container -->
    <div id="global-loader" class="loading-container"></div>
`;
        content = content.replace(
          /<body[^>]*>/,
          `$&\n${loadingContainer}`
        );
        modified = true;
      }

      // Update chapter links to include data attributes for enhanced loading
      if (content.includes('chapter') && content.includes('href')) {
        content = content.replace(
          /(<a[^>]*href="[^"]*chapter[^"]*"[^>]*)(>)/g,
          '$1 data-transition="chapter"$2'
        );
        modified = true;
      }

      // Add error boundary data attributes to critical elements
      if (content.includes('visualization') || content.includes('canvas')) {
        content = content.replace(
          /(<div[^>]*class="[^"]*visualization[^"]*"[^>]*)(>)/g,
          '$1 data-error-boundary="true"$2'
        );
        modified = true;
      }

      if (modified) {
        await fs.writeFile(filePath, content);
        console.log(`✅ Updated: ${filePath}`);
        successCount++;
      } else {
        console.log(`ℹ️  Already integrated: ${filePath}`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`⏭️  Skipped (not found): ${filePath}`);
      } else {
        console.error(`❌ Error updating ${filePath}:`, error.message);
        errorCount++;
      }
    }
  }

  // Create a polish features test page
  const testPageContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Polish Features Test - Aion Visualization</title>
    <link rel="stylesheet" href="/assets/css/main.css">
    <link rel="stylesheet" href="/assets/css/liquid-morphing.css">
    
    <!-- Polish Features -->
    <link rel="preload" href="/src/components/loading-states.js" as="script" type="module">
    <link rel="preload" href="/src/components/error-boundaries.js" as="script" type="module">
    <link rel="preload" href="/src/components/micro-interactions.js" as="script" type="module">
    
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
            gap: 1rem;
            margin-top: 2rem;
        }
        
        .test-button {
            padding: 1rem 2rem;
            background: var(--grey-700, #1F1F1F);
            border: 1px solid var(--grey-600, #2A2A2A);
            color: var(--grey-050, #F0F0F0);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .test-button:hover {
            background: var(--grey-600, #2A2A2A);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <!-- Global Loading Container -->
    <div id="global-loader" class="loading-container"></div>

    <div class="test-container">
        <h1>Polish Features Test Suite</h1>
        
        <!-- Loading States Test -->
        <section class="test-section">
            <h2>Loading States</h2>
            <div class="test-grid">
                <button class="test-button" onclick="testChapterLoader()">Test Chapter Loader</button>
                <button class="test-button" onclick="testVizLoader()">Test Viz Loader</button>
                <button class="test-button" onclick="testContentLoader(this)">Test Content Loader</button>
            </div>
        </section>
        
        <!-- Error Handling Test -->
        <section class="test-section">
            <h2>Error Handling</h2>
            <div class="test-grid">
                <button class="test-button" onclick="testGlobalError()">Test Global Error</button>
                <button class="test-button" onclick="testToastError()">Test Toast Error</button>
                <button class="test-button" onclick="testResourceError()">Test Resource Error</button>
            </div>
        </section>
        
        <!-- Micro-interactions Test -->
        <section class="test-section">
            <h2>Micro-interactions</h2>
            <div class="test-grid">
                <button class="test-button">Ripple Effect</button>
                <button class="test-button pulse">Pulse Animation</button>
                <button class="test-button breathe">Breathe Animation</button>
            </div>
            <p style="margin-top: 2rem;">
                Test link hover: <a href="#test">Hover over this link</a>
            </p>
        </section>
        
        <!-- Performance Test -->
        <section class="test-section">
            <h2>Performance Monitoring</h2>
            <button class="test-button" onclick="testLongTask()">Trigger Long Task</button>
            <div id="performance-results" style="margin-top: 1rem;"></div>
        </section>
    </div>

    <script type="module">
        import polishIntegration from '/src/polish-integration.js';
        
        // Make test functions available globally
        window.testChapterLoader = () => {
            const loader = window.loadingStates.showChapterLoader(7, 'The Gnostic Christ');
            setTimeout(() => window.loadingStates.hideLoader(loader), 3000);
        };
        
        window.testVizLoader = () => {
            const loader = window.loadingStates.showVizLoader('Loading 3D Scene');
            setTimeout(() => window.loadingStates.hideLoader(loader), 2500);
        };
        
        window.testContentLoader = (button) => {
            const loader = window.loadingStates.showContentLoader(button, 'Processing');
            setTimeout(() => window.loadingStates.hideLoader(loader), 2000);
        };
        
        window.testGlobalError = () => {
            throw new Error('This is a test error to demonstrate error handling');
        };
        
        window.testToastError = () => {
            window.errorBoundary.showToastError('This is a test toast notification', 5000);
        };
        
        window.testResourceError = () => {
            const img = document.createElement('img');
            img.src = 'non-existent-image.jpg';
            document.body.appendChild(img);
        };
        
        window.testLongTask = () => {
            const start = Date.now();
            while (Date.now() - start < 150) {
                // Simulate long task
            }
            document.getElementById('performance-results').textContent = 
                'Long task completed (150ms blocking)';
        };
        
        // Log successful initialization
        console.log('Polish features test page loaded successfully');
    </script>
</body>
</html>`;

  // Create test page
  await fs.writeFile('polish-test.html', testPageContent);
  console.log('✅ Created: polish-test.html');

  console.log(`\n✨ Integration Summary:`);
  console.log(`   - Files updated: ${successCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Test page: polish-test.html`);
  console.log('\n🔗 Test the polish features at: /polish-test.html');
}

// Run integration
integratePolishFeatures().catch(console.error);