// Progress Tracking System for Aion Visualization
// Tracks user progress through chapters and visualizations

class ProgressTracker {
  constructor() {
    this.storageKey = 'aion-progress';
    this.sessionKey = 'aion-session';
    this.progress = this.loadProgress();
    this.session = this.initSession();
    this.initUI();
  }

  // Load progress from localStorage
  loadProgress() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : this.getDefaultProgress();
    } catch (error) {
      console.error('Failed to load progress:', error);
      return this.getDefaultProgress();
    }
  }

  // Get default progress structure
  getDefaultProgress() {
    return {
      chapters: {},
      totalChapters: 14,
      startDate: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
      achievements: [],
      stats: {
        totalTimeSpent: 0,
        visualizationsInteracted: 0,
        pagesVisited: 0
      }
    };
  }

  // Initialize session tracking
  initSession() {
    const session = {
      startTime: Date.now(),
      pagesVisited: [],
      interactions: []
    };
    sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
    return session;
  }

  // Save progress to localStorage
  saveProgress() {
    try {
      this.progress.lastVisit = new Date().toISOString();
      localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
      this.updateUI();
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  // Mark chapter as started
  startChapter(chapterNumber) {
    if (!this.progress.chapters[chapterNumber]) {
      this.progress.chapters[chapterNumber] = {
        started: new Date().toISOString(),
        completed: false,
        timeSpent: 0,
        visualizationsViewed: [],
        notes: []
      };
    }
        
    this.session.pagesVisited.push({
      chapter: chapterNumber,
      timestamp: Date.now()
    });
        
    this.saveProgress();
    this.announce(`Started Chapter ${chapterNumber}`);
  }

  // Mark chapter as completed
  completeChapter(chapterNumber) {
    if (this.progress.chapters[chapterNumber]) {
      this.progress.chapters[chapterNumber].completed = true;
      this.progress.chapters[chapterNumber].completedDate = new Date().toISOString();

      // Check for achievements
      this.checkAchievements();
      this.saveProgress();
      this.announce(`Completed Chapter ${chapterNumber}!`);

      // Show completion animation
      this.showCompletionAnimation();

      // Update leaderboard if available
      if (window.leaderboard) {
        const score = this.getCompletedChaptersCount();
        window.leaderboard.updateScore('You', score);
      }

      // Dispatch event for other systems
      window.dispatchEvent(new CustomEvent('chapterCompleted', { detail: { chapter: chapterNumber } }));
    }
  }

  // Track visualization interaction
  trackVisualization(chapterNumber, visualizationId) {
    if (this.progress.chapters[chapterNumber]) {
      if (!this.progress.chapters[chapterNumber].visualizationsViewed.includes(visualizationId)) {
        this.progress.chapters[chapterNumber].visualizationsViewed.push(visualizationId);
        this.progress.stats.visualizationsInteracted++;
      }
    }
        
    this.session.interactions.push({
      type: 'visualization',
      id: visualizationId,
      chapter: chapterNumber,
      timestamp: Date.now()
    });
        
    this.saveProgress();
  }

  // Calculate overall progress percentage
  getProgressPercentage() {
    const completedChapters = Object.values(this.progress.chapters)
      .filter(chapter => chapter.completed).length;
    return Math.round((completedChapters / this.progress.totalChapters) * 100);
  }

  // Get chapter progress
  getChapterProgress(chapterNumber) {
    return this.progress.chapters[chapterNumber] || null;
  }

  // Check and award achievements
  checkAchievements() {
    const achievements = [];
        
    // First chapter completed
    if (this.getCompletedChaptersCount() === 1 && !this.hasAchievement('first-step')) {
      achievements.push({
        id: 'first-step',
        name: 'First Step',
        description: 'Complete your first chapter',
        icon: '🌱',
        date: new Date().toISOString()
      });
    }
        
    // Half way through
    if (this.getCompletedChaptersCount() === 7 && !this.hasAchievement('halfway')) {
      achievements.push({
        id: 'halfway',
        name: 'Halfway There',
        description: 'Complete half of the chapters',
        icon: '🌓',
        date: new Date().toISOString()
      });
    }
        
    // All chapters completed
    if (this.getCompletedChaptersCount() === 14 && !this.hasAchievement('individuated')) {
      achievements.push({
        id: 'individuated',
        name: 'Individuated',
        description: 'Complete all chapters',
        icon: '🌟',
        date: new Date().toISOString()
      });
    }
        
    // Add new achievements
    achievements.forEach(achievement => {
      this.progress.achievements.push(achievement);
      this.showAchievementNotification(achievement);
    });
        
    if (achievements.length > 0) {
      this.saveProgress();
    }
  }

  // Check if user has achievement
  hasAchievement(achievementId) {
    return this.progress.achievements.some(a => a.id === achievementId);
  }

  // Get completed chapters count
  getCompletedChaptersCount() {
    return Object.values(this.progress.chapters)
      .filter(chapter => chapter.completed).length;
  }

  // Initialize progress UI
  initUI() {
    // Create progress bar container
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-tracker';
    progressBar.className = 'progress-tracker';
    progressBar.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${this.getProgressPercentage()}%"></div>
                </div>
                <span class="progress-text">${this.getProgressPercentage()}% Complete</span>
            </div>
            <button class="progress-details-btn" aria-label="View progress details">📊</button>
        `;
        
    // Add to page if not in minimal mode
    if (!document.body.classList.contains('minimal-ui')) {
      document.body.appendChild(progressBar);
    }
        
    // Add event listeners
    const detailsBtn = progressBar.querySelector('.progress-details-btn');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => this.showProgressDetails());
    }
  }

  // Update progress UI
  updateUI() {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
        
    if (progressFill && progressText) {
      const percentage = this.getProgressPercentage();
      progressFill.style.width = `${percentage}%`;
      progressText.textContent = `${percentage}% Complete`;
    }
  }

  // Show detailed progress modal
  showProgressDetails() {
    const modal = document.createElement('div');
    modal.className = 'progress-modal';
    modal.innerHTML = `
            <div class="progress-modal-content">
                <button class="close-modal">&times;</button>
                <h2>Your Journey Through Aion</h2>
                
                <div class="progress-stats">
                    <div class="stat">
                        <h3>${this.getCompletedChaptersCount()}</h3>
                        <p>Chapters Completed</p>
                    </div>
                    <div class="stat">
                        <h3>${this.progress.stats.visualizationsInteracted}</h3>
                        <p>Visualizations Explored</p>
                    </div>
                    <div class="stat">
                        <h3>${this.getTimeSpent()}</h3>
                        <p>Time Invested</p>
                    </div>
                </div>
                
                <div class="chapter-progress">
                    <h3>Chapter Progress</h3>
                    ${this.generateChapterProgressHTML()}
                </div>
                
                <div class="achievements">
                    <h3>Achievements</h3>
                    ${this.generateAchievementsHTML()}
                </div>
            </div>
        `;
        
    document.body.appendChild(modal);
        
    // Close button
    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.remove();
    });
        
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Generate chapter progress HTML
  generateChapterProgressHTML() {
    let html = '<div class="chapter-grid">';
        
    for (let i = 1; i <= 14; i++) {
      const chapter = this.progress.chapters[i];
      const status = chapter ? (chapter.completed ? 'completed' : 'started') : 'not-started';
            
      html += `
                <div class="chapter-status ${status}">
                    <span class="chapter-number">${i}</span>
                    ${status === 'completed' ? '✓' : status === 'started' ? '◐' : '○'}
                </div>
            `;
    }
        
    html += '</div>';
    return html;
  }

  // Generate achievements HTML
  generateAchievementsHTML() {
    if (this.progress.achievements.length === 0) {
      return '<p class="no-achievements">No achievements yet. Keep exploring!</p>';
    }
        
    let html = '<div class="achievement-list">';
        
    this.progress.achievements.forEach(achievement => {
      html += `
                <div class="achievement-item">
                    <span class="achievement-icon">${achievement.icon}</span>
                    <div class="achievement-info">
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                    </div>
                </div>
            `;
    });
        
    html += '</div>';
    return html;
  }

  // Calculate time spent
  getTimeSpent() {
    const totalMinutes = Math.round(this.progress.stats.totalTimeSpent / 60000);
        
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  }

  // Show achievement notification
  showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
            <div class="achievement-content">
                <span class="achievement-icon">${achievement.icon}</span>
                <div>
                    <h4>Achievement Unlocked!</h4>
                    <p>${achievement.name}</p>
                </div>
            </div>
        `;
        
    document.body.appendChild(notification);
        
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
        
    // Remove after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // Show completion animation
  showCompletionAnimation() {
    const animation = document.createElement('div');
    animation.className = 'completion-animation';
    animation.innerHTML = `
            <div class="completion-circle">
                <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="283" stroke-dashoffset="283">
                        <animate attributeName="stroke-dashoffset" to="0" dur="1s" fill="freeze"/>
                    </circle>
                    <text x="50" y="55" text-anchor="middle" font-size="30" fill="var(--accent)">✓</text>
                </svg>
            </div>
        `;
        
    document.body.appendChild(animation);
        
    setTimeout(() => {
      animation.classList.add('fade-out');
      setTimeout(() => animation.remove(), 500);
    }, 2000);
  }

  // Announce to screen readers
  announce(message) {
    const announcer = document.getElementById('aria-announcer');
    if (announcer) {
      announcer.textContent = message;
    }
  }

  // Update time spent
  updateTimeSpent() {
    const sessionTime = Date.now() - this.session.startTime;
    this.progress.stats.totalTimeSpent += sessionTime;
    this.saveProgress();
  }

  // Export progress data
  exportProgress() {
    const data = JSON.stringify(this.progress, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
        
    const a = document.createElement('a');
    a.href = url;
    a.download = `aion-progress-${new Date().toISOString()}.json`;
    a.click();
        
    URL.revokeObjectURL(url);
  }

  // Reset progress
  resetProgress() {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      localStorage.removeItem(this.storageKey);
      this.progress = this.getDefaultProgress();
      this.saveProgress();
      location.reload();
    }
  }
}

// CSS for progress tracker
const progressStyles = `
<style>
/* Progress Tracker Bar */
.progress-tracker {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 80px;
    background: var(--surface-glass);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-default);
    border-radius: 25px;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 90;
    transition: all 0.3s ease;
}

.progress-container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.progress-bar {
    flex: 1;
    height: 8px;
    background: var(--surface-secondary);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent-light));
    border-radius: 4px;
    transition: width 0.5s ease;
}

.progress-text {
    font-size: 0.875rem;
    color: var(--text-secondary);
    min-width: 80px;
}

.progress-details-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.progress-details-btn:hover {
    background: var(--surface-glass-hover);
}

/* Progress Modal */
.progress-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
}

.progress-modal-content {
    background: var(--surface-secondary);
    border: 1px solid var(--border-default);
    border-radius: 1rem;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    padding: 2rem;
    position: relative;
}

.close-modal {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 2rem;
    color: var(--text-secondary);
    cursor: pointer;
}

/* Progress Stats */
.progress-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin: 2rem 0;
}

.stat {
    text-align: center;
    padding: 1rem;
    background: var(--surface-glass);
    border-radius: 0.5rem;
}

.stat h3 {
    font-size: 2rem;
    color: var(--accent);
    margin: 0;
}

.stat p {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
}

/* Chapter Grid */
.chapter-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
    margin: 1rem 0;
}

.chapter-status {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--surface-glass);
    border: 2px solid var(--border-default);
    border-radius: 0.5rem;
    font-size: 0.875rem;
    position: relative;
}

.chapter-status.completed {
    border-color: var(--accent);
    color: var(--accent);
}

.chapter-status.started {
    border-color: #FFD700;
    color: #FFD700;
}

.chapter-number {
    font-size: 0.75rem;
    position: absolute;
    top: 0.25rem;
    left: 0.5rem;
    color: var(--text-tertiary);
}

/* Achievements */
.achievement-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem 0;
}

.achievement-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-glass);
    border-radius: 0.5rem;
}

.achievement-icon {
    font-size: 2rem;
}

.achievement-info h4 {
    margin: 0 0 0.25rem;
}

.achievement-info p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.no-achievements {
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
}

/* Achievement Notification */
.achievement-notification {
    position: fixed;
    top: 2rem;
    right: -400px;
    background: var(--surface-secondary);
    border: 2px solid var(--accent);
    border-radius: 0.5rem;
    padding: 1rem;
    z-index: 1001;
    transition: right 0.3s ease;
}

.achievement-notification.show {
    right: 2rem;
}

.achievement-content {
    display: flex;
    align-items: center;
    gap: 1rem;
}

/* Completion Animation */
.completion-animation {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1002;
}

.completion-circle {
    width: 100px;
    height: 100px;
}

.completion-animation.fade-out {
    opacity: 0;
    transition: opacity 0.5s ease;
}

/* Mobile Adjustments */
@media (max-width: 767px) {
    .progress-tracker {
        bottom: 10px;
        left: 10px;
        right: 10px;
        font-size: 0.75rem;
    }
    
    .progress-stats {
        grid-template-columns: 1fr;
    }
    
    .chapter-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* Minimal UI Mode */
.minimal-ui .progress-tracker {
    display: none;
}
</style>
`;

// Inject styles
if (!document.getElementById('progress-tracker-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'progress-tracker-styles';
  styleElement.innerHTML = progressStyles;
  document.head.appendChild(styleElement.firstElementChild);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  window.progressTracker = new ProgressTracker();
});

// Update time spent on page unload
window.addEventListener('beforeunload', () => {
  if (window.progressTracker) {
    window.progressTracker.updateTimeSpent();
  }
});

// Export as global
window.ProgressTracker = ProgressTracker;