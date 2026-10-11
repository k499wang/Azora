# Chillio feature requests: concrete product examples

Research date: October 11, 2026. App: **Chillio: Life Planner**, developed by COREMOVE LIMITED, App Store ID `6748603301`.

This document translates recurring App Store review requests into specific screens, controls, and user flows. The requests come from reviews; the proposed interfaces, dialogue, prices, and behavior below are design interpretations. Example dialogue is illustrative, not quoted from reviews. This is competitor research, not an approved Azora implementation plan.

## Review sample

The analysis covered 316 unique written reviews exposed by Apple's public customer-review feeds: United States 225, Canada 43, Australia 33, and United Kingdom 15. Review update dates span October 9, 2025–October 9, 2026. Updated dates may reflect edits rather than original publication.

Counts below are manually classified mentions of explicit requests or complaints identifying a specific unmet need. Categories overlap. They are not survey votes or estimates of demand across all users. Generic complaints about misleading advertising and praise were excluded from these feature counts. Historical complaints do not establish whether a feature remains absent today.

| Requested capability | Unique review mentions |
| --- | ---: |
| AI chooses tasks, breaks chores into steps, and reduces manual planning | 24 |
| Photo or room-scan analysis with tailored cleaning instructions | 17 |
| Continued, varied, deeper, or replayable lessons | 11 |
| Useful earned currency, pet interactions, and adjustable rewards | 10 |
| Editable recurring routines and flexible schedules | 8 |
| Spoken replies and dependable live coaching | 8 |

The existing [US review collection](chillio-app-store-reviews.md) contains the 225 US reviews. The other storefronts are linked below.

## 1. An assistant that creates tasks and chooses where to start

**What reviewers want:** Help deciding the next action, breaking a chore into manageable steps, estimating time, and creating an actual routine without entering every task manually. One reviewer reports that the AI cannot add tasks from chat. Another describes receiving only a single “Do Laundry” task when asking for laundry help.

**What it would look like:** The user opens a planning conversation and types:

> My kitchen is a mess, I have 15 minutes, and I'm overwhelmed.

Chi presents a small plan:

| Step | Estimated time |
| --- | ---: |
| Put the dishes in the sink into the dishwasher | 5 minutes |
| Clear the kitchen counter | 7 minutes |
| Take out the trash | 3 minutes |

Below the plan are **Start first step**, **Add to today**, and **Make it smaller**.

- **Start first step** opens the first task immediately.
- **Add to today** creates the checklist in the user's task list automatically. The user does not copy advice from chat or re-enter it elsewhere.
- **Make it smaller** changes the first action to something like “Put five dishes in the dishwasher.”

The defining behavior is that advice becomes an actionable task, with an obvious starting point.

**Evidence:** nursecorri14, US, *Misleading*, updated July 13, 2026, review ID `14298059569`; Lester_610, Australia, *Useless*, updated September 11, 2026, review ID `14539394578`. [US review collection](chillio-app-store-reviews.md), [Australian Apple feed](https://itunes.apple.com/au/rss/customerreviews/page=1/id=6748603301/sortby=mostrecent/json).

## 2. Take a photo and receive instructions for that particular mess

**What reviewers want:** Photograph a messy room or table and receive a starting point, time estimates, and instructions about what to do with the visible items. Several bought the app expecting this capability from its advertising.

**What it would look like:** A home-screen button labeled **Help me with this space** opens the camera. The user photographs a cluttered dining table.

Chi responds:

> Let's clear one corner first.
>
> 1. Put the cups and plates by the sink.
> 2. Collect the loose papers into one pile.
> 3. Put items belonging elsewhere into a basket.

The app shows one step at a time with an estimated duration. Each step has **Done**, **Need help**, and **Too much right now**.

If Chi needs information, it asks a concrete question such as “Where do you usually keep these papers?” rather than assuming it knows the user's storage locations. **Too much right now** offers a smaller action.

The defining behavior is that the plan responds to the space the user actually showed, reducing the effort of describing and organizing the problem.

**Evidence:** AleksT13, US, *Got it for the photo/camera option - but it doesn't have it*, updated September 29, 2026, review ID `14606986294`; M. Elaine Vass, US, *Just a to do list… not what was advertised.*, updated October 4, 2026, review ID `14628401774`. [US review collection](chillio-app-store-reviews.md).

## 3. Rewards that can actually be used

**What reviewers want:** A purpose for earned coins, diamonds, or points; meaningful pet interaction; and, in one review, the ability to adjust rewards based on task difficulty.

**What it would look like:** Completing tasks earns coins. Tapping the balance opens a small shop:

| Item | Illustrative price |
| --- | ---: |
| Cushion for Chi's room | 50 coins |
| Plant | 100 coins |
| Cat outfit | 150 coins |

Buying the plant visibly places it in the room. Tapping Chi offers a small interaction such as playing or feeding. The task editor could also allow the user to assign more points to a difficult chore.

The shop, items, and prices are proposed examples. The repeated request is to make accumulated rewards useful. The defining loop is **finish a task → earn currency → choose a reward → see the result**.

**Evidence:** Aznash123, US, *Disappointing*, updated May 28, 2026, review ID `14117090431`; coffee and chaos, US, *Disappointed*, updated October 3, 2026, review ID `14622762691`. [US review collection](chillio-app-store-reviews.md). Shadowbetty also discusses unused currency in the [UK reviews](https://apps.apple.com/gb/app/chillio-life-planner/id6748603301?platform=iphone&see-all=reviews).

## 4. Lessons that remain available after completion

**What reviewers want:** Revisit old lessons and keep receiving useful content after the introductory lessons end. Other requests concern variety and depth.

**What it would look like:** A **Lessons** screen contains:

- **Today's lesson** — the current suggested lesson.
- **Continue your series** — the next lesson in an ongoing topic.
- **Completed lessons** — an accessible archive of previous lessons.

Someone who finished “How to start when overwhelmed” can reopen it next week, read its key points, and repeat its exercise. After finishing the introductory series, they can choose another topic, such as laundry or maintaining a routine.

The defining behavior is that completed content remains useful and finishing the introduction leads to a clear next step.

**Evidence:** Kwintt, US, *Disappointed*, updated October 4, 2026, review ID `14628684696`, in the [US review collection](chillio-app-store-reviews.md); Shadowbetty, *Limited but has potential*, in the [UK reviews](https://apps.apple.com/gb/app/chillio-life-planner/id6748603301?platform=iphone&see-all=reviews).

## 5. Hands-free coaching while doing the chore

**What reviewers want:** Spoken conversation and accountability while working through a task. Reviews also identify interrupted or overlapping speech as problems.

**What it would look like:** From a task, the user taps **Do this with Chi** and puts the phone down.

> **Chi:** Start by gathering the clothes from the floor.
>
> **User:** Done.
>
> **Chi:** Now separate the towels.
>
> **User:** I'm getting distracted.
>
> **Chi:** Let's just pick up three towels.

Chi waits for the user, remembers the current step, and stops speaking when interrupted. Visible controls are **Pause**, **Repeat**, and **End session**.

The defining behavior is sustained guidance through the current task. It needs dependable turn-taking and continuity to work while the user's hands are occupied.

Some reviews describe voice as missing; others report using it. The App Store version history mentions voice-chat fixes, so the research supports demand for usable, reliable voice coaching rather than a claim that voice is currently absent.

**Evidence:** cjg0307, Australia, *Not reliable*, updated October 5, 2026, review ID `14633162053`. [Australian Apple feed](https://itunes.apple.com/au/rss/customerreviews/page=1/id=6748603301/sortby=mostrecent/json), [App Store version history](https://apps.apple.com/us/app/chillio-life-planner/id6748603301).

## 6. Recurring tasks that fit an actual schedule

**What reviewers want:** Editable routines, flexible task frequencies, and planning that accounts for work hours.

**What it would look like:** In the task editor for “Change bedsheets,” the user selects **Every 14 days**. They can move today's occurrence to tomorrow without rebuilding the routine or changing all future occurrences.

Someone working shifts can enter their work hours so suggested chores fit the time they actually have available. This connects to automatic planning: the generated plan should respect those hours.

The defining behavior is that a routine can adapt to a changed day while keeping its underlying schedule understandable.

**Evidence:** Job as well, Australia, *Job isn't in it*, updated September 18, 2026, review ID `14566176929`. [Australian Apple feed](https://itunes.apple.com/au/rss/customerreviews/page=1/id=6748603301/sortby=mostrecent/json). The recurrence controls above are proposed examples, not a verbatim specification from that review.

## Smaller requests

The sample also included requests for appearance or personality customization (5 reviews), progress analytics (4), and reminders (3). A concrete analytics example would be a weekly review showing completed and skipped tasks and trends over time. These were less frequent than the main themes above.

Billing complaints about trials, cancellation, add-ons, and refunds were considered separately from product features.

## Product opportunity

The strongest combined flow suggested by the review analysis is:

**Show Chi the mess → receive one manageable next step → start immediately → get help until it is done.**

This is a product interpretation of the task-planning and photo-guidance requests. It could begin with typed descriptions and automatic task creation, then extend to photo input and spoken coaching.

## Source storefronts

- [US App Store reviews](https://apps.apple.com/us/app/chillio-life-planner/id6748603301?platform=iphone&see-all=reviews)
- [UK App Store reviews](https://apps.apple.com/gb/app/chillio-life-planner/id6748603301?platform=iphone&see-all=reviews)
- [Canadian App Store reviews](https://apps.apple.com/ca/app/chillio-life-planner/id6748603301?platform=iphone&see-all=reviews)
- [Australian App Store reviews](https://apps.apple.com/au/app/chillio-life-planner/id6748603301?platform=iphone&see-all=reviews)

Apple's public feed follows `https://itunes.apple.com/{country}/rss/customerreviews/page={page}/id=6748603301/sortby=mostrecent/json`. Pages 1–10 were checked for each storefront; the US sample ended on page 5, and the other storefronts each contained one page of reviews.
