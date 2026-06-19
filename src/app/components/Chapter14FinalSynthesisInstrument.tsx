import type { LearningPanel } from '../types';

const synthesisMotifs = ['ego', 'shadow', 'syzygy', 'fish', 'alchemy', 'gnosis'] as const;
const synthesisQuaternityPoints = ['north', 'east', 'south', 'west'] as const;
const synthesisAeonMarks = ['past', 'threshold', 'future'] as const;

export default function Chapter14FinalSynthesisInstrument({
  activePanel,
  activePanelId,
}: {
  activePanel: LearningPanel;
  activePanelId: string;
}) {
  const label = `Final synthesis mandala: earlier motifs gather around a fourfold Self field, the ego and Self axis stays relational, and the individuation path remains dynamic rather than closed. Current emphasis: ${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`;

  return (
    <div
      className="final-synthesis-instrument"
      data-active-panel={activePanelId}
      role="img"
      aria-label={label}
    >
      <span className="final-synthesis-instrument__field final-synthesis-instrument__field--memory" aria-hidden="true" />
      <span className="final-synthesis-instrument__field final-synthesis-instrument__field--future" aria-hidden="true" />
      <span className="final-synthesis-instrument__axis final-synthesis-instrument__axis--vertical" aria-hidden="true" />
      <span className="final-synthesis-instrument__axis final-synthesis-instrument__axis--horizontal" aria-hidden="true" />
      <span className="final-synthesis-instrument__orbit final-synthesis-instrument__orbit--outer" aria-hidden="true" />
      <span className="final-synthesis-instrument__orbit final-synthesis-instrument__orbit--inner" aria-hidden="true" />
      <span className="final-synthesis-instrument__motif-ring" aria-hidden="true">
        {synthesisMotifs.map((motif) => (
          <span key={motif} className={`final-synthesis-instrument__motif final-synthesis-instrument__motif--${motif}`} />
        ))}
      </span>
      <span className="final-synthesis-instrument__quaternity" aria-hidden="true">
        {synthesisQuaternityPoints.map((point) => (
          <span key={point} className={`final-synthesis-instrument__point final-synthesis-instrument__point--${point}`} />
        ))}
      </span>
      <span className="final-synthesis-instrument__ego" aria-hidden="true" />
      <span className="final-synthesis-instrument__self" aria-hidden="true" />
      <span className="final-synthesis-instrument__path" aria-hidden="true">
        {synthesisAeonMarks.map((mark) => (
          <span key={mark} className={`final-synthesis-instrument__mark final-synthesis-instrument__mark--${mark}`} />
        ))}
      </span>
      <span className="final-synthesis-instrument__label final-synthesis-instrument__label--gather" aria-hidden="true">motifs gather</span>
      <span className="final-synthesis-instrument__label final-synthesis-instrument__label--axis" aria-hidden="true">ego/Self axis</span>
      <span className="final-synthesis-instrument__label final-synthesis-instrument__label--aeon" aria-hidden="true">living path</span>
    </div>
  );
}
