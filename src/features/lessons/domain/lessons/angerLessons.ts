import type { LessonDefinition } from '../lessonBlock';

/**
 * Temper, and the pressure underneath it.
 *
 * The spine is SAMHSA's cognitive behavioural anger management manual — the
 * anger meter, the four cue types, the A-B-C-D model, the aggression cycle,
 * assertiveness. It is a published curriculum, which is what lets these make
 * claims rather than gesture at them.
 *
 * `pressure` runs on these; `quiet` and `focus` take the ones about noticing.
 */
export const ANGER_LESSONS = [
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
        text: 'That is the trainable half. You do not get to choose whether the surge happens. You do choose **what happens next**, and that is where the damage usually is.',
      },
      {
        kind: 'do',
        text: 'Next spike, give it **twenty minutes before you answer anything**. Not a rule about the anger. A rule about the reply.',
      },
    ],
    source: 'Aggression cycle: escalation, explosion, post-explosion. SAMHSA anger management manual, session 4.',
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
    id: 'anger.boring',
    title: 'Check the boring explanations first',
    blocks: [
      {
        kind: 'text',
        text: 'Hungry, short of sleep, too hot, running late. **Half of it** has an explanation this dull, and dull explanations are the ones nobody checks.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Hungry', text: 'The shortest fuse of the lot, and the quickest to fix.' },
          { term: 'Short of sleep', text: 'Everything lands harder. Look at the night before.' },
          { term: 'Too hot', text: 'Genuinely raises reactivity. Open a window first.' },
          { term: 'Running late', text: 'The whole day gets borrowed against.' },
        ],
      },
      {
        kind: 'text',
        text: 'It is not that the reason was wrong. It is that **the state came first**, and the reason only found something to attach itself to.',
      },
      {
        kind: 'do',
        text: 'Next time it climbs, **check the list before the reason**. Two of these are fixable in five minutes.',
      },
    ],
    source: 'State factors in reactivity: hunger, sleep debt, thermal discomfort and time pressure all lower the threshold.',
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
    id: 'anger.expectation',
    title: 'Most anger is a broken expectation',
    blocks: [
      {
        kind: 'text',
        text: 'Underneath nearly all of it is something you **expected and never said**. They should have known. It should have been obvious.',
      },
      {
        kind: 'text',
        text: 'Unspoken expectations are the ones most likely to be broken, and the anger when they break is **entirely real** even though nobody was ever told.',
      },
      {
        kind: 'text',
        text: 'The question that deflates most of it: **did I ever actually ask?**',
      },
      {
        kind: 'do',
        text: 'Take the last one. **Name the expectation**, then check whether you ever said it out loud to the person who broke it.',
      },
    ],
    source: 'Expectancy violation as an antecedent in cognitive models of anger; unstated standards are the common case.',
  },
  {
    id: 'anger.bucket',
    title: 'It is rarely the last thing',
    blocks: [
      {
        kind: 'text',
        text: 'The thing that set you off was small and the reaction was not. That mismatch is not a character flaw — **the bucket was already full**.',
      },
      { kind: 'fact', value: '1 day', caption: 'of small things fills it' },
      {
        kind: 'text',
        text: 'Which means the useful work is almost never on the last thing. It is on **what else was in there**, and most of that turns out to be fixable.',
      },
      {
        kind: 'do',
        text: 'Instead of arguing with the trigger, **list three other things** that were already sitting on you today.',
      },
    ],
    source: 'Cumulative load / allostatic framing: the proximate trigger is a poor predictor of response magnitude.',
  },
  {
    id: 'anger.control',
    title: 'Sort it into what you control',
    blocks: [
      {
        kind: 'text',
        text: 'Almost everything that makes people angriest sits in the half **they do not control** — what someone did, what they meant by it, how it turns out.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Yours', text: 'What you say, when you say it, what you do next.' },
          { term: 'Not yours', text: 'Their reaction, their reasons, the outcome.' },
        ],
      },
      {
        kind: 'text',
        text: 'The sorting is the intervention. **Naming the half** takes the heat out of the one you were never going to win.',
      },
      {
        kind: 'do',
        text: 'Take the thing on your mind. **Put it in one column** before you do anything else about it.',
      },
    ],
    source: 'Control appraisal: perceived controllability moderates anger intensity and predicts problem-focused coping.',
  },
  {
    id: 'anger.timeout',
    title: 'Leaving the room is a skill',
    blocks: [
      {
        kind: 'text',
        text: 'Walking out mid-argument reads like losing. It is the opposite: it is often **the only move** that stops the next ten minutes costing you a week.',
      },
      { kind: 'fact', value: '20 min', caption: 'away, then come back' },
      {
        kind: 'text',
        text: 'It works when you say you are coming back. **“I need twenty minutes”** is a timeout. Walking out in silence is something else entirely.',
      },
      {
        kind: 'do',
        text: 'Decide the sentence now, before you need it. **Say it out loud once** so it is easier to find later.',
      },
    ],
    source: 'Time-out procedure, SAMHSA anger management manual, session 3: the announcement and the return are both part of it.',
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
    id: 'anger.send',
    title: 'Never send it the same hour',
    blocks: [
      {
        kind: 'text',
        text: 'The message you write angry is **written for you**, not for them. It is a way of feeling better now at a price paid later.',
      },
      { kind: 'fact', value: '1 hour', caption: 'in drafts, then read it again' },
      {
        kind: 'text',
        text: 'Almost none of them survive the reread. That is not a sign you were wrong — only that **the version that helps** is a different one.',
      },
      {
        kind: 'do',
        text: 'Write it if you need to. **Leave it in drafts** and read it again in an hour before anything happens.',
      },
    ],
    source: 'Delay as a regulation strategy: the impulse to communicate anger decays faster than the appraisal behind it.',
  },
  {
    id: 'anger.rumination',
    title: 'Going over it again is not solving it',
    blocks: [
      {
        kind: 'text',
        text: 'The tenth rerun is not producing a better answer. It is **rehearsing the feeling**, and the path gets easier to find every time you walk it.',
      },
      { kind: 'fact', value: '2 ×', caption: 'after that it is not thinking' },
      {
        kind: 'text',
        text: 'There is a real difference between working out what to do and **going over what happened**. One has a next action. The other never does.',
      },
      {
        kind: 'do',
        text: 'When you catch the rerun, ask: **what is the next action?** If there is not one, it is not thinking.',
      },
    ],
    source: 'Rumination maintains and amplifies anger; distinguishing it from problem-solving is the standard intervention.',
  },
  {
    id: 'anger.driving',
    title: 'The car is where people practise',
    blocks: [
      {
        kind: 'text',
        text: 'It is the purest version: strangers, no consequences, and **everything read as intent**. Nobody cut you up on purpose. Almost nobody ever does.',
      },
      { kind: 'fact', value: '1 trip', caption: 'gives you five chances' },
      {
        kind: 'text',
        text: 'Which makes it the best place to practise. The stakes are low and the trigger turns up **several times a journey**, on a schedule you do not control.',
      },
      {
        kind: 'do',
        text: 'Next drive, **pick one moment** and give the other driver the most boring explanation you can think of.',
      },
    ],
    source: 'Hostile attribution bias is unusually easy to observe in traffic, where intent is unknowable and assumed anyway.',
  },
  {
    id: 'anger.repair',
    title: 'Repair is the skill that counts',
    blocks: [
      {
        kind: 'text',
        text: 'Everybody loses it sometimes. What separates the relationships that survive it is **what happens in the hour after**, not how rarely it happens.',
      },
      { kind: 'fact', value: '1 hour', caption: 'is the window that matters' },
      {
        kind: 'text',
        text: 'A repair is short and specific: what you did, not why you did it. **Explaining is not repairing**, and it usually undoes the repair.',
      },
      {
        kind: 'do',
        text: 'If you snapped at someone this week, **go back and name it**. Six words. Nothing attached to the end.',
      },
    ],
    source: 'Repair attempts after conflict predict relationship outcomes more strongly than conflict frequency does.',
  },
] as const satisfies readonly LessonDefinition[];
