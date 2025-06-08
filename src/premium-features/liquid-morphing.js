/**
 * Liquid Morphing Transitions
 * Premium page transition effects with organic liquid animations
 * 
 * Features:
 * - Smooth black ink spreading effect
 * - GPU-accelerated animations
 * - Configurable timing and easing
 * - Fallback for older browsers
 */

export class LiquidMorphing {
  constructor(options = {}) {
    this.options = {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      color: '#000000',
      direction: 'radial', // radial, horizontal, vertical, diagonal
      ...options
    };
    
    this.isAnimating = false;
    this.init();
  }

  init() {
    this.createMorphContainer();
    this.injectStyles();
    this.setupEventListeners();
  }

  createMorphContainer() {
    // Create the morph overlay
    this.morphOverlay = document.createElement('div');
    this.morphOverlay.className = 'liquid-morph-overlay';
    this.morphOverlay.innerHTML = `
      <svg class="liquid-morph-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="liquid-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="turbulence"/>
            <feColorMatrix in="turbulence" type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncA type="discrete" tableValues="0 .5 .5 .5 .5 .5 .5 .5 .5 1"/>
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="1"/>
            <feComposite operator="over" in2="SourceGraphic"/>
          </filter>
        </defs>
        <path 
          class="liquid-morph-path" 
          d="M 0,50 Q 25,50 50,50 T 100,50 L 100,100 L 0,100 Z"
          fill="${this.options.color}"
          filter="url(#liquid-filter)"
        />
      </svg>
    `;
    
    document.body.appendChild(this.morphOverlay);
  }

  injectStyles() {
    if (document.getElementById('liquid-morph-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'liquid-morph-styles';
    styles.textContent = `
      .liquid-morph-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        opacity: 0;
        will-change: opacity;
      }
      
      .liquid-morph-svg {
        position: absolute;
        width: 100%;
        height: 100%;
      }
      
      .liquid-morph-path {
        transform-origin: center;
        will-change: d, transform;
      }
      
      /* Animation classes */
      .liquid-morph-enter {
        animation: liquidMorphEnter ${this.options.duration}ms ${this.options.easing} forwards;
      }
      
      .liquid-morph-exit {
        animation: liquidMorphExit ${this.options.duration}ms ${this.options.easing} forwards;
      }
      
      @keyframes liquidMorphEnter {
        0% {
          opacity: 0;
          clip-path: circle(0% at var(--morph-x, 50%) var(--morph-y, 50%));
        }
        100% {
          opacity: 1;
          clip-path: circle(150% at var(--morph-x, 50%) var(--morph-y, 50%));
        }
      }
      
      @keyframes liquidMorphExit {
        0% {
          opacity: 1;
          clip-path: circle(150% at var(--morph-x, 50%) var(--morph-y, 50%));
        }
        100% {
          opacity: 0;
          clip-path: circle(0% at var(--morph-x, 50%) var(--morph-y, 50%));
        }
      }
      
      /* Direction variants */
      .liquid-morph-horizontal .liquid-morph-path {
        d: path('M 0,0 Q 50,10 100,0 L 100,100 L 0,100 Z');
      }
      
      .liquid-morph-vertical .liquid-morph-path {
        d: path('M 0,0 Q 10,50 0,100 L 100,100 L 100,0 Z');
      }
      
      .liquid-morph-diagonal .liquid-morph-path {
        d: path('M 0,0 Q 50,50 100,100 L 100,100 L 0,100 Z');
      }
      
      /* Performance optimization */
      .liquid-morph-active * {
        transform: translateZ(0);
        backface-visibility: hidden;
        perspective: 1000px;
      }
    `;
    
    document.head.appendChild(styles);
  }

  setupEventListeners() {
    // Track mouse position for origin-based animations
    document.addEventListener('mousemove', (e) => {
      this.lastMouseX = (e.clientX / window.innerWidth) * 100;
      this.lastMouseY = (e.clientY / window.innerHeight) * 100;
    });
  }

  async transition(targetElement, callback) {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const overlay = this.morphOverlay;
    
    // Set animation origin based on mouse position
    overlay.style.setProperty('--morph-x', `${this.lastMouseX || 50}%`);
    overlay.style.setProperty('--morph-y', `${this.lastMouseY || 50}%`);
    
    // Add direction class
    overlay.classList.add(`liquid-morph-${this.options.direction}`);
    
    // Phase 1: Enter animation
    overlay.classList.add('liquid-morph-enter', 'liquid-morph-active');
    overlay.style.opacity = '1';
    
    await this.wait(this.options.duration / 2);
    
    // Execute callback at peak of animation
    if (callback) callback();
    
    // Phase 2: Exit animation
    overlay.classList.remove('liquid-morph-enter');
    overlay.classList.add('liquid-morph-exit');
    
    await this.wait(this.options.duration / 2);
    
    // Cleanup
    overlay.classList.remove('liquid-morph-exit', 'liquid-morph-active', `liquid-morph-${this.options.direction}`);
    overlay.style.opacity = '0';
    
    this.isAnimating = false;
  }

  // Advanced morph with custom path
  async morphPath(fromPath, toPath, duration = 300) {
    const path = this.morphOverlay.querySelector('.liquid-morph-path');
    const steps = 60;
    const stepDuration = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const eased = this.easeInOutCubic(progress);
      const interpolated = this.interpolatePath(fromPath, toPath, eased);
      
      path.setAttribute('d', interpolated);
      await this.wait(stepDuration);
    }
  }

  // Create ripple effect from click point
  createRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'liquid-morph-ripple';
    ripple.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: ${this.options.color};
      opacity: 0.8;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 9998;
    `;
    
    document.body.appendChild(ripple);
    
    // Animate ripple
    requestAnimationFrame(() => {
      ripple.style.transition = `all ${this.options.duration}ms ${this.options.easing}`;
      ripple.style.width = '200vmax';
      ripple.style.height = '200vmax';
      ripple.style.opacity = '0';
    });
    
    setTimeout(() => ripple.remove(), this.options.duration);
  }

  // Utility functions
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  interpolatePath(path1, path2, progress) {
    // Simple linear interpolation between two paths
    // In production, use a proper SVG path interpolation library
    const regex = /[\d.]+/g;
    const nums1 = path1.match(regex).map(Number);
    const nums2 = path2.match(regex).map(Number);
    
    const interpolated = nums1.map((num, i) => 
      num + (nums2[i] - num) * progress
    );
    
    let result = path1;
    let index = 0;
    result = result.replace(regex, () => interpolated[index++].toFixed(2));
    
    return result;
  }

  // Public API
  setDirection(direction) {
    this.options.direction = direction;
  }

  setDuration(duration) {
    this.options.duration = duration;
    this.injectStyles(); // Update animation duration
  }

  destroy() {
    this.morphOverlay?.remove();
    document.getElementById('liquid-morph-styles')?.remove();
  }
}

// Auto-initialize for navigation
export function initLiquidMorphing() {
  const morph = new LiquidMorphing();
  
  // Intercept navigation clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-transition="morph"]');
    if (!link) return;
    
    e.preventDefault();
    const href = link.getAttribute('href');
    
    morph.transition(link, () => {
      window.location.href = href;
    });
  });
  
  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    morph.transition(null, () => {
      // Page content will update automatically
    });
  });
  
  return morph;
}

// Export for use in other modules
export default LiquidMorphing;