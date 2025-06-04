# Manual Update Instructions for Phase 3 Integration

Since automated scripts are encountering shell issues, here are the manual steps to ensure all pages include Phase 3 enhancements.

## Critical Pages to Update

### 1. Main Index Page
**File:** `index.html`
**Status:** Already updated ✓

### 2. V2 Chapter Pages (Primary Focus)
These are the main chapter pages that users will interact with:

- `chapter1-v2.html`
- `chapter2-v2.html`
- `chapter3-v2.html`
- `chapter4-v2.html`
- `chapter5-v2.html` (Already updated ✓)
- `chapter6-v2.html`
- `chapter7-v2.html`
- `chapter8-v2.html`
- `chapter9-v2.html`
- `chapter10-v2.html`
- `chapter11-v2.html`
- `chapter12-v2.html`
- `chapter13-v2.html`
- `chapter14-v2.html`

### 3. Enhanced Chapter Pages
- `enhanced-chapter4.html`
- `enhanced-chapter5.html`
- `enhanced-chapter6.html`
- `enhanced-chapter7.html`
- `enhanced-chapter8.html`
- `enhanced-chapter9.html`
- `enhanced-chapter10.html`
- `enhanced-chapter11.html`

### 4. Navigation Pages
- `chapters-v2.html`
- `timeline-v2.html`
- `symbols-v2.html`
- `enhanced-chapters.html`

## What to Add to Each Page

Add the following before the closing `</head>` tag:

```html
<!-- Phase 3 Enhancements -->
<link rel="stylesheet" href="css/styles-v3.css">
```

Add the following before the closing `</body>` tag:

```html
<!-- Phase 3 Scripts -->
<script src="js/advanced-animations.js"></script>
<script src="js/gesture-controller.js"></script>
<script src="js/contextual-help.js"></script>
<script src="js/keyboard-shortcuts.js"></script>
<script src="js/smart-asset-loader.js"></script>
<script src="js/adaptive-quality.js"></script>
<script src="js/learning-analytics.js"></script>
<script src="js/production-error-handler.js"></script>

<script>
// Initialize Phase 3 features
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize production error handler
    window.errorHandler = new ProductionErrorHandler();
    
    // Initialize adaptive quality
    window.adaptiveQuality = new AdaptiveQuality();
    
    // Initialize gesture controller for touch devices
    if ('ontouchstart' in window) {
        window.gestureController = new GestureController(document.body);
    }
    
    // Initialize keyboard shortcuts
    window.keyboardShortcuts = new KeyboardShortcuts();
    
    // Initialize contextual help
    window.contextualHelp = new ContextualHelp();
    
    // Initialize advanced animations
    window.advancedAnimations = new AdvancedAnimations();
    
    // Initialize smart asset loader
    window.assetLoader = new SmartAssetLoader();
    
    // Initialize learning analytics
    window.learningAnalytics = new LearningAnalytics();
    
    // Track page view
    if (window.learningAnalytics) {
        window.learningAnalytics.trackPageView();
    }
});
</script>
```

## Quick Check Command

To verify which files still need updating, you can search for files that don't contain "styles-v3.css":

```bash
# Find HTML files that don't include Phase 3 CSS
grep -L "styles-v3.css" *.html */*.html
```

## Priority Order

1. **First Priority:** Update all `chapter*-v2.html` files (main user-facing pages)
2. **Second Priority:** Update all `enhanced-chapter*.html` files
3. **Third Priority:** Update navigation pages (`chapters-v2.html`, `timeline-v2.html`, etc.)

## Verification

After updates, test by:
1. Opening any updated page
2. Press `?` to see keyboard shortcuts
3. Check browser console for no errors
4. Verify smooth animations and transitions