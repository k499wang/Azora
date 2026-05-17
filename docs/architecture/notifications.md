# Notifications Architecture

How the local-notification system is wired in this app, why it's shaped the way it is, and how to extend it safely.

---

## Module layout

```
src/services/notifications/
  types.ts                          shapes + defaults for user preferences
  notificationCatalog.ts            content (titles, bodies, channels, kinds)
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

Each desired item has a **stableId** like `azora:daily:2026-05-17` or `azora:trial:ending`. Stable IDs let us diff "what we want" against "what we stored" without caring about Expo's internal notification IDs.

A **14-day rolling horizon** of daily reminders is scheduled at once. Every time the app foregrounds we reconcile again, so the horizon walks forward and old days drop off.

---

## What triggers a reconcile

`useNotificationBootstrap` is the single owner of "when do we reconcile":

- On sign-in (and when prefs/entitlement queries finish loading).
- On every transition to foreground (`AppState` listener).
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

1. **Always include `notification_kind` and `destination` in `data`.** The tap handler in `notificationClient.ts` reads these to fire `trackNotificationTapped` and (eventually) route deep links.
2. **Rotate copy by day index, not by random.** `buildDailyReminderContent(hour, dayIndex)` indexes into a variant pool so the same day always renders the same copy — which means reconciles are idempotent.

---

## Preferences

`NotificationPreferences` shape lives in `types.ts`. Two snapshots exist:

- `DEFAULT_NOTIFICATION_PREFERENCES` — for users who haven't completed onboarding.
- `ONBOARDING_NOTIFICATION_PREFERENCES` — what onboarding writes when the user opts in.

Server side: `notificationPreferencesService.ts` reads/writes only `user_preferences.notification_preferences` (jsonb). The legacy `reminder_enabled` / `reminder_time` columns are not part of the app's notification preference model.

`sanitizeNotificationPreferences` is the trust boundary — anything coming back from Supabase passes through it before reaching app code.

---

## Storage versioning

AsyncStorage keys are versioned:

- `notifications:scheduled_records_v2` — current.
- `notifications:scheduled_ids_v1` — legacy, cleaned up on every reconcile.

When the record shape changes incompatibly, bump the version and add cleanup of the previous key inside `cancelLegacyStoredNotifications`. Never reuse a key with a new shape.

---

## How to add a new notification kind

Example: streak-ending reminder ("you'll lose your 12-day streak at midnight").

1. **Extend the preference shape** in `types.ts`:

   ```ts
   export interface NotificationPreferences {
     dailyReminder: DailyReminderPreference;
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

> If you find yourself adding the third or fourth `if` branch in `buildDesiredNotificationSchedule`, refactor it into a registry of kind-schedulers — each kind exporting a `{ isEnabled, build }` pair. The cost of staying with conditionals grows roughly linearly; the registry refactor is a one-time cost.

---

## What NOT to do

- **Don't schedule notifications from feature code directly.** Always go through `reconcileScheduledNotifications`. The diff is the only thing that prevents duplicates and orphans.
- **Don't read or write the records key from anywhere except `notificationScheduler.ts`.** It's a private implementation detail.
- **Don't hardcode strings for `notification_kind` or `destination` in the tap handler.** Add them via the catalog so all kinds stay enumerable.
- **Don't try to use Expo's recurring trigger** for the daily reminder. The rolling horizon + reconcile model is intentional — it survives copy changes, time changes, and pref changes cleanly.
- **Don't bypass the serialized queue.** Anything that mutates scheduled state must go through it.

---

## Tests

- `notificationSchedulerCore.test.mjs` — pure schedule shape (horizon length, time parsing, trial reminder math, variant rotation).
- `notificationScheduleRecords.test.mjs` — record sanitization and "is current" diff.
- `serializedAsync.test.mjs` — concurrency primitive (ordering, isolation, drain behavior).

The orchestrator (`notificationScheduler.ts`) is currently untested at the integration level because it transitively imports `expo-notifications` and `react-native`. If you need coverage, the next step is to extract the AsyncStorage + Expo calls behind a small adapter interface and inject a fake one.

---

## Quick reference: files to touch for common changes

| Change                                  | Files                                                                 |
| --------------------------------------- | --------------------------------------------------------------------- |
| New notification kind                   | `types.ts`, `notificationCatalog.ts`, `notificationSchedulerCore.ts`, `useNotificationBootstrap.ts`, optionally `notificationPreferencesService.ts` |
| Edit reminder copy                      | `notificationCatalog.ts`                                              |
| Change reconcile trigger conditions     | `useNotificationBootstrap.ts`                                         |
| Change Android channel metadata         | `notificationClient.ts` (`ensureNotificationChannels`) + `notificationCatalog.ts` |
| Change persistence format               | `notificationScheduleRecords.ts` + bump key in `notificationScheduler.ts` |
| Add tap-routing for a new kind          | `notificationClient.ts` (`handleNotificationResponse`)                |
