import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDesiredNotificationSchedule,
  getTrialEndingReminderDate,
  withinWakingHours,
} from './notificationSchedulerCore.ts';
import {
  buildDailyPlanReminderContent,
  DAILY_REMINDER_DEFINITIONS,
  dailyReminderDefinitionsFor,
} from './notificationCatalog.ts';
import { getRevenueCatTrialEndsAt } from '../subscriptions/entitlementTrial.ts';
import { INTENT_OPTIONS } from '../../components/onboarding/data/intentOptions.ts';

const dailyPlanSchedule = {
  version: 1,
  timeMode: 'device_local',
  actions: {
    session: '07:15',
    handPicked: '13:30',
    windDown: '20:45',
  },
};

const basePreferences = {
  dailyPlanReminders: {
    session: { enabled: false },
    handPicked: { enabled: false },
    windDown: { enabled: false },
  },
  trialEndingReminder: { enabled: true },
};

test('daily reminder registry ids and kinds are unique', () => {
  assert.equal(
    new Set(DAILY_REMINDER_DEFINITIONS.map((definition) => definition.id)).size,
    DAILY_REMINDER_DEFINITIONS.length,
  );
  assert.equal(
    new Set(DAILY_REMINDER_DEFINITIONS.map((definition) => definition.kind)).size,
    DAILY_REMINDER_DEFINITIONS.length,
  );
});

test('default scheduling books only session for 14 future days despite legacy secondary switches', () => {
  const entries = buildDesiredNotificationSchedule({
    preferences: {
      ...basePreferences,
      dailyPlanReminders: { session: { enabled: true }, handPicked: { enabled: true }, windDown: { enabled: true } },
    },
    dailyPlanSchedule, trialEndsAt: null, now: new Date(2026, 4, 16, 6),
  });
  assert.equal(entries.length, 14);
  assert.equal(new Set(entries.map((item) => item.stableId)).size, 14);
  for (const item of entries) {
    assert.equal(item.data.reminder_action, 'session');
    assert.equal(item.trigger.date.getHours(), 7);
    assert.equal(item.trigger.date.getMinutes(), 15);
  }
});

test('disabled daily plan actions are not scheduled', () => {
  const now = new Date(2026, 4, 16, 6, 0, 0);
  const schedule = buildDesiredNotificationSchedule({
    preferences: {
      ...basePreferences,
      dailyPlanReminders: {
        ...basePreferences.dailyPlanReminders,
        handPicked: { enabled: true },
      },
    },
    dailyPlanSchedule,
    trialEndsAt: null,
    now,
  });

  assert.deepEqual(schedule, []);
});

test('supplied registry cannot enable secondary or duplicate daily prompts', () => {
  const input = {
    preferences: { ...basePreferences, dailyPlanReminders: { session: { enabled: true }, handPicked: { enabled: true }, windDown: { enabled: true } } },
    dailyPlanSchedule, trialEndsAt: null, now: new Date(2026, 4, 16, 6),
  };
  const doubled = [...DAILY_REMINDER_DEFINITIONS, ...DAILY_REMINDER_DEFINITIONS];
  assert.equal(buildDesiredNotificationSchedule(input, doubled).length, 14);
  assert.deepEqual(buildDesiredNotificationSchedule(input, DAILY_REMINDER_DEFINITIONS.slice(1)), []);
  const movedSession = [{ ...DAILY_REMINDER_DEFINITIONS[0], scheduleActionId: 'handPicked' }];
  assert.deepEqual(buildDesiredNotificationSchedule(input, movedSession), []);
});

test('a passed main time skips today and keeps tomorrow through the remaining horizon', () => {
  const entries = buildDesiredNotificationSchedule({
    preferences: { ...basePreferences, dailyPlanReminders: { session: { enabled: true }, handPicked: { enabled: true }, windDown: { enabled: true } } },
    dailyPlanSchedule, trialEndsAt: null, now: new Date(2026, 4, 16, 14),
  });
  assert.equal(entries.length, 13);
  assert.equal(entries[0].trigger.date.getDate(), 17);
  assert.ok(entries.every((item) => item.data.reminder_action === 'session'));
});

/**
 * A reminder names an hour, never an exercise. Which exercise sits in a slot is
 * the plan's business and it changes week to week, so a notification that named
 * one would be wrong within a fortnight — and it is scheduled two weeks ahead,
 * so it would be wrong before it was even delivered.
 */
test('daily plan content names the hour, not the exercise', () => {
  const contents = ['session', 'handPicked', 'windDown'].map(
    buildDailyPlanReminderContent,
  );

  const titles = new Set(contents.map((content) => content.title));
  assert.equal(titles.size, 3, 'two slots share a reminder');

  for (const content of contents) {
    assert.equal(content.data.destination, undefined);
    assert.doesNotMatch(content.title, /guided|hand.?picked/i);
    assert.doesNotMatch(content.body, /guided|hand.?picked/i);
  }
});

test('every onboarding intent has its own body for the one daily reminder', () => {
  for (const { id } of INTENT_OPTIONS) {
    const definitions = dailyReminderDefinitionsFor(id);
    assert.equal(definitions.length, 1);

    definitions.forEach((definition, index) => {
      const generic = DAILY_REMINDER_DEFINITIONS[index];
      assert.equal(definition.id, generic.id);
      assert.ok(definition.content.body.length > 0, `${id}/${definition.id} is empty`);
      assert.notEqual(definition.content.body, generic.content.body);
      assert.equal(definition.content.title, id === 'sleep' ? 'Your bedtime routine is ready' : generic.content.title);
    });
  }
});

test('an intent without its own copy keeps the generic reminders', () => {
  assert.deepEqual(dailyReminderDefinitionsFor('other'), [DAILY_REMINDER_DEFINITIONS[0]]);
});

test('the schedule carries the intent body', () => {
  const now = new Date(2026, 4, 16, 6, 0, 0);
  const sleepDefinitions = dailyReminderDefinitionsFor('sleep');
  const schedule = buildDesiredNotificationSchedule(
    {
      preferences: {
        ...basePreferences,
        dailyPlanReminders: {
          session: { enabled: true },
          handPicked: { enabled: true },
          windDown: { enabled: true },
        },
      },
      dailyPlanSchedule,
      trialEndsAt: null,
      now,
    },
    sleepDefinitions,
  );

  for (const definition of sleepDefinitions) {
    const entries = schedule.filter(
      (item) => item.data.reminder_action === definition.id,
    );
    assert.ok(entries.length > 0);
    assert.ok(entries.every((item) => item.body === definition.content.body));
    assert.ok(entries.every((item) => item.title === definition.content.title));
  }
});

test('buildDesiredNotificationSchedule includes the trial reminder two days before the trial ends', () => {
  const now = new Date(2026, 4, 15, 8, 0, 0);
  const trialEndsAt = new Date(2026, 4, 18, 17, 30, 0).toISOString();
  const schedule = buildDesiredNotificationSchedule({
    preferences: basePreferences,
    dailyPlanSchedule,
    trialEndsAt,
    now,
  });

  assert.equal(schedule.length, 1);
  assert.equal(schedule[0].stableId, 'azora:trial:ending');
  assert.equal(schedule[0].kind, 'trial_ending');
  assert.equal(schedule[0].trigger.date.getDate(), 16);
  assert.equal(schedule[0].trigger.date.getHours(), 9);
  assert.equal(schedule[0].trigger.date.getMinutes(), 0);
  assert.equal(schedule[0].title, 'Your Azora trial renews May 18');
});

test('a paid 30-day intro trial gets the same reminder two days before it renews', () => {
  const now = new Date(2026, 4, 16, 8, 0, 0);
  const trialEndsAt = getRevenueCatTrialEndsAt({
    periodType: 'INTRO',
    expirationDate: new Date(2026, 5, 15, 17, 30, 0).toISOString(),
  });
  const schedule = buildDesiredNotificationSchedule({
    preferences: basePreferences,
    dailyPlanSchedule,
    trialEndsAt,
    now,
  });

  assert.equal(schedule.length, 1);
  assert.equal(schedule[0].kind, 'trial_ending');
  assert.equal(schedule[0].trigger.date.getMonth(), 5);
  assert.equal(schedule[0].trigger.date.getDate(), 13);
  assert.equal(schedule[0].trigger.date.getHours(), 9);
});

test('getTrialEndingReminderDate schedules the morning two days before the trial ends', () => {
  const now = new Date(2026, 4, 15, 8, 0, 0);
  const trialEndsAt = new Date(2026, 4, 18, 17, 30, 0).toISOString();
  const reminder = getTrialEndingReminderDate(trialEndsAt, now);

  assert.ok(reminder);
  assert.equal(reminder.getFullYear(), 2026);
  assert.equal(reminder.getMonth(), 4);
  assert.equal(reminder.getDate(), 16);
  assert.equal(reminder.getHours(), 9);
  assert.equal(reminder.getMinutes(), 0);
});

test('getTrialEndingReminderDate catches up if the reminder time already passed', () => {
  const now = new Date(2026, 4, 18, 10, 0, 0);
  const trialEndsAt = new Date(2026, 4, 18, 17, 30, 0).toISOString();
  const reminder = getTrialEndingReminderDate(trialEndsAt, now);

  assert.ok(reminder);
  assert.equal(reminder.getTime(), now.getTime() + 5 * 60 * 1000);
});

test('getTrialEndingReminderDate skips expired trials', () => {
  const now = new Date(2026, 4, 18, 18, 0, 0);
  const trialEndsAt = new Date(2026, 4, 18, 17, 30, 0).toISOString();

  assert.equal(getTrialEndingReminderDate(trialEndsAt, now), null);
});

test('a saved three-day preference schedules a single reminder before the year boundary', () => {
  const schedule = buildDesiredNotificationSchedule({
    preferences: { ...basePreferences, trialEndingReminder: { enabled: true, daysBeforeEnd: 3 } },
    dailyPlanSchedule,
    trialEndsAt: new Date(2027, 0, 2, 17, 30).toISOString(),
    now: new Date(2026, 11, 28, 8),
  });
  assert.equal(schedule.length, 1);
  assert.equal(schedule[0].stableId, 'azora:trial:ending');
  assert.equal(schedule[0].trigger.date.getTime(), new Date(2026, 11, 30, 9).getTime());
});

test('three-day reminders retain catch-up and skip a catch-up beyond expiry', () => {
  const now = new Date(2026, 4, 18, 10);
  assert.equal(
    getTrialEndingReminderDate(new Date(2026, 4, 18, 17).toISOString(), now, 3)?.getTime(),
    now.getTime() + 5 * 60 * 1000,
  );
  assert.equal(getTrialEndingReminderDate(new Date(now.getTime() + 60_000).toISOString(), now, 3), null);
  assert.equal(getTrialEndingReminderDate('unreadable', now, 3), null);
});

test('chosen reminder uses local calendar days at 9am across daylight saving', () => {
  const originalTZ = process.env.TZ;
  try {
    process.env.TZ = 'America/Toronto';
    const trialEndsAt = '2026-03-10T00:30:00Z'; // March 9 locally, after DST starts.
    const reminder = getTrialEndingReminderDate(trialEndsAt, new Date('2026-03-01T12:00:00Z'), 3);
    assert.equal(reminder?.toISOString(), '2026-03-06T14:00:00.000Z');
    assert.equal(reminder?.getHours(), 9);
  } finally {
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  }
});

const seenAt = new Date(2026, 4, 16, 12);
const nudgeInput = {
  preferences: { ...basePreferences, trialEndingReminder: { enabled: false } },
  dailyPlanSchedule,
  trialEndsAt: null,
  isPro: false,
  paywallSeenAt: seenAt.toISOString(),
  now: seenAt,
};
const nudgesFor = (input) =>
  buildDesiredNotificationSchedule(input).filter((item) => item.kind === 'paywall_nudge');

test('a non-Pro user who saw the paywall gets nudges 1h, 24h and 72h after it appeared', () => {
  const nudges = nudgesFor({ ...nudgeInput, now: new Date(2026, 4, 16, 12, 30) });
  assert.deepEqual(
    nudges.map((item) => (item.trigger.date.getTime() - seenAt.getTime()) / 3_600_000),
    [1, 24, 72],
  );
  assert.deepEqual(nudges.map((item) => item.data.variant_index), ['0', '1', '2']);
});

test('paywall nudges that already fired are not rebooked', () => {
  const nudges = nudgesFor({ ...nudgeInput, now: new Date(2026, 4, 17, 13) });
  assert.deepEqual(nudges.map((item) => item.data.variant_index), ['2']);
});

test('paywall nudges need a seen paywall, confirmed non-Pro, and no trial on record', () => {
  for (const input of [
    { ...nudgeInput, paywallSeenAt: null },
    { ...nudgeInput, isPro: true },
    { ...nudgeInput, isPro: null },
    { ...nudgeInput, trialEndsAt: '2026-05-10T00:00:00.000Z' },
  ]) {
    assert.deepEqual(nudgesFor(input), []);
  }
});

test('paywall nudges move out of the night to 9am', () => {
  assert.deepEqual(withinWakingHours(new Date(2026, 4, 16, 23, 30)), new Date(2026, 4, 17, 9));
  assert.deepEqual(withinWakingHours(new Date(2026, 4, 17, 2, 10)), new Date(2026, 4, 17, 9));
  assert.deepEqual(withinWakingHours(new Date(2026, 4, 17, 14, 5)), new Date(2026, 4, 17, 14, 5));
});
