/**
 * ThreeCrystalViz.js — Chapter 5: "Christ, a Symbol of the Self"
 *
 * Jung: "Christ exemplifies the archetype of the self... the cross unites
 * the opposites. The crucifixion between two thieves represents the
 * tension of the moral opposites."
 *
 * Visual: A radiant cruciform figure suspended between two thieves —
 * one ascending in light, one descending in darkness. The Tetramorph
 * (lion, bull, eagle, man) pulses at the four cross-arms. A cosmic tree
 * grows beneath, roots into a red abyss. The entire assembly swings
 * like a pendulum between light and dark hemispheres (enantiodromia).
 * The privatio boni makes the dark side periodically fade then reassert.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const LIGHT_GOLD = new THREE.Color('#ffd700');
const LIGHT_WHITE = new THREE.Color('#fffff0');
const SHADOW_RED = new THREE.Color('#4a0000');
const SHADOW_BLACK = new THREE.Color('#0a0005');
const TREE_GREEN = new THREE.Color('#2d5a27');
const TREE_GOLD = new THREE.Color('#c8a820');
const ABYSS_RED = new THREE.Color('#8b0000');
const LION_RED = new THREE.Color('#ff4444');
const BULL_EARTH = new THREE.Color('#8b6914');
const EAGLE_BLUE = new THREE.Color('#4169e1');
const MAN_GOLD = new THREE.Color('#ffd700');

export default class ThreeCrystalViz extends BaseViz {
    constructor(container, opts = {}) {
        super(container, Object.assign({ contextType: 'webgl' }, opts));
    }

    async init() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x020208);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x020208, 0.012);

        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 2, 14);

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this._onMouseMove = this._onMouseMove.bind(this);
        window.addEventListener('mousemove', this._onMouseMove);

        this.pendulumGroup = new THREE.Group();
        this.scene.add(this.pendulumGroup);

        this._createCruciformFigure();
        this._createTwoThieves();
        this._createTetramorph();
        this._createCosmicTree();
        this._createHemispheres();
        this._createAmbientParticles();
        this._createLights();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.2, 0.5, 0.4
        );
        this.composer.addPass(this.bloomPass);
    }

    /* ─── 1. Cruciform Figure ─── */
    _createCruciformFigure() {
        this.crossGroup = new THREE.Group();

        // Vertical beam
        const vGeo = new THREE.BoxGeometry(0.15, 6, 0.15);
        const crossMat = new THREE.MeshStandardMaterial({
            color: LIGHT_GOLD, emissive: '#8b6800', emissiveIntensity: 0.5,
            metalness: 0.6, roughness: 0.3,
        });
        this.crossGroup.add(new THREE.Mesh(vGeo, crossMat));

        // Horizontal beam
        const hGeo = new THREE.BoxGeometry(5, 0.12, 0.12);
        const hMesh = new THREE.Mesh(hGeo, crossMat.clone());
        hMesh.position.y = 1;
        this.crossGroup.add(hMesh);

        // Central figure — glowing sphere at intersection
        const figGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const figMat = new THREE.MeshStandardMaterial({
            color: LIGHT_WHITE, emissive: LIGHT_GOLD, emissiveIntensity: 0.8,
            transparent: true, opacity: 0.8,
        });
        const fig = new THREE.Mesh(figGeo, figMat);
        fig.position.y = 1;
        this.crossGroup.add(fig);

        // Aura / halo
        const haloGeo = new THREE.RingGeometry(0.5, 0.7, 32);
        const haloMat = new THREE.MeshBasicMaterial({
            color: LIGHT_GOLD, transparent: true, opacity: 0.2,
            side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.y = 1.7;
        this.crossGroup.add(halo);

        this.pendulumGroup.add(this.crossGroup);
    }

    /* ─── 2. Two Thieves ─── */
    _createTwoThieves() {
        this.thieves = [];

        // Right thief — ascending, light particles rising
        const rightGroup = new THREE.Group();
        rightGroup.position.set(3.5, 0, 0);
        const rCrossV = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 3.5, 0.08),
            new THREE.MeshStandardMaterial({ color: '#aaa080', emissive: '#554020', emissiveIntensity: 0.3 })
        );
        rightGroup.add(rCrossV);
        const rCrossH = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.08, 0.08),
            new THREE.MeshStandardMaterial({ color: '#aaa080', emissive: '#554020', emissiveIntensity: 0.3 })
        );
        rCrossH.position.y = 0.5;
        rightGroup.add(rCrossH);

        // Ascending particles
        this._createThiefParticles(rightGroup, LIGHT_WHITE, 1); // direction up
        this.pendulumGroup.add(rightGroup);
        this.thieves.push({ group: rightGroup, direction: 1 });

        // Left thief — descending, dark particles falling
        const leftGroup = new THREE.Group();
        leftGroup.position.set(-3.5, 0, 0);
        const lCrossV = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 3.5, 0.08),
            new THREE.MeshStandardMaterial({ color: '#3a1010', emissive: '#1a0505', emissiveIntensity: 0.3 })
        );
        leftGroup.add(lCrossV);
        const lCrossH = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.08, 0.08),
            new THREE.MeshStandardMaterial({ color: '#3a1010', emissive: '#1a0505', emissiveIntensity: 0.3 })
        );
        lCrossH.position.y = 0.5;
        leftGroup.add(lCrossH);

        this._createThiefParticles(leftGroup, SHADOW_RED, -1); // direction down
        this.pendulumGroup.add(leftGroup);
        this.thieves.push({ group: leftGroup, direction: -1 });
    }

    _createThiefParticles(parent, color, dir) {
        const count = 80;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1.5;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({
            color, size: 0.06, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        pts.userData = { direction: dir };
        parent.add(pts);
    }

    /* ─── 3. Tetramorph — four evangelists ─── */
    _createTetramorph() {
        this.tetramorphNodes = [];
        const configs = [
            { angle: 0, color: LION_RED, shape: 'cone', label: 'Lion' },           // right
            { angle: Math.PI, color: BULL_EARTH, shape: 'box', label: 'Bull' },     // left
            { angle: Math.PI / 2, color: EAGLE_BLUE, shape: 'oct', label: 'Eagle' }, // top conceptual
            { angle: -Math.PI / 2, color: MAN_GOLD, shape: 'sphere', label: 'Man' }, // bottom conceptual
        ];

        for (const cfg of configs) {
            const group = new THREE.Group();
            let geo;
            switch (cfg.shape) {
                case 'cone': geo = new THREE.ConeGeometry(0.25, 0.5, 6); break;
                case 'box': geo = new THREE.BoxGeometry(0.4, 0.3, 0.3); break;
                case 'oct': geo = new THREE.OctahedronGeometry(0.25, 0); break;
                default: geo = new THREE.SphereGeometry(0.2, 8, 8); break;
            }
            const mat = new THREE.MeshStandardMaterial({
                color: cfg.color, emissive: cfg.color, emissiveIntensity: 0.5,
                transparent: true, opacity: 0.6, metalness: 0.4, roughness: 0.4,
            });
            const mesh = new THREE.Mesh(geo, mat);
            group.add(mesh);

            // Particle halo around each
            const pCount = 30;
            const pPos = new Float32Array(pCount * 3);
            for (let i = 0; i < pCount; i++) {
                const r = 0.3 + Math.random() * 0.3;
                const a = Math.random() * Math.PI * 2;
                pPos[i * 3] = Math.cos(a) * r;
                pPos[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
                pPos[i * 3 + 2] = Math.sin(a) * r;
            }
            const pGeo = new THREE.BufferGeometry();
            pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
            group.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
                color: cfg.color, size: 0.04, transparent: true, opacity: 0.4,
                blending: THREE.AdditiveBlending, depthWrite: false,
            })));

            // Position at cross-arm ends
            const xArmEnd = 2.8;
            if (cfg.label === 'Lion') group.position.set(xArmEnd, 1, 0);
            else if (cfg.label === 'Bull') group.position.set(-xArmEnd, 1, 0);
            else if (cfg.label === 'Eagle') group.position.set(0, 3.5, 0);
            else group.position.set(0, -1.5, 0);

            this.pendulumGroup.add(group);
            this.tetramorphNodes.push({ group, cfg, mesh });
        }
    }

    /* ─── 4. Cosmic Tree ─── */
    _createCosmicTree() {
        this.treeGroup = new THREE.Group();

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.06, 0.12, 5, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: TREE_GREEN, emissive: '#0a2a0a', emissiveIntensity: 0.3,
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = -5;
        this.treeGroup.add(trunk);

        // Branches (upward — toward gold light)
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const bLen = 0.8 + Math.random() * 0.5;
            const bGeo = new THREE.CylinderGeometry(0.02, 0.01, bLen, 4);
            const branch = new THREE.Mesh(bGeo, new THREE.MeshStandardMaterial({
                color: TREE_GOLD, emissive: TREE_GOLD, emissiveIntensity: 0.3,
                transparent: true, opacity: 0.6,
            }));
            branch.position.set(Math.cos(angle) * 0.3, -3 + i * 0.3, Math.sin(angle) * 0.3);
            branch.rotation.z = (Math.random() - 0.5) * 0.8;
            this.treeGroup.add(branch);
        }

        // Roots (downward — into red abyss)
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const rLen = 1 + Math.random() * 1;
            const rGeo = new THREE.CylinderGeometry(0.03, 0.01, rLen, 4);
            const root = new THREE.Mesh(rGeo, new THREE.MeshStandardMaterial({
                color: ABYSS_RED, emissive: ABYSS_RED, emissiveIntensity: 0.4,
                transparent: true, opacity: 0.5,
            }));
            root.position.set(Math.cos(angle) * 0.2, -7.5 - Math.random(), Math.sin(angle) * 0.2);
            root.rotation.z = (Math.random() - 0.5) * 0.5;
            this.treeGroup.add(root);
        }

        // Abyss glow beneath roots
        const abyssGeo = new THREE.SphereGeometry(2, 16, 16);
        const abyssMat = new THREE.MeshBasicMaterial({
            color: ABYSS_RED, transparent: true, opacity: 0.08,
            blending: THREE.AdditiveBlending,
        });
        const abyss = new THREE.Mesh(abyssGeo, abyssMat);
        abyss.position.y = -9;
        this.treeGroup.add(abyss);

        this.pendulumGroup.add(this.treeGroup);
    }

    /* ─── 5. Light / Dark Hemispheres ─── */
    _createHemispheres() {
        // Light hemisphere (right)
        const lightGeo = new THREE.SphereGeometry(15, 32, 32, 0, Math.PI);
        const lightMat = new THREE.MeshBasicMaterial({
            color: LIGHT_GOLD, transparent: true, opacity: 0.015,
            side: THREE.BackSide, blending: THREE.AdditiveBlending,
        });
        this.lightHemi = new THREE.Mesh(lightGeo, lightMat);
        this.lightHemi.rotation.y = -Math.PI / 2;
        this.scene.add(this.lightHemi);

        // Dark hemisphere (left)
        const darkGeo = new THREE.SphereGeometry(15, 32, 32, 0, Math.PI);
        const darkMat = new THREE.MeshBasicMaterial({
            color: SHADOW_RED, transparent: true, opacity: 0.02,
            side: THREE.BackSide,
        });
        this.darkHemi = new THREE.Mesh(darkGeo, darkMat);
        this.darkHemi.rotation.y = Math.PI / 2;
        this.scene.add(this.darkHemi);
    }

    _createAmbientParticles() {
        const count = 800;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 3 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            const isLight = positions[i * 3] > 0;
            const c = isLight ? LIGHT_GOLD : SHADOW_RED;
            colors[i * 3] = c.r * 0.5;
            colors[i * 3 + 1] = c.g * 0.5;
            colors[i * 3 + 2] = c.b * 0.5;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.ambientPts = new THREE.Points(geo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.06, transparent: true, opacity: 0.3,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.ambientPts);
    }

    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x080810, 0.3));
        const goldLight = new THREE.PointLight(0xffd700, 1.0, 20);
        goldLight.position.set(2, 3, 5);
        this.scene.add(goldLight);
        const redLight = new THREE.PointLight(0x8b0000, 0.5, 20);
        redLight.position.set(-2, -3, 5);
        this.scene.add(redLight);
        const rimLight = new THREE.PointLight(0x4169e1, 0.3, 25);
        rimLight.position.set(0, 8, -5);
        this.scene.add(rimLight);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.03);

        // ─── Pendulum swing (enantiodromia) ───
        const pendulumAngle = Math.sin(t * 0.08) * 0.15;
        this.pendulumGroup.rotation.z = pendulumAngle;

        // ─── Tetramorph pulse ───
        for (const node of this.tetramorphNodes) {
            const pulse = 0.5 + 0.3 * Math.sin(t * 0.4 + node.cfg.angle);
            node.mesh.material.emissiveIntensity = pulse;
            node.group.rotation.y += dt * 0.2;
        }

        // ─── Thief particles flow ───
        for (const thief of this.thieves) {
            thief.group.traverse(child => {
                if (child instanceof THREE.Points && child.userData.direction) {
                    const pos = child.geometry.attributes.position.array;
                    for (let i = 0; i < pos.length / 3; i++) {
                        pos[i * 3 + 1] += child.userData.direction * dt * 0.5;
                        if (pos[i * 3 + 1] > 3) pos[i * 3 + 1] = -3;
                        if (pos[i * 3 + 1] < -3) pos[i * 3 + 1] = 3;
                    }
                    child.geometry.attributes.position.needsUpdate = true;
                }
            });
        }

        // ─── Privatio boni — dark side fades then reasserts ───
        const privatioCycle = t * 0.05;
        const privatioPhase = Math.sin(privatioCycle);
        // Dark hemisphere opacity oscillates: mostly visible, occasionally fades
        const darkOpacity = 0.02 + Math.max(0, privatioPhase) * 0.03;
        this.darkHemi.material.opacity = darkOpacity;
        // When dark fades, right-thief light thief gets brighter
        this.lightHemi.material.opacity = 0.015 + Math.max(0, -privatioPhase) * 0.01;

        // ─── Tree sway ───
        this.treeGroup.rotation.z = Math.sin(t * 0.1) * 0.03;

        // ─── Camera orbital ───
        const camAngle = t * 0.02 + this.mouseSmooth.x * 0.3;
        const camH = 2 + this.mouseSmooth.y * 3 + Math.sin(t * 0.04) * 1;
        this.camera.position.set(
            Math.sin(camAngle) * 14,
            camH,
            Math.cos(camAngle) * 14
        );
        this.camera.lookAt(0, 0, 0);

        // Ambient particles rotation
        this.ambientPts.rotation.y += dt * 0.003;

        if (this.bloomPass) {
            this.bloomPass.strength = 1.0 + Math.sin(t * 0.1) * 0.3;
        }
    }

    render() { this.composer?.render(); }

    onResize(w, h) {
        if (!this.renderer || !this.camera) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer?.setSize(w, h);
        this.bloomPass?.setSize(w, h);
    }

    _onMouseMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    dispose() {
        window.removeEventListener('mousemove', this._onMouseMove);
        if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
        this.scene?.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
            }
        });
        this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
