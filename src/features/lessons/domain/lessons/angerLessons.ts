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
    title: 'A pause can help when anger rises',
    blocks: [
      {
        kind: 'text',
        text: 'Anger is a feeling everyone has. You may feel it before you can think through what to say. **A short pause** can give you time to choose your next action.',
      },
      { kind: 'fact', value: '1 pause', caption: 'before choosing a reply' },
      {
        kind: 'text',
        text: 'You may not choose the first surge, but you can practise **what happens next**. A pause creates room to check what you want your reply to achieve.',
      },
      {
        kind: 'choice',
        prompt: 'A message lands badly while you are upset. What protects your next reply?',
        options: [
          { label: 'Pause, then read it again before answering', feedback: 'A pause gives your body time to settle and lets you check whether your first interpretation still fits.' },
          { label: 'Reply now so the feeling is out', feedback: 'That may feel relieving briefly. If it is safe to wait, you can choose your words after the first surge.' },
        ],
      },
      { kind: 'text', text: 'Imagine a sharp message arriving while your shoulders are tense. The first interpretation may be, “They are attacking me.” A pause lets you ask **what the message actually says**.' },
      { kind: 'text', text: 'You can still set a boundary after pausing. The skill is choosing a response that serves your purpose: clarity, safety, or repair. **Anger can inform you** without writing the reply for you.' },
      { kind: 'text', text: 'After the pause, ask whether you need to answer at all right now. Some messages require action; others can wait. **Choose the timing as well as the words**.' },
      {
        kind: 'do',
        text: 'When anger spikes, **give your reply a pause** if you can. Return when you can say what happened and what you need.',
      },
    ],
    source: 'Aggression cycle and time-out skills: SAMHSA anger management manual, sessions 3–4. Recovery time varies; no fixed twenty-minute clearance is promised.',
  },
  {
    id: 'anger.meter',
    title: 'Notice how strong your anger feels',
    blocks: [
      {
        kind: 'text',
        text: 'You can give your anger a number from one to ten. One means barely angry; ten means as angry as you can imagine. **Checking the number early** can help you pause before it gets harder to think clearly.',
      },
      { kind: 'fact', value: '1–10', caption: 'a personal scale for noticing anger' },
      {
        kind: 'text',
        text: 'The number is not a diagnosis or a target. **Naming the level** lets you compare today with your own usual signs and choose a skill sooner.',
      },
      { kind: 'text', text: 'The numbers work best when you connect them to your own signs. At three, maybe your jaw feels tight. At seven, maybe you want to shout. **Notice what each level feels like for you**.' },
      { kind: 'text', text: 'If you notice the level rising, choose a skill that fits: slow your breathing, step away safely, or delay a reply. **The number points to action**; it does not judge the feeling.' },
      { kind: 'text', text: 'There is no universal number where choice disappears. People differ, and practice can expand your options. **Use the scale as a signal**, not a prediction.' },
      {
        kind: 'choice',
        prompt: 'You notice anger at a three out of ten. What can you do now?',
        options: [
          { label: 'Name the level and pause', feedback: 'Spotting anger early gives you more room to choose what happens next.' },
          { label: 'Wait until I explode', feedback: 'It is usually harder to choose a response once anger has climbed.' },
        ],
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
    title: 'Anger can show up in four ways',
    blocks: [
      {
        kind: 'text',
        text: 'Anger can feel like it appears all at once. Often, there are earlier signs in your body, thoughts, feelings, or actions. A sign is a **clue that anger is growing**. Your first clue may be different each time.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Body', text: 'Your jaw, your shoulders, heat in your face.' },
          { term: 'Thought', text: 'A sentence you have thought before, word for word.' },
          { term: 'Feeling', text: 'You may feel hurt, embarrassed, afraid, or something else.' },
          { term: 'Action', text: 'You shut a door harder than it needed.' },
        ],
      },
      {
        kind: 'text',
        text: 'You might notice more than one signal. Looking back at a recent moment can help you see **where there was room to pause**.',
      },
      { kind: 'text', text: 'Think of the last argument before the words were spoken. Perhaps your jaw tightened, or the thought “Here we go again” appeared. That is **an early cue you can recognise** next time.' },
      { kind: 'text', text: 'A cue is information, not a command. You can notice heat in your face and still choose to ask a question or take a break. **Recognition creates options**.' },
      { kind: 'text', text: 'You may miss the cue in the moment. Looking back afterward still teaches you what to notice next time. **Practice begins with hindsight**.' },
      {
        kind: 'choice',
        prompt: 'Your jaw tightens during a conversation. How could you use that cue?',
        options: [
          { label: 'Treat it as a signal to slow down', feedback: 'A physical cue can alert you before words become sharp.' },
          { label: 'Ignore it until I say something harsh', feedback: 'The cue gives you a chance to intervene while the moment is still small.' },
        ],
      },
      {
        kind: 'do',
        text: 'Think of a recent time you got angry. **Which sign did you notice first:** a body change, thought, feeling, or action?',
      },
    ],
    source: 'Four cue types (physical, behavioural, emotional, cognitive), SAMHSA anger management manual, session 2.',
  },
  {
    id: 'anger.boring',
    title: 'Check what else is making anger harder',
    blocks: [
      {
        kind: 'text',
        text: 'A problem may feel harder when you are hungry, tired, uncomfortable, or rushed. The problem is still real. **Checking these other pressures** can help you choose what to do next.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Hungry', text: 'Food may help if you have missed a meal.' },
          { term: 'Short of sleep', text: 'Everything lands harder when you have not slept.' },
          { term: 'Uncomfortable', text: 'Notice heat, noise, or another source of strain.' },
          { term: 'Running late', text: 'The whole day gets borrowed against.' },
        ],
      },
      {
        kind: 'text',
        text: 'A real disagreement stays real even when you are tired or hungry. The context may affect **how strongly you react** and which response helps.',
      },
      { kind: 'text', text: 'For example, a delayed bus can be genuinely frustrating. If you also skipped lunch, the delay may feel unbearable. Naming both factors keeps **the picture accurate**.' },
      { kind: 'text', text: 'Meeting a basic need will not settle every conflict. It may make it easier to decide whether you need a request, a boundary, or simply **a quieter moment**.' },
      { kind: 'text', text: 'Try not to use a basic need to dismiss a real grievance. You can eat lunch and still return to a conversation about what needs to change. **Both matter**.' },
      {
        kind: 'choice',
        prompt: 'You snap at someone after a long, hungry day. What should you check?',
        options: [
          { label: 'Whether sleep or hunger added pressure', feedback: 'Basic needs can make a frustrating event harder to handle.' },
          { label: 'Decide they caused all my anger', feedback: 'The other person may matter too. Check the full context before deciding.' },
        ],
      },
      {
        kind: 'do',
        text: 'Next time anger climbs, **check your state** and the issue. Meet a basic need if you can, then decide what to say.',
      },
    ],
    source: 'State factors in reactivity: hunger, sleep debt, thermal discomfort and time pressure all lower the threshold.',
  },
  {
    id: 'anger.belief',
    title: 'Check the story you tell yourself',
    blocks: [
      {
        kind: 'text',
        text: 'Something happens, and your mind quickly gives it a meaning. For example, a friend arrives late and you think, “They do not care about me.” **The lateness happened; their reason is still unknown.**',
      },
      {
        kind: 'text',
        text: 'The event may be genuinely upsetting. You can still examine **what you concluded from it**, especially when someone else’s intention is unclear.',
      },
      {
        kind: 'text',
        text: 'A guessed intention can raise the heat. Asking what else might fit the facts is **a way to check accuracy**, not a demand to excuse the event.',
      },
      { kind: 'text', text: 'A useful way to check this is to name four things: what happened, what you thought it meant, how you felt, and what you did. “They arrived late” is what happened. “They do not respect me” is **one possible meaning**.' },
      { kind: 'text', text: 'An alternative thought should be plausible, not falsely positive. “I do not know why yet” leaves room to ask while still saying **the lateness affected me**.' },
      { kind: 'text', text: 'If you learn that your first guess was right, you can still choose how to respond. The goal is **an accurate understanding**, not pretending everything is fine.' },
      {
        kind: 'choice',
        prompt: 'Someone replies late and you think, “They do not respect me.” What is another move?',
        options: [
          { label: 'Ask what else might explain the delay', feedback: 'Checking an interpretation can lower the heat without dismissing your feelings.' },
          { label: 'Treat the first interpretation as certain', feedback: 'The delay is real; its meaning is still uncertain.' },
        ],
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
    title: 'Say clearly what help you need',
    blocks: [
      {
        kind: 'text',
        text: 'You may hope someone will help without asking them. When they do not, you may think, “They should have known.” **Saying what you need aloud** gives them a clearer chance to help.',
      },
      {
        kind: 'text',
        text: 'The feeling is real, and the other person may have had no way to know what you wanted. Both can be true. **Clarity gives them a chance** to respond.',
      },
      {
        kind: 'text',
        text: 'A useful question is, **“Did I ask clearly?”** Sometimes the answer is yes, and you may need a boundary rather than another explanation.',
      },
      { kind: 'text', text: 'Suppose you wanted help with a task and felt hurt when nobody offered. “They should notice” may be understandable, but **a specific request** gives the other person clearer information.' },
      { kind: 'text', text: 'A useful request names the action and timing: “Can you handle the dishes tonight?” If you already asked and the pattern continues, the next step may be **a conversation about responsibility**.' },
      { kind: 'text', text: 'A request can be declined, and that may be disappointing. It still makes the need visible, giving you **better information for your next decision**.' },
      {
        kind: 'choice',
        prompt: 'You expected help, but never asked for it. What could reduce friction?',
        options: [
          { label: 'Say what help I wanted clearly', feedback: 'An explicit request gives the other person something concrete to respond to.' },
          { label: 'Assume they should have known', feedback: 'An unspoken expectation is easy for another person to miss.' },
        ],
      },
      {
        kind: 'do',
        text: 'Think of a recent time you wanted help. **Write down what you wanted**, then ask yourself whether you clearly told the other person.',
      },
    ],
    source: 'Expectancy violation as an antecedent in cognitive models of anger; unstated standards are the common case.',
  },
  {
    id: 'anger.bucket',
    title: 'Several stresses can add up',
    blocks: [
      {
        kind: 'text',
        text: 'A small event can bring out a big reaction when you have already had a hard day. You may have been tired, late, or worried before it happened. **Look at the whole day** to understand the reaction.',
      },
      { kind: 'fact', value: '3 pressures', caption: 'can add context to one reaction' },
      {
        kind: 'text',
        text: 'The trigger may still deserve attention. Looking at **what else was going on** can help you choose a response that fits the whole situation.',
      },
      { kind: 'text', text: 'Imagine three small pressures: poor sleep, a late train, and a hard meeting. A minor comment may become the final trigger. **The comment is part of the story**, not all of it.' },
      { kind: 'text', text: 'List what was already weighing on you, then separate what can be addressed today from what needs a longer plan. This helps you respond to **the right problem**.' },
      { kind: 'text', text: 'This is especially useful when your reaction surprised you. If it felt larger than the trigger, ask what was already taking up attention. **Context can guide repair**.' },
      {
        kind: 'choice',
        prompt: 'A tiny inconvenience sparks big anger after a hard day. What might be happening?',
        options: [
          { label: 'Several earlier stresses have added up', feedback: 'The last event may be the trigger, while earlier strain raised the pressure.' },
          { label: 'The tiny event explains everything', feedback: 'The event matters, but the day around it may explain the intensity.' },
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
    title: 'Focus on the action you can choose',
    blocks: [
      {
        kind: 'text',
        text: 'In an argument, you can choose your words and whether to take a break. You cannot choose what the other person says or feels. **Knowing the difference** helps you decide your next step.',
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
        text: 'Sorting does not guarantee calm. It can stop you spending energy trying to control someone else’s reaction and point you toward **your own next action**.',
      },
      { kind: 'text', text: 'For example, you can ask someone to speak more quietly. You cannot guarantee they will agree. The request is **your action**; their response is information for your next choice.' },
      { kind: 'text', text: 'The distinction can also reveal boundaries. If a request is repeatedly ignored, decide what you will do to protect your time or space. **Control means choosing your behaviour**.' },
      { kind: 'text', text: 'You do not control whether another person changes, but you can choose whether to continue a discussion or step away. **Boundaries are actions you take**.' },
      {
        kind: 'choice',
        prompt: 'You cannot change another person’s tone. What can you control?',
        options: [
          { label: 'My next sentence and whether I pause', feedback: 'Your response is a concrete place to act, even if their behavior stays the same.' },
          { label: 'Make them speak differently immediately', feedback: 'You can ask for a change, but you cannot directly control their choice.' },
        ],
      },
      {
        kind: 'do',
        text: 'Think of one current problem. **Write one action you can choose** and one outcome you cannot choose alone.',
      },
    ],
    source: 'Control appraisal: perceived controllability moderates anger intensity and predicts problem-focused coping.',
  },
  {
    id: 'anger.timeout',
    title: 'Take a break and say when you will return',
    blocks: [
      {
        kind: 'text',
        text: 'If an argument gets so heated that you may say something hurtful, you can take a short break. Tell the other person when you plan to talk again. **The return is part of the break.**',
      },
      { kind: 'fact', value: '1 return time', caption: 'makes a timeout easier to trust' },
      {
        kind: 'text',
        text: 'Say why you are pausing and when you expect to return. **“I need a break; let’s talk after dinner”** is clearer than disappearing.',
      },
      { kind: 'text', text: 'A timeout is most useful before you say something you will regret. Notice a cue, state a return time, and use the break to settle rather than **rehearse your case**.' },
      { kind: 'text', text: 'When you return, begin with the issue you want to solve. If the conversation heats up again, another pause may help. **Returning matters** because the original concern still needs attention.' },
      { kind: 'text', text: 'Choose a return time you can actually keep. If you need longer, say so. **A clear update** is better than leaving the other person guessing.' },
      {
        kind: 'choice',
        prompt: 'You are too heated to talk clearly. What is a useful time-out?',
        options: [
          { label: 'Say I need a break and when I will return', feedback: 'A clear return time makes space to calm down without abandoning the issue.' },
          { label: 'Walk away without a word', feedback: 'A sudden exit can leave the other person unsure whether the conversation will resume.' },
        ],
      },
      {
        kind: 'do',
        text: 'Practise one sentence now: **“I need a break. Can we talk again after dinner?”** Choose a return time you can keep.',
      },
    ],
    source: 'Time-out procedure, SAMHSA anger management manual, session 3: the announcement and the return are both part of it.',
  },
  {
    id: 'anger.assert',
    title: 'Ask clearly without attacking',
    blocks: [
      {
        kind: 'text',
        text: 'If something bothers you, you might stay quiet or speak harshly. There is another option: say what happened and what you need in clear, respectful words. **That is an assertive request.**',
      },
      {
        kind: 'list',
        items: [
          { term: 'Passive', text: 'You say nothing, even though you need something to change.' },
          { term: 'Aggressive', text: 'You attack or blame the other person.' },
          { term: 'Assertive', text: 'Describe the issue and make a clear, respectful request.' },
        ],
      },
      {
        kind: 'text',
        text: 'A direct request may feel unfamiliar, especially if you usually stay quiet. The aim is **clarity without blame**, not a perfect script.',
      },
      { kind: 'text', text: 'Imagine a shared task was left undone. “You never help” is broad; “Can you take this task on Thursdays?” gives **a specific action to discuss**.' },
      { kind: 'text', text: 'Assertiveness leaves room for the other person to answer. You can be firm about a need while listening to whether the proposed solution works. **Clear is not the same as harsh**.' },
      { kind: 'text', text: 'One possible script is, “When this happens, I have trouble finishing. Could we try this instead?” **A concrete alternative** helps the discussion move forward.' },
      {
        kind: 'choice',
        prompt: 'You need to tell someone their comment hurt. Which opening is clearer?',
        options: [
          { label: 'When you said that, I felt hurt', feedback: 'A specific observation and feeling give the conversation a clear starting point.' },
          { label: 'You always ruin everything', feedback: 'A broad accusation can make it harder to discuss the specific moment.' },
        ],
      },
      {
        kind: 'do',
        text: 'Try one clear request today. **Name the behaviour and what would help**, then leave space for a response.',
      },
    ],
    source: 'Assertiveness training and the conflict resolution model, SAMHSA anger management manual, sessions 7–8.',
  },
  {
    id: 'anger.send',
    title: 'Reread an angry message before sending it',
    blocks: [
      {
        kind: 'text',
        text: 'Typing an angry message can help you put a feeling into words. Sending it right away may cause a problem if the words are harsher than you mean. **Save it, pause, then reread it** when you can.',
      },
      { kind: 'fact', value: '1 reread', caption: 'a chance to check your purpose' },
      {
        kind: 'text',
        text: 'On rereading, ask whether the message describes what happened and what you need. **Being accurate and clear** may help more than proving how angry you feel.',
      },
      { kind: 'text', text: 'Before sending, ask three questions: What happened? What do I need? What response am I hoping for? If your draft cannot answer them, **keep it as a draft**.' },
      { kind: 'text', text: 'A message can be direct without becoming a verdict about the person. Describe a specific event and request a next step. **Specific words travel better** than a general accusation.' },
      { kind: 'text', text: 'If the issue is urgent or safety-related, a delay may not fit. You can still pause briefly to make the message **clear, factual, and actionable**.' },
      {
        kind: 'choice',
        prompt: 'You have typed an angry message. What is your next step?',
        options: [
          { label: 'Save it and reread it after a pause', feedback: 'A pause lets you decide what you actually want the message to achieve.' },
          { label: 'Send immediately to get it over with', feedback: 'The urge to send can be strongest before you have chosen your goal.' },
        ],
      },
      {
        kind: 'do',
        text: 'If it is safe to wait, **leave the message in drafts** until you can reread it and choose the words you want the other person to receive.',
      },
    ],
    source: 'Delay as a regulation strategy: the impulse to communicate anger decays faster than the appraisal behind it.',
  },
  {
    id: 'anger.rumination',
    title: 'Notice when a thought is only repeating',
    blocks: [
      {
        kind: 'text',
        text: 'After an argument, you may replay the same moment again and again. If each replay brings no new idea or next step, **the thinking may be keeping the anger active**.',
      },
      { kind: 'fact', value: '1 action', caption: 'a clue that thinking has become planning' },
      {
        kind: 'text',
        text: 'There is a real difference between working out what to do and **going over what happened**. One has a next action, and the other never does.',
      },
      { kind: 'text', text: 'Problem-solving produces a decision, a question to ask, or a step to take. Rumination often repeats the same scene without new information. **Notice which one you are doing**.' },
      { kind: 'text', text: 'You might write one sentence about what you can do next. If there is nothing to do tonight, choose an activity that draws your attention elsewhere. **You can return later** with a clearer mind.' },
      { kind: 'text', text: 'If the thought returns repeatedly, it does not mean you failed. Each time you notice, you have another chance to ask whether **a new step is available**.' },
      {
        kind: 'choice',
        prompt: 'You have replayed an argument several times. What could move you forward?',
        options: [
          { label: 'Name one action I can take', feedback: 'An action or a deliberate stop can help you leave the replay loop.' },
          { label: 'Replay it until it feels settled', feedback: 'Repeated replay can keep anger active without adding new information.' },
        ],
      },
      {
        kind: 'do',
        text: 'When you catch the rerun, ask **what the next useful action is**. If none is available now, shift your attention and revisit it later if needed.',
      },
    ],
    source: 'Rumination maintains and amplifies anger; distinguishing it from problem-solving is the standard intervention.',
  },
  {
    id: 'anger.driving',
    title: 'In traffic, focus on driving safely',
    blocks: [
      {
        kind: 'text',
        text: 'If another driver cuts in front of you, you can see what they did. You usually cannot know why they did it. Your mind may guess, “They did that to upset me.” **That is a guess, not a fact.**',
      },
      { kind: 'fact', value: '1 moment', caption: 'enough to practise a different interpretation' },
      {
        kind: 'text',
        text: 'Your job is still to drive safely. A less certain interpretation can reduce the urge to retaliate while you keep **your attention on the road**.',
      },
      { kind: 'text', text: 'Imagine being cut off. “They are selfish” is one interpretation; “I do not know what they saw” is another. Neither changes your need to **leave space and drive safely**.' },
      { kind: 'text', text: 'This is a chance to practise uncertainty, not to excuse dangerous driving. Let the other car go, notice your body settle, and keep your decisions focused on **the road ahead**.' },
      { kind: 'text', text: 'Do not practise this while it distracts you from driving. The simplest version is a quiet reminder: **“I do not know their reason.”** Then focus ahead.' },
      {
        kind: 'choice',
        prompt: 'A driver cuts in front of you. What response protects your next minute?',
        options: [
          { label: 'Create space and return attention to the road', feedback: 'You can choose a safer driving response even while feeling angry.' },
          { label: 'Follow them to show they were wrong', feedback: 'Chasing the driver adds risk without changing what happened.' },
        ],
      },
      {
        kind: 'do',
        text: 'If another driver upsets you, **leave safe space** and remind yourself that you do not know why they acted that way. Keep watching the road.',
      },
    ],
    source: 'Hostile attribution bias is unusually easy to observe in traffic, where intent is unknowable and assumed anyway.',
  },
  {
    id: 'anger.repair',
    title: 'Apologize clearly after you hurt someone',
    blocks: [
      {
        kind: 'text',
        text: 'Sometimes you say something hurtful when angry. Afterward, you can name what you did, apologize, and ask what would help. **This is one way to rebuild trust.** Wait until you can both talk.',
      },
      { kind: 'fact', value: '1 repair', caption: 'names the behaviour and its effect' },
      {
        kind: 'text',
        text: 'Start by naming what you did and its effect. Context may matter later, but **an apology works best when it takes responsibility** before explaining.',
      },
      { kind: 'text', text: 'A repair can begin, “I raised my voice earlier. I am sorry. That was unfair to you.” It names **the behaviour without shifting blame**.' },
      { kind: 'text', text: 'Then listen. The other person may need time, or they may want a change next time. A useful repair includes what you will try differently and **room for their response**.' },
      { kind: 'text', text: 'An apology does not guarantee immediate forgiveness. Repair may take time and repeated changed behaviour. **Your part is to take responsibility and follow through**.' },
      {
        kind: 'choice',
        prompt: 'You spoke sharply to someone. What is a useful repair?',
        options: [
          { label: 'Name what I did and apologize', feedback: 'Specific ownership gives the other person a clearer repair than a vague apology.' },
          { label: 'Explain why I was justified first', feedback: 'The context may matter later. Start by owning the part you want to repair.' },
        ],
      },
      {
        kind: 'do',
        text: 'If you snapped at someone, **name the behaviour** and ask what would help repair it when both of you are ready.',
      },
    ],
    source: 'Repair attempts after conflict predict relationship outcomes more strongly than conflict frequency does.',
  },
] as const satisfies readonly LessonDefinition[];
