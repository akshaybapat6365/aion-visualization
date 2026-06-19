import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import { getChapters, getChapterRoute, getConcepts, getSymbols } from '../data/aionData';

import './SymbolsPage.css';

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

const toneBySymbol: Record<string, string> = {
  fish: 'cyan',
  mandala: 'gold',
  dragon: 'rose',
  sophia: 'green',
  sword: 'cyan',
  lapis: 'gold',
  cross: 'gold',
  ouroboros: 'green',
  zodiac: 'cyan',
};

export default function SymbolsPage() {
  const symbols = getSymbols();
  const concepts = getConcepts();
  const chapters = getChapters();
  const [activeSymbolId, setActiveSymbolId] = useState(symbols[0]?.id || '');
  const activeSymbol = symbols.find((symbol) => symbol.id === activeSymbolId) || symbols[0];
  const activeSymbolIndex = Math.max(0, symbols.findIndex((symbol) => symbol.id === activeSymbol.id));
  const activeConcepts = useMemo(
    () => concepts.filter((concept) => activeSymbol.conceptIds.includes(concept.id)),
    [activeSymbol.conceptIds, concepts],
  );
  const relatedChapters = useMemo(
    () => chapters.filter((chapter) => chapter.keyConceptIds.some((conceptId) => activeSymbol.conceptIds.includes(conceptId))),
    [activeSymbol.conceptIds, chapters],
  );
  const symbolFieldLabel = `${activeSymbol.label} symbol field: ${activeSymbol.motif}. Linked concepts: ${activeConcepts.map((concept) => concept.label).join(', ') || 'none'}. Related chapters: ${relatedChapters.map((chapter) => `Chapter ${chapter.order}, ${chapter.title}`).join('; ') || 'none'}.`;

  return (
    <div className="page">
      <section className="page-header page-header--visual symbols-hero section-band">
        <div>
          <p className="eyebrow">Symbols</p>
          <h1>Lexicon of recurring images</h1>
          <p className="lede">Symbols act as navigational objects, each carrying threads through chapters and concepts.</p>
          <div className="symbols-hero__metrics" aria-label="Symbols route counts">
            <span><strong>{String(symbols.length).padStart(2, '0')}</strong> images</span>
            <span><strong>{String(activeConcepts.length).padStart(2, '0')}</strong> active threads</span>
            <span><strong>{String(relatedChapters.length).padStart(2, '0')}</strong> chapter links</span>
          </div>
        </div>
        <div className="symbol-orbit symbol-orbit--interactive" aria-label="Symbol orbit">
          <div id="symbol-selected-orbit-detail" className="symbol-orbit__center" aria-live="polite">
            <span>{glyphs[activeSymbol.id] || activeSymbol.label[0]}</span>
            <strong>{activeSymbol.label}</strong>
          </div>
          {symbols.slice(0, 9).map((symbol, index) => (
            <button
              key={symbol.id}
              className={symbol.id === activeSymbol.id ? 'symbol-orbit__node symbol-orbit__node--active' : 'symbol-orbit__node'}
              type="button"
              style={{ ['--node-index' as string]: index, ['--node-count' as string]: Math.min(symbols.length, 9) }}
              onClick={() => setActiveSymbolId(symbol.id)}
              aria-controls="symbol-selected-detail symbol-selected-orbit-detail symbol-field"
              aria-label={`Select ${symbol.label}: ${symbol.motif}`}
              aria-pressed={symbol.id === activeSymbol.id}
            >
              {glyphs[symbol.id] || symbol.label[0]}
            </button>
          ))}
        </div>
      </section>

      <section className="symbol-lab section-band section-band--tight" aria-labelledby="symbol-lab-title">
        <div className="section-heading">
          <p className="eyebrow">Active symbol field</p>
          <h2 id="symbol-lab-title">Trace how an image carries concepts</h2>
        </div>
        <div className="symbol-lab__layout">
          <div
            id="symbol-field"
            className="symbol-field"
            data-tone={toneBySymbol[activeSymbol.id] || 'gold'}
            role="img"
            aria-label={symbolFieldLabel}
          >
            <span className="symbol-field__ring symbol-field__ring--outer" aria-hidden="true" />
            <span className="symbol-field__ring symbol-field__ring--inner" aria-hidden="true" />
            <span className="symbol-field__axis symbol-field__axis--horizontal" aria-hidden="true" />
            <span className="symbol-field__axis symbol-field__axis--vertical" aria-hidden="true" />
            <span className="symbol-field__glyph" aria-hidden="true">{glyphs[activeSymbol.id] || activeSymbol.label[0]}</span>
            <span className="symbol-field__index" aria-hidden="true">{String(activeSymbolIndex + 1).padStart(2, '0')}</span>
            {activeConcepts.slice(0, 6).map((concept, index) => (
              <span
                key={concept.id}
                className="symbol-field__concept"
                style={{ ['--node-index' as string]: index, ['--node-count' as string]: Math.min(activeConcepts.length, 6) }}
                aria-hidden="true"
              >
                {concept.label}
              </span>
            ))}
            {relatedChapters.slice(0, 7).map((chapter, index) => (
              <span
                key={chapter.id}
                className="symbol-field__chapter"
                style={{ ['--node-index' as string]: index, ['--node-count' as string]: Math.min(relatedChapters.length, 7) }}
                aria-hidden="true"
              >
                {String(chapter.order).padStart(2, '0')}
              </span>
            ))}
          </div>

          <aside id="symbol-selected-detail" className="symbol-detail" aria-live="polite">
            <p className="eyebrow">{activeSymbol.historicPeriod}</p>
            <h2>{activeSymbol.label}</h2>
            <p>{activeSymbol.motif}</p>
            <div className="symbol-detail__thread-group" aria-label="Linked concepts">
              {activeConcepts.map((concept) => (
                <span key={concept.id}>{concept.label}</span>
              ))}
            </div>
            <div className="symbol-detail__chapter-links" aria-label="Related chapters">
              {relatedChapters.slice(0, 5).map((chapter) => (
                <Link key={chapter.id} to={getChapterRoute(chapter.id)}>
                  {String(chapter.order).padStart(2, '0')} · {chapter.title}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="symbol-grid section-band section-band--tight" aria-label="Recurring symbol index">
        {symbols.map((symbol) => {
          const linked = concepts.filter((concept) => symbol.conceptIds.includes(concept.id));
          const isActive = symbol.id === activeSymbol.id;
          return (
            <article key={symbol.id} id={`symbol-${symbol.id}`} className={isActive ? 'symbol-panel symbol-panel--active' : 'symbol-panel'}>
              <button
                className="symbol-panel__activate"
                type="button"
                onClick={() => setActiveSymbolId(symbol.id)}
                aria-controls="symbol-selected-detail symbol-selected-orbit-detail symbol-field"
                aria-label={`Focus ${symbol.label} in the symbol field`}
                aria-pressed={isActive}
              >
                <span className="symbol-panel__glyph" aria-hidden="true">{glyphs[symbol.id] || symbol.label[0]}</span>
                <span>{isActive ? 'In field' : 'Focus'}</span>
              </button>
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
