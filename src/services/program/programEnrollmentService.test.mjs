import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as catalogue from '../../features/program/domain/programCatalogue.ts';
import * as enrollmentDomain from '../../features/program/domain/programEnrollment.ts';
import { lessonForDay } from '../../features/lessons/domain/lessonCatalogue.ts';

const source = readFileSync(new URL('./programEnrollmentService.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function harness(rows, error = null) {
  let selected = rows;
  const orders = [];
  const query = {
    select() { return this; },
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
    async maybeSingle() { assert.ok(selected.length <= 1); return { data: selected[0] ?? null, error }; },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '../supabase') return { requireSupabaseClient: () => ({ from: () => query }) };
      return {};
    },
  });
  return exports;
}

function row(id, status, createdAt) {
  return {
    id, status, created_at: createdAt, user_id: 'user-1', plan_id: 'night',
    preset_revision: 1, resolver_version: 1, enrolled_on: '2026-09-18',
    program_day: 1, last_advanced_on: '2026-09-18',
    resolved: { days: [{ day: 1, why: 'Rest', activities: [
      { activityId: 'rest', activityRevision: 1, match: { modality: 'breathing', techniqueId: 'relaxing' } },
    ] }] },
  };
}

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

function startHarness() {
  let savedRow = null;
  const client = {
    from(table) {
      assert.equal(table, 'program_enrollments');
      return {
        insert(payload) {
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
      if (name.endsWith('/programEnrollment')) return enrollmentDomain;
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
    const reloaded = service.sanitizeEnrollmentRow(JSON.parse(JSON.stringify(saved())));
    assert.deepEqual(JSON.parse(JSON.stringify(reloaded)), JSON.parse(JSON.stringify(started)));
    for (const [index, day] of reloaded.resolved.days.entries()) {
      assert.equal(day.lessonActivityId, `lesson:${lessonForDay(choice.planId, index + 1, preset.revision, choice.pressureLessonTrack).id}`);
      assert.deepEqual(day.activities.map((activity) => activity.activityId), preset.days[index].activityIds);
    }
  }
});
