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

  test('keeps Chapter 2 shadow panels in the canonical learning sequence', () => {
    expect(CHAPTER_SCENES.ch2.panels.map((panel) => panel.id)).toEqual([
      'mirror',
      'projection',
      'integration',
    ]);
    expect(CHAPTER_SCENES.ch2.motionGrammar).toBe('opposition');
    expect(CHAPTER_SCENES.ch2.fallbackSummary).toContain('projection arcs');
  });

  test('keeps Chapter 3 syzygy panels tied to the canonical concept sequence', () => {
    expect(CHAPTER_SCENES.ch3.panels.map((panel) => panel.id)).toEqual([
      'pair',
      'orbit',
      'union',
    ]);
    expect(CHAPTER_SCENES.ch3.motionGrammar).toBe('integration');
    expect(CHAPTER_SCENES.ch3.fallbackSummary).toContain('projection makes the inner image appear outside');
    expect(CHAPTER_SCENES.ch3.fallbackSummary).toContain('brief symbolic union');

    expect(getConceptsForChapter('ch3').map((concept) => concept.id)).toEqual([
      'syzygy',
      'anima',
      'animus',
    ]);
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
