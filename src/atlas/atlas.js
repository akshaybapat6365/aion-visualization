const CORE_PATHS = {
  chapters: 'src/data/aion-core/chapters.json',
  concepts: 'src/data/aion-core/concepts.json',
  relationships: 'src/data/aion-core/relationships.json'
};

function cssVar(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function isReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function chapterUrl(chapterId) {
  return `journey/chapter/index.html?id=${encodeURIComponent(chapterId)}`;
}

async function loadCore() {
  const [chaptersRes, conceptsRes, relationshipsRes] = await Promise.all([
    fetch(CORE_PATHS.chapters),
    fetch(CORE_PATHS.concepts),
    fetch(CORE_PATHS.relationships)
  ]);

  if (!chaptersRes.ok) throw new Error('Failed to load chapters dataset');
  if (!conceptsRes.ok) throw new Error('Failed to load concepts dataset');
  if (!relationshipsRes.ok) throw new Error('Failed to load relationships dataset');

  const chaptersJson = await chaptersRes.json();
  const conceptsJson = await conceptsRes.json();
  const relationshipsJson = await relationshipsRes.json();

  return {
    chapters: chaptersJson.chapters,
    concepts: conceptsJson.concepts,
    relationships: relationshipsJson.relationships
  };
}

function initAtlas() {
  const svg = d3.select('#atlas');
  if (svg.empty()) return;

  const width = 1200;
  const height = 720;
  const reduceMotion = isReducedMotion();

  const accent = cssVar('--accent', '#d4af37');
  const accentCool = cssVar('--accent-cool', '#22d3ee');
  const borderSubtle = cssVar('--border-subtle', 'rgba(255,255,255,0.06)');
  const textSecondary = cssVar('--text-secondary', '#a3a3a3');

  const clusterColors = new Map([
    ['Identity', accent],
    ['Relational Psyche', accentCool],
    ['Selfhood', '#8dddb8'],
    ['Aeon & Fish', '#ffd37a'],
    ['Alchemy', '#ffa98f'],
    ['Gnosis', '#9cc9e8'],
    ['Synthesis', '#e5e5e5']
  ]);

  const zoomRoot = svg.append('g').attr('class', 'atlas-zoom-root');
  const linkLayer = zoomRoot.append('g').attr('class', 'atlas-links');
  const nodeLayer = zoomRoot.append('g').attr('class', 'atlas-nodes');

  const zoom = d3.zoom().scaleExtent([0.7, 2.4]).on('zoom', (event) => {
    zoomRoot.attr('transform', event.transform);
  });
  svg.call(zoom);

  const state = {
    core: null,
    chapters: [],
    conceptsById: new Map(),
    chapterById: new Map(),
    baseLinks: [],
    selectedChapterId: null
  };

  const controls = {
    search: document.getElementById('atlas-search'),
    reset: document.getElementById('atlas-reset')
  };

  const detailsEls = {
    title: document.getElementById('detail-title'),
    body: document.getElementById('detail-body')
  };

  function linkKey(link) {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    return `${sourceId}=>${targetId}|${link.kind || ''}|${link.relationType || ''}`;
  }

  function buildBaseLinks(chapters, relationships) {
    const links = [];
    const orderById = new Map(chapters.map((chapter) => [chapter.id, chapter.order]));

    for (let i = 1; i < chapters.length; i += 1) {
      links.push({ source: `ch${i}`, target: `ch${i + 1}`, kind: 'journey' });
    }

    const seen = new Set(links.map(linkKey));
    chapters.forEach((chapter) => {
      (chapter.relatedChapterIds || []).forEach((related) => {
        const relatedOrder = orderById.get(related);
        if (typeof relatedOrder === 'number' && Math.abs(relatedOrder - chapter.order) <= 1) return;
        const candidate = { source: chapter.id, target: related, kind: 'related' };
        const key = linkKey(candidate);
        if (!seen.has(key)) {
          seen.add(key);
          links.push(candidate);
        }
      });
    });

    relationships.forEach((rel) => {
      if (!String(rel.source).startsWith('ch') || !String(rel.target).startsWith('ch')) return;
      const candidate = { source: rel.source, target: rel.target, kind: 'taxonomy', relationType: rel.relationType };
      const key = linkKey(candidate);
      if (!seen.has(key)) {
        seen.add(key);
        links.push(candidate);
      }
    });

    return links;
  }

  function renderDetails(chapter) {
    if (!detailsEls.title || !detailsEls.body) return;
    if (!chapter) {
      detailsEls.title.textContent = 'Select a chapter';
      detailsEls.body.innerHTML = '<p>Click any chapter node to see a summary, key concepts, and direct links.</p>';
      return;
    }

    const conceptLabels = (chapter.keyConceptIds || [])
      .map((id) => state.conceptsById.get(id)?.label)
      .filter(Boolean);

    detailsEls.title.textContent = `Chapter ${chapter.order}: ${chapter.title}`;
    detailsEls.body.innerHTML = `
      <p><strong>Cluster:</strong> ${chapter.cluster}</p>
      <p>${chapter.summary}</p>
      <div class="atlas-badges" aria-label="Key concepts">
        ${conceptLabels.map((label) => `<span class="atlas-badge">${label}</span>`).join('')}
      </div>
      <a class="atlas-open" href="${chapterUrl(chapter.id)}">Open chapter view</a>
    `;
  }

  function buildGraphForSelection(selectedChapterId) {
    const chapterNodes = state.chapters.map((chapter) => ({
      id: chapter.id,
      kind: 'chapter',
      order: chapter.order,
      title: chapter.title,
      cluster: chapter.cluster,
      summary: chapter.summary,
      keyConceptIds: chapter.keyConceptIds,
      relatedChapterIds: chapter.relatedChapterIds
    }));

    const nodes = [...chapterNodes];
    const links = [...state.baseLinks];

    if (selectedChapterId) {
      const selected = state.chapterById.get(selectedChapterId);
      if (selected) {
        const conceptNodes = (selected.keyConceptIds || [])
          .map((id) => state.conceptsById.get(id))
          .filter(Boolean)
          .slice(0, 6)
          .map((concept) => ({
            id: `concept:${concept.id}`,
            kind: 'concept',
            label: concept.label
          }));

        nodes.push(...conceptNodes);
        conceptNodes.forEach((concept) => {
          links.push({
            source: selected.id,
            target: concept.id,
            kind: 'concept-link'
          });
        });
      }
    }

    return { nodes, links };
  }

  function setHighlighted(ids) {
    nodeLayer.selectAll('.atlas-node').classed('is-dimmed', (d) => ids && ids.size > 0 && !ids.has(d.id));
  }

  let activeSimulation = null;
  function renderGraph(nodes, links) {
    if (activeSimulation) {
      activeSimulation.stop();
      activeSimulation = null;
    }

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d) => d.id).distance((link) => {
        if (link.kind === 'journey') return 95;
        if (link.kind === 'concept-link') return 88;
        return 140;
      }).strength((link) => (link.kind === 'journey' ? 0.85 : 0.6)))
      .force('charge', d3.forceManyBody().strength((d) => (d.kind === 'concept' ? -140 : -320)))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => (d.kind === 'concept' ? 18 : 30)));

    const linkSel = linkLayer.selectAll('line')
      .data(links, linkKey)
      .join((enter) => enter.append('line'))
      .attr('stroke', (link) => {
        if (link.kind === 'journey') return accent;
        if (link.kind === 'concept-link') return accentCool;
        return 'rgba(255,255,255,0.18)';
      })
      .attr('stroke-width', (link) => (link.kind === 'journey' ? 2.2 : 1.3))
      .attr('stroke-dasharray', (link) => (link.kind === 'concept-link' ? '4 4' : null))
      .attr('opacity', (link) => (link.kind === 'journey' ? 0.42 : 0.3));

    const nodeSel = nodeLayer.selectAll('g')
      .data(nodes, (d) => d.id)
      .join((enter) => {
        const g = enter.append('g').attr('class', 'atlas-node');

        g.append('circle')
          .attr('r', (d) => (d.kind === 'concept' ? 10 : 18))
          .attr('fill', (d) => {
            if (d.kind === 'concept') return 'rgba(0,0,0,0.25)';
            return clusterColors.get(d.cluster) || accent;
          })
          .attr('stroke', borderSubtle)
          .attr('stroke-width', (d) => (d.kind === 'concept' ? 1.6 : 2.4));

        g.append('text')
          .attr('text-anchor', (d) => (d.kind === 'concept' ? 'start' : 'middle'))
          .attr('dy', (d) => (d.kind === 'concept' ? 4 : 5))
          .attr('dx', (d) => (d.kind === 'concept' ? 16 : 0))
          .attr('fill', (d) => (d.kind === 'concept' ? textSecondary : '#111'))
          .attr('font-size', (d) => (d.kind === 'concept' ? 12 : 11))
          .attr('font-weight', (d) => (d.kind === 'concept' ? 500 : 700))
          .text((d) => (d.kind === 'concept' ? d.label : d.order));

        g.attr('tabindex', 0)
          .on('keydown', (event, d) => {
            if (event.key === 'Enter' && d.kind === 'chapter') window.location.href = chapterUrl(d.id);
          })
          .on('click', (_, d) => {
            if (d.kind !== 'chapter') return;
            selectChapter(d.id);
          })
          .on('dblclick', (_, d) => {
            if (d.kind !== 'chapter') return;
            window.location.href = chapterUrl(d.id);
          });

        return g;
      });

    const tick = () => {
      linkSel
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      nodeSel.attr('transform', (d) => `translate(${d.x},${d.y})`);
    };

    simulation.on('tick', tick);
    activeSimulation = simulation;

    if (reduceMotion) {
      for (let i = 0; i < 240; i += 1) simulation.tick();
      simulation.stop();
      activeSimulation = null;
      tick();
      return;
    }

    const stopTimer = window.setTimeout(() => {
      simulation.stop();
      activeSimulation = null;
    }, 1400);
    simulation.on('end', () => {
      window.clearTimeout(stopTimer);
      activeSimulation = null;
    });
  }

  function selectChapter(chapterId) {
    state.selectedChapterId = chapterId;
    const chapter = state.chapterById.get(chapterId);
    renderDetails(chapter);

    const { nodes, links } = buildGraphForSelection(chapterId);
    renderGraph(nodes, links);

    if (window.learningAnalytics && typeof window.learningAnalytics.trackEvent === 'function') {
      window.learningAnalytics.trackEvent('atlas_node_selected', { chapterId });
    }
  }

  function applySearch(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) {
      setHighlighted(null);
      return;
    }

    const matches = new Set();
    state.chapters.forEach((chapter) => {
      const titleMatch = chapter.title.toLowerCase().includes(q);
      const conceptMatch = (chapter.keyConceptIds || [])
        .map((id) => state.conceptsById.get(id)?.label?.toLowerCase() || '')
        .some((label) => label.includes(q));

      if (titleMatch || conceptMatch) matches.add(chapter.id);
    });

    setHighlighted(matches);
  }

  function reset() {
    state.selectedChapterId = null;
    renderDetails(null);

    const { nodes, links } = buildGraphForSelection(null);
    renderGraph(nodes, links);

    setHighlighted(null);
    if (controls.search) controls.search.value = '';

    svg.transition().duration(reduceMotion ? 0 : 350).call(zoom.transform, d3.zoomIdentity);
  }

  loadCore()
    .then((core) => {
      state.core = core;
      state.chapters = core.chapters.slice().sort((a, b) => a.order - b.order);
      state.chapterById = new Map(state.chapters.map((chapter) => [chapter.id, chapter]));
      state.conceptsById = new Map(core.concepts.map((concept) => [concept.id, concept]));
      state.baseLinks = buildBaseLinks(state.chapters, core.relationships);

      const initialParam = String(new URLSearchParams(window.location.search).get('chapter') || '').trim();
      const fromParam = initialParam ? `ch${Number(initialParam)}` : null;
      const initialChapterId = state.chapterById.has(fromParam) ? fromParam : null;

      const { nodes, links } = buildGraphForSelection(initialChapterId);
      renderGraph(nodes, links);

      if (initialChapterId) selectChapter(initialChapterId);

      controls.search?.addEventListener('input', () => applySearch(controls.search.value));
      controls.reset?.addEventListener('click', reset);
    })
    .catch((error) => {
      console.error('Atlas initialization failed:', error);
      renderDetails(null);
      if (detailsEls.body) detailsEls.body.innerHTML = `<p>Atlas failed to load: ${error.message}</p>`;
    });
}

window.addEventListener('DOMContentLoaded', initAtlas);
