import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import AtlasConstellation from '../components/AtlasConstellation';
import ChapterSigil from '../components/ChapterSigil';
import {
  getChapterRoute,
  getChapters,
  getConcepts,
  getConceptsForChapter,
  getLearningObjectsForChapter,
  getRelationships,
  getSymbols,
} from '../data/aionData';
import type { ChapterRecord } from '../types';

export default function AtlasPage() {
  const chapters = getChapters();
  const concepts = getConcepts();
  const symbols = getSymbols();
  const relationships = getRelationships();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ChapterRecord['id']>(chapters[0].id);

  const entityLabel = useMemo(() => (id: string) => (
    concepts.find((concept) => concept.id === id)?.label
    || symbols.find((symbol) => symbol.id === id)?.label
    || chapters.find((chapter) => chapter.id === id)?.title
    || id
  ), [chapters, concepts, symbols]);

  const getChapterSearchText = (chapter: ChapterRecord) => {
    const chapterConcepts = getConceptsForChapter(chapter.id);
    const chapterSymbols = symbols.filter((symbol) => symbol.conceptIds.some((id) => chapter.keyConceptIds.includes(id)));
    const chapterEntityIds = new Set([
      chapter.id,
      ...chapter.keyConceptIds,
      ...chapter.relatedChapterIds,
      ...chapterSymbols.map((symbol) => symbol.id),
    ]);
    const chapterRelationships = relationships.filter((relationship) => (
      chapterEntityIds.has(relationship.source) || chapterEntityIds.has(relationship.target)
    ));
    const learningObjects = getLearningObjectsForChapter(chapter.id);
    const relatedChapterTitles = chapter.relatedChapterIds
      .map((id) => chapters.find((item) => item.id === id)?.title)
      .filter(Boolean);

    return [
      chapter.order,
      chapter.title,
      chapter.summary,
      chapter.cluster,
      ...relatedChapterTitles,
      ...chapterConcepts.flatMap((concept) => [
        concept.label,
        concept.definition,
        concept.difficulty,
        ...concept.prerequisites.map(entityLabel),
      ]),
      ...chapterSymbols.flatMap((symbol) => [symbol.label, symbol.motif, symbol.historicPeriod]),
      ...chapterRelationships.flatMap((relationship) => [
        entityLabel(relationship.source),
        entityLabel(relationship.target),
        relationship.relationType.replaceAll('_', ' '),
        relationship.narrativeNotes,
      ]),
      ...learningObjects.flatMap((item) => [item.title, item.prompt, item.type]),
    ].join(' ');
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter((chapter) => getChapterSearchText(chapter).toLowerCase().includes(q));
  }, [chapters, query]);

  const hasNoSearchMatches = query.trim().length > 0 && filtered.length === 0;

  useEffect(() => {
    if (hasNoSearchMatches || filtered.some((chapter) => chapter.id === selected)) return;
    setSelected(filtered[0].id);
  }, [filtered, hasNoSearchMatches, selected]);

  const selectedChapter = chapters.find((chapter) => chapter.id === selected) || chapters[0];
  const active = hasNoSearchMatches
    ? null
    : filtered.find((chapter) => chapter.id === selected) || (query.trim() ? filtered[0] : null) || selectedChapter;
  const detailChapter = active || selectedChapter;
  const activeConcepts = active ? getConceptsForChapter(active.id) : [];
  const linkedSymbols = active ? symbols.filter((symbol) => symbol.conceptIds.some((id) => active.keyConceptIds.includes(id))) : [];
  const relationshipEntityIds = new Set([
    ...(active ? [active.id] : []),
    ...(active?.keyConceptIds || []),
    ...linkedSymbols.map((symbol) => symbol.id),
  ]);
  const linkedRelationships = relationships
    .filter((rel) => relationshipEntityIds.has(rel.source) || relationshipEntityIds.has(rel.target))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);
  const chapterResultText = `${filtered.length} chapter${filtered.length === 1 ? '' : 's'} in view`;

  return (
    <div className="page">
      <section className="atlas-hero section-band" aria-labelledby="atlas-title">
        <div className="atlas-hero__copy">
          <p className="eyebrow">Atlas</p>
          <h1 id="atlas-title">Chapter, concept, and symbol field</h1>
          <p className="lede">Search the symbolic field. Each selection redraws the chapter at the center, its concepts on the inner ring, and its symbols at the perimeter.</p>
        </div>

        <div className="atlas-layout atlas-layout--hero">
          <section className="atlas-map" aria-labelledby="atlas-map-title">
            <div className="atlas-map__controls">
              <div>
                <p className="eyebrow">Field Filter</p>
                <h2 id="atlas-map-title">Living Atlas Field</h2>
              </div>
              <input
                id="atlas-search"
                name="atlas-search"
                type="search"
                autoComplete="off"
                aria-label="Search Atlas field"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-describedby="atlas-search-status"
                placeholder="shadow, fish, quaternity…"
              />
              <output id="atlas-search-status" role="status" aria-live="polite">{chapterResultText}</output>
            </div>
            <AtlasConstellation
              active={active}
              activeConcepts={activeConcepts}
              filteredChapters={filtered}
              linkedRelationships={linkedRelationships}
              linkedSymbols={linkedSymbols}
              entityLabel={entityLabel}
              onSelectChapter={setSelected}
            />
          </section>

          <aside id="atlas-selected-detail" className="atlas-detail" aria-label="Selected atlas chapter" aria-live="polite">
            {hasNoSearchMatches ? (
              <div className="atlas-detail__empty">
                <p className="eyebrow">No Match</p>
                <h2>Nothing in the field</h2>
                <p>Try a chapter, concept, symbol, relation, or learning prompt such as shadow, fish, coniunctio, or mandala.</p>
                <button className="button button--primary" type="button" onClick={() => setQuery('')}>
                  Clear Search
                </button>
              </div>
            ) : (
              <>
                <ChapterSigil chapter={detailChapter} compact />
                <p className="eyebrow">Chapter {detailChapter.order}</p>
                <h2>{detailChapter.title}</h2>
                <p>{detailChapter.summary}</p>
                <div className="chip-row">
                  {activeConcepts.map((concept) => (
                    <button key={concept.id} type="button" onClick={() => setQuery(concept.label)} aria-label={`Filter Atlas by ${concept.label}`}>
                      {concept.label}
                    </button>
                  ))}
                </div>
                <div className="atlas-detail__section">
                  <h3>Symbols</h3>
                  <p>{linkedSymbols.map((symbol) => symbol.label).join(' · ') || 'No direct symbol links yet.'}</p>
                </div>
                <div className="atlas-detail__section">
                  <h3>Relations</h3>
                  {linkedRelationships.length > 0 ? (
                    <div className="relation-stack">
                      {linkedRelationships.map((rel) => (
                        <span key={rel.id}>
                          {entityLabel(rel.source)} <em>{rel.relationType.replaceAll('_', ' ')}</em> {entityLabel(rel.target)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>Direct relationships are still being curated for this chapter.</p>
                  )}
                </div>
                <Link className="button button--primary" to={getChapterRoute(detailChapter.id)}>
                  Open chapter
                </Link>
              </>
            )}
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
            <button key={concept.id} type="button" onClick={() => setQuery(concept.label)} aria-label={`Filter Atlas by ${concept.label}`}>
              {concept.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
