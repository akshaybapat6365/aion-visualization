/**
 * ThreeAeonViz.js — Chapter 6: "The Sign of the Fishes"
 *
 * Jung: Two fish swimming in opposite directions, connected by a
 * commissure thread. Saturn as the "black star." The Great Conjunction
 * of Saturn and Jupiter marks the birth of a new aeon. The spring
 * point precesses through the zodiac.
 *
 * Visual: A zodiac wheel with two fish swimming opposite directions,
 * linked by a golden thread. A dark Saturn body orbited by a lion and
 * serpent. A conjunction flash when Saturn meets Jupiter. The spring
 * point marker precesses along the wheel.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const ZODIAC_GOLD = new THREE.Color('#c8a820');
const FISH_SILVER = new THREE.Color('#b0c4de');
const FISH_DARK = new THREE.Color('#2a3a5a');
const COMMISSURE = new THREE.Color('#ffd700');
const SATURN_BLACK = new THREE.Color('#1a1a28');
const SATURN_RING = new THREE.Color('#4a4a5a');
const JUPITER_AMBER = new THREE.Color('#d4a030');
const LION_RED = new THREE.Color('#c0392b');
const SERPENT_GREEN = new THREE.Color('#2ecc71');
const CONJUNCTION = new THREE.Color('#ffffff');
const SPRING_POINT = new THREE.Color('#ff6600');
const VOID = 0x030310;

const ZODIAC_RADIUS = 5;

export default class ThreeAeonViz extends BaseViz {
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
        this.scene.fog = new THREE.FogExp2(VOID, 0.01);

        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 5, 12);

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this._onMouseMove = this._onMouseMove.bind(this);
        window.addEventListener('mousemove', this._onMouseMove);

        this._createZodiacWheel();
        this._createTwoFish();
        this._createSaturn();
        this._createJupiter();
        this._createSpringPoint();
        this._createStarfield();
        this._createLights();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.2, 0.6, 0.4
        );
        this.composer.addPass(this.bloomPass);
    }

    /* ═══ 1. Zodiac Wheel ═══ */
    _createZodiacWheel() {
        this.wheelGroup = new THREE.Group();

        // Main ring
        const ringGeo = new THREE.TorusGeometry(ZODIAC_RADIUS, 0.03, 8, 128);
        const ringMat = new THREE.MeshBasicMaterial({
            color: ZODIAC_GOLD, transparent: true, opacity: 0.25,
            blending: THREE.AdditiveBlending,
        });
        this.wheelGroup.add(new THREE.Mesh(ringGeo, ringMat));

        // 12 segment markers
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const markerGeo = new THREE.SphereGeometry(0.06, 8, 8);
            const marker = new THREE.Mesh(markerGeo, new THREE.MeshBasicMaterial({
                color: ZODIAC_GOLD, transparent: true, opacity: 0.4,
            }));
            marker.position.set(Math.cos(angle) * ZODIAC_RADIUS, 0, Math.sin(angle) * ZODIAC_RADIUS);
            this.wheelGroup.add(marker);

            // Spoke lines
            const spoke = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(Math.cos(angle) * (ZODIAC_RADIUS - 0.3), 0, Math.sin(angle) * (ZODIAC_RADIUS - 0.3)),
                    new THREE.Vector3(Math.cos(angle) * (ZODIAC_RADIUS + 0.3), 0, Math.sin(angle) * (ZODIAC_RADIUS + 0.3)),
                ]),
                new THREE.LineBasicMaterial({ color: ZODIAC_GOLD, transparent: true, opacity: 0.15 })
            );
            this.wheelGroup.add(spoke);
        }

        this.wheelGroup.rotation.x = -Math.PI / 6; // Tilt for perspective
        this.scene.add(this.wheelGroup);
    }

    /* ═══ 2. Two Fish — opposite directions, commissure thread ═══ */
    _createTwoFish() {
        this.fishPair = [];

        for (let i = 0; i < 2; i++) {
            const group = new THREE.Group();
            const bodyGeo = new THREE.SphereGeometry(0.2, 10, 8);
            bodyGeo.scale(2, 0.6, 0.4);
            const color = i === 0 ? FISH_SILVER : FISH_DARK;
            const mat = new THREE.MeshStandardMaterial({
                color, emissive: color, emissiveIntensity: 0.4,
                transparent: true, opacity: 0.7, metalness: 0.4, roughness: 0.3,
            });
            const body = new THREE.Mesh(bodyGeo, mat);
            group.add(body);

            // Tail
            const tailGeo = new THREE.ConeGeometry(0.1, 0.25, 4);
            const tail = new THREE.Mesh(tailGeo, mat.clone());
            tail.position.x = -0.45;
            tail.rotation.z = Math.PI / 2;
            group.add(tail);

            // Eye
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.03, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            );
            eye.position.set(0.3, 0.05, 0.15);
            group.add(eye);

            this.scene.add(group);
            this.fishPair.push({ group, direction: i === 0 ? 1 : -1 });
        }

        // Commissure thread
        this.commissureLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
            new THREE.LineBasicMaterial({ color: COMMISSURE, transparent: true, opacity: 0.3 })
        );
        this.scene.add(this.commissureLine);
    }

    /* ═══ 3. Saturn — "black star" ═══ */
    _createSaturn() {
        this.saturnGroup = new THREE.Group();

        // Saturn body
        const bodyGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: SATURN_BLACK, emissive: '#0a0a18', emissiveIntensity: 0.3,
            metalness: 0.8, roughness: 0.2,
        });
        this.saturnBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.saturnGroup.add(this.saturnBody);

        // Saturn ring
        const sRingGeo = new THREE.TorusGeometry(1, 0.05, 4, 64);
        const sRingMat = new THREE.MeshBasicMaterial({
            color: SATURN_RING, transparent: true, opacity: 0.3,
        });
        const sRing = new THREE.Mesh(sRingGeo, sRingMat);
        sRing.rotation.x = Math.PI / 3;
        this.saturnGroup.add(sRing);

        // Orbiting lion
        const lionGeo = new THREE.ConeGeometry(0.12, 0.25, 5);
        this.saturnLion = new THREE.Mesh(lionGeo, new THREE.MeshStandardMaterial({
            color: LION_RED, emissive: LION_RED, emissiveIntensity: 0.4,
        }));
        this.saturnGroup.add(this.saturnLion);

        // Orbiting serpent
        const serpGeo = new THREE.TorusKnotGeometry(0.1, 0.02, 32, 6, 2, 3);
        this.saturnSerpent = new THREE.Mesh(serpGeo, new THREE.MeshStandardMaterial({
            color: SERPENT_GREEN, emissive: SERPENT_GREEN, emissiveIntensity: 0.4,
        }));
        this.saturnGroup.add(this.saturnSerpent);

        this.saturnGroup.position.set(-3, 2, -2);
        this.scene.add(this.saturnGroup);
    }

    /* ═══ 4. Jupiter ═══ */
    _createJupiter() {
        const jupGeo = new THREE.SphereGeometry(0.4, 12, 12);
        const jupMat = new THREE.MeshStandardMaterial({
            color: JUPITER_AMBER, emissive: JUPITER_AMBER, emissiveIntensity: 0.3,
            metalness: 0.5, roughness: 0.4,
        });
        this.jupiter = new THREE.Mesh(jupGeo, jupMat);
        this.jupiter.position.set(3, 2, -2);
        this.scene.add(this.jupiter);

        // Conjunction flash sphere (hidden until aligned)
        const flashGeo = new THREE.SphereGeometry(2, 16, 16);
        this.conjFlash = new THREE.Mesh(flashGeo, new THREE.MeshBasicMaterial({
            color: CONJUNCTION, transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.conjFlash);
    }

    /* ═══ 5. Spring Point ═══ */
    _createSpringPoint() {
        const geo = new THREE.OctahedronGeometry(0.15, 0);
        const mat = new THREE.MeshStandardMaterial({
            color: SPRING_POINT, emissive: SPRING_POINT, emissiveIntensity: 0.6,
        });
        this.springPoint = new THREE.Mesh(geo, mat);
        this.wheelGroup.add(this.springPoint);
    }

    /* ═══ 6. Starfield ═══ */
    _createStarfield() {
        const count = 800;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 8 + Math.random() * 25;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.starfield = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x6666aa, size: 0.04, transparent: true, opacity: 0.3,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.starfield);
    }

    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));
        this.scene.add(Object.assign(new THREE.PointLight(0xc8a820, 0.6, 15), { position: new THREE.Vector3(0, 3, 5) }));
        this.scene.add(Object.assign(new THREE.PointLight(0x4a4a7a, 0.4, 20), { position: new THREE.Vector3(-3, 3, -3) }));
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.03);

        // Fish swimming opposite on zodiac ring
        for (let i = 0; i < 2; i++) {
            const fish = this.fishPair[i];
            const angle = fish.direction * t * 0.04 + (i === 0 ? 0 : Math.PI);
            const r = ZODIAC_RADIUS;
            fish.group.position.set(
                Math.cos(angle) * r,
                Math.sin(t * 0.1 + i * 3) * 0.3,
                Math.sin(angle) * r
            );
            fish.group.rotation.y = angle + (fish.direction > 0 ? Math.PI / 2 : -Math.PI / 2);
        }

        // Commissure thread
        const linePos = this.commissureLine.geometry.attributes.position.array;
        const f0 = this.fishPair[0].group.position;
        const f1 = this.fishPair[1].group.position;
        linePos[0] = f0.x; linePos[1] = f0.y; linePos[2] = f0.z;
        linePos[3] = f1.x; linePos[4] = f1.y; linePos[5] = f1.z;
        this.commissureLine.geometry.attributes.position.needsUpdate = true;

        // Saturn orbiting lion/serpent
        const lionAngle = t * 0.2;
        this.saturnLion.position.set(Math.cos(lionAngle) * 1.5, Math.sin(lionAngle) * 0.5, Math.sin(lionAngle) * 1.5);
        const serpAngle = t * 0.15 + Math.PI;
        this.saturnSerpent.position.set(Math.cos(serpAngle) * 1.3, Math.sin(serpAngle) * 0.3, Math.sin(serpAngle) * 1.3);
        this.saturnGroup.rotation.y = t * 0.02;

        // Jupiter orbit
        const jupAngle = t * 0.025;
        this.jupiter.position.set(Math.cos(jupAngle) * 4, 2 + Math.sin(t * 0.08) * 0.3, Math.sin(jupAngle) * 4);

        // Conjunction flash — when Saturn and Jupiter close
        const dist = this.saturnGroup.position.distanceTo(this.jupiter.position);
        const conjIntensity = Math.max(0, 1 - dist / 3);
        this.conjFlash.material.opacity = conjIntensity * 0.15;
        this.conjFlash.position.lerpVectors(this.saturnGroup.position, this.jupiter.position, 0.5);

        // Spring point precessing along wheel
        const springAngle = t * 0.005; // Very slow precession
        this.springPoint.position.set(
            Math.cos(springAngle) * ZODIAC_RADIUS,
            0,
            Math.sin(springAngle) * ZODIAC_RADIUS
        );

        // Wheel slow rotation
        this.wheelGroup.rotation.y = t * 0.008;

        // Camera
        const camAngle = t * 0.015 + this.mouseSmooth.x * 0.3;
        const camH = 4 + this.mouseSmooth.y * 3;
        this.camera.position.set(Math.sin(camAngle) * 12, camH, Math.cos(camAngle) * 12);
        this.camera.lookAt(0, 0.5, 0);

        this.starfield.rotation.y += dt * 0.001;

        if (this.bloomPass) this.bloomPass.strength = 1.0 + Math.sin(t * 0.1) * 0.3 + conjIntensity * 0.5;
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
