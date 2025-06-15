/**
 * Service Worker for Aion Visualization PWA
 * Provides advanced offline functionality, caching, and performance optimization
 * Version: 2.0.0 - Enhanced PWA Support
 */

const CACHE_VERSION = 'aion-v2.1.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const ANALYTICS_CACHE = 'analytics-queue';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/aion-visualization/',
    '/aion-visualization/index.html',
    '/aion-visualization/visualizations.html',
    '/aion-visualization/test-visualizations.html',
    '/aion-visualization/offline.html',
    '/aion-visualization/manifest.json',
    '/aion-visualization/assets/css/bundle.min.css'
];

// Chapter files to cache on demand
const CHAPTER_PATTERNS = [
    /\/aion-visualization\/chapters\/enhanced\/chapter-\d+\.html$/,
    /\/aion-visualization\/chapters\/standard\/chapter-\d+\.html$/
];

// External resources to cache
const EXTERNAL_RESOURCES = [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(DYNAMIC_CACHE).then(cache => {
                console.log('Service Worker: Caching external resources');
                return cache.addAll(EXTERNAL_RESOURCES);
            })
        ]).then(() => {
            console.log('Service Worker: Installation complete');
            return self.skipWaiting();
        }).catch(error => {
            console.error('Service Worker: Installation failed', error);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && 
                        cacheName !== DYNAMIC_CACHE && 
                        cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation complete');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip cross-origin requests (except for CDN resources)
    if (requestUrl.origin !== location.origin && 
        !isAllowedExternalResource(requestUrl.href)) {
        return;
    }
    
    event.respondWith(
        handleFetchRequest(event.request)
    );
});

async function handleFetchRequest(request) {
    const requestUrl = new URL(request.url);
    const pathname = requestUrl.pathname;
    
    try {
        // Handle different types of requests
        if (isStaticAsset(pathname)) {
            return handleStaticAsset(request);
        } else if (isChapterFile(pathname)) {
            return handleChapterFile(request);
        } else if (isNavigationRequest(request)) {
            return handleNavigationRequest(request);
        } else if (isExternalResource(request.url)) {
            return handleExternalResource(request);
        } else {
            return handleDynamicRequest(request);
        }
    } catch (error) {
        console.error('Service Worker: Fetch error', error);
        return handleOfflineRequest(request);
    }
}

// Handle static assets (CSS, JS, images)
async function handleStaticAsset(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
        // Serve from cache, update in background
        updateCacheInBackground(request, cache);
        return cached;
    }
    
    // Not in cache, fetch and cache
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Network failed, return cached version if available
        return cache.match(request) || createOfflineResponse(request);
    }
}

// Handle chapter files with lazy caching
async function handleChapterFile(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            // Cache chapter files for offline access
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return generic chapter offline page
        return createChapterOfflineResponse(request);
    }
}

// Handle navigation requests (HTML pages)
async function handleNavigationRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    
    try {
        // Try network first for navigation
        const response = await fetch(request);
        
        if (response.ok) {
            // Cache successful navigation responses
            cache.put(request, response.clone());
            return response;
        }
        
        throw new Error(`HTTP ${response.status}`);
        
    } catch (error) {
        // Network failed, try cache
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }
        
        // No cache, return offline page
        const offlinePage = await cache.match('/aion-visualization/404.html');
        return offlinePage || createGenericOfflineResponse();
    }
}

// Handle external resources (CDN)
async function handleExternalResource(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return cached version or fail gracefully
        return cache.match(request);
    }
}

// Handle dynamic requests
async function handleDynamicRequest(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            // Cache successful dynamic responses briefly
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Try to serve from cache
        const cache = await caches.open(DYNAMIC_CACHE);
        const cached = await cache.match(request);
        return cached || createOfflineResponse(request);
    }
}

// Handle offline requests
async function handleOfflineRequest(request) {
    const requestUrl = new URL(request.url);
    
    if (request.headers.get('accept').includes('text/html')) {
        // HTML request - return offline page
        const cache = await caches.open(STATIC_CACHE);
        return cache.match('/aion-visualization/404.html') || createGenericOfflineResponse();
    }
    
    return createOfflineResponse(request);
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
    } catch (error) {
        // Silently fail background updates
        console.warn('Service Worker: Background update failed', error);
    }
}

// Helper functions
function isStaticAsset(pathname) {
    return pathname.includes('/assets/') || 
           pathname.endsWith('.css') || 
           pathname.endsWith('.js') || 
           pathname.endsWith('.png') || 
           pathname.endsWith('.jpg') || 
           pathname.endsWith('.svg') ||
           pathname.endsWith('.ico');
}

function isChapterFile(pathname) {
    return CHAPTER_PATTERNS.some(pattern => pattern.test(pathname));
}

function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && 
            request.headers.get('accept').includes('text/html'));
}

function isExternalResource(url) {
    return EXTERNAL_RESOURCES.some(resource => url.startsWith(resource));
}

function isAllowedExternalResource(url) {
    const allowedDomains = [
        'cdnjs.cloudflare.com',
        'fonts.googleapis.com',
        'fonts.gstatic.com'
    ];
    
    return allowedDomains.some(domain => url.includes(domain));
}

function createOfflineResponse(request) {
    const headers = {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
    };
    
    const body = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Offline - Aion Visualization</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: #1a1a2e;
                    color: white;
                }
                .offline-icon { font-size: 64px; margin-bottom: 20px; }
                .button { 
                    background: #ffd700; 
                    color: black; 
                    padding: 10px 20px; 
                    text-decoration: none; 
                    border-radius: 5px;
                    display: inline-block;
                    margin: 10px;
                }
            </style>
        </head>
        <body>
            <div class="offline-icon">📱</div>
            <h1>You're Offline</h1>
            <p>This content is not available offline.</p>
            <p>Please check your internet connection and try again.</p>
            <a href="/aion-visualization/" class="button">Return Home</a>
            <button onclick="window.location.reload()" class="button">Retry</button>
        </body>
        </html>
    `;
    
    return new Response(body, { headers });
}

function createChapterOfflineResponse(request) {
    const requestUrl = new URL(request.url);
    const pathname = requestUrl.pathname;
    const chapterMatch = pathname.match(/chapter-(\d+)\.html/);
    const chapterNum = chapterMatch ? chapterMatch[1] : '?';
    
    const headers = {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
    };
    
    const body = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Chapter ${chapterNum} - Offline</title>
            <link rel="stylesheet" href="/aion-visualization/assets/css/main.min.css">
        </head>
        <body>
            <nav class="nav">
                <div class="nav-container">
                    <a href="/aion-visualization/">Home</a>
                    <a href="/aion-visualization/chapters/">Chapters</a>
                </div>
            </nav>
            <main style="padding: 50px; text-align: center;">
                <h1>Chapter ${chapterNum}</h1>
                <p>This chapter is not available offline.</p>
                <p>Please connect to the internet to view the full content.</p>
                <a href="/aion-visualization/chapters/">View Available Chapters</a>
            </main>
        </body>
        </html>
    `;
    
    return new Response(body, { headers });
}

function createGenericOfflineResponse() {
    const headers = {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
    };
    
    const body = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Aion Visualization - Offline</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: #1a1a2e; 
                    color: white; 
                    margin: 0; 
                    padding: 50px;
                    text-align: center;
                }
                .button { 
                    background: #ffd700; 
                    color: black; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px;
                    display: inline-block;
                    margin: 10px;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <h1>Aion Visualization</h1>
            <h2>Offline Mode</h2>
            <p>You're currently offline. Some content may not be available.</p>
            <a href="/aion-visualization/" class="button">Try to Load Home</a>
        </body>
        </html>
    `;
    
    return new Response(body, { headers });
}

// Message handling for cache management
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_INFO') {
        getCacheInfo().then(info => {
            event.ports[0].postMessage(info);
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        clearCaches().then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

async function getCacheInfo() {
    const cacheNames = await caches.keys();
    const info = {
        caches: cacheNames.length,
        version: CACHE_NAME
    };
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        info[cacheName] = keys.length;
    }
    
    return info;
}

async function clearCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

console.log('Service Worker: Loaded and ready');