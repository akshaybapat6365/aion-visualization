import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveMotionPlan } from '../index.js';
import { MOTION_PRESETS } from '../presets.js';
import { getPresetForVisualizationTransition } from '../state-transition-map.js';

function createWindowMock(matches) {
  return {
    matchMedia: (query) => ({
      matches,
      media: query
    })
  };
}

test('all semantic presets provide reduced-motion equivalents that preserve meaning', () => {
  Object.values(MOTION_PRESETS).forEach((preset) => {
    assert.equal(preset.reducedMotion.retainsMeaning, true);
    assert.ok(preset.reducedMotion.behavior.length > 0);
    assert.ok(preset.reducedMotion.cue.length > 0);
  });
});

test('prefers-reduced-motion path is available and switches mode', () => {
  const reducedPlan = resolveMotionPlan({
    relationType: 'opposes',
    win: createWindowMock(true)
  });

  assert.equal(reducedPlan.mode, 'reduced');
  assert.equal(reducedPlan.semanticPreset, 'opposition');
  assert.equal(reducedPlan.behavior, MOTION_PRESETS.opposition.reducedMotion.behavior);
});

test('animated and reduced plans are functionally equivalent at semantic level', () => {
  const transitionKey = 'polarized->synthesis';
  const expectedPreset = getPresetForVisualizationTransition('conceptGraph', transitionKey);

  const animatedPlan = resolveMotionPlan({
    moduleName: 'conceptGraph',
    transitionKey,
    win: createWindowMock(false)
  });

  const reducedPlan = resolveMotionPlan({
    moduleName: 'conceptGraph',
    transitionKey,
    win: createWindowMock(true)
  });

  assert.equal(animatedPlan.semanticPreset, expectedPreset);
  assert.equal(reducedPlan.semanticPreset, expectedPreset);
  assert.equal(animatedPlan.meaning, reducedPlan.meaning);
  assert.equal(animatedPlan.learningObjective, reducedPlan.learningObjective);
  assert.notEqual(animatedPlan.behavior, reducedPlan.behavior);
});
