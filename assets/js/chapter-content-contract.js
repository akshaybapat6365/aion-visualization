const REQUIRED_SECTIONS = [
  'whyThisMatters',
  'coreTerms',
  'conceptChecks',
  'reflectionPrompt',
  'relatedChapterIds',
  'relatedConceptIds'
];

function parseGlossary(markdown) {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- **') && line.includes(':'))
    .reduce((acc, line) => {
      const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
      if (match) {
        acc[match[1].toLowerCase()] = match[2].trim();
      }
      return acc;
    }, {});
}

function requireSections(contract) {
  return REQUIRED_SECTIONS.every((key) => contract && Object.hasOwn(contract, key));
}

function relatedChapterLabel(chapterById, chapterId) {
  const related = chapterById.get(chapterId);
  return related ? `Chapter ${related.order}: ${related.title}` : chapterId;
}

async function renderChapterContract(root) {
  const chapterId = root.dataset.chapterId;
  if (!chapterId) return;

  const [contractsResponse, chaptersResponse, conceptsResponse, glossaryResponse] = await Promise.all([
    fetch('../../src/data/chapter-content/contracts.json'),
    fetch('../../src/data/aion-graph/chapters.json'),
    fetch('../../src/data/aion-graph/concepts.json'),
    fetch('../../docs/glossary.md')
  ]);

  const [contracts, chapters, concepts, glossaryMarkdown] = await Promise.all([
    contractsResponse.json(),
    chaptersResponse.json(),
    conceptsResponse.json(),
    glossaryResponse.text()
  ]);

  const contract = contracts.find((entry) => entry.id === chapterId);
  if (!requireSections(contract)) {
    throw new Error(`Contract missing required sections for ${chapterId}`);
  }

  const chapterById = new Map(chapters.map((entry) => [entry.id, entry]));
  const conceptById = new Map(concepts.map((entry) => [entry.id, entry]));
  const glossary = parseGlossary(glossaryMarkdown);

  const coreTermItems = contract.coreTerms
    .map((termId) => {
      const concept = conceptById.get(termId);
      if (!concept) {
        return `<li><strong>${termId}</strong>: Definition unavailable.</li>`;
      }

      const glossaryDefinition = glossary[concept.label.toLowerCase()];
      const definition = glossaryDefinition || concept.definition;
      return `<li><strong>${concept.label}</strong>: ${definition}</li>`;
    })
    .join('');

  root.innerHTML = `
    <section class="chapter-section chapter-contract-section" aria-label="Contracted chapter learning content">
      <h2>Why This Chapter Matters</h2>
      <p>${contract.whyThisMatters}</p>

      <h3>Core Terms</h3>
      <ul>${coreTermItems}</ul>

      <h3>Concept Checks</h3>
      <ul>${contract.conceptChecks.map((check) => `<li>${check}</li>`).join('')}</ul>

      <h3>Reflection Prompt</h3>
      <p>${contract.reflectionPrompt}</p>

      <h3>Related Chapters</h3>
      <ul>${contract.relatedChapterIds.map((id) => `<li>${relatedChapterLabel(chapterById, id)}</li>`).join('')}</ul>

      <h3>Related Concepts</h3>
      <ul>${contract.relatedConceptIds.map((id) => `<li>${conceptById.get(id)?.label || id}</li>`).join('')}</ul>
    </section>
  `;
}

window.addEventListener('DOMContentLoaded', () => {
  const roots = document.querySelectorAll('[data-chapter-contract-root]');
  roots.forEach((root) => {
    renderChapterContract(root).catch((error) => {
      console.error('Failed to render chapter contract content', error);
    });
  });
});

export { parseGlossary, requireSections };
