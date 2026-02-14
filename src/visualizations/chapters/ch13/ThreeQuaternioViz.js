/**
 * ThreeQuaternioViz.js — Chapter 13: "Gnostic Symbols of the Self"
 * Four function axes, three nested rotating quaternary layers,
 * mouse-activated quadrant dominance, integration mandala state.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const QUAD_COLORS = [new THREE.Color('#e63946'), new THREE.Color('#457b9d'), new THREE.Color('#2a9d8f'), new THREE.Color('#ff9800')];
const AXIS_CLR = new THREE.Color('#ff9800');
const CENTER = new THREE.Color('#ffd700');

export default class ThreeQuaternioViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x050505);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 0, 18);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        // Three nested quaternary layers
        this.layers = [];
        for (let layer = 0; layer < 3; layer++) {
            const r = 3 + layer * 2.5;
            const nodes = [];
            for (let q = 0; q < 4; q++) {
                const a = (q / 4) * Math.PI * 2 + (layer * Math.PI / 12);
                const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.4 - layer * 0.08, 1), new THREE.MeshBasicMaterial({
                    color: QUAD_COLORS[q], transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending,
                }));
                m.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
                this.scene.add(m);
                nodes.push({ mesh: m, baseAngle: a, q });
            }

            // Connection ring
            const ringPts = [];
            for (let i = 0; i <= 80; i++) {
                const a = (i / 80) * Math.PI * 2;
                ringPts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
            }
            const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts),
                new THREE.LineBasicMaterial({ color: AXIS_CLR, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending }));
            this.scene.add(ring);

            this.layers.push({ nodes, ring, r, speed: 0.01 * (layer % 2 === 0 ? 1 : -1) * (1 + layer * 0.3) });
        }

        // Four function axes (cross through center)
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(Math.cos(a) * 12, Math.sin(a) * 12, 0)
            ]), new THREE.LineBasicMaterial({ color: QUAD_COLORS[i], transparent: true, opacity: 0.06 }));
            this.scene.add(line);
        }

        // Center integration point
        this.center = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 20), new THREE.MeshBasicMaterial({
            color: CENTER, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.center);
        this.centerGlow = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), new THREE.MeshBasicMaterial({
            color: CENTER, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.centerGlow);

        this.scene.add(new THREE.AmbientLight(0x0a0a10, 0.2));

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.3, 0.5, 0.3);
        this.composer.addPass(this.bloom);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Mouse quadrant dominance
        const mouseAngle = Math.atan2(this.mouseSmooth.y, this.mouseSmooth.x);
        const dominantQ = ((Math.round(mouseAngle / (Math.PI / 2)) + 4) % 4);

        // Rotate layers
        for (const layer of this.layers) {
            for (const node of layer.nodes) {
                const newAngle = node.baseAngle + t * layer.speed;
                node.mesh.position.x = Math.cos(newAngle) * layer.r;
                node.mesh.position.y = Math.sin(newAngle) * layer.r;
                node.mesh.rotation.y = t * 0.3;

                // Quadrant dominance: mouse activates matching quadrant
                const active = node.q === dominantQ;
                node.mesh.material.opacity = active ? 0.9 : 0.3;
                node.mesh.scale.setScalar(active ? 1.4 : 1);
            }
            layer.ring.rotation.z = t * layer.speed;
        }

        // Center pulse — stronger when all quadrants balanced (mouse near center)
        const centerDist = Math.sqrt(this.mouseSmooth.x ** 2 + this.mouseSmooth.y ** 2);
        const balance = Math.max(0, 1 - centerDist);
        this.center.material.opacity = 0.5 + balance * 0.5;
        this.center.scale.setScalar(1 + balance * 0.5);
        this.centerGlow.material.opacity = 0.03 + balance * 0.1;

        // Camera
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
        this.renderer?.dispose(); this.renderer?.forceContextLoss();
        this.scene?.traverse(o => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
        this.composer = null; this.scene = null; this.renderer = null; super.dispose();
    }
}
