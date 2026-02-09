function $(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Missing required element: ${selector}`);
  return el;
}

function normalized(text) {
  return String(text || '').trim().toLowerCase();
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((a, b) => {
    const na = Number(String(a).replace(/\D/g, ''));
    const nb = Number(String(b).replace(/\D/g, ''));
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return String(a).localeCompare(String(b));
  });
}

const PATHS = {
  symbols: 'src/data/aion-core/symbols.json',
  concepts: 'src/data/aion-core/concepts.json'
};

const GLYPHS = {
  fish: '⟡',
  mandala: '◉',
  dragon: '⌁',
  sophia: '✶',
  sword: '†',
  lapis: '⬣',
  cross: '✚',
  ouroboros: '∞',
  zodiac: '☉'
};

const FILTERS = [
  {
    id: 'all',
    label: 'All',
    match: () => true
  },
  {
    id: 'self',
    label: 'Self',
    match: (symbol) => symbol.conceptIds?.includes('self')
      || symbol.conceptIds?.includes('quaternity')
      || symbol.conceptIds?.includes('individuation')
  },
  {
    id: 'shadow',
    label: 'Shadow',
    match: (symbol) => symbol.conceptIds?.includes('shadow')
      || symbol.conceptIds?.includes('antichrist')
  },
  {
    id: 'syzygy',
    label: 'Syzygy',
    match: (symbol) => symbol.conceptIds?.includes('syzygy')
      || symbol.conceptIds?.includes('anima')
      || symbol.conceptIds?.includes('animus')
      || symbol.conceptIds?.includes('gnosticism')
  },
  {
    id: 'aeon',
    label: 'Aeon',
    match: (symbol) => symbol.conceptIds?.includes('aeon')
      || symbol.conceptIds?.includes('fish-symbol')
      || symbol.conceptIds?.includes('prophecy')
  },
  {
    id: 'alchemy',
    label: 'Alchemy',
    match: (symbol) => symbol.conceptIds?.includes('alchemy')
      || symbol.conceptIds?.includes('prima-materia')
      || symbol.conceptIds?.includes('mercurius')
      || symbol.conceptIds?.includes('lapis-philosophorum')
      || symbol.conceptIds?.includes('coniunctio')
  },
  {
    id: 'christ',
    label: 'Christ',
    match: (symbol) => symbol.conceptIds?.includes('christ-symbol')
  }
];

async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function glyphFor(symbol) {
  return GLYPHS[symbol.id] || symbol.label?.slice(0, 1) || '•';
}

function chapterLink(chapterId) {
  return `journey/chapter/index.html?id=${encodeURIComponent(chapterId)}`;
}

function findSymbolByQuery(query, symbols) {
  const q = normalized(query);
  if (!q) return null;

  return symbols.find((symbol) => (
    normalized(symbol.id) === q
    || normalized(symbol.label) === q
    || normalized(symbol.motif).includes(q)
  )) || null;
}

function buildAvailableFilters(symbols) {
  return FILTERS.filter((filter) => filter.id === 'all' || symbols.some((s) => filter.match(s)));
}

function buildConceptMap(concepts) {
  return new Map(concepts.map((concept) => [concept.id, concept]));
}

function renderFilters(filters, mount, onSelect, activeId) {
  mount.innerHTML = '';
  filters.forEach((filter) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'symbols-filter';
    button.textContent = filter.label;
    button.dataset.filterId = filter.id;
    button.setAttribute('aria-pressed', String(filter.id === activeId));
    button.addEventListener('click', () => onSelect(filter.id));
    mount.appendChild(button);
  });
}

function renderGrid(symbols, mount, selectedId, onSelect) {
  mount.innerHTML = '';
  symbols.forEach((symbol) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'symbol-card';
    button.dataset.symbolId = symbol.id;
    button.setAttribute('aria-selected', String(symbol.id === selectedId));

    button.innerHTML = `
      <div class="symbol-card__top">
        <div class="symbol-card__glyph" aria-hidden="true">${glyphFor(symbol)}</div>
        <div class="symbol-card__badge">${symbol.historicPeriod || ''}</div>
      </div>
      <h3 class="symbol-card__title">${symbol.label}</h3>
      <p class="symbol-card__motif">${symbol.motif || ''}</p>
    `;

    button.addEventListener('click', () => onSelect(symbol.id));
    mount.appendChild(button);
  });
}

function renderDetail(symbol, conceptMap, els) {
  if (!symbol) {
    els.title.textContent = 'Select a symbol';
    els.meta.textContent = '';
    els.motif.textContent = 'Choose any card to see motif context, related concepts, and chapter links.';
    els.concepts.innerHTML = '';
    els.chapters.innerHTML = '';
    return;
  }

  els.title.textContent = symbol.label;
  els.meta.textContent = symbol.historicPeriod || '';
  els.motif.textContent = symbol.motif || '';

  const conceptIds = Array.isArray(symbol.conceptIds) ? symbol.conceptIds : [];
  const concepts = conceptIds
    .map((id) => conceptMap.get(id))
    .filter(Boolean);

  // Concepts section
  els.concepts.innerHTML = '';
  const chips = document.createElement('div');
  chips.className = 'symbols-detail__chips';
  concepts.forEach((concept) => {
    const chip = document.createElement('span');
    chip.className = 'symbols-chip';
    chip.textContent = concept.label;
    chips.appendChild(chip);
  });

  const explainer = document.createElement('div');
  explainer.className = 'symbols-concepts';
  concepts.forEach((concept) => {
    const details = document.createElement('details');
    details.innerHTML = `
      <summary>${concept.label}</summary>
      <p>${concept.definition || ''}</p>
    `;
    explainer.appendChild(details);
  });

  els.concepts.appendChild(chips);
  els.concepts.appendChild(explainer);

  // Chapter links derived from related concepts.
  const chapterIds = uniqueSorted(concepts.flatMap((concept) => concept.chapterRefs || []));
  els.chapters.innerHTML = '';

  if (chapterIds.length === 0) {
    els.chapters.textContent = 'No linked chapters in the core dataset yet.';
    return;
  }

  chapterIds.forEach((chapterId) => {
    const link = document.createElement('a');
    link.href = chapterLink(chapterId);
    link.textContent = chapterId.toUpperCase();
    els.chapters.appendChild(link);
  });
}

function writeSymbolToUrl(symbolId) {
  const url = new URL(window.location.href);
  if (symbolId) url.searchParams.set('symbol', symbolId);
  else url.searchParams.delete('symbol');
  window.history.replaceState({}, '', url.toString());
}

(async function initSymbols() {
  const dom = {
    search: $('#symbols-search'),
    filters: $('#symbols-filters'),
    grid: $('#symbols-grid'),
    detail: {
      title: $('#symbol-detail-title'),
      meta: $('#symbol-detail-meta'),
      motif: $('#symbol-detail-motif'),
      concepts: $('#symbol-detail-concepts'),
      chapters: $('#symbol-detail-chapters')
    }
  };

  try {
    const [symbolsJson, conceptsJson] = await Promise.all([
      loadJson(PATHS.symbols),
      loadJson(PATHS.concepts)
    ]);

    const allSymbols = symbolsJson.symbols || [];
    const conceptMap = buildConceptMap(conceptsJson.concepts || []);
    const availableFilters = buildAvailableFilters(allSymbols);

    const state = {
      query: '',
      filterId: 'all',
      selectedId: null
    };

    const apply = () => {
      const q = normalized(state.query);
      const filter = availableFilters.find((f) => f.id === state.filterId) || availableFilters[0];
      const filtered = allSymbols
        .filter((symbol) => (filter ? filter.match(symbol) : true))
        .filter((symbol) => (!q
          || normalized(symbol.label).includes(q)
          || normalized(symbol.motif).includes(q)
          || normalized(symbol.historicPeriod).includes(q)))
        .slice()
        .sort((a, b) => String(a.label).localeCompare(String(b.label)));

      if (!state.selectedId || !filtered.some((s) => s.id === state.selectedId)) {
        state.selectedId = filtered[0]?.id || null;
      }

      renderFilters(availableFilters, dom.filters, (filterId) => {
        state.filterId = filterId;
        apply();
      }, state.filterId);

      renderGrid(filtered, dom.grid, state.selectedId, (symbolId) => {
        state.selectedId = symbolId;
        writeSymbolToUrl(symbolId);
        apply();
      });

      const selected = filtered.find((s) => s.id === state.selectedId) || null;
      renderDetail(selected, conceptMap, dom.detail);
    };

    dom.search.addEventListener('input', () => {
      state.query = dom.search.value;
      apply();
    });

    // Deep-link support: /src/symbols.html?symbol=<id|label>
    const initial = new URLSearchParams(window.location.search).get('symbol');
    const match = findSymbolByQuery(initial, allSymbols);
    if (match) state.selectedId = match.id;
    if (initial && !match) dom.search.value = initial;

    renderDetail(null, conceptMap, dom.detail);
    apply();
  } catch (error) {
    console.error('Symbols initialization failed:', error);
    dom.detail.title.textContent = 'Symbols unavailable';
    dom.detail.motif.textContent = error.message || String(error);
  }
}());

