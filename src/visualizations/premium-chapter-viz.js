/**
 * Premium Chapter Visualization
 * Monochromatic 3D visualization with enhanced interactions
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class PremiumChapterVisualization {
  constructor(container, chapterData) {
    this.container = container;
    this.chapterData = chapterData;
    this.animationId = null;
    this.time = 0;
    
    this.init();
  }

  init() {
    this.setupScene();
    this.createVisualization();
    this.setupLighting();
    this.setupControls();
    this.setupEventListeners();
    this.animate();
  }

  setupScene() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0A0A0A); // grey-900
    
    // Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 30);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.container.appendChild(this.renderer.domElement);
  }

  createVisualization() {
    // Create based on chapter theme
    switch(this.chapterData.id) {
      case 1: // The Ego
        this.createEgoVisualization();
        break;
      case 2: // The Shadow
        this.createShadowVisualization();
        break;
      case 3: // The Syzygy
        this.createSyzygyVisualization();
        break;
      default:
        this.createDefaultVisualization();
    }
  }

  createEgoVisualization() {
    // Central sphere representing the ego
    const geometry = new THREE.SphereGeometry(5, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: 0xF0F0F0, // grey-050
      emissive: 0x1F1F1F, // grey-700
      emissiveIntensity: 0.2,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    
    this.ego = new THREE.Mesh(geometry, material);
    this.scene.add(this.ego);
    
    // Consciousness field - particle system
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 8 + Math.random() * 4;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      opacities[i] = Math.random() * 0.6 + 0.4;
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x8A8A8A, // grey-200
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.particles);
    
    // Consciousness rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(7 + i * 2, 0.1, 16, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x3F3F3F, // grey-500
        transparent: true,
        opacity: 0.3 - i * 0.1
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + i * 0.2;
      this.scene.add(ring);
    }
  }

  createShadowVisualization() {
    // Dark mirror of the ego
    const geometry = new THREE.IcosahedronGeometry(5, 2);
    const material = new THREE.MeshPhongMaterial({
      color: 0x141414, // grey-800
      emissive: 0x0A0A0A, // grey-900
      emissiveIntensity: 0.5,
      shininess: 20,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    this.shadow = new THREE.Mesh(geometry, material);
    this.scene.add(this.shadow);
    
    // Shadow tendrils
    const tendrilCount = 8;
    this.tendrils = [];
    
    for (let i = 0; i < tendrilCount; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(i * Math.PI * 2 / tendrilCount) * 10,
          Math.sin(i * Math.PI * 2 / tendrilCount) * 10,
          Math.random() * 5 - 2.5
        ),
        new THREE.Vector3(
          Math.cos(i * Math.PI * 2 / tendrilCount) * 15,
          Math.sin(i * Math.PI * 2 / tendrilCount) * 15,
          Math.random() * 10 - 5
        )
      ]);
      
      const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.2, 8, false);
      const tubeMaterial = new THREE.MeshBasicMaterial({
        color: 0x1F1F1F, // grey-700
        transparent: true,
        opacity: 0.6
      });
      
      const tendril = new THREE.Mesh(tubeGeometry, tubeMaterial);
      this.tendrils.push(tendril);
      this.scene.add(tendril);
    }
  }

  createSyzygyVisualization() {
    // Anima and Animus - dual spheres
    const geometry = new THREE.SphereGeometry(4, 32, 32);
    
    // Anima (feminine)
    const animaMaterial = new THREE.MeshPhongMaterial({
      color: 0xF0F0F0, // grey-050
      emissive: 0xA5A5A5, // grey-100
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8
    });
    
    this.anima = new THREE.Mesh(geometry, animaMaterial);
    this.anima.position.x = -5;
    this.scene.add(this.anima);
    
    // Animus (masculine)
    const animusMaterial = new THREE.MeshPhongMaterial({
      color: 0x2A2A2A, // grey-600
      emissive: 0x141414, // grey-800
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8
    });
    
    this.animus = new THREE.Mesh(geometry, animusMaterial);
    this.animus.position.x = 5;
    this.scene.add(this.animus);
    
    // Connection field
    const connectionGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 32);
    const connectionMaterial = new THREE.MeshBasicMaterial({
      color: 0x555555, // grey-400
      transparent: true,
      opacity: 0.3
    });
    
    this.connection = new THREE.Mesh(connectionGeometry, connectionMaterial);
    this.connection.rotation.z = Math.PI / 2;
    this.scene.add(this.connection);
  }

  createDefaultVisualization() {
    // Generic visualization for other chapters
    const geometry = new THREE.BoxGeometry(8, 8, 8);
    const material = new THREE.MeshPhongMaterial({
      color: 0x3F3F3F, // grey-500
      emissive: 0x1F1F1F, // grey-700
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8
    });
    
    this.centerObject = new THREE.Mesh(geometry, material);
    this.scene.add(this.centerObject);
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x555555, 0.4); // grey-400
    this.scene.add(ambientLight);
    
    // Key light
    const keyLight = new THREE.DirectionalLight(0xF0F0F0, 0.8); // grey-050
    keyLight.position.set(10, 10, 10);
    keyLight.castShadow = true;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    this.scene.add(keyLight);
    
    // Fill light
    const fillLight = new THREE.DirectionalLight(0x8A8A8A, 0.4); // grey-200
    fillLight.position.set(-10, 5, -10);
    this.scene.add(fillLight);
    
    // Rim light
    const rimLight = new THREE.DirectionalLight(0xA5A5A5, 0.3); // grey-100
    rimLight.position.set(0, -10, -10);
    this.scene.add(rimLight);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.8;
    this.controls.panSpeed = 0.8;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
  }

  setupEventListeners() {
    // Responsive resize
    window.addEventListener('resize', () => this.handleResize());
    
    // Mouse interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
    
    this.container.addEventListener('click', () => this.handleClick());
  }

  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  handleClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    
    if (intersects.length > 0) {
      const object = intersects[0].object;
      
      // Pulse animation on click
      const scale = object.scale.x;
      object.scale.set(scale * 1.1, scale * 1.1, scale * 1.1);
      
      setTimeout(() => {
        object.scale.set(scale, scale, scale);
      }, 200);
    }
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    this.time += 0.01;
    
    // Update animations based on chapter
    if (this.ego) {
      this.ego.rotation.y += 0.003;
      this.particles.rotation.y -= 0.001;
    }
    
    if (this.shadow) {
      this.shadow.rotation.x += 0.005;
      this.shadow.rotation.y += 0.003;
      
      this.tendrils.forEach((tendril, i) => {
        tendril.rotation.z = Math.sin(this.time + i) * 0.1;
      });
    }
    
    if (this.anima && this.animus) {
      this.anima.position.y = Math.sin(this.time) * 0.5;
      this.animus.position.y = -Math.sin(this.time) * 0.5;
      this.connection.scale.y = 1 + Math.sin(this.time * 2) * 0.1;
    }
    
    if (this.centerObject) {
      this.centerObject.rotation.x += 0.002;
      this.centerObject.rotation.y += 0.003;
    }
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    this.renderer.dispose();
    this.controls.dispose();
    
    // Clean up Three.js objects
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    this.container.removeChild(this.renderer.domElement);
  }
}

export default PremiumChapterVisualization;