#!/bin/bash

# Fix navigation in all v2 HTML files
echo "Fixing navigation links in all v2 HTML files..."

# List of files to update
files=(
    "index.html"
    "index-v2.html"
    "chapters-v2.html"
    "about-v2.html"
    "journey-v2.html"
)

# Add all chapter files
for i in {1..14}; do
    files+=("chapter${i}-v2.html")
done

# Update navigation in each file
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Updating $file..."
        
        # Replace old navigation patterns with new standardized navigation
        # This handles various nav formats found in the files
        
        # For files with journey-v2.html link (older format)
        if grep -q "journey-v2.html" "$file"; then
            sed -i '' '/<a href="journey-v2.html"/s|<a href="journey-v2.html" class="nav-link">Journey</a>|<a href="timeline-v2.html" class="nav-link">Timeline</a>\
            <a href="symbols-v2.html" class="nav-link">Symbols</a>|' "$file"
        fi
        
        # For files with main-nav style (newer format)
        if grep -q "class=\"main-nav\"" "$file"; then
            # Check if Timeline and Symbols links are missing
            if ! grep -q "timeline-v2.html" "$file"; then
                echo "  Already has correct navigation"
            fi
        fi
        
        # For files with nav style (older format) - need to add Timeline and Symbols
        if grep -q "class=\"nav\"" "$file" && grep -q "chapters-v2.html" "$file"; then
            if ! grep -q "timeline-v2.html" "$file"; then
                # Replace the nav section with updated links
                perl -i -pe 's|(<a href="chapters-v2.html"[^>]*>Chapters</a>)\s*(<a href="[^"]*"[^>]*>[^<]*</a>)?|$1\n            <a href="timeline-v2.html" class="nav-link">Timeline</a>\n            <a href="symbols-v2.html" class="nav-link">Symbols</a>|' "$file"
            fi
        fi
    fi
done

echo "Navigation links updated successfully!"