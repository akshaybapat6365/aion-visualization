/**
 * ThreeUnusViz.js — Chapter 12: "Background to the Psychology of Christian Alchemical Symbolism"
 *
 * Jung: Alchemy was born from Gnosticism. When symbols lose their
 * numinosity — their connection to the unconscious — they become
 * empty husks. The fish swims from historical Christ to psychological Self.
 *
 * Visual: "Mater Alchimia" — a genealogical golden stream flows from
 * Gnostic sources (left) into alchemical vessels (right). The stream
 * fractures into two rivers: one toward faith (church), one toward
 * knowledge (laboratory). A serpent sheds its skin (renewal of symbols).
 * Mandala shapes wither when disconnected from their source. A luminous
 * fish bridges past and present.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const GNOSIS_GOLD = new THREE.Color('#ffd700');
const FAITH_BLUE = new THREE.Color('#4a90d9');
const KNOWLEDGE_GREEN = new THREE.Color('#2ecc71');
const ROOT_IVORY = new THREE.Color('#f4f0e8');
const SNAKE_OLD = new THREE.Color('#4a4a3a');
const SNAKE_NEW = new THREE.Color('#ffd700');
const WITHER_GREY = new THREE.Color('#3a3a3a');
const FISH_CYAN = new THREE.Color('#22d3ee');
const ALCHEMY_RED = new THREE.Color('#c0392b');
const VOID = 0x050510;

const STREAM_PARTICLES = 300;
const MANDALA_COUNT = 6;

export default class ThreeUnusViz extends BaseViz {
    constructor(container, opts = {}) {
        super(container, Object.assign({ contextType: 'webgl' }, opts));
        this.panelState = { activePanelId: 'background', progress: 0 };
        this.backgroundFocus = 1;
        this.rootsFocus = 0;
        this.bridgeFocus = 0;
        this.reducedMotion = false;
    }

    setPanelState(state = {}) {
        this.panelState = Object.assign(this.panelState || {}, state);
    }

    setReducedMotion(enabled) {
        this.reducedMotion = Boolean(enabled);
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
        this.scene.fog = new THREE.FogExp2(VOID, 0.012);

        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 3, 14);

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this._onMouseMove = this._onMouseMove.bind(this);
        window.addEventListener('mousemove', this._onMouseMove);

        this._createGoldenStream();
        this._createFaithKnowledgeSplit();
        this._createRootLattice();
        this._createInterpretationLens();
        this._createSnakeSkin();
        this._createWitheringMandalas();
        this._createFishBridge();
        this._createAmbientParticles();
        this._createLights();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.1, 0.6, 0.4
        );
        this.composer.addPass(this.bloomPass);
    }

    /* ═══ 1. Golden Stream — Gnosis to Alchemy ═══ */
    _createGoldenStream() {
        const count = STREAM_PARTICLES;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        this.streamPhases = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const t = i / count;
            // Flow from left (-8) to center (0), then split
            positions[i * 3] = -8 + t * 8;
            positions[i * 3 + 1] = Math.sin(t * Math.PI * 4) * 0.3;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            this.streamPhases[i] = Math.random() * Math.PI * 2;

            colors[i * 3] = GNOSIS_GOLD.r;
            colors[i * 3 + 1] = GNOSIS_GOLD.g;
            colors[i * 3 + 2] = GNOSIS_GOLD.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.goldenStream = new THREE.Points(geo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.1, sizeAttenuation: true,
            transparent: true, opacity: 0.6,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.goldenStream);
    }

    /* ═══ 2. Faith / Knowledge Split ═══ */
    _createFaithKnowledgeSplit() {
        // Faith stream (upper-right, blue)
        this.faithParticles = this._createBranchStream(FAITH_BLUE, 1, 150);
        this.scene.add(this.faithParticles.points);

        // Church silhouette — simple triangle (steeple)
        const churchGeo = new THREE.ConeGeometry(0.6, 2, 4);
        const churchMat = new THREE.MeshStandardMaterial({
            color: FAITH_BLUE, emissive: FAITH_BLUE, emissiveIntensity: 0.3,
            transparent: true, opacity: 0.3,
        });
        this.church = new THREE.Mesh(churchGeo, churchMat);
        this.church.position.set(7, 3, 0);
        this.scene.add(this.church);

        // Knowledge stream (lower-right, green)
        this.knowledgeParticles = this._createBranchStream(KNOWLEDGE_GREEN, -1, 150);
        this.scene.add(this.knowledgeParticles.points);

        // Laboratory silhouette — flask shape (sphere + cylinder)
        const labGroup = new THREE.Group();
        const flaskBody = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 12, 12),
            new THREE.MeshStandardMaterial({
                color: KNOWLEDGE_GREEN, emissive: KNOWLEDGE_GREEN, emissiveIntensity: 0.3,
                transparent: true, opacity: 0.3,
            })
        );
        labGroup.add(flaskBody);
        const flaskNeck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8),
            flaskBody.material.clone()
        );
        flaskNeck.position.y = 0.6;
        labGroup.add(flaskNeck);
        labGroup.position.set(7, -3, 0);
        this.lab = labGroup;
        this.scene.add(labGroup);
    }

    _createRootLattice() {
        const positions = [];
        const colors = [];
        const addLine = (a, b, colorA, colorB = colorA) => {
            positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
            colors.push(colorA.r, colorA.g, colorA.b, colorB.r, colorB.g, colorB.b);
        };

        const source = new THREE.Vector3(-1.2, 0, -0.2);
        const faith = new THREE.Vector3(6.2, 2.8, -0.2);
        const knowledge = new THREE.Vector3(6.2, -2.8, -0.2);
        const mixed = new THREE.Color('#f4d46a');

        for (let branch = 0; branch < 9; branch++) {
            const p = branch / 8;
            const spine = new THREE.Vector3(
                THREE.MathUtils.lerp(source.x, 3.8, p),
                Math.sin(p * Math.PI * 1.2) * 0.34,
                -0.35 + Math.sin(p * 5.3) * 0.16
            );
            addLine(source, spine, GNOSIS_GOLD, mixed);
            const upper = spine.clone().lerp(faith, 0.34 + p * 0.32);
            const lower = spine.clone().lerp(knowledge, 0.34 + p * 0.32);
            upper.y += Math.sin(branch * 1.7) * 0.18;
            lower.y -= Math.cos(branch * 1.4) * 0.18;
            addLine(spine, upper, mixed, FAITH_BLUE);
            addLine(spine, lower, mixed, KNOWLEDGE_GREEN);

            for (let twig = -1; twig <= 1; twig += 2) {
                const tip = spine.clone().add(new THREE.Vector3(0.35 + p * 0.4, twig * (0.32 + p * 0.5), Math.sin(branch + twig) * 0.24));
                addLine(spine, tip, mixed);
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        this.rootLattice = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.28,
            blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.rootLattice);

        this.rootBeads = new THREE.Points(geo.clone(), new THREE.PointsMaterial({
            vertexColors: true,
            size: 0.075,
            transparent: true,
            opacity: 0.24,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }));
        this.scene.add(this.rootBeads);

        this.rootBraids = [];
        const braidSpecs = [
            { y: 0.58, z: 0.26, color: FAITH_BLUE, target: faith },
            { y: 0, z: 0.1, color: GNOSIS_GOLD, target: new THREE.Vector3(6.4, 0, 0.1) },
            { y: -0.58, z: 0.26, color: KNOWLEDGE_GREEN, target: knowledge },
        ];
        braidSpecs.forEach((spec, index) => {
            const curve = new THREE.CatmullRomCurve3([
                source.clone().add(new THREE.Vector3(0.02, spec.y * 0.15, spec.z)),
                new THREE.Vector3(1.2, spec.y * 0.7, spec.z + 0.42),
                new THREE.Vector3(3.5, spec.y * 1.2, spec.z + 0.34),
                spec.target.clone().add(new THREE.Vector3(-0.14, spec.y * 0.2, spec.z)),
            ]);
            const tube = new THREE.TubeGeometry(curve, 92, index === 1 ? 0.016 : 0.014, 8, false);
            const material = new THREE.MeshBasicMaterial({
                color: spec.color,
                transparent: true,
                opacity: 0.08,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const braid = new THREE.Mesh(tube, material);
            this.scene.add(braid);
            this.rootBraids.push({ mesh: braid, material, phase: index * 0.9 });
        });

        this.sourceHalo = new THREE.Mesh(
            new THREE.TorusGeometry(0.62, 0.012, 8, 72),
            new THREE.MeshBasicMaterial({
                color: ROOT_IVORY,
                transparent: true,
                opacity: 0.18,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        this.sourceHalo.position.copy(source);
        this.sourceHalo.rotation.y = Math.PI / 2;
        this.scene.add(this.sourceHalo);

        this.sourceStone = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.36, 0),
            new THREE.MeshStandardMaterial({
                color: GNOSIS_GOLD,
                emissive: GNOSIS_GOLD,
                emissiveIntensity: 0.46,
                transparent: true,
                opacity: 0.48,
                metalness: 0.5,
                roughness: 0.2,
            })
        );
        this.sourceStone.position.copy(source);
        this.scene.add(this.sourceStone);
    }

    _createInterpretationLens() {
        this.lensGroup = new THREE.Group();
        this.lensGroup.position.set(1.2, 0, 1.1);
        this.lensRings = [];
        this.lensGlass = new THREE.Mesh(
            new THREE.CircleGeometry(1.48, 80),
            new THREE.MeshBasicMaterial({
                color: ROOT_IVORY,
                transparent: true,
                opacity: 0.08,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        this.lensGlass.rotation.y = Math.PI / 2;
        this.lensGroup.add(this.lensGlass);

        const spokePositions = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            spokePositions.push(
                0, 0, 0,
                0, Math.cos(angle) * 1.18, Math.sin(angle) * 1.18
            );
        }
        const spokeGeo = new THREE.BufferGeometry();
        spokeGeo.setAttribute('position', new THREE.Float32BufferAttribute(spokePositions, 3));
        this.lensSpokes = new THREE.LineSegments(spokeGeo, new THREE.LineBasicMaterial({
            color: ROOT_IVORY,
            transparent: true,
            opacity: 0.13,
            blending: THREE.AdditiveBlending,
        }));
        this.lensGroup.add(this.lensSpokes);

        for (let i = 0; i < 4; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.72 + i * 0.28, 0.01, 8, 90),
                new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? GNOSIS_GOLD : FISH_CYAN,
                    transparent: true,
                    opacity: 0.16,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            );
            ring.rotation.x = i * 0.38;
            ring.rotation.y = Math.PI / 2 + i * 0.16;
            this.lensGroup.add(ring);
            this.lensRings.push(ring);
        }
        this.scene.add(this.lensGroup);
    }

    _createBranchStream(color, yDir, count) {
        const positions = new Float32Array(count * 3);
        const phases = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const t = i / count;
            positions[i * 3] = t * 7;
            positions[i * 3 + 1] = yDir * t * 3 + Math.sin(t * 6) * 0.2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
            phases[i] = Math.random() * Math.PI * 2;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const points = new THREE.Points(geo, new THREE.PointsMaterial({
            color, size: 0.07, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        return { points, phases, yDir, count };
    }

    /* ═══ 3. Snake Changing Skin ═══ */
    _createSnakeSkin() {
        this.snakeGroup = new THREE.Group();

        // Old skin — dull, cracking
        const oldGeo = new THREE.TorusKnotGeometry(1.0, 0.12, 64, 8, 2, 3);
        const oldMat = new THREE.MeshStandardMaterial({
            color: SNAKE_OLD, emissive: '#1a1a10', emissiveIntensity: 0.2,
            transparent: true, opacity: 0.4, roughness: 0.9,
        });
        this.oldSkin = new THREE.Mesh(oldGeo, oldMat);
        this.snakeGroup.add(this.oldSkin);

        // New skin — gleaming gold emerging
        const newGeo = new THREE.TorusKnotGeometry(0.9, 0.1, 64, 8, 2, 3);
        const newMat = new THREE.MeshStandardMaterial({
            color: SNAKE_NEW, emissive: SNAKE_NEW, emissiveIntensity: 0.5,
            transparent: true, opacity: 0.0, metalness: 0.7, roughness: 0.2,
        });
        this.newSkin = new THREE.Mesh(newGeo, newMat);
        this.snakeGroup.add(this.newSkin);

        this.snakeGroup.position.set(-4, -2, -2);
        this.snakeGroup.scale.setScalar(0.8);
        this.scene.add(this.snakeGroup);
    }

    /* ═══ 4. Withering Mandalas ═══ */
    _createWitheringMandalas() {
        this.mandalas = [];
        for (let i = 0; i < MANDALA_COUNT; i++) {
            const radius = 0.4 + Math.random() * 0.4;
            const geo = new THREE.TorusGeometry(radius, 0.02, 8, 32);
            const mat = new THREE.MeshBasicMaterial({
                color: GNOSIS_GOLD, transparent: true, opacity: 0.3,
                blending: THREE.AdditiveBlending,
            });
            const mesh = new THREE.Mesh(geo, mat);

            // Scatter around the scene
            mesh.position.set(
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 4 - 2
            );
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

            this.scene.add(mesh);
            this.mandalas.push({
                mesh, mat,
                connected: Math.random() > 0.5, // some start connected, some disconnected
                phase: Math.random() * Math.PI * 2,
                originalColor: GNOSIS_GOLD.clone(),
            });
        }
    }

    /* ═══ 5. Fish Bridge ═══ */
    _createFishBridge() {
        this.fishGroup = new THREE.Group();

        // Fish body
        const bodyGeo = new THREE.SphereGeometry(0.2, 12, 8);
        bodyGeo.scale(2.5, 0.7, 0.5);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: FISH_CYAN, emissive: FISH_CYAN, emissiveIntensity: 0.6,
            transparent: true, opacity: 0.7, metalness: 0.5,
        });
        this.fishBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.fishGroup.add(this.fishBody);

        // Fish tail
        const tailGeo = new THREE.ConeGeometry(0.12, 0.3, 4);
        const tail = new THREE.Mesh(tailGeo, bodyMat.clone());
        tail.position.x = -0.55;
        tail.rotation.z = Math.PI / 2;
        this.fishTail = tail;
        this.fishGroup.add(tail);

        // Luminous trail
        const trailCount = 60;
        const trailPos = new Float32Array(trailCount * 3);
        for (let i = 0; i < trailCount; i++) {
            trailPos[i * 3] = -i * 0.15;
            trailPos[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            trailPos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
        }
        const trailGeo = new THREE.BufferGeometry();
        trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
        this.fishTrail = new THREE.Points(trailGeo, new THREE.PointsMaterial({
            color: FISH_CYAN, size: 0.04, transparent: true, opacity: 0.4,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.fishGroup.add(this.fishTrail);

        this.fishGroup.position.set(-6, 0, 2);
        this.scene.add(this.fishGroup);

        this.bridgeArcGroup = new THREE.Group();
        this.bridgeArcs = [];
        [
            { y: 0.48, z: 0.12, color: FISH_CYAN },
            { y: 0, z: 0.38, color: GNOSIS_GOLD },
            { y: -0.48, z: 0.12, color: ROOT_IVORY },
        ].forEach((spec, index) => {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-5.2, spec.y, spec.z),
                new THREE.Vector3(-1.8, spec.y * 1.6, spec.z + 0.8),
                new THREE.Vector3(1.9, -spec.y * 0.5, spec.z + 0.86),
                new THREE.Vector3(5.8, -spec.y * 0.2, spec.z),
            ]);
            const tube = new THREE.TubeGeometry(curve, 96, index === 1 ? 0.018 : 0.014, 8, false);
            const material = new THREE.MeshBasicMaterial({
                color: spec.color,
                transparent: true,
                opacity: 0.06,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const arc = new THREE.Mesh(tube, material);
            this.bridgeArcGroup.add(arc);
            this.bridgeArcs.push({ mesh: arc, material, phase: index * 0.7 });
        });
        this.bridgeArcGroup.position.set(0.8, 0.1, 0.7);
        this.scene.add(this.bridgeArcGroup);
    }

    _createAmbientParticles() {
        const count = 500;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 5 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.ambientPts = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x2a2a3a, size: 0.04, transparent: true, opacity: 0.2,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.ambientPts);
    }

    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));
        const goldLight = new THREE.PointLight(0xffd700, 0.8, 20);
        goldLight.position.set(-5, 2, 5);
        this.scene.add(goldLight);
        const blueLight = new THREE.PointLight(0x4a90d9, 0.4, 20);
        blueLight.position.set(5, 4, 3);
        this.scene.add(blueLight);
        const greenLight = new THREE.PointLight(0x2ecc71, 0.4, 20);
        greenLight.position.set(5, -4, 3);
        this.scene.add(greenLight);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        const panelId = this.panelState?.activePanelId || 'background';
        const dampRate = this.reducedMotion ? 9 : 3.25;
        const motionScale = this.reducedMotion ? 0.12 : 1;
        const isMobile = this.width < 680;
        this.backgroundFocus = THREE.MathUtils.damp(this.backgroundFocus, panelId === 'background' ? 1 : 0.2, dampRate, dt);
        this.rootsFocus = THREE.MathUtils.damp(this.rootsFocus, panelId === 'roots' ? 1 : 0.18, dampRate, dt);
        this.bridgeFocus = THREE.MathUtils.damp(this.bridgeFocus, panelId === 'bridge' ? 1 : 0.16, dampRate, dt);
        this.mouseSmooth.lerp(this.mouse, 0.03);

        // ─── Golden stream flow ───
        const streamPos = this.goldenStream.geometry.attributes.position.array;
        const streamSpeed = (0.18 + this.backgroundFocus * 0.28 + this.rootsFocus * 0.38) * motionScale;
        for (let i = 0; i < STREAM_PARTICLES; i++) {
            streamPos[i * 3] += dt * streamSpeed;
            if (streamPos[i * 3] > 0) streamPos[i * 3] = -8;
            streamPos[i * 3 + 1] = Math.sin(t * 0.5 * motionScale + this.streamPhases[i]) * (0.18 + this.rootsFocus * 0.18);
        }
        this.goldenStream.geometry.attributes.position.needsUpdate = true;
        this.goldenStream.material.opacity = 0.22 + this.backgroundFocus * 0.16 + this.rootsFocus * 0.32;

        // ─── Branch streams flow ───
        this._updateBranchStream(this.faithParticles, dt, t, motionScale);
        this._updateBranchStream(this.knowledgeParticles, dt, t, motionScale);
        this.faithParticles.points.material.opacity = 0.14 + this.rootsFocus * 0.42 + this.bridgeFocus * 0.08;
        this.knowledgeParticles.points.material.opacity = 0.14 + this.rootsFocus * 0.42 + this.bridgeFocus * 0.08;
        this.church.material.opacity = 0.14 + this.rootsFocus * 0.28;
        this.church.material.emissiveIntensity = 0.16 + this.rootsFocus * 0.38;
        this.lab.traverse((obj) => {
            if (obj.material) {
                obj.material.opacity = 0.14 + this.rootsFocus * 0.28;
                if (obj.material.emissiveIntensity !== undefined) obj.material.emissiveIntensity = 0.16 + this.rootsFocus * 0.38;
            }
        });
        this.rootLattice.material.opacity = 0.08 + this.rootsFocus * 0.55 + this.bridgeFocus * 0.12;
        this.rootLattice.rotation.y = Math.sin(t * 0.08 * motionScale) * 0.08;
        this.rootLattice.scale.setScalar((isMobile ? 0.86 : 1) + this.rootsFocus * 0.06);
        this.rootBeads.material.opacity = 0.06 + this.rootsFocus * 0.44 + this.bridgeFocus * 0.14;
        this.rootBeads.rotation.copy(this.rootLattice.rotation);
        this.rootBeads.scale.copy(this.rootLattice.scale);
        this.rootBraids?.forEach((braid, index) => {
            braid.material.opacity = 0.05 + this.rootsFocus * (0.34 + index * 0.06) + this.bridgeFocus * 0.08;
            braid.mesh.scale.setScalar((isMobile ? 0.86 : 1) + this.rootsFocus * 0.07);
            braid.mesh.rotation.y = Math.sin(t * 0.1 * motionScale + braid.phase) * 0.045;
        });
        if (this.sourceHalo) {
            this.sourceHalo.rotation.z = t * 0.08 * motionScale;
            this.sourceHalo.scale.setScalar(0.82 + this.rootsFocus * 0.36 + this.backgroundFocus * 0.1);
            this.sourceHalo.material.opacity = 0.08 + this.rootsFocus * 0.32 + this.backgroundFocus * 0.14;
        }
        this.sourceStone.rotation.y = t * 0.14 * motionScale;
        this.sourceStone.scale.setScalar(0.76 + this.rootsFocus * 0.3 + this.backgroundFocus * 0.12);
        this.sourceStone.material.opacity = 0.26 + this.rootsFocus * 0.32 + this.backgroundFocus * 0.18;
        this.sourceStone.material.emissiveIntensity = 0.28 + this.rootsFocus * 0.52;

        this.lensGroup.position.x = THREE.MathUtils.damp(this.lensGroup.position.x, isMobile ? 3.2 : 2.2, 4, dt);
        this.lensGroup.scale.setScalar((isMobile ? 0.68 : 0.86) + this.backgroundFocus * 0.24);
        this.lensGroup.rotation.y = t * 0.06 * motionScale;
        this._setGroupOpacity(this.lensGroup, 0.08 + this.backgroundFocus * 0.8 + this.bridgeFocus * 0.2);
        this.lensRings.forEach((ring, index) => {
            ring.rotation.z = t * (0.045 + index * 0.016) * motionScale;
        });
        if (this.lensSpokes) {
            this.lensSpokes.rotation.x = t * 0.025 * motionScale;
        }

        // ─── Snake skin shedding cycle (every 20s) ───
        const shedCycle = (t * 0.05 * motionScale) % 1;
        this.oldSkin.material.opacity = (0.13 + this.backgroundFocus * 0.24) * (1 - shedCycle * 0.7);
        this.newSkin.material.opacity = (0.08 + this.backgroundFocus * 0.46 + this.bridgeFocus * 0.08) * shedCycle;
        this.oldSkin.scale.setScalar(1 + shedCycle * 0.15);
        this.snakeGroup.position.x = THREE.MathUtils.damp(this.snakeGroup.position.x, isMobile ? 2.5 : -3.4, 4, dt);
        this.snakeGroup.rotation.y = t * 0.1 * motionScale;
        this.snakeGroup.rotation.x = t * 0.05 * motionScale;

        // ─── Withering mandalas ───
        for (const m of this.mandalas) {
            // Toggle connectedness every ~15 seconds
            const connected = Math.sin(t * 0.07 * motionScale + m.phase) > 0;
            if (connected) {
                m.mat.color.lerp(m.originalColor, dt * 2);
                m.mat.opacity = Math.min(0.12 + this.backgroundFocus * 0.22, m.mat.opacity + dt * 0.1);
            } else {
                m.mat.color.lerp(WITHER_GREY, dt * 0.5);
                m.mat.opacity = Math.max(0.05, m.mat.opacity - dt * 0.05);
            }
            m.mesh.rotation.z += dt * 0.05 * motionScale;
        }

        // ─── Fish bridge — swimming from left to right ───
        const fishX = -5.8 + ((t * 0.22 * motionScale * (0.6 + this.bridgeFocus)) % 13.8);
        const swimX = fishX > 8 ? -5.8 : fishX;
        const bridgeX = (isMobile ? 3.1 : 3.4) + Math.sin(t * 0.35 * motionScale) * 0.7;
        this.fishGroup.position.x = THREE.MathUtils.lerp(swimX, bridgeX, this.bridgeFocus);
        this.fishGroup.position.y = Math.sin(t * 0.5 * motionScale) * 0.24 + this.bridgeFocus * (isMobile ? 0.65 : 0.35);
        this.fishGroup.position.z = 1.6 + this.bridgeFocus * 0.6;
        this.fishGroup.scale.setScalar((isMobile ? 0.82 : 1) + this.bridgeFocus * 0.55);
        this.fishBody.material.opacity = 0.28 + this.bridgeFocus * 0.48;
        this.fishBody.material.emissiveIntensity = 0.28 + this.bridgeFocus * 0.62 + Math.sin(t * 0.8 * motionScale) * 0.16;
        this.fishTail.material.opacity = 0.2 + this.bridgeFocus * 0.46;
        this.fishTail.material.emissiveIntensity = 0.22 + this.bridgeFocus * 0.48;
        this.fishTrail.material.opacity = 0.12 + this.bridgeFocus * 0.42;
        if (this.bridgeArcGroup) {
            this.bridgeArcGroup.rotation.y = Math.sin(t * 0.07 * motionScale) * 0.08;
            this.bridgeArcGroup.scale.setScalar((isMobile ? 0.82 : 1) + this.bridgeFocus * 0.08);
            this.bridgeArcs?.forEach((arc, index) => {
                arc.material.opacity = 0.04 + this.bridgeFocus * (0.26 + index * 0.035) + this.rootsFocus * 0.05;
                arc.mesh.rotation.z = Math.sin(t * 0.12 * motionScale + arc.phase) * 0.028;
            });
        }

        // ─── Camera ───
        const camAngle = t * 0.012 * motionScale + this.mouseSmooth.x * 0.22;
        const radius = 13.2 - this.rootsFocus * 0.8 - this.bridgeFocus * 1.2;
        const targetCam = new THREE.Vector3(
            Math.sin(camAngle) * radius + this.rootsFocus * 1.2 + this.bridgeFocus * 1.9 + (isMobile ? 1.2 : 0.4),
            2.5 + this.mouseSmooth.y * 2.1 + this.rootsFocus * 0.2 - this.bridgeFocus * 0.6,
            Math.cos(camAngle) * radius
        );
        this.camera.position.lerp(targetCam, this.reducedMotion ? 1 : Math.min(1, dt * 1.8));
        this.camera.lookAt(
            this.rootsFocus * 2.2 + this.bridgeFocus * 2.6 + (isMobile ? 1.2 : 0.4),
            this.bridgeFocus * 0.35,
            0.2
        );

        this.ambientPts.rotation.y += dt * 0.002 * motionScale;
        this.ambientPts.material.opacity = 0.12 + this.backgroundFocus * 0.08 + this.bridgeFocus * 0.04;

        if (this.bloomPass) {
            this.bloomPass.strength = 0.92 + Math.sin(t * 0.08 * motionScale) * 0.16 + this.rootsFocus * 0.18 + this.bridgeFocus * 0.2;
        }
    }

    _updateBranchStream(stream, dt, t, motionScale = 1) {
        const pos = stream.points.geometry.attributes.position.array;
        for (let i = 0; i < stream.count; i++) {
            pos[i * 3] += dt * 0.35 * motionScale;
            if (pos[i * 3] > 7) pos[i * 3] = 0;
            pos[i * 3 + 1] = stream.yDir * (pos[i * 3] / 7) * 3 + Math.sin(t * 0.3 * motionScale + stream.phases[i]) * 0.2;
        }
        stream.points.geometry.attributes.position.needsUpdate = true;
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

    _setGroupOpacity(group, opacity) {
        group?.traverse((obj) => {
            const materials = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
            materials.forEach((material) => {
                if (material.opacity === undefined) return;
                if (material.userData.baseOpacity === undefined) material.userData.baseOpacity = material.opacity;
                material.transparent = true;
                material.opacity = material.userData.baseOpacity * opacity;
            });
        });
    }

    dispose() {
        window.removeEventListener('mousemove', this._onMouseMove);
        this.stop();
        this.resizeObserver?.disconnect();
        this.bloomPass?.dispose?.();
        this.composer?.dispose?.();
        this.scene?.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
            }
        });
        if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
        this.bloomPass = null; this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
