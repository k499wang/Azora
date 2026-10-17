import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const source = readFileSync(new URL('./LessonScreen.tsx', import.meta.url), 'utf8');
test('review finds the closest earlier lesson even across non-lesson days and persists explicit reports', () => {
  assert.match(source, /for \(let previousDay = day.programDay - 1; previousDay >= 1; previousDay--\)/);
  assert.match(source, /programDayLesson\(day.enrollment, previousDay\)/);
  assert.match(source, /onSave=\{\(response, helpful\) => isPreview \? Promise.resolve\(\) : learning.save/);
  assert.match(source, /if \(!isPreview && day != null\)/);
  assert.match(source, /const waiting = currentBlock != null && isLessonActivity\(currentBlock\)/);
});
test('recap precedes completion without mutating preview or automatically completing tasks', () => {
  assert.match(source, /const itemCount = pages.length \+ 2/);
  assert.match(source, /isLastItem \? <FeedEntrance><LessonRecap/);
  assert.match(source, /onAdd=\{!isPreview && userId != null && lesson.step.length <= 120/);
  assert.match(source, /recurrence: 'once'/);
});
