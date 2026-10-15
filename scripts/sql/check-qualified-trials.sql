-- Read-only checks after installing the migration and scheduling the worker.
-- Does not claim jobs, send events, print credentials, or change subscriptions.

select
  to_regclass('public.qualified_trial_events') is not null as queue_installed,
  to_regprocedure('public.claim_qualified_trial_events(text[])') is not null as configured_store_claim_installed,
  to_regprocedure('public.prepare_qualified_trial_dispatch(uuid,uuid)') is not null as dispatch_guard_installed;

select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.revenuecat_events'::regclass
  and tgname = 'enqueue_qualified_trial_event';

select status, count(*) as events, min(due_at) as oldest_qualification,
       min(next_attempt_at) filter (where status = 'pending') as next_attempt,
       max(updated_at) as latest_change
from public.qualified_trial_events
group by status
order by status;

select count(*) filter (where status = 'pending' and due_at <= now()) as due_pending_events,
       count(*) filter (where lease_expires_at < now()) as expired_leases
from public.qualified_trial_events
where (status = 'pending' and next_attempt_at <= now() and due_at <= now())
   or status in ('processing', 'dispatching');

-- Count only: secret values are intentionally never selected.
select name, count(*) as configured_values
from vault.secrets
where name in ('qualified_trial_project_url', 'qualified_trial_cron_secret')
group by name;

select jobname, active, schedule
from cron.job
where jobname = 'send-qualified-trials';

select r.status, r.start_time, r.end_time, r.return_message
from cron.job_run_details r
join cron.job j on j.jobid = r.jobid
where j.jobname = 'send-qualified-trials'
order by r.start_time desc
limit 10;

-- These are recent pg_net requests across the project, not just this worker.
-- HTTP 401/503 indicates auth/config failure even if cron reports success.
select id, status_code, timed_out, error_msg
from net._http_response
order by id desc
limit 10;
