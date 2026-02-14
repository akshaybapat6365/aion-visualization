/**
 * viz-manifest-v3.js
 * Central registry of Aion visualization modules — Immersive Redesign.
 * Each chapter maps to a full-screen Three.js scene.
 */

export const VIZ_MANIFEST = {
    'ch1': '/src/visualizations/chapters/ch1/ThreeEgoViz.js',
    'ch2': '/src/visualizations/chapters/ch2/ThreeShadowViz.js',
    'ch3': '/src/visualizations/chapters/ch3/ThreeSyzygyViz.js',
    'ch4': '/src/visualizations/chapters/ch4/ThreeSelfViz.js',
    'ch5': '/src/visualizations/chapters/ch5/ThreeChristViz.js',
    'ch6': '/src/visualizations/chapters/ch6/ThreeFishViz.js',
    'ch7': '/src/visualizations/chapters/ch7/ThreeProphecyViz.js',
    'ch8': '/src/visualizations/chapters/ch8/ThreeHistoricalViz.js',
    'ch9': '/src/visualizations/chapters/ch9/ThreeOuroborosViz.js',
    'ch10': '/src/visualizations/chapters/ch10/ThreeGnosticViz.js',
    'ch11': '/src/visualizations/chapters/ch11/ThreeUnusMundusViz.js',
    'ch12': '/src/visualizations/chapters/ch12/ThreeSacredMarriageViz.js',
    'ch13': '/src/visualizations/chapters/ch13/ThreeQuaternioViz.js',
    'ch14': '/src/visualizations/chapters/ch14/ThreeAeonViz.js',
};

export const getVizPath = (chapterId) => VIZ_MANIFEST[chapterId] || null;
