import { describe, expect, test } from 'vitest';

import {
  getAdjacentChapters,
  getChapterById,
  getChapterRoute,
  getChapters,
  getConceptsForChapter,
  getLegacyChapterRedirect,
} from '../../src/app/data/aionData';
import { APP_ROUTES, resolveRoute } from '../../src/app/routes';
import { CHAPTER_SCENES } from '../../src/app/visualization/chapterScenes';

describe('Aion framework data contract', () => {
  test('exposes all 14 canonical chapters in reading order', () => {
    const chapters = getChapters();

    expect(chapters).toHaveLength(14);
    expect(chapters.map((chapter) => chapter.id)).toEqual(
      Array.from({ length: 14 }, (_, index) => `ch${index + 1}`),
    );
    expect(chapters[0]).toMatchObject({
      id: 'ch1',
      order: 1,
      title: 'The Ego',
    });
  });

  test('derives chapter concepts from canonical Aion core data', () => {
    const concepts = getConceptsForChapter('ch5');

    expect(concepts.map((concept) => concept.id)).toEqual([
      'christ-symbol',
      'self',
      'quaternity',
    ]);
  });

  test('resolves route-safe chapter URLs and legacy redirects', () => {
    expect(getChapterRoute('ch14')).toBe('/journey/chapter/ch14');
    expect(getLegacyChapterRedirect('/chapters/chapter-7.html')).toBe('/journey/chapter/ch7');
    expect(getLegacyChapterRedirect('/not-a-chapter')).toBeNull();
  });

  test('exposes previous and next chapters without wrapping the book sequence', () => {
    expect(getAdjacentChapters('ch1')).toMatchObject({
      previous: null,
      next: { id: 'ch2' },
    });
    expect(getAdjacentChapters('ch14')).toMatchObject({
      previous: { id: 'ch13' },
      next: null,
    });
  });

  test('maps every chapter to a scene adapter and visual theme', () => {
    const chapters = getChapters();
    const byChapterNumber = (a: string, b: string) => Number(a.slice(2)) - Number(b.slice(2));

    expect(Object.keys(CHAPTER_SCENES).sort(byChapterNumber)).toEqual(
      chapters.map((chapter) => chapter.id).sort(byChapterNumber),
    );
    for (const chapter of chapters) {
      expect(CHAPTER_SCENES[chapter.id]).toMatchObject({
        chapterId: chapter.id,
      });
      expect(CHAPTER_SCENES[chapter.id].sceneModule).toMatch(/Three.*Viz\.js$/);
      expect(CHAPTER_SCENES[chapter.id].fallbackSummary.length).toBeGreaterThan(20);
    }
  });
});

describe('Aion framework route contract', () => {
  test('declares one canonical public route table', () => {
    expect(APP_ROUTES.map((route) => route.path)).toEqual([
      '/',
      '/chapters',
      '/atlas',
      '/timeline',
      '/symbols',
      '/about',
      '/journey/chapter/:chapterId',
    ]);
  });

  test('matches chapter, atlas, and fallback routes', () => {
    expect(resolveRoute('/journey/chapter/ch3')).toMatchObject({
      name: 'chapter',
      params: { chapterId: 'ch3' },
    });
    expect(resolveRoute('/atlas')).toMatchObject({ name: 'atlas' });
    expect(resolveRoute('/missing')).toMatchObject({ name: 'home' });
  });

  test('normalizes legacy chapter HTML paths to canonical app routes', () => {
    expect(resolveRoute('/chapters/chapter-12.html')).toMatchObject({
      name: 'chapter',
      params: { chapterId: 'ch12' },
      redirectedFrom: '/chapters/chapter-12.html',
    });
  });
});
