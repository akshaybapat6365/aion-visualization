import { Link } from 'react-router';

import ChapterSigil from '../components/ChapterSigil';
import HomeAionField from '../components/HomeAionField';
import { getChapterRoute, getChapters, getConcepts, getSymbols } from '../data/aionData';

export default function HomePage() {
  const chapters = getChapters();
  const featured = [chapters[0], chapters[4], chapters[8], chapters[13]];

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
          <div>
            <strong>{chapters.length}</strong>
            <span>chapters</span>
          </div>
          <div>
            <strong>{getConcepts().length}</strong>
            <span>concepts</span>
          </div>
          <div>
            <strong>{getSymbols().length}</strong>
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
          <Link to={getChapterRoute('ch1')} className="path-panel">
            <span className="path-panel__mark">I</span>
            <h3>Guided journey</h3>
            <p>Move chapter by chapter through a visual argument about the Self.</p>
          </Link>
          <Link to="/atlas" className="path-panel">
            <span className="path-panel__mark">II</span>
            <h3>Concept atlas</h3>
            <p>Enter non-linearly through concepts, symbols, and chapter relationships.</p>
          </Link>
          <Link to="/timeline" className="path-panel">
            <span className="path-panel__mark">III</span>
            <h3>Time and symbols</h3>
            <p>Place Aion beside Jung's life, publications, and recurring motifs.</p>
          </Link>
        </div>
      </section>

      <section className="section-band">
        <div className="section-heading">
          <p className="eyebrow">First orbit</p>
          <h2>Four luminous thresholds</h2>
        </div>
        <div className="chapter-preview-grid">
          {featured.map((chapter) => (
            <Link key={chapter.id} to={getChapterRoute(chapter.id)} className="chapter-preview">
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
