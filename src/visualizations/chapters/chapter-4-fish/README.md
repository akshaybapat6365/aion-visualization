# Fish Symbol Timeline Visualization

## Overview

The Fish Symbol Timeline is an interactive visualization for Chapter 4 of Jung's Aion, exploring the evolution of the fish symbol across 2000+ years of Western history.

## Files

1. **fish-symbol-timeline.js** - Full-featured ES6 module with 3D Three.js visualization and D3.js timeline
2. **fish-timeline-simple.js** - Simplified version for easy integration into existing chapter pages
3. **fish-timeline-showcase.html** - Standalone demo page showcasing the full visualization
4. **chapter-4-enhanced.html** - Enhanced version of Chapter 4 with integrated Fish Timeline

## Features

### Timeline Visualization
- Interactive timeline from 100 BCE to 2000 CE
- Color-coded periods showing symbolic evolution
- Hover effects revealing detailed information
- Click events for in-depth exploration

### 3D Fish Representation
- Three.js powered 3D fish models
- Different fish styles for each historical period
- Animated transitions between eras
- Vesica Piscis geometry

### Historical Periods Covered

1. **Pre-Christian Era** (-100 BCE)
   - Fish as ancient fertility symbol
   - Connection to water deities

2. **Christ's Ministry** (30 CE)
   - "Fishers of men" metaphor
   - Miraculous catch of fish

3. **Early Christianity** (100 CE)
   - ΙΧΘΥΣ (Ichthys) as secret symbol
   - Acronym for "Jesus Christ, Son of God, Savior"

4. **Constantine's Era** (313 CE)
   - Public adoption of Christian symbols
   - Fish in early Christian art

5. **Medieval Period** (1000 CE)
   - Astrological awareness of Pisces Age
   - Integration with church symbolism

6. **Renaissance Alchemy** (1500 CE)
   - Fish as prima materia
   - Symbol of transformation

7. **Jung's Analysis** (1951 CE)
   - Psychological interpretation
   - Fish as unconscious contents

8. **Aquarian Transition** (2000 CE)
   - Shift from Pisces to Aquarius
   - Evolution of consciousness

## Integration

### Quick Integration

Add to any chapter page:

```html
<div id="fish-timeline-viz"></div>
<script src="path/to/fish-timeline-simple.js"></script>
```

### Full Integration

For complete features:

```javascript
import FishSymbolTimeline from './fish-symbol-timeline.js';

const container = document.getElementById('visualization-container');
const timeline = new FishSymbolTimeline(container);
```

## Dependencies

- D3.js v7.8.5 - For timeline and data visualization
- Three.js r128 - For 3D fish representations
- GSAP 3.12.4 - For smooth animations

## Customization

### Colors

The timeline uses a gradient from ancient brown (#8B7355) through royal purple (#6B46C1) to aquarian cyan (#00CED1), representing the evolution of consciousness.

### Timeline Data

Edit the `timelineData` array to add or modify historical events:

```javascript
{
    year: 313,
    title: "Constantine's Conversion",
    description: "Fish symbol becomes public Christian emblem",
    symbol: "constantine",
    color: "#6B46C1",
    significance: 4,
    details: "Extended description..."
}
```

## Psychological Significance

Jung's interpretation of the fish symbol encompasses:

- **Unconscious Contents**: Fish rising from depths represent emerging psychic material
- **Christ Symbol**: The fish as Christ represents the Self manifesting in time
- **Duality**: Two fish of Pisces show the split between opposites
- **Transformation**: From unconscious (fish) to conscious (water-bearer)

## Usage Examples

### Standalone Demo
Open `fish-timeline-showcase.html` in a browser

### Integrated Version
Open `chapter-4-enhanced.html` to see the timeline integrated with Chapter 4 content

### Simple Integration
Include `fish-timeline-simple.js` in any HTML page with a container element

## Keyboard Controls

- **←/→** - Navigate through timeline events
- **Space** - Play/Pause animation
- **Scroll** - Zoom in/out on 3D view

## Future Enhancements

- Add audio narration for each period
- Include more cultural variations of fish symbolism
- Create connections to other Jungian symbols
- Add VR/AR support for immersive exploration

## Credits

Created for the Aion Visualization project, exploring Carl Jung's masterwork through interactive web experiences.