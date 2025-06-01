#!/bin/bash

# Git commit script for Phase 1 improvements

echo "Adding all new and modified files..."
git add .

echo "Creating commit..."
git commit -m "Phase 1: Foundation improvements and missing pages

Major Updates:
- Created timeline-v2.html with interactive Jung biography timeline using D3.js
- Created symbols-v2.html with comprehensive symbol encyclopedia and 3D previews
- Implemented visualization-loader.js for lazy loading and performance optimization
- Fixed navigation links across all chapter pages to include Timeline and Symbols

Documentation:
- Added IMPROVEMENT_PLAN.md with ambitious 12-week roadmap
- Added DETAILED_BUG_REPORT.md with comprehensive testing results
- Added VISUAL_CONCEPTS.md with detailed visualization designs

Technical Improvements:
- Implemented lazy loading for better performance
- Added loading states with animations
- Created WebGL context management
- Added performance monitoring utilities

Navigation Fixes:
- Updated chapter1-v2.html through chapter4-v2.html with correct nav links
- All pages now have consistent navigation: Home, Chapters, Timeline, Symbols, About

This completes Phase 1 of the improvement plan, establishing a solid foundation
for the enhanced Aion visualization experience.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo "Pushing to GitHub..."
git push origin main

echo "Phase 1 deployment complete!"