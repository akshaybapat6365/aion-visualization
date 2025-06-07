/**
 * Consciousness Flow - Particle Stream System
 * 
 * Creates flowing streams of consciousness particles that
 * represent thoughts, memories, and mental processes within
 * the Ego sphere.
 * 
 * Premium Design System Component
 */

import * as THREE from 'three';

export class ConsciousnessFlow {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = {
      particleCount: 1000,
      flowSpeed: 0.5,
      flowRadius: 3,
      flowHeight: 4,
      colorStart: 0xCCCCCC,
      colorEnd: 0x333333,
      particleSize: 0.02,
      ...options
    };
    
    this.particles = [];
    this.geometry = null;
    this.material = null;
    this.system = null;
    
    this.time = 0;
    
    this.init();
  }
  
  init() {
    this.createParticleSystem();
    this.initializeParticles();
  }
  
  /**
   * Create particle system
   */
  createParticleSystem() {
    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    
    // Allocate attributes
    const positions = new Float32Array(this.options.particleCount * 3);
    const colors = new Float32Array(this.options.particleCount * 3);
    const sizes = new Float32Array(this.options.particleCount);
    const alphas = new Float32Array(this.options.particleCount);
    const velocities = new Float32Array(this.options.particleCount * 3);
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
    this.geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    // Create shader material
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        flowSpeed: { value: this.options.flowSpeed },
        pointTexture: { value: this.createPointTexture() }
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 velocity;
        
        uniform float time;
        uniform float flowSpeed;
        
        varying float vAlpha;
        varying vec3 vColor;
        
        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                             -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                  + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                  dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        
        void main() {
          vAlpha = alpha;
          vColor = color;
          
          // Apply flow motion
          vec3 pos = position;
          
          // Add noise-based turbulence
          float noiseX = snoise(vec2(position.y * 0.5, time * 0.2));
          float noiseZ = snoise(vec2(position.y * 0.5 + 100.0, time * 0.2));
          
          pos.x += noiseX * 0.3;
          pos.z += noiseZ * 0.3;
          
          // Apply velocity
          pos += velocity * time * flowSpeed;
          
          // Keep within bounds
          float height = mod(pos.y + time * flowSpeed, 8.0) - 4.0;
          pos.y = height;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size attenuation
          gl_PointSize = size * 300.0 / -mvPosition.z;
          
          // Fade based on height
          vAlpha *= smoothstep(-4.0, -3.0, height) * smoothstep(4.0, 3.0, height);
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          
          gl_FragColor = vec4(vColor, texColor.a * vAlpha);
          
          // Discard fully transparent pixels
          if (gl_FragColor.a < 0.01) discard;
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });
    
    // Create particle system
    this.system = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.system);
  }
  
  /**
   * Initialize particle positions and properties
   */
  initializeParticles() {
    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;
    const sizes = this.geometry.attributes.size.array;
    const alphas = this.geometry.attributes.alpha.array;
    const velocities = this.geometry.attributes.velocity.array;
    
    const startColor = new THREE.Color(this.options.colorStart);
    const endColor = new THREE.Color(this.options.colorEnd);
    
    for (let i = 0; i < this.options.particleCount; i++) {
      const i3 = i * 3;
      
      // Create spiral flow pattern
      const angle = (i / this.options.particleCount) * Math.PI * 8;
      const radius = this.options.flowRadius * (0.5 + Math.random() * 0.5);
      const height = (Math.random() - 0.5) * this.options.flowHeight;
      
      // Position
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = height;
      positions[i3 + 2] = Math.sin(angle) * radius;
      
      // Color gradient based on height
      const t = (height + this.options.flowHeight * 0.5) / this.options.flowHeight;
      const color = new THREE.Color().lerpColors(startColor, endColor, t);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      // Size variation
      sizes[i] = this.options.particleSize * (0.5 + Math.random() * 0.5);
      
      // Alpha
      alphas[i] = 0.3 + Math.random() * 0.7;
      
      // Velocity (upward spiral)
      const velocityAngle = angle + Math.PI / 2;
      velocities[i3] = Math.cos(velocityAngle) * 0.1;
      velocities[i3 + 1] = 0.5 + Math.random() * 0.5;
      velocities[i3 + 2] = Math.sin(velocityAngle) * 0.1;
      
      // Store particle data
      this.particles.push({
        index: i,
        basePosition: new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]),
        velocity: new THREE.Vector3(velocities[i3], velocities[i3 + 1], velocities[i3 + 2]),
        life: Math.random()
      });
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;
    this.geometry.attributes.velocity.needsUpdate = true;
  }
  
  /**
   * Create point texture
   */
  createPointTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }
  
  /**
   * Update animation
   */
  update(deltaTime) {
    this.time += deltaTime;
    
    // Update shader uniforms
    this.material.uniforms.time.value = this.time;
    
    // Update particles
    const positions = this.geometry.attributes.position.array;
    const alphas = this.geometry.attributes.alpha.array;
    
    this.particles.forEach((particle, i) => {
      const i3 = i * 3;
      
      // Update life
      particle.life += deltaTime * 0.1;
      
      // Reset particle when it reaches the top
      if (particle.life > 1 || positions[i3 + 1] > this.options.flowHeight * 0.5) {
        particle.life = 0;
        
        // Reset to bottom with new random position
        const angle = Math.random() * Math.PI * 2;
        const radius = this.options.flowRadius * (0.5 + Math.random() * 0.5);
        
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = -this.options.flowHeight * 0.5;
        positions[i3 + 2] = Math.sin(angle) * radius;
        
        particle.basePosition.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      }
      
      // Update alpha based on life
      alphas[i] = Math.sin(particle.life * Math.PI) * 0.8;
    });
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.alpha.needsUpdate = true;
  }
  
  /**
   * Set flow speed
   */
  setFlowSpeed(speed) {
    this.options.flowSpeed = speed;
    this.material.uniforms.flowSpeed.value = speed;
  }
  
  /**
   * Set visibility
   */
  setVisible(visible) {
    this.system.visible = visible;
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    if (this.material.uniforms.pointTexture.value) {
      this.material.uniforms.pointTexture.value.dispose();
    }
    
    this.scene.remove(this.system);
    this.particles = [];
  }
}