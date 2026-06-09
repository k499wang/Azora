-- Track when the authoritative server-side Meta CAPI Purchase was accepted.
-- This is diagnostic/idempotency metadata for the web checkout webhook.

alter table public.web_checkout_intents
  add column if not exists meta_capi_sent_at timestamptz;

comment on column public.web_checkout_intents.meta_capi_sent_at is
  'When the web checkout webhook successfully sent the server-side Meta CAPI Purchase event.';
