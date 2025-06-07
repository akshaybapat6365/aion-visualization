/**
 * page-transitions.js
 * Liquid page transition effects for smooth navigation
 * Implements various morphing patterns for page changes
 */

import { MorphEngine } from '../core/MorphEngine.js';
import { TransitionOrchestrator } from '../core/TransitionOrchestrator.js';

export class PageTransitions {
  constructor(options = {}) {
    this.options = {
      duration: 800,
      liquidStrength: 0.8,
      rippleCount: 3,
      ...options
    };
    
    this.morphEngine = new MorphEngine();
    this.orchestrator = new TransitionOrchestrator();
    
    // Transition states
    this.isTransitioning = false;
    this.currentPage = null;
  }
  
  /**
   * Liquid fade transition
   * Content dissolves and reforms like liquid
   */
  async liquidFade(fromPage, toPage, options = {}) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    
    const config = { ...this.options, ...options };
    
    // Prepare pages
    this.preparePage(fromPage, 'from');
    this.preparePage(toPage, 'to');
    
    // Create liquid mask
    const mask = this.createLiquidMask();
    fromPage.appendChild(mask);
    
    // Setup transitions
    this.orchestrator.reset();
    
    // Phase 1: Liquify current page
    this.orchestrator
      .register('maskReveal', {
        element: mask,
        type: 'custom',
        from: 0,
        to: 1,
        duration: config.duration * 0.6,
        easing: 'easeInQuart',
        applyValue: (el, value) => {
          this.updateLiquidMask(el, value);
        }
      })
      .register('fromFade', {
        element: fromPage,
        type: 'opacity',
        from: 1,
        to: 0,
        duration: config.duration * 0.5,
        delay: config.duration * 0.1
      })
      .register('fromBlur', {
        element: fromPage,
        type: 'blur',
        from: 0,
        to: 10,
        duration: config.duration * 0.4,
        delay: config.duration * 0.2
      });
    
    // Phase 2: Reform as new page
    this.orchestrator
      .register('toReveal', {
        element: toPage,
        type: 'opacity',
        from: 0,
        to: 1,
        duration: config.duration * 0.5,
        delay: config.duration * 0.5,
        onStart: () => {
          toPage.style.display = 'block';
        }
      })
      .register('toUnblur', {
        element: toPage,
        type: 'blur',
        from: 10,
        to: 0,
        duration: config.duration * 0.4,
        delay: config.duration * 0.5
      })
      .register('maskHide', {
        element: mask,
        type: 'opacity',
        from: 1,
        to: 0,
        duration: config.duration * 0.3,
        delay: config.duration * 0.7
      });
    
    // Execute transition
    this.orchestrator.enqueue(
      'maskReveal', 'fromFade', 'fromBlur',
      'toReveal', 'toUnblur', 'maskHide'
    );
    
    await this.orchestrator.play();
    
    // Cleanup
    this.cleanupTransition(fromPage, toPage, mask);
    this.isTransitioning = false;
  }
  
  /**
   * Ripple transition
   * Content ripples away and reforms
   */
  async rippleTransition(fromPage, toPage, origin = { x: 0.5, y: 0.5 }, options = {}) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    
    const config = { ...this.options, ...options };
    
    // Calculate ripple origin
    const rect = fromPage.getBoundingClientRect();
    const originX = rect.width * origin.x;
    const originY = rect.height * origin.y;
    
    // Create ripple elements
    const ripples = this.createRipples(config.rippleCount, originX, originY);
    fromPage.appendChild(ripples.container);
    
    // Setup transitions
    this.orchestrator.reset();
    
    // Ripple animations
    ripples.elements.forEach((ripple, index) => {
      const delay = index * 50;
      
      this.orchestrator
        .register(`ripple${index}Scale`, {
          element: ripple,
          type: 'scale',
          from: 0,
          to: 3,
          duration: config.duration,
          delay: delay,
          easing: 'easeOutQuart'
        })
        .register(`ripple${index}Opacity`, {
          element: ripple,
          type: 'opacity',
          from: 0.8,
          to: 0,
          duration: config.duration * 0.8,
          delay: delay + config.duration * 0.2
        });
    });
    
    // Page transitions
    this.orchestrator
      .register('fromScale', {
        element: fromPage.querySelector('.content'),
        type: 'scale',
        from: 1,
        to: 0.9,
        duration: config.duration * 0.6,
        easing: 'easeInOutCubic'
      })
      .register('fromOpacity', {
        element: fromPage,
        type: 'opacity',
        from: 1,
        to: 0,
        duration: config.duration * 0.5,
        delay: config.duration * 0.3
      })
      .register('toScale', {
        element: toPage.querySelector('.content'),
        type: 'scale',
        from: 1.1,
        to: 1,
        duration: config.duration * 0.6,
        delay: config.duration * 0.4,
        onStart: () => {
          toPage.style.display = 'block';
        }
      })
      .register('toOpacity', {
        element: toPage,
        type: 'opacity',
        from: 0,
        to: 1,
        duration: config.duration * 0.5,
        delay: config.duration * 0.4
      });
    
    // Execute
    const items = [];
    for (let i = 0; i < config.rippleCount; i++) {
      items.push(`ripple${i}Scale`, `ripple${i}Opacity`);
    }
    items.push('fromScale', 'fromOpacity', 'toScale', 'toOpacity');
    
    this.orchestrator.enqueue(...items);
    await this.orchestrator.play();
    
    // Cleanup
    this.cleanupTransition(fromPage, toPage, ripples.container);
    this.isTransitioning = false;
  }
  
  /**
   * Morph transition
   * Elements morph between pages
   */
  async morphTransition(fromPage, toPage, options = {}) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    
    const config = { ...this.options, ...options };
    
    // Find morphable elements
    const morphPairs = this.findMorphableElements(fromPage, toPage);
    
    // Create morph paths
    const morphData = await this.createMorphData(morphPairs);
    
    // Setup transitions
    this.orchestrator.reset();
    
    // Morph each pair
    morphData.forEach((data, index) => {
      const { from, to, path } = data;
      
      // Create SVG overlay
      const svg = this.createMorphOverlay(from, to);
      document.body.appendChild(svg);
      
      this.orchestrator
        .register(`morph${index}`, {
          element: svg.querySelector('path'),
          type: 'custom',
          from: 0,
          to: 1,
          duration: config.duration,
          easing: 'easeInOutCubic',
          applyValue: async (el, value) => {
            const currentPath = await this.morphEngine.interpolatePath(
              path.from,
              path.to,
              value
            );
            el.setAttribute('d', currentPath);
          },
          onComplete: () => {
            document.body.removeChild(svg);
          }
        })
        .register(`hide${index}`, {
          element: from,
          type: 'opacity',
          from: 1,
          to: 0,
          duration: config.duration * 0.3
        })
        .register(`show${index}`, {
          element: to,
          type: 'opacity',
          from: 0,
          to: 1,
          duration: config.duration * 0.3,
          delay: config.duration * 0.7,
          onStart: () => {
            to.style.visibility = 'visible';
          }
        });
    });
    
    // Page-level transitions
    this.orchestrator
      .register('pageFromFade', {
        element: fromPage,
        type: 'opacity',
        from: 1,
        to: 0,
        duration: config.duration,
        delay: config.duration * 0.2
      })
      .register('pageToFade', {
        element: toPage,
        type: 'opacity',
        from: 0,
        to: 1,
        duration: config.duration,
        delay: config.duration * 0.2,
        onStart: () => {
          toPage.style.display = 'block';
        }
      });
    
    // Execute
    const items = [];
    morphData.forEach((_, index) => {
      items.push(`morph${index}`, `hide${index}`, `show${index}`);
    });
    items.push('pageFromFade', 'pageToFade');
    
    this.orchestrator.enqueue(...items);
    await this.orchestrator.play();
    
    // Cleanup
    this.cleanupTransition(fromPage, toPage);
    this.isTransitioning = false;
  }
  
  /**
   * Create liquid mask SVG
   */
  createLiquidMask() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.id = 'liquid';
    
    // Turbulence for liquid effect
    const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
    turbulence.setAttribute('baseFrequency', '0.02');
    turbulence.setAttribute('numOctaves', '3');
    turbulence.setAttribute('seed', '1');
    
    // Displacement map
    const displacement = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
    displacement.setAttribute('in', 'SourceGraphic');
    displacement.setAttribute('scale', '0');
    
    filter.appendChild(turbulence);
    filter.appendChild(displacement);
    defs.appendChild(filter);
    svg.appendChild(defs);
    
    // Mask path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', this.generateLiquidPath(0));
    path.setAttribute('fill', 'rgba(0, 0, 0, 0.9)');
    path.setAttribute('filter', 'url(#liquid)');
    svg.appendChild(path);
    
    return svg;
  }
  
  /**
   * Update liquid mask based on progress
   */
  updateLiquidMask(svg, progress) {
    const path = svg.querySelector('path');
    const displacement = svg.querySelector('feDisplacementMap');
    
    // Update path
    path.setAttribute('d', this.generateLiquidPath(progress));
    
    // Update displacement
    const scale = progress * this.options.liquidStrength * 30;
    displacement.setAttribute('scale', scale);
  }
  
  /**
   * Generate liquid path shape
   */
  generateLiquidPath(progress) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const waveHeight = height * 0.1;
    const y = height * (1 - progress);
    
    let path = `M 0 ${y}`;
    
    // Create wavy top edge
    for (let x = 0; x <= width; x += width / 10) {
      const wave = Math.sin((x / width) * Math.PI * 2 + progress * Math.PI) * waveHeight;
      path += ` Q ${x + width / 20} ${y + wave} ${x + width / 10} ${y}`;
    }
    
    path += ` L ${width} ${height} L 0 ${height} Z`;
    
    return path;
  }
  
  /**
   * Create ripple elements
   */
  createRipples(count, originX, originY) {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      z-index: 999;
    `;
    
    const elements = [];
    
    for (let i = 0; i < count; i++) {
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
        transform: translate(-50%, -50%) scale(0);
        left: ${originX}px;
        top: ${originY}px;
      `;
      
      container.appendChild(ripple);
      elements.push(ripple);
    }
    
    return { container, elements };
  }
  
  /**
   * Find elements that can be morphed between pages
   */
  findMorphableElements(fromPage, toPage) {
    const pairs = [];
    
    // Find elements with data-morph attribute
    const fromElements = fromPage.querySelectorAll('[data-morph]');
    
    fromElements.forEach(fromEl => {
      const morphId = fromEl.getAttribute('data-morph');
      const toEl = toPage.querySelector(`[data-morph="${morphId}"]`);
      
      if (toEl) {
        pairs.push({ from: fromEl, to: toEl, id: morphId });
      }
    });
    
    return pairs;
  }
  
  /**
   * Create morph data for element pairs
   */
  async createMorphData(pairs) {
    const morphData = [];
    
    for (const pair of pairs) {
      const fromRect = pair.from.getBoundingClientRect();
      const toRect = pair.to.getBoundingClientRect();
      
      // Generate paths based on element shapes
      const fromPath = this.elementToPath(pair.from, fromRect);
      const toPath = this.elementToPath(pair.to, toRect);
      
      morphData.push({
        from: pair.from,
        to: pair.to,
        path: { from: fromPath, to: toPath },
        fromRect,
        toRect
      });
    }
    
    return morphData;
  }
  
  /**
   * Convert element to SVG path
   */
  elementToPath(element, rect) {
    const borderRadius = getComputedStyle(element).borderRadius;
    const radius = parseFloat(borderRadius) || 0;
    
    if (radius > 0) {
      // Rounded rectangle
      return `
        M ${radius} 0
        L ${rect.width - radius} 0
        Q ${rect.width} 0 ${rect.width} ${radius}
        L ${rect.width} ${rect.height - radius}
        Q ${rect.width} ${rect.height} ${rect.width - radius} ${rect.height}
        L ${radius} ${rect.height}
        Q 0 ${rect.height} 0 ${rect.height - radius}
        L 0 ${radius}
        Q 0 0 ${radius} 0
      `;
    } else {
      // Rectangle
      return `
        M 0 0
        L ${rect.width} 0
        L ${rect.width} ${rect.height}
        L 0 ${rect.height}
        Z
      `;
    }
  }
  
  /**
   * Create morph overlay SVG
   */
  createMorphOverlay(fromEl, toEl) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1001;
    `;
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const fromRect = fromEl.getBoundingClientRect();
    
    path.setAttribute('transform', `translate(${fromRect.left}, ${fromRect.top})`);
    path.setAttribute('fill', getComputedStyle(fromEl).backgroundColor);
    path.setAttribute('opacity', '1');
    
    svg.appendChild(path);
    
    return svg;
  }
  
  /**
   * Prepare page for transition
   */
  preparePage(page, type) {
    page.style.position = 'absolute';
    page.style.top = '0';
    page.style.left = '0';
    page.style.width = '100%';
    
    if (type === 'to') {
      page.style.display = 'none';
      page.style.opacity = '0';
    }
  }
  
  /**
   * Cleanup after transition
   */
  cleanupTransition(fromPage, toPage, ...elements) {
    // Hide from page
    fromPage.style.display = 'none';
    
    // Reset styles
    toPage.style.position = '';
    toPage.style.opacity = '';
    toPage.style.filter = '';
    
    // Remove temporary elements
    elements.forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // Update current page
    this.currentPage = toPage;
  }
}