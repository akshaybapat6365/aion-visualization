# Aion Visualization

An interactive visualization of Carl Jung's *Aion: Researches into the Phenomenology of the Self*.

**Live**: [akshaybapat6365.github.io/aion-visualization](https://akshaybapat6365.github.io/aion-visualization/)

## Overview

Experience Jung's masterwork through interactive visualizations and a clean, minimalist design. Navigate through 14 chapters exploring the depths of analytical psychology with 6 unique interactive visualizations.

## Features

- **6 Interactive Visualizations** - Bringing Jung's concepts to life
  - 🐟 Fish Symbol Timeline - 2000 years of symbolic evolution
  - 🌑 Shadow Integration - Interactive shadow work simulation
  - ⭐ Anima/Animus Constellation - 3D archetype relationships
  - 🌌 Gnostic Cosmology - Navigate hierarchical realms
  - ⚗️ Alchemical Lab - Transform elements through alchemy
  - 🕐 Aion Clock - Visualize zodiacal ages
- **14 Interactive Chapters** - Complete journey through Jung's work
- **Minimalist Design** - Clean monochromatic aesthetic
- **Fast Performance** - Optimized for quick loading
- **Mobile Responsive** - Works on all devices

## Quick Start

```bash
# Clone the repository
git clone https://github.com/akshaybapat6365/aion-visualization.git
cd aion-visualization

# Serve locally
python3 -m http.server 8000
```

Visit `http://localhost:8000`

## Project Status (June 2025)

✅ **Working Features:**
- Homepage with navigation to all features
- All 6 interactive visualization demos
- Enhanced chapter navigation (Chapters 1-14)
- Clean, organized repository structure

🚀 **Recent Updates:**
- Fixed all navigation issues across chapters
- Cleaned up repository (85% size reduction)
- Updated all CSS/JS references
- Improved GitHub Pages deployment

## Key Visualizations

### Standalone Demos
Access these directly from the [Visualizations page](https://akshaybapat6365.github.io/aion-visualization/visualizations.html):

1. **Fish Symbol Timeline** - WebGL timeline showing evolution from Pisces to Aquarius
2. **Shadow Integration** - Matter.js physics simulation for shadow work
3. **Anima/Animus Constellation** - 3D force-directed archetype relationships
4. **Gnostic Cosmology Map** - Navigate through hierarchical spiritual realms
5. **Alchemical Lab** - Interactive element transformation system
6. **Aion Clock** - Visualize the 2000-year zodiacal cycle

### Chapter Integrations
Several chapters include embedded visualizations:
- Chapter 2: Shadow Integration
- Chapter 4: Fish Symbol Timeline
- More integrations coming soon

## Design Philosophy

Monochromatic minimalism meets depth psychology. Every pixel serves meaning.

## Repository Structure

```
aion-visualization/
├── index.html              # Homepage
├── visualizations.html     # Visualization index
├── assets/                 # CSS & JavaScript bundles
│   ├── css/               # Minified stylesheets
│   └── js/                # Core JavaScript modules
├── chapters/              # Book chapters
│   ├── enhanced/          # Interactive chapters (1-14)
│   └── standard/          # Basic text chapters
├── src/                   # Source code
│   └── visualizations/    # Interactive demos
├── docs/                  # Documentation
└── scripts/               # Build & utility scripts
```

## Development

### Prerequisites
- Modern web browser with ES6+ support
- Python 3.x or any local web server
- Git for version control

### Local Development
```bash
# Clone the repository
git clone https://github.com/akshaybapat6365/aion-visualization.git
cd aion-visualization

# Serve locally (Python)
python3 -m http.server 8000

# Or use Node.js
npx http-server -p 8000
```

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)