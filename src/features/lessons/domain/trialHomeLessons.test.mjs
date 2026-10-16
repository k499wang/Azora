import assert from 'node:assert/strict';
import test from 'node:test';
import { lessonForDay } from './lessonCatalogue.ts';
import { latestProgramPreset } from '../../program/domain/programCatalogue.ts';

const week = () => Array.from({ length: 7 }, (_, index) => lessonForDay('home', index + 1, latestProgramPreset('home').revision));
const copy = (lesson) => JSON.stringify(lesson.blocks);

test('cleaning opening week teaches a practical progression with distinct household skills', () => {
  const lessons = week();
  assert.deepEqual(lessons.map(({ id }) => id), [
    'focus.trialhomevision', 'breath.trialhome', 'attention.trialskillsenseshome',
    'focus.trialhomepasses', 'focus.trialhomesort', 'attention.trialskillmuscleshomeready',
    'focus.trialhomeroutine',
  ]);
  for (const [index, pattern] of [
    /Decluttering means deciding.*Tidying means putting.*Cleaning means removing/,
    /Marie Kondo.*KonMari/,
    /home means.*the place where you keep it/,
    /clean from high to low/,
    /Before buying a basket.*decide what you want to keep/,
    /Never mix cleaning products/,
    /dishes may need attention every day.*bathroom may fit a weekly plan/,
  ].entries()) assert.match(copy(lessons[index]), pattern);
});

test('KonMari attribution distinguishes the small adaptation from the full category method', () => {
  const lesson = week()[1];
  assert.match(copy(lesson), /clothes, books, papers, komono.*sentimental/);
  assert.match(copy(lesson), /Azora adaptation/);
  assert.match(copy(lesson), /Also keep things you need/);
  assert.match(lesson.source, /konmari.com/);
});

test('cleaning decisions respect ownership, complete outgoing steps, and follow product labels', () => {
  const lessons = week();
  assert.match(copy(lessons[4]), /Only give away things you own/);
  assert.match(copy(lessons[4]), /when you will take the bag there, or arrange a collection/);
  assert.match(copy(lessons[5]), /toilet cloths separate from kitchen cloths/);
  assert.match(copy(lessons[5]), /stay wet on the surface for a stated time/);
  assert.match(lessons[5].source, /cdc.gov/);
  assert.match(copy(lessons[6]), /smaller version for a busy day/);
  assert.match(copy(lessons[6]), /do not have to double every chore/);
});
