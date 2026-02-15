/**
 * ThreeProphecyViz.js — Chapter 7: "The Prophecies of Nostradamus"
 *
 * REDESIGNED: Three scroll-driven scenes that progressively zoom into
 * the timeline of the Aeons.
 *
 *  Scene 1 (scroll 0.00–0.15): The Great Year — zodiac wheel, contextual
 *  Scene 2 (scroll 0.15–0.45): The Aeon Spiral — vertical helix
 *  Scene 3 (scroll 0.45–1.00): The Pisces Timeline — 0–2000 AD detail
 *
 * Jung: Nostradamus "mined the collective unconscious," perceiving an
 * imminent enantiodromia of the Christian aeon. His prophecies reveal
 * the psyche's capacity to prefigure major archetypal transformations.
 *
 * Palette: warm amber/gold with violet shadows — prophetic firelight.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/* ═══════════════════ Constants ═══════════════════ */
const AMBER = 0xff8c00;
const GOLD = 0xc8a040;
const COOL_BLUE = 0x6688bb;
const VIOLET = 0x6633aa;
const CRIMSON = 0xcc3366;
const TEAL = 0x44bbcc;
const PARCHMENT = '#d4c8a8';

/* Scene boundaries in scroll progress (0–1) — rebalanced for pacing */
const SCENE1_START = 0.0;
const SCENE1_END = 0.12;
const SCENE2_START = 0.12;
const SCENE2_END = 0.38;
const SCENE3_START = 0.38;
const SCENE3_END = 1.0;

/* Zodiac glyphs */
const ZODIAC = [
    { glyph: '♈', name: 'Aries' },
    { glyph: '♉', name: 'Taurus' },
    { glyph: '♊', name: 'Gemini' },
    { glyph: '♋', name: 'Cancer' },
    { glyph: '♌', name: 'Leo' },
    { glyph: '♍', name: 'Virgo' },
    { glyph: '♎', name: 'Libra' },
    { glyph: '♏', name: 'Scorpio' },
    { glyph: '♐', name: 'Sagittarius' },
    { glyph: '♑', name: 'Capricorn' },
    { glyph: '♒', name: 'Aquarius', highlight: true, color: '#44bbcc', label: 'THE COMING AEON' },
    { glyph: '♓', name: 'Pisces', highlight: true, color: '#e8c060', label: 'THE CURRENT AEON' },
];

/* Events Jung discusses — The Pisces Timeline (Scene 3)
   Curated to 12 primary events. Colors by Jungian archetype:
   Gold/Amber = Self/Christ  |  Crimson = Shadow eruption
   Violet = Unconscious/Gnostic  |  Teal = Aquarian/future
   White/Pale = Historical turning points */
const TIMELINE_EVENTS = [
    { year: -7, label: 'Star of Bethlehem', symbol: '☆', color: 0xf0d060, desc: 'Jupiter–Saturn conjunction in Pisces — the celestial sign inaugurating the new aeon', archetype: 'Self' },
    { year: 30, label: 'Crucifixion', symbol: '✝', color: 0xf0e8d0, desc: 'The Self projected onto a single figure — the supreme symbol of wholeness sacrificed', archetype: 'Self' },
    { year: 100, label: 'Revelation of St. John', symbol: '🔥', color: 0xcc4444, desc: 'The Apocalypse archetype — Christianity’s own shadow erupts in prophetic fire', archetype: 'Shadow' },
    { year: 325, label: 'Council of Nicæa', symbol: '⬡', color: 0xf0d060, desc: 'Christ declared God — evil officially excluded from the divine, deepening the split', archetype: 'Self' },
    { year: 1000, label: 'Enantiodromia', symbol: '◆', color: 0xcc3366, desc: 'The aeon’s midpoint — everything begins turning into its opposite. The shadow stirs.', archetype: 'Shadow' },
    { year: 1179, label: 'Joachim of Fiore', symbol: '△', color: 0x9966cc, desc: 'Prophecy of the Third Age — beyond Father and Son, the Holy Spirit as integration', archetype: 'Unconscious' },
    { year: 1484, label: 'Malleus Maleficarum', symbol: '▼', color: 0x882233, desc: 'Shadow projected onto "witches" — collective psychosis manifests as persecution', archetype: 'Shadow' },
    { year: 1555, label: 'Nostradamus\' Centuries', symbol: '✦', color: 0xff8c00, desc: 'Mining the collective unconscious — prophetic sensitivity to archetypal currents', archetype: 'Unconscious' },
    { year: 1789, label: 'French Revolution', symbol: '⚡', color: 0xcc4444, desc: '"An infernal power shall rise against the Church" — Nostradamus fulfilled', archetype: 'Shadow' },
    { year: 1914, label: 'World War I', symbol: '◼', color: 0x553333, desc: 'Eruption of the collective shadow — the European psyche fragments into mass violence', archetype: 'Shadow' },
    { year: 1945, label: 'Atomic Bomb', symbol: '☢', color: 0xeeeeee, desc: 'Ultimate enantiodromia — the light of reason becomes the fire of annihilation', archetype: 'Shadow' },
    { year: 2000, label: 'Aquarian Threshold', symbol: '♒', color: 0x44bbcc, desc: 'A new aeon approaches — will the psyche integrate its opposites, or split further?', archetype: 'Future' },
];

/* Aeon definitions for the spiral */
const AEONS = [
    { name: 'Aeon of Aries', startYear: -2000, endYear: 0, color: new THREE.Color(0x443366), desc: 'Age of the Ram · War, Empire, Sacrifice' },
    { name: 'Aeon of Pisces', startYear: 0, endYear: 2000, color: new THREE.Color(0xc8a040), desc: 'Age of the Fish · Christ, Faith, Shadow' },
    { name: 'Aeon of Aquarius', startYear: 2000, endYear: 4000, color: new THREE.Color(0x44bbcc), desc: 'Age of the Water-Bearer · Integration?' },
];

/* ═══════════════════ Helper: Glyph Sprite Factory ═══════════════════ */
function makeGlyphSprite(glyph, color, size = 0.6) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.font = '180px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(glyph, 128, 136);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(size, size, 1);
    return sprite;
}

/* ═══════════════════ Helper: Text Sprite ═══════════════════ */
function makeTextSprite(text, opts = {}) {
    const fontSize = opts.fontSize || 48;
    const color = opts.color || '#d4c8a8';
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px 'Instrument Serif', Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, 512, 68);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: opts.opacity || 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    const scale = opts.scale || 3;
    sprite.scale.set(scale, scale * (128 / 1024), 1);
    return sprite;
}

/* ═══════════════════ Main Visualization ═══════════════════ */
export default class ThreeProphecyViz extends BaseViz {
    constructor(c, o = {}) {
        super(c, Object.assign({ contextType: 'webgl' }, o));
        this._activeScene = 0; // 0=none, 1=great year, 2=spiral, 3=timeline
        this._sceneOpacities = { scene1: 1, scene2: 0, scene3: 0 };
    }

    async init() {
        /* ─── Renderer ─── */
        const R = this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: true, alpha: false
        });
        R.setPixelRatio(Math.min(devicePixelRatio, 2));
        R.setSize(this.width, this.height);
        R.setClearColor(0x000000);

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.004);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 500);
        this.camera.position.set(0, 0, 20);
        this.camera.lookAt(0, 0, 0);

        /* Mouse parallax */
        this.mouse = new THREE.Vector2();
        this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => {
            this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        };
        addEventListener('mousemove', this._onMM);

        /* ─── Starfield (shared across all scenes) ─── */
        this._buildStarfield();

        /* ─── Scene groups (toggled by scroll) ─── */
        this.scene1Group = new THREE.Group(); // Great Year
        this.scene2Group = new THREE.Group(); // Aeon Spiral
        this.scene3Group = new THREE.Group(); // Pisces Timeline
        this.scene.add(this.scene1Group);
        this.scene.add(this.scene2Group);
        this.scene.add(this.scene3Group);

        /* Build each scene */
        this._buildGreatYear();
        this._buildAeonSpiral();
        this._buildPiscesTimeline();

        /* Light */
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));
        const pointLight = new THREE.PointLight(AMBER, 0.3, 50);
        pointLight.position.set(0, 5, 10);
        this.scene.add(pointLight);

        /* Postprocessing */
        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 0.9, 0.5, 0.35
        );
        this.composer.addPass(this.bloom);

        /* CSS Overlay */
        this._buildOverlay();

        /* ─── Scroll Spacer ───
           The chapter page runs in "immersive mode" (no text sections),
           so we create our own scroll spacer to enable scrolling.
           The spacer sits behind the fixed viz canvas and gives the page
           enough height for the user to scroll through three scenes. */
        this._scrollSpacer = document.createElement('div');
        this._scrollSpacer.style.cssText = `
            position:relative;width:100%;height:800vh;
            pointer-events:none;z-index:-1;
        `;
        document.body.appendChild(this._scrollSpacer);

        /* ─── Trackpad / Mouse Wheel Scroll ───
           The #viz-layer is position:fixed covering the viewport,
           so trackpad two-finger gestures fire 'wheel' events on the
           fixed layer but never cause a native scroll. We intercept
           wheel events and programmatically scroll the page. */
        this._onWheelHandler = (e) => {
            e.preventDefault();
            window.scrollBy({ top: e.deltaY * 0.35, left: 0 });
        };
        // Listen on the entire document so trackpad events anywhere are captured
        document.addEventListener('wheel', this._onWheelHandler, { passive: false });

        /* Wire scroll → scrollState */
        this._onScrollHandler = () => {
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
            this.scrollState = {
                globalProgress: progress,
                sectionProgress: progress,
                activeSection: progress < SCENE2_START ? 0 : progress < SCENE3_START ? 1 : 2,
                scrollY: window.scrollY
            };
        };
        window.addEventListener('scroll', this._onScrollHandler, { passive: true });
        this._onScrollHandler(); // Initialize

        /* Initial state */
        this.scene2Group.visible = false;
        this.scene3Group.visible = false;
    }

    /* ═══════════ Starfield (shared) ═══════════ */
    _buildStarfield() {
        const N = 1200;
        const pos = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 120;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 120;
            pos[i * 3 + 2] = -30 + (Math.random() - 0.5) * 60;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.starfield = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x8888aa, size: 0.04, transparent: true, opacity: 0.4,
            sizeAttenuation: true, depthWrite: false
        }));
        this.scene.add(this.starfield);
    }

    /* ═══════════════════════════════════════════════════
       SCENE 1 — The Great Year (zodiac wheel, contextual)
       ═══════════════════════════════════════════════════ */
    _buildGreatYear() {
        const g = this.scene1Group;

        /* Outer ring */
        const outerR = 5;
        this._addRing(g, outerR, GOLD, 0.15);
        this._addRing(g, 4.2, COOL_BLUE, 0.06);
        this._addRing(g, 3.2, GOLD, 0.04);

        /* Zodiac glyph sprites */
        for (let i = 0; i < 12; i++) {
            const z = ZODIAC[i];
            const a = (i / 12) * Math.PI * 2;
            const glyphColor = z.highlight ? z.color : 'rgba(180,170,150,0.3)';
            const glyphSize = z.highlight ? 0.7 : 0.45;
            const sprite = makeGlyphSprite(z.glyph, glyphColor, glyphSize);
            sprite.position.set(
                Math.cos(a) * (outerR + 0.7),
                Math.sin(a) * (outerR + 0.7),
                0
            );
            g.add(sprite);

            /* Highlight halos */
            if (z.highlight) {
                const halo = new THREE.Mesh(
                    new THREE.RingGeometry(0.3, 0.45, 16),
                    new THREE.MeshBasicMaterial({
                        color: new THREE.Color(z.color), transparent: true, opacity: 0.1,
                        blending: THREE.AdditiveBlending, side: THREE.DoubleSide
                    })
                );
                halo.position.copy(sprite.position);
                g.add(halo);

                /* Sign label */
                const lbl = makeTextSprite(z.label, {
                    fontSize: 20, color: z.color, opacity: 0.4, scale: 2
                });
                lbl.position.set(
                    Math.cos(a) * (outerR + 1.8),
                    Math.sin(a) * (outerR + 1.8),
                    0
                );
                g.add(lbl);
            }
        }

        /* 12 subtle spokes */
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const pts = [
                new THREE.Vector3(Math.cos(a) * 2.5, Math.sin(a) * 2.5, 0),
                new THREE.Vector3(Math.cos(a) * outerR, Math.sin(a) * outerR, 0)
            ];
            const spoke = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(pts),
                new THREE.LineBasicMaterial({
                    color: GOLD, transparent: true, opacity: 0.03,
                    blending: THREE.AdditiveBlending
                })
            );
            g.add(spoke);
        }

        /* Center label */
        const centerLbl = makeTextSprite('THE GREAT YEAR', {
            fontSize: 22, color: PARCHMENT, opacity: 0.3, scale: 2.5
        });
        centerLbl.position.set(0, 0, 0.1);
        g.add(centerLbl);

        const subLbl = makeTextSprite('~26,000 YEARS', {
            fontSize: 16, color: 'rgba(200,160,64,0.3)', opacity: 0.25, scale: 2
        });
        subLbl.position.set(0, -0.6, 0.1);
        g.add(subLbl);

        /* Slight tilt for depth */
        g.rotation.x = 0.15;
    }

    /* ═══════════════════════════════════════════════════
       SCENE 2 — The Aeon Spiral (vertical helix)
       ═══════════════════════════════════════════════════ */
    _buildAeonSpiral() {
        const g = this.scene2Group;

        /* Helix parameters — compact for readability */
        const helixRadius = 3;
        const loopHeight = 5;   // vertical distance per loop (one aeon)
        const totalLoops = 2.5; // Aries, Pisces, beginning of Aquarius
        const totalHeight = totalLoops * loopHeight;
        const segments = 300;

        /* Generate helix path points */
        const helixPoints = [];
        const helixColors = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * totalLoops * Math.PI * 2;
            const y = -totalHeight / 2 + t * totalHeight;
            const x = Math.cos(angle) * helixRadius;
            const z = Math.sin(angle) * helixRadius;
            helixPoints.push(new THREE.Vector3(x, y, z));

            /* Color: map t to aeon */
            const year = -2000 + t * 6000; // -2000 to 4000
            let c;
            if (year < 0) {
                // Previous aeon: deep violet fading in
                const localT = (year + 2000) / 2000;
                c = new THREE.Color(0x221133).lerp(new THREE.Color(0x443366), localT);
            } else if (year < 2000) {
                // Pisces: gold, brightest in the middle
                const localT = year / 2000;
                if (localT < 0.5) {
                    c = new THREE.Color(0x886622).lerp(new THREE.Color(0xf0c040), localT * 2);
                } else {
                    c = new THREE.Color(0xf0c040).lerp(new THREE.Color(0xcc3366), (localT - 0.5) * 2);
                }
            } else {
                // Aquarius: teal fading out
                const localT = Math.min(1, (year - 2000) / 2000);
                c = new THREE.Color(0x44bbcc).lerp(new THREE.Color(0x224455), localT);
            }
            helixColors.push(c.r, c.g, c.b);
        }

        /* Create tube geometry along the helix path */
        const helixCurve = new THREE.CatmullRomCurve3(helixPoints);
        const tubeGeo = new THREE.TubeGeometry(helixCurve, segments, 0.08, 8, false);

        /* Vertex colors for the tube */
        const tubeColors = new Float32Array(tubeGeo.attributes.position.count * 3);
        const tubePositions = tubeGeo.attributes.position;
        for (let i = 0; i < tubePositions.count; i++) {
            const y = tubePositions.getY(i);
            const t = (y + totalHeight / 2) / totalHeight;
            const ci = Math.min(segments, Math.max(0, Math.floor(t * segments)));
            tubeColors[i * 3] = helixColors[ci * 3];
            tubeColors[i * 3 + 1] = helixColors[ci * 3 + 1];
            tubeColors[i * 3 + 2] = helixColors[ci * 3 + 2];
        }
        tubeGeo.setAttribute('color', new THREE.BufferAttribute(tubeColors, 3));

        this.spiralTube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({
            vertexColors: true, transparent: true, opacity: 0.8,
            blending: THREE.AdditiveBlending
        }));
        g.add(this.spiralTube);

        /* Glow particles along the helix */
        const glowN = 200;
        const glowPos = new Float32Array(glowN * 3);
        const glowCol = new Float32Array(glowN * 3);
        for (let i = 0; i < glowN; i++) {
            const t = i / glowN;
            const idx = Math.floor(t * segments);
            const pt = helixPoints[Math.min(idx, helixPoints.length - 1)];
            glowPos[i * 3] = pt.x + (Math.random() - 0.5) * 0.4;
            glowPos[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.4;
            glowPos[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.4;
            glowCol[i * 3] = helixColors[idx * 3] || 0.5;
            glowCol[i * 3 + 1] = helixColors[idx * 3 + 1] || 0.4;
            glowCol[i * 3 + 2] = helixColors[idx * 3 + 2] || 0.3;
        }
        const glowGeo = new THREE.BufferGeometry();
        glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
        glowGeo.setAttribute('color', new THREE.BufferAttribute(glowCol, 3));
        this.spiralGlow = new THREE.Points(glowGeo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.06, transparent: true, opacity: 0.3,
            blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
        }));
        g.add(this.spiralGlow);

        /* Aeon boundary markers — meaningful Jungian labels */
        const markers = [
            { year: -2000, label: 'END OF ARIES', sub: 'Age of the Ram yields', color: 0x443366 },
            { year: 0, label: 'BIRTH OF CHRIST', sub: 'The Pisces aeon begins', color: 0xf0d060 },
            { year: 1000, label: 'ENANTIODROMIA', sub: 'The turning point — shadow rises', color: 0xcc3366 },
            { year: 2000, label: 'AQUARIAN THRESHOLD', sub: 'A new aeon approaches', color: 0x44bbcc },
        ];

        this._spiralMarkers = [];
        for (const m of markers) {
            const t = (m.year + 2000) / 6000;
            const idx = Math.min(helixPoints.length - 1, Math.floor(t * segments));
            const pos = helixPoints[idx];

            /* Marker sphere */
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 12, 12),
                new THREE.MeshBasicMaterial({
                    color: m.color, transparent: true, opacity: 0.7,
                    blending: THREE.AdditiveBlending
                })
            );
            sphere.position.copy(pos);
            g.add(sphere);

            /* Halo ring */
            const halo = new THREE.Mesh(
                new THREE.RingGeometry(0.3, 0.45, 16),
                new THREE.MeshBasicMaterial({
                    color: m.color, transparent: true, opacity: 0.15,
                    blending: THREE.AdditiveBlending, side: THREE.DoubleSide
                })
            );
            halo.position.copy(pos);
            halo.lookAt(this.camera.position);
            g.add(halo);

            /* Label sprite — larger and clearer */
            const lbl = makeTextSprite(m.label, {
                fontSize: 42, color: `#${new THREE.Color(m.color).getHexString()}`,
                opacity: 0.7, scale: 4
            });
            lbl.position.set(pos.x + 2.5, pos.y + 0.6, pos.z);
            g.add(lbl);

            /* Sub-label */
            if (m.sub) {
                const subLbl = makeTextSprite(m.sub, {
                    fontSize: 32, color: `#${new THREE.Color(m.color).getHexString()}`,
                    opacity: 0.35, scale: 3.5
                });
                subLbl.position.set(pos.x + 2.5, pos.y + 0.1, pos.z);
                g.add(subLbl);
            }

            /* Connecting line from sphere to label */
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                pos.clone(),
                new THREE.Vector3(pos.x + 1.8, pos.y + 0.4, pos.z)
            ]);
            const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
                color: m.color, transparent: true, opacity: 0.15,
                blending: THREE.AdditiveBlending
            }));
            g.add(line);

            this._spiralMarkers.push({ sphere, halo, data: m });
        }

        /* Aeon name labels with descriptions along the side */
        for (const aeon of AEONS) {
            const midYear = (aeon.startYear + aeon.endYear) / 2;
            const t = (midYear + 2000) / 6000;
            const idx = Math.min(helixPoints.length - 1, Math.floor(t * segments));
            const pos = helixPoints[idx];

            const lbl = makeTextSprite(aeon.name.toUpperCase(), {
                fontSize: 36, color: `#${aeon.color.getHexString()}`,
                opacity: 0.4, scale: 4.5
            });
            lbl.position.set(-helixRadius - 3, pos.y + 0.3, 0);
            g.add(lbl);

            /* Descriptive subtitle */
            const descLbl = makeTextSprite(aeon.desc, {
                fontSize: 28, color: `#${aeon.color.getHexString()}`,
                opacity: 0.2, scale: 3.5
            });
            descLbl.position.set(-helixRadius - 3, pos.y - 0.2, 0);
            g.add(descLbl);
        }

        /* Store helix path for camera animation */
        this._helixPoints = helixPoints;
        this._helixTotalHeight = totalHeight;
    }

    /* ═══════════════════════════════════════════════════
       SCENE 3 — The Pisces Timeline (0–2000 AD)
       ═══════════════════════════════════════════════════ */
    _buildPiscesTimeline() {
        const g = this.scene3Group;

        /* Timeline geometry: a gently curved arc from left to right */
        const arcRadius = 25;
        const arcSpan = Math.PI * 0.6; // 108 degrees
        const arcStart = Math.PI - arcSpan / 2;
        const timelineSegments = 200;

        /* Main arc line with enantiodromia gradient */
        const arcPositions = new Float32Array(timelineSegments * 3);
        const arcColors = new Float32Array(timelineSegments * 3);

        const colorStart = new THREE.Color(0xf0e8d0);  // gold-white (Christ)
        const colorMid = new THREE.Color(0xcc3366);   // crimson (enantiodromia)
        const colorEnd = new THREE.Color(0x44bbcc);   // teal (Aquarius)

        for (let i = 0; i < timelineSegments; i++) {
            const t = i / (timelineSegments - 1);
            const a = arcStart + t * arcSpan;
            arcPositions[i * 3] = Math.cos(a) * arcRadius;
            arcPositions[i * 3 + 1] = Math.sin(a) * arcRadius - arcRadius + 2;
            arcPositions[i * 3 + 2] = 0;

            /* Gradient: gold → crimson → teal */
            let c;
            if (t < 0.5) {
                c = colorStart.clone().lerp(colorMid, t * 2);
            } else {
                c = colorMid.clone().lerp(colorEnd, (t - 0.5) * 2);
            }
            arcColors[i * 3] = c.r;
            arcColors[i * 3 + 1] = c.g;
            arcColors[i * 3 + 2] = c.b;
        }

        const arcGeo = new THREE.BufferGeometry();
        arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));
        arcGeo.setAttribute('color', new THREE.BufferAttribute(arcColors, 3));

        this.timelineArc = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, linewidth: 2
        }));
        g.add(this.timelineArc);

        /* Thicker glow version behind */
        const glowArc = new THREE.Line(arcGeo.clone(), new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, opacity: 0.1,
            blending: THREE.AdditiveBlending, linewidth: 4
        }));
        g.add(glowArc);

        /* Helper: map year to arc position */
        this._yearToArcPos = (year) => {
            const t = Math.max(0, Math.min(1, (year + 7) / 2007)); // -7 to 2000
            const a = arcStart + t * arcSpan;
            return new THREE.Vector3(
                Math.cos(a) * arcRadius,
                Math.sin(a) * arcRadius - arcRadius + 2,
                0
            );
        };

        /* Key events get larger markers */
        const KEY_EVENTS = new Set([-7, 30, 1000, 1555, 1945, 2000]);

        /* Event markers — ENLARGED for visibility */
        this._timelineMarkerData = [];
        for (let evtIdx = 0; evtIdx < TIMELINE_EVENTS.length; evtIdx++) {
            const evt = TIMELINE_EVENTS[evtIdx];
            const pos = this._yearToArcPos(evt.year);
            const isKey = KEY_EVENTS.has(evt.year);

            /* Marker node — much larger */
            const markerRadius = isKey ? 0.35 : 0.25;
            const node = new THREE.Mesh(
                new THREE.SphereGeometry(markerRadius, 14, 14),
                new THREE.MeshBasicMaterial({
                    color: evt.color, transparent: true, opacity: 0.7,
                    blending: THREE.AdditiveBlending
                })
            );
            node.position.copy(pos);
            g.add(node);

            /* Outer halo — enlarged */
            const haloInner = markerRadius + 0.05;
            const haloOuter = markerRadius + 0.2;
            const halo = new THREE.Mesh(
                new THREE.RingGeometry(haloInner, haloOuter, 16),
                new THREE.MeshBasicMaterial({
                    color: evt.color, transparent: true, opacity: 0.15,
                    blending: THREE.AdditiveBlending, side: THREE.DoubleSide
                })
            );
            halo.position.copy(pos);
            halo.position.z = 0.05;
            g.add(halo);

            /* Symbol sprite — larger */
            const symbolSize = isKey ? 0.7 : 0.5;
            const symbolSprite = makeGlyphSprite(evt.symbol, `#${new THREE.Color(evt.color).getHexString()}`, symbolSize);
            symbolSprite.position.set(pos.x, pos.y + (isKey ? 0.7 : 0.5), 0.1);
            g.add(symbolSprite);

            /* Radial tick mark — perpendicular to arc, longer for key events */
            const t = Math.max(0, Math.min(1, (evt.year + 7) / 2007));
            const a = arcStart + t * arcSpan;
            const normal = new THREE.Vector3(Math.cos(a), Math.sin(a), 0).normalize();
            const tickLen = isKey ? 0.6 : 0.35;
            const tickStart = pos.clone().add(normal.clone().multiplyScalar(-tickLen));
            const tickEnd = pos.clone().add(normal.clone().multiplyScalar(tickLen));
            const tick = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([tickStart, tickEnd]),
                new THREE.LineBasicMaterial({
                    color: evt.color, transparent: true, opacity: isKey ? 0.35 : 0.2,
                    blending: THREE.AdditiveBlending
                })
            );
            g.add(tick);

            /* WebGL text label — year badge + event name
               Alternate above/below the arc to prevent overlap */
            const labelSide = (evtIdx % 2 === 0) ? 1 : -1;
            const labelOffset = labelSide * (isKey ? 2.0 : 1.5);
            const labelPos = pos.clone().add(normal.clone().multiplyScalar(labelOffset));

            /* Year label */
            const yearStr = evt.year > 0 ? `${evt.year} AD` : `${Math.abs(evt.year)} BC`;
            const yearLbl = makeTextSprite(yearStr, {
                fontSize: isKey ? 38 : 30,
                color: `#${new THREE.Color(evt.color).getHexString()}`,
                opacity: isKey ? 0.7 : 0.5,
                scale: isKey ? 3.5 : 2.8
            });
            yearLbl.position.copy(labelPos);
            g.add(yearLbl);

            /* Event name label */
            const nameLbl = makeTextSprite(evt.label.toUpperCase(), {
                fontSize: isKey ? 32 : 26,
                color: `#${new THREE.Color(evt.color).getHexString()}`,
                opacity: isKey ? 0.55 : 0.35,
                scale: isKey ? 4.0 : 3.2
            });
            nameLbl.position.set(
                labelPos.x,
                labelPos.y + labelSide * (isKey ? 0.5 : 0.35),
                labelPos.z
            );
            g.add(nameLbl);

            /* Connecting line from marker to label */
            const connLine = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([pos.clone(), labelPos.clone()]),
                new THREE.LineBasicMaterial({
                    color: evt.color, transparent: true, opacity: 0.12,
                    blending: THREE.AdditiveBlending
                })
            );
            g.add(connLine);

            this._timelineMarkerData.push({
                node, halo, symbolSprite, yearLbl, nameLbl, connLine,
                evt, pos, isKey,
                arcAngle: a, normalDir: normal
            });
        }

        /* Year pointer (animated by scroll) */
        const pointerGeo = new THREE.BufferGeometry();
        const pVerts = new Float32Array([
            0, 0.4, 0,
            -0.1, 0, 0,
            0.1, 0, 0,
        ]);
        pointerGeo.setAttribute('position', new THREE.BufferAttribute(pVerts, 3));
        pointerGeo.setIndex([0, 1, 2]);
        this.yearPointer = new THREE.Mesh(pointerGeo, new THREE.MeshBasicMaterial({
            color: AMBER, transparent: true, opacity: 0.9,
            blending: THREE.AdditiveBlending, side: THREE.DoubleSide
        }));
        g.add(this.yearPointer);

        /* Enantiodromia midpoint marker — larger octahedron */
        const enantiPos = this._yearToArcPos(1000);
        const enantiMarker = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.45, 0),
            new THREE.MeshBasicMaterial({
                color: CRIMSON, transparent: true, opacity: 0.5,
                blending: THREE.AdditiveBlending
            })
        );
        enantiMarker.position.copy(enantiPos);
        enantiMarker.position.z = 0.1;
        g.add(enantiMarker);
        this._enantiMarker = enantiMarker;

        /* Store arc parameters */
        this._arcStart = arcStart;
        this._arcSpan = arcSpan;
        this._arcRadius = arcRadius;
    }

    /* ═══════════ Ring helper ═══════════ */
    _addRing(parent, radius, color, opacity) {
        const pts = [];
        for (let j = 0; j <= 128; j++) {
            const a = (j / 128) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
        }
        const ring = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({
                color, transparent: true, opacity,
                blending: THREE.AdditiveBlending
            })
        );
        parent.add(ring);
        return ring;
    }

    /* ═══════════ CSS Overlay ═══════════ */
    _buildOverlay() {
        const ol = this._overlay = document.createElement('div');
        ol.className = 'ch7-overlay';
        ol.style.cssText = `
            position:absolute;inset:0;pointer-events:none;overflow:hidden;
            font-family:'Instrument Serif',Georgia,'Times New Roman',serif;
        `;
        this.container.appendChild(ol);

        /* ─── CSS keyframes & styles ─── */
        const style = document.createElement('style');
        style.textContent = `
            .ch7-overlay * { box-sizing: border-box; }
            @keyframes ch7-chevron-pulse {
                0%, 100% { opacity: 0.25; transform: translateX(-50%) translateY(0); }
                50% { opacity: 0.5; transform: translateX(-50%) translateY(6px); }
            }
            @keyframes ch7-dot-glow {
                0%, 100% { box-shadow: 0 0 3px rgba(200,160,64,0.3); }
                50% { box-shadow: 0 0 8px rgba(255,140,0,0.6); }
            }
            .ch7-scene-dot {
                width: 7px; height: 7px; border-radius: 50%;
                background: rgba(200,160,64,0.15); border: 1px solid rgba(200,160,64,0.2);
                transition: all 0.6s ease; margin: 8px 0;
            }
            .ch7-scene-dot.active {
                background: rgba(255,140,0,0.5); border-color: rgba(255,140,0,0.4);
                animation: ch7-dot-glow 2s ease infinite;
            }
            .ch7-annotation {
                font-family: 'Instrument Serif', Georgia, serif;
                line-height: 1.6;
            }
            .ch7-legend-item {
                display: flex; align-items: center; gap: 8px;
                font-size: clamp(0.65rem,0.9vw,0.8rem);
                color: rgba(200,190,170,0.55); margin: 6px 0;
            }
            .ch7-legend-dot {
                width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
            }
            .ch7-era-label {
                font-size: clamp(0.55rem,0.75vw,0.65rem);
                letter-spacing: 0.15em; text-transform: uppercase;
                color: rgba(200,160,64,0.3); white-space: nowrap;
            }
        `;
        ol.appendChild(style);

        /* ─── Scroll indicator + chevron ─── */
        this._scrollIndicator = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;bottom:6%;left:50%;transform:translateX(-50%);
                text-align:center;
                opacity:0;transition:opacity 1.5s ease;
            ">
                <div style="
                    font-size:clamp(0.65rem,0.9vw,0.75rem);letter-spacing:0.25em;
                    text-transform:uppercase;color:rgba(200,190,170,0.4);
                    margin-bottom:8px;
                ">Scroll to explore</div>
                <div style="
                    font-size:1.4rem;color:rgba(200,160,64,0.4);
                    animation: ch7-chevron-pulse 2.5s ease infinite;
                    position:relative;left:50%;transform:translateX(-50%);
                ">⌄</div>
            </div>
        `);

        /* ─── Scene progress dots ─── */
        this._sceneDots = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;right:3%;top:50%;transform:translateY(-50%);
                display:flex;flex-direction:column;align-items:center;
                opacity:0;transition:opacity 1s ease;
            ">
                <div class="ch7-scene-dot active" data-scene="1"></div>
                <div class="ch7-scene-dot" data-scene="2"></div>
                <div class="ch7-scene-dot" data-scene="3"></div>
            </div>
        `);
        this._dotEls = this._sceneDots.querySelectorAll('.ch7-scene-dot');

        /* ═══════════════════════════════════════
           SCENE 1 — The Great Year overlays
           ═══════════════════════════════════════ */

        /* Title */
        this._scene1Title = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;top:6%;left:50%;transform:translateX(-50%);
                font-size:clamp(0.85rem,1.4vw,1.1rem);letter-spacing:0.3em;
                text-transform:uppercase;color:${PARCHMENT};
                opacity:0;transition:opacity 1.5s ease;
            ">VII · THE PROPHECIES OF NOSTRADAMUS</div>
        `);

        /* Central thesis */
        this._scene1Thesis = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);
                text-align:center;max-width:50%;
                opacity:0;transition:opacity 2s ease;
            ">
                <div style="
                    font-size:clamp(0.85rem,1.5vw,1.15rem);color:rgba(232,192,96,0.6);
                    font-style:italic;line-height:1.8;
                ">The precession of the equinoxes — a cosmic clock<br>
                    marking the rise and fall of aeons.</div>
            </div>
        `);

        /* Precession explanation (bottom-left annotation) */
        this._scene1Explain = this._makeOverlayEl(ol, `
            <div class="ch7-annotation" style="
                position:absolute;bottom:18%;left:5%;max-width:34%;
                opacity:0;transition:opacity 2s ease 0.5s;
            ">
                <div style="
                    border-left:2px solid rgba(200,160,64,0.2);padding-left:14px;
                ">
                    <div style="
                        font-size:clamp(0.7rem,1vw,0.85rem);color:rgba(200,190,170,0.5);
                        line-height:1.7;
                    ">The spring equinox shifts through each zodiac sign over ~2,160 years.
                    Each period, or <em style="color:rgba(232,192,96,0.6)">aeon</em>, is dominated
                    by the archetype of its constellation. We are now at the
                    end of Pisces, approaching Aquarius.</div>
                </div>
            </div>
        `);

        /* Pisces → Aquarius direction hint (bottom-right) */
        this._scene1Direction = this._makeOverlayEl(ol, `
            <div class="ch7-annotation" style="
                position:absolute;bottom:18%;right:5%;max-width:28%;text-align:right;
                opacity:0;transition:opacity 2s ease 0.8s;
            ">
                <div style="
                    border-right:2px solid rgba(68,187,204,0.2);padding-right:14px;
                ">
                    <div style="
                        font-size:clamp(0.7rem,1vw,0.8rem);color:rgba(68,187,204,0.45);
                        letter-spacing:0.1em;
                    ">♓ PISCES → ♒ AQUARIUS</div>
                    <div style="
                        font-size:clamp(0.6rem,0.85vw,0.72rem);color:rgba(200,190,170,0.35);
                        margin-top:4px;line-height:1.5;
                    ">The precession moves retrograde<br>through the zodiac wheel ↻</div>
                </div>
            </div>
        `);

        /* ═══════════════════════════════════════
           SCENE 2 — Spiral of the Aeons overlays
           ═══════════════════════════════════════ */

        /* Title */
        this._scene2Title = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;top:5%;left:50%;transform:translateX(-50%);
                font-size:clamp(0.55rem,1vw,0.85rem);letter-spacing:0.25em;
                text-transform:uppercase;color:rgba(200,160,64,0.5);
                opacity:0;transition:opacity 1.5s ease;
            ">THE SPIRAL OF THE AEONS</div>
        `);

        /* Quote */
        this._scene2Thesis = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;top:12%;right:6%;max-width:30%;text-align:right;
                opacity:0;transition:opacity 2s ease;
            ">
                <div style="
                    border-right:2px solid rgba(200,160,64,0.2);padding-right:14px;
                    font-size:clamp(0.7rem,1.1vw,0.9rem);color:rgba(200,190,170,0.5);
                    font-style:italic;line-height:1.7;
                ">"When anything reaches its extreme,<br>it turns into its contrary."</div>
            </div>
        `);

        /* Color legend (bottom-left) */
        this._scene2Legend = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;bottom:12%;left:5%;
                opacity:0;transition:opacity 2s ease 0.3s;
            ">
                <div style="
                    font-size:clamp(0.6rem,0.8vw,0.7rem);letter-spacing:0.2em;
                    text-transform:uppercase;color:rgba(200,160,64,0.35);
                    margin-bottom:10px;
                ">AEON COLORS</div>
                <div class="ch7-legend-item">
                    <div class="ch7-legend-dot" style="background:rgba(102,51,170,0.7)"></div>
                    <span>Aeon of Aries — Age of the Ram (2000 BC – 0 AD)</span>
                </div>
                <div class="ch7-legend-item">
                    <div class="ch7-legend-dot" style="background:rgba(240,192,64,0.7)"></div>
                    <span>Aeon of Pisces — Age of the Fish (0 – 2000 AD)</span>
                </div>
                <div class="ch7-legend-item">
                    <div class="ch7-legend-dot" style="background:rgba(68,187,204,0.7)"></div>
                    <span>Aeon of Aquarius — Age of the Water-Bearer (2000+ AD)</span>
                </div>
            </div>
        `);

        /* Enantiodromia definition (appears mid-spiral) */
        this._scene2Enantio = this._makeOverlayEl(ol, `
            <div class="ch7-annotation" style="
                position:absolute;bottom:10%;right:5%;max-width:32%;text-align:right;
                opacity:0;transition:opacity 2s ease;
            ">
                <div style="
                    border-right:2px solid rgba(204,51,102,0.25);padding-right:14px;
                ">
                    <div style="
                        font-size:clamp(0.65rem,0.9vw,0.75rem);letter-spacing:0.15em;
                        text-transform:uppercase;color:rgba(204,51,102,0.5);
                        margin-bottom:6px;
                    ">ENANTIODROMIA</div>
                    <div style="
                        font-size:clamp(0.65rem,0.9vw,0.75rem);color:rgba(200,190,170,0.45);
                        line-height:1.6;font-style:italic;
                    ">The tendency of things to flip into their opposite
                    at the extreme. At the aeon's midpoint (~1000 AD),
                    the shadow side of Christianity begins to emerge.</div>
                </div>
            </div>
        `);

        /* Time direction (left edge) */
        this._scene2TimeArrow = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;top:50%;left:3%;transform:translateY(-50%);
                text-align:center;
                opacity:0;transition:opacity 1.5s ease;
            ">
                <div style="
                    writing-mode:vertical-lr;text-orientation:mixed;
                    font-size:clamp(0.6rem,0.8vw,0.7rem);letter-spacing:0.3em;
                    text-transform:uppercase;color:rgba(200,160,64,0.3);
                ">TIME ↑</div>
            </div>
        `);

        /* ═══════════════════════════════════════
           SCENE 2→3 Bridge Annotation
           ═══════════════════════════════════════ */
        this._bridgeAnnotation = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                text-align:center;max-width:60%;
                opacity:0;transition:opacity 1.5s ease;
            ">
                <div style="
                    font-size:clamp(0.9rem,1.4vw,1.1rem);letter-spacing:0.3em;
                    text-transform:uppercase;color:rgba(200,160,64,0.6);
                    margin-bottom:12px;
                ">ENTERING THE AEON OF PISCES</div>
                <div style="
                    font-size:clamp(0.7rem,1vw,0.85rem);color:rgba(200,190,170,0.4);
                    font-style:italic;line-height:1.7;
                ">Two thousand years of Christ and shadow —<br>
                from the star over Bethlehem to the atomic fire.</div>
            </div>
        `);

        /* ═══════════════════════════════════════
           SCENE 3 — Pisces Timeline overlays
           ═══════════════════════════════════════ */

        /* Title */
        this._scene3Title = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;top:4%;left:50%;transform:translateX(-50%);
                font-size:clamp(0.8rem,1.2vw,1rem);letter-spacing:0.25em;
                text-transform:uppercase;color:rgba(200,160,64,0.6);
                opacity:0;transition:opacity 1.5s ease;
            ">THE AEON OF PISCES · 0 – 2000 AD</div>
        `);

        /* Framing quote */
        this._scene3Quote = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;top:11%;left:5%;max-width:35%;
                opacity:0;transition:opacity 2s ease;
            ">
                <div style="
                    border-left:2px solid rgba(200,160,64,0.25);padding-left:14px;
                    font-size:clamp(0.8rem,1.15vw,0.95rem);color:rgba(200,190,170,0.55);
                    font-style:italic;line-height:1.7;
                ">Four hundred years before Jung,<br>Nostradamus sensed the psyche's<br>approaching reversal.</div>
            </div>
        `);

        /* Dual-fish annotation (top-right, appears during Scene 3) */
        this._scene3DualFish = this._makeOverlayEl(ol, `
            <div class="ch7-annotation" style="
                position:absolute;top:10%;right:5%;max-width:30%;text-align:right;
                opacity:0;transition:opacity 2s ease 0.3s;
            ">
                <div style="
                    border-right:2px solid rgba(200,160,64,0.2);padding-right:14px;
                ">
                    <div style="
                        font-size:clamp(0.65rem,0.9vw,0.75rem);letter-spacing:0.15em;
                        text-transform:uppercase;color:rgba(232,192,96,0.45);
                        margin-bottom:8px;
                    ">THE TWO FISH OF PISCES</div>
                    <div style="
                        font-size:clamp(0.65rem,0.9vw,0.75rem);color:rgba(200,190,170,0.4);
                        line-height:1.6;
                    ">
                        <span style="color:rgba(240,232,208,0.5)">First Fish</span> (0–1000 AD) — Christ<br>
                        <span style="color:rgba(204,51,102,0.5)">Second Fish</span> (1000–2000 AD) — Antichrist<br>
                        <span style="font-style:italic;margin-top:6px;display:inline-block">
                        They swim in opposite directions,<br>
                        mirroring the psyche's split.</span>
                    </div>
                </div>
            </div>
        `);

        /* Era labels (bottom bar, Scene 3) */
        this._scene3Eras = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;bottom:8%;left:10%;right:10%;
                display:flex;justify-content:space-between;align-items:flex-end;
                opacity:0;transition:opacity 1.5s ease;
            ">
                <div class="ch7-era-label" style="text-align:left">EARLY<br>CHURCH</div>
                <div class="ch7-era-label">AGE OF<br>FAITH</div>
                <div class="ch7-era-label" style="color:rgba(204,51,102,0.35)">ENANTIODROMIA<br>↕</div>
                <div class="ch7-era-label">AGE OF<br>REASON</div>
                <div class="ch7-era-label" style="text-align:right;color:rgba(68,187,204,0.3)">ANTICHRIST<br>ERA</div>
            </div>
        `);

        /* Nostradamus extended annotation (appears near 1555 AD) */
        this._scene3Nostradamus = this._makeOverlayEl(ol, `
            <div class="ch7-annotation" style="
                position:absolute;bottom:28%;left:5%;max-width:38%;
                opacity:0;transition:opacity 1.5s ease;
            ">
                <div style="
                    border-left:2px solid rgba(255,140,0,0.25);padding-left:14px;
                ">
                    <div style="
                        font-size:clamp(0.65rem,0.9vw,0.75rem);letter-spacing:0.15em;
                        text-transform:uppercase;color:rgba(255,140,0,0.5);
                        margin-bottom:6px;
                    ">NOSTRADAMUS · 1555</div>
                    <div style="
                        font-size:clamp(0.65rem,0.9vw,0.75rem);color:rgba(200,190,170,0.4);
                        line-height:1.6;font-style:italic;
                    ">Jung argues that Nostradamus perceived the approaching
                    enantiodromia through the collective unconscious — his
                    "prophecy" was a psychological sensitivity to archetypal
                    currents already stirring in the European psyche.</div>
                </div>
            </div>
        `);

        /* Year clock (Scene 3) */
        this._yearClockEl = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;bottom:16%;right:6%;text-align:right;
                opacity:0;transition:opacity 1.5s ease;
            ">
                <div class="ch7-year-num" style="
                    font-size:clamp(2.5rem,6vw,4rem);color:rgba(255,140,0,0.35);
                    font-variant-numeric:tabular-nums;letter-spacing:0.04em;
                    line-height:1;font-family:'Instrument Serif',Georgia,serif;
                ">0</div>
                <div style="
                    font-size:clamp(0.6rem,0.8vw,0.7rem);letter-spacing:0.25em;
                    color:rgba(200,160,64,0.25);text-transform:uppercase;margin-top:6px;
                ">ANNO DOMINI</div>
            </div>
        `);
        this._yearNumEl = this._yearClockEl.querySelector('.ch7-year-num');

        /* Event tooltip (Scene 3) */
        this._eventTooltip = this._makeOverlayEl(ol, `
            <div class="ch7-event-tooltip" style="
                position:absolute;left:50%;bottom:22%;transform:translateX(-50%);
                max-width:50%;text-align:center;
                opacity:0;transition:opacity 0.8s ease;
            ">
                <div class="ch7-evt-label" style="
                    font-size:clamp(0.75rem,1.1vw,0.9rem);letter-spacing:0.15em;
                    text-transform:uppercase;color:rgba(232,192,96,0.7);
                    margin-bottom:8px;
                "></div>
                <div class="ch7-evt-desc" style="
                    font-size:clamp(0.7rem,1vw,0.85rem);color:rgba(200,190,170,0.5);
                    font-style:italic;line-height:1.6;
                "></div>
            </div>
        `);

        /* Bottom timeline label (Scene 3) */
        this._scene3Bottom = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;bottom:2.5%;left:50%;transform:translateX(-50%);
                font-size:clamp(0.55rem,0.75vw,0.65rem);letter-spacing:0.2em;
                color:rgba(200,160,64,0.2);text-transform:uppercase;
                opacity:0;transition:opacity 1.5s ease;
            ">CHRIST → ENANTIODROMIA → ANTICHRIST · THE TWO FISH SWIM IN OPPOSITE DIRECTIONS</div>
        `);

        /* Enantiodromia gradient bar (Scene 3) */
        this._enantiBar = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;bottom:6.5%;left:10%;right:10%;height:2px;
                background:linear-gradient(to right,
                    rgba(240,232,208,0.2),
                    rgba(204,51,102,0.3) 50%,
                    rgba(68,187,204,0.2));
                opacity:0;transition:opacity 1.5s ease;
            "></div>
        `);

        /* First Fish / Second Fish divider midpoint */
        this._scene3FishDivider = this._makeOverlayEl(ol, `
            <div style="
                position:absolute;bottom:4.5%;left:50%;transform:translateX(-50%);
                text-align:center;
                opacity:0;transition:opacity 1.5s ease;
            ">
                <div style="
                    width:1px;height:18px;background:rgba(204,51,102,0.25);
                    margin:0 auto 6px;
                "></div>
                <div style="
                    display:flex;gap:50px;justify-content:center;
                ">
                    <div style="
                        font-size:clamp(0.55rem,0.75vw,0.65rem);letter-spacing:0.15em;
                        text-transform:uppercase;color:rgba(240,232,208,0.3);
                    ">← FIRST FISH</div>
                    <div style="
                        font-size:clamp(0.55rem,0.75vw,0.65rem);letter-spacing:0.15em;
                        text-transform:uppercase;color:rgba(204,51,102,0.3);
                    ">SECOND FISH →</div>
                </div>
            </div>
        `);
    }

    _makeOverlayEl(parent, html) {
        const el = document.createElement('div');
        el.innerHTML = html;
        parent.appendChild(el);
        return el.firstElementChild;
    }

    /* ═══════════ Update Loop ═══════════ */
    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        const p = this.scrollState?.globalProgress || 0;
        this.mouseSmooth.lerp(this.mouse, 0.03);

        /* ─── Determine active scene ─── */
        let scene = 1;
        if (p >= SCENE3_START) scene = 3;
        else if (p >= SCENE2_START) scene = 2;

        /* ─── Scene visibility transitions ─── */
        const fadeSpeed = 1.5 * dt;
        this._sceneOpacities.scene1 += ((scene === 1 ? 1 : 0) - this._sceneOpacities.scene1) * fadeSpeed;
        this._sceneOpacities.scene2 += ((scene === 2 ? 1 : 0) - this._sceneOpacities.scene2) * fadeSpeed;
        this._sceneOpacities.scene3 += ((scene === 3 ? 1 : 0) - this._sceneOpacities.scene3) * fadeSpeed;

        this.scene1Group.visible = this._sceneOpacities.scene1 > 0.01;
        this.scene2Group.visible = this._sceneOpacities.scene2 > 0.01;
        this.scene3Group.visible = this._sceneOpacities.scene3 > 0.01;

        /* ─── Shared starfield (slowed for cosmic feel) ─── */
        this.starfield.rotation.y = t * 0.0012;
        this.starfield.rotation.x = t * 0.0005;

        /* ─── Global overlays ─── */
        /* Scroll indicator: visible only at start, fades as user scrolls */
        if (this._scrollIndicator) {
            this._scrollIndicator.style.opacity = p < 0.02 ? 1 : Math.max(0, 1 - (p - 0.02) / 0.03);
        }

        /* Scene progress dots */
        if (this._dotEls && this._sceneDots) {
            this._sceneDots.style.opacity = 1;
            this._dotEls.forEach((dot, i) => {
                dot.classList.toggle('active', (i + 1) === scene);
            });
        }

        /* ═══ SCENE 1 — Great Year ═══ */
        if (this.scene1Group.visible) {
            const s1p = Math.max(0, Math.min(1, (p - SCENE1_START) / (SCENE1_END - SCENE1_START)));
            this.scene1Group.rotation.z = t * 0.003;

            /* Fade and scale: shrink as we transition to scene 2 */
            const s1Scale = 1 - s1p * 0.3;
            this.scene1Group.scale.setScalar(s1Scale);
            const s1o = this._sceneOpacities.scene1;

            /* Overlay */
            if (this._scene1Title) {
                this._scene1Title.style.opacity = (s1p < 0.8 ? 1 : 1 - (s1p - 0.8) / 0.2) * s1o;
            }
            if (this._scene1Thesis) {
                const thesisOpacity = s1p < 0.1 ? s1p / 0.1 : s1p < 0.7 ? 1 : 1 - (s1p - 0.7) / 0.3;
                this._scene1Thesis.style.opacity = thesisOpacity * s1o;
            }
            /* Precession explanation — fades in after a moment */
            if (this._scene1Explain) {
                const explainOp = s1p < 0.15 ? s1p / 0.15 : s1p < 0.75 ? 1 : 1 - (s1p - 0.75) / 0.25;
                this._scene1Explain.style.opacity = Math.max(0, explainOp) * s1o;
            }
            /* Direction hint */
            if (this._scene1Direction) {
                const dirOp = s1p < 0.2 ? s1p / 0.2 : s1p < 0.75 ? 1 : 1 - (s1p - 0.75) / 0.25;
                this._scene1Direction.style.opacity = Math.max(0, dirOp) * s1o;
            }
        }

        /* ═══ SCENE 2 — Aeon Spiral ═══ */
        if (this.scene2Group.visible) {
            const s2p = Math.max(0, Math.min(1, (p - SCENE2_START) / (SCENE2_END - SCENE2_START)));
            const s2o = this._sceneOpacities.scene2;

            /* Camera orbits and descends along the spiral */
            const spiralCamAngle = s2p * Math.PI * 0.5;

            /* Slow rotation of the spiral itself */
            this.scene2Group.rotation.y = t * 0.015 + spiralCamAngle * 0.2;

            /* Pulse markers */
            for (const m of this._spiralMarkers) {
                m.sphere.material.opacity = 0.5 + Math.sin(t * 2 + m.data.year * 0.01) * 0.2;
                m.halo.material.opacity = 0.1 + Math.sin(t * 2 + m.data.year * 0.01) * 0.08;
            }

            /* Overlay */
            if (this._scene2Title) {
                this._scene2Title.style.opacity = Math.min(1, s2p * 5) * s2o;
            }
            if (this._scene2Thesis) {
                const quoteOp = s2p > 0.1 && s2p < 0.8 ? 1 : s2p <= 0.1 ? s2p / 0.1 : (1 - s2p) / 0.2;
                this._scene2Thesis.style.opacity = Math.max(0, quoteOp) * s2o;
            }
            /* Color legend — visible through most of scene 2 */
            if (this._scene2Legend) {
                const legendOp = s2p < 0.1 ? s2p / 0.1 : s2p < 0.85 ? 1 : (1 - s2p) / 0.15;
                this._scene2Legend.style.opacity = Math.max(0, legendOp) * s2o;
            }
            /* Enantiodromia definition — appears in the middle portion */
            if (this._scene2Enantio) {
                const enOp = s2p > 0.35 && s2p < 0.85 ? Math.min(1, (s2p - 0.35) / 0.1) : s2p >= 0.85 ? (1 - s2p) / 0.15 : 0;
                this._scene2Enantio.style.opacity = Math.max(0, enOp) * s2o;
            }
            /* Time arrow */
            if (this._scene2TimeArrow) {
                this._scene2TimeArrow.style.opacity = Math.min(1, s2p * 5) * s2o * 0.8;
            }
        } else {
            if (this._scene2Title) this._scene2Title.style.opacity = 0;
            if (this._scene2Thesis) this._scene2Thesis.style.opacity = 0;
            if (this._scene2Legend) this._scene2Legend.style.opacity = 0;
            if (this._scene2Enantio) this._scene2Enantio.style.opacity = 0;
            if (this._scene2TimeArrow) this._scene2TimeArrow.style.opacity = 0;
        }

        /* ═══ Bridge annotation — appears at Scene 2→3 transition ═══ */
        if (this._bridgeAnnotation) {
            /* Show during the last 15% of Scene 2 and first 8% of Scene 3 */
            const bridgeCenter = SCENE3_START;
            const bridgeHalfWidth = 0.06;
            const bridgeDist = Math.abs(p - bridgeCenter);
            const bridgeOp = bridgeDist < bridgeHalfWidth ? (1 - bridgeDist / bridgeHalfWidth) : 0;
            this._bridgeAnnotation.style.opacity = bridgeOp;
        }

        /* ═══ SCENE 3 — Pisces Timeline ═══ */
        if (this.scene3Group.visible) {
            const s3p = Math.max(0, Math.min(1, (p - SCENE3_START) / (SCENE3_END - SCENE3_START)));
            const s3o = this._sceneOpacities.scene3;

            /* Non-linear year mapping: pow(s3p, 0.78)
               This gives later centuries (1500-2000) more scroll distance,
               preventing the overcrowding of events near the timeline's end.
               The exponent < 1 means early years go faster, late years slower. */
            const currentYear = Math.round(2000 * Math.pow(s3p, 0.78));

            /* Update year clock */
            if (this._yearNumEl) {
                this._yearNumEl.textContent = currentYear;
            }

            /* Move the year pointer along the arc */
            const pointerPos = this._yearToArcPos(currentYear);
            if (this.yearPointer) {
                const pointerT = Math.max(0, Math.min(1, (currentYear + 7) / 2007));
                const pointerAngle = this._arcStart + pointerT * this._arcSpan;
                this.yearPointer.position.copy(pointerPos);
                this.yearPointer.position.z = 0.2;
                this.yearPointer.rotation.z = pointerAngle - Math.PI / 2;
            }

            /* Enantiodromia marker pulse */
            if (this._enantiMarker) {
                this._enantiMarker.rotation.y = t * 0.8;
                this._enantiMarker.material.opacity = 0.4 + Math.sin(t * 2) * 0.2;
            }

            /* Find nearest event for tooltip */
            let nearestIdx = 0;
            let nearestDist = Infinity;
            for (let i = 0; i < this._timelineMarkerData.length; i++) {
                const dist = Math.abs(this._timelineMarkerData[i].evt.year - currentYear);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestIdx = i;
                }
            }

            /* Highlight markers AND their WebGL labels based on proximity + scroll reveal */
            for (let i = 0; i < this._timelineMarkerData.length; i++) {
                const md = this._timelineMarkerData[i];
                const dist = Math.abs(md.evt.year - currentYear);
                const proximityWindow = md.isKey ? 160 : 120;
                const glow = Math.max(0, 1 - dist / proximityWindow);
                /* Events ahead of the year pointer are dimmed (yet to be revealed) */
                const revealFade = md.evt.year <= currentYear + 200 ? 1 : Math.max(0.05, 1 - (md.evt.year - currentYear - 200) / 400);

                /* Marker sphere and halo */
                md.node.material.opacity = (0.15 + glow * 0.85) * revealFade;
                md.node.scale.setScalar(1 + glow * 0.8);
                md.halo.material.opacity = (0.04 + glow * 0.3) * revealFade;
                md.symbolSprite.material.opacity = (0.15 + glow * 0.65) * revealFade;

                /* WebGL text labels — fade in on proximity, dim when far */
                const labelBaseOp = md.isKey ? 0.12 : 0.06;
                const labelGlow = md.isKey ? glow * 0.88 : glow * 0.74;
                if (md.yearLbl) md.yearLbl.material.opacity = (labelBaseOp + labelGlow) * revealFade;
                if (md.nameLbl) md.nameLbl.material.opacity = (labelBaseOp * 0.7 + labelGlow * 0.8) * revealFade;
                if (md.connLine) md.connLine.material.opacity = (0.02 + glow * 0.15) * revealFade;
            }

            /* Show event tooltip for nearest event — richer description */
            if (nearestDist < 100 && this._eventTooltip) {
                const evt = this._timelineMarkerData[nearestIdx].evt;
                const lblEl = this._eventTooltip.querySelector('.ch7-evt-label');
                const descEl = this._eventTooltip.querySelector('.ch7-evt-desc');
                if (lblEl) lblEl.textContent = `${evt.year > 0 ? evt.year + ' AD' : Math.abs(evt.year) + ' BC'} — ${evt.label}`;
                if (lblEl) lblEl.style.color = `#${new THREE.Color(evt.color).getHexString()}`;
                if (descEl) descEl.textContent = evt.desc;
                this._eventTooltip.style.opacity = Math.min(1, (1 - nearestDist / 100) * 2) * s3o;
            } else if (this._eventTooltip) {
                this._eventTooltip.style.opacity = 0;
            }

            /* Nostradamus extended annotation — appears near 1555 AD */
            if (this._scene3Nostradamus) {
                const nostDist = Math.abs(currentYear - 1555);
                const nostOp = nostDist < 250 ? Math.min(1, (1 - nostDist / 250) * 1.5) : 0;
                this._scene3Nostradamus.style.opacity = nostOp * s3o;
            }

            /* Overlay visibility */
            if (this._scene3Title) {
                this._scene3Title.style.opacity = Math.min(1, s3p * 5) * s3o;
            }
            if (this._scene3Quote) {
                const qOp = s3p > 0.05 && s3p < 0.35 ? 1 : s3p <= 0.05 ? s3p / 0.05 : Math.max(0, 1 - (s3p - 0.35) / 0.1);
                this._scene3Quote.style.opacity = Math.max(0, qOp) * s3o;
            }
            /* Dual-fish annotation — appears early in Scene 3 */
            if (this._scene3DualFish) {
                const dfOp = s3p > 0.05 && s3p < 0.4 ? Math.min(1, (s3p - 0.05) / 0.1) : s3p >= 0.4 ? Math.max(0, 1 - (s3p - 0.4) / 0.1) : 0;
                this._scene3DualFish.style.opacity = Math.max(0, dfOp) * s3o;
            }
            if (this._yearClockEl) {
                this._yearClockEl.style.opacity = Math.min(1, s3p * 4) * s3o;
            }
            /* Era labels, bars, and fish divider */
            if (this._scene3Eras) {
                this._scene3Eras.style.opacity = Math.min(1, s3p * 3) * s3o;
            }
            if (this._scene3Bottom) {
                this._scene3Bottom.style.opacity = Math.min(1, s3p * 3) * s3o;
            }
            if (this._enantiBar) {
                this._enantiBar.style.opacity = Math.min(1, s3p * 3) * s3o;
            }
            if (this._scene3FishDivider) {
                this._scene3FishDivider.style.opacity = Math.min(1, s3p * 3) * s3o;
            }
        } else {
            /* Hide scene 3 overlay when not visible */
            if (this._scene3Title) this._scene3Title.style.opacity = 0;
            if (this._scene3Quote) this._scene3Quote.style.opacity = 0;
            if (this._scene3DualFish) this._scene3DualFish.style.opacity = 0;
            if (this._yearClockEl) this._yearClockEl.style.opacity = 0;
            if (this._scene3Eras) this._scene3Eras.style.opacity = 0;
            if (this._scene3Bottom) this._scene3Bottom.style.opacity = 0;
            if (this._enantiBar) this._enantiBar.style.opacity = 0;
            if (this._scene3FishDivider) this._scene3FishDivider.style.opacity = 0;
            if (this._eventTooltip) this._eventTooltip.style.opacity = 0;
            if (this._scene3Nostradamus) this._scene3Nostradamus.style.opacity = 0;
        }

        /* Hide scene 1 overlay when not visible */
        if (!this.scene1Group.visible) {
            if (this._scene1Title) this._scene1Title.style.opacity = 0;
            if (this._scene1Thesis) this._scene1Thesis.style.opacity = 0;
            if (this._scene1Explain) this._scene1Explain.style.opacity = 0;
            if (this._scene1Direction) this._scene1Direction.style.opacity = 0;
        }

        /* ═══ Camera management (with LERP smoothing) ═══ */
        const mx = this.mouseSmooth.x * 1.5;
        const my = this.mouseSmooth.y * 1;
        const lerpSpeed = 0.04; // Camera position LERP factor

        /* Initialize camera target if needed */
        if (!this._camTarget) this._camTarget = new THREE.Vector3();
        if (!this._camLookTarget) this._camLookTarget = new THREE.Vector3();

        let targetPos, targetLook;

        if (scene === 1) {
            /* Center on the wheel */
            targetPos = new THREE.Vector3(mx, my + 0.5, 16);
            targetLook = new THREE.Vector3(0, 0, 0);
        } else if (scene === 2) {
            /* Orbit the spiral */
            const s2p = Math.max(0, Math.min(1, (p - SCENE2_START) / (SCENE2_END - SCENE2_START)));
            const camY = -this._helixTotalHeight / 2 + s2p * this._helixTotalHeight;
            const camAngle = s2p * Math.PI * 0.6 + t * 0.01;
            const camDist = 10;
            targetPos = new THREE.Vector3(
                Math.cos(camAngle) * camDist + mx,
                camY + my,
                Math.sin(camAngle) * camDist
            );
            targetLook = new THREE.Vector3(0, camY, 0);
        } else {
            /* Scene 3: look at the arc center — wider framing */
            const s3p = Math.max(0, Math.min(1, (p - SCENE3_START) / (SCENE3_END - SCENE3_START)));
            const currentYear = 2000 * Math.pow(s3p, 0.78); // Match non-linear mapping
            const lt = this._yearToArcPos(currentYear);
            targetPos = new THREE.Vector3(lt.x + mx * 2, lt.y + 4 + my, 16);
            targetLook = new THREE.Vector3(lt.x, lt.y, 0);
        }

        this._camTarget.lerp(targetPos, lerpSpeed);
        this._camLookTarget.lerp(targetLook, lerpSpeed);
        this.camera.position.copy(this._camTarget);
        this.camera.lookAt(this._camLookTarget);
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
        if (this._onWheelHandler) document.removeEventListener('wheel', this._onWheelHandler);
        if (this._onScrollHandler) removeEventListener('scroll', this._onScrollHandler);
        if (this._scrollSpacer) this._scrollSpacer.remove();
        if (this._overlay) this._overlay.remove();
        this.renderer?.dispose();
        this.renderer?.forceContextLoss();
        this.scene?.traverse(o => {
            o.geometry?.dispose();
            if (o.material) [].concat(o.material).forEach(m => m.dispose());
        });
        this.composer = null;
        this.scene = null;
        this.renderer = null;
        super.dispose();
    }
}
