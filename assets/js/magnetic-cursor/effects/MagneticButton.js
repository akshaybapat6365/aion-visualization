/**
 * MagneticButton.js
 * Enhanced button component with magnetic cursor interaction
 * Creates engaging hover effects that respond to cursor movement
 */

import { MagneticInteraction } from '../core/MagneticInteraction.js';

export class MagneticButton {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      fieldStrength: 120,
      fieldRadius: 100,
      maxDisplacement: 25,
      elasticity: 0.1,
      friction: 0.9,
      scaleOnHover: 1.05,
      tiltAmount: 15,
      glowIntensity: 0.3,
      ...options
    };

    this.magneticInteraction = null;
    this.isHovered = false;
    this.glowElement = null;
    this.textElement = null;

    this.init();
  }

  init() {
    this.setupStructure();
    this.setupMagneticInteraction();
    this.setupEventListeners();
    this.applyStyles();
  }

  setupStructure() {
    // Ensure button has relative positioning
    this.element.style.position = 'relative';
    this.element.style.overflow = 'visible';

    // Find or create text element
    this.textElement = this.element.querySelector('.magnetic-text') || this.element;

    // Create glow element
    this.glowElement = document.createElement('div');
    this.glowElement.className = 'magnetic-glow';
    this.glowElement.style.cssText = `
      position: absolute;
      top: -20%;
      left: -20%;
      width: 140%;
      height: 140%;
      background: radial-gradient(circle, rgba(255,255,255,${this.options.glowIntensity}) 0%, transparent 70%);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      z-index: -1;
    `;
    this.element.appendChild(this.glowElement);
  }

  setupMagneticInteraction() {
    this.magneticInteraction = new MagneticInteraction({
      defaultFieldStrength: this.options.fieldStrength,
      defaultFieldRadius: this.options.fieldRadius,
      maxDisplacement: this.options.maxDisplacement,
      elasticity: this.options.elasticity,
      friction: this.options.friction
    });

    this.magneticInteraction.addMagneticElement(this.element, {
      onEnter: () => this.handleEnter(),
      onLeave: () => this.handleLeave(),
      onMove: (element, displacement, distance) => this.handleMove(displacement, distance)
    });
  }

  setupEventListeners() {
    // Additional hover effects
    this.element.addEventListener('mouseenter', () => {
      this.element.style.transition = 'transform 0.3s ease';
      this.element.style.transform = `scale(${this.options.scaleOnHover})`;
    });

    this.element.addEventListener('mouseleave', () => {
      this.element.style.transform = 'scale(1)';
    });

    // Click effect
    this.element.addEventListener('click', () => {
      this.playClickAnimation();
    });
  }

  applyStyles() {
    // Add custom CSS variables for dynamic styling
    this.element.style.setProperty('--magnetic-strength', this.options.fieldStrength);
    this.element.style.setProperty('--magnetic-radius', `${this.options.fieldRadius}px`);
    
    // Ensure smooth transitions
    this.element.style.willChange = 'transform';
  }

  handleEnter() {
    this.isHovered = true;
    this.glowElement.style.opacity = '1';
    this.element.classList.add('magnetic-active');
  }

  handleLeave() {
    this.isHovered = false;
    this.glowElement.style.opacity = '0';
    this.element.classList.remove('magnetic-active');
    
    // Reset tilt
    this.element.style.transform = 'scale(1) rotateX(0) rotateY(0)';
  }

  handleMove(displacement, distance) {
    if (!this.isHovered) return;

    // Calculate normalized displacement (-1 to 1)
    const normalizedX = displacement.x / this.options.maxDisplacement;
    const normalizedY = displacement.y / this.options.maxDisplacement;

    // Apply 3D tilt effect
    const tiltX = -normalizedY * this.options.tiltAmount;
    const tiltY = normalizedX * this.options.tiltAmount;

    // Update transform with tilt
    const scale = this.options.scaleOnHover;
    this.element.style.transform = `
      scale(${scale})
      rotateX(${tiltX}deg)
      rotateY(${tiltY}deg)
      translateZ(10px)
    `;

    // Move glow with cursor
    const glowX = 50 + normalizedX * 30;
    const glowY = 50 + normalizedY * 30;
    this.glowElement.style.background = `
      radial-gradient(circle at ${glowX}% ${glowY}%, 
        rgba(255,255,255,${this.options.glowIntensity}) 0%, 
        transparent 70%
      )
    `;

    // Optional: Move text slightly in opposite direction for depth
    if (this.textElement && this.textElement !== this.element) {
      this.textElement.style.transform = `
        translate3d(${-displacement.x * 0.1}px, ${-displacement.y * 0.1}px, 5px)
      `;
    }
  }

  playClickAnimation() {
    // Quick scale pulse
    this.element.style.transition = 'transform 0.1s ease';
    this.element.style.transform = `scale(${this.options.scaleOnHover * 0.95})`;
    
    setTimeout(() => {
      this.element.style.transform = `scale(${this.options.scaleOnHover})`;
    }, 100);

    // Ripple effect
    this.createRipple();
  }

  createRipple() {
    const ripple = document.createElement('div');
    ripple.className = 'magnetic-ripple';
    ripple.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255,255,255,0.5);
      transform: translate(-50%, -50%);
      pointer-events: none;
    `;

    this.element.appendChild(ripple);

    // Animate ripple
    requestAnimationFrame(() => {
      ripple.style.transition = 'all 0.6s ease-out';
      ripple.style.width = '200%';
      ripple.style.height = '200%';
      ripple.style.opacity = '0';
    });

    // Remove after animation
    setTimeout(() => ripple.remove(), 600);
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    // Update magnetic interaction
    if (this.magneticInteraction) {
      this.magneticInteraction.magneticElements.get(this.element).fieldStrength = this.options.fieldStrength;
      this.magneticInteraction.magneticElements.get(this.element).fieldRadius = this.options.fieldRadius;
    }

    this.applyStyles();
  }

  enable() {
    if (this.magneticInteraction) {
      this.magneticInteraction.enable();
    }
  }

  disable() {
    if (this.magneticInteraction) {
      this.magneticInteraction.disable();
    }
  }

  destroy() {
    // Clean up magnetic interaction
    if (this.magneticInteraction) {
      this.magneticInteraction.destroy();
    }

    // Remove added elements
    if (this.glowElement) {
      this.glowElement.remove();
    }

    // Reset styles
    this.element.style.transform = '';
    this.element.classList.remove('magnetic-active');
  }
}