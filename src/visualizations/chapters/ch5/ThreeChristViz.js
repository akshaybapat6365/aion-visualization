/**
 * ThreeChristViz.js — Chapter 5: "Christ, a Symbol of the Self"
 * ═══════════════════════════════════════════════════════════════
 * Jung, Aion §68–126: Christ as the supreme Western symbol of
 * the Self — but a ONE-SIDED symbol (light only).
 *
 * v3 — COMPREHENSION-FIRST rewrite.
 * Every visual element links to its annotation.
 * A newcomer who has never read Jung should understand the core
 * argument by watching this scene unfold.
 *
 * Visual metaphors:
 *   1. Luminous cross = axis mundi (heaven/hell axis)
 *   2. 3 bright gems + 1 VISIBLE dark gem = 3+1 pattern
 *   3. Trinity ring (3/4 golden arc, gap at excluded)
 *   4. Connecting lines: gem → cross (3 solid, 1 broken)
 *   5. Tetramorph ring + cardinal dots
 *   6. Light/dark background split = Christ/Antichrist polarity
 *   7. Cosmic tree roots descending from cross base
 *   8. Leader lines from annotations to visual subjects
 *
 * Mouse parallax; scroll zoom.
 * Annotations phase in over ~40 seconds (7 phases).
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
const SHADOW_CLR = new THREE.Color('#2a0808');
const SHADOW_GLOW = new THREE.Color('#551010');

/* Quadrant gem colors — theologically meaningful */
const GEM_COLORS = [
    new THREE.Color('#e8c547'),  // Q0: Gold  — Lion/Mark  (sovereignty)
    new THREE.Color('#4a90d9'),  // Q1: Blue  — Eagle/John (spirit)
    new THREE.Color('#d4665a'),  // Q2: Red   — Man/Matthew (sacrifice)
    new THREE.Color('#3a1212'),  // Q3: Dark  — THE EXCLUDED FOURTH (Bull/Luke)
];

/* Connecting-line colors */
const CONN_LIGHT = new THREE.Color('#c0c0e0');
const CONN_DARK = new THREE.Color('#601818');

/* Tetramorph ring */
const TETRA_CLR = new THREE.Color('#2a2a50');

/* Trinity ring */
const TRINITY_CLR = new THREE.Color('#c8a82a');

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
        this._buildConnectingLines();
        this._buildTrinityRing();
        this._buildTetramorph();
        this._buildCosmicRoots();
        this._buildExcludedSparks();
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
     *  CROSS — axis mundi
     * ══════════════════════════════════════════════════════ */
    _buildCross() {
        const armMat = new THREE.MeshBasicMaterial({
            color: LIGHT_CLR, transparent: true, opacity: 0.85
        });

        const armV = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 9, 0.12), armMat
        );
        const armH = new THREE.Mesh(
            new THREE.BoxGeometry(6.5, 0.12, 0.12), armMat.clone()
        );
        armH.position.y = 1.8;

        this.cross = new THREE.Group();
        this.cross.add(armV, armH);
        this.scene.add(this.cross);

        /* Intersection glow */
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

        /* Micro-label at intersection: "axis mundi" */
        this.crossLabel = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshBasicMaterial({
                color: GOLD, transparent: true, opacity: 0.08,
                blending: THREE.AdditiveBlending
            })
        );
        this.crossLabel.position.set(0, 1.8, 0.3);
        this.scene.add(this.crossLabel);
    }

    /* ══════════════════════════════════════════════════════
     *  LIGHT/DARK SPLIT — the Christ/Antichrist polarity
     *  [D] Now visually obvious with stronger contrast
     * ══════════════════════════════════════════════════════ */
    _buildLightDarkSplit() {
        /* Light half (left) — warmer */
        const lightHalf = new THREE.Mesh(
            new THREE.PlaneGeometry(22, 24),
            new THREE.MeshBasicMaterial({
                color: 0x0c0c1e, transparent: true, opacity: 0.4,
                side: THREE.DoubleSide, depthWrite: false
            })
        );
        lightHalf.position.set(-6, 0, -4);
        this.scene.add(lightHalf);

        /* Dark half (right) — the shadow that follows */
        const darkHalf = new THREE.Mesh(
            new THREE.PlaneGeometry(22, 24),
            new THREE.MeshBasicMaterial({
                color: 0x000002, transparent: true, opacity: 0.3,
                side: THREE.DoubleSide, depthWrite: false
            })
        );
        darkHalf.position.set(6, 0, -4);
        this.scene.add(darkHalf);

        /* Faint vertical divider at the cross — the cross IS the border */
        const dividerPts = [
            new THREE.Vector3(0, -12, -3),
            new THREE.Vector3(0, 12, -3)
        ];
        const divGeo = new THREE.BufferGeometry().setFromPoints(dividerPts);
        this.divider = new THREE.Line(divGeo, new THREE.LineBasicMaterial({
            color: 0x202040, transparent: true, opacity: 0.08
        }));
        this.scene.add(this.divider);
    }

    /* ══════════════════════════════════════════════════════
     *  QUADRANT GEMS — the 3+1 pattern
     *  [A] Excluded fourth is now DRAMATICALLY visible
     * ══════════════════════════════════════════════════════ */
    _buildQuadrantGems() {
        this.gems = [];
        this.gemPositions = [
            [-3.5, 4.2, 0],  // Q0: top-left — Lion/Mark (gold)
            [3.5, 4.2, 0],   // Q1: top-right — Eagle/John (blue)
            [-3.5, -1.2, 0], // Q2: bottom-left — Man/Matthew (red)
            [3.5, -1.2, 0],  // Q3: bottom-right — EXCLUDED (dark)
        ];

        for (let i = 0; i < 4; i++) {
            const isExcluded = (i === 3);
            const geo = isExcluded
                ? new THREE.TetrahedronGeometry(0.5)
                : new THREE.OctahedronGeometry(0.4);
            const mat = new THREE.MeshBasicMaterial({
                color: GEM_COLORS[i],
                transparent: true,
                opacity: isExcluded ? 0.3 : 0.6,       // [A] was 0.08
                blending: THREE.AdditiveBlending
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(...this.gemPositions[i]);
            this.scene.add(mesh);

            if (!isExcluded) {
                /* Solid glow halo for the accepted three */
                const glow = new THREE.Mesh(
                    new THREE.SphereGeometry(0.65, 12, 12),
                    new THREE.MeshBasicMaterial({
                        color: GEM_COLORS[i], transparent: true,
                        opacity: 0.06, blending: THREE.AdditiveBlending
                    })
                );
                glow.position.copy(mesh.position);
                this.scene.add(glow);
            } else {
                /* [A] BROKEN HALO — dashed ring around the excluded fourth */
                const brokenHaloSegs = 12;
                this.brokenHaloParts = [];
                for (let s = 0; s < brokenHaloSegs; s++) {
                    if (s % 3 === 2) continue; // gaps — the halo is fragmented
                    const a1 = (s / brokenHaloSegs) * Math.PI * 2;
                    const a2 = ((s + 0.6) / brokenHaloSegs) * Math.PI * 2;
                    const pts = [];
                    for (let k = 0; k <= 8; k++) {
                        const a = a1 + (a2 - a1) * (k / 8);
                        const r = 0.85;
                        pts.push(new THREE.Vector3(
                            mesh.position.x + Math.cos(a) * r,
                            mesh.position.y + Math.sin(a) * r,
                            0.1
                        ));
                    }
                    const sg = new THREE.BufferGeometry().setFromPoints(pts);
                    const sl = new THREE.Line(sg, new THREE.LineBasicMaterial({
                        color: SHADOW_GLOW, transparent: true,
                        opacity: 0.3, blending: THREE.AdditiveBlending
                    }));
                    this.scene.add(sl);
                    this.brokenHaloParts.push(sl);
                }

                /* Larger crimson void sphere */
                const void_sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(1.1, 12, 12),
                    new THREE.MeshBasicMaterial({
                        color: SHADOW_GLOW, transparent: true,
                        opacity: 0.08, blending: THREE.AdditiveBlending
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
     *  [B] CONNECTING LINES — gems to cross center
     *  3 solid light lines + 1 broken dark line
     *  Visually says: "these four are parts of one system"
     * ══════════════════════════════════════════════════════ */
    _buildConnectingLines() {
        this.connLines = [];
        const center = new THREE.Vector3(0, 1.8, 0);

        for (let i = 0; i < 4; i++) {
            const isExcluded = (i === 3);
            const from = new THREE.Vector3(...this.gemPositions[i]);

            if (!isExcluded) {
                /* Solid connecting line */
                const pts = [from, center];
                const geo = new THREE.BufferGeometry().setFromPoints(pts);
                const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                    color: CONN_LIGHT, transparent: true,
                    opacity: 0.06
                }));
                this.scene.add(line);
                this.connLines.push({ line, isExcluded: false });
            } else {
                /* Dashed / broken line — the rejected connection */
                const segCount = 8;
                for (let s = 0; s < segCount; s++) {
                    if (s % 2 === 1) continue; // skip every other = dashes
                    const t1 = s / segCount;
                    const t2 = (s + 0.7) / segCount;
                    const p1 = from.clone().lerp(center.clone(), t1);
                    const p2 = from.clone().lerp(center.clone(), t2);
                    const sg = new THREE.BufferGeometry().setFromPoints([p1, p2]);
                    const sl = new THREE.Line(sg, new THREE.LineBasicMaterial({
                        color: CONN_DARK, transparent: true,
                        opacity: 0.12
                    }));
                    this.scene.add(sl);
                    this.connLines.push({ line: sl, isExcluded: true });
                }
            }
        }
    }

    /* ══════════════════════════════════════════════════════
     *  [C] TRINITY RING — 3/4 golden arc
     *  Connects the three luminous gems.
     *  The gap at the excluded fourth visually shows
     *  "the circle WANTS to close but can't."
     * ══════════════════════════════════════════════════════ */
    _buildTrinityRing() {
        /* The 3 luminous gems are at positions 0, 1, 2.
         * We draw arcs between them forming 3/4 of a circle,
         * with a visible gap at position 3 (excluded). */
        const cx = 0, cy = 1.5;
        const r = 5.0;

        /* Calculate angles to each gem from center */
        const angles = this.gemPositions.map(p =>
            Math.atan2(p[1] - cy, p[0] - cx)
        );

        /* Sort the first 3 by angle, draw arcs between them */
        const trinityAngles = [angles[0], angles[1], angles[2]].sort((a, b) => a - b);

        /* Draw arc segments connecting the 3, leaving gap at excluded */
        this.trinityArcs = [];
        const arcResolution = 40;

        for (let seg = 0; seg < 3; seg++) {
            const startA = trinityAngles[seg];
            const endA = trinityAngles[(seg + 1) % 3];
            let sweep = endA - startA;
            if (sweep < 0) sweep += Math.PI * 2;
            if (sweep > Math.PI) continue; // this is the gap side

            const pts = [];
            for (let k = 0; k <= arcResolution; k++) {
                const a = startA + sweep * (k / arcResolution);
                pts.push(new THREE.Vector3(
                    cx + Math.cos(a) * r,
                    cy + Math.sin(a) * r,
                    -0.2
                ));
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const arc = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: TRINITY_CLR, transparent: true,
                opacity: 0.15, blending: THREE.AdditiveBlending
            }));
            this.scene.add(arc);
            this.trinityArcs.push(arc);
        }

        /* Small dots at each luminous gem position on the ring */
        for (let i = 0; i < 3; i++) {
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: TRINITY_CLR, transparent: true,
                    opacity: 0.3, blending: THREE.AdditiveBlending
                })
            );
            dot.position.set(
                cx + Math.cos(angles[i]) * r,
                cy + Math.sin(angles[i]) * r,
                -0.2
            );
            this.scene.add(dot);
        }

        /* Gap marker — faint X or void at excluded position */
        const excA = angles[3];
        const gapMark = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 6, 6),
            new THREE.MeshBasicMaterial({
                color: SHADOW_GLOW, transparent: true,
                opacity: 0.15, blending: THREE.AdditiveBlending
            })
        );
        gapMark.position.set(
            cx + Math.cos(excA) * r,
            cy + Math.sin(excA) * r,
            -0.2
        );
        this.scene.add(gapMark);
        this.trinityGapMark = gapMark;
    }

    /* ══════════════════════════════════════════════════════
     *  TETRAMORPH — [H] Now more visible with cardinal dots
     * ══════════════════════════════════════════════════════ */
    _buildTetramorph() {
        const cx = 0, cy = 1.5;
        const pts = [];
        for (let i = 0; i <= 120; i++) {
            const a = (i / 120) * Math.PI * 2;
            const r = 5.5;
            pts.push(new THREE.Vector3(
                Math.cos(a) * r + cx,
                Math.sin(a) * r + cy,
                -0.5
            ));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        this.tetramorphRing = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color: TETRA_CLR, transparent: true, opacity: 0.2,  // [H] was 0.12
            blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.tetramorphRing);

        /* Inner wobble ring */
        const pts2 = [];
        for (let i = 0; i <= 100; i++) {
            const a = (i / 100) * Math.PI * 2;
            const r = 4.2;
            const wobble = Math.sin(a * 4) * 0.15;
            pts2.push(new THREE.Vector3(
                Math.cos(a) * (r + wobble) + cx,
                Math.sin(a) * (r + wobble) + cy,
                -0.3
            ));
        }
        const geo2 = new THREE.BufferGeometry().setFromPoints(pts2);
        this.tetramorphInner = new THREE.Line(geo2, new THREE.LineBasicMaterial({
            color: GOLD_DIM, transparent: true, opacity: 0.08,
            blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.tetramorphInner);

        /* [H] Cardinal dots at each gem position on the ring */
        this.cardinalDots = [];
        const angles = this.gemPositions.map(p =>
            Math.atan2(p[1] - cy, p[0] - cx)
        );
        for (let i = 0; i < 4; i++) {
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: GEM_COLORS[i], transparent: true,
                    opacity: i === 3 ? 0.15 : 0.3,
                    blending: THREE.AdditiveBlending
                })
            );
            dot.position.set(
                cx + Math.cos(angles[i]) * 5.5,
                cy + Math.sin(angles[i]) * 5.5,
                -0.5
            );
            this.scene.add(dot);
            this.cardinalDots.push(dot);
        }
    }

    /* ══════════════════════════════════════════════════════
     *  COSMIC ROOTS — "the tree whose roots reach to hell"
     * ══════════════════════════════════════════════════════ */
    _buildCosmicRoots() {
        this.roots = [];
        const rootCount = 7;
        for (let i = 0; i < rootCount; i++) {
            const pts = [];
            const spread = (i - 3) * 0.5;
            const depth = 3 + Math.random() * 2.5;
            for (let j = 0; j <= 35; j++) {
                const t = j / 35;
                const x = spread * t + Math.sin(t * 4 + i) * 0.35;
                const y = -4.5 - t * depth;
                pts.push(new THREE.Vector3(x, y, (Math.random() - 0.5) * 0.4));
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: SHADOW_CLR, transparent: true,
                opacity: 0.06 + i * 0.012
            }));
            this.scene.add(line);
            this.roots.push(line);
        }
    }

    /* ══════════════════════════════════════════════════════
     *  [A continued] RED SPARKS around the excluded fourth
     *  Tiny crimson particles "leaking" from the void
     * ══════════════════════════════════════════════════════ */
    _buildExcludedSparks() {
        const N = 30;
        const pos = new Float32Array(N * 3);
        const excPos = this.gemPositions[3];
        for (let i = 0; i < N; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 0.3 + Math.random() * 1.2;
            pos[i * 3] = excPos[0] + Math.cos(a) * r;
            pos[i * 3 + 1] = excPos[1] + Math.sin(a) * r;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.excludedSparks = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x881818, size: 0.04, transparent: true,
            opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false
        }));
        this.scene.add(this.excludedSparks);
    }

    /* ── SPECTRUM PARTICLES ── */
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
            const c = GEM_COLORS[i % 3]; // only light colors
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

    /* ── STARFIELD ── */
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
     *  ANNOTATIONS — v3 comprehension-first layer
     *
     *  7 Phases over ~40 seconds:
     *   1. Title + subtitle
     *   2. Framing sentence (the "WHY" for newcomers)
     *   3. "The Luminous Cross" + leader line
     *   4. Gem labels (Lion, Eagle, Man, Bull) + descriptions
     *   5. "The Excluded Fourth" + privatio boni
     *   6. "A One-Sided Symbol" + Christ/Antichrist
     *   7. "The Cosmic Tree" + roots
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

            /* ═══ [F] FRAMING SENTENCE ═══ */
            .ch5-framing {
                position: absolute;
                top: 170px; left: 44px;
                max-width: 320px;
                font-size: 14px;
                font-weight: 300;
                line-height: 1.65;
                color: rgba(240, 240, 255, 0.45);
                border-left: 2px solid rgba(200, 168, 42, 0.2);
                padding-left: 14px;
            }
            .ch5-framing em {
                color: rgba(240, 240, 255, 0.6);
                font-style: italic;
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

            /* ═══ [E] LEADER LINES (CSS) ═══ */
            .ch5-leader {
                position: absolute;
                background: none;
                pointer-events: none;
            }
            .ch5-leader--cross {
                top: 38%;
                left: 255px;
                width: calc(35% - 255px);
                height: 1px;
                border-top: 1px dashed rgba(240, 240, 255, 0.08);
            }
            .ch5-leader--excluded {
                bottom: 180px;
                right: 255px;
                width: calc(35% - 255px);
                height: 1px;
                border-top: 1px dashed rgba(180, 60, 60, 0.12);
            }
            .ch5-leader--onesided {
                top: 38%;
                right: 255px;
                width: calc(20% - 255px);
                min-width: 40px;
                height: 1px;
                border-top: 1px dashed rgba(240, 240, 255, 0.06);
            }
            .ch5-leader--roots {
                bottom: 100px;
                left: 255px;
                width: calc(30% - 255px);
                height: 1px;
                border-top: 1px dashed rgba(100, 80, 70, 0.1);
            }

            /* ── Cross annotation (left) ── */
            .ch5-a--cross {
                top: 30%; left: 44px;
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

            /* ── One-sided symbol (right) ── */
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
                color: rgba(200, 150, 150, 0.6);
            }
            .ch5-a--excluded .ch5-label {
                color: rgba(180, 60, 60, 0.6);
            }
            .ch5-a--excluded .ch5-text {
                color: rgba(200, 150, 150, 0.4);
            }
            .ch5-a--excluded .ch5-life {
                color: rgba(200, 150, 150, 0.25);
            }

            /* ═══ GEM LABELS — [G] enhanced with newcomer descriptions ═══ */
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

            .ch5-gem--lion {
                top: 20%; left: 16%;
                color: rgba(232, 197, 71, 0.6);
            }
            .ch5-gem--eagle {
                top: 20%; right: 16%;
                color: rgba(74, 144, 217, 0.6);
                text-align: right;
            }
            .ch5-gem--man {
                bottom: 40%; left: 16%;
                color: rgba(212, 102, 90, 0.6);
            }
            .ch5-gem--bull {
                bottom: 40%; right: 16%;
                color: rgba(160, 60, 60, 0.55);
                text-align: right;
            }
            .ch5-gem-desc {
                display: block;
                font-family: 'Cormorant Garamond', serif;
                font-style: normal;
                font-size: 9px;
                letter-spacing: 1px;
                margin-top: 2px;
                opacity: 0.7;
            }
            /* [G] newcomer hint under each gem */
            .ch5-gem-explain {
                display: block;
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 9.5px;
                letter-spacing: 0;
                margin-top: 3px;
                opacity: 0.45;
                max-width: 120px;
                line-height: 1.35;
            }
            .ch5-gem--eagle .ch5-gem-explain,
            .ch5-gem--bull .ch5-gem-explain {
                margin-left: auto;
            }

            /* ── Tetramorph + trinity labels ── */
            .ch5-tetra-label {
                position: absolute;
                top: 11%; left: 50%;
                transform: translateX(-50%);
                font-family: 'Cormorant Garamond', serif;
                font-size: 8.5px;
                letter-spacing: 4px;
                text-transform: uppercase;
                color: rgba(42, 42, 80, 0.45);
            }
            .ch5-trinity-label {
                position: absolute;
                top: 14.5%; left: 50%;
                transform: translateX(-50%);
                font-family: 'Cormorant Garamond', serif;
                font-size: 8px;
                letter-spacing: 3px;
                text-transform: uppercase;
                color: rgba(200, 168, 42, 0.3);
            }
            /* [H] "the whole self" at center */
            .ch5-center-label {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-family: 'Cormorant Garamond', serif;
                font-size: 7.5px;
                letter-spacing: 3px;
                text-transform: uppercase;
                color: rgba(240, 240, 255, 0.12);
                white-space: nowrap;
            }

            /* [D] Light/Shadow micro-labels */
            .ch5-split-label {
                position: absolute;
                top: 50%;
                font-family: 'Cormorant Garamond', serif;
                font-size: 7px;
                letter-spacing: 5px;
                text-transform: uppercase;
                opacity: 0;
                transition: opacity 3s ease;
            }
            .ch5-split-label.vis { opacity: 1; }
            .ch5-split--light {
                left: 6%;
                color: rgba(200, 200, 240, 0.1);
            }
            .ch5-split--shadow {
                right: 6%;
                color: rgba(120, 40, 40, 0.12);
                text-align: right;
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
                0%, 100% { opacity: 0.5; }
                50% { opacity: 0.7; }
            }
            .ch5-a--excluded .ch5-label {
                animation: ch5-shadow-pulse 5s ease-in-out infinite;
            }

            /* ── Media queries ── */
            @media (max-width: 768px) {
                .ch5-title { font-size: 26px; }
                .ch5-anno { max-width: 150px; }
                .ch5-framing { max-width: 200px; font-size: 12px; }
                .ch5-gem-label { display: none; }
                .ch5-tetra-label { display: none; }
                .ch5-trinity-label { display: none; }
                .ch5-leader { display: none; }
                .ch5-split-label { display: none; }
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

            <!-- Phase 2: [F] Framing sentence — the "WHY" -->
            <div class="ch5-framing" data-phase="2">
                Jung argued that Christ — the supreme image of
                goodness — is only <em>half</em> of the whole Self.
                The other half was banished.<br><br>
                <em>This scene shows what that looks like.</em>
                <br><br>
                Three bright gems represent what was kept.
                One dark gem represents what was cast out.
                The cross holds them together — barely.
            </div>

            <!-- Phase 3: Cross annotation + leader -->
            <div class="ch5-anno ch5-a--cross" data-phase="3">
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
            <div class="ch5-leader ch5-leader--cross" data-phase="3"></div>

            <!-- Phase 4: [G] Gem labels with newcomer explanations -->
            <div class="ch5-gem-label ch5-gem--lion" data-phase="4">
                Lion
                <span class="ch5-gem-desc">St Mark · sovereignty</span>
                <span class="ch5-gem-explain">the part of you that rules and commands</span>
            </div>
            <div class="ch5-gem-label ch5-gem--eagle" data-phase="4">
                Eagle
                <span class="ch5-gem-desc">St John · spirit</span>
                <span class="ch5-gem-explain">the part that soars above the world</span>
            </div>
            <div class="ch5-gem-label ch5-gem--man" data-phase="4">
                Man
                <span class="ch5-gem-desc">St Matthew · incarnation</span>
                <span class="ch5-gem-explain">the part that suffers in a body</span>
            </div>
            <div class="ch5-gem-label ch5-gem--bull" data-phase="4">
                Bull
                <span class="ch5-gem-desc">St Luke · earth · excluded</span>
                <span class="ch5-gem-explain">the part they hid — matter, appetite, shadow</span>
            </div>
            <div class="ch5-tetra-label" data-phase="4">
                the tetramorph — four faces of the whole
            </div>
            <div class="ch5-trinity-label" data-phase="4">
                trinity ring — 3 of 4 (the circle cannot close)
            </div>
            <div class="ch5-center-label" data-phase="4">the whole self</div>

            <!-- Phase 4: [D] Light/Shadow split labels -->
            <div class="ch5-split-label ch5-split--light" data-phase="4">light</div>
            <div class="ch5-split-label ch5-split--shadow" data-phase="4">shadow</div>

            <!-- Phase 5: Excluded fourth annotation + leader -->
            <div class="ch5-anno ch5-a--excluded" data-phase="5">
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
            <div class="ch5-leader ch5-leader--excluded" data-phase="5"></div>

            <!-- Phase 6: One-sided symbol + leader -->
            <div class="ch5-anno ch5-a--onesided" data-phase="6">
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
            <div class="ch5-leader ch5-leader--onesided" data-phase="6"></div>

            <!-- Phase 7: Cosmic tree + leader -->
            <div class="ch5-anno ch5-a--roots" data-phase="7">
                <hr class="ch5-rule">
                <div class="ch5-label">The Cosmic Tree</div>
                <div class="ch5-text">
                    A tree whose roots reach to hell.
                    The cross is also a living tree — rooted
                    in darkness, branching into light.
                    Without roots, no blossom.
                </div>
            </div>
            <div class="ch5-leader ch5-leader--roots" data-phase="7"></div>

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
            { sel: '[data-phase="2"]', delay: 4000 },
            { sel: '[data-phase="3"]', delay: 9000 },
            { sel: '[data-phase="4"]', delay: 15000 },
            { sel: '[data-phase="5"]', delay: 22000 },
            { sel: '[data-phase="6"]', delay: 29000 },
            { sel: '[data-phase="7"]', delay: 35000 },
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
            this.shadowVoid.material.opacity = 0.05 + shadowPulse * 0.08;
            this.shadowVoid.scale.setScalar(1 + shadowPulse * 0.35);
        }

        /* ── Excluded sparks drift ── */
        if (this.excludedSparks) {
            this.excludedSparks.rotation.z += 0.003;
            this.excludedSparks.material.opacity = 0.2 + (Math.sin(t * 0.3) + 1) * 0.1;
        }

        /* ── Broken halo pulse ── */
        if (this.brokenHaloParts) {
            const hp = 0.2 + (Math.sin(t * 0.25) + 1) * 0.1;
            this.brokenHaloParts.forEach(p => {
                p.material.opacity = hp;
            });
        }

        /* ── Trinity gap mark pulse ── */
        if (this.trinityGapMark) {
            this.trinityGapMark.material.opacity = 0.08 + (Math.sin(t * 0.3) + 1) * 0.08;
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
