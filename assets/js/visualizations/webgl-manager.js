// WebGL Context Manager and Utilities
// Advanced memory management and performance optimization for WebGL contexts

class WebGLManager {
  constructor() {
    this.activeContexts = new Map();
    this.contextPool = [];
    this.maxContexts = this.calculateMaxContexts();
    this.memoryThreshold = this.calculateMemoryThreshold();
    this.isLowMemoryDevice = aionUtils.isLowMemoryDevice;
    this.performanceMode = aionUtils.performanceMode;
        
    this.setupMemoryMonitoring();
    this.setupContextLostHandling();
  }

  calculateMaxContexts() {
    if (this.isLowMemoryDevice) return 3;
    if (this.performanceMode === 'high') return 8;
    if (this.performanceMode === 'medium') return 6;
    return 4;
  }

  calculateMemoryThreshold() {
    if (this.isLowMemoryDevice) return 75 * 1024 * 1024; // 75MB
    if (this.performanceMode === 'high') return 200 * 1024 * 1024; // 200MB
    return 150 * 1024 * 1024; // 150MB
  }

  // Check WebGL support
  static isWebGLSupported() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  static isWebGL2Supported() {
    try {
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      return !!gl2;
    } catch (e) {
      return false;
    }
  }

  // Create optimized WebGL context
  createContext(canvas, options = {}) {
    if (this.activeContexts.size >= this.maxContexts) {
      this.cleanupOldestContext();
    }

    const contextAttributes = {
      alpha: options.alpha !== false,
      antialias: this.performanceMode !== 'low' && options.antialias !== false,
      depth: options.depth !== false,
      preserveDrawingBuffer: options.preserveDrawingBuffer || false,
      powerPreference: this.isLowMemoryDevice ? 'default' : 'high-performance',
      failIfMajorPerformanceCaveat: false,
      desynchronized: this.performanceMode === 'high'
    };

    let gl = null;
        
    try {
      // Try WebGL2 first if not explicitly disabled
      if (options.preferWebGL2 !== false && WebGLManager.isWebGL2Supported()) {
        gl = canvas.getContext('webgl2', contextAttributes);
      }
            
      // Fallback to WebGL1
      if (!gl) {
        gl = canvas.getContext('webgl', contextAttributes) || 
                     canvas.getContext('experimental-webgl', contextAttributes);
      }
            
      if (gl) {
        this.configureContext(gl, options);
        this.registerContext(canvas, gl);
      }
            
    } catch (error) {
      console.error('Failed to create WebGL context:', error);
      this.showWebGLError(canvas);
    }

    return gl;
  }

  configureContext(gl, options) {
    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
        
    // Enable depth testing if requested
    if (options.depth !== false) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
    }
        
    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
    // Set viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
    // Configure extensions based on performance mode
    this.setupExtensions(gl);
  }

  setupExtensions(gl) {
    const extensions = {
      anisotropic: gl.getExtension('EXT_texture_filter_anisotropic'),
      floatTextures: gl.getExtension('OES_texture_float'),
      halfFloatTextures: gl.getExtension('OES_texture_half_float'),
      vertexArrays: gl.getExtension('OES_vertex_array_object'),
      drawBuffers: gl.getExtension('WEBGL_draw_buffers'),
      depthTexture: gl.getExtension('WEBGL_depth_texture')
    };

    // Store extensions on context for later use
    gl.extensions = extensions;
        
    return extensions;
  }

  registerContext(canvas, gl) {
    const contextInfo = {
      gl,
      canvas,
      created: Date.now(),
      lastUsed: Date.now(),
      memoryUsage: this.estimateContextMemory(gl)
    };
        
    this.activeContexts.set(canvas, contextInfo);
        
    // Setup automatic cleanup on canvas removal
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === canvas || node.contains?.(canvas)) {
            this.releaseContext(canvas);
            observer.disconnect();
          }
        });
      });
    });
        
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  releaseContext(canvas) {
    const contextInfo = this.activeContexts.get(canvas);
    if (contextInfo) {
      const { gl } = contextInfo;
            
      // Clean up WebGL resources
      this.cleanupGLResources(gl);
            
      // Release context
      if (gl.getExtension('WEBGL_lose_context')) {
        gl.getExtension('WEBGL_lose_context').loseContext();
      }
            
      this.activeContexts.delete(canvas);
    }
  }

  cleanupGLResources(gl) {
    // Delete textures
    const textureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    for (let i = 0; i < textureUnits; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
        
    // Clear buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        
    // Clear framebuffers
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        
    // Clear program
    gl.useProgram(null);
  }

  cleanupOldestContext() {
    let oldest = null;
    let oldestTime = Date.now();
        
    for (const [canvas, info] of this.activeContexts) {
      if (info.lastUsed < oldestTime) {
        oldest = canvas;
        oldestTime = info.lastUsed;
      }
    }
        
    if (oldest) {
      console.warn('Cleaning up oldest WebGL context due to limit');
      this.releaseContext(oldest);
    }
  }

  updateContextUsage(canvas) {
    const contextInfo = this.activeContexts.get(canvas);
    if (contextInfo) {
      contextInfo.lastUsed = Date.now();
    }
  }

  estimateContextMemory(gl) {
    // Rough estimation based on canvas size and common resources
    const canvas = gl.canvas;
    const pixels = canvas.width * canvas.height;
    const bytesPerPixel = 4; // RGBA
    return pixels * bytesPerPixel + (1024 * 1024); // Base overhead
  }

  setupMemoryMonitoring() {
    if (!performance.memory) return;
        
    setInterval(() => {
      const memoryInfo = performance.memory;
      const usedMemory = memoryInfo.usedJSHeapSize;
            
      if (usedMemory > this.memoryThreshold) {
        this.performMemoryCleanup();
      }
    }, 30000); // Check every 30 seconds
  }

  performMemoryCleanup() {
    console.warn('Performing WebGL memory cleanup');
        
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
        
    // Clean up unused contexts
    const now = Date.now();
    const maxIdleTime = 300000; // 5 minutes
        
    for (const [canvas, info] of this.activeContexts) {
      if (now - info.lastUsed > maxIdleTime) {
        this.releaseContext(canvas);
      }
    }
  }

  setupContextLostHandling() {
    document.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      console.warn('WebGL context lost:', event.target);
            
      // Find and remove from active contexts
      for (const [canvas, info] of this.activeContexts) {
        if (info.canvas === event.target) {
          this.activeContexts.delete(canvas);
          break;
        }
      }
    });
        
    document.addEventListener('webglcontextrestored', (event) => {
      console.log('WebGL context restored:', event.target);
      // Context will be recreated on next use
    });
  }

  showWebGLError(canvas) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'webgl-error glass-card';
    errorDiv.innerHTML = `
            <div class="error-icon">⚠️</div>
            <h3>WebGL Not Available</h3>
            <p>Your browser doesn't support WebGL or it's disabled. This visualization requires WebGL to function.</p>
            <div class="error-actions">
                <a href="https://get.webgl.org/" target="_blank" class="glass-button">Check WebGL Support</a>
                <button class="glass-button" onclick="location.reload()">Retry</button>
            </div>
        `;
        
    // Replace canvas with error message
    canvas.parentNode.replaceChild(errorDiv, canvas);
  }

  // Utility methods for Three.js integration
  createThreeRenderer(canvas, options = {}) {
    if (!window.THREE) {
      console.error('Three.js not loaded');
      return null;
    }

    const gl = this.createContext(canvas, options);
    if (!gl) return null;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      context: gl,
      antialias: this.performanceMode !== 'low',
      alpha: options.alpha !== false,
      preserveDrawingBuffer: options.preserveDrawingBuffer || false
    });

    // Configure based on performance mode
    if (this.performanceMode === 'low') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = false;
    } else {
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    return renderer;
  }

  // Get context info for debugging
  getContextInfo() {
    return {
      activeContexts: this.activeContexts.size,
      maxContexts: this.maxContexts,
      memoryThreshold: this.memoryThreshold,
      performanceMode: this.performanceMode,
      webglSupported: WebGLManager.isWebGLSupported(),
      webgl2Supported: WebGLManager.isWebGL2Supported()
    };
  }
}

let webglManagerInstance = null;

function getWebGLManager() {
  if (!webglManagerInstance) {
    webglManagerInstance = new WebGLManager();
  }

  return webglManagerInstance;
}

const webglManager = {
  get instance() {
    return getWebGLManager();
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WebGLManager, getWebGLManager, webglManager };
}

// Add to global scope
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'webglManager', {
    configurable: true,
    get() {
      return getWebGLManager();
    }
  });

  window.getWebGLManager = getWebGLManager;
}
