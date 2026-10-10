import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('./ActivityRewardScreen.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source + '\nexport { TodoClaimReward, ConfirmedActivityReward };', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup(claim) {
  const exports = {};
  const sounds = [];
  const flights = [];
  const handed = [];
  let closedHome = 0;
  let backed = 0;
  let canCelebrate = true;
  const navigation = { goBack: () => { backed++; } };
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    useCallback: (fn) => fn,
    useEffect: (effect) => { effect(); },
    useRef: (current) => ({ current }),
    useOpeningTransitionComplete: () => true,
    useCompletionSound: (...args) => { sounds.push(args); },
    useCompletionHaptic: () => {},
    useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
    useReducedMotion: () => false,
    useTodoClaimReward: () => claim,
    useAuthStore: (select) => select({ user: { id: 'user' } }),
    useCoinRewardFlight: ({ coins }) => { flights.push(coins); return {}; },
    useShareActivityResult: () => () => {},
    getActivityResultCopy: () => ({ title: 'Result', subtitle: 'Saved', shareMessage: 'share' }),
    useCloseOntoHome: () => () => { closedHome++; },
    useAfterScreenClosed: () => {},
    handDayCompleteToHome: (id) => handed.push(id),
    rewardCardEnterAt: () => 500,
    REWARD_BEAT: { cta: 660 },
    colors: { background: { canvas: 'canvas' }, primary: { blue500: 'blue' } },
    spacing: { sm: 8, md: 16 },
    padding: { screen: { horizontal: 18 } },
  };
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === 'react-native') return {
        View: 'View', ActivityIndicator: 'ActivityIndicator',
        StyleSheet: { create: (style) => style },
        BackHandler: { addEventListener: () => ({ remove() {} }) },
      };
      return { ...dependencies, default: name, GlassIconButton: 'GlassIconButton', EarnedCoinsCard: 'EarnedCoinsCard', Land: 'Land' };
    },
  });
  function labels(tree) {
    if (!tree) return [];
    return [tree.props?.label, ...[tree.props?.children].flat().flatMap(labels)].filter(Boolean);
  }
  return {
    exports, sounds, flights, handed, navigation, labels,
    closedHome: () => closedHome, backed: () => backed,
    invalidateDay: () => { canCelebrate = false; },
    resolveDay: () => canCelebrate ? 'todo:claim' : undefined,
  };
}

test('pending and failed claims show no coin reward, sound or Continue before confirmation', () => {
  for (const failed of [false, true]) {
    const harness = setup({ response: null, failed, canRetry: true, retry() {} });
    const tree = harness.exports.TodoClaimReward({ navigation: harness.navigation, request: {} });
    assert.deepEqual(harness.labels(tree), failed ? ['Try again', 'Back'] : ['Back']);
    assert.equal(harness.sounds.length, 0);
    assert.equal(harness.flights.length, 0);
    assert.equal(harness.handed.length, 0);
  }
});

test('only recorded claims mount reward content, with exactly the server coin award', () => {
  for (const coinsAwarded of [10, 0]) {
    const harness = setup({ response: { outcome: 'recorded', coinsAwarded }, getDayCompleteUnitId: () => undefined });
    const tree = harness.exports.TodoClaimReward({ navigation: harness.navigation, request: {} });
    assert.equal(tree.type, harness.exports.ConfirmedActivityReward);
    assert.equal(tree.props.params.coins, coinsAwarded);
    assert.equal(tree.props.openingTransitionComplete, true);
    harness.exports.ConfirmedActivityReward(tree.props);
    assert.deepEqual(harness.flights, [coinsAwarded]);
    assert.equal(harness.sounds[0][1].autoPlay, true);
  }
});

test('Continue rechecks the live day before handing it to Home and runs once', () => {
  for (const change of [false, true]) {
    const harness = setup({});
    const tree = harness.exports.ConfirmedActivityReward({
      navigation: harness.navigation, params: { kind: 'todo', coins: 10 },
      resolveDayCompleteUnitId: harness.resolveDay, openingTransitionComplete: true,
    });
    const footer = tree.props.children[2];
    const onContinue = footer.props.children.props.children.props.onPress;
    if (change) harness.invalidateDay();
    onContinue(); onContinue();
    assert.deepEqual(harness.handed, change ? [] : ['todo:claim']);
    assert.equal(harness.closedHome(), change ? 0 : 1);
    assert.equal(harness.backed(), change ? 1 : 0);
  }
});

test('pending claims open without a fade; confirmed activity routes keep their existing transition', () => {
  const path = '../app/navigation/RootNavigator.tsx';
  const code = readFileSync(new URL(path, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression;
  function visit(node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === 'Stack.Screen') {
      const attributes = node.attributes.properties;
      if (attributes.some((attribute) => attribute.name?.getText(ast) === 'name' && attribute.initializer?.text === 'ActivityReward')) {
        expression = attributes.find((attribute) => attribute.name?.getText(ast) === 'options').initializer.expression.getText(ast);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expression);
  const options = vm.runInNewContext('(' + expression + ')');
  assert.equal(options({ route: { params: { kind: 'todo', claim: {} } } }).animation, 'none');
  for (const kind of ['todo', 'lesson', 'mood', 'reset']) {
    assert.equal(options({ route: { params: { kind, coins: 10 } } }).animation, 'fade');
  }
});
