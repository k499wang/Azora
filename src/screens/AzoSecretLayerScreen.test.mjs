import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const javascript = ts.transpileModule(
  readFileSync(new URL('./AzoSecretLayerScreen.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText;

const offering = { identifier: 'live-annual', title: 'Annual and monthly', packageCount: 2, hasFirstPlan: true, hasShortPlan: true };

function harness(initialUserId = 'user-1', availableOfferings = [offering]) {
  let userId = initialUserId, cursor = 0, dirty = false, tree;
  const slots = [], effects = [], queries = [], navigations = [];
  const jsx = (type, props) => ({ type, props });
  const getOfferings = async () => availableOfferings;
  const same = (a, b) => a?.length === b?.length && a.every((value, index) => Object.is(value, b[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value) => {
        const next = typeof value === 'function' ? value(slots[index]) : value;
        if (!Object.is(slots[index], next)) { slots[index] = next; dirty = true; }
      }];
    },
    useEffect(callback, dependencies) {
      const index = cursor++;
      if (!same(slots[index], dependencies)) {
        slots[index] = dependencies;
        effects.push(callback);
      }
    },
  };
  const colors = { primary: {}, background: {}, text: {}, error: {}, border: {}, neutral: {} };
  const dependencies = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    '@tanstack/react-query': {
      useQuery(options) {
        queries.push(options);
        return { data: availableOfferings, isPending: false, isError: false, isSuccess: true, isFetching: false, refetch: async () => {} };
      },
    },
    'react-native': { View: 'View', ActivityIndicator: 'ActivityIndicator', Keyboard: { dismiss() {} }, StyleSheet: { create: (value) => value } },
    'react-native-reanimated': { default: { FlatList: 'FlatList' } },
    '../components/common/CollapsingTitleBar': { default: 'CollapsingTitleBar', CollapsingBackTitle: 'BackTitle', useCollapsingTitle: () => ({}) },
    '../components/common/ChunkyButton': { default: 'Button' },
    '../components/common/ScreenContent': { default: 'ScreenContent' },
    '../components/common/SectionHeader': { default: 'SectionHeader' },
    '../components/common/Text': { Text: 'Text', TextInput: 'TextInput' },
    '../components/common/icons/Icon': { default: 'Icon' },
    '../components/settings/SettingsGroup': { default: 'SettingsGroup' },
    '../components/settings/SettingsRow': { default: 'SettingsRow' },
    '../services/paywall': { getPaywallReviewOfferings: getOfferings, PaywallPlacement: { ProfileUpgrade: 'profile_upgrade' } },
    '../stores/authStore': { useAuthStore: (selector) => selector({ user: userId == null ? null : { id: userId } }) },
    '../theme/colors': { colors },
    '../theme/card': { radius: {} },
    '../theme/spacing': { padding: { screen: {} }, spacing: {} },
    '../theme/typography': { fonts: {}, typography: { body: {}, heading: {}, caption: {}, title: {} } },
  };
  const exports = {};
  vm.runInNewContext(javascript, { exports, require: (name) => {
    assert.ok(name in dependencies, `Unexpected import ${name}`);
    return dependencies[name];
  } });
  const screen = exports.default;
  const find = (predicate, node = tree) => {
    if (node == null || typeof node !== 'object') return undefined;
    if (predicate(node)) return node;
    const children = [node.props?.children, node.props?.ListHeaderComponent, node.props?.ListFooterComponent].flat(Infinity);
    for (const child of children) {
      if (child == null) continue;
      const result = find(predicate, child);
      if (result != null) return result;
    }
    return undefined;
  };
  const render = () => {
    let attempts = 0;
    do {
      assert.ok(attempts++ < 20, 'screen settles');
      cursor = 0; dirty = false;
      tree = screen({ navigation: { navigate: (...args) => navigations.push(args) } });
      while (effects.length) effects.shift()();
    } while (dirty);
    return tree;
  };
  render();
  return {
    queries, navigations, getOfferings, render,
    component: (type) => find((node) => node.type === type),
    row: (label) => find((node) => node.type === 'SettingsRow' && node.props.label === label),
    text: (value) => find((node) => node.type === 'Text' && node.props.children === value),
    setUser(value) { userId = value; render(); },
    enterPassword(value) { find((node) => node.type === 'TextInput').props.onChangeText(value); render(); },
    unlock(value = 'azo-review') {
      this.enterPassword(value);
      find((node) => node.type === 'Button' && node.props.label === 'Unlock').props.onPress();
      render();
    },
    chooseOffering(index = 0) {
      const list = find((node) => node.type === 'FlatList');
      const rendered = list.props.renderItem({ item: list.props.data[index] });
      find((node) => node.type === 'SettingsRow', rendered).props.onPress();
      render();
    },
  };
}

test('the password gate keeps real offerings unavailable until the correct password is supplied', () => {
  const screen = harness();
  assert.equal(screen.component('TextInput').props.secureTextEntry, true);
  assert.equal(screen.queries.at(-1).enabled, false);
  assert.equal(screen.component('FlatList').props.data.length, 0);
  screen.unlock('incorrect');
  assert.ok(screen.text('That password did not work. Try again.'));
  assert.equal(screen.queries.at(-1).enabled, false);
  screen.unlock();
  assert.equal(screen.component('TextInput'), undefined);
  assert.equal(screen.queries.at(-1).enabled, true);
  assert.equal(screen.queries.at(-1).queryFn, screen.getOfferings);
  assert.equal(screen.component('FlatList').props.data[0], offering);
});

test('changing or signing out of the account closes the gate and clears the selected offer', () => {
  const screen = harness();
  screen.unlock(); screen.chooseOffering();
  screen.setUser('user-2');
  assert.equal(screen.queries.at(-1).enabled, false);
  assert.ok(screen.component('TextInput'));
  assert.equal(screen.row('Original offer'), undefined);
  screen.setUser('user-1');
  assert.equal(screen.queries.at(-1).enabled, false);
  screen.unlock(); screen.setUser(null);
  assert.equal(screen.queries.at(-1).enabled, false);
  assert.equal(screen.component('Button').props.disabled, true);
});

test('all variants open the actual offering and multi-plan layouts clear single-plan metadata', () => {
  const screen = harness();
  screen.unlock(); screen.chooseOffering();
  screen.row('Original offer').props.onPress();
  const original = screen.navigations.at(-1);
  assert.equal(original[0], 'ProPaywall');
  assert.equal(original[1].review.offeringIdentifier, offering.identifier);
  assert.equal(original[1].review.onlyPackageId, undefined);
  screen.row('Plan selection, side by side').props.onPress();
  const sideBySide = screen.navigations.at(-1)[1];
  assert.equal(sideBySide.placement, 'profile_upgrade');
  assert.equal(sideBySide.review.planPicker, 'side_by_side');
  assert.equal(sideBySide.review.onlyPackageId, null);
  assert.equal(sideBySide.review.initialStep, 'plan');
  screen.row('First plan only').props.onPress();
  assert.equal(screen.navigations.at(-1)[1].review.onlyPackageId, 'annual');
  screen.row('Short plan only').props.onPress();
  assert.equal(screen.navigations.at(-1)[1].review.onlyPackageId, 'monthly');
  screen.row('Welcome gift').props.onPress();
  assert.equal(screen.navigations.at(-1)[0], 'ExitOffer');
  assert.equal(screen.navigations.at(-1)[1].variant, 'gift');
});

test('single-plan selectors are hidden when that offering has no matching package', () => {
  const screen = harness('user-1', [{ ...offering, hasFirstPlan: false, hasShortPlan: true }]);
  screen.unlock(); screen.chooseOffering();
  assert.equal(screen.row('First plan only'), undefined);
  assert.ok(screen.row('Short plan only'));
});
