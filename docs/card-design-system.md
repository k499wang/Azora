# Azora Card Design System

Extracted from the two surfaces that define the current visual language:
`src/components/home/TodaysDailiesSection.tsx` (Today's Dailies) and
`src/components/explore/TechniqueCard.tsx` / `DailyPlanCard.tsx` (Explore).

Everything below already exists in `src/theme/*`. This document is the rulebook
for how those tokens combine — build new cards by picking an archetype, not by
inventing values.

---

## 1. The two card archetypes

The system has exactly two card bodies. Every new card should be one of them.

### A. Color block (Explore)

A saturated `playful.*.base` fill, white text, a huge translucent glyph bleeding
off the bottom-right corner. Used when the card *is* the thing (an exercise, a
plan) and browsing is visual.

```
┌──────────────────────────┐
│ Calm            [For you]│   ← overline (16/20, semibold, 0.8 opacity)
│                          │
│                       ◜◝ │   ← ActivityGlyph, 186pt, white @ 0.16,
│                     ◟  ◞ │     anchored right:-50 bottom:-58
│ Resonance                │   ← title 20/26 semibold
│ ⏱ 5 min · 5-5            │   ← meta 14 medium, 0.85 opacity
└──────────────────────────┘
```

Recipe:

| Part | Token |
| --- | --- |
| Shape | `...card.block` (radius.hero 20, continuous, `overflow: 'hidden'`) |
| Fill | `categoryStyle.hue.base` — never a raw hex |
| Text | `colors.text.inverse` for all copy |
| Decoration | `<ActivityGlyph size={186} color={inverse} opacity={0.16} />`, absolutely positioned `right: -50, bottom: -58` |
| Content pad | `padding: spacing.lg`, `paddingLeft: spacing.md`, `paddingBottom: spacing.md`, `justifyContent: 'space-between'` |
| Pressed | `opacity: 0.9, transform: [{ scale: 0.98 }]` |
| Shadow | none on the block itself (it clips). Wrap in `card.blockShadow` if it must lift. |

Sizes in use: shelf card `232 × 262`, full-width daily plan card `height 196`.

### B. Elevated pill row (Today's Dailies)

A white surface on the canvas, copy on the left, a rounded **art tile** on the
right filled with the same `hue.base`. Used when cards form a *list* with
state (done / locked / due) — the neutral surface keeps the status legible and
the color moves into the tile.

```
 ●───┐                                    ← timeline marker + dashed rail
 ┆   ┌────────────────────────────┬──────┐
 ●   │ Resonance                  │ ▒▒▒▒ │  ← art tile 112², radius 18,
 ┆   │ ⏱ Calm breathing           │ ▒☺▒▒ │    hue.base + character
 ●   │ ⏱ 8:00 AM                  │ ▒▒▒▒ │
     └────────────────────────────┴──────┘
```

Recipe:

| Part | Token |
| --- | --- |
| Row height | `144` fixed |
| Shadow wrapper | `...card.blockShadow` + `borderRadius: radius.hero` + `background.elevated` |
| Pill | `background.elevated`, `radius.hero`, `overflow: 'hidden'`, `paddingHorizontal: spacing.md`, `paddingVertical: spacing.sm`, `gap: spacing.md` |
| Art tile | `112 × 112`, `borderRadius: 18`, `backgroundColor: hue.base`, clipped |
| Art content | `TaskCardDecor` (white) behind `BlobCharacter` (`bodyColor: hue.soft`, `faceColor: hue.ink`) |
| Copy column | `flex: 1`, `height: 112`, `justifyContent: 'space-between'` |
| Pressed | `opacity: 0.8, transform: [{ scale: 0.99 }]` |

The rule that connects them: **color-block cards put the hue on the whole
surface; list cards put the hue in a 112pt tile.** Both draw from the same
`hue`, so a Calm exercise is teal in both places.

---

## 2. Typography

Single family, `Outfit`, via `FONT_FAMILY` in `src/theme/typography.ts`.
**SemiBold is the heaviest face the app renders** — `fonts.bold` is aliased to
SemiBold on purpose. ExtraBold (`fonts.heavy`) is reserved for paywall
headlines only.

Four roles, and only four, appear on a card:

| Role | Style | Where |
| --- | --- | --- |
| **Eyebrow** | `...typography.overline`, overridden to `fontSize: 16, lineHeight: 20, fontFamily: fonts.semibold, letterSpacing: 0.4, textTransform: 'none'`, `opacity: 0.8` | Category label on color blocks ("Calm", "Check-in") |
| **Title** | `...typography.title.title3` + `fonts.semibold`. On color blocks tightened to `fontSize: 20, lineHeight: 26`; list rows keep the native 22/30. `numberOfLines={2}` | Exercise / task name |
| **Meta** | color block: `...typography.label.medium` + `fonts.medium` (14/18) at `opacity: 0.85`. List row: `...typography.label.detail` (13/16 medium) | Duration, pattern, schedule, category |
| **Pill** | `...typography.label.small` + `fonts.semibold` (12/16) | "For you", "Azora Original" |

Rules:

- Never inline a font string. `fonts.semibold` / `fonts.medium`, always.
- Never use `typography.body.*` inside a card — body is Light and reads as prose,
  not as card metadata. Cards use `label.*`.
- Titles are the only place `title3` appears at card scale; do not step up to
  `title2` to add emphasis — use the hue instead.
- The eyebrow is *not* literal `overline` styling: it deliberately drops the
  uppercase and the 1.4 tracking and grows to 16pt. Copy the override block
  verbatim rather than re-deriving it.
- Numeric values (`5-5`, `2:34`) ride in the meta row, not as a separate stat —
  `typography.stat.*` belongs to ring/gauge cards, not these.

---

## 3. Color

### Hue families

Six `colors.playful` families, each a triple: `base` (saturated fill, cleared
for white text at 3:1), `soft` (receded tint), `ink` (text on `soft`).

| Family | base | soft | ink | Meaning |
| --- | --- | --- | --- | --- |
| teal | `#00A391` | `#A8E5DA` | `#0B6B5C` | Calm |
| violet | `#6C4BFF` | `#CFC5FB` | `#4B34C4` | Sleep |
| sky | `#2979FF` | `#C3DBFC` | `#1559A8` | Focus |
| coral | `#F04E30` | `#FAC7B6` | `#B23A1D` | Energy |
| blush | `#F0488F` | `#F8CFE3` | `#A12359` | Balance |
| amber | `#D97706` | `#F8DEA3` | `#925C00` | Check-in / breath hold |

Assignment is centralized in
`src/features/exercise/guidedBreathing/categoryPalette.ts` — `CATEGORY_STYLE`
maps category → hue + glyph + character, `BREATH_HOLD_STYLE` carries amber for
the non-category daily hold. **Never pick a hue at the component level.**

### Where each slot goes

- `hue.base` → the whole card surface (archetype A) or the art tile (archetype B).
- `hue.ink` → text and icons that sit on `hue.soft` or on a white pill placed on
  `hue.base` (the "For you" / "Azora Original" pill text, the metadata icon in a
  list row).
- `hue.soft` → the receded/completed state, and the character body inside the
  art tile.
- `colors.text.inverse` → every piece of copy on `hue.base`, plus the glyph and
  decor art, plus the pill background.

### Neutrals

| Slot | Token |
| --- | --- |
| Canvas behind cards | `background.canvas` `#F7F8FB` |
| List card surface | `background.elevated` `#FFFFFF` |
| Primary copy on white | `text.primary` `#3A434F` |
| Metadata on white | `text.secondary` `#5B6675` |
| Timeline rail dashes | `border.default` `#CBD5E1` |

### Status colors

Status is never signaled by the hue — it lives in the 18pt timeline marker:

| State | Fill | Icon |
| --- | --- | --- |
| Due | `primary.blue600` | none |
| Completed | `success[500]` | `check`, `text.inverse` |
| Locked | `neutral[400]` | `lock-outline`, `text.inverse` |

Loading is `opacity: 0.45` on the art tile only — the copy stays at full
strength so the row doesn't flicker.

**Hard rule:** no hex literal outside `src/theme/colors.ts`. If a shade is
missing, add it to the palette first.

---

## 4. Shape, depth, spacing

- **Radius:** `radius.hero` (20) for every card in both archetypes; `18` for the
  inner art tile; `999` for pills. All card radii pair with
  `borderCurve: 'continuous'` — that's what `card.block` / `card.blockShadow`
  already do.
- **Depth:** exactly one shadow token, `card.blockShadow` — neutral `#0F172A`,
  `0/4`, opacity `0.06`, radius `20`, `elevation: 4`. Shadows are never colored,
  never tinted by the hue. Color blocks clip, so the shadow must go on a wrapper
  view, never on the clipping view itself.
- **No borders.** Depth comes from canvas contrast and the shadow. `card.base`'s
  borderless philosophy applies here too.
- **Spacing:** `spacing.xs 4` inside a meta row, `spacing.sm 8` between marker
  and pill, `spacing.md 16` between copy and art / as card padding,
  `spacing.lg 24` as the top/right pad of a color block and as the vertical gap
  between timeline rows. No magic numbers — the only bare numbers allowed are
  the fixed geometry constants declared at the top of the file
  (`TIMELINE_ROW_HEIGHT`, `TASK_CONTENT_SIZE`, `GLYPH_SIZE`, …).

---

## 5. Decoration: two art systems, on purpose

| System | Used by | Rule |
| --- | --- | --- |
| **Glyph** (`ActivityGlyph`) | Explore / browsable library | One shape per technique via `TECHNIQUE_GLYPH` — exhaustive over `TechniqueId` so a new exercise fails to compile until it gets a shape. Keeps a scrolled row from ever repeating. Always white @ `0.16`, 186pt, bleeding off the corner. |
| **Character** (`BlobCharacter` + `TaskCardDecor`) | Today's Dailies | Gives the day's three tasks a face. `faceExpression` conveys the task (`calm` / `energy` / `hold`), body is `hue.soft`, face is `hue.ink`. |

Don't cross them: a library card never gets a face, a daily row never gets a
bleeding glyph.

Icons in meta rows are 14pt. `MaterialCommunityIcons` still appears in the
dailies rows; prefer adding to `src/components/common/icons/paths.ts` and using
`<Icon />` (as the Explore cards do) for anything new.

---

## 6. Interaction

- `Pressable` only, wrapping the entire card.
- `triggerTapHaptic()` fires before the handler on every card press.
- Pressed feedback scales with card size: `0.98` for a color block, `0.99` for a
  list row; opacity `0.9` / `0.8` respectively.
- `accessibilityRole="button"` plus a label that reads the card left to right,
  including state: `` `${title}, ${detail}, scheduled for ${time}, ${status}` ``.
  Locked cards say so via `accessibilityHint` ("Opens the Pro upgrade screen"),
  never by being disabled.
- Decorative layers (`glyph`, `art`, `copy` inside a pressable) carry
  `pointerEvents="none"`.

---

## 7. Building a new card — checklist

1. Pick the archetype: is this a browsable *thing* (A) or a stateful list item (B)?
2. Get the hue from `CATEGORY_STYLE` / `BREATH_HOLD_STYLE`. Don't choose one.
3. Spread `card.block` (A) or wrap in `card.blockShadow` (B). No hand-rolled
   radius/shadow/border.
4. Four text roles max: eyebrow, title, meta, optional pill.
5. `fonts.semibold` is the ceiling; `label.*` for metadata, never `body.*`.
6. White copy on `hue.base`; `hue.ink` on white pills and soft tints.
7. Status → marker colors, not the hue.
8. Padding from `spacing`; fixed geometry as named constants at file top.
9. `Pressable` + haptic + scale/opacity press state + full accessibility label.
10. `npm run check`.
