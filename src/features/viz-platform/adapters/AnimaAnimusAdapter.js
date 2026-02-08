import AnimaAnimus from '../../../visualizations/constellation/AnimaAnimus.js';
import BaseVizAdapter from './BaseVizAdapter.js';

export default class AnimaAnimusAdapter extends BaseVizAdapter {
  constructor() {
    super({
      label: 'anima/animus constellation',
      overlay: {
        learningObjective: 'Explore contrasexual archetypes and their relationship to individuation.',
        instructions: ['Orbit and inspect archetype nodes.', 'Select node relationships to compare tensions.', 'Use 1-3 keys to capture conceptual insights.'],
        checkpoints: [
          { id: 'anima-animus-core', label: 'Differentiated anima and animus functions.' },
          { id: 'anima-animus-shadow', label: 'Mapped their relation to shadow/persona.' },
          { id: 'anima-animus-self', label: 'Connected constellation to the Self.' }
        ]
      },
      createInstance: (container) => new AnimaAnimus(container),
      pauseMotion: (instance) => {
        if (instance?.controls) instance.controls.enableDamping = false;
      },
      resumeMotion: (instance) => {
        if (instance?.controls) instance.controls.enableDamping = true;
      },
      disposeInstance: (instance) => instance?.dispose?.()
    });
  }
}
