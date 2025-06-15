#!/bin/bash

echo "Committing final deployment preparations..."

# Add all changes
git add -A

# Commit with detailed message
git commit -m "fix: Sitemap URLs and final deployment preparations

- Fixed all sitemap URLs to point to actual HTML files
- Enhanced chapters: /chapters/enhanced/chapter-X.html
- Standard chapters: /chapters/standard/chapter-X.html
- Additional pages: timeline.html, symbols.html, about.html
- Created deployment checklist and PR creation scripts
- Ready for production deployment"

# Push to remote
git push origin launch-preparations

echo "Changes pushed to launch-preparations branch!"
echo ""
echo "Next steps:"
echo "1. Run ./create-launch-pr.sh to create the PR"
echo "2. Or visit: https://github.com/akshaybapat6365/aion-visualization/compare/main...launch-preparations"