# Deployment Guide

## Essential Files Only

This project has been stripped down to essentials for reliable deployment.

### What's Included

1. **Core Site**
   - `index.html` - Main landing page
   - `chapters/` - All 14 chapters in standard and enhanced versions
   - `assets/` - CSS and JS bundles
   - `manifest.json` - Basic PWA manifest
   - `offline.html` - Simple offline fallback
   - `sw.js` - Service worker for caching

2. **Navigation**
   - Keyboard shortcuts: 1-9 for chapters, Esc for home
   - All chapter links fixed to use correct paths
   - Mobile responsive design

3. **Testing**
   - `test.html` - Quick functionality check

### Deployment Steps

1. Commit all changes
2. Push to GitHub
3. Merge PR to main branch
4. Site deploys automatically via GitHub Pages

### URLs

- Live site: https://akshaybapat6365.github.io/aion-visualization/
- Test page: https://akshaybapat6365.github.io/aion-visualization/test.html
- Chapters: https://akshaybapat6365.github.io/aion-visualization/chapters/

### Verify Deployment

1. Visit test.html
2. Check all green checkmarks
3. Test keyboard navigation
4. Try offline mode

That's it. Simple, functional, fast.