# GitHub Commit and Pull Request Commands

## Manual Commands to Execute

Run these commands in your terminal in the `/Users/akshaybapat/aion-visualization` directory:

### 1. Initialize Git and Create Branch
```bash
cd /Users/akshaybapat/aion-visualization

# Initialize git if needed
git init

# Create and checkout new branch
git checkout -b phase1-asset-consolidation
```

### 2. Add Files to Git
```bash
# Add new organized directories
git add assets/
git add chapters/
git add tests/
git add scripts/

# Add documentation files
git add PHASE1_COMMIT_MESSAGE.txt
git add WEBSITE_FIX_IMPROVEMENT_PLAN_V2.md
git add GITHUB_COMMIT_COMMANDS.md
```

### 3. Create Commit
```bash
# Create commit with detailed message
git commit -m "Phase 1: Asset Consolidation and Cleanup

- Create organized directory structure (assets/, chapters/, tests/, scripts/)
- Consolidate CSS files into main.css and chapters.css with design tokens
- Consolidate JavaScript into modular core and visualization files
- Implement advanced WebGL context management with memory optimization
- Add unified navigation system with theme support and responsiveness
- Include comprehensive utilities and error handling
- Establish museum-quality design system with accessibility features

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 4. Push to GitHub
```bash
# Set remote origin if needed (replace with your actual GitHub repo URL)
git remote add origin https://github.com/yourusername/aion-visualization.git

# Push branch to GitHub
git push -u origin phase1-asset-consolidation
```

### 5. Create Pull Request
```bash
# Using GitHub CLI (if installed)
gh pr create --title "Phase 1: Asset Consolidation and Cleanup" --body "$(cat PHASE1_COMMIT_MESSAGE.txt)"
```

### Alternative: Create PR via GitHub Web Interface
1. Go to your GitHub repository
2. Click "Compare & pull request" for the `phase1-asset-consolidation` branch
3. Use the title: **Phase 1: Asset Consolidation and Cleanup**
4. Copy the content from `PHASE1_COMMIT_MESSAGE.txt` as the description

## What Was Accomplished in Phase 1

### ✅ New Directory Structure
```
aion-visualization/
├── assets/
│   ├── css/
│   │   ├── main.css (consolidated design system)
│   │   └── chapters.css (chapter-specific styles)
│   └── js/
│       ├── core/
│       │   ├── navigation.js (unified navigation)
│       │   └── utilities.js (common helpers)
│       └── visualizations/
│           └── webgl-manager.js (WebGL optimization)
├── chapters/
│   ├── standard/ (for original chapters)
│   └── enhanced/ (for enhanced chapters)
├── tests/ (testing infrastructure)
└── scripts/ (build and deployment scripts)
```

### ✅ Key Improvements
- **Museum-quality design system** with consistent typography and spacing
- **Advanced WebGL management** with memory optimization and context pooling
- **Unified navigation system** with theme support and mobile responsiveness
- **Comprehensive utilities** for animations, error handling, and common functions
- **Accessibility enhancements** with proper focus states and reduced motion support
- **Performance optimizations** with device detection and adaptive rendering

This establishes a solid foundation for the remaining phases of the website fix and improvement plan.