import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSessionKey } from './sessionKey.ts';

test('the same session always produces the same key', () => {
  assert.equal(
    buildSessionKey('box-breathing', 1754700000000),
    buildSessionKey('box-breathing', 1754700000000),
  );
});

test('redoing a technique the same day produces a different key', () => {
  const morning = buildSessionKey('box-breathing', 1754700000000);
  const evening = buildSessionKey('box-breathing', 1754740000000);
  assert.notEqual(morning, evening);
});

test('two techniques finishing at the same instant do not collide', () => {
  assert.notEqual(
    buildSessionKey('box-breathing', 1754700000000),
    buildSessionKey('breath-hold', 1754700000000),
  );
});
