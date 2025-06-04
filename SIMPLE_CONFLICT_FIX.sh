#!/bin/bash

# Simple Command Line Conflict Resolution
echo "🔧 Simple fix for conflicts in index.html and enhanced-chapter11.html"

cd /Users/akshaybapat/aion-visualization

# Make sure we're on the right branch
git checkout phase2-navigation-system-fix

# Fetch latest main
git fetch origin main

# Start merge (this will show conflicts)
git merge origin/main || true

# Resolve conflicts by keeping our Phase 2 versions
echo "📝 Resolving conflicts..."

# For index.html - keep our Phase 2 version (has consolidated assets)
git checkout --ours index.html
echo "✅ Resolved index.html - keeping Phase 2 version"

# For enhanced-chapter11.html - keep our version if it exists, otherwise take theirs
if git show HEAD:enhanced-chapter11.html >/dev/null 2>&1; then
    git checkout --ours enhanced-chapter11.html
    echo "✅ Resolved enhanced-chapter11.html - keeping our version"
else
    git checkout --theirs enhanced-chapter11.html
    echo "✅ Resolved enhanced-chapter11.html - accepting main version"
fi

# Add resolved files
git add index.html enhanced-chapter11.html

# Commit the resolution
git commit -m "Resolve conflicts: Keep Phase 2 index.html, resolve enhanced-chapter11.html"

# Push
git push origin phase2-navigation-system-fix

echo "🎉 Conflicts resolved and pushed!"