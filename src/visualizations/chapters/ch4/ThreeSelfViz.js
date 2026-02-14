/**
 * ThreeSelfViz.js — Chapter 4: "The Self"
 * ═══════════════════════════════════════════════════════════════
 * Jung, Aion §43–67: The Self as supraordinate totality.
 *
 * Visual metaphors rendered here:
 *   1. Mandala = magic circle ordering chaos — concentric rotating rings
 *   2. "Unimpressive point" = tiny seed that grows into totality — pulsing center
 *   3. Quaternity = four-fold wholeness — four colored quadrants (Thinking,
 *      Feeling, Sensation, Intuition)
 *   4. Scale reversal = ego → shadow → anima → Self — concentric layer labels
 *   5. Complexio oppositorum = union of opposites — all colors merging at center
 *
 * Mouse moves the viewpoint; scroll zooms toward the center.
 * Annotations phase in over ~32 seconds.
 * ═══════════════════════════════════════════════════════════════
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/* ── Palette ── */
const GOLD = new THREE.Color('#ffd700');
const GOLD_DIM = new THREE.Color('#a08520');
const QUAD_COLORS = [
    new THREE.Color('#e63946'),  // top-right → Feeling (red/warm)
    new THREE.Color('#457b9d'),  // top-left  → Thinking (blue/cool)
    new THREE.Color('#2a9d8f'),  // bot-left  → Sensation (teal/earth)
    new THREE.Color('#e9c46a'),  // bot-right → Intuition (gold/light)
];
const STAR_CLR = 0x1a1a40;

export default class ThreeSelfViz extends BaseViz {
    constructor(c, o = {}) {
        super(c, Object.assign({ contextType: 'webgl' }, o));
    }

    /* ══════════════════════════════════════════════════════
     *  INIT
     * ══════════════════════════════════════════════════════ */
    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: true, alpha: false
        });
        R.setPixelRatio(Math.min(devicePixelRatio, 2));
        R.setSize(this.width, this.height);
        R.setClearColor(0x030308);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 0, 20);

        /* Mouse & zoom */
        this.mouse = new THREE.Vector2();
        this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => {
            this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        };
        addEventListener('mousemove', this._onMM);
        this._onWheel = e => {
            this.zoomTarget = Math.max(5, Math.min(30, this.zoomTarget + e.deltaY * 0.01));
        };
        addEventListener('wheel', this._onWheel, { passive: true });
        this.zoomTarget = 20;
        this.introT = 0;

        /* ── Build scene ── */
        this._buildCenter();
        this._buildQuadrants();
        this._buildMandalaRings();
        this._buildCrossAxes();
        this._buildStarfield();
        this._buildAnnotations();

        this.scene.add(new THREE.AmbientLight(0x0a0a10, 0.2));

        /* ── Post-processing ── */
        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.5, 0.5, 0.3
        );
        this.composer.addPass(this.bloom);
    }

    /* ══════════════════════════════════════════════════════
     *  CENTER — the "unimpressive point" / seed of totality
     * ══════════════════════════════════════════════════════ */
    _buildCenter() {
        /* Solid gold core */
        this.center = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 24, 24),
            new THREE.MeshBasicMaterial({
                color: GOLD, transparent: true, opacity: 0.9
            })
        );
        this.scene.add(this.center);

        /* Soft outer glow */
        this.centerGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 16, 16),
            new THREE.MeshBasicMaterial({
                color: GOLD, transparent: true, opacity: 0.1,
                blending: THREE.AdditiveBlending
            })
        );
        this.scene.add(this.centerGlow);

        /* Second wider glow for "totality expansion" */
        this.centerHalo = new THREE.Mesh(
            new THREE.SphereGeometry(1.8, 16, 16),
            new THREE.MeshBasicMaterial({
                color: GOLD_DIM, transparent: true, opacity: 0.03,
                blending: THREE.AdditiveBlending
            })
        );
        this.scene.add(this.centerHalo);

        /* Center point light */
        this.centerLight = new THREE.PointLight(GOLD, 2, 15);
        this.scene.add(this.centerLight);
    }

    /* ══════════════════════════════════════════════════════
     *  QUADRANTS — four-fold particle bands
     * ══════════════════════════════════════════════════════ */
    _buildQuadrants() {
        this.quads = [];
        for (let q = 0; q < 4; q++) {
            const count = 300;
            const pos = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
                const r = 2 + Math.random() * 8;
                const a = (q / 4 + Math.random() * 0.22) * Math.PI * 2;
                pos[i * 3] = Math.cos(a) * r;
                pos[i * 3 + 1] = Math.sin(a) * r;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const pts = new THREE.Points(geo, new THREE.PointsMaterial({
                color: QUAD_COLORS[q], size: 0.07, transparent: true,
                opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false
            }));
            this.scene.add(pts);
            this.quads.push(pts);
        }
    }

    /* ══════════════════════════════════════════════════════
     *  MANDALA RINGS — concentric rotating pattern rings
     * ══════════════════════════════════════════════════════ */
    _buildMandalaRings() {
        this.mandalaRings = [];
        for (let i = 0; i < 6; i++) {
            const r = 1.5 + i * 1.8;
            const segs = 6 + i * 2;
            const pts = [];
            for (let j = 0; j <= 80; j++) {
                const a = (j / 80) * Math.PI * 2;
                const wobble = Math.sin(a * segs) * 0.3;
                pts.push(new THREE.Vector3(
                    Math.cos(a) * (r + wobble),
                    Math.sin(a) * (r + wobble),
                    0
                ));
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const ring = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: GOLD, transparent: true,
                opacity: 0.12 + i * 0.025,
                blending: THREE.AdditiveBlending
            }));
            this.scene.add(ring);
            this.mandalaRings.push({
                ring, segs, r,
                speed: 0.005 * (i % 2 === 0 ? 1 : -1)
            });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  CROSS AXES — four directions of wholeness
     * ══════════════════════════════════════════════════════ */
    _buildCrossAxes() {
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(Math.cos(a) * 15, Math.sin(a) * 15, 0)
            ];
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({
                    color: GOLD, transparent: true, opacity: 0.10
                })
            );
            this.scene.add(line);

            /* Small diamond markers at axis ends */
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: GOLD, transparent: true, opacity: 0.2,
                    blending: THREE.AdditiveBlending
                })
            );
            marker.position.set(Math.cos(a) * 12, Math.sin(a) * 12, 0);
            this.scene.add(marker);
        }
    }

    /* ══════════════════════════════════════════════════════
     *  STARFIELD — depth atmosphere
     * ══════════════════════════════════════════════════════ */
    _buildStarfield() {
        const N = 500;
        const pos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 80;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.stars = new THREE.Points(geo, new THREE.PointsMaterial({
            color: STAR_CLR, size: 0.04, transparent: true, opacity: 0.3,
            depthWrite: false
        }));
        this.scene.add(this.stars);
    }

    /* ══════════════════════════════════════════════════════
     *  ANNOTATIONS — Instrument Serif + Cormorant Garamond
     *  Phased reveal with fade/drift animations
     * ══════════════════════════════════════════════════════ */
    _buildAnnotations() {
        const ov = this._annotationOverlay = document.createElement('div');
        ov.className = 'ch4-annotations';
        ov.setAttribute('aria-hidden', 'true');

        /* ── CSS ── */
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

            .ch4-annotations {
                position: absolute; inset: 0;
                pointer-events: none; z-index: 10;
                font-family: 'Cormorant Garamond', 'Georgia', serif;
                color: rgba(255, 245, 220, 0.85);
                overflow: hidden;
            }

            /* ── Phase fade-in ── */
            .ch4-annotations [data-phase] {
                opacity: 0;
                transform: translateY(12px);
                transition: opacity 2.5s ease, transform 2.5s ease;
            }
            .ch4-annotations [data-phase].vis {
                opacity: 1;
                transform: translateY(0);
            }

            /* ── Header block ── */
            .ch4-header {
                position: absolute;
                top: 40px; left: 48px;
            }
            .ch4-eyebrow {
                font-family: 'Cormorant Garamond', serif;
                font-size: 11px;
                letter-spacing: 5px;
                text-transform: uppercase;
                color: rgba(255, 215, 0, 0.5);
            }
            .ch4-title {
                font-family: 'Instrument Serif', serif;
                font-size: 48px;
                font-style: italic;
                color: rgba(255, 215, 0, 0.75);
                line-height: 1.1;
                margin: 4px 0 6px;
            }
            .ch4-subtitle {
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 15px;
                color: rgba(255, 215, 0, 0.4);
                letter-spacing: 1px;
            }

            /* ── Annotation blocks ── */
            .ch4-annotation {
                position: absolute;
                max-width: 240px;
            }
            .ch4-a--center {
                top: 38%; left: 52px;
            }
            .ch4-a--mandala {
                bottom: 80px; right: 52px;
                text-align: right;
            }
            .ch4-a--scale {
                bottom: 80px; left: 52px;
            }

            .ch4-label {
                font-family: 'Instrument Serif', serif;
                font-size: 20px;
                font-style: italic;
                color: rgba(255, 215, 0, 0.7);
                margin-bottom: 8px;
            }
            .ch4-text {
                font-size: 14.5px;
                line-height: 1.6;
                color: rgba(255, 245, 220, 0.6);
                font-weight: 300;
            }
            .ch4-life {
                display: block;
                margin-top: 8px;
                font-style: italic;
                font-size: 13px;
                color: rgba(255, 215, 0, 0.35);
                line-height: 1.5;
            }
            .ch4-rule {
                width: 30px;
                border: none;
                border-top: 1px solid rgba(255, 215, 0, 0.15);
                margin: 12px 0;
            }
            .ch4-rule--right {
                margin-left: auto;
            }

            /* ── Quaternity labels ── */
            .ch4-quat {
                position: absolute;
                font-family: 'Cormorant Garamond', serif;
                font-size: 10px;
                letter-spacing: 4px;
                text-transform: uppercase;
                opacity: 0;
                transition: opacity 2s ease;
            }
            .ch4-quat.vis { opacity: 1; }
            .ch4-quat--top {
                top: 12%; left: 50%;
                transform: translateX(-50%);
                color: rgba(69, 123, 157, 0.55);
            }
            .ch4-quat--right {
                top: 50%; right: 52px;
                transform: translateY(-50%);
                color: rgba(233, 196, 106, 0.55);
            }
            .ch4-quat--bottom {
                bottom: 12%; left: 50%;
                transform: translateX(-50%);
                color: rgba(42, 157, 143, 0.55);
            }
            .ch4-quat--left {
                top: 50%; left: 52px;
                transform: translateY(-50%);
                color: rgba(230, 57, 70, 0.55);
            }

            /* ── Layer micro-labels (along rings) ── */
            .ch4-layer {
                position: absolute;
                font-family: 'Cormorant Garamond', serif;
                font-size: 9px;
                letter-spacing: 3px;
                text-transform: uppercase;
                color: rgba(255, 215, 0, 0.22);
                opacity: 0;
                transition: opacity 2.5s ease;
            }
            .ch4-layer.vis { opacity: 1; }
            .ch4-layer--ego    { top: 46%; left: calc(50% + 50px); }
            .ch4-layer--shadow { top: 46%; left: calc(50% + 110px); }
            .ch4-layer--anima  { top: 46%; left: calc(50% + 190px); }
            .ch4-layer--self   { top: 46%; left: calc(50% + 310px); }

            /* ── Scale path ── */
            .ch4-scale-path {
                font-family: 'Instrument Serif', serif;
                font-size: 14px;
                font-style: italic;
                color: rgba(255, 215, 0, 0.35);
                letter-spacing: 2px;
                margin-top: 6px;
            }

            /* ── Quote ── */
            .ch4-quote {
                font-style: italic;
                font-size: 12.5px;
                color: rgba(255, 215, 0, 0.3);
                line-height: 1.5;
                margin-top: 8px;
            }

            /* ── Interaction hint ── */
            .ch4-hint {
                position: absolute;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 10px;
                letter-spacing: 3px;
                text-transform: uppercase;
                color: rgba(255, 215, 0, 0.18);
                opacity: 0;
                transition: opacity 3s ease;
            }
            .ch4-hint.vis { opacity: 1; }

            /* ── Media queries ── */
            @media (max-width: 768px) {
                .ch4-title { font-size: 32px; }
                .ch4-annotation { max-width: 180px; }
                .ch4-a--center { left: 24px; }
                .ch4-a--mandala { right: 24px; }
                .ch4-a--scale { left: 24px; }
                .ch4-quat--right { right: 24px; }
                .ch4-quat--left { left: 24px; }
                .ch4-layer { display: none; }
            }
        `;

        /* ── HTML ── */
        ov.innerHTML = `
            <!-- Phase 1: Chapter heading -->
            <div class="ch4-header" data-phase="1">
                <div class="ch4-eyebrow">Chapter IV</div>
                <div class="ch4-title">The Self</div>
                <div class="ch4-subtitle">the totality you cannot see</div>
            </div>

            <!-- Phase 2: Center / Seed annotation -->
            <div class="ch4-annotation ch4-a--center" data-phase="2">
                <hr class="ch4-rule">
                <div class="ch4-label">The Center</div>
                <div class="ch4-text">
                    An <em>unimpressive point</em> — a tiny seed
                    that contains the whole. The Self is both
                    the center and the circumference of the psyche.
                </div>
                <span class="ch4-life">
                    The moment of quiet knowing that arrives
                    after long confusion — that is the Self,
                    briefly visible.
                </span>
            </div>

            <!-- Phase 3: Quaternity labels -->
            <div class="ch4-quat ch4-quat--top" data-phase="3">Thinking</div>
            <div class="ch4-quat ch4-quat--right" data-phase="3">Intuition</div>
            <div class="ch4-quat ch4-quat--bottom" data-phase="3">Sensation</div>
            <div class="ch4-quat ch4-quat--left" data-phase="3">Feeling</div>

            <!-- Phase 3b: Layer labels -->
            <div class="ch4-layer ch4-layer--ego" data-phase="3">ego</div>
            <div class="ch4-layer ch4-layer--shadow" data-phase="3">shadow</div>
            <div class="ch4-layer ch4-layer--anima" data-phase="3">anima</div>
            <div class="ch4-layer ch4-layer--self" data-phase="3">self</div>

            <!-- Phase 4: Mandala annotation -->
            <div class="ch4-annotation ch4-a--mandala" data-phase="4">
                <hr class="ch4-rule ch4-rule--right">
                <div class="ch4-label">The Mandala</div>
                <div class="ch4-text">
                    The magic circle. Every culture draws it
                    when seeking wholeness. When the psyche is
                    in disorder, mandalas appear spontaneously
                    — in dreams, in doodles, in sacred art.
                </div>
                <div class="ch4-quote">
                    "The Self is a circle whose centre is
                    everywhere and whose circumference is
                    nowhere." &mdash; Aion, §44
                </div>
            </div>

            <!-- Phase 5: Scale reversal -->
            <div class="ch4-annotation ch4-a--scale" data-phase="5">
                <hr class="ch4-rule">
                <div class="ch4-label">Scale Reversal</div>
                <div class="ch4-text">
                    As you move inward — from ego through shadow,
                    through anima — the values reverse. What seemed
                    smallest contains the greatest.
                </div>
                <div class="ch4-scale-path">
                    ego → shadow → anima → Self
                </div>
                <span class="ch4-life">
                    The ego thinks it is the whole. The Self
                    knows the ego is a small island in an
                    infinite sea.
                </span>
            </div>

            <!-- Interaction hint -->
            <div class="ch4-hint" data-phase="1">
                scroll to zoom · move mouse to explore
            </div>
        `;

        ov.prepend(style);
        (this.container || this.canvas.parentElement).appendChild(ov);

        /* ── Phased reveal ── */
        this._annTimers = [];
        const phases = [
            { sel: '[data-phase="1"]', delay: 2000 },
            { sel: '[data-phase="2"]', delay: 6000 },
            { sel: '[data-phase="3"]', delay: 14000 },
            { sel: '[data-phase="4"]', delay: 22000 },
            { sel: '[data-phase="5"]', delay: 30000 },
        ];
        for (const p of phases) {
            const els = ov.querySelectorAll(p.sel);
            els.forEach(el => {
                const t = setTimeout(() => el.classList.add('vis'), p.delay);
                this._annTimers.push(t);
            });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  UPDATE — animation loop
     * ══════════════════════════════════════════════════════ */
    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);
        this.introT += dt;

        /* ── Center pulse ("seed → totality") ── */
        const seedCycle = (Math.sin(t * 0.15) + 1) / 2; // 0..1 over ~42s
        const seedScale = 0.5 + seedCycle * 1.2;
        this.center.scale.setScalar(seedScale);
        this.center.material.opacity = 0.6 + seedCycle * 0.35;
        this.centerGlow.material.opacity = 0.06 + seedCycle * 0.08;
        this.centerGlow.scale.setScalar(seedScale * 1.8);
        this.centerHalo.material.opacity = 0.02 + seedCycle * 0.04;
        this.centerHalo.scale.setScalar(seedScale * 3);
        this.centerLight.intensity = 1 + seedCycle * 2;

        /* ── Rotate quadrant particles ── */
        for (let q = 0; q < 4; q++) {
            this.quads[q].rotation.z = t * (0.02 + q * 0.005) * (q % 2 === 0 ? 1 : -1);
        }

        /* ── Mandala rings rotate & breathe ── */
        for (const mr of this.mandalaRings) {
            mr.ring.rotation.z += mr.speed;
            const breathe = 1 + Math.sin(t * 0.3 + mr.r) * 0.05;
            mr.ring.scale.setScalar(breathe);
        }

        /* ── Starfield subtle rotation ── */
        this.stars.rotation.y += 0.0001;

        /* ── Camera — intro zoom + mouse parallax ── */
        const introF = Math.min(this.introT / 6, 1);
        const ease = 1 - Math.pow(1 - introF, 3);
        const baseDist = THREE.MathUtils.lerp(30, 20, ease);
        this.camera.position.z += (this.zoomTarget * (baseDist / 20) - this.camera.position.z) * 0.05;
        this.camera.position.x = this.mouseSmooth.x * 3;
        this.camera.position.y = this.mouseSmooth.y * 3;
        this.camera.lookAt(0, 0, 0);

        /* ── Bloom pulse synced to seed ── */
        if (this.bloom) {
            this.bloom.strength = 1.3 + seedCycle * 0.4 + Math.sin(t * 0.04) * 0.1;
        }
    }

    /* ══════════════════════════════════════════════════════ */
    render() { this.composer?.render(); }

    onResize(w, h) {
        if (!this.renderer) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer?.setSize(w, h);
        this.bloom?.setSize(w, h);
    }

    dispose() {
        removeEventListener('mousemove', this._onMM);
        removeEventListener('wheel', this._onWheel);
        if (this._annTimers) this._annTimers.forEach(t => clearTimeout(t));
        this._annotationOverlay?.remove();
        this.renderer?.dispose();
        this.renderer?.forceContextLoss();
        this.scene?.traverse(o => {
            o.geometry?.dispose();
            if (o.material) [].concat(o.material).forEach(m => m.dispose());
        });
        this.composer = null; this.scene = null; this.renderer = null;
        super.dispose();
    }
}
