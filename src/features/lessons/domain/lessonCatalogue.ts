/**
 * The lessons, and which day of which plan each one lands on.
 *
 * A lesson is one screen of reading attached to a day of the plan. It is not a
 * course, it has no audio, and there is no library to browse — it belongs to
 * its day the way an exercise does, and it is gone tomorrow.
 *
 * Content and placement live together here, immutable and revisioned the way
 * `programCatalogue.ts` is, because what somebody read on day 8 has to still be
 * answerable next year. Everything about how it looks lives in the screen.
 *
 * See `docs/plans/lesson-catalogue-plan.md` for the format rules and the
 * reasoning behind the placement.
 */

import type { ProgramPlanId } from '../../program/domain/programCatalogue';

/** Bumped when a lesson's text changes in a way that changes what it said. */
export const LESSON_REVISION = 1;

/**
 * A run of **bold** inside a lesson's prose.
 *
 * Two or three words a paragraph, and they are chosen so that reading only the
 * bold gives you the lesson. That is the skim path — it is what makes a lesson
 * survive being opened by somebody who was never going to read all of it — and
 * it is why the emphasis is authored rather than left to the screen.
 */
export type LessonProse = string;

export interface LessonListItem {
  term: string;
  text: string;
}

/**
 * The pieces a lesson is built from.
 *
 * Four kinds, deliberately. It is enough for the shapes these lessons actually
 * take and small enough that none of them can be authored into something the
 * screen cannot make look considered. A lesson written as one block of prose is
 * a wall, and a wall gets closed.
 */
export type LessonBlock =
  | { kind: 'text'; text: LessonProse }
  /** The one number, alone. A lesson with no honest number does not get one. */
  | { kind: 'fact'; value: string; caption: string }
  /** For the lessons whose content genuinely is a set. */
  | { kind: 'list'; items: readonly LessonListItem[] }
  /** Always last. The only block with an imperative in it. */
  | { kind: 'do'; text: LessonProse };

export type LessonId =
  | 'plan.grows'
  | 'plan.consistency'
  | 'plan.missed'
  | 'plan.after'
  | 'sleep.anchor'
  | 'sleep.light'
  | 'sleep.caffeine'
  | 'sleep.alcohol'
  | 'sleep.bed'
  | 'sleep.threeam'
  | 'sleep.debt'
  | 'body.inertia'
  | 'body.movement'
  | 'body.dip'
  | 'anger.meter'
  | 'anger.cues'
  | 'anger.belief'
  | 'anger.assert'
  | 'anger.recovery'
  | 'focus.ready'
  | 'focus.switch'
  | 'focus.phone'
  | 'quiet.gap'
  | 'quiet.notice'
  | 'quiet.boredom'
  | 'quiet.rested';

export interface Lesson {
  id: LessonId;
  /** The claim itself, never the topic. It is the lesson; the blocks are why. */
  title: string;
  blocks: readonly LessonBlock[];
  /**
   * Where the claim comes from. Internal only, never rendered.
   *
   * It exists so that a sentence written today can be checked by somebody who
   * did not write it. General wellness advice is where confident-sounding
   * folklore gets in, and a claim with nothing behind it is the one to cut.
   */
  source: string;
}

const LESSON_LIST: readonly Lesson[] = [
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

  {
    id: 'sleep.anchor',
    title: 'Your wake time is the anchor',
    blocks: [
      {
        kind: 'text',
        text: 'You cannot decide to fall asleep. You **can** decide to get up — which is why the morning end of the night is the one worth fixing.',
      },
      { kind: 'fact', value: '30 min', caption: 'the most it should move, any day' },
      {
        kind: 'text',
        text: 'Hold it and the sleepiness starts arriving **on its own**, at roughly the same hour, without having to be negotiated with.',
      },
      {
        kind: 'do',
        text: 'Pick **one wake time** for the next seven days. The weekend is the part that does the work.',
      },
    ],
    source: 'CBT-I / circadian entrainment — a fixed rise time is the standard first instruction. sleepfoundation.org CBT-I overview.',
  },
  {
    id: 'sleep.light',
    title: 'Light is the lever',
    blocks: [
      {
        kind: 'text',
        text: 'Morning light sets the clock that decides when you get sleepy, about **sixteen hours later**. It is the strongest signal you have and it is free.',
      },
      { kind: 'fact', value: '10 min', caption: 'outside, before nine' },
      {
        kind: 'text',
        text: 'Through a window is much weaker than standing in it. **Outdoor grey beats indoor bright**, by more than it looks like it should.',
      },
      {
        kind: 'do',
        text: 'Ten minutes outside before nine. **No sunglasses.** The phone can wait until you are back in.',
      },
    ],
    source: 'Circadian phase setting by morning light; outdoor illuminance is one to two orders of magnitude above indoor.',
  },
  {
    id: 'sleep.caffeine',
    title: 'Half of it is still there six hours later',
    blocks: [
      {
        kind: 'text',
        text: 'Caffeine does not wear off, it **halves**. What you drink at three in the afternoon is still **a quarter of a cup** in your blood at bedtime.',
      },
      { kind: 'fact', value: '6 hours', caption: 'before half of it is gone' },
      {
        kind: 'text',
        text: 'You will still fall asleep on it, which is what makes it so hard to notice. It does not keep you up — it **flattens the deep part** and leaves you tired enough tomorrow to want more.',
      },
      {
        kind: 'do',
        text: '**Last one before noon**, for seven days. Judge it at the end of the week, not tomorrow morning.',
      },
    ],
    source: 'Caffeine half-life ~5–6h in healthy adults; slow-wave sleep suppression documented at evening doses.',
  },
  {
    id: 'sleep.alcohol',
    title: 'It trades the first half for the second',
    blocks: [
      {
        kind: 'text',
        text: 'A drink gets you to sleep **faster** and makes the back half of the night worse. It is why you woke at four and could not work out why.',
      },
      { kind: 'fact', value: '3 hours', caption: 'worth leaving before bed' },
      {
        kind: 'text',
        text: 'As it clears, the body **rebounds**: lighter sleep, more waking, and an earlier finish than the one you went to bed for.',
      },
      {
        kind: 'do',
        text: 'If you are drinking tonight, **stop three hours before bed** and put a glass of water beside it.',
      },
    ],
    source: 'Alcohol reduces sleep onset latency, suppresses REM early and causes second-half fragmentation as it metabolises.',
  },
  {
    id: 'sleep.bed',
    title: 'The bed is for sleep',
    blocks: [
      {
        kind: 'text',
        text: 'If the bed is also where you scroll, work and worry, the body stops reading it as a **sleep cue** and starts reading it as **the place you lie awake**.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Twenty minutes awake', text: 'Get up. Sit somewhere dim and dull.' },
          { term: 'Go back sleepy', text: 'Sleepy, not tired. They are not the same feeling.' },
          { term: 'Clock turned away', text: 'The arithmetic is the problem, not the hour.' },
        ],
      },
      {
        kind: 'text',
        text: 'It sounds backwards, and it is the **best-evidenced** thing on this list. You are teaching the bed what it is for.',
      },
      {
        kind: 'do',
        text: 'Tonight, if you are still awake after twenty minutes, **get up**. It will feel wrong. Do it anyway.',
      },
    ],
    source: 'Stimulus control, the highest-evidence component of CBT-I. sleepfoundation.org CBT-I overview.',
  },
  {
    id: 'sleep.threeam',
    title: 'Waking is normal, the thinking is not',
    blocks: [
      {
        kind: 'text',
        text: 'Everyone surfaces between sleep cycles, several times a night. Most of the time you never know, because **nothing happened** — you turned over and went back.',
      },
      { kind: 'fact', value: '90 min', caption: 'from one cycle to the next' },
      {
        kind: 'text',
        text: 'So the waking is not the problem. **Checking the clock** is: the sum you then do about how much is left, and the decision that tomorrow is already ruined.',
      },
      {
        kind: 'do',
        text: 'Turn the clock **away from the bed** tonight. If you cannot know the time, there is no sum to do.',
      },
    ],
    source: 'Sleep cycles ~90 min with brief arousals at boundaries; clock-monitoring is a documented maintaining factor in insomnia.',
  },
  {
    id: 'sleep.debt',
    title: 'This is where your fuse went',
    blocks: [
      {
        kind: 'text',
        text: 'After a short night everything lands harder. The same email, the same traffic, and a **shorter distance** between mildly annoyed and genuinely angry.',
      },
      { kind: 'fact', value: '1 night', caption: 'is enough to see it' },
      {
        kind: 'text',
        text: 'Which means the temper you are working on is sometimes **a sleep problem** wearing a different coat. Worth ruling out before you blame yourself for it.',
      },
      {
        kind: 'do',
        text: 'This week, note the night before each day that went badly. **Look for the overlap.**',
      },
    ],
    source: 'Sleep restriction studies show next-day increases in irritability and emotional reactivity after a single short night.',
  },

  {
    id: 'body.inertia',
    title: 'The first twenty minutes are not the day',
    blocks: [
      {
        kind: 'text',
        text: 'Sleep inertia is the fog on waking. It lasts **twenty to thirty minutes** after a normal night, and it is not evidence about how you slept.',
      },
      { kind: 'fact', value: '20–30 min', caption: 'before you can judge anything' },
      {
        kind: 'text',
        text: 'Which matters, because most of us decide what kind of day this is going to be **in minute three** — on the worst information we will have all day.',
      },
      {
        kind: 'do',
        text: '**Do not rate the day** until you are twenty minutes into it. Get up, get light, then decide.',
      },
    ],
    source: 'Sleep inertia: measurable performance and mood decrement for 15–30 min after waking from normal sleep.',
  },
  {
    id: 'body.movement',
    title: 'The fastest mood lever there is',
    blocks: [
      {
        kind: 'text',
        text: 'A short walk shifts how you feel **faster** and more reliably than nearly anything else we can point at. It does not have to be a workout to count.',
      },
      { kind: 'fact', value: '10 min', caption: 'is the whole dose' },
      {
        kind: 'text',
        text: 'It works better **outdoors**, and better when it is not also an errand. The point is **the moving, not the arriving**.',
      },
      {
        kind: 'do',
        text: 'Ten minutes outside today with **no destination**. Phone in your pocket, not your hand.',
      },
    ],
    source: 'Acute mood effects of brief moderate activity are among the most replicated findings in the area.',
  },
  {
    id: 'body.dip',
    title: 'The afternoon dip is real',
    blocks: [
      {
        kind: 'text',
        text: 'The early-afternoon slump is **part of the clock**, not a failure of will. It turns up whether or not you had lunch, and whatever the lunch was.',
      },
      { kind: 'fact', value: '2–4pm', caption: 'for most people, most days' },
      {
        kind: 'text',
        text: 'So stop spending it on the work that needs the most of you — and stop **drinking through it**. That is the coffee that is still there at bedtime.',
      },
      {
        kind: 'do',
        text: 'Put the **easiest thing on your list** in the dip today, and move the hard one into the morning.',
      },
    ],
    source: 'Post-lunch dip is a circadian trough, present in the absence of a meal.',
  },

  {
    id: 'anger.meter',
    title: 'Catch it at four, not at nine',
    blocks: [
      {
        kind: 'text',
        text: 'Put a number on it as it climbs, one to ten. At nine there is nothing left to do but ride it out. At four there is still **a choice**.',
      },
      { kind: 'fact', value: '4', caption: 'where the choice still exists' },
      {
        kind: 'text',
        text: 'The number is not really the point. **Noticing** is. Naming the level turns being angry into watching yourself be angry, and those are different states.',
      },
      {
        kind: 'do',
        text: 'Next time it climbs, **say the number** to yourself and nothing else. Do not try to change it yet.',
      },
    ],
    source: 'The anger meter, SAMHSA anger management manual (PEP19-02-01-001), session 2.',
  },
  {
    id: 'anger.cues',
    title: 'It announces itself four ways',
    blocks: [
      {
        kind: 'text',
        text: 'It is never actually sudden. There is a run-up, and the run-up shows in four places. One of them is **yours** — the job is knowing which.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Body', text: 'Jaw, shoulders, heat in the face, a breath you are holding.' },
          { term: 'Thought', text: 'A sentence you have thought before, word for word.' },
          { term: 'Feeling', text: 'Not anger yet. Usually hurt, or being dismissed.' },
          { term: 'Action', text: 'A door shut harder than it needed to be.' },
        ],
      },
      {
        kind: 'text',
        text: 'Most people have **one reliable first signal** and have never gone looking for it. Find yours and you get the run-up back.',
      },
      {
        kind: 'do',
        text: 'Think of the last time. **Which of the four came first?** That one is your early warning.',
      },
    ],
    source: 'Four cue types (physical, behavioural, emotional, cognitive), SAMHSA anger management manual, session 2.',
  },
  {
    id: 'anger.belief',
    title: 'The event is not what made you angry',
    blocks: [
      {
        kind: 'text',
        text: 'Between what happened and how you felt there is a step: **what you concluded** about it. They did that because they think I do not matter.',
      },
      {
        kind: 'text',
        text: 'The event you cannot argue with. The conclusion you can — and it is almost always the part that was **guessed**.',
      },
      {
        kind: 'text',
        text: 'Most of what makes people angriest is **a guess about intent** that they would not defend out loud if asked to.',
      },
      {
        kind: 'do',
        text: 'Take one thing that annoyed you this week. Write down **the conclusion you drew**, then one other explanation that fits the same facts.',
      },
    ],
    source: 'A-B-C-D model (activating event, belief, consequence, dispute), SAMHSA anger management manual, session 5.',
  },
  {
    id: 'anger.assert',
    title: 'Passive, aggressive, or straight',
    blocks: [
      {
        kind: 'text',
        text: 'Three ways to handle it, and only one of them **costs less later** than it does now.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Passive', text: 'You store it. It comes out somewhere it does not belong.' },
          { term: 'Aggressive', text: 'You spend it. It works once, and it is expensive.' },
          { term: 'Straight', text: 'Name the thing, say what you want, stop talking.' },
        ],
      },
      {
        kind: 'text',
        text: 'Straight feels aggressive from the inside the first few times. It is not. It is **unfamiliar**, which is a different thing.',
      },
      {
        kind: 'do',
        text: 'One thing today, said straight. **Name it, ask for it, stop.** Do not explain it twice.',
      },
    ],
    source: 'Assertiveness training and the conflict resolution model, SAMHSA anger management manual, sessions 7–8.',
  },
  {
    id: 'anger.recovery',
    title: 'The recovery matters more than the spike',
    blocks: [
      {
        kind: 'text',
        text: 'Everybody spikes. What separates a short fuse from a long one is not the height of it — it is **how fast it comes back down**.',
      },
      { kind: 'fact', value: '20 min', caption: 'for the surge to clear' },
      {
        kind: 'text',
        text: 'That is the trainable half. You do not get to choose whether the surge happens. You do get to choose **what happens next**, and that is where the damage usually is.',
      },
      {
        kind: 'do',
        text: 'Next spike, give it **twenty minutes before you answer anything**. Not a rule about the anger. A rule about the reply.',
      },
    ],
    source: 'Aggression cycle: escalation, explosion, post-explosion. SAMHSA anger management manual, session 4.',
  },

  {
    id: 'focus.ready',
    title: 'Waiting to feel ready is the bug',
    blocks: [
      {
        kind: 'text',
        text: 'Motivation follows starting, not the other way round. The wanting-to shows up **once you are in it** — a little after the point most people decide it is not coming.',
      },
      { kind: 'fact', value: '2 min', caption: 'of doing it badly, first' },
      {
        kind: 'text',
        text: 'So the only decision that matters is **the first two minutes**. That is a much smaller decision than the one you keep trying to make.',
      },
      {
        kind: 'do',
        text: 'Pick the thing you are avoiding. Do **two minutes of it badly**. You are allowed to stop after.',
      },
    ],
    source: 'Behavioural activation — action precedes motivation; the two-minute entry rule is the applied form.',
  },
  {
    id: 'focus.switch',
    title: 'The switch costs more than the minute',
    blocks: [
      {
        kind: 'text',
        text: 'The interruption is not the expensive part. **Coming back** is. Attention does not resume where it stopped, it restarts some way behind.',
      },
      { kind: 'fact', value: '23 min', caption: 'the most-cited estimate' },
      {
        kind: 'text',
        text: 'Which is why an hour with **six interruptions** in it is not fifty-four minutes of work. It is closer to none.',
      },
      {
        kind: 'do',
        text: '**One block today.** Thirty minutes, one thing, notifications off. Protect the block, not the whole day.',
      },
    ],
    source: 'Mark et al., time to resume an interrupted task. Widely cited; treat the figure as an estimate, hence the caption.',
  },
  {
    id: 'focus.phone',
    title: 'Where the phone is decides this',
    blocks: [
      {
        kind: 'text',
        text: 'Not willpower. **Distance.** Another room beats face-down on the desk, and both beat deciding forty times an hour not to look.',
      },
      {
        kind: 'text',
        text: 'The pull is not a character flaw. **Arguing with it** every few minutes is the part that actually tires you out.',
      },
      {
        kind: 'text',
        text: 'Make the decision **once, in advance**, and you do not have to keep winning it.',
      },
      {
        kind: 'do',
        text: 'For your next block, put it **in another room**. Not silent, not face-down. Away.',
      },
    ],
    source: 'Mere-presence effects on available attention; precommitment beats repeated in-the-moment self-control.',
  },

  {
    id: 'quiet.gap',
    title: 'There is a gap, and it can be widened',
    blocks: [
      {
        kind: 'text',
        text: 'Between the thing happening and your response to it there is **a moment**. It is short, and usually spent before you notice it was there.',
      },
      { kind: 'fact', value: '1 breath', caption: 'is usually the whole gap' },
      {
        kind: 'text',
        text: 'Nearly all of this is about making that moment **long enough to use**. Not calmer. **Longer.**',
      },
      {
        kind: 'do',
        text: 'Once today, when something lands badly, take **one breath before answering**. That is the practice. That is all of it.',
      },
    ],
    source: 'Response inhibition / the stimulus-response gap, the core mechanism claim of mindfulness-based stress reduction.',
  },
  {
    id: 'quiet.notice',
    title: 'Noticing is not suppressing',
    blocks: [
      {
        kind: 'text',
        text: 'The aim was never to stop feeling it. It is to **feel it and still be the one choosing**. Those are different skills, and only one of them holds up.',
      },
      {
        kind: 'text',
        text: 'Pushed down, it does not go anywhere. It waits, and it comes back **louder**, usually at a worse moment.',
      },
      {
        kind: 'text',
        text: 'Named and left alone, it does what feelings do on their own, which is **pass**.',
      },
      {
        kind: 'do',
        text: 'Next time something rises, **name it and leave it there**. “That’s frustration.” Then carry on with what you were doing.',
      },
    ],
    source: 'Affect labelling reduces amygdala response; expressive suppression carries a documented rebound.',
  },
  {
    id: 'quiet.boredom',
    title: 'Boredom is the entry fee',
    blocks: [
      {
        kind: 'text',
        text: 'The first few minutes of quiet feel like **nothing is happening**. That is not the practice failing. That is the practice.',
      },
      { kind: 'fact', value: '3 min', caption: 'of nothing, before it turns' },
      {
        kind: 'text',
        text: 'It is also the exact part everybody skips, which is why so many people have tried this and concluded it **does not work for them**.',
      },
      {
        kind: 'do',
        text: 'Sit through the dull part today **without reaching for anything**. Three minutes. It turns.',
      },
    ],
    source: 'Adjustment to low-stimulation states; early restlessness is the most common reported reason for dropping out.',
  },
  {
    id: 'quiet.rested',
    title: 'Unstimulated is not the same as rested',
    blocks: [
      {
        kind: 'text',
        text: 'Scrolling takes the demand away without giving anything back. It is why an evening of it can leave you **as tired as the day did**.',
      },
      {
        kind: 'text',
        text: 'Rest is not the absence of input. It is **input you chose** — or none at all, which is the harder of the two.',
      },
      {
        kind: 'text',
        text: 'The test is simple: **did you feel better afterwards**, or only less demanded of?',
      },
      {
        kind: 'do',
        text: 'Ten minutes with **no screen** tonight. Not a rule for life. Just notice what it is like.',
      },
    ],
    source: 'Attention restoration: passive media use does not produce the recovery that low-demand or natural settings do.',
  },
];

export const LESSONS: ReadonlyMap<LessonId, Lesson> = new Map(
  LESSON_LIST.map((lesson) => [lesson.id, lesson]),
);

export function allLessons(): readonly Lesson[] {
  return LESSON_LIST;
}

export function lessonById(id: LessonId): Lesson {
  const lesson = LESSONS.get(id);
  if (lesson == null) throw new Error(`Unknown lesson: ${id}`);
  return lesson;
}

export interface LessonPlacement {
  /** 1-based program day, matching `ProgramDayDefinition.day`. */
  day: number;
  lessonId: LessonId;
}

/**
 * Which lesson lands on which day, per plan.
 *
 * Ten per plan, on the days the plan **changes** — day one, the day a second
 * exercise joins, the day a third does, the phase boundaries — plus enough
 * spacing days to keep a roughly weekly rhythm.
 *
 * A lesson every day would be the mistake. The promise is one short thing
 * today; a daily lesson makes that two things and turns a plan into homework.
 * On a change day it is answering a question the user is already having.
 *
 * Lessons are **shared between plans on purpose**. `sleep.debt` is the same
 * lesson whether somebody came for their sleep or for their temper, and writing
 * it twice is how two versions of it end up disagreeing. Only the sequence is
 * unique to a plan: 26 lessons fill these 50 slots.
 */
export const LESSON_SEQUENCES: Record<ProgramPlanId, readonly LessonPlacement[]> = {
  night: [
    { day: 1, lessonId: 'plan.grows' },
    { day: 4, lessonId: 'sleep.anchor' },
    { day: 8, lessonId: 'sleep.light' },
    { day: 11, lessonId: 'sleep.caffeine' },
    { day: 15, lessonId: 'sleep.bed' },
    { day: 18, lessonId: 'sleep.threeam' },
    { day: 21, lessonId: 'sleep.alcohol' },
    { day: 24, lessonId: 'plan.missed' },
    { day: 26, lessonId: 'quiet.rested' },
    { day: 28, lessonId: 'plan.after' },
  ],
  morning: [
    { day: 1, lessonId: 'plan.grows' },
    { day: 4, lessonId: 'body.inertia' },
    { day: 8, lessonId: 'sleep.anchor' },
    { day: 11, lessonId: 'sleep.light' },
    { day: 15, lessonId: 'sleep.caffeine' },
    { day: 18, lessonId: 'body.movement' },
    { day: 21, lessonId: 'plan.consistency' },
    { day: 24, lessonId: 'body.dip' },
    { day: 26, lessonId: 'plan.missed' },
    { day: 28, lessonId: 'plan.after' },
  ],
  pressure: [
    { day: 1, lessonId: 'plan.grows' },
    { day: 5, lessonId: 'anger.recovery' },
    { day: 8, lessonId: 'anger.meter' },
    { day: 12, lessonId: 'anger.cues' },
    { day: 16, lessonId: 'anger.belief' },
    { day: 22, lessonId: 'sleep.debt' },
    { day: 30, lessonId: 'anger.assert' },
    { day: 36, lessonId: 'quiet.gap' },
    { day: 43, lessonId: 'body.movement' },
    { day: 56, lessonId: 'plan.after' },
  ],
  focus: [
    { day: 1, lessonId: 'plan.grows' },
    { day: 5, lessonId: 'focus.ready' },
    { day: 8, lessonId: 'focus.switch' },
    { day: 12, lessonId: 'focus.phone' },
    { day: 15, lessonId: 'body.dip' },
    { day: 19, lessonId: 'sleep.caffeine' },
    { day: 22, lessonId: 'plan.consistency' },
    { day: 29, lessonId: 'anger.cues' },
    { day: 36, lessonId: 'plan.missed' },
    { day: 42, lessonId: 'plan.after' },
  ],
  quiet: [
    { day: 1, lessonId: 'plan.grows' },
    { day: 5, lessonId: 'quiet.notice' },
    { day: 8, lessonId: 'quiet.gap' },
    { day: 12, lessonId: 'quiet.boredom' },
    { day: 15, lessonId: 'anger.cues' },
    { day: 19, lessonId: 'quiet.rested' },
    { day: 22, lessonId: 'body.movement' },
    { day: 29, lessonId: 'anger.meter' },
    { day: 36, lessonId: 'plan.missed' },
    { day: 42, lessonId: 'plan.after' },
  ],
};

/** The lesson this day of this plan asks for, or nothing. Most days: nothing. */
export function lessonForDay(
  planId: ProgramPlanId,
  programDay: number,
): Lesson | null {
  const placement = LESSON_SEQUENCES[planId].find(
    (candidate) => candidate.day === programDay,
  );
  return placement == null ? null : lessonById(placement.lessonId);
}

/**
 * How far through the plan's lessons this day is, for a screen that wants to
 * say so. 1-based, and only defined on a day that has one.
 */
export function lessonPositionForDay(
  planId: ProgramPlanId,
  programDay: number,
): { index: number; total: number } | null {
  const sequence = LESSON_SEQUENCES[planId];
  const index = sequence.findIndex((candidate) => candidate.day === programDay);
  return index === -1 ? null : { index: index + 1, total: sequence.length };
}
