#!/bin/bash

# Git push script for Phase 1 improvements
# Run this script to push all changes to GitHub

echo "=== Pushing Aion Visualization Phase 1 Updates to GitHub ==="
echo ""

# Change to the project directory
cd "$(dirname "$0")"

echo "Current directory: $(pwd)"
echo ""

# Check git status
echo "Checking git status..."
git status --short
echo ""

# Add all files
echo "Adding all files..."
git add -A
echo "Files added."
echo ""

# Create commit
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
- Added PHASE1_SUMMARY.md with complete implementation summary

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

if [ $? -eq 0 ]; then
    echo "Commit created successfully."
else
    echo "Commit may have failed or there may be no changes to commit."
fi
echo ""

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=== Success! Phase 1 updates pushed to GitHub ==="
    echo ""
    echo "Your changes should be live at:"
    echo "https://akshaybapat6365.github.io/aion-visualization/"
    echo ""
    echo "New pages available at:"
    echo "- https://akshaybapat6365.github.io/aion-visualization/timeline-v2.html"
    echo "- https://akshaybapat6365.github.io/aion-visualization/symbols-v2.html"
    echo ""
    echo "Note: GitHub Pages may take a few minutes to update."
else
    echo ""
    echo "Push failed. Please check your GitHub authentication and try again."
    echo "You may need to run: git push origin main"
fi