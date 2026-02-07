/**
 * ConnectionRenderer.js
 * Renders connections between concept nodes
 * High-performance implementation with bezier curves and particles
 */

// Use CDN version of Three.js
const THREE = window.THREE;

import { WebGLResourceAuditor } from '../../shared/WebGLResourceAuditor.js';

export class ConnectionRenderer {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.connections = [];
    this.particles = [];
    this.highlightedConnections = new Set();
    this.resourceAuditor = new WebGLResourceAuditor('ConnectionRenderer');
    
    // Materials
    this.materials = {
      default: this.resourceAuditor.track(new THREE.LineBasicMaterial({
        color: 0x404040,
        transparent: true,
        opacity: 0.3,
        linewidth: 1
      }), 'connection-default', 'material'),
      highlighted: this.resourceAuditor.track(new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
      }), 'connection-highlighted', 'material'),
      particle: this.resourceAuditor.track(new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.05,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        map: this.createParticleTexture()
      }), 'connection-particle', 'material')
    };
    
    // Particle system
    this.particleGeometry = this.resourceAuditor.track(new THREE.BufferGeometry(), 'connection-particle-geometry', 'geometry');
    this.particleSystem = null;
    this.initParticleSystem();
  }
  
  /**
   * Create particle texture
   */
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    
    return this.resourceAuditor.track(new THREE.CanvasTexture(canvas), 'connection-particle-texture', 'texture');
  }
  
  /**
   * Initialize particle system
   */
  initParticleSystem() {
    const positions = new Float32Array(this.config.particleCount * 3);
    const velocities = new Float32Array(this.config.particleCount * 3);
    
    for (let i = 0; i < this.config.particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;
    }
    
    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    
    this.particleVelocities = velocities;
    this.particleSystem = new THREE.Points(
      this.particleGeometry,
      this.materials.particle
    );
    
    this.scene.add(this.particleSystem);
  }
  
  /**
   * Create a connection between two nodes
   */
  createConnection(sourceNode, targetNode, strength = 0.5) {
    const source = sourceNode.position;
    const target = targetNode.position;
    
    // Calculate bezier control points
    const midPoint = new THREE.Vector3()
      .addVectors(source, target)
      .multiplyScalar(0.5);
    
    // Add some curve based on distance
    const distance = source.distanceTo(target);
    const curveHeight = distance * 0.2;
    
    const controlPoint1 = midPoint.clone();
    controlPoint1.y += curveHeight * 0.5;
    
    const controlPoint2 = midPoint.clone();
    controlPoint2.y += curveHeight;
    
    // Create bezier curve
    const curve = new THREE.CubicBezierCurve3(
      source,
      controlPoint1,
      controlPoint2,
      target
    );
    
    // Generate points along curve
    const points = curve.getPoints(50);
    const geometry = this.resourceAuditor.track(new THREE.BufferGeometry().setFromPoints(points), `connection-${sourceNode.userData.id}-${targetNode.userData.id}-geometry`, 'geometry');
    
    // Create line
    const material = this.resourceAuditor.track(this.materials.default.clone(), `connection-${sourceNode.userData.id}-${targetNode.userData.id}-material`, 'material');
    material.opacity = 0.2 + strength * 0.4;
    
    const line = new THREE.Line(geometry, material);
    
    // Store connection data
    const connection = {
      line: line,
      curve: curve,
      source: sourceNode.userData,
      target: targetNode.userData,
      strength: strength,
      particles: []
    };
    
    // Add particles along connection
    this.addParticlesToConnection(connection);
    
    this.connections.push(connection);
    this.scene.add(line);
    
    return connection;
  }
  
  /**
   * Add particles to a connection
   */
  addParticlesToConnection(connection) {
    const particleCount = Math.floor(connection.strength * 5) + 1;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = {
        connection: connection,
        t: Math.random(), // Position along curve (0-1)
        speed: 0.1 + Math.random() * 0.2,
        size: 0.02 + Math.random() * 0.03
      };
      
      connection.particles.push(particle);
      this.particles.push(particle);
    }
  }
  
  /**
   * Update particle positions
   */
  updateParticles(deltaTime) {
    const positions = this.particleGeometry.attributes.position.array;
    let particleIndex = 0;
    
    this.particles.forEach(particle => {
      // Update position along curve
      particle.t += particle.speed * deltaTime * this.config.animationSpeed;
      
      if (particle.t > 1) {
        particle.t -= 1;
      }
      
      // Get position on curve
      const position = particle.connection.curve.getPoint(particle.t);
      
      // Update buffer
      if (particleIndex < this.config.particleCount) {
        positions[particleIndex * 3] = position.x;
        positions[particleIndex * 3 + 1] = position.y;
        positions[particleIndex * 3 + 2] = position.z;
        particleIndex++;
      }
    });
    
    // Fill remaining particles (hide them)
    for (let i = particleIndex; i < this.config.particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 1000; // Far away
      positions[i * 3 + 2] = 0;
    }
    
    this.particleGeometry.attributes.position.needsUpdate = true;
  }
  
  /**
   * Highlight connections for a specific node
   */
  highlightConnectionsForNode(nodeId) {
    // Reset previous highlights
    this.resetHighlights();
    
    // Find and highlight relevant connections
    this.connections.forEach(connection => {
      if (connection.source.id === nodeId || 
          connection.target.id === nodeId) {
        this.highlightConnection(connection);
      }
    });
  }
  
  /**
   * Highlight a specific connection
   */
  highlightConnection(connection) {
    this.resourceAuditor.dispose(connection.line.material);
    connection.line.material = this.resourceAuditor.track(this.materials.highlighted.clone(), `connection-highlight-${connection.source.id}-${connection.target.id}`, 'material');
    connection.line.material.opacity = 0.6 + connection.strength * 0.4;
    this.highlightedConnections.add(connection);
    
    // Increase particle visibility
    connection.particles.forEach(particle => {
      particle.size *= 2;
    });
  }
  
  /**
   * Reset all highlights
   */
  resetHighlights() {
    this.highlightedConnections.forEach(connection => {
      this.resourceAuditor.dispose(connection.line.material);
      connection.line.material = this.resourceAuditor.track(this.materials.default.clone(), `connection-reset-${connection.source.id}-${connection.target.id}`, 'material');
      connection.line.material.opacity = 0.2 + connection.strength * 0.4;
      
      // Reset particle size
      connection.particles.forEach(particle => {
        particle.size = 0.02 + Math.random() * 0.03;
      });
    });
    
    this.highlightedConnections.clear();
  }
  
  /**
   * Update connections animation
   */
  update() {
    // Update particles
    if (this.config.quality !== 'low') {
      this.updateParticles(0.016); // Assume 60 FPS
    }
    
    // Pulse highlighted connections
    this.highlightedConnections.forEach(connection => {
      const pulse = Math.sin(Date.now() * 0.002) * 0.2 + 0.8;
      connection.line.material.opacity = pulse * (0.6 + connection.strength * 0.4);
    });
  }
  
  /**
   * Set quality level
   */
  setQuality(quality) {
    // Adjust particle count based on quality
    const particleCounts = {
      low: 0,
      medium: 500,
      high: 1000,
      ultra: 2000
    };
    
    this.config.particleCount = particleCounts[quality];
    
    // Show/hide particles
    this.particleSystem.visible = quality !== 'low';
    
    // Adjust line quality
    if (quality === 'low') {
      this.connections.forEach(connection => {
        // Reduce curve points for better performance
        const points = connection.curve.getPoints(20);
        connection.line.geometry.setFromPoints(points);
      });
    }
  }
  
  /**
   * Get connections for a node
   */
  getConnectionsForNode(nodeId) {
    return this.connections.filter(
      conn => conn.source.id === nodeId || conn.target.id === nodeId
    );
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Remove scene references
    this.connections.forEach(connection => {
      this.scene.remove(connection.line);
    });

    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
    }

    // Dispose tracked WebGL resources
    this.resourceAuditor.disposeAll();
    
    // Clear arrays
    this.connections = [];
    this.particles = [];
    this.highlightedConnections.clear();
  }

  getDisposalAuditReport() {
    return this.resourceAuditor.report();
  }
}
