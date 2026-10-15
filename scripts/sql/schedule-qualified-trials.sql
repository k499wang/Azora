-- Run after deploying send-qualified-trials and creating the two Vault secrets
-- described in docs/analytics/qualified-trial-setup.md. No credentials belong here.
-- Re-running updates the named job rather than creating another schedule.
begin;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if (select count(*) from vault.decrypted_secrets
      where name = 'qualified_trial_project_url'
        and decrypted_secret ~ '^https://[^/]+[.]supabase[.]co/?$') <> 1 then
    raise exception 'Create exactly one valid qualified_trial_project_url Vault secret first';
  end if;
  if (select count(*) from vault.decrypted_secrets
      where name = 'qualified_trial_cron_secret'
        and length(decrypted_secret) >= 32) <> 1 then
    raise exception 'Create exactly one qualified_trial_cron_secret Vault secret (32+ characters) first';
  end if;
end;
$$;

select cron.schedule(
  'send-qualified-trials',
  '* * * * *',
  $job$
    select net.http_post(
      url := rtrim((select decrypted_secret from vault.decrypted_secrets
                    where name = 'qualified_trial_project_url'), '/')
             || '/functions/v1/send-qualified-trials',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets
                                       where name = 'qualified_trial_cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
  $job$
);

commit;
