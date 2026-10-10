import { pressureLessonTrackForIntent } from '../../lessons/domain/pressureLessonTrack.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RESOLVER_VERSION,
  advanceProgramDay,
  buildProgramEnrollment,
  currentProgramDay,
  programDayActivityCount,
  programDayForDate,
  programDayLesson,
  programDayOnDate,
  programEnrollmentLength,
  resolveProgramDays,
} from './programEnrollment.ts';
import {
  PROGRAM_ACTIVITIES,
  allProgramPresets,
  latestProgramPreset,
  programPresetRevision,
} from './programCatalogue.ts';
import { activityCompletionCriteria, buildActivityRegistry } from './programActivity.ts';
import { lessonActivityId } from '../../lessons/domain/lessonActivity.ts';
import { lessonForDay, RETIRED_LESSON_IDS } from '../../lessons/domain/lessonCatalogue.ts';

const enrolled = (overrides = {}) => {
  const result = buildProgramEnrollment({
    enrollmentId: 'e1',
    planId: 'night',
    presetRevision: 1,
    enrolledOn: '2026-09-18',
  });
  assert.equal(result.status, 'enrolled');
  return { ...result.enrollment, ...overrides };
};

const relaxing = { modality: 'breathing', techniqueId: 'relaxing' };

test('a named plan starts at day one, with the resolver stamped on it', () => {
  const enrollment = enrolled();

  assert.equal(enrollment.version, 3);
  assert.equal(enrollment.programDay, 1);
  assert.equal(enrollment.lastAdvancedOn, null);
  assert.equal(enrollment.status, 'active');
  assert.equal(enrollment.resolverVersion, RESOLVER_VERSION);
  assert.equal(programEnrollmentLength(enrollment), 28);
});

test('the snapshot freezes the activity revision each day was resolved against', () => {
  const enrollment = enrolled();

  for (const day of enrollment.resolved.days) {
    assert.ok(day.why.length > 0);
    assert.ok(day.activities.length > 0);
    assert.match(day.lessonActivityId, /^lesson:/);
    for (const resolved of day.activities) {
      const activity = PROGRAM_ACTIVITIES.get(resolved.activityId);
      assert.ok(activity != null);
      assert.equal(resolved.activityRevision, activity.revision);
    }
  }
});

test('every published preset enrolls with its exact lesson on every day', () => {
  for (const preset of allProgramPresets()) {
    const result = buildProgramEnrollment({
      enrollmentId: `enrollment-${preset.planId}`,
      planId: preset.planId,
      presetRevision: preset.revision,
      enrolledOn: '2026-09-23',
    });
    assert.equal(result.status, 'enrolled', preset.planId);
    assert.equal(result.enrollment.resolved.days.length, preset.days.length);

    for (const day of result.enrollment.resolved.days) {
      const lesson = lessonForDay(preset.planId, day.day, preset.revision);
      assert.ok(lesson != null, `${preset.planId} day ${day.day}`);
      assert.equal(day.lessonActivityId, lessonActivityId(lesson.id));
    }
  }
});

test('resolution refuses a plan with no authored days', () => {
  const result = resolveProgramDays({
    planId: 'night',
    revision: 99,
    name: 'Unwritten',
    outcome: '',
    phases: [],
    blocks: [],
    days: [],
  });

  assert.equal(result.status, 'unauthored');
});

test('enrollment refuses a revision that was never published', () => {
  const result = buildProgramEnrollment({
    enrollmentId: 'e1',
    planId: 'night',
    presetRevision: 99,
    enrolledOn: '2026-09-18',
  });

  assert.equal(result.status, 'refused');
});

test('resolution refuses a day naming an activity that is not registered', () => {
  const preset = programPresetRevision('night', 1);
  const result = resolveProgramDays(preset, buildActivityRegistry([]));

  assert.equal(result.status, 'invalid');
  assert.match(result.reason, /unknown activity/);
});

test('finishing a one-exercise day advances exactly one day', () => {
  const result = advanceProgramDay({
    enrollment: enrolled(),
    evidence: relaxing,
    localDate: '2026-09-18',
  });

  assert.equal(result.status, 'advanced');
  assert.equal(result.enrollment.programDay, 2);
  assert.equal(result.enrollment.lastAdvancedOn, '2026-09-18');
  assert.equal(result.enrollment.status, 'active');
});

test('a second session the same evening is one day, not two', () => {
  const first = advanceProgramDay({
    enrollment: enrolled(),
    evidence: relaxing,
    localDate: '2026-09-18',
  });
  assert.equal(first.status, 'advanced');
  const second = advanceProgramDay({
    enrollment: first.enrollment,
    evidence: relaxing,
    localDate: '2026-09-18',
  });

  assert.equal(second.status, 'refused');
  assert.equal(second.reason, 'already_advanced_today');
});

test('the same completion arriving twice cannot advance twice', () => {
  const enrollment = enrolled({ lastAdvancedOn: '2026-09-18' });
  const retry = advanceProgramDay({
    enrollment,
    evidence: relaxing,
    localDate: '2026-09-18',
  });

  assert.equal(retry.status, 'refused');
  assert.equal(retry.reason, 'already_advanced_today');
});

test('another exercise does not move a plan that asked for something else', () => {
  const result = advanceProgramDay({
    enrollment: enrolled(),
    evidence: { modality: 'breathing', techniqueId: 'wimhof' },
    localDate: '2026-09-18',
  });

  assert.equal(result.status, 'refused');
  assert.equal(result.reason, 'completion_does_not_match');
});

test('a missed day costs the day and nothing else', () => {
  // Nothing on day one, then the day-one activity a week later: still day two.
  const result = advanceProgramDay({
    enrollment: enrolled(),
    evidence: relaxing,
    localDate: '2026-09-25',
  });

  assert.equal(result.status, 'advanced');
  assert.equal(result.enrollment.programDay, 2);
});

test('the last day completes the plan rather than running past it', () => {
  const enrollment = enrolled({ programDay: 28 });
  const today = currentProgramDay(enrollment);
  assert.equal(today.day, 28);
  assert.equal(today.activities.length, 3);

  const result = advanceProgramDay({
    enrollment,
    evidence: { modality: 'breathing', techniqueId: 'coherent-6' },
    localDate: '2026-10-15',
    // The other two are already behind them.
    completedActivityIds: [
      'breathing.sleep-descent.5',
      'breathing.relaxing.2',
    ],
  });

  assert.equal(result.status, 'completed');
  assert.equal(result.enrollment.status, 'completed');
  assert.equal(result.enrollment.programDay, 28);
});

test('a completed plan does not advance again', () => {
  const result = advanceProgramDay({
    enrollment: enrolled({ status: 'completed', programDay: 28 }),
    evidence: { modality: 'breathing', techniqueId: 'coherent-6' },
    localDate: '2026-10-16',
  });

  assert.equal(result.status, 'refused');
  assert.equal(result.reason, 'not_active');
});

test('an abandoned plan does not advance', () => {
  const result = advanceProgramDay({
    enrollment: enrolled({ status: 'abandoned' }),
    evidence: relaxing,
    localDate: '2026-09-18',
  });

  assert.equal(result.status, 'refused');
  assert.equal(result.reason, 'not_active');
});

test('a day outside the resolved snapshot refuses instead of guessing', () => {
  const result = advanceProgramDay({
    enrollment: enrolled({ programDay: 999 }),
    evidence: relaxing,
    localDate: '2026-09-18',
  });

  assert.equal(result.status, 'refused');
  assert.equal(result.reason, 'no_current_day');
});

test('advancing never mutates the enrollment it was given', () => {
  const enrollment = enrolled();
  advanceProgramDay({ enrollment, evidence: relaxing, localDate: '2026-09-18' });

  assert.equal(enrollment.programDay, 1);
  assert.equal(enrollment.lastAdvancedOn, null);
});

test('a day with three exercises needs all three before it turns over', () => {
  // Day 18 of the Night Reset is the first three-exercise day.
  const enrollment = enrolled({ programDay: 18 });
  const today = currentProgramDay(enrollment);
  assert.equal(today.activities.length, 3);

  const done = [];
  for (const [index, resolved] of today.activities.entries()) {
    const activity = PROGRAM_ACTIVITIES.get(resolved.activityId);
    const result = advanceProgramDay({
      enrollment,
      evidence: {
        modality: 'breathing',
        techniqueId: activity.delivery.techniqueId,
      },
      localDate: '2026-10-05',
      completedActivityIds: done,
    });

    if (index < today.activities.length - 1) {
      assert.equal(result.status, 'recorded');
      assert.equal(result.remaining, today.activities.length - index - 1);
      done.push(result.activityId);
    } else {
      assert.equal(result.status, 'advanced');
      assert.equal(result.enrollment.programDay, 19);
    }
  }
});

test('an exercise already recorded today does not count a second time', () => {
  const enrollment = enrolled({ programDay: 18 });
  const today = currentProgramDay(enrollment);
  const first = PROGRAM_ACTIVITIES.get(today.activities[0].activityId);

  const result = advanceProgramDay({
    enrollment,
    evidence: {
      modality: 'breathing',
      techniqueId: first.delivery.techniqueId,
    },
    localDate: '2026-10-05',
    completedActivityIds: [today.activities[0].activityId],
  });

  // It matched an activity that is already behind them, so there is nothing
  // left for it to satisfy — the other two are different exercises.
  assert.equal(result.status, 'refused');
  assert.equal(result.reason, 'completion_does_not_match');
});

test('walking the whole plan takes exactly one day per local date', () => {
  let enrollment = enrolled();
  let advanced = 0;

  for (let index = 0; index < 60; index += 1) {
    const today = currentProgramDay(enrollment);
    if (today == null) break;

    const done = [];
    let stepped = null;
    for (const resolved of today.activities) {
      const activity = PROGRAM_ACTIVITIES.get(resolved.activityId);
      stepped = advanceProgramDay({
        enrollment,
        evidence: {
          modality: 'breathing',
          techniqueId: activity.delivery.techniqueId,
        },
        // A distinct local date per day, so only the rule limits progress.
        localDate: `2026-10-${String((index % 28) + 1).padStart(2, '0')}`,
        completedActivityIds: done,
      });
      if (stepped.status === 'recorded') done.push(stepped.activityId);
    }

    if (stepped == null || stepped.status === 'refused') break;
    enrollment = stepped.enrollment;
    advanced += 1;
    if (stepped.status === 'completed') break;
  }

  assert.equal(advanced, 28);
  assert.equal(enrollment.status, 'completed');
});


/**
 * The day someone actually did everything asked of them is the day the screen
 * most has to get right, and it was the one it got wrong.
 *
 * Finishing the last of a day's work moves the enrollment on in the same
 * statement that records the completion, so every reader afterwards sees
 * tomorrow. Home swapped the exercise just finished for a fresh unfinished one,
 * the list never folded, and the room never unlocked — on the one day the user
 * had done the whole thing.
 */
test('a day finished today is still today, until the calendar turns', () => {
  const advanced = advanceProgramDay({
    enrollment: enrolled(),
    evidence: relaxing,
    localDate: '2026-09-18',
  });
  assert.equal(advanced.enrollment.programDay, 2);

  // Same evening: the day they finished.
  assert.equal(programDayForDate(advanced.enrollment, '2026-09-18'), 1);
  assert.equal(programDayOnDate(advanced.enrollment, '2026-09-18')?.day, 1);

  // Tomorrow: the day the plan resumes on.
  assert.equal(programDayForDate(advanced.enrollment, '2026-09-19'), 2);
  assert.equal(programDayOnDate(advanced.enrollment, '2026-09-19')?.day, 2);
});

/**
 * The count reminders are booked from has to mean the same thing as the day on
 * Home. Night's day seven asks for one exercise and day eight is the first that
 * asks for two; reading `programDay` directly would have the evening of day
 * seven book a reminder for the exercise day eight adds, a calendar day early.
 */
test('the evening of a finished day counts today, not the day it resumes on', () => {
  const enrollment = enrolled({ programDay: 8, lastAdvancedOn: '2026-09-18' });

  assert.equal(currentProgramDay(enrollment)?.activities.length, 2);
  assert.equal(programDayActivityCount(enrollment, '2026-09-18'), 1);
  assert.equal(programDayActivityCount(enrollment, '2026-09-19'), 2);
});

test('a day only part done is the day the plan is on', () => {
  const enrollment = enrolled({ programDay: 20, lastAdvancedOn: '2026-09-17' });

  assert.equal(programDayForDate(enrollment, '2026-09-18'), 20);
});

test('the first day cannot be walked back behind the start of the plan', () => {
  // `lastAdvancedOn` on day one can only come from a restored or repaired row,
  // and day zero is not a day.
  const enrollment = enrolled({ lastAdvancedOn: '2026-09-18' });

  assert.equal(programDayForDate(enrollment, '2026-09-18'), 1);
});

test('a finished plan stays on its last day rather than stepping back off it', () => {
  const enrollment = enrolled({
    programDay: programEnrollmentLength(enrolled()),
    lastAdvancedOn: '2026-09-18',
    status: 'completed',
  });

  assert.equal(
    programDayForDate(enrollment, '2026-09-18'),
    programEnrollmentLength(enrollment),
  );
});

/**
 * A finished plan keeps its last day on Home, deliberately and indefinitely.
 *
 * This looks like the frozen-day bug and is not one. A completed plan has no
 * next day to offer, and the alternatives are worse: clearing Home leaves
 * somebody who just finished eight weeks with an empty morning, and rolling
 * back to the old rotation swaps their plan for something they never chose.
 * The last day stays, and the plan screen is where a new one is picked.
 *
 * If this test fails because the day is now null, that is a product decision
 * being reversed rather than a regression being fixed — change it on purpose
 * or not at all.
 */
test('a finished plan keeps its last day on screen for good', () => {
  const finished = enrolled({
    status: 'completed',
    programDay: 28,
    lastAdvancedOn: '2026-09-18',
  });

  // The evening it was finished, and long after.
  for (const date of ['2026-09-18', '2026-09-19', '2027-03-01']) {
    assert.equal(programDayForDate(finished, date), 28);
    assert.equal(programDayOnDate(finished, date)?.day, 28);
  }
});

test('a day reads the lesson its snapshot names, not the catalogue', () => {
  // An enrollment from before the sequences were re-pinned: day 7 of night
  // revision 1 still names the lesson it was resolved against.
  const enrollment = enrolled({
    resolved: {
      days: enrolled().resolved.days.map((day) =>
        day.day === 7 ? { ...day, lessonActivityId: lessonActivityId('plan.expect') } : day,
      ),
    },
  });

  assert.notEqual(lessonForDay('night', 7)?.id, 'plan.expect');
  assert.equal(programDayLesson(enrollment, 7)?.id, 'plan.expect');
});

test('a snapshot with no lesson written falls back to the catalogue', () => {
  const enrollment = enrolled({
    resolved: {
      days: enrolled().resolved.days.map((day) => ({ ...day, lessonActivityId: null })),
    },
  });

  assert.equal(programDayLesson(enrollment, 3)?.id, lessonForDay('night', 3)?.id);
});

test('existing enrollments can still read every retired general lesson', () => {
  const original = enrolled();
  for (const lessonId of RETIRED_LESSON_IDS) {
    const enrollment = {
      ...original,
      resolved: {
        days: original.resolved.days.map((day) =>
          day.day === 2 ? { ...day, lessonActivityId: lessonActivityId(lessonId) } : day,
        ),
      },
    };
    assert.equal(programDayLesson(enrollment, 2)?.id, lessonId);
    assert.notEqual(lessonForDay('night', 2)?.id, lessonId);
  }
});

test('a lesson this build does not carry is nothing rather than a crash', () => {
  const enrollment = enrolled({
    resolved: {
      days: enrolled().resolved.days.map((day) =>
        day.day === 2 ? { ...day, lessonActivityId: 'lesson:gone.away' } : day,
      ),
    },
  });

  assert.equal(programDayLesson(enrollment, 2), null);
});


test('old presets resolve their original lessons rather than the latest tool introductions', () => {
  for (const [planId, revision, day, expected] of [
    ['home', 1, 3, 'focus.category'],
    ['phone', 1, 3, 'focus.ending'],
    ['recovery', 1, 3, 'body.corner'],
    ['selfTrust', 1, 3, 'quiet.when'],
    ['morning', 2, 3, 'sleep.light'],
    ['focus', 2, 3, 'focus.ready'],
    ['quiet', 2, 5, 'quiet.notice'],
  ]) {
    const preset = programPresetRevision(planId, revision);
    assert.ok(preset, planId);
    const resolved = resolveProgramDays(preset);
    assert.equal(resolved.status, 'resolved', planId);
    assert.equal(resolved.days[day - 1].lessonActivityId, `lesson:${expected}`, planId);
    assert.equal(lessonForDay(planId, day, revision)?.id, expected, planId);
  }
});

test('an old enrollment without a saved lesson falls back to its preset revision', () => {
  const result = buildProgramEnrollment({
    enrollmentId: 'historical-home',
    planId: 'home',
    presetRevision: 1,
    enrolledOn: '2026-09-23',
  });
  assert.equal(result.status, 'enrolled');
  const enrollment = {
    ...result.enrollment,
    resolved: { ...result.enrollment.resolved, days: result.enrollment.resolved.days.map(
      (day) => day.day === 3 ? { ...day, lessonActivityId: null } : day,
    ) },
  };
  assert.equal(programDayLesson(enrollment, 3)?.id, 'focus.category');
  assert.equal(lessonForDay('home', 3)?.id, 'attention.senseshome');
  enrollment.resolved.days[2].lessonActivityId = 'lesson:focus.home';
  assert.equal(programDayLesson(enrollment, 3)?.id, 'focus.home');
});


test('new pressure enrollments freeze the chosen lesson track without changing Resets', () => {
  const enrollments = ['stress', 'overthinking', 'anger'].map((pressureLessonTrack) => {
    const result = buildProgramEnrollment({
      enrollmentId: `pressure-${pressureLessonTrack}`,
      planId: 'pressure',
      presetRevision: 4,
      pressureLessonTrack,
      enrolledOn: '2026-10-02',
    });
    assert.equal(result.status, 'enrolled');
    assert.equal(result.enrollment.resolverVersion, 3);
    assert.equal(result.enrollment.resolved.days[2].lessonActivityId, `lesson:attention.senses${pressureLessonTrack}`);
    assert.equal(result.enrollment.resolved.days[5].lessonActivityId, `lesson:attention.muscles${pressureLessonTrack}ready`);
    return result.enrollment;
  });
  for (const enrollment of enrollments.slice(1)) {
    assert.deepEqual(enrollment.resolved.days.map((day) => day.activities),
      enrollments[0].resolved.days.map((day) => day.activities));
  }
  const saved = enrollments[1];
  const expected = saved.resolved.days[2].lessonActivityId;
  assert.equal(pressureLessonTrackForIntent('emotional_balance'), 'anger');
  assert.equal(programDayLesson(saved, 3)?.id, expected.slice('lesson:'.length));
});

test('pressure revisions before track selection keep their original saved lesson choices', () => {
  for (const presetRevision of [1, 2]) {
    const base = buildProgramEnrollment({
      enrollmentId: 'old-pressure', planId: 'pressure', presetRevision, enrolledOn: '2026-10-02',
    });
    assert.equal(base.status, 'enrolled');
    for (const pressureLessonTrack of ['stress', 'overthinking', 'anger']) {
      const chosen = buildProgramEnrollment({
        enrollmentId: 'old-pressure', planId: 'pressure', presetRevision, pressureLessonTrack, enrolledOn: '2026-10-02',
      });
      assert.equal(chosen.status, 'enrolled');
      assert.deepEqual(chosen.enrollment.resolved.days, base.enrollment.resolved.days);
    }
  }
});

test('a new pressure enrollment without an intent uses the general stress lessons', () => {
  const result = buildProgramEnrollment({
    enrollmentId: 'default-pressure', planId: 'pressure', presetRevision: 4, enrolledOn: '2026-10-02',
  });
  assert.equal(result.status, 'enrolled');
  assert.equal(result.enrollment.resolved.days[2].lessonActivityId, 'lesson:attention.sensesstress');
});

test('all new reset schedules complete end to end, survive reloads, and reject duplicate advancement', () => {
  const choices = [...new Set(allProgramPresets().map((preset) => preset.planId))]
    .flatMap((planId) => planId === 'pressure'
      ? ['stress', 'overthinking', 'anger'].map((pressureLessonTrack) => ({ planId, pressureLessonTrack }))
      : [{ planId }]);
  for (const choice of choices) {
    const preset = latestProgramPreset(choice.planId);
    const built = buildProgramEnrollment({
      ...choice, enrollmentId: `walk-${choice.planId}-${choice.pressureLessonTrack ?? 'default'}`,
      presetRevision: preset.revision, enrolledOn: '2026-10-02',
    });
    assert.equal(built.status, 'enrolled');
    let enrollment = built.enrollment;
    for (let index = 0; index < preset.days.length; index += 1) {
      // A skipped calendar day leaves the same program day available.
      const localDate = new Date(Date.UTC(2026, 9, 2 + index * 2)).toISOString().slice(0, 10);
      enrollment = JSON.parse(JSON.stringify(enrollment));
      assert.equal(programDayForDate(enrollment, localDate), index + 1);
      const day = currentProgramDay(enrollment);
      assert.ok(programDayLesson(enrollment, day.day));
      if (day.activities.length === 0) {
        // A day with no Reset is advanced by the server's lesson and to-do
        // triggers; no session evidence can move it.
        const session = advanceProgramDay({
          enrollment, evidence: { modality: 'breathing', techniqueId: 'relaxing' }, localDate,
        });
        assert.deepEqual(session, { status: 'refused', reason: 'completion_does_not_match' });
        const isLastDay = index === preset.days.length - 1;
        assert.equal(isLastDay, false, `${choice.planId} ends on a day with no Reset`);
        enrollment = { ...enrollment, programDay: day.day + 1, lastAdvancedOn: localDate };
        continue;
      }
      const completedActivityIds = [];
      let finalEvidence;
      for (const [slot, resolved] of day.activities.entries()) {
        const evidence = activityCompletionCriteria(PROGRAM_ACTIVITIES.get(resolved.activityId));
        const result = advanceProgramDay({ enrollment, evidence, localDate, completedActivityIds });
        if (slot < day.activities.length - 1) {
          assert.equal(result.status, 'recorded');
          assert.equal(result.remaining, day.activities.length - slot - 1);
          completedActivityIds.push(result.activityId);
        } else {
          assert.equal(result.status, index === preset.days.length - 1 ? 'completed' : 'advanced');
          enrollment = result.enrollment;
          finalEvidence = evidence;
        }
      }
      assert.equal(programDayForDate(enrollment, localDate), index + 1);
      const duplicate = advanceProgramDay({ enrollment, evidence: finalEvidence, localDate });
      assert.equal(duplicate.status, 'refused');
    }
    assert.equal(enrollment.status, 'completed');
    assert.equal(enrollment.programDay, preset.days.length);
    const restarted = buildProgramEnrollment({
      ...choice, enrollmentId: 'restart', presetRevision: preset.revision, enrolledOn: '2027-01-01',
    });
    assert.equal(restarted.enrollment.programDay, 1);
    assert.equal(restarted.enrollment.status, 'active');
    assert.equal(restarted.enrollment.lastAdvancedOn, null);
  }
});
