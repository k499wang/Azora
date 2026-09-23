# Onboarding screen map

Current step order from `STEP_ORDER` in `src/components/onboarding/OnboardingFlow.tsx`. The text column shows the visible question or main headline; summaries and plan screens use personalized content. Goal-specific follow-up copy is in [onboarding-intent-follow-ups.md](onboarding-intent-follow-ups.md).

There are **66 defined steps**. `intentReflection` is disabled, leaving 65 normally visible steps. `intentPriority` appears only when at least two goals are chosen, so a single-goal path shows 64 steps. The numbers below identify positions in the defined order; visible progress renumbers after skipped steps.

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

## About you and your body

| # | Step | Question or main headline |
|---:|---|---|
| 17 | `name` | Thanks for helping me out! Now, what should I call you? |
| 18 | `greeting` | Hey, {name}. |
| 19 | `age` | How old are you? |
| 20 | `gender` | How do you identify? |
| 21 | `heartVariability` | Azora helps your body slow down under stress. |
| 22 | `stressSignal` | When your day feels like too much, what happens first? |

## Your load

| # | Step | Question or main headline |
|---:|---|---|
| 23 | `stress` | How stressed have you felt this past week? |
| 24 | `brainFog` | How often do you feel stuck? |
| 25 | `brainScience` | This is your brain with Azora. |
| 26 | `mentalHealth` | Have you been diagnosed with any of these? |
| 27 | `analyzeLoad` | Personalized load summary |
| 28 | `halfway` | Halfway to your results! |

## Sleep

| # | Step | Question or main headline |
|---:|---|---|
| 29 | `sleep` | How rested do you feel most mornings? |
| 30 | `sleepDuration` | How has sleep been lately? |
| 31 | `wakeEase` | How do mornings usually start? |
| 32 | `sleepCause` | What makes it hardest to switch off at night? |
| 33 | `analyzeSleep` | Personalized sleep summary |
| 34 | `sleepInsight` | 58% of people struggle with quality sleep. |

## Daily life

| # | Step | Question or main headline |
|---:|---|---|
| 35 | `dayActivity` | What part of daily life feels hardest right now? |
| 36 | `routineHappiness` | Do you feel on top of daily life right now? |
| 37 | `choresOverwhelm` | How often do you feel overwhelmed by your day-to-day chores? |
| 38 | `distraction` | How easily distracted are you? |
| 39 | `socialMedia` | How much time do you spend on social media? |
| 40 | `procrastinationArea` | What are you avoiding most right now? |
| 41 | `procrastinationReason` | What makes it hard to begin? |
| 42 | `analyzeDays` | Personalized daily life summary |
| 43 | `habitsFocusInsight` | Build Habits More Easily with Behavioural Science |
| 44 | `habitsFocusScience1` | You are not lazy. Your brain is protecting you. |
| 45 | `habitsFocusScience2` | What feels like laziness is often your brain trying to protect you from uncertainty, effort, or emotional risk. |
| 46 | `habitsFocusScience3` | Azora uses brain-based techniques to help you follow through one step at a time. |
| 47 | `consistency` | You have great potential to crush your goal. |
| 48 | `scienceCredibility` | {Greeting} in good hands. |

## Plan setup

| # | Step | Question or main headline |
|---:|---|---|
| 49 | `acquisitionSource` | How did you first hear about Azora? |
| 50 | `dailyTime` | How much time can you give every day? |
| 51 | `wakeTime` | When do you usually wake up? |
| 52 | `sleepTime` | When do you usually go to sleep? |
| 53 | `doctorReferral` | Was Azora recommended to you by a doctor? |

## Your plan

| # | Step | Question or main headline |
|---:|---|---|
| 54 | `planIntro` | Your life reset plan is ready. |
| 55 | `planLoading` | Plan generation |
| 56 | `diagnosis` | Your Azora profile |
| 57 | `recommendedExercise` | Your life reset plan |
| 58 | `recommendedHabits` | Your Recommended Habits |
| 59 | `habitCurve` | Azora users report feeling 72% better after 20 days. |

## Commitment and access

| # | Step | Question or main headline |
|---:|---|---|
| 60 | `mochiPlace` | Finish today’s plan. Earn a decoration for Azo. |
| 61 | `mochiFloor` | Seven completed days finish Azo’s room. |
| 62 | `mochiRooms` | Then choose another room for Azo. |
| 63 | `attPriming` | Make Azora better for you |
| 64 | `notifications` | Want me to check in on you? |
| 65 | `pact` | One small promise to yourself. |
| 66 | `paywall` | Trial and pricing |
