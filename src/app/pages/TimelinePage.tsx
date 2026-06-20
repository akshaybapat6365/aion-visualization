import { useMemo, useState } from 'react';

import { TIMELINE_CATEGORIES, TIMELINE_EVENTS } from '../../features/timeline/timeline-data.js';

import './TimelinePage.css';

type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  category: string;
  summary: string;
};

type TimelineCategory = {
  id: string;
  label: string;
};

function year(date: string) {
  return date.slice(0, 4);
}

function categoryTone(categoryId: string) {
  const tones: Record<string, string> = {
    personal: 'gold',
    publications: 'cyan',
    encounters: 'green',
    concepts: 'rose',
  };
  return tones[categoryId] || 'gold';
}

function buildOrbitEvents(events: TimelineEvent[], selectedId: string | null) {
  if (events.length <= 12) return events;
  const selectedIndex = events.findIndex((event) => event.id === selectedId);
  const anchorIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const start = Math.min(Math.max(anchorIndex - 5, 0), Math.max(events.length - 12, 0));
  return events.slice(start, start + 12);
}

export default function TimelinePage() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const events = TIMELINE_EVENTS as TimelineEvent[];
  const categories = TIMELINE_CATEGORIES as TimelineCategory[];
  const categoryRows = categories.filter((item) => item.id !== 'all');
  const categoryLabels = Object.fromEntries(categories.map((item) => [item.id, item.label]));
  const firstYear = Math.min(...events.map((event) => Number(year(event.date))));
  const lastYear = Math.max(...events.map((event) => Number(year(event.date))));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesCategory = category === 'all' || event.category === category;
      const matchesQuery = !q || `${event.title} ${event.summary}`.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, events, query]);

  const selected = filtered.find((event) => event.id === selectedId) || filtered[0] || null;
  const orbitEvents = buildOrbitEvents(filtered, selected?.id || selectedId);
  const resultSummary = `${filtered.length} of ${events.length} events visible`;

  return (
    <div className="page">
      <section className="page-header page-header--visual timeline-hero section-band">
        <div>
          <p className="eyebrow">Timeline</p>
          <h1>Jung in symbolic time</h1>
          <p className="lede">A focused chronology places Aion inside a longer rhythm of life, publication, encounter, and concept formation.</p>
          <div className="timeline-hero__metrics" aria-label="Timeline counts">
            <span><strong>{events.length}</strong> events</span>
            <span><strong>{filtered.length}</strong> visible</span>
            <span><strong>{lastYear - firstYear}</strong> year field</span>
          </div>
        </div>
        <div className="timeline-orbit" aria-label={`Timeline orbit, ${orbitEvents.length} events in view`}>
          <div id="timeline-selected-orbit-detail" className="timeline-orbit__core" aria-live="polite">
            {selected ? (
              <>
                <span>{year(selected.date)}</span>
                <strong>{selected.title}</strong>
              </>
            ) : (
              <>
                <span>No match</span>
                <strong>Adjust the field</strong>
              </>
            )}
          </div>
          {orbitEvents.length > 0 ? (
            orbitEvents.map((event, index) => (
              <button
                key={event.id}
                className={event.id === selected?.id ? 'timeline-orbit__node timeline-orbit__node--active' : 'timeline-orbit__node'}
                type="button"
                style={{ ['--node-index' as string]: index, ['--node-count' as string]: orbitEvents.length }}
                onClick={() => setSelectedId(event.id)}
                aria-controls="timeline-selected-detail timeline-selected-orbit-detail timeline-field"
                aria-label={`Select ${year(event.date)}: ${event.title}`}
                aria-pressed={event.id === selected?.id}
              >
                {year(event.date).slice(2)}
              </button>
            ))
          ) : (
            <p className="timeline-orbit__empty">No events in this filter</p>
          )}
        </div>
      </section>
      <section className="timeline-layout section-band section-band--tight">
        <div className="timeline-controls">
          <label htmlFor="timeline-search">Search</label>
          <input id="timeline-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Aion, alchemy, archetypes" />
          <label htmlFor="timeline-category">Category</label>
          <select id="timeline-category" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <output className="timeline-controls__result" htmlFor="timeline-search timeline-category" aria-live="polite">
            {resultSummary}
          </output>
        </div>
        <div className="timeline-field-stack">
          <div
            id="timeline-field"
            className={filtered.length > 0 ? 'timeline-field' : 'timeline-field timeline-field--empty'}
            role="group"
            aria-label={`Timeline field: ${resultSummary}. Years ${firstYear} to ${lastYear}.`}
          >
            <div className="timeline-field__axis" aria-hidden="true">
              <span>{firstYear}</span>
              <span>{lastYear}</span>
            </div>
            {categoryRows.map((item, index) => (
              <div
                key={item.id}
                className="timeline-field__row"
                data-tone={categoryTone(item.id)}
                style={{ ['--row-index' as string]: index }}
                aria-hidden="true"
              >
                <span>{item.label}</span>
              </div>
            ))}
            {filtered.map((event) => {
              const eventYear = Number(year(event.date));
              const rowIndex = Math.max(0, categoryRows.findIndex((item) => item.id === event.category));
              const x = 10 + ((eventYear - firstYear) / Math.max(lastYear - firstYear, 1)) * 80;
              return (
                <button
                  key={event.id}
                  className={event.id === selected?.id ? 'timeline-field__node timeline-field__node--active' : 'timeline-field__node'}
                  data-tone={categoryTone(event.category)}
                  type="button"
                  style={{ ['--event-x' as string]: `${x}%`, ['--row-index' as string]: rowIndex }}
                  onClick={() => setSelectedId(event.id)}
                  aria-controls="timeline-selected-detail timeline-selected-orbit-detail"
                  aria-label={`Select ${year(event.date)} ${categoryLabels[event.category]} event: ${event.title}`}
                  aria-pressed={event.id === selected?.id}
                  title={`${year(event.date)} · ${event.title}`}
                >
                  <span>{year(event.date).slice(2)}</span>
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <div className="timeline-field__empty" role="status">
                <strong>No matching events</strong>
                <span>Loosen the search or choose another category.</span>
              </div>
            ) : null}
          </div>
          <ol className="timeline-rail" aria-label="Visible timeline events">
            {filtered.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  className={event.id === selected?.id ? 'timeline-rail__item timeline-rail__item--active' : 'timeline-rail__item'}
                  onClick={() => setSelectedId(event.id)}
                  aria-controls="timeline-selected-detail timeline-selected-orbit-detail timeline-field"
                  aria-pressed={event.id === selected?.id}
                >
                  <span>{year(event.date)} · {categoryLabels[event.category]}</span>
                  <strong>{event.title}</strong>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <aside id="timeline-selected-detail" className={selected ? 'timeline-detail' : 'timeline-detail timeline-detail--empty'} aria-live="polite">
          {selected ? (
            <>
              <p className="eyebrow">{categoryLabels[selected.category] || selected.category}</p>
              <h2>{selected.title}</h2>
              <p>{selected.summary}</p>
            </>
          ) : (
            <>
              <p className="eyebrow">No matching events</p>
              <h2>Adjust the field</h2>
              <p>No event matches the current search and category. The visual field has intentionally cleared instead of showing an unrelated detail.</p>
            </>
          )}
        </aside>
      </section>
    </div>
  );
}
