/**
 * Concept Constellation Navigation
 * 
 * Interactive force-directed graph for exploring relationships between
 * Jung's psychological concepts. Enables any-to-any chapter navigation
 * through conceptual connections.
 * 
 * Premium Design System Component
 */

class ConceptConstellation {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: options.width || 800,
      height: options.height || 600,
      nodeRadius: options.nodeRadius || 20,
      linkDistance: options.linkDistance || 100,
      charge: options.charge || -300,
      ...options
    };
    
    this.nodes = [];
    this.links = [];
    this.simulation = null;
    this.svg = null;
    this.transform = d3.zoomIdentity;
    
    this.init();
  }
  
  init() {
    this.setupData();
    this.createSVG();
    this.setupSimulation();
    this.setupZoom();
    this.render();
    this.bindEvents();
  }
  
  setupData() {
    // Jung's Aion concept relationships
    this.conceptData = {
      nodes: [
        { id: 'ego', name: 'The Ego', chapter: 1, description: 'The conscious personality', x: 0, y: 0 },
        { id: 'shadow', name: 'The Shadow', chapter: 2, description: 'The hidden aspects of personality', x: 100, y: 0 },
        { id: 'anima', name: 'The Anima', chapter: 3, description: 'The feminine aspect in men', x: 50, y: 100 },
        { id: 'animus', name: 'The Animus', chapter: 4, description: 'The masculine aspect in women', x: -50, y: 100 },
        { id: 'self', name: 'The Self', chapter: 14, description: 'The unified conscious and unconscious', x: 0, y: 200 },
        { id: 'persona', name: 'The Persona', chapter: 5, description: 'The mask we present to the world', x: -100, y: 0 },
        { id: 'collective', name: 'Collective Unconscious', chapter: 6, description: 'Shared unconscious content', x: 0, y: -100 },
        { id: 'archetype', name: 'Archetypes', chapter: 7, description: 'Universal symbols and patterns', x: 150, y: -50 },
        { id: 'individuation', name: 'Individuation', chapter: 13, description: 'The process of becoming whole', x: 0, y: 150 },
        { id: 'mandala', name: 'The Mandala', chapter: 12, description: 'Symbol of wholeness', x: 100, y: 150 }
      ],
      
      links: [
        { source: 'ego', target: 'shadow', strength: 1.0 },
        { source: 'ego', target: 'persona', strength: 0.8 },
        { source: 'shadow', target: 'anima', strength: 0.7 },
        { source: 'shadow', target: 'animus', strength: 0.7 },
        { source: 'anima', target: 'self', strength: 0.9 },
        { source: 'animus', target: 'self', strength: 0.9 },
        { source: 'collective', target: 'archetype', strength: 0.8 },
        { source: 'archetype', target: 'anima', strength: 0.6 },
        { source: 'archetype', target: 'animus', strength: 0.6 },
        { source: 'individuation', target: 'self', strength: 1.0 },
        { source: 'mandala', target: 'self', strength: 0.8 },
        { source: 'ego', target: 'collective', strength: 0.5 }
      ]
    };
    
    this.nodes = this.conceptData.nodes.map(d => ({...d}));
    this.links = this.conceptData.links.map(d => ({...d}));
  }
  
  createSVG() {
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .attr('viewBox', [0, 0, this.options.width, this.options.height])
      .style('background', 'var(--bg-primary)');
    
    // Create main group for zoom/pan
    this.g = this.svg.append('g');
  }
  
  setupSimulation() {
    this.simulation = d3.forceSimulation(this.nodes)
      .force('link', d3.forceLink(this.links)
        .id(d => d.id)
        .distance(this.options.linkDistance)
        .strength(d => d.strength))
      .force('charge', d3.forceManyBody()
        .strength(this.options.charge))
      .force('center', d3.forceCenter(
        this.options.width / 2, 
        this.options.height / 2
      ))
      .force('collision', d3.forceCollide()
        .radius(this.options.nodeRadius + 5));
  }
  
  setupZoom() {
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        this.transform = event.transform;
        this.g.attr('transform', this.transform);
      });
    
    this.svg.call(zoom);
  }
  
  render() {
    // Render links
    this.linkElements = this.g.selectAll('.constellation-link')
      .data(this.links)
      .enter()
      .append('line')
      .attr('class', 'constellation-link')
      .style('stroke', 'var(--border-default)')
      .style('stroke-width', d => Math.sqrt(d.strength) * 2)
      .style('stroke-opacity', 0.6);
    
    // Render nodes
    this.nodeGroups = this.g.selectAll('.constellation-node')
      .data(this.nodes)
      .enter()
      .append('g')
      .attr('class', 'constellation-node')
      .style('cursor', 'pointer');
    
    // Node circles
    this.nodeGroups.append('circle')
      .attr('r', this.options.nodeRadius)
      .style('fill', 'var(--surface-primary)')
      .style('stroke', 'var(--border-strong)')
      .style('stroke-width', 2)
      .style('transition', 'all 0.3s ease');
    
    // Node labels
    this.nodeGroups.append('text')
      .text(d => d.name)
      .attr('dy', -25)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--text-primary)')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('pointer-events', 'none');
    
    // Chapter numbers
    this.nodeGroups.append('text')
      .text(d => d.chapter)
      .attr('dy', 5)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--text-secondary)')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('pointer-events', 'none');
    
    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      this.linkElements
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      this.nodeGroups
        .attr('transform', d => `translate(${d.x}, ${d.y})`);
    });
  }
  
  bindEvents() {
    // Node interactions
    this.nodeGroups
      .on('mouseenter', (event, d) => {
        this.highlightNode(d);
        this.showTooltip(event, d);
      })
      .on('mouseleave', (event, d) => {
        this.unhighlightNode(d);
        this.hideTooltip();
      })
      .on('click', (event, d) => {
        this.navigateToChapter(d);
      })
      .call(d3.drag()
        .on('start', this.dragStarted.bind(this))
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragEnded.bind(this)));
    
    // Keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.resetView();
      }
    });
  }
  
  highlightNode(node) {
    // Highlight connected nodes and links
    const connectedNodeIds = new Set();
    connectedNodeIds.add(node.id);
    
    this.links.forEach(link => {
      if (link.source.id === node.id || link.target.id === node.id) {
        connectedNodeIds.add(link.source.id);
        connectedNodeIds.add(link.target.id);
      }
    });
    
    // Fade non-connected elements
    this.nodeGroups
      .style('opacity', d => connectedNodeIds.has(d.id) ? 1 : 0.3);
    
    this.linkElements
      .style('opacity', d => 
        d.source.id === node.id || d.target.id === node.id ? 1 : 0.1);
    
    // Highlight current node
    this.nodeGroups
      .filter(d => d.id === node.id)
      .select('circle')
      .style('fill', 'var(--surface-hover)')
      .style('stroke', 'var(--text-primary)');
  }
  
  unhighlightNode(node) {
    // Reset all elements
    this.nodeGroups.style('opacity', 1);
    this.linkElements.style('opacity', 0.6);
    
    this.nodeGroups
      .select('circle')
      .style('fill', 'var(--surface-primary)')
      .style('stroke', 'var(--border-strong)');
  }
  
  showTooltip(event, node) {
    const tooltip = d3.select('body').selectAll('.constellation-tooltip')
      .data([1]);
    
    const tooltipEnter = tooltip.enter()
      .append('div')
      .attr('class', 'constellation-tooltip')
      .style('position', 'absolute')
      .style('background', 'var(--surface-primary)')
      .style('border', '1px solid var(--border-strong)')
      .style('border-radius', '4px')
      .style('padding', '12px')
      .style('font-size', '14px')
      .style('color', 'var(--text-primary)')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('opacity', 0);
    
    const tooltipMerge = tooltipEnter.merge(tooltip);
    
    tooltipMerge
      .html(`
        <strong>${node.name}</strong><br>
        Chapter ${node.chapter}<br>
        <em>${node.description}</em>
      `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px')
      .transition()
      .duration(200)
      .style('opacity', 1);
  }
  
  hideTooltip() {
    d3.select('.constellation-tooltip')
      .transition()
      .duration(200)
      .style('opacity', 0)
      .remove();
  }
  
  navigateToChapter(node) {
    // Trigger chapter navigation with smooth transition
    this.dispatchEvent('navigate', {
      chapter: node.chapter,
      concept: node.id,
      name: node.name
    });
  }
  
  dispatchEvent(type, detail) {
    const event = new CustomEvent(`constellation:${type}`, { detail });
    this.container.dispatchEvent(event);
  }
  
  // Drag handlers
  dragStarted(event, d) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  dragEnded(event, d) {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  
  resetView() {
    this.svg
      .transition()
      .duration(750)
      .call(d3.zoom().transform, d3.zoomIdentity);
  }
  
  focusOnNode(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const scale = 1.5;
    const translateX = this.options.width / 2 - node.x * scale;
    const translateY = this.options.height / 2 - node.y * scale;
    
    this.svg
      .transition()
      .duration(750)
      .call(d3.zoom().transform, 
        d3.zoomIdentity.translate(translateX, translateY).scale(scale));
  }
  
  // Public API
  getConnectedConcepts(nodeId) {
    const connected = [];
    this.links.forEach(link => {
      if (link.source.id === nodeId) {
        connected.push(link.target);
      } else if (link.target.id === nodeId) {
        connected.push(link.source);
      }
    });
    return connected;
  }
  
  updateNodeVisitedState(nodeId, visited = true) {
    this.nodeGroups
      .filter(d => d.id === nodeId)
      .select('circle')
      .style('fill', visited ? 'var(--surface-active)' : 'var(--surface-primary)');
  }
  
  destroy() {
    if (this.simulation) {
      this.simulation.stop();
    }
    if (this.svg) {
      this.svg.remove();
    }
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConceptConstellation;
}

// CSS styles (to be included in the main CSS)
const constellationStyles = `
.constellation-node {
  transition: opacity 0.3s ease;
}

.constellation-node:hover circle {
  filter: brightness(1.2);
}

.constellation-link {
  transition: opacity 0.3s ease;
}

.constellation-tooltip {
  font-family: var(--font-primary);
  box-shadow: var(--shadow-lg);
  max-width: 200px;
  line-height: 1.4;
}
`;