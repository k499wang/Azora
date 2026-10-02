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
    title: 'A short pause helps you reply well',
    step: 'When anger spikes, pause before you reply.',
    blocks: [
      {
        kind: 'text',
        text: 'One small skill can save a friendship, a job, or just your evening: **the pause**. When anger hits, it hits fast. Your face gets hot and the words rush out. A short pause gives your clear thinking time to catch up.',
      },
      { kind: 'fact', value: '1 pause', caption: 'between feeling angry and choosing what to do' },
      {
        kind: 'text',
        text: '**Anger is normal.** Everyone feels it. You cannot always stop the first rush. But you can choose **what happens next**. The pause is the gap between feeling angry and doing something about it.',
      },
      { kind: 'text', text: 'Say your boss sends a sharp text: “Why isn’t this done yet?” Your jaw tightens. Your thumbs want to fire back. Reply right now, and the fight becomes about your words. **Pause first, and you get to choose them.**' },
      { kind: 'text', text: '**Here is how to pause.** Stop typing. Put the phone down. Breathe out slowly. Then read the message again and ask: what do I want this reply to do? You can still be firm. Want a pause with steps to follow? Try **5-4-3-2-1**, a Reset in this app. A Reset is **a short guided practice**, about 2–3 minutes, that helps you calm down or wake up. You name 5 things you see, 4 you hear, 3 you can touch, 2 you smell and 1 you taste.' },
      {
        kind: 'choice',
        prompt: 'Your boss texts, “Why isn’t this done yet?” Your face gets hot. What is your best next move?',
        options: [
          { label: 'Pause, breathe out, then read it again', feedback: 'Yes. The pause lets the first rush pass. Then you can answer the real question, not just the tone.' },
          { label: 'Reply right now so the feeling is out', feedback: 'That feels good for a second, but words sent in a rush are hard to take back. Pause first, then reply.' },
        ],
      },
      { kind: 'sequence', prompt: 'A sharp message arrives. Put the steps in the right order.', steps: [
        'Notice the urge to snap back.',
        'Pause and read the message again.',
        'Reply with what happened and what you need.',
      ], feedback: 'Notice, pause, then reply. That order lets you answer with a clear head instead of a hot one.' },
      {
        kind: 'do',
        text: 'Next time anger spikes, **pause before you reply**. Breathe out, read it again, and answer when you can say what happened and what you need.',
      },
    ],
    source: 'Aggression cycle and time-out skills: SAMHSA anger management manual, sessions 3–4.',
  },
  {
    id: 'anger.meter',
    title: 'Rate your anger to catch it early',
    step: 'When anger climbs, silently rate it from one to ten.',
    blocks: [
      {
        kind: 'text',
        text: 'Want to catch anger **before it takes over**? Give it a number. This simple tool comes from the anger management course used by SAMHSA, the U.S. government’s mental health agency. It takes one second, and you can do it anywhere.',
      },
      { kind: 'fact', value: '1–10', caption: 'your anger meter: 1 is calm, 10 is as angry as you get' },
      {
        kind: 'text',
        text: 'This is called **an anger meter**. One means you are barely bothered. Ten means as angry as you have ever been. The number is not good or bad. It just tells you **how high the anger is climbing**.',
      },
      { kind: 'text', text: 'Each number feels different in your body. Maybe at a 3 your jaw gets tight. At a 5 your voice gets louder. At a 7 you want to shout or slam a door. **Learn what your own numbers feel like.**' },
      { kind: 'text', text: '**Act while the number is low.** It is much easier to cool down from a 3 than from an 8. So when you spot a 3 or 4, do something right then: breathe out slowly, step away, or wait before you reply. **Do not wait for a 9.**' },
      {
        kind: 'choice',
        prompt: 'Your coworker interrupts you again. You notice you are at a 3 out of 10. What should you do?',
        options: [
          { label: 'Name the number and pause', feedback: 'Exactly. A 3 is the easy time to act. A slow breath or a short pause now keeps it from climbing to an 8.' },
          { label: 'Wait and see if it gets worse', feedback: 'Waiting makes it harder. Anger is easiest to cool down while the number is still low, so act at the 3.' },
        ],
      },
      { kind: 'reveal', prompt: 'Tap each part of a quick anger check.', items: [
        { label: 'My number', detail: 'Say it silently: “I am at a 4.” The number tells you if anger is climbing.' },
        { label: 'My body sign', detail: 'Find where you feel it: a tight jaw, a hot face or a louder voice. That sign is your early alarm.' },
      ] },
      {
        kind: 'do',
        text: 'Next time anger climbs, **say the number** to yourself. That is all for today. Just notice it, and notice where you feel it in your body.',
      },
    ],
    source: 'The anger meter, SAMHSA anger management manual (PEP19-02-01-001), session 2.',
  },
  {
    id: 'anger.cues',
    title: 'Spot the early warning signs of anger',
    step: 'Recall a recent anger and name the first sign you noticed.',
    blocks: [
      {
        kind: 'text',
        text: 'Anger feels like it comes out of nowhere. It usually does not. **It sends warning signs first.** Learn to spot yours and you get a head start. You can calm down before you say something you regret.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Body', text: 'Your jaw clenches, your shoulders rise, your face gets hot.' },
          { term: 'Thoughts', text: 'A sentence pops up, like “Here we go again.”' },
          { term: 'Feelings', text: 'Under the anger, you may feel hurt, embarrassed or scared.' },
          { term: 'Actions', text: 'You slam a door, raise your voice or type faster.' },
        ],
      },
      {
        kind: 'text',
        text: 'These are the **four kinds of warning signs**: body, thoughts, feelings and actions. Most people have one or two that show up first, again and again. Your job is to **find your first one**.',
      },
      { kind: 'text', text: 'Think back to your last argument. Before you raised your voice, what happened? Maybe your jaw got tight. Maybe you thought, “They never listen.” **That was your warning sign.** Next time it shows up, you will know what it means.' },
      { kind: 'text', text: 'Body signs are often the easiest to catch. **Muscle Release** trains you to find them. It is a Reset in this app. A Reset is a short guided practice that helps you calm down or wake up. You squeeze one body part, then let it go. You learn where you hold tension, so **you notice it sooner**.' },
      {
        kind: 'choice',
        prompt: 'You are in a tense talk and feel your jaw tighten. What can that sign do for you?',
        options: [
          { label: 'Tell me to slow down now', feedback: 'Right. A tight jaw is an early alarm. Slowing down now is much easier than calming down after you have snapped.' },
          { label: 'Nothing, so I ignore it', feedback: 'Ignoring it lets the anger keep climbing. The sign is useful because it comes early, while the moment is still small.' },
        ],
      },
      {
        kind: 'do',
        text: 'Think of a recent time you got angry. **Which sign came first:** a body change, a thought, a feeling, or an action?',
      },
    ],
    source: 'Four cue types (physical, behavioural, emotional, cognitive), SAMHSA anger management manual, session 2.',
  },
  {
    id: 'anger.boring',
    title: 'Hunger and tiredness make anger stronger',
    step: 'When anger climbs, meet a basic need before deciding what to say.',
    blocks: [
      {
        kind: 'text',
        text: 'Here is a fast way to feel less angry: **check your basic needs**. Being hungry, tired, uncomfortable or rushed makes small problems feel huge. Meet the need, and the problem often shrinks back to its real size.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Hungry', text: 'Missed a meal? Food can take the edge off fast.' },
          { term: 'Short of sleep', text: 'Everything feels harder after a bad night.' },
          { term: 'Uncomfortable', text: 'Too hot, too loud, too crowded, or in pain.' },
          { term: 'Running late', text: 'Rushing leaves no room for patience.' },
        ],
      },
      {
        kind: 'text',
        text: 'Food, sleep, comfort and time are **basic needs**. When one is missing, your fuse gets shorter. You snap at things that would not bother you on a good day. **The problem is still real.** It just feels bigger.',
      },
      { kind: 'text', text: 'Picture this. It is 6 p.m. You skipped lunch. Your bus is twenty minutes late, and you want to yell at someone. The late bus really is annoying. But **hunger is turning the volume up**.' },
      { kind: 'text', text: '**Meet the need first, then deal with the problem.** Eat a snack. Drink some water. Sit down or find a quieter spot. Then ask: is this still a big deal? If it is, deal with it. You will do it **with a clearer head**.' },
      {
        kind: 'choice',
        prompt: 'You snap at a friend after a long day with no lunch. What should you check first?',
        options: [
          { label: 'Whether hunger or tiredness is adding pressure', feedback: 'Yes. A missing basic need shortens your fuse. Eat or rest first, then decide if there is still a real issue to talk about.' },
          { label: 'Decide my friend caused all of it', feedback: 'Your friend may have done something, but hunger and tiredness can make it feel much bigger. Check your needs first.' },
        ],
      },
      {
        kind: 'do',
        text: 'Next time anger climbs, **check your basic needs**. Are you hungry, tired, uncomfortable or rushed? Meet one if you can, then decide what to say.',
      },
    ],
    source: 'State factors in reactivity: hunger, sleep debt, thermal discomfort and time pressure all lower the threshold.',
  },
  {
    id: 'anger.belief',
    title: 'Check the story you tell yourself',
    step: 'Write one other explanation for something that annoyed you this week.',
    blocks: [
      {
        kind: 'text',
        text: 'Much of our anger comes from **the story we tell ourselves** about what happened. Change the story, and the anger drops. This idea sits at the heart of the anger course used by SAMHSA, the U.S. government’s mental health agency.',
      },
      {
        kind: 'text',
        text: 'Something happens. Then your mind quickly decides **what it means**. That meaning is a guess. And it is the guess, more than the event itself, that **makes the anger burn**.',
      },
      {
        kind: 'text',
        text: 'Your friend shows up thirty minutes late. That is the event. Your mind says, “They do not care about me.” That is the story. **The lateness is a fact. The reason is a guess.** Maybe traffic was bad. Maybe they lost track of time.',
      },
      { kind: 'text', text: '**Try this four-step check.** One: what happened? Two: what did I tell myself it means? Three: how did I feel? Four: what else could explain it? Pick another reason that fits the facts. It does not have to be a happy one, just **a fair one**.' },
      { kind: 'text', text: 'Then **ask instead of guessing**: “Hey, what happened?” If your first guess was right, you can still speak up. Now you are acting on facts, not on a story.' },
      {
        kind: 'choice',
        prompt: 'A coworker has not answered your message all day. You think, “They do not respect me.” What is a better next move?',
        options: [
          { label: 'Ask what else might explain the delay', feedback: 'Yes. Maybe they are busy or out sick. Checking the story lowers the heat, and you can still ask them about it.' },
          { label: 'Treat my first thought as true', feedback: 'The delay is a fact, but the reason is still a guess. Find another explanation that fits before you decide how to feel.' },
        ],
      },
      {
        kind: 'do',
        text: 'Pick one thing that annoyed you this week. Write down **the story you told yourself**, then one other explanation that fits the same facts.',
      },
    ],
    source: 'A-B-C-D model (activating event, belief, consequence, dispute), SAMHSA anger management manual, session 5.',
  },
  {
    id: 'anger.expectation',
    title: 'Ask for help out loud',
    step: 'Write down the help you wanted and whether you clearly asked.',
    blocks: [
      {
        kind: 'text',
        text: 'A lot of anger comes from **help we wanted but never asked for**. The fix is simple: say what you need, clearly and out loud. It gives the other person a real chance to show up for you.',
      },
      {
        kind: 'text',
        text: 'We often expect people to just know what we need. When they do not, we think, “They should have known!” But **people cannot read minds**. A wish you never said out loud is easy to miss.',
      },
      {
        kind: 'text',
        text: 'Say you spent all evening cleaning. You hoped your partner would notice and do the dishes. They did not, and now you feel annoyed. But did you ask? **“Can you do the dishes tonight?”** takes five seconds.',
      },
      { kind: 'text', text: '**A clear request has two parts**: the action and the time. “Can you take the trash out before 8?” is clear. “You never help” is not. It starts a fight about the blame instead of **solving the problem**.' },
      { kind: 'text', text: 'Sometimes you did ask, many times, and nothing changed. That is a different problem. Then it is time for **a bigger talk** about who does what.' },
      {
        kind: 'choice',
        prompt: 'You wanted help with dinner, but you never said so. Now you feel annoyed. What would help most?',
        options: [
          { label: 'Say clearly what help I want', feedback: 'Yes. A clear ask, like “Can you chop the onions?”, gives the other person something real to say yes to.' },
          { label: 'Expect them to figure it out', feedback: 'Most people miss wishes nobody said out loud, even people who love you. Asking clearly gives them a fair chance to help.' },
        ],
      },
      {
        kind: 'do',
        text: 'Think of a recent time you wanted help. **Write down what you wanted**, then ask yourself: did I clearly tell them?',
      },
    ],
    source: 'Expectancy violation as an antecedent in cognitive models of anger; unstated standards are the common case.',
  },
  {
    id: 'anger.bucket',
    title: 'Small stresses add up to big anger',
    step: 'List up to three other pressures behind a surprising reaction.',
    blocks: [
      {
        kind: 'text',
        text: 'Ever blown up over something tiny and wondered why? Here is the answer. **Stress adds up during the day**, like water filling a bucket. A small thing can be the last drop that makes it spill over.',
      },
      { kind: 'fact', value: '3 pressures', caption: 'can fill your bucket before the small thing hits' },
      {
        kind: 'text',
        text: 'The last thing that happened gets the blame. But **the bucket was already full**. Bad sleep, a rushed morning and money worries all add water. Then one tiny comment tips it over.',
      },
      { kind: 'text', text: 'You slept badly. Your train was late. Your meeting went wrong. Then your roommate says, “You left the light on,” and you yell. **The comment is only part of the story.** The whole day made the reaction big.' },
      { kind: 'text', text: 'When a reaction surprises you, **list what was already in the bucket**. Then sort it. What can you fix today, like eating or resting? What needs a bigger plan? Now you are **solving the right problem**.' },
      {
        kind: 'choice',
        prompt: 'A tiny problem makes you furious at the end of a hard day. What is probably going on?',
        options: [
          { label: 'Earlier stresses have added up', feedback: 'Exactly. The small thing was the last drop. Looking at the whole day shows you what really needs care.' },
          { label: 'The tiny problem explains everything', feedback: 'The small thing matters, but it rarely explains a big reaction on its own. Look at what else filled your day.' },
        ],
      },
      {
        kind: 'do',
        text: 'Think of a moment when your reaction surprised you. **List up to three other pressures** you were dealing with that day.',
      },
    ],
    source: 'Cumulative load / allostatic framing: the proximate trigger is a poor predictor of response magnitude.',
  },
  {
    id: 'anger.control',
    title: 'Focus on what you can control',
    step: 'Write one action you can choose about a current problem.',
    blocks: [
      {
        kind: 'text',
        text: 'A lot of the stress in a fight comes from trying to change someone else. **Focus on your own next move**, and you feel calmer and more in charge. This lesson shows you how to tell the two apart.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Yours', text: 'What you say, when you say it, and what you do next.' },
          { term: 'Not yours', text: 'What they say, how they feel, and how it all turns out.' },
        ],
      },
      {
        kind: 'text',
        text: 'Every argument has **two piles**. Your pile holds your words, your timing and your next step. Their pile holds their words, their feelings and their choices. You can only act on **your own pile**.',
      },
      { kind: 'text', text: 'Your neighbor plays loud music late at night. You can knock and ask them to turn it down. **Asking is yours.** Whether they agree is theirs. If they say no, you still have moves: earplugs, a note, or a call to the landlord.' },
      { kind: 'text', text: 'When you feel stuck, ask: **“What is one thing I can do next?”** Do that one thing. Stop trying to force their reaction. **Your power is in your own choices.**' },
      {
        kind: 'choice',
        prompt: 'Someone keeps talking to you in a rude tone. What can you control?',
        options: [
          { label: 'My next sentence and whether I take a break', feedback: 'Yes. You cannot set their tone, but you can choose your words, ask for a change, or step away.' },
          { label: 'Make them speak nicely right now', feedback: 'You can ask them to change, but you cannot make them. Put your energy into your own next step instead.' },
        ],
      },
      {
        kind: 'do',
        text: 'Think of one current problem. **Write one action you can choose** and one outcome you cannot control alone.',
      },
    ],
    source: 'Control appraisal: perceived controllability moderates anger intensity and predicts problem-focused coping.',
  },
  {
    id: 'anger.timeout',
    title: 'Take a break and say when you’ll return',
    step: 'Practise asking for a break and naming when you will return.',
    blocks: [
      {
        kind: 'text',
        text: 'Some arguments get too hot to fix in the moment. **A time-out stops the damage.** It is a core skill in the U.S. government’s anger management course. Done right, it calms things down without leaving the other person hanging.',
      },
      { kind: 'fact', value: '1 return time', caption: 'turns walking away into a real break' },
      {
        kind: 'text',
        text: 'A time-out is **a short break from an argument**. The key is to say when you will come back. Without that, walking away can feel like you are giving up on the other person.',
      },
      { kind: 'text', text: 'You and your partner are arguing about money. Voices are rising. You say, **“I’m too upset to talk well right now. Let’s talk again after dinner.”** Then you go for a walk.' },
      { kind: 'text', text: '**Use the break to calm down**, not to plan your next attack. Walk, stretch or breathe slowly. Then come back at the time you said. Start with the problem you want to solve. If it heats up again, take another break. **Coming back is part of the skill.**' },
      {
        kind: 'choice',
        prompt: 'You are too heated to talk clearly. What is a good time-out?',
        options: [
          { label: 'Say I need a break and when I will return', feedback: 'Yes. A clear return time gives you room to calm down without dropping the issue or the person.' },
          { label: 'Walk away without a word', feedback: 'A sudden exit leaves the other person guessing if you will ever come back. Say when you will return.' },
        ],
      },
      {
        kind: 'do',
        text: 'Practise one sentence now: **“I need a break. Can we talk again after dinner?”** Pick a return time you can keep.',
      },
    ],
    source: 'Time-out procedure, SAMHSA anger management manual, session 3: the announcement and the return are both part of it.',
  },
  {
    id: 'anger.assert',
    title: 'Ask clearly without attacking',
    step: 'Make one clear request today, naming the behaviour and what helps.',
    blocks: [
      {
        kind: 'text',
        text: 'You can stand up for yourself **without starting a fight**. It is called being assertive. It is the middle path between staying quiet and blowing up, and it is a key skill in the U.S. government’s anger management course.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Passive', text: 'You say nothing, even though you need something to change.' },
          { term: 'Aggressive', text: 'You attack or blame the other person.' },
          { term: 'Assertive', text: 'You say what happened and ask for what you need, kindly and clearly.' },
        ],
      },
      {
        kind: 'text',
        text: '**Assertive means** saying what happened and what you need, clearly and kindly. You are not hiding what you want. You are not attacking either. **You are just being clear.**',
      },
      { kind: 'text', text: 'Your roommate left dishes in the sink again. Staying quiet makes you stew. Yelling “You never clean up!” starts a fight. **Assertive sounds like this:** “The dishes were left out again. Can you wash yours before bed?”' },
      { kind: 'text', text: '**Use this simple script:** “When this happens, I feel this. Could we try that instead?” Name one specific thing. Ask for one clear change. Then listen to their answer. **Clear does not mean harsh.**' },
      {
        kind: 'choice',
        prompt: 'You need to tell someone their comment hurt. Which opening is clearer?',
        options: [
          { label: 'When you said that, I felt hurt', feedback: 'Yes. It names one moment and one feeling, so the other person knows exactly what you want to talk about.' },
          { label: 'You always ruin everything', feedback: 'A big accusation makes them defend themselves. Name the one moment instead, and the talk can actually go somewhere.' },
        ],
      },
      {
        kind: 'do',
        text: 'Try one clear request today. **Name the behaviour and what would help**, then leave space for their answer.',
      },
    ],
    source: 'Assertiveness training and the conflict resolution model, SAMHSA anger management manual, sessions 7–8.',
  },
  {
    id: 'anger.send',
    title: 'Reread an angry message before you send it',
    step: 'Leave an angry message in drafts and reread it before sending.',
    blocks: [
      {
        kind: 'text',
        text: 'One habit can save you from **messages you wish you could unsend**: save the angry draft and reread it later. It costs you nothing, and it can protect a friendship or a job.',
      },
      { kind: 'fact', value: '1 reread', caption: 'before you hit send' },
      {
        kind: 'text',
        text: 'Writing while angry is fine. It helps you figure out what you feel. **Sending it right away** is the risky part. The first draft often says more than you really mean.',
      },
      { kind: 'text', text: 'A friend cancels on you for the third time. You type, “You are so selfish. Forget it.” **Stop there and save it as a draft.** An hour later, you may write, “I was really looking forward to this. Can we pick a new date?”' },
      { kind: 'text', text: 'Before you send, **ask three questions**: What happened? What do I need? What do I want them to do? If your draft does not answer these, rewrite it. **Describe the event, not the person.** If it is urgent, still take one minute to reread.' },
      {
        kind: 'choice',
        prompt: 'You have just typed an angry message. What is your next step?',
        options: [
          { label: 'Save it and reread it after a pause', feedback: 'Yes. The pause lets you decide what you actually want the message to do before anyone reads it.' },
          { label: 'Send it now to get it over with', feedback: 'The urge to send is strongest right when you are angriest. Save it first, then choose your words.' },
        ],
      },
      {
        kind: 'do',
        text: 'Next time you write an angry message, **leave it in drafts**. Reread it later and send the words you want the other person to get.',
      },
    ],
    source: 'Delay as a regulation strategy: the impulse to communicate anger decays faster than the appraisal behind it.',
  },
  {
    id: 'anger.rumination',
    title: 'Stop replaying the same fight',
    step: 'When a thought keeps replaying, ask what the next useful action is.',
    blocks: [
      {
        kind: 'text',
        text: 'Replaying a fight over and over keeps you angry long after it ends. Learn to spot the replay, and **you can get your evening back**. It starts with one simple question.',
      },
      { kind: 'fact', value: '1 next step', caption: 'turns replaying into planning' },
      {
        kind: 'text',
        text: 'There are two kinds of thinking after a fight. **Planning** finds a next step. **Replaying** runs the same scene again: what they said, what you should have said. Replaying adds nothing new. It just keeps the anger going.',
      },
      { kind: 'text', text: 'It is 11 p.m. You are in bed, still replaying a fight with your sister. Round five, same lines. **That is the replay loop.** It feels like you are solving something, but nothing new is happening.' },
      { kind: 'text', text: 'When you catch a replay, **ask one question**: “Is there one thing I can do about this?” If yes, write it down. If no, move your attention to something else, like a show or a walk. Come back to it tomorrow. **Each time you catch it, you get better at it.**' },
      {
        kind: 'choice',
        prompt: 'You have replayed an argument several times tonight. What will move you forward?',
        options: [
          { label: 'Name one thing I can do', feedback: 'Yes. A next step turns replaying into planning. If there is nothing to do tonight, shifting your attention ends the loop.' },
          { label: 'Replay it until it feels settled', feedback: 'Replaying keeps the anger going without adding anything new. Name a next step, or shift your attention for now.' },
        ],
      },
      {
        kind: 'do',
        text: 'When you catch the replay, ask **what the next useful step is**. If there is none right now, shift your attention and come back to it later.',
      },
    ],
    source: 'Rumination maintains and amplifies anger; distinguishing it from problem-solving is the standard intervention.',
  },
  {
    id: 'anger.driving',
    title: 'In traffic, keep your eyes on the road',
    step: 'If a driver upsets you, leave space and keep watching the road.',
    blocks: [
      {
        kind: 'text',
        text: 'Road rage starts with **a guess about another driver**. Learn to spot that guess, and you drive calmer and safer. It takes one short sentence.',
      },
      { kind: 'fact', value: '1 sentence', caption: 'for when someone cuts you off: “I don’t know their reason.”' },
      {
        kind: 'text',
        text: 'When someone cuts you off, you see what they did. You **do not know why** they did it. Your mind fills the gap fast: “They did that on purpose!” That is a guess, not a fact.',
      },
      { kind: 'text', text: 'Maybe they are rushing to the hospital. Maybe they did not see you. Maybe they are just a bad driver. **You will never know, and you do not need to.** Your only job is to get home safe.' },
      { kind: 'text', text: '**Here is what to do.** Ease off the gas. Leave extra space. Say quietly, “I don’t know their reason.” Then put your eyes back on the road ahead. Let them go. **Chasing them only puts you at risk.**' },
      {
        kind: 'choice',
        prompt: 'A driver cuts in front of you. What keeps you safe for the next minute?',
        options: [
          { label: 'Leave space and watch the road ahead', feedback: 'Yes. You can feel angry and still drive safely. Space and attention protect you, whatever their reason was.' },
          { label: 'Follow them to show they were wrong', feedback: 'Chasing them adds danger and changes nothing about what happened. Let them go and keep your focus ahead.' },
        ],
      },
      {
        kind: 'do',
        text: 'If another driver upsets you, **leave safe space** and tell yourself, “I don’t know their reason.” Keep your eyes on the road.',
      },
    ],
    source: 'Hostile attribution bias is unusually easy to observe in traffic, where intent is unknowable and assumed anyway.',
  },
  {
    id: 'anger.repair',
    title: 'Apologize clearly after you hurt someone',
    step: 'If you snapped at someone, name it and ask how to repair.',
    blocks: [
      {
        kind: 'text',
        text: 'Everyone snaps sometimes. What matters more is **what you do after**. Research on relationships shows that repairing after a fight matters more than how often you fight. Here is how to repair well, step by step.',
      },
      { kind: 'fact', value: '1 repair', caption: 'names what you did and how it hurt' },
      {
        kind: 'text',
        text: '**A good apology has three parts.** Name what you did. Say sorry. Ask what would help. Leave out the excuses at first. Your reasons can come later, **once they feel heard**.',
      },
      { kind: 'text', text: 'You yelled at your partner after a bad day. A weak apology sounds like, “Sorry if you got upset.” **A strong one sounds like this:** “I raised my voice earlier. I’m sorry. That wasn’t fair to you.”' },
      { kind: 'text', text: 'Then **listen**. They may need some time. They may ask you to do something differently. Tell them what you will try next time. Trust comes back as they see you **follow through**.' },
      {
        kind: 'choice',
        prompt: 'You spoke sharply to someone you care about. What is a good repair?',
        options: [
          { label: 'Name what I did and apologize', feedback: 'Yes. Naming exactly what you did shows you understand it. That makes the apology feel real.' },
          { label: 'Explain why I was right first', feedback: 'Your reasons can matter later. Start by owning what you did, so the other person feels heard.' },
        ],
      },
      {
        kind: 'do',
        text: 'If you snapped at someone, **name what you did** and ask what would help, once you are both ready to talk.',
      },
    ],
    source: 'Repair attempts after conflict predict relationship outcomes more strongly than conflict frequency does.',
  },
  {
    id: 'anger.oneproblem',
    title: 'Choose one problem to deal with',
    step: 'Write one specific problem and one action you can take about it.',
    blocks: [
      {
        kind: 'text',
        text: 'A difficult moment can bring several worries to mind. A late bus might remind you of money, work, and an argument at home. **Name the problem happening now.** The bus is late is different from nothing ever goes right. A specific problem gives you something you can check or act on.',
      },
      {
        kind: 'sequence',
        prompt: 'Put these steps in the order you would do them.',
        steps: [
          'Describe what happened in one sentence.',
          'Choose the part that needs attention now.',
          'Name one action you can take about that part.',
        ],
        feedback: 'Start by checking the situation. Then choose one clear action and follow the details you have checked.',
      },
      {
        kind: 'text',
        text: 'Ask what needs a decision today. **Choose one problem you can act on.** You may need to tell someone you will arrive late or check another route. The money worry may need its own time and information. You do not have to solve that worry while deciding how to reach your destination.',
      },
      {
        kind: 'choice',
        prompt: 'Your journey is delayed and several worries come to mind. What could you do first?',
        options: [
          {
            label: 'Tell the person waiting about the delay',
            feedback: 'This handles one practical part of the current problem. You can then decide whether checking another route would help.',
          },
          {
            label: 'Check another route before sending a message',
            feedback: 'This can work if you need a better arrival estimate. Keep the search specific so you can make the next decision.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Some parts of the situation are outside your control. **Focus on the available action.** You cannot make the bus arrive by thinking about it harder. You can check its expected arrival or call the person waiting. If no action is available now, write the worry down and decide when to review it.',
      },
      {
        kind: 'do',
        text: 'Think of a current problem. **Write what happened and one action you can take**. Keep other worries on a separate note for later.',
      },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
  {
    id: 'anger.askhelp',
    title: 'Ask for the help you need',
    step: 'Ask a trusted person for one specific kind of help.',
    blocks: [
      {
        kind: 'text',
        text: 'When you feel stressed, someone may want to help but not know what to do. **Ask for one specific thing.** You might need someone to listen, help carry shopping, or explain a form. Saying what you need makes it easier for them to tell you whether they can help.',
      },
      {
        kind: 'text',
        text: 'Include enough detail for the person to understand. **Say what and when.** Could you collect this parcel before six is clearer than I need help with everything. If you want to talk, ask whether they have time to listen. Say whether you want ideas or just someone to hear what happened.',
      },
      {
        kind: 'choice',
        prompt: 'You are upset after a meeting and want someone to listen. What could you ask?',
        options: [
          {
            label: 'Do you have ten minutes to listen without giving advice?',
            feedback: 'This names the time and the kind of support you want. The person can tell you whether they are available now.',
          },
          {
            label: 'Can we talk later today about the meeting?',
            feedback: 'This lets you agree on a time. When you talk, explain whether you want listening, advice, or help with a particular next step.',
          },
        ],
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Listening',
            text: 'Listening: ask for time to explain what happened.',
          },
          {
            term: 'Practical help',
            text: 'Practical help: name the job and when it is needed.',
          },
          {
            term: 'Information',
            text: 'Information: ask the exact question you need answered.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'The person may not be able to do what you ask. **Leave room for an honest answer.** You can ask what they can offer or consider another person. A clear request is a way to discuss help. It is not a promise that someone will have the time, knowledge, or ability to provide it.',
      },
      {
        kind: 'do',
        text: 'Choose a trusted person and **ask for one specific kind of help**. Name the task, question, or listening time you need, and let them answer.',
      },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
  {
    id: 'anger.afterstress',
    title: 'Check what needs doing after stress',
    step: 'After a difficult conversation, check one practical need before moving on.',
    blocks: [
      {
        kind: 'text',
        text: 'After a difficult conversation, you may keep thinking about what was said. **Check whether something needs doing now.** Perhaps you agreed to send information or need to correct a date. That is a practical task. Thinking of another sentence you could have said does not always require another conversation right away.',
      },
      {
        kind: 'reveal',
        prompt: 'Check these questions before choosing what to do.',
        items: [
          {
            label: 'Is there an immediate safety concern?',
            detail: 'If you were threatened or feel unsafe, move to a safe place if you can. Contact someone who can help before continuing ordinary tasks.',
          },
          {
            label: 'Did we agree on a task or reply that needs doing?',
            detail: 'Write the actual agreement, such as send the document tomorrow. You do not need to write every sentence from the conversation.',
          },
          {
            label: 'What do I need before choosing my next activity?',
            detail: 'You may need water, a quiet moment, or someone to listen. Choose that first if it helps you decide what to do next.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Write down any real next step. **Separate the task from reviewing every word.** If you promised to send a file, note which file and when it is needed. If you need more time before replying, choose a suitable time. You can take the issue seriously without deciding everything immediately.',
      },
      {
        kind: 'choice',
        prompt: 'After a tense call, you keep replaying it. You also agreed to send a document tomorrow. What could you do?',
        options: [
          {
            label: 'Note the document and choose when to send it',
            feedback: 'This records the practical next step. Once it is written down, you can decide what you need now before beginning another task.',
          },
          {
            label: 'Ask someone trusted to listen before doing more work',
            feedback: 'Support may be what you need first. Explain what happened and what help you want, then return to the practical next step when you can.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Before starting something else, check your immediate needs. **Choose what will help you continue safely.** You may need a drink, a quiet moment, or support from someone you trust. If the conversation involved a threat or you feel unsafe, getting to safety and asking for help comes before ordinary tasks.',
      },
      {
        kind: 'do',
        text: 'After your next difficult conversation, **check one practical need**. Write down any agreed task, then choose a safe next activity or ask for support.',
      },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/',
  },
] as const satisfies readonly LessonDefinition[];
