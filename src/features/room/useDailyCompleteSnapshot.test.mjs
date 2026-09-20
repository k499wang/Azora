import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyCompleteSnapshot,
  isDailyCompleteRewardReady,
} from './useDailyCompleteSnapshot.ts';

/**
 * A day is a list of units now, not a fixed pair — the plan asks for one in
 * week one and three in its last. `units` names the techniques, because that is
 * what the just-finished session is matched against.
 */
function claim({
  units = ['relaxing', 'resonance'],
  done = [],
  earned = false,
  canClaim = false,
  claimedToday = false,
  isComplete = false,
  nextSlot = 'day1',
} = {}) {
  return {
    dailies: {
      todayLocalDate: '2026-08-11',
      units: units.map((techniqueId, index) => ({
        id: `unit-${index}`,
        title: techniqueId,
        techniqueId,
        completed: done.includes(techniqueId),
      })),
    },
    day: {
      allCompleted: earned,
    },
    progress: {
      canClaim,
      claimedToday,
      isComplete,
      nextSlot,
    },
  };
}

const BOTH = ['relaxing', 'resonance'];

test('captures last-daily unlock and its one-step progress origin', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ done: BOTH, canClaim: true, nextSlot: 'day4' }),
    null,
  );

  assert.deepEqual(snapshot.state, {
    done: 2,
    total: 2,
    unlocked: true,
    showBar: true,
    nextSlot: 'day4',
  });
  assert.equal(snapshot.barFrom, 1 / 2);
});

test('a repeated daily starts from the last progress the user saw', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ done: BOTH }),
    1,
  );

  assert.equal(snapshot.state.done, 2);
  assert.equal(snapshot.barFrom, 1 / 2);
});

test('projects the just-finished daily without waiting for a refetch', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ done: ['relaxing'] }),
    1,
    { techniqueId: 'resonance' },
  );

  assert.equal(snapshot.state.done, 2);
  assert.equal(snapshot.state.unlocked, true);
  assert.equal(snapshot.barFrom, 1 / 2);
});

test('a projected last daily becomes actionable when live entitlement catches up', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ done: ['relaxing'] }),
    1,
    { techniqueId: 'resonance' },
  );

  assert.equal(isDailyCompleteRewardReady(snapshot.state, false), false);
  assert.equal(isDailyCompleteRewardReady(snapshot.state, true), true);
});

test('a projected repeat does not increment daily progress', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ done: ['relaxing'] }),
    1,
    { techniqueId: 'relaxing' },
  );

  assert.equal(snapshot.state.done, 1);
  assert.equal(snapshot.barFrom, 1 / 2);
});

/**
 * A plan can schedule the same exercise twice in a day, at two hours. One
 * session proves both, the same way it always did when the two fixed slots
 * happened to resolve to one technique.
 */
test('one matching technique completes every unit it satisfies', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ units: ['relaxing', 'relaxing'] }),
    0,
    { techniqueId: 'relaxing' },
  );

  assert.equal(snapshot.state.done, 2);
  assert.equal(snapshot.state.unlocked, true);
});

test('a day of one unlocks on that one', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ units: ['relaxing'] }),
    0,
    { techniqueId: 'relaxing' },
  );

  assert.deepEqual(snapshot.state, {
    done: 1,
    total: 1,
    unlocked: true,
    showBar: true,
    nextSlot: 'day1',
  });
});

test('a day of three is not unlocked by two of them', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ units: ['relaxing', 'resonance', 'belly'], done: ['relaxing'] }),
    null,
    { techniqueId: 'resonance' },
  );

  assert.equal(snapshot.state.done, 2);
  assert.equal(snapshot.state.total, 3);
  assert.equal(snapshot.state.unlocked, false);
});

test('claimed and full rooms suppress the progress reward state', () => {
  const claimed = buildDailyCompleteSnapshot(
    claim({ done: BOTH, claimedToday: true, nextSlot: 'day2' }),
    2,
  );
  const full = buildDailyCompleteSnapshot(
    claim({ done: BOTH, isComplete: true, nextSlot: null }),
    2,
  );

  assert.equal(claimed.state.unlocked, false);
  assert.equal(claimed.state.showBar, false);
  assert.equal(full.state.unlocked, false);
  assert.equal(full.state.showBar, false);
});
