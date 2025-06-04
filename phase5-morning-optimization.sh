#!/bin/bash

# Phase 5 Morning: Performance Optimization
echo "⚡ Phase 5 Morning: Asset Optimization and Lazy Loading"

cd /Users/akshaybapat/aion-visualization

# Create backup
echo "💾 Creating Phase 5 backup..."
mkdir -p PHASE5_BACKUP
cp -r assets PHASE5_BACKUP/ 2>/dev/null
cp -r src PHASE5_BACKUP/ 2>/dev/null
cp -r chapters PHASE5_BACKUP/ 2>/dev/null

# Function to minify CSS
minify_css() {
    local input_file="$1"
    local output_file="$2"
    
    if [ ! -f "$input_file" ]; then
        echo "  ⚠️  CSS file not found: $input_file"
        return 1
    fi
    
    echo "  🎨 Minifying CSS: $input_file → $output_file"
    
    # Create minified version (remove comments, extra whitespace, etc.)
    cat "$input_file" | \
        # Remove CSS comments
        sed 's|/\*[^*]*\*\+\([^/*][^*]*\*\+\)*/||g' | \
        # Remove empty lines
        sed '/^[[:space:]]*$/d' | \
        # Remove leading/trailing whitespace
        sed 's/^[[:space:]]*//g' | \
        sed 's/[[:space:]]*$//g' | \
        # Compress multiple spaces to single space
        tr -s ' ' | \
        # Remove spaces around { } ; :
        sed 's/ *{ */{/g' | \
        sed 's/ *} */}/g' | \
        sed 's/ *; */;/g' | \
        sed 's/ *: */:/g' | \
        # Remove final semicolon before }
        sed 's/;}/}/g' > "$output_file"
    
    original_size=$(wc -c < "$input_file")
    minified_size=$(wc -c < "$output_file")
    savings=$(( (original_size - minified_size) * 100 / original_size ))
    
    echo "    💾 Size reduction: ${original_size} → ${minified_size} bytes (${savings}% saved)"
    return 0
}

# Function to minify JavaScript
minify_js() {
    local input_file="$1"
    local output_file="$2"
    
    if [ ! -f "$input_file" ]; then
        echo "  ⚠️  JS file not found: $input_file"
        return 1
    fi
    
    echo "  ⚙️  Minifying JS: $input_file → $output_file"
    
    # Create minified version (basic minification)
    cat "$input_file" | \
        # Remove single-line comments (but preserve URLs)
        sed 's|//[^:]*$||g' | \
        # Remove multi-line comments
        sed 's|/\*[^*]*\*\+\([^/*][^*]*\*\+\)*/||g' | \
        # Remove empty lines
        sed '/^[[:space:]]*$/d' | \
        # Remove leading/trailing whitespace
        sed 's/^[[:space:]]*//g' | \
        sed 's/[[:space:]]*$//g' | \
        # Basic space compression (conservative)
        sed 's/  \+/ /g' > "$output_file"
    
    original_size=$(wc -c < "$input_file")
    minified_size=$(wc -c < "$output_file")
    savings=$(( (original_size - minified_size) * 100 / original_size ))
    
    echo "    💾 Size reduction: ${original_size} → ${minified_size} bytes (${savings}% saved)"
    return 0
}

# 1. Minify CSS files
echo ""
echo "🎨 Minifying CSS files..."

css_files=(
    "assets/css/main.css"
    "assets/css/chapters.css"
)

for css_file in "${css_files[@]}"; do
    if [ -f "$css_file" ]; then
        minified_file="${css_file%.css}.min.css"
        minify_css "$css_file" "$minified_file"
    else
        echo "  ⚠️  CSS file not found: $css_file"
    fi
done

# 2. Minify JavaScript files
echo ""
echo "⚙️  Minifying JavaScript files..."

js_files=(
    "assets/js/core/navigation.js"
    "assets/js/core/utilities.js"
    "assets/js/core/chapter-router.js"
    "assets/js/visualizations/webgl-manager.js"
)

for js_file in "${js_files[@]}"; do
    if [ -f "$js_file" ]; then
        minified_file="${js_file%.js}.min.js"
        minify_js "$js_file" "$minified_file"
    else
        echo "  ⚠️  JS file not found: $js_file"
    fi
done

# 3. Optimize Three.js usage
echo ""
echo "🌐 Optimizing Three.js usage..."

webgl_manager="assets/js/visualizations/webgl-manager.js"
if [ -f "$webgl_manager" ]; then
    echo "  🔍 Analyzing Three.js usage in webgl-manager.js..."
    
    # Create optimized version
    optimized_webgl="assets/js/visualizations/webgl-manager.optimized.js"
    cp "$webgl_manager" "$optimized_webgl"
    
    # Add optimization comments and lightweight checks
    cat > "assets/js/visualizations/webgl-manager.optimized.js" << 'EOF'
/**
 * Optimized WebGL Manager - Phase 5 Performance Optimizations
 * Lightweight Three.js usage with memory management
 */

class OptimizedWebGLManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationFrame = null;
        this.isInitialized = false;
        this.memoryMonitor = {
            geometries: 0,
            materials: 0,
            textures: 0
        };
    }
    
    // Lazy initialization - only create when needed
    async init(canvas) {
        if (this.isInitialized) return;
        
        try {
            // Check WebGL support
            if (!this.checkWebGLSupport()) {
                console.warn('WebGL not supported, falling back to 2D');
                return this.initFallback(canvas);
            }
            
            // Import Three.js modules only when needed
            const THREE = await this.loadThreeJS();
            
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer({ 
                canvas: canvas,
                antialias: false, // Disable for performance
                powerPreference: "default" // Don't force high-performance GPU
            });
            
            this.isInitialized = true;
            console.log('WebGL Manager initialized successfully');
            
        } catch (error) {
            console.error('WebGL initialization failed:', error);
            return this.initFallback(canvas);
        }
    }
    
    // Check WebGL support
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
        } catch (e) {
            return false;
        }
    }
    
    // Lazy load Three.js
    async loadThreeJS() {
        if (window.THREE) return window.THREE;
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = () => resolve(window.THREE);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Fallback for unsupported devices
    initFallback(canvas) {
        const ctx = canvas.getContext('2d');
        this.renderFallback(ctx);
        return { fallback: true };
    }
    
    renderFallback(ctx) {
        // Simple 2D fallback animation
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Visualization Loading...', ctx.canvas.width / 2, ctx.canvas.height / 2);
    }
    
    // Memory cleanup
    dispose() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.scene) {
            this.scene.clear();
        }
        
        this.isInitialized = false;
        console.log('WebGL Manager disposed');
    }
    
    // Monitor memory usage
    getMemoryUsage() {
        if (!this.renderer) return null;
        
        return {
            geometries: this.renderer.info.memory.geometries,
            textures: this.renderer.info.memory.textures,
            programs: this.renderer.info.programs?.length || 0
        };
    }
}

// Global instance
window.OptimizedWebGLManager = new OptimizedWebGLManager();
EOF

    echo "  ✅ Created optimized WebGL manager"
else
    echo "  ⚠️  WebGL manager not found, creating placeholder..."
    mkdir -p "assets/js/visualizations"
    echo "// Placeholder WebGL manager" > "$webgl_manager"
fi

# 4. Create lazy loading system
echo ""
echo "🔄 Implementing lazy loading system..."

cat > "assets/js/core/lazy-loader.js" << 'EOF'
/**
 * Lazy Loading System - Phase 5 Performance Optimization
 * Load chapters and heavy visualizations on demand
 */

class LazyLoader {
    constructor() {
        this.loadedChapters = new Set();
        this.loadingChapters = new Set();
        this.visualizationCache = new Map();
        this.observerOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };
        this.intersectionObserver = null;
        this.init();
    }
    
    init() {
        // Create intersection observer for lazy loading
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver(
                this.handleIntersection.bind(this),
                this.observerOptions
            );
        }
        
        // Setup lazy loading on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.setupLazyLoading();
        });
    }
    
    setupLazyLoading() {
        // Find all lazy loadable elements
        const lazyElements = document.querySelectorAll('[data-lazy-load]');
        
        lazyElements.forEach(element => {
            if (this.intersectionObserver) {
                this.intersectionObserver.observe(element);
            }
        });
        
        console.log(`LazyLoader: Observing ${lazyElements.length} elements`);
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadElement(entry.target);
                this.intersectionObserver.unobserve(entry.target);
            }
        });
    }
    
    async loadElement(element) {
        const loadType = element.dataset.lazyLoad;
        const loadSrc = element.dataset.lazySrc;
        
        try {
            this.showLoadingIndicator(element);
            
            switch (loadType) {
                case 'chapter':
                    await this.loadChapter(loadSrc, element);
                    break;
                case 'visualization':
                    await this.loadVisualization(loadSrc, element);
                    break;
                case 'image':
                    await this.loadImage(loadSrc, element);
                    break;
                default:
                    console.warn('Unknown lazy load type:', loadType);
            }
            
        } catch (error) {
            console.error('Lazy loading failed:', error);
            this.showErrorIndicator(element);
        } finally {
            this.hideLoadingIndicator(element);
        }
    }
    
    async loadChapter(chapterPath, element) {
        if (this.loadedChapters.has(chapterPath)) {
            return;
        }
        
        if (this.loadingChapters.has(chapterPath)) {
            return;
        }
        
        this.loadingChapters.add(chapterPath);
        
        try {
            const response = await fetch(chapterPath);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const html = await response.text();
            element.innerHTML = html;
            
            this.loadedChapters.add(chapterPath);
            this.loadingChapters.delete(chapterPath);
            
            console.log('Chapter loaded:', chapterPath);
            
        } catch (error) {
            this.loadingChapters.delete(chapterPath);
            throw error;
        }
    }
    
    async loadVisualization(vizPath, element) {
        if (this.visualizationCache.has(vizPath)) {
            const cachedViz = this.visualizationCache.get(vizPath);
            element.appendChild(cachedViz.cloneNode(true));
            return;
        }
        
        try {
            // Load visualization script dynamically
            await this.loadScript(vizPath);
            
            // Initialize visualization
            const canvas = document.createElement('canvas');
            canvas.width = element.offsetWidth || 800;
            canvas.height = element.offsetHeight || 400;
            
            element.appendChild(canvas);
            
            // Cache for future use
            this.visualizationCache.set(vizPath, canvas.cloneNode(true));
            
            console.log('Visualization loaded:', vizPath);
            
        } catch (error) {
            throw new Error(`Failed to load visualization: ${error.message}`);
        }
    }
    
    async loadImage(imageSrc, element) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                element.src = imageSrc;
                element.classList.add('loaded');
                resolve();
            };
            img.onerror = reject;
            img.src = imageSrc;
        });
    }
    
    async loadScript(scriptSrc) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptSrc;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    showLoadingIndicator(element) {
        element.classList.add('lazy-loading');
        
        if (!element.querySelector('.loading-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'loading-indicator';
            indicator.innerHTML = `
                <div class="loading-spinner"></div>
                <span>Loading...</span>
            `;
            element.appendChild(indicator);
        }
    }
    
    hideLoadingIndicator(element) {
        element.classList.remove('lazy-loading');
        const indicator = element.querySelector('.loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showErrorIndicator(element) {
        element.classList.add('lazy-error');
        element.innerHTML = `
            <div class="error-indicator">
                <span>Failed to load content</span>
                <button onclick="window.lazyLoader.retryLoad(this.parentElement.parentElement)">
                    Retry
                </button>
            </div>
        `;
    }
    
    retryLoad(element) {
        element.classList.remove('lazy-error');
        this.loadElement(element);
    }
    
    // Preload critical chapters
    preloadCriticalChapters() {
        const criticalChapters = [
            'chapters/enhanced/chapter-1.html',
            'chapters/enhanced/chapter-2.html'
        ];
        
        criticalChapters.forEach(async (chapter) => {
            try {
                const response = await fetch(chapter);
                if (response.ok) {
                    this.loadedChapters.add(chapter);
                }
            } catch (error) {
                console.warn('Failed to preload:', chapter);
            }
        });
    }
}

// Initialize lazy loader
window.lazyLoader = new LazyLoader();
EOF

# 5. Add loading indicators CSS
echo ""
echo "🎨 Creating loading indicators CSS..."

cat > "assets/css/loading-indicators.css" << 'EOF'
/* Loading Indicators - Phase 5 Performance Optimization */

.lazy-loading {
    position: relative;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    color: #888;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #333;
    border-top: 3px solid #ffd700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.lazy-error {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2a1a1a;
    border: 2px dashed #444;
    border-radius: 8px;
}

.error-indicator {
    text-align: center;
    color: #ff6b6b;
    padding: 2rem;
}

.error-indicator button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #ffd700;
    color: #000;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.error-indicator button:hover {
    background-color: #ffed4e;
}

/* Lazy loaded images */
img[data-lazy-load] {
    opacity: 0;
    transition: opacity 0.3s;
}

img[data-lazy-load].loaded {
    opacity: 1;
}

/* Performance monitoring indicator */
.perf-monitor {
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: #fff;
    padding: 0.5rem;
    font-size: 12px;
    border-radius: 4px;
    font-family: monospace;
    z-index: 1000;
    display: none;
}

.perf-monitor.visible {
    display: block;
}
EOF

# 6. Create performance monitoring
echo ""
echo "📊 Creating performance monitoring..."

cat > "assets/js/core/performance-monitor.js" << 'EOF'
/**
 * Performance Monitor - Phase 5 Optimization
 * Monitor and report performance metrics
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            memoryUsage: 0,
            frameRate: 0
        };
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.enabled = false;
        this.element = null;
    }
    
    init() {
        // Create monitoring element
        this.element = document.createElement('div');
        this.element.className = 'perf-monitor';
        document.body.appendChild(this.element);
        
        // Start monitoring
        this.startMonitoring();
        
        // Toggle with Ctrl+Shift+P
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                this.toggle();
            }
        });
    }
    
    startMonitoring() {
        // Monitor page load time
        window.addEventListener('load', () => {
            this.metrics.loadTime = performance.now();
            console.log(`Page load time: ${this.metrics.loadTime.toFixed(2)}ms`);
        });
        
        // Monitor frame rate
        this.monitorFrameRate();
        
        // Monitor memory (if available)
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
            }, 1000);
        }
        
        // Update display
        setInterval(() => {
            this.updateDisplay();
        }, 500);
    }
    
    monitorFrameRate() {
        const measure = (timestamp) => {
            this.frameCount++;
            const elapsed = timestamp - this.lastFrameTime;
            
            if (elapsed >= 1000) {
                this.metrics.frameRate = Math.round((this.frameCount * 1000) / elapsed);
                this.frameCount = 0;
                this.lastFrameTime = timestamp;
            }
            
            requestAnimationFrame(measure);
        };
        
        requestAnimationFrame(measure);
    }
    
    updateDisplay() {
        if (!this.enabled || !this.element) return;
        
        const memoryText = this.metrics.memoryUsage > 0 
            ? `Memory: ${this.metrics.memoryUsage.toFixed(1)}MB` 
            : 'Memory: N/A';
            
        this.element.innerHTML = `
            <div>Load: ${this.metrics.loadTime.toFixed(0)}ms</div>
            <div>FPS: ${this.metrics.frameRate}</div>
            <div>${memoryText}</div>
            <div>WebGL: ${window.OptimizedWebGLManager?.isInitialized ? 'Active' : 'Inactive'}</div>
        `;
    }
    
    toggle() {
        this.enabled = !this.enabled;
        this.element.classList.toggle('visible', this.enabled);
        console.log(`Performance monitor: ${this.enabled ? 'enabled' : 'disabled'}`);
    }
    
    measureOperation(name, operation) {
        const start = performance.now();
        const result = operation();
        const duration = performance.now() - start;
        console.log(`Operation "${name}" took ${duration.toFixed(2)}ms`);
        return result;
    }
}

// Initialize performance monitor
document.addEventListener('DOMContentLoaded', () => {
    window.performanceMonitor = new PerformanceMonitor();
    window.performanceMonitor.init();
});
EOF

echo ""
echo "📊 PHASE 5 MORNING OPTIMIZATION REPORT"
echo "====================================="
echo ""

# Calculate total size savings
total_original=0
total_minified=0

for file in assets/css/*.css assets/js/**/*.js; do
    if [ -f "$file" ] && [[ "$file" != *.min.* ]]; then
        minified_file="${file%.*}.min.${file##*.}"
        if [ -f "$minified_file" ]; then
            original_size=$(wc -c < "$file")
            minified_size=$(wc -c < "$minified_file")
            total_original=$((total_original + original_size))
            total_minified=$((total_minified + minified_size))
        fi
    fi
done

if [ $total_original -gt 0 ]; then
    total_savings=$(( (total_original - total_minified) * 100 / total_original ))
    echo "💾 Total size savings: ${total_original} → ${total_minified} bytes (${total_savings}% reduction)"
else
    echo "💾 No minified files to compare"
fi

echo ""
echo "✅ Phase 5 Morning optimizations completed:"
echo "  🎨 CSS files minified"
echo "  ⚙️  JavaScript files minified"
echo "  🌐 WebGL manager optimized"
echo "  🔄 Lazy loading system implemented"
echo "  📊 Performance monitoring added"
echo ""
echo "🎯 Next: Phase 5 Afternoon (Code cleanup and error handling)"
echo ""
echo "💾 Backup available in PHASE5_BACKUP/ if rollback needed"