import AionClock from '../../../visualizations/clock/AionClock.js';
import BaseVizAdapter from './BaseVizAdapter.js';

export default class AionClockAdapter extends BaseVizAdapter {
  constructor() {
    super({
      label: 'aion clock',
      overlay: {
        learningObjective: 'Read temporal symbolism of zodiac ages and relate it to Jung\'s Aion framework.',
        instructions: ['Adjust timeline progression.', 'Compare age transitions and key events.', 'Mark checkpoint completion with 1-3 keys.'],
        checkpoints: [
          { id: 'clock-cycle', label: 'Understood Great Year cycle structure.' },
          { id: 'clock-pisces', label: 'Identified Pisces/Aquarius symbolic transition.' },
          { id: 'clock-aion', label: 'Connected time model to chapter thesis.' }
        ]
      },
      createInstance: (container) => {
        if (!container.id) {
          container.id = `aion-clock-${Math.random().toString(36).slice(2, 9)}`;
        }
        return new AionClock(container.id);
      },
      pauseMotion: (instance) => instance?.pause?.(),
      resumeMotion: (instance) => instance?.play?.(),
      disposeInstance: (instance) => {
        if (instance?.container) instance.container.innerHTML = '';
      }
    });
  }
}
