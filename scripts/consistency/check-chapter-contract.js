import fs from 'node:fs/promises';
import path from 'node:path';

const requiredFields = [
  'whyThisMatters',
  'coreTerms',
  'conceptChecks',
  'reflectionPrompt',
  'relatedChapterIds',
  'relatedConceptIds'
];

const repoRoot = process.cwd();
const contractPath = path.resolve(repoRoot, 'src/data/chapter-content/contracts.json');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

const raw = await fs.readFile(contractPath, 'utf8');
const contracts = JSON.parse(raw);

if (!Array.isArray(contracts) || contracts.length !== 14) {
  fail(`Expected 14 chapter contracts, found ${Array.isArray(contracts) ? contracts.length : 'invalid structure'}.`);
}

for (const contract of contracts) {
  if (!contract.id) {
    fail('Every chapter contract must include an id.');
  }

  for (const field of requiredFields) {
    if (!Object.hasOwn(contract, field)) {
      fail(`Chapter ${contract.id} is missing required field "${field}".`);
    }
  }

  if (!Array.isArray(contract.coreTerms) || contract.coreTerms.length === 0) {
    fail(`Chapter ${contract.id} must include at least one core term.`);
  }

  if (!Array.isArray(contract.conceptChecks) || contract.conceptChecks.length === 0) {
    fail(`Chapter ${contract.id} must include at least one concept check.`);
  }
}

console.log('✅ Chapter content contracts are complete for all 14 chapters.');
