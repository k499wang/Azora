import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(
  readFileSync(new URL('./DailyRewardSurface.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;

function mount(platform = 'ios') {
  const exports = {};
  let presented = false;
  let effect;
  let shows = 0;
  let dismissals = 0;
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return {
        createContext: () => ({ Provider: 'Provider' }),
        useContext: () => false,
        useState: () => [presented, (value) => { presented = value; }],
        useEffect: (fn) => { effect = fn; },
      };
      if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
      if (name === 'react-native') return {
        Modal: 'Modal', View: 'View', Platform: { OS: platform }, StyleSheet: { absoluteFill: {} },
      };
      throw new Error(name);
    },
  });
  return {
    render(visible) {
      const tree = exports.default({ visible, children: 'reward',
        onShow: () => { shows++; }, onDismiss: () => { dismissals++; } });
      effect();
      return tree;
    },
    get shows() { return shows; }, get dismissals() { return dismissals; },
  };
}

test('iOS retains the modal host and reports dismissal only when native finishes', () => {
  const surface = mount();
  const opening = surface.render(true);
  assert.equal(opening.props.children.props.value, false);
  opening.props.onShow();
  assert.equal(surface.shows, 1);
  assert.equal(surface.render(true).props.children.props.value, true);
  const closing = surface.render(false);
  assert.equal(closing.type, 'Modal');
  assert.equal(closing.props.visible, false);
  assert.equal(surface.dismissals, 0);
  closing.props.onDismiss();
  assert.equal(surface.dismissals, 1);
  assert.equal(surface.render(true).props.children.props.value, false);
});

test('Android releases the next popup without waiting for an unsupported native event', () => {
  const surface = mount('android');
  surface.render(true).props.onShow();
  surface.render(false);
  assert.equal(surface.dismissals, 1);
});
