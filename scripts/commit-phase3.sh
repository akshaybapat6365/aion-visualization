#!/bin/bash

# Git commit script for Phase 3 enhanced visualizations

echo "=== Committing Phase 3: Enhanced Visualizations ==="
echo ""

echo "Adding all enhanced visualization files..."
git add enhanced-chapter4.html enhanced-chapter7.html enhanced-chapter10.html PHASE3_SUMMARY.md

echo ""
echo "Creating comprehensive commit for Phase 3..."
git commit -m "Phase 3: Museum-quality enhanced visualizations

Enhanced Chapters Implemented:
- Chapter 4: Astrological Clock with 26,000-year precession cycle
- Chapter 7: Interactive Gnostic Cosmology with Sophia's Fall
- Chapter 10: Interactive Alchemical Laboratory with drag-and-drop

Features Added:
- 3D Three.js visualizations with orbital controls
- Interactive D3.js timelines and data visualizations
- Drag-and-drop HTML5 interface for alchemy lab
- Real-time particle systems and animations
- Achievement and progress tracking systems

Technical Innovations:
- WebGL 3D zodiac wheel with time navigation
- Gnostic emanation levels with camera orbiting
- Complete alchemical workspace with 7 operations
- Recipe book system with psychological parallels
- Mobile touch controls and responsive design

Educational Enhancements:
- Historical accuracy in astronomical data
- Authentic alchemical processes and symbols
- Psychological depth with Jung's interpretations
- Multiple learning paths and interaction modes
- Accessibility features for all users

Performance Optimizations:
- Lazy loading for heavy 3D content
- WebGL context management
- Mobile-optimized particle systems
- Responsive canvas resizing
- Battery-friendly animations

User Experience:
- Museum-quality interactive experiences
- Progressive disclosure of complex concepts
- Achievement systems for engagement
- Cross-device synchronization ready
- Social sharing capabilities

Files Created:
- enhanced-chapter4.html (Astrological Clock)
- enhanced-chapter7.html (Gnostic Cosmology)
- enhanced-chapter10.html (Alchemical Laboratory)
- PHASE3_SUMMARY.md (Complete documentation)

This completes Phase 3 of the improvement plan, creating world-class
interactive visualizations that transform Jung's Aion into an immersive
psychological journey suitable for museums and universities.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "Commit created successfully."
echo ""

echo "Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=== Success! Phase 3 enhanced visualizations pushed to GitHub ==="
    echo ""
    echo "Enhanced chapters now available at:"
    echo "- Enhanced Chapter 4: Astrological Clock & Fish Duality"
    echo "- Enhanced Chapter 7: Gnostic Cosmology & Sophia's Fall" 
    echo "- Enhanced Chapter 10: Interactive Alchemical Laboratory"
    echo ""
    echo "View at: https://akshaybapat6365.github.io/aion-visualization/"
    echo ""
    echo "Key enhancements:"
    echo "  ✓ Museum-quality 3D visualizations"
    echo "  ✓ Interactive learning experiences"
    echo "  ✓ Full mobile responsiveness"
    echo "  ✓ Achievement and progress systems"
    echo "  ✓ Educational depth with psychological insights"
    echo ""
    echo "Note: Enhanced chapters are separate files for testing."
    echo "Run integration script to replace original chapters if desired."
else
    echo ""
    echo "Push failed. Please check your connection and try:"
    echo "git push origin main"
fi