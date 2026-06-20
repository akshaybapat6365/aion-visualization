import { useState } from 'react';
import { Link } from 'react-router';

import { getChapters, getConcepts, getSymbols } from '../data/aionData';

import './AboutPage.css';
import './AboutPageInstrument.css';

const ORIENTATION_MODES = [
  {
    id: 'study',
    label: 'Study',
    glyph: 'I',
    title: 'Follow the chapter argument',
    body: 'Begin with a guided sequence: each chapter becomes a visual instrument for one movement in Aion.',
    proof: 'Chapter arc',
    route: '/chapters',
    routeLabel: 'Chapters',
    statLabel: 'visual chapters',
    tone: 'gold',
  },
  {
    id: 'map',
    label: 'Map',
    glyph: 'II',
    title: 'See concepts as relations',
    body: 'Use the atlas when a term, symbol, or chapter needs to be understood through its neighbors.',
    proof: 'Concept graph',
    route: '/atlas',
    routeLabel: 'Atlas',
    statLabel: 'linked concepts',
    tone: 'cyan',
  },
  {
    id: 'symbolize',
    label: 'Symbolize',
    glyph: 'III',
    title: 'Read images as carriers',
    body: 'Symbols are treated as recurring objects that carry meaning across the book without replacing the text.',
    proof: 'Symbol field',
    route: '/symbols',
    routeLabel: 'Symbols',
    statLabel: 'recurring symbols',
    tone: 'rose',
  },
  {
    id: 'verify',
    label: 'Verify',
    glyph: 'IV',
    title: 'Keep the orientation honest',
    body: "Context, restraint, accessibility, and route checks keep the visual layer in service of Jung's argument.",
    proof: 'Quality gate',
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
  const chapterClusters = [...new Set(chapters.map((chapter) => chapter.cluster))];
  const conceptDifficulties = [...new Set(concepts.map((concept) => concept.difficulty))];
  const symbolPeriods = [...new Set(symbols.map((symbol) => symbol.historicPeriod))];
  const finalChapter = chapters.at(-1);
  const statValueByMode: Record<OrientationMode['id'], string> = {
    study: String(chapters.length).padStart(2, '0'),
    map: String(concepts.length).padStart(2, '0'),
    symbolize: String(symbols.length).padStart(2, '0'),
    verify: 'AA',
  };
  const evidenceByMode: Record<OrientationMode['id'], string> = {
    study: `${chapterClusters.length} clusters: ${chapterClusters.slice(0, 3).join(', ')}`,
    map: `${conceptDifficulties.length} difficulty bands: ${conceptDifficulties.join(', ')}`,
    symbolize: `${symbolPeriods.length} historical periods in view`,
    verify: 'Smoke, accessibility, Pages, and visual QA gates',
  };

  return (
    <div className="page page--about">
      <section className="page-header page-header--visual about-hero section-band">
        <div className="about-hero__copy">
          <p className="eyebrow">About</p>
          <h1>Aion visual atlas</h1>
          <p className="lede">
            A visual learning instrument for reading Aion through chapters, concepts, symbols, and disciplined verification.
          </p>
          <p className="about-hero__cue">Pick a path in the field: study, map, symbolize, or verify.</p>
          <div className="about-hero__metrics" aria-label="Aion atlas data model">
            <span>
              <strong>{chapters.length}</strong>
              chapters
            </span>
            <span>
              <strong>{concepts.length}</strong>
              concepts
            </span>
            <span>
              <strong>{symbols.length}</strong>
              symbols
            </span>
          </div>
        </div>

        <div
          className="about-orientation"
          data-active-mode={activeMode.id}
          role="group"
          aria-label={`Aion orientation instrument. Active path: ${activeMode.label}. ${activeMode.title}.`}
        >
          <div className="about-orientation__stage">
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
              <path className="about-north-star-field__active-beam about-north-star-field__active-beam--study" d="M320 320L320 96" />
              <path className="about-north-star-field__active-beam about-north-star-field__active-beam--map" d="M320 320L544 320" />
              <path className="about-north-star-field__active-beam about-north-star-field__active-beam--symbolize" d="M320 320L320 544" />
              <path className="about-north-star-field__active-beam about-north-star-field__active-beam--verify" d="M320 320L96 320" />
              <circle className="about-north-star-field__glow" cx="320" cy="320" r="138" />

              <g className="about-north-star-field__core">
                <circle cx="320" cy="320" r="58" />
                <text x="320" y="312" textAnchor="middle">Aion</text>
                <text x="320" y="338" textAnchor="middle">Self</text>
              </g>
            </svg>

            <div className="about-mode-controls about-orientation__nodes" role="group" aria-label="Learning orientation modes">
              {ORIENTATION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={mode.id === activeMode.id ? `about-mode-controls__button about-mode-controls__button--active about-orientation-node about-orientation-node--${mode.id} about-orientation-node--active` : `about-mode-controls__button about-orientation-node about-orientation-node--${mode.id}`}
                  onClick={() => setActiveModeId(mode.id)}
                  aria-controls="about-orientation-detail about-orientation-field"
                  aria-pressed={mode.id === activeMode.id}
                  aria-label={`${mode.label}: ${mode.title}`}
                >
                  <span className="about-orientation-node__glyph" aria-hidden="true">{mode.glyph}</span>
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div id="about-orientation-detail" className="about-orientation__detail" data-active-mode={activeMode.id} aria-live="polite" aria-atomic="true">
            <p className="eyebrow">{activeMode.routeLabel}</p>
            <h2>{activeMode.title}</h2>
            <p>{activeMode.body}</p>
            <strong className="about-orientation__proof">{activeMode.proof}</strong>
            <p className="about-orientation__evidence">{evidenceByMode[activeMode.id]}</p>
            <div className="about-orientation__stat" data-tone={activeMode.tone}>
              <strong>{statValueByMode[activeMode.id]}</strong>
              <span>{activeMode.statLabel}</span>
            </div>
            <Link className="about-orientation__link" to={activeMode.route}>
              Open {activeMode.routeLabel}
            </Link>
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
            <Link key={mode.id} to={mode.route} className={`about-route-card about-route-card--${mode.id}`} aria-label={`Open ${mode.routeLabel}: ${mode.title}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{mode.routeLabel}</h3>
              <strong>{mode.proof}</strong>
              <p>{mode.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="about-principles section-band section-band--tight" aria-label="Product principles">
        <article>
          <span>01</span>
          <h2>Scholarly restraint</h2>
          <p>Visual invention clarifies the argument; it does not make unsupported claims.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Meaningful motion</h2>
          <p>Opposition, integration, transformation, and return become reusable interaction grammar.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Accessible beauty</h2>
          <p>The same ideas remain available through keyboard paths, contrast, and reduced motion.</p>
        </article>
      </section>

      <section className="about-data-ribbon section-band section-band--tight" aria-label="Canonical data model">
        <div>
          <span>{chapterClusters.length}</span>
          <p>chapter clusters</p>
        </div>
        <div>
          <span>{conceptDifficulties.length}</span>
          <p>concept levels</p>
        </div>
        <div>
          <span>{symbolPeriods.length}</span>
          <p>symbol periods</p>
        </div>
        <div>
          <span>{finalChapter?.order || 14}</span>
          <p>final synthesis</p>
        </div>
      </section>
    </div>
  );
}
