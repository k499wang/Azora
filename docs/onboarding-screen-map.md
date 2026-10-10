# Onboarding screen map

Current steps from `STEP_ORDER` in `src/components/onboarding/OnboardingFlow.tsx`. The text column shows the visible question or main headline; summaries and plan screens use personalized content. Goal-specific follow-up copy is in [onboarding-intent-follow-ups.md](onboarding-intent-follow-ups.md).

There are **81 defined steps**. `intentReflection` is disabled, leaving 80 normally visible steps. `intentPriority` appears only when at least two goals are chosen, so a single-goal path shows 79 steps. Sections are grouped by topic; the numbers identify positions in the defined runtime order. Visible progress renumbers after skipped steps.

## Azo and introduction

| # | Step | Question or main headline |
|---:|---|---|
| 1 | `azoChatInvite` | Azo sent you a message, tap on it. |
| 2 | `azoChat` | Interactive conversation: your days, Life Reset Plan, and room decorations. |
| 3 | `personalizeIntro` | First, let’s build your personalized Azora plan. |
| 4 | `communityProof` | Join 50,000+ people getting their life back on track |

## Goals

| # | Step | Question or main headline |
|---:|---|---|
| 8 | `intent` | What is taking the most from you right now? |
| 9 | `intentPriority` | Which one is making life hardest right now? *(two or more goals only)* |
| 10 | `intentReflection` | Goal-specific reflection *(currently disabled)* |
| 11 | `intentDepth1` | Goal-specific question 1: where it shows up |
| 12 | `intentDepth2` | Goal-specific question 2: what has been tried |
| 13 | `intentDepth3` | Goal-specific question 3: what is at stake |
| 14 | `piecesTogether` | Azora puts all the pieces together. |
| 15 | `analyzeIntent` | Personalized goal summary |
| 16 | `goalProof` | Azora users are 2× more likely to reach the goal they set |

## Your name

| # | Step | Question or main headline |
|---:|---|---|
| 17 | `name` | Thanks for helping me out! Now, what should I call you? |
| 18 | `greeting` | Hey, {name}. |

## Daily life

| # | Step | Question or main headline |
|---:|---|---|
| 19 | `dayActivity` | What part of daily life feels hardest right now? |
| 20 | `routineHappiness` | Do you feel on top of daily life right now? |
| 21 | `fallingBehind` | How often do you feel like you’re falling behind, no matter what you do? |
| 22 | `beforeAfter` | Azora helps you become the best version of yourself. *(before/after comparison)* |
| 23 | `choresOverwhelm` | How often do you feel overwhelmed by your day-to-day chores? |
| 24 | `distraction` | How easily distracted are you? |
| 25 | `scrollInstead` | Do you often end up scrolling instead of doing what you planned? |
| 26 | `socialMedia` | How much time do you spend on social media? |
| 27 | `procrastinationArea` | What are you avoiding most right now? |
| 28 | `procrastinationReason` | What makes it hard to begin? |
| 29 | `analyzeDays` | Personalized daily life summary |
| 30 | `habitsFocusInsight` | Build Habits More Easily with Behavioural Science |
| 31 | `putOffGuilt` | Do you feel guilty when you put things off? |
| 32 | `habitsFocusScience1` | You are not lazy. Your brain is protecting you. |
| 33 | `habitsFocusScience2` | What feels like laziness is often your brain trying to protect you from uncertainty, effort, or emotional risk. |
| 34 | `habitsFocusScience3` | Azora uses CBT to help you follow through one step at a time. |
| 5 | `scienceCredibility` | {Greeting} in good hands. |
| 36 | `halfway` | Halfway to your results! |

## Sleep

| # | Step | Question or main headline |
|---:|---|---|
| 37 | `sleep` | How rested do you feel most mornings? |
| 38 | `sleepDuration` | How has sleep been lately? |
| 39 | `wakeEase` | How do mornings usually start? |
| 40 | `dayEnergy` | How is your energy during the day? |
| 41 | `sleepCause` | What makes it hardest to switch off at night? |
| 42 | `analyzeSleep` | Personalized sleep summary |
| 43 | `sleepInsight` | 58% of people struggle with quality sleep. |

## About you and your load

| # | Step | Question or main headline |
|---:|---|---|
| 44 | `age` | How old are you? |
| 45 | `gender` | How do you identify? |
| 48 | `stressAwareness` | How well do you understand how your body reacts to stress? |
| 49 | `breathingFamiliarity` | How familiar are you with breathwork? |
| 50 | `heartVariability` | Azora helps your body slow down under stress. |
| 47 | `stressSignal` | When your day feels like too much, what happens first? |
| 46 | `stress` | How stressed have you felt this past week? |
| 51 | `overwhelmResponse` | What do you do when everything feels overwhelming? |
| 52 | `brainFog` | How often do you feel stuck? |
| 53 | `hiddenDrain` | It’s not always obvious what’s draining you. |
| 54 | `childhoodStress` | Did you experience ongoing stress or emotional distance in childhood? |
| 55 | `lifeEvents` | Are you going through any of these? |
| 56 | `supportSystem` | How strong is your support system? |
| 6 | `cbtFamiliarity` | How familiar are you with CBT? |
| 7 | `cbtIntro` | Azora uses a CBT-based plan to help you get unstuck |
| 35 | `routineBrain` | Alongside CBT, we use GST to make your daily routine stick |
| 57 | `mentalHealth` | Have you been diagnosed with any of these? |
| 58 | `analyzeLoad` | Personalized load summary |
| 59 | `homeFeeling` | How do you envision yourself living a better life? |

## Plan setup

| # | Step | Question or main headline |
|---:|---|---|
| 60 | `acquisitionSource` | How did you first hear about Azora? |
| 62 | `expertReview` | Our plans are designed in collaboration with licensed therapists |
| 63 | `dailyTime` | How much time can you give every day? |
| 64 | `wakeTime` | When do you usually wake up? |
| 65 | `sleepTime` | When do you usually go to sleep? |
| 61 | `doctorReferral` | Was Azora recommended to you by a doctor? |
| 66 | `planBoost` | What would make your plan more fun and helpful? |

## Your plan

| # | Step | Question or main headline |
|---:|---|---|
| 67 | `planIntro` | Everything's in. Let's build your plan. |
| 68 | `planLoading` | Plan generation |
| 69 | `diagnosis` | Your Azora personality profile |
| 70 | `recommendedExercise` | Your next chapter starts here |
| 71 | `planDays` | We recommend Azora's {plan} plan for you |
| 72 | `recommendedHabits` | Your Recommended Habits |
| 73 | `habitCurve` | Azora users report feeling 72% better after 20 days. |

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
| 74 | `mochiPlace` | Finish today’s plan. Azo gets his decoration. |
| 75 | `mochiFloor` | Seven completed days finish Azo’s room. |
| 76 | `mochiRooms` | Then choose another room for Azo. |
| 77 | `mochiHouse` | Try to build the biggest house for Azo! |
| 78 | `attPriming` | Make Azora better for you |
| 79 | `notifications` | Want me to check in on you? |
| 80 | `pact` | One small promise to yourself. |
| 81 | `paywall` | Trial and pricing |
