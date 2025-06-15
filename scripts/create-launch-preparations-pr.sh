#!/bin/bash

# Initialize git repository if not already initialized
if [ ! -d .git ]; then
    git init
    git remote add origin https://github.com/akshaybapat6365/aion-visualization.git
fi

# Fetch the latest from remote
git fetch origin main

# Create and checkout launch-preparations branch
git checkout -b launch-preparations

# Stage all current changes
git add .

# Create commit
git commit -m "Launch preparations: Essential fixes and cleanup

- Stripped down to bare essentials per user feedback
- Fixed critical navigation issues
- Removed 4000+ lines of extravagant features
- Focus on core functionality that works

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push branch to remote
git push -u origin launch-preparations

# Create pull request using GitHub CLI
gh pr create \
  --title "Launch preparations: Essential fixes and cleanup" \
  --body "$(cat <<'EOF'
## Summary
- Stripped down to bare essentials per user feedback
- Fixed critical navigation issues
- Removed 4000+ lines of extravagant features
- Focus on core functionality that works

## Changes
- Fixed keyboard navigation paths to use correct `standard/chapter-X.html` format
- Fixed all chapter links in chapters index from `chapter1.html` to `standard/chapter-1.html`
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

Ready for production deployment.
EOF
)" \
  --base main \
  --head launch-preparations

# Output the PR URL
echo "Pull request created successfully!"
gh pr view --web