# Onboarding screen map

Current step order from `STEP_ORDER` in `src/components/onboarding/OnboardingFlow.tsx`. The text column shows the visible question or main headline; summaries and plan screens use personalized content. Goal-specific follow-up copy is in [onboarding-intent-follow-ups.md](onboarding-intent-follow-ups.md).

There are **74 defined steps**. `intentReflection` is disabled, leaving 73 normally visible steps. `intentPriority` appears only when at least two goals are chosen, so a single-goal path shows 72 steps. The numbers below identify positions in the defined order; visible progress renumbers after skipped steps.

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
| 22 | `beforeAfter` | Azora helps you become the best version of yourself. *(before/after comparison)* |
| 23 | `choresOverwhelm` | How often do you feel overwhelmed by your day-to-day chores? |
| 24 | `distraction` | How easily distracted are you? |
| 25 | `socialMedia` | How much time do you spend on social media? |
| 26 | `procrastinationArea` | What are you avoiding most right now? |
| 27 | `procrastinationReason` | What makes it hard to begin? |
| 28 | `analyzeDays` | Personalized daily life summary |
| 29 | `habitsFocusInsight` | Build Habits More Easily with Behavioural Science |
| 30 | `habitsFocusScience1` | You are not lazy. Your brain is protecting you. |
| 31 | `habitsFocusScience2` | What feels like laziness is often your brain trying to protect you from uncertainty, effort, or emotional risk. |
| 32 | `habitsFocusScience3` | Azora uses brain-based techniques to help you follow through one step at a time. |
| 33 | `consistency` | You have great potential to crush your goal. |
| 34 | `scienceCredibility` | {Greeting} in good hands. |
| 35 | `halfway` | Halfway to your results! |

## Sleep

| # | Step | Question or main headline |
|---:|---|---|
| 36 | `sleep` | How rested do you feel most mornings? |
| 37 | `sleepDuration` | How has sleep been lately? |
| 38 | `wakeEase` | How do mornings usually start? |
| 39 | `dayEnergy` | How is your energy during the day? |
| 40 | `sleepCause` | What makes it hardest to switch off at night? |
| 41 | `analyzeSleep` | Personalized sleep summary |
| 42 | `sleepInsight` | 58% of people struggle with quality sleep. |

## About you and your load

| # | Step | Question or main headline |
|---:|---|---|
| 43 | `age` | How old are you? |
| 44 | `gender` | How do you identify? |
| 45 | `stressAwareness` | How well do you understand how your body reacts to stress? |
| 46 | `heartVariability` | Azora helps your body slow down under stress. |
| 47 | `stressSignal` | When your day feels like too much, what happens first? |
| 48 | `stress` | How stressed have you felt this past week? |
| 49 | `supportSystem` | How strong is your support system? |
| 50 | `brainFog` | How often do you feel stuck? |
| 51 | `brainScience` | Azora uses CBT techniques to help ADHD brains focus. |
| 52 | `mentalHealth` | Have you been diagnosed with any of these? |
| 53 | `analyzeLoad` | Personalized load summary |
| 54 | `homeFeeling` | How do you want to feel at home? |

## Plan setup

| # | Step | Question or main headline |
|---:|---|---|
| 55 | `acquisitionSource` | How did you first hear about Azora? |
| 56 | `dailyTime` | How much time can you give every day? |
| 57 | `wakeTime` | When do you usually wake up? |
| 58 | `sleepTime` | When do you usually go to sleep? |
| 59 | `doctorReferral` | Was Azora recommended to you by a doctor? |
| 60 | `planBoost` | What would make your plan more fun and helpful? |

## Your plan

| # | Step | Question or main headline |
|---:|---|---|
| 61 | `planIntro` | Your life reset plan is ready. |
| 62 | `planLoading` | Plan generation |
| 63 | `diagnosis` | Your Azora profile |
| 64 | `recommendedExercise` | Your life reset plan |
| 65 | `recommendedHabits` | Your Recommended Habits |
| 66 | `habitCurve` | Azora users report feeling 72% better after 20 days. |

## Commitment and access

| # | Step | Question or main headline |
|---:|---|---|
| 67 | `mochiPlace` | Finish today’s plan. Azo gets his decoration. |
| 68 | `mochiFloor` | Seven completed days finish Azo’s room. |
| 69 | `mochiRooms` | Then choose another room for Azo. |
| 70 | `mochiHouse` | Try to build the biggest house for Azo! |
| 71 | `attPriming` | Make Azora better for you |
| 72 | `notifications` | Want me to check in on you? |
| 73 | `pact` | One small promise to yourself. |
| 74 | `paywall` | Trial and pricing |
