import * as THREE from 'three';

class ArchetypeNode {
    constructor(data) {
        this.data = data;
        this.mesh = null;
        this.glowMesh = null;
        this.labelSprite = null;
        this.selected = false;
        this.hovered = false;
        this.dimmed = false;
        this.pulsePhase = Math.random() * Math.PI * 2;
        
        this.createNode();
        this.createLabel();
    }
    
    createNode() {
        // Main node geometry
        const geometry = new THREE.SphereGeometry(5, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: this.data.color,
            emissive: this.data.color,
            emissiveIntensity: 0.2,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.userData = { id: this.data.id, data: this.data };
        
        // Create glow effect
        const glowGeometry = new THREE.SphereGeometry(7, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.data.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glowMesh);
        
        // Add ring for special archetypes
        if (['anima', 'animus', 'self'].includes(this.data.id)) {
            this.createRing();
        }
    }
    
    createRing() {
        const ringGeometry = new THREE.TorusGeometry(8, 0.5, 16, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        this.mesh.add(ring);
    }
    
    createLabel() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Draw text
        context.font = '24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(this.data.name, 128, 32);
        
        // Create sprite
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8
        });
        
        this.labelSprite = new THREE.Sprite(spriteMaterial);
        this.labelSprite.scale.set(20, 5, 1);
        this.labelSprite.position.y = -10;
        this.mesh.add(this.labelSprite);
    }
    
    update() {
        // Pulse animation
        this.pulsePhase += 0.02;
        const pulseFactor = 1 + Math.sin(this.pulsePhase) * 0.1;
        
        if (this.selected) {
            this.mesh.scale.setScalar(1.2 * pulseFactor);
            this.glowMesh.material.opacity = 0.5;
        } else if (this.hovered) {
            this.mesh.scale.setScalar(1.1 * pulseFactor);
            this.glowMesh.material.opacity = 0.4;
        } else {
            this.mesh.scale.setScalar(1.0);
            this.glowMesh.material.opacity = 0.3;
        }
        
        // Rotate special nodes
        if (['anima', 'animus', 'self'].includes(this.data.id)) {
            this.mesh.rotation.y += 0.005;
        }
        
        // Update opacity based on dimmed state
        const targetOpacity = this.dimmed ? 0.3 : 0.9;
        this.mesh.material.opacity += (targetOpacity - this.mesh.material.opacity) * 0.1;
        this.labelSprite.material.opacity = this.dimmed ? 0.3 : 0.8;
        
        // Billboard label to camera
        if (this.mesh.parent) {
            const camera = this.mesh.parent.parent;
            if (camera && camera.isCamera) {
                this.labelSprite.lookAt(camera.position);
            }
        }
    }
    
    setSelected(selected) {
        this.selected = selected;
        
        if (selected) {
            this.mesh.material.emissiveIntensity = 0.5;
            
            // Add selection ring
            if (!this.selectionRing) {
                const ringGeometry = new THREE.TorusGeometry(10, 0.3, 16, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.8
                });
                
                this.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
                this.mesh.add(this.selectionRing);
            }
        } else {
            this.mesh.material.emissiveIntensity = 0.2;
            
            if (this.selectionRing) {
                this.mesh.remove(this.selectionRing);
                this.selectionRing.geometry.dispose();
                this.selectionRing.material.dispose();
                this.selectionRing = null;
            }
        }
    }
    
    setHover(hovered) {
        this.hovered = hovered;
        
        if (hovered) {
            this.mesh.material.emissiveIntensity = 0.4;
        } else if (!this.selected) {
            this.mesh.material.emissiveIntensity = 0.2;
        }
    }
    
    setDimmed(dimmed) {
        this.dimmed = dimmed;
    }
    
    setVisible(visible) {
        this.mesh.visible = visible;
        
        if (!visible) {
            // Reset states when hidden
            this.selected = false;
            this.hovered = false;
            this.dimmed = false;
        }
    }
    
    getPosition() {
        return this.mesh.position.clone();
    }
    
    setPosition(position) {
        this.mesh.position.copy(position);
    }
    
    dispose() {
        // Dispose of geometries and materials
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        
        if (this.glowMesh) {
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }
        
        if (this.labelSprite) {
            this.labelSprite.material.map.dispose();
            this.labelSprite.material.dispose();
        }
        
        if (this.selectionRing) {
            this.selectionRing.geometry.dispose();
            this.selectionRing.material.dispose();
        }
        
        // Remove children
        while (this.mesh.children.length > 0) {
            this.mesh.remove(this.mesh.children[0]);
        }
    }
}

export default ArchetypeNode;