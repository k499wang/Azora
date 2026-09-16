# Intent Follow-Ups

The three questions asked right after a goal is picked — steps 9–11 of the flow
(`intentDepth1`–`3`). They are the only place onboarding asks about one problem
more than once, and the answers are quoted back on `analyzeIntent`.

Source of truth is
[src/components/onboarding/data/intentFollowUps.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/components/onboarding/data/intentFollowUps.ts:1);
this file is for reading the copy without opening it. Every answer carries an
icon and an `echo` — the fragment that lets a later screen say it back inside
one of the app's own sentences.

Each goal gets three beats:

1. **When it hits** — written per goal.
2. **What you have already tried** — written per goal.
3. **What it has cost you** — the same question for everyone.

A goal with no bespoke pair falls back to the default pair below, so a new goal
needs no entry here to work.


## Default — any goal without a bespoke pair

**When does it hit you hardest?**

| Answer | Icon | Said back as |
|---|---|---|
| First thing in the morning | `weather-sunset-up` | …mornings are the hard part |
| In the middle of the workday | `laptop` | …the middle of the day is the hard part |
| In the evening | `weather-night` | …evenings are the hard part |
| At night, in bed | `bed-outline` | …nights are the hard part |
| It can be any time | `clock-fast` | …it can hit at any hour |

**What have you already tried?**  *(pick several)*

| Answer | Icon | Said back as |
|---|---|---|
| Other apps | `dots-horizontal-circle-outline` | …other apps |
| Meditation | `meditation` | …meditation |
| Moving more | `run` | …moving more |
| Therapy or coaching | `book` | …therapy |
| Supplements | `sparkle` | …supplements |
| Nothing yet | `close-circle-outline` | …nothing yet |

## Reduce stress — `stress_relief`

**When is the stress at its worst?**

| Answer | Icon | Said back as |
|---|---|---|
| Before the day has started | `weather-sunset-up` | …it starts before the day does |
| While you are working | `laptop` | …work is when it peaks |
| Once things go quiet | `weather-night` | …it arrives once things go quiet |
| When you are trying to sleep | `bed-outline` | …it peaks when you are trying to sleep |
| It never really lifts | `waves` | …it never really lifts |

**What have you tried to bring it down?**  *(pick several)*

| Answer | Icon | Said back as |
|---|---|---|
| Other apps | `dots-horizontal-circle-outline` | …other apps |
| Meditation | `meditation` | …meditation |
| Moving more | `run` | …moving more |
| Therapy or coaching | `book` | …therapy |
| A drink to take the edge off | `coffee-outline` | …a drink to take the edge off |
| Nothing yet | `close-circle-outline` | …nothing yet |

## Calm down fast — `calm_fast`

**What sets off the spikes?**  *(pick several)*

| Answer | Icon | Said back as |
|---|---|---|
| Being around people | `emoticon-confused-outline` | …being around people |
| Speaking or performing | `star` | …having to perform |
| Conflict or confrontation | `alert-circle-outline` | …conflict |
| Deadlines and pressure | `timer` | …deadlines |
| They come out of nowhere | `weather-windy` | …spikes that come from nowhere |

**What do you do when one hits?**

| Answer | Icon | Said back as |
|---|---|---|
| Wait it out | `clock-fast` | …waiting it out |
| Leave the room | `home` | …leaving the room |
| Try to breathe through it | `breath-leaf` | …breathing through it |
| Distract yourself | `blur` | …distracting yourself |
| Nothing that works | `close-circle-outline` | …nothing that has worked |

## Sleep better — `sleep`

**Where do your nights go wrong?**

| Answer | Icon | Said back as |
|---|---|---|
| Falling asleep takes forever | `moon-waning-crescent` | …falling asleep takes forever |
| You wake in the night | `alarm-snooze` | …you wake in the night |
| You wake too early | `weather-sunset-up` | …you wake too early |
| You sleep, but wake unrested | `battery-low` | …you wake unrested |
| All of it | `weather-pouring` | …the whole night is a fight |

**What have you already tried for it?**  *(pick several)*

| Answer | Icon | Said back as |
|---|---|---|
| Melatonin or sleep aids | `sparkle` | …sleep aids |
| Cutting screens at night | `laptop` | …cutting screens at night |
| Cutting caffeine | `coffee-outline` | …cutting caffeine |
| A stricter bedtime | `bed-clock` | …a stricter bedtime |
| Other apps | `dots-horizontal-circle-outline` | …other apps |
| Nothing yet | `close-circle-outline` | …nothing yet |

## Focus & study — `focus`

**Where does your focus go?**

| Answer | Icon | Said back as |
|---|---|---|
| You cannot get started | `help-circle-outline` | …starting is the hard part |
| It lasts a few minutes | `timer` | …focus lasts a few minutes |
| It dies in the afternoon | `battery-low` | …the afternoon is where it dies |
| Your phone takes it | `blur` | …your phone takes it |
| Your head is too busy | `waves` | …your head is too busy |

**What have you leaned on so far?**  *(pick several)*

| Answer | Icon | Said back as |
|---|---|---|
| Caffeine | `coffee-outline` | …caffeine |
| App blockers | `shield-alert-outline` | …app blockers |
| Timers and pomodoros | `breath-timer` | …timers |
| Lists and planners | `file-document-outline` | …lists |
| Medication | `stethoscope` | …medication |
| Nothing yet | `close-circle-outline` | …nothing yet |

## Boost energy — `energy`

**When does the energy run out?**

| Answer | Icon | Said back as |
|---|---|---|
| You wake up already flat | `weather-sunset-up` | …you wake up already flat |
| Around the middle of the day | `white-balance-sunny` | …the middle of the day empties you |
| The afternoon crash | `battery-low` | …the afternoon crash |
| By the evening there is nothing left | `weather-night` | …evenings have nothing left |
| It is low all day | `blur` | …it stays low all day |

**What have you leaned on so far?**  *(pick several)*

| Answer | Icon | Said back as |
|---|---|---|
| Caffeine | `coffee-outline` | …caffeine |
| Sugar or energy drinks | `sparkle` | …energy drinks |
| Naps | `sleep` | …naps |
| Moving more | `run` | …moving more |
| Supplements | `lotus` | …supplements |
| Nothing yet | `close-circle-outline` | …nothing yet |

## Asked of everyone

**What has it cost you most?**

| Answer | Icon | Said back as |
|---|---|---|
| My focus at work | `laptop` | …your focus at work |
| My patience with people I love | `heart-outline` | …your patience with the people you love |
| My sleep | `moon` | …your sleep |
| My health | `heart-pulse` | …your health |
| Enjoying things I used to | `emoticon-sad-outline` | …the things you used to enjoy |
| Time I will not get back | `clock-fast` | …time you will not get back |

The cost answer is the one `analyzeIntent` quotes: *"Everything ahead is shaped
to help you sleep better, and to give you back your patience with the people you
love."* It is also the natural line for the plan screen to repeat once the
diagnosis is wired up.
