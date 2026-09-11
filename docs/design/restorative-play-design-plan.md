# Restorative Play Design Plan

## Status

Proposed direction. This document defines the research process, visual direction,
system changes, and phased rollout to approve before broad UI implementation.

The detailed rules for the currently implemented system remain in:

- [`../../design.md`](../../design.md)
- [`../card-design-system.md`](../card-design-system.md)
- [`../glass-system.md`](../glass-system.md)
- [`../gamified-scene-design-system.md`](../gamified-scene-design-system.md)
- [`../blob-mascot-spec.md`](../blob-mascot-spec.md)

This plan does not replace those documents yet. It describes how to rationalize
and evolve them without a big-bang redesign.

## Outcome

Azora's target design language is **Restorative Play**:

> The warmth and attachment of a companion game, wrapped around the calm,
> clarity, and credibility expected from a professional wellness product.

Azora should feel playful at the entrances, completions, rewards, and owned
spaces. Breathwork, stress, heart-rate measurement, charts, permissions,
settings, and purchasing should remain quiet, precise, and trustworthy.

The app does not need a generic third-party UI kit. It already has a strong
custom foundation in `src/theme/`, `src/components/common/`, and the existing
design documents. The main work is to make that foundation smaller, enforced,
visually reviewable, and consistently adopted.

## Product Principles

### 1. Calm inside, delight at the seams

Practice and measurement experiences remain focused and low-distraction.
Character reactions and celebration happen before or after the task, never over
a running timer, breathing phase, or sensor reading.

### 2. One screen answers "what now?"

Home presents one visible daily path. Optional exploration stays available but
does not compete with the primary plan.

### 3. Reward participation, never physiology

Azora may reward actions a person controls:

- showing up
- completing a breathing session
- completing a measurement
- following a self-selected routine

Azora must not reward or punish a heart-rate, HRV, stress, breath-hold, or other
physiological outcome. Health data remains honest and is never cosmetically
improved to support a reward narrative.

### 4. Mochi responds to presence, never absence

Mochi can welcome, guide, react, and celebrate. Missing a day must not make him
sick, sad, damaged, disappointed, or deprived. Progress may pause, but the
person's room and earned artifacts never regress.

### 5. Rewards create owned change

Rewards should result in a tangible change to the user's space: a decoration,
room state, collection entry, or visible milestone. Celebration without a
persistent payload becomes noise.

### 6. Professional trust is non-negotiable

Health and subscription surfaces use precise typography, clear sources and
labels, legible terms, predictable controls, and restrained color. The mascot
never provides medical-looking interpretation or false reassurance.

## Research Process

The process is adapted from Mike Monks' Fox Tracks case study. Azora borrows
the method, not Fox Tracks' visual identity.

1. **Context** — frame the actual user and product problem before restyling.
2. **Understand** — review domain evidence, current analytics and feedback,
   record assumptions and biases, and observe the important journeys.
3. **Synthesize** — map findings onto the journey and identify high-value
   opportunities.
4. **Ideate** — create multiple rough directions before committing to polished
   UI.
5. **Focus** — prioritize with an impact/effort/risk lens and narrow the scope
   to a complete emotional arc.
6. **Polish** — establish palette, typography, shape, spatial, illustration,
   and motion rules in a living guide.
7. **Design and build** — iterate with low-fidelity work while change is cheap,
   then implement one verified flow at a time.
8. **Measure** — evaluate behavior, comprehension, accessibility, and trust,
   not aesthetic preference alone.

Reference: [Fox Tracks UX case study](https://www.mikemonks.com/fox-tracks-ux-case-study-mike-monks)

## Reference Products

These products are references for specific mechanics and design disciplines,
not templates to reproduce. Every borrowed idea needs four answers:

1. What user need does it serve?
2. What behavioral or visual principle makes it work?
3. How does that principle translate to Azora's core practice loop?
4. What guardrail prevents it from undermining wellness or measurement trust?

### Finch

#### What works

Finch connects self-care to a companion relationship. Completing a small action
gives the user's bird energy, enables an adventure, strengthens the bond, and
eventually changes the bird or its home. The self-care action stays simple, but
its emotional consequence is visible.

Finch also frames consistency as flexible rather than perfect. Goals can be
small and personal, and missed days do not erase the person's relationship with
their companion.

#### Principles underneath it

**Relatedness.** A companion makes an otherwise solitary habit feel socially
supported. The character is not merely decoration; it acknowledges the person's
effort and gives the action emotional meaning.

**Competence through small wins.** Small, finishable tasks let the person
experience success quickly. The product builds confidence before asking for a
larger commitment.

**Autonomy.** Personal goals and customization make the space feel chosen rather
than prescribed. People are more likely to internalize a routine when they can
shape it around their needs.

**Persistent identity.** The companion and home preserve evidence of past care.
Progress becomes part of an owned world instead of disappearing into a daily
checkmark.

**Emotional feedback instead of abstract points.** A reaction, adventure, or
room change is easier to care about than an unexplained score.

#### Azora translation

- Mochi warmly acknowledges that the person showed up.
- The daily plan remains short, visible, and achievable.
- Completing the full daily plan changes Mochi's room in a persistent way.
- The next tangible room change is previewed before the person starts.
- Extra practice remains optional and does not become a second obligation.
- People may choose relevant practice times, exercise types, sound, haptics,
  and other routine preferences.
- Returning after a break feels like coming home, not repairing damage.

#### What Azora should not take

Finch contains many engagement layers: goals, quests, shops, currencies,
friends, events, outfits, furniture, and collectibles. Each can be motivating,
but together they can make the user manage a game before caring for themselves.

Azora should keep one primary loop. It should not add multiple currencies,
rotating shops, daily quest boards, seasonal scarcity, or several competing
reward tracks. Mochi supports breathwork; breathwork does not become labor for
Mochi's economy.

References:

- [Finch's approach to self-care](https://help.finchcare.com/hc/en-us/articles/37935669335309-Our-Approach-to-Self-Care)
- [Finch new-user guide](https://help.finchcare.com/hc/en-us/articles/42149821015693-New-User-Guide)

### Duolingo

#### What works

Duolingo makes a large product feel coherent through repetition. It uses one
recognizable core color, a controlled secondary palette, consistent rounded
geometry, a defined illustration language, familiar button behavior, and a
small set of recurring feedback patterns.

Its learning loop is also legible: choose the next lesson, complete a bounded
activity, receive immediate feedback, see progress, and occasionally encounter
a larger milestone celebration. The user rarely has to learn a new interaction
model from screen to screen.

#### Principles underneath it

**Cognitive fluency through consistency.** Repeating color roles, shapes,
component states, and illustration rules reduces interpretation work. The
interface feels easy because it behaves like itself everywhere.

**Immediate causal feedback.** Press depth, sound, haptics, character reaction,
and progress changes make cause and effect obvious. A person's action never
feels ignored.

**Progressive challenge.** The next action is bounded and understandable. The
larger journey is visible, but the interface focuses attention on the current
step.

**Graduated emotional intensity.** An ordinary completion receives a small
response. A meaningful milestone receives richer art and motion. This preserves
the significance of celebration and prevents constant spectacle from becoming
background noise.

**Habit flexibility.** Duolingo's streak-protection work recognizes that some
slack can support longer-term persistence. The important lesson for Azora is
not the streak economy; it is that recovery should be easier than giving up.

**Evidence-led iteration.** Duolingo identifies the largest funnel hurdle,
ships a complete first version, measures it, and iterates. Visual polish is tied
to a behavior or comprehension goal rather than preference alone.

#### Azora translation

- Use Azora blue as the recognizable interaction and trust color.
- Restrict secondary hues to stable meanings such as calm, energy, rest, and
  reward.
- Give buttons, cards, sheets, progress, and selection states one predictable
  behavior across the app.
- Make the daily plan a visible path with one clear next action.
- Acknowledge task completion immediately with a check, short motion, or haptic.
- Reserve the larger Mochi reaction and room change for full-plan completion.
- Use one illustration construction language so Mochi, room objects, exercise
  glyphs, and functional icons remain distinct but recognizably related.
- Measure whether a redesign reduces time-to-start, confusion, or abandonment.

#### What Azora should not take

Duolingo can use loss aversion, competition, guilt, and high-energy reminders
because it is optimizing language-learning frequency. Those mechanics can add
stress to a product intended to reduce stress.

Azora should not use threatening notifications, public leagues, wellness XP,
streak wagers, shame-based character reactions, or countdown pressure. A user
must never feel that skipping breathwork has injured Mochi or publicly lowered
their status.

References:

- [Duolingo color system](https://design.duolingo.com/identity/color)
- [Duolingo shape language](https://design.duolingo.com/illustration/shape-language)
- [Duolingo streak flexibility](https://blog.duolingo.com/how-duolingo-streak-builds-habit/)

### Tamagotchi

#### What works

Tamagotchi creates attachment with very little interface. The character
persists over time, responds directly to care, grows into new states, and lives
in a tiny world the player can understand at a glance. Repeated small actions
create a sense of history and relationship.

#### Principles underneath it

**Persistence.** The world continues to feel like the same place across days.
The character is remembered rather than regenerated for each task.

**Direct manipulation.** Touching the character or its environment produces a
clear response. This makes the relationship feel embodied instead of described
through menus.

**Visible evolution.** Growth states and collected objects show time and care
without requiring a detailed analytics screen.

**Anticipation.** A future form, object, or discovery gives the person a reason
to return. The reward is meaningful because it changes something recognizable.

#### Azora translation

- Mochi and the current room remain visually persistent across visits.
- The person can poke Mochi and interact directly with earned room objects.
- A completed day adds a decoration; a completed room becomes part of the
  person's hotel history.
- The next decoration or room milestone can be previewed without using
  artificial scarcity.
- Growth is monotonic: earned objects and completed rooms remain earned.

#### What Azora should not take

Traditional Tamagotchi creates urgency through hunger, sickness, dirt, sadness,
discipline, and death. That makes sense for a virtual-pet toy, but it would turn
wellness into emotional debt.

Azora converts the care metaphor from **"keep the pet alive"** to **"your act of
care leaves the world a little warmer."** Mochi receives positive change when
the user practices, but never suffers when the user does not.

Reference: [Tamagotchi Connection gameplay](https://tamagotchi-official.com/us/series/connection/howto/)

### Fox Tracks

#### What works

Fox Tracks is valuable less as a visual reference than as a process and ethical
companion model. The team moved from a demanding virtual-pet concept toward a
supportive companion after testing whether the original metaphor matched the
needs of people managing chronic discomfort.

The project defined research-driven principles—sustainable support, autonomy,
holistic understanding, and gentleness—then used those principles to decide
which ideas survived. Its style guide evolved alongside real screens instead of
being completed in isolation.

#### Principles underneath it

**Principles before features.** A mechanic survives only if it supports the
desired relationship with the user.

**Adaptive effort.** The product asks for more input when it is useful and
recovers to a lower-effort mode when intensive participation is unnecessary.

**User control.** The user can review and correct system interpretations rather
than being expected to trust automation blindly.

**Gentle representation.** Difficult health experiences are represented in a
way that informs without stigmatizing or dramatizing them.

**Living system documentation.** Palette, typography, spacing, components, and
decisions are documented as the product is designed and tested.

#### Azora translation

- Validate every game mechanic against calm, autonomy, and measurement trust.
- Keep the default daily path light enough to sustain for months.
- Offer deeper history and insight without making analysis mandatory every day.
- Explain measurement limitations and let people repeat or dismiss questionable
  readings.
- Use Mochi to communicate welcome and progress, never medical certainty.
- Update the design system when a real component decision is made.

Reference: [Fox Tracks UX case study](https://www.mikemonks.com/fox-tracks-ux-case-study-mike-monks)

### Headspace as the professional counterweight

#### What works

Headspace demonstrates that a wellness product can be friendly and illustrated
without turning the practice itself into a game. The content remains the center,
sessions reduce visual noise, habits start small, and missed practice is framed
as something to resume rather than a failure.

#### Principles underneath it

**Low arousal during regulation.** A person trying to settle their nervous
system should not have to process constant motion, competing rewards, or dense
navigation.

**Small repeatable routines.** A brief practice tied to a familiar cue is easier
to sustain than an ambitious program that depends on motivation every day.

**Non-judgmental recovery.** Missing one session does not invalidate the habit.
The interface should make tomorrow's return feel normal.

#### Azora translation

- During breathwork, one phase, one instruction, and one primary control own the
  screen.
- Ambient visuals remain slow, predictable, and optional.
- Rewards appear after the nervous-system task has finished.
- Copy uses calm, plain language and never treats a missed day as failure.

References:

- [Headspace on making meditation stick](https://www.headspace.com/articles/5-ways-to-make-meditation-stick)
- [Headspace beginner habit guidance](https://www.headspace.com/meditation/meditation-for-beginners)

### Platform and accessibility systems

Apple Human Interface Guidelines supply the iOS baseline: familiar interaction,
44pt minimum targets, adaptable text, sufficient contrast, semantic health-data
presentation, and respect for Reduce Motion and Reduce Transparency. The
principle is **trust through platform fluency**: people should not need to learn
how an Azora back button, sheet, permission, chart, or destructive action works.

Material 3 supplies Android and cross-platform system discipline: tokenized
color/type/shape/motion, explicit component states, and adaptive behavior. The
principle is **systematic expression**: emotion can come from color, shape, and
motion without sacrificing state clarity or responsiveness. Azora should apply
its brand on top rather than forcing iOS glass or squircle behavior onto Android.

WCAG supplies the cross-platform floor: content remains perceivable and
operable without a specific color, animation, gesture, sound, or haptic. A
playful treatment is successful only when the underlying action stays clear.

References:

- [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Apple chart guidance](https://developer.apple.com/design/human-interface-guidelines/charts)
- [Apple HealthKit design guidance](https://developer.apple.com/design/human-interface-guidelines/healthkit)
- [Material Design 3](https://m3.material.io/)
- [WCAG 2.2 additions](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)

## Unifying Motivational Principles

### Autonomy: "I choose how I care for myself"

Give people meaningful choices without turning every screen into configuration.
Examples include practice time, exercise type, audio, haptics, reminders, and
whether to engage with extra practice. Avoid forced social features, punishment,
and rewards that require a specific physiological outcome.

### Competence: "I can understand and complete this"

Show one bounded next action, honest progress, immediate feedback, and a clear
definition of completion. Difficulty can grow through the person's chosen
practice, but the interface should not manufacture failure to create challenge.

### Relatedness: "I am supported, not judged"

Mochi acknowledges effort and makes the experience feel accompanied. His role is
to welcome, react, and celebrate—not monitor, diagnose, plead, or express
disappointment.

### Meaningful progress: "What I did changed something"

Translate completed practice into a persistent room, garden, collection, or
history change. Prefer one meaningful artifact over points, badges, and currency
that exist only to inflate engagement.

### Immediate feedback: "The app understood my action"

Every press, selection, completion, and placement needs an appropriate visible
response. Use the smallest sufficient combination of visual state, motion,
haptic, and sound.

### Graduated celebration: "This moment feels as important as it is"

- ordinary action: pressed state or selection response
- completed task: check, short transition, light haptic
- completed daily plan: Mochi response and persistent room progress
- room or rare milestone: richer reveal and optional larger celebration

### Restorative recovery: "A break does not erase me"

Progress pauses without decay. Returning emphasizes the available next action,
not the duration of absence. Continuity may be shown as a weekly rhythm or
personal history, but never as a fragile object the user must protect from loss.

### Trust boundary: "Play never edits reality"

Gamification surrounds the measurement workflow but cannot alter its meaning.
Heart rate, HRV, stress, breath-hold results, confidence, errors, and historical
trends use precise data presentation. A completed measurement may advance
participation progress; the measured value may not.

## The Intended Azora Loop

```text
Open Azora
  -> See Mochi, the room, and one clear daily plan
  -> Start the next recommended practice
  -> Complete a calm, low-distraction session
  -> Receive immediate acknowledgement
  -> Finish the daily plan
  -> Choose or reveal one decoration
  -> See the room permanently change
  -> Preview tomorrow's possible progress
```

Each reference product contributes one part:

- **Finch:** the action-to-companion emotional connection
- **Duolingo:** system consistency, clear next step, and feedback cadence
- **Tamagotchi:** persistent character, direct interaction, and visible growth
- **Fox Tracks:** research-led principles and a gentle companion relationship
- **Headspace:** calm practice, small routines, and non-judgmental recovery
- **Apple/Material/WCAG:** professional interaction, platform fit, and access

The combination is deliberately narrower than any one reference. Azora is a
breathwork and wellness product with a companion layer, not a general life game.

## The Three Visual Layers

### Functional layer

Used for navigation, forms, permissions, settings, history, sheets, paywalls,
and general controls.

- quiet canvas and white content surfaces
- graphite text
- one clear primary action color
- restrained, neutral depth
- predictable native interaction
- minimal decorative illustration

### Practice and health layer

Used for breathwork sessions, heart-rate capture, HRV, stress, charts, and
results.

- immersive and low-chrome during practice
- tabular numerals and stable layouts
- exact values and plain-language context
- clear error, unavailable, and low-confidence states
- accessible charts that do not rely on color alone
- no celebration around a concerning measurement

### Companion and reward layer

Used for Mochi, rooms, collections, completions, and meaningful milestones.

- expressive character reactions
- stronger but controlled color
- tactile motion and haptics
- persistent owned change after rewards
- illustration that follows one documented construction language

## Color Direction

Use an approximate **70/20/10** visual balance:

- 70% neutral canvas and white surfaces
- 20% Azora blue for trust and primary interaction
- 10% playful category, companion, and reward accents

Color roles:

| Role | Color family | Primary use |
| --- | --- | --- |
| Trust and action | Blue | Primary CTA, navigation, due/available state |
| Calm | Teal | Breathing, calm exercises, restorative progress |
| Reward | Amber | Earned rewards, continuity, milestone accents |
| Energy | Coral | Energizing exercise and intentional attention |
| Rest and insight | Violet | Sleep and selected insight moments |
| Warmth | Blush | Emotional and character-led moments |
| Success | Green | Completion and verified success only |
| Error | Red | Errors and destructive consequences only |

The existing palette should be retained where it already satisfies these roles.
Exact colors change only after contrast and cross-platform validation. Playful
colors do not become generic decoration, and a color never communicates
important state without text, icon, or shape support.

## Typography, Shape, and Motion

### Typography

- Keep Outfit as the app family.
- Reduce normal UI to clear screen-title, section-title, body, label, and stat
  roles.
- Keep tabular numerals for timers and measurements.
- Phase in role-based, capped system text scaling; the current global
  `allowFontScaling={false}` behavior should not be flipped without testing each
  affected layout.
- Reserve heavier or expressive type for short reward and character moments.

### Shape

- Use the existing radius scale rather than local values.
- Standard content cards use the card radius.
- Hero and companion surfaces use the hero radius.
- Full pills are reserved for true chips, avatars, and pill buttons.
- Glass remains chrome or overlay material, not the default content-card style.

### Motion and haptics

- Motion communicates cause, progress, selection, and earned change.
- Daily feedback is short and quiet; weekly rewards are more visible; rare
  milestones receive the largest celebration.
- Repeated actions must never wait for decorative animation.
- Respect Reduce Motion, Reduce Transparency, and the in-app haptics setting.
- Avoid idle bouncing, constant particles, and animated glass during practice
  or measurement.

## UI Kit Architecture

Keep the current repo-native homes:

- `src/theme/` for palette, semantic roles, typography, spacing, radius,
  motion, interaction, and breakpoints
- `src/components/common/` for stable, app-wide primitives
- feature folders for patterns that belong to a specific flow

Do not move everything to `src/shared/` as part of this work.

### Token tiers

1. **Palette primitives** — raw ramps and controlled brand hues.
2. **Semantic roles** — canvas, content, text, action, status, border, chrome,
   and measured-data roles.
3. **Component usage** — component variants consume semantic roles rather than
   selecting raw colors.

Compatibility aliases can support incremental migration. Avoid rewriting every
caller at once.

### Canonical primitives

- Text
- Icon
- Button
- IconButton
- Card/Surface
- Input
- Badge/Pill
- ListRow
- Sheet/Dialog
- Progress
- SectionHeader/AppHeader

Feature patterns such as `StatCard`, `DailyTaskCard`, `RewardReveal`, and
`SessionScaffold` remain feature-owned until reuse is proven.

### Known consolidation work

- Move the shared playful-hue type out of guided breathing and into `src/theme/`.
- Clarify the supported usage of `CardSurface`, `GlassSurface`, and `GlassCard`;
  remove orphaned overlap instead of adding another wrapper.
- Extract the duplicated Explore technique/daily-plan color-block card through
  one feature-local component.
- Evolve `Text` backward-compatibly with semantic variants and scaling caps.
- Migrate functional icons toward the custom `Icon` family as touched.
- Replace local UI color, type, radius, motion, and pressed-state values with
  tokens while explicitly allowing illustration and chart geometry.

## UI Lab

Add a development-only Azora UI Lab using the existing dev-route pattern. It
should display every canonical primitive and state:

- default, pressed, selected, disabled, and loading
- error, empty, unavailable, and locked
- short and long copy
- normal and enlarged text
- narrow and short screens
- Reduce Motion and Reduce Transparency
- liquid glass, blur fallback, and solid fallback
- iOS and Android presentation

This is the living, reviewable UI kit. Start here rather than adding Storybook
or another dependency.

## Gamification Contract

### Approved mechanics

- "Mochi noticed you showed up" presence response
- one visible daily plan with optional extra practice beneath it
- each full daily completion advances one owned room or garden artifact
- preview of the next tangible change
- continuity or weekly rhythm that allows grace and avoids zero-reset framing
- subtle daily completion, medium weekly change, rare major unlock
- optional touch interactions with Mochi and the room
- rewards and motion that can be reduced or muted

### Disallowed mechanics

- sad, sick, damaged, or dying companion states caused by absence
- punishment notifications or guilt copy
- public leaderboards and social comparison of wellness data
- loot boxes, random duplicates, rotating scarcity, or seasonal FOMO
- multiple currencies or an economy that overtakes breathwork
- celebration tied to a "good" BPM, HRV, stress, or breath-hold result
- mascot speech that resembles medical advice
- hidden, smoothed, or cosmetically improved measurement values

## Phased Delivery

### Phase 1 — Discovery and journey audit

- capture important screens and all meaningful states
- map Home -> daily -> session -> completion -> room reward
- map heart measurement -> result -> history
- review relevant analytics, feedback, and existing research
- record assumptions separately from evidence
- identify comprehension, trust, hierarchy, and consistency problems
- define success signals before visual changes

Deliverable: findings, journey maps, opportunity map, and confirmed principles.

### Phase 2 — Visual direction

Create two or three style directions applied to the same representative screens:

- Home
- active breathing session
- completion/reward
- heart-rate result

Compare calm, trust, delight, accessibility, effort, and platform fit. Select
one direction before updating broad UI.

Deliverable: approved palette, type, surface, illustration, and motion direction.

### Phase 3 — Foundations and UI kit

- rationalize semantic tokens
- normalize component state and accessibility contracts
- clarify solid, glass, media, and color-block surfaces
- add the UI Lab
- add lightweight enforcement for raw UI values, with explicit illustration
  and chart exceptions

Deliverable: stable internal kit without feature behavior changes.

### Phase 4 — Pilot slices

First, use Explore as the low-risk technical pilot by consolidating its
duplicated color-block card implementation.

Then redesign the core emotional arc as one complete vertical slice:

> Home -> start daily -> session -> completion -> room reward

Begin with low-fidelity flows, test hierarchy and comprehension, then implement
the approved high-fidelity direction.

Deliverable: a coherent product slice that proves both the visual system and the
reward cadence.

### Phase 5 — Flow-by-flow rollout

Suggested order:

1. Explore and Home
2. Heart measurement, results, and history
3. Profile and Settings
4. Onboarding
5. Paywall and special offers

Migrate complete flows and delete replaced styling in the same change. Preserve
navigation, analytics, timers, sensors, subscriptions, and business logic unless
a separately approved behavior change requires otherwise.

### Phase 6 — Validation and cleanup

- WCAG contrast review
- 44pt iOS and 48dp Android target review
- enlarged text and long-copy layouts
- VoiceOver and TalkBack
- Reduce Motion and Reduce Transparency
- short, narrow, and large devices
- iOS and Android visual parity where platform conventions allow it
- release-build 5-10 cycle lifecycle smoke tests for relevant flows
- before/after review of important screen states
- removal of unused font and UI dependencies after build verification

## Measures of Success

Evaluate more than aesthetic preference:

- time to start the recommended practice
- daily-plan completion
- session completion and abandonment
- heart-measurement completion and error rate
- comprehension of health results
- onboarding completion
- reward-to-return behavior
- accessibility defects
- design-system adoption and one-off styling violations

Gamification metrics must be paired with wellbeing and trust guardrails. More
taps are not automatically a better outcome.

## Designer and Coder Workflow

For each implementation slice:

1. The Designer defines the journey, hierarchy, component states, prototype,
   accessibility requirements, and acceptance criteria.
2. The Coder implements only that approved slice, preserves behavior, removes
   the replaced implementation, and runs the relevant checks.
3. The Designer reviews the result in the UI Lab and real flow before rollout
   continues.

Completed flows and decisions are added to the living system as they are made.

## First Implementation Tranche

After direction approval:

1. Update the design workflow and semantic color-role documentation.
2. Add the development-only Azora UI Lab.
3. Move the shared hue type into the theme boundary.
4. Consolidate the duplicated Explore color-block card.
5. Prototype and implement the Home-to-reward pilot flow.

This produces visible value and a reusable foundation without introducing a new
UI dependency or churning behavior-sensitive screens.

## Non-goals

- no ground-up rebrand
- no copying Finch, Duolingo, Tamagotchi, or Fox Tracks visually
- no generic UI framework added by default
- no big-bang folder migration
- no simultaneous redesign of every screen
- no changes to health calculations, timers, navigation, subscriptions, or
  analytics hidden inside visual refactoring

## Research Notes

Health-gamification evidence is mixed. Gamification may support engagement, but
it should be treated as a hypothesis rather than proof of improved wellbeing or
clinical outcomes. Mechanics should support autonomy, competence, and
relatedness, and should be evaluated with user-wellbeing guardrails.

References:

- [Gamification in mental-health apps: systematic review and meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC8669581/)
- [Gamification for health and wellbeing: systematic review](https://pmc.ncbi.nlm.nih.gov/articles/PMC6096297/)
- [Gamification and adherence to web-based mental-health interventions](https://pmc.ncbi.nlm.nih.gov/articles/PMC5014987/)
