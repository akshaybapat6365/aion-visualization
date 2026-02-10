const GLOSSARY_PATH = 'src/data/glossary/canonical-glossary.json';

function chapterHref(chapterNumber) {
  const chapterId = `ch${chapterNumber}`;
  return `journey/chapter/index.html?id=${chapterId}`;
}

function symbolHref(symbol) {
  const base = 'src/symbols.html';
  return `${base}?symbol=${encodeURIComponent(symbol)}`;
}

const state = {
  glossary: null,
  termMap: new Map()
};

async function loadGlossary() {
  if (state.glossary) return state.glossary;
  const response = await fetch(GLOSSARY_PATH);
  state.glossary = await response.json();
  state.termMap = new Map(state.glossary.terms.map(term => [term.id, term]));
  return state.glossary;
}

function createDeepLinks(term) {
  const wrapper = document.createElement('div');
  wrapper.className = 'concept-deep-links';

  const chapterLinks = (term.relatedChapters || [])
    .map(ch => `<a href="${chapterHref(ch)}">Chapter ${ch}</a>`)
    .join(', ');
  const symbolLinks = (term.relatedSymbols || [])
    .map(symbol => `<a href="${symbolHref(symbol)}">${symbol}</a>`)
    .join(', ');

  wrapper.innerHTML = `
    <p><strong>Related chapters:</strong> ${chapterLinks || '—'}</p>
    <p><strong>Related symbols:</strong> ${symbolLinks || '—'}</p>
  `;
  return wrapper;
}

function hydrateChapterConceptCards() {
  const cards = document.querySelectorAll('.concept-card[data-term-id]');
  cards.forEach((card) => {
    const termId = card.dataset.termId;
    const term = state.termMap.get(termId);
    if (!term) return;

    const heading = card.querySelector('h3');
    if (heading) heading.textContent = term.canonicalLabel;

    const definitionEl = card.querySelector('.concept-definition');
    if (definitionEl) {
      const tier = definitionEl.dataset.definitionTier || 'beginner';
      definitionEl.textContent = term.definitionTiers[tier] || term.definitionTiers.beginner;
    }

    if (!card.querySelector('.concept-deep-links')) {
      card.appendChild(createDeepLinks(term));
    }
  });
}

function injectDrawerStyles() {
  if (document.getElementById('glossary-drawer-styles')) return;
  const style = document.createElement('style');
  style.id = 'glossary-drawer-styles';
  style.textContent = `
    .glossary-drawer { position: fixed; top: 0; right: 0; width: min(440px, 92vw); height: 100vh; background: color-mix(in srgb, var(--surface-primary) 86%, rgba(0,0,0,0.8)); color: var(--text-primary); z-index: 10000; transform: translateX(100%); transition: transform 220ms ease; padding: 1rem; overflow: auto; border-left: 1px solid var(--border-default); backdrop-filter: blur(14px); }
    .glossary-drawer.open { transform: translateX(0); }
    .glossary-trigger { margin-left: 0.5rem; border: 1px solid var(--border-subtle); background: transparent; font: inherit; cursor: pointer; }
    .glossary-trigger:hover { border-color: var(--border-default); }
    .glossary-term { padding: 0.8rem 0; border-bottom: 1px solid var(--border-subtle); }
    .glossary-term h4 { margin: 0 0 0.35rem; }
    .glossary-term p { margin: 0.3rem 0; }
    .concept-deep-links { margin-top: 0.65rem; font-size: 0.88rem; opacity: 0.95; }
    .concept-deep-links p { margin: 0.25rem 0; }
    .glossary-drawer input[type='search'] { background: rgba(0,0,0,0.28); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); }
    .glossary-drawer a { color: var(--accent-light); }
    .glossary-drawer a:hover { color: var(--text-primary); }
    @media (prefers-reduced-motion: reduce) { .glossary-drawer { transition: none; } }
  `;
  document.head.appendChild(style);
}

function findNavContainer() {
  return document.querySelector('.nav-container')
    || document.querySelector('.nav-controls')
    || document.querySelector('.navigation .nav-links')
    || document.querySelector('nav');
}

function mountGlossaryDrawer() {
  const navContainer = findNavContainer();
  if (!navContainer || document.getElementById('glossary-trigger')) return;

  const trigger = document.createElement('button');
  trigger.id = 'glossary-trigger';
  trigger.className = 'glossary-trigger nav-link';
  trigger.type = 'button';
  trigger.textContent = 'Glossary';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'glossary-drawer');

  const drawer = document.createElement('aside');
  drawer.className = 'glossary-drawer';
  drawer.id = 'glossary-drawer';
  drawer.setAttribute('aria-hidden', 'true');

  drawer.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;">
      <h3 style="margin:0;">Canonical Glossary</h3>
      <button id="close-glossary" type="button" aria-label="Close glossary">Close</button>
    </div>
    <p style="font-size:0.9rem;opacity:0.8;">Search terms and jump to related chapters and symbols.</p>
    <label for="glossary-search" class="sr-only">Search glossary</label>
    <input id="glossary-search" type="search" placeholder="Search terms" style="width:100%;margin:0.5rem 0 1rem;padding:0.55rem;">
    <div id="glossary-term-list"></div>
  `;

  document.body.appendChild(drawer);
  navContainer.appendChild(trigger);

  const search = drawer.querySelector('#glossary-search');
  const termList = drawer.querySelector('#glossary-term-list');

    const renderTerms = (query = '') => {
      const q = query.trim().toLowerCase();
      termList.innerHTML = state.glossary.terms
      .filter((term) => !q
        || term.canonicalLabel.toLowerCase().includes(q)
        || term.definitionTiers.beginner.toLowerCase().includes(q))
      .map((term) => {
        const chapterLinks = (term.relatedChapters || [])
          .map((chapter) => `<a href="${chapterHref(chapter)}">${chapter}</a>`).join(', ');
        const symbolLinks = (term.relatedSymbols || [])
          .map((symbol) => `<a href="${symbolHref(symbol)}">${symbol}</a>`).join(', ');
        return `
          <article class="glossary-term" id="term-${term.id}">
            <h4>${term.canonicalLabel}</h4>
            <p>${term.definitionTiers.beginner}</p>
            <p><strong>Chapters:</strong> ${chapterLinks || '—'}</p>
            <p><strong>Symbols:</strong> ${symbolLinks || '—'}</p>
          </article>
        `;
      }).join('');
  };

  const open = () => {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    search.focus();
  };
  const close = () => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  };

  renderTerms();
  trigger.addEventListener('click', open);
  drawer.querySelector('#close-glossary').addEventListener('click', close);
  search.addEventListener('input', () => renderTerms(search.value));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer.classList.contains('open')) close();
  });
}

(async function initGlossaryExperience() {
  try {
    await loadGlossary();
    injectDrawerStyles();
    hydrateChapterConceptCards();
    mountGlossaryDrawer();
  } catch (error) {
    console.error('Glossary initialization failed:', error);
  }
}());
