export class MockViz {
  constructor(container) {
    this.container = container;
    this.handleResize = () => {};
    window.addEventListener('resize', this.handleResize);
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize);
    window.__mockListenerRemovals = (window.__mockListenerRemovals || 0) + 1;
    window.__mockVizDisposeCalls = (window.__mockVizDisposeCalls || 0) + 1;
  }
}
