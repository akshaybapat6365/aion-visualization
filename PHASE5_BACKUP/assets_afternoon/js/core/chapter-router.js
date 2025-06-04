// Chapter Router for Aion Visualization
// Advanced routing system with deep linking, history management, and state persistence

class ChapterRouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.history = [];
        this.maxHistory = 20;
        this.transitionDuration = 300;
        this.isTransitioning = false;
        
        this.init();
    }

    init() {
        this.setupRoutes();
        this.setupEventListeners();
        this.loadInitialRoute();
    }

    setupRoutes() {
        // Define all possible routes
        const routes = [
            // Main pages
            { path: '/', component: 'home', title: 'Aion - Home' },
            { path: '/index.html', component: 'home', title: 'Aion - Home' },
            { path: '/chapters.html', component: 'chapters-list', title: 'Standard Chapters' },
            { path: '/enhanced-chapters.html', component: 'enhanced-chapters-list', title: 'Enhanced Chapters' },
            { path: '/journey.html', component: 'journey', title: 'Your Journey' },
            { path: '/about.html', component: 'about', title: 'About Aion' },
            
            // Standard chapters (1-14)
            ...Array.from({length: 14}, (_, i) => ({
                path: `/chapter${i + 1}.html`,
                component: 'standard-chapter',
                title: `Chapter ${i + 1}`,
                chapterId: i + 1,
                type: 'standard'
            })),
            
            // Enhanced chapters
            ...Array.from({length: 14}, (_, i) => ({
                path: `/enhanced-chapter${i + 1}.html`,
                component: 'enhanced-chapter',
                title: `Enhanced Chapter ${i + 1}`,
                chapterId: i + 1,
                type: 'enhanced'
            }))
        ];

        routes.forEach(route => {
            this.routes.set(route.path, route);
        });
    }

    setupEventListeners() {
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.route) {
                this.navigate(event.state.route, false);
            } else {
                this.loadInitialRoute();
            }
        });

        // Intercept navigation links
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href]');
            if (link && this.shouldIntercept(link)) {
                event.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });

        // Handle keyboard navigation
        document.addEventListener('keydown', (event) => {
            if (event.altKey && event.key === 'ArrowLeft') {
                event.preventDefault();
                this.goBack();
            } else if (event.altKey && event.key === 'ArrowRight') {
                event.preventDefault();
                this.goForward();
            }
        });
    }

    shouldIntercept(link) {
        const href = link.getAttribute('href');
        
        // Don't intercept external links
        if (href.startsWith('http') || href.startsWith('//')) {
            return false;
        }
        
        // Don't intercept links with target="_blank"
        if (link.getAttribute('target') === '_blank') {
            return false;
        }
        
        // Don't intercept links with download attribute
        if (link.hasAttribute('download')) {
            return false;
        }
        
        // Don't intercept mailto or tel links
        if (href.startsWith('mailto:') || href.startsWith('tel:')) {
            return false;
        }
        
        return true;
    }

    loadInitialRoute() {
        const path = window.location.pathname;
        const route = this.routes.get(path) || this.routes.get('/');
        this.navigate(path, false);
    }

    async navigate(path, addToHistory = true) {
        if (this.isTransitioning) {
            return false;
        }

        const route = this.routes.get(path);
        if (!route) {
            console.warn(`Route not found: ${path}`);
            return false;
        }

        this.isTransitioning = true;

        try {
            // Add to history
            if (addToHistory) {
                this.addToHistory(this.currentRoute);
                
                // Update browser history
                const state = { route: path, timestamp: Date.now() };
                if (window.location.pathname !== path) {
                    history.pushState(state, route.title, path);
                }
            }

            // Update document title
            document.title = route.title;

            // Trigger route change event
            this.dispatchRouteChange(route);

            // Handle specific route types
            await this.handleRouteType(route);

            this.currentRoute = route;
            
            // Save current state
            this.saveState();

            return true;

        } catch (error) {
            console.error('Navigation error:', error);
            return false;
        } finally {
            this.isTransitioning = false;
        }
    }

    async handleRouteType(route) {
        switch (route.component) {
            case 'standard-chapter':
            case 'enhanced-chapter':
                await this.loadChapter(route);
                break;
            case 'chapters-list':
                await this.loadChaptersList('standard');
                break;
            case 'enhanced-chapters-list':
                await this.loadChaptersList('enhanced');
                break;
            default:
                // For other routes, just update the UI state
                this.updateUIState(route);
                break;
        }
    }

    async loadChapter(route) {
        const { chapterId, type } = route;
        
        // Update chapter navigation if it exists
        if (window.navigationSystem) {
            window.navigationSystem.updateChapterProgress(chapterId);
        }

        // Update any chapter-specific UI
        this.updateChapterUI(chapterId, type);

        // Dispatch chapter loaded event
        this.dispatchEvent('chapterLoaded', {
            chapterId,
            type,
            route
        });
    }

    async loadChaptersList(type) {
        // Update chapters list UI
        this.updateChaptersListUI(type);

        // Dispatch chapters list loaded event
        this.dispatchEvent('chaptersListLoaded', { type });
    }

    updateUIState(route) {
        // Update active navigation states
        const navItems = document.querySelectorAll('.nav-item, .nav-link');
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            item.classList.toggle('active', href === route.path);
        });
    }

    updateChapterUI(chapterId, type) {
        // Update chapter navigation
        const chapterNavs = document.querySelectorAll('.chapter-nav');
        chapterNavs.forEach(nav => {
            const typeElement = nav.querySelector('.chapter-type');
            const currentElement = nav.querySelector('.chapter-current');
            
            if (typeElement) {
                typeElement.textContent = type === 'enhanced' ? 'Enhanced' : 'Standard';
            }
            
            if (currentElement) {
                currentElement.textContent = `Chapter ${chapterId}`;
            }
        });

        // Update progress indicators
        const progressFills = document.querySelectorAll('.progress-fill-mini');
        progressFills.forEach(fill => {
            fill.style.width = `${(chapterId / 14) * 100}%`;
        });

        // Update next/previous buttons
        this.updateChapterNavigation(chapterId, type);
    }

    updateChapterNavigation(chapterId, type) {
        const prevButtons = document.querySelectorAll('.nav-button.prev');
        const nextButtons = document.querySelectorAll('.nav-button.next');

        prevButtons.forEach(button => {
            if (chapterId > 1) {
                button.style.display = 'flex';
                button.onclick = () => this.navigate(`${type === 'enhanced' ? 'enhanced-' : ''}chapter${chapterId - 1}.html`);
            } else {
                button.style.display = 'none';
            }
        });

        nextButtons.forEach(button => {
            if (chapterId < 14) {
                button.style.display = 'flex';
                button.onclick = () => this.navigate(`${type === 'enhanced' ? 'enhanced-' : ''}chapter${chapterId + 1}.html`);
            } else {
                button.style.display = 'none';
            }
        });
    }

    updateChaptersListUI(type) {
        // Update chapters list active states
        const chapterCards = document.querySelectorAll('.chapter-card');
        chapterCards.forEach(card => {
            const isEnhanced = card.dataset.type === 'enhanced';
            const shouldShow = (type === 'enhanced' && isEnhanced) || (type === 'standard' && !isEnhanced);
            card.style.display = shouldShow ? 'block' : 'none';
        });

        // Update tab states if they exist
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === type);
        });
    }

    addToHistory(route) {
        if (!route) return;

        this.history.push({
            ...route,
            timestamp: Date.now()
        });

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    goBack() {
        if (this.history.length > 0) {
            const previousRoute = this.history.pop();
            this.navigate(previousRoute.path, false);
            return true;
        }
        return false;
    }

    goForward() {
        // This would require maintaining a forward stack
        // For now, just return false
        return false;
    }

    // Quick navigation methods
    goToChapter(chapterId, type = 'enhanced') {
        const path = `${type === 'enhanced' ? 'enhanced-' : ''}chapter${chapterId}.html`;
        this.navigate(path);
    }

    goToNextChapter() {
        if (this.currentRoute && this.currentRoute.chapterId) {
            const nextId = this.currentRoute.chapterId + 1;
            if (nextId <= 14) {
                this.goToChapter(nextId, this.currentRoute.type);
                return true;
            }
        }
        return false;
    }

    goToPreviousChapter() {
        if (this.currentRoute && this.currentRoute.chapterId) {
            const prevId = this.currentRoute.chapterId - 1;
            if (prevId >= 1) {
                this.goToChapter(prevId, this.currentRoute.type);
                return true;
            }
        }
        return false;
    }

    goToChaptersList(type = 'enhanced') {
        const path = type === 'enhanced' ? '/enhanced-chapters.html' : '/chapters.html';
        this.navigate(path);
    }

    goHome() {
        this.navigate('/');
    }

    // State management
    saveState() {
        const state = {
            currentRoute: this.currentRoute,
            history: this.history.slice(-5), // Save last 5 for quick access
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('aion-router-state', JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save router state:', error);
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem('aion-router-state');
            if (saved) {
                const state = JSON.parse(saved);
                
                // Only restore if recent (within 1 hour)
                if (Date.now() - state.timestamp < 3600000) {
                    this.history = state.history || [];
                    return state.currentRoute;
                }
            }
        } catch (error) {
            console.warn('Failed to load router state:', error);
        }
        
        return null;
    }

    // Event system
    dispatchRouteChange(route) {
        this.dispatchEvent('routeChange', { route, router: this });
    }

    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(`aion:${eventName}`, {
            detail,
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
    }

    // Utility methods
    getCurrentChapter() {
        return this.currentRoute && this.currentRoute.chapterId ? {
            id: this.currentRoute.chapterId,
            type: this.currentRoute.type || 'standard'
        } : null;
    }

    getAvailableChapters(type = 'enhanced') {
        return Array.from({length: 14}, (_, i) => ({
            id: i + 1,
            path: `${type === 'enhanced' ? 'enhanced-' : ''}chapter${i + 1}.html`,
            title: `Chapter ${i + 1}`,
            type
        }));
    }

    isCurrentRoute(path) {
        return this.currentRoute && this.currentRoute.path === path;
    }

    // Analytics and debugging
    getRouterInfo() {
        return {
            currentRoute: this.currentRoute,
            historyLength: this.history.length,
            availableRoutes: Array.from(this.routes.keys()),
            isTransitioning: this.isTransitioning
        };
    }
}

// Create global router instance
const chapterRouter = new ChapterRouter();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChapterRouter, chapterRouter };
}

// Add to global scope
if (typeof window !== 'undefined') {
    window.chapterRouter = chapterRouter;
}