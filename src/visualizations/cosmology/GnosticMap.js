import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RealmBuilder } from './RealmBuilder.js';
import { CameraController } from './CameraController.js';

export class GnosticMap {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.realms = {};
        this.hotspots = [];
        this.particles = [];
        this.isGuided = false;
        this.currentRealm = 'pleroma';
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupPostProcessing();
        this.setupControls();
        this.createRealms();
        this.createParticles();
        this.createHotspots();
        this.setupEventListeners();
        this.animate();
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 50, 150);
        
        this.cameraController = new CameraController(this.camera, this.scene);
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Divine light from Pleroma
        this.divineLight = new THREE.PointLight(0xffffff, 2, 1000);
        this.divineLight.position.set(0, 300, 0);
        this.scene.add(this.divineLight);
        
        // Realm-specific lights will be added by RealmBuilder
    }
    
    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        
        // Bloom for divine radiance
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // strength
            0.4, // radius
            0.85  // threshold
        );
        this.composer.addPass(bloomPass);
    }
    
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 500;
        this.controls.maxPolarAngle = Math.PI * 0.9;
    }
    
    createRealms() {
        const realmBuilder = new RealmBuilder(this.scene);
        
        // Create each realm
        this.realms.pleroma = realmBuilder.createPleroma();
        this.realms.ogdoad = realmBuilder.createOgdoad();
        this.realms.hebdomad = realmBuilder.createHebdomad();
        this.realms.kenoma = realmBuilder.createKenoma();
        this.realms.material = realmBuilder.createMaterialWorld();
        
        // Position realms vertically
        this.realms.pleroma.position.y = 300;
        this.realms.ogdoad.position.y = 200;
        this.realms.hebdomad.position.y = 100;
        this.realms.kenoma.position.y = 0;
        this.realms.material.position.y = -100;
        
        // Add all realms to scene
        Object.values(this.realms).forEach(realm => {
            this.scene.add(realm);
        });
    }
    
    createParticles() {
        // Divine particles descending from Pleroma
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Cylindrical distribution
            const radius = Math.random() * 200;
            const theta = Math.random() * Math.PI * 2;
            const height = Math.random() * 600 - 100;
            
            positions[i3] = radius * Math.cos(theta);
            positions[i3 + 1] = height;
            positions[i3 + 2] = radius * Math.sin(theta);
            
            // Color gradient from white (divine) to gray (material)
            const colorIntensity = (height + 100) / 500;
            colors[i3] = colorIntensity;
            colors[i3 + 1] = colorIntensity;
            colors[i3 + 2] = colorIntensity;
            
            sizes[i] = Math.random() * 2 + 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }
    
    createHotspots() {
        const hotspotData = [
            {
                position: new THREE.Vector3(0, 300, 0),
                realm: 'pleroma',
                title: 'Pleroma',
                description: 'The divine fullness, the realm of pure being and unity with the Godhead.'
            },
            {
                position: new THREE.Vector3(30, 200, 0),
                realm: 'ogdoad',
                title: 'Ogdoad',
                description: 'The eight primordial powers, representing the first emanations from the Pleroma.'
            },
            {
                position: new THREE.Vector3(0, 100, 40),
                realm: 'hebdomad',
                title: 'Hebdomad',
                description: 'The seven planetary archons, rulers of the cosmic spheres.'
            },
            {
                position: new THREE.Vector3(0, 0, 0),
                realm: 'kenoma',
                title: 'Kenoma',
                description: 'The void or deficiency, the space between divine fullness and material creation.'
            },
            {
                position: new THREE.Vector3(0, -100, 0),
                realm: 'material',
                title: 'Material World',
                description: 'The physical realm, furthest from divine light, where souls are trapped in matter.'
            }
        ];
        
        hotspotData.forEach(data => {
            const hotspot = this.createHotspot(data);
            this.hotspots.push(hotspot);
            this.scene.add(hotspot.mesh);
        });
    }
    
    createHotspot(data) {
        const geometry = new THREE.SphereGeometry(3, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(data.position);
        
        // Add pulsing animation
        mesh.userData = {
            ...data,
            pulsePhase: Math.random() * Math.PI * 2
        };
        
        return { mesh, data };
    }
    
    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
        
        // UI controls
        this.createUIControls();
    }
    
    createUIControls() {
        const uiContainer = document.createElement('div');
        uiContainer.className = 'cosmology-ui';
        uiContainer.innerHTML = `
            <div class="realm-selector">
                <h3>Navigate Realms</h3>
                <button data-realm="pleroma">Pleroma</button>
                <button data-realm="ogdoad">Ogdoad</button>
                <button data-realm="hebdomad">Hebdomad</button>
                <button data-realm="kenoma">Kenoma</button>
                <button data-realm="material">Material World</button>
            </div>
            <div class="controls">
                <button id="guidedTour">Guided Tour</button>
                <button id="freeExplore">Free Explore</button>
            </div>
            <div class="info-panel" id="infoPanel"></div>
        `;
        
        this.container.appendChild(uiContainer);
        
        // Add event listeners
        uiContainer.querySelectorAll('[data-realm]').forEach(button => {
            button.addEventListener('click', (e) => {
                const realm = e.target.dataset.realm;
                this.navigateToRealm(realm);
            });
        });
        
        document.getElementById('guidedTour').addEventListener('click', () => {
            this.startGuidedTour();
        });
        
        document.getElementById('freeExplore').addEventListener('click', () => {
            this.stopGuidedTour();
        });
    }
    
    navigateToRealm(realmName) {
        if (this.realms[realmName]) {
            const targetPosition = this.realms[realmName].position.clone();
            targetPosition.z += 150; // Offset for viewing
            
            this.cameraController.moveTo(targetPosition, () => {
                this.currentRealm = realmName;
                this.updateInfoPanel(realmName);
            });
        }
    }
    
    startGuidedTour() {
        this.isGuided = true;
        const realmOrder = ['pleroma', 'ogdoad', 'hebdomad', 'kenoma', 'material'];
        let currentIndex = 0;
        
        const tourNext = () => {
            if (currentIndex < realmOrder.length && this.isGuided) {
                this.navigateToRealm(realmOrder[currentIndex]);
                currentIndex++;
                setTimeout(tourNext, 8000); // 8 seconds per realm
            }
        };
        
        tourNext();
    }
    
    stopGuidedTour() {
        this.isGuided = false;
    }
    
    updateInfoPanel(realmName) {
        const infoPanel = document.getElementById('infoPanel');
        const hotspot = this.hotspots.find(h => h.data.realm === realmName);
        
        if (hotspot) {
            infoPanel.innerHTML = `
                <h2>${hotspot.data.title}</h2>
                <p>${hotspot.data.description}</p>
            `;
            infoPanel.classList.add('visible');
        }
    }
    
    onMouseClick(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        const hotspotMeshes = this.hotspots.map(h => h.mesh);
        const intersects = raycaster.intersectObjects(hotspotMeshes);
        
        if (intersects.length > 0) {
            const clickedHotspot = this.hotspots.find(h => h.mesh === intersects[0].object);
            if (clickedHotspot) {
                this.updateInfoPanel(clickedHotspot.data.realm);
                this.cameraController.focusOn(clickedHotspot.mesh.position);
            }
        }
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        const time = performance.now() * 0.001;
        
        // Update camera controller
        this.cameraController.update();
        
        // Update controls
        this.controls.update();
        
        // Animate particles
        if (this.particleSystem) {
            this.particleSystem.rotation.y = time * 0.05;
            
            // Particle flow
            const positions = this.particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] -= 0.5; // Descend
                if (positions[i + 1] < -100) {
                    positions[i + 1] = 400; // Reset to top
                }
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }
        
        // Animate hotspots
        this.hotspots.forEach(hotspot => {
            const phase = hotspot.mesh.userData.pulsePhase;
            const scale = 1 + Math.sin(time * 2 + phase) * 0.2;
            hotspot.mesh.scale.setScalar(scale);
        });
        
        // Animate realms
        if (this.realms.pleroma) {
            this.realms.pleroma.rotation.y = time * 0.1;
        }
        if (this.realms.ogdoad) {
            this.realms.ogdoad.rotation.y = -time * 0.05;
        }
        if (this.realms.hebdomad) {
            this.realms.hebdomad.rotation.y = time * 0.03;
        }
        
        // Render
        this.composer.render();
    }
}