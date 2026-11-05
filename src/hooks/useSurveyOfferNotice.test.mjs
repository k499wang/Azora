import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { recordCoachingOfferVisit } from '../features/coaching/domain/coachingOfferVisits.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useSurveyOfferNotice.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

const TODAY = '2026-11-05';

function createEnvironment({
  forced = false,
  visits = { lastLocalDate: '2026-11-04', daysVisited: 1, dismissed: false },
} = {}) {
  const saved = { feedback: false };
  const calls = [];

  async function mount(onOpenFeedback = () => calls.push('feedback')) {
    const states = [];
    const cleanups = [];
    let index = 0;
    let mounted = false;
    const exports = {};
    vm.runInNewContext(compiled, {
      exports,
      require(name) {
        if (name === 'react') return {
          useState(initial) {
            const slot = index++;
            if (!(slot in states)) states[slot] = initial;
            return [states[slot], (value) => {
              states[slot] = typeof value === 'function' ? value(states[slot]) : value;
            }];
          },
          useCallback: (callback) => callback,
          useEffect(effect) {
            if (!mounted) cleanups.push(effect());
          },
        };
        if (name === '../stores/authStore') return {
          useAuthStore: (select) => select({ user: { id: 'user-1' } }),
        };
        if (name === './useTodayLocalDate') return { useTodayLocalDate: () => TODAY };
        if (name === '../services/preferences/coachingOfferPreference') return {
          loadCoachingOfferVisits: async () => visits,
        };
        if (name === '../features/coaching/domain/coachingOfferVisits') return {
          recordCoachingOfferVisit,
        };
        if (name === '../services/preferences/surveyOfferPreference') return {
          loadSurveyOfferDismissed: async () => saved.feedback,
          setSurveyOfferDismissed: async () => {
            calls.push(['save', 'feedback']);
            saved.feedback = true;
          },
        };
        if (name === './devSurveyOfferOverride') return {
          useSurveyOfferForced: () => forced,
          setSurveyOfferForced: (value) => { forced = value; },
        };
        throw new Error(`Unexpected module: ${name}`);
      },
    });
    const hook = {
      render() {
        index = 0;
        const state = exports.useSurveyOfferNotice(onOpenFeedback);
        mounted = true;
        return state;
      },
      unmount: () => cleanups.forEach((cleanup) => cleanup?.()),
    };
    hook.render();
    await new Promise((resolve) => setImmediate(resolve));
    return hook;
  }

  return { calls, saved, mount };
}

test('opening feedback retires the offer before navigation unmounts the notice', async () => {
  const environment = createEnvironment({ forced: true });
  const hook = await environment.mount(() => {
    assert.equal(hook.render().visible, false);
    assert.equal(environment.saved.feedback, true);
    environment.calls.push('feedback');
    hook.unmount();
  });
  assert.equal(hook.render().visible, true);
  hook.render().open();
  assert.deepEqual(environment.calls, [['save', 'feedback'], 'feedback']);

  // Returning Home must not depend on an animation completion callback.
  for (let cycle = 0; cycle < 10; cycle++) {
    const returnedHome = await environment.mount();
    assert.equal(returnedHome.render().visible, false);
    returnedHome.unmount();
  }
});

test('closing an offer persists dismissal without opening feedback', async () => {
  const environment = createEnvironment();
  const hook = await environment.mount();
  hook.render().dismiss();
  assert.equal(hook.render().visible, false);
  assert.deepEqual(environment.calls, [['save', 'feedback']]);
  hook.unmount();
  const returnedHome = await environment.mount();
  assert.equal(returnedHome.render().visible, false);
  returnedHome.unmount();
});

test('preempting an offer only hides it for the current Home instance', async () => {
  const environment = createEnvironment();
  const hook = await environment.mount();
  hook.render().preempt();
  assert.equal(hook.render().visible, false);
  assert.deepEqual(environment.calls, []);
  hook.unmount();
  const returnedHome = await environment.mount();
  assert.equal(returnedHome.render().visible, true);
  returnedHome.unmount();
});

test('the form is not offered on the first day with the app', async () => {
  for (const visits of [null, { lastLocalDate: TODAY, daysVisited: 1, dismissed: false }]) {
    const hook = await createEnvironment({ visits }).mount();
    assert.equal(hook.render().visible, false);
    hook.unmount();
  }
});

test('the form is offered from the second day, even before that visit is saved', async () => {
  for (const visits of [
    { lastLocalDate: '2026-11-01', daysVisited: 1, dismissed: false },
    { lastLocalDate: TODAY, daysVisited: 2, dismissed: false },
  ]) {
    const hook = await createEnvironment({ visits }).mount();
    assert.equal(hook.render().visible, true);
    hook.unmount();
  }
});
