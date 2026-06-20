import { Link } from 'react-router';

import type { LearningPanel } from '../types';
import './AlchemyTransformationInstrument.css';

type AlchemyChapterId = 'ch10' | 'ch11';

const alchemyChapters = [
  { id: 'ch10', label: 'Vessel', route: '/journey/chapter/ch10' },
  { id: 'ch11', label: 'Mercurius', route: '/journey/chapter/ch11' },
] as const;

const alchemySteps = [
  { id: 'vessel', chapterId: 'ch10', panelId: 'vessel', label: 'Vessel', note: 'symbol enters' },
  { id: 'prima', chapterId: 'ch10', panelId: 'prima', label: 'Prima materia', note: 'mixed matter' },
  { id: 'mercurius', chapterId: 'ch11', panelId: 'mercurius', label: 'Mercurius', note: 'moving middle' },
  { id: 'lapis', chapterId: 'ch11', panelId: 'lapis', label: 'Lapis', note: 'formed paradox' },
] as const;

const chapterFocus: Record<AlchemyChapterId, string> = {
  ch10: 'The vessel contains symbolic pressure until the fish becomes transformation work.',
  ch11: 'Mercurius carries the same pressure upward into opus, mirror, and stone.',
};

export default function AlchemyTransformationInstrument({
  activePanel,
  activePanelId,
  chapterId,
  onSelectPanel,
}: {
  activePanel?: LearningPanel;
  activePanelId: string;
  chapterId: AlchemyChapterId;
  onSelectPanel: (panelId: string) => void;
}) {
  const activeChapter = alchemyChapters.find((chapter) => chapter.id === chapterId);
  const activeStep = alchemySteps.find((step) => step.chapterId === chapterId && step.panelId === activePanelId)
    || alchemySteps.find((step) => step.chapterId === chapterId)
    || alchemySteps[0];
  const emphasis = activePanel
    ? `${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`
    : `${activeStep.label}: ${activeStep.note}.`;

  return (
    <section
      className={`alchemy-transformation-instrument alchemy-transformation-instrument--${chapterId}`}
      data-active-panel={activeStep.id}
      data-alchemy-chapter={chapterId}
      role="group"
      aria-label={`Alchemy transformation bridge for Chapter ${chapterId === 'ch10' ? '10' : '11'}. Active focus: ${emphasis}`}
    >
      <div className="alchemy-transformation-instrument__header">
        <span>Alchemy bridge</span>
        <strong>{activeStep.label}</strong>
        <em>{activeStep.note}</em>
      </div>

      <div
        className="alchemy-transformation-instrument__field"
        role="img"
        aria-label={`Transformation field: vessel, prima materia, Mercurius, and lapis form one alchemical sequence. ${chapterFocus[chapterId]} Current emphasis: ${emphasis}`}
      >
        <span className="alchemy-transformation-instrument__horizon" aria-hidden="true" />
        <span className="alchemy-transformation-instrument__vessel" aria-hidden="true" />
        <span className="alchemy-transformation-instrument__bath" aria-hidden="true" />
        <span className="alchemy-transformation-instrument__fish" aria-hidden="true" />
        <span className="alchemy-transformation-instrument__prima" aria-hidden="true" />
        <span className="alchemy-transformation-instrument__axis" aria-hidden="true" />
        <span className="alchemy-transformation-instrument__serpent alchemy-transformation-instrument__serpent--gold" aria-hidden="true" />
        <span className="alchemy-transformation-instrument__serpent alchemy-transformation-instrument__serpent--cyan" aria-hidden="true" />
        <span className="alchemy-transformation-instrument__stone" aria-hidden="true" />
        <span className="alchemy-transformation-instrument__mirror" aria-hidden="true" />
        <span className="alchemy-transformation-instrument__path" aria-hidden="true">
          {alchemySteps.map((step, index) => (
            <span
              key={step.id}
              className={`alchemy-transformation-instrument__path-node alchemy-transformation-instrument__path-node--${step.id}`}
              style={{ ['--alchemy-step-index' as string]: index }}
            />
          ))}
        </span>
        <span className="alchemy-transformation-instrument__label alchemy-transformation-instrument__label--vessel" aria-hidden="true">vessel</span>
        <span className="alchemy-transformation-instrument__label alchemy-transformation-instrument__label--middle" aria-hidden="true">Mercurius</span>
        <span className="alchemy-transformation-instrument__label alchemy-transformation-instrument__label--stone" aria-hidden="true">lapis</span>
      </div>

      <nav className="alchemy-transformation-instrument__rail" aria-label="Alchemy chapter pair">
        {alchemyChapters.map((chapter) => (
          <Link
            key={chapter.id}
            className={chapter.id === chapterId ? 'alchemy-transformation-instrument__rail-link alchemy-transformation-instrument__rail-link--active' : 'alchemy-transformation-instrument__rail-link'}
            to={chapter.route}
            aria-current={chapter.id === chapterId ? 'page' : undefined}
          >
            <span>{chapter.id === 'ch10' ? '10' : '11'}</span>
            <strong>{chapter.label}</strong>
          </Link>
        ))}
      </nav>

      <ol className="alchemy-transformation-instrument__steps" aria-label={`${activeChapter?.label || 'Alchemy'} transformation sequence`}>
        {alchemySteps.map((step, index) => {
          const active = step.id === activeStep.id;
          const stepClassName = active
            ? 'alchemy-transformation-instrument__step alchemy-transformation-instrument__step--active'
            : 'alchemy-transformation-instrument__step';
          const stepContent = (
            <>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step.label}</strong>
            </>
          );
          return (
            <li key={step.id}>
              {step.chapterId === chapterId ? (
                <button
                  className={stepClassName}
                  type="button"
                  onClick={() => onSelectPanel(step.panelId)}
                  aria-controls={`${chapterId}-${step.panelId}`}
                  aria-current={active ? 'step' : undefined}
                  aria-pressed={active}
                >
                  {stepContent}
                </button>
              ) : (
                <Link
                  className={stepClassName}
                  to={`/journey/chapter/${step.chapterId}#${step.chapterId}-${step.panelId}`}
                  aria-current={active ? 'step' : undefined}
                >
                  {stepContent}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <p className="alchemy-transformation-instrument__readout" aria-live="polite" aria-atomic="true">
        {activePanel?.insight || chapterFocus[chapterId]}
      </p>
    </section>
  );
}
