/**
 * MagneticField.js
 * Physics simulation for magnetic cursor interactions
 * Implements inverse square law with configurable field strengths
 */

export class MagneticField {
  constructor(options = {}) {
    this.options = {
      fieldStrength: 100,
      maxDistance: 200,
      dampingFactor: 0.85,
      minForce: 0.01,
      maxForce: 10,
      ...options
    };
    
    // Field sources (magnetic elements)
    this.sources = new Map();
    
    // Force calculations
    this.forces = new Map();
    
    // Performance optimization
    this.spatialGrid = new Map();
    this.gridSize = 100;
    
    // Physics state
    this.isActive = true;
    this.frameCount = 0;
  }
  
  /**
   * Add a magnetic source to the field
   * @param {string} id - Unique identifier
   * @param {Object} config - Source configuration
   */
  addSource(id, config) {
    const source = {
      id,
      element: config.element,
      position: this.getElementCenter(config.element),
      strength: config.strength || 1,
      type: config.type || 'attract', // 'attract', 'repel', 'orbit'
      radius: config.radius || 50,
      active: true,
      ...config
    };
    
    this.sources.set(id, source);
    this.updateSpatialGrid(source);
    
    return source;
  }
  
  /**
   * Remove a magnetic source
   * @param {string} id - Source identifier
   */
  removeSource(id) {
    const source = this.sources.get(id);
    if (source) {
      this.removefromSpatialGrid(source);
      this.sources.delete(id);
      this.forces.delete(id);
    }
  }
  
  /**
   * Update source position
   * @param {string} id - Source identifier
   */
  updateSourcePosition(id) {
    const source = this.sources.get(id);
    if (!source) return;
    
    const oldGridKey = this.getGridKey(source.position);
    source.position = this.getElementCenter(source.element);
    const newGridKey = this.getGridKey(source.position);
    
    // Update spatial grid if needed
    if (oldGridKey !== newGridKey) {
      this.removefromSpatialGrid(source, oldGridKey);
      this.updateSpatialGrid(source);
    }
  }
  
  /**
   * Calculate force at a given position
   * @param {Object} position - {x, y} coordinates
   * @returns {Object} Force vector {x, y, magnitude}
   */
  calculateForce(position) {
    if (!this.isActive) {
      return { x: 0, y: 0, magnitude: 0 };
    }
    
    let totalForce = { x: 0, y: 0 };
    
    // Get nearby sources from spatial grid
    const nearbySources = this.getNearbySources(position);
    
    nearbySources.forEach(source => {
      if (!source.active) return;
      
      // Calculate distance
      const dx = source.position.x - position.x;
      const dy = source.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Skip if too far
      if (distance > this.options.maxDistance) return;
      
      // Skip if too close (avoid singularity)
      if (distance < 5) return;
      
      // Calculate force using inverse square law
      let forceMagnitude = (this.options.fieldStrength * source.strength) / (distance * distance);
      
      // Apply distance-based falloff
      const falloff = 1 - (distance / this.options.maxDistance);
      forceMagnitude *= falloff;
      
      // Clamp force
      forceMagnitude = Math.max(
        this.options.minForce,
        Math.min(this.options.maxForce, forceMagnitude)
      );
      
      // Calculate force direction
      const forceDirection = {
        x: dx / distance,
        y: dy / distance
      };
      
      // Apply force based on type
      switch (source.type) {
        case 'attract':
          totalForce.x += forceDirection.x * forceMagnitude;
          totalForce.y += forceDirection.y * forceMagnitude;
          break;
          
        case 'repel':
          totalForce.x -= forceDirection.x * forceMagnitude;
          totalForce.y -= forceDirection.y * forceMagnitude;
          break;
          
        case 'orbit':
          // Perpendicular force for orbital motion
          totalForce.x += -forceDirection.y * forceMagnitude * 0.5;
          totalForce.y += forceDirection.x * forceMagnitude * 0.5;
          break;
      }
    });
    
    // Apply damping
    totalForce.x *= this.options.dampingFactor;
    totalForce.y *= this.options.dampingFactor;
    
    // Calculate magnitude
    const magnitude = Math.sqrt(totalForce.x * totalForce.x + totalForce.y * totalForce.y);
    
    return {
      x: totalForce.x,
      y: totalForce.y,
      magnitude
    };
  }
  
  /**
   * Calculate forces for all sources (for visualization)
   */
  calculateAllForces() {
    this.sources.forEach(source => {
      const force = this.calculateForce(source.position);
      this.forces.set(source.id, force);
    });
    
    return this.forces;
  }
  
  /**
   * Get element center position
   * @param {Element} element - DOM element
   * @returns {Object} Center position {x, y}
   */
  getElementCenter(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
  
  /**
   * Update spatial grid for optimization
   * @param {Object} source - Source object
   */
  updateSpatialGrid(source) {
    const key = this.getGridKey(source.position);
    
    if (!this.spatialGrid.has(key)) {
      this.spatialGrid.set(key, new Set());
    }
    
    this.spatialGrid.get(key).add(source);
  }
  
  /**
   * Remove source from spatial grid
   * @param {Object} source - Source object
   * @param {string} key - Optional grid key
   */
  removefromSpatialGrid(source, key) {
    key = key || this.getGridKey(source.position);
    const cell = this.spatialGrid.get(key);
    
    if (cell) {
      cell.delete(source);
      if (cell.size === 0) {
        this.spatialGrid.delete(key);
      }
    }
  }
  
  /**
   * Get grid key for position
   * @param {Object} position - {x, y} coordinates
   * @returns {string} Grid key
   */
  getGridKey(position) {
    const x = Math.floor(position.x / this.gridSize);
    const y = Math.floor(position.y / this.gridSize);
    return `${x},${y}`;
  }
  
  /**
   * Get nearby sources using spatial grid
   * @param {Object} position - {x, y} coordinates
   * @returns {Array} Nearby sources
   */
  getNearbySources(position) {
    const sources = [];
    const gridX = Math.floor(position.x / this.gridSize);
    const gridY = Math.floor(position.y / this.gridSize);
    
    // Check surrounding cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const cell = this.spatialGrid.get(key);
        
        if (cell) {
          cell.forEach(source => sources.push(source));
        }
      }
    }
    
    return sources;
  }
  
  /**
   * Visualize field (for debugging)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} gridSize - Visualization grid size
   */
  visualize(ctx, gridSize = 20) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw field lines
    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        const force = this.calculateForce({ x, y });
        
        if (force.magnitude > this.options.minForce) {
          // Normalize force for visualization
          const scale = Math.min(force.magnitude * 10, gridSize * 0.8);
          const endX = x + (force.x / force.magnitude) * scale;
          const endY = y + (force.y / force.magnitude) * scale;
          
          // Draw arrow
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(endX, endY);
          
          // Color based on magnitude
          const intensity = Math.min(force.magnitude / this.options.maxForce, 1);
          ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.5})`;
          ctx.lineWidth = 1 + intensity;
          ctx.stroke();
          
          // Arrowhead
          const angle = Math.atan2(endY - y, endX - x);
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - 5 * Math.cos(angle - Math.PI / 6),
            endY - 5 * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - 5 * Math.cos(angle + Math.PI / 6),
            endY - 5 * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
      }
    }
    
    // Draw sources
    this.sources.forEach(source => {
      ctx.beginPath();
      ctx.arc(source.position.x, source.position.y, source.radius, 0, Math.PI * 2);
      
      if (source.type === 'attract') {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
      } else if (source.type === 'repel') {
        ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
      } else {
        ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
      }
      
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.stroke();
    });
  }
  
  /**
   * Enable/disable field
   * @param {boolean} active - Active state
   */
  setActive(active) {
    this.isActive = active;
  }
  
  /**
   * Update field (call each frame)
   */
  update() {
    this.frameCount++;
    
    // Update source positions periodically
    if (this.frameCount % 10 === 0) {
      this.sources.forEach(source => {
        this.updateSourcePosition(source.id);
      });
    }
  }
  
  /**
   * Get field statistics
   * @returns {Object} Field stats
   */
  getStats() {
    return {
      sourceCount: this.sources.size,
      gridCells: this.spatialGrid.size,
      isActive: this.isActive
    };
  }
  
  /**
   * Clear all sources
   */
  clear() {
    this.sources.clear();
    this.forces.clear();
    this.spatialGrid.clear();
  }
}