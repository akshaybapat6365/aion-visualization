// Advanced Keyboard Navigation and Shortcuts System
// Provides VS Code-style command palette and power user features

class KeyboardShortcuts {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      showHints: true,
      commandPaletteKey: '/',
      helpKey: '?',
      ...options
    };
        
    this.shortcuts = new Map();
    this.sequences = new Map();
    this.activeSequence = '';
    this.sequenceTimer = null;
    this.commandPalette = null;
    this.helpModal = null;
        
    this.init();
  }
    
  init() {
    this.setupDefaultShortcuts();
    this.setupEventListeners();
    this.injectStyles();
    this.setupCommandPalette();
    this.setupNavigationHints();
  }
    
  setupDefaultShortcuts() {
    // Basic navigation
    this.register(['/', 'ctrl+k'], () => this.openCommandPalette(), 'Open command palette');
    this.register(['?'], () => this.showShortcutHelp(), 'Show keyboard shortcuts');
    this.register(['Escape'], () => this.exitCurrentMode(), 'Exit current mode');
    this.register(['Space'], () => this.pauseResumeAnimation(), 'Pause/resume animations');
        
    // Visualization controls
    this.register(['r'], () => this.resetCurrentVisualization(), 'Reset visualization');
    this.register(['f'], () => this.toggleFullscreen(), 'Toggle fullscreen');
    this.register(['m'], () => this.toggleMute(), 'Toggle audio');
    this.register(['ctrl+plus', 'ctrl+equal'], () => this.zoomIn(), 'Zoom in');
    this.register(['ctrl+minus'], () => this.zoomOut(), 'Zoom out');
    this.register(['ctrl+0'], () => this.resetZoom(), 'Reset zoom');
        
    // Chapter navigation
    this.register(['ArrowLeft', 'h'], () => this.previousChapter(), 'Previous chapter');
    this.register(['ArrowRight', 'l'], () => this.nextChapter(), 'Next chapter');
    this.register(['Home', 'g g'], () => this.goHome(), 'Go to home');
    this.register(['End'], () => this.goToEnd(), 'Go to last chapter');
        
    // Quick chapter access
    for (let i = 1; i <= 9; i++) {
      this.register([i.toString()], () => this.jumpToChapter(i), `Jump to chapter ${i}`);
    }
        
    // Accessibility
    this.register(['alt+1'], () => this.focusMainContent(), 'Focus main content');
    this.register(['alt+2'], () => this.focusNavigation(), 'Focus navigation');
    this.register(['alt+3'], () => this.focusVisualization(), 'Focus visualization');
    this.register(['tab'], () => this.enhancedTabNavigation(), 'Enhanced tab navigation');
        
    // Advanced features
    this.register(['ctrl+shift+d'], () => this.toggleDebugMode(), 'Toggle debug mode');
    this.register(['ctrl+shift+p'], () => this.togglePerformanceMonitor(), 'Toggle performance monitor');
    this.register(['ctrl+shift+a'], () => this.toggleAccessibilityMode(), 'Toggle accessibility mode');
    this.register(['ctrl+shift+s'], () => this.saveProgress(), 'Save progress');
    this.register(['ctrl+shift+r'], () => this.resetProgress(), 'Reset progress');
        
    // Search and filter
    this.register(['ctrl+f'], () => this.openSearch(), 'Search content');
    this.register(['ctrl+shift+f'], () => this.openAdvancedSearch(), 'Advanced search');
        
    // Sequences (vim-style)
    this.registerSequence('g h', () => this.goHome(), 'Go home');
    this.registerSequence('g t', () => this.openTimeline(), 'Open timeline');
    this.registerSequence('g s', () => this.openSymbols(), 'Open symbols');
    this.registerSequence('g a', () => this.openAbout(), 'Open about');
  }
    
  setupEventListeners() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
    // Prevent default shortcuts that might interfere
    document.addEventListener('keydown', (e) => {
      if (this.hasRegisteredShortcut(e)) {
        e.preventDefault();
      }
    });
        
    // Handle sequence timeout
    document.addEventListener('keydown', () => {
      clearTimeout(this.sequenceTimer);
      this.sequenceTimer = setTimeout(() => {
        this.activeSequence = '';
        this.hideSequenceHint();
      }, 1000);
    });
  }
    
  handleKeyDown(e) {
    if (!this.options.enabled) return;
        
    // Don't handle shortcuts in input fields (unless specifically allowed)
    if (this.isInputFocused() && !this.isAllowedInInput(e)) {
      return;
    }
        
    const key = this.getKeyString(e);
    const sequence = this.activeSequence + (this.activeSequence ? ' ' : '') + key;
        
    // Check for sequence shortcuts first
    if (this.sequences.has(sequence)) {
      e.preventDefault();
      const action = this.sequences.get(sequence);
      action.callback();
      this.activeSequence = '';
      this.hideSequenceHint();
      return;
    }
        
    // Check for partial sequences
    const partialMatches = Array.from(this.sequences.keys()).filter(seq => 
      seq.startsWith(sequence));
        
    if (partialMatches.length > 0) {
      this.activeSequence = sequence;
      this.showSequenceHint(partialMatches);
      return;
    }
        
    // Check for direct shortcuts
    if (this.shortcuts.has(key)) {
      e.preventDefault();
      const action = this.shortcuts.get(key);
      action.callback();
      return;
    }
        
    // Reset sequence if no matches
    this.activeSequence = '';
    this.hideSequenceHint();
  }
    
  handleKeyUp(e) {
    // Handle key up events if needed
  }
    
  register(keys, callback, description = '') {
    if (typeof keys === 'string') {
      keys = [keys];
    }
        
    keys.forEach(key => {
      this.shortcuts.set(key, {
        callback,
        description,
        keys: keys
      });
    });
  }
    
  registerSequence(sequence, callback, description = '') {
    this.sequences.set(sequence, {
      callback,
      description,
      sequence
    });
  }
    
  getKeyString(e) {
    const parts = [];
        
    if (e.ctrlKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    if (e.metaKey) parts.push('cmd');
        
    let key = e.key;
        
    // Normalize key names
    const keyMap = {
      ' ': 'Space',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight',
      'Enter': 'Enter',
      'Escape': 'Escape',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      '+': 'plus',
      '=': 'equal',
      '-': 'minus'
    };
        
    key = keyMap[key] || key;
    parts.push(key);
        
    return parts.join('+');
  }
    
  hasRegisteredShortcut(e) {
    const key = this.getKeyString(e);
    return this.shortcuts.has(key) || 
               Array.from(this.sequences.keys()).some(seq => 
                 seq.split(' ').includes(key));
  }
    
  isInputFocused() {
    const active = document.activeElement;
    return active && (
      active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.contentEditable === 'true' ||
            active.isContentEditable
    );
  }
    
  isAllowedInInput(e) {
    // Allow certain shortcuts even in input fields
    const allowedKeys = ['Escape', 'Tab', 'F1', 'F2', 'F3', 'F4', 'F5'];
    return allowedKeys.includes(e.key) || 
               (e.ctrlKey && ['k', 'f'].includes(e.key));
  }
    
  // Command Palette
  setupCommandPalette() {
    this.commandPalette = document.createElement('div');
    this.commandPalette.className = 'command-palette';
    this.commandPalette.innerHTML = `
            <div class="command-palette-backdrop"></div>
            <div class="command-palette-content">
                <div class="command-search">
                    <input type="text" placeholder="Type a command..." class="command-input">
                </div>
                <div class="command-results"></div>
            </div>
        `;
        
    document.body.appendChild(this.commandPalette);
        
    // Setup command palette events
    const input = this.commandPalette.querySelector('.command-input');
    const results = this.commandPalette.querySelector('.command-results');
    const backdrop = this.commandPalette.querySelector('.command-palette-backdrop');
        
    input.addEventListener('input', (e) => {
      this.updateCommandResults(e.target.value);
    });
        
    input.addEventListener('keydown', (e) => {
      this.handleCommandPaletteKey(e);
    });
        
    backdrop.addEventListener('click', () => {
      this.closeCommandPalette();
    });
  }
    
  openCommandPalette() {
    this.commandPalette.classList.add('active');
    const input = this.commandPalette.querySelector('.command-input');
    input.focus();
    input.select();
    this.updateCommandResults('');
  }
    
  closeCommandPalette() {
    this.commandPalette.classList.remove('active');
    this.commandPalette.querySelector('.command-input').value = '';
  }
    
  updateCommandResults(query) {
    const results = this.commandPalette.querySelector('.command-results');
    const commands = this.getAllCommands();
        
    const filtered = commands.filter(cmd => 
      cmd.description.toLowerCase().includes(query.toLowerCase()) ||
            cmd.keys.some(key => key.toLowerCase().includes(query.toLowerCase()))
    );
        
    results.innerHTML = filtered.map((cmd, index) => `
            <div class="command-item ${index === 0 ? 'selected' : ''}" data-index="${index}">
                <div class="command-title">${cmd.description}</div>
                <div class="command-keys">${cmd.keys.join(', ')}</div>
            </div>
        `).join('');
        
    // Add click handlers
    results.querySelectorAll('.command-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.executeCommand(filtered[index]);
        this.closeCommandPalette();
      });
    });
  }
    
  handleCommandPaletteKey(e) {
    const results = this.commandPalette.querySelector('.command-results');
    const items = results.querySelectorAll('.command-item');
    const selected = results.querySelector('.selected');
        
    switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      const nextIndex = selected ? 
        Math.min(selected.dataset.index * 1 + 1, items.length - 1) : 0;
      this.selectCommandItem(nextIndex);
      break;
                
    case 'ArrowUp':
      e.preventDefault();
      const prevIndex = selected ? 
        Math.max(selected.dataset.index * 1 - 1, 0) : items.length - 1;
      this.selectCommandItem(prevIndex);
      break;
                
    case 'Enter':
      e.preventDefault();
      if (selected) {
        const commands = this.getFilteredCommands(e.target.value);
        this.executeCommand(commands[selected.dataset.index]);
        this.closeCommandPalette();
      }
      break;
                
    case 'Escape':
      e.preventDefault();
      this.closeCommandPalette();
      break;
    }
  }
    
  selectCommandItem(index) {
    const results = this.commandPalette.querySelector('.command-results');
    const items = results.querySelectorAll('.command-item');
        
    items.forEach(item => item.classList.remove('selected'));
    if (items[index]) {
      items[index].classList.add('selected');
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }
    
  getAllCommands() {
    const commands = [];
        
    // Add shortcuts
    this.shortcuts.forEach((action, key) => {
      commands.push({
        description: action.description,
        keys: action.keys || [key],
        callback: action.callback,
        type: 'shortcut'
      });
    });
        
    // Add sequences
    this.sequences.forEach((action, sequence) => {
      commands.push({
        description: action.description,
        keys: [sequence],
        callback: action.callback,
        type: 'sequence'
      });
    });
        
    // Add navigation commands
    commands.push(
      { description: 'Go to Home', keys: ['Home'], callback: () => this.goHome() },
      { description: 'Go to Chapters', keys: ['Chapters'], callback: () => this.goToChapters() },
      { description: 'Go to Timeline', keys: ['Timeline'], callback: () => this.openTimeline() },
      { description: 'Go to Symbols', keys: ['Symbols'], callback: () => this.openSymbols() }
    );
        
    return commands.filter(cmd => cmd.description);
  }
    
  getFilteredCommands(query) {
    return this.getAllCommands().filter(cmd => 
      cmd.description.toLowerCase().includes(query.toLowerCase()));
  }
    
  executeCommand(command) {
    if (command && command.callback) {
      command.callback();
    }
  }
    
  // Shortcut Actions Implementation
  exitCurrentMode() {
    // Close any open modals, palettes, etc.
    this.closeCommandPalette();
    if (this.helpModal) {
      this.closeShortcutHelp();
    }
        
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
        
    // Clear selections
    window.getSelection().removeAllRanges();
        
    // Blur active element
    if (document.activeElement) {
      document.activeElement.blur();
    }
  }
    
  pauseResumeAnimation() {
    const animations = document.querySelectorAll('[data-animation]');
    animations.forEach(el => {
      if (el.style.animationPlayState === 'paused') {
        el.style.animationPlayState = 'running';
      } else {
        el.style.animationPlayState = 'paused';
      }
    });
        
    // Also pause WebGL animations
    window.dispatchEvent(new CustomEvent('toggle-animation'));
  }
    
  resetCurrentVisualization() {
    window.dispatchEvent(new CustomEvent('reset-visualization'));
  }
    
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }
    
  toggleMute() {
    // Toggle audio if implemented
    window.dispatchEvent(new CustomEvent('toggle-audio'));
  }
    
  zoomIn() {
    document.body.style.zoom = (parseFloat(document.body.style.zoom || 1) + 0.1).toString();
  }
    
  zoomOut() {
    document.body.style.zoom = Math.max(0.5, parseFloat(document.body.style.zoom || 1) - 0.1).toString();
  }
    
  resetZoom() {
    document.body.style.zoom = '1';
  }
    
  previousChapter() {
    const currentChapter = this.getCurrentChapter();
    if (currentChapter > 1) {
      this.navigateToChapter(currentChapter - 1);
    }
  }
    
  nextChapter() {
    const currentChapter = this.getCurrentChapter();
    if (currentChapter < 14) {
      this.navigateToChapter(currentChapter + 1);
    }
  }
    
  jumpToChapter(number) {
    if (number >= 1 && number <= 14) {
      this.navigateToChapter(number);
    }
  }
    
  getCurrentChapter() {
    const path = window.location.pathname;
    const match = path.match(/chapter(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }
    
  navigateToChapter(number) {
    window.location.href = `chapter${number}.html`;
  }
    
  goHome() {
    window.location.href = 'index.html';
  }
    
  goToEnd() {
    this.navigateToChapter(14);
  }
    
  goToChapters() {
    window.location.href = 'chapters.html';
  }
    
  openTimeline() {
    window.location.href = 'timeline.html';
  }
    
  openSymbols() {
    window.location.href = 'symbols.html';
  }
    
  openAbout() {
    window.location.href = 'about.html';
  }
    
  // Accessibility features
  focusMainContent() {
    const main = document.querySelector('main, .main-content, .chapter-content');
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth' });
    }
  }
    
  focusNavigation() {
    const nav = document.querySelector('nav, .nav');
    if (nav) {
      const firstLink = nav.querySelector('a, button');
      if (firstLink) firstLink.focus();
    }
  }
    
  focusVisualization() {
    const viz = document.querySelector('.visualization-container, canvas');
    if (viz) {
      viz.focus();
      viz.scrollIntoView({ behavior: 'smooth' });
    }
  }
    
  enhancedTabNavigation() {
    // Enhanced tab navigation that skips hidden elements
    // This would be implemented with more sophisticated logic
  }
    
  // Advanced features
  toggleDebugMode() {
    document.body.classList.toggle('debug-mode');
    this.showNotification('Debug mode ' + 
            (document.body.classList.contains('debug-mode') ? 'enabled' : 'disabled'));
  }
    
  togglePerformanceMonitor() {
    window.dispatchEvent(new CustomEvent('toggle-performance-monitor'));
  }
    
  toggleAccessibilityMode() {
    document.body.classList.toggle('accessibility-mode');
    this.showNotification('Accessibility mode ' + 
            (document.body.classList.contains('accessibility-mode') ? 'enabled' : 'disabled'));
  }
    
  saveProgress() {
    const progress = {
      currentChapter: this.getCurrentChapter(),
      timestamp: Date.now(),
      completedSections: this.getCompletedSections()
    };
        
    localStorage.setItem('aion-progress', JSON.stringify(progress));
    this.showNotification('Progress saved');
  }
    
  resetProgress() {
    localStorage.removeItem('aion-progress');
    this.showNotification('Progress reset');
  }
    
  getCompletedSections() {
    // This would track which sections the user has completed
    return [];
  }
    
  openSearch() {
    // Open search interface
    this.showNotification('Search functionality coming soon');
  }
    
  openAdvancedSearch() {
    // Open advanced search
    this.showNotification('Advanced search functionality coming soon');
  }
    
  // Help system
  showShortcutHelp() {
    this.helpModal = document.createElement('div');
    this.helpModal.className = 'shortcuts-modal';
    this.helpModal.innerHTML = `
            <div class="shortcuts-modal-backdrop"></div>
            <div class="shortcuts-modal-content">
                <div class="shortcuts-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="shortcuts-close">×</button>
                </div>
                <div class="shortcuts-body">
                    ${this.generateShortcutsHTML()}
                </div>
            </div>
        `;
        
    document.body.appendChild(this.helpModal);
        
    // Event handlers
    this.helpModal.querySelector('.shortcuts-close').onclick = () => this.closeShortcutHelp();
    this.helpModal.querySelector('.shortcuts-modal-backdrop').onclick = () => this.closeShortcutHelp();
        
    // Focus trap
    this.trapFocus(this.helpModal);
  }
    
  closeShortcutHelp() {
    if (this.helpModal) {
      this.helpModal.remove();
      this.helpModal = null;
    }
  }
    
  generateShortcutsHTML() {
    const categories = {
      'Navigation': [
        { keys: ['/', 'Ctrl+K'], description: 'Open command palette' },
        { keys: ['?'], description: 'Show this help' },
        { keys: ['←', 'H'], description: 'Previous chapter' },
        { keys: ['→', 'L'], description: 'Next chapter' },
        { keys: ['1-9'], description: 'Jump to chapter' },
        { keys: ['Home', 'G G'], description: 'Go to home' }
      ],
      'Visualization': [
        { keys: ['Space'], description: 'Pause/resume animations' },
        { keys: ['R'], description: 'Reset visualization' },
        { keys: ['F'], description: 'Toggle fullscreen' },
        { keys: ['Ctrl++'], description: 'Zoom in' },
        { keys: ['Ctrl+-'], description: 'Zoom out' },
        { keys: ['Ctrl+0'], description: 'Reset zoom' }
      ],
      'Accessibility': [
        { keys: ['Alt+1'], description: 'Focus main content' },
        { keys: ['Alt+2'], description: 'Focus navigation' },
        { keys: ['Alt+3'], description: 'Focus visualization' },
        { keys: ['Escape'], description: 'Exit current mode' }
      ],
      'Advanced': [
        { keys: ['Ctrl+Shift+D'], description: 'Toggle debug mode' },
        { keys: ['Ctrl+Shift+A'], description: 'Accessibility mode' },
        { keys: ['Ctrl+Shift+S'], description: 'Save progress' },
        { keys: ['Ctrl+F'], description: 'Search content' }
      ]
    };
        
    return Object.entries(categories).map(([category, shortcuts]) => `
            <div class="shortcut-category">
                <h3>${category}</h3>
                <div class="shortcut-list">
                    ${shortcuts.map(shortcut => `
                        <div class="shortcut-item">
                            <div class="shortcut-keys">
                                ${shortcut.keys.map(key => `<kbd>${key}</kbd>`).join(' or ')}
                            </div>
                            <div class="shortcut-description">${shortcut.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
  }
    
  showSequenceHint(matches) {
    let hint = document.querySelector('.sequence-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'sequence-hint';
      document.body.appendChild(hint);
    }
        
    hint.innerHTML = `
            <div class="sequence-current">${this.activeSequence}</div>
            <div class="sequence-matches">
                ${matches.slice(0, 5).map(match => `
                    <div class="sequence-match">${match}</div>
                `).join('')}
            </div>
        `;
        
    hint.classList.add('visible');
  }
    
  hideSequenceHint() {
    const hint = document.querySelector('.sequence-hint');
    if (hint) {
      hint.classList.remove('visible');
    }
  }
    
  setupNavigationHints() {
    if (!this.options.showHints) return;
        
    // Add hint indicators to interactive elements
    document.querySelectorAll('[data-shortcut]').forEach(el => {
      const shortcut = el.dataset.shortcut;
      if (shortcut) {
        const hint = document.createElement('span');
        hint.className = 'keyboard-hint';
        hint.textContent = shortcut;
        el.appendChild(hint);
      }
    });
  }
    
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
        
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
        
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
        
    firstElement?.focus();
  }
    
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'keyboard-notification';
    notification.textContent = message;
        
    document.body.appendChild(notification);
        
    setTimeout(() => notification.classList.add('visible'), 10);
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
    
  injectStyles() {
    if (document.getElementById('keyboard-shortcuts-styles')) return;
        
    const styles = document.createElement('style');
    styles.id = 'keyboard-shortcuts-styles';
    styles.textContent = `
            .command-palette {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: none;
            }
            
            .command-palette.active {
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 100px;
            }
            
            .command-palette-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            .command-palette-content {
                position: relative;
                background: var(--bg-elevated, #1a1a1a);
                border: 1px solid var(--border-color, #333);
                border-radius: 12px;
                width: 600px;
                max-width: 90vw;
                max-height: 500px;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            }
            
            .command-search {
                padding: 20px;
                border-bottom: 1px solid var(--border-color, #333);
            }
            
            .command-input {
                width: 100%;
                background: transparent;
                border: none;
                outline: none;
                font-size: 18px;
                color: var(--text-primary, #fff);
                padding: 0;
            }
            
            .command-input::placeholder {
                color: var(--text-secondary, #999);
            }
            
            .command-results {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .command-item {
                padding: 12px 20px;
                cursor: pointer;
                border-bottom: 1px solid var(--border-color, #333);
                transition: background 0.2s;
            }
            
            .command-item:hover,
            .command-item.selected {
                background: var(--accent-primary, #ffd700);
                color: var(--bg-primary, #000);
            }
            
            .command-title {
                font-weight: 500;
                margin-bottom: 4px;
            }
            
            .command-keys {
                font-size: 12px;
                opacity: 0.7;
                font-family: var(--font-mono, monospace);
            }
            
            .shortcuts-modal {
                position: fixed;
                inset: 0;
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .shortcuts-modal-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }
            
            .shortcuts-modal-content {
                position: relative;
                background: var(--bg-primary, #000);
                border: 1px solid var(--border-color, #333);
                border-radius: 12px;
                width: 800px;
                max-width: 90vw;
                max-height: 80vh;
                overflow: hidden;
            }
            
            .shortcuts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px;
                border-bottom: 1px solid var(--border-color, #333);
            }
            
            .shortcuts-close {
                background: none;
                border: none;
                color: var(--text-secondary, #999);
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
            }
            
            .shortcuts-close:hover {
                background: var(--bg-secondary, #222);
            }
            
            .shortcuts-body {
                padding: 24px;
                overflow-y: auto;
                max-height: calc(80vh - 100px);
            }
            
            .shortcut-category {
                margin-bottom: 32px;
            }
            
            .shortcut-category h3 {
                margin-bottom: 16px;
                color: var(--accent-primary, #ffd700);
            }
            
            .shortcut-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid var(--border-color, #333);
            }
            
            .shortcut-item:last-child {
                border-bottom: none;
            }
            
            .shortcut-keys {
                display: flex;
                gap: 8px;
            }
            
            .shortcut-keys kbd {
                background: var(--bg-secondary, #222);
                border: 1px solid var(--border-color, #333);
                border-radius: 4px;
                padding: 4px 8px;
                font-size: 12px;
                font-family: var(--font-mono, monospace);
                min-width: 24px;
                text-align: center;
            }
            
            .sequence-hint {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--bg-elevated, #1a1a1a);
                border: 1px solid var(--border-color, #333);
                border-radius: 8px;
                padding: 12px;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                z-index: 9999;
            }
            
            .sequence-hint.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .sequence-current {
                font-weight: bold;
                margin-bottom: 8px;
                color: var(--accent-primary, #ffd700);
            }
            
            .sequence-match {
                font-size: 12px;
                color: var(--text-secondary, #999);
                margin-bottom: 4px;
            }
            
            .keyboard-hint {
                position: absolute;
                top: -8px;
                right: -8px;
                background: var(--accent-primary, #ffd700);
                color: var(--bg-primary, #000);
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: bold;
                opacity: 0.8;
                pointer-events: none;
            }
            
            .keyboard-notification {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: var(--bg-elevated, #1a1a1a);
                border: 1px solid var(--border-color, #333);
                border-radius: 8px;
                padding: 12px 24px;
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 9998;
            }
            
            .keyboard-notification.visible {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            
            /* Debug mode styles */
            .debug-mode .command-item {
                border: 1px dashed red;
            }
            
            .debug-mode [tabindex] {
                outline: 2px solid blue;
            }
            
            /* Accessibility mode styles */
            .accessibility-mode {
                font-size: 120%;
                line-height: 1.8;
            }
            
            .accessibility-mode .keyboard-hint {
                display: none;
            }
            
            @media (prefers-reduced-motion: reduce) {
                .command-palette-content,
                .sequence-hint,
                .keyboard-notification {
                    transition: none;
                }
            }
        `;
        
    document.head.appendChild(styles);
  }
    
  // Public API
  enable() {
    this.options.enabled = true;
  }
    
  disable() {
    this.options.enabled = false;
  }
    
  addShortcut(keys, callback, description) {
    this.register(keys, callback, description);
  }
    
  removeShortcut(key) {
    this.shortcuts.delete(key);
  }
    
  showHelp() {
    this.showShortcutHelp();
  }
    
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
        
    if (this.commandPalette) {
      this.commandPalette.remove();
    }
        
    if (this.helpModal) {
      this.helpModal.remove();
    }
        
    clearTimeout(this.sequenceTimer);
  }
}

// Initialize keyboard shortcuts when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.keyboardShortcuts = new KeyboardShortcuts();
  });
} else {
  window.keyboardShortcuts = new KeyboardShortcuts();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeyboardShortcuts;
}