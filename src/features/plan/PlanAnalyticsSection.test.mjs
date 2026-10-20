import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { moodInsights } from './domain/moodInsights.ts';
import { MOOD_FACES } from '../mood/domain/moodCheckIn.ts';

function loadCards() {
  const source = ts.transpileModule(readFileSync(new URL('./PlanAnalyticsSection.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const jsx = (type, props) => ({ type, props });
  const hue = { fill: 'fill', ink: 'ink', bare: 'bare' };
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' };
      if (name === 'react-native') return { View: 'View', StyleSheet: { create: value => value } };
      if (name.endsWith('/Text')) return { Text: 'Text' };
      if (name.endsWith('/moodCheckIn')) return { MOOD_FACES };
      if (name.endsWith('/moodFaceHue')) return { MOOD_FACE_HUE: { 1: hue, 2: hue, 3: hue, 4: hue, 5: hue } };
      if (name.endsWith('/weekCalendarDays')) return { parseLocalDate: date => new Date(`${date}T12:00:00`) };
      if (name.endsWith('/colors')) return { colors: { text: {}, primary: {}, background: {}, border: {}, neutral: {}, playful: { sky: {} } } };
      if (name.endsWith('/spacing')) return { spacing: { '2xs': 2, xs: 4, sm: 8, md: 16, lg: 24 } };
      if (name.endsWith('/typography')) return { typography: { label: {}, title: {} }, fonts: {} };
      if (name.endsWith('/card')) return { card: {}, radius: {} };
      return { default: name.split('/').at(-1) };
    },
  });
  return exports.MoodInsightCards;
}

function nodes(tree) {
  if (tree == null || typeof tree === 'boolean') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== 'object') return [];
  const rendered = typeof tree.type === 'function' ? tree.type(tree.props) : null;
  return [tree, ...nodes(tree.props?.children), ...nodes(rendered)];
}

function text(tree) {
  return nodes(tree).flatMap(node => [node.props?.children].flat())
    .filter(value => typeof value === 'string' || typeof value === 'number').join(' ');
}

const entry = (localDate, overall, tags = [], feeling = null) => ({
  localDate, score: 50, answers: { overall }, tags, feeling,
});
const insights = checkIns => moodInsights({ checkIns, todayLocalDate: '2026-10-19' });

test('cards aggregate all time with no period or mood selectors', () => {
  const Cards = loadCards();
  const tree = Cards({ insights: insights([
    { ...entry('2026-03-01', 4, ['work'], 'happy'), createdAt: '2026-03-01T09:00:00' },
    entry('2026-10-19', 4, ['work', 'friends'], 'proud'),
  ]) });
  const titles = nodes(tree).filter(node => node.type === 'CardTitle').map(node => node.props.title);
  assert.deepEqual(titles, ['Your mood over time', 'Mood breakdown', 'Moods during the week', 'Moods through the day', 'Impacts']);
  assert.match(text(tree), /100%/);
  assert.match(text(tree), /Proud/);
  assert.match(text(tree), /2 check-ins\s+since/);
  assert.match(text(tree), /Mostly\s+good/);
  assert.equal(nodes(tree).some(node => node.type === 'Pressable'), false);
  assert.doesNotMatch(JSON.stringify(tree), /Week|Month|Year|Explore|filter/);
});

test('an empty history shows one invitation card', () => {
  const Cards = loadCards();
  const tree = Cards({ insights: insights([]) });
  const titles = nodes(tree).filter(node => node.type === 'CardTitle').map(node => node.props.title);
  assert.deepEqual(titles, ['Your mood']);
  assert.match(text(tree), /Check in once/);
});

test('time of day and impacts are hidden until something was logged for them', () => {
  const Cards = loadCards();
  const tree = Cards({ insights: insights([entry('2026-10-19', 3)]) });
  const titles = nodes(tree).filter(node => node.type === 'CardTitle').map(node => node.props.title);
  assert.deepEqual(titles, ['Your mood over time', 'Mood breakdown', 'Moods during the week']);
});
