import { canonicalGraph, pathPresets } from './canonical-graph.js';

const STORAGE_KEY = 'aion.experience.intent';
const state = {
  selectedPreset: pathPresets[0],
  selectedMode: pathPresets[0].mode,
  selectedChapter: pathPresets[0].chapters[0],
  nodePositions: []
};

const captions = [
  'In Aion, symbols are not ornaments—they are psychic events.',
  'Begin with a constellation, not a table of contents.',
  'Choose your orientation, and the journey will answer.'
];

function getSavedIntent() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function hydrateFromSavedIntent() {
  const saved = getSavedIntent();
  if (!saved) return;

  const matched = pathPresets.find((preset) => preset.id === saved.preset);
  if (!matched) return;

  state.selectedPreset = matched;
  state.selectedMode = saved.mode || matched.mode;
  state.selectedChapter = Number(saved.startingChapter) || matched.chapters[0];

  const resume = document.getElementById('resume-intent');
  if (resume) {
    resume.textContent = `Saved intent found: ${saved.preset} → ${state.selectedMode}.`;
  }
}

function initIntro() {
  const captionEl = document.getElementById('voiceover-caption');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let idx = 0;
  captionEl.textContent = captions[idx];

  if (!prefersReducedMotion) {
    setInterval(() => {
      idx = (idx + 1) % captions.length;
      captionEl.textContent = captions[idx];
    }, 5000);
  }

  document.getElementById('begin-experience').addEventListener('click', () => {
    document.querySelector('.intro').classList.add('intro-complete');
    document.getElementById('experience-main').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
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
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(canvas.width, canvas.height) * 0.36;

  const nodePositions = canonicalGraph.chapterNodes.map((chapter, index) => {
    const pos = polarPosition(index, canonicalGraph.chapterNodes.length, radius, centerX, centerY);
    return { ...chapter, ...pos };
  });

  canonicalGraph.conceptEdges.forEach((edge) => {
    const source = nodePositions.find((n) => n.id === edge.sourceChapter);
    const target = nodePositions.find((n) => n.id === edge.targetChapter);
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

  state.nodePositions = nodePositions;
}

function setupGalaxyPointer() {
  const canvas = document.getElementById('concept-galaxy');
  const hint = document.getElementById('galaxy-hint');

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = state.nodePositions.find((node) => Math.hypot(node.x - x, node.y - y) < 10);

    hint.textContent = hit
      ? `Chapter ${hit.id}: ${hit.title}`
      : 'Hover a star to inspect chapter nodes from the canonical graph.';
  });
}

function renderRecommendation() {
  const recommendation = document.getElementById('recommendation');
  state.selectedChapter = state.selectedPreset.chapters[0];

  recommendation.innerHTML = `
    <h3>Recommended Starting Path</h3>
    <p><strong>${state.selectedPreset.label}</strong> — ${state.selectedPreset.narrative}</p>
    <p>Start chapter: <strong>${state.selectedChapter}</strong>. Suggested mode: <strong>${state.selectedPreset.mode}</strong>.</p>
  `;

  const recommendationCue = document.getElementById('recommendation-cue');
  if (recommendationCue) recommendationCue.textContent = `Narrative cue: ${state.selectedPreset.narrative}`;
  renderGalaxy();
}

function renderPresets() {
  const list = document.getElementById('preset-list');
  list.innerHTML = '';

  pathPresets.forEach((preset) => {
    const btn = document.createElement('button');
    btn.className = `preset${preset.id === state.selectedPreset.id ? ' active' : ''}`;
    btn.type = 'button';
    btn.textContent = preset.label;

    btn.addEventListener('click', () => {
      state.selectedPreset = preset;
      state.selectedMode = preset.mode;

      document.querySelectorAll('.preset').forEach((el) => el.classList.remove('active'));
      btn.classList.add('active');
      renderRecommendation();
    });

    list.appendChild(btn);
  });

  renderRecommendation();
}

function persistIntent(modeOverride) {
  const payload = {
    preset: state.selectedPreset.id,
    mode: modeOverride || state.selectedMode,
    startingChapter: state.selectedChapter,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

function buildModeUrl(mode, intent) {
  const params = new URLSearchParams({
    entry: 'experience',
    chapter: String(intent.startingChapter),
    preset: intent.preset
  });

  if (mode === 'atlas') {
    params.set('view', 'atlas');
    return `../src/chapters.html?${params.toString()}`;
  }

  return `../src/journey.html?${params.toString()}`;
}

function setupHandoff() {
  const journeyBtn = document.getElementById('handoff-journey');
  const atlasBtn = document.getElementById('handoff-atlas');

  journeyBtn.addEventListener('click', () => {
    const intent = persistIntent('journey');
    window.location.href = buildModeUrl('journey', intent);
  });

  atlasBtn.addEventListener('click', () => {
    const intent = persistIntent('atlas');
    window.location.href = buildModeUrl('atlas', intent);
  });
}

function init() {
  hydrateFromSavedIntent();
  initIntro();
  renderPresets();
  setupGalaxyPointer();
  setupHandoff();
  window.addEventListener('resize', renderGalaxy);
}

init();
