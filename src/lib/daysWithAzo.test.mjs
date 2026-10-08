import test from 'node:test';
import assert from 'node:assert/strict';
import { daysWithAzo } from './daysWithAzo.ts';

test('signup day counts as day one', () => {
  const signup = new Date(2026, 9, 8, 9, 30).toISOString();
  assert.equal(daysWithAzo(signup, '2026-10-08'), 1);
  assert.equal(daysWithAzo(signup, '2026-10-09'), 2);
  assert.equal(daysWithAzo(new Date(2026, 8, 1, 23, 0).toISOString(), '2026-10-08'), 38);
});

test('days with Azo never drop below one', () => {
  const signup = new Date(2026, 9, 10, 9, 30).toISOString();
  assert.equal(daysWithAzo(signup, '2026-10-08'), 1);
});
