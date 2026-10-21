// Exercise the real compatibility trigger in an isolated PostgreSQL database.
// Pass a temporary PGlite installation path; no remote database is accessed.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const driver = process.argv[2] == null
  ? '@electric-sql/pglite'
  : pathToFileURL(resolve(process.argv[2])).href;
const { PGlite } = await import(driver);
const db = new PGlite();

try {
  await db.exec(`
    create table public.user_preferences (
      user_id text primary key,
      notification_preferences jsonb,
      daily_plan_schedule jsonb
    );
  `);
  const migration = (name) => readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
  await db.exec(migration('20260731000300_expand_daily_plan_notification_preferences.sql'));

  // Upgrade a database that already contains legacy and registry-format rows.
  await db.query(`insert into public.user_preferences (user_id, notification_preferences)
    values
      ('existing-legacy', '{"dailyReminder":{"enabled":true,"time":"07:30"},"trialEndingReminder":{"enabled":true}}'),
      ('existing-current', '{"dailyPlanReminders":{"session":{"enabled":false}},"trialEndingReminder":{"enabled":false,"daysBeforeEnd":3}}')`);
  const snapshot = async () => (await db.query('select * from public.user_preferences order by user_id')).rows;
  const functionContract = async () => (await db.query(`
    select p.oid, p.proowner, p.proacl, p.prosecdef, p.proconfig,
      t.oid as trigger_oid, t.tgtype, t.tgenabled
    from pg_proc p join pg_trigger t on t.tgfoid = p.oid
    where p.oid = 'public.sync_notification_preference_formats()'::regprocedure
      and t.tgname = 'user_preferences_notification_compatibility'
  `)).rows;
  const before = await snapshot();
  const contractBefore = await functionContract();
  const trialMigration = migration('20261020000100_preserve_trial_reminder_timing.sql');
  await db.exec(trialMigration);
  await db.exec(trialMigration);
  assert.deepEqual(await snapshot(), before, 'upgrade and reapplication do not rewrite existing accounts');
  assert.deepEqual(await functionContract(), contractBefore, 'trigger, ownership, permissions, and execution context stay unchanged');

  const write = async (preferences) => {
    await db.query(`
      insert into public.user_preferences (user_id, notification_preferences)
      values ('trial-test', $1::jsonb)
      on conflict (user_id) do update
        set notification_preferences = excluded.notification_preferences
    `, [JSON.stringify(preferences)]);
    const { rows } = await db.query(`
      select notification_preferences as preferences, daily_plan_schedule as schedule
      from public.user_preferences where user_id = 'trial-test'
    `);
    return rows[0];
  };

  let row = await write({
    dailyPlanReminders: { session: { enabled: true }, handPicked: { enabled: false } },
    trialEndingReminder: { enabled: true, daysBeforeEnd: 3 },
  });
  assert.deepEqual(row.preferences.trialEndingReminder, { enabled: true, daysBeforeEnd: 3 });

  row = await write({
    dailyReminder: { enabled: false, time: '08:00' },
    trialEndingReminder: { enabled: false },
  });
  assert.deepEqual(row.preferences.trialEndingReminder, { enabled: false, daysBeforeEnd: 3 });
  assert.equal(row.preferences.dailyPlanReminders.session.enabled, false);
  assert.equal(row.schedule.actions.session, '08:00');

  row = await write({
    dailyPlanReminders: { session: { enabled: true } },
    trialEndingReminder: { enabled: true },
  });
  assert.deepEqual(row.preferences.trialEndingReminder, { enabled: true, daysBeforeEnd: 3 });
  assert.deepEqual(row.preferences.dailyPlanReminders.handPicked, { enabled: false });

  row = await write({ trialEndingReminder: { enabled: true, daysBeforeEnd: 2 } });
  assert.deepEqual(row.preferences.trialEndingReminder, { enabled: true, daysBeforeEnd: 2 });

  for (let cycle = 0; cycle < 10; cycle += 1) {
    row = await write({ trialEndingReminder: { enabled: cycle % 2 === 0 } });
    assert.equal(row.preferences.trialEndingReminder.daysBeforeEnd, 2);
  }
  assert.equal(row.preferences.dailyPlanReminders.session.enabled, true);

  // Direct UPDATE is also used by clients; omitted fields retain stored data.
  await db.query(`update public.user_preferences
    set notification_preferences = '{"trialEndingReminder":{"enabled":true,"daysBeforeEnd":3,"futureSetting":"keep"}}'
    where user_id = 'trial-test'`);
  await db.query(`update public.user_preferences
    set notification_preferences = '{"trialEndingReminder":{"enabled":false}}'
    where user_id = 'trial-test'`);
  row = (await db.query(`select notification_preferences as preferences
    from public.user_preferences where user_id = 'trial-test'`)).rows[0];
  assert.deepEqual(row.preferences.trialEndingReminder, { enabled: false, daysBeforeEnd: 3, futureSetting: 'keep' });
  row = await write({ dailyPlanReminders: { session: { enabled: false } } });
  assert.deepEqual(row.preferences.trialEndingReminder, { enabled: false, daysBeforeEnd: 3, futureSetting: 'keep' });

  // Schedule-only writes must retain the trial choice and legacy daily mirror.
  await db.query(`update public.user_preferences
    set daily_plan_schedule = '{"actions":{"session":"06:45"}}'
    where user_id = 'trial-test'`);
  row = (await db.query(`select notification_preferences as preferences, daily_plan_schedule as schedule
    from public.user_preferences where user_id = 'trial-test'`)).rows[0];
  assert.deepEqual(row.preferences.trialEndingReminder, { enabled: false, daysBeforeEnd: 3, futureSetting: 'keep' });
  assert.deepEqual(row.preferences.dailyReminder, { enabled: false, time: '06:45' });
  assert.equal(row.schedule.actions.handPicked, '13:00');

  // Existing legacy rows can still change consent and their daily time.
  await db.query(`update public.user_preferences
    set notification_preferences = '{"dailyReminder":{"enabled":false,"time":"09:15"},"trialEndingReminder":{"enabled":false}}'
    where user_id = 'existing-legacy'`);
  row = (await db.query(`select notification_preferences as preferences, daily_plan_schedule as schedule
    from public.user_preferences where user_id = 'existing-legacy'`)).rows[0];
  assert.deepEqual(row.preferences.trialEndingReminder, { enabled: false });
  assert.equal(row.preferences.dailyPlanReminders.session.enabled, false);
  assert.equal(row.schedule.actions.session, '09:15');

  await db.query(`insert into public.user_preferences (user_id, notification_preferences)
    values ('old-account', '{"trialEndingReminder":{"enabled":true}}'::jsonb)`);
  const { rows: oldRows } = await db.query(`select notification_preferences as preferences
    from public.user_preferences where user_id = 'old-account'`);
  assert.deepEqual(oldRows[0].preferences.trialEndingReminder, { enabled: true });

  console.log('Trial reminder compatibility passed: existing-account upgrade, repeat migration, unchanged trigger/permissions, legacy/new inserts and upserts, direct updates, omitted/future fields, 2/3-day edits, 10 toggles, daily settings preserved.');
} finally {
  await db.close();
}
