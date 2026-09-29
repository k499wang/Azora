import type { LessonDefinition } from '../lessonBlock';

/**
 * The body, and the things about it that move how a day feels.
 *
 * Mostly `morning`, but every plan takes a few: the dip, the walk and the glass
 * of water are not about energy or stress in particular. They are the dull
 * explanations worth ruling out before reaching for a better one.
 */
export const BODY_LESSONS = [
  {
    id: 'body.inertia',
    title: 'A foggy morning does not decide your day',
    step: 'Get up, find some light, and judge the day later.',
    blocks: [
      {
        kind: 'text',
        text: 'Some people feel slow and foggy just after waking. This is called “sleep inertia”: your brain is still moving from sleep to being fully awake. **That first feeling does not tell you how your whole day will go.** Picture waking to an alarm and immediately feeling heavy and confused. It is tempting to conclude that the entire day will be difficult. Yet your brain may simply need time to become fully alert after sleep. Give yourself a familiar first task, then check how you feel again after you have been awake for a while.',
      },
      { kind: 'fact', value: '1 transition', caption: 'waking alertness can take time' },
      {
        kind: 'text',
        text: 'For example, you may wake to an alarm and think, “Today will be terrible.” You are making a guess while you are still waking up. **Wait until you have been up for a while** before judging the day.',
      },
      {
        kind: 'choice',
        prompt: 'You wake up foggy and think, “Today is already ruined.” What else could be true?',
        options: [
          { label: 'I may still be waking up', feedback: 'Sleep inertia can make the first part of a morning feel harder. Check again after you have been awake for a while.' },
          { label: 'This proves I slept badly', feedback: 'Morning fog alone cannot tell you how the whole night went. Give yourself time before drawing that conclusion.' },
        ],
      },
      { kind: 'reveal', prompt: 'Tap each part of that morning thought to check it.', items: [
        { label: 'What I notice', detail: 'I feel foggy just after waking. That is a feeling I can observe.' },
        { label: 'What I predict', detail: '“Today is ruined” is a guess about hours that have not happened yet.' },
      ] },
      { kind: 'text', text: 'If you have to leave soon after waking, keep the next step simple: sit up, get dressed, or eat something if you usually do. **You can follow a familiar step** while your mind catches up. A small sequence can help: sit up, drink water if you want it, and find daylight. Then ask whether the feeling changed. **Recheck rather than predict** the entire day.' },
      { kind: 'text', text: 'If the fog stays or keeps affecting your mornings, notice how often it happens and whether you get enough sleep. **A repeated problem deserves attention**, even though one foggy morning cannot predict the whole day.' },
      {
        kind: 'do',
        text: '**Delay the verdict** on your day. Get up, find some light, and check in again once you feel more awake.',
      },
    ],
    source: 'Sleep inertia: measurable performance and mood decrement for 15–30 min after waking from normal sleep.',
  },
  {
    id: 'body.movement',
    title: 'Try a short walk when you feel stuck',
    step: 'Take an easy ten-minute walk and notice how you feel after.',
    blocks: [
      {
        kind: 'text',
        text: 'When you feel low or stuck, a short walk gives your body something simple to do and changes what you see. It may help your mood. **It does not have to be a workout.** When you feel low, a full workout may sound impossible, and waiting to feel motivated can keep you still. A walk gives you a smaller starting point. You could walk down a hallway, around a block, or to a nearby shop. The purpose is to test whether a bit of movement helps your mood or attention today.',
      },
      { kind: 'fact', value: '10 min', caption: 'one manageable walking experiment' },
      {
        kind: 'text',
        text: 'Walking outdoors also gives you daylight and a change of scene. An indoor walk can still count when going outside **is not practical**.',
      },
      { kind: 'text', text: 'Movement gives you a chance to notice the difference between your mood before and after. If the feeling does not change, the walk still gave you **a few minutes of activity**. Try choosing a walk that feels easy to begin. Around the block, down a hallway, or to the end of the street can each be **a valid first step**.' },
      { kind: 'text', text: 'If mood is low, starting can feel harder than walking. Make the first step tiny: put on shoes or stand outside. **Starting is the experiment**.' },
      {
        kind: 'choice',
        prompt: 'You feel too low to start a workout. What is a smaller experiment?',
        options: [
          { label: 'Walk to the end of the street', feedback: 'A short, easy walk lets you compare how you feel before and after.' },
          { label: 'Wait until I feel motivated', feedback: 'Motivation may come after starting. A tiny first step can help you test that.' },
        ],
      },
      { kind: 'sequence', prompt: 'Put a short walking experiment in a manageable order.', steps: [
        'Notice how you feel before you start.',
        'Walk a short route that fits your body and day.',
        'Check how you feel afterward without requiring a big change.',
      ], feedback: 'The point is to test a small action. Your mood may change or stay the same, and both give you information.' },
      {
        kind: 'do',
        text: 'If it works for your body and schedule, **try an easy ten-minute walk** today. Notice how you feel before and after.',
      },
    ],
    source: 'Acute mood effects of brief moderate activity are among the most replicated findings in the area.',
  },
  {
    id: 'body.dip',
    title: 'Afternoon alertness can dip',
    step: 'Notice when your energy dips and plan an easier task there.',
    blocks: [
      {
        kind: 'text',
        text: 'You may notice that thinking feels harder in the early afternoon. Your body’s daily sleep-and-wake rhythm can be part of this. Sleep, food, and work also matter. **Notice when it happens for you.** If you lose focus at roughly the same time on several afternoons, you can plan around that pattern instead of treating it as a personal failure. For example, you might answer simple messages then and do demanding work earlier when possible. If the dip is new or unusually strong, look at sleep and other changes too.',
      },
      { kind: 'fact', value: '1 afternoon', caption: 'a common time for an alertness dip' },
      {
        kind: 'text',
        text: 'If you notice a predictable dip, schedule a lighter task then when possible. Reaching for caffeine late in the day may also affect **tonight’s sleep**.',
      },
      { kind: 'text', text: 'Do you feel the dip at a similar time on several days? That makes it easier to plan around. One sluggish afternoon alone may be explained by **a short night or a demanding morning**. If you cannot move a hard task, break it into a first step. A brief walk, light, or a pause may help you return with **a clearer starting point**.' },
      { kind: 'text', text: 'Your best work time might be morning, evening, or neither on a hard day. A few days of noticing can help you **plan from your real pattern**.' },
      {
        kind: 'choice',
        prompt: 'You lose focus around 2 p.m. on several days. What could you try?',
        options: [
          { label: 'Move one lighter task there', feedback: 'Planning around a recurring dip can make the afternoon more manageable.' },
          { label: 'Assume the whole day is lost', feedback: 'An alertness dip is a period of the day, not a verdict on the day.' },
        ],
      },
      {
        kind: 'do',
        text: 'Notice your alertness today. If a dip appears, put **one easier task** there tomorrow when you can.',
      },
    ],
    source: 'Post-lunch dip is a circadian trough, present in the absence of a meal.',
  },
  {
    id: 'body.walk',
    title: 'A gentle walk after a meal may help',
    step: 'Take an easy ten-minute walk after a meal today.',
    blocks: [
      {
        kind: 'text',
        text: 'After you eat, your body moves sugar from food into your blood for energy. Gentle movement can help your body use that sugar. **An easy walk** may also help you feel more alert after the meal. After lunch, it can be easy to sit down and feel sluggish. A gentle walk gives your muscles a chance to use some of the energy from food, and it may change how alert you feel. You do not need to make the walk fast or long. The useful experiment is one comfortable walk after a meal.',
      },
      { kind: 'fact', value: '10 min', caption: 'one manageable post-meal walk' },
      {
        kind: 'text',
        text: 'It does not have to be brisk or far. The experiment is to compare an easy walk with sitting still and notice **how the afternoon feels**.',
      },
      { kind: 'text', text: 'For example, after lunch you might walk a loop around the building rather than sit immediately. The task is small enough to repeat, which makes **comparison possible**. If you cannot walk after a meal, another time for activity still matters. The aim is to find **movement that fits your day**, not to follow a rigid clock.' },
      { kind: 'text', text: 'Notice whether moving after a meal feels comfortable for you. If it does not, choose another gentle activity or time. **The plan should fit your body**.' },
      {
        kind: 'choice',
        prompt: 'After lunch, you feel sluggish. Which experiment fits this lesson?',
        options: [
          { label: 'Try an easy ten-minute walk', feedback: 'Gentle movement gives you a practical comparison with sitting still.' },
          { label: 'Push through a hard workout', feedback: 'A hard workout is unnecessary here. The question is whether gentle movement helps.' },
        ],
      },
      {
        kind: 'do',
        text: 'After a meal today, **try an easy ten-minute walk** if that feels comfortable. Notice whether the afternoon feels different.',
      },
    ],
    source: 'Post-prandial light walking reduces glucose excursion relative to remaining seated.',
  },
  {
    id: 'body.sitting',
    title: 'Stand up between long periods of sitting',
    step: 'Set one reminder to stand and walk during long sitting.',
    blocks: [
      {
        kind: 'text',
        text: 'It is easy to stay seated for hours when you work or watch something. Standing and moving briefly changes what your body is doing. **Start with one break** you can fit into your day. Think of a workday where one task leads directly to another and you do not notice that you have been sitting for hours. A movement break does not require special clothes or a strict timer. You could stand up when you finish a call or walk to refill a glass. Choose a moment that already occurs.',
      },
      { kind: 'fact', value: '1 break', caption: 'a useful place to start' },
      {
        kind: 'text',
        text: 'There is no magic minute that makes a break count. Build a pattern you can repeat, such as standing between tasks. **Regular movement** is the aim.',
      },
      { kind: 'text', text: 'Notice what keeps you seated: an absorbing task, meetings, or simply forgetting. Put the break at **a natural transition** so it needs less willpower. Stand to refill water or walk while taking a call. You are looking for a repeatable cue, not a perfect posture. **A tiny break is still a break**.' },
      { kind: 'text', text: 'A meeting-heavy day may make frequent breaks unrealistic. Start with the first gap you do control. **One reliable cue** is better than several reminders you ignore.' },
      {
        kind: 'choice',
        prompt: 'You keep forgetting to move during long work sessions. What cue could help?',
        options: [
          { label: 'Stand between two tasks', feedback: 'A natural transition is easier to remember than another arbitrary reminder.' },
          { label: 'Wait for a free afternoon', feedback: 'A short break can fit between tasks even when the afternoon is full.' },
        ],
      },
      {
        kind: 'do',
        text: 'Set one reminder inside your longest sitting today. **Stand up and walk** to the end of the room.',
      },
    ],
    source: 'Sedentary physiology: breaking up prolonged sitting matters more than total sitting time or posture.',
  },
  {
    id: 'body.strength',
    title: 'Try to strengthen your muscles twice a week',
    step: 'Choose two days this week for a short strength session.',
    blocks: [
      {
        kind: 'text',
        text: 'Strength work means asking your muscles to push, pull, lift, or carry something that challenges them. You can start without a gym. Health guidance recommends **strength work on at least two days each week**. Strength work can sound like a gym program, but the basic idea is simpler: ask your muscles to do some work against resistance. Rising from a chair, pushing against a wall, or using a suitable band are possible starting points. Choose movements that fit your body and build slowly so you can repeat them.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Two days', text: 'A useful weekly target for muscle-strengthening activity.' },
          { term: 'Major muscles', text: 'Include legs, hips, back, abdomen, chest, shoulders, and arms over time.' },
          { term: 'Simple options', text: 'Bodyweight movements, resistance bands, or lifting suitable objects.' },
        ],
      },
      {
        kind: 'text',
        text: 'The goal is to challenge muscles at a level that fits you, then allow recovery. Start with **manageable movements** you can do safely and consistently.',
      },
      { kind: 'text', text: 'Strength work means making muscles work against resistance. A chair rise, wall push-up, or carrying an appropriate load can be **a starting example**, depending on your ability. The guideline does not set a universal twenty-minute minimum. The useful target is a safe challenge across major muscle groups that you can **build on over time**.' },
      { kind: 'text', text: 'If a movement hurts or feels unsafe, adjust or choose another. Progress can mean better form or confidence, not only more weight. **Build gradually**.' },
      {
        kind: 'choice',
        prompt: 'You want to begin strength work. Which starting plan is more repeatable?',
        options: [
          { label: 'Choose two suitable days and easy movements', feedback: 'A manageable routine can grow as you learn what feels safe.' },
          { label: 'Do the hardest routine tomorrow', feedback: 'Starting too hard can make the routine harder to repeat. Build gradually.' },
        ],
      },
      {
        kind: 'do',
        text: 'Choose **two possible days** for a short strength session this week, with movements that suit your ability.',
      },
    ],
    source: 'WHO physical activity guidelines: muscle-strengthening on two or more days a week for adults.',
  },
  {
    id: 'body.appetite',
    title: 'Too little sleep can affect hunger',
    step: 'After a short night, plan an easy, satisfying lunch early.',
    blocks: [
      {
        kind: 'text',
        text: 'After a short night, you may feel hungrier or want different foods. Sleep is one thing that can affect appetite. **Notice the pattern without blaming yourself** for feeling hungry. Suppose you sleep poorly and feel much hungrier the next afternoon. That does not mean your appetite is wrong or that you have failed a test. Your body may be responding to a demanding night. A useful response is to notice the connection and make food easy to access when your day gets busy.',
      },
      { kind: 'fact', value: '1 factor', caption: 'one influence on appetite' },
      {
        kind: 'text',
        text: 'Food choices have many influences, and sleep is one of them. Planning a meal before a demanding day may make **the next choice easier**.',
      },
      { kind: 'text', text: 'Imagine noticing a strong snack urge after little sleep. Ask whether you need food, rest, or both before judging the choice. **Curiosity is more useful than blame**. A practical plan might be preparing a satisfying lunch or keeping an easy option available. The point is to reduce decisions when **energy and attention are low**.' },
      { kind: 'text', text: 'Sleep is only one influence on eating. Notice it without turning every choice into a symptom. **A balanced response** leaves room for hunger, enjoyment, and routine.' },
      {
        kind: 'choice',
        prompt: 'You crave a snack after a short night. What is a useful first thought?',
        options: [
          { label: 'Sleep may be influencing what sounds appealing', feedback: 'Short sleep can affect appetite. You can notice the influence without judging the craving.' },
          { label: 'This means I have no self-control', feedback: 'A craving is not a character test. Sleep is one possible influence worth checking.' },
        ],
      },
      {
        kind: 'do',
        text: 'After a short night, **think about an easy, satisfying lunch** before your day gets busy.',
      },
    ],
    source: 'Sleep restriction shifts ghrelin and leptin and increases preference for energy-dense food.',
  },
  {
    id: 'body.evening',
    title: 'Bright light at night can delay sleepiness',
    step: 'Lower one bright light as bedtime gets close tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'Bright light tells your body’s internal clock that it is time to stay awake. Light late in the evening can make sleepiness arrive later. **Dimming a light before bed** gives your body a different signal. Imagine spending the last hour before bed under bright ceiling lights while finishing work. Even after the work ends, the setting still looks like daytime to your body. Turning off one bright light and choosing a calmer activity can help mark the change toward night. It does not have to be perfectly dark.',
      },
      { kind: 'fact', value: '1 evening', caption: 'a useful time to lower bright light' },
      {
        kind: 'text',
        text: 'A lamp or lower screen brightness may make the room feel calmer. Aim for **comfortable dimness**, not an impractical rule about every light.',
      },
      { kind: 'text', text: 'Light is one part of a wind-down, not the whole story. A bright room plus demanding work may keep you alert; a quieter activity in softer light can signal **a change of pace**. You can start with the biggest light source you control. Notice whether you feel ready for bed at a similar time after several evenings. **Patterns matter more than one night**.' },
      { kind: 'text', text: 'If you need light to read or move safely, keep it. A sleep-friendly room still needs to work for your life. **Choose a change you can use**.' },
      {
        kind: 'choice',
        prompt: 'You want to wind down but the room is brightly lit. What could you change?',
        options: [
          { label: 'Dim one light this evening', feedback: 'A smaller lighting change is an easy way to test a calmer evening cue.' },
          { label: 'Give up on sleep tonight', feedback: 'One bright evening does not decide the whole night. You can still change the setting.' },
        ],
      },
      {
        kind: 'do',
        text: 'Tonight, **lower one bright light** as bedtime approaches and notice whether the transition feels easier.',
      },
    ],
    source: 'Evening light exposure delays circadian phase and suppresses melatonin; intensity and angle both matter.',
  },
  {
    id: 'body.thirst',
    title: 'Check whether you need a drink',
    step: 'Have a glass of water if you have not had much today.',
    blocks: [
      {
        kind: 'text',
        text: 'If you have not had much to drink, thirst may be one reason you feel tired or less focused. Sleep, food, stress, and other things may also matter. **Start by checking what your body needs.** When you feel tired, it is natural to search for a big explanation. Start with a simple question: have you had anything to drink recently? If not, having water is an easy thing to try. Then see whether your energy changes, while remembering that sleep, illness, stress, and many other things also affect it.',
      },
      { kind: 'fact', value: '1 glass', caption: 'a simple way to check a basic need' },
      {
        kind: 'text',
        text: 'Water is not an instant treatment for tiredness. The point is to check **an ordinary need** before deciding the whole day has gone wrong.',
      },
      { kind: 'text', text: 'Ask yourself when you last had something to drink. If it has been a while, a glass of water is a low-effort experiment. Then **check again later**. Persistent fatigue can have many causes, so do not use thirst to dismiss it. This lesson is about noticing basic needs while keeping **the wider picture** in view.' },
      { kind: 'text', text: 'A useful check is whether drinking changes anything. If it does not, that is information too. **Keep looking at sleep, stress, and other needs**.' },
      {
        kind: 'choice',
        prompt: 'Your energy feels low and you have barely had anything to drink. What is worth checking?',
        options: [
          { label: 'Have some water and notice how you feel', feedback: 'Thirst is one simple possibility to test; it does not explain every low-energy day.' },
          { label: 'Assume water will fix everything', feedback: 'Water can help when thirst is involved, but low energy has many possible causes.' },
        ],
      },
      {
        kind: 'do',
        text: 'If you have not had much to drink, **have a glass of water** and check later whether you feel any different.',
      },
    ],
    source: 'Mild hypohydration (~2% body mass) produces measurable decrements in mood, vigilance and perceived effort.',
  },
] as const satisfies readonly LessonDefinition[];
