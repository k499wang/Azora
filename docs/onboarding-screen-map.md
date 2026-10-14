# Onboarding screen map

The active sequence lives in `src/components/onboarding/onboardingStepOrder.ts`.
`OnboardingFlow.tsx` renders the screens and owns side effects; the same sequence
drives Continue, Skip, Back, analytics indices, and visible progress.

Single-goal paths contain **65–66 screens**, including the opening chat, the
plan-build screens, plan reveal, permissions, pact, and paywall. Cleaning
contains **65**; every other goal contains **66**.
New onboarding asks for one goal, so it does not show the priority screen.
Legacy saved profiles retain their goals and resume at the paywall. The chat has
its own authored reply turns; these counts are screen states, not total taps.

## Opening and goal

| Step | Purpose |
|---|---|
| `azoChatInvite` | Open Azo's invitation |
| `azoChat` | Introduce the Life Reset Plan and encouraging companion; Skip in the header jumps to `name` |
| `name` | Optional display name |
| `greeting` | Acknowledge the user |
| `intent` | Choose one answer to “What would you like to focus on right now?” (“Pick whichever feels most important — we’ll start small, and you can change this anytime.”); single selection that replaces the previous pick, with only the chosen row marked — including for a legacy profile carrying several goals |
| `intentPriority` | Compatibility for legacy multi-goal state; fresh selections contain one goal |
| `personalizeIntro` | After the goal choice, acknowledge the first step (“Congrats on taking the first step to change!”) with “You’re on your way to great progress.” |
| `communityProof` | Social proof — join 50,000+ people, with the App Store rating and reviews |
| `intentDepth1`–`intentDepth3` | Goal-specific context, barriers/previous attempts, and desired change |
| `intentDepth4`–`intentDepth6` | Cleaning-only living situation, current space, and tidying difficulty |
| `goalProof` | Original goal-specific “2× better/faster with Azora” comparison, after the final intent question; for the primary sleep goal, after the early sleep assessment |
Exact goal follow-up copy remains in
[onboarding-intent-follow-ups.md](onboarding-intent-follow-ups.md).

## Daily life and habits

Every goal follows this shared section after its goal-specific follow-ups and
the `goalProof` comparison:

| Steps | Context |
|---|---|
| `routineHappiness`, `fallingBehind` | What daily life feels like |
| `homeFeeling` | How they picture living a better life, setting up the before/after pause |
| `beforeAfter` | Original illustrated before/after pause |
| `lifestyleHappiness` | “How happy are you with your current lifestyle?” — single select |
| `habitMotivation` | “What motivates you to build good habits?” — multi-select; analytics records which answers |
| `greatDaysChart` | “Azora builds long-term habits that stick” — the old heart-rate chart repurposed: an illustrative happiness curve with 5, 14 and 30 days labelled under the x axis against a flat “Without new habits” line, citing Lally et al. (2010) |
| `choresOverwhelm` | Tasks piling up |
| `scrollInstead`, `socialMedia` | Phone use |
| `procrastinationArea`, `procrastinationReason` | Tasks being avoided and barriers to starting |
| `putOffGuilt` | How putting things off feels |
| `distraction` | How easily distracted they are, leading into the brain-science block |
| `habitsFocusInsight` | Behavioural-science statistics under the enlarged, exact supplied illustration bundled as `assets/onboarding/behavioural-science-brain.png`, including “Limbic brain” / “Neocortex” labels and arrows (`BrainRegionsIllustration`), opening the brain-science block |
| `habitsFocusScience1`–`habitsFocusScience3` | Original three consecutive animated messages about laziness, protection, and brain-based techniques |
| `halfway` | Original Azo pause before the remaining context and plan settings |

This section retains the original copy and cleaning-specific omissions, with the
simulated analysis removed and `habitsFocusInsight` moved to open the brain-science
block instead of splitting the two procrastination questions.
Cleaning skips `choresOverwhelm`, `procrastinationArea`, `procrastinationReason`,
and `putOffGuilt`, which its goal-specific questions replaced. Other goals show
all ten original questions. The insight screen sits at the head of the
brain-science block: it follows `putOffGuilt`, or `socialMedia` for cleaning, and
hands straight to `habitsFocusScience1` in both directions.
Answers remain available when going Back. Chore overwhelm, daily-life, and
procrastination answers can refine the starter habits; the other shared questions
retain their existing analytics without introducing new program-selection rules.

## Sleep and load assessment

For the primary sleep goal, the early section groups its follow-ups with sleep
questions: `intentDepth1 → sleepDuration → sleepTime → wakeTime → sleep → wakeEase
→ sleepCause → intentDepth2 → dayEnergy → intentDepth3 → sleepInsight → goalProof`.
The first follow-up asks which part of sleep is difficult, and `sleepCause`
asks what makes it hard to settle at night. Hours and timing precede morning
restedness and getting up; previous attempts precede daytime energy and the
desired improvement. Bedtime and waking time are not asked again in plan
settings. After the daily-life and habits section, the sleep goal continues at
`age`. `habitsToBreak` remains in its usual position. Other goals run the full
assessment after the daily-life and habits section, in this order:

| Step | Purpose |
|---|---|
| `sleep` | How rested they feel most mornings |
| `sleepDuration` | Sleep hours; sleep-primary copy explicitly asks “How many hours do you usually sleep?” |
| `wakeEase` | How mornings usually start; sleep-primary copy explicitly asks “How easy is it to get out of bed?” |
| `dayEnergy` | How their energy runs during the day |
| `sleepCause` | What makes it hardest to switch off at night; sleep-primary copy asks “What makes it hard to settle at night?” |
| `sleepInsight` | “Sleep is often **the first thing to slip**.” — names the cause without an unsourced statistic, then promises help with winding down |
| `age` | Age band; each band stores its own midpoint |
| `gender` | How the user identifies |
| `stress` | How stressed the past week felt |
| `stressSignal` | What happens first when the day feels like too much |
| `stressAwareness` | How well they understand their body's stress signals |
| `piecesTogether` | Azora naming the whole picture before the plan; subtitle echoes up to two answered details and connects them to the chosen goal, with neutral copy when answers are missing |

Every goal answers each assessment question once; only its placement varies.
The same answers select authored presets, choose starter tasks, establish context, and describe
the plan for every goal. Cleaning's only exclusions are the daily-life questions
it replaces with its own follow-ups. The schema retains nullable historical
fields, and unasked stress/sleep sliders are not persisted as answered defaults.

## You and what you carry

Every goal asks the same four personal questions after the assessment, then the
habit question:

| Step | Purpose |
|---|---|
| `supportSystem` | How strong their support system is |
| `mentalHealth` | Self-reported diagnoses; `none` is exclusive and clears the rest |
| `adhdSupport` | Only when ADHD was picked: “Azora uses science to help people with ADHD”, a dark card with two brain scans (Busy mind → Calmer mind, `assets/onboarding/brain-scan-*.png`) and “Azora can help ADHD” with three benefits drawn with app icons |
| `homeAtmosphere` | “How do you want to feel a few weeks from now?”, asked straight after `mentalHealth`: Calm, Proud, In control, Comfortable, Motivated, a plain multi-select like the other questions |
| `habitsToBreak` | “What habits would you like to break?” — the goal named one last time in habit form. A plain multi-select with no hint line, like the other multi-select questions. The five rows are authored per goal (`data/habitsToBreak.ts`): cleaning reads “Piling up dishes”, “Leaving laundry around”, “Letting clutter grow”, “Skipping cleaning”, “All-or-nothing cleaning”, the other seven pickable goals each have their own set, and anything else gets a neutral set that names no goal |

`mentalHealth` is the only additive question with an exclusive `none`, and its
answers refine the starter plan's "something I enjoy" line. The others are read
for framing and analytics rather than program selection, and `habitsToBreak` is
tracked only.

## The method, last before the plan

The question phase closes on three teaching screens, straight after
`habitsToBreak` and before the plan's own settings:

| Step | Purpose |
|---|---|
| `cbtFamiliarity` | The method arrives once every personal answer is in: “How familiar are you with CBT?”, single select, with a one-line explainer under the question (“CBT stands for cognitive behavioral therapy…”) |
| `cbtIntro` | The CBT chalkboard — “Azora uses a CBT-based plan to help you get unstuck”, the CBT triangle drawn in chalk |
| `routineBrain` | The GST chalkboard — “Alongside CBT, we use GST to make your daily routine stick” — closing the run |

## Build and explain the plan

| Step | Purpose |
|---|---|
| `dailyTime` | Set a realistic time budget |
| `wakeTime` | Set the morning schedule anchor; asked in the early sleep section for the sleep goal |
| `sleepTime` | Set the evening schedule anchor; asked in the early sleep section for the sleep goal |
| `planBoost` | What would make the plan more fun and helpful |
| `planIntro` | “Everything's in. Let's build your plan.” — the celebration before the build |
| `planLoading` | The personalizing build screen — percent, track, and a “We’re setting your transformation” card that checks off five steps: “Defining your goals”, “Making your {goal} plan” (the goal's own noun, e.g. “Making your sleep plan”), “Analyzing your habits”, “Building your daily routine”, “Personalizing your first step” — before the reveal; it runs on its own and Back steps over it. It stops twice to ask: `sessionTime` ("When do the hard moments usually hit?", which moves the plan's own session time) and `followThrough` ("Do you usually finish what you start?", tracked only) |
| `diagnosis` | Original personality profile — “Your Azora personality profile”, naming the person they recognise today (“The Night Spinner”): the pentagon chart and the answer summary, with no summary cards under the chart |
| `planOutcome` | Original plan-promise screen |
| `planPersonalization` | Original personalization screen |
| `recommendedExercise` | Show the plan report — “Here’s where you’ll be after your plan”: the pentagon chart, the plan facts woven into its copy, why the plan fits, and the Harvard research strip closing the card — no summary cards under the chart. Its identity block names who the user becomes (“The Sound Sleeper”), not the plan, whose own nickname stays on the screens about the plan itself |
| `planDays` | Show the authored plan progression |
| `recommendedHabits` | Accept or reject the proposed real-world tasks |
| `habitPicks` | “Any other habits you want to add?” (no subtitle) — multi-select of goal-specific habits the swipe deck did not show; picks are saved to the routine with the kept deck habits |
| `habitCurve` | Intent-specific curve: “Azora users report finding it 72% easier to keep their space tidy after 20 days.” |

The original reveal order is restored: profile → plan promise → personalization
→ plan report → plan days. Back from the profile returns to `planIntro`, skipping the build wait;
Back from the plan report returns to
`planPersonalization`. The original `goalProof` comparison appears earlier,
after the intent questions. The pentagon chart shows today's scores on the
profile and grows the projected aim shape out of them on the plan report
(`showTarget={phase === 'plan'}` over `projectScores(planMindMap.scores)`), and
the intent-specific `habitCurve` proof closes the
reveal after the recommended habits. The plan build is two steps — `planIntro`
then the `planLoading` wait; the older simulated analysis screens
(`analyzeIntent`, `analyzeSleep`, `analyzeLoad`, `analyzeDays`) and `planApproach`
are absent from the active flow. Historical components
remain available in Onboarding Lab.

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
