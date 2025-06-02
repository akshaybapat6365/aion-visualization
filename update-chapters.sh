#!/bin/bash

# Script to update all chapter files with bug fixes

echo "Updating all chapter files with bug fixes..."

# List of scripts to add to each chapter
SCRIPTS='    <script src="webgl-utils.js"></script>
    <script src="accessibility-utils.js"></script>
    <script src="progress-tracker.js"></script>
    <script src="visualization-loader.js"></script>
    <script src="apply-fixes.js" defer></script>'

# List of chapter files to update
for i in {1..14}; do
    FILE="chapter${i}-v2.html"
    
    if [ -f "$FILE" ]; then
        echo "Updating $FILE..."
        
        # Check if responsive-utils.css is already included
        if ! grep -q "responsive-utils.css" "$FILE"; then
            # Add responsive CSS after styles-v2.css
            sed -i '' '/<link rel="stylesheet" href="styles-v2.css">/a\
    <link rel="stylesheet" href="responsive-utils.css">
' "$FILE"
        fi
        
        # Check if bug fix scripts are already included
        if ! grep -q "webgl-utils.js" "$FILE"; then
            # Add scripts before </head>
            sed -i '' '/<\/head>/i\
    <script src="webgl-utils.js"></script>\
    <script src="accessibility-utils.js"></script>\
    <script src="progress-tracker.js"></script>\
    <script src="visualization-loader.js"></script>\
    <script src="apply-fixes.js" defer></script>
' "$FILE"
        fi
        
        echo "  ✓ Updated $FILE"
    else
        echo "  ⚠ $FILE not found"
    fi
done

echo ""
echo "Updating other key files..."

# Update index-v2.html
if [ -f "index-v2.html" ]; then
    echo "Updating index-v2.html..."
    if ! grep -q "responsive-utils.css" "index-v2.html"; then
        sed -i '' '/<link rel="stylesheet" href="styles-v2.css">/a\
    <link rel="stylesheet" href="responsive-utils.css">
' "index-v2.html"
    fi
    
    if ! grep -q "webgl-utils.js" "index-v2.html"; then
        sed -i '' '/<\/head>/i\
    <script src="webgl-utils.js"></script>\
    <script src="accessibility-utils.js"></script>\
    <script src="progress-tracker.js"></script>\
    <script src="visualization-loader.js"></script>\
    <script src="apply-fixes.js" defer></script>
' "index-v2.html"
    fi
    echo "  ✓ Updated index-v2.html"
fi

# Update chapters-v2.html
if [ -f "chapters-v2.html" ]; then
    echo "Updating chapters-v2.html..."
    if ! grep -q "responsive-utils.css" "chapters-v2.html"; then
        sed -i '' '/<link rel="stylesheet" href="styles-v2.css">/a\
    <link rel="stylesheet" href="responsive-utils.css">
' "chapters-v2.html"
    fi
    
    if ! grep -q "webgl-utils.js" "chapters-v2.html"; then
        sed -i '' '/<\/head>/i\
    <script src="webgl-utils.js"></script>\
    <script src="accessibility-utils.js"></script>\
    <script src="progress-tracker.js"></script>\
    <script src="apply-fixes.js" defer></script>
' "chapters-v2.html"
    fi
    echo "  ✓ Updated chapters-v2.html"
fi

echo ""
echo "All files updated with bug fixes!"
echo ""
echo "Summary of fixes applied:"
echo "  ✓ WebGL error handling and fallbacks"
echo "  ✓ Responsive design improvements"
echo "  ✓ Accessibility enhancements"
echo "  ✓ Progress tracking system"
echo "  ✓ Performance optimizations"
echo "  ✓ Console error fixes"