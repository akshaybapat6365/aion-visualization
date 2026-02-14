/**
 * ThreeGnosticViz.js — Chapter 10: "The Fish in Alchemy / Gnostic Symbols"
 * Pleroma light field, consciousness sparks ascending/descending,
 * archon gate barriers.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const PLEROMA = new THREE.Color('#e0d0ff');
const SPARK_CLR = new THREE.Color('#7c4dff');
const GATE_CLR = new THREE.Color('#330066');
const VOID_CLR = 0x050510;

export default class ThreeGnosticViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(VOID_CLR);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(VOID_CLR, 0.008);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 0, 18);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        // Pleroma — radiant light field above
        this.pleroma = new THREE.Mesh(new THREE.SphereGeometry(3, 24, 24), new THREE.MeshBasicMaterial({
            color: PLEROMA, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending,
        }));
        this.pleroma.position.y = 12;
        this.scene.add(this.pleroma);
        this.pleromaGlow = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 16), new THREE.MeshBasicMaterial({
            color: PLEROMA, transparent: true, opacity: 0.02, blending: THREE.AdditiveBlending,
        }));
        this.pleromaGlow.position.y = 12;
        this.scene.add(this.pleromaGlow);

        // Archon gate barriers — horizontal rings at different levels
        this.gates = [];
        for (let i = 0; i < 5; i++) {
            const y = 2 + i * 2;
            const r = 6 - i * 0.5;
            const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 8, 80), new THREE.MeshBasicMaterial({
                color: GATE_CLR, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending,
            }));
            ring.rotation.x = Math.PI / 2;
            ring.position.y = y;
            this.scene.add(ring);
            this.gates.push(ring);
        }

        // Consciousness sparks (ascending and descending)
        const sparkN = 250;
        const sparkPos = new Float32Array(sparkN * 3);
        this.sparkVel = new Float32Array(sparkN);
        for (let i = 0; i < sparkN; i++) {
            sparkPos[i * 3] = (Math.random() - 0.5) * 12;
            sparkPos[i * 3 + 1] = Math.random() * 15 - 3;
            sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
            this.sparkVel[i] = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 1.5); // up or down
        }
        const sparkGeo = new THREE.BufferGeometry();
        sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
        this.sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
            color: SPARK_CLR, size: 0.07, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.sparks);

        // Darkness below
        this.darkness = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({
            color: 0x050510, transparent: true, opacity: 0.5,
        }));
        this.darkness.rotation.x = -Math.PI / 2;
        this.darkness.position.y = -3;
        this.scene.add(this.darkness);

        this.scene.add(new THREE.AmbientLight(0x0a0a20, 0.2));
        const pLight = new THREE.PointLight(0xe0d0ff, 0.5, 30);
        pLight.position.set(0, 15, 0);
        this.scene.add(pLight);

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.4, 0.5, 0.3);
        this.composer.addPass(this.bloom);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Pleroma breathe
        this.pleroma.material.opacity = 0.04 + Math.sin(t * 0.3) * 0.03;
        this.pleromaGlow.material.opacity = 0.015 + Math.sin(t * 0.2) * 0.01;

        // Gates rotate + pulse
        for (let i = 0; i < this.gates.length; i++) {
            this.gates[i].rotation.z = t * (0.02 + i * 0.005) * (i % 2 === 0 ? 1 : -1);
            this.gates[i].material.opacity = 0.1 + Math.sin(t * 0.5 + i) * 0.05;
        }

        // Sparks ascend/descend
        const sp = this.sparks.geometry.attributes.position.array;
        for (let i = 0; i < this.sparkVel.length; i++) {
            sp[i * 3 + 1] += this.sparkVel[i] * dt * 0.3;
            // Wrap
            if (sp[i * 3 + 1] > 15) { sp[i * 3 + 1] = -3; sp[i * 3] = (Math.random() - 0.5) * 12; }
            if (sp[i * 3 + 1] < -3) { sp[i * 3 + 1] = 15; sp[i * 3] = (Math.random() - 0.5) * 12; }
            // Lateral drift
            sp[i * 3] += Math.sin(t * 0.1 + i) * 0.002;
        }
        this.sparks.geometry.attributes.position.needsUpdate = true;

        // Camera
        const ca = t * 0.01 + this.mouseSmooth.x * 0.15;
        this.camera.position.x = Math.sin(ca) * 18;
        this.camera.position.y = 5 + this.mouseSmooth.y * 5;
        this.camera.position.z = Math.cos(ca) * 18;
        this.camera.lookAt(0, 5, 0);
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
