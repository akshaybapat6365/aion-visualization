/**
 * Optimized WebGL Manager - Phase 5 Performance Optimizations
 * Lightweight Three.js usage with memory management
 */

class OptimizedWebGLManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrame = null;
    this.isInitialized = false;
    this.memoryMonitor = {
      geometries: 0,
      materials: 0,
      textures: 0
    };
  }
    
  // Lazy initialization - only create when needed
  async init(canvas) {
    if (this.isInitialized) return;
        
    try {
      // Check WebGL support
      if (!this.checkWebGLSupport()) {
        console.warn('WebGL not supported, falling back to 2D');
        return this.initFallback(canvas);
      }
            
      // Import Three.js modules only when needed
      const THREE = await this.loadThreeJS();
            
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
      this.renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: false, // Disable for performance
        powerPreference: 'default' // Don't force high-performance GPU
      });
            
      this.isInitialized = true;
      console.log('WebGL Manager initialized successfully');
            
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      return this.initFallback(canvas);
    }
  }
    
  // Check WebGL support
  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
    } catch (e) {
      return false;
    }
  }
    
  // Lazy load Three.js
  async loadThreeJS() {
    if (window.THREE) return window.THREE;
        
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => resolve(window.THREE);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
    
  // Fallback for unsupported devices
  initFallback(canvas) {
    const ctx = canvas.getContext('2d');
    this.renderFallback(ctx);
    return { fallback: true };
  }
    
  renderFallback(ctx) {
    // Simple 2D fallback animation
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Visualization Loading...', ctx.canvas.width / 2, ctx.canvas.height / 2);
  }
    
  // Memory cleanup
  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
        
    if (this.renderer) {
      this.renderer.dispose();
    }
        
    if (this.scene) {
      this.scene.clear();
    }
        
    this.isInitialized = false;
    console.log('WebGL Manager disposed');
  }
    
  // Monitor memory usage
  getMemoryUsage() {
    if (!this.renderer) return null;
        
    return {
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      programs: this.renderer.info.programs?.length || 0
    };
  }
}

// Global instance
window.OptimizedWebGLManager = new OptimizedWebGLManager();
