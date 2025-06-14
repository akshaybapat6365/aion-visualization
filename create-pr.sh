#!/bin/bash

# Navigate to the repository
cd /Users/akshaybapat/aion-visualization

# Create the PR
gh pr create \
  --repo akshaybapat6365/aion-visualization \
  --base main \
  --head launch-preparations \
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
)"