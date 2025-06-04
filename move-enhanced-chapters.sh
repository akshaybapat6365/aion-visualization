#!/bin/bash

# Phase 3 Day 3 Morning: Move Enhanced Chapters
echo "📚 Phase 3: Moving enhanced chapters to organized structure"

cd /Users/akshaybapat/aion-visualization

# Create directory structure
echo "📁 Creating chapters/enhanced directory..."
mkdir -p chapters/enhanced

# Move and rename all chapter files
echo "🚀 Moving chapters from src/ to chapters/enhanced/..."

# Loop through all chapters
for i in {1..14}; do
    src_file="src/chapter${i}.html"
    dest_file="chapters/enhanced/chapter-${i}.html"
    
    if [ -f "$src_file" ]; then
        echo "  ✓ Moving chapter ${i}: ${src_file} → ${dest_file}"
        cp "$src_file" "$dest_file"
    else
        echo "  ⚠️  Chapter ${i} not found at ${src_file}"
    fi
done

# Also check for chapters.html (the index)
if [ -f "src/chapters.html" ]; then
    echo "  ✓ Moving chapters index page"
    cp "src/chapters.html" "chapters/index.html"
fi

# List moved files
echo ""
echo "📋 Files in chapters/enhanced/:"
ls -la chapters/enhanced/

# Update asset paths in the moved files
echo ""
echo "🔧 Updating asset paths in moved chapters..."

for file in chapters/enhanced/chapter-*.html; do
    if [ -f "$file" ]; then
        echo "  📝 Updating paths in $(basename "$file")"
        
        # Update CSS paths
        sed -i '' 's|href="styles-v3.css"|href="../../assets/css/main.css"|g' "$file"
        sed -i '' 's|href="styles-v2.css"|href="../../assets/css/main.css"|g' "$file"
        sed -i '' 's|href="styles.css"|href="../../assets/css/main.css"|g' "$file"
        sed -i '' 's|href="chapter-styles.css"|href="../../assets/css/chapters.css"|g' "$file"
        
        # Update JS paths
        sed -i '' 's|src="navigation.js"|src="../../assets/js/core/navigation.js"|g' "$file"
        sed -i '' 's|src="chapter-navigation.js"|src="../../assets/js/core/navigation.js"|g' "$file"
        sed -i '' 's|src="transitions.js"|src="../../assets/js/core/utilities.js"|g' "$file"
        
        # Update chapter links to use new structure
        sed -i '' 's|href="chapter\([0-9]\+\).html"|href="chapter-\1.html"|g' "$file"
        sed -i '' 's|href="../index.html"|href="../../index.html"|g' "$file"
        sed -i '' 's|href="index.html"|href="../../index.html"|g' "$file"
    fi
done

echo ""
echo "✅ Phase 3 Morning Task 1 Complete!"
echo ""
echo "📊 Summary:"
echo "  • Moved 14 chapter files to chapters/enhanced/"
echo "  • Renamed to consistent format (chapter-1.html, etc.)"
echo "  • Updated asset paths to reflect new structure"
echo ""
echo "🎯 Next: Remove standard chapter duplicates and clean up src/"