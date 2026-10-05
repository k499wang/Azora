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

function createWin({ date = '2026-10-04', activity = [], goals = [], checkIn = null, lessonComplete = false, homeKnown = true, partialError = false } = {}) {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name.endsWith('/useTodayLocalDate')) return { useTodayLocalDate: () => date };
      if (name.endsWith('/useTodayProgramDay')) return { useTodayProgramDay: () => ({ day: { lesson: { id: 'test' }, completedActivityIds: lessonComplete ? ['lesson:test'] : [] }, isLoading: false }) };
      if (name.endsWith('/useMoodCheckInQuery')) return { useMoodCheckInQuery: () => ({ isSuccess: true, data: { checkIn } }) };
      if (name.endsWith('/useSelfCareGoalsQuery')) return { useSelfCareGoalsQuery: () => ({ isSuccess: true, data: goals }) };
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

test('each qualifying action can be the first win on consecutive days, with no second popup that day', () => {
  const sources = [
    { goals: [{ completedToday: true }] },
    { checkIn: { id: 'check-in' } },
    { lessonComplete: true },
    { activity: [{ qualifiesForStreak: true, breathingSessionCount: 1 }] },
    { activity: [{ qualifiesForStreak: true, attentionSessionCount: 1 }] },
  ];
  for (const source of sources) {
    useFirstWinOfDayStore.setState({ claimedDay: null });
    for (const date of ['2026-10-04', '2026-10-05', '2026-10-06']) {
      const win = createWin({ date });
      assert.equal(win.claim(), true);
      useFirstWinOfDayStore.getState().show();
      assert.equal(useFirstWinOfDayStore.getState().showing, true);
      useFirstWinOfDayStore.getState().dismiss();
      assert.equal(win.claim(), false);
      // The server history also prevents another popup after an app restart.
      useFirstWinOfDayStore.setState({ claimedDay: null });
      const recorded = { ...source, date };
      if (source.activity) recorded.activity = source.activity.map((row) => ({ ...row, activityDate: date }));
      assert.equal(createWin(recorded).claim(), false);
    }
  }
});
