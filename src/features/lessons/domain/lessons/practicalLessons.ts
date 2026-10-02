import type { LessonDefinition } from '../lessonBlock';

/** Present-day instructions that replace review lessons in new plans. */
export const PRACTICAL_LESSONS = [
  {
    id: 'attention.anchor',
    title: 'Give your attention one place to return to',
    step: 'Follow the current breathing prompt whenever your attention wanders.',
    blocks: [
      { kind: 'text', text: 'During a breathing Reset, a thought can interrupt you. You might remember a message, start planning dinner, or wonder how much time is left. **Use the current prompt as your place to return to.** A Reset is a short guided practice in Azora. The screen tells you what to do next.' },
      { kind: 'text', text: '**Attention means what you are noticing right now.** You do not need to keep it in one place perfectly. When you notice a thought, look at the guide again. Read whether it asks you to breathe in, breathe out, or pause. Continue comfortably from there.' },
      { kind: 'text', text: 'For example, you start thinking about an unfinished task while the guide says breathe out. **Leave the task for this moment.** Follow the next comfortable breath and the prompt on screen. You do not need to finish the thought, argue with it, or work out why it appeared.' },
      { kind: 'choice', prompt: 'A thought interrupts you halfway through the breathing Reset. What can you do?', options: [
        { label: 'Read the current prompt and continue comfortably', feedback: 'Yes. The guide gives you a clear place to return to. You can continue from the current step without restarting.' },
        { label: 'Start again until I have no thoughts', feedback: 'Thoughts can happen during practice. Restarting is unnecessary. Return to the current prompt and continue at a comfortable pace.' },
      ] },
      { kind: 'text', text: '**Returning is a simple action, not a test.** You may return several times in a short Reset. That does not make the practice wrong. Keep your breathing comfortable instead of taking larger breaths to make up for being distracted. You do not have to force a pause if it feels uncomfortable.' },
      { kind: 'do', text: 'Open today’s breathing Reset. **Follow the prompt currently on screen.** Whenever your attention wanders, read that prompt again and continue comfortably. Let the guide provide the next step.' },
    ],
    source: 'Author practical example: following the existing breathing guide after distraction without requiring thought suppression or a particular feeling.',
  },
  {
    id: 'attention.effort',
    title: 'Use comfortable effort during your breathing Reset',
    step: 'Follow today’s breathing guide gently, without forcing bigger breaths.',
    blocks: [
      { kind: 'text', text: 'A breathing Reset is a short guided practice in Azora. **The aim is to follow comfortably.** It is not a contest to take the biggest breath, stay perfectly still, or finish feeling completely relaxed. You can use an ordinary seated position and let the guide show the next step.' },
      { kind: 'text', text: '**Start with a position you can keep easily.** Let your feet rest if you are sitting. Your hands can rest on your lap or another comfortable surface. You do not need to push your shoulders down or hold your back rigid. Move a little if your position becomes uncomfortable.' },
      { kind: 'text', text: 'When the guide asks you to breathe in or out, **use a comfortable amount of air**. Bigger is not automatically better. If a pause feels uncomfortable, breathe normally instead. Do not hold your breath just to match a timer. You can stop the Reset if you need to.' },
      { kind: 'reveal', prompt: 'Tap each part of a gentle practice.', items: [
        { label: 'Comfortable position', detail: 'Sit or rest in a way that does not require constant effort. Adjust your position when you need to, rather than forcing yourself to stay still.' },
        { label: 'Comfortable breathing', detail: 'Use a gentle breath and follow only the parts of the guide that feel comfortable. Ordinary breathing is available whenever you need it.' },
      ] },
      { kind: 'choice', prompt: 'You are trying hard to match the guide and a pause feels uncomfortable. What should you do?', options: [
        { label: 'Breathe normally and keep the practice comfortable', feedback: 'Yes. Comfort takes priority over matching a timer. You can continue gently or stop the Reset if you need to.' },
        { label: 'Push through to complete the pause', feedback: 'There is no need to force it. Breathe normally instead. Following a guide should not mean ignoring discomfort.' },
      ] },
      { kind: 'do', text: 'Open today’s breathing Reset. **Use gentle, comfortable effort.** Adjust your position if needed and breathe normally whenever a prompt does not feel comfortable. You do not need to create a particular feeling.' },
    ],
    source: 'Author practical example: comfort-first use of the existing breathing guide without promising relaxation or asking users to force breath holds.',
  },
  {
    id: 'plan.clear',
    title: 'Remove one obstacle before you start',
    step: 'Make one small preparation, then open today’s first Reset.',
    blocks: [
      { kind: 'text', text: 'Sometimes the next step is clear, but something small is in the way. Your phone is across the room, you are standing in a busy doorway, or a video is still playing. **Remove one practical obstacle.** You do not need a perfect room or a long preparation routine.' },
      { kind: 'text', text: 'A Reset is a short guided practice in Azora. Today’s plan shows the practice to open and its duration. **Prepare for that specific practice.** If it is breathing, find a comfortable position. If it is a noticing practice, use the surroundings you already have. Keep the preparation smaller than the practice itself.' },
      { kind: 'list', items: [
        { term: 'Too much sound', text: 'Pause a video or move away from a loud speaker if that is easy. You do not need complete silence to follow the guide.' },
        { term: 'Awkward position', text: 'Sit somewhere comfortable or adjust how you are resting. You do not need a special chair, mat, or posture.' },
        { term: 'Another task open', text: 'Save your document or leave a short note about the next step. Then give yourself permission to pause that task briefly.' },
      ] },
      { kind: 'text', text: '**Set a limit on getting ready.** Moving one object or pausing one video is enough. Cleaning the whole room first can turn a short practice into a much bigger job. Choose a change you can make immediately, then open the Reset.' },
      { kind: 'choice', prompt: 'You want to do your Reset, but your desk is messy. What is a small preparation?', options: [
        { label: 'Make space to rest my hands, then start', feedback: 'Yes. That removes one immediate obstacle without turning the Reset into a cleaning task.' },
        { label: 'Organize every drawer before opening the app', feedback: 'That adds a larger job. Clear only what you need for a comfortable practice and leave the rest for another time.' },
      ] },
      { kind: 'do', text: '**Make one small preparation now.** Pause a video, adjust your position, or save your work. Then open today’s first Reset. Let that one change be enough to begin.' },
    ],
    source: 'Author practical example: reducing immediate starting friction without changing prescribed plan activities or requiring ideal surroundings.',
  },
  {
    id: 'plan.carry',
    title: 'Give your next small practice a clear place',
    step: 'Choose a realistic moment for your next short practice.',
    blocks: [
      { kind: 'text', text: 'You are at the end of this plan. **Give your next small practice a clear place in your day.** Start by choosing an action you can do comfortably, then name a realistic moment for it. Keep both choices simple. A Reset is a short guided practice in Azora, with instructions on screen.' },
      { kind: 'text', text: '**Name the action clearly.** “Take care of myself” is broad. “Sit down for a short breathing practice” tells you what to do. You could also choose to notice your surroundings or gently release a tense hand. Keep the action comfortable and small enough for an ordinary day.' },
      { kind: 'text', text: '**Give the action a place in your day.** Choose a moment you expect to have, such as after putting lunch dishes away. If that moment will be rushed, choose another one. This is a practical arrangement for your next attempt, not a promise to do it perfectly forever.' },
      { kind: 'reveal', prompt: 'Tap the parts of a clear next step.', items: [
        { label: 'When', detail: 'After I put my lunch dishes away. This names an ordinary moment rather than leaving the practice somewhere in a busy day.' },
        { label: 'What', detail: 'I will sit down for a short, comfortable breathing practice. This names one action instead of a large goal.' },
        { label: 'If that moment is busy', detail: 'I will choose another available moment. A changed schedule does not create extra practice to make up.' },
      ] },
      { kind: 'choice', prompt: 'Tomorrow’s lunch break is already full. How can you arrange your next practice?', options: [
        { label: 'Choose another small, available moment', feedback: 'Yes. Fit the action into the day you expect to have. You can move the moment without making the practice bigger.' },
        { label: 'Commit to a long session no matter what', feedback: 'A larger commitment may be harder to fit. Name one short action and give it a realistic place instead.' },
      ] },
      { kind: 'do', text: 'Complete this sentence: **“After ___, I will ___.”** Name one realistic moment and one small practice. Keep the next step comfortable, clear, and simple enough to begin.' },
    ],
    source: 'Author practical example: planning a forward-looking small action at the end of a program without requiring retrospective assessment or assuming post-completion app navigation.',
  },
  {
    id: 'quiet.prepare',
    title: 'Make your next small promise easy to begin',
    step: 'Prepare one thing you need for your next small action.',
    blocks: [
      { kind: 'text', text: 'A small promise is easier to begin when the first step is ready. **Prepare one thing you will need.** If your action is reading a page, put the book where you plan to sit. If it is drinking water, place a glass nearby. Preparation supports the action; it does not replace doing it.' },
      { kind: 'text', text: '**Keep the promise specific and manageable.** “Be more organized” has no clear starting point. “Put one letter in the folder” does. Choose an action that fits your available time and energy. You can make a smaller choice when the day is full.' },
      { kind: 'text', text: 'For a Reset, the short guided practice in Azora, **read what today’s plan asks for**. You might need a comfortable place to sit, rather than special equipment. Get into that position and let the screen provide the instructions. Preparing the entire day is unnecessary.' },
      { kind: 'sequence', prompt: 'Put a small promise into a clear order.', steps: [
        'Name one action you can realistically do.',
        'Put one needed item or comfortable position within reach.',
        'Begin the action instead of adding more preparation.',
      ], feedback: 'Choose the action first so you know what preparation is useful. Prepare only what it needs, then start.' },
      { kind: 'text', text: '**Avoid turning preparation into a second big task.** Reading one page does not require sorting the whole bookshelf. Filing one letter does not require redesigning your desk. If getting ready becomes complicated, reduce it to the one thing that allows the first action.' },
      { kind: 'choice', prompt: 'Your small action is putting one letter away. What preparation fits?', options: [
        { label: 'Put the letter and its folder within reach', feedback: 'Yes. You have what you need to begin the specific action. You can file the letter without reorganizing everything else.' },
        { label: 'Sort every paper in the house first', feedback: 'That is a separate, larger task. Prepare only the letter and folder so your small promise stays manageable.' },
      ] },
      { kind: 'do', text: '**Name your next small action.** Prepare one item or position it needs, then begin. For today’s Reset, find a comfortable position and open the guide. Keep preparation short and useful.' },
    ],
    source: 'Author practical example: preparing for a manageable action without asking users to judge previous follow-through or promising changes in self-trust.',
  },
] as const satisfies readonly LessonDefinition[];
