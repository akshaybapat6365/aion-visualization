import chaptersJson from '../../data/aion-core/chapters.json';
import conceptsJson from '../../data/aion-core/concepts.json';
import learningObjectsJson from '../../data/aion-core/learning-objects.json';
import relationshipsJson from '../../data/aion-core/relationships.json';
import symbolsJson from '../../data/aion-core/symbols.json';

import type {
  ChapterId,
  ChapterRecord,
  ConceptRecord,
  LearningObjectRecord,
  RelationshipRecord,
  SymbolRecord,
} from '../types';

const chapters = [...chaptersJson.chapters].sort((a, b) => a.order - b.order) as ChapterRecord[];
const concepts = conceptsJson.concepts as ConceptRecord[];
const symbols = symbolsJson.symbols as SymbolRecord[];
const relationships = relationshipsJson.relationships as RelationshipRecord[];
const learningObjects = learningObjectsJson.learningObjects as LearningObjectRecord[];

const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
const learningObjectsByChapter = new Map<ChapterId, LearningObjectRecord[]>();

for (const item of learningObjects) {
  const list = learningObjectsByChapter.get(item.chapterId) || [];
  list.push(item);
  learningObjectsByChapter.set(item.chapterId, list);
}

export function normalizeChapterId(raw: string | null | undefined): ChapterId {
  const value = String(raw || '').trim().toLowerCase();
  const chapterMatch = value.match(/^chapter-?(\d+)$/);
  const shorthandMatch = value.match(/^ch(\d+)$/);
  const numericMatch = value.match(/^(\d+)$/);
  const number = Number(chapterMatch?.[1] || shorthandMatch?.[1] || numericMatch?.[1] || 1);
  const clamped = Math.min(14, Math.max(1, Number.isFinite(number) ? number : 1));
  return `ch${clamped}` as ChapterId;
}

export function getChapters(): ChapterRecord[] {
  return chapters;
}

export function getChapterById(id: string | null | undefined): ChapterRecord | null {
  return chapterById.get(normalizeChapterId(id)) || null;
}

export function getConcepts(): ConceptRecord[] {
  return concepts;
}

export function getSymbols(): SymbolRecord[] {
  return symbols;
}

export function getRelationships(): RelationshipRecord[] {
  return relationships;
}

export function getLearningObjectsForChapter(id: string): LearningObjectRecord[] {
  return learningObjectsByChapter.get(normalizeChapterId(id)) || [];
}

export function getConceptsForChapter(id: string): ConceptRecord[] {
  const chapter = getChapterById(id);
  if (!chapter) return [];
  return chapter.keyConceptIds
    .map((conceptId) => conceptById.get(conceptId))
    .filter((concept): concept is ConceptRecord => Boolean(concept));
}

export function getChapterRoute(id: string): string {
  return `/journey/chapter/${normalizeChapterId(id)}`;
}

export function getLegacyChapterRedirect(pathname: string): string | null {
  const match = pathname.match(/\/chapters\/chapter-(\d+)\.html$/);
  if (!match) return null;
  return getChapterRoute(`ch${match[1]}`);
}

export function getAdjacentChapters(id: string): {
  previous: ChapterRecord | null;
  next: ChapterRecord | null;
} {
  const chapter = getChapterById(id);
  if (!chapter) return { previous: null, next: null };
  const index = chapters.findIndex((item) => item.id === chapter.id);
  return {
    previous: index > 0 ? chapters[index - 1] : null,
    next: index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null,
  };
}
