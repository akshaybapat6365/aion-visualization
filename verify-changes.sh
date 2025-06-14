#!/bin/bash

echo "📋 Verifying Changes for Deployment"
echo "=================================="

echo ""
echo "🔍 Key Files Modified:"
echo ""

# Check keyboard navigation
echo "1. Keyboard Navigation (src/core/keyboard-nav.js):"
if [ -f "src/core/keyboard-nav.js" ]; then
    echo "   ✅ File exists"
    grep -n "standard/chapter-" src/core/keyboard-nav.js | head -3
else
    echo "   ❌ File not found"
fi

echo ""
echo "2. Chapters Index (chapters/index.html):"
if [ -f "chapters/index.html" ]; then
    echo "   ✅ File exists"
    grep -n 'href="standard/chapter-' chapters/index.html | head -3
else
    echo "   ❌ File not found"
fi

echo ""
echo "3. Sitemap (sitemap.xml):"
if [ -f "sitemap.xml" ]; then
    echo "   ✅ File exists"
    grep -n "chapter-1.html" sitemap.xml | head -3
else
    echo "   ❌ File not found"
fi

echo ""
echo "4. Test Page (test.html):"
if [ -f "test.html" ]; then
    echo "   ✅ File exists"
else
    echo "   ❌ File not found"
fi

echo ""
echo "5. Deployment Documentation:"
ls -la *.md | grep -E "(DEPLOYMENT|CHECKLIST)" || echo "   ❌ No deployment docs found"

echo ""
echo "📁 Directory Structure:"
echo "   chapters/"
ls -la chapters/ | grep -E "(index|standard|enhanced)" | head -5

echo ""
echo "🚀 Ready for deployment? Run:"
echo "   chmod +x full-deployment.sh"
echo "   ./full-deployment.sh"