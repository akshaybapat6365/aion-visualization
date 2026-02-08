import VizFallbackPanel from './VizFallbackPanel.js';
import FishTimelineAdapter from './adapters/FishTimelineAdapter.js';
import ShadowIntegrationAdapter from './adapters/ShadowIntegrationAdapter.js';
import AnimaAnimusAdapter from './adapters/AnimaAnimusAdapter.js';
import GnosticMapAdapter from './adapters/GnosticMapAdapter.js';
import AlchemyLabAdapter from './adapters/AlchemyLabAdapter.js';
import AionClockAdapter from './adapters/AionClockAdapter.js';

const ADAPTERS = {
  fishTimeline: FishTimelineAdapter,
  shadowIntegration: ShadowIntegrationAdapter,
  animaAnimus: AnimaAnimusAdapter,
  gnosticMap: GnosticMapAdapter,
  alchemicalLab: AlchemyLabAdapter,
  aionClock: AionClockAdapter
};

export default class VizLifecycleManager {
  constructor(moduleKey) {
    this.moduleKey = moduleKey;
    this.adapter = null;
    this.fallbackPanel = new VizFallbackPanel();
  }

  init(context = {}) {
    const AdapterCtor = ADAPTERS[this.moduleKey];
    if (!AdapterCtor) {
      throw new Error(`Unknown visualization module: ${this.moduleKey}`);
    }

    this.adapter = new AdapterCtor();
    this.adapter.init(context);
  }

  mount(container) {
    try {
      this.adapter.mount(container);
    } catch (error) {
      this.fallbackPanel.mount(container, {
        reason: `Interactive module failed to initialize (${error.message}).`
      });
    }
  }

  setMode(mode) {
    this.adapter?.setMode(mode);
  }

  getCheckpointState() {
    return this.adapter?.getCheckpointState() || [];
  }

  summarizeLearning() {
    return (
      this.adapter?.summarizeLearning() || {
        learningObjective: 'No module loaded',
        completed: 0,
        total: 0,
        summary: 'No learning summary available.'
      }
    );
  }

  dispose() {
    this.adapter?.dispose();
    this.fallbackPanel.dispose();
    this.adapter = null;
  }
}

export { ADAPTERS };
