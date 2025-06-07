/**
 * CursorTracker.js
 * Smooth cursor position tracking with prediction and interpolation
 * Provides accurate position data for magnetic field calculations
 */

export class CursorTracker {
  constructor(options = {}) {
    this.options = {
      smoothingFactor: 0.15,
      predictionFrames: 2,
      historySize: 10,
      updateRate: 60,
      ...options
    };

    this.position = { x: 0, y: 0 };
    this.smoothPosition = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.history = [];
    this.isActive = false;
    this.lastUpdateTime = 0;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.startUpdateLoop();
  }

  setupEventListeners() {
    // Mouse events
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    document.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Touch events for mobile
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // Pointer events for better compatibility
    if (window.PointerEvent) {
      document.addEventListener('pointermove', this.handlePointerMove.bind(this));
    }
  }

  handleMouseMove(event) {
    this.updatePosition(event.clientX, event.clientY);
    this.isActive = true;
  }

  handleMouseEnter() {
    this.isActive = true;
  }

  handleMouseLeave() {
    this.isActive = false;
  }

  handleTouchStart(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updatePosition(touch.clientX, touch.clientY);
      this.isActive = true;
    }
  }

  handleTouchMove(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updatePosition(touch.clientX, touch.clientY);
    }
  }

  handleTouchEnd() {
    this.isActive = false;
  }

  handlePointerMove(event) {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      this.updatePosition(event.clientX, event.clientY);
      this.isActive = true;
    }
  }

  updatePosition(x, y) {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;

    if (deltaTime > 0) {
      // Store previous values
      const prevX = this.position.x;
      const prevY = this.position.y;
      const prevVx = this.velocity.x;
      const prevVy = this.velocity.y;

      // Update raw position
      this.position.x = x;
      this.position.y = y;

      // Calculate velocity
      this.velocity.x = (x - prevX) / deltaTime * 1000;
      this.velocity.y = (y - prevY) / deltaTime * 1000;

      // Calculate acceleration
      this.acceleration.x = (this.velocity.x - prevVx) / deltaTime * 1000;
      this.acceleration.y = (this.velocity.y - prevVy) / deltaTime * 1000;

      // Update history
      this.updateHistory({
        x, y,
        vx: this.velocity.x,
        vy: this.velocity.y,
        ax: this.acceleration.x,
        ay: this.acceleration.y,
        time: currentTime
      });
    }

    this.lastUpdateTime = currentTime;
  }

  updateHistory(data) {
    this.history.push(data);
    if (this.history.length > this.options.historySize) {
      this.history.shift();
    }
  }

  startUpdateLoop() {
    const update = () => {
      this.updateSmoothedPosition();
      requestAnimationFrame(update);
    };
    update();
  }

  updateSmoothedPosition() {
    const { smoothingFactor } = this.options;
    
    // Exponential smoothing
    this.smoothPosition.x += (this.position.x - this.smoothPosition.x) * smoothingFactor;
    this.smoothPosition.y += (this.position.y - this.smoothPosition.y) * smoothingFactor;
  }

  getPredictedPosition(frames = 1) {
    // Simple linear prediction based on velocity
    return {
      x: this.smoothPosition.x + this.velocity.x * frames / 60,
      y: this.smoothPosition.y + this.velocity.y * frames / 60
    };
  }

  getSmoothedVelocity() {
    if (this.history.length < 2) return { x: 0, y: 0 };

    // Average velocity over recent history
    let sumVx = 0, sumVy = 0;
    let count = Math.min(3, this.history.length - 1);

    for (let i = this.history.length - count; i < this.history.length; i++) {
      sumVx += this.history[i].vx;
      sumVy += this.history[i].vy;
    }

    return {
      x: sumVx / count,
      y: sumVy / count
    };
  }

  getDirection() {
    const velocity = this.getSmoothedVelocity();
    const magnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

    if (magnitude === 0) return { x: 0, y: 0 };

    return {
      x: velocity.x / magnitude,
      y: velocity.y / magnitude
    };
  }

  getSpeed() {
    const velocity = this.getSmoothedVelocity();
    return Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
  }

  reset() {
    this.position = { x: 0, y: 0 };
    this.smoothPosition = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.acceleration = { x: 0, y: 0 };
    this.history = [];
    this.isActive = false;
    this.lastUpdateTime = 0;
  }

  destroy() {
    // Remove event listeners
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseenter', this.handleMouseEnter);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
    
    if (window.PointerEvent) {
      document.removeEventListener('pointermove', this.handlePointerMove);
    }
  }
}