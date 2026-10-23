// Run the real queue migrations and regression SQL without a remote database.
// Pass the entry point of a temporary PGlite installation as the first argument.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const driver = process.argv[2] == null
  ? '@electric-sql/pglite'
  : pathToFileURL(resolve(process.argv[2])).href;
const { PGlite } = await import(driver);
const db = new PGlite();
const migration = (name) => readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create table public.revenuecat_events (
      event_id text primary key,
      environment text,
      event_type text not null,
      payload jsonb not null,
      received_at timestamptz not null default now()
    );
  `);
  await db.exec(migration('20261015000100_add_qualified_trial_events.sql'));
  await db.exec(`
    insert into public.revenuecat_events (event_id, environment, event_type, payload)
    select 'upgrade-' || state, 'PRODUCTION', 'INITIAL_PURCHASE',
      jsonb_build_object('event', jsonb_build_object(
        'app_id', 'upgrade', 'store', 'APP_STORE', 'environment', 'PRODUCTION',
        'period_type', 'TRIAL', 'app_user_id', 'upgrade-user', 'product_id', 'annual',
        'original_transaction_id', 'upgrade-' || state,
        'purchased_at_ms', floor(extract(epoch from now() - interval '3 hours') * 1000),
        'expiration_at_ms', floor(extract(epoch from now() + interval '3 days') * 1000)
      ))
    from unnest(array['pending', 'sent']) as state;
    update public.qualified_trial_events set status = 'sent', sent_at = now()
    where source_event_id = 'upgrade-sent';
  `);
  const before = (await db.query('select * from public.qualified_trial_events order by id')).rows;
  await db.exec(migration('20261021000100_add_qualified_trial_v2.sql'));
  const after = (await db.query('select * from public.qualified_trial_events order by id')).rows;
  assert.equal(after.length, before.length, 'upgrade does not backfill historical V2 events');
  assert.deepEqual(after.map(({ event_name, ...row }) => {
    assert.equal(event_name, 'qualified_trial', 'existing rows retain the V1 event name');
    return row;
  }), before, 'upgrade preserves existing pending and sent V1 jobs');
  await db.exec(migration('20261023000100_add_qualified_trial_v3.sql'));
  assert.equal((await db.query('select count(*)::int as count from public.qualified_trial_events')).rows[0].count,
    before.length, 'upgrade does not backfill historical V3 events');
  await db.exec('truncate public.qualified_trial_events, public.revenuecat_events');
  await db.exec(readFileSync(new URL('./sql/verify-qualified-trial-queue.sql', import.meta.url), 'utf8'));
  assert.equal((await db.query('select count(*)::int as count from public.qualified_trial_events')).rows[0].count, 0,
    'regression fixtures are rolled back');
  console.log('Qualified trial migrations, upgrade preservation, and queue regression checks passed.');
} finally {
  await db.close();
}
