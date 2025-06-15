# Visualization Integration & Performance Optimization Plan

## Current Status

### ✅ Completed
- 6 visualization modules created and functional
- Standalone demo pages for each visualization
- Modular JavaScript architecture
- Basic performance monitoring in place

### ❌ Issues
1. **Visualizations not integrated** into main chapter pages
2. **Poor performance** due to loading all libraries globally
3. **No code splitting** or dynamic imports
4. **Path resolution issues** for GitHub Pages
5. **Missing navigation** to visualization demos

## Phase 1: Quick Integration (1-2 days)

### 1.1 Create Visualization Registry
```javascript
// src/core/visualization-registry.js
export const visualizationMap = {
  'chapter-4': {
    module: '/src/visualizations/chapters/chapter-4-fish/fish-timeline-simple.js',
    dependencies: ['d3'],
    init: 'initFishTimeline'
  },
  'chapter-2': {
    module: '/src/visualizations/shadow/ShadowIntegration.js',
    dependencies: ['matter-js'],
    init: 'ShadowIntegration'
  },
  // ... other chapters
};
```

### 1.2 Create Dynamic Loader
```javascript
// src/core/visualization-loader.js
export class VisualizationLoader {
  static async loadForChapter(chapterNum) {
    const config = visualizationMap[`chapter-${chapterNum}`];
    if (!config) return;
    
    // Load dependencies first
    await this.loadDependencies(config.dependencies);
    
    // Then load visualization module
    const module = await import(config.module);
    return module[config.init];
  }
}
```

### 1.3 Update Enhanced Chapter Template
- Add visualization container with loading placeholder
- Import visualization loader
- Initialize visualization on page load
- Add error boundaries

### 1.4 Add Navigation Links
- Update main navigation to include "Visualizations" section
- Create visualization index page listing all demos
- Add links to chapter pages pointing to relevant visualizations

## Phase 2: Performance Optimization (2-3 days)

### 2.1 Implement Code Splitting
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three'],
          'vendor-d3': ['d3'],
          'vendor-matter': ['matter-js'],
          'vendor-gsap': ['gsap']
        }
      }
    }
  }
}
```

### 2.2 Lazy Load Libraries
```javascript
// src/core/library-loader.js
const libraryMap = {
  'd3': 'https://cdn.jsdelivr.net/npm/d3@7/+esm',
  'three': 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm',
  'matter-js': 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm'
};

export async function loadLibrary(name) {
  if (window[name]) return window[name];
  
  const module = await import(libraryMap[name]);
  window[name] = module;
  return module;
}
```

### 2.3 Implement Intersection Observer
```javascript
// src/core/lazy-visualization.js
export function lazyLoadVisualization(container, loader) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loader();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  
  observer.observe(container);
}
```

### 2.4 Optimize Service Worker
```javascript
// sw.js updates
const VISUALIZATION_CACHE = 'viz-cache-v1';

// Cache visualization modules after first load
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/visualizations/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request)
          .then(response => {
            const responseClone = response.clone();
            caches.open(VISUALIZATION_CACHE).then(cache => {
              cache.put(event.request, responseClone);
            });
            return response;
          })
        )
    );
  }
});
```

## Phase 3: Build Process Setup (1-2 days)

### 3.1 Add Vite Build Configuration
```bash
npm install --save-dev vite @vitejs/plugin-legacy
```

### 3.2 Create Build Scripts
```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "build:visualizations": "node scripts/build-visualizations.js"
  }
}
```

### 3.3 GitHub Actions Workflow
```yaml
# .github/workflows/build.yml
name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
```

## Phase 4: Specific Visualization Integration (2-3 days)

### 4.1 Chapter Mappings
- Chapter 1 (Ego) → Mandala visualization (needs creation)
- Chapter 2 (Shadow) → Shadow Integration Demo ✓
- Chapter 3 (Syzygy) → Anima/Animus Constellation ✓
- Chapter 4 (Christ Figure) → Fish Symbol Timeline ✓
- Chapter 5 (Symbols) → Symbol Explorer (needs creation)
- Chapter 6 (Self) → Self Mandala (needs creation)
- Chapter 7 (Prophecies) → Aion Clock ✓
- Chapter 8 (History) → Historical Timeline (needs creation)
- Chapter 9 (Gnostic Symbols) → Gnostic Cosmology Map ✓
- Chapter 10 (Fish) → Fish Symbol Timeline ✓
- Chapter 11 (Alchemy) → Alchemical Transformation Lab ✓
- Chapter 12 (Sol) → Solar Symbolism (needs creation)
- Chapter 13 (Lapis) → Philosopher's Stone (needs creation)
- Chapter 14 (Structure) → Archetype Constellation ✓

### 4.2 Integration Template
```html
<!-- chapters/enhanced/X/index.html -->
<div class="visualization-section">
  <div id="viz-container" class="viz-container">
    <div class="viz-loading">
      <div class="spinner"></div>
      <p>Loading interactive visualization...</p>
    </div>
  </div>
  <div class="viz-controls" id="viz-controls"></div>
</div>

<script type="module">
  import { VisualizationLoader } from '/src/core/visualization-loader.js';
  
  const chapterNum = 4; // Current chapter
  VisualizationLoader.loadForChapter(chapterNum)
    .then(viz => viz.init('#viz-container'))
    .catch(err => console.error('Visualization failed:', err));
</script>
```

## Phase 5: Performance Metrics & Monitoring (1 day)

### 5.1 Add Performance Tracking
```javascript
// Track visualization load times
performance.mark('viz-start');
await loadVisualization();
performance.mark('viz-end');
performance.measure('viz-load', 'viz-start', 'viz-end');
```

### 5.2 Bundle Analysis
```bash
npm install --save-dev rollup-plugin-visualizer
# Generate bundle analysis report
npm run build -- --report
```

### 5.3 Lighthouse CI
```yaml
# Add to GitHub Actions
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://akshaybapat6365.github.io/aion-visualization/
      https://akshaybapat6365.github.io/aion-visualization/chapters/enhanced/1/
```

## Performance Goals

### Before Optimization
- Initial Load: ~8-10s
- Bundle Size: ~2MB
- Lighthouse Score: ~60-70

### After Optimization
- Initial Load: <2s
- Bundle Size: <200KB (initial)
- Lighthouse Score: >90
- Lazy loaded chunks: <100KB each

## Implementation Priority

1. **Week 1**: Quick Integration + Performance Optimization
   - Visualization registry and loader
   - Update chapter pages
   - Implement code splitting
   - Lazy loading

2. **Week 2**: Build Process + Specific Integration
   - Setup Vite build
   - GitHub Actions workflow
   - Integrate all visualizations
   - Performance monitoring

## Testing Checklist

- [ ] Each visualization loads correctly in its chapter
- [ ] No console errors
- [ ] Performance metrics meet goals
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Service worker caches properly
- [ ] Fallbacks for failed loads
- [ ] Accessibility features intact

## Quick Wins for Immediate Performance

1. **Remove global Three.js/D3.js imports** from index.html
2. **Add loading="lazy"** to all images
3. **Preconnect to CDNs**: `<link rel="preconnect" href="https://cdn.jsdelivr.net">`
4. **Minify inline CSS/JS** in HTML files
5. **Enable gzip** in GitHub Pages (already enabled)
6. **Add resource hints** for critical resources

This plan addresses both the integration of visualizations and performance optimization, with a focus on progressive enhancement and maintaining the site's functionality throughout the process.