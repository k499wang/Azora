# Feature Gating

How free/Pro features are gated in this app, why the obvious approach is wrong, and how to add a new gated feature without re-introducing the bugs we already fixed.

Read this before touching anything in `src/services/subscriptions/`, `src/hooks/useFeatureAccess.ts`, or any flow that calls `useFeatureAccess`.

---

## The core paradigm: gate the **action**, not the **route**

**Rule: gate at the press handler that initiates a paid action. Never gate the route a user is *viewing*.**

A user who already consumed today's measurement still has a legitimate reason to be on `HeartRate` / `DailyExercise` / `DailyResult`: to look at their result. If you wrap the route in a gate, that gate fires *after* a successful save (when usage flips from 0 → 1, `allowed` flips from `true` → `false`) and boots the user to the paywall mid-result-view. Worse, dismissing the paywall returns them to the same gated route, the gate's `useEffect` re-fires, and you get an infinite redirect loop.

This bug shipped twice in this codebase (HR + DailyExercise). Don't do it again.

### Where to gate

| Layer | Gate here? | Why |
|---|---|---|
| **Press handler** that starts the paid action (tab tap, "Start" button, "Retry" button) | ✅ Always | The only correct point. Allowed → start; not allowed → push to paywall. |
| **Route component** (`useEffect` on access change → `navigation.replace('ProPaywall')`) | ❌ Never | Causes the post-save redirect bug and dismiss-loop bug. |
| **Server-side RPC** that records the usage | ✅ Yes (defense in depth) | Hardens against client tampering. Can be deferred but should exist before launch. |

### The redirect-loop antipattern (do not write this)

```tsx
// ❌ WRONG — causes the post-save flicker → paywall → infinite loop
function GatedHeartRateScreen(props) {
  const access = useFeatureAccess(FeatureKey.HeartRateMeasurement);
  useEffect(() => {
    if (!access.isLoading && !access.allowed) {
      props.navigation.replace('ProPaywall', { ... });
    }
  }, [access.allowed, access.isLoading]);
  // ...
}
```

Two failure modes baked into this:
1. After a save, `allowed` flips false → the user viewing their fresh result is yanked to the paywall.
2. Dismissing the paywall returns to the route → the effect re-fires → loop.

The right place for that check is the press handler that brought them here in the first place.

### The correct shape

```tsx
// ✅ RIGHT — gate at the action
const access = useFeatureAccess(FeatureKey.HeartRateMeasurement);

const handleMeasurePress = () => {
  if (!access.allowed && !access.isLoading) {
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.HeartRateProGate,
      sourceScreen: 'MainTabs',
      feature: FeatureKey.HeartRateMeasurement,
    });
    return;
  }
  navigation.navigate('HeartRate');
};
```

`isLoading` matters: while entitlement/usage data is in flight, default to *allowed* (let them through) rather than blocking. Otherwise a free user with a slow network gets paywalled even when they have quota.

### Multiple entry points to the same paid action

If a feature has more than one entry point (tab bar, home card, library), **every** entry point gates independently with the same pattern. There is no single chokepoint to lean on.

For Daily Exercise today:
- `MainTabs.tsx:60` (Daily in tab sheet)
- `MainTabs.tsx:70` (Box in tab sheet)
- `HomeScreen.tsx:306` (DailyPlanCard onPress override)
- `BreathingLibrary.tsx:54` (TechniqueCard handlePress)

When adding a new entry point, the gate is part of the change — not a follow-up.

### In-flow retry buttons count as a new entry point

A "Retry" button on a result screen is a fresh `start_action` and must gate. See `HeartRateCaptureFlow.tsx:153-176`. Without that gate, a free user can hit Retry to start a 2nd measurement after the 1st saved.

---

## End-to-end recipe: adding a new gated feature

Say we want to add `MeditationTimer` with a 1/day free limit.

### 1. Add the key + limit

`src/services/subscriptions/featureAccess.ts`:

```ts
export const FeatureKey = {
  HeartRateMeasurement: 'heart_rate_measurement',
  DailyExercise: 'daily_exercise',
  MeditationTimer: 'meditation_timer',  // ← new
  // ...
} as const;

const FREE_DAILY_LIMITS: Partial<Record<FeatureKeyValue, number>> = {
  [FeatureKey.HeartRateMeasurement]: 1,
  [FeatureKey.DailyExercise]: 1,
  [FeatureKey.MeditationTimer]: 1,  // ← new
};
```

If the new feature is Pro-only (no free quota), leave it out of `FREE_DAILY_LIMITS` — `getFeatureAccess` will return `pro_only`.

### 2. Add a counter column on `daily_activity` (if it has a daily limit)

```sql
alter table daily_activity
  add column meditation_count int not null default 0;
```

Update `DailyFeatureUsage` and `getDailyFeatureUsage` in `featureAccess.ts` to read it, and `getFeatureAccess` to map the `FeatureKey` to its counter.

### 3. Add a `PaywallPlacement` enum value

`src/services/paywall/placements.ts` (or wherever `PaywallPlacement` lives). Placement is what RevenueCat sees — pick a name that's analytics-meaningful (`MeditationProGate`, not `Paywall1`).

### 4. Wire the press handler

```tsx
const access = useFeatureAccess(FeatureKey.MeditationTimer);

const handleStartMeditation = () => {
  if (!access.allowed && !access.isLoading) {
    navigation.navigate('ProPaywall', {
      placement: PaywallPlacement.MeditationProGate,
      sourceScreen: 'Home',
      feature: FeatureKey.MeditationTimer,
    });
    return;
  }
  navigation.navigate('MeditationSession');
};
```

If the feature has multiple entry points, repeat at each one. Do not extract a "gated navigate" helper unless there are 4+ call sites — premature abstraction here is worse than the duplication.

### 5. Wire the post-save mutation invalidation

When the action completes and the counter increments, the React Query cache must be invalidated so the next `useFeatureAccess` read sees the new count.

```ts
return useMutation({
  mutationFn: async (input) => { /* RPC call */ },
  onSuccess: async () => {
    const timezone = getDeviceTimezone();
    // Anchor to a wall-clock source. NEVER frame.timestamp / monotonic.
    const usageDate = formatLocalDate(Date.now(), timezone);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getHomeStatsQueryKey(userId) }),
      queryClient.invalidateQueries({
        queryKey: getDailyFeatureUsageQueryKey(userId, usageDate),
      }),
    ]);
  },
});
```

The query key includes the local date. If you invalidate the wrong date, the gate stays stale. See "Cache invalidation correctness" below.

### 6. Do **not** add a route-level gate

No `<GatedMeditationScreen>`. Register the bare screen and trust the entry-point gates.

### 7. (Recommended) Server-side enforcement

In the RPC that records the action, check the day's count before incrementing and reject if at the limit. This is a separate task and can ship after the client gate, but it should ship before public launch — otherwise a tampered client grants free Pro.

---

## Cache invalidation correctness

The gate reads `daily_feature_usage` keyed by `(userId, localDate)`. Three things must be true for it to behave:

### 1. The query key uses **today's** local date for the user's timezone

Not UTC. Not the device's `getDate()` if the user is traveling. Use:

```ts
new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
  .formatToParts(new Date(timestampMs))
```

See `formatLocalDate` in `src/lib/heartRate/sessionPayload.ts` — that's the canonical implementation.

### 2. Date inputs to `formatLocalDate` come from a **wall-clock** source

This is the 1970-bug class. There are two clocks in this app:

- **Wall-clock**: `Date.now()`, `new Date().toISOString()`, server timestamps. Unix epoch. Real human time.
- **Monotonic**: `frame.timestamp` from `react-native-vision-camera`, `performance.now()`. Milliseconds since boot. Useful only for *deltas*.

If you pass a monotonic timestamp to `new Date(...)`, you get January 1970. The local date becomes `1970-01-XX`, the `daily_feature_usage` invalidation hits a key no component subscribes to, and the gate stays stale forever.

**Rules:**
- Anchor session times to `recordedAt` (set via `new Date().toISOString()`).
- Use `frame.timestamp` only for `b - a` deltas (durations, peak intervals).
- The test in `sessionPayload.test.mjs` titled "frame timestamps from a monotonic clock..." pins this contract. If anyone passes a monotonic timestamp to `new Date()` in `sessionPayload.ts`, that test goes red.

### 3. Invalidation runs **unconditionally** in `onSuccess`

Don't make invalidation conditional on having sample data, a non-null timestamp, or any other field that could be missing. If the RPC succeeded, the counter changed; the cache must be busted. The cost of an extra invalidation is one refetch; the cost of a missed invalidation is the entire gate failing silently.

---

## Testing checklist

When adding or changing a gated feature, manually verify:

### Post-save behavior (the bug class we already hit)
- [ ] Free user, fresh day, completes action once → result screen visible
- [ ] **They can stay on the result screen indefinitely without being redirected to a paywall.**
- [ ] They can navigate away and come back to view past results.
- [ ] Tapping the entry point a 2nd time → paywall.
- [ ] Dismissing the paywall returns them home cleanly. **No infinite loading screen.**
- [ ] In-flow Retry/Restart buttons gate the same way.

### Day rollover & timezones
- [ ] Save action just before midnight local → `local_date` in DB is the *pre-midnight* date.
- [ ] Save action right after midnight → counter resets, free user gets their daily 1 again.
- [ ] User on `America/Los_Angeles` saving at 23:59 PT (06:59 UTC the next day) → gate uses PT date, not UTC.
- [ ] User flying from `America/Toronto` to `Asia/Tokyo` mid-day → gate uses device current tz, not last-saved tz.

These are pinned by tests in `src/lib/heartRate/sessionPayload.test.mjs` for the HR payload path. Any new gated feature that produces dated rows should have similar tests for its payload builder. Test names to mirror:
- `"frame timestamps from a monotonic clock (post-boot ms) still produce a today-correct local_date"` (catches 1970 bug)
- `"local_date reflects the user timezone, not UTC, for the same UTC moment"`
- `"session crossing midnight is attributed to the day it ended on"`

### Pro user sanity
- [ ] Pro entitlement → unlimited; never sees the paywall.
- [ ] Pro user during entitlement loading → defaults to allowed (not blocked).

### Slow-network sanity
- [ ] First app open with cold cache → user is not blocked while `useDailyFeatureUsageQuery` is pending. The `isLoading` branch in every press handler is what protects this.

### Multiple entry points
- [ ] Every entry point to the action gates. Grep for `navigate('<RouteName>')` and confirm each call site has the access check above it.

---

## Quick checklist before merging a gating change

- [ ] Press handlers gate, routes don't.
- [ ] Every entry point to the paid action has its own check.
- [ ] In-flow Retry/Restart counts as an entry point.
- [ ] Mutation `onSuccess` invalidates the daily usage key with a **wall-clock** date.
- [ ] No `frame.timestamp` (or any monotonic source) is passed to `new Date()`.
- [ ] Result/history routes are **not** wrapped in a gate component.
- [ ] Tests in `sessionPayload.test.mjs` (or equivalent for the new feature) still pass.
- [ ] `npx tsc --noEmit` clean.

---

## Reference: where the pieces live

| Concern | File |
|---|---|
| Feature keys + free limits | `src/services/subscriptions/featureAccess.ts` |
| `useFeatureAccess` hook | `src/hooks/useFeatureAccess.ts` |
| Daily usage query | `src/queries/subscriptions/useDailyFeatureUsageQuery.ts` |
| Local-date formatter | `src/lib/heartRate/sessionPayload.ts` (`formatLocalDate`) |
| HR mutation invalidation | `src/queries/tracking/useCompleteHeartRateSessionMutation.ts` |
| Breath-hold mutation invalidation | `src/queries/tracking/useCompleteBreathHoldMutation.ts` |
| Entry-point gates (HR + Daily) | `src/app/navigation/MainTabs.tsx`, `src/screens/HomeScreen.tsx`, `src/components/home/BreathingLibrary.tsx` |
| In-flow retry gate (HR) | `src/components/heartRate/HeartRateCaptureFlow.tsx:153` |
| Timezone/day-rollover tests | `src/lib/heartRate/sessionPayload.test.mjs` |
