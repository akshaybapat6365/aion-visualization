import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const relationTaxonomy = require('./relation-taxonomy.json');

export { relationTaxonomy };

export function getRelationDefinition(relationType) {
  return relationTaxonomy[relationType] ?? null;
}

export function getRelationLabel(relationType) {
  return getRelationDefinition(relationType)?.label ?? relationType.replace(/_/g, ' ');
}

export function getRelationMotionBehavior(relationType) {
  return getRelationDefinition(relationType)?.motionBehavior ?? 'integration';
}

export function getRelationKeys() {
  return Object.keys(relationTaxonomy);
}
