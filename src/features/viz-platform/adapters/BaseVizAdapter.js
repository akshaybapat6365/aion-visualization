import VizLearningOverlay from '../VizLearningOverlay.js';

export default class BaseVizAdapter {
  constructor(config) {
    this.config = config;
    this.container = null;
    this.context = {};
    this.mode = 'guided';
    this.instance = null;
    this.overlay = new VizLearningOverlay(config.overlay);
    this.checkpoints = config.overlay.checkpoints.map((item) => ({ ...item, complete: false }));
    this.keyboardHandler = this.onKeyDown.bind(this);
    this.reducedPanel = null;
  }

  init(context = {}) {
    this.context = context;
    if (context.prefersReducedMotion) {
      this.mode = 'reduced-motion';
    }
  }

  mount(container) {
    this.container = container;
    this.overlay.mount(container);
    this.overlay.render({ ...this.config.overlay, checkpoints: this.checkpoints, exitSummary: this.summarizeLearning().summary });

    this.instance = this.config.createInstance(container);
    this.mountKeyboardSupport();
    if (this.mode === 'reduced-motion') {
      this.enableReducedMotionInteraction();
    }
  }

  mountKeyboardSupport() {
    if (!this.container) return;
    this.container.tabIndex = this.container.tabIndex >= 0 ? this.container.tabIndex : 0;
    this.container.addEventListener('keydown', this.keyboardHandler);
  }

  onKeyDown(event) {
    if (event.key === '1' || event.key === '2' || event.key === '3') {
      const index = Number(event.key) - 1;
      if (this.checkpoints[index]) {
        this.markCheckpoint(this.checkpoints[index].id, true);
      }
      return;
    }

    if (event.key.toLowerCase() === 'm') {
      this.setMode(this.mode === 'reduced-motion' ? 'guided' : 'reduced-motion');
    }
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'reduced-motion') {
      this.enableReducedMotionInteraction();
      if (typeof this.config.pauseMotion === 'function') {
        this.config.pauseMotion(this.instance);
      }
    } else {
      this.disableReducedMotionInteraction();
      if (typeof this.config.resumeMotion === 'function') {
        this.config.resumeMotion(this.instance);
      }
    }
  }

  enableReducedMotionInteraction() {
    if (!this.container || this.reducedPanel) return;

    this.reducedPanel = document.createElement('div');
    this.reducedPanel.className = 'viz-reduced-motion-panel';
    this.reducedPanel.innerHTML = `
      <p><strong>Reduced-motion mode enabled:</strong> use discrete steps instead of continuous animation.</p>
      <button type="button" data-step="0">Step 1</button>
      <button type="button" data-step="1">Step 2</button>
      <button type="button" data-step="2">Step 3</button>
    `;

    this.reducedPanel.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.step);
        const checkpoint = this.checkpoints[index];
        if (checkpoint) this.markCheckpoint(checkpoint.id, true);
      });
    });

    this.container.appendChild(this.reducedPanel);
  }

  disableReducedMotionInteraction() {
    if (this.reducedPanel) {
      this.reducedPanel.remove();
      this.reducedPanel = null;
    }
  }

  markCheckpoint(id, complete = true) {
    this.checkpoints = this.checkpoints.map((checkpoint) =>
      checkpoint.id === id ? { ...checkpoint, complete } : checkpoint
    );

    this.overlay.updateCheckpoints(this.checkpoints);
    this.overlay.updateExitSummary(this.summarizeLearning().summary);

    if (typeof this.context.onCheckpoint === 'function') {
      this.context.onCheckpoint(id, complete);
    }
  }

  getCheckpointState() {
    return this.checkpoints;
  }

  summarizeLearning() {
    const completed = this.checkpoints.filter((checkpoint) => checkpoint.complete).length;
    const total = this.checkpoints.length;

    return {
      learningObjective: this.config.overlay.learningObjective,
      completed,
      total,
      summary: `${completed}/${total} insights captured in ${this.config.label}. Focus on symbolic tension and integration before moving on.`
    };
  }

  dispose() {
    this.disableReducedMotionInteraction();
    if (this.container) {
      this.container.removeEventListener('keydown', this.keyboardHandler);
    }

    if (typeof this.config.disposeInstance === 'function') {
      this.config.disposeInstance(this.instance);
    }

    this.overlay.dispose();
    this.instance = null;
    this.container = null;
  }
}
