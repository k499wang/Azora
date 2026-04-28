# Screen 2 — Breathe out

## Purpose

Complete the breath cycle started on Screen 1. By exhaling, the user activates the parasympathetic response (exhales are more regulating than inhales) and finishes a full physiological loop. They have now demonstrably used the product.

## What the user sees

- Same warm welcome background.
- Headline at the top: **"Breathe out"**, identical typographic treatment to Screen 1.
- The orange blob, now at its scaled-up "full lungs" size at the start of the screen, gradually shrinking back to its rest size over ~6 seconds. The exhale is intentionally longer than the inhale (4s in, 6s out) — this is a clinically known regulation pattern (extended exhale).
- Eyes still closed, smile slightly softer than Screen 1 (a contented, post-exhale settling).

## Behavior

- Auto-advances to Screen 3 (Value prop) when the exhale animation completes.
- Same skip rule as Screen 1: small "Skip intro" top-right, low opacity, fades after 1s.
- Total duration: ~6s. The full Breathe in + Breathe out experience is ~10s — short enough to not feel like a tax, long enough to actually shift state.

## Copy

- Headline: `Breathe out`
- (Optional) Skip link: `Skip intro`

## Why this screen exists

The exhale is where the regulation actually happens. Inhale-only would feel incomplete and could even be slightly activating. Splitting the breath across two screens (rather than one screen with both phases) gives each word its own beat and matches the Headspace reference. It also creates a sense of pacing: the user has now had two full screen-changes, which subtly signals "the app is responsive and present" without any UI affordance doing that work.

## Tips applied

- **Immediate problem-solution value** — extends the regulation moment from Screen 1.
- **Anxiety reduction** — extended exhale is the strongest single intervention for vagal tone.
- **Cognitive load reduction** — same two-element composition as Screen 1, only the verb changes.
- **Brand consistency** — direct lift from the Headspace reference image.

## Tips deliberately *not* applied here

- Still no copy beyond the headline. The pre-cognitive moment is held until Screen 3.

## Implementation hints

- Reuse the exact blob component from Screen 1 with the scale animation reversed. Don't fork the component.
- The 4s/6s asymmetry should be a constant near the top of the breath component, named (e.g. `INHALE_MS`, `EXHALE_MS`), so a future tweak to pacing is one number.
- Consider a *very* subtle sound cue — soft outbreath whoosh — but only if the device is not silenced and the user has not already opened a meditation. Default to silent. (Open question — likely punt to a later pass.)
