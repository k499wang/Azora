import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { useFirstWinOfDayStore } from './firstWinOfDayStore.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useFirstWinOfDay.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function createWin({ date = '2026-10-04', activity = [], homeKnown = true, partialError = false } = {}) {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name.endsWith('/useTodayLocalDate')) return { useTodayLocalDate: () => date };
      if (name.endsWith('/useTodayProgramDay')) return { useTodayProgramDay: () => ({ day: null, isLoading: false }) };
      if (name.endsWith('/useMoodCheckInQuery')) return { useMoodCheckInQuery: () => ({ isSuccess: true, data: { checkIn: null } }) };
      if (name.endsWith('/useSelfCareGoalsQuery')) return { useSelfCareGoalsQuery: () => ({ isSuccess: true, data: [] }) };
      if (name.endsWith('/useHomeStatsQuery')) return { useHomeStatsQuery: () => ({ isSuccess: homeKnown, data: { dailyActivity: activity, partialErrors: { dailyActivity: partialError } } }) };
      if (name.endsWith('/lessonActivity')) return { lessonActivityId: (id) => `lesson:${id}` };
      if (name === './firstWinOfDayStore') return { useFirstWinOfDayStore };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports.useFirstWinOfDay('exercise-user');
}

test.beforeEach(() => {
  useFirstWinOfDayStore.setState({ claimedDay: null, showing: false, heldForClose: false, forced: false });
});

test('today’s qualifying exercise prevents another first-win claim', () => {
  for (const evidence of [{ breathingSessionCount: 1 }, { dailyBreathHoldCompleted: true }]) {
    const win = createWin({ activity: [{ activityDate: '2026-10-04', qualifiesForStreak: true, ...evidence }] });
    assert.equal(win.claim(), false);
  }
});

test('yesterday’s qualifying exercise does not consume the new day', () => {
  const win = createWin({ activity: [{ activityDate: '2026-10-03', qualifiesForStreak: true }] });
  assert.equal(win.claim(), true);
  assert.equal(win.claim(), false);
  const nextDay = createWin({ date: '2026-10-05' });
  assert.equal(nextDay.claim(), true);
});

test('missing or partial exercise history cannot claim an unknown first win', () => {
  assert.equal(createWin({ homeKnown: false }).claim(), false);
  assert.equal(createWin({ partialError: true }).claim(), false);
});

test('a failed exercise write withdraws its held popup and releases the claim', () => {
  const win = createWin();
  assert.equal(win.claim(), true);
  useFirstWinOfDayStore.getState().show({ heldForClose: true });
  win.withdraw();
  assert.equal(useFirstWinOfDayStore.getState().showing, false);
  assert.equal(useFirstWinOfDayStore.getState().heldForClose, false);
  assert.equal(win.claim(), true);
});
