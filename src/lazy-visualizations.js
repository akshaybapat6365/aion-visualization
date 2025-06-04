// Lazy loading for chapter visualizations using IntersectionObserver
const observerOptions = {
  root: null,
  rootMargin: '50px',
  threshold: 0.1
};

const visualizationObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fnName = entry.target.dataset.loadFn;
      const modulePath = entry.target.dataset.module;

      const invoke = fn => {
        if (typeof fn === 'function') fn(entry.target);
        visualizationObserver.unobserve(entry.target);
      };

      if (modulePath) {
        import(modulePath).then(mod => {
          invoke(mod[fnName] || mod.default);
        }).catch(() => invoke(window[fnName]));
      } else if (fnName && typeof window[fnName] === 'function') {
        invoke(window[fnName]);
      } else {
        visualizationObserver.unobserve(entry.target);
      }
    }
  });
}, observerOptions);

export function observeVisualization(element, fnName) {
  if (element) {
    element.dataset.loadFn = fnName;
    visualizationObserver.observe(element);
  }
}


window.observeVisualization = observeVisualization;
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-load-fn]').forEach(el => observeVisualization(el, el.dataset.loadFn));
});

