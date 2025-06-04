# Phase 3 Day 3 Morning Commands

## Execute the Chapter Migration

Run this command to move all enhanced chapters to their proper location:

```bash
cd /Users/akshaybapat/aion-visualization
chmod +x move-enhanced-chapters.sh
./move-enhanced-chapters.sh
```

## What This Does

1. **Creates** `chapters/enhanced/` directory structure
2. **Moves** all chapter files from `src/chapter*.html` to `chapters/enhanced/chapter-*.html`
3. **Renames** files to consistent format (chapter-1.html instead of chapter1.html)
4. **Updates** all asset paths to reflect new structure:
   - CSS: `../../assets/css/main.css`
   - JS: `../../assets/js/core/navigation.js`
   - Links: Updated to new chapter format

## After Running

Check that all chapters are properly moved:
```bash
ls -la chapters/enhanced/
```

## Next Steps

After the script completes, we'll:
1. Remove the old chapter files from src/
2. Update the navigation system to use new paths
3. Test that all chapters load correctly

## Manual Alternative

If the script doesn't work, run these commands:

```bash
# Create directory
mkdir -p chapters/enhanced

# Move each chapter
for i in {1..14}; do
  cp src/chapter$i.html chapters/enhanced/chapter-$i.html
done

# Update paths in each file
cd chapters/enhanced
for file in chapter-*.html; do
  # Update CSS paths
  sed -i '' 's|styles-v3.css|../../assets/css/main.css|g' "$file"
  sed -i '' 's|styles.css|../../assets/css/main.css|g' "$file"
  
  # Update JS paths  
  sed -i '' 's|navigation.js|../../assets/js/core/navigation.js|g' "$file"
  
  # Update chapter links
  sed -i '' 's|chapter\([0-9]\+\).html|chapter-\1.html|g' "$file"
done
```