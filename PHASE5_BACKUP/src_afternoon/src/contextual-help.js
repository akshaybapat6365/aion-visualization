// Contextual Help System with Smart Guidance
// Provides adaptive tooltips, tutorials, and help based on user behavior

class ContextualHelp {
  constructor(options = {}) {
    this.options = {
      enabled: true,
      sensitivity: 'medium', // low, medium, high
      maxTooltips: 3,
      tooltipDelay: 1000,
      autoHide: true,
      autoHideDelay: 5000,
      trackBehavior: true,
      ...options
    };
        
    this.userBehavior = new Map();
    this.helpTriggers = new Map();
    this.tooltipQueue = [];
    this.activeTooltips = new Set();
    this.sessionData = {
      startTime: Date.now(),
      interactions: [],
      struggledElements: new Set(),
      completedTutorials: new Set()
    };
        
    this.init();
  }
    
  init() {
    this.setupBehaviorTracking();
    this.setupHelpTriggers();
    this.loadUserPreferences();
    this.injectStyles();
        
    // Check if first-time user
    if (this.isFirstTimeUser()) {
      setTimeout(() => this.showWelcomeTour(), 1000);
    }
  }
    
  setupBehaviorTracking() {
    if (!this.options.trackBehavior) return;
        
    // Track mouse movements for confusion detection
    let lastMousePos = { x: 0, y: 0 };
    let mouseStillTimer = null;
        
    document.addEventListener('mousemove', (e) => {
      const distance = Math.sqrt(
        Math.pow(e.clientX - lastMousePos.x, 2) + 
                Math.pow(e.clientY - lastMousePos.y, 2)
      );
            
      // Detect erratic movement (confusion)
      if (distance > 100) {
        this.detectConfusion(e.target);
      }
            
      lastMousePos = { x: e.clientX, y: e.clientY };
            
      // Detect hovering (uncertainty)
      clearTimeout(mouseStillTimer);
      mouseStillTimer = setTimeout(() => {
        this.detectHovering(e.target);
      }, 2000);
    });
        
    // Track failed interactions
    document.addEventListener('click', (e) => {
      const target = e.target;
      const interaction = {
        element: target,
        type: 'click',
        timestamp: Date.now(),
        successful: this.isSuccessfulInteraction(target)
      };
            
      this.sessionData.interactions.push(interaction);
            
      if (!interaction.successful) {
        this.handleFailedInteraction(target);
      }
    });
        
    // Track form errors
    document.addEventListener('invalid', (e) => {
      this.handleFormError(e.target);
    }, true);
        
    // Track repeated actions
    this.trackRepeatedActions();
  }
    
  setupHelpTriggers() {
    // Define help triggers for specific elements
    this.helpTriggers.set('visualization-controls', {
      trigger: 'hover',
      delay: 2000,
      content: 'Use these controls to interact with the visualization. Click and drag to rotate, scroll to zoom.',
      position: 'top'
    });
        
    this.helpTriggers.set('chapter-navigation', {
      trigger: 'struggle',
      content: 'Navigate between chapters using the arrow keys or these buttons.',
      position: 'bottom'
    });
        
    this.helpTriggers.set('complex-interaction', {
      trigger: 'confusion',
      content: 'Having trouble? Try the simplified view or take the guided tour.',
      position: 'center',
      actions: [
        { label: 'Simplified View', action: 'simplify' },
        { label: 'Guided Tour', action: 'tour' }
      ]
    });
  }
    
  detectConfusion(element) {
    const sensitivity = {
      low: 5,
      medium: 3,
      high: 1
    };
        
    const threshold = sensitivity[this.options.sensitivity];
    const elementKey = this.getElementKey(element);
        
    if (!this.userBehavior.has(elementKey)) {
      this.userBehavior.set(elementKey, {
        confusionCount: 0,
        hoverCount: 0,
        failedClicks: 0
      });
    }
        
    const behavior = this.userBehavior.get(elementKey);
    behavior.confusionCount++;
        
    if (behavior.confusionCount >= threshold && !this.sessionData.struggledElements.has(elementKey)) {
      this.sessionData.struggledElements.add(elementKey);
      this.suggestHelp(element, 'confusion');
    }
  }
    
  detectHovering(element) {
    const elementKey = this.getElementKey(element);
    const behavior = this.userBehavior.get(elementKey) || { hoverCount: 0 };
    behavior.hoverCount++;
        
    if (behavior.hoverCount > 3) {
      this.suggestHelp(element, 'uncertainty');
    }
  }
    
  handleFailedInteraction(element) {
    const elementKey = this.getElementKey(element);
    const behavior = this.userBehavior.get(elementKey) || { failedClicks: 0 };
    behavior.failedClicks++;
        
    if (behavior.failedClicks >= 2) {
      this.showSmartTooltip(element, {
        content: this.getContextualHelp(element),
        type: 'error',
        persistent: true
      });
    }
  }
    
  handleFormError(input) {
    const helpText = this.getFormErrorHelp(input);
    this.showSmartTooltip(input, {
      content: helpText,
      type: 'error',
      position: 'right'
    });
  }
    
  trackRepeatedActions() {
    const actionPatterns = new Map();
        
    this.sessionData.interactions.forEach((interaction, index) => {
      if (index < 2) return;
            
      // Look for patterns in last 3 interactions
      const pattern = this.sessionData.interactions
        .slice(index - 2, index + 1)
        .map(i => this.getElementKey(i.element))
        .join('-');
            
      actionPatterns.set(pattern, (actionPatterns.get(pattern) || 0) + 1);
            
      // If pattern repeated 3 times, suggest advanced feature
      if (actionPatterns.get(pattern) === 3) {
        this.suggestAdvancedFeature(pattern);
      }
    });
  }
    
  suggestHelp(element, reason) {
    const elementKey = this.getElementKey(element);
    const trigger = this.helpTriggers.get(elementKey);
        
    if (!trigger || trigger.trigger !== reason) {
      // Generate dynamic help
      const help = this.generateDynamicHelp(element, reason);
      this.queueTooltip(element, help);
    } else {
      this.queueTooltip(element, trigger);
    }
  }
    
  generateDynamicHelp(element, reason) {
    const elementType = this.getElementType(element);
    const context = this.getElementContext(element);
        
    const helpTemplates = {
      confusion: {
        button: 'Click this button to ${action}',
        visualization: 'Interact with the visualization using mouse or touch gestures',
        navigation: 'Use this to navigate between sections',
        form: 'Fill out this form to continue'
      },
      uncertainty: {
        button: 'This ${type} button ${description}',
        visualization: 'Hover for details, click to interact',
        navigation: 'Navigate to ${destination}',
        form: 'Enter your ${fieldType} here'
      }
    };
        
    const template = helpTemplates[reason]?.[elementType] || 'Click or tap to interact';
        
    return {
      content: this.fillTemplate(template, context),
      position: this.calculateBestPosition(element),
      type: reason
    };
  }
    
  showSmartTooltip(element, options = {}) {
    if (!this.options.enabled) return;
    if (this.activeTooltips.size >= this.options.maxTooltips) return;
        
    const tooltip = this.createTooltip({
      target: element,
      content: options.content || 'Helpful tip',
      position: options.position || this.calculateBestPosition(element),
      type: options.type || 'info',
      persistent: options.persistent || false,
      actions: options.actions || []
    });
        
    this.positionTooltip(tooltip, element);
    this.activeTooltips.add(tooltip);
        
    // Auto-hide non-persistent tooltips
    if (this.options.autoHide && !options.persistent) {
      setTimeout(() => {
        this.hideTooltip(tooltip);
      }, this.options.autoHideDelay);
    }
        
    return tooltip;
  }
    
  createTooltip(config) {
    const tooltip = document.createElement('div');
    tooltip.className = `contextual-tooltip tooltip-${config.type}`;
    tooltip.setAttribute('role', 'tooltip');
        
    // Content
    const content = document.createElement('div');
    content.className = 'tooltip-content';
    content.textContent = config.content;
    tooltip.appendChild(content);
        
    // Actions
    if (config.actions.length > 0) {
      const actions = document.createElement('div');
      actions.className = 'tooltip-actions';
            
      config.actions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'tooltip-action';
        button.textContent = action.label;
        button.onclick = () => this.handleTooltipAction(action.action, config.target);
        actions.appendChild(button);
      });
            
      tooltip.appendChild(actions);
    }
        
    // Close button
    if (config.persistent) {
      const close = document.createElement('button');
      close.className = 'tooltip-close';
      close.innerHTML = '×';
      close.onclick = () => this.hideTooltip(tooltip);
      tooltip.appendChild(close);
    }
        
    // Arrow
    const arrow = document.createElement('div');
    arrow.className = 'tooltip-arrow';
    tooltip.appendChild(arrow);
        
    document.body.appendChild(tooltip);
        
    // Animate in
    requestAnimationFrame(() => {
      tooltip.classList.add('tooltip-visible');
    });
        
    return tooltip;
  }
    
  positionTooltip(tooltip, target) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const spacing = 10;
        
    // Calculate positions for each side
    const positions = {
      top: {
        left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
        top: targetRect.top - tooltipRect.height - spacing
      },
      bottom: {
        left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
        top: targetRect.bottom + spacing
      },
      left: {
        left: targetRect.left - tooltipRect.width - spacing,
        top: targetRect.top + (targetRect.height - tooltipRect.height) / 2
      },
      right: {
        left: targetRect.right + spacing,
        top: targetRect.top + (targetRect.height - tooltipRect.height) / 2
      }
    };
        
    // Find best position that fits in viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
        
    let bestPosition = 'top';
    for (const [position, coords] of Object.entries(positions)) {
      if (coords.left >= 0 && 
                coords.top >= 0 && 
                coords.left + tooltipRect.width <= viewport.width &&
                coords.top + tooltipRect.height <= viewport.height) {
        bestPosition = position;
        break;
      }
    }
        
    const finalPosition = positions[bestPosition];
    tooltip.style.left = Math.max(0, finalPosition.left) + 'px';
    tooltip.style.top = Math.max(0, finalPosition.top) + 'px';
    tooltip.className = `contextual-tooltip tooltip-${bestPosition}`;
  }
    
  hideTooltip(tooltip) {
    tooltip.classList.remove('tooltip-visible');
    setTimeout(() => {
      tooltip.remove();
      this.activeTooltips.delete(tooltip);
    }, 300);
  }
    
  queueTooltip(element, config) {
    this.tooltipQueue.push({ element, config });
        
    if (this.tooltipQueue.length === 1) {
      this.processTooltipQueue();
    }
  }
    
  processTooltipQueue() {
    if (this.tooltipQueue.length === 0) return;
        
    const { element, config } = this.tooltipQueue[0];
        
    setTimeout(() => {
      this.showSmartTooltip(element, config);
      this.tooltipQueue.shift();
            
      if (this.tooltipQueue.length > 0) {
        setTimeout(() => this.processTooltipQueue(), 500);
      }
    }, this.options.tooltipDelay);
  }
    
  handleTooltipAction(action, target) {
    switch (action) {
    case 'simplify':
      this.simplifyInterface();
      break;
    case 'tour':
      this.startGuidedTour();
      break;
    case 'learn-more':
      this.showDetailedHelp(target);
      break;
    default:
      this.emit('tooltip-action', { action, target });
    }
  }
    
  showWelcomeTour() {
    const tour = [
      {
        element: '.hero-title',
        content: 'Welcome to Aion Visualization! Let\'s take a quick tour.',
        position: 'bottom'
      },
      {
        element: '.nav-link',
        content: 'Navigate between different sections using this menu.',
        position: 'bottom'
      },
      {
        element: '.chapter-card',
        content: 'Each chapter contains interactive visualizations of Jung\'s concepts.',
        position: 'right'
      },
      {
        element: '.visualization-controls',
        content: 'Use these controls to interact with the visualizations.',
        position: 'top'
      }
    ];
        
    this.startTour(tour);
  }
    
  startGuidedTour() {
    // Context-specific tour based on current page
    const currentPage = this.getCurrentPage();
    const tours = {
      'chapter': this.getChapterTour(),
      'visualization': this.getVisualizationTour(),
      'home': this.getHomeTour()
    };
        
    const tour = tours[currentPage] || this.getDefaultTour();
    this.startTour(tour);
  }
    
  startTour(steps) {
    let currentStep = 0;
        
    const showStep = () => {
      if (currentStep >= steps.length) {
        this.completeTour();
        return;
      }
            
      const step = steps[currentStep];
      const element = document.querySelector(step.element);
            
      if (!element) {
        currentStep++;
        showStep();
        return;
      }
            
      // Highlight element
      element.classList.add('tour-highlight');
            
      // Show tooltip
      const tooltip = this.showSmartTooltip(element, {
        content: step.content,
        position: step.position,
        persistent: true,
        actions: [
          { label: 'Next', action: 'next' },
          { label: 'Skip Tour', action: 'skip' }
        ]
      });
            
      // Handle tour navigation
      tooltip.querySelector('.tooltip-action').onclick = () => {
        element.classList.remove('tour-highlight');
        this.hideTooltip(tooltip);
        currentStep++;
        showStep();
      };
            
      tooltip.querySelector('.tooltip-action:last-child').onclick = () => {
        element.classList.remove('tour-highlight');
        this.hideTooltip(tooltip);
        this.completeTour();
      };
    };
        
    showStep();
  }
    
  completeTour() {
    // Remove all highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
        
    // Mark as completed
    this.sessionData.completedTutorials.add('main-tour');
    this.saveUserPreferences();
        
    // Show completion message
    this.showNotification('Tour completed! You can restart it anytime from the help menu.');
  }
    
  // Utility methods
  getElementKey(element) {
    return element.id || element.className || element.tagName;
  }
    
  getElementType(element) {
    if (element.tagName === 'BUTTON') return 'button';
    if (element.classList.contains('visualization')) return 'visualization';
    if (element.classList.contains('nav')) return 'navigation';
    if (element.tagName === 'FORM' || element.tagName === 'INPUT') return 'form';
    return 'generic';
  }
    
  getElementContext(element) {
    return {
      action: element.getAttribute('data-action') || 'interact',
      type: element.getAttribute('data-type') || 'primary',
      description: element.getAttribute('aria-label') || 'performs an action',
      destination: element.getAttribute('href') || 'another section',
      fieldType: element.getAttribute('placeholder') || 'information'
    };
  }
    
  calculateBestPosition(element) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
        
    // Prefer top/bottom for narrow elements
    if (rect.width < 200) {
      return rect.top > viewportHeight / 2 ? 'top' : 'bottom';
    }
        
    // Prefer left/right for wide elements
    return rect.left > viewportWidth / 2 ? 'left' : 'right';
  }
    
  fillTemplate(template, context) {
    return template.replace(/\${(\w+)}/g, (match, key) => {
      return context[key] || match;
    });
  }
    
  getFormErrorHelp(input) {
    const type = input.type;
    const validity = input.validity;
        
    if (validity.valueMissing) {
      return `Please fill out this ${type} field.`;
    }
    if (validity.typeMismatch) {
      return `Please enter a valid ${type}.`;
    }
    if (validity.tooShort) {
      return `Please enter at least ${input.minLength} characters.`;
    }
    if (validity.patternMismatch) {
      return input.getAttribute('data-pattern-help') || 'Please match the requested format.';
    }
        
    return 'Please correct this field.';
  }
    
  getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('chapter')) return 'chapter';
    if (path.includes('visualization')) return 'visualization';
    if (path === '/' || path.includes('index')) return 'home';
    return 'generic';
  }
    
  isFirstTimeUser() {
    return !localStorage.getItem('aion-help-seen');
  }
    
  isSuccessfulInteraction(element) {
    // Check if interaction led to expected result
    // This is simplified - real implementation would be more sophisticated
    return element.tagName === 'A' || element.tagName === 'BUTTON';
  }
    
  simplifyInterface() {
    document.body.classList.add('simplified-mode');
    this.showNotification('Simplified mode activated. Press ESC to return to normal view.');
  }
    
  showDetailedHelp(target) {
    // Open help modal with detailed information
    const helpModal = document.createElement('div');
    helpModal.className = 'help-modal';
    helpModal.innerHTML = `
            <div class="help-modal-content">
                <button class="help-modal-close">×</button>
                <h2>Detailed Help</h2>
                <div class="help-content">
                    ${this.getDetailedHelpContent(target)}
                </div>
            </div>
        `;
        
    document.body.appendChild(helpModal);
        
    helpModal.querySelector('.help-modal-close').onclick = () => {
      helpModal.remove();
    };
  }
    
  getDetailedHelpContent(target) {
    // Generate detailed help based on context
    return `
            <h3>About This Element</h3>
            <p>This is a detailed explanation of how to use this feature...</p>
            <h3>Common Actions</h3>
            <ul>
                <li>Click to activate</li>
                <li>Right-click for options</li>
                <li>Drag to reposition</li>
            </ul>
            <h3>Keyboard Shortcuts</h3>
            <ul>
                <li><kbd>Enter</kbd> - Activate</li>
                <li><kbd>Escape</kbd> - Cancel</li>
                <li><kbd>?</kbd> - Show help</li>
            </ul>
        `;
  }
    
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `help-notification notification-${type}`;
    notification.textContent = message;
        
    document.body.appendChild(notification);
        
    setTimeout(() => {
      notification.classList.add('notification-visible');
    }, 10);
        
    setTimeout(() => {
      notification.classList.remove('notification-visible');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
    
  loadUserPreferences() {
    const prefs = localStorage.getItem('aion-help-preferences');
    if (prefs) {
      const parsed = JSON.parse(prefs);
      Object.assign(this.options, parsed);
    }
  }
    
  saveUserPreferences() {
    localStorage.setItem('aion-help-preferences', JSON.stringify({
      enabled: this.options.enabled,
      sensitivity: this.options.sensitivity,
      autoHide: this.options.autoHide
    }));
    localStorage.setItem('aion-help-seen', 'true');
  }
    
  injectStyles() {
    if (document.getElementById('contextual-help-styles')) return;
        
    const styles = document.createElement('style');
    styles.id = 'contextual-help-styles';
    styles.textContent = `
            .contextual-tooltip {
                position: fixed;
                background: var(--bg-elevated, #1a1a1a);
                border: 1px solid var(--border-color, #333);
                border-radius: 8px;
                padding: 12px 16px;
                max-width: 300px;
                opacity: 0;
                transform: translateY(5px);
                transition: all 0.3s ease;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }
            
            .tooltip-visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .tooltip-content {
                font-size: 14px;
                line-height: 1.5;
                color: var(--text-primary, #fff);
            }
            
            .tooltip-actions {
                margin-top: 12px;
                display: flex;
                gap: 8px;
            }
            
            .tooltip-action {
                padding: 6px 12px;
                background: var(--accent-primary, #ffd700);
                color: var(--bg-primary, #000);
                border: none;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: opacity 0.2s;
            }
            
            .tooltip-action:hover {
                opacity: 0.8;
            }
            
            .tooltip-close {
                position: absolute;
                top: 4px;
                right: 4px;
                background: none;
                border: none;
                color: var(--text-secondary, #999);
                font-size: 20px;
                cursor: pointer;
                padding: 4px;
                line-height: 1;
            }
            
            .tooltip-arrow {
                position: absolute;
                width: 0;
                height: 0;
                border: 6px solid transparent;
            }
            
            .tooltip-top .tooltip-arrow {
                bottom: -12px;
                left: 50%;
                transform: translateX(-50%);
                border-top-color: var(--bg-elevated, #1a1a1a);
            }
            
            .tooltip-bottom .tooltip-arrow {
                top: -12px;
                left: 50%;
                transform: translateX(-50%);
                border-bottom-color: var(--bg-elevated, #1a1a1a);
            }
            
            .tooltip-error {
                border-color: var(--error, #ff6b6b);
            }
            
            .tour-highlight {
                position: relative;
                z-index: 9999;
                outline: 3px solid var(--accent-primary, #ffd700);
                outline-offset: 4px;
                animation: pulse 2s ease-in-out infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .help-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--bg-elevated, #1a1a1a);
                border: 1px solid var(--border-color, #333);
                border-radius: 8px;
                padding: 16px 24px;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s ease;
                z-index: 10001;
            }
            
            .notification-visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .help-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10002;
            }
            
            .help-modal-content {
                background: var(--bg-primary, #000);
                border: 1px solid var(--border-color, #333);
                border-radius: 12px;
                padding: 32px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .simplified-mode .complex-feature {
                display: none !important;
            }
            
            .simplified-mode .visualization-controls {
                background: rgba(0, 0, 0, 0.9);
                padding: 20px;
                font-size: 18px;
            }
        `;
        
    document.head.appendChild(styles);
  }
    
  // Event system
  emit(event, data) {
    window.dispatchEvent(new CustomEvent(`contextual-help:${event}`, { detail: data }));
  }
    
  // Public API
  enable() {
    this.options.enabled = true;
    this.saveUserPreferences();
  }
    
  disable() {
    this.options.enabled = false;
    this.saveUserPreferences();
  }
    
  setSensitivity(level) {
    if (['low', 'medium', 'high'].includes(level)) {
      this.options.sensitivity = level;
      this.saveUserPreferences();
    }
  }
    
  showHelp(element) {
    this.showSmartTooltip(element, {
      content: this.getContextualHelp(element),
      persistent: true
    });
  }
    
  resetTour() {
    this.sessionData.completedTutorials.clear();
    this.showWelcomeTour();
  }
    
  destroy() {
    // Clean up event listeners and tooltips
    this.activeTooltips.forEach(tooltip => tooltip.remove());
    this.activeTooltips.clear();
    this.tooltipQueue = [];
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContextualHelp;
}