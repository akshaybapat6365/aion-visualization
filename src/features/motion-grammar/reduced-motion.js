export function prefersReducedMotion(win = globalThis.window) {
  if (!win || typeof win.matchMedia !== 'function') {
    return false;
  }

  return win.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function toMotionMode({ reducedMotionRequested = false, win } = {}) {
  return reducedMotionRequested || prefersReducedMotion(win) ? 'reduced' : 'animated';
}
