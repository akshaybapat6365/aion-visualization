/**
 * ThreeTreeViz.js — Chapter 11: "The Alchemical Interpretation of the Fish"
 *
 * Jung: The tree is the "arcane substance" — roots in the unconscious,
 * trunk is the opus, branches are the thousand names of the stone.
 * The aqua doctrinae rises from darkness. Looking into the waters
 * reveals the lapis in one's own reflection.
 *
 * Visual: An inverted tree (roots up) reinterpreted: roots = unconscious
 * above, trunk = opus work, branches = thousand names reaching down.
 * Flowing water (aqua doctrinae) rises from darkness. A mirror surface
 * shows the arcane substance both inside a figure and outside in cosmos.
 * A self-knowledge animation: a figure gazes into waters, seeing the
 * lapis in its reflection.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const ROOT_DARK = new THREE.Color('#2a0845');
const TRUNK_BROWN = new THREE.Color('#5a3a2a');
const BRANCH_GOLD = new THREE.Color('#c8a820');
const WATER_BLUE = new THREE.Color('#1a4a8a');
const WATER_GLOW = new THREE.Color('#4a8aca');
const LAPIS_GOLD = new THREE.Color('#d4af37');
const FIGURE_WHITE = new THREE.Color('#d0d0e0');
const MIRROR_CYAN = new THREE.Color('#22d3ee');
const COSMOS_PURPLE = new THREE.Color('#3a1a6a');
const VOID = 0x030308;

const WATER_PARTICLES = 200;
const THOUSAND_NAMES = 50;

export default class ThreeTreeViz extends BaseViz {
    constructor(container, opts = {}) {
        super(container, Object.assign({ contextType: 'webgl' }, opts));
    }

    async init() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(VOID);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(VOID, 0.01);

        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 2, 12);

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this._onMouseMove = this._onMouseMove.bind(this);
        window.addEventListener('mousemove', this._onMouseMove);

        this._createPhilosophicalTree();
        this._createAquaDoctrinae();
        this._createMirrorSurface();
        this._createFigureReflection();
        this._createCosmicSubstance();
        this._createLights();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.2, 0.6, 0.4
        );
        this.composer.addPass(this.bloomPass);
    }

    _createPhilosophicalTree() {
        this.treeGroup = new THREE.Group();

        // Trunk — central vertical pillar (the opus)
        const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 6, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: TRUNK_BROWN, emissive: '#1a1008', emissiveIntensity: 0.2,
        });
        this.treeGroup.add(new THREE.Mesh(trunkGeo, trunkMat));

        // Roots (above — unconscious, reaching into sky)
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const len = 1 + Math.random() * 1.5;
            const rootGeo = new THREE.CylinderGeometry(0.02, 0.04, len, 4);
            const root = new THREE.Mesh(rootGeo, new THREE.MeshStandardMaterial({
                color: ROOT_DARK, emissive: ROOT_DARK, emissiveIntensity: 0.3,
                transparent: true, opacity: 0.6,
            }));
            root.position.set(Math.cos(angle) * 0.3, 3 + len * 0.4, Math.sin(angle) * 0.3);
            root.rotation.z = angle * 0.4 - Math.PI * 0.1;
            this.treeGroup.add(root);
        }

        // Branches (below — thousand names, reaching down)
        this.nameParticles = [];
        for (let i = 0; i < THOUSAND_NAMES; i++) {
            const angle = (i / THOUSAND_NAMES) * Math.PI * 2;
            const branchLen = 1.5 + Math.random() * 2;
            const branchGeo = new THREE.CylinderGeometry(0.01, 0.02, branchLen, 3);
            const branch = new THREE.Mesh(branchGeo, new THREE.MeshStandardMaterial({
                color: BRANCH_GOLD, emissive: BRANCH_GOLD, emissiveIntensity: 0.3,
                transparent: true, opacity: 0.4,
            }));
            branch.position.set(
                Math.cos(angle) * (0.5 + Math.random() * 0.5),
                -3 - branchLen * 0.3,
                Math.sin(angle) * (0.5 + Math.random() * 0.5)
            );
            branch.rotation.z = (Math.random() - 0.5) * 0.5;
            this.treeGroup.add(branch);

            // Luminous tip — a "name"
            const tipGeo = new THREE.SphereGeometry(0.03, 6, 6);
            const tip = new THREE.Mesh(tipGeo, new THREE.MeshBasicMaterial({
                color: BRANCH_GOLD, transparent: true, opacity: 0.6,
            }));
            tip.position.copy(branch.position).add(new THREE.Vector3(0, -branchLen * 0.5, 0));
            this.treeGroup.add(tip);
            this.nameParticles.push(tip);
        }

        this.scene.add(this.treeGroup);
    }

    _createAquaDoctrinae() {
        const count = WATER_PARTICLES;
        const positions = new Float32Array(count * 3);
        this.waterPhases = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 3;
            positions[i * 3 + 1] = -6 + Math.random() * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
            this.waterPhases[i] = Math.random() * Math.PI * 2;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.waterPts = new THREE.Points(geo, new THREE.PointsMaterial({
            color: WATER_GLOW, size: 0.08, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.waterPts);
    }

    _createMirrorSurface() {
        const mirrorGeo = new THREE.PlaneGeometry(12, 8);
        const mirrorMat = new THREE.MeshBasicMaterial({
            color: MIRROR_CYAN, transparent: true, opacity: 0.02,
            side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        });
        this.mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
        this.mirror.rotation.x = -Math.PI / 2;
        this.mirror.position.y = -5;
        this.scene.add(this.mirror);
    }

    _createFigureReflection() {
        // Figure above mirror
        this.figureGroup = new THREE.Group();
        const fBody = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.2, 0.8, 6, 12),
            new THREE.MeshStandardMaterial({
                color: FIGURE_WHITE, emissive: FIGURE_WHITE, emissiveIntensity: 0.2,
                transparent: true, opacity: 0.6,
            })
        );
        fBody.position.y = -4;
        this.figureGroup.add(fBody);
        const fHead = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            fBody.material.clone()
        );
        fHead.position.y = -3.4;
        this.figureGroup.add(fHead);

        // Reflection with lapis replacing head
        this.reflectionGroup = new THREE.Group();
        const rBody = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.2, 0.8, 6, 12),
            new THREE.MeshStandardMaterial({
                color: FIGURE_WHITE, transparent: true, opacity: 0.2,
            })
        );
        rBody.position.y = -6;
        rBody.scale.y = -1;
        this.reflectionGroup.add(rBody);

        // Lapis in reflection (where head should be)
        this.reflectionLapis = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.2, 0),
            new THREE.MeshStandardMaterial({
                color: LAPIS_GOLD, emissive: LAPIS_GOLD, emissiveIntensity: 0.5,
                metalness: 0.7, roughness: 0.2, transparent: true, opacity: 0,
            })
        );
        this.reflectionLapis.position.y = -6.6;
        this.reflectionGroup.add(this.reflectionLapis);

        this.figureGroup.position.x = 4;
        this.reflectionGroup.position.x = 4;
        this.scene.add(this.figureGroup);
        this.scene.add(this.reflectionGroup);
    }

    _createCosmicSubstance() {
        // Arcane substance particles — both near figure AND in distant cosmos
        const count = 400;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            if (i < count / 2) {
                // Near figure
                const r = 0.5 + Math.random() * 1.5;
                const theta = Math.random() * Math.PI * 2;
                positions[i * 3] = 4 + Math.cos(theta) * r;
                positions[i * 3 + 1] = -4 + (Math.random() - 0.5) * 2;
                positions[i * 3 + 2] = Math.sin(theta) * r;
                colors[i * 3] = LAPIS_GOLD.r * 0.5;
                colors[i * 3 + 1] = LAPIS_GOLD.g * 0.5;
                colors[i * 3 + 2] = LAPIS_GOLD.b * 0.5;
            } else {
                // In distant cosmos
                const r = 8 + Math.random() * 15;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                positions[i * 3 + 2] = r * Math.cos(phi);
                colors[i * 3] = COSMOS_PURPLE.r;
                colors[i * 3 + 1] = COSMOS_PURPLE.g;
                colors[i * 3 + 2] = COSMOS_PURPLE.b;
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.cosmicPts = new THREE.Points(geo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.05, transparent: true, opacity: 0.3,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.cosmicPts);
    }

    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));
        this.scene.add(Object.assign(new THREE.PointLight(0x2a0845, 0.5, 15), { position: new THREE.Vector3(0, 5, 3) }));
        this.scene.add(Object.assign(new THREE.PointLight(0xc8a820, 0.5, 15), { position: new THREE.Vector3(0, -4, 3) }));
        this.scene.add(Object.assign(new THREE.PointLight(0x4a8aca, 0.3, 10), { position: new THREE.Vector3(4, -5, 2) }));
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.03);

        // Tree gentle sway
        this.treeGroup.rotation.z = Math.sin(t * 0.05) * 0.03;
        this.treeGroup.rotation.y = t * 0.005;

        // Name particles twinkle
        for (const np of this.nameParticles) {
            np.material.opacity = 0.3 + Math.sin(t * 0.5 + np.position.x * 2) * 0.3;
        }

        // Water rising
        const waterPos = this.waterPts.geometry.attributes.position.array;
        for (let i = 0; i < WATER_PARTICLES; i++) {
            waterPos[i * 3 + 1] += dt * 0.3;
            waterPos[i * 3] += Math.sin(t * 0.2 + this.waterPhases[i]) * dt * 0.05;
            if (waterPos[i * 3 + 1] > 0) {
                waterPos[i * 3 + 1] = -6;
                waterPos[i * 3] = (Math.random() - 0.5) * 3;
            }
        }
        this.waterPts.geometry.attributes.position.needsUpdate = true;

        // Mirror shimmer
        this.mirror.material.opacity = 0.015 + Math.sin(t * 0.15) * 0.008;

        // Lapis in reflection fading in
        const lapisProgress = Math.min(1, t / 60);
        this.reflectionLapis.material.opacity = lapisProgress * 0.6;
        this.reflectionLapis.rotation.y = t * 0.1;
        this.reflectionLapis.material.emissiveIntensity = 0.3 + lapisProgress * 0.4;

        // Cosmic particles slow rotation
        this.cosmicPts.rotation.y += dt * 0.002;

        // Camera
        const camAngle = t * 0.015 + this.mouseSmooth.x * 0.3;
        const camH = 1 + this.mouseSmooth.y * 4;
        this.camera.position.set(Math.sin(camAngle) * 12, camH, Math.cos(camAngle) * 12);
        this.camera.lookAt(0, -1, 0);

        if (this.bloomPass) this.bloomPass.strength = 1.0 + Math.sin(t * 0.1) * 0.3;
    }

    render() { this.composer?.render(); }
    onResize(w, h) {
        if (!this.renderer || !this.camera) return;
        this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h); this.composer?.setSize(w, h); this.bloomPass?.setSize(w, h);
    }
    _onMouseMove(e) { this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; }
    dispose() {
        window.removeEventListener('mousemove', this._onMouseMove);
        if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
        this.scene?.traverse(o => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
        this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
