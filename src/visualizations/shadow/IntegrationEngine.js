/**
 * Integration Engine for Shadow Work
 * Handles integration detection, progress tracking, and achievements
 */

export default class IntegrationEngine {
  constructor(particleSystem, config) {
    this.particleSystem = particleSystem;
    this.config = config;
    
    // Integration state
    this.integrations = [];
    this.activeIntegrations = [];
    this.totalIntegrations = 0;
    this.requiredIntegrations = 10;
    this.level = 1;
    
    // Achievement system
    this.achievements = {
      firstIntegration: false,
      rapidIntegration: false,
      perfectBalance: false,
      masterIntegrator: false
    };
    
    // Timing
    this.lastIntegrationTime = 0;
    this.rapidIntegrationThreshold = 3000; // 3 seconds
    
    // Animation
    this.animationFrame = null;
  }
  
  start() {
    // Start animation loop for active integrations
    const animate = () => {
      this.updateActiveIntegrations();
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
  
  checkIntegration(draggedParticle) {
    if (!draggedParticle || !draggedParticle.particleType) return null;
    
    const divisionY = this.config.height * this.config.realmDivision;
    const currentRealm = draggedParticle.position.y < divisionY ? 'conscious' : 'unconscious';
    
    // Check if particle has crossed realms
    const hasChangedRealm = (
      (draggedParticle.originalRealm === 'unconscious' && currentRealm === 'conscious') ||
      (draggedParticle.originalRealm === 'conscious' && currentRealm === 'unconscious')
    );
    
    if (!hasChangedRealm) return null;
    
    // Find nearby opposite-type particles
    const searchRadius = 50;
    const nearbyParticles = this.particleSystem.getParticlesInRadius(
      draggedParticle.position,
      searchRadius
    );
    
    // Look for integration partner
    const partner = nearbyParticles.find(particle => 
      particle !== draggedParticle &&
      particle.particleType !== draggedParticle.particleType &&
      particle.integrationProgress < 1
    );
    
    if (partner) {
      return this.createIntegration(draggedParticle, partner);
    }
    
    return null;
  }
  
  createIntegration(particleA, particleB) {
    const integration = {
      id: Date.now(),
      particles: [particleA, particleB],
      startTime: Date.now(),
      progress: 0,
      position: {
        x: (particleA.position.x + particleB.position.x) / 2,
        y: (particleA.position.y + particleB.position.y) / 2
      }
    };
    
    // Update particles
    particleA.integrationProgress = 0.5;
    particleB.integrationProgress = 0.5;
    
    // Track integration
    this.integrations.push(integration);
    this.totalIntegrations++;
    
    // Check achievements
    this.checkAchievements(integration);
    
    // Emit integration event
    if (this.onIntegration) {
      this.onIntegration(integration);
    }
    
    return integration;
  }
  
  addActiveIntegration(integration) {
    this.activeIntegrations.push({
      ...integration,
      particle: integration.particles[0],
      startTime: Date.now(),
      duration: 1000 // 1 second animation
    });
  }
  
  updateActiveIntegrations() {
    const now = Date.now();
    
    this.activeIntegrations = this.activeIntegrations.filter(integration => {
      const elapsed = now - integration.startTime;
      integration.progress = Math.min(elapsed / integration.duration, 1);
      
      // Update particle integration progress
      integration.particles.forEach(particle => {
        if (particle.integrationProgress < 1) {
          particle.integrationProgress = Math.min(
            particle.integrationProgress + 0.01,
            1
          );
        }
      });
      
      // Remove completed integrations
      if (integration.progress >= 1) {
        // Final transformation
        this.completeIntegration(integration);
        return false;
      }
      
      return true;
    });
  }
  
  completeIntegration(integration) {
    // Transform particles to integrated state
    integration.particles.forEach(particle => {
      particle.integrationProgress = 1;
      
      // Visual transformation - particles become purple (integrated)
      const integratedColor = 'rgba(150, 100, 200, 0.9)';
      particle.render.fillStyle = integratedColor;
      particle.render.strokeStyle = 'rgba(180, 130, 230, 0.8)';
      
      // Update physics - integrated particles are more stable
      particle.friction = 0.2;
      particle.restitution = 0.5;
    });
  }
  
  checkAchievements(integration) {
    const now = Date.now();
    
    // First integration
    if (!this.achievements.firstIntegration && this.totalIntegrations === 1) {
      this.achievements.firstIntegration = true;
      this.onAchievement('First Integration', 'You\'ve taken the first step in shadow work');
    }
    
    // Rapid integration
    if (!this.achievements.rapidIntegration && 
        this.lastIntegrationTime > 0 &&
        now - this.lastIntegrationTime < this.rapidIntegrationThreshold) {
      this.achievements.rapidIntegration = true;
      this.onAchievement('Rapid Integration', 'Quick succession of integrations');
    }
    
    // Perfect balance
    const shadowCount = this.particleSystem.particles.filter(
      p => p.particleType === 'shadow' && p.integrationProgress >= 1
    ).length;
    const lightCount = this.particleSystem.particles.filter(
      p => p.particleType === 'light' && p.integrationProgress >= 1
    ).length;
    
    if (!this.achievements.perfectBalance && 
        shadowCount > 5 && lightCount > 5 &&
        Math.abs(shadowCount - lightCount) <= 1) {
      this.achievements.perfectBalance = true;
      this.onAchievement('Perfect Balance', 'Achieved equilibrium between light and shadow');
    }
    
    // Master integrator
    if (!this.achievements.masterIntegrator && this.level >= 5) {
      this.achievements.masterIntegrator = true;
      this.onAchievement('Master Integrator', 'Reached level 5 in shadow work');
    }
    
    this.lastIntegrationTime = now;
  }
  
  onAchievement(title, description) {
    console.log(`Achievement Unlocked: ${title} - ${description}`);
    
    // Emit achievement event
    if (this.onAchievementUnlocked) {
      this.onAchievementUnlocked({ title, description });
    }
  }
  
  getProgress() {
    // Calculate progress based on integrated particles
    const integratedCount = this.particleSystem.particles.filter(
      p => p.integrationProgress >= 1
    ).length;
    
    const totalParticles = this.particleSystem.particles.length;
    const targetIntegrations = Math.min(
      this.requiredIntegrations,
      Math.floor(totalParticles * 0.6) // 60% integration target
    );
    
    return Math.min(integratedCount / targetIntegrations, 1);
  }
  
  nextLevel() {
    this.level++;
    this.requiredIntegrations = 10 + (this.level - 1) * 5;
    this.totalIntegrations = 0;
    
    // Increase difficulty
    this.updateDifficulty();
  }
  
  updateDifficulty() {
    // Adjust particle behavior based on level
    const difficultyMultiplier = 1 + (this.level - 1) * 0.2;
    
    this.particleSystem.particles.forEach(particle => {
      // Increase repulsion between same types
      particle.repulsionStrength *= difficultyMultiplier;
      
      // Decrease attraction between different types
      particle.attractionStrength /= difficultyMultiplier;
    });
  }
  
  getStats() {
    const integratedCount = this.particleSystem.particles.filter(
      p => p.integrationProgress >= 1
    ).length;
    
    const shadowIntegrated = this.particleSystem.particles.filter(
      p => p.particleType === 'shadow' && p.integrationProgress >= 1
    ).length;
    
    const lightIntegrated = this.particleSystem.particles.filter(
      p => p.particleType === 'light' && p.integrationProgress >= 1
    ).length;
    
    return {
      level: this.level,
      progress: this.getProgress(),
      totalIntegrations: this.totalIntegrations,
      integratedCount,
      shadowIntegrated,
      lightIntegrated,
      achievements: Object.keys(this.achievements).filter(
        key => this.achievements[key]
      )
    };
  }
  
  reset() {
    this.integrations = [];
    this.activeIntegrations = [];
    this.totalIntegrations = 0;
    this.level = 1;
    this.requiredIntegrations = 10;
    this.lastIntegrationTime = 0;
    
    // Reset achievements
    Object.keys(this.achievements).forEach(key => {
      this.achievements[key] = false;
    });
  }
  
  destroy() {
    this.stop();
    this.reset();
  }
}