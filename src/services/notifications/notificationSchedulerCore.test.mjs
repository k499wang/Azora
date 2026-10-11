import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDesiredNotificationSchedule,
  getTrialEndingReminderDate,
} from './notificationSchedulerCore.ts';
import {
  buildDailyPlanReminderContent,
  DAILY_REMINDER_DEFINITIONS,
  dailyReminderDefinitionsFor,
} from './notificationCatalog.ts';
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

test('buildDesiredNotificationSchedule includes the trial reminder one day before the trial ends', () => {
  const now = new Date(2026, 4, 16, 8, 0, 0);
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
  assert.equal(schedule[0].trigger.date.getDate(), 17);
  assert.equal(schedule[0].trigger.date.getHours(), 9);
  assert.equal(schedule[0].trigger.date.getMinutes(), 0);
});

test('getTrialEndingReminderDate schedules the morning before the trial ends', () => {
  const now = new Date(2026, 4, 16, 8, 0, 0);
  const trialEndsAt = new Date(2026, 4, 18, 17, 30, 0).toISOString();
  const reminder = getTrialEndingReminderDate(trialEndsAt, now);

  assert.ok(reminder);
  assert.equal(reminder.getFullYear(), 2026);
  assert.equal(reminder.getMonth(), 4);
  assert.equal(reminder.getDate(), 17);
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
