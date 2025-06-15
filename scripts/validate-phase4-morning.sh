#!/bin/bash

# Phase 4 Morning: Validation Script
echo "🧪 Phase 4 Morning: Comprehensive Validation"

cd /Users/akshaybapat/aion-visualization

# Validation counters
total_files=0
valid_files=0
invalid_files=0
missing_assets=0

declare -a error_log=()
declare -a missing_assets_log=()

# Function to validate HTML file
validate_html_file() {
    local file="$1"
    local expected_location="$2"
    
    if [ ! -f "$file" ]; then
        error_log+=("File not found: $file")
        return 1
    fi
    
    total_files=$((total_files + 1))
    local file_errors=0
    
    echo "🔍 Validating: $file"
    
    # Check basic HTML structure
    if ! grep -q "<!DOCTYPE html>" "$file"; then
        error_log+=("$file: Missing DOCTYPE declaration")
        file_errors=$((file_errors + 1))
    fi
    
    if ! grep -q "<html" "$file" || ! grep -q "</html>" "$file"; then
        error_log+=("$file: Invalid HTML structure")
        file_errors=$((file_errors + 1))
    fi
    
    # Check CSS paths based on location
    case "$expected_location" in
        "root")
            if grep -q 'href="styles-v3\.css"' "$file" || grep -q 'href="styles\.css"' "$file"; then
                error_log+=("$file: Old CSS paths still present")
                file_errors=$((file_errors + 1))
            fi
            if ! grep -q 'href="assets/css/' "$file"; then
                error_log+=("$file: Missing new CSS paths")
                file_errors=$((file_errors + 1))
            fi
            ;;
        "chapters")
            if ! grep -q 'href="../assets/css/' "$file"; then
                error_log+=("$file: Incorrect CSS paths for chapters/ location")
                file_errors=$((file_errors + 1))
            fi
            ;;
        "chapters/sub")
            if ! grep -q 'href="../../assets/css/' "$file"; then
                error_log+=("$file: Incorrect CSS paths for chapters/sub/ location")
                file_errors=$((file_errors + 1))
            fi
            ;;
    esac
    
    # Check for referenced assets existence
    while IFS= read -r css_path; do
        if [ -n "$css_path" ]; then
            # Extract path from href attribute
            css_file=$(echo "$css_path" | sed 's/.*href="\([^"]*\)".*/\1/')
            
            # Convert relative path to absolute
            case "$expected_location" in
                "root")
                    full_path="$css_file"
                    ;;
                "chapters")
                    full_path=$(echo "$css_file" | sed 's|^\.\./||')
                    ;;
                "chapters/sub")
                    full_path=$(echo "$css_file" | sed 's|^\.\./\.\./||')
                    ;;
            esac
            
            if [ ! -f "$full_path" ]; then
                missing_assets_log+=("$file: References missing CSS: $full_path")
                missing_assets=$((missing_assets + 1))
            fi
        fi
    done < <(grep -o 'href="[^"]*\.css"' "$file")
    
    # Check JavaScript references
    while IFS= read -r js_path; do
        if [ -n "$js_path" ]; then
            js_file=$(echo "$js_path" | sed 's/.*src="\([^"]*\)".*/\1/')
            
            case "$expected_location" in
                "root")
                    full_path="$js_file"
                    ;;
                "chapters")
                    full_path=$(echo "$js_file" | sed 's|^\.\./||')
                    ;;
                "chapters/sub")
                    full_path=$(echo "$js_file" | sed 's|^\.\./\.\./||')
                    ;;
            esac
            
            if [ ! -f "$full_path" ]; then
                missing_assets_log+=("$file: References missing JS: $full_path")
                missing_assets=$((missing_assets + 1))
            fi
        fi
    done < <(grep -o 'src="[^"]*\.js"' "$file")
    
    if [ $file_errors -eq 0 ]; then
        valid_files=$((valid_files + 1))
        echo "  ✅ Valid: $file"
        return 0
    else
        invalid_files=$((invalid_files + 1))
        echo "  ❌ Invalid: $file ($file_errors errors)"
        return 1
    fi
}

# Validate root files
echo ""
echo "📁 Validating root directory files..."
validate_html_file "index.html" "root"
validate_html_file "test-navigation.html" "root"

# Validate src files
echo ""
echo "📁 Validating src/ directory files..."
for file in src/*.html; do
    if [ -f "$file" ]; then
        validate_html_file "$file" "root"
    fi
done

# Validate chapters files
echo ""
echo "📁 Validating chapters/ directory files..."
if [ -f "chapters/index.html" ]; then
    validate_html_file "chapters/index.html" "chapters"
fi

# Validate enhanced chapters
echo ""
echo "📁 Validating chapters/enhanced/ files..."
for file in chapters/enhanced/*.html; do
    if [ -f "$file" ]; then
        validate_html_file "$file" "chapters/sub"
    fi
done

# Validate standard chapters
echo ""
echo "📁 Validating chapters/standard/ files..."
for file in chapters/standard/*.html; do
    if [ -f "$file" ]; then
        validate_html_file "$file" "chapters/sub"
    fi
done

# Check critical asset files
echo ""
echo "🎯 Checking critical asset files..."

critical_assets=(
    "assets/css/main.css"
    "assets/css/chapters.css"
    "assets/js/core/navigation.js"
    "assets/js/core/utilities.js"
    "assets/js/visualizations/webgl-manager.js"
)

missing_critical=0

for asset in "${critical_assets[@]}"; do
    if [ -f "$asset" ]; then
        echo "  ✅ Found: $asset"
        
        # Check if file has content
        if [ -s "$asset" ]; then
            echo "    📄 File has content"
        else
            echo "    ⚠️  File is empty: $asset"
        fi
    else
        echo "  ❌ Missing: $asset"
        missing_critical=$((missing_critical + 1))
    fi
done

# Generate detailed report
echo ""
echo "📊 PHASE 4 MORNING VALIDATION REPORT"
echo "=================================="
echo ""
echo "📈 Summary Statistics:"
echo "  📁 Total files checked: $total_files"
echo "  ✅ Valid files: $valid_files"
echo "  ❌ Invalid files: $invalid_files"
echo "  🚨 Missing asset references: $missing_assets"
echo "  🎯 Missing critical assets: $missing_critical"
echo ""

# Calculate success rate
if [ $total_files -gt 0 ]; then
    success_rate=$(( (valid_files * 100) / total_files ))
    echo "📊 Success rate: ${success_rate}%"
else
    echo "📊 Success rate: N/A (no files processed)"
fi

# Display errors if any
if [ ${#error_log[@]} -gt 0 ]; then
    echo ""
    echo "❌ ERRORS FOUND:"
    echo "================"
    for error in "${error_log[@]}"; do
        echo "  • $error"
    done
fi

# Display missing assets if any
if [ ${#missing_assets_log[@]} -gt 0 ]; then
    echo ""
    echo "🚨 MISSING ASSET REFERENCES:"
    echo "============================"
    for missing in "${missing_assets_log[@]}"; do
        echo "  • $missing"
    done
fi

# Provide recommendations
echo ""
echo "🎯 RECOMMENDATIONS:"
echo "=================="

if [ $invalid_files -gt 0 ]; then
    echo "  🔧 Fix invalid HTML files before proceeding"
fi

if [ $missing_critical -gt 0 ]; then
    echo "  📄 Create or move missing critical asset files"
fi

if [ $missing_assets -gt 0 ]; then
    echo "  🔗 Update file references to point to existing assets"
fi

if [ $invalid_files -eq 0 ] && [ $missing_critical -eq 0 ]; then
    echo "  ✅ Phase 4 Morning validation passed! Ready for Phase 4 Afternoon"
else
    echo "  ⚠️  Issues found - recommend fixing before proceeding"
fi

echo ""
echo "🔄 To re-run validation after fixes:"
echo "     chmod +x validate-phase4-morning.sh && ./validate-phase4-morning.sh"