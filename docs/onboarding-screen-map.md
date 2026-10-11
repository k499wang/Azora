# Onboarding screen map

Current steps from `STEP_ORDER` in `src/components/onboarding/OnboardingFlow.tsx`. The text column shows the visible question or main headline; summaries and plan screens use personalized content. Goal-specific follow-up copy is in [onboarding-intent-follow-ups.md](onboarding-intent-follow-ups.md).

There are **83 defined steps**. `intentReflection` is disabled. The two extra cleaning questions appear only when cleaning is the primary goal. A single-goal cleaning path has 81 visible steps; other single-goal paths have 79. `intentPriority` adds one visible step when at least two goals are chosen. Sections are grouped by topic; the numbers identify positions in the defined runtime order. Visible progress renumbers after skipped steps.

## Azo and introduction

| # | Step | Question or main headline |
|---:|---|---|
| 1 | `azoChatInvite` | Azo sent you a message, tap on it. |
| 2 | `azoChat` | Interactive conversation: your days, Life Reset Plan, and room decorations. |
| 5 | `personalizeIntro` | First, let’s build your personalized Azora plan. |
| 64 | `communityProof` | Join 50,000+ people getting their life back on track |

## Goals

| # | Step | Question or main headline |
|---:|---|---|
| 6 | `intent` | What is taking the most from you right now? |
| 7 | `intentPriority` | Which one is making life hardest right now? *(two or more goals only)* |
| 8 | `intentReflection` | Goal-specific reflection *(currently disabled)* |
| 9 | `intentDepth1` | Goal-specific question 1: where it shows up |
| 10 | `intentDepth2` | Goal-specific question 2: what has been tried |
| 11 | `intentDepth3` | Goal-specific question 3: what is at stake |
| 12 | `intentDepth4` | What makes it hard for you to clean? *(cleaning primary goal only)* |
| 13 | `intentDepth5` | What's the toughest part about keeping your home tidy? *(cleaning primary goal only)* |
| 14 | `piecesTogether` | Azora puts all the pieces together. |
| 15 | `analyzeIntent` | Personalized goal summary |
| 19 | `goalProof` | Azora users are 2× more likely to reach the goal they set |

## Your name

| # | Step | Question or main headline |
|---:|---|---|
| 3 | `name` | Thanks for helping me out! Now, what should I call you? |
| 4 | `greeting` | Hey, {name}. |

## Daily life

| # | Step | Question or main headline |
|---:|---|---|
| 20 | `dayActivity` | What part of daily life feels hardest right now? |
| 21 | `routineHappiness` | Do you feel on top of daily life right now? |
| 22 | `fallingBehind` | How often do you feel like you’re falling behind, no matter what you do? |
| 23 | `beforeAfter` | Azora helps you become the best version of yourself. *(before/after comparison)* |
| 24 | `choresOverwhelm` | How often do you feel overwhelmed by cleaning tasks? *(cleaning goal)* / How often do you feel overwhelmed by your day-to-day chores? *(other goals)* |
| 25 | `distraction` | How easily distracted are you? |
| 26 | `scrollInstead` | Do you often end up scrolling instead of doing what you planned? |
| 27 | `socialMedia` | How much time do you spend on social media? |
| 28 | `procrastinationArea` | What are you avoiding most right now? |
| 29 | `procrastinationReason` | What makes it hard to begin? |
| 30 | `analyzeDays` | Personalized daily life summary |
| 31 | `habitsFocusInsight` | Build Habits More Easily with Behavioural Science |
| 32 | `putOffGuilt` | Do you feel guilty when you put things off? |
| 33 | `habitsFocusScience1` | You are not lazy. Your brain is protecting you. |
| 34 | `habitsFocusScience2` | What feels like laziness is often your brain trying to protect you from uncertainty, effort, or emotional risk. |
| 35 | `habitsFocusScience3` | Azora uses CBT to help you follow through one step at a time. |
| 16 | `scienceCredibility` | {Greeting} in good hands. |
| 37 | `halfway` | Halfway to your results! |

## Sleep

| # | Step | Question or main headline |
|---:|---|---|
| 38 | `sleep` | How rested do you feel most mornings? |
| 39 | `sleepDuration` | How has sleep been lately? |
| 40 | `wakeEase` | How do mornings usually start? |
| 41 | `dayEnergy` | How is your energy during the day? |
| 42 | `sleepCause` | What makes it hardest to switch off at night? |
| 43 | `analyzeSleep` | Personalized sleep summary |
| 44 | `sleepInsight` | 58% of people struggle with quality sleep. |

## About you and your load

| # | Step | Question or main headline |
|---:|---|---|
| 45 | `age` | How old are you? |
| 46 | `gender` | How do you identify? |
| 49 | `stressAwareness` | How well do you understand how your body reacts to stress? |
| 50 | `breathingFamiliarity` | How familiar are you with breathwork? |
| 51 | `heartVariability` | Azora helps your body slow down under stress. |
| 48 | `stressSignal` | When your day feels like too much, what happens first? |
| 47 | `stress` | How stressed have you felt this past week? |
| 52 | `overwhelmResponse` | What do you do when everything feels overwhelming? |
| 53 | `brainFog` | How often do you feel stuck? |
| 54 | `hiddenDrain` | It’s not always obvious what’s draining you. |
| 55 | `childhoodStress` | Did you experience ongoing stress or emotional distance in childhood? |
| 56 | `lifeEvents` | Are you going through any of these? |
| 57 | `supportSystem` | How strong is your support system? |
| 17 | `cbtFamiliarity` | How familiar are you with CBT? |
| 18 | `cbtIntro` | Azora uses a CBT-based plan to help you get unstuck |
| 36 | `routineBrain` | Alongside CBT, we use GST to make your daily routine stick |
| 58 | `mentalHealth` | Have you been diagnosed with any of these? |
| 59 | `analyzeLoad` | Personalized load summary |
| 60 | `homeFeeling` | How do you envision yourself living a better life? |

## Plan setup

| # | Step | Question or main headline |
|---:|---|---|
| 61 | `acquisitionSource` | How did you first hear about Azora? |
| 63 | `expertReview` | Our plans are designed in collaboration with licensed therapists |
| 65 | `dailyTime` | How much time can you give every day? |
| 66 | `wakeTime` | When do you usually wake up? |
| 67 | `sleepTime` | When do you usually go to sleep? |
| 62 | `doctorReferral` | Was Azora recommended to you by a doctor? |
| 68 | `planBoost` | What would make your plan more fun and helpful? |

## Your plan

| # | Step | Question or main headline |
|---:|---|---|
| 69 | `planIntro` | Everything's in. Let's build your plan. |
| 70 | `planLoading` | Plan generation |
| 71 | `diagnosis` | Your Azora personality profile |
| 72 | `recommendedExercise` | Your next chapter starts here |
| 73 | `planDays` | We recommend Azora's {plan} plan for you |
| 74 | `recommendedHabits` | Your Recommended Habits |
| 75 | `habitCurve` | Azora users report feeling 72% better after 20 days. |

The profile and plan reveal share one mounted `PlanRevealScreen`, keeping the
radar in place between phases. The profile summarizes selected answers under
priority, daily life, rest and energy, focus and stress, and starting difficulties.
The next phase connects the chosen goal and relevant answers to the plan's
guided practices, lessons, and mood check-ins, and closes on a premium Azora Pro
card listing the full plan (duration from the published catalogue), unlimited
exercises, and the full exercise library.
The next step previews the actual first-day exercises.
Copy is built in `src/lib/onboardingReport.ts`; unanswered inputs and duplicate
clauses are omitted rather than inferred or repeated. Compact lipped stat cards,
missed-day reassurance, and the research strip stay inside the report card.

## Commitment and access

| # | Step | Question or main headline |
|---:|---|---|
| 76 | `mochiPlace` | Finish today’s plan. Azo gets his decoration. |
| 77 | `mochiFloor` | Seven completed days finish Azo’s room. |
| 78 | `mochiRooms` | Then choose another room for Azo. |
| 79 | `mochiHouse` | Try to build the biggest house for Azo! |
| 80 | `attPriming` | Make Azora better for you |
| 81 | `notifications` | Want me to check in on you? |
| 82 | `pact` | One small promise to yourself. |
| 83 | `paywall` | Trial and pricing |
