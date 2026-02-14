import * as THREE from 'three';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Chapter 12: The Background of the Psychology
 * 3D Visualization: The Rhizome / Root System connecting Alchemy and Christianity.
 * Visualized as glowing neural pathways forming a tree structure.
 */
export default class ThreeRootsViz extends BaseViz {
    constructor(container) {
        super(container, { contextType: 'webgl' });
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.roots = null;
        this.pulses = [];
        this.mouse = new THREE.Vector2();
    }

    async init() {
        // 1. Setup Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020205);
        this.scene.fog = new THREE.FogExp2(0x020205, 0.03);

        const aspect = this.width / this.height;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 2. Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambient);

        // 3. Create Roots
        this.createRootSystem();

        // 4. UI
        this._createUI();

        // 5. Interaction
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    createRootSystem() {
        // Create a branching structure
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        // Root 1: Christianity (Blue/White)
        this.generateBranch(new THREE.Vector3(-2, 4, 0), new THREE.Vector3(0, -1, 0), 0x3498db, 5, positions, colors);

        // Root 2: Alchemy (Red/Gold)
        this.generateBranch(new THREE.Vector3(2, 4, 0), new THREE.Vector3(0, -1, 0), 0xe74c3c, 5, positions, colors);

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            linewidth: 2, // constrained by WebGL
            opacity: 0.6,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        this.roots = new THREE.LineSegments(geometry, material);
        this.scene.add(this.roots);

        // Pulse Particles (Synapses)
        const pulseGeo = new THREE.BufferGeometry();
        const pulseCount = 50;
        const pulsePos = new Float32Array(pulseCount * 3);
        const pulseSizes = new Float32Array(pulseCount);

        for (let i = 0; i < pulseCount; i++) {
            pulsePos[i * 3] = 0;
            pulsePos[i * 3 + 1] = 0;
            pulsePos[i * 3 + 2] = 0;
            pulseSizes[i] = 0.2 + Math.random() * 0.3;

            this.pulses.push({
                index: i,
                progress: Math.random(),
                path: Math.random() > 0.5 ? 'left' : 'right', // simple path logic
                speed: 0.2 + Math.random() * 0.3
            });
        }

        pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
        pulseGeo.setAttribute('size', new THREE.BufferAttribute(pulseSizes, 1));

        const pulseMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            map: this.createGlowTexture(),
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.pulseSystem = new THREE.Points(pulseGeo, pulseMat);
        this.scene.add(this.pulseSystem);
    }

    generateBranch(start, dir, color, depth, positions, colors) {
        if (depth === 0) return;

        const end = new THREE.Vector3().copy(start).add(dir);

        // Add random wiggle
        end.x += (Math.random() - 0.5) * 1.5;
        end.z += (Math.random() - 0.5) * 1.5;

        // Line segment
        positions.push(start.x, start.y, start.z);
        positions.push(end.x, end.y, end.z);

        const c = new THREE.Color(color);
        colors.push(c.r, c.g, c.b);
        colors.push(c.r, c.g, c.b);

        // Branch out
        const numBranches = 2;
        for (let i = 0; i < numBranches; i++) {
            const nextDir = dir.clone().multiplyScalar(0.8);
            nextDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), (Math.random() - 0.5) * 1.0);
            nextDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), (Math.random() - 0.5) * 1.0);

            this.generateBranch(end, nextDir, color, depth - 1, positions, colors);
        }
    }

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 32, 32);
        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    _createUI() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position:absolute;inset:0;pointer-events:none;
          font-family:var(--font-sans,system-ui);color:#aaa;
          display:flex; justify-content:space-between; padding: 2rem;
          background: radial-gradient(circle at center, transparent 0%, #000 120%);
        `;

        overlay.innerHTML = `
            <div style="text-align:left">
                <h3 style="color:#3498db; margin:0">CHRISTIANITY</h3>
                <span style="font-size:0.8rem; opacity:0.7">Dogma & Ritual</span>
            </div>
            <div style="text-align:right">
                <h3 style="color:#e74c3c; margin:0">ALCHEMY</h3>
                <span style="font-size:0.8rem; opacity:0.7">Experience & Matter</span>
            </div>
        `;

        const centerLabel = document.createElement('div');
        centerLabel.innerHTML = "THE ROOT SYSTEM<br><span style='font-size:0.6em'>Psychological Unconscious</span>";
        centerLabel.style.cssText = `
            position:absolute; bottom:10%; width:100%; text-align:center; 
            color:#fff; opacity:0.5; font-size:1.2rem; letter-spacing:0.2em;
        `;
        overlay.appendChild(centerLabel);

        this.container.appendChild(overlay);
        this._overlay = overlay;
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onResize(width, height) {
        if (this.camera && this.renderer) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
    }

    render() {
        if (!this.renderer || !this.scene || !this.camera) return;
        const time = this.time;

        // Rotate the root system slightly
        if (this.roots) {
            this.roots.rotation.y = Math.sin(time * 0.2) * 0.1;

            // Interaction: Mouse moves the roots
            this.roots.rotation.x = this.mouse.y * 0.1;
            this.roots.rotation.y += this.mouse.x * 0.1;
        }

        // Animate Pulses
        if (this.pulseSystem) {
            const positions = this.pulseSystem.geometry.attributes.position.array;

            // Simple hack: We don't have the exact path data easily accessible on GPU
            // So we'll just simulate pulses moving down generally and randomizing xy
            for (let i = 0; i < this.pulses.length; i++) {
                const p = this.pulses[i];
                p.progress += 0.01 + p.speed * 0.05;
                if (p.progress > 1) p.progress = 0;

                // Map progress 0->1 to Y range 4 -> -5
                const y = 4 - p.progress * 9;
                let x = 0;

                // Split divergence
                if (p.path === 'left') {
                    x = -2 * p.progress; // Move left (Christianity)
                } else {
                    x = 2 * p.progress; // Move right (Alchemy)
                }

                // Add noise
                x += Math.sin(time * 5 + i) * 0.5;

                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = Math.cos(time * 3 + i) * 0.5;
            }
            this.pulseSystem.geometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        window.removeEventListener('mousemove', this.onMouseMove.bind(this));
        if (this._overlay) this._overlay.remove();
        if (this.renderer) this.renderer.dispose();
        super.destroy();
    }
}
