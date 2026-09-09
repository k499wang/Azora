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
