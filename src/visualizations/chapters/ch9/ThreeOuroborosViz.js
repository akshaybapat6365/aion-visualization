/**
 * ThreeOuroborosViz.js — Chapter 9: "The Ambivalence of the Fish Symbol / Ouroboros"
 * 3D self-devouring serpent ring, cyclic particle flow, death-rebirth dissolution,
 * fractal recursion hint.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const SERPENT_CLR = new THREE.Color('#53d8e8');
const SERPENT_DARK = new THREE.Color('#123f38');
const GOLD = new THREE.Color('#f2c95d');
const SILVER = new THREE.Color('#f4f0e8');
const SHADOW = new THREE.Color('#2f6674');
const MIRROR = new THREE.Color('#d9fff8');

export default class ThreeOuroborosViz extends BaseViz {
    constructor(c, o = {}) {
        super(c, Object.assign({ contextType: 'webgl' }, o));
        this.panelState = { activePanelId: 'ambivalence', progress: 0 };
        this.ambivalenceFocus = 1;
        this.ouroborosFocus = 0;
        this.shadowFocus = 0;
        this.reducedMotion = false;
    }

    setPanelState(state = {}) {
        this.panelState = Object.assign(this.panelState || {}, state);
    }

    setReducedMotion(enabled) {
        this.reducedMotion = Boolean(enabled);
    }

    async init() {
        const R = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        R.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.width < 700 ? 1.5 : 2)); R.setSize(this.width, this.height); R.setClearColor(0x04050d);
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x04050d, 0.007);
        this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
        this.camera.position.set(0, 4.7, 15);
        this.focusTarget = new THREE.Vector3(0.25, 0, 0);

        this.mouse = new THREE.Vector2(); this.mouseSmooth = new THREE.Vector2();
        this._onMM = e => {
            const rect = this.container?.getBoundingClientRect();
            const width = rect?.width || window.innerWidth || 1;
            const height = rect?.height || window.innerHeight || 1;
            const left = rect?.left || 0;
            const top = rect?.top || 0;
            this.mouse.x = THREE.MathUtils.clamp(((e.clientX - left) / width) * 2 - 1, -1, 1);
            this.mouse.y = THREE.MathUtils.clamp(-(((e.clientY - top) / height) * 2 - 1), -1, 1);
        };
        this.pointerTarget = this.container || window;
        this.pointerTarget.addEventListener('mousemove', this._onMM);

        this._createTeachingField();

        this.mirrorPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.11, 8.2),
            new THREE.MeshBasicMaterial({
                color: MIRROR,
                transparent: true,
                opacity: 0.08,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false,
            })
        );
        this.mirrorPlane.position.set(0, 0, -1.15);
        this.scene.add(this.mirrorPlane);

        this.mirrorHalo = new THREE.Mesh(
            new THREE.TorusGeometry(2.2, 0.035, 8, 96),
            new THREE.MeshBasicMaterial({
                color: SILVER,
                transparent: true,
                opacity: 0.08,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
        );
        this.mirrorHalo.scale.set(0.62, 1.55, 1);
        this.mirrorHalo.rotation.z = 0.06;
        this.mirrorHalo.position.set(0, 0, -1.28);
        this.scene.add(this.mirrorHalo);

        // Serpent body: torus geometry (the ouroboros ring)
        this.serpentBody = new THREE.Mesh(new THREE.TorusGeometry(4, 0.35, 16, 100), new THREE.MeshStandardMaterial({
            color: SERPENT_CLR, emissive: SERPENT_DARK, emissiveIntensity: 0.52, roughness: 0.45, metalness: 0.36,
            transparent: true, opacity: 0.82,
        }));
        this.scene.add(this.serpentBody);

        // Serpent scale pattern (wireframe overlay)
        this.serpentWire = new THREE.Mesh(new THREE.TorusGeometry(4, 0.37, 16, 100), new THREE.MeshBasicMaterial({
            color: SERPENT_CLR, wireframe: true, transparent: true, opacity: 0.18,
        }));
        this.scene.add(this.serpentWire);

        // Head/tail junction — glowing point where it devours itself
        this.junction = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshBasicMaterial({
            color: GOLD, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending,
        }));
        this.junction.position.set(4, 0, 0);
        this.scene.add(this.junction);

        // Cyclic particle flow along the serpent body
        const flowN = this.width < 700 ? 180 : 300;
        const flowPos = new Float32Array(flowN * 3);
        this.flowPhases = new Float32Array(flowN);
        for (let i = 0; i < flowN; i++) {
            this.flowPhases[i] = Math.random();
            const a = this.flowPhases[i] * Math.PI * 2;
            flowPos[i * 3] = Math.cos(a) * 4;
            flowPos[i * 3 + 1] = 0;
            flowPos[i * 3 + 2] = Math.sin(a) * 4;
        }
        const flowGeo = new THREE.BufferGeometry();
        flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
        this.flowPts = new THREE.Points(flowGeo, new THREE.PointsMaterial({
            color: GOLD, size: 0.07, transparent: true, opacity: 0.74, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.flowPts);

        const makeFish = (color, glowColor) => {
            const group = new THREE.Group();
            const bodyGeo = new THREE.SphereGeometry(0.22, 16, 12);
            bodyGeo.scale(2.4, 0.65, 0.42);
            const bodyMat = new THREE.MeshStandardMaterial({
                color,
                emissive: glowColor,
                emissiveIntensity: 0.55,
                transparent: true,
                opacity: 0.7,
                roughness: 0.35,
                metalness: 0.35,
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            group.add(body);

            const tailGeo = new THREE.BufferGeometry();
            tailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
                -0.52, 0, 0.03,
                -0.95, 0.2, 0.03,
                -0.95, -0.2, 0.03,
            ]), 3));
            tailGeo.setIndex([0, 1, 2]);
            const tail = new THREE.Mesh(tailGeo, new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.55,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthTest: false,
            }));
            group.add(tail);

            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(0.9, 14, 14),
                new THREE.MeshBasicMaterial({
                    color: glowColor,
                    transparent: true,
                    opacity: 0.11,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                })
            );
            group.add(glow);
            group.userData = { bodyMat, tailMat: tail.material, glowMat: glow.material };
            this.scene.add(group);
            return group;
        };

        this.lightFish = makeFish(SILVER, GOLD);
        this.shadowFish = makeFish(SHADOW, SHADOW);

        this.oppositionLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4, 0, 0), new THREE.Vector3(4, 0, 0)]),
            new THREE.LineBasicMaterial({
                color: GOLD,
                transparent: true,
                opacity: 0.18,
                blending: THREE.AdditiveBlending,
            })
        );
        this.scene.add(this.oppositionLine);

        this.shadowVeil = new THREE.Mesh(
            new THREE.SphereGeometry(5.8, 28, 20),
            new THREE.MeshBasicMaterial({
                color: 0x172044,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                depthWrite: false,
            })
        );
        this.scene.add(this.shadowVeil);

        // Inner recursion — smaller ouroboros inside
        this.innerSerpent = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.12, 10, 60), new THREE.MeshBasicMaterial({
            color: GOLD, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.innerSerpent);

        // Even smaller inner recursion
        this.innerSerpent2 = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 40), new THREE.MeshBasicMaterial({
            color: SERPENT_CLR, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending,
        }));
        this.scene.add(this.innerSerpent2);

        this.scene.add(new THREE.AmbientLight(0x101822, 0.45));
        const serpentLight = new THREE.PointLight(0x53d8e8, 0.72, 16);
        serpentLight.position.set(-2, 3, 5);
        this.scene.add(serpentLight);
        const goldLight = new THREE.PointLight(0xf2c95d, 0.46, 12);
        goldLight.position.set(3.3, 2.2, 4);
        this.scene.add(goldLight);
        const shadowLight = new THREE.PointLight(0x2f6674, 0.42, 14);
        shadowLight.position.set(5, -1, 3);
        this.scene.add(shadowLight);

        this.composer = new EffectComposer(R);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), this.width < 700 ? 0.95 : 1.2, 0.5, 0.35);
        this.composer.addPass(this.bloom);
    }

    _createTeachingField() {
        this.teachingField = new THREE.Group();

        const makeVeil = (color, x) => {
            const veil = new THREE.Mesh(
                new THREE.PlaneGeometry(8.5, 11.5),
                new THREE.MeshBasicMaterial({
                    map: this._createRadialTexture(color),
                    transparent: true,
                    opacity: 0.18,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                })
            );
            veil.position.set(x, 0, -3.5);
            this.teachingField.add(veil);
        };

        makeVeil(GOLD, -3.1);
        makeVeil(SERPENT_CLR, 3.1);

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xf4f0e8,
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending,
        });
        this.teachingField.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-7.2, 0, -1.6), new THREE.Vector3(7.2, 0, -1.6)]),
            lineMaterial.clone()
        ));
        this.teachingField.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -4.9, -1.6), new THREE.Vector3(0, 4.9, -1.6)]),
            lineMaterial.clone()
        ));

        const arcPoints = [];
        for (let i = 0; i <= 160; i++) {
            const a = (i / 160) * Math.PI * 2;
            arcPoints.push(new THREE.Vector3(Math.cos(a) * 5.65, Math.sin(a) * 2.75, -1.9));
        }
        this.returnOrbit = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(arcPoints),
            new THREE.LineBasicMaterial({
                color: 0xf2c95d,
                transparent: true,
                opacity: 0.22,
                blending: THREE.AdditiveBlending,
            })
        );
        this.teachingField.add(this.returnOrbit);

        this.scene.add(this.teachingField);
    }

    _createRadialTexture(color) {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const r = Math.round(color.r * 255);
        const g = Math.round(color.g * 255);
        const b = Math.round(color.b * 255);
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.72)`);
        gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, 0.22)`);
        gradient.addColorStop(0.78, `rgba(${r}, ${g}, ${b}, 0.06)`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        const panelId = this.panelState?.activePanelId || 'ambivalence';
        const dampRate = this.reducedMotion ? 9 : 3.6;
        const motionScale = this.reducedMotion ? 0.12 : 1;
        this.ambivalenceFocus = THREE.MathUtils.damp(this.ambivalenceFocus, panelId === 'ambivalence' ? 1 : 0.18, dampRate, dt);
        this.ouroborosFocus = THREE.MathUtils.damp(this.ouroborosFocus, panelId === 'ouroboros' ? 1 : 0.12, dampRate, dt);
        this.shadowFocus = THREE.MathUtils.damp(this.shadowFocus, panelId === 'shadow-fish' ? 1 : 0, dampRate, dt);
        this.mouseSmooth.lerp(this.mouse, 0.04);

        if (this.teachingField) {
            this.teachingField.rotation.z = Math.sin(t * 0.03 * motionScale) * 0.035;
            this.teachingField.position.x = 0.3 + this.ambivalenceFocus * 0.18 - this.shadowFocus * 0.12;
        }
        if (this.returnOrbit) {
            this.returnOrbit.material.opacity = 0.18 + this.ouroborosFocus * 0.22 + this.ambivalenceFocus * 0.08;
            this.returnOrbit.rotation.z -= 0.0015 * motionScale * (0.7 + this.ouroborosFocus);
        }
        if (this.mirrorPlane) {
            this.mirrorPlane.material.opacity = 0.04 + this.ambivalenceFocus * 0.035 + this.ouroborosFocus * 0.02 + this.shadowFocus * 0.04;
            this.mirrorPlane.rotation.z = 0.04 + Math.sin(t * 0.06 * motionScale) * 0.025;
            this.mirrorPlane.scale.y = 0.96 + this.shadowFocus * 0.1 + this.ouroborosFocus * 0.05;
        }
        if (this.mirrorHalo) {
            this.mirrorHalo.material.opacity = 0.05 + this.ambivalenceFocus * 0.08 + this.ouroborosFocus * 0.06 + this.shadowFocus * 0.1;
            this.mirrorHalo.rotation.z = 0.08 + this.ouroborosFocus * 0.22 + Math.sin(t * 0.05 * motionScale) * 0.04;
            this.mirrorHalo.scale.set(0.62 + this.ambivalenceFocus * 0.05, 1.55 + this.shadowFocus * 0.16, 1);
        }

        // Serpent slow rotation (eating its tail)
        this.serpentBody.rotation.z += 0.003 * motionScale * (0.7 + this.ouroborosFocus * 1.4);
        this.serpentBody.rotation.x = Math.sin(t * 0.1 * motionScale) * (0.12 + this.ouroborosFocus * 0.1);
        this.serpentWire.rotation.z = this.serpentBody.rotation.z;
        this.serpentWire.rotation.x = this.serpentBody.rotation.x;
        this.serpentBody.scale.setScalar(0.92 + this.ouroborosFocus * 0.14 + this.shadowFocus * 0.08);
        this.serpentWire.material.opacity = 0.14 + this.ouroborosFocus * 0.18 + this.shadowFocus * 0.06;

        // Junction follows rotation
        const jA = this.serpentBody.rotation.z;
        this.junction.position.set(Math.cos(jA) * 4, Math.sin(jA) * 4 * Math.cos(this.serpentBody.rotation.x), 0);
        this.junction.material.opacity = 0.24 + Math.sin(t * 2 * motionScale) * 0.12 + this.ouroborosFocus * 0.24;

        // Cyclic flow along body
        const fp = this.flowPts.geometry.attributes.position.array;
        for (let i = 0; i < this.flowPhases.length; i++) {
            this.flowPhases[i] = (this.flowPhases[i] + dt * 0.1 * motionScale * (0.6 + this.ouroborosFocus)) % 1;
            const a = this.flowPhases[i] * Math.PI * 2 + this.serpentBody.rotation.z;
            fp[i * 3] = Math.cos(a) * 4;
            fp[i * 3 + 1] = Math.sin(a) * 4 * Math.cos(this.serpentBody.rotation.x);
            fp[i * 3 + 2] = Math.sin(a) * 4 * Math.sin(this.serpentBody.rotation.x);
        }
        this.flowPts.geometry.attributes.position.needsUpdate = true;
        this.flowPts.material.opacity = 0.45 + this.ouroborosFocus * 0.44 + this.shadowFocus * 0.18;

        // Inner recursion rotation (opposite direction)
        this.innerSerpent.rotation.z -= 0.005 * motionScale * (0.5 + this.ouroborosFocus);
        this.innerSerpent.rotation.y = t * 0.05 * motionScale;
        this.innerSerpent.material.opacity = 0.08 + this.ouroborosFocus * 0.25;
        this.innerSerpent2.rotation.z += 0.008 * motionScale * (0.5 + this.ouroborosFocus);
        this.innerSerpent2.rotation.x = t * 0.08 * motionScale;
        this.innerSerpent2.material.opacity = 0.04 + this.ouroborosFocus * 0.16;

        const fishAngle = t * 0.055 * motionScale + this.ambivalenceFocus * 0.65 - this.shadowFocus * 0.4;
        const fishRadius = 4.55 - this.ouroborosFocus * 0.35;
        const updateFish = (fish, angle, lift, isShadow) => {
            fish.position.set(
                Math.cos(angle) * fishRadius,
                Math.sin(angle) * 0.8 + lift,
                Math.sin(angle) * fishRadius * 0.45
            );
            fish.rotation.y = -angle + Math.PI / 2;
            fish.rotation.z = Math.sin(t * 0.25 * motionScale + angle) * 0.08;
            const focus = isShadow ? Math.max(this.ambivalenceFocus * 0.75, this.shadowFocus) : this.ambivalenceFocus;
            const opacity = isShadow ? 0.46 + focus * 0.42 : 0.52 + focus * 0.46;
            fish.userData.bodyMat.opacity = opacity;
            fish.userData.tailMat.opacity = opacity * 0.8;
            fish.userData.glowMat.opacity = (isShadow ? 0.04 : 0.07) + focus * (isShadow ? 0.1 : 0.16);
            fish.scale.setScalar(0.82 + focus * 0.28 + (isShadow ? this.shadowFocus * 0.16 : 0));
        };
        updateFish(this.lightFish, fishAngle, 0.18, false);
        updateFish(this.shadowFish, fishAngle + Math.PI, -0.18, true);

        const linePositions = this.oppositionLine.geometry.attributes.position.array;
        linePositions[0] = this.lightFish.position.x;
        linePositions[1] = this.lightFish.position.y;
        linePositions[2] = this.lightFish.position.z;
        linePositions[3] = this.shadowFish.position.x;
        linePositions[4] = this.shadowFish.position.y;
        linePositions[5] = this.shadowFish.position.z;
        this.oppositionLine.geometry.attributes.position.needsUpdate = true;
        const lineScale = this.width < 700 ? 0 : 1;
        this.oppositionLine.material.opacity = (0.04 + this.ambivalenceFocus * 0.14 + this.shadowFocus * 0.04) * lineScale;
        this.shadowVeil.material.opacity = this.shadowFocus * 0.26;

        // Death-rebirth dissolution: periodic opacity pulse
        const drCycle = Math.sin(t * 0.15 * motionScale);
        this.serpentBody.material.opacity = 0.7 + drCycle * 0.14 + this.ouroborosFocus * 0.2 + this.shadowFocus * 0.1;
        this.serpentBody.material.transparent = true;

        // Camera
        const ca = t * 0.02 * motionScale + this.mouseSmooth.x * 0.2;
        const camRadius = 14.8 - this.ouroborosFocus * 1.45 + this.shadowFocus * 0.7;
        this.camera.position.x = Math.sin(ca) * camRadius;
        this.camera.position.y = 5 + this.mouseSmooth.y * 3 - this.shadowFocus * 0.4;
        this.camera.position.z = Math.cos(ca) * camRadius;
        this.camera.lookAt(this.focusTarget);
        if (this.bloom) {
            this.bloom.strength = 1.16 + this.ouroborosFocus * 0.34 + this.ambivalenceFocus * 0.18 + this.shadowFocus * 0.24;
        }
    }

    render() { this.composer?.render(); }
    onResize(w, h) {
        if (!this.renderer) return;
        this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 2));
        this.renderer.setSize(w, h); this.composer?.setSize(w, h); this.bloom?.setSize(w, h);
    }
    dispose() {
        this.pointerTarget?.removeEventListener('mousemove', this._onMM);
        this.pointerTarget = null;
        this.bloom?.dispose?.();
        this.composer?.dispose?.();
        this.renderer?.dispose(); this.renderer?.forceContextLoss();
        this.scene?.traverse(o => {
            o.geometry?.dispose();
            if (o.material) {
                [].concat(o.material).forEach(m => {
                    m.map?.dispose();
                    m.dispose();
                });
            }
        });
        this.bloom = null; this.composer = null; this.scene = null; this.renderer = null; super.dispose();
    }
}
