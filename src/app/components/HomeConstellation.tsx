import { getChapters } from '../data/aionData';

export default function HomeConstellation() {
  const chapters = getChapters();
  const center = 240;
  const radius = 170;

  return (
    <svg className="home-constellation" viewBox="0 0 480 480" role="img" aria-label="Chapter constellation for Aion">
      <defs>
        <radialGradient id="aion-core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff2b8" stopOpacity="0.9" />
          <stop offset="42%" stopColor="#d4af37" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#050508" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle className="home-constellation__halo" cx={center} cy={center} r="218" />
      <circle className="home-constellation__orbit" cx={center} cy={center} r={radius} />
      <circle className="home-constellation__orbit home-constellation__orbit--inner" cx={center} cy={center} r="96" />
      <circle className="home-constellation__core" cx={center} cy={center} r="72" fill="url(#aion-core-glow)" />
      <text className="home-constellation__label" x={center} y={center + 5} textAnchor="middle">
        SELF
      </text>
      {chapters.map((chapter) => {
        const angle = ((chapter.order - 1) / chapters.length) * Math.PI * 2 - Math.PI / 2;
        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        return (
          <g key={chapter.id} className="home-constellation__node">
            <line className="home-constellation__thread" x1={center} y1={center} x2={x} y2={y} />
            <circle cx={x} cy={y} r={chapter.order === 1 ? 10 : 7} />
            <text x={x} y={y + 24} textAnchor="middle">
              {chapter.order}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
