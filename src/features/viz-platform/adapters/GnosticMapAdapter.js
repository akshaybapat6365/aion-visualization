import { GnosticMap } from '../../../visualizations/cosmology/GnosticMap.js';
import BaseVizAdapter from './BaseVizAdapter.js';

export default class GnosticMapAdapter extends BaseVizAdapter {
  constructor() {
    super({
      label: 'gnostic map',
      overlay: {
        learningObjective: 'Understand layered cosmology and the psyche\'s descent/ascent motifs in Aion.',
        instructions: ['Navigate realms with buttons.', 'Use guided tour for ordered progression.', 'Capture 3 insights across realm transitions.'],
        checkpoints: [
          { id: 'gnostic-pleroma', label: 'Identified pleroma as fullness/unity symbol.' },
          { id: 'gnostic-kenoma', label: 'Explained kenoma as deficiency/alienation motif.' },
          { id: 'gnostic-integration', label: 'Connected cosmology to psychic development.' }
        ]
      },
      createInstance: (container) => new GnosticMap(container),
      pauseMotion: (instance) => instance?.stopGuidedTour?.(),
      resumeMotion: (instance) => instance?.startGuidedTour?.(),
      disposeInstance: (instance) => {
        if (instance?.renderer?.domElement?.parentNode) {
          instance.renderer.domElement.parentNode.removeChild(instance.renderer.domElement);
        }
      }
    });
  }
}
