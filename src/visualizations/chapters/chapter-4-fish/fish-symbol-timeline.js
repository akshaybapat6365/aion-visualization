/**
 * Fish Symbol Timeline Visualization
 * Chapter 4: The Sign of the Fishes
 * 
 * This visualization shows the evolution of the fish symbol across 2000+ years,
 * from early Christian ichthys to modern psychological interpretations.
 */

import * as THREE from 'three';
import { gsap } from 'gsap';
import * as d3 from 'd3';

export class FishSymbolTimeline {
    constructor(container) {
        this.container = container;
        this.width = container.offsetWidth;
        this.height = container.offsetHeight;
        
        // Timeline data structure
        this.timelineData = [
            {
                year: -100,
                title: "Pre-Christian Fish Symbolism",
                description: "Fish as fertility and life symbol in ancient cultures",
                symbol: "ancient",
                color: "#8B7355",
                significance: 3,
                details: "Fish symbols appear in various ancient cultures as representations of fertility, abundance, and the life-giving properties of water."
            },
            {
                year: 30,
                title: "Christ's Ministry",
                description: "Fishers of men, miracle of the loaves and fishes",
                symbol: "early-christian",
                color: "#FFD700",
                significance: 5,
                details: "Jesus calls his disciples to be 'fishers of men' and performs miracles involving fish, establishing the foundation for Christian fish symbolism."
            },
            {
                year: 100,
                title: "Early Christian Ichthys",
                description: "Secret symbol during Roman persecution",
                symbol: "ichthys",
                color: "#DC143C",
                significance: 5,
                details: "ΙΧΘΥΣ (Ichthys) becomes a secret symbol - an acronym for 'Jesus Christ, Son of God, Savior' in Greek."
            },
            {
                year: 313,
                title: "Constantine's Conversion",
                description: "Fish symbol becomes public Christian emblem",
                symbol: "constantine",
                color: "#6B46C1",
                significance: 4,
                details: "With the Edict of Milan, Christianity is legalized and the fish symbol transitions from secret sign to public emblem."
            },
            {
                year: 500,
                title: "Medieval Symbolism",
                description: "Fish in Christian art and architecture",
                symbol: "medieval",
                color: "#4169E1",
                significance: 3,
                details: "Fish imagery proliferates in medieval churches, manuscripts, and religious art across Europe."
            },
            {
                year: 1000,
                title: "Astrological Integration",
                description: "Pisces age consciousness emerges",
                symbol: "astrological",
                color: "#9400D3",
                significance: 4,
                details: "Medieval scholars begin connecting Christian symbolism with the astrological Age of Pisces."
            },
            {
                year: 1500,
                title: "Renaissance Alchemy",
                description: "Fish as prima materia and transformation",
                symbol: "alchemical",
                color: "#FF8C00",
                significance: 4,
                details: "Alchemists use fish imagery to represent the prima materia and the process of spiritual transformation."
            },
            {
                year: 1900,
                title: "Psychological Discovery",
                description: "Fish as symbol from the unconscious",
                symbol: "psychological",
                color: "#20B2AA",
                significance: 5,
                details: "Depth psychology recognizes fish as symbols rising from the unconscious depths of the psyche."
            },
            {
                year: 1951,
                title: "Jung's Aion Published",
                description: "Comprehensive analysis of fish symbolism",
                symbol: "jungian",
                color: "#FF1493",
                significance: 5,
                details: "Jung's Aion provides the most comprehensive psychological analysis of the fish symbol through 2000 years of history."
            },
            {
                year: 2000,
                title: "Aquarian Transition",
                description: "From fish to water-bearer consciousness",
                symbol: "aquarian",
                color: "#00CED1",
                significance: 5,
                details: "The approaching Age of Aquarius suggests a shift from oceanic (unconscious) to conscious water-bearing symbolism."
            }
        ];
        
        this.init();
    }
    
    init() {
        // Create main visualization container
        this.vizContainer = document.createElement('div');
        this.vizContainer.style.position = 'relative';
        this.vizContainer.style.width = '100%';
        this.vizContainer.style.height = '100%';
        this.container.appendChild(this.vizContainer);
        
        // Initialize both 2D timeline and 3D fish visualization
        this.initTimeline();
        this.init3DFish();
        this.initInteractions();
        
        // Add info panel
        this.createInfoPanel();
    }
    
    initTimeline() {
        // Create SVG for timeline
        const margin = { top: 60, right: 40, bottom: 80, left: 60 };
        const width = this.width - margin.left - margin.right;
        const height = this.height * 0.4 - margin.top - margin.bottom;
        
        this.svg = d3.select(this.vizContainer)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height * 0.4)
            .style('position', 'absolute')
            .style('bottom', '0');
            
        this.g = this.svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
            
        // Create scales
        this.xScale = d3.scaleLinear()
            .domain([-200, 2100])
            .range([0, width]);
            
        this.yScale = d3.scaleLinear()
            .domain([0, 5])
            .range([height, 0]);
            
        // Create axes
        const xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d => d < 0 ? `${Math.abs(d)} BCE` : `${d} CE`)
            .tickValues([-100, 0, 500, 1000, 1500, 2000]);
            
        this.g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .style('color', 'var(--text-secondary)')
            .style('font-size', '12px');
            
        // Create timeline path
        const line = d3.line()
            .x(d => this.xScale(d.year))
            .y(d => this.yScale(d.significance))
            .curve(d3.curveCardinal);
            
        this.timelinePath = this.g.append('path')
            .datum(this.timelineData)
            .attr('class', 'timeline-path')
            .attr('d', line)
            .style('fill', 'none')
            .style('stroke', 'var(--accent)')
            .style('stroke-width', 2)
            .style('opacity', 0.6);
            
        // Add gradient effect
        const gradient = this.svg.append('defs')
            .append('linearGradient')
            .attr('id', 'timeline-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%');
            
        gradient.append('stop')
            .attr('offset', '0%')
            .style('stop-color', '#8B7355');
            
        gradient.append('stop')
            .attr('offset', '50%')
            .style('stop-color', '#6B46C1');
            
        gradient.append('stop')
            .attr('offset', '100%')
            .style('stop-color', '#00CED1');
            
        this.timelinePath.style('stroke', 'url(#timeline-gradient)');
        
        // Add event markers
        this.eventGroups = this.g.selectAll('.event-marker')
            .data(this.timelineData)
            .enter().append('g')
            .attr('class', 'event-marker')
            .attr('transform', d => `translate(${this.xScale(d.year)},${this.yScale(d.significance)})`);
            
        // Add circles for events
        this.eventGroups.append('circle')
            .attr('r', d => 4 + d.significance)
            .style('fill', d => d.color)
            .style('stroke', '#fff')
            .style('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => this.handleEventHover(d))
            .on('mouseout', () => this.handleEventOut())
            .on('click', (event, d) => this.handleEventClick(d));
            
        // Add labels for major events
        this.eventGroups.filter(d => d.significance >= 4)
            .append('text')
            .attr('y', -15)
            .attr('text-anchor', 'middle')
            .style('fill', 'var(--text-primary)')
            .style('font-size', '11px')
            .style('font-weight', '500')
            .text(d => d.title.split(' ')[0]);
    }
    
    init3DFish() {
        // Create Three.js scene for 3D fish visualization
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75, 
            this.width / (this.height * 0.6), 
            0.1, 
            1000
        );
        
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: true 
        });
        this.renderer.setSize(this.width, this.height * 0.6);
        this.renderer.setClearColor(0x000000, 0);
        
        // Create 3D container
        this.threeDContainer = document.createElement('div');
        this.threeDContainer.style.position = 'absolute';
        this.threeDContainer.style.top = '0';
        this.threeDContainer.style.width = '100%';
        this.threeDContainer.style.height = '60%';
        this.threeDContainer.appendChild(this.renderer.domElement);
        this.vizContainer.appendChild(this.threeDContainer);
        
        // Position camera
        this.camera.position.set(0, 0, 10);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        // Create fish geometry
        this.createFishGeometry();
        
        // Start animation
        this.animate();
    }
    
    createFishGeometry() {
        // Create parametric fish shape
        const fishGroup = new THREE.Group();
        
        // Fish body (vesica piscis shape)
        const bodyShape = new THREE.Shape();
        const radius = 2;
        
        // Create two intersecting circles
        for (let i = 0; i < Math.PI * 2; i += 0.1) {
            const x1 = Math.cos(i) * radius - radius/2;
            const y1 = Math.sin(i) * radius;
            const x2 = Math.cos(i) * radius + radius/2;
            const y2 = Math.sin(i) * radius;
            
            if (i === 0) {
                bodyShape.moveTo(x1, y1);
            }
            
            // Use the intersection points
            if (Math.abs(y1) < radius * 0.866) {
                bodyShape.lineTo(x1, y1);
            }
        }
        
        const bodyGeometry = new THREE.ShapeGeometry(bodyShape);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x6B46C1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        this.fishMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        fishGroup.add(this.fishMesh);
        
        // Add fish details (eye, fins)
        const eyeGeometry = new THREE.CircleGeometry(0.1, 32);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eye.position.set(-1, 0.5, 0.1);
        fishGroup.add(eye);
        
        this.fishGroup = fishGroup;
        this.scene.add(fishGroup);
        
        // Create multiple fish for different eras
        this.createHistoricalFish();
    }
    
    createHistoricalFish() {
        this.historicalFish = [];
        
        this.timelineData.forEach((event, index) => {
            const fish = this.createSingleFish(event);
            fish.position.x = (index - this.timelineData.length / 2) * 2;
            fish.position.y = -5;
            fish.visible = false;
            this.scene.add(fish);
            this.historicalFish.push(fish);
        });
    }
    
    createSingleFish(eventData) {
        const group = new THREE.Group();
        
        // Create simple fish shape
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(-0.5, 0.3, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0.5, -0.3, 0),
            new THREE.Vector3(1, 0, 0)
        ]);
        
        const geometry = new THREE.TubeGeometry(curve, 20, 0.1, 8, false);
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(eventData.color),
            transparent: true,
            opacity: 0.8
        });
        
        const fishMesh = new THREE.Mesh(geometry, material);
        group.add(fishMesh);
        
        // Add tail
        const tailGeometry = new THREE.ConeGeometry(0.3, 0.6, 4);
        const tailMesh = new THREE.Mesh(tailGeometry, material);
        tailMesh.position.set(1, 0, 0);
        tailMesh.rotation.z = Math.PI / 2;
        group.add(tailMesh);
        
        group.userData = eventData;
        return group;
    }
    
    handleEventHover(eventData) {
        // Highlight the corresponding 3D fish
        const fishIndex = this.timelineData.indexOf(eventData);
        if (fishIndex >= 0 && this.historicalFish[fishIndex]) {
            const fish = this.historicalFish[fishIndex];
            
            // Animate fish appearance
            gsap.to(fish.position, {
                y: 0,
                duration: 0.5,
                ease: "power2.out",
                onStart: () => { fish.visible = true; }
            });
            
            gsap.to(fish.rotation, {
                y: Math.PI * 2,
                duration: 2,
                ease: "power2.inOut"
            });
        }
        
        // Update info panel
        this.updateInfoPanel(eventData);
    }
    
    handleEventOut() {
        // Hide all historical fish
        this.historicalFish.forEach(fish => {
            gsap.to(fish.position, {
                y: -5,
                duration: 0.5,
                ease: "power2.in",
                onComplete: () => { fish.visible = false; }
            });
        });
    }
    
    handleEventClick(eventData) {
        // Show detailed view for clicked event
        this.showDetailedView(eventData);
    }
    
    createInfoPanel() {
        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'fish-timeline-info';
        this.infoPanel.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: var(--surface-glass);
            border: 1px solid var(--border-default);
            border-radius: 8px;
            padding: 20px;
            max-width: 300px;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        this.infoPanel.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: var(--text-primary);">Fish Symbol Evolution</h3>
            <p style="color: var(--text-secondary); font-size: 14px;">
                Hover over timeline events to explore the transformation of the fish symbol through 2000 years.
            </p>
        `;
        
        this.vizContainer.appendChild(this.infoPanel);
        
        // Fade in info panel
        setTimeout(() => {
            this.infoPanel.style.opacity = '1';
        }, 500);
    }
    
    updateInfoPanel(eventData) {
        this.infoPanel.innerHTML = `
            <h3 style="margin: 0 0 5px 0; color: var(--text-primary);">${eventData.title}</h3>
            <p style="margin: 0 0 10px 0; color: var(--accent); font-size: 14px;">
                ${eventData.year < 0 ? `${Math.abs(eventData.year)} BCE` : `${eventData.year} CE`}
            </p>
            <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.5;">
                ${eventData.details}
            </p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-subtle);">
                <p style="color: var(--text-secondary); font-size: 12px;">
                    Significance: ${'★'.repeat(eventData.significance)}
                </p>
            </div>
        `;
    }
    
    showDetailedView(eventData) {
        // Create modal for detailed view
        const modal = document.createElement('div');
        modal.className = 'fish-timeline-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: var(--surface-secondary);
            border: 1px solid var(--border-default);
            border-radius: 16px;
            padding: 40px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        `;
        
        content.innerHTML = `
            <button style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: var(--text-secondary); font-size: 24px; cursor: pointer;">×</button>
            <h2 style="color: var(--text-primary); margin: 0 0 20px 0;">${eventData.title}</h2>
            <p style="color: var(--accent); font-size: 18px; margin: 0 0 20px 0;">
                ${eventData.year < 0 ? `${Math.abs(eventData.year)} BCE` : `${eventData.year} CE`}
            </p>
            <p style="color: var(--text-secondary); font-size: 16px; line-height: 1.6;">
                ${eventData.details}
            </p>
            <div style="margin-top: 30px; padding: 20px; background: var(--surface-glass); border-radius: 8px;">
                <h3 style="color: var(--text-primary); margin: 0 0 10px 0;">Symbolic Significance</h3>
                <p style="color: var(--text-secondary); font-size: 14px;">
                    ${this.getSymbolicMeaning(eventData.symbol)}
                </p>
            </div>
        `;
        
        content.querySelector('button').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Fade in
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }
    
    getSymbolicMeaning(symbol) {
        const meanings = {
            'ancient': 'In pre-Christian times, fish represented fertility, abundance, and the mysterious depths of the unconscious waters.',
            'early-christian': 'The fish becomes a symbol of spiritual transformation, baptism, and the calling to fish for souls in the waters of the unconscious.',
            'ichthys': 'The Greek acronym transforms the fish into a coded message of faith, representing both secrecy and the depths of spiritual meaning.',
            'constantine': 'Public acceptance transforms the fish from a hidden symbol to an open declaration, marking the shift from esoteric to exoteric Christianity.',
            'medieval': 'Medieval consciousness integrates the fish into a comprehensive symbolic system, connecting it to the eucharist and spiritual nourishment.',
            'astrological': 'Recognition of the Piscean Age links individual spiritual development to cosmic cycles, suggesting humanity\'s collective unconscious journey.',
            'alchemical': 'The fish in the alchemical vessel represents the prima materia undergoing transformation, the soul swimming in the waters of the psyche.',
            'psychological': 'Modern psychology recognizes the fish as content rising from the unconscious, dreams of fish often indicating contact with deeper psychic layers.',
            'jungian': 'Jung\'s analysis reveals the fish as a symbol of the Self, encompassing both Christ and shadow, the totality seeking conscious integration.',
            'aquarian': 'The transition from fish to water-bearer suggests humanity\'s evolution from unconscious immersion to conscious handling of psychic contents.'
        };
        
        return meanings[symbol] || eventData.description;
    }
    
    initInteractions() {
        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.navigateTimeline(-1);
                    break;
                case 'ArrowRight':
                    this.navigateTimeline(1);
                    break;
                case 'Space':
                    e.preventDefault();
                    this.toggleAnimation();
                    break;
            }
        });
        
        // Add zoom controls
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            this.camera.position.z += e.deltaY * zoomSpeed;
            this.camera.position.z = Math.max(5, Math.min(20, this.camera.position.z));
        });
    }
    
    navigateTimeline(direction) {
        // Navigate through timeline events
        if (!this.currentEventIndex) this.currentEventIndex = 0;
        
        this.currentEventIndex += direction;
        this.currentEventIndex = Math.max(0, Math.min(this.timelineData.length - 1, this.currentEventIndex));
        
        const event = this.timelineData[this.currentEventIndex];
        this.handleEventClick(event);
    }
    
    toggleAnimation() {
        this.animationPaused = !this.animationPaused;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (!this.animationPaused) {
            // Gentle rotation of main fish
            if (this.fishGroup) {
                this.fishGroup.rotation.y += 0.005;
                this.fishGroup.position.y = Math.sin(Date.now() * 0.001) * 0.2;
            }
            
            // Animate historical fish
            this.historicalFish.forEach((fish, index) => {
                if (fish.visible) {
                    fish.rotation.z = Math.sin(Date.now() * 0.001 + index) * 0.1;
                }
            });
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        
        this.camera.aspect = this.width / (this.height * 0.6);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height * 0.6);
        
        // Resize timeline
        // Would need to recreate SVG with new dimensions
    }
}

// Export for use in chapter
export default FishSymbolTimeline;