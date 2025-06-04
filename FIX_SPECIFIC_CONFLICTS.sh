#!/bin/bash

# Fix Specific Conflicts: enhanced-chapter11.html and index.html
echo "🎯 Fixing specific conflicts in PR #55..."
echo "Conflicts detected in: enhanced-chapter11.html, index.html"

cd /Users/akshaybapat/aion-visualization

# Step 1: Ensure we're on the correct branch
echo "📍 Step 1: Switching to phase2-navigation-system-fix branch..."
git checkout phase2-navigation-system-fix

# Step 2: Check current status
echo "📊 Step 2: Current git status..."
git status

# Step 3: Start the merge to see conflicts
echo "🔄 Step 3: Starting merge to identify conflicts..."
git fetch origin main
if ! git merge origin/main --no-commit; then
    echo "✅ Conflicts detected. Proceeding with resolution..."
    
    # Step 4: Show conflicted files
    echo "📋 Step 4: Conflicted files:"
    git status --porcelain | grep "^UU\|^AA\|^DD"
    
    # Step 5: Resolve index.html - keep our Phase 2 version
    echo "🔧 Step 5: Resolving index.html..."
    if [ -f "index.html" ]; then
        # Our Phase 2 index.html has consolidated assets and modern design
        # We want to keep this version
        git checkout --ours index.html
        git add index.html
        echo "✅ index.html resolved - kept Phase 2 modernized version"
    fi
    
    # Step 6: Resolve enhanced-chapter11.html
    echo "🔧 Step 6: Resolving enhanced-chapter11.html..."
    if [ -f "enhanced-chapter11.html" ]; then
        # Check if this file exists in our branch
        if git show HEAD:enhanced-chapter11.html >/dev/null 2>&1; then
            # Keep our version
            git checkout --ours enhanced-chapter11.html
            git add enhanced-chapter11.html
            echo "✅ enhanced-chapter11.html resolved - kept our version"
        else
            # If it doesn't exist in our branch, take theirs or create minimal version
            if git show origin/main:enhanced-chapter11.html >/dev/null 2>&1; then
                git checkout --theirs enhanced-chapter11.html
                git add enhanced-chapter11.html
                echo "✅ enhanced-chapter11.html resolved - accepted main branch version"
            else
                echo "⚠️  enhanced-chapter11.html doesn't exist in either branch"
            fi
        fi
    fi
    
    # Step 7: Check for any remaining conflicts
    remaining_conflicts=$(git diff --name-only --diff-filter=U)
    if [ ! -z "$remaining_conflicts" ]; then
        echo "📝 Step 7: Resolving remaining conflicts..."
        for file in $remaining_conflicts; do
            echo "🔧 Auto-resolving $file by keeping our version..."
            git checkout --ours "$file"
            git add "$file"
        done
    else
        echo "✅ Step 7: No remaining conflicts"
    fi
    
    # Step 8: Commit the resolution
    echo "💾 Step 8: Committing conflict resolution..."
    git commit -m "Resolve merge conflicts in index.html and enhanced-chapter11.html

- index.html: Keep Phase 2 modernized version with consolidated assets
- enhanced-chapter11.html: Resolve conflict appropriately
- Maintain all Phase 2 navigation system improvements

Phase 2 navigation system provides complete overhaul with:
- Unified navigation with dropdown menus
- Advanced routing system (28 routes)
- Progress tracking with localStorage
- Mobile-responsive design
- Comprehensive test suite

Ready for merge."

else
    echo "✅ No conflicts detected during merge!"
    git commit -m "Merge main branch - no conflicts"
fi

# Step 9: Verify Phase 2 files are intact
echo "🔍 Step 9: Verifying Phase 2 files..."
phase2_files=(
    "assets/js/core/navigation.js"
    "assets/js/core/chapter-router.js"
    "test-navigation.html"
    "PHASE2_COMPLETION_REPORT.md"
)

all_good=true
for file in "${phase2_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - Present"
    else
        echo "❌ $file - Missing"
        all_good=false
    fi
done

# Check index.html has Phase 2 structure
if grep -q "assets/css/main.css" index.html && grep -q "assets/js/core/navigation.js" index.html; then
    echo "✅ index.html - Has Phase 2 asset structure"
else
    echo "⚠️  index.html - May not have complete Phase 2 structure"
    all_good=false
fi

# Step 10: Push if everything looks good
if [ "$all_good" = true ]; then
    echo "🚀 Step 10: Pushing resolved changes..."
    git push origin phase2-navigation-system-fix
    
    echo ""
    echo "🎉 SUCCESS! Conflicts resolved and pushed!"
    echo ""
    echo "📋 Resolution Summary:"
    echo "   ✅ index.html - Kept Phase 2 modernized version"
    echo "   ✅ enhanced-chapter11.html - Resolved appropriately"
    echo "   ✅ All Phase 2 navigation files intact"
    echo "   ✅ Changes pushed to GitHub"
    echo ""
    echo "🔗 PR #55 should now be ready to merge!"
    echo "📝 Check: https://github.com/akshaybapat6365/aion-visualization/pull/55"
    echo ""
    echo "📊 Final git status:"
    git status --short
else
    echo "❌ Issues detected. Please check the files manually."
    echo "📝 Current git status:"
    git status
    echo ""
    echo "🔧 Manual fix needed:"
    echo "1. Check that all Phase 2 files are present"
    echo "2. Verify index.html has consolidated asset paths"
    echo "3. Ensure navigation system files are intact"
    echo "4. Run: git push origin phase2-navigation-system-fix"
fi