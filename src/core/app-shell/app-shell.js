import { resolveRouteMetadata } from './route-metadata.js';

const MODES = [
  { id: 'journey', label: 'Journey', href: 'journey.html' },
  { id: 'atlas', label: 'Atlas', href: 'network.html' },
  { id: 'tours', label: 'Tours', href: 'chapters.html' }
];

const KEYBOARD_MAP = [
  { key: 'g h', action: 'Go to Home' },
  { key: 'g c', action: 'Go to Chapters' },
  { key: 'g j', action: 'Go to Journey mode' },
  { key: 'g a', action: 'Go to Atlas mode' },
  { key: 'g t', action: 'Go to Tours mode' },
  { key: '[ / ]', action: 'Previous or next route' },
  { key: '?', action: 'Toggle keyboard map' }
];

function detectMode(pathname) {
  if (pathname.includes('network') || pathname.includes('atlas')) return 'atlas';
  if (pathname.includes('chapter') || pathname.includes('tour') || pathname.includes('chapters')) return 'tours';
  return 'journey';
}

function createShell() {
  const metadata = resolveRouteMetadata();
  const mode = detectMode(window.location.pathname);

  document.body.setAttribute('data-route-title', metadata.title);
  document.body.setAttribute('data-route-chapter-id', metadata.chapterId ?? '');
  document.body.setAttribute('data-route-concept-cluster', metadata.conceptCluster);

  document.querySelectorAll('.nav, .navigation, .chapter-nav').forEach((node) => node.remove());

  const shell = document.createElement('div');
  shell.className = 'app-shell';
  shell.innerHTML = `
    <a class="skip-link" href="#aion-main-content">Skip to main content</a>
    <header class="app-shell__header" role="banner" aria-label="Global application header">
      <nav class="app-shell__global-nav" aria-label="Global navigation">
        <a href="index.html" class="app-shell__brand">☯ Aion Visualization</a>
        <div class="app-shell__links">
          <a href="index.html">Home</a>
          <a href="chapters.html">Chapters</a>
          <a href="journey.html">Journey</a>
          <a href="symbols.html">Symbols</a>
        </div>
      </nav>
      <div class="app-shell__mode" role="radiogroup" aria-label="Navigation mode switch">
        ${MODES.map((item) => `<a role="radio" aria-checked="${item.id === mode}" class="app-shell__mode-item ${item.id === mode ? 'is-active' : ''}" href="${item.href}">${item.label}</a>`).join('')}
      </div>
      <div class="app-shell__progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="14" aria-valuenow="${metadata.chapterId ?? 0}">
        <span class="app-shell__progress-label">${metadata.chapterId ? `Chapter ${metadata.chapterId} of 14` : 'Concept exploration mode'}</span>
        <span class="app-shell__progress-track"><span class="app-shell__progress-fill" style="width:${metadata.chapterId ? (metadata.chapterId / 14) * 100 : 0}%"></span></span>
      </div>
    </header>
    <aside class="app-shell__context" aria-label="Local chapter and concept context">
      <h2>${metadata.title}</h2>
      <p><strong>Concept cluster:</strong> ${metadata.conceptCluster}</p>
      <nav aria-label="Local context links">
        ${metadata.contextLinks.map((item) => `<a href="${item.href}">${item.label}</a>`).join('')}
      </nav>
      <div class="app-shell__pager" aria-label="Previous and next route links">
        <a href="${metadata.prev}">← Previous</a>
        <a href="${metadata.next}">Next →</a>
      </div>
      <button type="button" class="app-shell__keyboard-map-toggle" aria-expanded="false" aria-controls="app-shell-keyboard-map">Keyboard map</button>
    </aside>
  `;

  document.body.prepend(shell);

  const main = document.querySelector('main') || document.querySelector('.chapter-content') || document.querySelector('.container');
  if (main && !main.id) {
    main.id = 'aion-main-content';
    main.setAttribute('role', 'main');
    main.setAttribute('aria-label', 'Chapter or visualization content');
  }

  const keyboardDialog = document.createElement('dialog');
  keyboardDialog.id = 'app-shell-keyboard-map';
  keyboardDialog.className = 'app-shell__keyboard-map';
  keyboardDialog.setAttribute('aria-label', 'Keyboard navigation map');
  keyboardDialog.innerHTML = `
    <h2>Keyboard Navigation Map</h2>
    <ul>${KEYBOARD_MAP.map((item) => `<li><kbd>${item.key}</kbd><span>${item.action}</span></li>`).join('')}</ul>
    <button type="button" class="app-shell__keyboard-map-close">Close</button>
  `;
  document.body.appendChild(keyboardDialog);

  setupKeyboardNavigation(metadata, keyboardDialog);
}

function setupKeyboardNavigation(metadata, dialog) {
  const toggle = document.querySelector('.app-shell__keyboard-map-toggle');
  const close = dialog.querySelector('.app-shell__keyboard-map-close');

  const toggleMap = () => {
    if (dialog.open) {
      dialog.close();
      toggle.setAttribute('aria-expanded', 'false');
    } else {
      dialog.showModal();
      toggle.setAttribute('aria-expanded', 'true');
    }
  };

  toggle.addEventListener('click', toggleMap);
  close.addEventListener('click', toggleMap);

  let chordState = '';
  document.addEventListener('keydown', (event) => {
    if (event.key === '?') {
      event.preventDefault();
      toggleMap();
      return;
    }

    if (event.key.toLowerCase() === 'g') {
      chordState = 'g';
      return;
    }

    if (chordState === 'g') {
      const key = event.key.toLowerCase();
      const routeByChord = { h: 'index.html', c: 'chapters.html', j: 'journey.html', a: 'network.html', t: 'chapters.html' };
      if (routeByChord[key]) window.location.href = routeByChord[key];
      chordState = '';
    }

    if (event.key === '[') window.location.href = metadata.prev;
    if (event.key === ']') window.location.href = metadata.next;
  });
}

document.addEventListener('DOMContentLoaded', createShell);
