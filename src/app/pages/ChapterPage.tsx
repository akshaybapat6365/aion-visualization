import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import ChapterSigil from '../components/ChapterSigil';
import SceneHost from '../components/SceneHost';
import {
  getAdjacentChapters,
  getChapterById,
  getChapterRoute,
  getConceptsForChapter,
  getLearningObjectsForChapter,
  normalizeChapterId,
} from '../data/aionData';
import type { ChapterRecord } from '../types';
import { CHAPTER_SCENES } from '../visualization/chapterScenes';

function useReducedMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean | null>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

export default function ChapterPage({ chapterId }: { chapterId: string }) {
  const normalized = normalizeChapterId(chapterId);
  const chapter = getChapterById(normalized);

  if (!chapter) {
    return null;
  }

  return <ChapterPageContent chapter={chapter} />;
}

function ChapterPageContent({ chapter }: { chapter: ChapterRecord }) {
  const reducedMotionPreference = useReducedMotionPreference();
  const reducedMotion = reducedMotionPreference !== false;
  const experience = CHAPTER_SCENES[chapter.id];
  const [activePanelId, setActivePanelId] = useState(experience.panels[0]?.id || '');
  const concepts = getConceptsForChapter(chapter.id);
  const learningObjects = getLearningObjectsForChapter(chapter.id);
  const adjacent = getAdjacentChapters(chapter.id);
  const activePanelIndex = Math.max(0, experience.panels.findIndex((panel) => panel.id === activePanelId));
  const panelProgress = experience.panels.length > 1 ? activePanelIndex / (experience.panels.length - 1) : 0;

  useEffect(() => {
    setActivePanelId(experience.panels[0]?.id || '');
  }, [chapter.id, experience.panels]);

  useEffect(() => {
    const panelElements = Array.from(document.querySelectorAll<HTMLElement>(`[data-chapter-panel="${chapter.id}"]`));
    if (panelElements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.getAttribute('data-panel-id');
        if (id) setActivePanelId(id);
      },
      { rootMargin: '-22% 0px -42% 0px', threshold: [0.25, 0.45, 0.65, 0.85] },
    );

    panelElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [chapter.id, experience.panels]);

  return (
    <article
      className="chapter-experience"
      data-chapter-id={chapter.id}
      data-motion-grammar={experience.motionGrammar}
      data-reduced-motion={reducedMotion}
    >
      <section className="chapter-stage" aria-label={`${chapter.title} visual stage`}>
        <SceneHost
          chapter={chapter}
          experience={experience}
          reducedMotion={reducedMotion}
          activePanelId={activePanelId}
          panelProgress={panelProgress}
        />
        <div className="chapter-stage__scrim" />
        <div className="chapter-stage__intro">
          <ChapterSigil chapter={chapter} />
          <p className="eyebrow">Chapter {chapter.order} · {chapter.cluster}</p>
          <h1>{chapter.title}</h1>
          <p>{chapter.summary}</p>
          <div className="chapter-stage__thesis-map" aria-label="Chapter visual sequence">
            {experience.panels.map((panel, index) => (
              <button
                key={panel.id}
                className={panel.id === activePanelId ? 'chapter-stage__thesis-node chapter-stage__thesis-node--active' : 'chapter-stage__thesis-node'}
                type="button"
                onClick={() => setActivePanelId(panel.id)}
                aria-pressed={panel.id === activePanelId}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {panel.kicker}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="chapter-panels" aria-label="Chapter learning panels">
        {experience.panels.map((panel, index) => (
          <div
            key={panel.id}
            id={`${chapter.id}-${panel.id}`}
            className={panel.id === activePanelId ? 'chapter-panel chapter-panel--active' : 'chapter-panel'}
            data-chapter-panel={chapter.id}
            data-panel-id={panel.id}
          >
            <div className="chapter-panel__symbol" aria-hidden="true">
              <span className="chapter-panel__ring chapter-panel__ring--outer" />
              <span className="chapter-panel__ring chapter-panel__ring--inner" />
              <span className="chapter-panel__axis chapter-panel__axis--vertical" />
              <span className="chapter-panel__axis chapter-panel__axis--horizontal" />
              <span className="chapter-panel__spark chapter-panel__spark--one" />
              <span className="chapter-panel__spark chapter-panel__spark--two" />
            </div>
            <div className="chapter-panel__copy">
              <span className="chapter-panel__count">{String(index + 1).padStart(2, '0')}</span>
              <p className="eyebrow">{panel.kicker}</p>
              <h2>{panel.title}</h2>
              <p>{panel.body}</p>
              <strong>{panel.insight}</strong>
            </div>
          </div>
        ))}
      </section>

      <section className="chapter-knowledge section-band">
        <div className="chapter-knowledge__block">
          <p className="eyebrow">Core terms</p>
          <h2>Concept anchors</h2>
          <div className="term-stack">
            {concepts.map((concept) => (
              <details key={concept.id}>
                <summary>{concept.label}</summary>
                <p>{concept.definition}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="chapter-knowledge__block">
          <p className="eyebrow">Checkpoints</p>
          <h2>Insight checks</h2>
          <ol className="checkpoint-list">
            {experience.checkpoints.map((checkpoint) => (
              <li key={checkpoint}>{checkpoint}</li>
            ))}
          </ol>
          <div className="reflection-box">
            <h3>{learningObjects[1]?.title || 'Reflection'}</h3>
            <p>{learningObjects[1]?.prompt || 'Hold one concept beside its opposite and note what changes.'}</p>
          </div>
        </div>
      </section>

      <nav className="chapter-next section-band section-band--tight" aria-label="Chapter sequence">
        {adjacent.previous ? (
          <Link to={getChapterRoute(adjacent.previous.id)} className="sequence-link">
            <span>Previous</span>
            <strong>{adjacent.previous.title}</strong>
          </Link>
        ) : (
          <span />
        )}
        {adjacent.next ? (
          <Link to={getChapterRoute(adjacent.next.id)} className="sequence-link sequence-link--next">
            <span>Next</span>
            <strong>{adjacent.next.title}</strong>
          </Link>
        ) : (
          <Link to="/atlas" className="sequence-link sequence-link--next">
            <span>Return</span>
            <strong>Atlas</strong>
          </Link>
        )}
      </nav>
    </article>
  );
}
