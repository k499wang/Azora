# Mindmap Axes

## Status

Decided, not implemented. Replaces the Resilience and Breathing axes in
`src/lib/onboardingScores.ts`.

## Why it changed

The agreement screen was removed (`src/lib/onboardingAgreement.ts`), and
`racingLevel` is never passed to `computeMindMap`. So for every new user
`exhausted`, `racing` and `reactive` are all null and `agreementWeight` returns
0.5 for each. Substituting that in, the five axes reach these ranges:

| Axis | Range | Reads |
| --- | --- | --- |
| Calm | 11–81 | Healthy. Stress slider. |
| Recovery | 22–89 | Healthy. Sleep slider. |
| Resilience | 35–74 | Sleep and stress averaged — the other two axes combined. |
| Focus | 40–58 | Eighteen points, all of it stress. Not measuring attention. |
| Breathing | 59–59 | `50 + 0.5×12 + 0.5×6`. A constant, for everyone. |

Five axes, two real inputs. The rule that follows, and that the set below is
built on: **an axis earns its place only if some answer feeds it and nothing
else does.**

## The axes

| Axis | Question it answers | Fed by | Owns |
| --- | --- | --- | --- |
| **Calm** | "I'm wound up and I stay wound up." | stress slider | Calm Down Faster |
| **Recovery** | "I don't wake up restored." | sleep slider, `sleepDuration` | The Sleep Reset |
| **Focus** | "I can't start, or I can't stay." | `procrastinationReasons` | Steady Head, First Ten Minutes |
| **Space** | "My space got away from me." | `procrastinationAreas` | The Reset Room |
| **Rhythm** | "No two of my days look the same." | `routineHappiness`, `wakeEase` | Morning Engine |

Every axis has an input no other axis uses. Every axis owns at least one plan.

Two notes on naming, since both replacements are shown to the user as a growth
area on `DiagnosisScreen`:

- **Space** names the environment, not the person. "Your space got away from
  you" is a sentence someone can agree with without conceding anything about
  themselves; "you're disorganised" is a verdict. Same score, same plan.
- **Rhythm** is the gentlest growth area in the set — "your days don't have a
  shape yet" describes a situation rather than a shortcoming.

## Scoring

All terms clamp to 0–100 and pass through `finalMindMapScore`, so the floor of
5 and the rounding behaviour are unchanged.

### Calm — unchanged

Keeps its current formula. The agreement terms stay as optional bonuses so
profiles written before the screen was removed still score the way they did.

### Recovery — gains a second real input

```
sleepDuration01 = { under5: 0.10, 5to6: 0.35, 6to7: 0.65, 7to8: 1.00, over8: 0.85 }

recovery = sleep01 * 62 + sleepDuration01 * 28 + 10
```

`sleepDuration` is already collected and read only by the starter plan. Over
eight hours scores slightly below seven-to-eight on purpose — long sleep is not
better sleep, and the existing copy already treats it that way.

### Focus — stops being stress in a hat

```
focus = 82
      − 34 if procrastinationReasons includes 'focus'
      − 22 if procrastinationReasons includes 'start'
      − 10 if procrastinationReasons includes 'boring'
      − 16 × stress01
```

This is what lets Focus own both plans honestly: `focus` is "I can't stay",
`start` is "I can't begin", and Steady Head and First Ten Minutes answer one
each. Stress stays as a minor term rather than the whole score.

### Space — new

```
space = 78
      − 38 if procrastinationAreas includes 'chores'
      − 16 if procrastinationAreas includes 'admin'
      − 14 if procrastinationReasons includes 'overwhelmed'
      + 10 if routineHappiness is 'love'
```

Base is 78 rather than 100 so someone who selects nothing lands high but not
perfect. `admin` counts for less than `chores` — life admin is clutter-adjacent
but is not the same problem The Reset Room solves.

### Rhythm — new

```
routineHappiness01 = { love: 1.00, fine: 0.70, shaky: 0.35, none: 0.00 }
wakeEase01         = { easy: 1.00, fewMinutes: 0.75, snooze: 0.40, struggle: 0.15 }

rhythm = routineHappiness01 * 55 + wakeEase01 * 35 + 10
```

Both inputs are collected today and neither feeds anything but the starter plan.
Routine weighs more than wake ease because a person can hate mornings and still
have a shaped day.

## What changes in code

1. **`src/lib/onboardingScores.ts`** — `MindMapAxis` loses `resilience` and
   `breathEase`, gains `space` and `rhythm`. `AXIS_LABEL`,
   `GROWTH_AREA_TIE_PRIORITY` and `computeMindMap` all follow.
   `BASE_BREATH_SCORE` and `BASE_RESILIENCE_BONUS` are deleted.
2. **`ScoreInputs`** widens. It currently takes four values; it now needs
   `sleepDuration`, `wakeEase`, `routineHappiness`, `procrastinationAreas` and
   `procrastinationReasons`. They are passed to `buildStarterPlan` while
   onboarding is mounted, but are not saved on the profile today. Add the
   nullable profile columns and begin writing them before changing the scores.
3. **`GROWTH_AREA_TIE_PRIORITY`** needs a new order. Suggested, strongest claim
   on the user's attention first: `space`, `rhythm`, `focus`, `recovery`,
   `calm`.
4. **`resolveGrowthAreaAxis`** in `dailyExercisePlan.ts` maps the axis to a
   plan. Its current axis union (`calm`/`recovery`/`focus`/`resilience`) and
   `GROWTH_AREA_TECHNIQUE_ORDER_V2` both key off the old names, so both need
   remapping — `resilience` currently has an ordering that `space` and `rhythm`
   do not.
5. **`DiagnosisScreen`** needs copy for two new growth areas and loses two.
6. **Stored daily-plan blobs** carry old axis values. Keep a dedicated legacy V2
   decoder permanently, map its old axes to V3 plan ids, and remove the names
   only from current scoring/UI types. An invalid V2 payload is not enough
   because the current sanitizer discards the axis before it can be mapped.

## Open

- **Morning Engine sits under Rhythm, not Recovery.** That is deliberate — it is
  a fixed-hour plan and Rhythm is what fixed hours measure — but it means
  Recovery owns only one plan while Focus owns two.
- **`mentalHealth` already collects `adhd` and `autism`** as self-reported
  values. That is a far stronger signal for recommending The Reset Room and
  First Ten Minutes than anything the five axes compute, and it is deliberately
  not wired into scoring here. Whether the recommendation should read it at all
  is a separate decision from how the mindmap is drawn.
- Whether `racingLevel` is worth collecting now that nothing scores it. The
  parameter is still in the signature and still unused.
