# Finding PMF for Azora — One-Week Plan

Source: RevenueCat, "Product-market fit for subscription apps" (revenuecat.com/blog/growth/product-market-fit-subscription-apps). Superhuman's PMF engine (Rahul Vohra, First Round Review) is added where the article's survey needs an analysis method.

Written 2026-10-22.

---

## 0. Plain-English summary

### What PMF means
Product-market fit is when a specific group of people needs your product so much that they keep using it and keep paying, without you pushing them. It isn't all-or-nothing. Azora might have it for one type of user and not for others. The first job is to find out who that group is, if it exists.

### How you tell (5 checks)
1. **The survey:** ask "How would you feel if you couldn't use your Azora plan anymore?" If 40% say "very disappointed," that's PMF.
2. **Word of mouth:** if 15% or more of new users come from friends telling them, that's a strong sign.
3. **Reviews:** compare how often people rate you and how high against competitors. Fewer ratings per download plus a low rating is a bad sign.
4. **Retention:** do users stop dropping off after about 4–8 weeks? Fit looks like a curve that falls, then flattens.
5. **Paying:** the hard paywall already tests this. If people won't pay, the promise isn't landing.

### Where Azora stands against the category
Health & Fitness numbers from RevenueCat's 2026 report (full detail in §6):

| Metric | What it measures | Typical (median) | Strong (top quarter) |
|---|---|---|---|
| Trial → paid | Of people who start a trial, how many pay | 37.7% | 51%+ |
| Download → paid, hard paywall (all categories) | Of all downloads, how many end up paying | 10.7% | 20%+ |
| Day-0 cancellations, 7-day trial (all categories) | Share of trial cancellations that happen on the day the trial starts | 39.8% | — |
| Value of a payer, first year | Revenue per paying user in year one | $35.64 | — |

- **The 10.7% is the one to watch.** Health & Fitness overall is 2.9%, but that includes free apps. Azora has a hard paywall, so compare to 10.7%.
- **Most trial cancellations happen on day 0 or 1.** Plan day 1 has to show the promise right away.

### Why the one-week plan has those steps
- **Day 1:** send the survey to existing users now instead of waiting weeks for new ones, invite people to calls, and write down today's numbers.
- **Days 2–4:** user calls tell you *why* behind the survey scores.
- **Day 5:** analyze only the "very disappointed" users:
  - who they are is your market
  - why they love it is your real promise
  - what holds back similar "somewhat disappointed" users is your fix list
- **Day 6:** point ads at that group, fix plan days 1–7, and freeze other features.
- **Day 7:** write it up and recheck every 2 weeks.

### Caveats
- There's no public survey benchmark for this category, so 40% is a general number. Sean Ellis has written about a 55% score that still came with retention problems, so always read the survey alongside the retention curve.
- No public month-1 renewal or refund rates were found for Health & Fitness, and no verified Finch/Fabulous revenue. RevenueCat Charts in the dashboard has the renewal benchmarks.
- Finch's numbers (users coming back after 1 day: 54%; after 7 days: 37%) come from an undated Sensor Tower teardown. Treat them as a rough bar only.

---

## 1. Ground rules

- **Azora's product is the plan.** Breathing, Resets, lessons, routines and check-ins are parts of the plan. Measure PMF at the plan level: does the plan keep its promise well enough that people stay and pay?
- **If you're asking whether you have PMF, you don't yet.** The article says the job is to find out how far off you are.
- **PMF is a spectrum, not yes/no.** It can exist for one segment and not others.
- **One week can't prove PMF.** The strongest signal is a retention curve that flattens at weeks 4–8. One week can produce the measurement, the segment that already has fit, and the fix list.

---

## 2. What the article says

### What PMF is
The app's value matches the needs of a **well-defined** market, so subscribers buy in and stay. A match is needed from both sides: the right product for the right people. When some users love it and others churn, the fix can be **targeting**, not product.

### Signals that you have it
- Users return on their own, not only when prompted by notifications.
- Users stay month after month, even with bugs.
- Users refer others, with referrals at **15%+ of new users**.
- Users are eager to give feedback.
- Users pay rather than only using the app free or at a discount.
- The retention curve **flattens around weeks 4–8**.
- Users reach the "aha" moment without heavy guidance.

### Five ways to measure it

| # | Method | Benchmark / how |
|---|---|---|
| 1 | **Sean Ellis survey** | **40% "very disappointed"** = PMF. Four answer options: very / somewhat / not disappointed / I no longer use it. Follow with "Why?" Survey only users **past the aha moment**, and get **a few hundred** responses. Segment results. Free tool: pmfsurvey.com |
| 2 | **NPS + word of mouth** | Ladder found Ellis answers track NPS closely: "very disappointed" users had much higher NPS. Referrals 15%+ of new users = strong signal |
| 3 | **Review rate + rating** | Prompt for reviews near the aha moment. A slower ratings-per-download rate (DPR) than competitors plus a low average rating = weak PMF |
| 4 | **Engagement + retention** | Benchmark month-1 and annual renewals **against your category**, not absolute targets. Know the use case: the best subscribers aren't always the heaviest users. Martin Siniawski: start with monthly plans to learn faster |
| 5 | **Willingness to pay** | A hard paywall validates this early, and Azora has one. Low conversion = the value proposition isn't landing |

### Survey timing
- **Too early** (before the aha moment) gives a falsely negative result.
- **Too late** (only long-term survivors) overstates fit.
- For Azora, survey from **plan day 3 onward**, ideally day 7.

### How to reach PMF (Andres Barreto's framework)
1. **Discover pain.** Research the must-solve problem, not a nice-to-have.
2. **Run experiments.** Watch behavior, not opinions. Use prototypes and **painted door tests** (a button or card that measures taps with nothing built behind it).
3. **Kill what fails.** Drop features and ideas that don't move the numbers.

Do **one thing extremely well**. Photoroom nailed background removal before building a broader editor. Ladder (efficient workouts) and TalkingParents (co-parenting) also won by focusing on one job.

### Cautionary example
Eric Duffet spent **five years** on a golf meditation app that failed because golfers didn't want it. For his second app, Shot Pattern, he tested demand publicly on Twitter and watched trialists react in real time before building much.

### Traps
- **Growth trap** (Eric Seufert): scaling paid acquisition before retention exists. The churn turns into a treadmill that keeps speeding up.
- **"One more feature" trap:** endlessly polishing or adding features instead of fixing the core. You also need a large enough user group to learn from.
- **Fundraising as a fix:** capital adds pressure to build features or buy growth too early.

### Once basic retention exists
- **Growth sandwich** (Seufert): run paid marketing and product optimization together, each feeding the other.

### Market sizing (sanity check)
- **TAM:** only people **desperate** to solve the problem, not everyone who has it.
- **SAM:** model **2–15%** capture, depending on competition.
- **ARPU:** revenue per paying user. SAM × ARPU tells you whether the niche is worth winning.

### After PMF (not yet)
- **Product-model fit:** match packaging, trial, funnel and pricing to usage. Ladder ran user interviews and Van Westendorp pricing research, launched a cheaper tier for a broader audience, and moved to annual plans.
- **Channel fit:** find channels with workable payback. Paired won on social media. TikTok never worked for Blinkist, which won on Taboola and Outbrain.

### PMF can disappear
Astropad lost its PMF overnight when Apple shipped Sidecar, and pivoted to a pro workflow. AI is the current disruptor (Duolingo is continuously testing it). Revisit PMF regularly.

---

## 3. The one-week plan

### Day 1: launch everything

**1. Survey (about 2 hours).** Set it up in PostHog Surveys in-app, and also email everyone past plan day 3, **including cancelled users**. Email reaches existing users now; waiting for new users to hit day 7 would take weeks.

Questions (the first is the article's; questions 2–4 are Superhuman's additions, which make the results usable):
1. How would you feel if you could no longer use your Azora plan?
   *Very disappointed / Somewhat disappointed / Not disappointed / I no longer use Azora*
2. What type of person do you think would benefit most from Azora?
3. What is the main benefit you get from Azora?
4. How can we improve Azora for you?

With fewer than a few hundred responses, treat the score as directional.

**2. Call invites (30 min).** Pull about 50 users who finished plan day 7 and about 50 who dropped off before day 3. Use the email in §4.

**3. Baseline numbers (about 2 hours).** Record the current value of each:

| Metric | Source | Benchmark |
|---|---|---|
| Trial → paid | RevenueCat Charts | H&F median 37.7%, top quartile 51.4%+ (§6) |
| Download → paid (day 35) | RevenueCat Charts | Hard paywall median 10.7%; H&F median 2.9% (§6) |
| Month-1 renewal | RevenueCat Charts | No public H&F number; use RevenueCat Charts' benchmark view |
| Day-0 trial cancellations | RevenueCat | 7-day trials: 39.8% cancel on day 0 (§6) |
| Referral / organic share of new users | AppsFlyer | 15%+ = strong |
| Ratings per download (DPR) + average rating | App Store Connect | 1–2 direct competitors |
| Plan-day funnel: day 1 → 3 → 7 → 14 → 30 | PostHog | Look for the cliff |
| Weekly retention curve, paid users | PostHog / RevenueCat | Flattens by week 4–8? |
| North star: 5+ sessions in 7 days, trial starters | PostHog | Split by purchase status |

### Days 2–4: user calls
**4.** Run 10 calls (about 3 a day), 20 minutes each, using the script in §4. Fill in the three-part notes within 10 minutes of each call.

### Day 5: analyze (Superhuman method)
**5.** Look only at the **"very disappointed"** responses:
- **Who are they?** Plan archetype, age, goal and onboarding answers. This is the market where you have fit.
- **Why do they love it?** Their answers to Q3 are the plan's real promise, in their words.

**6.** Take the **"somewhat disappointed"** users whose main benefit (Q3) **matches** the very-disappointed group's. Their Q4 answers are the fix list.

**7.** **Ignore "not disappointed"** responses. Those users aren't the market, and building for them pulls the plan away from the people who love it.

**8.** Calculate the score **within the target segment** too. Superhuman went from 22% overall to 33% just by narrowing to its segment, then reached 58% by working the fix list.

### Day 6: decide
**9. Target market.** Narrow Meta targeting and ad copy to the "very disappointed" profile, using their words. Keep the budget **flat** (growth trap).

**10. Plan fixes.** Pick the top 1–2 blockers from the fix list, only for **plan days 1–7**. Anything that takes more than a day to build gets a painted door test first.

**11. Feature freeze.** No new features outside the plan's first week until the next check. Kill anything that doesn't serve the promise from step 5.

### Day 7: write up and set the check
**12.** Fill in §5 below.

**13.** Every **2 weeks**, rerun the survey on new day-7 users and recheck the plan-day funnel.

**PMF evidence:** 40%+ "very disappointed" within the target segment, **and** a paid retention curve that flattens by week 4–8. Only then scale spend, using the growth sandwich.

---

## 4. Templates

### Call invite email
> Subject: 20 min to help shape Azora?
>
> Hi {name}, I'm Kevin, I build Azora. You started your plan a little while ago and I'd love to hear how it went, good or bad. It's a 20-minute video call and I'll send a $25 gift card as thanks.
>
> Pick a time: {calendly link}

Send it from a personal address, not a no-reply. Use a gift card rather than free Pro, because free Pro skews the dropout group.

### Call script (Mom Test rules: past behavior, not opinions)
1. Take me back to when you downloaded Azora. What was going on?
2. What were you hoping the plan would do for you?
3. Walk me through the last time you opened it. (For dropouts: the last day you used it.)
4. What did you try before Azora? What do you use now?
5. Did it do what you expected? Where did it fall short?
6. *(Active users only)* If Azora disappeared tomorrow, what would you do?

Don't pitch, defend or ask "would you use X?"

### Notes per call
- **Their words for the problem:**
- **The outcome they expected:**
- **Where it broke:**

---

## 5. Results (fill in on day 7)

- Responses: __ (very __% / somewhat __% / not __% / no longer use __%)
- PMF score in target segment: __%
- Target segment:
- The plan's promise, in users' words:
- Fix list (top 2):
- Baselines: trial→paid __ · M1 renewal __ · referral share __ · DPR __ · day-7 plan reach __
- Next check date:

---

## 6. Category benchmarks — Health & Fitness

Azora is listed under Health & Fitness, but it competes in the self-care, habit and life-reset space: Finch, Fabulous, Life Reset, Noom, BetterMe (see `competitive-research.md`, `icp-research-2026-10-13.md`). RevenueCat doesn't break out self-care, so H&F is the closest public benchmark. All numbers are medians unless marked.

### RevenueCat State of Subscription Apps 2026 (H&F)

| Metric | Median | Top quartile (P75) |
|---|---|---|
| Download → trial (day 30) | 6.9% | top performers 23%+ |
| Download → paid (day 35) | 2.9% | 6.2%+ |
| Trial → paid | 37.7% | 51.4%+ |
| Trials started on day 0 | 82.1% | — |
| Revenue per install, day 14 | $0.48 (highest category) | — |
| Revenue per install, day 60 | $0.66 | — |
| Realized LTV per payer, month 1 | $24.23 | $39.00+ |
| Realized LTV per payer, year 1 | $35.64 | — |
| Price: monthly / weekly / yearly | $9.99 / $4.99 / ~$39.94 | — |

H&F packaging norms:
- 54% of trials are 5–9 days.
- Only 18.3% of apps offer no trial (the lowest of any category).
- 59% mix trial strategies.
- 60% use two-plan paywalls.

**Earlier years, for trend:** trial → paid was 44.5% (P75 58.8%) in the 2024 report and about 39.9% (top 10%: 68.3%) in the 2025 report, per secondary write-ups. The median is drifting down.

### Hard paywall vs freemium (all categories, 2026)

| Metric | Hard paywall | Freemium |
|---|---|---|
| Download → paid (day 35) | 10.7% (P75 20.0%, P90 38.7%) | 2.1% |
| Revenue per install, day 14 | $2.32 | $0.27 |
| Revenue per install, day 60 | $3.09 | $0.38 |
| Year-1 retention | "nearly identical" (no figure given) | — |

**What this means for Azora:** with a hard paywall, compare download → paid against **10.7%**, not the H&F 2.9%. Being below 10.7% suggests the onboarding and plan reveal aren't convincing people.

### Trial length and cancellations (all categories, 2026)

| Trial length | Trial → paid median | P75 |
|---|---|---|
| ≤ 4 days | 25.5% | 38.5% |
| 5–9 days | 37.4% | 52.8% |
| 17–32 days | 42.5% | 59.4% |

- 7-day trials: **39.8% of cancellations happen on day 0** and 64% by day 1. Most cancellations come right after purchase, before the plan has had a chance.
- 3-day trials: 55% cancel on day 0, and 84% by day 1.
- 30% of annual subscriptions are cancelled in the first month (2025 report, all categories).

**What this means for Azora:** the PMF problem shows up first on **day 0–1**. Plan day 1 has to deliver the promise from the ad and the plan reveal immediately. Compare Azora's own day-0 cancel share with 39.8%.

### Competitor signals (third-party, treat as directional)

| App | Signal | Source / caveat |
|---|---|---|
| Finch | D1 54% / D7 37% retention (Duolingo is 51% / 35%) | Deconstructor of Fun, using Sensor Tower data; undated |
| Finch | 4.59★ across 40,294 reviews, 82.1% positive, top 25% in Appbot benchmarks | Appbot, Aug 2025–Aug 2026 |
| Habit/journal category | Dominant model: free trial + soft paywall | screensdesign.com |

Finch is the bar for "users return unprompted" in this space. It gets there through emotional attachment to a pet, not through the plan itself.

### PMF survey benchmarks
- No public PMF survey ("very disappointed") benchmark exists for H&F or consumer subscription apps. **40%** is Ellis's general benchmark.
- Ellis himself warns a high score can coexist with poor retention. He described a 55% score with retention problems. Always read the survey **together with** the retention curve.

### Not found
- Public H&F month-1 or annual renewal rates.
- Public refund rates.
- Verified Finch or Fabulous revenue.
- Use RevenueCat Charts' in-dashboard benchmarks and Sensor Tower or Appfigures for these.

### Sources
- [RevenueCat — State of Subscription Apps 2026](https://www.revenuecat.com/state-of-subscription-apps)
- [RevenueCat — State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025)
- [RevenueCat — State of Subscription Apps 2024](https://www.revenuecat.com/state-of-subscription-apps-2024)
- [Vmobify — Free trial conversion benchmarks 2026](https://vmobify.com/blog/free-trial-conversion-rate)
- [Deconstructor of Fun — Finch gamified widgets](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl)
- [Appbot — Finch reviews analysis](https://appbot.co/blog/finch-app-reviews-emotional-attachment-user-retention-product-loyalty/)
- [screensdesign — Habit journal apps](https://screensdesign.com/categories/habit-journal-apps/)
- [Sean Ellis — High PMF score but low retention](https://seanellis.substack.com/p/high-pmf-score-but-low-retention)

---

## 7. After week 1: getting to PMF

Week 1 only measures and aims. PMF is built in the cycles after it. The RevenueCat article gives the principles (find the pain → experiment → kill, do one thing well, avoid the traps) but no step-by-step. The cycle below is Superhuman's PMF engine (Rahul Vohra) applied to Azora's plan.

### The cycle (every 2 weeks)

| Step | What | Output |
|---|---|---|
| 1. Survey | Show the 4-question survey to every new user on **plan day 7** | PMF score overall **and within the target segment** |
| 2. Segment | Re-sort the "very disappointed" users by archetype, goal and onboarding answers. Is the target segment still right? | Target segment (confirmed or narrowed) |
| 3. Read | Main benefit (Q3) from "very disappointed" users = what to protect. Improvements (Q4) from "somewhat disappointed" users with the **same** main benefit = what to fix | Two lists: *love* and *blockers* |
| 4. Build | **Half** the cycle's work on *love* (make the promise stronger), **half** on *blockers*. Only plan days 1–7 until day-7 retention moves | 1–3 shipped plan changes |
| 5. Measure | Plan-day funnel (1 → 3 → 7 → 14 → 30), day-0 trial cancellations, trial → paid, survey score | Before/after numbers |
| 6. Kill | Anything that didn't move a number and doesn't serve the promise gets removed | A shorter plan, not a longer one |

Ignore "not disappointed" users throughout. Building for them pulls the plan away from the people it already works for.

### Where to push first, in order

1. **Plan day 0–1.** In H&F, 39.8% of 7-day trial cancellations happen on day 0 (§6). The first session has to deliver a visible piece of the promise from the ad and the plan reveal: one finished thing, not a tour.
2. **Ad → onboarding → plan promise match.** The words from "very disappointed" users (Q3, calls) become the ad copy, the plan reveal copy and the plan's day-1 task. If any of the three promise something else, people churn. That's the article's "match from both sides".
3. **Targeting.** Narrow Meta targeting to the target segment. The article: when some love it and others churn, the fix may be **who**, not **what**.
4. **Plan days 2–7.** Find the drop-off day in the funnel and fix that day's content.
5. **Everything outside the plan** (room, coins, extras) waits. That's the "one more feature" trap.

### Run cheap experiments
- **Painted doors** for anything that would take more than a day: a card, button or plan-day option that only measures taps.
- **Ad copy as a test:** run 2–3 ad angles built from users' own words, at equal small budgets. The angle with the best trial → paid rate tells you which promise people pay for. Use AppsFlyer as the source of truth.
- **One change at a time per plan day,** so you know what moved the number.

### Track every cycle

| Metric | Target | Why |
|---|---|---|
| PMF score, target segment | **40%+** | The article's core benchmark |
| PMF score, overall | Rising | Shows whether the segment is widening |
| Paid retention curve | **Flattens by week 4–8** | The article's strongest behavior signal |
| Day-0 trial cancellations | Below 39.8% | H&F 7-day benchmark (§6) |
| Trial → paid | 37.7% median → 51.4% top quarter | H&F benchmark (§6) |
| Download → paid (hard paywall) | 10.7% median → 20% top quarter | All-category hard-paywall benchmark (§6) |
| Referral / organic share | 15%+ | The article's word-of-mouth signal |
| North star: 5+ sessions in 7 days | Rising, split by purchase status | Activation |

### Decision rules
These are working rules, not from the article. Adjust once real data exists.

- **Segment score rising each cycle:** keep going, same segment.
- **Segment score flat for 2 cycles:** the fixes aren't the problem. Go back to calls and re-check the pain (the article's "discover pain" step). Is it a must-solve problem for this segment?
- **No segment above ~25% after 3 cycles (about 6 weeks):** the promise itself is off. Test a different promise or segment using the ICP options in `icp-research-2026-10-13.md` (e.g. household overwhelm), with painted doors and ad tests before building.
- **40%+ in segment and the curve flattens:** PMF for that segment. Move to the growth sandwich: raise Meta spend in steps while still running the cycle. Then work on product-model fit (pricing, trial length, annual vs monthly) and channel fit (§2, "After PMF").

### What not to do while getting there
- Don't scale ad spend before the curve flattens (growth trap).
- Don't add features outside the plan (one-more-feature trap).
- Don't judge by heavy usage. The best subscribers aren't always the heaviest users (article).
- Don't trust a high survey score on its own. Ellis has seen a 55% score with poor retention. Score **and** curve together.
- Don't change many things at once. One change per plan day per cycle.

### Calendar

| Weeks | Focus |
|---|---|
| 1 | Measure and aim (§3) |
| 2–3 | Cycle 1: plan day 0–1 + ad/promise match |
| 4–5 | Cycle 2: biggest plan-day drop-off in days 2–7 |
| 6–7 | Cycle 3: decision point (keep, re-check the pain, or change the promise) |
| 8+ | If 40%+ and flattening: growth sandwich. If not: keep cycling |
