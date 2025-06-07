/**
 * Magnetic Cursor System
 * Main entry point for magnetic cursor interactions
 * Provides easy initialization and management of magnetic effects
 */

import { MagneticInteraction } from './core/MagneticInteraction.js';
import { MagneticButton } from './effects/MagneticButton.js';
import { MagneticLink } from './effects/MagneticLink.js';
import { MagneticTrail } from './effects/MagneticTrail.js';
import { 
  MagneticPresets, 
  TrailPresets, 
  ButtonPresets, 
  LinkPresets,
  getAutoPerformancePreset 
} from './config/presets.js';

class MagneticCursorSystem {
  constructor(options = {}) {
    this.options = {
      autoInit: true,
      enableTrail: true,
      enableButtons: true,
      enableLinks: true,
      performanceMode: 'auto',
      ...options
    };

    this.components = {
      interaction: null,
      trail: null,
      buttons: [],
      links: []
    };

    this.initialized = false;

    if (this.options.autoInit) {
      this.init();
    }
  }

  init() {
    if (this.initialized) return;

    // Get performance settings
    const perfSettings = this.options.performanceMode === 'auto' 
      ? getAutoPerformancePreset() 
      : this.options.performanceMode;

    // Initialize core interaction system
    this.components.interaction = new MagneticInteraction({
      ...MagneticPresets.standard,
      ...perfSettings
    });

    // Initialize trail if enabled
    if (this.options.enableTrail) {
      this.initTrail(perfSettings);
    }

    // Auto-detect and initialize elements
    if (this.options.enableButtons) {
      this.initButtons();
    }

    if (this.options.enableLinks) {
      this.initLinks();
    }

    // Set up mutation observer for dynamic content
    this.setupMutationObserver();

    this.initialized = true;
  }

  initTrail(perfSettings) {
    const trailOptions = {
      ...TrailPresets.standard,
      particleCount: perfSettings.particleCount || TrailPresets.standard.particleCount,
      glowAmount: perfSettings.enableGlow ? TrailPresets.standard.glowAmount : 0,
      connectDistance: perfSettings.enableConnections ? TrailPresets.standard.connectDistance : 0
    };

    this.components.trail = new MagneticTrail(trailOptions);
  }

  initButtons() {
    // Find all buttons and elements with magnetic-button class
    const buttons = document.querySelectorAll('button, .magnetic-button, [data-magnetic-button]');
    
    buttons.forEach(button => {
      // Skip if already initialized
      if (button.dataset.magneticInitialized) return;

      // Get preset from data attribute or use default
      const presetName = button.dataset.magneticPreset || 'standard';
      const preset = ButtonPresets[presetName] || ButtonPresets.standard;

      const magneticButton = new MagneticButton(button, preset);
      this.components.buttons.push(magneticButton);

      button.dataset.magneticInitialized = 'true';
    });
  }

  initLinks() {
    // Find all links and elements with magnetic-link class
    const links = document.querySelectorAll('a, .magnetic-link, [data-magnetic-link]');
    
    links.forEach(link => {
      // Skip if already initialized
      if (link.dataset.magneticInitialized) return;

      // Get preset from data attribute or use default
      const presetName = link.dataset.magneticPreset || 'standard';
      const preset = LinkPresets[presetName] || LinkPresets.standard;

      const magneticLink = new MagneticLink(link, preset);
      this.components.links.push(magneticLink);

      link.dataset.magneticInitialized = 'true';
    });
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            // Check if it's a magnetic element
            if (this.options.enableButtons && (
              node.matches('button, .magnetic-button, [data-magnetic-button]') ||
              node.querySelector('button, .magnetic-button, [data-magnetic-button]')
            )) {
              this.initButtons();
            }

            if (this.options.enableLinks && (
              node.matches('a, .magnetic-link, [data-magnetic-link]') ||
              node.querySelector('a, .magnetic-link, [data-magnetic-link]')
            )) {
              this.initLinks();
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Manual element initialization
  addButton(element, options = {}) {
    const magneticButton = new MagneticButton(element, {
      ...ButtonPresets.standard,
      ...options
    });
    this.components.buttons.push(magneticButton);
    return magneticButton;
  }

  addLink(element, options = {}) {
    const magneticLink = new MagneticLink(element, {
      ...LinkPresets.standard,
      ...options
    });
    this.components.links.push(magneticLink);
    return magneticLink;
  }

  addCustomElement(element, options = {}) {
    if (!this.components.interaction) {
      this.init();
    }
    
    this.components.interaction.addMagneticElement(element, options);
    return this;
  }

  // Control methods
  enable() {
    if (this.components.interaction) {
      this.components.interaction.enable();
    }
    if (this.components.trail) {
      this.components.trail.enable();
    }
    this.components.buttons.forEach(button => button.enable());
    this.components.links.forEach(link => link.enable());
  }

  disable() {
    if (this.components.interaction) {
      this.components.interaction.disable();
    }
    if (this.components.trail) {
      this.components.trail.disable();
    }
    this.components.buttons.forEach(button => button.disable());
    this.components.links.forEach(link => link.disable());
  }

  setTrailColor(color) {
    if (this.components.trail) {
      this.components.trail.setColor(color);
    }
  }

  updatePerformance(mode) {
    this.options.performanceMode = mode;
    const perfSettings = mode === 'auto' ? getAutoPerformancePreset() : mode;
    
    // Update trail
    if (this.components.trail) {
      this.components.trail.updateOptions({
        particleCount: perfSettings.particleCount,
        glowAmount: perfSettings.enableGlow ? 20 : 0
      });
    }

    // Update interaction smoothing
    if (this.components.interaction) {
      this.components.interaction.options.smoothingFactor = perfSettings.smoothingFactor;
    }
  }

  destroy() {
    // Destroy all components
    if (this.components.interaction) {
      this.components.interaction.destroy();
    }

    if (this.components.trail) {
      this.components.trail.destroy();
    }

    this.components.buttons.forEach(button => button.destroy());
    this.components.links.forEach(link => link.destroy());

    // Clear arrays
    this.components.buttons = [];
    this.components.links = [];

    this.initialized = false;
  }
}

// Export everything
export {
  MagneticCursorSystem,
  MagneticInteraction,
  MagneticButton,
  MagneticLink,
  MagneticTrail,
  MagneticPresets,
  TrailPresets,
  ButtonPresets,
  LinkPresets
};

// Auto-initialize if data attribute is present
if (document.currentScript?.dataset.autoInit === 'true') {
  window.magneticCursor = new MagneticCursorSystem();
}

// Make available globally
window.MagneticCursorSystem = MagneticCursorSystem;