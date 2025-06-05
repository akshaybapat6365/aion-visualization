/**
 * SimpleCameraController.js
 * Simplified camera controls without external dependencies
 */

const THREE = window.THREE;

export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    
    // Camera state
    this.target = new THREE.Vector3(0, 0, 0);
    this.distance = 10;
    this.theta = 0; // horizontal rotation
    this.phi = Math.PI / 4; // vertical rotation
    
    // Animation
    this.targetTheta = 0;
    this.targetPhi = Math.PI / 4;
    this.targetDistance = 10;
    
    // Mouse state
    this.isMouseDown = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.startX = 0;
    this.startY = 0;
    this.startTheta = 0;
    this.startPhi = 0;
    
    // Damping
    this.dampingFactor = 0.05;
    this.zoomSpeed = 0.1;
    this.rotateSpeed = 0.01;
    
    // Limits
    this.minDistance = 2;
    this.maxDistance = 50;
    this.minPhi = 0.1;
    this.maxPhi = Math.PI - 0.1;
    
    this.setupEventListeners();
    this.updateCameraPosition();
  }
  
  setupEventListeners() {
    // Mouse events
    this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.addEventListener('wheel', this.onWheel.bind(this));
    
    // Touch events
    this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
    
    // Prevent context menu
    this.domElement.addEventListener('contextmenu', e => e.preventDefault());
  }
  
  onMouseDown(event) {
    this.isMouseDown = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startTheta = this.theta;
    this.startPhi = this.phi;
  }
  
  onMouseMove(event) {
    if (!this.isMouseDown) return;
    
    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    
    this.targetTheta = this.startTheta - deltaX * this.rotateSpeed;
    this.targetPhi = Math.max(
      this.minPhi,
      Math.min(this.maxPhi, this.startPhi - deltaY * this.rotateSpeed)
    );
  }
  
  onMouseUp() {
    this.isMouseDown = false;
  }
  
  onWheel(event) {
    event.preventDefault();
    
    const delta = event.deltaY > 0 ? 1.1 : 0.9;
    this.targetDistance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.targetDistance * delta)
    );
  }
  
  onTouchStart(event) {
    if (event.touches.length === 1) {
      this.onMouseDown({
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY
      });
    }
  }
  
  onTouchMove(event) {
    if (event.touches.length === 1) {
      this.onMouseMove({
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY
      });
    }
  }
  
  onTouchEnd() {
    this.onMouseUp();
  }
  
  updateCameraPosition() {
    // Calculate camera position in spherical coordinates
    const x = this.distance * Math.sin(this.phi) * Math.cos(this.theta);
    const y = this.distance * Math.cos(this.phi);
    const z = this.distance * Math.sin(this.phi) * Math.sin(this.theta);
    
    this.camera.position.set(x, y, z);
    this.camera.position.add(this.target);
    this.camera.lookAt(this.target);
  }
  
  update() {
    // Apply damping
    this.theta += (this.targetTheta - this.theta) * this.dampingFactor;
    this.phi += (this.targetPhi - this.phi) * this.dampingFactor;
    this.distance += (this.targetDistance - this.distance) * this.dampingFactor;
    
    this.updateCameraPosition();
  }
  
  focusOnPosition(position, callback) {
    // Animate to new target
    const startTarget = this.target.clone();
    const startTime = Date.now();
    const duration = 1000;
    
    const animate = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      
      this.target.lerpVectors(startTarget, position, eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (callback) {
        callback();
      }
    };
    
    animate();
  }
  
  reset() {
    this.targetTheta = 0;
    this.targetPhi = Math.PI / 4;
    this.targetDistance = 10;
    this.focusOnPosition(new THREE.Vector3(0, 0, 0));
  }
  
  zoom(factor) {
    this.targetDistance = Math.max(
      this.minDistance,
      Math.min(this.maxDistance, this.targetDistance * factor)
    );
  }
  
  rotateLeft() {
    this.targetTheta += Math.PI / 16;
  }
  
  rotateRight() {
    this.targetTheta -= Math.PI / 16;
  }
  
  rotateUp() {
    this.targetPhi = Math.max(this.minPhi, this.targetPhi - Math.PI / 16);
  }
  
  rotateDown() {
    this.targetPhi = Math.min(this.maxPhi, this.targetPhi + Math.PI / 16);
  }
  
  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.domElement.removeEventListener('wheel', this.onWheel.bind(this));
    this.domElement.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.domElement.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.domElement.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }
}