/**
 * Particle System for Shadow Integration
 * Manages shadow and light particles with attraction/repulsion dynamics
 */

import Matter from 'matter-js';

export default class ParticleSystem {
  constructor(world, config) {
    this.world = world;
    this.config = config;
    this.particles = [];
    this.updateInterval = null;
    
    // Particle configuration
    this.particleConfig = {
      shadow: {
        radius: 15,
        mass: 2,
        friction: 0.1,
        restitution: 0.6,
        fillStyle: 'rgba(20, 10, 30, 0.9)',
        strokeStyle: 'rgba(50, 25, 75, 0.7)',
        attractionStrength: 0.0001,
        repulsionStrength: 0.0003
      },
      light: {
        radius: 12,
        mass: 1,
        friction: 0.05,
        restitution: 0.8,
        fillStyle: 'rgba(255, 245, 200, 0.9)',
        strokeStyle: 'rgba(255, 230, 150, 0.7)',
        attractionStrength: 0.00008,
        repulsionStrength: 0.0002
      }
    };
  }
  
  initialize() {
    // Clear existing particles
    this.clear();
    
    // Create shadow particles (unconscious realm)
    for (let i = 0; i < this.config.particleCount.shadow; i++) {
      this.createShadowParticle();
    }
    
    // Create light particles (conscious realm)
    for (let i = 0; i < this.config.particleCount.light; i++) {
      this.createLightParticle();
    }
  }
  
  createShadowParticle() {
    const config = this.particleConfig.shadow;
    const divisionY = this.config.height * this.config.realmDivision;
    
    // Position in unconscious realm (below division)
    const x = Math.random() * this.config.width;
    const y = divisionY + 50 + Math.random() * (this.config.height - divisionY - 100);
    
    const particle = Matter.Bodies.circle(x, y, config.radius, {
      mass: config.mass,
      friction: config.friction,
      restitution: config.restitution,
      render: {
        fillStyle: config.fillStyle,
        strokeStyle: config.strokeStyle,
        lineWidth: 2
      }
    });
    
    // Custom properties
    particle.particleType = 'shadow';
    particle.integrationProgress = 0;
    particle.originalRealm = 'unconscious';
    particle.isDragging = false;
    particle.isHovered = false;
    particle.attractionStrength = config.attractionStrength;
    particle.repulsionStrength = config.repulsionStrength;
    
    // Add random initial velocity
    Matter.Body.setVelocity(particle, {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2
    });
    
    this.particles.push(particle);
    Matter.World.add(this.world, particle);
    
    return particle;
  }
  
  createLightParticle() {
    const config = this.particleConfig.light;
    const divisionY = this.config.height * this.config.realmDivision;
    
    // Position in conscious realm (above division)
    const x = Math.random() * this.config.width;
    const y = 50 + Math.random() * (divisionY - 100);
    
    const particle = Matter.Bodies.circle(x, y, config.radius, {
      mass: config.mass,
      friction: config.friction,
      restitution: config.restitution,
      render: {
        fillStyle: config.fillStyle,
        strokeStyle: config.strokeStyle,
        lineWidth: 2
      }
    });
    
    // Custom properties
    particle.particleType = 'light';
    particle.integrationProgress = 0;
    particle.originalRealm = 'conscious';
    particle.isDragging = false;
    particle.isHovered = false;
    particle.attractionStrength = config.attractionStrength;
    particle.repulsionStrength = config.repulsionStrength;
    
    // Add random initial velocity
    Matter.Body.setVelocity(particle, {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2
    });
    
    this.particles.push(particle);
    Matter.World.add(this.world, particle);
    
    return particle;
  }
  
  start() {
    // Start physics update loop
    this.updateInterval = setInterval(() => {
      this.update();
    }, 1000 / 60); // 60 FPS
  }
  
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  update() {
    // Apply forces between particles
    for (let i = 0; i < this.particles.length; i++) {
      const particleA = this.particles[i];
      
      // Skip if being dragged
      if (particleA.isDragging) continue;
      
      for (let j = i + 1; j < this.particles.length; j++) {
        const particleB = this.particles[j];
        
        // Skip if being dragged
        if (particleB.isDragging) continue;
        
        // Calculate distance
        const dx = particleB.position.x - particleA.position.x;
        const dy = particleB.position.y - particleA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 1) continue; // Avoid division by zero
        
        // Normalize direction
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Different particle types interact differently
        if (particleA.particleType !== particleB.particleType) {
          // Opposite types attract (shadow work integration)
          const attractionForce = this.calculateAttraction(particleA, particleB, distance);
          
          Matter.Body.applyForce(particleA, particleA.position, {
            x: nx * attractionForce,
            y: ny * attractionForce
          });
          
          Matter.Body.applyForce(particleB, particleB.position, {
            x: -nx * attractionForce,
            y: -ny * attractionForce
          });
        } else {
          // Same types repel (maintain individuality)
          const repulsionForce = this.calculateRepulsion(particleA, particleB, distance);
          
          Matter.Body.applyForce(particleA, particleA.position, {
            x: -nx * repulsionForce,
            y: -ny * repulsionForce
          });
          
          Matter.Body.applyForce(particleB, particleB.position, {
            x: nx * repulsionForce,
            y: ny * repulsionForce
          });
        }
      }
      
      // Apply realm attraction (particles want to return to their realm)
      this.applyRealmAttraction(particleA);
      
      // Apply damping to prevent excessive motion
      this.applyDamping(particleA);
    }
  }
  
  calculateAttraction(particleA, particleB, distance) {
    // Stronger attraction when closer, but not too strong
    const minDistance = particleA.circleRadius + particleB.circleRadius;
    const effectiveDistance = Math.max(distance, minDistance);
    
    const baseStrength = (particleA.attractionStrength + particleB.attractionStrength) / 2;
    return baseStrength * (1 / (effectiveDistance * effectiveDistance)) * 1000;
  }
  
  calculateRepulsion(particleA, particleB, distance) {
    // Stronger repulsion when very close
    const minDistance = particleA.circleRadius + particleB.circleRadius;
    
    if (distance < minDistance * 2) {
      const baseStrength = (particleA.repulsionStrength + particleB.repulsionStrength) / 2;
      return baseStrength * (1 / (distance * distance)) * 1000;
    }
    
    return 0;
  }
  
  applyRealmAttraction(particle) {
    const divisionY = this.config.height * this.config.realmDivision;
    const realmForce = 0.00005;
    
    // Determine target realm based on integration progress
    let targetY;
    if (particle.integrationProgress > 0.5) {
      // Integrated particles can exist in either realm
      targetY = particle.position.y;
    } else if (particle.originalRealm === 'unconscious') {
      targetY = divisionY + 100;
    } else {
      targetY = divisionY - 100;
    }
    
    // Apply gentle force towards realm
    const dy = targetY - particle.position.y;
    const force = dy * realmForce;
    
    Matter.Body.applyForce(particle, particle.position, {
      x: 0,
      y: force
    });
  }
  
  applyDamping(particle) {
    // Apply velocity damping to prevent excessive motion
    const damping = 0.98;
    Matter.Body.setVelocity(particle, {
      x: particle.velocity.x * damping,
      y: particle.velocity.y * damping
    });
  }
  
  checkCollision(particleA, particleB) {
    const dx = particleB.position.x - particleA.position.x;
    const dy = particleB.position.y - particleA.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = particleA.circleRadius + particleB.circleRadius;
    
    return distance < minDistance;
  }
  
  getParticlesInRadius(position, radius) {
    return this.particles.filter(particle => {
      const dx = particle.position.x - position.x;
      const dy = particle.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < radius;
    });
  }
  
  transformParticle(particle, type) {
    // Transform particle type (used for integration)
    particle.particleType = type;
    particle.integrationProgress = 1;
    
    // Update visual properties
    const config = this.particleConfig[type];
    particle.render.fillStyle = config.fillStyle;
    particle.render.strokeStyle = config.strokeStyle;
    
    // Update physics properties
    Matter.Body.setMass(particle, config.mass);
    particle.friction = config.friction;
    particle.restitution = config.restitution;
  }
  
  reset(level = 1) {
    // Clear existing particles
    this.clear();
    
    // Adjust particle counts based on level
    const shadowCount = this.config.particleCount.shadow + (level - 1) * 5;
    const lightCount = this.config.particleCount.light + (level - 1) * 3;
    
    // Create new particles
    for (let i = 0; i < shadowCount; i++) {
      this.createShadowParticle();
    }
    
    for (let i = 0; i < lightCount; i++) {
      this.createLightParticle();
    }
  }
  
  clear() {
    // Remove all particles from world
    this.particles.forEach(particle => {
      Matter.World.remove(this.world, particle);
    });
    
    this.particles = [];
  }
  
  destroy() {
    this.stop();
    this.clear();
  }
}