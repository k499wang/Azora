-- `advance_program_day_if_ready` is a definer function that takes the user id
-- as an argument, so a client allowed to call it could advance anyone's plan.
-- Only definer functions and triggers call it, and they run as its owner, so
-- no client needs execute. `anon` is named too: Supabase grants it execute on
-- new functions directly, not through `public`.
revoke execute on function public.advance_program_day_if_ready(uuid, date)
  from public, anon, authenticated;
