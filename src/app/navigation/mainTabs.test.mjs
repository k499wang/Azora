import assert from 'node:assert/strict';
import { CommonActions, StackRouter } from '@react-navigation/routers';
import { openProfile } from './openProfile.ts';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

test('Explore is the single discovery tab and is not registered as a pushed root screen', () => {
  const mainTabs = readFileSync(join(here, 'MainTabs.tsx'), 'utf8');
  const rootNavigator = readFileSync(join(here, 'RootNavigator.tsx'), 'utf8');
  const types = readFileSync(join(here, 'types.ts'), 'utf8');

  assert.match(mainTabs, /<Tab\.Screen\s+name="Explore"\s+component={RoutineLibraryScreen}/);
  assert.doesNotMatch(mainTabs, /name="Reset"/);
  assert.doesNotMatch(rootNavigator, /<Stack\.Screen\s+name="Explore"/);
  assert.match(types, /MainTabParamList = \{[\s\S]*?Explore: undefined;/);
  assert.doesNotMatch(types, /MainTabParamList = \{[\s\S]*?Reset: undefined;/);
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
 * The plan header counts down to its local-midnight refresh. Insights carries
 * the historical progress, so Home keeps one useful column of text per side.
 */
test('the plan header states its refresh countdown and no longer links to History', () => {
  const section = readFileSync(
    join(here, '..', '..', 'features', 'selfCare', 'TodoListSection.tsx'),
    'utf8',
  );
  const profile = readFileSync(
    join(here, '..', '..', 'screens', 'ProfileScreen.tsx'),
    'utf8',
  );

  assert.match(section, /right=\{[\s\S]*?<NextDayCountdown label="Refreshes in"/);
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
  assert.match(section, /onCompleted: \(completion: \{ goalId: string; goalTitle: string; isFirstTodoToday: boolean \}\) => void/);
  assert.match(section, /allGoalsCompleted \? \([\s\S]*?<AllDoneState[\s\S]*?onAddHabit=\{\(\) => setAdding\(true\)\}/);
  assert.match(plan, /onCompleted=\{\(\{ goalId, goalTitle, isFirstTodoToday \}\) => \{[\s\S]*?if \(isFirstTodoToday\)[\s\S]*?setFirstRoutineCompletion\(\{ goalId, goalTitle \}\)[\s\S]*?confirm\(goalTitle\)[\s\S]*?burst\(\)/);
  assert.doesNotMatch(home, /mode="tasks"/);
});


test('Profile is a tab and Settings is a separate pushed screen', () => {
  const tabs = readFileSync(join(here, 'MainTabs.tsx'), 'utf8');
  const root = readFileSync(join(here, 'RootNavigator.tsx'), 'utf8');
  assert.match(tabs, /name="Insights"\s+component={InsightsScreen}/);
  assert.match(tabs, /name="Profile"\s+component={ProfileScreen}/);
  assert.doesNotMatch(root, /name="Profile"/);
  assert.match(root, /name="Settings"\s+component={SettingsScreen}/);
  assert.match(tabs, /tabBarLabel: 'Routine'/);
  assert.match(tabs, /name="Insights"\s+component={InsightsScreen}[\s\S]*?tabBarLabel: 'Plan'/);
  assert.ok(tabs.indexOf('name="Plan"') < tabs.indexOf('name="Insights"'));
  assert.ok(tabs.indexOf('name="Explore"') < tabs.indexOf('name="Profile"'));
});

test('Profile owns identity and consistency while Insights leads with the score', () => {
  const insights = readFileSync(join(here, '..', '..', 'screens', 'InsightsScreen.tsx'), 'utf8');
  const profile = readFileSync(join(here, '..', '..', 'screens', 'ProfileScreen.tsx'), 'utf8');
  const settings = readFileSync(join(here, '..', '..', 'screens', 'SettingsScreen.tsx'), 'utf8');

  assert.doesNotMatch(insights, /ProfileIdentityCard/);
  assert.doesNotMatch(insights, /ProfileCompletionCalendarCard/);
  assert.match(profile, /<ProfileIdentityCard/);
  assert.match(profile, /<ProfileCompletionCalendarCard/);
  assert.match(profile, /accessibilityLabel="Open settings"/);
  assert.doesNotMatch(settings, /<ProfileIdentityCard/);
  assert.doesNotMatch(
    readFileSync(join(here, '..', '..', 'screens', 'HomeScreen.tsx'), 'utf8'),
    /accessibilityLabel="Open settings"/,
  );
  assert.doesNotMatch(insights, /<HotelEntryCard/);
  assert.match(profile, /<HotelEntryCard\s*\/>/);
});

test('profile shortcuts select Profile without stacking main tab routes', () => {
  const router = StackRouter({});
  const options = {
    routeNames: ['MainTabs'],
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
    openProfile(navigation);
    assert.equal(state.routes.length, 1);
    assert.equal(state.routes[0].key, rootKey);
    assert.equal(state.routes[0].params.screen, 'Profile');
  }
});
