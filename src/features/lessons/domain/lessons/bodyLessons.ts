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
    title: 'A foggy morning doesn’t decide your day',
    step: 'Get up, find some light, and judge the day later.',
    blocks: [
      {
        kind: 'text',
        text: 'You may wake up feeling heavy or confused even before anything has happened. That can make the whole day look difficult, but **morning fog often fades as you wake up**. Giving it time helps you judge the day once you feel clearer.',
      },
      { kind: 'fact', value: '15–30 min', caption: 'how long morning fog usually lasts' },
      {
        kind: 'text',
        text: 'This fog has a name: **sleep inertia**. It means your brain is still switching from asleep to awake. So when your alarm goes off and you think “Today will be awful,” that’s **your half-asleep brain guessing**.',
      },
      {
        kind: 'choice',
        prompt: 'You wake up foggy and think, “Today is already ruined.” What else could be true?',
        options: [
          { label: 'I’m still waking up', feedback: 'Yes. Sleep inertia makes the first part of the morning feel harder than the day really is. Check again in half an hour.' },
          { label: 'This proves I slept badly', feedback: 'Morning fog shows up even after a normal night’s sleep. So it doesn’t prove anything yet. Give yourself time before you decide.' },
        ],
      },
      { kind: 'reveal', prompt: 'Tap each part of that morning thought to check it.', items: [
        { label: 'What I notice', detail: 'I feel foggy right after waking up. That’s a real feeling, and it passes.' },
        { label: 'What I predict', detail: '“Today is ruined” is a guess about hours that haven’t happened yet. Guesses made half-asleep aren’t worth trusting.' },
      ] },
      { kind: 'text', text: 'While you are still waking up, **follow a familiar routine** rather than deciding how the whole day will go. You could sit up, drink some water, and find daylight, then get dressed or eat if that is usual for you. These ordinary steps give the fog time to lift.' },
      { kind: 'text', text: 'Then check in again once you’ve been up for a while. You’ll usually feel much clearer. If heavy fog shows up every single morning, **look at how much sleep you’re getting**. That’s worth fixing.' },
      {
        kind: 'do',
        text: 'As you wake up, **give the fog time to lift** by getting up and finding some light. You can **check in again** once you feel more awake.',
      },
    ],
    source: 'Sleep inertia: measurable performance and mood decrement for 15–30 min after waking from normal sleep.',
  },
  {
    id: 'body.movement',
    title: 'A short walk lifts a low mood',
    step: 'Take an easy ten-minute walk and notice how you feel after.',
    blocks: [
      {
        kind: 'text',
        text: 'When you feel low or stuck, doing something active may seem like a lot to ask. You can start with **a short, easy walk** rather than a workout. Gentle movement may help your mood, and you can notice for yourself how you feel afterward.',
      },
      { kind: 'fact', value: '10 min', caption: 'of easy walking is a great place to start' },
      {
        kind: 'text',
        text: 'When you feel low, a full workout sounds impossible. And waiting to feel motivated can keep you on the couch all day. Choosing **a short walk as your first step** makes the task more manageable. You could walk down the hall, around the block, or to the corner shop.',
      },
      {
        kind: 'text',
        text: 'Walking outside also gives you **daylight and something new to look at**. If going outside isn’t possible, a walk around your home or office still counts.',
      },
      { kind: 'text', text: 'If starting feels hard, make the first step tiny. **Just put your shoes on**, or step outside the door. That gives you **one manageable place to begin**, and you can decide how far to go once you are moving.' },
      {
        kind: 'choice',
        prompt: 'You feel too low to face a workout. What’s a smaller step?',
        options: [
          { label: 'Walk to the end of the street', feedback: 'A short, easy route makes starting more manageable when your mood is low. You can compare how you feel before leaving and after returning, without expecting a particular change.' },
          { label: 'Wait until I feel motivated', feedback: 'Motivation often shows up after you start, not before. Put your shoes on and take the first step.' },
        ],
      },
      { kind: 'sequence', prompt: 'Put a short mood walk in the right order.', steps: [
        'Notice how you feel before you start.',
        'Walk an easy route that fits your body and your day.',
        'Notice how you feel when you get back.',
      ], feedback: 'Checking before and after lets you see the lift for yourself. Seeing it makes the next walk easier to start.' },
      {
        kind: 'do',
        text: 'Today, **take an easy ten-minute walk**. Notice how you feel **before and after**.',
      },
    ],
    source: 'Acute mood effects of brief moderate activity are among the most replicated findings in the area.',
  },
  {
    id: 'body.dip',
    title: 'Afternoon slumps are built into your body',
    step: 'Notice when your energy dips and plan an easier task there.',
    blocks: [
      {
        kind: 'text',
        text: 'If your brain seems to slow down in the early afternoon, you may be noticing **a normal dip in alertness**. Recognizing when it tends to happen gives you a way to plan around it, instead of expecting every hour to feel the same.',
      },
      { kind: 'fact', value: '1 dip', caption: 'your body clock builds into the early afternoon' },
      {
        kind: 'text',
        text: 'Your body runs on **a daily clock** that decides when you feel sleepy and when you feel alert. In the early afternoon, that clock dips. **It happens even if you skip lunch**, so it isn’t just about food.',
      },
      {
        kind: 'text',
        text: 'Because this dip can be fairly predictable, if you lose focus at about the same time each day, **put easier tasks there**, like answering simple messages. Save hard thinking for when you’re sharp. Skip late coffee, because it can **keep you up tonight**.',
      },
      { kind: 'text', text: 'If a hard task has to stay at that time, you can **begin with its first small step**. A short walk or a few minutes of daylight can help you **come back with a clearer head**.' },
      {
        kind: 'choice',
        prompt: 'You lose focus around 2 p.m. most days. What could you try?',
        options: [
          { label: 'Move one easier task to 2 p.m.', feedback: 'Moving an easier task to that time lets you work with the pattern you have noticed. Then you can save more demanding work for a time when you tend to feel alert.' },
          { label: 'Decide the whole day is wasted', feedback: 'The slump is one part of the day, not the whole day. It passes, and you can plan around it.' },
        ],
      },
      {
        kind: 'do',
        text: 'Notice **when your energy dips** today. Tomorrow, **put one easier task there**.',
      },
    ],
    source: 'Post-lunch dip is a circadian trough, present in the absence of a meal.',
  },
  {
    id: 'body.walk',
    title: 'A walk after meals steadies your blood sugar',
    step: 'Take an easy ten-minute walk after a meal today.',
    blocks: [
      {
        kind: 'text',
        text: 'After a meal, your body begins using the energy from your food. Taking **a short walk after you eat** can help it handle the rise in blood sugar. An easy pace is enough to try this, without needing gym clothes or a special route.',
      },
      { kind: 'fact', value: '10 min', caption: 'of easy walking after a meal' },
      {
        kind: 'text',
        text: 'When you eat, sugar from your food goes into your blood. If you sit still, it rises higher. **Walking puts your muscles to work**, and working muscles **use up that sugar** for energy. That keeps the rise smaller.',
      },
      { kind: 'text', text: 'It doesn’t need to be fast or far. After lunch, instead of sitting right back down, **walk a loop around the building**. It’s small enough to do every day, and **doing it every day** is what makes it a habit.' },
      { kind: 'text', text: 'If a walk right after a meal does not fit your day, **look for another comfortable chance to move**. Pace while you take a phone call, or walk over to talk to someone instead of sending a message. **Pick what fits your body** and your day.' },
      {
        kind: 'choice',
        prompt: 'After lunch, you feel like sitting right back down. Which choice fits this lesson?',
        options: [
          { label: 'Take an easy ten-minute walk', feedback: 'Yes. Gentle walking puts your muscles to work on the sugar from your meal. An easy pace is all you need.' },
          { label: 'Do a hard workout instead', feedback: 'No need to push that hard. An easy walk does the job here, and it’s much easier to repeat every day.' },
        ],
      },
      {
        kind: 'do',
        text: 'After a meal today, **take an easy ten-minute walk**. Then **make it your after-lunch habit**.',
      },
    ],
    source: 'Post-prandial light walking reduces glucose excursion relative to remaining seated.',
  },
  {
    id: 'body.sitting',
    title: 'Stand up often when you sit for hours',
    step: 'Set one reminder to stand up and walk during long sitting.',
    blocks: [
      {
        kind: 'text',
        text: 'Sitting for hours is easy to do and hard to notice. It can help to **break up your sitting with brief movement**. Standing up and moving, even for a minute, gives your body a break from staying still.',
      },
      { kind: 'fact', value: '1 break', caption: 'is the place to start' },
      {
        kind: 'text',
        text: 'One useful place to start is **how often you interrupt a long stretch of sitting**. A brief stand or walk gives you a change of position before hours pass. You can use the end of a task as your reminder, so the break fits naturally into your day.',
      },
      { kind: 'text', text: 'Picture a workday where one task runs into the next. Suddenly it’s been three hours. Tie your break to **a natural pause**: stand when a call ends, or walk to refill your water. That way, **a short break becomes part of the workday** instead of another task to remember.' },
      { kind: 'text', text: 'If meetings leave you little room to move, start with **the first gap you control**. One break you actually take is better than five reminders you swipe away.' },
      {
        kind: 'choice',
        prompt: 'You keep forgetting to move during long work sessions. What could help?',
        options: [
          { label: 'Stand up between two tasks', feedback: 'The end of a task gives you a familiar moment to stand or walk briefly. Using that pause as a reminder can make movement easier to remember during a busy day.' },
          { label: 'Wait for a free afternoon', feedback: 'A free afternoon may never come. A one-minute stand fits between tasks, even on your busiest day.' },
        ],
      },
      {
        kind: 'do',
        text: 'Set one reminder in your longest stretch of sitting today. When it goes off, **stand up and walk** to the end of the room.',
      },
    ],
    source: 'Sedentary physiology: breaking up prolonged sitting matters more than total sitting time or posture.',
  },
  {
    id: 'body.strength',
    title: 'Make your muscles work twice a week',
    step: 'Choose two days this week for a short strength session.',
    blocks: [
      {
        kind: 'text',
        text: 'Strength work means asking your muscles to push, pull, or lift against some resistance. The World Health Organization recommends doing it on **at least two days a week**. You can begin with simple movements at home, so **a gym is optional**.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Two days', text: 'Aim for at least two days a week of strength work.' },
          { term: 'Big muscles', text: 'Over time, work your legs, hips, back, belly, chest, shoulders and arms.' },
          { term: 'Simple moves', text: 'Use your own body weight, a stretchy resistance band, or something heavy from around the house.' },
        ],
      },
      {
        kind: 'text',
        text: 'Strength work just means **making your muscles push, pull or lift** against something. That something can be your own body. Standing up from a chair and sitting back down counts. So does pushing yourself off a wall.',
      },
      { kind: 'text', text: 'Start with **moves you can do safely**, like a few chair stands or wall push-ups. A wall push-up means leaning your hands on a wall and pushing yourself back. **Rest a day in between** so your muscles can recover.' },
      { kind: 'text', text: 'If a move hurts, change it or pick another. As you practise, **moving comfortably and with control** matters alongside how much you lift. Building up slowly gives you time to learn the movement and find **a routine you can repeat**.' },
      {
        kind: 'choice',
        prompt: 'You want to start strength work. Which plan is easier to stick with?',
        options: [
          { label: 'Two set days with easy moves', feedback: 'Yes. Easy moves on set days are simple to repeat, and you can make them harder as you get stronger.' },
          { label: 'The hardest workout I can find, tomorrow', feedback: 'Starting too hard makes it tough to keep going. Begin easy and build up a little each week.' },
        ],
      },
      {
        kind: 'do',
        text: 'Pick **two days this week** for a short strength session. Choose **moves that suit your body**.',
      },
    ],
    source: 'WHO physical activity guidelines: muscle-strengthening on two or more days a week for adults.',
  },
  {
    id: 'body.appetite',
    title: 'Short sleep makes you hungrier',
    step: 'After a short night, plan an easy, filling lunch early.',
    blocks: [
      {
        kind: 'text',
        text: 'After a short night, you may feel hungrier than usual or want more snacks. **Sleep can affect appetite**, so this is useful information about what your body needs. Knowing that ahead of time helps you make food available before the day gets busy.',
      },
      { kind: 'fact', value: '2 signals', caption: 'that control your hunger shift after short sleep' },
      {
        kind: 'text',
        text: 'Your body has **two hunger signals**. One says “I’m hungry.” The other says “I’m full.” After a short night, **the hungry signal gets louder** and the full signal gets quieter. Sweet and rich foods start looking extra good.',
      },
      { kind: 'text', text: 'Say you slept badly and you’re starving by mid-afternoon. You can use that feeling to ask **whether you need food, rest, or both**. Paying attention to those needs gives you something practical to respond to, without **blaming yourself for feeling hungry**.' },
      { kind: 'text', text: 'Because choosing food can be harder when you are tired and hungry, **plan your lunch early** on a tired day. Pick something filling you’ll enjoy, or keep an easy option nearby. That way, **you decide while you have energy**, not when you’re running on empty.' },
      {
        kind: 'choice',
        prompt: 'You badly want a snack after a short night. What’s a helpful first thought?',
        options: [
          { label: 'Short sleep is making me hungrier', feedback: 'A short night can affect appetite, so feeling hungrier is worth noticing rather than judging. You can respond by making a filling meal available and considering whether you also need rest.' },
          { label: 'I have no self-control', feedback: 'A craving isn’t a test of character. Short sleep changes your hunger signals, so this is your body, not you.' },
        ],
      },
      {
        kind: 'do',
        text: 'After a short night, **plan an easy, filling lunch** before your day gets busy.',
      },
    ],
    source: 'Sleep restriction shifts ghrelin and leptin and increases preference for energy-dense food.',
  },
  {
    id: 'body.evening',
    title: 'Dimmer evenings help you get sleepy on time',
    step: 'Turn down one bright light as bedtime gets close tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'If you want your evening to feel more like a gradual move toward sleep, **try dimming the lights near bedtime**. Light helps your body tell day from night, so turning down a bright lamp or ceiling light gives it **a clearer evening signal**.',
      },
      { kind: 'fact', value: '1 light', caption: 'is all you need to turn down tonight' },
      {
        kind: 'text',
        text: 'Your body has **an inner clock** that decides when you feel sleepy. Bright light tells that clock it’s still daytime. It also holds back **melatonin**, a natural body chemical that makes you sleepy. So bright evenings push sleepiness later.',
      },
      { kind: 'text', text: 'Picture your last hour before bed under bright ceiling lights, finishing work. The bright light keeps giving your body a daytime signal. Turn off the big light, switch on a lamp, and **pick something calm to do**. That tells your body **night is here**.' },
      { kind: 'text', text: 'It doesn’t have to be dark. Keep enough light to read or walk safely. **Start with the brightest light you control**, and turn your screen down too. Do it for a few nights and **make it your routine**.' },
      {
        kind: 'choice',
        prompt: 'You want to wind down, but the room is brightly lit. What could you change?',
        options: [
          { label: 'Dim one light this evening', feedback: 'Yes. Turning down even one bright light tells your body it’s evening. It’s quick, easy and costs nothing.' },
          { label: 'Give up on sleep tonight', feedback: 'One bright evening doesn’t ruin the night. Dim a light now and give your body the signal that it’s time to wind down.' },
        ],
      },
      {
        kind: 'do',
        text: 'Tonight, **turn down one bright light** as bedtime gets close. Notice **how your evening feels**.',
      },
    ],
    source: 'Evening light exposure delays circadian phase and suppresses melatonin; intensity and angle both matter.',
  },
  {
    id: 'body.thirst',
    title: 'Feeling tired? Check if you need water',
    step: 'Have a glass of water if you haven’t had much today.',
    blocks: [
      {
        kind: 'text',
        text: 'When you feel tired, grumpy, or foggy, it can be hard to know where to start. One simple thing to check is **whether you have had enough to drink**. Being low on water can affect how you feel, so it is worth considering alongside sleep and food.',
      },
      { kind: 'fact', value: '1 glass', caption: 'the simplest check you can make' },
      {
        kind: 'text',
        text: 'When you’re **a little low on water**, your mood dips, your focus slips, and tasks feel harder than they should. If you have not had much to drink, **a glass of water is a simple first step** while you consider what else might be affecting you.',
      },
      { kind: 'text', text: 'Ask yourself: when did I last drink something? If it’s been hours, **drink a glass of water now**. Then check in with yourself again in a little while. This gives you a chance to notice whether drinking helps, without needing to decide the cause straight away.' },
      { kind: 'text', text: 'If water doesn’t change how you feel, that’s useful to know too. Tiredness has lots of causes, so **look at sleep, stress and food next**. Water is just **the easiest place to start**.' },
      {
        kind: 'choice',
        prompt: 'Your energy is low and you’ve barely had a drink all day. What’s worth checking?',
        options: [
          { label: 'Have some water and see how I feel', feedback: 'If you have had little to drink, water is a simple thing to try. Notice how you feel afterward, while remembering that tiredness and poor focus can have other causes too.' },
          { label: 'Expect water to fix everything', feedback: 'Water helps when you’re low on it, but tiredness has other causes too. Drink up, then look at sleep and stress.' },
        ],
      },
      {
        kind: 'do',
        text: 'If you haven’t had much to drink today, **have a glass of water now**. Check later **how you feel**.',
      },
    ],
    source: 'Mild hypohydration (~2% body mass) produces measurable decrements in mood, vigilance and perceived effort.',
  },
  {
    id: 'body.morningprep',
    title: 'Prepare what you need for tomorrow',
    step: 'Put tomorrow’s clothes and needed bag items in one place tonight.',
    blocks: [
      {
        kind: 'text',
        text: 'Getting ready can take longer when you need to look for things. You may be searching for socks while also trying to find your keys. **Put tomorrow\'s things in one place tonight**. You can choose what you need while you have time to check, instead of searching after you wake.',
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Clothes',
            text: 'Choose clothes for tomorrow. Include the small things you often search for, such as socks.',
          },
          {
            term: 'Bag',
            text: 'Add the items you need for work, school, or an appointment. Check what tomorrow actually requires.',
          },
          {
            term: 'Keys',
            text: 'Use a place you will see before leaving. Keep important items secure if others can reach that place.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'You do not need to pack everything you own. **Prepare for the morning you actually have**. If you are staying home, putting out comfortable clothes may be enough. If you are taking a child somewhere, check their bag too. Leave food that needs to stay cold in the fridge.',
      },
      {
        kind: 'choice',
        prompt: 'Your lunch needs to stay cold overnight. How could you remember it?',
        options: [
          {
            label: 'Leave a note beside my bag',
            feedback: 'Keep the lunch in the fridge. A note with the word lunch can remind you to collect it before leaving.',
          },
          {
            label: 'Put it in the bag tonight',
            feedback: 'Only do this if it will stay safely cold. Preparing early should not mean leaving food out overnight.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Choose a place that **keeps your path clear**. A bag in the middle of the floor can be easy to trip over. A chair or shelf near where you get dressed may work better. Tell other people if you are using a shared space so your things are not moved by mistake.',
      },
      {
        kind: 'do',
        text: 'Tonight, **put tomorrow\'s clothes and needed bag items in one place**. Keep food cold and the floor clear.',
      },
    ],
    source: 'Author practical example: preparing clothing and needed items before the morning; no clinical or research-backed outcome is claimed.',
  },
  {
    id: 'body.firststeps',
    title: 'Choose your first actions after waking',
    step: 'Write your first three actions for tomorrow morning.',
    blocks: [
      {
        kind: 'text',
        text: 'A morning can feel confusing when you are trying to decide everything at once. Do you check messages, find clothes, or start getting ready? **Choose your first three actions before morning**. These are the ordinary things you need to do after waking, in an order that makes sense for you.',
      },
      {
        kind: 'text',
        text: 'Start with what your morning requires. **Use clear actions you can see yourself doing**. Get out of bed. Use the bathroom. Get dressed. Those words say exactly what to do. A note that says have a better morning does not tell you where to start or what comes next.',
      },
      {
        kind: 'sequence',
        prompt: 'Put this example morning in order.',
        steps: [
          'Get out of bed.',
          'Use the bathroom.',
          'Put on the clothes you prepared.',
        ],
        feedback: 'This is one example, not a required order for everyone. Your own first actions can be different.',
      },
      {
        kind: 'choice',
        prompt: 'You need to take medicine after waking. Where should it go in your list?',
        options: [
          {
            label: 'Where it fits the instructions I was given',
            feedback: 'Use your own medicine instructions. The list should reflect your needs, including any food or timing requirements.',
          },
          {
            label: 'Leave it out to keep the list simple',
            feedback: 'Keep necessary care in your morning. A shorter list should not remove something you need for your health.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Put the note **where you will see it after waking**. Beside the bed or near your clothes may work. If you care for someone in the morning, include the first thing they need too. Leave room to change the order if something urgent happens. The note is a reminder, not a strict rule.',
      },
      {
        kind: 'do',
        text: 'Before bed, **write the first three things you need to do** after waking tomorrow. Put the note where you will see it.',
      },
    ],
    source: 'Author practical example: writing a short order of necessary morning actions; no clinical or research-backed outcome is claimed.',
  },
  {
    id: 'body.morningfood',
    title: 'Make morning food easy to find',
    step: 'Choose easy food for tomorrow if you usually wake up hungry.',
    blocks: [
      {
        kind: 'text',
        text: 'If you feel hungry in the morning, choosing food can be one more task before you leave. **Pick an easy option the night before**. Choose something you enjoy and can get ready in the time you have. You do not need to cook a full meal to have food available.',
      },
      {
        kind: 'reveal',
        prompt: 'Choose an option for your morning.',
        items: [
          {
            label: 'Time to eat at home',
            detail: 'You could have toast, cereal, leftovers, or another food you like. Check that the ingredients are available tonight.',
          },
          {
            label: 'Leaving soon after waking',
            detail: 'Choose something you can safely take with you and eat when you have time. Keep foods that need to stay cold in a fridge or suitable cold bag.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Your morning hunger can change from day to day. **You do not have to eat breakfast when you are not hungry**. Having an option ready simply means you do not have to search for food if you want it. Follow any eating instructions you have been given for your own health.',
      },
      {
        kind: 'choice',
        prompt: 'You have little time at home and usually get hungry later. What could you prepare?',
        options: [
          {
            label: 'Food I can take with me',
            feedback: 'Choose something that travels safely. You can eat when you are hungry and have a suitable place to stop.',
          },
          {
            label: 'A meal I must eat before leaving',
            feedback: 'That may not fit your hunger or schedule. Preparing food should give you an option, not force you to eat at a set time.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Before bed, **check what is already in the kitchen**. Pick food that suits your needs and budget. Put a bowl or spoon out if that helps. Keep chilled food in the fridge overnight. If buying food on the way is easier, decide where you will get it and allow time for the stop.',
      },
      {
        kind: 'do',
        text: 'Tonight, **choose an easy food for tomorrow morning if you expect to be hungry**. Check that you have it, and store it safely.',
      },
    ],
    source: 'Author practical example: preparing an optional morning food choice; no mandatory breakfast or clinical outcome is claimed.',
  },
] as const satisfies readonly LessonDefinition[];
