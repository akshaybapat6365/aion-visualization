import type { ChapterRecord } from '../types';

export default function ChapterSigil({
  chapter,
  compact = false,
}: {
  chapter: ChapterRecord;
  compact?: boolean;
}) {
  const spokes = Array.from({ length: 8 }, (_, index) => index);
  return (
    <svg
      className={compact ? 'chapter-sigil chapter-sigil--compact' : 'chapter-sigil'}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Visual sigil for ${chapter.title}`}
    >
      <circle className="chapter-sigil__outer" cx="60" cy="60" r="51" />
      <circle className="chapter-sigil__inner" cx="60" cy="60" r={18 + (chapter.order % 4) * 4} />
      {spokes.map((spoke) => {
        const angle = (spoke / spokes.length) * Math.PI * 2 + chapter.order * 0.08;
        const x1 = 60 + Math.cos(angle) * 24;
        const y1 = 60 + Math.sin(angle) * 24;
        const x2 = 60 + Math.cos(angle) * (43 + (chapter.order % 3) * 3);
        const y2 = 60 + Math.sin(angle) * (43 + (chapter.order % 3) * 3);
        return <line key={spoke} className="chapter-sigil__spoke" x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
      <text className="chapter-sigil__number" x="60" y="65" textAnchor="middle">
        {String(chapter.order).padStart(2, '0')}
      </text>
    </svg>
  );
}
