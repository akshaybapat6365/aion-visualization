
import * as THREE from 'three';
import BaseViz from '../../../features/viz-platform/BaseViz.js';
import { scrollDirector } from '../../../features/viz-platform/ScrollDirector.js';

export default class SyzygyPolesViz extends BaseViz {
    constructor(container) {
        super(container, { contextType: 'webgl' });
        // Initialize properties to null to avoid BaseViz race conditions
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.objects = {};
        this.params = {
            particleCount: 2000,
            radius: 4,
            separation: 6, // Distance between centers
            speed: 1.0,
            turbulence: 0.0
        };
    }

    async init() {
        console.log('[SyzygyViz] Initializing Anima & Animus...');

        // 1. Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#050508'); // Very dark blue-black
        this.scene.fog = new THREE.FogExp2('#050508', 0.04);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 0, 15);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 2. Create Particle Poles
        this._createParticles();

        // 3. Post-Processing? (Maybe later for bloom)

        // 4. Bind Scroll
        this.onCinematicUpdate = this.onCinematicUpdate.bind(this);
        scrollDirector.addEventListener('scroll-update', (e) => this.onCinematicUpdate(e.detail));

        // 5. Mouse Interaction
        this.mouse = new THREE.Vector2();
        this.targetTurbulence = 0;
        window.addEventListener('mousemove', (e) => {
            // Normalized -1 to 1
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.targetTurbulence = Math.min(Math.abs(this.mouse.x) * 2, 2.0);
        });
    }

    _createParticles() {
        const { particleCount, radius } = this.params;
        const totalParticles = particleCount * 2; // Red set + Blue set

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(totalParticles * 3);
        const colors = new Float32Array(totalParticles * 3);
        const sizes = new Float32Array(totalParticles);
        const phases = new Float32Array(totalParticles); // For animation offset
        const poleIds = new Float32Array(totalParticles); // 0 = Red, 1 = Blue

        const colorRed = new THREE.Color('#ff3366'); // Anima
        const colorBlue = new THREE.Color('#3366ff'); // Animus

        for (let i = 0; i < totalParticles; i++) {
            const isBlue = i >= particleCount;
            poleIds[i] = isBlue ? 1.0 : 0.0;

            // Random point in sphere
            const r = radius * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            let x = r * Math.sin(phi) * Math.cos(theta);
            let y = r * Math.sin(phi) * Math.sin(theta);
            let z = r * Math.cos(phi);

            // Initial separation
            if (isBlue) x += this.params.separation / 2;
            else x -= this.params.separation / 2;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const color = isBlue ? colorBlue : colorRed;
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 2.0;
            phases[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
        geometry.setAttribute('poleId', new THREE.BufferAttribute(poleIds, 1));

        // Use ShaderMaterial for custom movement
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uSeparation: { value: this.params.separation },
                uTurbulence: { value: 0 },
                uPixelRatio: { value: this.renderer.getPixelRatio() }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uSeparation;
                uniform float uTurbulence;
                uniform float uPixelRatio;
                
                attribute float size;
                attribute float phase;
                attribute float poleId;
                
                varying vec3 vColor;

                // Simplex Noise (Vertex)
                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy) );
                    vec2 x0 = v - i + dot(i, C.xx);
                    vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod289(i);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m ;
                    m = m*m ;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }

                void main() {
                    vColor = color;
                    
                    vec3 pos = position;
                    
                    // 1. Orbital Rotation
                    // Rotate around local center (0,0,0) of the cluster AFTER applying separation?
                    // No, 'position' already stores the separate locations.
                    // We need to reconstruct "local" position to rotate.
                    
                    float shift = uSeparation * 0.5;
                    vec3 localPos = pos;
                    if (poleId > 0.5) { // Blue
                        localPos.x -= shift; // Is actually at +shift, so valid local is 0
                        // Wait, 'position' buffer was created WITH the shift.
                        // But uSeparation is dynamic. 
                        // So we should have stored LOCAL positions in buffer.
                        // Let's assume buffer is LOCAL and we apply shift here.
                    } else { // Red
                        // localPos ...
                    }
                    // REFACTOR: Let's assume the buffer position is "Home Base" (separated).
                    // We modulate the separation dynamically.
                   
                    // Dynamic Separation Logic
                    // We pull them towards 0 based on uSeparation (which will shrink).
                    // Original Separation was 6.0.
                    float currentShift = uSeparation * 0.5;
                    
                    // Identify original side based on poleId
                    float direction = (poleId > 0.5) ? 1.0 : -1.0;
                    
                    // Reset to center then apply new shift
                    // We need original local coords. 
                    // Hack: We know they were created at +/- 3.0
                    // Let's just use current pos and modify x?
                    // No, vertex shader is stateless.
                    
                    // BETTER: The buffer should hold LOCAL coordinates centered at 0.
                    // We apply translation in vertex shader.
                    // I will fix this in JS generation below. But assuming I did:
                    
                    // Rotation
                    float speed = 0.5;
                    float angle = uTime * speed + phase;
                    float radius = length(pos.xz); // simple orbit
                    
                    // Swirl effect
                    float c = cos(angle);
                    float s = sin(angle);
                    // Rotate around Y
                    // pos.x = pos.x * c - pos.z * s;
                    // pos.z = pos.x * s + pos.z * c; 
                    // This rotates the WHOLE cloud.
                    
                    // We want them to swirl AT their pole location.
                    vec3 rotatedPos = pos;
                    rotatedPos.x = pos.x * c - pos.z * s;
                    rotatedPos.z = pos.x * s + pos.z * c;

                    // Apply Global Separation
                    rotatedPos.x += direction * currentShift;

                    // Turbulence
                    float noise = snoise(pos.xy * 0.5 + uTime);
                    rotatedPos += normal * noise * uTurbulence;

                    vec4 mvPosition = modelViewMatrix * vec4(rotatedPos, 1.0);
                    gl_PointSize = size * uPixelRatio * (50.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    // Circular soft particle
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    if (dist > 0.5) discard;
                    
                    // Soft edge
                    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.objects.points = new THREE.Points(geometry, material);
        this.scene.add(this.objects.points);

        // Fix buffer generation to be LOCAL relative to pole
        // The loop above added separation. Let's REMOVE it there and let shader handle it.
        const positionAttribute = geometry.getAttribute('position');
        for (let i = 0; i < totalParticles; i++) {
            let x = positionAttribute.getX(i);
            const isBlue = i >= particleCount;
            // Revert the static shift I added in the loop
            if (isBlue) x -= this.params.separation / 2;
            else x += this.params.separation / 2;
            positionAttribute.setX(i, x);
        }
        positionAttribute.needsUpdate = true;
    }

    onCinematicUpdate({ global }) {
        // Scroll 0.0 -> Separation 6.0
        // Scroll 1.0 -> Separation 0.0 (Union)
        this.params.separation = 6.0 * (1.0 - global);

        // Camera moves slightly too
        // this.camera.position.z = 15 - global * 5; 

        if (this.objects.points) {
            this.objects.points.material.uniforms.uSeparation.value = this.params.separation;
        }
    }

    update(dt) {
        // Smooth turbulence toward target
        this.params.turbulence += (this.targetTurbulence - this.params.turbulence) * 0.05;

        if (this.objects.points) {
            this.objects.points.material.uniforms.uTime.value = this.time;
            this.objects.points.material.uniforms.uTurbulence.value = this.params.turbulence;
        }

        // Slight camera drift
        // this.camera.position.y += Math.sin(this.time * 0.5) * 0.01;
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onResize(width, height) {
        if (this.camera) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
        if (this.renderer) {
            this.renderer.setSize(width, height);
            this.objects.points.material.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
        }
    }
}
