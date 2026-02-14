/**
 * viz-manifest.js
 * Central registry of Aion visualization modules.
 */

export const VIZ_MANIFEST = {
    ch1: '/src/visualizations/chapters/ch1/ego-self-viz.js',
    ch2: '/src/visualizations/chapters/ch2/shadow-projection-viz.js',
    ch3: '/src/visualizations/chapters/ch3/syzygy-poles-viz.js',
    ch4: '/src/visualizations/chapters/ch4/self-mandala-viz.js',
    ch5: '/src/visualizations/chapters/ch5/christ-quaternity.js?v=1',
    ch6: '/src/visualizations/chapters/ch6/aeon-wheel-viz.js',
    ch7: '/src/visualizations/chapters/ch7/prophecy-timeline-viz.js',
    ch8: '/src/visualizations/chapters/ch8/fish-evolution-viz.js',
    ch9: '/src/visualizations/chapters/ch9/paradox-mirror-viz.js',
    ch10: '/src/visualizations/chapters/ch10/alchemical-vessel-viz.js',
    ch11: '/src/visualizations/chapters/ch11/opus-wheel-viz.js',
    ch12: '/src/visualizations/chapters/ch12/prima-materia-lab-viz.js',
    ch13: '/src/visualizations/chapters/ch13/emanation-spheres-viz.js',
    ch14: '/src/visualizations/chapters/ch14/living-mandala-viz.js',
};

export const getVizPath = (chapterId) => VIZ_MANIFEST[chapterId] || null;
