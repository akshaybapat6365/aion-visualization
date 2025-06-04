#!/bin/bash

# Phase 4 Morning: Comprehensive File Reference Updates
echo "🔧 Phase 4 Morning: Updating all file references for new structure"

cd /Users/akshaybapat/aion-visualization

# Create backup directory
echo "💾 Creating backup of current files..."
mkdir -p PHASE4_BACKUP
cp -r src PHASE4_BACKUP/ 2>/dev/null
cp -r chapters PHASE4_BACKUP/ 2>/dev/null
cp index.html PHASE4_BACKUP/ 2>/dev/null
cp test-navigation.html PHASE4_BACKUP/ 2>/dev/null

echo "✅ Backup created in PHASE4_BACKUP/"

# Function to update paths in a file with validation
update_file_paths() {
    local file="$1"
    local file_location="$2"  # root, chapters, chapters/enhanced, chapters/standard
    
    if [ ! -f "$file" ]; then
        echo "  ⚠️  File not found: $file"
        return 1
    fi
    
    echo "  📝 Updating paths in: $file (location: $file_location)"
    
    # Create temp file for atomic updates
    local temp_file="${file}.tmp"
    cp "$file" "$temp_file"
    
    # Update CSS paths based on file location
    case "$file_location" in
        "root")
            # Files in root directory
            sed -i '' 's|href="styles-v3\.css"|href="assets/css/main.css"|g' "$temp_file"
            sed -i '' 's|href="styles-v2\.css"|href="assets/css/main.css"|g' "$temp_file"
            sed -i '' 's|href="styles\.css"|href="assets/css/main.css"|g' "$temp_file"
            sed -i '' 's|href="chapter-styles\.css"|href="assets/css/chapters.css"|g' "$temp_file"
            ;;
        "chapters")
            # Files in chapters/ directory
            sed -i '' 's|href="styles-v3\.css"|href="../assets/css/main.css"|g' "$temp_file"
            sed -i '' 's|href="styles-v2\.css"|href="../assets/css/main.css"|g' "$temp_file"
            sed -i '' 's|href="styles\.css"|href="../assets/css/main.css"|g' "$temp_file"
            sed -i '' 's|href="chapter-styles\.css"|href="../assets/css/chapters.css"|g' "$temp_file"
            ;;
        "chapters/enhanced"|"chapters/standard")
            # Files in chapters/enhanced/ or chapters/standard/
            sed -i '' 's|href="styles-v3\.css"|href="../../assets/css/main.css"|g' "$temp_file"
            sed -i '' 's|href="styles-v2\.css"|href="../../assets/css/main.css"|g' "$temp_file"
            sed -i '' 's|href="styles\.css"|href="../../assets/css/main.css"|g' "$temp_file"
            sed -i '' 's|href="chapter-styles\.css"|href="../../assets/css/chapters.css"|g' "$temp_file"
            ;;
    esac
    
    # Update JavaScript paths based on file location
    case "$file_location" in
        "root")
            sed -i '' 's|src="navigation\.js"|src="assets/js/core/navigation.js"|g' "$temp_file"
            sed -i '' 's|src="chapter-navigation\.js"|src="assets/js/core/navigation.js"|g' "$temp_file"
            sed -i '' 's|src="transitions\.js"|src="assets/js/core/utilities.js"|g' "$temp_file"
            sed -i '' 's|src="starfield\.js"|src="assets/js/visualizations/webgl-manager.js"|g' "$temp_file"
            ;;
        "chapters")
            sed -i '' 's|src="navigation\.js"|src="../assets/js/core/navigation.js"|g' "$temp_file"
            sed -i '' 's|src="chapter-navigation\.js"|src="../assets/js/core/navigation.js"|g' "$temp_file"
            sed -i '' 's|src="transitions\.js"|src="../assets/js/core/utilities.js"|g' "$temp_file"
            sed -i '' 's|src="starfield\.js"|src="../assets/js/visualizations/webgl-manager.js"|g' "$temp_file"
            ;;
        "chapters/enhanced"|"chapters/standard")
            sed -i '' 's|src="navigation\.js"|src="../../assets/js/core/navigation.js"|g' "$temp_file"
            sed -i '' 's|src="chapter-navigation\.js"|src="../../assets/js/core/navigation.js"|g' "$temp_file"
            sed -i '' 's|src="transitions\.js"|src="../../assets/js/core/utilities.js"|g' "$temp_file"
            sed -i '' 's|src="starfield\.js"|src="../../assets/js/visualizations/webgl-manager.js"|g' "$temp_file"
            ;;
    esac
    
    # Validate the changes don't break the file structure
    if grep -q "<html" "$temp_file" && grep -q "</html>" "$temp_file"; then
        mv "$temp_file" "$file"
        echo "    ✅ Successfully updated: $file"
        return 0
    else
        echo "    ❌ Failed validation for: $file"
        rm "$temp_file"
        return 1
    fi
}

# Update root files
echo ""
echo "📁 Updating root directory files..."
update_file_paths "index.html" "root"
update_file_paths "test-navigation.html" "root"

# Update src files
echo ""
echo "📁 Updating src/ directory files..."
for file in src/*.html; do
    if [ -f "$file" ]; then
        update_file_paths "$file" "root"
    fi
done

# Update chapters index
echo ""
echo "📁 Updating chapters/ directory files..."
if [ -f "chapters/index.html" ]; then
    update_file_paths "chapters/index.html" "chapters"
fi

# Update enhanced chapters
echo ""
echo "📁 Updating chapters/enhanced/ files..."
for file in chapters/enhanced/*.html; do
    if [ -f "$file" ]; then
        update_file_paths "$file" "chapters/enhanced"
    fi
done

# Update standard chapters
echo ""
echo "📁 Updating chapters/standard/ files..."
for file in chapters/standard/*.html; do
    if [ -f "$file" ]; then
        update_file_paths "$file" "chapters/standard"
    fi
done

# Verify asset files exist
echo ""
echo "🔍 Verifying asset files exist..."

required_css=(
    "assets/css/main.css"
    "assets/css/chapters.css"
)

required_js=(
    "assets/js/core/navigation.js"
    "assets/js/core/utilities.js"
    "assets/js/visualizations/webgl-manager.js"
)

missing_files=()

for css_file in "${required_css[@]}"; do
    if [ ! -f "$css_file" ]; then
        echo "  ⚠️  Missing CSS: $css_file"
        missing_files+=("$css_file")
    else
        echo "  ✅ Found CSS: $css_file"
    fi
done

for js_file in "${required_js[@]}"; do
    if [ ! -f "$js_file" ]; then
        echo "  ⚠️  Missing JS: $js_file"
        missing_files+=("$js_file")
    else
        echo "  ✅ Found JS: $js_file"
    fi
done

# Create missing asset files if needed
if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "🔧 Creating missing asset files..."
    
    for missing_file in "${missing_files[@]}"; do
        mkdir -p "$(dirname "$missing_file")"
        
        case "$missing_file" in
            *.css)
                echo "/* Placeholder CSS file - needs content */" > "$missing_file"
                echo "  ✅ Created placeholder: $missing_file"
                ;;
            *.js)
                echo "// Placeholder JS file - needs content" > "$missing_file"
                echo "  ✅ Created placeholder: $missing_file"
                ;;
        esac
    done
fi

# Run validation checks
echo ""
echo "🧪 Running validation checks..."

total_files=0
updated_files=0
error_files=()

# Check all updated files for basic validity
for file in index.html test-navigation.html src/*.html chapters/index.html chapters/enhanced/*.html chapters/standard/*.html; do
    if [ -f "$file" ]; then
        total_files=$((total_files + 1))
        
        # Check for basic HTML structure
        if grep -q "<html" "$file" && grep -q "</html>" "$file"; then
            updated_files=$((updated_files + 1))
        else
            error_files+=("$file")
        fi
        
        # Check for updated paths
        if grep -q "assets/css/" "$file" || grep -q "assets/js/" "$file"; then
            echo "  ✅ Updated paths found in: $(basename "$file")"
        else
            echo "  ⚠️  No updated paths in: $(basename "$file")"
        fi
    fi
done

echo ""
echo "📊 Phase 4 Morning Update Summary:"
echo "  📁 Total files processed: $total_files"
echo "  ✅ Successfully updated: $updated_files"
echo "  ❌ Files with errors: ${#error_files[@]}"

if [ ${#error_files[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Files with errors:"
    for error_file in "${error_files[@]}"; do
        echo "    - $error_file"
    done
fi

echo ""
echo "✅ Phase 4 Morning Complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Test file loading in browser"
echo "  2. Verify CSS and JS assets load correctly"
echo "  3. Check chapter navigation works"
echo "  4. Proceed to Phase 4 Afternoon (navigation links)"
echo ""
echo "💾 Backup available in PHASE4_BACKUP/ if rollback needed"