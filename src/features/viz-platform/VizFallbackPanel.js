export default class VizFallbackPanel {
  constructor() {
    this.element = null;
  }

  mount(container, payload = {}) {
    this.dispose();
    const { title = 'Visualization fallback mode', reason = 'Interactive rendering is unavailable.' } = payload;

    this.element = document.createElement('section');
    this.element.className = 'viz-fallback-panel';
    this.element.setAttribute('role', 'status');
    this.element.innerHTML = `
      <h3>${title}</h3>
      <p>${reason}</p>
      <p>This fallback preserves key terms, checkpoints, and summary prompts so learning can continue.</p>
    `;

    container.appendChild(this.element);
  }

  dispose() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
