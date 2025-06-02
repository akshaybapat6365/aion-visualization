// Smart Asset Loader with Intelligent Loading Strategies
// Provides adaptive loading based on device capabilities and network conditions

class SmartAssetLoader {
    constructor(options = {}) {
        this.options = {
            enablePrefetch: true,
            enableServiceWorker: true,
            aggressivePreload: false,
            maxConcurrentLoads: 6,
            chunkSize: 64 * 1024, // 64KB chunks
            retryAttempts: 3,
            retryDelay: 1000,
            ...options
        };
        
        this.loadStrategy = this.determineStrategy();
        this.preloadQueue = new PriorityQueue();
        this.loadingPromises = new Map();
        this.loadedAssets = new Set();
        this.failedAssets = new Set();
        this.memoryBudget = this.calculateMemoryBudget();
        this.networkMonitor = new NetworkMonitor();
        this.performanceMonitor = new PerformanceMonitor();
        
        this.init();
    }
    
    init() {
        this.detectCapabilities();
        this.setupServiceWorker();
        this.setupNetworkMonitoring();
        this.setupPreloadStrategies();
        this.setupMemoryMonitoring();
    }
    
    determineStrategy() {
        const connection = navigator.connection || {};
        const deviceMemory = navigator.deviceMemory || 4;
        const hardwareConcurrency = navigator.hardwareConcurrency || 4;
        
        // Analyze network conditions
        const networkQuality = this.assessNetworkQuality(connection);
        
        // Analyze device capabilities
        const deviceCapability = this.assessDeviceCapability(deviceMemory, hardwareConcurrency);
        
        // Determine loading strategy
        if (networkQuality === 'excellent' && deviceCapability === 'high') {
            return {
                type: 'aggressive',
                preloadChapters: 3,
                preloadAssets: true,
                enableParallelLoading: true,
                chunkSize: 128 * 1024,
                maxConcurrent: 8
            };
        } else if (networkQuality === 'good' && deviceCapability === 'medium') {
            return {
                type: 'balanced',
                preloadChapters: 1,
                preloadAssets: false,
                enableParallelLoading: true,
                chunkSize: 64 * 1024,
                maxConcurrent: 4
            };
        } else {
            return {
                type: 'conservative',
                preloadChapters: 0,
                preloadAssets: false,
                enableParallelLoading: false,
                chunkSize: 32 * 1024,
                maxConcurrent: 2
            };
        }
    }
    
    assessNetworkQuality(connection) {
        const effectiveType = connection.effectiveType || '4g';
        const downlink = connection.downlink || 10;
        const rtt = connection.rtt || 100;
        
        if (effectiveType === '4g' && downlink > 10 && rtt < 100) {
            return 'excellent';
        } else if (effectiveType === '4g' && downlink > 1.5) {
            return 'good';
        } else if (effectiveType === '3g') {
            return 'fair';
        } else {
            return 'poor';
        }
    }
    
    assessDeviceCapability(memory, cores) {
        const score = (memory * 2) + cores;
        
        if (score >= 12) return 'high';
        if (score >= 8) return 'medium';
        return 'low';
    }
    
    calculateMemoryBudget() {
        const deviceMemory = navigator.deviceMemory || 4;
        const baseMemory = 50 * 1024 * 1024; // 50MB base
        const extraMemory = Math.min((deviceMemory - 4) * 25 * 1024 * 1024, 100 * 1024 * 1024);
        
        return {
            total: baseMemory + extraMemory,
            textures: (baseMemory + extraMemory) * 0.6,
            models: (baseMemory + extraMemory) * 0.3,
            audio: (baseMemory + extraMemory) * 0.1
        };
    }
    
    // Asset Loading Methods
    async loadChapterAssets(chapterId) {
        const manifest = await this.getChapterManifest(chapterId);
        
        // Load critical path first
        const criticalAssets = manifest.assets.filter(asset => asset.critical);
        await this.loadAssetBatch(criticalAssets, 'critical');
        
        // Load enhancement assets if device can handle it
        if (this.loadStrategy.preloadAssets) {
            const enhancementAssets = manifest.assets.filter(asset => !asset.critical);
            this.loadAssetBatch(enhancementAssets, 'enhancement');
        }
        
        return manifest;
    }
    
    async getChapterManifest(chapterId) {
        const manifestUrl = `manifests/chapter${chapterId}.json`;
        
        try {
            const response = await fetch(manifestUrl);
            const manifest = await response.json();
            
            // Add dynamic asset detection
            manifest.assets = await this.detectDynamicAssets(manifest);
            
            return manifest;
        } catch (error) {
            console.warn(`Failed to load manifest for chapter ${chapterId}:`, error);
            return this.generateFallbackManifest(chapterId);
        }
    }
    
    async detectDynamicAssets(manifest) {
        const assets = [...manifest.assets];
        
        // Detect WebGL shaders
        if (this.isWebGLSupported()) {
            assets.push(...this.getWebGLAssets());
        }
        
        // Detect audio capabilities
        if (this.isAudioSupported()) {
            assets.push(...this.getAudioAssets());
        }
        
        // Add responsive image variants
        assets.push(...this.getResponsiveImageAssets(manifest.images || []));
        
        return assets;
    }
    
    async loadAssetBatch(assets, priority = 'normal') {
        const batches = this.createLoadingBatches(assets);
        const loadPromises = [];
        
        for (const batch of batches) {
            const batchPromises = batch.map(asset => 
                this.loadAssetWithRetry(asset, priority));
            
            if (this.loadStrategy.enableParallelLoading) {
                loadPromises.push(...batchPromises);
            } else {
                await Promise.all(batchPromises);
            }
        }
        
        if (this.loadStrategy.enableParallelLoading) {
            return Promise.allSettled(loadPromises);
        }
    }
    
    createLoadingBatches(assets) {
        const batchSize = this.loadStrategy.maxConcurrent;
        const batches = [];
        
        for (let i = 0; i < assets.length; i += batchSize) {
            batches.push(assets.slice(i, i + batchSize));
        }
        
        return batches;
    }
    
    async loadAssetWithRetry(asset, priority = 'normal', attempt = 1) {
        const cacheKey = this.getCacheKey(asset);
        
        // Check if already loaded
        if (this.loadedAssets.has(cacheKey)) {
            return this.getCachedAsset(cacheKey);
        }
        
        // Check if currently loading
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }
        
        const loadPromise = this.loadAsset(asset, priority)
            .catch(async (error) => {
                if (attempt < this.options.retryAttempts) {
                    await this.delay(this.options.retryDelay * attempt);
                    return this.loadAssetWithRetry(asset, priority, attempt + 1);
                } else {
                    this.failedAssets.add(cacheKey);
                    throw error;
                }
            })
            .finally(() => {
                this.loadingPromises.delete(cacheKey);
            });
        
        this.loadingPromises.set(cacheKey, loadPromise);
        return loadPromise;
    }
    
    async loadAsset(asset, priority) {
        const loader = this.getAssetLoader(asset.type);
        
        // Check memory budget
        if (!this.checkMemoryBudget(asset)) {
            throw new Error(`Memory budget exceeded for asset ${asset.url}`);
        }
        
        // Add loading progress tracking
        const progressCallback = (loaded, total) => {
            this.updateLoadingProgress(asset, loaded, total);
        };
        
        const loadedAsset = await loader.load(asset, {
            priority,
            chunkSize: this.loadStrategy.chunkSize,
            onProgress: progressCallback
        });
        
        // Cache the loaded asset
        this.cacheAsset(asset, loadedAsset);
        
        return loadedAsset;
    }
    
    getAssetLoader(type) {
        const loaders = {
            'image': new ImageLoader(),
            'model': new ModelLoader(),
            'texture': new TextureLoader(),
            'audio': new AudioLoader(),
            'shader': new ShaderLoader(),
            'script': new ScriptLoader(),
            'style': new StyleLoader()
        };
        
        return loaders[type] || new GenericLoader();
    }
    
    // Preloading Strategies
    async preloadAdjacentChapters(currentChapter) {
        const preloadCount = this.loadStrategy.preloadChapters;
        if (preloadCount === 0) return;
        
        const chaptersToPreload = [];
        
        // Preload next chapters
        for (let i = 1; i <= preloadCount; i++) {
            if (currentChapter + i <= 14) {
                chaptersToPreload.push(currentChapter + i);
            }
        }
        
        // Preload previous chapters (lower priority)
        for (let i = 1; i <= Math.floor(preloadCount / 2); i++) {
            if (currentChapter - i >= 1) {
                chaptersToPreload.push(currentChapter - i);
            }
        }
        
        // Queue preloading with priority
        chaptersToPreload.forEach((chapterId, index) => {
            const priority = index < preloadCount ? 'high' : 'low';
            this.preloadQueue.enqueue({
                type: 'chapter',
                chapterId,
                priority
            });
        });
        
        this.processPreloadQueue();
    }
    
    async processPreloadQueue() {
        while (!this.preloadQueue.isEmpty()) {
            const item = this.preloadQueue.dequeue();
            
            try {
                if (item.type === 'chapter') {
                    await this.preloadChapterAssets(item.chapterId);
                } else if (item.type === 'asset') {
                    await this.loadAssetWithRetry(item.asset, item.priority);
                }
            } catch (error) {
                console.warn(`Preload failed for ${item.type}:`, error);
            }
            
            // Respect network conditions
            if (this.networkMonitor.isSlowConnection()) {
                await this.delay(1000);
            }
        }
    }
    
    async preloadChapterAssets(chapterId) {
        const manifest = await this.getChapterManifest(chapterId);
        
        // Only preload critical assets for performance
        const criticalAssets = manifest.assets.filter(asset => 
            asset.critical && asset.type !== 'audio');
        
        return this.loadAssetBatch(criticalAssets, 'preload');
    }
    
    // Memory Management
    checkMemoryBudget(asset) {
        const estimatedSize = this.estimateAssetSize(asset);
        const currentUsage = this.getCurrentMemoryUsage();
        
        const budgetType = this.getAssetBudgetType(asset.type);
        const availableBudget = this.memoryBudget[budgetType] - currentUsage[budgetType];
        
        return estimatedSize <= availableBudget;
    }
    
    estimateAssetSize(asset) {
        const sizeMap = {
            'image': this.estimateImageSize(asset),
            'texture': this.estimateTextureSize(asset),
            'model': this.estimateModelSize(asset),
            'audio': this.estimateAudioSize(asset),
            'shader': 1024, // Shaders are typically small
            'script': this.estimateScriptSize(asset)
        };
        
        return sizeMap[asset.type] || 10 * 1024; // 10KB default
    }
    
    estimateImageSize(asset) {
        const dimensions = asset.dimensions || { width: 1024, height: 1024 };
        const bytesPerPixel = asset.format === 'rgba' ? 4 : 3;
        return dimensions.width * dimensions.height * bytesPerPixel;
    }
    
    estimateTextureSize(asset) {
        // WebGL textures with mipmaps
        return this.estimateImageSize(asset) * 1.33;
    }
    
    estimateModelSize(asset) {
        const vertices = asset.vertexCount || 1000;
        const bytesPerVertex = 32; // Position, normal, UV, etc.
        return vertices * bytesPerVertex;
    }
    
    estimateAudioSize(asset) {
        const duration = asset.duration || 10;
        const sampleRate = asset.sampleRate || 44100;
        const channels = asset.channels || 2;
        const bytesPerSample = 2; // 16-bit audio
        return duration * sampleRate * channels * bytesPerSample;
    }
    
    estimateScriptSize(asset) {
        return asset.size || 50 * 1024; // 50KB default for scripts
    }
    
    getCurrentMemoryUsage() {
        // This would integrate with actual memory tracking
        return {
            total: performance.memory?.usedJSHeapSize || 0,
            textures: 0, // Would track WebGL memory
            models: 0,  // Would track 3D model memory
            audio: 0    // Would track audio buffer memory
        };
    }
    
    getAssetBudgetType(assetType) {
        const typeMap = {
            'texture': 'textures',
            'image': 'textures',
            'model': 'models',
            'audio': 'audio'
        };
        
        return typeMap[assetType] || 'total';
    }
    
    // Caching System
    cacheAsset(asset, loadedAsset) {
        const cacheKey = this.getCacheKey(asset);
        
        // Store in appropriate cache
        if (asset.persistent) {
            this.persistentCache.set(cacheKey, loadedAsset);
        } else {
            this.sessionCache.set(cacheKey, loadedAsset);
        }
        
        this.loadedAssets.add(cacheKey);
    }
    
    getCachedAsset(cacheKey) {
        return this.persistentCache.get(cacheKey) || 
               this.sessionCache.get(cacheKey);
    }
    
    getCacheKey(asset) {
        return `${asset.type}:${asset.url}:${asset.version || '1'}`;
    }
    
    // Service Worker Integration
    async setupServiceWorker() {
        if (!this.options.enableServiceWorker || !('serviceWorker' in navigator)) {
            return;
        }
        
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            // Setup communication with service worker
            this.serviceWorker = registration.active || registration.installing;
            
            if (this.serviceWorker) {
                this.setupServiceWorkerMessaging();
            }
        } catch (error) {
            console.warn('Service worker registration failed:', error);
        }
    }
    
    setupServiceWorkerMessaging() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'CACHE_UPDATE':
                    this.handleCacheUpdate(data);
                    break;
                case 'PREFETCH_COMPLETE':
                    this.handlePrefetchComplete(data);
                    break;
                case 'NETWORK_STATUS':
                    this.networkMonitor.updateStatus(data);
                    break;
            }
        });
    }
    
    requestServiceWorkerPrefetch(urls) {
        if (this.serviceWorker) {
            this.serviceWorker.postMessage({
                type: 'PREFETCH_ASSETS',
                urls: urls
            });
        }
    }
    
    // Network Monitoring
    setupNetworkMonitoring() {
        this.networkMonitor.on('connection-change', (connection) => {
            this.adaptToNetworkChange(connection);
        });
        
        this.networkMonitor.on('slow-connection', () => {
            this.enableDataSaverMode();
        });
        
        this.networkMonitor.on('fast-connection', () => {
            this.disableDataSaverMode();
        });
    }
    
    adaptToNetworkChange(connection) {
        // Adjust loading strategy based on network conditions
        const oldStrategy = this.loadStrategy;
        this.loadStrategy = this.determineStrategy();
        
        if (oldStrategy.type !== this.loadStrategy.type) {
            console.log(`Loading strategy changed: ${oldStrategy.type} → ${this.loadStrategy.type}`);
            this.adjustOngoingLoads();
        }
    }
    
    adjustOngoingLoads() {
        // Pause non-critical loading if network degrades
        if (this.loadStrategy.type === 'conservative') {
            this.pauseNonCriticalLoads();
        } else {
            this.resumeNonCriticalLoads();
        }
    }
    
    enableDataSaverMode() {
        console.log('Data saver mode enabled');
        
        // Reduce image quality
        this.imageQuality = 'low';
        
        // Disable autoplay videos/animations
        this.autoplay = false;
        
        // Reduce preloading
        this.loadStrategy.preloadChapters = 0;
        this.loadStrategy.preloadAssets = false;
    }
    
    disableDataSaverMode() {
        console.log('Data saver mode disabled');
        
        // Restore normal quality
        this.imageQuality = 'normal';
        this.autoplay = true;
        
        // Restore preloading
        this.loadStrategy = this.determineStrategy();
    }
    
    // Performance Monitoring
    setupMemoryMonitoring() {
        setInterval(() => {
            this.checkMemoryPressure();
        }, 5000);
    }
    
    checkMemoryPressure() {
        if (!performance.memory) return;
        
        const memory = performance.memory;
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usageRatio > 0.9) {
            this.handleMemoryPressure('critical');
        } else if (usageRatio > 0.7) {
            this.handleMemoryPressure('warning');
        }
    }
    
    handleMemoryPressure(level) {
        switch (level) {
            case 'critical':
                this.freeMemory('aggressive');
                break;
            case 'warning':
                this.freeMemory('conservative');
                break;
        }
    }
    
    freeMemory(strategy) {
        if (strategy === 'aggressive') {
            // Clear all non-critical cached assets
            this.sessionCache.clear();
            
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            // Reduce texture quality
            this.reduceTextureQuality();
        } else {
            // Clear old cached assets
            this.clearOldCacheEntries();
        }
    }
    
    // Utility Methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    updateLoadingProgress(asset, loaded, total) {
        const progress = (loaded / total) * 100;
        
        // Emit progress event
        window.dispatchEvent(new CustomEvent('asset-load-progress', {
            detail: {
                asset: asset.url,
                progress,
                loaded,
                total
            }
        }));
    }
    
    generateFallbackManifest(chapterId) {
        return {
            chapterId,
            assets: [
                {
                    type: 'style',
                    url: 'styles-v2.css',
                    critical: true
                },
                {
                    type: 'script',
                    url: 'three.min.js',
                    critical: true
                }
            ]
        };
    }
    
    isWebGLSupported() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }
    
    isAudioSupported() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }
    
    getWebGLAssets() {
        return [
            { type: 'shader', url: 'shaders/vertex.glsl', critical: false },
            { type: 'shader', url: 'shaders/fragment.glsl', critical: false }
        ];
    }
    
    getAudioAssets() {
        return [
            { type: 'audio', url: 'audio/ambient.mp3', critical: false }
        ];
    }
    
    getResponsiveImageAssets(images) {
        return images.flatMap(img => [
            { ...img, url: img.url.replace('.jpg', '@1x.jpg'), quality: 'low' },
            { ...img, url: img.url.replace('.jpg', '@2x.jpg'), quality: 'high' }
        ]);
    }
    
    detectCapabilities() {
        this.capabilities = {
            webgl: this.isWebGLSupported(),
            audio: this.isAudioSupported(),
            serviceWorker: 'serviceWorker' in navigator,
            intersectionObserver: 'IntersectionObserver' in window,
            webp: this.detectWebPSupport(),
            avif: this.detectAVIFSupport()
        };
    }
    
    detectWebPSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('webp') > 0;
    }
    
    detectAVIFSupport() {
        // Simplified AVIF detection
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
        });
    }
    
    // Public API
    async loadChapter(chapterId) {
        return this.loadChapterAssets(chapterId);
    }
    
    preloadChapter(chapterId) {
        this.preloadQueue.enqueue({
            type: 'chapter',
            chapterId,
            priority: 'low'
        });
        
        this.processPreloadQueue();
    }
    
    clearCache() {
        this.sessionCache.clear();
        this.loadedAssets.clear();
        this.failedAssets.clear();
    }
    
    getLoadingStats() {
        return {
            strategy: this.loadStrategy.type,
            loadedAssets: this.loadedAssets.size,
            failedAssets: this.failedAssets.size,
            memoryBudget: this.memoryBudget,
            networkQuality: this.networkMonitor.getQuality()
        };
    }
}

// Priority Queue for asset loading
class PriorityQueue {
    constructor() {
        this.items = [];
    }
    
    enqueue(item) {
        const priority = this.getPriorityValue(item.priority);
        const index = this.items.findIndex(i => 
            this.getPriorityValue(i.priority) < priority);
        
        if (index === -1) {
            this.items.push(item);
        } else {
            this.items.splice(index, 0, item);
        }
    }
    
    dequeue() {
        return this.items.shift();
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
    
    getPriorityValue(priority) {
        const values = { critical: 3, high: 2, normal: 1, low: 0, preload: -1 };
        return values[priority] || 1;
    }
}

// Network Monitor
class NetworkMonitor {
    constructor() {
        this.connection = navigator.connection || {};
        this.callbacks = new Map();
        this.quality = 'unknown';
        
        this.init();
    }
    
    init() {
        if (this.connection.addEventListener) {
            this.connection.addEventListener('change', () => {
                this.handleConnectionChange();
            });
        }
        
        this.updateQuality();
    }
    
    handleConnectionChange() {
        this.updateQuality();
        this.emit('connection-change', this.connection);
    }
    
    updateQuality() {
        const oldQuality = this.quality;
        this.quality = this.assessQuality();
        
        if (oldQuality !== this.quality) {
            if (this.quality === 'poor' || this.quality === 'fair') {
                this.emit('slow-connection');
            } else {
                this.emit('fast-connection');
            }
        }
    }
    
    assessQuality() {
        const effectiveType = this.connection.effectiveType || '4g';
        const downlink = this.connection.downlink || 10;
        
        if (effectiveType === 'slow-2g' || downlink < 0.5) return 'poor';
        if (effectiveType === '2g' || downlink < 1) return 'fair';
        if (effectiveType === '3g' || downlink < 5) return 'good';
        return 'excellent';
    }
    
    isSlowConnection() {
        return this.quality === 'poor' || this.quality === 'fair';
    }
    
    getQuality() {
        return this.quality;
    }
    
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => callback(data));
        }
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = [];
        
        this.init();
    }
    
    init() {
        // Monitor resource loading
        if ('PerformanceObserver' in window) {
            this.setupResourceObserver();
            this.setupNavigationObserver();
        }
    }
    
    setupResourceObserver() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                this.recordResourceMetric(entry);
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
        this.observers.push(observer);
    }
    
    setupNavigationObserver() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                this.recordNavigationMetric(entry);
            });
        });
        
        observer.observe({ entryTypes: ['navigation'] });
        this.observers.push(observer);
    }
    
    recordResourceMetric(entry) {
        this.metrics.set(entry.name, {
            duration: entry.duration,
            size: entry.transferSize,
            cached: entry.transferSize === 0,
            type: entry.initiatorType
        });
    }
    
    recordNavigationMetric(entry) {
        this.metrics.set('navigation', {
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart,
            firstPaint: entry.firstPaint,
            firstContentfulPaint: entry.firstContentfulPaint
        });
    }
    
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
    
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartAssetLoader;
}

// Initialize if in browser
if (typeof window !== 'undefined') {
    window.SmartAssetLoader = SmartAssetLoader;
}