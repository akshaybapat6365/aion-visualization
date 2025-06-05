/**
 * WebGL Error Handler - Phase 5 Error Handling
 * Comprehensive WebGL context management and error recovery
 */

class WebGLErrorHandler {
  constructor() {
    this.contextLostCount = 0;
    this.maxContextLossRecoveries = 3;
    this.isContextLost = false;
    this.canvas = null;
    this.renderer = null;
    this.onContextLost = null;
    this.onContextRestored = null;
  }
    
  // Initialize error handling for a canvas
  init(canvas, renderer) {
    this.canvas = canvas;
    this.renderer = renderer;
        
    // Add WebGL context event listeners
    canvas.addEventListener('webglcontextlost', this.handleContextLost.bind(this), false);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored.bind(this), false);
        
    // Monitor WebGL errors
    this.startErrorMonitoring();
        
    console.log('WebGL error handling initialized');
  }
    
  // Handle WebGL context lost
  handleContextLost(event) {
    console.warn('WebGL context lost');
    event.preventDefault(); // Prevent default handling
        
    this.isContextLost = true;
    this.contextLostCount++;
        
    // Show user notification
    AionUtils.errors.show('Graphics context lost. Attempting to recover...', 'warning');
        
    // Stop rendering
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
    }
        
    // Callback for application
    if (this.onContextLost) {
      this.onContextLost();
    }
        
    // Attempt recovery if under limit
    if (this.contextLostCount <= this.maxContextLossRecoveries) {
      setTimeout(() => {
        this.attemptRecovery();
      }, 1000);
    } else {
      this.showFinalError();
    }
  }
    
  // Handle WebGL context restored
  handleContextRestored(event) {
    console.log('WebGL context restored');
        
    this.isContextLost = false;
        
    // Show success message
    AionUtils.errors.show('Graphics context recovered successfully!', 'success');
        
    // Reinitialize renderer
    try {
      this.reinitializeRenderer();
            
      // Callback for application
      if (this.onContextRestored) {
        this.onContextRestored();
      }
            
    } catch (error) {
      console.error('Failed to reinitialize after context restore:', error);
      this.showRecoveryError();
    }
  }
    
  // Attempt to recover from context loss
  attemptRecovery() {
    try {
      // Try to force context restore
      const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            
      if (!gl) {
        throw new Error('Could not get WebGL context');
      }
            
      // Check if context is restored
      if (!gl.isContextLost()) {
        this.handleContextRestored();
      }
            
    } catch (error) {
      console.error('Recovery attempt failed:', error);
            
      if (this.contextLostCount <= this.maxContextLossRecoveries) {
        setTimeout(() => this.attemptRecovery(), 2000);
      } else {
        this.showFinalError();
      }
    }
  }
    
  // Reinitialize renderer after context restore
  reinitializeRenderer() {
    if (!this.renderer) return;
        
    // Dispose old renderer
    this.renderer.dispose();
        
    // Create new renderer
    const THREE = window.THREE;
    if (!THREE) {
      throw new Error('Three.js not available');
    }
        
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'default'
    });
        
    console.log('WebGL renderer reinitialized');
  }
    
  // Start monitoring for WebGL errors
  startErrorMonitoring() {
    if (!this.canvas) return;
        
    const checkForErrors = () => {
      const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
            
      if (gl && !this.isContextLost) {
        const error = gl.getError();
                
        if (error !== gl.NO_ERROR) {
          this.handleWebGLError(error, gl);
        }
      }
            
      // Continue monitoring
      if (!this.isContextLost) {
        requestAnimationFrame(checkForErrors);
      }
    };
        
    checkForErrors();
  }
    
  // Handle specific WebGL errors
  handleWebGLError(error, gl) {
    let errorMessage = 'Unknown WebGL error';
    let canRecover = true;
        
    switch (error) {
    case gl.INVALID_ENUM:
      errorMessage = 'Invalid enumeration parameter';
      break;
    case gl.INVALID_VALUE:
      errorMessage = 'Invalid value parameter';
      break;
    case gl.INVALID_OPERATION:
      errorMessage = 'Invalid operation';
      break;
    case gl.OUT_OF_MEMORY:
      errorMessage = 'Out of memory';
      canRecover = false;
      break;
    case gl.CONTEXT_LOST_WEBGL:
      errorMessage = 'WebGL context lost';
      return; // Handled by context lost event
    }
        
    console.error('WebGL Error:', errorMessage, error);
        
    if (!canRecover) {
      this.showFatalError(errorMessage);
    } else {
      AionUtils.errors.show(`Graphics error: ${errorMessage}`, 'warning');
    }
  }
    
  // Show final error when recovery fails
  showFinalError() {
    const message = `
            <div class="webgl-final-error">
                <h3>Graphics Unavailable</h3>
                <p>Your graphics system encountered multiple errors and cannot recover.</p>
                <p>Please try:</p>
                <ul>
                    <li>Refreshing the page</li>
                    <li>Updating your browser</li>
                    <li>Checking for graphics driver updates</li>
                </ul>
                <button onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
        
    AionUtils.errors.show(message, 'fatal');
  }
    
  // Show recovery error
  showRecoveryError() {
    const message = `
            <div class="webgl-recovery-error">
                <p>Graphics context recovered but reinitialization failed.</p>
                <button onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
        
    AionUtils.errors.show(message, 'error');
  }
    
  // Show fatal error
  showFatalError(details) {
    const message = `
            <div class="webgl-fatal-error">
                <h3>Graphics System Error</h3>
                <p>A fatal graphics error occurred: ${details}</p>
                <p>The visualization cannot continue.</p>
                <button onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
        
    AionUtils.errors.show(message, 'fatal');
  }
    
  // Check WebGL support
  static checkSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (error) {
      return false;
    }
  }
    
  // Get WebGL capabilities
  static getCapabilities() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
    if (!gl) return null;
        
    return {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)
    };
  }
}

// Make available globally
window.WebGLErrorHandler = WebGLErrorHandler;
