# The Room and the Hotel — Build Plan

Replaces `docs/cube-room-spec.md`, which describes an earlier six-slot,
category-keyed cube that the hex room superseded. Delete that file when step 7
lands.

---

## 1. The loop

A hexagonal isometric room the user furnishes one object at a time. Seven
objects fill a room; a filled room joins the hotel and the user opens a new one.

| | Rule |
| --- | --- |
| **Earn** | All three of Today's Dailies completed → one piece, once per day |
| **Choose** | The day's slot opens with all ~5 authored options; user picks one |
| **Order** | `day1 → day7` in sequence, never skipped |
| **Missed day** | Nothing is lost — the sequence pauses. A slow week just makes a longer room |
| **Rollover** | The 7th piece completes the room; the user then picks the next room's look and floor *n+1* opens |
| **Hotel** | Every completed floor, viewable together |

Consequences worth stating, because they drive the data model:

- A room is **not** a calendar week. It is seven earn-days, however long those
  take. Nothing in the schema should key off week boundaries.
- Every room ends up **complete**. There are no permanent gaps, so the hotel is
  a wall of finished rooms, and a room's floor number is its only ordering.
- "One per day" is a **per-user** rule, not per-room. Finishing a room and
  opening the next one on the same day does not grant a second piece.

---

## 2. What already exists

| Piece | Where | State |
| --- | --- | --- |
| Room + decoration art | `src/features/room/RoomScene.tsx` | Done — shell, 3 frame hues, 7 slots × ~5 options |
| `HexRoom`, `DecorationTile` | same file | Done |
| Home placement | `src/screens/HomeScreen.tsx:169`, `src/features/room/HomeRoom.tsx` | Done — full-flow, not in a card |
| Storage | `supabase/migrations/20260807000100_create_room_hotel.sql` | `rooms` (floor, shell, frame_hue) + `room_decorations` (slot, option_id), RLS on |
| Read/write | `src/services/room/roomService.ts`, `src/queries/room/*` | Reads highest floor as current; lazily opens floor 1 |
| Picker | `src/screens/RoomDecorateScreen.tsx` | Dev-grade — every slot, every option, unlimited |

`RoomScene.tsx` is a generated asset file. Treat it as read-only: nothing in
this plan modifies it, so it can be regenerated without losing work.

---

## 3. Build order

Steps 1–3 are built. The migration has not been applied — there is no local
Supabase CLI, so `20260807000200_room_daily_earn.sql` is unrun and its backfill
is unverified against real rows.

### Step 1 — Extract the dailies-complete signal — **done**

`HomeScreen.tsx:71-75` computes the three completion booleans inline from four
queries. The picker and both result screens need the same answer, so this moves
to `src/hooks/useDailiesCompletion.ts`, self-contained on `userId`.

It returns the two techniques *and* the booleans, so HomeScreen consumes it
instead of duplicating `useRecommendedTechnique`, `useDailyExercisePlan`,
`useProfileQuery`, and `useCompletedBreathingTechniqueIdsQuery`. This is a
consolidation, not a second copy — React Query dedupes the shared keys, and
`useDailyExercisePlan`'s plan-persisting effect stays on exactly one instance.

`allCompleted` is `false` while anything is loading. The reward card keys off
it, and a flash of "you earned a piece" that then retracts is worse than a
beat of nothing.

### Step 2 — Migration and domain — **done**

`room_decorations` gains `earned_local_date date not null`, backfilled from
`created_at::date`. That is the whole migration.

**The earn rules stay on the client**, per the stance the first migration takes:
storage records what a user built, not the rules for how they built it. There is
deliberately no `unique (user_id, earned_local_date)` index — that would freeze
"one per day" into the schema, so a later streak bonus or catch-up weekend would
need a migration to undo. `unique (room_id, slot)` from the first migration
already makes duplicate placement impossible, so the only thing a day-index
would add is defence against a hand-edited client, for the prize of a nicer
bedroom in a single-player game.

The column is data rather than a rule, and it cannot be derived: `created_at` is
UTC, so someone in Auckland finishing at 1am local sits on the previous UTC date
and someone in Honolulu finishing at 9pm local sits on the next one. Evening is
when people practice, so "have I earned today?" would read wrong for a large
share of users during the hours they use the app. `daily_activity.activity_date`
already solves this the same way.

`src/lib/room/roomProgress.ts` — pure, tested, no React and no
`react-native-svg` import so the `.test.mjs` runner can load it:

```ts
export const ROOM_SLOTS: readonly RoomSlot[];
export function roomProgress(input: {
  decorations: PlacedDecoration[];    // the current room's
  lastEarnedLocalDate: string | null; // across every floor
  todayLocalDate: string;
  dailiesComplete: boolean;
}): {
  placedCount: number;
  nextSlot: RoomSlot | null;   // null once the room is full
  isComplete: boolean;
  claimedToday: boolean;
  canClaim: boolean;
}
```

It lives in `lib/` rather than `features/room/` because `roomService` enforces
these rules before writing, and a service reaching up into a feature is the
wrong direction.

`RoomSlot` is declared here rather than imported from `RoomScene`, for the same
reason — `lib/` must not depend on a feature. It is the identical string union
to `DayKey`, so the two are mutually assignable, and `RoomScene.tsx` stays
untouched and regenerable.

`canClaim` is false on a full room: rolling over to the next floor is a choice
the user makes, not something that happens to them.

### Step 3 — Service and queries — **done**

- `placeDecoration` takes `earnedLocalDate` and refuses any slot that is not
  `nextSlot`, so a stale screen cannot write out of order. Whether the day was
  earned is `roomProgress`'s call, not the service's and not the database's.
- `createNextRoom(userId, frameHue)` replaces the hardcoded `floor: 1`, opening
  `highestFloor + 1`. It refuses an unfinished room, so a floor can never be
  abandoned half-decorated.
- `getRooms(userId)` lists every floor for the hotel — two queries total, not
  one per floor, since the hotel grows without bound.
- `getCurrentRoom` now returns `CurrentRoom` (`{ room, lastEarnedLocalDate }`)
  rather than `Room | null`, because the one-per-day gate is user-scoped and has
  nowhere honest to sit on a `Room`.
- `docs/query-cache-invalidation-map.md` updated in the same change.

### Step 4 — The picker screen

`RoomDecorateScreen` becomes today's piece, in three states:

- **Locked** — dailies unfinished; show which ones remain.
- **Choose** — the current slot's options as `DecorationTile`s.
- **Complete** — 7/7; pick the next room's look and open the next floor.

The current all-seven-days-at-once layout goes away.

### Step 5 — Reward card and Home badge

A shared `RoomRewardCard`, rendered by both `SessionCompleteScreen.tsx` and
`ShareableResultScreen.tsx` — either can be the screen where the third daily
lands — visible only when that completion finished the set. `HomeRoom` also
shows a "ready" badge while a piece is unclaimed, so skipping past the result
screen never hides the reward.

### Step 6 — Hotel screen

New route; a grid of small `HexRoom`s, one per completed floor.

The look choice is thin as things stand: `ROOM_FRAME` has three hues and
`ROOM_SHELL` is a single constant, so "pick your next room" is currently a
choice between three outline colors — a weak payoff for seven days of work.
Adding 3–4 shell palettes is a recolor of existing polygons, no new geometry.
Worth doing before this step ships.

### Step 7 — Delete `docs/cube-room-spec.md`

---

## 4. Sequencing note

Steps 1–3 change no pixels. Nothing is visible until step 4.
