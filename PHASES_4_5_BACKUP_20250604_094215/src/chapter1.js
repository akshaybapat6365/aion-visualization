// Chapter 1: The Ego - Interactive Visualizations

class ConsciousnessField {
  constructor() {
    this.canvas = document.getElementById('consciousness-field');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.egoStrength = 50;
    this.awarenessLevel = 30;
        
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
        
    // Create particles representing conscious contents
    this.createParticles();
        
    // Setup controls
    this.setupControls();
        
    // Start animation
    this.animate();
        
    // Handle mouse interaction
    this.setupMouseInteraction();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
    this.centerX = rect.width / 2;
    this.centerY = rect.height / 2;
  }

  createParticles() {
    const particleCount = 100;
        
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 200 + 50;
            
      this.particles.push({
        x: this.centerX + Math.cos(angle) * distance,
        y: this.centerY + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.5,
        type: Math.random() > 0.7 ? 'shadow' : 'conscious'
      });
    }
  }

  setupControls() {
    const egoControl = document.getElementById('ego-strength');
    const awarenessControl = document.getElementById('awareness-level');
        
    egoControl.addEventListener('input', (e) => {
      this.egoStrength = parseInt(e.target.value);
    });
        
    awarenessControl.addEventListener('input', (e) => {
      this.awarenessLevel = parseInt(e.target.value);
    });
  }

  setupMouseInteraction() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
            
      // Repel particles from mouse
      this.particles.forEach(particle => {
        const dx = particle.x - x;
        const dy = particle.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
                
        if (distance < 100) {
          const force = (100 - distance) / 100;
          particle.vx += (dx / distance) * force * 0.5;
          particle.vy += (dy / distance) * force * 0.5;
        }
      });
    });
  }

  animate() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
    // Draw ego center
    this.drawEgoCenter();
        
    // Update and draw particles
    this.updateParticles();
        
    // Draw awareness boundary
    this.drawAwarenessBoundary();
        
    requestAnimationFrame(() => this.animate());
  }

  drawEgoCenter() {
    const egoRadius = this.egoStrength * 0.8 + 20;
        
    // Outer glow
    const gradient = this.ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, egoRadius * 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
    // Core
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, egoRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fill();
        
    // Inner void
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, egoRadius * 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fill();
  }

  updateParticles() {
    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
            
      // Attract to center based on ego strength
      const dx = this.centerX - particle.x;
      const dy = this.centerY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
            
      const attraction = (this.egoStrength / 100) * 0.1;
      particle.vx += (dx / distance) * attraction;
      particle.vy += (dy / distance) * attraction;
            
      // Apply friction
      particle.vx *= 0.98;
      particle.vy *= 0.98;
            
      // Keep within bounds
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
      // Draw particle
      const opacity = particle.type === 'conscious' 
        ? particle.opacity * (this.awarenessLevel / 100)
        : particle.opacity * 0.3;
            
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.type === 'conscious'
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(139, 92, 246, ${opacity})`;
      this.ctx.fill();
    });
  }

  drawAwarenessBoundary() {
    const radius = (this.awarenessLevel / 100) * 150 + 50;
        
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 10]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
}

// Ego-Self Axis Visualization
class EgoSelfAxis {
  constructor() {
    this.container = document.getElementById('ego-self-axis');
    if (!this.container) return;
        
    this.width = this.container.offsetWidth;
    this.height = 400;
        
    this.init();
  }

  init() {
    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
        
    // Create gradient definitions
    const defs = this.svg.append('defs');
        
    const gradient = defs.append('linearGradient')
      .attr('id', 'ego-self-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
        
    gradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', 'var(--primary)')
      .style('stop-opacity', 1);
        
    gradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', 'var(--secondary)')
      .style('stop-opacity', 1);
        
    this.drawAxis();
    this.animateConnection();
  }

  drawAxis() {
    const centerY = this.height / 2;
    const egoX = this.width * 0.25;
    const selfX = this.width * 0.75;
        
    // Connection line
    this.connection = this.svg.append('line')
      .attr('x1', egoX)
      .attr('y1', centerY)
      .attr('x2', selfX)
      .attr('y2', centerY)
      .attr('stroke', 'url(#ego-self-gradient)')
      .attr('stroke-width', 3)
      .attr('opacity', 0.6);
        
    // Ego circle
    const egoGroup = this.svg.append('g')
      .attr('transform', `translate(${egoX}, ${centerY})`);
        
    egoGroup.append('circle')
      .attr('r', 40)
      .attr('fill', 'none')
      .attr('stroke', 'var(--primary)')
      .attr('stroke-width', 2);
        
    egoGroup.append('circle')
      .attr('r', 20)
      .attr('fill', 'var(--primary)')
      .attr('opacity', 0.8);
        
    egoGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 60)
      .attr('fill', 'var(--text-primary)')
      .style('font-size', '1.1rem')
      .text('Ego');
        
    // Self mandala
    const selfGroup = this.svg.append('g')
      .attr('transform', `translate(${selfX}, ${centerY})`);
        
    // Outer circle
    selfGroup.append('circle')
      .attr('r', 60)
      .attr('fill', 'none')
      .attr('stroke', 'var(--secondary)')
      .attr('stroke-width', 2);
        
    // Square
    selfGroup.append('rect')
      .attr('x', -42)
      .attr('y', -42)
      .attr('width', 84)
      .attr('height', 84)
      .attr('fill', 'none')
      .attr('stroke', 'var(--secondary)')
      .attr('stroke-width', 1.5)
      .attr('transform', 'rotate(45)');
        
    // Inner circle
    selfGroup.append('circle')
      .attr('r', 30)
      .attr('fill', 'none')
      .attr('stroke', 'var(--accent)')
      .attr('stroke-width', 1);
        
    // Center
    selfGroup.append('circle')
      .attr('r', 10)
      .attr('fill', 'var(--secondary)')
      .attr('opacity', 0.8);
        
    selfGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 80)
      .attr('fill', 'var(--text-primary)')
      .style('font-size', '1.1rem')
      .text('Self');
        
    // Energy particles along the axis
    this.createEnergyFlow(egoX, selfX, centerY);
  }

  createEnergyFlow(startX, endX, y) {
    const particleCount = 5;
        
    for (let i = 0; i < particleCount; i++) {
      const particle = this.svg.append('circle')
        .attr('r', 3)
        .attr('cx', startX)
        .attr('cy', y)
        .attr('fill', 'var(--accent)')
        .attr('opacity', 0);
            
      this.animateParticle(particle, startX, endX, y, i * 1000);
    }
  }

  animateParticle(particle, startX, endX, y, delay) {
    particle.transition()
      .delay(delay)
      .duration(3000)
      .attr('cx', endX)
      .attr('opacity', 0.8)
      .transition()
      .duration(1000)
      .attr('opacity', 0)
      .on('end', () => {
        particle.attr('cx', startX);
        this.animateParticle(particle, startX, endX, y, 0);
      });
  }

  animateConnection() {
    // Pulsing connection
    const pulse = () => {
      this.connection.transition()
        .duration(2000)
        .attr('opacity', 0.8)
        .transition()
        .duration(2000)
        .attr('opacity', 0.4)
        .on('end', pulse);
    };
    pulse();
  }
}

// Historical Timeline
class EgoHistoryTimeline {
  constructor() {
    this.container = document.getElementById('ego-history-timeline');
    if (!this.container) return;
        
    this.data = [
      { year: -3000, event: 'Pre-conscious unity', egoStrength: 5 },
      { year: -500, event: 'Greek rational consciousness', egoStrength: 25 },
      { year: 0, event: 'Christ - Ego-Self axis established', egoStrength: 40 },
      { year: 500, event: 'Medieval collective ego', egoStrength: 30 },
      { year: 1500, event: 'Renaissance individuation', egoStrength: 50 },
      { year: 1900, event: 'Modern ego inflation', egoStrength: 70 },
      { year: 2000, event: 'Ego-Self reconnection begins', egoStrength: 60 },
      { year: 2150, event: 'Aquarian ego integration', egoStrength: 55 }
    ];
        
    this.init();
  }

  init() {
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    this.width = this.container.offsetWidth - margin.left - margin.right;
    this.height = 160 - margin.top - margin.bottom;
        
    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.width + margin.left + margin.right)
      .attr('height', this.height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
        
    // Scales
    this.xScale = d3.scaleLinear()
      .domain([-3000, 2150])
      .range([0, this.width]);
        
    this.yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([this.height, 0]);
        
    this.drawTimeline();
  }

  drawTimeline() {
    // X-axis
    this.svg.append('g')
      .attr('transform', `translate(0,${this.height})`)
      .call(d3.axisBottom(this.xScale)
        .tickFormat(d => d < 0 ? `${Math.abs(d)} BCE` : `${d} CE`))
      .style('color', 'var(--text-secondary)');
        
    // Area chart
    const area = d3.area()
      .x(d => this.xScale(d.year))
      .y0(this.height)
      .y1(d => this.yScale(d.egoStrength))
      .curve(d3.curveCatmullRom);
        
    // Gradient
    const gradient = this.svg.append('defs')
      .append('linearGradient')
      .attr('id', 'ego-timeline-gradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');
        
    gradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', 'var(--primary)')
      .style('stop-opacity', 0.8);
        
    gradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', 'var(--primary)')
      .style('stop-opacity', 0.1);
        
    // Draw area
    this.svg.append('path')
      .datum(this.data)
      .attr('fill', 'url(#ego-timeline-gradient)')
      .attr('d', area);
        
    // Draw line
    const line = d3.line()
      .x(d => this.xScale(d.year))
      .y(d => this.yScale(d.egoStrength))
      .curve(d3.curveCatmullRom);
        
    this.svg.append('path')
      .datum(this.data)
      .attr('fill', 'none')
      .attr('stroke', 'var(--primary)')
      .attr('stroke-width', 2)
      .attr('d', line);
        
    // Add points
    this.svg.selectAll('.timeline-point')
      .data(this.data)
      .enter().append('circle')
      .attr('class', 'timeline-point')
      .attr('cx', d => this.xScale(d.year))
      .attr('cy', d => this.yScale(d.egoStrength))
      .attr('r', 4)
      .attr('fill', 'var(--primary)')
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip());
  }

  showTooltip(event, d) {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'timeline-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.9)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '8px')
      .style('font-size', '0.9rem')
      .style('pointer-events', 'none')
      .style('opacity', 0);
        
    tooltip.html(`<strong>${d.year < 0 ? Math.abs(d.year) + ' BCE' : d.year + ' CE'}</strong><br/>${d.event}`)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px')
      .transition()
      .duration(200)
      .style('opacity', 1);
  }

  hideTooltip() {
    d3.selectAll('.timeline-tooltip').remove();
  }
}

// Progress tracking
class ChapterProgress {
  constructor() {
    this.chapterNumber = 1;
    this.checkpoints = ['intro', 'consciousness', 'ego-self', 'functions', 'history', 'reflection'];
    this.completed = new Set();
        
    this.init();
  }

  init() {
    // Load saved progress
    const saved = localStorage.getItem(`chapter${this.chapterNumber}Progress`);
    if (saved) {
      this.completed = new Set(JSON.parse(saved));
    }
        
    // Track scroll progress
    this.trackScrollProgress();
        
    // Update progress display
    this.updateProgressDisplay();
  }

  trackScrollProgress() {
    const sections = document.querySelectorAll('.concept-section, .practice-section');
        
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const index = Array.from(sections).indexOf(entry.target);
          if (index < this.checkpoints.length) {
            this.completed.add(this.checkpoints[index]);
            this.saveProgress();
            this.updateProgressDisplay();
          }
        }
      });
    }, { threshold: 0.5 });
        
    sections.forEach(section => observer.observe(section));
  }

  saveProgress() {
    localStorage.setItem(`chapter${this.chapterNumber}Progress`, 
      JSON.stringify(Array.from(this.completed)));
        
    // Update overall progress
    const progress = (this.completed.size / this.checkpoints.length) * 100;
    const allProgress = JSON.parse(localStorage.getItem('aionProgress') || '{}');
    allProgress[this.chapterNumber] = progress;
    localStorage.setItem('aionProgress', JSON.stringify(allProgress));
  }

  updateProgressDisplay() {
    const progress = (this.completed.size / this.checkpoints.length) * 100;
        
    const progressFill = document.querySelector('.progress-fill-mini');
    const progressText = document.querySelector('.progress-text-mini');
        
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
        
    if (progressText) {
      progressText.textContent = `${Math.round(progress)}% Complete`;
    }
  }
}

// Reflection saver
class ReflectionManager {
  constructor() {
    this.button = document.getElementById('save-reflection');
    if (this.button) {
      this.button.addEventListener('click', () => this.saveReflection());
    }
  }

  saveReflection() {
    const reflection = {
      chapter: 1,
      date: new Date().toISOString(),
      completed: true
    };
        
    const reflections = JSON.parse(localStorage.getItem('aionReflections') || '[]');
    reflections.push(reflection);
    localStorage.setItem('aionReflections', JSON.stringify(reflections));
        
    // Visual feedback
    this.button.textContent = 'Reflection Saved ✓';
    this.button.style.background = 'var(--secondary)';
        
    setTimeout(() => {
      this.button.textContent = 'Save Reflection';
      this.button.style.background = '';
    }, 2000);
  }
}

// Initialize all components
document.addEventListener('DOMContentLoaded', () => {
  new ConsciousnessField();
  new EgoSelfAxis();
  new EgoHistoryTimeline();
  new ChapterProgress();
  new ReflectionManager();
});