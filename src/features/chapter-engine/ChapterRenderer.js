import { renderChapterShell } from './ChapterShell.js';
import { validateChapterConfig } from './ChapterSectionRegistry.js';

const CHAPTER_IDS = Array.from({ length: 14 }, (_, i) => `ch${i + 1}`);

function normalizeChapterId(raw) {
  if (!raw) return 'ch1';
  const value = raw.toLowerCase();
  if (CHAPTER_IDS.includes(value)) return value;
  if (/^\d+$/.test(value)) {
    const num = Number(value);
    if (num >= 1 && num <= 14) return `ch${num}`;
  }
  return 'ch1';
}

export async function renderChapterById(rawChapterId, mountNode) {
  const chapterId = normalizeChapterId(rawChapterId);
  const response = await fetch(`src/features/chapter-engine/config/${chapterId}.json`);

  if (!response.ok) {
    throw new Error(`Could not load chapter config for ${chapterId}`);
  }

  const config = await response.json();
  return renderChapterConfig(config, mountNode);
}

export function renderChapterConfig(config, mountNode) {
  validateChapterConfig(config);

  mountNode.innerHTML = renderChapterShell(config);
  const header = config.sections.find((section) => section.key === 'header-thesis');
  if (header?.title) {
    document.title = `${header.title} - Aion Journey`;
  }
  return config.id || '';
}
