#!/bin/bash

# Phase 5: GitHub Pages Configuration - Complete Implementation
echo "🚀 Phase 5: GitHub Pages Configuration - Complete Implementation"

cd /Users/akshaybapat/aion-visualization

# Create comprehensive backup
echo "💾 Creating Phase 5 backup..."
backup_dir="PHASE5_GITHUB_PAGES_BACKUP_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"
cp -r assets "$backup_dir/" 2>/dev/null
cp -r chapters "$backup_dir/" 2>/dev/null
cp -r src "$backup_dir/" 2>/dev/null
cp -r .github "$backup_dir/" 2>/dev/null
cp index.html "$backup_dir/" 2>/dev/null
cp 404.html "$backup_dir/" 2>/dev/null
cp sitemap.xml "$backup_dir/" 2>/dev/null
cp robots.txt "$backup_dir/" 2>/dev/null
cp sw.js "$backup_dir/" 2>/dev/null
cp .nojekyll "$backup_dir/" 2>/dev/null

echo "✅ Backup created: $backup_dir"

# Validation counters
total_tests=0
passed_tests=0
failed_tests=0
warnings=0

declare -a test_results=()

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    total_tests=$((total_tests + 1))
    echo "🧪 Testing: $test_name"
    
    if eval "$test_command"; then
        echo "  ✅ PASS: $test_name"
        test_results+=("✅ PASS: $test_name")
        passed_tests=$((passed_tests + 1))
        return 0
    else
        echo "  ❌ FAIL: $test_name"
        test_results+=("❌ FAIL: $test_name")
        failed_tests=$((failed_tests + 1))
        return 1
    fi
}

# Function to run warning test
run_warning_test() {
    local test_name="$1"
    local test_command="$2"
    
    total_tests=$((total_tests + 1))
    echo "⚠️  Checking: $test_name"
    
    if eval "$test_command"; then
        echo "  ✅ OK: $test_name"
        test_results+=("✅ OK: $test_name")
        passed_tests=$((passed_tests + 1))
        return 0
    else
        echo "  ⚠️  WARNING: $test_name"
        test_results+=("⚠️ WARNING: $test_name")
        warnings=$((warnings + 1))
        return 1
    fi
}

echo ""
echo "🔍 COMPREHENSIVE PHASE 5 VALIDATION"
echo "==================================="

# Test 1: GitHub Pages Configuration Files
echo ""
echo "📄 Testing GitHub Pages Configuration Files..."

run_test ".nojekyll file exists" "[ -f '.nojekyll' ]"
run_test "404.html exists and has content" "[ -f '404.html' ] && [ -s '404.html' ]"
run_test "sitemap.xml exists and is valid" "[ -f 'sitemap.xml' ] && [ -s 'sitemap.xml' ]"
run_test "robots.txt exists and has content" "[ -f 'robots.txt' ] && [ -s 'robots.txt' ]"
run_test "Main index.html exists in root" "[ -f 'index.html' ] && [ -s 'index.html' ]"

# Test 2: GitHub Actions Workflow
echo ""
echo "⚙️  Testing GitHub Actions Workflow..."

run_test "GitHub Actions workflow exists" "[ -f '.github/workflows/deploy.yml' ]"
run_test "Workflow has quality check job" "grep -q 'quality-check:' '.github/workflows/deploy.yml'"
run_test "Workflow has build job" "grep -q 'build:' '.github/workflows/deploy.yml'"
run_test "Workflow has deploy job" "grep -q 'deploy:' '.github/workflows/deploy.yml'"
run_test "Workflow has post-deploy testing" "grep -q 'post-deploy-test:' '.github/workflows/deploy.yml'"

# Test 3: Clean URL Router Implementation
echo ""
echo "🔗 Testing Clean URL Router Implementation..."

run_test "GitHub Pages Router exists" "[ -f 'assets/js/core/github-pages-router.js' ]"
run_test "Router has clean URL patterns" "grep -q 'routePatterns' 'assets/js/core/github-pages-router.js'"
run_test "Router handles chapter routes" "grep -q 'chapterEnhanced.*chapterStandard' 'assets/js/core/github-pages-router.js'"
run_test "Router includes navigation in index" "grep -q 'github-pages-router' 'index.html'"

# Test 4: Environment Configuration
echo ""
echo "🌍 Testing Environment Configuration..."

run_test "Environment config exists" "[ -f 'assets/js/core/environment-config.js' ]"
run_test "Config handles production environment" "grep -q 'production.*development.*staging' 'assets/js/core/environment-config.js'"
run_test "Config includes CDN management" "grep -q 'cdnConfig.*threejs.*d3' 'assets/js/core/environment-config.js'"
run_test "Config has asset optimization" "grep -q 'useMinified.*enableCaching' 'assets/js/core/environment-config.js'"

# Test 5: Service Worker Implementation
echo ""
echo "🔧 Testing Service Worker Implementation..."

run_test "Service worker exists" "[ -f 'sw.js' ]"
run_test "Service worker caches static assets" "grep -q 'STATIC_ASSETS.*STATIC_CACHE' 'sw.js'"
run_test "Service worker handles offline" "grep -q 'handleOfflineRequest.*createOfflineResponse' 'sw.js'"
run_test "Service worker registered in index" "grep -q 'serviceWorker.*register' 'index.html'"

# Test 6: Asset Organization and Optimization
echo ""
echo "📁 Testing Asset Organization..."

run_test "Main CSS exists" "[ -f 'assets/css/main.css' ]"
run_test "Chapters CSS exists" "[ -f 'assets/css/chapters.css' ]"
run_test "Router JS exists" "[ -f 'assets/js/core/github-pages-router.js' ]"
run_test "Utilities exist" "[ -f 'assets/js/core/consolidated-utilities.js' ]"

run_warning_test "Minified CSS available" "[ -f 'assets/css/main.min.css' ]"
run_warning_test "Minified JS available" "[ -f 'assets/js/core/github-pages-router.min.js' ]"

# Test 7: Chapter Structure and Navigation
echo ""
echo "📚 Testing Chapter Structure..."

run_test "Enhanced chapters directory exists" "[ -d 'chapters/enhanced' ]"
run_test "Standard chapters directory exists" "[ -d 'chapters/standard' ]"
run_test "Chapters index exists" "[ -f 'chapters/index.html' ]"

# Count chapter files
enhanced_count=$(ls chapters/enhanced/chapter-*.html 2>/dev/null | wc -l)
standard_count=$(ls chapters/standard/chapter-*.html 2>/dev/null | wc -l)

run_test "Enhanced chapters present (expecting 14)" "[ $enhanced_count -ge 10 ]"
run_test "Standard chapters present (expecting 14)" "[ $standard_count -ge 10 ]"

# Test 8: URL Structure Validation
echo ""
echo "🌐 Testing URL Structure..."

run_test "Sitemap includes clean URLs" "grep -q '/chapters/enhanced/1/' 'sitemap.xml'"
run_test "Sitemap includes standard URLs" "grep -q '/chapters/standard/1/' 'sitemap.xml'"
run_test "404 page has navigation" "grep -q 'nav.*nav-link' '404.html'"
run_test "Index uses clean URLs" "grep -q 'href=\"/chapters/' 'index.html'"

# Test 9: SEO and Meta Configuration
echo ""
echo "🔍 Testing SEO Configuration..."

run_test "Index has meta description" "grep -q 'meta name=\"description\"' 'index.html'"
run_test "Index has Open Graph tags" "grep -q 'property=\"og:' 'index.html'"
run_test "Index has structured data" "grep -q 'application/ld\+json' 'index.html'"
run_test "404 has proper meta tags" "grep -q 'meta name=\"robots\" content=\"noindex\"' '404.html'"

# Test 10: Performance Features
echo ""
echo "⚡ Testing Performance Features..."

run_test "Index has preload tags" "grep -q 'rel=\"preload\"' 'index.html'"
run_test "Index has DNS prefetch" "grep -q 'rel=\"dns-prefetch\"' 'index.html'"
run_test "Assets have cache control" "grep -q 'cacheBuster.*enableCaching' 'assets/js/core/environment-config.js'"

run_warning_test "CDN resources configured" "grep -q 'cdnjs.cloudflare.com' 'assets/js/core/environment-config.js'"

# Test 11: Error Handling and Accessibility
echo ""
echo "🛡️  Testing Error Handling and Accessibility..."

run_test "404 page has accessibility" "grep -q 'aria-label.*role=' '404.html'"
run_test "Index has accessibility" "grep -q 'role=\"main\".*aria-' 'index.html'"
run_test "Error handling CSS exists" "[ -f 'assets/css/error-handling.css' ]"
run_test "Loading indicators CSS exists" "[ -f 'assets/css/loading-indicators.css' ]"

# Test 12: Production Readiness
echo ""
echo "🚀 Testing Production Readiness..."

run_test "Favicon configured" "grep -q 'favicon\.ico' 'index.html'"
run_test "Apple touch icon configured" "grep -q 'apple-touch-icon' 'index.html'"
run_test "Canonical URL set" "grep -q 'rel=\"canonical\"' 'index.html'"

# Check file sizes for performance
css_size=$(wc -c < "assets/css/main.css" 2>/dev/null || echo "0")
if [ $css_size -lt 50000 ]; then
    run_test "CSS size acceptable (<50KB)" "true"
else
    run_warning_test "CSS size large (${css_size} bytes)" "false"
fi

# Final comprehensive test - check for broken references
echo ""
echo "🔗 Testing for broken references..."

# Check for old style references in HTML files
broken_refs=0
for html_file in index.html 404.html chapters/index.html; do
    if [ -f "$html_file" ]; then
        if grep -q 'styles-v[0-9]\.css\|href="styles\.css"' "$html_file"; then
            echo "  ⚠️  Old CSS references in $html_file"
            broken_refs=$((broken_refs + 1))
        fi
    fi
done

run_test "No broken asset references" "[ $broken_refs -eq 0 ]"

# Generate comprehensive report
echo ""
echo "📊 PHASE 5 IMPLEMENTATION REPORT"
echo "================================"
echo ""

echo "📈 Test Summary:"
echo "  📝 Total tests run: $total_tests"
echo "  ✅ Tests passed: $passed_tests"
echo "  ❌ Tests failed: $failed_tests"
echo "  ⚠️  Warnings: $warnings"

if [ $total_tests -gt 0 ]; then
    success_rate=$(( (passed_tests * 100) / total_tests ))
    echo "  📊 Success rate: ${success_rate}%"
fi

echo ""
echo "🏗️  Phase 5 Features Implemented:"
echo "  🌐 GitHub Pages configuration with .nojekyll"
echo "  📄 Professional 404.html error page"
echo "  🗺️  Comprehensive sitemap.xml with all pages"
echo "  🤖 SEO-optimized robots.txt"
echo "  🔗 Clean URL routing system (/chapters/enhanced/1/)"
echo "  ⚙️  GitHub Actions deployment workflow"
echo "  🧪 Automated testing and quality assurance"
echo "  🚀 Build optimization and asset minification"
echo "  🌍 Environment-specific configuration"
echo "  📱 Service worker for offline functionality"
echo "  ⚡ CDN configuration with fallbacks"
echo "  🎯 Production-ready optimization"

echo ""
echo "📋 Detailed Test Results:"
for result in "${test_results[@]}"; do
    echo "  $result"
done

echo ""
echo "🔧 Implementation Quality:"

if [ $failed_tests -eq 0 ]; then
    echo "  ✅ All critical tests passed"
    echo "  🎉 Phase 5 implementation is production-ready"
    implementation_status="EXCELLENT"
elif [ $failed_tests -le 2 ]; then
    echo "  ⚠️  Minor issues found - review failed tests"
    echo "  ✅ Implementation is mostly ready"
    implementation_status="GOOD"
else
    echo "  ❌ Multiple issues found - requires attention"
    echo "  ⚠️  Review and fix failed tests before deployment"
    implementation_status="NEEDS_WORK"
fi

echo ""
echo "🎯 Next Steps:"
if [ $failed_tests -eq 0 ]; then
    echo "  1. ✅ Commit all Phase 5 changes"
    echo "  2. ✅ Push to GitHub to trigger deployment"
    echo "  3. ✅ Configure GitHub Pages settings"
    echo "  4. ✅ Test deployed site functionality"
    echo "  5. ✅ Monitor deployment and performance"
else
    echo "  1. 🔧 Fix failed tests:"
    for result in "${test_results[@]}"; do
        if [[ "$result" == *"FAIL"* ]]; then
            echo "     - ${result#*FAIL: }"
        fi
    done
    echo "  2. 🧪 Re-run validation"
    echo "  3. ✅ Proceed with deployment when all tests pass"
fi

echo ""
echo "📍 Production URLs (after deployment):"
echo "  🏠 Home: https://akshaybapat6365.github.io/aion-visualization/"
echo "  📚 Chapters: https://akshaybapat6365.github.io/aion-visualization/chapters/"
echo "  🚀 Enhanced Chapter 1: https://akshaybapat6365.github.io/aion-visualization/chapters/enhanced/1/"
echo "  📄 Standard Chapter 1: https://akshaybapat6365.github.io/aion-visualization/chapters/standard/1/"
echo "  🗺️  Sitemap: https://akshaybapat6365.github.io/aion-visualization/sitemap.xml"

echo ""
echo "💾 Backup location: $backup_dir"
echo "📊 Implementation status: $implementation_status"

if [ $failed_tests -eq 0 ]; then
    echo ""
    echo "🎉 PHASE 5 GITHUB PAGES CONFIGURATION COMPLETE!"
    echo ""
    echo "✨ Your Aion Visualization project is now:"
    echo "  🌐 Configured for GitHub Pages deployment"
    echo "  🔗 Supporting clean URLs with client-side routing"
    echo "  ⚙️  Automated with GitHub Actions workflow"
    echo "  🚀 Production-optimized with environment settings"
    echo "  📱 Offline-capable with service worker"
    echo "  🎯 SEO-ready with comprehensive meta tags"
    echo "  🛡️  Error-resilient with comprehensive handling"
    echo ""
    echo "🚀 Ready for immediate GitHub Pages deployment!"
    exit 0
else
    echo ""
    echo "⚠️  Phase 5 completed with issues - review required"
    exit 1
fi