import { canonicalGraph, pathPresets } from './canonical-graph.js';

const state = {
  selectedPreset: pathPresets[0],
  selectedMode: 'journey',
  selectedChapter: 1
};

const captions = [
  'In Aion, symbols are not ornaments—they are psychic events.',
  'Begin with a constellation, not a table of contents.',
  'Choose your orientation, and the journey will answer.'
];

function initIntro() {
  const captionEl = document.getElementById('voiceover-caption');
  let idx = 0;
  captionEl.textContent = captions[idx];

  setInterval(() => {
    idx = (idx + 1) % captions.length;
    captionEl.textContent = captions[idx];
  }, 5000);

  document.getElementById('begin-experience').addEventListener('click', () => {
    document.querySelector('.intro').classList.add('intro-complete');
    document.getElementById('experience-main').scrollIntoView({ behavior: 'smooth' });
  });
}

function polarPosition(index, total, radius, centerX, centerY) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  };
}

function renderGalaxy() {
  const canvas = document.getElementById('concept-galaxy');
  const ctx = canvas.getContext('2d');

  function draw() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.36;

    const nodePositions = canonicalGraph.chapters.map((chapter, index) => {
      const pos = polarPosition(index, canonicalGraph.chapters.length, radius, centerX, centerY);
      return { ...chapter, ...pos };
    });

    canonicalGraph.conceptEdges.forEach((edge) => {
      const source = nodePositions.find((n) => n.id === edge.source);
      const target = nodePositions.find((n) => n.id === edge.target);
      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = 'rgba(255, 215, 160, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    nodePositions.forEach((node) => {
      const isHighlighted = state.selectedPreset.chapters.includes(node.id);
      ctx.beginPath();
      ctx.arc(node.x, node.y, isHighlighted ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted ? '#f3d19a' : 'rgba(173, 200, 255, 0.8)';
      ctx.fill();
    });

    canvas.dataset.positions = JSON.stringify(nodePositions.map(({ id, x, y, title }) => ({ id, x, y, title })));
  }

  draw();
  window.addEventListener('resize', draw);

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const positions = JSON.parse(canvas.dataset.positions || '[]');
    const hit = positions.find((node) => Math.hypot(node.x - x, node.y - y) < 10);

    const hint = document.getElementById('galaxy-hint');
    if (hit) {
      hint.textContent = `Chapter ${hit.id}: ${hit.title}`;
    } else {
      hint.textContent = 'Hover a star to inspect chapter nodes from the canonical graph.';
    }
  });
}

function renderPresets() {
  const list = document.getElementById('preset-list');
  const recommendation = document.getElementById('recommendation');

  function updateRecommendation() {
    state.selectedChapter = state.selectedPreset.chapters[0];
    recommendation.innerHTML = `
      <h3>Recommended Starting Path</h3>
      <p><strong>${state.selectedPreset.label}</strong> — ${state.selectedPreset.narrative}</p>
      <p>Start chapter: <strong>${state.selectedChapter}</strong>. Suggested mode: <strong>${state.selectedPreset.mode}</strong>.</p>
    `;
    document.getElementById('voiceover-caption').textContent = `Narrative cue: ${state.selectedPreset.narrative}`;
    renderGalaxy();
  }

  pathPresets.forEach((preset) => {
    const btn = document.createElement('button');
    btn.className = 'preset';
    btn.type = 'button';
    btn.textContent = preset.label;
    btn.addEventListener('click', () => {
      state.selectedPreset = preset;
      state.selectedMode = preset.mode;
      document.querySelectorAll('.preset').forEach((el) => el.classList.remove('active'));
      btn.classList.add('active');
      updateRecommendation();
    });
    if (preset.id === state.selectedPreset.id) btn.classList.add('active');
    list.appendChild(btn);
  });

  updateRecommendation();
}

function persistIntent(modeOverride) {
  const payload = {
    preset: state.selectedPreset.id,
    mode: modeOverride || state.selectedMode,
    startingChapter: state.selectedChapter,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('aion.experience.intent', JSON.stringify(payload));
  return payload;
}

function setupHandoff() {
  const journeyBtn = document.getElementById('handoff-journey');
  const atlasBtn = document.getElementById('handoff-atlas');

  journeyBtn.addEventListener('click', () => {
    const intent = persistIntent('journey');
    window.location.href = `/src/journey.html?entry=experience&chapter=${intent.startingChapter}&preset=${intent.preset}`;
  });

  atlasBtn.addEventListener('click', () => {
    const intent = persistIntent('atlas');
    window.location.href = `/src/chapters.html?view=atlas&entry=experience&chapter=${intent.startingChapter}&preset=${intent.preset}`;
  });

  const saved = localStorage.getItem('aion.experience.intent');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const matched = pathPresets.find((preset) => preset.id === parsed.preset);
      if (matched) {
        state.selectedPreset = matched;
        state.selectedMode = parsed.mode || matched.mode;
      }
      const resume = document.getElementById('resume-intent');
      resume.textContent = `Saved intent found: ${parsed.preset} → ${parsed.mode}.`;
    } catch {
      // ignore malformed localStorage
    }
  }
}

initIntro();
renderGalaxy();
renderPresets();
setupHandoff();
