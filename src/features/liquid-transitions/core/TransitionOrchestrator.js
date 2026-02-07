/**
 * TransitionOrchestrator.js
 * Coordinates complex multi-element transitions with precise timing
 * Implements transition queuing, grouping, and advanced sequencing
 */

export class TransitionOrchestrator {
  constructor(options = {}) {
    this.options = {
      defaultDuration: 600,
      defaultEasing: 'easeInOutCubic',
      stagger: 50,
      overlap: 0.8,
      ...options
    };
    
    // Transition management
    this.transitions = new Map();
    this.groups = new Map();
    this.queue = [];
    this.isPlaying = false;
    this.isInitialized = false;
    this.isPaused = false;
    this.rafId = null;
    
    // Timeline tracking
    this.timeline = [];
    this.currentTime = 0;
    
    // Performance
    this.frameTime = 16.67; // Target 60 FPS
    this.lastFrame = 0;
    
    // Callbacks
    this.onComplete = null;
    this.onProgress = null;

    this.init();
  }

  init() {
    this.isInitialized = true;
    this.isPaused = false;
  }

  pause() {
    if (!this.isPlaying) {
      return;
    }

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
    this.lastFrame = performance.now();
    this.animate();
  }
  
  /**
   * Register a transition
   * @param {string} id - Unique identifier
   * @param {Object} config - Transition configuration
   */
  register(id, config) {
    const transition = {
      id,
      element: config.element,
      type: config.type || 'opacity',
      from: config.from,
      to: config.to,
      duration: config.duration || this.options.defaultDuration,
      delay: config.delay || 0,
      easing: config.easing || this.options.defaultEasing,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      startTime: null,
      state: 'pending'
    };
    
    this.transitions.set(id, transition);
    return this;
  }
  
  /**
   * Create a transition group
   * @param {string} groupId - Group identifier
   * @param {Array} transitionIds - Transition IDs to group
   * @param {Object} options - Group options
   */
  group(groupId, transitionIds, options = {}) {
    const group = {
      id: groupId,
      transitions: transitionIds,
      stagger: options.stagger !== undefined ? options.stagger : this.options.stagger,
      overlap: options.overlap !== undefined ? options.overlap : this.options.overlap,
      sequence: options.sequence || 'parallel'
    };
    
    this.groups.set(groupId, group);
    return this;
  }
  
  /**
   * Add transitions to queue
   * @param {Array} items - Transition or group IDs
   */
  enqueue(...items) {
    this.queue.push(...items);
    return this;
  }
  
  /**
   * Play all queued transitions
   * @returns {Promise} Completion promise
   */
  play() {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        this.init();
      }

      if (this.isPlaying) {
        reject(new Error('Transitions already playing'));
        return;
      }
      
      this.isPlaying = true;
      this.onComplete = resolve;
      this.currentTime = 0;
      
      // Build timeline
      this.buildTimeline();
      
      // Start animation loop
      this.lastFrame = performance.now();
      this.animate();
    });
  }
  
  /**
   * Build execution timeline
   */
  buildTimeline() {
    this.timeline = [];
    let currentDelay = 0;
    
    this.queue.forEach(item => {
      if (this.groups.has(item)) {
        // Process group
        const group = this.groups.get(item);
        const groupTimeline = this.buildGroupTimeline(group, currentDelay);
        this.timeline.push(...groupTimeline);
        
        // Update delay for next item
        const maxEnd = Math.max(...groupTimeline.map(t => t.startTime + t.duration));
        currentDelay = maxEnd;
      } else if (this.transitions.has(item)) {
        // Process single transition
        const transition = this.transitions.get(item);
        this.timeline.push({
          ...transition,
          startTime: currentDelay + transition.delay
        });
        
        currentDelay += transition.duration + transition.delay;
      }
    });
  }
  
  /**
   * Build timeline for a group
   * @param {Object} group - Group configuration
   * @param {number} baseDelay - Base delay
   * @returns {Array} Group timeline
   */
  buildGroupTimeline(group, baseDelay) {
    const timeline = [];
    let delay = baseDelay;
    
    group.transitions.forEach((transitionId, index) => {
      const transition = this.transitions.get(transitionId);
      if (!transition) return;
      
      if (group.sequence === 'stagger') {
        delay = baseDelay + (index * group.stagger);
      } else if (group.sequence === 'sequence') {
        if (index > 0) {
          const prevTransition = this.transitions.get(group.transitions[index - 1]);
          delay += prevTransition.duration * group.overlap;
        }
      }
      
      timeline.push({
        ...transition,
        startTime: delay + transition.delay
      });
    });
    
    return timeline;
  }
  
  /**
   * Main animation loop
   */
  animate() {
    if (!this.isInitialized || this.isPaused) {
      return;
    }

    const now = performance.now();
    const deltaTime = now - this.lastFrame;
    this.lastFrame = now;
    
    // Update current time
    this.currentTime += deltaTime;
    
    // Process timeline
    let allComplete = true;
    
    this.timeline.forEach(transition => {
      const localTime = this.currentTime - transition.startTime;
      
      if (localTime < 0) {
        // Not started yet
        allComplete = false;
        return;
      }
      
      if (transition.state === 'pending') {
        // Start transition
        this.startTransition(transition);
      }
      
      if (transition.state === 'active') {
        // Update transition
        const progress = Math.min(localTime / transition.duration, 1);
        this.updateTransition(transition, progress);
        
        if (progress >= 1) {
          this.completeTransition(transition);
        } else {
          allComplete = false;
        }
      }
    });
    
    // Progress callback
    if (this.onProgress) {
      const totalDuration = Math.max(...this.timeline.map(t => t.startTime + t.duration));
      this.onProgress(this.currentTime / totalDuration);
    }
    
    // Continue or complete
    if (!allComplete) {
      this.rafId = requestAnimationFrame(() => this.animate());
    } else {
      this.complete();
    }
  }
  
  /**
   * Start a transition
   * @param {Object} transition - Transition object
   */
  startTransition(transition) {
    transition.state = 'active';
    
    // Apply initial state
    this.applyTransitionValue(transition, transition.from);
    
    // Enable GPU acceleration
    if (transition.element && transition.element.style) {
      transition.element.style.willChange = this.getWillChangeProperty(transition.type);
    }
    
    // Callback
    if (transition.onStart) {
      transition.onStart(transition);
    }
  }
  
  /**
   * Update transition progress
   * @param {Object} transition - Transition object
   * @param {number} progress - Progress (0-1)
   */
  updateTransition(transition, progress) {
    // Apply easing
    const easedProgress = this.applyEasing(progress, transition.easing);
    
    // Calculate value
    const value = this.interpolateValue(transition.from, transition.to, easedProgress);
    
    // Apply to element
    this.applyTransitionValue(transition, value);
    
    // Callback
    if (transition.onUpdate) {
      transition.onUpdate(transition, easedProgress);
    }
  }
  
  /**
   * Complete a transition
   * @param {Object} transition - Transition object
   */
  completeTransition(transition) {
    transition.state = 'complete';
    
    // Apply final state
    this.applyTransitionValue(transition, transition.to);
    
    // Clean up GPU acceleration
    if (transition.element && transition.element.style) {
      transition.element.style.willChange = '';
    }
    
    // Callback
    if (transition.onComplete) {
      transition.onComplete(transition);
    }
  }
  
  /**
   * Apply transition value to element
   * @param {Object} transition - Transition object
   * @param {*} value - Value to apply
   */
  applyTransitionValue(transition, value) {
    const { element, type } = transition;
    if (!element) return;
    
    switch (type) {
      case 'opacity':
        element.style.opacity = value;
        break;
        
      case 'transform':
        element.style.transform = value;
        break;
        
      case 'scale':
        element.style.transform = `scale(${value})`;
        break;
        
      case 'translateX':
        element.style.transform = `translateX(${value}px)`;
        break;
        
      case 'translateY':
        element.style.transform = `translateY(${value}px)`;
        break;
        
      case 'rotate':
        element.style.transform = `rotate(${value}deg)`;
        break;
        
      case 'blur':
        element.style.filter = `blur(${value}px)`;
        break;
        
      case 'custom':
        if (transition.applyValue) {
          transition.applyValue(element, value);
        }
        break;
        
      default:
        // Try to set as style property
        if (element.style[type] !== undefined) {
          element.style[type] = value;
        }
    }
  }
  
  /**
   * Get will-change property for transition type
   * @param {string} type - Transition type
   * @returns {string} Will-change value
   */
  getWillChangeProperty(type) {
    const willChangeMap = {
      opacity: 'opacity',
      transform: 'transform',
      scale: 'transform',
      translateX: 'transform',
      translateY: 'transform',
      rotate: 'transform',
      blur: 'filter'
    };
    
    return willChangeMap[type] || 'auto';
  }
  
  /**
   * Interpolate between two values
   * @param {*} from - Start value
   * @param {*} to - End value
   * @param {number} progress - Progress (0-1)
   * @returns {*} Interpolated value
   */
  interpolateValue(from, to, progress) {
    // Number interpolation
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * progress;
    }
    
    // String with numbers (e.g., "10px")
    if (typeof from === 'string' && typeof to === 'string') {
      const fromMatch = from.match(/^([\d.-]+)(.*)$/);
      const toMatch = to.match(/^([\d.-]+)(.*)$/);
      
      if (fromMatch && toMatch && fromMatch[2] === toMatch[2]) {
        const fromNum = parseFloat(fromMatch[1]);
        const toNum = parseFloat(toMatch[1]);
        const interpolated = fromNum + (toNum - fromNum) * progress;
        return interpolated + fromMatch[2];
      }
    }
    
    // Default to 'to' value at 50% progress
    return progress >= 0.5 ? to : from;
  }
  
  /**
   * Apply easing function
   * @param {number} t - Progress (0-1)
   * @param {string} easing - Easing function name
   * @returns {number} Eased progress
   */
  applyEasing(t, easing) {
    const easingFunctions = {
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
      spring: t => 1 - Math.cos(t * Math.PI * 0.5) * Math.exp(-t * 6),
      bounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
          return n1 * t * t;
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
      }
    };
    
    const easingFunction = easingFunctions[easing] || easingFunctions.linear;
    return easingFunction(t);
  }
  
  /**
   * Complete all transitions
   */
  complete() {
    this.isPlaying = false;
    this.isInitialized = false;
    this.isPaused = false;
    this.rafId = null;
    
    // Ensure all transitions are in final state
    this.timeline.forEach(transition => {
      if (transition.state !== 'complete') {
        this.completeTransition(transition);
      }
    });
    
    // Clear queue
    this.queue = [];
    this.timeline = [];
    
    // Callback
    if (this.onComplete) {
      this.onComplete();
    }
  }
  
  /**
   * Stop all transitions
   */
  stop() {
    this.isPlaying = false;
    this.isInitialized = false;
    this.isPaused = false;
    this.rafId = null;
    this.timeline.forEach(transition => {
      if (transition.state === 'active') {
        transition.state = 'stopped';
        if (transition.element && transition.element.style) {
          transition.element.style.willChange = '';
        }
      }
    });
  }
  
  /**
   * Reset orchestrator
   */
  reset() {
    this.stop();
    this.transitions.clear();
    this.groups.clear();
    this.queue = [];
    this.timeline = [];
    this.currentTime = 0;
  }

  dispose() {
    this.reset();
    this.isInitialized = false;
    this.isPaused = false;
  }
}
