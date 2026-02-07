(function () {
  const path = window.location.pathname;
  const chapterMatch = path.match(/chapter-(\d+)\.html/);
  const chapterNum = chapterMatch ? Number(chapterMatch[1]) : null;
  const chapterNames = {
    1: 'The Ego', 2: 'The Shadow', 3: 'The Syzygy', 4: 'The Sign of the Fishes',
    5: 'Christ as Archetype', 6: 'The Antichrist', 7: 'The Pleroma', 8: 'Sophia',
    9: 'The Coniunctio', 10: 'The Tree', 11: 'Christ as Symbol', 12: 'The Significance of Fish',
    13: 'Historical Significance', 14: 'The Structure of the Psyche'
  };
  const conceptByChapter = {
    1: 'Ego formation', 2: 'Shadow integration', 3: 'Anima/Animus dynamics', 4: 'Piscean symbolism',
    5: 'Self archetype', 6: 'Oppositional forces', 7: 'Pleromatic totality', 8: 'Wisdom archetype',
    9: 'Union of opposites', 10: 'Axis mundi', 11: 'Symbolic personification', 12: 'Mythic motifs',
    13: 'Collective transitions', 14: 'Psychic wholeness'
  };
  const whyByChapter = {
    default: 'This section anchors your orientation in Jung\'s arc so each symbol has psychological relevance.',
    1: 'Knowing the ego\'s limits prevents inflation and prepares deeper encounters with unconscious content.'
  };
  const glossary = {
    ego: 'The center of consciousness and personal identity.',
    self: 'The regulating totality of the psyche, beyond conscious ego.',
    shadow: 'Disowned qualities and potentials that remain unconscious.',
    anima: 'Inner feminine image in the male psyche.',
    animus: 'Inner masculine image in the female psyche.',
    individuation: 'Process of becoming psychologically whole.',
    archetype: 'Inherited psychic pattern shaping imagery and behavior.',
    pleroma: 'State of undifferentiated fullness in Gnostic cosmology.'
  };

  function inferConcept() {
    if (chapterNum && conceptByChapter[chapterNum]) return conceptByChapter[chapterNum];
    if (path.includes('/chapters/index')) return 'Curriculum map';
    return 'Aion orientation';
  }

  function renderShell() {
    const chapterLabel = chapterNum ? `Chapter ${chapterNum}: ${chapterNames[chapterNum] || 'Aion Chapter'}` : (path.includes('/chapters/index') ? 'Chapter Catalog' : 'Aion Home');
    const concept = inferConcept();
    const progress = chapterNum ? Math.round((chapterNum / 14) * 100) : (path.includes('/chapters/index') ? 7 : 0);

    const shell = document.createElement('aside');
    shell.className = 'chapter-shell';
    shell.innerHTML = `
      <div class="shell-header" data-coach="header">
        <p class="shell-title">Learning shell</p>
        <div class="shell-actions">
          <button type="button" id="shell-glossary-btn">Glossary</button>
          <button type="button" id="shell-shortcuts-btn">⌨</button>
          <button type="button" id="shell-collapse-btn">−</button>
        </div>
      </div>
      <div class="shell-body">
        <section class="shell-card" data-coach="breadcrumbs">
          <h3>Current location</h3>
          <div class="shell-breadcrumbs"><strong>${chapterLabel}</strong><br>Concept focus → ${concept}</div>
        </section>
        <section class="shell-card" data-coach="compass">
          <h3>Progress compass</h3>
          <div class="progress-bar"><span style="width:${progress}%"></span></div>
          <div class="progress-label">${progress}% through the 14-chapter arc</div>
        </section>
        <section class="shell-card">
          <h3>Why this chapter matters</h3>
          <div>${whyByChapter[chapterNum] || whyByChapter.default}</div>
        </section>
        <section class="shell-card">
          <h3>Quick glossary</h3>
          <div class="glossary-drawer" id="shell-glossary-drawer"></div>
        </section>
      </div>`;
    document.body.appendChild(shell);

    const drawer = shell.querySelector('#shell-glossary-drawer');
    drawer.innerHTML = Object.entries(glossary).slice(0, 6)
      .map(([term, definition]) => `<div class="glossary-item"><strong>${term}</strong><br>${definition}</div>`)
      .join('');

    const overlay = document.createElement('div');
    overlay.className = 'shortcuts-overlay';
    overlay.innerHTML = `<div class="shortcuts-modal"><h2>Keyboard shortcuts</h2>
      <ul>
      <li><strong>?</strong> Open shortcuts</li>
      <li><strong>g</strong> Toggle glossary</li>
      <li><strong>c</strong> Collapse/expand shell</li>
      <li><strong>Esc</strong> Close overlays</li>
      </ul></div>`;
    document.body.appendChild(overlay);

    shell.querySelector('#shell-glossary-btn').addEventListener('click', () => drawer.classList.toggle('open'));
    shell.querySelector('#shell-shortcuts-btn').addEventListener('click', () => overlay.classList.add('open'));
    shell.querySelector('#shell-collapse-btn').addEventListener('click', () => shell.classList.toggle('collapsed'));
    overlay.addEventListener('click', () => overlay.classList.remove('open'));

    if (window.matchMedia('(max-width: 900px)').matches) {
      shell.classList.add('auto-collapsed', 'collapsed');
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === '?') overlay.classList.add('open');
      if (e.key.toLowerCase() === 'g') drawer.classList.toggle('open');
      if (e.key.toLowerCase() === 'c') shell.classList.toggle('collapsed');
      if (e.key === 'Escape') overlay.classList.remove('open');
    });

    runCoachmarks(shell);
  }

  function runCoachmarks(shell) {
    const key = 'aion-shell-onboarded';
    if (localStorage.getItem(key)) return;
    const targets = [
      [shell.querySelector('[data-coach="breadcrumbs"]'), 'Breadcrumbs keep chapter + concept context in view.'],
      [shell.querySelector('[data-coach="compass"]'), 'Compass shows your position in the full arc.'],
      [shell.querySelector('#shell-glossary-btn'), 'Glossary gives quick definitions while reading.']
    ];
    let i = 0;
    const step = () => {
      if (i >= targets.length) { localStorage.setItem(key, '1'); return; }
      const [el, text] = targets[i++];
      if (!el) return step();
      const r = el.getBoundingClientRect();
      const mark = document.createElement('div');
      mark.className = 'coachmark';
      mark.textContent = text + ' (click to continue)';
      mark.style.top = `${Math.min(window.innerHeight - 70, r.bottom + 8)}px`;
      mark.style.left = `${Math.max(8, r.left)}px`;
      mark.addEventListener('click', () => { mark.remove(); step(); });
      document.body.appendChild(mark);
    };
    setTimeout(step, 600);
  }

  function annotateTerms() {
    const container = document.querySelector('main') || document.body;
    const nodes = container.querySelectorAll('p, li');
    const keys = Object.keys(glossary);
    nodes.forEach((node) => {
      if (node.closest('.chapter-shell')) return;
      let html = node.innerHTML;
      let changed = false;
      keys.forEach((term) => {
        const rx = new RegExp(`\\b(${term})\\b`, 'ig');
        if (rx.test(html)) {
          html = html.replace(rx, `<span class="term-highlight" data-term="${term.toLowerCase()}">$1</span>`);
          changed = true;
        }
      });
      if (changed) node.innerHTML = html;
    });

    let tooltip;
    function showTip(el, evt) {
      const term = el.getAttribute('data-term');
      if (!glossary[term]) return;
      tooltip = document.createElement('div');
      tooltip.className = 'term-tooltip';
      tooltip.textContent = `${term}: ${glossary[term]}`;
      document.body.appendChild(tooltip);
      tooltip.style.left = `${evt.clientX + 12}px`;
      tooltip.style.top = `${evt.clientY + 12}px`;
    }
    document.addEventListener('mouseover', (evt) => {
      const el = evt.target.closest('[data-term]');
      if (!el) return;
      if (tooltip) tooltip.remove();
      showTip(el, evt);
    });
    document.addEventListener('mousemove', (evt) => {
      if (!tooltip) return;
      tooltip.style.left = `${evt.clientX + 12}px`;
      tooltip.style.top = `${evt.clientY + 12}px`;
    });
    document.addEventListener('mouseout', (evt) => {
      if (evt.target.closest('[data-term]') && tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    });
    document.addEventListener('click', (evt) => {
      const el = evt.target.closest('[data-term]');
      if (!el) return;
      const term = el.getAttribute('data-term');
      alert(`${term.toUpperCase()}: ${glossary[term]}`);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderShell();
    annotateTerms();
  });
})();
