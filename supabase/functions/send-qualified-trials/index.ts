import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createQualifiedTrialHandler } from './worker.ts';
import type { TrialDatabase } from './worker.ts';
import type { TrialJob } from './qualifiedTrial.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase configuration missing');
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  global: {
    fetch(input, init) {
      const existingSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
      const deadline = AbortSignal.timeout(8000);
      return fetch(input, { ...init, signal: existingSignal ? AbortSignal.any([existingSignal, deadline]) : deadline });
    },
  },
});

const database: TrialDatabase = {
  async claim(stores) {
    const { data, error } = await supabase.rpc('claim_qualified_trial_events', {
      p_stores: stores, p_event_names: ['qualified_trial', 'qualified_trial_v2', 'qualified_trial_v3'],
    });
    if (error) throw new Error('Qualified trial claim failed');
    return (data ?? []) as TrialJob[];
  },
  async prepare(job) {
    const { data, error } = await supabase.rpc('prepare_qualified_trial_dispatch', {
      p_id: job.id, p_lease_token: job.lease_token,
    });
    if (error) throw new Error('Qualified trial dispatch preparation failed');
    return data === true;
  },
  async finish(job, status, reason) {
    const { data, error } = await supabase.rpc('finish_qualified_trial_event', {
      p_id: job.id, p_lease_token: job.lease_token, p_status: status, p_error: reason ?? null,
    });
    if (error) throw new Error('Qualified trial outcome write failed');
    return data === true;
  },
};

Deno.serve(createQualifiedTrialHandler({
  cronSecret: Deno.env.get('QUALIFIED_TRIAL_CRON_SECRET') ?? '',
  revenueCatKey: Deno.env.get('REVENUECAT_SECRET_API_KEY') ?? '',
  appsFlyerDevKey: Deno.env.get('APPSFLYER_DEV_KEY') ?? '',
  iosAppId: Deno.env.get('APPSFLYER_IOS_APP_ID') ?? '',
  androidAppId: Deno.env.get('APPSFLYER_ANDROID_APP_ID'),
}, database));
