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
    title: "It adds, it doesn't lengthen",
    blocks: [
      {
        kind: 'text',
        text: 'This week is one short reset a day. It does not get longer from here — on day eight a **second one joins**, and later a third. The pieces themselves stay short.',
      },
      { kind: 'fact', value: 'Day 8', caption: 'when the second one joins' },
      {
        kind: 'text',
        text: 'Short and repeated is what survives a bad week. **Twenty minutes once** is the thing you skip. Five minutes twice is the thing you do.',
      },
      {
        kind: 'do',
        text: 'Do today’s one, at the hour you chose. **That is the whole ask** this week.',
      },
    ],
    source: 'Plan structure, programCatalogue.ts — every preset grows by adding a slot on day 8.',
  },
  {
    id: 'plan.hour',
    title: 'The hour is the habit',
    blocks: [
      {
        kind: 'text',
        text: 'What makes this stick is not willpower, it is **the same time every day**. A habit is a time and a place long before it is a decision.',
      },
      {
        kind: 'text',
        text: 'So pick the hour you could keep on your worst week, not your best. The one that survives **a bad Tuesday** is the one still here in a month.',
      },
      {
        kind: 'text',
        text: 'Missed twice at the same time? The hour is wrong. **Move it** rather than trying harder at it.',
      },
      {
        kind: 'do',
        text: 'Look at the hour on your plan. **Would you keep it** on your busiest day? If not, change it now.',
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
        text: 'New habits stick to old ones. **After coffee**, before the shower, once the laptop shuts — an existing routine is a better cue than a time on a clock.',
      },
      {
        kind: 'text',
        text: 'The cue does the remembering for you, which is the part that usually fails. You are not trying to remember. You are **following something you already do**.',
      },
      {
        kind: 'text',
        text: 'It works best behind something you **never skip**. Teeth, kettle, keys.',
      },
      {
        kind: 'do',
        text: 'Name the thing that always happens just before your hour. **That is your cue** from today.',
      },
    ],
    source: 'Implementation intentions and habit stacking: an existing routine is a more reliable cue than an intention.',
  },
  {
    id: 'plan.low',
    title: 'It is meant to feel too easy',
    blocks: [
      {
        kind: 'text',
        text: 'If today felt like it barely counted, that is the design. **Too easy to skip** is the only version that survives a bad week.',
      },
      { kind: 'fact', value: '5 min', caption: 'that you never skip' },
      {
        kind: 'text',
        text: 'Ambition is not the missing ingredient. Almost everyone can do the hard version **once**. Almost nobody does it forty times.',
      },
      {
        kind: 'do',
        text: 'Resist making it longer today. **Do the small version**, and do it again tomorrow.',
      },
    ],
    source: 'Behaviour change: starting below capacity protects adherence; difficulty is the most common cause of early dropout.',
  },
  {
    id: 'plan.expect',
    title: 'You will not feel it on day three',
    blocks: [
      {
        kind: 'text',
        text: 'The first week is about **showing up**, not about results. Nothing measurable has changed yet, and expecting it to is how most people quit in week one.',
      },
      { kind: 'fact', value: '2 weeks', caption: 'before most people notice anything' },
      {
        kind: 'text',
        text: 'What tends to arrive first is not calm. It is **noticing sooner** — catching the thing a little earlier than you used to.',
      },
      {
        kind: 'do',
        text: 'Give it two weeks before judging it. **Write down the date** you will decide on.',
      },
    ],
    source: 'Expectation setting reduces early dropout; most self-report change in this area is not detectable inside a week.',
  },
  {
    id: 'plan.two',
    title: 'Two short ones beat one long one',
    blocks: [
      {
        kind: 'text',
        text: 'Twice a day at five minutes does more than once at ten. **Two doses** means two chances to catch the day rather than one.',
      },
      { kind: 'fact', value: '2 × 5', caption: 'beats one of twice the length' },
      {
        kind: 'text',
        text: 'It is more forgiving, too. Miss one and the day is **still half kept**, where missing the single long one leaves you nothing.',
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
        text: 'What you are after comes from **frequency**, not from any single sitting. Ten short days do more than two long ones, and they are easier to get.',
      },
      { kind: 'fact', value: '10 min', caption: 'a day you will actually do' },
      {
        kind: 'text',
        text: 'The plan is pitched low on purpose. It is far easier to **add** to something you are already doing than to restart something you quit.',
      },
      {
        kind: 'do',
        text: 'If today’s feels like too much, **do half of it**. Half counts. Skipping does not.',
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
        text: 'On a day with nothing left in it, the choice is not between the whole thing and nothing at all. **One minute counts.**',
      },
      { kind: 'fact', value: '60 sec', caption: 'is not the same as none' },
      {
        kind: 'text',
        text: 'Skipping teaches you the plan is optional on hard days. Shortening teaches you it **fits inside them**, which is the thing you actually need to learn.',
      },
      {
        kind: 'do',
        text: 'If today is that day, **do sixty seconds** and mark it done. That is not cheating.',
      },
    ],
    source: 'Lapse prevention: reduced-dose completion preserves the habit loop where omission breaks it.',
  },
  {
    id: 'plan.missed',
    title: 'A missed day is data, not a verdict',
    blocks: [
      {
        kind: 'text',
        text: 'Nothing resets. **Nothing is lost.** A missed day is usually telling you the hour was wrong, not that you were.',
      },
      {
        kind: 'list',
        items: [
          { term: 'The hour was wrong', text: 'Move it. You are not late for this.' },
          { term: 'The day was wrong', text: 'Some days genuinely have no five spare minutes. Rare, and fine.' },
          { term: 'You forgot', text: 'That is a reminder problem, not a willpower one.' },
        ],
      },
      {
        kind: 'text',
        text: 'The only missed day that costs you anything is the one that becomes **a reason to stop**.',
      },
      {
        kind: 'do',
        text: 'Open your plan and **look at the hour**. Missed twice at the same time? Move it.',
      },
    ],
    source: 'Lapse-vs-relapse framing, standard in behaviour change: a single lapse predicts little; the response to it predicts a lot.',
  },
  {
    id: 'plan.streak',
    title: 'What the streak is actually for',
    blocks: [
      {
        kind: 'text',
        text: 'It is not a score. It is a **record of what you did**, and its only job is to make tomorrow slightly easier to start than it would have been.',
      },
      {
        kind: 'text',
        text: 'A streak that makes you feel worse when it breaks has stopped doing that job. **The number is not the point.** The day after the break is.',
      },
      { kind: 'fact', value: '1 day', caption: 'is all a broken streak costs' },
      {
        kind: 'do',
        text: 'If you break it, **come back the next day**. That is the whole skill, and it is the only one that matters here.',
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
        text: 'Any single day is mostly noise — how you slept, what happened, who called. **One day tells you nothing** about whether this is working.',
      },
      { kind: 'fact', value: '5 of 7', caption: 'is a week that worked' },
      {
        kind: 'text',
        text: 'A week is the smallest stretch worth reading. Five days out of seven is a working week. **Two is a signal** that the hour is wrong.',
      },
      {
        kind: 'do',
        text: 'At the end of this week, **count the days you did it**. Not how they felt. How many.',
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
        text: 'By now one of these has become **the one you reach for** without deciding to. That is the one to keep.',
      },
      {
        kind: 'text',
        text: 'The rest were how you found it. A practice that lasts years is **one thing at one hour**, not a programme.',
      },
      {
        kind: 'text',
        text: 'It does not have to be the longest one, or the one you think you should have picked. **The one you actually do.**',
      },
      {
        kind: 'do',
        text: 'Name it. If you could keep **only one**, which is it? That is your practice now.',
      },
    ],
    source: 'Maintenance phase — narrowing to a single cue-bound behaviour is what survives the end of a structured programme.',
  },
] as const satisfies readonly LessonDefinition[];
