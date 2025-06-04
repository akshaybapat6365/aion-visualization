// Visual Polish Application Script
// Applies Phase 3 visual enhancements to all pages

class VisualPolish {
  constructor() {
    this.animations = null;
    this.init();
  }
    
  init() {
    // Load advanced animations if available
    if (typeof AdvancedAnimations !== 'undefined') {
      this.animations = new AdvancedAnimations();
    }
        
    // Apply enhancements
    this.applyTypographyEnhancements();
    this.applyMicroInteractions();
    this.applyGlassEffects();
    this.applyRevealAnimations();
    this.enhanceButtons();
    this.addWebGLBackground();
    this.applyAccessibilityEnhancements();
  }
    
  applyTypographyEnhancements() {
    // Apply typography classes
    document.querySelectorAll('h1').forEach(h1 => {
      if (!h1.classList.contains('hero-title')) {
        h1.classList.add('heading-1');
      }
    });
        
    document.querySelectorAll('h2').forEach(h2 => {
      h2.classList.add('heading-2');
    });
        
    document.querySelectorAll('h3').forEach(h3 => {
      h3.classList.add('heading-3');
    });
        
    // Add display font to specific elements
    document.querySelectorAll('.chapter-title, .hero-title').forEach(el => {
      el.classList.add('heading-display');
    });
        
    // Apply body text classes
    document.querySelectorAll('p').forEach(p => {
      const parent = p.parentElement;
      if (parent.classList.contains('chapter-intro') || 
                parent.classList.contains('visualization-intro')) {
        p.classList.add('body-large');
      }
    });
  }
    
  applyMicroInteractions() {
    // Add interactive class to clickable elements
    const interactiveSelectors = [
      'button',
      'a',
      '.card',
      '.chapter-card',
      '.concept-card',
      '.symbol-card'
    ];
        
    interactiveSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('interactive');
      });
    });
        
    // Add hover sound effects (optional)
    if (this.isAudioEnabled()) {
      this.addHoverSounds();
    }
  }
    
  applyGlassEffects() {
    // Convert cards to glass morphism
    const cardSelectors = [
      '.chapter-card',
      '.concept-card',
      '.symbol-card',
      '.artifact-card'
    ];
        
    cardSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(card => {
        card.classList.add('glass-card');
      });
    });
        
    // Apply to navigation
    const nav = document.querySelector('.nav');
    if (nav) {
      nav.classList.add('glass-nav');
      nav.style.backdropFilter = 'blur(10px)';
      nav.style.backgroundColor = 'var(--glass-bg)';
    }
  }
    
  applyRevealAnimations() {
    if (!this.animations) return;
        
    // Hero content
    this.animations.revealElements('.hero-content > *', {
      stagger: 150,
      duration: 800
    });
        
    // Chapter headers
    this.animations.revealElements('.chapter-header > *', {
      stagger: 100,
      duration: 600
    });
        
    // Cards
    this.animations.revealElements('.chapter-card, .concept-card', {
      stagger: 100,
      duration: 600,
      threshold: 0.2
    });
        
    // Sections
    this.animations.revealElements('.content-section', {
      stagger: 200,
      duration: 800,
      threshold: 0.1
    });
  }
    
  enhanceButtons() {
    document.querySelectorAll('button, .button').forEach(button => {
      // Add ripple effect container
      if (!button.querySelector('.ripple-container')) {
        const rippleContainer = document.createElement('span');
        rippleContainer.className = 'ripple-container';
        button.appendChild(rippleContainer);
      }
            
      // Add click handler for ripple
      button.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
                
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
                
        button.querySelector('.ripple-container').appendChild(ripple);
                
        setTimeout(() => ripple.remove(), 600);
                
        // Particle effect if animations available
        if (this.animations) {
          this.animations.createParticleBurst(
            e.clientX,
            e.clientY,
            {
              count: 15,
              colors: ['#ffd700', '#ffed4e', '#fff'],
              spread: 20,
              duration: 800
            }
          );
        }
      });
            
      // Enhance button styles
      if (button.classList.contains('button-primary')) {
        button.classList.add('glow-gold');
      }
    });
  }
    
  addWebGLBackground() {
    // Check if WebGL background already exists
    if (document.getElementById('webgl-bg')) return;
        
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'webgl-bg';
    canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        `;
    document.body.insertBefore(canvas, document.body.firstChild);
        
    // Initialize simple WebGL background
    if (window.THREE) {
      this.initWebGLBackground(canvas);
    }
  }
    
  initWebGLBackground(canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
    // Create floating particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 50;
    const posArray = new Float32Array(particlesCount * 3);
        
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }
        
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0xffd700,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
        
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
        
    camera.position.z = 3;
        
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
            
      particlesMesh.rotation.y += 0.0005;
      particlesMesh.rotation.x += 0.0003;
            
      renderer.render(scene, camera);
    };
        
    animate();
        
    // Handle resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
    
  applyAccessibilityEnhancements() {
    // Add skip navigation link
    if (!document.querySelector('.skip-nav')) {
      const skipNav = document.createElement('a');
      skipNav.href = '#main';
      skipNav.className = 'skip-nav';
      skipNav.textContent = 'Skip to main content';
      skipNav.style.cssText = `
                position: absolute;
                top: -40px;
                left: 0;
                background: var(--accent-primary);
                color: var(--bg-primary);
                padding: 8px 16px;
                text-decoration: none;
                border-radius: 0 0 8px 0;
                transition: top 0.3s;
                z-index: 1000;
            `;
      skipNav.addEventListener('focus', () => {
        skipNav.style.top = '0';
      });
      skipNav.addEventListener('blur', () => {
        skipNav.style.top = '-40px';
      });
      document.body.insertBefore(skipNav, document.body.firstChild);
    }
        
    // Ensure main content has id
    const main = document.querySelector('main, .main-content, .chapter-content');
    if (main && !main.id) {
      main.id = 'main';
    }
        
    // Add aria-labels to interactive elements without text
    document.querySelectorAll('button:not([aria-label])').forEach(button => {
      if (!button.textContent.trim()) {
        button.setAttribute('aria-label', 'Interactive button');
      }
    });
        
    // Enhance focus indicators
    document.querySelectorAll('a, button, input, select, textarea').forEach(el => {
      el.classList.add('focus-ring');
    });
  }
    
  isAudioEnabled() {
    // Check user preference for audio
    return localStorage.getItem('audioEnabled') !== 'false';
  }
    
  addHoverSounds() {
    // Placeholder for hover sound implementation
    // Would require audio files and user permission
  }
}

// Apply polish when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new VisualPolish();
  });
} else {
  new VisualPolish();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisualPolish;
}