-- Keep a chosen trial reminder lead time when older app versions save
-- notification preferences without the new daysBeforeEnd field. Existing
-- daily-reminder compatibility and its trigger stay unchanged.

create or replace function public.sync_notification_preference_formats()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  incoming_preferences jsonb := coalesce(
    new.notification_preferences,
    '{}'::jsonb
  );
  preferences jsonb;
  incoming_plan_schedule jsonb := coalesce(
    new.daily_plan_schedule,
    '{
      "version": 1,
      "timeMode": "device_local",
      "actions": {
        "session": "08:00",
        "handPicked": "13:00",
        "checkIn": "18:00"
      }
    }'::jsonb
  );
  plan_schedule jsonb;
  daily_plan_reminders jsonb;
  session_enabled boolean;
  session_time text;
  has_new_format boolean :=
    jsonb_typeof(incoming_preferences -> 'dailyPlanReminders') = 'object';
  has_legacy_format boolean :=
    jsonb_typeof(incoming_preferences -> 'dailyReminder') = 'object';
begin
  -- An old client replaces the entire JSON object and cannot preserve keys it
  -- has never seen. Retain the stored keys, then let the incoming values win.
  preferences := case
    when tg_op = 'UPDATE'
    then coalesce(old.notification_preferences, '{}'::jsonb) || incoming_preferences
    else incoming_preferences
  end;
  plan_schedule := case
    when tg_op = 'UPDATE'
    then coalesce(old.daily_plan_schedule, '{}'::jsonb) || incoming_plan_schedule
    else incoming_plan_schedule
  end;

  if tg_op = 'UPDATE' then
    plan_schedule := jsonb_set(
      plan_schedule,
      '{actions}',
      case
        when jsonb_typeof(old.daily_plan_schedule -> 'actions') = 'object'
          or jsonb_typeof(incoming_plan_schedule -> 'actions') = 'object'
        then coalesce(old.daily_plan_schedule -> 'actions', '{}'::jsonb) ||
          coalesce(incoming_plan_schedule -> 'actions', '{}'::jsonb)
        else '{}'::jsonb
      end,
      true
    );
  end if;

  -- Preserve reminder IDs added by a newer app when an older new-format app
  -- writes only the registry entries it knows.
  if tg_op = 'UPDATE'
    and jsonb_typeof(old.notification_preferences -> 'dailyPlanReminders') = 'object'
    and jsonb_typeof(incoming_preferences -> 'dailyPlanReminders') = 'object'
  then
    select coalesce(
      jsonb_object_agg(
        reminder_id,
        case
          when jsonb_typeof(
            old.notification_preferences #> array['dailyPlanReminders', reminder_id]
          ) = 'object'
            and jsonb_typeof(
              incoming_preferences #> array['dailyPlanReminders', reminder_id]
            ) = 'object'
          then (
            old.notification_preferences #> array['dailyPlanReminders', reminder_id]
          ) || (
            incoming_preferences #> array['dailyPlanReminders', reminder_id]
          )
          else coalesce(
            incoming_preferences #> array['dailyPlanReminders', reminder_id],
            old.notification_preferences #> array['dailyPlanReminders', reminder_id]
          )
        end
      ),
      '{}'::jsonb
    )
    into daily_plan_reminders
    from (
      select jsonb_object_keys(
        old.notification_preferences -> 'dailyPlanReminders'
      ) as reminder_id
      union
      select jsonb_object_keys(
        incoming_preferences -> 'dailyPlanReminders'
      ) as reminder_id
    ) as reminder_ids;

    preferences := jsonb_set(
      preferences,
      '{dailyPlanReminders}',
      daily_plan_reminders,
      true
    );
  end if;

  -- Older binaries write only enabled. Preserve the selected lead time when
  -- those clients replace the nested trial reminder preference.
  if tg_op = 'UPDATE'
    and jsonb_typeof(old.notification_preferences -> 'trialEndingReminder') = 'object'
    and jsonb_typeof(incoming_preferences -> 'trialEndingReminder') = 'object'
  then
    preferences := jsonb_set(
      preferences,
      '{trialEndingReminder}',
      (old.notification_preferences -> 'trialEndingReminder') ||
        (incoming_preferences -> 'trialEndingReminder'),
      true
    );
  end if;

  if has_new_format then
    session_enabled := case
      when jsonb_typeof(
        preferences #> '{dailyPlanReminders,session,enabled}'
      ) = 'boolean'
      then (
        preferences #>> '{dailyPlanReminders,session,enabled}'
      )::boolean
      else false
    end;

    session_time := case
      when plan_schedule #>> '{actions,session}'
        ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
      then left(plan_schedule #>> '{actions,session}', 5)
      else '08:00'
    end;

    preferences := jsonb_set(
      preferences,
      '{dailyReminder}',
      jsonb_build_object(
        'enabled', session_enabled,
        'time', session_time
      ),
      true
    );
  elsif has_legacy_format then
    session_enabled := case
      when jsonb_typeof(preferences #> '{dailyReminder,enabled}') = 'boolean'
      then (preferences #>> '{dailyReminder,enabled}')::boolean
      else false
    end;

    session_time := case
      when preferences #>> '{dailyReminder,time}'
        ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
      then left(preferences #>> '{dailyReminder,time}', 5)
      when plan_schedule #>> '{actions,session}'
        ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
      then left(plan_schedule #>> '{actions,session}', 5)
      else '08:00'
    end;

    daily_plan_reminders := case
      when jsonb_typeof(preferences -> 'dailyPlanReminders') = 'object'
      then preferences -> 'dailyPlanReminders'
      else jsonb_build_object(
        'session', jsonb_build_object('enabled', false),
        'handPicked', jsonb_build_object('enabled', false),
        'checkIn', jsonb_build_object('enabled', false)
      )
    end;

    daily_plan_reminders := jsonb_set(
      daily_plan_reminders,
      '{session}',
      case
        when jsonb_typeof(daily_plan_reminders -> 'session') = 'object'
        then (daily_plan_reminders -> 'session') ||
          jsonb_build_object('enabled', session_enabled)
        else jsonb_build_object('enabled', session_enabled)
      end,
      true
    );
    preferences := preferences || jsonb_build_object(
      'dailyPlanReminders',
      daily_plan_reminders
    );
    plan_schedule := jsonb_set(
      plan_schedule,
      '{actions,session}',
      to_jsonb(session_time),
      true
    );
  end if;

  new.notification_preferences := preferences;
  new.daily_plan_schedule := plan_schedule;
  return new;
end;
$$;
