import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, 'seed-streak-history.sql'), 'utf8');
// Everything before the VERIFY block is what actually runs.
const setup = sql.slice(0, sql.indexOf('-- VERIFY —'));

test('the seed resolves the target user from profiles by email', () => {
  assert.match(setup, /from public\.profiles p\s+join auth\.users u on u\.id = p\.user_id/);
  assert.match(setup, /where u\.email = '<QA_EMAIL>'/);
});

test('it seeds consecutive qualifying days ending yesterday in the profile timezone', () => {
  assert.match(
    setup,
    /select me\.user_id, me\.today - g\.days_ago, me\.timezone, true\s+from me, generate_series\(1, \d+\) as g\(days_ago\)/,
  );
  assert.match(setup, /\(now\(\) at time zone p\.timezone\)::date as today/);
  assert.match(
    setup,
    /on conflict \(user_id, activity_date\) do update set\s+timezone = excluded\.timezone,\s+qualifies_for_streak = true,/,
  );
});

test('the seed is a dry run until the rollback is turned into a commit', () => {
  assert.match(setup, /\nrollback;\n-- commit;\n/);
});

test('the seed leaves profile fields, including timezone, untouched', () => {
  assert.doesNotMatch(setup, /update public\.profiles/);
  assert.doesNotMatch(setup, /insert into public\.profiles/);
  assert.doesNotMatch(setup, /delete from public\.profiles/);
});

test('the seed writes only the daily_activity columns the streak view reads', () => {
  const insert = setup.slice(
    setup.indexOf('insert into public.daily_activity'),
    setup.indexOf('on conflict'),
  );
  assert.match(insert, /user_id, activity_date, timezone, qualifies_for_streak/);
});

test('the verify block copies the view’s one-grace-day run filter', () => {
  // The verify query is commented out so the editor runs only the seed by
  // default, so every line carries a `--` prefix.
  const verify = sql.slice(sql.indexOf('-- VERIFY —'));
  assert.match(
    verify,
    /--\s*coalesce\(max\(r\.run_len\) filter \(\s*--\s*where r\.run_end = me\.today or r\.run_end = me\.today - 1\s*--\s*\), 0\) as current_streak/,
  );
  assert.match(
    verify,
    /row_number\(\) over \(partition by user_id order by activity_date\)/,
  );
  assert.match(verify, /from me left join runs r on r\.user_id = me\.user_id/);
});

test('teardown is scoped to the target user and the seeded date range', () => {
  const teardown = sql.slice(sql.indexOf('-- TEARDOWN'));
  assert.match(teardown, /delete from public\.daily_activity/);
  assert.match(teardown, /where u\.email = '<QA_EMAIL>'/);
  assert.match(teardown, /activity_date >= \(/);
  assert.match(teardown, /activity_date < \(/);
  assert.doesNotMatch(teardown, /delete from public\.daily_activity\s+where true/);
});
