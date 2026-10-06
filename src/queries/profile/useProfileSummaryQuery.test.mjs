import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { QueryClient } from '@tanstack/react-query';
import { withTodaysSession } from '../../lib/weeklyProgress.ts';

const compiled = ts.transpileModule(
  readFileSync(new URL('./useProfileSummaryQuery.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

test('a new local day fetches fresh offsets even while yesterday remains fresh', async () => {
  const client = new QueryClient();
  let localDate = '2026-09-30';
  const reads = [];
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === '@tanstack/react-query') return { useQuery: (options) => options };
      if (name.endsWith('/useTodayLocalDate')) return { useTodayLocalDate: () => localDate };
      if (name.endsWith('/profileSummaryService')) return {
        getProfileSummary: async (userId, date) => {
          reads.push([userId, date]);
          return { currentStreak: 1, completedDaysAgo: date === '2026-09-30' ? [0] : [1] };
        },
      };
      if (name === './profileSummaryStructuralSharing') return {
        mergeProfileSummaryPartialResult: (_previous, incoming) => incoming,
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  try {
    const yesterday = await client.fetchQuery(exports.useProfileSummaryQuery('user'));
    assert.equal(withTodaysSession(yesterday.currentStreak, yesterday.completedDaysAgo).currentStreak, 1);
    localDate = '2026-10-01';
    const today = await client.fetchQuery(exports.useProfileSummaryQuery('user'));
    assert.equal(withTodaysSession(today.currentStreak, today.completedDaysAgo).currentStreak, 2);
    assert.deepEqual(reads, [['user', '2026-09-30'], ['user', '2026-10-01']]);
    await client.invalidateQueries({ queryKey: exports.getProfileSummaryQueryKey('user') });
    assert.equal(client.getQueryState(exports.getProfileSummaryQueryKey('user', '2026-09-30')).isInvalidated, true);
    assert.equal(client.getQueryState(exports.getProfileSummaryQueryKey('user', '2026-10-01')).isInvalidated, true);
  } finally {
    client.clear();
  }
});
