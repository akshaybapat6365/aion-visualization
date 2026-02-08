const fs = require('node:fs');
const path = require('node:path');

const requiredFields = [
  'whyThisMatters',
  'coreTerms',
  'conceptChecks',
  'reflectionPrompt',
  'relatedChapterIds',
  'relatedConceptIds'
];

describe('Chapter content contract regression', () => {
  const contractsPath = path.resolve(process.cwd(), 'src/data/chapter-content/contracts.json');
  const contracts = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));

  test('all 14 chapters expose required contract fields', () => {
    expect(contracts).toHaveLength(14);

    contracts.forEach((contract) => {
      requiredFields.forEach((field) => {
        expect(Object.hasOwn(contract, field)).toBe(true);
      });
    });
  });

  test('standard and enhanced chapter pages mount contract-backed sections', () => {
    const variants = ['standard', 'enhanced'];

    variants.forEach((variant) => {
      for (let i = 1; i <= 14; i += 1) {
        const chapterPath = path.resolve(process.cwd(), `chapters/${variant}/chapter-${i}.html`);
        const html = fs.readFileSync(chapterPath, 'utf8');

        expect(html).toContain('data-chapter-contract-root');
        expect(html).toContain(`data-chapter-id="ch${i}"`);
        expect(html).toContain('chapter-content-contract.js');
      }
    });
  });
});
