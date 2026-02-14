/**
 * ThreeSacredMarriageViz.js — Chapter 12: "Background to the Psychology of Christian Alchemical Symbolism"
 * Sol and Luna / Rex and Regina geometric forms, marriage merging sequence, divine child emergence.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const SOL = new THREE.Color('#ffd700');
const LUNA = new THREE.Color('#c0c0e0');
const CHILD = new THREE.Color('#e91e63');
const ROSE = new THREE.Color('#ff4081');

export default class ThreeSacredMarriageViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x050508);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050508, 0.01);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 2, 16);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        // Sol (King / Rex) — golden octahedron
        this.sol = new THREE.Mesh(new THREE.OctahedronGeometry(1, 2), new THREE.MeshStandardMaterial({
            color: SOL, emissive: SOL, emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.5,
        }));
        this.sol.position.set(-4, 0, 0);
        this.scene.add(this.sol);

        // Luna (Queen / Regina) — silver icosahedron
        this.luna = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshStandardMaterial({
            color: LUNA, emissive: LUNA, emissiveIntensity: 0.2, roughness: 0.3, metalness: 0.5,
        }));
        this.luna.position.set(4, 0, 0);
        this.scene.add(this.luna);

        // Connection line (attraction)
        this.bond = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4, 0, 0), new THREE.Vector3(4, 0, 0)]),
            new THREE.LineBasicMaterial({ color: ROSE, transparent: true, opacity: 0.1 })
        );
        this.scene.add(this.bond);

        // Divine child (emerges at conjunction center)
        this.child = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 20), new THREE.MeshBasicMaterial({
            color: CHILD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.child);
        this.childGlow = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 12), new THREE.MeshBasicMaterial({
            color: ROSE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.childGlow);

        // Rose particles
        const roseN = 300;
        const rosePos = new Float32Array(roseN * 3);
        for (let i = 0; i < roseN; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 1 + Math.random() * 8;
            rosePos[i * 3] = Math.cos(a) * r;
            rosePos[i * 3 + 1] = (Math.random() - 0.5) * 6;
            rosePos[i * 3 + 2] = Math.sin(a) * r;
        }
        const roseGeo = new THREE.BufferGeometry();
        roseGeo.setAttribute('position', new THREE.BufferAttribute(rosePos, 3));
        this.rosePts = new THREE.Points(roseGeo, new THREE.PointsMaterial({
            color: ROSE, size: 0.04, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.rosePts);

        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));
        this.scene.add(new THREE.PointLight(0xffd700, 0.3, 10));
        this.scene.add(new THREE.PointLight(0xc0c0e0, 0.3, 10));

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.3, 0.5, 0.3);
        this.composer.addPass(this.bloom);

        this.mergePhase = 0; // 0=apart, 1=approaching, 2=merged
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Marriage cycle: approach, merge, separate (30s cycle)
        const cycle = (t * 0.05) % 1;
        let separation;
        if (cycle < 0.4) { separation = 4; this.mergePhase = 0; }
        else if (cycle < 0.6) { separation = 4 * (1 - (cycle - 0.4) / 0.2); this.mergePhase = 1; }
        else if (cycle < 0.8) { separation = 0; this.mergePhase = 2; }
        else { separation = 4 * ((cycle - 0.8) / 0.2); this.mergePhase = 0; }

        this.sol.position.x = -separation;
        this.luna.position.x = separation;
        this.sol.rotation.y = t * 0.2;
        this.luna.rotation.y = -t * 0.2;

        // Bond opacity increases as they approach
        this.bond.material.opacity = 0.05 + (1 - separation / 4) * 0.3;
        const bp = this.bond.geometry.attributes.position.array;
        bp[0] = -separation; bp[3] = separation;
        this.bond.geometry.attributes.position.needsUpdate = true;

        // Divine child appears during merge
        const childOp = this.mergePhase === 2 ? 0.8 : 0;
        this.child.material.opacity += (childOp - this.child.material.opacity) * 0.05;
        this.childGlow.material.opacity = this.child.material.opacity * 0.3;
        this.child.scale.setScalar(this.mergePhase === 2 ? 1 + Math.sin(t * 2) * 0.2 : 0.1);

        // Rose particles drift
        this.rosePts.rotation.y += 0.001;
        this.rosePts.material.opacity = 0.2 + (this.mergePhase === 2 ? 0.3 : 0);

        // Camera
        const ca = t * 0.015 + this.mouseSmooth.x * 0.15;
        this.camera.position.x = Math.sin(ca) * 16;
        this.camera.position.y = 2 + this.mouseSmooth.y * 3;
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
