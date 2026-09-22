# Onboarding Screen Map

Every step in `STEP_ORDER` ([src/components/onboarding/OnboardingFlow.tsx:1](/Users/k3vinwvng/Documents/Azora/Azora/src/components/onboarding/OnboardingFlow.tsx:1)), numbered in render order, with the headline the user actually reads. Written so the whole flow can be reviewed without walking through the app.

Kind: **Ask** = the user answers something · **Tell** = we say something · **Do** = a measurement, permission or purchase.

## Part 1 — Cold open (Azo)

| # | Step | Headline | Kind |
|---|---|---|---|
| 1 | `azoIntro` | This is Azo. | Tell |
| 2 | `azoMoved` | Azo moves houses a lot. | Tell |
| 3 | `azoNewRoom` | Each time he moves, he lives in an empty room. | Tell |
| 4 | `azoBusy` | He never gets enough time to decorate it. | Tell |
| 5 | `azoFresh` | Help Azo make it feel like home. | Tell |
| 6 | `azoTogether` | While you help Azo decorate, we’ll build you a personalized plan. | Tell |

## Part 2 — Goals

| # | Step | Headline | Kind |
|---|---|---|---|
| 9 | `personalizeIntro` | First, let's build your personalized Azora plan. | Tell |
| 10 | `intent` | What is taking the most from you right now? | Ask |
| 11 | `intentPriority` | What is most important to you? *(only if 2+ picked)* | Ask |
| 12 | `intentReflection` | *(the hook copy for the chosen intent)* | Tell |
| 13 | `intentDepth1` | *(when it hits — question depends on the chosen goal)* | Ask |
| 14 | `intentDepth2` | *(what you have already tried — depends on the goal)* | Ask |
| 15 | `intentDepth3` | What has it cost you most? | Ask |
| 16 | `analyzeIntent` | "Your goals" → *Everything ahead is shaped to help you {goal}.* | Tell |
| 17 | `goalProof` | Azora users are 2× more likely to reach the goal they set | Tell |

## Part 3 — Who you are

| # | Step | Headline | Kind |
|---|---|---|---|
| 18 | `name` | Thanks for helping me out! Now, what should I call you? | Ask |
| 19 | `greeting` | Hey, {name}. | Tell |
| 20 | `age` | How old are you? | Ask |
| 21 | `gender` | How do you identify? | Ask |

## Part 4 — Your heart

| # | Step | Headline | Kind |
|---|---|---|---|
| 22 | `baselineIntro` | Let's get to know your heart. | Tell |
| 23 | `baselinePrivacy` | We take your privacy and security seriously | Do (consent) |
| 24 | `baseline` | Heart reading *(camera measurement + BPM report)* | Do |
| 25 | `heartVariability` | Stress raises your heart rate. | Tell |
| 26 | `heartWorry` | How much do you worry about your heart health? | Ask |

## Part 5 — Your load

| # | Step | Headline | Kind |
|---|---|---|---|
| 27 | `stress` | How stressed have you felt this past week? | Ask |
| 28 | `brainFog` | How often does brain fog slow you down? | Ask |
| 29 | `brainScience` | This is your brain with Azora. | Tell |
| 30 | `mentalHealth` | Do you struggle with any of these? | Ask |
| 31 | `analyzeLoad` | "Burnout risk" → *Here's the load you're carrying.* (echoes their answers) | Tell |
| 32 | `halfway` | Halfway to your results! / Did you know? | Tell |

## Part 6 — Your sleep

| # | Step | Headline | Kind |
|---|---|---|---|
| 33 | `sleep` | How rested do you feel most mornings? | Ask |
| 34 | `sleepDuration` | How long do you usually sleep at night? | Ask |
| 35 | `wakeEase` | How easy is it for you to get out of bed? | Ask |
| 36 | `sleepCause` | What keeps you up most nights? | Ask |
| 37 | `analyzeSleep` | "Sleep" → *Here's the sleep picture you shared.* (echoes their answers) | Tell |
| 38 | `sleepInsight` | 58% of people struggle with quality sleep. | Tell |

## Part 7 — Your days

| # | Step | Headline | Kind |
|---|---|---|---|
| 39 | `dayActivity` | How active are you during the day? | Ask |
| 40 | `routineHappiness` | How happy are you with your current routine? | Ask |
| 41 | `procrastinationArea` | What are you avoiding most right now? | Ask |
| 42 | `procrastinationReason` | What makes it hard to begin? | Ask |
| 43 | `analyzeDays` | "Your days" → *Here's how your days run.* (echoes their answers) | Tell |
| 44 | `habitsFocusInsight` | A short reset can make the next step feel smaller. | Tell |
| 45 | `habitsFocusScience1` | You aren’t lazy. Your brain is protecting you. | Tell |
| 46 | `habitsFocusScience2` | Small actions are easier to repeat. | Tell |
| 47 | `habitsFocusScience3` | You only need a place to begin. | Tell |
| 48 | `consistency` | You have great potential to crush your goal. | Tell |

## Part 8 — Credibility and admin

| # | Step | Headline | Kind |
|---|---|---|---|
| 49 | `scienceCredibility` | {Greeting} in good hands. | Tell |
| 50 | `acquisitionSource` | How did you first hear about Azora? | Ask |
| 51 | `dailyTime` | How much time can you give every day? | Ask |
| 52 | `wakeTime` | When do you usually wake up? | Ask |
| 53 | `sleepTime` | When do you usually go to sleep? | Ask |
| 54 | `doctorReferral` | Was Azora recommended to you by a doctor? | Ask |

## Part 9 — The plan

| # | Step | Headline | Kind |
|---|---|---|---|
| 55 | `planIntro` | Your life reset plan is ready. | Tell |
| 56 | `planLoading` | *(plan generation)* | Tell |
| 57 | `diagnosis` | Your Azora profile | Tell |
| 58 | `recommendedExercise` | Your life reset plan | Tell |

## Part 10 — Commit

| # | Step | Headline | Kind |
|---|---|---|---|
| 59 | `mochiPlace` | Finish today’s plan. Earn a decoration for Azo. | Tell |
| 60 | `mochiFloor` | Seven completed days finish Azo’s room. | Tell |
| 61 | `mochiRooms` | Then choose another room for Azo. | Tell |
| 62 | `attPriming` | Make Azora better for you | Tell |
| 63 | `notifications` | Want me to check in on you? | Do (permission) |
| 64 | `pact` | One small promise to yourself. | Ask |
| 65 | `support` | Azora is free to try. (your support pays the experts behind it) | Tell |
| 66 | `paywall` | *(trial + pricing)* | Do |

**Totals:** 66 steps. `intentPriority` only appears when two or more goals are picked.

---

# What's wrong, and how to fix it

## Diagnosis

**1. Nothing the user says changes what they see.** The intent picked at #7 never reappears until #45. Twenty questions later, the flow has asked about heart, stress, activity, brain fog, sleep, worry, routine, mental health and procrastination in the same order for everyone, whether they came for sleep or for panic attacks. This is the root of "random questions bundled together" — a flow feels structured when each answer visibly narrows the next question. Right now the branching that exists (`intentPriority`, `intentReflection`) branches *display*, not *direction*.

**2. Three openings compete before the first question.** *(Partly fixed 2026-09-16 — `support` moved to #56. The product claim still does not appear until the heart reading; a claim written for `personalizeIntro` was tried and rejected.)* #1–4 promise a decoration game, #5 promises personalization, #6 asks about paying for the app. The actual product claim — your stress shows up as a number and a Reset lowers it — doesn't arrive until #16. A user 6 screens deep still can't say what this app does.

**3. Topics are interleaved, not grouped.** *(Fixed 2026-09-16.)* Heart used to run at #16–19 and again at #29; activity sat alone between stress and brain fog; procrastination landed after mental health with no bridge. The order above now holds one subject per module: heart → load → sleep → days.

**4. Two of the three "analyze" closers say nothing about the person.** *(Fixed 2026-09-16.)* `analyzeSleep` (#27) echoes real answers — that one works and is the model. `analyzeIntent` (#10) and `analyzeLoad` (#35) show a generic fact, so they read as loading spinners with trivia rather than the flow paying attention.

**5. Breadth instead of depth.** *(Fixed 2026-09-16.)* Every problem gets exactly one question. Stress: one slider. Sleep: three facts. Nothing ever asks *when* it happens, *what it costs*, or *what they've already tried* — which is why it doesn't feel like it goes deep into the user's problem. Depth is also what makes the plan at #45 feel earned instead of generic.

**6. Housekeeping is sprinkled through the emotional arc.** Privacy (#17), science (#37), acquisition source (#38), doctor referral (#42), ATT (#50), notifications (#51) — six admin beats scattered across six different moods.

**7. The strongest asset is buried and never called back.** The camera reading at #18 is the only thing in the flow no competitor screenshot can fake, and no later screen says "we're going to bring that number down."

**8. #20–34 is fifteen screens with two breaks.** That stretch is where the flow stops feeling like a conversation.

## Fixes, in order of payoff

**A. Give the flow one spine and name it on every section.** The spine is already in the product: *your load shows up in your heart rate, and we can lower it.* Interpolate the chosen intent into each section's opening line — "You said sleep is the thing. Let's look at your nights." No new branching logic, just copy using state the flow already holds. This single change is what makes the questions converge.

**B. Announce sections.** Small "3 of 6 — Your sleep" title cards at each module boundary. The user stops guessing how much is left, and adjacent questions read as a set rather than a list.

**C. Give every section the `analyzeSleep` treatment.** Generalise the `echoSingle` pattern so each module closes by repeating the user's own answers back. Cheapest fix on this list, and the code already exists in the flow.

**D. Regroup the questions into modules that hold one topic each.** Move `heartWorry` (#29) up beside the heart reading, `dayActivity` (#21) into the load module, and `routineHappiness` + procrastination (#30, #33–34) into one "your days" module. Then the order is: goals → you → heart → load → sleep → days → plan.

**E. Add depth on the chosen intent, once.** After the intent is picked, ask 2–3 follow-ups keyed to it: when does it hit, what have you tried, what does it cost you. This is the one place branching is worth the code, and it is the direct answer to "doesn't go deep enough." The "what does it cost you" beat is missing from the flow entirely and is the highest-signal question a wellbeing onboarding can ask.

**F. Collapse the cold open and move the support ask.** Two Azo beats up top, not four — the story already resolves properly at #47–49. Move `support` (#6) next to the plan or the paywall, where the user has been given something.

**G. Pool the admin beats.** Privacy stays where it is (it has to precede the camera). Science, acquisition source and doctor referral belong in one block right before plan generation, which is roughly where they already are — just contiguous and framed as "a few last things."

**H. Close the loop.** The diagnosis screen at #45 should say the measured BPM and the chosen intent in one sentence: "You came in at 78 BPM and you're here to sleep better. Here's the plan." Everything before it then reads as having been for something.

## Suggested target shape

| Module | Contains | Ends with |
|---|---|---|
| 0. Hook | 2 Azo beats | — |
| 1. Why you're here | intent, priority, 2–3 intent follow-ups | echo of their words |
| 2. Who you are | name, greeting, age, gender | greeting |
| 3. Your heart | intro, privacy, reading, result, heart worry | the BPM report |
| 4. Your load | stress, brain fog, mental health | echo |
| 5. Your sleep | quality, duration, wake ease | echo + insight |
| 6. Your days | activity, routine happiness, procrastination × 2, daily time, wake/sleep time | echo |
| 7. Last things | science, doctor referral, acquisition source | — |
| 8. Your plan | plan intro, loading, diagnosis (restates BPM + intent), recommended session | — |
| 9. Commit | Azo room × 3, support, ATT, notifications, pact, paywall | — |

Same screens, roughly the same count. The difference is that every module holds one subject, closes by repeating what the user said, and names the goal they picked on the way in.

---

# Implementation notes

## Where the support screen goes *(done 2026-09-16)*

`support` sat at #6, between "let's personalize Azora" and the first question — a money message before anything has been given. It now sits between `pact` and `paywall`; the profile save hands off to it, and it hands off to the paywall. The sequence then reads: you promised yourself something → here is why the thing costs money → here is the price. Second choice is directly after `recommendedExercise`, i.e. the moment the plan appears. Either way it belongs after value, not before the first question.

## Making the analyze screens personal *(done 2026-09-16)*

`QuickAnalyzeScreen` takes a `fact` of `{ headline, body, emoji }`. `analyzeSleep` already fills `body` from the user's answers via `echoSingle`; the other two fill it with a generic line. The machinery is `src/lib/onboardingEcho.ts` and its rules are worth keeping: an echo is a *premise*, never an announcement ("Kept short, since you're too tired", not "You said you're too tired"), fragments are authored next to the option rather than derived from its title, and nothing is echoed that the user did not actually choose.

**`analyzeIntent`** — add an `echo` fragment to each entry in `INTENT_OPTIONS` / `PERSONALIZED_INTENT_OPTIONS` ("here to sleep better", "here to calm down fast"), then:

```ts
const goalEcho =
  echoSingle(INTENT_OPTIONS, primaryIntent) ??
  echoOption(INTENT_OPTIONS, selectedIntents);
```

`primaryIntent` first, because `intentPriority` exists precisely to break the tie when several are picked; `echoOption` covers the single-pick case. Body becomes `Building around the fact that you're ${goalEcho}.` with the current generic line as the null fallback.

**`analyzeLoad`** — this now closes stress + brain fog + mental health. Two of those are sliders, so they need a band description rather than an option echo:

```ts
// src/lib/onboardingLoad.ts
export function describeStressBand(level: number): string;   // 1-9 → 'running on fumes'
export function describeBrainFogBand(level: number): string;
```

Add `echo` fragments to `MENTAL_HEALTH_OPTIONS` for the single-pick case. Body then assembles the same way `analyzeSleep` does, worst-first, with a null-safe fallback. Keep it honest — the design principle is that numbers never flatter, so a high stress answer gets named, not softened.

## Depth: intent-keyed follow-ups *(done 2026-09-16 — `src/components/onboarding/data/intentFollowUps.ts`)*

Every question and answer is listed in [onboarding-intent-follow-ups.md](/Users/k3vinwvng/Documents/Azora/Azora/docs/onboarding-intent-follow-ups.md:1).

Every problem used to get exactly one question, which is why the flow never felt like it went deep. The fix is one module of 2–3 questions chosen by `primaryIntent`, asked right after the intent is picked.

Three question shapes generalize across every intent:

1. **When does it hit?** — the moment, not the severity. ("Falling asleep / waking at 3am / both")
2. **What have you already tried?** — earns the plan the right to be different from what failed.
3. **What does it cost you?** — the missing beat in the current flow, and the highest-signal question a wellbeing onboarding can ask. It is also the line the plan screen should quote back.

Shape:

- `src/components/onboarding/data/intentFollowUps.ts` — `Record<IntentId, FollowUpQuestion[]>`, each question `{ id, question, options }` reusing `OnboardingChoiceScreen`, so no new screen components.
- Three steps in `STEP_ORDER` (`intentDepth1`…`3`) whose content is looked up from `primaryIntent`. The array stays static, so the progress maths is untouched.
- Render them conditionally, exactly as `intentPriority` and `intentReflection` already do (`if (step === 'intentPriority' && selectedIntents.length >= 2)`), falling through when there is no primary intent or the intent has fewer than three follow-ups.
- Store as `Record<string, string[]>` keyed by question id, so adding a follow-up never adds a state field.
- Echo the answers in `analyzeIntent` and quote the cost answer on `diagnosis`.

This is the one place branching is worth the code: it changes what the user is asked, not just what they are shown.
