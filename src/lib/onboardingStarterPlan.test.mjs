import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStarterPlan, starterPlanDrafts } from './onboardingStarterPlan.ts';

const noAnswers = {
  wakeEase: null,
  sleepDuration: null,
  dayActivity: null,
  routineHappiness: null,
  mentalHealth: [],
  procrastinationAreas: [],
  procrastinationReasons: [],
};

test('every plan ends on the reset, however little was answered', () => {
  const plan = buildStarterPlan(noAnswers);
  assert.equal(plan[plan.length - 1].id, 'reset');
  assert.ok(plan.length >= 4);
});

test('the answers pick the lines', () => {
  const plan = buildStarterPlan({
    ...noAnswers,
    wakeEase: 'snooze',
    sleepDuration: 'under5',
    dayActivity: 'sitting',
    procrastinationAreas: ['work'],
  });
  const ids = plan.map((item) => item.id);
  assert.ok(ids.includes('outOfBed'));
  assert.ok(ids.includes('oneThing'));
  assert.ok(ids.includes('walk'));
  assert.ok(ids.includes('windDown'));
});

test('the page never runs past seven lines', () => {
  const plan = buildStarterPlan({
    wakeEase: 'struggle',
    sleepDuration: 'under5',
    dayActivity: 'sitting',
    routineHappiness: 'none',
    mentalHealth: ['anxiety'],
    procrastinationAreas: ['work', 'chores', 'movement', 'sleep', 'admin', 'health'],
    procrastinationReasons: ['overwhelmed', 'focus', 'start'],
  });
  assert.equal(plan.length, 7);
  assert.equal(plan[plan.length - 1].id, 'reset');
});

test('the lines run in the order the day does', () => {
  const order = ['start', 'afternoon', 'evening', 'bedtime'];
  const plan = buildStarterPlan({
    ...noAnswers,
    wakeEase: 'snooze',
    dayActivity: 'sitting',
    sleepDuration: 'under5',
  });
  const positions = plan.map((item) => order.indexOf(item.daypart));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test('crossed-off lines are not saved, and the rest carry their hour', () => {
  const plan = buildStarterPlan({ ...noAnswers, wakeEase: 'snooze' });
  const drafts = starterPlanDrafts(plan, ['outOfBed']);
  assert.equal(drafts.length, plan.length - 1);
  assert.ok(drafts.every((draft) => draft.recurrence === 'daily'));
  assert.ok(drafts.every((draft) => /^\d{2}:\d{2}$/.test(draft.scheduledTime)));
  assert.ok(
    !drafts.some((draft) => draft.title.includes('Get out of bed')),
  );
});
