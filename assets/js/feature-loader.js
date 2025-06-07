/**
 * Feature Loader
 * Loads design system features with proper module resolution
 */

// Load magnetic cursor system
import('./magnetic-cursor/index.js').then(module => {
  const { MagneticCursorSystem } = module;
  
  // Initialize system
  window.magneticCursor = new MagneticCursorSystem({
    autoInit: true,
    enableTrail: true,
    enableButtons: true,
    enableLinks: true,
    performanceMode: 'auto'
  });
  
  console.log('✨ Magnetic cursor system loaded');
}).catch(err => {
  console.warn('Could not load magnetic cursor:', err);
});

// Apply liquid transitions
document.addEventListener('DOMContentLoaded', () => {
  // Add liquid transition class to body
  document.body.classList.add('liquid-transitions-enabled');
  
  // Add to navigation links
  const navLinks = document.querySelectorAll('nav a, .nav-link, .chapter-link');
  navLinks.forEach(link => {
    link.classList.add('liquid-transition');
  });
  
  // Handle page transitions
  let isTransitioning = false;
  
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && !link.href.includes('#') && !isTransitioning) {
      e.preventDefault();
      isTransitioning = true;
      
      // Apply liquid morph effect
      document.body.classList.add('liquid-morph-out');
      
      setTimeout(() => {
        window.location.href = link.href;
      }, 800);
    }
  });
  
  // Fade in on load
  document.body.classList.add('liquid-morph-in');
  
  console.log('✨ Liquid transitions enabled');
});
