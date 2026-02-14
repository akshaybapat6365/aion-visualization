/**
 * ThreeUnusViz.js — Chapter 12: "Background to the Psychology of Christian Alchemical Symbolism"
 *
 * Jung: Alchemy was born from Gnosticism. When symbols lose their
 * numinosity — their connection to the unconscious — they become
 * empty husks. The fish swims from historical Christ to psychological Self.
 *
 * Visual: "Mater Alchimia" — a genealogical golden stream flows from
 * Gnostic sources (left) into alchemical vessels (right). The stream
 * fractures into two rivers: one toward faith (church), one toward
 * knowledge (laboratory). A serpent sheds its skin (renewal of symbols).
 * Mandala shapes wither when disconnected from their source. A luminous
 * fish bridges past and present.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import BaseViz from '../../../features/viz-platform/BaseViz.js';

const GNOSIS_GOLD = new THREE.Color('#ffd700');
const FAITH_BLUE = new THREE.Color('#4a90d9');
const KNOWLEDGE_GREEN = new THREE.Color('#2ecc71');
const SNAKE_OLD = new THREE.Color('#4a4a3a');
const SNAKE_NEW = new THREE.Color('#ffd700');
const WITHER_GREY = new THREE.Color('#3a3a3a');
const FISH_CYAN = new THREE.Color('#22d3ee');
const ALCHEMY_RED = new THREE.Color('#c0392b');
const VOID = 0x050510;

const STREAM_PARTICLES = 300;
const MANDALA_COUNT = 6;

export default class ThreeUnusViz extends BaseViz {
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
        this.camera.position.set(0, 3, 14);

        this.mouse = new THREE.Vector2(0, 0);
        this.mouseSmooth = new THREE.Vector2(0, 0);
        this._onMouseMove = this._onMouseMove.bind(this);
        window.addEventListener('mousemove', this._onMouseMove);

        this._createGoldenStream();
        this._createFaithKnowledgeSplit();
        this._createSnakeSkin();
        this._createWitheringMandalas();
        this._createFishBridge();
        this._createAmbientParticles();
        this._createLights();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.width, this.height), 1.1, 0.6, 0.4
        );
        this.composer.addPass(this.bloomPass);
    }

    /* ═══ 1. Golden Stream — Gnosis to Alchemy ═══ */
    _createGoldenStream() {
        const count = STREAM_PARTICLES;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        this.streamPhases = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const t = i / count;
            // Flow from left (-8) to center (0), then split
            positions[i * 3] = -8 + t * 8;
            positions[i * 3 + 1] = Math.sin(t * Math.PI * 4) * 0.3;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            this.streamPhases[i] = Math.random() * Math.PI * 2;

            colors[i * 3] = GNOSIS_GOLD.r;
            colors[i * 3 + 1] = GNOSIS_GOLD.g;
            colors[i * 3 + 2] = GNOSIS_GOLD.b;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        this.goldenStream = new THREE.Points(geo, new THREE.PointsMaterial({
            vertexColors: true, size: 0.1, sizeAttenuation: true,
            transparent: true, opacity: 0.6,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.goldenStream);
    }

    /* ═══ 2. Faith / Knowledge Split ═══ */
    _createFaithKnowledgeSplit() {
        // Faith stream (upper-right, blue)
        this.faithParticles = this._createBranchStream(FAITH_BLUE, 1, 150);
        this.scene.add(this.faithParticles.points);

        // Church silhouette — simple triangle (steeple)
        const churchGeo = new THREE.ConeGeometry(0.6, 2, 4);
        const churchMat = new THREE.MeshStandardMaterial({
            color: FAITH_BLUE, emissive: FAITH_BLUE, emissiveIntensity: 0.3,
            transparent: true, opacity: 0.3,
        });
        this.church = new THREE.Mesh(churchGeo, churchMat);
        this.church.position.set(7, 3, 0);
        this.scene.add(this.church);

        // Knowledge stream (lower-right, green)
        this.knowledgeParticles = this._createBranchStream(KNOWLEDGE_GREEN, -1, 150);
        this.scene.add(this.knowledgeParticles.points);

        // Laboratory silhouette — flask shape (sphere + cylinder)
        const labGroup = new THREE.Group();
        const flaskBody = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 12, 12),
            new THREE.MeshStandardMaterial({
                color: KNOWLEDGE_GREEN, emissive: KNOWLEDGE_GREEN, emissiveIntensity: 0.3,
                transparent: true, opacity: 0.3,
            })
        );
        labGroup.add(flaskBody);
        const flaskNeck = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8),
            flaskBody.material.clone()
        );
        flaskNeck.position.y = 0.6;
        labGroup.add(flaskNeck);
        labGroup.position.set(7, -3, 0);
        this.lab = labGroup;
        this.scene.add(labGroup);
    }

    _createBranchStream(color, yDir, count) {
        const positions = new Float32Array(count * 3);
        const phases = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const t = i / count;
            positions[i * 3] = t * 7;
            positions[i * 3 + 1] = yDir * t * 3 + Math.sin(t * 6) * 0.2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
            phases[i] = Math.random() * Math.PI * 2;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const points = new THREE.Points(geo, new THREE.PointsMaterial({
            color, size: 0.07, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        return { points, phases, yDir, count };
    }

    /* ═══ 3. Snake Changing Skin ═══ */
    _createSnakeSkin() {
        this.snakeGroup = new THREE.Group();

        // Old skin — dull, cracking
        const oldGeo = new THREE.TorusKnotGeometry(1.0, 0.12, 64, 8, 2, 3);
        const oldMat = new THREE.MeshStandardMaterial({
            color: SNAKE_OLD, emissive: '#1a1a10', emissiveIntensity: 0.2,
            transparent: true, opacity: 0.4, roughness: 0.9,
        });
        this.oldSkin = new THREE.Mesh(oldGeo, oldMat);
        this.snakeGroup.add(this.oldSkin);

        // New skin — gleaming gold emerging
        const newGeo = new THREE.TorusKnotGeometry(0.9, 0.1, 64, 8, 2, 3);
        const newMat = new THREE.MeshStandardMaterial({
            color: SNAKE_NEW, emissive: SNAKE_NEW, emissiveIntensity: 0.5,
            transparent: true, opacity: 0.0, metalness: 0.7, roughness: 0.2,
        });
        this.newSkin = new THREE.Mesh(newGeo, newMat);
        this.snakeGroup.add(this.newSkin);

        this.snakeGroup.position.set(-4, -2, -2);
        this.snakeGroup.scale.setScalar(0.8);
        this.scene.add(this.snakeGroup);
    }

    /* ═══ 4. Withering Mandalas ═══ */
    _createWitheringMandalas() {
        this.mandalas = [];
        for (let i = 0; i < MANDALA_COUNT; i++) {
            const radius = 0.4 + Math.random() * 0.4;
            const geo = new THREE.TorusGeometry(radius, 0.02, 8, 32);
            const mat = new THREE.MeshBasicMaterial({
                color: GNOSIS_GOLD, transparent: true, opacity: 0.3,
                blending: THREE.AdditiveBlending,
            });
            const mesh = new THREE.Mesh(geo, mat);

            // Scatter around the scene
            mesh.position.set(
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 4 - 2
            );
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

            this.scene.add(mesh);
            this.mandalas.push({
                mesh, mat,
                connected: Math.random() > 0.5, // some start connected, some disconnected
                phase: Math.random() * Math.PI * 2,
                originalColor: GNOSIS_GOLD.clone(),
            });
        }
    }

    /* ═══ 5. Fish Bridge ═══ */
    _createFishBridge() {
        this.fishGroup = new THREE.Group();

        // Fish body
        const bodyGeo = new THREE.SphereGeometry(0.2, 12, 8);
        bodyGeo.scale(2.5, 0.7, 0.5);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: FISH_CYAN, emissive: FISH_CYAN, emissiveIntensity: 0.6,
            transparent: true, opacity: 0.7, metalness: 0.5,
        });
        this.fishBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.fishGroup.add(this.fishBody);

        // Fish tail
        const tailGeo = new THREE.ConeGeometry(0.12, 0.3, 4);
        const tail = new THREE.Mesh(tailGeo, bodyMat.clone());
        tail.position.x = -0.55;
        tail.rotation.z = Math.PI / 2;
        this.fishGroup.add(tail);

        // Luminous trail
        const trailCount = 60;
        const trailPos = new Float32Array(trailCount * 3);
        for (let i = 0; i < trailCount; i++) {
            trailPos[i * 3] = -i * 0.15;
            trailPos[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
            trailPos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
        }
        const trailGeo = new THREE.BufferGeometry();
        trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
        this.fishTrail = new THREE.Points(trailGeo, new THREE.PointsMaterial({
            color: FISH_CYAN, size: 0.04, transparent: true, opacity: 0.4,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.fishGroup.add(this.fishTrail);

        this.fishGroup.position.set(-6, 0, 2);
        this.scene.add(this.fishGroup);
    }

    _createAmbientParticles() {
        const count = 500;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 5 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.ambientPts = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x2a2a3a, size: 0.04, transparent: true, opacity: 0.2,
            blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        this.scene.add(this.ambientPts);
    }

    _createLights() {
        this.scene.add(new THREE.AmbientLight(0x0a0a15, 0.3));
        const goldLight = new THREE.PointLight(0xffd700, 0.8, 20);
        goldLight.position.set(-5, 2, 5);
        this.scene.add(goldLight);
        const blueLight = new THREE.PointLight(0x4a90d9, 0.4, 20);
        blueLight.position.set(5, 4, 3);
        this.scene.add(blueLight);
        const greenLight = new THREE.PointLight(0x2ecc71, 0.4, 20);
        greenLight.position.set(5, -4, 3);
        this.scene.add(greenLight);
    }

    update(dt) {
        if (!this.scene) return;
        const t = this.time;
        this.mouseSmooth.lerp(this.mouse, 0.03);

        // ─── Golden stream flow ───
        const streamPos = this.goldenStream.geometry.attributes.position.array;
        for (let i = 0; i < STREAM_PARTICLES; i++) {
            streamPos[i * 3] += dt * 0.8;
            if (streamPos[i * 3] > 0) streamPos[i * 3] = -8;
            streamPos[i * 3 + 1] = Math.sin(t * 0.5 + this.streamPhases[i]) * 0.3;
        }
        this.goldenStream.geometry.attributes.position.needsUpdate = true;

        // ─── Branch streams flow ───
        this._updateBranchStream(this.faithParticles, dt, t);
        this._updateBranchStream(this.knowledgeParticles, dt, t);

        // ─── Snake skin shedding cycle (every 20s) ───
        const shedCycle = (t * 0.05) % 1;
        this.oldSkin.material.opacity = 0.4 * (1 - shedCycle);
        this.newSkin.material.opacity = 0.6 * shedCycle;
        this.oldSkin.scale.setScalar(1 + shedCycle * 0.15);
        this.snakeGroup.rotation.y = t * 0.1;
        this.snakeGroup.rotation.x = t * 0.05;

        // ─── Withering mandalas ───
        for (const m of this.mandalas) {
            // Toggle connectedness every ~15 seconds
            const connected = Math.sin(t * 0.07 + m.phase) > 0;
            if (connected) {
                m.mat.color.lerp(m.originalColor, dt * 2);
                m.mat.opacity = Math.min(0.3, m.mat.opacity + dt * 0.1);
            } else {
                m.mat.color.lerp(WITHER_GREY, dt * 0.5);
                m.mat.opacity = Math.max(0.05, m.mat.opacity - dt * 0.05);
            }
            m.mesh.rotation.z += dt * 0.05;
        }

        // ─── Fish bridge — swimming from left to right ───
        const fishX = -6 + ((t * 0.3) % 14);
        this.fishGroup.position.x = fishX > 8 ? -6 : fishX;
        this.fishGroup.position.y = Math.sin(t * 0.5) * 0.3;
        this.fishBody.material.emissiveIntensity = 0.4 + Math.sin(t * 0.8) * 0.2;

        // ─── Camera ───
        const camAngle = t * 0.015 + this.mouseSmooth.x * 0.3;
        const camH = 3 + this.mouseSmooth.y * 3;
        this.camera.position.set(
            Math.sin(camAngle) * 14,
            camH,
            Math.cos(camAngle) * 14
        );
        this.camera.lookAt(0, 0, 0);

        this.ambientPts.rotation.y += dt * 0.002;

        if (this.bloomPass) {
            this.bloomPass.strength = 1.0 + Math.sin(t * 0.08) * 0.2;
        }
    }

    _updateBranchStream(stream, dt, t) {
        const pos = stream.points.geometry.attributes.position.array;
        for (let i = 0; i < stream.count; i++) {
            pos[i * 3] += dt * 0.5;
            if (pos[i * 3] > 7) pos[i * 3] = 0;
            pos[i * 3 + 1] = stream.yDir * (pos[i * 3] / 7) * 3 + Math.sin(t * 0.3 + stream.phases[i]) * 0.2;
        }
        stream.points.geometry.attributes.position.needsUpdate = true;
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
