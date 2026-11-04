import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const compiled = ts.transpileModule(
  readFileSync(new URL('./CoachingInvitationDialog.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;

function render(props) {
  const element = (type, elementProps) => ({ type, props: elementProps });
  const stubs = {
    'react/jsx-runtime': { jsx: element, jsxs: element },
    'react-native': {
      ScrollView: 'ScrollView',
      View: 'View',
      StyleSheet: { create: (styles) => styles },
    },
    '../../components/common/Text': { Text: 'Text' },
    '../../components/common/CenterDialog': { default: 'CenterDialog' },
    '../../components/common/ChunkyButton': { default: 'ChunkyButton', CHUNKY_TONE_SOFT: {} },
    '../../theme/colors': { colors: { text: {} } },
    '../../theme/spacing': { spacing: {} },
    '../../theme/typography': {
      fonts: {},
      typography: { heading: { heading1: {} }, body: { medium: {} } },
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: (name) => stubs[name],
  });
  return module.exports.default(props);
}

function find(node, type) {
  if (node == null || typeof node !== 'object') return [];
  const children = [node.props?.children].flat();
  return [
    ...(node.type === type ? [node] : []),
    ...children.flatMap((child) => find(child, type)),
  ];
}

test('shows the approved invitation copy, price included', () => {
  const tree = render({ visible: true, onExplore() {}, onClose() {} });
  const text = find(tree, 'Text').map((node) => node.props.children);

  assert.equal(text[0], 'Want more personal support?');
  assert.equal(
    text[1],
    'Work one-on-one with an Azora coach on what matters to you. Get a personalized plan, weekly written support, and a monthly call for $79 USD/month, in addition to your Azora subscription.',
  );
});

test('each way out reaches its own handler', () => {
  const calls = [];
  const onExplore = () => calls.push('explore');
  const onClose = () => calls.push('close');
  const tree = render({ visible: true, onExplore, onClose });
  const [explore, notNow] = find(tree, 'ChunkyButton');

  assert.equal(explore.props.label, 'Explore coaching');
  assert.equal(notNow.props.label, 'Not now');
  explore.props.onPress();
  notNow.props.onPress();
  tree.props.onClose();
  assert.deepEqual(calls, ['explore', 'close', 'close']);
});
