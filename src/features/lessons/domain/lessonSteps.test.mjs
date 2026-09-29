/**
 * Each lesson's step, held to the shape the plan path's day card needs: one
 * short imperative sentence that makes sense without the lesson behind it.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { allLessons } from './lessonCatalogue.ts';

const wordCount = (text) => text.split(/\s+/).filter(Boolean).length;

for (const lesson of allLessons()) {
  test(`${lesson.id} has a single short step`, () => {
    const { step } = lesson;
    assert.ok(step.trim().length > 0, 'step is empty');
    assert.ok(step.endsWith('.'), `step does not end with a period: ${step}`);
    assert.ok(!step.includes('**'), `step contains bold markup: ${step}`);
    assert.ok(wordCount(step) <= 12, `step is ${wordCount(step)} words: ${step}`);
    assert.ok(!/\.\s+\S/.test(step), `step has more than one sentence: ${step}`);
    assert.ok(!step.includes(';'), `step contains a semicolon: ${step}`);
    assert.ok(!/breathwork/i.test(step), `step uses a banned word: ${step}`);
  });
}
