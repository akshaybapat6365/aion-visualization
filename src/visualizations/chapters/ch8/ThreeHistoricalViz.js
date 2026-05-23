/**
 * ThreeHistoricalViz.js — Chapter 8: "The Historical Significance of the Fish"
 *
 * A scroll-driven five-scene descent from the celestial vision (star-crowned
 * woman of Revelation 12) into the primordial deep (Leviathan / collective
 * unconscious).
 *
 * SCENES:
 *   1. The Celestial Vision   (0.00–0.20) — Star-crowned woman + dragon
 *   2. The Hook of Consciousness (0.20–0.40) — Cross-hook, bait fish, Leviathan shadow
 *   3. The Healing Fish        (0.40–0.60) — Tobit's glowing fish, bio-luminescent aura
 *   4. The Great Transition    (0.60–0.80) — Aries→Pisces, zodiac boundary
 *   5. The Primordial Deep     (0.80–1.00) — Dark water field, all symbols submerged
 *
 * Each scene is revealed by scrolling. Five Instrument Serif annotations
 * appear at scene transition points with animated fade-in/slide.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/* ── Palette (true black base) ── */
const STAR_GOLD = new THREE.Color('#ffd700');
const WOMAN_WHITE = new THREE.Color('#f0f0ff');
const DRAGON_RED = new THREE.Color('#8b0000');
const HOOK_SILVER = new THREE.Color('#c0c0c8');
const FISH_CYAN = new THREE.Color('#22d3ee');
const HEAL_GREEN = new THREE.Color('#32cd32');
const ARIES_RED = new THREE.Color('#ff4444');
const PISCES_BLUE = new THREE.Color('#4a90d9');
const WATER_DARK = new THREE.Color('#050505');
const VOID = 0x000000;

/* ── Scene boundaries ── */
const S1_END = 0.20;
const S2_START = 0.18, S2_END = 0.40;
const S3_START = 0.38, S3_END = 0.60;
const S4_START = 0.58, S4_END = 0.80;
const S5_START = 0.78;

/* ── Helpers ── */
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp01(t) { return Math.max(0, Math.min(1, t)); }
function smoothstep(edge0, edge1, x) {
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
}

export default class ThreeHistoricalViz extends BaseViz {
    constructor(c, o = {}) {
        super(c, Object.assign({ contextType: 'webgl' }, o));
        this.panelState = { activePanelId: 'strata', progress: 0 };
        this._targetProgress = 0.08;
        this._scrollP = 0.08;
        this.reducedMotion = false;
    }

    setPanelState(state = {}) {
        this.panelState = Object.assign(this.panelState || {}, state);
        const panelProgress = {
            strata: 0.08,
            christian: 0.30,
            modern: 0.84,
        };
        this._targetProgress = panelProgress[this.panelState.activePanelId] ?? this.panelState.progress ?? 0.08;
    }

    setReducedMotion(enabled) {
        this.reducedMotion = Boolean(enabled);
    }

    async init() {
        /* ── Renderer ── */
        const R = this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: true, alpha: false,
            powerPreference: 'high-performance',
        });
        R.setPixelRatio(Math.min(devicePixelRatio, 2));
        R.setSize(this.width, this.height);
        R.setClearColor(VOID);
        R.toneMapping = THREE.ACESFilmicToneMapping;
        R.toneMappingExposure = 1.1;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(VOID, 0.008);
        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 4, 16);

        /* ── Mouse tracking ── */
        this.mouse = new THREE.Vector2();
        this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => {
            this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / innerHeight) * 2 + 1;
        };
        addEventListener('mousemove', this._onMM);

        /* The React chapter shell owns scroll. This scene receives panel state
           and maps it to the historical-symbol descent internally. */

        /* ── Build scenes ── */
        this._buildScene1_CelestialVision();
        this._buildScene2_HookOfConsciousness();
        this._buildScene3_HealingFish();
        this._buildScene4_GreatTransition();
        this._buildScene5_PrimordialDeep();
        this._buildLights();
        this._buildOverlay();

        /* ── Post-processing ── */
        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.2, 0.5, 0.35
        );
        this.composer.addPass(this.bloom);
    }

    /* ═══════════════════════════════════════════════════════════════
       SCENE 1 — THE CELESTIAL VISION (Star-Crowned Woman + Dragon)
       ═══════════════════════════════════════════════════════════════ */
    _buildScene1_CelestialVision() {
        this._s1 = new THREE.Group();

        /* ── Woman: luminous body ── */
        const bodyGeo = new THREE.SphereGeometry(0.6, 24, 24);
        bodyGeo.scale(0.7, 1.3, 0.55);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: WOMAN_WHITE, emissive: WOMAN_WHITE, emissiveIntensity: 0.6,
            transparent: true, opacity: 0.8, roughness: 0.3, metalness: 0.1,
        });
        this._womanBody = new THREE.Mesh(bodyGeo, bodyMat);
        this._womanBody.position.set(0, 5, 0);
        this._s1.add(this._womanBody);

        /* ── Solar aura ── */
        const auraGeo = new THREE.SphereGeometry(2.0, 20, 20);
        const auraMat = new THREE.MeshBasicMaterial({
            color: STAR_GOLD, transparent: true, opacity: 0.04,
            blending: THREE.AdditiveBlending,
        });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        aura.position.copy(this._womanBody.position);
        this._s1.add(aura);
        this._womanAura = aura;

        /* ── Crown of 12 stars ── */
        this._stars = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const star = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.08, 0),
                new THREE.MeshBasicMaterial({ color: STAR_GOLD })
            );
            star.position.set(
                Math.cos(angle) * 0.75,
                5 + 0.85,
                Math.sin(angle) * 0.4
            );
            this._s1.add(star);
            this._stars.push(star);
        }

        /* ── Lunar crescent (feet) ── */
        const moonGeo = new THREE.TorusGeometry(0.35, 0.06, 8, 24, Math.PI);
        const moon = new THREE.Mesh(moonGeo, new THREE.MeshBasicMaterial({
            color: 0xc0c0d0, transparent: true, opacity: 0.5,
        }));
        moon.position.set(0, 3.5, 0);
        moon.rotation.x = Math.PI / 2;
        this._s1.add(moon);

        /* ── Star field background ── */
        const starCount = 300;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            starPos[i * 3] = (Math.random() - 0.5) * 40;
            starPos[i * 3 + 1] = Math.random() * 20 - 5;
            starPos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starField = new THREE.Points(starGeo, new THREE.PointsMaterial({
            color: 0xffffff, size: 0.06, transparent: true, opacity: 0.4,
            depthWrite: false, blending: THREE.AdditiveBlending,
        }));
        this._s1.add(starField);
        this._starField = starField;

        /* ── Dragon: serpentine torus-knot body ── */
        this._dragonGroup = new THREE.Group();
        const dragonBody = new THREE.Mesh(
            new THREE.TorusKnotGeometry(1.2, 0.18, 80, 10, 2, 3),
            new THREE.MeshStandardMaterial({
                color: DRAGON_RED, emissive: DRAGON_RED, emissiveIntensity: 0.45,
                metalness: 0.5, roughness: 0.4, transparent: true, opacity: 0.65,
            })
        );
        this._dragonBody = dragonBody;
        this._dragonGroup.add(dragonBody);

        /* Seven heads (enlarged for recognizability) */
        this._dragonHeads = [];
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2;
            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.19, 8, 8),
                new THREE.MeshStandardMaterial({
                    color: DRAGON_RED, emissive: '#ff1111', emissiveIntensity: 0.6,
                })
            );
            head.position.set(
                Math.cos(angle) * 1.4,
                Math.sin(angle) * 0.6 + 0.5,
                Math.sin(angle) * 0.6
            );
            this._dragonGroup.add(head);
            this._dragonHeads.push(head);
            /* Neck line connecting head to body center */
            const neck = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), head.position.clone()]),
                new THREE.LineBasicMaterial({ color: DRAGON_RED, transparent: true, opacity: 0.2 })
            );
            this._dragonGroup.add(neck);
        }

        this._dragonGroup.position.set(0, -1, 0);
        this._dragonGroup.scale.setScalar(0.85);
        this._s1.add(this._dragonGroup);

        this.scene.add(this._s1);
    }

    /* ═══════════════════════════════════════════════════════════════
       SCENE 2 — THE HOOK OF CONSCIOUSNESS (Cross-Hook, Bait, Leviathan)
       ═══════════════════════════════════════════════════════════════ */
    _buildScene2_HookOfConsciousness() {
        this._s2 = new THREE.Group();

        /* ── Fishing line (vertical) ── */
        const linePoints = [new THREE.Vector3(0, 6, 0), new THREE.Vector3(0, -1, 0)];
        this._s2.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(linePoints),
            new THREE.LineBasicMaterial({ color: HOOK_SILVER, transparent: true, opacity: 0.35 })
        ));

        /* ── Hook curve ── */
        const hookPts = [];
        for (let i = 0; i <= 24; i++) {
            const t = i / 24;
            hookPts.push(new THREE.Vector3(
                Math.sin(t * Math.PI) * 0.4,
                -1 - t * 0.6,
                0
            ));
        }
        this._s2.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(hookPts),
            new THREE.LineBasicMaterial({ color: HOOK_SILVER, transparent: true, opacity: 0.45 })
        ));

        /* ── Cross at hook-top ── */
        const crossMat = new THREE.MeshBasicMaterial({ color: STAR_GOLD });
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.05), crossMat);
        crossV.position.y = 6.3;
        this._s2.add(crossV);
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.05), crossMat);
        crossH.position.y = 6.4;
        this._s2.add(crossH);

        /* ── Bait fish (ichthys) ── */
        const fishGeo = new THREE.SphereGeometry(0.2, 10, 8);
        fishGeo.scale(2.5, 0.65, 0.45);
        this._baitFish = new THREE.Mesh(fishGeo, new THREE.MeshStandardMaterial({
            color: FISH_CYAN, emissive: FISH_CYAN, emissiveIntensity: 0.5,
            transparent: true, opacity: 0.75,
        }));
        this._baitFish.position.y = -1.8;
        this._s2.add(this._baitFish);

        /* Bait fish eye */
        const baitEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.035, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        baitEye.position.set(0.35, 0.04, 0.12);
        this._baitFish.add(baitEye);

        /* Bait fish tail */
        const tailGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.5, 0, 0),
            new THREE.Vector3(-0.8, 0.2, 0),
            new THREE.Vector3(-0.8, -0.2, 0),
            new THREE.Vector3(-0.5, 0, 0),
        ]);
        const tail = new THREE.Line(tailGeo, new THREE.LineBasicMaterial({
            color: FISH_CYAN, transparent: true, opacity: 0.4,
        }));
        tail.position.copy(this._baitFish.position);
        this._s2.add(tail);
        this._baitTail = tail;

        /* ── Leviathan shadow (large dark undulating mass) ── */
        const levGeo = new THREE.SphereGeometry(3, 24, 24);
        levGeo.scale(2, 0.5, 1);
        this._leviathan = new THREE.Mesh(levGeo, new THREE.MeshStandardMaterial({
            color: 0x0a0a15, emissive: DRAGON_RED, emissiveIntensity: 0.08,
            transparent: true, opacity: 0.25, roughness: 1, metalness: 0,
        }));
        this._leviathan.position.set(0, -5, -2);
        this._s2.add(this._leviathan);
        // Store original positions for vertex displacement
        this._levOrigPositions = levGeo.attributes.position.array.slice();

        /* ── Leviathan eye ── */
        const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
        this._levEye = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({
            color: DRAGON_RED, transparent: true, opacity: 0.3,
            blending: THREE.AdditiveBlending,
        }));
        this._levEye.position.set(2.5, -4, 0);
        this._s2.add(this._levEye);

        this._s2.position.set(3, 0, 1);
        this.scene.add(this._s2);
    }

    /* ═══════════════════════════════════════════════════════════════
       SCENE 3 — THE HEALING FISH (Tobit)
       ═══════════════════════════════════════════════════════════════ */
    _buildScene3_HealingFish() {
        this._s3 = new THREE.Group();

        /* ── Fish body ── */
        const bodyGeo = new THREE.SphereGeometry(0.3, 14, 12);
        bodyGeo.scale(2.5, 0.8, 0.5);
        this._healFish = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({
            color: HEAL_GREEN, emissive: HEAL_GREEN, emissiveIntensity: 0.7,
            transparent: true, opacity: 0.7,
        }));
        this._s3.add(this._healFish);

        /* Healing fish eye */
        const healEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.04, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        healEye.position.set(0.55, 0.06, 0.14);
        this._healFish.add(healEye);

        /* ── Bio-luminescent inner glow ── */
        const glowGeo = new THREE.SphereGeometry(0.8, 16, 16);
        this._healGlow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
            color: HEAL_GREEN, transparent: true, opacity: 0.06,
            blending: THREE.AdditiveBlending,
        }));
        this._s3.add(this._healGlow);

        /* ── Outer aura — larger, dimmer ── */
        const auraGeo = new THREE.SphereGeometry(2.5, 16, 16);
        this._healAuraOuter = new THREE.Mesh(auraGeo, new THREE.MeshBasicMaterial({
            color: HEAL_GREEN, transparent: true, opacity: 0.02,
            blending: THREE.AdditiveBlending,
        }));
        this._s3.add(this._healAuraOuter);

        /* ── Healing particles ── */
        const pCount = 120;
        const pPos = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = 0.5 + Math.random() * 2.5;
            pPos[i * 3] = Math.cos(a) * r;
            pPos[i * 3 + 1] = (Math.random() - 0.5) * 2;
            pPos[i * 3 + 2] = Math.sin(a) * r * 0.5;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        this._healParticles = new THREE.Points(pGeo, new THREE.PointsMaterial({
            color: HEAL_GREEN, size: 0.04, transparent: true, opacity: 0.4,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this._s3.add(this._healParticles);
        this._healParticleOrigPos = pPos.slice();

        this._s3.position.set(-4, -1, 2);
        this.scene.add(this._s3);
    }

    /* ═══════════════════════════════════════════════════════════════
       SCENE 4 — THE GREAT TRANSITION (Aries → Pisces)
       ═══════════════════════════════════════════════════════════════ */
    _buildScene4_GreatTransition() {
        this._s4 = new THREE.Group();

        /* ── Aries (Ram) ── */
        this._ariesGroup = new THREE.Group();
        const ramBody = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.6, 1),
            new THREE.MeshStandardMaterial({
                color: ARIES_RED, emissive: ARIES_RED, emissiveIntensity: 0.35,
                transparent: true, opacity: 0.6,
            })
        );
        this._ariesGroup.add(ramBody);
        this._ariesBody = ramBody;

        /* Ram horns */
        for (let side = -1; side <= 1; side += 2) {
            const horn = new THREE.Mesh(
                new THREE.TorusGeometry(0.25, 0.05, 8, 20, Math.PI),
                new THREE.MeshStandardMaterial({
                    color: ARIES_RED, emissive: ARIES_RED, emissiveIntensity: 0.25,
                    transparent: true, opacity: 0.55,
                })
            );
            horn.position.set(side * 0.35, 0.35, 0.25);
            horn.rotation.x = -Math.PI / 4;
            this._ariesGroup.add(horn);
        }
        this._ariesGroup.position.set(-2, 2, 0);
        this._s4.add(this._ariesGroup);

        /* ── Zodiac arc (connecting Aries and Pisces) ── */
        const arcPts = [];
        for (let i = 0; i <= 40; i++) {
            const t = i / 40;
            const angle = lerp(-Math.PI / 4, Math.PI / 4, t);
            arcPts.push(new THREE.Vector3(
                Math.sin(angle) * 5,
                Math.cos(angle) * 3 - 1,
                -1
            ));
        }
        const arcLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(arcPts),
            new THREE.LineBasicMaterial({
                color: 0x444466, transparent: true, opacity: 0.2,
            })
        );
        this._s4.add(arcLine);
        this._zodiacArc = arcLine;

        /* ── Pisces (Fish) — emerging ── */
        this._piscesGroup = new THREE.Group();
        const piscesBody = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 12, 10).scale(2.5, 0.7, 0.5),
            new THREE.MeshStandardMaterial({
                color: PISCES_BLUE, emissive: PISCES_BLUE, emissiveIntensity: 0.45,
                transparent: true, opacity: 0,
            })
        );
        this._piscesFish = piscesBody;
        this._piscesGroup.add(piscesBody);

        /* Pisces aura */
        const pAura = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 12, 12),
            new THREE.MeshBasicMaterial({
                color: PISCES_BLUE, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending,
            })
        );
        this._piscesAura = pAura;
        this._piscesGroup.add(pAura);

        this._piscesGroup.position.set(2, -1, 0);
        this._s4.add(this._piscesGroup);

        this._s4.position.set(5, 2, -2);
        this.scene.add(this._s4);
    }

    /* ═══════════════════════════════════════════════════════════════
       SCENE 5 — THE PRIMORDIAL DEEP (Dark Water Field)
       ═══════════════════════════════════════════════════════════════ */
    _buildScene5_PrimordialDeep() {
        /* ── Water particles ── */
        const count = 800;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 25;
            positions[i * 3 + 1] = -4 + (Math.random() - 0.5) * 4;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
            // Color gradient from dark blue to deep black
            const depth = Math.random();
            colors[i * 3] = lerp(0.02, 0.05, depth);
            colors[i * 3 + 1] = lerp(0.04, 0.12, depth);
            colors[i * 3 + 2] = lerp(0.08, 0.2, depth);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this._waterField = new THREE.Points(geo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.08, transparent: true, opacity: 0.35,
            depthWrite: false, blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this._waterField);

        /* ── Deep fish reflection (Self integration symbol) ── */
        const deepFishGeo = new THREE.SphereGeometry(0.5, 14, 12);
        deepFishGeo.scale(2.5, 0.7, 0.4);
        this._deepFish = new THREE.Mesh(deepFishGeo, new THREE.MeshStandardMaterial({
            color: PISCES_BLUE, emissive: PISCES_BLUE, emissiveIntensity: 0.55,
            transparent: true, opacity: 0, roughness: 0.5, metalness: 0.3,
        }));
        this._deepFish.position.set(2.4, -5, 0);
        this.scene.add(this._deepFish);

        /* Deep fish eye */
        const deepEye = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 6, 6),
            new THREE.MeshBasicMaterial({ color: STAR_GOLD, transparent: true, opacity: 0.6 })
        );
        deepEye.position.set(0.8, 0.08, 0.12);
        this._deepFish.add(deepEye);

        const deepTailGeo = new THREE.BufferGeometry();
        deepTailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            -0.95, 0, 0.03,
            -1.58, 0.34, 0.03,
            -1.58, -0.34, 0.03,
        ]), 3));
        deepTailGeo.setIndex([0, 1, 2]);
        this._deepFishTail = new THREE.Mesh(
            deepTailGeo,
            new THREE.MeshBasicMaterial({
                color: PISCES_BLUE, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthTest: false,
            })
        );
        this._deepFish.add(this._deepFishTail);

        /* ── Deep fish glow ── */
        this._deepFishGlow = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 12),
            new THREE.MeshBasicMaterial({
                color: STAR_GOLD, transparent: true, opacity: 0,
                blending: THREE.AdditiveBlending,
            })
        );
        this._deepFishGlow.position.copy(this._deepFish.position);
        this.scene.add(this._deepFishGlow);
    }

    /* ─── Lights ── */
    _buildLights() {
        this.scene.add(new THREE.AmbientLight(0x080808, 0.3));
        // Golden light from above (woman)
        const sunLight = new THREE.PointLight(0xffd700, 0.9, 20);
        sunLight.position.set(0, 8, 5);
        this.scene.add(sunLight);
        this._sunLight = sunLight;
        // Red light from below (dragon)
        const dragonLight = new THREE.PointLight(0x8b0000, 0.5, 15);
        dragonLight.position.set(0, -4, 3);
        this.scene.add(dragonLight);
        this._dragonLight = dragonLight;
        // Green heal light
        const healLight = new THREE.PointLight(0x32cd32, 0.4, 12);
        healLight.position.set(-4, -1, 4);
        this.scene.add(healLight);
        this._healLight = healLight;
    }

    /* ─── Annotation overlay ── */
    _buildOverlay() {
        const ov = document.createElement('div');
        ov.className = 'ch8-annotations';
        ov.setAttribute('aria-hidden', 'true');

        /* ── CSS: proper font declarations matching ch1–ch7 pattern ── */
        const style = document.createElement('style');
        style.id = 'ch8-anim-style';
        style.textContent = `
            .ch8-annotations {
                position: absolute; inset: 0;
                pointer-events: none; z-index: 10;
                overflow: hidden;
            }

            /* ── Keyframes ── */
            @keyframes ch8Rise {
                0%   { opacity: 0; transform: translateY(28px) scale(0.97); filter: blur(3px); }
                60%  { opacity: 0.85; transform: translateY(3px) scale(1); filter: blur(0); }
                100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
            }
            @keyframes ch8LabelSlide {
                0%   { opacity: 0; transform: translateX(-6px); }
                100% { opacity: 1; transform: translateX(0); }
            }
            @keyframes ch8Glow {
                0%, 100% { text-shadow: 0 0 20px currentColor, 0 2px 40px rgba(0,0,0,0.9); }
                50%      { text-shadow: 0 0 45px currentColor, 0 2px 40px rgba(0,0,0,0.9); }
            }

            /* ── Base element ── */
            .ch8-el {
                position: absolute;
                pointer-events: none;
                opacity: 0;
                transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                            transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                text-shadow: 0 2px 30px rgba(0,0,0,0.85), 0 0 60px rgba(0,0,0,0.5);
                will-change: opacity, transform;
            }
            .ch8-el.ch8-entering {
                animation: ch8Rise 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            /* ── Chapter bar ── */
            .ch8-bar {
                top: 18px; left: 50%; transform: translateX(-50%);
                font-family: 'Instrument Serif', Georgia, 'Times New Roman', serif;
                font-size: 11px; font-weight: 400;
                color: rgba(255,255,255,0.35);
                letter-spacing: 4px; text-transform: uppercase; text-align: center;
            }
            .ch8-bar-num { opacity: 0.6; }
            .ch8-bar-sep { display: inline-block; width: 1.5rem; opacity: 0.2; }
            .ch8-bar-title { opacity: 0.3; letter-spacing: 0.12em; }

            /* ── Scene headers ── */
            .ch8-hdr { top: 52px; left: 28px; text-align: left; }
            .ch8-hdr-num {
                font-family: 'Instrument Serif', Georgia, 'Times New Roman', serif;
                font-size: 14px; font-weight: 400;
                letter-spacing: 4px; text-transform: uppercase;
                margin-bottom: 6px;
            }
            .ch8-hdr-sub {
                font-family: 'Instrument Serif', serif;
                font-style: italic; font-size: 0.8rem;
                letter-spacing: 0.03em; line-height: 1.4;
            }

            /* ── Quotes ── */
            .ch8-quote { text-align: center; }
            .ch8-quote-main {
                font-family: 'Instrument Serif', serif;
                font-style: italic;
                font-size: clamp(1.4rem, 3vw, 2.2rem);
                letter-spacing: 0.02em; line-height: 1.3;
                margin-bottom: 14px;
            }
            .ch8-quote.ch8-entering .ch8-quote-main {
                animation: ch8Glow 3s ease-in-out 1.4s infinite;
            }
            .ch8-quote-sub {
                font-family: 'Instrument Serif', serif;
                font-style: italic; font-size: 0.7rem;
                opacity: 0.5; letter-spacing: 0.04em;
                max-width: 340px; margin: 0 auto; line-height: 1.65;
            }

            /* ── Element labels ── */
            .ch8-label {
                font-family: 'Instrument Serif', serif;
                font-style: italic; font-size: 0.65rem;
                letter-spacing: 0.08em;
            }
            .ch8-label.ch8-entering {
                animation: ch8LabelSlide 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }

            /* ── Scene accent colors ── */
            .ch8-gold    { color: rgba(255, 215, 0, 0.9); }
            .ch8-silver  { color: rgba(200, 210, 225, 0.85); }
            .ch8-emerald { color: rgba(80, 220, 120, 0.85); }
            .ch8-crimson { color: rgba(255, 90, 80, 0.9); }
            .ch8-azure   { color: rgba(100, 170, 240, 0.9); }
            .ch8-deep    { color: rgba(120, 165, 230, 0.85); }

            .ch8-hdr-num.ch8-gold    { color: rgba(255, 215, 0, 0.65); }
            .ch8-hdr-num.ch8-silver  { color: rgba(200, 210, 225, 0.6); }
            .ch8-hdr-num.ch8-emerald { color: rgba(80, 220, 120, 0.6); }
            .ch8-hdr-num.ch8-crimson { color: rgba(255, 90, 80, 0.65); }
            .ch8-hdr-num.ch8-deep    { color: rgba(120, 165, 230, 0.6); }

            .ch8-hdr-sub.ch8-gold    { color: rgba(255, 215, 0, 0.4); }
            .ch8-hdr-sub.ch8-silver  { color: rgba(200, 210, 225, 0.35); }
            .ch8-hdr-sub.ch8-emerald { color: rgba(80, 220, 120, 0.35); }
            .ch8-hdr-sub.ch8-crimson { color: rgba(255, 90, 80, 0.4); }
            .ch8-hdr-sub.ch8-deep    { color: rgba(120, 165, 230, 0.35); }

            .ch8-label.ch8-gold    { color: rgba(255, 215, 0, 0.55); }
            .ch8-label.ch8-silver  { color: rgba(200, 210, 225, 0.5); }
            .ch8-label.ch8-emerald { color: rgba(80, 220, 120, 0.5); }
            .ch8-label.ch8-crimson { color: rgba(255, 90, 80, 0.55); }
            .ch8-label.ch8-azure   { color: rgba(100, 170, 240, 0.55); }
            .ch8-label.ch8-deep    { color: rgba(120, 165, 230, 0.5); }

            /* ── Gradient ── */
            .ch8-gradient-text .ch8-quote-main {
                background: linear-gradient(90deg, rgba(255,90,80,0.9), rgba(100,170,240,0.9));
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            /* ── Progress dots ── */
            .ch8-progress {
                position: absolute; right: 18px; top: 50%; transform: translateY(-50%);
                z-index: 11; pointer-events: none;
                display: flex; flex-direction: column; align-items: flex-end; gap: 14px;
            }
            .ch8-dot-wrap { display: flex; align-items: center; gap: 8px; flex-direction: row-reverse; }
            .ch8-dot {
                width: 4px; height: 4px; border-radius: 50%;
                background: rgba(255,255,255,0.12);
                transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            .ch8-dot-label {
                font-family: 'Instrument Serif', serif;
                font-style: italic; font-size: 0.4rem;
                color: rgba(255,255,255,0); letter-spacing: 0.08em;
                transition: color 0.6s ease; white-space: nowrap;
            }
            .ch8-annotations [data-ch8-copy="quiet"] {
                display: none !important;
            }

            @media (max-width: 768px) {
                .ch8-quote-main { font-size: 1.2rem; }
                .ch8-hdr { top: 44px; left: 16px; }
                .ch8-label,
                .ch8-progress { display: none !important; }
            }
        `;
        document.head.appendChild(style);
        this._ch8Style = style;

        /* ── Helper: create positioned element with classes ── */
        const mkEl = (html, inlineCSS, ...classes) => {
            const el = document.createElement('div');
            el.className = ['ch8-el', ...classes].join(' ');
            if (inlineCSS) el.style.cssText += inlineCSS;
            el.innerHTML = html;
            ov.appendChild(el);
            return el;
        };

        /* ═══ CHAPTER CONTEXT BAR ═══ */
        this._chapterBar = mkEl(
            `<span class="ch8-bar-num">CHAPTER VIII</span>` +
            `<span class="ch8-bar-sep">·</span>` +
            `<span class="ch8-bar-title">THE HISTORICAL SIGNIFICANCE OF THE FISH</span>`,
            'opacity:1;', 'ch8-bar'
        );

        /* ═══ SCENE HEADERS ═══ */
        const mkHeader = (num, title, sub, accent) => mkEl(
            `<div class="ch8-hdr-num ${accent}">${num} · ${title}</div>` +
            `<div class="ch8-hdr-sub ${accent}">${sub}</div>`,
            '', 'ch8-hdr'
        );
        this._hdr1 = mkHeader('I', 'THE CELESTIAL VISION', 'Revelation 12 — The Woman and the Dragon', 'ch8-gold');
        this._hdr2 = mkHeader('II', 'THE HOOK OF CONSCIOUSNESS', 'The Cross catches Leviathan from the deep', 'ch8-silver');
        this._hdr3 = mkHeader('III', 'THE HEALING FISH', 'The Book of Tobit — Sight restored from darkness', 'ch8-emerald');
        this._hdr4 = mkHeader('IV', 'THE GREAT TRANSITION', 'From the Age of Aries to the Age of Pisces', 'ch8-crimson');
        this._hdr5 = mkHeader('V', 'THE PRIMORDIAL DEEP', 'The fish as Self — totality of the unconscious', 'ch8-deep');

        /* ═══ PRIMARY QUOTES ═══ */
        const mkQuote = (main, sub, inlineCSS, accent) => mkEl(
            `<div class="ch8-quote-main">${main}</div>` +
            `<div class="ch8-quote-sub">${sub}</div>`,
            inlineCSS, 'ch8-quote', accent
        );
        this._ann1 = mkQuote('A woman clothed with the sun',
            'The divine feminine crowned with the zodiac — the moon beneath her feet',
            'top:14%;left:50%;transform:translateX(-50%) translateY(20px);', 'ch8-gold');
        this._ann2 = mkQuote('The Cross as Hook, Christ as Bait',
            'Patristic allegory — the crucifixion snares the primordial unconscious',
            'top:48%;left:50%;transform:translate(-50%,-50%) translateY(20px);', 'ch8-silver');
        this._ann3 = mkQuote('The fish that heals blindness',
            'Tobias extracts the healing organs — libido drawn from the unconscious into consciousness',
            'top:42%;left:50%;transform:translate(-50%,0) translateY(20px);', 'ch8-emerald');
        this._ann4 = mkQuote('From the Ram to the Fish',
            'The astrological age shift mirrors the psychological transformation of an era',
            'top:48%;left:50%;transform:translate(-50%,-50%) translateY(20px);', 'ch8-gradient-text');
        this._ann5 = mkQuote('In the depths, the Self',
            'The fish as totality — Christ and Leviathan unified in the collective unconscious',
            'bottom:16%;left:50%;transform:translateX(-50%) translateY(20px);', 'ch8-deep');

        /* ═══ ELEMENT LABELS ═══ */
        const mkLabel = (text, inlineCSS, accent) => mkEl(text, inlineCSS, 'ch8-label', accent);

        this._lbl_crown = mkLabel('Crown of Twelve Stars', 'top:22%;left:50%;transform:translateX(-50%);', 'ch8-gold');
        this._lbl_dragon = mkLabel('The Seven-Headed Dragon', 'bottom:30%;left:50%;transform:translateX(-50%);', 'ch8-gold');
        this._lbl_cross = mkLabel('The Cross', 'top:20%;right:28%;', 'ch8-silver');
        this._lbl_leviathan = mkLabel('Leviathan', 'bottom:24%;right:28%;', 'ch8-silver');
        this._lbl_tobit = mkLabel('Tobit\'s Fish', 'top:36%;left:26%;', 'ch8-emerald');
        this._lbl_aries = mkLabel('♈ Aries', 'top:30%;left:28%;', 'ch8-crimson');
        this._lbl_pisces = mkLabel('♓ Pisces', 'top:56%;right:28%;', 'ch8-azure');
        this._lbl_self = mkLabel('The Self', 'bottom:26%;left:50%;transform:translateX(-50%);', 'ch8-deep');

        /* ═══ PROGRESS DOTS ═══ */
        const pc = document.createElement('div');
        pc.className = 'ch8-progress';
        this._progressDots = [];
        const nums = ['I', 'II', 'III', 'IV', 'V'];
        for (let i = 0; i < 5; i++) {
            const wrap = document.createElement('div');
            wrap.className = 'ch8-dot-wrap';
            const dot = document.createElement('div');
            dot.className = 'ch8-dot';
            const lbl = document.createElement('div');
            lbl.className = 'ch8-dot-label';
            lbl.textContent = nums[i];
            wrap.appendChild(lbl);
            wrap.appendChild(dot);
            pc.appendChild(wrap);
            this._progressDots.push({ dot, label: lbl });
        }
        ov.appendChild(pc);
        this._progressContainer = pc;

        [
            this._chapterBar,
            this._hdr1,
            this._hdr2,
            this._hdr3,
            this._hdr4,
            this._hdr5,
            this._ann1,
            this._ann2,
            this._ann3,
            this._ann4,
            this._ann5,
        ].forEach((el) => el?.setAttribute('data-ch8-copy', 'quiet'));

        this.canvas.parentElement.appendChild(ov);
        this._overlay = ov;
    }


    /* ═══════════════════════════════════════════════════════════════
       UPDATE — Scroll-driven animation
       ═══════════════════════════════════════════════════════════════ */
    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        const targetProgress = this._targetProgress ?? 0.08;
        const progressDamp = this.reducedMotion ? 12 : 3.5;
        this._scrollP = THREE.MathUtils.damp(this._scrollP ?? targetProgress, targetProgress, progressDamp, dt);
        const p = this._scrollP;
        const motionScale = this.reducedMotion ? 0.12 : 1;
        this.mouseSmooth.lerp(this.mouse, 0.03);

        /* ── Scene 1: Celestial Vision ── */
        const s1 = clamp01(1 - p / S1_END);  // 1 at start, 0 by S1_END
        this._s1.visible = s1 > 0.01;
        if (this._s1.visible) {
            // Woman hover
            this._womanBody.position.y = 5 + Math.sin(t * 0.15 * motionScale) * 0.3;
            this._womanAura.position.copy(this._womanBody.position);

            // Stars orbit slowly
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + t * 0.05 * motionScale;
                this._stars[i].position.set(
                    Math.cos(angle) * 0.75,
                    this._womanBody.position.y + 0.85,
                    Math.sin(angle) * 0.4
                );
                this._stars[i].rotation.y = t * 0.3 * motionScale;
            }

            // Dragon pursuing — circles below the woman
            const dragonA = t * 0.08 * motionScale;
            this._dragonGroup.position.set(
                Math.cos(dragonA) * 2.5,
                -1 + Math.sin(t * 0.2 * motionScale) * 0.3,
                Math.sin(dragonA) * 2.5
            );
            this._dragonBody.rotation.x = t * 0.1 * motionScale;
            this._dragonBody.rotation.y = t * 0.15 * motionScale;

            // Heads pulsate
            for (const h of this._dragonHeads) {
                h.material.emissiveIntensity = 0.4 + Math.sin(t * 2 * motionScale + h.position.x) * 0.3;
            }

            // Fade Scene 1 out
            this._womanBody.material.opacity = 0.8 * s1;
            this._womanAura.material.opacity = 0.04 * s1;
            this._dragonBody.material.opacity = 0.65 * s1;
            this._starField.material.opacity = 0.4 * s1;
        }

        /* ── Scene 2: Hook of Consciousness ── */
        const s2enter = smoothstep(S2_START, S2_START + 0.05, p);
        const s2exit = 1 - smoothstep(S2_END - 0.05, S2_END, p);
        const s2 = Math.min(s2enter, s2exit);
        this._s2.visible = s2 > 0.01;
        if (this._s2.visible) {
            // Hook sway
            this._s2.rotation.z = Math.sin(t * 0.12 * motionScale) * 0.04;
            // Bait fish wiggle
            this._baitFish.rotation.z = Math.sin(t * 0.3 * motionScale) * 0.12;
            this._baitTail.rotation.z = this._baitFish.rotation.z;
            this._baitTail.position.copy(this._baitFish.position);

            // Leviathan undulation (vertex displacement)
            const levPos = this._leviathan.geometry.attributes.position.array;
            const orig = this._levOrigPositions;
            for (let i = 0; i < levPos.length; i += 3) {
                levPos[i] = orig[i] + Math.sin(t * 0.3 * motionScale + orig[i + 1] * 2) * 0.15;
                levPos[i + 1] = orig[i + 1] + Math.sin(t * 0.25 * motionScale + orig[i] * 1.5) * 0.1;
            }
            this._leviathan.geometry.attributes.position.needsUpdate = true;

            // Leviathan eye pulse
            this._levEye.material.opacity = 0.2 + Math.sin(t * 0.8 * motionScale) * 0.15;

            // Opacity
            this._baitFish.material.opacity = 0.75 * s2;
            this._leviathan.material.opacity = 0.25 * s2;
        }

        /* ── Scene 3: Healing Fish ── */
        const s3enter = smoothstep(S3_START, S3_START + 0.05, p);
        const s3exit = 1 - smoothstep(S3_END - 0.05, S3_END, p);
        const s3 = Math.min(s3enter, s3exit);
        this._s3.visible = s3 > 0.01;
        if (this._s3.visible) {
            // Fish swim
            this._healFish.position.x = Math.sin(t * 0.08 * motionScale) * 1.5;
            this._healFish.position.y = Math.sin(t * 0.15 * motionScale) * 0.3;

            // Glow pulse
            const healPulse = 0.5 + Math.sin(t * 0.5 * motionScale) * 0.5;
            this._healGlow.material.opacity = (0.04 + healPulse * 0.06) * s3;
            this._healAuraOuter.material.opacity = (0.01 + healPulse * 0.03) * s3;
            this._healGlow.scale.setScalar(1 + healPulse * 0.3);

            // Healing particles orbit
            const pPos = this._healParticles.geometry.attributes.position.array;
            const oPos = this._healParticleOrigPos;
            for (let i = 0; i < pPos.length; i += 3) {
                const a = t * 0.2 * motionScale + oPos[i] * 0.5;
                pPos[i] = oPos[i] * Math.cos(a * 0.1) + Math.sin(a) * 0.1;
                pPos[i + 1] = oPos[i + 1] + Math.sin(t * 0.3 * motionScale + oPos[i]) * 0.15;
                pPos[i + 2] = oPos[i + 2] * Math.cos(a * 0.1);
            }
            this._healParticles.geometry.attributes.position.needsUpdate = true;

            this._healFish.material.opacity = 0.7 * s3;
            this._healParticles.material.opacity = 0.4 * s3;

            // Healing light intensity
            this._healLight.intensity = 0.3 + healPulse * 0.4;
        }

        /* ── Scene 4: Great Transition ── */
        const s4enter = smoothstep(S4_START, S4_START + 0.05, p);
        const s4exit = 1 - smoothstep(S4_END - 0.05, S4_END, p);
        const s4 = Math.min(s4enter, s4exit);
        this._s4.visible = s4 > 0.01;
        if (this._s4.visible) {
            // Aries fades, Pisces emerges
            const transP = clamp01((p - S4_START) / (S4_END - S4_START));
            this._ariesBody.material.opacity = 0.6 * (1 - transP) * s4;
            this._ariesGroup.traverse(c => {
                if (c.material && c !== this._ariesBody) c.material.opacity = 0.55 * (1 - transP) * s4;
            });
            this._ariesGroup.scale.setScalar(1 - transP * 0.4);

            this._piscesFish.material.opacity = 0.65 * transP * s4;
            this._piscesAura.material.opacity = 0.05 * transP * s4;
            this._piscesGroup.scale.setScalar(0.5 + transP * 0.5);

            // Aries rotates / fire
            this._ariesGroup.rotation.y = t * 0.05 * motionScale + transP * Math.PI;
            this._piscesGroup.rotation.y = -t * 0.06 * motionScale;

            // Zodiac arc brightens
            this._zodiacArc.material.opacity = (0.1 + transP * 0.2) * s4;
        }

        /* ── Scene 5: Primordial Deep ── */
        const s5 = smoothstep(S5_START, S5_START + 0.08, p);
        if (s5 > 0.01) {
            // Water undulation
            const waterPos = this._waterField.geometry.attributes.position.array;
            for (let i = 0; i < waterPos.length; i += 3) {
                waterPos[i + 1] += Math.sin(t * 0.2 * motionScale + waterPos[i] * 0.3) * 0.003;
            }
            this._waterField.geometry.attributes.position.needsUpdate = true;
            this._waterField.material.opacity = 0.12 + 0.48 * s5;

            // Deep fish emerges
            this._deepFish.material.opacity = 0.75 * s5;
            this._deepFishTail.material.opacity = 0.62 * s5;
            this._deepFish.position.set(2.4, -5 + s5 * 1.65, 0);
            this._deepFish.rotation.y = 0.35 + Math.sin(t * 0.08 * motionScale) * 0.22;
            this._deepFishGlow.material.opacity = 0.09 * s5;
            this._deepFishGlow.position.copy(this._deepFish.position);
            this._deepFishGlow.scale.setScalar(1.15 + Math.sin(t * 0.3 * motionScale) * 0.18);
        } else {
            this._waterField.material.opacity = 0.08;
            this._deepFish.material.opacity = 0;
            this._deepFishTail.material.opacity = 0;
            this._deepFishGlow.material.opacity = 0;
        }

        /* ── Annotations: quotes ── */
        this._setAnnotation(this._ann1, smoothstep(0.02, 0.08, p) * (1 - smoothstep(0.14, 0.20, p)));
        this._setAnnotation(this._ann2, smoothstep(0.22, 0.28, p) * (1 - smoothstep(0.34, 0.40, p)));
        this._setAnnotation(this._ann3, smoothstep(0.42, 0.48, p) * (1 - smoothstep(0.54, 0.60, p)));
        this._setAnnotation(this._ann4, smoothstep(0.62, 0.68, p) * (1 - smoothstep(0.74, 0.80, p)));
        this._setAnnotation(this._ann5, smoothstep(0.82, 0.88, p));

        /* ── Scene headers ── */
        this._setAnnotation(this._hdr1, smoothstep(0.0, 0.04, p) * (1 - smoothstep(0.16, 0.20, p)));
        this._setAnnotation(this._hdr2, smoothstep(0.19, 0.23, p) * (1 - smoothstep(0.36, 0.40, p)));
        this._setAnnotation(this._hdr3, smoothstep(0.39, 0.43, p) * (1 - smoothstep(0.56, 0.60, p)));
        this._setAnnotation(this._hdr4, smoothstep(0.59, 0.63, p) * (1 - smoothstep(0.76, 0.80, p)));
        this._setAnnotation(this._hdr5, smoothstep(0.79, 0.83, p));

        /* ── Element labels (selective, 2-3 per scene) ── */
        const s1lbl = smoothstep(0.04, 0.10, p) * (1 - smoothstep(0.14, 0.19, p));
        this._setAnnotation(this._lbl_crown, s1lbl);
        this._setAnnotation(this._lbl_dragon, s1lbl);

        const s2lbl = smoothstep(0.24, 0.30, p) * (1 - smoothstep(0.34, 0.39, p));
        this._setAnnotation(this._lbl_cross, s2lbl);
        this._setAnnotation(this._lbl_leviathan, s2lbl);

        const s3lbl = smoothstep(0.44, 0.50, p) * (1 - smoothstep(0.54, 0.59, p));
        this._setAnnotation(this._lbl_tobit, s3lbl);

        const s4lbl = smoothstep(0.64, 0.70, p) * (1 - smoothstep(0.74, 0.79, p));
        this._setAnnotation(this._lbl_aries, s4lbl);
        this._setAnnotation(this._lbl_pisces, s4lbl);

        const s5lbl = smoothstep(0.84, 0.90, p);
        this._setAnnotation(this._lbl_self, s5lbl);

        /* ── Chapter context bar fade ── */
        if (this._chapterBar) {
            this._chapterBar.style.opacity = lerp(0.9, 0.3, clamp01(p * 2));
        }

        /* ── Scroll progress dots ── */
        if (this._progressDots) {
            const activeScene = p < 0.20 ? 0 : p < 0.40 ? 1 : p < 0.60 ? 2 : p < 0.80 ? 3 : 4;
            for (let i = 0; i < 5; i++) {
                const { dot, label } = this._progressDots[i];
                const isActive = i === activeScene;
                dot.style.background = isActive ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.1)';
                dot.style.boxShadow = isActive ? '0 0 8px rgba(255,255,255,0.3)' : 'none';
                dot.style.width = dot.style.height = isActive ? '5px' : '4px';
                label.style.color = isActive ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0)';
            }
        }

        /* ── Camera: descent from heavens to deep ── */
        const camY = lerp(6, -3, clamp01(p * 1.1));
        const camOrbit = t * 0.015 * motionScale + this.mouseSmooth.x * 0.25;
        const camRadius = lerp(16, 14, clamp01(p));
        this.camera.position.set(
            Math.sin(camOrbit) * camRadius,
            camY + this.mouseSmooth.y * 2,
            Math.cos(camOrbit) * camRadius
        );
        this.camera.lookAt(0, lerp(3, -3, clamp01(p)), 0);

        /* ── Bloom modulation ── */
        if (this.bloom) {
            this.bloom.strength = lerp(1.4, 0.8, clamp01(p));
        }

        /* ── Light intensity modulation ── */
        this._sunLight.intensity = lerp(0.9, 0.2, clamp01(p * 2));
        this._dragonLight.intensity = lerp(0.3, 0.6, clamp01(p * 1.5));
    }

    /* ── Annotation visibility helper with entrance animation ── */
    _setAnnotation(el, opacity) {
        if (!el) return;
        if (opacity < 0.01) {
            el.style.opacity = '0';
            el.style.display = 'none';
            el.classList.remove('ch8-entering');
            el._ch8Shown = false;
            return;
        }
        el.style.display = '';
        /* Trigger entrance animation on first appearance */
        if (!el._ch8Shown && opacity > 0.1) {
            el._ch8Shown = true;
            el.classList.add('ch8-entering');
        }
        el.style.opacity = opacity;
        const yShift = lerp(16, 0, clamp01(opacity * 2.5));
        const current = el.style.transform || '';
        const base = current.replace(/translateY\([^)]+\)/g, '');
        el.style.transform = base + ` translateY(${yShift}px)`;
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
        if (this._onScroll) removeEventListener('scroll', this._onScroll);
        if (this._onWheel) removeEventListener('wheel', this._onWheel);
        if (this._overlay) this._overlay.remove();
        if (this._progressContainer) this._progressContainer.remove();
        if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
        this.scene?.traverse(o => {
            o.geometry?.dispose();
            if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        });
        this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
