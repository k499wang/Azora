import assert from 'node:assert/strict';
import test from 'node:test';
import { getRoutineGuide, ROUTINE_GUIDES } from './routineGuides.ts';
import { HOME_CARE_GUIDES, ROUTINE_TEMPLATES } from './routineLibrary.ts';

function wordCount(text) {
  return text.trim().split(/\s+/).length;
}

test('every template has its own guide and PDF resources have none', () => {
  assert.equal(ROUTINE_TEMPLATES.length, 30);
  assert.deepEqual(
    Object.keys(ROUTINE_GUIDES).sort(),
    ROUTINE_TEMPLATES.map(({ id }) => id).sort(),
  );
  for (const entry of ROUTINE_TEMPLATES) {
    assert.ok(getRoutineGuide(entry.id), entry.id);
  }
  for (const entry of HOME_CARE_GUIDES) {
    assert.equal(getRoutineGuide(entry.id), undefined, entry.id);
  }
});

test('each guide describes exactly the existing tasks without missing or stale IDs', () => {
  for (const entry of ROUTINE_TEMPLATES) {
    const guide = getRoutineGuide(entry.id);
    assert.deepEqual(
      Object.keys(guide.taskDescriptions).sort(),
      entry.tasks.map(({ id }) => id).sort(),
      entry.id,
    );
    for (const task of entry.tasks) {
      const copy = guide.taskDescriptions[task.id];
      assert.ok(wordCount(copy) >= 25, `${entry.id}/${task.id} needs practical guidance`);
      assert.ok(wordCount(copy) <= 45, `${entry.id}/${task.id} should remain readable in a card`);
      assert.notEqual(copy, task.title, `${entry.id}/${task.id} repeats its title`);
    }
  }
});

test('guides include substantive original introductions, preparation, and a smaller start', () => {
  const introductions = new Set();
  const taskDescriptions = new Set();
  const smallStarts = new Set();
  for (const entry of ROUTINE_TEMPLATES) {
    const guide = getRoutineGuide(entry.id);
    assert.equal(guide.introduction.length, 2, entry.id);
    for (const paragraph of guide.introduction) {
      assert.ok(wordCount(paragraph) >= 25, `${entry.id} needs a fuller introduction`);
      assert.notEqual(paragraph, entry.description, `${entry.id} repeats the short lead`);
      assert.ok(!introductions.has(paragraph), `${entry.id} repeats another introduction`);
      introductions.add(paragraph);
    }
    assert.ok(guide.preparation.length >= 2 && guide.preparation.length <= 3, entry.id);
    for (const tip of guide.preparation) {
      assert.ok(wordCount(tip) >= 7, `${entry.id} has an empty or incomplete tip`);
    }
    for (const description of Object.values(guide.taskDescriptions)) {
      assert.ok(!taskDescriptions.has(description), `${entry.id} reuses generic task copy`);
      taskDescriptions.add(description);
    }
    assert.ok(wordCount(guide.smallStart) >= 20, `${entry.id} needs a concrete smaller version`);
    assert.ok(!smallStarts.has(guide.smallStart), `${entry.id} repeats a smaller version`);
    smallStarts.add(guide.smallStart);
  }
});
