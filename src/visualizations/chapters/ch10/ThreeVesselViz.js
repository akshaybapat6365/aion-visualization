import * as THREE from 'three';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/**
 * Chapter 10: The Fish in Alchemy
 * 3D Visualization: The Alchemical Vessel (Retort) and the transmuting Lapis.
 */
export default class ThreeVesselViz extends BaseViz {
    constructor(container) {
        super(container, { contextType: 'webgl' });
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.vessel = null;
        this.liquid = null;
        this.particles = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.stage = 0;
        this.stages = [
            { name: 'Nigredo', color: 0x1a1a1a, emissive: 0x000000, desc: 'The Blackening - Chaos' },
            { name: 'Albedo', color: 0xe0e0e0, emissive: 0x222222, desc: 'The Whitening - Purification' },
            { name: 'Citrinitas', color: 0xd4af37, emissive: 0x554400, desc: 'The Yellowing - Solar Dawn' },
            { name: 'Rubedo', color: 0xa83232, emissive: 0x330000, desc: 'The Reddening - The Stone' }
        ];
    }

    async init() {
        // 1. Setup Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050508);
        this.scene.fog = new THREE.FogExp2(0x050508, 0.05);

        const aspect = this.width / this.height;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
        this.camera.position.set(0, 2, 8);
        this.camera.lookAt(0, 1, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        // 2. Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambient);

        const spot = new THREE.SpotLight(0xffffff, 5);
        spot.position.set(5, 10, 5);
        spot.angle = 0.5;
        spot.penumbra = 0.5;
        this.scene.add(spot);

        const fireLight = new THREE.PointLight(0xff4400, 2, 10);
        fireLight.position.set(0, -2, 0);
        this.scene.add(fireLight);
        this.fireLight = fireLight;

        // 3. Create Objects
        this.createVessel();
        this.createLiquid();
        this.createParticles();
        this.createFire();

        // 4. UI
        this._createUI();

        // 5. Interaction
        this.container.addEventListener('click', this.onClick.bind(this));

        // Initial state
        this.updateStageVisuals(0);
    }

    createVessel() {
        // Lathe Geometry for a Flask shape
        const points = [];
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            // Flask profile
            let x = 0;
            let y = (t - 0.5) * 6; // Height range -3 to 3

            if (t < 0.2) { // Bottom curve
                x = Math.sin(t * Math.PI * 2.5) * 2;
            } else if (t < 0.5) { // Body
                x = 2 + Math.cos((t - 0.2) * Math.PI * 1.5) * 0.5;
            } else { // Neck
                x = 0.8 + (t - 0.5) * 0.2;
            }
            points.push(new THREE.Vector2(Math.max(0.1, x), y));
        }

        const geo = new THREE.LatheGeometry(points, 32);
        const mat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0,
            transmission: 1, // Glass
            thickness: 0.5,
            clearcoat: 1,
            clearcoatRoughness: 0,
            side: THREE.DoubleSide
        });

        this.vessel = new THREE.Mesh(geo, mat);
        this.scene.add(this.vessel);

        // Add a rim maybe? existing lathe logic is simple enough
    }

    createLiquid() {
        // Inner liquid mesh
        // Use similar points but scaled down slightly
        const points = [];
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            if (t > 0.45) break; // Only fill half way
            let x = 0;
            let y = (t - 0.5) * 6;

            if (t < 0.2) {
                x = Math.sin(t * Math.PI * 2.5) * 2;
            } else if (t < 0.5) {
                x = 2 + Math.cos((t - 0.2) * Math.PI * 1.5) * 0.5;
            }
            points.push(new THREE.Vector2(Math.max(0.1, x * 0.9), y));
        }
        // Close the top
        const lastPt = points[points.length - 1];
        points.push(new THREE.Vector2(0, lastPt.y)); // To center

        const geo = new THREE.LatheGeometry(points, 32);
        const mat = new THREE.MeshPhysicalMaterial({
            color: 0x1a1a1a, // Nigredo start
            metalness: 0.2,
            roughness: 0.3,
            transmission: 0.8,
            thickness: 2,
            side: THREE.DoubleSide
        });

        this.liquid = new THREE.Mesh(geo, mat);
        this.scene.add(this.liquid);
    }

    createParticles() {
        // Bubbles inside
        const geometry = new THREE.BufferGeometry();
        const count = 200;
        const positions = new Float32Array(count * 3);
        const speeds = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 3;
            positions[i * 3 + 1] = -3 + Math.random() * 3;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
            speeds[i] = 0.5 + Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.5,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createFire() {
        // Simple base fire glow
        const geo = new THREE.CylinderGeometry(2.5, 3, 1, 32, 1, true);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const fireBase = new THREE.Mesh(geo, mat);
        fireBase.position.y = -3.5;
        this.scene.add(fireBase);
        this.fireMesh = fireBase;
    }

    _createUI() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position:absolute;inset:0;pointer-events:none;
          font-family:var(--font-sans,system-ui);color:#d4af37;
          display:flex; flex-direction:column; align-items:center; justify-content:space-between;
          padding: 10% 0;
        `;

        this.stageLabel = document.createElement('div');
        this.stageLabel.style.cssText = `
            text-align:center; text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        `;
        this.stageLabel.innerHTML = `
            <div style="font-size:1.5rem; letter-spacing:0.2em; font-weight:300">NIGREDO</div>
            <div style="font-size:0.8rem; opacity:0.7; margin-top:0.5rem">The Blackening - Chaos</div>
        `;
        overlay.appendChild(this.stageLabel);

        const hint = document.createElement('div');
        hint.innerHTML = "Click the vessel to transmute";
        hint.style.cssText = "font-size:0.8rem; opacity:0.5; margin-bottom: 2rem";
        overlay.appendChild(hint);

        this.container.appendChild(overlay);
        this._overlay = overlay;
    }

    onClick() {
        this.stage = (this.stage + 1) % this.stages.length;
        this.updateStageVisuals(this.stage);
    }

    updateStageVisuals(stageIndex) {
        const data = this.stages[stageIndex];

        // 1. Update Liquid Color
        if (this.liquid) {
            // Animate transition ideally, but set for now
            // GSAP/Tween would be great but we'll do linear interp in render if needed
            // For simplicity, direct set
            this.targetColor = new THREE.Color(data.color);
            this.targetEmissive = new THREE.Color(data.emissive);
        }

        // 2. Update UI
        if (this.stageLabel) {
            this.stageLabel.innerHTML = `
                <div style="font-size:1.5rem; letter-spacing:0.2em; font-weight:300; color:#${data.color.toString(16)}">${data.name.toUpperCase()}</div>
                <div style="font-size:0.8rem; opacity:0.7; margin-top:0.5rem; color:#fff">${data.desc}</div>
            `;
        }
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

        // 1. Color Lerp
        if (this.liquid && this.targetColor) {
            this.liquid.material.color.lerp(this.targetColor, 0.05);
            this.liquid.material.emissive.lerp(this.targetEmissive, 0.05);
        }

        // 2. Particles
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            const speeds = this.particles.geometry.attributes.speed.array;

            for (let i = 0; i < positions.length / 3; i++) {
                // Y movement
                positions[i * 3 + 1] += speeds[i] * 0.05;

                // Reset if top
                if (positions[i * 3 + 1] > 0) {
                    positions[i * 3 + 1] = -3;
                }

                // Wiggle
                positions[i * 3] += Math.sin(time * 2 + i) * 0.005;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        // 3. Fire Flicker
        if (this.fireLight) {
            this.fireLight.intensity = 2 + Math.sin(time * 10) * 0.5 + Math.random() * 0.5;
        }
        if (this.fireMesh) {
            this.fireMesh.material.opacity = 0.2 + Math.sin(time * 15) * 0.05;
        }

        // 4. Camera drift
        // this.camera.position.x = Math.sin(time * 0.2) * 0.5;
        // this.camera.lookAt(0, 1, 0);

        // 5. Render
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.container.removeEventListener('click', this.onClick.bind(this));
        if (this._overlay) this._overlay.remove();
        if (this.renderer) this.renderer.dispose();
        super.destroy();
    }
}
