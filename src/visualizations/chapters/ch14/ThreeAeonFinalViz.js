/**
 * ThreeAeonFinalViz.js — Chapter 14: "Structure & Dynamics of the Self"
 *
 * Jung: "Our four double pyramids would arrange themselves in a circle
 * and form the well-known uroboros... the heavy darkness of the earth
 * has a secret relationship to the Anthropos."
 *
 * Visual: Four interlocking quaternios (Anthropos → Shadow → Paradise → Lapis)
 * arranged as double-pyramid diamonds along a vertical axis. The Serpent
 * sits at the exact center — the point of maximum tension — glowing both
 * gold and red. The whole structure slowly curves into a uroboros (snake
 * biting its tail), enclosed in a transparent Hermetic vessel. Descent/ascent
 * arrows flow through, and a solve-et-coagula breathing animation pulses.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

/* ─── Palette ─── */
const ANTHROPOS_GOLD = new THREE.Color('#ffd700');
const SHADOW_PURPLE = new THREE.Color('#2a0845');
const PARADISE_GREEN = new THREE.Color('#2ecc71');
const LAPIS_RED = new THREE.Color('#c0392b');
const SERPENT_GOLD = new THREE.Color('#d4af37');
const SERPENT_RED = new THREE.Color('#8b0000');
const VESSEL_CYAN = new THREE.Color('#22d3ee');
const ARROW_WHITE = new THREE.Color('#e8e8f0');
const PHOENIX_ORANGE = new THREE.Color('#ff6600');
const VOID = 0x010108;

/* ─── Constants ─── */
const Q_COUNT = 4;
const ARROW_PARTICLES = 200;
const COAGULA_PARTICLES = 1500;
const COSMIC_PARTICLES = 2000;

export default class ThreeAeonFinalViz extends BaseViz {
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
        this.renderer.toneMappingExposure = 0.9;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(VOID, 0.008);

        this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 300);
        this.camera.position.set(0, 6, 22);

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this._onMouseMove = this._onMouseMove.bind(this);
        window.addEventListener('mousemove', this._onMouseMove);

        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        this._createQuaternioStack();
        this._createSerpent();
        this._createDescentAscentArrows();
        this._createCoagulaField();
        this._createHermeticVessel();
        this._createPhoenixCore();
        this._createCosmicField();
        this._createLights();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.4, 0.6, 0.3
        );
        this.composer.addPass(this.bloomPass);
    }

    /* ═══════════════════════════════════════════════════
       1. FOUR QUATERNIO STACK — Double-pyramid diamonds
       ═══════════════════════════════════════════════════ */
    _createQuaternioStack() {
        this.quaternios = [];
        const configs = [
            { y: 6, color: ANTHROPOS_GOLD, emissive: '#8b6800', label: 'Anthropos', scale: 1.0 },
            { y: 2, color: SHADOW_PURPLE, emissive: '#1a0030', label: 'Shadow', scale: 0.9 },
            { y: -2, color: PARADISE_GREEN, emissive: '#145a32', label: 'Paradise', scale: 0.9 },
            { y: -6, color: LAPIS_RED, emissive: '#5a1a1a', label: 'Lapis', scale: 1.0 },
        ];

        for (const cfg of configs) {
            const group = new THREE.Group();

            // Double pyramid = two cones tip-to-tip (octahedron)
            const octa = new THREE.OctahedronGeometry(1.8 * cfg.scale, 0);
            const mat = new THREE.MeshStandardMaterial({
                color: cfg.color,
                emissive: cfg.emissive,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.35,
                metalness: 0.6,
                roughness: 0.2,
                wireframe: false,
                side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(octa, mat);
            group.add(mesh);

            // Wireframe overlay
            const wire = new THREE.Mesh(octa.clone(), new THREE.MeshBasicMaterial({
                color: cfg.color, wireframe: true, transparent: true, opacity: 0.4,
            }));
            group.add(wire);

            // Four corner nodes (the quaternity points)
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const nodeGeo = new THREE.SphereGeometry(0.12, 8, 8);
                const nodeMat = new THREE.MeshBasicMaterial({
                    color: cfg.color, transparent: true, opacity: 0.8,
                });
                const node = new THREE.Mesh(nodeGeo, nodeMat);
                node.position.set(
                    Math.cos(angle) * 1.8 * cfg.scale,
                    0,
                    Math.sin(angle) * 1.8 * cfg.scale
                );
                group.add(node);
            }

            // Connecting cross lines through the equator
            for (let i = 0; i < 2; i++) {
                const pts = [];
                const a1 = (i / 4) * Math.PI * 2;
                const a2 = ((i + 2) / 4) * Math.PI * 2;
                pts.push(new THREE.Vector3(Math.cos(a1) * 1.8 * cfg.scale, 0, Math.sin(a1) * 1.8 * cfg.scale));
                pts.push(new THREE.Vector3(Math.cos(a2) * 1.8 * cfg.scale, 0, Math.sin(a2) * 1.8 * cfg.scale));
                const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
                const lineMat = new THREE.LineBasicMaterial({
                    color: cfg.color, transparent: true, opacity: 0.3,
                });
                group.add(new THREE.Line(lineGeo, lineMat));
            }

            group.position.y = cfg.y;
            this.mainGroup.add(group);
            this.quaternios.push({ group, mesh, wire, cfg, baseY: cfg.y });
        }

        // Vertical axis connecting all quaternios — the spine
        const spinePoints = [
            new THREE.Vector3(0, 8, 0),
            new THREE.Vector3(0, -8, 0),
        ];
        const spineGeo = new THREE.BufferGeometry().setFromPoints(spinePoints);
        const spineMat = new THREE.LineBasicMaterial({
            color: ARROW_WHITE, transparent: true, opacity: 0.12,
        });
        this.mainGroup.add(new THREE.Line(spineGeo, spineMat));
    }

    /* ═══════════════════════════════════════════════════
       2. SERPENT — At center, glowing gold AND red
       ═══════════════════════════════════════════════════ */
    _createSerpent() {
        this.serpentGroup = new THREE.Group();

        // Coiled serpent body — a torus knot representing the dual nature
        const serpentGeo = new THREE.TorusKnotGeometry(0.8, 0.15, 128, 16, 2, 3);
        const serpentMat = new THREE.MeshStandardMaterial({
            color: SERPENT_GOLD,
            emissive: SERPENT_RED,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.7,
            metalness: 0.8,
            roughness: 0.15,
        });
        this.serpentMesh = new THREE.Mesh(serpentGeo, serpentMat);
        this.serpentGroup.add(this.serpentMesh);

        // Serpent aura — pulsing glow sphere
        const auraGeo = new THREE.SphereGeometry(1.5, 16, 16);
        const auraMat = new THREE.MeshBasicMaterial({
            color: SERPENT_RED, transparent: true, opacity: 0.06,
            blending: THREE.AdditiveBlending,
        });
        this.serpentAura = new THREE.Mesh(auraGeo, auraMat);
        this.serpentGroup.add(this.serpentAura);

        // Serpent eyes — two tiny bright points
        for (let side = -1; side <= 1; side += 2) {
            const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(side * 0.2, 0.15, 0.7);
            this.serpentGroup.add(eye);
        }

        this.serpentGroup.position.y = 0; // Exact center between Shadow and Paradise
        this.mainGroup.add(this.serpentGroup);
    }

    /* ═══════════════════════════════════════════════════
       3. DESCENT / ASCENT ARROWS — flowing particles
       ═══════════════════════════════════════════════════ */
    _createDescentAscentArrows() {
        const count = ARROW_PARTICLES;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        this.arrowVelocities = new Float32Array(count);
        this.arrowDirections = new Float32Array(count); // +1 = descent, -1 = ascent

        for (let i = 0; i < count; i++) {
            const isDescend = i < count / 2;
            const xOff = isDescend ? -0.6 : 0.6; // Two parallel streams
            positions[i * 3] = xOff + (Math.random() - 0.5) * 0.4;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

            this.arrowVelocities[i] = 1.5 + Math.random() * 1.5;
            this.arrowDirections[i] = isDescend ? -1 : 1;

            // Descent = cool blue, Ascent = warm gold
            if (isDescend) {
                colors[i * 3] = 0.3; colors[i * 3 + 1] = 0.5; colors[i * 3 + 2] = 1.0;
            } else {
                colors[i * 3] = 1.0; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0.2;
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.arrowField = new THREE.Points(geo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.08, sizeAttenuation: true,
            transparent: true, opacity: 0.6,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.mainGroup.add(this.arrowField);
    }

    /* ═══════════════════════════════════════════════════
       4. SOLVE ET COAGULA — breathing particle field
       ═══════════════════════════════════════════════════ */
    _createCoagulaField() {
        const count = COAGULA_PARTICLES;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        this.coagulaBasePositions = new Float32Array(count * 3);

        const qColors = [ANTHROPOS_GOLD, SHADOW_PURPLE, PARADISE_GREEN, LAPIS_RED];

        for (let i = 0; i < count; i++) {
            const qIdx = Math.floor(i / (count / Q_COUNT));
            const qY = [6, 2, -2, -6][qIdx];
            const r = 0.5 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = qY + r * Math.sin(phi) * Math.sin(theta) * 0.5;
            const z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            this.coagulaBasePositions[i * 3] = x;
            this.coagulaBasePositions[i * 3 + 1] = y;
            this.coagulaBasePositions[i * 3 + 2] = z;

            const c = qColors[qIdx];
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.coagulaField = new THREE.Points(geo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.05, sizeAttenuation: true,
            transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.mainGroup.add(this.coagulaField);
    }

    /* ═══════════════════════════════════════════════════
       5. HERMETIC VESSEL — transparent enclosing sphere
       ═══════════════════════════════════════════════════ */
    _createHermeticVessel() {
        // Outer vessel — the "squaring of the circle"
        const vesselGeo = new THREE.SphereGeometry(10, 64, 64);
        const vesselMat = new THREE.MeshPhysicalMaterial({
            color: VESSEL_CYAN,
            transparent: true,
            opacity: 0.04,
            metalness: 0.1,
            roughness: 0.0,
            transmission: 0.95,
            thickness: 0.5,
            side: THREE.BackSide,
        });
        this.vessel = new THREE.Mesh(vesselGeo, vesselMat);
        this.mainGroup.add(this.vessel);

        // Vessel rim rings — subtle equatorial and meridional lines
        for (let i = 0; i < 3; i++) {
            const rimGeo = new THREE.TorusGeometry(10, 0.02, 8, 128);
            const rimMat = new THREE.MeshBasicMaterial({
                color: VESSEL_CYAN, transparent: true, opacity: 0.08,
                blending: THREE.AdditiveBlending,
            });
            const rim = new THREE.Mesh(rimGeo, rimMat);
            if (i === 0) rim.rotation.x = 0; // equator
            if (i === 1) rim.rotation.x = Math.PI / 2; // meridian
            if (i === 2) rim.rotation.y = Math.PI / 2; // meridian 2
            this.mainGroup.add(rim);
        }
    }

    /* ═══════════════════════════════════════════════════
       6. PHOENIX CORE — carbon-nitrogen cycle glow
       ═══════════════════════════════════════════════════ */
    _createPhoenixCore() {
        // A pulsing ember at the heart of the uroboros
        const coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: PHOENIX_ORANGE, transparent: true, opacity: 0.0,
            blending: THREE.AdditiveBlending,
        });
        this.phoenixCore = new THREE.Mesh(coreGeo, coreMat);
        this.phoenixCore.position.y = 0;
        this.mainGroup.add(this.phoenixCore);

        // Outer halo
        const haloGeo = new THREE.SphereGeometry(1.0, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
            color: PHOENIX_ORANGE, transparent: true, opacity: 0.0,
            blending: THREE.AdditiveBlending,
        });
        this.phoenixHalo = new THREE.Mesh(haloGeo, haloMat);
        this.phoenixHalo.position.y = 0;
        this.mainGroup.add(this.phoenixHalo);
    }

    /* ═══════════════════════════════════════════════════
       7. COSMIC FIELD — ambient particles
       ═══════════════════════════════════════════════════ */
    _createCosmicField() {
        const count = COSMIC_PARTICLES;
        const positions = new Float32Array(count * 3);
        const allColors = [ANTHROPOS_GOLD, SHADOW_PURPLE, PARADISE_GREEN, LAPIS_RED, VESSEL_CYAN];

        const colorArr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 10 + Math.random() * 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            const c = allColors[i % allColors.length];
            colorArr[i * 3] = c.r * 0.5;
            colorArr[i * 3 + 1] = c.g * 0.5;
            colorArr[i * 3 + 2] = c.b * 0.5;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));

        this.cosmicField = new THREE.Points(geo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.06, sizeAttenuation: true,
            transparent: true, opacity: 0.25,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.cosmicField);
    }

    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));

        // Gold light from above (Anthropos)
        const topLight = new THREE.PointLight(0xffd700, 1.0, 30);
        topLight.position.set(0, 12, 0);
        this.scene.add(topLight);

        // Red light from below (Lapis)
        const bottomLight = new THREE.PointLight(0xc0392b, 0.6, 30);
        bottomLight.position.set(0, -12, 0);
        this.scene.add(bottomLight);

        // Serpent center light
        const centerLight = new THREE.PointLight(0xff6600, 0.8, 15);
        centerLight.position.set(0, 0, 3);
        this.scene.add(centerLight);

        // Rim lights
        const rim1 = new THREE.PointLight(0x22d3ee, 0.3, 25);
        rim1.position.set(10, 0, 10);
        this.scene.add(rim1);
        const rim2 = new THREE.PointLight(0x2ecc71, 0.3, 25);
        rim2.position.set(-10, 0, -10);
        this.scene.add(rim2);
    }

    /* ═══════════════════════════════════════════════════
       UPDATE LOOP
       ═══════════════════════════════════════════════════ */
    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.03);

        // ─── Quaternio rotation (slow individual spin) ───
        for (let i = 0; i < this.quaternios.length; i++) {
            const q = this.quaternios[i];
            q.group.rotation.y = t * (0.03 + i * 0.01) * (i % 2 === 0 ? 1 : -1);
            // Subtle breathing scale
            const breathe = 1 + Math.sin(t * 0.2 + i * 1.5) * 0.03;
            q.mesh.scale.setScalar(breathe);
        }

        // ─── UROBOROS — main group slowly curves / rotates ───
        this.mainGroup.rotation.y = t * 0.015 + this.mouseSmooth.x * 0.3;
        // Gentle tilt to show depth
        this.mainGroup.rotation.x = Math.sin(t * 0.04) * 0.08 + this.mouseSmooth.y * 0.15;

        // ─── Serpent rotation and pulse ───
        this.serpentMesh.rotation.x = t * 0.15;
        this.serpentMesh.rotation.y = t * 0.25;
        // Color oscillation between gold and red (max tension)
        const tensionPhase = Math.sin(t * 0.4) * 0.5 + 0.5;
        this.serpentMesh.material.color.lerpColors(SERPENT_GOLD, SERPENT_RED, tensionPhase);
        this.serpentMesh.material.emissive.lerpColors(SERPENT_RED, SERPENT_GOLD, tensionPhase);
        this.serpentMesh.material.emissiveIntensity = 0.4 + tensionPhase * 0.4;
        // Aura pulse
        this.serpentAura.material.opacity = 0.03 + Math.sin(t * 0.6) * 0.03;
        this.serpentAura.scale.setScalar(1 + Math.sin(t * 0.3) * 0.2);

        // ─── Descent/Ascent arrows — flowing particles ───
        const arrowPos = this.arrowField.geometry.attributes.position.array;
        for (let i = 0; i < ARROW_PARTICLES; i++) {
            arrowPos[i * 3 + 1] += this.arrowDirections[i] * this.arrowVelocities[i] * dt;
            // Wrap around
            if (arrowPos[i * 3 + 1] > 9) arrowPos[i * 3 + 1] = -9;
            if (arrowPos[i * 3 + 1] < -9) arrowPos[i * 3 + 1] = 9;
        }
        this.arrowField.geometry.attributes.position.needsUpdate = true;

        // ─── Solve et Coagula — breathing expansion/contraction ───
        const solvePhase = Math.sin(t * 0.12); // Slow cycle: -1 = coagula, +1 = solve
        const expansion = 1 + solvePhase * 0.6;
        const coagulaPos = this.coagulaField.geometry.attributes.position.array;
        for (let i = 0; i < COAGULA_PARTICLES; i++) {
            const bx = this.coagulaBasePositions[i * 3];
            const by = this.coagulaBasePositions[i * 3 + 1];
            const bz = this.coagulaBasePositions[i * 3 + 2];
            // Expand from center of each quaternio's y-level
            const qIdx = Math.floor(i / (COAGULA_PARTICLES / Q_COUNT));
            const qY = [6, 2, -2, -6][qIdx];
            coagulaPos[i * 3] = bx * expansion;
            coagulaPos[i * 3 + 1] = qY + (by - qY) * expansion;
            coagulaPos[i * 3 + 2] = bz * expansion;
        }
        this.coagulaField.geometry.attributes.position.needsUpdate = true;
        this.coagulaField.material.opacity = 0.3 + (1 - Math.abs(solvePhase)) * 0.3;

        // ─── Phoenix Core — carbon-nitrogen rebirth pulse ───
        const phoenixProgress = Math.min(1, t / 90); // Grows over 90 seconds
        const phoenixPulse = Math.sin(t * 0.8) * 0.5 + 0.5;
        this.phoenixCore.material.opacity = phoenixProgress * (0.3 + phoenixPulse * 0.5);
        this.phoenixCore.scale.setScalar(0.5 + phoenixPulse * 0.5);
        this.phoenixHalo.material.opacity = phoenixProgress * phoenixPulse * 0.08;
        this.phoenixHalo.scale.setScalar(1 + phoenixPulse * 1.5);

        // ─── Vessel subtle shimmer ───
        this.vessel.material.opacity = 0.03 + Math.sin(t * 0.1) * 0.015;

        // ─── Cosmic field slow rotation ───
        this.cosmicField.rotation.y += dt * 0.002;

        // ─── Camera — grand orbital ───
        const camAngle = t * 0.018 + this.mouseSmooth.x * 0.4;
        const camHeight = 4 + this.mouseSmooth.y * 5 + Math.sin(t * 0.03) * 3;
        const camDist = 22 - phoenixProgress * 3;
        this.camera.position.set(
            Math.sin(camAngle) * camDist,
            camHeight,
            Math.cos(camAngle) * camDist
        );
        this.camera.lookAt(0, 0, 0);

        // ─── Bloom breathing ───
        if (this.bloomPass) {
            this.bloomPass.strength = 1.2 + Math.sin(t * 0.08) * 0.3 + phoenixPulse * 0.2;
        }
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
        this.scene?.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
                else obj.material.dispose();
            }
        });
        this.composer = null; this.scene = null; this.camera = null; this.renderer = null;
        super.dispose();
    }
}
