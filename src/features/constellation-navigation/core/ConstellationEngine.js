/**
 * ConstellationEngine.js
 * Main WebGL engine for rendering the concept constellation
 * High-quality, performance-optimized implementation
 */

// Use CDN version of Three.js for simplicity
const THREE = window.THREE;

import { NodeSystem } from './NodeSystem.js';
import { ConnectionRenderer } from './ConnectionRenderer.js';
import { CameraController } from './SimpleCameraController.js';

export class ConstellationEngine {
  constructor(container, conceptData) {
    this.container = container;
    this.conceptData = conceptData;
    this.nodes = new Map();
    this.connections = [];
    this.isInitialized = false;
    this.animationFrameId = null;
    
    // Performance monitoring
    this.stats = {
      fps: 60,
      frameTime: 0,
      drawCalls: 0,
      triangles: 0,
      memory: 0
    };
    
    // Configuration
    this.config = {
      nodeScale: 1,
      connectionOpacity: 0.6,
      animationSpeed: 1,
      particleCount: 1000,
      quality: 'high' // 'low', 'medium', 'high', 'ultra'
    };
    
    this.init();
  }
  
  /**
   * Initialize the WebGL scene
   */
  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 10, 50);
    
    // Renderer setup with optimizations
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.config.quality !== 'low',
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = this.config.quality === 'ultra';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.container.appendChild(this.renderer.domElement);
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 10);
    
    // Initialize subsystems
    this.nodeSystem = new NodeSystem(this.scene, this.config);
    this.connectionRenderer = new ConnectionRenderer(this.scene, this.config);
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    
    // Lighting
    this.setupLighting();
    
    // Load concept data
    this.loadConcepts();
    
    // Event listeners
    this.setupEventListeners();
    
    // Start render loop
    this.isInitialized = true;
    this.animate();
  }
  
  /**
   * Setup scene lighting
   */
  setupLighting() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    // Point lights for node glow effects
    this.conceptData.concepts.forEach((concept, index) => {
      if (concept.importance >= 8) {
        const light = new THREE.PointLight(0xffffff, 0.5, 5);
        light.position.set(...concept.position);
        this.scene.add(light);
      }
    });
    
    // Directional light for depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(5, 5, 5);
    if (this.config.quality === 'ultra') {
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
    }
    this.scene.add(directionalLight);
  }
  
  /**
   * Load and create concept nodes and connections
   */
  loadConcepts() {
    // Create nodes
    this.conceptData.concepts.forEach(concept => {
      const node = this.nodeSystem.createNode(concept);
      this.nodes.set(concept.id, node);
    });
    
    // Create connections
    this.conceptData.concepts.forEach(concept => {
      concept.connections.forEach(targetId => {
        const targetNode = this.nodes.get(targetId);
        if (targetNode) {
          const connection = this.connectionRenderer.createConnection(
            this.nodes.get(concept.id),
            targetNode,
            this.getRelationshipStrength(concept.id, targetId)
          );
          this.connections.push(connection);
        }
      });
    });
  }
  
  /**
   * Get relationship strength between two concepts
   */
  getRelationshipStrength(sourceId, targetId) {
    const relationship = this.conceptData.relationships.find(
      rel => (rel.source === sourceId && rel.target === targetId) ||
             (rel.source === targetId && rel.target === sourceId)
    );
    return relationship ? relationship.strength : 0.5;
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
    
    // Mouse interactions
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    
    // Touch support
    this.renderer.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.renderer.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
  }
  
  /**
   * Handle window resize
   */
  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
  
  /**
   * Handle mouse click for node selection
   */
  onMouseClick(event) {
    const mouse = new THREE.Vector2(
      (event.clientX / this.container.clientWidth) * 2 - 1,
      -(event.clientY / this.container.clientHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    
    const intersects = raycaster.intersectObjects(
      Array.from(this.nodes.values()).map(node => node.mesh)
    );
    
    if (intersects.length > 0) {
      const selectedNode = intersects[0].object.userData;
      this.focusOnNode(selectedNode);
    }
  }
  
  /**
   * Handle mouse move for hover effects
   */
  onMouseMove(event) {
    const mouse = new THREE.Vector2(
      (event.clientX / this.container.clientWidth) * 2 - 1,
      -(event.clientY / this.container.clientHeight) * 2 + 1
    );
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    
    // Update hover states
    this.nodeSystem.updateHoverStates(raycaster);
  }
  
  /**
   * Handle keyboard shortcuts
   */
  onKeyDown(event) {
    switch(event.key) {
      case 'r':
        this.resetView();
        break;
      case '+':
      case '=':
        this.zoomIn();
        break;
      case '-':
        this.zoomOut();
        break;
      case 'ArrowLeft':
        this.cameraController.rotateLeft();
        break;
      case 'ArrowRight':
        this.cameraController.rotateRight();
        break;
      case 'ArrowUp':
        this.cameraController.rotateUp();
        break;
      case 'ArrowDown':
        this.cameraController.rotateDown();
        break;
    }
  }
  
  /**
   * Handle touch events for mobile
   */
  onTouchStart(event) {
    if (event.touches.length === 1) {
      this.onMouseClick({
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY
      });
    }
  }
  
  /**
   * Handle touch move for mobile
   */
  onTouchMove(event) {
    if (event.touches.length === 1) {
      this.onMouseMove({
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY
      });
    }
  }
  
  /**
   * Focus camera on a specific node
   */
  focusOnNode(nodeData) {
    this.cameraController.focusOnPosition(
      new THREE.Vector3(...nodeData.position),
      () => {
        // Callback after focus animation
        this.highlightConnections(nodeData.id);
        this.showNodeDetails(nodeData);
      }
    );
  }
  
  /**
   * Highlight connections for a specific node
   */
  highlightConnections(nodeId) {
    this.connectionRenderer.highlightConnectionsForNode(nodeId);
  }
  
  /**
   * Show detailed information for a node
   */
  showNodeDetails(nodeData) {
    // Dispatch custom event for UI to handle
    this.container.dispatchEvent(new CustomEvent('nodeSelected', {
      detail: nodeData
    }));
  }
  
  /**
   * Reset camera to default view
   */
  resetView() {
    this.cameraController.reset();
    this.connectionRenderer.resetHighlights();
  }
  
  /**
   * Zoom camera in
   */
  zoomIn() {
    this.cameraController.zoom(0.9);
  }
  
  /**
   * Zoom camera out
   */
  zoomOut() {
    this.cameraController.zoom(1.1);
  }
  
  /**
   * Main animation loop
   */
  animate() {
    if (!this.isInitialized) return;
    
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    // Performance monitoring
    const startTime = performance.now();
    
    // Update subsystems
    this.cameraController.update();
    this.nodeSystem.update(this.clock.getDelta());
    this.connectionRenderer.update();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
    
    // Update stats
    this.updateStats(startTime);
  }
  
  /**
   * Update performance statistics
   */
  updateStats(startTime) {
    const frameTime = performance.now() - startTime;
    this.stats.frameTime = frameTime;
    this.stats.fps = Math.round(1000 / frameTime);
    this.stats.drawCalls = this.renderer.info.render.calls;
    this.stats.triangles = this.renderer.info.render.triangles;
    this.stats.memory = this.renderer.info.memory.geometries + 
                       this.renderer.info.memory.textures;
  }
  
  /**
   * Get current performance stats
   */
  getStats() {
    return { ...this.stats };
  }
  
  /**
   * Update quality settings
   */
  setQuality(quality) {
    this.config.quality = quality;
    this.nodeSystem.setQuality(quality);
    this.connectionRenderer.setQuality(quality);
    
    // Update renderer settings
    this.renderer.antialias = quality !== 'low';
    this.renderer.shadowMap.enabled = quality === 'ultra';
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    this.isInitialized = false;
    
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Dispose subsystems
    this.nodeSystem.dispose();
    this.connectionRenderer.dispose();
    this.cameraController.dispose();
    
    // Dispose Three.js resources
    this.renderer.dispose();
    this.scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    // Remove DOM element
    this.container.removeChild(this.renderer.domElement);
    
    // Clear references
    this.nodes.clear();
    this.connections = [];
  }
  
  /**
   * Performance benchmark
   */
  async benchmarkPerformance(nodeCount = 100) {
    const frames = [];
    const duration = 3000; // 3 seconds
    const startTime = performance.now();
    
    while (performance.now() - startTime < duration) {
      const frameStart = performance.now();
      this.renderer.render(this.scene, this.camera);
      frames.push(performance.now() - frameStart);
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    const avgFrameTime = frames.reduce((a, b) => a + b) / frames.length;
    return Math.round(1000 / avgFrameTime);
  }
}

// Clock for animation timing
ConstellationEngine.prototype.clock = new THREE.Clock();