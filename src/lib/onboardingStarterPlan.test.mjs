import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStarterPlan, starterPlanDrafts } from './onboardingStarterPlan.ts';

const noAnswers = {
  intent: null,
  wakeEase: null,
  sleepDuration: null,
  dayActivity: null,
  routineHappiness: null,
  mentalHealth: [],
  procrastinationAreas: [],
  procrastinationReasons: [],
};

test('a plan has three to four relevant lines without a forced reset', () => {
  const plan = buildStarterPlan(noAnswers);
  assert.ok(plan.length >= 3 && plan.length <= 4);
  assert.ok(!plan.some((item) => item.id === 'reset'));
  assert.ok(!plan.some((item) => item.title === 'Take 3 deep breaths'));
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
  assert.ok(ids.includes('windDown'));
  assert.ok(ids.includes('walk'));
});

test('the page never runs past four lines', () => {
  const plan = buildStarterPlan({
    wakeEase: 'struggle',
    sleepDuration: 'under5',
    dayActivity: 'sitting',
    routineHappiness: 'none',
    mentalHealth: ['anxiety'],
    procrastinationAreas: ['work', 'chores', 'movement', 'sleep', 'admin', 'health'],
    procrastinationReasons: ['overwhelmed', 'focus', 'start'],
  });
  assert.equal(plan.length, 4);
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

test('the goal they chose puts its own lines on the plan', () => {
  const plan = buildStarterPlan({ ...noAnswers, intent: 'heart_health' });
  const ids = plan.map((item) => item.id);
  assert.deepEqual(ids, [
    'goalRestingRate',
    'goalStairs',
    'goalWalkAfterDinner',
  ]);
});

test('a different goal gets different lines', () => {
  const plan = buildStarterPlan({ ...noAnswers, intent: 'sleep' });
  const ids = plan.map((item) => item.id);
  assert.ok(ids.includes('goalSameBedtime'));
  assert.ok(!ids.includes('goalRestingRate'));
});

test('the cap never costs the goal its lines', () => {
  const plan = buildStarterPlan({
    intent: 'heart_health',
    wakeEase: 'snooze',
    sleepDuration: 'under5',
    dayActivity: 'sitting',
    routineHappiness: 'none',
    mentalHealth: ['anxiety'],
    procrastinationAreas: ['work', 'chores', 'movement', 'sleep', 'admin', 'health'],
    procrastinationReasons: ['focus', 'overwhelmed'],
  });
  const ids = plan.map((item) => item.id);
  assert.equal(plan.length, 4);
  assert.ok(ids.includes('goalRestingRate'));
  assert.ok(ids.includes('goalStairs'));
  assert.ok(ids.includes('goalWalkAfterDinner'));
  assert.ok(ids.includes('windDown'));
});

test('no two lines anywhere in the set wear the same icon', () => {
  const everyIntent = [
    'stress_relief', 'calm_fast', 'sleep', 'focus', 'energy', 'self_acceptance',
    'emotional_balance', 'self_care', 'spiritual', 'yoga', 'heart_health',
    'daily_habit', 'other',
  ];
  const seen = new Map();
  for (const intent of everyIntent) {
    const plan = buildStarterPlan({
      intent,
      wakeEase: 'struggle',
      sleepDuration: 'under5',
      dayActivity: 'sitting',
      routineHappiness: 'none',
      mentalHealth: ['anxiety'],
      procrastinationAreas: ['work', 'chores', 'movement', 'sleep', 'admin', 'health'],
      procrastinationReasons: ['focus', 'overwhelmed'],
    });
    for (const item of plan) {
      const owner = seen.get(item.icon);
      assert.ok(owner == null || owner === item.id, `${item.icon} is on both ${owner} and ${item.id}`);
      seen.set(item.icon, item.id);
    }
  }
});

test('no two lines on one plan wear the same icon', () => {
  const plan = buildStarterPlan({
    intent: 'heart_health',
    wakeEase: 'snooze',
    sleepDuration: 'under5',
    dayActivity: 'sitting',
    routineHappiness: 'none',
    mentalHealth: ['anxiety'],
    procrastinationAreas: ['work', 'chores', 'movement', 'sleep', 'admin', 'health'],
    procrastinationReasons: ['focus', 'overwhelmed'],
  });
  const icons = plan.map((item) => item.icon);
  assert.equal(new Set(icons).size, icons.length);
});

test('a plan still reads morning to bedtime once goal lines are mixed in', () => {
  const order = ['start', 'afternoon', 'evening', 'bedtime'];
  const plan = buildStarterPlan({
    ...noAnswers,
    intent: 'heart_health',
    wakeEase: 'snooze',
    sleepDuration: 'under5',
  });
  const positions = plan.map((item) => order.indexOf(item.daypart));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test('the strongest answer keeps its line when the page is full', () => {
  const plan = buildStarterPlan({
    intent: null,
    wakeEase: 'snooze',
    sleepDuration: 'under5',
    dayActivity: 'sitting',
    routineHappiness: 'none',
    mentalHealth: ['anxiety'],
    procrastinationAreas: ['work', 'chores', 'movement', 'sleep', 'admin', 'health'],
    procrastinationReasons: ['focus', 'overwhelmed'],
  });
  const ids = plan.map((item) => item.id);
  assert.ok(ids.includes('windDown'));
  assert.ok(!ids.includes('water'));
});

test('every routine line is ranked, so none of them sorts by accident', () => {
  const everyAnswer = {
    intent: null,
    wakeEase: 'struggle',
    sleepDuration: 'under5',
    dayActivity: 'sitting',
    routineHappiness: 'none',
    mentalHealth: ['anxiety'],
    procrastinationAreas: ['work', 'chores', 'movement', 'sleep', 'admin', 'health'],
    procrastinationReasons: ['focus', 'overwhelmed'],
  };
  const ranked = buildStarterPlan(everyAnswer).map((item) => item.id);
  // The four strongest matches, displayed in daypart order.
  assert.deepEqual(ranked, [
    'outOfBed',
    'oneThing',
    'happyThing',
    'windDown',
  ]);
});

test('representative plans stay within the three-to-four item limit', () => {
  const plans = [
    buildStarterPlan(noAnswers),
    buildStarterPlan({ ...noAnswers, intent: 'daily_habit' }),
    buildStarterPlan({ ...noAnswers, intent: 'sleep' }),
    buildStarterPlan({ ...noAnswers, intent: 'heart_health' }),
    buildStarterPlan({
      ...noAnswers,
      intent: 'heart_health',
      sleepDuration: 'under5',
    }),
  ];

  for (const plan of plans) {
    assert.ok(plan.length >= 3 && plan.length <= 4);
    assert.ok(!plan.some((item) => item.title === 'Take 3 deep breaths'));
  }
});
