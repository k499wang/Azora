import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getHeartRateStatsCore,
  pickHrSource,
} from './heartRateStatsCore.ts';

const TODAY = '2026-06-20';
const NOW_MS = Date.parse('2026-06-20T16:00:00.000Z');

function makeSession({
  id,
  localDate = TODAY,
  startedAt = `${localDate}T12:00:00.000Z`,
  mode = 'full',
}) {
  return {
    sessionId: id,
    startedAt,
    endedAt: null,
    localDate,
    timezone: 'UTC',
    durationSeconds: mode === 'full' ? 90 : 25,
    avgBpm: 68,
    minBpm: 60,
    maxBpm: 78,
    rmssd: mode === 'full' ? 42 : null,
    sdnn: mode === 'full' ? 51 : null,
    pnn50: mode === 'full' ? 12 : null,
    hrDrop: mode === 'full' ? 8 : null,
    beatCount: mode === 'full' ? 95 : null,
    stress: mode === 'full' ? 34 : null,
    mode,
  };
}

test('pickHrSource prefers today, falls back seven days, then returns empty', () => {
  const today = makeSession({ id: 'today' });
  const twoDaysAgo = makeSession({ id: 'recent', localDate: '2026-06-18' });
  const sevenDaysAgo = makeSession({ id: 'boundary', localDate: '2026-06-13' });
  const eightDaysAgo = makeSession({ id: 'old', localDate: '2026-06-12' });

  assert.deepEqual(pickHrSource([today, twoDaysAgo], TODAY, NOW_MS), {
    kind: 'today_full',
    session: today,
    ageDays: 0,
  });
  assert.deepEqual(pickHrSource([twoDaysAgo], TODAY, NOW_MS), {
    kind: 'recent_full',
    session: twoDaysAgo,
    ageDays: 2,
  });
  assert.equal(
    pickHrSource([sevenDaysAgo], TODAY, NOW_MS).kind,
    'recent_full',
  );
  assert.equal(
    pickHrSource([eightDaysAgo], TODAY, NOW_MS).kind,
    'no_recent_full',
  );
});

test('getHeartRateStats loads BPM and IBI samples for the selected full session only', async () => {
  const quick = makeSession({ id: 'quick', mode: 'quick' });
  const full = makeSession({ id: 'full', localDate: '2026-06-19' });
  const ibiCalls = [];
  const bpmCalls = [];
  const dependencies = {
    getRecentHeartRateSummaries: async (_userId, limit) =>
      limit === 3 ? [quick, full] : [quick, full],
    getHeartRateIbiSeriesForSession: async (userId, sessionId) => {
      ibiCalls.push({ userId, sessionId });
      return [{ offsetMs: 900, ibiMs: 900, signalQuality: 1 }];
    },
    getHeartRateBpmSeriesForSession: async (userId, sessionId) => {
      bpmCalls.push({ userId, sessionId });
      return [
        { offsetMs: 900, bpm: 67, signalQuality: 1 },
        { offsetMs: 1800, bpm: 68, signalQuality: 1 },
      ];
    },
  };

  const result = await getHeartRateStatsCore('user-1', TODAY, dependencies);

  assert.equal(result.hrvSource.session?.sessionId, 'full');
  assert.equal(result.hrv.rmssd, full.rmssd);
  assert.deepEqual(bpmCalls, [{ userId: 'user-1', sessionId: 'full' }]);
  assert.deepEqual(ibiCalls, [{ userId: 'user-1', sessionId: 'full' }]);
  assert.deepEqual(result.bpmSeries.map((sample) => sample.bpm), [67, 68]);
  assert.equal(result.ibiSeries[0].ibiMs, 900);
});

test('getHeartRateStats rebuilds missing BPM samples with the result-screen conversion', async () => {
  const full = makeSession({ id: 'full' });
  const dependencies = {
    getRecentHeartRateSummaries: async () => [full],
    getHeartRateBpmSeriesForSession: async () => [],
    getHeartRateIbiSeriesForSession: async () => [
      { offsetMs: 900, ibiMs: 900, signalQuality: 1 },
      { offsetMs: 1800, ibiMs: 1000, signalQuality: 0.9 },
    ],
  };

  const result = await getHeartRateStatsCore('user-1', TODAY, dependencies);

  assert.deepEqual(result.bpmSeries, [
    { offsetMs: 900, bpm: 67, signalQuality: 1 },
    { offsetMs: 1800, bpm: 63, signalQuality: 0.9 },
  ]);
});

test('getHeartRateStats preserves available data and reports partial failures', async () => {
  const full = makeSession({ id: 'full' });
  const dependencies = {
    getRecentHeartRateSummaries: async (_userId, limit) => {
      if (limit === 3) throw new Error('recent list unavailable');
      return [full];
    },
    getHeartRateIbiSeriesForSession: async () => {
      throw new Error('IBI samples unavailable');
    },
    getHeartRateBpmSeriesForSession: async () => {
      throw new Error('BPM samples unavailable');
    },
  };

  const result = await getHeartRateStatsCore('user-1', TODAY, dependencies);

  assert.deepEqual(result.recent, []);
  assert.equal(result.hrvSource.session?.sessionId, 'full');
  assert.equal(result.hrv.rmssd, full.rmssd);
  assert.deepEqual(result.bpmSeries, []);
  assert.deepEqual(result.ibiSeries, []);
  assert.deepEqual(result.partialErrors, {
    recent: true,
    stressHistory: false,
    bpmSeries: true,
    ibiSeries: true,
  });
});

test('getHeartRateStats skips sample loading when history fails', async () => {
  let ibiCalled = false;
  let bpmCalled = false;
  const dependencies = {
    getRecentHeartRateSummaries: async (_userId, limit) => {
      if (limit === 15) throw new Error('history unavailable');
      return [makeSession({ id: 'quick', mode: 'quick' })];
    },
    getHeartRateIbiSeriesForSession: async () => {
      ibiCalled = true;
      return [];
    },
    getHeartRateBpmSeriesForSession: async () => {
      bpmCalled = true;
      return [];
    },
  };

  const result = await getHeartRateStatsCore('user-1', TODAY, dependencies);

  assert.equal(result.hrvSource.kind, 'no_recent_full');
  assert.equal(result.hrv.rmssd, null);
  assert.equal(bpmCalled, false);
  assert.equal(ibiCalled, false);
  assert.deepEqual(result.partialErrors, {
    recent: false,
    stressHistory: true,
    bpmSeries: false,
    ibiSeries: false,
  });
});
