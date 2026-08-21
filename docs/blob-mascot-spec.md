# Blob Mascot Spec

The constraint sheet for the blob. Anything drawn on the blob — by hand or
generated — must satisfy every rule here, because these are the invariants the
existing surfaces already depend on.

Two implementations exist and they are deliberately different:

| | `src/components/home/BlobCharacter.tsx` | `src/features/room/RoomBlob.tsx` |
|---|---|---|
| Purpose | static portrait on cards and result screens | the room's live resident |
| Motion | none (pure render, `memo`ed) | procedural Reanimated: walk, blink, cheer |
| Colors | `bodyColor` / `faceColor` props | `colors.roomBlob.*` |

This document covers `BlobCharacter`. `RoomBlob` follows the same silhouette and
face grammar but owns its own geometry constants.

---

## Hard invariants

**Canvas.** `viewBox="0 0 100 100"`, always square. `size` scales the whole
thing; never bake a pixel size into a path.

**Body.** `BODY_PATH` is fixed and is never redrawn, re-traced, or replaced. The
control points are deliberately uneven so the shape reads hand-drawn rather than
as an ellipse. A new expression changes the *face*, never the body.

**Stroke.** `strokeWidth` 4, `strokeLinecap="round"`, `fill="none"`. Use 3.5 only
for a deliberately finer detail (`focus` uses it for eyebrows). Never below 3 —
it disappears at the 28pt sizes the daily cards use.

**Color contract — the important one.** Exactly two color inputs:
`bodyColor` and `faceColor`. No hex literals, no third color, no gradients.
This is what lets the same component render teal on a Calm card, coral on
Energy, amber on the breath hold, and sky-soft in the profile avatar. Any art
that needs a third color breaks every call site.

For a tint, reuse `faceColor` or `bodyColor` with `fillOpacity`
(`hold` uses `0.35` cheeks; accessories use `0.45`–`0.55`).

---

## Face grid

Landmarks, so faces stay aligned across expressions:

```
eye line     y ≈ 52-56        (44-48 for brows)
eye centers  x = 38 and 62    (curves span 33-45 and 55-67)
mouth        y ≈ 63-68, centered on x = 50
cheeks       (30,64) and (70,64)
```

Grammar already in use — follow it rather than inventing a new idiom:

- `q dx,-dy dx2,0` → arc bulging **up** (⌒). Content, closed, smiling eyes.
  Shallower arc = sleepier (`calm` uses `-8`, `sleep` uses `-5`).
- `q dx,+dy dx2,0` → arc bulging **down** (‿). Relaxed or spent.
- `<Circle>` / `<Ellipse>` filled → open, alert eyes.
- `a r,r 0 0 0 w,0 Z` filled → open mouth. Wider = more excited.

---

## Two axes, two types

```ts
character: CharacterId       // identity: which category this blob belongs to
faceExpression: FaceExpression  // state: what it is feeling right now
```

`character` drives the **accessory** (the top-right flourish) and supplies the
default face. `faceExpression` overrides only the face.

`CharacterId` is closed at the six categories because `CATEGORY_STYLE` and
`TaskCardDecor` switch on it exhaustively — a seventh category must fail to
compile until it gets a hue, a glyph, and a decor shape.

`FaceExpression` is `CharacterId` plus state-only faces. State faces never
appear as a `character`, so they never need an accessory or a decor shape.
**New emotional states go in `FaceExpression`, not `CharacterId`.**

---

## Adding an expression

1. Add the name to `FaceExpression` in `BlobCharacter.tsx`.
2. Add a `case` to the `Face` switch, on the grid above, using only `faceColor`.
3. Wire it at a real call site in the same change.

Step 3 is not optional. An expression with no caller is dead code, and the
switch is exhaustive, so unused cases accumulate silently.

---

## Out of scope

**Do not auto-trace generated art back into this component.** A traced blob is
200+ path nodes with baked fills: it cannot honor the two-color contract, it
cannot be driven by shared values, and its silhouette will not match
`BODY_PATH`. Generated art is concept reference only — re-author it here.

Marketing art (App Store, ads, web) has no such constraint and does not belong
in this file.
