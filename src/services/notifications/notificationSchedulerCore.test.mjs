import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDesiredNotificationSchedule,
  getDailyReminderHorizonDays,
  getTrialEndingReminderDate,
  MAX_PENDING_DAILY_ENTRIES,
} from './notificationSchedulerCore.ts';
import {
  buildDailyPlanReminderContent,
  DAILY_REMINDER_DEFINITIONS,
} from './notificationCatalog.ts';

const dailyPlanSchedule = {
  version: 1,
  timeMode: 'device_local',
  actions: {
    session: '07:15',
    handPicked: '13:30',
    checkIn: '20:45',
  },
};

const basePreferences = {
  dailyPlanReminders: {
    session: { enabled: false },
    handPicked: { enabled: false },
    checkIn: { enabled: false },
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

test('buildDesiredNotificationSchedule creates 14 future days for all three actions', () => {
  const now = new Date(2026, 4, 16, 6, 0, 0);
  const schedule = buildDesiredNotificationSchedule({
    preferences: {
      ...basePreferences,
      dailyPlanReminders: {
        session: { enabled: true },
        handPicked: { enabled: true },
        checkIn: { enabled: true },
      },
    },
    dailyPlanSchedule,
    trialEndsAt: null,
    now,
  });

  assert.equal(schedule.length, 42);
  const expected = {
    session: { hour: 7, minute: 15, kind: 'daily_plan_session' },
    handPicked: { hour: 13, minute: 30, kind: 'daily_plan_hand_picked' },
    checkIn: { hour: 20, minute: 45, kind: 'daily_plan_check_in' },
  };

  for (const [action, details] of Object.entries(expected)) {
    const entries = schedule.filter(
      (item) => item.data.reminder_action === action,
    );
    assert.equal(entries.length, 14);
    for (const item of entries) {
      assert.equal(item.trigger.type, 'date');
      assert.equal(item.trigger.date.getHours(), details.hour);
      assert.equal(item.trigger.date.getMinutes(), details.minute);
      assert.equal(item.kind, details.kind);
      assert.ok(item.stableId.startsWith(`azora:daily:${action}:`));
    }
  }

  const ids = new Set(schedule.map((item) => item.stableId));
  assert.equal(ids.size, 42);
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

  assert.equal(schedule.length, 14);
  assert.ok(
    schedule.every((item) => item.data.reminder_action === 'handPicked'),
  );
});

test('daily reminder horizon preserves 14 days until the pending budget requires a cap', () => {
  assert.equal(getDailyReminderHorizonDays(0), 0);
  assert.equal(getDailyReminderHorizonDays(1), 14);
  assert.equal(getDailyReminderHorizonDays(3), 14);
  assert.equal(getDailyReminderHorizonDays(4), 14);
  assert.equal(getDailyReminderHorizonDays(5), 11);
  assert.equal(getDailyReminderHorizonDays(MAX_PENDING_DAILY_ENTRIES + 1), 1);
});

test('the scheduler follows the supplied reminder registry', () => {
  const now = new Date(2026, 4, 16, 6, 0, 0);
  const sessionOnlyRegistry = DAILY_REMINDER_DEFINITIONS.filter(
    (definition) => definition.id === 'session',
  );
  const schedule = buildDesiredNotificationSchedule(
    {
      preferences: {
        ...basePreferences,
        dailyPlanReminders: {
          session: { enabled: true },
          handPicked: { enabled: true },
          checkIn: { enabled: true },
        },
      },
      dailyPlanSchedule,
      trialEndsAt: null,
      now,
    },
    sessionOnlyRegistry,
  );

  assert.equal(schedule.length, 14);
  assert.ok(schedule.every((item) => item.data.reminder_action === 'session'));
});

test('a large supplied registry stays inside the reserved daily budget', () => {
  const now = new Date(2026, 4, 16, 6, 0, 0);
  const largeRegistry = Array.from({ length: 60 }, (_, index) => ({
    id: `extra-${index}`,
    kind: 'daily_plan_session',
    scheduleActionId: 'session',
    content: {
      title: `Reminder ${index}`,
      body: 'A generic reminder.',
      channelId: 'daily-reminders',
    },
  }));
  const extraPreferences = Object.fromEntries(
    largeRegistry.map((definition) => [definition.id, { enabled: true }]),
  );

  const schedule = buildDesiredNotificationSchedule(
    {
      preferences: {
        dailyPlanReminders: extraPreferences,
        trialEndingReminder: { enabled: false },
      },
      dailyPlanSchedule,
      trialEndsAt: null,
      now,
    },
    largeRegistry,
  );

  assert.equal(schedule.length, MAX_PENDING_DAILY_ENTRIES);
  assert.equal(new Set(schedule.map((item) => item.stableId)).size, schedule.length);
  assert.ok(
    schedule.every(
      (item, index) =>
        index === 0 ||
        schedule[index - 1].trigger.date.getTime() <= item.trigger.date.getTime(),
    ),
  );
});

test('buildDesiredNotificationSchedule skips only action times that already passed today', () => {
  const now = new Date(2026, 4, 16, 14, 0, 0);
  const schedule = buildDesiredNotificationSchedule({
    preferences: {
      ...basePreferences,
      dailyPlanReminders: {
        session: { enabled: true },
        handPicked: { enabled: true },
        checkIn: { enabled: true },
      },
    },
    dailyPlanSchedule,
    trialEndsAt: null,
    now,
  });

  const sessionEntries = schedule.filter(
    (item) => item.data.reminder_action === 'session',
  );
  const handPickedEntries = schedule.filter(
    (item) => item.data.reminder_action === 'handPicked',
  );
  const checkInEntries = schedule.filter(
    (item) => item.data.reminder_action === 'checkIn',
  );

  assert.equal(sessionEntries.length, 13);
  assert.equal(handPickedEntries.length, 13);
  assert.equal(checkInEntries.length, 14);
  assert.equal(sessionEntries[0].trigger.date.getDate(), 17);
  assert.equal(checkInEntries[0].trigger.date.getDate(), 16);
});

test('daily plan content is generic and specific to each action', () => {
  const session = buildDailyPlanReminderContent('session');
  const handPicked = buildDailyPlanReminderContent('handPicked');
  const checkIn = buildDailyPlanReminderContent('checkIn');

  assert.match(session.title, /guided breathing/i);
  assert.match(handPicked.title, /daily reset/i);
  assert.match(checkIn.title, /azora protocol/i);
  assert.notEqual(session.title, handPicked.title);
  assert.notEqual(handPicked.title, checkIn.title);
  assert.equal(session.data.destination, undefined);
  assert.equal(handPicked.data.destination, undefined);
  assert.equal(checkIn.data.destination, undefined);
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
