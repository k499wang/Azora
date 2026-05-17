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

## 2. Daily reminder — happy path

- [ ] Enable daily reminder, time = 2 minutes from now → kill the app entirely (swipe up) → wait → notification fires while app is closed.
- [ ] Tap the notification from the lock screen → app opens to **DailyExercise** screen (`data.destination` routing).
- [ ] In Metro, `notification_scheduled` and `notification_tapped` analytics events fire with `notification_kind: 'daily_reminder_morning'` or `'daily_reminder_evening'` based on the time chosen.
- [ ] Set time to **before** 14:00 → kind should be `daily_reminder_morning`. Set to ≥ 14:00 → `daily_reminder_evening`.

## 3. Daily reminder — variant rotation

- [ ] Enable daily reminder → inspect AsyncStorage record for `azora:daily:<date>` entries → confirm 14 entries with distinct `variant_index` values that rotate by day, not by random.
- [ ] Reload the app twice with the same date and time → no new `notification_scheduled` analytics on the second run (idempotent reconcile).

## 4. Reconcile triggers

- [ ] Sign in → reconcile fires within ~1s.
- [ ] Background app → wait 30s → bring to foreground → reconcile fires again (watch for the second AsyncStorage write).
- [ ] Toggle reminder OFF → all `azora:daily:*` notifications are cancelled. Check iOS Scheduled Summary is empty.
- [ ] Toggle reminder ON → 14 entries reappear.
- [ ] Change reminder time → all old entries cancelled, new ones scheduled at the new time. No leftover notifications at the old time.
- [ ] Sign out → all stored notifications cancelled; storage key becomes `{}`.

## 5. Trial-ending reminder

- [ ] Set a test user with `trialEndsAt = tomorrow 09:00 local` → reconcile schedules one `azora:trial:ending` notification at 09:00 on the trial end date.
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

1. Cold install → onboarding → grant permission → reminder fires at scheduled time.
2. Toggle reminder off → no notification at the next scheduled time.
3. Tap a fired notification → opens DailyExercise.
4. Revoke permission in iOS Settings → reopen app → no hang, no crash.

Anything beyond that is hardening; these four are the regression floor.
