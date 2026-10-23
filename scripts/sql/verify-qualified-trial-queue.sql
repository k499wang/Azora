-- Regression checks for a disposable database after installing all qualified-trial migrations.
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

  if (select count(*) from public.qualified_trial_events) <> 2 then
    raise exception 'Start deduplication or sandbox/web/paid exclusion failed';
  end if;

  select count(*) into claim_count from public.claim_qualified_trial_events(array['PLAY_STORE']);
  if claim_count <> 0 or exists (select 1 from public.qualified_trial_events where attempts <> 0) then
    raise exception 'A platform without credentials consumed a retry';
  end if;

  update public.qualified_trial_events set due_at = now() + interval '1 minute' where event_name = 'qualified_trial';
  select count(*) into claim_count from public.claim_qualified_trial_events();
  if claim_count <> 0 then raise exception 'Trial claimed before ten minutes'; end if;
  update public.qualified_trial_events set due_at = now() - interval '1 minute' where event_name = 'qualified_trial';

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
  select status into state from public.qualified_trial_events where event_name = 'qualified_trial';
  if state <> 'uncertain' then raise exception 'Interrupted dispatch would be resent'; end if;

  -- Reuse the isolated fixture to cover cancellation after claim and out-of-order arrival.
  update public.qualified_trial_events set status = 'pending', attempts = 0, next_attempt_at = now() where event_name = 'qualified_trial';
  select * into strict first_claim from public.claim_qualified_trial_events();
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-cancel', 'PRODUCTION', 'CANCELLATION', jsonb_build_object('event', fixture));
  if public.prepare_qualified_trial_dispatch(first_claim.id, first_claim.lease_token) then
    raise exception 'Cancellation received before dispatch did not suppress';
  end if;
  select status into state from public.qualified_trial_events where event_name = 'qualified_trial';
  if state <> 'suppressed' then raise exception 'Cancellation status was not persisted'; end if;

  delete from public.qualified_trial_events;
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-late-start', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture));
  select count(*) into claim_count from public.claim_qualified_trial_events();
  select status into state from public.qualified_trial_events where event_name = 'qualified_trial';
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

  -- V1 completion stays sent when the trial cancels before V2 qualifies.
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-success-cancel', 'PRODUCTION', 'CANCELLATION',
          jsonb_build_object('event', fixture || jsonb_build_object('original_transaction_id', prefix || '-success')));
  perform * from public.claim_qualified_trial_events(array['APP_STORE'], array['qualified_trial_v2']);
  if not exists (select 1 from public.qualified_trial_events where event_name = 'qualified_trial' and status = 'sent')
    or not exists (select 1 from public.qualified_trial_events where event_name = 'qualified_trial_v2' and status = 'suppressed') then
    raise exception 'Cancellation between qualifications changed V1 or failed to suppress V2';
  end if;

  delete from public.qualified_trial_events;
  fixture := fixture || jsonb_build_object('original_transaction_id', prefix || '-v2',
    'purchased_at_ms', floor(extract(epoch from now() - interval '2 hours') * 1000));
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-v2', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture)),
         (prefix || '-v2-duplicate', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture));
  if (select count(*) from public.qualified_trial_events) <> 2
    or exists (select 1 from public.qualified_trial_events where due_at <
      to_timestamp((fixture->>'purchased_at_ms')::double precision / 1000) +
      case when event_name = 'qualified_trial' then interval '10 minutes' else interval '2 hours' end) then
    raise exception 'Per-version deduplication or qualification timing failed';
  end if;
  update public.qualified_trial_events set status = 'sent' where event_name = 'qualified_trial';
  select count(*) into claim_count from public.claim_qualified_trial_events();
  if claim_count <> 0 then raise exception 'Legacy worker claimed V2 as a V1 event'; end if;
  update public.qualified_trial_events set due_at = now() + interval '1 millisecond' where event_name = 'qualified_trial_v2';
  select count(*) into claim_count from public.claim_qualified_trial_events(array['APP_STORE'], array['qualified_trial_v2']);
  if claim_count <> 0 then raise exception 'V2 claimed before two hours'; end if;
  update public.qualified_trial_events set due_at = now(), next_attempt_at = now() where event_name = 'qualified_trial_v2';
  select * into strict first_claim from public.claim_qualified_trial_events(array['APP_STORE'], array['qualified_trial_v2']);
  if first_claim.event_name <> 'qualified_trial_v2' then raise exception 'Claim lost event version'; end if;
  if not public.prepare_qualified_trial_dispatch(first_claim.id, first_claim.lease_token)
    or not public.finish_qualified_trial_event(first_claim.id, first_claim.lease_token, 'sent') then
    raise exception 'V2 could not complete at two hours';
  end if;
  select count(*) into claim_count from public.claim_qualified_trial_events(array['APP_STORE'], array['qualified_trial', 'qualified_trial_v2']);
  if claim_count <> 0 then raise exception 'Completed event versions claimed again'; end if;

  delete from public.qualified_trial_events;
  fixture := fixture || jsonb_build_object('original_transaction_id', prefix || '-v2-dispatch-cancel');
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-v2-dispatch-cancel', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture));
  select * into strict first_claim from public.claim_qualified_trial_events(array['APP_STORE'], array['qualified_trial_v2']);
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-v2-cancellation', 'PRODUCTION', 'CANCELLATION', jsonb_build_object('event', fixture));
  if public.prepare_qualified_trial_dispatch(first_claim.id, first_claim.lease_token) then
    raise exception 'Cancellation after V2 claim did not prevent dispatch';
  end if;

  -- A trial that expires at the threshold cannot qualify for that version.
  delete from public.qualified_trial_events;
  fixture := fixture || jsonb_build_object('original_transaction_id', prefix || '-short',
    'expiration_at_ms', (fixture->>'purchased_at_ms')::numeric + 7200000);
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-short', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture));
  if (select count(*) from public.qualified_trial_events) <> 1
    or exists (select 1 from public.qualified_trial_events where event_name = 'qualified_trial_v2') then
    raise exception 'Trial expiring at two hours incorrectly queued V2';
  end if;

  -- V3 queues only the full-price yearly trial, never the $39.99 or exit-offer SKU.
  delete from public.qualified_trial_events;
  fixture := fixture || jsonb_build_object(
    'expiration_at_ms', floor(extract(epoch from now() + interval '3 days') * 1000));
  insert into public.revenuecat_events(event_id, environment, event_type, payload)
  values (prefix || '-v3-full', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture
           || jsonb_build_object('original_transaction_id', prefix || '-v3-full', 'product_id', 'azora_pro_yearly_5999_v2'))),
         (prefix || '-v3-discount', 'PRODUCTION', 'INITIAL_PURCHASE', jsonb_build_object('event', fixture
           || jsonb_build_object('original_transaction_id', prefix || '-v3-discount', 'product_id', 'azora_pro_yearly_3999')));
  if (select count(*) from public.qualified_trial_events where event_name = 'qualified_trial_v3') <> 1
    or not exists (select 1 from public.qualified_trial_events where event_name = 'qualified_trial_v3'
      and product_id = 'azora_pro_yearly_5999_v2'
      and due_at = to_timestamp((fixture->>'purchased_at_ms')::double precision / 1000) + interval '2 hours')
    or (select count(*) from public.qualified_trial_events where event_name <> 'qualified_trial_v3') <> 4 then
    raise exception 'V3 product filter or timing failed, or V1/V2 queueing changed';
  end if;
  select count(*) into claim_count from public.claim_qualified_trial_events(array['APP_STORE'], array['qualified_trial', 'qualified_trial_v2']);
  if exists (select 1 from public.qualified_trial_events where event_name = 'qualified_trial_v3' and status <> 'pending') then
    raise exception 'V2 worker claimed a V3 event';
  end if;

  if has_table_privilege('anon', 'public.qualified_trial_events', 'SELECT')
    or has_table_privilege('authenticated', 'public.qualified_trial_events', 'INSERT')
    or has_function_privilege('anon', 'public.claim_qualified_trial_events(text[])', 'EXECUTE')
    or has_function_privilege('anon', 'public.claim_qualified_trial_events(text[],text[])', 'EXECUTE')
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
