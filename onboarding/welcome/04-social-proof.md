# Screen 4 — Social proof

## Purpose

Reduce uncertainty before the user is asked to commit. The user has now been told what the app does (Screen 3); this screen tells them other people trust it. Card 2 of 3 in the carousel.

## What the user sees

- Same surface and layout chrome as Screen 3 (carousel container, paging dots ○●○, Continue button, Skip).
- A **headline** stating community size in plain numeric form.
- A **rating row** beneath the headline: five stars filled, the average rating number, and the count of ratings (e.g. `4.9 ★ — 12,400 ratings`).
- A **single short testimonial quote** in a card (uses `card.base` + `card.shadow` from theme), attributed to a first name + age or a first name + city. Not a full name. Not a photo. Photos read as marketing; first-name attribution reads as honest.
- Three paging dots, second one filled.

## Behavior

- Swipe left → Screen 5. Swipe right → Screen 3.
- Tap Continue → Screen 5.
- Tap Skip → Screen 6 (Account).

## Copy

**Headline:**
`Join 500,000+ people breathing better every day.`
*(Number is a placeholder — see open question 2 in README. Do not ship invented numbers.)*

**Rating row:**
`4.9 ★ · 12,400 ratings`
*(Placeholder; pull from real App Store data once available.)*

**Testimonial card (one only):**
> "I've tried four meditation apps. This is the only one I've stuck with — the breath cues are short enough that I actually do them on a workday."
>
> — Maya, 32

CTA label: `Continue`
Skip label: `Skip`

## Why this screen exists

Wellness is a high-trust category. The user is about to be asked for an email and, eventually, biometric data (HRV, heart rate). Before that ask, they need evidence that this is not a fly-by-night app. Number + rating + one human voice is the minimum viable trust stack — more than this gets noisy, less than this feels thin.

## Tips applied

- **Early-stage social proof to reduce uncertainty** — exactly the "secondary welcome screen" position the tip prescribes.
- **Bandwagon effect** — explicit community size.
- **Community size framing to normalize participation** — "Join 500,000+ people" frames the user as joining something, not starting alone.
- **Trust transfer (health-app pattern)** — App Store rating is independent third-party validation.
- **Belonging / social norming** — softens any stigma around seeking mental-health support.

## Tips deliberately *not* applied here

- No science framing yet — Screen 5 owns that. One trust mechanism per card.
- No celebrity / press logos. They feel transactional and break the calm tone. (Reconsider only if we land a genuinely meaningful clinical partnership.)
- No "as featured in" press strip unless we have real placements. Empty press strips are worse than no press strip.

## Implementation hints

- Testimonial card uses `card.base` + `card.shadow`. Do not invent a custom shadow.
- Star icons go in `paths.ts` if not already there — single `star-filled` path, render five times via the `Icon` component.
- Numbers should be defined in a single `onboarding/copy.ts` (or similar) so they're easy to update — flag the file path when the coder picks it up.
- All numbers shipped in the build should be conservative and defensible. If we have 30k users, we say "30,000+", not "tens of thousands."
