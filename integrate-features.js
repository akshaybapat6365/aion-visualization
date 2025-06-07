/**
 * Integration script to add design system features to production
 * Simple approach: copy files and update HTML
 */

import { promises as fs } from 'fs';
import path from 'path';

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory ${dirPath}:`, err);
  }
}

async function copyFile(src, dest) {
  try {
    const content = await fs.readFile(src, 'utf8');
    await fs.writeFile(dest, content);
    console.log(`✓ Copied: ${src} → ${dest}`);
  } catch (err) {
    console.error(`✗ Error copying ${src}:`, err.message);
  }
}

async function updateHTML(filePath, updates) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Apply updates
    for (const update of updates) {
      if (update.type === 'insertBefore') {
        content = content.replace(update.target, update.content + '\n' + update.target);
      } else if (update.type === 'insertAfter') {
        content = content.replace(update.target, update.target + '\n' + update.content);
      }
    }
    
    await fs.writeFile(filePath, content);
    console.log(`✓ Updated: ${filePath}`);
  } catch (err) {
    console.error(`✗ Error updating ${filePath}:`, err.message);
  }
}

async function integrate() {
  console.log('🚀 Integrating design system features...\n');

  // 1. Create directories
  await ensureDir('assets/css');
  await ensureDir('assets/js/magnetic-cursor');

  // 2. Copy CSS files
  await copyFile(
    'src/design-system/navigation/transitions/liquid-morphing.css',
    'assets/css/liquid-morphing.css'
  );

  // 3. Copy magnetic cursor files (maintaining structure)
  const magneticFiles = [
    'core/MagneticField.js',
    'core/CursorTracker.js', 
    'core/MagneticInteraction.js',
    'effects/MagneticButton.js',
    'effects/MagneticLink.js',
    'effects/MagneticTrail.js',
    'config/presets.js',
    'index.js'
  ];

  for (const file of magneticFiles) {
    const dir = path.dirname(file);
    if (dir !== '.') {
      await ensureDir(`assets/js/magnetic-cursor/${dir}`);
    }
    await copyFile(
      `src/features/magnetic-cursor/${file}`,
      `assets/js/magnetic-cursor/${file}`
    );
  }

  // 4. Create integration loader
  const loaderContent = `/**
 * Feature Loader
 * Loads design system features with proper module resolution
 */

// Load magnetic cursor system
import('./magnetic-cursor/index.js').then(module => {
  const { MagneticCursorSystem } = module;
  
  // Initialize system
  window.magneticCursor = new MagneticCursorSystem({
    autoInit: true,
    enableTrail: true,
    enableButtons: true,
    enableLinks: true,
    performanceMode: 'auto'
  });
  
  console.log('✨ Magnetic cursor system loaded');
}).catch(err => {
  console.warn('Could not load magnetic cursor:', err);
});

// Apply liquid transitions
document.addEventListener('DOMContentLoaded', () => {
  // Add liquid transition class to body
  document.body.classList.add('liquid-transitions-enabled');
  
  // Add to navigation links
  const navLinks = document.querySelectorAll('nav a, .nav-link, .chapter-link');
  navLinks.forEach(link => {
    link.classList.add('liquid-transition');
  });
  
  // Handle page transitions
  let isTransitioning = false;
  
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && !link.href.includes('#') && !isTransitioning) {
      e.preventDefault();
      isTransitioning = true;
      
      // Apply liquid morph effect
      document.body.classList.add('liquid-morph-out');
      
      setTimeout(() => {
        window.location.href = link.href;
      }, 800);
    }
  });
  
  // Fade in on load
  document.body.classList.add('liquid-morph-in');
  
  console.log('✨ Liquid transitions enabled');
});
`;

  await fs.writeFile('assets/js/feature-loader.js', loaderContent);
  console.log('✓ Created feature loader');

  // 5. Update index.html
  const indexUpdates = [
    {
      type: 'insertBefore',
      target: '</head>',
      content: '    <!-- Design System Features -->\n    <link rel="stylesheet" href="assets/css/liquid-morphing.css">'
    },
    {
      type: 'insertBefore',
      target: '</body>',
      content: '    <!-- Load Design System Features -->\n    <script type="module" src="assets/js/feature-loader.js"></script>'
    }
  ];

  await updateHTML('index.html', indexUpdates);

  // 6. Create showcase page
  const showcaseHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design Features Showcase - Aion Visualization</title>
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="assets/css/liquid-morphing.css">
    <style>
        body {
            background: #0A0A0A;
            color: #F0F0F0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .showcase-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 60px 20px;
        }
        
        .showcase-header {
            text-align: center;
            margin-bottom: 80px;
        }
        
        .showcase-header h1 {
            font-size: 3.5rem;
            font-weight: 300;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #F0F0F0, #707070);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .feature-section {
            margin-bottom: 100px;
            padding: 60px;
            background: rgba(20, 20, 20, 0.8);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        
        .feature-title {
            font-size: 2.5rem;
            margin-bottom: 30px;
            font-weight: 300;
        }
        
        .demo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin-top: 40px;
        }
        
        .demo-button {
            padding: 20px 40px;
            font-size: 1.1rem;
            background: #1F1F1F;
            border: 2px solid #3F3F3F;
            color: #F0F0F0;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }
        
        .demo-button:hover {
            background: #2A2A2A;
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        
        .demo-link-list {
            display: flex;
            flex-wrap: wrap;
            gap: 40px;
            font-size: 1.5rem;
            margin-top: 40px;
        }
        
        .demo-link {
            color: #F0F0F0;
            text-decoration: none;
            position: relative;
            padding-bottom: 5px;
        }
        
        .transition-demo {
            display: flex;
            gap: 30px;
            margin-top: 40px;
        }
        
        .transition-box {
            width: 200px;
            height: 200px;
            background: #1F1F1F;
            border: 2px solid #3F3F3F;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .transition-box:hover {
            transform: scale(1.05);
            border-color: #707070;
        }
    </style>
</head>
<body>
    <div class="showcase-container">
        <header class="showcase-header">
            <h1>Design System Showcase</h1>
            <p style="font-size: 1.25rem; color: #8A8A8A;">Premium Features for Aion Visualization</p>
        </header>

        <!-- Magnetic Cursor Section -->
        <section class="feature-section">
            <h2 class="feature-title">🧲 Magnetic Cursor Interactions</h2>
            <p style="color: #A5A5A5; font-size: 1.1rem; line-height: 1.6;">
                Move your cursor near interactive elements to experience magnetic attraction effects.
                The cursor creates physical interactions with buttons, links, and custom elements.
            </p>
            
            <div class="demo-grid">
                <button class="demo-button magnetic-button" data-magnetic-preset="minimal">
                    Minimal Effect
                </button>
                <button class="demo-button magnetic-button" data-magnetic-preset="standard">
                    Standard Effect
                </button>
                <button class="demo-button magnetic-button" data-magnetic-preset="premium">
                    Premium Effect
                </button>
                <button class="demo-button magnetic-button" data-magnetic-preset="elastic">
                    Elastic Physics
                </button>
            </div>
            
            <div class="demo-link-list">
                <a href="#" class="demo-link magnetic-link" data-magnetic-preset="subtle">Subtle Link</a>
                <a href="#" class="demo-link magnetic-link" data-magnetic-preset="standard">Standard Link</a>
                <a href="#" class="demo-link magnetic-link" data-magnetic-preset="bold">Bold Link</a>
                <a href="#" class="demo-link magnetic-link" data-magnetic-preset="navigation">Navigation Style</a>
            </div>
        </section>

        <!-- Liquid Transitions Section -->
        <section class="feature-section">
            <h2 class="feature-title">💧 Liquid Morphing Transitions</h2>
            <p style="color: #A5A5A5; font-size: 1.1rem; line-height: 1.6;">
                Experience smooth, organic transitions between pages and states.
                Click the boxes below to see different liquid morphing effects.
            </p>
            
            <div class="transition-demo">
                <div class="transition-box liquid-transition" onclick="this.classList.toggle('liquid-morph-active')">
                    <span>Click Me</span>
                </div>
                <div class="transition-box liquid-transition-ripple" onclick="this.classList.toggle('liquid-morph-active')">
                    <span>Ripple Effect</span>
                </div>
                <div class="transition-box liquid-transition-blob" onclick="this.classList.toggle('liquid-morph-active')">
                    <span>Blob Morph</span>
                </div>
            </div>
        </section>

        <!-- Navigation -->
        <nav style="text-align: center; margin-top: 80px;">
            <a href="index.html" class="demo-link magnetic-link" style="margin-right: 40px;">← Back to Home</a>
            <a href="chapters/index.html" class="demo-link magnetic-link">Explore Chapters →</a>
        </nav>
    </div>

    <!-- Load Features -->
    <script type="module" src="assets/js/feature-loader.js"></script>
    <script>
        // Additional demo functionality
        document.addEventListener('DOMContentLoaded', () => {
            // Animate entrance
            const sections = document.querySelectorAll('.feature-section');
            sections.forEach((section, index) => {
                section.style.opacity = '0';
                section.style.transform = 'translateY(30px)';
                
                setTimeout(() => {
                    section.style.transition = 'all 0.8s ease';
                    section.style.opacity = '1';
                    section.style.transform = 'translateY(0)';
                }, 200 + index * 200);
            });
        });
    </script>
</body>
</html>`;

  await fs.writeFile('showcase.html', showcaseHTML);
  console.log('✓ Created showcase.html');

  console.log('\n✅ Integration complete!');
  console.log('\n📋 Features integrated:');
  console.log('   - Liquid morphing transitions (CSS)');
  console.log('   - Magnetic cursor system (JS modules)');
  console.log('   - Feature showcase page');
  console.log('\n🔗 View showcase at: showcase.html');
}

// Run integration
integrate().catch(console.error);