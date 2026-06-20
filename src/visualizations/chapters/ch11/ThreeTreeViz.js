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

const ROOT_DARK = new THREE.Color('#4b1a74');
const TRUNK_BROWN = new THREE.Color('#9b6a3c');
const BRANCH_GOLD = new THREE.Color('#f0c85e');
const WATER_BLUE = new THREE.Color('#235d9a');
const WATER_GLOW = new THREE.Color('#66e5ff');
const LAPIS_GOLD = new THREE.Color('#ffd76a');
const FIGURE_WHITE = new THREE.Color('#f2eee3');
const MIRROR_CYAN = new THREE.Color('#53d8e8');
const COSMOS_PURPLE = new THREE.Color('#5f3fa8');
const VOID = 0x030308;

const WATER_PARTICLES = 320;
const THOUSAND_NAMES = 72;
const OPUS_STAGES = [
    { color: '#050506', y: 1.35, x: 0, scale: 1.08 },
    { color: '#e8e8f0', y: 0, x: 1.35, scale: 0.86 },
    { color: '#ffd76a', y: -1.35, x: 0, scale: 0.96 },
    { color: '#c0392b', y: 0, x: -1.35, scale: 1.02 },
];

export default class ThreeTreeViz extends BaseViz {
    constructor(container, opts = {}) {
        super(container, Object.assign({ contextType: 'webgl' }, opts));
        this.panelState = { activePanelId: 'mercurius', progress: 0 };
        this.mercuriusFocus = 1;
        this.opusFocus = 0;
        this.lapisFocus = 0;
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
        this.renderer.toneMappingExposure = 1.12;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(VOID, 0.012);

        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 2.2, 13.2);

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this._onMouseMove = this._onMouseMove.bind(this);
        window.addEventListener('mousemove', this._onMouseMove);

        this._createPhilosophicalTree();
        this._createMercuriusMediator();
        this._createOpusWheel();
        this._createAquaDoctrinae();
        this._createMirrorSurface();
        this._createFigureReflection();
        this._createLapisMandala();
        this._createOpusTreeField();
        this._createCosmicSubstance();
        this._createLights();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.18, 0.72, 0.36
        );
        this.composer.addPass(this.bloomPass);
    }

    _createPhilosophicalTree() {
        this.treeGroup = new THREE.Group();
        this.treeMaterials = [];
        this.rootMeshes = [];
        this.branchMeshes = [];

        // Trunk — central vertical pillar (the opus)
        const trunkGeo = new THREE.CylinderGeometry(0.1, 0.15, 6, 8);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: TRUNK_BROWN, emissive: '#1a1008', emissiveIntensity: 0.2,
        });
        this.trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
        this.treeGroup.add(this.trunkMesh);
        this.treeMaterials.push(trunkMat);

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
            this.rootMeshes.push(root);
            this.treeMaterials.push(root.material);
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
            this.branchMeshes.push(branch);
            this.treeMaterials.push(branch.material);

            // Luminous tip — a "name"
            const tipGeo = new THREE.SphereGeometry(0.03, 6, 6);
            const tip = new THREE.Mesh(tipGeo, new THREE.MeshBasicMaterial({
                color: BRANCH_GOLD, transparent: true, opacity: 0.6,
            }));
            tip.position.copy(branch.position).add(new THREE.Vector3(0, -branchLen * 0.5, 0));
            this.treeGroup.add(tip);
            this.nameParticles.push(tip);
            this.treeMaterials.push(tip.material);
        }

        this.scene.add(this.treeGroup);
    }

    _createMercuriusMediator() {
        this.mercuriusGroup = new THREE.Group();
        this.mercuriusGroup.position.set(0, 0.15, 1.15);

        for (let strand = 0; strand < 2; strand++) {
            const phase = strand * Math.PI;
            const pts = [];
            for (let i = 0; i <= 92; i++) {
                const p = i / 92;
                const y = THREE.MathUtils.lerp(-3.1, 3.15, p);
                const angle = p * Math.PI * 6 + phase;
                pts.push(new THREE.Vector3(Math.cos(angle) * 0.62, y, Math.sin(angle) * 0.2));
            }
            const curve = new THREE.CatmullRomCurve3(pts);
            const tube = new THREE.Mesh(
                new THREE.TubeGeometry(curve, 120, 0.024, 8, false),
                new THREE.MeshBasicMaterial({
                    color: strand === 0 ? MIRROR_CYAN : LAPIS_GOLD,
                    transparent: true,
                    opacity: 0.72,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            );
            this.mercuriusGroup.add(tube);
        }

        const wingMat = new THREE.LineBasicMaterial({
            color: 0xe8e8f0,
            transparent: true,
            opacity: 0.34,
            blending: THREE.AdditiveBlending,
        });
        for (let side = -1; side <= 1; side += 2) {
            const pts = [];
            for (let i = 0; i <= 28; i++) {
                const p = i / 28;
                pts.push(new THREE.Vector3(side * (0.36 + p * 1.45), 1.15 + Math.sin(p * Math.PI) * 0.7, -0.08));
            }
            this.mercuriusGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wingMat.clone()));
        }

        this.mercuriusCore = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.32, 0),
            new THREE.MeshStandardMaterial({
                color: MIRROR_CYAN,
                emissive: MIRROR_CYAN,
                emissiveIntensity: 0.72,
                transparent: true,
                opacity: 0.68,
                metalness: 0.4,
                roughness: 0.28,
            })
        );
        this.mercuriusGroup.add(this.mercuriusCore);
        this.scene.add(this.mercuriusGroup);
    }

    _createOpusWheel() {
        this.opusWheel = new THREE.Group();
        this.opusWheel.position.set(2.75, -0.05, 1.2);
        this.opusNodes = [];
        this.opusArcs = [];

        const ringMat = new THREE.MeshBasicMaterial({
            color: LAPIS_GOLD,
            transparent: true,
            opacity: 0.26,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.014, 8, 120), ringMat);
        const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.01, 8, 96), ringMat.clone());
        this.opusWheel.add(outerRing, innerRing);
        this.opusArcs.push(outerRing, innerRing);

        OPUS_STAGES.forEach((stage, index) => {
            const node = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.16 * stage.scale, 0),
                new THREE.MeshStandardMaterial({
                    color: stage.color,
                    emissive: stage.color,
                    emissiveIntensity: index === 0 ? 0.15 : 0.45,
                    transparent: true,
                    opacity: 0.74,
                    metalness: 0.4,
                    roughness: 0.3,
                })
            );
            node.position.set(stage.x, stage.y, 0);
            this.opusWheel.add(node);
            this.opusNodes.push(node);

            const spoke = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(stage.x, stage.y, 0)]),
                new THREE.LineBasicMaterial({
                    color: index === 0 ? 0x443a46 : stage.color,
                    transparent: true,
                    opacity: 0.3,
                    blending: THREE.AdditiveBlending,
                })
            );
            this.opusWheel.add(spoke);
            this.opusArcs.push(spoke);
        });

        this.scene.add(this.opusWheel);
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
            color: WATER_GLOW, size: 0.072, transparent: true, opacity: 0.42,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.waterPts);
    }

    _createMirrorSurface() {
        const mirrorGeo = new THREE.PlaneGeometry(12, 8);
        const mirrorMat = new THREE.MeshBasicMaterial({
            color: MIRROR_CYAN, transparent: true, opacity: 0.028,
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

        this.figureGroup.position.x = 4.35;
        this.reflectionGroup.position.x = 4.35;
        this.scene.add(this.figureGroup);
        this.scene.add(this.reflectionGroup);
    }

    _createLapisMandala() {
        this.lapisMandala = new THREE.Group();
        this.lapisMandala.position.set(3.35, -1.95, 1.3);
        this.lapisMandalaParts = [];

        this.lapisStone = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.58, 0),
            new THREE.MeshStandardMaterial({
                color: LAPIS_GOLD,
                emissive: LAPIS_GOLD,
                emissiveIntensity: 0.35,
                metalness: 0.74,
                roughness: 0.22,
                transparent: true,
                opacity: 0.56,
            })
        );
        this.lapisMandala.add(this.lapisStone);
        this.lapisMandalaParts.push(this.lapisStone);

        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.92 + i * 0.26, 0.012, 8, 100),
                new THREE.MeshBasicMaterial({
                    color: i === 1 ? MIRROR_CYAN : LAPIS_GOLD,
                    transparent: true,
                    opacity: 0.16,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            );
            ring.rotation.x = i === 0 ? Math.PI / 2 : Math.PI * 0.5 + i * 0.42;
            ring.rotation.y = i * 0.58;
            this.lapisMandala.add(ring);
            this.lapisMandalaParts.push(ring);
        }

        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI * 0.5;
            const jewel = new THREE.Mesh(
                new THREE.SphereGeometry(0.07, 10, 8),
                new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? MIRROR_CYAN : LAPIS_GOLD,
                    transparent: true,
                    opacity: 0.46,
                    blending: THREE.AdditiveBlending,
                })
            );
            jewel.position.set(Math.cos(angle) * 1.28, Math.sin(angle) * 1.28, 0);
            this.lapisMandala.add(jewel);
            this.lapisMandalaParts.push(jewel);
        }

        this.scene.add(this.lapisMandala);
    }

    _createOpusTreeField() {
        this.opusTreeField = new THREE.Group();
        this.opusTreeField.position.set(1.85, 0, 0.62);
        this.opusFieldRings = [];
        this.opusFieldSeeds = [];
        this.opusFieldThreads = [];

        this.opusAxis = new THREE.Mesh(
            new THREE.CylinderGeometry(0.026, 0.026, 7.35, 12),
            new THREE.MeshBasicMaterial({
                color: 0xf4f0e8,
                transparent: true,
                opacity: 0.22,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        this.opusTreeField.add(this.opusAxis);

        const makeRing = (radius, y, color, opacity, scaleY = 0.42) => {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(radius, 0.012, 8, 140),
                new THREE.MeshBasicMaterial({
                    color,
                    transparent: true,
                    opacity,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            );
            ring.position.y = y;
            ring.scale.y = scaleY;
            this.opusTreeField.add(ring);
            this.opusFieldRings.push(ring);
            return ring;
        };

        makeRing(1.75, 2.2, LAPIS_GOLD, 0.16, 0.34);
        makeRing(2.18, 0, 0xf4f0e8, 0.11, 0.56);
        makeRing(1.72, -2.25, MIRROR_CYAN, 0.15, 0.36);

        const threadMaterials = [
            new THREE.MeshBasicMaterial({
                color: LAPIS_GOLD,
                transparent: true,
                opacity: 0.14,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
            new THREE.MeshBasicMaterial({
                color: MIRROR_CYAN,
                transparent: true,
                opacity: 0.13,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        ];

        for (let strand = 0; strand < 6; strand++) {
            const phase = strand * Math.PI / 3;
            const points = [];
            for (let index = 0; index <= 54; index++) {
                const progress = index / 54;
                const y = THREE.MathUtils.lerp(3.2, -3.25, progress);
                const radius = 0.42 + Math.sin(progress * Math.PI) * 1.18;
                const angle = phase + progress * Math.PI * 2.4;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * radius,
                    y,
                    Math.sin(angle) * radius * 0.18
                ));
            }
            const tube = new THREE.Mesh(
                new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 72, 0.01, 6, false),
                threadMaterials[strand % 2].clone()
            );
            this.opusTreeField.add(tube);
            this.opusFieldThreads.push(tube);
        }

        this.opusCompass = new THREE.Group();
        OPUS_STAGES.forEach((stage, index) => {
            const node = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.095 * stage.scale, 0),
                new THREE.MeshBasicMaterial({
                    color: stage.color,
                    transparent: true,
                    opacity: index === 0 ? 0.42 : 0.6,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            );
            node.position.set(stage.x * 0.82, stage.y * 0.82, 0.06);
            this.opusCompass.add(node);
        });
        this.opusTreeField.add(this.opusCompass);

        const seedGeometry = new THREE.SphereGeometry(0.115, 16, 12);
        [
            { y: 3.34, color: LAPIS_GOLD, focus: 'spirit' },
            { y: -3.34, color: MIRROR_CYAN, focus: 'matter' },
        ].forEach(({ y, color, focus }) => {
            const seed = new THREE.Mesh(
                seedGeometry,
                new THREE.MeshStandardMaterial({
                    color,
                    emissive: color,
                    emissiveIntensity: 0.55,
                    transparent: true,
                    opacity: 0.78,
                    metalness: 0.28,
                    roughness: 0.22,
                })
            );
            seed.position.y = y;
            seed.userData.focus = focus;
            this.opusTreeField.add(seed);
            this.opusFieldSeeds.push(seed);
        });

        this.opusMirrorPool = new THREE.Mesh(
            new THREE.CylinderGeometry(1.28, 1.42, 0.026, 96),
            new THREE.MeshBasicMaterial({
                color: MIRROR_CYAN,
                transparent: true,
                opacity: 0.14,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        this.opusMirrorPool.position.set(-1.35, -3.08, 0.05);
        this.opusMirrorPool.scale.z = 0.3;
        this.opusTreeField.add(this.opusMirrorPool);

        this.scene.add(this.opusTreeField);
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
            vertexColors: true, size: 0.045, transparent: true, opacity: 0.24,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.cosmicPts);
    }

    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));
        const rootLight = new THREE.PointLight(0x2a0845, 0.5, 15);
        rootLight.position.set(0, 5, 3);
        this.scene.add(rootLight);

        const branchLight = new THREE.PointLight(0xc8a820, 0.5, 15);
        branchLight.position.set(0, -4, 3);
        this.scene.add(branchLight);

        const waterLight = new THREE.PointLight(0x4a8aca, 0.3, 10);
        waterLight.position.set(4, -5, 2);
        this.scene.add(waterLight);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        const panelId = this.panelState?.activePanelId || 'mercurius';
        const dampRate = this.reducedMotion ? 9 : 3.2;
        const motionScale = this.reducedMotion ? 0.12 : 1;
        const isMobile = this.width < 680;
        this.mercuriusFocus = THREE.MathUtils.damp(this.mercuriusFocus, panelId === 'mercurius' ? 1 : 0.18, dampRate, dt);
        this.opusFocus = THREE.MathUtils.damp(this.opusFocus, panelId === 'opus-wheel' ? 1 : 0.16, dampRate, dt);
        this.lapisFocus = THREE.MathUtils.damp(this.lapisFocus, panelId === 'lapis' ? 1 : 0.16, dampRate, dt);
        this.mouseSmooth.lerp(this.mouse, 0.03);

        // Tree gentle sway
        this.treeGroup.position.x = THREE.MathUtils.damp(this.treeGroup.position.x, isMobile ? 3.75 : 1.95, 4, dt);
        this.treeGroup.position.y = THREE.MathUtils.damp(this.treeGroup.position.y, isMobile ? -0.32 : -0.08, 4, dt);
        this.treeGroup.rotation.z = Math.sin(t * 0.05 * motionScale) * 0.03;
        this.treeGroup.rotation.y = t * 0.005 * motionScale;
        this.treeGroup.scale.setScalar((isMobile ? 0.72 : 0.78) + this.mercuriusFocus * 0.07 + this.opusFocus * 0.05 + this.lapisFocus * 0.03);
        this.trunkMesh.material.emissiveIntensity = 0.12 + this.mercuriusFocus * 0.18 + this.opusFocus * 0.2;
        this.rootMeshes?.forEach((root, index) => {
            root.material.opacity = 0.16 + this.mercuriusFocus * 0.3 + Math.sin(t * 0.16 * motionScale + index) * 0.03;
            root.material.emissiveIntensity = 0.14 + this.mercuriusFocus * 0.26;
        });
        this.branchMeshes?.forEach((branch, index) => {
            branch.material.opacity = 0.12 + this.opusFocus * 0.34 + this.lapisFocus * 0.18 + Math.sin(t * 0.2 * motionScale + index) * 0.025;
            branch.material.emissiveIntensity = 0.14 + this.opusFocus * 0.34 + this.lapisFocus * 0.18;
        });

        this.mercuriusGroup.position.x = THREE.MathUtils.damp(this.mercuriusGroup.position.x, isMobile ? 3.85 : 1.95, 4, dt);
        this.mercuriusGroup.position.y = THREE.MathUtils.damp(this.mercuriusGroup.position.y, isMobile ? 0.42 : 0.08, 4, dt);
        this.mercuriusGroup.rotation.y = Math.sin(t * 0.12 * motionScale) * 0.35;
        this.mercuriusGroup.scale.setScalar((isMobile ? 0.62 : 0.78) + this.mercuriusFocus * (isMobile ? 0.18 : 0.26));
        this._setGroupOpacity(this.mercuriusGroup, 0.12 + this.mercuriusFocus * 0.8);
        this.mercuriusCore.rotation.y = t * 0.18 * motionScale;
        this.mercuriusCore.rotation.x = Math.sin(t * 0.12 * motionScale) * 0.4;
        this.mercuriusCore.material.emissiveIntensity = 0.35 + this.mercuriusFocus * 0.72;

        this.opusWheel.position.x = THREE.MathUtils.damp(this.opusWheel.position.x, isMobile ? 4.2 : 3.05, 4, dt);
        this.opusWheel.position.y = THREE.MathUtils.damp(this.opusWheel.position.y, isMobile ? 0.58 : -0.02, 4, dt);
        this.opusWheel.rotation.z = -t * 0.045 * motionScale;
        this.opusWheel.scale.setScalar((isMobile ? 0.66 : 0.9) + this.opusFocus * (isMobile ? 0.22 : 0.34));
        this._setGroupOpacity(this.opusWheel, 0.12 + this.opusFocus * 0.9);
        this.opusNodes?.forEach((node, index) => {
            const pulse = 0.5 + Math.sin(t * 1.2 * motionScale + index * 1.6) * 0.5;
            node.scale.setScalar(0.85 + this.opusFocus * 0.5 + pulse * 0.14 * this.opusFocus);
            node.material.emissiveIntensity = (index === 0 ? 0.12 : 0.34) + this.opusFocus * (0.4 + pulse * 0.28);
        });

        if (this.opusTreeField) {
            const fieldFocus = Math.max(this.mercuriusFocus * 0.86, this.opusFocus, this.lapisFocus * 0.94);
            this.opusTreeField.position.x = THREE.MathUtils.damp(this.opusTreeField.position.x, isMobile ? 3.9 : 1.95, 4, dt);
            this.opusTreeField.position.y = THREE.MathUtils.damp(this.opusTreeField.position.y, isMobile ? 0.02 : 0, 4, dt);
            this.opusTreeField.scale.setScalar((isMobile ? 0.56 : 0.78) + fieldFocus * (isMobile ? 0.1 : 0.14));
            this.opusTreeField.rotation.z = Math.sin(t * 0.06 * motionScale) * 0.035;
            this._setGroupOpacity(this.opusTreeField, (0.32 + fieldFocus * 0.54) * (isMobile ? 0.82 : 1));
        }
        this.opusFieldRings?.forEach((ring, index) => {
            ring.rotation.z += dt * (index % 2 === 0 ? 0.034 : -0.026) * motionScale;
            const pulse = 1 + Math.sin(t * 0.7 * motionScale + index) * 0.025;
            ring.scale.x = pulse;
        });
        this.opusFieldThreads?.forEach((thread, index) => {
            const material = thread.material;
            if (!material) return;
            material.opacity = 0.055 + this.mercuriusFocus * 0.06 + this.opusFocus * 0.15 + Math.sin(t * 0.42 * motionScale + index) * 0.02;
        });
        this.opusFieldSeeds?.forEach((seed, index) => {
            const targetFocus = seed.userData.focus === 'matter' ? this.lapisFocus : Math.max(this.mercuriusFocus, this.opusFocus * 0.6);
            const pulse = 0.5 + Math.sin(t * 1.1 * motionScale + index * 2.1) * 0.5;
            seed.scale.setScalar(0.88 + targetFocus * 0.55 + pulse * 0.1 * targetFocus);
            seed.material.emissiveIntensity = 0.45 + targetFocus * 0.65;
        });
        if (this.opusCompass) {
            this.opusCompass.rotation.z = t * 0.038 * motionScale;
            this.opusCompass.scale.setScalar(0.7 + this.opusFocus * 0.38);
        }
        if (this.opusMirrorPool?.material) {
            this.opusMirrorPool.material.opacity = 0.06 + this.lapisFocus * 0.22 + this.mercuriusFocus * 0.04;
            this.opusMirrorPool.scale.x = 1 + this.lapisFocus * 0.2;
        }
        if (this.opusAxis?.material) {
            this.opusAxis.material.opacity = 0.16 + this.mercuriusFocus * 0.2 + this.opusFocus * 0.08;
        }

        // Name particles twinkle
        for (const np of this.nameParticles) {
            np.material.opacity = 0.1 + this.opusFocus * 0.3 + this.lapisFocus * 0.22 + Math.sin(t * 0.5 * motionScale + np.position.x * 2) * 0.14;
        }

        // Water rising
        const waterPos = this.waterPts.geometry.attributes.position.array;
        const waterSpeed = (0.08 + this.mercuriusFocus * 0.14 + this.lapisFocus * 0.18) * motionScale;
        for (let i = 0; i < WATER_PARTICLES; i++) {
            waterPos[i * 3 + 1] += dt * waterSpeed;
            waterPos[i * 3] += Math.sin(t * 0.2 * motionScale + this.waterPhases[i]) * dt * 0.05;
            if (waterPos[i * 3 + 1] > 0) {
                waterPos[i * 3 + 1] = -6;
                waterPos[i * 3] = (Math.random() - 0.5) * 3;
            }
        }
        this.waterPts.geometry.attributes.position.needsUpdate = true;
        this.waterPts.material.opacity = 0.15 + this.mercuriusFocus * 0.16 + this.lapisFocus * 0.2;

        // Mirror shimmer
        this.mirror.material.opacity = 0.014 + this.lapisFocus * 0.046 + Math.sin(t * 0.15 * motionScale) * 0.006;

        // Lapis in reflection fading in
        const lapisProgress = Math.max(this.lapisFocus, Math.min(1, t / 60) * 0.25);
        this.reflectionLapis.material.opacity = lapisProgress * 0.6;
        this.reflectionLapis.rotation.y = t * 0.1 * motionScale;
        this.reflectionLapis.material.emissiveIntensity = 0.3 + lapisProgress * 0.4;
        this.reflectionGroup.scale.setScalar(0.95 + this.lapisFocus * 0.16);
        this.figureGroup.scale.setScalar(0.9 + this.lapisFocus * 0.12);

        this.lapisMandala.position.x = THREE.MathUtils.damp(this.lapisMandala.position.x, isMobile ? 4.45 : 3.75, 4, dt);
        this.lapisMandala.position.y = THREE.MathUtils.damp(this.lapisMandala.position.y, isMobile ? -1.1 : -1.92, 4, dt);
        this.lapisMandala.scale.setScalar((isMobile ? 0.5 : 0.78) + this.lapisFocus * (isMobile ? 0.3 : 0.5));
        this.lapisMandala.rotation.y = t * 0.04 * motionScale;
        this.lapisStone.rotation.y = t * 0.16 * motionScale;
        this.lapisStone.rotation.x = Math.sin(t * 0.1 * motionScale) * 0.35;
        this.lapisMandalaParts?.forEach((part, index) => {
            const material = part.material;
            if (!material) return;
            const base = part === this.lapisStone ? 0.22 : 0.08;
            material.opacity = base + this.lapisFocus * (part === this.lapisStone ? 0.56 : 0.38);
            if (material.emissiveIntensity !== undefined) {
                material.emissiveIntensity = 0.26 + this.lapisFocus * 0.76 + Math.sin(t * 1.4 * motionScale + index) * 0.08;
            }
        });

        // Cosmic particles slow rotation
        this.cosmicPts.rotation.y += dt * 0.002 * motionScale;
        this.cosmicPts.material.opacity = 0.1 + this.mercuriusFocus * 0.07 + this.lapisFocus * 0.16;

        // Camera
        const camAngle = t * 0.012 * motionScale + this.mouseSmooth.x * 0.22;
        const baseRadius = (isMobile ? 13.8 : 12.6) - this.opusFocus * 0.72 - this.lapisFocus * 1.05;
        const targetCam = new THREE.Vector3(
            Math.sin(camAngle) * baseRadius + this.opusFocus * 0.8 + this.lapisFocus * 1.35 + (isMobile ? 2.55 : 0.9),
            1.55 + this.mouseSmooth.y * 2 - this.opusFocus * 0.46 - this.lapisFocus * 1.45,
            Math.cos(camAngle) * baseRadius
        );
        this.camera.position.lerp(targetCam, this.reducedMotion ? 1 : Math.min(1, dt * 1.8));
        this.camera.lookAt(
            this.opusFocus * 1.5 + this.lapisFocus * 1.55 + (isMobile ? 0.98 : 0.48),
            -0.82 - this.opusFocus * 0.3 - this.lapisFocus * 0.96,
            0.5
        );

        if (this.bloomPass) this.bloomPass.strength = 0.76 + Math.sin(t * 0.1 * motionScale) * 0.12 + this.mercuriusFocus * 0.18 + this.lapisFocus * 0.2;
    }

    render() { this.composer?.render(); }
    onResize(w, h) {
        if (!this.renderer || !this.camera) return;
        this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h); this.composer?.setSize(w, h); this.bloomPass?.setSize(w, h);
    }
    _onMouseMove(e) { this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; }
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
        this.scene?.traverse(o => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
        if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
        this.bloomPass = null; this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
