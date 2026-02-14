/**
 * ThreeHistoryViz.js — Chapter 8: "The Historical Significance of the Fish"
 *
 * Jung: The star-crowned woman of Revelation 12 gives birth while pursued by
 * the dragon. The fish hangs on the cross-hook as bait to catch Leviathan.
 * Tobit's healing fish restores sight. The Aries age fades into Pisces.
 *
 * Visual: A star-crowned woman above with a dragon pursuing below. A fish
 * dangling on a cross-hook over dark waters. A green-glowing healing fish.
 * An Aries ram shape fading into a Pisces fish at the zodiac boundary.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const STAR_GOLD = new THREE.Color('#ffd700');
const WOMAN_WHITE = new THREE.Color('#f0f0ff');
const DRAGON_RED = new THREE.Color('#8b0000');
const HOOK_SILVER = new THREE.Color('#c0c0c0');
const FISH_CYAN = new THREE.Color('#22d3ee');
const HEAL_GREEN = new THREE.Color('#32cd32');
const ARIES_RED = new THREE.Color('#ff4444');
const PISCES_BLUE = new THREE.Color('#4a90d9');
const WATER_DARK = new THREE.Color('#0a1a2a');
const VOID = 0x030310;

export default class ThreeHistoryViz extends BaseViz {
    constructor(container, opts = {}) {
        super(container, Object.assign({ contextType: 'webgl' }, opts));
    }

    async init() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'high-performance',
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(VOID);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(VOID, 0.012);

        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 2, 14);

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this._onMouseMove = this._onMouseMove.bind(this);
        window.addEventListener('mousemove', this._onMouseMove);

        this._createStarCrownedWoman();
        this._createDragon();
        this._createHookBait();
        this._createHealingFish();
        this._createAriesPisces();
        this._createWaterField();
        this._createLights();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.2, 0.5, 0.4
        );
        this.composer.addPass(this.bloomPass);
    }

    /* ═══ 1. Star-Crowned Woman (Rev. 12) ═══ */
    _createStarCrownedWoman() {
        this.womanGroup = new THREE.Group();

        // Body — glowing sphere
        const bodyGeo = new THREE.SphereGeometry(0.5, 16, 16);
        bodyGeo.scale(0.7, 1.2, 0.5);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: WOMAN_WHITE, emissive: WOMAN_WHITE, emissiveIntensity: 0.5,
            transparent: true, opacity: 0.7,
        });
        this.womanBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.womanGroup.add(this.womanBody);

        // Crown of 12 stars
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const starGeo = new THREE.OctahedronGeometry(0.06, 0);
            const star = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({
                color: STAR_GOLD,
            }));
            star.position.set(Math.cos(angle) * 0.6, 0.7, Math.sin(angle) * 0.3);
            this.womanGroup.add(star);
        }

        // Aura
        const auraGeo = new THREE.SphereGeometry(1.5, 16, 16);
        const auraMat = new THREE.MeshBasicMaterial({
            color: STAR_GOLD, transparent: true, opacity: 0.04,
            blending: THREE.AdditiveBlending,
        });
        this.womanGroup.add(new THREE.Mesh(auraGeo, auraMat));

        this.womanGroup.position.set(-2, 4, 0);
        this.scene.add(this.womanGroup);
    }

    /* ═══ 2. Dragon Pursuing ═══ */
    _createDragon() {
        this.dragonGroup = new THREE.Group();

        // Serpentine body
        const bodyGeo = new THREE.TorusKnotGeometry(1, 0.15, 64, 8, 2, 3);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: DRAGON_RED, emissive: DRAGON_RED, emissiveIntensity: 0.4,
            metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.6,
        });
        this.dragonBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.dragonGroup.add(this.dragonBody);

        // Seven heads (simplified as small spheres)
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2;
            const headGeo = new THREE.SphereGeometry(0.12, 8, 8);
            const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({
                color: DRAGON_RED, emissive: '#ff0000', emissiveIntensity: 0.5,
            }));
            head.position.set(Math.cos(angle) * 1.2, Math.sin(angle) * 0.5 + 0.5, Math.sin(angle) * 0.5);
            this.dragonGroup.add(head);
        }

        this.dragonGroup.position.set(-2, -3, 0);
        this.dragonGroup.scale.setScalar(0.8);
        this.scene.add(this.dragonGroup);
    }

    /* ═══ 3. Hook / Bait Motif ═══ */
    _createHookBait() {
        this.hookGroup = new THREE.Group();

        // Hook line (vertical)
        const linePoints = [new THREE.Vector3(0, 3, 0), new THREE.Vector3(0, -1, 0)];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
        this.hookGroup.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
            color: HOOK_SILVER, transparent: true, opacity: 0.3,
        })));

        // Hook curve
        const curvePoints = [];
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            curvePoints.push(new THREE.Vector3(
                Math.sin(t * Math.PI) * 0.3,
                -1 - t * 0.5,
                0
            ));
        }
        const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        this.hookGroup.add(new THREE.Line(curveGeo, new THREE.LineBasicMaterial({
            color: HOOK_SILVER, transparent: true, opacity: 0.4,
        })));

        // Cross at hook-top
        const crossV = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.5, 0.04),
            new THREE.MeshBasicMaterial({ color: STAR_GOLD })
        );
        crossV.position.y = 3.2;
        this.hookGroup.add(crossV);
        const crossH = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.04, 0.04),
            new THREE.MeshBasicMaterial({ color: STAR_GOLD })
        );
        crossH.position.y = 3.3;
        this.hookGroup.add(crossH);

        // Fish on hook — dangling bait
        const fishGeo = new THREE.SphereGeometry(0.15, 8, 6);
        fishGeo.scale(2, 0.6, 0.4);
        this.baitFish = new THREE.Mesh(fishGeo, new THREE.MeshStandardMaterial({
            color: FISH_CYAN, emissive: FISH_CYAN, emissiveIntensity: 0.4,
            transparent: true, opacity: 0.7,
        }));
        this.baitFish.position.y = -1.5;
        this.hookGroup.add(this.baitFish);

        this.hookGroup.position.set(3, 0, 1);
        this.scene.add(this.hookGroup);
    }

    /* ═══ 4. Healing Fish (Tobit) ═══ */
    _createHealingFish() {
        this.healFishGroup = new THREE.Group();

        const bodyGeo = new THREE.SphereGeometry(0.2, 10, 8);
        bodyGeo.scale(2, 0.7, 0.5);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: HEAL_GREEN, emissive: HEAL_GREEN, emissiveIntensity: 0.6,
            transparent: true, opacity: 0.6,
        });
        this.healFish = new THREE.Mesh(bodyGeo, bodyMat);
        this.healFishGroup.add(this.healFish);

        // Healing aura
        const auraGeo = new THREE.SphereGeometry(0.6, 12, 12);
        this.healAura = new THREE.Mesh(auraGeo, new THREE.MeshBasicMaterial({
            color: HEAL_GREEN, transparent: true, opacity: 0.05,
            blending: THREE.AdditiveBlending,
        }));
        this.healFishGroup.add(this.healAura);

        this.healFishGroup.position.set(-4, -1, 2);
        this.scene.add(this.healFishGroup);
    }

    /* ═══ 5. Aries → Pisces Transition ═══ */
    _createAriesPisces() {
        // Ram shape (Aries) — cone + horn shapes, fading
        this.ariesGroup = new THREE.Group();
        const ramBody = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.5, 0),
            new THREE.MeshStandardMaterial({
                color: ARIES_RED, emissive: ARIES_RED, emissiveIntensity: 0.3,
                transparent: true, opacity: 0.5,
            })
        );
        this.ariesGroup.add(ramBody);
        for (let side = -1; side <= 1; side += 2) {
            const hornGeo = new THREE.TorusGeometry(0.2, 0.04, 8, 16, Math.PI);
            const horn = new THREE.Mesh(hornGeo, new THREE.MeshStandardMaterial({
                color: ARIES_RED, emissive: ARIES_RED, emissiveIntensity: 0.3,
                transparent: true, opacity: 0.5,
            }));
            horn.position.set(side * 0.3, 0.3, 0.2);
            horn.rotation.x = -Math.PI / 4;
            this.ariesGroup.add(horn);
        }
        this.ariesGroup.position.set(5, 2, -2);
        this.scene.add(this.ariesGroup);

        // Fish shape (Pisces) — emerging
        this.piscesGroup = new THREE.Group();
        const fishBody = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 10, 8).scale(2, 0.7, 0.5),
            new THREE.MeshStandardMaterial({
                color: PISCES_BLUE, emissive: PISCES_BLUE, emissiveIntensity: 0.4,
                transparent: true, opacity: 0,
            })
        );
        this.piscesFish = fishBody;
        this.piscesGroup.add(fishBody);
        this.piscesGroup.position.set(5, 2, -2);
        this.scene.add(this.piscesGroup);
    }

    /* ═══ 6. Dark Water Field ═══ */
    _createWaterField() {
        const count = 600;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = -3 + (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.waterField = new THREE.Points(geo, new THREE.PointsMaterial({
            color: WATER_DARK, size: 0.08, transparent: true, opacity: 0.3,
            depthWrite: false,
        }));
        this.scene.add(this.waterField);
    }

    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));
        this.scene.add(Object.assign(new THREE.PointLight(0xffd700, 0.8, 15), { position: new THREE.Vector3(-2, 5, 3) }));
        this.scene.add(Object.assign(new THREE.PointLight(0x8b0000, 0.5, 15), { position: new THREE.Vector3(-2, -4, 3) }));
        this.scene.add(Object.assign(new THREE.PointLight(0x32cd32, 0.3, 10), { position: new THREE.Vector3(-4, -1, 3) }));
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.03);

        // Woman hover
        this.womanGroup.position.y = 4 + Math.sin(t * 0.15) * 0.3;

        // Dragon pursuing — circles below
        const dragonAngle = t * 0.08;
        this.dragonGroup.position.set(
            -2 + Math.cos(dragonAngle) * 2,
            -3 + Math.sin(t * 0.2) * 0.3,
            Math.sin(dragonAngle) * 2
        );
        this.dragonBody.rotation.x = t * 0.1;
        this.dragonBody.rotation.y = t * 0.15;

        // Hook sway
        this.hookGroup.rotation.z = Math.sin(t * 0.12) * 0.05;
        this.baitFish.rotation.z = Math.sin(t * 0.3) * 0.1;

        // Healing fish swim
        this.healFishGroup.position.x = -4 + Math.sin(t * 0.08) * 2;
        this.healFishGroup.position.y = -1 + Math.sin(t * 0.15) * 0.3;
        this.healAura.material.opacity = 0.04 + Math.sin(t * 0.5) * 0.03;

        // Aries → Pisces fade
        const transProgress = Math.min(1, t / 90);
        this.ariesGroup.traverse(c => { if (c.material) c.material.opacity = 0.5 * (1 - transProgress); });
        this.piscesFish.material.opacity = 0.6 * transProgress;

        // Water undulation
        const waterPos = this.waterField.geometry.attributes.position.array;
        for (let i = 0; i < 600; i++) {
            waterPos[i * 3 + 1] = -3 + Math.sin(t * 0.2 + waterPos[i * 3] * 0.3) * 0.3;
        }
        this.waterField.geometry.attributes.position.needsUpdate = true;

        // Camera
        const camAngle = t * 0.015 + this.mouseSmooth.x * 0.3;
        const camH = 2 + this.mouseSmooth.y * 3;
        this.camera.position.set(Math.sin(camAngle) * 14, camH, Math.cos(camAngle) * 14);
        this.camera.lookAt(0, 0, 0);

        if (this.bloomPass) this.bloomPass.strength = 1.0 + Math.sin(t * 0.1) * 0.3;
    }

    render() { this.composer?.render(); }

    onResize(w, h) {
        if (!this.renderer || !this.camera) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.composer?.setSize(w, h);
        this.bloomPass?.setSize(w, h);
    }

    _onMouseMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    dispose() {
        window.removeEventListener('mousemove', this._onMouseMove);
        if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
        this.scene?.traverse(o => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
        this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
