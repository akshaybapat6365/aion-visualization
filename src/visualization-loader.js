// Visualization Loader Utility for Aion Project
// Provides lazy loading, loading states, and error handling

class VisualizationLoader {
    constructor() {
        this.loadedVisualizations = new Set();
        this.observers = new Map();
        this.loadingStates = new Map();
    }

    // Create loading state UI
    createLoadingState(container) {
        const loadingHTML = `
            <div class="visualization-loading">
                <div class="loading-spinner">
                    <svg width="50" height="50" viewBox="0 0 50 50">
                        <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
                    </svg>
                </div>
                <p class="loading-text">Awakening visualization...</p>
            </div>
        `;
        
        const loadingDiv = document.createElement('div');
        loadingDiv.innerHTML = loadingHTML;
        loadingDiv.className = 'loading-container';
        container.appendChild(loadingDiv);
        
        return loadingDiv;
    }

    // Create error state UI
    createErrorState(container, error) {
        const errorHTML = `
            <div class="visualization-error">
                <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill="none" stroke="#DC143C" stroke-width="2"/>
                    <path d="M 18 18 L 32 32 M 32 18 L 18 32" stroke="#DC143C" stroke-width="2"/>
                </svg>
                <p class="error-text">Visualization could not be loaded</p>
                <p class="error-detail">${error.message || 'Unknown error'}</p>
                <button class="retry-button" onclick="location.reload()">Retry</button>
            </div>
        `;
        
        container.innerHTML = errorHTML;
    }

    // Lazy load visualization when it comes into view
    lazyLoad(containerId, loadFunction, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        // Check if already loaded
        if (this.loadedVisualizations.has(containerId)) {
            return;
        }

        // Create intersection observer
        const observerOptions = {
            root: null,
            rootMargin: options.rootMargin || '50px',
            threshold: options.threshold || 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.loadedVisualizations.has(containerId)) {
                    this.loadVisualization(container, containerId, loadFunction);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        observer.observe(container);
        this.observers.set(containerId, observer);
    }

    // Load visualization with loading state
    async loadVisualization(container, containerId, loadFunction) {
        // Mark as loading
        this.loadingStates.set(containerId, 'loading');
        
        // Show loading state
        const loadingElement = this.createLoadingState(container);
        
        try {
            // Add delay for smooth transition
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Load the visualization
            await loadFunction(container);
            
            // Remove loading state
            if (loadingElement && loadingElement.parentNode) {
                loadingElement.remove();
            }
            
            // Mark as loaded
            this.loadedVisualizations.add(containerId);
            this.loadingStates.set(containerId, 'loaded');
            
            // Animate in
            container.style.opacity = '0';
            container.style.transform = 'translateY(20px)';
            requestAnimationFrame(() => {
                container.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            });
            
        } catch (error) {
            console.error(`Error loading visualization ${containerId}:`, error);
            this.loadingStates.set(containerId, 'error');
            this.createErrorState(container, error);
        }
    }

    // Preload visualization (load before it comes into view)
    preload(containerId, loadFunction) {
        const container = document.getElementById(containerId);
        if (!container || this.loadedVisualizations.has(containerId)) {
            return;
        }

        this.loadVisualization(container, containerId, loadFunction);
    }

    // Check if visualization is loaded
    isLoaded(containerId) {
        return this.loadedVisualizations.has(containerId);
    }

    // Get loading state
    getLoadingState(containerId) {
        return this.loadingStates.get(containerId) || 'not-loaded';
    }

    // Cleanup observers
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }

    // Performance monitoring
    measurePerformance(containerId, callback) {
        const startTime = performance.now();
        
        const originalCallback = callback;
        const wrappedCallback = async (container) => {
            await originalCallback(container);
            
            const endTime = performance.now();
            const loadTime = endTime - startTime;
            
            console.log(`Visualization ${containerId} loaded in ${loadTime.toFixed(2)}ms`);
            
            // Send to analytics if available
            if (window.gtag) {
                window.gtag('event', 'visualization_load', {
                    visualization_id: containerId,
                    load_time: loadTime
                });
            }
        };
        
        return wrappedCallback;
    }

    // WebGL context management
    manageWebGLContext(canvas) {
        // Store WebGL contexts to prevent too many being created
        if (!window.webglContexts) {
            window.webglContexts = new Map();
        }

        const maxContexts = 8; // Browser limit is usually 16
        
        if (window.webglContexts.size >= maxContexts) {
            // Destroy oldest context
            const oldestKey = window.webglContexts.keys().next().value;
            const oldestContext = window.webglContexts.get(oldestKey);
            if (oldestContext && oldestContext.canvas) {
                oldestContext.canvas.width = 1;
                oldestContext.canvas.height = 1;
                oldestContext.canvas.remove();
            }
            window.webglContexts.delete(oldestKey);
        }

        const gl = canvas.getContext('webgl', {
            preserveDrawingBuffer: false,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });

        if (gl) {
            window.webglContexts.set(canvas.id || Date.now(), gl);
        }

        return gl;
    }
}

// CSS for loading states
const loaderStyles = `
<style>
.loading-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-glass);
    backdrop-filter: blur(10px);
    z-index: 10;
}

.visualization-loading {
    text-align: center;
}

.loading-spinner {
    margin: 0 auto 1rem;
}

.spinner-path {
    stroke: var(--accent);
    stroke-linecap: round;
    animation: spinner-dash 1.5s ease-in-out infinite,
               spinner-rotate 2s linear infinite;
}

@keyframes spinner-rotate {
    100% { transform: rotate(360deg); }
}

@keyframes spinner-dash {
    0% {
        stroke-dasharray: 1, 150;
        stroke-dashoffset: 0;
    }
    50% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -35;
    }
    100% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -124;
    }
}

.loading-text {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0;
}

.visualization-error {
    text-align: center;
    padding: 2rem;
}

.error-text {
    color: var(--text-primary);
    font-size: 1rem;
    margin: 1rem 0 0.5rem;
}

.error-detail {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0 0 1rem;
}

.retry-button {
    padding: 0.5rem 1rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.retry-button:hover {
    background: var(--accent-dark);
    transform: translateY(-1px);
}

/* Performance optimization */
.visualization-container {
    will-change: opacity, transform;
    contain: layout style paint;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .spinner-path {
        animation: none;
    }
    
    .visualization-container {
        transition: none !important;
    }
}
</style>
`;

// Inject styles if not already present
if (!document.getElementById('visualization-loader-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'visualization-loader-styles';
    styleElement.innerHTML = loaderStyles;
    document.head.appendChild(styleElement.firstElementChild);
}

// Export as global for use in HTML files
window.VisualizationLoader = VisualizationLoader;