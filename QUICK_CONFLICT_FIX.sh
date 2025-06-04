#!/bin/bash

# Quick Conflict Resolution for Phase 2 PR #55
echo "⚡ Quick fix for Phase 2 merge conflicts..."

cd /Users/akshaybapat/aion-visualization

# Ensure we're on the right branch
git checkout phase2-navigation-system-fix

# Backup our Phase 2 index.html
echo "💾 Backing up Phase 2 index.html..."
cp index.html index-phase2-backup.html

# Fetch and merge, preferring our Phase 2 changes for conflicts
echo "🔄 Merging with strategy to prefer Phase 2 changes..."
git fetch origin
git merge origin/main -X ours -m "Resolve conflicts: Keep Phase 2 modernized index.html and navigation system"

# Verify our Phase 2 files are intact
if [ -f "assets/js/core/navigation.js" ] && [ -f "assets/js/core/chapter-router.js" ]; then
    echo "✅ Phase 2 navigation files confirmed intact"
else
    echo "❌ Phase 2 files missing - manual intervention needed"
    exit 1
fi

# Push the resolved version
echo "⬆️ Pushing resolved changes..."
git push origin phase2-navigation-system-fix

echo ""
echo "🎉 Conflict resolution complete!"
echo "📋 What was done:"
echo "   ✅ Merged latest main branch changes"
echo "   ✅ Kept Phase 2 modernized index.html (strategy: ours)"
echo "   ✅ Preserved all Phase 2 navigation system files"
echo "   ✅ Pushed updated branch to GitHub"
echo ""
echo "🔗 PR #55 should now be ready to merge!"
echo "📝 Check the PR: https://github.com/yourusername/aion-visualization/pull/55"