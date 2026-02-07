/**
 * NodeSystem.js
 * Manages concept nodes in the constellation
 * Implements high-quality rendering with performance optimization
 */

// Use CDN version of Three.js
const THREE = window.THREE;

import { WebGLResourceAuditor } from '../../shared/WebGLResourceAuditor.js';

export class NodeSystem {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.nodes = [];
    this.hoveredNode = null;
    this.selectedNode = null;
    
    this.resourceAuditor = new WebGLResourceAuditor('NodeSystem');

    // Materials cache
    this.materials = new Map();
    this.setupMaterials();
    
    // Geometry cache
    this.geometries = new Map();
    this.setupGeometries();
    
    // Labels
    this.labels = new Map();
    this.labelRenderer = null;
  }
  
  /**
   * Setup shared materials for performance
   */
  setupMaterials() {
    // Base node material
    this.materials.set('base', this.resourceAuditor.track(new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x404040,
      emissiveIntensity: 0.3,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    }), 'base-material', 'material'));
    
    // Hover material
    this.materials.set('hover', this.resourceAuditor.track(new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
      shininess: 150,
      transparent: true,
      opacity: 1
    }), 'hover-material', 'material'));
    
    // Selected material
    this.materials.set('selected', this.resourceAuditor.track(new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
      shininess: 200,
      transparent: true,
      opacity: 1
    }), 'selected-material', 'material'));
    
    // Glow material for outer sphere
    this.materials.set('glow', this.resourceAuditor.track(new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.5 },
        p: { value: 4.5 },
        glowColor: { value: new THREE.Color(0xffffff) },
        viewVector: { value: new THREE.Vector3() }
      },
      vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(c - dot(vNormal, vNormel), p);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity);
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    }), 'glow-material', 'material'));
  }
  
  /**
   * Setup shared geometries for performance
   */
  setupGeometries() {
    // Different quality levels
    const qualities = {
      low: { segments: 8 },
      medium: { segments: 16 },
      high: { segments: 32 },
      ultra: { segments: 64 }
    };
    
    Object.entries(qualities).forEach(([quality, { segments }]) => {
      this.geometries.set(quality, this.resourceAuditor.track(new THREE.SphereGeometry(1, segments, segments), `sphere-${quality}`, 'geometry'));
    });
  }
  
  /**
   * Create a node for a concept
   */
  createNode(conceptData) {
    const nodeGroup = new THREE.Group();
    nodeGroup.userData = conceptData;
    
    // Scale based on importance
    const scale = 0.1 + (conceptData.importance / 10) * 0.4;
    
    // Core sphere
    const geometry = this.geometries.get(this.config.quality);
    const material = this.resourceAuditor.track(this.materials.get('base').clone(), `node-${conceptData.id}-material`, 'material');
    material.color = new THREE.Color(conceptData.color);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(scale);
    mesh.userData = conceptData;
    nodeGroup.add(mesh);
    
    // Glow effect for important nodes
    if (conceptData.importance >= 7) {
      const glowMaterial = this.resourceAuditor.track(this.materials.get('glow').clone(), `node-${conceptData.id}-glow-material`, 'material');
      glowMaterial.uniforms.glowColor.value = new THREE.Color(conceptData.color);
      
      const glowMesh = new THREE.Mesh(geometry, glowMaterial);
      glowMesh.scale.setScalar(scale * 1.5);
      nodeGroup.add(glowMesh);
    }
    
    // Pulsing animation for highest importance
    if (conceptData.importance >= 9) {
      mesh.userData.pulse = {
        active: true,
        speed: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
      };
    }
    
    // Position
    nodeGroup.position.set(...conceptData.position);
    
    // Add to scene and tracking
    this.scene.add(nodeGroup);
    this.nodes.push({
      group: nodeGroup,
      mesh: mesh,
      data: conceptData,
      state: 'default'
    });
    
    return nodeGroup;
  }
  
  /**
   * Update hover states based on raycaster
   */
  updateHoverStates(raycaster) {
    // Get all node meshes
    const meshes = this.nodes.map(node => node.mesh);
    const intersects = raycaster.intersectObjects(meshes);
    
    // Reset previous hover
    if (this.hoveredNode && this.hoveredNode.state !== 'selected') {
      this.setNodeState(this.hoveredNode, 'default');
    }
    
    // Set new hover
    if (intersects.length > 0) {
      const node = this.nodes.find(n => n.mesh === intersects[0].object);
      if (node && node.state !== 'selected') {
        this.setNodeState(node, 'hover');
        this.hoveredNode = node;
        
        // Show label
        this.showLabel(node);
      }
    } else {
      this.hoveredNode = null;
      this.hideLabels();
    }
  }
  
  /**
   * Set node visual state
   */
  setNodeState(node, state) {
    node.state = state;

    if (node.mesh.material && node.mesh.material.dispose) {
      this.resourceAuditor.dispose(node.mesh.material);
    }
    
    switch(state) {
      case 'default':
        node.mesh.material = this.resourceAuditor.track(this.materials.get('base').clone(), `node-${node.data.id}-default-material`, 'material');
        node.mesh.material.color = new THREE.Color(node.data.color);
        break;
      case 'hover':
        node.mesh.material = this.resourceAuditor.track(this.materials.get('hover').clone(), `node-${node.data.id}-hover-material`, 'material');
        node.mesh.material.color = new THREE.Color(node.data.color);
        break;
      case 'selected':
        node.mesh.material = this.resourceAuditor.track(this.materials.get('selected').clone(), `node-${node.data.id}-selected-material`, 'material');
        node.mesh.material.color = new THREE.Color(node.data.color);
        break;
    }
  }
  
  /**
   * Show label for a node
   */
  showLabel(node) {
    // Create label if not exists
    if (!this.labels.has(node.data.id)) {
      const label = this.createLabel(node.data.name);
      this.labels.set(node.data.id, label);
    }
    
    const label = this.labels.get(node.data.id);
    label.position.copy(node.group.position);
    label.position.y += 0.8;
    label.visible = true;
    
    if (!label.parent) {
      this.scene.add(label);
    }
  }
  
  /**
   * Hide all labels
   */
  hideLabels() {
    this.labels.forEach(label => {
      label.visible = false;
    });
  }
  
  /**
   * Create a text label
   */
  createLabel(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 256 * dpr;
    canvas.height = 64 * dpr;
    context.scale(dpr, dpr);
    
    // Draw text
    context.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 128, 32);
    
    // Create sprite
    const texture = this.resourceAuditor.track(new THREE.CanvasTexture(canvas), `label-${text}-texture`, 'texture');
    const material = this.resourceAuditor.track(new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9
    }), `label-${text}-material`, 'material');
    
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);
    sprite.visible = false;
    
    return sprite;
  }
  
  /**
   * Update node animations
   */
  update(deltaTime) {
    this.nodes.forEach(node => {
      // Pulsing animation
      if (node.data.pulse && node.data.pulse.active) {
        const pulse = node.data.pulse;
        const scale = 0.1 + (node.data.importance / 10) * 0.4;
        const pulseFactor = 1 + Math.sin(pulse.phase) * 0.1;
        
        node.mesh.scale.setScalar(scale * pulseFactor);
        pulse.phase += pulse.speed * deltaTime;
      }
      
      // Rotation for selected nodes
      if (node.state === 'selected') {
        node.group.rotation.y += deltaTime * 0.5;
      }
    });
    
    // Update glow uniforms if camera is available
    if (this.scene.camera) {
      this.nodes.forEach(node => {
        const glowMesh = node.group.children.find(
          child => child.material && child.material.uniforms
        );
        if (glowMesh) {
          glowMesh.material.uniforms.viewVector.value = new THREE.Vector3()
            .subVectors(this.scene.camera.position, glowMesh.position);
        }
      });
    }
  }
  
  /**
   * Set quality level
   */
  setQuality(quality) {
    const geometry = this.geometries.get(quality);
    
    this.nodes.forEach(node => {
      node.mesh.geometry = geometry;
      
      // Update glow mesh too
      const glowMesh = node.group.children.find(
        child => child.material === this.materials.get('glow')
      );
      if (glowMesh) {
        glowMesh.geometry = geometry;
      }
    });
  }
  
  /**
   * Select a node
   */
  selectNode(nodeId) {
    // Deselect previous
    if (this.selectedNode) {
      this.setNodeState(this.selectedNode, 'default');
    }
    
    // Select new
    const node = this.nodes.find(n => n.data.id === nodeId);
    if (node) {
      this.setNodeState(node, 'selected');
      this.selectedNode = node;
      this.showLabel(node);
    }
  }
  
  /**
   * Get node by ID
   */
  getNodeById(nodeId) {
    return this.nodes.find(n => n.data.id === nodeId);
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Dispose tracked resources
    this.resourceAuditor.disposeAll();
    
    // Remove nodes from scene
    this.nodes.forEach(node => {
      this.scene.remove(node.group);
    });
    
    // Clear arrays
    this.nodes = [];
    this.labels.clear();
  }

  getDisposalAuditReport() {
    return this.resourceAuditor.report();
  }
}
