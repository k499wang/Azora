import assert from 'node:assert/strict';
import test from 'node:test';
import { lessonPracticeContext } from './lessonPracticeContext.ts';
const enrollment = (planId, first) => ({planId,resolved:{days:[{lessonActivityId:first}]}});
test('practice context follows saved goal and lesson track rather than a later profile answer', () => {
  assert.match(lessonPracticeContext(enrollment('home')),/household/);
  assert.match(lessonPracticeContext(enrollment('pressure','lesson:worry.trialloop')),/worry/);
  assert.match(lessonPracticeContext(enrollment('pressure','lesson:anger.meter')),/irritation/);
  assert.match(lessonPracticeContext(enrollment('phone','lesson:focus.phonebedtime')),/bedtime/);
  assert.match(lessonPracticeContext(enrollment('phone','lesson:focus.phonework')),/work/);
  assert.match(lessonPracticeContext(null),/everyday/);
});
