// AlchemyLab.js - Main alchemical transformation visualization
import ElementSystem from './ElementSystem.js';
import TransformationEngine from './TransformationEngine.js';

export default class AlchemyLab {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.container.innerHTML = '';
        
        // Initialize systems
        this.elementSystem = new ElementSystem();
        this.transformationEngine = new TransformationEngine();
        
        // State management
        this.currentStage = 'nigredo'; // Starting stage
        this.discoveries = new Set();
        this.activeElements = [];
        this.draggedElement = null;
        this.score = 0;
        
        // Stage configurations
        this.stages = {
            nigredo: { name: 'Nigredo', color: '#000000', description: 'The Blackening - Dissolution and Putrefaction' },
            albedo: { name: 'Albedo', color: '#666666', description: 'The Whitening - Purification and Reflection' },
            citrinitas: { name: 'Citrinitas', color: '#999999', description: 'The Yellowing - Solar Consciousness' },
            rubedo: { name: 'Rubedo', color: '#CCCCCC', description: 'The Reddening - Integration and Wholeness' }
        };
        
        this.init();
    }
    
    init() {
        // Create main structure
        this.container.className = 'alchemy-lab';
        
        // Create header with stage indicator
        const header = document.createElement('div');
        header.className = 'alchemy-header';
        header.innerHTML = `
            <h2>Alchemical Transformation Lab</h2>
            <div class="stage-indicator">
                <span class="stage-name">${this.stages[this.currentStage].name}</span>
                <span class="stage-description">${this.stages[this.currentStage].description}</span>
            </div>
            <div class="score-display">
                <span class="score-label">Discoveries:</span>
                <span class="score-value">${this.discoveries.size}</span>
            </div>
        `;
        
        // Create main workspace
        const workspace = document.createElement('div');
        workspace.className = 'alchemy-workspace';
        
        // Create element palette
        const palette = document.createElement('div');
        palette.className = 'element-palette';
        palette.innerHTML = '<h3>Prima Materia</h3>';
        
        // Create transformation vessel (crucible)
        const vessel = document.createElement('div');
        vessel.className = 'transformation-vessel';
        vessel.innerHTML = `
            <svg class="vessel-svg" viewBox="0 0 300 300">
                <defs>
                    <radialGradient id="vesselGradient">
                        <stop offset="0%" style="stop-color:#333;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#000;stop-opacity:1" />
                    </radialGradient>
                </defs>
                <circle cx="150" cy="150" r="140" fill="url(#vesselGradient)" stroke="#666" stroke-width="2"/>
                <circle cx="150" cy="150" r="120" fill="none" stroke="#444" stroke-width="1" stroke-dasharray="5,5"/>
                <text x="150" y="260" text-anchor="middle" fill="#666" font-size="14">Drop elements here</text>
            </svg>
            <div class="vessel-contents"></div>
        `;
        
        // Create discovery panel
        const discoveryPanel = document.createElement('div');
        discoveryPanel.className = 'discovery-panel';
        discoveryPanel.innerHTML = `
            <h3>Discoveries</h3>
            <div class="discovery-list"></div>
        `;
        
        // Create stage progression
        const stageProgression = document.createElement('div');
        stageProgression.className = 'stage-progression';
        Object.keys(this.stages).forEach((stage, index) => {
            const stageNode = document.createElement('div');
            stageNode.className = `stage-node ${stage === this.currentStage ? 'active' : ''}`;
            stageNode.innerHTML = `
                <div class="stage-symbol">${this.getStageSymbol(stage)}</div>
                <div class="stage-label">${this.stages[stage].name}</div>
            `;
            stageProgression.appendChild(stageNode);
        });
        
        // Assemble workspace
        workspace.appendChild(palette);
        workspace.appendChild(vessel);
        workspace.appendChild(discoveryPanel);
        
        // Append all to container
        this.container.appendChild(header);
        this.container.appendChild(stageProgression);
        this.container.appendChild(workspace);
        
        // Store references
        this.palette = palette;
        this.vessel = vessel.querySelector('.vessel-contents');
        this.discoveryList = discoveryPanel.querySelector('.discovery-list');
        
        // Initialize elements
        this.createBaseElements();
        
        // Setup event handlers
        this.setupDragAndDrop();
        
        // Start animation loop
        this.animate();
    }
    
    createBaseElements() {
        const baseElements = this.elementSystem.getBaseElements();
        
        baseElements.forEach(element => {
            const elementDiv = document.createElement('div');
            elementDiv.className = 'alchemical-element';
            elementDiv.draggable = true;
            elementDiv.dataset.elementId = element.id;
            
            elementDiv.innerHTML = `
                <svg class="element-svg" viewBox="0 0 60 60">
                    ${this.elementSystem.getElementSVG(element)}
                </svg>
                <span class="element-name">${element.name}</span>
            `;
            
            this.palette.appendChild(elementDiv);
        });
    }
    
    setupDragAndDrop() {
        // Drag start
        this.palette.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('alchemical-element')) {
                this.draggedElement = e.target.dataset.elementId;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'copy';
            }
        });
        
        // Drag end
        this.palette.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('alchemical-element')) {
                e.target.classList.remove('dragging');
            }
        });
        
        // Vessel drag over
        this.vessel.parentElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.vessel.parentElement.classList.add('drag-over');
        });
        
        // Vessel drag leave
        this.vessel.parentElement.addEventListener('dragleave', (e) => {
            this.vessel.parentElement.classList.remove('drag-over');
        });
        
        // Vessel drop
        this.vessel.parentElement.addEventListener('drop', (e) => {
            e.preventDefault();
            this.vessel.parentElement.classList.remove('drag-over');
            
            if (this.draggedElement) {
                this.addElementToVessel(this.draggedElement);
                this.draggedElement = null;
            }
        });
        
        // Clear vessel on right click
        this.vessel.parentElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.clearVessel();
        });
    }
    
    addElementToVessel(elementId) {
        const element = this.elementSystem.getElement(elementId);
        if (!element) return;
        
        // Check if we can add more elements
        if (this.activeElements.length >= 4) {
            this.showNotification('Vessel full! Right-click to clear.');
            return;
        }
        
        // Add element to active list
        this.activeElements.push(element);
        
        // Create visual representation in vessel
        const elementDiv = document.createElement('div');
        elementDiv.className = 'vessel-element';
        elementDiv.style.setProperty('--rotation', `${Math.random() * 360}deg`);
        
        elementDiv.innerHTML = `
            <svg class="element-svg" viewBox="0 0 40 40">
                ${this.elementSystem.getElementSVG(element, 40)}
            </svg>
        `;
        
        this.vessel.appendChild(elementDiv);
        
        // Animate element appearance
        setTimeout(() => elementDiv.classList.add('active'), 10);
        
        // Check for transformations
        if (this.activeElements.length >= 2) {
            this.checkTransformation();
        }
    }
    
    checkTransformation() {
        const result = this.transformationEngine.checkCombination(
            this.activeElements,
            this.currentStage
        );
        
        if (result) {
            this.performTransformation(result);
        }
    }
    
    performTransformation(result) {
        // Add transformation effect
        this.vessel.parentElement.classList.add('transforming');
        
        // Create transformation animation
        const transformEffect = document.createElement('div');
        transformEffect.className = 'transformation-effect';
        this.vessel.appendChild(transformEffect);
        
        setTimeout(() => {
            // Clear vessel
            this.clearVessel();
            
            // Add result element
            const resultElement = this.elementSystem.getElement(result.elementId);
            if (resultElement) {
                // Check if new discovery
                if (!this.discoveries.has(result.elementId)) {
                    this.discoveries.add(result.elementId);
                    this.addDiscovery(resultElement, result);
                    this.score += result.points || 100;
                    this.updateScore();
                }
                
                // Show result
                this.showResult(resultElement);
                
                // Check for stage progression
                if (result.progressStage) {
                    this.progressToNextStage();
                }
            }
            
            // Remove effect
            this.vessel.parentElement.classList.remove('transforming');
            transformEffect.remove();
        }, 1500);
    }
    
    showResult(element) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'transformation-result';
        resultDiv.innerHTML = `
            <svg class="element-svg" viewBox="0 0 80 80">
                ${this.elementSystem.getElementSVG(element, 80)}
            </svg>
            <div class="result-name">${element.name}</div>
            <div class="result-description">${element.description || ''}</div>
        `;
        
        this.vessel.appendChild(resultDiv);
        
        setTimeout(() => {
            resultDiv.classList.add('fade-out');
            setTimeout(() => resultDiv.remove(), 1000);
        }, 3000);
    }
    
    addDiscovery(element, result) {
        const discoveryDiv = document.createElement('div');
        discoveryDiv.className = 'discovery-item';
        discoveryDiv.innerHTML = `
            <svg class="element-svg" viewBox="0 0 40 40">
                ${this.elementSystem.getElementSVG(element, 40)}
            </svg>
            <div class="discovery-info">
                <div class="discovery-name">${element.name}</div>
                <div class="discovery-recipe">${result.recipe || ''}</div>
            </div>
        `;
        
        this.discoveryList.appendChild(discoveryDiv);
        
        // Animate appearance
        setTimeout(() => discoveryDiv.classList.add('revealed'), 10);
        
        // Show achievement notification
        this.showAchievement(`Discovered: ${element.name}`);
    }
    
    progressToNextStage() {
        const stageOrder = Object.keys(this.stages);
        const currentIndex = stageOrder.indexOf(this.currentStage);
        
        if (currentIndex < stageOrder.length - 1) {
            this.currentStage = stageOrder[currentIndex + 1];
            this.updateStageDisplay();
            this.showAchievement(`Progressed to ${this.stages[this.currentStage].name}!`);
        } else {
            // Completed all stages
            this.showAchievement('The Great Work is Complete!');
        }
    }
    
    updateStageDisplay() {
        // Update header
        const stageIndicator = this.container.querySelector('.stage-indicator');
        stageIndicator.innerHTML = `
            <span class="stage-name">${this.stages[this.currentStage].name}</span>
            <span class="stage-description">${this.stages[this.currentStage].description}</span>
        `;
        
        // Update stage progression
        const stageNodes = this.container.querySelectorAll('.stage-node');
        stageNodes.forEach((node, index) => {
            const stageKey = Object.keys(this.stages)[index];
            node.classList.toggle('active', stageKey === this.currentStage);
        });
        
        // Add stage transition effect
        this.container.classList.add('stage-transition');
        setTimeout(() => this.container.classList.remove('stage-transition'), 1000);
    }
    
    clearVessel() {
        this.activeElements = [];
        this.vessel.innerHTML = '';
    }
    
    updateScore() {
        const scoreValue = this.container.querySelector('.score-value');
        scoreValue.textContent = this.discoveries.size;
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }, 10);
    }
    
    showAchievement(message) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement';
        achievement.innerHTML = `
            <div class="achievement-icon">✧</div>
            <div class="achievement-text">${message}</div>
        `;
        this.container.appendChild(achievement);
        
        setTimeout(() => {
            achievement.classList.add('show');
            setTimeout(() => {
                achievement.classList.remove('show');
                setTimeout(() => achievement.remove(), 500);
            }, 3000);
        }, 10);
    }
    
    getStageSymbol(stage) {
        const symbols = {
            nigredo: '☽',
            albedo: '☉',
            citrinitas: '✦',
            rubedo: '✧'
        };
        return symbols[stage] || '○';
    }
    
    animate() {
        // Add subtle animations to vessel contents
        const vesselElements = this.vessel.querySelectorAll('.vessel-element');
        vesselElements.forEach((el, index) => {
            const time = Date.now() * 0.001;
            const offset = index * 0.5;
            el.style.transform = `
                translate(
                    ${Math.sin(time + offset) * 5}px,
                    ${Math.cos(time + offset) * 5}px
                )
                rotate(var(--rotation))
            `;
        });
        
        requestAnimationFrame(() => this.animate());
    }
}