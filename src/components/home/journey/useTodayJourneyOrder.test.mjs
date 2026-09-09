import assert from 'node:assert/strict';
import test from 'node:test';
import { todayJourneyLoadState } from './useTodayJourneyOrder.ts';

const complete = {
  scheduleAvailable: true,
  scheduleError: false,
  goalsAvailable: true,
  goalsError: false,
  orderReady: true,
};

test('keeps cached content visible when a background refresh fails', () => {
  assert.equal(todayJourneyLoadState({
    ...complete,
    scheduleError: true,
    goalsError: true,
  }), 'ready');
});

test('shows an error when initial data is unavailable and its request fails', () => {
  assert.equal(todayJourneyLoadState({
    ...complete,
    goalsAvailable: false,
    goalsError: true,
  }), 'error');
  assert.equal(todayJourneyLoadState({
    ...complete,
    scheduleAvailable: false,
    scheduleError: true,
  }), 'error');
});

test('loads until all canonical inputs and the preference are ready', () => {
  assert.equal(todayJourneyLoadState({
    ...complete,
    orderReady: false,
  }), 'loading');
});
