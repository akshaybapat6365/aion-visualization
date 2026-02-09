import { getMotionPreset } from './presets.js';
import { getPresetForRelationType, getPresetForVisualizationTransition, VISUALIZATION_STATE_TRANSITIONS } from './state-transition-map.js';
import { toMotionMode } from './reduced-motion.js';

export { MOTION_PRESETS } from './presets.js';
export { VISUALIZATION_STATE_TRANSITIONS, RELATION_TYPE_TO_PRESET } from './state-transition-map.js';
export { prefersReducedMotion, toMotionMode } from './reduced-motion.js';

export function resolveMotionPlan({ moduleName, transitionKey, relationType, reducedMotionRequested = false, win } = {}) {
  const semanticPreset = relationType
    ? getPresetForRelationType(relationType)
    : getPresetForVisualizationTransition(moduleName, transitionKey);

  const preset = getMotionPreset(semanticPreset);
  const mode = toMotionMode({ reducedMotionRequested, win });

  return {
    semanticPreset,
    mode,
    meaning: preset.meaning,
    learningObjective: preset.learningObjective,
    behavior: mode === 'reduced' ? preset.reducedMotion.behavior : preset.animation.behavior,
    cue: mode === 'reduced' ? preset.reducedMotion.cue : `${preset.animation.durationMs}ms / ${preset.animation.easing}`
  };
}

export function getMotionBehaviorForRelation(relationType, options = {}) {
  return resolveMotionPlan({ relationType, ...options }).semanticPreset;
}

if (typeof window !== 'undefined') {
  window.AionMotionGrammar = {
    resolveMotionPlan,
    getMotionBehaviorForRelation,
    getPresetForVisualizationTransition: (moduleName, transitionKey) =>
      getPresetForVisualizationTransition(moduleName, transitionKey),
    transitions: VISUALIZATION_STATE_TRANSITIONS
  };
}
