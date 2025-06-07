/**
 * MagneticTrail.js
 * Creates a magnetic trail effect that follows the cursor
 * Particles are attracted to and repelled by magnetic elements
 */

export class MagneticTrail {
  constructor(options = {}) {
    this.options = {
      particleCount: 20,
      particleSize: 4,
      trailLength: 0.8,
      attraction: 0.05,
      repulsion: 0.02,
      friction: 0.95,
      color: 'rgba(255, 255, 255, 0.5)',
      glowAmount: 20,
      connectDistance: 50,
      ...options
    };

    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.mousePos = { x: 0, y: 0 };
    this.magneticElements = [];
    this.animationFrame = null;
    this.enabled = true;

    this.init();
  }

  init() {
    this.createCanvas();
    this.createParticles();
    this.setupEventListeners();
    this.findMagneticElements();
    this.start();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      mix-blend-mode: screen;
    `;
    document.body.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.options.particleCount; i++) {
      this.particles.push({
        x: this.mousePos.x,
        y: this.mousePos.y,
        vx: 0,
        vy: 0,
        size: this.options.particleSize * (1 + Math.random() * 0.5),
        alpha: 1 - (i / this.options.particleCount) * 0.5,
        delay: i * 2 // Stagger particles
      });
    }
  }

  setupEventListeners() {
    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
    });

    // Touch support
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mousePos.x = e.touches[0].clientX;
        this.mousePos.y = e.touches[0].clientY;
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });

    // Reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.addEventListener('change', (e) => {
      this.enabled = !e.matches;
    });
    this.enabled = !prefersReducedMotion.matches;
  }

  findMagneticElements() {
    // Find all elements with magnetic data attribute
    this.magneticElements = Array.from(
      document.querySelectorAll('[data-magnetic="true"]')
    );
  }

  start() {
    const animate = () => {
      if (this.enabled) {
        this.update();
        this.render();
      }
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  update() {
    this.particles.forEach((particle, index) => {
      // Trail effect - particles follow each other
      const target = index === 0 ? this.mousePos : this.particles[index - 1];
      
      // Calculate attraction to target
      const dx = target.x - particle.x;
      const dy = target.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > particle.delay) {
        // Apply attraction with delay
        const attraction = this.options.attraction * (1 - index / this.options.particleCount);
        particle.vx += dx * attraction;
        particle.vy += dy * attraction;
      }

      // Magnetic field interactions
      this.magneticElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const elementCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };

        const elemDx = particle.x - elementCenter.x;
        const elemDy = particle.y - elementCenter.y;
        const elemDistance = Math.sqrt(elemDx * elemDx + elemDy * elemDy);

        if (elemDistance < 150 && elemDistance > 0) {
          // Repulsion from magnetic elements
          const force = this.options.repulsion * (150 - elemDistance) / elemDistance;
          particle.vx += elemDx * force;
          particle.vy += elemDy * force;
        }
      });

      // Apply friction
      particle.vx *= this.options.friction;
      particle.vy *= this.options.friction;

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Fade based on velocity
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      particle.alpha = Math.min(1, speed * 0.1) * (1 - index / this.options.particleCount);
    });
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.enabled) return;

    // Enable glow effect
    if (this.options.glowAmount > 0) {
      this.ctx.shadowBlur = this.options.glowAmount;
      this.ctx.shadowColor = this.options.color;
    }

    // Draw connections between nearby particles
    this.ctx.strokeStyle = this.options.color;
    this.ctx.lineWidth = 1;

    for (let i = 0; i < this.particles.length - 1; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.options.connectDistance) {
          this.ctx.globalAlpha = (1 - distance / this.options.connectDistance) * 0.2;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }

    // Draw particles
    this.ctx.fillStyle = this.options.color;
    
    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // Reset context
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    // Recreate particles if count changed
    if (newOptions.particleCount !== undefined) {
      this.createParticles();
    }
  }

  setColor(color) {
    this.options.color = color;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  destroy() {
    this.stop();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.particles = [];
    this.magneticElements = [];
  }
}