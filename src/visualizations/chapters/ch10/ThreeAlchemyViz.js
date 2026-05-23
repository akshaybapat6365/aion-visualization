/**
 * ThreeAlchemyViz.js — Chapter 10: "The Fish in Alchemy"
 *
 * Jung: The echeneis/remora — a tiny fish that stops great ships.
 * The "magnet of the wise" draws secrets from the depths. The lapis
 * animatus has a heartbeat. Two yoked fish plough from nigredo to rubedo.
 *
 * Visual: A tiny glowing fish halting a massive ghostly ship. A magnetic
 * field pulling luminous particles from black depths. A pulsing stone
 * with a heartbeat. Two yoked fish dragging a plough through alchemical
 * stages (nigredo black → albedo white → citrinitas yellow → rubedo red).
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const NIGREDO_BLACK = new THREE.Color('#0a0a0a');
const ALBEDO_WHITE = new THREE.Color('#e8e8f0');
const CITRINITAS = new THREE.Color('#ffd700');
const RUBEDO_RED = new THREE.Color('#c0392b');
const ECHENEIS_CYAN = new THREE.Color('#22d3ee');
const SHIP_GREY = new THREE.Color('#3a3a4a');
const MAGNET_PURPLE = new THREE.Color('#6a2c91');
const LAPIS_GOLD = new THREE.Color('#d4af37');
const YOKE_BROWN = new THREE.Color('#8b6914');
const VOID = 0x030308;

const MAGNET_PARTICLES = 200;

export default class ThreeAlchemyViz extends BaseViz {
    constructor(container, opts = {}) {
        super(container, Object.assign({ contextType: 'webgl' }, opts));
        this.panelState = { activePanelId: 'vessel', progress: 0 };
        this.vesselFocus = 1;
        this.primaFocus = 0;
        this.opusFocus = 0;
        this.reducedMotion = false;
    }

    setPanelState(state = {}) {
        this.panelState = Object.assign(this.panelState || {}, state);
    }

    setReducedMotion(enabled) {
        this.reducedMotion = Boolean(enabled);
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
        this.camera.position.set(0, 3, 14);

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this._onMouseMove = this._onMouseMove.bind(this);
        window.addEventListener('mousemove', this._onMouseMove);

        this._createEcheneis();
        this._createShip();
        this._createMagnetField();
        this._createLapisAnimatus();
        this._createYokedFish();
        this._createAlchemicalGround();
        this._createLights();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.2, 0.5, 0.4
        );
        this.composer.addPass(this.bloomPass);
    }

    _createEcheneis() {
        this.echeneisGroup = new THREE.Group();
        const bodyGeo = new THREE.SphereGeometry(0.1, 10, 8);
        bodyGeo.scale(2, 0.5, 0.4);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: ECHENEIS_CYAN, emissive: ECHENEIS_CYAN, emissiveIntensity: 0.8,
            transparent: true, opacity: 0.8,
        });
        this.echeneisBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.echeneisGroup.add(this.echeneisBody);

        // Aura of stopping power
        const auraGeo = new THREE.SphereGeometry(0.5, 12, 12);
        this.echeneisAura = new THREE.Mesh(auraGeo, new THREE.MeshBasicMaterial({
            color: ECHENEIS_CYAN, transparent: true, opacity: 0.05,
            blending: THREE.AdditiveBlending,
        }));
        this.echeneisGroup.add(this.echeneisAura);

        this.echeneisGroup.position.set(-4, 2, 1);
        this.scene.add(this.echeneisGroup);
    }

    _createShip() {
        this.shipGroup = new THREE.Group();
        this.shipParts = [];

        // Hull — elongated box
        const hullGeo = new THREE.BoxGeometry(4, 0.8, 1.2);
        const hullMat = new THREE.MeshStandardMaterial({
            color: SHIP_GREY, transparent: true, opacity: 0.2,
            roughness: 0.8,
        });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        this.shipGroup.add(hull);
        this.shipParts.push(hull);

        // Mast
        const mastGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 6);
        const mast = new THREE.Mesh(mastGeo, new THREE.MeshStandardMaterial({
            color: SHIP_GREY, transparent: true, opacity: 0.25,
        }));
        mast.position.y = 1.5;
        this.shipGroup.add(mast);
        this.shipParts.push(mast);

        // Sail
        const sailGeo = new THREE.PlaneGeometry(1.5, 1.5);
        const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({
            color: '#5a5a6a', transparent: true, opacity: 0.15,
            side: THREE.DoubleSide,
        }));
        sail.position.set(0, 1.5, 0);
        this.shipGroup.add(sail);
        this.shipParts.push(sail);

        this.shipGroup.position.set(-2, 2, 0);
        this.scene.add(this.shipGroup);
    }

    _createMagnetField() {
        const count = MAGNET_PARTICLES;
        const positions = new Float32Array(count * 3);
        this.magnetBasePositions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 6;
            const y = -4 - Math.random() * 4;
            const z = (Math.random() - 0.5) * 4;
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            this.magnetBasePositions[i * 3] = x;
            this.magnetBasePositions[i * 3 + 1] = y;
            this.magnetBasePositions[i * 3 + 2] = z;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.magnetField = new THREE.Points(geo, new THREE.PointsMaterial({
            color: MAGNET_PURPLE, size: 0.08, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.magnetField);

        // Magnet core
        const magnetGeo = new THREE.OctahedronGeometry(0.3, 0);
        this.magnetCore = new THREE.Mesh(magnetGeo, new THREE.MeshStandardMaterial({
            color: MAGNET_PURPLE, emissive: MAGNET_PURPLE, emissiveIntensity: 0.6,
            transparent: true, opacity: 0.7,
        }));
        this.magnetCore.position.set(3, -1, 1);
        this.scene.add(this.magnetCore);
    }

    _createLapisAnimatus() {
        this.lapisGroup = new THREE.Group();

        const stoneGeo = new THREE.DodecahedronGeometry(0.5, 0);
        const stoneMat = new THREE.MeshStandardMaterial({
            color: LAPIS_GOLD, emissive: LAPIS_GOLD, emissiveIntensity: 0.4,
            metalness: 0.7, roughness: 0.2, transparent: true, opacity: 0.7,
        });
        this.lapisStone = new THREE.Mesh(stoneGeo, stoneMat);
        this.lapisGroup.add(this.lapisStone);

        // Heartbeat aura
        const heartGeo = new THREE.SphereGeometry(0.8, 16, 16);
        this.heartAura = new THREE.Mesh(heartGeo, new THREE.MeshBasicMaterial({
            color: RUBEDO_RED, transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending,
        }));
        this.lapisGroup.add(this.heartAura);

        this.lapisGroup.position.set(0, -2, 2);
        this.scene.add(this.lapisGroup);

        const vesselGeo = new THREE.SphereGeometry(1.25, 28, 18);
        vesselGeo.scale(1.15, 1.35, 1);
        this.vesselGlass = new THREE.Mesh(vesselGeo, new THREE.MeshBasicMaterial({
            color: 0x9fdcff,
            transparent: true,
            opacity: 0.035,
            blending: THREE.AdditiveBlending,
            wireframe: true,
            depthWrite: false,
        }));
        this.vesselGlass.position.copy(this.lapisGroup.position);
        this.scene.add(this.vesselGlass);
    }

    _createYokedFish() {
        this.yokeGroup = new THREE.Group();
        this.yokedFishParts = [];

        // Two fish
        for (let i = 0; i < 2; i++) {
            const bodyGeo = new THREE.SphereGeometry(0.12, 8, 6);
            bodyGeo.scale(2, 0.6, 0.4);
            const bodyMat = new THREE.MeshStandardMaterial({
                color: ECHENEIS_CYAN, emissive: ECHENEIS_CYAN, emissiveIntensity: 0.3,
                transparent: true, opacity: 0.6,
            });
            const fish = new THREE.Mesh(bodyGeo, bodyMat);
            fish.position.set(i === 0 ? -0.3 : 0.3, 0, 0);
            this.yokeGroup.add(fish);
            this.yokedFishParts.push(fish);
        }

        // Yoke bar
        const yokeGeo = new THREE.BoxGeometry(1, 0.04, 0.04);
        const yoke = new THREE.Mesh(yokeGeo, new THREE.MeshStandardMaterial({
            color: YOKE_BROWN, transparent: true, opacity: 0.5,
        }));
        this.yokeGroup.add(yoke);
        this.yokedFishParts.push(yoke);

        this.yokeGroup.position.set(-5, -3.5, 0);
        this.scene.add(this.yokeGroup);
    }

    _createAlchemicalGround() {
        // Four-stage ground strips: nigredo → albedo → citrinitas → rubedo
        const stages = [NIGREDO_BLACK, ALBEDO_WHITE, CITRINITAS, RUBEDO_RED];
        this.groundStrips = [];
        for (let i = 0; i < 4; i++) {
            const stripGeo = new THREE.PlaneGeometry(4, 1);
            const stripMat = new THREE.MeshBasicMaterial({
                color: stages[i], transparent: true, opacity: 0.06,
                side: THREE.DoubleSide,
            });
            const strip = new THREE.Mesh(stripGeo, stripMat);
            strip.rotation.x = -Math.PI / 2;
            strip.position.set(-5 + i * 3.5, -4, 0);
            this.scene.add(strip);
            this.groundStrips.push(strip);
        }
    }

    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));
        const echeneisLight = new THREE.PointLight(0x22d3ee, 0.6, 12);
        echeneisLight.position.set(-4, 3, 3);
        this.scene.add(echeneisLight);

        const magnetLight = new THREE.PointLight(0x6a2c91, 0.5, 15);
        magnetLight.position.set(3, -2, 3);
        this.scene.add(magnetLight);

        const lapisLight = new THREE.PointLight(0xd4af37, 0.4, 10);
        lapisLight.position.set(0, -2, 3);
        this.scene.add(lapisLight);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        const panelId = this.panelState?.activePanelId || 'vessel';
        const dampRate = this.reducedMotion ? 9 : 3.5;
        const motionScale = this.reducedMotion ? 0.12 : 1;
        this.vesselFocus = THREE.MathUtils.damp(this.vesselFocus, panelId === 'vessel' ? 1 : 0.22, dampRate, dt);
        this.primaFocus = THREE.MathUtils.damp(this.primaFocus, panelId === 'prima' ? 1 : 0.16, dampRate, dt);
        this.opusFocus = THREE.MathUtils.damp(this.opusFocus, panelId === 'opus' ? 1 : 0.16, dampRate, dt);
        this.mouseSmooth.lerp(this.mouse, 0.03);

        // Echeneis hovering near ship
        this.echeneisGroup.position.x = -3 + Math.sin(t * 0.08 * motionScale) * 0.3;
        this.echeneisGroup.position.y = 2 + Math.sin(t * 0.15 * motionScale) * 0.2;
        this.echeneisGroup.scale.setScalar(0.88 + this.vesselFocus * 0.28);
        this.echeneisBody.material.opacity = 0.36 + this.vesselFocus * 0.5;
        this.echeneisAura.material.opacity = (0.03 + Math.sin(t * 0.6 * motionScale) * 0.02) + this.vesselFocus * 0.13;

        // Ship halted — only rocking
        this.shipGroup.rotation.z = Math.sin(t * 0.12 * motionScale) * 0.03;
        this.shipGroup.position.y = 2 + Math.sin(t * 0.08 * motionScale) * 0.05;
        this.shipGroup.scale.setScalar(0.94 + this.vesselFocus * 0.08);
        this.shipParts?.forEach((part) => {
            part.material.opacity = (part === this.shipParts[2] ? 0.1 : 0.14) + this.vesselFocus * (part === this.shipParts[2] ? 0.16 : 0.18);
        });

        // Magnet drawing particles upward
        const magPos = this.magnetField.geometry.attributes.position.array;
        const pullStrength = 0.18 + this.primaFocus * 0.48 + Math.sin(t * 0.2 * motionScale) * 0.12;
        for (let i = 0; i < MAGNET_PARTICLES; i++) {
            // Pull toward magnet core
            const dx = this.magnetCore.position.x - magPos[i * 3];
            const dy = this.magnetCore.position.y - magPos[i * 3 + 1];
            const dz = this.magnetCore.position.z - magPos[i * 3 + 2];
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
            magPos[i * 3] += (dx / d) * pullStrength * dt;
            magPos[i * 3 + 1] += (dy / d) * pullStrength * dt;
            magPos[i * 3 + 2] += (dz / d) * pullStrength * dt;

            // Reset when too close
            if (d < 0.5) {
                magPos[i * 3] = this.magnetBasePositions[i * 3];
                magPos[i * 3 + 1] = this.magnetBasePositions[i * 3 + 1];
                magPos[i * 3 + 2] = this.magnetBasePositions[i * 3 + 2];
            }
        }
        this.magnetField.geometry.attributes.position.needsUpdate = true;
        this.magnetField.material.opacity = 0.16 + this.primaFocus * 0.55;
        this.magnetCore.rotation.y = t * 0.1 * motionScale;
        this.magnetCore.scale.setScalar(0.72 + this.primaFocus * 0.5);
        this.magnetCore.material.opacity = 0.28 + this.primaFocus * 0.56;

        // Lapis heartbeat — systole/diastole
        const heartbeat = Math.sin(t * 2 * motionScale); // Fast pulse
        const pulse = heartbeat > 0.7 ? 1 : 0; // Sharp beat
        this.lapisStone.scale.setScalar(0.82 + this.primaFocus * 0.16 + this.opusFocus * 0.22 + pulse * 0.15);
        this.lapisStone.material.opacity = 0.3 + this.primaFocus * 0.22 + this.opusFocus * 0.32;
        this.lapisStone.material.emissiveIntensity = 0.22 + this.opusFocus * 0.38 + pulse * 0.5;
        this.heartAura.material.opacity = pulse * (0.04 + this.opusFocus * 0.08);
        this.heartAura.scale.setScalar(1 + pulse * 0.5 + this.opusFocus * 0.2);
        this.lapisStone.rotation.y = t * 0.05 * motionScale;
        this.vesselGlass.material.opacity = 0.02 + this.vesselFocus * 0.04 + this.primaFocus * 0.04 + this.opusFocus * 0.05;
        this.vesselGlass.rotation.y = -t * 0.025 * motionScale;

        // Yoked fish ploughing across stages
        this.yokeGroup.position.x = -5 + ((t * 0.2 * motionScale * (0.5 + this.opusFocus)) % 14);
        if (this.yokeGroup.position.x > 9) this.yokeGroup.position.x = -5;
        this.yokeGroup.position.y = -3.5 + Math.sin(t * 0.3 * motionScale) * 0.1;
        this.yokeGroup.scale.setScalar(0.78 + this.opusFocus * 0.36);
        this.yokedFishParts?.forEach((part) => {
            part.material.opacity = 0.22 + this.opusFocus * 0.5;
        });
        this.groundStrips?.forEach((strip, index) => {
            strip.material.opacity = 0.035 + this.opusFocus * (0.07 + index * 0.015);
        });

        // Camera
        const camAngle = t * 0.015 * motionScale + this.mouseSmooth.x * 0.3;
        const camH = 2 + this.mouseSmooth.y * 3 - this.opusFocus * 0.6;
        const camRadius = 14 - this.vesselFocus * 1.2 - this.primaFocus * 0.6 + this.opusFocus * 0.8;
        this.camera.position.set(Math.sin(camAngle) * camRadius, camH, Math.cos(camAngle) * camRadius);
        this.camera.lookAt(this.primaFocus * 1.2 - this.vesselFocus * 0.8, -0.5 - this.opusFocus * 0.8, 0);

        if (this.bloomPass) this.bloomPass.strength = 0.95 + Math.sin(t * 0.1 * motionScale) * 0.2 + this.vesselFocus * 0.2 + this.opusFocus * 0.18;
    }

    render() { this.composer?.render(); }
    onResize(w, h) {
        if (!this.renderer || !this.camera) return;
        this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h); this.composer?.setSize(w, h); this.bloomPass?.setSize(w, h);
    }
    _onMouseMove(e) { this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1; this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; }
    dispose() {
        window.removeEventListener('mousemove', this._onMouseMove);
        if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
        this.scene?.traverse(o => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
        this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
