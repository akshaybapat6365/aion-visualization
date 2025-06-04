// Advanced WebGL Context Manager for Aion Visualization
// Implements intelligent memory management and performance optimization

class WebGLContextManager {
  constructor() {
    this.activeContexts = new Map();
    this.contextPool = [];
    // Reduced context limit to further minimize resource usage
    this.maxContexts = 4;
    this.memoryThreshold = 150 * 1024 * 1024; // 150MB
    this.performanceMonitor = new PerformanceMonitor();
    this.isLowMemoryDevice = this.detectLowMemoryDevice();
        
    // Adjust limits for low-memory devices
    if (this.isLowMemoryDevice) {
      this.maxContexts = 3;
      this.memoryThreshold = 75 * 1024 * 1024; // 75MB
    }
        
    this.setupMemoryMonitoring();
  }
    
  detectLowMemoryDevice() {
    // Check device memory if available
    if (navigator.deviceMemory) {
      return navigator.deviceMemory <= 4; // 4GB or less
    }
        
    // Check user agent for mobile devices
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobile;
  }
    
  setupMemoryMonitoring() {
    // Monitor memory usage every 10 seconds
    setInterval(() => {
      this.checkMemoryUsage();
    }, 10000);
        
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAllContexts();
      } else {
        this.resumeAllContexts();
      }
    });
        
    // Handle beforeunload to cleanup
    window.addEventListener('beforeunload', () => {
      this.cleanupAllContexts();
    });
  }
    
  checkMemoryUsage() {
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize;
            
      if (memoryUsage > this.memoryThreshold) {
        console.warn(`Memory usage high: ${Math.round(memoryUsage / 1024 / 1024)}MB`);
        this.performMemoryCleanup();
      }
    }
  }
    
  performMemoryCleanup() {
    // Force garbage collection hints
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
        
    // Clean up oldest/least active contexts
    const sortedContexts = Array.from(this.activeContexts.entries())
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
        
    const contextsToClean = Math.ceil(sortedContexts.length * 0.3); // Clean 30%
        
    for (let i = 0; i < contextsToClean && i < sortedContexts.length; i++) {
      const [contextId] = sortedContexts[i];
      this.releaseContext(contextId);
    }
  }
    
  acquireContext(canvas, options = {}) {
    const contextId = canvas.id || `context-${Date.now()}-${Math.random()}`;
        
    // Check if we already have a context for this canvas
    if (this.activeContexts.has(contextId)) {
      const contextData = this.activeContexts.get(contextId);
      contextData.lastUsed = Date.now();
      return contextData.gl;
    }
        
    // Check memory before creating new context
    if (!this.canCreateNewContext()) {
      console.warn('Cannot create new WebGL context - memory/limit constraints');
      return this.getFallbackContext(canvas);
    }
        
    // Try to get context from pool first
    let gl = this.getPooledContext(canvas, options);
        
    if (!gl) {
      // Create new context
      gl = this.createNewContext(canvas, options);
    }
        
    if (gl) {
      // Register context
      this.activeContexts.set(contextId, {
        gl: gl,
        canvas: canvas,
        created: Date.now(),
        lastUsed: Date.now(),
        memoryUsage: this.estimateContextMemory(canvas),
        options: options,
        isPaused: false
      });
            
      // Set up context monitoring
      this.setupContextMonitoring(contextId, gl, canvas);
    }
        
    return gl;
  }
    
  canCreateNewContext() {
    // Check context limit
    if (this.activeContexts.size >= this.maxContexts) {
      return false;
    }
        
    // Check memory usage
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize;
      const projectedUsage = memoryUsage + (30 * 1024 * 1024); // Estimate 30MB per context
            
      if (projectedUsage > this.memoryThreshold) {
        return false;
      }
    }
        
    return true;
  }
    
  getPooledContext(canvas, options) {
    // Look for compatible context in pool
    for (let i = 0; i < this.contextPool.length; i++) {
      const pooledContext = this.contextPool[i];
            
      if (this.isContextCompatible(pooledContext.options, options)) {
        // Remove from pool and adapt to new canvas
        this.contextPool.splice(i, 1);
        return this.adaptContextToCanvas(pooledContext.gl, canvas);
      }
    }
        
    return null;
  }
    
  createNewContext(canvas, options) {
    const contextAttributes = {
      alpha: options.alpha !== false,
      antialias: this.isLowMemoryDevice ? false : (options.antialias !== false),
      depth: options.depth !== false,
      preserveDrawingBuffer: options.preserveDrawingBuffer || false,
      powerPreference: this.isLowMemoryDevice ? 'low-power' : (options.powerPreference || 'default'),
      failIfMajorPerformanceCaveat: this.isLowMemoryDevice
    };
        
    let gl = null;
        
    try {
      // Try WebGL2 first (if not on low memory device)
      if (!this.isLowMemoryDevice && options.preferWebGL2 !== false) {
        gl = canvas.getContext('webgl2', contextAttributes);
      }
            
      // Fall back to WebGL1
      if (!gl) {
        gl = canvas.getContext('webgl', contextAttributes) ||
                     canvas.getContext('experimental-webgl', contextAttributes);
      }
            
      if (gl) {
        this.setupContextLossHandling(gl, canvas);
      }
            
    } catch (error) {
      console.error('WebGL context creation failed:', error);
      return null;
    }
        
    return gl;
  }
    
  setupContextLossHandling(gl, canvas) {
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.warn('WebGL context lost');
      this.handleContextLoss(canvas, event);
    });
        
    canvas.addEventListener('webglcontextrestored', (event) => {
      console.log('WebGL context restored');
      this.handleContextRestore(canvas, event);
    });
  }
    
  setupContextMonitoring(contextId, gl, canvas) {
    // Monitor context usage
    const originalDrawArrays = gl.drawArrays;
    const originalDrawElements = gl.drawElements;
        
    let drawCallCount = 0;
        
    gl.drawArrays = function(...args) {
      drawCallCount++;
      return originalDrawArrays.apply(this, args);
    };
        
    gl.drawElements = function(...args) {
      drawCallCount++;
      return originalDrawElements.apply(this, args);
    };
        
    // Update usage statistics
    setInterval(() => {
      const contextData = this.activeContexts.get(contextId);
      if (contextData) {
        contextData.drawCalls = drawCallCount;
        contextData.lastUsed = Date.now();
        drawCallCount = 0;
      }
    }, 5000);
  }
    
  releaseContext(contextId) {
    const contextData = this.activeContexts.get(contextId);
    if (!contextData) return;
        
    const { gl, canvas, options } = contextData;
        
    // Clean up WebGL resources
    this.cleanupWebGLResources(gl);
        
    // Check if context can be pooled
    if (this.contextPool.length < 3 && !this.isLowMemoryDevice) {
      this.contextPool.push({
        gl: gl,
        options: options,
        pooled: Date.now()
      });
    }
        
    // Clear canvas
    canvas.width = 1;
    canvas.height = 1;
        
    // Remove from active contexts
    this.activeContexts.delete(contextId);
        
    console.log(`Released WebGL context: ${contextId}`);
  }
    
  cleanupWebGLResources(gl) {
    // Get all WebGL resources and clean them up
    const extensions = gl.getSupportedExtensions();
        
    // Clear buffers
    const numAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    for (let i = 0; i < numAttributes; i++) {
      gl.disableVertexAttribArray(i);
    }
        
    // Clear bound resources
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.useProgram(null);
        
    // Clear the context
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
    
  pauseAllContexts() {
    this.activeContexts.forEach((contextData, contextId) => {
      contextData.isPaused = true;
      // Could implement render loop pausing here
    });
  }
    
  resumeAllContexts() {
    this.activeContexts.forEach((contextData, contextId) => {
      contextData.isPaused = false;
      contextData.lastUsed = Date.now();
    });
  }
    
  cleanupAllContexts() {
    const contextIds = Array.from(this.activeContexts.keys());
    contextIds.forEach(contextId => {
      this.releaseContext(contextId);
    });
        
    this.contextPool = [];
  }
    
  estimateContextMemory(canvas) {
    // Rough estimation based on canvas size and features
    const pixelCount = canvas.width * canvas.height;
    const bytesPerPixel = 4; // RGBA
    const baseMemory = pixelCount * bytesPerPixel;
        
    // Add overhead for depth buffer, framebuffers, etc.
    return baseMemory * 2; // Rough 2x multiplier
  }
    
  isContextCompatible(options1, options2) {
    const importantOptions = ['alpha', 'antialias', 'depth', 'powerPreference'];
        
    return importantOptions.every(option => 
      options1[option] === options2[option]
    );
  }
    
  adaptContextToCanvas(gl, newCanvas) {
    // This is a simplified version - in practice, you might need
    // to recreate the context for the new canvas
    return gl;
  }
    
  getFallbackContext(canvas) {
    // Return a mock context or trigger fallback UI
    console.warn('Using fallback context for canvas:', canvas.id);
    return null;
  }
    
  handleContextLoss(canvas, event) {
    // Find and mark context as lost
    for (const [contextId, contextData] of this.activeContexts.entries()) {
      if (contextData.canvas === canvas) {
        contextData.isLost = true;
        break;
      }
    }
        
    // Trigger fallback UI
    if (window.VisualizationErrorBoundary) {
      const errorBoundary = new window.VisualizationErrorBoundary(canvas.parentElement);
      errorBoundary.showWebGLFallback();
    }
  }
    
  handleContextRestore(canvas, event) {
    // Attempt to restore context
    for (const [contextId, contextData] of this.activeContexts.entries()) {
      if (contextData.canvas === canvas) {
        contextData.isLost = false;
        // Could trigger resource recreation here
        break;
      }
    }
  }
    
  getStatistics() {
    const stats = {
      activeContexts: this.activeContexts.size,
      pooledContexts: this.contextPool.length,
      memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 'Unknown',
      memoryLimit: Math.round(this.memoryThreshold / 1024 / 1024),
      isLowMemoryDevice: this.isLowMemoryDevice,
      contexts: []
    };
        
    this.activeContexts.forEach((contextData, contextId) => {
      stats.contexts.push({
        id: contextId,
        age: Date.now() - contextData.created,
        lastUsed: Date.now() - contextData.lastUsed,
        memoryEstimate: Math.round(contextData.memoryUsage / 1024 / 1024),
        isPaused: contextData.isPaused,
        isLost: contextData.isLost || false
      });
    });
        
    return stats;
  }
}

// Performance Monitor Class
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      frameRate: 0,
      frameTime: 0,
      memoryUsage: 0,
      drawCalls: 0
    };
        
    this.startTime = performance.now();
    this.frameCount = 0;
    this.lastFrameTime = this.startTime;
        
    this.setupMonitoring();
  }
    
  setupMonitoring() {
    // Monitor frame rate
    this.monitorFrameRate();
        
    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
      }, 1000);
    }
  }
    
  monitorFrameRate() {
    const measure = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastFrameTime;
            
      this.frameCount++;
      this.metrics.frameTime = deltaTime;
            
      // Calculate FPS every second
      if (currentTime - this.startTime >= 1000) {
        this.metrics.frameRate = Math.round((this.frameCount * 1000) / (currentTime - this.startTime));
        this.frameCount = 0;
        this.startTime = currentTime;
      }
            
      this.lastFrameTime = currentTime;
      requestAnimationFrame(measure);
    };
        
    requestAnimationFrame(measure);
  }
    
  getMetrics() {
    return { ...this.metrics };
  }
    
  isPerformanceGood() {
    return this.metrics.frameRate >= 30 && this.metrics.frameTime < 33.33; // 30fps target
  }
}

// Smart Asset Loader Class
class SmartAssetLoader {
  constructor() {
    this.loadStrategy = this.determineStrategy();
    this.preloadQueue = new PriorityQueue();
    this.memoryBudget = this.calculateMemoryBudget();
    this.networkSpeed = this.estimateNetworkSpeed();
  }
    
  determineStrategy() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const deviceMemory = navigator.deviceMemory || 4;
        
    if (connection?.effectiveType === '4g' && deviceMemory >= 8) {
      return 'aggressive'; // Preload 3 chapters ahead
    } else if (connection?.effectiveType === '3g' || deviceMemory < 4) {
      return 'conservative'; // Load only current chapter
    }
    return 'balanced'; // Preload 1 chapter ahead
  }
    
  calculateMemoryBudget() {
    const deviceMemory = navigator.deviceMemory || 4;
    return Math.min(deviceMemory * 0.25 * 1024 * 1024 * 1024, 500 * 1024 * 1024); // 25% of device memory, max 500MB
  }
    
  estimateNetworkSpeed() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      return connection.downlink || 1; // Mbps
    }
    return 1; // Conservative estimate
  }
    
  shouldLoadVisualization() {
    const memoryUsage = performance.memory ? performance.memory.usedJSHeapSize : 0;
    return memoryUsage < this.memoryBudget && this.networkSpeed > 0.5;
  }
    
  async loadChapterAssets(chapterId) {
    if (!this.shouldLoadVisualization()) {
      console.warn('Skipping asset loading due to memory/network constraints');
      return;
    }
        
    // Implementation would go here
    console.log(`Loading assets for chapter ${chapterId} with strategy: ${this.loadStrategy}`);
  }
}

// Priority Queue for asset loading
class PriorityQueue {
  constructor() {
    this.items = [];
  }
    
  enqueue(item, priority) {
    const queueElement = { item, priority };
    let added = false;
        
    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority > this.items[i].priority) {
        this.items.splice(i, 0, queueElement);
        added = true;
        break;
      }
    }
        
    if (!added) {
      this.items.push(queueElement);
    }
  }
    
  dequeue() {
    return this.items.shift();
  }
    
  isEmpty() {
    return this.items.length === 0;
  }
}

// Global instance
window.webglContextManager = new WebGLContextManager();

// Helper function for backward compatibility
window.createOptimizedWebGLContext = function(canvas, options = {}) {
  return window.webglContextManager.acquireContext(canvas, options);
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WebGLContextManager, PerformanceMonitor, SmartAssetLoader };
}