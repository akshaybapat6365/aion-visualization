/**
 * ThreeMirrorViz.js — Chapter 9: "The Ambivalence of the Fish Symbol"
 *
 * Jung: "Christ has a number of symbols in common with the devil.
 * Leviathan and Behemoth fight at the end of time. The same symbol
 * carries opposite meanings simultaneously."
 *
 * Visual: A serpentine Leviathan (sea monster, dark) and massive
 * Behemoth (land beast, earthy red) circle and fight each other.
 * Leviathan periodically splits into male/female forms. Two intertwined
 * serpents (caduceus) rise from the center. A mirror plane bisects the
 * scene — same creature, one bright, one dark.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const LEVIATHAN_DARK = new THREE.Color('#0a1a3a');
const LEVIATHAN_GLOW = new THREE.Color('#2a4a7a');
const BEHEMOTH_RED = new THREE.Color('#8b2500');
const BEHEMOTH_EARTH = new THREE.Color('#5a3a1a');
const CADUCEUS_GOLD = new THREE.Color('#d4af37');
const CADUCEUS_SILVER = new THREE.Color('#c0c0c0');
const MIRROR_CYAN = new THREE.Color('#22d3ee');
const VOID = 0x030310;

export default class ThreeMirrorViz extends BaseViz {
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
        this.camera.position.set(0, 3, 14);

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this._onMouseMove = this._onMouseMove.bind(this);
        window.addEventListener('mousemove', this._onMouseMove);

        this._createLeviathan();
        this._createBehemoth();
        this._createCaduceus();
        this._createMirrorPlane();
        this._createAuraParticles();
        this._createLights();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.2, 0.6, 0.4
        );
        this.composer.addPass(this.bloomPass);
    }

    /* ═══ 1. Leviathan — sea serpent ═══ */
    _createLeviathan() {
        this.leviathanGroup = new THREE.Group();

        // Main body — elongated torus knot (serpentine)
        const bodyGeo = new THREE.TorusKnotGeometry(1.8, 0.25, 128, 16, 3, 2);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: LEVIATHAN_DARK, emissive: LEVIATHAN_GLOW, emissiveIntensity: 0.3,
            metalness: 0.6, roughness: 0.3, transparent: true, opacity: 0.7,
        });
        this.leviathanBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.leviathanGroup.add(this.leviathanBody);

        // Head — angular cone
        const headGeo = new THREE.ConeGeometry(0.3, 0.8, 6);
        const headMat = new THREE.MeshStandardMaterial({
            color: LEVIATHAN_GLOW, emissive: LEVIATHAN_GLOW, emissiveIntensity: 0.5,
        });
        this.leviathanHead = new THREE.Mesh(headGeo, headMat);
        this.leviathanHead.position.set(1.8, 0, 0);
        this.leviathanHead.rotation.z = -Math.PI / 2;
        this.leviathanGroup.add(this.leviathanHead);

        // Male/Female split — secondary body that appears/disappears
        const splitGeo = new THREE.TorusKnotGeometry(1.5, 0.18, 96, 12, 3, 2);
        const splitMat = new THREE.MeshStandardMaterial({
            color: '#1a3a5a', emissive: '#3a6a9a', emissiveIntensity: 0.3,
            metalness: 0.5, roughness: 0.4, transparent: true, opacity: 0,
        });
        this.leviathanSplit = new THREE.Mesh(splitGeo, splitMat);
        this.leviathanGroup.add(this.leviathanSplit);

        this.leviathanGroup.position.set(-2, 1, 0);
        this.scene.add(this.leviathanGroup);
    }

    /* ═══ 2. Behemoth — land beast ═══ */
    _createBehemoth() {
        this.behemothGroup = new THREE.Group();

        // Massive body — rough sphere scaled wide
        const bodyGeo = new THREE.SphereGeometry(1.2, 12, 10);
        bodyGeo.scale(1.5, 0.8, 1);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: BEHEMOTH_RED, emissive: BEHEMOTH_EARTH, emissiveIntensity: 0.3,
            metalness: 0.3, roughness: 0.8, transparent: true, opacity: 0.7,
        });
        this.behemothBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.behemothGroup.add(this.behemothBody);

        // Horns
        for (let side = -1; side <= 1; side += 2) {
            const hornGeo = new THREE.ConeGeometry(0.08, 0.6, 4);
            const horn = new THREE.Mesh(hornGeo, new THREE.MeshStandardMaterial({
                color: BEHEMOTH_EARTH, emissive: BEHEMOTH_RED, emissiveIntensity: 0.3,
            }));
            horn.position.set(side * 0.6, 0.8, 0.5);
            horn.rotation.z = side * 0.3;
            this.behemothGroup.add(horn);
        }

        // Legs — four stumpy cylinders
        for (let x = -1; x <= 1; x += 2) {
            for (let z = -1; z <= 1; z += 2) {
                const legGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.6, 6);
                const leg = new THREE.Mesh(legGeo, bodyMat.clone());
                leg.position.set(x * 0.8, -0.9, z * 0.5);
                this.behemothGroup.add(leg);
            }
        }

        // Eyes — glowing red
        for (let side = -1; side <= 1; side += 2) {
            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const eye = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({ color: 0xff2200 }));
            eye.position.set(side * 0.3, 0.3, 1);
            this.behemothGroup.add(eye);
        }

        this.behemothGroup.position.set(2, -1, 0);
        this.scene.add(this.behemothGroup);
    }

    /* ═══ 3. Caduceus — two intertwined serpents ═══ */
    _createCaduceus() {
        this.caduceusGroup = new THREE.Group();

        // Two helical serpents
        const createHelix = (color, phase) => {
            const points = [];
            for (let i = 0; i <= 100; i++) {
                const t = i / 100;
                const y = t * 6 - 3;
                const angle = t * Math.PI * 4 + phase;
                const r = 0.3 + Math.sin(t * Math.PI) * 0.2;
                points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
            }
            const curve = new THREE.CatmullRomCurve3(points);
            const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.04, 8, false);
            const tubeMat = new THREE.MeshStandardMaterial({
                color, emissive: color, emissiveIntensity: 0.4,
                metalness: 0.7, roughness: 0.2, transparent: true, opacity: 0.6,
            });
            return new THREE.Mesh(tubeGeo, tubeMat);
        };

        this.caduceusGroup.add(createHelix(CADUCEUS_GOLD, 0));
        this.caduceusGroup.add(createHelix(CADUCEUS_SILVER, Math.PI));

        // Central staff
        const staffGeo = new THREE.CylinderGeometry(0.02, 0.02, 6, 6);
        const staffMat = new THREE.MeshBasicMaterial({
            color: 0x888888, transparent: true, opacity: 0.2,
        });
        this.caduceusGroup.add(new THREE.Mesh(staffGeo, staffMat));

        this.scene.add(this.caduceusGroup);
    }

    /* ═══ 4. Mirror Plane ═══ */
    _createMirrorPlane() {
        const planeGeo = new THREE.PlaneGeometry(20, 14);
        const planeMat = new THREE.MeshBasicMaterial({
            color: MIRROR_CYAN, transparent: true, opacity: 0.02,
            side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        });
        this.mirrorPlane = new THREE.Mesh(planeGeo, planeMat);
        this.mirrorPlane.rotation.y = Math.PI / 2; // Vertical, bisecting left/right
        this.scene.add(this.mirrorPlane);

        // Mirror edge line
        const edgePoints = [
            new THREE.Vector3(0, -7, -10),
            new THREE.Vector3(0, -7, 10),
            new THREE.Vector3(0, 7, 10),
            new THREE.Vector3(0, 7, -10),
            new THREE.Vector3(0, -7, -10),
        ];
        const edgeGeo = new THREE.BufferGeometry().setFromPoints(edgePoints);
        const edgeMat = new THREE.LineBasicMaterial({
            color: MIRROR_CYAN, transparent: true, opacity: 0.08,
        });
        this.scene.add(new THREE.Line(edgeGeo, edgeMat));
    }

    _createAuraParticles() {
        const count = 800;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 2 + Math.random() * 15;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            // Left = dark Leviathan colors, Right = red Behemoth colors
            if (positions[i * 3] < 0) {
                colors[i * 3] = LEVIATHAN_GLOW.r;
                colors[i * 3 + 1] = LEVIATHAN_GLOW.g;
                colors[i * 3 + 2] = LEVIATHAN_GLOW.b;
            } else {
                colors[i * 3] = BEHEMOTH_RED.r * 0.5;
                colors[i * 3 + 1] = BEHEMOTH_RED.g * 0.5;
                colors[i * 3 + 2] = BEHEMOTH_RED.b * 0.5;
            }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.auraPts = new THREE.Points(geo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.06, transparent: true, opacity: 0.3,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.auraPts);
    }

    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x080810, 0.3));
        const levLight = new THREE.PointLight(0x2a4a7a, 0.8, 15);
        levLight.position.set(-4, 2, 3);
        this.scene.add(levLight);
        const behLight = new THREE.PointLight(0x8b2500, 0.6, 15);
        behLight.position.set(4, -1, 3);
        this.scene.add(behLight);
        const cadLight = new THREE.PointLight(0xd4af37, 0.5, 12);
        cadLight.position.set(0, 3, 2);
        this.scene.add(cadLight);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.03);

        // ─── Leviathan and Behemoth circling/fighting ───
        const fightAngle = t * 0.06;
        const fightRadius = 3 + Math.sin(t * 0.2) * 0.5; // Pulsing close/far
        this.leviathanGroup.position.set(
            Math.cos(fightAngle) * fightRadius,
            Math.sin(t * 0.15) * 0.5,
            Math.sin(fightAngle) * fightRadius
        );
        this.leviathanGroup.rotation.y = fightAngle + Math.PI;
        this.leviathanBody.rotation.x = t * 0.1;

        this.behemothGroup.position.set(
            Math.cos(fightAngle + Math.PI) * fightRadius,
            Math.sin(t * 0.12) * 0.3 - 0.5,
            Math.sin(fightAngle + Math.PI) * fightRadius
        );
        this.behemothGroup.rotation.y = fightAngle;

        // Behemoth charges — periodic lunge
        const lungePhase = Math.sin(t * 0.3);
        if (lungePhase > 0.8) {
            const lunge = (lungePhase - 0.8) * 5;
            this.behemothGroup.position.x += Math.cos(fightAngle) * lunge * 0.5;
            this.behemothGroup.position.z += Math.sin(fightAngle) * lunge * 0.5;
        }

        // ─── Male/Female split — appears every ~20s for 5s ───
        const splitCycle = t % 20;
        const splitVisible = splitCycle > 15;
        this.leviathanSplit.material.opacity = splitVisible ?
            Math.sin((splitCycle - 15) * Math.PI / 5) * 0.4 : 0;
        this.leviathanSplit.rotation.y = t * 0.15 + 1;
        this.leviathanSplit.position.set(
            Math.sin(t * 0.2) * 0.8,
            Math.cos(t * 0.3) * 0.5,
            0
        );

        // ─── Caduceus slow rise/rotate ───
        this.caduceusGroup.rotation.y = t * 0.05;
        this.caduceusGroup.position.y = Math.sin(t * 0.08) * 0.3;

        // ─── Mirror plane shimmer ───
        this.mirrorPlane.material.opacity = 0.015 + Math.sin(t * 0.2) * 0.01;

        // ─── Camera ───
        const camAngle = t * 0.02 + this.mouseSmooth.x * 0.3;
        const camH = 2 + this.mouseSmooth.y * 3 + Math.sin(t * 0.04) * 1;
        this.camera.position.set(
            Math.sin(camAngle) * 14,
            camH,
            Math.cos(camAngle) * 14
        );
        this.camera.lookAt(0, 0, 0);

        this.auraPts.rotation.y += dt * 0.002;

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
