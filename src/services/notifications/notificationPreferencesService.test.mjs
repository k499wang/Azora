import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeNotificationPreferences,
  sanitizeNotificationPreferences,
} from './notificationPreferencesCore.ts';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  ONBOARDING_NOTIFICATION_PREFERENCES,
} from './types.ts';

test('legacy daily reminder opt-in enables only the session reminder', () => {
  const result = sanitizeNotificationPreferences({
    dailyReminder: { enabled: true, time: '07:30' },
    trialEndingReminder: { enabled: true },
  });

  assert.deepEqual(result, {
    dailyPlanReminders: {
      session: { enabled: true },
      handPicked: { enabled: false },
      checkIn: { enabled: false },
    },
    trialEndingReminder: { enabled: true },
  });
});

test('new daily plan preferences take precedence over legacy data', () => {
  const result = sanitizeNotificationPreferences({
    dailyReminder: { enabled: true, time: '07:30' },
    dailyPlanReminders: {
      session: { enabled: false },
      handPicked: { enabled: true },
      checkIn: { enabled: true },
    },
  });

  assert.deepEqual(result.dailyPlanReminders, {
    session: { enabled: false },
    handPicked: { enabled: true },
    checkIn: { enabled: true },
  });
});

test('invalid and incomplete preference values fall back safely', () => {
  const result = sanitizeNotificationPreferences({
    dailyPlanReminders: {
      session: { enabled: 'yes' },
      handPicked: null,
      checkIn: { enabled: true },
    },
    trialEndingReminder: { enabled: 'yes' },
  });

  assert.deepEqual(result, {
    dailyPlanReminders: {
      session: { enabled: false },
      handPicked: { enabled: false },
      checkIn: { enabled: true },
    },
    trialEndingReminder: { enabled: false },
  });
});

test('unknown reminders are dropped and missing registry entries use safe defaults', () => {
  const result = sanitizeNotificationPreferences({
    dailyPlanReminders: {
      session: { enabled: true },
      removedReminder: { enabled: true },
    },
  });

  assert.deepEqual(result.dailyPlanReminders, {
    session: { enabled: true },
    handPicked: { enabled: false },
    checkIn: { enabled: false },
  });
  assert.equal('removedReminder' in result.dailyPlanReminders, false);
});

test('mergeNotificationPreferences updates individual actions without replacing siblings', () => {
  const result = mergeNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES, {
    dailyPlanReminders: {
      handPicked: { enabled: true },
    },
  });

  assert.deepEqual(result.dailyPlanReminders, {
    session: { enabled: false },
    handPicked: { enabled: true },
    checkIn: { enabled: false },
  });
});

test('onboarding defaults enable all three daily plan reminders', () => {
  assert.deepEqual(ONBOARDING_NOTIFICATION_PREFERENCES.dailyPlanReminders, {
    session: { enabled: true },
    handPicked: { enabled: true },
    checkIn: { enabled: true },
  });
});
