# Onboarding

Spec-only documentation for Azora's onboarding flow. No code in this folder — these files are the source of truth for screen content, intent, and the psychology behind each decision. Implementation lives under `src/screens/onboarding/` (TBD).

## Flow scope

This first pass covers **welcome only** — the screens before the user is asked to create an account or answer personalization questions. Personalization ("What brings you here?"), permissions priming, and account creation come in later passes.

## Vibe

- **Headspace** — playful blob character, generous whitespace, a single sentence per screen, calming pacing. The "Breathe in / Breathe out" intro is the signature opener and we keep it.
- **Hims & Hers** — quiet authority, outcome-led copy, science framing, no excessive marketing. The app feels like a tool a clinician would respect.

The blend: emotional warmth on the first two screens (Headspace), then steady credibility-building on the next three (Hims & Hers), then a confident account ask.

## Screen index

| #   | Screen              | Purpose                                                          | File                                  |
| --- | ------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| 0   | Splash              | Logo only, ~600ms hold, fades into Breathe in                    | `welcome/00-splash.md`                |
| 1   | Breathe in          | Calming brand moment; immediate physiological regulation         | `welcome/01-breathe-in.md`            |
| 2   | Breathe out         | Completes the breath cycle; user has already used the product    | `welcome/02-breathe-out.md`           |
| 3   | Value proposition   | "What this app gives you" — outcome headline + soft visual       | `welcome/03-value-prop.md`            |
| 4   | Social proof        | Community size + rating + short testimonial                      | `welcome/04-social-proof.md`          |
| 5   | Science backing     | Clinical / research credibility                                  | `welcome/05-science.md`               |
| 6   | Account / Log in    | Create account or log in, with T&C checkbox                      | `welcome/06-account.md`               |

Screens 3–5 are a swipeable carousel with paging dots and a persistent **Continue** button — users can swipe at their own pace or tap through. Skipping is allowed but de-emphasized (small "Skip" top-right on 3 and 4, gone on 5).

## How the tips from the reference images map to each screen

The images covered two tip groups: **wellness-app patterns** (Headspace, Calm-style) and **health-app patterns** (Hims & Hers, Ro-style). Every numbered tip is applied to a specific screen below. If a tip is intentionally deferred to post-welcome (e.g. intent question), it's called out.

### Wellness-app tips

| Tip                                                   | Where it lives                       | Notes                                                              |
| ----------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| Immediate problem-solution value prop on first screen | Screen 3 (Value prop)                | First screen *with words* — Breathe in/out are pre-cognitive       |
| Early social proof on secondary welcome screens       | Screen 4 (Social proof)              | Second-card position in the carousel, exactly as the tip prescribes |
| Scientific credibility signaling                      | Screen 5 (Science)                   | Third card, builds on social trust with authority trust            |
| Community size framing                                | Screen 4 (Social proof)              | "Join 500k+ people…" framing, paired with rating                   |
| Intent-based entry question                           | **Deferred** — post-welcome          | Belongs in personalization step, not welcome                       |

### Health-app tips

| Tip                                                | Where it lives                       | Notes                                                                |
| -------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| Minimal splash, fast transition                    | Screen 0 (Splash)                    | Logo only, ~600ms, no tagline, no animation flourish                 |
| Outcome-driven value prop                          | Screen 3 (Value prop)                | Headline names the outcome, not the feature                          |
| Early social proof for legitimacy                  | Screen 4 (Social proof)              | Numbers + rating, not just vibes                                     |
| Early account creation as value exchange           | Screen 6 (Account)                   | Frame as "Create your account to save your progress and HRV history" |

### Headspace-specific borrowings

- The two-screen Breathe in / Breathe out opener is preserved verbatim in structure: single word headline, blob character bottom-aligned, blob scales with the breath. This is the strongest brand moment in the reference; we don't dilute it.
- Single sentence per screen on 1, 2, 3, 5. Screen 4 (social proof) is the only screen with multiple text elements, and they're tightly grouped.
- Bottom-anchored primary action on 3–6, never floating mid-screen.

## Anti-patterns we are explicitly avoiding

- No "tour" carousel that explains features. Users don't care what the app *does*; they care what it *gives them*.
- No paywall or subscription mention in welcome. That's earned later.
- No request for permissions (notifications, HealthKit) in welcome. Primed at the moment of relevance.
- No intent question before the user has any reason to invest. Comes after account creation, when the trust account is non-zero.
- No marketing copy ("Revolutionary," "AI-powered," "The future of…"). Hims & Hers tone forbids it.

## Design tokens to reuse

Per `CLAUDE.md` — every screen uses tokens from `src/theme/`:

- Colors: `colors.ts` (likely the warm orange family for the blob, neutral surfaces for cards, blue for primary CTA)
- Spacing: `spacing.ts`
- Typography: `typography.ts` + `fonts.ts` — single active family from `FONT_FAMILY`
- Cards / shadows: `card.ts` (`card.base`, `card.shadow`)

If a token is missing for the blob orange or the welcome surface gradient, **add it to `colors.ts` first**; do not inline.

## Open questions for Kevin

1. **Brand name on splash + welcome** — the repo is "Azora"; is that the user-facing name, or is there a different product name?
2. **Real social proof numbers** — for Screen 4, do we have actual install / rating numbers yet, or do we ship with placeholders flagged `TODO_REAL_NUMBER` and update before launch? (Hims & Hers-tier credibility means we should not invent numbers.)
3. **Science backing source** — for Screen 5, what specific research / framework do we cite? Options: HRV biofeedback literature, Andrew Huberman protocols, specific clinical studies on box breathing. Pick one we can defend.
4. **Animation budget** — should the blob in Breathe in / out be Skia-driven (smooth, matches `RingStatCard` pattern) or a Lottie file? Headspace uses Lottie; we have Skia already in the repo.
5. **Skip behavior on carousel** — does Skip jump straight to Account (Screen 6), or to a personalization flow we haven't speced yet?


  What to also put back when you build the new flow
  1. useAppGate.ts — re-add the needs_onboarding state. Right now the gate is
   booting | signed_out | ready. You'll want to bring back the fourth state  
  that wires useOnboardingStatusQuery and useCompleteOnboardingMutation    
  together so the navigator knows to show onboarding instead of MainTabs. The
   shape from the old version is the right starting point — just swap the    
  rendered component.                                                    
  2. RootNavigator.tsx — re-add the needs_onboarding branch. One if block
  above the main Stack.Navigator that renders your new onboarding component
  and calls gate.completeOnboarding() on finish.                             
  3. A new component folder. I removed src/components/onboarding/ entirely.
  When you build the new version, put it back at the same path so the import 
  shape is familiar — or use src/components/welcome/ (you already have that  
  folder untracked from earlier).
                                