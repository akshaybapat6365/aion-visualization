/**
 * ThreeAeonViz.js — Chapter 14: "The Structure and Dynamics of the Self"
 * Grand synthesis: ego-Self axis, all opposites in balanced orbit,
 * cosmic Aquarian dawn, breathing mandala.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const GOLD = new THREE.Color('#ffd700');
const EGO_CLR = new THREE.Color('#e0e0f0');
const SELF_CLR = new THREE.Color('#ffd700');
const DAWN = new THREE.Color('#ff6f00');
const PAIR_COLORS = [new THREE.Color('#e63946'), new THREE.Color('#457b9d'), new THREE.Color('#2a9d8f'), new THREE.Color('#e9c46a'), new THREE.Color('#7c4dff'), new THREE.Color('#e91e63')];

export default class ThreeAeonViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x030308);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x030308, 0.005);
        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 5, 25);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        // Ego-Self Axis (vertical beam)
        this.ego = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), new THREE.MeshBasicMaterial({ color: EGO_CLR, transparent: true, opacity: 0.9 }));
        this.ego.position.set(0, 5, 0);
        this.scene.add(this.ego);

        this.self = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 20), new THREE.MeshBasicMaterial({ color: SELF_CLR, transparent: true, opacity: 0.8 }));
        this.self.position.set(0, -5, 0);
        this.scene.add(this.self);

        this.axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 5, 0), new THREE.Vector3(0, -5, 0)]),
            new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.2 }));
        this.scene.add(this.axis);

        // Opposing pairs in balanced orbit (6 pairs = 12 nodes)
        this.pairs = [];
        for (let i = 0; i < 6; i++) {
            const r = 4 + i * 1.5;
            const y = (i - 2.5) * 1.5;
            const a = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 1), new THREE.MeshBasicMaterial({ color: PAIR_COLORS[i], transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
            const b = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 1), new THREE.MeshBasicMaterial({ color: PAIR_COLORS[i], transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
            this.scene.add(a, b);

            // Connection ring
            const ringPts = [];
            for (let j = 0; j <= 60; j++) {
                const angle = (j / 60) * Math.PI * 2;
                ringPts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
            }
            const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts),
                new THREE.LineBasicMaterial({ color: PAIR_COLORS[i], transparent: true, opacity: 0.04 }));
            this.scene.add(ring);

            this.pairs.push({ a, b, r, y, speed: 0.03 + i * 0.005, ring });
        }

        // Breathing mandala rings
        this.mandalaRings = [];
        for (let i = 0; i < 4; i++) {
            const r = 8 + i * 3;
            const pts = [];
            const segs = 4 + i;
            for (let j = 0; j <= 120; j++) {
                const a = (j / 120) * Math.PI * 2;
                const w = Math.sin(a * segs) * 0.5;
                pts.push(new THREE.Vector3(Math.cos(a) * (r + w), 0, Math.sin(a) * (r + w)));
            }
            const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending }));
            this.scene.add(ring);
            this.mandalaRings.push({ ring, speed: 0.002 * (i % 2 === 0 ? 1 : -1) });
        }

        // Dawn horizon glow
        this.dawn = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.MeshBasicMaterial({
            color: DAWN, transparent: true, opacity: 0.02, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        }));
        this.dawn.position.set(0, -8, -20);
        this.scene.add(this.dawn);

        // Cosmic particles
        const cosmicN = 500;
        const cosmicPos = new Float32Array(cosmicN * 3);
        for (let i = 0; i < cosmicN; i++) {
            cosmicPos[i * 3] = (Math.random() - 0.5) * 50;
            cosmicPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
            cosmicPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        const cosmicGeo = new THREE.BufferGeometry();
        cosmicGeo.setAttribute('position', new THREE.BufferAttribute(cosmicPos, 3));
        this.scene.add(new THREE.Points(cosmicGeo, new THREE.PointsMaterial({ color: 0x404060, size: 0.04, transparent: true, opacity: 0.3 })));

        this.scene.add(new THREE.AmbientLight(0x0a0a10, 0.2));
        this.scene.add(new THREE.PointLight(0xffd700, 0.4, 30));

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.5, 0.4, 0.25);
        this.composer.addPass(this.bloom);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Ego-Self axis breathe
        this.ego.material.opacity = 0.7 + Math.sin(t * 1.5) * 0.3;
        this.self.material.opacity = 0.6 + Math.sin(t * 0.8) * 0.2;
        this.self.scale.setScalar(1 + Math.sin(t * 0.5) * 0.1);
        this.axis.material.opacity = 0.15 + Math.sin(t * 0.3) * 0.05;

        // Opposing pairs orbit
        for (const pair of this.pairs) {
            const angle = t * pair.speed;
            pair.a.position.set(Math.cos(angle) * pair.r, pair.y, Math.sin(angle) * pair.r);
            pair.b.position.set(-Math.cos(angle) * pair.r, pair.y, -Math.sin(angle) * pair.r);
            pair.a.rotation.y = t * 0.3;
            pair.b.rotation.y = -t * 0.3;
        }

        // Breathing mandala
        for (const mr of this.mandalaRings) {
            mr.ring.rotation.y += mr.speed;
            const breathe = 1 + Math.sin(t * 0.2) * 0.05;
            mr.ring.scale.setScalar(breathe);
        }

        // Dawn glow pulse
        this.dawn.material.opacity = 0.01 + Math.sin(t * 0.05) * 0.01;

        // Camera orbit
        const ca = t * 0.008 + this.mouseSmooth.x * 0.15;
        this.camera.position.x = Math.sin(ca) * 25;
        this.camera.position.y = 5 + this.mouseSmooth.y * 5;
        this.camera.position.z = Math.cos(ca) * 25;
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
        this.renderer?.dispose(); this.renderer?.forceContextLoss();
        this.scene?.traverse(o => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
        this.composer = null; this.scene = null; this.renderer = null; super.dispose();
    }
}
