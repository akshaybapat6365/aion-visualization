# Phase 3 Day 3 Afternoon Commands

## Execute Standard Chapter Creation

Run this command to create all standard chapter versions:

```bash
cd /Users/akshaybapat/aion-visualization
chmod +x create-standard-chapters.sh
./create-standard-chapters.sh
```

## What This Does

1. **Creates** `chapters/standard/` directory structure
2. **Generates** 14 clean, standard chapter files (chapter-1.html through chapter-14.html)
3. **Removes** Phase 3 enhancements to create basic versions
4. **Updates** all asset paths to new directory structure:
   - CSS: `../../assets/css/main.css`
   - JS: `../../assets/js/core/navigation.js`
5. **Creates** standard chapters index page
6. **Uses** consistent naming convention

## Standard vs Enhanced Chapters

**Standard Chapters** (`chapters/standard/`):
- Clean, basic HTML structure
- Simple visualizations
- Core content without advanced features
- Faster loading, better compatibility

**Enhanced Chapters** (`chapters/enhanced/`):
- Advanced Phase 3 features
- Complex visualizations
- Interactive elements
- Modern web technologies

## After Running

Check that all standard chapters are created:
```bash
ls -la chapters/standard/
```

## Directory Structure After Completion

```
chapters/
├── standard/
│   ├── index.html          # Standard chapters index
│   ├── chapter-1.html      # The Ego (standard)
│   ├── chapter-2.html      # The Shadow (standard)
│   ├── ...
│   └── chapter-14.html     # Completion (standard)
└── enhanced/
    ├── chapter-1.html      # The Ego (enhanced)
    ├── chapter-2.html      # The Shadow (enhanced)
    ├── ...
    └── chapter-14.html     # Completion (enhanced)
```

## Next Steps

After creating standard chapters:
1. Clean up src/ directory
2. Update main navigation to include both standard/enhanced options
3. Test both chapter sets
4. Remove duplicate files

## Manual Alternative

If the script doesn't work:

```bash
# Create directory
mkdir -p chapters/standard

# Create basic chapter template and customize for each chapter
# This would require manual creation of 14 files with proper content
```

🎯 **This completes the standard chapter organization for Phase 3!**