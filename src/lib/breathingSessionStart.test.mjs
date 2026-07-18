import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBreathingSessionStart } from './breathingSessionStart.ts';

const readyInput = {
  heartRatePreferenceLoaded: true,
  heartRateMonitoringEnabled: true,
  heartRateAccessLoading: false,
  heartRateAccessAllowed: true,
};

test('waits until the heart-rate preference is loaded', () => {
  assert.deepEqual(
    resolveBreathingSessionStart({
      ...readyInput,
      heartRatePreferenceLoaded: false,
    }),
    { type: 'not_ready', reason: 'preference_loading' },
  );
});

test('starts without heart rate when the user disabled monitoring', () => {
  assert.deepEqual(
    resolveBreathingSessionStart({
      ...readyInput,
      heartRateMonitoringEnabled: false,
    }),
    {
      type: 'start_without_heart_rate',
      disableHeartRatePreference: false,
    },
  );
});

test('does not wait for access when heart-rate monitoring is disabled', () => {
  assert.deepEqual(
    resolveBreathingSessionStart({
      ...readyInput,
      heartRateMonitoringEnabled: false,
      heartRateAccessLoading: true,
    }),
    {
      type: 'start_without_heart_rate',
      disableHeartRatePreference: false,
    },
  );
});

test('waits for feature access before starting enabled monitoring', () => {
  assert.deepEqual(
    resolveBreathingSessionStart({
      ...readyInput,
      heartRateAccessLoading: true,
    }),
    { type: 'not_ready', reason: 'access_loading' },
  );
});

test('starts placement when enabled heart-rate monitoring is allowed', () => {
  assert.deepEqual(
    resolveBreathingSessionStart(readyInput),
    { type: 'start_heart_rate_placement' },
  );
});

test('falls back to an exercise without heart rate when access is unavailable', () => {
  assert.deepEqual(
    resolveBreathingSessionStart({
      ...readyInput,
      heartRateAccessAllowed: false,
    }),
    {
      type: 'start_without_heart_rate',
      disableHeartRatePreference: true,
    },
  );
});
