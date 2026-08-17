import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyCompleteSnapshot,
} from './useDailyCompleteSnapshot.ts';

function claim({
  guided = false,
  handPicked = false,
  breathHold = false,
  canClaim = false,
  claimedToday = false,
  isComplete = false,
  nextSlot = 'day1',
} = {}) {
  return {
    dailies: {
      todayLocalDate: '2026-08-11',
      guidedCompleted: guided,
      handPickedCompleted: handPicked,
      breathHoldCompleted: breathHold,
    },
    progress: {
      canClaim,
      claimedToday,
      isComplete,
      nextSlot,
    },
  };
}

test('captures third-daily unlock and its one-step progress origin', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({
      guided: true,
      handPicked: true,
      breathHold: true,
      canClaim: true,
      nextSlot: 'day4',
    }),
    null,
  );

  assert.deepEqual(snapshot.state, {
    done: 3,
    unlocked: true,
    showBar: true,
    nextSlot: 'day4',
  });
  assert.equal(snapshot.barFrom, 2 / 3);
  assert.equal(snapshot.rewardReady, true);
});

test('a repeated daily starts from the last progress the user saw', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ guided: true, handPicked: true }),
    2,
  );

  assert.equal(snapshot.state.done, 2);
  assert.equal(snapshot.barFrom, 2 / 3);
});

test('projects the just-finished daily without waiting for a refetch', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ guided: true, handPicked: true }),
    2,
    { breathHold: true },
  );

  assert.equal(snapshot.state.done, 3);
  assert.equal(snapshot.state.unlocked, true);
  assert.equal(snapshot.barFrom, 2 / 3);
  assert.equal(snapshot.rewardReady, false);
});

test('a projected repeat does not increment daily progress', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ guided: true, breathHold: true }),
    2,
    { guided: true },
  );

  assert.equal(snapshot.state.done, 2);
  assert.equal(snapshot.barFrom, 2 / 3);
});

test('one matching technique can complete both guided slots', () => {
  const snapshot = buildDailyCompleteSnapshot(
    claim({ breathHold: true }),
    1,
    { guided: true, handPicked: true },
  );

  assert.equal(snapshot.state.done, 3);
  assert.equal(snapshot.state.unlocked, true);
});

test('claimed and full rooms suppress the progress reward state', () => {
  const claimed = buildDailyCompleteSnapshot(
    claim({
      guided: true,
      handPicked: true,
      breathHold: true,
      claimedToday: true,
      nextSlot: 'day2',
    }),
    2,
  );
  const full = buildDailyCompleteSnapshot(
    claim({
      guided: true,
      handPicked: true,
      breathHold: true,
      isComplete: true,
      nextSlot: null,
    }),
    2,
  );

  assert.equal(claimed.state.unlocked, false);
  assert.equal(claimed.state.showBar, false);
  assert.equal(full.state.unlocked, false);
  assert.equal(full.state.showBar, false);
});
