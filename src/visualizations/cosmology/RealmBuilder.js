import * as THREE from 'three';

export class RealmBuilder {
    constructor(scene) {
        this.scene = scene;
        this.materials = this.createMaterials();
    }
    
    createMaterials() {
        return {
            pleroma: new THREE.MeshPhongMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            }),
            ogdoad: new THREE.MeshPhongMaterial({
                color: 0xe0e0e0,
                emissive: 0xe0e0e0,
                emissiveIntensity: 0.3,
                metalness: 0.8,
                roughness: 0.2
            }),
            hebdomad: new THREE.MeshPhongMaterial({
                color: 0xc0c0c0,
                emissive: 0xc0c0c0,
                emissiveIntensity: 0.2,
                metalness: 0.6,
                roughness: 0.4
            }),
            kenoma: new THREE.MeshPhongMaterial({
                color: 0x404040,
                emissive: 0x202020,
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: 0.8
            }),
            material: new THREE.MeshPhongMaterial({
                color: 0x808080,
                metalness: 0.3,
                roughness: 0.7
            })
        };
    }
    
    createPleroma() {
        const group = new THREE.Group();
        
        // Central divine sphere
        const coreGeometry = new THREE.SphereGeometry(20, 32, 32);
        const core = new THREE.Mesh(coreGeometry, this.materials.pleroma);
        group.add(core);
        
        // Radiating light shells
        for (let i = 1; i <= 3; i++) {
            const shellGeometry = new THREE.SphereGeometry(20 + i * 10, 32, 32);
            const shellMaterial = this.materials.pleroma.clone();
            shellMaterial.opacity = 0.3 / i;
            const shell = new THREE.Mesh(shellGeometry, shellMaterial);
            group.add(shell);
        }
        
        // Divine light
        const light = new THREE.PointLight(0xffffff, 3, 200);
        light.position.set(0, 0, 0);
        group.add(light);
        
        // Ethereal particles around Pleroma
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 500;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = 30 + Math.random() * 20;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        group.add(particles);
        
        return group;
    }
    
    createOgdoad() {
        const group = new THREE.Group();
        
        // Eight primordial powers as geometric forms
        const powers = [
            { geometry: new THREE.TetrahedronGeometry(10), position: new THREE.Vector3(30, 0, 0) },
            { geometry: new THREE.OctahedronGeometry(10), position: new THREE.Vector3(-30, 0, 0) },
            { geometry: new THREE.IcosahedronGeometry(10), position: new THREE.Vector3(0, 0, 30) },
            { geometry: new THREE.DodecahedronGeometry(10), position: new THREE.Vector3(0, 0, -30) },
            { geometry: new THREE.TetrahedronGeometry(10), position: new THREE.Vector3(21, 0, 21) },
            { geometry: new THREE.OctahedronGeometry(10), position: new THREE.Vector3(-21, 0, 21) },
            { geometry: new THREE.IcosahedronGeometry(10), position: new THREE.Vector3(21, 0, -21) },
            { geometry: new THREE.DodecahedronGeometry(10), position: new THREE.Vector3(-21, 0, -21) }
        ];
        
        powers.forEach((power, index) => {
            const mesh = new THREE.Mesh(power.geometry, this.materials.ogdoad);
            mesh.position.copy(power.position);
            mesh.rotation.x = Math.random() * Math.PI;
            mesh.rotation.y = Math.random() * Math.PI;
            mesh.userData.rotationSpeed = {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            };
            group.add(mesh);
            
            // Connecting lines
            if (index < 7) {
                const nextPower = powers[index + 1];
                const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                    power.position,
                    nextPower.position
                ]);
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0xe0e0e0,
                    transparent: true,
                    opacity: 0.3
                });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                group.add(line);
            }
        });
        
        // Central connecting sphere
        const centerGeometry = new THREE.SphereGeometry(5, 16, 16);
        const centerMaterial = this.materials.ogdoad.clone();
        centerMaterial.opacity = 0.5;
        centerMaterial.transparent = true;
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        group.add(center);
        
        return group;
    }
    
    createHebdomad() {
        const group = new THREE.Group();
        
        // Seven planetary spheres
        const planets = [
            { radius: 8, distance: 40, speed: 0.5, name: 'Saturn' },
            { radius: 7, distance: 35, speed: 0.6, name: 'Jupiter' },
            { radius: 6, distance: 30, speed: 0.7, name: 'Mars' },
            { radius: 5, distance: 25, speed: 0.8, name: 'Sun' },
            { radius: 4.5, distance: 20, speed: 0.9, name: 'Venus' },
            { radius: 4, distance: 15, speed: 1.0, name: 'Mercury' },
            { radius: 3.5, distance: 10, speed: 1.1, name: 'Moon' }
        ];
        
        planets.forEach((planet, index) => {
            // Orbital ring
            const ringGeometry = new THREE.TorusGeometry(planet.distance, 0.5, 8, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xa0a0a0,
                transparent: true,
                opacity: 0.3
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
            
            // Planet sphere
            const planetGeometry = new THREE.SphereGeometry(planet.radius, 16, 16);
            const planetMesh = new THREE.Mesh(planetGeometry, this.materials.hebdomad);
            
            // Position on orbit
            const angle = (index / 7) * Math.PI * 2;
            planetMesh.position.x = Math.cos(angle) * planet.distance;
            planetMesh.position.z = Math.sin(angle) * planet.distance;
            
            planetMesh.userData = {
                distance: planet.distance,
                speed: planet.speed,
                name: planet.name
            };
            
            group.add(planetMesh);
            
            // Planet glow
            const glowGeometry = new THREE.SphereGeometry(planet.radius * 1.2, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xc0c0c0,
                transparent: true,
                opacity: 0.2
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.position.copy(planetMesh.position);
            group.add(glow);
        });
        
        // Central archonic eye
        const eyeGeometry = new THREE.SphereGeometry(5, 32, 32);
        const eyeMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080,
            emissive: 0x404040,
            emissiveIntensity: 0.5
        });
        const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        group.add(eye);
        
        return group;
    }
    
    createKenoma() {
        const group = new THREE.Group();
        
        // Void representation - fragmented space
        const voidGeometry = new THREE.IcosahedronGeometry(50, 2);
        const voidMaterial = this.materials.kenoma.clone();
        voidMaterial.wireframe = true;
        const voidMesh = new THREE.Mesh(voidGeometry, voidMaterial);
        group.add(voidMesh);
        
        // Scattered fragments
        const fragmentCount = 50;
        for (let i = 0; i < fragmentCount; i++) {
            const size = Math.random() * 3 + 1;
            const geometry = new THREE.TetrahedronGeometry(size);
            const material = this.materials.kenoma.clone();
            material.opacity = Math.random() * 0.5 + 0.3;
            
            const fragment = new THREE.Mesh(geometry, material);
            fragment.position.set(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 80
            );
            fragment.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            
            fragment.userData.drift = {
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            };
            
            group.add(fragment);
        }
        
        // Dark fog particles
        const fogGeometry = new THREE.BufferGeometry();
        const fogCount = 200;
        const fogPositions = new Float32Array(fogCount * 3);
        
        for (let i = 0; i < fogCount; i++) {
            fogPositions[i * 3] = (Math.random() - 0.5) * 100;
            fogPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            fogPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        
        fogGeometry.setAttribute('position', new THREE.BufferAttribute(fogPositions, 3));
        
        const fogMaterial = new THREE.PointsMaterial({
            color: 0x202020,
            size: 3,
            transparent: true,
            opacity: 0.5,
            blending: THREE.SubtractiveBlending
        });
        
        const fog = new THREE.Points(fogGeometry, fogMaterial);
        group.add(fog);
        
        return group;
    }
    
    createMaterialWorld() {
        const group = new THREE.Group();
        
        // Complex geometric structure representing material reality
        const worldSize = 40;
        
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(worldSize * 2, worldSize * 2, 20, 20);
        const groundMaterial = this.materials.material.clone();
        groundMaterial.side = THREE.DoubleSide;
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -worldSize / 2;
        
        // Add noise to ground vertices
        const groundPositions = ground.geometry.attributes.position.array;
        for (let i = 0; i < groundPositions.length; i += 3) {
            groundPositions[i + 2] = Math.sin(groundPositions[i] * 0.1) * Math.cos(groundPositions[i + 1] * 0.1) * 3;
        }
        ground.geometry.attributes.position.needsUpdate = true;
        ground.geometry.computeVertexNormals();
        
        group.add(ground);
        
        // Material structures - buildings/crystals
        const structureCount = 20;
        for (let i = 0; i < structureCount; i++) {
            const height = Math.random() * 20 + 5;
            const width = Math.random() * 5 + 2;
            const geometry = new THREE.BoxGeometry(width, height, width);
            
            const structure = new THREE.Mesh(geometry, this.materials.material);
            structure.position.set(
                (Math.random() - 0.5) * worldSize * 1.5,
                height / 2 - worldSize / 2,
                (Math.random() - 0.5) * worldSize * 1.5
            );
            
            structure.rotation.y = Math.random() * Math.PI;
            
            // Add some variation with edges
            const edges = new THREE.EdgesGeometry(geometry);
            const edgeMaterial = new THREE.LineBasicMaterial({
                color: 0x606060,
                transparent: true,
                opacity: 0.5
            });
            const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
            structure.add(edgeLines);
            
            group.add(structure);
        }
        
        // Trapped light particles (souls)
        const soulGeometry = new THREE.BufferGeometry();
        const soulCount = 100;
        const soulPositions = new Float32Array(soulCount * 3);
        const soulColors = new Float32Array(soulCount * 3);
        
        for (let i = 0; i < soulCount; i++) {
            soulPositions[i * 3] = (Math.random() - 0.5) * worldSize * 2;
            soulPositions[i * 3 + 1] = Math.random() * 20 - worldSize / 2;
            soulPositions[i * 3 + 2] = (Math.random() - 0.5) * worldSize * 2;
            
            // Dim light color
            soulColors[i * 3] = 0.8;
            soulColors[i * 3 + 1] = 0.8;
            soulColors[i * 3 + 2] = 0.8;
        }
        
        soulGeometry.setAttribute('position', new THREE.BufferAttribute(soulPositions, 3));
        soulGeometry.setAttribute('color', new THREE.BufferAttribute(soulColors, 3));
        
        const soulMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const souls = new THREE.Points(soulGeometry, soulMaterial);
        souls.userData.isSouls = true;
        group.add(souls);
        
        return group;
    }
}