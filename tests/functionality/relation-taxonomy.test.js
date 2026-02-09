const fs = require('fs');
const path = require('path');

const taxonomyPath = path.join(process.cwd(), 'src/data/aion-core/relation-taxonomy.json');
const edgesPath = path.join(process.cwd(), 'src/data/aion-graph/edges.json');
const conceptMapperPath = path.join(process.cwd(), 'src/concept-mapper.js');

const relationTaxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
const edges = JSON.parse(fs.readFileSync(edgesPath, 'utf8'));
const conceptMapperSource = fs.readFileSync(conceptMapperPath, 'utf8');

describe('Relation taxonomy consistency', () => {
  test('all graph edges use approved taxonomy keys', () => {
    const taxonomyKeys = new Set(Object.keys(relationTaxonomy));

    edges.forEach((edge) => {
      expect(taxonomyKeys.has(edge.relationType)).toBe(true);
    });
  });

  test('concept mapper relationship types resolve to taxonomy entries', () => {
    const taxonomyKeys = new Set(Object.keys(relationTaxonomy));
    const relationTypeMatches = [...conceptMapperSource.matchAll(/type:\\s*'([a-z_]+)'/g)];
    const relationTypes = new Set(relationTypeMatches.map(([, relationType]) => relationType));

    relationTypes.forEach((relationType) => {
      expect(taxonomyKeys.has(relationType)).toBe(true);
    });
  });

  test('displayed relation labels in concept mapper map to taxonomy labels', () => {
    const taxonomyLabels = new Set(Object.values(relationTaxonomy).map((entry) => entry.label));
    const lookupLabelMatches = [...conceptMapperSource.matchAll(/label:\\s*'([^']+)'/g)];
    const displayedLabels = new Set(lookupLabelMatches.map(([, label]) => label));

    displayedLabels.forEach((label) => {
      expect(taxonomyLabels.has(label)).toBe(true);
    });
  });
});

