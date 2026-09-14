# Program Catalogue — Links

Everything produced while designing the plan catalogue, in the order it was made.
Artifacts are private to the Claude account they were published from; in the
terminal, `/artifacts` lists them and `o` opens one.

## Artifacts

| What | Link |
| --- | --- |
| **Eight-Week Program Flow** — nine screens end to end, onboarding reveal through graduation, drawn in Azora's tokens | https://claude.ai/code/artifact/a205b5bb-627f-4070-8bdb-fcea7094a705 |
| **Plan Screen Patterns** — how eight apps draw a long plan, five visual registers compared, confidence-labelled | https://claude.ai/code/artifact/6079254f-0fdf-464c-8dfa-51cda7eeed7c |
| **Plan Trail Prototype** — interactive week trail: tap nodes, scroll phases, open weeks; motion spec with real durations | https://claude.ai/code/artifact/f43461ef-beab-4192-bbe9-6018956b4153 |
| **The Plan Catalogue** — six breathing plans, four to twelve weeks, week-by-week; picker and switching screens | https://claude.ai/code/artifact/e4df5e83-90e0-455b-9d0b-fbcf26d0160b |
| **Mindmap and Life Plans** — rebuilt five-axis mindmap, The Reset Room, First Ten Minutes, the room argument | https://claude.ai/code/artifact/a1c7adbf-7468-4aec-8294-d525fdca6acf |
| **Mindmap Options** — three versions of the map, and why "Starting" and "Order" were the wrong words | https://claude.ai/code/artifact/854799ec-4307-42bc-93c4-0392595a98f8 |
| **Axis Candidates** — sixteen candidate axes sorted by what each costs to make real | https://claude.ai/code/artifact/a528fa37-8fe3-459c-9e94-58de4d3b2a62 |
| **Free, Trial, Paid** — the three models drawn as timelines, and where the money comes from | https://claude.ai/code/artifact/67b3c327-0dca-4c41-b555-e06099c30be9 |

## Repo documents

- [`program-catalogue-plan.md`](./program-catalogue-plan.md) — the architecture decisions, what breaks, sequencing.
- [`program-catalogue-schema.md`](./program-catalogue-schema.md) — the data contract and lowest-risk rollout.
- [`mindmap-axes.md`](./mindmap-axes.md) — the five axes, scoring formulas, what changes in `onboardingScores.ts`.
- [`monetization-and-gating.md`](./monetization-and-gating.md) — free vs trial vs paid, what a free tier would gate, retention moves.

## Research sources

### Long plans and journeys

- Duolingo path structure — https://duoplanet.com/duolingo-learning-path/
- Duolingo units and checkpoints — https://duoplanet.com/duolingo-units-and-checkpoints/
- Duolingo path redesign review — https://duoplanet.com/duolingo-new-learning-path-review/
- Duolingo redesign, NBC interview — https://www.nbcnews.com/tech/tech-news/duolingos-update-redesign-luis-von-ahn-interview-rcna44655
- Duolingo Daily Refresh — https://duoplanet.com/duolingo-daily-refresh/
- Duolingo on streaks — https://making.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals
- Duolingo efficacy studies — https://blog.duolingo.com/results-duolingo-efficacy-studies
- Birdbrain (adaptive difficulty) — https://www.tomdaccord.com/blog/ai-and-duolingo

### Runna — plan generation and adaptation

- Create a training plan — https://support.runna.com/en/articles/15443877-how-to-create-a-training-plan-in-runna
- Plan built around current fitness — https://support.runna.com/en/articles/15231838-how-does-runna-build-your-training-plan-around-your-current-fitness
- Plan realignment — https://support.runna.com/en/articles/10026375-how-to-use-the-plan-realignment-feature
- Skipping and missed sessions — https://support.runna.com/en/articles/15012850-how-and-when-to-skip-a-run-managing-missed-sessions-in-your-training-plan
- Adjusting difficulty — https://support.runna.com/en/articles/15012974-how-to-adjust-your-running-plan-s-difficulty-new-to-running-path-to-parkrun-and-return-to-running
- Adapting when unwell — https://support.runna.com/en/articles/12809806-feeling-unwell-how-to-adapt-your-training-plan
- Recovery and deloads — https://support.runna.com/en/articles/15272605-how-does-runna-build-recovery-into-your-training-plan
- Training calendar — https://support.runna.com/en/articles/10137793-how-to-use-your-training-calendar
- Schedule adjustment — https://support.runna.com/en/articles/6206024-adjusting-your-running-schedule

### Peloton — the week-gating cautionary tale

- Programs 2025 relaunch (gating removed) — https://www.pelobuddy.com/programs-2025-relaunch/
- Original program gating — https://www.pelobuddy.com/peloton-program-update-workaround/

### Ahead and Fabulous

- Ahead homepage — https://ahead-app.com/
- Ahead review — https://www.bustle.com/wellness/ahead-productivity-app-features-price-review
- Ahead writeup — https://sir.studio/blog/ahead
- Ahead reviews — https://www.trustpilot.com/review/www.ahead-app.com
- Fabulous journeys — https://medium.com/the-fabulous/a-new-fabulous-journey-in-the-mobile-world-b47a3776a0f9
- Fabulous teardown — https://screensdesign.com/showcase/fabulous-daily-habit-tracker

### Other plan apps

- Fitbod, adaptive vs static plans — https://fitbod.me/blog/static-workout-plans-vs-adaptive-training-apps-why-fitbod-adjusts-to-you/
- Whoop Coach — https://agent-finder.co/reviews/whoop-coach

### Cleaning methods and ADHD-adjacent apps

Sourced but without stable canonical URLs captured — search by name:

- **Tody** — decay-curve model of room cleanliness (the key mechanic)
- **Sweepy** — coins from real chores decorating a virtual home
- **Unfuck Your Habitat** — the 20/10 method, maintenance over perfection
- **FlyLady** — five-zone weekly rotation
- **Dana White / No Mess Decluttering** — trash → dishes → laundry → has-a-place → judgment calls
- **Goblin Tools (Magic ToDo)** — adjustable task-breakdown granularity
- **Tiimo** — shrinking countdown rings, no productivity shaming
- **Habitica wiki** — HP damage on missed Dailies, named anti-pattern
- **Inflow / Shimmer** — non-clinical positioning language
- **Slate on Finch**, Sept 2026 — the long-read on why the pet works

## Caveats worth keeping attached

- Runna's **mechanics** are from their own support docs and are reliable; its
  **visual styling** was never verified against a screenshot.
- Ahead is the weakest-sourced product in the set — they publish very little.
- Primary Reddit and TikTok discussion of Finch could not be retrieved; nothing
  in the recommendations rests on it.
- Market sizing figures ($2.0–2.8B, ~17.5% CAGR) are paid-research estimates
  that disagree with each other by about 40%. Directional only.
