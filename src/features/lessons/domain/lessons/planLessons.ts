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
        text: 'Today only asks for **today’s reset**. If the planned time does not fit, you can choose another moment that does.',
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
        text: 'A useful time is one that fits an ordinary, messy day. **The time can change** when your life changes; that is adjusting the plan, not failing it.',
      },
      {
        kind: 'text',
        text: 'If you have missed twice in a row at the same time, that is the time telling you it is wrong, not you. **Move it somewhere it fits** and carry on.',
      },
      {
        kind: 'do',
        text: 'Ask whether your planned time fits the day you actually have. **You can move it** if another time would make showing up easier.',
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
        text: 'A cue does not have to be perfect. Choose something that **usually happens** in your day, and change the cue if it stops helping.',
      },
      {
        kind: 'do',
        text: 'Notice what usually happens before your reset. Could **one familiar moment** help you remember it without another thing to track?',
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
        text: 'If your mind says a short reset cannot count, ask: **what would make it enough today?** You do not have to earn a longer version.',
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
        text: 'When you catch yourself asking whether it is working yet, try **“What have I noticed?”** A small observation is enough for today.',
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
        text: 'If your plan has two resets today, notice where each one **could fit naturally**. They do not need perfect timing to be useful.',
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
        text: 'If today feels full, ask what **a doable version** would look like. A smaller return still tells you something useful about what fits.',
      },
    ],
    source: 'Habit formation — repetition in a stable context drives automaticity more than session length.',
  },
  {
    id: 'plan.bad',
    title: 'A smaller version still counts',
    blocks: [
      {
        kind: 'text',
        text: 'On a day with nothing left in it, the choice is not between the whole session and nothing at all. **One minute still counts** as the day done, and the plan has not failed.',
      },
      { kind: 'fact', value: '60 sec', caption: 'is not the same as none' },
      {
        kind: 'text',
        text: 'An all-or-nothing thought can make a hard day feel like a test. **Making it smaller** is one option; resting and returning later is another.',
      },
      {
        kind: 'do',
        text: 'Ask yourself what is possible right now: **a shorter reset, a later one, or rest**. The answer can change from day to day.',
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
        text: 'A missed day can bring the thought “I always quit.” **One day is not a pattern**, and a thought is not a verdict.',
      },
      {
        kind: 'do',
        text: 'If you missed a day, ask **what got in the way** without blaming yourself. You can adjust the plan when you know more.',
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
        text: 'When the number resets, remember that **your practice did not disappear**. The next day is a fresh choice, not a debt.',
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
        text: 'When you look back on the week, notice **what helped you return**. That tells you more than judging one difficult day.',
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
        text: 'Which part of the plan felt **most useful to return to**? You can keep that part and let the rest stay optional.',
      },
    ],
    source: 'Maintenance phase — narrowing to a single cue-bound behaviour is what survives the end of a structured programme.',
  },
] as const satisfies readonly LessonDefinition[];
