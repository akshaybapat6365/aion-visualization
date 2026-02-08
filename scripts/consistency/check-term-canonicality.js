#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const glossaryPath = path.join(ROOT, 'src/data/glossary/canonical-glossary.json');
const chapterFiles = [
  'src/chapter5.html',
  'src/chapter6.html',
  'src/chapter8.html',
  'src/chapter9.html',
  'src/chapter12.html',
  'src/chapter13.html',
  'src/chapter14.html'
];

const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
const termMap = new Map(glossary.terms.map((term) => [term.id, term]));

const issues = [];

for (const chapter of chapterFiles) {
  const html = fs.readFileSync(path.join(ROOT, chapter), 'utf8');
  const cardRegex = /<div class="concept-card" data-term-id="([^"]+)">([\s\S]*?)<\/div>/g;
  let match;

  while ((match = cardRegex.exec(html))) {
    const [, termId, cardContent] = match;
    const term = termMap.get(termId);

    if (!term) {
      issues.push(`${chapter}: missing glossary term for id "${termId}"`);
      continue;
    }

    const labelMatch = cardContent.match(/<h3>([^<]+)<\/h3>/);
    const definitionMatch = cardContent.match(/<p class="concept-definition" data-definition-tier="([^"]+)">([^<]*)<\/p>/);

    if (!labelMatch) {
      issues.push(`${chapter}: term "${termId}" has no h3 label.`);
      continue;
    }

    const actualLabel = labelMatch[1].trim();
    if (actualLabel !== term.canonicalLabel) {
      issues.push(`${chapter}: term "${termId}" label mismatch. html="${actualLabel}" glossary="${term.canonicalLabel}"`);
    }

    if (!definitionMatch) {
      issues.push(`${chapter}: term "${termId}" missing canonical definition placeholder.`);
      continue;
    }

    const tier = definitionMatch[1] || 'beginner';
    const expectedDefinition = term.definitionTiers[tier] || term.definitionTiers.beginner;
    const currentDefinition = definitionMatch[2].trim();

    if (currentDefinition && currentDefinition !== expectedDefinition) {
      issues.push(`${chapter}: term "${termId}" ${tier} definition drift detected.`);
    }
  }
}

if (issues.length) {
  console.error('❌ Canonicality drift detected:\n');
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}

console.log('✅ Canonical glossary check passed.');
