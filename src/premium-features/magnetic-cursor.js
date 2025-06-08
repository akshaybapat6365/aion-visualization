/**
 * Magnetic Cursor Interactions
 * Premium cursor effects with physics-based magnetic attraction
 * 
 * Features:
 * - Custom cursor design
 * - Magnetic attraction to interactive elements
 * - Smooth physics-based movement
 * - Trail effect in visualization spaces
 * - Performance optimized with RAF
 */

export class MagneticCursor {
  constructor(options = {}) {
    this.options = {
      magnetStrength: 0.3,
      magnetDistance: 100,
      smoothing: 0.2,
      trailLength: 10,
      showTrail: false,
      customClass: '',
      ...options
    };
    
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
    this.trail = [];
    this.magneticElements = new Set();
    this.isActive = false;
    
    this.init();
  }

  init() {
    this.createCursor();
    this.injectStyles();
    this.setupEventListeners();
    this.startAnimation();
  }

  createCursor() {
    // Hide default cursor
    document.documentElement.style.cursor = 'none';
    
    // Create custom cursor
    this.cursor = document.createElement('div');
    this.cursor.className = `magnetic-cursor ${this.options.customClass}`;
    this.cursor.innerHTML = `
      <div class="cursor-dot"></div>
      <div class="cursor-ring"></div>
      <svg class="cursor-trail" viewBox="0 0 100 100">
        <path class="trail-path" d="" fill="none" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;
    
    document.body.appendChild(this.cursor);
    
    // Get cursor elements
    this.dot = this.cursor.querySelector('.cursor-dot');
    this.ring = this.cursor.querySelector('.cursor-ring');
    this.trailPath = this.cursor.querySelector('.trail-path');
  }

  injectStyles() {
    if (document.getElementById('magnetic-cursor-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'magnetic-cursor-styles';
    styles.textContent = `
      /* Hide default cursor globally */
      * {
        cursor: none !important;
      }
      
      .magnetic-cursor {
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        mix-blend-mode: difference;
        will-change: transform;
      }
      
      .cursor-dot {
        position: absolute;
        width: 8px;
        height: 8px;
        background: var(--grey-050, #F0F0F0);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: transform 0.15s ease;
      }
      
      .cursor-ring {
        position: absolute;
        width: 40px;
        height: 40px;
        border: 1px solid var(--grey-050, #F0F0F0);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: all 0.3s ease;
        opacity: 0.5;
      }
      
      .cursor-trail {
        position: absolute;
        width: 200px;
        height: 200px;
        transform: translate(-50%, -50%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      /* States */
      .magnetic-cursor.hovering .cursor-dot {
        transform: translate(-50%, -50%) scale(0.5);
      }
      
      .magnetic-cursor.hovering .cursor-ring {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0.8;
      }
      
      .magnetic-cursor.clicking .cursor-dot {
        transform: translate(-50%, -50%) scale(0.3);
      }
      
      .magnetic-cursor.clicking .cursor-ring {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 1;
      }
      
      .magnetic-cursor.trailing .cursor-trail {
        opacity: 0.3;
      }
      
      /* Magnetic elements */
      .magnetic-element {
        transition: transform 0.3s ease;
        will-change: transform;
      }
      
      /* Performance */
      .magnetic-cursor * {
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      
      /* Hide on touch devices */
      @media (hover: none) {
        .magnetic-cursor {
          display: none;
        }
        
        * {
          cursor: auto !important;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  setupEventListeners() {
    // Mouse movement
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Mouse enter/leave window
    document.addEventListener('mouseenter', () => this.show());
    document.addEventListener('mouseleave', () => this.hide());
    
    // Click events
    document.addEventListener('mousedown', () => this.cursor.classList.add('clicking'));
    document.addEventListener('mouseup', () => this.cursor.classList.remove('clicking'));
    
    // Find magnetic elements
    this.updateMagneticElements();
    
    // Update on DOM changes
    const observer = new MutationObserver(() => this.updateMagneticElements());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  handleMouseMove(e) {
    try {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
      
      if (!this.isActive) {
        this.position.x = this.target.x;
        this.position.y = this.target.y;
        this.show();
      }
      
      // Check for magnetic elements
      this.checkMagneticElements(e);
      
      // Update trail
      if (this.options.showTrail) {
        this.updateTrail();
      }
    } catch (error) {
      console.error('Magnetic cursor error:', error);
    }
  }

  updateMagneticElements() {
    this.magneticElements.clear();
    
    // Find all elements with magnetic properties
    const selectors = [
      'a',
      'button',
      '.magnetic-element',
      '[data-magnetic]',
      '.card',
      '.chapter-card'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        this.magneticElements.add(el);
      });
    });
  }

  checkMagneticElements(e) {
    let closestElement = null;
    let closestDistance = Infinity;
    
    this.magneticElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      
      if (distance < this.options.magnetDistance && distance < closestDistance) {
        closestDistance = distance;
        closestElement = element;
      }
    });
    
    if (closestElement) {
      this.attractToElement(closestElement, closestDistance);
      this.cursor.classList.add('hovering');
    } else {
      this.releaseElement();
      this.cursor.classList.remove('hovering');
    }
  }

  attractToElement(element, distance) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate magnetic force
    const force = 1 - (distance / this.options.magnetDistance);
    const magnetX = (centerX - this.target.x) * force * this.options.magnetStrength;
    const magnetY = (centerY - this.target.y) * force * this.options.magnetStrength;
    
    // Apply force to target
    this.target.x += magnetX;
    this.target.y += magnetY;
    
    // Move element slightly toward cursor
    const elementForce = force * 0.1;
    element.style.transform = `translate(${-magnetX * elementForce}px, ${-magnetY * elementForce}px)`;
  }

  releaseElement() {
    this.magneticElements.forEach(element => {
      element.style.transform = '';
    });
  }

  updateTrail() {
    this.trail.push({ x: this.position.x, y: this.position.y });
    
    if (this.trail.length > this.options.trailLength) {
      this.trail.shift();
    }
    
    if (this.trail.length > 1) {
      const pathData = this.trail.reduce((path, point, i) => {
        const cmd = i === 0 ? 'M' : 'L';
        return `${path} ${cmd} ${point.x},${point.y}`;
      }, '');
      
      this.trailPath.setAttribute('d', pathData);
      this.cursor.classList.add('trailing');
    }
  }

  startAnimation() {
    const animate = () => {
      // Smooth cursor movement
      const dx = this.target.x - this.position.x;
      const dy = this.target.y - this.position.y;
      
      this.velocity.x = dx * this.options.smoothing;
      this.velocity.y = dy * this.options.smoothing;
      
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      
      // Update cursor position
      this.cursor.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
      
      // Continue animation
      if (this.isActive) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  show() {
    this.isActive = true;
    this.cursor.style.opacity = '1';
    this.startAnimation();
  }

  hide() {
    this.isActive = false;
    this.cursor.style.opacity = '0';
  }

  // Public API
  setMagnetStrength(strength) {
    this.options.magnetStrength = strength;
  }

  enableTrail() {
    this.options.showTrail = true;
  }

  disableTrail() {
    this.options.showTrail = false;
    this.trail = [];
    this.cursor.classList.remove('trailing');
  }

  addMagneticElement(element) {
    this.magneticElements.add(element);
  }

  removeMagneticElement(element) {
    this.magneticElements.delete(element);
  }

  destroy() {
    document.documentElement.style.cursor = '';
    this.cursor?.remove();
    document.getElementById('magnetic-cursor-styles')?.remove();
    this.releaseElement();
  }
}

// Auto-initialize
export function initMagneticCursor(options = {}) {
  // Only initialize on desktop devices with hover capability
  if (window.matchMedia('(hover: hover)').matches) {
    return new MagneticCursor(options);
  }
  return null;
}

// Export for use in other modules
export default MagneticCursor;