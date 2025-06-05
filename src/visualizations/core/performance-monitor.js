/**
 * Performance Monitor - Real-time FPS and Memory Tracking
 * 
 * Monitors rendering performance and automatically adjusts
 * quality settings to maintain 60fps. Tracks memory usage
 * to prevent leaks during extended sessions.
 * 
 * Premium Design System Component
 */

export class PerformanceMonitor {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    
    // Performance tracking
    this.fps = 60;
    this.frameTime = 16.67;
    this.frameTimes = [];
    this.maxSamples = 60;
    
    // Memory tracking
    this.memoryUsage = 0;
    this.memoryWarningThreshold = 500 * 1024 * 1024; // 500MB
    
    // Quality settings
    this.currentQuality = 'high';
    this.qualityThresholds = {
      downgrade: { fps: 40, sustained: 30 }, // 30 frames below 40fps
      upgrade: { fps: 58, sustained: 60 }    // 60 frames above 58fps
    };
    
    // Performance state
    this.belowThresholdCount = 0;
    this.aboveThresholdCount = 0;
    
    // UI elements
    this.displayElement = null;
    this.showDisplay = false;
    
    // Timing
    this.lastTime = performance.now();
    this.lastMemoryCheck = 0;
    this.memoryCheckInterval = 1000; // Check memory every second
    
    this.init();
  }
  
  init() {
    // Create performance display
    this.createDisplay();
    
    // Check if performance API is available
    if (performance.memory) {
      this.hasMemoryAPI = true;
    }
  }
  
  /**
   * Start frame timing
   */
  begin() {
    this.frameStartTime = performance.now();
  }
  
  /**
   * End frame timing and update stats
   */
  end() {
    const now = performance.now();
    const frameTime = now - this.frameStartTime;
    
    // Update frame times
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }
    
    // Calculate average frame time and FPS
    this.frameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.fps = 1000 / this.frameTime;
    
    // Check memory periodically
    if (now - this.lastMemoryCheck > this.memoryCheckInterval) {
      this.checkMemory();
      this.lastMemoryCheck = now;
    }
    
    // Auto-adjust quality
    this.checkPerformance();
    
    // Update display
    if (this.showDisplay) {
      this.updateDisplay();
    }
  }
  
  /**
   * Check performance and adjust quality
   */
  checkPerformance() {
    if (this.fps < this.qualityThresholds.downgrade.fps) {
      this.belowThresholdCount++;
      this.aboveThresholdCount = 0;
      
      if (this.belowThresholdCount >= this.qualityThresholds.downgrade.sustained) {
        this.downgradeQuality();
        this.belowThresholdCount = 0;
      }
    } else if (this.fps > this.qualityThresholds.upgrade.fps) {
      this.aboveThresholdCount++;
      this.belowThresholdCount = 0;
      
      if (this.aboveThresholdCount >= this.qualityThresholds.upgrade.sustained) {
        this.upgradeQuality();
        this.aboveThresholdCount = 0;
      }
    } else {
      // Reset counters if in acceptable range
      this.belowThresholdCount = Math.max(0, this.belowThresholdCount - 1);
      this.aboveThresholdCount = Math.max(0, this.aboveThresholdCount - 1);
    }
  }
  
  /**
   * Check memory usage
   */
  checkMemory() {
    if (this.hasMemoryAPI) {
      this.memoryUsage = performance.memory.usedJSHeapSize;
      
      if (this.memoryUsage > this.memoryWarningThreshold) {
        console.warn(`High memory usage: ${(this.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
        this.triggerMemoryCleanup();
      }
    }
  }
  
  /**
   * Downgrade rendering quality
   */
  downgradeQuality() {
    switch(this.currentQuality) {
      case 'high':
        this.currentQuality = 'medium';
        break;
      case 'medium':
        this.currentQuality = 'low';
        break;
      case 'low':
        // Already at lowest
        return;
    }
    
    console.log(`Performance: Downgrading to ${this.currentQuality} quality`);
    this.sceneManager.setQuality(this.currentQuality);
    this.onQualityChange(this.currentQuality);
  }
  
  /**
   * Upgrade rendering quality
   */
  upgradeQuality() {
    switch(this.currentQuality) {
      case 'low':
        this.currentQuality = 'medium';
        break;
      case 'medium':
        this.currentQuality = 'high';
        break;
      case 'high':
        // Already at highest
        return;
    }
    
    console.log(`Performance: Upgrading to ${this.currentQuality} quality`);
    this.sceneManager.setQuality(this.currentQuality);
    this.onQualityChange(this.currentQuality);
  }
  
  /**
   * Quality change callback
   */
  onQualityChange(quality) {
    // Dispatch event for other systems to react
    window.dispatchEvent(new CustomEvent('qualitychange', { 
      detail: { quality } 
    }));
  }
  
  /**
   * Trigger memory cleanup
   */
  triggerMemoryCleanup() {
    // Dispatch event for memory cleanup
    window.dispatchEvent(new CustomEvent('memorycleanup'));
    
    // Force garbage collection if available (Chrome with --expose-gc flag)
    if (window.gc) {
      window.gc();
    }
  }
  
  /**
   * Create performance display UI
   */
  createDisplay() {
    this.displayElement = document.createElement('div');
    this.displayElement.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      pointer-events: none;
      display: none;
      line-height: 1.4;
      min-width: 200px;
    `;
    
    document.body.appendChild(this.displayElement);
  }
  
  /**
   * Update performance display
   */
  updateDisplay() {
    const stats = this.sceneManager.getStats();
    const memoryMB = (this.memoryUsage / 1024 / 1024).toFixed(2);
    
    this.displayElement.innerHTML = `
      <strong>Performance Monitor</strong><br>
      FPS: ${this.fps.toFixed(1)} (${this.frameTime.toFixed(2)}ms)<br>
      Quality: ${this.currentQuality}<br>
      Memory: ${memoryMB}MB<br>
      <br>
      <strong>Renderer Stats</strong><br>
      Draw Calls: ${stats.drawCalls}<br>
      Triangles: ${stats.triangles.toLocaleString()}<br>
      Geometries: ${stats.geometries}<br>
      Textures: ${stats.textures}<br>
      Programs: ${stats.programs}
    `;
  }
  
  /**
   * Toggle display visibility
   */
  toggleDisplay() {
    this.showDisplay = !this.showDisplay;
    this.displayElement.style.display = this.showDisplay ? 'block' : 'none';
  }
  
  /**
   * Show display
   */
  show() {
    this.showDisplay = true;
    this.displayElement.style.display = 'block';
  }
  
  /**
   * Hide display
   */
  hide() {
    this.showDisplay = false;
    this.displayElement.style.display = 'none';
  }
  
  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      quality: this.currentQuality,
      memory: this.memoryUsage,
      stats: this.sceneManager.getStats()
    };
  }
  
  /**
   * Reset performance tracking
   */
  reset() {
    this.frameTimes = [];
    this.belowThresholdCount = 0;
    this.aboveThresholdCount = 0;
    this.fps = 60;
    this.frameTime = 16.67;
  }
  
  /**
   * Clean up
   */
  destroy() {
    if (this.displayElement) {
      this.displayElement.remove();
    }
  }
}

// Keyboard shortcut to toggle performance display
document.addEventListener('keydown', (e) => {
  if (e.key === 'p' && e.ctrlKey && e.shiftKey) {
    const monitor = window.performanceMonitor;
    if (monitor) {
      monitor.toggleDisplay();
    }
  }
});