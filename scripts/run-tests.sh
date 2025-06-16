#!/bin/bash

# Aion Visualization Test Runner
# Runs comprehensive tests for different deployment environments

set -e

echo "🧪 Aion Visualization Test Runner"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check dependencies
check_dependencies() {
    echo "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    # Check npm packages
    REQUIRED_PACKAGES=("puppeteer" "lighthouse" "playwright" "axios" "glob")
    MISSING_PACKAGES=()
    
    for package in "${REQUIRED_PACKAGES[@]}"; do
        if ! npm list "$package" &> /dev/null; then
            MISSING_PACKAGES+=("$package")
        fi
    done
    
    if [ ${#MISSING_PACKAGES[@]} -ne 0 ]; then
        echo -e "${YELLOW}Installing missing packages: ${MISSING_PACKAGES[*]}${NC}"
        npm install "${MISSING_PACKAGES[@]}" --save-dev
    fi
    
    echo -e "${GREEN}✓ All dependencies satisfied${NC}"
    echo ""
}

# Run path migration check
check_paths() {
    echo "🔍 Checking for hardcoded paths..."
    
    # Count occurrences of /aion-visualization/
    COUNT=$(grep -r "/aion-visualization/" --include="*.html" --include="*.js" --include="*.css" --exclude-dir="node_modules" --exclude-dir="backup" --exclude-dir="test-results" . | wc -l)
    
    if [ $COUNT -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found $COUNT instances of hardcoded paths${NC}"
        echo "Run 'npm run migrate-paths' to fix them"
        echo ""
    else
        echo -e "${GREEN}✓ No hardcoded paths found${NC}"
        echo ""
    fi
}

# Quick smoke test
run_smoke_test() {
    echo "🚨 Running smoke test..."
    
    # Start local server
    echo "Starting local server..."
    python3 -m http.server 8080 &
    SERVER_PID=$!
    sleep 2
    
    # Test if server is responding
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then
        echo -e "${GREEN}✓ Local server is running${NC}"
    else
        echo -e "${RED}❌ Local server failed to start${NC}"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
    
    # Test main pages
    PAGES=("/" "/chapters/" "/visualizations.html" "/404.html")
    FAILED=0
    
    for page in "${PAGES[@]}"; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080$page")
        if [ "$STATUS" = "200" ]; then
            echo -e "  ${GREEN}✓${NC} $page - OK"
        else
            echo -e "  ${RED}❌${NC} $page - Failed (Status: $STATUS)"
            FAILED=$((FAILED + 1))
        fi
    done
    
    # Stop server
    kill $SERVER_PID 2>/dev/null
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ Smoke test passed${NC}"
    else
        echo -e "${RED}❌ Smoke test failed: $FAILED pages not accessible${NC}"
    fi
    echo ""
}

# Run comprehensive tests
run_comprehensive_tests() {
    echo "🔬 Running comprehensive test suite..."
    echo ""
    
    # Set environment variables
    export VERCEL_URL="${VERCEL_URL:-https://aion-visualization.vercel.app}"
    
    # Run tests
    node tests/comprehensive-test-suite.js
    
    echo ""
}

# Generate test report
generate_report() {
    echo "📊 Generating test report..."
    
    if [ -f "test-results/test-report.html" ]; then
        echo -e "${GREEN}✓ Test report generated: test-results/test-report.html${NC}"
        
        # Open report in browser if on macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "test-results/test-report.html"
        fi
    else
        echo -e "${RED}❌ Test report not found${NC}"
    fi
    
    echo ""
}

# Pre-deployment checklist
run_checklist() {
    echo "📋 Pre-deployment Checklist"
    echo "========================="
    echo ""
    
    CHECKS_PASSED=0
    TOTAL_CHECKS=0
    
    # Check 1: No console.log statements
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    CONSOLE_LOGS=$(grep -r "console.log" --include="*.js" --exclude-dir="node_modules" --exclude-dir="tests" --exclude-dir="scripts" . | wc -l)
    if [ $CONSOLE_LOGS -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} No console.log statements in production code"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "  ${YELLOW}⚠️${NC} Found $CONSOLE_LOGS console.log statements"
    fi
    
    # Check 2: All CSS and JS minified
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    UNMINIFIED_CSS=$(find assets/css -name "*.css" ! -name "*.min.css" 2>/dev/null | wc -l)
    UNMINIFIED_JS=$(find assets/js -name "*.js" ! -name "*.min.js" 2>/dev/null | wc -l)
    if [ $UNMINIFIED_CSS -eq 0 ] && [ $UNMINIFIED_JS -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} All assets are minified"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "  ${YELLOW}⚠️${NC} Found unminified assets (CSS: $UNMINIFIED_CSS, JS: $UNMINIFIED_JS)"
    fi
    
    # Check 3: Service worker registered
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "sw.js" ]; then
        echo -e "  ${GREEN}✓${NC} Service worker present"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "  ${RED}❌${NC} Service worker not found"
    fi
    
    # Check 4: Manifest file
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "manifest.json" ]; then
        echo -e "  ${GREEN}✓${NC} Manifest file present"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "  ${RED}❌${NC} Manifest file not found"
    fi
    
    # Check 5: 404 page
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "404.html" ]; then
        echo -e "  ${GREEN}✓${NC} 404 page present"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "  ${RED}❌${NC} 404 page not found"
    fi
    
    # Check 6: Favicon
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "assets/images/favicon.ico" ] || [ -f "favicon.ico" ]; then
        echo -e "  ${GREEN}✓${NC} Favicon present"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "  ${YELLOW}⚠️${NC} Favicon not found"
    fi
    
    # Check 7: Robots.txt
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "robots.txt" ]; then
        echo -e "  ${GREEN}✓${NC} robots.txt present"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "  ${YELLOW}⚠️${NC} robots.txt not found"
    fi
    
    # Check 8: Sitemap
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "sitemap.xml" ]; then
        echo -e "  ${GREEN}✓${NC} sitemap.xml present"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "  ${YELLOW}⚠️${NC} sitemap.xml not found"
    fi
    
    echo ""
    echo "Checklist Summary: $CHECKS_PASSED/$TOTAL_CHECKS checks passed"
    
    if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
        echo -e "${GREEN}✅ Ready for deployment!${NC}"
    else
        echo -e "${YELLOW}⚠️  Some checks need attention${NC}"
    fi
    
    echo ""
}

# Main execution
main() {
    # Parse arguments
    TEST_TYPE="${1:-all}"
    
    case $TEST_TYPE in
        "smoke")
            check_dependencies
            run_smoke_test
            ;;
        "paths")
            check_paths
            ;;
        "comprehensive")
            check_dependencies
            run_comprehensive_tests
            generate_report
            ;;
        "checklist")
            run_checklist
            ;;
        "all")
            check_dependencies
            check_paths
            run_smoke_test
            run_comprehensive_tests
            generate_report
            run_checklist
            ;;
        *)
            echo "Usage: $0 [smoke|paths|comprehensive|checklist|all]"
            echo ""
            echo "Options:"
            echo "  smoke         - Quick smoke test of main pages"
            echo "  paths         - Check for hardcoded paths"
            echo "  comprehensive - Run full test suite"
            echo "  checklist     - Run pre-deployment checklist"
            echo "  all           - Run all tests (default)"
            exit 1
            ;;
    esac
    
    echo ""
    echo "✨ Test run completed!"
}

# Run main function
main "$@"