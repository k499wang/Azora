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
    step: 'Pick a wake time and keep weekends within an hour of it.',
    blocks: [
      {
        kind: 'text',
        text: 'You cannot make yourself fall asleep at an exact time, but you can often choose when to get up. When you wake around the same time on most days, your body gets a more reliable signal that the day has begun. **Choose a wake time that leaves enough room for sleep**, rather than setting an early alarm simply to be consistent.',
      },
      { kind: 'fact', value: '1 hour', caption: 'a useful limit for weekend schedule changes' },
      {
        kind: 'text',
        text: 'Your internal clock is the daily pattern that helps you feel awake and sleepy at different times. Waking at roughly the same time gives that pattern a steady starting point, which can make sleepiness more predictable over time. It will not solve every sleep problem, but it gives you **one part of your routine that you can control**.',
      },
      { kind: 'text', text: 'For example, if a friend visits and you go to bed later than usual on Saturday, the next morning does not have to be a test of discipline. Get the sleep you need, then return to a wake time you can usually keep. **One unusual night does not erase the routine** you have practised on other days. Look at when you realistically finish your evenings before choosing an alarm. If the proposed wake time means regularly cutting your sleep short, move the wake time later or make more room for sleep at night. **The aim is a repeatable schedule with enough sleep**, not the earliest possible alarm.' },
      { kind: 'choice', prompt: 'You go to bed late on Saturday after seeing friends. Which wake-up plan could you follow without regularly losing needed sleep?', options: [
        { label: 'Keep a realistic range', feedback: 'A range you can usually keep supports consistency while still leaving room for enough sleep and real-life demands.' },
        { label: 'Set the earliest alarm possible', feedback: 'An early alarm can cut sleep short. A regular wake time should still leave room for enough sleep.' },
      ] },
      { kind: 'reveal', prompt: 'Tap both parts of a wake-up plan that can work in real life.', items: [
        { label: 'A time you can usually keep', detail: 'A similar wake time gives your routine a steady starting point.' },
        { label: 'Enough room for sleep', detail: 'The time still needs to allow enough sleep, including after an unusual night.' },
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
    step: 'Get outside or near a window soon after you wake.',
    blocks: [
      {
        kind: 'text',
        text: 'Your body has an internal clock: a daily pattern that helps you feel awake during the day and sleepy at night. Light is one signal that helps set this pattern. When daylight reaches your eyes in the morning, it helps tell your body that **the day has started**. You do not need to stare at the sun, and people respond to light at different times.',
      },
      { kind: 'list', items: [
        { term: 'Morning light', text: 'Helps your body clock know the day has begun.' },
        { term: 'Evening dimness', text: 'Helps make the later part of the day feel different.' },
      ] },
      {
        kind: 'text',
        text: 'Outdoor daylight is usually much brighter than ordinary indoor lighting, even when clouds cover the sky. Stepping outside after you wake gives your body a clearer daytime signal. **A short trip counts**: you could stand outside your door, walk to transit, or take a brief walk after breakfast.',
      },
      { kind: 'text', text: 'Try to attach daylight to something you already do each morning. If you leave home for work, walking outside on the way may be enough to start. If you work from home, you might step outside after making breakfast. **A repeatable moment is more useful than a plan that requires a perfect morning**. Sometimes it is still dark when you wake, or your schedule does not allow a morning walk. In that case, go outside when daylight becomes available if you can. Light is one part of sleep timing, so missing a morning is information about your circumstances, **not a reason to give up on your routine**.' },
      { kind: 'choice', prompt: 'You have ten minutes before work and the sky is cloudy. What is a realistic way to get some daylight today?', options: [
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
    step: 'Move your last caffeinated drink earlier for a few days.',
    blocks: [
      {
        kind: 'text',
        text: 'Caffeine is the ingredient in coffee and some other drinks that helps you feel awake. Your body clears it slowly. A drink in the afternoon may still make it **harder to feel sleepy** at bedtime. For example, a coffee at 4 p.m. might make a difficult afternoon easier, but it could also leave you alert when you want to go to bed. The effect is not identical for everyone, so the useful question is whether your own last drink seems connected with the nights when sleep is harder.',
      },
      { kind: 'fact', value: 'Up to 8 hours', caption: 'caffeine effects can last this long' },
      {
        kind: 'text',
        text: 'Some people find that caffeine delays sleep. Others fall asleep but wake more often. **People respond differently**, so notice what happens for you.',
      },
      { kind: 'text', text: 'As the day goes on, your need for sleep usually grows. Caffeine can hide some of that sleepy feeling for a while. **You still need sleep**, even if a drink makes you feel awake. Coffee is not the only source. Tea, energy drinks, and some sodas have caffeine too. Choose a time for your last drink based on **your bedtime and how caffeine affects you**.' },
      { kind: 'choice', prompt: 'You want to learn whether caffeine affects your sleep. What could you try?', options: [
        { label: 'Move the last drink earlier', feedback: 'Changing one thing for several days gives you a clearer comparison with your usual evenings.' },
        { label: 'Change every evening habit', feedback: 'Several changes at once make the result harder to interpret. Start with one cutoff you can observe.' },
      ] },
      { kind: 'sequence', prompt: 'Put a small caffeine experiment in order.', steps: [
        'Notice when you usually have your last caffeinated drink.',
        'Move that drink earlier for several days.',
        'Compare how your evenings feel with your usual pattern.',
      ], feedback: 'Changing one habit and watching it for several days can help you learn what works for your sleep.' },
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
    step: 'Turn the lights down half an hour before bed tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'You cannot switch sleep on like a light. Bright rooms and difficult tasks can keep you alert. **Slowing down before bed** can make the move from daytime to sleep easier. Think about the last hour before you usually go to bed. If you are answering stressful messages, working under bright lights, and then lying down immediately, your mind has had no clear change of pace. A quieter lead-in means giving yourself a little time between daytime demands and trying to sleep.',
      },
      { kind: 'fact', value: '1 hour', caption: 'to make room for quiet time before bed' },
      {
        kind: 'text',
        text: 'Your wind-down does not need a complicated ritual. The practical change is to **make the room a little dimmer and choose a calmer task** than the one you were doing before. Repeating a simple routine can help you recognize that the working part of the day is over.',
      },
      { kind: 'text', text: 'For example, you might wash up, read a few pages, or put away the things you used that day. Choose an activity that does not ask you to solve a difficult problem. **The best choice is one that feels manageable on an ordinary evening**, because that is when you will need it most. Notice what keeps your mind busy close to bed. If a task can wait, write down its next step. If it cannot, finish it and then spend **a few quiet minutes** before lying down.' },
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
    step: 'If you lie awake frustrated, get up briefly and do something quiet.',
    blocks: [
      {
        kind: 'text',
        text: 'Your brain learns what usually happens in a place. If you often work, scroll, or worry in bed, getting into bed may start to feel like a reason to **stay awake**. This does not mean you have done anything wrong by reading or looking at your phone in bed. It means your brain can learn from repeated experiences. If lying there awake and frustrated becomes common, a brief, calm activity somewhere else may help bed feel less like a place where you struggle.',
      },
      {
        kind: 'list',
        items: [
          { term: 'If you feel frustrated', text: 'Leave the bed for a quiet activity in a dim, comfortable place.' },
          { term: 'When you feel sleepy', text: 'Return to bed when you feel ready to drift off, rather than simply exhausted by the day.' },
          { term: 'Clock watching', text: 'Turn the clock away if counting the hours makes you more worried about sleep.' },
        ],
      },
      {
        kind: 'text',
        text: 'In sleep therapy, this is called “stimulus control.” It means using the bed mainly when you feel sleepy, so your brain connects **bed with sleep** again. You do not need to force sleep or watch a timer.',
      },
      { kind: 'text', text: 'Suppose you lie down and start planning tomorrow. You may begin to associate the pillow with solving problems. Moving that planning elsewhere gives the bed **one fewer waking job**. You do not need to watch the minutes. Notice when you feel awake and frustrated. Do something quiet outside bed, then return when **you feel sleepy again**.' },
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
    step: 'Turn your bedside clock away from the bed tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'Many people wake up briefly during the night. If you wake up, it can be easy to think, “Now the whole night is ruined.” **One waking does not tell you how the rest of the night will go.** Suppose you wake at 3 a.m. and see the clock. You might immediately calculate how few hours remain and imagine being unable to work tomorrow. Those thoughts can feel certain in the middle of the night, but you cannot know tomorrow from one waking. First, deal with the fact that you are awake right now.',
      },
      { kind: 'fact', value: '1 waking', caption: 'does not tell the story of the whole night' },
      {
        kind: 'text',
        text: 'Checking the clock can invite calculations about how much sleep remains. Notice the thought **“tomorrow is ruined”** as a prediction, not a fact.',
      },
      { kind: 'text', text: 'Imagine waking and thinking, “I will be useless tomorrow.” That thought can raise the stakes of falling asleep immediately. Ask, **“What do I actually know?”** One waking is all you know. A gentler response is, “I am awake right now; I can rest without solving tomorrow.” If you become frustrated, use a quiet activity until **sleepiness returns**.' },
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
    step: 'Write tomorrow’s to-do list on paper before bed tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'When you lie down, unfinished tasks may pop into your mind. Your brain may keep repeating them so you will not forget. **Writing them down before bed** gives you a place to find them tomorrow. For example, if you remember that you need to call the dentist, you do not have to solve the appointment while lying in bed. Write “call dentist after breakfast” on a page you will see tomorrow. The task has a next step and a time, so you can return to resting when the thought comes back.',
      },
      { kind: 'fact', value: '5 min', caption: 'with a pen, before bed' },
      {
        kind: 'text',
        text: 'Writing tasks down gives them a place outside your head. It does not erase worry, but it may help you stop **rehearsing the list** in bed.',
      },
      { kind: 'text', text: 'Try separating a worry from its next action. “I might forget the appointment” becomes “Put it in the calendar after breakfast.” That turns **a repeating thought into a plan**. You cannot solve every worry tonight. Write one down and choose when you will look at it again. That gives you a plan without using **bedtime to keep planning**.' },
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
    step: 'If you drink, try drinking earlier or skipping the bedtime drink.',
    blocks: [
      {
        kind: 'text',
        text: 'Alcohol can make you feel sleepy when you first go to bed. Later, it can make sleep **lighter and easier to interrupt**. Falling asleep quickly does not always mean you slept well. A drink can feel relaxing in the evening, which is why it may seem like it helps with sleep. Yet feeling sleepy at the start of the night and staying asleep comfortably are different things. If you often wake later after drinking, that pattern is worth noticing without assuming that every difficult night has the same cause.',
      },
      { kind: 'fact', value: '1 change', caption: 'try drinking earlier or skipping a bedtime drink' },
      {
        kind: 'text',
        text: 'That makes alcohol a poor sleep aid, even when falling asleep feels easy. **The whole night matters**, not only the first few minutes.',
      },
      { kind: 'text', text: 'Notice when you drank, when you went to bed, and whether you woke later. One night can have many causes. **Looking at several nights** can show you whether alcohol may be affecting your sleep. If sleep has been difficult, avoiding alcohol close to bedtime is a reasonable trial. The point is to choose based on **the next morning as well as the evening**.' },
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
    step: 'Note your hours slept and how rested you feel each morning.',
    blocks: [
      {
        kind: 'text',
        text: 'Adults do not all need exactly eight hours of sleep. Some need more than others. If you lie awake calculating the hours left, **the number can become another source of worry**. An eight-hour number can look reassuring on a tracker, but it cannot describe everything about your night. You may have spent some of that time awake, and the device may estimate sleep imperfectly. How alert you feel during the day is another clue. Look at several nights and days together before making a judgment.',
      },
      { kind: 'fact', value: '7–9 hrs', caption: 'is the range, not the rule' },
      {
        kind: 'text',
        text: 'Hours alone do not tell you whether sleep is meeting your needs. If you often struggle to stay awake or wake feeling unrested, **pay attention to that** even if your hours look adequate.',
      },
      { kind: 'text', text: 'Adults generally need at least seven hours, but the amount that leaves someone well rested varies. Time in bed also differs from **time actually asleep**. One poor night can happen. If you often feel sleepy despite giving yourself enough time to sleep, it may help to talk with a health professional. **Notice how you feel over several days**.' },
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
    step: 'This weekend, wake within an hour of your weekday time.',
    blocks: [
      {
        kind: 'text',
        text: 'If you wake much later on weekends, your body may not feel sleepy at its usual time on Sunday night. That can make **Monday morning harder**. You still need enough sleep. For example, waking at 7 a.m. on weekdays and noon on Sunday can leave you wide awake at your usual Sunday bedtime. That makes Monday morning feel abrupt. You do not have to keep the exact same time every day, but a smaller change may make the transition back to the week easier.',
      },
      { kind: 'fact', value: 'About 1 hour', caption: 'a useful limit for weekend schedule changes' },
      {
        kind: 'text',
        text: 'Sleeping later may mean you need more sleep. Ask whether you can **allow more time for sleep during the week** while keeping wake times fairly similar.',
      },
      { kind: 'text', text: 'Picture staying up late Friday and Saturday, then asking your body to feel sleepy early Sunday. The mismatch can make Monday feel like **an abrupt schedule change**. A realistic weekend does not require perfect sameness. Pick the smallest adjustment you can keep, and notice whether Sunday night and Monday morning become **easier to manage**.' },
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
    step: 'If you nap today, keep it brief and early.',
    blocks: [
      {
        kind: 'text',
        text: 'A nap can help you feel more awake now. But a long nap or one late in the day may mean you are **less sleepy when bedtime arrives**. Notice what happens on your own nights. A nap can be useful when you are tired, and you do not need to treat it as a mistake. The timing and length matter because a long or late nap may use up some of the sleepiness you normally feel at night. If bedtime has become difficult, you can test whether moving a nap earlier changes anything.',
      },
      { kind: 'fact', value: '20 min', caption: 'a common upper limit for an adult nap' },
      {
        kind: 'text',
        text: 'A longer nap may leave you feeling groggy when you wake and less sleepy at night. **Notice what happens at bedtime** after different naps.',
      },
      { kind: 'text', text: 'A nap affects people differently. If you are short on sleep, a brief nap may help. If you regularly struggle to fall asleep at night, a late nap may mean you are **less sleepy at bedtime**. Ask why you are napping: to stay safe, feel more awake, or simply from habit? If you need long naps often, check whether you are **getting enough time to sleep at night**.' },
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
    step: 'After a bad day, note how you slept the night before.',
    blocks: [
      {
        kind: 'text',
        text: 'After too little sleep, an ordinary delay or message may feel more upsetting. Your patience may be lower because you are tired. **That is useful context** when choosing how to respond. Imagine receiving a brief message that sounds rude after you slept only a few hours. You might feel a stronger urge to reply sharply than you would on a rested day. The message may still be a problem. Knowing that tiredness can increase your reaction gives you a reason to pause before deciding what the sender meant.',
      },
      { kind: 'fact', value: '1 factor', caption: 'too little sleep can make patience harder' },
      {
        kind: 'text',
        text: 'A difficult day can have several causes: poor sleep, stress, and the event itself. **Check what was going on** before deciding that your irritation says something bad about you.',
      },
      { kind: 'text', text: 'Imagine the same delay after a full night and a short one. The delay has not changed, but it may be harder to stay patient when tired. **Tiredness helps explain your feeling**; you are still responsible for what you say. Ask, “What happened? What did I think it meant? How rested am I?” These questions can help you choose **words that fit what actually happened**.' },
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
