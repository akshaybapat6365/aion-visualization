// Advanced Animation System for Museum-Quality Experience
// Provides sophisticated animations, transitions, and scroll effects

class AdvancedAnimations {
  constructor() {
    this.observers = new Map();
    this.animations = new Map();
    this.scrollPosition = 0;
    this.rafId = null;
    this.performanceMode = this.detectPerformanceMode();
        
    this.init();
  }
    
  init() {
    // Setup scroll tracking
    this.setupScrollTracking();
        
    // Setup intersection observers
    this.setupIntersectionObservers();
        
    // Initialize reveal animations
    this.initRevealAnimations();
        
    // Setup parallax effects
    this.initParallax();
        
    // Monitor performance
    this.monitorPerformance();
  }
    
  detectPerformanceMode() {
    // Check device capabilities
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
        
    if (memory >= 8 && cores >= 4) return 'high';
    if (memory >= 4 && cores >= 2) return 'medium';
    return 'low';
  }
    
  // Sophisticated page transitions
  async pageTransition(fromPage, toPage, options = {}) {
    const {
      duration = 600,
      easing = 'cubic-bezier(0.87, 0, 0.13, 1)',
      overlap = 100
    } = options;
        
    // Prepare new page
    toPage.style.opacity = '0';
    toPage.style.transform = 'translateY(20px)';
    toPage.style.display = 'block';
        
    // Create timeline
    const timeline = [];
        
    // Fade out current page
    timeline.push(
      this.animate(fromPage, {
        opacity: [1, 0],
        transform: ['translateY(0)', 'translateY(-20px)']
      }, {
        duration: duration * 0.6,
        easing,
        fill: 'forwards'
      })
    );
        
    // Fade in new page with overlap
    setTimeout(() => {
      timeline.push(
        this.animate(toPage, {
          opacity: [0, 1],
          transform: ['translateY(20px)', 'translateY(0)']
        }, {
          duration: duration * 0.6,
          easing,
          fill: 'forwards'
        })
      );
    }, duration * 0.6 - overlap);
        
    // Wait for all animations
    await Promise.all(timeline.map(anim => anim.finished));
        
    // Cleanup
    fromPage.style.display = 'none';
    fromPage.style.opacity = '';
    fromPage.style.transform = '';
  }
    
  // Staggered element reveals
  revealElements(selector, options = {}) {
    const {
      stagger = 100,
      duration = 600,
      easing = 'cubic-bezier(0.16, 1, 0.3, 1)',
      threshold = 0.1
    } = options;
        
    const elements = document.querySelectorAll(selector);
    if (!elements.length) return;
        
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            this.animate(entry.target, {
              opacity: [0, 1],
              transform: ['translateY(30px)', 'translateY(0)']
            }, {
              duration,
              easing,
              fill: 'forwards'
            });
                        
            entry.target.classList.add('revealed');
          }, index * stagger);
                    
          observer.unobserve(entry.target);
        }
      });
    }, { threshold });
        
    elements.forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
        
    this.observers.set(selector, observer);
  }
    
  // Parallax scrolling effects
  initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
        
    parallaxElements.forEach(element => {
      const speed = parseFloat(element.dataset.parallax) || 0.5;
      const offset = element.dataset.parallaxOffset || 0;
            
      this.animations.set(element, {
        speed,
        offset,
        bounds: element.getBoundingClientRect()
      });
    });
        
    this.updateParallax();
  }
    
  updateParallax() {
    if (this.performanceMode === 'low') return;
        
    this.animations.forEach((config, element) => {
      const { speed, offset } = config;
      const scrolled = window.pageYOffset;
      const yPos = -(scrolled * speed) + Number(offset);
            
      element.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
  }
    
  // Smooth scroll animations
  smoothScrollTo(target, options = {}) {
    const {
      duration = 800,
      easing = this.easeInOutExpo,
      offset = 0,
      callback = null
    } = options;
        
    const targetElement = typeof target === 'string' 
      ? document.querySelector(target)
      : target;
            
    if (!targetElement) return;
        
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset + offset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;
        
    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
            
      window.scrollTo(0, startPosition + distance * easing(progress));
            
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else if (callback) {
        callback();
      }
    };
        
    requestAnimationFrame(animation);
  }
    
  // Morph between shapes
  async morphShape(element, fromPath, toPath, options = {}) {
    const {
      duration = 1000,
      easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    } = options;
        
    if (!element || !element.getAttribute) return;
        
    // Use Web Animations API for morphing
    const animation = element.animate([
      { d: fromPath },
      { d: toPath }
    ], {
      duration,
      easing,
      fill: 'forwards'
    });
        
    return animation.finished;
  }
    
  // Text scramble effect
  scrambleText(element, newText, options = {}) {
    const {
      duration = 1000,
      characters = '!<>-_\\/[]{}—=+*^?#________'
    } = options;
        
    const oldText = element.textContent;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => {
      const queue = [];
            
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * 40);
        const end = start + Math.floor(Math.random() * 40);
        queue.push({ from, to, start, end });
      }
            
      let frame = 0;
      const update = () => {
        let output = '';
        let complete = 0;
                
        for (let i = 0, n = queue.length; i < n; i++) {
          const { from, to, start, end } = queue[i];
                    
          if (frame >= end) {
            complete++;
            output += to;
          } else if (frame >= start) {
            if (!characters) {
              output += to;
            } else {
              output += characters[Math.floor(Math.random() * characters.length)];
            }
          } else {
            output += from;
          }
        }
                
        element.textContent = output;
                
        if (complete === queue.length) {
          resolve();
        } else {
          frame++;
          requestAnimationFrame(update);
        }
      };
            
      update();
    });
        
    return promise;
  }
    
  // Particle burst effect
  createParticleBurst(x, y, options = {}) {
    const {
      count = 30,
      colors = ['#ffd700', '#ffed4e', '#fff'],
      spread = 50,
      duration = 1000
    } = options;
        
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
        
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = '4px';
      particle.style.height = '4px';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = '50%';
            
      const angle = (Math.PI * 2 * i) / count;
      const velocity = 1 + Math.random() * spread;
      const x = Math.cos(angle) * velocity;
      const y = Math.sin(angle) * velocity;
            
      container.appendChild(particle);
            
      this.animate(particle, {
        transform: ['translate(0, 0) scale(1)', `translate(${x}px, ${y}px) scale(0)`],
        opacity: [1, 0]
      }, {
        duration: duration + Math.random() * 500,
        easing: 'cubic-bezier(0, .9, .57, 1)',
        fill: 'forwards'
      }).finished.then(() => {
        particle.remove();
      });
    }
        
    setTimeout(() => container.remove(), duration + 1000);
  }
    
  // Setup scroll tracking
  setupScrollTracking() {
    let ticking = false;
        
    const updateScroll = () => {
      this.scrollPosition = window.pageYOffset;
      this.updateParallax();
      this.updateRevealAnimations();
      ticking = false;
    };
        
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScroll);
        ticking = true;
      }
    }, { passive: true });
  }
    
  // Setup intersection observers for reveal animations
  setupIntersectionObservers() {
    // Reveal animation observer
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
        
    // Add to elements with reveal classes
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
      revealObserver.observe(el);
    });
        
    this.observers.set('reveal', revealObserver);
  }
    
  // Initialize reveal animations
  initRevealAnimations() {
    const reveals = document.querySelectorAll('[data-reveal]');
        
    reveals.forEach(element => {
      const delay = element.dataset.revealDelay || 0;
      const duration = element.dataset.revealDuration || 600;
            
      element.style.transitionDelay = delay + 'ms';
      element.style.transitionDuration = duration + 'ms';
    });
  }
    
  // Update reveal animations based on scroll
  updateRevealAnimations() {
    // Custom reveal logic based on scroll position
    // This can be extended for more complex reveal patterns
  }
    
  // Performance monitoring
  monitorPerformance() {
    if (!window.performance || !window.performance.memory) return;
        
    setInterval(() => {
      const memory = window.performance.memory;
      const used = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            
      if (used > 0.9 && this.performanceMode !== 'low') {
        this.performanceMode = 'low';
        this.reduceAnimations();
      }
    }, 5000);
  }
    
  // Reduce animations for performance
  reduceAnimations() {
    // Disable parallax
    this.animations.clear();
        
    // Reduce particle effects
    document.documentElement.style.setProperty('--particle-count', '10');
        
    // Simplify transitions
    document.documentElement.style.setProperty('--duration-normal', '200ms');
  }
    
  // Easing functions
  easeInOutExpo(t) {
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 
      ? Math.pow(2, 20 * t - 10) / 2 
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  }
    
  // Wrapper for Web Animations API with fallback
  animate(element, keyframes, options) {
    if (element.animate) {
      return element.animate(keyframes, options);
    }
        
    // Fallback for older browsers
    const duration = options.duration || 300;
    const startTime = performance.now();
        
    const animation = {
      finished: new Promise((resolve) => {
        const update = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
                    
          // Apply styles based on progress
          // This is a simplified fallback
                    
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            resolve();
          }
        };
                
        requestAnimationFrame(update);
      })
    };
        
    return animation;
  }
    
  // Cleanup
  destroy() {
    // Cancel animations
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
        
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
        
    // Clear animations
    this.animations.clear();
        
    // Remove event listeners
    window.removeEventListener('scroll', this.updateScroll);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedAnimations;
}