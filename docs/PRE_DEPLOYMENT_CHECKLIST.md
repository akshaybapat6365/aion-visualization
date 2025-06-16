# Pre-Deployment Checklist for Aion Visualization

This checklist ensures the site is ready for deployment on any platform (Vercel, GitHub Pages, or custom hosting).

## 🔧 Path Configuration

- [ ] **Run path migration script** to update all hardcoded paths
  ```bash
  node scripts/migrate-paths.js
  ```

- [ ] **Include site configuration** in all HTML pages
  ```html
  <script src="/config/site-config.js"></script>
  ```

- [ ] **Verify no hardcoded `/aion-visualization/` paths remain**
  ```bash
  grep -r "/aion-visualization/" --include="*.html" --include="*.js" --include="*.css" --exclude-dir="node_modules" .
  ```

## 🧪 Testing

### 1. Local Testing
- [ ] **Run smoke tests**
  ```bash
  ./scripts/run-tests.sh smoke
  ```

- [ ] **Test all pages load without 404s**
  - Home page
  - All 14 chapters (enhanced and standard)
  - Visualizations page
  - About, Timeline, Symbols pages
  - 404 error page

- [ ] **Test all visualizations**
  - Fish Timeline
  - Shadow Integration
  - Anima/Animus Constellation
  - Gnostic Cosmology
  - Alchemical Lab
  - Aion Clock

### 2. Cross-Browser Testing
- [ ] **Chrome/Chromium** - All features work
- [ ] **Firefox** - All features work
- [ ] **Safari** - All features work
- [ ] **Edge** - All features work

### 3. Mobile Testing
- [ ] **iPhone (Safari)** - Navigation and visualizations work
- [ ] **Android (Chrome)** - Navigation and visualizations work
- [ ] **iPad/Tablet** - Layout is responsive

### 4. Performance Testing
- [ ] **Run Lighthouse audit**
  ```bash
  ./scripts/run-tests.sh comprehensive
  ```
  
- [ ] **Check scores**:
  - Performance: > 80
  - Accessibility: > 90
  - Best Practices: > 90
  - SEO: > 90

## 📦 Asset Optimization

- [ ] **All CSS files minified**
  ```bash
  find assets/css -name "*.css" ! -name "*.min.css"
  ```

- [ ] **All JS files minified**
  ```bash
  find assets/js -name "*.js" ! -name "*.min.js"
  ```

- [ ] **Images optimized**
  - Use WebP format where supported
  - Compress PNG/JPG files
  - Use appropriate sizes

- [ ] **Remove console.log statements**
  ```bash
  grep -r "console.log" --include="*.js" --exclude-dir="node_modules" --exclude-dir="tests" .
  ```

## 🌐 Platform-Specific Configuration

### For Vercel
- [ ] **vercel.json configured correctly**
  ```json
  {
    "cleanUrls": true,
    "trailingSlash": false,
    "rewrites": [
      { "source": "/(.*)", "destination": "/$1" }
    ]
  }
  ```

- [ ] **Environment variables set** (if any)
- [ ] **Custom domain configured** (if applicable)

### For GitHub Pages
- [ ] **Enable GitHub Pages** in repository settings
- [ ] **Set correct branch** (usually `main` or `gh-pages`)
- [ ] **CNAME file** for custom domain (if applicable)
- [ ] **.nojekyll file** to prevent Jekyll processing

### For Custom Hosting
- [ ] **Configure web server** for clean URLs
- [ ] **Set up SSL certificate**
- [ ] **Configure caching headers**
- [ ] **Set up CDN** (optional)

## 📄 Essential Files

- [ ] **index.html** - Main entry point
- [ ] **404.html** - Custom error page
- [ ] **manifest.json** - PWA manifest
- [ ] **sw.js** - Service worker for offline support
- [ ] **robots.txt** - Search engine directives
- [ ] **sitemap.xml** - Site structure for SEO
- [ ] **favicon.ico** - Site icon

## 🔒 Security

- [ ] **No sensitive data** in code or commits
- [ ] **API keys removed** or using environment variables
- [ ] **CORS configured** properly for external resources
- [ ] **Content Security Policy** headers set (in vercel.json or server config)

## 📊 Analytics & Monitoring

- [ ] **Google Analytics** or privacy-friendly alternative configured
- [ ] **Error tracking** set up (e.g., Sentry)
- [ ] **Performance monitoring** configured
- [ ] **Uptime monitoring** set up

## 🚀 Deployment Steps

### 1. Pre-deployment
```bash
# 1. Run all tests
./scripts/run-tests.sh all

# 2. Check for path issues
node scripts/migrate-paths.js

# 3. Build optimized assets
npm run build

# 4. Run final smoke test
./scripts/run-tests.sh smoke
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or link to GitHub for automatic deployments
vercel --prod
```

### 3. Deploy to GitHub Pages
```bash
# Ensure you're on the correct branch
git checkout main

# Push changes
git push origin main

# GitHub Pages will automatically deploy
```

### 4. Post-deployment
- [ ] **Verify live site** works correctly
- [ ] **Test all pages** on production URL
- [ ] **Check visualizations** load properly
- [ ] **Monitor error logs** for first 24 hours
- [ ] **Check analytics** are tracking

## 📱 PWA Features

- [ ] **Service Worker** registers and caches assets
- [ ] **Offline page** displays when offline
- [ ] **Add to Home Screen** works on mobile
- [ ] **App icons** display correctly

## 🔄 Rollback Plan

- [ ] **Backup current version** before deploying
- [ ] **Document rollback steps**
- [ ] **Test rollback procedure**
- [ ] **Keep previous version** accessible for 48 hours

## 📝 Documentation

- [ ] **Update README** with deployment instructions
- [ ] **Document any environment-specific configurations**
- [ ] **Update CHANGELOG** with new version
- [ ] **Tag release** in Git

## Final Verification

Run the automated checker:
```bash
./scripts/run-tests.sh checklist
```

All items should be checked before deployment. If any item fails, fix it before proceeding.

---

**Last Updated**: 2024
**Version**: 1.0.0