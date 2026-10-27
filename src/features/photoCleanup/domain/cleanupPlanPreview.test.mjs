import assert from 'node:assert/strict';
import test from 'node:test';
import { PHOTO_CLEANUP_PREVIEW_PLAN } from './cleanupPlanPreview.ts';
import { parseCleanupPlan } from './cleanupPlan.ts';

test('the development preview is a plan the release UI can render', () => {
  const wire = {
    ...PHOTO_CLEANUP_PREVIEW_PLAN,
    objects: PHOTO_CLEANUP_PREVIEW_PLAN.objects.map((item) => item.name),
    minutes: PHOTO_CLEANUP_PREVIEW_PLAN.objects.map((item) => item.minutes),
  };
  assert.deepEqual(parseCleanupPlan(wire), PHOTO_CLEANUP_PREVIEW_PLAN);
});
