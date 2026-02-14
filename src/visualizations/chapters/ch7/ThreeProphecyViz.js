/**
 * ThreeProphecyViz.js — Chapter 7: "The Prophecies of Nostradamus"
 * Celestial zodiacal clock, vision flash bursts, prophetic waypoints,
 * Aquarian tension crescendo.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const AMBER = new THREE.Color('#ff8c00');
const ZODIAC_CLR = new THREE.Color('#ffaa33');

export default class ThreeProphecyViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x050505);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050505, 0.01);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 0, 18);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        // Zodiacal clock — 12 segments
        this.zodiacRings = [];
        for (let i = 0; i < 3; i++) {
            const r = 5 + i * 2.2;
            const pts = [];
            for (let j = 0; j <= 120; j++) {
                const a = (j / 120) * Math.PI * 2;
                pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
            }
            const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: ZODIAC_CLR, transparent: true, opacity: 0.1 - i * 0.02, blending: THREE.AdditiveBlending }));
            this.scene.add(ring);
            this.zodiacRings.push(ring);
        }

        // 12 zodiac division lines
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const pts = [new THREE.Vector3(Math.cos(a) * 4, Math.sin(a) * 4, 0), new THREE.Vector3(Math.cos(a) * 10, Math.sin(a) * 10, 0)];
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: AMBER, transparent: true, opacity: 0.06 }));
            this.scene.add(line);
        }

        // Prophetic waypoints (12 glowing nodes)
        this.waypoints = [];
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const r = 6.5;
            const m = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending }));
            m.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
            this.scene.add(m);
            this.waypoints.push({ mesh: m, angle: a });
        }

        // Clock hand (current aeon pointer)
        this.handPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 6, 0)];
        this.hand = new THREE.Line(new THREE.BufferGeometry().setFromPoints(this.handPts), new THREE.LineBasicMaterial({ color: AMBER, transparent: true, opacity: 0.4 }));
        this.scene.add(this.hand);

        // Vision flash burst (ambient particles that occasionally flare)
        const flashN = 200;
        const flashPos = new Float32Array(flashN * 3);
        for (let i = 0; i < flashN; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * 12;
            flashPos[i * 3] = Math.cos(a) * r;
            flashPos[i * 3 + 1] = Math.sin(a) * r;
            flashPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
        }
        const flashGeo = new THREE.BufferGeometry();
        flashGeo.setAttribute('position', new THREE.BufferAttribute(flashPos, 3));
        this.flashPts = new THREE.Points(flashGeo, new THREE.PointsMaterial({ color: 0xff8c00, size: 0.06, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
        this.scene.add(this.flashPts);

        // Background stars
        const starN = 300;
        const starPos = new Float32Array(starN * 3);
        for (let i = 0; i < starN; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 40;
            starPos[i * 3 + 1] = (Math.random() - 0.5) * 40;
            starPos[i * 3 + 2] = -10 + (Math.random() - 0.5) * 10;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x333340, size: 0.03, transparent: true, opacity: 0.4 })));

        this.scene.add(new THREE.AmbientLight(0x0a0a10, 0.2));

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.3, 0.5, 0.35);
        this.composer.addPass(this.bloom);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Clock rotation
        const clockAngle = t * 0.015;
        this.hand.rotation.z = -clockAngle;

        // Zodiac rings slowly counter-rotate
        this.zodiacRings.forEach((r, i) => { r.rotation.z = clockAngle * (0.3 + i * 0.1) * (i % 2 === 0 ? 1 : -1); });

        // Waypoints pulse based on clock hand proximity
        for (const wp of this.waypoints) {
            const diff = Math.abs(((clockAngle % (Math.PI * 2)) - wp.angle + Math.PI * 3) % (Math.PI * 2) - Math.PI);
            const glow = Math.max(0, 1 - diff / 0.5);
            wp.mesh.material.opacity = 0.2 + glow * 0.7;
            wp.mesh.scale.setScalar(1 + glow * 0.8);
        }

        // Vision flash bursts — periodic intensity spikes
        const flash = Math.sin(t * 0.3) > 0.95 ? 0.8 : 0.15;
        this.flashPts.material.opacity = flash;

        // Camera
        this.camera.position.x = this.mouseSmooth.x * 4;
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
        this.renderer?.dispose(); this.renderer?.forceContextLoss();
        this.scene?.traverse(o => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
        this.composer = null; this.scene = null; this.renderer = null; super.dispose();
    }
}
