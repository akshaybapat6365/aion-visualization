/**
 * ThreeUnusMundusViz.js — Chapter 11: "The Alchemical Interpretation / Unus Mundus"
 * Fractal world tree, root/crown mirror symmetry, unifying particle flows,
 * scroll zoom exploration.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const CROWN = new THREE.Color('#4caf50');
const ROOT = new THREE.Color('#2e7d32');
const TRUNK = new THREE.Color('#5d4037');
const UNITY = new THREE.Color('#a5d6a7');

export default class ThreeUnusMundusViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x030308);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x030308, 0.008);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 0, 22);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);
        this.zoomTarget = 22;
        this._onWheel = e => { this.zoomTarget = Math.max(8, Math.min(35, this.zoomTarget + e.deltaY * 0.01)); };
        addEventListener('wheel', this._onWheel, { passive: true });

        // Tree trunk (central axis)
        this.trunk = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -10, 0), new THREE.Vector3(0, 10, 0)]),
            new THREE.LineBasicMaterial({ color: TRUNK, transparent: true, opacity: 0.3 })
        );
        this.scene.add(this.trunk);

        // Branches (crown and roots mirrored)
        this.branches = [];
        const makeBranches = (dir, depth, x, y, angle, length) => {
            if (depth <= 0 || length < 0.3) return;
            const ex = x + Math.cos(angle) * length;
            const ey = y + dir * Math.sin(Math.abs(angle)) * length;
            const pts = [new THREE.Vector3(x, y, 0), new THREE.Vector3(ex, ey, 0)];
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({ color: dir > 0 ? CROWN : ROOT, transparent: true, opacity: 0.15 / depth, blending: THREE.AdditiveBlending }));
            this.scene.add(line);
            this.branches.push(line);
            makeBranches(dir, depth - 1, ex, ey, angle + 0.5, length * 0.7);
            makeBranches(dir, depth - 1, ex, ey, angle - 0.5, length * 0.7);
        };

        // Crown branches (upward)
        makeBranches(1, 5, 0, 3, Math.PI / 4, 3);
        makeBranches(1, 5, 0, 3, Math.PI * 3 / 4, 3);
        // Root branches (downward, mirrored)
        makeBranches(-1, 5, 0, -3, Math.PI / 4, 3);
        makeBranches(-1, 5, 0, -3, Math.PI * 3 / 4, 3);

        // Unifying particles flowing along the tree
        const flowN = 300;
        const flowPos = new Float32Array(flowN * 3);
        this.flowPh = new Float32Array(flowN);
        this.flowDir = new Float32Array(flowN);
        for (let i = 0; i < flowN; i++) {
            this.flowPh[i] = Math.random();
            this.flowDir[i] = Math.random() > 0.5 ? 1 : -1;
            flowPos[i * 3] = (Math.random() - 0.5) * 2;
            flowPos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            flowPos[i * 3 + 2] = (Math.random() - 0.5) * 2;
        }
        const flowGeo = new THREE.BufferGeometry();
        flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
        this.flowPts = new THREE.Points(flowGeo, new THREE.PointsMaterial({
            color: UNITY, size: 0.05, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.flowPts);

        // Mirror plane at center
        this.mirrorRing = new THREE.Mesh(new THREE.TorusGeometry(5, 0.02, 4, 80), new THREE.MeshBasicMaterial({
            color: UNITY, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending,
        }));
        this.mirrorRing.rotation.x = Math.PI / 2;
        this.scene.add(this.mirrorRing);

        this.scene.add(new THREE.AmbientLight(0x0a150a, 0.3));
        this.scene.add(new THREE.PointLight(0x4caf50, 0.3, 20));

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.3, 0.5, 0.3);
        this.composer.addPass(this.bloom);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Flow particles along trunk
        const fp = this.flowPts.geometry.attributes.position.array;
        for (let i = 0; i < this.flowPh.length; i++) {
            fp[i * 3 + 1] += this.flowDir[i] * dt * 1.5;
            fp[i * 3] += Math.sin(t * 0.2 + i) * 0.005;
            if (fp[i * 3 + 1] > 12) { fp[i * 3 + 1] = -12; fp[i * 3] = (Math.random() - 0.5) * 2; }
            if (fp[i * 3 + 1] < -12) { fp[i * 3 + 1] = 12; fp[i * 3] = (Math.random() - 0.5) * 2; }
        }
        this.flowPts.geometry.attributes.position.needsUpdate = true;

        // Tree gently sways
        for (const b of this.branches) {
            b.rotation.z = Math.sin(t * 0.1) * 0.02;
        }

        // Mirror ring pulse
        this.mirrorRing.material.opacity = 0.05 + Math.sin(t * 0.3) * 0.03;
        this.mirrorRing.rotation.z = t * 0.01;

        // Camera zoom
        this.camera.position.z += (this.zoomTarget - this.camera.position.z) * 0.05;
        this.camera.position.x = this.mouseSmooth.x * 5;
        this.camera.position.y = this.mouseSmooth.y * 5;
        this.camera.lookAt(0, 0, 0);
    }

    render() { this.composer?.render(); }
    onResize(w, h) {
        if (!this.renderer) return;
        this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h); this.composer?.setSize(w, h); this.bloom?.setSize(w, h);
    }
    dispose() {
        removeEventListener('mousemove', this._onMM); removeEventListener('wheel', this._onWheel);
        this.renderer?.dispose(); this.renderer?.forceContextLoss();
        this.scene?.traverse(o => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
        this.composer = null; this.scene = null; this.renderer = null; super.dispose();
    }
}
