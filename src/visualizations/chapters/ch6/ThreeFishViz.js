/**
 * ThreeFishViz.js — Chapter 6: "The Sign of the Fishes"
 *
 * Jung: The birth of Christ coincided with the dawn of the Age of Pisces.
 * Two fish swimming in opposite directions — Christ and Antichrist,
 * the "hostile brothers" — bound by a golden commissure thread.
 * Saturn as the "black star," orbited by lion and serpent.
 * The Great Conjunction of Jupiter and Saturn (~7 BC) marking the
 * new aeon. The spring point precesses from Pisces toward Aquarius.
 *
 * Visual: 5 layers — starfield, zodiac wheel, two fish + commissure,
 * Saturn/Jupiter/conjunction, tracked phased annotations.
 *
 * v2: All annotations are 3D→2D projection-tracked. Labels follow
 * their objects through camera orbit. Leader lines connect labels
 * to elements. Zodiac sign names projected onto wheel markers.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/* ─── Palette ─── */
const ZODIAC_GOLD = new THREE.Color('#d4af37');
const FISH_SILVER = new THREE.Color('#f7f1df');
const FISH_DARK = new THREE.Color('#25304f');
const COMMISSURE = new THREE.Color('#ffe39c');
const SATURN_BLACK = new THREE.Color('#070814');
const SATURN_RING_C = new THREE.Color('#64708f');
const JUPITER_AMBER = new THREE.Color('#d4af37');
const CONJUNCTION_C = new THREE.Color('#f7f1df');
const SPRING_PT = new THREE.Color('#cc6d86');
const LION_RED = new THREE.Color('#c0392b');
const SERPENT_GREEN = new THREE.Color('#2ecc71');
const VOID = 0x02030a;

const ZODIAC_R = 5;

const SIGN_NAMES = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export default class ThreeFishViz extends BaseViz {
    constructor(c, o = {}) {
        super(c, Object.assign({ contextType: 'webgl' }, o));
        this.panelState = { activePanelId: 'fish', progress: 0 };
        this.fishFocus = 1;
        this.zodiacFocus = 0;
        this.transitionFocus = 0;
    }

    setPanelState(state = {}) {
        this.panelState = Object.assign(this.panelState || {}, state);
        this._syncPanelAnnotations?.();
    }

    setReducedMotion(enabled) {
        this.reducedMotion = Boolean(enabled);
    }

    async init() {
        /* ═══ Renderer ═══ */
        const R = this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: true, alpha: false,
            powerPreference: 'high-performance',
        });
        R.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
        R.setSize(this.width, this.height);
        R.setClearColor(VOID);
        R.toneMapping = THREE.ACESFilmicToneMapping;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(VOID, 0.006);

        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 5, 14);

        this.mouse = new THREE.Vector2();
        this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => {
            const bounds = this._inputTarget?.getBoundingClientRect?.();
            const width = bounds?.width || globalThis.innerWidth || 1;
            const height = bounds?.height || globalThis.innerHeight || 1;
            const left = bounds?.left || 0;
            const top = bounds?.top || 0;
            this.mouse.x = ((e.clientX - left) / width) * 2 - 1;
            this.mouse.y = -(((e.clientY - top) / height) * 2 - 1);
        };
        this._inputTarget = this.container || this.canvas || globalThis;
        this._inputTarget.addEventListener('mousemove', this._onMM, { passive: true });

        /* Scratch vectors for projection (reuse to avoid GC) */
        this._projVec = new THREE.Vector3();
        this._smoothPositions = {};

        /* Build layers */
        this._createStarfield();
        this._createZodiacWheel();
        this._createTwoFish();
        this._createCommissureThread();
        this._createSaturn();
        this._createJupiter();
        this._createLights();
        this._buildAnnotations();

        /* Post-processing */
        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.28, 0.62, 0.34
        );
        this.composer.addPass(this.bloom);
    }

    /* ═══════════════════════════════════════════════════════════
       3D → 2D Projection Utility
       ═══════════════════════════════════════════════════════════ */
    _project(worldPos) {
        this._projVec.copy(worldPos).project(this.camera);
        return {
            x: (this._projVec.x * 0.5 + 0.5) * this.width,
            y: (-this._projVec.y * 0.5 + 0.5) * this.height,
            behind: this._projVec.z > 1
        };
    }

    /** Smoothly interpolate a tracked position to avoid jitter */
    _smoothProject(key, worldPos, smoothing = 0.08) {
        const raw = this._project(worldPos);
        if (!this._smoothPositions[key]) {
            this._smoothPositions[key] = { x: raw.x, y: raw.y };
        }
        const s = this._smoothPositions[key];
        s.x += (raw.x - s.x) * smoothing;
        s.y += (raw.y - s.y) * smoothing;
        return { x: s.x, y: s.y, behind: raw.behind };
    }

    /** Position an HTML element by tracked 3D position with offset */
    _trackElement(el, worldPos, key, offsetX = 0, offsetY = 0) {
        if (!el) return null;
        const p = this._smoothProject(key, worldPos);
        /* Clamp to viewport bounds with generous margins for label width */
        const marginL = 10;
        const marginR = Math.min(250, this.width * 0.22); // room for label text
        const marginT = 60; // below chapter title
        const marginB = 50;
        const cx = Math.max(marginL, Math.min(this.width - marginR, p.x + offsetX));
        const cy = Math.max(marginT, Math.min(this.height - marginB, p.y + offsetY));
        el.style.left = cx + 'px';
        el.style.top = cy + 'px';
        el.style.visibility = p.behind ? 'hidden' : 'visible';
        return { x: cx, y: cy, anchorX: p.x, anchorY: p.y, behind: p.behind };
    }

    /* ═══════════════════════════════════════════════════════════
       LAYER 1 — Starfield
       ═══════════════════════════════════════════════════════════ */
    _createStarfield() {
        const N = 800;
        const pos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const r = 8 + Math.random() * 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.starfield = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x9aa7d8, size: 0.055, transparent: true, opacity: 0.44,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.starfield);
    }

    /* ═══════════════════════════════════════════════════════════
       LAYER 2 — Zodiac Wheel
       ═══════════════════════════════════════════════════════════ */
    _createZodiacWheel() {
        this.wheelGroup = new THREE.Group();
        this.wheelMaterials = [];
        this.spokes = [];

        /* Main ring */
        const ringGeo = new THREE.TorusGeometry(ZODIAC_R, 0.035, 8, 128);
        const mainRingMat = new THREE.MeshBasicMaterial({
            color: ZODIAC_GOLD, transparent: true, opacity: 0.32,
            blending: THREE.AdditiveBlending,
        });
        this.wheelGroup.add(new THREE.Mesh(ringGeo, mainRingMat));
        this.wheelMaterials.push({ material: mainRingMat, baseOpacity: 0.25 });

        /* Inner ring — fainter, smaller */
        const innerGeo = new THREE.TorusGeometry(ZODIAC_R * 0.85, 0.015, 8, 128);
        const innerRingMat = new THREE.MeshBasicMaterial({
            color: ZODIAC_GOLD, transparent: true, opacity: 0.12,
            blending: THREE.AdditiveBlending,
        });
        this.wheelGroup.add(new THREE.Mesh(innerGeo, innerRingMat));
        this.wheelMaterials.push({ material: innerRingMat, baseOpacity: 0.08 });

        /* 12 segment markers + spokes */
        this.segmentMarkers = [];
        this._zodiacPositions = []; // store positions for label projection
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const isPisces = i === 11;
            const isAquarius = i === 10;

            /* Marker dot */
            const dotGeo = new THREE.SphereGeometry(isPisces ? 0.11 : (isAquarius ? 0.085 : 0.052), 8, 8);
            const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({
                color: isPisces ? COMMISSURE : (isAquarius ? 0x22d3ee : ZODIAC_GOLD),
                transparent: true,
                opacity: isPisces ? 0.82 : (isAquarius ? 0.62 : 0.34),
            }));
            dot.position.set(Math.cos(angle) * ZODIAC_R, 0, Math.sin(angle) * ZODIAC_R);
            this.wheelGroup.add(dot);
            this.segmentMarkers.push(dot);

            /* Store label position slightly outside the ring */
            const labelObj = new THREE.Object3D();
            labelObj.position.set(
                Math.cos(angle) * (ZODIAC_R + 0.7),
                0,
                Math.sin(angle) * (ZODIAC_R + 0.7)
            );
            this.wheelGroup.add(labelObj);
            this._zodiacPositions.push(labelObj);

            /* Spoke line */
            const spoke = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(Math.cos(angle) * (ZODIAC_R - 0.3), 0, Math.sin(angle) * (ZODIAC_R - 0.3)),
                    new THREE.Vector3(Math.cos(angle) * (ZODIAC_R + 0.3), 0, Math.sin(angle) * (ZODIAC_R + 0.3)),
                ]),
                new THREE.LineBasicMaterial({
                    color: isPisces ? COMMISSURE : ZODIAC_GOLD,
                    transparent: true,
                    opacity: isPisces ? 0.2 : 0.1,
                })
            );
            this.wheelGroup.add(spoke);
            this.spokes.push({ line: spoke, baseOpacity: isPisces ? 0.2 : 0.1, isPisces, isAquarius });

            /* Pisces sector glow arc */
            if (isPisces) {
                const arcPts = [];
                const sliceAngle = Math.PI * 2 / 12;
                for (let k = 0; k <= 24; k++) {
                    const a = angle + (k / 24) * sliceAngle;
                    arcPts.push(new THREE.Vector3(
                        Math.cos(a) * ZODIAC_R, 0, Math.sin(a) * ZODIAC_R
                    ));
                }
                const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
                this._piscesArc = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({
                    color: COMMISSURE, transparent: true, opacity: 0.42,
                    blending: THREE.AdditiveBlending,
                }));
                this.wheelGroup.add(this._piscesArc);
            }

            /* Aquarius sector faint arc */
            if (isAquarius) {
                const arcPts = [];
                const sliceAngle = Math.PI * 2 / 12;
                for (let k = 0; k <= 24; k++) {
                    const a = angle + (k / 24) * sliceAngle;
                    arcPts.push(new THREE.Vector3(
                        Math.cos(a) * ZODIAC_R, 0, Math.sin(a) * ZODIAC_R
                    ));
                }
                const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
                this._aquariusArc = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({
                    color: 0x53d8e8, transparent: true, opacity: 0.22,
                    blending: THREE.AdditiveBlending,
                }));
                this.wheelGroup.add(this._aquariusArc);
            }
        }

        /* Spring Point — orange octahedron */
        this.springPoint = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.15, 0),
            new THREE.MeshStandardMaterial({
                color: SPRING_PT, emissive: SPRING_PT, emissiveIntensity: 0.82,
            })
        );
        this.wheelGroup.add(this.springPoint);

        this.wheelGroup.rotation.x = -Math.PI / 6;
        this.scene.add(this.wheelGroup);
    }

    /* ═══════════════════════════════════════════════════════════
       LAYER 3a — Two Fish (particle-based)
       ═══════════════════════════════════════════════════════════ */
    _createTwoFish() {
        this.fishPair = [];

        for (let f = 0; f < 2; f++) {
            const group = new THREE.Group();
            const isLight = f === 0;
            const color = isLight ? FISH_SILVER : FISH_DARK;

            /* Body — elongated sphere */
            const bodyGeo = new THREE.SphereGeometry(0.24, 16, 12);
            bodyGeo.scale(2.45, 0.72, 0.5);
            const bodyMat = new THREE.MeshStandardMaterial({
                color, emissive: color,
                emissiveIntensity: isLight ? 0.72 : 0.34,
                transparent: true, opacity: isLight ? 0.84 : 0.58,
                metalness: 0.45, roughness: 0.24,
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            group.add(body);

            /* Tail fin */
            const tailGeo = new THREE.ConeGeometry(0.14, 0.34, 4);
            const tailMat = bodyMat.clone();
            tailMat.opacity = isLight ? 0.55 : 0.35;
            const tail = new THREE.Mesh(tailGeo, tailMat);
            tail.position.x = -0.5;
            tail.rotation.z = Math.PI / 2;
            group.add(tail);

            /* Eye */
            const eyeColor = isLight ? 0xffffff : 0x445577;
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.035, 6, 6),
                new THREE.MeshBasicMaterial({ color: eyeColor })
            );
            eye.position.set(0.35, 0.06, 0.16);
            group.add(eye);

            /* Particle trail — 60 particles following the fish */
            const trailN = 60;
            const trailPos = new Float32Array(trailN * 3);
            for (let i = 0; i < trailN; i++) {
                trailPos[i * 3] = (Math.random() - 0.5) * 1.5;
                trailPos[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
                trailPos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
            }
            const trailGeo = new THREE.BufferGeometry();
            trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
            const trailPts = new THREE.Points(trailGeo, new THREE.PointsMaterial({
                color: isLight ? 0xb0c4de : 0x2a3a5a,
                size: isLight ? 0.06 : 0.04,
                transparent: true, opacity: isLight ? 0.5 : 0.25,
                blending: THREE.AdditiveBlending, depthWrite: false,
            }));
            group.add(trailPts);

            /* Glow sphere — used for visual emphasis during label reveal */
            const glowGeo = new THREE.SphereGeometry(isLight ? 0.9 : 0.7, 12, 12);
            const glowMat = new THREE.MeshBasicMaterial({
                color: isLight ? 0xd4af37 : 0x53d8e8,
                transparent: true, opacity: isLight ? 0.08 : 0.045,
                blending: THREE.AdditiveBlending,
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            group.add(glow);

            this.scene.add(group);
            this.fishPair.push({
                group, direction: isLight ? 1 : -1, trailPts, isLight, glowMat, bodyMat, tailMat
            });
        }
    }

    /* ═══════════════════════════════════════════════════════════
       LAYER 3b — Commissure Thread
       ═══════════════════════════════════════════════════════════ */
    _createCommissureThread() {
        const segCount = 40;
        const pts = [];
        for (let i = 0; i <= segCount; i++) {
            pts.push(new THREE.Vector3(0, 0, 0));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        this.commissure = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color: COMMISSURE, transparent: true, opacity: 0.42,
            blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.commissure);
        this.commissureSegCount = segCount;

        /* Commissure glow particles along the thread */
        const glowN = 20;
        const glowPos = new Float32Array(glowN * 3);
        const glowGeo = new THREE.BufferGeometry();
        glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
        this.commissureGlow = new THREE.Points(glowGeo, new THREE.PointsMaterial({
            color: COMMISSURE, size: 0.085, transparent: true, opacity: 0.48,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.commissureGlow);
        this.commissureGlowN = glowN;
    }

    /* ═══════════════════════════════════════════════════════════
       LAYER 4a — Saturn ("Black Star")
       ═══════════════════════════════════════════════════════════ */
    _createSaturn() {
        this.saturnGroup = new THREE.Group();

        /* Saturn body */
        const bodyGeo = new THREE.SphereGeometry(0.55, 16, 16);
        this.saturnBody = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({
            color: SATURN_BLACK, emissive: '#0a0a18', emissiveIntensity: 0.3,
            metalness: 0.8, roughness: 0.2,
        }));
        this.saturnGroup.add(this.saturnBody);

        /* Saturn ring */
        const sRingGeo = new THREE.TorusGeometry(0.9, 0.04, 4, 64);
        const sRing = new THREE.Mesh(sRingGeo, new THREE.MeshBasicMaterial({
            color: SATURN_RING_C, transparent: true, opacity: 0.38,
        }));
        sRing.rotation.x = Math.PI / 3;
        this.saturnGroup.add(sRing);

        /* Dark aura */
        const auraGeo = new THREE.SphereGeometry(1.2, 12, 12);
        this.saturnGroup.add(new THREE.Mesh(auraGeo, new THREE.MeshBasicMaterial({
            color: 0x0a0a1e, transparent: true, opacity: 0.08,
            blending: THREE.AdditiveBlending, side: THREE.BackSide,
        })));

        /* Orbiting Lion (red cone) — with position anchor for tracking */
        this.saturnLion = new THREE.Mesh(
            new THREE.ConeGeometry(0.1, 0.22, 5),
            new THREE.MeshStandardMaterial({
                color: LION_RED, emissive: LION_RED, emissiveIntensity: 0.4,
            })
        );
        this.saturnGroup.add(this.saturnLion);

        /* Orbiting Serpent (green torus knot) */
        this.saturnSerpent = new THREE.Mesh(
            new THREE.TorusKnotGeometry(0.08, 0.02, 32, 6, 2, 3),
            new THREE.MeshStandardMaterial({
                color: SERPENT_GREEN, emissive: SERPENT_GREEN, emissiveIntensity: 0.4,
            })
        );
        this.saturnGroup.add(this.saturnSerpent);

        this.saturnGroup.position.set(-3.5, 2.5, -3);
        this.scene.add(this.saturnGroup);
    }

    /* ═══════════════════════════════════════════════════════════
       LAYER 4b — Jupiter + Conjunction Flash
       ═══════════════════════════════════════════════════════════ */
    _createJupiter() {
        const jupGeo = new THREE.SphereGeometry(0.4, 12, 12);
        this.jupiter = new THREE.Mesh(jupGeo, new THREE.MeshStandardMaterial({
            color: JUPITER_AMBER, emissive: JUPITER_AMBER, emissiveIntensity: 0.35,
            metalness: 0.5, roughness: 0.4,
        }));
        this.jupiter.position.set(3.5, 2.5, -3);
        this.scene.add(this.jupiter);

        /* Warm glow around Jupiter */
        const jupGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.7, 12, 12),
            new THREE.MeshBasicMaterial({
                color: JUPITER_AMBER, transparent: true, opacity: 0.05,
                blending: THREE.AdditiveBlending,
            })
        );
        this.jupiter.add(jupGlow);

        /* Conjunction threshold: a subtle luminous event rather than a solid body */
        this.conjGroup = new THREE.Group();
        this.conjFlash = new THREE.Mesh(
            new THREE.SphereGeometry(1.25, 24, 18),
            new THREE.MeshBasicMaterial({
                color: CONJUNCTION_C, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        this.conjHalo = new THREE.Mesh(
            new THREE.SphereGeometry(2.2, 24, 18),
            new THREE.MeshBasicMaterial({
                color: 0x8f90b8, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false,
            })
        );
        this.conjRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.82, 0.015, 8, 160),
            new THREE.MeshBasicMaterial({
                color: COMMISSURE, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        this.conjRing.rotation.x = Math.PI / 2.6;
        this.conjAquariusRing = new THREE.Mesh(
            new THREE.TorusGeometry(2.1, 0.01, 8, 160),
            new THREE.MeshBasicMaterial({
                color: 0x22d3ee, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        this.conjAquariusRing.rotation.x = Math.PI / 2.15;
        this.conjAquariusRing.rotation.z = Math.PI / 9;
        this.conjGroup.add(this.conjHalo, this.conjFlash, this.conjRing, this.conjAquariusRing);
        this.scene.add(this.conjGroup);
    }

    /* ═══ Lights ═══ */
    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x0a0a18, 0.38));
        const p1 = new THREE.PointLight(0xd4af37, 0.72, 22);
        p1.position.set(0, 3, 5);
        this.scene.add(p1);
        const p2 = new THREE.PointLight(0x53d8e8, 0.44, 26);
        p2.position.set(-4, 4, -4);
        this.scene.add(p2);
    }

    /* ═══════════════════════════════════════════════════════════
       LAYER 5 — HTML Annotations (tracked, 6 phases)
       ═══════════════════════════════════════════════════════════ */
    _buildAnnotations() {
        const ov = document.createElement('div');
        ov.className = 'ch6-overlay';
        const style = document.createElement('style');
        style.textContent = `
            .ch6-overlay {
                position: absolute; inset: 0;
                pointer-events: none;
                font-family: 'Instrument Serif', serif;
                overflow: hidden;
            }

            /* ─── Phase system ─── */
            .ch6-overlay [data-phase] {
                opacity: 0;
                transition: opacity 1.8s cubic-bezier(0.32, 0.72, 0, 1),
                            transform 1.8s cubic-bezier(0.32, 0.72, 0, 1);
                transform: translateY(8px);
            }
            .ch6-overlay [data-phase].vis {
                opacity: 1;
                transform: translateY(0);
            }

            .ch6-title,
            .ch6-framing,
            .ch6-final {
                display: none;
            }

            .ch6-overlay [data-phase].ch6-zodiac-label.vis {
                transform: translateX(-50%);
            }

            /* ─── Tracked labels (positioned by JS) ─── */
            .ch6-tracked {
                position: absolute;
                transition:
                    left 0.18s cubic-bezier(0.32, 0.72, 0, 1),
                    top 0.18s cubic-bezier(0.32, 0.72, 0, 1);
                will-change: left, top;
            }

            /* ─── Leader line SVG overlay ─── */
            .ch6-leaders-svg {
                position: absolute; inset: 0;
                pointer-events: none;
                overflow: visible;
            }
            .ch6-leaders-svg line {
                stroke-dasharray: 4 3;
                stroke-linecap: round;
            }

            /* ═══ PHASE 1 — Chapter title ═══ */
            .ch6-title {
                position: absolute;
                top: 32px; left: 50%;
                transform: translateX(-50%);
                font-family: 'Cormorant Garamond', serif;
                font-size: 10px;
                letter-spacing: 6px;
                text-transform: uppercase;
                color: rgba(200, 168, 42, 0.22);
                white-space: nowrap;
                transition: opacity 8s ease;
            }
            .ch6-title.dim {
                opacity: 0.35;
            }

            /* ═══ PHASE 2 — Framing sentence ═══ */
            .ch6-framing {
                position: absolute;
                top: 140px; left: 44px;
                max-width: 340px;
                font-size: 14.5px;
                font-weight: 400;
                line-height: 1.7;
                color: rgba(240, 240, 255, 0.4);
                border-left: 2px solid rgba(200, 168, 42, 0.25);
                padding-left: 14px;
            }
            .ch6-framing em {
                color: rgba(255, 215, 100, 0.6);
                font-style: italic;
            }

            /* ═══ PHASE 3 — Fish labels (tracked) ═══ */
            .ch6-fish-label {
                font-family: 'Cormorant Garamond', serif;
                font-size: 9px;
                letter-spacing: 3px;
                text-transform: uppercase;
                line-height: 1.4;
                white-space: nowrap;
            }
            .ch6-fish--light {
                color: rgba(247, 241, 223, 0.7);
                text-align: right;
            }
            .ch6-fish--dark {
                color: rgba(83, 216, 232, 0.62);
            }
            .ch6-fish-explain {
                display: block;
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 10px;
                letter-spacing: 0;
                text-transform: none;
                margin-top: 4px;
                line-height: 1.4;
                max-width: 170px;
                white-space: normal;
            }
            .ch6-fish--light .ch6-fish-explain {
                color: rgba(247, 241, 223, 0.42);
            }
            .ch6-fish--dark .ch6-fish-explain {
                color: rgba(83, 216, 232, 0.42);
            }

            /* Commissure label (tracked to thread midpoint) */
            .ch6-commissure-label {
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 10px;
                letter-spacing: 1px;
                color: rgba(255, 227, 156, 0.46);
                text-align: center;
                white-space: nowrap;
                text-shadow: 0 0 12px rgba(255, 227, 156, 0.18);
            }

            /* ═══ PHASE 4 — Zodiac context ═══ */
            .ch6-zodiac-label {
                position: absolute;
                bottom: 18%;
                left: 50%;
                transform: translateX(-50%);
                font-family: 'Cormorant Garamond', serif;
                font-size: 7px;
                letter-spacing: 5px;
                text-transform: uppercase;
                color: rgba(200, 168, 32, 0.25);
                white-space: nowrap;
            }

            /* Zodiac sign names (tracked to wheel markers) */
            .ch6-sign-name {
                font-family: 'Cormorant Garamond', serif;
                font-size: 7px;
                letter-spacing: 2px;
                text-transform: uppercase;
                white-space: nowrap;
                text-align: center;
                pointer-events: none;
            }
            .ch6-sign-name.ch6-sign--pisces {
                color: rgba(255, 227, 156, 0.52);
                font-size: 8px;
                letter-spacing: 3px;
            }
            .ch6-sign-name.ch6-sign--aquarius {
                color: rgba(83, 216, 232, 0.44);
                font-size: 8px;
                letter-spacing: 3px;
            }
            .ch6-sign-name.ch6-sign--normal {
                color: rgba(200, 168, 42, 0.18);
            }

            /* Spring point label (tracked) */
            .ch6-spring-label {
                font-family: 'Cormorant Garamond', serif;
                font-size: 9px;
                letter-spacing: 2px;
                color: rgba(204, 109, 134, 0.62);
                text-align: center;
                white-space: nowrap;
            }
            .ch6-spring-explain {
                display: block;
                font-style: italic;
                font-size: 9.5px;
                letter-spacing: 0;
                margin-top: 3px;
                color: rgba(204, 109, 134, 0.36);
                max-width: 160px;
                white-space: normal;
            }

            /* ═══ PHASE 5 — Saturn + Jupiter (tracked) ═══ */
            .ch6-saturn-label {
                font-size: 10px;
                letter-spacing: 1.5px;
                color: rgba(100, 100, 130, 0.65);
            }
            .ch6-saturn-explain {
                display: block;
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 9.5px;
                letter-spacing: 0;
                margin-top: 4px;
                color: rgba(100, 100, 130, 0.38);
                max-width: 140px;
                line-height: 1.4;
                white-space: normal;
            }
            .ch6-jupiter-label {
                font-size: 10px;
                letter-spacing: 1.5px;
                color: rgba(212, 160, 48, 0.6);
                text-align: right;
            }
            .ch6-jupiter-explain {
                display: block;
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 9.5px;
                letter-spacing: 0;
                margin-top: 4px;
                color: rgba(212, 160, 48, 0.32);
                max-width: 140px;
                line-height: 1.4;
                white-space: normal;
            }
            .ch6-conjunction-label {
                font-size: 10px;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.25);
                text-align: center;
                white-space: nowrap;
            }
            .ch6-conjunction-explain {
                display: block;
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 9px;
                letter-spacing: 0;
                margin-top: 3px;
                color: rgba(255, 255, 255, 0.18);
                white-space: normal;
                max-width: 200px;
            }

            /* Lion + Serpent micro-labels (tracked) */
            .ch6-orbiter-label {
                font-family: 'Cormorant Garamond', serif;
                font-size: 7px;
                letter-spacing: 2px;
                text-transform: lowercase;
                white-space: nowrap;
            }
            .ch6-orbiter--lion {
                color: rgba(192, 57, 43, 0.5);
            }
            .ch6-orbiter--serpent {
                color: rgba(46, 204, 113, 0.45);
            }

            /* ═══ PHASE 6 — Final message ═══ */
            .ch6-final {
                position: absolute;
                bottom: 8%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 13px;
                font-style: italic;
                color: rgba(34, 211, 238, 0.3);
                text-align: center;
                max-width: 420px;
                line-height: 1.6;
            }
            .ch6-final em {
                color: rgba(34, 211, 238, 0.45);
            }

            @media (max-width: 700px) {
                .ch6-fish-label,
                .ch6-commissure-label,
                .ch6-sign-name,
                .ch6-spring-label,
                .ch6-saturn-label,
                .ch6-jupiter-label,
                .ch6-conjunction-label,
                .ch6-orbiter-label,
                .ch6-leaders-svg {
                    display: none;
                }
            }
        `;
        ov.appendChild(style);

        /* ─── SVG leader line overlay ─── */
        const svgNS = 'http://www.w3.org/2000/svg';
        this._leaderSvg = document.createElementNS(svgNS, 'svg');
        this._leaderSvg.classList.add('ch6-leaders-svg');
        this._leaderSvg.setAttribute('width', '100%');
        this._leaderSvg.setAttribute('height', '100%');
        ov.appendChild(this._leaderSvg);

        /* Create reusable leader lines */
        this._leaders = {};
        const makeLeader = (id, color, opacity = 0.2) => {
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-opacity', opacity);
            line.setAttribute('stroke-width', '1');
            line.style.display = 'none';
            this._leaderSvg.appendChild(line);
            this._leaders[id] = line;
        };
        makeLeader('fish-light', 'rgba(247,241,223,0.28)', 0.34);
        makeLeader('fish-dark', 'rgba(83,216,232,0.24)', 0.32);
        makeLeader('saturn', 'rgba(100,100,130,0.2)', 0.25);
        makeLeader('jupiter', 'rgba(212,160,48,0.2)', 0.25);
        makeLeader('spring', 'rgba(204,109,134,0.24)', 0.28);
        makeLeader('commissure', 'rgba(255,227,156,0.18)', 0.22);

        /* ─── HTML elements ─── */
        ov.insertAdjacentHTML('beforeend', `
            <!-- Phase 1: Chapter title -->
            <div class="ch6-title" data-phase="1">VI · The Sign of the Fishes</div>

            <!-- Phase 2: Framing sentence -->
            <div class="ch6-framing" data-phase="2">
                Aion reads the <em>Age of Pisces</em> as a symbolic weather system:
                two fish, swimming in opposite directions,
                bound by a single golden thread.<br><br>
                <em>One current carries the received image. The other carries the counter-current.</em><br>
                The chapter asks how an age can hold opposition without splitting its meaning.
            </div>

            <!-- Phase 3: Fish labels (tracked by JS) + commissure -->
            <div class="ch6-tracked ch6-fish-label ch6-fish--light" data-phase="3" data-track="fish-light">
                Bright Fish
                <span class="ch6-fish-explain">the received current of the Piscean image</span>
            </div>
            <div class="ch6-tracked ch6-fish-label ch6-fish--dark" data-phase="3" data-track="fish-dark">
                Counter-Fish
                <span class="ch6-fish-explain">the contrary current that keeps the symbol tense</span>
            </div>
            <div class="ch6-tracked ch6-commissure-label" data-phase="3" data-track="commissure">
                the commissure: what binds the opposites
            </div>

            <!-- Phase 4: Zodiac context -->
            <div class="ch6-zodiac-label" data-phase="4">the great year</div>
            <div class="ch6-tracked ch6-spring-label" data-phase="4" data-track="spring">
                ◆ Spring Point
                <span class="ch6-spring-explain">slowly precessing from Pisces toward Aquarius: the symbolic threshold of the aeon</span>
            </div>

            <!-- Phase 5: Saturn + Jupiter (tracked) + lion/serpent -->
            <div class="ch6-tracked ch6-saturn-label" data-phase="5" data-track="saturn">
                Saturn
                <span class="ch6-saturn-explain">the dark time-marker in the chapter's astrological image field</span>
            </div>
            <div class="ch6-tracked ch6-jupiter-label" data-phase="5" data-track="jupiter">
                Jupiter
                <span class="ch6-jupiter-explain">a bright counterpart that charges the historical sign</span>
            </div>
            <div class="ch6-tracked ch6-conjunction-label" data-phase="5" data-track="conjunction">
                Great Conjunction
                <span class="ch6-conjunction-explain">a charged meeting inside Pisces: history seen through symbol</span>
            </div>
            <div class="ch6-tracked ch6-orbiter-label ch6-orbiter--lion" data-phase="5" data-track="lion">
                lion
            </div>
            <div class="ch6-tracked ch6-orbiter-label ch6-orbiter--serpent" data-phase="5" data-track="serpent">
                serpent
            </div>

            <!-- Phase 6: Final reflection -->
            <div class="ch6-final" data-phase="6">
                The spring point drifts from Pisces into Aquarius —<br>
                <em>a new aeon approaches</em>
            </div>
        `);

        /* ─── Zodiac sign name elements (Phase 4) ─── */
        this._signEls = [];
        for (let i = 0; i < 12; i++) {
            const isPisces = i === 11;
            const isAquarius = i === 10;
            const el = document.createElement('div');
            el.className = `ch6-tracked ch6-sign-name ${isPisces ? 'ch6-sign--pisces' :
                isAquarius ? 'ch6-sign--aquarius' : 'ch6-sign--normal'
                }`;
            el.dataset.phase = '4';
            el.textContent = SIGN_NAMES[i];
            ov.appendChild(el);
            this._signEls.push(el);
        }

        this.container.appendChild(ov);
        this._overlay = ov;
        this._phaseEls = ov.querySelectorAll('[data-phase]');
        this._phaseTimes = [0, 5, 12, 20, 28, 36]; // seconds for phases 1–6
        this._maxPhase = 0;

        /* Cache tracked element references */
        this._tracked = {};
        ov.querySelectorAll('[data-track]').forEach(el => {
            this._tracked[el.dataset.track] = el;
        });
        this._syncPanelAnnotations();
    }

    _syncPanelAnnotations() {
        if (!this._overlay) return;
        const panelId = this.panelState?.activePanelId || 'fish';
        const fish = panelId === 'fish';
        const zodiac = panelId === 'zodiac';
        const transition = panelId === 'transition';
        const toggleAll = (selector, enabled) => {
            this._overlay.querySelectorAll(selector).forEach((el) => {
                el.classList.toggle('vis', enabled);
            });
        };

        toggleAll('.ch6-fish-label, .ch6-commissure-label', fish);
        toggleAll('.ch6-zodiac-label, .ch6-sign-name, .ch6-spring-label', zodiac || transition);
        toggleAll('.ch6-saturn-label, .ch6-jupiter-label, .ch6-conjunction-label, .ch6-orbiter-label', transition);
        this._maxPhase = transition ? 5 : zodiac ? 4 : 3;
    }

    /* ═══════════════════════════════════════════════════════════
       UPDATE — Animation Loop
       ═══════════════════════════════════════════════════════════ */
    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.03);
        const panelId = this.panelState?.activePanelId || 'fish';
        const dampRate = this.reducedMotion ? 7 : 3.3;
        this.fishFocus = THREE.MathUtils.damp(this.fishFocus, panelId === 'fish' ? 1 : 0.2, dampRate, dt);
        this.zodiacFocus = THREE.MathUtils.damp(this.zodiacFocus, panelId === 'zodiac' ? 1 : 0.1, dampRate, dt);
        this.transitionFocus = THREE.MathUtils.damp(this.transitionFocus, panelId === 'transition' ? 1 : 0, dampRate, dt);

        /* ─── Fish orbiting on zodiac ring ─── */
        for (let i = 0; i < 2; i++) {
            const fish = this.fishPair[i];
            const angle = fish.direction * t * (this.reducedMotion ? 0.012 : 0.04) + (i === 0 ? 0 : Math.PI);
            const orbitRadius = ZODIAC_R - this.fishFocus * 0.45 + this.transitionFocus * 0.2;
            fish.group.position.set(
                Math.cos(angle) * orbitRadius,
                Math.sin(t * 0.12 + i * 3) * 0.3,
                Math.sin(angle) * orbitRadius
            );
            fish.group.rotation.y = angle + (fish.direction > 0 ? Math.PI / 2 : -Math.PI / 2);

            /* Subtle body undulation */
            fish.group.rotation.z = Math.sin(t * 0.3 + i * 2) * 0.08;

            /* Trail particle shimmer */
            const tp = fish.trailPts.geometry.attributes.position.array;
            for (let j = 0; j < tp.length; j += 3) {
                tp[j] += (Math.random() - 0.5) * 0.01;
                tp[j + 1] += (Math.random() - 0.5) * 0.006;
                tp[j + 2] += (Math.random() - 0.5) * 0.004;
                tp[j] = Math.max(-1.5, Math.min(1.5, tp[j]));
                tp[j + 1] = Math.max(-0.4, Math.min(0.4, tp[j + 1]));
                tp[j + 2] = Math.max(-0.3, Math.min(0.3, tp[j + 2]));
            }
            fish.trailPts.geometry.attributes.position.needsUpdate = true;

            /* Glow pulse — intensifies when labels are visible (phase 3+) */
            if (fish.glowMat && this._maxPhase >= 3) {
                const baseOpacity = fish.isLight ? 0.1 : 0.06;
                fish.glowMat.opacity = baseOpacity + Math.sin(t * 0.4 + i) * 0.03 + this.fishFocus * (fish.isLight ? 0.12 : 0.08);
            }
            fish.bodyMat.opacity = (fish.isLight ? 0.62 : 0.42) + this.fishFocus * (fish.isLight ? 0.22 : 0.2) + this.transitionFocus * 0.06;
            fish.tailMat.opacity = (fish.isLight ? 0.46 : 0.3) + this.fishFocus * 0.16;
            fish.group.scale.setScalar(1 + this.fishFocus * 0.12);
        }

        /* ─── Commissure thread following fish ─── */
        const f0 = this.fishPair[0].group.position;
        const f1 = this.fishPair[1].group.position;
        const commPos = this.commissure.geometry.attributes.position.array;
        for (let i = 0; i <= this.commissureSegCount; i++) {
            const frac = i / this.commissureSegCount;
            const x = f0.x + (f1.x - f0.x) * frac;
            const y = f0.y + (f1.y - f0.y) * frac + Math.sin(frac * Math.PI) * 0.4 * Math.sin(t * 0.2);
            const z = f0.z + (f1.z - f0.z) * frac + Math.sin(frac * Math.PI * 2) * 0.2 * Math.cos(t * 0.15);
            commPos[i * 3] = x;
            commPos[i * 3 + 1] = y;
            commPos[i * 3 + 2] = z;
        }
        this.commissure.geometry.attributes.position.needsUpdate = true;
        /* Commissure opacity increases when labeled (phase 3+) */
        const mobileScale = this.width < 700 ? 0.42 : 1;
        const commBaseOp = this._maxPhase >= 3 ? 0.34 + this.fishFocus * 0.26 : 0.25;
        this.commissure.material.opacity = (commBaseOp + Math.sin(t * 0.3) * 0.1) * mobileScale;
        this.commissureGlow.material.opacity = (0.22 + this.fishFocus * 0.18 + this.transitionFocus * 0.12) * mobileScale;

        /* Commissure glow particles */
        const glPos = this.commissureGlow.geometry.attributes.position.array;
        for (let i = 0; i < this.commissureGlowN; i++) {
            const frac = (i + Math.sin(t * 0.5 + i)) / this.commissureGlowN;
            const idx = Math.floor(frac * this.commissureSegCount) * 3;
            if (idx + 2 < commPos.length) {
                glPos[i * 3] = commPos[idx] + (Math.random() - 0.5) * 0.1;
                glPos[i * 3 + 1] = commPos[idx + 1] + (Math.random() - 0.5) * 0.1;
                glPos[i * 3 + 2] = commPos[idx + 2] + (Math.random() - 0.5) * 0.1;
            }
        }
        this.commissureGlow.geometry.attributes.position.needsUpdate = true;

        /* ─── Saturn orbiting elements ─── */
        const lionAngle = t * (this.reducedMotion ? 0.05 : 0.2);
        this.saturnLion.position.set(
            Math.cos(lionAngle) * 1.4, Math.sin(lionAngle) * 0.5, Math.sin(lionAngle) * 1.4
        );
        const serpAngle = t * (this.reducedMotion ? 0.04 : 0.15) + Math.PI;
        this.saturnSerpent.position.set(
            Math.cos(serpAngle) * 1.2, Math.sin(serpAngle) * 0.3, Math.sin(serpAngle) * 1.2
        );
        this.saturnGroup.rotation.y = t * (this.reducedMotion ? 0.005 : 0.02);

        /* ─── Jupiter orbit ─── */
        const jupAngle = t * (this.reducedMotion ? 0.006 : 0.025);
        this.jupiter.position.set(
            Math.cos(jupAngle) * 4.5,
            2.5 + Math.sin(t * 0.08) * 0.3,
            Math.sin(jupAngle) * 4.5
        );

        /* ─── Conjunction flash ─── */
        const dist = this.saturnGroup.position.distanceTo(this.jupiter.position);
        const conjIntensity = Math.max(0, 1 - dist / 4);
        const thresholdPulse = 0.5 + Math.sin(t * 0.62) * 0.5;
        this.conjGroup.position.lerpVectors(this.saturnGroup.position, this.jupiter.position, 0.5);
        this.conjGroup.scale.setScalar(0.92 + conjIntensity * 0.18 + this.transitionFocus * 0.28);
        this.conjGroup.rotation.y = t * (this.reducedMotion ? 0.01 : 0.035);
        this.conjFlash.material.opacity = conjIntensity * 0.08 + this.transitionFocus * (0.035 + thresholdPulse * 0.035);
        this.conjHalo.material.opacity = this.transitionFocus * (0.04 + thresholdPulse * 0.018);
        this.conjRing.material.opacity = this.transitionFocus * (0.2 + thresholdPulse * 0.1);
        this.conjRing.rotation.z = t * (this.reducedMotion ? 0.006 : 0.025);
        this.conjAquariusRing.material.opacity = this.transitionFocus * (0.12 + (1 - thresholdPulse) * 0.08);
        this.conjAquariusRing.rotation.z = Math.PI / 9 - t * (this.reducedMotion ? 0.004 : 0.017);

        /* ─── Spring point precessing ─── */
        const springAngle = t * (this.reducedMotion ? 0.0015 : 0.005) + this.transitionFocus * 0.34;
        this.springPoint.position.set(
            Math.cos(springAngle) * ZODIAC_R, 0, Math.sin(springAngle) * ZODIAC_R
        );
        this.springPoint.rotation.y = t * 0.5;

        /* ─── Pisces/Aquarius arc pulse ─── */
        if (this._piscesArc && this._maxPhase >= 4) {
            this._piscesArc.material.opacity = 0.28 + Math.sin(t * 0.3) * 0.07 + this.fishFocus * 0.12 + this.zodiacFocus * 0.18;
        }
        if (this._aquariusArc && this._maxPhase >= 4) {
            this._aquariusArc.material.opacity = 0.12 + Math.sin(t * 0.25 + 1) * 0.05 + this.transitionFocus * 0.35 + this.zodiacFocus * 0.08;
        }
        this.wheelMaterials?.forEach(({ material, baseOpacity }) => {
            material.opacity = baseOpacity + this.zodiacFocus * 0.16 + this.transitionFocus * 0.08;
        });
        this.spokes?.forEach(({ line, baseOpacity, isPisces, isAquarius }) => {
            line.material.opacity = baseOpacity + this.zodiacFocus * 0.12 + (isPisces ? this.fishFocus * 0.08 : 0) + (isAquarius ? this.transitionFocus * 0.18 : 0);
        });
        this.segmentMarkers?.forEach((dot, index) => {
            const isAquarius = index === 10;
            const isPisces = index === 11;
            dot.material.opacity = 0.22 + this.zodiacFocus * 0.2 + (isPisces ? this.fishFocus * 0.2 : 0) + (isAquarius ? this.transitionFocus * 0.35 : 0);
        });
        this.saturnGroup.scale.setScalar(1 + this.transitionFocus * 0.26);
        this.jupiter.scale.setScalar(1 + this.transitionFocus * 0.22);

        /* ─── Wheel slow rotation ─── */
        this.wheelGroup.rotation.y = t * (this.reducedMotion ? 0.0015 : 0.006);

        /* ─── Camera ─── */
        const camAngle = t * (this.reducedMotion ? 0.002 : 0.012) + this.mouseSmooth.x * 0.25;
        const camH = 4.5 + this.mouseSmooth.y * 2.2 + this.zodiacFocus * 0.8 + this.transitionFocus * 0.2;
        const camRadius = 13.5 - this.fishFocus * 1.2 + this.zodiacFocus * 1.4 + this.transitionFocus * 0.8;
        this.camera.position.set(
            Math.sin(camAngle) * camRadius,
            camH,
            Math.cos(camAngle) * camRadius
        );
        this.camera.lookAt(0, 0.5, 0);

        /* ─── Starfield ─── */
        this.starfield.rotation.y += dt * (this.reducedMotion ? 0.00015 : 0.0008);

        /* ─── Bloom pulse ─── */
        if (this.bloom) {
            this.bloom.strength = 1.05 + Math.sin(t * 0.1) * 0.16 + conjIntensity * 0.5 + this.fishFocus * 0.12 + this.transitionFocus * 0.18;
        }

        /* ─── Phase reveal ─── */
        this._syncPanelAnnotations?.();

        /* ─── Dim title after 15s ─── */
        if (t > 15 && this._tracked) {
            const titleEl = this._overlay?.querySelector('.ch6-title');
            if (titleEl && !titleEl.classList.contains('dim')) {
                titleEl.classList.add('dim');
            }
        }

        /* ═══════════════════════════════════════════════════════
           TRACKED LABEL POSITIONING (3D → 2D projection)
           ═══════════════════════════════════════════════════════ */
        this.camera.updateMatrixWorld();

        /* --- Fish labels --- */
        if (this.fishFocus > 0.35) {
            /* Determine which side the fish is on, offset label to opposite side */
            const f0screen = this._project(this.fishPair[0].group.position);
            const f0Right = f0screen.x > this.width * 0.5;
            const lightPos = this._trackElement(
                this._tracked['fish-light'],
                this.fishPair[0].group.position,
                'fish-light', f0Right ? -200 : 40, -30
            );
            const f1screen = this._project(this.fishPair[1].group.position);
            const f1Right = f1screen.x > this.width * 0.5;
            const darkPos = this._trackElement(
                this._tracked['fish-dark'],
                this.fishPair[1].group.position,
                'fish-dark', f1Right ? -200 : 40, 20
            );

            /* Commissure label at midpoint of thread */
            const commMid = new THREE.Vector3().lerpVectors(f0, f1, 0.5);
            commMid.y += Math.sin(0.5 * Math.PI) * 0.4 * Math.sin(t * 0.2);
            const commLabelPos = this._trackElement(
                this._tracked['commissure'],
                commMid, 'commissure', -100, -20
            );

            /* Leader lines for fish */
            if (lightPos && !lightPos.behind) {
                this._updateLeader('fish-light', lightPos.x, lightPos.y, lightPos.anchorX, lightPos.anchorY, true);
            }
            if (darkPos && !darkPos.behind) {
                this._updateLeader('fish-dark', darkPos.x, darkPos.y + 8, darkPos.anchorX, darkPos.anchorY, true);
            }
            if (commLabelPos && !commLabelPos.behind) {
                this._updateLeader('commissure', commLabelPos.x + 100, commLabelPos.y + 8, commLabelPos.anchorX, commLabelPos.anchorY, true);
            }
        } else {
            this._updateLeader('fish-light', 0, 0, 0, 0, false);
            this._updateLeader('fish-dark', 0, 0, 0, 0, false);
            this._updateLeader('commissure', 0, 0, 0, 0, false);
        }

        /* --- Zodiac sign names (Phase 4) --- */
        if ((this.zodiacFocus > 0.35 || this.transitionFocus > 0.35) && this._signEls) {
            for (let i = 0; i < 12; i++) {
                const labelObj = this._zodiacPositions[i];
                /* Get world position of the label anchor (it's inside wheelGroup) */
                const worldPos = new THREE.Vector3();
                labelObj.getWorldPosition(worldPos);
                const p = this._project(worldPos);

                /* Only show signs facing camera (z < 1) and not behind */
                if (!p.behind && p.x > 20 && p.x < this.width - 20 && p.y > 20 && p.y < this.height - 20) {
                    this._signEls[i].style.left = p.x + 'px';
                    this._signEls[i].style.top = p.y + 'px';
                    this._signEls[i].style.transform = 'translate(-50%, -50%)';
                    this._signEls[i].style.visibility = 'visible';
                } else {
                    this._signEls[i].style.visibility = 'hidden';
                }
            }

            /* Spring point tracked label */
            const spWorld = new THREE.Vector3();
            this.springPoint.getWorldPosition(spWorld);
            /* Spring point — offset away from right edge */
            const spScreen = this._project(spWorld);
            const spRight = spScreen.x > this.width * 0.55;
            const spPos = this._trackElement(
                this._tracked['spring'],
                spWorld, 'spring', spRight ? -200 : 25, -30
            );
            if (spPos && !spPos.behind) {
                this._updateLeader('spring', spPos.x, spPos.y + 8, spPos.anchorX, spPos.anchorY, true);
            }
        } else if (this._signEls) {
            for (const el of this._signEls) el.style.visibility = 'hidden';
            this._updateLeader('spring', 0, 0, 0, 0, false);
        }

        /* --- Saturn, Jupiter, Conjunction labels (Phase 5) --- */
        if (this.transitionFocus > 0.35) {
            /* Saturn */
            const satWorld = new THREE.Vector3();
            this.saturnGroup.getWorldPosition(satWorld);
            /* Saturn — keep label from overlapping framing text */
            const satScreen = this._project(satWorld);
            const satBelow = satScreen.y > this.height * 0.35;
            const satPos = this._trackElement(
                this._tracked['saturn'],
                satWorld, 'saturn', -160, satBelow ? -60 : 35
            );
            if (satPos && !satPos.behind) {
                this._updateLeader('saturn', satPos.x + 40, satPos.y + 10, satPos.anchorX, satPos.anchorY, true);
            }

            /* Jupiter */
            const jupWorld = this.jupiter.position.clone();
            const jupScreen = this._project(jupWorld);
            const jupRight = jupScreen.x > this.width * 0.55;
            const jupPos = this._trackElement(
                this._tracked['jupiter'],
                jupWorld, 'jupiter', jupRight ? -180 : 45, -30
            );
            if (jupPos && !jupPos.behind) {
                this._updateLeader('jupiter', jupPos.x, jupPos.y + 10, jupPos.anchorX, jupPos.anchorY, true);
            }

            /* Great Conjunction — position at midpoint between Saturn and Jupiter */
            const conjMid = new THREE.Vector3().lerpVectors(satWorld, jupWorld, 0.5);
            this._trackElement(
                this._tracked['conjunction'],
                conjMid, 'conjunction', -80, -50
            );

            /* Lion micro-label */
            const lionWorld = new THREE.Vector3();
            this.saturnLion.getWorldPosition(lionWorld);
            this._trackElement(
                this._tracked['lion'],
                lionWorld, 'lion', 15, -12
            );

            /* Serpent micro-label */
            const serpWorld = new THREE.Vector3();
            this.saturnSerpent.getWorldPosition(serpWorld);
            this._trackElement(
                this._tracked['serpent'],
                serpWorld, 'serpent', 15, -12
            );
        } else {
            this._updateLeader('saturn', 0, 0, 0, 0, false);
            this._updateLeader('jupiter', 0, 0, 0, 0, false);
        }
    }

    /** Update an SVG leader line between a label position and its 3D anchor */
    _updateLeader(id, labelX, labelY, anchorX, anchorY, show = true) {
        const line = this._leaders[id];
        if (!line) return;
        if (!show) { line.style.display = 'none'; return; }
        line.style.display = '';
        line.setAttribute('x1', labelX);
        line.setAttribute('y1', labelY);
        line.setAttribute('x2', anchorX);
        line.setAttribute('y2', anchorY);
    }

    /* ═══ Render ═══ */
    render() { this.composer?.render(); }

    /* ═══ Resize ═══ */
    onResize(w, h) {
        if (!this.renderer || !this.camera) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer?.setSize(w, h);
        this.bloom?.setSize(w, h);
    }

    /* ═══ Dispose ═══ */
    dispose() {
        this._inputTarget?.removeEventListener?.('mousemove', this._onMM);
        if (this._overlay) this._overlay.remove();
        this.bloom?.dispose?.();
        this.composer?.dispose?.();
        if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
        this.scene?.traverse(o => {
            o.geometry?.dispose();
            if (o.material) [].concat(o.material).forEach(m => m.dispose());
        });
        this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
