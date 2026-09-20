import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

test('streak qualification refreshes every derived streak read', () => {
  const source = readFileSync(join(here, 'invalidateStreakQueries.ts'), 'utf8');

  assert.match(source, /getProfileSummaryQueryKey/);
  assert.match(source, /getDailyActivityRangeQueryKeyPrefix/);
  assert.match(source, /getHomeStatsQueryKeyPrefix/);
});
