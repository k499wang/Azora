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


function reminderHarness({ preview = false, permission = 'granted', initialPreference = { enabled: false, daysBeforeEnd: 2 } } = {}) {
  const engine = hooks(), writes = [], identities = [], prompts = [];
  let preference = initialPreference, user = { id: 'user' }, fail = false, resolvePermission, resolvePrompt, resolvePersistence;
  let permissionGate = null, promptGate = null, persistenceGate = null;
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
        if (persistenceGate) await persistenceGate;
        if (fail) throw new Error('offline');
        writes.push(input); preference = input.trialEndingReminder;
      } }),
    },
    '../services/notifications/notificationClient': {
      getNotificationPermissionStatus: async () => permissionGate ? permissionGate : permission,
      requestNotificationPermissions: async () => { prompts.push(true); return promptGate ?? 'granted'; },
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
    resolvePermission: (status = 'granted') => resolvePermission(status),
    deferPrompt: () => { promptGate = new Promise(resolve => { resolvePrompt = resolve; }); },
    resolvePrompt: (status = 'granted') => resolvePrompt(status),
    deferPersistence: () => { persistenceGate = new Promise(resolve => { resolvePersistence = resolve; }); },
    resolvePersistence: () => resolvePersistence(),
    changeUser: () => { user = { id: 'other' }; },
    unmount: engine.unmount,
  };
}

test('choice enables reminder and preserves timing when switched off and on', async () => {
  const h = reminderHarness();
  await h.render().chooseDaysBeforeEnd(3);
  assert.equal(h.render().enabled, true);
  assert.equal(h.render().daysBeforeEnd, 3);
  assert.equal(h.render().selectedDaysBeforeEnd, 3);
  await h.render().setEnabled(false);
  assert.equal(h.render().enabled, false);
  assert.equal(h.render().selectedDaysBeforeEnd, null);
  await h.render().setEnabled(true);
  assert.equal(h.render().daysBeforeEnd, 3);
  assert.equal(h.render().selectedDaysBeforeEnd, 3);
  assert.deepEqual(h.writes.map(w => ({ ...w.trialEndingReminder })), [
    { enabled: true, daysBeforeEnd: 3 }, { enabled: false, daysBeforeEnd: 3 }, { enabled: true, daysBeforeEnd: 3 },
  ]);
});

test('preview shares local choice without a user query, write, or permission prompt', async () => {
  const h = reminderHarness({ preview: true, permission: 'undetermined' });
  assert.equal(h.render().selectedDaysBeforeEnd, null);
  await h.render().chooseDaysBeforeEnd(3);
  assert.equal(h.render().enabled, true);
  assert.equal(h.render().daysBeforeEnd, 3);
  assert.equal(h.render().selectedDaysBeforeEnd, 3);
  assert.ok(h.identities.every(id => id === null));
  assert.deepEqual(h.writes, []);
  assert.deepEqual(h.prompts, []);
});

test('denial keeps reminder off and saving failure is surfaced without rejecting', async () => {
  const denied = reminderHarness({ permission: 'denied' });
  await denied.render().chooseDaysBeforeEnd(3);
  assert.equal(denied.render().enabled, false);
  assert.equal(denied.render().selectedDaysBeforeEnd, null);
  assert.equal(denied.render().denied, true);
  const failed = reminderHarness();
  failed.fail();
  await failed.render().chooseDaysBeforeEnd(3);
  assert.equal(failed.render().enabled, false);
  assert.equal(failed.render().selectedDaysBeforeEnd, null);
  assert.match(failed.render().error, /try again/);
});

test('choice highlights immediately through permission and persistence before becoming enabled', async () => {
  const h = reminderHarness();
  assert.equal(h.render().selectedDaysBeforeEnd, null);
  await Promise.resolve();
  h.deferPermission();
  h.deferPersistence();
  const saving = h.render().chooseDaysBeforeEnd(3);
  assert.equal(h.render().selectedDaysBeforeEnd, 3);
  assert.equal(h.render().enabled, false);
  assert.equal(h.render().daysBeforeEnd, 2);
  assert.equal(h.render().busy, true);
  assert.equal(await h.render().chooseDaysBeforeEnd(2), false);
  h.resolvePermission();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(h.render().selectedDaysBeforeEnd, 3);
  assert.equal(h.render().enabled, false);
  assert.deepEqual(h.writes, []);
  h.resolvePersistence();
  assert.equal(await saving, true);
  assert.equal(h.render().selectedDaysBeforeEnd, 3);
  assert.equal(h.render().enabled, true);
  assert.equal(h.render().busy, false);
});

test('denial and persistence failure roll back an immediate choice', async () => {
  const denied = reminderHarness();
  denied.render();
  await Promise.resolve();
  denied.deferPermission();
  const deniedSave = denied.render().chooseDaysBeforeEnd(3);
  assert.equal(denied.render().selectedDaysBeforeEnd, 3);
  denied.resolvePermission('denied');
  assert.equal(await deniedSave, false);
  assert.equal(denied.render().selectedDaysBeforeEnd, null);
  assert.equal(denied.render().enabled, false);

  const failed = reminderHarness({ initialPreference: { enabled: true, daysBeforeEnd: 2 } });
  failed.render();
  await Promise.resolve();
  assert.equal(failed.render().selectedDaysBeforeEnd, 2);
  failed.deferPersistence();
  failed.fail();
  const failedSave = failed.render().chooseDaysBeforeEnd(3);
  assert.equal(failed.render().selectedDaysBeforeEnd, 3);
  failed.resolvePersistence();
  assert.equal(await failedSave, false);
  assert.equal(failed.render().selectedDaysBeforeEnd, 2);
  assert.equal(failed.render().enabled, true);
  assert.match(failed.render().error, /try again/);
});

test('the selection remains visible while the system permission prompt is open', async () => {
  const h = reminderHarness({ permission: 'undetermined' });
  h.render();
  await Promise.resolve();
  h.deferPrompt();
  const saving = h.render().chooseDaysBeforeEnd(3);
  await new Promise(setImmediate);
  assert.equal(h.prompts.length, 1);
  assert.equal(h.render().selectedDaysBeforeEnd, 3);
  assert.equal(h.render().enabled, false);
  assert.deepEqual(h.writes, []);
  h.resolvePrompt();
  assert.equal(await saving, true);
  assert.equal(h.render().selectedDaysBeforeEnd, 3);
  assert.equal(h.render().enabled, true);
});

test('switching off clears the visual choice while persistence is pending', async () => {
  const h = reminderHarness({ initialPreference: { enabled: true, daysBeforeEnd: 3 } });
  h.render();
  await Promise.resolve();
  assert.equal(h.render().selectedDaysBeforeEnd, 3);
  h.deferPersistence();
  const saving = h.render().setEnabled(false);
  assert.equal(h.render().selectedDaysBeforeEnd, null);
  assert.equal(h.render().enabled, true);
  h.resolvePersistence();
  assert.equal(await saving, true);
  assert.equal(h.render().selectedDaysBeforeEnd, null);
  assert.equal(h.render().enabled, false);
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
    if (leave === 'changeUser') {
      assert.equal(h.render().selectedDaysBeforeEnd, null);
      assert.equal(h.render().busy, false);
    }
    h.resolvePermission();
    await Promise.all([first, second]);
    assert.deepEqual(h.writes, []);
  }
});
