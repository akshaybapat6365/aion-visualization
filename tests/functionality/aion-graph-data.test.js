const fs = require('fs');
const path = require('path');

const coreDir = path.join(process.cwd(), 'src/data/aion-core');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(coreDir, relativePath), 'utf8'));
}

const chapters = readJson('chapters.json').chapters;
const concepts = readJson('concepts.json').concepts;
const symbols = readJson('symbols.json').symbols;
const relationships = readJson('relationships.json').relationships;

const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));

const edges = relationships.map((rel) => ({
  source: rel.source,
  target: rel.target,
  relationType: rel.relationType,
  weight: rel.weight
}));

function getChapter(id) {
  return chapterById.get(id) || null;
}

function getConcept(id) {
  return conceptById.get(id) || null;
}

function getChapterConceptMap() {
  return chapters.reduce((acc, chapter) => {
    acc[chapter.id] = chapter.keyConceptIds
      .map((conceptId) => conceptById.get(conceptId))
      .filter(Boolean);
    return acc;
  }, {});
}

function getRelatedConcepts(id) {
  const concept = getConcept(id);
  if (!concept) return [];

  const relatedIds = new Set(concept.prerequisites);

  edges.forEach((edge) => {
    if (edge.source === id && conceptById.has(edge.target)) relatedIds.add(edge.target);
    if (edge.target === id && conceptById.has(edge.source)) relatedIds.add(edge.source);
  });

  return Array.from(relatedIds).map((relatedId) => conceptById.get(relatedId)).filter(Boolean);
}

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

    expect(getConcept('shadow')?.label).toBe('Shadow');
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

