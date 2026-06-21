// Chapter 10: fish, prima materia, and opus inside an alchemical vessel.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';
import {
    ALCHEMY_COLORS,
    DESKTOP_MAGNET_PARTICLES,
    VOID,
    getAlchemyBloomStrength,
    getAlchemyMagnetParticleCount,
    getAlchemyPixelRatioCap,
    isAlchemyMobile,
} from './alchemySceneConfig.js';

const {
    NIGREDO_BLACK,
    ALBEDO_WHITE,
    CITRINITAS,
    RUBEDO_RED,
    ECHENEIS_CYAN,
    SHIP_GREY,
    MAGNET_TEAL,
    LAPIS_GOLD,
    FIRE_ORANGE,
    YOKE_BROWN,
} = ALCHEMY_COLORS;

export default class ThreeAlchemyViz extends BaseViz {
    constructor(container, opts = {}) {
        super(container, Object.assign({ contextType: 'webgl' }, opts));
        this.panelState = { activePanelId: 'vessel', progress: 0 };
        this.vesselFocus = 1;
        this.primaFocus = 0;
        this.opusFocus = 0;
        this.labMaterials = [];
        this.labStageStones = [];
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
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, getAlchemyPixelRatioCap(this.width)));
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(VOID);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(VOID, 0.01);

        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 200);
        this.camera.position.set(0, 2.8, 14.5);

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this._onMouseMove = this._onMouseMove.bind(this);
        this.pointerTarget = this.container || window;
        this.pointerTarget.addEventListener('mousemove', this._onMouseMove);

        this._createEcheneis();
        this._createShip();
        this._createMagnetField();
        this._createLapisAnimatus();
        this._createYokedFish();
        this._createAlchemicalGround();
        this._createLaboratoryField();
        this._createLights();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), getAlchemyBloomStrength(this.width), 0.5, 0.28
        );
        this.composer.addPass(this.bloomPass);
    }

    _makeLabMaterial({ color, opacity = 0.45, additive = true, side = THREE.DoubleSide, wireframe = false }) {
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity,
            side,
            wireframe,
            blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
            depthWrite: false,
        });
        this.labMaterials.push(mat);
        return mat;
    }

    _createEcheneis() {
        this.echeneisGroup = new THREE.Group();
        const bodyGeo = new THREE.SphereGeometry(0.1, 10, 8);
        bodyGeo.scale(2, 0.5, 0.4);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: ECHENEIS_CYAN, emissive: ECHENEIS_CYAN, emissiveIntensity: 1.2,
            transparent: true, opacity: 0.88,
        });
        this.echeneisBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.echeneisGroup.add(this.echeneisBody);

        const auraGeo = new THREE.SphereGeometry(0.5, 12, 12);
        this.echeneisAura = new THREE.Mesh(auraGeo, new THREE.MeshBasicMaterial({
            color: ECHENEIS_CYAN, transparent: true, opacity: 0.09,
            blending: THREE.AdditiveBlending,
        }));
        this.echeneisGroup.add(this.echeneisAura);

        this.echeneisGroup.position.set(-4.2, 2.1, 1);
        this.scene.add(this.echeneisGroup);
    }

    _createShip() {
        this.shipGroup = new THREE.Group();
        this.shipParts = [];

        const hullGeo = new THREE.BoxGeometry(4, 0.8, 1.2);
        const hullMat = new THREE.MeshStandardMaterial({
            color: SHIP_GREY, transparent: true, opacity: 0.2,
            roughness: 0.8,
        });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        this.shipGroup.add(hull);
        this.shipParts.push(hull);

        const mastGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 6);
        const mast = new THREE.Mesh(mastGeo, new THREE.MeshStandardMaterial({
            color: SHIP_GREY, transparent: true, opacity: 0.25,
        }));
        mast.position.y = 1.5;
        this.shipGroup.add(mast);
        this.shipParts.push(mast);

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
        const count = getAlchemyMagnetParticleCount(this.width);
        this.magnetParticleCount = count;
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
            color: ECHENEIS_CYAN, size: 0.095, transparent: true, opacity: 0.52,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.magnetField);

        const magnetGeo = new THREE.OctahedronGeometry(0.3, 0);
        this.magnetCore = new THREE.Mesh(magnetGeo, new THREE.MeshStandardMaterial({
            color: MAGNET_TEAL, emissive: MAGNET_TEAL, emissiveIntensity: 0.9,
            transparent: true, opacity: 0.78,
        }));
        this.magnetCore.position.set(3, -1, 1);
        this.scene.add(this.magnetCore);
    }

    _createLapisAnimatus() {
        this.lapisGroup = new THREE.Group();

        const stoneGeo = new THREE.DodecahedronGeometry(0.5, 0);
        const stoneMat = new THREE.MeshStandardMaterial({
            color: LAPIS_GOLD, emissive: LAPIS_GOLD, emissiveIntensity: 0.75,
            metalness: 0.68, roughness: 0.18, transparent: true, opacity: 0.82,
        });
        this.lapisStone = new THREE.Mesh(stoneGeo, stoneMat);
        this.lapisGroup.add(this.lapisStone);

        const heartGeo = new THREE.SphereGeometry(0.8, 16, 16);
        this.heartAura = new THREE.Mesh(heartGeo, new THREE.MeshBasicMaterial({
            color: RUBEDO_RED, transparent: true, opacity: 0,
            blending: THREE.AdditiveBlending,
        }));
        this.lapisGroup.add(this.heartAura);

        this.lapisGroup.position.set(0, -1.18, 1.2);
        this.scene.add(this.lapisGroup);

        const vesselGeo = new THREE.SphereGeometry(1.7, 36, 22);
        vesselGeo.scale(1.15, 1.35, 1);
        this.vesselGlass = new THREE.Mesh(vesselGeo, new THREE.MeshBasicMaterial({
            color: 0x9fdcff,
            transparent: true,
            opacity: 0.075,
            blending: THREE.AdditiveBlending,
            wireframe: true,
            depthWrite: false,
        }));
        this.vesselGlass.position.copy(this.lapisGroup.position);
        this.scene.add(this.vesselGlass);
    }

    _createLaboratoryField() {
        this.labField = new THREE.Group();
        this.labField.position.set(0, -1.1, 0.4);

        const retortGeo = new THREE.TorusGeometry(1.95, 0.018, 12, 128);
        this.retortOuter = new THREE.Mesh(retortGeo, this._makeLabMaterial({ color: ECHENEIS_CYAN, opacity: 0.34 }));
        this.retortOuter.scale.set(1.18, 0.72, 1);
        this.retortOuter.rotation.z = -0.18;
        this.labField.add(this.retortOuter);

        this.retortInner = new THREE.Mesh(retortGeo, this._makeLabMaterial({ color: LAPIS_GOLD, opacity: 0.28 }));
        this.retortInner.scale.set(0.82, 0.5, 1);
        this.retortInner.rotation.z = 0.28;
        this.labField.add(this.retortInner);

        const crucibleGeo = new THREE.CylinderGeometry(1.28, 1.72, 1.75, 48, 1, true);
        this.crucible = new THREE.Mesh(crucibleGeo, this._makeLabMaterial({ color: ECHENEIS_CYAN, opacity: 0.1, side: THREE.DoubleSide, wireframe: true }));
        this.crucible.position.y = -0.32;
        this.crucible.scale.set(1.06, 1.08, 0.72);
        this.labField.add(this.crucible);

        const flameGeo = new THREE.ConeGeometry(1.18, 2.36, 40, 1, true);
        this.alembicFlame = new THREE.Mesh(flameGeo, this._makeLabMaterial({ color: FIRE_ORANGE, opacity: 0.18, side: THREE.DoubleSide }));
        this.alembicFlame.position.y = -2.18;
        this.alembicFlame.rotation.x = Math.PI;
        this.labField.add(this.alembicFlame);

        const linePositions = new Float32Array([
            -4.2, 3.2, 0.2, -1.34, 0.15, 0.2,
            -1.34, 0.15, 0.2, 0, -0.2, 0.2,
            0, -0.2, 0.2, 2.9, 0.35, 0.2,
            -3.5, -2.68, 0.2, 3.5, -2.68, 0.2,
        ]);
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        this.labThreads = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
            color: LAPIS_GOLD,
            transparent: true,
            opacity: 0.24,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }));
        this.labField.add(this.labThreads);

        const stageColors = [NIGREDO_BLACK, ALBEDO_WHITE, CITRINITAS, RUBEDO_RED];
        stageColors.forEach((color, index) => {
            const stage = new THREE.Mesh(
                new THREE.SphereGeometry(0.17, 18, 12),
                new THREE.MeshStandardMaterial({
                    color,
                    emissive: color,
                    emissiveIntensity: index === 0 ? 0.18 : 0.55,
                    metalness: 0.4,
                    roughness: 0.22,
                    transparent: true,
                    opacity: 0.78,
                }),
            );
            stage.position.set(-2.25 + index * 1.5, -2.7, 0.58);
            this.labStageStones.push(stage);
            this.labField.add(stage);
        });

        this.scene.add(this.labField);
    }

    _createYokedFish() {
        this.yokeGroup = new THREE.Group();
        this.yokedFishParts = [];

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
        const stages = [NIGREDO_BLACK, ALBEDO_WHITE, CITRINITAS, RUBEDO_RED];
        this.groundStrips = [];
        for (let i = 0; i < 4; i++) {
            const stripGeo = new THREE.PlaneGeometry(4, 1);
            const stripMat = new THREE.MeshBasicMaterial({
                color: stages[i], transparent: true, opacity: 0.085,
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
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.42));
        const echeneisLight = new THREE.PointLight(0x22d3ee, 0.85, 12);
        echeneisLight.position.set(-4, 3, 3);
        this.scene.add(echeneisLight);

        const magnetLight = new THREE.PointLight(0x2f6674, 0.68, 15);
        magnetLight.position.set(3, -2, 3);
        this.scene.add(magnetLight);

        const lapisLight = new THREE.PointLight(0xd4af37, 0.78, 12);
        lapisLight.position.set(0, -1.2, 3);
        this.scene.add(lapisLight);

        const fireLight = new THREE.PointLight(0xff8a3d, 0.52, 9);
        fireLight.position.set(0, -3.1, 2.2);
        this.scene.add(fireLight);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        const panelId = this.panelState?.activePanelId || 'vessel';
        const isMobile = isAlchemyMobile(this.width);
        const dampRate = this.reducedMotion ? 9 : 3.5;
        const motionScale = this.reducedMotion ? 0.12 : 1;
        this.vesselFocus = THREE.MathUtils.damp(this.vesselFocus, panelId === 'vessel' ? 1 : 0.22, dampRate, dt);
        this.primaFocus = THREE.MathUtils.damp(this.primaFocus, panelId === 'prima' ? 1 : 0.16, dampRate, dt);
        this.opusFocus = THREE.MathUtils.damp(this.opusFocus, panelId === 'opus' ? 1 : 0.16, dampRate, dt);
        this.mouseSmooth.lerp(this.mouse, 0.03);

        this.echeneisGroup.position.x = -3.25 + Math.sin(t * 0.08 * motionScale) * 0.28 - this.vesselFocus * 0.16;
        this.echeneisGroup.position.y = 2.05 + Math.sin(t * 0.15 * motionScale) * 0.18;
        this.echeneisGroup.scale.setScalar(0.9 + this.vesselFocus * 0.34);
        this.echeneisBody.material.opacity = 0.48 + this.vesselFocus * 0.5;
        this.echeneisAura.material.opacity = (0.07 + Math.sin(t * 0.6 * motionScale) * 0.018) + this.vesselFocus * 0.18;

        this.shipGroup.rotation.z = Math.sin(t * 0.12 * motionScale) * 0.03;
        this.shipGroup.position.y = 2 + Math.sin(t * 0.08 * motionScale) * 0.05;
        this.shipGroup.scale.setScalar(0.94 + this.vesselFocus * 0.08);
        this.shipParts?.forEach((part) => {
            part.material.opacity = (part === this.shipParts[2] ? 0.13 : 0.18) + this.vesselFocus * (part === this.shipParts[2] ? 0.2 : 0.22);
        });

        const magPos = this.magnetField.geometry.attributes.position.array;
        const pullStrength = 0.18 + this.primaFocus * 0.48 + Math.sin(t * 0.2 * motionScale) * 0.12;
        const particleCount = this.magnetParticleCount || DESKTOP_MAGNET_PARTICLES;
        for (let i = 0; i < particleCount; i++) {
            const dx = this.magnetCore.position.x - magPos[i * 3];
            const dy = this.magnetCore.position.y - magPos[i * 3 + 1];
            const dz = this.magnetCore.position.z - magPos[i * 3 + 2];
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
            magPos[i * 3] += (dx / d) * pullStrength * dt;
            magPos[i * 3 + 1] += (dy / d) * pullStrength * dt;
            magPos[i * 3 + 2] += (dz / d) * pullStrength * dt;

            if (d < 0.5) {
                magPos[i * 3] = this.magnetBasePositions[i * 3];
                magPos[i * 3 + 1] = this.magnetBasePositions[i * 3 + 1];
                magPos[i * 3 + 2] = this.magnetBasePositions[i * 3 + 2];
            }
        }
        this.magnetField.geometry.attributes.position.needsUpdate = true;
        this.magnetField.material.opacity = 0.24 + this.primaFocus * 0.62;
        this.magnetField.material.size = 0.085 + this.primaFocus * 0.045;
        this.magnetCore.rotation.y = t * 0.1 * motionScale;
        this.magnetCore.scale.setScalar(0.76 + this.primaFocus * 0.58);
        this.magnetCore.material.opacity = 0.38 + this.primaFocus * 0.58;

        const heartbeat = Math.sin(t * 2 * motionScale);
        const pulse = heartbeat > 0.7 ? 1 : 0;
        this.lapisStone.scale.setScalar(0.82 + this.primaFocus * 0.16 + this.opusFocus * 0.22 + pulse * 0.15);
        this.lapisStone.material.opacity = 0.46 + this.primaFocus * 0.22 + this.opusFocus * 0.38;
        this.lapisStone.material.emissiveIntensity = 0.42 + this.opusFocus * 0.54 + pulse * 0.5;
        this.heartAura.material.opacity = pulse * (0.07 + this.opusFocus * 0.13);
        this.heartAura.scale.setScalar(1 + pulse * 0.55 + this.opusFocus * 0.24);
        this.lapisStone.rotation.y = t * 0.05 * motionScale;
        this.vesselGlass.material.opacity = 0.035 + this.vesselFocus * 0.05 + this.primaFocus * 0.034 + this.opusFocus * 0.045;
        this.vesselGlass.rotation.y = -t * 0.025 * motionScale;

        if (this.labField) {
            this.labField.rotation.y = Math.sin(t * 0.08 * motionScale) * 0.08 + this.mouseSmooth.x * 0.05;
            this.labField.scale.setScalar(1 + this.vesselFocus * 0.03 + this.opusFocus * 0.04);
        }
        if (this.retortOuter) {
            this.retortOuter.rotation.z = -0.18 + Math.sin(t * 0.14 * motionScale) * 0.08;
            this.retortOuter.material.opacity = 0.24 + this.vesselFocus * 0.18 + this.primaFocus * 0.08;
        }
        if (this.retortInner) {
            this.retortInner.rotation.z = 0.28 - Math.sin(t * 0.12 * motionScale) * 0.08;
            this.retortInner.material.opacity = 0.2 + this.opusFocus * 0.2 + this.primaFocus * 0.08;
        }
        if (this.crucible) {
            this.crucible.material.opacity = 0.08 + this.vesselFocus * 0.05 + this.primaFocus * 0.05 + this.opusFocus * 0.05;
        }
        if (this.alembicFlame) {
            this.alembicFlame.scale.set(1 + this.opusFocus * 0.1, 0.74 + this.opusFocus * 0.44 + Math.sin(t * 1.3 * motionScale) * 0.04, 1);
            this.alembicFlame.material.opacity = 0.13 + this.opusFocus * 0.32;
        }
        if (this.labThreads) {
            this.labThreads.material.opacity = 0.18 + this.vesselFocus * 0.1 + this.opusFocus * 0.2;
        }
        this.labStageStones?.forEach((stage, index) => {
            const stageLift = index / Math.max(this.labStageStones.length - 1, 1);
            stage.position.y = -2.7 + this.opusFocus * 0.2 * stageLift + Math.sin(t * 0.6 * motionScale + index) * 0.025;
            stage.scale.setScalar(0.88 + this.opusFocus * (0.18 + stageLift * 0.2));
            stage.material.opacity = 0.6 + this.opusFocus * 0.28;
            stage.material.emissiveIntensity = 0.32 + this.opusFocus * (0.32 + stageLift * 0.22);
        });

        this.yokeGroup.position.x = -5 + ((t * 0.2 * motionScale * (0.5 + this.opusFocus)) % 14);
        if (this.yokeGroup.position.x > 9) this.yokeGroup.position.x = -5;
        this.yokeGroup.position.y = -3.5 + Math.sin(t * 0.3 * motionScale) * 0.1;
        this.yokeGroup.scale.setScalar(0.78 + this.opusFocus * 0.36);
        this.yokedFishParts?.forEach((part) => {
            part.material.opacity = 0.24 + this.opusFocus * 0.58;
        });
        this.groundStrips?.forEach((strip, index) => {
            strip.material.opacity = 0.04 + this.opusFocus * (0.085 + index * 0.018);
        });

        const camAngle = t * 0.015 * motionScale + this.mouseSmooth.x * 0.3;
        const camH = 1.75 + this.mouseSmooth.y * 2.25 - this.opusFocus * 0.42 + (isMobile ? 0.55 : 0);
        const camRadius = 12.9 - this.vesselFocus * 0.45 - this.primaFocus * 0.22 + this.opusFocus * 0.58 + (isMobile ? 2.35 : 0);
        this.camera.position.set(Math.sin(camAngle) * camRadius, camH, Math.cos(camAngle) * camRadius);
        this.camera.lookAt(this.primaFocus * 0.7 - this.vesselFocus * 0.28, -0.78 - this.opusFocus * 0.54, 0.2);

        if (this.bloomPass) this.bloomPass.strength = getAlchemyBloomStrength(this.width) + Math.sin(t * 0.1 * motionScale) * 0.16 + this.vesselFocus * 0.18 + this.opusFocus * 0.28;
    }

    render() { this.composer?.render(); }
    onResize(w, h) {
        if (!this.renderer || !this.camera) return;
        this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, getAlchemyPixelRatioCap(w)));
        this.renderer.setSize(w, h); this.composer?.setSize(w, h); this.bloomPass?.setSize(w, h);
    }
    _onMouseMove(e) {
        const bounds = this.container?.getBoundingClientRect?.();
        const width = bounds?.width || window.innerWidth;
        const height = bounds?.height || window.innerHeight;
        const left = bounds?.left || 0;
        const top = bounds?.top || 0;
        const x = ((e.clientX - left) / Math.max(width, 1)) * 2 - 1;
        const y = -(((e.clientY - top) / Math.max(height, 1)) * 2 - 1);
        this.mouse.x = THREE.MathUtils.clamp(x, -1, 1);
        this.mouse.y = THREE.MathUtils.clamp(y, -1, 1);
    }
    dispose() {
        (this.pointerTarget || window).removeEventListener('mousemove', this._onMouseMove);
        this.stop();
        this.resizeObserver?.disconnect();
        this.bloomPass?.dispose?.();
        this.composer?.dispose?.();
        this.scene?.traverse(o => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
        if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss(); }
        this.bloomPass = null; this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
