import assert from 'node:assert/strict';
import test from 'node:test';
import { FIRST_TRIAL_WEEK_REVISION, lessonForDay } from './lessonCatalogue.ts';
import { TRIAL_WEEK_LESSONS } from './lessons/trialWeekLessons.ts';
import { latestProgramPreset } from '../../program/domain/programCatalogue.ts';

test('second-day lessons keep a brief link to the scheduled practice without prescribing another rhythm', () => {
  for (const planId of Object.keys(FIRST_TRIAL_WEEK_REVISION)) {
    const tracks = planId === 'pressure' ? ['stress', 'overthinking', 'anger'] : planId === 'phone' ? ['bedtime', 'work'] : [undefined];
    const preset = latestProgramPreset(planId);
    assert.deepEqual(preset.days[1].activityIds, [planId === 'morning' ? 'breathing.morning-charge.1' : 'breathing.relaxing.1']);
    for (const track of tracks) {
      const lesson = lessonForDay(planId, 2, preset.revision, planId === 'pressure' ? track : undefined, planId === 'phone' ? track : undefined);
      const copy = JSON.stringify(lesson.blocks);
      assert.match(copy, /one-minute/);
      assert.match(copy, /Reset/);
      assert.match(copy, /comfortabl[ey]/);
      assert.match(copy, /normal|ordinary|stop/);
      assert.doesNotMatch(copy, /Stanford|28 days|four and out for two|count of four|slowing part more time/);
    }
  }
});

test('trial rewrites use specific feedback rather than repeating the opening as a quiz', () => {
  for (const lesson of TRIAL_WEEK_LESSONS) {
    const opening = lesson.blocks.find((block) => block.kind === 'text').text.replace(/\*\*/g, '');
    for (const block of lesson.blocks.filter((block) => block.kind === 'choice')) {
      assert.ok(!block.prompt.includes(opening), lesson.id);
      assert.ok(block.options.every((option) => option.feedback !== opening), lesson.id);
      assert.ok(block.options.every((option) => !option.feedback.startsWith('That does not address this situation.')), lesson.id);
    }
  }
});

test('first-week practice links fit the schedule while the lesson teaches an independent skill', () => {
  for (const planId of Object.keys(FIRST_TRIAL_WEEK_REVISION)) {
    const tracks = planId === 'pressure' ? ['stress', 'overthinking', 'anger'] : planId === 'phone' ? ['bedtime', 'work'] : [undefined];
    const preset = latestProgramPreset(planId);
    for (const track of tracks) {
      for (const day of preset.days.slice(0, 7)) {
        const lesson = lessonForDay(planId, day.day, preset.revision, planId === 'pressure' ? track : undefined, planId === 'phone' ? track : undefined);
        const copy = JSON.stringify(lesson.blocks);
        const label = `${planId}/${track ?? 'default'} day ${day.day}`;
        for (const activityId of day.activityIds) {
          if (activityId === 'attention.54321.2') assert.match(copy, /5-4-3-2-1/, label);
          if (activityId === 'attention.muscle-release.2') assert.match(copy, /Muscle Release/, label);
          if (activityId.startsWith('breathing.')) assert.match(copy, /breathing|breath|breathe/, label);
        }
        if (day.activityIds.length > 0) {
          const references = lesson.blocks.filter((block) => /Reset|5-4-3-2-1|Muscle Release/i.test(JSON.stringify(block)));
          assert.equal(references.length, 1, `${label} has one supporting practice aside`);
          assert.equal(references[0].kind, 'text', `${label} keeps practice instructions out of its interactions`);
          assert.ok(references[0].text.split(/\s+/).length <= 40, `${label} has a brief aside`);
          assert.doesNotMatch([lesson.title, lesson.step, lesson.blocks.at(-1).text].join(' '), /Reset|5-4-3-2-1|Muscle Release|breath/i, `${label} has a usable real-life takeaway`);
          const teaching = lesson.blocks.filter((block) => block.kind === 'text' && !references.includes(block));
          assert.ok(teaching.length >= 3, `${label} develops the skill beyond the practice link`);
        }
        // Day one may explain what an optional Reset is before tomorrow's introduction.
        if (day.activityIds.length === 0 && day.day !== 1) assert.doesNotMatch(copy, /Reset|5-4-3-2-1|Muscle Release|breath|inhale|exhale/i, label);
      }
    }
  }
});
