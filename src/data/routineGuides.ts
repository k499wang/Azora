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
      'make-bed': 'Pull the covers into place and straighten your pillow. Stop once the bed looks ready for tonight; this is a quick closing gesture, not a reason to rearrange the whole room.',
      'drink-water': 'Pour a glass of water and drink at a comfortable pace while you pause in the kitchen. Leave the glass somewhere convenient if you would rather finish it a little later.',
      daylight: 'Open the curtains and spend a little time near a bright window, or step outside if that suits your morning. Notice the weather without turning the moment into another errand.',
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
      priority: 'Write down the one result that would make this block useful, then name its first small action. Keep the other ideas on a separate list instead of trying to fit them all in.',
      'phone-away': 'Move your phone out of easy reach and quiet nonessential alerts if you can. Keep access to calls or messages you need, then return to the task you chose.',
      'reset-break': 'Pause at your planned stopping point, look away from the work, and change position if comfortable. Leave the next action in a short note so coming back asks less of you.',
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
      'tidy-surface': 'Choose the bedside table, coffee table, or another spot you will see tonight. Return stray items to their homes and stop when that single surface is usable again.',
      tomorrow: 'Gather the keys, bag, clothes, or paperwork you already know you will need. Put them in one familiar place without turning this into a full plan for tomorrow.',
      'screen-free': 'Set the screen aside and choose something simple: a few pages, quiet music, or sitting with a drink. Let the activity be pleasant without needing to finish or achieve anything.',
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
      'tidy-workspace': 'Close what you were working on, put loose materials together, and clear a small space for the next day. Leave unfinished work with a brief note instead of reopening it tonight.',
      'brush-teeth': 'Follow your usual toothbrushing and face-washing routine with the products you already use. Keep the counter simple so you can finish your care without getting drawn into sorting the bathroom.',
      skincare: 'Use the familiar skincare steps that suit you, keeping the sequence as short as you need tonight. Put each product away as you go and stop when your usual care is complete.',
      pajamas: 'Change into comfortable sleepwear and place today’s clothes in the hamper or back where they belong. Choose what feels good tonight rather than adding another decision about how bedtime should look.',
      'tomorrow-list': 'Write a short list of what needs your attention tomorrow, with one clear place to begin. When another thought arrives, add a few words and leave the detailed planning for daytime.',
      journal: 'Write a few lines about the day, a thought you want to leave on the page, or something you noticed. Stop at a natural pause; a single honest sentence is enough.',
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
      'choose-room': 'Pick the room that would be most helpful to have ready for the week. Put away obvious strays and clear the areas you use most, leaving drawers and bigger projects for another time.',
      laundry: 'Choose one useful load, check the care labels, and start it with your usual settings. Set a reminder to return for drying and putting away; the machine time can sit between other steps.',
      'plan-week': 'Look over appointments, practical commitments, and anything you need to prepare. Note a few next actions and leave some space open instead of filling every available hour with a task.',
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
      dishes: 'Collect the dishes and wash or load a manageable batch. Start with what you will need next, then stop at your chosen time even if a larger pile still remains.',
      clutter: 'Find five things that have an obvious home and put them back. Skip objects that need a complicated decision so this stays a small tidy rather than an unexpected sorting project.',
      surfaces: 'Clear one frequently used surface and wipe it with a product suitable for the material. Let that area be the finish line, without following every mark into the next room.',
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
      dressed: 'Choose clothes that suit today’s plans and feel comfortable to move in. Add shoes when you are ready to leave, or set them beside the door if you stay barefoot indoors.',
      'wash-face': 'Use your familiar face-washing and toothbrushing steps, with what is already at the sink. Keep any optional grooming separate so this part has a clear and manageable finish.',
      breakfast: 'Choose something available that you can sit down and eat, even if it is very simple. If you need to leave soon, prepare an easy option you can take along.',
      bag: 'Check your plans and pack the few things they call for, such as keys, lunch, a charger, or paperwork. Look in the bag before adding duplicates and place it by the exit.',
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
      lunch: 'Put together a lunch you have access to and give yourself somewhere to eat it. Set the work aside for a while so the meal has its own space in the day.',
      water: 'Refill your glass or bottle and place it where you will be spending the afternoon. Take a drink if you want one, then leave it within comfortable reach for later.',
      outside: 'Step out to a nearby safe spot and notice the air, sounds, or sky. If going outside is not practical, pause by a window or in another part of the room.',
      'next-thing': 'Look at what is left today and choose one useful next action. Write it in a few words, leaving the rest of the list available without asking yourself to tackle it all.',
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
      'tomorrow-top': 'Write up to three things for your next workday, giving the first one a clear starting action. Include any detail you might forget, then leave the note where you will see it.',
      'clear-desk': 'Put away loose supplies, gather papers, and leave space for tomorrow’s first task. Save anything still open before moving it, and stop before tidying turns into a new project.',
      messages: 'Check for messages with a real deadline before your next workday and answer only what needs that attention. Put other follow-ups on your list so you can close the inbox deliberately.',
      'screens-off': 'Save your work and close the work apps and tabs you no longer need today. If you share the device with personal activities, switch to those after the work windows are closed.',
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
      'do-dishes': 'Collect the dishes and wash them or load the dishwasher in a practical order. Leave anything soaking that needs more time, with enough clear sink space for the next person to use.',
      'wipe-counters': 'Move the few things in your way and wipe the counters and cooled stovetop with a suitable cleaner. Focus on cooking spills and the area you will use for breakfast.',
      'shine-sink': 'Clear food scraps, rinse the basin, and wipe around the tap with your usual sink supplies. Stop when it is ready to use again; a polished finish is optional.',
      trash: 'Check whether the bin needs emptying and tie up the bag if it does. Replace the liner before you finish so the next person has a bin ready to use.',
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
      'hot-table': 'Return dishes and everyday objects to their usual homes, leaving space to sit or eat. Put undecided papers together in one spot rather than opening each envelope during this pass.',
      'hot-counter': 'Move belongings that are unrelated to preparing food and gather them for their next destination. Keep the appliances and supplies you use, with a clear space left for the next meal.',
      'hot-couch': 'Pick up clothes, cups, and other things that have landed on the seats. Fold the blanket if you want to, then stop when there is a comfortable place to sit.',
      'hot-entry': 'Pair the shoes, hang the coat you will use, and move bags out of the walkway. Leave keys in their familiar spot so the entry is useful when you next come or go.',
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
      toss: 'Look for obvious rubbish such as empty packaging and worn-out items that cannot be reused. Aim for up to fifteen easy decisions, using your usual recycling or disposal arrangements where appropriate.',
      donate: 'Choose usable belongings you already feel ready to pass on, checking that the donation destination accepts them. Stop before you start bargaining with yourself; fewer clear decisions are enough for this round.',
      door: 'Close and label the donation bag, then place it somewhere visible that does not block the doorway. Choose a realistic drop-off opportunity so the bag has a next step beyond waiting.',
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
      sort: 'Gather one load, empty pockets, and separate anything that needs different care. Choose the clothes or linens you most want ready next rather than trying to process every hamper at once.',
      start: 'Load the washer without overfilling it and use the detergent and cycle suited to the care labels. Start a reminder for the cycle’s finish before stepping away to do something else.',
      dry: 'Move the washed load to the dryer or rack according to the care labels. Spread items so they have room to dry, then set a reminder to check back when appropriate.',
      fold: 'Bring the dry load to one clear place and fold or hang the items in small groups. A practical fold is enough; focus on making the clothes easy to put away.',
      away: 'Take each group to its drawer, shelf, or hanging space and put the empty basket back. If a space is crowded, leave reorganizing it for another day and finish this load first.',
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
      vacuum: 'Vacuum the main walking routes and the floor areas that get the most use. Leave heavy furniture in place and move on after your time block rather than chasing every hidden corner.',
      dust: 'Use an appropriate cloth on the visible surfaces you can easily reach. Work from higher surfaces to lower ones where practical, leaving shelves of small objects for a separate, slower clean.',
      mop: 'Clear loose debris and mop the kitchen and bathroom with a method suited to the floor. Keep a dry route out and allow the area to dry before walking through it.',
      mirrors: 'Wipe visible marks from mirrors and frequently touched parts of doors with suitable supplies. Focus on what you can comfortably reach and stop before this becomes a whole-house glass-cleaning project.',
      magazines: 'Collect obvious unwanted papers and put them in the appropriate recycling or disposal place. Set aside anything with personal information or a decision attached rather than sorting every document during the timer.',
      sheets: 'Remove the used sheets, place them with the laundry, and put a fresh set on the bed. Keep the bedding arrangement simple so you can finish and move to the final task.',
      'all-trash': 'Visit the household bins, empty the ones that need it, and replace their liners. Gather the bags at your usual disposal point, checking that none are left in a walkway.',
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
      'slow-curtains': 'Open the curtains or blinds and take a moment to notice the light and weather. Leave the room as it is for now; this step does not need to become a morning tidy.',
      'slow-water': 'Pour some water and take a few comfortable sips before moving on. Keep the glass nearby if you want to finish it while you sit with your warm drink.',
      'slow-sit': 'Make a drink you enjoy, find your seat, and let it cool to a comfortable temperature. Spend a few minutes simply having it, with no requirement to read, plan, or be productive.',
      'slow-plan': 'Check appointments and choose the first thing that needs your attention today. Make any essential note, then close the plan so the morning can continue one step at a time.',
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
      'pf-away': 'Put your phone in the place you chose and leave essential contact options available. If you need it for a morning tool, use that function and return it to its spot afterward.',
      'pf-bed': 'Straighten the covers and pillows enough to leave a ready bed behind you. Keep the task brief so the phone-free time stays part of your morning rather than a cleaning challenge.',
      'pf-shower': 'Take your usual shower with your towel and clothes ready nearby. Let this be one activity at a time, finishing your familiar washing steps before moving on to breakfast.',
      'pf-eat': 'Prepare an easy breakfast and find somewhere to eat without opening a feed. Notice the meal or your surroundings, and check your phone afterward if that is the boundary you chose.',
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
      'mm-water': 'Have some water before you begin and leave your glass or bottle easy to reach. Take a comfortable amount without rushing to finish it as part of the checklist.',
      'mm-stretch': 'Try a few familiar, gentle movements within a comfortable range, seated or standing as suits you. Skip anything that hurts and let the five minutes be an upper limit rather than a target.',
      'mm-walk': 'Choose a familiar route and walk at a pace that feels manageable today. Turn back early if you need to, or use a short indoor route when heading outside is not practical.',
      'mm-shower': 'Rinse off if you want to and change into the clothes you need for the day. Put your walking things away so finishing the routine leaves you ready for what comes next.',
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
      'tbl-bed': 'Pull the bedding into place and straighten what you can in a couple of minutes. Leave the rest of the bedroom alone so the bed stays a quick part of getting out.',
      'tbl-dishes': 'Carry breakfast dishes to the sink or dishwasher and put clean ones away if needed. If there is no time to wash, gather them neatly without delaying your departure.',
      'tbl-counter': 'Move breakfast ingredients back to their places and wipe the patch of counter you used. Stay with visible crumbs and spills, leaving anything that needs a longer clean for later.',
      'tbl-bag': 'Check for keys and the essentials for today’s plans, including anything charging or waiting in the fridge. Put them in your bag now and make this your final step before leaving.',
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
      'dw-one': 'Choose one piece of work with a visible next action, such as drafting a section or solving a specific problem. Write what you intend to reach within this block, leaving the wider project aside.',
      'dw-phone': 'Quiet nonessential notifications and move the phone away from your working space. Keep any essential contact route available, then close unrelated tabs so your chosen work is ready in front of you.',
      'dw-timer': 'Start the timer and work on the task you chose, returning to it when you notice your attention wandering. Capture unrelated ideas in a few words and stop the block when the timer ends.',
      'dw-break': 'Save your work and note the next action before stepping away. Spend the break on something different from the task, such as a drink, a look outside, or a comfortable change of position.',
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
      'ic-urgent': 'Look for messages with a genuine deadline before your next check and reply where you can. If a response needs more work, acknowledge it as appropriate and capture the specific next action.',
      'ic-archive': 'Archive messages you have finished with and remove obvious clutter using your usual approach. Leave uncertain items for another pass rather than letting one complicated thread take the whole sorting window.',
      'ic-list': 'Move remaining actions onto your list with enough detail to find the message again. Add a date only when needed, then close the inbox at the stopping point you chose.',
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
      'ss-goal': 'Choose a specific question, section, or set of problems to work on. Write a small goal you can recognize at the end, such as explaining one concept or attempting several practice questions.',
      'ss-desk': 'Clear enough space for the materials you will actually use and set other things aside. Put water and your timer within reach so you can start without another round of preparation.',
      'ss-first': 'Start the timer and work through your chosen material, making brief notes in your own words. Mark confusing parts to revisit rather than stopping the whole session to chase every related topic.',
      'ss-break': 'Pause the material and step away from the desk if comfortable. Have a drink or look around the room, leaving a short note about where to resume when the break ends.',
      'ss-second': 'Return to the goal and try using what you covered through practice, recall, or explaining it aloud. End by noting one thing you understand and one question for the next session.',
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
      'pd-charge': 'Connect the phone at your chosen spot and leave it beyond easy reach from where you will sit. Keep the cable out of the walkway and any essential contact settings in place.',
      'pd-alarm': 'Set the alarm you need and check the time once before putting the phone back. Use this as the final practical check rather than opening messages or a feed along the way.',
      'pd-book': 'Open a book you feel like reading and settle into a few pages at your own pace. Stop at a comfortable point, even if that comes before the suggested reading time.',
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
      'ts-clothes': 'Choose clothes that fit tomorrow’s weather and plans, including any small items you often search for. Put them together somewhere easy to see, leaving room to change your mind in the morning.',
      'ts-bag': 'Pack the items you already know you need and check for anything missing or charging. Leave a short note for refrigerated food or other things that must go in at the last moment.',
      'ts-top': 'Choose one useful thing to begin with tomorrow and write its first action in a few words. Keep the rest of the list nearby without trying to work through it tonight.',
      'ts-lunch': 'Prepare an easy lunch from what you have, or gather the ingredients for a quick morning finish. Store it appropriately and put a reminder by your bag if it stays in the fridge.',
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
      'es-clothes': 'Place clothes that need washing in the hamper and hang up anything you plan to wear again. Keep this to today’s things rather than starting a wider laundry sort before your shower.',
      'es-shower': 'Set the water to a comfortable temperature and follow your usual washing routine. Take the time you need, then turn the water off and dry off carefully before stepping onto the floor.',
      'es-skin': 'Use your familiar skincare products in the order you already follow, keeping any optional steps optional. Put the products away as you finish so the sink is ready for its next use.',
      'es-pajamas': 'Change into clean, comfortable sleepwear and hang up your towel where it can dry. Let this be the end of getting ready, with the next part of the evening yours to choose.',
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
      'rb-dim': 'Lower any bright overhead lights and switch on a lamp that lets you read comfortably. Keep the route through the room easy to see, especially if you will be carrying a drink.',
      'rb-tea': 'Make a warm drink you enjoy in the evening and let it cool before sipping. Place it on a stable surface beside your reading spot, with nothing extra to prepare before opening the book.',
      'rb-read': 'Read at a comfortable pace and let the page be the only thing asking for attention. Use a bookmark whenever you are ready to stop, whether or not the twenty minutes are finished.',
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
      'fc-old': 'Check a small section for items you already know need discarding, following storage guidance and use-by labels. Leave uncertain decisions for a reliable food-storage reference rather than tasting something to check it.',
      'fc-wipe': 'Move the items from one small area and wipe visible spills using a method suited to the fridge. Dry the surface if needed and return the chilled items promptly before moving to another section.',
      'fc-sort': 'Put the remaining items back where you can see and reach them, following their storage instructions. Group similar things and bring the items you plan to use soon into an obvious position.',
      'fc-list': 'Write down the ingredients you need for the next few meals after checking what remains. Note something you can use from the fridge first, so the list starts with what is already available.',
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
      'bw-mirror': 'Wipe the mirror with a suitable product and cloth, concentrating on the marks you can easily reach. Finish this cleaner area first and leave the frame or shelves for another cleaning session.',
      'bw-sink': 'Move your toiletries aside and clean the sink and tap with suitable supplies. Follow any contact-time instructions on the product, then return only the everyday items you want at the sink.',
      'bw-toilet': 'Use the products and dedicated tools intended for your toilet, following their directions and required contact time. Keep those cloths separate from sink supplies and wash your hands when you finish.',
      'bw-towel': 'Replace the used hand towel with a clean one and put the old towel with the laundry. Hang the fresh towel where it can dry between uses, then put the cleaning supplies away.',
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
      'le-water': 'Put a glass or bottle of water within reach and take a few comfortable sips. Leave it nearby so you can return to it without another trip or a need to finish it now.',
      'le-eat': 'Choose food that asks little of you, such as something ready-made, leftovers, or an easy snack. Use what is accessible and ask for help preparing or bringing it over if you want.',
      'le-wash': 'Wash your face at the sink or use a comfortable alternative you already have available. Keep the step brief and return to your resting place afterward if that is what you need.',
      'le-one': 'Choose one small action that would make the next hour easier, such as plugging in a device or moving a cup. Stop after that action rather than treating it as the start of a longer list.',
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
      'ov-dump': 'Write down the tasks, worries, and reminders taking up space in your attention, using fragments if that is easier. Stop when the timer ends or the page feels sufficient; it need not be complete.',
      'ov-one': 'Circle one item you can take a small action on now, then name that action. Choose something concrete and manageable, leaving the rest visible on the page without sorting it all first.',
      'ov-timer': 'Set a ten-minute timer and give the chosen action your attention. If it turns out to be too large, do its first smaller piece and pause when the time ends to decide what you need next.',
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
      'am-breaths': 'Let three breaths come and go at a comfortable pace without forcing them deeper or holding them. If focusing on breathing feels uncomfortable, skip ahead and notice a familiar object in the room instead.',
      'am-ground': 'Look around and name five things you can see, quietly or aloud. You might notice their colors or shapes, with no need to find special objects or describe them in a particular way.',
      'am-air': 'If it feels comfortable, step into a familiar safe outdoor spot and notice what is around you. Otherwise, move to a window or another part of the room and pause there for a little while.',
    },
    smallStart: 'Look at one familiar object and name its color or shape. You can stay with that single detail and leave the breathing or change of scene out.',
  },
} satisfies Record<Exclude<RoutineLibraryId, 'house-cleaning'>, RoutineGuide>;

export function getRoutineGuide(id: RoutineLibraryId): RoutineGuide | undefined {
  return id === 'house-cleaning' ? undefined : ROUTINE_GUIDES[id];
}
