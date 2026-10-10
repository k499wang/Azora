import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as calendar from '../lib/calendar/weekCalendarDays.ts';
import * as lessons from '../features/lessons/domain/lessonCatalogue.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./HistoryScreen.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;
const today = '2026-10-05';
const past = '2026-10-04';

function render({ date = past, moodCheckIn = null, reads = [], units = [] } = {}) {
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    react: { useCallback: (fn) => fn, useMemo: (fn) => fn(), useState: (value) => [value, () => {}] },
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': { View: 'View', ScrollView: 'ScrollView', ActivityIndicator: 'ActivityIndicator', StyleSheet: { create: (styles) => styles } },
    '../theme/colors': { colors: { background: {}, text: {} } },
    '../theme/spacing': { margin: {}, padding: { screen: {} }, spacing: {} },
    '../theme/typography': { typography: { body: {} } },
    '../stores/authStore': { useAuthStore: (select) => select({ user: { id: 'user' } }) },
    '../hooks/useTodayLocalDate': { useTodayLocalDate: () => today },
    '../hooks/useDailiesCompletion': { useDailiesCompletion: () => ({ units, isLoading: false }) },
    '../queries/history/useDayHistoryQuery': { useDayHistoryQuery: () => ({ data: {
      localDate: date, breathingSessions: [], heartRateSessions: [], earnedDecorations: [],
      moodCheckIn, lessons: reads, partialErrors: {},
    } }) },
    '../queries/tracking/useDailyActivityRangeQuery': { useDailyActivityRangeQuery: () => ({ data: [] }) },
    '../lib/calendar/weekCalendarDays': calendar,
    '../features/exercise/guidedBreathing/techniques': { getTechnique: () => null },
    '../features/lessons/domain/lessonCatalogue': lessons,
    '../components/common/Reveal': { Rise: 'Rise' },
    '../components/common/Text': { Text: 'Text' },
  };
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name in dependencies) return dependencies[name];
      if (name.startsWith('../components/')) return { default: name.split('/').at(-1) };
      if (name.endsWith('/categoryPalette')) return { CATEGORY_STYLE: {} };
      if (name.endsWith('/profileStatsFormat')) return {};
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const nodes = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (node == null || typeof node !== 'object') return;
    nodes.push(node);
    visit(node.props?.children);
  }
  visit(exports.default({ navigation: {}, route: { params: { date } } }));
  return nodes;
}

test('past mood-only days show the completed check-in and its answers', () => {
  const nodes = render({ moodCheckIn: { createdAt: `${past}T12:00:00Z`, answers: { overall: 4 }, tags: [], note: null } });
  const row = nodes.find((node) => node.type === 'HistoryDayRow');
  assert.equal(row.props.title, 'Mood Check-In');
  assert.equal(row.props.illustration, 'heart');
  assert.equal(row.props.completed, true);
  assert.ok(nodes.some((node) => node.type === 'HistoryMoodCard'));
  assert.ok(!nodes.some((node) => node.type === 'HistoryEmptyDay'));
});

test('past lesson-only days show a completed lesson, including unknown older IDs', () => {
  const known = lessons.allLessons()[0];
  for (const lessonId of [known.id, 'older-unknown-lesson']) {
    const nodes = render({ reads: [{ id: 'read', lessonId, completedAt: `${past}T12:00:00Z` }] });
    const row = nodes.find((node) => node.type === 'HistoryDayRow');
    assert.equal(row.props.illustration, 'book');
    assert.equal(row.props.completed, true);
    assert.equal(row.props.title, lessonId === known.id ? lessons.lessonRowTitle(known.id) : 'Learn a small step');
    assert.ok(!nodes.some((node) => node.type === 'HistoryEmptyDay'));
  }
});

test('today distinguishes mood, lesson and to-do icons while keeping incomplete rows', () => {
  const nodes = render({ date: today, units: [
    { id: 'mood', kind: 'mood', title: 'Mood Check-In', completed: false },
    { id: 'lesson', kind: 'lesson', title: 'Learn a small step', completed: false },
    { id: 'todo:claim', kind: 'todo', title: 'Do a to-do', techniqueId: null, completed: false },
  ] });
  const rows = nodes.filter((node) => node.type === 'HistoryDayRow');
  assert.equal(rows[0].props.illustration, 'heart');
  assert.equal(rows[1].props.illustration, 'book');
  assert.equal(rows[2].props.illustration, 'todo-plan');
  assert.equal(rows[2].props.title, 'Do a to-do');
  assert.ok(rows.every((row) => row.props.completed === false));
});
