import { useState } from 'react';
import { Link } from 'react-router';

import ChapterSigil from '../components/ChapterSigil';
import { getChapterRoute, getChapters, getConceptsForChapter } from '../data/aionData';
import { CHAPTER_SCENES } from '../visualization/chapterScenes';

export default function ChaptersPage() {
  const chapters = getChapters();
  const [selectedId, setSelectedId] = useState(chapters[0].id);
  const selected = chapters.find((chapter) => chapter.id === selectedId) || chapters[0];
  const selectedConcepts = getConceptsForChapter(selected.id);
  const selectedScene = CHAPTER_SCENES[selected.id];

  return (
    <div className="page page--chapters">
      <section className="chapters-hero section-band">
        <div className="chapters-hero__copy">
          <p className="eyebrow">Complete route</p>
          <h1>Fourteen chapters as visual instruments</h1>
          <p className="lede">Aion moves from the small light of ego through shadow, symbolic history, alchemy, Gnosis, and the final dynamics of the Self.</p>
          <div className="hero-actions" aria-label="Chapter actions">
            <Link className="button button--primary" to={getChapterRoute(selected.id)}>
              Enter selected chapter
            </Link>
            <Link className="button button--ghost" to="/atlas">
              Open Atlas
            </Link>
          </div>
        </div>

        <div className="chapters-orbit" aria-label="Interactive chapter orbit">
          <div className="chapters-orbit__rings" aria-hidden="true" />
          <div id="chapters-selected-detail" className="chapters-orbit__center" aria-live="polite">
            <ChapterSigil chapter={selected} compact />
            <span>Chapter {selected.order}</span>
            <strong>{selected.title}</strong>
            <p>{selectedScene.visualTheme}</p>
          </div>
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              className={chapter.id === selected.id ? 'chapters-orbit__node chapters-orbit__node--active' : 'chapters-orbit__node'}
              type="button"
              onClick={() => setSelectedId(chapter.id)}
              style={{ ['--node-index' as string]: chapter.order - 1, ['--node-count' as string]: chapters.length }}
              aria-controls="chapters-selected-detail"
              aria-label={`Preview chapter ${chapter.order}: ${chapter.title}`}
              aria-pressed={chapter.id === selected.id}
            >
              {String(chapter.order).padStart(2, '0')}
            </button>
          ))}
          <div className="chapters-orbit__concepts" aria-label="Selected chapter concepts">
            {selectedConcepts.map((concept) => (
              <span key={concept.id}>{concept.label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="chapter-sequence section-band section-band--tight" aria-label="Chapter sequence">
        {chapters.map((chapter) => (
          <Link key={chapter.id} to={getChapterRoute(chapter.id)} className="chapter-card">
            <ChapterSigil chapter={chapter} compact />
            <div>
              <span>{String(chapter.order).padStart(2, '0')} · {chapter.cluster}</span>
              <h2>{chapter.title}</h2>
              <div className="chip-row" aria-label="Key concepts">
                {getConceptsForChapter(chapter.id).map((concept) => (
                  <span key={concept.id}>{concept.label}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
