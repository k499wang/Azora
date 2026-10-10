import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as catalogue from '../../features/program/domain/programCatalogue.ts';
import * as enrollmentDomain from '../../features/program/domain/programEnrollment.ts';
import * as todoDomain from '../../features/program/domain/programTodoStep.ts';
import * as scheduleDomain from '../../features/program/domain/programSchedule.ts';
import { pathDayDetail } from '../../features/plan/domain/planPath.ts';
import { programPlanPreviewRows } from '../../features/program/domain/programPlanPreview.ts';
import { lessonForDay } from '../../features/lessons/domain/lessonCatalogue.ts';
import { pressureLessonTrackForIntent } from '../../features/lessons/domain/pressureLessonTrack.ts';
import { onboardingPresetFor, planFirstDayLine } from '../../lib/onboardingPreset.ts';
import { INTENT_OPTIONS } from './data/intentOptions.ts';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const parse = (path) => ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function find(source, predicate) {
  let found;
  function visit(node) {
    if (predicate(node)) found = node;
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(found, `Expected production flow node in ${source.fileName}`);
  return found;
}

// Exercise the input wired by the actual onboarding save handler rather than
// enrolling a hand-picked catalogue revision that onboarding might never use.
const onboarding = parse('./OnboardingFlow.tsx');
const startCall = find(onboarding, (node) => ts.isCallExpression(node)
  && node.expression.getText(onboarding) === 'startProgramEnrollment');
const home = parse('../../screens/HomeScreen.tsx');
const homeRows = find(home, (node) => ts.isVariableDeclaration(node)
  && node.name.getText(home) === 'dailyRows');
const rowsSource = parse('../home/TodaysDailiesSection.tsx');
const buildRows = find(rowsSource, (node) => ts.isFunctionDeclaration(node)
  && node.name?.text === 'buildProgramDailyRows');
const pathSource = parse('../../features/plan/PlanPath.tsx');
const pathFunctions = ['detailForDay', 'dayExercises'].map((name) =>
  find(pathSource, (node) => ts.isFunctionDeclaration(node) && node.name?.text === name).getText(pathSource));
const planBubble = vm.runInNewContext(compile(`${pathFunctions.join('\n')}\ndetailForDay;`), {
  ...catalogue, pathDayDetail,
  programDayLesson: enrollmentDomain.programDayLesson,
  programDayAsksForTodo: todoDomain.programDayAsksForTodo,
});
const plain = (value) => JSON.parse(JSON.stringify(value));
const localDate = '2026-10-11';

function serviceHarness(existing = null, adoptionFailures = []) {
  let stored = existing == null ? null : plain(existing);
  const rpcCalls = [];
  const client = {
    from(table) {
      assert.equal(table, 'program_enrollments');
      const query = {
        insert(payload) {
          assert.equal(stored, null, 'A new account has no prior enrollment');
          stored = plain({ ...payload, id: 'onboarding-enrollment', status: 'active',
            program_day: 1, last_advanced_on: null, todo_step_from_day: null });
          return this;
        },
        select() { return this; },
        eq(key, value) { assert.equal(stored[key], value); return this; },
        in(key, values) { assert.ok(values.includes(stored[key])); return this; },
        order() { return this; },
        limit() { return this; },
        async single() { return { data: plain(stored), error: null }; },
        async maybeSingle() { return { data: plain(stored), error: null }; },
      };
      return query;
    },
    async rpc(name) {
      assert.equal(name, 'adopt_plan_todo_step_compatible');
      rpcCalls.push(name);
      const failure = adoptionFailures.shift();
      if (failure instanceof Error) throw failure;
      if (failure != null) return { data: null, error: failure };
      assert.equal(stored.status, 'active', 'Completed plans must never adopt');
      stored.todo_step_from_day ??= stored.program_day;
      return { data: plain(stored), error: null };
    },
  };
  const exports = {};
  vm.runInNewContext(compile(read('../../services/program/programEnrollmentService.ts')), {
    exports,
    require(name) {
      if (name === '../supabase') return { requireSupabaseClient: () => client };
      if (name.endsWith('/programCatalogue')) return catalogue;
      if (name.endsWith('/programEnrollment')) return enrollmentDomain;
      if (name.endsWith('/programTodoStep')) return todoDomain;
      if (name.endsWith('/pathGold')) return {};
      throw new Error(`Unexpected service dependency: ${name}`);
    },
  });
  return { service: exports, stored: () => stored, rpcCalls };
}

function homeDay(enrollment, { date = localDate, completions = [], existingExercises = false } = {}) {
  const exports = {};
  vm.runInNewContext(compile(read('../../hooks/useTodayProgramDay.ts')), {
    exports,
    require(name) {
      if (name.endsWith('/programCatalogue')) return catalogue;
      if (name.endsWith('/programEnrollment')) return enrollmentDomain;
      if (name.endsWith('/programTodoStep')) return todoDomain;
      if (name.endsWith('/programSchedule')) return scheduleDomain;
      if (name.endsWith('/techniques')) return { getTechnique: (id) => {
        if (!existingExercises) throw new Error('Day 1 must not resolve a breathing exercise');
        return { id };
      } };
      if (name === './useTodayLocalDate') return { useTodayLocalDate: () => date };
      if (name.endsWith('/useProgramEnrollmentQuery')) return { useProgramEnrollmentQuery: () => ({ data: enrollment, isPending: false }) };
      if (name.endsWith('/useProgramDayCompletionsQuery')) return { useProgramDayCompletionsQuery: () => ({ data: completions, isPending: false }) };
      throw new Error(`Unexpected Home day dependency: ${name}`);
    },
  });
  return exports.useTodayProgramDay('new-user');
}

const choices = [
  ...[...new Set([
    ...INTENT_OPTIONS.map(({ id }) => id),
    'self_acceptance', 'self_care', 'spiritual', 'yoga', 'heart_health', 'other',
  ])].map((intent) => ({ intent })),
  { intent: 'focus', followUpAnswers: { when_focus: ['phone'] } },
  { intent: 'sleep', followUpAnswers: { when_sleep: ['phone'] } },
  { intent: 'sleep', sleepCause: 'phone' },
  { intent: 'energy', followUpAnswers: { when_energy: ['constant'] } },
];

for (const choice of choices) {
  test(`actual onboarding saves a light first day through reload, Home and preview: ${JSON.stringify(choice)}`, async () => {
    const input = vm.runInNewContext(compile(`const input = ${startCall.arguments[0].getText(onboarding)}; input;`), {
      userId: 'new-user', plan: { intent: choice.intent },
      intentFollowUpAnswers: choice.followUpAnswers ?? {}, sleepCause: choice.sleepCause ?? null,
      onboardingPresetFor, pressureLessonTrackForIntent, formatLocalDate: () => localDate,
    });
    const { service, stored } = serviceHarness();
    const started = await service.startProgramEnrollment(input);
    assert.ok(started);
    assert.equal(stored().plan_id, onboardingPresetFor(choice.intent, choice).id);
    assert.equal(stored().resolved.days[0].activities.length, 0, 'Stored first day has no Reset');
    assert.equal(stored().resolved.days[1].activities.length, 1, 'Day 2 starts the exercise schedule');
    assert.ok(stored().resolved.days[0].lessonActivityId);
    const saved = plain(stored());
    const reloaded = await service.getCurrentProgramEnrollment('new-user');
    assert.deepEqual(plain(reloaded), plain(started));
    assert.deepEqual(stored(), saved, 'Reload does not rewrite the enrollment snapshot');
    const { day, isLoading } = homeDay(reloaded);
    assert.equal(isLoading, false);
    assert.ok(day, 'A light day remains a plan day, so Home does not fall back to legacy Resets');
    assert.equal(day.programDay, 1);
    assert.equal(day.resolvedActivityCount, 0);
    assert.equal(day.activities.length, 0);
    assert.ok(day.lesson);
    const exports = {};
    vm.runInNewContext(compile(buildRows.getText(rowsSource)), { exports });
    const drawn = vm.runInNewContext(compile(`const rows = ${homeRows.initializer.getText(home)}; rows;`), {
      dailyPlanSchedule: { actions: {} }, programDayLoading: false, programDay: day,
      buildProgramDailyRows: exports.buildProgramDailyRows, accessAllowed: true,
      startProgramActivity: () => { throw new Error('Day 1 has no exercise to start'); },
      buildDailyRows: () => { throw new Error('Home must retain the empty plan day'); },
    });
    assert.deepEqual(Object.keys(drawn), []);
    assert.equal(programPlanPreviewRows(reloaded.planId).length, 0);
    assert.match(planFirstDayLine(reloaded.planId), /Your first guided exercise is on day 2/);

    stored().program_day = 2;
    const dayTwoEnrollment = await service.getCurrentProgramEnrollment('new-user');
    const dayTwo = homeDay(dayTwoEnrollment, { existingExercises: true }).day;
    assert.ok(dayTwo);
    assert.equal(dayTwo.programDay, 2);
    assert.equal(dayTwo.resolvedActivityCount, 1, 'Day 2 retains one stored Reset after reload');
    assert.equal(dayTwo.activities.length, 1, 'Home exposes the day 2 Reset for every onboarding choice');
    assert.equal(dayTwo.activities[0].activityId, stored().resolved.days[1].activities[0].activityId);
    assert.deepEqual(stored().resolved, saved.resolved, 'Advancing to day 2 preserves the snapshot');
  });
}

test('new enrollments persist the varied schedule and Home reloads every zero-, one- and two-Reset day', async () => {
  const planIds = new Set(catalogue.allProgramPresets().map((preset) => preset.planId));
  const variants = [...planIds].flatMap((planId) => (planId === 'pressure' ? ['stress', 'overthinking', 'anger'] : [undefined])
    .map((pressureLessonTrack) => ({ planId, pressureLessonTrack })));
  for (const { planId, pressureLessonTrack } of variants) {
    const { service, stored } = serviceHarness();
    const started = await service.startProgramEnrollment({ userId: 'new-user', planId, pressureLessonTrack, enrolledOn: localDate });
    const preset = catalogue.latestProgramPreset(planId);
    assert.equal(started.presetRevision, preset.revision);
    const snapshot = plain(stored().resolved);
    assert.deepEqual(snapshot.days.map((day) => day.activities.map(({ activityId }) => activityId)),
      preset.days.map((day) => [...day.activityIds]), planId);
    assert.deepEqual(snapshot.days.map((day) => day.lessonActivityId),
      preset.days.map((day) => `lesson:${lessonForDay(planId, day.day, preset.revision, pressureLessonTrack).id}`),
      `${planId}/${pressureLessonTrack} stores the new lesson ordering`);
    const counts = snapshot.days.map((day) => day.activities.length);
    assert.deepEqual([...new Set(counts)].sort(), [0, 1, 2], planId);
    assert.ok(counts.filter((count) => count === 0).length >= counts.length * 0.375,
      'Actual new enrollments include the gentle first week and later light days');
    const firstWeek = snapshot.days.slice(0, 7);
    assert.deepEqual(firstWeek.filter((day) => !day.activities.length).map((day) => day.day),
      planId === 'quiet' ? [1, 3, 4, 7] : [1, 4, 5, 7], `${planId} stores four light days in week one`);
    assert.ok(firstWeek.every((day) => day.activities.length <= 1), planId);
    const firstWeekActivities = firstWeek.flatMap((day) => day.activities);
    assert.equal(firstWeekActivities.length, 3, `${planId} stores only three practices in week one`);
    assert.equal(firstWeekActivities.reduce((minutes, activity) => minutes + catalogue.PROGRAM_ACTIVITIES.get(activity.activityId).delivery.minutes, 0), 5, planId);
    assert.ok(counts.filter((count) => count < 2).length >= counts.length * 0.7, planId);
    for (const definition of preset.days) {
      // Simulate the server advancing the same enrollment, then use the real
      // reload and Home hook; catalogue-only checks would miss fallback rows.
      stored().program_day = definition.day;
      const reloaded = await service.getCurrentProgramEnrollment('new-user');
      const { day } = homeDay(reloaded, { existingExercises: true });
      assert.ok(day, `${planId} day ${definition.day}`);
      assert.equal(day.programDay, definition.day);
      assert.equal(day.resolvedActivityCount, definition.activityIds.length);
      assert.deepEqual(plain(day.activities.map(({ activityId }) => activityId)), [...definition.activityIds]);
      assert.ok(day.lesson);
      assert.equal(day.todoStep.required, true);
      const bubble = planBubble(reloaded, { day: definition.day, state: 'ahead' });
      const exerciseRows = bubble.rows.filter((row) => row.kind === 'exercise');
      assert.equal(exerciseRows.length, day.activities.length, 'Plan bubbles and Home show the same workload');
      assert.deepEqual(plain(exerciseRows.map((row) => row.minutes)), plain(day.activities.map((activity) => activity.minutes)));
      assert.equal(bubble.title, day.lesson.title);
      assert.equal(bubble.rows.filter((row) => row.kind === 'todo').length, 1);
      assert.deepEqual(stored().resolved, snapshot, 'Reads never rewrite the saved schedule');
    }
  }
});

test('updating retains every existing revision snapshot and progress when current revisions change', async () => {
  for (const preset of catalogue.allProgramPresets()) {
    const { planId, revision } = preset;
    if (revision === catalogue.latestProgramPreset(planId).revision) continue;
    const built = enrollmentDomain.buildProgramEnrollment({
      enrollmentId: 'existing-enrollment', planId, presetRevision: revision,
      enrolledOn: '2026-09-12',
    });
    assert.equal(built.status, 'enrolled');
    const existing = {
      id: 'existing-enrollment', user_id: 'new-user', plan_id: planId,
      preset_revision: revision, resolver_version: built.enrollment.resolverVersion,
      enrolled_on: '2026-09-12', status: 'active', program_day: 9,
      last_advanced_on: '2026-10-09', todo_step_from_day: null,
      resolved: plain(built.enrollment.resolved),
    };
    const { service, stored } = serviceHarness(existing);
    const reloaded = await service.getCurrentProgramEnrollment('new-user');
    assert.equal(reloaded.enrollmentId, existing.id);
    assert.equal(reloaded.presetRevision, revision);
    assert.equal(reloaded.programDay, 9);
    assert.equal(reloaded.lastAdvancedOn, existing.last_advanced_on);
    assert.deepEqual(plain(reloaded.resolved), existing.resolved);
    assert.deepEqual(stored().resolved, existing.resolved);
  }
});

function existingPlan(overrides = {}) {
  const presetRevision = catalogue.latestProgramPreset('night').revision - 1;
  const built = enrollmentDomain.buildProgramEnrollment({
    enrollmentId: 'existing-plan', planId: 'night', presetRevision, enrolledOn: '2026-09-12',
  });
  assert.equal(built.status, 'enrolled');
  return {
    id: 'existing-plan', user_id: 'new-user', plan_id: 'night', preset_revision: presetRevision,
    resolver_version: built.enrollment.resolverVersion, enrolled_on: '2026-09-12',
    status: 'active', program_day: 9, last_advanced_on: '2026-10-09',
    todo_step_from_day: null, resolved: plain(built.enrollment.resolved), ...overrides,
  };
}

test('adoption adds a claim to the current partial day without losing prior action completions', async () => {
  const original = existingPlan();
  const completed = original.resolved.days[8].activities.slice(0, 1).map(({ activityId }) => activityId);
  const { service, stored, rpcCalls } = serviceHarness(original);
  const enrollment = await service.getCurrentProgramEnrollment('new-user');
  const { day } = homeDay(enrollment, { completions: completed, existingExercises: true });
  assert.equal(day.programDay, 9);
  assert.equal(day.todoStep.required, true);
  assert.equal(day.todoStep.claimed, false);
  assert.equal(day.activities[0].completed, true);
  assert.deepEqual([...day.completedActivityIds], completed);
  assert.deepEqual(stored(), { ...original, todo_step_from_day: 9 });
  for (let read = 0; read < 3; read += 1) {
    assert.deepEqual(plain(await service.getCurrentProgramEnrollment('new-user')), plain(enrollment));
  }
  assert.equal(rpcCalls.length, 1, 'Adopt once across repeated reads');
  const claimed = homeDay(enrollment, { completions: [...completed, 'todo:claim'], existingExercises: true }).day;
  assert.equal(claimed.todoStep.claimed, true);
});

test('updating after same-day advancement leaves the completed visible day alone and adds the claim tomorrow', async () => {
  const original = existingPlan({ program_day: 10, last_advanced_on: localDate });
  const completed = original.resolved.days[8].activities.map(({ activityId }) => activityId);
  const { service, stored } = serviceHarness(original);
  const enrollment = await service.getCurrentProgramEnrollment('new-user');
  const today = homeDay(enrollment, { completions: completed, existingExercises: true }).day;
  assert.equal(today.programDay, 9);
  assert.equal(today.todoStep.required, false, 'Adoption does not reopen the completed day');
  assert.equal(today.allCompleted, true);
  const tomorrow = homeDay(enrollment, { date: '2026-10-12', existingExercises: true }).day;
  assert.equal(tomorrow.programDay, 10);
  assert.equal(tomorrow.todoStep.required, true);
  assert.equal(tomorrow.todoStep.claimed, false);
  assert.deepEqual(stored(), { ...original, todo_step_from_day: 10 });
});

test('an already finished unadopted plan stays finished without receiving a new claim', async () => {
  const finalDay = existingPlan().resolved.days.length;
  const original = existingPlan({ status: 'completed', program_day: finalDay, last_advanced_on: localDate });
  const { service, stored, rpcCalls } = serviceHarness(original);
  const enrollment = await service.getCurrentProgramEnrollment('new-user');
  const shown = homeDay(enrollment, { existingExercises: true }).day;
  assert.equal(shown.programDay, finalDay);
  assert.equal(shown.todoStep.required, false);
  assert.equal(enrollment.status, 'completed');
  assert.deepEqual(stored(), original);
  assert.equal(rpcCalls.length, 0);
});

test('failed adoption retains the existing plan and retries successfully on a later read', async () => {
  for (const failure of [{ code: 'PGRST202' }, { code: '500', message: 'server error' }, new Error('offline')]) {
    const original = existingPlan();
    const { service, stored, rpcCalls } = serviceHarness(original, [failure]);
    const failed = await service.getCurrentProgramEnrollment('new-user');
    assert.equal(failed.todoStepFromDay, null);
    assert.deepEqual(stored(), original);
    assert.equal(homeDay(failed, { existingExercises: true }).day.todoStep.required, false);
    const recovered = await service.getCurrentProgramEnrollment('new-user');
    assert.equal(recovered.todoStepFromDay, 9);
    assert.equal(homeDay(recovered, { existingExercises: true }).day.todoStep.required, true);
    assert.deepEqual(stored(), { ...original, todo_step_from_day: 9 });
    assert.equal(rpcCalls.length, 2);
  }
});

test('Home keeps room claims outside My Plan and registers each tour target on a mounted owner', () => {
  const list = find(home, (node) => ts.isJsxSelfClosingElement(node)
    && node.tagName.getText(home) === 'TodoListSection');
  const attributes = list.attributes.properties.map((attribute) => attribute.name?.text);
  assert.ok(!attributes.includes('destination'));
  assert.ok(!attributes.includes('destinationTarget'));
  const progress = find(home, (node) => ts.isJsxSelfClosingElement(node)
    && node.tagName.getText(home) === 'RoomProgressCard');
  assert.match(progress.getText(home), /onClaim=\{\(\) => reward\.open\(\)\}/);
  assert.match(progress.getText(home), /target=\{roomProgressTarget\}/);
  const room = find(home, (node) => ts.isJsxOpeningElement(node)
    && node.attributes.properties.some((attribute) => ts.isJsxSpreadAttribute(attribute)
      && attribute.expression.getText(home) === 'roomPieceTarget'));
  assert.equal(room.tagName.getText(home), 'View');
  assert.match(read('../../screens/HomeScreen.tsx'), /actionTarget: firstLessonTarget/);
});
