export default class VizLearningOverlay {
  constructor(config = {}) {
    this.config = config;
    this.element = null;
  }

  mount(container) {
    if (this.element) {
      this.element.remove();
    }

    this.element = document.createElement('aside');
    this.element.className = 'viz-learning-overlay';
    this.element.setAttribute('aria-label', 'Visualization learning guide');
    container.appendChild(this.element);
    this.render(this.config);
  }

  render({ learningObjective, instructions = [], checkpoints = [], exitSummary = '' }) {
    if (!this.element) return;

    this.element.innerHTML = `
      <section class="viz-overlay-section">
        <h3>Learning objective</h3>
        <p>${learningObjective || 'Understand how this symbol evolves and integrates with Jung\'s model.'}</p>
      </section>
      <section class="viz-overlay-section">
        <h3>Interaction instructions</h3>
        <ol>
          ${instructions.map((item) => `<li>${item}</li>`).join('')}
        </ol>
      </section>
      <section class="viz-overlay-section">
        <h3>Insight checkpoints</h3>
        <ul>
          ${checkpoints
            .map(
              (checkpoint) =>
                `<li data-id="${checkpoint.id}" aria-live="polite">${checkpoint.complete ? '✓' : '○'} ${checkpoint.label}</li>`
            )
            .join('')}
        </ul>
      </section>
      <section class="viz-overlay-section">
        <h3>Exit summary</h3>
        <p>${exitSummary}</p>
      </section>
    `;
  }

  updateCheckpoints(checkpoints = []) {
    if (!this.element) return;

    checkpoints.forEach((checkpoint) => {
      const node = this.element.querySelector(`[data-id="${checkpoint.id}"]`);
      if (node) {
        node.textContent = `${checkpoint.complete ? '✓' : '○'} ${checkpoint.label}`;
      }
    });
  }

  updateExitSummary(summary) {
    if (!this.element) return;
    const section = this.element.querySelector('.viz-overlay-section:last-child p');
    if (section) section.textContent = summary;
  }

  dispose() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
