/**
 * ThreeSyzygyViz.js — Chapter 3: "The Syzygy: Anima and Animus"
 * Dual luminous orbiting forms, magnetic field lines, conjunction burst.
 * Solar gold + lunar silver palette.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const ANIMA_CLR = new THREE.Color('#c0c0e0');
const ANIMUS_CLR = new THREE.Color('#ffd700');
const FIELD_CLR = new THREE.Color('#4a4a8a');

export default class ThreeSyzygyViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x030308);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x030308, 0.015);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 3, 14);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        // Anima (lunar silver)
        this.anima = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 3), new THREE.MeshStandardMaterial({ color: ANIMA_CLR, emissive: ANIMA_CLR, emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.5 }));
        this.scene.add(this.anima);

        // Animus (solar gold)
        this.animus = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 2), new THREE.MeshStandardMaterial({ color: ANIMUS_CLR, emissive: ANIMUS_CLR, emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.5 }));
        this.scene.add(this.animus);

        // Magnetic field lines
        this.fieldLines = [];
        for (let i = 0; i < 12; i++) {
            const pts = [];
            for (let j = 0; j <= 40; j++) pts.push(new THREE.Vector3());
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: FIELD_CLR, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending }));
            this.scene.add(line);
            this.fieldLines.push({ geo, line, offset: (i / 12) * Math.PI * 2 });
        }

        // Conjunction particle burst
        const cN = 200;
        const cPos = new Float32Array(cN * 3);
        this.conjData = [];
        for (let i = 0; i < cN; i++) {
            cPos[i * 3] = cPos[i * 3 + 1] = cPos[i * 3 + 2] = 0;
            this.conjData.push({ vel: new THREE.Vector3(), life: 1 + Math.random() });
        }
        const cGeo = new THREE.BufferGeometry();
        cGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
        this.conjPts = new THREE.Points(cGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        this.scene.add(this.conjPts);

        // Background stars
        const starN = 400;
        const starPos = new Float32Array(starN * 3);
        for (let i = 0; i < starN; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 40;
            starPos[i * 3 + 1] = (Math.random() - 0.5) * 30;
            starPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        this.scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x404060, size: 0.04, transparent: true, opacity: 0.3 })));

        this.scene.add(new THREE.AmbientLight(0x0a0a20, 0.3));
        this.scene.add(new THREE.PointLight(0xc0c0e0, 0.4, 15));
        this.goldenLight = new THREE.PointLight(0xffd700, 0.4, 15);
        this.scene.add(this.goldenLight);

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.2, 0.5, 0.35);
        this.composer.addPass(this.bloom);

        this.conjTimer = 0;
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Balance control: mouse x controls orbit speed, y controls orbit radius
        const balanceX = this.mouseSmooth.x;
        const orbitR = 3 + this.mouseSmooth.y * 1.5;
        const speed = 0.3 + balanceX * 0.2;

        // Orbit anima/animus around each other
        this.anima.position.set(Math.cos(t * speed) * orbitR, Math.sin(t * speed * 0.7) * 0.8, Math.sin(t * speed) * orbitR);
        this.animus.position.set(-Math.cos(t * speed) * orbitR, -Math.sin(t * speed * 0.7) * 0.8, -Math.sin(t * speed) * orbitR);
        this.anima.rotation.y = t * 0.3;
        this.animus.rotation.y = -t * 0.3;
        this.goldenLight.position.copy(this.animus.position);

        // Magnetic field lines (curved between the two poles)
        for (const fl of this.fieldLines) {
            const pts = fl.geo.attributes.position.array;
            const a = this.anima.position, b = this.animus.position;
            for (let j = 0; j <= 40; j++) {
                const frac = j / 40;
                const mid = new THREE.Vector3().lerpVectors(a, b, frac);
                const off = Math.sin(frac * Math.PI) * 2;
                mid.x += Math.cos(fl.offset + t * 0.2) * off;
                mid.y += Math.sin(fl.offset * 2 + t * 0.15) * off * 0.5;
                mid.z += Math.sin(fl.offset + t * 0.2) * off;
                pts[j * 3] = mid.x; pts[j * 3 + 1] = mid.y; pts[j * 3 + 2] = mid.z;
            }
            fl.geo.attributes.position.needsUpdate = true;
            fl.line.material.opacity = 0.06 + Math.sin(t + fl.offset) * 0.04;
        }

        // Conjunction burst — when they get close
        const dist = this.anima.position.distanceTo(this.animus.position);
        if (dist < 2 && this.conjTimer <= 0) {
            this.conjTimer = 3; // 3 second burst
            const cp = this.conjPts.geometry.attributes.position.array;
            for (let i = 0; i < this.conjData.length; i++) {
                this.conjData[i].life = 0;
                this.conjData[i].vel.set((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1);
                const mid = new THREE.Vector3().lerpVectors(this.anima.position, this.animus.position, 0.5);
                cp[i * 3] = mid.x; cp[i * 3 + 1] = mid.y; cp[i * 3 + 2] = mid.z;
            }
            this.conjPts.geometry.attributes.position.needsUpdate = true;
        }

        if (this.conjTimer > 0) {
            this.conjTimer -= dt;
            this.conjPts.material.opacity = Math.max(0, this.conjTimer / 3) * 0.8;
            const cp = this.conjPts.geometry.attributes.position.array;
            for (let i = 0; i < this.conjData.length; i++) {
                const d = this.conjData[i];
                d.life += dt;
                cp[i * 3] += d.vel.x; cp[i * 3 + 1] += d.vel.y; cp[i * 3 + 2] += d.vel.z;
                d.vel.multiplyScalar(0.99);
            }
            this.conjPts.geometry.attributes.position.needsUpdate = true;
        }

        const ca = t * 0.02;
        this.camera.position.x = Math.sin(ca) * 14 + this.mouseSmooth.x * 2;
        this.camera.position.y = 3 + this.mouseSmooth.y * 2;
        this.camera.position.z = Math.cos(ca) * 14;
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
