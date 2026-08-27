# Room Gamification Correctness Audit

Date: 2026-08-26

## Scope and verdict

This audit traced the room loop from completing Today's Dailies through earning,
choosing, and saving a decoration; completing all seven room slots; choosing the
next room; returning Home; and viewing saved rooms in the hotel. It also reviewed
account isolation, cache updates, navigation recovery, retries, concurrency,
offline behavior, migrations, services, hooks, screens, tests, and the relevant
architecture documentation.

The normal single-device, online happy path is coherent. A signed-in user who
completes the two breathing dailies and the breath-hold daily can place one
decoration. Decorations fill `day1` through `day7` in order, the seventh piece
finishes the room, the user chooses a new room look, and the next floor opens.
Successful writes update the current-room cache and refresh the hotel and History
where required. Home also provides recovery entry points when a decoration or a
finished room was left waiting.

The feature is not yet fully resilient. A session completion can be lost when its
background save fails. Room writes are made as several independent database
requests, so concurrent use on two devices can create duplicate floors. A write
whose database commit succeeds but whose response is lost can leave the app
showing stale state and rejecting the user's retry. These are resilience and
data-integrity risks rather than failures of the ordinary single-device happy
path, but they prevent a verdict that the loop is correct under realistic failure
conditions.

This was a repository audit. It did not verify that the linked production
Supabase project has every room migration deployed.

## Current intended loop

1. Today's three dailies are the recommended guided-breathing technique, the
   hand-picked daily technique, and the daily breath hold.
2. Completing all three makes one decoration claimable for the device-local
   date.
3. The user opens the room, taps the next empty slot, chooses one of that slot's
   authored objects, and confirms the placement.
4. The first confirmed placement lazily creates floor 1. Later placements use
   the current highest floor.
5. A user can earn at most one decoration per local date. Missing a day does not
   leave a hole; the next earned object fills the next slot.
6. Slots fill from `day1` to `day7`. The seventh successful write replays the
   completed room and offers the next-room picker.
7. The user selects a room look. Floor `n + 1` opens empty, and the flow returns
   to the existing Home root.
8. The hotel reads every saved floor and its saved decorations.

The pure rule is centralized in
`src/lib/room/roomProgress.ts` around lines 62-87. The shared React view of room
and daily state is in `src/features/room/useRoomClaim.ts` around lines 22-43.

## What “non-atomic” means here

An atomic operation succeeds completely or changes nothing. The room flow does
not currently make one atomic server operation for “verify eligibility and place
the object” or for “verify this room is full and create exactly one next floor.”
Instead, the app reads state, makes a decision locally, and then sends a separate
insert.

For example, first placement does the following in separate requests:

1. read the current room and latest earned date;
2. create floor 1 if no room exists;
3. insert the decoration;
4. read the decorations again.

That sequence is visible in `src/services/room/roomService.ts` around lines
273-310, with room creation around lines 235-261. Another device can act between
any two steps. The database also does not make `(user_id, floor)` unique:
`supabase/migrations/20260807000100_create_room_hotel.sql` creates only a normal
index around line 22. A decoration is unique only within one room slot, around
lines 28-40. The daily-earn migration adds `earned_local_date` but no per-user,
per-date uniqueness rule in
`supabase/migrations/20260807000200_room_daily_earn.sql` around lines 13-21.

The same issue applies to opening the next room. The app reads the current room,
checks that it is full, and then performs a separate insert in
`src/services/room/roomService.ts` around lines 318-337. No transaction or unique
constraint joins those steps.

## Concrete user-visible failure scenarios

### Two devices place the first object

Both devices can read “no current room.” Each can then create its own floor 1
and insert `day1` into that different room. Because `(user_id, floor)` is not
unique, both floor-1 rows are valid. The highest-floor query orders only by floor
in `src/services/room/roomService.ts` around lines 120-143, so future reads can
choose either duplicate. The hotel can show both rows, while one becomes an
apparently abandoned room.

This does not require a malicious client. It requires the same account to act on
two devices at nearly the same time.

### Two devices open the next floor

After floor 1 is full, both devices can pass the local full-room check and each
insert floor 2. The database accepts both because floor number is not unique per
user. The result is the same duplicate-floor ambiguity as first-room creation.

### The decoration commits but its response is lost

The database may save the decoration and then the connection may fail before the
app receives the success response. Regular inserts are deliberately not retried
by `src/services/supabase/fetchWithRetry.ts` around lines 98-120 and 152-161.
The mutation updates and invalidates caches only in `onSuccess` in
`src/queries/room/usePlaceDecorationMutation.ts` around lines 23-44.

The screen therefore reports “Could not place that piece” and asks the user to
try again (`src/screens/RoomDecorateScreen.tsx`, around lines 126-135), even
though the piece exists on the server. The retry still carries the old slot. A
fresh service read sees that the server has advanced to the next slot, so the
slot guard in `src/services/room/roomService.ts` around lines 289-292 rejects the
retry. Because the failed mutation does not reconcile the current-room cache,
the user may need to wait for staleness, reopen the app, or otherwise force a
fresh read before the UI agrees with the server.

### The next room commits but its response is lost

The new floor can be inserted while the app receives an error. Retrying then
reads the newly created empty room and fails the “current room must be full”
check in `src/services/room/roomService.ts` around lines 323-331. The Next Room
screen has no error message or explicit recovery path in
`src/screens/NextRoomScreen.tsx` around lines 48-70, and its mutation only
reconciles caches on success in
`src/queries/room/useCreateNextRoomMutation.ts` around lines 12-27.

### A completed session fails to save

Guided breathing navigates to its result before persistence and starts the save
as detached background work in
`src/features/exercise/guidedBreathing/GuidedBreathingSessionScreen.tsx` around
lines 250-285. Failure is sent to error tracking, but the user gets no retry and
the completion is not queued durably.

Daily breath hold also begins saving and immediately navigates in
`src/features/exercise/dailyBreathHold/DailyBreathHoldScreen.tsx` around lines
405-415. Its persistence hook shows an alert on failure, but it does not provide
a retry action or persist the unsaved completion after the source screen is
replaced (`src/features/exercise/dailyBreathHold/hooks/useBreathHoldCompletionPersistence.ts`,
around lines 31-45 and 78-85).

The result celebration projects the just-finished daily locally so that
animation does not wait for the network
(`src/features/room/useDailyCompleteSnapshot.ts`, around lines 47-75). As a
result, the sheet can say that all three dailies are done while the live room
claim correctly withholds the decoration button. The `rewardReady` guard is
wired in `src/screens/SessionCompleteScreen.tsx` around lines 255-270 and
`src/screens/ShareableResultScreen.tsx` around lines 229-245. If persistence
never succeeds, the user must repeat the session to make the daily canonical and
unlock the room.

## Severity-ranked technical findings

### High: room invariants are not enforced atomically

The database and service do not guarantee exactly one floor number per user or
exactly one reward per user and local date. Eligibility is calculated on the
client. `placeDecoration` hard-codes `dailiesComplete: true` and validates only
that the requested slot is next; it does not reject `claimedToday` in
`src/services/room/roomService.ts` around lines 280-300. RLS in
`supabase/migrations/20260807000100_create_room_hotel.sql` around lines 49-92
correctly restricts normal access to rows carrying the authenticated user ID,
but it does not enforce the game rules.

The current-room model can also be a torn read. Room/decorations and the user's
latest earn date are loaded through parallel, independent queries in
`src/services/room/roomService.ts` around lines 103-154. Under a concurrent
write, one half can reflect state from before the write and the other from after
it.

### High: a daily completion is not durable across save failure

Both exercise flows leave the source screen before persistence settles, and
neither has a durable retry queue. Guided breathing fails silently from the
user's perspective. Breath hold reports failure but cannot retry the captured
completion after navigation. This can make the result screen and local
celebration disagree with canonical daily and room eligibility.

### Medium: ambiguous room commits are not reconciled

Room writes are intentionally not automatically retried because they are not
idempotent, which is safe against blind duplicate inserts. However, neither room
mutation handles the “commit succeeded, response failed” case by reading
canonical state. `usePlaceDecorationMutation.ts` around lines 23-74 and
`useCreateNextRoomMutation.ts` around lines 12-46 contain success handling but no
error reconciliation. Current-room and hotel queries have five-minute stale
times (`src/queries/room/useCurrentRoomQuery.ts` around lines 8-14 and
`src/queries/room/useRoomsQuery.ts` around lines 9-15), while global
`refetchOnWindowFocus` is disabled in `src/app/providers/AppProviders.tsx`
around lines 19-24. This extends the visible stale period.

### Medium: server changes from another device are not refreshed promptly

There is no room subscription or focus refetch. A second device can retain a
fresh five-minute cache after the first device places an object or opens a floor.
Its attempted action is protected from writing the same room slot by the service
guard and database uniqueness, but the failure does not refresh its UI. The user
can remain stuck on an obsolete action until a later refetch.

### Low: room read failures can look like empty state

`useRoomClaim` defaults missing query data to an empty room and no prior earn,
and its public loading flag does not include `isError`
(`src/features/room/useRoomClaim.ts`, around lines 22-43). If daily data is
cached but the current-room read fails, the UI can offer a 0/7 decoration that
the service later rejects. The hotel deliberately avoids drawing a fake empty
room on error, but it renders a blank canvas without error or retry messaging in
`src/screens/HotelScreen.tsx` around lines 66-96.

### Low: generated database types do not cover the room schema

`rooms` and `room_decorations` are not present in the generated Supabase database
types. `src/services/room/roomService.ts` instead declares its own local schema
around lines 28-76. This is not a current runtime defect, but it means TypeScript
cannot detect drift between the room service and generated or deployed schema.

## Validated correct behavior

The following behavior is correctly represented in the inspected code and
tests:

- Daily status has one shared owner. `src/hooks/useDailiesCompletion.ts` around
  lines 43-103 derives the two breathing-technique completions and the breath
  hold, and does not expose `allCompleted` while required data is loading.
- Stored daily plans avoid making the recommended and hand-picked technique the
  same daily. The daily-plan domain replaces a newly excluded primary technique
  and keeps a valid seven-day rotation.
- `roomProgress` fills the first empty known slot, handles legacy gaps, counts a
  duplicated slot once, ignores unknown legacy slots, closes the room after
  seven known slots, blocks an already-earned local date, and preserves the
  one-per-day rule after a new floor opens.
- The picker only exposes an authored option for the next slot and blocks repeat
  confirmation while its mutation is pending in
  `src/screens/RoomDecorateScreen.tsx` around lines 90-117 and
  `src/features/room/PickDecorationSheet.tsx` around lines 47-129.
- The seventh piece does not celebrate before its write succeeds. The replay and
  next-room button are gated on mutation success and replay completion in
  `src/screens/RoomDecorateScreen.tsx` around lines 119-166 and 198-239.
- A user who leaves before spending an earned piece can return through Home. A
  user who leaves after filling the room can also return to the next-room picker.
  Those standing routes are described in
  `src/features/room/RoomProgressCard.tsx` around lines 201-266.
- Successful decoration writes seed canonical current-room data, invalidate the
  hotel, and invalidate user History. Successful next-room writes seed the
  current room and invalidate the hotel in
  `src/queries/room/usePlaceDecorationMutation.ts` around lines 35-44 and
  `src/queries/room/useCreateNextRoomMutation.ts` around lines 20-27.
- Completion mutations cancel pre-write queries, project only known canonical
  fields, and invalidate the affected cache keys. See
  `src/queries/tracking/useCompleteBreathingSessionMutation.ts` around lines
  63-90, `src/queries/tracking/useCompleteBreathHoldMutation.ts` around lines
  77-110, and `src/queries/tracking/completionQueryReconciliation.ts` around
  lines 12-29.
- Forward-only room steps use `replace`, and completing a placement or opening a
  new room returns through `returnToHome()` instead of stacking another root.
  See `src/screens/RoomDecorateScreen.tsx` around lines 198-209,
  `src/screens/NextRoomScreen.tsx` around lines 48-57, and
  `src/app/navigation/returnToHome.ts` around lines 1-8.
- Normal account reads and writes are user-scoped by RLS, and completion RPCs
  derive their user from `auth.uid()` rather than accepting a caller-supplied
  user ID.

## Verification performed

- The full repository test command passed: **703 tests, 703 passed**.
- `npm run typecheck` passed with no TypeScript errors.
- The room-focused subset passed, including pure progress rules, seventh-item QA
  fixture checks, room navigation entry points, replay lifecycle, room layout,
  and daily-completion snapshots.
- The completion-focused subset passed, including daily-plan resolution,
  breathing and breath-hold completion models, cache projections, and completion
  query reconciliation.
- The working tree was clean after the read-only audit.

These checks validate the code paths and the current static contracts. They do
not simulate a real Supabase transaction, network response loss, two devices, or
the linked production schema.

## Coverage gaps

There are no automated behavioral or integration tests for:

- `roomService` against a real or local Supabase database;
- room RLS and migration constraints;
- simultaneous first placement from two devices;
- simultaneous next-floor creation;
- one-per-day enforcement under concurrency;
- a successful database commit followed by a lost HTTP response;
- offline session completion and later recovery;
- stale room caches after another device writes;
- auth/account switching while a room mutation is pending;
- app restart during each transition of the loop;
- the complete production journey of three real dailies, seventh placement, new
  room selection, Home return, app restart, and hotel verification.

Several room navigation tests in
`src/features/room/roomEntryPoint.test.mjs` inspect source structure with regular
expressions. The SQL seventh-item fixture verifies its static safety and data
shape, but it is not an automated database integration test. Neither form can
prove transactional behavior.

## Prioritized remediation plan

### 1. Make room mutations atomic and idempotent

Add narrowly scoped Supabase RPCs for placing a decoration and opening the next
room. Each RPC should derive the user from `auth.uid()`, lock or otherwise
serialize the user's current-room state, validate the invariant, perform the
write, and return the complete canonical `CurrentRoom` shape in one transaction.

Add a unique constraint on `(user_id, floor)`. Give each mutation a stable
client-generated operation key so retrying after a lost response returns the
already-committed result instead of inserting again. Decide explicitly whether
one reward per local date is a permanent invariant. If bonuses may eventually
allow multiple rewards, model an earn or claim ledger with a unique operation ID
rather than leaving today's production rule unenforced.

### 2. Make exercise completion durable

Generate a stable completion ID before navigating. Make breathing and
breath-hold completion RPCs idempotent by that ID. Persist unsent completions in
a user-scoped local outbox and retry them on reconnect or app resume. Keep the
result screen honest about whether completion is saved, and offer an explicit
retry when immediate persistence fails.

### 3. Reconcile every ambiguous room-write failure

On a room mutation error, refetch the canonical current room before declaring
failure. If the intended decoration or next floor is already present, treat the
operation as successful. Otherwise show a retryable error. NextRoom needs visible
failure and recovery UI; decoration failure should not leave an obsolete slot in
cache.

### 4. Refresh room state across devices and app lifecycle

Refetch current room and hotel state when the app becomes active, or subscribe to
the user's room rows. An error-triggered invalidation remains necessary even with
subscriptions. Expose room query errors through `useRoomClaim` so the UI can show
a retry state instead of constructing a claim from empty defaults.

### 5. Add database-backed and lifecycle tests

Use local Supabase integration tests to exercise concurrent first placement,
concurrent next-floor creation, idempotent retries, RLS, and canonical return
shapes. Add app-level tests for response loss, offline completion recovery,
account switching, process restart after every committed step, and the full
seven-piece rollover journey. Regenerate Supabase database types so the room
tables participate in compile-time schema checking.

### 6. Verify production deployment

Before treating the audit as release sign-off, compare the linked production
migration history and constraints with `supabase/migrations/`, then run a
non-destructive production smoke test using the existing seventh-item QA fixture
workflow. Confirm one floor per number, seven decorations on the completed room,
an empty selected next room, correct Home state after restart, and the same rooms
in the hotel.
