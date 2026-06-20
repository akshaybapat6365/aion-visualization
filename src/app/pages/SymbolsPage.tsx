import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import { getChapters, getChapterRoute, getConcepts, getSymbols } from '../data/aionData';

import './SymbolsPage.css';

const symbolProfiles: Record<string, { axis: string; polarity: string; movement: string }> = {
  fish: {
    axis: 'Aeon / shadow',
    polarity: 'paired carriers',
    movement: 'Opposition held in one image',
  },
  mandala: {
    axis: 'Self / quaternity',
    polarity: 'fourfold center',
    movement: 'Totality ordered around a center',
  },
  dragon: {
    axis: 'Shadow / adversary',
    polarity: 'threatening double',
    movement: 'Rejected force made visible',
  },
  sophia: {
    axis: 'Anima / wisdom',
    polarity: 'mediating figure',
    movement: 'Relation opens toward the unconscious',
  },
  sword: {
    axis: 'Animus / logos',
    polarity: 'dividing blade',
    movement: 'Judgment separates and clarifies',
  },
  lapis: {
    axis: 'Alchemy / stone',
    polarity: 'fixed result',
    movement: 'Transformation becomes stable form',
  },
  cross: {
    axis: 'Christ / Self',
    polarity: 'vertical and horizontal',
    movement: 'A totality organized by tension',
  },
  ouroboros: {
    axis: 'Return / opus',
    polarity: 'self-consuming circle',
    movement: 'The end returns to the beginning',
  },
  zodiac: {
    axis: 'Aeon / time',
    polarity: 'cosmic wheel',
    movement: 'History read as symbolic rhythm',
  },
};

function SymbolMark({ symbolId, className = '' }: { symbolId: string; className?: string }) {
  return (
    <span className={`symbol-mark symbol-mark--${symbolId} ${className}`.trim()} aria-hidden="true">
      <span />
    </span>
  );
}

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
  const activeProfile = symbolProfiles[activeSymbol.id] || {
    axis: activeSymbol.historicPeriod,
    polarity: activeSymbol.motif,
    movement: 'Trace this image across the atlas',
  };
  const symbolFieldLabel = `${activeSymbol.label} symbol field: ${activeSymbol.motif}. Linked concepts: ${activeConcepts.map((concept) => concept.label).join(', ') || 'none'}. Related chapters: ${relatedChapters.map((chapter) => `Chapter ${chapter.order}, ${chapter.title}`).join('; ') || 'none'}.`;

  return (
    <div className="page symbols-page">
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
            <SymbolMark symbolId={activeSymbol.id} className="symbol-mark--core" />
            <strong>{activeSymbol.label}</strong>
            <em>{activeProfile.axis}</em>
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
              <SymbolMark symbolId={symbol.id} />
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
            <span className="symbol-field__glyph symbol-field__specimen" aria-hidden="true">
              <SymbolMark symbolId={activeSymbol.id} className="symbol-mark--specimen" />
              <strong>{activeSymbol.label}</strong>
              <em>{activeProfile.polarity}</em>
            </span>
            <span className="symbol-field__index" aria-hidden="true">{String(activeSymbolIndex + 1).padStart(2, '0')}</span>
            {relatedChapters.slice(0, 7).map((chapter, index) => (
              <span
                key={`${chapter.id}-thread`}
                className="symbol-field__thread"
                style={{ ['--node-index' as string]: index, ['--node-count' as string]: Math.min(relatedChapters.length, 7) }}
                aria-hidden="true"
              />
            ))}
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

          <aside
            id="symbol-selected-detail"
            className="symbol-detail"
            data-tone={toneBySymbol[activeSymbol.id] || 'gold'}
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="eyebrow">{activeSymbol.historicPeriod}</p>
            <h2>{activeSymbol.label}</h2>
            <p>{activeSymbol.motif}</p>
            <div className="symbol-detail__specimen">
              <SymbolMark symbolId={activeSymbol.id} className="symbol-mark--detail" />
              <div>
                <strong>{activeProfile.axis}</strong>
                <span>{activeProfile.movement}</span>
              </div>
            </div>
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
                <SymbolMark symbolId={symbol.id} className="symbol-panel__glyph" />
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
