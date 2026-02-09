import { TIMELINE_CATEGORIES, TIMELINE_EVENTS } from './timeline-data.js';

function $(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Missing required element: ${selector}`);
  return el;
}

function parseDate(iso) {
  return new Date(iso);
}

const formatFullDate = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit'
});

function formatDateLabel(iso) {
  const [year, month, day] = iso.split('-');
  if (month === '01' && day === '01') return year;
  return formatFullDate.format(parseDate(iso));
}

function yearOf(iso) {
  return parseDate(iso).getFullYear();
}

function normalized(text) {
  return String(text || '').toLowerCase();
}

const state = {
  query: '',
  category: 'all',
  selectedId: null
};

const els = {
  list: $('#timeline-list'),
  detailTitle: $('#timeline-detail-title'),
  detailDate: $('#timeline-detail-date'),
  detailSummary: $('#timeline-detail-body'),
  search: $('#timeline-search'),
  category: $('#timeline-category'),
  reset: $('#timeline-reset')
};

function buildCategoryOptions() {
  els.category.innerHTML = TIMELINE_CATEGORIES.map((cat) => (
    `<option value="${cat.id}">${cat.label}</option>`
  )).join('');
}

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  const query = params.get('q');
  const selected = params.get('event');

  if (category) state.category = category;
  if (query) state.query = query;
  if (selected) state.selectedId = selected;
}

function writeUrlState() {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  if (state.query) params.set('q', state.query);
  else params.delete('q');

  if (state.category && state.category !== 'all') params.set('category', state.category);
  else params.delete('category');

  if (state.selectedId) params.set('event', state.selectedId);
  else params.delete('event');

  window.history.replaceState({}, '', url.toString());
}

function getFilteredEvents() {
  const q = normalized(state.query);
  return TIMELINE_EVENTS
    .filter((event) => (state.category === 'all' || event.category === state.category))
    .filter((event) => (!q
      || normalized(event.title).includes(q)
      || normalized(event.summary).includes(q)))
    .slice()
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
}

function categoryLabel(categoryId) {
  const match = TIMELINE_CATEGORIES.find((cat) => cat.id === categoryId);
  return match ? match.label : categoryId;
}

function selectEvent(eventId, events) {
  const event = events.find((e) => e.id === eventId) || events[0] || null;
  state.selectedId = event ? event.id : null;
  writeUrlState();

  if (!event) {
    els.detailTitle.textContent = 'No results';
    els.detailDate.textContent = '';
    els.detailSummary.textContent = 'Try clearing filters to see more events.';
    return;
  }

  els.detailTitle.textContent = event.title;
  els.detailDate.textContent = `${formatDateLabel(event.date)} • ${categoryLabel(event.category)}`;
  els.detailSummary.textContent = event.summary || '';
}

function renderList(events) {
  els.list.innerHTML = '';

  let currentYear = null;
  events.forEach((event) => {
    const year = yearOf(event.date);
    if (year !== currentYear) {
      currentYear = year;
      const yearLi = document.createElement('li');
      yearLi.className = 'timeline-year';
      yearLi.textContent = String(year);
      els.list.appendChild(yearLi);
    }

    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'timeline-item';
    button.dataset.eventId = event.id;
    button.setAttribute('aria-selected', String(event.id === state.selectedId));

    button.innerHTML = `
      <div class="timeline-item__meta">
        <span class="timeline-item__date">${formatDateLabel(event.date)}</span>
        <span class="timeline-item__badge">${categoryLabel(event.category)}</span>
      </div>
      <div class="timeline-item__title">${event.title}</div>
    `;

    button.addEventListener('click', () => {
      state.selectedId = event.id;
      selectEvent(event.id, events);
      renderList(events);
    });

    li.appendChild(button);
    els.list.appendChild(li);
  });
}

function syncControls() {
  els.search.value = state.query;
  els.category.value = state.category;
}

function update() {
  const events = getFilteredEvents();

  if (!state.selectedId || !events.some((e) => e.id === state.selectedId)) {
    state.selectedId = events[0]?.id || null;
  }

  renderList(events);
  selectEvent(state.selectedId, events);
  syncControls();
}

function bindEvents() {
  els.search.addEventListener('input', () => {
    state.query = els.search.value;
    writeUrlState();
    update();
  });

  els.category.addEventListener('change', () => {
    state.category = els.category.value;
    writeUrlState();
    update();
  });

  els.reset.addEventListener('click', () => {
    state.query = '';
    state.category = 'all';
    state.selectedId = null;
    writeUrlState();
    update();
  });
}

(function initTimeline() {
  try {
    buildCategoryOptions();
    readUrlState();
    bindEvents();
    update();
  } catch (error) {
    // Minimal on-page failure state: keep nav usable.
    console.error('Timeline initialization failed:', error);
    els.list.innerHTML = '<li class="timeline-year">Error</li>';
    els.detailTitle.textContent = 'Timeline unavailable';
    els.detailSummary.textContent = error.message || String(error);
  }
}());

