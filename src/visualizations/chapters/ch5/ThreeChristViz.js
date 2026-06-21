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
const LIGHT_CLR = new THREE.Color('#f7f1df');
const GOLD = new THREE.Color('#ffe39c');
const GOLD_DIM = new THREE.Color('#d4af37');
const SHADOW_GLOW = new THREE.Color('#cc6d86');

/* Quadrant gem colors — theologically meaningful */
const GEM_COLORS = [
    new THREE.Color('#ffe39c'),  // Q0: Gold  — Lion/Mark  (sovereignty)
    new THREE.Color('#53d8e8'),  // Q1: Cyan  — Eagle/John (spirit)
    new THREE.Color('#cc6d86'),  // Q2: Rose  — Man/Matthew (sacrifice)
    new THREE.Color('#2b080d'),  // Q3: Dark  — THE EXCLUDED FOURTH (Bull/Luke)
];

/* Connecting-line colors */
const CONN_LIGHT = new THREE.Color('#f4f0e8');
const CONN_DARK = new THREE.Color('#cc6d86');

/* Tetramorph ring */
const TETRA_CLR = new THREE.Color('#26314f');

/* Trinity ring */
const TRINITY_CLR = new THREE.Color('#ffe39c');

export default class ThreeChristViz extends BaseViz {
    constructor(c, o = {}) {
        super(c, Object.assign({ contextType: 'webgl' }, o));
        this.panelState = { activePanelId: 'cross', progress: 0 };
        this.crossFocus = 1;
        this.fourthFocus = 0;
        this.treeFocus = 0;
    }

    setPanelState(state = {}) {
        this.panelState = Object.assign(this.panelState || {}, state);
        this._syncPanelAnnotations?.();
    }

    setReducedMotion(enabled) {
        this.reducedMotion = Boolean(enabled);
    }

    /* ══════════════════════════════════════════════════════
     *  INIT
     * ══════════════════════════════════════════════════════ */
    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: true, alpha: false
        });
        R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        R.setSize(this.width, this.height);
        R.setClearColor(0x020207);

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x020207, 0.0075);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 150);
        this.camera.position.set(0, 1.5, 16);

        /* Mouse & zoom */
        this.mouse = new THREE.Vector2();
        this.mouseSmooth = new THREE.Vector2();
        this._inputTarget = this.container || this.canvas;
        this._onMM = e => {
            const bounds = this._inputTarget?.getBoundingClientRect?.() || this.canvas.getBoundingClientRect();
            const width = bounds.width || innerWidth;
            const height = bounds.height || innerHeight;
            this.mouse.x = ((e.clientX - bounds.left) / width) * 2 - 1;
            this.mouse.y = -(((e.clientY - bounds.top) / height) * 2 - 1);
        };
        this._inputTarget.addEventListener('mousemove', this._onMM);
        this.zoomTarget = 16;
        this._onWheel = e => {
            if (this._inputTarget && !this._inputTarget.contains(e.target)) return;
            this.zoomTarget = Math.max(6, Math.min(28, this.zoomTarget + e.deltaY * 0.01));
        };
        this._inputTarget.addEventListener('wheel', this._onWheel, { passive: true });
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
        this.scene.add(new THREE.AmbientLight(0x090910, 0.2));
        const crossLight = new THREE.PointLight(0xfff1c7, 0.82, 27);
        crossLight.position.set(0, 2, 2);
        this.scene.add(crossLight);
        const shadowLight = new THREE.PointLight(0xcc6d86, 0.32, 16);
        shadowLight.position.set(4, -1.6, 3);
        this.scene.add(shadowLight);

        /* Post-processing */
        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.42, 0.44, 0.28
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
                color: GOLD, transparent: true, opacity: 0.055,
                blending: THREE.AdditiveBlending
            })
        );
        this.crossGlow.position.y = 1.8;
        this.scene.add(this.crossGlow);

        /* Wider halo */
        this.crossHalo = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 16, 16),
            new THREE.MeshBasicMaterial({
                color: LIGHT_CLR, transparent: true, opacity: 0.022,
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
        this.splitPlanes = [];
        /* Light half (left) — warmer */
        const lightHalf = new THREE.Mesh(
            new THREE.PlaneGeometry(22, 24),
            new THREE.MeshBasicMaterial({
                color: 0x0d1020, transparent: true, opacity: 0.34,
                side: THREE.DoubleSide, depthWrite: false
            })
        );
        lightHalf.position.set(-6, 0, -4);
        this.scene.add(lightHalf);
        this.splitPlanes.push({ mesh: lightHalf, baseOpacity: 0.34, side: 'light' });

        /* Dark half (right) — the shadow that follows */
        const darkHalf = new THREE.Mesh(
            new THREE.PlaneGeometry(22, 24),
            new THREE.MeshBasicMaterial({
                color: 0x090104, transparent: true, opacity: 0.4,
                side: THREE.DoubleSide, depthWrite: false
            })
        );
        darkHalf.position.set(6, 0, -4);
        this.scene.add(darkHalf);
        this.splitPlanes.push({ mesh: darkHalf, baseOpacity: 0.4, side: 'shadow' });

        /* Faint vertical divider at the cross — the cross IS the border */
        const dividerPts = [
            new THREE.Vector3(0, -12, -3),
            new THREE.Vector3(0, 12, -3)
        ];
        const divGeo = new THREE.BufferGeometry().setFromPoints(dividerPts);
        this.divider = new THREE.Line(divGeo, new THREE.LineBasicMaterial({
            color: 0x36405f, transparent: true, opacity: 0.11
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
                opacity: isExcluded ? 0.42 : 0.72,
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
                        opacity: 0.085, blending: THREE.AdditiveBlending
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
                        opacity: 0.4, blending: THREE.AdditiveBlending
                    }));
                    this.scene.add(sl);
                    this.brokenHaloParts.push(sl);
                }

                /* Larger crimson void sphere */
                const void_sphere = new THREE.Mesh(
                    new THREE.SphereGeometry(1.1, 12, 12),
                    new THREE.MeshBasicMaterial({
                        color: SHADOW_GLOW, transparent: true,
                        opacity: 0.12, blending: THREE.AdditiveBlending
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
                    opacity: 0.08
                }));
                this.scene.add(line);
                this.connLines.push({ line, isExcluded: false, baseOpacity: 0.08 });
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
                        opacity: 0.18
                    }));
                    this.scene.add(sl);
                    this.connLines.push({ line: sl, isExcluded: true, baseOpacity: 0.18 });
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
        this.trinityDots = [];
        for (let i = 0; i < 3; i++) {
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: TRINITY_CLR, transparent: true,
                    opacity: 0.38, blending: THREE.AdditiveBlending
                })
            );
            dot.position.set(
                cx + Math.cos(angles[i]) * r,
                cy + Math.sin(angles[i]) * r,
                -0.2
            );
            this.scene.add(dot);
            this.trinityDots.push(dot);
        }

        /* Gap marker — faint X or void at excluded position */
        const excA = angles[3];
        const gapMark = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 6, 6),
            new THREE.MeshBasicMaterial({
                color: SHADOW_GLOW, transparent: true,
                opacity: 0.2, blending: THREE.AdditiveBlending
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
            color: TETRA_CLR, transparent: true, opacity: 0.24,
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
            color: GOLD_DIM, transparent: true, opacity: 0.11,
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
                    opacity: i === 3 ? 0.2 : 0.38,
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
                color: SHADOW_GLOW, transparent: true,
                opacity: 0.08 + i * 0.014
            }));
            this.scene.add(line);
            this.roots.push({ line, baseOpacity: 0.08 + i * 0.014 });
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
            color: 0xcc6d86, size: 0.04, transparent: true,
            opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false
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
            opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false
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
            color: 0x25304f, size: 0.04, transparent: true, opacity: 0.28,
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

            .ch5-header,
            .ch5-framing,
            .ch5-anno,
            .ch5-leader,
            .ch5-hint {
                display: none;
            }

            .ch5-annotations [data-phase].ch5-tetra-label.vis,
            .ch5-annotations [data-phase].ch5-trinity-label.vis {
                transform: translateX(-50%);
            }

            .ch5-annotations [data-phase].ch5-center-label.vis {
                transform: translate(-50%, -50%);
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
                Jung reads the Christ image as a supreme symbol
                of spiritual wholeness — powerful, but not the
                whole psychological totality.<br><br>
                <em>This scene shows the pressure around that limit.</em>
                <br><br>
                Three bright gems form the accepted pattern.
                One dark gem marks the missing fourth.
                The cross holds the tension in view.
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
                <span class="ch5-gem-explain">the grounded counter-pole: matter, appetite, shadow</span>
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
                    Trinity images spiritual completion; quaternity
                    images psychological totality. The missing fourth
                    carries matter, earth, shadow, and the counter-pole
                    that a light-only image cannot hold.
                </div>
                <span class="ch5-latin">privatio boni</span>
                <span class="ch5-life">
                    A doctrine can make darkness secondary; the
                    psyche still has to meet the excluded material
                    as a real symbolic pressure.
                </span>
            </div>
            <div class="ch5-leader ch5-leader--excluded" data-phase="5"></div>

            <!-- Phase 6: One-sided symbol + leader -->
            <div class="ch5-anno ch5-a--onesided" data-phase="6">
                <hr class="ch5-rule ch5-rule--right">
                <div class="ch5-label">A One-Sided Symbol</div>
                <div class="ch5-text">
                    In Jung's reading, Christ carries the bright
                    ideal of the Self. The counter-image follows
                    because perfection is not the same as
                    psychological completeness.
                </div>
                <div class="ch5-quote">
                    The counter-pole belongs to the same symbolic field.
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

        this._annTimers = [];
        this._syncPanelAnnotations();
    }

    _syncPanelAnnotations() {
        if (!this._annotationOverlay) return;
        const panelId = this.panelState?.activePanelId || 'cross';
        const cross = panelId === 'cross';
        const fourth = panelId === 'fourth';
        const tree = panelId === 'tree';
        const toggleAll = (selector, enabled) => {
            this._annotationOverlay.querySelectorAll(selector).forEach((el) => {
                el.classList.toggle('vis', enabled);
            });
        };

        toggleAll('.ch5-center-label', cross || fourth);
        toggleAll('.ch5-split-label', fourth || tree);
        toggleAll('.ch5-gem-label', fourth);
        toggleAll('.ch5-tetra-label', fourth);
        toggleAll('.ch5-trinity-label', fourth);
    }

    /* ══════════════════════════════════════════════════════
     *  UPDATE — animation loop
     * ══════════════════════════════════════════════════════ */
    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.04);
        this.introT += dt;
        const panelId = this.panelState?.activePanelId || 'cross';
        const dampRate = this.reducedMotion ? 7 : 3.4;
        this.crossFocus = THREE.MathUtils.damp(this.crossFocus, panelId === 'cross' ? 1 : 0.24, dampRate, dt);
        this.fourthFocus = THREE.MathUtils.damp(this.fourthFocus, panelId === 'fourth' ? 1 : 0, dampRate, dt);
        this.treeFocus = THREE.MathUtils.damp(this.treeFocus, panelId === 'tree' ? 1 : 0, dampRate, dt);

        /* ── Cross glow breathing ── */
        const glow = (Math.sin(t * (this.reducedMotion ? 0.12 : 0.4)) + 1) / 2;
        const mobileSafety = this.width < 700 ? 0.36 : 1;
        this.crossGlow.material.opacity = (0.03 + glow * 0.03 + this.crossFocus * 0.06 + this.treeFocus * 0.02) * mobileSafety;
        this.crossHalo.material.opacity = (0.01 + glow * 0.015 + this.crossFocus * 0.035) * mobileSafety;
        this.cross.rotation.z = Math.sin(t * 0.04) * (this.reducedMotion ? 0.003 : 0.015);
        this.cross.children.forEach((child) => {
            if (child.material) child.material.opacity = (0.56 + this.crossFocus * 0.28 + this.treeFocus * 0.12) * mobileSafety;
        });

        /* ── Gem rotation + hover-reveal ── */
        for (let i = 0; i < this.gems.length; i++) {
            const g = this.gems[i];
            g.mesh.rotation.y += (g.isExcluded ? -0.008 : 0.006) * (this.reducedMotion ? 0.18 : 1) * (1 + this.fourthFocus * 0.8);
            g.mesh.rotation.x = Math.sin(t * 0.25 + i) * 0.08;
            g.mesh.position.y += Math.sin(t * 0.3 + i * 1.5) * 0.001;

            /* Hover proximity brightening */
            const dx = g.mesh.position.x - this.mouseSmooth.x * 5;
            const dy = g.mesh.position.y - this.mouseSmooth.y * 5;
            const d = Math.sqrt(dx * dx + dy * dy);
            const boost = Math.max(0, 1 - d / 4);
            const focusBoost = g.isExcluded ? this.fourthFocus * 0.5 + this.treeFocus * 0.16 : this.crossFocus * 0.12 + this.fourthFocus * 0.2;
            g.mesh.material.opacity = g.baseOp + boost * 0.22 + focusBoost;
        }

        /* ── Shadow void pulse ── */
        if (this.shadowVoid) {
            const shadowPulse = (Math.sin(t * 0.2) + 1) / 2;
            this.shadowVoid.material.opacity = 0.05 + shadowPulse * 0.08 + this.fourthFocus * 0.16 + this.treeFocus * 0.07;
            this.shadowVoid.scale.setScalar(1 + shadowPulse * 0.28 + this.fourthFocus * 0.45);
        }

        /* ── Excluded sparks drift ── */
        if (this.excludedSparks) {
            this.excludedSparks.rotation.z += (this.reducedMotion ? 0.0007 : 0.003) * (1 + this.fourthFocus);
            this.excludedSparks.material.opacity = 0.16 + (Math.sin(t * 0.3) + 1) * 0.08 + this.fourthFocus * 0.28;
        }

        /* ── Broken halo pulse ── */
        if (this.brokenHaloParts) {
            const hp = 0.16 + (Math.sin(t * 0.25) + 1) * 0.08 + this.fourthFocus * 0.28;
            this.brokenHaloParts.forEach(p => {
                p.material.opacity = hp;
            });
        }

        /* ── Trinity gap mark pulse ── */
        if (this.trinityGapMark) {
            this.trinityGapMark.material.opacity = 0.08 + (Math.sin(t * 0.3) + 1) * 0.07 + this.fourthFocus * 0.28;
            this.trinityGapMark.scale.setScalar(1 + this.fourthFocus * 1.4);
        }

        /* ── Tetramorph ring subtle rotation ── */
        this.tetramorphRing.rotation.z += (this.reducedMotion ? 0.00015 : 0.0008) * (1 + this.fourthFocus * 1.1);
        this.tetramorphInner.rotation.z -= (this.reducedMotion ? 0.0002 : 0.001) * (1 + this.fourthFocus * 0.8);
        this.tetramorphRing.material.opacity = 0.12 + this.fourthFocus * 0.26 + this.crossFocus * 0.06;
        this.tetramorphInner.material.opacity = 0.06 + this.fourthFocus * 0.2 + this.crossFocus * 0.04;
        this.trinityArcs?.forEach((arc) => {
            arc.material.opacity = 0.12 + this.fourthFocus * 0.24 + this.crossFocus * 0.04;
        });
        this.trinityDots?.forEach((dot) => {
            dot.material.opacity = 0.18 + this.fourthFocus * 0.38 + this.crossFocus * 0.06;
        });
        this.cardinalDots?.forEach((dot, index) => {
            dot.material.opacity = index === 3 ? 0.12 + this.fourthFocus * 0.34 : 0.18 + this.fourthFocus * 0.32;
        });
        this.connLines?.forEach(({ line, isExcluded, baseOpacity }) => {
            line.material.opacity = baseOpacity + (isExcluded ? this.fourthFocus * 0.22 + this.treeFocus * 0.08 : this.crossFocus * 0.08 + this.fourthFocus * 0.08);
        });
        this.roots?.forEach(({ line, baseOpacity }, index) => {
            line.material.opacity = baseOpacity + this.treeFocus * (0.42 + index * 0.035) + this.fourthFocus * 0.04;
        });
        this.splitPlanes?.forEach(({ mesh, baseOpacity, side }) => {
            const shadowBoost = side === 'shadow' ? this.fourthFocus * 0.24 + this.treeFocus * 0.18 : this.crossFocus * 0.08;
            mesh.material.opacity = baseOpacity + shadowBoost;
        });

        /* ── Spectrum particles drift ── */
        this.specPts.rotation.z += (this.reducedMotion ? 0.00015 : 0.0008) * (1 + this.crossFocus * 0.5);
        this.specPts.rotation.y += this.reducedMotion ? 0.00005 : 0.0003;
        this.specPts.material.opacity = 0.2 + this.crossFocus * 0.2 + this.fourthFocus * 0.08;

        /* ── Starfield ── */
        this.stars.rotation.y += this.reducedMotion ? 0.000015 : 0.00008;

        /* ── Camera — intro zoom + mouse parallax ── */
        const introF = Math.min(this.introT / 5, 1);
        const ease = 1 - Math.pow(1 - introF, 3);
        const baseDist = THREE.MathUtils.lerp(24, 16, ease);
        const targetZ = THREE.MathUtils.clamp(
            this.zoomTarget * (baseDist / 16) - this.crossFocus * 1.6 + this.fourthFocus * 1.8 + this.treeFocus * 2.4,
            8,
            28,
        );
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.05;
        this.camera.position.x = this.mouseSmooth.x * (2.2 + this.fourthFocus * 0.7);
        this.camera.position.y = 1.5 + this.mouseSmooth.y * 1.7 - this.treeFocus * 2.15;
        this.camera.lookAt(0, 1.5 - this.treeFocus * 2.45, 0);

        /* ── Bloom ── */
        if (this.bloom) {
            this.bloom.strength = 1.2 + glow * 0.25 + this.crossFocus * 0.16 + this.fourthFocus * 0.14;
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
        this._inputTarget?.removeEventListener('mousemove', this._onMM);
        this._inputTarget?.removeEventListener('wheel', this._onWheel);
        if (this._annTimers) this._annTimers.forEach(t => clearTimeout(t));
        this._annotationOverlay?.remove();
        this.bloom?.dispose?.();
        this.composer?.dispose?.();
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
