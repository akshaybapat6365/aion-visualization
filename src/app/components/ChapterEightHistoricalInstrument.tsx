import type { LearningPanel } from '../types';
import './ChapterEightHistoricalInstrument.css';
import './ChapterEightHistoricalField.css';

const historicalStrataLayers = ['vision', 'carrier', 'healing', 'aeon', 'depth'] as const;

const historicalStepNotes: Record<string, string> = {
  strata: 'sediment gathers',
  christian: 'sign becomes vessel',
  modern: 'depth persists',
};

export default function ChapterEightHistoricalInstrument({
  activePanel,
  activePanelId,
  panels,
}: {
  activePanel?: LearningPanel;
  activePanelId: string;
  panels: LearningPanel[];
}) {
  const currentPanel = panels.find((panel) => panel.id === activePanelId) || panels[0];
  const currentPanelId = currentPanel?.id || 'strata';
  const currentNote = historicalStepNotes[currentPanelId] || 'symbolic layer';
  const emphasis = activePanel
    ? `${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`
    : `${currentPanel?.kicker || 'History'}: ${currentNote}.`;

  return (
    <section
      className="chapter-eight-history"
      data-active-panel={currentPanelId}
      role="group"
      aria-label={`Chapter 8 historical fish atlas. Active focus: ${emphasis}`}
    >
      <div className="chapter-eight-history__header">
        <span>Historical strata</span>
        <strong>{currentPanel?.kicker || 'History'}</strong>
        <em>{currentNote}</em>
      </div>

      <div className="chapter-eight-history__plate">
        <div
          className="historical-strata-instrument chapter-eight-history__field"
          data-active-panel={currentPanelId}
          role="img"
          aria-label={`Historical strata model: five luminous layers accumulate around the fish motif, an early Christian carrier image gathers the sign into a readable vessel, and older meanings keep speaking below later interpretation. Current emphasis: ${emphasis}`}
        >
          <span className="chapter-eight-history__grain" aria-hidden="true" />
          <span className="chapter-eight-history__archive-line chapter-eight-history__archive-line--one" aria-hidden="true" />
          <span className="chapter-eight-history__archive-line chapter-eight-history__archive-line--two" aria-hidden="true" />
          <span className="chapter-eight-history__archive-line chapter-eight-history__archive-line--three" aria-hidden="true" />
          <span className="chapter-eight-history__source-orb chapter-eight-history__source-orb--gold" aria-hidden="true" />
          <span className="chapter-eight-history__source-orb chapter-eight-history__source-orb--green" aria-hidden="true" />
          <span className="chapter-eight-history__source-orb chapter-eight-history__source-orb--cyan" aria-hidden="true" />
          <span className="chapter-eight-history__field-line" aria-hidden="true" />

          <span className="historical-strata-instrument__field historical-strata-instrument__field--archive" aria-hidden="true" />
          <span className="historical-strata-instrument__field historical-strata-instrument__field--afterlife" aria-hidden="true" />
          <span className="historical-strata-instrument__axis" aria-hidden="true" />
          {historicalStrataLayers.map((layer, index) => (
            <span
              key={layer}
              className={`historical-strata-instrument__layer historical-strata-instrument__layer--${index + 1}`}
              aria-hidden="true"
            />
          ))}
          <span className="historical-strata-instrument__sediment historical-strata-instrument__sediment--one" aria-hidden="true" />
          <span className="historical-strata-instrument__sediment historical-strata-instrument__sediment--two" aria-hidden="true" />
          <span className="historical-strata-instrument__sediment historical-strata-instrument__sediment--three" aria-hidden="true" />
          <span className="historical-strata-instrument__thread historical-strata-instrument__thread--descent" aria-hidden="true" />
          <span className="historical-strata-instrument__thread historical-strata-instrument__thread--return" aria-hidden="true" />
          <span className="historical-strata-instrument__fish" aria-hidden="true" />
          <span className="historical-strata-instrument__carrier" aria-hidden="true" />
          <span className="historical-strata-instrument__depth" aria-hidden="true" />
          <span className="historical-strata-instrument__label historical-strata-instrument__label--strata" aria-hidden="true">strata</span>
          <span className="historical-strata-instrument__label historical-strata-instrument__label--carrier" aria-hidden="true">carrier</span>
          <span className="historical-strata-instrument__label historical-strata-instrument__label--afterlife" aria-hidden="true">afterlife</span>
        </div>
      </div>

      <ol className="chapter-eight-history__legend" aria-label="Historical strata sequence">
        {panels.map((panel, index) => (
          <li
            key={panel.id}
            className={panel.id === currentPanelId ? 'chapter-eight-history__step chapter-eight-history__step--active' : 'chapter-eight-history__step'}
            aria-current={panel.id === currentPanelId ? 'step' : undefined}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{panel.kicker}</strong>
            <em>{historicalStepNotes[panel.id] || 'symbolic layer'}</em>
          </li>
        ))}
      </ol>

      <p className="chapter-eight-history__readout" aria-live="polite" aria-atomic="true">
        {activePanel?.insight || currentNote}
      </p>
    </section>
  );
}
