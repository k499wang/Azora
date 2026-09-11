# The Daily Reward Flow — Design Doc

Status: proposed, not built
Date: 2026-09-11
Scope: the moment between finishing the last daily and seeing the object in the room
Assumes: grant-per-day economy (not the coins model in `room-currency-and-floors.md`), explicit pick, one object per day

---

## 1. The problem in one sentence

The celebration and the reward are on different screens, so the app spends its
whole emotional budget on an abstraction (the day) and delivers the concrete
thing (the object) two transitions later, after attention has decayed.

```text
Today
last daily -> DailyCompleteSheet (Modal) -> nav push RoomDecorateScreen
           -> PickDecorationSheet (Modal) -> PlacementReveal -> RoomReplay if 7/7
           -> user navigates home

After
last daily -> one screen, five phases, the room never leaves the frame
           -> ends on Home looking at the room that just changed
```

Five surfaces become one. `PlacementReveal` — the best-built animation in the
feature — moves from epilogue to climax.

---

## 2. Why it doesn't land

| # | Problem | Where |
| --- | --- | --- |
| 1 | The peak celebrates the day, not the object | `DailyCompleteSheet.tsx` — 320px flame, confetti, full-bleed field, no object on screen |
| 2 | The CTA beats the payoff | `DailyCompleteSheet.tsx:67-83` — CTA at 640ms, bar finishes ~1100ms. The reward is skippable before it plays |
| 3 | Four context switches, three animation languages | Modal -> nav push -> Modal -> in-place reveal |
| 4 | The choice is contextless from Home | `PickDecorationSheet.tsx:41-44` assumes entry from the "+" in the slot. Entering from Home, the room is gone at the moment you decide what goes in it |
| 5 | Two-press confirm at the flow moment | `PickDecorationSheet.tsx` — right instinct (placing is irreversible), wrong beat |
| 6 | The counter changes where nobody sees it | `3/7 -> 4/7` is the entire long-term loop and it happens off-celebration |
| 7 | A system `Alert` can interrupt the celebration | `RoomDecorateScreen.tsx` write-failure path |

---

## 3. Evidence

The structure below is research-backed; the millisecond values are craft
judgment calibrated against Material's duration bands and the existing
`PlacementReveal` constants.

| Decision | Basis |
| --- | --- |
| Object at the peak, changed room at the end | **Peak-end rule** — the peak is the moment of task completion, the end is the last interaction; both are what gets remembered. [UX Design Institute](https://www.uxdesigninstitute.com/blog/laws-of-ux/) |
| Anticipation hang before the fall | Anticipation "makes the subsequent action feel earned"; anticipation activates reward processing *before* the outcome is known. [GameJuice](https://gamejuice.co.uk/articles/disney-12-animation-principles-games), [Vuckovic](https://medium.com/@djolexv/game-development-tip-a987c949a36f) |
| Silence after impact | "Pausing for a split second reinforces a collision; lengthen the pause to make it feel powerful." [GameAnalytics](https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design) |
| Pulsing empty slot before the pick | Same anticipation finding — the gap between seeing the hole and filling it does reward work on its own |
| Ghost outlines for unfilled slots on Home | **Zeigarnik effect** — "empty slots in an interface are so powerful"; "an 11-of-12 collection is more motivating than a 0-of-12." [Psychology of Games](https://www.psychologyofgames.com/2013/03/the-zeigarnik-effect-and-quest-logs/), [Bootcamp](https://medium.com/design-bootcamp/product-design-and-psychology-the-zeigarnik-effect-in-video-game-design-81cb97133af7), [Yu-kai Chou](https://yukaichou.com/advanced-gamification/game-design-technique-collection-sets/) |
| Counter ticks inside the celebration; 7th reveal bigger than the 1st | **Goal-gradient effect** — motivation rises as the goal nears, so reward weight should escalate across the room, not stay flat. [LogRocket](https://blog.logrocket.com/ux-design/goal-gradient-effect/), [Learning Loop](https://learningloop.io/plays/psychology/goal-gradient-effect) |
| No nav push; room transforms in place | **Container transform**, 300-450ms emphasized easing, is the canonical pattern for a card becoming a full-screen view. Exits shorter than entrances. [Material 3](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs), [Material](https://m1.material.io/motion/duration-easing.html), [Naimark](https://medium.com/google-design/implementing-motion-9f2839002016) |
| Fast-forward after the first few days | "Allow skipping long duration content." A sequence played daily becomes a toll booth; this is the documented over-gamification failure. [UX Planet](https://uxplanet.org/game-design-ux-best-practices-guide-4a3078c32099), [NerdSip](https://nerdsip.com/blog/gamification-gone-wrong-when-streaks-become-the-point), [arXiv](https://arxiv.org/pdf/2203.16175) |
| Missed day pauses, never resets — said in the UI | Commitment plus forgiveness is load-bearing in the reference loop. [StriveCloud](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo), [Ludaxis](https://www.ludaxis.io/blog/gamification-in-apps-duolingo-case-study-2026) |

**Constraint worth stating:** explicit pick was chosen over surprise reveal, so
this loop cannot get variability from randomness. It has to come from
escalation toward 7/7 and from the room visibly changing. That makes the
goal-gradient work in section 5 non-optional rather than a nicety.

---

## 4. The mental model

The room never leaves the screen. The room already on Home grows to fill the
frame, the day's celebration plays *around* it, a slot opens in it, the user
fills it, and it settles back down into Home. One continuous camera, a zoom
rather than a cut. Everything else follows from that constraint.

---

## 5. The flow

One component, `DailyRewardFlow`, mounted over Home. Never pushed.

```text
idle
 └─ ACKNOWLEDGE   celebration plays, room centred, no controls
     └─ OFFER     slot opens, pick rail rises
         └─ CHOOSE  user-paced, no timer
             └─ LAND    PlacementReveal at full size
                 └─ SETTLE  counter ticks, undo pill, Done
                     └─ dismiss -> room scales back into Home
```

All transitions are forward and automatic except `CHOOSE` (waits for a tap) and
`SETTLE` (Done, or auto-dismiss at 6s). No back. No swipe-away — keep
`DailyCompleteSheet`'s existing rule that it leaves only on a deliberate press.

### Phase 1 — ACKNOWLEDGE (0 -> 1400ms)

Home stays mounted underneath.

| ms | What |
| --- | --- |
| 0 | Night field (`CELEBRATION_HUE`) fades in *behind* the room, 220ms. The room is never covered |
| 0-320 | Room transforms from its Home position to centred, ~1.5x, spring. The rest of Home fades out over 180ms |
| 120 | Flame in at ~180px, not 320 — a header now, not the hero |
| 300 | Title: "Day done" |
| 420 | Subtitle + streak badge |
| 560 | Progress bar fades in |
| 720 | Bar fills, front-loaded easing |
| 1400 | Bar completes. First moment any control exists |

The bar completing *is* the transition to phase 2. Nothing is pressable before
it (see §8 for the fast-forward that relaxes this after the first days).

### Phase 2 — OFFER (1400 -> 1900ms)

| ms | What |
| --- | --- |
| 1400 | Bar and streak collapse upward and out, 200ms. Flame stays small. Title cross-fades to the slot name: "Today's piece: rug" |
| 1500 | `RoomSlotPlus` fades onto the target hex and begins a slow 2s pulse. Room recoils slightly, making space |
| 1560 | Room eases up and shrinks ~15%, settling into the top 60% |
| 1620 | Pick rail rises, 280ms spring — a horizontal rail, **not** a full-height modal |
| 1900 | Settled: room above, ~5 scrollable tiles below |

The rail reuses `PickDecorationSheet`'s `DecorationSolo` tiles and its tinted
well (that tint exists because near-white pieces vanish on white — keep it).
What it drops is the `Modal` wrapper. The pulsing empty slot must stay visible
while choosing; it is what gives the choice meaning.

### Phase 3 — CHOOSE (user-paced)

- One press. Tapping a tile places it.
- The tapped tile lifts out of the rail, the rail drops 180ms, and that same
  node becomes the falling object in phase 4 — no cut between "I picked this"
  and "this is falling".
- Light haptic on select (`triggerTapHaptic`). The heavy one is reserved for
  the landing.

### Phase 4 — LAND (~1050ms)

`PlacementReveal` doing what it already does, at full size, as the climax. Its
existing beats are good; only scale and surroundings change.

| ms | What |
| --- | --- |
| 0-140 | Object hangs above the slot, slight anticipation lift (`FALL_START_MS`) |
| 140-400 | Falls under gravity easing (`FALL_MS`) |
| **400** | Lands on an exact frame: squash, 8-angle sparkle burst, **heavy haptic**, room recoil, night field pulses one shade brighter for 120ms |
| 400-780 | Burst resolves, object settles into its resting transform |
| ~820 | Counter ticks `3/7 -> 4/7` with a small scale-punch beside the room |
| 780-1050 | Silence. Nothing moves |

The counter tick is new. That number is the whole long-term loop and currently
changes where nobody is looking.

### Phase 5 — SETTLE

| ms | What |
| --- | --- |
| 1050 | "Undo" pill fades in, quiet tone, 4s life |
| 1150 | Tease line, named not generic: "Tomorrow: the window slot" |
| 1250 | `ChunkyButton` "Done" rises |
| press | Night field out 220ms; room scales back to its exact Home position; Home fades back in |

Ending on Home, looking at the room that just changed, is the "end" half of the
peak-end pair. Today the user ends on `RoomDecorateScreen` and has to navigate
away themselves.

---

## 6. Camera

Three room positions, one spring between each, never a cut:

1. **Home rest** — small, in `HomeRoom`'s slot
2. **Hero** — centred, 1.5x (ACKNOWLEDGE)
3. **Offer** — up and 15% smaller, top 60% (OFFER through SETTLE)

One shared transform on a single room container. If Home's room and the flow's
room are separate mounts there is a flicker at the seam and the illusion dies.

---

## 7. Data and write timing

- `useDailyCompleteSnapshot` already freezes state so the animation can't tear
  while queries settle. Keep it exactly as is.
- Phases 1-2 play optimistically. The rail must not accept a tap until the
  server claim confirms (`isDailyCompleteRewardReady` / `canClaim`). The claim
  almost always resolves inside 1400ms, so the gate is invisible; when it
  doesn't, hold at the end of phase 1 on a settled bar — a pleasant hold, never
  a spinner.
- The write fires on tile tap. The 400ms fall is free cover for the round trip.
- **Write failure:** the object does not land. It arcs back to the rail, the
  rail returns, one quiet on-surface line: "Couldn't place that — try again."
  Never `Alert.alert` — a system dialog mid-celebration is the worst available
  interruption.
- **Undo** reverses the write and returns to phase 2 (rail up, slot pulsing)
  rather than dismissing the flow.

---

## 8. Edge cases

| Case | Behaviour |
| --- | --- |
| Reduced motion (`useReducedMotion`, already wired) | All five phases still run; springs become 120ms fades; the reveal becomes a cross-fade with the haptic preserved. Never skip phases — the structure is the meaning |
| Repeat user | After ~3 completed days, a tap fast-forwards every in-flight animation to its end state. Phases are never skippable; the *waiting* is. Preserves "payoff before CTA" without taxing daily users |
| Backgrounded mid-flow | On resume, jump to the last completed phase's end state. Never replay |
| Already claimed today | Flow does not mount. `RoomProgressCard` shows the count and the next slot, ghosted |
| Write fails | §7 |
| 7th piece | Phases 1-4 identical but escalated, then hands off to room-complete (§9) |

---

## 9. Screens

1. **Reward takeover** — the above. The only new surface.
2. **Room Complete (7/7)** — earns its own moment, and the one place a real
   transition is correct. The camera pulls *back* rather than down: the room
   seals, joins the hotel stack beside previous rooms, and the next empty room
   opens for a look pick. Different camera direction signals a bigger event.
3. **Room / Hotel detail** — unchanged, reachable anytime. Browsing, not reward.
4. **Home** — `RoomProgressCard` keeps the between-days state: the count, and
   **visible ghosted empty slots**. The hole is the hook, not the number.

---

## 10. Loop hygiene

- **Tease tomorrow by name.** A named incomplete beats a generic one.
- **Never render an empty-looking room.** Ghost the unfilled slots so the room
  always reads as in-progress rather than sparse.
- **Make 7/7 legible from day one.** Right now the building's ambition is only
  discoverable by reaching it.
- **Say the pause rule in the UI.** A missed day pauses the room and loses
  nothing (`room-hotel-plan.md` §1). That is currently true in the data model
  and invisible to the user.
- **Escalate toward 7/7.** With surprise off the table, escalation is the only
  source of variability this loop has.

---

## 11. What this deletes

- `PickDecorationSheet`'s `Modal` wrapper and its two-press confirm -> becomes
  the rail inside the flow
- The `onChoosePiece` -> `navigate('RoomDecorate')` push from `HomeScreen`
- `DailyCompleteSheet` as a standalone modal -> becomes phases 1-2
- `RoomDecorateScreen`'s celebration orchestration (`placing`,
  `placementRevealDone`, `roomReplayDone`) -> the screen keeps only its browse
  and dev role
- The `Alert.alert('Could not place that piece')` failure path

---

## 12. Build order

1. **Ghost empty slots on Home.** Independent of everything else, cheapest
   retention win in the doc, ships alone.
2. **Phases 1-2 as a vertical slice.** Container transform plus the rail, on
   device, before any of the rest. The camera either feels right or it doesn't,
   and that verdict should come early.
3. **Phases 3-5.** Single-press placement, undo, promoted reveal, counter tick.
4. **Delete the old chain** (§11) in the same change that replaces it.
5. **Room Complete (7/7)** as its own sequence.
6. **Fast-forward after 3 days**, once the full sequence is tuned.

---

## 13. Open questions

1. Is `DailyCompleteSheet` also used after non-daily sessions where there is no
   object to place? If so the flow needs a no-reward variant and the phase
   structure changes.
2. On the 7/7 day, does the seal play immediately in the same flow, or on the
   next Home open? Immediate is more satisfying and is also a ~12s sequence.
3. Does the escalation toward 7/7 change the reveal itself (bigger, longer,
   more burst) or add something around it? Unresolved, and it matters — it is
   this loop's only variability.
