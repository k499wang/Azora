import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { usesPracticalLessonSequence } from '../features/lessons/domain/lessonCatalogue.ts';

const source = readFileSync(new URL('./LessonScreen.tsx', import.meta.url), 'utf8');
const expression = source.match(/const supportsLessonFollowUp = ([\s\S]*?);/)[1];
const supportsFollowUp = new Function('isPreview', 'day', 'usesPracticalLessonSequence', `return ${expression};`);
const day = (presetRevision) => ({ enrollment: { planId: 'pressure', presetRevision } });

test('lesson screen follows enrollment edition when deciding whether to show review', () => {
  assert.equal(supportsFollowUp(false, day(3), usesPracticalLessonSequence), true);
  assert.equal(supportsFollowUp(false, day(4), usesPracticalLessonSequence), false);
  assert.equal(supportsFollowUp(true, day(3), usesPracticalLessonSequence), false);
  assert.equal(supportsFollowUp(false, null, usesPracticalLessonSequence), false);
});

test('review eligibility gates loading, rendering, saving, and title-page interaction', () => {
  assert.match(source, /if \(!supportsLessonFollowUp \|\| userId == null \|\| day == null\) return;[\s\S]*?actionForNextProgramDay\(/);
  assert.match(source, /if \(supportsLessonFollowUp && action\?\.kind === 'do'[\s\S]*?saveLessonAction\(/);
  assert.match(source, /const hasPreviousAction = supportsLessonFollowUp && previousAction != null;/);
  assert.match(source, /onPress=\{hasPreviousAction \? undefined : advance\}/);
  assert.match(source, /\{hasPreviousAction && previousAction != null \? \(/);
});
