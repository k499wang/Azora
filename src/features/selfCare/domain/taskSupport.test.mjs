import test from 'node:test';
import assert from 'node:assert/strict';
import { taskSupport } from './taskSupport.ts';

test('authored household tasks offer concrete steps and a smaller action', () => {
  const support = taskSupport('Wash three dishes');
  assert.equal(support.specific, true);
  assert.match(support.steps.join(' '), /three dishes/);
  assert.match(support.smaller, /one dish/);
  assert.equal(taskSupport(' Put dirty clothes in the laundry basket ').specific, true);
});

test('matching is exact so custom task modifiers never receive household instructions', () => {
  for (const title of ['Wash three dishes with chemicals', 'Wash three dishes then take medication', '', '__proto__', 'constructor']) {
    assert.equal(taskSupport(title).specific, false);
  }
});

test('custom and health tasks receive planning help without altered doses or exercise targets', () => {
  for (const title of ['Take prescribed medication', 'Walk for fifteen minutes', 'My own task']) {
    const support = taskSupport(title);
    assert.equal(support.specific, false);
    assert.match(support.smaller, /instructions unchanged/);
    assert.equal(support.steps.length, 2);
    assert.doesNotMatch(support.smaller, /half|dose|five minutes/);
  }
});
