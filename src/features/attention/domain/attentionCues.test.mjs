import test from 'node:test';
import assert from 'node:assert/strict';
import { ATTENTION_SCRIPTS } from './attentionScripts.ts';
import { attentionCueFor } from './attentionCues.ts';

test('5-4-3-2-1 falls one note per sense, with silent intro and close', () => {
  for (const script of ATTENTION_SCRIPTS['54321']) {
    assert.deepEqual(script.steps.map(attentionCueFor), [null, 'sense5', 'sense4', 'sense3', 'sense2', 'sense1', null]);
  }
});

test('muscle release cues every squeeze and every release', () => {
  for (const script of ATTENTION_SCRIPTS['muscle-release']) {
    for (const step of script.steps) {
      assert.equal(attentionCueFor(step), step.kind === 'timed' ? step.phase : null);
    }
  }
});

test('no step means no cue', () => {
  assert.equal(attentionCueFor(null), null);
});
