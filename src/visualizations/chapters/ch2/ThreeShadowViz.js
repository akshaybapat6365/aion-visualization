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
 * Visual metaphor & pedagogical narrative:
 *
 *   The Ego (luminous figure, left) faces its Shadow (dark
 *   distorted mirror, right). Between them: a thin mirror
 *   boundary. The shadow mirrors every movement but distorts
 *   it — it is autonomous, alive, and slightly grotesque.
 *
 *   Projection arcs fly outward from the shadow like tendrils
 *   of illusion cast onto the world. A "cocoon" of projection
 *   strands periodically envelops the ego, showing how
 *   unrecognized shadow material traps you in illusion.
 *
 *   Integration moment: every ~30s the ego and shadow briefly
 *   drift toward each other, merging into a pulse of light —
 *   Jung's insight that wholeness requires embracing the dark.
 *
 * Phased annotations (Instrument Serif):
 *   Phase 1 (2s):  Chapter heading
 *   Phase 2 (5s):  "The bright figure is the Ego — what you
 *                   show the world"
 *   Phase 3 (9s):  "Its dark mirror is the Shadow — everything
 *                   you refuse to see in yourself"
 *   Phase 4 (14s): "Projection — the shadow's qualities cast
 *                   outward onto others"
 *   Phase 5 (20s): Jung quote §14
 *   Phase 6 (cyc): Integration moment annotation
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/* ── Palette ── */
const VOID = 0x030308;
const EGO_CLR = new THREE.Color('#c8c8e0');
const EGO_GLOW = new THREE.Color('#8888b8');
const SHADOW_CLR = new THREE.Color('#1a0828');
const SHADOW_GLOW = new THREE.Color('#3a1060');
const PROJ_CLR = new THREE.Color('#7b1fa2');
const PROJ_CLR2 = new THREE.Color('#4a148c');
const MIRROR_CLR = new THREE.Color('#2a1040');
const SMOKE_CLR = new THREE.Color('#0a0418');
const INTEGRATION = new THREE.Color('#d0a0ff');

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
        R.toneMappingExposure = 1.0;

        const S = this.scene = new THREE.Scene();
        S.fog = new THREE.FogExp2(VOID, 0.012);

        const cam = this.camera = new THREE.PerspectiveCamera(
            50, this.width / this.height, 0.1, 200
        );
        cam.position.set(0, 2, 14);

        /* ── Mouse ── */
        this.mouse = new THREE.Vector2();
        this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => {
            this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        };
        addEventListener('mousemove', this._onMM);

        /* ── Build scene ── */
        this._buildEgoFigure();
        this._buildShadowFigure();
        this._buildMirrorBoundary();
        this._buildProjectionArcs();
        this._buildCocoon();
        this._buildSmoke();
        this._buildGround();
        this._buildAnnotations();

        /* ── Lighting ── */
        S.add(new THREE.AmbientLight(0x08081a, 0.15));
        this.egoLight = new THREE.PointLight(0xa0a0d0, 1.2, 14);
        this.egoLight.position.set(-3, 2, 4);
        S.add(this.egoLight);
        this.shadowLight = new THREE.PointLight(0x2a0040, 0.5, 10);
        this.shadowLight.position.set(3, -1, 3);
        S.add(this.shadowLight);
        this.integrationLight = new THREE.PointLight(0xd0a0ff, 0, 12);
        this.integrationLight.position.set(0, 0, 2);
        S.add(this.integrationLight);

        /* ── Post-processing ── */
        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(S, cam));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.2, 0.5, 0.3
        );
        this.composer.addPass(this.bloom);

        this.introT = 0;
    }

    /* ══════════════════════════════════════════════════════
     *  EGO — the luminous persona, "what you show the world"
     * ══════════════════════════════════════════════════════ */
    _buildEgoFigure() {
        const g = this.egoGroup = new THREE.Group();
        g.position.set(-3, 0, 0);

        // Core ego sphere
        this.egoCore = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 24, 24),
            new THREE.MeshStandardMaterial({
                color: EGO_CLR, emissive: EGO_CLR,
                emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.1
            })
        );
        g.add(this.egoCore);

        // Ego glow
        this.egoGlow = new THREE.Mesh(
            new THREE.SphereGeometry(1.0, 16, 16),
            new THREE.MeshBasicMaterial({
                color: EGO_GLOW, transparent: true, opacity: 0.08,
                blending: THREE.AdditiveBlending
            })
        );
        g.add(this.egoGlow);

        // Ego "persona" rings — the mask of identity
        this.personaRings = [];
        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.7 + i * 0.4, 0.008, 4, 80),
                new THREE.MeshBasicMaterial({
                    color: EGO_GLOW, transparent: true, opacity: 0.06,
                    blending: THREE.AdditiveBlending
                })
            );
            ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
            ring.rotation.z = Math.random() * Math.PI;
            g.add(ring);
            this.personaRings.push(ring);
        }

        this.scene.add(g);
    }

    /* ══════════════════════════════════════════════════════
     *  SHADOW — the dark double, autonomous and distorted
     * ══════════════════════════════════════════════════════ */
    _buildShadowFigure() {
        const g = this.shadowGroup = new THREE.Group();
        g.position.set(3, 0, 0);

        // Shadow core — darker, denser
        this.shadowCore = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 24, 24),
            new THREE.MeshStandardMaterial({
                color: SHADOW_CLR, emissive: SHADOW_GLOW,
                emissiveIntensity: 0.2, roughness: 0.9, metalness: 0.4
            })
        );
        g.add(this.shadowCore);

        // Shadow aura — ominous purple haze
        this.shadowAura = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 12, 12),
            new THREE.MeshBasicMaterial({
                color: SHADOW_GLOW, transparent: true, opacity: 0.06,
                blending: THREE.AdditiveBlending
            })
        );
        g.add(this.shadowAura);

        // Shadow tendrils — spiky distortion lines
        this.tendrils = [];
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const len = 1.2 + Math.random() * 1.5;
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(
                    Math.cos(angle) * len * 0.4,
                    Math.sin(angle * 0.7) * len * 0.3,
                    Math.sin(angle) * len * 0.4
                ),
                new THREE.Vector3(
                    Math.cos(angle) * len,
                    Math.sin(angle * 0.5) * len * 0.5 - 0.5,
                    Math.sin(angle) * len
                )
            ];
            const curve = new THREE.QuadraticBezierCurve3(...pts);
            const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: SHADOW_GLOW, transparent: true, opacity: 0.12,
                blending: THREE.AdditiveBlending
            }));
            g.add(line);
            this.tendrils.push({ line, ph: Math.random() * Math.PI * 2 });
        }

        this.scene.add(g);
    }

    /* ══════════════════════════════════════════════════════
     *  MIRROR BOUNDARY — the threshold between known & unknown
     * ══════════════════════════════════════════════════════ */
    _buildMirrorBoundary() {
        // Vertical shimmering plane
        const mirrorGeo = new THREE.PlaneGeometry(0.015, 12);
        this.mirrorPlane = new THREE.Mesh(mirrorGeo, new THREE.MeshBasicMaterial({
            color: MIRROR_CLR, transparent: true, opacity: 0.2
        }));
        this.mirrorPlane.position.set(0, 0, 0);
        this.scene.add(this.mirrorPlane);

        // Mirror shimmer lines
        this.mirrorLines = [];
        for (let i = 0; i < 8; i++) {
            const y = -4 + i * 1.1;
            const pts = [
                new THREE.Vector3(0, y, -0.5),
                new THREE.Vector3(0, y, 0.5)
            ];
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({
                    color: MIRROR_CLR, transparent: true, opacity: 0.06,
                    blending: THREE.AdditiveBlending
                })
            );
            this.scene.add(line);
            this.mirrorLines.push({ line, ph: Math.random() * Math.PI * 2 });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  PROJECTION ARCS — illusions cast outward onto the world
     * ══════════════════════════════════════════════════════ */
    _buildProjectionArcs() {
        this.projArcs = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.random() - 0.5) * 1.5;
            const outward = 4 + Math.random() * 6;
            const height = (Math.random() - 0.5) * 3;
            const pts = [
                new THREE.Vector3(3, 0, 0), // starts at shadow
                new THREE.Vector3(3 + outward * 0.4, height * 0.5 + 1.5, angle * 2),
                new THREE.Vector3(3 + outward, height, angle * 4)
            ];
            const curve = new THREE.QuadraticBezierCurve3(...pts);
            const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: PROJ_CLR, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending
            }));
            this.scene.add(line);

            // Small "target" dot at the end (where projection lands)
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 8, 8),
                new THREE.MeshBasicMaterial({
                    color: PROJ_CLR, transparent: true, opacity: 0,
                    blending: THREE.AdditiveBlending
                })
            );
            dot.position.copy(pts[2]);
            this.scene.add(dot);

            this.projArcs.push({ line, dot, ph: Math.random() * Math.PI * 2, speed: 0.3 + Math.random() * 0.3 });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  COCOON — the "isolating cocoon of illusions" (§15)
     * ══════════════════════════════════════════════════════ */
    _buildCocoon() {
        this.cocoonStrands = [];
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            const r = 1.5 + Math.random() * 0.8;
            const pts = [];
            const segs = 15;
            for (let j = 0; j < segs; j++) {
                const frac = j / (segs - 1);
                const a = angle + frac * 2;
                const y = -2 + frac * 4;
                pts.push(new THREE.Vector3(
                    Math.cos(a) * r * (0.5 + frac * 0.5),
                    y,
                    Math.sin(a) * r * (0.5 + frac * 0.5)
                ));
            }
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: PROJ_CLR2, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending
            }));
            line.position.set(-3, 0, 0); // wraps around ego
            this.scene.add(line);
            this.cocoonStrands.push({ line, ph: Math.random() * Math.PI * 2 });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  SMOKE — ambient atmosphere
     * ══════════════════════════════════════════════════════ */
    _buildSmoke() {
        const N = 800;
        const pos = new Float32Array(N * 3);
        const colors = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
            const t = Math.random();
            colors[i * 3] = 0.04 + t * 0.06;
            colors[i * 3 + 1] = 0.02 + t * 0.04;
            colors[i * 3 + 2] = 0.08 + t * 0.1;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.smoke = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.06, transparent: true, opacity: 0.35,
            vertexColors: true, depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.smoke);
    }

    /* ══════════════════════════════════════════════════════
     *  GROUND — subtle reflective plane
     * ══════════════════════════════════════════════════════ */
    _buildGround() {
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 60),
            new THREE.MeshStandardMaterial({
                color: 0x050510, roughness: 0.95, metalness: 0.1,
                transparent: true, opacity: 0.4
            })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -3;
        this.scene.add(ground);
    }

    /* ══════════════════════════════════════════════════════════════
     *  ANNOTATIONS — phased narrative for Jung's Shadow concept
     * ══════════════════════════════════════════════════════════════ */
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
    transition: opacity 3s cubic-bezier(0.16, 1, 0.3, 1),
                transform 3s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateY(8px);
    will-change: opacity, transform;
}
.ch2-a.vis {
    opacity: 1;
    transform: translateY(0);
}

/* ─── Phase 1: Chapter heading ─── */
.ch2-a--heading {
    top: 7vh;
    left: 4.5vw;
}
.ch2-a--heading .ch2-eyebrow {
    font-family: 'Inter', sans-serif;
    font-size: clamp(0.55rem, 0.9vw, 0.7rem);
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: rgba(120, 80, 160, 0.2);
    margin-bottom: 0.4em;
}
.ch2-a--heading .ch2-title {
    font-size: clamp(1.8rem, 3.8vw, 3rem);
    font-style: italic;
    color: rgba(150, 100, 200, 0.3);
    letter-spacing: -0.02em;
    line-height: 1.05;
}

/* ─── Phase 2: Ego pointer ─── */
.ch2-a--ego {
    top: 30vh;
    left: 5vw;
    max-width: 22ch;
}
.ch2-a--ego .ch2-pointer {
    display: block;
    width: 40px;
    height: 1px;
    background: linear-gradient(to right, rgba(176,176,208,0.3), rgba(176,176,208,0));
    margin-bottom: 8px;
}
.ch2-a--ego .ch2-concept {
    font-size: clamp(0.75rem, 1.15vw, 0.95rem);
    font-style: italic;
    color: rgba(200, 200, 220, 0.3);
    line-height: 1.65;
}
.ch2-a--ego .ch2-concept em {
    font-style: normal;
    color: rgba(200, 200, 230, 0.45);
}

/* ─── Phase 3: Shadow pointer ─── */
.ch2-a--shadow {
    top: 30vh;
    right: 5vw;
    max-width: 22ch;
    text-align: right;
}
.ch2-a--shadow .ch2-pointer {
    display: block;
    width: 40px;
    height: 1px;
    background: linear-gradient(to left, rgba(120,80,160,0.3), rgba(120,80,160,0));
    margin-left: auto;
    margin-bottom: 8px;
}
.ch2-a--shadow .ch2-concept {
    font-size: clamp(0.75rem, 1.15vw, 0.95rem);
    font-style: italic;
    color: rgba(140, 80, 200, 0.3);
    line-height: 1.65;
}
.ch2-a--shadow .ch2-concept em {
    font-style: normal;
    color: rgba(160, 100, 220, 0.45);
}

/* ─── Phase 4: Projection label ─── */
.ch2-a--projection {
    bottom: 35vh;
    right: 12vw;
    max-width: 24ch;
    text-align: right;
}
.ch2-a--projection .ch2-concept {
    font-size: clamp(0.65rem, 0.95vw, 0.82rem);
    font-style: italic;
    color: rgba(123, 31, 162, 0.28);
    line-height: 1.6;
}
.ch2-a--projection .ch2-concept em {
    font-style: normal;
    color: rgba(160, 60, 200, 0.4);
}

/* ─── Phase 5: Jung quote ─── */
.ch2-a--quote {
    bottom: 8vh;
    left: 5vw;
    max-width: 28ch;
}
.ch2-a--quote .ch2-concept {
    font-size: clamp(0.78rem, 1.15vw, 0.95rem);
    font-style: italic;
    color: rgba(150, 120, 200, 0.22);
    line-height: 1.7;
}
.ch2-a--quote .ch2-attr {
    display: block;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-size: 0.5em;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(150, 120, 200, 0.1);
    margin-top: 0.7em;
}

/* ─── Phase 6: Integration moment ─── */
.ch2-a--integration {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) translateY(8px);
    text-align: center;
    max-width: 26ch;
}
.ch2-a--integration.vis {
    transform: translate(-50%, -50%) translateY(0);
}
.ch2-a--integration .ch2-integ-text {
    font-size: clamp(0.85rem, 1.3vw, 1.1rem);
    font-style: italic;
    color: rgba(208, 160, 255, 0);
    letter-spacing: 0.04em;
    transition: color 2s ease;
    line-height: 1.6;
}
.ch2-a--integration.vis .ch2-integ-text {
    color: rgba(208, 160, 255, 0.3);
}
.ch2-a--integration.hid .ch2-integ-text {
    color: rgba(208, 160, 255, 0) !important;
}

@media (max-width: 768px) {
    .ch2-a--projection { display: none; }
    .ch2-a--ego, .ch2-a--shadow { max-width: 17ch; }
}
</style>

<!-- Phase 1: Chapter heading -->
<div class="ch2-a ch2-a--heading" data-phase="1">
    <div class="ch2-eyebrow">Chapter II</div>
    <div class="ch2-title">The Shadow</div>
</div>

<!-- Phase 2: Ego identification -->
<div class="ch2-a ch2-a--ego" data-phase="2">
    <span class="ch2-pointer"></span>
    <div class="ch2-concept">
        The bright figure is <em>the Ego</em> —
        the self you know, the face
        you show the world.
    </div>
</div>

<!-- Phase 3: Shadow identification -->
<div class="ch2-a ch2-a--shadow" data-phase="3">
    <span class="ch2-pointer"></span>
    <div class="ch2-concept">
        Its dark mirror is <em>the Shadow</em> —
        everything you refuse to
        see in yourself.
    </div>
</div>

<!-- Phase 4: Projection label -->
<div class="ch2-a ch2-a--projection" data-phase="4">
    <div class="ch2-concept">
        <em>Projection</em> — the Shadow's
        qualities are cast outward,
        seen in others rather than
        in oneself.
    </div>
</div>

<!-- Phase 5: Jung quote -->
<div class="ch2-a ch2-a--quote" data-phase="5">
    <div class="ch2-concept">
        One does not become enlightened
        by imagining figures of light,
        but by making the
        darkness conscious.
        <span class="ch2-attr">— C. G. Jung</span>
    </div>
</div>

<!-- Phase 6: Integration (synced to cycle) -->
<div class="ch2-a ch2-a--integration">
    <div class="ch2-integ-text">
        Integration — recognizing<br>
        "that is also me"
    </div>
</div>
`;

        (this.container || document.body).appendChild(ov);

        /* ── Phased reveal schedule ── */
        this._annTimers = [];
        const phases = [
            { sel: '[data-phase="1"]', delay: 2000 },
            { sel: '[data-phase="2"]', delay: 5000 },
            { sel: '[data-phase="3"]', delay: 9000 },
            { sel: '[data-phase="4"]', delay: 14000 },
            { sel: '[data-phase="5"]', delay: 20000 },
        ];
        for (const p of phases) {
            const el = ov.querySelector(p.sel);
            if (el) {
                const t = setTimeout(() => el.classList.add('vis'), p.delay);
                this._annTimers.push(t);
            }
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

        /* ── Ego follows mouse gently ── */
        const egoTX = -3 + this.mouseSmooth.x * 1.2;
        const egoTY = this.mouseSmooth.y * 1.0;
        this.egoGroup.position.x += (egoTX - this.egoGroup.position.x) * 0.06;
        this.egoGroup.position.y += (egoTY - this.egoGroup.position.y) * 0.06;

        // Ego pulse
        const ep = 0.9 + Math.sin(t * 1.5) * 0.1;
        this.egoCore.material.emissiveIntensity = 0.3 + Math.sin(t * 0.8) * 0.1;
        this.egoGlow.material.opacity = 0.06 + Math.sin(t * 0.5) * 0.03;

        // Persona rings drift
        for (let i = 0; i < this.personaRings.length; i++) {
            this.personaRings[i].rotation.z += 0.002 * (i % 2 === 0 ? 1 : -1);
            this.personaRings[i].material.opacity = 0.04 + Math.sin(t * 0.3 + i) * 0.025;
        }

        /* ── Shadow mirrors ego with delay + distortion ── */
        const sx = 3 - this.mouseSmooth.x * 1.2;   // mirrored X
        const sy = -this.mouseSmooth.y * 1.0 + Math.sin(t * 0.5) * 0.4;  // inverted Y + wobble
        this.shadowGroup.position.x += (sx - this.shadowGroup.position.x) * 0.015; // slower follow = lag
        this.shadowGroup.position.y += (sy - this.shadowGroup.position.y) * 0.015;

        // Shadow scale distortion — squishes and stretches
        const distort = 1 + Math.sin(t * 0.7) * 0.25;
        this.shadowCore.scale.set(distort, 1 / distort, distort);
        this.shadowAura.material.opacity = 0.04 + Math.sin(t * 0.4) * 0.03;

        // Shadow tendrils pulse
        for (const td of this.tendrils) {
            td.line.material.opacity = 0.06 + Math.sin(t * 0.6 + td.ph) * 0.06;
        }

        /* ── Mirror shimmer ── */
        for (const ml of this.mirrorLines) {
            ml.line.material.opacity = 0.03 + Math.sin(t * 0.8 + ml.ph) * 0.04;
        }
        this.mirrorPlane.material.opacity = 0.12 + Math.sin(t * 0.3) * 0.06;

        /* ── Projection arcs — periodic visibility ── */
        const projCycle = t % 18;
        const projVisible = projCycle > 6 && projCycle < 15;
        const projFade = projVisible
            ? Math.sin(((projCycle - 6) / 9) * Math.PI) * 0.18
            : 0;
        for (const arc of this.projArcs) {
            arc.line.material.opacity = projFade;
            arc.dot.material.opacity = projFade * 1.5;
        }

        /* ── Cocoon — periodic wrapping of ego ── */
        const cocoonCycle = t % 22;
        const cocoonActive = cocoonCycle > 8 && cocoonCycle < 16;
        const cocoonFade = cocoonActive
            ? Math.sin(((cocoonCycle - 8) / 8) * Math.PI) * 0.1
            : 0;
        for (const strand of this.cocoonStrands) {
            strand.line.material.opacity = cocoonFade;
            strand.line.position.set(
                this.egoGroup.position.x,
                this.egoGroup.position.y,
                this.egoGroup.position.z
            );
        }

        /* ── Integration moment — every 32s for 6s ── */
        const intCycle = t % 32;
        const integrating = intCycle > 24;
        const intT = integrating ? (intCycle - 24) / 8 : 0;
        const intPulse = integrating ? Math.sin(intT * Math.PI) : 0;

        // During integration, ego and shadow drift toward center
        if (integrating) {
            const convergence = intPulse * 0.6;
            this.egoGroup.position.x += (0 - this.egoGroup.position.x) * convergence * 0.03;
            this.shadowGroup.position.x += (0 - this.shadowGroup.position.x) * convergence * 0.03;
        }

        this.integrationLight.intensity = intPulse * 2;
        this.integrationLight.position.set(
            (this.egoGroup.position.x + this.shadowGroup.position.x) / 2,
            (this.egoGroup.position.y + this.shadowGroup.position.y) / 2,
            2
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

        /* ── Smoke drift ── */
        this.smoke.rotation.y += 0.0003;
        this.smoke.rotation.x += 0.00008;

        /* ── Camera ── */
        const introF = Math.min(this.introT / 8, 1);
        const ease = 1 - Math.pow(1 - introF, 3);
        const tH = 1 + this.mouseSmooth.y * 1.5;
        const camH = THREE.MathUtils.lerp(10, tH, ease);
        const camD = THREE.MathUtils.lerp(20, 14, ease);
        const camA = t * 0.008 + this.mouseSmooth.x * 0.15;
        this.camera.position.set(
            Math.sin(camA) * camD,
            camH,
            Math.cos(camA) * camD
        );
        this.camera.lookAt(0, -0.5, 0);

        /* ── Bloom ── */
        if (this.bloom) {
            this.bloom.strength = 1.0 + Math.sin(t * 0.06) * 0.2
                + intPulse * 0.6;
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
