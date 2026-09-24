# Onboarding screen map

Current step order from `STEP_ORDER` in `src/components/onboarding/OnboardingFlow.tsx`. The text column shows the visible question or main headline; summaries and plan screens use personalized content. Goal-specific follow-up copy is in [onboarding-intent-follow-ups.md](onboarding-intent-follow-ups.md).

There are **72 defined steps**. `intentReflection` is disabled, leaving 71 normally visible steps. `intentPriority` appears only when at least two goals are chosen, so a single-goal path shows 70 steps. The numbers below identify positions in the defined order; visible progress renumbers after skipped steps.

## Azo and introduction

| # | Step | Question or main headline |
|---:|---|---|
| 1 | `azoIntro` | This is Azo. |
| 2 | `azoMoved` | Azo moves houses a lot. |
| 3 | `azoNewRoom` | Each time he moves, he lives in an empty room. |
| 4 | `azoBusy` | He never gets enough time to decorate it. |
| 5 | `azoFresh` | Help Azo make it feel like home. |
| 6 | `azoTogether` | While you help Azo, we’ll build you a life routine. |
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
| 21 | `beforeAfter` | Azora helps you become the best version of yourself. *(before/after comparison)* |
| 22 | `choresOverwhelm` | How often do you feel overwhelmed by your day-to-day chores? |
| 23 | `distraction` | How easily distracted are you? |
| 24 | `socialMedia` | How much time do you spend on social media? |
| 25 | `procrastinationArea` | What are you avoiding most right now? |
| 26 | `procrastinationReason` | What makes it hard to begin? |
| 27 | `analyzeDays` | Personalized daily life summary |
| 28 | `habitsFocusInsight` | Build Habits More Easily with Behavioural Science |
| 29 | `habitsFocusScience1` | You are not lazy. Your brain is protecting you. |
| 30 | `habitsFocusScience2` | What feels like laziness is often your brain trying to protect you from uncertainty, effort, or emotional risk. |
| 31 | `habitsFocusScience3` | Azora uses brain-based techniques to help you follow through one step at a time. |
| 32 | `consistency` | You have great potential to crush your goal. |
| 33 | `scienceCredibility` | {Greeting} in good hands. |
| 34 | `halfway` | Halfway to your results! |

## Sleep

| # | Step | Question or main headline |
|---:|---|---|
| 35 | `sleep` | How rested do you feel most mornings? |
| 36 | `sleepDuration` | How has sleep been lately? |
| 37 | `wakeEase` | How do mornings usually start? |
| 38 | `dayEnergy` | How is your energy during the day? |
| 39 | `sleepCause` | What makes it hardest to switch off at night? |
| 40 | `analyzeSleep` | Personalized sleep summary |
| 41 | `sleepInsight` | 58% of people struggle with quality sleep. |

## About you and your load

| # | Step | Question or main headline |
|---:|---|---|
| 42 | `age` | How old are you? |
| 43 | `gender` | How do you identify? |
| 44 | `heartVariability` | Azora helps your body slow down under stress. |
| 45 | `stressSignal` | When your day feels like too much, what happens first? |
| 46 | `stress` | How stressed have you felt this past week? |
| 47 | `supportSystem` | How strong is your support system? |
| 48 | `brainFog` | How often do you feel stuck? |
| 49 | `brainScience` | Azora uses CBT techniques to help ADHD brains focus. |
| 50 | `mentalHealth` | Have you been diagnosed with any of these? |
| 51 | `analyzeLoad` | Personalized load summary |
| 52 | `homeFeeling` | How do you want to feel at home? |

## Plan setup

| # | Step | Question or main headline |
|---:|---|---|
| 53 | `acquisitionSource` | How did you first hear about Azora? |
| 54 | `dailyTime` | How much time can you give every day? |
| 55 | `wakeTime` | When do you usually wake up? |
| 56 | `sleepTime` | When do you usually go to sleep? |
| 57 | `doctorReferral` | Was Azora recommended to you by a doctor? |
| 58 | `planBoost` | What would make your plan more fun and helpful? |

## Your plan

| # | Step | Question or main headline |
|---:|---|---|
| 59 | `planIntro` | Your life reset plan is ready. |
| 60 | `planLoading` | Plan generation |
| 61 | `diagnosis` | Your Azora profile |
| 62 | `recommendedExercise` | Your life reset plan |
| 63 | `recommendedHabits` | Your Recommended Habits |
| 64 | `habitCurve` | Azora users report feeling 72% better after 20 days. |

## Commitment and access

| # | Step | Question or main headline |
|---:|---|---|
| 65 | `mochiPlace` | Finish today’s plan. Earn a decoration for Azo. |
| 66 | `mochiFloor` | Seven completed days finish Azo’s room. |
| 67 | `mochiRooms` | Then choose another room for Azo. |
| 68 | `mochiHouse` | Try to build the biggest house for Azo! |
| 69 | `attPriming` | Make Azora better for you |
| 70 | `notifications` | Want me to check in on you? |
| 71 | `pact` | One small promise to yourself. |
| 72 | `paywall` | Trial and pricing |
