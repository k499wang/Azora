import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as mood from '../features/mood/domain/moodCheckIn.ts';
import * as moodTags from '../features/mood/domain/moodTags.ts';

function compile(url) {
  return ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
}

const compiled = compile(new URL('./MoodCheckInScreen.tsx', import.meta.url));
// The deck is loaded for real rather than stubbed. Its page gating and its
// synchronous `isLive` guard are exactly what these tests are about, and a
// stub of them would be a second implementation to keep honest.
const compiledDeck = compile(new URL('../hooks/useSlideDeck.ts', import.meta.url));
const compiledPages = compile(
  new URL('../components/common/SlideDeck.tsx', import.meta.url),
);

// Exercise screen callbacks with controlled renders, timers and animation endings.
// Native layout, gestures and animation performance still require a device.
function screen(checkIn = null) {
  const slots = [];
  let cursor = 0;
  let today = '2026-09-18';
  let tree;
  const timers = new Map();
  let timerId = 0;
  const animations = [];
  const submissions = [];
  const completed = [];
  const offered = [];
  const save = {
    isError: false,
    isPending: false,
    variables: undefined,
    mutate(variables) {
      submissions.push(variables);
      save.variables = variables;
      save.isError = false;
      save.isPending = true;
    },
    mutateAsync(variables) {
      save.mutate(variables);
      return new Promise(() => {});
    },
  };
  // Shallow, with one exception: the deck is rendered for real, because its
  // page wrappers are where the gating these tests are about actually lives.
  // Everything else stays a node so its own hooks are never run here.
  const element = (type, props) =>
    typeof type === 'function' && type.name === 'SlideDeck'
      ? type(props)
      : { type, props };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    require: requireStub,
  });

  function requireStub(name) {
      if (name.endsWith('/common/SlideDeck')) {
        const pageExports = {};
        vm.runInNewContext(compiledPages, {
          exports: pageExports,
          require: requireStub,
        });
        return pageExports;
      }
      if (name.endsWith('/useSlideDeck')) {
        const deckExports = {};
        vm.runInNewContext(compiledDeck, {
          exports: deckExports,
          require: requireStub,
        });
        return deckExports;
      }
      if (name === 'react/jsx-runtime') return { jsx: element, jsxs: element, Fragment: 'Fragment' };
      if (name === 'react') return {
        useState(initial) {
          const slot = cursor++;
          if (!(slot in slots)) slots[slot] = initial;
          return [slots[slot], value => { slots[slot] = value; }];
        },
        useRef(initial) {
          const slot = cursor++;
          return slots[slot] ??= { current: initial };
        },
        useCallback: fn => fn,
        Children: {
          // Flattens like the real one: a screen passes a mapped array and a
          // single element side by side, and those are its pages, not two.
          map: (children, fn) =>
            (Array.isArray(children) ? children : [children])
              .flat(Infinity)
              .map(fn),
        },
        useMemo: fn => fn(),
        useEffect() {},
      };
      if (name === 'react-native') return {
        View: 'View', ScrollView: 'ScrollView',
        StyleSheet: { create: value => value },
        useWindowDimensions: () => ({ width: 390, height: 844 }),
        Easing: { bezier() {} },
        Animated: {
          View: 'Animated.View',
          Value: class { interpolate() {} stopAnimation() {} },
          timing: () => ({ start: callback => animations.push(callback) }),
        },
      };
      if (name === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) };
      if (name.endsWith('/domain/moodCheckIn')) return mood;
      if (name.endsWith('/MoodScaleRow')) return { default: 'MoodScaleRow', MOOD_SELECT_SETTLE_MS: 200 };
      if (name.endsWith('/MoodTagGrid')) return { default: 'MoodTagGrid' };
      if (name.endsWith('/MoodNoteField')) return { default: 'MoodNoteField' };
      if (name.endsWith('/domain/moodTags')) return moodTags;
      if (name.includes('/components/common/')) return { default: name.split('/').at(-1), Text: 'Text' };
      if (name.endsWith('/techniques')) return { default: [{}] };
      if (name.endsWith('/useOpenBreathingTechnique')) return {};
      if (name.endsWith('/useFeatureAccess')) return { useFeatureAccess: () => ({}) };
      if (name.endsWith('/featureAccess')) return { FeatureKey: { DailyExercise: 'daily' } };
      if (name.endsWith('/useTodayLocalDate')) return { useTodayLocalDate: () => today };
      if (name.endsWith('/useMoodCheckInQuery')) return { useMoodCheckInQuery: () => ({ data: { available: true, checkIn } }) };
      if (name.endsWith('/useSaveMoodCheckInMutation')) return { useSaveMoodCheckInMutation: () => save };
      if (name.endsWith('/tracking')) return {
        trackMoodCheckInCompleted: event => completed.push(event),
        trackMoodSuggestionOffered: event => offered.push(event),
      };
      if (name.endsWith('/useFirstWinOfDay')) return { useFirstWinOfDay: () => ({ claim: () => false, release() {}, withdraw() {} }) };
      if (name.endsWith('/useAfterScreenClosed')) return { useAfterScreenClosed() {} };
      if (name.endsWith('/homeDayCompleteHandoff')) return { handDayCompleteToHome() {} };
      if (name.endsWith('/useCloseInstantly')) return { useCloseInstantly: () => () => {} };
      if (name.endsWith('/useRoomClaim')) return { useRoomClaim: () => ({ dailies: { units: [] } }) };
      if (name.endsWith('/dayUnit')) return { isLastUnfinishedDayUnit: () => false };
      if (name.endsWith('/devDayCompleteOverride')) return { takeForcedDayComplete: () => false };
      if (name.endsWith('/firstWinOfDayStore')) return { useFirstWinOfDayStore: { getState: () => ({ show() {} }) } };
      if (name.endsWith('/authStore')) return { useAuthStore: selector => selector({ user: { id: 'user-1' } }) };
      if (name.endsWith('/colors')) return { colors: { background: {}, text: {}, error: {} } };
      if (name.endsWith('/spacing')) return { padding: { screen: {} }, spacing: {} };
      if (name.endsWith('/typography')) return { fonts: {}, typography: { body: {} } };
      throw new Error(`Unexpected dependency: ${name}`);
  }
  /** The deck's page wrappers, which is where the gating lives. */
  function pages() {
    // The first Animated.View is the strip itself; the rest are its pages.
    return nodes('Animated.View').slice(1);
  }
  function nodes(type, node = tree) {
    if (Array.isArray(node)) return node.flatMap(child => nodes(type, child));
    if (!node || typeof node !== 'object') return [];
    return [...(node.type === type ? [node] : []), ...nodes(type, node.props?.children ?? null)];
  }
  function render() {
    cursor = 0;
    tree = exports.default({ navigation: { goBack() {} } });
  }
  function advance() {
    const pending = [...timers.values()];
    timers.clear();
    pending.forEach(fn => fn());
    render();
  }
  function finishSlide() {
    animations.shift()({ finished: true });
    render();
  }
  /**
   * The tags page does not answer itself, so the flow only reaches the reply
   * when its button is pressed. Skipping it is finishing it.
   */
  function skipTags(chosen = [], written = '') {
    if (chosen.length > 0) {
      nodes('MoodTagGrid')[0].props.onChange(chosen);
      render();
    }
    if (written.length > 0) {
      nodes('MoodNoteField')[0].props.onChange(written);
      render();
    }
    const label =
      chosen.length === 0 && written.trim().length === 0 ? 'Skip' : 'Done';
    nodes('ChunkyButton').find(button => button.props.label === label).props.onPress();
    render();
    finishSlide();
  }
  function finish(chosen = [], written = '') {
    for (let index = 0; index < mood.MOOD_SCALES.length; index++) {
      nodes('MoodScaleRow')[index].props.onChange(1);
      render();
      advance();
      finishSlide();
    }
    skipTags(chosen, written);
  }
  render();
  return { render, nodes, pages, advance, finishSlide, finish, skipTags, save, submissions, completed, offered, timers,
    changeDay() { today = '2026-09-19'; },
  };
}

test('outgoing and inactive question taps cannot skip a question', () => {
  const flow = screen();
  const staleAnswer = flow.nodes('MoodScaleRow')[0].props.onChange;
  staleAnswer(1);
  flow.render();
  flow.advance();
  assert.ok(flow.pages().every(page => page.props.pointerEvents === 'none'));
  staleAnswer(5);
  flow.nodes('MoodScaleRow')[0].props.onChange(5);
  flow.nodes('MoodScaleRow')[1].props.onChange(5);
  assert.equal(flow.timers.size, 0);
  flow.finishSlide();
  staleAnswer(5);
  flow.nodes('MoodScaleRow')[0].props.onChange(5);
  assert.equal(flow.timers.size, 0);
  assert.equal(flow.pages()[1].props.pointerEvents, 'auto');
  assert.equal(flow.nodes('MoodScaleRow')[0].props.value, 1);
  for (let index = 1; index < mood.MOOD_SCALES.length; index++) {
    flow.nodes('MoodScaleRow')[index].props.onChange(2);
    flow.render();
    flow.advance();
    flow.finishSlide();
  }
  flow.skipTags();
  assert.equal(flow.submissions.length, 1);
  assert.ok(mood.isCompleteMoodAnswers(flow.submissions[0].answers));
});

test('retry preserves the submitted answers and date without repeating analytics', () => {
  const flow = screen();
  flow.finish();
  const original = flow.submissions[0];
  assert.equal(flow.completed.length, 1);
  assert.equal(flow.offered.length, 1);
  flow.save.isPending = false;
  flow.save.isError = true;
  flow.changeDay();
  flow.render();
  flow.nodes('ChunkyButton').find(button => button.props.label === 'Try again').props.onPress();
  flow.render();
  assert.equal(flow.submissions.length, 2);
  assert.equal(flow.submissions[1], original);
  assert.equal(original.localDate, '2026-09-18');
  assert.equal(flow.completed.length, 1);
  assert.equal(flow.offered.length, 1);
  assert.equal(flow.nodes('ChunkyButton').some(button => button.props.label === 'Try again'), false);
});

test('revision analytics distinguish a loaded empty day from an existing check-in', () => {
  const first = screen();
  first.finish();
  assert.equal(first.completed[0].isRevision, false);
  const revision = screen({ id: 'saved-check-in' });
  revision.finish();
  assert.equal(revision.completed[0].isRevision, true);
});

test('tags ride with the ratings, cleaned and counted', () => {
  const [first, second] = moodTags.MOOD_TAGS;
  const flow = screen();
  flow.finish([second.id, first.id, 'gardening']);

  // Catalogue order, and a tag this build does not offer never reaches the row.
  assert.deepEqual(flow.submissions[0].tags, [first.id, second.id]);
  assert.equal(flow.completed[0].tagCount, 2);
});

test('skipping the tags page still stores the day', () => {
  const flow = screen();
  flow.finish();

  assert.equal(flow.submissions.length, 1);
  assert.deepEqual(flow.submissions[0].tags, []);
  assert.equal(flow.submissions[0].note, null);
  assert.equal(flow.completed[0].tagCount, 0);
  assert.ok(mood.isCompleteMoodAnswers(flow.submissions[0].answers));
});

test('a written line rides with the ratings, trimmed', () => {
  const flow = screen();
  flow.finish([], '   Long day, slept badly   ');

  assert.equal(flow.submissions[0].note, 'Long day, slept badly');
});

test('a blank line is nothing written, not an empty one', () => {
  const flow = screen();
  flow.finish([], '   ');

  assert.equal(flow.submissions[0].note, null);
});
