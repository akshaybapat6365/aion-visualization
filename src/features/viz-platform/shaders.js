/**
 * Aion Shader Library
 * "The Alchemical Kit"
 * 
 * Collection of custom GLSL shaders for the Visual-First engine.
 */

export const SHADERS = {
    // ─── 1. Deep Ocean (The Unconscious) ───
    ocean: {
        vertex: `
            uniform float uTime;
            varying vec2 vUv;
            varying float vElevation;

            // Simplex Noise (minimal implementation)
            vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289_2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289_3(((x*34.0)+1.0)*x); }
            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289_2(i);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ;
                return 105.0 * dot( m*m, vec3( dot(p.x,x0), dot(p.y,x12.xy), dot(p.z,x12.zw) ) );
            }

            void main() {
                vUv = uv;
                
                vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                
                // Elevation based on noise
                float elevation = snoise(modelPosition.xz * 0.15 + uTime * 0.2) * 1.5;
                elevation += snoise(modelPosition.xz * 0.8 + uTime * 0.1) * 0.5;
                
                modelPosition.y += elevation;
                vElevation = elevation;

                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectedPosition = projectionMatrix * viewPosition;
                gl_Position = projectedPosition;
            }
        `,
        fragment: `
            uniform float uTime;
            uniform vec3 uColorDeep;
            uniform vec3 uColorSurface;
            varying float vElevation;

            void main() {
                // Mix colors based on elevation
                float mixStrength = (vElevation + 1.0) * 0.5;
                vec3 color = mix(uColorDeep, uColorSurface, mixStrength);
                
                // Add subtle foam/light
                float light = step(0.9, mixStrength);
                color += vec3(light * 0.1); 

                gl_FragColor = vec4(color, 1.0);
                
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
        `
    },

    // ─── 2. Ethereal Glow (The Archetype) ───
    glow: {
        vertex: `
            varying vec3 vNormal;
            varying vec3 vPositionNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPositionNormal = normalize((modelViewMatrix * position).xyz);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragment: `
            uniform vec3 uColor;
            uniform float uIntensity;
            varying vec3 vNormal;
            varying vec3 vPositionNormal;

            void main() {
                // Fresnel Effect
                float fresnel = pow(1.0 + dot(vPositionNormal, vNormal), 3.0);
                
                // Inner glow
                float intensity = pow(0.6 - dot(vNormal, vPositionNormal), 4.0);
                
                vec3 glow = uColor * fresnel * uIntensity;
                gl_FragColor = vec4(glow, fresnel); // Use additive blending
            }
        `
    },

    // ─── 3. Starfield (The Cosmos) ───
    starfield: {
        vertex: `
            uniform float uTime;
            attribute float aScale;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                
                // Size attenuation
                gl_PointSize = aScale * (300.0 / -mvPosition.z);
            }
        `,
        fragment: `
            void main() {
                // Circular particle
                float strength = distance(gl_PointCoord, vec2(0.5));
                strength = 1.0 - strength;
                strength = pow(strength, 10.0);
                
                gl_FragColor = vec4(vec3(1.0), strength);
            }
        `
    },

    // ─── 4. Liquid Glass (The Lens) ───
    liquidGlass: {
        vertex: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vec4 mvPosition = viewMatrix * worldPosition;
                
                vViewPosition = -mvPosition.xyz;
                vNormal = normalize(normalMatrix * normal);
                
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragment: `
            uniform float uTime;
            uniform vec3 uColor;
            
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                vec3 viewDir = normalize(vViewPosition);
                vec3 normal = normalize(vNormal);
                
                // Fresnel for edge glow
                float fresnel = pow(1.0 - dot(viewDir, normal), 2.5);
                
                // Specular highlights (simulating studio lighting)
                vec3 lightDir1 = normalize(vec3(1.0, 1.0, 1.0));
                vec3 lightDir2 = normalize(vec3(-1.0, 0.5, 0.5));
                
                float spec1 = pow(max(dot(reflect(-lightDir1, normal), viewDir), 0.0), 32.0);
                float spec2 = pow(max(dot(reflect(-lightDir2, normal), viewDir), 0.0), 16.0);
                
                // Chromatic-like tinting on edges
                vec3 edgeColor = mix(uColor, vec3(1.0), fresnel);
                
                vec3 finalColor = uColor * 0.1 + edgeColor * fresnel + vec3(spec1 + spec2) * 0.8;
                
                // Alpha varies with fresnel for "glass" feel
                float alpha = 0.1 + fresnel * 0.6 + (spec1 + spec2);
                
                gl_FragColor = vec4(finalColor, clamp(alpha, 0.0, 1.0));
            }
        `
    }
};
