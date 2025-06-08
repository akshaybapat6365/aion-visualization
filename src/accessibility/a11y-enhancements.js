/**
 * Accessibility Enhancements for Aion Visualization
 * Implements WCAG 2.1 AAA compliance features
 */

export class AccessibilityEnhancements {
  constructor(options = {}) {
    this.options = {
      enableKeyboardShortcuts: true,
      enableScreenReaderAnnouncements: true,
      enableFocusIndicators: true,
      enableSkipLinks: true,
      enableHighContrast: true,
      enableReducedMotion: true,
      enableTextSpacing: true,
      enableVoiceControl: false, // Experimental
      ...options
    };
    
    this.init();
  }

  init() {
    this.injectStyles();
    this.setupSkipLinks();
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupFocusManagement();
    this.setupPreferencesPanel();
    this.setupHighContrastMode();
    this.setupReducedMotion();
    this.setupTextSpacing();
    
    if (this.options.enableVoiceControl) {
      this.setupVoiceControl();
    }
    
    // Announce to screen readers
    this.announce('Accessibility features loaded');
  }

  injectStyles() {
    const styles = document.createElement('style');
    styles.id = 'a11y-styles';
    styles.textContent = `
      /* Skip Links */
      .skip-links {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--accent, #FFD700);
        color: var(--grey-900, #0A0A0A);
        padding: 0.5rem 1rem;
        text-decoration: none;
        border-radius: 0 0 0.5rem 0;
        z-index: 10000;
        font-weight: 600;
      }
      
      .skip-links:focus {
        top: 0;
      }
      
      /* Enhanced Focus Indicators */
      *:focus {
        outline: 3px solid var(--accent, #FFD700) !important;
        outline-offset: 2px !important;
      }
      
      /* For dark backgrounds */
      .dark-bg *:focus {
        outline-color: #FFFFFF !important;
        box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.5);
      }
      
      /* Screen Reader Only Content */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      
      .sr-only-focusable:active,
      .sr-only-focusable:focus {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }
      
      /* High Contrast Mode */
      @media (prefers-contrast: high), .high-contrast {
        * {
          border-color: currentColor !important;
        }
        
        a {
          text-decoration: underline !important;
        }
        
        button, .button {
          border: 2px solid currentColor !important;
        }
        
        :focus {
          outline-width: 4px !important;
        }
      }
      
      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
      
      /* Text Spacing */
      .text-spacing-enhanced {
        line-height: 1.5 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }
      
      .text-spacing-enhanced p {
        margin-bottom: 2em !important;
      }
      
      /* Accessibility Panel */
      .a11y-panel {
        position: fixed;
        right: -320px;
        top: 50%;
        transform: translateY(-50%);
        width: 300px;
        background: var(--grey-800, #141414);
        border: 1px solid var(--grey-700, #1F1F1F);
        border-radius: 0.5rem 0 0 0.5rem;
        padding: 1.5rem;
        transition: right 0.3s ease;
        z-index: 9999;
        box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3);
      }
      
      .a11y-panel.open {
        right: 0;
      }
      
      .a11y-panel-toggle {
        position: absolute;
        left: -40px;
        top: 50%;
        transform: translateY(-50%) rotate(-90deg);
        background: var(--grey-800, #141414);
        border: 1px solid var(--grey-700, #1F1F1F);
        border-radius: 0.5rem 0.5rem 0 0;
        padding: 0.5rem 1rem;
        cursor: pointer;
        font-size: 0.875rem;
      }
      
      .a11y-option {
        margin-bottom: 1rem;
      }
      
      .a11y-option label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
      }
      
      .a11y-option input[type="checkbox"] {
        width: 1.25rem;
        height: 1.25rem;
        cursor: pointer;
      }
      
      /* Keyboard Navigation Indicator */
      .keyboard-nav-active *:focus {
        outline-style: dashed !important;
      }
      
      /* Voice Control Indicator */
      .voice-control-active {
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: var(--error, #F44336);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 2rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 10000;
        animation: pulse 2s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
      
      /* Reading Guide */
      .reading-guide {
        position: fixed;
        left: 0;
        right: 0;
        height: 1.5em;
        background: rgba(255, 215, 0, 0.2);
        pointer-events: none;
        z-index: 9998;
        display: none;
      }
      
      .reading-guide-active .reading-guide {
        display: block;
      }
    `;
    
    document.head.appendChild(styles);
  }

  setupSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-links">Skip to main content</a>
      <a href="#nav" class="skip-links" style="left: 150px;">Skip to navigation</a>
    `;
    document.body.insertBefore(skipLinks, document.body.firstChild);
    
    // Ensure main content has ID
    const main = document.querySelector('main');
    if (main && !main.id) {
      main.id = 'main-content';
    }
  }

  setupKeyboardNavigation() {
    if (!this.options.enableKeyboardShortcuts) return;
    
    // Track if keyboard is being used
    let keyboardUser = false;
    
    document.addEventListener('keydown', (e) => {
      keyboardUser = true;
      document.body.classList.add('keyboard-nav-active');
      
      // Keyboard shortcuts
      if (e.altKey) {
        switch(e.key) {
          case 'h':
          case 'H':
            e.preventDefault();
            window.location.href = '/';
            this.announce('Navigating to home');
            break;
          case 'c':
          case 'C':
            e.preventDefault();
            window.location.href = '/chapters/';
            this.announce('Navigating to chapters');
            break;
          case 'a':
          case 'A':
            e.preventDefault();
            this.toggleAccessibilityPanel();
            break;
          case '/':
            e.preventDefault();
            this.focusSearch();
            break;
          case '?':
            e.preventDefault();
            this.showKeyboardHelp();
            break;
        }
      }
      
      // Chapter navigation (1-9 keys)
      if (!e.altKey && !e.ctrlKey && !e.metaKey && /^[1-9]$/.test(e.key)) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          this.navigateToChapter(parseInt(e.key));
        }
      }
      
      // Arrow key navigation for chapter cards
      if (e.key.startsWith('Arrow')) {
        this.handleArrowNavigation(e);
      }
    });
    
    document.addEventListener('mousedown', () => {
      keyboardUser = false;
      document.body.classList.remove('keyboard-nav-active');
    });
  }

  setupScreenReaderSupport() {
    // Create live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'a11y-announcements';
    document.body.appendChild(liveRegion);
    
    // Add screen reader descriptions to interactive elements
    this.enhanceInteractiveElements();
    
    // Add page structure landmarks
    this.addLandmarks();
  }

  enhanceInteractiveElements() {
    // Enhance buttons
    document.querySelectorAll('button:not([aria-label])').forEach(button => {
      if (!button.textContent.trim()) {
        button.setAttribute('aria-label', 'Button');
      }
    });
    
    // Enhance links
    document.querySelectorAll('a[href^="/chapters/"]').forEach(link => {
      const text = link.textContent.trim();
      if (!link.getAttribute('aria-label')) {
        link.setAttribute('aria-label', `Navigate to ${text}`);
      }
    });
    
    // Enhance images
    document.querySelectorAll('img:not([alt])').forEach(img => {
      img.setAttribute('alt', '');
    });
    
    // Add descriptions to visualizations
    document.querySelectorAll('[data-visualization]').forEach(viz => {
      if (!viz.getAttribute('aria-label')) {
        viz.setAttribute('aria-label', 'Interactive visualization. Use arrow keys to navigate.');
        viz.setAttribute('role', 'application');
      }
    });
  }

  addLandmarks() {
    // Ensure proper landmarks
    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Main navigation');
    }
    
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
    }
    
    const footer = document.querySelector('footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
    }
    
    // Add banner role to header
    const header = document.querySelector('header');
    if (header && !header.getAttribute('role')) {
      header.setAttribute('role', 'banner');
    }
  }

  setupFocusManagement() {
    // Trap focus in modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"]:not([hidden])');
        if (modal) {
          this.trapFocus(e, modal);
        }
      }
    });
    
    // Restore focus after modal closes
    let previousFocus = null;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
          const target = mutation.target;
          if (target.getAttribute('role') === 'dialog') {
            if (target.hidden && previousFocus) {
              previousFocus.focus();
              previousFocus = null;
            } else if (!target.hidden) {
              previousFocus = document.activeElement;
              this.focusFirstElement(target);
            }
          }
        }
      });
    });
    
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['hidden']
    });
  }

  setupPreferencesPanel() {
    const panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.innerHTML = `
      <button class="a11y-panel-toggle" aria-label="Accessibility preferences">
        A11y
      </button>
      <h2 style="margin-top: 0; margin-bottom: 1.5rem;">Accessibility Options</h2>
      
      <div class="a11y-option">
        <label>
          <input type="checkbox" id="a11y-high-contrast">
          <span>High Contrast Mode</span>
        </label>
      </div>
      
      <div class="a11y-option">
        <label>
          <input type="checkbox" id="a11y-text-spacing">
          <span>Enhanced Text Spacing</span>
        </label>
      </div>
      
      <div class="a11y-option">
        <label>
          <input type="checkbox" id="a11y-reading-guide">
          <span>Reading Guide</span>
        </label>
      </div>
      
      <div class="a11y-option">
        <label>
          <input type="checkbox" id="a11y-focus-visible">
          <span>Always Show Focus</span>
        </label>
      </div>
      
      <div class="a11y-option">
        <label>
          <input type="checkbox" id="a11y-reduce-motion" ${this.prefersReducedMotion() ? 'checked' : ''}>
          <span>Reduce Motion</span>
        </label>
      </div>
      
      <div class="a11y-option">
        <label>
          <input type="checkbox" id="a11y-voice-control">
          <span>Voice Control (Beta)</span>
        </label>
      </div>
      
      <button style="width: 100%; margin-top: 1rem;" onclick="window.a11y.resetPreferences()">
        Reset to Defaults
      </button>
    `;
    
    document.body.appendChild(panel);
    
    // Toggle panel
    panel.querySelector('.a11y-panel-toggle').addEventListener('click', () => {
      this.toggleAccessibilityPanel();
    });
    
    // Load saved preferences
    this.loadPreferences();
    
    // Setup preference handlers
    this.setupPreferenceHandlers();
  }

  setupPreferenceHandlers() {
    // High contrast
    document.getElementById('a11y-high-contrast').addEventListener('change', (e) => {
      document.body.classList.toggle('high-contrast', e.target.checked);
      this.savePreference('highContrast', e.target.checked);
      this.announce(e.target.checked ? 'High contrast mode enabled' : 'High contrast mode disabled');
    });
    
    // Text spacing
    document.getElementById('a11y-text-spacing').addEventListener('change', (e) => {
      document.body.classList.toggle('text-spacing-enhanced', e.target.checked);
      this.savePreference('textSpacing', e.target.checked);
      this.announce(e.target.checked ? 'Enhanced text spacing enabled' : 'Enhanced text spacing disabled');
    });
    
    // Reading guide
    document.getElementById('a11y-reading-guide').addEventListener('change', (e) => {
      if (e.target.checked) {
        this.enableReadingGuide();
      } else {
        this.disableReadingGuide();
      }
      this.savePreference('readingGuide', e.target.checked);
    });
    
    // Always show focus
    document.getElementById('a11y-focus-visible').addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.style.setProperty('--focus-visible', 'always');
      } else {
        document.body.style.removeProperty('--focus-visible');
      }
      this.savePreference('alwaysShowFocus', e.target.checked);
    });
    
    // Reduce motion
    document.getElementById('a11y-reduce-motion').addEventListener('change', (e) => {
      this.setReducedMotion(e.target.checked);
      this.savePreference('reduceMotion', e.target.checked);
    });
    
    // Voice control
    document.getElementById('a11y-voice-control').addEventListener('change', (e) => {
      if (e.target.checked) {
        this.enableVoiceControl();
      } else {
        this.disableVoiceControl();
      }
      this.savePreference('voiceControl', e.target.checked);
    });
  }

  setupHighContrastMode() {
    // Check system preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      document.body.classList.add('high-contrast');
      document.getElementById('a11y-high-contrast').checked = true;
    }
  }

  setupReducedMotion() {
    // Check system preference
    if (this.prefersReducedMotion()) {
      this.setReducedMotion(true);
    }
  }

  setupTextSpacing() {
    // Allow users to adjust text spacing with keyboard
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          this.increaseTextSpacing();
        } else if (e.key === '-') {
          e.preventDefault();
          this.decreaseTextSpacing();
        }
      }
    });
  }

  setupVoiceControl() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    this.recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      this.processVoiceCommand(command);
    };
    
    this.recognition.onerror = (event) => {
      console.error('Voice control error:', event.error);
      this.announce('Voice command not recognized');
    };
  }

  // Utility methods
  announce(message) {
    if (!this.options.enableScreenReaderAnnouncements) return;
    
    const announcer = document.getElementById('a11y-announcements');
    if (announcer) {
      announcer.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }

  trapFocus(event, container) {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  focusFirstElement(container) {
    const focusable = container.querySelector(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      focusable.focus();
    }
  }

  handleArrowNavigation(event) {
    const focusableElements = Array.from(document.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    
    const currentIndex = focusableElements.indexOf(document.activeElement);
    if (currentIndex === -1) return;
    
    let newIndex;
    switch(event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = (currentIndex + 1) % focusableElements.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;
        break;
      default:
        return;
    }
    
    event.preventDefault();
    focusableElements[newIndex].focus();
  }

  navigateToChapter(number) {
    const chapterUrl = `/chapters/chapter${number}.html`;
    this.announce(`Navigating to chapter ${number}`);
    window.location.href = chapterUrl;
  }

  focusSearch() {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
    if (searchInput) {
      searchInput.focus();
      this.announce('Search focused');
    } else {
      this.announce('Search not available');
    }
  }

  showKeyboardHelp() {
    const helpText = `
      Keyboard Shortcuts:
      Alt + H: Go to Home
      Alt + C: Go to Chapters
      Alt + A: Open Accessibility Panel
      Alt + /: Focus Search
      1-9: Navigate to Chapter
      Arrow Keys: Navigate between elements
      Tab: Next focusable element
      Shift + Tab: Previous focusable element
    `;
    
    alert(helpText);
    this.announce('Keyboard shortcuts displayed');
  }

  toggleAccessibilityPanel() {
    const panel = document.querySelector('.a11y-panel');
    panel.classList.toggle('open');
    this.announce(panel.classList.contains('open') ? 
      'Accessibility panel opened' : 'Accessibility panel closed');
  }

  enableReadingGuide() {
    document.body.classList.add('reading-guide-active');
    
    const guide = document.createElement('div');
    guide.className = 'reading-guide';
    document.body.appendChild(guide);
    
    document.addEventListener('mousemove', this.updateReadingGuide);
    this.announce('Reading guide enabled');
  }

  disableReadingGuide() {
    document.body.classList.remove('reading-guide-active');
    const guide = document.querySelector('.reading-guide');
    if (guide) guide.remove();
    
    document.removeEventListener('mousemove', this.updateReadingGuide);
    this.announce('Reading guide disabled');
  }

  updateReadingGuide(e) {
    const guide = document.querySelector('.reading-guide');
    if (guide) {
      guide.style.top = `${e.clientY - 12}px`;
    }
  }

  setReducedMotion(enabled) {
    if (enabled) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      document.documentElement.style.setProperty('--transition-duration', '0.01ms');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
      document.documentElement.style.removeProperty('--transition-duration');
    }
    this.announce(enabled ? 'Motion reduced' : 'Motion restored');
  }

  increaseTextSpacing() {
    const current = parseFloat(getComputedStyle(document.body).letterSpacing) || 0;
    document.body.style.letterSpacing = `${current + 0.05}em`;
    this.announce('Text spacing increased');
  }

  decreaseTextSpacing() {
    const current = parseFloat(getComputedStyle(document.body).letterSpacing) || 0;
    document.body.style.letterSpacing = `${Math.max(0, current - 0.05)}em`;
    this.announce('Text spacing decreased');
  }

  enableVoiceControl() {
    if (!this.recognition) {
      this.setupVoiceControl();
    }
    
    if (this.recognition) {
      const indicator = document.createElement('div');
      indicator.className = 'voice-control-active';
      indicator.innerHTML = '🎤 Voice Control Active';
      document.body.appendChild(indicator);
      
      // Start listening
      document.addEventListener('keydown', this.voiceControlHandler = (e) => {
        if (e.key === ' ' && e.ctrlKey) {
          e.preventDefault();
          this.recognition.start();
          this.announce('Listening for voice command');
        }
      });
      
      this.announce('Voice control enabled. Press Ctrl+Space to give a command');
    }
  }

  disableVoiceControl() {
    const indicator = document.querySelector('.voice-control-active');
    if (indicator) indicator.remove();
    
    if (this.voiceControlHandler) {
      document.removeEventListener('keydown', this.voiceControlHandler);
    }
    
    this.announce('Voice control disabled');
  }

  processVoiceCommand(command) {
    console.log('Voice command:', command);
    
    // Navigation commands
    if (command.includes('home')) {
      window.location.href = '/';
    } else if (command.includes('chapter')) {
      const match = command.match(/chapter (\d+)/);
      if (match) {
        this.navigateToChapter(parseInt(match[1]));
      }
    } else if (command.includes('next')) {
      this.announce('Navigating to next page');
      // Implement next page logic
    } else if (command.includes('previous') || command.includes('back')) {
      window.history.back();
    } else if (command.includes('search')) {
      this.focusSearch();
    } else {
      this.announce('Command not recognized');
    }
  }

  // Preferences management
  savePreference(key, value) {
    const prefs = JSON.parse(localStorage.getItem('a11y-preferences') || '{}');
    prefs[key] = value;
    localStorage.setItem('a11y-preferences', JSON.stringify(prefs));
  }

  loadPreferences() {
    const prefs = JSON.parse(localStorage.getItem('a11y-preferences') || '{}');
    
    Object.entries(prefs).forEach(([key, value]) => {
      const checkbox = document.getElementById(`a11y-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
      if (checkbox) {
        checkbox.checked = value;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
  }

  resetPreferences() {
    localStorage.removeItem('a11y-preferences');
    location.reload();
  }

  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Public API
  getAccessibilityState() {
    return {
      highContrast: document.body.classList.contains('high-contrast'),
      textSpacing: document.body.classList.contains('text-spacing-enhanced'),
      readingGuide: document.body.classList.contains('reading-guide-active'),
      reducedMotion: this.prefersReducedMotion(),
      voiceControl: !!document.querySelector('.voice-control-active')
    };
  }
}

// Auto-initialize
export const a11y = new AccessibilityEnhancements();

// Make available globally
window.a11y = a11y;

export default a11y;