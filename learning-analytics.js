// Learning Analytics System for Educational Effectiveness
// Tracks user behavior patterns and provides personalized learning insights

class LearningAnalytics {
    constructor(options = {}) {
        this.options = {
            enableTracking: true,
            privacyLevel: 'balanced', // minimal, balanced, detailed
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            saveInterval: 60 * 1000, // 1 minute
            maxStorageSize: 5 * 1024 * 1024, // 5MB
            enableRecommendations: true,
            ...options
        };
        
        this.sessionId = this.generateSessionId();
        this.learningData = new Map();
        this.currentSession = null;
        this.patterns = new PatternRecognizer();
        this.recommendations = new RecommendationEngine();
        this.conceptGraph = new ConceptGraph();
        
        this.init();
    }
    
    init() {
        this.loadStoredData();
        this.startNewSession();
        this.setupEventListeners();
        this.setupPeriodicSave();
        this.initializeConceptTracking();
    }
    
    loadStoredData() {
        try {
            const stored = localStorage.getItem('aion-learning-data');
            if (stored) {
                const data = JSON.parse(stored);
                
                // Convert stored data back to Maps
                this.learningData = new Map(data.learningData || []);
                
                // Load patterns and preferences
                if (data.patterns) {
                    this.patterns.loadPatterns(data.patterns);
                }
                
                console.log('Loaded learning data:', this.learningData.size, 'sessions');
            }
        } catch (error) {
            console.warn('Failed to load learning data:', error);
            this.learningData = new Map();
        }
    }
    
    saveData() {
        try {
            const dataToSave = {
                learningData: Array.from(this.learningData.entries()),
                patterns: this.patterns.exportPatterns(),
                lastSaved: Date.now()
            };
            
            const serialized = JSON.stringify(dataToSave);
            
            // Check size limit
            if (serialized.length > this.options.maxStorageSize) {
                this.compactData();
                return this.saveData(); // Retry after compacting
            }
            
            localStorage.setItem('aion-learning-data', serialized);
        } catch (error) {
            console.warn('Failed to save learning data:', error);
            this.compactData(); // Try to free up space
        }
    }
    
    compactData() {
        // Remove old sessions to free up space
        const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
        
        for (const [sessionId, sessionData] of this.learningData) {
            if (sessionData.startTime < cutoffTime) {
                this.learningData.delete(sessionId);
            }
        }
        
        console.log('Compacted learning data to', this.learningData.size, 'sessions');
    }
    
    startNewSession() {
        this.currentSession = {
            sessionId: this.sessionId,
            startTime: Date.now(),
            endTime: null,
            events: [],
            chapters: new Set(),
            concepts: new Map(),
            interactions: [],
            learningPath: [],
            engagement: {
                totalTime: 0,
                activeTime: 0,
                idleTime: 0,
                interactions: 0,
                revisits: 0
            },
            performance: {
                correctAnswers: 0,
                totalAnswers: 0,
                averageResponseTime: 0,
                difficultConcepts: new Set(),
                masteredConcepts: new Set()
            },
            preferences: {
                preferredVisualizationType: null,
                learningStyle: null,
                pace: 'normal'
            },
            context: {
                userAgent: navigator.userAgent,
                screenResolution: {
                    width: window.screen.width,
                    height: window.screen.height
                },
                deviceType: this.getDeviceType(),
                referrer: document.referrer
            }
        };
        
        console.log('Started new learning session:', this.sessionId);
    }
    
    trackEvent(eventType, eventData = {}) {
        if (!this.options.enableTracking || !this.currentSession) return;
        
        const event = {
            type: eventType,
            timestamp: Date.now(),
            sessionTime: Date.now() - this.currentSession.startTime,
            data: this.sanitizeEventData(eventData),
            context: this.getCurrentContext()
        };
        
        this.currentSession.events.push(event);
        
        // Update session metrics
        this.updateSessionMetrics(event);
        
        // Analyze patterns in real-time
        this.patterns.analyzeEvent(event, this.currentSession);
        
        // Check for learning milestones
        this.checkLearningMilestones(event);
        
        console.log('Tracked event:', eventType, event);
    }
    
    sanitizeEventData(data) {
        if (this.options.privacyLevel === 'minimal') {
            // Only track essential data
            return {
                chapter: data.chapter,
                conceptId: data.conceptId,
                success: data.success,
                duration: data.duration
            };
        } else if (this.options.privacyLevel === 'balanced') {
            // Track learning-relevant data
            const sanitized = { ...data };
            delete sanitized.personalInfo;
            delete sanitized.sensitiveData;
            return sanitized;
        } else {
            // Track detailed data for advanced analytics
            return data;
        }
    }
    
    getCurrentContext() {
        return {
            url: window.location.pathname,
            chapter: this.getCurrentChapter(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            scrollPosition: window.pageYOffset,
            timestamp: Date.now()
        };
    }
    
    getCurrentChapter() {
        const path = window.location.pathname;
        const match = path.match(/chapter(\d+)/);
        return match ? parseInt(match[1]) : null;
    }
    
    updateSessionMetrics(event) {
        const session = this.currentSession;
        
        // Update engagement metrics
        if (event.type === 'interaction') {
            session.engagement.interactions++;
        }
        
        if (event.type === 'chapter-visit') {
            session.chapters.add(event.data.chapterId);
            
            if (session.chapters.has(event.data.chapterId)) {
                session.engagement.revisits++;
            }
        }
        
        if (event.type === 'concept-learned') {
            session.concepts.set(event.data.conceptId, {
                learnedAt: event.timestamp,
                confidence: event.data.confidence || 0.5,
                attempts: event.data.attempts || 1
            });
        }
        
        // Update performance metrics
        if (event.type === 'assessment-answer') {
            session.performance.totalAnswers++;
            if (event.data.correct) {
                session.performance.correctAnswers++;
            }
            
            // Track response time
            if (event.data.responseTime) {
                const currentAvg = session.performance.averageResponseTime;
                const total = session.performance.totalAnswers;
                session.performance.averageResponseTime = 
                    (currentAvg * (total - 1) + event.data.responseTime) / total;
            }
        }
        
        // Update learning path
        if (event.type === 'page-view' || event.type === 'chapter-visit') {
            session.learningPath.push({
                location: event.data.location || event.context.url,
                timestamp: event.timestamp,
                duration: event.data.duration || 0
            });
        }
    }
    
    checkLearningMilestones(event) {
        const session = this.currentSession;
        
        // Check for chapter completion
        if (event.type === 'chapter-complete') {
            this.trackMilestone('chapter-completed', {
                chapterId: event.data.chapterId,
                timeSpent: event.data.timeSpent,
                interactions: session.engagement.interactions
            });
        }
        
        // Check for concept mastery
        if (event.type === 'assessment-answer' && event.data.correct) {
            const conceptId = event.data.conceptId;
            if (this.hasConceptMastery(conceptId)) {
                session.performance.masteredConcepts.add(conceptId);
                this.trackMilestone('concept-mastered', { conceptId });
            }
        }
        
        // Check for learning streaks
        const streak = this.calculateLearningStreak();
        if (streak > 0 && streak % 5 === 0) {
            this.trackMilestone('learning-streak', { streak });
        }
        
        // Check for exploration milestone
        if (session.chapters.size >= 5) {
            this.trackMilestone('explorer', { 
                chaptersVisited: session.chapters.size 
            });
        }
    }
    
    trackMilestone(milestoneType, data) {
        this.trackEvent('milestone-achieved', {
            milestone: milestoneType,
            ...data
        });
        
        // Show achievement notification
        this.showAchievementNotification(milestoneType, data);
    }
    
    hasConceptMastery(conceptId) {
        const session = this.currentSession;
        
        // Check recent performance on this concept
        const conceptEvents = session.events.filter(event => 
            event.type === 'assessment-answer' && 
            event.data.conceptId === conceptId
        );
        
        if (conceptEvents.length < 3) return false;
        
        const recent = conceptEvents.slice(-3);
        const correctCount = recent.filter(event => event.data.correct).length;
        
        return correctCount >= 3; // 3 correct answers in a row
    }
    
    calculateLearningStreak() {
        const session = this.currentSession;
        const assessmentEvents = session.events.filter(event => 
            event.type === 'assessment-answer'
        );
        
        let streak = 0;
        for (let i = assessmentEvents.length - 1; i >= 0; i--) {
            if (assessmentEvents[i].data.correct) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    // Concept tracking and understanding
    trackConceptInteraction(conceptId, interactionType, data = {}) {
        const concept = this.conceptGraph.getConcept(conceptId);
        if (!concept) {
            console.warn('Unknown concept:', conceptId);
            return;
        }
        
        this.trackEvent('concept-interaction', {
            conceptId,
            interactionType,
            conceptName: concept.name,
            difficulty: concept.difficulty,
            ...data
        });
        
        // Update concept understanding
        this.updateConceptUnderstanding(conceptId, interactionType, data);
    }
    
    updateConceptUnderstanding(conceptId, interactionType, data) {
        const session = this.currentSession;
        
        if (!session.concepts.has(conceptId)) {
            session.concepts.set(conceptId, {
                firstEncounter: Date.now(),
                interactions: 0,
                understanding: 0.1,
                confidence: 0.0,
                timeSpent: 0,
                struggles: 0
            });
        }
        
        const conceptData = session.concepts.get(conceptId);
        conceptData.interactions++;
        
        // Update understanding based on interaction type
        switch (interactionType) {
            case 'view':
                conceptData.understanding += 0.05;
                break;
            case 'interact':
                conceptData.understanding += 0.1;
                break;
            case 'correct-answer':
                conceptData.understanding += 0.2;
                conceptData.confidence += 0.15;
                break;
            case 'incorrect-answer':
                conceptData.understanding += 0.05;
                conceptData.confidence -= 0.1;
                conceptData.struggles++;
                break;
            case 'revisit':
                conceptData.understanding += 0.03;
                break;
        }
        
        // Add time spent
        if (data.timeSpent) {
            conceptData.timeSpent += data.timeSpent;
        }
        
        // Normalize values
        conceptData.understanding = Math.min(1.0, Math.max(0.0, conceptData.understanding));
        conceptData.confidence = Math.min(1.0, Math.max(0.0, conceptData.confidence));
        
        // Update difficulty if struggling
        if (conceptData.struggles > 3) {
            session.performance.difficultConcepts.add(conceptId);
        }
    }
    
    getConceptUnderstanding(conceptId) {
        const session = this.currentSession;
        return session.concepts.get(conceptId) || {
            understanding: 0,
            confidence: 0,
            interactions: 0,
            timeSpent: 0
        };
    }
    
    // Learning pattern analysis
    analyzeLearningPatterns() {
        const session = this.currentSession;
        
        return {
            learningStyle: this.identifyLearningStyle(),
            preferredPace: this.identifyPreferredPace(),
            strongConcepts: this.identifyStrongConcepts(),
            struggleConcepts: this.identifyStruggleConcepts(),
            engagementPattern: this.analyzeEngagementPattern(),
            learningPath: this.analyzeLearningPath(),
            recommendations: this.generateRecommendations()
        };
    }
    
    identifyLearningStyle() {
        const session = this.currentSession;
        const interactions = session.events.filter(e => e.type === 'interaction');
        
        const visualInteractions = interactions.filter(i => 
            i.data.interactionType === 'visualization' || 
            i.data.elementType === 'visual'
        ).length;
        
        const textInteractions = interactions.filter(i => 
            i.data.interactionType === 'reading' || 
            i.data.elementType === 'text'
        ).length;
        
        const interactiveElements = interactions.filter(i => 
            i.data.interactionType === 'manipulation' || 
            i.data.elementType === 'interactive'
        ).length;
        
        if (visualInteractions > textInteractions && visualInteractions > interactiveElements) {
            return 'visual';
        } else if (interactiveElements > visualInteractions && interactiveElements > textInteractions) {
            return 'kinesthetic';
        } else if (textInteractions > visualInteractions) {
            return 'reading';
        } else {
            return 'mixed';
        }
    }
    
    identifyPreferredPace() {
        const session = this.currentSession;
        const pageViews = session.events.filter(e => e.type === 'page-view');
        
        if (pageViews.length < 2) return 'normal';
        
        const avgTimePerPage = pageViews.reduce((sum, view) => 
            sum + (view.data.duration || 0), 0) / pageViews.length;
        
        if (avgTimePerPage < 30000) return 'fast'; // Less than 30 seconds
        if (avgTimePerPage > 180000) return 'slow'; // More than 3 minutes
        return 'normal';
    }
    
    identifyStrongConcepts() {
        const session = this.currentSession;
        const strongConcepts = [];
        
        session.concepts.forEach((data, conceptId) => {
            if (data.understanding > 0.8 && data.confidence > 0.7) {
                strongConcepts.push({
                    conceptId,
                    understanding: data.understanding,
                    confidence: data.confidence
                });
            }
        });
        
        return strongConcepts.sort((a, b) => b.understanding - a.understanding);
    }
    
    identifyStruggleConcepts() {
        const session = this.currentSession;
        const struggleConcepts = [];
        
        session.concepts.forEach((data, conceptId) => {
            if (data.struggles > 2 || (data.understanding < 0.4 && data.interactions > 3)) {
                struggleConcepts.push({
                    conceptId,
                    understanding: data.understanding,
                    struggles: data.struggles,
                    timeSpent: data.timeSpent
                });
            }
        });
        
        return struggleConcepts.sort((a, b) => b.struggles - a.struggles);
    }
    
    analyzeEngagementPattern() {
        const session = this.currentSession;
        const events = session.events;
        
        // Analyze engagement over time
        const timeSlots = this.groupEventsByTimeSlots(events, 5 * 60 * 1000); // 5-minute slots
        
        const engagementLevels = timeSlots.map(slot => ({
            timestamp: slot.startTime,
            interactions: slot.events.filter(e => e.type === 'interaction').length,
            timeSpent: slot.duration,
            engagement: this.calculateEngagementScore(slot.events)
        }));
        
        return {
            levels: engagementLevels,
            averageEngagement: engagementLevels.reduce((sum, level) => 
                sum + level.engagement, 0) / engagementLevels.length,
            peakEngagement: Math.max(...engagementLevels.map(l => l.engagement)),
            pattern: this.identifyEngagementPattern(engagementLevels)
        };
    }
    
    groupEventsByTimeSlots(events, slotDuration) {
        if (events.length === 0) return [];
        
        const startTime = events[0].timestamp;
        const endTime = events[events.length - 1].timestamp;
        const slots = [];
        
        for (let time = startTime; time < endTime; time += slotDuration) {
            const slotEvents = events.filter(event => 
                event.timestamp >= time && event.timestamp < time + slotDuration
            );
            
            slots.push({
                startTime: time,
                endTime: time + slotDuration,
                duration: Math.min(slotDuration, endTime - time),
                events: slotEvents
            });
        }
        
        return slots;
    }
    
    calculateEngagementScore(events) {
        if (events.length === 0) return 0;
        
        const interactionWeight = 1.0;
        const assessmentWeight = 1.5;
        const conceptWeight = 2.0;
        
        let score = 0;
        
        events.forEach(event => {
            switch (event.type) {
                case 'interaction':
                    score += interactionWeight;
                    break;
                case 'assessment-answer':
                    score += assessmentWeight;
                    break;
                case 'concept-interaction':
                    score += conceptWeight;
                    break;
                default:
                    score += 0.5;
            }
        });
        
        return Math.min(10, score); // Cap at 10
    }
    
    identifyEngagementPattern(levels) {
        if (levels.length < 3) return 'insufficient-data';
        
        const trend = this.calculateTrend(levels.map(l => l.engagement));
        
        if (trend > 0.5) return 'increasing';
        if (trend < -0.5) return 'decreasing';
        
        const variance = this.calculateVariance(levels.map(l => l.engagement));
        
        if (variance > 2) return 'variable';
        return 'steady';
    }
    
    calculateTrend(values) {
        const n = values.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumXX += i * i;
        }
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }
    
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    }
    
    analyzeLearningPath() {
        const session = this.currentSession;
        const path = session.learningPath;
        
        return {
            totalSteps: path.length,
            uniqueLocations: new Set(path.map(step => step.location)).size,
            averageStepDuration: path.reduce((sum, step) => 
                sum + step.duration, 0) / path.length,
            backtrackingRate: this.calculateBacktrackingRate(path),
            pathEfficiency: this.calculatePathEfficiency(path)
        };
    }
    
    calculateBacktrackingRate(path) {
        if (path.length < 2) return 0;
        
        let backtracks = 0;
        const visited = new Set();
        
        path.forEach(step => {
            if (visited.has(step.location)) {
                backtracks++;
            } else {
                visited.add(step.location);
            }
        });
        
        return backtracks / path.length;
    }
    
    calculatePathEfficiency(path) {
        const uniqueSteps = new Set(path.map(step => step.location)).size;
        return path.length > 0 ? uniqueSteps / path.length : 0;
    }
    
    generateRecommendations() {
        return this.recommendations.generatePersonalizedRecommendations(
            this.currentSession,
            this.analyzeLearningPatterns()
        );
    }
    
    // Session management
    endSession() {
        if (!this.currentSession) return;
        
        this.currentSession.endTime = Date.now();
        this.currentSession.engagement.totalTime = 
            this.currentSession.endTime - this.currentSession.startTime;
        
        // Store completed session
        this.learningData.set(this.sessionId, { ...this.currentSession });
        
        // Save to storage
        this.saveData();
        
        console.log('Session ended:', this.sessionId, this.currentSession);
        
        this.currentSession = null;
    }
    
    setupEventListeners() {
        // Page visibility for session timeout
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });
        
        // Window close/reload
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });
        
        // Idle detection
        this.setupIdleDetection();
        
        // Global event listeners for automatic tracking
        this.setupAutomaticTracking();
    }
    
    setupIdleDetection() {
        let idleTimer = null;
        let isIdle = false;
        const idleTime = 2 * 60 * 1000; // 2 minutes
        
        const resetIdleTimer = () => {
            clearTimeout(idleTimer);
            
            if (isIdle) {
                isIdle = false;
                this.trackEvent('user-active');
            }
            
            idleTimer = setTimeout(() => {
                isIdle = true;
                this.trackEvent('user-idle');
            }, idleTime);
        };
        
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetIdleTimer, true);
        });
        
        resetIdleTimer();
    }
    
    setupAutomaticTracking() {
        // Track page views
        this.trackEvent('page-view', {
            location: window.location.pathname,
            chapter: this.getCurrentChapter()
        });
        
        // Track clicks on interactive elements
        document.addEventListener('click', (event) => {
            const element = event.target;
            
            if (element.matches('button, .interactive, .visualization-control')) {
                this.trackEvent('interaction', {
                    elementType: element.className,
                    elementId: element.id,
                    position: { x: event.clientX, y: event.clientY }
                });
            }
        });
        
        // Track form submissions
        document.addEventListener('submit', (event) => {
            this.trackEvent('form-submit', {
                formId: event.target.id,
                formClass: event.target.className
            });
        });
        
        // Track scroll depth
        this.setupScrollTracking();
    }
    
    setupScrollTracking() {
        let maxScroll = 0;
        let scrollMilestones = [25, 50, 75, 90, 100];
        let reachedMilestones = new Set();
        
        const trackScroll = () => {
            const scrollPercent = Math.round(
                (window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            maxScroll = Math.max(maxScroll, scrollPercent);
            
            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && !reachedMilestones.has(milestone)) {
                    reachedMilestones.add(milestone);
                    this.trackEvent('scroll-milestone', {
                        milestone,
                        scrollPercent
                    });
                }
            });
        };
        
        window.addEventListener('scroll', this.throttle(trackScroll, 1000));
    }
    
    setupPeriodicSave() {
        setInterval(() => {
            if (this.currentSession) {
                this.saveData();
            }
        }, this.options.saveInterval);
    }
    
    handlePageHidden() {
        if (this.currentSession) {
            this.trackEvent('page-hidden');
        }
    }
    
    handlePageVisible() {
        if (this.currentSession) {
            this.trackEvent('page-visible');
        }
    }
    
    // Utility methods
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getDeviceType() {
        if (/tablet|ipad/i.test(navigator.userAgent)) return 'tablet';
        if (/mobile|phone/i.test(navigator.userAgent)) return 'mobile';
        return 'desktop';
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    showAchievementNotification(milestoneType, data) {
        const messages = {
            'chapter-completed': `Chapter ${data.chapterId} completed! 🎉`,
            'concept-mastered': `You've mastered a new concept! 🧠`,
            'learning-streak': `${data.streak} correct answers in a row! 🔥`,
            'explorer': `Explorer badge earned! You've visited ${data.chaptersVisited} chapters! 🗺️`
        };
        
        const message = messages[milestoneType] || 'Achievement unlocked! 🏆';
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-message">${message}</div>
        `;
        
        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #000;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    // Public API
    trackLearningEvent(eventType, data) {
        this.trackEvent(eventType, data);
    }
    
    trackConceptLearning(conceptId, data) {
        this.trackConceptInteraction(conceptId, 'learned', data);
    }
    
    trackAssessmentAnswer(conceptId, correct, responseTime) {
        this.trackEvent('assessment-answer', {
            conceptId,
            correct,
            responseTime
        });
    }
    
    getSessionSummary() {
        if (!this.currentSession) return null;
        
        return {
            sessionId: this.currentSession.sessionId,
            duration: Date.now() - this.currentSession.startTime,
            chaptersVisited: this.currentSession.chapters.size,
            conceptsLearned: this.currentSession.concepts.size,
            interactions: this.currentSession.engagement.interactions,
            performance: {
                accuracy: this.currentSession.performance.totalAnswers > 0 
                    ? this.currentSession.performance.correctAnswers / this.currentSession.performance.totalAnswers 
                    : 0,
                masteredConcepts: this.currentSession.performance.masteredConcepts.size
            }
        };
    }
    
    getLearningProgress() {
        const allSessions = Array.from(this.learningData.values());
        allSessions.push(this.currentSession);
        
        const totalConcepts = new Set();
        const masteredConcepts = new Set();
        let totalTime = 0;
        
        allSessions.forEach(session => {
            if (!session) return;
            
            session.concepts?.forEach((data, conceptId) => {
                totalConcepts.add(conceptId);
                if (data.understanding > 0.8) {
                    masteredConcepts.add(conceptId);
                }
            });
            
            totalTime += session.engagement?.totalTime || 0;
        });
        
        return {
            totalConcepts: totalConcepts.size,
            masteredConcepts: masteredConcepts.size,
            progressPercentage: totalConcepts.size > 0 
                ? (masteredConcepts.size / totalConcepts.size) * 100 
                : 0,
            totalLearningTime: totalTime,
            sessionsCompleted: allSessions.length - 1 // Exclude current session
        };
    }
    
    getPersonalizedRecommendations() {
        return this.generateRecommendations();
    }
    
    exportLearningData() {
        return {
            sessions: Array.from(this.learningData.entries()),
            currentSession: this.currentSession,
            patterns: this.patterns.exportPatterns(),
            exportedAt: Date.now()
        };
    }
    
    clearData() {
        this.learningData.clear();
        localStorage.removeItem('aion-learning-data');
        this.startNewSession();
        console.log('Learning data cleared');
    }
    
    destroy() {
        this.endSession();
        // Remove event listeners would go here
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearningAnalytics;
}