import { useMemo, useState } from 'react';

import { TIMELINE_CATEGORIES, TIMELINE_EVENTS } from '../../features/timeline/timeline-data.js';

type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  category: string;
  summary: string;
};

function year(date: string) {
  return date.slice(0, 4);
}

export default function TimelinePage() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const events = TIMELINE_EVENTS as TimelineEvent[];
  const categories = TIMELINE_CATEGORIES as { id: string; label: string }[];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesCategory = category === 'all' || event.category === category;
      const matchesQuery = !q || `${event.title} ${event.summary}`.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [category, events, query]);

  const selected = filtered.find((event) => event.id === selectedId) || filtered[0] || events[0];
  const orbitEvents = events.slice(0, 12);

  return (
    <div className="page">
      <section className="page-header page-header--visual timeline-hero section-band">
        <div>
          <p className="eyebrow">Timeline</p>
          <h1>Jung in symbolic time</h1>
          <p className="lede">A focused chronology places Aion inside a longer rhythm of life, publication, encounter, and concept formation.</p>
        </div>
        <div className="timeline-orbit" aria-label="Timeline orbit">
          <div className="timeline-orbit__core">
            <span>{year(selected.date)}</span>
            <strong>{selected.title}</strong>
          </div>
          {orbitEvents.map((event, index) => (
            <button
              key={event.id}
              className={event.id === selected.id ? 'timeline-orbit__node timeline-orbit__node--active' : 'timeline-orbit__node'}
              type="button"
              style={{ ['--node-index' as string]: index, ['--node-count' as string]: orbitEvents.length }}
              onClick={() => setSelectedId(event.id)}
              aria-label={`Select ${year(event.date)}: ${event.title}`}
            >
              {year(event.date).slice(2)}
            </button>
          ))}
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
        </div>
        <ol className="timeline-rail">
          {filtered.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                className={event.id === selected.id ? 'timeline-rail__item timeline-rail__item--active' : 'timeline-rail__item'}
                onClick={() => setSelectedId(event.id)}
              >
                <span>{year(event.date)}</span>
                <strong>{event.title}</strong>
              </button>
            </li>
          ))}
        </ol>
        <aside className="timeline-detail">
          <p className="eyebrow">{selected.category}</p>
          <h2>{selected.title}</h2>
          <p>{selected.summary}</p>
        </aside>
      </section>
    </div>
  );
}
