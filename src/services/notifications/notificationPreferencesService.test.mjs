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
      windDown: { enabled: false },
    },
    trialEndingReminder: { enabled: true, daysBeforeEnd: 2 },
  });
});

test('new daily plan preferences take precedence over legacy data', () => {
  const result = sanitizeNotificationPreferences({
    dailyReminder: { enabled: true, time: '07:30' },
    dailyPlanReminders: {
      session: { enabled: false },
      handPicked: { enabled: true },
      windDown: { enabled: false },
    },
  });

  assert.deepEqual(result.dailyPlanReminders, {
    session: { enabled: false },
    handPicked: { enabled: true },
    windDown: { enabled: false },
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
      windDown: { enabled: false },
    },
    trialEndingReminder: { enabled: false, daysBeforeEnd: 2 },
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
    windDown: { enabled: false },
  });
  assert.equal('removedReminder' in result.dailyPlanReminders, false);
});

test('mergeNotificationPreferences updates individual actions without replacing siblings', () => {
  const result = mergeNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES, {
    dailyPlanReminders: {
      handPicked: { enabled: true },
      windDown: { enabled: false },
    },
  });

  assert.deepEqual(result.dailyPlanReminders, {
    session: { enabled: false },
    handPicked: { enabled: true },
    windDown: { enabled: false },
  });
});

test('onboarding defaults enable only the one daily plan reminder', () => {
  assert.deepEqual(ONBOARDING_NOTIFICATION_PREFERENCES.dailyPlanReminders, {
    session: { enabled: true },
    handPicked: { enabled: false },
    windDown: { enabled: false },
  });
});

test('trial reminder defaults and unrecognized offsets use two days', () => {
  assert.equal(DEFAULT_NOTIFICATION_PREFERENCES.trialEndingReminder.daysBeforeEnd, 2);
  assert.equal(ONBOARDING_NOTIFICATION_PREFERENCES.trialEndingReminder.daysBeforeEnd, 2);
  assert.equal(sanitizeNotificationPreferences(null).trialEndingReminder.daysBeforeEnd, 2);
  for (const daysBeforeEnd of [undefined, null, '3', 1, 4, -3]) {
    assert.deepEqual(sanitizeNotificationPreferences({
      trialEndingReminder: { enabled: true, daysBeforeEnd },
    }).trialEndingReminder, { enabled: true, daysBeforeEnd: 2 });
  }
});

test('trial reminder timing survives other updates and enabled-only edits', () => {
  for (const daysBeforeEnd of [2, 3]) {
    const selected = mergeNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES, {
      trialEndingReminder: { enabled: true, daysBeforeEnd },
    });
    assert.deepEqual(selected.trialEndingReminder, { enabled: true, daysBeforeEnd });
    const disabled = mergeNotificationPreferences(selected, {
      trialEndingReminder: { enabled: false },
    });
    assert.deepEqual(disabled.trialEndingReminder, { enabled: false, daysBeforeEnd });
    const otherEdit = mergeNotificationPreferences(selected, {
      dailyPlanReminders: { session: { enabled: true } },
    });
    assert.deepEqual(otherEdit.trialEndingReminder, selected.trialEndingReminder);
    assert.deepEqual(sanitizeNotificationPreferences(JSON.parse(JSON.stringify(selected))), selected);
  }
});
