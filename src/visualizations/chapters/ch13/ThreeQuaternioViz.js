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
import { createPleromaCrown, createQuaternioSeal, createReturnArc } from './gnosticScenePrimitives.js';

const QUAD_COLORS = [new THREE.Color('#e63946'), new THREE.Color('#457b9d'), new THREE.Color('#2a9d8f'), new THREE.Color('#ff9800')];
const AXIS_CLR = new THREE.Color('#ff9800');
const CENTER = new THREE.Color('#ffd700');
const PLEROMA = new THREE.Color('#ffe39c');
const SOPHIA = new THREE.Color('#ffad70');
const RUPTURE = new THREE.Color('#cc6d86');
const AION_BLUE = new THREE.Color('#53d8e8');

export default class ThreeQuaternioViz extends BaseViz {
    constructor(c, o = {}) {
        super(c, Object.assign({ contextType: 'webgl' }, o));
        this.panelState = { activePanelId: 'gnosis', progress: 0 };
        this.gnosisFocus = 1;
        this.quaternioFocus = 0;
        this.paradoxFocus = 0;
        this.reducedMotion = false;
    }

    setPanelState(state = {}) {
        this.panelState = Object.assign(this.panelState || {}, state);
    }

    setReducedMotion(enabled) {
        this.reducedMotion = Boolean(enabled);
    }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(devicePixelRatio, 2)); R.setSize(this.width, this.height); R.setClearColor(0x050505);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050505, 0.012);
        this.quaternioGroup = new THREE.Group();
        this.scene.add(this.quaternioGroup);
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
                this.quaternioGroup.add(m);
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
            this.quaternioGroup.add(ring);

            this.layers.push({ nodes, ring, r, speed: 0.01 * (layer % 2 === 0 ? 1 : -1) * (1 + layer * 0.3) });
        }

        // Four function axes (cross through center)
        this.axes = [];
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(Math.cos(a) * 12, Math.sin(a) * 12, 0)
            ]), new THREE.LineBasicMaterial({ color: QUAD_COLORS[i], transparent: true, opacity: 0.06 }));
            this.quaternioGroup.add(line);
            this.axes.push(line);
        }

        // Center integration point
        this.center = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 20), new THREE.MeshBasicMaterial({
            color: CENTER, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending,
        }));
        this.quaternioGroup.add(this.center);
        this.centerGlow = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12), new THREE.MeshBasicMaterial({
            color: CENTER, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending,
        }));
        this.quaternioGroup.add(this.centerGlow);

        createPleromaCrown(this, { pleroma: PLEROMA, aionBlue: AION_BLUE });
        this._createEmanationField();
        this._createSophiaFigure();
        createQuaternioSeal(this, { pleroma: PLEROMA, aionBlue: AION_BLUE, quadColors: QUAD_COLORS });
        this._createParadoxField();

        this.scene.add(new THREE.AmbientLight(0x0a0a10, 0.2));

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.3, 0.5, 0.3);
        this.composer.addPass(this.bloom);
    }

    _createEmanationField() {
        this.emanationGroup = new THREE.Group();
        this.emanationRings = [];
        for (let i = 0; i < 7; i++) {
            const radius = 1.4 + i * 0.72;
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(radius, 0.008, 8, 120),
                new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? 0xffd37a : 0x53d8e8,
                    transparent: true,
                    opacity: 0.08,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            );
            ring.rotation.x = Math.PI / 2 + i * 0.09;
            ring.rotation.y = i * 0.22;
            this.emanationGroup.add(ring);
            this.emanationRings.push(ring);
        }
        this.quaternioGroup.add(this.emanationGroup);
    }

    _createSophiaFigure() {
        this.sophiaGroup = new THREE.Group();
        this.sophiaBody = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.36, 0),
            new THREE.MeshBasicMaterial({
                color: SOPHIA,
                transparent: true,
                opacity: 0.62,
                blending: THREE.AdditiveBlending,
            })
        );
        this.sophiaGroup.add(this.sophiaBody);
        const trailPts = [];
        for (let i = 0; i < 32; i++) {
            trailPts.push(new THREE.Vector3(Math.sin(i * 0.5) * 0.18, 1.2 - i * 0.09, -0.1));
        }
        this.sophiaTrail = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(trailPts),
            new THREE.LineBasicMaterial({
                color: SOPHIA,
                transparent: true,
                opacity: 0.24,
                blending: THREE.AdditiveBlending,
            })
        );
        this.sophiaGroup.add(this.sophiaTrail);
        this.sophiaHalo = new THREE.Mesh(
            new THREE.TorusGeometry(0.76, 0.008, 8, 72),
            new THREE.MeshBasicMaterial({
                color: SOPHIA,
                transparent: true,
                opacity: 0.12,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        this.sophiaHalo.rotation.x = Math.PI / 2;
        this.sophiaGroup.add(this.sophiaHalo);
        this.sophiaGroup.position.set(0.8, 4.8, 0.8);
        this.quaternioGroup.add(this.sophiaGroup);
    }

    _createParadoxField() {
        this.paradoxGroup = new THREE.Group();
        this.paradoxShards = [];
        const shardColors = [RUPTURE, AION_BLUE, PLEROMA, 0x9b5cff];
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const shard = new THREE.Mesh(
                new THREE.TetrahedronGeometry(0.18 + (i % 3) * 0.05, 0),
                new THREE.MeshBasicMaterial({
                    color: shardColors[i % shardColors.length],
                    transparent: true,
                    opacity: 0.18,
                    blending: THREE.AdditiveBlending,
                })
            );
            shard.position.set(Math.cos(angle) * (1.2 + i * 0.12), Math.sin(angle) * (0.7 + i * 0.08), Math.sin(i) * 0.6);
            this.paradoxGroup.add(shard);
            this.paradoxShards.push({ shard, angle });
        }

        const rupture = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-3.2, -2.8, 0.1),
                new THREE.Vector3(-1.4, -0.4, 0.3),
                new THREE.Vector3(0.35, -0.9, -0.2),
                new THREE.Vector3(1.8, 1.2, 0.2),
                new THREE.Vector3(3.2, 2.8, -0.1),
            ]),
            new THREE.LineBasicMaterial({
                color: RUPTURE,
                transparent: true,
                opacity: 0.18,
                blending: THREE.AdditiveBlending,
            })
        );
        this.paradoxRupture = rupture;
        this.paradoxGroup.add(rupture);
        createReturnArc(this, { pleroma: PLEROMA, aionBlue: AION_BLUE });
        this.quaternioGroup.add(this.paradoxGroup);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time || 0;
        const panelId = this.panelState?.activePanelId || 'gnosis';
        const dampRate = this.reducedMotion ? 9 : 3.4;
        const motionScale = this.reducedMotion ? 0.12 : 1;
        const isMobile = this.width < 680;
        this.gnosisFocus = THREE.MathUtils.damp(this.gnosisFocus, panelId === 'gnosis' ? 1 : 0.18, dampRate, dt);
        this.quaternioFocus = THREE.MathUtils.damp(this.quaternioFocus, panelId === 'quaternio' ? 1 : 0.18, dampRate, dt);
        this.paradoxFocus = THREE.MathUtils.damp(this.paradoxFocus, panelId === 'paradox' ? 1 : 0.16, dampRate, dt);
        this.mouseSmooth.lerp(this.mouse, 0.04);

        this.quaternioGroup.position.x = THREE.MathUtils.damp(this.quaternioGroup.position.x, isMobile ? 2.7 : 2.35, 4, dt);
        this.quaternioGroup.position.y = THREE.MathUtils.damp(this.quaternioGroup.position.y, isMobile ? -0.4 : 0, 4, dt);
        this.quaternioGroup.scale.setScalar((isMobile ? 0.72 : 0.9) + this.quaternioFocus * 0.1 + this.paradoxFocus * 0.04);

        // Mouse quadrant dominance
        const mouseAngle = Math.atan2(this.mouseSmooth.y, this.mouseSmooth.x);
        const dominantQ = ((Math.round(mouseAngle / (Math.PI / 2)) + 4) % 4);

        // Rotate layers
        for (const layer of this.layers) {
            for (const node of layer.nodes) {
                const newAngle = node.baseAngle + t * layer.speed * motionScale * (0.8 + this.gnosisFocus * 0.35 + this.quaternioFocus * 0.5);
                node.mesh.position.x = Math.cos(newAngle) * layer.r;
                node.mesh.position.y = Math.sin(newAngle) * layer.r;
                node.mesh.rotation.y = t * 0.3 * motionScale;

                // Quadrant dominance: mouse activates matching quadrant
                const active = node.q === dominantQ;
                const panelStrength = 0.2 + this.quaternioFocus * 0.5 + this.gnosisFocus * 0.18 + this.paradoxFocus * 0.12;
                node.mesh.material.opacity = panelStrength + (active ? 0.28 : 0.02);
                node.mesh.scale.setScalar((active ? 1.18 : 0.92) + this.quaternioFocus * 0.22 + this.paradoxFocus * 0.12);
            }
            layer.ring.rotation.z = t * layer.speed * motionScale;
            layer.ring.material.opacity = 0.04 + this.gnosisFocus * 0.05 + this.quaternioFocus * 0.16;
        }
        this.axes?.forEach((axis, index) => {
            axis.material.opacity = 0.035 + this.quaternioFocus * 0.18 + this.paradoxFocus * (index % 2 === 0 ? 0.08 : 0.14);
        });

        this.pleromaRings?.forEach((ring, index) => {
            const drift = this.reducedMotion ? 0 : t * (0.018 + index * 0.006) * (index % 2 ? -1 : 1);
            const pulse = this.reducedMotion ? 0 : Math.sin(t * 0.18 + index) * 0.015;
            ring.rotation.z = index * Math.PI / 9 + drift;
            ring.scale.setScalar(1 + this.gnosisFocus * 0.08 + pulse);
            ring.material.opacity = 0.025 + this.gnosisFocus * (0.055 + index * 0.007) + this.paradoxFocus * 0.015;
        });
        if (this.pleromaSource) {
            this.pleromaSource.rotation.y = this.reducedMotion ? 0 : t * 0.18;
            this.pleromaSource.scale.setScalar(0.9 + this.gnosisFocus * 0.5 + this.quaternioFocus * 0.12);
            this.pleromaSource.material.opacity = 0.26 + this.gnosisFocus * 0.58 + this.quaternioFocus * 0.12;
        }
        this.pleromaSpokes?.forEach((spoke, index) => {
            spoke.material.opacity = 0.018 + this.gnosisFocus * 0.075 + (index % 2 ? this.quaternioFocus * 0.018 : 0);
        });
        this.aeonChains?.forEach((chain, index) => {
            chain.material.opacity = 0.018 + this.gnosisFocus * 0.07 + this.quaternioFocus * 0.035 + this.paradoxFocus * (index === 3 ? 0.06 : 0.018);
        });

        // Center pulse — stronger when all quadrants balanced (mouse near center)
        const centerDist = Math.sqrt(this.mouseSmooth.x ** 2 + this.mouseSmooth.y ** 2);
        const balance = Math.max(0, 1 - centerDist);
        this.center.material.opacity = 0.36 + balance * 0.28 + this.quaternioFocus * 0.22 + this.paradoxFocus * 0.12;
        this.center.scale.setScalar(0.9 + balance * 0.32 + this.quaternioFocus * 0.22 + this.paradoxFocus * 0.1);
        this.centerGlow.material.opacity = 0.025 + balance * 0.08 + this.quaternioFocus * 0.08 + this.paradoxFocus * 0.08;

        this.quaternioSealGroup.rotation.z = (this.reducedMotion ? 0 : t * 0.018) - this.paradoxFocus * 0.08;
        this.quaternioDiamonds?.forEach((diamond, index) => {
            diamond.material.opacity = 0.035 + this.quaternioFocus * (0.17 - index * 0.04) + this.paradoxFocus * 0.035;
        });
        this.quaternioPetals?.forEach((petal, index) => {
            petal.material.opacity = 0.035 + this.quaternioFocus * 0.16 + (index === dominantQ ? 0.055 : 0) + this.paradoxFocus * 0.025;
        });

        this.emanationRings.forEach((ring, index) => {
            ring.rotation.z = t * (0.02 + index * 0.004) * motionScale;
            ring.rotation.y += dt * 0.012 * motionScale * (index % 2 ? -1 : 1);
            ring.material.opacity = 0.035 + this.gnosisFocus * (0.05 + index * 0.006) + this.quaternioFocus * 0.025;
        });

        this.sophiaGroup.position.y = 4.35 - this.gnosisFocus * 0.7 + Math.sin(t * 0.22 * motionScale) * 0.12;
        this.sophiaGroup.rotation.z = Math.sin(t * 0.16 * motionScale) * 0.22;
        this.sophiaBody.rotation.y = t * 0.22 * motionScale;
        this.sophiaBody.material.opacity = 0.16 + this.gnosisFocus * 0.55 + this.paradoxFocus * 0.16;
        this.sophiaTrail.material.opacity = 0.05 + this.gnosisFocus * 0.3 + this.paradoxFocus * 0.12;
        this.sophiaHalo.rotation.z = this.reducedMotion ? 0 : t * 0.12;
        this.sophiaHalo.material.opacity = 0.04 + this.gnosisFocus * 0.18 + this.paradoxFocus * 0.12;

        this.paradoxGroup.rotation.z = Math.sin(t * 0.12 * motionScale) * 0.08;
        this.paradoxShards.forEach(({ shard, angle }, index) => {
            shard.position.x = Math.cos(angle + t * 0.12 * motionScale) * (1.3 + index * 0.12 + this.paradoxFocus * 0.55);
            shard.position.y = Math.sin(angle - t * 0.1 * motionScale) * (0.8 + index * 0.08 + this.paradoxFocus * 0.45);
            shard.rotation.x = t * 0.22 * motionScale + index;
            shard.rotation.y = t * 0.18 * motionScale;
            shard.material.opacity = 0.05 + this.paradoxFocus * 0.5;
        });
        this.paradoxRupture.material.opacity = 0.04 + this.paradoxFocus * 0.42;
        this.returnArc.material.opacity = 0.035 + this.paradoxFocus * 0.34 + this.gnosisFocus * 0.035;
        this.returnSparks?.forEach((spark, index) => {
            const phase = this.reducedMotion ? index / this.returnSparks.length : (t * 0.06 + index / this.returnSparks.length) % 1;
            const pointIndex = Math.min(this.returnCurvePoints.length - 1, Math.floor(phase * (this.returnCurvePoints.length - 1)));
            const curvePoint = this.returnCurvePoints[pointIndex] || this.returnCurvePoints[0];
            if (curvePoint) spark.position.copy(curvePoint);
            spark.rotation.y = (this.reducedMotion ? 0 : t * 0.26) + index;
            spark.material.opacity = 0.04 + this.paradoxFocus * 0.34 + (phase > 0.72 ? this.gnosisFocus * 0.1 : 0);
            const sparkPulse = this.reducedMotion ? 0 : Math.sin(t * 0.4 + index) * 0.08;
            spark.scale.setScalar(0.75 + this.paradoxFocus * 1.15 + sparkPulse);
        });

        // Camera
        const targetCam = new THREE.Vector3(
            -1.2 + this.mouseSmooth.x * 1.6 - this.paradoxFocus * 0.6,
            this.mouseSmooth.y * 1.4 - this.paradoxFocus * 0.2,
            18 - this.quaternioFocus * 1.2 - this.paradoxFocus * 1.6
        );
        this.camera.position.lerp(targetCam, this.reducedMotion ? 1 : Math.min(1, dt * 1.8));
        this.camera.lookAt(1.4 + this.quaternioFocus * 0.4 + (isMobile ? 0.9 : 0), 0, 0);

        if (this.bloom) this.bloom.strength = 1.0 + this.gnosisFocus * 0.2 + this.quaternioFocus * 0.18 + this.paradoxFocus * 0.28;
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
