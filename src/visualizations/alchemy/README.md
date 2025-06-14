# Alchemical Transformation Lab

An interactive visualization exploring Jung's psychological interpretation of alchemical processes, where the transformation of base materials symbolizes individuation and psychological development.

## Overview

The Alchemical Transformation Lab is a drag-and-drop system that allows users to combine alchemical elements and discover transformations through the four classical stages of the Great Work (Magnum Opus). Each combination represents a psychological transformation in the individuation process.

## Features

### Interactive Elements
- **Drag-and-Drop System**: Intuitive interface for combining elements
- **Visual Feedback**: Real-time animations and effects for transformations
- **Discovery Tracking**: Keep track of all discovered compounds
- **Achievement System**: Notifications for milestones and discoveries

### The Four Stages

1. **Nigredo (The Blackening)**
   - Represents dissolution and the encounter with the shadow
   - Color: Black (#000000)
   - Symbol: ☽ (Moon)

2. **Albedo (The Whitening)**
   - Purification and reflection
   - Color: Light Gray (#666666)
   - Symbol: ☉ (Sun)

3. **Citrinitas (The Yellowing)**
   - Solar consciousness and enlightenment
   - Color: Medium Gray (#999999)
   - Symbol: ✦ (Star)

4. **Rubedo (The Reddening)**
   - Integration and wholeness
   - Color: Light (#CCCCCC)
   - Symbol: ✧ (Sparkle)

### Base Elements (Prima Materia)

- **Mercury (☿)**: The volatile spirit, representing consciousness
- **Sulphur (🜍)**: The soul of matter, representing desire and passion
- **Salt (🜔)**: The body, representing form and crystallization
- **Prima Materia (○)**: The first matter, undifferentiated potential

### Discoverable Compounds

Through various combinations, users can discover:
- Philosophical Mercury - Refined consciousness
- White Stone - Albedo achievement
- Red Stone - The Philosopher's Stone
- Aqua Vitae - The water of life
- Sol Niger - The black sun of the shadow
- Rebis - Unity of opposites
- Azoth - Universal medicine
- Quintessence - The fifth element

## Technical Implementation

### Architecture

```
alchemy/
├── AlchemyLab.js         # Main visualization class
├── ElementSystem.js      # Element management and rendering
├── TransformationEngine.js # Combination logic and recipes
├── alchemy.css          # Monochromatic styling
├── alchemy-lab-demo.html # Standalone demo
└── README.md            # Documentation
```

### Key Components

1. **AlchemyLab.js**
   - Main visualization controller
   - Handles UI creation and user interactions
   - Manages game state and progression
   - Implements drag-and-drop functionality

2. **ElementSystem.js**
   - Defines all alchemical elements
   - Generates SVG representations
   - Manages element properties and states

3. **TransformationEngine.js**
   - Contains all transformation recipes
   - Validates combinations
   - Tracks transformation history
   - Manages stage progression

## Usage

### Basic Setup

```html
<div id="visualization-container"></div>

<script type="module">
    import AlchemyLab from './AlchemyLab.js';
    const lab = new AlchemyLab('visualization-container');
</script>
```

### User Instructions

1. **Drag elements** from the Prima Materia palette to the vessel
2. **Combine 2-4 elements** to trigger transformations
3. **Right-click the vessel** to clear it
4. **Progress through stages** by discovering key combinations
5. **Complete the Great Work** by finding all transformations

### Keyboard Shortcuts

- `?` or `h` - Toggle help/instructions
- Right-click on vessel - Clear current elements

## Psychological Symbolism

Each element and transformation carries psychological meaning:

- **Mercury**: Conscious mind, thoughts, communication
- **Sulphur**: Emotions, desires, willpower
- **Salt**: Physical reality, habits, structure
- **Prima Materia**: Unconscious potential, chaos

The combinations represent various psychological processes:
- Mercury + Salt = Integration of mind and body
- Sulphur + Prima Materia = Confronting unconscious desires
- All four elements = Complete individuation (Rebis)

## Customization

### Adding New Elements

```javascript
// In ElementSystem.js
this.addElement({
    id: 'new-element',
    name: 'New Element',
    symbol: '◊',
    type: 'compound',
    color: '#888888',
    description: 'Description of element',
    properties: ['property1', 'property2'],
    hidden: true
});
```

### Adding New Recipes

```javascript
// In TransformationEngine.js
{
    stage: 'nigredo',
    ingredients: ['element1', 'element2'],
    result: 'new-element',
    recipe: 'Element1 + Element2 → New Element',
    description: 'What this transformation represents',
    points: 100,
    hint: 'Clue for discovery'
}
```

## Design Philosophy

The visualization follows Jung's interpretation of alchemy as a projection of psychological processes onto matter. The monochromatic design emphasizes the symbolic rather than literal nature of the transformations, using shades of gray to represent different levels of consciousness and integration.

## Performance Considerations

- Elements are rendered using SVG for crisp visuals
- Animations use CSS transforms for smooth performance
- The animation loop only updates moving elements
- Discovery data is stored efficiently in Sets

## Future Enhancements

- Save/load progress functionality
- Additional transformation paths
- Sound effects for transformations
- Multiplayer collaboration mode
- Integration with other Aion visualizations
- Expanded recipe system with more complex combinations