#!/bin/bash

# Test Before Deploy Script
# Run this before deploying to catch common issues

echo "🧪 Pre-Deployment Testing"
echo "========================"
echo ""

# 1. Check for hardcoded paths
echo "1️⃣ Checking for hardcoded /aion-visualization/ paths..."
HARDCODED_COUNT=$(grep -r "/aion-visualization/" --include="*.html" --include="*.js" --include="*.css" . 2>/dev/null | grep -v node_modules | grep -v ".git" | wc -l)

if [ $HARDCODED_COUNT -gt 0 ]; then
    echo "❌ Found $HARDCODED_COUNT hardcoded paths that will break on Vercel!"
    echo "   Run: npm run quick-fix"
    echo ""
    echo "Files with issues:"
    grep -r "/aion-visualization/" --include="*.html" --include="*.js" --include="*.css" . 2>/dev/null | grep -v node_modules | grep -v ".git" | cut -d: -f1 | sort | uniq | head -10
else
    echo "✅ No hardcoded paths found"
fi
echo ""

# 2. Check critical files exist
echo "2️⃣ Checking critical files..."
CRITICAL_FILES=(
    "index.html"
    "visualizations.html"
    "viz.html"
    "vercel.json"
    "src/visualizations/shadow/shadow-demo.html"
    "src/visualizations/constellation/anima-animus-demo.html"
)

MISSING_FILES=0
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo "✅ All critical files present"
fi
echo ""

# 3. Check for broken internal links
echo "3️⃣ Checking for broken internal links..."
BROKEN_LINKS=0

# Check HTML files for broken links
for html_file in $(find . -name "*.html" -not -path "./node_modules/*" -not -path "./.git/*"); do
    # Extract href and src attributes
    links=$(grep -oE '(href|src)="[^"]*"' "$html_file" | grep -oE '"[^"]*"' | tr -d '"')
    
    for link in $links; do
        # Skip external links and anchors
        if [[ $link == http* ]] || [[ $link == "#"* ]] || [[ $link == "javascript:"* ]]; then
            continue
        fi
        
        # Convert relative to absolute path
        dir=$(dirname "$html_file")
        if [[ $link == /* ]]; then
            # Absolute path
            check_path=".$link"
        else
            # Relative path
            check_path="$dir/$link"
        fi
        
        # Normalize path
        check_path=$(echo "$check_path" | sed 's|/\./|/|g' | sed 's|//|/|g')
        
        # Remove query strings and anchors
        check_path=$(echo "$check_path" | cut -d'?' -f1 | cut -d'#' -f1)
        
        # Check if file exists
        if [ ! -e "$check_path" ] && [ ! -e "${check_path}.html" ] && [ ! -e "${check_path}index.html" ]; then
            if [ $BROKEN_LINKS -lt 5 ]; then  # Only show first 5
                echo "❌ Broken link in $html_file: $link"
            fi
            BROKEN_LINKS=$((BROKEN_LINKS + 1))
        fi
    done
done

if [ $BROKEN_LINKS -eq 0 ]; then
    echo "✅ No broken links found"
else
    echo "⚠️  Found $BROKEN_LINKS broken links (showing first 5)"
fi
echo ""

# 4. Summary
echo "📊 Summary"
echo "=========="
if [ $HARDCODED_COUNT -gt 0 ] || [ $MISSING_FILES -gt 0 ] || [ $BROKEN_LINKS -gt 10 ]; then
    echo "❌ Issues found! Fix these before deploying:"
    [ $HARDCODED_COUNT -gt 0 ] && echo "   - Run 'npm run quick-fix' to fix paths"
    [ $MISSING_FILES -gt 0 ] && echo "   - Add missing critical files"
    [ $BROKEN_LINKS -gt 10 ] && echo "   - Fix broken internal links"
    exit 1
else
    echo "✅ Ready to deploy!"
    echo ""
    echo "Deploy with: VERCEL_TOKEN=your-token vercel --prod --yes"
    exit 0
fi