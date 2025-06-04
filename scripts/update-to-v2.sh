#!/bin/bash

echo "=== Updating Aion Visualization to V2 Design ==="
echo ""
echo "This script will update your GitHub Pages to use the new minimalist design."
echo ""

# Check if we're on the main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "Switching to main branch..."
    git checkout main
fi

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Create a backup of the old index.html
echo "Backing up original files..."
cp index.html index-original.html
cp styles.css styles-original.css

# Copy v2 files to replace the originals
echo "Updating to v2 design..."
cp index-v2.html index.html
cp styles-v2.css styles.css
cp chapters-v2.html chapters.html
cp about-v2.html about.html
cp journey-v2.html journey.html

# Copy all chapter files
for i in {1..14}; do
    cp "chapter${i}-v2.html" "chapter${i}.html"
done

# Update navigation.js to work with new structure
echo "Updating navigation..."
cat > navigation-updated.js << 'EOF'
// Updated navigation for v2 design
document.addEventListener('DOMContentLoaded', () => {
    console.log('Aion Visualization v2 loaded');
});
EOF

# Create a simple redirect for old pages
cat > redirect-notice.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Redirecting...</title>
    <meta http-equiv="refresh" content="0; url=index.html">
</head>
<body>
    <p>Redirecting to the new design...</p>
</body>
</html>
EOF

# Update README to mention the new design
echo "" >> README.md
echo "## 🎨 New Minimalist Design (2024)" >> README.md
echo "" >> README.md
echo "The visualization has been completely redesigned with:" >> README.md
echo "- Consistent dark theme throughout" >> README.md
echo "- WebGL shader visualizations" >> README.md
echo "- All 14 chapters of Aion" >> README.md
echo "- Smooth page transitions" >> README.md
echo "- Mobile-responsive design" >> README.md

echo ""
echo "✅ Update complete!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git status"
echo "2. Commit the updates: git add . && git commit -m 'Update GitHub Pages to v2 design'"
echo "3. Push to GitHub: git push origin main"
echo "4. Your site will update automatically at: https://akshaybapat6365.github.io/aion-visualization/"
echo ""
echo "Note: The old design is backed up as index-original.html and styles-original.css"