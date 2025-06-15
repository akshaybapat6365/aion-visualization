#!/bin/bash

# Quick Performance Fix Script for Aion Visualization

echo "🚀 Starting quick performance fixes..."

# 1. Create visualizations index page
echo "📄 Creating visualizations index page..."
cat > visualizations.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Visualizations - Aion</title>
    <style>
        body { 
            background: #000; 
            color: #fff; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        h1 {
            text-align: center;
            font-size: 3rem;
            margin-bottom: 3rem;
            background: linear-gradient(45deg, #ffd700, #fff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .viz-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); 
            gap: 2rem; 
        }
        .viz-card { 
            background: rgba(255,255,255,0.05); 
            padding: 2rem; 
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
        }
        .viz-card:hover {
            background: rgba(255,255,255,0.08);
            transform: translateY(-4px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .viz-card h3 { 
            margin-top: 0;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .viz-card p {
            color: rgba(255,255,255,0.7);
            line-height: 1.6;
        }
        .viz-link { 
            color: #ffd700; 
            text-decoration: none;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        .viz-link:hover {
            text-decoration: underline;
        }
        .back-link {
            display: inline-block;
            color: #ffd700;
            text-decoration: none;
            margin-bottom: 2rem;
            opacity: 0.8;
        }
        .back-link:hover {
            opacity: 1;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-link">← Back to Home</a>
        <h1>Aion Interactive Visualizations</h1>
        <div class="viz-grid">
            <div class="viz-card">
                <h3>🐟 Fish Symbol Timeline</h3>
                <p>Explore the evolution of the fish symbol through 2000 years of history, from ancient fertility symbols to Christian ichthys to Jung's psychological interpretation.</p>
                <a href="/src/visualizations/chapters/chapter-4-fish/fish-timeline-showcase.html" class="viz-link">Launch Demo →</a>
            </div>
            <div class="viz-card">
                <h3>🌑 Shadow Integration Demo</h3>
                <p>Interactive particle physics simulation demonstrating Jung's concept of shadow work. Drag shadow elements from the unconscious to integrate them with the conscious mind.</p>
                <a href="/src/visualizations/shadow/shadow-demo.html" class="viz-link">Launch Demo →</a>
            </div>
            <div class="viz-card">
                <h3>⭐ Anima/Animus Constellation</h3>
                <p>3D force-directed graph showing the relationships between Jungian archetypes. Explore how the contrasexual archetypes connect with other psychological structures.</p>
                <a href="/src/visualizations/constellation/anima-animus-demo.html" class="viz-link">Launch Demo →</a>
            </div>
            <div class="viz-card">
                <h3>🌌 Gnostic Cosmology Map</h3>
                <p>Navigate through the hierarchical realms of Gnostic cosmology in 3D. Journey from the divine Pleroma through various emanations to the material world.</p>
                <a href="/src/visualizations/cosmology/gnostic-map-demo.html" class="viz-link">Launch Demo →</a>
            </div>
            <div class="viz-card">
                <h3>⚗️ Alchemical Transformation Lab</h3>
                <p>Interactive drag-and-drop laboratory where you can combine alchemical elements. Experience Jung's psychological interpretation of the alchemical opus.</p>
                <a href="/src/visualizations/alchemy/alchemy-lab-demo.html" class="viz-link">Launch Demo →</a>
            </div>
            <div class="viz-card">
                <h3>🕐 Aion Clock Visualization</h3>
                <p>Visualize the 2000-year zodiacal ages and the precession of the equinoxes. See how we're transitioning from the Age of Pisces to the Age of Aquarius.</p>
                <a href="/src/visualizations/clock/aion-clock-demo.html" class="viz-link">Launch Demo →</a>
            </div>
        </div>
    </div>
</body>
</html>
EOF

# 2. Create simple visualization loader
echo "📦 Creating simple visualization loader..."
mkdir -p src/core
cat > src/core/simple-viz-loader.js << 'EOF'
// Simple Visualization Loader for Aion Project
export async function loadVisualization(chapterId, container) {
  // Map chapters to their visualizations
  const vizMap = {
    'chapter-2': {
      path: '/src/visualizations/shadow/ShadowIntegration.js',
      className: 'ShadowIntegration',
      deps: ['matter-js']
    },
    'chapter-3': {
      path: '/src/visualizations/constellation/AnimaAnimus.js',
      className: 'AnimaAnimus',
      deps: ['three', 'd3']
    },
    'chapter-4': {
      path: '/src/visualizations/chapters/chapter-4-fish/fish-timeline-simple.js',
      init: 'initFishTimeline',
      deps: ['d3']
    },
    'chapter-9': {
      path: '/src/visualizations/cosmology/GnosticMap.js',
      className: 'GnosticMap',
      deps: ['three']
    },
    'chapter-11': {
      path: '/src/visualizations/alchemy/AlchemyLab.js',
      className: 'AlchemyLab',
      deps: []
    },
    'chapter-14': {
      path: '/src/visualizations/clock/AionClock.js',
      className: 'AionClock',
      deps: ['d3']
    }
  };
  
  const config = vizMap[chapterId];
  if (!config) {
    console.log(`No visualization configured for ${chapterId}`);
    return null;
  }
  
  try {
    // Show loading indicator
    if (container) {
      container.innerHTML = '<div class="viz-loading">Loading visualization...</div>';
    }
    
    // Load dependencies first if needed
    // (In production, these would be loaded from CDN or bundled)
    
    // Load the visualization module
    const module = await import(config.path);
    
    // Initialize based on module type
    if (config.init && module[config.init]) {
      // Function-based initialization
      return module[config.init](container);
    } else if (config.className && module[config.className]) {
      // Class-based initialization
      const VizClass = module[config.className];
      return new VizClass(container);
    } else if (module.default) {
      // Default export
      if (typeof module.default === 'function') {
        return module.default(container);
      } else {
        return new module.default(container);
      }
    }
    
    throw new Error('Could not find initialization method');
  } catch (error) {
    console.error(`Failed to load visualization for ${chapterId}:`, error);
    if (container) {
      container.innerHTML = '<div class="viz-error">Failed to load visualization. Please try refreshing the page.</div>';
    }
    return null;
  }
}

// Helper to check if we should load visualization for current page
export function shouldLoadVisualization() {
  const path = window.location.pathname;
  const match = path.match(/chapter-(\d+)/);
  return match ? `chapter-${match[1]}` : null;
}

// Auto-initialize on pages with viz containers
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    const vizContainer = document.getElementById('visualization-container');
    if (vizContainer) {
      const chapterId = shouldLoadVisualization();
      if (chapterId) {
        await loadVisualization(chapterId, vizContainer);
      }
    }
  });
}
EOF

# 3. Create performance-optimized index.html patch
echo "🔧 Creating performance patch for index.html..."
cat > index-performance-patch.html << 'EOF'
<!-- Add these lines to the <head> section of index.html -->

<!-- Resource hints for faster external resource loading -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://unpkg.com">
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Critical CSS (inline this in <head>) -->
<style>
  /* Critical CSS for above-the-fold content */
  body { margin: 0; background: #000; color: #fff; font-family: system-ui, -apple-system, sans-serif; }
  .nav { display: flex; padding: 1rem; background: rgba(0,0,0,0.8); }
  .nav-link { color: #fff; text-decoration: none; padding: 0.5rem 1rem; }
  .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .hero-content { text-align: center; padding: 2rem; }
  .hero-title { font-size: clamp(2rem, 5vw, 4rem); margin: 0 0 1rem; }
  .loading-container { position: fixed; inset: 0; background: #000; z-index: 9999; }
</style>

<!-- Async CSS loading -->
<link rel="preload" href="assets/css/bundle.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="assets/css/bundle.min.css"></noscript>

<!-- Update anti-redirect.js to use defer -->
<!-- Change: <script src="assets/js/anti-redirect.js"></script> -->
<!-- To: <script src="assets/js/anti-redirect.js" defer></script> -->
EOF

# 4. Create a commit script
echo "💾 Creating commit script..."
cat > commit-performance-fixes.sh << 'EOF'
#!/bin/bash
git add visualizations.html
git add src/core/simple-viz-loader.js
git add quick-performance-fix.sh
git add index-performance-patch.html
git add VISUALIZATION_INTEGRATION_PLAN.md
git add IMMEDIATE_PERFORMANCE_FIXES.md

git commit -m "perf: Add visualization index and performance optimizations

- Create dedicated visualizations.html index page
- Add simple visualization loader for dynamic imports
- Document performance optimization strategy
- Prepare for async CSS loading and resource hints

This improves initial page load performance and provides
easy access to all interactive visualizations."
EOF

chmod +x commit-performance-fixes.sh

echo "✅ Quick performance fixes created!"
echo ""
echo "Next steps:"
echo "1. Manually apply the changes from index-performance-patch.html to your index.html"
echo "2. Update navigation in index.html to include link to visualizations.html"
echo "3. Run ./commit-performance-fixes.sh to commit the changes"
echo "4. Test the performance improvements locally"
echo ""
echo "The visualizations.html page is ready to use and will provide immediate access to all demos!"