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
    title: 'Wake at the same time to sleep better',
    step: 'Pick one wake-up time and keep weekends within an hour of it.',
    blocks: [
      {
        kind: 'text',
        text: 'Want to fall asleep more easily at night? **Start with your alarm clock.** Waking up at the same time every day is one of the simplest ways to sleep better. It costs nothing and takes no extra time.',
      },
      { kind: 'fact', value: '1 hour', caption: 'the most your weekend wake-up should drift from your weekday one' },
      {
        kind: 'text',
        text: 'Your body has a built-in clock. It is the inner timer that makes you feel awake in the day and sleepy at night. **Getting up at the same time sets that clock** every morning, like pressing start on a timer.',
      },
      {
        kind: 'text',
        text: 'Here is how it works. Say you get up at 7 a.m. every day. Your body learns the pattern. Soon you start to **feel sleepy at about the same time each night**, without forcing it. To choose your time, look at when you usually get to bed. Count forward enough hours to sleep well, and set your alarm there. **Pick a time you can keep**, not the earliest one you can think of.',
      },
      { kind: 'choice', prompt: 'You went to bed late on Saturday after seeing friends. Which wake-up plan works best?', options: [
        { label: 'Stay near my usual time, with enough sleep', feedback: 'That’s the one. A wake-up time you can keep steadies your body clock, and you still get the sleep you need.' },
        { label: 'Set the earliest alarm I can', feedback: 'Not quite. An early alarm just cuts your sleep short. The goal is a time you can keep every day that still leaves room for enough sleep.' },
      ] },
      { kind: 'reveal', prompt: 'Tap each part of a wake-up plan that really works.', items: [
        { label: 'Same time most days', detail: 'This is what sets your body clock. Weekdays and weekends stay within about an hour of each other.' },
        { label: 'Enough hours of sleep', detail: 'Count back from your alarm. Your bedtime should leave enough time to wake up rested.' },
      ] },
      {
        kind: 'do',
        text: 'Choose your wake-up time today and set it as a daily alarm. This weekend, **get up within an hour** of it.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: maintain a regular bedtime and wake time, with weekend timing within about an hour. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.light',
    title: 'Morning light helps you sleep at night',
    step: 'Get outside or near a window soon after you wake.',
    blocks: [
      {
        kind: 'text',
        text: 'Here is a free way to sleep better: **get some daylight in the morning.** A few minutes outside after you wake up helps you feel more awake now and sleepier at bedtime.',
      },
      { kind: 'list', items: [
        { term: 'Morning light', text: 'Tells your body clock the day has started, so you wake up properly.' },
        { term: 'Dim evenings', text: 'Tell your body clock the day is ending, so sleepiness can set in.' },
      ] },
      {
        kind: 'text',
        text: 'Your body clock is the inner timer that makes you sleepy at night and alert in the day. **Light is how it tells the time.** Bright morning light is the strongest signal it gets.',
      },
      { kind: 'text', text: 'Outdoor light is much brighter than the lights in your home, even on a cloudy day. So **a short trip outside counts**. Walk to the bus. Drink your coffee on the front step. Stand by an open door for a few minutes. The easiest way to remember is to **tie it to something you already do** every morning. If it is still dark when you wake up, go out as soon as it gets light.' },
      { kind: 'choice', prompt: 'You have ten minutes before work and the sky is cloudy. What is the best move?', options: [
        { label: 'Step outside for a few minutes', feedback: 'Yes. Cloudy daylight is still far brighter than indoor light, so a few minutes outside tells your body clock it is morning.' },
        { label: 'Skip it, the sun is not out', feedback: 'Clouds do not cancel it out. Daylight on a gray day is still much brighter than your lamps, so a short step outside still counts.' },
      ] },
      {
        kind: 'do',
        text: 'Tomorrow, **step outside soon after you wake up**. A few minutes is enough. If you cannot get out, stand by a bright window.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits and Sleep/Wake Cycle: time outdoors and light exposure support circadian timing. https://www.nhlbi.nih.gov/health/sleep/sleep-wake-cycle',
  },
  {
    id: 'sleep.caffeine',
    title: 'Your afternoon coffee is still working at bedtime',
    step: 'Have your last caffeine drink at least eight hours before bed.',
    blocks: [
      {
        kind: 'text',
        text: 'Caffeine is the stuff in coffee, tea, energy drinks and some sodas that makes you feel awake. **It keeps working long after the cup is empty.** That 4 p.m. coffee can still be keeping you up at 11 p.m.',
      },
      { kind: 'fact', value: '8 hours', caption: 'how long caffeine can keep working in your body' },
      {
        kind: 'text',
        text: 'Here is why. As the day goes on, your body builds up a need for sleep. Caffeine **covers up that sleepy feeling**. It does not remove your need for sleep. It just hides it, so you feel wired at bedtime even when you are tired.',
      },
      { kind: 'text', text: 'The fix is simple: **move your last caffeine drink earlier.** Count back eight hours from your bedtime. If you go to bed at 11 p.m., have your last coffee by 3 p.m. Tea, cola and energy drinks count too. Try it for a few days and **notice the difference at bedtime**.' },
      { kind: 'choice', prompt: 'You want to find out if caffeine is hurting your sleep. What should you try?', options: [
        { label: 'Move my last drink earlier for a few days', feedback: 'Exactly. Change one thing and keep it steady for a few days. Then you can clearly see what it does for your nights.' },
        { label: 'Change all my evening habits at once', feedback: 'That is a lot to juggle, and you will not know which change helped. Start with just the caffeine and see what happens.' },
      ] },
      { kind: 'sequence', prompt: 'Put the steps of your caffeine test in order.', steps: [
        'Notice what time you usually have your last caffeine drink.',
        'Move that drink to at least eight hours before bed.',
        'After a few days, notice how your bedtimes feel.',
      ], feedback: 'That is the whole test. One small change, kept for a few days, shows you exactly what caffeine is doing to your nights.' },
      {
        kind: 'do',
        text: 'Starting today, **have your last caffeine drink eight hours before bed**. Keep it up for a few days and see how your nights go.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: caffeine can interfere with sleep and effects may last up to eight hours. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.wind',
    title: 'A calm last hour makes sleep come easier',
    step: 'Dim the lights half an hour before bed tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'You cannot switch sleep on like a light. But you can **set yourself up to fall asleep more easily**. The trick is a calm last hour before bed, so your body knows the day is done.',
      },
      { kind: 'fact', value: '1 hour', caption: 'of quiet, dim time before bed' },
      {
        kind: 'text',
        text: 'Picture this. You answer stressful work emails under bright lights, then jump straight into bed. Your mind is still racing. **Your body never got the message** that the day was over. A wind-down is a short, calm stretch of time between your busy day and sleep.',
      },
      { kind: 'text', text: 'Here is how to do it. **Turn the lights down low.** Then pick something easy and calm: wash up, read a few pages or tidy for a minute. If a task is nagging you, write down its next step for tomorrow. You can also try Muscle Release. It is a Reset: a short guided practice in this app, a few minutes long, that helps you calm down. Lying in bed, you **tense one part of your body, then let it go**, working up from your feet.' },
      { kind: 'choice', prompt: 'You only have fifteen minutes before bed. What helps you slow down?', options: [
        { label: 'Dim the lights and do something calm', feedback: 'Perfect. Even fifteen calm minutes tells your body the day is over. A wind-down does not need a full hour to help.' },
        { label: 'Finish one hard work task', feedback: 'That keeps your mind busy right up to bedtime. If it can wait, write down the next step and spend those minutes winding down instead.' },
      ] },
      {
        kind: 'do',
        text: 'Tonight, **dim the lights half an hour before bed** and pick one calm thing to do until you lie down.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: use the hour before bed for quiet time and avoid bright artificial light. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.bed',
    title: 'Teach your brain that bed means sleep',
    step: 'If you lie awake frustrated, get up and do something calm.',
    blocks: [
      {
        kind: 'text',
        text: 'Ever feel tired on the couch, then wide awake the moment your head hits the pillow? **You can teach your brain to switch off in bed.** Sleep therapists use this simple trick all the time.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Awake and frustrated', text: 'Get up and do something calm in a dim room, like reading.' },
          { term: 'Feeling sleepy again', text: 'Go back to bed. Sleepy means your eyes feel heavy, not just tired from the day.' },
          { term: 'Clock watching', text: 'Turn the clock away. Counting the hours only adds pressure.' },
        ],
      },
      {
        kind: 'text',
        text: 'Your brain learns from what happens in each place. If you often scroll, work or worry in bed, **your brain starts to link bed with being awake**. That is why you can feel sleepy on the couch but alert in bed.',
      },
      { kind: 'text', text: 'The fix: **use your bed mainly for sleep**. Say you lie down and start planning tomorrow, and soon you are annoyed and wide awake. Get up. Sit somewhere dim and do something calm. Go back when you feel sleepy. Keep doing this and **bed starts to feel sleepy again**.' },
      { kind: 'choice', prompt: 'You have been lying awake for a while and you are getting frustrated. What should you do?', options: [
        { label: 'Get up and do something calm', feedback: 'Yes. Leaving bed for a bit stops your brain linking bed with frustration. Come back when your eyes feel heavy.' },
        { label: 'Watch the clock and keep trying', feedback: 'Clock watching adds pressure and keeps you alert. Get up for a few calm minutes instead, then return when you feel sleepy.' },
      ] },
      {
        kind: 'do',
        text: 'Tonight, if you lie awake and get frustrated, **get up and do something calm**. Go back to bed when you feel sleepy.',
      },
    ],
    source: 'NHLBI Insomnia Treatment: CBT-I includes stimulus control to reconnect the bed with sleep. https://www.nhlbi.nih.gov/health/insomnia/treatment',
  },
  {
    id: 'sleep.threeam',
    title: 'Waking at 3 a.m. does not ruin tomorrow',
    step: 'Turn your bedside clock away from the bed tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'Waking up in the night is normal. Lots of people do it. Knowing that takes the panic out, so **you can rest instead of spiraling**. Here is what to do when it happens.',
      },
      { kind: 'fact', value: '1 waking', caption: 'does not decide how the night or the next day will go' },
      {
        kind: 'text',
        text: 'Here is what usually happens. You wake up and check the clock. Then you do the math: only four hours left. **Then comes the thought, “Tomorrow is ruined.”** That thought feels true at night, but it is a guess, not a fact.',
      },
      { kind: 'text', text: 'Try this instead. **Turn the clock away** so you are not doing math in the dark. Tell yourself, “I am awake right now. I can rest.” Then try 5-4-3-2-1. It is a Reset: a short guided practice in this app, a few minutes long, that helps you calm down. Name 5 things you see, 4 you hear, 3 you can touch, 2 you smell and 1 you taste. It **pulls your mind out of tomorrow** and back into the room.' },
      { kind: 'choice', prompt: 'It is 3 a.m. and you think, “Tomorrow is ruined.” What is the better reply?', options: [
        { label: 'I am awake now, and I can rest', feedback: 'That’s it. It sticks to what you actually know right now. Taking the pressure off makes it easier to drift back to sleep.' },
        { label: 'I must fall asleep right now', feedback: 'That adds pressure, and pressure keeps you awake. Stick to what you know: you are awake now, and you can rest.' },
      ] },
      {
        kind: 'do',
        text: 'Tonight, **turn your clock away from the bed**. If you wake up, try 5-4-3-2-1 and remind yourself that one waking does not ruin tomorrow.',
      },
    ],
    source: 'NHLBI Insomnia Treatment: CBT-I addresses unhelpful sleep thoughts and habits that keep someone awake. https://www.nhlbi.nih.gov/health/insomnia/treatment',
  },
  {
    id: 'sleep.worry',
    title: 'Write tomorrow’s to-do list before bed',
    step: 'Write tomorrow’s to-do list on paper before bed tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'Lying in bed going over tomorrow’s to-do list? **Five minutes with a pen can quiet that list.** Writing it down gets it out of your head, so your mind can stop repeating it.',
      },
      { kind: 'fact', value: '5 min', caption: 'with a pen and paper, before you get into bed' },
      {
        kind: 'text',
        text: 'Your brain repeats unfinished tasks so you will not forget them. That is helpful at noon, but not at midnight. **Once a task is on paper, your brain can let go of it**, because it knows where to find it tomorrow.',
      },
      { kind: 'text', text: 'Here is how. Before bed, write down every task on your mind. Then **give each one a next step and a time**. “I need to call the dentist” becomes “Call the dentist after breakfast.” If a task pops up again in bed, tell yourself, **“It is on the list.”** Then go back to resting.' },
      { kind: 'choice', prompt: 'A task pops back into your head after you lie down. What should you tell yourself?', options: [
        { label: 'It is written down for tomorrow', feedback: 'Right. You already have a plan for it. Reminding yourself of that lets your mind settle again, even if the thought comes back.' },
        { label: 'I have to stop thinking about it', feedback: 'Fighting a thought tends to keep it going. Instead, remind yourself it is on your list, and gently go back to resting.' },
      ] },
      {
        kind: 'do',
        text: 'Tonight, before you get into bed, **write tomorrow’s to-do list** on paper. Messy is fine. Then turn off the light, knowing it is all handled.',
      },
    ],
    source: 'NHLBI Insomnia Treatment: CBT-I addresses sleep-related thoughts; writing a plan is a self-guided way to move planning outside bedtime. https://www.nhlbi.nih.gov/health/insomnia/treatment',
  },
  {
    id: 'sleep.alcohol',
    title: 'Alcohol before bed breaks up your sleep',
    step: 'If you drink, have it earlier or skip the bedtime drink.',
    blocks: [
      {
        kind: 'text',
        text: 'A drink before bed can make you feel sleepy fast. But **alcohol makes your sleep lighter later in the night**, so you wake up more. Skipping the bedtime drink is an easy way to sleep through more of the night.',
      },
      { kind: 'fact', value: '1 change', caption: 'drink earlier in the evening, or skip the drink before bed' },
      {
        kind: 'text',
        text: 'Here is why. Alcohol feels relaxing at first. Then, as your body clears it, **your sleep gets lighter and choppier**. Falling asleep fast is only the start of the night. What counts is how well you stay asleep.',
      },
      { kind: 'text', text: 'Picture two nights. On one, you have a glass of wine right before bed and wake up at 3 a.m. On the other, you skip it. To see the difference for yourself, **look at a few nights, not just one**. Notice when you drank, when you went to bed and **how you felt the next morning**.' },
      { kind: 'choice', prompt: 'You want to see how a bedtime drink affects your sleep. What gives you the clearest answer?', options: [
        { label: 'Compare a few similar nights', feedback: 'Exactly. Looking at a few nights, with and without the drink, shows you the real pattern. One night alone can fool you.' },
        { label: 'Decide from one rough night', feedback: 'One bad night can happen for lots of reasons. Compare a few nights with and without the drink to see what is really going on.' },
      ] },
      {
        kind: 'do',
        text: 'If you drink, try **having it earlier or skipping the bedtime drink** this week. Notice how you sleep and how you feel the next morning.',
      },
    ],
    source: 'NHLBI Insomnia Treatment: alcohol can make sleep lighter and increase night waking. https://www.nhlbi.nih.gov/health/insomnia/treatment',
  },
  {
    id: 'sleep.hours',
    title: 'Eight hours is not a magic number',
    step: 'Each morning, note your hours slept and how rested you feel.',
    blocks: [
      {
        kind: 'text',
        text: 'Stressing about getting exactly eight hours? **You can let that number go.** Adults need different amounts of sleep. The best sign of a good night is simple: you wake up rested and stay alert through the day.',
      },
      { kind: 'fact', value: '7+ hours', caption: 'what most adults need each night' },
      {
        kind: 'text',
        text: 'Worrying about the number can backfire. If you lie awake doing math on the hours left, **the number becomes one more thing keeping you up**. And time in bed is not the same as time asleep.',
      },
      { kind: 'text', text: 'So **check two things each morning**: about how many hours you slept, and how rested you feel. Say your tracker shows eight hours, but you still drag through the day. That is worth noticing. If you feel sleepy most days even with plenty of time in bed, **talk to a doctor**.' },
      { kind: 'choice', prompt: 'Your tracker says you slept eight hours, but you often wake up tired. What should you do?', options: [
        { label: 'Look at the pattern over several days', feedback: 'Yes. Hours are only part of the story. If you keep waking up tired, that pattern matters and is worth paying attention to.' },
        { label: 'Trust the number, my sleep is fine', feedback: 'The number is only one clue. How you feel during the day counts too. Waking up tired again and again is worth paying attention to.' },
      ] },
      {
        kind: 'do',
        text: 'Each morning this week, jot down **your hours and how rested you feel**. Then look for the pattern across the week. It tells you far more than any single number.',
      },
    ],
    source: 'CDC About Sleep: adult duration recommendations and sleep quality include feeling refreshed and functioning during the day. https://www.cdc.gov/sleep/about/',
  },
  {
    id: 'sleep.weekend',
    title: 'A big weekend lie-in makes Monday harder',
    step: 'This weekend, wake within an hour of your weekday time.',
    blocks: [
      {
        kind: 'text',
        text: 'Dreading Monday mornings? **Your weekend wake-up time is an easy fix.** Keeping it close to your weekday time makes Sunday night and Monday morning feel so much smoother.',
      },
      { kind: 'fact', value: 'About 1 hour', caption: 'the limit for sleeping in on weekends' },
      {
        kind: 'text',
        text: 'Here is why. Say you get up at 7 a.m. on weekdays and noon on Sunday. **Your body clock shifts later.** So on Sunday night you lie there wide awake, and the Monday alarm feels brutal. It is like flying to a new time zone every weekend.',
      },
      { kind: 'text', text: 'You still need enough sleep. If you crave a big lie-in, that is a sign you need **more sleep during the week**. Try going to bed a bit earlier on weeknights instead. Then on the weekend, **sleep in by an hour at most**. For example, if Friday wiped you out, get into bed an hour early that night. Then get up at your normal time on Saturday.' },
      { kind: 'choice', prompt: 'You want a lie-in after a tiring week. Which plan works best?', options: [
        { label: 'Get enough sleep and wake at a similar time', feedback: 'Spot on. Going to bed a bit earlier gets you the extra sleep, and a similar wake-up time keeps Monday easy.' },
        { label: 'Ignore how tired I am', feedback: 'Your tiredness is real and worth listening to. Get more sleep by going to bed earlier, not by cutting it short.' },
      ] },
      {
        kind: 'do',
        text: 'This weekend, **wake up within an hour of your weekday time**. If you are tired, go to bed earlier the night before.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: limit weekend schedule differences to about one hour to support the sleep-wake rhythm. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.nap',
    title: 'Keep naps short and early in the day',
    step: 'If you nap today, keep it under twenty minutes and early.',
    blocks: [
      {
        kind: 'text',
        text: 'A nap can be a great energy boost. **The trick is keeping it short and early.** Done right, you get the boost now and still feel sleepy when bedtime comes.',
      },
      { kind: 'fact', value: '20 min', caption: 'a good limit for an adult nap' },
      {
        kind: 'text',
        text: 'Here is why. All day, your body builds up a need for sleep. That need is what makes you drowsy at bedtime. **A long or late nap uses some of it up.** So when bedtime comes, you are not sleepy enough to drift off.',
      },
      { kind: 'text', text: 'Say you nap for an hour at 5 p.m. You feel great at dinner, then lie awake at 11. Instead, **set a timer for twenty minutes** and nap earlier, like after lunch. You get the energy boost without the sleepless night. If you need long naps often, that is a sign to **make more time for sleep at night**.' },
      { kind: 'choice', prompt: 'A late nap helps today, but now bedtime is harder. What could you try next?', options: [
        { label: 'A short nap, earlier in the day', feedback: 'Yes. A short, early nap gives you a boost now and leaves you sleepy enough at bedtime.' },
        { label: 'Keep the same late nap', feedback: 'That will likely keep bedtime hard. Try a short nap earlier instead. And if sleepiness ever feels unsafe, like while driving, rest first.' },
      ] },
      {
        kind: 'do',
        text: 'If you nap today, **keep it to twenty minutes and take it early**. Set a timer so you do not oversleep.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: adults can limit naps to twenty minutes and take them earlier if nighttime sleep is difficult. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.debt',
    title: 'Short sleep shortens your fuse',
    step: 'After a bad day, check how you slept the night before.',
    blocks: [
      {
        kind: 'text',
        text: 'Snapped at someone over something small? **Last night’s sleep is often part of the story.** Studies show that even one short night makes people quicker to feel annoyed the next day.',
      },
      { kind: 'fact', value: '1 night', caption: 'of short sleep is enough to shrink your patience' },
      {
        kind: 'text',
        text: 'Picture the same slow coworker on two different days. After a good night, you shrug it off. After four hours of sleep, you want to snap. **The coworker did not change; your patience did.** That is not a flaw in you. It is what a tired brain does. Knowing this helps you pause before you react.',
      },
      { kind: 'text', text: 'Being tired explains the feeling. **You still choose what you say.** So when something annoys you after a short night, ask three quick questions. What happened? What did I think it meant? How well did I sleep? Then **pick words that fit what really happened**.' },
      { kind: 'choice', prompt: 'After a short night, an annoying message arrives. What should you do?', options: [
        { label: 'Pause before replying', feedback: 'Good call. A pause lets you see the message clearly and notice that tiredness is turning up the volume. Then you can reply in a way you will not regret.' },
        { label: 'Send the first angry reply', feedback: 'The feeling makes sense, but tiredness shrinks your patience. A short pause can save you from a fight you did not need.' },
      ] },
      {
        kind: 'do',
        text: 'This week, when a day goes badly, **check how you slept the night before**. Look for the pattern.',
      },
    ],
    source: 'Sleep restriction studies show next-day increases in irritability and emotional reactivity after a single short night.',
  },
  {
    id: 'sleep.room',
    title: 'Make your room comfortable for sleep',
    step: 'Change one source of light, heat, or noise in your bedroom tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'Before bed, **check the room where you sleep**. Is light reaching your face? Are you too warm under the covers? Is a sound keeping your attention? These are things you can look at without guessing what is wrong with your sleep. Start with the part that bothers you most.',
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Light',
            text: 'Close the curtains or turn off a lamp you do not need. Keep a safe way to see if you need to get up.',
          },
          {
            term: 'Heat',
            text: 'Use lighter covers if you feel hot. The room should feel comfortably cool, not cold enough to make you shiver.',
          },
          {
            term: 'Sound',
            text: 'Turn off a television or other sound you control. You may not be able to stop noise outside.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'A bedroom does not need to be perfect. **Use what you already have**. You can move a lamp, close a door, or change your blanket. If you share a room, ask before changing something the other person uses. Pick a change that works for both of you.',
      },
      {
        kind: 'choice',
        prompt: 'Your room feels too warm, but you cannot change the heating. What could you try?',
        options: [
          {
            label: 'Use a lighter blanket',
            feedback: 'That changes something you control. Check whether you feel more comfortable under it.',
          },
          {
            label: 'Open the window',
            feedback: 'That may help if it is safe and the air outside is cooler. Check the noise and temperature before leaving it open.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Once you are in bed, **notice whether the change feels comfortable**. A darker room will not help if you cannot safely find the bathroom. Lighter covers will not help if you feel cold. Adjust the change to your needs rather than trying to meet a perfect room temperature.',
      },
      {
        kind: 'do',
        text: 'Tonight, **change one source of light, heat, or noise** in your bedroom. Use a change that keeps the room safe and comfortable.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: quiet, cool, dark bedrooms, quiet time before bed, and meal guidance. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.noise',
    title: 'Reduce sounds you can control tonight',
    step: 'Turn off or lower one sound you control before bed tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'Some sounds are easy to stop. Others are not. **Start with a sound you control**. A television in the next room, a phone that keeps making sounds, or music playing near the bed may be worth changing. You do not need to make the whole house silent.',
      },
      {
        kind: 'text',
        text: 'Listen from the place where you sleep. **Find the sound you notice most**. A sound that seems quiet from the kitchen may be clear from your pillow. Decide whether you can turn it off, lower it, or move its source farther away. Do this before lying down for the night.',
      },
      {
        kind: 'choice',
        prompt: 'You need your phone alarm, but messages keep making sounds. What could you change?',
        options: [
          {
            label: 'Silence messages and keep the alarm',
            feedback: 'Check your phone settings so the alarm still works. You can also allow calls from someone who may need you.',
          },
          {
            label: 'Turn off the whole phone',
            feedback: 'This stops messages, but it may also stop your alarm. Check how your phone works before choosing this.',
          },
        ],
      },
      {
        kind: 'reveal',
        prompt: 'Which sounds can you change?',
        items: [
          {
            label: 'Your television',
            detail: 'Turn it off when you are ready for bed. If someone else is watching, ask about lowering the volume.',
          },
          {
            label: 'Traffic outside',
            detail: 'You cannot turn off the traffic. Closing a window may reduce the sound if the room stays comfortable.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'If you share your home, **talk about the sound before bedtime**. Ask for a lower volume rather than waiting until you are tired and upset. Keep sounds you need for safety, such as a smoke alarm. The aim is to remove an avoidable disturbance, not every sound around you.',
      },
      {
        kind: 'do',
        text: 'Before bed tonight, **turn off or lower one sound you control**. Keep the alarms and calls you need for safety.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: quiet, cool, dark bedrooms, quiet time before bed, and meal guidance. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.screen',
    title: 'Put busy phone tasks before bedtime',
    step: 'Choose when to stop phone games, videos, or work before bed.',
    blocks: [
      {
        kind: 'text',
        text: 'A phone can keep you busy after you meant to go to bed. A video ends and another starts. A work message leads to more work. **Choose when to stop these activities** before you start them tonight. This gives you time to get ready for bed without another task.',
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Work messages',
            text: 'If a reply can wait until morning, leave it until then. Finish necessary work before your quiet time.',
          },
          {
            term: 'Videos and games',
            text: 'Choose a time to close the app. You do not have to finish every video or level tonight.',
          },
          {
            term: 'Things you need',
            text: 'Set your alarm or check an important message, then put the phone down again.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Bright screens can also get in the way of preparing for sleep. **Lower the brightness if you need the phone**. A dim screen does not make an exciting game or a difficult conversation calm. Think about both the light and what you are doing on the screen.',
      },
      {
        kind: 'choice',
        prompt: 'You use your phone as an alarm. Where could it go after you set it?',
        options: [
          {
            label: 'On a nearby table',
            feedback: 'That keeps the alarm available while you stop holding the phone. Choose somewhere you can reach safely if you need it.',
          },
          {
            label: 'Across the room',
            feedback: 'That may make browsing less convenient. Use this only if you can hear the alarm and get to the phone safely.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Pick a quiet activity for the time after you stop. **Read a few pages or get ready for bed**. Choose something you can finish without opening another app. If you must use your phone for care or urgent work, keep that use focused on the task you need to do.',
      },
      {
        kind: 'do',
        text: 'Tonight, **choose a stopping time for phone games, videos, or work** before bed. Set your alarm, then put the phone down.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: quiet, cool, dark bedrooms, quiet time before bed, and meal guidance. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.meal',
    title: 'Leave large meals earlier in the evening',
    step: 'Eat large meals earlier and have a snack if hungry before bed.',
    blocks: [
      {
        kind: 'text',
        text: 'Eating a large meal just before bed can make the evening less comfortable. **Try leaving a few hours between a large meal and bedtime** when your schedule allows. This is about when you eat before sleep. It does not mean you need to eat less food through the day.',
      },
      {
        kind: 'text',
        text: 'If you are hungry near bedtime, **a light snack is okay**. You do not need to lie awake hungry to follow a sleep rule. Choose food you enjoy and can eat comfortably. A small bowl of cereal or a piece of toast could be an option if those foods suit you.',
      },
      {
        kind: 'reveal',
        prompt: 'Look at these two evenings.',
        items: [
          {
            label: 'Dinner can be earlier',
            detail: 'If you usually eat a large meal right before bed, try having that meal earlier. Leave enough time to eat without rushing.',
          },
          {
            label: 'You are hungry later',
            detail: 'Have a light snack if you want one. Hunger later in the evening does not mean you did something wrong at dinner.',
          },
        ],
      },
      {
        kind: 'choice',
        prompt: 'You ate dinner earlier and now feel hungry before bed. What fits this advice?',
        options: [
          {
            label: 'Have a light snack',
            feedback: 'That is okay. Pick a food that suits you rather than treating hunger as something you must ignore.',
          },
          {
            label: 'Have another large meal',
            feedback: 'A large meal close to bed may feel uncomfortable. A smaller snack may meet your hunger more comfortably at this time.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Work and family schedules may make late meals necessary. **Work with the time you have**. You could prepare dinner earlier so it is ready when you get home. You could also choose a meal that feels comfortable before sleep. Keep any food advice from your own clinician in mind.',
      },
      {
        kind: 'do',
        text: 'For tonight, **plan a large meal earlier if possible**, or **choose a light snack if hungry** near bedtime.',
      },
    ],
    source: 'NHLBI Healthy Sleep Habits: quiet, cool, dark bedrooms, quiet time before bed, and meal guidance. https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',
  },
  {
    id: 'sleep.clock',
    title: 'Keep the time out of view',
    step: 'Set your alarm and turn the clock face away before bed tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'When you wake at night, looking at the time can start a lot of thinking. You may count the hours until morning or check how long you have been awake. **You can leave the time out of view**. You will still know when to get up if your alarm is set.',
      },
      {
        kind: 'text',
        text: 'First, **check your alarm before bed**. Make sure it is set for the right time and will make a sound you can hear. Then turn the clock face away or place your phone with its screen facing down. Choose a place where you can reach it safely if needed.',
      },
      {
        kind: 'choice',
        prompt: 'You want to hide the time but still wake for work. What should you check first?',
        options: [
          {
            label: 'The alarm time and sound',
            feedback: 'Check both before turning the display away. This lets you leave the time alone while keeping your morning alarm.',
          },
          {
            label: 'How many hours are left',
            feedback: 'You do not need that calculation to set the alarm. Repeatedly counting the hours may give you more to worry about.',
          },
        ],
      },
      {
        kind: 'sequence',
        prompt: 'Put the bedtime steps in order.',
        steps: [
          'Set the alarm for the time you need to get up.',
          'Check that the alarm sound is on.',
          'Turn the clock face away or place the phone screen down.',
        ],
        feedback: 'The alarm handles the waking time. The display does not need to stay in view all night.',
      },
      {
        kind: 'text',
        text: 'This change **does not promise that you will fall asleep**. It simply removes one reason to keep checking. If you need the time for medicine or caring for someone, check it for that reason. Then put the display out of view again rather than watching each minute pass.',
      },
      {
        kind: 'do',
        text: 'Tonight, **set your alarm and turn the clock face away**. If you use a phone, place its screen down after checking the alarm.',
      },
    ],
    source: 'Practical application of NHLBI Insomnia Treatment guidance on sleep-related worry; hiding a clock is an author example, not a guaranteed sleep treatment. https://www.nhlbi.nih.gov/health/insomnia/treatment',
  },
] as const satisfies readonly LessonDefinition[];
