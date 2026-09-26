# Onboarding screen map

Current step order from `STEP_ORDER` in `src/components/onboarding/OnboardingFlow.tsx`. The text column shows the visible question or main headline; summaries and plan screens use personalized content. Goal-specific follow-up copy is in [onboarding-intent-follow-ups.md](onboarding-intent-follow-ups.md).

There are **85 defined steps**. `intentReflection` is disabled, leaving 84 normally visible steps. `intentPriority` appears only when at least two goals are chosen, so a single-goal path shows 83 steps. The numbers below identify positions in the defined order; visible progress renumbers after skipped steps.

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
| 8 | `support` | Azora is free to try. |

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
| 36 | `consistency` | You have great potential to crush your goal. |
| 37 | `scienceCredibility` | {Greeting} in good hands. |
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
| 48 | `stressAwareness` | How well do you understand how your body reacts to stress? |
| 49 | `breathingFamiliarity` | How familiar are you with breathwork? |
| 50 | `heartVariability` | Azora helps your body slow down under stress. |
| 51 | `stressSignal` | When your day feels like too much, what happens first? |
| 52 | `stress` | How stressed have you felt this past week? |
| 53 | `overwhelmResponse` | What do you do when everything feels overwhelming? |
| 54 | `brainFog` | How often do you feel stuck? |
| 55 | `hiddenDrain` | It’s not always obvious what’s draining you. |
| 56 | `childhoodStress` | Did you experience ongoing stress or emotional distance in childhood? |
| 57 | `lifeEvents` | Are you going through any of these? |
| 58 | `supportSystem` | How strong is your support system? |
| 59 | `cbtFamiliarity` | How familiar are you with CBT? |
| 60 | `brainScience` | Azora uses CBT techniques to help ADHD brains focus. |
| 61 | `mentalHealth` | Have you been diagnosed with any of these? |
| 62 | `analyzeLoad` | Personalized load summary |
| 63 | `homeFeeling` | How do you want to feel during your plan? |

## Plan setup

| # | Step | Question or main headline |
|---:|---|---|
| 64 | `acquisitionSource` | How did you first hear about Azora? |
| 65 | `expertReview` | Our plans are designed in collaboration with licensed therapists |
| 66 | `communityProof` | Join 50,000+ people getting their life back on track |
| 67 | `dailyTime` | How much time can you give every day? |
| 68 | `wakeTime` | When do you usually wake up? |
| 69 | `sleepTime` | When do you usually go to sleep? |
| 70 | `doctorReferral` | Was Azora recommended to you by a doctor? |
| 71 | `planBoost` | What would make your plan more fun and helpful? |

## Your plan

| # | Step | Question or main headline |
|---:|---|---|
| 72 | `planIntro` | Your life reset plan is ready. |
| 73 | `planLoading` | Plan generation |
| 74 | `diagnosis` | Your Azora profile |
| 75 | `recommendedExercise` | Your life reset plan |
| 76 | `recommendedHabits` | Your Recommended Habits |
| 77 | `habitCurve` | Azora users report feeling 72% better after 20 days. |

## Commitment and access

| # | Step | Question or main headline |
|---:|---|---|
| 78 | `mochiPlace` | Finish today’s plan. Azo gets his decoration. |
| 79 | `mochiFloor` | Seven completed days finish Azo’s room. |
| 80 | `mochiRooms` | Then choose another room for Azo. |
| 81 | `mochiHouse` | Try to build the biggest house for Azo! |
| 82 | `attPriming` | Make Azora better for you |
| 83 | `notifications` | Want me to check in on you? |
| 84 | `pact` | One small promise to yourself. |
| 85 | `paywall` | Trial and pricing |
