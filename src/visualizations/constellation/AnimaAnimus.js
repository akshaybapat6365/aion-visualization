import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ForceGraph3D from './ForceGraph3D.js';
import ArchetypeNode from './ArchetypeNode.js';

class AnimaAnimus {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.forceGraph = null;
        this.nodes = new Map();
        this.edges = [];
        this.selectedNode = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.filterCategory = 'all';
        
        this.archetypes = this.initializeArchetypes();
        this.relationships = this.initializeRelationships();
        
        this.init();
    }
    
    initializeArchetypes() {
        return [
            { id: 'anima', name: 'Anima', category: 'contrasexual', color: 0xE8E8E8, description: 'The feminine aspect within the male psyche' },
            { id: 'animus', name: 'Animus', category: 'contrasexual', color: 0xD0D0D0, description: 'The masculine aspect within the female psyche' },
            { id: 'self', name: 'Self', category: 'core', color: 0xFFFFFF, description: 'The unified whole of conscious and unconscious' },
            { id: 'shadow', name: 'Shadow', category: 'core', color: 0x404040, description: 'The repressed or hidden aspects of personality' },
            { id: 'persona', name: 'Persona', category: 'social', color: 0xB8B8B8, description: 'The social mask presented to the world' },
            { id: 'mother', name: 'Mother', category: 'parental', color: 0xF0F0F0, description: 'The nurturing, protective archetype' },
            { id: 'father', name: 'Father', category: 'parental', color: 0xA8A8A8, description: 'The authority and order archetype' },
            { id: 'child', name: 'Child', category: 'developmental', color: 0xE0E0E0, description: 'Innocence, potential, and new beginnings' },
            { id: 'wise-old-man', name: 'Wise Old Man', category: 'wisdom', color: 0xC8C8C8, description: 'Wisdom, knowledge, and guidance' },
            { id: 'wise-old-woman', name: 'Wise Old Woman', category: 'wisdom', color: 0xD8D8D8, description: 'Intuitive wisdom and spiritual insight' },
            { id: 'hero', name: 'Hero', category: 'journey', color: 0xF8F8F8, description: 'Courage, transformation, and achievement' },
            { id: 'trickster', name: 'Trickster', category: 'transformative', color: 0x888888, description: 'Chaos, change, and rule-breaking' }
        ];
    }
    
    initializeRelationships() {
        return [
            // Contrasexual relationships
            { source: 'anima', target: 'self', strength: 0.9 },
            { source: 'animus', target: 'self', strength: 0.9 },
            { source: 'anima', target: 'animus', strength: 0.7 },
            
            // Shadow connections
            { source: 'shadow', target: 'self', strength: 0.8 },
            { source: 'shadow', target: 'anima', strength: 0.6 },
            { source: 'shadow', target: 'animus', strength: 0.6 },
            { source: 'shadow', target: 'persona', strength: 0.5 },
            
            // Persona connections
            { source: 'persona', target: 'self', strength: 0.7 },
            { source: 'persona', target: 'anima', strength: 0.4 },
            { source: 'persona', target: 'animus', strength: 0.4 },
            
            // Parental influences
            { source: 'mother', target: 'anima', strength: 0.8 },
            { source: 'father', target: 'animus', strength: 0.8 },
            { source: 'mother', target: 'child', strength: 0.7 },
            { source: 'father', target: 'child', strength: 0.7 },
            
            // Wisdom connections
            { source: 'wise-old-man', target: 'animus', strength: 0.6 },
            { source: 'wise-old-woman', target: 'anima', strength: 0.6 },
            { source: 'wise-old-man', target: 'self', strength: 0.5 },
            { source: 'wise-old-woman', target: 'self', strength: 0.5 },
            
            // Hero's journey
            { source: 'hero', target: 'self', strength: 0.7 },
            { source: 'hero', target: 'shadow', strength: 0.6 },
            { source: 'hero', target: 'anima', strength: 0.5 },
            { source: 'hero', target: 'animus', strength: 0.5 },
            
            // Trickster dynamics
            { source: 'trickster', target: 'shadow', strength: 0.7 },
            { source: 'trickster', target: 'persona', strength: 0.6 },
            { source: 'trickster', target: 'hero', strength: 0.5 },
            
            // Child connections
            { source: 'child', target: 'self', strength: 0.6 },
            { source: 'child', target: 'hero', strength: 0.5 }
        ];
    }
    
    init() {
        // Setup camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 100);
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 1);
        this.container.appendChild(this.renderer.domElement);
        
        // Setup controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 30;
        this.controls.maxDistance = 200;
        
        // Setup lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(50, 50, 50);
        this.scene.add(pointLight);
        
        // Initialize force graph
        this.forceGraph = new ForceGraph3D(this.archetypes, this.relationships);
        
        // Create nodes
        this.createNodes();
        
        // Create edges
        this.createEdges();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start animation
        this.animate();
    }
    
    createNodes() {
        this.archetypes.forEach(archetype => {
            const node = new ArchetypeNode(archetype);
            this.nodes.set(archetype.id, node);
            this.scene.add(node.mesh);
        });
    }
    
    createEdges() {
        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.4
        });
        
        this.relationships.forEach(rel => {
            const sourceNode = this.nodes.get(rel.source);
            const targetNode = this.nodes.get(rel.target);
            
            if (sourceNode && targetNode) {
                const geometry = new THREE.BufferGeometry();
                const positions = new Float32Array(6);
                const colors = new Float32Array(6);
                
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                
                const line = new THREE.Line(geometry, material);
                line.userData = { 
                    source: sourceNode, 
                    target: targetNode,
                    strength: rel.strength 
                };
                
                this.edges.push(line);
                this.scene.add(line);
            }
        });
    }
    
    updateEdges() {
        this.edges.forEach(edge => {
            const { source, target, strength } = edge.userData;
            const positions = edge.geometry.attributes.position.array;
            const colors = edge.geometry.attributes.color.array;
            
            // Update positions
            positions[0] = source.mesh.position.x;
            positions[1] = source.mesh.position.y;
            positions[2] = source.mesh.position.z;
            positions[3] = target.mesh.position.x;
            positions[4] = target.mesh.position.y;
            positions[5] = target.mesh.position.z;
            
            // Update colors based on strength
            const color = new THREE.Color(0xffffff);
            color.multiplyScalar(strength);
            
            colors[0] = colors[3] = color.r;
            colors[1] = colors[4] = color.g;
            colors[2] = colors[5] = color.b;
            
            edge.geometry.attributes.position.needsUpdate = true;
            edge.geometry.attributes.color.needsUpdate = true;
            
            // Update visibility based on filter
            const sourceVisible = this.isNodeVisible(source.data);
            const targetVisible = this.isNodeVisible(target.data);
            edge.visible = sourceVisible && targetVisible;
        });
    }
    
    isNodeVisible(nodeData) {
        return this.filterCategory === 'all' || nodeData.category === this.filterCategory;
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Mouse events
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e));
        
        // Filter controls
        this.setupFilterControls();
    }
    
    setupFilterControls() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-controls';
        
        const categories = ['all', 'contrasexual', 'core', 'social', 'parental', 'wisdom', 'journey', 'transformative', 'developmental'];
        
        categories.forEach(category => {
            const button = document.createElement('button');
            button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            button.className = category === 'all' ? 'active' : '';
            button.addEventListener('click', () => this.setFilter(category, button));
            filterContainer.appendChild(button);
        });
        
        this.container.appendChild(filterContainer);
    }
    
    setFilter(category, button) {
        this.filterCategory = category;
        
        // Update button states
        button.parentElement.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Update node visibility
        this.nodes.forEach((node, id) => {
            const visible = this.isNodeVisible(node.data);
            node.setVisible(visible);
        });
        
        // Update edge visibility in updateEdges
    }
    
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
    
    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Raycast for hover effects
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            Array.from(this.nodes.values()).map(n => n.mesh)
        );
        
        // Reset all nodes
        this.nodes.forEach(node => node.setHover(false));
        
        // Highlight hovered node
        if (intersects.length > 0) {
            const hoveredMesh = intersects[0].object;
            this.nodes.forEach(node => {
                if (node.mesh === hoveredMesh) {
                    node.setHover(true);
                }
            });
            this.renderer.domElement.style.cursor = 'pointer';
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }
    }
    
    onMouseClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            Array.from(this.nodes.values()).map(n => n.mesh)
        );
        
        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            this.nodes.forEach(node => {
                if (node.mesh === clickedMesh) {
                    this.selectNode(node);
                }
            });
        } else {
            this.deselectNode();
        }
    }
    
    selectNode(node) {
        // Deselect previous
        if (this.selectedNode) {
            this.selectedNode.setSelected(false);
        }
        
        // Select new node
        this.selectedNode = node;
        node.setSelected(true);
        
        // Show info panel
        this.showInfoPanel(node.data);
        
        // Highlight connected nodes
        this.highlightConnections(node.data.id);
    }
    
    deselectNode() {
        if (this.selectedNode) {
            this.selectedNode.setSelected(false);
            this.selectedNode = null;
        }
        
        this.hideInfoPanel();
        this.clearHighlights();
    }
    
    highlightConnections(nodeId) {
        // Dim all nodes
        this.nodes.forEach(node => node.setDimmed(true));
        
        // Highlight selected and connected nodes
        const connected = new Set([nodeId]);
        
        this.relationships.forEach(rel => {
            if (rel.source === nodeId) connected.add(rel.target);
            if (rel.target === nodeId) connected.add(rel.source);
        });
        
        connected.forEach(id => {
            const node = this.nodes.get(id);
            if (node) node.setDimmed(false);
        });
    }
    
    clearHighlights() {
        this.nodes.forEach(node => node.setDimmed(false));
    }
    
    showInfoPanel(archetype) {
        let panel = document.querySelector('.info-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'info-panel';
            this.container.appendChild(panel);
        }
        
        panel.innerHTML = `
            <h3>${archetype.name}</h3>
            <p class="category">${archetype.category}</p>
            <p class="description">${archetype.description}</p>
        `;
        
        panel.classList.add('visible');
    }
    
    hideInfoPanel() {
        const panel = document.querySelector('.info-panel');
        if (panel) {
            panel.classList.remove('visible');
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Update force simulation
        this.forceGraph.update();
        
        // Update node positions
        this.nodes.forEach((node, id) => {
            const position = this.forceGraph.getNodePosition(id);
            if (position) {
                node.mesh.position.lerp(position, 0.1);
                node.update();
            }
        });
        
        // Update edges
        this.updateEdges();
        
        // Update controls
        this.controls.update();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    dispose() {
        // Clean up resources
        this.nodes.forEach(node => node.dispose());
        this.edges.forEach(edge => {
            edge.geometry.dispose();
            this.scene.remove(edge);
        });
        
        this.renderer.dispose();
        this.controls.dispose();
        
        // Remove event listeners
        window.removeEventListener('resize', () => this.onWindowResize());
    }
}

export default AnimaAnimus;