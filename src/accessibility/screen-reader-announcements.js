/**
 * Screen Reader Announcements for Visualizations
 * Provides descriptive audio feedback for visual elements
 */

export class ScreenReaderAnnouncements {
  constructor() {
    this.announcer = null;
    this.queue = [];
    this.isAnnouncing = false;
    this.init();
  }

  init() {
    // Create announcement container
    this.createAnnouncer();
    
    // Set up visualization observers
    this.observeVisualizations();
    
    // Add chapter-specific descriptions
    this.addChapterDescriptions();
  }

  createAnnouncer() {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('role', 'status');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.id = 'visualization-announcer';
    document.body.appendChild(this.announcer);
  }

  announce(message, priority = 'polite') {
    if (priority === 'assertive') {
      // Immediate announcement
      this.announcer.setAttribute('aria-live', 'assertive');
      this.announcer.textContent = message;
      setTimeout(() => {
        this.announcer.setAttribute('aria-live', 'polite');
      }, 100);
    } else {
      // Queue announcement
      this.queue.push(message);
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.isAnnouncing || this.queue.length === 0) return;
    
    this.isAnnouncing = true;
    const message = this.queue.shift();
    
    this.announcer.textContent = message;
    
    // Wait for announcement to complete (estimate based on length)
    const duration = Math.min(Math.max(message.length * 50, 1000), 5000);
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Clear for next announcement
    this.announcer.textContent = '';
    this.isAnnouncing = false;
    
    // Process next in queue
    this.processQueue();
  }

  observeVisualizations() {
    // Observe when visualizations come into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.describeVisualization(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    // Observe all visualization containers
    document.querySelectorAll('[data-visualization]').forEach(viz => {
      observer.observe(viz);
    });
  }

  describeVisualization(element) {
    const vizType = element.getAttribute('data-visualization');
    const chapterNum = element.getAttribute('data-chapter');
    
    // Get appropriate description
    const description = this.getVisualizationDescription(vizType, chapterNum);
    
    if (description) {
      this.announce(description);
    }
  }

  getVisualizationDescription(type, chapter) {
    const descriptions = {
      'ego-consciousness': `Interactive 3D visualization of the Ego as the center of consciousness. 
        This sphere represents the conscious mind, with particles showing thoughts and perceptions 
        flowing through awareness. Use arrow keys to rotate the view and explore different perspectives.`,
      
      'shadow-integration': `Dynamic visualization showing the Shadow as the repressed aspects of personality. 
        Dark particles represent unconscious content gradually integrating with the lighter conscious elements. 
        The animation demonstrates the process of shadow work and self-awareness.`,
      
      'anima-animus': `Dual spiral visualization representing the feminine Anima and masculine Animus. 
        The intertwining helixes show the complementary nature of these archetypal forces within the psyche. 
        Notice how they dance together, never fully merging but always in relation.`,
      
      'self-mandala': `Sacred geometry visualization of the Self as the unified whole of consciousness. 
        This mandala pattern represents individuation - the integration of all aspects of the psyche. 
        The center point symbolizes the transcendent function that unites opposites.`,
      
      'christ-archetype': `Symbolic visualization of Christ as an archetype of the Self. 
        The cross formation represents the intersection of temporal and eternal, human and divine. 
        Light emanates from the center, symbolizing consciousness illuminating the unconscious.`,
      
      'quaternary-structure': `Four-fold visualization showing the psychological functions: 
        thinking, feeling, sensation, and intuition. Each quadrant represents a different mode 
        of experiencing reality, with the center showing their potential integration.`,
      
      'fish-symbol': `Astrological visualization of the two fish swimming in opposite directions, 
        representing the Piscean age and the tension of opposites. The circular motion shows 
        the eternal cycle of psychological transformation.`,
      
      'ouroboros': `The ancient symbol of the snake eating its tail, representing eternal return 
        and the cyclical nature of psychological development. The animation shows the continuous 
        process of death and rebirth in the psyche.`,
      
      'mercurius-transformation': `Alchemical visualization of Mercurius as the spirit of transformation. 
        The fluid, quicksilver-like animation represents the mercurial nature of the unconscious 
        and its shape-shifting qualities.`,
      
      'lapis-philosophorum': `The Philosopher's Stone visualization showing the goal of psychological work. 
        The crystalline structure represents the solid, integrated personality achieved through 
        the alchemical process of individuation.`,
      
      'coniunctio-marriage': `Sacred marriage visualization showing the union of opposites. 
        Two complementary forms merge and separate in a dance of integration, representing 
        the internal marriage of masculine and feminine principles.`,
      
      'pleroma-fullness': `Visualization of the Pleroma as divine fullness and undifferentiated potential. 
        The particle field represents the primordial state before consciousness creates distinctions 
        and separations.`,
      
      'sophia-wisdom': `Divine wisdom visualization showing Sophia as the feminine face of God. 
        The flowing, graceful forms represent intuitive wisdom and the soul's connection to the divine.`,
      
      'naassene-serpent': `Serpent wisdom visualization from the Naassene tradition. 
        The ascending spiral represents kundalini energy and the awakening of consciousness 
        through the chakras or energy centers.`
    };
    
    // Add chapter context
    const baseDescription = descriptions[type] || 'Interactive visualization exploring Jungian concepts.';
    const chapterContext = chapter ? ` This visualization is part of Chapter ${chapter}.` : '';
    
    return baseDescription + chapterContext;
  }

  addChapterDescriptions() {
    // Add comprehensive descriptions to chapter pages
    const chapterDescriptions = {
      1: {
        title: 'The Ego',
        summary: 'Exploring the conscious center of personality',
        navigation: 'Use Tab to navigate between sections, Enter to activate interactive elements, and Escape to return to the chapter overview.'
      },
      2: {
        title: 'The Shadow',
        summary: 'Understanding the repressed and hidden aspects of the self',
        navigation: 'Interactive elements respond to keyboard input. Press H for help with navigation.'
      },
      3: {
        title: 'The Syzygy: Anima and Animus',
        summary: 'Examining the contrasexual archetypes within the psyche',
        navigation: 'Dual visualizations can be explored independently using number keys 1 and 2.'
      },
      4: {
        title: 'The Sign of the Fishes',
        summary: 'Astrological symbolism and the Christian aeon',
        navigation: 'Timeline navigation available with arrow keys. Press T to toggle timeline view.'
      },
      5: {
        title: 'Christ as Archetype',
        summary: 'Christ as a symbol of the Self',
        navigation: 'Symbolic elements can be explored in detail. Press Space to pause animations.'
      },
      6: {
        title: 'The Antichrist',
        summary: 'The dark counterpart in Christian symbolism',
        navigation: 'Content may include contrasting themes. Press C to toggle high contrast mode.'
      },
      7: {
        title: 'The Pleroma',
        summary: 'Gnostic concept of divine fullness',
        navigation: 'Abstract visualization uses spatial audio cues. Headphones recommended.'
      },
      8: {
        title: 'Sophia',
        summary: 'Divine wisdom in Gnostic tradition',
        navigation: 'Flowing visualization responds to mouse movement or arrow keys.'
      },
      9: {
        title: 'The Naassenes',
        summary: 'Serpent symbolism in early Christianity',
        navigation: 'Spiral navigation available. Use Page Up/Down for vertical movement.'
      },
      10: {
        title: 'The Lapis',
        summary: 'The Philosopher\'s Stone as psychological symbol',
        navigation: 'Crystal structure can be rotated with arrow keys or mouse drag.'
      },
      11: {
        title: 'Mercurius',
        summary: 'The spirit of transformation in alchemy',
        navigation: 'Fluid animation adapts to interaction. Press M to change visualization mode.'
      },
      12: {
        title: 'The Coniunctio',
        summary: 'The alchemical marriage of opposites',
        navigation: 'Dual control system - use left/right arrows to control each element.'
      },
      13: {
        title: 'The Quaternary',
        summary: 'The fourfold structure of wholeness',
        navigation: 'Four quadrants accessible via number keys 1-4 or cardinal directions.'
      },
      14: {
        title: 'The Self',
        summary: 'The archetype of psychological wholeness',
        navigation: 'Comprehensive visualization combining all previous elements. Press 0 for overview mode.'
      }
    };
    
    // Apply descriptions to chapter pages
    const currentPath = window.location.pathname;
    const chapterMatch = currentPath.match(/chapter(\d+)/);
    
    if (chapterMatch) {
      const chapterNum = parseInt(chapterMatch[1]);
      const info = chapterDescriptions[chapterNum];
      
      if (info) {
        // Announce chapter information
        setTimeout(() => {
          this.announce(`Chapter ${chapterNum}: ${info.title}. ${info.summary}. ${info.navigation}`);
        }, 1000);
      }
    }
  }

  // Public API
  describeElement(element, description) {
    element.setAttribute('aria-label', description);
    
    // Add describedby for longer descriptions
    if (description.length > 100) {
      const id = `desc-${Date.now()}`;
      const descElement = document.createElement('div');
      descElement.id = id;
      descElement.className = 'sr-only';
      descElement.textContent = description;
      element.appendChild(descElement);
      element.setAttribute('aria-describedby', id);
    }
  }

  announceInteraction(action, result) {
    this.announce(`${action}. ${result}`, 'assertive');
  }

  announceDataPoint(label, value, context = '') {
    const message = context 
      ? `${label}: ${value}. ${context}`
      : `${label}: ${value}`;
    this.announce(message);
  }

  announceNavigation(from, to) {
    this.announce(`Navigating from ${from} to ${to}`);
  }

  announceLoading(item) {
    this.announce(`Loading ${item}. Please wait.`);
  }

  announceComplete(item) {
    this.announce(`${item} loaded and ready for interaction.`);
  }

  announceError(error) {
    this.announce(`Error: ${error}. Press H for help.`, 'assertive');
  }
}

// Auto-initialize
export const screenReaderSupport = new ScreenReaderAnnouncements();

export default screenReaderSupport;