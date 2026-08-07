# Breathing Blob Companion — Spec

Replaces the plain scaling disc in the guided breathing session with the blob
character as a breathing companion. Applies `docs/gamified-scene-design-system.md`
(art rules) and reuses `BlobCharacter` from the dailies rows.

Touches: `src/features/exercise/shared/components/BreathingCircle.tsx`,
`src/features/exercise/guidedBreathing/components/GuidedBreathingPresentation.tsx`.

---

## 1. The idea

The pacer stops being a shape that grows and becomes **someone breathing with
you**. The blob's body inflates on inhale, holds with its cheeks full, and
sighs out on exhale. Its face changes per phase, and its resting expression
comes from the technique's category — so Sleep sessions are drowsy and Energy
sessions are bright.

The rule from the design system still holds: the blob is **expressive, not
precise**. It never becomes the sole timing signal. A thin outline ring marks
maximum extent so the user always has a hard edge to read progress against.

```
      ╭ ─ ─ ─ ─ ─ ─ ─ ─ ─ ╮        ← extent ring, 2pt, 0.5 opacity, static
     │      ___________     │
     │    ╱             ╲   │       ← blob body: scales between 0.33 and 1.0
     │   │   ◠      ◠    │  │         on the SAME Animated.Value the disc used
     │   │      ‿        │  │
     │    ╲___________╱     │
      ╰ ─ ─ ─ ─ ─ ─ ─ ─ ─ ╯
              Inhale                ← phase label moves BELOW the blob
```

---

## 2. What does not change

This is the load-bearing constraint. `BreathingCircle` exposes an imperative
ref — `expand` / `contract` / `pause` / `resumeExpand` / `resumeContract` /
`reset` — driven by the session timing hook.

**Keep `BreathingCircleRef` byte-identical.** Keep the single
`Animated.Value` scale, `Easing.linear`, `useNativeDriver: true`, and the
`OUTER_MIN_SCALE = INNER_SIZE / OUTER_MAX_SIZE` floor. The companion is a
rendering swap underneath an unchanged interface; no timing, pause/resume, or
session-state code is touched. If a change requires editing
`breathingSessionTiming`, it is out of scope for this work.

Also unchanged: `beatTick` flush, the camera slot contract, the intro
cross-fade in `GuidedBreathingPresentation`, and the dark-theme token set in
`exerciseDarkThemes.ts`.

---

## 3. Two configurations

The session has a heart-rate mode that puts a live camera preview inside the
108pt inner disc. That disc cannot go away, so the blob has two layouts.

### A. Companion (heart rate off) — the default

- The filled outer disc is **replaced** by the blob body, scaling on the same
  value.
- The 108pt inner disc is **not rendered**.
- The extent ring stays, at `theme.circleOutline` / `circleOutlineOpacity`.
- The phase label moves out of the disc to **below the blob**, keeping the
  existing `phaseLabel` style.

### B. Escort (heart rate on)

- The inner 108pt disc stays exactly where it is, camera preview and beat flush
  intact — it is the "stone" the blob is holding.
- The blob shrinks to **96pt** and sits **bottom-left of the ring**, outside the
  disc, breathing in place with a small ±6% body scale.
- The outer filled disc returns as the pacer for this mode, unchanged.

Rationale: the PPG reading needs the camera framing and the beat flush to stay
literal. Rather than fight it, HR mode demotes the blob to a true sidekick.
Config A is the one most sessions see.

---

## 4. Body animation

`BlobCharacter`'s body is a fixed bezier (`BODY_PATH`, 100×100 viewBox) with
deliberately uneven control points. Do **not** re-author it as an animated path —
morphing beziers on the JS thread will drop frames.

Instead, drive the whole SVG with the existing `Animated.Value`:

| Property | Mapping | Why |
| --- | --- | --- |
| `scale` | `OUTER_MIN_SCALE → 1.0`, linear | The existing pacer value, untouched |
| `scaleX` | additional `1.06 → 1.0` | Squash at the bottom of the exhale, round at the top of the inhale — the difference between "a shape resizing" and "a body breathing" |
| `translateY` | `+8 → 0` viewBox units | The blob settles down as it empties, rises as it fills |

All three are `interpolate()` calls off the one value, so everything stays on
the native driver. No second animation clock.

**Holds** are where the character earns its place. The scale value is static
during `holdIn` / `holdOut`, so add a hold micro-motion driven by a separate
looping value, started on hold enter and stopped on exit:

- `holdIn`: body at full extent, ±1.5% scale wobble at ~1.2s — full and
  straining slightly.
- `holdOut`: body at minimum, near-still, ±0.8% at ~2s — empty and calm.

Amplitude stays under 2%. Anything larger reads as a bounce and contradicts the
"hold" instruction.

---

## 5. Faces

`BlobCharacter` already takes `character` (body) and `faceExpression`
separately, and `CATEGORY_STYLE[category].character` gives the technique its
resting expression. Extend `CharacterId` with four phase faces, or add a
parallel `BreathFace` union — prefer the latter so the dailies rows are not
affected by session-only art.

| Phase | Face |
| --- | --- |
| `inhale` | Eyes open and soft, small rounded mouth — drawing in |
| `holdIn` | Eyes squeezed to arcs, cheeks marked with two low-opacity circles (the `hold` face already does this), mouth a flat line |
| `exhale` | Eyes relaxed, mouth a wide gentle curve — the sigh |
| `holdOut` | Eyes closed as shallow arcs, mouth a small neutral line |
| `done` | The category's own resting face, plus a check drawn beside the blob (not on it) |

Cross-fade faces over **220ms** at each phase boundary, so the expression
arrives with the transition rather than snapping. Face swaps are opacity-only —
two `<G>` layers, no path interpolation.

Stroke weight stays at `STROKE = 4` in the 100-unit viewBox regardless of
rendered size, per the scene doc's character-scale rule.

---

## 6. Color

The session runs on `ExerciseDarkTheme`, not the app canvas — pull every color
from the theme prop that `GuidedBreathingPresentation` already passes down:

| Blob part | Token |
| --- | --- |
| Body fill | `theme.circleOuter` at `theme.circleOuterOpacity` — same fill the disc used, so all four themes keep working with zero new tokens |
| Face | `theme.circleInner` |
| Extent ring | `theme.circleOutline` at `theme.circleOutlineOpacity` |
| Beat flush (HR mode) | `theme.beatFlush`, unchanged, on the inner disc only |
| Phase label | existing `phaseLabel` style, `colors.neutral[50]` |

No `playful.*` hue in the session. The category's identity is carried by the
*face*, not the color — the dark themes are user-chosen and a teal blob would
fight a `sage` or `stone` theme. **No new colors are needed for this feature**;
if you find yourself adding one, the mapping above is wrong.

---

## 7. Accessibility and motion

- The blob is decorative: `pointerEvents="none"`, and the accessible phase
  announcement stays on the existing label, which is the real signal for a
  screen reader.
- Reduced motion: keep the scale pacer (it is the instruction, not decoration),
  drop the squash, the translate, and the hold wobble. Faces still swap, but
  cut the cross-fade to an instant switch.
- The extent ring must remain visible in every theme — it is the fallback timing
  read for anyone who can't parse the blob's shape.

---

## 8. Files

```
src/features/exercise/shared/components/
  BreathingCircle.tsx          unchanged ref API; renders body via BreathingBlob
  BreathingBlob.tsx            animated SVG body + face layers
  breathFaces.tsx              phase → face <G>, mirrors BlobCharacter's switch
```

`BreathingBlob` takes the `Animated.Value`, the phase, the category character,
and theme colors. It owns no timing.

Do not fork `BlobCharacter` — import `BODY_PATH` and the face switch from it, or
lift both into a shared module. Two divergent blob bodies is the failure mode
this spec exists to prevent.

---

## 9. Build order

1. `BreathingBlob.tsx` rendering a static blob at the disc's position, driven by
   the existing scale value. Ref API untouched. Ship behind a flag.
2. Squash + translate interpolations; verify native driver, no dropped frames on
   a low-end Android.
3. Phase faces + 220ms cross-fade.
4. Hold micro-motion.
5. Config B (HR mode escort placement).
6. Reduced-motion path, then remove the flag.
