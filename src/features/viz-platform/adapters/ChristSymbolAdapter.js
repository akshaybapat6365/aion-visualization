import BaseVizAdapter from './BaseVizAdapter.js';

/**
 * ChristSymbolAdapter
 * D3 SVG quaternity cross diagram for ch5 (Christ as Symbol of the Self).
 * Interactive poles: Christ, Shadow, Father, Mother.
 */
export default class ChristSymbolAdapter extends BaseVizAdapter {
    constructor() {
        super({
            label: 'christ quaternity',
            overlay: {
                learningObjective: 'Explore Jung\'s quaternity as opposing the trinity with a fourth, shadow element.',
                instructions: [
                    'Click each pole of the quaternity to reveal its psychological meaning.',
                    'Observe the tension lines connecting opposing poles.',
                    'Record insights using keyboard checkpoints (1, 2, 3).'
                ],
                checkpoints: [
                    { id: 'quat-trinity', label: 'Understood the traditional trinitarian structure.' },
                    { id: 'quat-shadow', label: 'Identified the excluded fourth element (shadow).' },
                    { id: 'quat-totality', label: 'Recognized the quaternity as a symbol of psychic wholeness.' }
                ]
            },
            createInstance: (container) => {
                if (!container.id) {
                    container.id = `christ-quat-${Math.random().toString(36).slice(2, 9)}`;
                }
                return import('../../../visualizations/chapters/ch5/christ-quaternity.js')
                    .then(mod => {
                        const viz = mod.default || mod;
                        return typeof viz === 'function' ? new viz(container) : viz.init?.(container);
                    })
                    .catch(() => {
                        container.innerHTML = `
              <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-tertiary);font-family:var(--font-sans);">
                <p>Quaternity diagram loading…</p>
              </div>`;
                    });
            },
            pauseMotion: () => { },
            resumeMotion: () => { },
            disposeInstance: (instance) => { instance?.dispose?.(); }
        });
    }
}
