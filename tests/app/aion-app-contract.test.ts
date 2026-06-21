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
import { CHAPTER_SCENES, SCENE_LOADERS } from '../../src/app/visualization/chapterScenes';
import { VIZ_MANIFEST } from '../../src/features/viz-platform/viz-manifest-v3';

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

  test('keeps legacy immersive manifest aligned with the React scene registry', () => {
    const sceneModuleToManifestPath = (sceneModule: string) =>
      sceneModule.replace('../visualizations', '/src/visualizations');

    for (const chapter of getChapters()) {
      const chapterId = chapter.id as keyof typeof VIZ_MANIFEST;
      const sceneModule = CHAPTER_SCENES[chapter.id].sceneModule;
      const manifestPath = sceneModuleToManifestPath(sceneModule);

      expect(VIZ_MANIFEST[chapterId]).toBe(manifestPath);
      expect(String(SCENE_LOADERS[chapter.id])).toContain(manifestPath);
    }
  });

  test('keeps Chapter 1 Ego panels tied to the reference calibration model', () => {
    expect(CHAPTER_SCENES.ch1.panels.map((panel) => panel.id)).toEqual([
      'ego-light',
      'roots',
      'self-depth',
    ]);
    expect(CHAPTER_SCENES.ch1.panels.map((panel) => panel.kicker)).toEqual([
      'Orientation',
      'Depth',
      'Wholeness',
    ]);
    expect(CHAPTER_SCENES.ch1.motionGrammar).toBe('cyclical-return');
    expect(CHAPTER_SCENES.ch1.visualTheme).toContain('Ego/Self depth field');
    expect(CHAPTER_SCENES.ch1.sceneModule).toBe('../visualizations/chapters/ch1/ThreeEgoViz.js');
    expect(CHAPTER_SCENES.ch1.fallbackSummary).toContain('small surface light');
    expect(CHAPTER_SCENES.ch1.fallbackSummary).toContain('somatic and psychic roots');
    expect(CHAPTER_SCENES.ch1.fallbackSummary).toContain('deeper Self');

    expect(getConceptsForChapter('ch1').map((concept) => concept.id)).toEqual([
      'ego',
      'self',
    ]);
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

  test('keeps Chapter 4 Self panels tied to mandala and quaternity learning', () => {
    expect(CHAPTER_SCENES.ch4.panels.map((panel) => panel.id)).toEqual([
      'seed',
      'quaternity',
      'mandala',
    ]);
    expect(CHAPTER_SCENES.ch4.motionGrammar).toBe('cyclical-return');
    expect(CHAPTER_SCENES.ch4.visualTheme).toContain('Self mandala');
    expect(CHAPTER_SCENES.ch4.fallbackSummary).toContain('Concentric mandala rings');
    expect(CHAPTER_SCENES.ch4.fallbackSummary).toContain('fourfold ordering image');
  });

  test('keeps Chapter 5 Christ symbol panels tied to the excluded fourth', () => {
    expect(CHAPTER_SCENES.ch5.panels.map((panel) => panel.id)).toEqual([
      'cross',
      'fourth',
      'tree',
    ]);
    expect(CHAPTER_SCENES.ch5.panels.map((panel) => panel.kicker)).toEqual([
      'Cross',
      'Fourth',
      'Root',
    ]);
    expect(CHAPTER_SCENES.ch5.motionGrammar).toBe('opposition');
    expect(CHAPTER_SCENES.ch5.visualTheme).toContain('Christ symbol');
    expect(CHAPTER_SCENES.ch5.fallbackSummary).toContain('luminous cross');
    expect(CHAPTER_SCENES.ch5.fallbackSummary).toContain('excluded fourth');
    expect(CHAPTER_SCENES.ch5.fallbackSummary).toContain('three-plus-one');
  });

  test('keeps Chapter 6 fish panels tied to aeon and zodiacal time', () => {
    expect(CHAPTER_SCENES.ch6.panels.map((panel) => panel.id)).toEqual([
      'fish',
      'zodiac',
      'transition',
    ]);
    expect(CHAPTER_SCENES.ch6.panels.map((panel) => panel.kicker)).toEqual([
      'Pisces',
      'Aeon',
      'Threshold',
    ]);
    expect(CHAPTER_SCENES.ch6.motionGrammar).toBe('cyclical-return');
    expect(CHAPTER_SCENES.ch6.visualTheme).toContain('Zodiac fish');
    expect(CHAPTER_SCENES.ch6.fallbackSummary).toContain('Opposing fish');
    expect(CHAPTER_SCENES.ch6.fallbackSummary).toContain('zodiacal time');

    expect(getConceptsForChapter('ch6').map((concept) => concept.id)).toEqual([
      'aeon',
      'fish-symbol',
      'opposites',
    ]);
  });

  test('keeps Chapter 7 prophecy panels tied to collective projection', () => {
    expect(CHAPTER_SCENES.ch7.panels.map((panel) => panel.id)).toEqual([
      'prophecy',
      'collective',
      'threshold',
    ]);
    expect(CHAPTER_SCENES.ch7.panels.map((panel) => panel.kicker)).toEqual([
      'Prophecy',
      'Collective',
      'Threshold',
    ]);
    expect(CHAPTER_SCENES.ch7.motionGrammar).toBe('transformation');
    expect(CHAPTER_SCENES.ch7.visualTheme).toContain('Prophecy field');
    expect(CHAPTER_SCENES.ch7.fallbackSummary).toContain('collective anxiety');
    expect(CHAPTER_SCENES.ch7.fallbackSummary).toContain('symbolic dates');

    expect(getConceptsForChapter('ch7').map((concept) => concept.id)).toEqual([
      'prophecy',
      'collective-unconscious',
      'projection',
    ]);
  });

  test('keeps Chapter 8 fish history panels tied to historical strata', () => {
    expect(CHAPTER_SCENES.ch8.panels.map((panel) => panel.id)).toEqual([
      'strata',
      'christian',
      'modern',
    ]);
    expect(CHAPTER_SCENES.ch8.panels.map((panel) => panel.kicker)).toEqual([
      'History',
      'Early Image',
      'Afterlife',
    ]);
    expect(CHAPTER_SCENES.ch8.motionGrammar).toBe('transformation');
    expect(CHAPTER_SCENES.ch8.visualTheme).toContain('Fish symbol historical strata');
    expect(CHAPTER_SCENES.ch8.sceneModule).toBe('../visualizations/chapters/ch8/ThreeHistoricalViz.js');
    expect(CHAPTER_SCENES.ch8.fallbackSummary).toContain('Layered historical strata');
    expect(CHAPTER_SCENES.ch8.fallbackSummary).toContain('fish motif');
    expect(CHAPTER_SCENES.ch8.fallbackSummary).toContain('fixed definition');

    expect(getConceptsForChapter('ch8').map((concept) => concept.id)).toEqual([
      'fish-symbol',
      'archetype',
      'collective-unconscious',
    ]);
  });

  test('keeps Chapter 9 ambivalent fish panels tied to paradox and opposition', () => {
    expect(CHAPTER_SCENES.ch9.panels.map((panel) => panel.id)).toEqual([
      'ambivalence',
      'ouroboros',
      'shadow-fish',
    ]);
    expect(CHAPTER_SCENES.ch9.panels.map((panel) => panel.kicker)).toEqual([
      'Paradox',
      'Return',
      'Shadow',
    ]);
    expect(CHAPTER_SCENES.ch9.motionGrammar).toBe('opposition');
    expect(CHAPTER_SCENES.ch9.visualTheme).toContain('Ambivalent fish');
    expect(CHAPTER_SCENES.ch9.visualTheme).toContain('ouroboros');
    expect(CHAPTER_SCENES.ch9.sceneModule).toBe('../visualizations/chapters/ch9/ThreeOuroborosViz.js');
    expect(CHAPTER_SCENES.ch9.fallbackSummary).toContain('fish-serpent');
    expect(CHAPTER_SCENES.ch9.fallbackSummary).toContain('salvation and shadow');
    expect(CHAPTER_SCENES.ch9.fallbackSummary).toContain('ambivalent totality');

    expect(getConceptsForChapter('ch9').map((concept) => concept.id)).toEqual([
      'fish-symbol',
      'opposites',
      'antichrist',
    ]);
  });

  test('keeps Chapter 10 alchemical fish panels tied to vessel and prima materia', () => {
    expect(CHAPTER_SCENES.ch10.panels.map((panel) => panel.id)).toEqual([
      'vessel',
      'prima',
      'opus',
    ]);
    expect(CHAPTER_SCENES.ch10.panels.map((panel) => panel.kicker)).toEqual([
      'Alchemy',
      'Prima Materia',
      'Opus',
    ]);
    expect(CHAPTER_SCENES.ch10.motionGrammar).toBe('transformation');
    expect(CHAPTER_SCENES.ch10.visualTheme).toContain('Alchemical fish vessel');
    expect(CHAPTER_SCENES.ch10.sceneModule).toBe('../visualizations/chapters/ch10/ThreeAlchemyViz.js');
    expect(CHAPTER_SCENES.ch10.fallbackSummary).toContain('alchemical vessel');
    expect(CHAPTER_SCENES.ch10.fallbackSummary).toContain('fish motif');
    expect(CHAPTER_SCENES.ch10.fallbackSummary).toContain('reddening');

    expect(getConceptsForChapter('ch10').map((concept) => concept.id)).toEqual([
      'alchemy',
      'prima-materia',
      'fish-symbol',
    ]);
  });

  test('keeps Chapter 11 alchemical interpretation panels tied to Mercurius and lapis', () => {
    expect(CHAPTER_SCENES.ch11.panels.map((panel) => panel.id)).toEqual([
      'mercurius',
      'opus-wheel',
      'lapis',
    ]);
    expect(CHAPTER_SCENES.ch11.panels.map((panel) => panel.kicker)).toEqual([
      'Mediator',
      'Opus',
      'Stone',
    ]);
    expect(CHAPTER_SCENES.ch11.motionGrammar).toBe('transformation');
    expect(CHAPTER_SCENES.ch11.visualTheme).toContain('Mercurius');
    expect(CHAPTER_SCENES.ch11.visualTheme).toContain('opus wheel');
    expect(CHAPTER_SCENES.ch11.sceneModule).toBe('../visualizations/chapters/ch11/ThreeTreeViz.js');
    expect(CHAPTER_SCENES.ch11.fallbackSummary).toContain('alchemical tree');
    expect(CHAPTER_SCENES.ch11.fallbackSummary).toContain('Mercurius');
    expect(CHAPTER_SCENES.ch11.fallbackSummary).toContain('opus cycle');

    expect(getConceptsForChapter('ch11').map((concept) => concept.id)).toEqual([
      'mercurius',
      'coniunctio',
      'lapis-philosophorum',
    ]);
  });

  test('keeps Chapter 11 tree scene helpers mobile-aware', async () => {
    const {
      getTreeBloomStrength,
      getTreeCosmicParticleCount,
      getTreePixelRatioCap,
      getTreeWaterParticleCount,
      isTreeMobile,
      TREE_MOBILE_BREAKPOINT,
    } = await import('../../src/visualizations/chapters/ch11/treeSceneConfig.js');

    expect(TREE_MOBILE_BREAKPOINT).toBe(720);
    expect(isTreeMobile(390)).toBe(true);
    expect(isTreeMobile(1440)).toBe(false);
    expect(getTreePixelRatioCap(390)).toBeLessThan(getTreePixelRatioCap(1440));
    expect(getTreeWaterParticleCount(390)).toBeLessThan(getTreeWaterParticleCount(1440));
    expect(getTreeCosmicParticleCount(390)).toBeLessThan(getTreeCosmicParticleCount(1440));
    expect(getTreeBloomStrength(390)).toBeLessThan(getTreeBloomStrength(1440));
  });

  test('keeps Chapter 12 amplification lens panels tied to symbolic interpretation', () => {
    expect(CHAPTER_SCENES.ch12.panels.map((panel) => panel.id)).toEqual([
      'background',
      'roots',
      'bridge',
    ]);
    expect(CHAPTER_SCENES.ch12.panels.map((panel) => panel.kicker)).toEqual([
      'Method',
      'Genealogy',
      'Bridge',
    ]);
    expect(CHAPTER_SCENES.ch12.motionGrammar).toBe('integration');
    expect(CHAPTER_SCENES.ch12.visualTheme).toContain('Amplification lens');
    expect(CHAPTER_SCENES.ch12.visualTheme).toContain('root bridge');
    expect(CHAPTER_SCENES.ch12.sceneModule).toBe('../visualizations/chapters/ch12/ThreeUnusViz.js');
    expect(CHAPTER_SCENES.ch12.fallbackSummary).toContain('amplification lens');
    expect(CHAPTER_SCENES.ch12.fallbackSummary).toContain('shared roots');
    expect(CHAPTER_SCENES.ch12.fallbackSummary).toContain('fish bridge');

    expect(getConceptsForChapter('ch12').map((concept) => concept.id)).toEqual([
      'symbolic-interpretation',
      'projection',
      'alchemy',
    ]);
  });

  test('keeps Chapter 13 Gnostic panels tied to symbolic wholeness and paradox', () => {
    expect(CHAPTER_SCENES.ch13.panels.map((panel) => panel.id)).toEqual([
      'gnosis',
      'quaternio',
      'paradox',
    ]);
    expect(CHAPTER_SCENES.ch13.panels.map((panel) => panel.kicker)).toEqual([
      'Gnosis',
      'Fourfold',
      'Paradox',
    ]);
    expect(CHAPTER_SCENES.ch13.motionGrammar).toBe('cyclical-return');
    expect(CHAPTER_SCENES.ch13.visualTheme).toContain('Gnostic pleroma');
    expect(CHAPTER_SCENES.ch13.visualTheme).toContain('fourfold Self pattern');
    expect(CHAPTER_SCENES.ch13.sceneModule).toBe('../visualizations/chapters/ch13/ThreeQuaternioViz.js');
    expect(CHAPTER_SCENES.ch13.fallbackSummary).toContain('Gnostic constellation');
    expect(CHAPTER_SCENES.ch13.fallbackSummary).toContain('fourfold pattern');
    expect(CHAPTER_SCENES.ch13.fallbackSummary).toContain('rupture line');

    expect(getConceptsForChapter('ch13').map((concept) => concept.id)).toEqual([
      'gnosticism',
      'self',
      'opposites',
    ]);
  });

  test('keeps Chapter 14 final synthesis panels tied to Self, quaternity, and individuation', () => {
    expect(CHAPTER_SCENES.ch14.panels.map((panel) => panel.id)).toEqual([
      'gather',
      'axis',
      'aeon',
    ]);
    expect(CHAPTER_SCENES.ch14.panels.map((panel) => panel.kicker)).toEqual([
      'Synthesis',
      'Axis',
      'Path',
    ]);
    expect(CHAPTER_SCENES.ch14.motionGrammar).toBe('integration');
    expect(CHAPTER_SCENES.ch14.visualTheme).toContain('Final Self mandala');
    expect(CHAPTER_SCENES.ch14.visualTheme).toContain('individuation path');
    expect(CHAPTER_SCENES.ch14.sceneModule).toBe('../visualizations/chapters/ch14/ThreeAeonFinalViz.js');
    expect(CHAPTER_SCENES.ch14.fallbackSummary).toContain('final synthesis mandala');
    expect(CHAPTER_SCENES.ch14.fallbackSummary).toContain('fourfold ordering field');
    expect(CHAPTER_SCENES.ch14.fallbackSummary).toContain('individuation');

    expect(getConceptsForChapter('ch14').map((concept) => concept.id)).toEqual([
      'self',
      'quaternity',
      'individuation',
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
    expect(resolveRoute('/journey/chapter/ch5/')).toMatchObject({
      name: 'chapter',
      params: { chapterId: 'ch5' },
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
