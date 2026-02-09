import ShadowIntegration from '../../../visualizations/shadow/ShadowIntegration.js';
import BaseVizAdapter from './BaseVizAdapter.js';

export default class ShadowIntegrationAdapter extends BaseVizAdapter {
  constructor() {
    super({
      label: 'shadow integration',
      overlay: {
        learningObjective: 'Practice integration between conscious and shadow contents through guided interactions.',
        instructions: ['Drag shadow particles across the threshold.', 'Observe how integration feedback changes state.', 'Use checkpoints to capture key insights.'],
        checkpoints: [
          { id: 'shadow-threshold', label: 'Observed conscious/unconscious boundary dynamics.' },
          { id: 'shadow-integration', label: 'Triggered at least one integration event.' },
          { id: 'shadow-reflection', label: 'Reflected on resistance and reconciliation.' }
        ]
      },
      createInstance: (container) => {
        const viz = new ShadowIntegration(container);
        viz.start();
        return viz;
      },
      pauseMotion: (instance) => instance?.stop?.(),
      resumeMotion: (instance) => instance?.start?.(),
      disposeInstance: (instance) => instance?.destroy?.()
    });
  }
}
