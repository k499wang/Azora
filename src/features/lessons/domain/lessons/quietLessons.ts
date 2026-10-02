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
    title: 'One breath can stop a reply you regret',
    step: 'Take one breath before you answer when something upsets you.',
    blocks: [
      {
        kind: 'text',
        text: 'Ever said something in anger and wished you could take it back? **One slow breath can save you.** It makes a tiny gap between what happens and what you do. In that gap, you get to choose.',
      },
      { kind: 'fact', value: '1 breath', caption: 'is all the pause you need to choose your reply' },
      {
        kind: 'text',
        text: 'Here is the simple idea. Something upsets you, and you want to react right away. **A pause is a short stop before you act.** That short stop gives you a moment to think before the words come out.',
      },
      {
        kind: 'text',
        text: 'Say a friend sends a text that sounds rude. Your jaw tightens, and your thumbs want to fire back. **Notice that urge and take one slow breath.** Now ask yourself, “What do I want my reply to do?” Maybe you want to ask what they meant. Maybe you want to wait until you are calm.',
      },
      {
        kind: 'text',
        text: 'The pause does not mean you let things slide. **You can still speak up**, set a limit or say no. The difference is that you pick your words on purpose, instead of letting anger pick them for you. Each time you pause, **the gap gets easier to find**.',
      },
      {
        kind: 'choice',
        prompt: 'Someone says something that stings. What can you do before reacting?',
        options: [
          { label: 'Notice it and take one breath', feedback: 'Exactly. That one breath gives you a moment to choose your next move, instead of reacting on autopilot.' },
          { label: 'Force the feeling to disappear', feedback: 'You do not have to make the feeling go away. Just notice it, breathe once, and then choose what to do.' },
        ],
      },
      { kind: 'reveal', prompt: 'Tap each step of a pause before you reply.', items: [
        { label: 'Notice', detail: 'Name what you feel, like “I am angry.” A feeling is information, not an order.' },
        { label: 'Choose', detail: 'After one breath, decide what you want your reply to do. Then answer.' },
      ] },
      {
        kind: 'do',
        text: 'Once today, when something upsets you, **take one slow breath before you answer**. That is the whole practice.',
      },
    ],
    source: 'Response inhibition / the stimulus-response gap, the core mechanism claim of mindfulness-based stress reduction.',
  },
  {
    id: 'quiet.notice',
    title: 'Naming a feeling helps it settle down',
    step: 'Name the next strong feeling that comes up, then carry on.',
    blocks: [
      {
        kind: 'text',
        text: 'Here is a trick that takes two seconds: **when a strong feeling shows up, give it a name.** Just saying “I feel angry” helps that feeling settle, so you can think clearly again.',
      },
      {
        kind: 'text',
        text: 'Why does this work? A feeling with no name feels huge and confusing. **Putting it into words makes it smaller and clearer.** Pushing a feeling away does the opposite. It takes effort, and the feeling often comes back stronger.',
      },
      {
        kind: 'text',
        text: 'Say you are in a meeting and someone keeps cutting you off. Your face gets hot. Instead of thinking “I should not be upset,” **say to yourself, “I feel frustrated.”** Now you know what is going on, and you can calmly ask to finish your point.',
      },
      {
        kind: 'text',
        text: 'Feelings show up in your body too. Tight shoulders, a hot face or a racing heart are all clues. **Notice the body feeling and the thought together**, like this: “My chest is tight, and I want to reply right now.”',
      },
      {
        kind: 'text',
        text: 'If a feeling gets big, try 5-4-3-2-1. It is a Reset: a short guided practice in this app, a few minutes long, that helps you calm down. **Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell and 1 you taste.** Then **choose your next step**.',
      },
      {
        kind: 'choice',
        prompt: 'You feel worried during a quiet moment. What is the practice?',
        options: [
          { label: 'Name the feeling without pushing it away', feedback: 'Yes. Saying “I feel worried” helps the feeling settle, and you can still decide what to do next.' },
          { label: 'Prove I should not feel worried', feedback: 'Arguing with a feeling keeps your attention stuck on it. Name it instead, and let it be there while you choose your next step.' },
        ],
      },
      { kind: 'reveal', prompt: 'Tap each step for handling a strong feeling.', items: [
        { label: 'Name the feeling', detail: 'Say it plainly, like “I feel worried.” Naming it helps it settle.' },
        { label: 'Choose a response', detail: 'Decide what to do next. The feeling can stay while you act.' },
      ] },
      {
        kind: 'do',
        text: 'Next time a strong feeling shows up, **name it in a few words**: “That’s frustration.” Then carry on with your day.',
      },
    ],
    source: 'Affect labelling reduces amygdala response; expressive suppression carries a documented rebound.',
  },
  {
    id: 'quiet.wander',
    title: 'Each wandering thought is a chance to practise',
    step: 'Notice one moment today when you bring your attention back.',
    blocks: [
      {
        kind: 'text',
        text: 'Think your mind wanders too much for this? **Good news: wandering is how you get better.** Each time you notice your mind has drifted and bring it back, you build your focus, like lifting a weight at the gym.',
      },
      { kind: 'fact', value: '1 return', caption: 'counts as one rep for your focus, like one lift at the gym' },
      {
        kind: 'text',
        text: 'Here is the idea. **Attention is where your mind is pointed.** In a quiet practice, you point it at one thing, like your breath. Sooner or later, it drifts off. That happens to every single person.',
      },
      {
        kind: 'text',
        text: 'Say you are noticing your breath, and suddenly you are planning dinner. **The moment you notice is the win.** You have not failed. You just did one rep. Bring your attention gently back to the next breath.',
      },
      {
        kind: 'text',
        text: 'Here is how to do it. Pick one thing to notice, like your breath or your feet. When a thought pulls you away, **silently say “planning” or “thinking.”** Then come back. Do not worry about how long you drifted. **Just come back, again and again.**',
      },
      {
        kind: 'choice',
        prompt: 'Your mind keeps wandering while you practise. What does that mean?',
        options: [
          { label: 'Each return is part of the practice', feedback: 'Exactly. Every time you notice and come back, you build the skill. A busy mind just means more practice.' },
          { label: 'I have failed at this', feedback: 'Not at all. Wandering happens to everyone. Noticing it and coming back is the whole skill, so you are doing it right.' },
        ],
      },
      {
        kind: 'do',
        text: 'Today, **notice one moment when you bring your attention back**. That counts as practice.',
      },
    ],
    source: 'Attention regulation: the noticing-and-returning cycle is the trained component, not sustained stillness.',
  },
  {
    id: 'quiet.beginner',
    title: 'Nobody is good at this at first',
    step: 'Notice your breath or feet, and come back when your mind drifts.',
    blocks: [
      {
        kind: 'text',
        text: 'Worried you are bad at sitting quietly? **Everyone starts out with a busy mind.** You do not need an empty head. You just need to notice where your attention goes and bring it back.',
      },
      {
        kind: 'text',
        text: 'That is all a quiet practice is. **Attention means where your mind is pointed.** Even people who have practised for years have thoughts popping up. The skill is not stopping thoughts. It is coming back.',
      },
      {
        kind: 'text',
        text: 'Your first try might go like this: you fidget, plan your day, feel bored, then worry you are doing it wrong. **That is normal, and you are doing it right.** Each thought you notice is a chance to practise coming back.',
      },
      {
        kind: 'text',
        text: 'Here is how. **Pick one simple thing to notice**, like your feet on the floor. When you find your mind somewhere else, gently return to your feet. Again and again. With practice, you catch the drift sooner.',
      },
      {
        kind: 'text',
        text: 'If sitting still feels hard, **keep your eyes open** and look softly at the floor. Or stand up and feel your feet. Afterward, judge it by one thing only: **did you come back at least once?**',
      },
      {
        kind: 'choice',
        prompt: 'Your first try at sitting quietly feels awkward. What is the best next step?',
        options: [
          { label: 'Keep the next try small', feedback: 'Yes. Awkward is how everyone starts. A small, easy next try builds the skill without the pressure.' },
          { label: 'Decide I am bad at it', feedback: 'One try tells you almost nothing. Everyone feels awkward at first. The skill grows each time you come back.' },
        ],
      },
      {
        kind: 'do',
        text: 'During your next quiet practice, **pick one breath or your feet** to notice. When your mind drifts, come back. Busy or awkward still counts.',
      },
    ],
    source: 'Unrealistic expectations of mental quiet are among the most common stated reasons for discontinuation.',
  },
  {
    id: 'quiet.two',
    title: 'Two minutes really does count',
    step: 'In today’s Reset, bring a wandering mind back once.',
    blocks: [
      {
        kind: 'text',
        text: 'No time for a long session? **Two minutes is enough to train your focus.** In just two minutes, your mind will wander and come back several times. Each one of those returns makes you better at it.',
      },
      { kind: 'fact', value: '2 min', caption: 'gives you several chances to practise coming back' },
      {
        kind: 'text',
        text: 'Here is the idea. **Short and often beats long and rare**, because you will actually do it. Two minutes fits into any day: before work, after lunch or in bed.',
      },
      {
        kind: 'text',
        text: 'Picture your two minutes. You notice your breath. Then you remember an email. Then you hear a car outside. Each time, **you notice and come back to your breath**. Three drifts means three returns. That is three reps for your focus.',
      },
      {
        kind: 'text',
        text: 'Today’s Reset is the perfect place to try it. A Reset is a short guided practice in this app, a few minutes long, that helps you calm down or wake up. **If you feel restless, notice your feet for one breath**, then keep going.',
      },
      {
        kind: 'choice',
        prompt: 'Your attention wandered three times in two minutes. What did you practise?',
        options: [
          { label: 'Coming back three times', feedback: 'Exactly. Each return is one rep. Three drifts means you practised the skill three times.' },
          { label: 'Nothing, my mind was not quiet', feedback: 'A quiet mind is not the goal. Noticing the drift and coming back is the skill, and you did it.' },
        ],
      },
      {
        kind: 'do',
        text: 'During **today’s Reset**, notice one time your mind wanders and bring it back. That counts, even if your mind stays busy.',
      },
    ],
    source: 'Frequency over duration: brief daily practice shows adherence advantages at comparable short-term effect.',
  },
  {
    id: 'quiet.eyes',
    title: 'You do not have to close your eyes',
    step: 'Keep your eyes open in today’s practice if that feels better.',
    blocks: [
      {
        kind: 'text',
        text: 'Does closing your eyes feel strange or uneasy? **Keep them open. It works just as well.** That also means you can practise anywhere: on the bus, at your desk or in a waiting room.',
      },
      {
        kind: 'text',
        text: 'Here is the idea. **The goal is attention, not shut eyes.** Attention means where your mind is pointed. You can notice your breath while looking at the floor just as easily as with your eyes closed.',
      },
      {
        kind: 'text',
        text: 'Here is how. **Pick one plain spot to look at**, like a patch of floor, your hands or a wall. Let your eyes rest there softly. Then notice your breathing. When your mind drifts, come back to the spot and the breath.',
      },
      {
        kind: 'text',
        text: 'Open eyes are perfect for 5-4-3-2-1. It is a Reset: a short guided practice in this app, a few minutes long, that helps you calm down. **Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell and 1 you taste.**',
      },
      {
        kind: 'text',
        text: 'Closed eyes make some people uneasy or sleepy. If that is you, **open eyes are the better choice**. And always keep them open when you are walking or need to watch what is around you.',
      },
      {
        kind: 'choice',
        prompt: 'Closing your eyes feels uncomfortable. How can you still practise?',
        options: [
          { label: 'Keep them open and look softly at one spot', feedback: 'Yes. Your attention works the same with open eyes. A soft gaze at one spot gives your mind a place to rest.' },
          { label: 'Stop, because I am doing it wrong', feedback: 'You are not doing it wrong. Closed eyes are optional. Open eyes work just as well, and feeling comfortable helps you keep going.' },
        ],
      },
      {
        kind: 'do',
        text: 'In today’s practice, **keep your eyes open if that feels better**. Look softly at one spot and notice your breathing.',
      },
    ],
    source: 'Eyes-open practice is standard in several traditions and is preferable where closed eyes raise arousal.',
  },
  {
    id: 'quiet.bodyfirst',
    title: 'Start with your body, it is easier',
    step: 'Start today with thirty seconds feeling your feet on the floor.',
    blocks: [
      {
        kind: 'text',
        text: 'Finding it hard to focus on “nothing”? **Start with your body instead.** Feeling your feet on the floor gives your mind something real to hold on to, which makes focusing much easier.',
      },
      {
        kind: 'text',
        text: 'Here is the idea. **Your body is always right here, right now.** Your thoughts jump to tomorrow or last week. A body feeling, like pressure under your feet, keeps you in the present moment.',
      },
      {
        kind: 'text',
        text: 'Say you sit down and your mind starts listing tomorrow’s chores. **Feel your feet pressing into the floor.** Notice the weight, the warmth and the shoes around them. When the chores pull you away again, go back to your feet.',
      },
      {
        kind: 'text',
        text: 'You do not need a special feeling. **Plain, everyday feelings work great**: the chair under you, your hands resting together, your back against the seat. If one spot feels uncomfortable, pick another.',
      },
      {
        kind: 'text',
        text: 'Here is how to start. **For thirty seconds, describe one feeling to yourself**: pressure, warmth, tingling or nothing much. When your mind starts telling a story, come back to the plain feeling.',
      },
      {
        kind: 'choice',
        prompt: 'Your thoughts are racing. Where can you put your attention first?',
        options: [
          { label: 'My feet on the floor', feedback: 'Yes. A real body feeling gives your mind a clear, steady place to come back to.' },
          { label: 'Make every thought stop', feedback: 'You cannot switch thoughts off, and you do not need to. Let them run while you keep coming back to your feet.' },
        ],
      },
      {
        kind: 'do',
        text: 'Today, start with **thirty seconds feeling your feet** on the floor, before anything else.',
      },
    ],
    source: 'Interoceptive anchoring: somatic anchors are easier to sustain than open monitoring for beginners.',
  },
  {
    id: 'quiet.thoughts',
    title: 'You are not your thoughts',
    step: 'Name a painful thought as a thought, then choose one useful action.',
    blocks: [
      {
        kind: 'text',
        text: 'A harsh thought can feel like the truth, just because it popped into your head. **Here is a trick to take the sting out.** It takes one sentence, and you can use it anywhere.',
      },
      {
        kind: 'text',
        text: 'Instead of thinking “I am useless,” say, **“I am having the thought that I am useless.”** That small change reminds you it is a thought, not a fact. Now you can look at it instead of just believing it.',
      },
      {
        kind: 'text',
        text: 'Say you make one mistake at work and think, “I always fail.” **That is a big claim from one mistake.** Saying “I am having the thought that I always fail” gives you room. You can remember the times you did well and fix the mistake in front of you.',
      },
      {
        kind: 'text',
        text: 'Why does this help? A thought feels like a final answer, but **it is only your mind’s first guess**. Putting words around it lets you check the guess before you act on it.',
      },
      {
        kind: 'text',
        text: '**You do not have to argue with every thought.** Sometimes noticing it is enough, and you can carry on. If it points to a real problem, ask what you actually know and **pick one useful thing to do**.',
      },
      {
        kind: 'choice',
        prompt: 'A thought says, “I cannot handle today.” What can you do with it?',
        options: [
          { label: 'Notice it as a thought I am having', feedback: 'Yes. Naming it as a thought gives you room to check it, instead of treating it like a fact about your whole day.' },
          { label: 'Treat it as a sure prediction', feedback: 'A thought can feel convincing without being true. Name it as a thought, then look at what you actually know.' },
        ],
      },
      {
        kind: 'do',
        text: 'When a painful thought shows up, say **“I notice I am thinking...”** and finish the sentence. Then ask what you actually know and pick one useful thing to do.',
      },
    ],
    source: 'Cognitive defusion (ACT): altering the relationship to a thought rather than its content.',
  },
  {
    id: 'quiet.boredom',
    title: 'Boredom is something you can practise with',
    step: 'When boredom hits, notice one urge to switch before acting.',
    blocks: [
      {
        kind: 'text',
        text: 'Sitting quietly can feel boring. **That boredom is actually useful.** It is the perfect chance to practise a powerful skill: noticing an urge before you act on it.',
      },
      { kind: 'fact', value: '1 breath', caption: 'is all it takes to notice an urge before acting on it' },
      {
        kind: 'text',
        text: 'Here is the idea. **An urge is a pull to do something right now**, like grab your phone. Boredom is full of urges. Each time you notice one without acting on it, you get better at choosing what you do.',
      },
      {
        kind: 'text',
        text: 'Say you sit down for a quiet minute. Within seconds, your hand wants your phone. **Notice the urge for one breath.** Where do you feel it? In your hands? Your chest? What do you expect the phone to give you?',
      },
      {
        kind: 'text',
        text: 'Then **stay for one more breath** and watch what the urge does. It may fade, or it may stay. Both are fine. This is not about forcing yourself to sit still. It is about **noticing before you act**.',
      },
      {
        kind: 'choice',
        prompt: 'The first minute of sitting quietly feels boring. What can you try?',
        options: [
          { label: 'Get curious about one feeling', feedback: 'Yes. Picking one feeling, like your feet or your breath, gives your attention a place to rest, even while you feel bored.' },
          { label: 'Decide nothing is happening', feedback: 'Something is happening: you are noticing boredom. That is part of the practice, so stay with it a little longer.' },
        ],
      },
      {
        kind: 'do',
        text: 'If boredom shows up today, **notice one urge to switch** and take one breath before you decide what to do.',
      },
    ],
    source: 'Adjustment to low-stimulation states; early restlessness is the most common reported reason for dropping out.',
  },
  {
    id: 'quiet.moving',
    title: 'You can practise focus while you walk',
    step: 'On a walk you already planned, feel your feet meet the ground.',
    blocks: [
      {
        kind: 'text',
        text: 'Not a sit-still person? **Good news: you can practise while you walk.** A walk you already take, to the bus or the shop, can double as practice. No extra time needed.',
      },
      {
        kind: 'text',
        text: 'Here is the idea. **Pick one thing to notice as you move.** It could be your feet touching the ground, the air on your face or the sounds around you. Your attention moves with you.',
      },
      {
        kind: 'text',
        text: 'Say you are walking to the shop and your mind is replaying a tense talk with your boss. **Feel your next step land.** Heel, then toes. Then the next one. When the replay starts again, come back to your feet.',
      },
      {
        kind: 'text',
        text: 'Here is how. For a few steps, **notice how each foot meets the ground**. When you catch yourself planning or worrying, feel the next step. Keep your eyes up and stay aware of traffic and people.',
      },
      {
        kind: 'text',
        text: 'Walking goes great with **today’s Reset**. A Reset is a short guided practice in this app, a few minutes long, that helps you calm down or wake up. Both train the same skill: **noticing and coming back**.',
      },
      {
        kind: 'choice',
        prompt: 'Sitting still does not suit you today. How can you still practise?',
        options: [
          { label: 'Notice each step during a walk', feedback: 'Yes. Your steps give your attention a steady place to come back to, and you are moving anyway.' },
          { label: 'Skip it, practice means sitting', feedback: 'Not true. Walking practice is a classic way to train your attention. You can do it on any walk you already take.' },
        ],
      },
      {
        kind: 'do',
        text: 'On a walk you already planned, **feel your feet meet the ground** for a few steps. Keep your eyes up and stay aware of your surroundings.',
      },
    ],
    source: 'Walking meditation is a standard formal practice, not a substitute for one.',
  },
  {
    id: 'quiet.rested',
    title: 'Scrolling is not the same as resting',
    step: 'Take a short break without a screen tonight and notice your energy.',
    blocks: [
      {
        kind: 'text',
        text: 'Ever scroll for an hour to relax and come away more tired? **Scrolling keeps your mind busy, even when your body is still.** A real break leaves you feeling recharged.',
      },
      {
        kind: 'text',
        text: 'Here is the idea. **Rest means giving your mind a break**, not just your body. Your phone keeps feeding your brain new things to look at. A few minutes with nothing new coming in lets your mind recover.',
      },
      {
        kind: 'text',
        text: 'Say you finish a tough afternoon and need a break. **Ask yourself what you really need.** Want company? Call a friend. Need sleep? Put the phone down. Need calm? Sit quietly, stretch or step outside for a few minutes.',
      },
      {
        kind: 'text',
        text: 'Screens are not bad. A show can be fun. But when you need to recharge, **a break with nothing new coming in works better**. Step outside, look out the window or just sit.',
      },
      {
        kind: 'text',
        text: 'Try this test. **Take two short breaks on different days**: one scrolling, one without a screen. After each, notice how much energy you have. **Keep the kind of break that leaves you feeling better.**',
      },
      {
        kind: 'choice',
        prompt: 'You scroll during a break and still feel drained. What else could you try?',
        options: [
          { label: 'A few minutes with no new input', feedback: 'Yes. Sitting, stretching or stepping outside gives your mind a real break from new things, which helps you recharge.' },
          { label: 'Keep scrolling until I feel rested', feedback: 'More scrolling keeps feeding your mind new things, so it never gets to rest. Try a few screen-free minutes instead.' },
        ],
      },
      {
        kind: 'do',
        text: 'Tonight, take **a short break without a screen**. Sit, stretch or step outside for a few minutes, then notice your energy.',
      },
    ],
    source: 'Attention restoration: passive media use does not produce the recovery that low-demand or natural settings do.',
  },
  {
    id: 'quiet.kind',
    title: 'Talk to yourself like a friend',
    step: 'Talk to yourself the way you would talk to a friend.',
    blocks: [
      {
        kind: 'text',
        text: 'Being hard on yourself after a mistake feels like it should help. **Kind self-talk works better.** People who speak to themselves kindly are more likely to get back up and try again.',
      },
      {
        kind: 'text',
        text: 'Here is why. Harsh words like “I am hopeless” add shame, and **shame makes the next step harder to face**. Kind self-talk is not letting yourself off the hook. It is telling the truth, gently.',
      },
      {
        kind: 'text',
        text: 'Say you missed a deadline. A harsh voice says, “I am useless.” A kind voice says, **“I missed it. I will tell them and set a new date.”** The second one owns the mistake and gives you a next step.',
      },
      {
        kind: 'text',
        text: 'Being kind does not mean pretending it was fine. **Kind means accurate**: what happened, what you could control and what you can fix. Harsh labels skip all of that and just hurt.',
      },
      {
        kind: 'text',
        text: 'Here is how. **Picture a friend in your exact spot.** What would you say to them? Probably something like, “That matters. Let’s tell them and plan the next step.” Now say that same thing to yourself.',
      },
      {
        kind: 'choice',
        prompt: 'You lose focus and think, “I am terrible at this.” What could you say instead?',
        options: [
          { label: 'My mind wandered, and I can come back', feedback: 'Yes. That is kind and true, and it makes it easy to start again right away.' },
          { label: 'I need to be harder on myself', feedback: 'Being harsh just adds another thing to fight. A kind, honest line gets you back on track faster.' },
        ],
      },
      {
        kind: 'do',
        text: 'Next time you are hard on yourself, ask what you would say **to a friend in the same spot**. Then say that to yourself.',
      },
    ],
    source: 'Self-compassion research: self-criticism predicts avoidance; self-compassion predicts re-engagement after failure.',
  },

  {
    id: 'quiet.onesound',
    title: 'Listen to one nearby sound',
    step: 'Listen to one nearby sound and return when distracted.',
    blocks: [
      {
        kind: 'text',
        text: 'Choose **one sound nearby**, such as rain against a window or the hum of a fan. Listen to what you can hear right now. You do not have to identify every sound or find somewhere silent. This is a small way to practise listening to what is happening now.',
      },
      {
        kind: 'text',
        text: 'You may start thinking about dinner or a conversation. When you notice, **return to the sound**. There is no need to finish the thought or criticise yourself for having it. If the sound stops, choose another. You can stop when you need to do something else.',
      },
      {
        kind: 'reveal',
        prompt: 'Notice two parts of listening.',
        items: [
          {
            label: 'The sound',
            detail: 'Hear whether it is steady, changing, close, or distant. You can notice these details without trying to explain them.',
          },
          {
            label: 'The return',
            detail: 'When you notice you are thinking about something else, listen again. That return is something you can practise, even when distraction happens often.',
          },
        ],
      },
      {
        kind: 'choice',
        prompt: 'You notice you have been planning tomorrow instead of listening. What fits this practice?',
        options: [
          {
            label: 'Listen to the sound again',
            feedback: 'Yes. Noticing where your attention went gives you an opportunity to return without starting the whole practice over.',
          },
          {
            label: 'Find a sound that prevents all thoughts',
            feedback: 'A different sound may be easier to hear, but thoughts can still appear. Returning is part of this practice.',
          },
        ],
      },
      {
        kind: 'do',
        text: 'Today, **listen to one nearby sound** for a short moment. When you notice a distraction, return to listening. Then continue with your day.',
      },
    ],
    source: 'NHS Every Mind Matters, Tackling your worries: returning attention to the present. https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ The particular everyday practice and examples are authored suggestions, not a tested intervention or a promised outcome.',
  },
  {
    id: 'quiet.waiting',
    title: 'Notice what is around you while waiting',
    step: 'Notice your surroundings during one ordinary waiting moment.',
    blocks: [
      {
        kind: 'text',
        text: 'Waiting can leave you wondering what to do with a spare moment. In an ordinary queue or while waiting for a kettle, **notice what is around you**. You do not need to get work done while you wait. Choose something simple that you can see or hear where you already are.',
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Look',
            text: 'Notice one colour or object nearby. Describe what you actually see without deciding whether the place looks good or bad.',
          },
          {
            term: 'Listen',
            text: 'Notice one sound. You can stay aware of announcements, other people, and whether it is your turn.',
          },
          {
            term: 'Continue',
            text: 'Move when the queue moves. Answer when someone speaks to you. Keep watching for your turn while you notice these things.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'If your mind moves to an unfinished task, **notice where you are again**. You can leave that thought for later. You might also decide that you need to send a message or check information. That is a choice you can make after noticing what you have time to do.',
      },
      {
        kind: 'choice',
        prompt: 'The queue moves while you are noticing a nearby sound. What comes next?',
        options: [
          {
            label: 'Move with the queue',
            feedback: 'Yes. Keep paying attention to your turn. You can notice your surroundings again once you are waiting.',
          },
          {
            label: 'Stay still until the practice is finished',
            feedback: 'There is no fixed session to finish. The practice should fit the ordinary moment and the people around you.',
          },
        ],
      },
      {
        kind: 'do',
        text: 'During **one ordinary wait today**, notice one thing you can see and one thing you can hear. Keep watching the queue and listening to the people around you.',
      },
    ],
    source: 'NHS Every Mind Matters, Tackling your worries: returning attention to the present. https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ The particular everyday practice and examples are authored suggestions, not a tested intervention or a promised outcome.',
  },
  {
    id: 'quiet.namefeeling',
    title: 'Give a feeling a plain name',
    step: 'Name one feeling and where you notice it.',
    blocks: [
      {
        kind: 'text',
        text: 'A feeling can be hard to describe when several things happen at once. Start with **one plain word**, such as worried, disappointed, pleased, or irritated. You do not need to explain the whole situation before naming how it feels. A word that is close is enough to begin.',
      },
      {
        kind: 'text',
        text: 'Then notice **where you notice it**. You might feel tension in your shoulders or notice a repeated thought about what someone said. You may feel it in your body, or you may not. You can say that you are unsure without trying to find a feeling in your body that is not there.',
      },
      {
        kind: 'reveal',
        prompt: 'Here are two parts of a simple description.',
        items: [
          {
            label: 'Name',
            detail: '“I feel disappointed.” This describes your experience without guessing what another person meant or what you must do next.',
          },
          {
            label: 'Notice',
            detail: '“I notice it in my face and in the thought that I wanted a different answer.” You can say what you feel in your body, what you are thinking, or both.',
          },
        ],
      },
      {
        kind: 'choice',
        prompt: 'You cannot find the exact word for your feeling. What can you say?',
        options: [
          {
            label: 'Something like worried, but I am unsure',
            feedback: 'That is a clear start. You can revise the word later if another one fits better.',
          },
          {
            label: 'I cannot notice anything until I know the exact name',
            feedback: 'Use a word that is close. You do not need the perfect word to say how you feel.',
          },
        ],
      },
      {
        kind: 'do',
        text: 'Once today, **name one feeling** in plain words and say where you notice it. If you are unsure about either part, say that too.',
      },
    ],
    source: 'NHS Every Mind Matters, Tackling your worries: returning attention to the present. https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ The particular everyday practice and examples are authored suggestions, not a tested intervention or a promised outcome.',
  },
  {
    id: 'quiet.smalldecision',
    title: 'Choose what fits your needs today',
    step: 'Make one small everyday choice by naming what you need.',
    blocks: [
      {
        kind: 'text',
        text: 'A small choice can become difficult when you try to find the best possible answer. For an everyday decision, **name what you need now**. If you are choosing a lunch, that might mean something you have time to prepare. If you are choosing a break, it might mean company or quiet.',
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Need',
            text: 'Say what matters in this particular moment. A need can be practical, such as enough time to eat before leaving.',
          },
          {
            term: 'Options',
            text: 'Consider the choices actually available. You do not have to compare possibilities you cannot use today.',
          },
          {
            term: 'Choice',
            text: 'Pick an option that meets the need reasonably well. It only needs to fit today. You can choose something else tomorrow.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Suppose you have a short break and would like to speak to someone. **Choose for that need**, perhaps by calling a friend who is available. On another day, you may prefer to sit quietly. A different need can lead to a different answer without making either choice wrong.',
      },
      {
        kind: 'choice',
        prompt: 'You have ten minutes for lunch and two meals available. What question helps?',
        options: [
          {
            label: 'Which can I make and eat before I leave?',
            feedback: 'You have a clear need: eating before you leave. Choose the meal that fits the time you have.',
          },
          {
            label: 'Which meal would be best on every possible day?',
            feedback: 'That asks more than this decision needs. Start with the time, food, and needs you actually have today.',
          },
        ],
      },
      {
        kind: 'do',
        text: 'For **one small everyday choice today**, name what you need, consider the choices you have, and choose one that fits your needs today.',
      },
    ],
    source: 'NHS Every Mind Matters, Problem solving: identifying a specific practical problem and considering possible solutions. https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ The particular everyday practice and examples are authored suggestions, not evidence of an energy benefit or an individual activity prescription.',
  },
  {
    id: 'quiet.changemind',
    title: 'New information can change your choice',
    step: 'Revise one everyday choice when new information changes what fits.',
    blocks: [
      {
        kind: 'text',
        text: 'You make a choice using what you know at the time. Later, you may learn something that matters. **Check the new information** before deciding whether to keep the choice. A change in the day can be a reason to change your plan. You can change a plan you made earlier.',
      },
      {
        kind: 'text',
        text: 'Suppose you plan to meet a friend outside, then learn that heavy rain is expected. **Check what still fits**: the time may work, but the place may not. You could suggest meeting indoors. The original plan was made before you had that information. You can change the place and keep the same time.',
      },
      {
        kind: 'sequence',
        prompt: 'Put a practical change of plan in order.',
        steps: [
          'Name what you learned, such as a change in the weather.',
          'Check which part of the choice is affected.',
          'Keep or revise that part and tell anyone who needs to know.',
        ],
        feedback: 'A specific update helps you respond to the new information without reopening unrelated decisions.',
      },
      {
        kind: 'choice',
        prompt: 'Your friend tells you the cafe closes before you can arrive. What fits?',
        options: [
          {
            label: 'Suggest another place that will be open',
            feedback: 'The closing time changes whether the first place works. You can update the place while keeping the purpose of meeting.',
          },
          {
            label: 'Keep the cafe because it was my first choice',
            feedback: 'An earlier choice does not make the cafe available. Consider the new information before deciding what to do.',
          },
        ],
      },
      {
        kind: 'do',
        text: 'When **new information affects an everyday choice**, name what changed and revise the part that no longer fits. Tell anyone affected by your update.',
      },
    ],
    source: 'NHS Every Mind Matters, Problem solving: identifying a specific practical problem and considering possible solutions. https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ The particular everyday practice and examples are authored suggestions, not evidence of an energy benefit or an individual activity prescription.',
  },
  {
    id: 'quiet.askadvice',
    title: 'Ask a question that helps you choose',
    step: 'Ask one specific advice question and make your own choice.',
    blocks: [
      {
        kind: 'text',
        text: 'Advice is easier to use when the other person knows what you are deciding. **Ask a specific question** rather than asking them to solve everything. You might ask which of two routes they have used, or what they found helpful when arranging a similar event. Say which practical detail you want to understand.',
      },
      {
        kind: 'text',
        text: 'Explain any limit that matters, such as your time you have or budget. Then **listen for useful information**. The person may offer an example, point out something you missed, or say they do not know. Their experience can help without settling the decision for you. Their day may be different from yours.',
      },
      {
        kind: 'reveal',
        prompt: 'Separate asking from deciding.',
        items: [
          {
            label: 'Ask',
            detail: '“Have you used this route at that time of day?” gives the other person a question they may be able to answer from experience.',
          },
          {
            label: 'Decide',
            detail: 'After hearing the answer, consider your own time and needs. You can use part of the advice or choose another option.',
          },
        ],
      },
      {
        kind: 'choice',
        prompt: 'Someone recommends an option that does not fit your budget. What can you do?',
        options: [
          {
            label: 'Thank them and choose an affordable option',
            feedback: 'Their suggestion can still help you understand the options. You remain responsible for choosing what fits your time and budget.',
          },
          {
            label: 'Use their option because asking means agreeing',
            feedback: 'Asking for advice is not a promise to follow it. You can explain the limit and make a different choice.',
          },
        ],
      },
      {
        kind: 'do',
        text: 'For **one everyday decision**, ask someone one specific question. Use what you learn alongside your own needs, then make your choice.',
      },
    ],
    source: 'NHS Every Mind Matters, Problem solving: identifying a specific practical problem and considering possible solutions. https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ The particular everyday practice and examples are authored suggestions, not evidence of an energy benefit or an individual activity prescription.',
  },
] as const satisfies readonly LessonDefinition[];
