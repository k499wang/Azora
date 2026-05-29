# Shareable Lung-Age Result — Improvement Plan

Goal: make the daily-exercise result more shareable (organic) and more demoable (paid ads).

## Context

- The lung-age card fires after **every daily breath-hold exercise** — the recurring loop already exists.
- Surface: `src/screens/ShareableResultScreen.tsx` (the `DailyResult` screen).
- Static share artifact: `src/components/exercise/ShareCard.tsx` (9:16, exported 1080×1920 via `ViewShot` + `expo-sharing`).
- A near-identical reveal animation already exists in `src/components/onboarding/screens/LungCapacityScreen.tsx` (`arcProgress` / `scoreAnim`, ~2200ms calibrating sweep) and can be reused.
- Not doing: Instagram Story share path (dropped for now).

Two artifacts, one funnel:
- **Exercise + reveal animation** = paid ad footage (motion).
- **Result card** = organic share artifact (static, screenshotted).

---

## Improvements (ranked by impact)

### 1. Animate the reveal — biggest lever (serves both loops)
`ShareableResultScreen` currently mounts with the ring already filled, so there's no payoff moment. Port the calibrating sweep from `LungCapacityScreen`: the arc fills and the age counts up to its final value over ~2s. Reuses existing logic; makes the screen both screenshot-worthy and filmable.

### 2. Lead with the age gap, not the tier (serves both)
`userAge` is already in the screen (`profileQuery.data?.age`). Center the contrast:

> Your lungs: **34** · You: **27**

Color the delta — orange when lungs are older (status anxiety), blue/green when younger (pride). Demote the tier label to a subtitle.

### 3. Make the comparison line specific and punchy
`LUNG_COMPARISON` lines are generic. Tie the line to the **gap**: "Your lungs are 7 years older than you" beats "Lungs of a non-smoker."

### 4. Capture the exercise as one clean, chrome-free run
Confirm the breath-hold flow has a full-screen state with no nav chrome from orb → timer → reveal, muted-readable. The expanding breath orb on loop is inherently watchable. Likely just verification if the state already exists.

### 5. Fix the share card's hook
`ShareCard` footer ("I held my breath for X. Can you beat me?") is a challenge hook. For a health-age card, curiosity converts better — surface the lung-age number big and let the implicit "what's mine?" do the work. Keep the `tryazora.app` handle as the install path.

### 6. Tighten the card to the 2-second rule
The card has brand + ring + tier + comparison + challenge + handle — too much. Cut to: one giant age, the gap, one verdict line, handle. Grasped in one scroll.

### 7. Weekly before/after (phase 2)
Since the result fires daily, store prior lung-age values to show "down 3 years this week." Progress cards outperform single results. Needs a small storage change.

**Quick win:** #1 and #2 are ~80% of the value and both reuse existing code.

---

## How priorities change by goal

### If paid ads only
- #1 reveal animation becomes the entire point — invest more (hook in first 1.5s, satisfying end snap, slow-mo on the gap).
- #4 clean capture state promoted to critical.
- `ShareCard` (#5, #6, #7) barely matters — skippable.
- No on-card handle / curiosity hook needed (CTA lives in ad caption + store link).
- New work: an internal demo-mode route with seeded/ideal data so footage is repeatable and dramatic.

### If organic sharing only
- `ShareCard` redesign becomes #1; #2, #3, #5, #6 all move to the top.
- Reveal animation drops far down — a screenshot freezes one frame, so motion barely helps.
- #4 capture state irrelevant.
- Curiosity/viewer hook and on-card CTA matter more (the card is the only thing a stranger sees).
- New work: card theme variants (avoid cloned feeds); promote #7 weekly before/after (core of an organic strategy).

### Why "both" is front-loaded the way it is
Only #1 (reveal) and the clean breath-hold flow genuinely serve both loops, so they come first. Everything else is really one camp or the other. "Both" ≈ 2x the surface area of picking one — building one fully often beats half-doing both.
