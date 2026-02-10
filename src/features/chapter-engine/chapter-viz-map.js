/**
 * chapter-viz-map.js
 * Maps each chapter ID to its primary visualization adapter key.
 * Keys must match those registered in VizLifecycleManager's ADAPTERS object.
 */

const CHAPTER_VIZ_MAP = {
    ch1: 'egoSphere',           // Ego-sphere consciousness visualization
    ch2: 'shadowIntegration',   // Shadow Integration – Matter.js particles
    ch3: 'animaAnimus',         // Constellation – Three.js + D3 force graph
    ch4: 'selfMandala',         // Self Mandala – D3 SVG concentric rings
    ch5: 'christSymbol',        // Christ/Self Quaternity – D3 SVG cross
    ch6: 'fishTimeline',        // Fish Symbol Timeline – D3
    ch7: 'fishTimeline',        // History of the Fish Symbol (cont.)
    ch8: 'fishTimeline',        // Fish Symbol in Alchemy
    ch9: 'fishTimeline',        // Ambiguity of the Fish Symbol
    ch10: 'alchemicalLab',       // Alchemical Transformation Lab – SVG
    ch11: 'alchemicalLab',       // Alchemical Interpretation (cont.)
    ch12: 'alchemicalLab',       // Background to the Psychology of Alchemy
    ch13: 'gnosticMap',          // Gnostic Cosmology Map – Three.js
    ch14: 'aionClock',           // Aion Clock – D3 SVG zodiac wheel
};

/**
 * Resolve the viz adapter key for a given chapter ID.
 * Returns null if no visualization is mapped.
 */
export function getVizKeyForChapter(chapterId) {
    return CHAPTER_VIZ_MAP[chapterId] || null;
}

export default CHAPTER_VIZ_MAP;
