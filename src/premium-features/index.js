/**
 * Premium Features Integration
 * Orchestrates all premium features for Aion Visualization
 */

import { initLiquidMorphing } from './liquid-morphing.js';
import { initMagneticCursor } from './magnetic-cursor.js';

class PremiumFeatures {
  constructor() {
    this.features = {
      liquidMorphing: null,
      magneticCursor: null
    };
    
    this.init();
  }

  init() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
      this.initLiquidMorphing();
      this.initMagneticCursor();
    }
    
    this.setupPerformanceMonitoring();
    this.injectPremiumStyles();
  }

  initLiquidMorphing() {
    this.features.liquidMorphing = initLiquidMorphing();
    
    // Add data-transition attribute to chapter links
    document.querySelectorAll('a[href*="/chapters/"]').forEach(link => {
      link.setAttribute('data-transition', 'morph');
    });
    
    console.log('✨ Liquid morphing transitions initialized');
  }

  initMagneticCursor() {
    this.features.magneticCursor = initMagneticCursor({
      magnetStrength: 0.3,
      magnetDistance: 80,
      smoothing: 0.15
    });
    
    // Add magnetic properties to specific elements
    document.querySelectorAll('.button, .card, .chapter-card').forEach(el => {
      el.classList.add('magnetic-element');
    });
    
    console.log('✨ Magnetic cursor initialized');
  }

  setupPerformanceMonitoring() {
    // Monitor FPS for premium animations
    let lastTime = performance.now();
    let frames = 0;
    let fps = 0;
    
    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        
        // Reduce animation quality if FPS drops
        if (fps < 30 && this.features.magneticCursor) {
          this.features.magneticCursor.setMagnetStrength(0.1);
          console.warn('⚠️ Reducing animation quality due to low FPS:', fps);
        } else if (fps > 50 && this.features.magneticCursor) {
          this.features.magneticCursor.setMagnetStrength(0.3);
        }
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    // Start monitoring after page load
    window.addEventListener('load', () => {
      requestAnimationFrame(measureFPS);
    });
  }

  injectPremiumStyles() {
    const styles = document.createElement('style');
    styles.id = 'premium-features-styles';
    styles.textContent = `
      /* Premium Feature Enhancements */
      
      /* Smooth page transitions */
      body {
        transition: opacity 0.3s ease;
      }
      
      body.transitioning {
        opacity: 0.8;
      }
      
      /* Enhanced focus states */
      :focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--grey-050, #F0F0F0);
        transition: box-shadow 0.2s ease;
      }
      
      /* Premium hover effects */
      .magnetic-element {
        position: relative;
        overflow: hidden;
      }
      
      .magnetic-element::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        transform: translate(-50%, -50%);
        transition: width 0.6s ease, height 0.6s ease;
        pointer-events: none;
      }
      
      .magnetic-element:hover::before {
        width: 200%;
        height: 200%;
      }
      
      /* Premium loading animation */
      @keyframes premiumPulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }
      
      .premium-loading {
        animation: premiumPulse 2s ease-in-out infinite;
      }
      
      /* Smooth scroll behavior */
      html {
        scroll-behavior: smooth;
      }
      
      /* Selection color */
      ::selection {
        background: var(--grey-700, #1F1F1F);
        color: var(--grey-050, #F0F0F0);
      }
      
      /* Premium scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: var(--grey-900, #0A0A0A);
      }
      
      ::-webkit-scrollbar-thumb {
        background: var(--grey-700, #1F1F1F);
        border-radius: 4px;
        transition: background 0.3s ease;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: var(--grey-600, #2A2A2A);
      }
      
      /* Disable animations for performance mode */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  // Public API
  enableTrail() {
    this.features.magneticCursor?.enableTrail();
  }

  disableTrail() {
    this.features.magneticCursor?.disableTrail();
  }

  setTransitionDirection(direction) {
    this.features.liquidMorphing?.setDirection(direction);
  }

  destroy() {
    this.features.liquidMorphing?.destroy();
    this.features.magneticCursor?.destroy();
    document.getElementById('premium-features-styles')?.remove();
  }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.premiumFeatures = new PremiumFeatures();
  });
} else {
  window.premiumFeatures = new PremiumFeatures();
}

export default PremiumFeatures;