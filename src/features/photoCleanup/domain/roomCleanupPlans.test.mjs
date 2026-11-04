import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanupMinutes } from './cleanupPlan.ts';
import { MAX_ITEMS } from './cleanupPlanEdits.ts';
import { cleanupItemIcon } from './cleanupItemIcon.ts';
import { CLEANUP_ROOMS } from './roomCleanupPlans.ts';

test('every room takes 20 to 30 minutes and fits the plan limit', () => {
  for (const { label, plan } of CLEANUP_ROOMS) {
    const minutes = cleanupMinutes(plan.objects);
    assert.ok(minutes >= 20 && minutes <= 30, `${label}: ${minutes}`);
    assert.ok(plan.objects.length <= MAX_ITEMS, label);
  }
});

test('room ids are unique', () => {
  assert.equal(new Set(CLEANUP_ROOMS.map((room) => room.id)).size, CLEANUP_ROOMS.length);
});

test('room steps get the picture of what they name', () => {
  const kitchen = CLEANUP_ROOMS.find((room) => room.id === 'kitchen');
  const dishes = kitchen.plan.objects.find((item) => item.name === 'Wash or load the dishes');
  assert.equal(cleanupItemIcon(dishes.name), 'todo-dishes');
});

test('no step is too long for the guide row or repeats within a room', () => {
  for (const { label, plan } of CLEANUP_ROOMS) {
    const names = plan.objects.map((item) => item.name);
    assert.equal(new Set(names).size, names.length, label);
    for (const name of names) assert.ok(name.length <= 36, name);
  }
});

test('every room clears what is out first and finishes on the floor', () => {
  for (const { label, plan } of CLEANUP_ROOMS) {
    assert.match(plan.objects[0].name, /^Throw out trash/, label);
    assert.match(plan.objects.at(-1).name, /floor/, label);
  }
});
