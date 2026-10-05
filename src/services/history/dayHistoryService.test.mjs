import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadService(relativePath, dependencies) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: () => dependencies });
  return exports;
}

function historyService(overrides = {}) {
  return loadService('./dayHistoryService.ts', {
    getBreathHoldSummaryForDate: async () => null,
    getHeartRateSummariesForDate: async () => [],
    getBreathingSessionsForDate: async () => [],
    getDecorationsEarnedOnDate: async () => [],
    getMoodCheckIn: async () => ({ available: true, checkIn: null }),
    getLessonReadsForDate: async () => [],
    ...overrides,
  });
}

test('a past day retains a mood check-in without any exercise sessions', async () => {
  const mood = { id: 'mood', localDate: '2026-09-29', feeling: 'happy' };
  const { getDayHistory } = historyService({
    getMoodCheckIn: async (userId, localDate) => {
      assert.equal(userId, 'user-one');
      assert.equal(localDate, mood.localDate);
      return { available: true, checkIn: mood };
    },
  });
  const day = await getDayHistory('user-one', mood.localDate);
  assert.equal(day.moodCheckIn, mood);
  assert.equal(day.breathingSessions.length, 0);
  assert.equal(day.partialErrors.moodCheckIn, false);
});

test('a past day retains lessons without any exercise sessions', async () => {
  const lessons = [{ id: 'old:2:lesson:sleep.anchor', lessonId: 'sleep.anchor', completedAt: '2026-09-30T01:00:00Z', localDate: '2026-09-29' }];
  const { getDayHistory } = historyService({
    getLessonReadsForDate: async (userId, localDate) => {
      assert.equal(userId, 'user-one');
      assert.equal(localDate, lessons[0].localDate);
      return lessons;
    },
  });
  const day = await getDayHistory('user-one', '2026-09-29');
  assert.equal(day.lessons, lessons);
  assert.equal(day.breathingSessions.length, 0);
  assert.equal(day.partialErrors.lessons, false);
});

test('a failed lesson read keeps the rest of the day available', async () => {
  const mood = { id: 'mood' };
  const { getDayHistory } = historyService({
    getLessonReadsForDate: async () => { throw new Error('offline'); },
    getMoodCheckIn: async () => ({ available: true, checkIn: mood }),
  });
  const day = await getDayHistory('user-one', '2026-09-29');
  assert.equal(day.lessons.length, 0);
  assert.equal(day.partialErrors.lessons, true);
  assert.equal(day.moodCheckIn, mood);
  assert.equal(day.partialErrors.moodCheckIn, false);
});

test('lesson history uses the stored local date across enrollments and excludes other users and activities', async () => {
  const rows = [
    { user_id: 'user-one', enrollment_id: 'past', program_day: 2, activity_id: 'lesson:sleep.anchor', completed_at: '2026-09-30T01:00:00Z', local_date: '2026-09-29' },
    { user_id: 'user-one', enrollment_id: 'current', program_day: 1, activity_id: 'lesson:body.rest', completed_at: '2026-09-29T21:00:00Z', local_date: '2026-09-29' },
    { user_id: 'user-one', activity_id: 'breathing:calm', local_date: '2026-09-29' },
    { user_id: 'user-two', activity_id: 'lesson:sleep.anchor', local_date: '2026-09-29' },
    { user_id: 'user-one', activity_id: 'lesson:sleep.anchor', local_date: '2026-09-30' },
  ];
  const filters = [];
  const query = {
    select() { return this; },
    eq(column, value) { filters.push((row) => row[column] === value); return this; },
    like(column, value) {
      assert.equal(value, 'lesson:%');
      filters.push((row) => row[column].startsWith('lesson:'));
      return this;
    },
    async order(column, options) {
      assert.equal(column, 'completed_at');
      assert.equal(options.ascending, true);
      return { data: rows.filter((row) => filters.every((filter) => filter(row))).sort((a, b) => a.completed_at.localeCompare(b.completed_at)), error: null };
    },
  };
  const { getLessonReadsForDate } = loadService('../lessons/lessonReadService.ts', {
    requireSupabaseClient: () => ({ from(table) { assert.equal(table, 'program_action_completions'); return query; } }),
  });
  const lessons = await getLessonReadsForDate('user-one', '2026-09-29');
  assert.deepEqual(JSON.parse(JSON.stringify(lessons)), [
    { id: 'current:1:lesson:body.rest', lessonId: 'body.rest', completedAt: '2026-09-29T21:00:00Z', localDate: '2026-09-29' },
    { id: 'past:2:lesson:sleep.anchor', lessonId: 'sleep.anchor', completedAt: '2026-09-30T01:00:00Z', localDate: '2026-09-29' },
  ]);
});
