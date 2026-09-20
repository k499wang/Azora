import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'useToggleSelfCareGoalMutation.ts'), 'utf8');

test('a to-do confirmation does not wait for derived streak refreshes', () => {
  assert.match(
    source,
    /onSuccess: \(\) => \{\s*if \(userId != null\) void invalidateStreakQueries\(queryClient, userId\);\s*\}/,
  );
  assert.doesNotMatch(source, /onSuccess: async/);
});

test('a failed optimistic completion still restores and refreshes its exact list', () => {
  assert.match(source, /if \(context\?\.previous != null\) queryClient\.setQueryData\(queryKey, context\.previous\)/);
  assert.match(source, /queryClient\.invalidateQueries\(\{ queryKey, exact: true \}\)/);
});
