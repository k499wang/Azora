# Company-published data on plan pacing, daily load and daily reward loops (habit/self-improvement apps)

Global caveat: every company number below is **company-supplied** (blog, vendor case study, investor letter or staff-authored paper) unless stated otherwise. None are independently audited. Most are A/B tests with relative lifts that leave out baselines, or observational cohort comparisons with selection bias. Vendor case studies (Firebase, Amplitude, Iterable) are marketing material.

## Fabulous: published metrics on journeys, retention and onboarding experiments

### Takeaway
Fabulous's only public numbers are from 2016–2018 Google/Firebase marketing: a 2x retention claim for customized/invite-based onboarding, and an A/B test where **removing** commitment steps from onboarding raised completion with no retention loss. I found no published journey-pacing or retention-curve data.

### Cited Findings
- Firebase case study (company-supplied, ~2016): users with a "customized onboarding flow" built on Firebase Invites/Dynamic Links (a friend's personalised "partner up" invite) returned "twice as often" as regular users. CEO Sami Ben Hassine said "We saw twice the retention rate among users with customized onboarding flow than among regular users". The comparison is invited users versus organic users, so it is confounded by selection: people invited by a friend differ from organic installs. — [Firebase Fabulous case study PDF](https://firebase.google.cn/downloads/Firebase_Fabulous_Case_Study.pdf?hl=it)
- Hassine framed the accountability partner idea as "When you have a friend going with you, it's more fun… The Fabulous journey is exactly the same, so why don't you invite a friend?" — [same PDF](https://firebase.google.cn/downloads/Firebase_Fabulous_Case_Study.pdf?hl=it)
- Google Android Developers blog (Jan 2016, company-supplied): users who arrived via App Invites showed "2x the Life Time Value". — [Android Developers Blog](https://android-developers.googleblog.com/2016/01/how-fabulous-and-yummly-grew-with-app.html?hl=es_CL)
- Firebase A/B Testing announcement (2018), as summarized secondhand: removing two onboarding steps (a letter and a routine-commitment prompt) raised onboarding completion by 7% and did not hurt retention. I did not fetch the primary page; the sources are the Plushcap summary and an Italian Google dev blog. — [Plushcap summary](https://www.plushcap.com/content/firebase/blog/firebase-announcing-better-ab-testing-with-firebase); [Google Developers Italia blog](https://developers-it.googleblog.com/2018/01/testing-ab-migliore-con-firebase.html)
- Fabulous is described as incubated at Duke's Center for Advanced Hindsight (Dan Ariely's lab). The sources are a company hiring page and third-party reviews; no CAH paper or metric was found. — [Hired company page](https://hired.com/company/the-fabulous)

### Inferences
- The 7% completion test (if accurate) is the most relevant data point for pacing. Cutting a commitment ritual from onboarding helped completion and did not cost retention, so heavy up-front commitment steps are not automatically retention-positive.
- The 2x figures describe social/invite acquisition more than journey pacing. They should not be cited as evidence for any pacing design.

### Gaps
- No public Fabulous data on journey length, number of habits per week, unlock cadence, D1/D7/D30 retention, or trial conversion, 2019–2026.
- No published Ariely/CAH study of Fabulous outcomes found.

## Finch: founder statements on retention, the pet framing, and Journeys → Self-Care Areas

### Takeaway
Finch has published no retention or DAU/MAU figures that I could find. The pet framing is explained qualitatively ("take care of your pet by taking care of yourself"). Finch replaced Journeys with Self-Care Areas because, by its own account, Journeys was hard to understand, little used, and hurt habit formation for many users. It moved to lightweight weekly milestones (2/4/6 days).

### Cited Findings
- The co-founders are Stephanie Yuan and Thomas Aquinas Nugraha Budi, not "Nino Jose" as the brief guessed. Both had experienced depression/anxiety. The concept: users "take care of their pets by taking care of themselves"; goals range from basic hygiene upward, and the pet gains strength to go on adventures. — [Paste Magazine](https://www.pastemagazine.com/article/finch-app-mental-health-virtual-pet-self-care)
- Yuan cited making self-care "fun" and Jane McGonigal-style gamification as influences. — [Disha Bhatia Substack interview](https://dishabhatia.substack.com/p/the-self-care-bird-app-finch)
- A Finch founder AMA transcript (July 2026, Notion-hosted; provenance unverified) says the team deliberately avoided the "just sit down and meditate" model. — [Finch Founder AMA transcript](https://app.notion.com/p/Finch-Founder-AMA-Recording-Transcript-July-17th-2026-3a0578a0b48e806c949eec5b1c90d544)
- Journeys → Self-Care Areas (company announcements on r/finch, via a mirror; the year is not stated in the snippet). The switch was optional from April 15 and mandatory from May 12, and goals/history carried over. Stated reasons: Journeys was "hard to understand", most users had stopped using it, and Journeys "hurt many users' habit formation". Weekly per-area milestones were later added, with rewards at **2, 4 and 6 days** per week (not 7). — [r/finch mirror](https://lr.us.psf.lt/r/finch); [r/finch mirror 2](https://lr.in.psf.lt/r/finch); [Finch Self-Care Areas FAQ](https://befinch.notion.site/Self-Care-Areas-FAQ-1a4578a0b48e80bfbd85e85a6008180f) (the FAQ page did not render for me, so its content is unverified)
- Growth came mostly from word of mouth plus performance marketing before a national campaign. — [MediaPost](https://www.mediapost.com/publications/article/415234/)
- Third-party (not company) review analysis: 40,294 iOS/Play reviews (Aug 2025–Aug 2026) averaging 4.6 stars, about emotional attachment. This measures sentiment, not retention. — [Appbot](https://appbot.co/blog/finch-app-reviews-emotional-attachment-user-retention-product-loyalty/)

### Inferences
- The 2/4/6-days-per-week milestone design asks for less than daily. Finch is explicitly targeting a mental-health/low-energy audience, and it sets the weekly target below 7, which supports partial-credit, forgiving pacing for burnout users.
- Finch abandoned a sequential, multi-step "journey" structure on its own initiative because it was hard to understand and hurt habit formation. That is directly relevant evidence against long linear programs, though it is qualitative and company-stated.

### Gaps
- No Finch retention, DAU/MAU, or experiment numbers found.
- Exact year of the Journeys → Self-Care Areas switch not confirmed; the primary post text could not be fetched (likely 2025).

## Duolingo: streaks, daily goals, streak freeze, path, notifications

### Takeaway
Duolingo's most relevant published experiment is a **lowering of daily load**. In late 2019 it decoupled the streak from the daily goal so that **one lesson** extends the streak. The 7+ day streak share rose by 40%+, D14 retention by 3.3% (relative), and DAU by 1%, at the cost of fewer users hitting the daily goal. Duolingo explicitly chose daily consistency over daily volume.

### Cited Findings
- "Improving the streak" (Anton Yu, Nov 19 2020; company blog). The change, made about a year earlier, was that the streak now extends on **one lesson/day** instead of on reaching the daily goal. A/B results (relative): **+3.3% D14 retention, +1% DAU, +10.5% daily learners on a streak within 20 days, +19% for new learners, >40% more learners on a 7+ day streak**. A year later "just over half" of daily learners had a 7+ day streak, up from about a third. — [Duolingo blog](https://blog.duolingo.com/improving-the-streak)
- Same post: learners with a 7+ day streak were **2.4x** more likely to return the next day (observational). About **40%** of learners active two days in a row without a streak had chosen the "Intense" (highest) daily goal, i.e. an ambitious goal was breaking streaks. Trade-off: fewer learners reached their daily goal; Duolingo judged that lowering the barrier to a daily habit mattered more, "at least early on". — [Duolingo blog](https://blog.duolingo.com/improving-the-streak)
- Jorge Mazal (former CPO) in Lenny's Newsletter (company-insider account). DAU grew **4.5x over four years** (2018–~2021), from single-digit YoY growth in mid-2018. Current User Retention Rate (CURR) rose **21%**, and daily churn among the best users fell **>40%**. CURR's modelled impact on DAU was **~5x** that of the next lever. The 7+ day streak share of DAU nearly **tripled to more than half**. Leaderboards brought **+17% learning time** and **3x** highly engaged learners (1+ hr/day, 5 days/week). The referral program brought **+3%** new users. Moves-counter gamification had no measurable effect. — [Lenny's Newsletter, "How Duolingo reignited user growth"](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
- Jackson Shuttleworth (Group PM, Retention), Lenny's podcast: 600+ streak experiments. Changing the CTA from "continue" to "**commit to my goal**" "significantly increased retention", and letting users pick a streak goal also did. **No figures were given publicly.** Tying streaks to XP confused users, and the fix was "one lesson a day". First-week retention is the most fragile. — [Lenny's Newsletter episode page](https://lennysnewsletter.com/p/behind-the-product-duolingo-streaks)
- Econsultancy (secondary): an earlier test showing the streak count always at the top of the app gave **+3% DAU, +1% D14**. — [Econsultancy](https://econsultancy.com/six-a-b-tests-used-by-duolingo-to-tap-into-habit-forming-behaviour/)
- Notifications: Yancey & Settles (Duolingo staff), KDD 2020, "A Sleeping, Recovering Bandit Algorithm for Optimizing Recurring Notifications". The "recovering" model penalizes reusing the same template and handles novelty decay. Results versus a strong baseline: **+0.5% total DAU, +2% new-user retention**. The public dataset has 200M practice-reminder notifications over 35 days. — [Paper PDF](https://research.duolingo.com/papers/yancey.kdd20.pdf); [Papers with Code](https://paperswithcode.com/paper/a-sleeping-recovering-bandit-algorithm-for)
- Investor letters (audited financials, but metrics are company-defined). DAU passed **50M** in Q3 2025 (+36% YoY). The Q4 2025 letter reported **52.7M DAU (+30% YoY)**. Quarterly DAU growth decelerated from 49% to 40%, 36% and 30% through 2025. Management partly attributed the slowdown to ad loads/subscription upsells and less "unhinged" social content, and guided about 20% DAU growth for 2026. — [Q3 2025 shareholder letter (SEC)](https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25share.htm); [Q3 2025 press release](https://duolingo.gcs-web.com/news-releases/news-release-details/duolingo-surpasses-50-million-daily-active-users-grows-dau-36); [Zacks summary of Q4 2025](https://www.zacks.com/stock/news/2883249/{https:/www.zackstrade.com/2019-1-dollar})
- Secondary only: 2022 experiments on widgets, streak app icons, goal-commitment copy and Perfect Streak Week (Ali Abouelatta thread, summarized by Lazyweb; not Duolingo-published). — [Lazyweb](https://lazyweb.com/research/duolingo-retention-experiments)

### Inferences
- Duolingo's clearest evidence on balancing load and consistency: **minimum viable daily action (one lesson) to keep the reward loop alive, with volume goals kept separate and optional**. An ambitious daily goal was itself a churn driver.
- Effect sizes per experiment are small (0.5–3.3% relative). The 4.5x DAU growth came from compounding many such tests on a retention-first metric (CURR), not from one big change.
- "Commit to my goal" copy and a user-chosen streak goal improved retention, which suggests a light onboarding commitment can help. Compare Fabulous's finding above that a heavier commitment step hurt completion.

### Gaps
- No public figures for the streak freeze, streak repair, the path redesign (2022), or "Perfect Streak" outcomes.
- Duolingo did not publish baselines or absolute retention numbers for the streak tests.

## Noom: daily lesson pacing, psychology curriculum, engagement studies

### Takeaway
Noom's peer-reviewed output is mostly staff-authored observational analysis linking engagement (articles read, logging) to weight loss. I found no published data on how lesson pacing or daily load affects retention.

### Cited Findings
- Carey et al. 2021, JMIR mHealth and uHealth: a retrospective analysis of **11,252** users over 9–52 weeks. Engagement (articles read, meals logged, weigh-ins) was associated with weight-loss outcomes. Several authors, including the first author, are Noom employees; weight was self-reported; there was no control group. — [PMC8663454](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8663454/); [JMIR PDF](https://mhealth.jmir.org/2021/11/e30622/PDF)
- A JMIR Diabetes 2020 abstract describes the daily curriculum as covering diet, exercise and psychology content. — [DOAJ record](https://doaj.org/article/b60c1ed1f5e14e2ea47b94e09733c1ee)
- 2017 pilot (company press release): a small 15-week study in which logging predicted greater body-fat loss. — [Newswire](https://www.newswire.com/view/content/study-in-the-journal-of-metabolic-syndrome-and-related-disorders-20040762)
- A 2016 Scientific Reports Noom paper (reportedly about 78% of users losing weight; Noom-affiliated, no control) is cited only by a competitor's blog. I could not access it (Nature paywall redirect). — [Nutrola blog (weak source)](https://nutrola.app/en/blog/does-noom-actually-work-for-weight-loss); [Scientific Reports srep34563](https://www.nature.com/articles/srep34563)

### Inferences
- Noom's evidence shows engagement correlates with outcomes. This is a dose-response correlation with reverse-causality risk, not evidence that a given pacing causes retention.

### Gaps
- No Noom data on lesson length (e.g., the 5–10 min/day framing), the number of daily tasks, or course-length experiments.
- The Scientific Reports paper's figures are unverified.

## Calm / Headspace / Habitica / Me+

### Takeaway
Calm has two vendor-published results. A daily reminder prompt after the first session reached 40% opt-in, and reminder setters showed ~3x retention (observational, then tested). Compressing an 8-email onboarding from 27 to 15 days increased engagement. I found no public experiment data for Headspace, Habitica or Me+.

### Cited Findings
- Amplitude case study (vendor, company-supplied). Observationally, users who set Daily Reminders had "almost 3x" retention, but the small sample meant causality was unknown. Calm then promoted reminders to new users right after their first meditation, and **40%** of those shown the prompt set one. Amplitude reports a positive effect on daily, weekly and monthly retention persisting **12+ weeks**, with no effect size given. — [Amplitude: Calm case study](https://www.amplitude.com/case-studies/calm.md); [Amplitude blog](https://amplitude.com/blog/calm-increased-retention-amplitude.md)
- Iterable case study (vendor): Calm's 8 onboarding emails were compressed from **27 days to 15 days**, and the shortened path engaged "at a higher rate" (no figure given). — [Iterable: Calm](https://iterable.com/customers/calm)
- Calm displayed the longest streak of days, total sessions and time (descriptive only). — [Amplitude 2017](https://amplitude.com/blog/2017/04/12/meditate-every-day)

### Inferences
- Calm's results favour **tighter early cadence** (faster onboarding drip) and **anchoring a daily cue right after the first completed session**. The anchoring is a pacing decision about when to ask for commitment: after value, not before.

### Gaps
- Headspace, Habitica and Me+: no public retention or pacing experiment data found within the call budget.

## Industry benchmarks (Adjust, AppsFlyer, RevenueCat, Adapty)

### Takeaway
Health & fitness apps retain roughly 20–27% on D1, 8–13% on D7 and 3–8% on D30, depending on the source. Health & fitness trial-to-paid conversion is high (median ~35–40%). Short trials are cancelled mostly on Day 0.

### Cited Findings
- Adjust blog (cross-category): D1 about 26% globally, falling to about 7% by D30. — [Adjust](https://www.adjust.com/blog/what-makes-a-good-retention-rate/)
- Health & fitness category retention is about **27% D1 / 13% D7 / 8% D30** (Trysonar, citing Adjust 2024 and Statista; secondary), versus about **20% D1 / 8% D7 / 3–4% D30** (Phiture, citing Statista H1 2024/AppsFlyer/Adjust; secondary). The sources conflict. — [Trysonar](https://trysonar.app/blog/app-user-retention-benchmarks-and-what-moves-it); [Phiture](https://phiture.com/mobilegrowthstack/managing-retention-rate-benchmarks-and-expectations/)
- RevenueCat State of Subscription Apps 2025, via secondary coverage. Health & fitness median trial-to-paid is **39.9%** (top decile **68.3%**). H&F has the highest median revenue per install at 60 days (**$0.63**), but only 5% of H&F apps reach $10k revenue in two years. Trials of 17–32 days convert best (**45.7%** median) versus ≤4-day trials (**26.8%**). About **30%** of annual subscribers cancel in month one. — [Athletech News](https://athletechnews.com/fitness-apps-monetizable-winner-take-all-or-most/); [Subscription Insider](https://subscriptioninsider.com/article-type/news/revenuecats-state-of-subscription-apps-2025-report-ais-dominance-retention-challenges-and-the-shift-away-from-pure-subscriptions)
- RevenueCat 2026 (secondary, all categories): **55.4%** of 3-day-trial cancellations happen on Day 0 and 84% by Day 1. The Day-0 share is 39.8% for 7-day trials and 35.7% for 14-day trials. — [SaaStr](https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth)
- Adapty 2026: Health & Fitness leads trial-to-paid at **35.0%**. A secondary write-up cites 62%, which conflicts. — [Adapty State of in-app subscriptions 2026](https://adapty.io/state-of-in-app-subscriptions/)

### Inferences
- With a hard paywall and a short trial, the Day-0/Day-1 experience decides most of the outcome. Over half of 3-day-trial cancellations are on Day 0, so the first session's perceived load and payoff carry disproportionate weight.

### Gaps
- I did not read the primary RevenueCat/Adjust PDFs; all category numbers are from secondary coverage.
- No benchmark specifically for the mental-health/self-care subcategory was found.
