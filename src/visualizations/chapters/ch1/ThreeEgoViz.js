/**
 * ThreeEgoViz.js — Chapter 1: "The Ego"
 * A luminous point on a vast dark ocean of the unconscious.
 * Enhanced: volumetric rays, interactive waves, cinematic camera, dramatic Self reveal.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const EGO_WHITE = new THREE.Color('#e8e8f0');
const EGO_GLOW = new THREE.Color('#b0b0d0');
const SOMATIC = new THREE.Color('#5a1010');
const SELF_GOLD = new THREE.Color('#ffd700');
const WAVE_CYAN = new THREE.Color('#0a2a4a');
const VOID = 0x020208;
const OCEAN_N = 2000;

export default class ThreeEgoViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
        R.setPixelRatio(Math.min(devicePixelRatio, 2));
        R.setSize(this.width, this.height);
        R.setClearColor(VOID);
        R.toneMapping = THREE.ACESFilmicToneMapping;

        const S = this.scene = new THREE.Scene();
        S.fog = new THREE.FogExp2(VOID, 0.012);

        const cam = this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        cam.position.set(0, 18, 25); // start high for cinematic intro

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        this._buildEgo();
        this._buildOcean();
        this._buildSomatic();
        this._buildWaves();
        this._buildSelf();
        this._buildRays();

        S.add(new THREE.AmbientLight(0x0a0a10, 0.15));
        this.egoLight = new THREE.PointLight(0xb0b0d0, 0.8, 12);
        this.egoLight.position.set(0, 1, 2);
        S.add(this.egoLight);

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(S, cam));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.4, 0.4, 0.35);
        this.composer.addPass(this.bloom);

        this.introT = 0; // cinematic intro timer
    }

    _buildEgo() {
        const g = this.egoGroup = new THREE.Group();
        // Bright core
        this.egoDot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 20), new THREE.MeshBasicMaterial({ color: EGO_WHITE, transparent: true, opacity: 1 }));
        g.add(this.egoDot);
        // Inner glow
        this.egoGlow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshBasicMaterial({ color: EGO_GLOW, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending }));
        g.add(this.egoGlow);
        // Outer aura
        this.egoAura = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), new THREE.MeshBasicMaterial({ color: EGO_GLOW, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending }));
        g.add(this.egoAura);
        this.scene.add(g);
    }

    _buildOcean() {
        const pos = new Float32Array(OCEAN_N * 3);
        this.oceanPh = new Float32Array(OCEAN_N);
        for (let i = 0; i < OCEAN_N; i++) {
            const r = 0.5 + Math.random() * 30, th = Math.random() * Math.PI * 2;
            pos[i * 3] = Math.cos(th) * r;
            pos[i * 3 + 1] = -(0.5 + Math.random() * 15);
            pos[i * 3 + 2] = Math.sin(th) * r;
            this.oceanPh[i] = Math.random() * Math.PI * 2;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.oceanPts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x0a0a15, size: 0.06, transparent: true, opacity: 0.3, depthWrite: false }));
        this.scene.add(this.oceanPts);

        // Surface plane with mouse-interactive waves
        const surfGeo = new THREE.PlaneGeometry(80, 80, 64, 64);
        this.surfVerts = surfGeo.attributes.position.array;
        this.surfGeo = surfGeo;
        this.surface = new THREE.Mesh(surfGeo, new THREE.MeshBasicMaterial({ color: WAVE_CYAN, transparent: true, opacity: 0.04, side: THREE.DoubleSide, wireframe: true }));
        this.surface.rotation.x = -Math.PI / 2;
        this.surface.position.y = -0.5;
        this.scene.add(this.surface);
    }

    _buildSomatic() {
        this.somatic = [];
        for (let i = 0; i < 6; i++) {
            const m = new THREE.Mesh(new THREE.SphereGeometry(0.5 + Math.random() * 0.6, 12, 12), new THREE.MeshBasicMaterial({ color: SOMATIC, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending }));
            const a = (i / 6) * Math.PI * 2;
            m.position.set(Math.cos(a) * (2.5 + Math.random() * 2), -(1.5 + Math.random() * 3), Math.sin(a) * (2.5 + Math.random() * 2));
            this.scene.add(m);
            this.somatic.push({ mesh: m, ph: Math.random() * Math.PI * 2 });
        }
    }

    _buildWaves() {
        this.rings = [];
        for (let i = 0; i < 4; i++) {
            const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.015, 4, 80), new THREE.MeshBasicMaterial({ color: 0x0a1a3a, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending }));
            r.rotation.x = -Math.PI / 2; r.position.y = -0.3;
            this.scene.add(r);
            this.rings.push({ mesh: r, ph: i * 2.5 });
        }
    }

    _buildSelf() {
        this.deepSelf = new THREE.Mesh(new THREE.SphereGeometry(1.5, 20, 20), new THREE.MeshBasicMaterial({ color: SELF_GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
        this.deepSelf.position.set(0, -8, 0);
        this.scene.add(this.deepSelf);
        this.selfLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -8, 0)]), new THREE.LineBasicMaterial({ color: SELF_GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
        this.scene.add(this.selfLine);
        // Self glow halo
        this.selfHalo = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 16), new THREE.MeshBasicMaterial({ color: SELF_GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
        this.selfHalo.position.set(0, -8, 0);
        this.scene.add(this.selfHalo);
    }

    _buildRays() {
        // Volumetric light rays from ego point
        this.rays = [];
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(a) * 4, Math.sin(a * 0.3) * 1.5, Math.sin(a) * 4)];
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: EGO_GLOW, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending }));
            this.scene.add(line);
            this.rays.push({ line, ph: Math.random() * Math.PI * 2 });
        }
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.03);
        this.introT += dt;

        // Ego flicker — brighter than before
        const f = 0.85 + Math.sin(t * 1.5) * 0.1 + Math.sin(t * 3.7) * 0.05;
        this.egoDot.material.opacity = f;
        this.egoGlow.material.opacity = 0.1 + Math.sin(t * 0.8) * 0.05;
        this.egoAura.material.opacity = 0.03 + Math.sin(t * 0.3) * 0.015;

        // Ego drift
        this.egoGroup.position.x = Math.sin(t * 0.05) * 0.3;
        this.egoGroup.position.y = Math.sin(t * 0.12) * 0.15;

        // Rays pulsing
        for (const r of this.rays) {
            r.line.material.opacity = 0.04 + Math.sin(t * 0.5 + r.ph) * 0.03;
        }

        // Ocean wave
        const op = this.oceanPts.geometry.attributes.position.array;
        for (let i = 0; i < OCEAN_N; i++) op[i * 3 + 1] += Math.sin(t * 0.1 + this.oceanPh[i]) * dt * 0.012;
        this.oceanPts.geometry.attributes.position.needsUpdate = true;

        // Interactive surface waves
        const sv = this.surfVerts;
        for (let i = 0; i < sv.length; i += 3) {
            const x = sv[i], z = sv[i + 1]; // PlaneGeometry x,y → world x,z
            const dist = Math.sqrt((x - this.mouseSmooth.x * 20) ** 2 + (z - this.mouseSmooth.y * 20) ** 2);
            sv[i + 2] = Math.sin(t * 2 + dist * 0.3) * 0.15 * Math.max(0, 1 - dist / 20);
        }
        this.surfGeo.attributes.position.needsUpdate = true;

        // Somatic heartbeat
        for (const sp of this.somatic) {
            const beat = Math.sin(t * 1.2 + sp.ph);
            sp.mesh.material.opacity = 0.04 + Math.max(0, beat) * 0.08;
            sp.mesh.scale.setScalar(1 + Math.max(0, beat) * 0.4);
        }

        // Psychic rings
        for (const ring of this.rings) {
            const p = ((t + ring.ph) % 10) / 10;
            ring.mesh.scale.setScalar(1 + p * 10);
            ring.mesh.material.opacity = 0.1 * (1 - p);
        }

        // Self revelation — every 20s for 8s, much more dramatic
        const sc = t % 20;
        const sv2 = sc > 12;
        const so = sv2 ? Math.sin((sc - 12) * Math.PI / 8) * 0.15 : 0;
        this.deepSelf.material.opacity = so;
        this.selfHalo.material.opacity = so * 0.3;
        this.selfLine.material.opacity = so * 0.5;
        this.egoLight.intensity = 0.6 + (sv2 ? 0.5 : 0);

        // Cinematic camera intro: dive from above → orbit
        const introFrac = Math.min(this.introT / 8, 1); // 8s cinematic intro
        const easeIntro = 1 - Math.pow(1 - introFrac, 3); // ease-out cubic
        const targetH = 2 + this.mouseSmooth.y * 3 + Math.sin(t * 0.03) * 0.5;
        const camH = THREE.MathUtils.lerp(18, targetH, easeIntro);
        const camDist = THREE.MathUtils.lerp(25, 10, easeIntro);
        const camAngle = t * 0.015 + this.mouseSmooth.x * 0.3;
        this.camera.position.set(Math.sin(camAngle) * camDist, camH, Math.cos(camAngle) * camDist);
        this.camera.lookAt(0, -1, 0);

        if (this.bloom) this.bloom.strength = 1.2 + Math.sin(t * 0.1) * 0.3;
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
        this.scene?.traverse(o => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
        this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
