#!/bin/bash
git add visualizations.html
git add src/core/simple-viz-loader.js
git add quick-performance-fix.sh
git add index-performance-patch.html
git add VISUALIZATION_INTEGRATION_PLAN.md
git add IMMEDIATE_PERFORMANCE_FIXES.md

git commit -m "perf: Add visualization index and performance optimizations

- Create dedicated visualizations.html index page
- Add simple visualization loader for dynamic imports
- Document performance optimization strategy
- Prepare for async CSS loading and resource hints

This improves initial page load performance and provides
easy access to all interactive visualizations."
