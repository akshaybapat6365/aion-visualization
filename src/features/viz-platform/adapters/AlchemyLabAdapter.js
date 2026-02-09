import AlchemyLab from '../../../visualizations/alchemy/AlchemyLab.js';
import BaseVizAdapter from './BaseVizAdapter.js';

export default class AlchemyLabAdapter extends BaseVizAdapter {
  constructor() {
    super({
      label: 'alchemical lab',
      overlay: {
        learningObjective: 'Experiment with transformation stages as metaphors of individuation.',
        instructions: ['Combine elements in the vessel.', 'Track stage transitions in the opus.', 'Record core insights with keyboard checkpoints.'],
        checkpoints: [
          { id: 'alchemy-nigredo', label: 'Understood nigredo as dissolution.' },
          { id: 'alchemy-albedo', label: 'Observed purification and clarification stages.' },
          { id: 'alchemy-rubedo', label: 'Interpreted rubedo as symbolic integration.' }
        ]
      },
      createInstance: (container) => {
        if (!container.id) {
          container.id = `alchemy-lab-${Math.random().toString(36).slice(2, 9)}`;
        }
        return new AlchemyLab(container.id);
      },
      pauseMotion: () => {},
      resumeMotion: () => {},
      disposeInstance: (instance) => {
        if (instance?.container) instance.container.innerHTML = '';
      }
    });
  }
}
