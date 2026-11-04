import type { RoutineLibraryId } from './routineLibrary';

export interface RoutineGuide {
  introduction: readonly [string, string];
  preparation: readonly string[];
  taskDescriptions: Readonly<Record<string, string>>;
  smallStart: string;
}

/** Reading guidance only; scheduling and saved task fields belong to routineLibrary. */
export const ROUTINE_GUIDES = {
  'morning-reset': {
    introduction: [
      'Some mornings need a little structure before messages, errands, and other people’s plans arrive. This routine gives you three familiar things to return to, even when the rest of the day looks different.',
      'Move through the steps at an ordinary pace. A loosely made bed, a drink, and a moment by the window are enough; you do not need an early start or a perfectly quiet home.',
    ],
    preparation: [
      'Leave a clean glass somewhere easy to reach the night before.',
      'Choose a window, doorway, or outdoor spot you can comfortably use in the morning.',
      'Keep only the steps that fit the time you actually have.',
    ],
    taskDescriptions: {
      'make-bed': 'Pull up the covers and straighten your pillows.',
      'drink-water': 'Pour a glass of water and take a few sips.',
      daylight: 'Open the curtains or step outside for a little morning light.',
    },
    smallStart: 'Open the curtains and take a sip of water. Leave the bed for another morning if that is all the room you have today.',
  },
  'focus-reset': {
    introduction: [
      'Starting work can mean opening a dozen tabs before deciding what matters. This routine makes a little room around one priority so you can begin with a clear first action.',
      'Use it before a work block, after an interruption, or when you notice yourself drifting. The break belongs in the plan too; you do not have to earn it by finishing everything.',
    ],
    preparation: [
      'Have a scrap of paper or one simple note ready for your priority.',
      'Pick a place for your phone that still allows any essential calls.',
      'Choose a natural stopping point for the block before you start.',
    ],
    taskDescriptions: {
      priority: 'Pick one thing to focus on and write down the first step.',
      'phone-away': 'Put your phone out of reach and silence alerts you don’t need.',
      'reset-break': 'Step away from your work, stretch a little, or look out the window.',
    },
    smallStart: 'Write one sentence naming your next action, then put your phone just beyond reach. Begin there and decide about the rest after a few minutes.',
  },
  'evening-wind-down': {
    introduction: [
      'An evening can disappear into small unfinished jobs. This routine creates a gentle edge around the day: care for one visible spot, prepare something useful, then spend a little time away from a screen.',
      'You can begin after dinner or whenever your evening opens up. Keep the tidy contained so there is still room for the part where you settle down and enjoy being home.',
    ],
    preparation: [
      'Choose one surface rather than a whole room to tidy.',
      'Put tomorrow’s bag or essentials near their usual home.',
      'Have a book, music, or another easy screen-free activity within reach.',
    ],
    taskDescriptions: {
      'tidy-surface': 'Pick one table or counter and put away what doesn’t belong there.',
      tomorrow: 'Put your keys, bag, and anything else you need tomorrow in one place.',
      'screen-free': 'Put the screen aside and read, listen to music, or enjoy a quiet drink.',
    },
    smallStart: 'Clear enough space on your bedside table for one thing you enjoy, then spend two quiet minutes there. Tomorrow’s setup can wait if you are done for the day.',
  },
  'bedtime-routine': {
    introduction: [
      'The last part of the day often holds a mix of practical care and lingering thoughts. This sequence gives both a place, so you can move toward bed without repeatedly deciding what comes next.',
      'Begin at the step that fits your evening and leave out anything you do not need. The list and journal are places to put things down, rather than invitations to solve tomorrow tonight.',
    ],
    preparation: [
      'Set out the toiletries and sleepwear you already use.',
      'Keep a notebook and pen near a comfortable place to sit.',
      'Choose a short finish point for tidying before you begin.',
    ],
    taskDescriptions: {
      'tidy-workspace': 'Put away loose papers and supplies, leaving your desk ready for tomorrow.',
      'brush-teeth': 'Brush your teeth and wash your face with your usual products.',
      skincare: 'Use your usual skincare products, then put them back.',
      pajamas: 'Change into comfortable pajamas and put today’s clothes away or in the hamper.',
      'tomorrow-list': 'Write a short list for tomorrow and pick what to start with.',
      journal: 'Write a few lines about your day or whatever’s on your mind.',
    },
    smallStart: 'Choose your usual toothbrushing and a change into comfortable clothes. If a thought keeps returning, write just a few words to remember it tomorrow.',
  },
  'weekly-home-reset': {
    introduction: [
      'A weekly reset is a chance to notice what would make the next few days easier. It brings together a little space care, one load of laundry, and a practical look at your calendar.',
      'Choose the room and laundry that matter most this week. You are setting up the parts of home you will use, so there is no need to catch up on every job at once.',
    ],
    preparation: [
      'Pick a window when you can return to the laundry after the machine finishes.',
      'Gather a basket for stray items in the room you choose.',
      'Have your calendar and any household plans nearby.',
    ],
    taskDescriptions: {
      'choose-room': 'Pick one room, put away stray items, and clear the spots you use most.',
      laundry: 'Start one load of laundry and set a reminder to move it when it’s done.',
      'plan-week': 'Check your calendar and jot down anything you need to prepare this week.',
    },
    smallStart: 'Look at tomorrow’s calendar and clear the spot you will use first. One ready corner can be this week’s reset.',
  },
  'small-clean': {
    introduction: [
      'A room can feel busy even when there is no time for a full clean. This routine stays with the visible, useful things: dishes, a handful of belongings, and one surface.',
      'Choose the steps that fit your available minutes. If you only have ten, spend them on the job that makes the room easier to use and let the remaining jobs stay on another day’s list.',
    ],
    preparation: [
      'Choose one room and keep the clean inside that boundary.',
      'Bring a cloth and a small basket for anything that belongs elsewhere.',
      'Decide how many minutes you want to give this before starting.',
    ],
    taskDescriptions: {
      dishes: 'Wash or load a batch of dishes, starting with the ones you’ll need next.',
      clutter: 'Find five things with an obvious home and put them back.',
      surfaces: 'Clear one counter or table and wipe it with a suitable cleaner.',
    },
    smallStart: 'Put away one item and wash the cup or plate you want to use next. You can stop with those two useful things done.',
  },
  'get-ready': {
    introduction: [
      'Getting out the door involves several little decisions that can compete for attention. This routine gathers the essentials into a familiar sequence so you can see what is already taken care of.',
      'Work with the kind of morning you have. Comfortable clothes, a simple breakfast, and a bag with what you need are enough; this does not need to become a complete morning makeover.',
    ],
    preparation: [
      'Check the weather and any plans that affect your clothes.',
      'Choose a breakfast that is realistic for the time available.',
      'Keep your bag and keys together while you get ready.',
    ],
    taskDescriptions: {
      dressed: 'Choose clothes for today’s plans and set your shoes by the door.',
      'wash-face': 'Wash your face and brush your teeth with your usual products.',
      breakfast: 'Make an easy breakfast, or pack something to take with you.',
      bag: 'Pack your keys, lunch, and anything else you need for today.',
    },
    smallStart: 'Get dressed and check for your keys and the one item you most need today. Choose a simple breakfast you can eat now or take with you.',
  },
  'midday-pause': {
    introduction: [
      'The middle of the day can become a stretch of moving from one request to another. This routine makes space to eat, refill your water, and step away before choosing the next thing.',
      'Take the break where it fits, even if your lunchtime moves around. You do not need to catch up while eating or make a perfect afternoon plan before you return.',
    ],
    preparation: [
      'Find an easy lunch option before opening another piece of work.',
      'Choose a nearby outdoor spot or somewhere you can pause by a window.',
      'Keep a note ready for the first task after your break.',
    ],
    taskDescriptions: {
      lunch: 'Put work aside, make yourself some lunch, and sit down to eat.',
      water: 'Refill your glass or bottle and keep it within reach.',
      outside: 'Step outside for a few minutes, or pause by an open window.',
      'next-thing': 'Look at what’s left today and pick one thing to do next.',
    },
    smallStart: 'Set work aside long enough to have something to eat and refill your drink. Choose only your very next action when you return.',
  },
  'workday-shutdown': {
    introduction: [
      'Work often ends with loose threads still in view. This routine gives those threads a place to wait: a short plan, a usable desk, and a clear finish to the apps you have been using.',
      'Use the final message check for things that truly need attention before you leave. Tomorrow’s work can stay in tomorrow’s note rather than becoming an extra block at the end of today.',
    ],
    preparation: [
      'Choose an end time and leave a small window for closing tasks.',
      'Keep your task list and calendar open for the handover to tomorrow.',
      'Know how to handle any work contact that genuinely needs to reach you later.',
    ],
    taskDescriptions: {
      'tomorrow-top': 'Write down tomorrow’s top three tasks and the first step for one of them.',
      'clear-desk': 'Put away supplies, stack loose papers, and leave some clear desk space.',
      messages: 'Reply to messages that need an answer today. Leave the rest for tomorrow.',
      'screens-off': 'Save your work, then close your work apps and tabs.',
    },
    smallStart: 'Save your work, write the next action in one sentence, and close the work app. That can be your whole shutdown on a busy day.',
  },
  'kitchen-close': {
    introduction: [
      'Closing the kitchen is a small kindness to the next time you use it. The aim is a sink and work area you can return to, with the day’s dishes and scraps gathered away.',
      'Keep this to the evening basics rather than a deep clean. Work around what is still being used, and let a clear patch of counter count even when the whole kitchen cannot be finished.',
    ],
    preparation: [
      'Put food away before starting on dishes and counters.',
      'Gather your usual dish supplies, a suitable surface cleaner, and a cloth.',
      'Let the stovetop cool before wiping it.',
    ],
    taskDescriptions: {
      'do-dishes': 'Wash the dishes or load the dishwasher. Leave stubborn bits to soak.',
      'wipe-counters': 'Put food away, then wipe the counters and stovetop once it’s cool.',
      'shine-sink': 'Clear food scraps, rinse the sink, and wipe around the tap.',
      trash: 'Empty the bin if it’s full and put in a fresh liner.',
    },
    smallStart: 'Put food away and clear enough dishes to use the sink. Wipe one breakfast-sized patch of counter and call the kitchen closed.',
  },
  'clutter-hot-spots': {
    introduction: [
      'Some places collect belongings almost as soon as they are cleared. This routine visits four common landing spots with a short limit, giving each one enough attention to be useful again.',
      'Follow the route that makes sense in your home and skip any spot that is already clear. Save decisions about storage or what to keep for another time; this is a quick return-to-place round.',
    ],
    preparation: [
      'Bring a small basket for things that belong in other rooms.',
      'Choose one obvious home for keys, mail, and other frequent arrivals.',
      'Set a short timer if it helps you leave each spot after two minutes.',
    ],
    taskDescriptions: {
      'hot-table': 'Put away dishes and stray items so there’s room to sit and eat.',
      'hot-counter': 'Move things that don’t belong in the kitchen and clear some space for cooking.',
      'hot-couch': 'Pick up cups and clothes, then fold the blanket and straighten the cushions.',
      'hot-entry': 'Pair up shoes, hang coats, and move bags out of the walkway.',
    },
    smallStart: 'Choose the one spot you want to use next and put away three things from it. The other landing spots can wait for your next round.',
  },
  'clutter-sweep': {
    introduction: [
      'A clutter sweep gives obvious departures a way out of the house. Walk through familiar spaces, looking for things you already know you no longer need rather than reopening every decision about your belongings.',
      'The numbers in this routine are prompts, not quotas. Stop with fewer items whenever choices get difficult, and keep anything that belongs to someone else or needs more thought for a separate conversation.',
    ],
    preparation: [
      'Label separate bags for rubbish and donations so they stay distinct.',
      'Check what your donation destination accepts before adding items.',
      'Leave personal documents, sentimental items, and other people’s belongings out of this sweep.',
    ],
    taskDescriptions: {
      toss: 'Bag up obvious rubbish and separate recycling. Stop before you get stuck on a decision.',
      donate: 'Bag up things you’re ready to give away that your donation spot accepts.',
      door: 'Put the donation bag near the door, out of the way, and choose a drop-off day.',
    },
    smallStart: 'Find one obvious piece of rubbish and one item you are happy to donate. Put each in its own place and leave the harder decisions alone today.',
  },
  'laundry-day': {
    introduction: [
      'Laundry has several finish lines, and the washer is only the first. This routine keeps one load in view from sorting to the drawer, with space between the hands-on steps for the machines to run.',
      'Choose a load you can realistically return to today. The minutes shown are active time rather than the full wash and dry cycle, so let the pauses fit around the rest of your day.',
    ],
    preparation: [
      'Check care labels and choose a manageable load for your machine or washing setup.',
      'Make sure there is space on the drying rack or access to the dryer.',
      'Set reminders for the wash and dry finish times.',
    ],
    taskDescriptions: {
      sort: 'Choose one load, empty the pockets, and check the care labels.',
      start: 'Add detergent, choose the right cycle, and set a reminder for when it finishes.',
      dry: 'Check the care labels, then move the load to the dryer or drying rack.',
      fold: 'Bring the dry clothes to a clear spot and fold or hang them.',
      away: 'Put the clothes in their drawers or closet, then return the empty basket.',
    },
    smallStart: 'Choose a small load of the things you need soonest and set a reminder when you start it. Follow just that load through before adding another.',
  },
  'whole-home-hour': {
    introduction: [
      'This is a timed round of the main household jobs, with enough structure to keep one task from taking the whole afternoon. The rooms do not need to be spotless for the round to be useful.',
      'Work through the steps in an order that suits your space and stop when the hour ends. Machine cycles and laundry drying can happen later; the goal here is the hands-on work in front of you.',
    ],
    preparation: [
      'Gather the vacuum, mop, cloths, fresh sheets, and bin liners before starting.',
      'Follow product labels and use a separate cloth for different cleaning areas.',
      'Keep walkways clear and plan to leave wet floors until they are dry.',
    ],
    taskDescriptions: {
      vacuum: 'Vacuum the main walkways and open floor areas. Leave heavy furniture where it is.',
      dust: 'Wipe the surfaces you can easily reach, working from higher spots down.',
      mop: 'Sweep up crumbs, mop with the right cleaner for your floor, and let it dry.',
      mirrors: 'Wipe smudges from mirrors, door handles, and the parts of doors you touch most.',
      magazines: 'Recycle unwanted papers and set aside anything with personal information to shred.',
      sheets: 'Take off the used sheets, put them in the laundry, and make the bed with fresh ones.',
      'all-trash': 'Empty the household bins that need it and replace their liners.',
    },
    smallStart: 'Choose one ten-minute job from the list and stop when its timer ends. You can rotate to a different job next time rather than fitting in the whole hour.',
  },
  'slow-morning': {
    introduction: [
      'A slow morning can be a small pocket of time rather than an entirely unhurried day. This routine makes room for light, a drink, and a quiet look at what is ahead before you begin.',
      'Let these minutes be ordinary. You can sit in yesterday’s comfortable clothes, use your usual mug, and look at the same view; the value is having a moment that does not need filling.',
    ],
    preparation: [
      'Choose a comfortable chair or familiar spot by a window.',
      'Have a mug and an easy drink option ready.',
      'Keep today’s plan somewhere you can check without opening a stream of notifications.',
    ],
    taskDescriptions: {
      'slow-curtains': 'Open the curtains and take a quick look at the weather.',
      'slow-water': 'Pour a glass of water and take a few sips.',
      'slow-sit': 'Make a warm drink and sit somewhere comfortable while you have it.',
      'slow-plan': 'Check today’s plans and choose what you’ll start with.',
    },
    smallStart: 'Open the curtains and sit for one minute with whatever drink is easiest. You do not need to prepare anything special for the pause to count.',
  },
  'phone-free-morning': {
    introduction: [
      'Messages and feeds can enter the day before you have had a chance to get ready. This routine gives a few familiar morning activities their own space before you choose to check your phone.',
      'Make the boundary practical for your life. Essential calls, accessibility tools, and caring responsibilities can stay available; the aim is to make checking a choice rather than the automatic first step.',
    ],
    preparation: [
      'Choose a phone spot where you can still hear any essential calls or alarms.',
      'Keep the things you need for showering and breakfast easy to find.',
      'Decide when you want to check your phone again, such as after breakfast.',
    ],
    taskDescriptions: {
      'pf-away': 'Leave your phone in another room, with important calls still able to come through.',
      'pf-bed': 'Pull up the covers and straighten your pillows.',
      'pf-shower': 'Get your towel and clothes ready, then take your usual shower.',
      'pf-eat': 'Make breakfast and sit down to eat without checking your phone.',
    },
    smallStart: 'Leave your phone in its spot while you make the bed or eat a few bites of breakfast. One short activity can be your first phone-free window.',
  },
  'morning-movement': {
    introduction: [
      'Morning movement can begin with what feels available today. This routine pairs a little stretching and an easy walk with the practical steps that help you move into the rest of the morning.',
      'Use a comfortable pace and adapt the movements or route to your space and ability. The suggested minutes are a starting point, so a shorter round is welcome whenever that fits better.',
    ],
    preparation: [
      'Choose a clear space for movement and shoes suitable for your route.',
      'Check the weather or choose an indoor route you can comfortably use.',
      'Have a towel and a change of clothes ready for afterward.',
    ],
    taskDescriptions: {
      'mm-water': 'Have a little water and leave your glass or bottle nearby.',
      'mm-stretch': 'Try a few gentle stretches, seated or standing. Skip anything that hurts.',
      'mm-walk': 'Walk a familiar route at an easy pace, outdoors or inside.',
      'mm-shower': 'Rinse off, change into fresh clothes, and put your walking things away.',
    },
    smallStart: 'Choose one comfortable stretch or walk a short familiar stretch of hallway. Stop there if that is the amount of movement that fits your morning.',
  },
  'tidy-before-leaving': {
    introduction: [
      'Leaving home can be a useful cue for a small reset. These few steps focus on the places you will see when you return, with a final check for the things you need to take.',
      'Your departure time comes first. Choose the most useful steps while you have room, and leave the rest when it is time to go; this routine should fit the morning you already have.',
    ],
    preparation: [
      'Check how long you have before you need to leave.',
      'Keep your keys and bag in their usual exit spot.',
      'Have a cloth handy so wiping the counter takes one trip.',
    ],
    taskDescriptions: {
      'tbl-bed': 'Pull up the covers and straighten your pillows.',
      'tbl-dishes': 'Take breakfast dishes to the sink or dishwasher and put leftovers away.',
      'tbl-counter': 'Put breakfast things away and wipe up crumbs and spills.',
      'tbl-bag': 'Check for your keys and anything waiting in the fridge or on a charger.',
    },
    smallStart: 'Gather your breakfast dishes and check your keys and bag. If it is time to leave, let those be the whole routine today.',
  },
  'deep-work-block': {
    introduction: [
      'Some tasks need a little protected space to get beyond the first few minutes. This routine helps you choose one piece of work, quiet avoidable interruptions, and stay with it for a defined block.',
      'Make the task smaller than the whole project and keep a place to note distractions without following them. When the block ends, take the break even if the work still has another chapter.',
    ],
    preparation: [
      'Have the files, tools, or materials for one task ready.',
      'Choose a timer and a place to jot down unrelated thoughts.',
      'Let anyone who may need you know how to reach you during the block.',
    ],
    taskDescriptions: {
      'dw-one': 'Pick one task and write down what you want to finish in this block.',
      'dw-phone': 'Silence alerts you don’t need, put your phone away, and close unrelated tabs.',
      'dw-timer': 'Set a timer and work on your chosen task until it rings.',
      'dw-break': 'Save your work and step away for a drink, a stretch, or some fresh air.',
    },
    smallStart: 'Choose one small part of the task and give it ten minutes. Write where to begin next, then take a short break before deciding about another block.',
  },
  'inbox-clear': {
    introduction: [
      'An inbox mixes information, requests, and reminders in one place. This routine separates those jobs so the messages that matter get a response and the things that need time have somewhere else to wait.',
      'You do not need to reach zero messages. Work through a manageable batch, capture the follow-ups, and finish with a clear idea of what still needs your attention later.',
    ],
    preparation: [
      'Choose one inbox rather than switching between every messaging app.',
      'Keep your task list or calendar beside the messages.',
      'Decide when this check ends and when you will return if needed.',
    ],
    taskDescriptions: {
      'ic-urgent': 'Reply to messages that need an answer before your next inbox check.',
      'ic-archive': 'Archive messages you’re done with and delete the ones you don’t need.',
      'ic-list': 'Add anything that needs more time to your to-do list, then close the inbox.',
    },
    smallStart: 'Answer one message that truly needs a response and capture one follow-up on your list. Close the inbox after that small batch.',
  },
  'study-session': {
    introduction: [
      'A study session is easier to enter when you know what you are practicing and when you will pause. This routine gives one topic two focused rounds with a break between them.',
      'Choose a concrete piece of learning rather than an entire subject. The second round is a chance to work with what you just covered, and you can shorten the session when one round is enough.',
    ],
    preparation: [
      'Gather the notes, book, or practice questions for one topic.',
      'Keep a timer and a blank page available.',
      'Choose somewhere to leave unrelated tabs and your phone during the study rounds.',
    ],
    taskDescriptions: {
      'ss-goal': 'Choose one topic or set of questions to work on.',
      'ss-desk': 'Clear space for your notes, book, water, and timer.',
      'ss-first': 'Set a timer, study your chosen topic, and jot down the main points.',
      'ss-break': 'Step away from your desk, have some water, or stretch for a few minutes.',
      'ss-second': 'Try some practice questions or explain what you’ve learned in your own words.',
    },
    smallStart: 'Choose one question and spend ten minutes trying it or explaining the idea in your own words. Leave a note for the next session and take a break.',
  },
  'phone-down': {
    introduction: [
      'It is easy for one last phone check to become the rest of the evening. This routine makes a practical place for the phone and puts a simple alternative within reach.',
      'Choose a distance that works for your home and any calls you need to receive. You are making room for another way to spend the evening, with a clear point when checking can end.',
    ],
    preparation: [
      'Choose a charging spot with a safe, clear place for the cable.',
      'Keep essential calls available if you need to be reachable.',
      'Put a book or another easy offline activity near your evening seat.',
    ],
    taskDescriptions: {
      'pd-charge': 'Plug your phone in across the room, with the cable out of the walkway.',
      'pd-alarm': 'Set tomorrow’s alarm, check the time, and put your phone back down.',
      'pd-book': 'Pick up a book you enjoy and read a few pages.',
    },
    smallStart: 'Set your alarm, place the phone out of reach, and read one page. A few phone-free minutes are a complete place to begin.',
  },
  'tomorrow-setup': {
    introduction: [
      'A few ordinary decisions can take up a surprising amount of morning attention. This routine moves some of them into the evening, while you have a moment to notice what tomorrow actually needs.',
      'Prepare the things that are already clear and leave the unknown parts open. Clothes, a bag, a simple priority, and lunch can be enough without planning every hour of the next day.',
    ],
    preparation: [
      'Check tomorrow’s weather and any appointments that change what you need.',
      'Choose one visible place for clothes and your packed bag.',
      'Gather a lunch container and see what food is already available.',
    ],
    taskDescriptions: {
      'ts-clothes': 'Check the weather and lay out clothes for tomorrow’s plans.',
      'ts-bag': 'Pack your bag and leave a note for anything you need to add in the morning.',
      'ts-top': 'Choose tomorrow’s main task and write down the first step.',
      'ts-lunch': 'Make an easy lunch, put it in the fridge, and leave yourself a reminder.',
    },
    smallStart: 'Put tomorrow’s clothes in one place and leave your keys with your bag. If you have another minute, write only the first thing you want to begin.',
  },
  'evening-shower': {
    introduction: [
      'A shower can be a familiar marker between being busy and being home for the evening. This routine keeps the surrounding steps together so you can finish washing and settle into comfortable clothes.',
      'Use the products and level of care that already work for you. There is no need to add extra steps to make the evening feel complete; a simple wash and change can be enough.',
    ],
    preparation: [
      'Put a towel and clean sleepwear within easy reach before starting.',
      'Check that the floor and your path out of the shower are clear.',
      'Set out only the toiletries you plan to use tonight.',
    ],
    taskDescriptions: {
      'es-clothes': 'Put dirty clothes in the hamper and hang up anything you’ll wear again.',
      'es-shower': 'Set the water to a comfortable temperature and take your usual shower.',
      'es-skin': 'Use your usual skincare products, then put them back.',
      'es-pajamas': 'Put on clean pajamas and hang your towel up to dry.',
    },
    smallStart: 'Wash up in the way that feels manageable tonight and change into comfortable clothes. Leave the longer shower or extra care for another evening.',
  },
  'read-before-bed': {
    introduction: [
      'Reading offers an easy evening activity with a natural place to pause. This routine prepares a comfortable spot and gives a few pages their own time, without needing to finish a chapter.',
      'Choose something you want to read rather than something you feel you ought to finish. A familiar story, short essay, or lighter book can all belong here, and you can stop whenever you are ready.',
    ],
    preparation: [
      'Put your book and bookmark where you plan to sit.',
      'Choose a reading light bright enough for comfortable reading.',
      'Keep the phone somewhere that does not invite checking between pages.',
    ],
    taskDescriptions: {
      'rb-dim': 'Turn down the overhead lights and switch on a comfortable reading lamp.',
      'rb-tea': 'Make a warm drink and set it beside your reading spot.',
      'rb-read': 'Open your book and read until the timer rings or you feel ready to stop.',
    },
    smallStart: 'Turn on your reading lamp and read one page from a book already nearby. The drink and a longer reading session can be optional tonight.',
  },
  'fridge-clear-out': {
    introduction: [
      'A fridge clear-out is a chance to see what is actually available before buying more. This routine works through a small section at a time, making room, cleaning spills, and noting the useful gaps.',
      'Keep food in view while you decide what belongs back, and keep the job moving so chilled items spend as little time out as possible. You can do a single shelf when a whole-fridge pass feels too much.',
    ],
    preparation: [
      'Make a little counter space and have a bag ready for discarded items.',
      'Use a cloth and cleaning method suitable for your fridge’s instructions.',
      'Keep a shopping list nearby and work one small section at a time.',
    ],
    taskDescriptions: {
      'fc-old': 'Check use-by dates and storage instructions, then throw out food that needs to go. Don’t taste it to check.',
      'fc-wipe': 'Wipe one shelf at a time and put chilled food back straight away.',
      'fc-sort': 'Group similar foods together and put the things you’ll use soon where you can see them.',
      'fc-list': 'Check what’s left, then list what you need for the next few meals.',
    },
    smallStart: 'Check one small fridge section, remove anything you know needs discarding, and note one ingredient you can use next. Leave the other shelves for another round.',
  },
  'bathroom-wipe-down': {
    introduction: [
      'A quick bathroom pass can keep the everyday surfaces ready to use between deeper cleans. This routine stays with the mirror, sink, toilet, and hand towel so the job has a clear boundary.',
      'Move from the cleaner areas toward the toilet, using separate supplies as appropriate. Save cupboards, grout, and the rest of the room for another day rather than expanding this short round.',
    ],
    preparation: [
      'Gather suitable cleaning products, separate cloths, and a clean hand towel.',
      'Follow product labels, ventilate as directed, and never mix cleaning products.',
      'Clear personal items from the surfaces you will wipe.',
    ],
    taskDescriptions: {
      'bw-mirror': 'Wipe away mirror smudges with a clean cloth and suitable cleaner.',
      'bw-sink': 'Move toiletries aside and clean the sink and tap, following the cleaner’s directions.',
      'bw-toilet': 'Clean the toilet with a separate cloth and brush. Follow the cleaner’s directions, then wash your hands.',
      'bw-towel': 'Put the used hand towel in the laundry and hang up a clean one.',
    },
    smallStart: 'Swap the hand towel and wipe the sink using its usual supplies. That is a useful small finish without taking on the whole bathroom.',
  },
  'low-energy-day': {
    introduction: [
      'Some days need a shorter list and fewer decisions. This routine keeps a few ordinary forms of care close together, with space to choose what feels possible rather than catching up on everything else.',
      'You can pause between steps, ask for help, or leave a step out. The small task at the end is optional in spirit too; taking care of the basics can be the whole plan today.',
    ],
    preparation: [
      'Keep an easy drink and something simple to eat within reach.',
      'Choose a comfortable place to sit between steps.',
      'Let someone help with food or practical tasks if that would be useful.',
    ],
    taskDescriptions: {
      'le-water': 'Take a few sips of water and keep the glass nearby.',
      'le-eat': 'Have something easy, like leftovers, toast, or a ready-made meal.',
      'le-wash': 'Wash your face with water or a soft, damp cloth.',
      'le-one': 'Pick one small job, like charging your phone or putting a cup away.',
    },
    smallStart: 'Keep a drink and an easy food option nearby. You can leave the washing and the small task out today and come back when you want to.',
  },
  'overwhelmed-reset': {
    introduction: [
      'When several things feel equally urgent, deciding where to start can become its own task. This routine puts the thoughts somewhere visible and makes room to choose just one next action.',
      'The page does not need to be organized, and the action does not need to solve the biggest problem. You are making a small starting place, with permission to pause again after the short work block.',
    ],
    preparation: [
      'Find paper or a simple note where you can write without organizing first.',
      'Keep a timer nearby for the short work block.',
      'Choose somewhere you can sit or stand comfortably while you begin.',
    ],
    taskDescriptions: {
      'ov-dump': 'Write down what’s on your mind. A messy list is fine.',
      'ov-one': 'Circle one thing you can start now and write down the first step.',
      'ov-timer': 'Set a ten-minute timer and work on that one thing until it rings.',
    },
    smallStart: 'Write one thing that is on your mind and name its smallest next action. You can stop with the note or try the action for two minutes.',
  },
  'anxious-moment': {
    introduction: [
      'When thoughts are moving quickly, a short familiar sequence can offer something concrete to do. These steps invite you to notice your breathing, the objects around you, and a nearby change of scene.',
      'Use only the steps that feel comfortable and available. You do not have to feel a certain way by the end, and you can keep your attention on the room if noticing your breath is unhelpful.',
    ],
    preparation: [
      'Choose a place where you feel comfortable pausing for a moment.',
      'Keep your eyes open if that makes it easier to notice the room.',
      'Pick an indoor alternative if stepping outside is not practical or comfortable.',
    ],
    taskDescriptions: {
      'am-breaths': 'Take three easy breaths without forcing them. Skip this if it feels uncomfortable.',
      'am-ground': 'Look around and name five things you can see, quietly or out loud.',
      'am-air': 'Step outside for a few minutes, or sit by a window.',
    },
    smallStart: 'Look at one familiar object and name its color or shape. You can stay with that single detail and leave the breathing or change of scene out.',
  },
} satisfies Record<Exclude<RoutineLibraryId, 'house-cleaning'>, RoutineGuide>;

export function getRoutineGuide(id: RoutineLibraryId): RoutineGuide | undefined {
  return id === 'house-cleaning' ? undefined : ROUTINE_GUIDES[id];
}
