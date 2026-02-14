/**
 * ThreeEgoViz.js — Chapter 1: "The Ego"
 *
 * Jung, Aion §1–§6:
 *   "The ego rests on the total field of consciousness
 *    and on the sum total of unconscious contents."
 *   "It has a somatic and a psychic basis."
 *   "The ego is not the whole of the personality."
 *
 * Visual metaphor & pedagogical narrative:
 *   A newcomer sees this visualization and, through phased
 *   annotations, learns what each element means:
 *
 *   Phase 1 (0–4s):  Chapter title
 *   Phase 2 (4–8s):  "This point of light is the Ego—your conscious 'I'"
 *   Phase 3 (8–13s): "The darkness below is the Unconscious"
 *   Phase 4 (13–17s): Root labels: body (somatic) and mind (psychic)
 *   Phase 5 (17–22s): "The ego is smaller than we think"
 *   Phase 6 (Self reveal cycle): "Deep below—the Self, the totality"
 *
 * Enhanced: richer ocean, filament roots, dramatic Self reveal,
 * guided Instrument Serif annotations that teach the concepts.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/* ── Palette ── */
const EGO_WHITE = new THREE.Color('#e8e8f0');
const EGO_GLOW = new THREE.Color('#b0b0d0');
const SOMATIC = new THREE.Color('#6a1a1a');
const PSYCHIC = new THREE.Color('#1a2a6a');
const SELF_GOLD = new THREE.Color('#ffd700');
const WAVE_CYAN = new THREE.Color('#0a1a3a');
const VOID = 0x030308;

/* ── Constants ── */
const OCEAN_N = 3500;
const SOMATIC_FILA = 12;
const PSYCHIC_FILA = 10;
const RAY_COUNT = 16;

export default class ThreeEgoViz extends BaseViz {
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
            50, this.width / this.height, 0.1, 300
        );
        cam.position.set(0, 20, 30);

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
        this._buildOcean();
        this._buildFilaments();
        this._buildWaves();
        this._buildSelf();
        this._buildRays();
        this._buildAnnotations();

        /* ── Lighting ── */
        S.add(new THREE.AmbientLight(0x0a0a12, 0.2));
        this.egoLight = new THREE.PointLight(0xb0b0d0, 1.2, 18);
        this.egoLight.position.set(0, 1, 2);
        S.add(this.egoLight);
        this.deepLight = new THREE.PointLight(0x331a00, 0, 20);
        this.deepLight.position.set(0, -8, 0);
        S.add(this.deepLight);

        /* ── Post-processing ── */
        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(S, cam));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.6, 0.5, 0.2
        );
        this.composer.addPass(this.bloom);

        this.introT = 0;
    }

    /* ══════════════════════════════════════════════════════
     *  EGO — the luminous center of conscious awareness
     * ══════════════════════════════════════════════════════ */
    _buildEgo() {
        const g = this.egoGroup = new THREE.Group();
        this.egoDot = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 24, 24),
            new THREE.MeshBasicMaterial({ color: EGO_WHITE, transparent: true, opacity: 1 })
        );
        g.add(this.egoDot);
        this.egoGlow = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 20, 20),
            new THREE.MeshBasicMaterial({ color: EGO_GLOW, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending })
        );
        g.add(this.egoGlow);
        this.egoCorona = new THREE.Mesh(
            new THREE.SphereGeometry(1.8, 16, 16),
            new THREE.MeshBasicMaterial({ color: EGO_GLOW, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending })
        );
        g.add(this.egoCorona);
        this.egoField = new THREE.Mesh(
            new THREE.SphereGeometry(3.5, 12, 12),
            new THREE.MeshBasicMaterial({ color: new THREE.Color('#4a4a6a'), transparent: true, opacity: 0.015, blending: THREE.AdditiveBlending })
        );
        g.add(this.egoField);
        this.scene.add(g);
    }

    /* ══════════════════════════════════════════════════════
     *  OCEAN — the vast unconscious
     * ══════════════════════════════════════════════════════ */
    _buildOcean() {
        const pos = new Float32Array(OCEAN_N * 3);
        const colors = new Float32Array(OCEAN_N * 3);
        this.oceanPh = new Float32Array(OCEAN_N);
        for (let i = 0; i < OCEAN_N; i++) {
            const r = 1 + Math.random() * 40;
            const th = Math.random() * Math.PI * 2;
            pos[i * 3] = Math.cos(th) * r;
            pos[i * 3 + 1] = -(0.8 + Math.random() * 20);
            pos[i * 3 + 2] = Math.sin(th) * r;
            this.oceanPh[i] = Math.random() * Math.PI * 2;
            const t = Math.random();
            colors[i * 3] = 0.04 + t * 0.06;
            colors[i * 3 + 1] = 0.06 + t * 0.12;
            colors[i * 3 + 2] = 0.12 + t * 0.15;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.oceanPts = new THREE.Points(geo, new THREE.PointsMaterial({
            size: 0.08, transparent: true, opacity: 0.5,
            vertexColors: true, depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.oceanPts);

        const surfGeo = new THREE.PlaneGeometry(100, 100, 80, 80);
        this.surfVerts = surfGeo.attributes.position.array;
        this.surfGeo = surfGeo;
        this.surface = new THREE.Mesh(surfGeo, new THREE.MeshBasicMaterial({
            color: WAVE_CYAN, transparent: true, opacity: 0.025,
            side: THREE.DoubleSide, wireframe: true
        }));
        this.surface.rotation.x = -Math.PI / 2;
        this.surface.position.y = -0.6;
        this.scene.add(this.surface);
    }

    /* ══════════════════════════════════════════════════════
     *  FILAMENTS — somatic + psychic double root
     * ══════════════════════════════════════════════════════ */
    _buildFilaments() {
        this.filaments = [];
        const _make = (count, color, type, xBase, xSpread, angleBase) => {
            for (let i = 0; i < count; i++) {
                const pts = [];
                const segs = 12 + Math.floor(Math.random() * 8);
                const bAngle = angleBase + (Math.random() - 0.5) * 0.6;
                let x = xBase + (Math.random() - 0.5) * xSpread;
                let y = 0, z = Math.random() * 0.5 - 0.25;
                for (let j = 0; j < segs; j++) {
                    pts.push(new THREE.Vector3(x, y, z));
                    x += Math.sin(bAngle + j * 0.15) * 0.3;
                    y -= (0.5 + Math.random() * 0.4);
                    z += (Math.random() - 0.5) * 0.2;
                }
                const geo = new THREE.BufferGeometry().setFromPoints(pts);
                const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                    color, transparent: true, opacity: 0.15,
                    blending: THREE.AdditiveBlending
                }));
                this.scene.add(line);
                this.filaments.push({ line, type, ph: Math.random() * Math.PI * 2 });
            }
        };
        _make(SOMATIC_FILA, SOMATIC, 'somatic', -1.5, 3, -0.4);
        _make(PSYCHIC_FILA, PSYCHIC, 'psychic', 1.5, 3, 0.4);
    }

    /* ══════════════════════════════════════════════════════
     *  WAVES — expanding field of consciousness
     * ══════════════════════════════════════════════════════ */
    _buildWaves() {
        this.rings = [];
        for (let i = 0; i < 5; i++) {
            const r = new THREE.Mesh(
                new THREE.TorusGeometry(0.5, 0.01, 4, 120),
                new THREE.MeshBasicMaterial({
                    color: EGO_GLOW, transparent: true, opacity: 0.08,
                    blending: THREE.AdditiveBlending
                })
            );
            r.rotation.x = -Math.PI / 2;
            r.position.y = -0.2;
            this.scene.add(r);
            this.rings.push({ mesh: r, ph: i * 2.2 });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  SELF — the golden totality in the deep
     * ══════════════════════════════════════════════════════ */
    _buildSelf() {
        this.deepSelf = new THREE.Mesh(
            new THREE.SphereGeometry(2, 24, 24),
            new THREE.MeshBasicMaterial({ color: SELF_GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
        );
        this.deepSelf.position.set(0, -10, 0);
        this.scene.add(this.deepSelf);

        this.selfHalo = new THREE.Mesh(
            new THREE.SphereGeometry(4.5, 16, 16),
            new THREE.MeshBasicMaterial({ color: SELF_GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
        );
        this.selfHalo.position.set(0, -10, 0);
        this.scene.add(this.selfHalo);

        this.selfLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, -10, 0)
            ]),
            new THREE.LineBasicMaterial({ color: SELF_GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
        );
        this.scene.add(this.selfLine);

        this.selfRings = [];
        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(1.5 + i * 1.2, 0.015, 4, 80),
                new THREE.MeshBasicMaterial({ color: SELF_GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
            );
            ring.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
            ring.position.set(0, -10, 0);
            this.scene.add(ring);
            this.selfRings.push(ring);
        }
    }

    /* ══════════════════════════════════════════════════════
     *  RAYS — ego's field of awareness
     * ══════════════════════════════════════════════════════ */
    _buildRays() {
        this.rays = [];
        for (let i = 0; i < RAY_COUNT; i++) {
            const a = (i / RAY_COUNT) * Math.PI * 2;
            const len = 3 + Math.random() * 4;
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(Math.cos(a) * len, Math.sin(a * 0.4) * 1.5 - 0.5, Math.sin(a) * len)
            ];
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({ color: EGO_GLOW, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending })
            );
            this.scene.add(line);
            this.rays.push({ line, ph: Math.random() * Math.PI * 2 });
        }
    }

    /* ══════════════════════════════════════════════════════════════
     *  ANNOTATIONS — phased narrative that teaches Jung's Ch.1
     *
     *  Phase 1 (0s):    Chapter heading — orient the viewer
     *  Phase 2 (4s):    Ego label — "This point of light is your
     *                    conscious 'I' — the Ego"
     *  Phase 3 (9s):    Unconscious label — "Everything beyond
     *                    the light is the Unconscious"
     *  Phase 4 (14s):   Root labels — somatic (body) + psychic (mind)
     *  Phase 5 (19s):   Proportion insight — "The ego is smaller
     *                    than we think"
     *  Phase 6 (cycle): Self reveal annotation
     * ══════════════════════════════════════════════════════════════ */
    _buildAnnotations() {
        const ov = this._annotationOverlay = document.createElement('div');
        ov.className = 'ch1-annotations';
        ov.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');

.ch1-annotations {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 10;
    overflow: hidden;
}

/* ─── Shared annotation base ─── */
.ch1-a {
    position: absolute;
    font-family: 'Instrument Serif', serif;
    opacity: 0;
    transition: opacity 3s cubic-bezier(0.16, 1, 0.3, 1),
                transform 3s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateY(8px);
    will-change: opacity, transform;
}
.ch1-a.vis {
    opacity: 1;
    transform: translateY(0);
}

/* ─── Phase 1: Chapter heading ─── */
.ch1-a--heading {
    top: 7vh;
    left: 4.5vw;
}
.ch1-a--heading .ch1-eyebrow {
    font-family: 'Inter', sans-serif;
    font-size: clamp(0.55rem, 0.9vw, 0.7rem);
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: rgba(176, 176, 208, 0.18);
    margin-bottom: 0.4em;
}
.ch1-a--heading .ch1-title {
    font-size: clamp(1.8rem, 3.8vw, 3rem);
    font-style: italic;
    color: rgba(176, 176, 208, 0.35);
    letter-spacing: -0.02em;
    line-height: 1.05;
}

/* ─── Phase 2: Ego pointer ─── */
.ch1-a--ego {
    top: 28vh;
    right: 18vw;
    max-width: 22ch;
    text-align: left;
}
.ch1-a--ego .ch1-pointer-line {
    display: block;
    width: 50px;
    height: 1px;
    background: linear-gradient(to right, rgba(176,176,208,0.3), rgba(176,176,208,0));
    margin-bottom: 8px;
}
.ch1-a--ego .ch1-concept {
    font-size: clamp(0.8rem, 1.3vw, 1.05rem);
    font-style: italic;
    color: rgba(200, 200, 220, 0.35);
    line-height: 1.6;
}
.ch1-a--ego .ch1-concept em {
    font-style: normal;
    color: rgba(232, 232, 240, 0.5);
}

/* ─── Phase 3: Unconscious label ─── */
.ch1-a--unconscious {
    bottom: 28vh;
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    text-align: center;
    max-width: 30ch;
}
.ch1-a--unconscious.vis {
    transform: translateX(-50%) translateY(0);
}
.ch1-a--unconscious .ch1-pointer-up {
    display: block;
    width: 1px;
    height: 28px;
    background: linear-gradient(to top, rgba(50,70,120,0.25), rgba(50,70,120,0));
    margin: 0 auto 10px;
}
.ch1-a--unconscious .ch1-concept {
    font-size: clamp(0.75rem, 1.1vw, 0.95rem);
    font-style: italic;
    color: rgba(100, 130, 190, 0.3);
    line-height: 1.65;
}

/* ─── Phase 4: Root labels ─── */
.ch1-a--root {
    font-size: clamp(0.6rem, 0.85vw, 0.75rem);
    font-style: italic;
    line-height: 1.55;
}
.ch1-a--root-somatic {
    bottom: 42vh;
    left: 8vw;
    color: rgba(160, 70, 70, 0.35);
    max-width: 16ch;
}
.ch1-a--root-somatic .ch1-rootline {
    display: block;
    width: 30px;
    height: 1px;
    background: linear-gradient(to right, rgba(160,70,70,0.25), rgba(160,70,70,0));
    margin-bottom: 5px;
}
.ch1-a--root-psychic {
    bottom: 42vh;
    right: 8vw;
    color: rgba(80, 100, 180, 0.35);
    text-align: right;
    max-width: 16ch;
}
.ch1-a--root-psychic .ch1-rootline {
    display: block;
    width: 30px;
    height: 1px;
    background: linear-gradient(to left, rgba(80,100,180,0.25), rgba(80,100,180,0));
    margin-left: auto;
    margin-bottom: 5px;
}

/* ─── Phase 5: Proportion insight ─── */
.ch1-a--insight {
    bottom: 10vh;
    right: 5vw;
    max-width: 26ch;
    text-align: right;
}
.ch1-a--insight .ch1-concept {
    font-size: clamp(0.8rem, 1.2vw, 1rem);
    font-style: italic;
    color: rgba(176, 176, 208, 0.22);
    line-height: 1.7;
}
.ch1-a--insight .ch1-attr {
    display: block;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-size: 0.5em;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(176, 176, 208, 0.1);
    margin-top: 0.7em;
}

/* ─── Phase 6: Self reveal ─── */
.ch1-a--self {
    bottom: 7vh;
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    text-align: center;
    max-width: 26ch;
}
.ch1-a--self .ch1-self-name {
    font-size: clamp(0.95rem, 1.5vw, 1.2rem);
    font-style: italic;
    color: rgba(212, 175, 55, 0);
    letter-spacing: 0.06em;
    transition: color 2.5s ease;
}
.ch1-a--self.vis .ch1-self-name {
    color: rgba(212, 175, 55, 0.35);
}
.ch1-a--self .ch1-self-desc {
    font-size: clamp(0.6rem, 0.85vw, 0.72rem);
    font-style: italic;
    color: rgba(212, 175, 55, 0);
    margin-top: 0.5em;
    line-height: 1.6;
    transition: color 3s ease 0.5s;
}
.ch1-a--self.vis .ch1-self-desc {
    color: rgba(212, 175, 55, 0.2);
}
.ch1-a--self.hid .ch1-self-name,
.ch1-a--self.hid .ch1-self-desc {
    color: rgba(212, 175, 55, 0) !important;
}

/* ─── Mobile ─── */
@media (max-width: 768px) {
    .ch1-a--root-somatic, .ch1-a--root-psychic { display: none; }
    .ch1-a--insight { max-width: 20ch; bottom: 6vh; }
    .ch1-a--ego { right: 6vw; max-width: 18ch; }
}
</style>

<!-- Phase 1: Chapter heading -->
<div class="ch1-a ch1-a--heading" data-phase="1">
    <div class="ch1-eyebrow">Chapter I</div>
    <div class="ch1-title">The Ego</div>
</div>

<!-- Phase 2: Ego identification -->
<div class="ch1-a ch1-a--ego" data-phase="2">
    <span class="ch1-pointer-line"></span>
    <div class="ch1-concept">
        This point of light is <em>the Ego</em> —
        your conscious "I," the center
        of everything you know and feel.
    </div>
</div>

<!-- Phase 3: Unconscious identification -->
<div class="ch1-a ch1-a--unconscious" data-phase="3">
    <span class="ch1-pointer-up"></span>
    <div class="ch1-concept">
        The vast darkness is <em>the Unconscious</em> —
        everything about yourself that
        you do not yet know.
    </div>
</div>

<!-- Phase 4: Root labels -->
<div class="ch1-a ch1-a--root ch1-a--root-somatic" data-phase="4a">
    <span class="ch1-rootline"></span>
    The somatic root —<br>
    body, sensation, instinct
</div>
<div class="ch1-a ch1-a--root ch1-a--root-psychic" data-phase="4b">
    <span class="ch1-rootline"></span>
    The psychic root —<br>
    mind, dreams, intuition
</div>

<!-- Phase 5: Proportion insight -->
<div class="ch1-a ch1-a--insight" data-phase="5">
    <div class="ch1-concept">
        The ego is not the whole
        of the personality. It is only
        a small light upon a
        vast, dark sea.
        <span class="ch1-attr">— C. G. Jung, Aion §3</span>
    </div>
</div>

<!-- Phase 6: Self (synced to reveal cycle) -->
<div class="ch1-a ch1-a--self">
    <div class="ch1-self-name">the Self</div>
    <div class="ch1-self-desc">
        The totality that contains both
        ego and unconscious — the whole psyche.
    </div>
</div>
`;

        (this.container || document.body).appendChild(ov);

        /* ── Phased reveal schedule ── */
        this._annTimers = [];
        const phases = [
            { sel: '[data-phase="1"]', delay: 2000 },
            { sel: '[data-phase="2"]', delay: 5000 },
            { sel: '[data-phase="3"]', delay: 10000 },
            { sel: '[data-phase="4a"]', delay: 15000 },
            { sel: '[data-phase="4b"]', delay: 16000 },
            { sel: '[data-phase="5"]', delay: 21000 },
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

        /* Ego flicker */
        const p = 0.88 + Math.sin(t * 1.8) * 0.08 + Math.sin(t * 4.1) * 0.04;
        this.egoDot.material.opacity = p;
        this.egoGlow.material.opacity = 0.15 + Math.sin(t * 0.9) * 0.06;
        this.egoCorona.material.opacity = 0.03 + Math.sin(t * 0.35) * 0.015;
        this.egoField.material.opacity = 0.012 + Math.sin(t * 0.2) * 0.006;
        this.egoGroup.position.x = Math.sin(t * 0.04) * 0.2;
        this.egoGroup.position.y = Math.sin(t * 0.1) * 0.1;

        /* Rays */
        for (const r of this.rays) {
            r.line.material.opacity = 0.025 + Math.sin(t * 0.4 + r.ph) * 0.02;
        }

        /* Ocean drift */
        const op = this.oceanPts.geometry.attributes.position.array;
        for (let i = 0; i < OCEAN_N; i++) {
            op[i * 3 + 1] += Math.sin(t * 0.08 + this.oceanPh[i]) * dt * 0.006;
            op[i * 3] += Math.cos(t * 0.02 + this.oceanPh[i] * 2) * dt * 0.003;
        }
        this.oceanPts.geometry.attributes.position.needsUpdate = true;

        /* Surface waves */
        const sv = this.surfVerts;
        for (let i = 0; i < sv.length; i += 3) {
            const x = sv[i], z = sv[i + 1];
            const dist = Math.sqrt(
                (x - this.mouseSmooth.x * 25) ** 2 +
                (z - this.mouseSmooth.y * 25) ** 2
            );
            sv[i + 2] = Math.sin(t * 1.5 + dist * 0.2) * 0.12 * Math.max(0, 1 - dist / 25);
        }
        this.surfGeo.attributes.position.needsUpdate = true;

        /* Filaments pulse */
        for (const f of this.filaments) {
            const base = f.type === 'somatic' ? 0.1 : 0.08;
            const amp = f.type === 'somatic' ? 0.08 : 0.06;
            f.line.material.opacity = base + Math.sin(t * 0.8 + f.ph) * amp;
        }

        /* Awareness rings */
        for (const ring of this.rings) {
            const prog = ((t + ring.ph) % 12) / 12;
            ring.mesh.scale.setScalar(1 + prog * 14);
            ring.mesh.material.opacity = 0.06 * (1 - prog);
        }

        /* ── Self revelation — every 28s for 12s ── */
        const cycle = t % 28;
        const revealing = cycle > 16;
        const selfT = revealing ? (cycle - 16) / 12 : 0;
        const selfO = revealing ? Math.sin(selfT * Math.PI) * 0.2 : 0;

        this.deepSelf.material.opacity = selfO;
        this.selfHalo.material.opacity = selfO * 0.15;
        this.selfLine.material.opacity = selfO * 0.4;
        for (let i = 0; i < this.selfRings.length; i++) {
            this.selfRings[i].material.opacity = selfO * 0.3;
            this.selfRings[i].rotation.z = t * 0.05 * (i % 2 === 0 ? 1 : -1);
        }
        this.deepLight.intensity = selfO * 3;
        this.egoLight.intensity = 0.8 + (revealing ? selfO * 2 : 0);

        /* Self annotation sync */
        const selfAnn = this._annotationOverlay?.querySelector('.ch1-a--self');
        if (selfAnn) {
            if (revealing && selfT > 0.08 && selfT < 0.92) {
                selfAnn.classList.add('vis');
                selfAnn.classList.remove('hid');
            } else {
                selfAnn.classList.remove('vis');
                selfAnn.classList.add('hid');
            }
        }

        /* Cinematic intro camera */
        const introF = Math.min(this.introT / 10, 1);
        const ease = 1 - Math.pow(1 - introF, 3);
        const tH = 1.5 + this.mouseSmooth.y * 3 + Math.sin(t * 0.025) * 0.4;
        const camH = THREE.MathUtils.lerp(20, tH, ease);
        const camD = THREE.MathUtils.lerp(30, 12, ease);
        const camA = t * 0.012 + this.mouseSmooth.x * 0.25;
        this.camera.position.set(Math.sin(camA) * camD, camH, Math.cos(camA) * camD);
        this.camera.lookAt(0, -1.5, 0);

        /* Bloom */
        if (this.bloom) {
            this.bloom.strength = 1.4 + Math.sin(t * 0.08) * 0.3
                + (revealing ? selfO * 0.8 : 0);
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
