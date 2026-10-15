-- Regression checks for a disposable database after installing the migration.
-- No external calls. Fixtures and queue transitions are always rolled back.
begin;

do $$
declare
  fixture jsonb := jsonb_build_object(
    'app_id', 'qualified-trial-queue-regression', 'store', 'APP_STORE',
    'environment', 'PRODUCTION', 'period_type', 'TRIAL',
    'app_user_id', 'queue-regression', 'product_id', 'annual',
    'original_transaction_id', 'queue-regression-transaction',
    'purchased_at_ms', floor(extract(epoch from now() - interval '11 minutes') * 1000),
    'expiration_at_ms', floor(extract(epoch from now() + interval '3 days') * 1000)
  );
  prefix text := 'qualified-trial-regression-' || gen_random_uuid()::text;
  first_claim record;
  second_claim record;
  claim_count integer;
  state text;
begin
  if exists (select 1 from public.qualified_trial_events) then
    raise exception 'Run in a disposable database with an empty qualified_trial_events queue';
  end if;

  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-start', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture)),
         (prefix || '-duplicate', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture)),
         (prefix || '-sandbox', 'SANDBOX', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture || '{"environment":"SANDBOX"}'::jsonb)),
         (prefix || '-web', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture || '{"store":"RC_BILLING"}'::jsonb)),
         (prefix || '-paid', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture || '{"period_type":"NORMAL"}'::jsonb));

  if (select count(*) from public.qualified_trial_events) <> 1 then
    raise exception 'Start deduplication or sandbox/web/paid exclusion failed';
  end if;

  select count(*) into claim_count from public.claim_qualified_trial_events(array['PLAY_STORE']);
  if claim_count <> 0 or exists (select 1 from public.qualified_trial_events where attempts <> 0) then
    raise exception 'A platform without credentials consumed a retry';
  end if;

  update public.qualified_trial_events set due_at = now() + interval '1 minute';
  select count(*) into claim_count from public.claim_qualified_trial_events();
  if claim_count <> 0 then raise exception 'Trial claimed before ten minutes'; end if;
  update public.qualified_trial_events set due_at = now() - interval '1 minute';

  select * into strict first_claim from public.claim_qualified_trial_events();
  select count(*) into claim_count from public.claim_qualified_trial_events();
  if claim_count <> 0 then raise exception 'Active lease claimed twice'; end if;

  update public.qualified_trial_events set lease_expires_at = now() - interval '1 second';
  select * into strict second_claim from public.claim_qualified_trial_events();
  if public.prepare_qualified_trial_dispatch(first_claim.id, first_claim.lease_token)
    or public.finish_qualified_trial_event(first_claim.id, first_claim.lease_token, 'pending') then
    raise exception 'Expired owner can still mutate the reclaimed job';
  end if;

  if not public.prepare_qualified_trial_dispatch(second_claim.id, second_claim.lease_token)
    or public.prepare_qualified_trial_dispatch(second_claim.id, second_claim.lease_token) then
    raise exception 'Dispatch reservation is not exclusive';
  end if;
  update public.qualified_trial_events set lease_expires_at = now() - interval '1 second';
  perform * from public.claim_qualified_trial_events();
  select status into state from public.qualified_trial_events;
  if state <> 'uncertain' then raise exception 'Interrupted dispatch would be resent'; end if;

  -- Reuse the isolated fixture to cover cancellation after claim and out-of-order arrival.
  update public.qualified_trial_events set status = 'pending', attempts = 0, next_attempt_at = now();
  select * into strict first_claim from public.claim_qualified_trial_events();
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-cancel', 'PRODUCTION', 'CANCELLATION', jsonb_build_object('event', fixture));
  if public.prepare_qualified_trial_dispatch(first_claim.id, first_claim.lease_token) then
    raise exception 'Cancellation received before dispatch did not suppress';
  end if;
  select status into state from public.qualified_trial_events;
  if state <> 'suppressed' then raise exception 'Cancellation status was not persisted'; end if;

  delete from public.qualified_trial_events;
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-late-start', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture));
  select count(*) into claim_count from public.claim_qualified_trial_events();
  select status into state from public.qualified_trial_events;
  if claim_count <> 0 or state <> 'suppressed' then
    raise exception 'Cancellation received before the start event did not suppress';
  end if;

  delete from public.qualified_trial_events;
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-success', 'PRODUCTION', 'INITIAL_PURCHASE',
          jsonb_build_object('event', fixture || jsonb_build_object('original_transaction_id', prefix || '-success')));
  select * into strict first_claim from public.claim_qualified_trial_events();
  if not public.prepare_qualified_trial_dispatch(first_claim.id, first_claim.lease_token)
    or not public.finish_qualified_trial_event(first_claim.id, first_claim.lease_token, 'sent')
    or public.finish_qualified_trial_event(first_claim.id, first_claim.lease_token, 'sent') then
    raise exception 'Successful completion failed or could complete twice';
  end if;
  select count(*) into claim_count from public.claim_qualified_trial_events();
  if claim_count <> 0 then raise exception 'A sent event was claimed again'; end if;

  if has_table_privilege('anon', 'public.qualified_trial_events', 'SELECT')
    or has_table_privilege('authenticated', 'public.qualified_trial_events', 'INSERT')
    or has_function_privilege('anon', 'public.claim_qualified_trial_events(text[])', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.prepare_qualified_trial_dispatch(uuid,uuid)', 'EXECUTE') then
    raise exception 'Queue or RPC accessible to client roles';
  end if;
  raise notice 'Qualified trial queue regression checks passed';
end;
$$;

-- A queue failure must preserve the audit INSERT used by the billing webhook.
create function pg_temp.reject_qualified_trial_fixture()
returns trigger language plpgsql as $$
begin
  raise exception 'Injected marketing queue failure';
end;
$$;
create trigger reject_qualified_trial_fixture
before insert on public.qualified_trial_events
for each row execute function pg_temp.reject_qualified_trial_fixture();

do $$
declare
  fixture_id text := 'qualified-trial-fail-open-' || gen_random_uuid()::text;
  purchase_ms bigint := floor(extract(epoch from now() - interval '11 minutes') * 1000);
begin
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (fixture_id, 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', jsonb_build_object(
    'app_id', fixture_id, 'store', 'APP_STORE', 'environment', 'PRODUCTION',
    'period_type', 'TRIAL', 'app_user_id', 'queue-regression', 'product_id', 'annual',
    'original_transaction_id', fixture_id,
    'purchased_at_ms', purchase_ms, 'expiration_at_ms', purchase_ms + 3 * 86400000::bigint
  )));
  if not exists (select 1 from public.revenuecat_events where event_id = fixture_id) then
    raise exception 'Queue failure rolled back the RevenueCat audit INSERT';
  end if;
  if exists (select 1 from public.qualified_trial_events where source_event_id = fixture_id) then
    raise exception 'Fail-open test did not inject a queue failure';
  end if;
  raise notice 'Marketing queue failure does not block the billing audit INSERT';
end;
$$;

rollback;
