import assert from 'node:assert/strict';
import test from 'node:test';
import { TRIAL_REMINDER_DAYS_BEFORE_END, availableTrialReminderDays, formatTrialDate, trialDaysFromLabel, trialTimelineDates } from './trialReminder.ts';

test('a 7-day trial started today bills a week later and reminds two days before', () => {
  const { reminder, billing } = trialTimelineDates(new Date(2026, 9, 17, 20, 0, 0), 7);
  assert.equal(billing.getDate(), 24);
  assert.equal(reminder.getDate(), 24 - TRIAL_REMINDER_DAYS_BEFORE_END);
  assert.equal(TRIAL_REMINDER_DAYS_BEFORE_END, 2);
});

test('trial dates cross month ends', () => {
  const { reminder, billing } = trialTimelineDates(new Date(2026, 9, 28), 7);
  assert.equal(billing.getMonth(), 10);
  assert.equal(billing.getDate(), 4);
  assert.equal(reminder.getDate(), 2);
});

test('trial dates read as a short month and day', () => {
  assert.equal(formatTrialDate(new Date(2026, 9, 22)), 'Oct 22');
});

test('trial length reads from the store label and falls back to seven days', () => {
  assert.equal(trialDaysFromLabel('3-day free trial'), 3);
  assert.equal(trialDaysFromLabel('1-day free trial'), 1);
  assert.equal(trialDaysFromLabel('7-day free trial'), 7);
  assert.equal(trialDaysFromLabel(null), 7);
  assert.equal(trialDaysFromLabel('free trial'), 7);
});

test('reminder choices exclude offsets on or before trial start', () => {
  assert.deepEqual(availableTrialReminderDays(7), [2, 3]);
  assert.deepEqual(availableTrialReminderDays(3), [2]);
  assert.deepEqual(availableTrialReminderDays(2), []);
  assert.deepEqual(availableTrialReminderDays(1), []);
});

test('a three-day reminder choice crosses the year boundary with the billing date', () => {
  const { reminder, billing } = trialTimelineDates(new Date(2026, 11, 27), 7, 3);
  assert.equal(billing.getFullYear(), 2027);
  assert.equal(billing.getMonth(), 0);
  assert.equal(billing.getDate(), 3);
  assert.equal(reminder.getFullYear(), 2026);
  assert.equal(reminder.getMonth(), 11);
  assert.equal(reminder.getDate(), 31);
});
