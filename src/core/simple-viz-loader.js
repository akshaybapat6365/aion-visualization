// Simple Visualization Loader for Aion Project
const DEFAULT_INTENT_MESSAGE = 'Load interactive visualization';

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

let activeVisualization = null;
let currentIntentCleanup = null;

function getVizMap() {
  if (typeof window !== 'undefined' && window.__AION_VIZ_MAP__) {
    return window.__AION_VIZ_MAP__;
  }

  return vizMap;
}

function setLifecycleState(nextState) {
  if (typeof window === 'undefined') return;
  const current = window.__aionVizLifecycle || {
    disposeCalls: 0,
    routeCleanupCalls: 0,
    intentListeners: 0
  };

  window.__aionVizLifecycle = {
    ...current,
    ...nextState
  };
}

function clearIntentListenerCleanup() {
  if (typeof currentIntentCleanup === 'function') {
    currentIntentCleanup();
    currentIntentCleanup = null;
  }
  setLifecycleState({ intentListeners: 0 });
}

export function disposeActiveVisualization() {
  clearIntentListenerCleanup();

  if (activeVisualization && typeof activeVisualization.dispose === 'function') {
    activeVisualization.dispose();
    const disposeCalls = (typeof window !== 'undefined' ? window.__aionVizLifecycle?.disposeCalls : 0) || 0;
    setLifecycleState({ disposeCalls: disposeCalls + 1 });
  }

  activeVisualization = null;
}

export async function loadVisualization(chapterId, container) {
  const config = getVizMap()[chapterId];
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
      activeVisualization = await module[config.init](container);
    } else if (config.className && module[config.className]) {
      // Class-based initialization
      const VizClass = module[config.className];
      activeVisualization = new VizClass(container);
    } else if (module.default) {
      // Default export
      if (typeof module.default === 'function') {
        activeVisualization = await module.default(container);
      } else {
        activeVisualization = new module.default(container);
      }
    } else {
      throw new Error('Could not find initialization method');
    }

    return activeVisualization;
  } catch (error) {
    console.error(`Failed to load visualization for ${chapterId}:`, error);
    if (container) {
      container.innerHTML = '<div class="viz-error">Failed to load visualization. Please try refreshing the page.</div>';
    }
    return null;
  }
}

export function setupVisualizationIntent(chapterId, container) {
  if (!container || !chapterId) return;

  clearIntentListenerCleanup();
  container.innerHTML = '';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'viz-intent-trigger';
  button.textContent = container.dataset.intentLabel || DEFAULT_INTENT_MESSAGE;
  button.setAttribute('aria-label', `Initialize visualization for ${chapterId}`);
  container.appendChild(button);

  const activate = async () => {
    button.disabled = true;
    await loadVisualization(chapterId, container);
    clearIntentListenerCleanup();
  };

  const onClick = () => {
    activate();
  };

  const onKeydown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  };

  button.addEventListener('click', onClick);
  button.addEventListener('keydown', onKeydown);
  setLifecycleState({ intentListeners: 2 });

  currentIntentCleanup = () => {
    button.removeEventListener('click', onClick);
    button.removeEventListener('keydown', onKeydown);
  };
}

// Helper to check if we should load visualization for current page
export function shouldLoadVisualization() {
  const path = window.location.pathname;
  const match = path.match(/chapter-?(\d+)/);
  return match ? `chapter-${match[1]}` : null;
}

// Auto-initialize on pages with viz containers
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    const vizContainer = document.getElementById('visualization-container');
    if (vizContainer) {
      const chapterId = shouldLoadVisualization();
      if (chapterId) {
        setupVisualizationIntent(chapterId, vizContainer);
      }
    }
  });

  document.addEventListener('aion:routeChange', () => {
    disposeActiveVisualization();
    const routeCleanupCalls = (typeof window !== 'undefined' ? window.__aionVizLifecycle?.routeCleanupCalls : 0) || 0;
    setLifecycleState({ routeCleanupCalls: routeCleanupCalls + 1 });
  });
}
