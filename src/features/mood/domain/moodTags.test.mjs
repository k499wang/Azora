import assert from 'node:assert/strict';
import test from 'node:test';
import { ICON_PATHS } from '../../../components/common/icons/paths';
import {
  MOOD_TAGS,
  MOOD_TAG_LIMIT,
  moodTagLabel,
  sanitizeMoodTags,
} from './moodTags';

test('the catalogue is unique and stays short enough to tap through', () => {
  const ids = MOOD_TAGS.map((tag) => tag.id);
  assert.equal(new Set(ids).size, ids.length);
  // Long enough to describe a day, short enough to scan in one pass.
  assert.ok(MOOD_TAGS.length <= 20);
  assert.ok(MOOD_TAG_LIMIT < MOOD_TAGS.length);
});

test('drops tags this build no longer offers, and collapses duplicates', () => {
  assert.deepEqual(
    sanitizeMoodTags(['work', 'work', 'gardening', 42, null]),
    ['work'],
  );
  assert.deepEqual(sanitizeMoodTags('work'), []);
  assert.deepEqual(sanitizeMoodTags(undefined), []);
});

test('reads back in catalogue order, not the order they were tapped', () => {
  assert.deepEqual(sanitizeMoodTags(['alone', 'work']), ['work', 'alone']);
});

test('every tag has a label and an icon that exists', () => {
  for (const tag of MOOD_TAGS) {
    assert.equal(moodTagLabel(tag.id), tag.label);
    assert.ok(ICON_PATHS[tag.icon], `${tag.id} points at a missing icon`);
  }
  assert.equal(moodTagLabel('gardening'), null);
});
