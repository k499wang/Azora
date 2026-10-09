import assert from 'node:assert/strict';
import test from 'node:test';

import { SHORT_RESET_PLAN_PURPOSE } from '../features/program/domain/programResetPurpose';
import {
  PROGRAM_ACTIVITIES,
  latestProgramPreset,
  programPresetWeeks,
} from '../features/program/domain/programCatalogue';
import { buildOnboardingReport } from './onboardingReport';

const EMPTY_ANSWERS = {
  contextEcho: null,
  routineEcho: null,
  obstacleEcho: null,
  goalPhrase: null,
  sleepEcho: null,
  energyEcho: null,
  focusEcho: null,
  stressEcho: null,
};
const PLAN_IDS = ['night', 'morning', 'focus', 'home', 'phone', 'pressure', 'recovery', 'selfTrust', 'quiet'];

test('unanswered questions do not invent answer groups or an obstacle', () => {
  const report = buildOnboardingReport('home', EMPTY_ANSWERS);
  assert.deepEqual(report.summary, []);
  assert.doesNotMatch(report.fitLines[0], /because|overwhelmed|unclear|tired/i);
});

test('selected answers form at most five ordered groups without inventing a cause', () => {
  const report = buildOnboardingReport('home', {
    ...EMPTY_ANSWERS,
    goalPhrase: 'make your home feel manageable',
    contextEcho: 'chores often feel overwhelming',
    routineEcho: 'you’re always catching up',
    sleepEcho: 'your mind won’t switch off at night',
    energyEcho: 'your energy goes up and down',
    focusEcho: 'you get distracted sometimes',
    stressEcho: 'stress has been building this past week',
    obstacleEcho: 'the first step is unclear',
  });
  assert.deepEqual(report.summary, [
    { id: 'goal', label: 'Your priority', value: 'Make your home feel manageable.' },
    { id: 'routine', label: 'Daily life', value: 'Chores often feel overwhelming and you’re always catching up.' },
    { id: 'rest', label: 'Rest & energy', value: 'Your mind won’t switch off at night and your energy goes up and down.' },
    { id: 'focus', label: 'Focus & stress', value: 'You get distracted sometimes and stress has been building this past week.' },
    { id: 'starting', label: 'What makes starting hard', value: 'The first step is unclear.' },
  ]);
  assert.match(report.fitLines[0], /Your priority is to make your home feel manageable/);
  assert.match(report.fitLines[1], /^Chores often feel overwhelming\./);
  assert.doesNotMatch(report.fitLines.join(' '), /Because|first step is unclear/);
});

test('missing groups stay absent and positive answers are preserved', () => {
  const report = buildOnboardingReport('home', {
    ...EMPTY_ANSWERS,
    contextEcho: 'chores rarely feel overwhelming',
    routineEcho: 'most days feel manageable',
    sleepEcho: 'you drop off without trouble',
  });
  assert.deepEqual(report.summary, [
    { id: 'routine', label: 'Daily life', value: 'Chores rarely feel overwhelming and most days feel manageable.' },
    { id: 'rest', label: 'Rest & energy', value: 'You drop off without trouble.' },
  ]);
});

test('repeated answers appear only once across and within groups', () => {
  const report = buildOnboardingReport('focus', {
    ...EMPTY_ANSWERS,
    contextEcho: 'you get distracted',
    routineEcho: 'you get distracted',
    focusEcho: 'you get distracted',
    stressEcho: 'stress has stayed mild this past week',
    obstacleEcho: 'you get distracted',
  });
  assert.deepEqual(report.summary, [
    { id: 'focus', label: 'Focus & stress', value: 'You get distracted and stress has stayed mild this past week.' },
  ]);
  assert.match(report.fitLines[1], /^You get distracted\./);
});

test('sleep context stays in the rest group instead of repeating under daily life', () => {
  const report = buildOnboardingReport('night', {
    ...EMPTY_ANSWERS,
    contextEcho: 'your mind won’t switch off at night',
    sleepEcho: 'your mind won’t switch off at night',
    routineEcho: 'most days feel manageable',
  });
  assert.deepEqual(report.summary, [
    { id: 'routine', label: 'Daily life', value: 'Most days feel manageable.' },
    { id: 'rest', label: 'Rest & energy', value: 'Your mind won’t switch off at night.' },
  ]);
});

test('empty answers never invent personal facts or expose a first step', () => {
  for (const planId of PLAN_IDS) {
    const report = buildOnboardingReport(planId, EMPTY_ANSWERS);
    assert.equal(report.fitLines.length, 2, planId);
    assert.doesNotMatch(report.fitLines.join(' '), /Your priority|Because|unclear|catching up|can’t sleep|running low|distracted/, planId);
    assert.equal('firstStep' in report, false, planId);
  }
});

test('fit explains the chosen plan’s actual practices', () => {
  for (const [planId, purpose] of Object.entries(SHORT_RESET_PLAN_PURPOSE)) {
    assert.equal(buildOnboardingReport(planId, EMPTY_ANSWERS).fitLines[0], purpose);
  }
  assert.match(buildOnboardingReport('night', EMPTY_ANSWERS).fitLines[0], /guided reset.*wind down/);
  assert.match(buildOnboardingReport('pressure', EMPTY_ANSWERS).fitLines[0], /Guided breathing and daily lessons/);
});

test('changing selected goals and relevant answers changes fit without changing the plan’s actual purpose', () => {
  const worried = buildOnboardingReport('night', {
    ...EMPTY_ANSWERS,
    goalPhrase: 'sleep better',
    sleepEcho: 'your mind won’t switch off at night',
  });
  const rested = buildOnboardingReport('night', {
    ...EMPTY_ANSWERS,
    goalPhrase: 'feel more rested',
    sleepEcho: 'you drop off without trouble',
  });
  assert.match(worried.fitLines[0], /^Your priority is to sleep better\./);
  assert.match(rested.fitLines[0], /^Your priority is to feel more rested\./);
  assert.match(worried.fitLines[1], /^Your mind won’t switch off at night\./);
  assert.match(rested.fitLines[1], /^You drop off without trouble\./);
  assert.notDeepEqual(worried.fitLines, rested.fitLines);
  assert.ok(worried.fitLines[0].endsWith(buildOnboardingReport('night', EMPTY_ANSWERS).fitLines[0]));
});

test('fit prefers plan context, then the relevant answer, then selected routine', () => {
  const selected = {
    ...EMPTY_ANSWERS,
    contextEcho: 'your hours are all over the place',
    sleepEcho: 'your mind won’t switch off at night',
    routineEcho: 'you’re always catching up',
    focusEcho: 'you get distracted often',
  };
  assert.match(buildOnboardingReport('night', selected).fitLines[1], /^Your hours are all over the place\./);
  assert.match(buildOnboardingReport('night', { ...selected, contextEcho: null }).fitLines[1], /^Your mind won’t switch off at night\./);
  const routineFallback = buildOnboardingReport('night', { ...selected, contextEcho: null, sleepEcho: null });
  assert.match(routineFallback.fitLines[1], /^You’re always catching up\./);
  assert.doesNotMatch(routineFallback.fitLines[1], /distracted/);
});

test('obstacle answers stay in the profile and cannot change plan-fit wording', () => {
  for (const obstacleEcho of ['the first step is unclear', 'you don’t have the energy', 'you’re worried you’ll do it wrong']) {
    const report = buildOnboardingReport('home', { ...EMPTY_ANSWERS, obstacleEcho });
    assert.equal(report.summary[0].id, 'starting');
    assert.deepEqual(report.fitLines, buildOnboardingReport('home', EMPTY_ANSWERS).fitLines);
    assert.doesNotMatch(report.fitLines.join(' '), /Because|first step is unclear/);
  }
});

test('plan facts follow the latest catalogue and count only day-one practice time', () => {
  for (const planId of PLAN_IDS) {
    const published = latestProgramPreset(planId);
    assert.ok(published, planId);
    const { planFacts } = buildOnboardingReport(planId, EMPTY_ANSWERS);
    assert.equal(planFacts.weeks, programPresetWeeks(published), planId);
    const practiceMinutes = published.days[0].activityIds.reduce((total, id) => {
      const activity = PROGRAM_ACTIVITIES.get(id);
      assert.ok(activity, id);
      return total + Math.round(activity.estimatedSeconds / 60);
    }, 0);
    assert.equal(planFacts.firstDayMinutes, practiceMinutes, planId);
    assert.ok(planFacts.weeks > 0 && planFacts.firstDayMinutes > 0, planId);
  }
});

test('every plan offers a distinct actionable tip independent of selected answers', () => {
  const actions = new Set();
  for (const planId of PLAN_IDS) {
    const report = buildOnboardingReport(planId, EMPTY_ANSWERS);
    assert.ok(report.practiceTip.action.length > 0, planId);
    assert.ok(report.practiceTip.why.length > 0, planId);
    assert.doesNotMatch(report.practiceTip.action, /unlock|subscribe|purchase|buy/i, planId);
    assert.notEqual(report.practiceTip.action, report.practiceTip.why, planId);
    assert.deepEqual(
      report.practiceTip,
      buildOnboardingReport(planId, {
        ...EMPTY_ANSWERS,
        goalPhrase: 'feel more rested',
        obstacleEcho: 'the first step is unclear',
      }).practiceTip,
      planId,
    );
    actions.add(report.practiceTip.action);
  }
  assert.equal(actions.size, PLAN_IDS.length);
});

