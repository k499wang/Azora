import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, dependencies, globals = {}) {
  const compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, ...globals,
    require(name) {
      assert.ok(name in dependencies, `Unexpected import: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

function hooks() {
  const slots = [], effects = [];
  let cursor = 0, dirty = false, renderBody;
  const same = (a, b) => a?.length === b?.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], value => {
        const next = typeof value === 'function' ? value(slots[index]) : value;
        if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; }
      }];
    },
    useMemo(callback, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { deps, value: callback() };
      return slots[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(callback, deps) {
      const index = cursor++, previous = slots[index];
      if (same(previous?.deps, deps)) return;
      const record = { deps };
      slots[index] = record;
      effects.push(() => { previous?.cleanup?.(); record.cleanup = callback(); });
    },
  };
  return {
    react,
    render(body = renderBody) {
      renderBody = body;
      let result, attempts = 0;
      do {
        assert.ok(attempts++ < 30, 'render settles');
        dirty = false;
        cursor = 0;
        result = body();
        effects.splice(0).forEach(run => run());
      } while (dirty);
      return result;
    },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}


function reminderHarness({ preview = false, permission = 'granted' } = {}) {
  const engine = hooks(), writes = [], identities = [], prompts = [];
  let preference = { enabled: false, daysBeforeEnd: 2 }, user = { id: 'user' }, fail = false, resolvePermission;
  let permissionGate = null;
  const auth = selector => selector({ user });
  auth.getState = () => ({ user });
  const reminder = load('./usePaywallTrialReminder.ts', {
    react: engine.react,
    'react-native': { Linking: { openSettings: async () => {} } },
    '../stores/authStore': { useAuthStore: auth },
    '../queries/notifications/useNotificationPreferencesQuery': {
      useNotificationPreferencesQuery(id) { identities.push(id); return { data: { trialEndingReminder: preference }, isPending: false }; },
    },
    '../queries/notifications/useUpdateNotificationPreferencesMutation': {
      useUpdateNotificationPreferencesMutation: () => ({ isPending: false, async mutateAsync(input) {
        if (fail) throw new Error('offline');
        writes.push(input); preference = input.trialEndingReminder;
      } }),
    },
    '../services/notifications/notificationClient': {
      getNotificationPermissionStatus: async () => permissionGate ? permissionGate : permission,
      requestNotificationPermissions: async () => { prompts.push(true); return 'granted'; },
    },
    '../services/notifications/types': { DEFAULT_NOTIFICATION_PREFERENCES: { trialEndingReminder: { enabled: false, daysBeforeEnd: 2 } } },
    '../services/analytics/tracking': { trackNotificationPermissionResult() {} },
    '../lib/paywall/trialReminder': { TRIAL_REMINDER_DAYS_BEFORE_END: 2 },
  }).usePaywallTrialReminder;
  return {
    writes, identities, prompts,
    render: () => engine.render(() => reminder(preview)),
    fail: () => { fail = true; },
    deferPermission: () => { permissionGate = new Promise(resolve => { resolvePermission = resolve; }); },
    resolvePermission: () => resolvePermission('granted'),
    changeUser: () => { user = { id: 'other' }; },
    unmount: engine.unmount,
  };
}

test('choice enables reminder and preserves timing when switched off and on', async () => {
  const h = reminderHarness();
  await h.render().chooseDaysBeforeEnd(3);
  assert.equal(h.render().enabled, true);
  assert.equal(h.render().daysBeforeEnd, 3);
  await h.render().setEnabled(false);
  assert.equal(h.render().enabled, false);
  await h.render().setEnabled(true);
  assert.equal(h.render().daysBeforeEnd, 3);
  assert.deepEqual(h.writes.map(w => ({ ...w.trialEndingReminder })), [
    { enabled: true, daysBeforeEnd: 3 }, { enabled: false, daysBeforeEnd: 3 }, { enabled: true, daysBeforeEnd: 3 },
  ]);
});

test('preview shares local choice without a user query, write, or permission prompt', async () => {
  const h = reminderHarness({ preview: true, permission: 'undetermined' });
  await h.render().chooseDaysBeforeEnd(3);
  assert.equal(h.render().enabled, true);
  assert.equal(h.render().daysBeforeEnd, 3);
  assert.ok(h.identities.every(id => id === null));
  assert.deepEqual(h.writes, []);
  assert.deepEqual(h.prompts, []);
});

test('denial keeps reminder off and saving failure is surfaced without rejecting', async () => {
  const denied = reminderHarness({ permission: 'denied' });
  await denied.render().chooseDaysBeforeEnd(3);
  assert.equal(denied.render().enabled, false);
  assert.equal(denied.render().denied, true);
  const failed = reminderHarness();
  failed.fail();
  await failed.render().chooseDaysBeforeEnd(3);
  assert.equal(failed.render().enabled, false);
  assert.match(failed.render().error, /try again/);
});


test('a permission request cannot save after unmount or switching accounts', async () => {
  for (const leave of ['unmount', 'changeUser']) {
    const h = reminderHarness();
    h.render();
    await Promise.resolve();
    h.deferPermission();
    const first = h.render().chooseDaysBeforeEnd(3);
    const second = h.render().chooseDaysBeforeEnd(2);
    h[leave]();
    if (leave === 'changeUser') h.render();
    h.resolvePermission();
    await Promise.all([first, second]);
    assert.deepEqual(h.writes, []);
  }
});
