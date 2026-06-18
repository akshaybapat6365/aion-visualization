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

const quaternityDirections = ['north', 'east', 'south', 'west'] as const;
const mandalaBands = ['outer', 'middle', 'inner'] as const;
const rootLines = ['left', 'center', 'right'] as const;

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
  const activePanel = experience.panels[activePanelIndex] || experience.panels[0];

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
          {chapter.id === 'ch2' && (
            <div
              className="shadow-projection-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label="Shadow projection model: the ego stands before a mirror, casts refused material outward as a shadow, and begins returning it through integration."
            >
              <span className="shadow-projection-instrument__vessel" aria-hidden="true" />
              <span className="shadow-projection-instrument__mirror" aria-hidden="true" />
              <span className="shadow-projection-instrument__ego" aria-hidden="true" />
              <span className="shadow-projection-instrument__shadow" aria-hidden="true" />
              <span className="shadow-projection-instrument__arc shadow-projection-instrument__arc--projection" aria-hidden="true" />
              <span className="shadow-projection-instrument__arc shadow-projection-instrument__arc--return" aria-hidden="true" />
              <span className="shadow-projection-instrument__bridge" aria-hidden="true" />
              <span className="shadow-projection-instrument__label shadow-projection-instrument__label--ego" aria-hidden="true">ego</span>
              <span className="shadow-projection-instrument__label shadow-projection-instrument__label--mirror" aria-hidden="true">mirror</span>
              <span className="shadow-projection-instrument__label shadow-projection-instrument__label--shadow" aria-hidden="true">shadow</span>
              <span className="shadow-projection-instrument__label shadow-projection-instrument__label--projection" aria-hidden="true">projection</span>
              <span className="shadow-projection-instrument__label shadow-projection-instrument__label--return" aria-hidden="true">return</span>
            </div>
          )}
          {chapter.id === 'ch3' && (
            <div
              className="syzygy-relation-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label="Syzygy relation model: anima and animus appear as symbolic poles, projection arcs outward and returns into orbit, and conjunction forms a brief shared field without erasing the pair."
            >
              <span className="syzygy-relation-instrument__axis" aria-hidden="true" />
              <span className="syzygy-relation-instrument__orbit syzygy-relation-instrument__orbit--outer" aria-hidden="true" />
              <span className="syzygy-relation-instrument__orbit syzygy-relation-instrument__orbit--inner" aria-hidden="true" />
              <span className="syzygy-relation-instrument__field syzygy-relation-instrument__field--upper" aria-hidden="true" />
              <span className="syzygy-relation-instrument__field syzygy-relation-instrument__field--lower" aria-hidden="true" />
              <span className="syzygy-relation-instrument__projection syzygy-relation-instrument__projection--outward" aria-hidden="true" />
              <span className="syzygy-relation-instrument__projection syzygy-relation-instrument__projection--return" aria-hidden="true" />
              <span className="syzygy-relation-instrument__mandorla" aria-hidden="true" />
              <span className="syzygy-relation-instrument__conjunction-core" aria-hidden="true" />
              <span className="syzygy-relation-instrument__pole syzygy-relation-instrument__pole--anima" aria-hidden="true" />
              <span className="syzygy-relation-instrument__pole syzygy-relation-instrument__pole--animus" aria-hidden="true" />
              <span className="syzygy-relation-instrument__label syzygy-relation-instrument__label--anima" aria-hidden="true">anima</span>
              <span className="syzygy-relation-instrument__label syzygy-relation-instrument__label--animus" aria-hidden="true">animus</span>
              <span className="syzygy-relation-instrument__label syzygy-relation-instrument__label--orbit" aria-hidden="true">orbit</span>
              <span className="syzygy-relation-instrument__label syzygy-relation-instrument__label--conjunction" aria-hidden="true">conjunction</span>
            </div>
          )}
          {chapter.id === 'ch4' && (
            <div
              className="self-mandala-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label="Self mandala model: a small center opens into a wider totality, four directions make wholeness readable, and concentric mandala rings order conflict without flattening difference."
            >
              <span className="self-mandala-instrument__ring self-mandala-instrument__ring--outer" aria-hidden="true" />
              <span className="self-mandala-instrument__ring self-mandala-instrument__ring--middle" aria-hidden="true" />
              <span className="self-mandala-instrument__ring self-mandala-instrument__ring--inner" aria-hidden="true" />
              <span className="self-mandala-instrument__axis self-mandala-instrument__axis--vertical" aria-hidden="true" />
              <span className="self-mandala-instrument__axis self-mandala-instrument__axis--horizontal" aria-hidden="true" />
              {quaternityDirections.map((direction) => (
                <span key={direction} className={`self-mandala-instrument__point self-mandala-instrument__point--${direction}`} aria-hidden="true" />
              ))}
              <span className="self-mandala-instrument__center" aria-hidden="true" />
              <span className="self-mandala-instrument__label self-mandala-instrument__label--center" aria-hidden="true">center</span>
              <span className="self-mandala-instrument__label self-mandala-instrument__label--fourfold" aria-hidden="true">fourfold</span>
              <span className="self-mandala-instrument__label self-mandala-instrument__label--mandala" aria-hidden="true">mandala</span>
            </div>
          )}
          <div className="chapter-stage__thesis-map" aria-label="Chapter visual sequence">
            {experience.panels.map((panel, index) => (
              <button
                key={panel.id}
                className={panel.id === activePanelId ? 'chapter-stage__thesis-node chapter-stage__thesis-node--active' : 'chapter-stage__thesis-node'}
                type="button"
                onClick={() => setActivePanelId(panel.id)}
                aria-pressed={panel.id === activePanelId}
                aria-controls={`${chapter.id}-${panel.id}`}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {panel.kicker}
              </button>
            ))}
          </div>
          <div className="chapter-stage__reference-map" aria-label={`${chapter.title} visual reference`} role="group">
            {experience.panels.map((panel, index) => (
              <button
                key={panel.id}
                className={panel.id === activePanelId ? 'chapter-stage__reference-node chapter-stage__reference-node--active' : 'chapter-stage__reference-node'}
                type="button"
                onClick={() => setActivePanelId(panel.id)}
                aria-pressed={panel.id === activePanelId}
                aria-controls={`${chapter.id}-${panel.id}`}
                aria-label={`Show ${panel.title}: ${panel.insight}`}
                data-panel-id={panel.id}
              >
                <span className="chapter-stage__reference-mark" aria-hidden="true">
                  {quaternityDirections.map((direction) => (
                    <span key={direction} className={`chapter-stage__reference-quadrant chapter-stage__reference-quadrant--${direction}`} />
                  ))}
                </span>
                <span className="chapter-stage__reference-label">{String(index + 1).padStart(2, '0')} {panel.kicker}</span>
              </button>
            ))}
          </div>
          {chapter.id === 'ch1' && (
            <div
              className="ego-depth-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label="Ego depth model: the conscious ego shines at the surface, somatic and psychic roots descend, and the Self holds the wider field below."
            >
              <span className="ego-depth-instrument__axis" aria-hidden="true" />
              <span className="ego-depth-instrument__surface" aria-hidden="true" />
              <span className="ego-depth-instrument__ego" aria-hidden="true" />
              <span className="ego-depth-instrument__root ego-depth-instrument__root--somatic" aria-hidden="true" />
              <span className="ego-depth-instrument__root ego-depth-instrument__root--psychic" aria-hidden="true" />
              <span className="ego-depth-instrument__wake ego-depth-instrument__wake--one" aria-hidden="true" />
              <span className="ego-depth-instrument__wake ego-depth-instrument__wake--two" aria-hidden="true" />
              <span className="ego-depth-instrument__self" aria-hidden="true" />
              <span className="ego-depth-instrument__label ego-depth-instrument__label--ego" aria-hidden="true">ego</span>
              <span className="ego-depth-instrument__label ego-depth-instrument__label--roots" aria-hidden="true">roots</span>
              <span className="ego-depth-instrument__label ego-depth-instrument__label--self" aria-hidden="true">Self</span>
            </div>
          )}
          {activePanel && (
            <p className="sr-only" role="status" aria-live="polite">
              Active scene state: {activePanel.title}. {activePanel.insight}
            </p>
          )}
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
            role="region"
            aria-labelledby={`${chapter.id}-${panel.id}-title`}
          >
            <div className="chapter-panel__symbol" aria-hidden="true">
              <span className="chapter-panel__ring chapter-panel__ring--outer" />
              <span className="chapter-panel__ring chapter-panel__ring--inner" />
              <span className="chapter-panel__axis chapter-panel__axis--vertical" />
              <span className="chapter-panel__axis chapter-panel__axis--horizontal" />
              <span className="chapter-panel__spark chapter-panel__spark--one" />
              <span className="chapter-panel__spark chapter-panel__spark--two" />
              <span className="chapter-panel__depth chapter-panel__depth--one" />
              <span className="chapter-panel__depth chapter-panel__depth--two" />
              {quaternityDirections.map((direction) => (
                <span key={direction} className={`chapter-panel__quaternity-point chapter-panel__quaternity-point--${direction}`} />
              ))}
              {mandalaBands.map((band) => (
                <span key={band} className={`chapter-panel__mandala-band chapter-panel__mandala-band--${band}`} />
              ))}
              {rootLines.map((line) => (
                <span key={line} className={`chapter-panel__root-line chapter-panel__root-line--${line}`} />
              ))}
            </div>
            <div className="chapter-panel__copy">
              <span className="chapter-panel__count">{String(index + 1).padStart(2, '0')}</span>
              <p className="eyebrow">{panel.kicker}</p>
              <h2 id={`${chapter.id}-${panel.id}-title`}>{panel.title}</h2>
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
