import assert from 'node:assert/strict';
import test from 'node:test';
import { PHOTO_CLEANUP_PREVIEW_PLAN } from './cleanupPlanPreview.ts';
import { parseCleanupPlan } from './cleanupPlan.ts';

test('the development preview is a plan the release UI can render', () => {
  assert.deepEqual(parseCleanupPlan(PHOTO_CLEANUP_PREVIEW_PLAN), PHOTO_CLEANUP_PREVIEW_PLAN);
});
