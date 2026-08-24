import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeProfileSummaryPartialResult } from '../profile/profileSummaryStructuralSharing.ts';
import { mergeHomeStatsPartialResult } from './homeStatsStructuralSharing.ts';
import { mergeHeartRateStatsPartialResult } from './heartRateStatsStructuralSharing.ts';

const homeErrors = {
  streak: false,
  todayBreathHold: false,
  todayHeartRate: false,
  stressHistory: false,
  dailyActivity: false,
};

function home(overrides = {}) {
  return {
    streak: { currentStreak: 4, longestStreak: 7, lastQualifiedDate: '2026-08-23' },
    todayBreathHold: { sessionId: 'hold-1' },
    todayHeartRate: { sessionId: 'hr-1' },
    stressHistory: [{ stress: 20, localDate: '2026-08-23' }],
    dailyActivity: [{ activityDate: '2026-08-23' }],
    completedDaysAgo: [0],
    hrv: { avgBpm: 60 },
    partialErrors: homeErrors,
    ...overrides,
  };
}

const profileErrors = {
  profile: false,
  longestHold: false,
  breathHoldCount: false,
  lifetimeTotals: false,
  activeDays: false,
  streak: false,
  completedDays: false,
  breathHoldTrend: false,
};

function profile(overrides = {}) {
  return {
    profile: { displayName: 'A', avatarUrl: null, timezone: 'UTC' },
    longestHoldSeconds: 50,
    breathHoldCount: 3,
    totalSessions: 8,
    totalBreaths: 42,
    totalHoldSeconds: 120,
    activeDays: 5,
    currentStreak: 4,
    longestStreak: 7,
    completedDays: [23],
    completedDaysAgo: [0],
    breathHoldTrend: [{ label: '23', value: 50 }],
    partialErrors: profileErrors,
    ...overrides,
  };
}

test('Home merge preserves failed slices and accepts successful slices', () => {
  const previous = home();
  const incoming = home({
    streak: { currentStreak: 5, longestStreak: 7, lastQualifiedDate: '2026-08-24' },
    todayBreathHold: null,
    dailyActivity: [],
    completedDaysAgo: [],
    partialErrors: {
      ...homeErrors,
      todayBreathHold: true,
      dailyActivity: true,
    },
  });
  const merged = mergeHomeStatsPartialResult(previous, incoming);

  assert.equal(merged.streak.currentStreak, 5);
  assert.equal(merged.todayBreathHold, previous.todayBreathHold);
  assert.equal(merged.dailyActivity, previous.dailyActivity);
  assert.equal(merged.completedDaysAgo, previous.completedDaysAgo);
  assert.equal(merged.partialErrors.dailyActivity, true);
});

test('profile merge preserves each failed aggregate group', () => {
  const previous = profile();
  const incoming = profile({
    profile: null,
    longestHoldSeconds: null,
    breathHoldCount: 0,
    totalSessions: 0,
    totalBreaths: 0,
    totalHoldSeconds: 0,
    activeDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    completedDays: [],
    completedDaysAgo: [],
    breathHoldTrend: [],
    partialErrors: Object.fromEntries(
      Object.keys(profileErrors).map((key) => [key, true]),
    ),
  });
  const merged = mergeProfileSummaryPartialResult(previous, incoming);

  assert.equal(merged.profile, previous.profile);
  assert.equal(merged.longestHoldSeconds, 50);
  assert.equal(merged.breathHoldCount, 3);
  assert.equal(merged.totalSessions, 8);
  assert.equal(merged.totalBreaths, 42);
  assert.equal(merged.totalHoldSeconds, 120);
  assert.equal(merged.activeDays, 5);
  assert.equal(merged.currentStreak, 4);
  assert.equal(merged.longestStreak, 7);
  assert.equal(merged.completedDays, previous.completedDays);
  assert.equal(merged.completedDaysAgo, previous.completedDaysAgo);
  assert.equal(merged.breathHoldTrend, previous.breathHoldTrend);
});

function heartStats(sessionId, overrides = {}) {
  const session = sessionId == null
    ? null
    : { sessionId, localDate: '2026-08-24', mode: 'full' };

  return {
    hrvSource: session == null
      ? { kind: 'no_recent_full', session: null, ageDays: 7 }
      : { kind: 'today_full', session, ageDays: 0 },
    recent: session == null ? [] : [session],
    stressHistory: session == null ? [] : [{ stress: 20 }],
    bpmSeries: session == null ? [] : [{ offsetMs: 0, bpm: 60 }],
    ibiSeries: session == null ? [] : [{ offsetMs: 0, ibiMs: 1000 }],
    hrv: { avgBpm: session == null ? null : 60 },
    partialErrors: {
      recent: false,
      stressHistory: false,
      bpmSeries: false,
      ibiSeries: false,
    },
    ...overrides,
  };
}

test('Heart merge preserves the last source when history aggregation fails', () => {
  const previous = heartStats('hr-1');
  const incoming = heartStats(null, {
    partialErrors: {
      recent: false,
      stressHistory: true,
      bpmSeries: false,
      ibiSeries: false,
    },
  });
  const merged = mergeHeartRateStatsPartialResult(previous, incoming);

  assert.equal(merged.hrvSource, previous.hrvSource);
  assert.equal(merged.stressHistory, previous.stressHistory);
  assert.equal(merged.hrv, previous.hrv);
  assert.equal(merged.bpmSeries, previous.bpmSeries);
  assert.equal(merged.ibiSeries, previous.ibiSeries);
});

test('Heart merge never reuses series from a different canonical source', () => {
  const previous = heartStats('hr-1');
  const incoming = heartStats('hr-2', {
    bpmSeries: [],
    ibiSeries: [],
    partialErrors: {
      recent: false,
      stressHistory: false,
      bpmSeries: true,
      ibiSeries: true,
    },
  });
  const merged = mergeHeartRateStatsPartialResult(previous, incoming);

  assert.equal(merged.hrvSource.session.sessionId, 'hr-2');
  assert.deepEqual(merged.bpmSeries, []);
  assert.deepEqual(merged.ibiSeries, []);
});
