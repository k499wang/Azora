# Notifications — Manual Test Checklist

How to validate the notification system on a real device. Pairs with `notifications.md`.

The system can't be tested fully in a simulator — push permission dialogs, scheduled triggers, and tap-from-locked-screen behavior all need a physical iPhone (and Android device once you start dual-targeting).

---

## Setup before testing

- [ ] Run on a **real device**, not the iOS simulator. Scheduled local notifications technically work on simulators, but tap-routing and permission edge cases don't match production.
- [ ] **Reset the app's permission state** before each cold-path test:
  - iOS: Settings → Azora → Notifications → Allow Notifications OFF, then delete app and reinstall to reset the system permission record.
  - Android: long-press app icon → App info → Notifications → toggle off, then clear storage.
- [ ] Enable an **easy time-mock**: temporarily set the daily reminder time to **2 minutes from now** in `NotificationsSettingsSheet` so you don't have to wait until 8 AM. Revert after the test.
- [ ] Open the device's **system notification settings** for Azora to confirm channel state (Android only — channels: `daily-reminders`, `billing`).
- [ ] Have **Metro logs visible** — search for `[notifications]` warnings.

---

## 1. Permission gating

- [ ] Cold install → run onboarding → tap "Allow notifications." System prompt appears, grant → reconcile fires, scheduled notifications appear in iOS Settings → Azora → Notifications → "Scheduled Summary" (iOS 15+) or via `expo-notifications` debug.
- [ ] Cold install → deny notifications → no notifications get scheduled, no crash, no infinite reconcile loop. AsyncStorage `notifications:scheduled_records_v2` should be `{}` or absent.
- [ ] App running with permission granted → revoke permission in iOS Settings → bring app to foreground → reconcile runs and **cancels all stored notifications**. This is the path that previously could deadlock; verify no hang.
- [ ] Re-grant permission → foreground app → notifications reappear.

## 2. Daily plan reminders — happy path

- [ ] On any plan, enable the plan reminder and set its time a few minutes ahead, then kill the app entirely. One notification fires while the app is closed.
- [ ] Tap each notification from the lock screen → Azora opens normally without navigating directly into an exercise.
- [ ] In Metro, plan reminders use `daily_plan_session` for `notification_scheduled` and `notification_tapped`; no new `daily_plan_hand_picked` or `daily_plan_wind_down` notifications are scheduled.
- [ ] Confirm each notification uses copy that matches its goal, including bedtime wording for sleep plans.

## 3. Daily reminder reconciliation

- [ ] Enable the plan reminder → inspect AsyncStorage for 14 unique `azora:daily:session:<date>` entries when today's time is still ahead, regardless of the plan's current Reset count.
- [ ] Reload the app twice with the same schedule → no new `notification_scheduled` analytics on the second run (idempotent reconcile).

### One reminder for every plan

- [ ] Onboard into the sleep (`night`) plan with bedtime at 10 PM → preview and Settings show one bedtime reminder at 9:30 PM, with bedtime copy.
- [ ] On a sleep-plan day with two or three Resets → only one bedtime plan reminder is scheduled. Individual Home rows, times, actions, and completion states remain as before.
- [ ] Open an existing account on each plan with all three reminder switches previously enabled → reconcile removes midday and extra evening notifications, leaving at most one plan reminder per date.
- [ ] Change the bedtime reminder time → its pending notifications update; no notification remains at the old time.
- [ ] Turn the plan reminder off → no daily plan notifications remain, including from previously enabled secondary switches.
- [ ] A lighter day with no Reset still has its one plan reminder.
- [ ] Reopen repeatedly, including after a plan-day change → notifications remain unique.
- [ ] Non-sleep plans and accounts without an enrollment show one Plan reminder control and keep their existing individual exercise rows and times.
- [ ] With saved notification preferences and schedule available, delay or fail the enrollment/profile lookup → one generic plan reminder and its Settings control remain available. Resolving the sleep enrollment updates the wording without adding a second prompt.
- [ ] Keep the app open across local midnight → the pending window refills with one main reminder per date, without replacing unchanged entries.
- [ ] Make a reminder-setting save fail → an error message appears, the saved switch/time stays unchanged, and trying again works.
- [ ] Inject a scheduling failure after a few successful bookings → signing out or turning the reminder off clears those bookings. A retry keeps successful bookings without adding duplicates.

## 4. Reconcile triggers

- [ ] Sign in → reconcile fires within ~1s.
- [ ] Background app → wait 30s → bring to foreground → reconcile fires again (watch for the second AsyncStorage write).
- [ ] Toggle the plan reminder OFF → all `azora:daily:session:*` entries are cancelled.
- [ ] Toggle it ON → its rolling-horizon entries reappear.
- [ ] Change the plan reminder time → its entries are replaced, with no entries left at its old time.
- [ ] Sign out → all stored notifications cancelled; storage key becomes `{}`.

## 5. Trial-ending reminder

- [ ] Set a test user with `trialEndsAt = two days from now 17:30 local` → reconcile schedules one `azora:trial:ending` notification at 09:00 one day before the trial end date.
- [ ] Set `trialEndsAt = 30 minutes from now` (i.e. the 09:00 anchor is in the past) → reconcile schedules the catch-up reminder 5 minutes from now.
- [ ] Set `trialEndsAt = null` → no trial notification.
- [ ] Set `trialEndsAt` to a past date → no trial notification scheduled.
- [ ] Trial reminder fires → tap → routes to **Profile**.

## 6. Concurrency (the bug we just fixed)

- [ ] Sign in **then immediately background and foreground the app** within 1 second → only one set of `notification_scheduled` analytics events for that schedule cycle. Without the serialized queue, you'd see ~28 events instead of 14.
- [ ] Toggle daily reminder ON/OFF/ON rapidly (3 taps within a second) → end state is correct (14 entries) with no duplicates, no orphans.
- [ ] Revoke permission while a reconcile is in flight → no hang (this was the deadlock path).

## 7. Edge cases

- [ ] Phone in airplane mode → local notifications still fire (they're local, not push).
- [ ] Phone time zone changes (fly to a new TZ in Settings → General → Date & Time) → foreground app → notifications re-schedule for the local time in the new zone.
- [ ] Phone time changes manually backward by 1 day → foreground → reconcile re-derives correctly (today's entry may shift).
- [ ] OS-level Focus / Do Not Disturb is on → notification still scheduled, OS handles display silencing. Not our concern.
- [ ] Daylight saving transition day → reminder fires at the configured wall-clock time both sides of the change.

## 8. Android-specific (when you start dual-targeting)

- [ ] First launch creates both channels (`daily-reminders`, `billing`) with correct names/descriptions.
- [ ] User disables the `daily-reminders` channel in system settings → app still works, no crash; notifications silently don't appear.
- [ ] App killed by Android battery optimization → reminders still fire (Expo uses AlarmManager). If they don't, the user needs to whitelist Azora — note this in onboarding.

## 9. Storage migrations

- [ ] Install old build that wrote `notifications:scheduled_ids_v1` → upgrade to current build → on first reconcile, legacy key is cancelled and removed. Check `notifications:scheduled_ids_v1` is gone.
- [ ] Install the previous single-reminder build, enable its reminder, and set a distinctive time. Upgrade without deleting the app. On first launch, confirm the old scheduled entries are cancelled and one `session` reminder is recreated at the same time; `handPicked` and `checkIn` remain disabled.
- [ ] In the new build, enable `handPicked` and `checkIn`, then reinstall the previous build without clearing app data. Confirm its single reminder still works and can be edited. Reinstall the new build and confirm the two retained reminder choices return while the legacy scheduled entries are replaced.
- [ ] Before releasing the new binary, query an existing legacy row after applying the compatibility migration. Confirm both `dailyReminder` and `dailyPlanReminders` exist, the session enabled state/time agree, and existing `trialEndingReminder` data remains unchanged.
- [ ] Manually corrupt `notifications:scheduled_records_v2` (set to `"not json"` via dev tools) → app survives, reconciles fresh.

---

## What changed since the last review

If you're auditing this list after the recent work:

- **Concurrency fix** (`notificationScheduler.ts`): both `reconcileScheduledNotifications` and the public `cancelStoredNotifications` go through one shared serialized queue (`src/lib/serializedAsync.ts`). Without it, overlapping calls (sign-in + foreground, rapid pref toggles) read stale AsyncStorage and double-scheduled.
- **Deadlock fix** (`notificationScheduler.ts:41`): when permission isn't granted, the in-queue reconcile now calls the internal `performCancelStoredNotifications()` instead of the public `cancelStoredNotifications()`, which would have awaited its own queue tail and hung forever.
- **New tests** (`src/lib/serializedAsync.test.mjs`): 5 tests pinning ordering, isolation under task rejection, and drain behavior.
- **Architecture doc** (`docs/architecture/notifications.md`): walks through the module layout, reconcile model, and how to add new notification kinds.

Items 1 (permission revoke path) and 6 (concurrency) directly exercise the bugs that were fixed — prioritize those first.

---

## Suggested smoke test before each release

The minimum-viable pass that catches the most common regressions:

1. Cold install → onboarding → grant permission → all three reminder kinds are scheduled.
2. Toggle one reminder off → no notification at that action's next scheduled time.
3. Tap a fired notification → opens Azora normally.
4. Revoke permission in iOS Settings → reopen app → no hang, no crash.

Anything beyond that is hardening; these four are the regression floor.
