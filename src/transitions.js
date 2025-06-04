// Smooth Page Transitions for Aion Visualization

class PageTransitions {
  constructor() {
    this.transitioning = false;
    this.init();
  }
    
  init() {
    // Create transition overlay
    this.createOverlay();
        
    // Intercept all internal links
    this.setupLinkInterception();
        
    // Handle browser back/forward
    window.addEventListener('popstate', () => this.handlePopState());
        
    // Initial page animation
    this.animatePageIn();
  }
    
  createOverlay() {
    // Create transition overlay element
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    overlay.innerHTML = `
            <style>
                .page-transition-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #000;
                    z-index: 10000;
                    pointer-events: none;
                    transform: translateY(100%);
                }
                
                .page-transition-overlay.active {
                    pointer-events: all;
                }
                
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                
                @keyframes slideDown {
                    from { transform: translateY(0); }
                    to { transform: translateY(-100%); }
                }
                
                .page-content-fade {
                    animation: contentFadeIn 0.6s ease-out;
                }
                
                @keyframes contentFadeIn {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            </style>
        `;
    document.body.appendChild(overlay);
    this.overlay = overlay;
  }
    
  setupLinkInterception() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
            
      if (!link || this.transitioning) return;
            
      // Check if it's an internal link
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) return;
            
      // Only intercept .html links
      if (!href.endsWith('.html')) return;
            
      e.preventDefault();
      this.navigateTo(href);
    });
  }
    
  async navigateTo(url) {
    if (this.transitioning) return;
    this.transitioning = true;
        
    // Start transition
    await this.animatePageOut();
        
    // Load new page
    try {
      const response = await fetch(url);
      const html = await response.text();
            
      // Parse the new page
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(html, 'text/html');
            
      // Update the page content
      document.title = newDoc.title;
            
      // Replace body content except overlay and scripts
      const newBody = newDoc.body.innerHTML;
      const scripts = document.querySelectorAll('script');
      const overlay = this.overlay;
            
      document.body.innerHTML = newBody;
      document.body.appendChild(overlay);
            
      // Re-execute scripts from new page
      const newScripts = newDoc.querySelectorAll('script');
      newScripts.forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        document.body.appendChild(newScript);
      });
            
      // Update URL
      window.history.pushState({}, '', url);
            
      // Re-initialize after DOM update
      this.setupLinkInterception();
            
      // Complete transition
      await this.animatePageIn();
            
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = url; // Fallback
    }
        
    this.transitioning = false;
  }
    
  animatePageOut() {
    return new Promise(resolve => {
      // Fade out current content
      const content = document.querySelector('main, section, .container');
      if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(-20px)';
        content.style.transition = 'all 0.3s ease-out';
      }
            
      // Slide up overlay
      this.overlay.classList.add('active');
      this.overlay.style.animation = 'slideUp 0.4s ease-out forwards';
            
      setTimeout(resolve, 400);
    });
  }
    
  animatePageIn() {
    return new Promise(resolve => {
      // Slide down overlay
      this.overlay.style.animation = 'slideDown 0.4s ease-out forwards';
            
      setTimeout(() => {
        this.overlay.classList.remove('active');
                
        // Fade in new content
        const content = document.querySelector('main, section, .chapter-hero');
        if (content) {
          content.classList.add('page-content-fade');
        }
                
        // Re-run any initialization code
        if (window.initPage) {
          window.initPage();
        }
                
        resolve();
      }, 400);
    });
  }
    
  handlePopState() {
    if (!this.transitioning) {
      this.navigateTo(window.location.pathname);
    }
  }
}

// Initialize transitions when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PageTransitions();
  });
} else {
  new PageTransitions();
}