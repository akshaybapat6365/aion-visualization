/**
 * Scene Manager - Core WebGL/Three.js Management
 * 
 * Handles scene lifecycle, rendering, and resource management
 * for all Aion visualizations. Maintains 60fps performance
 * while delivering stunning monochromatic visuals.
 * 
 * Premium Design System Component
 */

import * as THREE from 'three';
import { PerformanceMonitor } from './performance-monitor.js';
import { MaterialSystem } from './material-system.js';
import { CameraController } from './camera-controller.js';

export class SceneManager {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      ...options
    };
    
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.cameraController = null;
    this.performanceMonitor = null;
    this.materialSystem = null;
    
    this.renderCallbacks = new Set();
    this.disposables = new Set();
    
    this.init();
  }
  
  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 10, 50);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.options.antialias,
      alpha: this.options.alpha,
      powerPreference: this.options.powerPreference,
      preserveDrawingBuffer: true // For screenshots
    });
    
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // Monochromatic output
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    
    this.container.appendChild(this.renderer.domElement);
    
    // Create camera
    const aspect = this.container.offsetWidth / this.container.offsetHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 10);
    
    // Initialize systems
    this.cameraController = new CameraController(this.camera, this.renderer.domElement);
    this.performanceMonitor = new PerformanceMonitor(this);
    this.materialSystem = new MaterialSystem();
    
    // Setup resize handler
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    
    // Start render loop
    this.animate();
  }
  
  /**
   * Main render loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update performance monitor
    this.performanceMonitor.begin();
    
    // Update camera
    this.cameraController.update();
    
    // Execute render callbacks
    this.renderCallbacks.forEach(callback => callback());
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
    
    // End performance monitoring
    this.performanceMonitor.end();
  }
  
  /**
   * Add object to scene with automatic disposal tracking
   */
  add(object) {
    this.scene.add(object);
    this.disposables.add(object);
    return object;
  }
  
  /**
   * Remove and dispose object
   */
  remove(object) {
    this.scene.remove(object);
    this.dispose(object);
  }
  
  /**
   * Dispose of Three.js resources
   */
  dispose(object) {
    if (!object) return;
    
    // Dispose geometry
    if (object.geometry) {
      object.geometry.dispose();
    }
    
    // Dispose material(s)
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => {
          this.disposeMaterial(material);
        });
      } else {
        this.disposeMaterial(object.material);
      }
    }
    
    // Dispose children
    if (object.children) {
      object.children.forEach(child => this.dispose(child));
    }
    
    this.disposables.delete(object);
  }
  
  /**
   * Dispose material and its textures
   */
  disposeMaterial(material) {
    if (!material) return;
    
    // Dispose textures
    Object.keys(material).forEach(key => {
      const value = material[key];
      if (value && value.isTexture) {
        value.dispose();
      }
    });
    
    // Dispose material
    material.dispose();
  }
  
  /**
   * Add callback to render loop
   */
  onRender(callback) {
    this.renderCallbacks.add(callback);
    return () => this.renderCallbacks.delete(callback);
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }
  
  /**
   * Set render quality based on performance
   */
  setQuality(quality) {
    switch(quality) {
      case 'high':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        break;
        
      case 'medium':
        this.renderer.setPixelRatio(1.5);
        this.renderer.shadowMap.enabled = true;
        break;
        
      case 'low':
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;
        break;
    }
  }
  
  /**
   * Take screenshot
   */
  screenshot() {
    return this.renderer.domElement.toDataURL('image/png');
  }
  
  /**
   * Get scene statistics
   */
  getStats() {
    return {
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      programs: this.renderer.info.programs.length,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      points: this.renderer.info.render.points,
      lines: this.renderer.info.render.lines
    };
  }
  
  /**
   * Clean up all resources
   */
  destroy() {
    // Stop render loop
    this.performanceMonitor.destroy();
    
    // Dispose all objects
    this.disposables.forEach(object => this.dispose(object));
    
    // Clean up camera controller
    this.cameraController.destroy();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize);
    
    // Dispose renderer
    this.renderer.dispose();
    this.renderer.domElement.remove();
    
    // Clear references
    this.scene = null;
    this.renderer = null;
    this.camera = null;
  }
}

// Singleton for easy access
let instance = null;

export function getSceneManager(container, options) {
  if (!instance && container) {
    instance = new SceneManager(container, options);
  }
  return instance;
}

export function destroySceneManager() {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}