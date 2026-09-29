import type { LessonDefinition } from '../lessonBlock';

/**
 * Quiet, and what it is actually for.
 *
 * `quiet` runs on these. Most of them are corrections: nearly everybody who has
 * tried this and stopped did so because of a belief about it that was not true,
 * and saying the true version is more use than another instruction.
 */
export const QUIET_LESSONS = [
  {
    id: 'quiet.gap',
    title: 'There is a gap you can widen',
    blocks: [
      {
        kind: 'text',
        text: "When something upsets you, you may answer at once. **A pause gives you a moment to choose your response.** For example, if someone speaks sharply, notice your jaw tightening and take one breath before you reply.",
      },
      { kind: 'fact', value: '1 breath', caption: 'one simple way to pause before replying' },
      {
        kind: 'text',
        text: '**Today’s few minutes** are mostly about making that gap long enough to use. The aim is not to feel calmer, it is to give yourself a moment before you answer.',
      },
      {
        kind: 'text',
        text: 'The pause gives you time for one question: “What do I want my reply to do?” **Name the purpose** before you choose words. You might want to explain, ask for time, or end the conversation safely.',
      },
      {
        kind: 'text',
        text: '**A breath is a way to pause**, not a promise that anger will disappear. After it, you can still set a boundary, ask for time, or answer directly. The practice is choosing a response that fits the moment.',
      },
      {
        kind: 'choice',
        prompt: 'A stressful thought appears. What can you practise before reacting?',
        options: [
          { label: 'Notice the thought and take one breath', feedback: 'That brief gap gives you a chance to choose your next action.' },
          { label: 'Force the thought to disappear', feedback: 'The practice is noticing and choosing; thoughts do not need to vanish.' },
        ],
      },
      {
        kind: 'do',
        text: 'Once today, when something lands badly, **take one breath before you answer**. That is the whole practice.',
      },
    ],
    source: 'Response inhibition / the stimulus-response gap, the core mechanism claim of mindfulness-based stress reduction.',
  },
  {
    id: 'quiet.notice',
    title: 'Noticing a feeling is not pushing it away',
    blocks: [
      {
        kind: 'text',
        text: "A feeling is something you can notice without obeying it. **Naming it helps you see what is happening.** For example, “I feel frustrated and want to send a sharp message” leaves you free to wait before sending anything.",
      },
      {
        kind: 'text',
        text: 'Trying to hide a feeling can take effort and may leave the problem unaddressed. **Noticing it clearly** gives you more information about what you need.',
      },
      {
        kind: 'text',
        text: 'Feelings often shift with time, though some last longer than we would like. **Naming one** can help you respond without demanding that it disappear.',
      },
      {
        kind: 'text',
        text: 'A feeling may show up in your body as well as your thoughts. Tight shoulders and the thought “I need to answer now” can arrive together. **Notice both parts** without treating either as an order.',
      },
      {
        kind: 'text',
        text: 'After naming the feeling, ask what you need. It could be more time, clear information, or a conversation later. **Choose one next step** that fits the need. The feeling does not have to vanish first.',
      },
      {
        kind: 'choice',
        prompt: 'You notice worry during a quiet moment. What is the practice?',
        options: [
          { label: 'Name the feeling without pushing it away', feedback: 'You can acknowledge worry and still decide what to do next.' },
          { label: 'Prove I should not feel worried', feedback: 'Arguing with the feeling can keep your attention stuck on it.' },
        ],
      },
      {
        kind: 'do',
        text: 'Next time something rises, **name it and leave it there**. “That’s frustration.” Then carry on with what you were doing.',
      },
    ],
    source: 'Affect labelling reduces amygdala response; expressive suppression carries a documented rebound.',
  },
  {
    id: 'quiet.wander',
    title: 'Every time your mind wanders, you practise',
    blocks: [
      {
        kind: 'text',
        text: "During a quiet practice, your attention will move to other things. **That is normal.** If you notice you are planning dinner, bring your attention back to one breath. Noticing and returning is the skill you are practising.",
      },
      { kind: 'fact', value: '1 return', caption: 'is one repetition' },
      {
        kind: 'text',
        text: 'Your mind can be busy and you can still practise. **Notice each time you bring attention back** to your breath or another thing you chose to feel.',
      },
      {
        kind: 'text',
        text: 'Suppose you focus on your breathing and then find yourself planning dinner. **The moment you notice** is the moment you can return. You have not lost the session; you have found the skill it asks you to practise.',
      },
      {
        kind: 'text',
        text: "**Choose one thing to notice**, such as your feet or one breath. When you notice you are thinking about plans, say 'planning' silently and return to what you chose. You do not need to stop your thoughts.",
      },
      {
        kind: 'choice',
        prompt: 'Your mind wanders repeatedly while you practise. What does that mean?',
        options: [
          { label: 'Each return is part of the practice', feedback: 'Noticing and returning are the skill you are building.' },
          { label: 'I have failed at quiet', feedback: 'Wandering is normal; the return is the useful moment.' },
        ],
      },
      {
        kind: 'do',
        text: 'Today, **notice one time you bring your attention back**. That is enough to practise the skill.',
      },
    ],
    source: 'Attention regulation: the noticing-and-returning cycle is the trained component, not sustained stillness.',
  },
  {
    id: 'quiet.beginner',
    title: 'Nobody is good at this at first',
    blocks: [
      {
        kind: 'text',
        text: "Quiet practice means noticing where your attention goes and bringing it back when you can. **You do not need an empty mind.** Your first try may feel busy or awkward; that gives you a chance to practise returning.",
      },
      {
        kind: 'text',
        text: 'Attention changes from moment to moment, even with experience. **A still mind is not required** to practise noticing and returning.',
      },
      {
        kind: 'text',
        text: 'With practice, you may notice sooner when **your attention has moved away** and choose where to put it next.',
      },
      {
        kind: 'text',
        text: 'A busy mind can make a first session feel chaotic. That reaction is understandable. **The task is modest**: notice one moment of attention, notice a drift if it happens, and come back when you can.',
      },
      {
        kind: 'text',
        text: '**If sitting still feels uncomfortable**, use a soft gaze or notice your feet while standing. You can make the practice easier to enter without changing its core. Afterward, judge it by whether you practised returning, not by how peaceful it felt.',
      },
      {
        kind: 'choice',
        prompt: 'Your first attempt at quiet feels awkward. What is a fair response?',
        options: [
          { label: 'Keep the next attempt small', feedback: 'Learning attention takes repetition. An awkward start is expected.' },
          { label: 'Decide I am bad at it', feedback: 'One attempt tells you very little about what you can learn.' },
        ],
      },
      {
        kind: 'do',
        text: 'Today, drop the standard entirely. **Sit through it badly** and count that as having done it.',
      },
    ],
    source: 'Unrealistic expectations of mental quiet are among the most common stated reasons for discontinuation.',
  },
  {
    id: 'quiet.two',
    title: 'Two minutes genuinely counts',
    blocks: [
      {
        kind: 'text',
        text: "A short practice still gives you a chance to train attention. **Choose one thing to notice, such as a breath.** When your mind moves elsewhere, notice that and return. You can do this in two minutes.",
      },
      { kind: 'fact', value: '2 min', caption: 'can hold several chances to return' },
      {
        kind: 'text',
        text: 'A long session is not the only useful kind. When your mind wanders, **noticing and returning** is the skill you are practising.',
      },
      {
        kind: 'choice',
        prompt: 'Your attention wandered three times in two minutes. What did you practise?',
        options: [
          { label: 'Noticing and returning three times', feedback: 'Exactly. Returning attention is the skill, and each return is a chance to practise it.' },
          { label: 'Nothing, because my mind was not quiet', feedback: 'A quiet mind is not required. Noticing the wander and returning is the useful part.' },
        ],
      },
      {
        kind: 'text',
        text: 'Two minutes can fit inside an ordinary day. **Choose one thing to notice**, such as your breathing. When your mind moves away, bring it back. The practice does not need to change your mood right away.',
      },
      {
        kind: 'text',
        text: '**If you feel restless**, say “I feel restless” and notice your feet for one breath. Continue until today’s guided breathing session ends. You are practising attention, not trying to prove how long you can sit.',
      },
      {
        kind: 'do',
        text: 'During **today’s guided breathing session**, notice one time your mind wanders and bring it back. That is practice, even if your mind stays busy.',
      },
    ],
    source: 'Frequency over duration: brief daily practice shows adherence advantages at comparable short-term effect.',
  },
  {
    id: 'quiet.eyes',
    title: 'You do not have to close your eyes',
    blocks: [
      {
        kind: 'text',
        text: "You can practise paying attention with your eyes open. **Closing them is optional.** If closed eyes feel uncomfortable, look gently at one spot on the floor or wall while noticing your breathing.",
      },
      {
        kind: 'text',
        text: 'A soft gaze at a dull patch of floor works fine, and so does looking out of a window at **nothing in particular**.',
      },
      {
        kind: 'text',
        text: 'It also means this can happen **on a train**, in a waiting room, or at a desk, which is most of where it is needed.',
      },
      {
        kind: 'text',
        text: 'Closing your eyes removes things to look at, but it can also make you uneasy or sleepy. **Choose one thing you can comfortably notice**, such as a point on the wall, your hands, or the floor.',
      },
      {
        kind: 'text',
        text: '**Try one reset** with a soft gaze and another with closed eyes if comfortable. Notice which lets you return attention with less effort. Keep your eyes open when moving or when you need to stay aware of your surroundings.',
      },
      {
        kind: 'choice',
        prompt: 'Closing your eyes feels uncomfortable. How can you still practise?',
        options: [
          { label: 'Keep them open with a soft gaze', feedback: 'You can train attention while looking gently at one place.' },
          { label: 'Stop because I am doing it wrong', feedback: 'Closed eyes are optional; comfort can help you stay with the practice.' },
        ],
      },
      {
        kind: 'do',
        text: 'Try today’s few minutes with your **eyes open and low**, and see which one your attention prefers.',
      },
    ],
    source: 'Eyes-open practice is standard in several traditions and is preferable where closed eyes raise arousal.',
  },
  {
    id: 'quiet.bodyfirst',
    title: 'Start with the body, it is easier',
    blocks: [
      {
        kind: 'text',
        text: "It can be hard to pay attention when you have nothing specific to notice. **Use a body sensation as your starting point.** Feel your feet on the floor or your hands touching. When your mind wanders, return to that feeling.",
      },
      {
        kind: 'text',
        text: 'A physical feeling gives your attention one place to go. **Feel your feet on the floor** when you notice yourself thinking about tomorrow.',
      },
      {
        kind: 'text',
        text: 'When you notice your mind thinking about something else, **feel your feet again**. Your hands or the chair may be easier to notice; use whichever works.',
      },
      {
        kind: 'text',
        text: 'You do not need to search for a special sensation. **Ordinary contact is enough**: the chair under you, your shoes around your feet, or your hands touching each other.',
      },
      {
        kind: 'text',
        text: '**For thirty seconds**, describe one sensation silently: pressure, warmth, movement, or nothing obvious. When your mind shifts to a story about it, return to the physical detail. If one body area feels uncomfortable, choose a different anchor.',
      },
      {
        kind: 'choice',
        prompt: 'Your thoughts feel busy. Where could you place attention first?',
        options: [
          { label: 'Notice my feet on the floor', feedback: 'A physical sensation gives attention a concrete place to return.' },
          { label: 'Make every thought stop', feedback: 'Thoughts can continue while you practise returning to the body.' },
        ],
      },
      {
        kind: 'do',
        text: 'Today, start with **thirty seconds on your feet**, on the actual sensation of them, before anything else.',
      },
    ],
    source: 'Interoceptive anchoring: somatic anchors are easier to sustain than open monitoring for beginners.',
  },
  {
    id: 'quiet.thoughts',
    title: 'You are the one hearing them',
    blocks: [
      {
        kind: 'text',
        text: "A thought can sound true just because it came to mind. **Pause before treating it as a fact.** If you think “I always fail,” try saying “I am having the thought that I always fail.” Then decide what the evidence actually shows.",
      },
      {
        kind: 'text',
        text: 'Saying “I am useless” treats a thought like a fact. Saying **“I am having the thought that I am useless”** reminds you that you can question it before believing it.',
      },
      {
        kind: 'text',
        text: 'You do not need to fight every thought. **Notice what the thought says**, then ask whether it helps you decide what to do next.',
      },
      {
        kind: 'text',
        text: "A thought can feel like a conclusion even when it is only a first interpretation. **Putting words around it** creates room to inspect it: 'I'm having the thought that I always fail' is different from accepting that as a full account.",
      },
      {
        kind: 'text',
        text: '**You do not have to argue** with every thought. Sometimes noticing it is enough to continue what matters. When a thought points to a real problem, you can also examine the evidence and decide on one useful action.',
      },
      {
        kind: 'choice',
        prompt: 'A thought says, “I cannot handle today.” How might you relate to it?',
        options: [
          { label: 'Notice it as a thought I am having', feedback: 'Naming a thought creates space to examine it before treating it as a fact.' },
          { label: 'Treat it as a certain prediction', feedback: 'A thought can feel convincing without predicting the whole day.' },
        ],
      },
      {
        kind: 'do',
        text: 'Next time a hard one turns up, put **“I notice I’m thinking”** in front of it, and nothing else.',
      },
    ],
    source: 'Cognitive defusion (ACT): altering the relationship to a thought rather than its content.',
  },
  {
    id: 'quiet.boredom',
    title: 'The first few minutes feel like nothing',
    blocks: [
      {
        kind: 'text',
        text: "Quiet practice can feel boring because there is less to look at or do. **Boredom is something you can notice.** If you want to check your phone, pause for one breath and notice that urge before choosing what to do.",
      },
      { kind: 'fact', value: '1 breath', caption: 'to notice an urge before acting' },
      {
        kind: 'text',
        text: 'If you expected immediate calm, boredom might feel like a sign to stop. It can instead be **something to notice** during the practice.',
      },
      {
        kind: 'text',
        text: 'Boredom can show up as an urge to check the time or find a new stimulus. **Notice the urge itself**: where do you feel it, and what do you expect the phone or task switch to provide?',
      },
      {
        kind: 'text',
        text: '**You can stay for one more breath** and see whether the urge changes. It might remain, and that is fine. This is a small experiment in noticing impulses before acting, not a test of how long you can tolerate discomfort.',
      },
      {
        kind: 'choice',
        prompt: 'The first minute of practice feels boring. What could you try?',
        options: [
          { label: 'Stay curious about one sensation', feedback: 'A simple sensation can give attention somewhere to rest.' },
          { label: 'Assume nothing is happening', feedback: 'Boredom itself is something you can notice in the practice.' },
        ],
      },
      {
        kind: 'do',
        text: 'If dullness appears today, **notice one urge to switch** before deciding what to do. No fixed amount of time is required.',
      },
    ],
    source: 'Adjustment to low-stimulation states; early restlessness is the most common reported reason for dropping out.',
  },
  {
    id: 'quiet.moving',
    title: 'Attention practice counts while you walk',
    blocks: [
      {
        kind: 'text',
        text: "You can practise attention while walking. **Notice something happening now**, such as each step or the air on your face. If your mind moves to tomorrow’s plans, bring it back to a step while staying aware of your surroundings.",
      },
      {
        kind: 'text',
        text: 'While walking, you can feel your feet, your breathing, or the air on your face. **Pick one of those feelings to notice** for a few steps.',
      },
      {
        kind: 'text',
        text: 'If you already take a short walk, you can use part of that walk to practise. **Bring your attention to a few steps** instead of adding a separate activity.',
      },
      {
        kind: 'text',
        text: 'While walking, choose something you can safely notice: the shift of weight between feet, the air on your face, or the sounds around you. **Attention can move with you**; it does not have to stay on one point.',
      },
      {
        kind: 'text',
        text: "**When you notice yourself planning or worrying**, feel your next step on the ground. Stay aware of traffic and people around you. Walking practice can sit alongside today's guided breathing session.",
      },
      {
        kind: 'choice',
        prompt: 'Sitting still does not suit you today. How could you practise attention?',
        options: [
          { label: 'Notice each step during a walk', feedback: 'Movement can provide a steady anchor for attention.' },
          { label: 'Skip because quiet requires sitting', feedback: 'Attention practice can happen while walking.' },
        ],
      },
      {
        kind: 'do',
        text: 'Take a walk you were taking anyway and **leave the phone behind**, with your attention on your feet.',
      },
    ],
    source: 'Walking meditation is a standard formal practice, not a substitute for one.',
  },
  {
    id: 'quiet.rested',
    title: 'Unstimulated is not the same as rested',
    blocks: [
      {
        kind: 'text',
        text: "A break should meet a need you have. Scrolling may entertain you, but it might not help when you need quiet or sleep. **Ask what kind of break you need**, then notice how you feel after trying it.",
      },
      {
        kind: 'text',
        text: 'Rest can look different from day to day. Sometimes you want quiet; sometimes you want company or entertainment. **Choice matters** more than following one rule.',
      },
      {
        kind: 'text',
        text: 'The test is simple: **did you feel better afterwards**, or only less demanded of?',
      },
      {
        kind: 'text',
        text: 'A screen can be enjoyable and still leave you wanting a different kind of break. **Ask what you need**: entertainment, connection, quiet, movement, or sleep. Different needs call for different choices.',
      },
      {
        kind: 'text',
        text: '**Try comparing two short breaks** on separate days. After each, notice your energy and attention without judging the activity. If a screen helps, that is useful information; if it leaves you restless, try a low-demand option next time.',
      },
      {
        kind: 'choice',
        prompt: 'You scroll for a break and still feel drained. What else could you test?',
        options: [
          { label: 'Try a few minutes without new input', feedback: 'A pause from stimulation may feel different from another stream of content.' },
          { label: 'Keep scrolling until I feel rested', feedback: 'More input may keep your attention occupied even while you sit still.' },
        ],
      },
      {
        kind: 'do',
        text: 'Ten minutes with **no screen** tonight. Not a rule for life, just something to notice.',
      },
    ],
    source: 'Attention restoration: passive media use does not produce the recovery that low-demand or natural settings do.',
  },
  {
    id: 'quiet.kind',
    title: 'Talk to yourself like a friend',
    blocks: [
      {
        kind: 'text',
        text: "After a mistake, you might call yourself a harsh name. **Describe what happened instead of judging your whole self.** For example, “I missed the deadline; I need to tell them and set a new time” gives you a next step.",
      },
      {
        kind: 'text',
        text: 'Harsh self-talk may feel motivating, yet it can also make the next step harder to face. **A fairer account** can keep responsibility without adding shame.',
      },
      {
        kind: 'text',
        text: 'The alternative is not flattery, it is **accuracy**: what you would actually tell a friend in the same position.',
      },
      {
        kind: 'text',
        text: "Self-kindness does not mean pretending a mistake was fine. **Accuracy includes context**: what happened, what was within your control, and what you can repair. Harsh labels such as 'I'm hopeless' skip those details.",
      },
      {
        kind: 'text',
        text: "**Imagine a friend missed a deadline**. You might say, 'That matters; let's tell the person and plan the next step.' Try that same tone with yourself. It allows responsibility without turning one event into a verdict about your worth.",
      },
      {
        kind: 'choice',
        prompt: 'You lose focus and think, “I am terrible at this.” What could you say instead?',
        options: [
          { label: 'My attention wandered; I can return', feedback: 'A kind, accurate response makes it easier to practise again.' },
          { label: 'I need to be harder on myself', feedback: 'Self-criticism adds another distraction to the moment.' },
        ],
      },
      {
        kind: 'do',
        text: 'Next time you catch it, ask what you would say **to someone you liked**, and say that instead.',
      },
    ],
    source: 'Self-compassion research: self-criticism predicts avoidance; self-compassion predicts re-engagement after failure.',
  },
] as const satisfies readonly LessonDefinition[];
