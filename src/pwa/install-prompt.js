/**
 * PWA Installation Prompt
 * Handles the installation flow for Progressive Web App
 */

export class PWAInstallPrompt {
  constructor(options = {}) {
    this.options = {
      promptDelay: 30000, // 30 seconds
      dismissDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      showOnPages: ['/', '/chapters/', '/showcase.html'],
      ...options
    };
    
    this.deferredPrompt = null;
    this.installButton = null;
    this.init();
  }

  init() {
    // Check if already installed
    if (this.isInstalled()) {
      console.log('[PWA] App already installed');
      return;
    }

    // Check if prompt was recently dismissed
    if (this.wasRecentlyDismissed()) {
      console.log('[PWA] Install prompt recently dismissed');
      return;
    }

    this.createInstallUI();
    this.setupEventListeners();
    this.checkInstallability();
  }

  createInstallUI() {
    // Create install banner
    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-install-content">
        <div class="pwa-install-icon">📱</div>
        <div class="pwa-install-text">
          <h3>Install Aion Visualization</h3>
          <p>Add to your home screen for offline access and a better experience</p>
        </div>
        <div class="pwa-install-actions">
          <button class="pwa-install-button" id="pwa-install-yes">Install</button>
          <button class="pwa-install-dismiss" id="pwa-install-no">Not Now</button>
        </div>
      </div>
    `;
    
    // Create floating install button
    const floatingButton = document.createElement('button');
    floatingButton.className = 'pwa-install-floating';
    floatingButton.innerHTML = '➕ Install App';
    floatingButton.setAttribute('aria-label', 'Install Aion Visualization app');
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      .pwa-install-banner {
        position: fixed;
        bottom: -100%;
        left: 0;
        right: 0;
        background: var(--grey-800, #141414);
        border-top: 1px solid var(--grey-700, #1F1F1F);
        padding: 1rem;
        transition: bottom 0.3s ease;
        z-index: 1000;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
      }
      
      .pwa-install-banner.show {
        bottom: 0;
      }
      
      .pwa-install-content {
        max-width: 800px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      
      .pwa-install-icon {
        font-size: 2.5rem;
        flex-shrink: 0;
      }
      
      .pwa-install-text {
        flex: 1;
        min-width: 200px;
      }
      
      .pwa-install-text h3 {
        font-size: 1.125rem;
        margin-bottom: 0.25rem;
        color: var(--grey-050, #F0F0F0);
      }
      
      .pwa-install-text p {
        font-size: 0.875rem;
        color: var(--grey-300, #707070);
      }
      
      .pwa-install-actions {
        display: flex;
        gap: 0.5rem;
        flex-shrink: 0;
      }
      
      .pwa-install-button,
      .pwa-install-dismiss {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.3s ease;
        font-size: 0.875rem;
      }
      
      .pwa-install-button {
        background: var(--accent, #FFD700);
        color: var(--grey-900, #0A0A0A);
      }
      
      .pwa-install-dismiss {
        background: transparent;
        color: var(--grey-300, #707070);
        border: 1px solid var(--grey-600, #2A2A2A);
      }
      
      .pwa-install-button:hover,
      .pwa-install-dismiss:hover {
        opacity: 0.8;
      }
      
      .pwa-install-floating {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--accent, #FFD700);
        color: var(--grey-900, #0A0A0A);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 2rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
        transition: all 0.3s ease;
        z-index: 999;
        display: none;
      }
      
      .pwa-install-floating.show {
        display: block;
        animation: slideIn 0.3s ease;
      }
      
      .pwa-install-floating:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(255, 215, 0, 0.4);
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @media (max-width: 640px) {
        .pwa-install-content {
          text-align: center;
          justify-content: center;
        }
        
        .pwa-install-actions {
          width: 100%;
          justify-content: center;
        }
        
        .pwa-install-floating {
          bottom: 5rem;
          right: 1rem;
        }
      }
      
      /* iOS specific styles */
      @supports (-webkit-touch-callout: none) {
        .pwa-install-banner {
          padding-bottom: env(safe-area-inset-bottom);
        }
      }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(banner);
    document.body.appendChild(floatingButton);
    
    this.banner = banner;
    this.floatingButton = floatingButton;
  }

  setupEventListeners() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('[PWA] Install prompt captured');
      
      // Show install UI after delay
      setTimeout(() => this.showInstallPrompt(), this.options.promptDelay);
    });

    // Install button click
    document.getElementById('pwa-install-yes').addEventListener('click', () => {
      this.installApp();
    });

    // Dismiss button click
    document.getElementById('pwa-install-no').addEventListener('click', () => {
      this.dismissPrompt();
    });

    // Floating button click
    this.floatingButton.addEventListener('click', () => {
      this.installApp();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.hideInstallUI();
      this.trackEvent('pwa_installed');
    });

    // Listen for iOS
    if (this.isIOS() && !this.isInStandaloneMode()) {
      this.setupIOSPrompt();
    }
  }

  showInstallPrompt() {
    // Only show on specified pages
    if (!this.shouldShowOnCurrentPage()) {
      return;
    }

    if (this.deferredPrompt) {
      this.banner.classList.add('show');
      this.trackEvent('pwa_prompt_shown');
    } else if (this.isIOS() && !this.isInStandaloneMode()) {
      // Show iOS-specific install instructions
      this.showIOSPrompt();
    }
  }

  async installApp() {
    if (!this.deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return;
    }

    // Hide banner
    this.banner.classList.remove('show');

    // Show the install prompt
    this.deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`[PWA] User response: ${outcome}`);

    if (outcome === 'accepted') {
      this.trackEvent('pwa_prompt_accepted');
    } else {
      this.trackEvent('pwa_prompt_dismissed');
      // Show floating button for future install
      setTimeout(() => {
        this.floatingButton.classList.add('show');
      }, 5000);
    }

    // Clear the deferredPrompt
    this.deferredPrompt = null;
  }

  dismissPrompt() {
    this.banner.classList.remove('show');
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    this.trackEvent('pwa_prompt_dismissed');
    
    // Show floating button after dismissal
    setTimeout(() => {
      this.floatingButton.classList.add('show');
    }, 5000);
  }

  hideInstallUI() {
    this.banner.classList.remove('show');
    this.floatingButton.classList.remove('show');
  }

  // Utility methods
  isInstalled() {
    // Check if app is already installed
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  }

  wasRecentlyDismissed() {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (!dismissed) return false;
    
    const dismissedTime = parseInt(dismissed, 10);
    return Date.now() - dismissedTime < this.options.dismissDuration;
  }

  shouldShowOnCurrentPage() {
    const currentPath = window.location.pathname;
    return this.options.showOnPages.some(page => 
      currentPath === page || currentPath.endsWith(page)
    );
  }

  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  isInStandaloneMode() {
    return window.navigator.standalone || 
           window.matchMedia('(display-mode: standalone)').matches;
  }

  setupIOSPrompt() {
    // Create iOS-specific install instructions
    const iosPrompt = document.createElement('div');
    iosPrompt.className = 'pwa-ios-prompt';
    iosPrompt.innerHTML = `
      <div class="pwa-ios-content">
        <h3>Install Aion on iOS</h3>
        <ol>
          <li>Tap the share button <span class="ios-share-icon">⬆️</span></li>
          <li>Scroll down and tap "Add to Home Screen"</li>
          <li>Tap "Add" to install</li>
        </ol>
        <button class="pwa-ios-dismiss">Got it</button>
      </div>
    `;
    
    const iosStyles = document.createElement('style');
    iosStyles.textContent = `
      .pwa-ios-prompt {
        position: fixed;
        bottom: -100%;
        left: 1rem;
        right: 1rem;
        background: var(--grey-800, #141414);
        border-radius: 1rem;
        padding: 1.5rem;
        transition: bottom 0.3s ease;
        z-index: 1001;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      }
      
      .pwa-ios-prompt.show {
        bottom: 1rem;
      }
      
      .pwa-ios-content h3 {
        margin-bottom: 1rem;
        color: var(--grey-050, #F0F0F0);
      }
      
      .pwa-ios-content ol {
        margin-left: 1.5rem;
        margin-bottom: 1rem;
        color: var(--grey-300, #707070);
      }
      
      .pwa-ios-content li {
        margin-bottom: 0.5rem;
      }
      
      .ios-share-icon {
        display: inline-block;
        background: var(--grey-600, #2A2A2A);
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 1rem;
      }
      
      .pwa-ios-dismiss {
        width: 100%;
        padding: 0.75rem;
        background: var(--accent, #FFD700);
        color: var(--grey-900, #0A0A0A);
        border: none;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
      }
    `;
    
    document.head.appendChild(iosStyles);
    document.body.appendChild(iosPrompt);
    
    this.iosPrompt = iosPrompt;
    
    document.querySelector('.pwa-ios-dismiss').addEventListener('click', () => {
      this.iosPrompt.classList.remove('show');
      localStorage.setItem('pwa-ios-dismissed', 'true');
    });
  }

  showIOSPrompt() {
    if (localStorage.getItem('pwa-ios-dismissed') === 'true') {
      return;
    }
    
    setTimeout(() => {
      this.iosPrompt.classList.add('show');
      this.trackEvent('pwa_ios_prompt_shown');
    }, this.options.promptDelay);
  }

  checkInstallability() {
    // Check various install criteria
    const criteria = {
      https: location.protocol === 'https:',
      serviceWorker: 'serviceWorker' in navigator,
      manifest: document.querySelector('link[rel="manifest"]'),
      standalone: !this.isInStandaloneMode()
    };
    
    const installable = Object.values(criteria).every(Boolean);
    console.log('[PWA] Installability check:', criteria, 'Installable:', installable);
    
    return installable;
  }

  trackEvent(eventName, eventData = {}) {
    if (window.analytics) {
      window.analytics.event('pwa', eventName, null, eventData);
    }
  }

  // Public API
  promptInstall() {
    if (this.deferredPrompt) {
      this.installApp();
    } else if (this.isIOS() && !this.isInStandaloneMode()) {
      this.showIOSPrompt();
    } else {
      console.log('[PWA] No install prompt available');
    }
  }

  getInstallState() {
    return {
      installed: this.isInstalled(),
      installable: !!this.deferredPrompt,
      ios: this.isIOS(),
      standalone: this.isInStandaloneMode()
    };
  }
}

// Auto-initialize
export const pwaInstaller = new PWAInstallPrompt({
  promptDelay: 30000, // 30 seconds
  dismissDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
  showOnPages: ['/', '/chapters/', '/showcase.html']
});

export default pwaInstaller;