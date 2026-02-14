/**
 * ThreeSelfViz.js — Chapter 4: "The Self"
 * Procedural mandala with four-quadrant structure, pulsing center, infinite zoom fractal.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const GOLD = new THREE.Color('#ffd700');
const QUAD_COLORS = [new THREE.Color('#e63946'), new THREE.Color('#457b9d'), new THREE.Color('#2a9d8f'), new THREE.Color('#e9c46a')];

export default class ThreeSelfViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x030308);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 0, 20);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);
        this._onWheel = e => { this.zoomTarget = Math.max(5, Math.min(30, this.zoomTarget + e.deltaY * 0.01)); };
        addEventListener('wheel', this._onWheel, { passive: true });
        this.zoomTarget = 20;

        // Center point (Self)
        this.center = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.9 }));
        this.scene.add(this.center);
        this.centerGlow = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending }));
        this.scene.add(this.centerGlow);

        // Four quadrants (particle bands)
        this.quads = [];
        for (let q = 0; q < 4; q++) {
            const count = 250;
            const pos = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const r = 2 + Math.random() * 8;
                const a = (q / 4 + Math.random() * 0.22) * Math.PI * 2;
                pos[i * 3] = Math.cos(a) * r;
                pos[i * 3 + 1] = Math.sin(a) * r;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: QUAD_COLORS[q], size: 0.06, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
            this.scene.add(pts);
            this.quads.push(pts);
        }

        // Mandala rings (concentric rotating rings)
        this.mandalaRings = [];
        for (let i = 0; i < 6; i++) {
            const r = 1.5 + i * 1.8;
            const segs = 6 + i * 2;
            const pts = [];
            for (let j = 0; j <= 80; j++) {
                const a = (j / 80) * Math.PI * 2;
                const wobble = Math.sin(a * segs) * 0.3;
                pts.push(new THREE.Vector3(Math.cos(a) * (r + wobble), Math.sin(a) * (r + wobble), 0));
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const ring = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.08 + i * 0.02, blending: THREE.AdditiveBlending }));
            this.scene.add(ring);
            this.mandalaRings.push({ ring, segs, r, speed: 0.005 * (i % 2 === 0 ? 1 : -1) });
        }

        // Cross axes (four directions)
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * 15, Math.sin(a) * 15, 0)];
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.06 }));
            this.scene.add(line);
        }

        this.scene.add(new THREE.AmbientLight(0x0a0a10, 0.2));

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.5, 0.5, 0.3);
        this.composer.addPass(this.bloom);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Center pulse
        const pulse = 0.7 + Math.sin(t * 1.5) * 0.3;
        this.center.material.opacity = pulse;
        this.centerGlow.material.opacity = 0.06 + Math.sin(t * 0.8) * 0.04;
        this.center.scale.setScalar(0.8 + Math.sin(t * 1.5) * 0.2);

        // Rotate quadrant particles
        for (let q = 0; q < 4; q++) {
            this.quads[q].rotation.z = t * (0.02 + q * 0.005) * (q % 2 === 0 ? 1 : -1);
        }

        // Mandala rings rotate
        for (const mr of this.mandalaRings) {
            mr.ring.rotation.z += mr.speed;
            // Breathe the ring
            const breathe = 1 + Math.sin(t * 0.3 + mr.r) * 0.05;
            mr.ring.scale.setScalar(breathe);
        }

        // Infinite zoom via camera
        this.camera.position.z += (this.zoomTarget - this.camera.position.z) * 0.05;
        this.camera.position.x = this.mouseSmooth.x * 3;
        this.camera.position.y = this.mouseSmooth.y * 3;
        this.camera.lookAt(0, 0, 0);
    }

    render() { this.composer?.render(); }
    onResize(w, h) {
        if (!this.renderer) return;
        this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h); this.composer?.setSize(w, h); this.bloom?.setSize(w, h);
    }
    dispose() {
        removeEventListener('mousemove', this._onMM);
        removeEventListener('wheel', this._onWheel);
        this.renderer?.dispose(); this.renderer?.forceContextLoss();
        this.scene?.traverse(o => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
        this.composer = null; this.scene = null; this.renderer = null; super.dispose();
    }
}
