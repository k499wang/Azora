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
    title: 'The first twenty minutes are not the day',
    blocks: [
      {
        kind: 'text',
        text: 'Sleep inertia is the fog you are in when you wake up. It lasts **twenty to thirty minutes** after a normal night, and it is not a reading on how well you slept.',
      },
      { kind: 'fact', value: '20–30 min', caption: 'before you can judge anything' },
      {
        kind: 'text',
        text: 'That matters because most of us decide what kind of day this is going to be **in the first three minutes** of it, on the least reliable information we will get all day.',
      },
      {
        kind: 'do',
        text: '**Do not rate the day** until you are twenty minutes into it. Get up, get some light, then decide.',
      },
    ],
    source: 'Sleep inertia: measurable performance and mood decrement for 15–30 min after waking from normal sleep.',
  },
  {
    id: 'body.movement',
    title: 'A short walk is the fastest mood lever',
    blocks: [
      {
        kind: 'text',
        text: 'A short walk changes how you feel **faster and more reliably** than almost anything else we can point at, and it does not need to be a workout to count.',
      },
      { kind: 'fact', value: '10 min', caption: 'is the whole dose' },
      {
        kind: 'text',
        text: 'It works better **outdoors**, and better when it is not also an errand, so the point is the moving rather than the arriving.',
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
        text: 'The early-afternoon slump is **part of your body clock**, not a failure of will. It turns up whether or not you had lunch, and whatever the lunch was.',
      },
      { kind: 'fact', value: '2–4pm', caption: 'for most people, most days' },
      {
        kind: 'text',
        text: 'So stop spending it on work that needs the most from you, and stop **drinking through it**. That is the coffee that will still be there at bedtime.',
      },
      {
        kind: 'do',
        text: 'Put the **easiest thing on your list** in the dip today, and save the hard one for tomorrow morning.',
      },
    ],
    source: 'Post-lunch dip is a circadian trough, present in the absence of a meal.',
  },
  {
    id: 'body.walk',
    title: 'Walk after you eat, not before',
    blocks: [
      {
        kind: 'text',
        text: 'Ten minutes of walking after a meal **blunts the rise** in blood sugar that follows it, and that rise and then fall is most of what the sleepy feeling afterwards is made of.',
      },
      { kind: 'fact', value: '10 min', caption: 'after eating, not before' },
      {
        kind: 'text',
        text: 'It does not need to be brisk and it does not need to be far, because **standing and moving** is most of the effect.',
      },
      {
        kind: 'do',
        text: 'After your biggest meal today, **walk for ten minutes** before you sit back down.',
      },
    ],
    source: 'Post-prandial light walking reduces glucose excursion relative to remaining seated.',
  },
  {
    id: 'body.sitting',
    title: 'Break up long sitting, not your posture',
    blocks: [
      {
        kind: 'text',
        text: 'No chair is the problem, and neither is how you sit in it. **Staying in one place** for three hours is, which is why the fix is interruption rather than posture.',
      },
      { kind: 'fact', value: '30 min', caption: 'before it is worth standing up' },
      {
        kind: 'text',
        text: 'Two minutes on your feet is enough to break it up, so **frequency beats duration** here, the same as it does with everything else on this list.',
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
    title: 'Twice a week is the whole recommendation',
    blocks: [
      {
        kind: 'text',
        text: 'Not a gym and not a programme. **Twice a week** of something that makes your muscles work is the entire guideline, and most people do none of it.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Twice a week', text: 'That is the entire frequency target.' },
          { term: 'Twenty minutes', text: 'That is enough to count. Longer is optional.' },
          { term: 'Anything heavy', text: 'Bags, bodyweight, stairs. The equipment is not the point.' },
        ],
      },
      {
        kind: 'text',
        text: 'It reads like a fitness target and behaves more like a **sleep and mood** one. What people notice first is usually not in the mirror.',
      },
      {
        kind: 'do',
        text: 'Put **two sessions** in the week ahead. Twenty minutes each, anything you would struggle to do ten times.',
      },
    ],
    source: 'WHO physical activity guidelines: muscle-strengthening on two or more days a week for adults.',
  },
  {
    id: 'body.appetite',
    title: 'Short sleep changes what you want',
    blocks: [
      {
        kind: 'text',
        text: 'After a bad night, the pull towards **quick, heavy food** is not a weakness of yours. The signals for hungry and full both shift after short sleep, and they shift in the same direction.',
      },
      { kind: 'fact', value: '1 night', caption: 'is enough to move it' },
      {
        kind: 'text',
        text: 'So a bad week of eating after a bad week of sleeping is **one problem, not two**, and the eating is downstream of the sleeping.',
      },
      {
        kind: 'do',
        text: 'On a day after a short night, **decide lunch in the morning**, before the pull turns up.',
      },
    ],
    source: 'Sleep restriction shifts ghrelin and leptin and increases preference for energy-dense food.',
  },
  {
    id: 'body.evening',
    title: 'Bright evenings push your sleep later',
    blocks: [
      {
        kind: 'text',
        text: 'Morning light moves your body clock earlier, and **bright light in the evening** holds it back. It is the same lever in the opposite direction, and most homes are lit for the wrong one.',
      },
      { kind: 'fact', value: '2 hours', caption: 'before bed, take it down' },
      {
        kind: 'text',
        text: 'Overhead lighting does the most damage. **Lamps, low and few**, do more than anything you could buy for this.',
      },
      {
        kind: 'do',
        text: 'Tonight, **turn the overhead light off** two hours before bed and use whatever sits lower than your eyes.',
      },
    ],
    source: 'Evening light exposure delays circadian phase and suppresses melatonin; intensity and angle both matter.',
  },
  {
    id: 'body.thirst',
    title: 'Tired is sometimes only thirsty',
    blocks: [
      {
        kind: 'text',
        text: 'Mild dehydration shows up as **flat, foggy and short-tempered** long before it shows up as thirst, which is why it is the cheapest thing on this list to rule out.',
      },
      { kind: 'fact', value: '2%', caption: 'is enough to feel it' },
      {
        kind: 'text',
        text: 'It will not undo a bad night or fix anything on its own, and it is worth knowing about only because it is **so easily missed**.',
      },
      {
        kind: 'do',
        text: 'Have a glass of water before your next coffee today. **Before it**, not instead of it.',
      },
    ],
    source: 'Mild hypohydration (~2% body mass) produces measurable decrements in mood, vigilance and perceived effort.',
  },
] as const satisfies readonly LessonDefinition[];
