/**
 * ZodiacRenderer.js - Handles rendering of zodiac symbols and age boundaries
 */

class ZodiacRenderer {
    constructor(aionClock) {
        this.clock = aionClock;
        this.zodiacSigns = [
            { name: 'Aries', symbol: '♈', element: 'Fire', quality: 'Cardinal', ruler: 'Mars' },
            { name: 'Taurus', symbol: '♉', element: 'Earth', quality: 'Fixed', ruler: 'Venus' },
            { name: 'Gemini', symbol: '♊', element: 'Air', quality: 'Mutable', ruler: 'Mercury' },
            { name: 'Cancer', symbol: '♋', element: 'Water', quality: 'Cardinal', ruler: 'Moon' },
            { name: 'Leo', symbol: '♌', element: 'Fire', quality: 'Fixed', ruler: 'Sun' },
            { name: 'Virgo', symbol: '♍', element: 'Earth', quality: 'Mutable', ruler: 'Mercury' },
            { name: 'Libra', symbol: '♎', element: 'Air', quality: 'Cardinal', ruler: 'Venus' },
            { name: 'Scorpio', symbol: '♏', element: 'Water', quality: 'Fixed', ruler: 'Pluto' },
            { name: 'Sagittarius', symbol: '♐', element: 'Fire', quality: 'Mutable', ruler: 'Jupiter' },
            { name: 'Capricorn', symbol: '♑', element: 'Earth', quality: 'Cardinal', ruler: 'Saturn' },
            { name: 'Aquarius', symbol: '♒', element: 'Air', quality: 'Fixed', ruler: 'Uranus' },
            { name: 'Pisces', symbol: '♓', element: 'Water', quality: 'Mutable', ruler: 'Neptune' }
        ];
        
        // Precession order (reverse of normal zodiac)
        this.precessionOrder = [...this.zodiacSigns].reverse();
    }
    
    render() {
        this.renderZodiacWheel();
        this.renderAgeBoundaries();
        this.renderSymbols();
        this.renderAgeLabels();
    }
    
    renderZodiacWheel() {
        const anglePerSign = 360 / 12;
        
        // Create segments for each zodiac sign
        this.zodiacSigns.forEach((sign, index) => {
            const startAngle = index * anglePerSign - 90; // Start from top
            const endAngle = (index + 1) * anglePerSign - 90;
            
            const arc = d3.arc()
                .innerRadius(this.clock.options.innerRadius)
                .outerRadius(this.clock.options.outerRadius)
                .startAngle(startAngle * Math.PI / 180)
                .endAngle(endAngle * Math.PI / 180);
                
            // Create segment
            const segment = this.clock.zodiacLayer.append('path')
                .datum(sign)
                .attr('d', arc)
                .attr('class', `zodiac-segment ${sign.name.toLowerCase()}`)
                .attr('fill', 'none')
                .attr('stroke', '#666')
                .attr('stroke-width', 1)
                .on('mouseover', (d) => this.highlightSign(d))
                .on('mouseout', () => this.unhighlightAll());
                
            // Add element indicator arc
            const elementRadius = this.clock.options.innerRadius - 10;
            const elementArc = d3.arc()
                .innerRadius(elementRadius - 5)
                .outerRadius(elementRadius)
                .startAngle(startAngle * Math.PI / 180)
                .endAngle(endAngle * Math.PI / 180);
                
            this.clock.zodiacLayer.append('path')
                .attr('d', elementArc)
                .attr('class', `element-indicator ${sign.element.toLowerCase()}`)
                .attr('fill', this.getElementColor(sign.element))
                .attr('opacity', 0.3);
        });
    }
    
    renderAgeBoundaries() {
        const anglePerSign = 360 / 12;
        
        // Render age boundary lines
        for (let i = 0; i < 12; i++) {
            const angle = i * anglePerSign;
            const x1 = this.clock.options.innerRadius * Math.cos((angle - 90) * Math.PI / 180);
            const y1 = this.clock.options.innerRadius * Math.sin((angle - 90) * Math.PI / 180);
            const x2 = this.clock.options.outerRadius * Math.cos((angle - 90) * Math.PI / 180);
            const y2 = this.clock.options.outerRadius * Math.sin((angle - 90) * Math.PI / 180);
            
            this.clock.zodiacLayer.append('line')
                .attr('x1', x1)
                .attr('y1', y1)
                .attr('x2', x2)
                .attr('y2', y2)
                .attr('class', 'age-boundary')
                .attr('stroke', '#333')
                .attr('stroke-width', 1.5);
        }
    }
    
    renderSymbols() {
        const anglePerSign = 360 / 12;
        const symbolRadius = (this.clock.options.innerRadius + this.clock.options.outerRadius) / 2;
        
        this.zodiacSigns.forEach((sign, index) => {
            const angle = (index + 0.5) * anglePerSign - 90;
            const x = symbolRadius * Math.cos(angle * Math.PI / 180);
            const y = symbolRadius * Math.sin(angle * Math.PI / 180);
            
            const symbolGroup = this.clock.zodiacLayer.append('g')
                .attr('class', `zodiac-symbol-group ${sign.name.toLowerCase()}`)
                .attr('transform', `translate(${x}, ${y})`);
                
            // Symbol background circle
            symbolGroup.append('circle')
                .attr('r', 25)
                .attr('fill', '#fff')
                .attr('stroke', '#333')
                .attr('stroke-width', 1)
                .attr('opacity', 0.8);
                
            // Zodiac symbol
            symbolGroup.append('text')
                .attr('class', 'zodiac-symbol')
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'central')
                .attr('font-size', '24px')
                .text(sign.symbol);
                
            // Add rotation to keep symbols upright
            symbolGroup.attr('transform', `translate(${x}, ${y}) rotate(${-angle + 90})`);
        });
    }
    
    renderAgeLabels() {
        const anglePerSign = 360 / 12;
        const labelRadius = this.clock.options.outerRadius + 30;
        
        // Calculate years for each age
        const currentYear = this.clock.options.currentYear;
        const baseYear = -2150; // Approximate start of Age of Pisces
        
        this.precessionOrder.forEach((sign, index) => {
            const ageStartYear = baseYear + (index * this.clock.AGE_DURATION);
            const ageEndYear = ageStartYear + this.clock.AGE_DURATION;
            
            // Position for precession (goes backwards through zodiac)
            const zodiacIndex = this.zodiacSigns.findIndex(s => s.name === sign.name);
            const angle = (zodiacIndex + 0.5) * anglePerSign - 90;
            const x = labelRadius * Math.cos(angle * Math.PI / 180);
            const y = labelRadius * Math.sin(angle * Math.PI / 180);
            
            const labelGroup = this.clock.zodiacLayer.append('g')
                .attr('class', 'age-label-group')
                .attr('transform', `translate(${x}, ${y})`);
                
            // Age name
            labelGroup.append('text')
                .attr('y', -10)
                .attr('text-anchor', 'middle')
                .attr('class', 'age-label-name')
                .text(`Age of ${sign.name}`);
                
            // Year range
            labelGroup.append('text')
                .attr('y', 5)
                .attr('text-anchor', 'middle')
                .attr('class', 'age-label-years')
                .attr('font-size', '10px')
                .text(`${Math.abs(ageStartYear)} ${ageStartYear < 0 ? 'BCE' : 'CE'} - ${Math.abs(ageEndYear)} ${ageEndYear < 0 ? 'BCE' : 'CE'}`);
                
            // Highlight current age
            if (currentYear >= ageStartYear && currentYear < ageEndYear) {
                labelGroup.classed('current-age', true);
            }
        });
    }
    
    getElementColor(element) {
        const colors = {
            'Fire': '#666',
            'Earth': '#555',
            'Air': '#777',
            'Water': '#444'
        };
        return colors[element] || '#666';
    }
    
    highlightSign(sign) {
        // Dim all segments
        this.clock.zodiacLayer.selectAll('.zodiac-segment')
            .attr('opacity', 0.3);
            
        // Highlight selected segment
        this.clock.zodiacLayer.selectAll(`.zodiac-segment.${sign.name.toLowerCase()}`)
            .attr('opacity', 1)
            .attr('fill', '#f0f0f0');
            
        // Show sign info
        const infoHtml = `
            <div class="sign-info">
                <h3>${sign.symbol} ${sign.name}</h3>
                <p>Element: ${sign.element}</p>
                <p>Quality: ${sign.quality}</p>
                <p>Ruler: ${sign.ruler}</p>
            </div>
        `;
        
        this.clock.tooltip
            .html(infoHtml)
            .style('opacity', 0.9)
            .style('left', (d3.event.pageX + 10) + 'px')
            .style('top', (d3.event.pageY - 10) + 'px');
    }
    
    unhighlightAll() {
        this.clock.zodiacLayer.selectAll('.zodiac-segment')
            .attr('opacity', 1)
            .attr('fill', 'none');
            
        this.clock.hideTooltip();
    }
    
    animateSymbols() {
        // Gentle pulsing animation for current age symbol
        const currentAge = this.clock.getCurrentAge();
        const currentSymbol = this.clock.zodiacLayer.select(`.zodiac-symbol-group.${currentAge.name.toLowerCase()}`);
        
        const pulse = () => {
            currentSymbol.select('circle')
                .transition()
                .duration(2000)
                .attr('r', 30)
                .attr('opacity', 1)
                .transition()
                .duration(2000)
                .attr('r', 25)
                .attr('opacity', 0.8)
                .on('end', pulse);
        };
        
        pulse();
    }
    
    updatePrecession(angle) {
        // Update visual indication of precession
        // The zodiac wheel itself rotates to show precession
        this.clock.zodiacLayer
            .transition()
            .duration(100)
            .attr('transform', `rotate(${angle})`);
    }
}