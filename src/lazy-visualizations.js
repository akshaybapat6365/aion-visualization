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
      if (fnName && typeof window[fnName] === 'function') {
        window[fnName](entry.target);
      }
      visualizationObserver.unobserve(entry.target);
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
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-load-fn]").forEach(el => observeVisualization(el, el.dataset.loadFn));
});

