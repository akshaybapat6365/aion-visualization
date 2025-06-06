/**
 * Magnetic Cursor System
 * 
 * Custom cursor with magnetic attraction to interactive elements.
 * Provides subtle visual feedback and enhances the premium feel
 * of the interface through physics-based interactions.
 * 
 * Premium Design System Component
 */

class MagneticCursor {
  constructor(options = {}) {
    this.options = {
      // Magnetic behavior
      magneticStrength: options.magneticStrength || 0.3,
      magneticRadius: options.magneticRadius || 80,
      
      // Visual properties
      cursorSize: options.cursorSize || 8,
      trailLength: options.trailLength || 8,
      
      // Performance
      updateInterval: options.updateInterval || 16, // ~60fps
      
      // Selectors for magnetic targets
      magneticTargets: options.magneticTargets || [
        '.chapter-link',
        '.concept-node', 
        '.nav-item',
        'button',
        'a[href]',
        '[data-magnetic]'
      ],
      
      ...options
    };
    
    this.cursor = null;
    this.trail = [];
    this.mouse = { x: 0, y: 0 };
    this.cursorPos = { x: 0, y: 0 };
    this.isVisible = false;
    this.currentTarget = null;
    
    this.init();
  }
  
  init() {
    // Only initialize on devices with mouse input
    if (!this.hasMouseInput()) {
      return;
    }
    
    this.createCursor();
    this.bindEvents();
    this.startAnimation();
    
    // Hide default cursor
    document.body.style.cursor = 'none';
  }
  
  hasMouseInput() {
    // Check if device has mouse input (not touch-only)
    return window.matchMedia('(pointer: fine)').matches;
  }
  
  createCursor() {
    // Create cursor container
    this.cursorContainer = document.createElement('div');
    this.cursorContainer.className = 'magnetic-cursor-container';
    this.cursorContainer.innerHTML = `
      <div class="magnetic-cursor">
        <div class="magnetic-cursor__dot"></div>
        <div class="magnetic-cursor__ring"></div>
      </div>
      <div class="magnetic-cursor-trail"></div>
    `;
    
    document.body.appendChild(this.cursorContainer);
    
    this.cursor = this.cursorContainer.querySelector('.magnetic-cursor');
    this.cursorDot = this.cursorContainer.querySelector('.magnetic-cursor__dot');
    this.cursorRing = this.cursorContainer.querySelector('.magnetic-cursor__ring');
    this.trailContainer = this.cursorContainer.querySelector('.magnetic-cursor-trail');
    
    // Create trail elements
    for (let i = 0; i < this.options.trailLength; i++) {
      const trailDot = document.createElement('div');
      trailDot.className = 'magnetic-cursor-trail__dot';
      trailDot.style.opacity = (this.options.trailLength - i) / this.options.trailLength * 0.5;
      this.trailContainer.appendChild(trailDot);
      this.trail.push({
        element: trailDot,
        x: 0,
        y: 0
      });
    }
  }
  
  bindEvents() {
    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      
      if (!this.isVisible) {
        this.show();
      }
      
      this.updateMagneticTarget(e);
    });
    
    // Mouse enter/leave
    document.addEventListener('mouseenter', () => this.show());
    document.addEventListener('mouseleave', () => this.hide());
    
    // Click events
    document.addEventListener('mousedown', () => this.setState('active'));
    document.addEventListener('mouseup', () => this.setState('default'));
    
    // Hover events for interactive elements
    this.bindMagneticEvents();
  }
  
  bindMagneticEvents() {
    this.options.magneticTargets.forEach(selector => {
      document.addEventListener('mouseenter', (e) => {
        if (e.target.matches(selector)) {
          this.setMagneticTarget(e.target);
        }
      }, true);
      
      document.addEventListener('mouseleave', (e) => {
        if (e.target.matches(selector)) {
          this.clearMagneticTarget(e.target);
        }
      }, true);
    });
  }
  
  updateMagneticTarget(mouseEvent) {
    if (!this.currentTarget) return;
    
    const rect = this.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distance = Math.sqrt(
      Math.pow(this.mouse.x - centerX, 2) + 
      Math.pow(this.mouse.y - centerY, 2)
    );
    
    if (distance <= this.options.magneticRadius) {
      // Apply magnetic attraction
      const attraction = Math.max(0, 1 - distance / this.options.magneticRadius);
      const pullX = (centerX - this.mouse.x) * attraction * this.options.magneticStrength;
      const pullY = (centerY - this.mouse.y) * attraction * this.options.magneticStrength;
      
      this.cursorPos.x = this.mouse.x + pullX;
      this.cursorPos.y = this.mouse.y + pullY;
    } else {
      this.cursorPos.x = this.mouse.x;
      this.cursorPos.y = this.mouse.y;
    }
  }
  
  setMagneticTarget(element) {
    this.currentTarget = element;
    this.setState('hover');
    
    // Add magnetic effect to target element
    element.style.transition = 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
    element.style.transform = 'scale(1.05)';
  }
  
  clearMagneticTarget(element) {
    if (this.currentTarget === element) {
      this.currentTarget = null;
      this.setState('default');
      
      // Remove magnetic effect from target element
      element.style.transform = 'scale(1)';
    }
  }
  
  setState(state) {
    this.cursor.className = `magnetic-cursor magnetic-cursor--${state}`;
    
    switch (state) {
      case 'hover':
        this.cursorRing.style.transform = 'scale(1.5)';
        this.cursorRing.style.opacity = '0.3';
        break;
      case 'active':
        this.cursorRing.style.transform = 'scale(0.8)';
        this.cursorRing.style.opacity = '0.8';
        break;
      default:
        this.cursorRing.style.transform = 'scale(1)';
        this.cursorRing.style.opacity = '0.2';
    }
  }
  
  startAnimation() {
    const animate = () => {
      this.updatePosition();
      this.updateTrail();
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  updatePosition() {
    if (!this.isVisible) return;
    
    // Smooth cursor movement
    if (!this.currentTarget) {
      this.cursorPos.x = this.mouse.x;
      this.cursorPos.y = this.mouse.y;
    }
    
    // Apply position
    this.cursor.style.transform = `translate3d(${this.cursorPos.x}px, ${this.cursorPos.y}px, 0)`;
  }
  
  updateTrail() {
    if (!this.isVisible) return;
    
    // Update trail positions with delay
    for (let i = this.trail.length - 1; i > 0; i--) {
      this.trail[i].x = this.trail[i - 1].x;
      this.trail[i].y = this.trail[i - 1].y;
    }
    
    // First trail element follows cursor with slight delay
    this.trail[0].x += (this.cursorPos.x - this.trail[0].x) * 0.3;
    this.trail[0].y += (this.cursorPos.y - this.trail[0].y) * 0.3;
    
    // Apply positions to trail elements
    this.trail.forEach((dot, index) => {
      dot.element.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0)`;
    });
  }
  
  show() {
    this.isVisible = true;
    this.cursorContainer.style.opacity = '1';
    this.cursorContainer.style.visibility = 'visible';
  }
  
  hide() {
    this.isVisible = false;
    this.cursorContainer.style.opacity = '0';
    this.cursorContainer.style.visibility = 'hidden';
  }
  
  destroy() {
    if (this.cursorContainer) {
      this.cursorContainer.remove();
    }
    
    // Restore default cursor
    document.body.style.cursor = 'auto';
  }
  
  // Public API methods
  setMagneticStrength(strength) {
    this.options.magneticStrength = Math.max(0, Math.min(1, strength));
  }
  
  setMagneticRadius(radius) {
    this.options.magneticRadius = Math.max(0, radius);
  }
  
  addMagneticTarget(selector) {
    if (!this.options.magneticTargets.includes(selector)) {
      this.options.magneticTargets.push(selector);
      this.bindMagneticEvents();
    }
  }
  
  removeMagneticTarget(selector) {
    const index = this.options.magneticTargets.indexOf(selector);
    if (index > -1) {
      this.options.magneticTargets.splice(index, 1);
    }
  }
}

// Auto-initialize if not in module environment
if (typeof module === 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on desktop devices
    if (window.matchMedia('(pointer: fine)').matches) {
      window.magneticCursor = new MagneticCursor();
    }
  });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MagneticCursor;
}

// CSS styles (to be included in the main CSS)
const magneticCursorStyles = `
.magnetic-cursor-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.magnetic-cursor {
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.magnetic-cursor__dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: var(--text-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.magnetic-cursor__ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 32px;
  height: 32px;
  border: 1px solid var(--text-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.2;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.magnetic-cursor-trail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.magnetic-cursor-trail__dot {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 4px;
  background: var(--text-primary);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 0.3s ease;
}

/* State variations */
.magnetic-cursor--hover .magnetic-cursor__dot {
  background: var(--text-secondary);
  transform: translate(-50%, -50%) scale(1.2);
}

.magnetic-cursor--active .magnetic-cursor__dot {
  background: var(--text-primary);
  transform: translate(-50%, -50%) scale(0.8);
}

.magnetic-cursor--active .magnetic-cursor__ring {
  border-color: var(--text-primary);
}

/* Hide on touch devices */
@media (pointer: coarse) {
  .magnetic-cursor-container {
    display: none;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .magnetic-cursor__dot,
  .magnetic-cursor__ring {
    transition: none;
  }
  
  .magnetic-cursor-trail {
    display: none;
  }
}
`;