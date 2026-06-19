import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import ChapterSigil from '../components/ChapterSigil';
import SceneHost from '../components/SceneHost';
import {
  getAdjacentChapters,
  getChapterById,
  getChapterRoute,
  getConceptsForChapter,
  getLearningObjectsForChapter,
  normalizeChapterId,
} from '../data/aionData';
import type { ChapterRecord } from '../types';
import { CHAPTER_SCENES } from '../visualization/chapterScenes';

const quaternityDirections = ['north', 'east', 'south', 'west'] as const;
const mandalaBands = ['outer', 'middle', 'inner'] as const;
const rootLines = ['left', 'center', 'right'] as const;
const zodiacMarkers = ['AR', 'TA', 'GE', 'CN', 'LE', 'VI', 'LI', 'SC', 'SG', 'CP', 'AQ', 'PI'] as const;
const prophecyTicks = ['0', '1000', '1555', '2000'] as const;
const historicalStrataLayers = ['vision', 'carrier', 'healing', 'aeon', 'depth'] as const;
const alchemicalOpusStages = ['nigredo', 'albedo', 'citrinitas', 'rubedo'] as const;
const alchemicalTreeStages = ['black', 'white', 'gold', 'red'] as const;
const amplificationLensRings = ['outer', 'middle', 'inner'] as const;
const amplificationRootThreads = ['faith', 'source', 'alchemy'] as const;
const gnosticEmanationLayers = ['source', 'nous', 'sophia', 'matter'] as const;
const gnosticQuaternioPoints = ['north', 'east', 'south', 'west'] as const;
const gnosticParadoxShards = ['fall', 'spark', 'return'] as const;

function useReducedMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean | null>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

export default function ChapterPage({ chapterId }: { chapterId: string }) {
  const normalized = normalizeChapterId(chapterId);
  const chapter = getChapterById(normalized);

  if (!chapter) {
    return null;
  }

  return <ChapterPageContent chapter={chapter} />;
}

function ChapterPageContent({ chapter }: { chapter: ChapterRecord }) {
  const reducedMotionPreference = useReducedMotionPreference();
  const reducedMotion = reducedMotionPreference !== false;
  const experience = CHAPTER_SCENES[chapter.id];
  const [activePanelId, setActivePanelId] = useState(experience.panels[0]?.id || '');
  const concepts = getConceptsForChapter(chapter.id);
  const learningObjects = getLearningObjectsForChapter(chapter.id);
  const adjacent = getAdjacentChapters(chapter.id);
  const activePanelIndex = Math.max(0, experience.panels.findIndex((panel) => panel.id === activePanelId));
  const panelProgress = experience.panels.length > 1 ? activePanelIndex / (experience.panels.length - 1) : 0;
  const activePanel = experience.panels[activePanelIndex] || experience.panels[0];
  const christSymbolInstrumentLabel = `Christ symbol model: a luminous cross carries a powerful Self image, three bright points form a one-sided field, the excluded fourth remains dark but necessary, and roots descend toward the counter-pole. Current emphasis: ${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`;
  const aeonFishInstrumentLabel = `Sign of the Fishes model: two Pisces fish swim in opposite directions inside a zodiac wheel, the spring point precesses through symbolic time, and Aquarius marks the slow threshold of a changing aeon. Current emphasis: ${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`;
  const prophecyFieldInstrumentLabel = `Prophecy field model: historical pressure gathers around a time axis, private fear projects into a shared symbolic image-field, and the threshold mirror shows the future looking backward into older archetypal forms. Current emphasis: ${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`;
  const historicalStrataInstrumentLabel = `Historical strata model: five translucent layers accumulate around the fish motif, an early Christian carrier image gathers the symbol into a readable form, and older meanings keep speaking below later interpretation. Current emphasis: ${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`;
  const ambivalentFishInstrumentLabel = `Ambivalent fish model: one fish-symbol carries blessing and threat across a split field, an ouroboric return shows opposition circling back into itself, and the shadow fish keeps the Antichrist counter-pole inside the total image. Current emphasis: ${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`;
  const alchemicalVesselInstrumentLabel = `Alchemical vessel model: the fish-symbol enters a sealed vessel, prima materia gathers as unsettled particles, heat presses the image through four opus stages, and a lapis point appears as transformation takes form. Current emphasis: ${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`;
  const alchemicalTreeInstrumentLabel = `Philosophical tree model: Mercurius holds the middle between matter and spirit, the opus wheel repeats transformation, and the lapis Coniunctio holds a formed union of opposites. Current emphasis: ${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`;
  const amplificationLensInstrumentLabel = `Amplification lens model: a disciplined symbolic lens holds religious image, alchemical image, and psychic projection in relation; shared roots keep the traditions connected, and the bridge turns inherited images toward inner experience. Current emphasis: ${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`;
  const gnosticConstellationInstrumentLabel = `Gnostic constellation model: emanation rings move from fullness into differentiated images, a symbolic fourfold pattern makes the Self readable, and a rupture field keeps wisdom and fall in tension. Current emphasis: ${activePanel.kicker}: ${activePanel.title}. ${activePanel.insight}`;

  useEffect(() => {
    setActivePanelId(experience.panels[0]?.id || '');
  }, [chapter.id, experience.panels]);

  useEffect(() => {
    const panelElements = Array.from(document.querySelectorAll<HTMLElement>(`[data-chapter-panel="${chapter.id}"]`));
    if (panelElements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.getAttribute('data-panel-id');
        if (id) setActivePanelId(id);
      },
      { rootMargin: '-22% 0px -42% 0px', threshold: [0.25, 0.45, 0.65, 0.85] },
    );

    panelElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [chapter.id, experience.panels]);

  return (
    <article
      className="chapter-experience"
      data-chapter-id={chapter.id}
      data-motion-grammar={experience.motionGrammar}
      data-reduced-motion={reducedMotion}
    >
      <section className="chapter-stage" aria-label={`${chapter.title} visual stage`}>
        <SceneHost
          chapter={chapter}
          experience={experience}
          reducedMotion={reducedMotion}
          activePanelId={activePanelId}
          panelProgress={panelProgress}
        />
        <div className="chapter-stage__scrim" />
        <div className="chapter-stage__intro">
          <ChapterSigil chapter={chapter} />
          <p className="eyebrow">Chapter {chapter.order} · {chapter.cluster}</p>
          <h1>{chapter.title}</h1>
          <p>{chapter.summary}</p>
          {chapter.id === 'ch2' && (
            <div
              className="shadow-projection-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label="Shadow projection model: the ego stands before a mirror, casts refused material outward as a shadow, and begins returning it through integration."
            >
              <span className="shadow-projection-instrument__vessel" aria-hidden="true" />
              <span className="shadow-projection-instrument__mirror" aria-hidden="true" />
              <span className="shadow-projection-instrument__ego" aria-hidden="true" />
              <span className="shadow-projection-instrument__shadow" aria-hidden="true" />
              <span className="shadow-projection-instrument__arc shadow-projection-instrument__arc--projection" aria-hidden="true" />
              <span className="shadow-projection-instrument__arc shadow-projection-instrument__arc--return" aria-hidden="true" />
              <span className="shadow-projection-instrument__bridge" aria-hidden="true" />
              <span className="shadow-projection-instrument__label shadow-projection-instrument__label--ego" aria-hidden="true">ego</span>
              <span className="shadow-projection-instrument__label shadow-projection-instrument__label--mirror" aria-hidden="true">mirror</span>
              <span className="shadow-projection-instrument__label shadow-projection-instrument__label--shadow" aria-hidden="true">shadow</span>
              <span className="shadow-projection-instrument__label shadow-projection-instrument__label--projection" aria-hidden="true">projection</span>
              <span className="shadow-projection-instrument__label shadow-projection-instrument__label--return" aria-hidden="true">return</span>
            </div>
          )}
          {chapter.id === 'ch3' && (
            <div
              className="syzygy-relation-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label="Syzygy relation model: anima and animus appear as symbolic poles, projection arcs outward and returns into orbit, and conjunction forms a brief shared field without erasing the pair."
            >
              <span className="syzygy-relation-instrument__axis" aria-hidden="true" />
              <span className="syzygy-relation-instrument__orbit syzygy-relation-instrument__orbit--outer" aria-hidden="true" />
              <span className="syzygy-relation-instrument__orbit syzygy-relation-instrument__orbit--inner" aria-hidden="true" />
              <span className="syzygy-relation-instrument__field syzygy-relation-instrument__field--upper" aria-hidden="true" />
              <span className="syzygy-relation-instrument__field syzygy-relation-instrument__field--lower" aria-hidden="true" />
              <span className="syzygy-relation-instrument__projection syzygy-relation-instrument__projection--outward" aria-hidden="true" />
              <span className="syzygy-relation-instrument__projection syzygy-relation-instrument__projection--return" aria-hidden="true" />
              <span className="syzygy-relation-instrument__mandorla" aria-hidden="true" />
              <span className="syzygy-relation-instrument__conjunction-core" aria-hidden="true" />
              <span className="syzygy-relation-instrument__pole syzygy-relation-instrument__pole--anima" aria-hidden="true" />
              <span className="syzygy-relation-instrument__pole syzygy-relation-instrument__pole--animus" aria-hidden="true" />
              <span className="syzygy-relation-instrument__label syzygy-relation-instrument__label--anima" aria-hidden="true">anima</span>
              <span className="syzygy-relation-instrument__label syzygy-relation-instrument__label--animus" aria-hidden="true">animus</span>
              <span className="syzygy-relation-instrument__label syzygy-relation-instrument__label--orbit" aria-hidden="true">orbit</span>
              <span className="syzygy-relation-instrument__label syzygy-relation-instrument__label--conjunction" aria-hidden="true">conjunction</span>
            </div>
          )}
          {chapter.id === 'ch4' && (
            <div
              className="self-mandala-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label="Self mandala model: a small center opens into a wider totality, four directions make wholeness readable, and concentric mandala rings order conflict without flattening difference."
            >
              <span className="self-mandala-instrument__ring self-mandala-instrument__ring--outer" aria-hidden="true" />
              <span className="self-mandala-instrument__ring self-mandala-instrument__ring--middle" aria-hidden="true" />
              <span className="self-mandala-instrument__ring self-mandala-instrument__ring--inner" aria-hidden="true" />
              <span className="self-mandala-instrument__axis self-mandala-instrument__axis--vertical" aria-hidden="true" />
              <span className="self-mandala-instrument__axis self-mandala-instrument__axis--horizontal" aria-hidden="true" />
              {quaternityDirections.map((direction) => (
                <span key={direction} className={`self-mandala-instrument__point self-mandala-instrument__point--${direction}`} aria-hidden="true" />
              ))}
              <span className="self-mandala-instrument__center" aria-hidden="true" />
              <span className="self-mandala-instrument__label self-mandala-instrument__label--center" aria-hidden="true">center</span>
              <span className="self-mandala-instrument__label self-mandala-instrument__label--fourfold" aria-hidden="true">fourfold</span>
              <span className="self-mandala-instrument__label self-mandala-instrument__label--mandala" aria-hidden="true">mandala</span>
            </div>
          )}
          {chapter.id === 'ch5' && (
            <div
              className="christ-symbol-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label={christSymbolInstrumentLabel}
            >
              <span className="christ-symbol-instrument__field christ-symbol-instrument__field--light" aria-hidden="true" />
              <span className="christ-symbol-instrument__field christ-symbol-instrument__field--shadow" aria-hidden="true" />
              <span className="christ-symbol-instrument__ring christ-symbol-instrument__ring--quaternity" aria-hidden="true" />
              <span className="christ-symbol-instrument__ring christ-symbol-instrument__ring--trinity" aria-hidden="true" />
              <span className="christ-symbol-instrument__axis christ-symbol-instrument__axis--vertical" aria-hidden="true" />
              <span className="christ-symbol-instrument__axis christ-symbol-instrument__axis--horizontal" aria-hidden="true" />
              <span className="christ-symbol-instrument__connector christ-symbol-instrument__connector--accepted christ-symbol-instrument__connector--one" aria-hidden="true" />
              <span className="christ-symbol-instrument__connector christ-symbol-instrument__connector--accepted christ-symbol-instrument__connector--two" aria-hidden="true" />
              <span className="christ-symbol-instrument__connector christ-symbol-instrument__connector--accepted christ-symbol-instrument__connector--three" aria-hidden="true" />
              <span className="christ-symbol-instrument__connector christ-symbol-instrument__connector--broken" aria-hidden="true" />
              <span className="christ-symbol-instrument__point christ-symbol-instrument__point--one" aria-hidden="true" />
              <span className="christ-symbol-instrument__point christ-symbol-instrument__point--two" aria-hidden="true" />
              <span className="christ-symbol-instrument__point christ-symbol-instrument__point--three" aria-hidden="true" />
              <span className="christ-symbol-instrument__point christ-symbol-instrument__point--fourth" aria-hidden="true" />
              <span className="christ-symbol-instrument__root christ-symbol-instrument__root--left" aria-hidden="true" />
              <span className="christ-symbol-instrument__root christ-symbol-instrument__root--center" aria-hidden="true" />
              <span className="christ-symbol-instrument__root christ-symbol-instrument__root--right" aria-hidden="true" />
              <span className="christ-symbol-instrument__label christ-symbol-instrument__label--cross" aria-hidden="true">cross</span>
              <span className="christ-symbol-instrument__label christ-symbol-instrument__label--fourth" aria-hidden="true">fourth</span>
              <span className="christ-symbol-instrument__label christ-symbol-instrument__label--root" aria-hidden="true">root</span>
            </div>
          )}
          {chapter.id === 'ch6' && (
            <div
              className="aeon-fish-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label={aeonFishInstrumentLabel}
            >
              <span className="aeon-fish-instrument__field aeon-fish-instrument__field--pisces" aria-hidden="true" />
              <span className="aeon-fish-instrument__field aeon-fish-instrument__field--aquarius" aria-hidden="true" />
              <span className="aeon-fish-instrument__ring aeon-fish-instrument__ring--outer" aria-hidden="true" />
              <span className="aeon-fish-instrument__ring aeon-fish-instrument__ring--inner" aria-hidden="true" />
              {zodiacMarkers.map((marker, index) => (
                <span
                  key={marker}
                  className={`aeon-fish-instrument__sign aeon-fish-instrument__sign--${index + 1}`}
                  aria-hidden="true"
                >
                  {marker}
                </span>
              ))}
              <span className="aeon-fish-instrument__thread" aria-hidden="true" />
              <span className="aeon-fish-instrument__fish aeon-fish-instrument__fish--light" aria-hidden="true" />
              <span className="aeon-fish-instrument__fish aeon-fish-instrument__fish--shadow" aria-hidden="true" />
              <span className="aeon-fish-instrument__hand" aria-hidden="true" />
              <span className="aeon-fish-instrument__threshold" aria-hidden="true" />
              <span className="aeon-fish-instrument__label aeon-fish-instrument__label--fish" aria-hidden="true">two fish</span>
              <span className="aeon-fish-instrument__label aeon-fish-instrument__label--wheel" aria-hidden="true">aeon wheel</span>
              <span className="aeon-fish-instrument__label aeon-fish-instrument__label--threshold" aria-hidden="true">threshold</span>
            </div>
          )}
          {chapter.id === 'ch7' && (
            <div
              className="prophecy-field-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label={prophecyFieldInstrumentLabel}
            >
              <span className="prophecy-field-instrument__field prophecy-field-instrument__field--past" aria-hidden="true" />
              <span className="prophecy-field-instrument__field prophecy-field-instrument__field--future" aria-hidden="true" />
              <span className="prophecy-field-instrument__axis" aria-hidden="true" />
              {prophecyTicks.map((tick, index) => (
                <span
                  key={tick}
                  className={`prophecy-field-instrument__tick prophecy-field-instrument__tick--${index + 1}`}
                  aria-hidden="true"
                >
                  {tick}
                </span>
              ))}
              <span className="prophecy-field-instrument__pressure" aria-hidden="true" />
              <span className="prophecy-field-instrument__date" aria-hidden="true" />
              <span className="prophecy-field-instrument__image prophecy-field-instrument__image--one" aria-hidden="true" />
              <span className="prophecy-field-instrument__image prophecy-field-instrument__image--two" aria-hidden="true" />
              <span className="prophecy-field-instrument__image prophecy-field-instrument__image--three" aria-hidden="true" />
              <span className="prophecy-field-instrument__arc prophecy-field-instrument__arc--projection" aria-hidden="true" />
              <span className="prophecy-field-instrument__arc prophecy-field-instrument__arc--return" aria-hidden="true" />
              <span className="prophecy-field-instrument__threshold" aria-hidden="true" />
              <span className="prophecy-field-instrument__mirror" aria-hidden="true" />
              <span className="prophecy-field-instrument__label prophecy-field-instrument__label--pressure" aria-hidden="true">pressure</span>
              <span className="prophecy-field-instrument__label prophecy-field-instrument__label--collective" aria-hidden="true">shared image</span>
              <span className="prophecy-field-instrument__label prophecy-field-instrument__label--threshold" aria-hidden="true">threshold</span>
            </div>
          )}
          {chapter.id === 'ch8' && (
            <div
              className="historical-strata-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label={historicalStrataInstrumentLabel}
            >
              <span className="historical-strata-instrument__field historical-strata-instrument__field--archive" aria-hidden="true" />
              <span className="historical-strata-instrument__field historical-strata-instrument__field--afterlife" aria-hidden="true" />
              <span className="historical-strata-instrument__axis" aria-hidden="true" />
              {historicalStrataLayers.map((layer, index) => (
                <span
                  key={layer}
                  className={`historical-strata-instrument__layer historical-strata-instrument__layer--${index + 1}`}
                  aria-hidden="true"
                />
              ))}
              <span className="historical-strata-instrument__sediment historical-strata-instrument__sediment--one" aria-hidden="true" />
              <span className="historical-strata-instrument__sediment historical-strata-instrument__sediment--two" aria-hidden="true" />
              <span className="historical-strata-instrument__sediment historical-strata-instrument__sediment--three" aria-hidden="true" />
              <span className="historical-strata-instrument__thread historical-strata-instrument__thread--descent" aria-hidden="true" />
              <span className="historical-strata-instrument__thread historical-strata-instrument__thread--return" aria-hidden="true" />
              <span className="historical-strata-instrument__fish" aria-hidden="true" />
              <span className="historical-strata-instrument__carrier" aria-hidden="true" />
              <span className="historical-strata-instrument__depth" aria-hidden="true" />
              <span className="historical-strata-instrument__label historical-strata-instrument__label--strata" aria-hidden="true">strata</span>
              <span className="historical-strata-instrument__label historical-strata-instrument__label--carrier" aria-hidden="true">carrier</span>
              <span className="historical-strata-instrument__label historical-strata-instrument__label--afterlife" aria-hidden="true">afterlife</span>
            </div>
          )}
          {chapter.id === 'ch9' && (
            <div
              className="ambivalent-fish-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label={ambivalentFishInstrumentLabel}
            >
              <span className="ambivalent-fish-instrument__field ambivalent-fish-instrument__field--light" aria-hidden="true" />
              <span className="ambivalent-fish-instrument__field ambivalent-fish-instrument__field--shadow" aria-hidden="true" />
              <span className="ambivalent-fish-instrument__mirror" aria-hidden="true" />
              <span className="ambivalent-fish-instrument__ring ambivalent-fish-instrument__ring--outer" aria-hidden="true" />
              <span className="ambivalent-fish-instrument__ring ambivalent-fish-instrument__ring--inner" aria-hidden="true" />
              <span className="ambivalent-fish-instrument__thread" aria-hidden="true" />
              <span className="ambivalent-fish-instrument__fish ambivalent-fish-instrument__fish--light" aria-hidden="true" />
              <span className="ambivalent-fish-instrument__fish ambivalent-fish-instrument__fish--shadow" aria-hidden="true" />
              <span className="ambivalent-fish-instrument__junction" aria-hidden="true" />
              <span className="ambivalent-fish-instrument__shadow-core" aria-hidden="true" />
              <span className="ambivalent-fish-instrument__label ambivalent-fish-instrument__label--paradox" aria-hidden="true">double edge</span>
              <span className="ambivalent-fish-instrument__label ambivalent-fish-instrument__label--return" aria-hidden="true">return</span>
              <span className="ambivalent-fish-instrument__label ambivalent-fish-instrument__label--shadow" aria-hidden="true">counter-pole</span>
            </div>
          )}
          {chapter.id === 'ch10' && (
            <div
              className="alchemical-vessel-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label={alchemicalVesselInstrumentLabel}
            >
              <span className="alchemical-vessel-instrument__field" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__heat" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__vessel" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__bath" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__fish" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__magnet" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__lapis" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__thread alchemical-vessel-instrument__thread--descent" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__thread alchemical-vessel-instrument__thread--ascent" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__particle alchemical-vessel-instrument__particle--one" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__particle alchemical-vessel-instrument__particle--two" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__particle alchemical-vessel-instrument__particle--three" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__particle alchemical-vessel-instrument__particle--four" aria-hidden="true" />
              <span className="alchemical-vessel-instrument__stages" aria-hidden="true">
                {alchemicalOpusStages.map((stage) => (
                  <span key={stage} className={`alchemical-vessel-instrument__stage alchemical-vessel-instrument__stage--${stage}`} />
                ))}
              </span>
              <span className="alchemical-vessel-instrument__label alchemical-vessel-instrument__label--fish" aria-hidden="true">fish enters</span>
              <span className="alchemical-vessel-instrument__label alchemical-vessel-instrument__label--prima" aria-hidden="true">prima materia</span>
              <span className="alchemical-vessel-instrument__label alchemical-vessel-instrument__label--opus" aria-hidden="true">opus stages</span>
            </div>
          )}
          {chapter.id === 'ch11' && (
            <div
              className="alchemical-tree-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label={alchemicalTreeInstrumentLabel}
            >
              <span className="alchemical-tree-instrument__field alchemical-tree-instrument__field--above" aria-hidden="true" />
              <span className="alchemical-tree-instrument__field alchemical-tree-instrument__field--below" aria-hidden="true" />
              <span className="alchemical-tree-instrument__root alchemical-tree-instrument__root--one" aria-hidden="true" />
              <span className="alchemical-tree-instrument__root alchemical-tree-instrument__root--two" aria-hidden="true" />
              <span className="alchemical-tree-instrument__root alchemical-tree-instrument__root--three" aria-hidden="true" />
              <span className="alchemical-tree-instrument__trunk" aria-hidden="true" />
              <span className="alchemical-tree-instrument__branch alchemical-tree-instrument__branch--left" aria-hidden="true" />
              <span className="alchemical-tree-instrument__branch alchemical-tree-instrument__branch--right" aria-hidden="true" />
              <span className="alchemical-tree-instrument__thread alchemical-tree-instrument__thread--ascent" aria-hidden="true" />
              <span className="alchemical-tree-instrument__thread alchemical-tree-instrument__thread--descent" aria-hidden="true" />
              <span className="alchemical-tree-instrument__mercurius" aria-hidden="true" />
              <span className="alchemical-tree-instrument__wheel" aria-hidden="true">
                {alchemicalTreeStages.map((stage) => (
                  <span key={stage} className={`alchemical-tree-instrument__stage alchemical-tree-instrument__stage--${stage}`} />
                ))}
              </span>
              <span className="alchemical-tree-instrument__stone" aria-hidden="true" />
              <span className="alchemical-tree-instrument__reflection" aria-hidden="true" />
              <span className="alchemical-tree-instrument__label alchemical-tree-instrument__label--mercurius" aria-hidden="true">Mercurius</span>
              <span className="alchemical-tree-instrument__label alchemical-tree-instrument__label--opus" aria-hidden="true">opus wheel</span>
              <span className="alchemical-tree-instrument__label alchemical-tree-instrument__label--lapis" aria-hidden="true">lapis</span>
            </div>
          )}
          {chapter.id === 'ch12' && (
            <div
              className="amplification-lens-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label={amplificationLensInstrumentLabel}
            >
              <span className="amplification-lens-instrument__field amplification-lens-instrument__field--faith" aria-hidden="true" />
              <span className="amplification-lens-instrument__field amplification-lens-instrument__field--alchemy" aria-hidden="true" />
              <span className="amplification-lens-instrument__source" aria-hidden="true" />
              {amplificationRootThreads.map((thread) => (
                <span key={thread} className={`amplification-lens-instrument__root amplification-lens-instrument__root--${thread}`} aria-hidden="true" />
              ))}
              <span className="amplification-lens-instrument__split amplification-lens-instrument__split--faith" aria-hidden="true" />
              <span className="amplification-lens-instrument__split amplification-lens-instrument__split--alchemy" aria-hidden="true" />
              <span className="amplification-lens-instrument__image amplification-lens-instrument__image--faith" aria-hidden="true" />
              <span className="amplification-lens-instrument__image amplification-lens-instrument__image--alchemy" aria-hidden="true" />
              <span className="amplification-lens-instrument__projection" aria-hidden="true" />
              <span className="amplification-lens-instrument__fish" aria-hidden="true" />
              <span className="amplification-lens-instrument__bridge" aria-hidden="true" />
              <span className="amplification-lens-instrument__lens" aria-hidden="true">
                {amplificationLensRings.map((ring) => (
                  <span key={ring} className={`amplification-lens-instrument__ring amplification-lens-instrument__ring--${ring}`} />
                ))}
              </span>
              <span className="amplification-lens-instrument__label amplification-lens-instrument__label--lens" aria-hidden="true">symbolic lens</span>
              <span className="amplification-lens-instrument__label amplification-lens-instrument__label--roots" aria-hidden="true">shared roots</span>
              <span className="amplification-lens-instrument__label amplification-lens-instrument__label--bridge" aria-hidden="true">inner bridge</span>
            </div>
          )}
          {chapter.id === 'ch13' && (
            <div
              className="gnostic-constellation-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label={gnosticConstellationInstrumentLabel}
            >
              <span className="gnostic-constellation-instrument__field gnostic-constellation-instrument__field--fullness" aria-hidden="true" />
              <span className="gnostic-constellation-instrument__field gnostic-constellation-instrument__field--rupture" aria-hidden="true" />
              <span className="gnostic-constellation-instrument__axis gnostic-constellation-instrument__axis--vertical" aria-hidden="true" />
              <span className="gnostic-constellation-instrument__axis gnostic-constellation-instrument__axis--horizontal" aria-hidden="true" />
              <span className="gnostic-constellation-instrument__emanation" aria-hidden="true">
                {gnosticEmanationLayers.map((layer) => (
                  <span key={layer} className={`gnostic-constellation-instrument__layer gnostic-constellation-instrument__layer--${layer}`} />
                ))}
              </span>
              <span className="gnostic-constellation-instrument__source" aria-hidden="true" />
              <span className="gnostic-constellation-instrument__descent" aria-hidden="true" />
              <span className="gnostic-constellation-instrument__sophia" aria-hidden="true" />
              <span className="gnostic-constellation-instrument__quaternio" aria-hidden="true">
                {gnosticQuaternioPoints.map((point) => (
                  <span key={point} className={`gnostic-constellation-instrument__point gnostic-constellation-instrument__point--${point}`} />
                ))}
              </span>
              <span className="gnostic-constellation-instrument__center" aria-hidden="true" />
              <span className="gnostic-constellation-instrument__rupture" aria-hidden="true" />
              {gnosticParadoxShards.map((shard) => (
                <span key={shard} className={`gnostic-constellation-instrument__shard gnostic-constellation-instrument__shard--${shard}`} aria-hidden="true" />
              ))}
              <span className="gnostic-constellation-instrument__label gnostic-constellation-instrument__label--emanation" aria-hidden="true">emanation</span>
              <span className="gnostic-constellation-instrument__label gnostic-constellation-instrument__label--fourfold" aria-hidden="true">fourfold pattern</span>
              <span className="gnostic-constellation-instrument__label gnostic-constellation-instrument__label--paradox" aria-hidden="true">rupture</span>
            </div>
          )}
          <div className="chapter-stage__thesis-map" aria-label="Chapter visual sequence">
            {experience.panels.map((panel, index) => (
              <button
                key={panel.id}
                className={panel.id === activePanelId ? 'chapter-stage__thesis-node chapter-stage__thesis-node--active' : 'chapter-stage__thesis-node'}
                type="button"
                onClick={() => setActivePanelId(panel.id)}
                aria-pressed={panel.id === activePanelId}
                aria-controls={`${chapter.id}-${panel.id}`}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {panel.kicker}
              </button>
            ))}
          </div>
          <div className="chapter-stage__reference-map" aria-label={`${chapter.title} visual reference`} role="group">
            {experience.panels.map((panel, index) => (
              <button
                key={panel.id}
                className={panel.id === activePanelId ? 'chapter-stage__reference-node chapter-stage__reference-node--active' : 'chapter-stage__reference-node'}
                type="button"
                onClick={() => setActivePanelId(panel.id)}
                aria-pressed={panel.id === activePanelId}
                aria-controls={`${chapter.id}-${panel.id}`}
                aria-label={`Show ${panel.title}: ${panel.insight}`}
                data-panel-id={panel.id}
              >
                <span className="chapter-stage__reference-mark" aria-hidden="true">
                  {quaternityDirections.map((direction) => (
                    <span key={direction} className={`chapter-stage__reference-quadrant chapter-stage__reference-quadrant--${direction}`} />
                  ))}
                </span>
                <span className="chapter-stage__reference-label">{String(index + 1).padStart(2, '0')} {panel.kicker}</span>
              </button>
            ))}
          </div>
          {chapter.id === 'ch1' && (
            <div
              className="ego-depth-instrument"
              data-active-panel={activePanelId}
              role="img"
              aria-label="Ego depth model: the conscious ego shines at the surface, somatic and psychic roots descend, and the Self holds the wider field below."
            >
              <span className="ego-depth-instrument__axis" aria-hidden="true" />
              <span className="ego-depth-instrument__surface" aria-hidden="true" />
              <span className="ego-depth-instrument__ego" aria-hidden="true" />
              <span className="ego-depth-instrument__root ego-depth-instrument__root--somatic" aria-hidden="true" />
              <span className="ego-depth-instrument__root ego-depth-instrument__root--psychic" aria-hidden="true" />
              <span className="ego-depth-instrument__wake ego-depth-instrument__wake--one" aria-hidden="true" />
              <span className="ego-depth-instrument__wake ego-depth-instrument__wake--two" aria-hidden="true" />
              <span className="ego-depth-instrument__self" aria-hidden="true" />
              <span className="ego-depth-instrument__label ego-depth-instrument__label--ego" aria-hidden="true">ego</span>
              <span className="ego-depth-instrument__label ego-depth-instrument__label--roots" aria-hidden="true">roots</span>
              <span className="ego-depth-instrument__label ego-depth-instrument__label--self" aria-hidden="true">Self</span>
            </div>
          )}
          {activePanel && (
            <p className="sr-only" role="status" aria-live="polite">
              Active scene state: {activePanel.title}. {activePanel.insight}
            </p>
          )}
        </div>
      </section>

      <section className="chapter-panels" aria-label="Chapter learning panels">
        {experience.panels.map((panel, index) => (
          <div
            key={panel.id}
            id={`${chapter.id}-${panel.id}`}
            className={panel.id === activePanelId ? 'chapter-panel chapter-panel--active' : 'chapter-panel'}
            data-chapter-panel={chapter.id}
            data-panel-id={panel.id}
            role="region"
            aria-labelledby={`${chapter.id}-${panel.id}-title`}
          >
            <div className="chapter-panel__symbol" aria-hidden="true">
              <span className="chapter-panel__ring chapter-panel__ring--outer" />
              <span className="chapter-panel__ring chapter-panel__ring--inner" />
              <span className="chapter-panel__axis chapter-panel__axis--vertical" />
              <span className="chapter-panel__axis chapter-panel__axis--horizontal" />
              <span className="chapter-panel__spark chapter-panel__spark--one" />
              <span className="chapter-panel__spark chapter-panel__spark--two" />
              <span className="chapter-panel__depth chapter-panel__depth--one" />
              <span className="chapter-panel__depth chapter-panel__depth--two" />
              {quaternityDirections.map((direction) => (
                <span key={direction} className={`chapter-panel__quaternity-point chapter-panel__quaternity-point--${direction}`} />
              ))}
              {mandalaBands.map((band) => (
                <span key={band} className={`chapter-panel__mandala-band chapter-panel__mandala-band--${band}`} />
              ))}
              {rootLines.map((line) => (
                <span key={line} className={`chapter-panel__root-line chapter-panel__root-line--${line}`} />
              ))}
            </div>
            <div className="chapter-panel__copy">
              <span className="chapter-panel__count">{String(index + 1).padStart(2, '0')}</span>
              <p className="eyebrow">{panel.kicker}</p>
              <h2 id={`${chapter.id}-${panel.id}-title`}>{panel.title}</h2>
              <p>{panel.body}</p>
              <strong>{panel.insight}</strong>
            </div>
          </div>
        ))}
      </section>

      <section className="chapter-knowledge section-band">
        <div className="chapter-knowledge__block">
          <p className="eyebrow">Core terms</p>
          <h2>Concept anchors</h2>
          <div className="term-stack">
            {concepts.map((concept) => (
              <details key={concept.id}>
                <summary>{concept.label}</summary>
                <p>{concept.definition}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="chapter-knowledge__block">
          <p className="eyebrow">Checkpoints</p>
          <h2>Insight checks</h2>
          <ol className="checkpoint-list">
            {experience.checkpoints.map((checkpoint) => (
              <li key={checkpoint}>{checkpoint}</li>
            ))}
          </ol>
          <div className="reflection-box">
            <h3>{learningObjects[1]?.title || 'Reflection'}</h3>
            <p>{learningObjects[1]?.prompt || 'Hold one concept beside its opposite and note what changes.'}</p>
          </div>
        </div>
      </section>

      <nav className="chapter-next section-band section-band--tight" aria-label="Chapter sequence">
        {adjacent.previous ? (
          <Link to={getChapterRoute(adjacent.previous.id)} className="sequence-link">
            <span>Previous</span>
            <strong>{adjacent.previous.title}</strong>
          </Link>
        ) : (
          <span />
        )}
        {adjacent.next ? (
          <Link to={getChapterRoute(adjacent.next.id)} className="sequence-link sequence-link--next">
            <span>Next</span>
            <strong>{adjacent.next.title}</strong>
          </Link>
        ) : (
          <Link to="/atlas" className="sequence-link sequence-link--next">
            <span>Return</span>
            <strong>Atlas</strong>
          </Link>
        )}
      </nav>
    </article>
  );
}
