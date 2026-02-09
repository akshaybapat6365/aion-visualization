// Interactive Concept Mapping System
// Visualizes Jungian concepts and their relationships

const RELATION_TAXONOMY_LOOKUP = {
  complements: { label: 'complements', motionBehavior: 'integration' },
  supports: { label: 'supports', motionBehavior: 'deflation' },
  converges_with: { label: 'converges with', motionBehavior: 'integration' },
  orients: { label: 'orients', motionBehavior: 'integration' },
  illuminates: { label: 'illuminates', motionBehavior: 'inflation' },
  precedes: { label: 'precedes', motionBehavior: 'deflation' },
  culminates_in: { label: 'culminates in', motionBehavior: 'cyclical-return' },
  symbolizes: { label: 'symbolizes', motionBehavior: 'cyclical-return' },
  opposes: { label: 'opposes', motionBehavior: 'opposition' },
  develops_toward: { label: 'develops toward', motionBehavior: 'integration' },
  relates_to: { label: 'relates to', motionBehavior: 'integration' },
  integrates_into: { label: 'integrates into', motionBehavior: 'integration' },
  manifests_as: { label: 'manifests as', motionBehavior: 'inflation' },
  expresses_as: { label: 'expresses as', motionBehavior: 'inflation' },
  symbolized_by: { label: 'symbolized by', motionBehavior: 'cyclical-return' },
  structured_as: { label: 'structured as', motionBehavior: 'cyclical-return' },
  achieved_through: { label: 'achieved through', motionBehavior: 'integration' },
  requires: { label: 'requires', motionBehavior: 'deflation' },
  resolved_by: { label: 'resolved by', motionBehavior: 'deflation' },
  completed_by: { label: 'completed by', motionBehavior: 'cyclical-return' },
  represents: { label: 'represents', motionBehavior: 'cyclical-return' },
  enacts: { label: 'enacts', motionBehavior: 'inflation' },
  guides_to: { label: 'guides to', motionBehavior: 'integration' },
  aspect_of: { label: 'aspect of', motionBehavior: 'deflation' }
};

class ConceptMapper {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      width: this.container?.clientWidth || 800,
      height: this.container?.clientHeight || 600,
      nodeRadius: 30,
      linkDistance: 150,
      chargeStrength: -500,
      centerForce: 0.05,
      enableZoom: true,
      enableDrag: true,
      showLabels: true,
      animateTransitions: true,
      ...options
    };
        
    this.conceptGraph = new ConceptGraph();
    this.userUnderstanding = new Map();
    this.connections = new Map();
    this.selectedNode = null;
    this.simulation = null;
        
    this.init();
  }
    
  init() {
    if (!this.container) {
      console.warn('ConceptMapper: Container not found');
      return;
    }
        
    this.setupSVG();
    this.loadJungianConcepts();
    this.buildConceptMap();
    this.setupInteractions();
    this.startSimulation();
  }
    
  setupSVG() {
    // Clear existing content
    this.container.innerHTML = '';
        
    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .attr('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
        
    // Add zoom behavior
    if (this.options.enableZoom) {
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          this.g.attr('transform', event.transform);
        });
            
      this.svg.call(zoom);
    }
        
    // Create main group
    this.g = this.svg.append('g');
        
    // Create layers
    this.linkLayer = this.g.append('g').attr('class', 'links');
    this.nodeLayer = this.g.append('g').attr('class', 'nodes');
    this.labelLayer = this.g.append('g').attr('class', 'labels');
        
    // Add arrow markers for directed edges
    this.svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 30)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');
  }
    
  loadJungianConcepts() {
    // Core Jungian concepts and their relationships
    const concepts = [
      // Primary concepts
      { id: 'ego', name: 'Ego', category: 'primary', description: 'Center of consciousness' },
      { id: 'shadow', name: 'Shadow', category: 'primary', description: 'Repressed aspects of personality' },
      { id: 'anima', name: 'Anima', category: 'primary', description: 'Feminine aspect in men' },
      { id: 'animus', name: 'Animus', category: 'primary', description: 'Masculine aspect in women' },
      { id: 'self', name: 'Self', category: 'primary', description: 'Totality of conscious and unconscious' },
            
      // Archetypes
      { id: 'hero', name: 'Hero', category: 'archetype', description: 'Overcoming challenges' },
      { id: 'mother', name: 'Mother', category: 'archetype', description: 'Nurturing and creation' },
      { id: 'father', name: 'Father', category: 'archetype', description: 'Authority and order' },
      { id: 'trickster', name: 'Trickster', category: 'archetype', description: 'Disruption and transformation' },
      { id: 'wise-old-man', name: 'Wise Old Man', category: 'archetype', description: 'Wisdom and guidance' },
            
      // Processes
      { id: 'individuation', name: 'Individuation', category: 'process', description: 'Journey to wholeness' },
      { id: 'projection', name: 'Projection', category: 'process', description: 'Attributing inner content to external' },
      { id: 'integration', name: 'Integration', category: 'process', description: 'Incorporating unconscious content' },
      { id: 'compensation', name: 'Compensation', category: 'process', description: 'Balancing conscious attitude' },
            
      // Symbols
      { id: 'mandala', name: 'Mandala', category: 'symbol', description: 'Symbol of wholeness' },
      { id: 'quaternity', name: 'Quaternity', category: 'symbol', description: 'Four-fold structure' },
      { id: 'trinity', name: 'Trinity', category: 'symbol', description: 'Three-fold structure' },
      { id: 'ouroboros', name: 'Ouroboros', category: 'symbol', description: 'Eternal return' },
      { id: 'coniunctio', name: 'Coniunctio', category: 'symbol', description: 'Union of opposites' }
    ];
        
    // Define relationships
    const relationships = [
      // Ego relationships
      { source: 'ego', target: 'shadow', type: 'opposes', strength: 0.9 },
      { source: 'ego', target: 'self', type: 'develops_toward', strength: 0.8 },
      { source: 'ego', target: 'anima', type: 'relates_to', strength: 0.7 },
      { source: 'ego', target: 'animus', type: 'relates_to', strength: 0.7 },
            
      // Shadow relationships
      { source: 'shadow', target: 'self', type: 'integrates_into', strength: 0.8 },
      { source: 'shadow', target: 'projection', type: 'manifests_as', strength: 0.9 },
      { source: 'shadow', target: 'trickster', type: 'expresses_as', strength: 0.7 },
            
      // Anima/Animus relationships
      { source: 'anima', target: 'self', type: 'integrates_into', strength: 0.8 },
      { source: 'animus', target: 'self', type: 'integrates_into', strength: 0.8 },
      { source: 'anima', target: 'mother', type: 'relates_to', strength: 0.6 },
      { source: 'animus', target: 'father', type: 'relates_to', strength: 0.6 },
            
      // Self relationships
      { source: 'self', target: 'mandala', type: 'symbolized_by', strength: 0.9 },
      { source: 'self', target: 'quaternity', type: 'structured_as', strength: 0.8 },
      { source: 'self', target: 'individuation', type: 'achieved_through', strength: 0.9 },
            
      // Process relationships
      { source: 'individuation', target: 'integration', type: 'requires', strength: 0.9 },
      { source: 'projection', target: 'integration', type: 'resolved_by', strength: 0.8 },
      { source: 'compensation', target: 'individuation', type: 'supports', strength: 0.7 },
            
      // Symbol relationships
      { source: 'trinity', target: 'quaternity', type: 'completed_by', strength: 0.8 },
      { source: 'ouroboros', target: 'self', type: 'represents', strength: 0.7 },
      { source: 'coniunctio', target: 'individuation', type: 'culminates_in', strength: 0.9 },
            
      // Archetype relationships
      { source: 'hero', target: 'individuation', type: 'enacts', strength: 0.8 },
      { source: 'wise-old-man', target: 'self', type: 'guides_to', strength: 0.7 },
      { source: 'mother', target: 'anima', type: 'aspect_of', strength: 0.6 },
      { source: 'father', target: 'animus', type: 'aspect_of', strength: 0.6 }
    ];
        
    // Build the graph
    this.conceptGraph.addConcepts(concepts);
    this.conceptGraph.addRelationships(relationships);
  }
    
  buildConceptMap() {
    const nodes = this.conceptGraph.getConcepts();
    const links = this.conceptGraph.getRelationships();
        
    // Create force simulation
    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => this.options.linkDistance / d.strength))
      .force('charge', d3.forceManyBody()
        .strength(this.options.chargeStrength))
      .force('center', d3.forceCenter(
        this.options.width / 2, 
        this.options.height / 2
      ).strength(this.options.centerForce))
      .force('collision', d3.forceCollide()
        .radius(this.options.nodeRadius + 10));
        
    // Create links
    this.links = this.linkLayer.selectAll('.link')
      .data(links)
      .enter().append('g')
      .attr('class', 'link-group');
        
    this.links.append('line')
      .attr('class', d => `link link-${d.type} semantic-${this.getMotionBehaviorForRelation(d.type)}`)
      .attr('data-motion-behavior', d => this.getMotionBehaviorForRelation(d.type))
      .attr('stroke', '#999')
      .attr('stroke-opacity', d => d.strength * 0.6)
      .attr('stroke-width', d => Math.sqrt(d.strength * 10))
      .attr('stroke-dasharray', d => this.getLinkDashPattern(d.type))
      .attr('marker-end', 'url(#arrowhead)');
        
    // Add link labels
    this.links.append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .style('font-size', '10px')
      .style('fill', '#666')
      .text(d => this.getRelationLabel(d.type));
        
    // Create nodes
    this.nodes = this.nodeLayer.selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node-group');
        
    // Node circles
    this.nodes.append('circle')
      .attr('class', d => `node node-${d.category}`)
      .attr('r', this.options.nodeRadius)
      .attr('fill', d => this.getNodeColor(d.category))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');
        
    // Node icons
    this.nodes.append('text')
      .attr('class', 'node-icon')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .style('font-size', '20px')
      .text(d => this.getNodeIcon(d));
        
    // Node labels
    if (this.options.showLabels) {
      this.nodes.append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', this.options.nodeRadius + 15)
        .style('font-size', '12px')
        .style('fill', '#fff')
        .text(d => d.name);
    }
        
    // Enable drag if configured
    if (this.options.enableDrag) {
      this.nodes.call(this.createDragBehavior());
    }
  }
    

  getMotionBehaviorForRelation(relationType) {
    const typeForGrammar = relationType.replace(/_/g, '-');

    if (window.AionMotionGrammar) {
      return window.AionMotionGrammar.getMotionBehaviorForRelation(typeForGrammar);
    }

    if (window.AionMotionChoreographer) {
      return window.AionMotionChoreographer.getMotionBehaviorForRelation(relationType);
    }

    const typeForTaxonomy = relationType.replace(/-/g, '_');
    return RELATION_TAXONOMY_LOOKUP[typeForTaxonomy]?.motionBehavior || 'integration';
  }

  getRelationLabel(relationType) {
    const typeForTaxonomy = relationType.replace(/-/g, '_');
    return RELATION_TAXONOMY_LOOKUP[typeForTaxonomy]?.label || typeForTaxonomy.replace(/_/g, ' ');
  }

  getLinkDashPattern(relationType) {
    const motionBehavior = this.getMotionBehaviorForRelation(relationType);

    switch (motionBehavior) {
    case 'opposition':
      return '8 6';
    case 'deflation':
      return '2 6';
    case 'cyclical-return':
      return '10 4 2 4';
    default:
      return '';
    }
  }

  createDragBehavior() {
    return d3.drag()
      .on('start', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }
    
  setupInteractions() {
    // Node hover effects
    this.nodes
      .on('mouseenter', (event, d) => {
        this.highlightConnections(d);
        this.showTooltip(event, d);
      })
      .on('mouseleave', () => {
        this.clearHighlights();
        this.hideTooltip();
      })
      .on('click', (event, d) => {
        this.selectNode(d);
        event.stopPropagation();
      });
        
    // Click on background to deselect
    this.svg.on('click', () => {
      this.deselectNode();
    });
        
    // Keyboard shortcuts
    d3.select('body').on('keydown', (event) => {
      if (event.key === 'Escape') {
        this.deselectNode();
      } else if (event.key === 'r') {
        this.resetLayout();
      }
    });
  }
    
  startSimulation() {
    this.simulation.on('tick', () => {
      // Update link positions
      this.links.select('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
            
      // Update link label positions
      this.links.select('text')
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);
            
      // Update node positions
      this.nodes.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }
    
  getNodeColor(category) {
    const colors = {
      primary: '#ffd700',     // Gold
      archetype: '#ff6b6b',   // Red
      process: '#4ecdc4',     // Teal
      symbol: '#95e1d3'       // Mint
    };
    return colors[category] || '#999';
  }
    
  getNodeIcon(node) {
    const icons = {
      ego: '👁️',
      shadow: '🌑',
      anima: '♀️',
      animus: '♂️',
      self: '☉',
      hero: '⚔️',
      mother: '🤱',
      father: '👨',
      trickster: '🃏',
      'wise-old-man': '🧙',
      individuation: '🔄',
      projection: '📽️',
      integration: '🔗',
      compensation: '⚖️',
      mandala: '◉',
      quaternity: '⬜',
      trinity: '△',
      ouroboros: '🐍',
      coniunctio: '☯️'
    };
    return icons[node.id] || '●';
  }
    
  highlightConnections(node) {
    // Fade all elements
    this.nodes.style('opacity', 0.2);
    this.links.style('opacity', 0.1);
        
    // Highlight selected node
    this.nodes.filter(d => d.id === node.id)
      .style('opacity', 1);
        
    // Highlight connected nodes and links
    const connectedNodes = new Set([node.id]);
        
    this.links
      .filter(d => d.source.id === node.id || d.target.id === node.id)
      .style('opacity', 1)
      .each(d => {
        connectedNodes.add(d.source.id);
        connectedNodes.add(d.target.id);
      });
        
    this.nodes
      .filter(d => connectedNodes.has(d.id))
      .style('opacity', 1);
  }
    
  clearHighlights() {
    this.nodes.style('opacity', 1);
    this.links.style('opacity', 1);
  }
    
  showTooltip(event, node) {
    // Create tooltip if it doesn't exist
    if (!this.tooltip) {
      this.tooltip = d3.select('body')
        .append('div')
        .attr('class', 'concept-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', '#fff')
        .style('padding', '10px')
        .style('border-radius', '8px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0);
    }
        
    const understanding = this.getUserUnderstanding(node.id);
        
    this.tooltip
      .html(`
                <strong>${node.name}</strong><br>
                <em>${node.category}</em><br>
                ${node.description}<br>
                <br>
                Understanding: ${Math.round(understanding * 100)}%
            `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px')
      .transition()
      .duration(200)
      .style('opacity', 1);
  }
    
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip
        .transition()
        .duration(200)
        .style('opacity', 0);
    }
  }
    
  selectNode(node) {
    this.selectedNode = node;
        
    // Update visual state
    this.nodes.select('circle')
      .attr('stroke-width', d => d.id === node.id ? 4 : 2)
      .attr('stroke', d => d.id === node.id ? '#fff' : '#999');
        
    // Emit selection event
    window.dispatchEvent(new CustomEvent('concept-selected', {
      detail: { concept: node }
    }));
        
    // Show detailed information
    this.showConceptDetails(node);
  }
    
  deselectNode() {
    this.selectedNode = null;
        
    // Reset visual state
    this.nodes.select('circle')
      .attr('stroke-width', 2)
      .attr('stroke', '#fff');
        
    this.hideConceptDetails();
  }
    
  showConceptDetails(node) {
    // This would show a detailed panel with:
    // - Full description
    // - Related concepts
    // - Learning resources
    // - User's progress
    console.log('Selected concept:', node);
  }
    
  hideConceptDetails() {
    // Hide details panel
  }
    
  resetLayout() {
    // Reset node positions
    this.simulation.alpha(1).restart();
  }
    
  // User understanding tracking
  trackConceptUnderstanding(conceptId, understandingLevel) {
    this.userUnderstanding.set(conceptId, understandingLevel);
    this.updateConceptVisualization(conceptId);
  }
    
  getUserUnderstanding(conceptId) {
    return this.userUnderstanding.get(conceptId) || 0;
  }
    
  updateConceptVisualization(conceptId) {
    const understanding = this.getUserUnderstanding(conceptId);
        
    // Update node appearance based on understanding
    this.nodes
      .filter(d => d.id === conceptId)
      .select('circle')
      .transition()
      .duration(500)
      .attr('fill-opacity', 0.3 + understanding * 0.7)
      .attr('r', this.options.nodeRadius * (1 + understanding * 0.2));
  }
    
  // Learning path visualization
  showLearningPath(conceptSequence) {
    // Highlight the suggested learning path
    const pathLinks = [];
        
    for (let i = 0; i < conceptSequence.length - 1; i++) {
      const source = conceptSequence[i];
      const target = conceptSequence[i + 1];
            
      const link = this.links.filter(d => 
        (d.source.id === source && d.target.id === target) ||
                (d.source.id === target && d.target.id === source)
      );
            
      if (!link.empty()) {
        pathLinks.push(link);
      }
    }
        
    // Animate the path
    pathLinks.forEach((link, i) => {
      setTimeout(() => {
        link.select('line')
          .transition()
          .duration(500)
          .attr('stroke', '#ffd700')
          .attr('stroke-width', 5);
      }, i * 300);
    });
  }
    
  // Export and sharing
  exportAsImage() {
    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(this.svg.node());
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
        
    canvas.width = this.options.width;
    canvas.height = this.options.height;
        
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jungian-concept-map.png';
        a.click();
        URL.revokeObjectURL(url);
      });
    };
        
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }
    
  createPersonalConceptMap() {
    // Allow users to create their own connections
    // This would enable a drawing mode where users can:
    // - Add their own interpretations
    // - Create personal connections
    // - Save their concept map
  }
    
  // Public API
  updateUnderstanding(conceptId, level) {
    this.trackConceptUnderstanding(conceptId, level);
  }
    
  highlightConcept(conceptId) {
    const node = this.nodes.filter(d => d.id === conceptId);
    if (!node.empty()) {
      this.highlightConnections(node.datum());
    }
  }
    
  showPath(concepts) {
    this.showLearningPath(concepts);
  }
    
  resize(width, height) {
    this.options.width = width;
    this.options.height = height;
        
    this.svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);
        
    this.simulation.force('center', d3.forceCenter(width / 2, height / 2));
    this.simulation.alpha(0.3).restart();
  }
    
  destroy() {
    this.simulation.stop();
    this.svg.remove();
    if (this.tooltip) {
      this.tooltip.remove();
    }
  }
}

// Concept Graph data structure
class ConceptGraph {
  constructor() {
    this.concepts = [];
    this.relationships = [];
    this.conceptMap = new Map();
  }
    
  addConcepts(concepts) {
    concepts.forEach(concept => {
      this.concepts.push(concept);
      this.conceptMap.set(concept.id, concept);
    });
  }
    
  addRelationships(relationships) {
    relationships.forEach(rel => {
      this.relationships.push({
        ...rel,
        source: this.conceptMap.get(rel.source),
        target: this.conceptMap.get(rel.target)
      });
    });
  }
    
  getConcepts() {
    return this.concepts;
  }
    
  getRelationships() {
    return this.relationships;
  }
    
  getConcept(id) {
    return this.conceptMap.get(id);
  }
    
  getRelatedConcepts(conceptId) {
    const related = new Set();
        
    this.relationships.forEach(rel => {
      if (rel.source.id === conceptId) {
        related.add(rel.target);
      } else if (rel.target.id === conceptId) {
        related.add(rel.source);
      }
    });
        
    return Array.from(related);
  }
}

// Pattern Recognizer for learning analytics
class PatternRecognizer {
  constructor() {
    this.patterns = new Map();
  }
    
  analyzeEvent(event, session) {
    // Analyze learning patterns
    // This would implement pattern recognition algorithms
  }
    
  loadPatterns(data) {
    // Load saved patterns
  }
    
  exportPatterns() {
    // Export patterns for saving
    return Array.from(this.patterns.entries());
  }
}

// Recommendation Engine
class RecommendationEngine {
  generatePersonalizedRecommendations(session, patterns) {
    const recommendations = [];
        
    // Analyze session data and patterns
    // Generate recommendations based on:
    // - Learning style
    // - Concept understanding
    // - Struggle areas
    // - Time patterns
        
    return recommendations;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConceptMapper;
}
