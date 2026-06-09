-- Raw client IP captured at landing, sent to Meta CAPI as client_ip_address
-- (unhashed) to improve event match quality. Pairs with user_agent.

alter table public.web_funnel_sessions
  add column if not exists ip_address text;

comment on column public.web_funnel_sessions.ip_address is
  'Client IP observed at session landing; used as Meta CAPI client_ip_address.';
