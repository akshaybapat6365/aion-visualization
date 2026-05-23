import { getConcepts, getSymbols } from '../data/aionData';

const glyphs: Record<string, string> = {
  fish: 'F',
  mandala: 'M',
  dragon: 'D',
  sophia: 'S',
  sword: 'L',
  lapis: 'P',
  cross: 'C',
  ouroboros: 'O',
  zodiac: 'Z',
};

export default function SymbolsPage() {
  const symbols = getSymbols();
  const concepts = getConcepts();

  return (
    <div className="page">
      <section className="page-header page-header--visual symbols-hero section-band">
        <div>
          <p className="eyebrow">Symbols</p>
          <h1>Lexicon of recurring images</h1>
          <p className="lede">Symbols act as navigational objects, each carrying threads through chapters and concepts.</p>
        </div>
        <div className="symbol-orbit" aria-label="Symbol orbit">
          <div className="symbol-orbit__center">Self</div>
          {symbols.slice(0, 9).map((symbol, index) => (
            <a
              key={symbol.id}
              className="symbol-orbit__node"
              href={`#symbol-${symbol.id}`}
              style={{ ['--node-index' as string]: index, ['--node-count' as string]: Math.min(symbols.length, 9) }}
              aria-label={`Jump to ${symbol.label}`}
            >
              {glyphs[symbol.id] || symbol.label[0]}
            </a>
          ))}
        </div>
      </section>
      <section className="symbol-grid section-band section-band--tight">
        {symbols.map((symbol) => {
          const linked = concepts.filter((concept) => symbol.conceptIds.includes(concept.id));
          return (
            <article key={symbol.id} id={`symbol-${symbol.id}`} className="symbol-panel">
              <div className="symbol-panel__glyph" aria-hidden="true">{glyphs[symbol.id] || symbol.label[0]}</div>
              <p className="eyebrow">{symbol.historicPeriod}</p>
              <h2>{symbol.label}</h2>
              <p>{symbol.motif}</p>
              <div className="chip-row">
                {linked.slice(0, 5).map((concept) => (
                  <span key={concept.id}>{concept.label}</span>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
