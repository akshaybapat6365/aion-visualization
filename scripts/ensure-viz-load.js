// Ensure visualizations load properly
window.vizInitQueue = window.vizInitQueue || [];

// Helper function to safely initialize visualizations
window.initializeVisualization = function(vizFunction) {
    if (document.readyState === 'loading') {
        window.vizInitQueue.push(vizFunction);
    } else {
        // DOM is ready, execute immediately
        try {
            vizFunction();
        } catch (e) {
            console.error('Visualization initialization error:', e);
        }
    }
};

// Process queued visualizations when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Processing', window.vizInitQueue.length, 'queued visualizations');
    window.vizInitQueue.forEach(function(vizFunction) {
        try {
            vizFunction();
        } catch (e) {
            console.error('Visualization initialization error:', e);
        }
    });
    window.vizInitQueue = [];
});

// Also handle visualizations added after DOMContentLoaded
if (document.readyState !== 'loading') {
    // Process any already queued
    if (window.vizInitQueue && window.vizInitQueue.length > 0) {
        window.vizInitQueue.forEach(function(vizFunction) {
            try {
                vizFunction();
            } catch (e) {
                console.error('Visualization initialization error:', e);
            }
        });
        window.vizInitQueue = [];
    }
}