import { Link } from 'react-router';

import type { LearningPanel } from '../types';
import './PsycheArcInstrument.css';

type PsycheArcChapterId = 'ch2' | 'ch3' | 'ch4';

const quaternityDirections = ['north', 'east', 'south', 'west'] as const;

const psycheArcChapters = [
  { id: 'ch2', label: 'Shadow', route: '/journey/chapter/ch2' },
  { id: 'ch3', label: 'Syzygy', route: '/journey/chapter/ch3' },
  { id: 'ch4', label: 'Self', route: '/journey/chapter/ch4' },
] as const;

const psycheArcSteps: Record<PsycheArcChapterId, Array<{
  id: string;
  label: string;
  measure: string;
  note: string;
}>> = {
  ch2: [
    { id: 'mirror', label: 'Mirror', measure: 'refused likeness', note: 'make it personal' },
    { id: 'projection', label: 'Projection', measure: 'outward arc', note: 'see the throw' },
    { id: 'integration', label: 'Return', measure: 'held tension', note: 'relate the dark' },
  ],
  ch3: [
    { id: 'pair', label: 'Pair', measure: 'living poles', note: 'do not fix them' },
    { id: 'orbit', label: 'Orbit', measure: 'relation field', note: 'keep tension moving' },
    { id: 'union', label: 'Conjunction', measure: 'brief mandorla', note: 'flash then release' },
  ],
  ch4: [
    { id: 'seed', label: 'Seed', measure: 'small center', note: 'quiet origin' },
    { id: 'quaternity', label: 'Fourfold', measure: 'ordered directions', note: 'structure appears' },
    { id: 'mandala', label: 'Mandala', measure: 'total image', note: 'hold difference' },
  ],
};

const psycheArcFieldLabels: Record<PsycheArcChapterId, string> = {
  ch2: 'Shadow projection model: the ego stands before a mirror, casts refused material outward as a shadow, and begins returning it through integration.',
  ch3: 'Syzygy relation model: anima and animus appear as symbolic poles, projection arcs outward and returns into orbit, and conjunction forms a brief shared field without erasing the pair.',
  ch4: 'Self mandala model: a small center opens into a wider totality, four directions make wholeness readable, and concentric mandala rings order conflict without flattening difference.',
};

export default function PsycheArcInstrument({
  activePanel,
  activePanelId,
  chapterId,
}: {
  activePanel?: LearningPanel;
  activePanelId: string;
  chapterId: PsycheArcChapterId;
}) {
  const steps = psycheArcSteps[chapterId];
  const currentStep = steps.find((step) => step.id === activePanelId) || steps[0];
  const activeChapter = psycheArcChapters.find((chapter) => chapter.id === chapterId);
  const emphasis = activePanel
    ? `${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`
    : `${currentStep.label}: ${currentStep.note}.`;
  const fieldLabel = `${psycheArcFieldLabels[chapterId]} Current emphasis: ${emphasis}`;

  return (
    <section
      className={`psyche-arc-instrument psyche-arc-instrument--${chapterId}`}
      data-active-panel={currentStep.id}
      data-arc-chapter={chapterId}
      role="group"
      aria-label={`Psyche arc instrument for ${activeChapter?.label}. Active focus: ${emphasis}`}
    >
      <div className="psyche-arc-instrument__header">
        <span>Psyche arc</span>
        <strong>{currentStep.label}</strong>
        <em>{currentStep.measure}</em>
      </div>

      {chapterId === 'ch2' && <ShadowProjectionField activePanelId={currentStep.id} label={fieldLabel} />}
      {chapterId === 'ch3' && <SyzygyRelationField activePanelId={currentStep.id} label={fieldLabel} />}
      {chapterId === 'ch4' && <SelfMandalaField activePanelId={currentStep.id} label={fieldLabel} />}

      <nav className="psyche-arc-instrument__rail" aria-label="Psyche arc chapter sequence">
        {psycheArcChapters.map((chapter, index) => (
          <Link
            key={chapter.id}
            className={chapter.id === chapterId ? 'psyche-arc-instrument__rail-link psyche-arc-instrument__rail-link--active' : 'psyche-arc-instrument__rail-link'}
            to={chapter.route}
            aria-current={chapter.id === chapterId ? 'page' : undefined}
            aria-label={`Open Chapter ${index + 2}: ${chapter.label}`}
          >
            <span>{String(index + 2).padStart(2, '0')}</span>
            <strong>{chapter.label}</strong>
          </Link>
        ))}
      </nav>

      <ol className="psyche-arc-instrument__scale" aria-label={`${activeChapter?.label} visual sequence`}>
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={step.id === currentStep.id ? 'psyche-arc-instrument__step psyche-arc-instrument__step--active' : 'psyche-arc-instrument__step'}
            aria-current={step.id === currentStep.id ? 'step' : undefined}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step.label}</strong>
            <em>{step.note}</em>
          </li>
        ))}
      </ol>

      <p className="psyche-arc-instrument__readout" aria-live="polite" aria-atomic="true">
        {activePanel?.insight || currentStep.note}
      </p>
    </section>
  );
}

function ShadowProjectionField({ activePanelId, label }: { activePanelId: string; label: string }) {
  return (
    <div
      className="shadow-projection-instrument psyche-arc-instrument__field"
      data-active-panel={activePanelId}
      role="img"
      aria-label={label}
    >
      <span className="shadow-projection-instrument__veil shadow-projection-instrument__veil--left" aria-hidden="true" />
      <span className="shadow-projection-instrument__veil shadow-projection-instrument__veil--right" aria-hidden="true" />
      <span className="shadow-projection-instrument__vessel" aria-hidden="true" />
      <span className="shadow-projection-instrument__mirror" aria-hidden="true" />
      <span className="shadow-projection-instrument__mirror-core" aria-hidden="true" />
      <span className="shadow-projection-instrument__mirror-glint shadow-projection-instrument__mirror-glint--one" aria-hidden="true" />
      <span className="shadow-projection-instrument__mirror-glint shadow-projection-instrument__mirror-glint--two" aria-hidden="true" />
      <span className="shadow-projection-instrument__persona" aria-hidden="true" />
      <span className="shadow-projection-instrument__ego" aria-hidden="true" />
      <span className="shadow-projection-instrument__shadow" aria-hidden="true" />
      <span className="shadow-projection-instrument__shadow-double" aria-hidden="true" />
      <span className="shadow-projection-instrument__arc shadow-projection-instrument__arc--projection" aria-hidden="true" />
      <span className="shadow-projection-instrument__arc shadow-projection-instrument__arc--return" aria-hidden="true" />
      <span className="shadow-projection-instrument__target shadow-projection-instrument__target--one" aria-hidden="true" />
      <span className="shadow-projection-instrument__target shadow-projection-instrument__target--two" aria-hidden="true" />
      <span className="shadow-projection-instrument__target shadow-projection-instrument__target--three" aria-hidden="true" />
      <span className="shadow-projection-instrument__bridge" aria-hidden="true" />
      <span className="shadow-projection-instrument__return-seed" aria-hidden="true" />
      <span className="shadow-projection-instrument__label shadow-projection-instrument__label--ego" aria-hidden="true">ego</span>
      <span className="shadow-projection-instrument__label shadow-projection-instrument__label--mirror" aria-hidden="true">mirror</span>
      <span className="shadow-projection-instrument__label shadow-projection-instrument__label--shadow" aria-hidden="true">shadow</span>
      <span className="shadow-projection-instrument__label shadow-projection-instrument__label--projection" aria-hidden="true">projection</span>
      <span className="shadow-projection-instrument__label shadow-projection-instrument__label--return" aria-hidden="true">return</span>
    </div>
  );
}

function SyzygyRelationField({ activePanelId, label }: { activePanelId: string; label: string }) {
  return (
    <div
      className="syzygy-relation-instrument psyche-arc-instrument__field"
      data-active-panel={activePanelId}
      role="img"
      aria-label={label}
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
  );
}

function SelfMandalaField({ activePanelId, label }: { activePanelId: string; label: string }) {
  return (
    <div
      className="self-mandala-instrument psyche-arc-instrument__field"
      data-active-panel={activePanelId}
      role="img"
      aria-label={label}
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
  );
}
