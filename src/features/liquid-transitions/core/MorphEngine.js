/**
 * MorphEngine.js
 * High-performance SVG path morphing engine for liquid transitions
 * Implements advanced path interpolation with custom easing
 */

export class MorphEngine {
  constructor(options = {}) {
    this.options = {
      duration: 800,
      easing: 'easeInOutCubic',
      precision: 4,
      morphPrecision: 100,
      enableGPU: true,
      ...options
    };
    
    // Animation state
    this.animations = new Map();
    this.animationId = 0;
    this.isInitialized = false;
    this.isPaused = false;
    this.rafId = null;
    
    // Easing functions
    this.easingFunctions = {
      linear: t => t,
      easeInQuad: t => t * t,
      easeOutQuad: t => t * (2 - t),
      easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      easeInCubic: t => t * t * t,
      easeOutCubic: t => (--t) * t * t + 1,
      easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
      easeInQuart: t => t * t * t * t,
      easeOutQuart: t => 1 - (--t) * t * t * t,
      easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
      easeInElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
      },
      easeOutElastic: t => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      },
      easeInOutElastic: t => {
        const c5 = (2 * Math.PI) / 4.5;
        return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
          ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
          : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
      },
      spring: t => {
        const a = 0.5;
        const p = 0.4;
        return 1 - Math.pow(Math.cos(t * Math.PI * 0.5), 3) * Math.cos(t * Math.PI * 5.5 * a) * Math.pow(1 - t, p);
      }
    };
    
    // Path parsing regex patterns
    this.pathCommands = /[MmLlHhVvCcSsQqTtAaZz]/g;
    this.pathValues = /[+-]?(?:\d*\.\d+|\d+)(?:[eE][+-]?\d+)?/g;
    
    // Performance monitoring
    this.stats = {
      activeAnimations: 0,
      totalAnimations: 0,
      averageFrameTime: 0
    };

    this.init();
  }

  init() {
    this.isInitialized = true;
    this.isPaused = false;
  }

  pause() {
    this.isPaused = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  resume() {
    if (!this.isInitialized || !this.isPaused) {
      return;
    }

    this.isPaused = false;
    if (this.animations.size > 0) {
      this.animate();
    }
  }

  dispose() {
    this.pause();
    this.stopAll();
    this.isInitialized = false;
  }
  
  /**
   * Parse SVG path string into commands and coordinates
   * @param {string} pathString - SVG path d attribute
   * @returns {Array} Parsed path data
   */
  parsePath(pathString) {
    const commands = pathString.match(this.pathCommands) || [];
    const values = pathString.match(this.pathValues) || [];
    
    const parsed = [];
    let valueIndex = 0;
    
    commands.forEach(command => {
      const entry = { command, values: [] };
      
      // Determine number of values for each command
      const valueCount = this.getCommandValueCount(command);
      
      for (let i = 0; i < valueCount; i++) {
        if (valueIndex < values.length) {
          entry.values.push(parseFloat(values[valueIndex++]));
        }
      }
      
      parsed.push(entry);
    });
    
    return parsed;
  }
  
  /**
   * Get number of values expected for a path command
   * @param {string} command - SVG path command
   * @returns {number} Number of values
   */
  getCommandValueCount(command) {
    const counts = {
      M: 2, m: 2,  // moveto
      L: 2, l: 2,  // lineto
      H: 1, h: 1,  // horizontal lineto
      V: 1, v: 1,  // vertical lineto
      C: 6, c: 6,  // curveto
      S: 4, s: 4,  // smooth curveto
      Q: 4, q: 4,  // quadratic Bezier
      T: 2, t: 2,  // smooth quadratic Bezier
      A: 7, a: 7,  // arc
      Z: 0, z: 0   // closepath
    };
    
    return counts[command] || 0;
  }
  
  /**
   * Convert parsed path to absolute coordinates
   * @param {Array} parsedPath - Parsed path data
   * @returns {Array} Path with absolute coordinates
   */
  toAbsolute(parsedPath) {
    let x = 0, y = 0;
    let mx = 0, my = 0; // Last moveto position
    
    return parsedPath.map(segment => {
      const { command, values } = segment;
      const absolute = { command: command.toUpperCase(), values: [...values] };
      
      switch (command) {
        case 'm':
          absolute.values[0] += x;
          absolute.values[1] += y;
          mx = x = absolute.values[0];
          my = y = absolute.values[1];
          break;
        case 'M':
          mx = x = values[0];
          my = y = values[1];
          break;
        case 'l':
          absolute.values[0] += x;
          absolute.values[1] += y;
          x = absolute.values[0];
          y = absolute.values[1];
          break;
        case 'L':
          x = values[0];
          y = values[1];
          break;
        case 'h':
          absolute.command = 'L';
          absolute.values = [x + values[0], y];
          x += values[0];
          break;
        case 'H':
          absolute.command = 'L';
          absolute.values = [values[0], y];
          x = values[0];
          break;
        case 'v':
          absolute.command = 'L';
          absolute.values = [x, y + values[0]];
          y += values[0];
          break;
        case 'V':
          absolute.command = 'L';
          absolute.values = [x, values[0]];
          y = values[0];
          break;
        case 'c':
          for (let i = 0; i < 6; i += 2) {
            absolute.values[i] += x;
            absolute.values[i + 1] += y;
          }
          x = absolute.values[4];
          y = absolute.values[5];
          break;
        case 'C':
          x = values[4];
          y = values[5];
          break;
        case 'z':
        case 'Z':
          x = mx;
          y = my;
          break;
      }
      
      return absolute;
    });
  }
  
  /**
   * Normalize two paths to have the same number of segments
   * @param {Array} path1 - First path
   * @param {Array} path2 - Second path
   * @returns {Object} Normalized paths
   */
  normalizePaths(path1, path2) {
    const abs1 = this.toAbsolute(path1);
    const abs2 = this.toAbsolute(path2);
    
    // Ensure same number of segments
    while (abs1.length < abs2.length) {
      const lastSegment = abs1[abs1.length - 1];
      abs1.push({ ...lastSegment });
    }
    
    while (abs2.length < abs1.length) {
      const lastSegment = abs2[abs2.length - 1];
      abs2.push({ ...lastSegment });
    }
    
    // Convert all segments to same type (prefer curves)
    for (let i = 0; i < abs1.length; i++) {
      if (abs1[i].command !== abs2[i].command) {
        // Convert both to cubic bezier for smooth morphing
        abs1[i] = this.toCubicBezier(abs1[i], i > 0 ? abs1[i-1] : null);
        abs2[i] = this.toCubicBezier(abs2[i], i > 0 ? abs2[i-1] : null);
      }
    }
    
    return { path1: abs1, path2: abs2 };
  }
  
  /**
   * Convert any segment to cubic bezier
   * @param {Object} segment - Path segment
   * @param {Object} prevSegment - Previous segment
   * @returns {Object} Cubic bezier segment
   */
  toCubicBezier(segment, prevSegment) {
    const { command, values } = segment;
    
    if (command === 'C') return segment;
    
    let x0 = 0, y0 = 0;
    if (prevSegment) {
      const prevValues = prevSegment.values;
      x0 = prevValues[prevValues.length - 2];
      y0 = prevValues[prevValues.length - 1];
    }
    
    switch (command) {
      case 'L':
        // Line to cubic bezier
        const [x1, y1] = values;
        return {
          command: 'C',
          values: [
            x0 + (x1 - x0) / 3,
            y0 + (y1 - y0) / 3,
            x0 + 2 * (x1 - x0) / 3,
            y0 + 2 * (y1 - y0) / 3,
            x1,
            y1
          ]
        };
      default:
        return segment;
    }
  }
  
  /**
   * Interpolate between two path segments
   * @param {Object} from - Start segment
   * @param {Object} to - End segment
   * @param {number} progress - Progress (0-1)
   * @returns {Object} Interpolated segment
   */
  interpolateSegment(from, to, progress) {
    const interpolated = {
      command: from.command,
      values: []
    };
    
    for (let i = 0; i < from.values.length; i++) {
      interpolated.values[i] = from.values[i] + (to.values[i] - from.values[i]) * progress;
    }
    
    return interpolated;
  }
  
  /**
   * Build SVG path string from segments
   * @param {Array} segments - Path segments
   * @returns {string} SVG path string
   */
  buildPath(segments) {
    return segments.map(segment => {
      const values = segment.values.map(v => v.toFixed(this.options.precision)).join(' ');
      return `${segment.command} ${values}`;
    }).join(' ');
  }
  
  /**
   * Morph between two SVG paths
   * @param {Element} element - SVG element
   * @param {string} fromPath - Start path
   * @param {string} toPath - End path
   * @param {Object} options - Animation options
   * @returns {Promise} Animation promise
   */
  morph(element, fromPath, toPath, options = {}) {
    return new Promise((resolve, reject) => {
      const animOptions = { ...this.options, ...options };
      const animationId = this.animationId++;
      
      // Parse and normalize paths
      const parsed1 = this.parsePath(fromPath);
      const parsed2 = this.parsePath(toPath);
      const { path1, path2 } = this.normalizePaths(parsed1, parsed2);
      
      // Create animation object
      const animation = {
        id: animationId,
        element,
        fromPath: path1,
        toPath: path2,
        startTime: null,
        duration: animOptions.duration,
        easing: this.easingFunctions[animOptions.easing] || this.easingFunctions.easeInOutCubic,
        onComplete: resolve,
        onError: reject
      };
      
      // GPU acceleration hint
      if (animOptions.enableGPU && element.style) {
        element.style.willChange = 'd';
      }
      
      this.animations.set(animationId, animation);
      this.stats.activeAnimations++;
      this.stats.totalAnimations++;
      
      // Start animation loop if not running
      if (this.animations.size === 1) {
        this.animate();
      }
    });
  }
  
  /**
   * Main animation loop
   */
  animate() {
    if (!this.isInitialized || this.isPaused) {
      return;
    }

    const now = performance.now();
    
    this.animations.forEach((animation, id) => {
      if (!animation.startTime) {
        animation.startTime = now;
      }
      
      const elapsed = now - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);
      const easedProgress = animation.easing(progress);
      
      // Interpolate path
      const interpolatedPath = animation.fromPath.map((segment, i) => 
        this.interpolateSegment(segment, animation.toPath[i], easedProgress)
      );
      
      // Update element
      const pathString = this.buildPath(interpolatedPath);
      animation.element.setAttribute('d', pathString);
      
      // Complete or continue
      if (progress >= 1) {
        this.completeAnimation(id);
      }
    });
    
    // Continue loop if animations remain
    if (this.animations.size > 0) {
      this.rafId = requestAnimationFrame(() => this.animate());
    }
  }
  
  /**
   * Complete an animation
   * @param {number} id - Animation ID
   */
  completeAnimation(id) {
    const animation = this.animations.get(id);
    if (!animation) return;
    
    // Clean up
    if (animation.element.style) {
      animation.element.style.willChange = '';
    }
    
    this.animations.delete(id);
    this.stats.activeAnimations--;
    
    // Callback
    if (animation.onComplete) {
      animation.onComplete();
    }
  }
  
  /**
   * Stop all animations
   */
  stopAll() {
    this.animations.forEach((animation, id) => {
      this.completeAnimation(id);
    });
  }
  
  /**
   * Get current stats
   * @returns {Object} Performance statistics
   */
  getStats() {
    return { ...this.stats };
  }
}