/**
 * Ego Sphere Visualization - Chapter 1
 * 
 * The central consciousness visualization representing the Ego.
 * A transparent sphere containing streams of consciousness,
 * memory nodes, and thought particles.
 * 
 * Premium Design System Component
 */

import * as THREE from 'three';
import { MaterialSystem } from '../../core/material-system.js';
import { GeometryUtils } from '../../core/geometry-utils.js';

export class EgoSphere {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = {
      radius: 3,
      particleCount: 500,
      memoryNodeCount: 12,
      rotationSpeed: 0.001,
      pulseSpeed: 0.5,
      ...options
    };
    
    this.materialSystem = new MaterialSystem();
    this.geometryUtils = new GeometryUtils();
    
    this.group = new THREE.Group();
    this.particles = null;
    this.memoryNodes = [];
    this.consciousnessStreams = [];
    
    this.time = 0;
    
    this.init();
  }
  
  init() {
    // Create outer sphere (glass-like)
    this.createOuterSphere();
    
    // Create inner core (glowing)
    this.createInnerCore();
    
    // Create consciousness streams
    this.createConsciousnessStreams();
    
    // Create memory nodes
    this.createMemoryNodes();
    
    // Create thought particles
    this.createThoughtParticles();
    
    // Add to scene
    this.scene.add(this.group);
  }
  
  /**
   * Create transparent outer sphere
   */
  createOuterSphere() {
    const geometries = this.geometryUtils.createEgoSphere(this.options.radius);
    
    // Outer transparent sphere
    const outerMaterial = this.materialSystem.createGlassMaterial(0.1, 0x1A1A1A);
    const outerMesh = new THREE.Mesh(geometries.outer, outerMaterial);
    
    this.group.add(outerMesh);
    this.outerSphere = outerMesh;
  }
  
  /**
   * Create glowing inner core
   */
  createInnerCore() {
    const geometries = this.geometryUtils.createEgoSphere(this.options.radius);
    
    // Inner core with emissive material
    const coreMaterial = this.materialSystem.createEmissiveMaterial(0x999999, 0.5);
    const coreMesh = new THREE.Mesh(geometries.core, coreMaterial);
    
    // Add subtle animation
    coreMesh.userData.baseScale = coreMesh.scale.x;
    
    this.group.add(coreMesh);
    this.innerCore = coreMesh;
  }
  
  /**
   * Create flowing consciousness streams
   */
  createConsciousnessStreams() {
    const streamCount = 6;
    
    for (let i = 0; i < streamCount; i++) {
      const angle = (i / streamCount) * Math.PI * 2;
      
      // Create curved path for stream
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(angle) * this.options.radius * 0.5,
          Math.sin(i * 0.5) * this.options.radius * 0.3,
          Math.sin(angle) * this.options.radius * 0.5
        ),
        new THREE.Vector3(
          Math.cos(angle) * this.options.radius * 0.8,
          Math.cos(i * 0.7) * this.options.radius * 0.4,
          Math.sin(angle) * this.options.radius * 0.8
        )
      ]);
      
      // Create tube geometry
      const tubeGeometry = new THREE.TubeGeometry(curve, 32, 0.05, 8, false);
      
      // Animated gradient material
      const material = this.materialSystem.createAnimatedMaterial(0x666666, {
        opacity: 0.6
      });
      
      const mesh = new THREE.Mesh(tubeGeometry, material);
      mesh.userData.curve = curve;
      mesh.userData.offset = i / streamCount;
      
      this.group.add(mesh);
      this.consciousnessStreams.push(mesh);
    }
  }
  
  /**
   * Create memory nodes
   */
  createMemoryNodes() {
    const nodeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    
    for (let i = 0; i < this.options.memoryNodeCount; i++) {
      // Fibonacci sphere distribution
      const y = 1 - (i / (this.options.memoryNodeCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = ((i + 1) % this.options.memoryNodeCount) * 2.4; // Golden angle
      
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      
      // Position on sphere surface
      const position = new THREE.Vector3(x, y, z).multiplyScalar(this.options.radius * 0.9);
      
      // Create node
      const material = this.materialSystem.createEmissiveMaterial(0xAAAAAA, 0.3);
      const node = new THREE.Mesh(nodeGeometry, material);
      node.position.copy(position);
      
      // Add connection line to core
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        position
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x444444,
        transparent: true,
        opacity: 0.3
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      
      // Store for animation
      node.userData.basePosition = position.clone();
      node.userData.index = i;
      
      this.group.add(node);
      this.group.add(line);
      
      this.memoryNodes.push({ node, line });
    }
  }
  
  /**
   * Create thought particles
   */
  createThoughtParticles() {
    const geometry = this.geometryUtils.createParticleField(
      this.options.particleCount,
      this.options.radius,
      'sphere'
    );
    
    // Custom shader for particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x999999) },
        opacity: { value: 0.6 }
      },
      vertexShader: `
        attribute float scale;
        attribute float alpha;
        
        uniform float time;
        
        varying float vAlpha;
        
        void main() {
          vAlpha = alpha;
          
          vec3 pos = position;
          
          // Orbital motion
          float angle = time * 0.5 + position.x;
          pos.x = position.x * cos(angle) - position.z * sin(angle);
          pos.z = position.x * sin(angle) + position.z * cos(angle);
          
          // Radial pulsing
          float pulse = sin(time + length(position)) * 0.1;
          pos *= 1.0 + pulse;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size based on distance
          gl_PointSize = scale * 30.0 / -mvPosition.z;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        
        varying float vAlpha;
        
        void main() {
          // Circular particle shape
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // Soft edges
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha * opacity;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.group.add(this.particles);
  }
  
  /**
   * Update animation
   */
  update(deltaTime) {
    this.time += deltaTime;
    
    // Rotate entire structure slowly
    this.group.rotation.y += this.options.rotationSpeed;
    
    // Pulse inner core
    const pulseFactor = 1 + Math.sin(this.time * this.options.pulseSpeed) * 0.1;
    this.innerCore.scale.setScalar(this.innerCore.userData.baseScale * pulseFactor);
    
    // Animate consciousness streams
    this.consciousnessStreams.forEach((stream, index) => {
      // Undulating motion
      stream.rotation.x = Math.sin(this.time * 0.3 + stream.userData.offset * Math.PI * 2) * 0.1;
      stream.rotation.z = Math.cos(this.time * 0.4 + stream.userData.offset * Math.PI * 2) * 0.1;
    });
    
    // Animate memory nodes
    this.memoryNodes.forEach(({ node }, index) => {
      // Gentle floating motion
      const offset = node.userData.index * 0.5;
      const floatY = Math.sin(this.time * 0.5 + offset) * 0.05;
      const floatX = Math.cos(this.time * 0.7 + offset) * 0.03;
      
      node.position.copy(node.userData.basePosition);
      node.position.y += floatY;
      node.position.x += floatX;
      
      // Brightness variation
      const brightness = 0.3 + Math.sin(this.time + offset) * 0.2;
      node.material.emissiveIntensity = brightness;
    });
    
    // Update particle shader time
    if (this.particles) {
      this.particles.material.uniforms.time.value = this.time;
    }
    
    // Update animated materials
    this.materialSystem.updateAnimatedMaterials(this.time);
  }
  
  /**
   * Focus on specific memory node
   */
  focusOnMemory(index) {
    if (index < 0 || index >= this.memoryNodes.length) return;
    
    const { node } = this.memoryNodes[index];
    
    // Highlight node
    node.material.emissiveIntensity = 2.0;
    node.scale.setScalar(1.5);
    
    // Dim other nodes
    this.memoryNodes.forEach(({ node: otherNode }, i) => {
      if (i !== index) {
        otherNode.material.emissiveIntensity = 0.1;
        otherNode.scale.setScalar(0.8);
      }
    });
    
    return node.position;
  }
  
  /**
   * Reset focus
   */
  resetFocus() {
    this.memoryNodes.forEach(({ node }) => {
      node.material.emissiveIntensity = 0.3;
      node.scale.setScalar(1.0);
    });
  }
  
  /**
   * Set visibility
   */
  setVisible(visible) {
    this.group.visible = visible;
  }
  
  /**
   * Get bounding box
   */
  getBoundingBox() {
    return new THREE.Box3().setFromObject(this.group);
  }
  
  /**
   * Dispose resources
   */
  dispose() {
    // Dispose geometries and materials
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    // Remove from scene
    this.scene.remove(this.group);
    
    // Clear references
    this.memoryNodes = [];
    this.consciousnessStreams = [];
    this.particles = null;
  }
}