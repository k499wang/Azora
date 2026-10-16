import test from 'node:test';
import assert from 'node:assert/strict';
import { lessonForDay } from './lessonCatalogue.ts';

test('every bedtime phone lesson teaches an evening situation and leaves workplace examples out', () => {
  for (let day = 1; day <= 28; day += 1) {
    const lesson = lessonForDay('phone', day, 11, undefined, 'bedtime');
    assert.match(lesson.blocks.find((block) => block.kind === 'text').text, /evening|bedtime|tonight|at night|in bed|waking at night|wind down/i, `day ${day}`);
    assert.match(lesson.blocks.at(-1).text, /evening|bedtime|tonight|night|bed|winding down/i, `day ${day}`);
    assert.doesNotMatch(JSON.stringify(lesson.blocks), /work task|report file|at your desk|supplied by/i, `day ${day}`);
  }
});

test('every work phone lesson teaches a task situation and leaves bedtime instructions out', () => {
  for (let day = 1; day <= 28; day += 1) {
    const lesson = lessonForDay('phone', day, 11, undefined, 'work');
    assert.match(lesson.blocks.find((block) => block.kind === 'text').text, /work|task|study/i, `day ${day}`);
    assert.match(lesson.blocks.at(-1).text, /work|task/i, `day ${day}`);
    assert.doesNotMatch(JSON.stringify(lesson.blocks), /bedtime|in bed|sleep|tonight|supplied by/i, `day ${day}`);
  }
});

test('the phone track carry-forward example keeps the selected purpose', () => {
  const bedtime = lessonForDay('phone', 28, 11, undefined, 'bedtime');
  const work = lessonForDay('phone', 28, 11, undefined, 'work');
  assert.match(JSON.stringify(bedtime.blocks.find((block) => block.kind === 'reveal')), /bedtime activity/);
  assert.match(JSON.stringify(work.blocks.find((block) => block.kind === 'reveal')), /task action/);
});
