import assert from 'node:assert/strict';
import test from 'node:test';
import { pickupInstruction } from './pickupInstruction.ts';

test('lowercases the object so it reads as one sentence', () => {
  assert.equal(pickupInstruction('Cups and dishes'), 'Pick up cups and dishes.');
});

test('leaves the rest of the object untouched', () => {
  assert.equal(pickupInstruction('Items on the TV stand'), 'Pick up items on the TV stand.');
});
