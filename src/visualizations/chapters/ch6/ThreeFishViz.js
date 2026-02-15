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
 * Saturn/Jupiter/conjunction, phased annotations.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/* ─── Palette ─── */
const ZODIAC_GOLD = new THREE.Color('#c8a820');
const FISH_SILVER = new THREE.Color('#b0c4de');
const FISH_DARK = new THREE.Color('#2a3a5a');
const COMMISSURE = new THREE.Color('#ffd700');
const SATURN_BLACK = new THREE.Color('#1a1a28');
const SATURN_RING_C = new THREE.Color('#4a4a5a');
const JUPITER_AMBER = new THREE.Color('#d4a030');
const CONJUNCTION_C = new THREE.Color('#ffffff');
const SPRING_PT = new THREE.Color('#ff6600');
const LION_RED = new THREE.Color('#c0392b');
const SERPENT_GREEN = new THREE.Color('#2ecc71');
const VOID = 0x030310;

const ZODIAC_R = 5;

export default class ThreeFishViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        /* ═══ Renderer ═══ */
        const R = this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: true, alpha: false,
            powerPreference: 'high-performance',
        });
        R.setPixelRatio(Math.min(devicePixelRatio, 2));
        R.setSize(this.width, this.height);
        R.setClearColor(VOID);
        R.toneMapping = THREE.ACESFilmicToneMapping;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(VOID, 0.008);

        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 5, 14);

        this.mouse = new THREE.Vector2();
        this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => {
            this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        };
        addEventListener('mousemove', this._onMM);

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
            new THREE.Vector2(this.width, this.height), 1.2, 0.6, 0.4
        );
        this.composer.addPass(this.bloom);
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
            color: 0x6666aa, size: 0.04, transparent: true, opacity: 0.3,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.starfield);
    }

    /* ═══════════════════════════════════════════════════════════
       LAYER 2 — Zodiac Wheel
       ═══════════════════════════════════════════════════════════ */
    _createZodiacWheel() {
        this.wheelGroup = new THREE.Group();

        /* Main ring */
        const ringGeo = new THREE.TorusGeometry(ZODIAC_R, 0.03, 8, 128);
        this.wheelGroup.add(new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
            color: ZODIAC_GOLD, transparent: true, opacity: 0.25,
            blending: THREE.AdditiveBlending,
        })));

        /* Inner ring — fainter, smaller */
        const innerGeo = new THREE.TorusGeometry(ZODIAC_R * 0.85, 0.015, 8, 128);
        this.wheelGroup.add(new THREE.Mesh(innerGeo, new THREE.MeshBasicMaterial({
            color: ZODIAC_GOLD, transparent: true, opacity: 0.08,
            blending: THREE.AdditiveBlending,
        })));

        /* 12 segment markers + spokes */
        const SIGN_NAMES = [
            'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
            'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
        ];
        this.segmentMarkers = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const isPisces = i === 11;
            const isAquarius = i === 10;

            /* Marker dot */
            const dotGeo = new THREE.SphereGeometry(isPisces ? 0.09 : 0.05, 8, 8);
            const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({
                color: isPisces ? COMMISSURE : (isAquarius ? 0x22d3ee : ZODIAC_GOLD),
                transparent: true,
                opacity: isPisces ? 0.7 : (isAquarius ? 0.5 : 0.3),
            }));
            dot.position.set(Math.cos(angle) * ZODIAC_R, 0, Math.sin(angle) * ZODIAC_R);
            this.wheelGroup.add(dot);
            this.segmentMarkers.push(dot);

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
                const piscesArc = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({
                    color: COMMISSURE, transparent: true, opacity: 0.35,
                    blending: THREE.AdditiveBlending,
                }));
                this.wheelGroup.add(piscesArc);
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
                this.wheelGroup.add(new THREE.Line(arcGeo, new THREE.LineBasicMaterial({
                    color: 0x22d3ee, transparent: true, opacity: 0.15,
                    blending: THREE.AdditiveBlending,
                })));
            }
        }

        /* Spring Point — orange octahedron */
        this.springPoint = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.15, 0),
            new THREE.MeshStandardMaterial({
                color: SPRING_PT, emissive: SPRING_PT, emissiveIntensity: 0.6,
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
            const bodyGeo = new THREE.SphereGeometry(0.22, 12, 10);
            bodyGeo.scale(2.2, 0.6, 0.45);
            const bodyMat = new THREE.MeshStandardMaterial({
                color, emissive: color,
                emissiveIntensity: isLight ? 0.5 : 0.2,
                transparent: true, opacity: isLight ? 0.75 : 0.5,
                metalness: 0.4, roughness: 0.3,
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            group.add(body);

            /* Tail fin */
            const tailGeo = new THREE.ConeGeometry(0.12, 0.3, 4);
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

            /* Glow sphere */
            const glowGeo = new THREE.SphereGeometry(isLight ? 0.8 : 0.6, 12, 12);
            const glowMat = new THREE.MeshBasicMaterial({
                color: isLight ? 0x4488bb : 0x1a2244,
                transparent: true, opacity: isLight ? 0.06 : 0.03,
                blending: THREE.AdditiveBlending,
            });
            group.add(new THREE.Mesh(glowGeo, glowMat));

            this.scene.add(group);
            this.fishPair.push({
                group, direction: isLight ? 1 : -1, trailPts, isLight
            });
        }
    }

    /* ═══════════════════════════════════════════════════════════
       LAYER 3b — Commissure Thread
       ═══════════════════════════════════════════════════════════ */
    _createCommissureThread() {
        /* Main commissure — a catenary-like curve between the two fish */
        const segCount = 40;
        const pts = [];
        for (let i = 0; i <= segCount; i++) {
            pts.push(new THREE.Vector3(0, 0, 0));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        this.commissure = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color: COMMISSURE, transparent: true, opacity: 0.35,
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
            color: COMMISSURE, size: 0.07, transparent: true, opacity: 0.4,
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
            color: SATURN_RING_C, transparent: true, opacity: 0.3,
        }));
        sRing.rotation.x = Math.PI / 3;
        this.saturnGroup.add(sRing);

        /* Dark aura */
        const auraGeo = new THREE.SphereGeometry(1.2, 12, 12);
        this.saturnGroup.add(new THREE.Mesh(auraGeo, new THREE.MeshBasicMaterial({
            color: 0x0a0a1e, transparent: true, opacity: 0.08,
            blending: THREE.AdditiveBlending, side: THREE.BackSide,
        })));

        /* Orbiting Lion (red cone) */
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

        /* Conjunction flash sphere */
        this.conjFlash = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 16, 16),
            new THREE.MeshBasicMaterial({
                color: CONJUNCTION_C, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending,
            })
        );
        this.scene.add(this.conjFlash);
    }

    /* ═══ Lights ═══ */
    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));
        const p1 = new THREE.PointLight(0xc8a820, 0.5, 20);
        p1.position.set(0, 3, 5);
        this.scene.add(p1);
        const p2 = new THREE.PointLight(0x4a4a7a, 0.3, 25);
        p2.position.set(-4, 4, -4);
        this.scene.add(p2);
    }

    /* ═══════════════════════════════════════════════════════════
       LAYER 5 — HTML Annotations (6 phases)
       ═══════════════════════════════════════════════════════════ */
    _buildAnnotations() {
        const ov = document.createElement('div');
        ov.className = 'ch6-overlay';
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

            .ch6-overlay {
                position: absolute; inset: 0;
                pointer-events: none;
                font-family: 'Instrument Serif', serif;
                overflow: hidden;
            }

            /* Phase system */
            .ch6-overlay [data-phase] {
                opacity: 0;
                transition: opacity 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                            transform 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                transform: translateY(8px);
            }
            .ch6-overlay [data-phase].vis {
                opacity: 1;
                transform: translateY(0);
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

            /* ═══ PHASE 3 — Fish labels ═══ */
            .ch6-fish-label {
                position: absolute;
                font-family: 'Cormorant Garamond', serif;
                font-size: 8px;
                letter-spacing: 3px;
                text-transform: uppercase;
                line-height: 1.4;
            }
            .ch6-fish--light {
                top: 42%;
                right: 12%;
                color: rgba(176, 196, 222, 0.5);
                text-align: right;
            }
            .ch6-fish--dark {
                top: 56%;
                left: 12%;
                color: rgba(42, 58, 90, 0.6);
            }
            .ch6-fish-explain {
                display: block;
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 10px;
                letter-spacing: 0;
                margin-top: 4px;
                line-height: 1.4;
                max-width: 160px;
            }
            .ch6-fish--light .ch6-fish-explain {
                color: rgba(176, 196, 222, 0.35);
            }
            .ch6-fish--dark .ch6-fish-explain {
                color: rgba(80, 100, 140, 0.45);
            }

            /* Commissure label */
            .ch6-commissure-label {
                position: absolute;
                top: 49%;
                left: 50%;
                transform: translateX(-50%);
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 9px;
                letter-spacing: 1px;
                color: rgba(255, 215, 0, 0.3);
                text-align: center;
                white-space: nowrap;
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
            .ch6-spring-label {
                position: absolute;
                bottom: 22%;
                right: 10%;
                font-family: 'Cormorant Garamond', serif;
                font-size: 8px;
                letter-spacing: 2px;
                color: rgba(255, 102, 0, 0.4);
                text-align: right;
            }
            .ch6-spring-explain {
                display: block;
                font-style: italic;
                font-size: 9.5px;
                letter-spacing: 0;
                margin-top: 3px;
                color: rgba(255, 102, 0, 0.25);
                max-width: 150px;
            }
            .ch6-pisces-label {
                position: absolute;
                top: 30%;
                right: 6%;
                font-family: 'Cormorant Garamond', serif;
                font-size: 7px;
                letter-spacing: 4px;
                text-transform: uppercase;
                color: rgba(255, 215, 0, 0.2);
            }
            .ch6-aquarius-label {
                position: absolute;
                top: 30%;
                left: 6%;
                font-family: 'Cormorant Garamond', serif;
                font-size: 7px;
                letter-spacing: 4px;
                text-transform: uppercase;
                color: rgba(34, 211, 238, 0.2);
            }

            /* ═══ PHASE 5 — Saturn + Jupiter ═══ */
            .ch6-saturn-label {
                position: absolute;
                top: 16%;
                left: 10%;
                font-size: 10px;
                letter-spacing: 1.5px;
                color: rgba(74, 74, 90, 0.55);
            }
            .ch6-saturn-explain {
                display: block;
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 9.5px;
                letter-spacing: 0;
                margin-top: 4px;
                color: rgba(74, 74, 90, 0.35);
                max-width: 130px;
                line-height: 1.4;
            }
            .ch6-jupiter-label {
                position: absolute;
                top: 16%;
                right: 10%;
                font-size: 10px;
                letter-spacing: 1.5px;
                color: rgba(212, 160, 48, 0.5);
                text-align: right;
            }
            .ch6-jupiter-explain {
                display: block;
                font-family: 'Cormorant Garamond', serif;
                font-style: italic;
                font-size: 9.5px;
                letter-spacing: 0;
                margin-top: 4px;
                color: rgba(212, 160, 48, 0.3);
                max-width: 130px;
                line-height: 1.4;
            }
            .ch6-conjunction-label {
                position: absolute;
                top: 24%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 9px;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.2);
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
                color: rgba(255, 255, 255, 0.15);
            }

            /* Leader lines */
            .ch6-leader {
                position: absolute;
                background: none;
                pointer-events: none;
            }
            .ch6-leader--saturn {
                top: 22%;
                left: 18%;
                width: 40px;
                height: 1px;
                border-top: 1px dashed rgba(74, 74, 90, 0.15);
            }
            .ch6-leader--jupiter {
                top: 22%;
                right: 18%;
                width: 40px;
                height: 1px;
                border-top: 1px dashed rgba(212, 160, 48, 0.15);
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
        `;
        ov.appendChild(style);

        ov.innerHTML += `
            <!-- Phase 2: Framing sentence -->
            <div class="ch6-framing" data-phase="2">
                The birth of Christ coincided with the dawn
                of the <em>Age of Pisces</em> — two fish,
                swimming in opposite directions,
                bound by a single golden thread.<br><br>
                <em>One fish is light. The other is shadow.</em><br>
                Jung saw in this the eternal tension
                between Christ and Antichrist — the
                hostile brothers of the psyche.
            </div>

            <!-- Phase 3: Fish labels + commissure -->
            <div class="ch6-fish-label ch6-fish--light" data-phase="3">
                Christ-Fish
                <span class="ch6-fish-explain">the luminous half — what the age chose to worship</span>
            </div>
            <div class="ch6-fish-label ch6-fish--dark" data-phase="3">
                Shadow-Fish
                <span class="ch6-fish-explain">the dark twin — the Antichrist, denied but never absent</span>
            </div>
            <div class="ch6-commissure-label" data-phase="3">
                the commissure — what binds the opposites
            </div>

            <!-- Phase 4: Zodiac →  -->
            <div class="ch6-zodiac-label" data-phase="4">the great year</div>
            <div class="ch6-pisces-label" data-phase="4">pisces</div>
            <div class="ch6-aquarius-label" data-phase="4">aquarius</div>
            <div class="ch6-spring-label" data-phase="4">
                Spring Point
                <span class="ch6-spring-explain">slowly precessing from Pisces toward Aquarius</span>
            </div>

            <!-- Phase 5: Saturn + Jupiter + Conjunction -->
            <div class="ch6-saturn-label" data-phase="5">
                Saturn
                <span class="ch6-saturn-explain">the "black star" — malefic father of time, orbited by lion and serpent</span>
            </div>
            <div class="ch6-jupiter-label" data-phase="5">
                Jupiter
                <span class="ch6-jupiter-explain">life and justice — the benefic counterpart</span>
            </div>
            <div class="ch6-conjunction-label" data-phase="5">
                Great Conjunction
                <span class="ch6-conjunction-explain">Saturn meets Jupiter in Pisces, ~7 BC — the Star of Bethlehem</span>
            </div>
            <div class="ch6-leader ch6-leader--saturn" data-phase="5"></div>
            <div class="ch6-leader ch6-leader--jupiter" data-phase="5"></div>

            <!-- Phase 6: Final reflection -->
            <div class="ch6-final" data-phase="6">
                The spring point drifts from Pisces into Aquarius —<br>
                <em>a new aeon approaches</em>
            </div>
        `;

        this.container.appendChild(ov);
        this._overlay = ov;
        this._phaseEls = ov.querySelectorAll('[data-phase]');
        this._phaseTimes = [0, 5, 12, 20, 28, 36]; // seconds for phases 1–6
        this._maxPhase = 0;
    }

    /* ═══════════════════════════════════════════════════════════
       UPDATE — Animation Loop
       ═══════════════════════════════════════════════════════════ */
    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.03);

        /* ─── Fish orbiting on zodiac ring ─── */
        for (let i = 0; i < 2; i++) {
            const fish = this.fishPair[i];
            const angle = fish.direction * t * 0.04 + (i === 0 ? 0 : Math.PI);
            fish.group.position.set(
                Math.cos(angle) * ZODIAC_R,
                Math.sin(t * 0.12 + i * 3) * 0.3,
                Math.sin(angle) * ZODIAC_R
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
                /* Keep within bounds */
                tp[j] = Math.max(-1.5, Math.min(1.5, tp[j]));
                tp[j + 1] = Math.max(-0.4, Math.min(0.4, tp[j + 1]));
                tp[j + 2] = Math.max(-0.3, Math.min(0.3, tp[j + 2]));
            }
            fish.trailPts.geometry.attributes.position.needsUpdate = true;
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
        this.commissure.material.opacity = 0.25 + Math.sin(t * 0.3) * 0.1;

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
        const lionAngle = t * 0.2;
        this.saturnLion.position.set(
            Math.cos(lionAngle) * 1.4, Math.sin(lionAngle) * 0.5, Math.sin(lionAngle) * 1.4
        );
        const serpAngle = t * 0.15 + Math.PI;
        this.saturnSerpent.position.set(
            Math.cos(serpAngle) * 1.2, Math.sin(serpAngle) * 0.3, Math.sin(serpAngle) * 1.2
        );
        this.saturnGroup.rotation.y = t * 0.02;

        /* ─── Jupiter orbit ─── */
        const jupAngle = t * 0.025;
        this.jupiter.position.set(
            Math.cos(jupAngle) * 4.5,
            2.5 + Math.sin(t * 0.08) * 0.3,
            Math.sin(jupAngle) * 4.5
        );

        /* ─── Conjunction flash ─── */
        const dist = this.saturnGroup.position.distanceTo(this.jupiter.position);
        const conjIntensity = Math.max(0, 1 - dist / 4);
        this.conjFlash.material.opacity = conjIntensity * 0.18;
        this.conjFlash.position.lerpVectors(this.saturnGroup.position, this.jupiter.position, 0.5);
        this.conjFlash.scale.setScalar(1 + conjIntensity * 0.5);

        /* ─── Spring point precessing ─── */
        const springAngle = t * 0.005;
        this.springPoint.position.set(
            Math.cos(springAngle) * ZODIAC_R, 0, Math.sin(springAngle) * ZODIAC_R
        );
        this.springPoint.rotation.y = t * 0.5;

        /* ─── Wheel slow rotation ─── */
        this.wheelGroup.rotation.y = t * 0.006;

        /* ─── Camera ─── */
        const camAngle = t * 0.012 + this.mouseSmooth.x * 0.25;
        const camH = 4.5 + this.mouseSmooth.y * 2.5;
        this.camera.position.set(
            Math.sin(camAngle) * 14,
            camH,
            Math.cos(camAngle) * 14
        );
        this.camera.lookAt(0, 0.5, 0);

        /* ─── Starfield ─── */
        this.starfield.rotation.y += dt * 0.0008;

        /* ─── Bloom pulse ─── */
        if (this.bloom) {
            this.bloom.strength = 1.0 + Math.sin(t * 0.1) * 0.2 + conjIntensity * 0.6;
        }

        /* ─── Phase reveal ─── */
        for (let p = 0; p < this._phaseTimes.length; p++) {
            if (t >= this._phaseTimes[p] && p + 1 > this._maxPhase) {
                this._maxPhase = p + 1;
                this._phaseEls.forEach(el => {
                    if (parseInt(el.dataset.phase) <= this._maxPhase) {
                        el.classList.add('vis');
                    }
                });
            }
        }
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
        removeEventListener('mousemove', this._onMM);
        if (this._overlay) this._overlay.remove();
        if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
        this.scene?.traverse(o => {
            o.geometry?.dispose();
            if (o.material) [].concat(o.material).forEach(m => m.dispose());
        });
        this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
