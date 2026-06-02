import { Link } from 'react-router';

import ChapterSigil from '../components/ChapterSigil';
import HomeAionField from '../components/HomeAionField';
import { getChapterRoute, getChapters, getConcepts, getSymbols } from '../data/aionData';

export default function HomePage() {
  const chapters = getChapters();
  const concepts = getConcepts();
  const symbols = getSymbols();
  const featured = [chapters[0], chapters[4], chapters[8], chapters[13]];
  const conceptLabel = (id: string) => concepts.find((concept) => concept.id === id)?.label || id;
  const symbolLabel = (id: string) => symbols.find((symbol) => symbol.id === id)?.label || id;
  const pathPanels = [
    {
      href: getChapterRoute('ch1'),
      mark: 'I',
      title: 'Guided journey',
      body: 'Move chapter by chapter through a visual argument about the Self.',
      mode: 'sequence',
      tags: [conceptLabel('ego'), conceptLabel('shadow'), conceptLabel('self')],
    },
    {
      href: '/atlas',
      mark: 'II',
      title: 'Concept atlas',
      body: 'Enter non-linearly through concepts, symbols, and chapter relationships.',
      mode: 'constellation',
      tags: [conceptLabel('self'), symbolLabel('mandala'), symbolLabel('fish')],
    },
    {
      href: '/timeline',
      mark: 'III',
      title: 'Time and symbols',
      body: "Place Aion beside Jung's life, publications, and recurring motifs.",
      mode: 'cycle',
      tags: [conceptLabel('aeon'), conceptLabel('fish-symbol'), symbolLabel('zodiac')],
    },
  ];

  return (
    <div className="page page--home">
      <section className="home-hero section-band">
        <div className="home-hero__visual">
          <HomeAionField chapters={chapters} />
        </div>
        <div className="home-hero__scrim" />
        <div className="home-hero__copy">
          <p className="eyebrow">Carl Jung's Aion</p>
          <h1>A living atlas of the Self</h1>
          <p className="lede">
            Fourteen visual chapters move from ego and shadow through fish, alchemy, Gnosis, and the final dynamics of psychic wholeness.
          </p>
          <div className="hero-actions" aria-label="Primary actions">
            <Link className="button button--primary" to={getChapterRoute('ch1')}>
              Begin Chapter 1
            </Link>
            <Link className="button button--ghost" to="/atlas">
              Open Atlas
            </Link>
          </div>
        </div>
      </section>

      <section className="section-band section-band--tight">
        <div className="metrics-strip" aria-label="Aion knowledge model summary">
          <div className="metrics-strip__cell">
            <strong>{chapters.length}</strong>
            <span>chapters</span>
          </div>
          <div className="metrics-strip__cell">
            <strong>{concepts.length}</strong>
            <span>concepts</span>
          </div>
          <div className="metrics-strip__cell">
            <strong>{symbols.length}</strong>
            <span>symbols</span>
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="section-heading">
          <p className="eyebrow">Three paths</p>
          <h2>Read, map, return</h2>
        </div>
        <div className="path-grid">
          {pathPanels.map((path) => (
            <Link key={path.href} to={path.href} className={`path-panel path-panel--${path.mode}`}>
              <span className="path-panel__mark">{path.mark}</span>
              <span className="path-panel__diagram" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <h3>{path.title}</h3>
              <p>{path.body}</p>
              <span className="path-panel__tags" aria-hidden="true">
                {path.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-band">
        <div className="section-heading">
          <p className="eyebrow">First orbit</p>
          <h2>Four luminous thresholds</h2>
        </div>
        <ol className="home-chapter-orbit" aria-label="Aion chapter orbit quick launch">
          {chapters.map((chapter) => (
            <li
              key={chapter.id}
              style={{ ['--node-index' as string]: chapter.order - 1, ['--node-count' as string]: chapters.length }}
              className={featured.includes(chapter) ? 'home-chapter-orbit__item home-chapter-orbit__item--featured' : 'home-chapter-orbit__item'}
            >
              <Link to={getChapterRoute(chapter.id)} aria-label={`Open Chapter ${chapter.order}: ${chapter.title}`}>
                {String(chapter.order).padStart(2, '0')}
              </Link>
            </li>
          ))}
        </ol>
        <div className="chapter-preview-grid">
          {featured.map((chapter) => (
            <Link key={chapter.id} to={getChapterRoute(chapter.id)} className="chapter-preview" aria-label={`Chapter ${chapter.order}: ${chapter.title}`}>
              <ChapterSigil chapter={chapter} />
              <span>Chapter {chapter.order}</span>
              <h3>{chapter.title}</h3>
              <p>{chapter.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
