// Read-only checks against the configured Supabase project. No user rows or
// credentials are printed, and no account or database record is created.
const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!base || !key) {
  throw new Error('Provide EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (for example, node --env-file=.env scripts/verify-onboarding-backend.mjs).');
}

const checks = [
  ['Auth health', '/auth/v1/health'],
  ['Auth settings', '/auth/v1/settings'],
  ['Onboarding profile columns', '/rest/v1/profiles?select=user_id,onboarding_goal,onboarding_completed_at,age,gender,daily_minutes,default_technique_id,display_name,stress_level,sleep_quality,agreement_responses,acquisition_source&limit=0'],
  ['Plan preference columns', '/rest/v1/user_preferences?select=user_id,daily_plan_schedule,daily_plan_exercises,notification_preferences&limit=0'],
  ['Program enrollment columns', '/rest/v1/program_enrollments?select=user_id,plan_id,preset_revision,resolver_version,enrolled_on,resolved,todo_step_from_day&limit=0'],
  ['Routine task columns', '/rest/v1/self_care_goals?select=user_id,id,title,icon,recurrence,scheduled_time&limit=0'],
];

for (const [label, path] of checks) {
  try {
    const response = await fetch(new URL(path, base), {
      headers: { apikey: key },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`FAIL ${label}: HTTP ${response.status}${error.code ? ` (${error.code})` : ''}`);
      process.exitCode = 1;
      continue;
    }
    console.log(`PASS ${label}: HTTP ${response.status}`);
  } catch (error) {
    console.error(`FAIL ${label}: ${error.cause?.code ?? error.name}`);
    process.exitCode = 1;
  }
}

console.log('These checks verify connectivity and exposed columns, not authenticated uploads or row-level write permissions.');
