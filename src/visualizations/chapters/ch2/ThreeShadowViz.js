/**
 * ThreeShadowViz.js — Chapter 2: "The Shadow"
 * Dark double that mirrors ego movements with distortion.
 * Shadow mirror mechanic, projection particles, deep purple/smoky palette.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const VOID = 0x030308;
const EGO_CLR = new THREE.Color('#c0c0d0');
const SHADOW_CLR = new THREE.Color('#2a0a3a');
const PROJ_CLR = new THREE.Color('#6a1b9a');
const SMOKE_CLR = new THREE.Color('#1a0a2a');

export default class ThreeShadowViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(VOID);
        R.toneMapping = THREE.ACESFilmicToneMapping;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(VOID, 0.02);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 2, 12);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => { this.mouse.x = (e.clientX / innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / innerHeight) * 2 + 1; };
        addEventListener('mousemove', this._onMM);

        // Ego sphere (luminous, left)
        this.ego = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), new THREE.MeshStandardMaterial({ color: EGO_CLR, emissive: EGO_CLR, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.1 }));
        this.ego.position.set(-2, 0, 0);
        this.scene.add(this.ego);

        // Shadow double (dark distorted, right) — mirrors ego
        this.shadow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), new THREE.MeshStandardMaterial({ color: SHADOW_CLR, emissive: SHADOW_CLR, emissiveIntensity: 0.15, roughness: 0.9, metalness: 0.3 }));
        this.shadow.position.set(2, 0, 0);
        this.scene.add(this.shadow);

        // Mirror plane
        this.mirrorPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 8), new THREE.MeshBasicMaterial({ color: 0x2a0a3a, transparent: true, opacity: 0.15 }));
        this.scene.add(this.mirrorPlane);

        // Projection particles (fly outward from shadow)
        const projN = 300;
        this.projData = [];
        const projPos = new Float32Array(projN * 3);
        for (let i = 0; i < projN; i++) {
            const d = { vel: new THREE.Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.02), life: Math.random() };
            this.projData.push(d);
            projPos[i * 3] = 2; projPos[i * 3 + 1] = 0; projPos[i * 3 + 2] = 0;
        }
        const projGeo = new THREE.BufferGeometry();
        projGeo.setAttribute('position', new THREE.BufferAttribute(projPos, 3));
        this.projPts = new THREE.Points(projGeo, new THREE.PointsMaterial({ color: PROJ_CLR, size: 0.04, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
        this.scene.add(this.projPts);

        // Smoke/fog particles
        const smokeN = 500;
        const smokePos = new Float32Array(smokeN * 3);
        for (let i = 0; i < smokeN; i++) {
            smokePos[i * 3] = (Math.random() - 0.5) * 20;
            smokePos[i * 3 + 1] = (Math.random() - 0.5) * 10;
            smokePos[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        const smokeGeo = new THREE.BufferGeometry();
        smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
        this.smoke = new THREE.Points(smokeGeo, new THREE.PointsMaterial({ color: SMOKE_CLR, size: 0.08, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }));
        this.scene.add(this.smoke);

        // Lights
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));
        this.egoLight = new THREE.PointLight(0xb0b0d0, 0.6, 10);
        this.egoLight.position.set(-2, 2, 3);
        this.scene.add(this.egoLight);
        const shadowLight = new THREE.PointLight(0x2a0a3a, 0.3, 8);
        shadowLight.position.set(2, -1, 3);
        this.scene.add(shadowLight);

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.0, 0.6, 0.4);
        this.composer.addPass(this.bloom);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);

        // Ego follows mouse gently
        this.ego.position.x = -2 + this.mouseSmooth.x * 1.5;
        this.ego.position.y = this.mouseSmooth.y * 1.5;

        // Shadow mirrors with delay and distortion
        const sx = 2 - this.mouseSmooth.x * 1.5; // mirrored x
        const sy = -this.mouseSmooth.y * 1.5 + Math.sin(t * 0.5) * 0.3; // inverted + distortion
        this.shadow.position.x += (sx - this.shadow.position.x) * 0.02; // lag
        this.shadow.position.y += (sy - this.shadow.position.y) * 0.02;

        // Shadow scale distortion
        const distort = 1 + Math.sin(t * 0.7) * 0.2;
        this.shadow.scale.set(distort, 1 / distort, distort);

        // Projection particles
        const pp = this.projPts.geometry.attributes.position.array;
        for (let i = 0; i < this.projData.length; i++) {
            const d = this.projData[i];
            d.life += dt * 0.3;
            if (d.life > 1) {
                d.life = 0;
                pp[i * 3] = this.shadow.position.x;
                pp[i * 3 + 1] = this.shadow.position.y;
                pp[i * 3 + 2] = this.shadow.position.z;
                d.vel.set((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.02, (Math.random() - 0.3) * 0.03);
            }
            pp[i * 3] += d.vel.x; pp[i * 3 + 1] += d.vel.y; pp[i * 3 + 2] += d.vel.z;
        }
        this.projPts.geometry.attributes.position.needsUpdate = true;

        // Smoke drift
        this.smoke.rotation.y += 0.0005;

        // Camera orbit
        const ca = t * 0.015 + this.mouseSmooth.x * 0.15;
        this.camera.position.x = Math.sin(ca) * 12;
        this.camera.position.z = Math.cos(ca) * 12;
        this.camera.position.y = 2 + this.mouseSmooth.y * 1.5;
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
        this.composer = null; this.scene = null; this.renderer = null;
        super.dispose();
    }
}
