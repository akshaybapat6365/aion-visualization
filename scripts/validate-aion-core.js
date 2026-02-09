#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv2020 from 'ajv/dist/2020.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coreDir = path.resolve(__dirname, '../src/data/aion-core');

const files = {
  chapters: 'chapters.json',
  concepts: 'concepts.json',
  symbols: 'symbols.json',
  relationships: 'relationships.json',
  learningObjects: 'learning-objects.json'
};

const schemaFiles = {
  chapters: 'chapters.schema.json',
  concepts: 'concepts.schema.json',
  symbols: 'symbols.schema.json',
  relationships: 'relationships.schema.json',
  learningObjects: 'learning-objects.schema.json'
};

function readJson(fileName) {
  const fullPath = path.join(coreDir, fileName);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

const dataset = {
  chapters: readJson(files.chapters),
  concepts: readJson(files.concepts),
  symbols: readJson(files.symbols),
  relationships: readJson(files.relationships),
  learningObjects: readJson(files.learningObjects)
};

const errors = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function validateSchemas() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });

  Object.entries(schemaFiles).forEach(([key, schemaFile]) => {
    const schema = readJson(schemaFile);
    const validate = ajv.compile(schema);
    const valid = validate(dataset[key]);
    if (!valid) {
      validate.errors.forEach((error) => {
        const instancePath = error.instancePath || '/';
        errors.push(`[schema:${key}] ${instancePath} ${error.message}`);
      });
    }
  });
}

function findDuplicateLabels(items, labelKey, collectionName) {
  const seen = new Map();
  items.forEach((item) => {
    const raw = item[labelKey];
    if (typeof raw !== 'string') {
      return;
    }

    const normalized = raw.trim().toLowerCase();
    if (seen.has(normalized)) {
      errors.push(`[duplicates:${collectionName}] "${raw}" duplicated in ${seen.get(normalized)} and ${item.id}`);
      return;
    }

    seen.set(normalized, item.id);
  });
}

function validateReferences() {
  const chapters = dataset.chapters.chapters;
  const concepts = dataset.concepts.concepts;
  const symbols = dataset.symbols.symbols;
  const relationships = dataset.relationships.relationships;
  const learningObjects = dataset.learningObjects.learningObjects;

  const chapterIds = new Set(chapters.map((chapter) => chapter.id));
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const symbolIds = new Set(symbols.map((symbol) => symbol.id));
  const learningObjectIds = new Set(learningObjects.map((item) => item.id));

  chapters.forEach((chapter) => {
    chapter.keyConceptIds.forEach((conceptId) => {
      assert(conceptIds.has(conceptId), `[broken-ref] chapter ${chapter.id} -> keyConcept ${conceptId}`);
    });

    chapter.relatedChapterIds.forEach((relatedChapterId) => {
      assert(chapterIds.has(relatedChapterId), `[broken-ref] chapter ${chapter.id} -> relatedChapter ${relatedChapterId}`);
    });

    chapter.learningObjectIds.forEach((itemId) => {
      assert(learningObjectIds.has(itemId), `[broken-ref] chapter ${chapter.id} -> learningObject ${itemId}`);
    });
  });

  concepts.forEach((concept) => {
    concept.chapterRefs.forEach((chapterId) => {
      assert(chapterIds.has(chapterId), `[broken-ref] concept ${concept.id} -> chapter ${chapterId}`);
    });

    concept.symbolRefs.forEach((symbolId) => {
      assert(symbolIds.has(symbolId), `[broken-ref] concept ${concept.id} -> symbol ${symbolId}`);
    });

    concept.prerequisites.forEach((prerequisiteId) => {
      assert(conceptIds.has(prerequisiteId), `[broken-ref] concept ${concept.id} -> prerequisite ${prerequisiteId}`);
    });
  });

  symbols.forEach((symbol) => {
    symbol.conceptIds.forEach((conceptId) => {
      assert(conceptIds.has(conceptId), `[broken-ref] symbol ${symbol.id} -> concept ${conceptId}`);
    });
  });

  const nodeIds = new Set([...chapterIds, ...conceptIds, ...symbolIds]);
  relationships.forEach((relationship) => {
    assert(nodeIds.has(relationship.source), `[broken-ref] relationship ${relationship.id} -> source ${relationship.source}`);
    assert(nodeIds.has(relationship.target), `[broken-ref] relationship ${relationship.id} -> target ${relationship.target}`);
  });

  learningObjects.forEach((item) => {
    assert(chapterIds.has(item.chapterId), `[broken-ref] learningObject ${item.id} -> chapter ${item.chapterId}`);
  });
}

function validateOrphans() {
  const chapters = dataset.chapters.chapters;
  const concepts = dataset.concepts.concepts;
  const symbols = dataset.symbols.symbols;

  const conceptRefsFromChapters = new Set(chapters.flatMap((chapter) => chapter.keyConceptIds));
  const conceptRefsFromSymbols = new Set(symbols.flatMap((symbol) => symbol.conceptIds));

  concepts.forEach((concept) => {
    const coveredByChapter = conceptRefsFromChapters.has(concept.id);
    const coveredBySymbol = conceptRefsFromSymbols.has(concept.id);
    const hasChapterRefs = concept.chapterRefs.length > 0;

    assert(
      coveredByChapter || coveredBySymbol || hasChapterRefs,
      `[orphan-concept] concept ${concept.id} is not connected through chapter keyConceptIds, symbol conceptIds, or chapterRefs`
    );
  });

  chapters.forEach((chapter) => {
    const hasConceptLinks = chapter.keyConceptIds.length > 0;
    const hasRelations = chapter.relatedChapterIds.length > 0;
    assert(hasConceptLinks || hasRelations, `[orphan-chapter] chapter ${chapter.id} has no concept links or chapter relationships`);
  });
}

validateSchemas();

if (errors.length === 0) {
  findDuplicateLabels(dataset.chapters.chapters, 'title', 'chapters');
  findDuplicateLabels(dataset.concepts.concepts, 'label', 'concepts');
  findDuplicateLabels(dataset.symbols.symbols, 'label', 'symbols');
  validateReferences();
  validateOrphans();
}

if (errors.length > 0) {
  console.error('Aion core validation failed:');
  errors.forEach((error) => console.error(` - ${error}`));
  process.exit(1);
}

console.log('Aion core validation passed.');
