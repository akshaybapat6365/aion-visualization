export const VISUALIZATION_PERFORMANCE_BUDGETS = {
  webVitals: {
    lcpMs: 2500,
    cls: 0.1,
    tbtMs: 300
  },
  scene: {
    initTimeMs: 1200,
    maxGpuMemoryUnits: 300
  },
  targetFpsByDeviceClass: {
    low: 30,
    medium: 45,
    high: 60
  }
};

export function getDeviceClass() {
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;

  if (memory <= 2 || cores <= 2) {
    return 'low';
  }

  if (memory <= 4 || cores <= 4) {
    return 'medium';
  }

  return 'high';
}
