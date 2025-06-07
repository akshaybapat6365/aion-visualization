/**
 * MagneticInteraction.js
 * Main controller for magnetic cursor interactions
 * Manages magnetic fields, cursor tracking, and element interactions
 */

import { MagneticField } from './MagneticField.js';
import { CursorTracker } from './CursorTracker.js';

export class MagneticInteraction {
  constructor(options = {}) {
    this.options = {
      defaultFieldStrength: 100,
      defaultFieldRadius: 150,
      enabledByDefault: true,
      smoothingFactor: 0.15,
      maxDisplacement: 30,
      elasticity: 0.08,
      friction: 0.92,
      ...options
    };

    this.magneticElements = new Map();
    this.cursorTracker = null;
    this.magneticField = null;
    this.enabled = this.options.enabledByDefault;
    this.animationFrame = null;

    this.init();
  }

  init() {
    this.cursorTracker = new CursorTracker({
      smoothingFactor: this.options.smoothingFactor
    });

    this.magneticField = new MagneticField({
      fieldStrength: this.options.defaultFieldStrength,
      maxRadius: this.options.defaultFieldRadius
    });

    if (this.enabled) {
      this.start();
    }

    this.setupGlobalListeners();
  }

  setupGlobalListeners() {
    // Listen for system preferences
    if (window.matchMedia) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      prefersReducedMotion.addEventListener('change', (e) => {
        if (e.matches) {
          this.disable();
        }
      });

      // Check initial state
      if (prefersReducedMotion.matches) {
        this.disable();
      }
    }

    // Performance observer
    if ('PerformanceObserver' in window) {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 16.67) { // Slower than 60fps
            this.options.smoothingFactor = Math.min(0.3, this.options.smoothingFactor * 1.1);
          }
        }
      });

      perfObserver.observe({ entryTypes: ['measure'] });
    }
  }

  addMagneticElement(element, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
      console.warn('Invalid element provided to addMagneticElement');
      return;
    }

    const config = {
      fieldStrength: this.options.defaultFieldStrength,
      fieldRadius: this.options.defaultFieldRadius,
      onEnter: null,
      onLeave: null,
      onMove: null,
      displacement: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      originalTransform: window.getComputedStyle(element).transform,
      ...options
    };

    // Store element data
    this.magneticElements.set(element, config);

    // Add data attribute for CSS hooks
    element.dataset.magnetic = 'true';

    // Setup individual element listeners
    this.setupElementListeners(element);

    return this;
  }

  setupElementListeners(element) {
    const config = this.magneticElements.get(element);

    element.addEventListener('mouseenter', () => {
      if (config.onEnter) config.onEnter(element);
      element.dataset.magneticActive = 'true';
    });

    element.addEventListener('mouseleave', () => {
      if (config.onLeave) config.onLeave(element);
      element.dataset.magneticActive = 'false';
      
      // Animate back to original position
      this.animateReset(element);
    });
  }

  removeMagneticElement(element) {
    if (!this.magneticElements.has(element)) return;

    const config = this.magneticElements.get(element);
    
    // Reset transform
    element.style.transform = config.originalTransform || '';
    
    // Remove data attributes
    delete element.dataset.magnetic;
    delete element.dataset.magneticActive;

    // Remove from map
    this.magneticElements.delete(element);

    return this;
  }

  start() {
    if (this.animationFrame) return;

    const animate = () => {
      this.update();
      this.animationFrame = requestAnimationFrame(animate);
    };

    this.animationFrame = requestAnimationFrame(animate);
    this.enabled = true;
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.enabled = false;

    // Reset all elements
    this.magneticElements.forEach((config, element) => {
      element.style.transform = config.originalTransform || '';
    });
  }

  update() {
    if (!this.enabled || !this.cursorTracker.isActive) return;

    const cursorPos = this.cursorTracker.smoothPosition;
    const cursorVelocity = this.cursorTracker.getSmoothedVelocity();

    this.magneticElements.forEach((config, element) => {
      this.updateElement(element, config, cursorPos, cursorVelocity);
    });
  }

  updateElement(element, config, cursorPos, cursorVelocity) {
    const rect = element.getBoundingClientRect();
    const elementCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    // Calculate distance from cursor to element center
    const distance = Math.sqrt(
      (cursorPos.x - elementCenter.x) ** 2 +
      (cursorPos.y - elementCenter.y) ** 2
    );

    // Check if within magnetic field
    if (distance > config.fieldRadius) {
      // Outside field - animate back if needed
      if (Math.abs(config.displacement.x) > 0.1 || Math.abs(config.displacement.y) > 0.1) {
        this.animateReset(element);
      }
      return;
    }

    // Calculate magnetic force
    const force = this.magneticField.calculateForce(distance, config);

    // Direction from element to cursor
    const direction = {
      x: (cursorPos.x - elementCenter.x) / distance,
      y: (cursorPos.y - elementCenter.y) / distance
    };

    // Apply force in direction
    const targetDisplacement = {
      x: direction.x * force * this.options.maxDisplacement,
      y: direction.y * force * this.options.maxDisplacement
    };

    // Add cursor velocity influence
    targetDisplacement.x += cursorVelocity.x * 0.02;
    targetDisplacement.y += cursorVelocity.y * 0.02;

    // Update velocity with spring physics
    config.velocity.x += (targetDisplacement.x - config.displacement.x) * this.options.elasticity;
    config.velocity.y += (targetDisplacement.y - config.displacement.y) * this.options.elasticity;

    // Apply friction
    config.velocity.x *= this.options.friction;
    config.velocity.y *= this.options.friction;

    // Update displacement
    config.displacement.x += config.velocity.x;
    config.displacement.y += config.velocity.y;

    // Apply transform
    this.applyTransform(element, config);

    // Trigger callback
    if (config.onMove) {
      config.onMove(element, config.displacement, distance);
    }
  }

  animateReset(element) {
    const config = this.magneticElements.get(element);
    if (!config) return;

    const animate = () => {
      // Spring back to zero
      config.velocity.x += -config.displacement.x * this.options.elasticity;
      config.velocity.y += -config.displacement.y * this.options.elasticity;

      // Apply friction
      config.velocity.x *= this.options.friction;
      config.velocity.y *= this.options.friction;

      // Update displacement
      config.displacement.x += config.velocity.x;
      config.displacement.y += config.velocity.y;

      // Apply transform
      this.applyTransform(element, config);

      // Continue until settled
      if (Math.abs(config.displacement.x) > 0.01 || Math.abs(config.displacement.y) > 0.01) {
        requestAnimationFrame(animate);
      } else {
        // Fully reset
        config.displacement.x = 0;
        config.displacement.y = 0;
        config.velocity.x = 0;
        config.velocity.y = 0;
        element.style.transform = config.originalTransform || '';
      }
    };

    requestAnimationFrame(animate);
  }

  applyTransform(element, config) {
    const transform = `translate3d(${config.displacement.x}px, ${config.displacement.y}px, 0)`;
    
    if (config.originalTransform && config.originalTransform !== 'none') {
      element.style.transform = `${config.originalTransform} ${transform}`;
    } else {
      element.style.transform = transform;
    }
  }

  enable() {
    this.enabled = true;
    this.start();
  }

  disable() {
    this.enabled = false;
    this.stop();
  }

  destroy() {
    this.stop();

    // Clean up all elements
    this.magneticElements.forEach((config, element) => {
      this.removeMagneticElement(element);
    });

    // Destroy sub-components
    if (this.cursorTracker) {
      this.cursorTracker.destroy();
    }

    this.magneticElements.clear();
  }
}