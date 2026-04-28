# Screen 6 — Account / Log in

## Purpose

Convert the trust built across Screens 1–5 into a committed account. This screen ends the welcome flow. After tap, the user is either onboarded with an account or logged into an existing one, and personalization (intent question, goal selection, permissions priming) begins.

## What the user sees

This screen mirrors the third frame of the Headspace reference image you shared — same composition, our content.

- **Top half:** a warm color block (soft orange or our brand warm tone) with a playful illustration cluster centered: phone shape with the orange blob peeking out, surrounded by small floating icons (cloud, music note, sparkle, sun, moon) — the visual language of "everything in one place."
- **Bottom half:** a clean white/cream surface that curves up into the warm block (the Headspace-style organic divider).
- **Headline** centered in the bottom half: short, branded.
- **Subhead** beneath: one line summarizing the offer.
- A **Terms & Conditions checkbox** with linked text, sitting between the subhead and the CTAs.
- **Primary button** — full-width, blue, "Create an account."
- **Secondary button** — full-width, soft cream/neutral, "Log in" — no border, lower visual weight than primary.
- A tiny disclaimer line under the buttons noting payment/data terms only if legally required.

## Behavior

- Primary CTA disabled until the T&C checkbox is checked.
- Tap "Create an account" → account creation flow (email/Apple/Google — out of scope for this spec).
- Tap "Log in" → log-in screen.
- Hardware back / swipe-back returns to Screen 5.

## Copy

**Headline:** `Welcome to Azora`
*(Replace "Azora" with the user-facing brand name once confirmed — open question 1 in README.)*

**Subhead:** `Support for every breath of your day.`
*(Echoes Headspace's "Support for all of life's moments" structurally — short, warm, outcome-shaped — without copying it.)*

**T&C line (with linked text):**
`I agree to Azora's Terms & Conditions and acknowledge the Privacy Policy.`

**Primary CTA:** `Create an account`
**Secondary CTA:** `Log in`

## Why this screen exists

Headspace's reference image puts the account ask third, after only two breath screens. We delay it slightly more (Screens 3–5 build trust first) because the Hims & Hers half of the brief expects more legitimacy-building before personal data is exchanged. By Screen 6, the user has:

1. Felt the product (1, 2)
2. Understood the outcome (3)
3. Seen others trust it (4)
4. Seen the science (5)

That's enough trust capital to reasonably ask for an email.

## Tips applied

- **Early account creation as value exchange** — the account is framed as the thing that lets the app remember and personalize, not as a gate.
- **Commitment escalation** — by this point the user has invested ~30 seconds and one breath cycle; signing up is a small additional step rather than a cold ask.
- **Trust assumption (institutional legitimacy)** — the science screen and social proof screen do the legitimacy work *before* the ask, so this screen can be short.
- **Cognitive load reduction** — only two real choices (Create / Log in) plus the T&C checkbox.
- **Visual brand resolution** — the warm illustration cluster on top is the first time the app's full personality lands on screen, rewarding the user for completing the carousel.

## Tips deliberately *not* applied here

- No "Continue as guest" path. Wellness apps that allow guest mode see dramatically lower retention and we'd lose the ability to save HRV history. Revisit only if data shows account friction is the dominant drop-off.
- No social proof or science repeated here. Repeating it after Screens 4–5 is noise.
- No intent question yet. That's the first screen *after* account creation, when we have a place to actually save the answer.

## What comes next (out of scope, noted for continuity)

After successful account creation:
1. Intent question — `What brings you here?` with multi-select chips (sleep, stress, focus, anxiety, energy).
2. Permissions priming — HealthKit / notifications, framed at the moment of relevance.
3. First-session suggestion based on the intent answer.

These belong in a separate `onboarding/personalization/` folder when we get there.

## Implementation hints

- The curved divider between warm and neutral surfaces is a single SVG path, added to `paths.ts`. Don't try to fake it with border-radius on stacked views — looks wrong on Android.
- T&C linked text uses an inline `Text` with `onPress` opening a modal or external browser, depending on app policy. The Privacy Policy and Terms links should be config-driven, not hard-coded URLs.
- Primary and secondary buttons should be the same component used elsewhere in the app (check `src/components/common/` — likely a `Button` primitive exists). If it doesn't, this is the right moment to introduce one in `common/`, not to inline a Pressable.
- Both buttons get explicit `elevation` (Android) and `shadow*` (iOS) per `card.shadow` token — per `CLAUDE.md` Android readiness rule.
- T&C checkbox state is local; don't pull in form state libraries for one boolean.
