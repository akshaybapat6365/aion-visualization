#!/usr/bin/env node

import { chapters, concepts, symbols, edges } from '../src/data/aion-graph/index.js';
import { relationTaxonomy } from '../src/data/aion-core/relation-taxonomy.js';

const chapterIds = new Set(chapters.map((chapter) => chapter.id));
const conceptIds = new Set(concepts.map((concept) => concept.id));
const symbolIds = new Set(symbols.map((symbol) => symbol.id));
const allowedDifficulty = new Set(['foundational', 'intermediate', 'advanced']);
const relationTypes = new Set(Object.keys(relationTaxonomy));

const errors = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

chapters.forEach((chapter) => {
  assert(typeof chapter.id === 'string' && chapter.id.length > 0, 'Chapter must have a non-empty string id');
  assert(Number.isInteger(chapter.order), `Chapter ${chapter.id} must have an integer order`);
  chapter.keyConceptIds.forEach((conceptId) => {
    assert(conceptIds.has(conceptId), `Chapter ${chapter.id} references missing concept ${conceptId}`);
  });
  chapter.relatedChapterIds.forEach((relatedId) => {
    assert(chapterIds.has(relatedId), `Chapter ${chapter.id} references missing related chapter ${relatedId}`);
  });
});

concepts.forEach((concept) => {
  assert(typeof concept.id === 'string' && concept.id.length > 0, 'Concept must have a non-empty string id');
  assert(allowedDifficulty.has(concept.difficulty), `Concept ${concept.id} has invalid difficulty ${concept.difficulty}`);
  concept.chapterRefs.forEach((chapterId) => {
    assert(chapterIds.has(chapterId), `Concept ${concept.id} references missing chapter ${chapterId}`);
  });
  concept.symbolRefs.forEach((symbolId) => {
    assert(symbolIds.has(symbolId), `Concept ${concept.id} references missing symbol ${symbolId}`);
  });
  concept.prerequisites.forEach((conceptId) => {
    assert(conceptIds.has(conceptId), `Concept ${concept.id} has missing prerequisite ${conceptId}`);
  });
});

symbols.forEach((symbol) => {
  assert(typeof symbol.id === 'string' && symbol.id.length > 0, 'Symbol must have a non-empty string id');
  symbol.conceptIds.forEach((conceptId) => {
    assert(conceptIds.has(conceptId), `Symbol ${symbol.id} references missing concept ${conceptId}`);
  });
});

const allNodeIds = new Set([...chapterIds, ...conceptIds, ...symbolIds]);
edges.forEach((edge, index) => {
  assert(allNodeIds.has(edge.source), `Edge[${index}] references missing source ${edge.source}`);
  assert(allNodeIds.has(edge.target), `Edge[${index}] references missing target ${edge.target}`);
  assert(typeof edge.relationType === 'string' && edge.relationType.length > 0, `Edge[${index}] missing relationType`);
  assert(relationTypes.has(edge.relationType), `Edge[${index}] has unknown relationType ${edge.relationType}`);
  assert(typeof edge.weight === 'number' && edge.weight >= 0 && edge.weight <= 1, `Edge[${index}] has invalid weight`);
});

if (errors.length > 0) {
  console.error('Aion graph validation failed:');
  errors.forEach((error) => console.error(` - ${error}`));
  process.exit(1);
}

console.log('Aion graph validation passed.');
