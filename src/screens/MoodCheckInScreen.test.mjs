import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as mood from '../features/mood/domain/moodCheckIn.ts';
import * as moodTags from '../features/mood/domain/moodTags.ts';
import * as moodFeelings from '../features/mood/domain/moodFeelings.ts';
import * as moodPattern from '../features/mood/domain/moodPattern.ts';
import * as moodActions from '../features/mood/domain/moodActions.ts';
import * as moodInsights from '../features/plan/domain/moodInsights.ts';

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
const compiledInsights = compile(new URL('../features/plan/useMoodInsights.ts', import.meta.url));
const compiledPages = compile(
  new URL('../components/common/SlideDeck.tsx', import.meta.url),
);

// Exercise screen callbacks with controlled renders, timers and animation endings.
// Native layout, gestures and animation performance still require a device.
function screen(checkIn = null, recent = undefined) {
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
  const accepted = [];
  const insightsViewed = [];
  const declined = [];
  const createdGoals = [];
  const navigation = {
    left: [],
    goBack() { navigation.left.push('back'); },
    replace(route, params) { navigation.left.push({ route, params }); },
  };
  const createGoals = {
    isError: false,
    isPending: false,
    failNext: false,
    async mutateAsync(drafts) {
      createdGoals.push(drafts);
      if (createGoals.failNext) {
        createGoals.isError = true;
        throw new Error('offline');
      }
      return [];
    },
  };
  const supportShown = [];
  const supportTapped = [];
  const opened = [];
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
      if (name.endsWith('/useMoodInsights')) {
        const insightExports = {};
        vm.runInNewContext(compiledInsights, { exports: insightExports, require: requireStub });
        return insightExports;
      }
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
        View: 'View', ScrollView: 'ScrollView', KeyboardAvoidingView: 'KeyboardAvoidingView',
        Keyboard: { addListener: () => ({ remove() {} }) }, Platform: { OS: 'ios' },
        Linking: { openURL: url => { opened.push(url); return Promise.resolve(); } },
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
      if (name === 'react-native-reanimated') return {
        default: { View: 'Reanimated.View' },
        useSharedValue: value => ({ value }),
        useAnimatedStyle: () => ({}),
        withTiming: value => value,
      };
      if (name.endsWith('/CuteMoodFace')) return { moodTint: () => '' };
      if (name.endsWith('/MoodFaceSlider')) return { default: 'MoodFaceSlider', MOOD_SELECT_SETTLE_MS: 200 };
      if (name.endsWith('/MoodTagGrid')) return { default: 'MoodTagGrid' };
      if (name.endsWith('/MoodFeelingGrid')) return { default: 'MoodFeelingGrid' };
      if (name.endsWith('/domain/moodFeelings')) return moodFeelings;
      if (name.endsWith('/domain/moodPattern')) return moodPattern;
      if (name.endsWith('/useRecentMoodCheckInsQuery')) return { useRecentMoodCheckInsQuery: () => ({ data: recent }) };
      if (name.endsWith('/MoodJournalCard')) return { default: 'MoodJournalCard' };
      if (name.endsWith('/domain/moodPrompts')) return { moodJournalPrompts: () => ['Prompt'] };
      if (name.endsWith('/useProgramEnrollmentQuery')) return { useProgramEnrollmentQuery: () => ({ data: null }) };
      if (name.endsWith('/domain/moodTags')) return moodTags;
      if (name.includes('/components/common/')) return { default: name.split('/').at(-1), Text: 'Text' };
      if (name.endsWith('/MoodActionPicker')) return { default: 'MoodActionPicker' };
      if (name.endsWith('/domain/moodActions')) return moodActions;
      if (name.endsWith('/PlanAnalyticsSection')) return { MoodInsightCards: 'MoodInsightCards' };
      if (name.endsWith('/domain/moodInsights') || name === './domain/moodInsights') return moodInsights;
      if (name.endsWith('/useCreateSelfCareGoalsMutation')) return { useCreateSelfCareGoalsMutation: () => createGoals };
      if (name.endsWith('/useTodayLocalDate')) return { useTodayLocalDate: () => today };
      if (name.endsWith('/useMoodCheckInQuery')) return { useMoodCheckInQuery: () => ({ data: { available: true, checkIn } }) };
      if (name.endsWith('/useSaveMoodCheckInMutation')) return { useSaveMoodCheckInMutation: () => save };
      if (name.endsWith('/tracking')) return {
        trackMoodCheckInCompleted: event => completed.push(event),
        trackMoodSuggestionOffered: event => offered.push(event),
        trackMoodSuggestionAccepted: event => accepted.push(event),
        trackMoodInsightsViewed: event => insightsViewed.push(event),
        trackMoodSuggestionDeclined: event => declined.push(event),
        trackMoodSupportLinkShown: event => supportShown.push(event),
        trackMoodSupportLinkTapped: event => supportTapped.push(event),
      };
      if (name.endsWith('/useFirstWinOfDay')) return { useFirstWinOfDay: () => ({ claim: () => false, release() {}, withdraw() {} }) };
      if (name.endsWith('/useAfterScreenClosed')) return { useAfterScreenClosed() {} };
      if (name.endsWith('/homeDayCompleteHandoff')) return { handDayCompleteToHome() {} };
      if (name.endsWith('/useCloseOntoHome')) return { useCloseOntoHome: () => () => {} };
      if (name.endsWith('/RewardAnimationPreload')) return { default: 'RewardAnimationPreload' };
      if (name.endsWith('/useRoomClaim')) return { useRoomClaim: () => ({ dailies: { units: [] } }) };
      if (name.endsWith('/dayUnit')) return { isLastUnfinishedDayUnit: () => false };
      if (name.endsWith('/roomProgress')) return { hasPieceToEarn: () => false };
      if (name.endsWith('/devDayCompleteOverride')) return { takeForcedDayComplete: () => false };
      if (name.endsWith('/firstWinOfDayStore')) return { useFirstWinOfDayStore: { getState: () => ({ show() {} }) } };
      if (name.endsWith('/wallet/coins')) return { EARN_RATES: { planActivity: 20, lessonOrCheckIn: 10 } };
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
    tree = exports.default({ navigation });
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
   * The tags and journal pages do not answer themselves, so the flow only
   * reaches the reply when their buttons are pressed. Skipping is finishing.
   */
  function skipTags(chosen = [], written = '') {
    if (chosen.length > 0) {
      nodes('MoodTagGrid')[0].props.onChange(chosen);
      render();
    }
    const tagsLabel = chosen.length === 0 ? 'Skip' : 'Next';
    nodes('ChunkyButton').find(button => button.props.label === tagsLabel).props.onPress();
    render();
    finishSlide();
    if (written.length > 0) {
      nodes('MoodJournalCard')[0].props.onChange(written);
      render();
    }
    const journalLabel = written.trim().length === 0 ? 'Skip' : 'Done';
    const journalPage = pages()[mood.MOOD_SCALES.length + 2];
    nodes('ChunkyButton', journalPage).find(button => button.props.label === journalLabel).props.onPress();
    render();
    finishSlide();
  }
  /** One tap on the feeling page; null is "Not sure". */
  function pickFeeling(feeling = null) {
    nodes('MoodFeelingGrid')[0].props.onChange(feeling);
    render();
    advance();
    finishSlide();
  }
  function finish(chosen = [], written = '', { rating = 1, feeling = null } = {}) {
    for (let index = 0; index < mood.MOOD_SCALES.length; index++) {
      nodes('MoodFaceSlider')[index].props.onChange(rating);
      render();
      advance();
      finishSlide();
    }
    pickFeeling(feeling);
    skipTags(chosen, written);
  }
  function texts() {
    return nodes('Text').map(node => node.props.children);
  }
  render();
  return { render, nodes, pages, texts, advance, finishSlide, finish, pickFeeling, skipTags, save, submissions, completed, offered, accepted, declined, insightsViewed, createGoals, createdGoals, navigation, supportShown, supportTapped, opened, timers,
    changeDay() { today = '2026-09-19'; },
  };
}

test('Your mood advances directly to feelings and stores only the mood rating', () => {
  const flow = screen(null, []);
  assert.deepEqual(mood.MOOD_SCALES.map(scale => scale.id), ['overall']);
  assert.ok(flow.texts().includes('How are you feeling?'));
  assert.ok(!flow.texts().some(text => typeof text === 'string' && /your energy|did you sleep/i.test(text)));
  flow.nodes('MoodFaceSlider')[0].props.onChange(4);
  flow.render();
  flow.advance();
  flow.finishSlide();
  assert.equal(flow.pages()[1].props.pointerEvents, 'auto');
  assert.ok(flow.nodes('MoodFeelingGrid')[0].props.words.some(word => word.id === 'calm'));
  flow.pickFeeling('calm');
  flow.skipTags();
  assert.deepEqual(Object.keys(flow.submissions[0].answers), ['overall']);
});

test('outgoing and inactive question taps cannot skip a question', () => {
  const flow = screen();
  const staleAnswer = flow.nodes('MoodFaceSlider')[0].props.onChange;
  staleAnswer(1);
  flow.render();
  flow.advance();
  assert.ok(flow.pages().every(page => page.props.pointerEvents === 'none'));
  staleAnswer(5);
  flow.nodes('MoodFaceSlider')[0].props.onChange(5);
  flow.nodes('MoodFeelingGrid')[0].props.onChange('happy');
  assert.equal(flow.timers.size, 0);
  flow.finishSlide();
  staleAnswer(5);
  flow.nodes('MoodFaceSlider')[0].props.onChange(5);
  assert.equal(flow.timers.size, 0);
  assert.equal(flow.pages()[1].props.pointerEvents, 'auto');
  assert.equal(flow.nodes('MoodFaceSlider')[0].props.value, 1);
  for (let index = 1; index < mood.MOOD_SCALES.length; index++) {
    flow.nodes('MoodFaceSlider')[index].props.onChange(2);
    flow.render();
    flow.advance();
    flow.finishSlide();
  }
  flow.pickFeeling();
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

test('the feeling page offers the words the ratings chose, and Not sure stores nothing', () => {
  const flow = screen();
  flow.finish();

  assert.equal(flow.submissions[0].feeling, null);
  assert.equal(flow.completed[0].feeling, null);
  assert.equal(flow.completed[0].feelingSet, 'low');
});

test('a picked word rides with the ratings and picks the offered actions', () => {
  const flow = screen();
  flow.finish([], '', { feeling: 'anxious' });

  assert.equal(flow.submissions[0].feeling, 'anxious');
  assert.equal(flow.completed[0].feeling, 'anxious');
  assert.equal(flow.offered[0].answering, 'anxious');
  assert.equal(flow.offered[0].actionIds.length, 3);
  assert.ok(flow.texts().some(text => typeof text === 'string' && text === 'Feeling anxious'));
});

test('every check-in offers three actions, a good day included', () => {
  const flow = screen(null, []);
  flow.finish([], '', { rating: 5, feeling: 'happy' });

  assert.equal(flow.offered.length, 1);
  assert.equal(flow.nodes('MoodActionPicker')[0].props.actions.length, 3);
});

test('Add to my day saves the picked actions as today-only to-dos, then shows the insights', async () => {
  const flow = screen();
  flow.finish();
  const add = () => flow.nodes('ChunkyButton').find(button => button.props.label === 'Add to my day');
  assert.equal(add().props.disabled, true);

  const picker = flow.nodes('MoodActionPicker')[0];
  const [first, , third] = picker.props.actions;
  picker.props.onChange([third.id, first.id]);
  flow.render();
  assert.equal(add().props.disabled, false);
  await add().props.onPress();
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(JSON.parse(JSON.stringify(flow.createdGoals[0])), [first, third].map(action => ({
    title: action.title,
    icon: action.icon,
    recurrence: 'once',
    scheduledTime: null,
  })));
  assert.deepEqual([...flow.accepted[0].actionIds], [first.id, third.id]);
  flow.render();
  flow.finishSlide();
  assert.equal(flow.navigation.left.length, 0);
  assert.equal(flow.pages().at(-1).props.pointerEvents, 'auto');
});

test('a failed add stays on the page and says so', async () => {
  const flow = screen();
  flow.finish();
  const picker = flow.nodes('MoodActionPicker')[0];
  picker.props.onChange([picker.props.actions[0].id]);
  flow.render();
  flow.createGoals.failNext = true;
  flow.nodes('ChunkyButton').find(button => button.props.label === 'Add to my day').props.onPress();
  await new Promise(resolve => setImmediate(resolve));
  flow.render();

  assert.equal(flow.accepted.length, 0);
  assert.equal(flow.navigation.left.length, 0);
  assert.ok(flow.texts().includes('That didn’t add. Check your connection and try again.'));
});

test('No thanks records the decline and shows the insights, whose Done leaves', () => {
  const flow = screen();
  flow.finish();
  flow.nodes('ChunkyButton').find(button => button.props.label === 'No thanks').props.onPress();

  assert.deepEqual([...flow.declined[0].actionIds], [...flow.offered[0].actionIds]);
  flow.render();
  flow.finishSlide();
  assert.equal(flow.navigation.left.length, 0);
  assert.equal(flow.pages().at(-1).props.pointerEvents, 'auto');

  flow.nodes('ChunkyButton').filter(button => button.props.label === 'Done').at(-1).props.onPress();
  assert.equal(flow.navigation.left.length, 1);
});

test('a first-ever check-in shows its mood immediately without Reset or weekly cards', () => {
  const flow = screen(null, []);
  flow.finish();
  flow.nodes('ChunkyButton').find(button => button.props.label === 'No thanks').props.onPress();
  flow.render();
  flow.finishSlide();

  const cards = flow.nodes('MoodInsightCards')[0].props;
  assert.equal(cards.insights.review, undefined);
  assert.equal(cards.insights.reset, undefined);
  assert.equal(cards.insights.trend.length, 14);
  assert.equal(cards.insights.trend.filter(point => point.value != null).length, 1);
  assert.equal(cards.insights.trend.at(-1).localDate, '2026-09-18');
  assert.ok(flow.texts().includes('Your insights'));
  assert.ok(!flow.texts().some(text => typeof text === 'string' && /unlock/i.test(text)));
  assert.deepEqual([...flow.insightsViewed[0].cards], ['trend']);
  assert.equal(flow.insightsViewed[0].checkInDays, 1);
});

test('fresh mood and feeling are reflected while the save is still pending', () => {
  const flow = screen(null, []);
  flow.finish(['work'], '', { rating: 4, feeling: 'proud' });
  assert.equal(flow.save.isPending, true);
  flow.nodes('ChunkyButton').find(button => button.props.label === 'No thanks').props.onPress();
  flow.render();
  flow.finishSlide();
  const cards = flow.nodes('MoodInsightCards')[0].props;
  assert.equal(cards.insights.checkInCount, 1);
  assert.equal(cards.insights.trend.at(-1).value, 4);
  assert.equal(cards.insights.feelings[0].feelingId, 'proud');
  assert.deepEqual([...flow.insightsViewed[0].cards], ['trend', 'reasons', 'feelings']);
  assert.equal(cards.insights.impacts[0].tagId, 'work');
});

test('the insights view is recorded once', async () => {
  const flow = screen(null, []);
  flow.finish();
  const picker = flow.nodes('MoodActionPicker')[0];
  picker.props.onChange([picker.props.actions[0].id]);
  flow.render();
  flow.createGoals.failNext = true;
  await flow.nodes('ChunkyButton').find(button => button.props.label === 'Add to my day').props.onPress();
  flow.render();
  assert.equal(flow.insightsViewed.length, 0);

  flow.createGoals.failNext = false;
  await flow.nodes('ChunkyButton').find(button => button.props.label === 'Add to my day').props.onPress();
  flow.render();
  flow.nodes('ChunkyButton').find(button => button.props.label === 'No thanks').props.onPress();
  assert.equal(flow.insightsViewed.length, 1);
});

test('a stale tap on the feeling page cannot skip the tags', () => {
  const flow = screen();
  for (let index = 0; index < mood.MOOD_SCALES.length; index++) {
    flow.nodes('MoodFaceSlider')[index].props.onChange(3);
    flow.render();
    flow.advance();
    flow.finishSlide();
  }
  const pick = flow.nodes('MoodFeelingGrid')[0].props.onChange;
  pick('fine');
  flow.render();
  flow.advance();
  pick('meh');
  assert.equal(flow.timers.size, 0);
  flow.finishSlide();
  pick('meh');
  assert.equal(flow.timers.size, 0);
  flow.skipTags();
  assert.equal(flow.submissions[0].feeling, 'fine');
});

test('hopeless shows the support link, which opens the directory', () => {
  const flow = screen();
  flow.finish([], '', { feeling: 'hopeless' });

  assert.ok(flow.texts().includes(mood.moodSupportLine('hopeless')));
  const link = flow.nodes('ChunkyButton').find(button => button.props.label === 'Find someone to talk to');
  link.props.onPress();
  assert.deepEqual(flow.opened, [mood.MOOD_SUPPORT_URL]);
  assert.equal(flow.supportTapped.length, 1);
  assert.equal(flow.supportTapped[0].reason, 'hopeless');
});

test('no support link on an ordinary day', () => {
  const flow = screen(null, []);
  flow.finish([], '', { rating: 4, feeling: 'happy' });

  assert.equal(
    flow.nodes('ChunkyButton').some(button => button.props.label === 'Find someone to talk to'),
    false,
  );
});

test('two earlier low days make today a run, with today standing in for its stored row', () => {
  const flow = screen(null, [
    { localDate: '2026-09-18', score: 100, tags: [] },
    { localDate: '2026-09-17', score: 0, tags: [] },
    { localDate: '2026-09-15', score: 10, tags: [] },
  ]);
  flow.finish();

  assert.ok(flow.texts().includes(mood.moodSupportLine('hard-run')));
});


test('insights aggregate all time including the fresh check-in', () => {
  const flow = screen(null, []);
  flow.finish(['work'], '', { rating: 4, feeling: 'proud' });
  flow.nodes('ChunkyButton').find(button => button.props.label === 'No thanks').props.onPress();
  flow.render();
  flow.finishSlide();
  const cards = flow.nodes('MoodInsightCards')[0].props;
  assert.deepEqual(Object.keys(cards), ['insights']);
  assert.equal(cards.insights.checkInCount, 1);
  assert.equal(cards.insights.usualLevel, 4);
  assert.equal(cards.insights.trend.at(-1).value, 4);
  assert.equal(cards.insights.feelings[0].feelingId, 'proud');
  assert.equal(cards.insights.impacts[0].tagId, 'work');
});
