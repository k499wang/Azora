import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

test('a daily row without a technique yet says so instead of naming itself', () => {
  const section = readFileSync(join(here, 'TodaysDailiesSection.tsx'), 'utf8');

  // `resolveExerciseTitle(null)` is a stand-in, not a name, and the row it sits
  // on cannot be started — printing it reads as a real, dead exercise.
  assert.match(section, /\{loading \? \(/);
  assert.match(section, /<Skeleton width=\{96\} height=\{TASK_TYPE_LINE_HEIGHT\} \/>/);
  assert.match(section, /<Skeleton width="70%" height=\{TASK_TITLE_LINE_HEIGHT\} \/>/);
  assert.match(
    section,
    /accessibilityLabel=\{loading \? 'Loading today’s reset' : `Start \$\{title\}`\}/,
  );
});

test('every technique the plan can pick has a row title', () => {
  const section = readFileSync(join(here, 'TodaysDailiesSection.tsx'), 'utf8');
  const catalog = readFileSync(
    join(
      here,
      '..',
      '..',
      'features',
      'exercise',
      'guidedBreathing',
      'techniqueCatalog.ts',
    ),
    'utf8',
  );

  const titled = new Set(
    [...section.matchAll(/^\s{2}'?([a-z0-9-]+)'?:\s'[^']+',$/gm)].map(
      ([, id]) => id,
    ),
  );
  const ids = [...catalog.matchAll(/\{ id: '([a-z0-9-]+)'/g)].map(([, id]) => id);

  assert.ok(ids.length > 0);
  for (const id of ids) {
    assert.ok(titled.has(id), `${id} has no row title`);
  }
});

test('a failed technique read falls back rather than leaving the daily nameless', () => {
  const hook = readFileSync(
    join(
      here,
      '..',
      '..',
      'features',
      'exercise',
      'guidedBreathing',
      'hooks',
      'useRecommendedTechnique.ts',
    ),
    'utf8',
  );

  // An error is settled. Resolving only on success left `technique` null with
  // `isLoading` false — a row that never names itself and never starts.
  assert.match(
    hook,
    /const settled =\s*defaultTechniqueQuery\.isSuccess \|\| defaultTechniqueQuery\.isError;/,
  );
  assert.match(hook, /if \(!settled\) \{/);
  assert.doesNotMatch(hook, /if \(!defaultTechniqueQuery\.isSuccess\) \{/);
});
