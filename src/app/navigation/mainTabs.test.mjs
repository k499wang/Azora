import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

test('Explore is a main tab and is not registered as a pushed root screen', () => {
  const mainTabs = readFileSync(join(here, 'MainTabs.tsx'), 'utf8');
  const rootNavigator = readFileSync(join(here, 'RootNavigator.tsx'), 'utf8');
  const types = readFileSync(join(here, 'types.ts'), 'utf8');

  assert.match(mainTabs, /<Tab\.Screen\s+name="Explore"\s+component={ExploreScreen}/);
  assert.doesNotMatch(rootNavigator, /<Stack\.Screen\s+name="Explore"/);
  assert.match(types, /MainTabParamList = \{[\s\S]*?Explore: undefined;/);
  assert.doesNotMatch(types, /RootStackParamList = \{[\s\S]*?\n\s+Explore: undefined;/);
  assert.match(types, /ExploreScreenProps = MainTabScreenProps<'Explore'>/);
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
 * the History link, which Profile still carries — so the screen keeps a way in
 * and the header keeps one column of text per side.
 */
test('the plan header states the week and no longer links to History', () => {
  const section = readFileSync(
    join(here, '..', '..', 'features', 'selfCare', 'TodoListSection.tsx'),
    'utf8',
  );
  const profile = readFileSync(
    join(here, '..', '..', 'screens', 'ProfileScreen.tsx'),
    'utf8',
  );

  assert.match(section, /right=\{[\s\S]*?planPositionLabel\(planPosition\)/);
  assert.doesNotMatch(section, /onPressHistory/);
  assert.match(profile, /navigation\.navigate\('History'\)/);
});
