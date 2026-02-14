/**
 * ThreeSyzygyViz.js — Chapter 3: "The Syzygy: Anima and Animus"
 *
 * Jung, Aion §20–§42:
 *   "Every man carries within him the eternal image of woman…
 *    This image is fundamentally unconscious, an hereditary factor
 *    of primordial origin."
 *
 *   "What is not-I, not masculine, is most probably feminine,
 *    and because the not-I is felt as not belonging to me and
 *    therefore as outside me, the anima-image is usually
 *    projected upon women."
 *
 *   "The syzygy motif… appears as pairs of divine figures,
 *    of Christ and Church, of bridegroom and bride."
 *
 * ── VISUAL DESIGN RATIONALE ──────────────────────────────
 *
 * The Syzygy is a DANCE — two figures that belong together
 * but are rarely seen together consciously. The visualization
 * must show:
 *
 *   ANIMA (Lunar): Soft, silver, undulating, receptive —
 *         a moon-like sphere wreathed in flowing, fluid particles.
 *         She changes — shifting, shimmering, never quite still.
 *         She is the figure of feeling, eros, relationship.
 *
 *   ANIMUS (Solar): Bright, golden, faceted, radiating —
 *         a sun-like form with crystalline edges and outward rays.
 *         He is the figure of logos, judgment, meaning-making.
 *
 *   THE ORBIT: They orbit each other in an eternal dance —
 *         neither dominates; the orbit is the relationship itself.
 *         The orbit path is traced as a luminous trail.
 *
 *   FIELD LINES: Between them, curved magnetic lines show
 *         attraction and tension — the psychic bond that pulls
 *         these opposites toward each other.
 *
 *   CONJUNCTION: Periodically they align — a burst of light
 *         and particles marks the "sacred marriage," the moment
 *         when opposites unite briefly in wholeness.
 *
 *   QUATERNIO: A faint cross pattern underlies the scene —
 *         Jung's marriage quaternio (man↔woman, anima↔animus).
 *
 * ── ANNOTATION DESIGN ────────────────────────────────────
 *
 *   Phase 1 (2s):   Chapter heading
 *   Phase 2 (6s):   Anima identification — "the inner feminine"
 *   Phase 3 (11s):  Animus identification — "the inner masculine"
 *   Phase 4 (17s):  The dance / relationship concept
 *   Phase 5 (23s):  Jung quote about the eternal image
 *   Phase 6 (cyc):  Conjunction annotation — "sacred union"
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/* ── Palette ── */
const VOID = 0x020208;
const ANIMA_CORE = new THREE.Color('#b8c8e8');  // cool silver-blue
const ANIMA_GLOW = new THREE.Color('#8090c0');  // lunar blue
const ANIMA_TRAIL = new THREE.Color('#6070a0');
const ANIMUS_CORE = new THREE.Color('#ffd060');  // warm gold
const ANIMUS_GLOW = new THREE.Color('#d0a030');  // solar amber
const ANIMUS_TRAIL = new THREE.Color('#c09020');
const FIELD_CLR = new THREE.Color('#404070');
const CONJ_CLR = new THREE.Color('#ffe0f0');  // warm white-pink for union

export default class ThreeSyzygyViz extends BaseViz {
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
        cam.position.set(0, 3, 16);

        /* ── Mouse ── */
        this.mouse = new THREE.Vector2();
        this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => {
            this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        };
        addEventListener('mousemove', this._onMM);

        /* ── Build scene ── */
        this._buildAnima();
        this._buildAnimus();
        this._buildOrbitTrails();
        this._buildFieldLines();
        this._buildQuaternio();
        this._buildConjunction();
        this._buildAtmosphere();
        this._buildAnnotations();

        /* ── Lighting ── */
        S.add(new THREE.AmbientLight(0x080815, 0.15));

        this.animaLight = new THREE.PointLight(0x8090c0, 0.8, 18);
        S.add(this.animaLight);

        this.animusLight = new THREE.PointLight(0xd0a030, 1.0, 18);
        S.add(this.animusLight);

        this.conjLight = new THREE.PointLight(0xffe0f0, 0, 20);
        S.add(this.conjLight);

        // Subtle rim
        const rim = new THREE.DirectionalLight(0x101020, 0.2);
        rim.position.set(0, 8, -12);
        S.add(rim);

        /* ── Post-processing ── */
        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(S, cam));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.5, 0.4, 0.2
        );
        this.composer.addPass(this.bloom);

        this.introT = 0;
        this.conjTimer = 0;
    }

    /* ══════════════════════════════════════════════════════
     *  ANIMA — Lunar, silver-blue, fluid, receptive
     * ══════════════════════════════════════════════════════ */
    _buildAnima() {
        const g = this.animaGroup = new THREE.Group();

        // Core sphere — soft, luminous, slightly translucent
        this.animaCore = new THREE.Mesh(
            new THREE.SphereGeometry(0.55, 32, 32),
            new THREE.MeshStandardMaterial({
                color: ANIMA_CORE, emissive: ANIMA_CORE,
                emissiveIntensity: 0.4, roughness: 0.15, metalness: 0.3,
                transparent: true, opacity: 0.95
            })
        );
        g.add(this.animaCore);

        // Inner glow
        g.add(new THREE.Mesh(
            new THREE.SphereGeometry(0.85, 12, 12),
            new THREE.MeshBasicMaterial({
                color: ANIMA_GLOW, transparent: true, opacity: 0.1,
                blending: THREE.AdditiveBlending, side: THREE.BackSide
            })
        ));

        // Outer halo — larger, more diffuse
        g.add(new THREE.Mesh(
            new THREE.SphereGeometry(1.3, 10, 10),
            new THREE.MeshBasicMaterial({
                color: ANIMA_GLOW, transparent: true, opacity: 0.04,
                blending: THREE.AdditiveBlending, side: THREE.BackSide
            })
        ));

        // Flowing particles — anima is fluid and changing
        this.animaFlowPts = [];
        const flowN = 60;
        const flowPos = new Float32Array(flowN * 3);
        for (let i = 0; i < flowN; i++) {
            const a = (i / flowN) * Math.PI * 2;
            const r = 0.8 + Math.random() * 0.6;
            flowPos[i * 3] = Math.cos(a) * r;
            flowPos[i * 3 + 1] = (Math.random() - 0.5) * 1.2;
            flowPos[i * 3 + 2] = Math.sin(a) * r;
            this.animaFlowPts.push({ ang: a, rad: r, ph: Math.random() * Math.PI * 2 });
        }
        const flowGeo = new THREE.BufferGeometry();
        flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
        this.animaFlow = new THREE.Points(flowGeo, new THREE.PointsMaterial({
            color: ANIMA_GLOW, size: 0.04, transparent: true, opacity: 0.4,
            blending: THREE.AdditiveBlending, depthWrite: false
        }));
        g.add(this.animaFlow);

        // Crescent ring — ☽ moon symbolism
        this.animaRing = new THREE.Mesh(
            new THREE.TorusGeometry(0.7, 0.012, 4, 64, Math.PI * 1.3),
            new THREE.MeshBasicMaterial({
                color: ANIMA_CORE, transparent: true, opacity: 0.15,
                blending: THREE.AdditiveBlending
            })
        );
        this.animaRing.rotation.x = Math.PI * 0.4;
        g.add(this.animaRing);

        this.scene.add(g);
    }

    /* ══════════════════════════════════════════════════════
     *  ANIMUS — Solar, golden, crystalline, radiating
     * ══════════════════════════════════════════════════════ */
    _buildAnimus() {
        const g = this.animusGroup = new THREE.Group();

        // Core — octahedron for crystalline quality
        this.animusCore = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.5, 1),
            new THREE.MeshStandardMaterial({
                color: ANIMUS_CORE, emissive: ANIMUS_CORE,
                emissiveIntensity: 0.5, roughness: 0.1, metalness: 0.6
            })
        );
        g.add(this.animusCore);

        // Inner glow
        g.add(new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 10, 10),
            new THREE.MeshBasicMaterial({
                color: ANIMUS_GLOW, transparent: true, opacity: 0.12,
                blending: THREE.AdditiveBlending, side: THREE.BackSide
            })
        ));

        // Outer glow
        g.add(new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            new THREE.MeshBasicMaterial({
                color: ANIMUS_GLOW, transparent: true, opacity: 0.04,
                blending: THREE.AdditiveBlending, side: THREE.BackSide
            })
        ));

        // Sharp radiating rays — logos projecting outward
        this.animusRays = [];
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const len = 1.0 + Math.random() * 0.8;
            const pts = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(
                    Math.cos(angle) * len,
                    Math.sin(angle * 1.3) * len * 0.4,
                    Math.sin(angle) * len * 0.3
                )
            ];
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({
                    color: ANIMUS_GLOW, transparent: true, opacity: 0.12,
                    blending: THREE.AdditiveBlending
                })
            );
            g.add(line);
            this.animusRays.push({ line, ph: Math.random() * Math.PI * 2 });
        }

        this.scene.add(g);
    }

    /* ══════════════════════════════════════════════════════
     *  ORBIT TRAILS — luminous paths showing the dance
     * ══════════════════════════════════════════════════════ */
    _buildOrbitTrails() {
        // Anima trail (silver)
        this.animaTrailPts = [];
        const trailLen = 80;
        for (let i = 0; i < trailLen; i++) {
            this.animaTrailPts.push(new THREE.Vector3());
        }
        this.animaTrailGeo = new THREE.BufferGeometry().setFromPoints(this.animaTrailPts);
        this.animaTrail = new THREE.Line(this.animaTrailGeo, new THREE.LineBasicMaterial({
            color: ANIMA_TRAIL, transparent: true, opacity: 0.12,
            blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.animaTrail);

        // Animus trail (gold)
        this.animusTrailPts = [];
        for (let i = 0; i < trailLen; i++) {
            this.animusTrailPts.push(new THREE.Vector3());
        }
        this.animusTrailGeo = new THREE.BufferGeometry().setFromPoints(this.animusTrailPts);
        this.animusTrail = new THREE.Line(this.animusTrailGeo, new THREE.LineBasicMaterial({
            color: ANIMUS_TRAIL, transparent: true, opacity: 0.12,
            blending: THREE.AdditiveBlending
        }));
        this.scene.add(this.animusTrail);

        this._trailIdx = 0;
    }

    /* ══════════════════════════════════════════════════════
     *  FIELD LINES — attraction/tension between poles
     * ══════════════════════════════════════════════════════ */
    _buildFieldLines() {
        this.fieldLines = [];
        for (let i = 0; i < 14; i++) {
            const pts = [];
            for (let j = 0; j <= 50; j++) pts.push(new THREE.Vector3());
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
                color: FIELD_CLR, transparent: true, opacity: 0.08,
                blending: THREE.AdditiveBlending
            }));
            this.scene.add(line);
            this.fieldLines.push({ geo, line, offset: (i / 14) * Math.PI * 2 });
        }
    }

    /* ══════════════════════════════════════════════════════
     *  QUATERNIO — the four-fold cross underlying the dance
     * ══════════════════════════════════════════════════════ */
    _buildQuaternio() {
        // Faint cross lines — vertical and horizontal
        const crossLen = 12;
        const crossMat = new THREE.LineBasicMaterial({
            color: 0x202040, transparent: true, opacity: 0.04
        });

        const vLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, -crossLen, 0),
                new THREE.Vector3(0, crossLen, 0)
            ]), crossMat
        );
        this.scene.add(vLine);

        const hLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-crossLen, 0, 0),
                new THREE.Vector3(crossLen, 0, 0)
            ]), crossMat
        );
        this.scene.add(hLine);

        // Small dots at the four cardinal points
        this.quatDots = [];
        const dotPos = [
            [0, crossLen * 0.5, 0], [0, -crossLen * 0.5, 0],
            [-crossLen * 0.5, 0, 0], [crossLen * 0.5, 0, 0]
        ];
        for (const p of dotPos) {
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.03, 6, 6),
                new THREE.MeshBasicMaterial({
                    color: 0x303060, transparent: true, opacity: 0.1,
                    blending: THREE.AdditiveBlending
                })
            );
            dot.position.set(...p);
            this.scene.add(dot);
            this.quatDots.push(dot);
        }
    }

    /* ══════════════════════════════════════════════════════
     *  CONJUNCTION — particle burst when opposites unite
     * ══════════════════════════════════════════════════════ */
    _buildConjunction() {
        const N = 300;
        const pos = new Float32Array(N * 3);
        this.conjData = [];
        for (let i = 0; i < N; i++) {
            pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0;
            this.conjData.push({
                vel: new THREE.Vector3(),
                life: 1 + Math.random()
            });
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.conjPts = new THREE.Points(geo, new THREE.PointsMaterial({
            color: CONJ_CLR, size: 0.06, transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending, depthWrite: false
        }));
        this.scene.add(this.conjPts);
    }

    /* ── ATMOSPHERE ── */
    _buildAtmosphere() {
        const N = 600;
        const pos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 50;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.stars = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x303060, size: 0.04, transparent: true, opacity: 0.3,
            depthWrite: false
        }));
        this.scene.add(this.stars);
    }

    /* ══════════════════════════════════════════════════════════════════
     *  ANNOTATIONS — Instrument Serif, phased, with leader lines
     * ══════════════════════════════════════════════════════════════════ */
    _buildAnnotations() {
        const ov = this._annotationOverlay = document.createElement('div');
        ov.className = 'ch3-annotations';
        ov.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');

.ch3-annotations {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 10;
    overflow: hidden;
}

.ch3-a {
    position: absolute;
    font-family: 'Instrument Serif', serif;
    opacity: 0;
    transition: opacity 2.8s cubic-bezier(0.16, 1, 0.3, 1),
                transform 2.8s cubic-bezier(0.16, 1, 0.3, 1);
    transform: translateY(6px);
    will-change: opacity, transform;
}
.ch3-a.vis {
    opacity: 1;
    transform: translateY(0);
}

/* ─── Phase 1: Chapter heading ─── */
.ch3-a--heading {
    top: 6vh;
    left: 4.5vw;
}
.ch3-a--heading .ch3-eyebrow {
    font-family: 'Inter', 'Helvetica Neue', sans-serif;
    font-size: clamp(0.55rem, 0.9vw, 0.72rem);
    letter-spacing: 0.45em;
    text-transform: uppercase;
    color: rgba(100, 100, 160, 0.35);
    margin-bottom: 0.4em;
}
.ch3-a--heading .ch3-title {
    font-size: clamp(2rem, 4vw, 3.4rem);
    font-style: italic;
    color: rgba(140, 140, 200, 0.4);
    letter-spacing: -0.02em;
    line-height: 1.05;
}

/* ─── Phase 2: Anima (left) ─── */
.ch3-a--anima {
    top: 22vh;
    left: 4vw;
    max-width: 22ch;
}
.ch3-a--anima .ch3-leader {
    display: block;
    width: 45px;
    height: 1px;
    background: linear-gradient(to right, rgba(128,144,192,0.5), rgba(128,144,192,0));
    margin-bottom: 10px;
    animation: ch3-leaderPulse 4.5s ease-in-out infinite;
}
@keyframes ch3-leaderPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
}
.ch3-a--anima .ch3-text {
    font-size: clamp(0.8rem, 1.15vw, 0.98rem);
    font-style: italic;
    color: rgba(160, 175, 220, 0.5);
    line-height: 1.7;
}
.ch3-a--anima .ch3-text em {
    font-style: normal;
    color: rgba(184, 200, 232, 0.7);
}
.ch3-a--anima .ch3-note {
    display: block;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-size: 0.5em;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(128, 144, 192, 0.2);
    margin-top: 0.7em;
}

/* ─── Phase 3: Animus (right) ─── */
.ch3-a--animus {
    top: 22vh;
    right: 4vw;
    max-width: 22ch;
    text-align: right;
}
.ch3-a--animus .ch3-leader {
    display: block;
    width: 45px;
    height: 1px;
    background: linear-gradient(to left, rgba(208,160,48,0.5), rgba(208,160,48,0));
    margin-left: auto;
    margin-bottom: 10px;
    animation: ch3-leaderPulseGold 4.5s ease-in-out infinite;
}
@keyframes ch3-leaderPulseGold {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
}
.ch3-a--animus .ch3-text {
    font-size: clamp(0.8rem, 1.15vw, 0.98rem);
    font-style: italic;
    color: rgba(220, 190, 120, 0.5);
    line-height: 1.7;
}
.ch3-a--animus .ch3-text em {
    font-style: normal;
    color: rgba(255, 208, 96, 0.7);
}
.ch3-a--animus .ch3-note {
    display: block;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-size: 0.5em;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(208, 160, 48, 0.2);
    margin-top: 0.7em;
}

/* ─── Phase 4: Dance / relationship ─── */
.ch3-a--dance {
    bottom: 22vh;
    left: 50%;
    transform: translateX(-50%) translateY(6px);
    max-width: 30ch;
    text-align: center;
}
.ch3-a--dance.vis {
    transform: translateX(-50%) translateY(0);
}
.ch3-a--dance .ch3-text {
    font-size: clamp(0.75rem, 1.05vw, 0.9rem);
    font-style: italic;
    color: rgba(160, 150, 200, 0.38);
    line-height: 1.7;
}
.ch3-a--dance .ch3-text em {
    font-style: normal;
    color: rgba(200, 180, 240, 0.55);
}

/* ─── Phase 5: Jung quote ─── */
.ch3-a--quote {
    bottom: 7vh;
    left: 4.5vw;
    max-width: 30ch;
}
.ch3-a--quote .ch3-quotemark {
    display: block;
    font-size: 2rem;
    line-height: 1;
    color: rgba(120, 110, 180, 0.1);
    margin-bottom: 0.2em;
}
.ch3-a--quote .ch3-text {
    font-size: clamp(0.82rem, 1.15vw, 0.98rem);
    font-style: italic;
    color: rgba(160, 150, 210, 0.38);
    line-height: 1.7;
}
.ch3-a--quote .ch3-attr {
    display: block;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-size: 0.5em;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(130, 120, 180, 0.18);
    margin-top: 0.7em;
}

/* ─── Phase 6: Conjunction (synced) ─── */
.ch3-a--conjunction {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) translateY(6px);
    text-align: center;
    max-width: 24ch;
    transition: opacity 2s ease, transform 2s ease;
}
.ch3-a--conjunction.vis {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(0);
}
.ch3-a--conjunction.hid {
    opacity: 0;
    transform: translate(-50%, -50%) translateY(6px);
}
.ch3-a--conjunction .ch3-conj-text {
    font-size: clamp(0.88rem, 1.3vw, 1.1rem);
    font-style: italic;
    color: rgba(255, 224, 240, 0.5);
    line-height: 1.65;
    letter-spacing: 0.03em;
}
.ch3-a--conjunction .ch3-conj-sub {
    display: block;
    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-size: 0.5em;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(240, 200, 220, 0.18);
    margin-top: 0.6em;
}

/* ─── Micro-labels ─── */
.ch3-micro {
    position: absolute;
    font-family: 'Inter', sans-serif;
    font-size: clamp(0.45rem, 0.6vw, 0.52rem);
    letter-spacing: 0.4em;
    text-transform: uppercase;
    opacity: 0;
    transition: opacity 3s ease;
}
.ch3-micro.vis { opacity: 1; }
.ch3-micro--anima {
    left: 22%;
    top: 52%;
    color: rgba(128, 144, 192, 0.18);
}
.ch3-micro--animus {
    right: 20%;
    top: 52%;
    color: rgba(208, 160, 48, 0.18);
}

@media (max-width: 768px) {
    .ch3-a--dance { max-width: 24ch; bottom: 16vh; }
    .ch3-a--anima, .ch3-a--animus { max-width: 18ch; }
    .ch3-micro { display: none; }
}
</style>

<!-- Phase 1: Chapter heading -->
<div class="ch3-a ch3-a--heading" data-phase="1">
    <div class="ch3-eyebrow">Chapter III</div>
    <div class="ch3-title">The Syzygy</div>
</div>

<!-- Phase 2: Anima -->
<div class="ch3-a ch3-a--anima" data-phase="2">
    <span class="ch3-leader"></span>
    <div class="ch3-text">
        The silver figure is <em>the Anima</em> —
        the inner feminine, image of
        feeling, eros, relationship.
        <span class="ch3-note">Lunar — fluid, changing, receptive</span>
    </div>
</div>

<!-- Phase 3: Animus -->
<div class="ch3-a ch3-a--animus" data-phase="3">
    <span class="ch3-leader"></span>
    <div class="ch3-text">
        The golden figure is <em>the Animus</em> —
        the inner masculine, voice of
        judgment, logos, meaning.
        <span class="ch3-note">Solar — crystalline, radiating, active</span>
    </div>
</div>

<!-- Phase 4: The dance -->
<div class="ch3-a ch3-a--dance" data-phase="4">
    <div class="ch3-text">
        Their orbit is <em>the Syzygy</em> — the eternal dance
        of opposites within the psyche. Neither dominates;
        each needs the other to be whole.
    </div>
</div>

<!-- Phase 5: Jung quote -->
<div class="ch3-a ch3-a--quote" data-phase="5">
    <span class="ch3-quotemark">"</span>
    <div class="ch3-text">
        Every man carries within him
        the eternal image of woman…
        an hereditary factor of
        primordial origin.
        <span class="ch3-attr">— C. G. Jung, Aion §24</span>
    </div>
</div>

<!-- Phase 6: Conjunction (synced to union event) -->
<div class="ch3-a ch3-a--conjunction">
    <div class="ch3-conj-text">
        Coniunctio — the sacred marriage<br>
        where opposites briefly unite
        <span class="ch3-conj-sub">Wholeness glimpsed, not possessed</span>
    </div>
</div>

<!-- Micro-labels -->
<div class="ch3-micro ch3-micro--anima" data-phase="2">anima ☽</div>
<div class="ch3-micro ch3-micro--animus" data-phase="3">animus ☉</div>
`;

        (this.container || document.body).appendChild(ov);

        /* ── Phased reveal ── */
        this._annTimers = [];
        const phases = [
            { sel: '[data-phase="1"]', delay: 2000 },
            { sel: '[data-phase="2"]', delay: 6000 },
            { sel: '[data-phase="3"]', delay: 11000 },
            { sel: '[data-phase="4"]', delay: 17000 },
            { sel: '[data-phase="5"]', delay: 23000 },
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

        // Orbit parameters — mouse controls balance
        const orbitR = 3.8 + this.mouseSmooth.y * 1.2;
        const speed = 0.25 + this.mouseSmooth.x * 0.12;

        /* ── Anima orbit ── */
        const animaX = Math.cos(t * speed) * orbitR;
        const animaY = Math.sin(t * speed * 0.6) * 1.0;
        const animaZ = Math.sin(t * speed) * orbitR * 0.7;
        this.animaGroup.position.set(animaX, animaY, animaZ);

        // Anima subtle pulsing/wobble — she changes
        this.animaCore.material.emissiveIntensity = 0.3 + Math.sin(t * 1.5) * 0.15;
        this.animaRing.rotation.z += 0.005;
        this.animaRing.material.opacity = 0.1 + Math.sin(t * 0.4) * 0.06;

        // Anima flow particles
        const flowP = this.animaFlow.geometry.attributes.position.array;
        for (let i = 0; i < this.animaFlowPts.length; i++) {
            const fp = this.animaFlowPts[i];
            const a = fp.ang + t * 0.3;
            const r = fp.rad + Math.sin(t * 0.8 + fp.ph) * 0.3;
            flowP[i * 3] = Math.cos(a) * r;
            flowP[i * 3 + 1] = Math.sin(t * 0.5 + fp.ph) * 0.6;
            flowP[i * 3 + 2] = Math.sin(a) * r;
        }
        this.animaFlow.geometry.attributes.position.needsUpdate = true;

        /* ── Animus orbit (opposite) ── */
        const animusX = -Math.cos(t * speed) * orbitR;
        const animusY = -Math.sin(t * speed * 0.6) * 1.0;
        const animusZ = -Math.sin(t * speed) * orbitR * 0.7;
        this.animusGroup.position.set(animusX, animusY, animusZ);

        // Animus spins and pulses — crystalline rotation
        this.animusCore.rotation.y = t * 0.4;
        this.animusCore.rotation.x = t * 0.15;
        this.animusCore.material.emissiveIntensity = 0.4 + Math.sin(t * 1.2) * 0.2;

        // Animus rays pulse
        for (const ray of this.animusRays) {
            ray.line.material.opacity = 0.08 + Math.sin(t * 0.7 + ray.ph) * 0.06;
        }

        /* ── Orbit trails ── */
        if (t > 0.5) {
            this._trailIdx++;
            const ti = this._trailIdx % this.animaTrailPts.length;
            this.animaTrailPts[ti].copy(this.animaGroup.position);
            this.animusTrailPts[ti].copy(this.animusGroup.position);
            this.animaTrailGeo.setFromPoints(this.animaTrailPts);
            this.animusTrailGeo.setFromPoints(this.animusTrailPts);
        }

        /* ── Lights follow figures ── */
        this.animaLight.position.copy(this.animaGroup.position);
        this.animaLight.position.z += 2;
        this.animusLight.position.copy(this.animusGroup.position);
        this.animusLight.position.z += 2;

        /* ── Field lines ── */
        const a = this.animaGroup.position;
        const b = this.animusGroup.position;
        for (const fl of this.fieldLines) {
            const pts = fl.geo.attributes.position.array;
            for (let j = 0; j <= 50; j++) {
                const frac = j / 50;
                const mx = a.x + (b.x - a.x) * frac;
                const my = a.y + (b.y - a.y) * frac;
                const mz = a.z + (b.z - a.z) * frac;
                const bow = Math.sin(frac * Math.PI) * 2.5;
                pts[j * 3] = mx + Math.cos(fl.offset + t * 0.15) * bow;
                pts[j * 3 + 1] = my + Math.sin(fl.offset * 2 + t * 0.1) * bow * 0.5;
                pts[j * 3 + 2] = mz + Math.sin(fl.offset + t * 0.15) * bow;
            }
            fl.geo.attributes.position.needsUpdate = true;
            fl.line.material.opacity = 0.05 + Math.sin(t * 0.3 + fl.offset) * 0.04;
        }

        /* ── Conjunction — when they're close ── */
        const dist = a.distanceTo(b);
        const isConjunction = dist < 3;

        if (isConjunction && this.conjTimer <= 0) {
            this.conjTimer = 4;
            const cp = this.conjPts.geometry.attributes.position.array;
            const mid = new THREE.Vector3().lerpVectors(a, b, 0.5);
            for (let i = 0; i < this.conjData.length; i++) {
                this.conjData[i].life = 0;
                this.conjData[i].vel.set(
                    (Math.random() - 0.5) * 0.12,
                    (Math.random() - 0.5) * 0.12,
                    (Math.random() - 0.5) * 0.12
                );
                cp[i * 3] = mid.x;
                cp[i * 3 + 1] = mid.y;
                cp[i * 3 + 2] = mid.z;
            }
            this.conjPts.geometry.attributes.position.needsUpdate = true;
        }

        if (this.conjTimer > 0) {
            this.conjTimer -= dt;
            const fade = Math.max(0, this.conjTimer / 4);
            this.conjPts.material.opacity = fade * 0.6;
            this.conjLight.intensity = fade * 3;
            const mid = new THREE.Vector3().lerpVectors(a, b, 0.5);
            this.conjLight.position.copy(mid);

            const cp = this.conjPts.geometry.attributes.position.array;
            for (let i = 0; i < this.conjData.length; i++) {
                cp[i * 3] += this.conjData[i].vel.x;
                cp[i * 3 + 1] += this.conjData[i].vel.y;
                cp[i * 3 + 2] += this.conjData[i].vel.z;
                this.conjData[i].vel.multiplyScalar(0.98);
            }
            this.conjPts.geometry.attributes.position.needsUpdate = true;
        } else {
            this.conjLight.intensity *= 0.95;
        }

        // Conjunction annotation sync
        const conjAnn = this._annotationOverlay?.querySelector('.ch3-a--conjunction');
        if (conjAnn) {
            if (this.conjTimer > 1) {
                conjAnn.classList.add('vis');
                conjAnn.classList.remove('hid');
            } else if (this.conjTimer <= 0.5) {
                conjAnn.classList.remove('vis');
                conjAnn.classList.add('hid');
            }
        }

        /* ── Atmosphere ── */
        this.stars.rotation.y += 0.00015;

        /* ── Camera ── */
        const introF = Math.min(this.introT / 6, 1);
        const ease = 1 - Math.pow(1 - introF, 3);
        const camD = THREE.MathUtils.lerp(24, 16, ease);
        const camH = THREE.MathUtils.lerp(10, 3 + this.mouseSmooth.y * 2, ease);
        const camA = t * 0.012 + this.mouseSmooth.x * 0.15;
        this.camera.position.set(
            Math.sin(camA) * camD,
            camH,
            Math.cos(camA) * camD
        );
        this.camera.lookAt(0, 0, 0);

        /* ── Bloom ── */
        if (this.bloom) {
            const conjBoost = this.conjTimer > 0 ? (this.conjTimer / 4) * 0.8 : 0;
            this.bloom.strength = 1.3 + Math.sin(t * 0.04) * 0.15 + conjBoost;
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
