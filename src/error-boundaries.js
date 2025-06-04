// Error Boundaries and Fallback System for Aion Visualization
// Provides graceful degradation when visualizations fail

class VisualizationErrorBoundary {
    constructor(container) {
        this.container = container;
        this.originalContent = container.innerHTML;
        this.setupErrorHandling();
    }
    
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', this.handleError.bind(this));
        window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
        
        // WebGL context lost handler
        if (this.container.querySelector('canvas')) {
            const canvas = this.container.querySelector('canvas');
            canvas.addEventListener('webglcontextlost', this.handleWebGLLoss.bind(this));
        }
    }
    
    handleError(event) {
        const error = event.error;
        const severity = this.categorizeError(error);
        
        this.logError(error, 'window_error', severity);
        
        if (severity === 'critical' || severity === 'high') {
            this.showFallbackUI(error);
        }
    }
    
    handleRejection(event) {
        const error = event.reason;
        const severity = this.categorizeError(error);
        
        this.logError(error, 'unhandled_rejection', severity);
        
        if (severity === 'critical') {
            this.showFallbackUI(error);
        }
    }
    
    handleWebGLLoss(event) {
        event.preventDefault();
        this.showWebGLFallback();
    }
    
    categorizeError(error) {
        if (!error) return 'low';
        
        const errorString = error.toString().toLowerCase();
        
        // Critical errors that break the visualization
        if (errorString.includes('webgl') || 
            errorString.includes('three') ||
            errorString.includes('shader') ||
            errorString.includes('context')) {
            return 'critical';
        }
        
        // High priority errors that affect functionality
        if (errorString.includes('network') ||
            errorString.includes('fetch') ||
            errorString.includes('timeout')) {
            return 'high';
        }
        
        // Medium priority errors
        if (errorString.includes('reference') ||
            errorString.includes('undefined')) {
            return 'medium';
        }
        
        return 'low';
    }
    
    logError(error, context, severity) {
        const errorInfo = {
            message: error.message || 'Unknown error',
            stack: error.stack || 'No stack trace',
            context: context,
            severity: severity,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Only log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error('Aion Visualization Error:', errorInfo);
        }
        
        // In production, could send to error tracking service
        // this.sendToErrorService(errorInfo);
    }
    
    showFallbackUI(error) {
        const fallbackHTML = `
            <div class="visualization-error">
                <div class="error-icon">⚠️</div>
                <h3>Visualization Unavailable</h3>
                <p>This interactive experience requires modern browser features that aren't currently available.</p>
                <div class="error-suggestions">
                    <h4>Try these solutions:</h4>
                    <ul>
                        <li>Update your browser to the latest version</li>
                        <li>Enable JavaScript if it's disabled</li>
                        <li>Try using Chrome, Firefox, or Safari</li>
                        <li>Refresh the page to retry</li>
                    </ul>
                </div>
                <div class="error-actions">
                    <button onclick="location.reload()" class="retry-button">Try Again</button>
                    <button onclick="this.closest('.visualization-error').style.display='none'" class="dismiss-button">Dismiss</button>
                </div>
                <details class="error-details">
                    <summary>Technical Details</summary>
                    <pre>${error ? error.message : 'Unknown error occurred'}</pre>
                </details>
            </div>
        `;
        
        this.container.innerHTML = fallbackHTML;
        this.addErrorStyles();
    }
    
    showWebGLFallback() {
        const fallbackHTML = `
            <div class="webgl-fallback">
                <div class="fallback-icon">🎨</div>
                <h3>3D Visualization Not Supported</h3>
                <p>Your browser or device doesn't support WebGL, which is required for 3D visualizations.</p>
                <div class="fallback-content">
                    <h4>Alternative Experience:</h4>
                    <p>While you can't see the interactive 3D visualization, you can still explore the concepts through:</p>
                    <ul>
                        <li>The educational content below</li>
                        <li>Static diagrams and explanations</li>
                        <li>Other chapters that don't require 3D</li>
                    </ul>
                </div>
                <div class="fallback-actions">
                    <a href="timeline.html" class="fallback-link">Explore Timeline</a>
                    <a href="symbols.html" class="fallback-link">Browse Symbols</a>
                    <a href="chapters.html" class="fallback-link">All Chapters</a>
                </div>
            </div>
        `;
        
        this.container.innerHTML = fallbackHTML;
        this.addErrorStyles();
    }
    
    addErrorStyles() {
        if (document.getElementById('error-boundary-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'error-boundary-styles';
        styles.textContent = `
            .visualization-error,
            .webgl-fallback {
                background: var(--surface-secondary, #1a1a1a);
                border: 1px solid var(--border-default, #333);
                border-radius: 1rem;
                padding: 2rem;
                text-align: center;
                color: var(--text-primary, #fff);
                margin: 2rem auto;
                max-width: 600px;
                min-height: 300px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            
            .error-icon,
            .fallback-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
                display: block;
            }
            
            .visualization-error h3,
            .webgl-fallback h3 {
                color: var(--accent, #fbbf24);
                margin-bottom: 1rem;
                font-size: 1.5rem;
            }
            
            .error-suggestions,
            .fallback-content {
                text-align: left;
                margin: 1.5rem 0;
                padding: 1rem;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 0.5rem;
                max-width: 400px;
            }
            
            .error-suggestions ul,
            .fallback-content ul {
                margin: 0.5rem 0;
                padding-left: 1.5rem;
            }
            
            .error-suggestions li,
            .fallback-content li {
                margin: 0.5rem 0;
                color: var(--text-secondary, #ccc);
            }
            
            .error-actions,
            .fallback-actions {
                display: flex;
                gap: 1rem;
                margin-top: 1.5rem;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .retry-button,
            .dismiss-button,
            .fallback-link {
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                text-decoration: none;
                font-weight: 500;
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;
                display: inline-block;
            }
            
            .retry-button {
                background: var(--accent, #fbbf24);
                color: var(--background, #000);
            }
            
            .retry-button:hover {
                background: var(--accent-dark, #d97706);
                transform: translateY(-1px);
            }
            
            .dismiss-button {
                background: var(--surface-glass, rgba(255,255,255,0.1));
                color: var(--text-primary, #fff);
                border: 1px solid var(--border-default, #333);
            }
            
            .dismiss-button:hover {
                background: var(--surface-glass-hover, rgba(255,255,255,0.2));
            }
            
            .fallback-link {
                background: var(--surface-glass, rgba(255,255,255,0.1));
                color: var(--text-primary, #fff);
                border: 1px solid var(--border-default, #333);
            }
            
            .fallback-link:hover {
                background: var(--accent, #fbbf24);
                color: var(--background, #000);
                transform: translateY(-1px);
            }
            
            .error-details {
                margin-top: 1rem;
                text-align: left;
                max-width: 100%;
            }
            
            .error-details summary {
                cursor: pointer;
                color: var(--text-secondary, #ccc);
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
            }
            
            .error-details pre {
                background: rgba(0, 0, 0, 0.5);
                padding: 1rem;
                border-radius: 0.25rem;
                font-size: 0.8rem;
                overflow-x: auto;
                color: var(--text-tertiary, #999);
                max-height: 200px;
                overflow-y: auto;
            }
            
            @media (max-width: 767px) {
                .visualization-error,
                .webgl-fallback {
                    margin: 1rem;
                    padding: 1.5rem;
                    min-height: 250px;
                }
                
                .error-actions,
                .fallback-actions {
                    flex-direction: column;
                    align-items: center;
                }
                
                .retry-button,
                .dismiss-button,
                .fallback-link {
                    width: 100%;
                    max-width: 200px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // Method to wrap initialization code with error handling
    static wrapVisualization(containerSelector, initFunction) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.warn(`Container ${containerSelector} not found`);
            return;
        }
        
        const errorBoundary = new VisualizationErrorBoundary(container);
        
        try {
            initFunction();
        } catch (error) {
            errorBoundary.handleError({ error });
        }
        
        return errorBoundary;
    }
    
    // Method to check WebGL support before initializing
    static checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }
    
    // Method to initialize fallbacks for all visualizations on page load
    static initializePageFallbacks() {
        // Check WebGL support
        if (!VisualizationErrorBoundary.checkWebGLSupport()) {
            document.querySelectorAll('.visualization-container').forEach(container => {
                const errorBoundary = new VisualizationErrorBoundary(container);
                errorBoundary.showWebGLFallback();
            });
            return;
        }
        
        // Set up error boundaries for all visualization containers
        document.querySelectorAll('.visualization-container').forEach(container => {
            new VisualizationErrorBoundary(container);
        });
    }
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    VisualizationErrorBoundary.initializePageFallbacks();
});

// Export for use in other scripts
window.VisualizationErrorBoundary = VisualizationErrorBoundary;