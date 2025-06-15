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
