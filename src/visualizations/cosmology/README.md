# Gnostic Cosmology 3D Map

An interactive 3D visualization of Gnostic cosmological concepts based on Jung's Aion. This visualization presents the hierarchical structure of reality from the divine Pleroma down to the material world.

## Overview

The Gnostic Cosmology Map creates a multi-level 3D environment representing the various realms of Gnostic cosmology:

- **Pleroma**: The divine fullness, realm of pure light and unity
- **Ogdoad**: Eight primordial powers, first emanations from the divine
- **Hebdomad**: Seven planetary spheres ruled by archons
- **Kenoma**: The void or deficiency between divine and material
- **Material World**: Physical reality where souls are trapped in matter

## Features

### Interactive Navigation
- **Free Exploration Mode**: Use mouse to rotate view, scroll to zoom
- **Guided Tour Mode**: Automated cinematic journey through all realms
- **Direct Navigation**: Click buttons or use number keys to jump to specific realms
- **Hotspot Information**: Click on glowing spheres to learn about each realm

### Visual Elements
- **Dynamic Particles**: Divine light descending from Pleroma to material world
- **Realm-Specific Geometry**: Each level has unique geometric representations
- **Ambient Effects**: Glow, bloom, and particle effects enhance the mystical atmosphere
- **Smooth Transitions**: Camera animations between realms using bezier curves

### Technical Implementation
- **Three.js**: Core 3D rendering engine
- **Post-Processing**: Bloom effects for divine radiance
- **TWEEN.js**: Smooth animation transitions
- **Responsive Design**: Adapts to different screen sizes

## File Structure

```
cosmology/
├── GnosticMap.js         # Main visualization class
├── RealmBuilder.js       # Constructs geometric representations of realms
├── CameraController.js   # Handles camera movement and animations
├── cosmology.css         # Monochromatic styling
├── gnostic-map-demo.html # Standalone demo page
└── README.md            # This documentation
```

## Usage

### Basic Setup
```javascript
import { GnosticMap } from './GnosticMap.js';

const container = document.getElementById('cosmology-container');
const cosmology = new GnosticMap(container);
```

### Navigation Methods
```javascript
// Navigate to specific realm
cosmology.navigateToRealm('pleroma');

// Start guided tour
cosmology.startGuidedTour();

// Stop guided tour
cosmology.stopGuidedTour();
```

### Keyboard Controls
- `1-5`: Jump to specific realms (Pleroma to Material World)
- `G`: Start guided tour
- `F`: Free exploration mode
- `Space`: Toggle information panel

## Customization

### Modifying Realms
Edit `RealmBuilder.js` to customize realm appearances:

```javascript
createPleroma() {
    // Modify geometry, materials, or effects
    const coreGeometry = new THREE.SphereGeometry(20, 32, 32);
    // ... customize as needed
}
```

### Adjusting Camera Behavior
Edit `CameraController.js` to modify camera movements:

```javascript
moveTo(targetPosition, onComplete, duration = 3000) {
    // Adjust duration or easing functions
}
```

### Styling
Modify `cosmology.css` to change UI appearance while maintaining monochromatic theme.

## Performance Considerations

- **Particle Count**: Reduce particle count in `createParticles()` for better performance
- **Post-Processing**: Disable bloom pass on lower-end devices
- **Geometry Complexity**: Simplify realm geometries if needed

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL 2.0 support.

## Integration with Aion Project

This visualization is designed to complement other Aion visualizations:

- Links conceptually with the Self Constellation Map (psychological aspects)
- Shares visual language with Shadow Work Environment (light/dark dynamics)
- Can be integrated into larger dashboard or navigation system

## Future Enhancements

- **Audio Integration**: Ambient soundscapes for each realm
- **Additional Hotspots**: More detailed information points
- **User Annotations**: Allow users to add personal insights
- **VR Support**: Immersive exploration in virtual reality
- **Narrative Mode**: Guided storytelling through the realms