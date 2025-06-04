# Manual Conflict Resolution Steps

The conflicts are in `index.html` and `enhanced-chapter11.html`. Here's how to resolve them manually:

## Step-by-Step Manual Resolution

### 1. Switch to the branch and start merge
```bash
cd /Users/akshaybapat/aion-visualization
git checkout phase2-navigation-system-fix
git fetch origin main
git merge origin/main
```

This will show conflicts. Git will tell you which files have conflicts.

### 2. Resolve index.html conflict
```bash
# Keep our Phase 2 version of index.html (it has consolidated assets)
git checkout --ours index.html
git add index.html
```

**Why keep our version?** Our Phase 2 index.html has:
- Consolidated asset paths (`assets/css/main.css`, `assets/js/core/navigation.js`)
- Modern responsive design
- Enhanced navigation integration
- Performance optimizations

### 3. Resolve enhanced-chapter11.html conflict
```bash
# If this is a Phase 2 file, keep ours:
git checkout --ours enhanced-chapter11.html
git add enhanced-chapter11.html

# OR if it's from main branch and we don't have it, take theirs:
# git checkout --theirs enhanced-chapter11.html
# git add enhanced-chapter11.html
```

### 4. Check for other conflicts
```bash
git status
```

If there are other conflicts, resolve them by keeping our Phase 2 versions:
```bash
git checkout --ours <filename>
git add <filename>
```

### 5. Commit the resolution
```bash
git commit -m "Resolve conflicts: Keep Phase 2 modernized files

- index.html: Keep Phase 2 version with consolidated assets
- enhanced-chapter11.html: Resolved appropriately
- Maintain all Phase 2 navigation improvements"
```

### 6. Push the resolved version
```bash
git push origin phase2-navigation-system-fix
```

## Quick Commands (All at once)

If you want to run everything quickly:

```bash
cd /Users/akshaybapat/aion-visualization
git checkout phase2-navigation-system-fix
git fetch origin main
git merge origin/main || true
git checkout --ours index.html
git checkout --ours enhanced-chapter11.html 2>/dev/null || git checkout --theirs enhanced-chapter11.html
git add .
git commit -m "Resolve conflicts: Keep Phase 2 modernized index.html"
git push origin phase2-navigation-system-fix
```

## Alternative: Use the Scripts

### Option 1: Comprehensive fix
```bash
chmod +x FIX_SPECIFIC_CONFLICTS.sh
./FIX_SPECIFIC_CONFLICTS.sh
```

### Option 2: Simple fix
```bash
chmod +x SIMPLE_CONFLICT_FIX.sh
./SIMPLE_CONFLICT_FIX.sh
```

## What This Will Do

✅ **Keep Phase 2 index.html** - Modern design with consolidated assets
✅ **Resolve enhanced-chapter11.html** - Handle appropriately based on what exists
✅ **Preserve navigation system** - All Phase 2 improvements intact
✅ **Merge main changes** - Get latest updates from main branch
✅ **Push resolved version** - Update PR #55 to be mergeable

## After Resolution

Once conflicts are resolved and pushed:
1. Go to PR #55 on GitHub
2. Refresh the page
3. The "conflicts must be resolved" message should disappear
4. PR should show "Ready to merge"
5. You can then merge the PR

The key is keeping our Phase 2 `index.html` because it's completely modernized with the new asset structure that supports all our navigation improvements.