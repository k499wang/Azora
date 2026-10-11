# Notifications Architecture

How the local-notification system is wired in this app, why it's shaped the way it is, and how to extend it safely.

---

## Module layout

```
src/services/notifications/
  types.ts                          shapes + defaults for user preferences
  notificationCatalog.ts            daily registry + content/channels/kinds
  notificationPreferencesCore.ts    pure preference defaults/merge/sanitization
  notificationSchedulerCore.ts      pure: prefs + state → desired notifications
  notificationScheduleRecords.ts    pure: serialize/compare stored records
  notificationScheduler.ts          orchestrator: reconcile desired vs stored
  notificationClient.ts             thin wrapper over expo-notifications
  notificationPreferencesService.ts Supabase-backed prefs CRUD

src/hooks/
  useNotificationBootstrap.ts          drives reconcile on sign-in + foreground
  useNotificationResponseBootstrap.ts  registers tap-response handler

src/lib/
  serializedAsync.ts                concurrency primitive (see "Concurrency" below)
```

**Rule of thumb:** pure logic lives in `core` and `records` (testable under `node:test`). Anything that touches Expo, AsyncStorage, or Supabase lives in `scheduler`, `client`, or `preferencesService`.

---

## The reconcile model

Expo doesn't give us a true cron-style recurring trigger that survives content changes. So we don't try to "subscribe to a recurring notification." Instead we re-derive the full desired list of upcoming notifications on every relevant state change and **reconcile** it with what's actually scheduled in the OS.

The data flow:

```
preferences + feature state
        │
        ▼
buildDesiredNotificationSchedule()   ← pure
        │  returns DesiredScheduledNotification[]
        ▼
reconcileScheduledNotifications()    ← side-effectful
   │
   ├─ load stored records from AsyncStorage
   ├─ for each desired item:
   │     ├─ unchanged → keep
   │     └─ new/changed → cancel old, schedule new, fire analytics
   ├─ cancel any stored items not in desired
   └─ save updated records to AsyncStorage
```

Each desired item has a **stableId** like `azora:daily:session:2026-05-17`
or `azora:trial:ending`. Stable IDs let us
diff "what we want" against "what we stored" without caring about Expo's
internal notification IDs.

Every plan uses one daily reminder with a rolling horizon of at most 14 days,
so at most 14 daily entries are pending, plus the optional trial-ending notice.
Every time the app foregrounds we reconcile again, so the horizon walks forward
and old days drop off.

If native scheduling fails partway through, the scheduler saves the successful
bookings and untouched records before reporting the error. A retry keeps those
bookings, and disabling the reminder or signing out can cancel them. A canceled
record is removed before its replacement is scheduled, so a failed time edit
cannot leave a missing notification marked as current.

---

## What triggers a reconcile

`useNotificationBootstrap` is the single owner of "when do we reconcile":

- On sign-in (and when prefs/entitlement queries finish loading).
- On every transition to foreground (`AppState` listener).
- On a new local day while the app remains mounted, to refill the rolling window.
- On sign-out → `cancelStoredNotifications` instead.

For new notification kinds that depend on user activity (e.g. streak-ending reminders that depend on `lastPracticeAt`), call `reconcileScheduledNotifications` directly after the state change. Don't try to schedule from inside feature code — go through the reconcile pathway so the diff stays authoritative.

---

## Concurrency: the serialized queue

The reconcile function does:

1. Read AsyncStorage.
2. Compute desired.
3. Cancel + schedule via Expo.
4. Write AsyncStorage.

If two reconciles run concurrently, both read the old AsyncStorage state in step 1 — neither sees the other's step 4 — and they both schedule the same items, double-fire `trackNotificationScheduled`, and race on the final write.

The fix is `src/lib/serializedAsync.ts`. It's a tiny primitive: a single promise tail that every new task hooks onto.

```ts
let tail = Promise.resolve();

run(task) {
  const next = tail.then(task, task);  // run AFTER whatever is currently in line
  tail = next.catch(() => undefined);  // you are now the tail; failures don't break the chain
  return next;
}
```

Both `reconcileScheduledNotifications` and `cancelStoredNotifications` go through one shared queue:

```ts
const reconcileQueue = createSerializedAsync();

export function reconcileScheduledNotifications(input) {
  return reconcileQueue.run(() => performReconcile(input));
}
```

Guarantees:

- Tasks run **strictly one-at-a-time**.
- Tasks run **in submission order**.
- A rejected task **does not poison** the queue — the next task still runs.
- When the queue is empty, a new task starts on the next microtask (no artificial delay).

Tests pinning these properties: `src/lib/serializedAsync.test.mjs`.

---

## Catalog: content lives in one place

`notificationCatalog.ts` owns:

- `NOTIFICATION_CHANNELS` — Android channel IDs.
- `ScheduledNotificationKind` — the union of every kind we schedule.
- `build*Content()` functions — each returns `{ title, body, data, channelId }`.

Two things to keep in mind:

1. **Always include `notification_kind` in `data`.** Include `destination` only
   when a notification intentionally deep-links. Daily-plan reminders omit it
   so tapping simply opens Azora.
2. **Keep content deterministic.** The one plan reminder uses intent-specific
   copy and bedtime wording for the sleep plan. Stable content keeps reconciles
   idempotent.

---

## Preferences

`NotificationPreferences` shape lives in `types.ts`. Two snapshots exist:

- `DEFAULT_NOTIFICATION_PREFERENCES` — generated from each registry entry's
  safe default.
- `ONBOARDING_NOTIFICATION_PREFERENCES` — generated from each registry entry's
  explicit onboarding default.

Server side: `notificationPreferencesService.ts` reads/writes only `user_preferences.notification_preferences` (jsonb). The legacy `reminder_enabled` / `reminder_time` columns are not part of the app's notification preference model.

`sanitizeNotificationPreferences` is the trust boundary — anything coming back from Supabase passes through it before reaching app code.

The times displayed on Today's Dailies live in
`user_preferences.daily_plan_schedule` and are read through
`src/services/dailyPlan/`. Notification preferences own only whether each
action is enabled. Only `session.enabled` controls today's plan reminder;
secondary keys remain for compatibility. Changing the main plan time
reconciles its scheduled notifications without duplicating the time in
notification preferences. Other exercise times remain display-only.

### Compatibility with older app versions

Migration `20260731000300_expand_daily_plan_notification_preferences.sql`
intentionally keeps both JSON contracts during the transition:

- old clients read and write `dailyReminder.enabled` and `dailyReminder.time`;
- new clients read and write `dailyPlanReminders`, with times in
  `daily_plan_schedule`.

A `BEFORE INSERT OR UPDATE` trigger merges incoming preferences with stored
unknown keys, mirrors guided-session enabled state between both contracts, and
mirrors its time between `dailyReminder.time` and
`daily_plan_schedule.actions.session`. This is necessary because an old binary
replaces the whole JSON object and cannot preserve keys it does not know.
Hand-picked, check-in, and future registry entries are retained when an old
client writes. If a payload explicitly contains both formats, the modern
`dailyPlanReminders` value is authoritative; current clients write only their
own format. Remove the compatibility trigger only after old app versions no
longer need database support.

---

## Storage versioning

AsyncStorage keys are versioned:

- `notifications:scheduled_records_v2` — current.
- `notifications:scheduled_ids_v1` — legacy, cleaned up on every reconcile.

When the record shape changes incompatibly, bump the version and add cleanup of the previous key inside `cancelLegacyStoredNotifications`. Never reuse a key with a new shape.

---

## Daily reminder registry

### One reminder for all plans

Every enrolled plan and account without an enrollment uses at most one daily
plan reminder at `daily_plan_schedule.actions.session`, regardless of how
many Resets the current day contains. Lighter days with no Reset still get
the plan reminder. The user's saved main time and later edits are authoritative.

The `night` plan calls this reminder **Bedtime routine**, with bedtime copy.
Onboarding initially places its main time 30 minutes before the user's bedtime.
An account without an enrollment and with a saved sleep goal uses the same
wording. Other plans show **Plan reminder**, including a sleep goal enrolled
in the phone plan. All plans have one Settings switch and time picker, and
onboarding uses the same notification title as the scheduler.

Neither `handPicked` nor `windDown` is scheduled, even when older saved
preferences enable them. Reconciliation cancels those obsolete OS notifications.
Onboarding enables only the main reminder when permission is granted. Unused
schedule hours and preference keys remain stored for compatibility; no
enrollment snapshots, exercise requirements, Home layout, or individual
exercise times are rewritten. Turning the main reminder off disables all daily
plan reminders.

Enrollment and profile metadata only choose notification wording. While that
metadata loads or fails, the canonical preferences and schedule can still book
one generic main reminder and Settings can still edit its switch and time.
When metadata arrives, reconciliation updates wording under the same stable IDs
without adding prompts. The rolling window does not depend on exercise count or
predict plan advancement, and it
does not suppress reminders after a task is completed. Trial-ending notices
remain an independent, optional billing reminder.

### Registry entries

`DAILY_REMINDER_DEFINITIONS` in `notificationCatalog.ts` is the source of truth
for daily-plan reminders. Each definition owns:

- its stable ID and analytics kind;
- the `daily_plan_schedule` action that supplies its time;
- notification title and body;
- safe existing-user and onboarding defaults;
- onboarding and Settings labels.

The preference sanitizer/defaults retain the legacy registry contracts.
The scheduler, onboarding preview, and Settings use the single main reminder
selected by `dailyReminderDefinitionsFor`. Adding an exercise or a schedule
slot does not add a notification: the one-reminder-per-day policy is explicit.
Any change to that policy requires updating scheduler regressions and the
physical-device checklist.

---

## How to add a new notification kind

Example: streak-ending reminder ("you'll lose your 12-day streak at midnight").

1. **Extend the preference shape** in `types.ts`:

   ```ts
  export interface NotificationPreferences {
    dailyPlanReminders: DailyPlanReminderPreferences;
    trialEndingReminder: TrialEndingReminderPreference;
    streakReminder: StreakReminderPreference;   // new
  }
   ```

   Update `DEFAULT_NOTIFICATION_PREFERENCES`, `sanitizeNotificationPreferences`, and the Supabase service in lockstep.

2. **Add the kind** to `ScheduledNotificationKind` in `notificationCatalog.ts` and a `buildStreakEndingContent(streak)` function that returns the content envelope.

3. **Extend the input** to `buildDesiredNotificationSchedule` with whatever state the new kind needs (e.g. `lastPracticeAt: string | null`).

4. **Add a branch** that pushes desired items:

   ```ts
   if (preferences.streakReminder.enabled) {
     const streakDate = getStreakReminderDate(lastPracticeAt, now);
     if (streakDate != null) {
       desired.push({
         stableId: `${AZORA_NOTIFICATION_ID_PREFIX}:streak:ending`,
         kind: 'streak_ending',
         ...buildStreakEndingContent(),
         trigger: { type: 'date', date: streakDate },
       });
     }
   }
   ```

5. **Trigger reconcile** from feature code wherever the relevant state changes (e.g. after a practice session completes):

   ```ts
   await reconcileScheduledNotifications({ preferences, trialEndsAt, lastPracticeAt });
   ```

6. **Add unit tests** to `notificationSchedulerCore.test.mjs` for the new branch — date math is the easiest place to introduce off-by-one bugs.

7. **Plumb the new input** through `useNotificationBootstrap` so foreground reconciles include it.

Daily recurring plan reminders belong in the existing registry. The steps in
this section are for notification kinds with genuinely different cadence or
state, such as a one-time trial or streak reminder.

---

## What NOT to do

- **Don't schedule notifications from feature code directly.** Always go through `reconcileScheduledNotifications`. The diff is the only thing that prevents duplicates and orphans.
- **Don't read or write the records key from anywhere except `notificationScheduler.ts`.** It's a private implementation detail.
- **Don't hardcode strings for `notification_kind` or `destination` in the tap handler.** Add them via the catalog so all kinds stay enumerable.
- **Don't try to use Expo's recurring trigger** for the daily reminder. The rolling horizon + reconcile model is intentional — it survives copy changes, time changes, and pref changes cleanly.
- **Don't bypass the serialized queue.** Anything that mutates scheduled state must go through it.

---

## Tests

- `notificationSchedulerCore.test.mjs` — pure schedule shape, time parsing, intent copy, and trial reminder math.
- `notificationPlanReminder.test.mjs` — one daily reminder for all plans, obsolete secondary cancellation, Settings, onboarding defaults, loading boundaries, and handled permission/save failures.
- `notificationScheduler.test.mjs` — production reconciliation with simulated storage and device APIs: legacy cancellation, ten repeated/concurrent refreshes, day rollover, time/copy replacement, disabling, revoked permission, sign-out, and recovery/cleanup after partial scheduling failure.
- `notificationScheduleRecords.test.mjs` — record sanitization and "is current" diff.
- `serializedAsync.test.mjs` — concurrency primitive (ordering, isolation, drain behavior).

The orchestrator tests run the production module with its real schedule, record,
and queue logic, substituting only storage, device calls, analytics, and the
current clock. No production adapter or test-only application configuration is
needed. OS delivery, permission dialogs, and visual presentation still require
the physical-device checklist in `notifications-test-checklist.md`.

Run `npm run check` for TypeScript and the full test suite. For a focused
notification check:

```sh
npm test -- src/services/notifications/notificationSchedulerCore.test.mjs src/services/notifications/notificationPlanReminder.test.mjs src/services/notifications/notificationScheduler.test.mjs
```

---

## Quick reference: files to touch for common changes

| Change                                  | Files                                                                 |
| --------------------------------------- | --------------------------------------------------------------------- |
| New daily-plan reminder                 | `notificationCatalog.ts`, the matching daily schedule action, onboarding icon, tests |
| New non-daily notification kind         | `types.ts`, `notificationCatalog.ts`, `notificationSchedulerCore.ts`, `useNotificationBootstrap.ts`, optionally `notificationPreferencesService.ts` |
| Edit reminder copy                      | `notificationCatalog.ts`                                              |
| Change reconcile trigger conditions     | `useNotificationBootstrap.ts`                                         |
| Change Android channel metadata         | `notificationClient.ts` (`ensureNotificationChannels`) + `notificationCatalog.ts` |
| Change persistence format               | `notificationScheduleRecords.ts` + bump key in `notificationScheduler.ts` |
| Add tap-routing for a new kind          | `notificationClient.ts` (`handleNotificationResponse`)                |
