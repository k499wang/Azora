import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { withTodaysSession } from '../../lib/weeklyProgress.ts';
import { shouldOfferStreakGoal } from './domain/routineFirstCompletion.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./FirstWinOfDayPresenter.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;

function mount() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  let userId = 'user-a';
  let profile;
  const writes = [];
  const soundRenders = [];
  const soundRequests = [];
  const store = { showing: true, heldForClose: false, dismiss() {} };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value) => { slots[index] = value; }];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (previous && deps.every((dep, i) => dep === previous.deps[i])) return;
      slots[index] = { deps };
      effects.push(() => {
        previous?.cleanup?.();
        slots[index].cleanup = effect();
      });
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react') return react;
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
      if (name.endsWith('/useProfileSummaryQuery')) return { useProfileSummaryQuery: () => ({ data: profile }) };
      if (name.endsWith('/authStore')) return { useAuthStore: (select) => select({ user: userId ? { id: userId } : null }) };
      if (name.endsWith('/weeklyProgress')) return { withTodaysSession };
      if (name.endsWith('/useCompletionSound')) return {
        useCompletionSound(kind, options) {
          soundRenders.push({ kind, active: options.active });
          return () => {
            if (!options.active) return false;
            soundRequests.push(kind);
            return true;
          };
        },
      };
      if (name.endsWith('/streakGoalPreference')) return {
        saveStreakGoal: async (id, days) => { writes.push([id, days]); },
      };
      if (name === './firstWinOfDayStore') return { useFirstWinOfDayStore: (select) => select(store) };
      if (name === './RoutineFirstCompletionModal') return { default() {} };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return {
    render(active = true) {
      cursor = 0;
      effects = [];
      const result = exports.default({ active });
      effects.forEach((run) => run());
      return result.props;
    },
    setProfile(value) { profile = value; },
    setUser(value) { userId = value; },
    store,
    writes,
    soundRenders,
    soundRequests,
  };
}

test('the queued popup waits for the profile, and offers no previous goal', () => {
  const presenter = mount();
  assert.equal(presenter.render().visible, false);
  presenter.setProfile({ currentStreak: 1, completedDaysAgo: [1] });
  const popup = presenter.render();
  assert.equal(popup.visible, true);
  assert.equal(popup.streakDays, 2);
  assert.equal('streakGoal' in popup, false);
  assert.equal(presenter.store.showing, true);
});

test('a committed goal is saved for the signed-in user', () => {
  const presenter = mount();
  presenter.setProfile({ currentStreak: 0, completedDaysAgo: [] });
  presenter.setUser('user-b');
  presenter.render().onCommitStreakGoal(7);
  presenter.setUser(null);
  presenter.render().onCommitStreakGoal(14);
  assert.deepEqual(presenter.writes, [['user-b', 7]]);
});

test('readiness does not bypass the closing-screen hold', () => {
  const presenter = mount();
  presenter.setProfile({ currentStreak: 2, completedDaysAgo: [0, 1] });
  presenter.store.heldForClose = true;
  presenter.render();
  assert.equal(presenter.render().visible, false);
  presenter.store.heldForClose = false;
  assert.equal(presenter.render().visible, true);
});

test('streak sound waits for the flame to light and follows popup visibility', () => {
  const presenter = mount();
  let popup = presenter.render();
  assert.equal(presenter.soundRenders.at(-1).active, false);
  assert.equal(popup.onIgnite(), false);
  presenter.setProfile({ currentStreak: 2, completedDaysAgo: [1, 2] });
  presenter.store.heldForClose = true;
  popup = presenter.render();
  assert.equal(presenter.soundRenders.at(-1).active, false);
  assert.equal(popup.onIgnite(), false);
  presenter.store.heldForClose = false;
  popup = presenter.render();
  assert.deepEqual(presenter.soundRenders.at(-1), { kind: 'streak', active: true });
  assert.deepEqual(presenter.soundRequests, []);
  popup.onIgnite();
  assert.deepEqual(presenter.soundRequests, ['streak']);
  presenter.render();
  assert.deepEqual(presenter.soundRequests, ['streak']);
  presenter.render(false);
  assert.equal(presenter.soundRenders.at(-1).active, false);
});

test('a later daily popup gets another flame-lighting sound request', () => {
  const presenter = mount();
  presenter.setProfile({ currentStreak: 2, completedDaysAgo: [0, 1] });
  presenter.render();
  presenter.render().onIgnite();
  presenter.store.showing = false;
  presenter.render();
  assert.equal(presenter.soundRenders.at(-1).active, false);
  presenter.store.showing = true;
  presenter.setProfile({ currentStreak: 3, completedDaysAgo: [0, 1, 2] });
  presenter.render().onIgnite();
  assert.deepEqual(presenter.soundRequests, ['streak', 'streak']);
});

test('days one, two, and three show the streak popup, with commitment offered only on day one', () => {
  const presenter = mount();
  presenter.render();
  for (let day = 1; day <= 3; day += 1) {
    presenter.store.showing = true;
    presenter.setProfile({ currentStreak: day - 1, completedDaysAgo: Array.from({ length: day - 1 }, (_, index) => index + 1) });
    const popup = presenter.render();
    assert.equal(popup.visible, true);
    assert.equal(popup.streakDays, day);
    assert.equal(shouldOfferStreakGoal(popup.streakDays), day === 1);
    // A refreshed profile already containing today must not add another day.
    presenter.setProfile({ currentStreak: day, completedDaysAgo: Array.from({ length: day }, (_, index) => index) });
    assert.equal(presenter.render().streakDays, day);
    presenter.store.showing = false;
    assert.equal(presenter.render().visible, false);
  }
});

test('a streak broken by a missed day asks for a commitment again', () => {
  const presenter = mount();
  presenter.render();
  // Each day as the profile reads just before that day's first win: the server
  // keeps a run alive through yesterday, then drops it once a day is missed.
  const days = [
    { day: 'Mon', before: { currentStreak: 0, completedDaysAgo: [] }, streak: 1 },
    { day: 'Tue', before: { currentStreak: 1, completedDaysAgo: [1] }, streak: 2 },
    { day: 'Thu', before: { currentStreak: 0, completedDaysAgo: [2, 3] }, streak: 1 },
  ];
  for (const { day, before, streak } of days) {
    presenter.store.showing = true;
    presenter.setProfile(before);
    const popup = presenter.render();
    assert.equal(popup.visible, true, day);
    assert.equal(popup.streakDays, streak, day);
    assert.equal(shouldOfferStreakGoal(popup.streakDays), streak === 1, day);
    if (day === 'Mon') popup.onCommitStreakGoal(14);
    presenter.store.showing = false;
    presenter.render();
  }
  assert.deepEqual(presenter.writes, [['user-a', 14]]);
});
