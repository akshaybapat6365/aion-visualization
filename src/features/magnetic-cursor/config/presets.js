/**
 * presets.js
 * Predefined configurations for different magnetic cursor effects
 * Provides easy-to-use presets for common use cases
 */

export const MagneticPresets = {
  // Subtle effect for text and small elements
  subtle: {
    fieldStrength: 60,
    fieldRadius: 50,
    maxDisplacement: 8,
    elasticity: 0.1,
    friction: 0.9,
    smoothingFactor: 0.2
  },

  // Standard effect for buttons and interactive elements
  standard: {
    fieldStrength: 100,
    fieldRadius: 100,
    maxDisplacement: 20,
    elasticity: 0.08,
    friction: 0.92,
    smoothingFactor: 0.15
  },

  // Strong effect for hero elements and CTAs
  strong: {
    fieldStrength: 150,
    fieldRadius: 150,
    maxDisplacement: 35,
    elasticity: 0.06,
    friction: 0.94,
    smoothingFactor: 0.12
  },

  // Elastic effect with bouncy physics
  elastic: {
    fieldStrength: 120,
    fieldRadius: 120,
    maxDisplacement: 30,
    elasticity: 0.15,
    friction: 0.85,
    smoothingFactor: 0.1
  },

  // Smooth effect with slow, graceful movement
  smooth: {
    fieldStrength: 80,
    fieldRadius: 100,
    maxDisplacement: 15,
    elasticity: 0.04,
    friction: 0.96,
    smoothingFactor: 0.25
  },

  // Snappy effect with quick response
  snappy: {
    fieldStrength: 110,
    fieldRadius: 80,
    maxDisplacement: 25,
    elasticity: 0.12,
    friction: 0.88,
    smoothingFactor: 0.08
  }
};

// Trail presets
export const TrailPresets = {
  // Minimal trail with few particles
  minimal: {
    particleCount: 8,
    particleSize: 3,
    trailLength: 0.6,
    attraction: 0.04,
    repulsion: 0.01,
    friction: 0.96,
    color: 'rgba(255, 255, 255, 0.3)',
    glowAmount: 10,
    connectDistance: 30
  },

  // Standard trail
  standard: {
    particleCount: 15,
    particleSize: 4,
    trailLength: 0.8,
    attraction: 0.05,
    repulsion: 0.02,
    friction: 0.95,
    color: 'rgba(255, 255, 255, 0.5)',
    glowAmount: 20,
    connectDistance: 50
  },

  // Dense trail with many particles
  dense: {
    particleCount: 30,
    particleSize: 3,
    trailLength: 1,
    attraction: 0.06,
    repulsion: 0.025,
    friction: 0.94,
    color: 'rgba(255, 255, 255, 0.4)',
    glowAmount: 15,
    connectDistance: 60
  },

  // Comet-like trail
  comet: {
    particleCount: 20,
    particleSize: 5,
    trailLength: 1.2,
    attraction: 0.03,
    repulsion: 0.015,
    friction: 0.97,
    color: 'rgba(255, 255, 255, 0.6)',
    glowAmount: 30,
    connectDistance: 40
  },

  // Galaxy effect with connected particles
  galaxy: {
    particleCount: 25,
    particleSize: 2,
    trailLength: 0.9,
    attraction: 0.045,
    repulsion: 0.02,
    friction: 0.95,
    color: 'rgba(255, 255, 255, 0.5)',
    glowAmount: 25,
    connectDistance: 80
  }
};

// Button-specific presets
export const ButtonPresets = {
  // Minimal button effect
  minimal: {
    ...MagneticPresets.subtle,
    scaleOnHover: 1.02,
    tiltAmount: 5,
    glowIntensity: 0.1
  },

  // Standard button
  standard: {
    ...MagneticPresets.standard,
    scaleOnHover: 1.05,
    tiltAmount: 15,
    glowIntensity: 0.3
  },

  // Premium button with strong effect
  premium: {
    ...MagneticPresets.strong,
    scaleOnHover: 1.08,
    tiltAmount: 20,
    glowIntensity: 0.4
  },

  // Flat button with no tilt
  flat: {
    ...MagneticPresets.standard,
    scaleOnHover: 1.05,
    tiltAmount: 0,
    glowIntensity: 0.2
  },

  // 3D button with strong tilt
  dimensional: {
    ...MagneticPresets.elastic,
    scaleOnHover: 1.1,
    tiltAmount: 25,
    glowIntensity: 0.5
  }
};

// Link-specific presets
export const LinkPresets = {
  // Subtle link effect
  subtle: {
    ...MagneticPresets.subtle,
    underlineEffect: true,
    colorShift: false,
    letterSpacing: 0.3
  },

  // Standard link
  standard: {
    fieldStrength: 80,
    fieldRadius: 60,
    maxDisplacement: 10,
    elasticity: 0.12,
    friction: 0.88,
    underlineEffect: true,
    colorShift: true,
    letterSpacing: 0.5
  },

  // Bold link effect
  bold: {
    fieldStrength: 100,
    fieldRadius: 80,
    maxDisplacement: 15,
    elasticity: 0.1,
    friction: 0.9,
    underlineEffect: true,
    colorShift: true,
    letterSpacing: 1
  },

  // Navigation link
  navigation: {
    fieldStrength: 90,
    fieldRadius: 70,
    maxDisplacement: 12,
    elasticity: 0.08,
    friction: 0.92,
    underlineEffect: false,
    colorShift: true,
    letterSpacing: 0.8
  }
};

// Performance presets based on device capabilities
export const PerformancePresets = {
  // High performance devices
  high: {
    smoothingFactor: 0.1,
    updateRate: 60,
    particleCount: 30,
    enableGlow: true,
    enableConnections: true
  },

  // Medium performance
  medium: {
    smoothingFactor: 0.15,
    updateRate: 30,
    particleCount: 15,
    enableGlow: true,
    enableConnections: false
  },

  // Low performance / battery saving
  low: {
    smoothingFactor: 0.25,
    updateRate: 20,
    particleCount: 8,
    enableGlow: false,
    enableConnections: false
  }
};

// Utility function to merge presets
export function mergePresets(...presets) {
  return presets.reduce((merged, preset) => ({
    ...merged,
    ...preset
  }), {});
}

// Auto-detect performance level
export function getAutoPerformancePreset() {
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return PerformancePresets.low;
  }

  // Check device memory (if available)
  if ('deviceMemory' in navigator) {
    if (navigator.deviceMemory < 4) return PerformancePresets.low;
    if (navigator.deviceMemory < 8) return PerformancePresets.medium;
  }

  // Check hardware concurrency (CPU cores)
  if ('hardwareConcurrency' in navigator) {
    if (navigator.hardwareConcurrency < 4) return PerformancePresets.low;
    if (navigator.hardwareConcurrency < 8) return PerformancePresets.medium;
  }

  // Default to high performance
  return PerformancePresets.high;
}