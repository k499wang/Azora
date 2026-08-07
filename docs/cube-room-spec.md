# The Cube Room — Home Scene Spec

Concrete spec for the gamified room on Home. Applies
`docs/gamified-scene-design-system.md`; read `docs/card-design-system.md` for the
surrounding card language.

---

## 1. The idea

A single isometric cube — two walls and a floor — that the user furnishes by
practicing. It sits on Home above `TodaysDailiesSection` as the emotional
anchor: *this is the space my breathing built.*

```
              ╱‾‾‾‾‾‾‾‾‾‾╲
           ╱                ╲          ← back-left wall + back-right wall
        │╲                  ╱│           meet at a vertical seam
        │  ╲              ╱  │
        │    ╲  ▢       ╱    │         ← wall slot (art / window)
        │      ╲      ╱      │
        │   ▟    ╲  ╱    ▙   │         ← floor slots on the diamond
         ╲        ╱╲        ╱
           ╲    ╱    ╲    ╱
             ╲╱________╲╱              ← floor diamond, front corner nearest
```

Not a dollhouse, not a room in perspective. One cube, seen corner-on, open at
the front. The silhouette is the brand asset — it must be recognizable at 48pt.

---

## 2. Geometry

**Projection.** True isometric, 2:1 dimetric — the cheap-and-correct game
projection. Every floor edge runs at **±26.57°** (rise 1, run 2). No vanishing
point, no foreshortening beyond the projection itself.

**ViewBox.** `200 × 200`, room centered, sized at the call site. All numbers
below are viewBox units.

| Element | Geometry |
| --- | --- |
| Floor diamond | Corners at `(100,190) (190,140) (100,90) (10,140)` — 180 wide, 100 tall |
| Wall height | `70` units up from the back edges |
| Back seam | Vertical line at `x=100`, from `(100,90)` to `(100,20)` |
| Left wall | `(10,140) (100,90) (100,20) (10,70)` |
| Right wall | `(100,90) (190,140) (190,70) (100,20)` |

**Corner radius.** The cube is *not* razor-sharp. Round the outer silhouette
corners by ~4 units and give the floor diamond's front corner a ~6-unit round.
This is what keeps it in the same family as `radius.hero` surfaces and the blob
character, rather than reading as a technical diagram.

**Line work.** No outlines. Planes are separated by tone alone, exactly as
`GrassGround` separates mound from shadow. One exception: a 2-unit seam line at
the wall junction in the floor's `ink`, at ~0.25 opacity, so the corner reads.

---

## 3. Planes and color

Three planes, three tones from one family — this is the whole trick, and it's
the same two-tone-plus-ink rule scenes already follow.

```ts
// src/theme/colors.ts — new group
scene: {
  room: {
    floor:     '#…',  // mid tone, warmest
    wallLeft:  '#…',  // lighter than floor  (light source front-left)
    wallRight: '#…',  // darker than floor
    ink:       '#…',  // seams, shadows, contact ellipses
  },
},
```

Direction, not exact values:

- Pull the room shell from the **warm neutral** end of the existing palette —
  `background.paper` `#FBF7EF` and `surface.welcome` `#FAF6F0` are the app's
  existing warm surfaces and are the right neighborhood for `wallLeft`. Floor
  steps ~8% darker and warmer; `wallRight` ~14% darker than floor.
- The shell stays **quiet and desaturated**. All the saturation in the scene
  belongs to the furniture, so a nearly-neutral room is what lets six `playful`
  hues coexist inside it without noise.
- `ink` is a low-opacity warm brown-grey used only for contact shadows and the
  seam — never a black.

**Furniture color comes from `CATEGORY_STYLE`.** Each object earned by a
breathing category carries that category's `playful` hue, so teal still means
Calm inside the room:

| Slot | Earned by | Hue |
| --- | --- | --- |
| Rug | Calm sessions | `playful.teal` |
| Bed / cushion | Sleep sessions | `playful.violet` |
| Desk / lamp | Focus sessions | `playful.sky` |
| Plant | Energy sessions | `playful.coral` |
| Wall art | Balance sessions | `playful.blush` |
| Window / clock | Breath-hold streak | `playful.amber` |

Each object is drawn in two tones of its hue: `base` for lit faces, `ink` for
shadowed faces, plus an `ink`-at-low-opacity contact ellipse on the floor. Empty
slots render nothing — no outline, no ghost, no padlock. **Absence is the empty
state.**

---

## 4. Slots and growth

Six slots, fixed positions on the isometric grid, authored by hand — not
free placement. Free placement is a different (much bigger) product.

| # | Slot | Position |
| --- | --- | --- |
| 1 | Rug | Floor center |
| 2 | Bed | Floor back-left, against left wall |
| 3 | Desk | Floor back-right, against right wall |
| 4 | Plant | Floor front-right corner |
| 5 | Wall art | Left wall, upper |
| 6 | Window | Right wall, upper |

**Unlock rule.** One object per N completed sessions in its category, gated so
the room fills over weeks, not days. Each object has three stages —
`absent → placed → upgraded` — matching the scene doc's discrete-stage rule
(a sapling plant becomes a full plant; a stool becomes a desk). Six slots × 3
stages = a long tail without authoring 40 sprites.

**Monotonic.** Objects never leave the room. A lapsed streak stops new unlocks
and may cool the light (see §6); it never empties the space.

Domain module:

```ts
// src/features/room/domain/roomProgress.ts
export type RoomSlotId = 'rug' | 'bed' | 'desk' | 'plant' | 'art' | 'window';
export type SlotStage = 'absent' | 'placed' | 'upgraded';
export interface RoomProgress { slots: Record<RoomSlotId, SlotStage> }
export function roomProgressFromStats(stats: …): RoomProgress
```

Pure, unit-tested, mirroring `homeTreeProgress.ts`. The illustration takes
`RoomProgress` + `size` and nothing else.

---

## 5. Container and Home placement

**Panorama**, per the scene doc: `...card.block` (radius.hero 20, continuous,
clipping) wrapped in `card.blockShadow`. The room's warm shell replaces the flat
`hue.base` fill that a color-block card would carry — same silhouette as
`DailyPlanCard`, different interior.

- Width: full `bodySection` width (screen minus `padding.screen.horizontal`).
- Height: `240`. Taller than `DailyPlanCard`'s 196 because the cube needs
  headroom; short enough that Today's Dailies stays above the fold on a small
  phone.
- Background behind the cube: `background.canvas` — the cube floats on the app's
  own canvas inside the card, no sky, no gradient.
- The cube is inset with `spacing.lg` around it and may not bleed off the card.
  Bleeding is the *card* glyph's move; the room is a contained object.

**Placement in `HomeScreen.tsx`.** First child of `bodySection` (line ~168),
above `TodaysDailiesSection` — the reward is what you see before the work.
The existing `gap: spacing.md` handles separation; no extra margin.

**Header.** A `SectionHeader` above it, title "Your Room", with the progress as
a trailing counter (`3 / 6`). Same component the dailies section uses so the two
blocks stack as one rhythm.

---

## 6. Light and time

One light source, **front-left**, fixed. That's why `wallLeft` is the light
plane and `wallRight` the dark one, and why every contact shadow falls
down-right. Do not vary it per object.

Optional, and only if it stays cheap: shift the shell tones with the user's
local time — cooler and dimmer at night, warm at dawn. If built, it is a
**tone swap on three fills**, not a new asset set, and it must respect the
streak state rather than fight it (a lapsed streak reads as evening light, never
as a dark or dead room).

---

## 7. Interaction

- **Whole card is one `Pressable`** with `triggerTapHaptic()`, pressed
  `opacity: 0.9, scale: 0.98`, navigating to a full-screen Room route where
  slots are individually inspectable. Per-slot taps inside a 240pt Home card
  give targets under 44pt — don't.
- `accessibilityRole="button"`, label stating the count and the newest
  addition: `"Your room, 3 of 6 pieces. Newest: reading lamp."`
- `accessibilityHint`: `"Opens your room"`.
- All illustration layers `pointerEvents="none"`.

**Motion.** Ambient only: one object with a slow multi-second loop (a plant leaf
sway, or lamp glow breathing at ~6s — the app's own coherent-breathing pace, a
detail worth having). On a new unlock, the object gets a single scale-in beat
with a soft contact-shadow settle, once, on the next Home view. Everything
respects reduced motion — reduced path renders the final state flat.

---

## 8. Files

```
src/features/room/
  domain/
    roomProgress.ts
    roomProgress.test.mjs
  illustrations/
    RoomShell.tsx         floor + two walls + seam
    RoomObject.tsx        switch over RoomSlotId → object art
    roomPalette.ts        slot → CATEGORY_STYLE hue + slot geometry
    isometric.ts          grid → viewBox point math, shared by every object
  components/
    RoomCard.tsx          Home card: container, header, press, a11y
```

`isometric.ts` is the load-bearing file — one `toIso(gridX, gridY, height)`
helper every object uses to place itself. Objects that do their own trigonometry
will drift off the grid within three additions.

`roomPalette.ts` is exhaustive over `RoomSlotId` (`Record<RoomSlotId, …>`) so a
new slot fails to compile until it has geometry and a hue — the same guard
`TECHNIQUE_GLYPH` provides.

---

## 9. Build order

1. `isometric.ts` + `RoomShell.tsx` — get the empty cube on Home behind a flag.
   Verify the silhouette reads at 48pt and 240pt.
2. `roomProgress.ts` + tests, wired to existing session stats.
3. Two objects (rug, plant) through all three stages — proves the slot pipeline
   and the two-tone shading before committing to six.
4. Remaining four slots.
5. `SectionHeader` counter, a11y label, press-through route.
6. Ambient motion and unlock beat, last — it's the part that's easiest to
   overdo and easiest to cut.
