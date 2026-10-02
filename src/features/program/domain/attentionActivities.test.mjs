import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAM_ACTIVITIES } from './programCatalogue.ts';
import {
  activityCompletionCriteria,
  completionProvesActivity,
} from './programActivity.ts';
import { ATTENTION_ACTIVITIES } from './attentionActivities.ts';
import { ATTENTION_SCRIPTS } from '../../attention/domain/attentionScripts.ts';

test('attention activities are in the registry and name a script the app can play', () => {
  assert.ok(ATTENTION_ACTIVITIES.length > 0);
  for (const activity of ATTENTION_ACTIVITIES) {
    assert.equal(PROGRAM_ACTIVITIES.get(activity.id), activity);
    assert.equal(activity.delivery.modality, 'attention');
    const wordings = ATTENTION_SCRIPTS[activity.delivery.scriptId];
    assert.ok(wordings != null, `${activity.id} names an unknown script`);
    for (const script of wordings) {
      assert.equal(activity.delivery.minutes, script.minutes);
      assert.equal(activity.estimatedSeconds, script.minutes * 60);
    }
  }
});

test('an attention activity writes its script into the snapshot criteria', () => {
  const activity = PROGRAM_ACTIVITIES.get('attention.54321.2');
  assert.ok(activity != null);
  assert.deepEqual(activityCompletionCriteria(activity), {
    modality: 'attention',
    scriptId: '54321',
  });
});

test('finishing the named script proves an attention activity; anything else does not', () => {
  const grounding = PROGRAM_ACTIVITIES.get('attention.54321.2');
  const release = PROGRAM_ACTIVITIES.get('attention.muscle-release.2');
  assert.ok(grounding != null && release != null);

  assert.equal(completionProvesActivity(grounding, { modality: 'attention', scriptId: '54321' }), true);
  assert.equal(completionProvesActivity(release, { modality: 'attention', scriptId: 'muscle-release' }), true);

  assert.equal(completionProvesActivity(grounding, { modality: 'attention', scriptId: 'muscle-release' }), false);
  assert.equal(completionProvesActivity(grounding, { modality: 'attention' }), false);
  assert.equal(completionProvesActivity(grounding, { modality: 'attention', scriptId: 'unknown' }), false);
  assert.equal(completionProvesActivity(grounding, { modality: 'breathing', techniqueId: 'relaxing' }), false);
});

test('an attention completion never proves a breathing activity', () => {
  const breathing = PROGRAM_ACTIVITIES.get('breathing.relaxing.2');
  assert.ok(breathing != null);
  assert.equal(
    completionProvesActivity(breathing, { modality: 'attention', scriptId: '54321' }),
    false,
  );
});
