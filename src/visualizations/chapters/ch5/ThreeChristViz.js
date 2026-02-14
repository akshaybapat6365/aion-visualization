/**
 * ThreeChristViz.js — Chapter 5: "Christ, a Symbol of the Self"
 * Luminous cross at spirit/matter intersection, missing fourth shadow element,
 * crystalline refraction, hover-reveal quadrant associations.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const LIGHT_CLR = new THREE.Color('#f0f0ff');
const GOLD = new THREE.Color('#ffd700');
const SHADOW_CLR = new THREE.Color('#1a0a0a');
const SPECTRUM = [new THREE.Color('#ff4444'), new THREE.Color('#44ff44'), new THREE.Color('#4444ff'), new THREE.Color('#ffff44')];

export default class ThreeChristViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x020208);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x020208, 0.01);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 2, 14);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        // Luminous cross
        const armV = new THREE.Mesh(new THREE.BoxGeometry(0.15, 8, 0.15), new THREE.MeshBasicMaterial({ color: LIGHT_CLR, transparent: true, opacity: 0.8 }));
        const armH = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 0.15), new THREE.MeshBasicMaterial({ color: LIGHT_CLR, transparent: true, opacity: 0.8 }));
        armH.position.y = 1.5;
        this.cross = new THREE.Group();
        this.cross.add(armV, armH);
        this.scene.add(this.cross);

        // Cross glow
        this.crossGlow = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), new THREE.MeshBasicMaterial({ color: LIGHT_CLR, transparent: true, opacity: 0.03, blending: THREE.AdditiveBlending }));
        this.crossGlow.position.y = 1.5;
        this.scene.add(this.crossGlow);

        // Four quadrant elements (3 luminous, 1 shadow — the missing fourth)
        this.quadrants = [];
        const offsets = [[-3, 3, 0], [3, 3, 0], [3, -2, 0], [-3, -2, 0]];
        for (let i = 0; i < 4; i++) {
            const isShadow = i === 3;
            const geo = isShadow ? new THREE.TetrahedronGeometry(0.4) : new THREE.OctahedronGeometry(0.4);
            const mat = new THREE.MeshBasicMaterial({
                color: isShadow ? SHADOW_CLR : SPECTRUM[i],
                transparent: true, opacity: isShadow ? 0.15 : 0.5,
                blending: THREE.AdditiveBlending,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(...offsets[i]);
            this.scene.add(mesh);
            this.quadrants.push({ mesh, isShadow, targetOp: isShadow ? 0.15 : 0.5 });
        }

        // Refraction spectrum particles
        const specN = 300;
        const specPos = new Float32Array(specN * 3);
        const specColors = new Float32Array(specN * 3);
        for (let i = 0; i < specN; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 0.5 + Math.random() * 5;
            specPos[i * 3] = Math.cos(a) * r;
            specPos[i * 3 + 1] = Math.sin(a) * r + 1;
            specPos[i * 3 + 2] = (Math.random() - 0.5) * 3;
            const c = SPECTRUM[i % 4];
            specColors[i * 3] = c.r; specColors[i * 3 + 1] = c.g; specColors[i * 3 + 2] = c.b;
        }
        const specGeo = new THREE.BufferGeometry();
        specGeo.setAttribute('position', new THREE.BufferAttribute(specPos, 3));
        specGeo.setAttribute('color', new THREE.BufferAttribute(specColors, 3));
        this.specPts = new THREE.Points(specGeo, new THREE.PointsMaterial({ vertexColors: true, size: 0.04, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
        this.scene.add(this.specPts);

        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.2));
        this.scene.add(new THREE.PointLight(0xf0f0ff, 0.5, 20));

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.6, 0.4, 0.3);
        this.composer.addPass(this.bloom);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Cross glow pulse
        this.crossGlow.material.opacity = 0.02 + Math.sin(t * 0.5) * 0.02;
        this.cross.rotation.z = Math.sin(t * 0.05) * 0.02;

        // Quadrant hover-reveal: brighten the quadrant closest to mouse
        for (const q of this.quadrants) {
            const dx = q.mesh.position.x - this.mouseSmooth.x * 5;
            const dy = q.mesh.position.y - this.mouseSmooth.y * 5;
            const d = Math.sqrt(dx * dx + dy * dy);
            const boost = Math.max(0, 1 - d / 4);
            q.mesh.material.opacity = q.targetOp + boost * 0.4;
            q.mesh.rotation.y += (q.isShadow ? -0.01 : 0.008);
            q.mesh.rotation.x = Math.sin(t * 0.3) * 0.1;
        }

        // Spectrum particle drift
        this.specPts.rotation.z += 0.001;
        this.specPts.rotation.y += 0.0005;

        // Camera
        this.camera.position.x = this.mouseSmooth.x * 3;
        this.camera.position.y = 2 + this.mouseSmooth.y * 2;
        this.camera.lookAt(0, 1, 0);
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
