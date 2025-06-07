/**
 * MagneticLink.js
 * Subtle magnetic effect for text links and navigation items
 * Creates elegant hover interactions with minimal displacement
 */

import { MagneticInteraction } from '../core/MagneticInteraction.js';

export class MagneticLink {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      fieldStrength: 80,
      fieldRadius: 60,
      maxDisplacement: 10,
      elasticity: 0.12,
      friction: 0.88,
      underlineEffect: true,
      colorShift: true,
      letterSpacing: 0.5,
      ...options
    };

    this.magneticInteraction = null;
    this.originalStyles = {};
    this.underlineElement = null;
    this.isHovered = false;

    this.init();
  }

  init() {
    this.captureOriginalStyles();
    this.setupStructure();
    this.setupMagneticInteraction();
    this.applyBaseStyles();
  }

  captureOriginalStyles() {
    const computed = window.getComputedStyle(this.element);
    this.originalStyles = {
      color: computed.color,
      letterSpacing: computed.letterSpacing,
      textDecoration: computed.textDecoration,
      transform: computed.transform
    };
  }

  setupStructure() {
    // Ensure inline-block for proper transforms
    this.element.style.display = 'inline-block';
    this.element.style.position = 'relative';

    // Create custom underline if enabled
    if (this.options.underlineEffect) {
      this.createUnderline();
    }
  }

  createUnderline() {
    this.underlineElement = document.createElement('span');
    this.underlineElement.className = 'magnetic-underline';
    this.underlineElement.style.cssText = `
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 1px;
      background: currentColor;
      transition: width 0.3s ease;
      transform-origin: left center;
    `;
    this.element.appendChild(this.underlineElement);

    // Remove default underline
    this.element.style.textDecoration = 'none';
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
      onMove: (element, displacement) => this.handleMove(displacement)
    });
  }

  applyBaseStyles() {
    this.element.style.transition = `
      color 0.3s ease,
      letter-spacing 0.3s ease
    `;
    this.element.style.willChange = 'transform';
    this.element.style.cursor = 'pointer';
  }

  handleEnter() {
    this.isHovered = true;
    this.element.classList.add('magnetic-link-active');

    // Animate underline
    if (this.underlineElement) {
      this.underlineElement.style.width = '100%';
    }

    // Letter spacing effect
    if (this.options.letterSpacing) {
      const currentSpacing = parseFloat(this.originalStyles.letterSpacing) || 0;
      this.element.style.letterSpacing = `${currentSpacing + this.options.letterSpacing}px`;
    }

    // Color shift effect
    if (this.options.colorShift) {
      this.applyColorShift(1);
    }
  }

  handleLeave() {
    this.isHovered = false;
    this.element.classList.remove('magnetic-link-active');

    // Reset underline
    if (this.underlineElement) {
      this.underlineElement.style.width = '0';
    }

    // Reset letter spacing
    this.element.style.letterSpacing = this.originalStyles.letterSpacing;

    // Reset color
    if (this.options.colorShift) {
      this.element.style.color = this.originalStyles.color;
    }
  }

  handleMove(displacement) {
    if (!this.isHovered) return;

    // Apply subtle skew based on displacement
    const skewX = displacement.x * 0.1;
    const skewY = displacement.y * 0.05;

    // Update transform (displacement is handled by MagneticInteraction)
    const currentTransform = this.element.style.transform;
    const baseTransform = currentTransform.replace(/skew\([^)]*\)/g, '').trim();
    this.element.style.transform = `${baseTransform} skew(${skewX}deg, ${skewY}deg)`;

    // Dynamic underline wave
    if (this.underlineElement) {
      const wave = Math.sin(Date.now() * 0.002) * 2;
      this.underlineElement.style.transform = `
        scaleY(${1 + Math.abs(displacement.y) * 0.1})
        translateY(${wave}px)
      `;
    }

    // Dynamic color shift based on position
    if (this.options.colorShift) {
      const intensity = Math.min(1, Math.sqrt(displacement.x ** 2 + displacement.y ** 2) / this.options.maxDisplacement);
      this.applyColorShift(intensity);
    }
  }

  applyColorShift(intensity) {
    // Parse original color
    const rgb = this.originalStyles.color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return;

    const [r, g, b] = rgb.map(Number);
    
    // Shift towards accent color (example: blue-ish tint)
    const shiftedR = Math.round(r * (1 - intensity * 0.2));
    const shiftedG = Math.round(g * (1 - intensity * 0.1));
    const shiftedB = Math.round(Math.min(255, b * (1 + intensity * 0.3)));

    this.element.style.color = `rgb(${shiftedR}, ${shiftedG}, ${shiftedB})`;
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    // Update magnetic interaction settings
    if (this.magneticInteraction) {
      const elementConfig = this.magneticInteraction.magneticElements.get(this.element);
      if (elementConfig) {
        elementConfig.fieldStrength = this.options.fieldStrength;
        elementConfig.fieldRadius = this.options.fieldRadius;
      }
    }
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
    this.reset();
  }

  reset() {
    // Reset all styles to original
    this.element.style.color = this.originalStyles.color;
    this.element.style.letterSpacing = this.originalStyles.letterSpacing;
    this.element.style.transform = this.originalStyles.transform || '';
    
    if (this.underlineElement) {
      this.underlineElement.style.width = '0';
    }
  }

  destroy() {
    // Clean up magnetic interaction
    if (this.magneticInteraction) {
      this.magneticInteraction.destroy();
    }

    // Remove custom elements
    if (this.underlineElement) {
      this.underlineElement.remove();
    }

    // Reset styles
    this.reset();
    this.element.style.textDecoration = this.originalStyles.textDecoration;
    this.element.classList.remove('magnetic-link-active');
  }
}