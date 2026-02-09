import { SECTION_LABELS } from './ChapterSectionRegistry.js';

function renderList(items = []) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

function renderInsightChecks(section) {
  const checks = Array.isArray(section.checks) ? section.checks : (section.items || []);
  if (!Array.isArray(checks) || checks.length === 0) return '';

  const normalized = checks.map((check) => {
    if (typeof check === 'string') return { question: check, hint: 'Pause. Write your answer. Expand to compare with a suggested frame.' };
    if (check && typeof check === 'object') return check;
    return null;
  }).filter(Boolean);

  return `
    <div class="chapter-shell__checks" role="list" aria-label="Insight checks">
      ${normalized.map((check) => `
        <details class="chapter-check" role="listitem">
          <summary class="chapter-check__summary">${check.question || ''}</summary>
          <div class="chapter-check__body">
            ${check.answer ? `<p><strong>Suggested answer:</strong> ${check.answer}</p>` : ''}
            ${check.explanation ? `<p class="chapter-check__explain">${check.explanation}</p>` : ''}
            ${check.hint ? `<p class="chapter-check__hint">${check.hint}</p>` : ''}
          </div>
        </details>
      `).join('')}
    </div>
  `;
}

function renderFacts(section) {
  const facts = Array.isArray(section.facts) ? section.facts : (section.items || []);
  if (!Array.isArray(facts) || facts.length === 0) return '';

  const normalized = facts.map((fact) => {
    if (typeof fact === 'string') return { value: fact };
    if (fact && typeof fact === 'object') return fact;
    return null;
  }).filter(Boolean);

  return `
    <div class="chapter-shell__facts" role="list" aria-label="Symbols and relationships">
      ${normalized.map((fact) => `
        <div class="chapter-fact" role="listitem">
          ${fact.label ? `<span class="chapter-fact__label">${fact.label}</span>` : ''}
          <span class="chapter-fact__value">${fact.value || ''}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderInlineMap(map, title = 'Chapter constellation') {
  if (!map || typeof map !== 'object') return '';
  const nodes = Array.isArray(map.nodes) ? map.nodes : [];
  const edges = Array.isArray(map.edges) ? map.edges : [];
  if (nodes.length === 0) return '';

  const width = 900;
  const height = 460;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.32;

  const positions = new Map();
  nodes.forEach((node, index) => {
    const angle = (-90 + (360 / nodes.length) * index) * (Math.PI / 180);
    positions.set(node.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  });

  return `
    <figure class="chapter-shell__map">
      <figcaption class="chapter-shell__map-caption">${map.caption || title}</figcaption>
      <svg class="chapter-map" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
        <desc>Interactive map of key motifs for this chapter. Focus nodes to read labels.</desc>
        <g class="chapter-map__edges" aria-hidden="true">
          ${edges.map((edge) => {
            const from = positions.get(edge.from);
            const to = positions.get(edge.to);
            if (!from || !to) return '';
            return `<path class="chapter-map__edge" d="M ${from.x} ${from.y} L ${to.x} ${to.y}" />`;
          }).join('')}
        </g>
        <g class="chapter-map__nodes" role="list" aria-label="Map nodes">
          ${nodes.map((node) => {
            const pos = positions.get(node.id);
            const typeClass = node.type ? ` chapter-map__node--${String(node.type)}` : '';
            const label = node.label || node.id;
            return `
              <g class="chapter-map__node${typeClass}" role="listitem" tabindex="0" aria-label="${label}">
                <title>${label}</title>
                <circle cx="${pos.x}" cy="${pos.y}" r="22" />
                <text x="${pos.x}" y="${pos.y + 46}" text-anchor="middle">${label}</text>
              </g>
            `;
          }).join('')}
        </g>
      </svg>
    </figure>
  `;
}

function normalizeChapterLink(href) {
  if (!href) return href;
  const raw = String(href);
  // Prefer base-aware relative links so GitHub Pages subpath deployments still work.
  const value = (raw.startsWith('/') && !raw.startsWith('//')) ? raw.slice(1) : raw;

  // Prefer query-string routing so the link works on both Vercel rewrites and GitHub Pages.
  if (value.includes('journey/chapter/index.html?id=')) return value;

  const match = value.match(/^\/?journey\/chapter\/ch(\d+)$/);
  if (match) return `journey/chapter/index.html?id=ch${match[1]}`;

  return value;
}

export function renderSection(section) {
  switch (section.key) {
    case 'header-thesis':
      return `
        <header class="chapter-shell__header">
          <p class="chapter-shell__eyebrow">${section.chapterLabel || ''}</p>
          <h1 class="chapter-shell__title">${section.title}</h1>
          <p class="chapter-shell__thesis">${section.thesis}</p>
        </header>`;
    case 'core-terms':
      return `
        <div class="chapter-shell__terms">
          ${(section.terms || []).map((term) => {
            const termId = term.termId ? String(term.termId) : null;
            const tier = term.definitionTier ? String(term.definitionTier) : 'beginner';
            const definitionMarkup = termId
              ? `<p class="concept-definition" data-definition-tier="${tier}">${term.definition || ''}</p>`
              : `<p class="concept-definition">${term.definition || ''}</p>`;

            return `
              <article class="concept-card" ${termId ? `data-term-id="${termId}"` : ''}>
                <h3 class="concept-card-title">${term.term}</h3>
                ${definitionMarkup}
              </article>
            `;
          }).join('')}
        </div>`;
	    case 'primary-visualization':
	      return `
	        <div class="chapter-shell__viz">
	          <p>${section.instructions || ''}</p>
	          ${section.map ? renderInlineMap(section.map, section.iframeTitle || section.title || 'Primary chapter visualization') : ''}
	          ${section.iframeSrc ? `<iframe src="${section.iframeSrc}" title="${section.iframeTitle || 'Primary chapter visualization'}" loading="lazy"></iframe>` : `<div class="chapter-shell__viz-fallback">${section.body || 'Visualization fallback enabled.'}</div>`}
	        </div>`;
	    case 'insight-checks':
	      return renderInsightChecks(section);
	    case 'symbol-relationship-panel':
	      return renderFacts(section);
	    case 'reflection-next-links':
	      return `
	        <div>
	          <p>${section.prompt || ''}</p>
	          ${renderList((section.nextLinks || []).map((link) => `<a href="${normalizeChapterLink(link.href)}">${link.label}</a>`))}
	        </div>`;
	    default:
      if (Array.isArray(section.items)) {
        return renderList(section.items);
      }
      return `<p>${section.body || ''}</p>`;
  }
}

export function renderChapterShell(config) {
  const chapterId = config?.id ? String(config.id) : '';
  const chapterNumber = chapterId.startsWith('ch') ? Number(chapterId.slice(2)) : null;
  const chapterMeta = chapterNumber ? `Chapter ${chapterNumber} of 14` : 'Aion Journey';

  return `
    <div class="chapter-shell-app" data-chapter-id="${chapterId}">
	      <nav class="chapter-shell-topbar" aria-label="Global navigation">
	        <div class="nav-container">
	          <a href="./" class="nav-link chapter-shell-topbar__brand" aria-label="Aion home">Aion</a>
	          <span class="chapter-shell-topbar__meta">${chapterMeta}</span>
	          <a href="chapters/index.html" class="nav-link">Chapters</a>
	          <a href="src/timeline.html" class="nav-link">Timeline</a>
	          <a href="src/atlas/index.html" class="nav-link">Atlas</a>
	          <a href="src/symbols.html" class="nav-link">Symbols</a>
	          <a href="about.html" class="nav-link">About</a>
	        </div>
	      </nav>

      <main class="chapter-shell" data-chapter-shell="required-contract">
        ${(config.sections || []).map((section) => `
          <section class="chapter-shell__section chapter-shell__section--${section.key}">
            <h2 class="chapter-shell__section-title">${SECTION_LABELS[section.key] || section.title}</h2>
            ${renderSection(section)}
          </section>
        `).join('')}
      </main>
    </div>
  `;
}
