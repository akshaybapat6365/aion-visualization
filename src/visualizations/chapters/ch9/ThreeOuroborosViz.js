/**
 * ThreeOuroborosViz.js — Chapter 9: "The Ambivalence of the Fish Symbol / Ouroboros"
 * 3D self-devouring serpent ring, cyclic particle flow, death-rebirth dissolution,
 * fractal recursion hint.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const SERPENT_CLR = new THREE.Color('#2e7d32');
const SERPENT_DARK = new THREE.Color('#0a2a0a');
const GOLD = new THREE.Color('#ffd700');

export default class ThreeOuroborosViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x030308);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x030308, 0.01);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 5, 16);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        // Serpent body: torus geometry (the ouroboros ring)
        this.serpentBody = new THREE.Mesh(new THREE.TorusGeometry(4, 0.35, 16, 100), new THREE.MeshStandardMaterial({
            color: SERPENT_CLR, emissive: SERPENT_DARK, emissiveIntensity: 0.3, roughness: 0.5, metalness: 0.3,
        }));
        this.scene.add(this.serpentBody);

        // Serpent scale pattern (wireframe overlay)
        this.serpentWire = new THREE.Mesh(new THREE.TorusGeometry(4, 0.37, 16, 100), new THREE.MeshBasicMaterial({
            color: SERPENT_CLR, wireframe: true, transparent: true, opacity: 0.1,
        }));
        this.scene.add(this.serpentWire);

        // Head/tail junction — glowing point where it devours itself
        this.junction = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshBasicMaterial({
            color: GOLD, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending,
        }));
        this.junction.position.set(4, 0, 0);
        this.scene.add(this.junction);

        // Cyclic particle flow along the serpent body
        const flowN = 300;
        const flowPos = new Float32Array(flowN * 3);
        this.flowPhases = new Float32Array(flowN);
        for (let i = 0; i < flowN; i++) {
            this.flowPhases[i] = Math.random();
            const a = this.flowPhases[i] * Math.PI * 2;
            flowPos[i * 3] = Math.cos(a) * 4;
            flowPos[i * 3 + 1] = 0;
            flowPos[i * 3 + 2] = Math.sin(a) * 4;
        }
        const flowGeo = new THREE.BufferGeometry();
        flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
        this.flowPts = new THREE.Points(flowGeo, new THREE.PointsMaterial({
            color: SERPENT_CLR, size: 0.06, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.flowPts);

        // Inner recursion — smaller ouroboros inside
        this.innerSerpent = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.12, 10, 60), new THREE.MeshBasicMaterial({
            color: SERPENT_CLR, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.innerSerpent);

        // Even smaller inner recursion
        this.innerSerpent2 = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 40), new THREE.MeshBasicMaterial({
            color: SERPENT_CLR, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.innerSerpent2);

        this.scene.add(new THREE.AmbientLight(0x0a150a, 0.3));
        this.scene.add(new THREE.PointLight(0x2e7d32, 0.4, 15));
        this.scene.add(new THREE.PointLight(0xffd700, 0.2, 8));

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.2, 0.5, 0.35);
        this.composer.addPass(this.bloom);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Serpent slow rotation (eating its tail)
        this.serpentBody.rotation.z += 0.003;
        this.serpentBody.rotation.x = Math.sin(t * 0.1) * 0.15;
        this.serpentWire.rotation.z = this.serpentBody.rotation.z;
        this.serpentWire.rotation.x = this.serpentBody.rotation.x;

        // Junction follows rotation
        const jA = this.serpentBody.rotation.z;
        this.junction.position.set(Math.cos(jA) * 4, Math.sin(jA) * 4 * Math.cos(this.serpentBody.rotation.x), 0);
        this.junction.material.opacity = 0.4 + Math.sin(t * 2) * 0.3;

        // Cyclic flow along body
        const fp = this.flowPts.geometry.attributes.position.array;
        for (let i = 0; i < this.flowPhases.length; i++) {
            this.flowPhases[i] = (this.flowPhases[i] + dt * 0.1) % 1;
            const a = this.flowPhases[i] * Math.PI * 2 + this.serpentBody.rotation.z;
            fp[i * 3] = Math.cos(a) * 4;
            fp[i * 3 + 1] = Math.sin(a) * 4 * Math.cos(this.serpentBody.rotation.x);
            fp[i * 3 + 2] = Math.sin(a) * 4 * Math.sin(this.serpentBody.rotation.x);
        }
        this.flowPts.geometry.attributes.position.needsUpdate = true;

        // Inner recursion rotation (opposite direction)
        this.innerSerpent.rotation.z -= 0.005;
        this.innerSerpent.rotation.y = t * 0.05;
        this.innerSerpent2.rotation.z += 0.008;
        this.innerSerpent2.rotation.x = t * 0.08;

        // Death-rebirth dissolution: periodic opacity pulse
        const drCycle = Math.sin(t * 0.15);
        this.serpentBody.material.opacity = 0.7 + drCycle * 0.3;
        this.serpentBody.material.transparent = true;

        // Camera
        const ca = t * 0.02 + this.mouseSmooth.x * 0.2;
        this.camera.position.x = Math.sin(ca) * 16;
        this.camera.position.y = 5 + this.mouseSmooth.y * 3;
        this.camera.position.z = Math.cos(ca) * 16;
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
