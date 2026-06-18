import { useState } from 'react';
import { Link } from 'react-router';

import { getChapters, getConcepts, getSymbols } from '../data/aionData';

import './AboutPage.css';

const ORIENTATION_MODES = [
  {
    id: 'study',
    label: 'Study',
    title: 'Follow the chapter argument',
    body: 'Begin with a guided sequence: each chapter becomes a visual instrument for one movement in Aion.',
    route: '/chapters',
    routeLabel: 'Chapters',
    statLabel: 'visual chapters',
    tone: 'gold',
  },
  {
    id: 'map',
    label: 'Map',
    title: 'See concepts as relations',
    body: 'Use the atlas when a term, symbol, or chapter needs to be understood through its neighbors.',
    route: '/atlas',
    routeLabel: 'Atlas',
    statLabel: 'linked concepts',
    tone: 'cyan',
  },
  {
    id: 'symbolize',
    label: 'Symbolize',
    title: 'Read images as carriers',
    body: 'Symbols are treated as recurring objects that carry meaning across the book without replacing the text.',
    route: '/symbols',
    routeLabel: 'Symbols',
    statLabel: 'recurring symbols',
    tone: 'rose',
  },
  {
    id: 'verify',
    label: 'Verify',
    title: 'Keep the orientation honest',
    body: "Context, restraint, accessibility, and route checks keep the visual layer in service of Jung's argument.",
    route: '/timeline',
    routeLabel: 'Timeline',
    statLabel: 'context path',
    tone: 'green',
  },
] as const;

type OrientationMode = (typeof ORIENTATION_MODES)[number];

export default function AboutPage() {
  const chapters = getChapters();
  const concepts = getConcepts();
  const symbols = getSymbols();
  const [activeModeId, setActiveModeId] = useState<OrientationMode['id']>('study');
  const activeMode = ORIENTATION_MODES.find((mode) => mode.id === activeModeId) || ORIENTATION_MODES[0];
  const statValueByMode: Record<OrientationMode['id'], string> = {
    study: String(chapters.length).padStart(2, '0'),
    map: String(concepts.length).padStart(2, '0'),
    symbolize: String(symbols.length).padStart(2, '0'),
    verify: 'AA',
  };

  return (
    <div className="page page--about">
      <section className="page-header page-header--visual about-hero section-band">
        <div className="about-hero__copy">
          <p className="eyebrow">About</p>
          <h1>Aion visual atlas</h1>
          <p className="lede">
            A sparse, interactive map of chapters, concepts, symbols, and checks that keeps visuals in service of Jung's argument.
          </p>
          <div className="about-mode-controls" aria-label="Learning orientation modes">
            {ORIENTATION_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={mode.id === activeMode.id ? 'about-mode-controls__button about-mode-controls__button--active' : 'about-mode-controls__button'}
                onClick={() => setActiveModeId(mode.id)}
                aria-controls="about-orientation-detail about-orientation-field"
                aria-pressed={mode.id === activeMode.id}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="about-orientation" data-active-mode={activeMode.id}>
          <svg
            id="about-orientation-field"
            className="about-north-star-field"
            viewBox="0 0 640 640"
            role="img"
            aria-labelledby="about-field-title about-field-desc"
          >
            <title id="about-field-title">Aion learning orientation field</title>
            <desc id="about-field-desc">
              Four routes orbit the Self: study the chapters, map concepts, read symbols, and verify context.
            </desc>
            <defs>
              <radialGradient id="about-field-glow" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="rgba(212, 175, 55, 0.58)" />
                <stop offset="36%" stopColor="rgba(83, 216, 232, 0.14)" />
                <stop offset="100%" stopColor="rgba(3, 3, 7, 0)" />
              </radialGradient>
              <linearGradient id="about-field-axis" x1="0%" x2="100%" y1="50%" y2="50%">
                <stop offset="0%" stopColor="rgba(244, 240, 232, 0)" />
                <stop offset="50%" stopColor="rgba(244, 240, 232, 0.46)" />
                <stop offset="100%" stopColor="rgba(244, 240, 232, 0)" />
              </linearGradient>
              <filter id="about-field-blur">
                <feGaussianBlur stdDeviation="10" />
              </filter>
            </defs>

            <rect className="about-north-star-field__plate" x="28" y="28" width="584" height="584" rx="22" />
            <circle className="about-north-star-field__aura" cx="320" cy="320" r="246" />
            <circle className="about-north-star-field__halo" cx="320" cy="320" r="205" />
            <circle className="about-north-star-field__halo about-north-star-field__halo--inner" cx="320" cy="320" r="116" />
            <ellipse className="about-north-star-field__orbit about-north-star-field__orbit--concept" cx="320" cy="320" rx="222" ry="84" />
            <ellipse className="about-north-star-field__orbit about-north-star-field__orbit--symbol" cx="320" cy="320" rx="132" ry="244" />
            <path className="about-north-star-field__axis" d="M112 320h416" />
            <path className="about-north-star-field__axis about-north-star-field__axis--vertical" d="M320 112v416" />
            <path className="about-north-star-field__diagonal about-north-star-field__diagonal--one" d="M174 174l292 292" />
            <path className="about-north-star-field__diagonal about-north-star-field__diagonal--two" d="M466 174L174 466" />
            <circle className="about-north-star-field__glow" cx="320" cy="320" r="138" />

            {ORIENTATION_MODES.map((mode, index) => {
              const nodePositions = [
                { x: 320, y: 96 },
                { x: 544, y: 320 },
                { x: 320, y: 544 },
                { x: 96, y: 320 },
              ];
              const { x, y } = nodePositions[index];
              return (
                <g key={mode.id} className={`about-north-star-field__node about-north-star-field__node--${mode.id}`}>
                  <circle cx={x} cy={y} r={32} />
                  <text x={x} y={y + 5} textAnchor="middle">
                    {mode.label}
                  </text>
                </g>
              );
            })}

            <g className="about-north-star-field__core">
              <circle cx="320" cy="320" r="58" />
              <text x="320" y="312" textAnchor="middle">Aion</text>
              <text x="320" y="338" textAnchor="middle">Self</text>
            </g>
            <g className="about-north-star-field__active-readout">
              <rect x="214" y="40" width="212" height="68" rx="34" />
              <text x="320" y="68" textAnchor="middle">{activeMode.label}</text>
              <text x="320" y="91" textAnchor="middle">{activeMode.title}</text>
            </g>
          </svg>

          <div id="about-orientation-detail" className="about-orientation__detail" aria-live="polite">
            <p className="eyebrow">{activeMode.routeLabel}</p>
            <h2>{activeMode.title}</h2>
            <p>{activeMode.body}</p>
            <div className="about-orientation__stat" data-tone={activeMode.tone}>
              <strong>{statValueByMode[activeMode.id]}</strong>
              <span>{activeMode.statLabel}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="about-route-launch section-band section-band--tight" aria-labelledby="about-route-launch-title">
        <div className="section-heading">
          <p className="eyebrow">How to enter</p>
          <h2 id="about-route-launch-title">Choose a learning vector</h2>
        </div>
        <div className="about-route-launch__grid">
          {ORIENTATION_MODES.map((mode, index) => (
            <Link key={mode.id} to={mode.route} className={`about-route-card about-route-card--${mode.id}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{mode.routeLabel}</h3>
              <p>{mode.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="about-principles section-band section-band--tight" aria-label="Product principles">
        <article>
          <span>01</span>
          <h2>Scholarly restraint</h2>
          <p>Visual invention clarifies Jung's argument; it does not make unsupported claims.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Meaningful motion</h2>
          <p>Opposition, integration, transformation, and return become reusable interaction grammar.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Accessible beauty</h2>
          <p>The same ideas must remain available through keyboard paths, contrast, and reduced motion.</p>
        </article>
      </section>
    </div>
  );
}
