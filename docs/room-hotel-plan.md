# The Room and the Hotel — Build Plan

Replaces `docs/cube-room-spec.md`, which described an earlier six-slot,
category-keyed cube that the hex room superseded. That file is deleted.

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

Steps 1–4 are built and `20260807000200_room_daily_earn.sql` has been applied.
Steps 5–7 remain; until step 5 lands the loop has no trigger, so the only way to
reach a claim is to open the room from Home.

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

### Step 4 — The picker screen — **done**

`RoomDecorateScreen` is now today's piece, in four states, all driven by
`roomProgress` + `useDailiesCompletion`. The room itself is on screen above the
panel in every one of them, so the user is always looking at what they are
filling.

- **Locked** — dailies unfinished; a checklist of the three, ticked as they land.
- **Claimed** — already earned today; come back tomorrow.
- **Choose** — the current slot's ~5 options as a two-column grid of
  `DecorationTile`s, each previewing the object in place over a ghosted room.
- **Complete** — 7/7; a CTA through to `RoomComplete`.

`RoomCompleteScreen` is a separate route rather than a fifth state. Finishing a
room is the milestone the whole loop builds toward, and a panel swapping under
the user's thumb would undersell it. Placing the seventh piece `replace()`s
straight into it, so the celebration is the response to the tap.

It shows the finished room, then the next room's frame hue as three live
`HexRoom` previews rather than color chips — the choice is about the room, so
the room is what you pick from. Opening the next floor returns to Home.

### Step 5 — Reward banner and Home badge — **done**

`RoomRewardBanner` is rendered by both `SessionCompleteScreen.tsx` and
`ShareableResultScreen.tsx` — either can be the screen where the third daily
lands — and renders nothing unless a piece is actually claimable. `HomeRoom`
shows a "A new piece is ready" pill for the same condition.

**It is deliberately quiet**, and this is the one place the design departs from
what Duolingo and Finch do. Those apps celebrate hard at the completion screen
because their post-task state is *achievement*. A breathing app's post-session
state is *calm* — the thing the session was for — and there is documented
criticism of wellness apps whose gamification interrupts exactly that. So the
banner sits at the bottom of the existing result content, below the share CTA:
no modal, no interstitial, no auto-navigation, nothing blocking the exit.

The Home badge carries the real weight. Home is where attention has already
reset and where the collection lives, so missing the banner costs nothing —
which is what lets the banner stay quiet.

The loud celebration is spent on the 7/7 milestone (`RoomCompleteScreen`),
where it is earned and rare.

All four call sites — picker, badge, and both result screens — read
`useRoomClaim`, so the badge can never promise a piece the picker refuses.

**The banner renders on every session, not only the third.** Most sessions are
someone's first or second of the day, so the partial state is the common case
and "one more to go" is the whole pull — the same reason Duolingo shows quest
progress on every lesson-complete screen and the reward only on the last. Its
three states:

| Dailies done | Shows |
| --- | --- |
| 1 of 3 | "2 more to earn your piece", next slot's category, the three dailies |
| 2 of 3 | "1 more to earn your piece", same list with two ticked |
| 3 of 3 | "A new piece is ready ›" → the picker |

Incomplete dailies in the list are tappable and start that exercise, which is
why `useStartDaily` exists: Home and the banner both offer this, and the Pro
gate is the part that must not drift into two copies. Extracting it also emptied
most of `HomeScreen`'s body.

One consequence to know about: `DailyPlanStarted`'s `streak_days` now reads
`useProfileSummaryQuery().currentStreak` rather than
`useHomeStatsQuery().streak.currentStreak`. Both are backed by `user_streaks_v`,
so the value is the same, but the source moved.

**There is no locked preview of the piece, by design.** The reward is a choice
among five options, so any single object shown behind a padlock would be a
spoiler or a lie about what arrives. The banner names the *category*
(`DAYS[n].note` — "small furniture") instead: enough to anticipate, nothing
spent. Unknown rewards also outperform fully predictable ones, and a padlock in
a calm app reads as a paywall tease.

### Step 6 — Hotel screen — **done**

**Two screens.**

1. `RoomComplete` — the finished room replays itself building, then Continue.
   One job: the payoff for seven days, not also a form.
2. `NextRoom` — the six looks, one per full-width page. A 90pt swatch cannot
   show plank floor versus checker, and the look is the whole reward for the
   next week.

`Hotel` is a standalone destination rather than a step in this flow — every
finished floor, one per page. Currently reached only from the lab; it wants an
entry point on Home or the profile.

`RoomPager` backs the pagers: a paged `ScrollView`, not a `FlatList` — these are
a handful of pages the user wants to flick through freely, and virtualising
costs a blank frame per swipe for nothing.

### Step 7 — Delete `docs/cube-room-spec.md` — **done**

### Step 8 — Room shells — **done**

`src/features/room/roomShells.ts` builds six shells (cream, sage, clay, dusk,
mint, slate) from a palette plus a floor pattern — planks, cross planks,
checker, tile, medallion — rather than hand-authored polygons, so a new look is
a dozen lines. Walls, skirting, optional wainscot panelling and the floor
pattern all vary; the hexagon and its decoration coordinates do not, because
every object is authored against one room space.

`HexRoom` and `DecorationTile` take a `shell` prop defaulting to the generated
`ROOM_SHELL`, so regenerating `RoomScene.tsx` never clobbers the shells. The
room's shell is stored in `rooms.shell` (the column already existed) and
resolved client-side by `toRoomShell`, so retiring a look needs no migration.
"Pick your next room" now offers the six full looks, not three outline colors.

---

## 4. Sequencing note

Steps 1–3 change no pixels. Nothing is visible until step 4.
