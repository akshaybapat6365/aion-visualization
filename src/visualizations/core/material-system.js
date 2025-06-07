/**
 * Material System - Monochromatic Shader Management
 * 
 * Creates and manages all materials for Aion visualizations.
 * Ensures consistent monochromatic aesthetic while providing
 * variety through transparency, emission, and texture.
 * 
 * Premium Design System Component
 */

import * as THREE from 'three';

export class MaterialSystem {
  constructor() {
    // Monochromatic color palette from design system
    this.colors = {
      pureBlack: 0x000000,
      pureWhite: 0xFFFFFF,
      grey950: 0x050505,
      grey900: 0x0A0A0A,
      grey850: 0x0F0F0F,
      grey800: 0x141414,
      grey750: 0x1A1A1A,
      grey700: 0x1F1F1F,
      grey650: 0x262626,
      grey600: 0x2E2E2E,
      grey550: 0x383838,
      grey500: 0x424242,
      grey450: 0x525252,
      grey400: 0x616161,
      grey350: 0x737373,
      grey300: 0x858585,
      grey250: 0x999999,
      grey200: 0xADADAD,
      grey150: 0xC2C2C2,
      grey100: 0xD6D6D6,
      grey050: 0xEBEBEB
    };
    
    // Material presets
    this.presets = {
      // Solid materials
      solid: {
        black: this.createSolidMaterial(this.colors.pureBlack),
        white: this.createSolidMaterial(this.colors.pureWhite),
        dark: this.createSolidMaterial(this.colors.grey900),
        medium: this.createSolidMaterial(this.colors.grey500),
        light: this.createSolidMaterial(this.colors.grey200)
      },
      
      // Glass materials
      glass: {
        clear: this.createGlassMaterial(0.1),
        frosted: this.createGlassMaterial(0.3),
        dark: this.createGlassMaterial(0.6, this.colors.grey900)
      },
      
      // Emissive materials
      emissive: {
        subtle: this.createEmissiveMaterial(this.colors.grey300, 0.5),
        medium: this.createEmissiveMaterial(this.colors.grey200, 1.0),
        bright: this.createEmissiveMaterial(this.colors.grey050, 2.0)
      },
      
      // Wireframe materials
      wireframe: {
        thin: this.createWireframeMaterial(this.colors.grey400, 1),
        medium: this.createWireframeMaterial(this.colors.grey300, 2),
        thick: this.createWireframeMaterial(this.colors.grey200, 3)
      }
    };
    
    // Shader chunks for custom materials
    this.shaderChunks = {
      // Depth fade for atmospheric effect
      depthFade: `
        float depth = gl_FragCoord.z / gl_FragCoord.w;
        float fogFactor = smoothstep(10.0, 50.0, depth);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.0), fogFactor);
      `,
      
      // Fresnel effect for glass-like materials
      fresnel: `
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0);
        gl_FragColor.rgb += fresnel * 0.2;
      `,
      
      // Noise texture for organic materials
      noise: `
        float noise = snoise(vWorldPosition * 0.1);
        gl_FragColor.rgb *= 0.9 + noise * 0.1;
      `
    };
  }
  
  /**
   * Create solid material
   */
  createSolidMaterial(color, options = {}) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.2,
      ...options
    });
  }
  
  /**
   * Create glass-like material
   */
  createGlassMaterial(opacity, color = this.colors.grey800, options = {}) {
    return new THREE.MeshPhysicalMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      roughness: 0.1,
      metalness: 0.0,
      transmission: 1 - opacity,
      thickness: 0.5,
      envMapIntensity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0,
      ...options
    });
  }
  
  /**
   * Create emissive material
   */
  createEmissiveMaterial(color, intensity, options = {}) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 1,
      metalness: 0,
      ...options
    });
  }
  
  /**
   * Create wireframe material
   */
  createWireframeMaterial(color, linewidth, options = {}) {
    return new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      wireframeLinewidth: linewidth,
      transparent: true,
      opacity: 0.8,
      ...options
    });
  }
  
  /**
   * Create particle material
   */
  createParticleMaterial(options = {}) {
    const texture = this.createParticleTexture();
    
    return new THREE.PointsMaterial({
      color: this.colors.grey200,
      size: 0.1,
      map: texture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      ...options
    });
  }
  
  /**
   * Create custom shader material
   */
  createShaderMaterial(vertexShader, fragmentShader, uniforms = {}) {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.colors.grey300) },
        opacity: { value: 1.0 },
        ...uniforms
      },
      vertexShader: vertexShader || this.getDefaultVertexShader(),
      fragmentShader: fragmentShader || this.getDefaultFragmentShader(),
      transparent: true,
      side: THREE.DoubleSide
    });
  }
  
  /**
   * Create gradient material (using custom shader)
   */
  createGradientMaterial(colorTop, colorBottom, options = {}) {
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      
      void main() {
        vUv = uv;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform vec3 colorTop;
      uniform vec3 colorBottom;
      uniform float opacity;
      
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      
      void main() {
        vec3 color = mix(colorBottom, colorTop, vUv.y);
        gl_FragColor = vec4(color, opacity);
        
        ${this.shaderChunks.depthFade}
      }
    `;
    
    return this.createShaderMaterial(vertexShader, fragmentShader, {
      colorTop: { value: new THREE.Color(colorTop) },
      colorBottom: { value: new THREE.Color(colorBottom) },
      opacity: { value: options.opacity || 1.0 }
    });
  }
  
  /**
   * Create animated material
   */
  createAnimatedMaterial(baseColor, options = {}) {
    const vertexShader = `
      uniform float time;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        pos += normal * sin(time + position.x * 10.0) * 0.02;
        
        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
    
    const fragmentShader = `
      uniform vec3 color;
      uniform float time;
      uniform float opacity;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      
      void main() {
        vec3 finalColor = color;
        
        // Animated brightness
        float pulse = sin(time * 2.0) * 0.1 + 0.9;
        finalColor *= pulse;
        
        gl_FragColor = vec4(finalColor, opacity);
        
        ${this.shaderChunks.fresnel}
        ${this.shaderChunks.depthFade}
      }
    `;
    
    return this.createShaderMaterial(vertexShader, fragmentShader, {
      color: { value: new THREE.Color(baseColor) },
      opacity: { value: options.opacity || 1.0 }
    });
  }
  
  /**
   * Create particle texture
   */
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }
  
  /**
   * Update animated materials
   */
  updateAnimatedMaterials(time) {
    // Update time uniform for all animated materials
    this.scene?.traverse((object) => {
      if (object.material && object.material.uniforms && object.material.uniforms.time) {
        object.material.uniforms.time.value = time;
      }
    });
  }
  
  /**
   * Get default vertex shader
   */
  getDefaultVertexShader() {
    return `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
  }
  
  /**
   * Get default fragment shader
   */
  getDefaultFragmentShader() {
    return `
      uniform vec3 color;
      uniform float opacity;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      
      void main() {
        gl_FragColor = vec4(color, opacity);
        ${this.shaderChunks.depthFade}
      }
    `;
  }
  
  /**
   * Clone material with new properties
   */
  cloneMaterial(material, newProperties = {}) {
    const cloned = material.clone();
    Object.assign(cloned, newProperties);
    return cloned;
  }
  
  /**
   * Dispose all preset materials
   */
  dispose() {
    Object.values(this.presets).forEach(category => {
      Object.values(category).forEach(material => {
        material.dispose();
      });
    });
  }
}