#!/bin/bash

# Add UI consistency CSS to all chapter files
for file in chapters/chapter-*.html; do
    if [[ -f "$file" ]] && [[ ! "$file" =~ "template" ]]; then
        # Check if ui-consistency.css is already included
        if ! grep -q "ui-consistency.css" "$file"; then
            # Add the CSS link after full-width.css
            sed -i '' 's|<link rel="stylesheet" href="/styles/full-width.css">|<link rel="stylesheet" href="/styles/full-width.css">\
    <link rel="stylesheet" href="/assets/css/ui-consistency.css">|' "$file"
            echo "Updated: $file"
        else
            echo "Already has UI consistency CSS: $file"
        fi
    fi
done

echo "UI consistency CSS added to all chapter files!"