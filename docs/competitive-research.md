# Competitive research — reviews, feature requests, recommendations

Compiled 2026-09-18. What users of comparable apps praise, complain about and ask
for, and what of it we should build.

## Method and limits

Web research over App Store listings, review aggregations and review-based
analyses. **This is secondary reporting, not our users and not a scraped review
corpus.** Where a quote appears below it came through an aggregator or a review
article rather than straight off the store, so treat the quotes as
representative rather than verbatim-verified. Nothing here is validated against
our own analytics; the recommendations say where that matters.

Comparison sets, because we sit in three categories at once:

- **Breathing** — Breathwrk, Othership
- **Mood tracking** — Daylio, How We Feel, Bearable
- **Self-care / habit** — Finch, habit trackers generally
- **Personalized plan** — Noom, BetterMe, Runna
- **Meditation** — Calm, Headspace, Insight Timer

---

## Findings by app

### Breathwrk — breathing

**Complaints** (clustered in recent 1-stars after a redesign):

- Lost HealthKit mindful-minutes sync. Users were angry, which is the tell that
  they valued it.
- Navigation of the new interface; loss of previously available exercises and
  educational content.
- Shift to a subscription-only model after features had been free.
- Crashes, freezing, login problems, a glitching breath-hold timer, buttons not
  working, notifications stopping.
- Paid annually via Google Play but received only trial access; "restore
  purchase" did not work; minimal support response.

**Feature requests:**

- Widget and Lock Screen support.
- Run in the background with the screen off.
- More ambient sound options during a session (fire, earth).

**Praise** — one review's shape, which is the review we want:

> "When I feel any anxiety I do a breathing exercise instead of taking an
> anxiety pill."

The same user describes starting the recommended sleep breathing routine at
bedtime and falling asleep soon after. The pattern: **a specific moment of need,
met immediately.**

Sources: [App Store reviews](https://apps.apple.com/us/app/breathwrk-breathing-exercises/id1481804500?see-all=reviews),
[Breathwrk review — ChoosingTherapy](https://www.choosingtherapy.com/breathwrk-app-review/),
[feedback analysis](https://kimola.com/reports/exclusive-breathwrk-app-feedback-analysis-report-app-store-us-154029)
(now 410; findings retained from search summary).

### Othership — breathing

4.9 across ~2.1K ratings, few substantive complaints. One account-transfer
failure after a device change. Sells a **voice-led** session, which is the main
structural difference from us.

Source: [App Store](https://apps.apple.com/us/app/othership-guided-breathwork/id1590348936).

### Daylio — mood

**Most-loved feature is the calendar of coloured squares** ("Year in Pixels").
It is what reviewers cite, and what several competing apps exist solely to
provide. Also praised: activity tags, correlation stats, yearly reports,
customization of mood colours and icons, and working fully offline.

The recurring emotional payoff, quoted in review coverage:

> the app showed them they have more good days than bad, and that for each bad
> day there are many good days around the corner.

**The loved statistic is a correlation**, not a chart: "your mood averages X on
days you did Y." Daylio can only do this against tags the user remembers to
add.

Sources: [App Store](https://apps.apple.com/us/app/daylio-journal-mood-tracker/id1194023242),
[Daylio review](https://www.choosingtherapy.com/daylio-app-review/),
[moodtrackers.org review](https://moodtrackers.org/daylio-app-review/),
[design critique](https://medium.com/@xixi743/daylio-design-critique-23b0f17f5f5a),
[Year in Pixels apps](https://year-in-pixels.com/year-in-pixels-apps/),
[PixelDiary](https://pixeldiary.app/year-in-pixels).

### How We Feel — mood

Built by the Yale Center for Emotional Intelligence. The **Mood Meter**: a
four-quadrant grid of energy × pleasantness with ~150 emotion words, pushing
precise labelling. Free, no ads, non-profit. Health-trend tracking via
HealthKit.

Source: [best mood tracking apps](https://www.mindfulsuite.com/reviews/best-mood-tracking-apps).

### Bearable — mood + symptoms

Day detail is a **factor-by-factor breakdown**, one row per tracked thing with
its own value. That granularity is what reviewers mean by "clinical-grade", and
it is the pattern we copied for the day's check-in card.

Source: [Bearable vs Daylio](https://bearable.app/bearable-vs-daylio-which-one-should-you-choose/).

### Apple Health — State of Mind

The calendar and the graph are **navigation, not the destination**: tapping any
point opens that day's detail with every state logged and the context given.
The grid never tries to explain itself.

Sources: [Apple — log your state of mind](https://support.apple.com/guide/iphone/log-your-state-of-mind-iph6a6decb13/ios),
[Apple newsroom](https://www.apple.com/newsroom/2023/06/apple-provides-powerful-insights-into-new-areas-of-health/).

### Finch — self-care pet

~4.9 stars, 500K+ reviews. **The most-praised property is not a feature — it is
that missing a day never punishes you.** Reviews repeatedly describe
self-compassion over achievement.

Quotes from review coverage:

> "This app has been there for me through some of my deepest depressions and
> biggest moments of grief. When the people in my life can't lift me up for
> whatever reason, I still have Finch in my pocket."

> (user with ADHD, OCD and anxiety) "This has actually been life changing for
> me… not only helped me with my daily tasks like taking medication or making my
> bed, but also extra goals and tasks I set for myself."

**Complaints and requests:**

- **It gets repetitive after a while.**
- Not much customization of the daily exercises; users want more variety.
- **Goals are all-or-nothing — users want to tick off multi-step goals partway.**
- The interface is dense at first: journeys, goals, tags and energy points take
  time to connect.
- Ads in the free tier; uncertainty about what Plus actually guarantees.

Its insights view **correlates completed goals against happier days** — the same
statistic Daylio is praised for, arrived at independently.

Sources: [App Store reviews](https://apps.apple.com/us/app/finch-self-care-pet/id1528595748?see-all=reviews),
[Slate review](https://slate.com/technology/2026/09/finch-app-self-care-wellness-review.html),
[Calmevo](https://calmevo.com/finch-app-review/),
[HabitBox pros & cons](https://habitbox.app/blog/finch-app-review),
[AIdorable](https://www.aidorable.ai/blog/finch-app-reviews).

### Habit trackers (general)

The consistently requested four: **interactive Home Screen and Lock Screen
widgets**, **Apple Watch app and complications**, **notes / journaling on an
entry**, and **editing or backfilling past days** — explicitly named as a gap,
since batch check-ins for missed days mostly are not possible.

Sources: [best habit trackers for iOS](https://toolfinder.com/best/habit-trackers-ios),
[Apple Watch habit trackers](https://www.dailyhabits.xyz/habit-tracker-app/best-habit-tracking-apps-apple-watch),
[habit tracker apps for iPhone and Mac](https://timingapp.com/blog/habit-tracker-apps-iphone-mac/).

### Calm and Headspace — meditation

**Billing is the complaint, not the content.** The summary from one review
analysis:

> people don't resent paying; they resent feeling tricked into paying.

- Charged the full annual fee right after a trial ends; no refund even when
  flagged within hours; cancellation harder to navigate than it should be.
- Headspace removed its meaningful free tier and reviewers noticed: "you can
  barely try it before hitting the paywall."
- Calm: price complaints, **choice overwhelm**, and programmes described as
  repetitive regardless of the stated subject.
- Sleep content is the most-used category in both.

Sources: [What Calm really costs — 85 reviews](https://unstar.app/blog/what-calm-really-costs-charged-after-free-trial-reviews-2026),
[Headspace review](https://www.choosingtherapy.com/headspace-review/),
[Calm vs Headspace vs Insight Timer](https://unstar.app/blog/calm-headspace-insight-timer-balance-ten-percent-happier-meditation-apps-ranked-2026).

### Insight Timer — the retention outlier

**16% D30 retention against Calm and Headspace, neither above 8.5%.** Attributed
to community mechanics, achievement tiers and a large free library — meditation
turned into a milestone-driven habit rather than a solitary one. This is the
single hardest number in this document.

Source: [Calm vs Headspace vs Insight Timer](https://unstar.app/blog/calm-headspace-insight-timer-balance-ten-percent-happier-meditation-apps-ranked-2026).

### Noom and BetterMe — personalized plans

**The personalization gap is the category's fatal flaw, and both get the same
complaint independently:**

- Noom: users report receiving similar program content regardless of their
  intake answers; coaching interactions described as "scripted and generic
  rather than truly adaptive."
- BetterMe: workout plans "feel repetitive and AI-generated rather than the
  tailored program the quiz promised"; "plans feel generic regardless of quiz
  answers."

**Cancellation is the other cluster.** A former senior software engineer at Noom
testified that the cancellation process was *intentionally* designed to be
difficult, to generate revenue from customers who failed to cancel in time.
BetterMe's 1-stars: a cheap trial that quietly renews into a much more expensive
subscription, a 30-day money-back guarantee people say they can never claim, and
crashes right after payment.

What works: Noom **adjusts lesson content and check-in frequency as you
progress**, and its lessons plus guide chat are what positive reviews cite.

Sources: [Noom review](https://www.choosingtherapy.com/noom-review/),
[Noom — Wikipedia, cancellation testimony](https://en.wikipedia.org/wiki/Noom),
[Is BetterMe legit — 1-star reviews](https://unstar.app/blog/is-betterme-legit-worth-it-fitness-app-reviews-2026),
[Noom vs BetterMe](https://www.nutrola.app/en/blog/noom-vs-betterme-which-is-better-2026).

### Runna — personalized plans, done well

- The plan **adapts to performance, schedule and goals**, and adjusting your
  schedule is a first-class, documented feature.
- **A weekly message from the coach** — a once-a-week touchpoint.
- A calendar tab showing the whole plan, to see ahead.
- A colour-coded seven-cell week strip; a fixed run-type colour system.
- The whole product is organised around a **named outcome with a date** ("12
  weeks to your 10k").

Sources: [Runna features](https://www.runna.com/features),
[adjusting your schedule](https://support.runna.com/en/articles/6206024-adjusting-your-running-schedule),
[key features guide](https://support.runna.com/en/articles/10473504-guide-to-key-runna-features),
[TechRadar review](https://www.techradar.com/health-fitness/fitness-apps/runna-review),
[UI breakdown](https://screensdesign.com/showcase/runna-running-training-plans).

### Retention mechanics — what the literature says

- **Commitment devices beat streaks.** A 2026 meta-analysis puts adherence +30%
  where users commit in advance to a specific behaviour; better than streak
  mechanics for complex habits.
- **Streaks cut both ways.** Loss aversion is the point, but when a streak
  breaks many abandon out of guilt. Apps that keep the upside add a **streak
  freeze**.
- **Task-specific reminders beat generic nags.** "Finish your unfinished task"
  outperforms streak reminders; frequent generic reminders train people to
  disable notifications.
- **Light social accountability retains better than solo**, with closed group
  challenges (defined start and end) and opt-in accountability pairs called out
  as the effective forms.
- **Caveat:** extrinsic motivators (streaks, points, competition) reliably lift
  short-run engagement and can crowd out the intrinsic motivation that sustains
  the behaviour once the reward stops.

Sources: [Wellness app retention design playbook](https://keytotech.com/blog/wellness-app-retention-design-playbook),
[Digital wellbeing apps — what actually works](https://dasroot.net/posts/2026/04/digital-wellbeing-apps-what-actually-works/),
[Fitness app retention](https://productgrowth.in/insights/healthtech/fitness-app-retention/),
[App retention strategies 2026](https://userpilot.com/blog/app-retention-strategies/),
[Gamification and retention](https://www.strivecloud.io/blog/user-retention-examples).

---

## Cross-cutting patterns

1. **Billing is the most common complaint in every category here** — Calm,
   Headspace, Noom, BetterMe, Breathwrk. It is never about the content.
2. **Repetition is the churn mechanism.** Finch, Calm and BetterMe all get it.
   It arrives around the point the product stops looking different week to week.
3. **The loved statistic is a correlation**, and the loved artifact is the
   coloured grid. Both Daylio and Finch landed on behaviour ↔ mood.
4. **Not punishing a miss is a feature.** It is Finch's most-praised property and
   the reason streak design keeps being revisited.
5. **Personalization must be visible at the point of use**, or the quiz becomes
   a liability. This is the plan category's defining failure.
6. **Day detail is a screen, not a tooltip** — Apple Health, Daylio and Bearable
   all agree.

---

## Recommendations

Judged against the activation north star: **5+ sessions in 7 days among trial
starters.**

### Build — product features

1. **SOS Reset.** One always-present control that starts a short Reset
   immediately, no choosing. Home currently starts *today's assigned* Reset
   (`src/screens/HomeScreen.tsx`) and Explore is a browse of twelve moods;
   neither serves the unplanned moment, which is the moment a breathing app is
   for. Cheapest item here — it is a route into machinery we already have — and
   the most likely to produce the Breathwrk-style review above.
2. **Challenges with an end date.** "7 days of mornings", "14 days of
   wind-down". Finite and finishable, where a streak is neither. The strongest
   available answer to repetition, and it matches the closed-challenge form the
   retention research favours.
3. **Tags on the day.** After the check-in, tap a few of *work, poor sleep,
   exercise, socialising, travel*. This is the engine under Daylio's correlation
   stats. Without it the only thing we can correlate mood against is our own
   sessions, which is a narrow and self-serving question.
4. **A target you can hit.** A named outcome — *hold two minutes*, *30 days
   kept* — with distance-to-goal on Home. Runna's organising principle, and our
   breath-hold then-vs-now is a genuinely dramatic before/after
   (`longestHoldSeconds` and the hold trend are already stored).
5. **A wind-down sequence.** Sleep is the most-used category in Calm and
   Headspace. We ask about sleep every morning and do nothing with it. A second
   daily occasion, at a time nothing else competes for.
6. **Audio-guided Resets.** Othership and Breathwrk sell a voice. Ours is silent
   visuals plus chimes, which requires watching the screen — and quietly makes
   the screen-off complaint ours too.
7. **Partial / multi-step to-dos.** Finch's clearest feature request; our
   self-care goals are all-or-nothing today.
8. **A note on the check-in.** We have no free text anywhere. One optional line,
   shown in the day detail. Standard in every tracker in the set.
9. **Adjust the plan.** Lighten a week, move days, pause. Runna's escape valve;
   without it a bad week has no in-app response but silence.
10. **Weekly review.** Sunday: how last week went, what next week asks. The
    cadence Runna and Whoop have both converged on.
11. **Streak freeze / comeback framing.** Never show "streak lost". Count
    returns — "you've come back 7 times". Removes an existing churn trigger.

### Build — platform and hygiene

12. **Billing hygiene.** Trial-end reminder, plain price and date, two-tap
    cancel, working restore. The most consistent complaint across every app
    here, and the whole category is failing it.
13. **Home Screen and Lock Screen widget.** Most-requested feature across both
    the habit and breathing sets, and a direct activation lever.
14. **HealthKit mindful minutes.** Table stakes; its loss caused a revolt at
    Breathwrk. Validate first how many of our users use Apple Health.
15. **Apple Watch app and complication.** Repeated habit-tracker ask.
16. **Backfill, narrowly.** The tappable calendar has created the expectation. A
    missed **check-in** may be answered from History; a missed **session** may
    not — inventing completions corrupts the only honest signal we have, and
    breaks "numbers never flatter".
17. **Unfinished-task notifications**, replacing generic reminders.

### Already covered

- Coloured day grid — the profile calendar now colours each day by its check-in
  face, with a dot for days kept.
- Day detail — `History` opens on a date and shows the check-in per scale
  (`HistoryMoodCard`), the Bearable pattern.
- Plan calendar and week strip — `PlanCalendar`.
- Achievement ladder — the room and the hotel. Deepen these rather than adding
  badges.
- Personalization echoed in onboarding.

### Do not build

- **Leaderboards or competitive ranking.** Competition is the mechanic most
  likely to crowd out the reason someone opened a breathing app.
- **A second growth avatar.** The room is it.
- **An eleventh system.** Finch's own critique is interface density, and we
  already ask users to hold room, hotel, coins, plan, Azora Score, streak,
  dailies, to-dos, lessons and the check-in.
- Settled-no directions: ambient exercise backgrounds, post-session mood on the
  results screen, the AI check-in / pranayama library / guest coach direction.

### If picking two

**SOS Reset** and **challenges**. The first is what a breathing app is for and
costs almost nothing; the second is the strongest answer to the repetition that
kills apps in this category around week three.
