import { useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';

import ChapterSigil from '../components/ChapterSigil';
import { getChapterRoute, getChapters, getConceptsForChapter } from '../data/aionData';
import { CHAPTER_SCENES } from '../visualization/chapterScenes';
import './ChaptersPage.css';
import './ChaptersPageSequence.css';
import './ChaptersPageResponsive.css';

const motionLabels = {
  opposition: 'Opposition',
  integration: 'Integration',
  transformation: 'Transformation',
  'cyclical-return': 'Cyclical return',
} as const;

const motionNotes = {
  opposition: 'The chapter teaches through tension, mirror, and excluded counter-image.',
  integration: 'The chapter teaches by holding separated symbolic fields in relation.',
  transformation: 'The chapter teaches through staged change, vessel, strata, and symbolic pressure.',
  'cyclical-return': 'The chapter teaches through mandala, orbit, recurrence, and return.',
} as const;

const clusterNotes: Record<string, string> = {
  Identity: 'Ego and shadow establish the starting tension of conscious life.',
  'Relational Psyche': 'Inner figures make relation to the unconscious visible.',
  Selfhood: 'The Self appears through mandala, Christ-symbol, and the excluded fourth.',
  'Aeon & Fish': 'Fish, prophecy, and historical anxiety turn time into symbolic weather.',
  Alchemy: 'The opus gives transformation a vessel, method, and symbolic language.',
  Gnosis: 'Gnostic images turn fullness, fall, wisdom, and paradox into a cosmic diagram.',
  Synthesis: 'The final chapter gathers the arc into one dynamic Self-field.',
};

export default function ChaptersPage() {
  const chapters = getChapters();
  const [selectedId, setSelectedId] = useState(chapters[0].id);
  const selected = chapters.find((chapter) => chapter.id === selectedId) || chapters[0];
  const selectedConcepts = getConceptsForChapter(selected.id);
  const selectedScene = CHAPTER_SCENES[selected.id];
  const selectedPanel = selectedScene.panels[0];
  const chapterArcs = chapters.reduce<Array<{ cluster: string; chapters: typeof chapters }>>((arcs, chapter) => {
    const existing = arcs.find((arc) => arc.cluster === chapter.cluster);
    if (existing) {
      existing.chapters.push(chapter);
      return arcs;
    }
    arcs.push({ cluster: chapter.cluster, chapters: [chapter] });
    return arcs;
  }, []);
  const selectedArc = chapterArcs.find((arc) => arc.cluster === selected.cluster) || chapterArcs[0];
  const selectedArcIndex = selectedArc.chapters.findIndex((chapter) => chapter.id === selected.id) + 1;
  const selectedChapterIndex = chapters.findIndex((chapter) => chapter.id === selected.id);

  function selectByIndex(index: number) {
    const nextIndex = (index + chapters.length) % chapters.length;
    const nextChapter = chapters[nextIndex];
    setSelectedId(nextChapter.id);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-chapter-orbit-node="${nextChapter.id}"]`)?.focus();
    });
  }

  function handleOrbitKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextKeyMap: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: chapters.length - 1,
    };
    const nextIndex = nextKeyMap[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    selectByIndex(nextIndex);
  }

  return (
    <div className="page page--chapters">
      <section className="chapters-hero section-band">
        <div className="chapters-hero__copy">
          <p className="eyebrow">Complete route</p>
          <h1>Fourteen chapters as one psyche arc</h1>
          <p className="lede">Aion moves from the small light of ego through shadow, symbolic history, alchemy, Gnosis, and the final dynamics of the Self.</p>
          <div className="chapters-hero__metrics" aria-label="Chapter route metrics">
            <span>
              <strong>{chapters.length}</strong>
              <small>Chapters</small>
            </span>
            <span>
              <strong>{chapterArcs.length}</strong>
              <small>Arcs</small>
            </span>
            <span>
              <strong>{selected.order}</strong>
              <small>Selected</small>
            </span>
          </div>
          <div className="hero-actions" aria-label="Chapter actions">
            <Link className="button button--primary chapters-action" to={getChapterRoute(selected.id)}>
              <span>Enter selected chapter</span>
              <span className="chapters-action__puck" aria-hidden="true">→</span>
            </Link>
            <Link className="button button--ghost" to="/atlas">
              Open Atlas
            </Link>
          </div>
        </div>

        <div className="chapters-stage" role="group" aria-label="Interactive chapter arc hub">
          <div className="chapters-arc-map" role="group" aria-label="Book arc clusters">
            {chapterArcs.map((arc, index) => {
              const firstChapter = arc.chapters[0];
              const lastChapter = arc.chapters[arc.chapters.length - 1];
              const active = arc.cluster === selected.cluster;
              return (
                <button
                  key={arc.cluster}
                  className={active ? 'chapters-arc-map__cluster chapters-arc-map__cluster--active' : 'chapters-arc-map__cluster'}
                  type="button"
                  style={{
                    ['--arc-index' as string]: index,
                    ['--arc-count' as string]: chapterArcs.length,
                  }}
                  aria-pressed={active}
                  aria-controls="chapters-selected-detail"
                  onClick={() => setSelectedId(firstChapter.id)}
                >
                  <span>{arc.cluster}</span>
                  <strong>{String(firstChapter.order).padStart(2, '0')}–{String(lastChapter.order).padStart(2, '0')}</strong>
                </button>
              );
            })}
          </div>

          <div className="chapters-orbit" role="group" aria-label="Interactive chapter orbit" data-selected-order={selected.order}>
            <div className="chapters-orbit__rings" aria-hidden="true" />
            <div className="chapters-orbit__axis chapters-orbit__axis--vertical" aria-hidden="true" />
            <div className="chapters-orbit__axis chapters-orbit__axis--horizontal" aria-hidden="true" />
            <div id="chapters-orbit-detail" className="chapters-orbit__center" aria-hidden="true">
              <ChapterSigil chapter={selected} compact />
              <span>Chapter {selected.order} · {selected.cluster}</span>
              <strong>{selected.title}</strong>
              <p>{motionLabels[selectedScene.motionGrammar]}</p>
            </div>
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                className={chapter.id === selected.id ? 'chapters-orbit__node chapters-orbit__node--active' : 'chapters-orbit__node'}
                type="button"
                onClick={() => setSelectedId(chapter.id)}
                onKeyDown={(event) => handleOrbitKeyDown(event, index)}
                data-chapter-orbit-node={chapter.id}
                style={{ ['--node-index' as string]: chapter.order - 1, ['--node-count' as string]: chapters.length }}
                aria-controls="chapters-selected-detail"
                aria-label={`Preview chapter ${chapter.order}: ${chapter.title}`}
                aria-pressed={chapter.id === selected.id}
              >
                {String(chapter.order).padStart(2, '0')}
              </button>
            ))}
            <div className="chapters-orbit__concepts" role="group" aria-label="Selected chapter concepts">
              {selectedConcepts.map((concept) => (
                <span key={concept.id}>{concept.label}</span>
              ))}
            </div>
          </div>

          <aside
            id="chapters-selected-detail"
            className="chapters-selected-panel"
            aria-live="polite"
            aria-atomic="true"
            data-selected-chapter={selected.id}
            data-motion-grammar={selectedScene.motionGrammar}
          >
            <div className="chapters-selected-panel__kicker">
              <span>{selected.cluster}</span>
              <span>{selectedArcIndex} of {selectedArc.chapters.length} in arc</span>
            </div>
            <h2>{selected.title}</h2>
            <p>{selected.summary}</p>
            <div className="chapters-selected-panel__motion">
              <span>{motionLabels[selectedScene.motionGrammar]}</span>
              <strong>{selectedScene.visualTheme}</strong>
              <p>{motionNotes[selectedScene.motionGrammar]}</p>
            </div>
            <div className="chapters-selected-panel__insight">
              <span>{selectedPanel.kicker}</span>
              <strong>{selectedPanel.title}</strong>
              <p>{selectedPanel.insight}</p>
            </div>
            <ul className="chapters-selected-panel__checkpoints" aria-label="Selected chapter checkpoints">
              {selectedScene.checkpoints.map((checkpoint) => (
                <li key={checkpoint}>{checkpoint}</li>
              ))}
            </ul>
            <Link className="chapters-selected-panel__link" to={getChapterRoute(selected.id)}>
              Open Chapter {selected.order}
              <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>

      <section className="chapter-sequence section-band section-band--tight" aria-label="Chapter sequence">
        <div className="chapter-sequence__intro">
          <p className="eyebrow">Guided sequence</p>
          <h2>Read the route as a changing symbolic field</h2>
          <p>{clusterNotes[selected.cluster]}</p>
        </div>
        <div className="chapter-sequence__grid">
          {chapters.map((chapter) => {
            const scene = CHAPTER_SCENES[chapter.id];
            return (
              <Link
                key={chapter.id}
                to={getChapterRoute(chapter.id)}
                className={chapter.id === selected.id ? 'chapter-card chapter-card--active' : 'chapter-card'}
                data-chapter-id={chapter.id}
                data-motion-grammar={scene.motionGrammar}
                aria-current={chapter.id === selected.id ? 'true' : undefined}
              >
                <ChapterSigil chapter={chapter} compact />
                <div className="chapter-card__body">
                  <span>{String(chapter.order).padStart(2, '0')} · {chapter.cluster}</span>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.summary}</p>
                  <div className="chapter-card__theme">
                    <span>{motionLabels[scene.motionGrammar]}</span>
                    <strong>{scene.visualTheme}</strong>
                  </div>
                  <div className="chip-row" aria-label="Key concepts">
                    {getConceptsForChapter(chapter.id).map((concept) => (
                      <span key={concept.id}>{concept.label}</span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="chapters-progress" aria-label="Selected chapter position">
          <span style={{ ['--progress' as string]: `${(selectedChapterIndex / (chapters.length - 1)) * 100}%` }} />
          <strong>Chapter {selected.order} / {chapters.length}</strong>
          <small>{selected.cluster}</small>
        </div>
      </section>
    </div>
  );
}
