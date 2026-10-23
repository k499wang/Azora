import assert from 'node:assert/strict';
import test from 'node:test';
import { ONBOARDING_ILLUSTRATION_CATALOG } from '../components/common/icons/onboardingIllustrationCatalog.ts';
import { ICON_PATHS } from '../components/common/icons/paths.ts';
import {
  buildStarterPlan,
  starterPlanDrafts,
} from './onboardingStarterPlan.ts';

const keep = (plan, ids) => plan.filter((item) => ids.includes(item.id));

const noAnswers = {
  intent: null,
  wakeEase: null,
  sleepDuration: null,
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
    procrastinationAreas: ['work', 'movement'],
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
    sleepDuration: 'under5',
  });
  const positions = plan.map((item) => order.indexOf(item.daypart));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test('saved habits carry their hour', () => {
  const plan = buildStarterPlan({ ...noAnswers, wakeEase: 'snooze' });
  const kept = plan.find((item) => item.id !== 'outOfBed');
  assert.ok(kept != null);
  const accepted = keep(plan, [kept.id, 'staleHabit']);
  const drafts = starterPlanDrafts(accepted, []);
  assert.equal(drafts.length, 1);
  assert.ok(drafts.every((draft) => draft.recurrence === 'daily'));
  assert.ok(drafts.every((draft) => /^\d{2}:\d{2}$/.test(draft.scheduledTime)));
  assert.ok(
    !drafts.some((draft) => draft.title.includes('Get out of bed')),
  );
  assert.ok(drafts.some((draft) => draft.title === kept.title));
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

test('the cleaning goal recommends three small cleaning habits', () => {
  const plan = buildStarterPlan({ ...noAnswers, intent: 'cleaning' });
  assert.deepEqual(plan.map((item) => item.title), [
    'Clear one small surface',
    'Put five things back where they belong',
    'Wash three dishes',
  ]);
  assert.equal(new Set(plan.map((item) => item.icon)).size, plan.length);
});

test('cleaning habits leave room for the strongest routine answer', () => {
  const plan = buildStarterPlan({
    ...noAnswers,
    intent: 'cleaning',
    wakeEase: 'snooze',
    sleepDuration: 'under5',
    routineHappiness: 'none',
    mentalHealth: ['anxiety'],
    procrastinationAreas: ['work', 'chores', 'movement', 'sleep', 'admin', 'health'],
    procrastinationReasons: ['focus', 'overwhelmed'],
  });
  assert.deepEqual(plan.map((item) => item.id), [
    'goalClearSurface',
    'goalPutThingsAway',
    'goalWashDishes',
    'windDown',
  ]);
});

test('only accepted cleaning habits become daily routine tasks', () => {
  const plan = buildStarterPlan({ ...noAnswers, intent: 'cleaning' });
  const accepted = keep(plan, ['goalPutThingsAway', 'goalWashDishes']);
  assert.deepEqual(starterPlanDrafts(accepted, []), [
    {
      title: 'Put five things back where they belong',
      icon: 'sparkle',
      recurrence: 'daily',
      scheduledTime: '13:00',
    },
    {
      title: 'Wash three dishes',
      icon: 'coffee-outline',
      recurrence: 'daily',
      scheduledTime: '18:00',
    },
  ]);
});

test('chores and home answers earn concrete cleaning habits alongside another goal', () => {
  for (const [answer, reason] of [
    [{ procrastinationAreas: ['chores'] }, 'because you said your space, laundry and dishes keep sliding'],
    [{ choresOverwhelm: 'often' }, 'because you said chores often feel overwhelming'],
    [{ choresOverwhelm: 'almostDaily' }, 'because you said chores feel overwhelming almost every day'],
  ]) {
    const plan = buildStarterPlan({ ...noAnswers, intent: 'focus', ...answer });
    assert.ok(plan.some((item) => item.id === 'goalOneTask'));
    const laundry = plan.find((item) => item.id === 'laundryBasket');
    const kitchen = plan.find((item) => item.id === 'wipeCounter');
    assert.equal(laundry?.title, 'Put dirty clothes in the laundry basket');
    assert.equal(kitchen?.title, 'Wipe one kitchen surface');
    assert.equal(plan.filter((item) => item.because === reason).length, 1);
    assert.equal(kitchen.because, null, 'the same reason is only shown once');
    for (const item of [laundry, kitchen]) {
      assert.ok(ONBOARDING_ILLUSTRATION_CATALOG[item.icon]);
      assert.ok(ICON_PATHS[item.icon]);
    }
    assert.equal(new Set(plan.map((item) => item.icon)).size, plan.length);
    assert.ok(plan.length >= 3 && plan.length <= 4);
  }
});

test('cleaning habits require a home or chores signal', () => {
  for (const answer of [
    {},
    { choresOverwhelm: null },
    { choresOverwhelm: 'never' },
    { choresOverwhelm: 'sometimes' },
    { routineHappiness: 'none' },
    { procrastinationAreas: ['work'] },
  ]) {
    const plan = buildStarterPlan({ ...noAnswers, ...answer });
    assert.ok(!plan.some((item) => ['laundryBasket', 'wipeCounter'].includes(item.id)));
  }
});

test('the cleaning goal keeps its three tasks without additional routine cleaning', () => {
  const plan = buildStarterPlan({
    ...noAnswers,
    intent: 'cleaning',
    procrastinationAreas: ['chores'],
    choresOverwhelm: 'almostDaily',
  });
  assert.ok(!plan.some((item) => ['laundryBasket', 'wipeCounter'].includes(item.id)));
  for (const id of ['goalClearSurface', 'goalPutThingsAway', 'goalWashDishes']) {
    assert.ok(plan.some((item) => item.id === id));
  }
  assert.equal(plan.length, 3);
  assert.equal(new Set(plan.map((item) => item.icon)).size, plan.length);
});

test('explicit cleaning matches take priority over generic planning and movement', () => {
  const plan = buildStarterPlan({
    ...noAnswers,
    intent: 'focus',
    choresOverwhelm: 'often',
    sleepDuration: 'under5',
    procrastinationAreas: ['work'],
  });
  assert.deepEqual(plan.map((item) => item.id), [
    'goalOneTask', 'laundryBasket', 'wipeCounter', 'windDown',
  ]);
});

test('only accepted routine cleaning cards become daily tasks with their dayparts', () => {
  const plan = buildStarterPlan({ ...noAnswers, choresOverwhelm: 'often' });
  const accepted = keep(plan, ['laundryBasket']);
  assert.deepEqual(starterPlanDrafts(accepted, []), [{
    title: 'Put dirty clothes in the laundry basket',
    icon: 'todo-hamper',
    recurrence: 'daily',
    scheduledTime: '13:00',
  }]);
  assert.deepEqual(starterPlanDrafts(keep(plan, ['wipeCounter']), []), [{
    title: 'Wipe one kitchen surface',
    icon: 'todo-counter',
    recurrence: 'daily',
    scheduledTime: '18:00',
  }]);
});

test('the cap never costs the goal its lines', () => {
  const plan = buildStarterPlan({
    intent: 'heart_health',
    wakeEase: 'snooze',
    sleepDuration: 'under5',
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
    routineHappiness: 'none',
    mentalHealth: ['anxiety'],
    procrastinationAreas: ['work', 'chores', 'movement', 'sleep', 'admin', 'health'],
    procrastinationReasons: ['focus', 'overwhelmed'],
  };
  const ranked = buildStarterPlan(everyAnswer).map((item) => item.id);
  // The four strongest matches, displayed in daypart order.
  assert.deepEqual(ranked, [
    'outOfBed',
    'laundryBasket',
    'happyThing',
    'windDown',
  ]);
});

test('representative plans stay within the three-to-four item limit', () => {
  const plans = [
    buildStarterPlan(noAnswers),
    buildStarterPlan({ ...noAnswers, intent: 'daily_habit' }),
    buildStarterPlan({ ...noAnswers, intent: 'sleep' }),
    buildStarterPlan({ ...noAnswers, intent: 'cleaning' }),
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

test('a line that an answer chose says which answer chose it', () => {
  const plan = buildStarterPlan({ ...noAnswers, sleepDuration: '5to6' });
  const windDown = plan.find((item) => item.id === 'windDown');
  assert.equal(windDown.because, 'because you said you sleep under six hours');
});

test('the strongest reason is the one quoted when several match', () => {
  const plan = buildStarterPlan({
    ...noAnswers,
    procrastinationAreas: ['work'],
    procrastinationReasons: ['overwhelmed'],
  });
  const oneThing = plan.find((item) => item.id === 'oneThing');
  assert.equal(oneThing.because, 'because you said it all feels like too much');
});

test('a line topped up to fill the page invents no reason', () => {
  const plan = buildStarterPlan(noAnswers);
  const filler = plan.filter((item) => item.id !== 'happyThing');
  assert.ok(filler.length > 0);
  assert.ok(filler.every((item) => item.because === null));
});

test('what someone struggles with earns a line and is never quoted back', () => {
  const plan = buildStarterPlan({ ...noAnswers, mentalHealth: ['anxiety'] });
  const happyThing = plan.find((item) => item.id === 'happyThing');
  assert.ok(happyThing, 'the line is still chosen');
  assert.equal(happyThing.because, null);
});

test('the goal they picked is the reason its own lines give', () => {
  const plan = buildStarterPlan({ ...noAnswers, intent: 'sleep' });
  const goalLine = plan.find((item) => item.id === 'goalSameBedtime');
  assert.equal(goalLine.because, 'because you came here to sleep better');
});

test('every line carries a reason or an explicit null, never undefined', () => {
  const plan = buildStarterPlan({
    ...noAnswers,
    intent: 'heart_health',
    wakeEase: 'snooze',
    sleepDuration: 'under5',
  });
  assert.ok(plan.every((item) => item.because === null || typeof item.because === 'string'));
});

test('a goal that earns several lines gives its reason once', () => {
  const plan = buildStarterPlan({ ...noAnswers, intent: 'heart_health' });
  const reasons = plan
    .map((item) => item.because)
    .filter((reason) => reason != null);
  assert.equal(reasons.length, new Set(reasons).size);
  assert.equal(reasons.length, 1);
});


test('separate diagnosed ADHD keeps its starter-plan support without treating suspicion as a diagnosis', () => {
  const diagnosed = buildStarterPlan({ ...noAnswers, adhdStatus: 'diagnosed' });
  const legacy = buildStarterPlan({ ...noAnswers, mentalHealth: ['adhd'] });
  assert.ok(diagnosed.some(({ id }) => id === 'happyThing'));
  assert.deepEqual(diagnosed, legacy);
  for (const status of ['suspected', 'no', null]) {
    assert.deepEqual(buildStarterPlan({ ...noAnswers, adhdStatus: status }), buildStarterPlan(noAnswers));
  }
});
