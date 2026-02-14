import * as THREE from 'three';
import BaseViz from '../../../features/viz-platform/BaseViz.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

/**
 * Chapter 11: The Alchemical Interpretation
 * 3D Visualization: The Memory Palace / Library of Symbols.
 */
export default class ThreeLibraryViz extends BaseViz {
    constructor(container) {
        super(container, { contextType: 'webgl' });
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.booksGroup = null;
        this.books = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedBook = null;

        this.symbols = [
            { id: 'lion', title: 'The Green Lion', color: 0x2ecc71, desc: 'The dissolving agent.' },
            { id: 'ouroboros', title: 'The Ouroboros', color: 0xe67e22, desc: 'Eternal return.' },
            { id: 'sol', title: 'Sol & Luna', color: 0xf1c40f, desc: 'The union of opposites.' },
            { id: 'pelican', title: 'The Pelican', color: 0xe74c3c, desc: 'Self-sacrifice.' },
            { id: 'stone', title: 'Lapis Philosophorum', color: 0x9b59b6, desc: 'The goal of the work.' },
            { id: 'king', title: 'The King', color: 0x3498db, desc: 'Consciousness.' }
        ];
    }

    async init() {
        // 1. Setup Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.04);

        const aspect = this.width / this.height;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
        this.camera.position.set(0, 2, 8);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 2. Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambient);

        const centerLight = new THREE.PointLight(0xffffff, 1, 20);
        centerLight.position.set(0, 5, 0);
        this.scene.add(centerLight);

        // 3. Create Library
        this.createLibrary();

        // 4. UI
        this._createUI();

        // 5. Interaction
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.container.addEventListener('click', this.onClick.bind(this));
    }

    createLibrary() {
        this.booksGroup = new THREE.Group();
        this.scene.add(this.booksGroup);

        // Circular arrangement of "Books" / Tablets
        const count = this.symbols.length;
        const radius = 4;

        const boxGeo = new THREE.BoxGeometry(1.5, 2, 0.2);

        this.symbols.forEach((data, i) => {
            const angle = (i / count) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const mat = new THREE.MeshStandardMaterial({
                color: 0x333333,
                emissive: data.color,
                emissiveIntensity: 0.2,
                roughness: 0.4,
                metalness: 0.6
            });

            const book = new THREE.Mesh(boxGeo, mat);
            book.position.set(x, 0, z);
            book.lookAt(0, 0, 0);

            // float mechanic
            book.userData = {
                originalPos: book.position.clone(),
                originalRot: book.rotation.clone(),
                angle: angle,
                data: data,
                index: i
            };

            this.booksGroup.add(book);
            this.books.push(book);
        });

        // Floor
        const floorGeo = new THREE.PlaneGeometry(20, 20);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x050505,
            roughness: 0.8,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2;
        this.scene.add(floor);
    }

    _createUI() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position:absolute;inset:0;pointer-events:none;
          font-family:var(--font-sans,system-ui);color:#d4af37;
          display:flex; justify-content:center; align-items:flex-end;
          padding-bottom: 3rem;
        `;

        this.infoPanel = document.createElement('div');
        this.infoPanel.style.cssText = `
            background: rgba(0,0,0,0.8); border: 1px solid #d4af37; 
            padding: 1.5rem; text-align:center; max-width: 400px;
            opacity: 0; transition: opacity 0.5s; pointer-events:none;
        `;
        overlay.appendChild(this.infoPanel);

        // Add title overlay
        const title = document.createElement('div');
        title.innerHTML = 'THE MEMORY PALACE<br><span style="font-size:0.6em;opacity:0.6">Click a symbol to interpret</span>';
        title.style.cssText = `position:absolute; top:10%; text-align:center;`;
        overlay.appendChild(title);

        this.container.appendChild(overlay);
        this._overlay = overlay;
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onClick() {
        if (this.hoveredBook) {
            this.selectBook(this.hoveredBook);
        } else if (this.selectedBook) {
            this.deselectBook();
        }
    }

    selectBook(book) {
        if (this.selectedBook === book) return; // Already selected

        // Reset previous
        if (this.selectedBook) {
            // Animate back would be nice, but simple snap for now
            const prev = this.selectedBook;
            // We handle reset in update via lerp
        }

        this.selectedBook = book;

        // UI
        const data = book.userData.data;
        this.infoPanel.innerHTML = `
            <h3 style="margin:0 0 0.5rem 0; color:#${data.color.toString(16)}">${data.title}</h3>
            <p style="margin:0; font-size:0.9rem; color:#ccc">${data.desc}</p>
        `;
        this.infoPanel.style.opacity = 1;
    }

    deselectBook() {
        this.selectedBook = null;
        this.infoPanel.style.opacity = 0;
    }

    onResize(width, height) {
        if (this.camera && this.renderer) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
    }

    render() {
        if (!this.renderer || !this.scene || !this.camera) return;
        const time = this.time;

        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.books);

        // Rotation of the group
        if (!this.selectedBook) {
            this.booksGroup.rotation.y = time * 0.1;
        }

        if (intersects.length > 0) {
            document.body.style.cursor = 'pointer';
            this.hoveredBook = intersects[0].object;
            // Hover effect
            this.hoveredBook.material.emissiveIntensity = 0.8 + Math.sin(time * 10) * 0.2;
        } else {
            document.body.style.cursor = 'default';
            this.hoveredBook = null;
        }

        // Update Books Positions
        this.books.forEach(book => {
            const isSelected = this.selectedBook === book;
            const isHovered = this.hoveredBook === book;

            let targetPos = book.userData.originalPos.clone();
            let targetRot = book.userData.originalRot.clone();
            let targetScale = 1;

            if (isSelected) {
                // Determine position in front of camera
                // Since group rotates, we need to be careful. 
                // Easier: Move camera to look at book, or move book to local camera space.
                // Let's move book to world center but slightly elevated

                // We actually need to account for parent rotation. 
                // Hack: When selected, stop parent rotation and move book to [0,1,6] (near camera)
                // But parent is rotating. So [0,1,6] in world space is different in local space.
                // Visual trick: just lerp the scale and emissive, keep position relative but float UP

                // Actually, let's just make it float UP and toward center
                targetPos.y = 2;
                targetPos.multiplyScalar(0.5); // Move in
                targetScale = 1.5;

                book.material.emissiveIntensity = 1.0;
            } else {
                book.material.emissiveIntensity = isHovered ? 0.6 : 0.2;

                // Float animation
                targetPos.y += Math.sin(time * 2 + book.userData.index) * 0.1;
            }

            book.position.lerp(targetPos, 0.1);
            book.scale.setScalar(THREE.MathUtils.lerp(book.scale.x, targetScale, 0.1));

            // Always look at center
            book.lookAt(0, book.position.y, 0);
        });

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        window.removeEventListener('mousemove', this.onMouseMove.bind(this));
        this.container.removeEventListener('click', this.onClick.bind(this));
        if (this._overlay) this._overlay.remove();
        if (this.renderer) this.renderer.dispose();
        super.destroy();
    }
}
