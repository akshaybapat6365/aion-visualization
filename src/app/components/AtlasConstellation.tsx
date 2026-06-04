import type { KeyboardEvent } from 'react';

import type { ChapterRecord, ConceptRecord, RelationshipRecord, SymbolRecord } from '../types';

interface AtlasConstellationProps {
  active: ChapterRecord | null;
  activeConcepts: ConceptRecord[];
  filteredChapters: ChapterRecord[];
  linkedRelationships: RelationshipRecord[];
  linkedSymbols: SymbolRecord[];
  entityLabel: (id: string) => string;
  onSelectChapter: (id: ChapterRecord['id']) => void;
}

interface FieldNode {
  id: string;
  label: string;
  type: 'concept' | 'symbol';
  x: number;
  y: number;
}

const center = { x: 500, y: 324 };
const viewBox = { x: 40, y: 0, width: 920, height: 660 };

const quadrants = [
  { id: 'ego-axis', label: 'ego', radius: 318, start: -150, end: -34, x: 188, y: 126 },
  { id: 'shadow-axis', label: 'shadow', radius: 318, start: -30, end: 86, x: 746, y: 126 },
  { id: 'symbol-axis', label: 'symbol', radius: 318, start: 90, end: 206, x: 758, y: 568 },
  { id: 'self-axis', label: 'self', radius: 318, start: 210, end: 326, x: 188, y: 568 },
];

function trimNodeLabel(label: string) {
  return label.length > 18 ? `${label.slice(0, 16)}…` : label;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function polarPoint(radius: number, degrees: number) {
  const angle = toRadians(degrees);
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

function arcPath(radius: number, startDegrees: number, endDegrees: number) {
  const start = polarPoint(radius, startDegrees);
  const end = polarPoint(radius, endDegrees);
  const largeArc = Math.abs(endDegrees - startDegrees) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function placeNodes<T extends { id: string; label: string }>(items: T[], radius: number, type: FieldNode['type'], angleOffset: number): FieldNode[] {
  const count = Math.max(items.length, 1);
  return items.map((item, index) => {
    const angle = angleOffset + (index / count) * Math.PI * 2;
    return {
      id: item.id,
      label: item.label,
      type,
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  });
}

export default function AtlasConstellation({
  active,
  activeConcepts,
  filteredChapters,
  linkedRelationships,
  linkedSymbols,
  entityLabel,
  onSelectChapter,
}: AtlasConstellationProps) {
  const conceptNodes = placeNodes(activeConcepts.slice(0, 6), 184, 'concept', -Math.PI / 2.18);
  const symbolNodes = placeNodes(linkedSymbols.slice(0, 5), 286, 'symbol', -Math.PI / 1.14);
  const fieldNodes = [...conceptNodes, ...symbolNodes];
  const chapterResultText = `${filteredChapters.length} chapter${filteredChapters.length === 1 ? '' : 's'} in view`;
  const conceptLabels = activeConcepts.map((concept) => concept.label).join(', ');
  const symbolLabels = linkedSymbols.map((symbol) => symbol.label).join(', ');
  const fieldTitle = active ? `${active.title} Concept Field` : 'Empty Atlas Field';
  const fieldDescription = active
    ? `The active chapter sits at the center. Inner concepts: ${conceptLabels || 'none curated yet'}. Outer symbols: ${symbolLabels || 'none curated yet'}. The four visible axes frame the field as ego, shadow, symbol, and Self.`
    : 'No chapters match the current search, so the constellation is empty.';

  const focusChapterButton = (chapterId: string) => {
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(`[data-atlas-chapter-id="${chapterId}"]`)?.focus();
    });
  };

  const handleChapterKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (filteredChapters.length === 0) return;

    const keyToIndex: Record<string, number> = {
      ArrowRight: (index + 1) % filteredChapters.length,
      ArrowDown: (index + 1) % filteredChapters.length,
      ArrowLeft: (index - 1 + filteredChapters.length) % filteredChapters.length,
      ArrowUp: (index - 1 + filteredChapters.length) % filteredChapters.length,
      Home: 0,
      End: filteredChapters.length - 1,
    };
    const nextIndex = keyToIndex[event.key];
    if (nextIndex === undefined) return;

    event.preventDefault();
    const nextChapter = filteredChapters[nextIndex];
    onSelectChapter(nextChapter.id);
    focusChapterButton(nextChapter.id);
  };

  return (
    <div className="atlas-constellation" aria-label={active ? `${active.title} concept constellation` : 'Empty Atlas constellation'}>
      <div className="atlas-constellation__stage" role="img" aria-labelledby="atlas-field-title atlas-field-desc">
        <svg viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id="atlas-field-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff4c2" stopOpacity="0.9" />
              <stop offset="52%" stopColor="#d4af37" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#050508" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="atlas-field-plate" cx="50%" cy="48%" r="62%">
              <stop offset="0%" stopColor="#221d11" stopOpacity="0.35" />
              <stop offset="58%" stopColor="#0b1118" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#050508" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect className="atlas-constellation__plate" x="76" y="40" width="848" height="584" rx="8" />
          <circle className="atlas-constellation__plate-glow" cx={center.x} cy={center.y} r="326" fill="url(#atlas-field-plate)" />
          <path className="atlas-constellation__grid-line" d="M 96 324 H 904" />
          <path className="atlas-constellation__grid-line atlas-constellation__grid-line--vertical" d="M 500 52 V 608" />
          {quadrants.map((quadrant) => (
            <g key={quadrant.id} className="atlas-constellation__quadrant">
              <path d={arcPath(quadrant.radius, quadrant.start, quadrant.end)} />
              <text x={quadrant.x} y={quadrant.y}>{quadrant.label}</text>
            </g>
          ))}
          <circle className="atlas-constellation__ring atlas-constellation__ring--outer" cx={center.x} cy={center.y} r="286" />
          <circle className="atlas-constellation__ring atlas-constellation__ring--inner" cx={center.x} cy={center.y} r="184" />
          <circle className="atlas-constellation__core-aura" cx={center.x} cy={center.y} r="164" />
          <circle className="atlas-constellation__core-glow" cx={center.x} cy={center.y} r="132" fill="url(#atlas-field-core)" />

          {fieldNodes.map((node) => (
            <path key={`${node.id}-thread`} className={`atlas-constellation__thread atlas-constellation__thread--${node.type}`} d={`M ${center.x} ${center.y} Q ${(center.x + node.x) / 2} ${node.y - 42}, ${node.x} ${node.y}`} />
          ))}

          {fieldNodes.map((node) => (
            <g key={node.id} className={`atlas-constellation__field-node atlas-constellation__field-node--${node.type}`} transform={`translate(${node.x} ${node.y})`}>
              <title>{node.label}</title>
              <circle className="atlas-constellation__node-orb" r={node.type === 'symbol' ? 31 : 25} />
              <circle className="atlas-constellation__node-kernel" r={node.type === 'symbol' ? 8 : 6} />
              <text textAnchor="middle" y={node.type === 'symbol' ? 55 : 48}>{trimNodeLabel(node.label)}</text>
            </g>
          ))}

          {active ? (
            <g className="atlas-constellation__center" transform={`translate(${center.x} ${center.y})`}>
              <circle r="88" />
              <text className="atlas-constellation__center-order" textAnchor="middle" y="-20">{String(active.order).padStart(2, '0')}</text>
              <text className="atlas-constellation__center-title" textAnchor="middle" y="14">{trimNodeLabel(active.title)}</text>
              <text className="atlas-constellation__center-label" textAnchor="middle" y="40">{active.cluster}</text>
            </g>
          ) : (
            <g className="atlas-constellation__center atlas-constellation__center--empty" transform={`translate(${center.x} ${center.y})`}>
              <circle r="88" />
              <text className="atlas-constellation__center-order" textAnchor="middle" y="-8">0</text>
              <text className="atlas-constellation__center-label" textAnchor="middle" y="22">No match</text>
            </g>
          )}
        </svg>

        <div className="sr-only">
          <h2 id="atlas-field-title">{fieldTitle}</h2>
          <p id="atlas-field-desc">{fieldDescription}</p>
        </div>
      </div>

      <div className="atlas-constellation__chapter-rail" role="radiogroup" aria-label={chapterResultText}>
        {filteredChapters.length > 0 ? (
          filteredChapters.map((chapter, index) => (
            <button
              key={chapter.id}
              type="button"
              role="radio"
              className={chapter.id === active?.id ? 'atlas-constellation__chapter atlas-constellation__chapter--active' : 'atlas-constellation__chapter'}
              data-atlas-chapter-id={chapter.id}
              onClick={() => onSelectChapter(chapter.id)}
              onKeyDown={(event) => handleChapterKeyDown(event, index)}
              aria-controls="atlas-selected-detail"
              aria-label={`Select chapter ${chapter.order}: ${chapter.title}`}
              aria-checked={chapter.id === active?.id}
              tabIndex={chapter.id === active?.id ? 0 : -1}
            >
              <span>{String(chapter.order).padStart(2, '0')}</span>
              <strong>{chapter.title}</strong>
              <em>{chapter.cluster}</em>
            </button>
          ))
        ) : (
          <p className="atlas-constellation__empty">No chapters match this search.</p>
        )}
      </div>

      <div className="atlas-constellation__relation-band" aria-label="Strongest visible relationships">
        {filteredChapters.length === 0 ? (
          <span>No matching chapter is currently in view.</span>
        ) : linkedRelationships.length > 0 ? (
          linkedRelationships.map((relationship) => (
            <span key={relationship.id}>
              <strong>{entityLabel(relationship.source)}</strong>
              <em>{relationship.relationType.replaceAll('_', ' ')}</em>
              <strong>{entityLabel(relationship.target)}</strong>
            </span>
          ))
        ) : (
          <span>No direct relationships are curated for this selection yet.</span>
        )}
      </div>
    </div>
  );
}
