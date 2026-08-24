import assert from 'node:assert/strict';
import test from 'node:test';
import {
  projectBreathHoldHomeStats,
  projectCompletedTechniqueId,
} from './completionCacheProjections.ts';

const partialErrors = {
  streak: false,
  todayBreathHold: false,
  todayHeartRate: false,
  stressHistory: false,
  dailyActivity: false,
};

function homeStats(dailyActivity = []) {
  return {
    streak: null,
    todayBreathHold: null,
    todayHeartRate: null,
    stressHistory: [],
    dailyActivity,
    completedDaysAgo: [],
    hrv: {
      avgBpm: null,
      rmssd: null,
      sdnn: null,
      pnn50: null,
      hrDrop: null,
      status: 'empty',
    },
    partialErrors,
  };
}

const completion = {
  sessionId: 'hold-1',
  startedAt: '2026-08-23T12:00:00.000Z',
  endedAt: '2026-08-23T12:01:00.000Z',
  localDate: '2026-08-23',
  timezone: 'America/Toronto',
  holdSeconds: 44.6,
  avgBpm: 61.8,
  minBpm: 19,
  maxBpm: 241,
};

test('guided projection unions an existing exact cache without seeding an absent list', () => {
  assert.equal(projectCompletedTechniqueId(undefined, 'box'), undefined);
  assert.deepEqual(projectCompletedTechniqueId(['box'], 'triangle'), [
    'box',
    'triangle',
  ]);

  const current = ['box'];
  assert.equal(projectCompletedTechniqueId(current, 'box'), current);
  assert.equal(projectCompletedTechniqueId(current, 'not-a-technique'), current);
});

test('breath-hold projection adds a missing date with canonical completion fields', () => {
  const projected = projectBreathHoldHomeStats(homeStats(), completion);

  assert.equal(projected.todayBreathHold.sessionId, 'hold-1');
  assert.equal(projected.todayBreathHold.holdSeconds, 45);
  assert.equal(projected.todayBreathHold.avgBpm, 62);
  assert.equal(projected.todayBreathHold.minBpm, null);
  assert.equal(projected.todayBreathHold.maxBpm, null);
  assert.deepEqual(projected.dailyActivity[0], {
    activityDate: '2026-08-23',
    timezone: 'America/Toronto',
    dailyBreathHoldCompleted: true,
    breathHoldCount: 1,
    bestHoldSeconds: 45,
    breathingSessionCount: 0,
    breathingSeconds: 0,
    heartRateCaptureCount: 0,
    qualifiesForStreak: true,
  });
});

test('breath-hold projection is idempotent for an existing activity counter', () => {
  const current = homeStats([
    {
      activityDate: '2026-08-23',
      timezone: 'UTC',
      dailyBreathHoldCompleted: false,
      breathHoldCount: 4,
      bestHoldSeconds: 50,
      breathingSessionCount: 2,
      breathingSeconds: 120,
      heartRateCaptureCount: 1,
      qualifiesForStreak: false,
    },
  ]);

  const once = projectBreathHoldHomeStats(current, completion);
  const twice = projectBreathHoldHomeStats(once, completion);

  assert.equal(once.dailyActivity[0].breathHoldCount, 4);
  assert.equal(twice.dailyActivity[0].breathHoldCount, 4);
  assert.equal(twice.dailyActivity[0].bestHoldSeconds, 50);
  assert.equal(twice.dailyActivity[0].dailyBreathHoldCompleted, true);
  assert.equal(twice.dailyActivity[0].qualifiesForStreak, true);
});

test('a delayed older breath hold cannot replace the latest cached session', () => {
  const current = homeStats();
  current.todayBreathHold = {
    sessionId: 'hold-newer',
    startedAt: '2026-08-23T13:00:00.000Z',
    endedAt: '2026-08-23T13:01:00.000Z',
    localDate: '2026-08-23',
    timezone: 'America/Toronto',
    holdSeconds: 60,
    avgBpm: 60,
    minBpm: 55,
    maxBpm: 65,
  };

  const projected = projectBreathHoldHomeStats(current, completion);

  assert.equal(projected.todayBreathHold, current.todayBreathHold);
  assert.equal(projected.dailyActivity[0].dailyBreathHoldCompleted, true);
});
