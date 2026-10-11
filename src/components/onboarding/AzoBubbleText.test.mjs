import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { splitEmphasis } from './data/azoConversation';

const bubbleSource = ts.transpileModule(
  readFileSync(new URL('./AzoBubbleText.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;

/**
 * Draws the bubble with the platform stubbed out, so the words can be read back.
 * `height` plays the platform's layout back to it, then draws it again.
 */
function render({ text, maxWidth = 284, height }) {
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const exports = {};
  let state;
  const useState = (initial) => [state ?? initial, (next) => { state = next; }];
  vm.runInNewContext(bubbleSource, {
    exports,
    require(name) {
      if (name === 'react') return { useState };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native') return { Text: 'Text', StyleSheet: { create: (value) => value } };
      if (name === '../common/Text') return { Text: 'Text' };
      if (name === '../../theme/typography') return { fonts: { regular: 'Body', semibold: 'Body-SemiBold' } };
      if (name === '../../theme/spacing') return { spacing: { sm: 8 } };
      if (name === './data/azoConversation') return { splitEmphasis };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  const props = { text, style: { fontSize: 23, lineHeight: 29 }, maxWidth };
  const first = exports.default(props);
  if (height === undefined) return first;
  first.props.onLayout({ nativeEvent: { layout: { height } } });
  return exports.default(props);
}

// Written as the runtime draws them, so a style can be compared across realms.
const stylesOf = (node) =>
  [node.props?.style].flat(Infinity).filter(Boolean).map((value) => ({ ...value }));
const wordsOf = (node) =>
  [node.props?.children]
    .flat(Infinity)
    .map((child) => {
      if (typeof child === 'string') return child;
      const nested = child?.props?.children;
      return typeof nested === 'string' ? nested : '';
    })
    .join('');
const markedRuns = (node) => [node.props?.children].flat(Infinity).filter((child) => typeof child === 'object');

const LONG_LINE =
  'I’ll build you a life reset plan, so you never have to figure out where to start.';

test('the words are drawn once, in a box capped at the room the chat leaves for a bubble', () => {
  const bubble = render({ text: LONG_LINE });

  assert.equal(bubble.type, 'Text', 'the words are one Text, with no second copy to keep in step');
  assert.deepEqual(stylesOf(bubble), [{ fontSize: 23, lineHeight: 29 }, { maxWidth: 284 }]);
  assert.equal(wordsOf(bubble), LONG_LINE, 'every word is drawn');
});

test('the cap the chat hands the bubble is the cap its words get', () => {
  const bubble = render({ text: 'sometimes', maxWidth: 200 });
  assert.deepEqual(stylesOf(bubble), [{ fontSize: 23, lineHeight: 29 }, { maxWidth: 200 }]);
});

test('nothing on the drawn words can cut a line off or hold the box short', () => {
  const bubble = render({ text: LONG_LINE });
  const carried = stylesOf(bubble).flatMap((value) => Object.keys(value));

  for (const cut of ['height', 'maxHeight']) {
    assert.equal(carried.includes(cut), false, `${cut} would fix the box while the words still need room`);
  }
  assert.equal(bubble.props.numberOfLines, undefined, 'a line count would clip whatever did not fit');
  assert.equal(bubble.props.ellipsizeMode, undefined);
});

test('once laid out, the words get spare height to draw into, without growing the bubble', () => {
  const bubble = render({ text: LONG_LINE, height: 87 });
  assert.deepEqual(stylesOf(bubble), [
    { fontSize: 23, lineHeight: 29 },
    { maxWidth: 284 },
    { minHeight: 95, marginBottom: -8 },
  ]);
});

test('emphasis marks its words inside the one Text, and carries no cap of its own', () => {
  const text = 'I’ll build you a **life reset plan**, so you never have to figure out where to start.';
  const bubble = render({ text });

  const marked = markedRuns(bubble);
  assert.deepEqual(marked.map(wordsOf), ['life reset plan']);
  assert.deepEqual(stylesOf(marked[0]), [{ fontFamily: 'Body-SemiBold' }], 'a marked run is never given a width of its own to be cut at');
  assert.equal(wordsOf(bubble), text.replaceAll('**', ''), 'the markup never reaches the screen');
});
