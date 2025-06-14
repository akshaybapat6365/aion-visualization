# Anima/Animus Constellation Visualization

A 3D force-directed graph visualization of Jung's archetypal relationships, focusing on the contrasexual archetypes (Anima/Animus) and their connections to other archetypal structures.

## Overview

This visualization presents Jung's concept of the collective unconscious as an interactive 3D constellation, where archetypes are represented as nodes and their psychological relationships as connecting edges.

## Features

### Interactive 3D Navigation
- **Orbit Controls**: Left-click and drag to rotate the view
- **Pan**: Right-click and drag to pan the camera
- **Zoom**: Mouse wheel to zoom in/out
- **Auto-rotation**: Special archetypes (Anima, Animus, Self) rotate continuously

### Archetype Representation
- **12 Core Archetypes**: 
  - Contrasexual: Anima, Animus
  - Core: Self, Shadow
  - Social: Persona
  - Parental: Mother, Father
  - Developmental: Child
  - Wisdom: Wise Old Man, Wise Old Woman
  - Journey: Hero
  - Transformative: Trickster

### Visual Design
- **Monochromatic Theme**: Grayscale palette representing the unconscious realm
- **Node Styling**: Different sizes and glow effects based on archetype importance
- **Edge Strength**: Connection opacity indicates relationship strength
- **Special Indicators**: Rings around primary archetypes (Anima, Animus, Self)

### Interactive Features
- **Click Selection**: Click any node to view detailed information
- **Hover Effects**: Visual feedback on mouse hover
- **Connection Highlighting**: Selected nodes highlight their connections
- **Category Filtering**: Filter nodes by archetype category
- **Smooth Animations**: Physics-based transitions between states

## Technical Implementation

### Architecture
```
AnimaAnimus.js       - Main visualization class, Three.js scene management
ForceGraph3D.js      - 3D force simulation using D3.js physics
ArchetypeNode.js     - Node rendering and interaction handling
constellation.css    - Monochromatic styling and UI elements
```

### Technologies
- **Three.js**: 3D rendering and scene management
- **D3.js**: Force simulation and graph layout
- **ES6 Modules**: Modern JavaScript module system
- **WebGL**: Hardware-accelerated graphics

### Force Simulation
The visualization uses a custom 3D force simulation with:
- **Charge Force**: Nodes repel each other
- **Link Force**: Connected nodes attract based on relationship strength
- **Clustering Force**: Nodes group by archetype category
- **Boundary Force**: Keeps nodes within viewport
- **Z-Axis Force**: Distributes nodes in 3D space

## Usage

### Basic Setup
```html
<div id="visualization" class="constellation-container"></div>

<script type="module">
import AnimaAnimus from './AnimaAnimus.js';

const container = document.getElementById('visualization');
const visualization = new AnimaAnimus(container);
</script>
```

### Customization

#### Adding New Archetypes
```javascript
// In AnimaAnimus.js initializeArchetypes()
{
    id: 'new-archetype',
    name: 'New Archetype',
    category: 'category-name',
    color: 0xAAAAAA,
    description: 'Description of the archetype'
}
```

#### Modifying Relationships
```javascript
// In AnimaAnimus.js initializeRelationships()
{
    source: 'archetype1',
    target: 'archetype2',
    strength: 0.7  // 0.0 to 1.0
}
```

#### Adjusting Forces
```javascript
// In ForceGraph3D.js
this.simulation
    .force('charge', d3.forceManyBody()
        .strength(-300)  // Adjust repulsion strength
        .distanceMax(200))
```

## Performance Optimization

- **Frustum Culling**: Only visible nodes are rendered
- **Level of Detail**: Reduced complexity for distant nodes
- **Efficient Updates**: Only active elements are updated per frame
- **Vertex Recycling**: Reuses geometry for better memory usage

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebGL 2.0 support.

## Development

### File Structure
```
constellation/
├── AnimaAnimus.js          # Main visualization
├── ForceGraph3D.js         # 3D physics engine
├── ArchetypeNode.js        # Node component
├── constellation.css       # Styles
├── anima-animus-demo.html  # Demo page
└── README.md              # Documentation
```

### Running the Demo
1. Serve the files using a local web server
2. Open `anima-animus-demo.html` in a modern browser
3. Add `#debug` to URL for performance stats

### Extending the Visualization
1. **New Visual Effects**: Modify `ArchetypeNode.js`
2. **Different Layouts**: Adjust forces in `ForceGraph3D.js`
3. **Additional UI**: Update `constellation.css` and `AnimaAnimus.js`
4. **Data Integration**: Modify initialization methods in `AnimaAnimus.js`

## Psychological Context

The Anima and Animus represent Jung's concept of the contrasexual aspects of the psyche:

- **Anima**: The feminine psychological qualities in men
- **Animus**: The masculine psychological qualities in women

These archetypes serve as bridges between the conscious ego and the deeper layers of the unconscious, playing crucial roles in psychological development and individuation.

The visualization shows how these contrasexual archetypes relate to:
- The Self (the goal of individuation)
- The Shadow (repressed aspects)
- Parental archetypes (sources of these images)
- Other archetypal figures in the psyche

## License

This visualization is part of the Aion project, exploring Jung's psychological concepts through interactive data visualization.