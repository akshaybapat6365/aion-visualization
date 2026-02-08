export const MOTION_PRESETS = Object.freeze({
  opposition: Object.freeze({
    id: 'opposition',
    label: 'Opposition',
    meaning: 'Psychic tension and differentiation between conflicting forces.',
    animation: Object.freeze({
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      durationMs: 420,
      behavior: 'divergent-split'
    }),
    reducedMotion: Object.freeze({
      behavior: 'instant-separation',
      cue: 'distinct zoning + contrast tags',
      retainsMeaning: true
    }),
    learningObjective: 'Show that conflicting terms are actively differentiated before synthesis.'
  }),
  integration: Object.freeze({
    id: 'integration',
    label: 'Integration',
    meaning: 'Reconciliation and incorporation into a larger coherent whole.',
    animation: Object.freeze({
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      durationMs: 640,
      behavior: 'convergent-merge'
    }),
    reducedMotion: Object.freeze({
      behavior: 'direct-convergence',
      cue: 'cluster grouping + integrated state badge',
      retainsMeaning: true
    }),
    learningObjective: 'Show that formerly separate elements can be coordinated without erasing their identity.'
  }),
  transformation: Object.freeze({
    id: 'transformation',
    label: 'Transformation',
    meaning: 'A staged qualitative shift where form and interpretation both change.',
    animation: Object.freeze({
      easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
      durationMs: 760,
      behavior: 'staged-morph'
    }),
    reducedMotion: Object.freeze({
      behavior: 'stepwise-state-change',
      cue: 'phase labels with before/after summaries',
      retainsMeaning: true
    }),
    learningObjective: 'Show that psychological development proceeds through explicit phase changes.'
  }),
  'cyclical-return': Object.freeze({
    id: 'cyclical-return',
    label: 'Cyclical Return',
    meaning: 'Recurrence with memory: the motif returns, but with accumulated insight.',
    animation: Object.freeze({
      easing: 'linear',
      durationMs: 1800,
      behavior: 'orbit-loop'
    }),
    reducedMotion: Object.freeze({
      behavior: 'discrete-phase-loop',
      cue: 'phase index + recurrence indicator',
      retainsMeaning: true
    }),
    learningObjective: 'Show recurring motifs while preserving evidence of changed understanding.'
  })
});

export function getMotionPreset(semanticPreset) {
  return MOTION_PRESETS[semanticPreset] || MOTION_PRESETS.integration;
}
