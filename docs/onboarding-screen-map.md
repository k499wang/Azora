# Onboarding screen map

Current step order from `STEP_ORDER` in `src/components/onboarding/OnboardingFlow.tsx`. The text column shows the visible question or main headline; summaries and plan screens use personalized content. Goal-specific follow-up copy is in [onboarding-intent-follow-ups.md](onboarding-intent-follow-ups.md).

There are **71 defined steps**. `intentReflection` is disabled, leaving 70 normally visible steps. `intentPriority` appears only when at least two goals are chosen, so a single-goal path shows 69 steps. The numbers below identify positions in the defined order; visible progress renumbers after skipped steps.

## Azo and introduction

| # | Step | Question or main headline |
|---:|---|---|
| 1 | `azoIntro` | This is Azo. |
| 2 | `azoMoved` | He just moved into a new house. |
| 3 | `azoNewRoom` | His room is completely empty. |
| 4 | `azoBusy` | He’s been too busy to unpack. |
| 5 | `azoFresh` | Do you want to help him decorate his house? |
| 6 | `personalizeIntro` | First, let’s build your personalized Azora plan. |
| 7 | `support` | Azora is free to try. |

## Goals

| # | Step | Question or main headline |
|---:|---|---|
| 8 | `intent` | What is taking the most from you right now? |
| 9 | `intentPriority` | Which one is making life hardest right now? *(two or more goals only)* |
| 10 | `intentReflection` | Goal-specific reflection *(currently disabled)* |
| 11 | `intentDepth1` | Goal-specific question 1: where it shows up |
| 12 | `intentDepth2` | Goal-specific question 2: what has been tried |
| 13 | `intentDepth3` | Goal-specific question 3: what is at stake |
| 14 | `analyzeIntent` | Personalized goal summary |
| 15 | `goalProof` | Azora users are 2× more likely to reach the goal they set |

## Your name

| # | Step | Question or main headline |
|---:|---|---|
| 16 | `name` | Thanks for helping me out! Now, what should I call you? |
| 17 | `greeting` | Hey, {name}. |

## Daily life

| # | Step | Question or main headline |
|---:|---|---|
| 18 | `dayActivity` | What part of daily life feels hardest right now? |
| 19 | `routineHappiness` | Do you feel on top of daily life right now? |
| 20 | `beforeAfter` | Azora helps you become the best version of yourself. *(before/after comparison)* |
| 21 | `choresOverwhelm` | How often do you feel overwhelmed by your day-to-day chores? |
| 22 | `distraction` | How easily distracted are you? |
| 23 | `socialMedia` | How much time do you spend on social media? |
| 24 | `procrastinationArea` | What are you avoiding most right now? |
| 25 | `procrastinationReason` | What makes it hard to begin? |
| 26 | `analyzeDays` | Personalized daily life summary |
| 27 | `habitsFocusInsight` | Build Habits More Easily with Behavioural Science |
| 28 | `habitsFocusScience1` | You are not lazy. Your brain is protecting you. |
| 29 | `habitsFocusScience2` | What feels like laziness is often your brain trying to protect you from uncertainty, effort, or emotional risk. |
| 30 | `habitsFocusScience3` | Azora uses brain-based techniques to help you follow through one step at a time. |
| 31 | `consistency` | You have great potential to crush your goal. |
| 32 | `scienceCredibility` | {Greeting} in good hands. |
| 33 | `halfway` | Halfway to your results! |

## Sleep

| # | Step | Question or main headline |
|---:|---|---|
| 34 | `sleep` | How rested do you feel most mornings? |
| 35 | `sleepDuration` | How has sleep been lately? |
| 36 | `wakeEase` | How do mornings usually start? |
| 37 | `dayEnergy` | How is your energy during the day? |
| 38 | `sleepCause` | What makes it hardest to switch off at night? |
| 39 | `analyzeSleep` | Personalized sleep summary |
| 40 | `sleepInsight` | 58% of people struggle with quality sleep. |

## About you and your load

| # | Step | Question or main headline |
|---:|---|---|
| 41 | `age` | How old are you? |
| 42 | `gender` | How do you identify? |
| 43 | `heartVariability` | Azora helps your body slow down under stress. |
| 44 | `stressSignal` | When your day feels like too much, what happens first? |
| 45 | `stress` | How stressed have you felt this past week? |
| 46 | `supportSystem` | How strong is your support system? |
| 47 | `brainFog` | How often do you feel stuck? |
| 48 | `brainScience` | Azora uses CBT techniques to help ADHD brains focus. |
| 49 | `mentalHealth` | Have you been diagnosed with any of these? |
| 50 | `analyzeLoad` | Personalized load summary |
| 51 | `homeFeeling` | How do you want to feel at home? |

## Plan setup

| # | Step | Question or main headline |
|---:|---|---|
| 52 | `acquisitionSource` | How did you first hear about Azora? |
| 53 | `dailyTime` | How much time can you give every day? |
| 54 | `wakeTime` | When do you usually wake up? |
| 55 | `sleepTime` | When do you usually go to sleep? |
| 56 | `doctorReferral` | Was Azora recommended to you by a doctor? |
| 57 | `planBoost` | What would make your plan more fun and helpful? |

## Your plan

| # | Step | Question or main headline |
|---:|---|---|
| 58 | `planIntro` | Your life reset plan is ready. |
| 59 | `planLoading` | Plan generation |
| 60 | `diagnosis` | Your Azora profile |
| 61 | `recommendedExercise` | Your life reset plan |
| 62 | `recommendedHabits` | Your Recommended Habits |
| 63 | `habitCurve` | Azora users report feeling 72% better after 20 days. |

## Commitment and access

| # | Step | Question or main headline |
|---:|---|---|
| 64 | `mochiPlace` | Finish today’s plan. Azo gets his decoration. |
| 65 | `mochiFloor` | Seven completed days finish Azo’s room. |
| 66 | `mochiRooms` | Then choose another room for Azo. |
| 67 | `mochiHouse` | Try to build the biggest house for Azo! |
| 68 | `attPriming` | Make Azora better for you |
| 69 | `notifications` | Want me to check in on you? |
| 70 | `pact` | One small promise to yourself. |
| 71 | `paywall` | Trial and pricing |
