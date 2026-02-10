#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const coreDir = path.join(repoRoot, 'src/data/aion-core');
const engineConfigDir = path.join(repoRoot, 'src/features/chapter-engine/config');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

const chapters = readJson(path.join(coreDir, 'chapters.json')).chapters;
const concepts = readJson(path.join(coreDir, 'concepts.json')).concepts;
const symbols = readJson(path.join(coreDir, 'symbols.json')).symbols;
const relationships = readJson(path.join(coreDir, 'relationships.json')).relationships;
const learningObjects = readJson(path.join(coreDir, 'learning-objects.json')).learningObjects;
const taxonomy = readJson(path.join(coreDir, 'relation-taxonomy.json'));

const conceptById = new Map(concepts.map((c) => [c.id, c]));
const symbolById = new Map(symbols.map((s) => [s.id, s]));
const motionByRelationType = new Map(Object.entries(taxonomy).map(([key, value]) => [key, value.motionBehavior]));

function unique(items) {
  return Array.from(new Set(items));
}

function pickChapterLearningObject(chapterId, type) {
  return learningObjects.find((item) => item.chapterId === chapterId && item.type === type) || null;
}

function buildInlineMapForChapter(chapter) {
  const keyConcepts = chapter.keyConceptIds
    .map((id) => conceptById.get(id))
    .filter(Boolean)
    .slice(0, 4);

  const symbolIds = unique(
    keyConcepts.flatMap((concept) => (concept.symbolRefs || []).slice(0, 1))
  )
    .filter((id) => symbolById.has(id))
    .slice(0, 3);

  const nodes = [
    ...keyConcepts.map((concept) => ({ id: concept.id, label: concept.label, type: 'concept' })),
    ...symbolIds.map((id) => {
      const symbol = symbolById.get(id);
      return { id: symbol.id, label: symbol.label, type: 'symbol' };
    })
  ];

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = relationships
    .filter((rel) => nodeIds.has(rel.source) && nodeIds.has(rel.target))
    .map((rel) => ({
      from: rel.source,
      to: rel.target,
      relationType: rel.relationType
    }));

  return {
    caption: 'Constellation: key motifs and how they connect.',
    nodes,
    edges
  };
}

function buildFactsForChapter(chapter, map) {
  const conceptLabels = (chapter.keyConceptIds || [])
    .map((id) => conceptById.get(id)?.label)
    .filter(Boolean);

  const symbolLabels = (map.nodes || [])
    .filter((node) => node.type === 'symbol')
    .map((node) => node.label);

  const motionBehaviors = unique(
    (map.edges || [])
      .map((edge) => motionByRelationType.get(edge.relationType))
      .filter(Boolean)
  );

  return [
    { label: 'Key concepts', value: conceptLabels.join(' · ') || '—' },
    { label: 'Primary symbols', value: symbolLabels.join(' · ') || '—' },
    { label: 'Motion grammar', value: motionBehaviors.join(' · ') || '—' }
  ];
}

function buildChecksForChapter(chapter) {
  const conceptCheck = pickChapterLearningObject(chapter.id, 'concept-check');
  const reflection = pickChapterLearningObject(chapter.id, 'reflection-prompt');

  const keyConceptLabel = conceptById.get(chapter.keyConceptIds?.[0])?.label || 'a core term';

  return [
    {
      question: conceptCheck?.prompt || `Name the central dynamic in "${chapter.title}" and connect it to one related concept.`,
      hint: 'Use the constellation map: pick one connection and explain it in your own words.'
    },
    {
      question: reflection?.prompt || `Where does "${keyConceptLabel}" show up in your life as tension, symbol, or projection?`,
      hint: 'Try writing one concrete example, then identify the opposite value you resist holding with it.'
    }
  ];
}

function buildConfigForChapter(chapter) {
  const nextChapter = chapters.find((candidate) => candidate.order === chapter.order + 1) || null;
  const prevChapter = chapters.find((candidate) => candidate.order === chapter.order - 1) || null;

  const map = buildInlineMapForChapter(chapter);
  const facts = buildFactsForChapter(chapter, map);
  const checks = buildChecksForChapter(chapter);

  const nextLinks = [
    ...(prevChapter ? [{ label: `Previous: ${prevChapter.title}`, href: `/journey/chapter/ch${prevChapter.order}` }] : []),
    ...(nextChapter ? [{ label: `Next: ${nextChapter.title}`, href: `/journey/chapter/ch${nextChapter.order}` }] : []),
    { label: 'All chapters', href: '/chapters/index.html' }
  ];

  const synthesis = nextChapter
    ? `${chapter.summary} Next, "${nextChapter.title}" extends the same symbolic field under a new historical and conceptual register.`
    : chapter.summary;

  return {
    id: chapter.id,
    sections: [
      {
        key: 'header-thesis',
        chapterLabel: `Chapter ${chapter.order}: ${chapter.cluster}`,
        title: chapter.title,
        thesis: chapter.summary
      },
      {
        key: 'why-this-matters',
        body: `This chapter matters because it clarifies the lens you will use throughout Aion: symbolic tensions are not distractions, but the material of psychological transformation.`
      },
      {
        key: 'core-terms',
        terms: (chapter.keyConceptIds || [])
          .slice(0, 4)
          .map((conceptId) => conceptById.get(conceptId))
          .filter(Boolean)
          .map((concept) => ({
            termId: concept.id,
            term: concept.label,
            definitionTier: 'beginner',
            definition: concept.definition
          }))
      },
      {
        key: 'primary-visualization',
        instructions: 'Hover or focus nodes in the constellation to orient yourself. Use the links below to continue the journey.',
        map
      },
      {
        key: 'insight-checks',
        checks
      },
      {
        key: 'symbol-relationship-panel',
        facts
      },
      {
        key: 'synthesis',
        body: `Synthesis: ${synthesis}`
      },
      {
        key: 'reflection-next-links',
        prompt: 'Reflection: choose one symbol or concept from this chapter and describe how it changes when you hold its opposite with it.',
        nextLinks
      }
    ]
  };
}

if (!fs.existsSync(engineConfigDir)) {
  console.error(`Missing chapter engine config directory: ${engineConfigDir}`);
  process.exit(1);
}

const generated = chapters
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((chapter) => ({ chapter, config: buildConfigForChapter(chapter) }));

generated.forEach(({ chapter, config }) => {
  const targetPath = path.join(engineConfigDir, `${chapter.id}.json`);
  writeJson(targetPath, config);
});

console.log(`Generated ${generated.length} chapter engine configs in ${engineConfigDir}.`);
