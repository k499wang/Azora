alter table public.self_care_goals
  -- Old clients can omit this additive column; the server gives it a date.
  add column recurrence_anchor_date date not null default current_date,
  drop constraint self_care_goals_recurrence_valid,
  add constraint self_care_goals_recurrence_valid
    check (recurrence in ('daily', 'weekdays', 'weekly', 'once'));
