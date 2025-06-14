/**
 * Simplified Fish Symbol Timeline for integration into Chapter 4
 * This version is designed to work with the existing chapter structure
 */

function initFishSymbolTimeline(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Timeline data
    const timelineData = [
        {
            year: -100,
            title: "Pre-Christian",
            description: "Fish as fertility symbol",
            color: "#8B7355",
            x: 0.05
        },
        {
            year: 30,
            title: "Christ's Ministry",
            description: "Fishers of men",
            color: "#FFD700",
            x: 0.15
        },
        {
            year: 100,
            title: "Early Ichthys",
            description: "Secret Christian symbol",
            color: "#DC143C",
            x: 0.2
        },
        {
            year: 313,
            title: "Constantine",
            description: "Public Christian emblem",
            color: "#6B46C1",
            x: 0.3
        },
        {
            year: 1000,
            title: "Medieval",
            description: "Pisces age awareness",
            color: "#9400D3",
            x: 0.5
        },
        {
            year: 1500,
            title: "Alchemy",
            description: "Prima materia",
            color: "#FF8C00",
            x: 0.65
        },
        {
            year: 1951,
            title: "Jung's Aion",
            description: "Psychological analysis",
            color: "#FF1493",
            x: 0.85
        },
        {
            year: 2000,
            title: "Aquarian Age",
            description: "Transition begins",
            color: "#00CED1",
            x: 0.95
        }
    ];
    
    // Create visualization structure
    const width = container.offsetWidth;
    const height = 400;
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', 'transparent');
    
    // Create gradient definition
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'fish-timeline-gradient')
        .attr('x1', '0%')
        .attr('x2', '100%');
    
    gradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', '#8B7355')
        .style('stop-opacity', 0.8);
    
    gradient.append('stop')
        .attr('offset', '50%')
        .style('stop-color', '#6B46C1')
        .style('stop-opacity', 1);
    
    gradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', '#00CED1')
        .style('stop-opacity', 0.8);
    
    // Draw timeline base
    const timelineY = height / 2;
    const timelinePadding = 40;
    
    // Timeline path
    svg.append('path')
        .attr('d', `M ${timelinePadding} ${timelineY} Q ${width/2} ${timelineY - 50} ${width - timelinePadding} ${timelineY}`)
        .style('fill', 'none')
        .style('stroke', 'url(#fish-timeline-gradient)')
        .style('stroke-width', 3)
        .style('opacity', 0.6);
    
    // Add fish symbols along timeline
    const fishGroup = svg.append('g').attr('class', 'fish-symbols');
    
    timelineData.forEach((event, index) => {
        const x = timelinePadding + (width - 2 * timelinePadding) * event.x;
        const y = timelineY + Math.sin(event.x * Math.PI) * -30;
        
        const g = fishGroup.append('g')
            .attr('class', 'timeline-event')
            .attr('transform', `translate(${x}, ${y})`)
            .style('cursor', 'pointer');
        
        // Draw simplified fish shape
        const fishPath = g.append('path')
            .attr('d', 'M-20,0 Q-10,-8 0,-8 Q10,-8 20,0 Q10,8 0,8 Q-10,8 -20,0 M20,0 L30,-6 L30,6 Z')
            .style('fill', event.color)
            .style('stroke', '#fff')
            .style('stroke-width', 2)
            .style('opacity', 0.8)
            .attr('transform', 'scale(0.8)');
        
        // Add year label
        g.append('text')
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-secondary)')
            .style('font-size', '11px')
            .text(event.year < 0 ? `${Math.abs(event.year)} BCE` : `${event.year} CE`);
        
        // Add event title (hidden by default)
        const titleText = g.append('text')
            .attr('y', -20)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-primary)')
            .style('font-size', '12px')
            .style('font-weight', '500')
            .style('opacity', 0)
            .text(event.title);
        
        // Add tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'fish-tooltip')
            .style('position', 'absolute')
            .style('padding', '10px')
            .style('background', 'var(--surface-glass)')
            .style('border', '1px solid var(--border-default)')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('transition', 'opacity 0.3s');
        
        // Interactions
        g.on('mouseenter', function() {
            // Animate fish
            d3.select(this).select('path')
                .transition()
                .duration(300)
                .attr('transform', 'scale(1.2) rotate(5)');
            
            // Show title
            titleText.transition()
                .duration(300)
                .style('opacity', 1);
            
            // Show tooltip
            tooltip.html(`
                <strong style="color: var(--text-primary)">${event.title}</strong><br>
                <span style="color: var(--text-secondary)">${event.description}</span>
            `)
            .style('left', (d3.event.pageX + 10) + 'px')
            .style('top', (d3.event.pageY - 10) + 'px')
            .style('opacity', 1);
        })
        .on('mouseleave', function() {
            // Reset fish
            d3.select(this).select('path')
                .transition()
                .duration(300)
                .attr('transform', 'scale(0.8) rotate(0)');
            
            // Hide title
            titleText.transition()
                .duration(300)
                .style('opacity', 0);
            
            // Hide tooltip
            tooltip.style('opacity', 0);
        })
        .on('click', function() {
            // Show detailed info in the existing info panel
            showFishEventDetail(event);
        });
    });
    
    // Add decorative elements
    addWavePattern(svg, width, height);
    
    // Animate entrance
    fishGroup.selectAll('.timeline-event')
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 150)
        .style('opacity', 1);
}

function addWavePattern(svg, width, height) {
    const waveData = [];
    for (let i = 0; i <= width; i += 20) {
        waveData.push({
            x: i,
            y: height - 30 + Math.sin(i * 0.02) * 10
        });
    }
    
    const line = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveCardinal);
    
    svg.append('path')
        .datum(waveData)
        .attr('d', line)
        .style('fill', 'none')
        .style('stroke', 'var(--accent)')
        .style('stroke-width', 1)
        .style('opacity', 0.2);
}

function showFishEventDetail(event) {
    // Create or update detail panel
    let detailPanel = document.getElementById('fish-event-detail');
    if (!detailPanel) {
        detailPanel = document.createElement('div');
        detailPanel.id = 'fish-event-detail';
        detailPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--surface-secondary);
            border: 1px solid var(--border-default);
            border-radius: 8px;
            padding: 30px;
            max-width: 500px;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(detailPanel);
    }
    
    const historicalContext = {
        '-100': 'In the ancient world, fish symbols appeared in various Mediterranean cultures. The fish represented fertility, the mysterious depths of water, and the abundance of life.',
        '30': 'Jesus calls his first disciples, fishermen on the Sea of Galilee, to become "fishers of men." The multiplication of loaves and fishes becomes a central miracle.',
        '100': 'Early Christians adopt the fish as a secret symbol. The Greek word ΙΧΘΥΣ (Ichthys) forms an acronym for "Iesous Christos Theou Yios Soter" (Jesus Christ, Son of God, Savior).',
        '313': 'With Constantine\'s Edict of Milan, Christianity is legalized. The fish symbol transitions from a secret sign to a public emblem of faith.',
        '1000': 'Medieval scholars begin recognizing the connection between Christianity and the astrological Age of Pisces, seeing cosmic significance in the fish symbolism.',
        '1500': 'Renaissance alchemists use fish imagery to represent the prima materia - the raw material of transformation swimming in the waters of the unconscious.',
        '1951': 'Carl Jung publishes Aion, providing a comprehensive psychological analysis of the fish symbol through 2000 years of Western history.',
        '2000': 'The approaching Age of Aquarius suggests a shift in collective consciousness from the fish (unconscious immersion) to the water-bearer (conscious relationship with psychic contents).'
    };
    
    detailPanel.innerHTML = `
        <button onclick="this.parentElement.remove()" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer;">×</button>
        <h2 style="color: ${event.color}; margin: 0 0 10px 0;">${event.title}</h2>
        <p style="color: var(--text-secondary); margin: 0 0 20px 0;">
            ${event.year < 0 ? `${Math.abs(event.year)} BCE` : `${event.year} CE`}
        </p>
        <p style="color: var(--text-primary); line-height: 1.6;">
            ${historicalContext[event.year] || event.description}
        </p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-subtle);">
            <h3 style="color: var(--text-primary); margin: 0 0 10px 0;">Symbolic Significance</h3>
            <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.5;">
                The fish at this period represents ${event.description.toLowerCase()}, marking a crucial point in the evolution of Western consciousness and the collective psyche.
            </p>
        </div>
    `;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    backdrop.onclick = () => {
        detailPanel.remove();
        backdrop.remove();
    };
    document.body.appendChild(backdrop);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Check if we're on the chapter 4 page
        if (document.getElementById('fish-timeline-viz')) {
            initFishSymbolTimeline('fish-timeline-viz');
        }
    });
} else {
    // DOM already loaded
    if (document.getElementById('fish-timeline-viz')) {
        initFishSymbolTimeline('fish-timeline-viz');
    }
}