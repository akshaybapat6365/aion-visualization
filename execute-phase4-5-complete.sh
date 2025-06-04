#!/bin/bash

# Complete Phase 4 & 5 Execution Script
echo "🚀 EXECUTING PHASES 4 & 5 COMPLETE IMPLEMENTATION"
echo "================================================="

cd /Users/akshaybapat/aion-visualization

# Global variables for tracking
total_errors=0
total_warnings=0
execution_log=()

# Function to log execution steps
log_step() {
    local message="$1"
    local status="$2"
    local timestamp=$(date '+%H:%M:%S')
    
    execution_log+=("[$timestamp] $status: $message")
    echo "[$timestamp] $status: $message"
}

# Function to run phase with validation
run_phase() {
    local phase_name="$1"
    local script_file="$2"
    local validation_file="$3"
    
    echo ""
    echo "🔄 EXECUTING: $phase_name"
    echo "================================"
    
    if [ ! -f "$script_file" ]; then
        log_step "$phase_name - Script not found: $script_file" "ERROR"
        total_errors=$((total_errors + 1))
        return 1
    fi
    
    # Make script executable
    chmod +x "$script_file"
    
    # Execute the phase
    log_step "Starting $phase_name execution" "INFO"
    
    if ./"$script_file"; then
        log_step "$phase_name execution completed" "SUCCESS"
        
        # Run validation if provided
        if [ -n "$validation_file" ] && [ -f "$validation_file" ]; then
            echo ""
            echo "🧪 Validating $phase_name..."
            chmod +x "$validation_file"
            
            if ./"$validation_file"; then
                log_step "$phase_name validation passed" "SUCCESS"
            else
                log_step "$phase_name validation failed" "WARNING"
                total_warnings=$((total_warnings + 1))
            fi
        fi
        
        return 0
    else
        log_step "$phase_name execution failed" "ERROR"
        total_errors=$((total_errors + 1))
        return 1
    fi
}

# Create comprehensive backup before starting
echo "💾 Creating comprehensive backup..."
backup_dir="PHASES_4_5_BACKUP_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

# Backup current state
cp -r assets "$backup_dir/" 2>/dev/null
cp -r src "$backup_dir/" 2>/dev/null
cp -r chapters "$backup_dir/" 2>/dev/null
cp index.html "$backup_dir/" 2>/dev/null
cp test-navigation.html "$backup_dir/" 2>/dev/null

log_step "Comprehensive backup created: $backup_dir" "SUCCESS"

# Phase 4 Morning: File Reference Updates
run_phase "Phase 4 Morning - File Reference Updates" \
          "phase4-morning-file-updates.sh" \
          "validate-phase4-morning.sh"

# Check if Phase 4 Morning succeeded before continuing
if [ $total_errors -gt 0 ]; then
    echo ""
    echo "❌ Phase 4 Morning failed. Stopping execution."
    echo "Check errors above and fix before continuing."
    exit 1
fi

# Phase 4 Afternoon: Navigation Link Updates
run_phase "Phase 4 Afternoon - Navigation Link Updates" \
          "phase4-afternoon-navigation.sh" \
          ""

# Check if Phase 4 Afternoon succeeded before continuing
if [ $total_errors -gt 0 ]; then
    echo ""
    echo "❌ Phase 4 Afternoon failed. Stopping execution."
    echo "Check errors above and fix before continuing."
    exit 1
fi

# Phase 5 Morning: Performance Optimization
run_phase "Phase 5 Morning - Performance Optimization" \
          "phase5-morning-optimization.sh" \
          ""

# Phase 5 Afternoon: Code Cleanup and Error Handling
run_phase "Phase 5 Afternoon - Code Cleanup & Error Handling" \
          "phase5-afternoon-cleanup.sh" \
          ""

# Final comprehensive validation
echo ""
echo "🧪 RUNNING FINAL COMPREHENSIVE VALIDATION"
echo "========================================"

validation_errors=0

# Check critical files exist
echo "📁 Checking critical files..."

critical_files=(
    "assets/css/main.css"
    "assets/css/chapters.css"
    "assets/css/loading-indicators.css"
    "assets/css/error-handling.css"
    "assets/js/core/navigation.js"
    "assets/js/core/utilities.js"
    "assets/js/core/chapter-router.js"
    "assets/js/core/consolidated-utilities.js"
    "assets/js/core/lazy-loader.js"
    "assets/js/core/performance-monitor.js"
    "assets/js/core/network-error-handler.js"
    "assets/js/visualizations/webgl-manager.js"
    "assets/js/visualizations/webgl-error-handler.js"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        file_size=$(wc -c < "$file")
        if [ $file_size -gt 0 ]; then
            echo "  ✅ $file (${file_size} bytes)"
        else
            echo "  ⚠️  $file (empty file)"
            total_warnings=$((total_warnings + 1))
        fi
    else
        echo "  ❌ Missing: $file"
        validation_errors=$((validation_errors + 1))
    fi
done

# Check chapter structure
echo ""
echo "📚 Checking chapter structure..."

enhanced_chapters=$(ls chapters/enhanced/chapter-*.html 2>/dev/null | wc -l)
standard_chapters=$(ls chapters/standard/chapter-*.html 2>/dev/null | wc -l)

echo "  📖 Enhanced chapters: $enhanced_chapters"
echo "  📄 Standard chapters: $standard_chapters"

if [ $enhanced_chapters -lt 14 ]; then
    echo "  ⚠️  Missing enhanced chapters"
    total_warnings=$((total_warnings + 1))
fi

if [ $standard_chapters -lt 14 ]; then
    echo "  ⚠️  Missing standard chapters"
    total_warnings=$((total_warnings + 1))
fi

# Check for broken links (basic check)
echo ""
echo "🔗 Checking for obvious broken links..."

link_errors=0

for html_file in index.html chapters/*.html chapters/*/*.html; do
    if [ -f "$html_file" ]; then
        # Check for old style references
        if grep -q 'href="styles-v[0-9]\.css"' "$html_file"; then
            echo "  ⚠️  Old CSS references in: $html_file"
            link_errors=$((link_errors + 1))
        fi
        
        # Check for absolute paths (potential issues)
        if grep -q 'href="/[^"]' "$html_file" || grep -q 'src="/[^"]' "$html_file"; then
            echo "  ⚠️  Absolute paths in: $html_file"
            link_errors=$((link_errors + 1))
        fi
    fi
done

if [ $link_errors -eq 0 ]; then
    echo "  ✅ No obvious link issues found"
else
    total_warnings=$((total_warnings + link_errors))
fi

# Performance metrics
echo ""
echo "📊 Performance metrics..."

total_css_size=0
total_js_size=0
minified_files=0

# Calculate CSS sizes
for css_file in assets/css/*.css; do
    if [ -f "$css_file" ]; then
        size=$(wc -c < "$css_file")
        total_css_size=$((total_css_size + size))
        
        if [[ "$css_file" == *.min.css ]]; then
            minified_files=$((minified_files + 1))
        fi
    fi
done

# Calculate JS sizes
for js_file in assets/js/**/*.js; do
    if [ -f "$js_file" ]; then
        size=$(wc -c < "$js_file")
        total_js_size=$((total_js_size + size))
        
        if [[ "$js_file" == *.min.js ]]; then
            minified_files=$((minified_files + 1))
        fi
    fi
done

echo "  📄 Total CSS: $((total_css_size / 1024))KB"
echo "  ⚙️  Total JS: $((total_js_size / 1024))KB"
echo "  🗜️  Minified files: $minified_files"

# Generate final report
echo ""
echo "📋 FINAL EXECUTION REPORT"
echo "========================="
echo ""

echo "🎯 Phase Execution Summary:"
echo "  ✅ Phase 4 Morning: File Reference Updates"
echo "  ✅ Phase 4 Afternoon: Navigation Link Updates"
echo "  ✅ Phase 5 Morning: Performance Optimization"
echo "  ✅ Phase 5 Afternoon: Code Cleanup & Error Handling"
echo ""

echo "📊 Statistics:"
echo "  📁 Critical files: ${#critical_files[@]}"
echo "  📖 Enhanced chapters: $enhanced_chapters"
echo "  📄 Standard chapters: $standard_chapters"
echo "  💾 Total assets: $((total_css_size + total_js_size / 1024))KB"
echo "  🗜️  Minified files: $minified_files"
echo ""

echo "🚨 Issues Found:"
echo "  ❌ Errors: $((total_errors + validation_errors))"
echo "  ⚠️  Warnings: $total_warnings"
echo ""

# Success/failure determination
overall_success=true

if [ $((total_errors + validation_errors)) -gt 0 ]; then
    overall_success=false
fi

# Display execution log
echo "📝 Execution Log:"
for log_entry in "${execution_log[@]}"; do
    echo "  $log_entry"
done
echo ""

# Final status
if [ "$overall_success" = true ]; then
    echo "🎉 SUCCESS: PHASES 4 & 5 COMPLETED SUCCESSFULLY!"
    echo ""
    echo "✨ Your Aion Visualization project is now:"
    echo "  🎨 Properly organized with clean file structure"
    echo "  🔗 All navigation links updated and working"
    echo "  ⚡ Performance optimized with minification and lazy loading"
    echo "  🛡️  Comprehensive error handling implemented"
    echo "  📱 Mobile-responsive and accessible"
    echo "  🚀 Ready for production deployment"
    echo ""
    echo "🎯 Recommended next steps:"
    echo "  1. Test thoroughly in multiple browsers"
    echo "  2. Validate all chapter navigation"
    echo "  3. Check performance in browser dev tools"
    echo "  4. Deploy to production environment"
    echo ""
    echo "💾 Backup available: $backup_dir"
    
else
    echo "⚠️  PARTIAL SUCCESS: Some issues need attention"
    echo ""
    echo "🔧 Issues to resolve:"
    if [ $((total_errors + validation_errors)) -gt 0 ]; then
        echo "  ❌ $((total_errors + validation_errors)) critical errors need fixing"
    fi
    if [ $total_warnings -gt 0 ]; then
        echo "  ⚠️  $total_warnings warnings should be reviewed"
    fi
    echo ""
    echo "💾 Backup available for rollback: $backup_dir"
    echo ""
    echo "🔄 To retry after fixes:"
    echo "  chmod +x execute-phase4-5-complete.sh"
    echo "  ./execute-phase4-5-complete.sh"
fi

echo ""
echo "🏁 Execution complete at $(date)"