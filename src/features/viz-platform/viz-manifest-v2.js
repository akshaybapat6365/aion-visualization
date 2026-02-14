/**
 * viz-manifest-v2.js
 * Central registry of Aion visualization modules.
 * Version 2 to bust browser cache.
 */

export const VIZ_MANIFEST = {
    'ch1': '/src/visualizations/chapters/ch1/ThreeEgoViz.js', // [PHASE 7] 3D Upgrade
    'ch2': '/src/visualizations/chapters/ch2/ThreeShadowViz.js', // [PHASE 7] The Shadow
    'ch3': '/src/visualizations/chapters/ch3/ThreeSyzygyViz.js', // [PHASE 7] The Syzygy (New)
    'ch4': '/src/visualizations/chapters/ch4/ThreeSelfViz.js',   // [PHASE 7] The Self (New)
    'ch3': '/src/visualizations/chapters/ch3/syzygy-poles-viz.js',
    'ch4': '/src/visualizations/chapters/ch4/self-mandala-viz.js',
    'ch5': '/src/visualizations/chapters/ch5/ThreeCrystalViz.js',
    'ch6': '/src/visualizations/chapters/ch6/aeon-wheel-viz.js',
    'ch7': '/src/visualizations/chapters/ch7/prophecy-timeline-viz.js',
    'ch8': '/src/visualizations/chapters/ch8/fish-evolution-viz.js',
    'ch9': '/src/visualizations/chapters/ch9/paradox-mirror-viz.js',
    'ch10': '/src/visualizations/chapters/ch10/alchemical-vessel-viz.js',
    'ch11': '/src/visualizations/chapters/ch11/opus-wheel-viz.js',
    'ch12': '/src/visualizations/chapters/ch12/prima-materia-lab-viz.js',
    'ch13': '/src/visualizations/chapters/ch13/emanation-spheres-viz.js',
    'ch14': '/src/visualizations/chapters/ch14/living-mandala-viz.js',
};

export const getVizPath = (chapterId) => VIZ_MANIFEST[chapterId] || null;
