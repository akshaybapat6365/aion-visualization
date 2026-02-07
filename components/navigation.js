// Global navigation shell for Aion Visualization

const CHAPTERS = [
  { number: 1, title: 'The Ego', cluster: 'Identity' },
  { number: 2, title: 'The Shadow', cluster: 'Identity' },
  { number: 3, title: 'The Syzygy: Anima and Animus', cluster: 'Relational Psyche' },
  { number: 4, title: 'The Self', cluster: 'Selfhood' },
  { number: 5, title: 'Christ, A Symbol of the Self', cluster: 'Selfhood' },
  { number: 6, title: 'The Sign of the Fishes', cluster: 'Symbolism' },
  { number: 7, title: 'The Prophecies of Nostradamus', cluster: 'Symbolism' },
  { number: 8, title: 'The Historical Significance of the Fish', cluster: 'Symbolism' },
  { number: 9, title: 'The Ambivalence of the Fish Symbol', cluster: 'Symbolism' },
  { number: 10, title: 'The Fish in Alchemy', cluster: 'Alchemy' },
  { number: 11, title: 'The Alchemical Interpretation of the Fish', cluster: 'Alchemy' },
  { number: 12, title: 'Background to the Psychology of Christian Alchemical Symbolism', cluster: 'Alchemy' },
  { number: 13, title: 'Gnostic Symbols of the Self', cluster: 'Cosmology' },
  { number: 14, title: 'The Structure and Dynamics of the Self', cluster: 'Cosmology' }
];

const ROUTE_MODE_KEY = 'aion-route-mode';
const NAV_COLLAPSED_KEY = 'aion-nav-collapsed';
const LAST_CHAPTER_KEY = 'aion-last-chapter';
const MODE_JOURNEY = 'journey';
const MODE_ATLAS = 'atlas';

function getCurrentChapterNumber(pathname = window.location.pathname) {
  const chapterMatch = pathname.match(/chapter-?(\d+)/);
  return chapterMatch ? Number(chapterMatch[1]) : null;
}

function getRouteMode(pathname = window.location.pathname) {
  if (pathname.startsWith('/atlas')) {
    return MODE_ATLAS;
  }

  const savedMode = localStorage.getItem(ROUTE_MODE_KEY);
  return savedMode === MODE_ATLAS ? MODE_ATLAS : MODE_JOURNEY;
}

function buildJourneyPath(chapterNumber) {
  return `/journey/chapter-${chapterNumber}`;
}

function trackNavigationEvent(eventType, details = {}) {
  const payload = {
    eventType,
    ...details,
    path: window.location.pathname,
    timestamp: new Date().toISOString()
  };

  if (window.learningAnalytics && typeof window.learningAnalytics.trackEvent === 'function') {
    window.learningAnalytics.trackEvent(eventType, payload);
  }

  if (window.gtag) {
    window.gtag('event', eventType, payload);
  }
}

function createNavigation() {
  const currentChapter = getCurrentChapterNumber();
  const routeMode = getRouteMode();
  const navCollapsed = localStorage.getItem(NAV_COLLAPSED_KEY) === 'true';

  const nav = document.createElement('nav');
  nav.className = `aion-nav${navCollapsed ? ' collapsed' : ''}`;
  nav.innerHTML = `
    <style>
      .aion-nav { position: fixed; left: 0; top: 0; width: 250px; height: 100vh; background: rgba(0,0,0,.95); border-right: 1px solid rgba(212,175,55,.15); box-shadow: 2px 0 10px rgba(0,0,0,.3); overflow-y: auto; z-index: 1000; transform: translateX(0); transition: transform .3s ease; }
      .aion-nav.collapsed { transform: translateX(-250px); }
      .nav-toggle { position: fixed; left: 260px; top: 20px; background: #000; border: 1px solid #D4AF37; color: #D4AF37; padding: .5rem 1rem; cursor: pointer; z-index: 1001; }
      .nav-toggle.shifted { left: 10px; }
      .nav-header { padding: 1.4rem 1.5rem; border-bottom: 1px solid rgba(212,175,55,.15); }
      .nav-header h2 { margin: 0; color: #D4AF37; font-size: 1.4rem; font-weight: 300; letter-spacing: 2px; }
      .nav-header p { margin: .35rem 0 0; color: #888; font-size: .85rem; }
      .mode-switcher { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; margin-top: .9rem; }
      .mode-switcher button { border: 1px solid rgba(212,175,55,.35); background: transparent; color: #bbb; padding: .45rem .55rem; cursor: pointer; font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; }
      .mode-switcher button.active { background: rgba(212,175,55,.2); color: #fff; border-color: #D4AF37; }
      .chapter-list { padding: .7rem 0; }
      .chapter-item { padding: .75rem 1.4rem; cursor: pointer; border-left: 3px solid transparent; transition: all .2s ease; }
      .chapter-item:hover, .chapter-item.active { background: rgba(212,175,55,.15); border-left-color: #D4AF37; }
      .chapter-number { color: #D4AF37; font-weight: 700; margin-right: .45rem; }
      .chapter-title { color: #ddd; font-size: .88rem; }
      .main-content { margin-left: 250px; transition: margin-left .3s ease; min-height: 100vh; padding: 2rem; }
      .main-content.full-width { margin-left: 0; }
      .chapter-context-panel { position: fixed; right: 1rem; top: 1rem; width: min(300px, calc(100vw - 2rem)); z-index: 990; background: rgba(12,12,12,.92); border: 1px solid rgba(212,175,55,.2); border-radius: 10px; padding: .95rem 1rem; color: #e7e7e7; box-shadow: 0 10px 24px rgba(0,0,0,.25); }
      .chapter-context-panel h4 { margin: .3rem 0 .45rem; color: #D4AF37; font-size: .92rem; text-transform: uppercase; letter-spacing: .08em; }
      .chapter-context-panel p { margin: 0 0 .45rem; font-size: .84rem; line-height: 1.45; }
      .context-next-link { color: #f6d77a; text-decoration: none; font-size: .85rem; }
      @media (max-width: 980px) { .chapter-context-panel { position: static; margin: .8rem 1rem 0 auto; } }
      @media (max-width: 768px) { .aion-nav { width: 100%; transform: translateX(-100%); } .aion-nav.collapsed { transform: translateX(-100%); } .aion-nav.mobile-open { transform: translateX(0); } .nav-toggle { left: 10px; } .main-content { margin-left: 0; } }
    </style>
    <button class="nav-toggle ${navCollapsed ? 'shifted' : ''}" type="button">☰ Menu</button>
    <div class="nav-header" role="button" tabindex="0">
      <h2>AION</h2>
      <p>Carl Jung's Masterwork</p>
      <div class="mode-switcher" aria-label="Shell route mode switcher">
        <button type="button" data-mode="journey" class="${routeMode === MODE_JOURNEY ? 'active' : ''}">Journey</button>
        <button type="button" data-mode="atlas" class="${routeMode === MODE_ATLAS ? 'active' : ''}">Atlas</button>
      </div>
    </div>
    <div class="chapter-list">
      ${CHAPTERS.map(ch => `
        <div class="chapter-item ${currentChapter === ch.number ? 'active' : ''}" data-chapter="${ch.number}">
          <span class="chapter-number">${ch.number}.</span>
          <span class="chapter-title">${ch.title}</span>
        </div>
      `).join('')}
    </div>
  `;

  document.body.insertBefore(nav, document.body.firstChild);

  const navToggle = nav.querySelector('.nav-toggle');
  navToggle?.addEventListener('click', () => toggleNav());

  const header = nav.querySelector('.nav-header');
  header?.addEventListener('click', event => {
    if (event.target.closest('.mode-switcher')) return;
    window.location.href = '/';
  });

  nav.querySelectorAll('.chapter-item').forEach(item => {
    item.addEventListener('click', () => {
      const chapterNumber = Number(item.dataset.chapter);
      navigateToChapter(chapterNumber);
    });
  });

  nav.querySelectorAll('.mode-switcher button').forEach(button => {
    button.addEventListener('click', () => {
      switchRouteMode(button.dataset.mode);
    });
  });

  if (!document.querySelector('.main-content')) {
    const mainContent = document.createElement('div');
    mainContent.className = `main-content${navCollapsed ? ' full-width' : ''}`;
    while (document.body.children.length > 1) {
      mainContent.appendChild(document.body.children[1]);
    }
    document.body.appendChild(mainContent);
  }

  if (currentChapter) {
    localStorage.setItem(LAST_CHAPTER_KEY, String(currentChapter));
    createContextPanel(currentChapter);
    setupDropOffTracking(currentChapter);
  }

  loadLearningEnhancements();
}


function loadLearningEnhancements() {
  if (document.querySelector('script[data-aion-nav-learning="true"]')) {
    return;
  }

  const script = document.createElement('script');
  script.src = '/components/navigation-learning.js';
  script.dataset.aionNavLearning = 'true';
  document.body.appendChild(script);
}

function createContextPanel(chapterNumber) {
  const chapterIndex = CHAPTERS.findIndex(ch => ch.number === chapterNumber);
  if (chapterIndex < 0) return;

  const current = CHAPTERS[chapterIndex];
  const next = CHAPTERS[chapterIndex + 1];
  const panel = document.createElement('aside');
  panel.className = 'chapter-context-panel';
  panel.innerHTML = `
    <h4>Where am I in Aion?</h4>
    <p>You are in Chapter ${current.number} of ${CHAPTERS.length}: <strong>${current.title}</strong>.</p>
    <p>This chapter belongs to the <em>${current.cluster}</em> cluster in the broader Aion map.</p>
    <h4>What this connects to next</h4>
    ${next
      ? `<p>Next chapter: <a class="context-next-link" href="${buildJourneyPath(next.number)}">Chapter ${next.number} — ${next.title}</a>.</p>`
      : '<p>You have reached the closing chapter of this journey arc.</p>'}
  `;

  document.body.appendChild(panel);
}

function setupDropOffTracking(chapterNumber) {
  window.addEventListener('beforeunload', () => {
    const maxScrollable = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    const scrollDepth = maxScrollable > 0 ? Math.round((window.scrollY / maxScrollable) * 100) : 100;

    if (scrollDepth < 90) {
      trackNavigationEvent('chapter_dropoff', {
        chapterNumber,
        scrollDepth
      });
    }
  });
}

function toggleNav() {
  const nav = document.querySelector('.aion-nav');
  const toggle = document.querySelector('.nav-toggle');
  const mainContent = document.querySelector('.main-content');

  nav?.classList.toggle('collapsed');
  nav?.classList.toggle('mobile-open');
  toggle?.classList.toggle('shifted');
  mainContent?.classList.toggle('full-width');

  const collapsed = nav?.classList.contains('collapsed');
  localStorage.setItem(NAV_COLLAPSED_KEY, String(Boolean(collapsed)));
}

function navigateToChapter(chapterNumber) {
  localStorage.setItem(LAST_CHAPTER_KEY, String(chapterNumber));
  const routeMode = getRouteMode();

  if (routeMode === MODE_ATLAS) {
    window.location.href = `/atlas/index.html?chapter=${chapterNumber}`;
    return;
  }

  window.location.href = buildJourneyPath(chapterNumber);
}

function switchRouteMode(mode) {
  const normalizedMode = mode === MODE_ATLAS ? MODE_ATLAS : MODE_JOURNEY;
  const previousMode = getRouteMode();
  const chapterNumber = getCurrentChapterNumber() || Number(localStorage.getItem(LAST_CHAPTER_KEY)) || 1;

  localStorage.setItem(ROUTE_MODE_KEY, normalizedMode);
  trackNavigationEvent('mode_switch', {
    fromMode: previousMode,
    toMode: normalizedMode,
    chapterNumber
  });

  if (normalizedMode === MODE_ATLAS) {
    window.location.href = `/atlas/index.html?chapter=${chapterNumber}`;
  } else {
    window.location.href = buildJourneyPath(chapterNumber);
  }
}

if (window.self === window.top) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createNavigation);
  } else {
    createNavigation();
  }
}
