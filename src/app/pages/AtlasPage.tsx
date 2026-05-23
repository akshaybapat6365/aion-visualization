import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import ChapterSigil from '../components/ChapterSigil';
import {
  getChapterRoute,
  getChapters,
  getConcepts,
  getConceptsForChapter,
  getRelationships,
  getSymbols,
} from '../data/aionData';

export default function AtlasPage() {
  const chapters = getChapters();
  const concepts = getConcepts();
  const symbols = getSymbols();
  const relationships = getRelationships();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(chapters[0].id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter((chapter) => {
      const conceptText = getConceptsForChapter(chapter.id).map((concept) => concept.label).join(' ');
      return `${chapter.title} ${chapter.summary} ${chapter.cluster} ${conceptText}`.toLowerCase().includes(q);
    });
  }, [chapters, query]);

  const active = chapters.find((chapter) => chapter.id === selected) || chapters[0];
  const activeConcepts = getConceptsForChapter(active.id);
  const linkedSymbols = symbols.filter((symbol) => symbol.conceptIds.some((id) => active.keyConceptIds.includes(id)));
  const linkedRelationships = relationships.filter((rel) => rel.source === active.id || rel.target === active.id).slice(0, 4);

  return (
    <div className="page">
      <section className="atlas-hero section-band">
        <div className="atlas-hero__copy">
          <p className="eyebrow">Atlas</p>
          <h1>Chapter, concept, and symbol field</h1>
          <p className="lede">The missing Atlas becomes the canonical navigation map, joining the old Explore graph with Aion core data.</p>
        </div>

        <div className="atlas-layout atlas-layout--hero">
          <div className="atlas-map" aria-label="Aion chapter map">
            <div className="atlas-map__controls">
              <label htmlFor="atlas-search">Search</label>
              <input
                id="atlas-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="shadow, fish, quaternity"
              />
            </div>
            <div className="atlas-orbit">
              {filtered.map((chapter) => (
                <button
                  key={chapter.id}
                  className={chapter.id === selected ? 'atlas-node atlas-node--active' : 'atlas-node'}
                  type="button"
                  onClick={() => setSelected(chapter.id)}
                  style={{ ['--node-index' as string]: chapter.order - 1, ['--node-count' as string]: filtered.length }}
                  aria-label={`Select chapter ${chapter.order}: ${chapter.title}`}
                >
                  {chapter.order}
                </button>
              ))}
            </div>
          </div>

          <aside className="atlas-detail" aria-label="Selected atlas chapter">
            <ChapterSigil chapter={active} compact />
            <p className="eyebrow">Chapter {active.order}</p>
            <h2>{active.title}</h2>
            <p>{active.summary}</p>
            <div className="chip-row">
              {activeConcepts.map((concept) => (
                <span key={concept.id}>{concept.label}</span>
              ))}
            </div>
            <div className="atlas-detail__section">
              <h3>Symbols</h3>
              <p>{linkedSymbols.map((symbol) => symbol.label).join(' · ') || 'No direct symbol links yet.'}</p>
            </div>
            <div className="atlas-detail__section">
              <h3>Relations</h3>
              <p>{linkedRelationships.map((rel) => rel.relationType).join(' · ') || 'Chapter sequence relation.'}</p>
            </div>
            <Link className="button button--primary" to={getChapterRoute(active.id)}>
              Open chapter
            </Link>
          </aside>
        </div>
      </section>

      <section className="section-band">
        <div className="section-heading">
          <p className="eyebrow">Concept index</p>
          <h2>{concepts.length} canonical terms</h2>
        </div>
        <div className="concept-cloud">
          {concepts.map((concept) => (
            <span key={concept.id}>{concept.label}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
