#!/bin/bash

# Phase 2 Commit and Push Script
cd /Users/akshaybapat/aion-visualization

# Create and checkout new branch for Phase 2
git checkout -b phase2-navigation-system-fix 2>/dev/null || git checkout phase2-navigation-system-fix

# Add all Phase 2 changes
echo "Adding Phase 2 navigation system changes..."

# Core navigation files
git add assets/js/core/navigation.js
git add assets/js/core/chapter-router.js

# Updated CSS with navigation styles
git add assets/css/chapters.css

# Rebuilt entry point
git add index.html
git add index-new.html

# Testing and documentation
git add test-navigation.html
git add PHASE2_COMPLETION_REPORT.md
git add PHASE2_COMMIT_MESSAGE.txt
git add GITHUB_COMMIT_COMMANDS.md

# Create commit with detailed message
echo "Creating Phase 2 commit..."
git commit -m "$(cat PHASE2_COMMIT_MESSAGE.txt)"

# Push to GitHub
echo "Pushing Phase 2 branch to GitHub..."
git push -u origin phase2-navigation-system-fix

echo ""
echo "✅ Phase 2 changes committed and pushed to GitHub!"
echo "📝 Branch: phase2-navigation-system-fix"
echo "🔗 Ready to create pull request"