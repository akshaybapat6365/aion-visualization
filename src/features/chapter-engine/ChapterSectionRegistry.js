export const REQUIRED_SECTIONS = [
  'header-thesis',
  'why-this-matters',
  'core-terms',
  'primary-visualization',
  'insight-checks',
  'symbol-relationship-panel',
  'synthesis',
  'reflection-next-links'
];

export const SECTION_LABELS = {
  'header-thesis': 'Header / Thesis',
  'why-this-matters': 'Why this matters',
  'core-terms': 'Core terms',
  'primary-visualization': 'Primary visualization',
  'insight-checks': 'Insight checks',
  'symbol-relationship-panel': 'Symbol / relationship panel',
  'synthesis': 'Synthesis',
  'reflection-next-links': 'Reflection + next links'
};

export function validateChapterConfig(config) {
  if (!config || !Array.isArray(config.sections)) {
    throw new Error('Invalid chapter config: missing sections array');
  }

  const keys = config.sections.map((section) => section.key);
  const missing = REQUIRED_SECTIONS.filter((key) => !keys.includes(key));

  if (missing.length > 0) {
    throw new Error(`Invalid chapter config: missing required sections (${missing.join(', ')})`);
  }

  return true;
}
