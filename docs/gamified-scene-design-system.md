# Azora Gamified Scene Design System

Companion to `docs/card-design-system.md`. That doc governs **cards** — flat
surfaces you tap. This one governs **scenes**: persistent illustrated worlds
that grow with the user (the garden tree, a hotel room, whatever comes next).

A scene is the one place in the app where illustration is the content rather
than decoration. The risk is that it drifts into a different app's art style.
This doc is the leash.

---

## 1. What a scene is

| | Card | Scene |
| --- | --- | --- |
| Purpose | Start an action | Reflect accumulated progress |
| Lifetime | Same every day | Changes over weeks |
| Art role | Decoration behind copy | The content itself |
| Interaction | One tap → navigate | Tap a part → inspect / place / upgrade |
| Examples | `TechniqueCard`, dailies row | `HomeTreeHero`, a room, an aquarium |

Existing precedent lives in `src/features/garden/` — `HomeTreeHero`,
`FlowerIllustration`, `GrassGround`, `LowPolyBlossom`. Read those before
building a new scene; extend the vocabulary rather than starting a second one.

---

## 2. The three art systems (and now a fourth)

The app deliberately runs separate art systems so each surface reads
differently. Adding a scene means adding the fourth — and keeping it out of the
other three.

| System | Component | Domain | Never used for |
| --- | --- | --- | --- |
| **Glyph** | `ActivityGlyph` | Browsable library cards | Anything with a face |
| **Character** | `BlobCharacter` + `TaskCardDecor` | Today's three tasks | Library cards, scenes |
| **Icon** | `Icon` / `paths.ts` | Chrome, meta rows, buttons | Illustration |
| **Scene** | `features/<scene>/illustrations/*` | The growth world | Cards of any kind |

Rules:

- A scene never renders `BlobCharacter`. If the scene needs a resident, it gets
  its own inhabitant drawn in the scene's own vocabulary — the blob belongs to
  the dailies rows and borrowing it collapses two systems into one.
- A card never renders scene illustration at full fidelity. If a card must
  preview the scene, it shows a **flattened thumbnail** (see §7).

---

## 3. Drawing vocabulary

All four systems share a construction language. Match it and a new scene looks
native on day one.

**Medium.** `react-native-svg`, vector, no raster where a path will do. Skia is
reserved for arcs and progress rings (`RingStatCard`); don't use it for scene
shapes. Raster PNGs are allowed only for pre-rendered growth stages
(`features/garden/assets/plants/*`) where a path would be absurd — and then all
stages must be exported from one source at one scale.

**Geometry.**

- Draw in a **100×100 viewBox** (`ActivityGlyph`, `BlobCharacter`) or an explicit
  square, and size at the call site. Never hardcode pixel dimensions inside the
  illustration.
- Rounded everything: `strokeLinecap="round"`, `strokeLinejoin="round"`.
- Stroke weight `8–9` for glyph-scale marks, `3.5–4` for character-scale detail.
  Scene objects sit at character scale.
- **Asymmetry on purpose.** The blob body is a bezier with uneven control points
  specifically so it reads hand-drawn, not as an ellipse primitive. Scene
  objects follow: no perfect circles for organic things, slight tilt on
  furniture, mounds as offset ellipses rather than arcs.
- Ground plane = a soft ellipse mound with a darker ellipse shadow offset a few
  units down (`GrassGround`). Every scene object that "sits" gets one; it is
  what keeps a floating SVG from looking like a sticker.

**Shading.** Two tones per object, maximum: a fill and one darker plane. No
gradients, no outlines-plus-shadow-plus-highlight. Low-poly facets
(`LowPolyBlossom`) are the sanctioned way to add a third read.

**Depth.** Scale and overlap, not perspective. A scene is a shallow diorama:
background band, mid objects, foreground mound. No vanishing points.

---

## 4. Color

Scenes use the same palette as everything else. **No hex outside
`src/theme/colors.ts`** — this is the rule scenes break most easily, and the
garden currently breaks it (`GrassGround` hardcodes `#86C875` / `#5EAA69`,
`HomeTreeHero` hardcodes two `rgba()` values). Fix that when you touch those
files; do not copy the pattern.

### Adding a scene palette

Scene-native colors (foliage, wood, wallpaper, water) do not exist in the
current palette because nothing else needs them. Add them as one named family
under `colors`, structured like `playful.*` — a fill, a receded tint, and an
ink:

```ts
// src/theme/colors.ts
scene: {
  foliage: { base: '#…', soft: '#…', ink: '#…' },
  ground:  { base: '#…', soft: '#…', ink: '#…' },
  timber:  { base: '#…', soft: '#…', ink: '#…' },
},
```

Constraints on the hues you pick:

- Same saturation register as `playful.*` — saturated but not neon; `base`
  must clear 3:1 against white so a scene object can carry a white label.
- `soft` is the `base` desaturated and lightened, used for the **unearned /
  not-yet-grown** state.
- `ink` is the darker plane and any text drawn on `soft`.
- Cap the scene at **four families**. A room with eight material colors stops
  reading as one illustration.

### Carrying meaning from the rest of the app

- Progress and state signals reuse the existing semantics, not new ones:
  `success[500]` for a completed/earned marker, `neutral[400]` for locked,
  `primary.blue600` for due/available — identical to the dailies timeline
  markers.
- If a scene object corresponds to a breathing category, tint it with that
  category's `playful` hue from `CATEGORY_STYLE` so teal still means Calm
  inside the scene.
- Locked or unearned objects render at `hue.soft` (or scene `soft`), never
  greyed out with an opacity hack, and never with a padlock badge — absence and
  desaturation carry it.

---

## 5. The container

A scene is not a card, but it lives on the same canvas and obeys the same
surface rules.

Two sanctioned containers:

**Medallion** (current `HomeTreeHero`): a circle holding a single hero object.

- Size: `min(300, width - spacing.lg * 2 - spacing.xl)`, `borderRadius: size/2`.
- Fill: the scene family's `soft` at ~40% — a tint, not a solid.
- Edge: 3pt ring in the family's `base` at ~30%. Both should become
  `colors.scene.*` tokens rather than inline `rgba()`.
- Depth: `card.blockShadow`. Do not invent a softer/larger shadow — one shadow
  token in the app.
- `overflow: 'visible'` so the object can break the circle. That break is the
  charm; keep it.

**Panorama**: a full-bleed rounded rectangle holding a multi-object world (a
room). Use `...card.block` — `radius.hero` (20), continuous curve, clipping —
wrapped in `card.blockShadow`. Same geometry as a color-block card, because it
*is* one: the scene replaces the flat `hue.base` fill.

Nothing else. No borders beyond the medallion ring, no colored shadows, no
inner glow.

---

## 6. Growth and state

The scene's whole job is showing accumulated progress. Keep the mechanics in
domain code, not in the illustration.

- **Stages, not continuous morphs.** `homeTreeProgress.ts` maps care days →
  a discrete stage (`seed`, `sprout`, `sapling`, `young`, `mature`). Four to
  five stages is the target: enough that growth is visible, few enough that each
  stage is authored well. A room follows the same shape — a slot is empty,
  placed, or upgraded.
- **Pure domain module.** Progress math lives in
  `src/features/<scene>/domain/<scene>Progress.ts` with unit tests, returning a
  plain descriptor. The illustration component takes that descriptor plus a
  `size` and is otherwise dumb. `FlowerIllustration(speciesId, growth, size)` is
  the shape to copy.
- **Monotonic.** A scene never visibly regresses. Streak loss can pause growth
  or dim the sky; it does not kill the plant or remove furniture. Punitive
  gamification contradicts the app's tone.
- **Loading** is an `ActivityIndicator` in the family's `base`, centered in the
  container — never a skeleton of the illustration.
- **Unavailable** (progress failed to load) is the same indicator in
  `neutral[400]`, so the failure reads as neutral rather than as zero progress.

---

## 7. Where a scene may appear

| Placement | Rule |
| --- | --- |
| Its own tab/screen | Full fidelity, panorama or medallion, interactive |
| Home hero | Medallion only, one object, non-interactive or single tap-through |
| Inside a card | **Flattened thumbnail only** — one silhouette at ≤112pt in the art-tile slot (§Archetype B), no ground mound, no background band |
| Behind copy | Never. Scenes are never a text backdrop; that's what `ActivityGlyph` at 0.16 opacity is for |

---

## 8. Interaction and motion

- Tappable scene objects use `Pressable` + `triggerTapHaptic()`, pressed state
  `opacity: 0.9, scale: 0.98` — the same feedback as a color-block card.
- Every interactive object needs `accessibilityRole="button"` and a label that
  states object and state: `"Oak tree, stage 3 of 5, grows with your next
  session"`. Decorative layers get `pointerEvents="none"`.
- A screen reader must be able to get the scene's state without the picture:
  render a visually-hidden summary line, or expose it in the container's
  `accessibilityLabel`.
- Motion is **ambient and slow** — a leaf sway or a lamp flicker on a multi-second
  loop, low amplitude. Growth transitions get one celebratory beat when a stage
  is crossed, and only then. Respect `useReducedMotion`; the reduced path shows
  the new stage with no animation.
- No idle bouncing, no particle bursts on every tap. The app's tone is calm; a
  scene that jitters undoes that.

---

## 9. File layout

```
src/features/<scene>/
  domain/
    <scene>Progress.ts        pure stage math + tests
    <scene>Progress.test.mjs
  illustrations/
    <Object>Illustration.tsx  one file per drawable object
    <scene>Palette.ts         object → colors.scene.* + stage mapping
  components/
    <Scene>Hero.tsx           container + state wiring
```

- Illustration files are pure SVG + props. No data fetching, no navigation.
- The `<scene>Palette.ts` file is the single place an object is assigned a hue —
  same role `categoryPalette.ts` plays for cards. Never pick a color inside an
  illustration component.
- Use an exhaustive `Record<ObjectId, …>` for object→art mapping so adding an
  object fails to compile until it is given art, exactly as `TECHNIQUE_GLYPH`
  does.

---

## 10. Checklist for a new scene component

1. Is it a scene or a card? If it doesn't change over weeks, it's a card — use
   the other doc.
2. Add the scene's hue families to `colors.ts` under `scene`, four max, each a
   `base` / `soft` / `ink` triple.
3. Draw in a square viewBox, rounded caps, two tones per object, deliberate
   asymmetry, a ground mound under anything that sits.
4. Never render `BlobCharacter` or `ActivityGlyph` inside a scene.
5. Container is medallion (circle, soft tint, base ring) or panorama
   (`card.block`), both with `card.blockShadow`. No other depth.
6. Stage math in `domain/`, pure and tested; illustration takes a descriptor and
   a `size`.
7. Unearned = `soft` tint. Locked/complete markers reuse `neutral[400]` /
   `success[500]`.
8. Pressable + haptic + 0.98 press + a stateful accessibility label; state
   readable without the picture.
9. Ambient motion only, one beat on stage-up, reduced-motion path included.
10. `npm run check`.
