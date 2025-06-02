// Production Error Handler with Comprehensive Monitoring
// Provides robust error handling, recovery strategies, and user feedback

class ProductionErrorHandler {
    constructor(options = {}) {
        this.options = {
            enableMonitoring: true,
            enableRecovery: true,
            maxErrorsPerMinute: 10,
            errorReportingEndpoint: null,
            enableLocalStorage: true,
            enableOfflineQueue: true,
            userFeedbackEnabled: true,
            ...options
        };
        
        this.errorQueue = [];
        this.errorPatterns = new ErrorPatternAnalyzer();
        this.recoveryStrategies = new Map();
        this.userFeedback = new FeedbackCollector();
        this.errorStats = {
            total: 0,
            byType: new Map(),
            bySeverity: new Map(),
            recovered: 0,
            unrecovered: 0
        };
        
        this.init();
    }
    
    init() {
        this.setupGlobalErrorHandlers();
        this.setupRecoveryStrategies();
        this.loadStoredErrors();
        this.startMonitoring();
        this.injectErrorStyles();
    }
    
    setupGlobalErrorHandlers() {
        // Window error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript-error',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error,
                timestamp: Date.now()
            }, 'window-error');
            
            event.preventDefault();
        });
        
        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'unhandled-promise',
                message: event.reason?.message || String(event.reason),
                promise: event.promise,
                reason: event.reason,
                timestamp: Date.now()
            }, 'promise-rejection');
            
            event.preventDefault();
        });
        
        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'resource-error',
                    tagName: event.target.tagName,
                    source: event.target.src || event.target.href,
                    message: `Failed to load ${event.target.tagName}`,
                    timestamp: Date.now()
                }, 'resource-loading');
            }
        }, true);
        
        // WebGL context loss
        document.addEventListener('webglcontextlost', (event) => {
            this.handleError({
                type: 'webgl-context-lost',
                canvas: event.target,
                message: 'WebGL context lost',
                timestamp: Date.now()
            }, 'webgl-error');
            
            event.preventDefault();
        });
        
        // Network errors
        if ('onLine' in navigator) {
            window.addEventListener('offline', () => {
                this.handleError({
                    type: 'network-offline',
                    message: 'Network connection lost',
                    timestamp: Date.now()
                }, 'network-error');
            });
        }
        
        // Memory pressure (if available)
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
                
                if (usageRatio > 0.9) {
                    this.handleError({
                        type: 'memory-pressure',
                        message: 'High memory usage detected',
                        usage: memory.usedJSHeapSize,
                        limit: memory.jsHeapSizeLimit,
                        ratio: usageRatio,
                        timestamp: Date.now()
                    }, 'performance-error');
                }
            }, 30000); // Check every 30 seconds
        }
    }
    
    setupRecoveryStrategies() {
        // WebGL context recovery
        this.recoveryStrategies.set('webgl-context-lost', {
            canRecover: true,
            strategy: async (error) => {
                const canvas = error.canvas;
                if (!canvas) return false;
                
                // Wait for context to be restored
                return new Promise((resolve) => {
                    const handleRestore = (event) => {
                        canvas.removeEventListener('webglcontextrestored', handleRestore);
                        
                        // Reinitialize WebGL resources
                        window.dispatchEvent(new CustomEvent('webgl-context-restored', {
                            detail: { canvas }
                        }));
                        
                        resolve(true);
                    };
                    
                    canvas.addEventListener('webglcontextrestored', handleRestore);
                    
                    // Timeout after 5 seconds
                    setTimeout(() => {
                        canvas.removeEventListener('webglcontextrestored', handleRestore);
                        resolve(false);
                    }, 5000);
                });
            }
        });
        
        // Network error recovery
        this.recoveryStrategies.set('network-error', {
            canRecover: true,
            strategy: async (error) => {
                // Implement exponential backoff retry
                let retries = 0;
                const maxRetries = 3;
                
                while (retries < maxRetries) {
                    await this.delay(Math.pow(2, retries) * 1000);
                    
                    if (navigator.onLine) {
                        // Network restored
                        window.dispatchEvent(new CustomEvent('network-restored'));
                        return true;
                    }
                    
                    retries++;
                }
                
                return false;
            }
        });
        
        // Memory error recovery
        this.recoveryStrategies.set('memory-error', {
            canRecover: true,
            strategy: async (error) => {
                // Clear caches
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                }
                
                // Clear image caches
                document.querySelectorAll('img').forEach(img => {
                    if (img.src.startsWith('blob:')) {
                        URL.revokeObjectURL(img.src);
                    }
                });
                
                // Trigger garbage collection if available
                if (window.gc) {
                    window.gc();
                }
                
                // Dispatch memory cleanup event
                window.dispatchEvent(new CustomEvent('memory-cleanup'));
                
                // Check if memory usage improved
                await this.delay(1000);
                
                if (performance.memory) {
                    const newRatio = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
                    return newRatio < 0.8;
                }
                
                return true;
            }
        });
        
        // Resource loading error recovery
        this.recoveryStrategies.set('resource-error', {
            canRecover: true,
            strategy: async (error) => {
                const element = document.querySelector(`[src="${error.source}"], [href="${error.source}"]`);
                if (!element) return false;
                
                // Try alternative sources
                const alternatives = this.getAlternativeResources(error.source);
                
                for (const alt of alternatives) {
                    try {
                        if (element.tagName === 'SCRIPT') {
                            await this.loadScript(alt);
                        } else if (element.tagName === 'LINK') {
                            await this.loadStylesheet(alt);
                        } else if (element.tagName === 'IMG') {
                            await this.loadImage(element, alt);
                        }
                        
                        return true;
                    } catch (e) {
                        continue;
                    }
                }
                
                return false;
            }
        });
        
        // Generic JavaScript error recovery
        this.recoveryStrategies.set('javascript-error', {
            canRecover: false,
            strategy: async (error) => {
                // Log for debugging but can't auto-recover
                console.error('JavaScript error:', error);
                return false;
            }
        });
    }
    
    handleError(error, context) {
        // Add to queue
        this.errorQueue.push({ error, context, timestamp: Date.now() });
        
        // Update statistics
        this.updateErrorStats(error);
        
        // Check for error flooding
        if (this.isErrorFlooding()) {
            this.handleErrorFlooding();
            return;
        }
        
        // Categorize severity
        const severity = this.categorizeSeverity(error);
        
        // Log error
        this.logError(error, context, severity);
        
        // Analyze patterns
        this.errorPatterns.analyzeError(error, context);
        
        // Show user message
        this.showUserMessage(severity, error, context);
        
        // Attempt recovery
        if (this.options.enableRecovery && this.canRecover(error)) {
            this.attemptRecovery(error, context);
        }
        
        // Report to monitoring service
        if (this.options.errorReportingEndpoint) {
            this.reportError(error, context, severity);
        }
        
        // Store for offline analysis
        if (this.options.enableLocalStorage) {
            this.storeError(error, context, severity);
        }
    }
    
    categorizeSeverity(error) {
        // Critical errors that break core functionality
        if (error.type === 'webgl-context-lost' ||
            error.type === 'memory-pressure' && error.ratio > 0.95) {
            return 'critical';
        }
        
        // High severity errors that affect user experience
        if (error.type === 'javascript-error' && error.source?.includes('core') ||
            error.type === 'network-offline' ||
            error.type === 'resource-error' && error.tagName === 'SCRIPT') {
            return 'high';
        }
        
        // Medium severity errors
        if (error.type === 'resource-error' ||
            error.type === 'unhandled-promise') {
            return 'medium';
        }
        
        // Low severity errors
        return 'low';
    }
    
    updateErrorStats(error) {
        this.errorStats.total++;
        
        // By type
        const typeCount = this.errorStats.byType.get(error.type) || 0;
        this.errorStats.byType.set(error.type, typeCount + 1);
        
        // By severity
        const severity = this.categorizeSeverity(error);
        const severityCount = this.errorStats.bySeverity.get(severity) || 0;
        this.errorStats.bySeverity.set(severity, severityCount + 1);
    }
    
    isErrorFlooding() {
        const recentErrors = this.errorQueue.filter(e => 
            Date.now() - e.timestamp < 60000 // Last minute
        );
        
        return recentErrors.length > this.options.maxErrorsPerMinute;
    }
    
    handleErrorFlooding() {
        // Show single message instead of flooding user
        if (!this.floodingMessageShown) {
            this.showUserMessage('high', {
                type: 'error-flooding',
                message: 'Multiple errors detected. The application may be unstable.'
            }, 'flooding');
            
            this.floodingMessageShown = true;
            
            // Reset after 5 minutes
            setTimeout(() => {
                this.floodingMessageShown = false;
            }, 300000);
        }
        
        // Clear old errors to prevent memory issues
        this.errorQueue = this.errorQueue.slice(-50);
    }
    
    showUserMessage(severity, error, context) {
        const messages = {
            critical: {
                title: 'Critical Error',
                message: 'A critical error has occurred. The application may not function correctly.',
                icon: '🚨',
                actions: ['Reload Page', 'Report Issue']
            },
            high: {
                title: 'Error Detected',
                message: 'Something went wrong. We\'re trying to fix it automatically.',
                icon: '⚠️',
                actions: ['Retry', 'Dismiss']
            },
            medium: {
                title: 'Minor Issue',
                message: 'Some features may not work as expected.',
                icon: 'ℹ️',
                actions: ['Dismiss']
            },
            low: {
                // Silent - no user message
            }
        };
        
        const config = messages[severity];
        if (!config) return;
        
        // Create error notification
        const notification = this.createErrorNotification(config, error);
        
        // Handle actions
        notification.querySelectorAll('button').forEach((button, index) => {
            button.addEventListener('click', () => {
                switch (config.actions[index]) {
                    case 'Reload Page':
                        window.location.reload();
                        break;
                    case 'Report Issue':
                        this.showReportIssueDialog(error);
                        break;
                    case 'Retry':
                        this.attemptRecovery(error, context);
                        notification.remove();
                        break;
                    case 'Dismiss':
                        notification.remove();
                        break;
                }
            });
        });
    }
    
    createErrorNotification(config, error) {
        // Remove existing notifications of same type
        document.querySelectorAll('.error-notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `error-notification error-${config.title.toLowerCase().replace(' ', '-')}`;
        notification.innerHTML = `
            <div class="error-icon">${config.icon}</div>
            <div class="error-content">
                <div class="error-title">${config.title}</div>
                <div class="error-message">${config.message}</div>
                ${error.type === 'network-offline' ? '<div class="error-detail">Check your internet connection</div>' : ''}
            </div>
            <div class="error-actions">
                ${config.actions.map(action => 
                    `<button class="error-action">${action}</button>`
                ).join('')}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('visible'), 10);
        
        // Auto-dismiss medium severity after 10 seconds
        if (config.title === 'Minor Issue') {
            setTimeout(() => {
                notification.classList.remove('visible');
                setTimeout(() => notification.remove(), 300);
            }, 10000);
        }
        
        return notification;
    }
    
    showReportIssueDialog(error) {
        const dialog = document.createElement('div');
        dialog.className = 'error-report-dialog';
        dialog.innerHTML = `
            <div class="dialog-backdrop"></div>
            <div class="dialog-content">
                <h2>Report Issue</h2>
                <p>Help us improve by describing what happened:</p>
                <textarea placeholder="What were you doing when this error occurred?" rows="4"></textarea>
                <div class="dialog-error-info">
                    <strong>Error Type:</strong> ${error.type}<br>
                    <strong>Message:</strong> ${error.message || 'Unknown error'}
                </div>
                <div class="dialog-actions">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-submit">Send Report</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Handle actions
        dialog.querySelector('.btn-cancel').onclick = () => dialog.remove();
        dialog.querySelector('.btn-submit').onclick = () => {
            const description = dialog.querySelector('textarea').value;
            this.submitErrorReport(error, description);
            dialog.remove();
            this.showThankYouMessage();
        };
        
        dialog.querySelector('.dialog-backdrop').onclick = () => dialog.remove();
    }
    
    canRecover(error) {
        const strategy = this.recoveryStrategies.get(error.type);
        return strategy?.canRecover || false;
    }
    
    async attemptRecovery(error, context) {
        const strategy = this.recoveryStrategies.get(error.type);
        if (!strategy || !strategy.canRecover) return false;
        
        console.log(`Attempting recovery for ${error.type}...`);
        
        try {
            const recovered = await strategy.strategy(error);
            
            if (recovered) {
                this.errorStats.recovered++;
                console.log(`Successfully recovered from ${error.type}`);
                this.showRecoverySuccess(error.type);
                return true;
            } else {
                this.errorStats.unrecovered++;
                console.log(`Failed to recover from ${error.type}`);
                return false;
            }
        } catch (recoveryError) {
            console.error('Recovery strategy failed:', recoveryError);
            this.errorStats.unrecovered++;
            return false;
        }
    }
    
    showRecoverySuccess(errorType) {
        const message = {
            'webgl-context-lost': 'Graphics restored successfully',
            'network-error': 'Connection restored',
            'memory-error': 'Memory optimized',
            'resource-error': 'Resource loaded successfully'
        }[errorType] || 'Issue resolved';
        
        const notification = document.createElement('div');
        notification.className = 'recovery-notification';
        notification.innerHTML = `
            <div class="recovery-icon">✅</div>
            <div class="recovery-message">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('visible'), 10);
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    getAlternativeResources(originalUrl) {
        const alternatives = [];
        
        // CDN fallbacks
        if (originalUrl.includes('cdnjs.cloudflare.com')) {
            alternatives.push(originalUrl.replace('cdnjs.cloudflare.com', 'cdn.jsdelivr.net'));
        }
        
        // Local fallbacks
        if (originalUrl.startsWith('http')) {
            const filename = originalUrl.split('/').pop();
            alternatives.push(`/local/${filename}`);
        }
        
        // Version fallbacks
        const versionMatch = originalUrl.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
            const version = versionMatch[1];
            const parts = version.split('.');
            const minorVersion = `${parts[0]}.${parts[1]}.0`;
            alternatives.push(originalUrl.replace(version, minorVersion));
        }
        
        return alternatives;
    }
    
    async loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    async loadStylesheet(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }
    
    async loadImage(img, url) {
        return new Promise((resolve, reject) => {
            const testImg = new Image();
            testImg.onload = () => {
                img.src = url;
                resolve();
            };
            testImg.onerror = reject;
            testImg.src = url;
        });
    }
    
    logError(error, context, severity) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            severity,
            type: error.type,
            message: error.message,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...error
        };
        
        // Console logging with appropriate level
        switch (severity) {
            case 'critical':
            case 'high':
                console.error('[ERROR]', logEntry);
                break;
            case 'medium':
                console.warn('[WARNING]', logEntry);
                break;
            case 'low':
                console.log('[INFO]', logEntry);
                break;
        }
        
        // Custom logging event
        window.dispatchEvent(new CustomEvent('error-logged', { detail: logEntry }));
    }
    
    reportError(error, context, severity) {
        if (!navigator.onLine && this.options.enableOfflineQueue) {
            this.queueErrorReport(error, context, severity);
            return;
        }
        
        const report = {
            timestamp: Date.now(),
            severity,
            error: {
                type: error.type,
                message: error.message,
                stack: error.error?.stack,
                ...error
            },
            context,
            browser: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                screen: {
                    width: screen.width,
                    height: screen.height,
                    pixelRatio: window.devicePixelRatio
                }
            },
            page: {
                url: window.location.href,
                referrer: document.referrer,
                title: document.title
            },
            performance: this.getPerformanceMetrics(),
            session: {
                id: this.getSessionId(),
                duration: Date.now() - (window.sessionStartTime || Date.now())
            }
        };
        
        // Send to monitoring endpoint
        fetch(this.options.errorReportingEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report)
        }).catch(err => {
            console.error('Failed to report error:', err);
            if (this.options.enableOfflineQueue) {
                this.queueErrorReport(error, context, severity);
            }
        });
    }
    
    queueErrorReport(error, context, severity) {
        const queue = this.getOfflineQueue();
        queue.push({ error, context, severity, timestamp: Date.now() });
        this.saveOfflineQueue(queue);
    }
    
    getOfflineQueue() {
        try {
            const stored = localStorage.getItem('error-report-queue');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveOfflineQueue(queue) {
        try {
            // Limit queue size
            const limited = queue.slice(-100);
            localStorage.setItem('error-report-queue', JSON.stringify(limited));
        } catch (e) {
            console.warn('Failed to save error queue:', e);
        }
    }
    
    storeError(error, context, severity) {
        try {
            const errors = this.getStoredErrors();
            errors.push({
                error: this.serializeError(error),
                context,
                severity,
                timestamp: Date.now()
            });
            
            // Keep only last 50 errors
            const limited = errors.slice(-50);
            localStorage.setItem('stored-errors', JSON.stringify(limited));
        } catch (e) {
            console.warn('Failed to store error:', e);
        }
    }
    
    getStoredErrors() {
        try {
            const stored = localStorage.getItem('stored-errors');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
    
    serializeError(error) {
        const serialized = {};
        
        // Serialize all enumerable properties
        for (const key in error) {
            if (error.hasOwnProperty(key)) {
                try {
                    if (error[key] instanceof Error) {
                        serialized[key] = {
                            name: error[key].name,
                            message: error[key].message,
                            stack: error[key].stack
                        };
                    } else if (typeof error[key] === 'object' && error[key] !== null) {
                        serialized[key] = JSON.parse(JSON.stringify(error[key]));
                    } else {
                        serialized[key] = error[key];
                    }
                } catch (e) {
                    serialized[key] = String(error[key]);
                }
            }
        }
        
        return serialized;
    }
    
    loadStoredErrors() {
        const errors = this.getStoredErrors();
        
        // Process stored errors on startup
        errors.forEach(({ error, context, severity }) => {
            this.errorStats.total++;
            
            const typeCount = this.errorStats.byType.get(error.type) || 0;
            this.errorStats.byType.set(error.type, typeCount + 1);
            
            const severityCount = this.errorStats.bySeverity.get(severity) || 0;
            this.errorStats.bySeverity.set(severity, severityCount + 1);
        });
    }
    
    getPerformanceMetrics() {
        const metrics = {};
        
        if (performance.memory) {
            metrics.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        
        if (performance.timing) {
            const timing = performance.timing;
            metrics.timing = {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstByte: timing.responseStart - timing.navigationStart
            };
        }
        
        return metrics;
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem('error-session-id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('error-session-id', sessionId);
        }
        return sessionId;
    }
    
    submitErrorReport(error, userDescription) {
        const report = {
            error: this.serializeError(error),
            userDescription,
            timestamp: Date.now(),
            sessionId: this.getSessionId()
        };
        
        if (this.options.errorReportingEndpoint) {
            fetch(this.options.errorReportingEndpoint + '/user-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report)
            }).catch(err => {
                console.error('Failed to submit user report:', err);
            });
        }
        
        // Store locally as well
        try {
            const reports = JSON.parse(localStorage.getItem('user-error-reports') || '[]');
            reports.push(report);
            localStorage.setItem('user-error-reports', JSON.stringify(reports.slice(-20)));
        } catch (e) {
            console.warn('Failed to store user report:', e);
        }
    }
    
    showThankYouMessage() {
        const message = document.createElement('div');
        message.className = 'thank-you-message';
        message.textContent = 'Thank you for your feedback!';
        document.body.appendChild(message);
        
        setTimeout(() => message.classList.add('visible'), 10);
        setTimeout(() => {
            message.classList.remove('visible');
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
    
    startMonitoring() {
        if (!this.options.enableMonitoring) return;
        
        // Send queued errors when online
        window.addEventListener('online', () => {
            this.processOfflineQueue();
        });
        
        // Periodic health check
        setInterval(() => {
            this.performHealthCheck();
        }, 60000); // Every minute
        
        // Clean old errors periodically
        setInterval(() => {
            this.cleanOldErrors();
        }, 300000); // Every 5 minutes
    }
    
    processOfflineQueue() {
        const queue = this.getOfflineQueue();
        if (queue.length === 0) return;
        
        console.log(`Processing ${queue.length} queued error reports...`);
        
        queue.forEach(({ error, context, severity }) => {
            this.reportError(error, context, severity);
        });
        
        // Clear queue
        try {
            localStorage.removeItem('error-report-queue');
        } catch (e) {
            console.warn('Failed to clear error queue:', e);
        }
    }
    
    performHealthCheck() {
        const health = {
            errorRate: this.calculateErrorRate(),
            memoryUsage: this.getMemoryUsage(),
            performance: this.getPerformanceScore(),
            stability: this.getStabilityScore()
        };
        
        // Emit health status
        window.dispatchEvent(new CustomEvent('app-health-check', { detail: health }));
        
        // Show warning if unhealthy
        if (health.stability < 0.7 || health.errorRate > 0.1) {
            this.showHealthWarning(health);
        }
    }
    
    calculateErrorRate() {
        const recentErrors = this.errorQueue.filter(e => 
            Date.now() - e.timestamp < 300000 // Last 5 minutes
        );
        
        return recentErrors.length / 5; // Errors per minute
    }
    
    getMemoryUsage() {
        if (!performance.memory) return null;
        
        return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
            percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        };
    }
    
    getPerformanceScore() {
        // Simple performance score based on page load time
        if (!performance.timing) return 1;
        
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        
        if (loadTime < 1000) return 1;
        if (loadTime < 3000) return 0.8;
        if (loadTime < 5000) return 0.6;
        if (loadTime < 10000) return 0.4;
        return 0.2;
    }
    
    getStabilityScore() {
        const totalErrors = this.errorStats.total;
        const recovered = this.errorStats.recovered;
        const critical = this.errorStats.bySeverity.get('critical') || 0;
        
        if (totalErrors === 0) return 1;
        
        const recoveryRate = recovered / totalErrors;
        const criticalRate = critical / totalErrors;
        
        return Math.max(0, (recoveryRate * 0.7) + ((1 - criticalRate) * 0.3));
    }
    
    showHealthWarning(health) {
        console.warn('Application health warning:', health);
        
        // Don't show too many warnings
        if (this.lastHealthWarning && Date.now() - this.lastHealthWarning < 300000) {
            return;
        }
        
        this.lastHealthWarning = Date.now();
        
        const warning = document.createElement('div');
        warning.className = 'health-warning';
        warning.innerHTML = `
            <div class="warning-icon">⚠️</div>
            <div class="warning-message">
                The application is experiencing issues. 
                ${health.errorRate > 0.1 ? 'High error rate detected. ' : ''}
                ${health.stability < 0.7 ? 'Stability compromised. ' : ''}
                Consider refreshing the page.
            </div>
            <button class="warning-dismiss">Dismiss</button>
        `;
        
        document.body.appendChild(warning);
        
        warning.querySelector('.warning-dismiss').onclick = () => warning.remove();
        
        setTimeout(() => warning.classList.add('visible'), 10);
    }
    
    cleanOldErrors() {
        // Remove errors older than 30 minutes
        const cutoff = Date.now() - 1800000;
        this.errorQueue = this.errorQueue.filter(e => e.timestamp > cutoff);
        
        // Clean stored errors
        try {
            const stored = this.getStoredErrors();
            const recent = stored.filter(e => e.timestamp > cutoff);
            localStorage.setItem('stored-errors', JSON.stringify(recent));
        } catch (e) {
            console.warn('Failed to clean stored errors:', e);
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    injectErrorStyles() {
        if (document.getElementById('error-handler-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'error-handler-styles';
        styles.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--bg-elevated, #1a1a1a);
                border: 1px solid var(--border-color, #333);
                border-radius: 12px;
                padding: 20px;
                max-width: 400px;
                display: flex;
                gap: 16px;
                align-items: flex-start;
                opacity: 0;
                transform: translateY(-20px);
                transition: all 0.3s ease;
                z-index: 10000;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .error-notification.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .error-critical-error {
                border-color: var(--error, #ff6b6b);
                background: rgba(255, 107, 107, 0.1);
            }
            
            .error-icon {
                font-size: 24px;
                line-height: 1;
            }
            
            .error-content {
                flex: 1;
            }
            
            .error-title {
                font-weight: 600;
                margin-bottom: 4px;
                color: var(--text-primary, #fff);
            }
            
            .error-message {
                font-size: 14px;
                color: var(--text-secondary, #999);
                line-height: 1.5;
            }
            
            .error-detail {
                font-size: 12px;
                color: var(--text-tertiary, #666);
                margin-top: 8px;
            }
            
            .error-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }
            
            .error-action {
                padding: 6px 12px;
                background: var(--accent-primary, #ffd700);
                color: var(--bg-primary, #000);
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: opacity 0.2s;
            }
            
            .error-action:hover {
                opacity: 0.8;
            }
            
            .recovery-notification {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: rgba(0, 255, 0, 0.1);
                border: 1px solid rgba(0, 255, 0, 0.3);
                border-radius: 8px;
                padding: 12px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 9999;
            }
            
            .recovery-notification.visible {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            
            .recovery-icon {
                font-size: 20px;
            }
            
            .recovery-message {
                color: var(--text-primary, #fff);
                font-size: 14px;
            }
            
            .error-report-dialog {
                position: fixed;
                inset: 0;
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .dialog-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
            }
            
            .dialog-content {
                position: relative;
                background: var(--bg-primary, #000);
                border: 1px solid var(--border-color, #333);
                border-radius: 12px;
                padding: 24px;
                max-width: 500px;
                width: 90%;
            }
            
            .dialog-content h2 {
                margin-bottom: 16px;
                color: var(--text-primary, #fff);
            }
            
            .dialog-content p {
                margin-bottom: 16px;
                color: var(--text-secondary, #999);
            }
            
            .dialog-content textarea {
                width: 100%;
                background: var(--bg-secondary, #1a1a1a);
                border: 1px solid var(--border-color, #333);
                border-radius: 8px;
                padding: 12px;
                color: var(--text-primary, #fff);
                resize: vertical;
                margin-bottom: 16px;
            }
            
            .dialog-error-info {
                background: var(--bg-secondary, #1a1a1a);
                border-radius: 8px;
                padding: 12px;
                font-size: 12px;
                color: var(--text-secondary, #999);
                margin-bottom: 20px;
            }
            
            .dialog-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }
            
            .btn-cancel {
                padding: 8px 16px;
                background: transparent;
                border: 1px solid var(--border-color, #333);
                border-radius: 6px;
                color: var(--text-primary, #fff);
                cursor: pointer;
            }
            
            .btn-submit {
                padding: 8px 16px;
                background: var(--accent-primary, #ffd700);
                border: none;
                border-radius: 6px;
                color: var(--bg-primary, #000);
                font-weight: 500;
                cursor: pointer;
            }
            
            .thank-you-message {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: var(--bg-elevated, #1a1a1a);
                border: 1px solid var(--accent-primary, #ffd700);
                border-radius: 8px;
                padding: 12px 24px;
                color: var(--text-primary, #fff);
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 9999;
            }
            
            .thank-you-message.visible {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            
            .health-warning {
                position: fixed;
                top: 80px;
                right: 20px;
                background: rgba(255, 193, 7, 0.1);
                border: 1px solid rgba(255, 193, 7, 0.3);
                border-radius: 12px;
                padding: 16px;
                max-width: 350px;
                display: flex;
                gap: 12px;
                opacity: 0;
                transform: translateY(-20px);
                transition: all 0.3s ease;
                z-index: 9998;
            }
            
            .health-warning.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .warning-icon {
                font-size: 20px;
            }
            
            .warning-message {
                flex: 1;
                font-size: 14px;
                color: var(--text-primary, #fff);
                line-height: 1.5;
            }
            
            .warning-dismiss {
                padding: 4px 8px;
                background: transparent;
                border: 1px solid rgba(255, 193, 7, 0.3);
                border-radius: 4px;
                color: var(--text-primary, #fff);
                font-size: 12px;
                cursor: pointer;
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // Public API
    getErrorStats() {
        return {
            total: this.errorStats.total,
            byType: Object.fromEntries(this.errorStats.byType),
            bySeverity: Object.fromEntries(this.errorStats.bySeverity),
            recovered: this.errorStats.recovered,
            unrecovered: this.errorStats.unrecovered,
            recoveryRate: this.errorStats.total > 0 
                ? this.errorStats.recovered / this.errorStats.total 
                : 0
        };
    }
    
    getHealthStatus() {
        return {
            healthy: this.getStabilityScore() > 0.8,
            errorRate: this.calculateErrorRate(),
            memoryUsage: this.getMemoryUsage(),
            performance: this.getPerformanceScore(),
            stability: this.getStabilityScore()
        };
    }
    
    clearErrors() {
        this.errorQueue = [];
        this.errorStats = {
            total: 0,
            byType: new Map(),
            bySeverity: new Map(),
            recovered: 0,
            unrecovered: 0
        };
        
        try {
            localStorage.removeItem('stored-errors');
            localStorage.removeItem('error-report-queue');
            localStorage.removeItem('user-error-reports');
        } catch (e) {
            console.warn('Failed to clear stored errors:', e);
        }
    }
    
    testError(severity = 'medium') {
        this.handleError({
            type: 'test-error',
            message: 'This is a test error for demonstration',
            timestamp: Date.now()
        }, 'test');
    }
    
    destroy() {
        // Remove event listeners
        // This would be more complex in a real implementation
        console.log('Error handler destroyed');
    }
}

// Error Pattern Analyzer
class ErrorPatternAnalyzer {
    constructor() {
        this.patterns = new Map();
        this.sequences = [];
    }
    
    analyzeError(error, context) {
        // Track error patterns
        const key = `${error.type}:${context}`;
        const count = this.patterns.get(key) || 0;
        this.patterns.set(key, count + 1);
        
        // Track error sequences
        this.sequences.push({ error, context, timestamp: Date.now() });
        if (this.sequences.length > 100) {
            this.sequences.shift();
        }
        
        // Detect patterns
        this.detectPatterns();
    }
    
    detectPatterns() {
        // Look for repeating sequences
        // This would implement pattern detection algorithms
    }
    
    getPatterns() {
        return Object.fromEntries(this.patterns);
    }
}

// Feedback Collector
class FeedbackCollector {
    constructor() {
        this.feedback = [];
    }
    
    collect(error, userFeedback) {
        this.feedback.push({
            error,
            feedback: userFeedback,
            timestamp: Date.now()
        });
    }
    
    getFeedback() {
        return this.feedback;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionErrorHandler;
}