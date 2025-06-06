// Chapter Navigation - Interactive Functionality

class ChapterNavigation {
  constructor() {
    this.chapters = document.querySelectorAll('.chapter-card');
    this.progressBar = document.querySelector('.progress-fill');
    this.progressText = document.querySelector('.progress-text');
    this.userProgress = this.loadProgress();
        
    this.init();
  }

  init() {
    this.setupChapterCards();
    this.updateOverallProgress();
    this.animateSymbols();
    this.setupKeyboardNavigation();
  }

  setupChapterCards() {
    this.chapters.forEach((card, index) => {
      const chapterNum = card.dataset.chapter;
      const progress = this.userProgress[chapterNum] || 0;
            
      // Set individual chapter progress
      card.style.setProperty('--progress', `${progress}%`);
            
      // Update chapter status
      if (progress === 100) {
        card.classList.add('completed');
      } else if (progress > 0) {
        card.classList.add('active');
      } else if (index > 0 && !this.isChapterUnlocked(chapterNum)) {
        card.classList.add('locked');
      }
            
      // Add click handler
      card.addEventListener('click', () => this.navigateToChapter(chapterNum));
            
      // Add hover effects
      card.addEventListener('mouseenter', (e) => this.handleHover(e, true));
      card.addEventListener('mouseleave', (e) => this.handleHover(e, false));
    });
  }

  navigateToChapter(chapterNum) {
    const card = document.querySelector(`[data-chapter="${chapterNum}"]`);
        
    if (card.classList.contains('locked')) {
      this.showLockedMessage();
      return;
    }
        
    // Create ripple effect
    this.createRippleEffect(card);
        
    // Navigate after animation
    setTimeout(() => {
      window.location.href = `chapter${chapterNum}.html`;
    }, 600);
  }

  createRippleEffect(card) {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 10;
        `;
        
    card.appendChild(ripple);
        
    // Animate ripple
    requestAnimationFrame(() => {
      ripple.style.transition = 'width 0.6s ease-out, height 0.6s ease-out, opacity 0.6s ease-out';
      ripple.style.width = '300px';
      ripple.style.height = '300px';
      ripple.style.opacity = '0';
    });
        
    setTimeout(() => ripple.remove(), 600);
  }

  handleHover(event, isEntering) {
    const card = event.currentTarget;
    const symbol = card.querySelector('.chapter-symbol svg');
        
    if (isEntering) {
      // Add glow effect to symbol
      symbol.style.filter = 'drop-shadow(0 0 20px var(--primary))';
            
      // Particle effect
      this.createParticles(card);
    } else {
      symbol.style.filter = '';
    }
  }

  createParticles(card) {
    const bounds = card.getBoundingClientRect();
    const particleCount = 5;
        
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: var(--primary);
                border-radius: 50%;
                pointer-events: none;
                z-index: 100;
            `;
            
      // Random starting position around the card
      const startX = bounds.left + Math.random() * bounds.width;
      const startY = bounds.top + Math.random() * bounds.height;
            
      particle.style.left = `${startX}px`;
      particle.style.top = `${startY}px`;
            
      document.body.appendChild(particle);
            
      // Animate particle
      const angle = (Math.PI * 2 / particleCount) * i;
      const distance = 50 + Math.random() * 50;
      const duration = 1000 + Math.random() * 500;
            
      particle.animate([
        {
          transform: 'translate(0, 0) scale(1)',
          opacity: 1
        },
        {
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
          opacity: 0
        }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }).onfinish = () => particle.remove();
    }
  }

  updateOverallProgress() {
    const totalChapters = 14;
    let completedChapters = 0;
    let totalProgress = 0;
        
    for (let i = 1; i <= totalChapters; i++) {
      const progress = this.userProgress[i] || 0;
      totalProgress += progress;
      if (progress === 100) completedChapters++;
    }
        
    const overallProgress = totalProgress / totalChapters;
    this.progressBar.style.width = `${overallProgress}%`;
        
    // Update progress text
    if (overallProgress === 0) {
      this.progressText.textContent = 'Begin your journey';
    } else if (overallProgress === 100) {
      this.progressText.textContent = 'Journey complete - You have achieved individuation';
    } else {
      this.progressText.textContent = `${completedChapters} of ${totalChapters} chapters completed`;
    }
  }

  animateSymbols() {
    // Add unique animations to specific symbols
    const symbols = {
      '.shadow-symbol': this.animateShadow,
      '.syzygy-symbol': this.animateSyzygy,
      '.fish-symbol': this.animateFish,
      '.gnostic-symbol': this.animateGnostic,
      '.self-symbol': this.animateSelf
    };
        
    Object.entries(symbols).forEach(([selector, animateFunc]) => {
      const element = document.querySelector(selector);
      if (element) {
        animateFunc.call(this, element);
      }
    });
  }

  animateShadow(svg) {
    const ellipses = svg.querySelectorAll('ellipse');
    let opacity = 0.5;
    let increasing = true;
        
    setInterval(() => {
      if (increasing) {
        opacity += 0.01;
        if (opacity >= 1) increasing = false;
      } else {
        opacity -= 0.01;
        if (opacity <= 0.5) increasing = true;
      }
      ellipses[1].style.opacity = opacity;
    }, 50);
  }

  animateSyzygy(svg) {
    const circles = svg.querySelectorAll('circle');
    const path = svg.querySelector('path');
    let angle = 0;
        
    setInterval(() => {
      angle += 0.02;
      const offset = Math.sin(angle) * 5;
      circles[0].setAttribute('cx', 30 + offset);
      circles[1].setAttribute('cx', 70 - offset);
            
      path.setAttribute('d', `M${30 + offset} 50 Q50 ${30 - offset/2}, ${70 - offset} 50 Q50 ${70 + offset/2}, ${30 + offset} 50`);
    }, 50);
  }

  animateFish(svg) {
    const paths = svg.querySelectorAll('path');
    let scale = 1;
    let growing = true;
        
    setInterval(() => {
      if (growing) {
        scale += 0.005;
        if (scale >= 1.1) growing = false;
      } else {
        scale -= 0.005;
        if (scale <= 1) growing = true;
      }
      paths[0].style.transform = `scale(${scale})`;
    }, 50);
  }

  animateGnostic(svg) {
    const circles = svg.querySelectorAll('circle');
    circles.forEach((circle, index) => {
      const delay = index * 200;
      setTimeout(() => {
        circle.style.animation = `ripple 3s ease-out infinite ${delay}ms`;
      }, delay);
    });
  }

  animateSelf(svg) {
    const innerCircle = svg.querySelector('circle:last-child');
    let rotation = 0;
        
    setInterval(() => {
      rotation += 1;
      svg.style.transform = `rotate(${rotation}deg)`;
      innerCircle.style.transform = `rotate(${-rotation}deg)`;
    }, 50);
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const cards = Array.from(this.chapters);
        const focused = document.activeElement;
        const currentIndex = cards.indexOf(focused);
                
        if (currentIndex !== -1) {
          const nextIndex = e.key === 'ArrowRight' 
            ? Math.min(currentIndex + 1, cards.length - 1)
            : Math.max(currentIndex - 1, 0);
                    
          cards[nextIndex].focus();
        }
      }
    });
  }

  isChapterUnlocked(chapterNum) {
    // Sequential unlocking - must complete previous chapter
    if (chapterNum === '1') return true;
        
    const prevChapter = parseInt(chapterNum) - 1;
    const prevProgress = this.userProgress[prevChapter] || 0;
        
    return prevProgress >= 50; // Unlock when previous chapter is 50% complete
  }

  showLockedMessage() {
    const message = document.createElement('div');
    message.className = 'locked-message';
    message.textContent = 'Complete the previous chapter to unlock this content';
    message.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 0.95rem;
            z-index: 1000;
            animation: slideUp 0.3s ease-out;
        `;
        
    document.body.appendChild(message);
        
    setTimeout(() => {
      message.style.animation = 'slideDown 0.3s ease-out';
      setTimeout(() => message.remove(), 300);
    }, 3000);
  }

  loadProgress() {
    const saved = localStorage.getItem('aionProgress');
    return saved ? JSON.parse(saved) : {};
  }

  saveProgress(chapterNum, progress) {
    this.userProgress[chapterNum] = progress;
    localStorage.setItem('aionProgress', JSON.stringify(this.userProgress));
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ChapterNavigation();
});

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            transform: translate(-50%, 100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
    
    @keyframes slideDown {
        from {
            transform: translate(-50%, 0);
            opacity: 1;
        }
        to {
            transform: translate(-50%, 100%);
            opacity: 0;
        }
    }
    
    .chapter-card:focus {
        outline: 2px solid var(--primary);
        outline-offset: 4px;
    }
`;
document.head.appendChild(style);