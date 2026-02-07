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

  let inlineHelpEl;

  function inferConcept() {
    if (chapterNum && conceptByChapter[chapterNum]) return conceptByChapter[chapterNum];
    if (path.includes('/chapters/index')) return 'Curriculum map';
    return 'Aion orientation';
  }

  function getPageProgress() {
    if (chapterNum) return Math.round((chapterNum / 14) * 100);
    if (path.includes('/chapters/index')) return 7;
    return 0;
  }

  function renderShell() {
    const chapterLabel = chapterNum
      ? `Chapter ${chapterNum}: ${chapterNames[chapterNum] || 'Aion Chapter'}`
      : (path.includes('/chapters/index') ? 'Chapter Catalog' : 'Aion Home');

    const concept = inferConcept();
    const progress = getPageProgress();

    const shell = document.createElement('aside');
    shell.className = 'chapter-shell';
    shell.setAttribute('aria-label', 'Learning shell');
    shell.innerHTML = `
      <div class="shell-header" data-coach="header">
        <p class="shell-title">Learning shell</p>
        <div class="shell-actions">
          <button type="button" id="shell-glossary-btn" aria-expanded="false">Glossary</button>
          <button type="button" id="shell-shortcuts-btn">⌨</button>
          <button type="button" id="shell-collapse-btn" aria-expanded="true">−</button>
        </div>
      </div>
      <section class="shell-card shell-context" data-coach="breadcrumbs">
        <h3>Current location</h3>
        <div class="shell-breadcrumbs"><strong>${chapterLabel}</strong><br>Concept focus → ${concept}</div>
      </section>
      <div class="shell-body">
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
        <section class="shell-card">
          <h3>Contextual help</h3>
          <div id="shell-inline-help" class="shell-help-content">Hover or click a highlighted term to see definition here.</div>
        </section>
      </div>`;

    document.body.appendChild(shell);

    const drawer = shell.querySelector('#shell-glossary-drawer');
    const glossaryButton = shell.querySelector('#shell-glossary-btn');
    const shortcutsButton = shell.querySelector('#shell-shortcuts-btn');
    const collapseButton = shell.querySelector('#shell-collapse-btn');
    inlineHelpEl = shell.querySelector('#shell-inline-help');

    drawer.innerHTML = Object.entries(glossary)
      .slice(0, 8)
      .map(([term, definition]) => `<div class="glossary-item"><strong>${term}</strong><br>${definition}</div>`)
      .join('');

    const overlay = document.createElement('div');
    overlay.className = 'shortcuts-overlay';
    overlay.innerHTML = `<div class="shortcuts-modal" role="dialog" aria-label="Keyboard shortcuts">
      <h2>Keyboard shortcuts</h2>
      <ul>
        <li><strong>?</strong> Open shortcuts</li>
        <li><strong>g</strong> Toggle glossary</li>
        <li><strong>c</strong> Collapse/expand shell</li>
        <li><strong>Esc</strong> Close overlays</li>
      </ul>
      <button type="button" class="shortcuts-close">Close</button>
    </div>`;

    document.body.appendChild(overlay);

    const closeShortcuts = () => overlay.classList.remove('open');
    const toggleGlossary = () => {
      drawer.classList.toggle('open');
      glossaryButton.setAttribute('aria-expanded', String(drawer.classList.contains('open')));
    };
    const toggleCollapse = () => {
      shell.classList.toggle('collapsed');
      collapseButton.setAttribute('aria-expanded', String(!shell.classList.contains('collapsed')));
      collapseButton.textContent = shell.classList.contains('collapsed') ? '+' : '−';
    };

    glossaryButton.addEventListener('click', toggleGlossary);
    shortcutsButton.addEventListener('click', () => overlay.classList.add('open'));
    collapseButton.addEventListener('click', toggleCollapse);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeShortcuts();
    });
    overlay.querySelector('.shortcuts-close').addEventListener('click', closeShortcuts);

    if (window.matchMedia('(max-width: 900px)').matches) {
      shell.classList.add('auto-collapsed', 'collapsed');
      collapseButton.setAttribute('aria-expanded', 'false');
      collapseButton.textContent = '+';
    }

    window.addEventListener('keydown', (event) => {
      if (event.key === '?') overlay.classList.add('open');
      if (event.key.toLowerCase() === 'g') toggleGlossary();
      if (event.key.toLowerCase() === 'c') toggleCollapse();
      if (event.key === 'Escape') closeShortcuts();
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

    let index = 0;
    const showStep = () => {
      if (index >= targets.length) {
        localStorage.setItem(key, '1');
        return;
      }

      const [element, text] = targets[index++];
      if (!element) return showStep();

      const rect = element.getBoundingClientRect();
      const marker = document.createElement('div');
      marker.className = 'coachmark';
      marker.textContent = `${text} (click to continue)`;
      marker.style.top = `${Math.min(window.innerHeight - 70, rect.bottom + 8)}px`;
      marker.style.left = `${Math.max(8, rect.left)}px`;
      marker.addEventListener('click', () => {
        marker.remove();
        showStep();
      });
      document.body.appendChild(marker);
    };

    setTimeout(showStep, 500);
  }

  function setInlineHelp(term) {
    if (!inlineHelpEl || !glossary[term]) return;
    inlineHelpEl.innerHTML = `<strong>${term}</strong><br>${glossary[term]}`;
  }

  function annotateTerms() {
    const contentRoot = document.querySelector('main') || document.body;
    const candidates = contentRoot.querySelectorAll('p, li');
    const terms = Object.keys(glossary);

    candidates.forEach((node) => {
      if (node.closest('.chapter-shell')) return;
      if (node.querySelector('a, code, pre, script, style')) return;

      let html = node.innerHTML;
      let changed = false;

      terms.forEach((term) => {
        const regex = new RegExp(`\\b(${term})\\b`, 'ig');
        if (regex.test(html)) {
          html = html.replace(regex, `<span class="term-highlight" tabindex="0" data-term="${term}">$1</span>`);
          changed = true;
        }
      });

      if (changed) node.innerHTML = html;
    });

    let tooltip;
    const clearTip = () => {
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    };

    const showTip = (el, event) => {
      const term = el.getAttribute('data-term');
      if (!term || !glossary[term]) return;

      clearTip();
      tooltip = document.createElement('div');
      tooltip.className = 'term-tooltip';
      tooltip.textContent = `${term}: ${glossary[term]}`;
      document.body.appendChild(tooltip);
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 12}px`;
      setInlineHelp(term);
    };

    document.addEventListener('mouseover', (event) => {
      const el = event.target.closest('[data-term]');
      if (!el) return;
      showTip(el, event);
    });

    document.addEventListener('mousemove', (event) => {
      if (!tooltip) return;
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 12}px`;
    });

    document.addEventListener('mouseout', (event) => {
      if (event.target.closest('[data-term]')) clearTip();
    });

    document.addEventListener('click', (event) => {
      const el = event.target.closest('[data-term]');
      if (!el) return;
      const term = el.getAttribute('data-term');
      setInlineHelp(term);
    });

    document.addEventListener('focusin', (event) => {
      const el = event.target.closest('[data-term]');
      if (!el) return;
      const term = el.getAttribute('data-term');
      setInlineHelp(term);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderShell();
    annotateTerms();
  });
})();
