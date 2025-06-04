// Script to update remaining chapter files with Phase 3 enhancements
const fs = require('fs');
const path = require('path');

// List of files to update
const filesToUpdate = [
  'chapter2.html',
  'chapter3.html',
  'chapter4.html',
  'chapter6.html',
  'chapter7.html',
  'chapter8.html',
  'chapter9.html',
  'chapter10.html',
  'chapter11.html',
  'chapter12.html',
  'chapter13.html',
  'chapter14.html',
  'chapters.html',
  'timeline.html',
  'symbols.html',
  'enhanced-chapter4.html',
  'enhanced-chapter5.html',
  'enhanced-chapter6.html',
  'enhanced-chapter7.html',
  'enhanced-chapter8.html',
  'enhanced-chapter9.html',
  'enhanced-chapter10.html',
  'enhanced-chapter11.html',
  'enhanced-chapters.html'
];

// Phase 3 CSS to add
const phase3CSS = `    <!-- Phase 3 Enhancements -->
    <link rel="stylesheet" href="css/styles-v3.css">`;

// Phase 3 Scripts to add
const phase3Scripts = `    
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
    </script>`;

let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

filesToUpdate.forEach(fileName => {
  try {
    const filePath = path.join(__dirname, fileName);
        
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${fileName} - file not found`);
      skippedCount++;
      return;
    }
        
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
        
    // Check if already updated
    if (content.includes('styles-v3.css')) {
      console.log(`✓ ${fileName} already updated`);
      skippedCount++;
      return;
    }
        
    // Add Phase 3 CSS after existing stylesheets
    const cssPattern = /<link rel="stylesheet" href="styles-v2\.css">/;
    if (cssPattern.test(content)) {
      content = content.replace(cssPattern, `<link rel="stylesheet" href="styles-v2.css">\n${phase3CSS}`);
    } else {
      // Try alternative pattern
      const altCssPattern = /(<\/head>)/;
      if (altCssPattern.test(content)) {
        content = content.replace(altCssPattern, `${phase3CSS}\n$1`);
      }
    }
        
    // Add Phase 3 Scripts before closing body tag
    const bodyPattern = /(\s*<\/body>)/;
    if (bodyPattern.test(content)) {
      content = content.replace(bodyPattern, `${phase3Scripts}\n$1`);
    }
        
    // Write updated content back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${fileName}`);
    updatedCount++;
        
  } catch (error) {
    console.error(`❌ Error updating ${fileName}:`, error.message);
    errorCount++;
  }
});

console.log('\n=== Update Summary ===');
console.log(`✅ Updated: ${updatedCount} files`);
console.log(`⚠️  Skipped: ${skippedCount} files`);
console.log(`❌ Errors: ${errorCount} files`);
console.log('\nPhase 3 integration complete!');