# Deployment Guide for Aion Visualization

This guide explains how to deploy the Aion Visualization project to different platforms and fix path-related issues.

## 🚀 Quick Start for Vercel Deployment

If you need to quickly deploy to Vercel:

```bash
# 1. Fix all hardcoded paths
npm run quick-fix

# 2. Run smoke tests
npm run test:smoke

# 3. Deploy to Vercel
npm run deploy:vercel
```

## 📋 Complete Deployment Process

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Fix Path Issues

The project was originally configured for GitHub Pages with `/aion-visualization/` prefix. To deploy elsewhere:

```bash
# Option 1: Quick fix for immediate deployment
npm run quick-fix

# Option 2: Comprehensive path migration (recommended)
npm run migrate-paths
```

### Step 3: Run Tests

```bash
# Quick smoke test
npm run test:smoke

# Comprehensive test suite
npm run test:comprehensive

# Pre-deployment checklist
npm run test:checklist

# Run all tests
npm run test:all
```

### Step 4: Deploy

#### Deploy to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel

# Or deploy to production
npm run deploy:vercel
```

#### Deploy to GitHub Pages

1. Push to your GitHub repository
2. Go to Settings → Pages
3. Select source branch (usually `main`)
4. Site will be available at `https://[username].github.io/aion-visualization/`

#### Deploy to Custom Hosting

1. Build the project:
   ```bash
   npm run optimize
   ```

2. Upload all files to your web server

3. Configure your web server for:
   - Clean URLs (remove .html extensions)
   - Custom 404 page
   - Proper MIME types for JavaScript modules

## 🔧 Configuration System

The project includes a dynamic configuration system that automatically detects the deployment environment:

### Site Configuration (`/config/site-config.js`)

- Automatically detects if running on localhost, GitHub Pages, or Vercel
- Updates all paths dynamically
- No manual configuration needed

### Environment Detection

The system detects environments based on:
- `localhost` or `127.0.0.1` → Development
- `github.io` → GitHub Pages (uses `/aion-visualization/` prefix)
- `vercel.app` → Vercel (uses root `/`)
- Other domains → Production (uses root `/`)

### Manual Override

You can force a specific base URL:

```html
<!-- In your HTML -->
<meta name="base-url" content="/custom-path/">
```

Or in JavaScript:
```javascript
window.FORCE_BASE_URL = '/custom-path/';
```

## 🧪 Testing Suite

### Test Commands

- `npm run test:smoke` - Quick test of main pages
- `npm run test:comprehensive` - Full test suite including:
  - Navigation tests
  - Visualization tests
  - Asset loading tests
  - Performance tests
  - Cross-browser tests
  - Mobile responsiveness
- `npm run test:checklist` - Pre-deployment checklist
- `npm run test:all` - Run all tests

### Test Reports

Test results are saved to:
- `test-results/comprehensive-test-results.json` - JSON report
- `test-results/test-report.html` - HTML report
- `test-results/screenshots/` - Visual test screenshots
- `test-results/responsive/` - Responsive design screenshots

## 🐛 Troubleshooting

### Common Issues

1. **404 errors on Vercel**
   - Run `npm run quick-fix` to update paths
   - Check `vercel.json` configuration

2. **Visualizations not loading**
   - Check browser console for WebGL errors
   - Ensure Three.js and D3.js are loading from CDN
   - Test WebGL support: visit chrome://gpu

3. **Paths still showing /aion-visualization/**
   - Run `npm run migrate-paths`
   - Clear browser cache
   - Check for hardcoded paths in JavaScript strings

4. **Service Worker issues**
   - Clear browser cache and service worker
   - Check sw.js is accessible at root
   - Verify manifest.json paths

### Debug Mode

Enable debug mode to see configuration details:

```javascript
// In browser console
siteConfig.debug();
```

## 📁 Project Structure

```
aion-visualization/
├── config/
│   └── site-config.js         # Dynamic path configuration
├── scripts/
│   ├── migrate-paths.js       # Comprehensive path migration
│   ├── quick-path-fix.js      # Quick path fixes
│   └── run-tests.sh           # Test runner
├── tests/
│   └── comprehensive-test-suite.js  # Full test suite
├── assets/                    # CSS, JS, images
├── chapters/                  # Chapter HTML files
│   ├── enhanced/             # Enhanced visualizations
│   └── standard/             # Standard chapters
├── src/                      # Source files and visualizations
├── index.html                # Main entry point
├── 404.html                  # Error page
├── manifest.json             # PWA manifest
├── sw.js                     # Service worker
└── vercel.json              # Vercel configuration
```

## 🔄 Continuous Deployment

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:smoke
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📊 Performance Optimization

Before deployment:

1. **Minify assets**: All CSS/JS should have `.min` versions
2. **Optimize images**: Use WebP format, compress PNGs
3. **Enable caching**: Configure in `vercel.json` or server
4. **Use CDN**: External libraries load from CDN with fallbacks

## 🔐 Security Checklist

- [ ] Remove all `console.log` statements
- [ ] No API keys or secrets in code
- [ ] HTTPS enabled
- [ ] Content Security Policy configured
- [ ] CORS properly configured

## 📱 PWA Features

The site includes Progressive Web App features:
- Offline support via Service Worker
- Add to Home Screen capability
- App manifest with icons
- Cache-first strategy for assets

## 🆘 Getting Help

1. Check test reports in `test-results/`
2. Enable debug mode: `siteConfig.debug()`
3. Check browser console for errors
4. Review pre-deployment checklist

## 📝 Version History

- v1.0.0 - Initial release with GitHub Pages support
- v2.0.0 - Added multi-platform support with dynamic configuration

---

For more details, see:
- [Pre-deployment Checklist](./PRE_DEPLOYMENT_CHECKLIST.md)
- [Path Migration Report](../path-migration-report.json) (after running migration)
- [Test Results](../test-results/test-report.html) (after running tests)