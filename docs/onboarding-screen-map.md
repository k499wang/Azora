# Onboarding screen map

Current steps from `STEP_ORDER` in `src/components/onboarding/OnboardingFlow.tsx`. The text column shows the visible question or main headline; summaries and plan screens use personalized content. Goal-specific follow-up copy is in [onboarding-intent-follow-ups.md](onboarding-intent-follow-ups.md).

There are **80 defined steps**. `intentReflection` is disabled. Cleaning has six goal follow-ups and skips four overlapping daily-life questions. A single-goal cleaning path has 74 visible steps; other single-goal paths have 75. `intentPriority` adds one visible step when at least two goals are chosen. Sections are grouped by topic; the numbers identify positions in the defined runtime order. Visible progress renumbers after skipped steps.

## Azo and introduction

| # | Step | Question or main headline |
|---:|---|---|
| 1 | `azoChatInvite` | Azo sent you a message, tap on it. |
| 2 | `azoChat` | Interactive conversation: your days, Life Reset Plan, and room decorations. |
| 5 | `personalizeIntro` | First, let’s build your personalized Azora plan. |
| 63 | `communityProof` | Join 50,000+ people getting their life back on track |

## Goals

| # | Step | Question or main headline |
|---:|---|---|
| 6 | `intent` | What is taking the most from you right now? |
| 7 | `intentPriority` | Which one is making life hardest right now? *(two or more goals only)* |
| 8 | `intentReflection` | Goal-specific reflection *(currently disabled)* |
| 9 | `intentDepth1` | Goal-specific question 1: where it shows up |
| 10 | `intentDepth2` | Goal-specific question 2: what has been tried / What makes it hard for you to clean? *(cleaning)* |
| 11 | `intentDepth3` | Goal-specific question 3: what is at stake / How is cleaning overwhelm affecting your life? *(cleaning)* |
| 12 | `intentDepth4` | What is your current living situation? *(cleaning primary goal only)* |
| 13 | `intentDepth5` | How clean is your space right now? *(cleaning primary goal only)* |
| 14 | `intentDepth6` | What's the toughest part about keeping your home tidy? *(cleaning primary goal only)* |
| 15 | `piecesTogether` | Azora puts all the pieces together. |
| 16 | `analyzeIntent` | Personalized goal summary |
| 20 | `goalProof` | Intent-specific 2× headline (e.g. “Clean 2× better with Azora than on your own”) |

## Your name

| # | Step | Question or main headline |
|---:|---|---|
| 3 | `name` | Thanks for helping me out! Now, what should I call you? |
| 4 | `greeting` | Hey, {name}. |

## Daily life

| # | Step | Question or main headline |
|---:|---|---|
| 21 | `dayActivity` | What part of daily life feels hardest right now? |
| 22 | `routineHappiness` | Do you feel on top of daily life right now? |
| 23 | `fallingBehind` | How often do you feel like you’re falling behind, no matter what you do? |
| 24 | `beforeAfter` | Azora helps you become the best version of yourself. *(before/after comparison)* |
| 25 | `choresOverwhelm` | How often do you feel overwhelmed by your day-to-day chores? *(skipped for cleaning)* |
| 26 | `distraction` | How easily distracted are you? |
| 27 | `scrollInstead` | Do you often end up scrolling instead of doing what you planned? |
| 28 | `socialMedia` | How much time do you spend on social media? |
| 29 | `procrastinationArea` | What are you avoiding most right now? *(skipped for cleaning)* |
| 30 | `procrastinationReason` | What makes it hard to begin? *(skipped for cleaning)* |
| 31 | `analyzeDays` | Personalized daily life summary |
| 32 | `habitsFocusInsight` | Build Habits More Easily with Behavioural Science |
| 33 | `putOffGuilt` | Do you feel guilty when you put things off? *(skipped for cleaning)* |
| 34 | `habitsFocusScience1` | You are not lazy. Your brain is protecting you. |
| 35 | `habitsFocusScience2` | What feels like laziness is often your brain trying to protect you from uncertainty, effort, or emotional risk. |
| 36 | `habitsFocusScience3` | Azora uses CBT to help you follow through one step at a time. |
| 17 | `scienceCredibility` | {Greeting} in good hands. |
| 38 | `halfway` | Halfway to your results! |

## Sleep

| # | Step | Question or main headline |
|---:|---|---|
| 39 | `sleep` | How rested do you feel most mornings? |
| 40 | `sleepDuration` | How has sleep been lately? |
| 41 | `wakeEase` | How do mornings usually start? |
| 42 | `dayEnergy` | How is your energy during the day? |
| 43 | `sleepCause` | What makes it hardest to switch off at night? |
| 44 | `analyzeSleep` | Personalized sleep summary |
| 45 | `sleepInsight` | 58% of people struggle with quality sleep. |

## About you and your load

| # | Step | Question or main headline |
|---:|---|---|
| 46 | `age` | How old are you? |
| 47 | `gender` | How do you identify? |
| 50 | `stressAwareness` | How well do you understand how your body reacts to stress? |
| 49 | `stressSignal` | When your day feels like too much, what happens first? |
| 48 | `stress` | How stressed have you felt this past week? |
| 51 | `overwhelmResponse` | What do you do when everything feels overwhelming? |
| 52 | `brainFog` | How often do you feel stuck? |
| 53 | `hiddenDrain` | It’s not always obvious what’s draining you. |
| 54 | `childhoodStress` | Did you experience ongoing stress or emotional distance in childhood? |
| 55 | `lifeEvents` | Are you going through any of these? |
| 56 | `supportSystem` | How strong is your support system? |
| 18 | `cbtFamiliarity` | How familiar are you with CBT? |
| 19 | `cbtIntro` | Azora uses a CBT-based plan to help you get unstuck |
| 37 | `routineBrain` | Alongside CBT, we use GST to make your daily routine stick |
| 57 | `mentalHealth` | Have you been diagnosed with any of these? |
| 58 | `analyzeLoad` | Personalized load summary |
| 59 | `homeFeeling` | How do you envision yourself living a better life? |

## Plan setup

| # | Step | Question or main headline |
|---:|---|---|
| 60 | `acquisitionSource` | How did you first hear about Azora? |
| 62 | `expertReview` | Our plans are designed in collaboration with licensed therapists |
| 64 | `dailyTime` | How much time can you give every day? |
| 65 | `wakeTime` | When do you usually wake up? |
| 66 | `sleepTime` | When do you usually go to sleep? |
| 61 | `doctorReferral` | Was Azora recommended to you by a doctor? |
| 67 | `planBoost` | What would make your plan more fun and helpful? |

## Your plan

| # | Step | Question or main headline |
|---:|---|---|
| 68 | `planIntro` | Everything's in. Let's build your plan. |
| 69 | `planLoading` | Plan generation |
| 70 | `diagnosis` | Your Azora personality profile |
| 71 | `planOutcome` | In {plan days} days, you’ll feel {goal-specific outcome}. |
| 72 | `planPersonalization` | A plan built around you. Your goal: {chosen goal}. |
| 73 | `recommendedExercise` | Here’s your personalized plan |
| 74 | `planDays` | We recommend Azora's {plan} plan for you |
| 75 | `recommendedHabits` | Your Recommended Habits |
| 76 | `habitCurve` | Intent-specific reported improvement after 20 days (e.g. “Azora users report finding it 72% easier to keep their space tidy after 20 days.”) |

The profile and the plan report each mount `PlanRevealScreen` on their own,
with the two promise screens read in between, so the radar comes back in its
goal state instead of growing out of today's shape on the same mount. The
profile summarizes selected answers under priority, daily life, rest and energy,
focus and stress, and starting difficulties.
The plan report connects the chosen goal and relevant answers to the plan's
guided practices, lessons, and mood check-ins, and closes on a premium Azora Pro
card listing the full plan (duration from the published catalogue), unlimited
exercises, and the full exercise library.
The plan promise is two screens for every goal: the outcome promise and how the
plan fits the chosen goal. The duration comes from the resolved plan. Each
phase is a single headline and nothing else, mounts fresh for its entrance
animation, honors reduced motion, and has a symmetric Back path; the line pops
in a word at a time, the same entrance the story beats use. No phase draws
Azo.
Both promise screens can be replayed individually in Onboarding Lab.
Cleaning answers still personalize the report’s space condition, living
situation, and starting barriers.
Copy is built in `src/lib/onboardingReport.ts`; unanswered inputs and duplicate
clauses are omitted rather than inferred or repeated. Compact lipped stat cards,
missed-day reassurance, and the research strip stay inside the report card.

## Commitment and access

| # | Step | Question or main headline |
|---:|---|---|
| 77 | `attPriming` | Make Azora better for you |
| 78 | `notifications` | Want me to check in on you? |
| 79 | `pact` | One small promise to yourself. |
| 80 | `paywall` | Trial and pricing |
