#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));

const relationTaxonomy = readJson('src/data/aion-core/relation-taxonomy.json');
const edges = readJson('src/data/aion-graph/edges.json');

const taxonomyKeys = new Set(Object.keys(relationTaxonomy));
const unknownEdges = edges.filter((edge) => !taxonomyKeys.has(edge.relationType));

if (unknownEdges.length > 0) {
  console.error('Unknown relationType keys found in src/data/aion-graph/edges.json:');
  unknownEdges.forEach((edge, index) => {
    console.error(`${index + 1}. ${edge.source} -> ${edge.target}: ${edge.relationType}`);
  });
  process.exit(1);
}

console.log(`Relation taxonomy check passed (${edges.length} edges validated, ${taxonomyKeys.size} approved relation types).`);
