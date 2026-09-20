import assert from 'node:assert/strict';
import { CommonActions, StackRouter } from '@react-navigation/routers';
import { openInsights } from './openInsights.ts';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

test('Reset is a main tab and is not registered as a pushed root screen', () => {
  const mainTabs = readFileSync(join(here, 'MainTabs.tsx'), 'utf8');
  const rootNavigator = readFileSync(join(here, 'RootNavigator.tsx'), 'utf8');
  const types = readFileSync(join(here, 'types.ts'), 'utf8');

  assert.match(mainTabs, /<Tab\.Screen\s+name="Reset"\s+component={ExploreScreen}/);
  assert.doesNotMatch(rootNavigator, /<Stack\.Screen\s+name="Reset"/);
  assert.match(types, /MainTabParamList = \{[\s\S]*?Reset: undefined;/);
  assert.doesNotMatch(types, /RootStackParamList = \{[\s\S]*?\n\s+Reset: undefined;/);
  assert.match(types, /ResetScreenProps = MainTabScreenProps<'Reset'>/);
});

test('Plan is a main tab and is not registered as a pushed root screen', () => {
  const mainTabs = readFileSync(join(here, 'MainTabs.tsx'), 'utf8');
  const rootNavigator = readFileSync(join(here, 'RootNavigator.tsx'), 'utf8');
  const types = readFileSync(join(here, 'types.ts'), 'utf8');

  assert.match(mainTabs, /<Tab\.Screen\s+name="Plan"\s+component={PlanScreen}/);
  assert.doesNotMatch(rootNavigator, /<Stack\.Screen\s+name="Plan"/);
  assert.match(types, /MainTabParamList = \{[\s\S]*?Plan: undefined;/);
  assert.doesNotMatch(types, /RootStackParamList = \{[\s\S]*?\n\s+Plan: undefined;/);
  assert.match(types, /PlanScreenProps = MainTabScreenProps<'Plan'>/);
});

/**
 * The plan's week is the only thing in the header's right slot now. It replaced
 * the History link, which Insights carries — so the screen keeps a way in
 * and the header keeps one column of text per side.
 */
test('the plan header states the week and no longer links to History', () => {
  const section = readFileSync(
    join(here, '..', '..', 'features', 'selfCare', 'TodoListSection.tsx'),
    'utf8',
  );
  const profile = readFileSync(
    join(here, '..', '..', 'screens', 'InsightsScreen.tsx'),
    'utf8',
  );

  assert.match(section, /right=\{[\s\S]*?planPositionLabel\(planPosition\)/);
  assert.doesNotMatch(section, /onPressHistory/);
  assert.match(profile, /navigation\.navigate\('History'\)/);
});

test('My To-dos retain completion feedback and Home has no task CTA', () => {
  const section = readFileSync(
    join(here, '..', '..', 'features', 'selfCare', 'TodoListSection.tsx'),
    'utf8',
  );
  const plan = readFileSync(join(here, '..', '..', 'screens', 'PlanScreen.tsx'), 'utf8');
  const home = readFileSync(join(here, '..', '..', 'screens', 'HomeScreen.tsx'), 'utf8');

  assert.match(section, /const allGoalsCompleted =[\s\S]*?goals\.every\(\(goal\) => goal\.completedToday\)/);
  assert.match(section, /\) : allGoalsCompleted \? \(/);
  assert.match(section, /onCompleted: \(goalTitle: string\) => void/);
  assert.match(section, /allGoalsCompleted \? \([\s\S]*?<AllDoneState[\s\S]*?onAddHabit=\{atLimit \? undefined : \(\) => setAdding\(true\)\}/);
  assert.match(plan, /onCompleted=\{\(title\) => \{[\s\S]*?confirm\(title\)[\s\S]*?burst\(\)/);
  assert.doesNotMatch(home, /mode="tasks"/);
});


test('Insights remains a tab without a separate Profile route', () => {
  const tabs = readFileSync(join(here, 'MainTabs.tsx'), 'utf8');
  const root = readFileSync(join(here, 'RootNavigator.tsx'), 'utf8');
  assert.match(tabs, /name="Insights"\s+component={InsightsScreen}/);
  assert.doesNotMatch(tabs, /name="Profile"/);
  assert.doesNotMatch(root, /name="Profile"/);
  assert.match(tabs, /tabBarLabel: 'Routine'/);
});

test('Settings owns the profile identity card while Insights leads with the score', () => {
  const insights = readFileSync(join(here, '..', '..', 'screens', 'InsightsScreen.tsx'), 'utf8');
  const settings = readFileSync(join(here, '..', '..', 'screens', 'SettingsScreen.tsx'), 'utf8');

  assert.doesNotMatch(insights, /ProfileIdentityCard/);
  assert.match(settings, /<ProfileIdentityCard/);
  assert.ok(insights.indexOf('<PlanHeroCard') < insights.indexOf('<HotelEntryCard />'));
});

test('profile shortcuts return to Insights without stacking main tab routes', () => {
  const router = StackRouter({});
  const options = {
    routeNames: ['MainTabs', 'Settings'],
    routeParamList: {},
    routeGetIdList: {},
  };
  let state = router.getInitialState(options);
  const rootKey = state.routes[0].key;
  const dispatch = (action) => {
    const next = router.getStateForAction(state, action, options);
    assert.notEqual(next, null);
    state = next;
  };
  const navigation = {
    navigate(...args) { dispatch(CommonActions.navigate(...args)); },
  };
  for (let cycle = 0; cycle < 10; cycle += 1) {
    dispatch(CommonActions.navigate('Settings'));
    assert.equal(state.routes.length, 2);
    openInsights(navigation);
    assert.equal(state.routes.length, 1);
    assert.equal(state.routes[0].key, rootKey);
    assert.equal(state.routes[0].params.screen, 'Insights');
    dispatch(CommonActions.navigate('Settings'));
    dispatch(CommonActions.goBack());
    assert.equal(state.routes.length, 1);
    assert.equal(state.routes[0].key, rootKey);
  }
});
