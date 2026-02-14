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
 *   4. Scale reversal = ego → shadow → anima → Self — concentric zone shells
 *   5. Complexio oppositorum = union of opposites — all colors merging at center
 *
 * Visual language for newcomers:
 *   - Each 3D element has a tiny floating label near it
 *   - Concentric tinted zones show the psychic layers
 *   - Quadrant boundary arcs divide the four functions
 *   - Leader lines connect text annotations to scene elements
 *   - The center dot breathes seed→totality in a 42-second cycle
 *
 * Mouse moves the viewpoint; scroll zooms toward the center.
 * Annotations phase in over ~36 seconds (7 phases).
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
    new THREE.Color('#e63946'),  // Q0: Feeling  (red/warm)  — left
    new THREE.Color('#457b9d'),  // Q1: Thinking  (blue/cool) — top
    new THREE.Color('#2a9d8f'),  // Q2: Sensation (teal/earth) — bottom
    new THREE.Color('#e9c46a'),  // Q3: Intuition (gold/light) — right
];
const ZONE_COLORS = [
    new THREE.Color('#ffd700'),  // innermost: ego — gold
    new THREE.Color('#665544'),  // shadow — muted earth
    new THREE.Color('#884466'),  // anima — deep rose
    new THREE.Color('#2244aa'),  // Self — deep blue (outermost)
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
        this._buildZoneShells();
        this._buildCenter();
        this._buildQuadrants();
        this._buildQuadrantBoundaries();
        this._buildMandalaRings();
        this._buildCrossAxes();
        this._buildStarfield();
        this._buildAnnotations();

        this.scene.add(new THREE.AmbientLight(0x0a0a10, 0.2));

        /* ── Post-processing ── */
        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.4, 0.5, 0.35
        );
        this.composer.addPass(this.bloom);
    }

    /* ══════════════════════════════════════════════════════
     *  ZONE SHELLS — concentric tinted rings showing
     *  the psychic layers: ego → shadow → anima → Self
     * ══════════════════════════════════════════════════════ */
    _buildZoneShells() {
        this.zoneShells = [];
        const radii = [2.2, 4.5, 7.5, 11];
        const labels = ['ego', 'shadow', 'anima', 'Self'];
        for (let i = 0; i < 4; i++) {
            /* Torus ring as a zone boundary */
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(radii[i], 0.015, 8, 100),
                new THREE.MeshBasicMaterial({
                    color: ZONE_COLORS[i], transparent: true,
                    opacity: 0.12 + i * 0.03,
                    blending: THREE.AdditiveBlending, depthWrite: false
                })
            );
            this.scene.add(ring);

            /* Very faint filled disc for zone tinting */
            const disc = new THREE.Mesh(
                new THREE.RingGeometry(
                    i === 0 ? 0.5 : radii[i - 1],
                    radii[i], 80
                ),
                new THREE.MeshBasicMaterial({
                    color: ZONE_COLORS[i], transparent: true,
                    opacity: 0.02 + i * 0.01,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide, depthWrite: false
                })
            );
            this.scene.add(disc);

            this.zoneShells.push({ ring, disc, r: radii[i], label: labels[i] });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  CENTER — the "unimpressive point" / seed of totality
     * ══════════════════════════════════════════════════════ */
    _buildCenter() {
        /* Solid gold core */
        this.center = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 24, 24),
            new THREE.MeshBasicMaterial({
                color: GOLD, transparent: true, opacity: 0.9
            })
        );
        this.scene.add(this.center);

        /* Soft outer glow */
        this.centerGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 16, 16),
            new THREE.MeshBasicMaterial({
                color: GOLD, transparent: true, opacity: 0.1,
                blending: THREE.AdditiveBlending
            })
        );
        this.scene.add(this.centerGlow);

        /* Second wider glow for "totality expansion" */
        this.centerHalo = new THREE.Mesh(
            new THREE.SphereGeometry(1.4, 16, 16),
            new THREE.MeshBasicMaterial({
                color: GOLD_DIM, transparent: true, opacity: 0.03,
                blending: THREE.AdditiveBlending
            })
        );
        this.scene.add(this.centerHalo);

        /* Center point light */
        this.centerLight = new THREE.PointLight(GOLD, 1.5, 15);
        this.scene.add(this.centerLight);
    }

    /* ══════════════════════════════════════════════════════
     *  QUADRANTS — four-fold particle bands
     * ══════════════════════════════════════════════════════ */
    _buildQuadrants() {
        this.quads = [];
        /* Q0=left (π/2..π), Q1=top (0..π/2), Q2=bottom (π..3π/2), Q3=right (3π/2..2π) */
        const angleRanges = [
            [Math.PI * 0.5, Math.PI],       // Q0: Feeling  (left)
            [0, Math.PI * 0.5],             // Q1: Thinking (top)
            [Math.PI, Math.PI * 1.5],       // Q2: Sensation (bottom)
            [Math.PI * 1.5, Math.PI * 2],   // Q3: Intuition (right)
        ];
        for (let q = 0; q < 4; q++) {
            const count = 250;
            const pos = new Float32Array(count * 3);
            const [aMin, aMax] = angleRanges[q];
            for (let i = 0; i < count; i++) {
                const r = 1.5 + Math.random() * 9;
                const a = aMin + Math.random() * (aMax - aMin);
                pos[i * 3] = Math.cos(a) * r;
                pos[i * 3 + 1] = Math.sin(a) * r;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            const pts = new THREE.Points(geo, new THREE.PointsMaterial({
                color: QUAD_COLORS[q], size: 0.06, transparent: true,
                opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false
            }));
            this.scene.add(pts);
            this.quads.push(pts);
        }
    }

    /* ══════════════════════════════════════════════════════
     *  QUADRANT BOUNDARIES — subtle arcs separating the
     *  four psychological functions visually
     * ══════════════════════════════════════════════════════ */
    _buildQuadrantBoundaries() {
        const angles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
        for (const a of angles) {
            const pts = [];
            for (let r = 0.5; r <= 12; r += 0.15) {
                pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geo, new THREE.LineDashedMaterial({
                color: GOLD, transparent: true, opacity: 0.06,
                dashSize: 0.3, gapSize: 0.15
            }));
            line.computeLineDistances();
            this.scene.add(line);
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
            for (let j = 0; j <= 100; j++) {
                const a = (j / 100) * Math.PI * 2;
                const wobble = Math.sin(a * segs) * 0.25;
                pts.push(new THREE.Vector3(
                    Math.cos(a) * (r + wobble),
                    Math.sin(a) * (r + wobble),
                    0
                ));
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            /* Inner rings warmer, outer rings cooler */
            const hue = 0.12 - i * 0.015; // gold → amber
            const ringColor = new THREE.Color().setHSL(hue, 0.7, 0.5);
            const ring = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: ringColor, transparent: true,
                opacity: 0.15 + i * 0.02,
                blending: THREE.AdditiveBlending
            }));
            this.scene.add(ring);
            this.mandalaRings.push({
                ring, segs, r,
                speed: 0.004 * (i % 2 === 0 ? 1 : -1)
            });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  CROSS AXES — four directions, color-matched to
     *  their quadrants, with endpoint markers
     * ══════════════════════════════════════════════════════ */
    _buildCrossAxes() {
        /* Horizontal: Feeling (left, red) ↔ Intuition (right, gold) */
        /* Vertical:   Thinking (top, blue) ↔ Sensation (bottom, teal) */
        const axes = [
            { a: Math.PI * 0.5, col: QUAD_COLORS[1] },  // up → Thinking
            { a: Math.PI, col: QUAD_COLORS[0] },  // left → Feeling
            { a: Math.PI * 1.5, col: QUAD_COLORS[2] },  // down → Sensation
            { a: 0, col: QUAD_COLORS[3] },  // right → Intuition
        ];
        for (const { a, col } of axes) {
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(Math.cos(a) * 14, Math.sin(a) * 14, 0)
            ];
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({
                    color: col, transparent: true, opacity: 0.08
                })
            );
            this.scene.add(line);

            /* Endpoint diamond marker */
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: col, transparent: true, opacity: 0.25,
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
     *
     *  Key design principle: every visual element gets a
     *  tiny label close to it so a newcomer can decode the
     *  scene without reading the paragraph text.
     *
     *  7 Phases over ~36 seconds:
     *   1. Title + interaction hint
     *   2. Center "Self" micro-label + seed annotation
     *   3. Zone labels on concentric rings
     *   4. Quaternity labels + quadrant shading cues
     *   5. Mandala annotation (bottom-right)
     *   6. Scale reversal annotation (bottom-left)
     *   7. Integration quote
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
                transform: translateY(10px);
                transition: opacity 2.8s cubic-bezier(.25,.46,.45,.94),
                            transform 2.8s cubic-bezier(.25,.46,.45,.94);
            }
            .ch4-annotations [data-phase].vis {
                opacity: 1;
                transform: translateY(0);
            }

            /* ── Header block ── */
            .ch4-header {
                position: absolute;
                top: 36px; left: 44px;
            }
            .ch4-eyebrow {
                font-family: 'Cormorant Garamond', serif;
                font-size: 11px;
                letter-spacing: 5px;
                text-transform: uppercase;
                color: rgba(255, 215, 0, 0.45);
            }
            .ch4-title {
                font-family: 'Instrument Serif', serif;
                font-size: 44px;
                font-style: italic;
                color: rgba(255, 215, 0, 0.7);
                line-height: 1.1;
                margin: 4px 0 6px;
            }
            .ch4-subtitle {
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 14px;
                color: rgba(255, 215, 0, 0.35);
                letter-spacing: 1px;
            }

            /* ── Center micro-label ("Self") ── */
            .ch4-center-label {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, 40px);
                font-family: 'Instrument Serif', serif;
                font-style: italic;
                font-size: 14px;
                color: rgba(255, 215, 0, 0.6);
                letter-spacing: 3px;
                text-transform: lowercase;
                text-align: center;
                opacity: 0;
                transition: opacity 3s ease;
            }
            .ch4-center-label.vis { opacity: 1; }
            .ch4-center-dot {
                display: block;
                width: 3px; height: 3px;
                border-radius: 50%;
                background: rgba(255, 215, 0, 0.5);
                margin: 0 auto 4px;
            }

            /* ── Annotation blocks ── */
            .ch4-annotation {
                position: absolute;
                max-width: 220px;
            }
            .ch4-a--center {
                top: 28%; left: 44px;
            }
            .ch4-a--mandala {
                bottom: 60px; right: 44px;
                text-align: right;
            }
            .ch4-a--scale {
                bottom: 60px; left: 44px;
            }
            .ch4-a--integration {
                top: 28%; right: 44px;
                text-align: right;
                max-width: 200px;
            }

            .ch4-label {
                font-family: 'Instrument Serif', serif;
                font-size: 18px;
                font-style: italic;
                color: rgba(255, 215, 0, 0.65);
                margin-bottom: 6px;
            }
            .ch4-text {
                font-size: 13.5px;
                line-height: 1.65;
                color: rgba(255, 245, 220, 0.5);
                font-weight: 300;
            }
            .ch4-life {
                display: block;
                margin-top: 8px;
                font-style: italic;
                font-size: 12.5px;
                color: rgba(255, 215, 0, 0.3);
                line-height: 1.5;
            }
            .ch4-rule {
                width: 24px;
                border: none;
                border-top: 1px solid rgba(255, 215, 0, 0.12);
                margin: 10px 0;
            }
            .ch4-rule--right {
                margin-left: auto;
            }

            /* ── Quaternity labels (at screen edges, color-matched) ── */
            .ch4-quat {
                position: absolute;
                font-family: 'Instrument Serif', serif;
                font-style: italic;
                font-size: 13px;
                letter-spacing: 3px;
                opacity: 0;
                transition: opacity 2.5s ease;
            }
            .ch4-quat.vis { opacity: 1; }
            .ch4-quat--top {
                top: 14%; left: 50%;
                transform: translateX(-50%);
                color: rgba(69, 123, 157, 0.55);
            }
            .ch4-quat--right {
                top: 50%; right: 44px;
                transform: translateY(-50%);
                color: rgba(233, 196, 106, 0.55);
            }
            .ch4-quat--bottom {
                bottom: 14%; left: 50%;
                transform: translateX(-50%);
                color: rgba(42, 157, 143, 0.55);
            }
            .ch4-quat--left {
                top: 50%; left: 44px;
                transform: translateY(-50%);
                color: rgba(230, 57, 70, 0.45);
            }
            .ch4-quat-desc {
                display: block;
                font-family: 'Cormorant Garamond', serif;
                font-style: normal;
                font-size: 10px;
                letter-spacing: 1px;
                margin-top: 3px;
                opacity: 0.6;
            }

            /* ── Zone labels (near concentric ring boundaries) ── */
            .ch4-zone {
                position: absolute;
                font-family: 'Cormorant Garamond', serif;
                font-size: 9px;
                letter-spacing: 3.5px;
                text-transform: uppercase;
                opacity: 0;
                transition: opacity 3s ease;
            }
            .ch4-zone.vis { opacity: 1; }

            /* Position zones along the RIGHT horizontal axis for clarity */
            .ch4-zone--ego {
                color: rgba(255, 215, 0, 0.30);
                top: calc(50% - 18px);
                left: calc(50% + 48px);
            }
            .ch4-zone--shadow {
                color: rgba(102, 85, 68, 0.50);
                top: calc(50% - 18px);
                left: calc(50% + 100px);
            }
            .ch4-zone--anima {
                color: rgba(136, 68, 102, 0.50);
                top: calc(50% - 18px);
                left: calc(50% + 170px);
            }
            .ch4-zone--self-ring {
                color: rgba(34, 68, 170, 0.50);
                top: calc(50% - 18px);
                left: calc(50% + 270px);
            }

            /* Leader line decoration before zone labels */
            .ch4-zone::before {
                content: '';
                display: inline-block;
                width: 12px;
                border-top: 1px solid currentColor;
                vertical-align: middle;
                margin-right: 6px;
                opacity: 0.5;
            }

            /* ── Scale path ── */
            .ch4-scale-path {
                font-family: 'Instrument Serif', serif;
                font-size: 13px;
                font-style: italic;
                color: rgba(255, 215, 0, 0.3);
                letter-spacing: 2px;
                margin-top: 6px;
            }

            /* ── Quote ── */
            .ch4-quote {
                font-style: italic;
                font-size: 12px;
                color: rgba(255, 215, 0, 0.25);
                line-height: 1.5;
                margin-top: 8px;
            }

            /* ── What-is-this label for mandala rings ── */
            .ch4-ring-label {
                position: absolute;
                top: 18%;
                right: 20%;
                font-family: 'Cormorant Garamond', serif;
                font-size: 9px;
                letter-spacing: 3px;
                text-transform: uppercase;
                color: rgba(255, 215, 0, 0.2);
                opacity: 0;
                transition: opacity 3s ease;
            }
            .ch4-ring-label.vis { opacity: 1; }
            .ch4-ring-label::after {
                content: '';
                display: inline-block;
                width: 20px;
                border-top: 1px solid rgba(255, 215, 0, 0.15);
                vertical-align: middle;
                margin-left: 6px;
            }

            /* ── Interaction hint ── */
            .ch4-hint {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 9px;
                letter-spacing: 3px;
                text-transform: uppercase;
                color: rgba(255, 215, 0, 0.15);
                opacity: 0;
                transition: opacity 3s ease;
            }
            .ch4-hint.vis { opacity: 1; }

            /* ── Animations ── */
            @keyframes ch4-pulse {
                0%, 100% { opacity: 0.4; }
                50% { opacity: 0.7; }
            }
            .ch4-center-label.vis {
                animation: ch4-pulse 4s ease-in-out infinite;
            }

            /* ── Media queries ── */
            @media (max-width: 768px) {
                .ch4-title { font-size: 30px; }
                .ch4-annotation { max-width: 160px; }
                .ch4-a--center { left: 20px; }
                .ch4-a--mandala { right: 20px; }
                .ch4-a--scale { left: 20px; }
                .ch4-a--integration { right: 20px; }
                .ch4-quat--right { right: 20px; }
                .ch4-quat--left { left: 20px; }
                .ch4-zone { display: none; }
                .ch4-ring-label { display: none; }
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

            <!-- Phase 2: Center "Self" micro-label (directly at the golden dot) -->
            <div class="ch4-center-label" data-phase="2">
                <span class="ch4-center-dot"></span>
                the self
            </div>

            <!-- Phase 2: "The Center" annotation (left side) -->
            <div class="ch4-annotation ch4-a--center" data-phase="2">
                <hr class="ch4-rule">
                <div class="ch4-label">The Center</div>
                <div class="ch4-text">
                    An <em>unimpressive point</em> — a tiny seed
                    that contains the whole. The Self is both
                    the center and the circumference.
                </div>
                <span class="ch4-life">
                    The moment of quiet knowing after long
                    confusion — the Self, briefly visible.
                </span>
            </div>

            <!-- Phase 3: Zone labels along concentric rings -->
            <div class="ch4-zone ch4-zone--ego" data-phase="3">ego</div>
            <div class="ch4-zone ch4-zone--shadow" data-phase="3">shadow</div>
            <div class="ch4-zone ch4-zone--anima" data-phase="3">anima</div>
            <div class="ch4-zone ch4-zone--self-ring" data-phase="3">the self</div>

            <!-- Phase 4: Quaternity labels with micro-descriptions -->
            <div class="ch4-quat ch4-quat--top" data-phase="4">
                Thinking
                <span class="ch4-quat-desc">logic, analysis, reason</span>
            </div>
            <div class="ch4-quat ch4-quat--right" data-phase="4">
                Intuition
                <span class="ch4-quat-desc">hunches, possibilities, the unseen</span>
            </div>
            <div class="ch4-quat ch4-quat--bottom" data-phase="4">
                Sensation
                <span class="ch4-quat-desc">the body, the concrete, what is</span>
            </div>
            <div class="ch4-quat ch4-quat--left" data-phase="4">
                Feeling
                <span class="ch4-quat-desc">values, harmony, what matters</span>
            </div>

            <!-- Phase 4b: Ring label -->
            <div class="ch4-ring-label" data-phase="4">mandala rings</div>

            <!-- Phase 5: Mandala annotation (bottom-right) -->
            <div class="ch4-annotation ch4-a--mandala" data-phase="5">
                <hr class="ch4-rule ch4-rule--right">
                <div class="ch4-label">The Mandala</div>
                <div class="ch4-text">
                    The magic circle. Every culture draws it
                    when seeking wholeness. When the psyche
                    is in disorder, mandalas appear
                    spontaneously — in dreams, in doodles,
                    in sacred art.
                </div>
                <div class="ch4-quote">
                    "The Self is a circle whose centre is
                    everywhere and whose circumference is
                    nowhere." &mdash; §44
                </div>
            </div>

            <!-- Phase 6: Scale reversal (bottom-left) -->
            <div class="ch4-annotation ch4-a--scale" data-phase="6">
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
                    The ego thinks it is the whole.
                    The Self knows the ego is a small
                    island in an infinite sea.
                </span>
            </div>

            <!-- Phase 7: Integration (top-right) -->
            <div class="ch4-annotation ch4-a--integration" data-phase="7">
                <hr class="ch4-rule ch4-rule--right">
                <div class="ch4-label">Complexio Oppositorum</div>
                <div class="ch4-text">
                    The Self holds all opposites in union —
                    thinking and feeling, sensation and
                    intuition. Not one function, but all
                    four, held in a living tension.
                </div>
                <span class="ch4-life">
                    You are not just your thoughts, nor
                    just your feelings. You are the whole
                    mandala.
                </span>
            </div>

            <!-- Interaction hint -->
            <div class="ch4-hint" data-phase="1">
                scroll to zoom · move to explore
            </div>
        `;

        ov.prepend(style);
        (this.container || this.canvas.parentElement).appendChild(ov);

        /* ── Phased reveal ── */
        this._annTimers = [];
        const phases = [
            { sel: '[data-phase="1"]', delay: 1500 },
            { sel: '[data-phase="2"]', delay: 5000 },
            { sel: '[data-phase="3"]', delay: 10000 },
            { sel: '[data-phase="4"]', delay: 16000 },
            { sel: '[data-phase="5"]', delay: 22000 },
            { sel: '[data-phase="6"]', delay: 28000 },
            { sel: '[data-phase="7"]', delay: 34000 },
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
        const seedScale = 0.4 + seedCycle * 1.0;
        this.center.scale.setScalar(seedScale);
        this.center.material.opacity = 0.6 + seedCycle * 0.3;
        this.centerGlow.material.opacity = 0.05 + seedCycle * 0.08;
        this.centerGlow.scale.setScalar(seedScale * 2);
        this.centerHalo.material.opacity = 0.02 + seedCycle * 0.04;
        this.centerHalo.scale.setScalar(seedScale * 3.5);
        this.centerLight.intensity = 0.8 + seedCycle * 1.5;

        /* ── Zone shells breathe gently ── */
        for (let i = 0; i < this.zoneShells.length; i++) {
            const z = this.zoneShells[i];
            const breathe = 1 + Math.sin(t * 0.2 + i * 1.5) * 0.02;
            z.ring.scale.setScalar(breathe);
            z.disc.scale.setScalar(breathe);
            z.ring.material.opacity = (0.10 + i * 0.03) + Math.sin(t * 0.3 + i) * 0.02;
        }

        /* ── Rotate quadrant particles ── */
        for (let q = 0; q < 4; q++) {
            this.quads[q].rotation.z = t * (0.015 + q * 0.004) * (q % 2 === 0 ? 1 : -1);
        }

        /* ── Mandala rings rotate & breathe ── */
        for (const mr of this.mandalaRings) {
            mr.ring.rotation.z += mr.speed;
            const breathe = 1 + Math.sin(t * 0.3 + mr.r) * 0.04;
            mr.ring.scale.setScalar(breathe);
        }

        /* ── Starfield subtle rotation ── */
        this.stars.rotation.y += 0.0001;

        /* ── Camera — intro zoom + mouse parallax ── */
        const introF = Math.min(this.introT / 6, 1);
        const ease = 1 - Math.pow(1 - introF, 3);
        const baseDist = THREE.MathUtils.lerp(28, 20, ease);
        this.camera.position.z += (this.zoomTarget * (baseDist / 20) - this.camera.position.z) * 0.05;
        this.camera.position.x = this.mouseSmooth.x * 2.5;
        this.camera.position.y = this.mouseSmooth.y * 2.5;
        this.camera.lookAt(0, 0, 0);

        /* ── Bloom pulse synced to seed ── */
        if (this.bloom) {
            this.bloom.strength = 1.2 + seedCycle * 0.3 + Math.sin(t * 0.04) * 0.1;
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
