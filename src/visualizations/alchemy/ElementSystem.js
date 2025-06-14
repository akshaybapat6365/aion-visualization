// ElementSystem.js - Alchemical element management and visual representation
export default class ElementSystem {
    constructor() {
        // Define all alchemical elements
        this.elements = new Map();
        this.initializeElements();
    }
    
    initializeElements() {
        // Base elements (Prima Materia)
        this.addElement({
            id: 'mercury',
            name: 'Mercury',
            symbol: '☿',
            type: 'base',
            color: '#999999',
            description: 'The volatile spirit, representing consciousness and transformation',
            properties: ['volatile', 'transformative', 'spiritual']
        });
        
        this.addElement({
            id: 'sulphur',
            name: 'Sulphur',
            symbol: '🜍',
            type: 'base',
            color: '#666666',
            description: 'The soul of matter, representing desire and passion',
            properties: ['combustible', 'active', 'masculine']
        });
        
        this.addElement({
            id: 'salt',
            name: 'Salt',
            symbol: '🜔',
            type: 'base',
            color: '#CCCCCC',
            description: 'The body, representing form and crystallization',
            properties: ['stable', 'crystalline', 'feminine']
        });
        
        this.addElement({
            id: 'prima-materia',
            name: 'Prima Materia',
            symbol: '○',
            type: 'base',
            color: '#333333',
            description: 'The first matter, the chaos from which all arises',
            properties: ['potential', 'undifferentiated', 'chaos']
        });
        
        // Compound elements (discovered through combinations)
        this.addElement({
            id: 'philosophical-mercury',
            name: 'Philosophical Mercury',
            symbol: '☿',
            type: 'compound',
            color: '#AAAAAA',
            description: 'The refined spirit, purified through the work',
            properties: ['refined', 'spiritual', 'transcendent'],
            hidden: true
        });
        
        this.addElement({
            id: 'white-stone',
            name: 'White Stone',
            symbol: '◇',
            type: 'compound',
            color: '#EEEEEE',
            description: 'The albedo achievement, representing purification',
            properties: ['pure', 'lunar', 'reflective'],
            hidden: true
        });
        
        this.addElement({
            id: 'red-stone',
            name: 'Red Stone',
            symbol: '◆',
            type: 'compound',
            color: '#999999',
            description: 'The rubedo achievement, the philosopher\'s stone',
            properties: ['perfect', 'solar', 'complete'],
            hidden: true
        });
        
        this.addElement({
            id: 'aqua-vitae',
            name: 'Aqua Vitae',
            symbol: '💧',
            type: 'compound',
            color: '#777777',
            description: 'The water of life, dissolving and regenerating',
            properties: ['dissolving', 'regenerative', 'vital'],
            hidden: true
        });
        
        this.addElement({
            id: 'black-sun',
            name: 'Sol Niger',
            symbol: '☉',
            type: 'compound',
            color: '#000000',
            description: 'The black sun of nigredo, representing the shadow',
            properties: ['shadow', 'unconscious', 'hidden'],
            hidden: true
        });
        
        this.addElement({
            id: 'rebis',
            name: 'Rebis',
            symbol: '☊',
            type: 'compound',
            color: '#888888',
            description: 'The divine hermaphrodite, unity of opposites',
            properties: ['unified', 'androgynous', 'complete'],
            hidden: true
        });
        
        this.addElement({
            id: 'azoth',
            name: 'Azoth',
            symbol: 'A',
            type: 'compound',
            color: '#BBBBBB',
            description: 'The universal solvent and medicine',
            properties: ['universal', 'healing', 'transformative'],
            hidden: true
        });
        
        this.addElement({
            id: 'quintessence',
            name: 'Quintessence',
            symbol: '✦',
            type: 'compound',
            color: '#DDDDDD',
            description: 'The fifth element, the essence of all things',
            properties: ['ethereal', 'essential', 'divine'],
            hidden: true
        });
    }
    
    addElement(element) {
        this.elements.set(element.id, element);
    }
    
    getElement(id) {
        return this.elements.get(id);
    }
    
    getBaseElements() {
        return Array.from(this.elements.values()).filter(el => el.type === 'base');
    }
    
    getDiscoveredElements() {
        return Array.from(this.elements.values()).filter(el => !el.hidden);
    }
    
    getElementSVG(element, size = 60) {
        const center = size / 2;
        const radius = size * 0.4;
        
        // Different shapes for different element types
        let shape = '';
        
        switch (element.id) {
            case 'mercury':
                // Mercury - circle with cross below and crescent above
                shape = `
                    <circle cx="${center}" cy="${center - 5}" r="${radius * 0.7}" 
                            fill="none" stroke="${element.color}" stroke-width="2"/>
                    <path d="M${center} ${center + radius * 0.5} L${center} ${center + radius * 1.2}" 
                          stroke="${element.color}" stroke-width="2"/>
                    <path d="M${center - radius * 0.5} ${center + radius} L${center + radius * 0.5} ${center + radius}" 
                          stroke="${element.color}" stroke-width="2"/>
                    <path d="M${center - radius * 0.4} ${center - radius * 1.2} 
                             Q${center} ${center - radius * 1.5} ${center + radius * 0.4} ${center - radius * 1.2}" 
                          fill="none" stroke="${element.color}" stroke-width="2"/>
                `;
                break;
                
            case 'sulphur':
                // Sulphur - triangle with cross
                shape = `
                    <path d="M${center} ${center - radius} 
                             L${center - radius * 0.866} ${center + radius * 0.5} 
                             L${center + radius * 0.866} ${center + radius * 0.5} Z" 
                          fill="none" stroke="${element.color}" stroke-width="2"/>
                    <path d="M${center} ${center - radius * 0.3} L${center} ${center + radius * 0.8}" 
                          stroke="${element.color}" stroke-width="2"/>
                    <path d="M${center - radius * 0.5} ${center + radius * 0.3} 
                             L${center + radius * 0.5} ${center + radius * 0.3}" 
                          stroke="${element.color}" stroke-width="2"/>
                `;
                break;
                
            case 'salt':
                // Salt - circle with horizontal line through center
                shape = `
                    <circle cx="${center}" cy="${center}" r="${radius}" 
                            fill="none" stroke="${element.color}" stroke-width="2"/>
                    <line x1="${center - radius}" y1="${center}" 
                          x2="${center + radius}" y2="${center}" 
                          stroke="${element.color}" stroke-width="2"/>
                `;
                break;
                
            case 'prima-materia':
                // Prima Materia - chaotic spiral
                shape = `
                    <path d="M${center} ${center} 
                             Q${center + radius * 0.5} ${center - radius * 0.5} ${center + radius} ${center}
                             Q${center + radius * 0.5} ${center + radius * 0.5} ${center} ${center + radius}
                             Q${center - radius * 0.5} ${center + radius * 0.5} ${center - radius} ${center}
                             Q${center - radius * 0.5} ${center - radius * 0.5} ${center} ${center - radius * 0.8}" 
                          fill="none" stroke="${element.color}" stroke-width="2"/>
                `;
                break;
                
            case 'philosophical-mercury':
                // Refined mercury with additional wings
                shape = `
                    <circle cx="${center}" cy="${center}" r="${radius * 0.6}" 
                            fill="none" stroke="${element.color}" stroke-width="2"/>
                    <path d="M${center - radius * 0.8} ${center - radius * 0.3} 
                             Q${center - radius * 0.6} ${center - radius * 0.6} ${center} ${center - radius * 0.4}
                             Q${center + radius * 0.6} ${center - radius * 0.6} ${center + radius * 0.8} ${center - radius * 0.3}" 
                          fill="none" stroke="${element.color}" stroke-width="2"/>
                    <line x1="${center}" y1="${center + radius * 0.6}" 
                          x2="${center}" y2="${center + radius}" 
                          stroke="${element.color}" stroke-width="2"/>
                `;
                break;
                
            case 'white-stone':
                // Diamond shape
                shape = `
                    <path d="M${center} ${center - radius} 
                             L${center + radius * 0.7} ${center} 
                             L${center} ${center + radius} 
                             L${center - radius * 0.7} ${center} Z" 
                          fill="${element.color}" fill-opacity="0.3" 
                          stroke="${element.color}" stroke-width="2"/>
                `;
                break;
                
            case 'red-stone':
                // Hexagon (philosopher's stone)
                shape = `
                    <path d="M${center - radius} ${center} 
                             L${center - radius * 0.5} ${center - radius * 0.866} 
                             L${center + radius * 0.5} ${center - radius * 0.866} 
                             L${center + radius} ${center} 
                             L${center + radius * 0.5} ${center + radius * 0.866} 
                             L${center - radius * 0.5} ${center + radius * 0.866} Z" 
                          fill="${element.color}" fill-opacity="0.3" 
                          stroke="${element.color}" stroke-width="2"/>
                `;
                break;
                
            case 'black-sun':
                // Sun with dark rays
                shape = `
                    <circle cx="${center}" cy="${center}" r="${radius * 0.5}" 
                            fill="${element.color}" stroke="${element.color}" stroke-width="2"/>
                    ${this.createSunRays(center, radius * 0.5, 8, element.color)}
                `;
                break;
                
            case 'rebis':
                // Two circles intersecting
                shape = `
                    <circle cx="${center - radius * 0.3}" cy="${center}" r="${radius * 0.5}" 
                            fill="none" stroke="${element.color}" stroke-width="2"/>
                    <circle cx="${center + radius * 0.3}" cy="${center}" r="${radius * 0.5}" 
                            fill="none" stroke="${element.color}" stroke-width="2"/>
                `;
                break;
                
            default:
                // Default circle for other elements
                shape = `
                    <circle cx="${center}" cy="${center}" r="${radius}" 
                            fill="none" stroke="${element.color}" stroke-width="2"/>
                    <text x="${center}" y="${center + 5}" 
                          text-anchor="middle" font-size="${radius}" 
                          fill="${element.color}">${element.symbol}</text>
                `;
        }
        
        return shape;
    }
    
    createSunRays(cx, cy, radius, color) {
        let rays = '';
        const numRays = 8;
        for (let i = 0; i < numRays; i++) {
            const angle = (i * Math.PI * 2) / numRays;
            const x1 = cx + Math.cos(angle) * radius * 1.2;
            const y1 = cy + Math.sin(angle) * radius * 1.2;
            const x2 = cx + Math.cos(angle) * radius * 1.8;
            const y2 = cy + Math.sin(angle) * radius * 1.8;
            rays += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                           stroke="${color}" stroke-width="2"/>`;
        }
        return rays;
    }
    
    getElementProperties(id) {
        const element = this.getElement(id);
        return element ? element.properties : [];
    }
    
    revealElement(id) {
        const element = this.getElement(id);
        if (element) {
            element.hidden = false;
        }
    }
}