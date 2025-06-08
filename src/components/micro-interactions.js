/**
 * Micro-interactions System
 * Subtle animations and feedback for enhanced user experience
 * Complements the magnetic cursor system with additional polish
 */

export class MicroInteractions {
  constructor() {
    this.initialized = false;
    this.ripples = new Map();
    this.init();
  }

  init() {
    if (this.initialized) return;
    
    this.injectStyles();
    this.setupEventDelegation();
    this.enhanceElements();
    this.initialized = true;
  }

  injectStyles() {
    if (document.getElementById('micro-interactions-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'micro-interactions-styles';
    styles.textContent = `
      /* Button Enhancements */
      button, .button, .btn {
        position: relative;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform-style: preserve-3d;
      }

      button::before, .button::before, .btn::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
        pointer-events: none;
      }

      button:hover::before, .button:hover::before, .btn:hover::before {
        width: 300%;
        height: 300%;
      }

      /* Link Enhancements */
      a:not(.no-interaction) {
        position: relative;
        display: inline-block;
        transition: color 0.3s ease;
      }

      a:not(.no-interaction)::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 1px;
        background: currentColor;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0.3;
      }

      a:not(.no-interaction):hover::after {
        width: 100%;
      }

      /* Ripple Effect */
      .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: rippleAnimation 0.6s ease-out;
        pointer-events: none;
      }

      @keyframes rippleAnimation {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }

      /* Focus States */
      button:focus-visible, 
      .button:focus-visible, 
      .btn:focus-visible,
      a:focus-visible,
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: 2px solid var(--grey-500, #3F3F3F);
        outline-offset: 2px;
      }

      /* Input Enhancements */
      input:not([type="checkbox"]):not([type="radio"]),
      textarea,
      select {
        transition: all 0.3s ease;
        border-color: var(--grey-600, #2A2A2A);
      }

      input:not([type="checkbox"]):not([type="radio"]):hover,
      textarea:hover,
      select:hover {
        border-color: var(--grey-500, #3F3F3F);
      }

      input:not([type="checkbox"]):not([type="radio"]):focus,
      textarea:focus,
      select:focus {
        border-color: var(--grey-400, #555555);
        background: var(--grey-800, #141414);
      }

      /* Checkbox and Radio Enhancements */
      input[type="checkbox"],
      input[type="radio"] {
        position: relative;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      input[type="checkbox"]:hover,
      input[type="radio"]:hover {
        transform: scale(1.1);
      }

      input[type="checkbox"]:active,
      input[type="radio"]:active {
        transform: scale(0.95);
      }

      /* Card Hover Effects */
      .card, .chapter-card, .feature-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform-style: preserve-3d;
      }

      .card:hover, .chapter-card:hover, .feature-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
      }

      /* Image Hover Effects */
      img:not(.no-interaction) {
        transition: all 0.3s ease;
      }

      img:not(.no-interaction):hover {
        filter: brightness(1.1) contrast(1.05);
      }

      /* Text Selection */
      ::selection {
        background: var(--grey-600, #2A2A2A);
        color: var(--grey-050, #F0F0F0);
      }

      /* Smooth Scroll Behavior */
      html {
        scroll-behavior: smooth;
      }

      /* Loading Skeleton Animation */
      .skeleton-shimmer {
        position: relative;
        overflow: hidden;
      }

      .skeleton-shimmer::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.05) 50%,
          transparent 100%
        );
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        to {
          left: 100%;
        }
      }

      /* Pulse Animation for Important Elements */
      .pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      /* Subtle Breathing Animation */
      .breathe {
        animation: breathe 4s ease-in-out infinite;
      }

      @keyframes breathe {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.02);
        }
      }

      /* Navigation Item Hover */
      nav a {
        position: relative;
        transition: all 0.3s ease;
      }

      nav a::before {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        width: 0;
        height: 2px;
        background: var(--grey-050, #F0F0F0);
        transform: translateX(-50%);
        transition: width 0.3s ease;
      }

      nav a:hover::before,
      nav a.active::before {
        width: 80%;
      }

      /* Tooltip Enhancement */
      [data-tooltip] {
        position: relative;
      }

      [data-tooltip]::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        background: var(--grey-800, #141414);
        color: var(--grey-050, #F0F0F0);
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-size: 0.875rem;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        pointer-events: none;
        z-index: 1000;
      }

      [data-tooltip]:hover::after {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-5px);
      }

      /* Reduced Motion Support */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        html {
          scroll-behavior: auto;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  setupEventDelegation() {
    // Ripple effect on click
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, .button, .btn');
      if (target && !target.classList.contains('no-ripple')) {
        this.createRipple(e, target);
      }
    });

    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Tab navigation enhancement
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }

      // Escape key handling
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }

      // Enter key enhancement for links
      if (e.key === 'Enter' && e.target.tagName === 'A') {
        e.target.click();
      }
    });

    // Remove keyboard navigation class on mouse use
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });

    // Smooth anchor scrolling
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  }

  enhanceElements() {
    // Add subtle animations to existing elements
    this.enhanceButtons();
    this.enhanceLinks();
    this.enhanceImages();
    this.enhanceCards();
  }

  enhanceButtons() {
    const buttons = document.querySelectorAll('button, .button, .btn');
    buttons.forEach(button => {
      if (!button.dataset.enhanced) {
        // Add hover sound effect (optional)
        button.addEventListener('mouseenter', () => {
          this.playHoverSound();
        });

        // Add click feedback
        button.addEventListener('click', () => {
          this.playClickSound();
          this.addClickFeedback(button);
        });

        button.dataset.enhanced = 'true';
      }
    });
  }

  enhanceLinks() {
    const links = document.querySelectorAll('a:not(.no-interaction)');
    links.forEach(link => {
      if (!link.dataset.enhanced) {
        // Add hover effect
        link.addEventListener('mouseenter', () => {
          this.addLinkHoverEffect(link);
        });

        link.dataset.enhanced = 'true';
      }
    });
  }

  enhanceImages() {
    const images = document.querySelectorAll('img:not(.no-interaction)');
    images.forEach(img => {
      if (!img.dataset.enhanced) {
        // Add lazy loading
        if ('loading' in HTMLImageElement.prototype) {
          img.loading = 'lazy';
        }

        // Add fade-in on load
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        });

        img.dataset.enhanced = 'true';
      }
    });
  }

  enhanceCards() {
    const cards = document.querySelectorAll('.card, .chapter-card, .feature-card');
    cards.forEach(card => {
      if (!card.dataset.enhanced) {
        // Add tilt effect on hover
        card.addEventListener('mousemove', (e) => {
          this.addTiltEffect(e, card);
        });

        card.addEventListener('mouseleave', () => {
          this.removeTiltEffect(card);
        });

        card.dataset.enhanced = 'true';
      }
    });
  }

  createRipple(event, element) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    element.appendChild(ripple);

    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  addClickFeedback(element) {
    element.style.transform = 'scale(0.98)';
    setTimeout(() => {
      element.style.transform = '';
    }, 100);
  }

  addLinkHoverEffect(link) {
    // Already handled by CSS, but can add more here
  }

  addTiltEffect(event, card) {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
  }

  removeTiltEffect(card) {
    card.style.transform = '';
  }

  handleEscapeKey() {
    // Close any open modals, dropdowns, etc.
    const openModals = document.querySelectorAll('.modal.open');
    openModals.forEach(modal => {
      modal.classList.remove('open');
    });
  }

  // Sound effects (optional, requires audio files)
  playHoverSound() {
    // Implement if sound effects are desired
  }

  playClickSound() {
    // Implement if sound effects are desired
  }

  // Utility methods
  addTooltip(element, text) {
    element.setAttribute('data-tooltip', text);
  }

  addPulseEffect(element) {
    element.classList.add('pulse');
  }

  removePulseEffect(element) {
    element.classList.remove('pulse');
  }

  addBreatheEffect(element) {
    element.classList.add('breathe');
  }

  addShimmerEffect(element) {
    element.classList.add('skeleton-shimmer');
  }

  removeShimmerEffect(element) {
    element.classList.remove('skeleton-shimmer');
  }
}

// Export singleton instance
export const microInteractions = new MicroInteractions();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.microInteractions = microInteractions;
  });
} else {
  window.microInteractions = microInteractions;
}