export default function AboutPage() {
  return (
    <div className="page">
      <section className="page-header page-header--visual about-hero section-band">
        <div>
          <p className="eyebrow">About</p>
          <h1>Depth psychology as visual orientation</h1>
          <p className="lede">
            Aion Visualization translates a difficult symbolic work into an interactive learning environment while keeping conceptual claims restrained and traceable.
          </p>
        </div>
        <div className="about-compass" aria-label="Aion learning compass">
          <span className="about-compass__ring about-compass__ring--outer" />
          <span className="about-compass__ring about-compass__ring--inner" />
          <span className="about-compass__axis about-compass__axis--vertical" />
          <span className="about-compass__axis about-compass__axis--horizontal" />
          <span className="about-compass__node about-compass__node--one">Study</span>
          <span className="about-compass__node about-compass__node--two">See</span>
          <span className="about-compass__node about-compass__node--three">Move</span>
          <span className="about-compass__node about-compass__node--four">Check</span>
          <strong>Self</strong>
        </div>
      </section>
      <section className="about-principles section-band section-band--tight">
        <article>
          <span>01</span>
          <h2>Scholarly restraint</h2>
          <p>The app treats visual invention as a way to clarify Jung's argument, not replace it.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Meaningful motion</h2>
          <p>Opposition, integration, transformation, and cyclical return become shared motion semantics.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Visual-first learning</h2>
          <p>Text stays concise while diagrams, scenes, symbols, and chapter-to-chapter relationships carry the experience.</p>
        </article>
      </section>
    </div>
  );
}
