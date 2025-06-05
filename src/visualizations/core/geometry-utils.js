/**
 * Geometry Utilities - Sacred and Organic Forms
 * 
 * Creates reusable geometries for Jungian visualizations.
 * Includes sacred geometry (Platonic solids, mandalas),
 * organic forms, and psychological symbols.
 * 
 * Premium Design System Component
 */

import * as THREE from 'three';

export class GeometryUtils {
  constructor() {
    // Geometry cache to avoid recreating
    this.cache = new Map();
  }
  
  /**
   * Get or create cached geometry
   */
  getCached(key, createFn) {
    if (!this.cache.has(key)) {
      this.cache.set(key, createFn());
    }
    return this.cache.get(key);
  }
  
  /**
   * Create sphere with internal structure (Ego)
   */
  createEgoSphere(radius = 2, detail = 32) {
    return this.getCached('ego-sphere', () => {
      const group = new THREE.Group();
      
      // Outer sphere (transparent)
      const outerGeometry = new THREE.SphereGeometry(radius, detail, detail);
      
      // Inner core
      const coreGeometry = new THREE.SphereGeometry(radius * 0.3, detail, detail);
      
      // Connection lines
      const linesGeometry = new THREE.BufferGeometry();
      const linePositions = [];
      
      // Create radial lines from core to surface
      const lineCount = 24;
      for (let i = 0; i < lineCount; i++) {
        const theta = (i / lineCount) * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.sin(phi) * Math.sin(theta);
        const z = Math.cos(phi);
        
        // From core
        linePositions.push(x * radius * 0.3, y * radius * 0.3, z * radius * 0.3);
        // To surface
        linePositions.push(x * radius * 0.9, y * radius * 0.9, z * radius * 0.9);
      }
      
      linesGeometry.setAttribute('position', 
        new THREE.Float32BufferAttribute(linePositions, 3)
      );
      
      return {
        outer: outerGeometry,
        core: coreGeometry,
        lines: linesGeometry
      };
    });
  }
  
  /**
   * Create shadow forms (distorted humanoid shapes)
   */
  createShadowForm(height = 3, complexity = 1) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];
    
    // Create distorted humanoid shape
    const segments = 16;
    const rings = 32;
    
    for (let i = 0; i <= rings; i++) {
      const v = i / rings;
      const y = (v - 0.5) * height;
      
      // Body width varies with height (humanoid proportion)
      let radius = 0.3;
      if (v < 0.2) radius = 0.15; // Head
      else if (v < 0.4) radius = 0.08; // Neck
      else if (v < 0.7) radius = 0.25; // Torso
      else radius = 0.1; // Legs
      
      // Add distortion
      radius *= (1 + Math.sin(v * Math.PI * 3) * 0.2 * complexity);
      
      for (let j = 0; j <= segments; j++) {
        const u = j / segments;
        const theta = u * Math.PI * 2;
        
        // Add noise to create organic distortion
        const noise = (Math.random() - 0.5) * 0.1 * complexity;
        const r = radius * (1 + noise);
        
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        
        positions.push(x, y, z);
        
        // Calculate normals
        const normal = new THREE.Vector3(x, 0, z).normalize();
        normals.push(normal.x, normal.y, normal.z);
      }
    }
    
    // Create faces
    const indices = [];
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = a + segments + 1;
        const c = a + 1;
        const d = b + 1;
        
        indices.push(a, b, c);
        indices.push(c, b, d);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);
    
    return geometry;
  }
  
  /**
   * Create flowing organic shapes (Anima)
   */
  createAnimaFlow(length = 10, curves = 3) {
    const curve = new THREE.CurvePath();
    
    // Create flowing S-curves
    for (let i = 0; i < curves; i++) {
      const startX = (i / curves) * length - length / 2;
      const endX = ((i + 1) / curves) * length - length / 2;
      
      const controlOffset = 2;
      const yOffset = Math.sin(i * Math.PI / curves) * 2;
      
      const bezier = new THREE.CubicBezierCurve3(
        new THREE.Vector3(startX, yOffset, 0),
        new THREE.Vector3(startX + controlOffset, yOffset + controlOffset, controlOffset),
        new THREE.Vector3(endX - controlOffset, yOffset - controlOffset, -controlOffset),
        new THREE.Vector3(endX, yOffset, 0)
      );
      
      curve.add(bezier);
    }
    
    // Create tube geometry from curve
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.3, 16, false);
    
    // Create ribbon geometry
    const ribbonGeometry = this.createRibbonFromCurve(curve, 1, 0.1);
    
    return {
      tube: tubeGeometry,
      ribbon: ribbonGeometry,
      curve: curve
    };
  }
  
  /**
   * Create crystalline structures (Animus)
   */
  createAnimusStructure(size = 2, complexity = 3) {
    const group = new THREE.Group();
    
    // Create interconnected octahedrons
    const positions = [];
    const scales = [];
    
    // Generate structure points
    for (let i = 0; i < complexity; i++) {
      const angle = (i / complexity) * Math.PI * 2;
      const radius = size * (0.5 + Math.random() * 0.5);
      
      positions.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * size,
        Math.sin(angle) * radius
      ));
      
      scales.push(0.5 + Math.random() * 0.5);
    }
    
    // Create octahedrons at each position
    const octahedronGeometry = new THREE.OctahedronGeometry(1, 0);
    
    // Create connections between structures
    const connectionGeometry = new THREE.BufferGeometry();
    const connectionPositions = [];
    
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i].distanceTo(positions[j]) < size * 1.5) {
          connectionPositions.push(
            positions[i].x, positions[i].y, positions[i].z,
            positions[j].x, positions[j].y, positions[j].z
          );
        }
      }
    }
    
    connectionGeometry.setAttribute('position',
      new THREE.Float32BufferAttribute(connectionPositions, 3)
    );
    
    return {
      crystal: octahedronGeometry,
      positions: positions,
      scales: scales,
      connections: connectionGeometry
    };
  }
  
  /**
   * Create mandala geometry (Self)
   */
  createMandala(radius = 3, rings = 8, segments = 12) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];
    
    // Center point
    positions.push(0, 0, 0);
    uvs.push(0.5, 0.5);
    
    // Create concentric rings
    for (let ring = 1; ring <= rings; ring++) {
      const r = (ring / rings) * radius;
      const segmentCount = segments * ring; // More segments in outer rings
      
      for (let segment = 0; segment < segmentCount; segment++) {
        const theta = (segment / segmentCount) * Math.PI * 2;
        
        // Add variation to create organic mandala
        const variation = Math.sin(theta * 4) * 0.1 * (ring / rings);
        const adjustedR = r * (1 + variation);
        
        const x = Math.cos(theta) * adjustedR;
        const z = Math.sin(theta) * adjustedR;
        const y = Math.sin(ring * 0.5) * 0.1; // Slight vertical variation
        
        positions.push(x, y, z);
        
        // UV coordinates
        const u = (x / radius + 1) * 0.5;
        const v = (z / radius + 1) * 0.5;
        uvs.push(u, v);
      }
    }
    
    // Create faces
    // Connect center to first ring
    const firstRingSegments = segments;
    for (let i = 0; i < firstRingSegments; i++) {
      const next = (i + 1) % firstRingSegments;
      indices.push(0, i + 1, next + 1);
    }
    
    // Connect rings
    let currentIndex = 1;
    for (let ring = 1; ring < rings; ring++) {
      const currentSegments = segments * ring;
      const nextSegments = segments * (ring + 1);
      const nextIndex = currentIndex + currentSegments;
      
      for (let i = 0; i < currentSegments; i++) {
        const currentVertex = currentIndex + i;
        const nextVertex = currentIndex + (i + 1) % currentSegments;
        
        // Find corresponding vertices in next ring
        const ratio = i / currentSegments;
        const nextRingIndex = Math.floor(ratio * nextSegments);
        const nextRingVertex = nextIndex + nextRingIndex;
        const nextRingVertexNext = nextIndex + (nextRingIndex + 1) % nextSegments;
        
        // Create quad (as two triangles)
        indices.push(currentVertex, nextRingVertex, nextVertex);
        indices.push(nextVertex, nextRingVertex, nextRingVertexNext);
      }
      
      currentIndex = nextIndex;
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  /**
   * Create spiral geometry
   */
  createSpiral(radius = 2, height = 5, turns = 3, segments = 100) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2 * turns;
      
      // Logarithmic spiral
      const r = radius * Math.exp(t * 0.3);
      
      const x = Math.cos(angle) * r;
      const y = t * height - height / 2;
      const z = Math.sin(angle) * r;
      
      positions.push(x, y, z);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    return geometry;
  }
  
  /**
   * Create particle field
   */
  createParticleField(count = 1000, bounds = 10, distribution = 'uniform') {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const scales = [];
    const alphas = [];
    
    for (let i = 0; i < count; i++) {
      let x, y, z;
      
      switch(distribution) {
        case 'sphere':
          // Spherical distribution
          const phi = Math.acos(2 * Math.random() - 1);
          const theta = Math.random() * Math.PI * 2;
          const r = Math.random() * bounds;
          
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
          break;
          
        case 'gaussian':
          // Gaussian distribution
          x = this.gaussianRandom() * bounds;
          y = this.gaussianRandom() * bounds;
          z = this.gaussianRandom() * bounds;
          break;
          
        default:
          // Uniform distribution
          x = (Math.random() - 0.5) * bounds * 2;
          y = (Math.random() - 0.5) * bounds * 2;
          z = (Math.random() - 0.5) * bounds * 2;
      }
      
      positions.push(x, y, z);
      scales.push(Math.random() * 0.5 + 0.5);
      alphas.push(Math.random() * 0.5 + 0.5);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.Float32BufferAttribute(scales, 1));
    geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));
    
    return geometry;
  }
  
  /**
   * Create ribbon from curve
   */
  createRibbonFromCurve(curve, width = 1, thickness = 0.1) {
    const points = curve.getPoints(100);
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    
    // Create ribbon vertices
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const t = i / (points.length - 1);
      
      // Calculate tangent
      const tangent = (i < points.length - 1) 
        ? new THREE.Vector3().subVectors(points[i + 1], point).normalize()
        : new THREE.Vector3().subVectors(point, points[i - 1]).normalize();
      
      // Calculate normal (perpendicular to tangent)
      const normal = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
      normal.crossVectors(binormal, tangent);
      
      // Create ribbon vertices
      for (let j = 0; j < 2; j++) {
        const offset = (j - 0.5) * width;
        const vertex = new THREE.Vector3()
          .copy(point)
          .add(binormal.clone().multiplyScalar(offset));
        
        positions.push(vertex.x, vertex.y, vertex.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(j, t);
      }
    }
    
    // Create faces
    for (let i = 0; i < points.length - 1; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = c + 1;
      
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    
    return geometry;
  }
  
  /**
   * Gaussian random number generator
   */
  gaussianRandom() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
  
  /**
   * Dispose all cached geometries
   */
  dispose() {
    this.cache.forEach(geometry => {
      if (geometry.dispose) {
        geometry.dispose();
      } else if (geometry.outer) {
        // Handle compound geometries
        Object.values(geometry).forEach(g => {
          if (g && g.dispose) g.dispose();
        });
      }
    });
    this.cache.clear();
  }
}