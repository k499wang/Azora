import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as tags from './domain/moodTags.ts';

const source = ts.transpileModule(readFileSync(new URL('./MoodTagGrid.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports = {};
vm.runInNewContext(source, { exports, require(name) {
  if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
  if (name === 'react-native') return { View: 'View', StyleSheet: { create: value => value } };
  if (name === './MoodChip') return { default: 'MoodChip' };
  if (name.endsWith('/Text')) return { Text: 'Text' };
  if (name.endsWith('/moodTags')) return tags;
  if (name.endsWith('/spacing')) return { spacing: {} };
  if (name.endsWith('/colors')) return { colors: { text: {} } };
  if (name.endsWith('/typography')) return { fonts: {}, typography: { body: {} } };
  throw new Error(name);
} });
function nodes(tree, type) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, type));
  return [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
}

test('context picker renders each group and keeps one global selection limit', () => {
  const selected = ['work', 'friends', 'home', 'exercise', 'partner'];
  let next;
  const tree = exports.default({ selected, onChange: value => { next = value; } });
  const text = nodes(tree, 'Text').map(node => node.props.children);
  for (const group of tags.MOOD_TAG_GROUPS) assert.ok(text.includes(group.label));
  const chips = nodes(tree, 'MoodChip');
  const cafe = chips.find(chip => chip.props.label === 'Café');
  assert.equal(cafe.props.disabled, true);
  cafe.props.onPress();
  assert.equal(next, undefined);
  const partner = chips.find(chip => chip.props.label === 'Partner');
  assert.equal(partner.props.disabled, false);
  partner.props.onPress();
  assert.deepEqual([...next], ['work', 'friends', 'home', 'exercise']);
});

test('new context options can be added without making any group mandatory', () => {
  let next;
  const tree = exports.default({ selected: [], onChange: value => { next = value; } });
  nodes(tree, 'MoodChip').find(chip => chip.props.label === 'Workplace').props.onPress();
  assert.deepEqual([...next], ['workplace']);
});
