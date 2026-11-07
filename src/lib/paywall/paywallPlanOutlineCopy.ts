import type { LessonId } from '../../features/lessons/domain/lessonCatalogue';

interface PlanOutlineCopy {
  title: string;
  line: string;
}

/**
 * How the plan paywall sells each first-week lesson. Lesson copy teaches; this
 * says what the lesson gets you, and must stay true to the lesson it names.
 */
export const PLAN_OUTLINE_COPY: Partial<Record<LessonId, PlanOutlineCopy>> = {
  // Home
  'focus.trialhomevision': { title: 'Decide What Clean Means', line: 'Pick what a space is for, so tidying has a clear finish line.' },
  'breath.trialhome': { title: 'Start With One Small Drawer', line: 'Sort one small category and get a quick win you can repeat.' },
  'attention.trialskillsenseshome': { title: 'Stop Losing Your Keys', line: 'Give everyday things a home right where you use them.' },
  'focus.trialhomepasses': { title: 'Stop Cleaning Twice', line: 'Clean in the right order, so no job needs doing again.' },
  'focus.trialhomesort': { title: 'Skip the Storage Haul', line: 'Sort first, and see the space you need before you buy a thing.' },
  'attention.trialskillmuscleshomeready': { title: 'Choose the Right Cleaner', line: 'Know which product suits each surface before you spray.' },
  'focus.trialhomeroutine': { title: 'Build a Routine That Lasts', line: 'Split chores into daily and weekly jobs that fit your home.' },

  // Night
  'sleep.room': { title: 'Make Your Room Sleep-Ready', line: 'Fix the light, heat, or noise that keeps getting in your way.' },
  'breath.trialnight': { title: 'Give Your Evening an End', line: 'Decide when a task is done, so it can’t swallow your whole night.' },
  'attention.trialnightsenses': { title: 'Quiet the Bedtime What-Ifs', line: 'Separate what’s happening now from your predictions about tonight.' },
  'body.nightevening': { title: 'Wind Down Your Way', line: 'Choose a quieter last activity that takes you from busy to bed.' },
  'sleep.bed': { title: 'Retrain Your Bed for Sleep', line: 'Know exactly what to do when you’re lying awake and frustrated.' },
  'sleep.trialnightnote': { title: 'Park Tomorrow’s To-Dos', line: 'Write down the next step, so unfinished work can wait until morning.' },
  'sleep.anchor': { title: 'Find Your Sleep Rhythm', line: 'Set one steady wake-up time that gives your body clock a clear pattern.' },

  // Morning
  'body.inertia': { title: 'Get Past the Morning Fog', line: 'Learn why your first sleepy thoughts don’t predict your whole day.' },
  'breath.trialmorning': { title: 'Find Your First Move', line: 'Start with one small action instead of planning the entire day.' },
  'attention.trialskillsensesmorning': { title: 'Quiet the Morning Worry List', line: 'Pull your next step out of everything you’re worried about today.' },
  'body.trialmorningprep': { title: 'Set Up Tomorrow Tonight', line: 'Put one item in place and skip the search tomorrow morning.' },
  'sleep.morninganchor': { title: 'Steady Your Wake-Up', line: 'Choose a realistic wake time that gives your morning a solid start.' },
  'attention.trialskillmusclesmorningready': { title: 'Stop the Morning Rush', line: 'Spot the signs of rushing and simplify what comes next.' },
  'body.trialmorningfood': { title: 'Make Breakfast Easy', line: 'Choose a go-to option, so there’s one less decision to make.' },

  // Focus
  'focus.nextstep': { title: 'Make Starting Easy', line: 'Turn a vague job into one physical step you can begin right now.' },
  'breath.trialfocus': { title: 'Leave Yourself a Way Back', line: 'Write a quick note that saves your place when you have to switch.' },
  'attention.trialskillsensesfocus': { title: 'Get Back on Track Fast', line: 'Find exactly where you stopped and slip back into the task.' },
  'focus.parkthought': { title: 'Park Distracting Thoughts', line: 'Get stray thoughts on paper and keep working without losing them.' },
  'focus.trialphoneplace': { title: 'Set a Phone Boundary', line: 'Keep the checking away from your task and the features you need close.' },
  'attention.trialskillmusclesfocusready': { title: 'Find Out Why You Stopped', line: 'Let body tension point you to what’s blocking your work.' },
  'focus.trialsound': { title: 'Find Your Focus Sound', line: 'Test which sounds help you read and write, and which compete.' },

  // Stress
  'stress.trialsigns': { title: 'Spot Your Stress Pattern', line: 'See the event, the thought, and the reaction, and find your choice.' },
  'breath.trialstress': { title: 'Pause Before You Say Yes', line: 'Check your time first, so your answer is one you can keep.' },
  'attention.trialskillsensesstress': { title: 'Get Out of Your Head', line: 'Bring your attention back from worries to the task in front of you.' },
  'stress.trialnext': { title: 'Untangle Your To-Do List', line: 'Turn a crowded list into one next step with a real deadline.' },
  'stress.trialload': { title: 'Lighten the Load', line: 'Ask for one specific change, so not everything rests on you.' },
  'attention.trialskillmusclesstressready': { title: 'Take Breaks That Help', line: 'End a task clearly and make room for a break in a busy day.' },
  'stress.trialplan': { title: 'Keep What Works', line: 'Give the action that helped you a real place in your next week.' },

  // Overthinking
  'worry.trialloop': { title: 'Catch the Thought Loop', line: 'Recognize when your thinking repeats without solving anything.' },
  'breath.trialworry': { title: 'Sort Problems From What-Ifs', line: 'Find out which worries you can act on today and which can wait.' },
  'attention.trialskillsensesoverthinking': { title: 'Step Back Into the Moment', line: 'Give your attention one small detail to return to.' },
  'worry.trialaction': { title: 'Turn Worry Into Action', line: 'Decide what you’ll do, how, and when, so starting gets easier.' },
  'worry.trialfacts': { title: 'Separate Facts From Guesses', line: 'Check what happened against the meaning you added to it.' },
  'attention.trialskillmusclesoverthinkingready': { title: 'Give Worry Its Own Time', line: 'Set a short daytime slot, so you don’t have to follow every worry.' },
  'quiet.trialworryquestion': { title: 'Live With the Unanswered', line: 'Carry on with your day, even before you have certainty.' },

  // Anger
  'anger.meter': { title: 'Measure Your Anger', line: 'Catch it rising while you still have room to respond.' },
  'breath.trialanger': { title: 'Ask for What Needs Changing', line: 'Turn irritation into a clear request people can act on.' },
  'attention.trialskillsensesanger': { title: 'Hear What’s Being Asked', line: 'Listen for the actual request before you choose your reply.' },
  'quiet.trialangerfacts': { title: 'Check Before You Assume', line: 'Separate what someone did from the intention you guessed.' },
  'body.angerthirst': { title: 'Check Before You Snap', line: 'See if a basic need is making the moment harder.' },
  'attention.trialskillmusclesangerready': { title: 'Catch the Early Signs', line: 'Use your first cue as a reminder to choose your response.' },
  'quiet.angersmalldecision': { title: 'Choose Your Next Words', line: 'Focus on the part you control when someone else’s behavior isn’t.' },

  // Quiet
  'quiet.onesound': { title: 'Settle a Wandering Mind', line: 'Use one nearby sound as a simple place to come back to.' },
  'breath.trialquiet': { title: 'Let Thoughts Wait', line: 'Learn why a quiet pause doesn’t need an empty mind.' },
  'quiet.bodyfirst': { title: 'Come Back to Your Body', line: 'Use a simple sensation to ground you when thoughts pull you away.' },
  'quiet.trialquietcue': { title: 'Make Room for Quiet', line: 'Link a brief pause to a moment that’s already in your day.' },
  'attention.trialskillsensesquiet': { title: 'Notice Before You Judge', line: 'See an ordinary moment as it is before deciding how you feel.' },
  'attention.trialskillmusclesquietready': { title: 'Pause Before You React', line: 'Notice the urge to reply or check your phone without following it.' },
  'focus.trialquietphone': { title: 'Protect Your Quiet Time', line: 'Give your phone a place, so a pause stays yours.' },

  // Self-trust
  'quiet.trialpromise': { title: 'Make One Small Promise', line: 'Trade a broad intention for a specific step you can do.' },
  'breath.trialselftrust': { title: 'Be Fair to Yourself', line: 'Give yourself credit for what you did, even when it’s unfinished.' },
  'attention.trialskillsensesselftrust': { title: 'Count Your Wins', line: 'Recognize what you finished without turning it into a verdict on you.' },
  'quiet.yes': { title: 'Make Promises You Can Keep', line: 'Check your real schedule and find room before you commit.' },
  'quiet.cue': { title: 'Set a Reminder That Works', line: 'Put your cue right where the action begins.' },
  'attention.trialskillmusclesselftrustready': { title: 'Resize, Don’t Quit', line: 'Adjust an unrealistic promise instead of quietly dropping it.' },
  'quiet.trialkeeppromise': { title: 'Keep What Fits Your Life', line: 'Hold on to what helped and change what got in its way.' },

  // Recovery
  'body.signal': { title: 'Read Your Body’s Signals', line: 'Spot the basic need behind how you feel and try one small fix.' },
  'breath.trialrecovery': { title: 'Fit the Day to Your Energy', line: 'Resize or move a task when today isn’t the day you planned.' },
  'attention.trialskillsensesrecovery': { title: 'Work With Today', line: 'Choose a next step that fits the time and energy you have.' },
  'body.returnpath': { title: 'Make Coming Back Easy', line: 'Leave a simple reminder before you rest, so restarting takes less.' },
  'body.shareload': { title: 'Share the Load', line: 'Name one clear task and make it easy for someone to help.' },
  'attention.trialskillmusclesrecoveryready': { title: 'Check In Before You’re Empty', line: 'See what energy you have before taking on another demand.' },
  'quiet.recoverybodyfirst': { title: 'Put Your Body First', line: 'Respond to one body cue before adding another task.' },

  // Phone, work
  'focus.phoneworkdefault': { title: 'Break the Automatic Tap', line: 'Move one distracting app, so leaving hard work becomes a choice.' },
  'focus.trialphoneworkloop': { title: 'Catch the Urge to Check', line: 'See what happens just before you reach, and deal with that instead.' },
  'attention.trialskillphoneworksensesphone': { title: 'Get Back to Work Faster', line: 'Choose one specific action, no perfect mood required.' },
  'focus.trialphoneworkcompany': { title: 'Get Real Connection', line: 'Find the company you’re after, which a feed may not give you.' },
  'focus.trialphoneworkoffline': { title: 'Take a Real Break', line: 'Step away from feeds and leave yourself an easy way back.' },
  'attention.trialskillphoneworkmusclesphoneready': { title: 'Find the Need Behind the Reach', line: 'Work out what you want when your hand goes for your phone.' },
  'focus.trialphoneworkending': { title: 'Make Every Check Finish', line: 'Decide what “done” looks like before you open the app.' },

  // Phone, bedtime
  'focus.phonebedtimedefault': { title: 'Break the Bedtime Tap', line: 'Move one scrolling app and make that automatic reach easier to catch.' },
  'focus.trialphonebedtimeloop': { title: 'Spot Your Evening Trigger', line: 'Find what starts the scroll and choose a bedtime action instead.' },
  'attention.trialskillphonebedtimesensesphone': { title: 'Take Back Your Evening', line: 'See what scrolling replaces and choose what deserves your time.' },
  'focus.trialphonebedtimecompany': { title: 'Connect, Then Say Goodnight', line: 'Send a purposeful message or call, with an easy way to end it.' },
  'focus.trialphonebedtimeoffline': { title: 'Find Your Offline Evening', line: 'Give yourself one small thing to do when you close the feed.' },
  'attention.trialskillphonebedtimemusclesphoneready': { title: 'Pause Before the Reach', line: 'Give your next check a purpose and a finish.' },
  'focus.trialphonebedtimeending': { title: 'Make It the Last Check', line: 'Give your final check a purpose, an end, and something to do next.' },
};

/**
 * What someone has by the end of this lesson's day, for the callouts inside the
 * first week. Each line only names what the lessons so far have taught.
 */
export const FIRST_WEEK_DREAMS: Partial<Record<LessonId, string>> = {
  // Home
  'attention.trialskillsenseshome': 'You have a clear table, a sorted drawer, and a home for your keys.',
  'focus.trialhomesort': 'You clean in the right order and know what’s worth keeping.',
  'focus.trialhomeroutine': 'You have a simple routine that keeps your home from piling up again.',

  // Night
  'attention.trialnightsenses': 'Your room is set up for sleep and your evening has a clear end.',
  'sleep.bed': 'You have a wind-down you like and a plan for the nights you lie awake.',
  'sleep.anchor': 'You have a full evening routine and a steady wake-up time to build on.',

  // Morning
  'attention.trialskillsensesmorning': 'You have a first move ready, even when the day feels like too much.',
  'sleep.morninganchor': 'Tomorrow is set up the night before, with a wake time you can keep.',
  'body.trialmorningfood': 'You have a simpler morning, from wake-up to breakfast.',

  // Focus
  'attention.trialskillsensesfocus': 'You can start a task, save your place, and find your way back in.',
  'focus.trialphoneplace': 'Stray thoughts have a place to go, and your phone has a boundary.',
  'focus.trialsound': 'You have your own setup for starting, staying on task, and getting back.',

  // Stress
  'attention.trialskillsensesstress': 'You can see your stress pattern and pause before taking on more.',
  'stress.trialload': 'Your list has a clear next step, and you’ve asked for one thing to change.',
  'stress.trialplan': 'You have a plan for next week, built from what helped this week.',

  // Overthinking
  'attention.trialskillsensesoverthinking': 'You can catch a thought loop and tell a real problem from a what-if.',
  'worry.trialfacts': 'You have real next steps, and you can check a guess before believing it.',
  'quiet.trialworryquestion': 'You have a way back to your day, even when a question stays unanswered.',

  // Anger
  'attention.trialskillsensesanger': 'You can rate your anger, ask for what you need, and hear what’s asked.',
  'body.angerthirst': 'You check the facts and your basic needs before you respond.',
  'quiet.angersmalldecision': 'You have a plan for the moment anger starts to rise.',

  // Quiet
  'quiet.bodyfirst': 'You have simple ways back when your mind wanders.',
  'attention.trialskillsensesquiet': 'A quiet pause has a place in your day, and you can notice without judging.',
  'focus.trialquietphone': 'You have a daily pause, with your phone out of the way.',

  // Self-trust
  'attention.trialskillsensesselftrust': 'You’ve made one small promise and given yourself fair credit for it.',
  'quiet.cue': 'Your promises fit your real schedule, with reminders where they count.',
  'quiet.trialkeeppromise': 'You have a small habit that fits your life and a way to adjust it.',

  // Recovery
  'attention.trialskillsensesrecovery': 'You can spot what your body needs and fit today’s tasks to your energy.',
  'body.shareload': 'You have an easy way back after rest and help with one task.',
  'quiet.recoverybodyfirst': 'You check your energy before saying yes to one more thing.',

  // Phone, work
  'attention.trialskillphoneworksensesphone': 'You’ve moved one app, spotted your trigger, and have a way back to work.',
  'focus.trialphoneworkoffline': 'Your breaks give you real connection or real rest, not another feed.',
  'focus.trialphoneworkending': 'Your phone checks now have a purpose and a finish.',

  // Phone, bedtime
  'attention.trialskillphonebedtimesensesphone': 'You’ve moved one app, spotted your evening trigger, and chosen what’s next.',
  'focus.trialphonebedtimeoffline': 'You have offline ways to connect and unwind before bed.',
  'focus.trialphonebedtimeending': 'Your evenings have a last check, then something better to do.',
};
