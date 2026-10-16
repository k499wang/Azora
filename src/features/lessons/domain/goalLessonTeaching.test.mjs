import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonById } from './lessonCatalogue.ts';

function copy(id) {
  return JSON.stringify(lessonById(id).blocks);
}

test('home teaching uses household actions throughout its task examples', () => {
  for (const id of ['focus.homeready', 'focus.homeblocks', 'focus.homedone', 'focus.homeinbox', 'body.homeappetite']) {
    const text = copy(id);
    assert.match(text, /household|home|kitchen|chair|seat/i, id);
    assert.doesNotMatch(text, /report file|rough heading|email|hormone|ghrelin|leptin/i, id);
    assert.doesNotMatch(text, /Context supplied/, id);
  }
  assert.match(copy('focus.homeinbox'), /household papers/);
  assert.match(copy('focus.homeready'), /cup to the sink/);
});

test('night-time phone teaching keeps checking boundaries and necessary contact explicit', () => {
  const text = copy('sleep.phonethreeam');
  assert.match(text, /extra checking/);
  assert.match(text, /necessary contact|needs available/);
  assert.doesNotMatch(text, /Context supplied|stimulus control|sleep restriction/i);
});

test('saved original lessons keep their original teaching examples', () => {
  assert.match(copy('focus.ready'), /report file/);
  assert.match(copy('focus.inbox'), /email|inbox/i);
  assert.notEqual(copy('focus.ready'), copy('focus.homeready'));
});
