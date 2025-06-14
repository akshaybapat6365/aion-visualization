#!/bin/bash
# Simple deployment script

echo "Deploying Aion Visualization..."

# Add all changes
git add -A

# Commit with message
git commit -m "fix: Essential path corrections and cleanup

- Fixed keyboard navigation to use correct chapter paths
- Fixed all chapter links in chapters index page  
- Removed non-existent script imports
- Added deployment documentation
- Updated README to reflect current state

Ready for production deployment."

# Push to remote
git push origin launch-preparations

echo "Done! Check PR status on GitHub."