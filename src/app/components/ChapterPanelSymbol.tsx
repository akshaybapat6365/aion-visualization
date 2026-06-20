const quaternityDirections = ['north', 'east', 'south', 'west'] as const;
const mandalaBands = ['outer', 'middle', 'inner'] as const;
const rootLines = ['left', 'center', 'right'] as const;

export default function ChapterPanelSymbol() {
  return (
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
  );
}
