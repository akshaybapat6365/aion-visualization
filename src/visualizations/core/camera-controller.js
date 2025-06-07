/**
 * Camera Controller - Smooth 3D Navigation
 * 
 * Provides intuitive camera controls for exploring 3D visualizations.
 * Supports mouse, touch, and keyboard input with smooth damping
 * and intelligent constraints.
 * 
 * Premium Design System Component
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Control settings
    this.settings = {
      enableDamping: true,
      dampingFactor: 0.05,
      rotateSpeed: 0.5,
      zoomSpeed: 0.8,
      panSpeed: 0.5,
      
      // Constraints
      minDistance: 2,
      maxDistance: 50,
      minPolarAngle: Math.PI * 0.1,
      maxPolarAngle: Math.PI * 0.9,
      
      // Auto-rotation
      autoRotate: false,
      autoRotateSpeed: 0.5,
      
      // Smooth transitions
      transitionDuration: 1500,
      transitionEasing: 'easeInOutCubic'
    };
    
    // State
    this.isTransitioning = false;
    this.transitionStart = null;
    this.transitionFrom = {};
    this.transitionTo = {};
    
    // Keyboard state
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false
    };
    
    this.init();
  }
  
  init() {
    // Create OrbitControls
    this.controls = new OrbitControls(this.camera, this.domElement);
    
    // Apply settings
    this.applySettings();
    
    // Setup keyboard controls
    this.setupKeyboardControls();
    
    // Setup touch gestures
    this.setupTouchGestures();
    
    // Custom animations
    this.animations = {
      orbit: null,
      focus: null
    };
  }
  
  /**
   * Apply control settings
   */
  applySettings() {
    Object.assign(this.controls, {
      enableDamping: this.settings.enableDamping,
      dampingFactor: this.settings.dampingFactor,
      rotateSpeed: this.settings.rotateSpeed,
      zoomSpeed: this.settings.zoomSpeed,
      panSpeed: this.settings.panSpeed,
      minDistance: this.settings.minDistance,
      maxDistance: this.settings.maxDistance,
      minPolarAngle: this.settings.minPolarAngle,
      maxPolarAngle: this.settings.maxPolarAngle,
      autoRotate: this.settings.autoRotate,
      autoRotateSpeed: this.settings.autoRotateSpeed
    });
  }
  
  /**
   * Update controls
   */
  update() {
    // Handle transitions
    if (this.isTransitioning) {
      this.updateTransition();
    }
    
    // Handle keyboard input
    this.handleKeyboardInput();
    
    // Update OrbitControls
    this.controls.update();
  }
  
  /**
   * Transition camera to target
   */
  transitionTo(target, options = {}) {
    const {
      position = null,
      lookAt = null,
      duration = this.settings.transitionDuration,
      onComplete = null
    } = options;
    
    // Cancel any existing transition
    this.isTransitioning = false;
    
    // Setup transition
    this.transitionStart = performance.now();
    this.transitionDuration = duration;
    this.transitionOnComplete = onComplete;
    
    // Store current state
    this.transitionFrom = {
      position: this.camera.position.clone(),
      target: this.controls.target.clone()
    };
    
    // Calculate target state
    this.transitionTo = {
      position: position ? new THREE.Vector3(...position) : this.camera.position.clone(),
      target: lookAt ? new THREE.Vector3(...lookAt) : this.controls.target.clone()
    };
    
    this.isTransitioning = true;
  }
  
  /**
   * Update camera transition
   */
  updateTransition() {
    const elapsed = performance.now() - this.transitionStart;
    const progress = Math.min(elapsed / this.transitionDuration, 1);
    
    // Apply easing
    const eased = this.ease(progress, this.settings.transitionEasing);
    
    // Interpolate position
    this.camera.position.lerpVectors(
      this.transitionFrom.position,
      this.transitionTo.position,
      eased
    );
    
    // Interpolate target
    this.controls.target.lerpVectors(
      this.transitionFrom.target,
      this.transitionTo.target,
      eased
    );
    
    // Complete transition
    if (progress >= 1) {
      this.isTransitioning = false;
      if (this.transitionOnComplete) {
        this.transitionOnComplete();
      }
    }
  }
  
  /**
   * Focus on object
   */
  focusOn(object, options = {}) {
    const {
      distance = 10,
      duration = this.settings.transitionDuration,
      offset = [0, 0, 0]
    } = options;
    
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Calculate camera position
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * distance;
    
    // Calculate position based on current angle
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize();
    
    const position = new THREE.Vector3()
      .copy(direction)
      .multiplyScalar(cameraDistance)
      .add(center)
      .add(new THREE.Vector3(...offset));
    
    // Transition to focus
    this.transitionTo(object, {
      position: position.toArray(),
      lookAt: center.toArray(),
      duration
    });
  }
  
  /**
   * Orbit around target
   */
  startOrbit(speed = this.settings.autoRotateSpeed) {
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = speed;
  }
  
  /**
   * Stop orbiting
   */
  stopOrbit() {
    this.controls.autoRotate = false;
  }
  
  /**
   * Reset camera to default position
   */
  reset(duration = this.settings.transitionDuration) {
    this.transitionTo(null, {
      position: [0, 0, 10],
      lookAt: [0, 0, 0],
      duration
    });
  }
  
  /**
   * Setup keyboard controls
   */
  setupKeyboardControls() {
    // Key down
    window.addEventListener('keydown', (e) => {
      switch(e.key.toLowerCase()) {
        case 'w': this.keys.forward = true; break;
        case 's': this.keys.backward = true; break;
        case 'a': this.keys.left = true; break;
        case 'd': this.keys.right = true; break;
        case 'q': this.keys.up = true; break;
        case 'e': this.keys.down = true; break;
        case 'r': this.reset(); break;
        case 'o': this.toggleOrbit(); break;
      }
    });
    
    // Key up
    window.addEventListener('keyup', (e) => {
      switch(e.key.toLowerCase()) {
        case 'w': this.keys.forward = false; break;
        case 's': this.keys.backward = false; break;
        case 'a': this.keys.left = false; break;
        case 'd': this.keys.right = false; break;
        case 'q': this.keys.up = false; break;
        case 'e': this.keys.down = false; break;
      }
    });
  }
  
  /**
   * Handle keyboard input
   */
  handleKeyboardInput() {
    const speed = 0.1;
    const direction = new THREE.Vector3();
    
    if (this.keys.forward) direction.z -= speed;
    if (this.keys.backward) direction.z += speed;
    if (this.keys.left) direction.x -= speed;
    if (this.keys.right) direction.x += speed;
    if (this.keys.up) direction.y += speed;
    if (this.keys.down) direction.y -= speed;
    
    if (direction.length() > 0) {
      // Apply camera rotation to direction
      direction.applyQuaternion(this.camera.quaternion);
      
      // Move camera and target
      this.camera.position.add(direction);
      this.controls.target.add(direction);
    }
  }
  
  /**
   * Setup touch gestures
   */
  setupTouchGestures() {
    let touchStartDistance = 0;
    let touchStartRotation = 0;
    
    this.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        // Calculate initial pinch distance
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate initial rotation
        touchStartRotation = Math.atan2(dy, dx);
      }
    });
    
    this.domElement.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        // Calculate current pinch distance
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Zoom based on pinch
        const scale = distance / touchStartDistance;
        this.controls.dollyIn(scale);
        touchStartDistance = distance;
        
        // Rotate based on twist
        const rotation = Math.atan2(dy, dx);
        const deltaRotation = rotation - touchStartRotation;
        this.controls.rotateLeft(deltaRotation);
        touchStartRotation = rotation;
      }
    });
  }
  
  /**
   * Toggle orbit mode
   */
  toggleOrbit() {
    if (this.controls.autoRotate) {
      this.stopOrbit();
    } else {
      this.startOrbit();
    }
  }
  
  /**
   * Easing functions
   */
  ease(t, type) {
    switch(type) {
      case 'linear':
        return t;
      case 'easeInQuad':
        return t * t;
      case 'easeOutQuad':
        return t * (2 - t);
      case 'easeInOutQuad':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'easeInCubic':
        return t * t * t;
      case 'easeOutCubic':
        return (--t) * t * t + 1;
      case 'easeInOutCubic':
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      default:
        return this.ease(t, 'easeInOutCubic');
    }
  }
  
  /**
   * Get camera state
   */
  getState() {
    return {
      position: this.camera.position.toArray(),
      target: this.controls.target.toArray(),
      zoom: this.camera.zoom
    };
  }
  
  /**
   * Set camera state
   */
  setState(state, animate = false) {
    if (animate) {
      this.transitionTo(null, {
        position: state.position,
        lookAt: state.target
      });
    } else {
      this.camera.position.fromArray(state.position);
      this.controls.target.fromArray(state.target);
      if (state.zoom) this.camera.zoom = state.zoom;
      this.camera.updateProjectionMatrix();
    }
  }
  
  /**
   * Enable/disable controls
   */
  setEnabled(enabled) {
    this.controls.enabled = enabled;
  }
  
  /**
   * Clean up
   */
  destroy() {
    this.controls.dispose();
    window.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('keyup', this.handleKeyup);
  }
}