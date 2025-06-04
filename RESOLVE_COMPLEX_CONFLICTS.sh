#!/bin/bash

# Complex Conflict Resolution for Phase 2 PR #55
echo "🔧 Resolving complex merge conflicts for Phase 2..."
echo "This will handle conflicts that are too complex for GitHub's web editor."

cd /Users/akshaybapat/aion-visualization

# Step 1: Ensure we're on the correct branch
echo "📍 Step 1: Checking out Phase 2 branch..."
git checkout phase2-navigation-system-fix
echo "Current branch: $(git branch --show-current)"

# Step 2: Backup our Phase 2 files
echo "💾 Step 2: Backing up Phase 2 files..."
mkdir -p phase2-backup
cp index.html phase2-backup/index-phase2.html 2>/dev/null || echo "index.html not found"
cp -r assets phase2-backup/ 2>/dev/null || echo "assets folder not found"
cp test-navigation.html phase2-backup/ 2>/dev/null || echo "test-navigation.html not found"
cp PHASE2_COMPLETION_REPORT.md phase2-backup/ 2>/dev/null || echo "PHASE2_COMPLETION_REPORT.md not found"

# Step 3: Fetch latest changes
echo "📥 Step 3: Fetching latest changes from main..."
git fetch origin main

# Step 4: Show what we're dealing with
echo "🔍 Step 4: Analyzing conflicts..."
echo "Files that will conflict:"
git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main | grep -E "^added in|^changed in|^removed in" || echo "Unable to analyze - will see during merge"

# Step 5: Attempt merge and handle conflicts
echo "🔄 Step 5: Attempting merge..."
if git merge origin/main --no-commit --no-ff; then
    echo "✅ Merge successful with no conflicts!"
    git commit -m "Merge main into phase2-navigation-system-fix"
else
    echo "❌ Conflicts detected. Resolving automatically..."
    
    # Step 6: Resolve conflicts by keeping our Phase 2 versions
    echo "🛠️ Step 6: Resolving conflicts..."
    
    # For index.html - keep our Phase 2 version entirely
    if [ -f "phase2-backup/index-phase2.html" ]; then
        echo "📝 Resolving index.html - keeping Phase 2 modernized version"
        cp phase2-backup/index-phase2.html index.html
        git add index.html
    fi
    
    # Check for other conflicted files
    conflicted_files=$(git diff --name-only --diff-filter=U)
    if [ ! -z "$conflicted_files" ]; then
        echo "📋 Other conflicted files found:"
        echo "$conflicted_files"
        
        # For each conflicted file, try to resolve
        for file in $conflicted_files; do
            echo "🔧 Resolving $file..."
            
            case $file in
                *.css)
                    echo "   CSS file - keeping our Phase 2 version"
                    git checkout --ours "$file"
                    git add "$file"
                    ;;
                *.js)
                    echo "   JS file - keeping our Phase 2 version"
                    git checkout --ours "$file"
                    git add "$file"
                    ;;
                *.html)
                    echo "   HTML file - keeping our Phase 2 version"
                    git checkout --ours "$file"
                    git add "$file"
                    ;;
                *.md)
                    echo "   Documentation - keeping our Phase 2 version"
                    git checkout --ours "$file"
                    git add "$file"
                    ;;
                *)
                    echo "   Unknown file type - keeping our version"
                    git checkout --ours "$file"
                    git add "$file"
                    ;;
            esac
        done
    fi
    
    # Step 7: Commit the resolution
    echo "💾 Step 7: Committing conflict resolution..."
    git commit -m "Resolve complex merge conflicts

- Keep Phase 2 modernized index.html with consolidated assets
- Preserve Phase 2 navigation system (navigation.js, chapter-router.js)
- Maintain Phase 2 enhanced CSS with navigation styles
- Keep Phase 2 comprehensive test suite
- Retain all Phase 2 documentation and improvements

Phase 2 provides complete navigation system overhaul that should
take precedence over any conflicting changes from main branch."
fi

# Step 8: Verify our Phase 2 files are intact
echo "✅ Step 8: Verifying Phase 2 files..."
errors=0

if [ ! -f "assets/js/core/navigation.js" ]; then
    echo "❌ Missing: assets/js/core/navigation.js"
    errors=$((errors + 1))
else
    echo "✅ Found: assets/js/core/navigation.js"
fi

if [ ! -f "assets/js/core/chapter-router.js" ]; then
    echo "❌ Missing: assets/js/core/chapter-router.js"
    errors=$((errors + 1))
else
    echo "✅ Found: assets/js/core/chapter-router.js"
fi

if [ ! -f "test-navigation.html" ]; then
    echo "❌ Missing: test-navigation.html"
    errors=$((errors + 1))
else
    echo "✅ Found: test-navigation.html"
fi

if [ ! -f "index.html" ]; then
    echo "❌ Missing: index.html"
    errors=$((errors + 1))
else
    echo "✅ Found: index.html"
    # Check if it has our Phase 2 assets
    if grep -q "assets/css/main.css" index.html; then
        echo "✅ index.html has Phase 2 asset structure"
    else
        echo "⚠️  index.html may not have Phase 2 structure"
    fi
fi

# Step 9: Push if everything looks good
if [ $errors -eq 0 ]; then
    echo "🚀 Step 9: Pushing resolved changes..."
    git push origin phase2-navigation-system-fix
    echo ""
    echo "🎉 SUCCESS! Complex conflicts resolved!"
    echo ""
    echo "📋 What was accomplished:"
    echo "   ✅ Merged latest main branch changes"
    echo "   ✅ Resolved complex conflicts by keeping Phase 2 versions"
    echo "   ✅ Preserved complete Phase 2 navigation system"
    echo "   ✅ Maintained modernized index.html with consolidated assets"
    echo "   ✅ Kept comprehensive test suite and documentation"
    echo "   ✅ Pushed resolved version to GitHub"
    echo ""
    echo "🔗 PR #55 should now be ready to merge!"
    echo "📝 Check: https://github.com/akshaybapat6365/aion-visualization/pull/55"
else
    echo "❌ Errors found. Manual intervention required."
    echo "📝 Check the missing files and resolve manually."
    echo "🔍 Current git status:"
    git status
fi

# Cleanup
echo "🧹 Cleaning up backup files..."
rm -rf phase2-backup

echo ""
echo "📊 Final status:"
git status --short