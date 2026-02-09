import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const { chapters } = require('../aion-core/chapters.json');
const { concepts } = require('../aion-core/concepts.json');
const { symbols } = require('../aion-core/symbols.json');
const { relationships } = require('../aion-core/relationships.json');

const edges = relationships.map((relationship) => ({
  source: relationship.source,
  target: relationship.target,
  relationType: relationship.relationType,
  weight: relationship.weight,
  narrativeNotes: relationship.narrativeNotes
}));

const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));

export { chapters, concepts, symbols, edges };

export function getChapter(id) {
  return chapterById.get(id) ?? null;
}

export function getConcept(id) {
  return conceptById.get(id) ?? null;
}

export function getChapterConceptMap() {
  return chapters.reduce((acc, chapter) => {
    acc[chapter.id] = chapter.keyConceptIds
      .map((conceptId) => conceptById.get(conceptId))
      .filter(Boolean);
    return acc;
  }, {});
}

export function getRelatedConcepts(id) {
  const concept = getConcept(id);
  if (!concept) {
    return [];
  }

  const relatedIds = new Set(concept.prerequisites);

  concepts.forEach((candidate) => {
    if (candidate.id !== id && candidate.prerequisites.includes(id)) {
      relatedIds.add(candidate.id);
    }

    if (candidate.id !== id && candidate.chapterRefs.some((chapterId) => concept.chapterRefs.includes(chapterId))) {
      relatedIds.add(candidate.id);
    }
  });

  edges.forEach((edge) => {
    if (edge.source === id && conceptById.has(edge.target)) {
      relatedIds.add(edge.target);
    }

    if (edge.target === id && conceptById.has(edge.source)) {
      relatedIds.add(edge.source);
    }
  });

  symbols.forEach((symbol) => {
    if (symbol.conceptIds.includes(id)) {
      symbol.conceptIds.forEach((conceptId) => {
        if (conceptId !== id) {
          relatedIds.add(conceptId);
        }
      });
    }
  });

  return Array.from(relatedIds)
    .map((relatedId) => conceptById.get(relatedId))
    .filter(Boolean);
}
