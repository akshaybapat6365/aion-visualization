// Script to update all HTML pages with Phase 3 enhancements
// This ensures all pages have the new scripts and styles

const fs = require('fs').promises;
const path = require('path');

async function updateAllPages() {
    console.log('📄 Updating all HTML pages with Phase 3 enhancements...');
    
    // Phase 3 scripts to add
    const phase3Scripts = [
        '<script src="advanced-animations.js"></script>',
        '<script src="gesture-controller.js"></script>',
        '<script src="contextual-help.js"></script>',
        '<script src="keyboard-shortcuts.js"></script>',
        '<script src="smart-asset-loader.js"></script>',
        '<script src="adaptive-quality.js"></script>',
        '<script src="learning-analytics.js"></script>',
        '<script src="production-error-handler.js"></script>',
        '<script src="apply-visual-polish.js"></script>'
    ];
    
    // Phase 3 styles to add
    const phase3Styles = [
        '<link rel="stylesheet" href="styles-v3.css">'
    ];
    
    // Initialization script
    const initScript = `
    <script>
        // Initialize Phase 3 systems
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize gesture controls for visualizations
            const visualizations = document.querySelectorAll('.visualization-container, canvas');
            visualizations.forEach(viz => {
                if (viz.tagName === 'CANVAS') {
                    new GestureController(viz);
                }
            });
            
            // Initialize contextual help
            const contextualHelp = new ContextualHelp({
                enabled: true,
                sensitivity: 'medium'
            });
            
            // Initialize adaptive quality
            const adaptiveQuality = new AdaptiveQuality({
                enableAutoAdjust: true,
                targetFPS: 60
            });
            
            // Initialize learning analytics
            const learningAnalytics = new LearningAnalytics({
                enableTracking: true,
                privacyLevel: 'balanced'
            });
            
            // Initialize error handler
            const errorHandler = new ProductionErrorHandler({
                enableMonitoring: true,
                enableRecovery: true
            });
            
            // Track chapter visit
            const chapterMatch = window.location.pathname.match(/chapter(\\d+)/);
            if (chapterMatch) {
                learningAnalytics.trackEvent('chapter-visit', {
                    chapterId: parseInt(chapterMatch[1]),
                    enhanced: window.location.pathname.includes('enhanced')
                });
            }
            
            console.log('Phase 3 systems initialized for', window.location.pathname);
        });
    </script>
`;
    
    // HTML files to update
    const htmlFiles = [
        'chapters.html',
        'enhanced-chapters.html',
        'timeline.html',
        'symbols.html',
        'about.html',
        // Regular chapters
        ...Array.from({ length: 14 }, (_, i) => `chapter${i + 1}.html`),
        // Enhanced chapters
        ...Array.from({ length: 8 }, (_, i) => `enhanced-chapter${i + 4}.html`)
    ];
    
    let updatedCount = 0;
    
    for (const file of htmlFiles) {
        try {
            const filePath = path.join('/Users/akshaybapat/aion-visualization', file);
            let content = await fs.readFile(filePath, 'utf8');
            let updated = false;
            
            // Check if styles-v3.css is already included
            if (!content.includes('styles-v3.css')) {
                // Add after styles-v2.css
                content = content.replace(
                    '<link rel="stylesheet" href="styles-v2.css">',
                    '<link rel="stylesheet" href="styles-v2.css">\n    ' + phase3Styles[0]
                );
                updated = true;
            }
            
            // Check if Phase 3 scripts are included
            const missingScripts = phase3Scripts.filter(script => 
                !content.includes(script.match(/src="([^"]+)"/)[1])
            );
            
            if (missingScripts.length > 0) {
                // Add before closing body tag
                const scriptsToAdd = missingScripts.join('\n    ');
                content = content.replace(
                    '</body>',
                    `    ${scriptsToAdd}\n    ${initScript}\n</body>`
                );
                updated = true;
            }
            
            // Save updated file
            if (updated) {
                await fs.writeFile(filePath, content);
                updatedCount++;
                console.log(`✅ Updated ${file}`);
            } else {
                console.log(`⏭️  ${file} already up to date`);
            }
            
        } catch (error) {
            console.error(`❌ Error updating ${file}:`, error.message);
        }
    }
    
    console.log(`\n✨ Updated ${updatedCount} files with Phase 3 enhancements`);
}

// Run the update
updateAllPages().catch(console.error);

// Export for use in build process
module.exports = updateAllPages;