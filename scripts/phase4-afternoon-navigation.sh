#!/bin/bash

# Phase 4 Afternoon: Fix Internal Navigation Links
echo "🧭 Phase 4 Afternoon: Fixing all internal navigation links"

cd /Users/akshaybapat/aion-visualization

# Create backup if not exists
if [ ! -d "PHASE4_BACKUP" ]; then
    echo "💾 Creating backup..."
    mkdir -p PHASE4_BACKUP
    cp -r src PHASE4_BACKUP/ 2>/dev/null
    cp -r chapters PHASE4_BACKUP/ 2>/dev/null
    cp index.html PHASE4_BACKUP/ 2>/dev/null
fi

# Function to update navigation links in a file
update_navigation_links() {
    local file="$1"
    local file_location="$2"
    
    if [ ! -f "$file" ]; then
        echo "  ⚠️  File not found: $file"
        return 1
    fi
    
    echo "  🔗 Updating navigation in: $file (location: $file_location)"
    
    # Create temp file for atomic updates
    local temp_file="${file}.nav_tmp"
    cp "$file" "$temp_file"
    
    # Update navigation links based on file location
    case "$file_location" in
        "root")
            # Root files (index.html, test-navigation.html, src/*.html)
            
            # Update chapter links to point to enhanced versions by default
            sed -i '' 's|href="chapter\([0-9]\+\)\.html"|href="chapters/enhanced/chapter-\1.html"|g' "$temp_file"
            sed -i '' 's|href="src/chapter\([0-9]\+\)\.html"|href="chapters/enhanced/chapter-\1.html"|g' "$temp_file"
            
            # Update chapters index link
            sed -i '' 's|href="chapters\.html"|href="chapters/index.html"|g' "$temp_file"
            sed -i '' 's|href="src/chapters\.html"|href="chapters/index.html"|g' "$temp_file"
            
            # Update other page links
            sed -i '' 's|href="about\.html"|href="src/about.html"|g' "$temp_file"
            sed -i '' 's|href="timeline\.html"|href="src/timeline.html"|g' "$temp_file"
            sed -i '' 's|href="symbols\.html"|href="src/symbols.html"|g' "$temp_file"
            
            # Update home links
            sed -i '' 's|href="index\.html"|href="./index.html"|g' "$temp_file"
            ;;
            
        "chapters")
            # chapters/index.html
            
            # Update links to enhanced chapters
            sed -i '' 's|href="chapter-\([0-9]\+\)\.html"|href="enhanced/chapter-\1.html"|g' "$temp_file"
            sed -i '' 's|href="enhanced-chapter\([0-9]\+\)\.html"|href="enhanced/chapter-\1.html"|g' "$temp_file"
            
            # Update links to standard chapters
            sed -i '' 's|href="standard/chapter\([0-9]\+\)\.html"|href="standard/chapter-\1.html"|g' "$temp_file"
            
            # Update home link
            sed -i '' 's|href="index\.html"|href="../index.html"|g' "$temp_file"
            sed -i '' 's|href="../index\.html"|href="../index.html"|g' "$temp_file"
            
            # Update other page links
            sed -i '' 's|href="about\.html"|href="../src/about.html"|g' "$temp_file"
            ;;
            
        "chapters/enhanced")
            # chapters/enhanced/chapter-*.html
            
            # Update chapter-to-chapter navigation
            sed -i '' 's|href="chapter\([0-9]\+\)\.html"|href="chapter-\1.html"|g' "$temp_file"
            sed -i '' 's|href="chapter-\([0-9]\+\)\.html"|href="./chapter-\1.html"|g' "$temp_file"
            
            # Update home and index links
            sed -i '' 's|href="index\.html"|href="../../index.html"|g' "$temp_file"
            sed -i '' 's|href="../index\.html"|href="../index.html"|g' "$temp_file"
            sed -i '' 's|href="chapters\.html"|href="../index.html"|g' "$temp_file"
            
            # Update switch to standard version link
            sed -i '' 's|href="standard/chapter-\([0-9]\+\)\.html"|href="../standard/chapter-\1.html"|g' "$temp_file"
            
            # Update other page links
            sed -i '' 's|href="about\.html"|href="../../src/about.html"|g' "$temp_file"
            ;;
            
        "chapters/standard")
            # chapters/standard/chapter-*.html
            
            # Update chapter-to-chapter navigation
            sed -i '' 's|href="chapter\([0-9]\+\)\.html"|href="chapter-\1.html"|g' "$temp_file"
            sed -i '' 's|href="chapter-\([0-9]\+\)\.html"|href="./chapter-\1.html"|g' "$temp_file"
            
            # Update home and index links
            sed -i '' 's|href="index\.html"|href="../../index.html"|g' "$temp_file"
            sed -i '' 's|href="../index\.html"|href="../index.html"|g' "$temp_file"
            sed -i '' 's|href="chapters\.html"|href="../index.html"|g' "$temp_file"
            
            # Update switch to enhanced version link
            sed -i '' 's|href="enhanced/chapter-\([0-9]\+\)\.html"|href="../enhanced/chapter-\1.html"|g' "$temp_file"
            
            # Update other page links
            sed -i '' 's|href="about\.html"|href="../../src/about.html"|g' "$temp_file"
            ;;
    esac
    
    # Add navigation helpers for chapter files
    if [[ "$file" == *"/chapter-"*.html ]]; then
        # Extract chapter number
        chapter_num=$(echo "$file" | grep -o 'chapter-[0-9]\+' | grep -o '[0-9]\+')
        
        if [ -n "$chapter_num" ]; then
            # Update previous/next chapter navigation
            prev_chapter=$((chapter_num - 1))
            next_chapter=$((chapter_num + 1))
            
            # Update previous chapter link (if not chapter 1)
            if [ $chapter_num -gt 1 ]; then
                sed -i '' "s|href=\"chapter-[0-9]\+\.html\" class=\"prev\"|href=\"chapter-${prev_chapter}.html\" class=\"prev\"|g" "$temp_file"
                sed -i '' "s|id=\"prevChapter\"[^>]*>|id=\"prevChapter\" href=\"chapter-${prev_chapter}.html\">|g" "$temp_file"
            fi
            
            # Update next chapter link (if not chapter 14)
            if [ $chapter_num -lt 14 ]; then
                sed -i '' "s|href=\"chapter-[0-9]\+\.html\" class=\"next\"|href=\"chapter-${next_chapter}.html\" class=\"next\"|g" "$temp_file"
                sed -i '' "s|id=\"nextChapter\"[^>]*>|id=\"nextChapter\" href=\"chapter-${next_chapter}.html\">|g" "$temp_file"
            fi
        fi
    fi
    
    # Validate the changes
    if grep -q "<html" "$temp_file" && grep -q "</html>" "$temp_file"; then
        mv "$temp_file" "$file"
        echo "    ✅ Successfully updated navigation: $file"
        return 0
    else
        echo "    ❌ Failed validation for: $file"
        rm "$temp_file"
        return 1
    fi
}

# Update root files
echo ""
echo "📁 Updating navigation in root files..."
update_navigation_links "index.html" "root"
update_navigation_links "test-navigation.html" "root"

# Update src files
echo ""
echo "📁 Updating navigation in src/ files..."
for file in src/*.html; do
    if [ -f "$file" ]; then
        update_navigation_links "$file" "root"
    fi
done

# Update chapters index
echo ""
echo "📁 Updating navigation in chapters/ files..."
if [ -f "chapters/index.html" ]; then
    update_navigation_links "chapters/index.html" "chapters"
fi

# Update enhanced chapters
echo ""
echo "📁 Updating navigation in chapters/enhanced/ files..."
for file in chapters/enhanced/*.html; do
    if [ -f "$file" ]; then
        update_navigation_links "$file" "chapters/enhanced"
    fi
done

# Update standard chapters
echo ""
echo "📁 Updating navigation in chapters/standard/ files..."
for file in chapters/standard/*.html; do
    if [ -f "$file" ]; then
        update_navigation_links "$file" "chapters/standard"
    fi
done

# Update main navigation.js file to support new structure
echo ""
echo "🔧 Updating navigation.js for new chapter structure..."

nav_js_file="assets/js/core/navigation.js"
if [ -f "$nav_js_file" ]; then
    echo "  📝 Updating navigation.js chapter routes..."
    
    # Create backup of navigation.js
    cp "$nav_js_file" "${nav_js_file}.backup"
    
    # Update chapter routes in navigation.js
    sed -i '' 's|chapters/chapter-|chapters/enhanced/chapter-|g' "$nav_js_file"
    
    # Ensure enhanced is default for new routes
    if ! grep -q "chapters/enhanced/" "$nav_js_file"; then
        echo "  ⚠️  Navigation.js may need manual update for enhanced chapters"
    else
        echo "  ✅ Navigation.js updated for enhanced chapters"
    fi
else
    echo "  ⚠️  Navigation.js not found at expected location: $nav_js_file"
fi

# Create hardcoded path detection and fix script
echo ""
echo "🔍 Scanning for remaining hardcoded paths..."

declare -a hardcoded_issues=()

# Scan for old style paths that may have been missed
for file in index.html test-navigation.html src/*.html chapters/*.html chapters/*/*.html; do
    if [ -f "$file" ]; then
        # Check for old style references
        if grep -q 'href="styles-v[0-9]\.css"' "$file"; then
            hardcoded_issues+=("$file: Still references old CSS files")
        fi
        
        if grep -q 'src="[^/]*\.js"' "$file" && ! grep -q 'src="assets/' "$file"; then
            hardcoded_issues+=("$file: May have hardcoded JS references")
        fi
        
        # Check for absolute paths (should be relative)
        if grep -q 'href="/[^"]' "$file" || grep -q 'src="/[^"]' "$file"; then
            hardcoded_issues+=("$file: Contains absolute paths")
        fi
    fi
done

# Report hardcoded issues
if [ ${#hardcoded_issues[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  HARDCODED PATH ISSUES FOUND:"
    for issue in "${hardcoded_issues[@]}"; do
        echo "  • $issue"
    done
else
    echo "  ✅ No hardcoded path issues found"
fi

# Run validation
echo ""
echo "🧪 Running navigation validation..."

nav_errors=0
nav_warnings=0

# Check that chapter navigation follows the pattern
for i in {1..14}; do
    enhanced_file="chapters/enhanced/chapter-${i}.html"
    standard_file="chapters/standard/chapter-${i}.html"
    
    if [ -f "$enhanced_file" ]; then
        # Check previous/next links in enhanced chapters
        if [ $i -gt 1 ]; then
            if ! grep -q "chapter-$((i-1)).html" "$enhanced_file"; then
                echo "  ⚠️  Enhanced chapter $i missing previous link"
                nav_warnings=$((nav_warnings + 1))
            fi
        fi
        
        if [ $i -lt 14 ]; then
            if ! grep -q "chapter-$((i+1)).html" "$enhanced_file"; then
                echo "  ⚠️  Enhanced chapter $i missing next link"
                nav_warnings=$((nav_warnings + 1))
            fi
        fi
    else
        echo "  ❌ Missing enhanced chapter: $enhanced_file"
        nav_errors=$((nav_errors + 1))
    fi
    
    if [ -f "$standard_file" ]; then
        # Check previous/next links in standard chapters
        if [ $i -gt 1 ]; then
            if ! grep -q "chapter-$((i-1)).html" "$standard_file"; then
                echo "  ⚠️  Standard chapter $i missing previous link"
                nav_warnings=$((nav_warnings + 1))
            fi
        fi
        
        if [ $i -lt 14 ]; then
            if ! grep -q "chapter-$((i+1)).html" "$standard_file"; then
                echo "  ⚠️  Standard chapter $i missing next link"
                nav_warnings=$((nav_warnings + 1))
            fi
        fi
    else
        echo "  ❌ Missing standard chapter: $standard_file"
        nav_errors=$((nav_errors + 1))
    fi
done

echo ""
echo "📊 PHASE 4 AFTERNOON NAVIGATION REPORT"
echo "====================================="
echo ""
echo "📈 Navigation Statistics:"
echo "  🔗 Enhanced chapters: $(ls chapters/enhanced/chapter-*.html 2>/dev/null | wc -l)"
echo "  🔗 Standard chapters: $(ls chapters/standard/chapter-*.html 2>/dev/null | wc -l)"
echo "  ❌ Navigation errors: $nav_errors"
echo "  ⚠️  Navigation warnings: $nav_warnings"
echo "  🚨 Hardcoded path issues: ${#hardcoded_issues[@]}"
echo ""

if [ $nav_errors -eq 0 ] && [ ${#hardcoded_issues[@]} -eq 0 ]; then
    echo "✅ Phase 4 Afternoon navigation update completed successfully!"
    echo ""
    echo "🎯 Ready for Phase 5 (Performance Optimization)"
else
    echo "⚠️  Issues found - recommend review before Phase 5"
fi

echo ""
echo "🔄 To validate navigation:"
echo "     Open index.html in browser and test chapter navigation"
echo ""
echo "💾 Backup available in PHASE4_BACKUP/ if rollback needed"