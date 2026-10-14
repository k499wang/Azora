# Onboarding screen map

The active sequence lives in `src/components/onboarding/onboardingStepOrder.ts`.
`OnboardingFlow.tsx` renders the screens and owns side effects; the same sequence
drives Continue, Skip, Back, analytics indices, and visible progress.

Single-goal paths contain **58–59 screens**, including the opening chat, plan
reveal, permissions, pact, and paywall. Cleaning contains **58**; every other
goal contains **59**.
New onboarding asks for one goal, so it does not show the priority screen.
Legacy saved profiles retain their goals and resume at the paywall. The chat has
its own authored reply turns; these counts are screen states, not total taps.

## Opening and goal

| Step | Purpose |
|---|---|
| `azoChatInvite` | Open Azo's invitation |
| `azoChat` | Introduce the Life Reset Plan and encouraging companion |
| `name` | Optional display name |
| `greeting` | Acknowledge the user |
| `intent` | Choose one answer to “What would you like to focus on the most?”; single selection, and only the chosen goal stays highlighted even for a legacy profile carrying several |
| `intentPriority` | Compatibility for legacy multi-goal state; fresh selections contain one goal |
| `personalizeIntro` | After the goal choice, name that goal in the headline — “Congrats on taking the first step to sleep better.” — with “You can change your options anytime in the app.” |
| `communityProof` | Social proof — join 50,000+ people, with the App Store rating and reviews |
| `intentDepth1`–`intentDepth3` | Goal-specific context, barriers/previous attempts, and desired change |
| `intentDepth4`–`intentDepth6` | Cleaning-only living situation, current space, and tidying difficulty |
| `goalProof` | Original goal-specific “2× better/faster with Azora” comparison, after the final intent question |

Exact goal follow-up copy remains in
[onboarding-intent-follow-ups.md](onboarding-intent-follow-ups.md).

## Daily life and habits

Every goal follows this shared section after its goal-specific follow-ups and
the `goalProof` comparison:

| Steps | Context |
|---|---|
| `dayActivity`, `routineHappiness`, `fallingBehind` | What daily life feels like |
| `beforeAfter` | Original illustrated before/after pause |
| `choresOverwhelm`, `distraction` | Tasks piling up and attention |
| `scrollInstead`, `socialMedia` | Phone use |
| `procrastinationArea`, `procrastinationReason` | Tasks being avoided and barriers to starting |
| `habitsFocusInsight` | Original behavioural-science illustration and statistics |
| `putOffGuilt` | How putting things off feels |
| `habitsFocusScience1`–`habitsFocusScience3` | Original three consecutive animated messages about laziness, protection, and CBT |
| `routineBrain` | Original CBT/GST chalkboard explanation |
| `halfway` | Original Azo pause before the remaining context and plan settings |

This section retains the original copy, order, and cleaning-specific omissions,
with the simulated analysis removed.
Cleaning skips `choresOverwhelm`, `procrastinationArea`, `procrastinationReason`,
and `putOffGuilt`, which its goal-specific questions replaced. Other goals show
all ten original questions. The preceding question connects directly to
`habitsFocusInsight` in both directions.
Answers remain available when going Back. Chore overwhelm, daily-life, and
procrastination answers can refine the starter habits; the other shared questions
retain their existing analytics without introducing new program-selection rules.

## Sleep and load assessment

Every goal runs the same assessment after the daily-life and habits section, in
this order:

| Step | Purpose |
|---|---|
| `sleep` | How rested they feel most mornings |
| `sleepDuration` | How sleep has been lately |
| `wakeEase` | How mornings usually start |
| `dayEnergy` | How their energy runs during the day |
| `sleepCause` | What makes it hardest to switch off at night |
| `sleepInsight` | The 58% quality-sleep statistic |
| `age` | Age band; each band stores its own midpoint |
| `gender` | How the user identifies |
| `stress` | How stressed the past week felt |
| `stressSignal` | What happens first when the day feels like too much |
| `stressAwareness` | How well they understand their body's stress signals |
| `piecesTogether` | Azora naming the whole picture before the plan |

The assessment is universal rather than goal-specific, so the same answers
select authored presets, choose starter tasks, establish context, and describe
the plan for every goal. Cleaning's only exclusions are the daily-life questions
it replaces with its own follow-ups. The schema retains nullable historical
fields, and unasked stress/sleep sliders are not persisted as answered defaults.

## You and what you carry

Every goal asks the same three personal questions after the assessment, before
the plan's settings:

| Step | Purpose |
|---|---|
| `supportSystem` | How strong their support system is |
| `mentalHealth` | Self-reported diagnoses; `none` is exclusive and clears the rest |
| `homeFeeling` | How they picture living a better life, for the plan's framing |

`mentalHealth` is the only additive question with an exclusive `none`, and its
answers refine the starter plan's "something I enjoy" line. The others are read
for framing and analytics rather than program selection.

## Build and explain the plan

| Step | Purpose |
|---|---|
| `dailyTime` | Set a realistic time budget |
| `wakeTime` | Set the morning schedule anchor |
| `sleepTime` | Set the evening schedule anchor |
| `planBoost` | What would make the plan more fun and helpful |
| `diagnosis` | Original personality profile with radar, superpower, growth area, and answer summary |
| `planOutcome` | Original plan-promise screen |
| `planPersonalization` | Original personalization screen |
| `recommendedExercise` | Show the plan report with the restored pentagon chart, selected answers, and factual duration/pace |
| `planDays` | Show the authored plan progression |
| `recommendedHabits` | Accept or reject the proposed real-world tasks |

The original reveal order is restored: profile → plan promise → personalization
→ plan report → plan days. Back from the profile returns to `sleepTime`;
Back from the plan report returns to
`planPersonalization`. The original `goalProof` comparison appears earlier,
after the intent questions. The pentagon chart displays the same scores in the
profile and plan report. Simulated analysis/build screens, `planApproach`,
projected radar gains, and the later habit-curve graph are absent from the active
flow. Historical components remain available in Onboarding Lab.

## Access and completion

| Step | Purpose |
|---|---|
| `acquisitionSource` | Record the optional acquisition survey after the plan is visible |
| `doctorReferral` | Whether a doctor recommended Azora, grouped with the other "how you got here" fact |
| `attPriming` | Explain and request tracking permission with existing attribution synchronization |
| `notifications` | Offer reminders for the actual plan schedule |
| `pact` | Save the profile, chosen tasks, schedule, and resolved enrollment |
| `paywall` | Present purchase/restore/free continuation according to the offering |

Existing saved-profile users resume at the paywall. Authentication, enrollment
persistence, subscription access, and terminal completion remain owned by their
existing services and root gate.
