import type { LessonDefinition } from '../lessonBlock';

/**
 * The plan talking about itself.
 *
 * Every plan draws on all of these, because none of them is about sleep or
 * temper or attention — they are about the thing the user is doing, and that is
 * the same thing whichever outcome they came for.
 */
export const PLAN_LESSONS = [
  {
    id: 'plan.grows',
    title: 'The plan adds sessions, it never lengthens them',
    blocks: [
      {
        kind: 'text',
        text: 'Your plan asks for **a few minutes of guided breathing** a day, and we call one of those daily sessions a reset. This week it is one reset a day; in a week or so, the plan adds a second.',
      },
      { kind: 'fact', value: '3', caption: 'the most resets it ever asks of a day' },
      {
        kind: 'text',
        text: 'Each reset stays the length it is now, and that is deliberate. A long session sounds better, but it is the one people skip on a bad day, and two short ones are **easier to fit in** than one long one.',
      },
      {
        kind: 'do',
        text: 'Do **the reset your plan asks for today**, at the time of day you chose when you set it up, and mark it done.',
      },
    ],
    source: 'Plan structure, programCatalogue.ts. The second reset joins on day 8 in four presets and day 10 in `pressure`, so this lesson names no day — it is read on day one of all five.',
  },
  {
    id: 'plan.hour',
    title: 'A fixed time of day does more than willpower',
    blocks: [
      {
        kind: 'text',
        text: 'Your plan asks for a few minutes of breathing each day, and the part that makes it stick is not willpower. It is doing it at **the same time every day**, until the day reminds you instead of you reminding yourself.',
      },
      {
        kind: 'text',
        text: 'So pick the time you could keep on your worst week rather than your best one, and **treat that as the appointment**. The one that survives a busy Tuesday is the one still there in a month.',
      },
      {
        kind: 'text',
        text: 'If you have missed twice in a row at the same time, that is the time telling you it is wrong, not you. **Move it somewhere it fits** and carry on.',
      },
      {
        kind: 'do',
        text: 'Look at the time of day your plan is set for and ask whether you would keep it on your busiest day. **Change it now** if the answer is no.',
      },
    ],
    source: 'Habit formation: context stability, especially time of day, predicts automaticity more than motivation does.',
  },
  {
    id: 'plan.stacking',
    title: 'Attach it to something you already do',
    blocks: [
      {
        kind: 'text',
        text: 'A new habit is easier to keep when you attach it to an old one. After your coffee, before your shower, once the laptop closes: **something you already do** can remind you to start.',
      },
      {
        kind: 'text',
        text: 'That is the part that usually fails, because you are not trying to remember anything. You are **following something you already do**, and it does the remembering for you.',
      },
      {
        kind: 'text',
        text: 'It works best behind something you **never skip**, like brushing your teeth, putting the kettle on, or locking the front door.',
      },
      {
        kind: 'do',
        text: 'Name the thing that always happens just before the time your plan is set for, and **use that as the cue** from today.',
      },
    ],
    source: 'Implementation intentions and habit stacking: an existing routine is a more reliable cue than an intention.',
  },
  {
    id: 'plan.low',
    title: 'This is meant to feel too easy',
    blocks: [
      {
        kind: 'text',
        text: 'Your plan asks for a few minutes a day, and it is meant to feel like nothing much. **The version that feels too easy** is the only one people keep doing when the week goes badly.',
      },
      { kind: 'fact', value: '5 min', caption: 'is all the plan asks for today' },
      {
        kind: 'text',
        text: 'Ambition is usually not what is missing. Most people can get through a long session once, and almost nobody can do the hard version **forty days running**.',
      },
      {
        kind: 'do',
        text: 'Resist the urge to make today longer. **Do the short version**, and then do it again tomorrow.',
      },
    ],
    source: 'Behaviour change: starting below capacity protects adherence; difficulty is the most common cause of early dropout.',
  },
  {
    id: 'plan.expect',
    title: 'You will not feel different in week one',
    blocks: [
      {
        kind: 'text',
        text: 'The first week of a plan this small is about turning up, not about results, and **nothing measurable has changed yet**. Expecting to feel different is how most people talk themselves out of it in week one.',
      },
      { kind: 'fact', value: '2 weeks', caption: 'before most people notice anything' },
      {
        kind: 'text',
        text: 'The first thing that does change is usually not calm. It is **noticing sooner** than you used to, and that is easy to miss because it feels like nothing.',
      },
      {
        kind: 'do',
        text: 'Give this two weeks before you judge it, and **write down the date** you will check in.',
      },
    ],
    source: 'Expectation setting reduces early dropout; most self-report change in this area is not detectable inside a week.',
  },
  {
    id: 'plan.two',
    title: 'Two short sessions beat one long one',
    blocks: [
      {
        kind: 'text',
        text: 'Your plan may ask for the same few minutes twice in one day, and that is not worse than doing them once. **Two short sessions** give you two chances to catch the day instead of one chance to get it right.',
      },
      { kind: 'fact', value: '2 × 5', caption: 'beats one of twice the length' },
      {
        kind: 'text',
        text: 'It is also **more forgiving**, because missing one of them still leaves the day half kept, while missing a single long session leaves you with nothing at all.',
      },
      {
        kind: 'do',
        text: 'If today asks for two, **keep them apart**. Morning and evening, not back to back.',
      },
    ],
    source: 'Distributed practice: spaced short bouts outperform a single massed one at equal total time.',
  },
  {
    id: 'plan.consistency',
    title: 'Small and daily beats big and rare',
    blocks: [
      {
        kind: 'text',
        text: 'What you get out of this comes from how often you do it, not from how long any one session is. **Ten short days** do more than two long ones, and they are easier to fit around a job and a family.',
      },
      { kind: 'fact', value: '10 min', caption: 'a day you will actually do' },
      {
        kind: 'text',
        text: 'The plan is pitched low on purpose for that reason. It is much easier to **add to something** you are already doing than to restart something you quit.',
      },
      {
        kind: 'do',
        text: 'If today’s session feels like too much, **do half of it**. Half counts as the day done. Skipping does not.',
      },
    ],
    source: 'Habit formation — repetition in a stable context drives automaticity more than session length.',
  },
  {
    id: 'plan.bad',
    title: 'Shorten it, do not skip it',
    blocks: [
      {
        kind: 'text',
        text: 'On a day with nothing left in it, the choice is not between the whole session and nothing at all. **One minute still counts** as the day done, and the plan has not failed.',
      },
      { kind: 'fact', value: '60 sec', caption: 'is not the same as none' },
      {
        kind: 'text',
        text: 'Skipping teaches you that the plan is optional on hard days. **Shortening it** teaches you that it fits inside them, which is the more useful thing to learn.',
      },
      {
        kind: 'do',
        text: 'If today is that day, **do sixty seconds** of it and mark it done. That is not cheating.',
      },
    ],
    source: 'Lapse prevention: reduced-dose completion preserves the habit loop where omission breaks it.',
  },
  {
    id: 'plan.missed',
    title: 'One missed day does not reset anything',
    blocks: [
      {
        kind: 'text',
        text: '**Missing a day does not undo** the days you did. What usually happened is that the time of day you picked did not fit the day you had, and that says more about the time than about you.',
      },
      {
        kind: 'list',
        items: [
          { term: 'The time was wrong', text: 'Move it to a time that would have worked and try again.' },
          { term: 'The day was wrong', text: 'Some days genuinely have no spare five minutes.' },
          { term: 'You forgot', text: 'That is a reminder to set, not a willpower problem.' },
        ],
      },
      {
        kind: 'text',
        text: 'The only missed day that costs you anything is the one you turn into **a reason to stop**.',
      },
      {
        kind: 'do',
        text: 'Open your plan and **look at the time it is set for**. If you have missed twice at the same time, move it.',
      },
    ],
    source: 'Lapse-vs-relapse framing, standard in behaviour change: a single lapse predicts little; the response to it predicts a lot.',
  },
  {
    id: 'plan.streak',
    title: 'The streak exists to make tomorrow easier',
    blocks: [
      {
        kind: 'text',
        text: 'The streak is the run of days you have completed, and it is **not a score** you are supposed to protect. Its only job is to make tomorrow a little easier to start than it would have been without it.',
      },
      {
        kind: 'text',
        text: 'When a streak starts making you feel worse every time it breaks, it has stopped doing that job. **The day after the break** is what matters, not the number.',
      },
      { kind: 'fact', value: '1 day', caption: 'is all a broken streak costs' },
      {
        kind: 'do',
        text: 'If you break it, **do the next day’s session**. That is the whole skill here.',
      },
    ],
    source: 'Streak mechanics cut both ways: loss framing raises adherence and raises dropout after a break.',
  },
  {
    id: 'plan.week',
    title: 'Judge it by the week, not the day',
    blocks: [
      {
        kind: 'text',
        text: 'Any single day tells you **almost nothing**, because how you slept, what happened at work and who called all land on it. None of that says whether doing a few minutes of breathing is working.',
      },
      { kind: 'fact', value: '5 of 7', caption: 'is a week that worked' },
      {
        kind: 'text',
        text: 'A week is the smallest stretch worth reading. Five days out of seven is a working week, and **two or three** is a signal that the time of day is wrong.',
      },
      {
        kind: 'do',
        text: 'At the end of this week, **count the days you did it**, not how they felt.',
      },
    ],
    source: 'Day-level self-report is dominated by state noise; weekly aggregates are the smallest reliable unit.',
  },
  {
    id: 'plan.after',
    title: 'What to keep when this ends',
    blocks: [
      {
        kind: 'text',
        text: 'When the plan finishes, one of the sessions you have been doing has probably become the one you reach for **without deciding to**. That is the one worth keeping.',
      },
      {
        kind: 'text',
        text: 'The rest were how you found it, and a practice that lasts years is usually **one thing at one time of day** rather than a whole programme.',
      },
      {
        kind: 'text',
        text: 'It does not have to be the longest one, or the one you think you should have picked. It only has to be **the one you actually do**.',
      },
      {
        kind: 'do',
        text: 'Name it now. If you could keep **only one** of them, which would it be? That is your practice from here.',
      },
    ],
    source: 'Maintenance phase — narrowing to a single cue-bound behaviour is what survives the end of a structured programme.',
  },
] as const satisfies readonly LessonDefinition[];
