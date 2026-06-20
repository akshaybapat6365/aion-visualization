import type { LearningPanel } from '../types';
import './ChapterOneReferenceInstrument.css';

const referenceSteps = [
  {
    id: 'ego-light',
    label: 'Ego',
    measure: 'surface light',
    note: 'necessary center',
  },
  {
    id: 'roots',
    label: 'Roots',
    measure: 'somatic / psychic',
    note: 'two bases',
  },
  {
    id: 'self-depth',
    label: 'Self',
    measure: 'total field',
    note: 'larger whole',
  },
];

export default function ChapterOneReferenceInstrument({
  activePanel,
  activePanelId,
}: {
  activePanel?: LearningPanel;
  activePanelId: string;
}) {
  const currentStep = referenceSteps.find((step) => step.id === activePanelId) || referenceSteps[0];
  const emphasis = activePanel
    ? `${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`
    : `${currentStep.label}: ${currentStep.note}.`;

  return (
    <section
      className="chapter-one-reference"
      data-active-panel={currentStep.id}
      role="group"
      aria-label={`The Ego calibration instrument. Active focus: ${emphasis}`}
    >
      <div className="chapter-one-reference__header">
        <span>Calibration</span>
        <strong>{currentStep.label}</strong>
        <em>{currentStep.measure}</em>
      </div>
      <div
        className="ego-depth-instrument chapter-one-reference__field"
        data-active-panel={currentStep.id}
        role="img"
        aria-label={`Ego depth model: the conscious ego shines at the surface, somatic and psychic roots descend, and the Self holds the wider field below. Current emphasis: ${emphasis}`}
      >
        <span className="ego-depth-instrument__axis" aria-hidden="true" />
        <span className="ego-depth-instrument__surface" aria-hidden="true" />
        <span className="ego-depth-instrument__relation-bridge" aria-hidden="true" />
        <span className="ego-depth-instrument__orbit ego-depth-instrument__orbit--ego" aria-hidden="true" />
        <span className="ego-depth-instrument__orbit ego-depth-instrument__orbit--self" aria-hidden="true" />
        <span className="ego-depth-instrument__root-aura ego-depth-instrument__root-aura--somatic" aria-hidden="true" />
        <span className="ego-depth-instrument__root-aura ego-depth-instrument__root-aura--psychic" aria-hidden="true" />
        <span className="ego-depth-instrument__ego" aria-hidden="true" />
        <span className="ego-depth-instrument__root ego-depth-instrument__root--somatic" aria-hidden="true" />
        <span className="ego-depth-instrument__root ego-depth-instrument__root--psychic" aria-hidden="true" />
        <span className="ego-depth-instrument__wake ego-depth-instrument__wake--one" aria-hidden="true" />
        <span className="ego-depth-instrument__wake ego-depth-instrument__wake--two" aria-hidden="true" />
        <span className="ego-depth-instrument__self" aria-hidden="true" />
        <span className="ego-depth-instrument__label ego-depth-instrument__label--ego" aria-hidden="true">ego</span>
        <span className="ego-depth-instrument__label ego-depth-instrument__label--roots" aria-hidden="true">roots</span>
        <span className="ego-depth-instrument__label ego-depth-instrument__label--self" aria-hidden="true">Self</span>
        <span className="chapter-one-reference__calibration-line chapter-one-reference__calibration-line--surface" aria-hidden="true" />
        <span className="chapter-one-reference__calibration-line chapter-one-reference__calibration-line--depth" aria-hidden="true" />
      </div>
      <ol className="chapter-one-reference__scale" aria-label="Ego depth scale">
        {referenceSteps.map((step, index) => (
          <li
            key={step.id}
            className={step.id === currentStep.id ? 'chapter-one-reference__step chapter-one-reference__step--active' : 'chapter-one-reference__step'}
            aria-current={step.id === currentStep.id ? 'step' : undefined}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{step.label}</strong>
            <em>{step.note}</em>
          </li>
        ))}
      </ol>
      <p className="chapter-one-reference__readout" aria-live="polite" aria-atomic="true">
        {activePanel?.insight || currentStep.note}
      </p>
    </section>
  );
}
