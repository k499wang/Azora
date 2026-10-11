import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { dailyReminderDefinitionsFor, DAILY_REMINDER_DEFINITIONS } from './notificationCatalog.ts';
import { ONBOARDING_NOTIFICATION_PREFERENCES } from './types.ts';
import { buildDesiredNotificationSchedule } from './notificationSchedulerCore.ts';
import { buildScheduledNotificationRecord, getObsoleteScheduledNotificationIds, isScheduledNotificationRecordCurrent } from './notificationScheduleRecords.ts';
import { allProgramPresets } from '../../features/program/domain/programCatalogue.ts';
import { buildProgramEnrollment } from '../../features/program/domain/programEnrollment.ts';

const schedule = {
  version: 1, timeMode: 'device_local',
  actions: { session: '21:45', handPicked: '14:30', windDown: '21:30' },
};
const preferences = {
  dailyPlanReminders: { session: { enabled: true }, handPicked: { enabled: true }, windDown: { enabled: true } },
  trialEndingReminder: { enabled: false },
};
const now = new Date(2026, 4, 16, 6);

test('every published plan day and no-plan fallback has one reminder regardless of zero to three resets', () => {
  const workloads = new Set();
  for (const preset of allProgramPresets()) {
    const result = buildProgramEnrollment({
      enrollmentId: `test-${preset.planId}`, planId: preset.planId,
      presetRevision: preset.revision, enrolledOn: '2026-05-16',
    });
    assert.equal(result.status, 'enrolled');
    const definitions = dailyReminderDefinitionsFor('focus', preset.planId);
    assert.deepEqual(ONBOARDING_NOTIFICATION_PREFERENCES.dailyPlanReminders, {
      session: { enabled: true }, handPicked: { enabled: false }, windDown: { enabled: false },
    });
    for (const day of result.enrollment.resolved.days) {
      workloads.add(day.activities.length);
      const entries = buildDesiredNotificationSchedule({
        preferences, dailyPlanSchedule: schedule, trialEndsAt: null, now,
      }, definitions);
      assert.equal(entries.length, 14, `${preset.planId} day ${day.day}`);
      assert.ok(entries.every((entry) => entry.data.reminder_action === 'session'));
    }
  }
  assert.deepEqual([...workloads].sort(), [0, 1, 2, 3]);
  assert.equal(buildDesiredNotificationSchedule({
    preferences, dailyPlanSchedule: schedule, trialEndsAt: null, now,
  }, dailyReminderDefinitionsFor('other')).length, 14);
});

test('repeating reconciliation retains session records and changing copy replaces content without adding prompts', () => {
  const input = { preferences, dailyPlanSchedule: schedule, trialEndsAt: null, now };
  const scheduled = buildDesiredNotificationSchedule(input, dailyReminderDefinitionsFor('focus', 'focus'));
  const records = Object.fromEntries(scheduled.map((entry, index) => [entry.stableId, buildScheduledNotificationRecord(entry, `native-${index}`)]));
  const unchanged = buildDesiredNotificationSchedule(input, dailyReminderDefinitionsFor('focus', 'focus'));
  assert.deepEqual(getObsoleteScheduledNotificationIds(records, unchanged), []);
  assert.ok(unchanged.every((entry) => isScheduledNotificationRecordCurrent(records[entry.stableId], entry)));
  const bedtime = buildDesiredNotificationSchedule(input, dailyReminderDefinitionsFor('focus', 'night'));
  assert.equal(bedtime.length, scheduled.length);
  assert.deepEqual(bedtime.map((entry) => entry.stableId), scheduled.map((entry) => entry.stableId));
  assert.ok(bedtime.every((entry) => !isScheduledNotificationRecordCurrent(records[entry.stableId], entry)));
});

test('night schedules only the saved main time and preserves the schedule', () => {
  const before = structuredClone(schedule);
  for (const { planId } of allProgramPresets().filter((preset) => preset.planId === 'night')) {
    const entries = buildDesiredNotificationSchedule({
      preferences, dailyPlanSchedule: schedule, trialEndsAt: null, now,
    }, dailyReminderDefinitionsFor('focus', planId));
    assert.equal(entries.length, 14);
    for (const entry of entries) {
      assert.equal(entry.data.reminder_action, 'session');
      assert.equal(entry.trigger.date.getHours(), 21);
      assert.equal(entry.trigger.date.getMinutes(), 45);
      assert.equal(entry.title, 'Your bedtime routine is ready');
      assert.match(entry.body, /before bed/);
      assert.doesNotMatch(entry.body, /morning|midday/i);
    }
  }
  assert.deepEqual(schedule, before);
});

test('enrollment overrides intent, while legacy sleep accounts also have one reminder', () => {
  assert.equal(dailyReminderDefinitionsFor('focus', 'night').length, 1);
  assert.equal(dailyReminderDefinitionsFor('sleep', 'phone').length, 1);
  assert.equal(dailyReminderDefinitionsFor('sleep', 'phone')[0].settings.title, 'Plan reminder');
  assert.equal(dailyReminderDefinitionsFor('sleep').length, 1);
  assert.equal(dailyReminderDefinitionsFor('focus').length, 1);
});

test('night onboarding enables only session and its settings and preview share bedtime copy', () => {
  const definitions = dailyReminderDefinitionsFor('sleep', 'night');
  assert.equal(definitions[0].settings.title, 'Bedtime routine');
  assert.equal(definitions[0].scheduleActionId, 'session');
  assert.deepEqual(ONBOARDING_NOTIFICATION_PREFERENCES.dailyPlanReminders, {
    session: { enabled: true }, handPicked: { enabled: false }, windDown: { enabled: false },
  });
  assert.equal(ONBOARDING_NOTIFICATION_PREFERENCES.dailyPlanReminders.handPicked.enabled, false);
});

test('reconciliation cancels legacy secondary reminders for every plan and no-plan fallback', () => {
  const input = { preferences, dailyPlanSchedule: schedule, trialEndsAt: null, now };
  const old = buildDesiredNotificationSchedule(input).flatMap((session) =>
    DAILY_REMINDER_DEFINITIONS.map((definition) => ({
      ...session, ...definition.content,
      stableId: session.stableId.replace(':session:', `:${definition.id}:`),
      kind: definition.kind,
      data: { notification_kind: definition.kind, reminder_action: definition.id },
    })),
  );
  const records = Object.fromEntries(old.map((entry, index) => [entry.stableId, buildScheduledNotificationRecord(entry, `native-${index}`)]));
  for (const planId of [...new Set(allProgramPresets().map((preset) => preset.planId)), null]) {
    const desired = buildDesiredNotificationSchedule(input, dailyReminderDefinitionsFor('focus', planId));
    const obsolete = getObsoleteScheduledNotificationIds(records, desired);
    assert.equal(obsolete.length, 28);
    assert.deepEqual(obsolete.sort(), old.filter((entry) => entry.data.reminder_action !== 'session').map((entry) => records[entry.stableId].notificationId).sort());
  }
});

test('turning the main reminder off cancels all daily reminders despite old secondary switches', () => {
  const definitions = dailyReminderDefinitionsFor('sleep', 'night');
  const input = { preferences, dailyPlanSchedule: schedule, trialEndsAt: null, now };
  const scheduled = buildDesiredNotificationSchedule(input, definitions);
  const records = Object.fromEntries(scheduled.map((entry, index) => [
    entry.stableId, buildScheduledNotificationRecord(entry, `native-${index}`),
  ]));
  const desired = buildDesiredNotificationSchedule({
    ...input,
    preferences: {
      ...preferences,
      dailyPlanReminders: { ...preferences.dailyPlanReminders, session: { enabled: false } },
    },
  }, definitions);

  assert.deepEqual(desired, []);
  assert.equal(getObsoleteScheduledNotificationIds(records, desired).length, scheduled.length);
});

function compile(url, dependencies) {
  const source = readFileSync(url, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports, console,
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      return { ...dependencies, default: name };
    },
  });
  return exports;
}

test('bootstrap schedules one generic reminder while metadata loads or fails and changes copy when night loads', async () => {
  let enrollmentQuery = { data: undefined, isPending: true };
  let preferencesQuery = { data: preferences };
  let scheduleQuery = { data: schedule };
  const calls = [];
  const dependencies = {
    useEffect: (effect) => effect(), useMemo: (fn) => fn(),
    useTodayLocalDate: () => '2026-05-16',
    useAuthStore: (selector) => selector({ status: 'signed_in', user: { id: 'user' } }),
    useNotificationPreferencesQuery: () => preferencesQuery,
    useDailyPlanScheduleQuery: () => scheduleQuery,
    useUserEntitlementQuery: () => ({ data: null }),
    useProgramEnrollmentQuery: () => enrollmentQuery,
    useSavedOnboardingProfileQuery: () => ({ data: undefined, isPending: true }),
    buildIntentTitleLookup: () => ({}), resolvePlanIntent: () => 'other',
    dailyReminderDefinitionsFor,
    reconcileScheduledNotifications: async (input) => { calls.push(input); },
    AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
  };
  const { useNotificationBootstrap } = compile(new URL('../../hooks/useNotificationBootstrap.ts', import.meta.url), dependencies);
  useNotificationBootstrap();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].dailyReminderDefinitions[0].settings.title, 'Plan reminder');
  enrollmentQuery = { data: undefined, isPending: false, isError: true };
  useNotificationBootstrap();
  assert.equal(calls.length, 2, 'failed metadata fetch still permits the main reminder');
  enrollmentQuery = { data: { planId: 'night' }, isPending: false };
  useNotificationBootstrap();
  assert.equal(calls.length, 3);
  assert.equal(calls[2].dailyReminderDefinitions[0].settings.title, 'Bedtime routine');
  enrollmentQuery = { data: null, isPending: false };
  useNotificationBootstrap();
  assert.equal(calls.length, 4, 'no-plan fallback also schedules while the profile loads');
  for (const input of calls) {
    assert.equal(input.dailyReminderDefinitions.length, 1);
    const entries = buildDesiredNotificationSchedule({ ...input, now }, input.dailyReminderDefinitions);
    assert.equal(entries.length, 14);
    assert.ok(entries.every((entry) => entry.data.reminder_action === 'session'));
  }
  preferencesQuery = { data: undefined, isError: true };
  useNotificationBootstrap();
  assert.equal(calls.length, 4, 'canonical preferences still must load');
  preferencesQuery = { data: preferences };
  scheduleQuery = { data: undefined, isError: true };
  useNotificationBootstrap();
  assert.equal(calls.length, 4, 'canonical schedule still must load');
});

test('night settings renders one saved main-time control and updates only its own preferences and time', async () => {
  let enrollment = { data: { planId: 'night' }, isPending: false };
  const updatedPreferences = [];
  const updatedSchedules = [];
  let preferencesRetries = 0;
  let scheduleRetries = 0;
  const query = (data) => ({ data, isFetching: false, refetch: async () => {} });
  let preferencesQuery = query(preferences);
  let scheduleQuery = query(schedule);
  const emptyTokens = new Proxy({}, { get: () => emptyTokens });
  const dependencies = {
    useState: () => ['granted', () => {}], useEffect: (fn) => fn(),
    useNotificationPreferencesQuery: () => ({ ...preferencesQuery, refetch: async () => { preferencesRetries++; } }),
    useDailyPlanScheduleQuery: () => ({ ...scheduleQuery, refetch: async () => { scheduleRetries++; } }),
    useProgramEnrollmentQuery: () => enrollment,
    useSavedOnboardingProfileQuery: () => query({ onboardingGoal: 'Focus' }),
    useUpdateNotificationPreferencesMutation: () => ({ mutateAsync: async (input) => { updatedPreferences.push(input); } }),
    useUpdateDailyPlanScheduleMutation: () => ({ mutateAsync: async (input) => { updatedSchedules.push(input); } }),
    getNotificationPermissionStatus: async () => 'granted',
    buildIntentTitleLookup: () => ({}), resolvePlanIntent: () => 'focus', dailyReminderDefinitionsFor,
    View: 'View', ScrollView: 'ScrollView', Pressable: 'Pressable', ActivityIndicator: 'ActivityIndicator',
    StyleSheet: { create: (styles) => styles }, colors: emptyTokens,
    typography: emptyTokens, spacing: {}, fonts: {},
  };
  const Settings = compile(new URL('../../features/notifications/NotificationsSettingsSheet.tsx', import.meta.url), dependencies).default;
  const input = { visible: true, userId: 'user', onClose() {} };
  const tree = Settings(input);
  const rows = tree.props.children.props.children[0];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].props.title, 'Bedtime routine');
  assert.equal(rows[0].props.time, '21:45');
  for (const planId of ['focus', 'pressure', null]) {
    enrollment = { data: planId == null ? null : { planId }, isPending: false };
    const genericRows = Settings(input).props.children.props.children[0];
    assert.equal(genericRows.length, 1);
    assert.equal(genericRows[0].props.title, 'Plan reminder');
    assert.equal(genericRows[0].props.time, '21:45');
  }
  await rows[0].props.onUpdate({ enabled: false });
  assert.equal(JSON.stringify(updatedPreferences), JSON.stringify([{ dailyPlanReminders: { session: { enabled: false } } }]));
  await rows[0].props.onTimeChange('22:15');
  assert.equal(JSON.stringify(updatedSchedules[0]), JSON.stringify({ ...schedule, actions: { ...schedule.actions, session: '22:15' } }));

  for (const metadata of [
    { data: undefined, isPending: true },
    { data: undefined, isPending: false, isError: true },
  ]) {
    enrollment = metadata;
    const fallbackRows = Settings(input).props.children.props.children[0];
    assert.equal(fallbackRows.length, 1);
    assert.equal(fallbackRows[0].props.title, 'Plan reminder');
  }
  for (const missing of ['preferences', 'schedule']) {
    preferencesQuery = missing === 'preferences' ? { data: undefined, isError: true } : query(preferences);
    scheduleQuery = missing === 'schedule' ? { data: undefined, isError: true } : query(schedule);
    const error = Settings(input).props.children;
    assert.equal(error.props.accessibilityRole, 'alert');
    const retry = error.props.children.find((child) => child.type === 'Pressable');
    retry.props.onPress();
  }
  assert.equal(preferencesRetries, 2);
  assert.equal(scheduleRetries, 2);
});

test('failed reminder, time and permission updates resolve with a retry alert and keep canonical values', async () => {
  let failure = 'preferences';
  let preferencesWrites = 0;
  let scheduleWrites = 0;
  let permissionRequests = 0;
  const alerts = [];
  const tokens = new Proxy({}, { get: () => tokens });
  const dependencies = {
    useState: () => [failure === 'permission' ? 'undetermined' : 'granted', () => {}],
    useEffect: (effect) => effect(),
    useNotificationPreferencesQuery: () => ({ data: preferences }),
    useDailyPlanScheduleQuery: () => ({ data: schedule }),
    useProgramEnrollmentQuery: () => ({ data: null }),
    useSavedOnboardingProfileQuery: () => ({ data: null }),
    useUpdateNotificationPreferencesMutation: () => ({ mutateAsync: async () => {
      preferencesWrites++;
      throw new Error('Preferences unavailable');
    } }),
    useUpdateDailyPlanScheduleMutation: () => ({ mutateAsync: async () => {
      scheduleWrites++;
      throw new Error('Schedule unavailable');
    } }),
    getNotificationPermissionStatus: async () => 'granted',
    requestNotificationPermissions: async () => {
      permissionRequests++;
      throw new Error('Permission request failed');
    },
    buildIntentTitleLookup: () => ({}), resolvePlanIntent: () => 'other', dailyReminderDefinitionsFor,
    View: 'View', ScrollView: 'ScrollView', Pressable: 'Pressable', ActivityIndicator: 'ActivityIndicator',
    Alert: { alert: (...args) => alerts.push(args) },
    StyleSheet: { create: (styles) => styles }, colors: tokens, typography: tokens, spacing: {}, fonts: {},
  };
  const Settings = compile(new URL('../../features/notifications/NotificationsSettingsSheet.tsx', import.meta.url), dependencies).default;
  const input = { visible: true, userId: 'user', onClose() {} };
  for (failure of ['preferences', 'schedule', 'permission']) {
    const row = Settings(input).props.children.props.children[0][0];
    if (failure === 'schedule') await row.props.onTimeChange('22:15');
    else await row.props.onUpdate({ enabled: failure === 'permission' });
    const latest = Settings(input).props.children.props.children[0][0];
    assert.equal(latest.props.reminder, preferences.dailyPlanReminders.session);
    assert.equal(latest.props.time, schedule.actions.session);
  }
  assert.deepEqual(alerts.map(([title, message]) => [title, message]), [
    ["Couldn't update reminder", 'Please try again.'],
    ["Couldn't update reminder time", 'Please try again.'],
    ["Couldn't update reminder", 'Please try again.'],
  ]);
  assert.equal(preferencesWrites, 1, 'permission failure never reaches the preference mutation');
  assert.equal(scheduleWrites, 1);
  assert.equal(permissionRequests, 1);
});
