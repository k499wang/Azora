# Onboarding screen map

Current step order from `STEP_ORDER` in `src/components/onboarding/OnboardingFlow.tsx`. The text column shows the visible question or main headline; summaries and plan screens use personalized content. Goal-specific follow-up copy is in [onboarding-intent-follow-ups.md](onboarding-intent-follow-ups.md).

There are **84 defined steps**. `intentReflection` is disabled, leaving 83 normally visible steps. `intentPriority` appears only when at least two goals are chosen, so a single-goal path shows 82 steps. The numbers below identify positions in the defined order; visible progress renumbers after skipped steps.

## Azo and introduction

| # | Step | Question or main headline |
|---:|---|---|
| 1 | `azoIntro` | This is Azo. |
| 2 | `azoMoved` | He just moved into a new house. |
| 3 | `azoNewRoom` | His room is completely empty. |
| 4 | `azoBusy` | He’s been too busy to unpack. |
| 5 | `azoFresh` | Do you want to help him decorate his house? |
| 6 | `azoPlan` | Finish your daily plan to decorate Azo’s room. |
| 7 | `personalizeIntro` | First, let’s build your personalized Azora plan. |
| 8 | `communityProof` | Join 50,000+ people getting their life back on track |

## Goals

| # | Step | Question or main headline |
|---:|---|---|
| 9 | `intent` | What is taking the most from you right now? |
| 10 | `intentPriority` | Which one is making life hardest right now? *(two or more goals only)* |
| 11 | `intentReflection` | Goal-specific reflection *(currently disabled)* |
| 12 | `intentDepth1` | Goal-specific question 1: where it shows up |
| 13 | `intentDepth2` | Goal-specific question 2: what has been tried |
| 14 | `intentDepth3` | Goal-specific question 3: what is at stake |
| 15 | `piecesTogether` | Azora puts all the pieces together. |
| 16 | `analyzeIntent` | Personalized goal summary |
| 17 | `goalProof` | Azora users are 2× more likely to reach the goal they set |

## Your name

| # | Step | Question or main headline |
|---:|---|---|
| 18 | `name` | Thanks for helping me out! Now, what should I call you? |
| 19 | `greeting` | Hey, {name}. |

## Daily life

| # | Step | Question or main headline |
|---:|---|---|
| 20 | `dayActivity` | What part of daily life feels hardest right now? |
| 21 | `routineHappiness` | Do you feel on top of daily life right now? |
| 22 | `fallingBehind` | How often do you feel like you’re falling behind, no matter what you do? |
| 23 | `beforeAfter` | Azora helps you become the best version of yourself. *(before/after comparison)* |
| 24 | `choresOverwhelm` | How often do you feel overwhelmed by your day-to-day chores? |
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
| 35 | `habitsFocusScience3` | Azora uses brain-based techniques to help you follow through one step at a time. |
| 36 | `scienceCredibility` | {Greeting} in good hands. |
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
| 47 | `stressAwareness` | How well do you understand how your body reacts to stress? |
| 48 | `breathingFamiliarity` | How familiar are you with breathwork? |
| 49 | `heartVariability` | Azora helps your body slow down under stress. |
| 50 | `stressSignal` | When your day feels like too much, what happens first? |
| 51 | `stress` | How stressed have you felt this past week? |
| 52 | `overwhelmResponse` | What do you do when everything feels overwhelming? |
| 53 | `brainFog` | How often do you feel stuck? |
| 54 | `hiddenDrain` | It’s not always obvious what’s draining you. |
| 55 | `childhoodStress` | Did you experience ongoing stress or emotional distance in childhood? |
| 56 | `lifeEvents` | Are you going through any of these? |
| 57 | `supportSystem` | How strong is your support system? |
| 58 | `cbtFamiliarity` | How familiar are you with CBT? |
| 59 | `brainScience` | Azora uses CBT techniques to help ADHD brains focus. |
| 60 | `mentalHealth` | Have you been diagnosed with any of these? |
| 61 | `analyzeLoad` | Personalized load summary |
| 62 | `homeFeeling` | How do you envision yourself living a better life? |

## Plan setup

| # | Step | Question or main headline |
|---:|---|---|
| 63 | `acquisitionSource` | How did you first hear about Azora? |
| 64 | `expertReview` | Our plans are designed in collaboration with licensed therapists |
| 65 | `dailyTime` | How much time can you give every day? |
| 66 | `wakeTime` | When do you usually wake up? |
| 67 | `sleepTime` | When do you usually go to sleep? |
| 68 | `doctorReferral` | Was Azora recommended to you by a doctor? |
| 69 | `planBoost` | What would make your plan more fun and helpful? |

## Your plan

| # | Step | Question or main headline |
|---:|---|---|
| 70 | `planIntro` | Everything's in. Let's build your plan. |
| 71 | `planLoading` | Plan generation |
| 72 | `diagnosis` | Here's where you are today |
| 73 | `recommendedExercise` | Here's where you'll be after your plan |
| 74 | `planDays` | Your next N days |
| 75 | `recommendedHabits` | Your Recommended Habits |
| 76 | `habitCurve` | Azora users report feeling 72% better after 20 days. |

## Commitment and access

| # | Step | Question or main headline |
|---:|---|---|
| 77 | `mochiPlace` | Finish today’s plan. Azo gets his decoration. |
| 78 | `mochiFloor` | Seven completed days finish Azo’s room. |
| 79 | `mochiRooms` | Then choose another room for Azo. |
| 80 | `mochiHouse` | Try to build the biggest house for Azo! |
| 81 | `attPriming` | Make Azora better for you |
| 82 | `notifications` | Want me to check in on you? |
| 83 | `pact` | One small promise to yourself. |
| 84 | `paywall` | Trial and pricing |
