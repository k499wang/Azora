# Plan lifecycle: starting one late, and finishing one

Research behind two open decisions in `PlanScreen` / `program_enrollments`:

1. **Existing users have no enrollment.** Plans are created only at the onboarding
   seal, and there is no backfill. Anyone who onboarded before plans shipped sees
   "No plan yet" forever.
2. **Finishing a plan does nothing.** `status` flips to `completed`, `program_day`
   freezes on the last day, Home shows that day's exercises ticked indefinitely,
   and no path exists to start another.

Companion to [competitive-research.md](competitive-research.md) and
[engagement-mechanisms.md](engagement-mechanisms.md).

---

## 1. Getting existing users onto a plan

### What the precedents do

**Finch — user-supervised migration (May 2025).** Finch replaced Journeys with
Self-Care Areas for everyone, but existing users migrated *themselves*: a button
above the goals list walked them through moving each Journey over "in a calm and
simple process." The app **suggested** new names ("Start moving, get healthy" →
"Movement") and stated explicitly that renaming was **not required** and could be
done later with **no time limit**. Keeping the old name cost you only the
category's suggested goals.

**Runna — opt-in plan versions.** When a newer plan version exists, the plan
screen shows a **"New Plan Version Available" pill**. Tapping it shows the current
version, the new version, and **a summary of what the update includes**. The user
taps Update or ignores it. If they dislike it they can **revert to the original
version**. Nothing is automatic.

**Duolingo — the anti-precedent.** The 2022 path redesign was forced on existing
users. Result: "the worst update ever" tweets, an organised **one-star App Store
review campaign**, a **Change.org petition to reverse it**, and complaints about
lost progress and reset Legendary status. CEO Luis von Ahn refused to offer a way
back: "People are change averse." Whatever you think of the call, the cost was
paid in public reviews — which for us is the acquisition channel.

### What this means for Azora

An automatic enrollment would silently swap a returning user's Home to-do list for
plan days. That is the Duolingo move at small scale: the user did not ask, cannot
undo it, and gets no explanation.

**Recommendation — an opt-in card on the Plan tab.**

- Shown only when `hasEnrollment === false` and onboarding is complete, replacing
  today's "No plan yet" copy.
- **Name what they get and what changes.** Plan name, length in weeks, and one
  line saying Home's daily list will follow the plan. Runna shows "what the update
  includes" before the tap; this is the same obligation.
- **Pre-resolve the plan from their stored goal** via `resolvePlanIntent` — the
  same resolution onboarding uses. No re-onboarding, no second questionnaire.
  Existing users have already answered; asking again is the thing reviews punish.
- **`ChunkyButton`, one tap**, calling the same `startProgramEnrollment` onboarding
  calls. No new resolution logic anywhere.
- **No deadline and no nag.** Finch's "no time limit" is the tone. Ignoring the
  card must leave the app exactly as it is today.
- **A way out.** `ProgramEnrollmentStatus` already has `'abandoned'`; Runna's
  revert is the precedent. Not required for v1, but the status exists, so the exit
  is cheap to add later.

**Ship independently and first: un-gate Insights.** The analytics read mood
check-ins and `daily_activity`, not the enrollment, but they currently sit inside
the `position != null` branch of `PlanScreen`. Existing users have the deepest
history in the database and see none of it. Moving the section out is a few lines
and needs no decision.

> Sequencing note: un-gating Insights exposes `resetEffect` to users with long
> activity histories, which is exactly the case the truncated-window clamp
> (`comparableFrom`) was added for. Ship them together.

---

## 2. Finishing a plan

### What the precedents do

**Duolingo — how it feels to get nothing.** A writer finishing the Welsh course:
"I figured there was sure to be some major fanfare when I wrapped up that final
lesson… Welp. I got to the end of Section 3 and…nothing." The app later marked it
**"Course completed, zero fanfare."** Her word for it was *anticlimactic*. This is
our current behaviour, minus even the label.

**Runna — a named next step, chosen by scenario.** Runna never leaves a finished
runner on an empty screen. It asks **what comes next** and offers a small set of
scenario plans: Post-Race Recovery, Run to Maintain (3–26 weeks, with a focus),
Run Faster, Run Further, General Training. Maintenance is explicitly framed as
"hold your base and set up your next block." Crucially, **completed plans stay
accessible** — starting a new one does not delete the old.

**Headspace — a library, not a next step.** After Basics, Headspace hands you the
content library and a themed suggestion ("choose the theme that resonates most").
This works because Headspace *is* a library. We have one Protocol, so this model
does not transfer.

**Finch — completion as archive.** A finished Journey moves to archived Journeys;
goals stop being scheduled but all history is kept. The important half is the
*stop being scheduled* — the finished thing gets out of the daily surface.

**The churn context.** Health app retention runs ~15–25% at D30 and ~6–10% at D90,
and **lost motivation drives 38% of cancellations**. A 6–8 week plan ends squarely
in the D42–D56 window — the point where a user who has just proved the app works
is handed nothing to do next. It is the worst possible moment for an empty screen.

### What this means for Azora

Three pieces, in order of how settled they are.

**a. Stop Home lying (bug, no decision needed).** `programDayOnDate` should return
`null` for a completed enrollment once the calendar has turned — the same rule
`programDayForDate` already applies to a day finished today. The final day stays
through the evening it was earned; from the next morning Home falls back. Finch's
"no longer scheduled" is the principle: a finished plan must leave the daily
surface.

**b. A graduation moment on the Plan tab.** Where the calendar's "today" cell used
to be. Duolingo's failure here is instructive precisely because the *data* was
right and only the *acknowledgement* was missing. Say what they actually did —
days kept, weeks finished, and if the data supports it, the Reset-effect finding.
Graduation is the one moment the analytics are unambiguously worth reading: the
user has a completed block to attribute them to.

**c. One offered next step, not a menu.** Runna's model, not Headspace's. After
the Protocol, offer the same Protocol again with their current goal pre-selected,
plus the option to change goal. Two choices, one of them default. A user finishing
week eight has demonstrably not lost interest — the failure mode to avoid is
making them re-onboard to continue.

Keep the finished plan readable. `getCurrentProgramEnrollment` already orders
`active` before `completed` and retains the latest finished plan, so the data is
there; the screen just needs to show it as finished rather than as current.

---

## Sources

- Finch Journeys → Self-Care Areas migration — [Finch Wiki: Journey](https://finch.fandom.com/wiki/Journey), [2025 App Update Announcements](https://finch.fandom.com/wiki/2025_App_Update_Announcements)
- Runna plan versions — [How to Update My Plan Version and Access New Features](https://support.runna.com/en/articles/10670455-how-to-update-my-plan-version-and-access-new-features)
- Runna between-plan options — [Which Plan Should I Choose Between Race Blocks?](https://support.runna.com/en/articles/14666749-which-plan-should-i-choose-between-race-blocks), [Maintenance Training Plans](https://www.runna.com/training/maintenance), [Will Starting a New Plan Mean I Lose Access to My Old Plan?](https://support.runna.com/en/articles/6230744-will-starting-a-new-plan-mean-i-lose-access-to-my-old-plan)
- Duolingo completion anticlimax — [Melissa Wiley, "Achievement Unlocked"](https://melissawiley.substack.com/p/achievement-unlocked)
- Duolingo path backlash — [NBC News: Duolingo's redesign has some fans up in arms](https://www.nbcnews.com/tech/tech-news/duolingos-update-redesign-luis-von-ahn-interview-rcna44655), [Change.org petition](https://www.change.org/p/reverse-duolingo-s-path-update)
- Headspace post-course — [I've completed Basics. Now what?](https://help.headspace.com/hc/en-us/articles/115008122767-I-ve-completed-Basics-Now-what), [What Should I Do After The Headspace Basics?](https://www.headspace.com/articles/after-headspace-basics)
- Retention and churn context — [Sahha: Why Most Health App Users Churn Within 90 Days](https://sahha.ai/blog/health-app-churn-retention/)
