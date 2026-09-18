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
    },
  });

  assert.deepEqual(result.dailyPlanReminders, {
    session: { enabled: false },
    handPicked: { enabled: true },
  });
});

test('invalid and incomplete preference values fall back safely', () => {
  const result = sanitizeNotificationPreferences({
    dailyPlanReminders: {
      session: { enabled: 'yes' },
      handPicked: null,
    },
    trialEndingReminder: { enabled: 'yes' },
  });

  assert.deepEqual(result, {
    dailyPlanReminders: {
      session: { enabled: false },
      handPicked: { enabled: false },
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
  });
});

test('onboarding defaults enable every daily plan reminder', () => {
  assert.deepEqual(ONBOARDING_NOTIFICATION_PREFERENCES.dailyPlanReminders, {
    session: { enabled: true },
    handPicked: { enabled: true },
  });
});
