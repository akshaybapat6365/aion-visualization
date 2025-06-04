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
