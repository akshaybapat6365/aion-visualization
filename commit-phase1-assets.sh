#!/bin/bash

# Phase 1 Commit and Push Script
cd /Users/akshaybapat/aion-visualization

# Initialize git if needed
if [ ! -d ".git" ]; then
    git init
fi

# Create and checkout new branch
git checkout -b phase1-asset-consolidation 2>/dev/null || git checkout phase1-asset-consolidation

# Add all new files
git add assets/
git add chapters/
git add tests/
git add scripts/
git add PHASE1_COMMIT_MESSAGE.txt
git add WEBSITE_FIX_IMPROVEMENT_PLAN_V2.md

# Create commit with detailed message
git commit -m "$(cat PHASE1_COMMIT_MESSAGE.txt)"

# Push to GitHub
git push -u origin phase1-asset-consolidation

echo "Phase 1 changes committed and pushed to GitHub!"
echo "Branch: phase1-asset-consolidation"