import { Link } from 'react-router';

import { getChapterRoute } from '../data/aionData';
import type { ChapterId, ChapterRecord } from '../types';

interface MapNode {
  id: string;
  chapterId: ChapterId;
  label: string;
  insight: string;
  x: number;
  y: number;
}

const narrativeNodes: MapNode[] = [
  { id: 'ego', chapterId: 'ch1', label: 'Ego', insight: 'a conscious center appears', x: 90, y: 330 },
  { id: 'shadow', chapterId: 'ch2', label: 'Shadow', insight: 'the rejected image answers back', x: 236, y: 208 },
  { id: 'syzygy', chapterId: 'ch3', label: 'Syzygy', insight: 'inner otherness takes form', x: 392, y: 358 },
  { id: 'fish', chapterId: 'ch6', label: 'Fish Aeon', insight: 'history becomes symbolic weather', x: 548, y: 188 },
  { id: 'alchemy', chapterId: 'ch10', label: 'Alchemy', insight: 'matter becomes a psychic vessel', x: 692, y: 334 },
  { id: 'self', chapterId: 'ch14', label: 'Self', insight: 'the whole field turns around a center', x: 842, y: 246 },
];

const pathCommands = narrativeNodes
  .map((node, index) => {
    if (index === 0) return `M ${node.x} ${node.y}`;
    const previous = narrativeNodes[index - 1];
    const controlOffset = index % 2 === 0 ? 112 : -112;
    return `C ${previous.x + 72} ${previous.y + controlOffset}, ${node.x - 72} ${node.y - controlOffset}, ${node.x} ${node.y}`;
  })
  .join(' ');

function getChapter(chapters: ChapterRecord[], id: ChapterId) {
  return chapters.find((chapter) => chapter.id === id);
}

export default function HomeNarrativeMap({ chapters }: { chapters: ChapterRecord[] }) {
  return (
    <section className="home-narrative section-band" aria-labelledby="home-narrative-title">
      <div className="home-narrative__copy">
        <p className="eyebrow">Opening instrument</p>
        <h2 id="home-narrative-title">The whole book as one moving image</h2>
        <p className="lede">
          Aion is not a list of terms. It is a pressure system: ego, shadow, inner polarity, historical symbol, alchemical vessel, and Self.
        </p>
      </div>

      <div className="home-narrative__diagram" aria-label="Aion narrative path from ego to Self">
        <svg viewBox="0 0 930 520" role="img" aria-labelledby="home-map-title home-map-desc">
          <title id="home-map-title">Aion Narrative Map</title>
          <desc id="home-map-desc">
            A curved visual path connects six Jungian thresholds: ego, shadow, syzygy, fish aeon, alchemy, and Self.
          </desc>
          <defs>
            <radialGradient id="home-map-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff4c2" stopOpacity="0.95" />
              <stop offset="46%" stopColor="#d8b35a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#050508" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="home-map-path" x1="6%" x2="94%" y1="50%" y2="50%">
              <stop offset="0%" stopColor="#55d7df" />
              <stop offset="38%" stopColor="#d8b35a" />
              <stop offset="72%" stopColor="#bb6b76" />
              <stop offset="100%" stopColor="#f5f0df" />
            </linearGradient>
          </defs>

          <path className="home-narrative__axis" d="M 74 420 C 260 102, 574 102, 866 420" />
          <path className="home-narrative__return" d="M 860 250 C 660 48, 330 70, 92 330" />
          <path className="home-narrative__path" d={pathCommands} />
          <circle className="home-narrative__core" cx="842" cy="246" r="132" fill="url(#home-map-core)" />

          {narrativeNodes.map((node, index) => (
            <g key={node.id} className={`home-narrative__node home-narrative__node--${node.id}`} transform={`translate(${node.x} ${node.y})`}>
              <circle className="home-narrative__node-halo" r={node.id === 'self' ? 54 : 38} />
              <circle className="home-narrative__node-dot" r={node.id === 'self' ? 12 : 8} />
              <text className="home-narrative__node-index" x="0" y={node.id === 'self' ? -68 : -50} textAnchor="middle">
                {String(index + 1).padStart(2, '0')}
              </text>
              <text className="home-narrative__node-label" x="0" y={node.id === 'self' ? 80 : 60} textAnchor="middle">
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <ol className="home-narrative__legend" aria-label="Aion narrative thresholds">
        {narrativeNodes.map((node) => {
          const chapter = getChapter(chapters, node.chapterId);
          if (!chapter) return null;
          return (
            <li key={node.id} className={`home-narrative__legend-item home-narrative__legend-item--${node.id}`}>
              <Link to={getChapterRoute(node.chapterId)}>
                <span>{String(chapter.order).padStart(2, '0')}</span>
                <strong>{node.label}</strong>
                <em>{node.insight}</em>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
