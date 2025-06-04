#!/bin/bash

# Resolve Phase 2 PR Conflicts Script
echo "🔧 Resolving Phase 2 PR #55 merge conflicts..."

cd /Users/akshaybapat/aion-visualization

# Check current branch
current_branch=$(git branch --show-current)
echo "📍 Current branch: $current_branch"

# Switch to Phase 2 branch if not already there
if [ "$current_branch" != "phase2-navigation-system-fix" ]; then
    echo "🔄 Switching to phase2-navigation-system-fix branch..."
    git checkout phase2-navigation-system-fix
fi

# Fetch latest changes
echo "📥 Fetching latest changes from origin..."
git fetch origin

# Check for conflicts before merging
echo "🔍 Checking for potential conflicts..."
git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main

echo ""
echo "🚨 About to merge origin/main into phase2-navigation-system-fix"
echo "This may create merge conflicts that need manual resolution."
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Attempt merge
    echo "🔄 Merging origin/main..."
    if git merge origin/main; then
        echo "✅ Merge successful! No conflicts."
        git push origin phase2-navigation-system-fix
        echo "🎉 Phase 2 branch updated successfully!"
    else
        echo "❌ Merge conflicts detected. Here's how to resolve:"
        echo ""
        echo "📝 Conflicts found in:"
        git diff --name-only --diff-filter=U
        echo ""
        echo "🛠️  Resolution steps:"
        echo "1. Open the conflicted files in your editor"
        echo "2. Look for conflict markers: <<<<<<< ======= >>>>>>>"
        echo "3. For index.html: Keep the Phase 2 version (it's completely modernized)"
        echo "4. Remove all conflict markers"
        echo "5. Run: git add <resolved-files>"
        echo "6. Run: git commit -m 'Resolve merge conflicts - keep Phase 2 modernized files'"
        echo "7. Run: git push origin phase2-navigation-system-fix"
        echo ""
        echo "💡 Phase 2 index.html should be kept because it has:"
        echo "   - Consolidated asset paths (assets/css/, assets/js/)"
        echo "   - Modern responsive design"
        echo "   - Enhanced navigation integration"
        echo "   - Performance optimizations"
        echo ""
        echo "🔍 To see conflicts: git status"
        echo "📝 To see conflict details: git diff"
    fi
else
    echo "❌ Operation cancelled. Here are your options:"
    echo ""
    echo "Option 1 - Manual resolution:"
    echo "  git merge origin/main"
    echo "  # Resolve conflicts manually"
    echo "  git add <resolved-files>"
    echo "  git commit -m 'Resolve conflicts'"
    echo ""
    echo "Option 2 - Force Phase 2 version:"
    echo "  git merge origin/main -X ours"
    echo "  # This keeps Phase 2 version for conflicts"
    echo ""
    echo "Option 3 - Use GitHub web interface:"
    echo "  Go to PR #55 and click 'Resolve conflicts'"
fi

echo ""
echo "📊 Current status:"
git status --porcelain