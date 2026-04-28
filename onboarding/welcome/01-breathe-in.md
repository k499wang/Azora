# Screen 1 — Breathe in

## Purpose

The signature opening moment, borrowed directly from Headspace. Before the app asks anything of the user, it gives them something: a single regulated breath. By the time copy appears two screens later, the user is already calmer than when they opened the app, and they have already used the product without realizing it.

## What the user sees

- Same warm welcome background as splash.
- Headline at the top: **"Breathe in"**, single line, large, centered horizontally, sitting in the upper third.
- A friendly orange blob character at the bottom of the screen, bottom-aligned, smiling with closed peaceful eyes. The blob fills roughly the bottom 35% of the screen at rest.
- The blob *scales up* over ~4 seconds as the user inhales, growing taller and wider, eyes staying gently closed. Subtle, not bouncy.
- No buttons. No skip. No nav.

## Behavior

- Auto-advances to Screen 2 (Breathe out) when the inhale animation completes.
- Tapping anywhere on the screen does *nothing* during the inhale — this is intentional. The user is being asked to breathe, not to interact. (Tap-to-skip is available globally via a small "Skip intro" link top-right that appears only on first frame and fades after 1s. Unobtrusive but present, for users in a hurry.)
- Total duration on this screen: ~4s.

## Copy

- Headline: `Breathe in`
- (Optional) Skip link, top-right, very small, low opacity: `Skip intro`

## Why this screen exists

Wellness apps have a unique opportunity: the product *is* the regulation. Headspace understood that the fastest way to prove the app works is to make it work in the first three seconds. The user inhales. Their nervous system responds. They are now slightly more receptive to the value-prop screen that follows. This is a System 1 win that no copy can replicate.

## Tips applied

- **Immediate problem-solution value** — the "solution" is delivered before the "problem" is even stated. The user gets relief, then learns the app is for relief.
- **Anxiety reduction on first screen** — a slow inhale is parasympathetic priming.
- **System 1 snap judgment** — the warm color, the smiling blob, the slow pace all communicate "you are safe here" before any text is read.
- **Cognitive load reduction** — two elements on screen (headline + blob), one instruction.

## Tips deliberately *not* applied here

- No value-prop copy. Putting a sales line on a breath screen would shatter the moment.
- No social proof. Same reason.

## Implementation hints

- Blob can be Skia (consistent with `RingStatCard.tsx` patterns already in the repo) or a Lottie animation. Skia gives finer control over the inhale curve. Open question in the README.
- Inhale curve should be ease-in-out, not linear, so the scale feels like a real breath.
- Headline uses the playful display family from `FONT_FAMILY` — likely Fredoka or Baloo2 — never inlined as a string literal.
- Background and blob colors belong in `colors.ts`.
