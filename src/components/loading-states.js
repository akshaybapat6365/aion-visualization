/**
 * Loading States Component System
 * Professional loading indicators for all async operations
 * Follows the monochromatic design system
 */

export class LoadingStates {
  constructor() {
    this.activeLoaders = new Map();
    this.init();
  }

  init() {
    this.injectStyles();
    this.createTemplates();
  }

  injectStyles() {
    if (document.getElementById('loading-states-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'loading-states-styles';
    styles.textContent = `
      /* Loading Container */
      .loading-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 10, 10, 0.95);
        backdrop-filter: blur(10px);
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      .loading-container.active {
        opacity: 1;
        pointer-events: all;
      }

      /* Chapter Transition Loader */
      .chapter-loader {
        text-align: center;
        color: var(--grey-050, #F0F0F0);
      }

      .chapter-loader-title {
        font-size: 3rem;
        font-weight: 300;
        letter-spacing: 0.2em;
        margin-bottom: 2rem;
        animation: fadeInUp 0.6s ease-out;
      }

      .chapter-loader-progress {
        width: 200px;
        height: 2px;
        background: var(--grey-700, #1F1F1F);
        border-radius: 2px;
        overflow: hidden;
        margin: 0 auto 2rem;
      }

      .chapter-loader-progress-bar {
        height: 100%;
        background: var(--grey-050, #F0F0F0);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
      }

      .chapter-loader-subtitle {
        font-size: 1rem;
        color: var(--grey-300, #707070);
        letter-spacing: 0.1em;
        animation: fadeInUp 0.6s ease-out 0.2s both;
      }

      /* 3D Visualization Loader */
      .viz-loader {
        position: relative;
        width: 120px;
        height: 120px;
      }

      .viz-loader-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 2px solid var(--grey-700, #1F1F1F);
        border-radius: 50%;
        animation: vizLoaderRotate 2s linear infinite;
      }

      .viz-loader-ring::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border-radius: 50%;
        border: 2px solid transparent;
        border-top-color: var(--grey-050, #F0F0F0);
        animation: vizLoaderRotate 1s linear infinite;
      }

      .viz-loader-inner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
        border: 1px solid var(--grey-600, #2A2A2A);
        border-radius: 50%;
        animation: vizLoaderPulse 2s ease-in-out infinite;
      }

      .viz-loader-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 0.75rem;
        color: var(--grey-300, #707070);
        letter-spacing: 0.1em;
        white-space: nowrap;
      }

      /* Inline Content Loader */
      .content-loader {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--grey-300, #707070);
        font-size: 0.875rem;
      }

      .content-loader-dots {
        display: flex;
        gap: 0.25rem;
      }

      .content-loader-dot {
        width: 4px;
        height: 4px;
        background: var(--grey-300, #707070);
        border-radius: 50%;
        animation: contentLoaderDot 1.4s ease-in-out infinite;
      }

      .content-loader-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .content-loader-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      /* Skeleton Loader */
      .skeleton-loader {
        background: linear-gradient(
          90deg,
          var(--grey-800, #141414) 25%,
          var(--grey-700, #1F1F1F) 50%,
          var(--grey-800, #141414) 75%
        );
        background-size: 200% 100%;
        animation: skeletonWave 1.5s ease-in-out infinite;
        border-radius: 4px;
      }

      .skeleton-text {
        height: 1em;
        margin-bottom: 0.5em;
      }

      .skeleton-title {
        height: 2em;
        width: 60%;
        margin-bottom: 1em;
      }

      .skeleton-paragraph {
        height: 4em;
      }

      /* Animations */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes vizLoaderRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes vizLoaderPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.7; }
      }

      @keyframes contentLoaderDot {
        0%, 60%, 100% { transform: scale(1); opacity: 0.3; }
        30% { transform: scale(1.3); opacity: 1; }
      }

      @keyframes skeletonWave {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      /* Reduced Motion Support */
      @media (prefers-reduced-motion: reduce) {
        .chapter-loader-title,
        .chapter-loader-subtitle {
          animation: none;
          opacity: 1;
        }

        .viz-loader-ring,
        .viz-loader-ring::before,
        .viz-loader-inner {
          animation: none;
        }

        .content-loader-dot {
          animation: none;
          opacity: 0.5;
        }

        .skeleton-loader {
          animation: none;
          background: var(--grey-800, #141414);
        }
      }
    `;
    document.head.appendChild(styles);
  }

  createTemplates() {
    // Create reusable loader container
    const container = document.createElement('div');
    container.className = 'loading-container';
    container.id = 'global-loader';
    document.body.appendChild(container);
  }

  // Show chapter transition loader
  showChapterLoader(chapterNumber, chapterTitle) {
    const container = document.getElementById('global-loader');
    const loaderId = `chapter-${chapterNumber}`;

    container.innerHTML = `
      <div class="chapter-loader" data-loader-id="${loaderId}">
        <h2 class="chapter-loader-title">Chapter ${chapterNumber}</h2>
        <div class="chapter-loader-progress">
          <div class="chapter-loader-progress-bar" id="${loaderId}-progress"></div>
        </div>
        <p class="chapter-loader-subtitle">${chapterTitle}</p>
      </div>
    `;

    container.classList.add('active');
    this.activeLoaders.set(loaderId, { type: 'chapter', startTime: Date.now() });

    // Simulate progress
    this.animateProgress(loaderId);

    return loaderId;
  }

  // Show 3D visualization loader
  showVizLoader(message = 'Loading Visualization') {
    const container = document.getElementById('global-loader');
    const loaderId = `viz-${Date.now()}`;

    container.innerHTML = `
      <div class="viz-loader" data-loader-id="${loaderId}">
        <div class="viz-loader-ring"></div>
        <div class="viz-loader-inner"></div>
        <div class="viz-loader-text">${message}</div>
      </div>
    `;

    container.classList.add('active');
    this.activeLoaders.set(loaderId, { type: 'viz', startTime: Date.now() });

    return loaderId;
  }

  // Show inline content loader
  showContentLoader(targetElement, message = 'Loading') {
    const loaderId = `content-${Date.now()}`;
    const loader = document.createElement('div');
    loader.className = 'content-loader';
    loader.dataset.loaderId = loaderId;
    loader.innerHTML = `
      <span>${message}</span>
      <span class="content-loader-dots">
        <span class="content-loader-dot"></span>
        <span class="content-loader-dot"></span>
        <span class="content-loader-dot"></span>
      </span>
    `;

    const originalContent = targetElement.innerHTML;
    targetElement.innerHTML = '';
    targetElement.appendChild(loader);

    this.activeLoaders.set(loaderId, { 
      type: 'content', 
      element: targetElement,
      originalContent,
      startTime: Date.now() 
    });

    return loaderId;
  }

  // Create skeleton loader
  createSkeleton(type = 'paragraph') {
    const skeleton = document.createElement('div');
    skeleton.className = `skeleton-loader skeleton-${type}`;
    return skeleton;
  }

  // Animate progress bar
  animateProgress(loaderId, duration = 2000) {
    const progressBar = document.getElementById(`${loaderId}-progress`);
    if (!progressBar) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      progress = Math.min(progress, 90); // Never complete automatically
      progressBar.style.transform = `scaleX(${progress / 100})`;

      if (progress >= 90) {
        clearInterval(interval);
      }
    }, duration / 10);

    this.activeLoaders.get(loaderId).interval = interval;
  }

  // Complete loading
  hideLoader(loaderId, minDuration = 500) {
    const loaderData = this.activeLoaders.get(loaderId);
    if (!loaderData) return;

    const elapsed = Date.now() - loaderData.startTime;
    const delay = Math.max(0, minDuration - elapsed);

    setTimeout(() => {
      if (loaderData.type === 'chapter' || loaderData.type === 'viz') {
        const container = document.getElementById('global-loader');
        
        // Complete progress bar if exists
        const progressBar = document.getElementById(`${loaderId}-progress`);
        if (progressBar) {
          progressBar.style.transform = 'scaleX(1)';
        }

        // Fade out after progress completes
        setTimeout(() => {
          container.classList.remove('active');
          setTimeout(() => {
            container.innerHTML = '';
          }, 300);
        }, 200);
      } else if (loaderData.type === 'content') {
        loaderData.element.innerHTML = loaderData.originalContent;
      }

      // Clear interval if exists
      if (loaderData.interval) {
        clearInterval(loaderData.interval);
      }

      this.activeLoaders.delete(loaderId);
    }, delay);
  }

  // Hide all active loaders
  hideAll() {
    this.activeLoaders.forEach((data, loaderId) => {
      this.hideLoader(loaderId, 0);
    });
  }
}

// Export singleton instance
export const loadingStates = new LoadingStates();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.loadingStates = loadingStates;
  });
} else {
  window.loadingStates = loadingStates;
}