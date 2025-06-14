# Aion Clock Visualization

A circular clock visualization representing the Great Year (approximately 25,920 years) divided into 12 zodiacal ages, as discussed in C.G. Jung's "Aion: Researches into the Phenomenology of the Self."

## Overview

The Aion Clock visualizes the precession of the equinoxes through the zodiac, marking significant historical events and their astrological significance. Each zodiacal age lasts approximately 2,160 years, and the visualization focuses on the transition from the Age of Pisces to the Age of Aquarius.

## Features

### Core Visualization
- **Circular Clock Interface**: 12 zodiac signs arranged in a circle
- **Current Position Indicator**: Shows the present moment in the great cycle
- **Historical Event Markers**: Significant events plotted on the timeline
- **Smooth Animations**: Fluid transitions between different time periods
- **Interactive Elements**: Hover tooltips, drag to rotate, zoom capabilities

### Time Control System
- **Play/Pause**: Animate through time automatically
- **Speed Controls**: 1x, 10x, 100x, 1000x time acceleration
- **Jump to Date**: Navigate to specific years
- **Event Navigation**: Quick access to historical events
- **Projection Mode**: View future ages and transitions

### Visual Elements
- **Zodiac Symbols**: Traditional astrological symbols for each sign
- **Age Boundaries**: Clear demarcation between zodiacal ages
- **Element Indicators**: Fire, Earth, Air, Water groupings
- **Progress Indicator**: Shows position within the Great Year

## Technical Implementation

### Files

1. **AionClock.js**
   - Main visualization class
   - Handles SVG rendering with D3.js
   - Manages interactions and animations
   - Calculates astronomical positions

2. **ZodiacRenderer.js**
   - Renders zodiac symbols and segments
   - Handles age boundaries and transitions
   - Manages visual highlighting and tooltips
   - Implements precession visualization

3. **TimeController.js**
   - Time control interface
   - Play/pause functionality
   - Speed controls and navigation
   - Keyboard shortcuts
   - Event management

4. **clock.css**
   - Monochromatic styling
   - Responsive design
   - Tooltip and modal styles
   - Control panel layout

5. **aion-clock-demo.html**
   - Standalone demonstration page
   - Usage instructions
   - Jung quote integration
   - Keyboard shortcuts reference

## Usage

### Basic Initialization

```javascript
const clock = new AionClock('container-id', {
    width: 800,
    height: 800,
    innerRadius: 150,
    outerRadius: 350,
    currentYear: new Date().getFullYear()
});
```

### Configuration Options

```javascript
{
    width: 800,              // SVG width
    height: 800,             // SVG height
    innerRadius: 150,        // Inner circle radius
    outerRadius: 350,        // Outer circle radius
    currentYear: 2024,       // Starting year
    animationDuration: 1000  // Transition duration in ms
}
```

### Methods

```javascript
// Navigate to specific year
clock.animateToYear(0);  // Birth of Christ

// Control playback
clock.play();
clock.pause();
clock.setSpeed(100);  // 100x speed

// Get current age information
const age = clock.getCurrentAge();
// Returns: { name: 'Pisces', yearInAge: 2024, yearsRemaining: 126 }
```

## Historical Events

The visualization includes major historical events with their astrological significance:

- **2150 BCE**: Beginning of Age of Aries (Ram symbolism)
- **0 CE**: Birth of Christ (Fish symbolism, Age of Pisces)
- **1950 CE**: Jung writes Aion
- **2150 CE**: Projected beginning of Age of Aquarius

## Keyboard Shortcuts

- **Space**: Play/Pause animation
- **Arrow Left/Right**: Step backward/forward 10 years
- **Arrow Up/Down**: Increase/decrease speed
- **R**: Reset view to current date

## Astronomical Basis

The visualization is based on the astronomical phenomenon of axial precession, where Earth's rotational axis slowly traces a circle over approximately 26,000 years. This causes the vernal equinox point to move backwards through the zodiac constellations.

### Key Concepts

1. **Great Year**: Full precessional cycle (~25,920 years)
2. **Zodiacal Age**: 1/12 of the Great Year (~2,160 years)
3. **Precession Direction**: Retrograde through zodiac signs
4. **Current Transition**: From Pisces to Aquarius

## Jungian Interpretation

Jung viewed the precession of the equinoxes as a cosmic clock that correlates with the development of human consciousness and religious symbolism. The transition between ages marks significant shifts in collective psychology and cultural paradigms.

### Age Characteristics

- **Age of Taurus** (4300-2150 BCE): Bull worship, agricultural societies
- **Age of Aries** (2150 BCE-0 CE): Ram symbolism, warrior cultures
- **Age of Pisces** (0-2150 CE): Fish symbolism, Christianity
- **Age of Aquarius** (2150-4300 CE): Water bearer, collective consciousness

## Dependencies

- D3.js v5+ for SVG manipulation and animations
- Modern browser with ES6 support
- No other external dependencies

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Future Enhancements

- Add constellation backgrounds
- Include more detailed astronomical calculations
- Add audio/sound effects for time progression
- Implement data export functionality
- Create mobile-optimized version
- Add language localization