import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as catalogue from '../../features/program/domain/programCatalogue.ts';
import * as enrollmentDomain from '../../features/program/domain/programEnrollment.ts';
import { lessonForDay } from '../../features/lessons/domain/lessonCatalogue.ts';
import * as pathGold from '../../features/plan/domain/pathGold.ts';

const source = readFileSync(new URL('./programEnrollmentService.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function harness(rows, error = null, { rpc, columnMissing = false, todoStepEnabled = false } = {}) {
  let selected = rows;
  let requested = '';
  const orders = [];
  const rpcCalls = [];
  const query = {
    select(columns) { requested = columns; return this; },
    eq(key, value) { selected = selected.filter(row => row[key] === value); return this; },
    in(key, values) { selected = selected.filter(row => values.includes(row[key])); return this; },
    order(key, options) { orders.push([key, options.ascending]); return this; },
    limit(count) {
      selected.sort((a, b) => {
        for (const [key, ascending] of orders) {
          if (a[key] !== b[key]) return (a[key] < b[key] ? -1 : 1) * (ascending ? 1 : -1);
        }
        return 0;
      });
      selected = selected.slice(0, count);
      return this;
    },
    async maybeSingle() {
      assert.ok(selected.length <= 1);
      if (columnMissing && requested.includes('todo_step_from_day')) {
        return { data: null, error: { code: '42703' } };
      }
      return { data: selected[0] ?? null, error };
    },
  };
  const client = {
    from: () => query,
    async rpc(name) {
      rpcCalls.push(name);
      if (rpc == null) throw new Error(`Unexpected rpc ${name}`);
      return rpc(name);
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '../supabase') return { requireSupabaseClient: () => client };
      if (name.endsWith('/programTodoStep')) return { PLAN_TODO_STEP_ENABLED: todoStepEnabled };
      return {};
    },
  });
  exports.rpcCalls = rpcCalls;
  return exports;
}

function row(id, status, createdAt) {
  return {
    id, status, created_at: createdAt, user_id: 'user-1', plan_id: 'night',
    preset_revision: 1, resolver_version: 1, enrolled_on: '2026-09-18',
    program_day: 1, last_advanced_on: '2026-09-18', todo_step_from_day: 1,
    resolved: { days: [{ day: 1, why: 'Rest', activities: [
      { activityId: 'rest', activityRevision: 1, match: { modality: 'breathing', techniqueId: 'relaxing' } },
    ] }] },
  };
}

test('a stored day with no Reset is read, not refused', () => {
  const stored = row('a', 'active', '2026-09-18');
  stored.resolved.days = [
    { day: 1, why: 'No Reset today', activities: [], lessonActivityId: 'lesson:plan.grows' },
    { ...stored.resolved.days[0], day: 2 },
  ];
  const enrollment = harness([]).sanitizeEnrollmentRow(stored);
  assert.ok(enrollment);
  assert.equal(enrollment.resolved.days[0].activities.length, 0);
  assert.equal(enrollment.resolved.days[1].activities.length, 1);
});

test('reading an older enrollment keeps its saved first-day Reset after new revisions ship', async () => {
  const stored = row('older-plan', 'active', '2026-09-18');
  const before = JSON.stringify(stored.resolved);
  const service = harness([stored]);
  const read = await service.getCurrentProgramEnrollment('user-1');
  assert.equal(read.presetRevision, stored.preset_revision);
  assert.equal(read.resolved.days[0].activities.length, 1);
  assert.equal(read.resolved.days[0].activities[0].activityId, 'rest');
  assert.equal(JSON.stringify(stored.resolved), before);
});

test('a completed enrollment survives refetch and app relaunch', async () => {
  const service = harness([row('finished', 'completed', '2026-09-18')]);
  const result = await service.getCurrentProgramEnrollment('user-1');
  assert.equal(result.enrollmentId, 'finished');
  assert.equal(result.status, 'completed');
});

test('active plans take priority; otherwise the latest completed plan wins', async () => {
  const completed = [row('old', 'completed', '2026-09-01'), row('new', 'completed', '2026-09-18')];
  assert.equal((await harness(completed).getCurrentProgramEnrollment('user-1')).enrollmentId, 'new');
  assert.equal((await harness([...completed, row('active', 'active', '2026-08-01')])
    .getCurrentProgramEnrollment('user-1')).enrollmentId, 'active');
});

test('abandoned plans and other users never become the current plan', async () => {
  const other = { ...row('other', 'active', '2026-09-18'), user_id: 'user-2' };
  assert.equal(await harness([other, row('abandoned', 'abandoned', '2026-09-18')])
    .getCurrentProgramEnrollment('user-1'), null);
});

test('missing schema is an empty state, while read failures remain errors', async () => {
  assert.equal(await harness([], { code: '42P01' }).getCurrentProgramEnrollment('user-1'), null);
  await assert.rejects(harness([], new Error('offline')).getCurrentProgramEnrollment('user-1'), /offline/);
});

/** The domain as it builds with the step enabled, whatever the shipped flag says. */
const enabledDomain = {
  ...enrollmentDomain,
  buildProgramEnrollment: (input) => {
    const built = enrollmentDomain.buildProgramEnrollment(input);
    return built.status === 'enrolled'
      ? { ...built, enrollment: { ...built.enrollment, todoStepFromDay: 1 } }
      : built;
  },
};

function startHarness({ columnMissing = false, todoStepEnabled = false, compatibleRpc = true } = {}) {
  let savedRow = null;
  const client = {
    async rpc(name) {
      assert.equal(name, 'adopt_plan_todo_step_compatible');
      if (columnMissing || !compatibleRpc) return { data: null, error: { code: 'PGRST202' } };
      savedRow = { ...savedRow, todo_step_from_day: savedRow.program_day };
      return { data: savedRow, error: null };
    },
    from(table) {
      assert.equal(table, 'program_enrollments');
      return {
        insert(payload) {
          if (columnMissing && 'todo_step_from_day' in payload) {
            return { select: () => ({ single: async () => ({ data: null, error: { code: 'PGRST204' } }) }) };
          }
          savedRow = JSON.parse(JSON.stringify({
            ...payload, id: 'saved-plan', program_day: 1,
            last_advanced_on: null, status: 'active',
          }));
          return { select: () => ({ single: async () => ({ data: savedRow, error: null }) }) };
        },
      };
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '../supabase') return { requireSupabaseClient: () => client };
      if (name.endsWith('/programCatalogue')) return catalogue;
      if (name.endsWith('/programEnrollment')) return todoStepEnabled ? enabledDomain : enrollmentDomain;
      if (name.endsWith('/programTodoStep')) return { PLAN_TODO_STEP_ENABLED: todoStepEnabled };
      if (name.endsWith('/pathGold')) return pathGold;
      throw new Error(`Unexpected service dependency: ${name}`);
    },
  });
  return { service: exports, saved: () => savedRow };
}

test('every new plan saves and reloads its complete reset and lesson schedule', async () => {
  const choices = [...new Set(catalogue.allProgramPresets().map((preset) => preset.planId))]
    .flatMap((planId) => planId === 'pressure'
      ? ['stress', 'overthinking', 'anger'].map((pressureLessonTrack) => ({ planId, pressureLessonTrack }))
      : [{ planId }]);
  for (const choice of choices) {
    const { service, saved } = startHarness();
    const started = await service.startProgramEnrollment({ ...choice, userId: 'user-1', enrolledOn: '2026-10-02' });
    assert.ok(started, JSON.stringify(choice));
    const preset = catalogue.latestProgramPreset(choice.planId);
    assert.equal(saved().preset_revision, preset.revision);
    assert.equal(saved().resolver_version, enrollmentDomain.RESOLVER_VERSION);
    assert.equal(started.programDay, 1);
    assert.equal(saved().resolved.days[0].activities.length, 0, `${choice.planId} must start without a Reset`);
    const reloaded = service.sanitizeEnrollmentRow(JSON.parse(JSON.stringify(saved())));
    assert.deepEqual(JSON.parse(JSON.stringify(reloaded)), JSON.parse(JSON.stringify(started)));
    for (const [index, day] of reloaded.resolved.days.entries()) {
      assert.equal(day.lessonActivityId, `lesson:${lessonForDay(choice.planId, index + 1, preset.revision, choice.pressureLessonTrack).id}`);
      assert.deepEqual([...day.activities.map((activity) => activity.activityId)], preset.days[index].activityIds);
    }
  }
});

function unadopted(status = 'active') {
  return { ...row('plan', status, '2026-09-18'), program_day: 6, last_advanced_on: '2026-10-09', todo_step_from_day: null };
}

test('with the step on, an active plan from before it is adopted once, from the day it is on', async () => {
  const service = harness([unadopted()], null, {
    todoStepEnabled: true,
    rpc: async () => ({ data: { ...unadopted(), todo_step_from_day: 6 }, error: null }),
  });
  const enrollment = await service.getCurrentProgramEnrollment('user-1');
  assert.deepEqual([...service.rpcCalls], ['adopt_plan_todo_step_compatible']);
  assert.equal(enrollment.todoStepFromDay, 6);
  assert.equal(enrollment.programDay, 6);
});

test('an adopted plan, or a finished one, is never adopted again', async () => {
  const adopted = harness([row('plan', 'active', '2026-09-18')], null, { todoStepEnabled: true });
  assert.equal((await adopted.getCurrentProgramEnrollment('user-1')).todoStepFromDay, 1);
  const finished = harness([unadopted('completed')], null, { todoStepEnabled: true });
  assert.equal((await finished.getCurrentProgramEnrollment('user-1')).todoStepFromDay, null);
  assert.equal(adopted.rpcCalls.length + finished.rpcCalls.length, 0);
});

test('a backend without the to-do step column loads the plan as before, without the step', async () => {
  const service = harness([unadopted()], null, { columnMissing: true, todoStepEnabled: true });
  const enrollment = await service.getCurrentProgramEnrollment('user-1');
  assert.equal(enrollment.enrollmentId, 'plan');
  assert.equal(enrollment.todoStepFromDay, null);
  assert.equal(service.rpcCalls.length, 0);
});

test('a failed adoption loads the plan as before, without the step', async () => {
  const failures = [
    async () => ({ data: null, error: { code: 'PGRST202' } }),
    async () => ({ data: null, error: { code: '500', message: 'boom' } }),
    async () => { throw new Error('offline'); },
    async () => ({ data: { not: 'an enrollment' }, error: null }),
  ];
  for (const rpc of failures) {
    const enrollment = await harness([unadopted()], null, { rpc, todoStepEnabled: true })
      .getCurrentProgramEnrollment('user-1');
    assert.equal(enrollment.enrollmentId, 'plan');
    assert.equal(enrollment.programDay, 6);
    assert.equal(enrollment.todoStepFromDay, null);
  }
});

test('with the step off, an unadopted plan is read as is and never adopted', async () => {
  const service = harness([unadopted()]);
  const enrollment = await service.getCurrentProgramEnrollment('user-1');
  assert.equal(enrollment.todoStepFromDay, null);
  assert.equal(service.rpcCalls.length, 0);
});

test('with the step off, a new plan writes no to-do step column', async () => {
  const off = startHarness();
  const started = await off.service.startProgramEnrollment({ planId: 'night', userId: 'user-1', enrolledOn: '2026-10-11' });
  assert.equal('todo_step_from_day' in off.saved(), false);
  assert.equal(started.todoStepFromDay, null);

  const offOnOlderBackend = startHarness({ columnMissing: true });
  assert.ok(await offOnOlderBackend.service.startProgramEnrollment({ planId: 'night', userId: 'user-1', enrolledOn: '2026-10-11' }));
});

test('with the step on, a new plan asks from day one, or starts without it on an older backend', async () => {
  const current = startHarness({ todoStepEnabled: true });
  const started = await current.service.startProgramEnrollment({ planId: 'night', userId: 'user-1', enrolledOn: '2026-10-11' });
  assert.equal(current.saved().todo_step_from_day, 1);
  assert.equal(started.todoStepFromDay, 1);

  const older = startHarness({ columnMissing: true, todoStepEnabled: true });
  const legacy = await older.service.startProgramEnrollment({ planId: 'night', userId: 'user-1', enrolledOn: '2026-10-11' });
  assert.ok(legacy);
  assert.equal('todo_step_from_day' in older.saved(), false);
  assert.equal(legacy.todoStepFromDay, null);
});

test('an enrollment from an advance response without the step field has the step off', () => {
  const { todo_step_from_day: _omitted, ...legacy } = row('plan', 'active', '2026-09-18');
  assert.equal(harness([]).sanitizeEnrollmentRow(legacy).todoStepFromDay, null);
});

test('a backend with the column but without compatible adoption never enables the step', async () => {
  const older = startHarness({ todoStepEnabled: true, compatibleRpc: false });
  const started = await older.service.startProgramEnrollment({ planId: 'night', userId: 'user-1', enrolledOn: '2026-10-11' });
  assert.ok(started);
  assert.equal(started.todoStepFromDay, null);
  assert.equal('todo_step_from_day' in older.saved(), false);
});
