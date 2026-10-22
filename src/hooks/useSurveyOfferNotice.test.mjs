import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useSurveyOfferNotice.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function createEnvironment({ isPro = true, forced = false } = {}) {
  const saved = { discount: false, feedback: false };
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
        if (name === 'react-native') return {
          Linking: { openURL: (url) => { calls.push(['url', url]); return Promise.resolve(); } },
        };
        if (name === '../stores/authStore') return {
          useAuthStore: (select) => select({ user: { id: 'user-1' } }),
        };
        if (name === '../queries/subscriptions/useUserEntitlementQuery') return {
          useUserEntitlementQuery: () => ({ data: { isPro, trialEndsAt: null }, isPending: false }),
        };
        if (name === '../queries/room/useCurrentRoomQuery') return {
          useCurrentRoomQuery: () => ({ data: { lastEarnedLocalDate: '2026-10-21' } }),
        };
        if (name === '../services/preferences/surveyOfferPreference') return {
          loadSurveyOfferDismissed: async (kind) => saved[kind],
          setSurveyOfferDismissed: async (kind) => {
            calls.push(['save', kind]);
            saved[kind] = true;
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
  assert.equal(environment.saved.discount, false);
});

test('opening the discount survey retires only that offer before opening its URL', async () => {
  const environment = createEnvironment({ isPro: false });
  const hook = await environment.mount();
  assert.equal(hook.render().visible, true);
  hook.render().open();
  assert.equal(hook.render().visible, false);
  assert.deepEqual(environment.calls[0], ['save', 'discount']);
  assert.equal(environment.calls[1][0], 'url');
  assert.match(environment.calls[1][1], /^https:\/\/docs\.google\.com\/forms\//);
  assert.equal(environment.saved.feedback, false);
  hook.unmount();
  const returnedHome = await environment.mount();
  assert.equal(returnedHome.render().visible, false);
  returnedHome.unmount();
});

test('closing an offer persists dismissal without opening feedback or a URL', async () => {
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
