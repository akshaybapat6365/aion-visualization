/**
 * ThreeHistoricalViz.js — Chapter 8: "The Historical Significance of the Fish"
 * Four-stage alchemical progression (nigredo→rubedo), Mercurius shape-shifting,
 * Philosopher's Stone radiant sphere.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const STAGES = [
    { name: 'Nigredo', color: new THREE.Color('#1a1a2e'), accent: new THREE.Color('#333333') },
    { name: 'Albedo', color: new THREE.Color('#e0e0e8'), accent: new THREE.Color('#c0c0d0') },
    { name: 'Citrinitas', color: new THREE.Color('#ffd700'), accent: new THREE.Color('#ffaa00') },
    { name: 'Rubedo', color: new THREE.Color('#8b0000'), accent: new THREE.Color('#ff2222') },
];

export default class ThreeHistoricalViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x050505);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050505, 0.012);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 2, 14);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        // Central Mercurius sphere (shape-shifting)
        this.mercurius = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 4), new THREE.MeshStandardMaterial({
            color: 0x333333, emissive: 0x111111, emissiveIntensity: 0.2, roughness: 0.6, metalness: 0.8, wireframe: false,
        }));
        this.scene.add(this.mercurius);

        // Inner glow
        this.mercGlow = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), new THREE.MeshBasicMaterial({
            color: 0x333333, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.mercGlow);

        // Four stage markers arranged linearly
        this.stageMarkers = [];
        for (let i = 0; i < 4; i++) {
            const x = -6 + i * 4;
            const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 1), new THREE.MeshBasicMaterial({
                color: STAGES[i].accent, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending,
            }));
            m.position.set(x, -3, 0);
            this.scene.add(m);

            // Connection line to center
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([m.position, new THREE.Vector3(0, 0, 0)]),
                new THREE.LineBasicMaterial({ color: STAGES[i].accent, transparent: true, opacity: 0.05 }));
            this.scene.add(line);

            this.stageMarkers.push({ mesh: m, stage: STAGES[i], line });
        }

        // Transformation particles
        const tN = 400;
        const tPos = new Float32Array(tN * 3);
        const tColors = new Float32Array(tN * 3);
        for (let i = 0; i < tN; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 1.5 + Math.random() * 5;
            tPos[i * 3] = Math.cos(a) * r;
            tPos[i * 3 + 1] = Math.sin(a) * r;
            tPos[i * 3 + 2] = (Math.random() - 0.5) * 3;
            tColors[i * 3] = tColors[i * 3 + 1] = tColors[i * 3 + 2] = 0.2;
        }
        const tGeo = new THREE.BufferGeometry();
        tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
        tGeo.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
        this.transPts = new THREE.Points(tGeo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.05, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.transPts);
        this.transColors = tColors;

        this.scene.add(new THREE.AmbientLight(0x111115, 0.3));
        this.keyLight = new THREE.PointLight(0x333333, 0.5, 15);
        this.keyLight.position.set(3, 3, 5);
        this.scene.add(this.keyLight);

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.0, 0.6, 0.4);
        this.composer.addPass(this.bloom);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Cycle through stages over 20s
        const cycle = (t * 0.05) % 1;
        const stageIdx = Math.floor(cycle * 4);
        const stageFrac = (cycle * 4) % 1;
        const cur = STAGES[stageIdx];
        const next = STAGES[(stageIdx + 1) % 4];

        // Mercurius color morph
        const morphClr = cur.color.clone().lerp(next.color, stageFrac);
        this.mercurius.material.color.copy(morphClr);
        this.mercurius.material.emissive.copy(cur.accent.clone().lerp(next.accent, stageFrac));
        this.mercGlow.material.color.copy(morphClr);

        // Mercurius shape-shift (vertex displacement)
        this.mercurius.rotation.y = t * 0.1;
        this.mercurius.rotation.x = Math.sin(t * 0.15) * 0.3;
        const scale = 1 + Math.sin(t * 0.5) * 0.1;
        this.mercurius.scale.set(scale, 1 / scale * 1.1, scale);

        // Stage markers glow when active
        for (let i = 0; i < 4; i++) {
            const active = i === stageIdx;
            this.stageMarkers[i].mesh.material.opacity = active ? 0.8 : 0.2;
            this.stageMarkers[i].mesh.scale.setScalar(active ? 1.3 : 1);
            this.stageMarkers[i].line.material.opacity = active ? 0.15 : 0.03;
            this.stageMarkers[i].mesh.rotation.y += active ? 0.02 : 0.005;
        }

        // Particle colors morph with stage
        for (let i = 0; i < this.transColors.length; i += 3) {
            this.transColors[i] = morphClr.r;
            this.transColors[i + 1] = morphClr.g;
            this.transColors[i + 2] = morphClr.b;
        }
        this.transPts.geometry.attributes.color.needsUpdate = true;
        this.transPts.rotation.z += 0.001;

        // Key light color
        this.keyLight.color.copy(cur.accent.clone().lerp(next.accent, stageFrac));

        // Camera
        const ca = t * 0.02 + this.mouseSmooth.x * 0.15;
        this.camera.position.x = Math.sin(ca) * 14;
        this.camera.position.y = 2 + this.mouseSmooth.y * 2;
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
