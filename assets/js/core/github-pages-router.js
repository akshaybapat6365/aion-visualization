/**
 * GitHub Pages Router - Phase 5 Clean URL Implementation
 * Handles client-side routing for clean URLs in GitHub Pages environment
 * Supports: /chapters/enhanced/1/ -> /chapters/enhanced/chapter-1.html
 */

class GitHubPagesRouter {
    constructor() {
        this.baseUrl = '/aion-visualization';
        this.routes = new Map();
        this.currentRoute = null;
        this.isInitialized = false;
        this.historySupported = !!(window.history && history.pushState);
        
        // Route patterns for clean URLs
        this.routePatterns = {
            home: /^\/$/,
            chapters: /^\/chapters\/$/,
            chapterEnhanced: /^\/chapters\/enhanced\/(\d+)\/$/,
            chapterStandard: /^\/chapters\/standard\/(\d+)\/$/,
            timeline: /^\/timeline\/$/,
            symbols: /^\/symbols\/$/,
            about: /^\/about\/$/
        };
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        try {
            this.setupRoutes();
            this.handleInitialRoute();
            this.bindEvents();
            this.updateNavigationLinks();
            this.isInitialized = true;
            
            console.log('GitHub Pages Router initialized successfully');
        } catch (error) {
            console.error('Router initialization failed:', error);
            this.fallbackToOriginalUrls();
        }
    }
    
    setupRoutes() {
        // Define route mappings from clean URLs to actual file paths
        this.routes.set('/', 'index.html');
        this.routes.set('/chapters/', 'chapters/index.html');
        this.routes.set('/timeline/', 'src/timeline.html');
        this.routes.set('/symbols/', 'src/symbols.html');
        this.routes.set('/about/', 'src/about.html');
        
        // Enhanced chapters (1-14)
        for (let i = 1; i <= 14; i++) {
            this.routes.set(
                `/chapters/enhanced/${i}/`, 
                `chapters/enhanced/chapter-${i}.html`
            );
        }
        
        // Standard chapters (1-14)
        for (let i = 1; i <= 14; i++) {
            this.routes.set(
                `/chapters/standard/${i}/`, 
                `chapters/standard/chapter-${i}.html`
            );
        }
        
        console.log(`Router configured with ${this.routes.size} routes`);
    }
    
    handleInitialRoute() {
        const currentPath = this.getCurrentPath();
        
        // Check if we're already on a clean URL
        if (this.isCleanUrl(currentPath)) {
            this.handleRoute(currentPath);
            return;
        }
        
        // Check if we need to redirect to clean URL
        const cleanUrl = this.getCleanUrlForCurrentPage();
        if (cleanUrl && cleanUrl !== currentPath) {
            this.redirectToCleanUrl(cleanUrl);
            return;
        }
        
        // Handle legacy URLs
        this.handleLegacyUrl(currentPath);
    }
    
    getCurrentPath() {
        let path = window.location.pathname;
        
        // Remove base URL if present
        if (path.startsWith(this.baseUrl)) {
            path = path.substring(this.baseUrl.length);
        }
        
        // Ensure path starts with /
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        return path;
    }
    
    isCleanUrl(path) {
        return Object.values(this.routePatterns).some(pattern => pattern.test(path));
    }
    
    getCleanUrlForCurrentPage() {
        const path = this.getCurrentPath();
        
        // Map current HTML file to clean URL
        const cleanUrlMappings = {
            '/index.html': '/',
            '/chapters/index.html': '/chapters/',
            '/src/timeline.html': '/timeline/',
            '/src/symbols.html': '/symbols/',
            '/src/about.html': '/about/'
        };
        
        // Check for chapter files
        const chapterMatch = path.match(/\/chapters\/(enhanced|standard)\/chapter-(\d+)\.html$/);
        if (chapterMatch) {
            const [, type, number] = chapterMatch;
            return `/chapters/${type}/${number}/`;
        }
        
        return cleanUrlMappings[path] || null;
    }
    
    redirectToCleanUrl(cleanUrl) {
        if (this.historySupported) {
            history.replaceState(null, null, this.baseUrl + cleanUrl);
            this.handleRoute(cleanUrl);
        } else {
            // Fallback for browsers without history API
            window.location.href = this.baseUrl + cleanUrl;
        }
    }
    
    handleLegacyUrl(path) {
        // Handle old chapter URLs
        const legacyChapterMatch = path.match(/\/chapter(\d+)\.html$/);
        if (legacyChapterMatch) {
            const chapterNum = legacyChapterMatch[1];
            const cleanUrl = `/chapters/enhanced/${chapterNum}/`;
            this.redirectToCleanUrl(cleanUrl);
            return;
        }
        
        // Handle other legacy patterns
        const legacyMappings = {
            '/chapters.html': '/chapters/',
            '/timeline.html': '/timeline/',
            '/symbols.html': '/symbols/',
            '/about.html': '/about/'
        };
        
        const cleanUrl = legacyMappings[path];
        if (cleanUrl) {
            this.redirectToCleanUrl(cleanUrl);
        }
    }
    
    handleRoute(path) {
        const actualFile = this.routes.get(path);
        
        if (!actualFile) {
            // Check for pattern matches
            const matchedRoute = this.findMatchingRoute(path);
            if (matchedRoute) {
                this.loadContent(matchedRoute.file, matchedRoute.params);
                return;
            }
            
            // Route not found - let GitHub Pages handle 404
            console.warn('Route not found:', path);
            return;
        }
        
        this.loadContent(actualFile);
    }
    
    findMatchingRoute(path) {
        // Check enhanced chapters
        const enhancedMatch = path.match(this.routePatterns.chapterEnhanced);
        if (enhancedMatch) {
            const chapterNum = enhancedMatch[1];
            if (chapterNum >= 1 && chapterNum <= 14) {
                return {
                    file: `chapters/enhanced/chapter-${chapterNum}.html`,
                    params: { type: 'enhanced', chapter: chapterNum }
                };
            }
        }
        
        // Check standard chapters
        const standardMatch = path.match(this.routePatterns.chapterStandard);
        if (standardMatch) {
            const chapterNum = standardMatch[1];
            if (chapterNum >= 1 && chapterNum <= 14) {
                return {
                    file: `chapters/standard/chapter-${chapterNum}.html`,
                    params: { type: 'standard', chapter: chapterNum }
                };
            }
        }
        
        return null;
    }
    
    loadContent(filePath, params = {}) {
        // For GitHub Pages, we need to navigate to the actual file
        // but maintain the clean URL in the address bar
        const fullUrl = this.baseUrl + '/' + filePath;
        
        if (this.historySupported) {
            // Load content via fetch and update DOM
            this.fetchAndUpdateContent(fullUrl, params);
        } else {
            // Fallback to direct navigation
            window.location.href = fullUrl;
        }
    }
    
    async fetchAndUpdateContent(url, params = {}) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            this.updatePageContent(html, params);
            
        } catch (error) {
            console.error('Failed to load content:', error);
            // Fallback to direct navigation
            window.location.href = url;
        }
    }
    
    updatePageContent(html, params = {}) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Update document title
        const newTitle = doc.querySelector('title');
        if (newTitle) {
            document.title = newTitle.textContent;
        }
        
        // Update meta description
        const newDescription = doc.querySelector('meta[name="description"]');
        const existingDescription = document.querySelector('meta[name="description"]');
        if (newDescription && existingDescription) {
            existingDescription.setAttribute('content', newDescription.getAttribute('content'));
        }
        
        // Update main content
        const newMain = doc.querySelector('main') || doc.querySelector('body');
        const existingMain = document.querySelector('main') || document.querySelector('body');
        
        if (newMain && existingMain) {
            // Preserve navigation if it exists
            const nav = existingMain.querySelector('nav');
            existingMain.innerHTML = newMain.innerHTML;
            
            if (nav) {
                existingMain.prepend(nav);
            }
        }
        
        // Execute any new scripts
        this.executeScripts(doc);
        
        // Update navigation active states
        this.updateNavigationActiveState();
        
        // Dispatch route change event
        this.dispatchRouteChangeEvent(params);
    }
    
    executeScripts(doc) {
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.src) {
                // Load external script
                const newScript = document.createElement('script');
                newScript.src = script.src;
                newScript.async = true;
                document.head.appendChild(newScript);
            } else if (script.textContent) {
                // Execute inline script
                try {
                    eval(script.textContent);
                } catch (error) {
                    console.warn('Script execution failed:', error);
                }
            }
        });
    }
    
    bindEvents() {
        // Handle popstate for browser back/forward
        window.addEventListener('popstate', (event) => {
            const path = this.getCurrentPath();
            this.handleRoute(path);
        });
        
        // Intercept clicks on internal links
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (this.shouldInterceptLink(href)) {
                event.preventDefault();
                this.navigateTo(href);
            }
        });
        
        // Handle form submissions that should use clean URLs
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.hasAttribute('data-clean-url')) {
                event.preventDefault();
                this.handleFormSubmission(form);
            }
        });
    }
    
    shouldInterceptLink(href) {
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return false;
        }
        
        if (href.startsWith('http') && !href.includes('github.io/aion-visualization')) {
            return false;
        }
        
        return true;
    }
    
    navigateTo(path) {
        // Convert to clean URL if needed
        const cleanPath = this.getCleanUrlForPath(path);
        const fullPath = cleanPath || path;
        
        if (this.historySupported) {
            history.pushState(null, null, this.baseUrl + fullPath);
            this.handleRoute(fullPath);
        } else {
            window.location.href = this.baseUrl + fullPath;
        }
    }
    
    getCleanUrlForPath(path) {
        // Remove base URL if present
        if (path.startsWith(this.baseUrl)) {
            path = path.substring(this.baseUrl.length);
        }
        
        // Convert legacy URLs to clean URLs
        const cleanMappings = {
            '/index.html': '/',
            '/chapters/index.html': '/chapters/',
            '/src/timeline.html': '/timeline/',
            '/src/symbols.html': '/symbols/',
            '/src/about.html': '/about/'
        };
        
        // Handle chapter files
        const chapterMatch = path.match(/\/chapters\/(enhanced|standard)\/chapter-(\d+)\.html$/);
        if (chapterMatch) {
            const [, type, number] = chapterMatch;
            return `/chapters/${type}/${number}/`;
        }
        
        return cleanMappings[path] || path;
    }
    
    updateNavigationLinks() {
        const navLinks = document.querySelectorAll('nav a[href]');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const cleanUrl = this.getCleanUrlForPath(href);
            
            if (cleanUrl && cleanUrl !== href) {
                link.setAttribute('href', cleanUrl);
                link.setAttribute('data-original-href', href);
            }
        });
    }
    
    updateNavigationActiveState() {
        const currentPath = this.getCurrentPath();
        const navLinks = document.querySelectorAll('nav a[href]');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const isActive = href === currentPath || 
                            (href !== '/' && currentPath.startsWith(href));
            
            link.classList.toggle('active', isActive);
        });
    }
    
    handleFormSubmission(form) {
        const formData = new FormData(form);
        const action = form.getAttribute('action') || '';
        const method = form.getAttribute('method') || 'GET';
        
        if (method.toLowerCase() === 'get') {
            const params = new URLSearchParams(formData);
            const cleanUrl = this.getCleanUrlForPath(action);
            const fullUrl = `${cleanUrl}?${params.toString()}`;
            this.navigateTo(fullUrl);
        }
    }
    
    dispatchRouteChangeEvent(params = {}) {
        const event = new CustomEvent('routechange', {
            detail: {
                path: this.getCurrentPath(),
                params: params,
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(event);
    }
    
    fallbackToOriginalUrls() {
        console.warn('Router failed - falling back to original URLs');
        
        // Remove any URL modifications
        const links = document.querySelectorAll('a[data-original-href]');
        links.forEach(link => {
            const originalHref = link.getAttribute('data-original-href');
            link.setAttribute('href', originalHref);
            link.removeAttribute('data-original-href');
        });
    }
    
    // Public API methods
    getCurrentRoute() {
        return this.getCurrentPath();
    }
    
    isRouteActive(path) {
        const currentPath = this.getCurrentPath();
        return currentPath === path || 
               (path !== '/' && currentPath.startsWith(path));
    }
    
    getRouteParams() {
        const path = this.getCurrentPath();
        const matchedRoute = this.findMatchingRoute(path);
        return matchedRoute ? matchedRoute.params : {};
    }
    
    // Utility method for generating clean URLs
    static generateCleanUrl(type, params = {}) {
        switch (type) {
            case 'chapter':
                const chapterType = params.type || 'enhanced';
                const chapterNum = params.chapter || 1;
                return `/chapters/${chapterType}/${chapterNum}/`;
            
            case 'chapters':
                return '/chapters/';
            
            case 'timeline':
                return '/timeline/';
            
            case 'symbols':
                return '/symbols/';
            
            case 'about':
                return '/about/';
            
            default:
                return '/';
        }
    }
}

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.githubPagesRouter = new GitHubPagesRouter();
});

// Make router available globally
window.GitHubPagesRouter = GitHubPagesRouter;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubPagesRouter;
}