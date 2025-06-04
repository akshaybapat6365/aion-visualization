// Browser Compatibility and Optimization System for Aion Visualization
// Provides cross-browser support and device-specific optimizations

class BrowserCompatibility {
    constructor() {
        this.browser = this.detectBrowser();
        this.device = this.detectDevice();
        this.capabilities = this.assessCapabilities();
        this.optimizations = this.determineOptimizations();
        
        this.setupPolyfills();
        this.setupEventHandlers();
    }
    
    detectBrowser() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg') && !userAgent.includes('OPR')) {
            return {
                name: 'chrome',
                version: this.extractVersion(userAgent, /Chrome\/(\d+)/),
                engine: 'blink'
            };
        } else if (userAgent.includes('Firefox')) {
            return {
                name: 'firefox',
                version: this.extractVersion(userAgent, /Firefox\/(\d+)/),
                engine: 'gecko'
            };
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            return {
                name: 'safari',
                version: this.extractVersion(userAgent, /Version\/(\d+)/),
                engine: 'webkit'
            };
        } else if (userAgent.includes('Edg')) {
            return {
                name: 'edge',
                version: this.extractVersion(userAgent, /Edg\/(\d+)/),
                engine: 'blink'
            };
        } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
            return {
                name: 'opera',
                version: this.extractVersion(userAgent, /(?:Opera|OPR)\/(\d+)/),
                engine: 'blink'
            };
        }
        
        return {
            name: 'unknown',
            version: 0,
            engine: 'unknown'
        };
    }
    
    extractVersion(userAgent, regex) {
        const match = userAgent.match(regex);
        return match ? parseInt(match[1]) : 0;
    }
    
    detectDevice() {
        const userAgent = navigator.userAgent;
        
        return {
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            isTablet: /iPad|Android.*Tablet|Windows.*Touch/i.test(userAgent),
            isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            isIOS: /iPad|iPhone|iPod/.test(userAgent),
            isAndroid: /Android/.test(userAgent),
            touchSupported: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            deviceMemory: navigator.deviceMemory || 4,
            hardwareConcurrency: navigator.hardwareConcurrency || 4
        };
    }
    
    assessCapabilities() {
        return {
            webgl: this.testWebGL(),
            webgl2: this.testWebGL2(),
            webassembly: this.testWebAssembly(),
            serviceWorker: 'serviceWorker' in navigator,
            indexedDB: 'indexedDB' in window,
            localStorage: this.testLocalStorage(),
            sessionStorage: this.testSessionStorage(),
            fetch: 'fetch' in window,
            intersectionObserver: 'IntersectionObserver' in window,
            resizeObserver: 'ResizeObserver' in window,
            webWorkers: 'Worker' in window,
            offscreenCanvas: 'OffscreenCanvas' in window,
            audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
            geolocation: 'geolocation' in navigator,
            notification: 'Notification' in window,
            fullscreen: document.fullscreenEnabled || document.webkitFullscreenEnabled,
            pointerEvents: 'PointerEvent' in window,
            customElements: 'customElements' in window,
            modules: 'noModule' in HTMLScriptElement.prototype
        };
    }
    
    testWebGL() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return false;
            
            // Test basic WebGL functionality
            const shaderTest = this.testShaderSupport(gl);
            const textureTest = this.testTextureSupport(gl);
            
            return {
                supported: true,
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                shadersSupported: shaderTest,
                texturesSupported: textureTest,
                extensions: gl.getSupportedExtensions()
            };
        } catch (e) {
            return { supported: false, error: e.message };
        }
    }
    
    testWebGL2() {
        try {
            const canvas = document.createElement('canvas');
            const gl2 = canvas.getContext('webgl2');
            return {
                supported: !!gl2,
                version: gl2 ? gl2.getParameter(gl2.VERSION) : null
            };
        } catch (e) {
            return { supported: false, error: e.message };
        }
    }
    
    testWebAssembly() {
        try {
            return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
        } catch (e) {
            return false;
        }
    }
    
    testLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    testSessionStorage() {
        try {
            const test = 'test';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    testShaderSupport(gl) {
        try {
            const vertexShader = gl.createShader(gl.VERTEX_SHADER);
            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
            
            gl.shaderSource(vertexShader, 'attribute vec4 position; void main() { gl_Position = position; }');
            gl.shaderSource(fragmentShader, 'precision mediump float; void main() { gl_FragColor = vec4(1.0); }');
            
            gl.compileShader(vertexShader);
            gl.compileShader(fragmentShader);
            
            return gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) &&
                   gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
        } catch (e) {
            return false;
        }
    }
    
    testTextureSupport(gl) {
        try {
            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0, 255]));
            return true;
        } catch (e) {
            return false;
        }
    }
    
    determineOptimizations() {
        const opts = {
            quality: 'high',
            particleCount: 1000,
            antialiasing: true,
            shadows: true,
            postProcessing: true,
            animationQuality: 'high'
        };
        
        // Safari-specific optimizations
        if (this.browser.name === 'safari') {
            opts.quality = 'medium';
            opts.particleCount = 500;
            opts.antialiasing = false;
            opts.shadows = false;
            opts.postProcessing = false;
        }
        
        // Mobile optimizations
        if (this.device.isMobile) {
            opts.quality = 'low';
            opts.particleCount = 200;
            opts.antialiasing = false;
            opts.shadows = false;
            opts.postProcessing = false;
            opts.animationQuality = 'low';
        }
        
        // Low memory device optimizations
        if (this.device.deviceMemory <= 4) {
            opts.quality = 'medium';
            opts.particleCount = Math.floor(opts.particleCount * 0.5);
            opts.antialiasing = false;
        }
        
        // WebGL capability-based optimizations
        if (!this.capabilities.webgl.supported) {
            opts.quality = 'fallback';
            opts.particleCount = 0;
            opts.antialiasing = false;
            opts.shadows = false;
            opts.postProcessing = false;
        } else if (this.capabilities.webgl.maxTextureSize < 2048) {
            opts.quality = 'low';
            opts.particleCount = Math.floor(opts.particleCount * 0.3);
        }
        
        return opts;
    }
    
    setupPolyfills() {
        // Intersection Observer polyfill
        if (!this.capabilities.intersectionObserver) {
            this.loadPolyfill('https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver');
        }
        
        // Resize Observer polyfill
        if (!this.capabilities.resizeObserver) {
            this.loadPolyfill('https://polyfill.io/v3/polyfill.min.js?features=ResizeObserver');
        }
        
        // Fetch polyfill
        if (!this.capabilities.fetch) {
            this.loadPolyfill('https://polyfill.io/v3/polyfill.min.js?features=fetch');
        }
        
        // Custom polyfills
        this.setupCustomPolyfills();
    }
    
    setupCustomPolyfills() {
        // RequestAnimationFrame polyfill
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window.webkitRequestAnimationFrame ||
                                         window.mozRequestAnimationFrame ||
                                         window.oRequestAnimationFrame ||
                                         window.msRequestAnimationFrame ||
                                         function(callback) {
                                             return window.setTimeout(callback, 1000 / 60);
                                         };
        }
        
        // CancelAnimationFrame polyfill
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = window.webkitCancelAnimationFrame ||
                                        window.mozCancelAnimationFrame ||
                                        window.oCancelAnimationFrame ||
                                        window.msCancelAnimationFrame ||
                                        window.clearTimeout;
        }
        
        // Performance.now polyfill
        if (!window.performance || !window.performance.now) {
            const startTime = Date.now();
            if (!window.performance) {
                window.performance = {};
            }
            window.performance.now = function() {
                return Date.now() - startTime;
            };
        }
        
        // Object.assign polyfill
        if (!Object.assign) {
            Object.assign = function(target, ...sources) {
                if (target == null) {
                    throw new TypeError('Cannot convert undefined or null to object');
                }
                
                const to = Object(target);
                
                for (let index = 0; index < sources.length; index++) {
                    const nextSource = sources[index];
                    
                    if (nextSource != null) {
                        for (const nextKey in nextSource) {
                            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                                to[nextKey] = nextSource[nextKey];
                            }
                        }
                    }
                }
                
                return to;
            };
        }
    }
    
    loadPolyfill(url) {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        document.head.appendChild(script);
    }
    
    setupEventHandlers() {
        // Handle orientation change
        if (this.device.isMobile) {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.handleOrientationChange();
                }, 100);
            });
        }
        
        // Handle connection changes
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.handleConnectionChange();
            });
        }
        
        // Handle memory warnings (Chrome)
        if ('memory' in performance) {
            setInterval(() => {
                this.monitorMemoryUsage();
            }, 5000);
        }
    }
    
    handleOrientationChange() {
        // Trigger resize events for visualizations
        window.dispatchEvent(new Event('resize'));
        
        // Notify applications about orientation change
        window.dispatchEvent(new CustomEvent('orientationchanged', {
            detail: {
                orientation: window.orientation || 0
            }
        }));
    }
    
    handleConnectionChange() {
        const connection = navigator.connection;
        const newStrategy = this.determineLoadingStrategy(connection);
        
        window.dispatchEvent(new CustomEvent('connectionchanged', {
            detail: {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                strategy: newStrategy
            }
        }));
    }
    
    determineLoadingStrategy(connection) {
        if (!connection) return 'balanced';
        
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            return 'minimal';
        } else if (connection.effectiveType === '3g') {
            return 'conservative';
        } else if (connection.effectiveType === '4g') {
            return 'aggressive';
        }
        
        return 'balanced';
    }
    
    monitorMemoryUsage() {
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize;
            const memoryLimit = performance.memory.jsHeapSizeLimit;
            const usage = memoryUsage / memoryLimit;
            
            if (usage > 0.85) {
                window.dispatchEvent(new CustomEvent('memorypressure', {
                    detail: {
                        usage: usage,
                        usedMB: Math.round(memoryUsage / 1024 / 1024),
                        limitMB: Math.round(memoryLimit / 1024 / 1024)
                    }
                }));
            }
        }
    }
    
    applyBrowserSpecificFixes() {
        // Safari-specific fixes
        if (this.browser.name === 'safari') {
            this.applySafariFixes();
        }
        
        // Firefox-specific fixes
        if (this.browser.name === 'firefox') {
            this.applyFirefoxFixes();
        }
        
        // Chrome-specific optimizations
        if (this.browser.name === 'chrome') {
            this.applyChromeFixes();
        }
        
        // Mobile-specific fixes
        if (this.device.isMobile) {
            this.applyMobileFixes();
        }
    }
    
    applySafariFixes() {
        // Fix for Safari's WebGL context issues
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, attributes) {
            if (type === 'webgl' || type === 'experimental-webgl') {
                attributes = attributes || {};
                attributes.antialias = false; // Disable antialiasing for stability
                attributes.powerPreference = 'default'; // Use default power preference
            }
            return originalGetContext.call(this, type, attributes);
        };
        
        // Fix for Safari's audio context restrictions
        if ('webkitAudioContext' in window && !('AudioContext' in window)) {
            window.AudioContext = window.webkitAudioContext;
        }
    }
    
    applyFirefoxFixes() {
        // Firefox-specific optimizations
        if (this.browser.version < 90) {
            // Disable some advanced features for older Firefox
            this.optimizations.postProcessing = false;
        }
    }
    
    applyChromeFixes() {
        // Chrome-specific optimizations
        // Enable hardware acceleration if available
        this.optimizations.hardwareAcceleration = true;
    }
    
    applyMobileFixes() {
        // Disable certain features that don't work well on mobile
        this.optimizations.fullscreen = false;
        
        // Add viewport meta tag if not present
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(viewport);
        }
        
        // Prevent zoom on input focus (iOS)
        if (this.device.isIOS) {
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (parseFloat(getComputedStyle(input).fontSize) < 16) {
                    input.style.fontSize = '16px';
                }
            });
        }
    }
    
    getSupportLevel() {
        const features = this.capabilities;
        
        if (features.webgl.supported && features.webgl2.supported && 
            features.modules && features.intersectionObserver) {
            return 'full';
        }
        
        if (features.webgl.supported && features.localStorage && features.fetch) {
            return 'basic';
        }
        
        return 'minimal';
    }
    
    getOptimizedSettings() {
        return {
            ...this.optimizations,
            browser: this.browser,
            device: this.device,
            capabilities: this.capabilities,
            supportLevel: this.getSupportLevel()
        };
    }
    
    generateCompatibilityReport() {
        return {
            browser: this.browser,
            device: this.device,
            capabilities: this.capabilities,
            optimizations: this.optimizations,
            supportLevel: this.getSupportLevel(),
            recommendations: this.generateRecommendations()
        };
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        if (!this.capabilities.webgl.supported) {
            recommendations.push('WebGL is not supported. Consider upgrading your browser or enabling hardware acceleration.');
        }
        
        if (this.device.deviceMemory <= 2) {
            recommendations.push('Low device memory detected. Some features may be disabled for optimal performance.');
        }
        
        if (this.browser.name === 'safari' && this.browser.version < 14) {
            recommendations.push('Safari version is outdated. Consider updating for better WebGL support.');
        }
        
        if (this.device.isMobile && !this.device.touchSupported) {
            recommendations.push('Touch support not detected on mobile device. Some interactions may not work properly.');
        }
        
        return recommendations;
    }
}

// Safari-specific WebGL optimization
class SafariWebGLOptimizer {
    static optimizeForSafari() {
        if (BrowserCompatibility.prototype.browser?.name !== 'safari') return;
        
        // Reduce default texture sizes for Safari
        if (window.THREE) {
            const originalTextureLoader = THREE.TextureLoader.prototype.load;
            THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
                const texture = originalTextureLoader.call(this, url, (tex) => {
                    // Reduce texture size for Safari
                    if (tex.image && tex.image.width > 1024) {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = Math.min(tex.image.width, 1024);
                        canvas.height = Math.min(tex.image.height, 1024);
                        ctx.drawImage(tex.image, 0, 0, canvas.width, canvas.height);
                        tex.image = canvas;
                    }
                    if (onLoad) onLoad(tex);
                }, onProgress, onError);
                
                return texture;
            };
        }
    }
}

// Initialize browser compatibility
const browserCompatibility = new BrowserCompatibility();
browserCompatibility.applyBrowserSpecificFixes();

// Make globally available
window.browserCompatibility = browserCompatibility;

// Initialize Safari optimizations
SafariWebGLOptimizer.optimizeForSafari();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrowserCompatibility, SafariWebGLOptimizer };
}