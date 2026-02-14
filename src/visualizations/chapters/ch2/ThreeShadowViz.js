/**
 * ThreeShadowViz.js — Chapter 2: "The Shadow"
 *
 * Jung, Aion §13–§19:
 *   "The shadow personifies everything that the subject
 *    refuses to acknowledge about himself."
 *   "One does not become enlightened by imagining figures
 *    of light, but by making the darkness conscious."
 *   "Projections change the world into the replica of
 *    one's own unknown face."
 *
 * ── VISUAL DESIGN RATIONALE ──────────────────────────────
 *
 * A newcomer must INSTANTLY grasp the metaphor. Every visual
 * element is chosen so the concept is self-evident:
 *
 *   EGO: A radiant, warm figure surrounded by light rays
 *         and a protective "persona shell" — this is you,
 *         the self you present to the world.
 *
 *   SHADOW: A dark, larger, distorted mirror of the ego
 *           with smoky tendrils that writhes and squirms —
 *           autonomous and uncanny. It is visually LARGER
 *           than the ego (Jung: the shadow often contains
 *           more psychic mass than the ego).
 *
 *   MIRROR: A visible vertical boundary between them —
 *           you can see yourself on one side and the dark
 *           mirror image on the other.
 *
 *   PROJECTION ARCS: Bright purple tendrils arcing away
 *           from the shadow with pulsing dots at their ends,
 *           representing how shadow material is "cast onto"
 *           other people.
 *
 *   COCOON: Circling strands that wrap the ego when projection
 *           is active — Jung's "isolating cocoon of illusions."
 *
 *   INTEGRATION: Every cycle, the ego and shadow drift
 *           together and a warm pulse of light merges them —
 *           the moment of recognizing "that is also me."
 *
 * ── ANNOTATION DESIGN ────────────────────────────────────
 *
 *   Annotations are READABLE (not ghostly-invisible).
 *   Each has a LEADER LINE connecting to the visual element.
 *   They build a narrative that teaches Jung's concepts:
 *
 *   Phase 1 (2s):   Chapter heading
 *   Phase 2 (5s):   Ego identification + leader line
 *   Phase 3 (10s):  Shadow identification + leader line
 *   Phase 4 (16s):  What "projection" means
 *   Phase 5 (22s):  Jung quote
 *   Phase 6 (cyc):  Integration insight
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/* ── Palette ── */
const VOID = 0x020206;
const EGO_WARM = new THREE.Color('#e8d8c0');  // warm cream — human
const EGO_GLOW = new THREE.Color('#c0a880');  // golden aura
const EGO_RAY = new THREE.Color('#d0c0a0');
const SHADOW_CLR = new THREE.Color('#0a0418');  // near-black purple
const SHADOW_GLOW = new THREE.Color('#3a1060');  // deep violet
const PROJ_CLR = new THREE.Color('#9c27b0');  // vivid purple
const PROJ_CLR2 = new THREE.Color('#7b1fa2');
const MIRROR_CLR = new THREE.Color('#403060');
const INTEG_CLR = new THREE.Color('#e0c0ff');  // soft lavender

export default class ThreeShadowViz extends BaseViz {
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

    async init() {
        /* ── Renderer ── */
        const R = this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: true, alpha: false,
            powerPreference: 'high-performance'
        });
        R.setPixelRatio(Math.min(devicePixelRatio, 2));
        R.setSize(this.width, this.height);
        R.setClearColor(VOID);
        R.toneMapping = THREE.ACESFilmicToneMapping;
        R.toneMappingExposure = 1.1;

        const S = this.scene = new THREE.Scene();
        S.fog = new THREE.FogExp2(VOID, 0.008);

        const cam = this.camera = new THREE.PerspectiveCamera(
            50, this.width / this.height, 0.1, 200
        );
        cam.position.set(0, 1.5, 14);

        /* ── Mouse ── */
        this.mouse = new THREE.Vector2();
        this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => {
            this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        };
        addEventListener('mousemove', this._onMM);

        /* ── Build scene ── */
        this._buildEgo();
        this._buildShadow();
        this._buildMirror();
        this._buildProjections();
        this._buildCocoon();
        this._buildAtmosphere();
        this._buildGround();
        this._buildAnnotations();

        /* ── Lighting ── */
        S.add(new THREE.AmbientLight(0x080812, 0.2));

        // Ego warm light
        this.egoLight = new THREE.PointLight(0xd0b080, 1.5, 15);
        this.egoLight.position.set(-3, 2, 4);
        S.add(this.egoLight);

        // Shadow dim light
        this.shadowLight = new THREE.PointLight(0x200040, 0.6, 12);
        this.shadowLight.position.set(3, -1, 3);
        S.add(this.shadowLight);

        // Integration light (off by default)
        this.integrationLight = new THREE.PointLight(0xe0c0ff, 0, 14);
        this.integrationLight.position.set(0, 0, 3);
        S.add(this.integrationLight);

        // Back rim light
        const rim = new THREE.DirectionalLight(0x1a1030, 0.3);
        rim.position.set(0, 5, -10);
        S.add(rim);

        /* ── Post-processing ── */
        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(S, cam));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.4, 0.4, 0.25
        );
        this.composer.addPass(this.bloom);

        this.introT = 0;
    }

    /* ══════════════════════════════════════════════════════
     *  EGO — warm, radiant, human-like figure of light
     * ══════════════════════════════════════════════════════ */
    _buildEgo() {
        const g = this.egoGroup = new THREE.Group();
        g.position.set(-3.5, 0, 0);

        // Core sphere — warm, cream-colored
        this.egoCore = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshStandardMaterial({
                color: EGO_WARM, emissive: EGO_WARM,
                emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.05
            })
        );
        g.add(this.egoCore);

        // Inner glow halo
        this.egoGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 16, 16),
            new THREE.MeshBasicMaterial({
                color: EGO_GLOW, transparent: true, opacity: 0.12,
                blending: THREE.AdditiveBlending, side: THREE.BackSide
            })
        );
        g.add(this.egoGlow);

        // Outer glow
        const outerGlow = new THREE.Mesh(
            new THREE.SphereGeometry(1.4, 12, 12),
            new THREE.MeshBasicMaterial({
                color: EGO_GLOW, transparent: true, opacity: 0.04,
                blending: THREE.AdditiveBlending, side: THREE.BackSide
            })
        );
        g.add(outerGlow);

        // Light rays emanating outward — "the light of consciousness"
        this.egoRays = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const len = 1.2 + Math.random() * 1.0;
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(
                    Math.cos(angle) * len,
                    Math.sin(angle) * len * 0.6,
                    0
                )
            ];
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({
                    color: EGO_RAY, transparent: true, opacity: 0.15,
                    blending: THREE.AdditiveBlending
                })
            );
            g.add(line);
            this.egoRays.push({ line, baseLen: len, angle, ph: Math.random() * Math.PI * 2 });
        }

        // "Persona shell" — thin ring representing the mask
        this.personaShell = new THREE.Mesh(
            new THREE.TorusGeometry(0.75, 0.015, 4, 80),
            new THREE.MeshBasicMaterial({
                color: EGO_GLOW, transparent: true, opacity: 0.1,
                blending: THREE.AdditiveBlending
            })
        );
        this.personaShell.rotation.x = Math.PI / 2;
        g.add(this.personaShell);

        this.scene.add(g);
    }

    /* ══════════════════════════════════════════════════════
     *  SHADOW — dark, LARGER, distorted mirror of the ego
     * ══════════════════════════════════════════════════════ */
    _buildShadow() {
        const g = this.shadowGroup = new THREE.Group();
        g.position.set(3.5, 0, 0);

        // Shadow is LARGER — Jung: the shadow often contains more
        // psychic mass than we realize
        this.shadowCore = new THREE.Mesh(
            new THREE.SphereGeometry(0.65, 32, 32),
            new THREE.MeshStandardMaterial({
                color: SHADOW_CLR, emissive: SHADOW_GLOW,
                emissiveIntensity: 0.15, roughness: 0.95, metalness: 0.3
            })
        );
        g.add(this.shadowCore);

        // Dark aura
        this.shadowAura = new THREE.Mesh(
            new THREE.SphereGeometry(1.4, 12, 12),
            new THREE.MeshBasicMaterial({
                color: SHADOW_GLOW, transparent: true, opacity: 0.08,
                blending: THREE.AdditiveBlending, side: THREE.BackSide
            })
        );
        g.add(this.shadowAura);

        // Smoky tendrils — irregular, reaching outward
        this.tendrils = [];
        for (let i = 0; i < 14; i++) {
            const angle = (i / 14) * Math.PI * 2;
            const len = 1.0 + Math.random() * 2.0;
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(
                    Math.cos(angle) * len * 0.35,
                    Math.sin(angle * 0.8) * len * 0.3,
                    Math.sin(angle) * len * 0.35
                ),
                new THREE.Vector3(
                    Math.cos(angle) * len,
                    Math.sin(angle * 0.4) * len * 0.5 - 0.3,
                    Math.sin(angle) * len
                )
            ];
            const curve = new THREE.QuadraticBezierCurve3(...pts);
            const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: SHADOW_GLOW, transparent: true, opacity: 0.15,
                blending: THREE.AdditiveBlending
            }));
            g.add(line);
            this.tendrils.push({ line, ph: Math.random() * Math.PI * 2, len });
        }

        // "Dark rays" — anti-light, absorbing
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + 0.2;
            const len = 1.5 + Math.random() * 0.8;
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(
                    Math.cos(angle) * len,
                    Math.sin(angle) * len * 0.5,
                    0
                )
            ];
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({
                    color: SHADOW_GLOW, transparent: true, opacity: 0.06,
                    blending: THREE.AdditiveBlending
                })
            );
            g.add(line);
        }

        this.scene.add(g);
    }

    /* ══════════════════════════════════════════════════════
     *  MIRROR — visible vertical boundary
     * ══════════════════════════════════════════════════════ */
    _buildMirror() {
        // Main mirror line — more visible
        this.mirrorPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.02, 14),
            new THREE.MeshBasicMaterial({
                color: MIRROR_CLR, transparent: true, opacity: 0.25
            })
        );
        this.scene.add(this.mirrorPlane);

        // Shimmer dots along mirror line
        this.mirrorDots = [];
        for (let i = 0; i < 20; i++) {
            const y = -5 + i * 0.55;
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.015, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: MIRROR_CLR, transparent: true, opacity: 0.15,
                    blending: THREE.AdditiveBlending
                })
            );
            dot.position.set(0, y, 0);
            this.scene.add(dot);
            this.mirrorDots.push({ dot, ph: i * 0.4 });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  PROJECTIONS — vivid arcs cast outward from shadow
     * ══════════════════════════════════════════════════════ */
    _buildProjections() {
        this.projArcs = [];
        const dirs = [
            { x: 6, y: 2, z: 3 },
            { x: 7, y: -1, z: -2 },
            { x: 8, y: 0.5, z: 4 },
            { x: 5, y: -2, z: -3 },
            { x: 9, y: 1, z: -1 },
            { x: 6, y: 3, z: 2 },
            { x: 7, y: -3, z: 1 },
        ];
        for (const d of dirs) {
            const pts = [
                new THREE.Vector3(3.5, 0, 0),
                new THREE.Vector3(3.5 + d.x * 0.4, d.y * 0.6, d.z * 0.4),
                new THREE.Vector3(3.5 + d.x, d.y, d.z)
            ];
            const curve = new THREE.QuadraticBezierCurve3(...pts);
            const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: PROJ_CLR, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending
            }));
            this.scene.add(line);

            // Pulsing "target" dot at endpoint
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: PROJ_CLR, transparent: true, opacity: 0,
                    blending: THREE.AdditiveBlending
                })
            );
            dot.position.set(pts[2].x, pts[2].y, pts[2].z);
            this.scene.add(dot);

            // Tiny glow around target
            const targetGlow = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: PROJ_CLR2, transparent: true, opacity: 0,
                    blending: THREE.AdditiveBlending
                })
            );
            targetGlow.position.copy(dot.position);
            this.scene.add(targetGlow);

            this.projArcs.push({
                line, dot, targetGlow,
                ph: Math.random() * Math.PI * 2,
                speed: 0.2 + Math.random() * 0.2
            });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  COCOON — strands wrapping the ego during projection
     * ══════════════════════════════════════════════════════ */
    _buildCocoon() {
        this.cocoonStrands = [];
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const r = 1.3 + Math.random() * 0.5;
            const pts = [];
            const segs = 18;
            for (let j = 0; j < segs; j++) {
                const frac = j / (segs - 1);
                const a = angle + frac * 2.5;
                const y = -2 + frac * 4;
                pts.push(new THREE.Vector3(
                    Math.cos(a) * r * (0.4 + frac * 0.6),
                    y,
                    Math.sin(a) * r * (0.4 + frac * 0.6)
                ));
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: PROJ_CLR2, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending
            }));
            line.position.set(-3.5, 0, 0);
            this.scene.add(line);
            this.cocoonStrands.push({ line, ph: Math.random() * Math.PI * 2 });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  ATMOSPHERE — particles and depth
     * ══════════════════════════════════════════════════════ */
    _buildAtmosphere() {
        const N = 1000;
        const pos = new Float32Array(N * 3);
        const sizes = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 40;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
            sizes[i] = 0.02 + Math.random() * 0.06;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.smoke = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x0a0520, size: 0.05, transparent: true, opacity: 0.3,
            blending: THREE.AdditiveBlending, depthWrite: false
        }));
        this.scene.add(this.smoke);
    }

    /* ── GROUND ── */
    _buildGround() {
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshStandardMaterial({
                color: 0x030310, roughness: 0.95, metalness: 0.05,
                transparent: true, opacity: 0.5
            })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -3;
        this.scene.add(ground);
    }

    /* ══════════════════════════════════════════════════════════════════
     *  ANNOTATIONS — READABLE, with LEADER LINES connecting to elements
     * ══════════════════════════════════════════════════════════════════ */
    _buildAnnotations() {
        const ov = this._annotationOverlay = document.createElement('div');
        ov.className = 'ch2-annotations';
        ov.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');

.ch2-annotations {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 10;
    overflow: hidden;
}

.ch2-a {
    position: absolute;
    font-family: 'Instrument Serif', serif;
    opacity: 0;
    transition: opacity 2.8s cubic-bezier(0.16, 1, 0.3, 1),
                transform 2.8s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateY(6px);
    will-change: opacity, transform;
}
.ch2-a.vis {
    opacity: 1;
    transform: translateY(0);
}

/* ─── Phase 1: Chapter heading ─── */
.ch2-a--heading {
    top: 6vh;
    left: 4.5vw;
}
.ch2-a--heading .ch2-eyebrow {
    font-family: 'Inter', 'Helvetica Neue', sans-serif;
    font-size: clamp(0.55rem, 0.9vw, 0.72rem);
    letter-spacing: 0.45em;
    text-transform: uppercase;
    color: rgba(140, 100, 180, 0.35);
    margin-bottom: 0.4em;
}
.ch2-a--heading .ch2-title {
    font-size: clamp(2rem, 4vw, 3.4rem);
    font-style: italic;
    color: rgba(160, 120, 210, 0.45);
    letter-spacing: -0.02em;
    line-height: 1.05;
}

/* ─── Phase 2: Ego annotation (left, with leader line) ─── */
.ch2-a--ego {
    top: 28vh;
    left: 4vw;
    max-width: 22ch;
}
.ch2-a--ego .ch2-leader {
    display: block;
    width: 50px;
    height: 1px;
    background: linear-gradient(to right, rgba(208,176,128,0.5), rgba(208,176,128,0));
    margin-bottom: 10px;
    transform-origin: left;
    animation: ch2-leaderPulse 4s ease-in-out infinite;
}
@keyframes ch2-leaderPulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
}
.ch2-a--ego .ch2-text {
    font-size: clamp(0.8rem, 1.2vw, 1rem);
    font-style: italic;
    color: rgba(220, 210, 190, 0.5);
    line-height: 1.7;
}
.ch2-a--ego .ch2-text em {
    font-style: normal;
    color: rgba(232, 216, 192, 0.7);
    font-weight: 400;
}
.ch2-a--ego .ch2-note {
    display: block;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-size: 0.55em;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(208, 176, 128, 0.2);
    margin-top: 0.8em;
}

/* ─── Phase 3: Shadow annotation (right, with leader line) ─── */
.ch2-a--shadow {
    top: 28vh;
    right: 4vw;
    max-width: 22ch;
    text-align: right;
}
.ch2-a--shadow .ch2-leader {
    display: block;
    width: 50px;
    height: 1px;
    background: linear-gradient(to left, rgba(120,60,180,0.5), rgba(120,60,180,0));
    margin-left: auto;
    margin-bottom: 10px;
    animation: ch2-leaderPulseShadow 4s ease-in-out infinite;
}
@keyframes ch2-leaderPulseShadow {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
}
.ch2-a--shadow .ch2-text {
    font-size: clamp(0.8rem, 1.2vw, 1rem);
    font-style: italic;
    color: rgba(160, 100, 220, 0.5);
    line-height: 1.7;
}
.ch2-a--shadow .ch2-text em {
    font-style: normal;
    color: rgba(180, 120, 240, 0.7);
    font-weight: 400;
}
.ch2-a--shadow .ch2-note {
    display: block;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-size: 0.55em;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(140, 80, 200, 0.25);
    margin-top: 0.8em;
}

/* ─── Phase 4: Projection annotation (lower right) ─── */
.ch2-a--projection {
    bottom: 28vh;
    right: 6vw;
    max-width: 26ch;
    text-align: right;
}
.ch2-a--projection .ch2-leader {
    display: block;
    width: 35px;
    height: 1px;
    background: linear-gradient(to left, rgba(156,39,176,0.4), rgba(156,39,176,0));
    margin-left: auto;
    margin-bottom: 8px;
}
.ch2-a--projection .ch2-text {
    font-size: clamp(0.72rem, 1.05vw, 0.88rem);
    font-style: italic;
    color: rgba(156, 39, 176, 0.4);
    line-height: 1.7;
}
.ch2-a--projection .ch2-text em {
    font-style: normal;
    color: rgba(180, 60, 210, 0.6);
}

/* ─── Phase 5: Jung quote (bottom left) ─── */
.ch2-a--quote {
    bottom: 7vh;
    left: 4.5vw;
    max-width: 30ch;
}
.ch2-a--quote .ch2-quotemark {
    display: block;
    font-size: 2rem;
    line-height: 1;
    color: rgba(140, 100, 200, 0.12);
    margin-bottom: 0.2em;
}
.ch2-a--quote .ch2-text {
    font-size: clamp(0.82rem, 1.2vw, 1rem);
    font-style: italic;
    color: rgba(180, 150, 220, 0.4);
    line-height: 1.7;
}
.ch2-a--quote .ch2-attr {
    display: block;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-size: 0.5em;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(140, 110, 190, 0.2);
    margin-top: 0.8em;
}

/* ─── Phase 6: Integration annotation (center, synced) ─── */
.ch2-a--integration {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) translateY(6px);
    text-align: center;
    max-width: 24ch;
    transition: opacity 2s ease, transform 2s ease;
}
.ch2-a--integration.vis {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(0);
}
.ch2-a--integration.hid {
    opacity: 0;
    transform: translate(-50%, -50%) translateY(6px);
}
.ch2-a--integration .ch2-integ-text {
    font-size: clamp(0.9rem, 1.4vw, 1.15rem);
    font-style: italic;
    color: rgba(224, 192, 255, 0.55);
    line-height: 1.65;
    letter-spacing: 0.03em;
}
.ch2-a--integration .ch2-integ-sub {
    display: block;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-size: 0.5em;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(200, 160, 240, 0.2);
    margin-top: 0.6em;
}

/* ─── Persistent micro-labels near objects ─── */
.ch2-micro {
    position: absolute;
    font-family: 'Inter', sans-serif;
    font-size: clamp(0.45rem, 0.65vw, 0.55rem);
    letter-spacing: 0.35em;
    text-transform: uppercase;
    opacity: 0;
    transition: opacity 3s ease;
}
.ch2-micro.vis { opacity: 1; }

.ch2-micro--ego {
    left: 20%;
    top: 55%;
    color: rgba(208, 176, 128, 0.2);
}
.ch2-micro--shadow {
    right: 18%;
    top: 55%;
    color: rgba(140, 80, 200, 0.2);
}
.ch2-micro--mirror {
    left: 50%;
    top: 45%;
    transform: translateX(-50%) rotate(-90deg);
    color: rgba(80, 60, 120, 0.15);
    letter-spacing: 0.5em;
}

@media (max-width: 768px) {
    .ch2-a--projection { bottom: 18vh; right: 3vw; max-width: 20ch; }
    .ch2-a--ego, .ch2-a--shadow { max-width: 18ch; }
    .ch2-micro { display: none; }
}
</style>

<!-- Phase 1: Chapter heading -->
<div class="ch2-a ch2-a--heading" data-phase="1">
    <div class="ch2-eyebrow">Chapter II</div>
    <div class="ch2-title">The Shadow</div>
</div>

<!-- Phase 2: Ego identification with leader line -->
<div class="ch2-a ch2-a--ego" data-phase="2">
    <span class="ch2-leader"></span>
    <div class="ch2-text">
        The radiant figure is <em>the Ego</em> —
        the self you know, the face
        you show the world.
        <span class="ch2-note">Move your mouse — it follows you</span>
    </div>
</div>

<!-- Phase 3: Shadow identification with leader line -->
<div class="ch2-a ch2-a--shadow" data-phase="3">
    <span class="ch2-leader"></span>
    <div class="ch2-text">
        Its dark mirror is <em>the Shadow</em> —
        everything about yourself
        you refuse to see.
        <span class="ch2-note">It mirrors you, but distorted and delayed</span>
    </div>
</div>

<!-- Phase 4: Projection -->
<div class="ch2-a ch2-a--projection" data-phase="4">
    <span class="ch2-leader"></span>
    <div class="ch2-text">
        The arcs flying outward are
        <em>Projections</em> — you see your
        shadow in others, blaming them
        for what you won't face
        in yourself.
    </div>
</div>

<!-- Phase 5: Jung quote -->
<div class="ch2-a ch2-a--quote" data-phase="5">
    <span class="ch2-quotemark">"</span>
    <div class="ch2-text">
        One does not become enlightened
        by imagining figures of light,
        but by making the
        darkness conscious.
        <span class="ch2-attr">— C. G. Jung, Aion §14</span>
    </div>
</div>

<!-- Phase 6: Integration (synced to convergence cycle) -->
<div class="ch2-a ch2-a--integration">
    <div class="ch2-integ-text">
        Integration — the moment<br>
        of recognizing <em>"that is also me"</em>
        <span class="ch2-integ-sub">Wholeness requires embracing the dark</span>
    </div>
</div>

<!-- Persistent micro-labels (appear with phase 2/3) -->
<div class="ch2-micro ch2-micro--ego" data-phase="2">ego</div>
<div class="ch2-micro ch2-micro--shadow" data-phase="3">shadow</div>
<div class="ch2-micro ch2-micro--mirror" data-phase="3">mirror</div>
`;

        (this.container || document.body).appendChild(ov);

        /* ── Phased reveal schedule ── */
        this._annTimers = [];
        const phases = [
            { sel: '[data-phase="1"]', delay: 2000 },
            { sel: '[data-phase="2"]', delay: 5000 },
            { sel: '[data-phase="3"]', delay: 10000 },
            { sel: '[data-phase="4"]', delay: 16000 },
            { sel: '[data-phase="5"]', delay: 22000 },
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
        this.mouseSmooth.lerp(this.mouse, 0.03);
        this.introT += dt;

        /* ── Ego follows mouse ── */
        const egoTX = -3.5 + this.mouseSmooth.x * 1.5;
        const egoTY = this.mouseSmooth.y * 1.2;
        this.egoGroup.position.x += (egoTX - this.egoGroup.position.x) * 0.06;
        this.egoGroup.position.y += (egoTY - this.egoGroup.position.y) * 0.06;

        // Ego pulse — breathing light
        this.egoCore.material.emissiveIntensity = 0.4 + Math.sin(t * 1.2) * 0.15;
        this.egoGlow.material.opacity = 0.1 + Math.sin(t * 0.6) * 0.04;

        // Ego rays pulse
        for (const ray of this.egoRays) {
            ray.line.material.opacity = 0.1 + Math.sin(t * 0.8 + ray.ph) * 0.08;
        }

        // Persona shell drifts
        this.personaShell.rotation.z += 0.003;
        this.personaShell.material.opacity = 0.06 + Math.sin(t * 0.4) * 0.04;

        /* ── Shadow mirrors ego with lag + distortion ── */
        const sx = 3.5 - this.mouseSmooth.x * 1.5;   // mirrored
        const sy = -this.mouseSmooth.y * 1.2 + Math.sin(t * 0.4) * 0.5; // inverted + wobble
        this.shadowGroup.position.x += (sx - this.shadowGroup.position.x) * 0.012; // VERY slow follow
        this.shadowGroup.position.y += (sy - this.shadowGroup.position.y) * 0.012;

        // Shadow scale distortion — squashes/stretches autonomously
        const distort = 1 + Math.sin(t * 0.6) * 0.3;
        this.shadowCore.scale.set(distort, 1 / distort, distort);
        this.shadowAura.material.opacity = 0.06 + Math.sin(t * 0.35) * 0.04;

        // Tendrils pulse
        for (const td of this.tendrils) {
            td.line.material.opacity = 0.08 + Math.sin(t * 0.5 + td.ph) * 0.08;
        }

        /* ── Mirror shimmer ── */
        this.mirrorPlane.material.opacity = 0.15 + Math.sin(t * 0.25) * 0.08;
        for (const md of this.mirrorDots) {
            md.dot.material.opacity = 0.08 + Math.sin(t * 0.6 + md.ph) * 0.1;
        }

        /* ── Projection arcs — periodic visibility ── */
        const projCycle = t % 20;
        const projActive = projCycle > 5 && projCycle < 16;
        const projFade = projActive
            ? Math.sin(((projCycle - 5) / 11) * Math.PI)
            : 0;
        for (const arc of this.projArcs) {
            const pulse = Math.sin(t * arc.speed + arc.ph) * 0.5 + 0.5;
            arc.line.material.opacity = projFade * 0.25;
            arc.dot.material.opacity = projFade * 0.5 * pulse;
            arc.targetGlow.material.opacity = projFade * 0.1 * pulse;
        }

        /* ── Cocoon wraps ego during projection ── */
        const cocoonCycle = t % 24;
        const cocoonActive = cocoonCycle > 7 && cocoonCycle < 18;
        const cocoonFade = cocoonActive
            ? Math.sin(((cocoonCycle - 7) / 11) * Math.PI) * 0.14
            : 0;
        for (const strand of this.cocoonStrands) {
            strand.line.material.opacity = cocoonFade;
            strand.line.position.set(
                this.egoGroup.position.x,
                this.egoGroup.position.y,
                this.egoGroup.position.z
            );
        }

        /* ── Integration moment — every 35s for ~8s ── */
        const intCycle = t % 35;
        const integrating = intCycle > 26;
        const intT = integrating ? (intCycle - 26) / 9 : 0;
        const intPulse = integrating ? Math.sin(intT * Math.PI) : 0;

        if (integrating) {
            const convergence = intPulse * 0.7;
            this.egoGroup.position.x += (0 - this.egoGroup.position.x) * convergence * 0.02;
            this.egoGroup.position.y += (0 - this.egoGroup.position.y) * convergence * 0.02;
            this.shadowGroup.position.x += (0 - this.shadowGroup.position.x) * convergence * 0.02;
            this.shadowGroup.position.y += (0 - this.shadowGroup.position.y) * convergence * 0.02;
        }

        this.integrationLight.intensity = intPulse * 2.5;
        this.integrationLight.position.set(
            (this.egoGroup.position.x + this.shadowGroup.position.x) / 2,
            (this.egoGroup.position.y + this.shadowGroup.position.y) / 2,
            3
        );

        // Integration annotation sync
        const intAnn = this._annotationOverlay?.querySelector('.ch2-a--integration');
        if (intAnn) {
            if (integrating && intT > 0.1 && intT < 0.9) {
                intAnn.classList.add('vis');
                intAnn.classList.remove('hid');
            } else {
                intAnn.classList.remove('vis');
                intAnn.classList.add('hid');
            }
        }

        /* ── Atmosphere ── */
        this.smoke.rotation.y += 0.0002;
        this.smoke.rotation.x += 0.00005;

        /* ── Camera ── */
        const introF = Math.min(this.introT / 6, 1);
        const ease = 1 - Math.pow(1 - introF, 3);
        const camD = THREE.MathUtils.lerp(22, 14, ease);
        const camH = THREE.MathUtils.lerp(8, 1.5 + this.mouseSmooth.y * 1.2, ease);
        const camA = t * 0.006 + this.mouseSmooth.x * 0.12;
        this.camera.position.set(
            Math.sin(camA) * camD,
            camH,
            Math.cos(camA) * camD
        );
        this.camera.lookAt(0, -0.3, 0);

        /* ── Ego light follows ego ── */
        this.egoLight.position.set(
            this.egoGroup.position.x,
            this.egoGroup.position.y + 2,
            4
        );

        /* ── Bloom ── */
        if (this.bloom) {
            this.bloom.strength = 1.2 + Math.sin(t * 0.05) * 0.2 + intPulse * 0.8;
        }
    }

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
        this._annTimers?.forEach(t => clearTimeout(t));
        this._annotationOverlay?.remove();
        this.renderer?.dispose();
        this.renderer?.forceContextLoss();
        this.scene?.traverse(o => {
            o.geometry?.dispose();
            if (o.material) {
                (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
            }
        });
        this.composer = null; this.scene = null;
        this.camera = null; this.renderer = null;
        super.dispose();
    }
}
