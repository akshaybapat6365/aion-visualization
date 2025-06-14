# Shadow Integration Visualization

An interactive particle physics simulation demonstrating Jung's concept of shadow integration - the psychological process of acknowledging and integrating repressed aspects of personality.

## Overview

This visualization uses Matter.js physics engine to create an immersive experience where users can literally drag shadow elements from the unconscious realm into consciousness, integrating them with light particles to achieve psychological wholeness.

## Features

### Core Mechanics
- **Particle Physics**: Shadow (dark) and light particles with realistic physics interactions
- **Drag & Drop**: Interactive dragging to move particles between conscious and unconscious realms
- **Integration System**: Particles transform when successfully integrated
- **Progress Tracking**: Visual feedback on integration progress
- **Difficulty Levels**: Adaptive difficulty that increases as you progress

### Visual Design
- **Monochromatic Aesthetic**: Matching the Aion project's minimalist design
- **Realm Division**: Clear visual separation between conscious (light) and unconscious (dark) realms
- **Particle Effects**: Glowing, shadowing, and integration animations
- **Progress Indicators**: Real-time feedback on integration success

### Achievement System
- **First Integration**: Complete your first shadow integration
- **Rapid Integration**: Achieve multiple integrations in quick succession
- **Perfect Balance**: Maintain equilibrium between integrated light and shadow
- **Master Integrator**: Reach level 5 in shadow work

## Technical Implementation

### Architecture
```
shadow/
├── ShadowIntegration.js    # Main visualization controller
├── ParticleSystem.js       # Particle physics and behavior
├── IntegrationEngine.js    # Integration logic and progression
├── shadow-integration.css  # Styles and animations
├── shadow-demo.html       # Standalone demo page
└── README.md             # Documentation
```

### Key Components

#### ShadowIntegration.js
- Initializes Matter.js physics world
- Manages canvas rendering and custom particle drawing
- Handles user interaction (drag/drop)
- Coordinates between particle system and integration engine

#### ParticleSystem.js
- Creates and manages shadow/light particles
- Implements attraction/repulsion dynamics
- Handles collision detection
- Manages particle transformations

#### IntegrationEngine.js
- Detects successful integrations
- Tracks progress and levels
- Manages achievement system
- Adapts difficulty based on performance

## Usage

### Standalone Demo
Open `shadow-demo.html` in a modern web browser to experience the visualization.

### Integration
```javascript
import ShadowIntegration from './ShadowIntegration.js';

const container = document.getElementById('container');
const visualization = new ShadowIntegration(container);

// Event handlers
visualization.onProgressUpdate = (progress, level) => {
  console.log(`Progress: ${progress * 100}%, Level: ${level}`);
};

visualization.integrationEngine.onAchievementUnlocked = (achievement) => {
  console.log(`Achievement: ${achievement.title}`);
};

// Start visualization
visualization.start();
```

## Interaction Guide

1. **Start**: Click "Begin Integration" to start the experience
2. **Drag Shadow Particles**: Click and drag dark particles from the unconscious (bottom) realm
3. **Move to Consciousness**: Drag them to the conscious (top) realm
4. **Integration**: Bring shadow particles close to light particles to integrate them
5. **Progress**: Watch as integrated particles transform and your progress increases
6. **Level Up**: Complete enough integrations to advance to the next level

## Psychological Concepts

### Shadow Work
In Jungian psychology, the "shadow" represents the parts of our personality that we've repressed or denied. Shadow work involves:
- Acknowledging these hidden aspects
- Bringing them into conscious awareness
- Integrating them into our whole personality

### Visual Metaphors
- **Shadow Particles**: Repressed aspects of self
- **Light Particles**: Conscious, accepted aspects
- **Integration**: The transformation when shadow meets light
- **Realms**: The conscious/unconscious divide
- **Progress**: Journey toward psychological wholeness

## Customization

### Configuration Options
```javascript
config: {
  realmDivision: 0.5,        // Vertical position of realm boundary
  particleCount: {
    shadow: 30,              // Number of shadow particles
    light: 20                // Number of light particles
  },
  physics: {
    gravity: { x: 0, y: 0 }, // Physics world gravity
    friction: 0.05,          // Particle friction
    restitution: 0.8         // Particle bounciness
  }
}
```

### Styling
The visualization uses CSS variables and can be customized through `shadow-integration.css`. Key areas:
- Realm gradient colors
- Particle glow effects
- UI element styling
- Achievement notifications

## Performance Considerations

- Uses Matter.js for optimized physics calculations
- Custom rendering for better performance than default Matter.js renderer
- Particle count limits to maintain 60 FPS
- Efficient collision detection using spatial queries

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Requires support for:
- ES6 modules
- Canvas API
- CSS backdrop-filter
- RequestAnimationFrame

## Future Enhancements

- Sound effects for integration events
- More complex particle behaviors
- Additional achievement types
- Multiplayer integration sessions
- Data visualization of progress over time