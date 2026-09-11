# Azora Design System

This file is the source of truth for how Azora looks, moves, and feels. It exists
so that every screen — today's and every future one — reads as **one product**:
calm, cute, rewarding, and trustworthy.

Azora is a consumer wellness product with a strong playful brand layered on top
of excellent native iOS fundamentals. It is **not** a generic SaaS template, and
it is **not** stock Apple UI. The design discipline lives in the foundation; the
personality lives in controlled, deliberate moments.

All future UI work **must** first reuse the existing Azora design tokens and
shared components. Do not introduce arbitrary typography, colors, spacing,
radii, shadows, icon systems, interaction patterns, or animations unless the
underlying design system is intentionally being extended.

Before creating a new component, check whether an existing Azora component can
be reused or extended.

---

## Design principles

The numbered sections below are the **system** — the tokens, components, and
rules you reach for while building. These five are the **principles**: what to
do when two good options conflict and the system doesn't decide for you. When a
review note says "I don't know, it just feels off," it is almost always one of
these.

### 1. Calm inside, celebration at the seams

Calm owns the inside of a practice — the breath, the hold, the measurement.
Delight owns the edges: starting, finishing, unlocking, reaching a milestone.

Never interrupt a session with delight; always pay out after it. A reveal
during a hold is a bug even when it's beautiful. This is why §16 lets breathing
break normal UI constraints while §13 scales celebration to emotional
importance — the same rule seen from both ends.

Rules out: reward animation over a running timer, motion that delays a tap,
ambient sparkle on a resting screen.

### 2. One screen answers "what now?"

Home's job is to end the question, not open it. Today's plan is the answer —
the dailies, with nothing competing for the same attention. Extra practice
stays reachable and never equal.

The failure mode is well documented on both sides: Finch's quest board draws
consistent criticism for decision fatigue, and Headspace's counter is one
recommended session, one tap. Azora sits between them and stays closer to
Headspace here.

Rules out: ten equal tiles, a second CTA carrying the same weight as the
primary, a browsable shelf above the plan.

### 3. The blob is glad you came, never hurt that you left

The companion is a real relationship, and that relationship is the engine —
care is a better motivator than performance because it asks for warmth instead
of discipline. But it reacts only to presence. Showing up delights it. Absence
changes nothing about how it looks.

No sad mascot, no dying streak, no wilting room used as a lever. The pull to
return is that coming back feels good, never that staying away is punished.

Rules out: neglect states, decay mechanics, guilt or loss framing in copy.

### 4. Numbers never flatter

**This one is absolute.** It outranks every other principle here and any growth
argument.

A number Azora shows is the number Azora measured. No smoothing toward a nicer
curve, no invented improvement, no score that only rises, no hiding a decline
because it's discouraging. When the honest reading is worse than yesterday,
show it calmly and plainly.

Cute must never cost perceived accuracy — the subscription rests on the user
believing the readings. §19's tabular numerals are the typographic half of this;
this is the ethical half.

Rules out: cosmetic smoothing, floor-capped scores, estimates presented as
measurements.

### 5. A reward has to change something you own

Celebration without a payload is noise. Every reward moment ends in a visible
change to the user's own space — a new object, a lit corner of the room,
visible progress toward the next one. That payload is what makes principle 1's
celebration land instead of decorate.

Rules out: confetti that leads nowhere, an achievement screen with no artifact,
points with no home.

### When they conflict

**4 is absolute.** The rest rank **1, 2, 3, 5** in that order. A calm interior
beats a tidy home screen; a tidy home screen beats giving the blob more room;
the blob's warmth beats the reward's spectacle.

### Strong defaults

Three further rules hold unless there is a specific, deliberate reason to break
one — and breaking it should be a decision somebody made on purpose, not a
side effect:

- Delight never delays a session (the operational half of principle 1).
- The paywall never uses a dark pattern. Close, price, billing frequency, and
  trial terms stay legible. See §20.
- Notification copy never uses shame or loss (the off-app half of principle 3).

---

## 1. Brand personality

Azora communicates four feelings, in order of priority:

1. **Calm** — the app slows you down. Never shouty, never frantic, never neon.
2. **Cute** — the mascot, the blob, the garden, the room. Warm and endearing.
3. **Rewarding** — progress, streaks, collectibles, and celebration feel earned.
4. **Trustworthy** — premium enough to justify a paid subscription. Numbers are
   credible. Fine print is legible. Price is honest.

The app is **not**: corporate, clinical, generic, SaaS-like, neon,
crypto-like, overly futuristic, childish, extremely minimal, or overloaded with
decoration.

### Two layers

**Layer 1 — Functional UI.** Navigation, buttons, inputs, settings, lists,
modals, sheets, paywalls, form controls, layouts, headers. These must be
extremely consistent, native-feeling, simple, predictable, accessible, and
restrained. This layer is where users develop trust.

**Layer 2 — Emotional / gamified UI.** Mascot interactions, room decoration,
collectibles, daily rewards, progress, streaks, completions, achievements,
unlocks, reward reveals, illustrations, breathing sessions, special onboarding
moments. This layer is allowed to be more colorful, more rounded, animated,
expressive, cute, character-driven, and memorable.

The playful parts feel intentional precisely because the functional parts are
disciplined. 80% consistency + 20% deliberate delight. The 20% shows up only
during emotionally important moments.

---

## 2. Design tokens

All raw design values live in `src/theme/`. Components import from `src/theme`
(ideally the barrel at `src/theme/index.ts`). Developers should rarely type a
raw design value.

| Token file | Contents |
|---|---|
| `src/theme/colors.ts` | Semantic colors + controlled gamification palette |
| `src/theme/typography.ts` | Type scale, weights, families |
| `src/theme/spacing.ts` | 4px spacing scale + screen/card/button/input padding |
| `src/theme/card.ts` | Radius scale + card surface + shadow tokens |
| `src/theme/motion.ts` | Durations, easings, springs, stagger |
| `src/theme/pressable.ts` | Interaction (pressed/disabled) state tokens |
| `src/theme/breakpoints.ts` | Screen-size helpers |

**Rules**

- No raw hex colors inside components unless they are illustration/artwork
  fills (polygon art, plant SVG, chart gradients). If a color is a UI surface,
  it must be a token.
- No arbitrary `fontSize`/`lineHeight`. Spread a typography token; override
  only with another token.
- No arbitrary `borderRadius`. Use the radius scale.
- No arbitrary shadows. Use the shadow scale.
- No hardcoded motion values. Use `duration`, `easing`, `spring`, `stagger`.

---

## 3. Color

Semantic + controlled gamification colors in `src/theme/colors.ts`. Cute,
gamified apps need controlled color — Azora is **not** monochrome minimalism.
But every color must earn its place.

### Foundations

`background.primary` (cool canvas), `background.canvas` (near-white canvas for
color blocks), `background.elevated` (white), `background.card` (white cards),
`background.paper` (warm cream letters), `background.headerTint` (blue header
block), `border.subtle/default/strong`, `overlay.light/dark`.

### Text

`text.primary`, `text.secondary`, `text.tertiary`, `text.inverse`,
`text.brand`. `onBlock.*` is the white-alpha text/divider set used on
`playful.*.base` color blocks.

### Brand

`primary.blue*` is the default brand blue. `playful.*` is the six-hue system —
`teal`, `coral`, `violet`, `amber`, `sky`, `blush` — each with `base`
(saturated fill carrying white text), `soft` (receded/completed tint), and
`ink` (text color on `soft`). These hues are the signature of Azora: dailies,
results, profile tiles, explore shelves, and the room's resident all speak the
same color language.

### States

`success`, `warning`, `error`, `skeleton`. Used for badges, zones, alerts.

### Gamification tokens

Controlled accents only: `yellow`/`orange` for rewards and streaks,
`mood.*` for the mood chips, `roomBlob.*` for the room's resident, `glass.*`
for frosted surfaces, `photoScrim.*` for text over photography, `paywall.*` for
translucent paywall chrome.

**Gradient rules.** Gradients are allowed for reward reveals, major completion
moments, special collectible states, premium hero areas, breathing ambience,
select onboarding backgrounds, and celebration moments. They are **not** used
automatically on buttons, cards, navigation, settings rows, inputs, or generic
containers. Avoid the generic purple→blue AI gradient unless it genuinely
belongs to Azora's brand — Azora's blue is `primary.blue*`, not violet.

---

## 4. Typography

One app-wide family: **Outfit** (loaded via `@expo-google-fonts`), with
`fonts.*` exports in `src/theme/typography.ts`. The weight ceiling is
**SemiBold (600)**. `fonts.heavy` (ExtraBold) is reserved for paywall
headlines only.

Use the scale: `display1–3`, `title1–3`, `heading1–2`, `body.large/medium/
small/xsmall`, `label.large/medium/small/detail`, `button.large/medium/small`,
`input.*`, `caption1–2`, `overline`, and `stat.*`.

- **Stat/display styles already carry `fontVariant: ['tabular-nums']`.**
  Anywhere a changing number is shown (timers, streaks, BPM, HRV, progress,
  counts, scores, prices), use tabular numerals so digits don't shift.
- Body text is light-weight; headings are medium/semibold; bold is used only
  when necessary.

### Branded type exception

A more playful display face **may** be used for major reward screens, mascot
moments, room names, achievement titles, marketing moments, and select
onboarding headlines. It must feel intentional and rare. Never use playful
display type for settings, forms, paywall fine print, navigation, or long body
copy. Do not add a font dependency without strong justification.

---

## 5. Spacing

The 4px scale in `src/theme/spacing.ts`: `xs 4 · sm 8 · md 16 · mdPlus 20 ·
lg 24 · xl 32 · 2xl 40 · 3xl 48 · 4xl 56 · 5xl 64 · 6xl 80 · 7xl 96`.

Screen margin is `padding.screen.horizontal` (18) and `padding.screen.vertical`
(32). Section gaps use `margin.sectionGap` (40). A section title sits 24pt
above its content (`spacing.lg`). Card padding is `spacing.md`.
Functional layouts stay strongly aligned; asymmetry is reserved for intentional
illustration compositions.

---

## 6. Radius & shape

The radius scale in `src/theme/card.ts`:

| Token | Value | Use |
|---|---|---|
| `radius.xs` | 8 | tiny chips, skeleton blocks |
| `radius.small` | 10 | paper, small cells |
| `radius.medium` | 12 | inputs, utility controls |
| `radius.card` | 16 | standard cards, grouped cells |
| `radius.large` (alias `hero`) | 20 | color-block heroes, glass panes |
| `radius.sheet` | 24 | large sheets / modals |
| `radius.xl` | 28 | reward cards, mascot bubbles, gamified surfaces |
| `radius.full` | 999 | pills, avatars, circular controls |

No arbitrary radii outside the scale. On iOS, use `borderCurve: 'continuous'`
(the squircle) on every large rounded surface — cards, blocks, sheets, buttons
with `borderRadius` ≤ ~28. Pills (`radius.full`) don't need it.

---

## 7. Cards, surfaces & shadows

`src/theme/card.ts` defines `card.base` (borderless white surface), `card.paper`
(warm cream letter), `card.block` + `card.blockShadow` (playful color block with
diffuse depth), `card.well` (panel inset into a block), `card.glass` +
`card.glassTint`, and the shadow scale: `shadow`, `shadowElevated`,
`trayShadow`, plus `shadowModal`/`shadowReward` for floating layers.

- Cards communicate interactivity, grouping, reward, selection, or hierarchy.
  Prefer whitespace for simple structural separation. Azora intentionally uses
  soft rounded cards more often than a productivity app, but keep them
  coherent: one card white, one radius family, one shadow family.
- Avoid cards-inside-cards, random borders, random shadows, and a different
  background color per card.
- Shadows are colorless and restrained. Gamified/reward surfaces may carry a
  little more dimensionality, but there is exactly one `blockShadow` treatment.

---

## 8. Buttons

Shared components in `src/components/common/`:

- **`ChunkyButton`** — the full-width primary/secondary CTA. Solid face resting
  on a darker lip; pressing physically drops the face 4pt. Shapes `pill`
  (onboarding/paywall) and `card` (in-app). Supports default, pressed,
  disabled, loading, icons, and haptics (`medium`/`tap`/`none`). Tones:
  `CHUNKY_TONE` (blue) and `CHUNKY_TONE_QUIET` (white/blue for the lesser of two
  stacked buttons).
- **`GlassIconButton`** — round frosted icon control (36pt, Apple-style).
- **`OnboardingPrimaryButton`** — thin wrapper over `ChunkyButton` for the
  onboarding/paywall CTA.
- **`ProUpgradeButton`**, **`SessionGlassButton`**, **`BreatheButton`** —
  domain-specific; keep their APIs stable.

Rules:

- Primary CTAs are visually obvious and live in consistent places during
  onboarding, paywall, the daily flow, breathing setup, and the reward flow.
- Do not hand-roll a new button where `ChunkyButton` (or a wrapper) fits.
- Every interactive element needs a visible pressed state (see §12) and
  appropriate haptics (see §13).

---

## 9. Interaction states

Centralized in `src/theme/pressable.ts`:

- `pressable.surface` — cards: dim (opacity 0.75), no scale.
- `pressable.control` — icon buttons, avatars, streak pills: dim + shrink
  (opacity 0.8, scale 0.96).
- `pressable.subtle` — banners, tertiary actions: gentle dim + shrink
  (opacity 0.88, scale 0.98).
- `pressable.disabled` — opacity 0.5.

Every interactive element reacts visibly (scale, opacity, background, or
animation). A dead interface feels unfinished — but don't animate everything.
Use motion when it communicates selection, completion, progress, reward,
navigation, or cause and effect.

---

## 10. Haptics

Centralized in `src/native/tapHaptics.ts` (all guarded by the in-app Haptics
toggle):

- `triggerTapHaptic()` — selection; cards, list rows, chips.
- `triggerMediumHaptic()` — commitment; full-width primary actions.
- `triggerBounceHaptic()` — playful double-bump (room blob pokes).
- `triggerSuccessHaptic()` — celebration; completions, rewards, unlocks.
- `triggerHeavyHaptic()` — milestone impact.

Meaningful moments: completing today's plan, finishing a breathing session,
claiming a reward, unlocking an item, decorating a room, completing a daily,
hitting a streak milestone, selecting the primary plan option, important
success confirmations. **Do not** haptic every normal navigation tap. Never
call `expo-haptics` directly from a component — go through the helpers so the
user's toggle is always respected.

---

## 11. Motion

Tokens in `src/theme/motion.ts`: `duration.fast/base/slow/slower/fill`, easings
(`enter/exit/gravity/settle/burst`), springs (`pop/bounce/settle`), `stagger`,
and `travel`. Use them instead of raw numbers.

Motion should feel soft, bouncy where appropriate, responsive, calm, and
delightful. Use it for mascot reactions, breathing guidance, reward reveals,
item unlocks, progress filling, completion states, room decorations, button
feedback, and streak milestones.

Avoid constant motion, distracting loops, long transitions, excessive particles,
and animation that slows basic actions. Users should feel rewarded, never
delayed.

---

## 12. Mascot & character system

The room's resident (`RoomBlob`) and the exercise companion (`BlobCharacter`,
`BreathingCompanion`) are real design-system elements.

Rules:

- Standard sizes live with each component; the companion is typically 112–132pt
  for result/celebration moments, larger (190pt) in the room.
- Expressions map to states: `calm`, `happy`, `sad`, `angry`, `anxious`,
  `tired`, `energy` (via `breathFaces`).
- The mascot communicates encouragement, emotion, progress, celebration, and
  guidance — it is **not** decoration. Use it in empty states, success states,
  onboarding check-ins, daily check-ins, and reward moments.
- Do not randomly drop the mascot everywhere. One consistent illustration
  style; the blob body color follows the surrounding hue block's `soft`/`ink`.

---

## 13. Gamification hierarchy

Visual intensity must scale with emotional importance. Do not make every action
feel like a jackpot.

| State | Treatment |
|---|---|
| Everyday | Calm, functional, hue-blocked tiles |
| Progress | Bars, rings, streak pills, "next reward" hints |
| Completion | Success haptic, check ring, soft bloom |
| Reward | Reveal animation, sparkle, `shadowReward` depth |
| Rare/special | Confetti/celebration overlay, bigger reveal, extra motion |

The same action appearing daily should feel *satisfying* but not *overwhelming*;
a first unlock or a streak milestone may get the full celebration.

---

## 14. Room / decoration system

The room is a major retention surface: **"this is MY space and I want to come
back tomorrow."** The loop is:

**Open app → see today's goal → complete it → satisfying feedback → progress
toward reward → room/collection visibly changes → reason to return tomorrow.**

- Make ownership obvious: item placement, locked vs unlocked vs selected,
  inventory, and progress toward the next item.
- Favor direct visual interaction (poke the blob, tap empty slots) over
  settings-style menus.
- Reward completion must connect visibly to the room/decorating loop — the
  `DailyCompleteSheet` → decoration reveal → next-day countdown chain is the
  canonical path. Don't hide it behind generic menus.

---

## 15. Daily plan / home

The home screen makes the next action obvious. Hierarchy:

1. What should I do today? (the daily tasks)
2. How much progress have I made? (room progress card)
3. What reward am I working toward? (room/garden visible change)
4. What happened because I completed it?

Do not present ten equal options. The `HomeRoom` hero + `RoomProgressCard` +
`TodaysDailiesSection` + `ExtraPracticeSection` order is the contract; keep the
color-blocked playful hue tiles as the dominant daily language.

---

## 16. Breathing experience

Breathing sessions are immersive and may intentionally break normal UI
constraints: larger visuals, ambient gradients (per-phase `BreathBackdrop`),
full-screen composition, reduced chrome, strong focus, character breathing
guides. But:

- Controls stay understandable; exit/pause are always accessible.
- Text stays readable; safe areas respected; session state obvious.
- Timers must not jitter — use tabular numerals (`stat`/`display` tokens carry
  this already).
- The dark per-exercise themes in `src/theme/exerciseDarkThemes.ts` are the
  palette; keep session surfaces frosted-glass (`SessionGlassButton`, glass
  HUDs).

---

## 17. Native iOS fundamentals

The playful brand sits on top of native fundamentals:

- **Safe areas.** Respect the notch, Dynamic Island, status bar, and home
  indicator. Use `useSafeAreaInsets`/`SafeAreaView` consistently.
- **Tap targets.** ≥ 44×44pt minimum.
- **Navigation.** Native-feeling stacks, headers, back behavior, tab bars,
  sheets, gestures. No web-style navigation.
- **Scrolling, keyboard, gestures.** Native and predictable; inputs handle the
  keyboard; swipe-back works where supported.
- **`borderCurve: 'continuous'`** on large rounded surfaces.
- **Sheets.** Native bottom-sheet-style interactions where appropriate.

---

## 18. Icons

Two intentional layers:

- **Functional icons** — the custom `Icon` set in
  `src/components/common/icons/` (`Icon.tsx` + `paths.ts`), stroke-based,
  `currentColor`, 24×24 viewBox by default. Simple and consistent.
- **Reward/collectible imagery** — branded, expressive, may be richer (glyphs,
  illustrations, polygon art).

Rules:

- Prefer the custom `Icon` set for functional UI. Do not mix multiple icon
  libraries. If the custom set lacks an icon, add a path to `paths.ts` in the
  same stroke style — do not import a new icon library.
- `Icon` colors must be explicit (default is `colors.text.primary`).
- Third-party brand marks (Google, social) keep their official brand colors and
  live in `paths.ts` as single-purpose entries.

---

## 19. Numbers & stats

Tabular numerals for timers, streaks, heart rate, HRV, progress values,
counters, scores, and reward quantities — digits must not shift while changing.
Stats look clear and credible; cute design never reduces perceived accuracy.
Use `stat.*`/`display.*` tokens which already set `fontVariant: ['tabular-nums']`.

---

## 20. Onboarding & paywall

**Onboarding** should feel emotional, personal, lightweight, and visually
guided. Each screen has one job. Avoid text walls, generic survey UI, endless
card grids, and equal emphasis everywhere. CTA placement is consistent (pinned
footer via `OnboardingScreenLayout`, `OnboardingPrimaryButton`). Build
anticipation toward the personalized plan, product value, emotional payoff, and
paywall.

**Paywall** is polished and trustworthy. Readability and purchase clarity take
priority over decoration. The user immediately understands what they receive,
why it's valuable, price, billing frequency, trial terms, and the CTA.
Hierarchy before decoration — do not make subscription selection feel like a
game. Keep price highly readable, offer hierarchy obvious, fine print clear,
restore purchases available, and close/back behavior correct. Do not break
RevenueCat logic.

---

## 21. Accessibility

Cute does not mean inaccessible:

- Contrast: text and surfaces pass AA where feasible.
- Tap targets ≥ 44×44pt.
- Text scaling: the app fixes font scaling (`allowFontScaling={false}` in
  `Text.tsx`) — keep copy short and legible rather than relying on scaling.
- Meaningful accessibility labels and roles on all interactive elements.
- Don't rely on color or animation alone to communicate state; combine with
  text/icon/shape.
- Respect the Haptics toggle and Reduce-Transparency (the glass system already
  falls back to solid surfaces).

---

## 22. What NOT to do

- Default purple→blue gradients on generic surfaces.
- Generic glowing borders and SaaS dashboard cards.
- A tiny badge above every headline.
- Generic three-feature layouts and excessive pills.
- Random glassmorphism; generic dark-mode neon UI; colored left borders.
- Arbitrary illustrations that don't belong to Azora's brand.
- Every element floating inside its own rounded rectangle.
- Cards inside cards inside cards.
- A different shadow on every component.
- Hand-rolled buttons where `ChunkyButton` fits.
- Direct `expo-haptics` calls outside `src/native/tapHaptics.ts`.
- New icon libraries, new fonts, or new raw design values without extending the
  token system first.

---

## 23. Standard workflow

1. Read this file.
2. Reuse tokens and shared components.
3. Only extend the design system when the change is intentional and benefits
   more than one screen.
4. Verify with `npm run typecheck` and `npm test`.