import BaseVizAdapter from './BaseVizAdapter.js';
import SelfMandalaViz from '../../../visualizations/chapters/ch4/self-mandala-viz.js';

/**
 * SelfMandalaAdapter — Chapter 4: The Self
 * Wraps the progressive mandala-building visualization.
 */
export default class SelfMandalaAdapter extends BaseVizAdapter {
    constructor() {
        super({
            label: 'self mandala',
            overlay: {
                learningObjective:
                    'Build the mandala of the Self by activating each layer — ego, shadow, anima/animus, collective unconscious.',
                instructions: [
                    'The ego (gold dot) is already active at the center.',
                    'Click each concentric ring in order to activate the next layer.',
                    'Watch the quaternity (4-fold structure) emerge when the Self ring completes.',
                ],
                checkpoints: [
                    { id: 'mandala-ego', label: 'Recognized the ego as the starting center.' },
                    { id: 'mandala-layers', label: 'Activated all psychic layers.' },
                    { id: 'mandala-quaternity', label: 'Saw the Self as a totality integrating all layers.' },
                ],
            },
            createInstance: (container) => new SelfMandalaViz(container),
            pauseMotion: (instance) => instance?.pause?.(),
            resumeMotion: (instance) => instance?.resume?.(),
            disposeInstance: (instance) => instance?.dispose?.(),
        });
    }
}
