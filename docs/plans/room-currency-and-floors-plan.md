# Coins, Floors, and Mochi’s Home — Build Plan

Product doc: `docs/room-currency-and-floors.md` — read first for the direction.
Status: Steps 1–2 database foundations implemented; user-facing cutover remains.
Date: 2026-09-07

## 0. Resolve rules, then stage one cutover

Additive database groundwork can deploy ahead of the app, with new earning and
spending disabled. Shop, mutable placements, migrated ownership, coin earning,
and removal of the old reward flow must ship as **one coordinated UI cutover**.
Do not enable coins while the old daily decoration grant remains active; do not
ship Shop before purchases can be owned and arranged. Remove replaced code in
that same cutover, not in a later cleanup after both flows have run together.

Decisions to settle before implementation:

- What qualifies as an extra session: breathing, breath hold, measurement, minimum
  duration, repeats, and whether the session completing dailies can also earn an
  extra reward? Specify stable source IDs and local-date attribution, including
  midnight, offline completion, and timezone changes.
- Heart-rate measurement opens directly from Home's top-bar heart button. It
  stays optional and leaves the existing three
  canonical dailies intact.
- Assign all 35 objects to the 30/60/100 price tiers. Do not infer tiers from
  category order; confirm whether included starters span all tiers. Initial rates
  remain 25 for dailies and 5 for at most two
  qualifying extras per day.
- Approve the starter-selection rule in step 4, including the proposed free
  first-floor setup. This resolves the ambiguity around “three objects included.”

Read `docs/architecture/exercise-sessions.md` before changing completion ownership
and the repo-local backend and analytics contracts before changing those areas.

## Step 1 — Additive wallet

Keep the first version deliberately loose. `wallet_entries` is an append-only
table with authenticated user, currency, signed delta, reason, local date and
timestamp. A balance is the sum of its deltas. Grants insert a positive row;
purchases insert a negative row after a client-side affordability check.

RLS allows users to select and insert only their own entries. There is no update
or delete policy; a correction is another entry. Rates, daily caps, duplicate
checks and prices stay in the app. This is acceptable for a single-player room
economy whose coins cannot be purchased or exchanged.

Keep `src/lib/wallet/coins.ts` pure for balance, rates and prices.
`src/services/wallet/walletService.ts` owns the small read/grant/spend API, and
React Query hooks invalidate the wallet after writes. If the ledger ever grows
large enough to hit response limits or real-money value is introduced, replace
the client sum and read/check/write spend with a server aggregate/transaction.

The migration is additive. Older releases ignore the table and continue their
existing decoration flow, so this step changes no current app behavior.

## Step 2 — Ownership and historical baseline before gating

Add `owned_objects` keyed uniquely by `(user_id, option_id)`, with acquisition
metadata. Add persisted acquired-look entitlements keyed by user and shell.
Backfill every distinct existing object and shell, and grant the default shell
free. An acquired shell may be applied to any number of that user’s floors with
no repeat charge; applying a look is separate from buying its entitlement.

Before any mutable-placement write, snapshot existing decoration reward records
into immutable history, retaining source decoration ID, option, slot, room and
original earned local date. `src/services/history/dayHistoryService.ts` currently
reads `getDecorationsEarnedOnDate` from mutable placement rows. Replace that
history dependency with immutable reward records and new coin reward history;
do not simply delete the getter and lose prior achievements. Removing, replacing
or moving an object must never rewrite the day it was earned.

Migration preflight and rerun rules:

- Preserve **every** existing placement, including duplicate option IDs across
  rooms, regardless of how many duplicates the audit finds. Inventory ownership
  deduplicates; placement rows do not. Grandfather existing copies, permit their
  removal or explicit relocation without increasing their count, and reject new
  duplicate placements. Once duplicates are removed, they cannot be recreated.
  Do not add a global unique placement index that rejects legacy data.
- Audit duplicate `(user_id, floor)` values: the existing index is not unique.
  Keep all rooms and numbers; handle identity by room ID and deterministic
  ordering. Do not renumber/delete rooms or add an incompatible unique index.
- Change `room_decorations.earned_local_date` from `NOT NULL` to nullable for new
  placements. Preserve old values and update TS adapters; do not fabricate an
  earned date for a purchased or rearranged object.
- Keep existing floors, including buildings already over five floors. No coin
  compensation or forced reduction.

Make baseline inserts idempotent by stable source identity. An early migration
can miss subsequent writes from old app versions: gate activation behind a
minimum supported version, stop legacy economy writes at cutover, then reconcile
ownership, looks and historical snapshots again before enabling ownership checks.
Verify row-level preservation, not just aggregate totals. An additive migration
alone is not a complete rollout strategy.

## Step 3 — Mutable rooms and purchases

Keep categories and renderable content in existing local homes. `ROOM_SLOTS`
becomes categories; remove next-slot/daily-claim/sealing behavior. `placedCount`
and `isComplete` may remain display facts, never purchase or edit gates.
`RoomScene.tsx` stays regenerable; pure `src/lib/room/inventory.ts` computes owned,
placed and free inventory from IDs without feature imports.

Implement the service boundaries with small, explicit service functions:

- Buy object: check the current balance, insert ownership, then record the debit.
  Refuse an object already owned.
- Place/remove/move/swap: validate ownership, category/slot compatibility,
  destination occupancy and legacy duplicate rules. A cross-floor move updates
  the existing placement so it cannot leave a duplicate behind.
  Return updated affected rooms and inventory. Arranging writes no coin debit.
- Buy/apply shell: acquire once and record one debit; applying an owned shell is
  free and validates ownership of the destination room.

Define explicit replace/swap behavior in the arranger; never silently move an
object from another floor just because a purchase preview selected it.

## Step 4 — Floor bootstrap and purchases

Implement idempotent free floor-1 bootstrap even for a user with no previous daily
claim. Proposed default: the same three-object starter setup below, at zero
price. If legacy rooms exist, use their IDs rather than manufacturing another
ground floor.

Launch permits **five total floors**, including the free first floor. Purchase
checks total count and chooses the next floor number from existing state; legacy
users already at/above five keep every floor but cannot buy more.

Proposed starter rule, pending product approval: select exactly three options in
three distinct category slots. Each must be an owned **unplaced** object or a
currently unowned option included in the floor price. Existing placed objects
are unavailable unless the user explicitly rearranges them beforehand. Preview
available choices before confirmation; if three compatible choices are
impossible, block purchase with an explanation before any debit.

The purchase flow rechecks availability, balance, shell entitlement and floor
cap before creating the floor, acquiring starter objects, placing all three and
recording the debit. If a step fails, retry the unfinished setup without charging
again. A completed purchase must not leave an empty floor.

Reuse `NextRoomScreen`’s shell-picker UI where useful, then retire its old route.
Keep `HotelScreen`, `PyramidCanvas`, `pyramidLayout` and `RoomPager`, but audit their
highest-floor/progression assumptions and add selection callbacks for arranging
and moving Mochi. They are not assumed to require no changes.

## Step 5 — Mochi’s floor

Add nullable `profiles.mochi_floor_id`; null means highest owned floor (with a
stable tie-break for legacy duplicate numbers). A foreign key to `rooms(id)`
checks existence only: the mutation must also prove the selected room belongs to
`auth.uid()`. Prevent direct profile updates from bypassing that check, through
column permissions or equivalent database validation. `on delete set null`
preserves fallback behavior.

`HomeRoom.tsx` renders the selected floor. Building children emit semantic
callbacks; the registered screen owns navigation and mutation orchestration.
Mochi moves are free. Keep the existing blob rendering and walking primitives;
verify work stops when its owner becomes inactive or unmounts.

## Step 6 — Coordinated app cutover

Enable earning only with the replacement UI and reconciled database ready.
Reuse the canonical completion signal without instantiating another composing
hook in each child. Put grant orchestration at the existing owning container,
recheck live readiness, and share one duplicate check across both completion
paths. The current result reward surface is `DailyCompleteSheet` (there is no
`RoomRewardBanner`); replace the old decoration celebration with a quiet coin
banner, no modal or auto-navigation. Extras follow the approved qualification
rules and stable session IDs, not screen-mount timing. Reconcile eligible,
unrewarded persisted completions after restart or reconnect so leaving a result
screen cannot lose coins. Daily grant identity must be shared across completion
paths (user, reward date and rule identity), not the last session's ID.

Tabs become `Home | Hotel | Shop | Profile`. Shop has balance and Objects/Floors/Looks,
room-based previews using `DecorationTile`, owned states and “place it now?”
callbacks. Reuse theme/design tokens and `ChunkyButton`; virtualize history or
any growing catalogue rather than eagerly rendering it all.

Keep the full Heart page as a stack screen, while Home's heart button opens the
measurement instructions directly. Add Profile’s distinct collection count and lifetime coins earned. Keep
`HeartRateScreen` and session detail stack routes. Audit all `Heart` references:
central types, tab registration, Home, History/session-detail return routes,
analytics, tests and child navigation. Use `returnToHome()` for terminal returns
and `replace` for forward-only steps; preserve route context such as `fromLab`.

Remove replaced `RoomCompleteScreen`/`NextRoomScreen` routes and the Heart tab,
claim hooks/latches, old daily-completion and picker sheets, countdowns, and
locked/claimed/complete arranger states in this same change. Remove obsolete
room-service getters only after History and other consumers are migrated.
Update meaningful tests instead of deleting coverage along with the old flow.

Extend `src/services/analytics/room.ts` with committed grants, purchases,
placements and Mochi moves, retaining canonically resolved `is_pro`. Include the
balance after a write; prevent duplicate analytics in the calling mutation.
Update backend notes, feature contracts and the query-cache invalidation map.

## Verification and release gate

Run `npm run check` for each implementation step. Pure tests cover balance,
affordability, earn qualification, tier mapping, inventory availability, starter
selection and floor limits. Before cutover, test migrations against representative
legacy data: duplicate objects and floors, unknown object IDs, more than five
floors, account deletion, and History after rearranging. Verify RLS prevents users
reading or writing another user's rows.

Smoke-test 5–10 complete cycles in release builds on iOS and Android: earning,
purchasing, arranging, returning Home, moving Mochi, measurement and History.
Verify bounded route depth, Back behavior, smooth Skia entrances and cleanup of
animations, timers, audio, sensors and subscriptions. Explicitly record device or
backend checks that could not run; a pure test suite is not their substitute.

Content expansion, resale, gifting, real-money coins and blob XP remain out of
scope. Grow content before lifting the five-floor purchase limit.
