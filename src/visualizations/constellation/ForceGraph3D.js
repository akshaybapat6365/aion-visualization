import * as d3 from 'd3';
import * as THREE from 'three';

class ForceGraph3D {
    constructor(nodes, links) {
        this.nodes = nodes.map(node => ({
            ...node,
            x: (Math.random() - 0.5) * 50,
            y: (Math.random() - 0.5) * 50,
            z: (Math.random() - 0.5) * 50,
            vx: 0,
            vy: 0,
            vz: 0
        }));
        
        this.links = links.map(link => ({
            ...link,
            source: this.nodes.find(n => n.id === link.source),
            target: this.nodes.find(n => n.id === link.target)
        }));
        
        this.simulation = null;
        this.alpha = 1;
        this.alphaDecay = 0.0228;
        this.alphaMin = 0.001;
        this.velocityDecay = 0.4;
        
        this.initializeSimulation();
    }
    
    initializeSimulation() {
        // Create 2D simulation for x,y coordinates
        this.simulation = d3.forceSimulation(this.nodes)
            .force('charge', d3.forceManyBody()
                .strength(-300)
                .distanceMax(200))
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(d => 50 / d.strength)
                .strength(d => d.strength))
            .force('center', d3.forceCenter(0, 0))
            .force('collision', d3.forceCollide()
                .radius(15)
                .strength(0.7));
        
        // Add custom 3D forces
        this.simulation.force('z', this.forceZ())
            .force('cluster', this.forceCluster())
            .force('boundary', this.forceBoundary());
        
        // Stop automatic simulation - we'll control it manually
        this.simulation.stop();
    }
    
    forceZ() {
        // Custom force for Z-axis movement
        let nodes;
        
        function force(alpha) {
            nodes.forEach(node => {
                // Apply repulsion in Z direction
                nodes.forEach(other => {
                    if (node !== other) {
                        const dx = node.x - other.x;
                        const dy = node.y - other.y;
                        const dz = node.z - other.z;
                        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
                        
                        if (distance < 100) {
                            const strength = alpha * 100 / (distance * distance);
                            node.vz += (dz / distance) * strength;
                        }
                    }
                });
                
                // Center force in Z
                node.vz -= node.z * alpha * 0.01;
            });
        }
        
        force.initialize = function(_) {
            nodes = _;
        };
        
        return force;
    }
    
    forceCluster() {
        // Group nodes by category
        let nodes;
        const centers = {
            contrasexual: { x: 0, y: 30, z: 0 },
            core: { x: 0, y: 0, z: 0 },
            social: { x: -40, y: 0, z: 20 },
            parental: { x: 40, y: 0, z: 20 },
            wisdom: { x: 0, y: -30, z: -20 },
            journey: { x: -30, y: 20, z: -20 },
            transformative: { x: 30, y: -20, z: -20 },
            developmental: { x: 0, y: 0, z: 40 }
        };
        
        function force(alpha) {
            nodes.forEach(node => {
                const center = centers[node.category];
                if (center) {
                    node.vx += (center.x - node.x) * alpha * 0.02;
                    node.vy += (center.y - node.y) * alpha * 0.02;
                    node.vz += (center.z - node.z) * alpha * 0.02;
                }
            });
        }
        
        force.initialize = function(_) {
            nodes = _;
        };
        
        return force;
    }
    
    forceBoundary() {
        // Keep nodes within bounds
        const radius = 80;
        let nodes;
        
        function force(alpha) {
            nodes.forEach(node => {
                const distance = Math.sqrt(node.x * node.x + node.y * node.y + node.z * node.z);
                if (distance > radius) {
                    const scale = radius / distance;
                    node.vx += (node.x * scale - node.x) * alpha * 0.1;
                    node.vy += (node.y * scale - node.y) * alpha * 0.1;
                    node.vz += (node.z * scale - node.z) * alpha * 0.1;
                }
            });
        }
        
        force.initialize = function(_) {
            nodes = _;
        };
        
        return force;
    }
    
    update() {
        if (this.alpha < this.alphaMin) {
            return;
        }
        
        // Update alpha
        this.alpha += (0 - this.alpha) * this.alphaDecay;
        
        // Apply forces
        this.simulation.force('charge').strength(-300 * this.alpha);
        this.simulation.force('link').strength(d => d.strength * this.alpha);
        
        // Run one simulation step
        this.simulation.tick();
        
        // Apply custom Z force
        const zForce = this.simulation.force('z');
        if (zForce) {
            zForce(this.alpha);
        }
        
        // Apply velocity and update positions
        this.nodes.forEach(node => {
            // Apply velocity decay
            node.vx *= this.velocityDecay;
            node.vy *= this.velocityDecay;
            node.vz *= this.velocityDecay;
            
            // Update positions
            node.x += node.vx;
            node.y += node.vy;
            node.z += node.vz;
        });
    }
    
    getNodePosition(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            return new THREE.Vector3(node.x, node.y, node.z);
        }
        return null;
    }
    
    reheat() {
        this.alpha = 1;
    }
    
    setNodePosition(nodeId, position) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            node.x = position.x;
            node.y = position.y;
            node.z = position.z;
            node.vx = 0;
            node.vy = 0;
            node.vz = 0;
        }
    }
    
    getConnectedNodes(nodeId) {
        const connected = new Set();
        
        this.links.forEach(link => {
            if (link.source.id === nodeId) {
                connected.add(link.target.id);
            } else if (link.target.id === nodeId) {
                connected.add(link.source.id);
            }
        });
        
        return Array.from(connected);
    }
    
    getNodesByCategory(category) {
        return this.nodes.filter(node => node.category === category);
    }
    
    updateLinkStrength(sourceId, targetId, strength) {
        const link = this.links.find(l => 
            (l.source.id === sourceId && l.target.id === targetId) ||
            (l.source.id === targetId && l.target.id === sourceId)
        );
        
        if (link) {
            link.strength = strength;
            this.reheat();
        }
    }
}

export default ForceGraph3D;