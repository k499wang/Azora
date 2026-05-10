// Deletes the authenticated caller's account from auth.users.
// All linked data (profiles, sessions, daily_activity, etc.) cascades automatically.
// Uses service-role key so the auth.admin API is available.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');

  if (!jwt) {
    return new Response('missing authorization header', { status: 401 });
  }

  const { data: { user }, error: userError } = await adminClient.auth.getUser(jwt);

  if (userError || user == null) {
    return new Response('unauthorized', { status: 401 });
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error('delete_user failed', deleteError);
    return new Response('failed to delete account', { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
});
