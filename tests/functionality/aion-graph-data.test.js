import { chapters, concepts, symbols, edges, getChapter, getConcept, getChapterConceptMap, getRelatedConcepts } from '../../src/data/aion-graph/index.js';

describe('Aion graph data integrity', () => {
  test('has unique ids by collection', () => {
    const uniqueSize = (items) => new Set(items.map((item) => item.id)).size;

    expect(uniqueSize(chapters)).toBe(chapters.length);
    expect(uniqueSize(concepts)).toBe(concepts.length);
    expect(uniqueSize(symbols)).toBe(symbols.length);
  });

  test('does not contain broken references', () => {
    const chapterIds = new Set(chapters.map((chapter) => chapter.id));
    const conceptIds = new Set(concepts.map((concept) => concept.id));
    const symbolIds = new Set(symbols.map((symbol) => symbol.id));
    const allNodeIds = new Set([...chapterIds, ...conceptIds, ...symbolIds]);

    chapters.forEach((chapter) => {
      chapter.keyConceptIds.forEach((conceptId) => expect(conceptIds.has(conceptId)).toBe(true));
      chapter.relatedChapterIds.forEach((relatedId) => expect(chapterIds.has(relatedId)).toBe(true));
    });

    concepts.forEach((concept) => {
      concept.chapterRefs.forEach((chapterId) => expect(chapterIds.has(chapterId)).toBe(true));
      concept.symbolRefs.forEach((symbolId) => expect(symbolIds.has(symbolId)).toBe(true));
      concept.prerequisites.forEach((conceptId) => expect(conceptIds.has(conceptId)).toBe(true));
    });

    symbols.forEach((symbol) => {
      symbol.conceptIds.forEach((conceptId) => expect(conceptIds.has(conceptId)).toBe(true));
    });

    edges.forEach((edge) => {
      expect(allNodeIds.has(edge.source)).toBe(true);
      expect(allNodeIds.has(edge.target)).toBe(true);
    });
  });
});

describe('Aion graph helper queries', () => {
  test('resolves chapters and concepts by id', () => {
    expect(getChapter('ch1')?.title).toBe('The Ego');
    expect(getChapter('missing')).toBeNull();

    expect(getConcept('shadow')?.label).toBe('The Shadow');
    expect(getConcept('missing')).toBeNull();
  });

  test('builds chapter concept map for all chapters', () => {
    const map = getChapterConceptMap();

    expect(Object.keys(map)).toHaveLength(chapters.length);
    expect(map.ch1.map((concept) => concept.id)).toContain('ego');
  });

  test('returns related concepts for a concept id', () => {
    const related = getRelatedConcepts('shadow').map((concept) => concept.id);

    expect(related).toContain('ego');
    expect(related).toContain('individuation');
    expect(getRelatedConcepts('missing')).toEqual([]);
  });
});
