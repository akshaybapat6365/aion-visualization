// Advanced Animation System for Museum-Quality Experience
// Provides sophisticated animations, transitions, and scroll effects

class AdvancedAnimations {
    constructor() {
        this.isAnimating = false;
        this.observers = new Map();
        this.particles = [];
        this.animationCallbacks = new Map();
        this.lastScrollY = window.scrollY;
        this.scrollDirection = 'down';
        
        this.init();
    }
    
    init() {
        this.setupScrollObserver();
        this.setupPageTransitions();
        this.bindEvents();
        this.startParticleSystem();
    }
    
    // ========== Page Transition System ==========
    async pageTransition(fromPage, toPage, options = {}) {
        if (this.isAnimating) return;
        
        const {
            duration = 800,
            easing = 'cubic-bezier(0.16, 1, 0.3, 1)',
            direction = 'up',
            overlay = true
        } = options;
        
        this.isAnimating = true;
        
        const timeline = [];
        
        // Create transition overlay if needed
        if (overlay) {
            const overlayElement = this.createTransitionOverlay();
            timeline.push(this.animateOverlay(overlayElement, 'in', duration * 0.4));
        }
        
        // Animate out current page
        if (fromPage) {
            timeline.push(this.animate(fromPage, {
                opacity: [1, 0],
                transform: [`translateY(0)`, `translateY(${direction === 'up' ? '-20px' : '20px'})`]
            }, { duration: duration * 0.6, easing, fill: 'forwards' }));
        }
        
        // Wait for exit animation
        await Promise.all(timeline);
        
        // Animate in new page
        if (toPage) {
            toPage.style.opacity = '0';
            toPage.style.transform = `translateY(${direction === 'up' ? '20px' : '-20px'})`;
            
            await this.animate(toPage, {
                opacity: [0, 1],
                transform: [`translateY(${direction === 'up' ? '20px' : '-20px'})`, 'translateY(0)']
            }, { duration: duration * 0.6, easing, delay: duration * 0.2 });
        }
        
        // Remove overlay
        if (overlay) {
            const overlayElement = document.querySelector('.transition-overlay');
            if (overlayElement) {
                await this.animateOverlay(overlayElement, 'out', duration * 0.4);
                overlayElement.remove();
            }
        }
        
        this.isAnimating = false;
    }
    
    createTransitionOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'transition-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #0a0a0a, #1a1a1a);
            z-index: 9999;
            opacity: 0;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);
        return overlay;
    }
    
    async animateOverlay(overlay, direction, duration) {
        const keyframes = direction === 'in' 
            ? { opacity: [0, 0.95] }
            : { opacity: [0.95, 0] };
            
        return this.animate(overlay, keyframes, { duration, fill: 'forwards' });
    }
    
    // ========== Staggered Reveal System ==========
    staggerReveal(elements, options = {}) {
        const {
            delay = 100,
            duration = 600,
            stagger = 80,
            from = 'bottom',
            distance = 30
        } = options;
        
        const transforms = {
            bottom: `translateY(${distance}px)`,
            top: `translateY(-${distance}px)`,
            left: `translateX(-${distance}px)`,
            right: `translateX(${distance}px)`,
            scale: 'scale(0.9)',
            fade: 'scale(1)'
        };
        
        const initialTransform = transforms[from] || transforms.bottom;
        
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = initialTransform;
            
            setTimeout(() => {
                this.animate(element, {
                    opacity: [0, 1],
                    transform: [initialTransform, 'translateY(0) translateX(0) scale(1)']
                }, {
                    duration,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    fill: 'forwards'
                });
            }, delay + (index * stagger));
        });
    }
    
    // ========== Scroll-Based Animations ==========
    setupScrollObserver() {
        const observerOptions = {
            threshold: [0, 0.25, 0.5, 0.75, 1],
            rootMargin: '0px 0px -10% 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.handleScrollReveal(entry);
            });
        }, observerOptions);
        
        this.observers.set('scroll', observer);
        
        // Auto-observe elements with reveal classes
        document.addEventListener('DOMContentLoaded', () => {
            this.observeRevealElements();
        });
        
        // Track scroll direction
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            this.scrollDirection = currentScrollY > this.lastScrollY ? 'down' : 'up';
            this.lastScrollY = currentScrollY;
        });
    }
    
    observeRevealElements() {
        const revealElements = document.querySelectorAll('[data-reveal], .reveal, .reveal-left, .reveal-scale');
        const scrollObserver = this.observers.get('scroll');
        
        revealElements.forEach(element => {
            scrollObserver.observe(element);
        });
    }
    
    handleScrollReveal(entry) {
        const element = entry.target;
        const revealType = element.dataset.reveal || this.getRevealType(element);
        
        if (entry.isIntersecting && entry.intersectionRatio > 0.25) {
            this.revealElement(element, revealType);
        }
    }
    
    getRevealType(element) {
        if (element.classList.contains('reveal-left')) return 'left';
        if (element.classList.contains('reveal-scale')) return 'scale';
        return 'up';
    }
    
    revealElement(element, type = 'up') {
        if (element.dataset.revealed) return;
        
        const animations = {
            up: {
                opacity: [0, 1],
                transform: ['translateY(30px)', 'translateY(0)']
            },
            left: {
                opacity: [0, 1],
                transform: ['translateX(-30px)', 'translateX(0)']
            },
            scale: {
                opacity: [0, 1],
                transform: ['scale(0.9)', 'scale(1)']
            }
        };
        
        const animation = animations[type] || animations.up;
        
        this.animate(element, animation, {
            duration: 800,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards'
        });
        
        element.dataset.revealed = 'true';
    }
    
    // ========== Parallax Effects ==========
    enableParallax(elements) {
        if (!Array.isArray(elements)) elements = [elements];
        
        const parallaxHandler = () => {
            const scrolled = window.pageYOffset;
            
            elements.forEach(element => {
                const rate = element.dataset.parallaxRate || 0.5;
                const yPos = -(scrolled * rate);
                element.style.transform = `translateY(${yPos}px)`;
            });
        };
        
        window.addEventListener('scroll', parallaxHandler, { passive: true });
    }
    
    // ========== Particle Burst Effects ==========
    startParticleSystem() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        `;
        document.body.appendChild(canvas);
        
        this.particleCanvas = canvas;
        this.particleContext = canvas.getContext('2d');
        this.resizeParticleCanvas();
        
        window.addEventListener('resize', () => this.resizeParticleCanvas());
    }
    
    resizeParticleCanvas() {
        const canvas = this.particleCanvas;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    createParticleBurst(x, y, options = {}) {
        const {
            count = 20,
            colors = ['#F59E0B', '#3B82F6', '#8B5CF6'],
            speed = 2,
            size = 3,
            life = 60
        } = options;
        
        for (let i = 0; i < count; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * speed * 2,
                vy: (Math.random() - 0.5) * speed * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * size + 1,
                life: life,
                maxLife: life,
                alpha: 1
            };
            
            this.particles.push(particle);
        }
        
        if (!this.particleAnimating) {
            this.animateParticles();
        }
    }
    
    animateParticles() {
        this.particleAnimating = true;
        
        const animate = () => {
            const ctx = this.particleContext;
            ctx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);
            
            this.particles = this.particles.filter(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
                particle.alpha = particle.life / particle.maxLife;
                
                ctx.save();
                ctx.globalAlpha = particle.alpha;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                
                return particle.life > 0;
            });
            
            if (this.particles.length > 0) {
                requestAnimationFrame(animate);
            } else {
                this.particleAnimating = false;
            }
        };
        
        animate();
    }
    
    // ========== Text Scramble Effect ==========
    scrambleText(element, newText, options = {}) {
        const {
            duration = 800,
            chars = '!<>-_\\/[]{}—=+*^?#________'
        } = options;
        
        const oldText = element.textContent;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise(resolve => {
            let frame = 0;
            const maxFrames = duration / 16; // ~60fps
            
            const animate = () => {
                let output = '';
                let complete = 0;
                
                for (let i = 0; i < length; i++) {
                    if (frame >= i * (maxFrames / length)) {
                        output += newText[i] || '';
                        complete++;
                    } else {
                        output += chars[Math.floor(Math.random() * chars.length)];
                    }
                }
                
                element.textContent = output;
                
                if (complete === length) {
                    resolve();
                } else {
                    frame++;
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        });
        
        return promise;
    }
    
    // ========== Utility Animation Method ==========
    animate(element, keyframes, options = {}) {
        return new Promise(resolve => {
            const animation = element.animate(keyframes, {
                duration: 300,
                easing: 'ease-out',
                fill: 'forwards',
                ...options
            });
            
            animation.onfinish = () => resolve(animation);
            animation.oncancel = () => resolve(animation);
        });
    }
    
    // ========== Event Bindings ==========
    bindEvents() {
        // Particle bursts on click
        document.addEventListener('click', (e) => {
            if (e.target.dataset.particles === 'true') {
                this.createParticleBurst(e.clientX, e.clientY);
            }
        });
        
        // Auto-reveal new elements
        const mutationObserver = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        const revealElements = node.querySelectorAll ? 
                            node.querySelectorAll('[data-reveal], .reveal, .reveal-left, .reveal-scale') : 
                            [];
                        
                        revealElements.forEach(element => {
                            this.observers.get('scroll').observe(element);
                        });
                    }
                });
            });
        });
        
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    setupPageTransitions() {
        // Setup SPA-style transitions if needed
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-transition]');
            if (link && link.href) {
                e.preventDefault();
                this.handleLinkTransition(link);
            }
        });
    }
    
    async handleLinkTransition(link) {
        const href = link.href;
        const transitionType = link.dataset.transition || 'slide';
        
        // Simple page transition for same-site links
        if (href.startsWith(window.location.origin)) {
            await this.pageTransition(document.body, null, { direction: 'up' });
            window.location.href = href;
        }
    }
    
    // ========== Performance Monitoring ==========
    getPerformanceMetrics() {
        return {
            isAnimating: this.isAnimating,
            particleCount: this.particles.length,
            observedElements: Array.from(this.observers.values()).reduce((sum, observer) => sum + observer.root?.children?.length || 0, 0)
        };
    }
    
    // ========== Cleanup ==========
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        if (this.particleCanvas) {
            this.particleCanvas.remove();
        }
        
        this.particles = [];
        this.isAnimating = false;
    }
}

// Global instance
window.AdvancedAnimations = AdvancedAnimations;