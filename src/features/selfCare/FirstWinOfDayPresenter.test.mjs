import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { withTodaysSession } from '../../lib/weeklyProgress.ts';

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
  const goalReads = new Map();
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
        loadStreakGoal: (id) => new Promise((resolve) => goalReads.set(id, resolve)),
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
    async resolveGoal(id, days) { goalReads.get(id)(days); await Promise.resolve(); },
    store,
    writes,
    soundRenders,
    soundRequests,
  };
}

test('the queued popup waits for both profile and the user commitment read', async () => {
  const presenter = mount();
  assert.equal(presenter.render().visible, false);
  await presenter.resolveGoal('user-a', 14);
  assert.equal(presenter.render().visible, false);
  presenter.setProfile({ currentStreak: 1, completedDaysAgo: [1] });
  const popup = presenter.render();
  assert.equal(popup.visible, true);
  assert.equal(popup.streakDays, 2);
  assert.equal(popup.streakGoal, 14);
  assert.equal(presenter.store.showing, true);
});

test('switching users never exposes the prior user commitment', async () => {
  const presenter = mount();
  presenter.setProfile({ currentStreak: 1, completedDaysAgo: [0] });
  presenter.render();
  await presenter.resolveGoal('user-a', 30);
  assert.equal(presenter.render().streakGoal, 30);
  presenter.setUser('user-b');
  assert.equal(presenter.render().visible, false);
  await presenter.resolveGoal('user-b', null);
  const popup = presenter.render();
  assert.equal(popup.visible, true);
  assert.equal(popup.streakGoal, null);
  popup.onCommitStreakGoal(7);
  assert.deepEqual(presenter.writes, [['user-b', 7]]);
  assert.equal(presenter.render().streakGoal, 7);
});

test('a late read from the previous account cannot reveal the popup', async () => {
  const presenter = mount();
  presenter.setProfile({ currentStreak: 1, completedDaysAgo: [0] });
  presenter.render();
  presenter.setUser('user-b');
  presenter.render();
  await presenter.resolveGoal('user-a', 50);
  assert.equal(presenter.render().visible, false);
  await presenter.resolveGoal('user-b', 14);
  assert.equal(presenter.render().streakGoal, 14);
});

test('readiness does not bypass the closing-screen hold', async () => {
  const presenter = mount();
  presenter.setProfile({ currentStreak: 2, completedDaysAgo: [0, 1] });
  presenter.store.heldForClose = true;
  presenter.render();
  await presenter.resolveGoal('user-a', 7);
  assert.equal(presenter.render().visible, false);
  presenter.store.heldForClose = false;
  assert.equal(presenter.render().visible, true);
});

test('streak sound waits for the native show event and follows popup visibility', async () => {
  const presenter = mount();
  presenter.setProfile({ currentStreak: 2, completedDaysAgo: [1, 2] });
  let popup = presenter.render();
  assert.equal(presenter.soundRenders.at(-1).active, false);
  assert.equal(popup.onShow(), false);
  await presenter.resolveGoal('user-a', 14);
  presenter.store.heldForClose = true;
  popup = presenter.render();
  assert.equal(presenter.soundRenders.at(-1).active, false);
  assert.equal(popup.onShow(), false);
  presenter.store.heldForClose = false;
  popup = presenter.render();
  assert.deepEqual(presenter.soundRenders.at(-1), { kind: 'streak', active: true });
  assert.deepEqual(presenter.soundRequests, []);
  popup.onShow();
  assert.deepEqual(presenter.soundRequests, ['streak']);
  presenter.render();
  assert.deepEqual(presenter.soundRequests, ['streak']);
  presenter.render(false);
  assert.equal(presenter.soundRenders.at(-1).active, false);
});

test('a later daily popup gets another native-show sound request', async () => {
  const presenter = mount();
  presenter.setProfile({ currentStreak: 2, completedDaysAgo: [0, 1] });
  presenter.render();
  await presenter.resolveGoal('user-a', 7);
  presenter.render().onShow();
  presenter.store.showing = false;
  presenter.render();
  assert.equal(presenter.soundRenders.at(-1).active, false);
  presenter.store.showing = true;
  presenter.setProfile({ currentStreak: 3, completedDaysAgo: [0, 1, 2] });
  presenter.render().onShow();
  assert.deepEqual(presenter.soundRequests, ['streak', 'streak']);
});
