import BaseVizAdapter from './BaseVizAdapter.js';
import EgoSelfViz from '../../../visualizations/chapters/ch1/ego-self-viz.js';

/**
 * EgoSphereAdapter — Chapter 1: The Ego
 * Wraps the ego-self consciousness visualization.
 */
export default class EgoSphereAdapter extends BaseVizAdapter {
    constructor() {
        super({
            label: 'ego sphere',
            overlay: {
                learningObjective:
                    'See the ego as a small luminous center within the vast field of the Self.',
                instructions: [
                    'Observe the glowing sphere (ego) within the larger wireframe (Self).',
                    'Hover your mouse to illuminate unconscious particles near awareness.',
                    'Drag to rotate and see the ego from different perspectives.',
                ],
                checkpoints: [
                    { id: 'ego-center', label: 'Noticed the ego as the center of consciousness.' },
                    { id: 'ego-limits', label: 'Observed the boundary between ego-light and darkness.' },
                    { id: 'ego-self', label: 'Understood that the Self is far larger than the ego.' },
                ],
            },
            createInstance: (container) => new EgoSelfViz(container),
            pauseMotion: (instance) => instance?.pause?.(),
            resumeMotion: (instance) => instance?.resume?.(),
            disposeInstance: (instance) => instance?.dispose?.(),
        });
    }
}
