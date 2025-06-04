/**
 * Network Error Handler - Phase 5 Error Handling
 * Comprehensive network request error handling and recovery
 */

class NetworkErrorHandler {
    constructor() {
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.requestQueue = [];
        this.isOnline = navigator.onLine;
        this.failedRequests = new Map();
        
        this.init();
    }
    
    init() {
        // Monitor network status
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        
        // Intercept fetch requests
        this.interceptFetch();
        
        console.log('Network error handling initialized');
    }
    
    // Handle coming online
    handleOnline() {
        console.log('Network connection restored');
        this.isOnline = true;
        
        AionUtils.errors.show('Connection restored', 'success');
        
        // Retry failed requests
        this.retryFailedRequests();
    }
    
    // Handle going offline
    handleOffline() {
        console.log('Network connection lost');
        this.isOnline = false;
        
        AionUtils.errors.show('No internet connection. Some features may not work.', 'warning');
    }
    
    // Intercept fetch requests for error handling
    interceptFetch() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            return this.fetchWithErrorHandling(url, options, originalFetch);
        };
    }
    
    // Fetch with comprehensive error handling
    async fetchWithErrorHandling(url, options, originalFetch) {
        const requestId = this.generateRequestId();
        const maxRetries = options.maxRetries || this.retryAttempts;
        let attempt = 0;
        
        while (attempt <= maxRetries) {
            try {
                // Check if online
                if (!this.isOnline) {
                    throw new Error('No internet connection');
                }
                
                // Add timeout if not specified
                const timeoutController = new AbortController();
                const timeout = options.timeout || 10000;
                
                const timeoutId = setTimeout(() => {
                    timeoutController.abort();
                }, timeout);
                
                // Merge abort signals
                const signal = options.signal 
                    ? this.mergeAbortSignals([options.signal, timeoutController.signal])
                    : timeoutController.signal;
                
                // Make request
                const response = await originalFetch(url, {
                    ...options,
                    signal
                });
                
                clearTimeout(timeoutId);
                
                // Check response status
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Remove from failed requests if successful
                this.failedRequests.delete(requestId);
                
                return response;
                
            } catch (error) {
                attempt++;
                
                // Log the error
                console.warn(`Request failed (attempt ${attempt}/${maxRetries + 1}):`, url, error.message);
                
                // Check if should retry
                if (attempt <= maxRetries && this.shouldRetry(error)) {
                    // Store failed request for retry
                    this.failedRequests.set(requestId, {
                        url,
                        options,
                        originalFetch,
                        attempts: attempt
                    });
                    
                    // Wait before retry
                    await this.delay(this.retryDelay * attempt);
                    continue;
                }
                
                // Final failure - handle based on error type
                this.handleFinalError(error, url, options);
                throw error;
            }
        }
    }
    
    // Check if error should trigger retry
    shouldRetry(error) {
        // Don't retry on these conditions
        if (error.name === 'AbortError') return false;
        if (error.message.includes('403') || error.message.includes('404')) return false;
        
        // Retry on network errors, timeouts, and server errors
        return error.message.includes('Failed to fetch') ||
               error.message.includes('timeout') ||
               error.message.includes('5');
    }
    
    // Handle final error after all retries
    handleFinalError(error, url, options) {
        let userMessage = 'Network request failed';
        
        if (error.name === 'AbortError') {
            userMessage = 'Request was cancelled';
        } else if (error.message.includes('timeout')) {
            userMessage = 'Request timed out';
        } else if (error.message.includes('Failed to fetch')) {
            userMessage = 'Unable to connect to server';
        } else if (error.message.includes('404')) {
            userMessage = 'Requested content not found';
        } else if (error.message.includes('403')) {
            userMessage = 'Access denied';
        } else if (error.message.includes('5')) {
            userMessage = 'Server error occurred';
        }
        
        // Show user-friendly error
        if (!options.silent) {
            AionUtils.errors.show(userMessage, 'error');
        }
        
        // Log detailed error
        AionUtils.errors.log(error, `Network request to ${url}`);
    }
    
    // Retry failed requests when coming back online
    async retryFailedRequests() {
        const requests = Array.from(this.failedRequests.entries());
        
        for (const [requestId, requestData] of requests) {
            try {
                const { url, options, originalFetch } = requestData;
                
                // Retry the request
                await this.fetchWithErrorHandling(url, {
                    ...options,
                    maxRetries: 1 // Only one retry when coming back online
                }, originalFetch);
                
                // Remove from failed requests
                this.failedRequests.delete(requestId);
                
            } catch (error) {
                console.warn('Failed to retry request:', requestData.url);
            }
        }
    }
    
    // Generate unique request ID
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Merge multiple abort signals
    mergeAbortSignals(signals) {
        const controller = new AbortController();
        
        signals.forEach(signal => {
            if (signal.aborted) {
                controller.abort();
            } else {
                signal.addEventListener('abort', () => {
                    controller.abort();
                });
            }
        });
        
        return controller.signal;
    }
    
    // Delay utility
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Get network status
    getStatus() {
        return {
            online: this.isOnline,
            failedRequests: this.failedRequests.size,
            connection: this.getConnectionType()
        };
    }
    
    // Get connection type (if available)
    getConnectionType() {
        if ('connection' in navigator) {
            return {
                type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        return null;
    }
}

// Initialize network error handler
window.networkErrorHandler = new NetworkErrorHandler();
