import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CommonActions,
  StackActions,
  StackRouter,
} from '@react-navigation/routers';
import { returnToHome } from './returnToHome.ts';

const routeNames = [
  'MainTabs',
  'Explore',
  'ExerciseSearch',
  'ExerciseSession',
  'SessionComplete',
  'DailyExercise',
  'DailyResult',
];

function createStackHarness() {
  const router = StackRouter({});
  const options = {
    routeNames,
    routeParamList: {},
    routeGetIdList: {},
  };
  let state = router.getInitialState(options);

  const dispatch = (action) => {
    const nextState = router.getStateForAction(state, action, options);
    assert.notEqual(nextState, null, `router rejected ${action.type}`);
    state = nextState;
  };

  return {
    navigation: {
      navigate(...args) {
        dispatch(CommonActions.navigate(...args));
      },
      replace(name, params) {
        dispatch({
          ...StackActions.replace(name, params),
          source: state.routes[state.index].key,
          target: state.key,
        });
      },
    },
    routeNames: () => state.routes.map((route) => route.name),
  };
}

test('returns to the existing Home route with stack-pop semantics', () => {
  const calls = [];
  const navigation = {
    navigate(...args) {
      calls.push(args);
    },
  };

  returnToHome(navigation);

  assert.deepEqual(calls, [
    ['MainTabs', { screen: 'Home' }, { pop: true }],
  ]);
});

test('ten repeated guided and daily/search cycles keep one root route', () => {
  const stack = createStackHarness();

  for (let cycle = 0; cycle < 10; cycle += 1) {
    // Explore is pushed over MainTabs and must return to the existing root.
    stack.navigation.navigate('Explore');
    assert.deepEqual(stack.routeNames(), ['MainTabs', 'Explore']);

    returnToHome(stack.navigation);
    assert.deepEqual(stack.routeNames(), ['MainTabs']);

    stack.navigation.navigate('ExerciseSearch');
    stack.navigation.navigate('ExerciseSession', { techniqueId: 'box' });
    stack.navigation.replace('SessionComplete', { techniqueId: 'box' });
    assert.deepEqual(stack.routeNames(), [
      'MainTabs',
      'ExerciseSearch',
      'SessionComplete',
    ]);

    returnToHome(stack.navigation);
    assert.deepEqual(stack.routeNames(), ['MainTabs']);

    stack.navigation.navigate('ExerciseSearch');
    stack.navigation.navigate('DailyExercise');
    stack.navigation.replace('DailyResult', { holdSeconds: 60 });
    assert.deepEqual(stack.routeNames(), [
      'MainTabs',
      'ExerciseSearch',
      'DailyResult',
    ]);

    returnToHome(stack.navigation);
    assert.deepEqual(stack.routeNames(), ['MainTabs']);
  }
});
