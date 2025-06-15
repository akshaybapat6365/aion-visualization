#!/bin/bash

echo "🚀 Starting full deployment process for Aion Visualization"
echo "=================================================="

# Navigate to repository
cd /Users/akshaybapat/aion-visualization

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    git remote add origin https://github.com/akshaybapat6365/aion-visualization.git
fi

# Fetch latest from remote
echo "🔄 Fetching latest from remote..."
git fetch origin main

# Check current branch
current_branch=$(git branch --show-current)
echo "📍 Current branch: $current_branch"

# Create launch-preparations branch if not exists
if [ "$current_branch" != "launch-preparations" ]; then
    echo "🌿 Creating launch-preparations branch..."
    git checkout -b launch-preparations
fi

# Stage all changes
echo "📝 Staging all changes..."
git add -A

# Show what will be committed
echo "📋 Files to be committed:"
git status --short

# Create commit
echo "💾 Creating commit..."
git commit -m "Launch preparations: Essential fixes and cleanup

- Stripped down to bare essentials per user feedback
- Fixed critical navigation issues  
- Removed 4000+ lines of extravagant features
- Focus on core functionality that works

Key fixes:
- Fixed keyboard navigation paths to use correct standard/chapter-X.html format
- Fixed all chapter links in chapters index
- Fixed sitemap.xml URLs to point to actual HTML files
- Removed non-existent script imports
- Added deployment documentation and test page

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push branch
echo "⬆️  Pushing to remote..."
git push -u origin launch-preparations

# Create PR
echo "🔀 Creating Pull Request..."
gh pr create \
  --title "Launch preparations: Essential fixes and cleanup" \
  --body "## Summary
- Stripped down to bare essentials per user feedback
- Fixed critical navigation issues
- Removed 4000+ lines of extravagant features  
- Focus on core functionality that works

## Changes
- Fixed keyboard navigation paths to use correct \`standard/chapter-X.html\` format
- Fixed all chapter links in chapters index from \`chapter1.html\` to \`standard/chapter-1.html\`
- Fixed sitemap.xml URLs to point to actual HTML files
- Removed non-existent script imports
- Removed complex features (analytics, A11y enhancements, PWA prompts)
- Added simple deployment documentation
- Created test page for core functionality

## Testing
- All chapter navigation works
- Keyboard shortcuts functional (1-9 for chapters, Esc for home)
- Service worker and offline mode operational
- Clean, minimalist design with fast load times

## Files Changed
- \`/src/core/keyboard-nav.js\` - Fixed navigation paths
- \`/chapters/index.html\` - Fixed all chapter links
- \`/sitemap.xml\` - Fixed URLs to actual HTML files
- Various cleanup and documentation files

Ready for production deployment.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" \
  --base main \
  --head launch-preparations

echo ""
echo "✅ Deployment process complete!"
echo "=================================================="
echo "Next steps:"
echo "1. Review the PR on GitHub"
echo "2. Merge to main branch"
echo "3. Wait for GitHub Actions to deploy"
echo "4. Verify at: https://akshaybapat6365.github.io/aion-visualization/"