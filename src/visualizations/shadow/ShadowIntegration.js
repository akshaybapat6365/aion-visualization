/**
 * Shadow Integration Visualization
 * Main visualization class for Jung's shadow work concept
 */

import Matter from 'matter-js';
import ParticleSystem from './ParticleSystem.js';
import IntegrationEngine from './IntegrationEngine.js';

export default class ShadowIntegration {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.engine = null;
    this.render = null;
    this.world = null;
    this.particleSystem = null;
    this.integrationEngine = null;
    
    // Visualization state
    this.isRunning = false;
    this.selectedParticle = null;
    this.dragConstraint = null;
    
    // Configuration
    this.config = {
      width: container.clientWidth,
      height: container.clientHeight,
      realmDivision: 0.5, // Vertical division between conscious/unconscious
      particleCount: {
        shadow: 30,
        light: 20
      },
      physics: {
        gravity: { x: 0, y: 0 },
        friction: 0.05,
        restitution: 0.8
      }
    };
    
    this.init();
  }
  
  init() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.className = 'shadow-canvas';
    this.container.appendChild(this.canvas);
    
    // Initialize Matter.js
    this.engine = Matter.Engine.create({
      gravity: this.config.physics.gravity
    });
    
    this.world = this.engine.world;
    
    this.render = Matter.Render.create({
      canvas: this.canvas,
      engine: this.engine,
      options: {
        width: this.config.width,
        height: this.config.height,
        wireframes: false,
        background: 'transparent',
        showVelocity: false
      }
    });
    
    // Initialize systems
    this.particleSystem = new ParticleSystem(this.world, this.config);
    this.integrationEngine = new IntegrationEngine(this.particleSystem, this.config);
    
    // Create boundaries
    this.createBoundaries();
    
    // Initialize particles
    this.particleSystem.initialize();
    
    // Setup interaction
    this.setupInteraction();
    
    // Setup custom rendering
    this.setupCustomRendering();
    
    // Handle resize
    this.handleResize();
  }
  
  createBoundaries() {
    const thickness = 50;
    const options = {
      isStatic: true,
      render: { visible: false }
    };
    
    // Create walls
    const walls = [
      // Top
      Matter.Bodies.rectangle(
        this.config.width / 2, -thickness / 2,
        this.config.width, thickness, options
      ),
      // Bottom
      Matter.Bodies.rectangle(
        this.config.width / 2, this.config.height + thickness / 2,
        this.config.width, thickness, options
      ),
      // Left
      Matter.Bodies.rectangle(
        -thickness / 2, this.config.height / 2,
        thickness, this.config.height, options
      ),
      // Right
      Matter.Bodies.rectangle(
        this.config.width + thickness / 2, this.config.height / 2,
        thickness, this.config.height, options
      )
    ];
    
    Matter.World.add(this.world, walls);
  }
  
  setupInteraction() {
    const mouse = Matter.Mouse.create(this.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(this.engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    
    this.dragConstraint = mouseConstraint;
    Matter.World.add(this.world, mouseConstraint);
    
    // Track drag events
    Matter.Events.on(mouseConstraint, 'startdrag', (event) => {
      this.selectedParticle = event.body;
      if (this.selectedParticle.particleType) {
        this.selectedParticle.isDragging = true;
      }
    });
    
    Matter.Events.on(mouseConstraint, 'enddrag', (event) => {
      if (this.selectedParticle && this.selectedParticle.particleType) {
        this.selectedParticle.isDragging = false;
        
        // Check for integration
        const integrated = this.integrationEngine.checkIntegration(this.selectedParticle);
        if (integrated) {
          this.onIntegration(integrated);
        }
      }
      this.selectedParticle = null;
    });
    
    // Track mouse movement for hover effects
    Matter.Events.on(mouseConstraint, 'mousemove', (event) => {
      const bodies = Matter.Query.point(
        this.world.bodies,
        event.mouse.position
      );
      
      // Reset all hover states
      this.particleSystem.particles.forEach(p => p.isHovered = false);
      
      // Set hover state for bodies under mouse
      bodies.forEach(body => {
        if (body.particleType) {
          body.isHovered = true;
        }
      });
    });
  }
  
  setupCustomRendering() {
    // Override Matter.js rendering with custom canvas drawing
    Matter.Events.on(this.render, 'afterRender', () => {
      const ctx = this.canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, this.config.width, this.config.height);
      
      // Draw realm division
      this.drawRealmDivision(ctx);
      
      // Draw particles with custom effects
      this.particleSystem.particles.forEach(particle => {
        this.drawParticle(ctx, particle);
      });
      
      // Draw integration effects
      this.integrationEngine.activeIntegrations.forEach(integration => {
        this.drawIntegrationEffect(ctx, integration);
      });
      
      // Draw UI elements
      this.drawUI(ctx);
    });
  }
  
  drawRealmDivision(ctx) {
    const divisionY = this.config.height * this.config.realmDivision;
    
    // Gradient for realm transition
    const gradient = ctx.createLinearGradient(
      0, divisionY - 50,
      0, divisionY + 50
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.5, 'rgba(200, 200, 200, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, divisionY - 50, this.config.width, 100);
    
    // Division line
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(0, divisionY);
    ctx.lineTo(this.config.width, divisionY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Labels
    ctx.font = '14px "SF Pro Display", -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('CONSCIOUS', 20, 30);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText('UNCONSCIOUS', 20, this.config.height - 20);
  }
  
  drawParticle(ctx, particle) {
    const { position, circleRadius, render } = particle;
    const radius = circleRadius;
    
    // Shadow effect for depth
    if (particle.particleType === 'shadow') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    } else {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    // Particle glow effect
    if (particle.isHovered || particle.isDragging) {
      const glowGradient = ctx.createRadialGradient(
        position.x, position.y, 0,
        position.x, position.y, radius * 2
      );
      
      if (particle.particleType === 'shadow') {
        glowGradient.addColorStop(0, 'rgba(50, 0, 100, 0.6)');
        glowGradient.addColorStop(1, 'rgba(50, 0, 100, 0)');
      } else {
        glowGradient.addColorStop(0, 'rgba(255, 255, 150, 0.6)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 150, 0)');
      }
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(position.x, position.y, radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Main particle
    const gradient = ctx.createRadialGradient(
      position.x - radius / 3, position.y - radius / 3, 0,
      position.x, position.y, radius
    );
    
    if (particle.particleType === 'shadow') {
      gradient.addColorStop(0, particle.integrationProgress > 0 
        ? `rgba(100, 50, 150, ${particle.integrationProgress})`
        : 'rgba(40, 20, 60, 0.9)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    } else {
      gradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
      gradient.addColorStop(1, 'rgba(200, 200, 150, 0.9)');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Particle border
    ctx.strokeStyle = particle.isDragging 
      ? 'rgba(255, 255, 255, 0.8)'
      : render.strokeStyle || 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = particle.isDragging ? 2 : 1;
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Integration indicator
    if (particle.integrationProgress > 0 && particle.integrationProgress < 1) {
      ctx.strokeStyle = 'rgba(150, 100, 200, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        position.x, position.y, radius + 5,
        -Math.PI / 2,
        -Math.PI / 2 + (Math.PI * 2 * particle.integrationProgress)
      );
      ctx.stroke();
    }
  }
  
  drawIntegrationEffect(ctx, integration) {
    const { particle, progress, position } = integration;
    
    // Ripple effect
    const maxRadius = 50;
    const radius = maxRadius * progress;
    const opacity = 1 - progress;
    
    ctx.strokeStyle = `rgba(150, 100, 200, ${opacity * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Particle burst
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = radius * 0.8;
      const x = position.x + Math.cos(angle) * distance;
      const y = position.y + Math.sin(angle) * distance;
      
      ctx.fillStyle = `rgba(200, 150, 250, ${opacity * 0.6})`;
      ctx.beginPath();
      ctx.arc(x, y, 3 * (1 - progress), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  drawUI(ctx) {
    // Progress bar
    const barWidth = 300;
    const barHeight = 8;
    const barX = (this.config.width - barWidth) / 2;
    const barY = this.config.height - 40;
    
    // Background
    ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progress
    const progress = this.integrationEngine.getProgress();
    ctx.fillStyle = 'rgba(150, 100, 200, 0.8)';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    
    // Border
    ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Stats
    ctx.font = '12px "SF Pro Display", -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Integration: ${Math.round(progress * 100)}% | Level: ${this.integrationEngine.level}`,
      this.config.width / 2,
      barY - 10
    );
  }
  
  onIntegration(integration) {
    // Visual feedback
    this.integrationEngine.addActiveIntegration(integration);
    
    // Update progress
    const progress = this.integrationEngine.getProgress();
    
    // Emit event
    if (this.onProgressUpdate) {
      this.onProgressUpdate(progress, this.integrationEngine.level);
    }
    
    // Check for level completion
    if (progress >= 1) {
      this.onLevelComplete();
    }
  }
  
  onLevelComplete() {
    // Advance to next level
    this.integrationEngine.nextLevel();
    
    // Reset particles with new configuration
    this.particleSystem.reset(this.integrationEngine.level);
    
    // Visual celebration
    this.celebrate();
  }
  
  celebrate() {
    // Create celebration particles
    const celebrationParticles = [];
    const center = {
      x: this.config.width / 2,
      y: this.config.height / 2
    };
    
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const velocity = 10 + Math.random() * 5;
      
      const particle = Matter.Bodies.circle(
        center.x, center.y, 3,
        {
          render: { fillStyle: 'rgba(200, 150, 250, 0.8)' },
          isSensor: true,
          velocity: {
            x: Math.cos(angle) * velocity,
            y: Math.sin(angle) * velocity
          }
        }
      );
      
      celebrationParticles.push(particle);
    }
    
    Matter.World.add(this.world, celebrationParticles);
    
    // Remove after animation
    setTimeout(() => {
      Matter.World.remove(this.world, celebrationParticles);
    }, 2000);
  }
  
  handleResize() {
    window.addEventListener('resize', () => {
      this.config.width = this.container.clientWidth;
      this.config.height = this.container.clientHeight;
      
      this.canvas.width = this.config.width;
      this.canvas.height = this.config.height;
      
      this.render.canvas.width = this.config.width;
      this.render.canvas.height = this.config.height;
      
      // Update boundaries
      // Note: In production, you'd want to properly update Matter.js bodies
    });
  }
  
  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      Matter.Render.run(this.render);
      
      const runner = Matter.Runner.create();
      Matter.Runner.run(runner, this.engine);
      
      // Start particle system updates
      this.particleSystem.start();
      
      // Start integration engine
      this.integrationEngine.start();
    }
  }
  
  stop() {
    if (this.isRunning) {
      this.isRunning = false;
      Matter.Render.stop(this.render);
      
      // Stop systems
      this.particleSystem.stop();
      this.integrationEngine.stop();
    }
  }
  
  destroy() {
    this.stop();
    
    // Clean up Matter.js
    Matter.World.clear(this.world);
    Matter.Engine.clear(this.engine);
    
    // Remove canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    
    // Clean up systems
    this.particleSystem.destroy();
    this.integrationEngine.destroy();
  }
}