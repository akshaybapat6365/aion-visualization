/**
 * Keyboard Navigation System
 * 
 * Comprehensive keyboard shortcuts for navigating through Jung's Aion.
 * Provides direct chapter access (1-14), navigation controls, and
 * accessibility features for power users and accessibility needs.
 * 
 * Premium Design System Component
 */

class KeyboardNavigation {
  constructor(options = {}) {
    this.options = {
      // Enable/disable features
      enableChapterShortcuts: options.enableChapterShortcuts !== false,
      enableNavigationKeys: options.enableNavigationKeys !== false,
      enableConstellationKeys: options.enableConstellationKeys !== false,
      
      // Modifier keys
      requireModifier: options.requireModifier || false,
      modifierKey: options.modifierKey || 'ctrl', // 'ctrl', 'alt', 'shift'
      
      // Callbacks
      onChapterChange: options.onChapterChange || null,
      onConstellationToggle: options.onConstellationToggle || null,
      onOverviewToggle: options.onOverviewToggle || null,
      
      // Custom shortcuts
      customShortcuts: options.customShortcuts || {},
      
      ...options
    };
    
    this.currentChapter = 1;
    this.totalChapters = 14;
    this.isConstellationVisible = false;
    this.isOverviewVisible = false;
    this.shortcuts = new Map();
    this.activeElement = null;
    
    this.init();
  }
  
  init() {
    this.setupDefaultShortcuts();
    this.setupCustomShortcuts();
    this.bindEvents();
    this.createHelpOverlay();
  }
  
  setupDefaultShortcuts() {
    // Chapter navigation (1-14)
    if (this.options.enableChapterShortcuts) {
      for (let i = 1; i <= this.totalChapters; i++) {
        this.addShortcut(i.toString(), {
          description: `Go to Chapter ${i}`,
          action: () => this.navigateToChapter(i),
          category: 'chapters'
        });
      }
    }
    
    // Navigation keys
    if (this.options.enableNavigationKeys) {
      this.addShortcut('ArrowLeft', {
        description: 'Previous chapter',
        action: () => this.previousChapter(),
        category: 'navigation'
      });
      
      this.addShortcut('ArrowRight', {
        description: 'Next chapter',
        action: () => this.nextChapter(),
        category: 'navigation'
      });
      
      this.addShortcut('Home', {
        description: 'First chapter',
        action: () => this.navigateToChapter(1),
        category: 'navigation'
      });
      
      this.addShortcut('End', {
        description: 'Last chapter',
        action: () => this.navigateToChapter(this.totalChapters),
        category: 'navigation'
      });
    }
    
    // Constellation and overview
    if (this.options.enableConstellationKeys) {
      this.addShortcut('c', {
        description: 'Toggle concept constellation',
        action: () => this.toggleConstellation(),
        category: 'views'
      });
      
      this.addShortcut('o', {
        description: 'Toggle chapter overview',
        action: () => this.toggleOverview(),
        category: 'views'
      });
      
      this.addShortcut('Escape', {
        description: 'Return to main view',
        action: () => this.returnToMain(),
        category: 'views'
      });
    }
    
    // Utility shortcuts
    this.addShortcut('/', {
      description: 'Show keyboard shortcuts help',
      action: () => this.toggleHelp(),
      category: 'utility'
    });
    
    this.addShortcut('?', {
      description: 'Show keyboard shortcuts help',
      action: () => this.toggleHelp(),
      category: 'utility'
    });
    
    // Focus management
    this.addShortcut('Tab', {
      description: 'Navigate focusable elements',
      action: (e) => this.handleTabNavigation(e),
      category: 'accessibility',
      preventDefault: false
    });
    
    this.addShortcut('Enter', {
      description: 'Activate focused element',
      action: (e) => this.activateFocusedElement(e),
      category: 'accessibility'
    });
    
    this.addShortcut(' ', {
      description: 'Activate focused element',
      action: (e) => this.activateFocusedElement(e),
      category: 'accessibility'
    });
  }
  
  setupCustomShortcuts() {
    Object.entries(this.options.customShortcuts).forEach(([key, config]) => {
      this.addShortcut(key, config);
    });
  }
  
  addShortcut(key, config) {
    this.shortcuts.set(key.toLowerCase(), {
      description: config.description || '',
      action: config.action,
      category: config.category || 'custom',
      preventDefault: config.preventDefault !== false,
      requireModifier: config.requireModifier || false
    });
  }
  
  removeShortcut(key) {
    this.shortcuts.delete(key.toLowerCase());
  }
  
  bindEvents() {
    document.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });
    
    // Focus management
    document.addEventListener('focusin', (e) => {
      this.activeElement = e.target;
    });
    
    // Prevent default behavior for certain keys when not in input
    document.addEventListener('keydown', (e) => {
      if (this.shouldPreventDefault(e)) {
        e.preventDefault();
      }
    });
  }
  
  handleKeydown(e) {
    // Don't handle shortcuts when typing in inputs
    if (this.isTypingInInput(e.target)) {
      return;
    }
    
    const key = this.getKeyString(e);
    const shortcut = this.shortcuts.get(key);
    
    if (!shortcut) {
      return;
    }
    
    // Check modifier requirements
    if (this.options.requireModifier || shortcut.requireModifier) {
      if (!this.hasRequiredModifier(e)) {
        return;
      }
    }
    
    // Prevent default if specified
    if (shortcut.preventDefault) {
      e.preventDefault();
    }
    
    // Execute shortcut action
    try {
      shortcut.action(e);
      this.dispatchShortcutEvent(key, shortcut);
    } catch (error) {
      console.error(`Error executing shortcut "${key}":`, error);
    }
  }
  
  getKeyString(e) {
    // Handle special cases for better key mapping
    let key = e.key.toLowerCase();
    
    // Map special keys
    const keyMap = {
      'arrowleft': 'ArrowLeft',
      'arrowright': 'ArrowRight',
      'arrowup': 'ArrowUp',
      'arrowdown': 'ArrowDown',
      'escape': 'Escape',
      'enter': 'Enter',
      'tab': 'Tab',
      'home': 'Home',
      'end': 'End',
      ' ': ' ' // Space key
    };
    
    return keyMap[key] || key;
  }
  
  hasRequiredModifier(e) {
    switch (this.options.modifierKey) {
      case 'ctrl':
        return e.ctrlKey || e.metaKey; // Meta key for Mac
      case 'alt':
        return e.altKey;
      case 'shift':
        return e.shiftKey;
      default:
        return false;
    }
  }
  
  isTypingInInput(element) {
    const inputTypes = ['input', 'textarea', 'select'];
    const isContentEditable = element.contentEditable === 'true';
    const isInput = inputTypes.includes(element.tagName.toLowerCase());
    
    return isInput || isContentEditable;
  }
  
  shouldPreventDefault(e) {
    // Prevent default for navigation keys when not in input
    const navigationKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End', ' '];
    return navigationKeys.includes(e.key) && !this.isTypingInInput(e.target);
  }
  
  // Navigation methods
  navigateToChapter(chapter) {
    if (chapter < 1 || chapter > this.totalChapters) {
      return;
    }
    
    this.currentChapter = chapter;
    
    if (this.options.onChapterChange) {
      this.options.onChapterChange(chapter);
    }
    
    this.announceToScreenReader(`Navigating to chapter ${chapter}`);
  }
  
  previousChapter() {
    const prevChapter = Math.max(1, this.currentChapter - 1);
    this.navigateToChapter(prevChapter);
  }
  
  nextChapter() {
    const nextChapter = Math.min(this.totalChapters, this.currentChapter + 1);
    this.navigateToChapter(nextChapter);
  }
  
  toggleConstellation() {
    this.isConstellationVisible = !this.isConstellationVisible;
    
    if (this.options.onConstellationToggle) {
      this.options.onConstellationToggle(this.isConstellationVisible);
    }
    
    this.announceToScreenReader(
      this.isConstellationVisible ? 'Concept constellation opened' : 'Concept constellation closed'
    );
  }
  
  toggleOverview() {
    this.isOverviewVisible = !this.isOverviewVisible;
    
    if (this.options.onOverviewToggle) {
      this.options.onOverviewToggle(this.isOverviewVisible);
    }
    
    this.announceToScreenReader(
      this.isOverviewVisible ? 'Chapter overview opened' : 'Chapter overview closed'
    );
  }
  
  returnToMain() {
    this.isConstellationVisible = false;
    this.isOverviewVisible = false;
    
    if (this.options.onConstellationToggle) {
      this.options.onConstellationToggle(false);
    }
    
    if (this.options.onOverviewToggle) {
      this.options.onOverviewToggle(false);
    }
    
    this.announceToScreenReader('Returned to main view');
  }
  
  // Focus management
  handleTabNavigation(e) {
    // Custom tab handling for better UX
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    
    if (e.shiftKey) {
      // Shift+Tab - previous element
      const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
      focusableElements[prevIndex]?.focus();
    } else {
      // Tab - next element
      const nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
      focusableElements[nextIndex]?.focus();
    }
  }
  
  activateFocusedElement(e) {
    if (this.activeElement) {
      // Simulate click on focused element
      this.activeElement.click();
    }
  }
  
  getFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[data-focusable]'
    ].join(', ');
    
    return Array.from(document.querySelectorAll(selector))
      .filter(el => el.offsetParent !== null); // Only visible elements
  }
  
  // Help system
  createHelpOverlay() {
    this.helpOverlay = document.createElement('div');
    this.helpOverlay.className = 'keyboard-help-overlay';
    this.helpOverlay.setAttribute('role', 'dialog');
    this.helpOverlay.setAttribute('aria-labelledby', 'keyboard-help-title');
    this.helpOverlay.innerHTML = this.generateHelpContent();
    
    document.body.appendChild(this.helpOverlay);
    
    // Close help with Escape
    this.helpOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideHelp();
      }
    });
  }
  
  generateHelpContent() {
    const categories = this.groupShortcutsByCategory();
    
    let content = `
      <div class="keyboard-help-content">
        <div class="keyboard-help-header">
          <h2 id="keyboard-help-title">Keyboard Shortcuts</h2>
          <button class="keyboard-help-close" aria-label="Close help">×</button>
        </div>
        <div class="keyboard-help-body">
    `;
    
    Object.entries(categories).forEach(([category, shortcuts]) => {
      content += `
        <div class="keyboard-help-section">
          <h3>${this.getCategoryTitle(category)}</h3>
          <dl class="keyboard-help-list">
      `;
      
      shortcuts.forEach(([key, shortcut]) => {
        content += `
          <div class="keyboard-help-item">
            <dt class="keyboard-help-key">${this.formatKeyDisplay(key)}</dt>
            <dd class="keyboard-help-description">${shortcut.description}</dd>
          </div>
        `;
      });
      
      content += '</dl></div>';
    });
    
    content += '</div></div>';
    
    return content;
  }
  
  groupShortcutsByCategory() {
    const categories = {};
    
    this.shortcuts.forEach((shortcut, key) => {
      const category = shortcut.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push([key, shortcut]);
    });
    
    return categories;
  }
  
  getCategoryTitle(category) {
    const titles = {
      chapters: 'Chapter Navigation',
      navigation: 'Navigation',
      views: 'Views',
      utility: 'Utility',
      accessibility: 'Accessibility',
      custom: 'Custom'
    };
    
    return titles[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }
  
  formatKeyDisplay(key) {
    const keyMap = {
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'Escape': 'Esc',
      'Enter': '↵',
      'Tab': '⇥',
      ' ': 'Space'
    };
    
    const displayKey = keyMap[key] || key.toUpperCase();
    
    if (this.options.requireModifier) {
      const modifier = this.options.modifierKey === 'ctrl' ? 'Ctrl' : 
                     this.options.modifierKey === 'alt' ? 'Alt' : 'Shift';
      return `${modifier} + ${displayKey}`;
    }
    
    return displayKey;
  }
  
  toggleHelp() {
    if (this.helpOverlay.style.display === 'flex') {
      this.hideHelp();
    } else {
      this.showHelp();
    }
  }
  
  showHelp() {
    this.helpOverlay.style.display = 'flex';
    this.helpOverlay.querySelector('.keyboard-help-close').focus();
    
    // Bind close button
    this.helpOverlay.querySelector('.keyboard-help-close').onclick = () => {
      this.hideHelp();
    };
  }
  
  hideHelp() {
    this.helpOverlay.style.display = 'none';
  }
  
  // Accessibility
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
  
  dispatchShortcutEvent(key, shortcut) {
    const event = new CustomEvent('keyboard:shortcut', {
      detail: { key, shortcut }
    });
    document.dispatchEvent(event);
  }
  
  // Public API
  setCurrentChapter(chapter) {
    this.currentChapter = chapter;
  }
  
  getCurrentChapter() {
    return this.currentChapter;
  }
  
  addCustomShortcut(key, config) {
    this.addShortcut(key, config);
  }
  
  removeCustomShortcut(key) {
    this.removeShortcut(key);
  }
  
  destroy() {
    if (this.helpOverlay) {
      this.helpOverlay.remove();
    }
    
    // Remove event listeners would need to be stored as references
    // This is a simplified cleanup
  }
}

// Auto-initialize
if (typeof module === 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.keyboardNavigation = new KeyboardNavigation();
  });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeyboardNavigation;
}