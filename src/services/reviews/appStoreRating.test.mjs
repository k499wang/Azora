import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAppStoreRating } from './appStoreRating.ts';

test('rounds the listing average to one decimal', () => {
  assert.equal(formatAppStoreRating({ results: [{ averageUserRating: 4.8734 }] }), '4.9');
  assert.equal(formatAppStoreRating({ results: [{ averageUserRating: 5 }] }), '5.0');
});

test('returns null when the listing has no rating', () => {
  assert.equal(formatAppStoreRating({ results: [] }), null);
  assert.equal(formatAppStoreRating({ results: [{ averageUserRating: 0 }] }), null);
  assert.equal(formatAppStoreRating({ results: [{}] }), null);
  assert.equal(formatAppStoreRating(null), null);
});
