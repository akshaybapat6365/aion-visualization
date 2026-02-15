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

/* ── Palette ── */
const STAR_GOLD = new THREE.Color('#ffd700');
const WOMAN_WHITE = new THREE.Color('#f0f0ff');
const DRAGON_RED = new THREE.Color('#8b0000');
const HOOK_SILVER = new THREE.Color('#c0c0c8');
const FISH_CYAN = new THREE.Color('#22d3ee');
const HEAL_GREEN = new THREE.Color('#32cd32');
const ARIES_RED = new THREE.Color('#ff4444');
const PISCES_BLUE = new THREE.Color('#4a90d9');
const WATER_DARK = new THREE.Color('#0a1a2a');
const VOID = 0x030310;

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
    constructor(c, o = {}) { super(c, Object.assign({ contextType: 'webgl' }, o)); }

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
        R.toneMappingExposure = 1.0;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(VOID, 0.01);
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

        /* ── Scroll state ── */
        this._scrollP = 0;
        this._scrollDiv = document.createElement('div');
        Object.assign(this._scrollDiv.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw',
            height: '500vh', pointerEvents: 'none', zIndex: '-1',
        });
        document.body.style.height = '500vh';
        this._onScroll = () => {
            const maxScroll = document.body.scrollHeight - innerHeight;
            this._scrollP = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        };
        addEventListener('scroll', this._onScroll, { passive: true });

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

        /* Seven heads */
        this._dragonHeads = [];
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2;
            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.14, 8, 8),
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
            color: PISCES_BLUE, emissive: STAR_GOLD, emissiveIntensity: 0.2,
            transparent: true, opacity: 0, roughness: 0.5, metalness: 0.3,
        }));
        this._deepFish.position.set(0, -5, 0);
        this.scene.add(this._deepFish);

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
        this.scene.add(new THREE.AmbientLight(0x0a0a18, 0.35));
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
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '10',
        });

        const makeAnnotation = (text, cssExtras = '') => {
            const el = document.createElement('div');
            Object.assign(el.style, {
                position: 'absolute',
                fontFamily: '"Instrument Serif", "Playfair Display", serif',
                fontStyle: 'italic',
                opacity: '0',
                transition: 'opacity 0.8s ease, transform 0.8s ease',
                transform: 'translateY(12px)',
                pointerEvents: 'none',
                textAlign: 'center',
                letterSpacing: '0.03em',
                textShadow: '0 2px 20px rgba(0,0,0,0.6)',
            });
            el.setAttribute('style', el.style.cssText + cssExtras);
            el.innerHTML = text;
            overlay.appendChild(el);
            return el;
        };

        // Annotation 1 — Celestial Vision
        this._ann1 = makeAnnotation(
            'A woman clothed with the sun',
            'top:12%;left:50%;transform:translateX(-50%) translateY(12px);' +
            'font-size:1.5rem;color:rgba(255,215,0,0.85);'
        );

        // Annotation 2 — Hook of Consciousness
        this._ann2 = makeAnnotation(
            'The Cross as Hook, Christ as Bait',
            'top:50%;left:50%;transform:translate(-50%,-50%) translateY(12px);' +
            'font-size:1.35rem;color:rgba(200,200,210,0.85);'
        );

        // Annotation 3 — Healing Fish
        this._ann3 = makeAnnotation(
            'The fish that heals blindness',
            'top:45%;left:35%;transform:translateY(12px);' +
            'font-size:1.3rem;color:rgba(50,205,50,0.8);'
        );

        // Annotation 4 — Great Transition
        this._ann4 = makeAnnotation(
            'From the Ram to the Fish',
            'top:50%;left:50%;transform:translate(-50%,-50%) translateY(12px);' +
            'font-size:1.4rem;' +
            'background:linear-gradient(90deg,rgba(255,68,68,0.85),rgba(74,144,217,0.85));' +
            '-webkit-background-clip:text;-webkit-text-fill-color:transparent;' +
            'background-clip:text;'
        );

        // Annotation 5 — Primordial Deep
        this._ann5 = makeAnnotation(
            'In the depths, the Self',
            'bottom:18%;left:50%;transform:translateX(-50%) translateY(12px);' +
            'font-size:1.5rem;color:rgba(74,144,217,0.75);'
        );

        this.canvas.parentElement.appendChild(overlay);
        this._overlay = overlay;
    }

    /* ═══════════════════════════════════════════════════════════════
       UPDATE — Scroll-driven animation
       ═══════════════════════════════════════════════════════════════ */
    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        const p = this._scrollP;
        this.mouseSmooth.lerp(this.mouse, 0.03);

        /* ── Scene 1: Celestial Vision ── */
        const s1 = clamp01(1 - p / S1_END);  // 1 at start, 0 by S1_END
        this._s1.visible = s1 > 0.01;
        if (this._s1.visible) {
            // Woman hover
            this._womanBody.position.y = 5 + Math.sin(t * 0.15) * 0.3;
            this._womanAura.position.copy(this._womanBody.position);

            // Stars orbit slowly
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + t * 0.05;
                this._stars[i].position.set(
                    Math.cos(angle) * 0.75,
                    this._womanBody.position.y + 0.85,
                    Math.sin(angle) * 0.4
                );
                this._stars[i].rotation.y = t * 0.3;
            }

            // Dragon pursuing — circles below the woman
            const dragonA = t * 0.08;
            this._dragonGroup.position.set(
                Math.cos(dragonA) * 2.5,
                -1 + Math.sin(t * 0.2) * 0.3,
                Math.sin(dragonA) * 2.5
            );
            this._dragonBody.rotation.x = t * 0.1;
            this._dragonBody.rotation.y = t * 0.15;

            // Heads pulsate
            for (const h of this._dragonHeads) {
                h.material.emissiveIntensity = 0.4 + Math.sin(t * 2 + h.position.x) * 0.3;
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
            this._s2.rotation.z = Math.sin(t * 0.12) * 0.04;
            // Bait fish wiggle
            this._baitFish.rotation.z = Math.sin(t * 0.3) * 0.12;
            this._baitTail.rotation.z = this._baitFish.rotation.z;
            this._baitTail.position.copy(this._baitFish.position);

            // Leviathan undulation (vertex displacement)
            const levPos = this._leviathan.geometry.attributes.position.array;
            const orig = this._levOrigPositions;
            for (let i = 0; i < levPos.length; i += 3) {
                levPos[i] = orig[i] + Math.sin(t * 0.3 + orig[i + 1] * 2) * 0.15;
                levPos[i + 1] = orig[i + 1] + Math.sin(t * 0.25 + orig[i] * 1.5) * 0.1;
            }
            this._leviathan.geometry.attributes.position.needsUpdate = true;

            // Leviathan eye pulse
            this._levEye.material.opacity = 0.2 + Math.sin(t * 0.8) * 0.15;

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
            this._healFish.position.x = Math.sin(t * 0.08) * 1.5;
            this._healFish.position.y = Math.sin(t * 0.15) * 0.3;

            // Glow pulse
            const healPulse = 0.5 + Math.sin(t * 0.5) * 0.5;
            this._healGlow.material.opacity = (0.04 + healPulse * 0.06) * s3;
            this._healAuraOuter.material.opacity = (0.01 + healPulse * 0.03) * s3;
            this._healGlow.scale.setScalar(1 + healPulse * 0.3);

            // Healing particles orbit
            const pPos = this._healParticles.geometry.attributes.position.array;
            const oPos = this._healParticleOrigPos;
            for (let i = 0; i < pPos.length; i += 3) {
                const a = t * 0.2 + oPos[i] * 0.5;
                pPos[i] = oPos[i] * Math.cos(a * 0.1) + Math.sin(a) * 0.1;
                pPos[i + 1] = oPos[i + 1] + Math.sin(t * 0.3 + oPos[i]) * 0.15;
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
            this._ariesGroup.rotation.y = t * 0.05 + transP * Math.PI;
            this._piscesGroup.rotation.y = -t * 0.06;

            // Zodiac arc brightens
            this._zodiacArc.material.opacity = (0.1 + transP * 0.2) * s4;
        }

        /* ── Scene 5: Primordial Deep ── */
        const s5 = smoothstep(S5_START, S5_START + 0.08, p);
        if (s5 > 0.01) {
            // Water undulation
            const waterPos = this._waterField.geometry.attributes.position.array;
            for (let i = 0; i < waterPos.length; i += 3) {
                waterPos[i + 1] += Math.sin(t * 0.2 + waterPos[i] * 0.3) * 0.003;
            }
            this._waterField.geometry.attributes.position.needsUpdate = true;
            this._waterField.material.opacity = 0.35 * s5;

            // Deep fish emerges
            this._deepFish.material.opacity = 0.5 * s5;
            this._deepFish.position.y = -5 + s5 * 1.5;
            this._deepFish.rotation.y = t * 0.05;
            this._deepFishGlow.material.opacity = 0.04 * s5;
            this._deepFishGlow.position.copy(this._deepFish.position);
            this._deepFishGlow.scale.setScalar(1 + Math.sin(t * 0.3) * 0.2);
        } else {
            this._waterField.material.opacity = 0.08;
            this._deepFish.material.opacity = 0;
            this._deepFishGlow.material.opacity = 0;
        }

        /* ── Annotations ── */
        this._setAnnotation(this._ann1, smoothstep(0.02, 0.08, p) * (1 - smoothstep(0.14, 0.20, p)));
        this._setAnnotation(this._ann2, smoothstep(0.22, 0.28, p) * (1 - smoothstep(0.34, 0.40, p)));
        this._setAnnotation(this._ann3, smoothstep(0.42, 0.48, p) * (1 - smoothstep(0.54, 0.60, p)));
        this._setAnnotation(this._ann4, smoothstep(0.62, 0.68, p) * (1 - smoothstep(0.74, 0.80, p)));
        this._setAnnotation(this._ann5, smoothstep(0.82, 0.88, p));

        /* ── Camera: descent from heavens to deep ── */
        const camY = lerp(6, -3, clamp01(p * 1.1));
        const camOrbit = t * 0.015 + this.mouseSmooth.x * 0.25;
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

    /* ── Annotation visibility helper ── */
    _setAnnotation(el, opacity) {
        if (!el) return;
        el.style.opacity = opacity;
        const yShift = lerp(12, 0, clamp01(opacity * 3));
        // Preserve existing transform base, just modify translateY
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
        removeEventListener('scroll', this._onScroll);
        document.body.style.height = '';
        if (this._overlay) this._overlay.remove();
        if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
        this.scene?.traverse(o => {
            o.geometry?.dispose();
            if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        });
        this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
