import { SECTION_LABELS } from './ChapterSectionRegistry.js';

function renderList(items = []) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

export function renderSection(section) {
  switch (section.key) {
    case 'header-thesis':
      return `
        <header class="chapter-shell__header">
          <p class="chapter-shell__eyebrow">${section.chapterLabel || ''}</p>
          <h1>${section.title}</h1>
          <p class="chapter-shell__thesis">${section.thesis}</p>
        </header>`;
    case 'core-terms':
      return `
        <div class="chapter-shell__terms">
          ${(section.terms || []).map((term) => `<article><h3>${term.term}</h3><p>${term.definition}</p></article>`).join('')}
        </div>`;
    case 'primary-visualization':
      return `
        <div class="chapter-shell__viz">
          <p>${section.instructions || ''}</p>
          ${section.iframeSrc ? `<iframe src="${section.iframeSrc}" title="${section.iframeTitle || 'Primary chapter visualization'}" loading="lazy"></iframe>` : `<div class="chapter-shell__viz-fallback">${section.body || 'Visualization fallback enabled.'}</div>`}
        </div>`;
    case 'reflection-next-links':
      return `
        <div>
          <p>${section.prompt || ''}</p>
          ${renderList((section.nextLinks || []).map((link) => `<a href="${link.href}">${link.label}</a>`))}
        </div>`;
    default:
      if (Array.isArray(section.items)) {
        return renderList(section.items);
      }
      return `<p>${section.body || ''}</p>`;
  }
}

export function renderChapterShell(config) {
  return `
    <main class="chapter-shell" data-chapter-shell="required-contract">
      ${(config.sections || []).map((section) => `
        <section class="chapter-shell__section chapter-shell__section--${section.key}">
          <h2>${SECTION_LABELS[section.key] || section.title}</h2>
          ${renderSection(section)}
        </section>
      `).join('')}
    </main>
  `;
}
