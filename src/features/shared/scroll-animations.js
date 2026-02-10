/**
 * scroll-animations.js
 * Scroll-based animations: parallax hero, reading progress bar,
 * and staggered section reveal using IntersectionObserver.
 *
 * Deferred for reduced-motion preferences.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ─── Reading Progress Bar ─── */
function initProgressBar() {
    const bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Reading progress');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    document.body.appendChild(bar);

    const style = document.createElement('style');
    style.textContent = `
    .reading-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 2px;
      width: 0%;
      background: linear-gradient(90deg, var(--color-accent, #D4AF37), var(--color-cyan, #67e8f9));
      z-index: 99999;
      pointer-events: none;
      transition: width 60ms linear;
    }
    @media (prefers-reduced-motion: reduce) {
      .reading-progress { transition: none; }
    }
  `;
    document.head.appendChild(style);

    const update = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
        bar.style.width = `${pct}%`;
        bar.setAttribute('aria-valuenow', Math.round(pct));
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
}

/* ─── Parallax Hero ─── */
function initParallaxHero() {
    if (REDUCED) return;
    const hero = document.querySelector('.page-hero, .landing-hero');
    if (!hero) return;

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const heroHeight = hero.offsetHeight;
            if (scrollY < heroHeight * 1.5) {
                hero.style.transform = `translateY(${scrollY * 0.25}px)`;
                hero.style.opacity = Math.max(1 - scrollY / (heroHeight * 1.2), 0);
            }
            ticking = false;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
}

/* ─── Staggered Section Reveal ─── */
function initSectionReveal() {
    const sections = document.querySelectorAll(
        '.concept-card, .chapter-card, .symbols-detail__section, ' +
        '.about-card, .viz-preview-link, .timeline-item'
    );

    if (sections.length === 0) return;

    const style = document.createElement('style');
    style.textContent = `
    .reveal-ready {
      opacity: 0;
      transform: translateY(18px);
      transition: opacity 0.45s ease, transform 0.45s ease;
    }
    .reveal-ready.revealed {
      opacity: 1;
      transform: translateY(0);
    }
    @media (prefers-reduced-motion: reduce) {
      .reveal-ready {
        opacity: 1;
        transform: none;
        transition: none;
      }
    }
  `;
    document.head.appendChild(style);

    if (REDUCED) return; // Styles handle fallback

    sections.forEach((section, i) => {
        section.classList.add('reveal-ready');
        section.style.transitionDelay = `${Math.min(i % 6, 5) * 80}ms`;
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    sections.forEach((section) => observer.observe(section));
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
    initProgressBar();
    initParallaxHero();
    initSectionReveal();
});
