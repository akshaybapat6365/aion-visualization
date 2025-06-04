// WebGL Utilities and Error Handling for Aion Visualization
// Provides fallbacks and graceful degradation for WebGL failures

class WebGLUtils {
  constructor() {
    this.contexts = new Map();
    // Lower the default context limit to minimize memory usage
    this.maxContexts = 4;
    this.fallbackMode = false;
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

  // Check WebGL2 support
  static isWebGL2Supported() {
    try {
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      return !!gl2;
    } catch (e) {
      return false;
    }
  }

  // Create WebGL context with error handling
  createContext(canvas, options = {}) {
    const contextAttributes = {
      alpha: options.alpha !== false,
      antialias: options.antialias !== false,
      depth: options.depth !== false,
      preserveDrawingBuffer: options.preserveDrawingBuffer || false,
      powerPreference: options.powerPreference || 'high-performance',
      failIfMajorPerformanceCaveat: false
    };

    let gl = null;
        
    try {
      // Try WebGL2 first
      if (options.preferWebGL2 !== false) {
        gl = canvas.getContext('webgl2', contextAttributes);
      }
            
      // Fall back to WebGL1
      if (!gl) {
        gl = canvas.getContext('webgl', contextAttributes) ||
                     canvas.getContext('experimental-webgl', contextAttributes);
      }

      if (!gl) {
        throw new Error('WebGL not supported');
      }

      // Check for context loss
      canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        this.handleContextLoss(canvas, event);
      });

      canvas.addEventListener('webglcontextrestored', (event) => {
        this.handleContextRestore(canvas, event);
      });

      // Manage context count
      this.manageContextCount(canvas, gl);

      return gl;

    } catch (error) {
      console.error('WebGL context creation failed:', error);
      this.showFallback(canvas, error);
      return null;
    }
  }

  // Manage WebGL context count to prevent too many contexts
  manageContextCount(canvas, gl) {
    const canvasId = canvas.id || `canvas-${Date.now()}`;
        
    if (this.contexts.size >= this.maxContexts) {
      // Remove oldest context
      const oldestKey = this.contexts.keys().next().value;
      const oldestData = this.contexts.get(oldestKey);
            
      if (oldestData && oldestData.canvas) {
        // Clear the old canvas
        oldestData.canvas.width = 1;
        oldestData.canvas.height = 1;
        const parent = oldestData.canvas.parentNode;
        if (parent) {
          const placeholder = this.createStaticFallback(oldestData.canvas);
          parent.replaceChild(placeholder, oldestData.canvas);
        }
      }
            
      this.contexts.delete(oldestKey);
    }

    this.contexts.set(canvasId, { canvas, gl, timestamp: Date.now() });
  }

  // Handle WebGL context loss
  handleContextLoss(canvas, event) {
    console.warn('WebGL context lost:', canvas.id);
        
    const container = canvas.parentElement;
    if (container) {
      const lossMessage = document.createElement('div');
      lossMessage.className = 'webgl-context-lost';
      lossMessage.innerHTML = `
                <div class="context-lost-message">
                    <svg width="50" height="50" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="20" fill="none" stroke="#FFA500" stroke-width="2"/>
                        <path d="M25 15 L25 30 M25 35 L25 35" stroke="#FFA500" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                    <p>Visualization temporarily unavailable</p>
                    <button onclick="location.reload()" class="reload-button">Reload Page</button>
                </div>
            `;
      container.appendChild(lossMessage);
    }
  }

  // Handle WebGL context restore
  handleContextRestore(canvas, event) {
    console.log('WebGL context restored:', canvas.id);
        
    // Remove context lost message
    const container = canvas.parentElement;
    const lossMessage = container.querySelector('.webgl-context-lost');
    if (lossMessage) {
      lossMessage.remove();
    }

    // Trigger re-initialization if callback provided
    if (canvas.restoreCallback) {
      canvas.restoreCallback();
    }
  }

  // Show fallback for WebGL failure
  showFallback(canvas, error) {
    const container = canvas.parentElement;
    if (!container) return;

    const fallback = this.createInteractiveFallback(canvas);
    container.replaceChild(fallback, canvas);
  }

  // Create static fallback image
  createStaticFallback(canvas) {
    const fallback = document.createElement('div');
    fallback.className = 'webgl-fallback-static';
    fallback.innerHTML = `
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23000' width='400' height='300'/%3E%3Ccircle cx='200' cy='150' r='50' fill='none' stroke='%236B46C1' stroke-width='2' opacity='0.5'/%3E%3Ccircle cx='200' cy='150' r='30' fill='none' stroke='%236B46C1' stroke-width='2' opacity='0.7'/%3E%3Ccircle cx='200' cy='150' r='10' fill='%236B46C1'/%3E%3C/svg%3E" 
                 alt="Visualization placeholder" 
                 style="width: 100%; height: 100%; object-fit: contain;">
            <p class="fallback-caption">Interactive visualization requires WebGL</p>
        `;
    return fallback;
  }

  // Create interactive CSS fallback
  createInteractiveFallback(canvas) {
    const fallback = document.createElement('div');
    fallback.className = 'webgl-fallback-interactive';
    fallback.innerHTML = `
            <div class="fallback-visualization">
                <div class="fallback-mandala">
                    <div class="mandala-ring ring-1"></div>
                    <div class="mandala-ring ring-2"></div>
                    <div class="mandala-ring ring-3"></div>
                    <div class="mandala-center"></div>
                </div>
                <p class="fallback-message">
                    This visualization requires WebGL support.
                    <br>
                    <small>Try updating your browser or enabling hardware acceleration.</small>
                </p>
                <div class="fallback-controls">
                    <button onclick="window.open('https://get.webgl.org/', '_blank')" class="help-button">
                        Learn More
                    </button>
                </div>
            </div>
        `;
    return fallback;
  }

  // Create shader with error handling
  createShader(gl, type, source) {
    try {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        console.error('Shader compilation error:', info);
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    } catch (error) {
      console.error('Shader creation failed:', error);
      return null;
    }
  }

  // Create program with error handling
  createProgram(gl, vertexShader, fragmentShader) {
    try {
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        console.error('Program linking error:', info);
        gl.deleteProgram(program);
        return null;
      }

      return program;
    } catch (error) {
      console.error('Program creation failed:', error);
      return null;
    }
  }

  // Check for required extensions
  checkExtensions(gl, required = []) {
    const missing = [];
        
    for (const ext of required) {
      if (!gl.getExtension(ext)) {
        missing.push(ext);
      }
    }

    if (missing.length > 0) {
      console.warn('Missing WebGL extensions:', missing);
    }

    return missing.length === 0;
  }

  // Get WebGL capabilities
  getCapabilities(gl) {
    return {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      extensions: gl.getSupportedExtensions()
    };
  }

  // Performance monitoring
  createPerformanceMonitor(gl) {
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') ||
                   gl.getExtension('EXT_disjoint_timer_query');
        
    if (!ext) {
      return null;
    }

    return {
      startQuery: () => {
        const query = gl.createQuery();
        gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
        return query;
      },
      endQuery: (query) => {
        gl.endQuery(ext.TIME_ELAPSED_EXT);
        return query;
      },
      getQueryResult: (query) => {
        const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
        if (available) {
          const timeElapsed = gl.getQueryParameter(query, gl.QUERY_RESULT);
          gl.deleteQuery(query);
          return timeElapsed / 1000000; // Convert to milliseconds
        }
        return null;
      }
    };
  }
}

// CSS for fallbacks
const fallbackStyles = `
<style>
.webgl-fallback-static,
.webgl-fallback-interactive {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--surface-glass);
    border-radius: 0.5rem;
    position: relative;
}

.fallback-caption,
.fallback-message {
    color: var(--text-secondary);
    text-align: center;
    margin-top: 1rem;
    font-size: 0.875rem;
}

.fallback-visualization {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.fallback-mandala {
    position: relative;
    width: 200px;
    height: 200px;
    margin-bottom: 2rem;
}

.mandala-ring {
    position: absolute;
    border: 2px solid var(--accent);
    border-radius: 50%;
    animation: rotate 20s linear infinite;
}

.ring-1 {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    opacity: 0.3;
}

.ring-2 {
    width: 70%;
    height: 70%;
    top: 15%;
    left: 15%;
    opacity: 0.5;
    animation-direction: reverse;
    animation-duration: 15s;
}

.ring-3 {
    width: 40%;
    height: 40%;
    top: 30%;
    left: 30%;
    opacity: 0.7;
    animation-duration: 10s;
}

.mandala-center {
    position: absolute;
    width: 20px;
    height: 20px;
    background: var(--accent);
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 20px var(--accent);
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.webgl-context-lost {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
}

.context-lost-message {
    text-align: center;
    color: white;
    padding: 2rem;
}

.reload-button,
.help-button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.reload-button:hover,
.help-button:hover {
    background: var(--accent-dark);
    transform: translateY(-1px);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .mandala-ring {
        animation: none;
    }
}
</style>
`;

// Inject styles
if (!document.getElementById('webgl-utils-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'webgl-utils-styles';
  styleElement.innerHTML = fallbackStyles;
  document.head.appendChild(styleElement.firstElementChild);
}

// Export as global
window.WebGLUtils = WebGLUtils;