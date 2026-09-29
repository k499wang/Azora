import type { LessonDefinition } from '../lessonBlock';

/**
 * Sleep.
 *
 * The `night` plan runs on these, but they are not only for it: a short fuse
 * and a flat morning are both downstream of the same nights, so `pressure` and
 * `morning` draw on them too.
 *
 * Sleep restriction is deliberately absent. It is the most effective component
 * of CBT-I and the one that needs supervision to titrate; a general-audience
 * app should not be prescribing time in bed.
 */
export const SLEEP_LESSONS = [
  {
    id: 'sleep.anchor',
    title: 'Wake up at a similar time each day',
    blocks: [
      {
        kind: 'text',
        text: 'You cannot make yourself fall asleep at an exact time. You can usually choose when to get up. **A similar wake time each day** helps your body learn when a new day starts.',
      },
      { kind: 'fact', value: '1 hour', caption: 'a useful limit for weekend schedule changes' },
      {
        kind: 'text',
        text: 'A regular wake time helps your internal clock learn when morning starts. Your sleep may become easier to predict, though **one habit cannot fix every sleep problem**.',
      },
      { kind: 'text', text: 'If you stay up late once, avoid treating the next morning as a test. **Return to a wake time you can keep** when it is reasonable. One unusual night does not erase the routine.' },
      { kind: 'text', text: 'Choose a time that leaves room for enough sleep. A consistent alarm paired with too little time in bed is **not a sleep solution**.' },
      { kind: 'choice', prompt: 'You stay up late on the weekend. What wake-up plan could you keep?', options: [
        { label: 'Keep a realistic range', feedback: 'A range you can usually keep supports consistency while still leaving room for enough sleep and real-life demands.' },
        { label: 'Set the earliest alarm possible', feedback: 'An early alarm can cut sleep short. A regular wake time should still leave room for enough sleep.' },
      ] },
      {
        kind: 'do',
        text: 'Pick a wake time you can realistically keep. This week, try to stay **within about an hour** on the weekend too.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: maintain a regular bedtime and wake time, with weekend timing within about an hour. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.light',
    title: 'Daylight tells your body it is morning',
    blocks: [
      {
        kind: 'text',
        text: 'Your body has an internal clock that helps you feel awake during the day and sleepy at night. Morning daylight tells that clock, **“The day has started.”** People respond to light at different times.',
      },
      { kind: 'list', items: [
        { term: 'Morning light', text: 'Helps your body clock know the day has begun.' },
        { term: 'Evening dimness', text: 'Helps make the later part of the day feel different.' },
      ] },
      {
        kind: 'text',
        text: 'Outdoor daylight is usually brighter than indoor light, even on a cloudy day. **A brief trip outside** can make the morning signal clearer to your internal clock.',
      },
      { kind: 'text', text: 'You do not need a long outdoor session. A short trip outside after waking can fit beside breakfast or travel. **Choose a repeatable moment** instead of waiting for a perfect morning.' },
      { kind: 'text', text: 'Try linking outside time to something you already do, such as walking to get breakfast. If mornings are dark where you live, **use available daylight** when it arrives.' },
      { kind: 'choice', prompt: 'It is cloudy and your morning is busy. How could you get daylight?', options: [
        { label: 'Step outside briefly', feedback: 'A short step outside can give your internal clock a morning signal, even on a cloudy day.' },
        { label: 'Skip daylight entirely', feedback: 'One busy morning does not ruin a routine. Look for a brief outdoor moment or available daylight later.' },
      ] },
      {
        kind: 'do',
        text: 'After waking, step outdoors when you can. A short walk or time near a window is a **practical starting point**.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits and Sleep/Wake Cycle: time outdoors and light exposure support circadian timing. https://www.nhlbi.nih.gov/health/sleep/sleep-wake-cycle',
  },
  {
    id: 'sleep.caffeine',
    title: 'A late coffee may affect your sleep',
    blocks: [
      {
        kind: 'text',
        text: 'Caffeine is the ingredient in coffee and some other drinks that helps you feel awake. Your body clears it slowly. A drink in the afternoon may still make it **harder to feel sleepy** at bedtime.',
      },
      { kind: 'fact', value: 'Up to 8 hours', caption: 'caffeine effects can last this long' },
      {
        kind: 'text',
        text: 'Some people find that caffeine delays sleep. Others fall asleep but wake more often. **People respond differently**, so notice what happens for you.',
      },
      { kind: 'text', text: 'As the day goes on, your need for sleep usually grows. Caffeine can hide some of that sleepy feeling for a while. **You still need sleep**, even if a drink makes you feel awake.' },
      { kind: 'text', text: 'Coffee is not the only source. Tea, energy drinks, and some sodas have caffeine too. Choose a time for your last drink based on **your bedtime and how caffeine affects you**.' },
      { kind: 'choice', prompt: 'You want to learn whether caffeine affects your sleep. What could you try?', options: [
        { label: 'Move the last drink earlier', feedback: 'Changing one thing for several days gives you a clearer comparison with your usual evenings.' },
        { label: 'Change every evening habit', feedback: 'Several changes at once make the result harder to interpret. Start with one cutoff you can observe.' },
      ] },
      {
        kind: 'do',
        text: 'If sleep has been difficult, try moving your **last caffeinated drink earlier** for several days and notice whether evenings change.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: caffeine can interfere with sleep and effects may last up to eight hours. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.wind',
    title: 'Give yourself a quieter lead-in to bed',
    blocks: [
      {
        kind: 'text',
        text: 'You cannot switch sleep on like a light. Bright rooms and difficult tasks can keep you alert. **Slowing down before bed** can make the move from daytime to sleep easier.',
      },
      { kind: 'fact', value: '1 hour', caption: 'to make room for quiet time before bed' },
      {
        kind: 'text',
        text: 'It does not need to be a ritual. **Dimmer and slower** is the whole instruction, and doing the same dull things each night matters more than which ones you pick.',
      },
      { kind: 'text', text: 'A wind-down simply means doing calmer things before bed. You might read, wash up, or tidy a small area. Pick something **easy enough to repeat**.' },
      { kind: 'text', text: 'Notice what keeps your mind busy close to bed. If a task can wait, write down its next step. If it cannot, finish it and then spend **a few quiet minutes** before lying down.' },
      { kind: 'choice', prompt: 'You have only fifteen minutes before bed. What could help you slow down?', options: [
        { label: 'Dim lights and choose a quiet task', feedback: 'Even a short, quiet routine can help mark the end of the day. It does not need to fill a whole hour.' },
        { label: 'Finish one demanding work task', feedback: 'That may keep your mind active. If it can wait, write down the next step and spend a few quiet minutes before bed.' },
      ] },
      {
        kind: 'do',
        text: 'Find your bedtime and **turn the lights down** half an hour before it tonight.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: use the hour before bed for quiet time and avoid bright artificial light. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.bed',
    title: 'Help your bed feel like a place for sleep',
    blocks: [
      {
        kind: 'text',
        text: 'Your brain learns what usually happens in a place. If you often work, scroll, or worry in bed, getting into bed may start to feel like a reason to **stay awake**.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Awake and frustrated', text: 'Get up and sit somewhere dim and calm.' },
          { term: 'Go back sleepy', text: 'Sleepy is not the same as tired.' },
          { term: 'Clock turned away', text: 'It is the counting that keeps you up.' },
        ],
      },
      {
        kind: 'text',
        text: 'In sleep therapy, this is called “stimulus control.” It means using the bed mainly when you feel sleepy, so your brain connects **bed with sleep** again. You do not need to force sleep or watch a timer.',
      },
      { kind: 'text', text: 'Suppose you lie down and start planning tomorrow. You may begin to associate the pillow with solving problems. Moving that planning elsewhere gives the bed **one fewer waking job**.' },
      { kind: 'text', text: 'You do not need to watch the minutes. Notice when you feel awake and frustrated. Do something quiet outside bed, then return when **you feel sleepy again**.' },
      { kind: 'choice', prompt: 'You are awake in bed and increasingly frustrated. What could you do?', options: [
        { label: 'Notice frustration and get up briefly', feedback: 'A quiet activity away from bed can help loosen the bed-and-worry link. Return when you feel sleepy.' },
        { label: 'Watch the clock for a set number', feedback: 'Clock watching can add pressure. Notice how you feel instead of waiting for an exact number of minutes.' },
      ] },
      {
        kind: 'do',
        text: 'If you are lying awake and getting frustrated, consider **getting up briefly** for a quiet activity, then return when sleepy.',
      },
    ],
    source: 'NHLBI Insomnia Treatment: CBT-I includes stimulus control to reconnect the bed with sleep. https://www.nhlbi.nih.gov/health/insomnia/treatment',
  },
  {
    id: 'sleep.threeam',
    title: 'Waking at night does not decide tomorrow',
    blocks: [
      {
        kind: 'text',
        text: 'Many people wake up briefly during the night. If you wake up, it can be easy to think, “Now the whole night is ruined.” **One waking does not tell you how the rest of the night will go.**',
      },
      { kind: 'fact', value: '1 waking', caption: 'does not tell the story of the whole night' },
      {
        kind: 'text',
        text: 'Checking the clock can invite calculations about how much sleep remains. Notice the thought **“tomorrow is ruined”** as a prediction, not a fact.',
      },
      { kind: 'text', text: 'Imagine waking and thinking, “I will be useless tomorrow.” That thought can raise the stakes of falling asleep immediately. Ask, **“What do I actually know?”** One waking is all you know.' },
      { kind: 'text', text: 'A gentler response is, “I am awake right now; I can rest without solving tomorrow.” If you become frustrated, use a quiet activity until **sleepiness returns**.' },
      { kind: 'choice', prompt: 'At 3 a.m. you think, “Tomorrow is ruined.” Which reply is more grounded?', options: [
        { label: 'I am awake now; tomorrow is unknown', feedback: 'That names what you know without promising an easy day. A prediction is not the same as a fact.' },
        { label: 'I must fall asleep immediately', feedback: 'Urgency can raise the pressure. Try a narrower thought and let tomorrow be something you handle tomorrow.' },
      ] },
      {
        kind: 'do',
        text: 'If checking the clock leads to more worry, turn it **away from the bed** tonight. Remind yourself that one waking does not predict tomorrow.',
      },
    ],
    source: 'NHLBI Insomnia Treatment: CBT-I addresses unhelpful sleep thoughts and habits that keep someone awake. https://www.nhlbi.nih.gov/health/insomnia/treatment',
  },
  {
    id: 'sleep.worry',
    title: 'Write tomorrow’s tasks down before bed',
    blocks: [
      {
        kind: 'text',
        text: 'When you lie down, unfinished tasks may pop into your mind. Your brain may keep repeating them so you will not forget. **Writing them down before bed** gives you a place to find them tomorrow.',
      },
      { kind: 'fact', value: '5 min', caption: 'with a pen, before bed' },
      {
        kind: 'text',
        text: 'Writing tasks down gives them a place outside your head. It does not erase worry, but it may help you stop **rehearsing the list** in bed.',
      },
      { kind: 'text', text: 'Try separating a worry from its next action. “I might forget the appointment” becomes “Put it in the calendar after breakfast.” That turns **a repeating thought into a plan**.' },
      { kind: 'text', text: 'You cannot solve every worry tonight. Write one down and choose when you will look at it again. That gives you a plan without using **bedtime to keep planning**.' },
      { kind: 'choice', prompt: 'A task pops back into mind after you lie down. What could you tell yourself?', options: [
        { label: 'It is written down for tomorrow', feedback: 'You have recorded the task and chosen when to look at it again. The thought may return, and you can remind yourself of that plan.' },
        { label: 'I must stop thinking about it', feedback: 'Trying to force a thought away can become another bedtime task. Gently return to the plan you already wrote.' },
      ] },
      {
        kind: 'do',
        text: 'Tonight before you get into bed, **write tomorrow’s list** on paper, unfinished and messy if that is how it comes out.',
      },
    ],
    source: 'NHLBI Insomnia Treatment: CBT-I addresses sleep-related thoughts; writing a plan is a self-guided way to move planning outside bedtime. https://www.nhlbi.nih.gov/health/insomnia/treatment',
  },
  {
    id: 'sleep.alcohol',
    title: 'Alcohol may wake you later in the night',
    blocks: [
      {
        kind: 'text',
        text: 'Alcohol can make you feel sleepy when you first go to bed. Later, it can make sleep **lighter and easier to interrupt**. Falling asleep quickly does not always mean you slept well.',
      },
      { kind: 'fact', value: '1 change', caption: 'try drinking earlier or skipping a bedtime drink' },
      {
        kind: 'text',
        text: 'That makes alcohol a poor sleep aid, even when falling asleep feels easy. **The whole night matters**, not only the first few minutes.',
      },
      { kind: 'text', text: 'Notice when you drank, when you went to bed, and whether you woke later. One night can have many causes. **Looking at several nights** can show you whether alcohol may be affecting your sleep.' },
      { kind: 'text', text: 'If sleep has been difficult, avoiding alcohol close to bedtime is a reasonable trial. The point is to choose based on **the next morning as well as the evening**.' },
      { kind: 'choice', prompt: 'You want to see whether a bedtime drink affects your sleep. What would give you a fairer picture?', options: [
        { label: 'Notice several comparable nights', feedback: 'Looking at timing, waking, and the next morning across similar nights is more useful than judging one night.' },
        { label: 'Decide from one rough night', feedback: 'One night can have many causes. Compare a few nights before deciding whether the drink made a difference.' },
      ] },
      {
        kind: 'do',
        text: 'If you drink, compare how you sleep on different nights. You could **drink earlier or skip a bedtime drink** and see whether it changes anything.',
      },
    ],
    source: 'NHLBI Insomnia Treatment: alcohol can make sleep lighter and increase night waking. https://www.nhlbi.nih.gov/health/insomnia/treatment',
  },
  {
    id: 'sleep.hours',
    title: 'There is no perfect eight-hour score',
    blocks: [
      {
        kind: 'text',
        text: 'Adults do not all need exactly eight hours of sleep. Some need more than others. If you lie awake calculating the hours left, **the number can become another source of worry**.',
      },
      { kind: 'fact', value: '7–9 hrs', caption: 'is the range, not the rule' },
      {
        kind: 'text',
        text: 'Hours alone do not tell you whether sleep is meeting your needs. If you often struggle to stay awake or wake feeling unrested, **pay attention to that** even if your hours look adequate.',
      },
      { kind: 'text', text: 'Adults generally need at least seven hours, but the amount that leaves someone well rested varies. Time in bed also differs from **time actually asleep**.' },
      { kind: 'text', text: 'One poor night can happen. If you often feel sleepy despite giving yourself enough time to sleep, it may help to talk with a health professional. **Notice how you feel over several days**.' },
      { kind: 'choice', prompt: 'Your tracker says eight hours, but you often wake unrefreshed. What is the most useful next thought?', options: [
        { label: 'Look at the ongoing pattern', feedback: 'Notice both your hours and how you feel during the day. Ongoing sleepiness or waking unrefreshed deserves attention.' },
        { label: 'The number proves sleep is fine', feedback: 'Duration is only one clue. Quality, timing, and daytime functioning matter too.' },
      ] },
      {
        kind: 'do',
        text: 'This week, notice both your approximate hours and **how rested you feel**. Look for a pattern rather than judging one night.',
      },
    ],
    source: 'CDC About Sleep: adult duration recommendations and sleep quality include feeling refreshed and functioning during the day. https://www.cdc.gov/sleep/about/',
  },
  {
    id: 'sleep.weekend',
    title: 'A very late weekend wake-up can shift sleep',
    blocks: [
      {
        kind: 'text',
        text: 'If you wake much later on weekends, your body may not feel sleepy at its usual time on Sunday night. That can make **Monday morning harder**. You still need enough sleep.',
      },
      { kind: 'fact', value: 'About 1 hour', caption: 'a useful limit for weekend schedule changes' },
      {
        kind: 'text',
        text: 'Sleeping later may mean you need more sleep. Ask whether you can **allow more time for sleep during the week** while keeping wake times fairly similar.',
      },
      { kind: 'text', text: 'Picture staying up late Friday and Saturday, then asking your body to feel sleepy early Sunday. The mismatch can make Monday feel like **an abrupt schedule change**.' },
      { kind: 'text', text: 'A realistic weekend does not require perfect sameness. Pick the smallest adjustment you can keep, and notice whether Sunday night and Monday morning become **easier to manage**.' },
      { kind: 'choice', prompt: 'You want a weekend lie-in after a tiring week. Which plan keeps both needs in view?', options: [
        { label: 'Get enough sleep and wake at a similar time', feedback: 'You need enough sleep. Keeping the weekend wake time fairly close to weekdays may also make Monday easier.' },
        { label: 'Ignore the need for sleep', feedback: 'Consistency should not mean regularly cutting sleep short. Look for more sleep opportunity across the week.' },
      ] },
      {
        kind: 'do',
        text: 'This weekend, aim to **wake within about an hour** of your weekday time, and make room for enough sleep the nights before.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: limit weekend schedule differences to about one hour to support the sleep-wake rhythm. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.nap',
    title: 'A late nap may make bedtime harder',
    blocks: [
      {
        kind: 'text',
        text: 'A nap can help you feel more awake now. But a long nap or one late in the day may mean you are **less sleepy when bedtime arrives**. Notice what happens on your own nights.',
      },
      { kind: 'fact', value: '20 min', caption: 'a common upper limit for an adult nap' },
      {
        kind: 'text',
        text: 'A longer nap may leave you feeling groggy when you wake and less sleepy at night. **Notice what happens at bedtime** after different naps.',
      },
      { kind: 'text', text: 'A nap affects people differently. If you are short on sleep, a brief nap may help. If you regularly struggle to fall asleep at night, a late nap may mean you are **less sleepy at bedtime**.' },
      { kind: 'text', text: 'Ask why you are napping: to stay safe, feel more awake, or simply from habit? If you need long naps often, check whether you are **getting enough time to sleep at night**.' },
      { kind: 'choice', prompt: 'A late nap helps today but bedtime has become harder. What could you try next?', options: [
        { label: 'Try a brief, earlier nap', feedback: 'An earlier, shorter nap may still help today while leaving you more sleepy at bedtime.' },
        { label: 'Keep the same late nap', feedback: 'That may keep affecting bedtime. If sleepiness is persistent or unsafe, prioritize rest and seek appropriate help.' },
      ] },
      {
        kind: 'do',
        text: 'If you nap today, try a **brief, earlier nap** and notice whether it helps without making bedtime harder.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: adults can limit naps to twenty minutes and take them earlier if nighttime sleep is difficult. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.debt',
    title: 'Less sleep can make patience harder',
    blocks: [
      {
        kind: 'text',
        text: 'After too little sleep, an ordinary delay or message may feel more upsetting. Your patience may be lower because you are tired. **That is useful context** when choosing how to respond.',
      },
      { kind: 'fact', value: '1 factor', caption: 'too little sleep can make patience harder' },
      {
        kind: 'text',
        text: 'A difficult day can have several causes: poor sleep, stress, and the event itself. **Check what was going on** before deciding that your irritation says something bad about you.',
      },
      { kind: 'text', text: 'Imagine the same delay after a full night and a short one. The delay has not changed, but it may be harder to stay patient when tired. **Tiredness helps explain your feeling**; you are still responsible for what you say.' },
      { kind: 'text', text: 'Ask, “What happened? What did I think it meant? How rested am I?” These questions can help you choose **words that fit what actually happened**.' },
      { kind: 'choice', prompt: 'After a short night, an irritating message arrives. What could you do?', options: [
        { label: 'Pause before replying', feedback: 'A pause lets you look at the message and notice your tiredness. Then you can choose words that fit the situation.' },
        { label: 'Send the first angry reply', feedback: 'The feeling makes sense, but a short night can narrow your patience. A pause may prevent an avoidable conflict.' },
      ] },
      {
        kind: 'do',
        text: 'This week, note what the night was like before each day that went badly, and **look for the overlap**.',
      },
    ],
    source: 'Sleep restriction studies show next-day increases in irritability and emotional reactivity after a single short night.',
  },
] as const satisfies readonly LessonDefinition[];
