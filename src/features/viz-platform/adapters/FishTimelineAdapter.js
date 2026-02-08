import { FishSymbolTimeline } from '../../../visualizations/chapters/chapter-4-fish/fish-symbol-timeline.js';
import BaseVizAdapter from './BaseVizAdapter.js';

export default class FishTimelineAdapter extends BaseVizAdapter {
  constructor() {
    super({
      label: 'fish timeline',
      overlay: {
        learningObjective: 'Track the fish symbol from antiquity to Jung and identify symbolic continuity.',
        instructions: ['Use arrow keys to navigate events.', 'Open event detail by selecting a marker.', 'Mark checkpoint keys 1-3 as insights become clear.'],
        checkpoints: [
          { id: 'fish-origin', label: 'Recognized pre-Christian fish meanings.' },
          { id: 'fish-christian', label: 'Connected ichthys to Christian symbolic development.' },
          { id: 'fish-jung', label: 'Linked timeline to Jung\'s psychological interpretation.' }
        ]
      },
      createInstance: (container) => new FishSymbolTimeline(container),
      pauseMotion: (instance) => {
        if (instance) instance.animationPaused = true;
      },
      resumeMotion: (instance) => {
        if (instance) instance.animationPaused = false;
      },
      disposeInstance: (instance) => {
        if (!instance || !instance.container) return;
        instance.container.innerHTML = '';
      }
    });
  }
}
