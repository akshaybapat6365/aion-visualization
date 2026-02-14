/**
 * ThreeFishViz.js — Chapter 6: "The Sign of the Fishes"
 * Dual opposing fish forms, Pisces→Aquarius aeon shift, cosmic water particles.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const FISH_LIGHT = new THREE.Color('#22d3ee');
const FISH_DARK = new THREE.Color('#0a3a4a');
const WATER_CLR = new THREE.Color('#0a2a3a');

export default class ThreeFishViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x020210);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x020210, 0.012);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 2, 16);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        // Build two fish forms from particle arcs
        this.fish = [];
        for (let f = 0; f < 2; f++) {
            const n = 150;
            const pos = new Float32Array(n * 3);
            for (let i = 0; i < n; i++) {
                const frac = i / n;
                const a = frac * Math.PI * 1.5;
                const r = 2 + Math.sin(frac * Math.PI) * 1.5;
                const dir = f === 0 ? 1 : -1;
                pos[i * 3] = Math.cos(a) * r * dir;
                pos[i * 3 + 1] = Math.sin(a) * r;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const pts = new THREE.Points(geo, new THREE.PointsMaterial({
                color: f === 0 ? FISH_LIGHT : FISH_DARK, size: 0.08,
                transparent: true, opacity: f === 0 ? 0.8 : 0.4,
                blending: THREE.AdditiveBlending, depthWrite: false,
            }));
            this.scene.add(pts);
            this.fish.push(pts);
        }

        // Vesica Piscis intersection ring
        const vesicaPts = [];
        for (let i = 0; i <= 60; i++) {
            const a = (i / 60) * Math.PI * 2;
            vesicaPts.push(new THREE.Vector3(Math.cos(a) * 1.5, Math.sin(a) * 2.5, 0));
        }
        this.vesica = new THREE.Line(new THREE.BufferGeometry().setFromPoints(vesicaPts), new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending }));
        this.scene.add(this.vesica);

        // Cosmic water particles
        const waterN = 600;
        const waterPos = new Float32Array(waterN * 3);
        this.waterPh = new Float32Array(waterN);
        for (let i = 0; i < waterN; i++) {
            waterPos[i * 3] = (Math.random() - 0.5) * 30;
            waterPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            waterPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
            this.waterPh[i] = Math.random() * Math.PI * 2;
        }
        const waterGeo = new THREE.BufferGeometry();
        waterGeo.setAttribute('position', new THREE.BufferAttribute(waterPos, 3));
        this.waterPts = new THREE.Points(waterGeo, new THREE.PointsMaterial({ color: WATER_CLR, size: 0.04, transparent: true, opacity: 0.25, depthWrite: false }));
        this.scene.add(this.waterPts);

        // Aeon dividing line
        this.aeonLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-15, 0, 0), new THREE.Vector3(15, 0, 0)]),
            new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.05 }));
        this.scene.add(this.aeonLine);

        this.scene.add(new THREE.AmbientLight(0x050515, 0.3));
        this.scene.add(new THREE.PointLight(0x22d3ee, 0.3, 15));

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.3, 0.5, 0.35);
        this.composer.addPass(this.bloom);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Fish swim in opposing arcs
        this.fish[0].rotation.z = Math.sin(t * 0.15) * 0.3;
        this.fish[0].rotation.y = t * 0.02;
        this.fish[1].rotation.z = -Math.sin(t * 0.15) * 0.3;
        this.fish[1].rotation.y = -t * 0.02;

        // Aeon shift: slowly tilt the whole scene to represent transition
        const aeonShift = t * 0.002;
        this.scene.rotation.z = Math.sin(aeonShift) * 0.1;

        // Vesica pulse
        this.vesica.material.opacity = 0.06 + Math.sin(t * 0.5) * 0.04;
        this.vesica.rotation.z = t * 0.01;

        // Water particle drift
        const wp = this.waterPts.geometry.attributes.position.array;
        for (let i = 0; i < this.waterPh.length; i++) {
            wp[i * 3 + 1] += Math.sin(t * 0.1 + this.waterPh[i]) * 0.003;
        }
        this.waterPts.geometry.attributes.position.needsUpdate = true;

        // Camera orbit
        const ca = t * 0.015 + this.mouseSmooth.x * 0.2;
        this.camera.position.x = Math.sin(ca) * 16;
        this.camera.position.y = 2 + this.mouseSmooth.y * 2;
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
