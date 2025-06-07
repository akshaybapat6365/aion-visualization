/**
 * CameraController.js
 * Advanced camera controls for constellation navigation
 * Implements smooth animations and various control schemes
 */

// Use CDN version of Three.js
const THREE = window.THREE;

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Default position
    this.defaultPosition = new THREE.Vector3(0, 0, 10);
    this.defaultTarget = new THREE.Vector3(0, 0, 0);
    
    // Animation state
    this.isAnimating = false;
    this.animationDuration = 1000; // ms
    this.animationStart = null;
    this.animationFrom = {
      position: new THREE.Vector3(),
      target: new THREE.Vector3()
    };
    this.animationTo = {
      position: new THREE.Vector3(),
      target: new THREE.Vector3()
    };
    this.animationCallback = null;
    
    // Manual orbit controls implementation
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();
    this.target = new THREE.Vector3();
    this.panOffset = new THREE.Vector3();
    
    this.rotateStart = new THREE.Vector2();
    this.rotateEnd = new THREE.Vector2();
    this.rotateDelta = new THREE.Vector2();
    
    this.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    
    this.setupControls();
    
    // Touch gesture support
    this.touches = new Map();
    this.lastPinchDistance = 0;
    
    // Keyboard state
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      shift: false
    };
    
    this.setupEventListeners();
  }
  
  /**
   * Setup orbit controls
   */
  setupControls() {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI;
    
    // Smooth zooming
    this.controls.zoomSpeed = 0.8;
    this.controls.rotateSpeed = 0.5;
    
    // Auto-rotation when idle
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.5;
    
    // Save initial state
    this.controls.saveState();
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
    
    // Touch controls
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
    
    // Mouse wheel with smooth zoom
    this.domElement.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    
    // Double click to focus
    this.domElement.addEventListener('dblclick', this.onDoubleClick.bind(this));
  }
  
  /**
   * Handle keyboard input
   */
  onKeyDown(event) {
    switch(event.key) {
      case 'ArrowUp':
      case 'w':
        this.keys.up = true;
        break;
      case 'ArrowDown':
      case 's':
        this.keys.down = true;
        break;
      case 'ArrowLeft':
      case 'a':
        this.keys.left = true;
        break;
      case 'ArrowRight':
      case 'd':
        this.keys.right = true;
        break;
      case 'Shift':
        this.keys.shift = true;
        break;
    }
  }
  
  /**
   * Handle keyboard release
   */
  onKeyUp(event) {
    switch(event.key) {
      case 'ArrowUp':
      case 'w':
        this.keys.up = false;
        break;
      case 'ArrowDown':
      case 's':
        this.keys.down = false;
        break;
      case 'ArrowLeft':
      case 'a':
        this.keys.left = false;
        break;
      case 'ArrowRight':
      case 'd':
        this.keys.right = false;
        break;
      case 'Shift':
        this.keys.shift = false;
        break;
    }
  }
  
  /**
   * Handle touch start
   */
  onTouchStart(event) {
    event.preventDefault();
    
    for (let touch of event.touches) {
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      });
    }
    
    // Initialize pinch distance
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.lastPinchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    }
  }
  
  /**
   * Handle touch move
   */
  onTouchMove(event) {
    event.preventDefault();
    
    // Pinch to zoom
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const pinchDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (this.lastPinchDistance > 0) {
        const scale = pinchDistance / this.lastPinchDistance;
        this.zoom(2 - scale);
      }
      
      this.lastPinchDistance = pinchDistance;
    }
    
    // Update touch positions
    for (let touch of event.touches) {
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY
      });
    }
  }
  
  /**
   * Handle touch end
   */
  onTouchEnd(event) {
    for (let touch of event.changedTouches) {
      this.touches.delete(touch.identifier);
    }
    
    if (event.touches.length < 2) {
      this.lastPinchDistance = 0;
    }
  }
  
  /**
   * Handle mouse wheel with smooth zoom
   */
  onWheel(event) {
    event.preventDefault();
    
    const delta = event.deltaY * 0.001;
    this.smoothZoom(1 + delta);
  }
  
  /**
   * Handle double click
   */
  onDoubleClick(event) {
    // Could implement raycasting here to focus on clicked object
    this.reset();
  }
  
  /**
   * Update camera controls
   */
  update() {
    // Handle keyboard input
    const moveSpeed = this.keys.shift ? 0.5 : 0.1;
    
    if (this.keys.up) {
      this.controls.target.z -= moveSpeed;
    }
    if (this.keys.down) {
      this.controls.target.z += moveSpeed;
    }
    if (this.keys.left) {
      this.controls.target.x -= moveSpeed;
    }
    if (this.keys.right) {
      this.controls.target.x += moveSpeed;
    }
    
    // Update animation
    if (this.isAnimating) {
      this.updateAnimation();
    }
    
    // Update orbit controls
    this.controls.update();
  }
  
  /**
   * Update camera animation
   */
  updateAnimation() {
    const now = Date.now();
    const progress = Math.min((now - this.animationStart) / this.animationDuration, 1);
    
    // Easing function (ease-in-out cubic)
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    // Interpolate position
    this.camera.position.lerpVectors(
      this.animationFrom.position,
      this.animationTo.position,
      eased
    );
    
    // Interpolate target
    this.controls.target.lerpVectors(
      this.animationFrom.target,
      this.animationTo.target,
      eased
    );
    
    // Complete animation
    if (progress >= 1) {
      this.isAnimating = false;
      if (this.animationCallback) {
        this.animationCallback();
        this.animationCallback = null;
      }
    }
  }
  
  /**
   * Focus camera on a specific position
   */
  focusOnPosition(position, callback) {
    // Calculate optimal camera position
    const distance = 5;
    const offset = new THREE.Vector3(0, 2, distance);
    const targetPosition = position.clone().add(offset);
    
    // Start animation
    this.animationFrom.position.copy(this.camera.position);
    this.animationFrom.target.copy(this.controls.target);
    this.animationTo.position.copy(targetPosition);
    this.animationTo.target.copy(position);
    
    this.isAnimating = true;
    this.animationStart = Date.now();
    this.animationCallback = callback;
  }
  
  /**
   * Reset camera to default view
   */
  reset() {
    this.focusOnPosition(this.defaultTarget);
  }
  
  /**
   * Zoom camera
   */
  zoom(factor) {
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize();
    
    const distance = this.camera.position.distanceTo(this.controls.target);
    const newDistance = distance * factor;
    
    // Clamp to min/max distance
    const clampedDistance = Math.max(
      this.controls.minDistance,
      Math.min(this.controls.maxDistance, newDistance)
    );
    
    this.camera.position.copy(
      this.controls.target.clone().add(
        direction.multiplyScalar(clampedDistance)
      )
    );
  }
  
  /**
   * Smooth zoom animation
   */
  smoothZoom(factor) {
    const startPosition = this.camera.position.clone();
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize();
    
    const distance = this.camera.position.distanceTo(this.controls.target);
    const newDistance = distance * factor;
    
    // Clamp to min/max distance
    const clampedDistance = Math.max(
      this.controls.minDistance,
      Math.min(this.controls.maxDistance, newDistance)
    );
    
    const targetPosition = this.controls.target.clone().add(
      direction.multiplyScalar(clampedDistance)
    );
    
    // Animate zoom
    const startTime = Date.now();
    const duration = 200;
    
    const animateZoom = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      
      this.camera.position.lerpVectors(startPosition, targetPosition, eased);
      
      if (progress < 1) {
        requestAnimationFrame(animateZoom);
      }
    };
    
    animateZoom();
  }
  
  /**
   * Rotate camera left
   */
  rotateLeft() {
    this.controls.rotateLeft(Math.PI / 32);
  }
  
  /**
   * Rotate camera right
   */
  rotateRight() {
    this.controls.rotateLeft(-Math.PI / 32);
  }
  
  /**
   * Rotate camera up
   */
  rotateUp() {
    this.controls.rotateUp(Math.PI / 32);
  }
  
  /**
   * Rotate camera down
   */
  rotateDown() {
    this.controls.rotateUp(-Math.PI / 32);
  }
  
  /**
   * Enable/disable auto-rotation
   */
  setAutoRotate(enabled) {
    this.controls.autoRotate = enabled;
  }
  
  /**
   * Get camera state
   */
  getState() {
    return {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
      zoom: this.camera.zoom
    };
  }
  
  /**
   * Set camera state
   */
  setState(state) {
    this.camera.position.copy(state.position);
    this.controls.target.copy(state.target);
    this.camera.zoom = state.zoom;
    this.camera.updateProjectionMatrix();
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    // Remove event listeners
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
    
    this.domElement.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.domElement.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.domElement.removeEventListener('touchend', this.onTouchEnd.bind(this));
    this.domElement.removeEventListener('wheel', this.onWheel.bind(this));
    this.domElement.removeEventListener('dblclick', this.onDoubleClick.bind(this));
    
    // Dispose controls
    this.controls.dispose();
  }
}