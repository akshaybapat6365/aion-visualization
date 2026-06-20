import type { LearningPanel } from '../types';
import './ChapterSevenProphecyInstrument.css';
import './ChapterSevenProphecyField.css';

const prophecyTicks = ['0', '1000', '1555', '2000'] as const;

const prophecySteps = [
  { id: 'prophecy', index: '01', label: 'Prophecy', note: 'pressure gathers' },
  { id: 'collective', index: '02', label: 'Collective', note: 'image spreads' },
  { id: 'threshold', index: '03', label: 'Threshold', note: 'future mirrors' },
] as const;

export default function ChapterSevenProphecyInstrument({
  activePanel,
  activePanelId,
}: {
  activePanel?: LearningPanel;
  activePanelId: string;
}) {
  const currentStep = prophecySteps.find((step) => step.id === activePanelId) || prophecySteps[0];
  const emphasis = activePanel
    ? `${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`
    : `${currentStep.label}: ${currentStep.note}.`;

  return (
    <section
      className="chapter-seven-prophecy"
      data-active-panel={currentStep.id}
      role="group"
      aria-label={`Chapter 7 prophecy field instrument. Active focus: ${emphasis}`}
    >
      <div className="chapter-seven-prophecy__header">
        <span>Pressure chamber</span>
        <strong>{currentStep.label}</strong>
        <em>{currentStep.note}</em>
      </div>

      <div
        className="prophecy-field-instrument chapter-seven-prophecy__field"
        data-active-panel={activePanelId}
        role="img"
        aria-label={`Prophecy field model: historical pressure gathers around a time axis, private fear projects into a shared symbolic image-field, and the threshold mirror shows the future looking backward into older archetypal forms. Current emphasis: ${emphasis}`}
      >
        <span className="chapter-seven-prophecy__grain" aria-hidden="true" />
        <span className="chapter-seven-prophecy__chamber" aria-hidden="true" />
        <span className="chapter-seven-prophecy__wave chapter-seven-prophecy__wave--one" aria-hidden="true" />
        <span className="chapter-seven-prophecy__wave chapter-seven-prophecy__wave--two" aria-hidden="true" />
        <span className="chapter-seven-prophecy__signal chapter-seven-prophecy__signal--past" aria-hidden="true" />
        <span className="chapter-seven-prophecy__signal chapter-seven-prophecy__signal--future" aria-hidden="true" />
        <span className="chapter-seven-prophecy__constellation" aria-hidden="true" />
        <span className="chapter-seven-prophecy__lens" aria-hidden="true" />

        <span className="prophecy-field-instrument__field prophecy-field-instrument__field--past" aria-hidden="true" />
        <span className="prophecy-field-instrument__field prophecy-field-instrument__field--future" aria-hidden="true" />
        <span className="prophecy-field-instrument__axis" aria-hidden="true" />
        {prophecyTicks.map((tick, index) => (
          <span
            key={tick}
            className={`prophecy-field-instrument__tick prophecy-field-instrument__tick--${index + 1}`}
            aria-hidden="true"
          >
            {tick}
          </span>
        ))}
        <span className="prophecy-field-instrument__pressure" aria-hidden="true" />
        <span className="prophecy-field-instrument__date" aria-hidden="true" />
        <span className="prophecy-field-instrument__image prophecy-field-instrument__image--one" aria-hidden="true" />
        <span className="prophecy-field-instrument__image prophecy-field-instrument__image--two" aria-hidden="true" />
        <span className="prophecy-field-instrument__image prophecy-field-instrument__image--three" aria-hidden="true" />
        <span className="prophecy-field-instrument__arc prophecy-field-instrument__arc--projection" aria-hidden="true" />
        <span className="prophecy-field-instrument__arc prophecy-field-instrument__arc--return" aria-hidden="true" />
        <span className="prophecy-field-instrument__threshold" aria-hidden="true" />
        <span className="prophecy-field-instrument__mirror" aria-hidden="true" />
        <span className="prophecy-field-instrument__label prophecy-field-instrument__label--pressure" aria-hidden="true">pressure</span>
        <span className="prophecy-field-instrument__label prophecy-field-instrument__label--collective" aria-hidden="true">shared image</span>
        <span className="prophecy-field-instrument__label prophecy-field-instrument__label--threshold" aria-hidden="true">threshold</span>
      </div>

      <ol className="chapter-seven-prophecy__legend" aria-label="Prophecy field sequence">
        {prophecySteps.map((step) => (
          <li
            key={step.id}
            className={step.id === currentStep.id ? 'chapter-seven-prophecy__step chapter-seven-prophecy__step--active' : 'chapter-seven-prophecy__step'}
            aria-current={step.id === currentStep.id ? 'step' : undefined}
          >
            <span>{step.index}</span>
            <strong>{step.label}</strong>
            <em>{step.note}</em>
          </li>
        ))}
      </ol>

      <p className="chapter-seven-prophecy__readout" aria-live="polite" aria-atomic="true">
        {activePanel?.insight || currentStep.note}
      </p>
    </section>
  );
}
