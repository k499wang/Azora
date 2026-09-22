import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as domain from '../../features/selfCare/domain/selfCareGoal.ts';
import {
  acceptedStarterPlanItems,
  buildStarterPlan,
  starterPlanDrafts,
} from '../../lib/onboardingStarterPlan.ts';
import * as goalDate from './selfCareGoalDate.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./selfCareService.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;

const date = '2026-09-20'; // Sunday: weekday routines must still be reused.
const draft = { title: 'Drink water', icon: 'water', recurrence: 'daily', scheduledTime: null };
const row = (id, overrides = {}) => ({
  id, user_id: 'user', title: draft.title, icon: draft.icon, recurrence: draft.recurrence,
  scheduled_time: null, featured_on: null, archived_at: null,
  created_at: '2026-09-19T12:00:00Z', updated_at: '2026-09-19T12:00:00Z', ...overrides,
});

function harness(initial = [], completions = [], loseInsertResponse = false) {
  const tables = { self_care_goals: [...initial], self_care_goal_completions: completions };
  const inserts = [];
  const client = {
    from(table) {
      const filters = [];
      let additions;
      const query = {
        select() { return this; },
        eq(key, value) { filters.push((item) => item[key] === value); return this; },
        is(key, value) { return this.eq(key, value); },
        in(key, values) { filters.push((item) => values.includes(item[key])); return this; },
        lt(key, value) { filters.push((item) => item[key] < value); return this; },
        order() { return this; },
        insert(rows) { additions = rows; return this; },
        then(resolve, reject) {
          let error = null;
          let data;
          if (additions) {
            inserts.push(additions);
            data = additions.map((item, index) => row(`new-${inserts.length}-${index}`, item));
            tables[table].push(...data);
            if (loseInsertResponse) {
              loseInsertResponse = false;
              error = new Error('Response lost after commit');
            }
          } else {
            data = tables[table].filter((item) => filters.every((filter) => filter(item)));
          }
          return Promise.resolve({ data, error }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '../supabase') return { requireSupabaseClient: () => client };
      if (name.endsWith('/selfCareGoal')) return domain;
      if (name === './selfCareGoalDate') return goalDate;
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const importGoals = (drafts) => exports.createSelfCareGoals('user', drafts, date);
  return { create: async (drafts) => (await importGoals(drafts)).savedGoals, importGoals, inserts, tables };
}

test('repeat imports reuse completed tasks and insert only new unique drafts', async () => {
  const h = harness([row('water', { featured_on: date })], [
    { user_id: 'user', goal_id: 'water', local_date: date },
  ]);
  const result = await h.create([
    { ...draft, title: '  DRINK WATER ', icon: 'star' },
    { ...draft, title: 'Stretch' },
    { ...draft, title: 'Stretch' },
  ]);
  assert.equal(result.length, 2);
  assert.equal(result[0].id, 'water');
  assert.equal(result[0].completedToday, true);
  assert.equal(result[0].featuredToday, true);
  assert.equal(h.inserts.length, 1);
  assert.equal(h.inserts[0].length, 1);
  await h.create([draft, { ...draft, title: 'Stretch' }]);
  assert.equal(h.inserts.length, 1);
});

test('accepted onboarding habits appear in My Routine without rejected habits or duplicates', async () => {
  const plan = buildStarterPlan({
    intent: 'heart_health',
    wakeEase: null,
    sleepDuration: null,
    dayActivity: null,
    routineHappiness: null,
    mentalHealth: [],
    procrastinationAreas: [],
    procrastinationReasons: [],
  });
  const selected = plan[0];
  const rejected = plan[1];
  assert.ok(selected);
  assert.ok(rejected);
  const accepted = acceptedStarterPlanItems(plan, {
    [selected.id]: 'accepted',
    [rejected.id]: 'rejected',
    oldRecommendation: 'accepted',
  });
  const drafts = starterPlanDrafts(accepted, []);
  const h = harness([row('existing', { title: 'Keep my task' })]);

  const first = await h.importGoals(drafts);
  assert.equal(first.savedGoals.length, 1);
  assert.equal(first.savedGoals[0].title, selected.title);
  assert.equal(first.savedGoals[0].recurrence, 'daily');
  assert.equal(first.savedGoals[0].scheduledTime, drafts[0].scheduledTime);
  assert.deepEqual(
    Array.from(first.goalsForDate, (goal) => goal.title).sort(),
    ['Keep my task', selected.title].sort(),
  );
  assert.ok(!first.goalsForDate.some((goal) => goal.title === rejected.title));

  await h.importGoals(drafts);
  assert.equal(h.inserts.length, 1);
  assert.equal(h.tables.self_care_goals.length, 2);
});

test('import returns the whole due list for a first visit, not just the starter tasks', async () => {
  const h = harness([
    row('existing', { title: 'Keep my task' }),
    row('weekday', { title: 'Wipe down the stovetop', recurrence: 'weekdays' }),
    row('spent', { title: 'Done yesterday', recurrence: 'once' }),
    row('archived', { title: 'Archived', archived_at: '2026-09-19T13:00:00Z' }),
  ], [{ user_id: 'user', goal_id: 'spent', local_date: '2026-09-19' }]);
  const result = await h.importGoals([draft]);
  assert.equal(result.savedGoals.length, 1);
  assert.deepEqual(Array.from(result.goalsForDate, (goal) => goal.title).sort(), ['Drink water', 'Keep my task']);
});

test('identity includes recurrence and normalized time but not icon', async () => {
  const h = harness([row('weekday', { recurrence: 'weekdays', scheduled_time: '07:00:00' })]);
  const result = await h.create([
    { ...draft, recurrence: 'weekdays', scheduledTime: '07:00' },
    { ...draft, recurrence: 'daily', scheduledTime: '07:00' },
    { ...draft, recurrence: 'weekdays', scheduledTime: '08:00' },
  ]);
  assert.equal(result[0].id, 'weekday');
  assert.equal(h.inserts[0].length, 2);
});

test('archived tasks and previously spent one-offs do not block new imports', async () => {
  const h = harness([
    row('archived', { archived_at: '2026-09-19T14:00:00Z' }),
    row('spent', { recurrence: 'once' }),
    row('other-user', { user_id: 'someone-else' }),
  ], [{ user_id: 'user', goal_id: 'spent', local_date: '2026-09-19' }]);
  const result = await h.create([draft, { ...draft, recurrence: 'once' }]);
  assert.equal(result.length, 2);
  assert.equal(h.inserts[0].length, 2);
  assert.ok(result.every((goal) => goal.id.startsWith('new-')));
});

test('retry after a committed insert with a lost response does not duplicate tasks', async () => {
  const h = harness([], [], true);
  await assert.rejects(h.create([draft]), /Response lost/);
  const result = await h.create([draft]);
  assert.equal(result.length, 1);
  assert.equal(h.inserts.length, 1);
  assert.equal(h.tables.self_care_goals.length, 1);
});

test('invalid or empty drafts never write anything', async () => {
  const h = harness();
  assert.equal((await h.create([])).length, 0);
  await assert.rejects(h.create([draft, { ...draft, title: ' ' }]), /shorter to-do/);
  assert.equal(h.inserts.length, 0);
});

test('imports stay atomic and allow routines beyond the former capacity', async () => {
  const existing = Array.from({ length: 20 }, (_, index) =>
    row(`goal-${index}`, { title: `Existing ${index}` }));
  const h = harness(existing);
  const result = await h.create([draft, { ...draft, title: 'Stretch' }]);
  assert.equal(result.length, 2);
  assert.equal(h.inserts[0].length, 2);
  await h.create([{ ...draft, title: 'Existing 0' }]);
  assert.equal(h.inserts.length, 1);
});

test('weekday tasks hidden on Sunday do not block new imports', async () => {
  const existing = Array.from({ length: 20 }, (_, index) =>
    row(`goal-${index}`, { title: `Weekday ${index}`, recurrence: 'weekdays' }));
  const h = harness(existing);
  const result = await h.create([draft]);
  assert.equal(result.length, 1);
  assert.equal(h.inserts.length, 1);
});
