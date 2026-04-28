# Screen 3 — Value proposition

## Purpose

The first screen with persuasive copy. State the outcome the user gets in one sentence. This is also the first card of a 3-card swipeable carousel (3 → 4 → 5).

## What the user sees

- Warm welcome background, transitioning to a softer surface — the blob is gone, replaced by a small calm illustration in the upper half (e.g. a stylized lung-and-heart pairing, or a sun-rising shape — same visual language as Headspace's "Welcome to Headspace" screen with floating icons around a phone).
- **Headline** in the upper-middle: outcome-led, one sentence.
- **Subhead** beneath the headline: one short clarifying line.
- Three small paging dots near the bottom (●○○) indicating this is card 1 of 3.
- A primary **Continue** button anchored at the bottom (full-width, blue, per `card.ts` / theme tokens).
- A small **Skip** affordance in the top-right corner, low contrast.

## Behavior

- Swipe left → Screen 4. Swipe right does nothing (this is the first card).
- Tap Continue → Screen 4.
- Tap Skip → Screen 6 (Account). Skip is allowed but not encouraged.

## Copy

Pick one direction and commit. Three candidates, in order of preference:

1. **Headline:** `Calm your body in one breath.`
   **Subhead:** `Guided breathwork, paced exhales, and HRV insight — in under 5 minutes a day.`

2. **Headline:** `Feel the difference in 5 minutes.`
   **Subhead:** `A daily breathing practice that calms your nervous system, backed by your real-time HRV.`

3. **Headline:** `Train your nervous system, one breath at a time.`
   **Subhead:** `Short guided sessions. Real biofeedback. Calmer days.`

Recommend **Option 1** — shortest, most concrete, and the body promise is more universal than the HRV promise (which is a feature, not an outcome).

CTA label: `Continue`
Skip label: `Skip`

## Why this screen exists

The Breathe in / out moment proved the product works. This screen names what the user just experienced and frames the rest of the flow. Without a value-prop screen, the user moves from a calming visual moment directly into an account ask, which feels abrupt and transactional.

## Tips applied

- **Immediate problem-solution value proposition on first screen (with words)** — outcome-led headline.
- **Outcome-driven value prop (health-app pattern)** — focuses on what the user gets, not what the app does. "Calm your body" not "Guided breathwork sessions."
- **Relevance filtering** — within 2 seconds of reading, a user knows whether this app is for them.
- **Cognitive load reduction** — one headline, one subhead, one button.

## Tips deliberately *not* applied here

- No social proof yet — that's Screen 4. Mixing them dilutes both.
- No science yet — Screen 5.
- No testimonials. The user hasn't earned context for a stranger's quote yet.

## Implementation hints

- Carousel is a `FlatList` with `pagingEnabled` and `horizontal`, OR `react-native-pager-view`. Either is fine; `FlatList` is one less dep.
- Persistent Continue button overlays the carousel — does NOT move with the swipe. The user always sees the same button position.
- Headline and subhead use typography tokens (`typography.title.title2`, `typography.body.medium` or similar) — pick from `typography.ts`, do not invent.
- The illustration in the upper half should be a single SVG via the `Icon` system (path added to `paths.ts`) so it tints with theme color.
