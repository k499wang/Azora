# Screen 5 — Science backing

## Purpose

Convert the trust earned on Screen 4 (other people use this) into the trust needed for Screen 6 (you can give us your data). The mechanism shifts from social proof to authority proof. Card 3 of 3 in the carousel.

## What the user sees

- Same carousel chrome as Screens 3 and 4 (paging dots ○○●, Continue button — no Skip on this last card; the user is one tap from Account).
- A small visual mark in the upper half — a stylized leaf-and-pulse icon, or a ring-with-heartbeat motif. Same illustration system as Screen 3 (single SVG via `Icon`).
- **Headline** stating the science position.
- **Subhead** with one supporting sentence.
- A short **citation row** beneath, in smaller, lower-contrast text, naming the broad framework — not specific paper IDs (that reads as defensive).
- Continue button at the bottom labelled differently from previous screens (see copy).

## Behavior

- Swipe right → Screen 4. Swipe left → Screen 6 (exits the carousel into Account).
- Tap Continue → Screen 6.
- No Skip affordance — at this point the user has either skipped already or is ready to proceed.

## Copy

Two candidates, in order of preference:

1. **Headline:** `Backed by the science of HRV.`
   **Subhead:** `Heart rate variability is a clinical marker of how well your nervous system recovers. Our sessions are designed to move it in the right direction.`
   **Citation row:** `Built on published research in HRV biofeedback and paced breathing.`

2. **Headline:** `Designed with breathwork researchers.`
   **Subhead:** `Our techniques follow protocols studied for stress, sleep, and focus — translated into sessions short enough for real life.`
   **Citation row:** `Methodology grounded in peer-reviewed breathwork literature.`

Recommend **Option 1** — HRV is already a feature of the app (per `src/lib/hrv.ts`), so the science claim is concrete and defensible, not vague.

CTA label: `Get started` *(intentionally different from "Continue" on prior cards — signals the carousel is ending and a real commitment is next).*

## Why this screen exists

Authority is the third leg of the trust stool, after personal experience (Screens 1–2) and social proof (Screen 4). Health users are particularly authority-sensitive; lifestyle apps can skip this, health-adjacent apps cannot. Hims & Hers leans heavily on this — every product page has a "Backed by science" section.

## Tips applied

- **Scientific credibility signaling ("Backed by science")** — explicit, in the headline, not buried.
- **Authority bias / trust transfer** — citing peer-reviewed work and the HRV framework.
- **Outcome connection** — the science is tied to *what the user gets* (recovery, stress regulation), not to feature jargon.

## Tips deliberately *not* applied here

- No specific paper citations or DOIs. Reads as performative and is hard to defend if challenged on a single source.
- No clinician endorsements unless we genuinely have them. Fake authority is worse than no authority.
- No "FDA approved" / "medical device" language. We are not that and saying so is a regulatory landmine.

## Open question (also flagged in README)

What's the canonical source we cite if a user pushes back? Recommend picking one — e.g. Lehrer et al. on HRV biofeedback — and storing it in `onboarding/copy.ts` so support and marketing share the same answer.

## Implementation hints

- Citation row uses `typography.body.small` (or whichever caption-tier token exists) at reduced opacity (~0.6).
- The CTA label change ("Get started") needs to be wired through whatever button component the carousel uses — likely the same persistent button, with the label keyed off the active page index.
- This is a good place to verify the carousel passes accessibility: VoiceOver should announce "Page 3 of 3" when this card is active.
