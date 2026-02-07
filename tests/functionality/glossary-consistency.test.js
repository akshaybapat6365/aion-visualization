const fs = require('fs');
const path = require('path');

const glossaryPath = path.resolve(process.cwd(), 'docs/glossary.md');

function normalizeVariant(term) {
  return term
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b(the|a|an)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function singularizeSimple(term) {
  if (term.endsWith('ies')) return `${term.slice(0, -3)}y`;
  if (term.endsWith('ses')) return term.slice(0, -2);
  if (term.endsWith('s') && !term.endsWith('ss')) return term.slice(0, -1);
  return term;
}

function extractTerms(markdown) {
  return markdown
    .split('\n')
    .map((line) => line.match(/^\s*-\s*\*\*(.+?)\*\*\s*:/))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

describe('Glossary consistency', () => {
  test('has no exact duplicate terms (case-insensitive)', () => {
    const glossary = fs.readFileSync(glossaryPath, 'utf8');
    const terms = extractTerms(glossary);
    const seen = new Map();
    const duplicates = [];

    terms.forEach((term) => {
      const key = term.toLowerCase();
      if (seen.has(key)) duplicates.push([seen.get(key), term]);
      else seen.set(key, term);
    });

    expect(duplicates).toEqual([]);
  });

  test('has no simple variant collisions (spacing/hyphen/plural/article)', () => {
    const glossary = fs.readFileSync(glossaryPath, 'utf8');
    const terms = extractTerms(glossary);
    const normalizedIndex = new Map();
    const collisions = [];

    terms.forEach((term) => {
      const normalized = normalizeVariant(term);
      const singular = singularizeSimple(normalized);
      const key = singular;

      if (normalizedIndex.has(key)) {
        const existing = normalizedIndex.get(key);
        if (existing !== term) collisions.push([existing, term]);
      } else {
        normalizedIndex.set(key, term);
      }
    });

    expect(collisions).toEqual([]);
  });
});
