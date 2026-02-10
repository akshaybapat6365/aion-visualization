/**
 * motion-init.js
 * Lazy-loads the magnetic cursor system on desktop devices
 * and registers liquid-transition CSS for page navigation.
 * 
 * Safe to include on every page — feature-detects automatically.
 */

const REDUCED = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ─── Magnetic Cursor (desktop only, fine pointer) ─── */
function initMagneticCursor() {
    if (REDUCED) return;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    import('./magnetic-cursor/index.js')
        .then(({ MagneticCursorSystem }) => {
            window.magneticCursor = new MagneticCursorSystem({
                enableTrail: true,
                enableButtons: true,
                enableLinks: true,
                performanceMode: 'auto'
            });
        })
        .catch(() => {
            /* Non-critical, silently degrade */
        });
}

/* ─── Liquid Page Transitions ─── */
function initLiquidTransitions() {
    if (REDUCED) return;

    // Inject transition overlay styles
    const style = document.createElement('style');
    style.textContent = `
    .page-transition-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      pointer-events: none;
      background: radial-gradient(circle at var(--tx, 50%) var(--ty, 50%),
        rgba(212, 175, 55, 0.08) 0%,
        rgba(0, 0, 0, 0.92) 70%);
      opacity: 0;
      transition: opacity 280ms cubic-bezier(0.32, 0.72, 0, 1);
    }
    .page-transition-overlay.active {
      opacity: 1;
      pointer-events: all;
    }
  `;
    document.head.appendChild(style);

    // Intercept internal navigation links for smooth transition
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        // Only intercept internal links, not anchors or external
        if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
        if (link.target === '_blank') return;

        e.preventDefault();

        const rect = link.getBoundingClientRect();
        const tx = ((rect.left + rect.width / 2) / window.innerWidth * 100).toFixed(1);
        const ty = ((rect.top + rect.height / 2) / window.innerHeight * 100).toFixed(1);

        const overlay = document.createElement('div');
        overlay.className = 'page-transition-overlay';
        overlay.style.setProperty('--tx', `${tx}%`);
        overlay.style.setProperty('--ty', `${ty}%`);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });

        setTimeout(() => {
            window.location.href = href;
        }, 200);
    });
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
    initMagneticCursor();
    initLiquidTransitions();
});
