/**
 * ThreeChristViz.js — Chapter 5: "Christ, a Symbol of the Self"
 * ═══════════════════════════════════════════════════════════════
 * Jung, Aion §68–126: Christ as the supreme Western symbol of
 * the Self — but a ONE-SIDED symbol (light only).
 *
 * Visual metaphors rendered here:
 *   1. Luminous cross = Christ image, axis mundi connecting heaven/hell
 *   2. Three bright gems + one dark gem = the 3+1 pattern:
 *      Trinity of light + the EXCLUDED FOURTH (shadow/evil/matter)
 *   3. Tetramorph ring = four evangelists (Lion, Eagle, Man, Bull)
 *      encircling Christ, forming a mandala of wholeness
 *   4. Light/dark split = the Christ/Antichrist polarity,
 *      the Self divided into light and shadow halves
 *   5. Cosmic tree roots = the tree whose roots reach to hell
 *
 * Mouse parallax; scroll zoom.
 * Annotations phase in over ~34 seconds (6 phases).
 * ═══════════════════════════════════════════════════════════════
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/* ── Palette ── */
const LIGHT_CLR = new THREE.Color('#f0f0ff');
const GOLD = new THREE.Color('#ffd700');
const GOLD_DIM = new THREE.Color('#a08520');
const SHADOW_CLR = new THREE.Color('#1a0505');
const SHADOW_GLOW = new THREE.Color('#330808');

/* Quadrant gem colors — theologically meaningful */
const GEM_COLORS = [
    new THREE.Color('#e8c547'),  // Q0: Gold  — Divine authority (Lion/Mark)
    new THREE.Color('#4a90d9'),  // Q1: Blue  — Wisdom, sky (Eagle/John)
    new THREE.Color('#d4665a'),  // Q2: Red   — Sacrifice (Man/Matthew)
    new THREE.Color('#1a0505'),  // Q3: Dark  — THE EXCLUDED FOURTH (Bull/Luke — earth, matter, shadow)
];
const GEM_LABELS = ['Lion', 'Eagle', 'Man', 'Bull'];
const GEM_NAMES = ['St Mark', 'St John', 'St Matthew', 'St Luke'];

/* Tetramorph ring color */
const TETRA_CLR = new THREE.Color('#2a2a50');

export default class ThreeChristViz extends BaseViz {
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
        R.setClearColor(0x020208);

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x020208, 0.008);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 150);
        this.camera.position.set(0, 1.5, 16);

        /* Mouse & zoom */
        this.mouse = new THREE.Vector2();
        this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => {
            this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        };
        addEventListener('mousemove', this._onMM);
        this.zoomTarget = 16;
        this._onWheel = e => {
            this.zoomTarget = Math.max(6, Math.min(28, this.zoomTarget + e.deltaY * 0.01));
        };
        addEventListener('wheel', this._onWheel, { passive: true });
        this.introT = 0;

        /* ── Build scene ── */
        this._buildCross();
        this._buildLightDarkSplit();
        this._buildQuadrantGems();
        this._buildTetramorph();
        this._buildCosmicRoots();
        this._buildSpectrumParticles();
        this._buildStarfield();
        this._buildAnnotations();

        /* Lighting */
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.15));
        const crossLight = new THREE.PointLight(0xf0f0ff, 0.6, 25);
        crossLight.position.set(0, 2, 2);
        this.scene.add(crossLight);

        /* Post-processing */
        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.5, 0.45, 0.3
        );
        this.composer.addPass(this.bloom);
    }

    /* ══════════════════════════════════════════════════════
     *  CROSS — axis mundi, the luminous Christ image
     *  with a subtle warm glow at intersection
     * ══════════════════════════════════════════════════════ */
    _buildCross() {
        const armMat = new THREE.MeshBasicMaterial({
            color: LIGHT_CLR, transparent: true, opacity: 0.85
        });

        /* Vertical arm (full height of cosmic tree) */
        const armV = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 9, 0.12), armMat
        );

        /* Horizontal arm (slightly above center, traditional cruciform) */
        const armH = new THREE.Mesh(
            new THREE.BoxGeometry(6.5, 0.12, 0.12), armMat.clone()
        );
        armH.position.y = 1.8;

        this.cross = new THREE.Group();
        this.cross.add(armV, armH);
        this.scene.add(this.cross);

        /* Intersection glow — divine radiance */
        this.crossGlow = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 16, 16),
            new THREE.MeshBasicMaterial({
                color: GOLD, transparent: true, opacity: 0.04,
                blending: THREE.AdditiveBlending
            })
        );
        this.crossGlow.position.y = 1.8;
        this.scene.add(this.crossGlow);

        /* Wider halo */
        this.crossHalo = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 16, 16),
            new THREE.MeshBasicMaterial({
                color: LIGHT_CLR, transparent: true, opacity: 0.015,
                blending: THREE.AdditiveBlending
            })
        );
        this.crossHalo.position.y = 1.8;
        this.scene.add(this.crossHalo);
    }

    /* ══════════════════════════════════════════════════════
     *  LIGHT/DARK SPLIT — the Christ/Antichrist duality
     *  Left side slightly lighter, right side slightly darker
     *  to show the one-sided nature of the symbol
     * ══════════════════════════════════════════════════════ */
    _buildLightDarkSplit() {
        /* Subtle gradient: light half (left) */
        const lightHalf = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshBasicMaterial({
                color: 0x0a0a15, transparent: true, opacity: 0.25,
                side: THREE.DoubleSide, depthWrite: false
            })
        );
        lightHalf.position.set(-5, 0, -3);
        this.scene.add(lightHalf);

        /* Dark half (right) — the shadow that follows */
        const darkHalf = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshBasicMaterial({
                color: 0x000000, transparent: true, opacity: 0.15,
                side: THREE.DoubleSide, depthWrite: false
            })
        );
        darkHalf.position.set(5, 0, -3);
        this.scene.add(darkHalf);
    }

    /* ══════════════════════════════════════════════════════
     *  QUADRANT GEMS — the 3+1 pattern
     *  Three luminous octahedra (Trinity of light) +
     *  One dark tetrahedron (the excluded fourth)
     * ══════════════════════════════════════════════════════ */
    _buildQuadrantGems() {
        this.gems = [];
        const positions = [
            [-3.5, 4.2, 0],  // Q0: top-left — Lion/Mark (gold)
            [3.5, 4.2, 0],  // Q1: top-right — Eagle/John (blue)
            [-3.5, -1.2, 0], // Q2: bottom-left — Man/Matthew (red)
            [3.5, -1.2, 0], // Q3: bottom-right — EXCLUDED (dark)
        ];

        for (let i = 0; i < 4; i++) {
            const isExcluded = (i === 3);
            const geo = isExcluded
                ? new THREE.TetrahedronGeometry(0.45)
                : new THREE.OctahedronGeometry(0.4);
            const mat = new THREE.MeshBasicMaterial({
                color: GEM_COLORS[i],
                transparent: true,
                opacity: isExcluded ? 0.08 : 0.6,
                blending: THREE.AdditiveBlending
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(...positions[i]);
            this.scene.add(mesh);

            /* Gem glow */
            if (!isExcluded) {
                const glow = new THREE.Mesh(
                    new THREE.SphereGeometry(0.6, 8, 8),
                    new THREE.MeshBasicMaterial({
                        color: GEM_COLORS[i], transparent: true,
                        opacity: 0.04, blending: THREE.AdditiveBlending
                    })
                );
                glow.position.copy(mesh.position);
                this.scene.add(glow);
            } else {
                /* Dark void around the excluded fourth */
                const void_sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(0.8, 8, 8),
                    new THREE.MeshBasicMaterial({
                        color: SHADOW_GLOW, transparent: true,
                        opacity: 0.06, blending: THREE.AdditiveBlending
                    })
                );
                void_sphere.position.copy(mesh.position);
                this.scene.add(void_sphere);
                this.shadowVoid = void_sphere;
            }

            this.gems.push({ mesh, isExcluded, baseOp: mat.opacity });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  TETRAMORPH — ring connecting the four evangelists
     *  (Lion, Eagle, Man, Bull) around the central Christ
     * ══════════════════════════════════════════════════════ */
    _buildTetramorph() {
        /* Tetramorph ring behind the cross */
        const pts = [];
        for (let i = 0; i <= 120; i++) {
            const a = (i / 120) * Math.PI * 2;
            const r = 5.5;
            pts.push(new THREE.Vector3(
                Math.cos(a) * r,
                Math.sin(a) * r + 1.5,
                -0.5
            ));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        this.tetramorphRing = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color: TETRA_CLR, transparent: true, opacity: 0.12,
            blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.tetramorphRing);

        /* Inner ring — tighter orbit */
        const pts2 = [];
        for (let i = 0; i <= 100; i++) {
            const a = (i / 100) * Math.PI * 2;
            const r = 4.2;
            const wobble = Math.sin(a * 4) * 0.15;
            pts2.push(new THREE.Vector3(
                Math.cos(a) * (r + wobble),
                Math.sin(a) * (r + wobble) + 1.5,
                -0.3
            ));
        }
        const geo2 = new THREE.BufferGeometry().setFromPoints(pts2);
        this.tetramorphInner = new THREE.Line(geo2, new THREE.LineBasicMaterial({
            color: GOLD_DIM, transparent: true, opacity: 0.06,
            blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.tetramorphInner);
    }

    /* ══════════════════════════════════════════════════════
     *  COSMIC ROOTS — "the tree whose roots reach to hell"
     *  Subtle downward tendrils from the cross base
     * ══════════════════════════════════════════════════════ */
    _buildCosmicRoots() {
        this.roots = [];
        const rootCount = 5;
        for (let i = 0; i < rootCount; i++) {
            const pts = [];
            const spread = (i - 2) * 0.6;
            const depth = 3 + Math.random() * 2;
            for (let j = 0; j <= 30; j++) {
                const t = j / 30;
                const x = spread * t + Math.sin(t * 4 + i) * 0.3;
                const y = -4.5 - t * depth;
                pts.push(new THREE.Vector3(x, y, (Math.random() - 0.5) * 0.3));
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: SHADOW_CLR, transparent: true,
                opacity: 0.04 + i * 0.01
            }));
            this.scene.add(line);
            this.roots.push(line);
        }
    }

    /* ══════════════════════════════════════════════════════
     *  SPECTRUM PARTICLES — refracted light around the cross
     * ══════════════════════════════════════════════════════ */
    _buildSpectrumParticles() {
        const N = 250;
        const pos = new Float32Array(N * 3);
        const colors = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 0.8 + Math.random() * 5;
            pos[i * 3] = Math.cos(a) * r;
            pos[i * 3 + 1] = Math.sin(a) * r + 1.5;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
            const c = GEM_COLORS[i % 3]; // only first 3 colors (light)
            colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.specPts = new THREE.Points(geo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.035, transparent: true,
            opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false
        }));
        this.scene.add(this.specPts);
    }

    /* ══════════════════════════════════════════════════════
     *  STARFIELD
     * ══════════════════════════════════════════════════════ */
    _buildStarfield() {
        const N = 400;
        const pos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 80;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
            pos[i * 3 + 2] = -10 - Math.random() * 60;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.stars = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x1a1a40, size: 0.04, transparent: true, opacity: 0.25,
            depthWrite: false
        }));
        this.scene.add(this.stars);
    }

    /* ══════════════════════════════════════════════════════
     *  ANNOTATIONS — the visual-first information layer
     *
     *  6 Phases over ~34 seconds:
     *   1. Title + subtitle + interaction hint
     *   2. "The Cross" center annotation
     *   3. The three luminous gem labels (Lion, Eagle, Man)
     *   4. The excluded fourth label + "privatio boni"
     *   5. "One-Sided Symbol" annotation + Christ/Antichrist
     *   6. "The Cosmic Tree" roots annotation
     * ══════════════════════════════════════════════════════ */
    _buildAnnotations() {
        const ov = this._annotationOverlay = document.createElement('div');
        ov.className = 'ch5-annotations';
        ov.setAttribute('aria-hidden', 'true');

        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

            .ch5-annotations {
                position: absolute; inset: 0;
                pointer-events: none; z-index: 10;
                font-family: 'Cormorant Garamond', 'Georgia', serif;
                color: rgba(240, 240, 255, 0.8);
                overflow: hidden;
            }

            /* ── Phase fade-in ── */
            .ch5-annotations [data-phase] {
                opacity: 0;
                transform: translateY(8px);
                transition: opacity 3s cubic-bezier(.25,.46,.45,.94),
                            transform 3s cubic-bezier(.25,.46,.45,.94);
            }
            .ch5-annotations [data-phase].vis {
                opacity: 1;
                transform: translateY(0);
            }

            /* ── Header ── */
            .ch5-header {
                position: absolute;
                top: 36px; left: 44px;
            }
            .ch5-eyebrow {
                font-size: 10px;
                letter-spacing: 5px;
                text-transform: uppercase;
                color: rgba(240, 240, 255, 0.3);
            }
            .ch5-title {
                font-family: 'Instrument Serif', serif;
                font-size: 38px;
                font-style: italic;
                color: rgba(240, 240, 255, 0.6);
                line-height: 1.15;
                margin: 4px 0 6px;
            }
            .ch5-subtitle {
                font-style: italic;
                font-size: 13px;
                color: rgba(240, 240, 255, 0.25);
                letter-spacing: 1px;
            }

            /* ── Annotation blocks ── */
            .ch5-anno {
                position: absolute;
                max-width: 210px;
            }
            .ch5-label {
                font-family: 'Instrument Serif', serif;
                font-size: 17px;
                font-style: italic;
                margin-bottom: 5px;
            }
            .ch5-text {
                font-size: 13px;
                line-height: 1.6;
                font-weight: 300;
            }
            .ch5-life {
                display: block;
                margin-top: 7px;
                font-style: italic;
                font-size: 12px;
                line-height: 1.45;
            }
            .ch5-rule {
                width: 20px;
                border: none;
                border-top: 1px solid currentColor;
                opacity: 0.15;
                margin: 8px 0;
            }
            .ch5-rule--right { margin-left: auto; }

            /* ── Cross annotation (left side) ── */
            .ch5-a--cross {
                top: 26%; left: 44px;
                color: rgba(240, 240, 255, 0.65);
            }
            .ch5-a--cross .ch5-label {
                color: rgba(240, 240, 255, 0.55);
            }
            .ch5-a--cross .ch5-text {
                color: rgba(240, 240, 255, 0.4);
            }
            .ch5-a--cross .ch5-life {
                color: rgba(240, 240, 255, 0.22);
            }

            /* ── One-sided symbol (right side) ── */
            .ch5-a--onesided {
                top: 26%; right: 44px;
                text-align: right;
                color: rgba(240, 240, 255, 0.55);
            }
            .ch5-a--onesided .ch5-label {
                color: rgba(240, 240, 255, 0.5);
            }
            .ch5-a--onesided .ch5-text {
                color: rgba(240, 240, 255, 0.35);
            }
            .ch5-a--onesided .ch5-life {
                color: rgba(240, 240, 255, 0.2);
            }

            /* ── Cosmic tree (bottom-left) ── */
            .ch5-a--roots {
                bottom: 50px; left: 44px;
                color: rgba(240, 240, 255, 0.5);
            }
            .ch5-a--roots .ch5-label {
                color: rgba(100, 80, 70, 0.7);
            }
            .ch5-a--roots .ch5-text {
                color: rgba(240, 240, 255, 0.3);
            }

            /* ── Excluded fourth (bottom-right) ── */
            .ch5-a--excluded {
                bottom: 50px; right: 44px;
                text-align: right;
                color: rgba(200, 150, 150, 0.5);
            }
            .ch5-a--excluded .ch5-label {
                color: rgba(180, 60, 60, 0.5);
            }
            .ch5-a--excluded .ch5-text {
                color: rgba(200, 150, 150, 0.35);
            }
            .ch5-a--excluded .ch5-life {
                color: rgba(200, 150, 150, 0.2);
            }

            /* ── Gem micro-labels (near each gem) ── */
            .ch5-gem-label {
                position: absolute;
                font-family: 'Instrument Serif', serif;
                font-style: italic;
                font-size: 11px;
                letter-spacing: 2px;
                opacity: 0;
                transition: opacity 2.5s ease;
            }
            .ch5-gem-label.vis { opacity: 1; }

            /* Position each gem label near its gem */
            .ch5-gem--lion {
                top: 22%; left: 18%;
                color: rgba(232, 197, 71, 0.5);
            }
            .ch5-gem--eagle {
                top: 22%; right: 18%;
                color: rgba(74, 144, 217, 0.5);
                text-align: right;
            }
            .ch5-gem--man {
                bottom: 38%; left: 18%;
                color: rgba(212, 102, 90, 0.5);
            }
            .ch5-gem--bull {
                bottom: 38%; right: 18%;
                color: rgba(120, 50, 50, 0.35);
                text-align: right;
            }
            .ch5-gem-desc {
                display: block;
                font-family: 'Cormorant Garamond', serif;
                font-style: normal;
                font-size: 8.5px;
                letter-spacing: 1px;
                margin-top: 2px;
                opacity: 0.65;
            }

            /* ── Tetramorph label ── */
            .ch5-tetra-label {
                position: absolute;
                top: 12%; left: 50%;
                transform: translateX(-50%);
                font-family: 'Cormorant Garamond', serif;
                font-size: 8px;
                letter-spacing: 4px;
                text-transform: uppercase;
                color: rgba(42, 42, 80, 0.4);
            }

            /* ── Quote ── */
            .ch5-quote {
                font-style: italic;
                font-size: 11.5px;
                color: inherit;
                opacity: 0.7;
                line-height: 1.45;
                margin-top: 8px;
            }

            /* ── Latin term ── */
            .ch5-latin {
                font-family: 'Instrument Serif', serif;
                font-style: italic;
                font-size: 12px;
                letter-spacing: 2px;
                margin-top: 6px;
                display: block;
            }

            /* ── Hint ── */
            .ch5-hint {
                position: absolute;
                bottom: 18px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 8.5px;
                letter-spacing: 3px;
                text-transform: uppercase;
                color: rgba(240, 240, 255, 0.12);
            }

            /* ── Pulse animation for excluded fourth ── */
            @keyframes ch5-shadow-pulse {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.5; }
            }
            .ch5-a--excluded .ch5-label {
                animation: ch5-shadow-pulse 5s ease-in-out infinite;
            }

            /* ── Media queries ── */
            @media (max-width: 768px) {
                .ch5-title { font-size: 26px; }
                .ch5-anno { max-width: 150px; }
                .ch5-gem-label { display: none; }
                .ch5-tetra-label { display: none; }
            }
        `;

        /* ── HTML ── */
        ov.innerHTML = `
            <!-- Phase 1: Title -->
            <div class="ch5-header" data-phase="1">
                <div class="ch5-eyebrow">Chapter V</div>
                <div class="ch5-title">Christ, a Symbol<br>of the Self</div>
                <div class="ch5-subtitle">a light that casts its own shadow</div>
            </div>

            <!-- Phase 2: Cross annotation -->
            <div class="ch5-anno ch5-a--cross" data-phase="2">
                <hr class="ch5-rule">
                <div class="ch5-label">The Luminous Cross</div>
                <div class="ch5-text">
                    Axis mundi — the vertical line joining
                    heaven and hell. At the intersection:
                    the moment of maximum suffering AND
                    maximum meaning.
                </div>
                <span class="ch5-life">
                    Crucified between two thieves — one ascending,
                    one descending. The Self hangs between
                    irreconcilable opposites.
                </span>
            </div>

            <!-- Phase 3: Gem labels (tetramorph) -->
            <div class="ch5-gem-label ch5-gem--lion" data-phase="3">
                Lion
                <span class="ch5-gem-desc">St Mark · sovereignty</span>
            </div>
            <div class="ch5-gem-label ch5-gem--eagle" data-phase="3">
                Eagle
                <span class="ch5-gem-desc">St John · spirit</span>
            </div>
            <div class="ch5-gem-label ch5-gem--man" data-phase="3">
                Man
                <span class="ch5-gem-desc">St Matthew · incarnation</span>
            </div>
            <div class="ch5-gem-label ch5-gem--bull" data-phase="3">
                Bull
                <span class="ch5-gem-desc">St Luke · earth · excluded</span>
            </div>
            <div class="ch5-tetra-label" data-phase="3">
                the tetramorph
            </div>

            <!-- Phase 4: Excluded fourth annotation -->
            <div class="ch5-anno ch5-a--excluded" data-phase="4">
                <hr class="ch5-rule ch5-rule--right">
                <div class="ch5-label">The Excluded Fourth</div>
                <div class="ch5-text">
                    Trinity requires THREE — but wholeness
                    requires four. The missing fourth is
                    matter, earth, shadow, evil — everything
                    the light refuses to see.
                </div>
                <span class="ch5-latin">privatio boni</span>
                <span class="ch5-life">
                    Evil as "absence of good" — a formula
                    that refuses to grant darkness its own
                    substance. But what you banish does
                    not disappear.
                </span>
            </div>

            <!-- Phase 5: One-sided symbol -->
            <div class="ch5-anno ch5-a--onesided" data-phase="5">
                <hr class="ch5-rule ch5-rule--right">
                <div class="ch5-label">A One-Sided Symbol</div>
                <div class="ch5-text">
                    Christ represents only the LIGHT half
                    of the Self. Perfection — not completeness.
                    The Antichrist follows necessarily, as
                    shadow follows the body.
                </div>
                <div class="ch5-quote">
                    "The Antichrist develops as a perverse
                    imitator of Christ's life — an imitating
                    spirit of evil." &mdash; §77
                </div>
            </div>

            <!-- Phase 6: Cosmic tree -->
            <div class="ch5-anno ch5-a--roots" data-phase="6">
                <hr class="ch5-rule">
                <div class="ch5-label">The Cosmic Tree</div>
                <div class="ch5-text">
                    A tree whose roots reach to hell.
                    The cross is also a living tree — rooted
                    in darkness, branching into light.
                    Without roots, no blossom.
                </div>
            </div>

            <!-- Hint -->
            <div class="ch5-hint" data-phase="1">
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
            { sel: '[data-phase="3"]', delay: 11000 },
            { sel: '[data-phase="4"]', delay: 17000 },
            { sel: '[data-phase="5"]', delay: 23000 },
            { sel: '[data-phase="6"]', delay: 29000 },
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

        /* ── Cross glow breathing ── */
        const glow = (Math.sin(t * 0.4) + 1) / 2;
        this.crossGlow.material.opacity = 0.03 + glow * 0.03;
        this.crossHalo.material.opacity = 0.01 + glow * 0.015;
        this.cross.rotation.z = Math.sin(t * 0.04) * 0.015;

        /* ── Gem rotation + hover-reveal ── */
        for (let i = 0; i < this.gems.length; i++) {
            const g = this.gems[i];
            g.mesh.rotation.y += g.isExcluded ? -0.008 : 0.006;
            g.mesh.rotation.x = Math.sin(t * 0.25 + i) * 0.08;

            /* Float up/down gently */
            g.mesh.position.y += Math.sin(t * 0.3 + i * 1.5) * 0.001;

            /* Hover proximity brightening */
            const dx = g.mesh.position.x - this.mouseSmooth.x * 5;
            const dy = g.mesh.position.y - this.mouseSmooth.y * 5;
            const d = Math.sqrt(dx * dx + dy * dy);
            const boost = Math.max(0, 1 - d / 4);
            g.mesh.material.opacity = g.baseOp + boost * 0.35;
        }

        /* ── Shadow void pulse ── */
        if (this.shadowVoid) {
            const shadowPulse = (Math.sin(t * 0.2) + 1) / 2;
            this.shadowVoid.material.opacity = 0.04 + shadowPulse * 0.06;
            this.shadowVoid.scale.setScalar(1 + shadowPulse * 0.3);
        }

        /* ── Tetramorph ring subtle rotation ── */
        this.tetramorphRing.rotation.z += 0.0008;
        this.tetramorphInner.rotation.z -= 0.001;

        /* ── Spectrum particles drift ── */
        this.specPts.rotation.z += 0.0008;
        this.specPts.rotation.y += 0.0003;

        /* ── Starfield ── */
        this.stars.rotation.y += 0.00008;

        /* ── Camera — intro zoom + mouse parallax ── */
        const introF = Math.min(this.introT / 5, 1);
        const ease = 1 - Math.pow(1 - introF, 3);
        const baseDist = THREE.MathUtils.lerp(24, 16, ease);
        this.camera.position.z += (this.zoomTarget * (baseDist / 16) - this.camera.position.z) * 0.05;
        this.camera.position.x = this.mouseSmooth.x * 2.5;
        this.camera.position.y = 1.5 + this.mouseSmooth.y * 2;
        this.camera.lookAt(0, 1.5, 0);

        /* ── Bloom ── */
        if (this.bloom) {
            this.bloom.strength = 1.3 + glow * 0.3;
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
