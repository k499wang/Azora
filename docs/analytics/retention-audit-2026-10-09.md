# Azora retention audit — October 9, 2026

## Requested recent-only view: October 6–8

A fresh query restricted to the last three complete UTC days changes the emphasis:

| Ordered 24-hour funnel milestone | People | Share of starters |
| --- | ---: | ---: |
| Started onboarding | 79 | 100% |
| Reached onboarding paywall | 58 | 73.4% |
| Completed onboarding | 47 | 59.5% |
| Completed any tracked activity after onboarding | 35 | 44.3% |
| Completed breathing through the start/completion funnel | 16 | 20.3% |

Activity and breathing are separate funnels. Median onboarding completion time was 9m 30s. Paywall → onboarding completion was 47/58 (81.0%), stronger than the full-month result. Any activity → adoption after onboarding was 35/47 (74.5%); breathing completion was 16/47 (34.0%).

Mature exact day-1 screen return for first-ever October 6–7 onboarding cohorts was 7/45 (15.6%). October 8 cohorts have no complete next-day observation at this cutoff. Day-7 retention is not mature. Period funnels count all qualifying starters, including repeat onboarding; the retention denominator uses first-ever starters, so denominators differ. Latest-day funnel follow-up can be incomplete. Apply the same exploratory test-like identity exclusions as the main audit.

Takeaway: recent activation is stronger than the pooled month, and most people who reach the paywall finish. Do not use the full-month paywall drop-off as the recent-only diagnosis. The current priorities are earlier delivery of value during a roughly nine-minute onboarding and converting completion into a first active session. Recent data cannot prove a shorter flow would perform better.

The remainder of this document is the broader historical audit and should not be read as describing only these three days.


## Main finding

Azora loses most people before they establish a useful habit. The clearest observed losses are the onboarding paywall and the transition from onboarding into completed activities. Repeated monetization interruptions are plausible contributors. Long onboarding delays the first experience of value, but this observational audit cannot prove that shortening it alone will improve retention.

In the main 30-day funnel, 287 people started onboarding, 136 finished it, 75 completed at least one tracked activity, and 35 completed a breathing session within 24 hours of starting onboarding. Exact day-1 screen-return retention was 11.1%; day-7 was 2.6%. A broader measure is less severe but still weak: 30 of 193 mature newcomers (15.5%) returned on at least one of calendar days 1–7.

These are exploratory estimates, with remaining test-traffic and instrumentation limitations described below.

## Scope and definitions

- Source: live [Azora production PostHog project](https://us.posthog.com/project/395052), named “Default project,” project ID 395052. Separate Dev Project and empty web-app project were excluded.
- Main window: September 9–October 8, 2026, inclusive, in the project's UTC timezone. Historical retention comparison: July 10–October 8.
- The governed metric catalog was empty. These definitions are audit-specific rather than approved business metrics.
- Unique people use PostHog person IDs rather than distinct IDs. First-ever onboarding occurrence defines acquisition retention cohorts.
- Funnels are ordered, allow intervening events, and use a 24-hour conversion window unless stated otherwise.
- “Any completed activity” includes breathing completion, attention completion, mood check-in completion, lesson read, or breath-hold release. It includes passive and prompted activity; it is a broad activation proxy.
- “Returned” means a tracked `screen_view` on the stated UTC calendar day. It is not install retention, subscription retention, or a completed exercise.
- Only cohorts with a complete observation window contribute to each retention denominator. Day-0 cells in PostHog retention represent cohort size, not successful activation.
- The period funnels include the latest day's entrants; some have less than 24 hours of follow-up at the reporting cutoff. Treat activation figures as observed window results, and use fully mature entrant cohorts for experiment decisions.
- Preserve events missing `analytics_env`; exclude explicit development/preview events and emulator traffic.
- The configured internal/test exclusion cohort contains **zero people**. For the main estimates, additionally exclude three conspicuous test-like identities with 13–53 onboarding starts across multiple builds. This is a sensitivity filter, not a verified comprehensive employee exclusion. The three generated 23,332 of 90,788 events (25.7%) in the main window.
- All figures can be inspected/reproduced from [query inputs and outputs](./retention-audit-2026-10-09-data.json). No PostHog settings, dashboards, flags, or experiments were changed. No application code was changed.

## Activation and first-session losses

| Ordered 24-hour funnel | People | Share of onboarding starters |
| --- | ---: | ---: |
| Started onboarding | 287 | 100% |
| Completed onboarding | 136 | 47.4% |
| Completed any tracked activity after onboarding | 75 | 26.1% |
| Started breathing after onboarding | 54 | 18.8% |
| Completed breathing after that start | 35 | 12.2% |

The activity and breathing rows come from separate native funnels; they are not one five-step sequence.

Two major losses deserve separate experiments:

1. **At onboarding's paywall.** 217/287 (75.6%) reached the onboarding paywall; 135/217 (62.2%) then completed onboarding within the funnel window. That means 70 people dropped before the paywall and 82 dropped between paywall exposure and onboarding completion. The completed-onboarding-only funnel includes one additional person whose required paywall event did not match. A separate terminal-step check, excluding October 8's new/incomplete traffic, also found **81 non-completers last seen on the paywall**, the largest terminal-step group.
2. **After onboarding.** Only 75/136 (55.1%) completed any tracked activity in the same 24-hour funnel. Only 35/136 (25.7%) completed breathing through the start/completion sequence. Reaching Home is not the same as experiencing an exercise or returning the next day.

Median time from onboarding start to its paywall was **6m 33s**, and to onboarding completion was **6m 47s**. Current production builds 1.0.94 and 1.0.109 report **83–84 onboarding states**; earlier builds reported 43–68. The current working tree has a different, shorter state list, so production event counts and current source should not be treated as the same shipped flow. Step count measures configured flow states, not necessarily the number of interactions every individual completes.

Build 1.0.109 had 48 starters, 31 completers (64.6%), and 9 breathing completers (18.8%) in a separate ordered funnel. Median time to its paywall was 7m 42s. This suggests recent activation may be better than the pooled month, but the sample is small, many entrants are fresh, and **day-7 retention for that build is not mature**. Do not attribute the improvement to longer onboarding.

## Retention

| New onboarding cohorts | Eligible people | Returned on exact day | Rate |
| --- | ---: | ---: | ---: |
| Day 1 | 252 | 28 | 11.1% |
| Day 2 | 224 | 16 | 7.1% |
| Day 3 | 207 | 10 | 4.8% |
| Day 7 | 193 | 5 | 2.6% |
| Day 14 | 165 | 2 | 1.2% |

“Day 7” means the seventh calendar day specifically. It does **not** mean 97.4% never returned: 15.5% returned at some point on days 1–7.

Among first-ever onboarding completers, day-1 screen return was 27/113 (**23.9%**) and day-7 was 5/83 (**6.0%**). The low overall return rate therefore includes both onboarding loss and weak post-onboarding habit formation.

| First-onboarding cohort window | Day-1 return | Day-7 return | Day-30 return |
| --- | ---: | ---: | ---: |
| July 10–August 8 | 25/116 = 21.6% | 5/116 = 4.3% | 1/116 = 0.9% |
| August 9–September 8 | 6/36 = 16.7% | 1/36 = 2.8% | 0/36 |
| September 9–October 8 | 28/252 = 11.1% | 5/193 = 2.6% | Not mature |

These pooled cohorts suggest a persistent problem and lower recent day-1 return, but acquisition mix, product changes, identity behavior, and small samples prevent a clean release-level causal comparison.

Including the three test-like identities changes first breathing activation from 12.2% to 13.1%, day-1 return from 11.1% to 12.2%, and day-7 return from 2.6% to 3.1%. The overall diagnosis survives that sensitivity check.

### Early value is associated with coming back

For 193 first-ever onboarding starters with seven complete calendar days of follow-up:

| First UTC calendar-day behavior | Returned on any of days 1–7 |
| --- | ---: |
| Completed breathing | 8/14 = 57.1% |
| Did not complete breathing | 22/179 = 12.3% |
| Completed onboarding | 23/75 = 30.7% |
| Recorded a purchase completion | 8/16 = 50.0% |
| Completed dailies | 3/5 = 60.0% |

The exposure and return windows do not overlap. Breathing completers return about 4.7 times as often in this sample, but there are only 14 of them. Motivation, acquisition quality, payment, and residual testers can explain part of that association. This supports testing faster delivery of first-session value; it does not establish causation.

## Monetization and interruptions

| Observed surface | People exposed | Recorded purchase completers on matching placement/action |
| --- | ---: | ---: |
| Onboarding paywall | 217 | 22 |
| Cold-launch paywall, `app_boot` | 57 | 3 |
| Post-onboarding exit offer | 89 | 0 recorded acceptances |
| Idle-triggered exit offer | 8 | 0 recorded acceptances |
| Purchase-cancelled exit offer | 11 | 1 recorded acceptance |

The placement-level purchase counts are descriptive event aggregates, not a controlled attribution study. Overall, after excluding hidden anchor-price views, 229 unique actual paywall viewers led to 70 purchase starters and 26 purchase completers within the native 24-hour funnel (**11.4% viewer-to-completer**). Purchase-start-to-completer was 37.1%. There were 47 people with cancellation events; retries mean cancelled and successful populations can overlap.

The strongest interruption candidates:

- **Post-onboarding offer:** 89 people saw it, 86 recorded declining, and none recorded accepting. It appears after onboarding/tour/lesson transitions. Test removing or delaying it until after first useful activity. Zero observed conversions does not guarantee zero incremental revenue, but the current data gives little support for this interruption.
- **Cold-launch paywall:** 190 actual view events reached 57 people, or 3.3 load/view events per exposed person. Current navigation code presents it once per eligible cold process launch for non-Pro users. Only 19/57 started breathing and 14/57 completed it within 30 minutes after an exposure in a separate ordered funnel. Test a return experience that takes users directly to today's activity. The funnel cannot prove the paywall caused the other users to leave.
- **Day-three plan lock:** current code allows two completed free plan days, then gates further uncompleted plan content. This is a credible habit-formation risk, but **only one non-test-like `locked_week_tap` view** appeared in the main window. It is not established as the dominant historical retention cause. Current working-tree behavior may differ from shipped builds.

Common recorded onboarding prices were USD $7.99 weekly / $59.99 annual, with discounted exit prices $5.99 / $39.99. Other storefront currencies differ. Trial availability varies. Price sensitivity is a hypothesis; there is no controlled price test here. Client-side purchase completion can include trial or sandbox purchases and is **not confirmed cash revenue**. RevenueCat/App Store renewals, trial conversion, refunds, cancellations and paid churn require subscription data outside these events.

## Feature use and repeated engagement

| Feature completion in main window | People | People completing on at least two UTC days |
| --- | ---: | ---: |
| Breathing | 45 | 12 |
| Lessons | 53 | 8 |
| Mood check-in | 38 | 9 |
| Dailies | 35 | 9 |
| Room decoration placement | 35 | 8 |

These are period usage distributions, not age-adjusted retention rates. New users have fewer repeat opportunities.

Breathing had 66 unique starters and 45 completers in a standalone 24-hour funnel (**68.2%**). The month contained 254 start events, 166 completion events, and 91 abandonment events, but they cannot be reconciled as 254 distinct sessions: abandonment can occur before the start event, starts/ends lack an exercise session ID, and OS exits can be unobserved.

Among recorded abandonments, 37 were during inhale (median elapsed 4 seconds), 23 during exhale (median 18 seconds), and 18 during intro/placement before exercise start. Test the first seconds of instructions and lead-in, and inspect real recordings before redesigning timing or adding controls.

Only 2 people had tracked attention starts, with no completed attention events after the three-identity exclusion. Current attention instrumentation is recent, so neither demand nor historical quality can be established.

The room loop reaches 35 placement users, but only 8 placed on multiple UTC days; most sampled users never establish the repeated loop. Its proposed earn → picker → placement funnel is currently invalid because tracking misses the main inline picker and some reward claims.

## Acquisition and reminders

Self-reported acquisition respondents:

| Source | Respondents | Completed onboarding in window | Completed breathing in window |
| --- | ---: | ---: | ---: |
| Instagram | 86 | 49 | 11 |
| Facebook | 67 | 28 | 7 |
| Other | 40 | 29 | 13 |
| TikTok | 13 | 7 | 2 |
| App Store search | 13 | 8 | 3 |

Source is collected partway through onboarding, so this omits earlier abandoners. These are within-window associations, not ordered source conversion funnels or paid-attribution metrics. No spend, campaign or creative data was available. Facebook's weaker completion and social-source breathing uptake justify comparing ad promises with the first in-app experience; these data do not justify cutting a channel.

Reminder permission is not the obvious primary blockage: onboarding recorded 146 granting users and 22 denying users, with possible repeated/changed responses. Notifications recorded 61 tap events from 26 people. The 6,459 `notification_scheduled` events from 163 people represent scheduling operations, **not delivered notifications or messages seen**. An open rate cannot be calculated from that denominator, and a high scheduling count is not evidence of notification spam.

## Reliability and data quality

Observed technical failures are smaller than activation losses, but capture is incomplete:

- 26 paywall-failure events from 7 people; 23 were missing-offering errors affecting 4 people. The other three were App Store, deferred-payment and purchasing-restriction errors.
- 10 captured exception events from 4 people, including breathing/breath-hold completion failures. These deserve investigation because failed saving can undermine trust.
- Exception autocapture is not enabled. These figures cannot establish crash rate or rule out performance problems.
- Replay is enabled in the project, but this connector lacks replay-read scope. No recordings were watched. Rage-click events alone were not treated as proof of broken controls.

Measurement corrections to make before interpreting the dashboard:

1. **Default dashboard is using inactive events.** Saved [DAU insight](https://us.posthog.com/project/395052/insights/JVCjX7rG) uses `$pageview OR $screen`; saved [retention insight](https://us.posthog.com/project/395052/insights/ajKaF2d0) uses `$pageview`. Neither event is recently emitted by this mobile app. Replace these definitions with actual mobile events and distinguish active viewing from completed value.
2. **Environment labels disappear.** 50,907/90,788 events (56.1%) lacked `analytics_env`. Initial signed-out auth handling and sign-out call `posthog.reset()`, clearing registered super properties; bootstrap registration runs once. Re-register after reset and verify first-launch/login/logout event identity. See [identity.ts](../../src/services/analytics/identity.ts) and [authIdentitySyncCore.ts](../../src/services/supabase/authIdentitySyncCore.ts).
3. **Test users are not identified.** The configured internal cohort has zero members despite conspicuous test behavior; production TestFlight also shares production analytics. Add explicit build distribution and internal-account classification.
4. **Hidden hooks emit paywall exposures.** Anchor-price-only `usePaywall` instances emitted 185 `profile_upgrade` views. Those are not visible paywalls. Actual view reloads can also generate fresh IDs without proving a new screen exposure. Track presentation separately from pricing load. See [usePaywall.ts](../../src/hooks/usePaywall.ts), [ExitOfferScreen.tsx](../../src/screens/ExitOfferScreen.tsx), and [ExitOfferSheet.tsx](../../src/components/paywall/ExitOfferSheet.tsx).
5. **Room events miss the current path.** Legacy picker events recorded only 5 opens from one person while the shared placement mutation recorded 72 placements from 35 people. Reward-unlock capture also depends on a celebration snapshot; a ready reward reopened from Home can bypass it. Move semantic tracking to the owner shared by actual flows. See [useDailyRewardStage.ts](../../src/features/room/useDailyRewardStage.ts), [useTrackDailyCompletion.ts](../../src/features/room/useTrackDailyCompletion.ts) and [usePlaceDecorationMutation.ts](../../src/queries/room/usePlaceDecorationMutation.ts).
6. **No consistent exercise-session identifier.** Add one shared by entry, start, completion, abandonment and saved-session result; record pre-start cancellation separately. Capture teardown endings according to a defined lifecycle policy. See [GuidedBreathingSessionScreen.tsx](../../src/features/exercise/guidedBreathing/GuidedBreathingSessionScreen.tsx).
7. **Existing returning flags are not cohort retention.** `is_returning_d1/d7/d30` measure elapsed time since the previous open; `app_opened` is cold bootstrap. Do not combine custom and SDK lifecycle events as independent activity. See [appSession.ts](../../src/services/analytics/appSession.ts).
8. **First-run tour inflates discovery.** An eleven-stop tour visits multiple screens and prompts the first lesson. Add tour entry/completion/skip events so prompted activity can be separated from self-directed discovery.

## Prioritized next work

| Priority | Action or experiment | Success measure |
| --- | --- | --- |
| P0 | Repair mobile dashboard definitions, identity/super-property resets, test-user filtering and false paywall exposures | Verified real-user cohorts and exposure counts across first install/login/logout/relaunch |
| P1 | Put a short guided session before the full assessment and purchase ask; ask only essential questions first | Newcomer first-session completion within 24h; mature day-1/day-7 return; purchase and trial outcomes as guardrails |
| P1 | Test removing/delaying the post-onboarding offer and cold-launch paywall, independently | Completed activity per returning user; mature seven-day return; subscription conversion guardrails |
| P2 | Simplify Home's first action and make the next session easy to resume; shorten or defer the tour | Onboarding completion → activity completion; next-day activity completion |
| P2 | Validate pre-start/first-inhale friction with recordings and a release-build walkthrough | Entry → start → completion using stable session IDs; first-10-second exits |
| P2 | Repair room funnel tracking and investigate save/offering failures | Earned reward → placement and next-day activity; canonical save success |
| P3 | Test the timing of the two-day free-plan limit once cohort tracking is reliable | Activity on days 3–7, paid conversion and trial-to-paid retention |
| P3 | Compare acquisition creative promises and optional reminder timing using clean cohorts | Cost per activated/retained user, not raw onboarding or install counts |

Run sequential or properly randomized tests rather than changing assessment, paywall, tour and free limits simultaneously. The current sample size is too small to divide into many reliable experiments. Define the primary activation metric, maturity rules and revenue guardrails before rollout.

## Summary of learnings

The data supports prioritizing first-session value and monetization interruptions. Onboarding loses over half its starters, and only about a quarter complete any tracked activity within the first day. Early breathing completion is associated with substantially better return usage. Exact day-7 screen return remains low across recent and older cohorts. Existing dashboard definitions and several event ownership issues obscure the picture, so fix measurement alongside focused activation experiments. A day-three gate, reminder strategy, acquisition mismatch and technical performance remain candidates that need better evidence, rather than established explanations.

