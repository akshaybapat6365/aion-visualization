#!/bin/bash

# Complete Phase 2 Merge - Final Steps
echo "🏁 Completing Phase 2 merge process..."

cd /Users/akshaybapat/aion-visualization

echo "📊 Step 1: Current git status"
git status

echo ""
echo "🔍 Step 2: Verifying Phase 2 files are intact..."

# Check core navigation files
if [ -f "assets/js/core/navigation.js" ]; then
    echo "✅ assets/js/core/navigation.js - Present"
else
    echo "❌ assets/js/core/navigation.js - Missing!"
fi

if [ -f "assets/js/core/chapter-router.js" ]; then
    echo "✅ assets/js/core/chapter-router.js - Present"
else
    echo "❌ assets/js/core/chapter-router.js - Missing!"
fi

if [ -f "test-navigation.html" ]; then
    echo "✅ test-navigation.html - Present"
else
    echo "❌ test-navigation.html - Missing!"
fi

# Check index.html structure
echo ""
echo "🔍 Step 3: Checking index.html structure..."
if [ -f "index.html" ]; then
    if grep -q "assets/css/main.css" index.html; then
        echo "✅ index.html has Phase 2 CSS structure (assets/css/main.css)"
    else
        echo "⚠️  index.html may not have Phase 2 CSS structure"
    fi
    
    if grep -q "assets/js/core/navigation.js" index.html; then
        echo "✅ index.html has Phase 2 JS structure (assets/js/core/navigation.js)"
    else
        echo "⚠️  index.html may not have Phase 2 JS structure"
    fi
else
    echo "❌ index.html missing!"
fi

echo ""
echo "📋 Step 4: Adding any remaining Phase 2 files..."
# Add any remaining Phase 2 files that might not be tracked
git add PHASE2_COMPLETION_REPORT.md 2>/dev/null || echo "PHASE2_COMPLETION_REPORT.md already tracked"
git add PHASE2_COMMIT_MESSAGE.txt 2>/dev/null || echo "PHASE2_COMMIT_MESSAGE.txt already tracked"
git add PHASE2_GITHUB_COMMANDS.md 2>/dev/null || echo "PHASE2_GITHUB_COMMANDS.md already tracked"

# Don't add the script files to the main commit
echo "ℹ️  Not adding temporary script files (FIX_SPECIFIC_CONFLICTS.sh, etc.)"

echo ""
echo "🚀 Step 5: Pushing Phase 2 changes..."
git push origin phase2-navigation-system-fix

echo ""
echo "📊 Step 6: Final verification..."
echo "Current branch: $(git branch --show-current)"
echo "Latest commit:"
git log --oneline -1

echo ""
echo "🎉 Phase 2 merge completion attempted!"
echo ""
echo "✅ Next steps:"
echo "1. Go to PR #55: https://github.com/akshaybapat6365/aion-visualization/pull/55"
echo "2. Refresh the page"
echo "3. Check if conflicts are resolved"
echo "4. If resolved, click 'Merge pull request'"
echo "5. If still showing conflicts, the manual fix may be needed"
echo ""
echo "🔍 If conflicts persist, check:"
echo "- That index.html has 'assets/css/main.css' and 'assets/js/core/navigation.js'"
echo "- That enhanced-chapter11.html is resolved"
echo "- That all Phase 2 navigation files are present"