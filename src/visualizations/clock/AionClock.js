/**
 * AionClock.js - Main visualization class for the 2000-year zodiacal cycle
 * Represents the Great Year and the precession of equinoxes
 */

class AionClock {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            width: options.width || 800,
            height: options.height || 800,
            innerRadius: options.innerRadius || 150,
            outerRadius: options.outerRadius || 350,
            currentYear: options.currentYear || new Date().getFullYear(),
            animationDuration: options.animationDuration || 1000,
            ...options
        };
        
        this.zodiacRenderer = null;
        this.timeController = null;
        this.svg = null;
        this.tooltip = null;
        this.rotationAngle = 0;
        this.isPaused = true;
        this.speed = 1;
        
        // Great Year constants
        this.GREAT_YEAR_DURATION = 25920; // years
        this.AGE_DURATION = 2160; // years per zodiac age
        this.DEGREE_PER_YEAR = 360 / this.GREAT_YEAR_DURATION;
        
        // Historical events with their years and significance
        this.historicalEvents = [
            { year: -2150, event: "Age of Aries begins", significance: "Ram symbolism, warrior cultures" },
            { year: -1200, event: "Moses and the Golden Calf", significance: "Transition from Taurus worship" },
            { year: -500, event: "Buddha and Pythagoras", significance: "Axial Age transformation" },
            { year: 0, event: "Birth of Christ", significance: "Fish symbolism, Age of Pisces" },
            { year: 30, event: "Crucifixion", significance: "Symbol of self-sacrifice" },
            { year: 325, event: "Council of Nicaea", significance: "Christianity formalized" },
            { year: 1453, event: "Fall of Constantinople", significance: "End of Byzantine Empire" },
            { year: 1517, event: "Protestant Reformation", significance: "Religious transformation" },
            { year: 1781, event: "Discovery of Uranus", significance: "Expansion of consciousness" },
            { year: 1846, event: "Discovery of Neptune", significance: "Unconscious depths revealed" },
            { year: 1930, event: "Discovery of Pluto", significance: "Shadow and transformation" },
            { year: 1950, event: "Jung writes Aion", significance: "Psychological interpretation of the aeon" },
            { year: 2000, event: "Millennium", significance: "Approaching Age of Aquarius" },
            { year: 2150, event: "Age of Aquarius begins", significance: "Water bearer, collective consciousness" }
        ];
        
        this.init();
    }
    
    init() {
        this.setupSVG();
        this.setupTooltip();
        this.zodiacRenderer = new ZodiacRenderer(this);
        this.timeController = new TimeController(this);
        this.render();
        this.setupInteractions();
    }
    
    setupSVG() {
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.options.width)
            .attr('height', this.options.height)
            .attr('class', 'aion-clock-svg');
            
        // Create main group centered
        this.mainGroup = this.svg.append('g')
            .attr('transform', `translate(${this.options.width/2}, ${this.options.height/2})`);
            
        // Create layers
        this.backgroundLayer = this.mainGroup.append('g').attr('class', 'background-layer');
        this.zodiacLayer = this.mainGroup.append('g').attr('class', 'zodiac-layer');
        this.eventsLayer = this.mainGroup.append('g').attr('class', 'events-layer');
        this.indicatorLayer = this.mainGroup.append('g').attr('class', 'indicator-layer');
        this.overlayLayer = this.mainGroup.append('g').attr('class', 'overlay-layer');
    }
    
    setupTooltip() {
        this.tooltip = d3.select(this.container)
            .append('div')
            .attr('class', 'aion-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('pointer-events', 'none');
    }
    
    render() {
        this.renderBackground();
        this.zodiacRenderer.render();
        this.renderEvents();
        this.renderCurrentIndicator();
        this.renderCenterInfo();
    }
    
    renderBackground() {
        // Outer circle
        this.backgroundLayer.append('circle')
            .attr('r', this.options.outerRadius)
            .attr('class', 'outer-circle')
            .attr('fill', 'none')
            .attr('stroke', '#333')
            .attr('stroke-width', 2);
            
        // Inner circle
        this.backgroundLayer.append('circle')
            .attr('r', this.options.innerRadius)
            .attr('class', 'inner-circle')
            .attr('fill', 'none')
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
            
        // Add concentric guide circles
        const circles = [0.3, 0.5, 0.7, 0.9];
        circles.forEach(factor => {
            const radius = this.options.innerRadius + 
                (this.options.outerRadius - this.options.innerRadius) * factor;
            this.backgroundLayer.append('circle')
                .attr('r', radius)
                .attr('class', 'guide-circle')
                .attr('fill', 'none')
                .attr('stroke', '#666')
                .attr('stroke-width', 0.5)
                .attr('stroke-dasharray', '2,4')
                .attr('opacity', 0.3);
        });
    }
    
    renderEvents() {
        // Clear existing events
        this.eventsLayer.selectAll('.event-marker').remove();
        
        // Calculate event positions
        this.historicalEvents.forEach(event => {
            const angle = this.yearToAngle(event.year) - this.rotationAngle;
            const radius = this.options.innerRadius + 
                (this.options.outerRadius - this.options.innerRadius) * 0.8;
            
            const x = radius * Math.cos((angle - 90) * Math.PI / 180);
            const y = radius * Math.sin((angle - 90) * Math.PI / 180);
            
            const eventGroup = this.eventsLayer.append('g')
                .attr('class', 'event-marker')
                .attr('transform', `translate(${x}, ${y})`);
                
            // Event dot
            eventGroup.append('circle')
                .attr('r', 4)
                .attr('fill', event.year <= this.options.currentYear ? '#000' : '#999')
                .attr('opacity', 0.8)
                .on('mouseover', () => this.showEventTooltip(event))
                .on('mouseout', () => this.hideTooltip());
                
            // Radial line
            eventGroup.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', -x * 0.1)
                .attr('y2', -y * 0.1)
                .attr('stroke', '#666')
                .attr('stroke-width', 0.5)
                .attr('opacity', 0.5);
        });
    }
    
    renderCurrentIndicator() {
        // Remove existing indicator
        this.indicatorLayer.selectAll('.current-indicator').remove();
        
        const currentAngle = this.yearToAngle(this.options.currentYear) - this.rotationAngle;
        
        // Create indicator group
        const indicator = this.indicatorLayer.append('g')
            .attr('class', 'current-indicator')
            .attr('transform', `rotate(${currentAngle})`);
            
        // Indicator line
        indicator.append('line')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', -this.options.outerRadius - 20)
            .attr('stroke', '#000')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,3');
            
        // Indicator arrow
        indicator.append('path')
            .attr('d', 'M -10,-' + this.options.outerRadius + ' L 0,-' + 
                (this.options.outerRadius + 15) + ' L 10,-' + this.options.outerRadius)
            .attr('fill', 'none')
            .attr('stroke', '#000')
            .attr('stroke-width', 2);
            
        // Year label
        indicator.append('text')
            .attr('x', 0)
            .attr('y', -this.options.outerRadius - 25)
            .attr('text-anchor', 'middle')
            .attr('class', 'year-label')
            .text(this.options.currentYear);
    }
    
    renderCenterInfo() {
        // Center circle
        this.overlayLayer.append('circle')
            .attr('r', this.options.innerRadius * 0.6)
            .attr('fill', '#fff')
            .attr('stroke', '#333')
            .attr('stroke-width', 1);
            
        // Current age info
        const currentAge = this.getCurrentAge();
        
        this.overlayLayer.append('text')
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('class', 'age-name')
            .text(`Age of ${currentAge.name}`);
            
        this.overlayLayer.append('text')
            .attr('y', 10)
            .attr('text-anchor', 'middle')
            .attr('class', 'age-years')
            .text(`${Math.abs(currentAge.yearsRemaining)} years ${currentAge.yearsRemaining > 0 ? 'remaining' : 'ago'}`);
            
        // Speed indicator
        this.overlayLayer.append('text')
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .attr('class', 'speed-indicator')
            .text(`Speed: ${this.speed}x`);
    }
    
    yearToAngle(year) {
        // Convert year to angle on the clock
        // Year 0 (Christ) is at top (0 degrees)
        // Positive angles go clockwise (future)
        return year * this.DEGREE_PER_YEAR;
    }
    
    angleToYear(angle) {
        return angle / this.DEGREE_PER_YEAR;
    }
    
    getCurrentAge() {
        // Calculate current zodiac age
        const yearInCycle = ((this.options.currentYear % this.GREAT_YEAR_DURATION) + 
            this.GREAT_YEAR_DURATION) % this.GREAT_YEAR_DURATION;
        const ageIndex = Math.floor(yearInCycle / this.AGE_DURATION);
        const yearInAge = yearInCycle % this.AGE_DURATION;
        const yearsRemaining = this.AGE_DURATION - yearInAge;
        
        // Zodiac ages in order (precession goes backwards)
        const ages = [
            'Pisces', 'Aquarius', 'Capricorn', 'Sagittarius', 
            'Scorpio', 'Libra', 'Virgo', 'Leo', 
            'Cancer', 'Gemini', 'Taurus', 'Aries'
        ];
        
        return {
            name: ages[ageIndex],
            index: ageIndex,
            yearInAge: yearInAge,
            yearsRemaining: yearsRemaining
        };
    }
    
    showEventTooltip(event) {
        const html = `
            <div class="tooltip-header">${event.year > 0 ? event.year + ' CE' : Math.abs(event.year) + ' BCE'}</div>
            <div class="tooltip-event">${event.event}</div>
            <div class="tooltip-significance">${event.significance}</div>
        `;
        
        this.tooltip
            .html(html)
            .style('opacity', 0.9)
            .style('left', (d3.event.pageX + 10) + 'px')
            .style('top', (d3.event.pageY - 10) + 'px');
    }
    
    hideTooltip() {
        this.tooltip
            .style('opacity', 0);
    }
    
    setupInteractions() {
        // Drag to rotate
        const drag = d3.drag()
            .on('start', () => {
                this.dragStartAngle = Math.atan2(d3.event.y, d3.event.x) * 180 / Math.PI;
                this.dragStartRotation = this.rotationAngle;
            })
            .on('drag', () => {
                const currentAngle = Math.atan2(d3.event.y, d3.event.x) * 180 / Math.PI;
                const deltaAngle = currentAngle - this.dragStartAngle;
                this.rotationAngle = this.dragStartRotation + deltaAngle;
                this.updateRotation();
            });
            
        this.svg.call(drag);
        
        // Zoom
        const zoom = d3.zoom()
            .scaleExtent([0.5, 2])
            .on('zoom', () => {
                this.mainGroup.attr('transform', 
                    `translate(${this.options.width/2}, ${this.options.height/2}) scale(${d3.event.transform.k})`);
            });
            
        this.svg.call(zoom);
    }
    
    updateRotation() {
        this.zodiacLayer
            .transition()
            .duration(100)
            .attr('transform', `rotate(${this.rotationAngle})`);
            
        this.renderEvents();
        this.renderCurrentIndicator();
    }
    
    animateToYear(targetYear, duration = 1000) {
        const startYear = this.options.currentYear;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.options.currentYear = Math.round(startYear + (targetYear - startYear) * easeProgress);
            this.renderCurrentIndicator();
            this.renderCenterInfo();
            this.renderEvents();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    play() {
        this.isPaused = false;
        this.animate();
    }
    
    pause() {
        this.isPaused = true;
    }
    
    setSpeed(speed) {
        this.speed = speed;
        this.renderCenterInfo();
    }
    
    animate() {
        if (this.isPaused) return;
        
        // Update year based on speed
        this.options.currentYear += this.speed;
        
        // Update visualization
        this.renderCurrentIndicator();
        this.renderCenterInfo();
        this.renderEvents();
        
        // Continue animation
        requestAnimationFrame(() => this.animate());
    }
}