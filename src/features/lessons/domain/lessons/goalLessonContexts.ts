import type { GoalLessonContext } from './goalLessonVariants';

/** Authored applications of shared teaching to each chosen goal. */
export const GOAL_LESSON_CONTEXTS = {
  night: {
    "breath.exhale": {
      "title": "A Softer Bedtime",
      "explanation": "**At bedtime, a breathing** guide gives you something simple to follow while the day is still on your mind. Let the next comfortable breath be enough.",
      "step": "Follow tonight’s breathing guide comfortably before settling for sleep.",
      "alternative": "Keep checking whether every breath has made me sleepy"
    },
    "plan.missed": {
      "title": "Sleep After a Miss",
      "explanation": "**A missed evening does** not need to become another worry in bed. Return to tonight’s small sleep step without adding yesterday’s tasks.",
      "step": "Return to tonight’s sleep step without making up missed sessions.",
      "alternative": "Double tonight’s practice to repair yesterday"
    },
    "plan.clear": {
      "title": "Ready for Bed",
      "explanation": "**A noisy video or** awkward pillow can become an extra obstacle when you want to settle. Change one immediate detail before following tonight’s practice.",
      "step": "Remove one small obstacle before tonight’s sleep practice.",
      "alternative": "Reorganize the whole bedroom before I can rest"
    },
    "plan.grows": {
      "title": "A Bedtime Rhythm",
      "explanation": "**Your sleep plan combines** small changes to your evening with short guided pauses. Follow tonight’s list rather than adding more practice to chase sleep.",
      "step": "Follow tonight’s listed steps without trying to force sleep.",
      "alternative": "Keep repeating practices until sleep is guaranteed"
    },
    "body.evening": {
      "title": "Let the Day End",
      "explanation": "**When you are trying** to sleep, carrying a busy evening straight into bed can leave no transition. Choose a quieter final activity that fits tonight.",
      "step": "Choose one quieter activity before getting ready for bed.",
      "alternative": "Keep working in bed until I become exhausted"
    },
    "quiet.rested": {
      "title": "Rest Before Bed",
      "explanation": "**At the end of** the day, another scroll can fill the time you meant to leave for winding down. Choose a break that leaves room for bedtime.",
      "step": "Take one screen-free pause while winding down for sleep.",
      "alternative": "Keep scrolling until I feel completely relaxed"
    },
    "body.inertia": {
      "title": "After a Rough Night",
      "explanation": "**A slow start after** waking can make you judge the whole night immediately. Give yourself a small morning transition before deciding how the day will go.",
      "step": "Give yourself a gentle start after waking from sleep.",
      "alternative": "Treat morning grogginess as proof the night was wasted"
    },
    "quiet.kind": {
      "title": "A Kinder Bedtime",
      "explanation": "**If sleep is taking** longer than you hoped, criticism adds another problem to the night. Speak to yourself as you would to someone having a difficult evening.",
      "step": "Replace one harsh bedtime thought with a kind, realistic sentence.",
      "alternative": "Scold myself until I finally fall asleep"
    },
    "quiet.bodyfirst": {
      "title": "Notice Bedtime Cues",
      "explanation": "**Before bed, a tight** jaw or raised shoulders can tell you what needs adjusting now. Respond to one comfortable body cue without testing whether sleep follows.",
      "step": "Notice and ease one comfortable body cue before bed.",
      "alternative": "Keep checking my body for proof I am asleep yet"
    },
    "focus.offline": {
      "title": "Leave the Scroll",
      "explanation": "**A phone break near** bedtime can become another stretch of watching and replying. Set it down for one quiet activity that lets the evening end.",
      "step": "Put your phone aside for one quiet bedtime activity.",
      "alternative": "Open another feed while waiting to feel sleepy"
    },
    "plan.carry": {
      "title": "Keep a Sleep Cue",
      "explanation": "**The end of this** plan is a chance to keep one useful evening change. Give it a clear place in your ordinary bedtime routine.",
      "step": "Choose one sleep-supporting habit and a realistic evening cue.",
      "alternative": "Keep every possible sleep habit regardless of my schedule"
    },
  },
  morning: {
    "attention.anchor": {
      "title": "Return to Morning",
      "explanation": "**Planning the whole day** during a short practice can pull you away from the first manageable step. Use the guide as a place to return before beginning your morning.",
      "step": "Return to the breathing prompt before your next morning step.",
      "alternative": "Restart the entire morning whenever my mind wanders"
    },
    "sleep.anchor": {
      "title": "A Steadier Wakeup",
      "explanation": "**When your wake time** shifts widely, it is harder to know what tomorrow morning will look like. Choose a realistic waking anchor rather than redesigning the whole day.",
      "step": "Choose a realistic wake time for tomorrow morning.",
      "alternative": "Change tomorrow’s wake time based on tonight’s mood"
    },
    "attention.effort": {
      "title": "An Easier Start",
      "explanation": "**Starting the morning does** not require proving how hard you can try. Follow the breathing guide comfortably, then choose a small first task that matches today’s energy.",
      "step": "Practise comfortably before choosing one manageable morning task.",
      "alternative": "Force bigger breaths to prove I am ready"
    },
    "attention.grows": {
      "title": "Small Morning Pauses",
      "explanation": "**More than one short** practice can fit around an ordinary morning. Use the listed guides as brief pauses rather than another demanding morning performance.",
      "step": "Give today’s listed practices a realistic place in your morning.",
      "alternative": "Add extra sessions until I feel perfectly awake"
    },
    "sleep.light": {
      "title": "Light After Waking",
      "explanation": "**When the morning feels** foggy, finding ordinary daylight is a concrete first move. Plan where that light can fit after you get out of bed.",
      "step": "Find a practical moment for daylight after waking.",
      "alternative": "Stay in a dim room until motivation arrives"
    },
    "sleep.weekend": {
      "title": "Steadier Weekend Mornings",
      "explanation": "**A weekend lie-in can** move the beginning of your day far from its usual place. Decide how to keep a workable wake rhythm while allowing some flexibility.",
      "step": "Choose a weekend wake time close to your usual morning.",
      "alternative": "Shift my waking time by several hours every weekend"
    },
    "sleep.hours": {
      "title": "Make Room for Sleep",
      "explanation": "**An easier morning begins** with leaving enough room for the previous night. Look at tomorrow’s wake time before agreeing to another late evening task that could wait until another day.",
      "step": "Protect time for sleep before tomorrow’s planned wake time.",
      "alternative": "Keep adding evening tasks and force the morning anyway"
    },
    "sleep.nap": {
      "title": "Rest and Tomorrow",
      "explanation": "**If you feel drained** today, an unplanned long nap can change when your evening starts. Make a deliberate rest choice with tomorrow morning in mind.",
      "step": "Keep any nap brief and consider tomorrow’s wake time.",
      "alternative": "Sleep through the afternoon without considering tonight"
    },
    "body.appetite": {
      "title": "Breakfast Without Blame",
      "explanation": "**After a rough night,** hunger may feel different from what you expected. Prepare a simple morning food option instead of treating appetite as a failure of discipline.",
      "step": "Prepare an easy breakfast option for your next morning.",
      "alternative": "Skip food to punish myself for a tired morning"
    },
    "focus.three": {
      "title": "A Clear Morning",
      "explanation": "**A morning packed with** an entire day’s obligations can feel impossible to begin. Name a few priorities and give the first one a small starting point.",
      "step": "Choose your morning priorities and name the first small action.",
      "alternative": "Try to begin every priority at once"
    },
    "body.evening": {
      "title": "Prepare the Morning",
      "explanation": "**Your morning can feel** rushed when every small decision waits until waking. Use one quieter evening moment to leave the first morning step easier to start.",
      "step": "Prepare one thing tonight that makes tomorrow morning easier.",
      "alternative": "Create a complicated evening checklist before I can begin"
    },
    "quiet.moving": {
      "title": "Wake Through Movement",
      "explanation": "**You do not need** to feel perfectly alert before making a gentle start. Notice a few ordinary movements while getting up rather than waiting for a special morning mood.",
      "step": "Notice your feet during one gentle movement this morning.",
      "alternative": "Wait in bed until I feel fully motivated"
    },
    "focus.ready": {
      "title": "Begin Before Ready",
      "explanation": "**Waiting to feel ready** can use up the small window you have in the morning. Pick a first action that is possible with the energy available now.",
      "step": "Begin one small morning task before waiting to feel ready.",
      "alternative": "Wait for complete confidence before starting the day"
    },
    "sleep.wind": {
      "title": "Tomorrow’s First Step",
      "explanation": "**If late tasks spill** right up to bed, the next morning starts with less room to recover. Choose one clear point for easing out of tonight’s activity.",
      "step": "Choose when to stop one evening activity before tomorrow morning.",
      "alternative": "Keep working until there is no time left for sleep"
    },
    "sleep.debt": {
      "title": "A Realistic Morning",
      "explanation": "**After several short nights,** an ambitious morning routine can ask for more than you have. Keep the morning small while making room for sleep again.",
      "step": "Reduce tomorrow’s morning demands after several short nights.",
      "alternative": "Add a harder routine to overcome tiredness"
    },
    "plan.carry": {
      "title": "Keep One Morning Cue",
      "explanation": "**A useful morning habit** needs a place in the day you actually have. Keep one small action and link it to something that already happens after waking.",
      "step": "Link one helpful morning action to an ordinary waking cue.",
      "alternative": "Keep an elaborate morning routine regardless of available time"
    },
    "body.dip": {
      "title": "Plan for the Dip",
      "explanation": "**A lower-energy afternoon can** lead you to overjudge how the morning went. Choose a smaller afternoon task while keeping tomorrow’s waking routine realistic.",
      "step": "Choose a smaller afternoon task after an energetic morning.",
      "alternative": "Treat an afternoon dip as proof my morning routine failed"
    },
    "body.strength": {
      "title": "A Sustainable Morning",
      "explanation": "**A demanding movement plan** can crowd out the morning action you actually wanted. Choose comfortable movement that fits your day instead of requiring an ambitious start.",
      "step": "Choose a manageable movement option for your morning.",
      "alternative": "Add a demanding workout before I can begin the day"
    },
    "body.walk": {
      "title": "Move Into the Day",
      "explanation": "**A short walk can** give a morning a simple transition after eating. Keep it practical rather than making a large outing the condition for starting your day.",
      "step": "Choose a short, practical walk after your morning meal.",
      "alternative": "Wait until I can plan a long perfect outing"
    },
    "body.sitting": {
      "title": "Break Up the Morning",
      "explanation": "**A morning can disappear** in one position once you sit down to work. Give yourself an ordinary chance to stand or adjust comfortably between tasks.",
      "step": "Change position comfortably between two morning tasks.",
      "alternative": "Stay in one position until every morning task is done"
    },
    "body.thirst": {
      "title": "A Morning Needs Check",
      "explanation": "**When waking feels slow,** a complicated routine can distract from ordinary needs. Check whether you want a drink before asking the morning to feel completely different.",
      "step": "Check whether you need a drink after waking.",
      "alternative": "Build a complicated routine before checking basic morning needs"
    },
  },
  focus: {
    "breath.exhale": {
      "title": "Pause Before Work",
      "explanation": "**When unfinished tasks crowd** your attention, a short breathing guide can give you a clear pause before choosing the task in front of you.",
      "step": "Follow the breathing guide before returning to one chosen task.",
      "alternative": "Use the pause to plan several tasks simultaneously"
    },
    "attention.anchor": {
      "title": "Return to the Task",
      "explanation": "**A thought about another** job can interrupt both guided practice and work. Practise returning to one current prompt rather than restarting whenever your attention moves.",
      "step": "Return to the guide, then to your chosen work step.",
      "alternative": "Restart my whole task whenever I notice a distraction"
    },
    "attention.effort": {
      "title": "Focus Without Force",
      "explanation": "**Straining to concentrate can** turn a small task into a test of willpower. Use comfortable effort in the guide and let the next work step stay manageable.",
      "step": "Follow the guide gently before one manageable work step.",
      "alternative": "Force my breathing to prove I can concentrate"
    },
    "attention.grows": {
      "title": "Pauses Around Work",
      "explanation": "**Your plan gives you** more than one way to pause between demands. Follow each listed guide, then return to a clearly chosen task instead of opening several at once.",
      "step": "Fit today’s listed pauses around one chosen work task.",
      "alternative": "Add more practice instead of ever returning to work"
    },
    "body.dip": {
      "title": "Work With the Dip",
      "explanation": "**When attention drops in** the afternoon, the next task may need to be smaller. Change what you ask of yourself before calling the whole work session a failure.",
      "step": "Choose a smaller work step during an afternoon energy dip.",
      "alternative": "Demand the same pace regardless of available energy"
    },
    "anger.cues": {
      "title": "Spot Work Friction",
      "explanation": "**A clenched jaw after** an interruption can be a cue to pause before replying. Notice it early so one frustrating moment does not take over the next work block.",
      "step": "Notice one frustration cue before returning to your work.",
      "alternative": "Reply sharply to every interruption before continuing"
    },
    "body.movement": {
      "title": "Move Between Tasks",
      "explanation": "**After sitting with a** difficult task, you may keep rereading without taking anything in. A brief movement break gives you a defined pause before returning to the same next step.",
      "step": "Take a brief movement break before resuming one work step.",
      "alternative": "Keep rereading indefinitely without changing anything"
    },
    "body.walk": {
      "title": "A Workday Walk",
      "explanation": "**A short walk after** eating can be a clear boundary between lunch and the next task. Decide what you will return to before stepping away.",
      "step": "Choose your next work step before a short lunchtime walk.",
      "alternative": "Let a break turn into choosing five unrelated tasks"
    },
    "sleep.anchor": {
      "title": "Protect Tomorrow’s Focus",
      "explanation": "**A work session can** run into the time you meant to leave for sleep. Protect a realistic waking rhythm instead of trying to recover focus through another late push.",
      "step": "Keep tomorrow’s wake time in mind when ending work.",
      "alternative": "Keep working late every time concentration drops"
    },
    "quiet.notice": {
      "title": "Name the Distraction",
      "explanation": "**A feeling such as** worry can sit underneath repeated tab switching. Give it a plain name so you can choose whether it needs an action or can wait.",
      "step": "Name the feeling behind one work distraction.",
      "alternative": "Open another tab without noticing what pulled me away"
    },
    "body.sitting": {
      "title": "A Break With an End",
      "explanation": "**Long stretches in one** position can make work feel harder to stay with. Stand or adjust comfortably, then come back to the small step you left ready.",
      "step": "Change position comfortably between two focused work steps.",
      "alternative": "Stay rigidly still until the whole task is finished"
    },
    "sleep.caffeine": {
      "title": "Coffee and Work",
      "explanation": "**Another late coffee can** become your default answer to unfinished work. Check the time and consider your sleep before choosing how to handle the remaining task.",
      "step": "Check the time before using more caffeine to keep working.",
      "alternative": "Use another late coffee whenever a task feels hard"
    },
    "anger.rumination": {
      "title": "Leave the Replay",
      "explanation": "**Replaying a frustrating conversation** can take the place of the work you meant to do. Write down any useful next action, then return to the current task.",
      "step": "Park one frustrating replay and return to your chosen task.",
      "alternative": "Rehearse the argument until I find a perfect reply"
    },
    "body.inertia": {
      "title": "Start Through the Fog",
      "explanation": "**At the beginning of** a workday, grogginess can make a large task look even larger. Allow a waking transition and name a first action you can actually start.",
      "step": "Choose a small first work step while waking up gradually.",
      "alternative": "Judge my whole workday by the first foggy minute"
    },
    "anger.control": {
      "title": "Choose Your Work Move",
      "explanation": "**A late reply or** noisy colleague may be outside your control. Separate that frustration from the next work action you can choose in the space available.",
      "step": "Choose one work action within your control right now.",
      "alternative": "Wait for everyone else to change before beginning work"
    },
    "body.thirst": {
      "title": "Check Basic Needs",
      "explanation": "**If your attention is** wandering, it is easy to keep changing apps without checking an ordinary need. Check whether a drink would help before redesigning your work system.",
      "step": "Check whether you need a drink before restarting work.",
      "alternative": "Build a new productivity system before checking basic needs"
    },
    "sleep.hours": {
      "title": "Protect Tomorrow’s Work",
      "explanation": "**Finishing one more task** tonight can take time from the night before tomorrow’s work. Choose a stopping point that leaves realistic room for sleep before another ordinary workday begins.",
      "step": "Set a work stopping point that leaves room for sleep.",
      "alternative": "Keep extending work until every task is complete"
    },
    "quiet.rested": {
      "title": "A Break That Ends",
      "explanation": "**A feed can turn** a planned work break into more input and more decisions. Choose one simple pause and leave a clear next action for your return.",
      "step": "Choose a screen-free work break and a clear return step.",
      "alternative": "Scroll without deciding when or where to return"
    },
    "body.appetite": {
      "title": "Work After Rough Sleep",
      "explanation": "**After a short night,** changes in appetite can sit alongside a difficult workday. Make room for an ordinary meal instead of trying to work through every signal.",
      "step": "Make room for a meal during a tired workday.",
      "alternative": "Skip meals to make up for slower concentration"
    },
    "quiet.moving": {
      "title": "Attention in Motion",
      "explanation": "**A brief walk between** work blocks can still be a chance to notice one thing at a time. Let your feet be the focus rather than reopening the whole task list.",
      "step": "Notice your steps during a short break from work.",
      "alternative": "Use every moment of the break for more messages"
    },
    "sleep.light": {
      "title": "Begin in Daylight",
      "explanation": "**If you start work** in a dim room, finding ordinary daylight can be a concrete part of waking into the day. Choose a practical place for it before settling to work.",
      "step": "Find a practical daylight moment before your first work block.",
      "alternative": "Stay in the same dim room all day to save time"
    },
    "sleep.debt": {
      "title": "Scale the Workload",
      "explanation": "**After repeated short nights,** asking for a perfect workday can keep you pushing without a clear limit. Choose essential work and make space for sleep again.",
      "step": "Reduce nonessential work after several short nights.",
      "alternative": "Add more tasks to prove tiredness is irrelevant"
    },
    "anger.boring": {
      "title": "Before Blaming Focus",
      "explanation": "**When a small interruption** feels unbearable, check whether you need food, water or a pause. Meet one ordinary need before deciding you cannot concentrate today.",
      "step": "Check one basic need when work frustration starts rising.",
      "alternative": "Treat every irritated moment as a failure of concentration"
    },
    "quiet.gap": {
      "title": "Pause at the Switch",
      "explanation": "**When a notification arrives,** the gap before opening it is a chance to keep your place. Notice the urge and choose whether the message needs your attention now.",
      "step": "Pause before switching away from your current work task.",
      "alternative": "Open every notification before deciding if it matters"
    },
    "quiet.kind": {
      "title": "Speak to Your Focus",
      "explanation": "**Losing your place does** not need to become a verdict on your ability. Use a plain, kind instruction that points back to the next small work step.",
      "step": "Replace one harsh focus judgment with your next work step.",
      "alternative": "Criticize myself until concentration returns"
    },
    "quiet.thoughts": {
      "title": "Thoughts While Working",
      "explanation": "**The thought that you** will never finish can arrive before you have begun. Notice it as a thought, then choose the next small action the task actually requires.",
      "step": "Notice one discouraging thought and begin the next work step.",
      "alternative": "Wait until every discouraging thought disappears before starting"
    },
    "plan.carry": {
      "title": "Keep a Focus Cue",
      "explanation": "**The plan ends, but** a simple work pause can still fit beside an ordinary cue. Keep one useful way to begin or return to a task.",
      "step": "Link one focus habit to a realistic workday cue.",
      "alternative": "Create a demanding new productivity routine for every day"
    },
  },
  quiet: {
    "plan.missed": {
      "title": "Return to Quiet",
      "explanation": "**Missing a quiet moment** can become another reason to rush or criticize yourself. Begin with today’s small step rather than turning the missed one into a debt.",
      "step": "Return to one quiet moment without making up missed practice.",
      "alternative": "Double my practice to earn permission to begin again"
    },
    "attention.effort": {
      "title": "Quiet Without Force",
      "explanation": "**Trying to make yourself** calm can turn a short breathing pause into another demand. Let the guide be comfortable without requiring silence in your thoughts.",
      "step": "Follow the breathing guide without demanding a perfectly quiet mind.",
      "alternative": "Force larger breaths until every thought stops"
    },
    "attention.grows": {
      "title": "Several Ways to Pause",
      "explanation": "**A quieter day can** include different kinds of small pauses. Follow the guides listed today and notice what each asks you to attend to without grading your mood.",
      "step": "Follow today’s pauses without requiring a particular calm feeling.",
      "alternative": "Repeat one practice until I feel completely calm"
    },
    "anger.cues": {
      "title": "Notice the Build Up",
      "explanation": "**A tight jaw or** faster reply can show that an ordinary moment is getting louder inside. Notice one early cue and leave yourself room before responding.",
      "step": "Notice one rising tension cue before responding.",
      "alternative": "Ignore the tension until I react sharply"
    },
    "breath.exhale": {
      "title": "A Comfortable Pause",
      "explanation": "**When the day feels** noisy, the breathing guide offers one simple instruction at a time. Follow comfortably rather than using the practice as a test of how calm you can become.",
      "step": "Follow the breathing guide as one quiet pause today.",
      "alternative": "Force each breath to make the whole day calm"
    },
    "body.dip": {
      "title": "A Gentler Afternoon",
      "explanation": "**An afternoon energy dip** can feel like you have lost the quiet you found earlier. Adjust the size of your next step instead of fighting the whole afternoon.",
      "step": "Choose a gentler task when afternoon energy dips.",
      "alternative": "Push harder because a quieter afternoon must be earned"
    },
    "anger.control": {
      "title": "A Quieter Next Move",
      "explanation": "**A delay or another** person’s mood can pull you into trying to fix everything. Separate what is happening from the next small response you can choose.",
      "step": "Choose one calm response within your control.",
      "alternative": "Keep arguing with what I cannot change"
    },
    "anger.rumination": {
      "title": "Set Down the Replay",
      "explanation": "**A conversation can keep** running after the other person has gone. Notice when you are rehearsing it again and return to one ordinary thing around you.",
      "step": "Notice a replay and return to one nearby sound.",
      "alternative": "Replay the conversation until I win it perfectly"
    },
    "anger.meter": {
      "title": "Notice the Volume",
      "explanation": "**A small annoyance can** grow before you name it. Describing its intensity gives you a clearer starting point for choosing a quiet pause or a later conversation.",
      "step": "Name how strong an irritation feels before responding.",
      "alternative": "Wait until irritation is overwhelming before noticing it"
    },
    "anger.recovery": {
      "title": "Space Before Replying",
      "explanation": "**When a message makes** you want to react immediately, a brief pause can make room for a deliberate reply. Let the first response wait while you notice what is around you.",
      "step": "Pause before replying to one message that unsettles you.",
      "alternative": "Send the first reply to get the feeling over with"
    },
    "body.movement": {
      "title": "A Moving Pause",
      "explanation": "**A quieter moment does** not require staying completely still. Use an ordinary change of position or short walk to notice your body without adding another task.",
      "step": "Notice one comfortable movement during a quiet pause.",
      "alternative": "Force myself to stay perfectly still despite discomfort"
    },
    "sleep.anchor": {
      "title": "Quiet Has a Rhythm",
      "explanation": "**A rushed night can** spill into the next day’s attempts to slow down. Keep a realistic waking anchor while making one small evening change that leaves room for rest.",
      "step": "Choose a realistic waking anchor for a less rushed day.",
      "alternative": "Change every part of my sleep routine at once"
    },
    "anger.belief": {
      "title": "Question the Story",
      "explanation": "**A small event can** feel much louder when you decide what someone must have meant. Notice the difference between what happened and the story you added before choosing your response.",
      "step": "Separate one upsetting event from the story you added.",
      "alternative": "Treat my first interpretation as certain and respond immediately"
    },
    "body.thirst": {
      "title": "Care Before Criticism",
      "explanation": "**Feeling unsettled can send** you searching for a complicated explanation. Check one ordinary need first so your quiet moment includes care for the body you are in.",
      "step": "Check whether you need a drink during an unsettled moment.",
      "alternative": "Ignore ordinary needs until I can explain every feeling"
    },
    "focus.phone": {
      "title": "Quiet Without Pings",
      "explanation": "**Even a quiet room** can become busy when every alert brings a new request. Put the phone somewhere deliberate for one small pause rather than checking it throughout the pause.",
      "step": "Put your phone out of easy reach for a quiet pause.",
      "alternative": "Leave every alert open while trying to slow down"
    },
    "anger.bucket": {
      "title": "Leave Some Room",
      "explanation": "**Several small pressures can** make the next minor problem feel enormous. Notice what is already taking space and reduce one avoidable demand before it spills into your response.",
      "step": "Reduce one avoidable demand when your day feels too full.",
      "alternative": "Add more obligations until the pressure disappears"
    },
    "anger.timeout": {
      "title": "A Pause With a Return",
      "explanation": "**If a conversation is** getting too heated for the quieter response you want, ask for a pause and name when you will return. Quiet can include a clear boundary.",
      "step": "Ask for a brief pause and name when you’ll return.",
      "alternative": "Disappear from the conversation without saying whether I will return"
    },
    "focus.parkthought": {
      "title": "Let a Thought Wait",
      "explanation": "**A quiet moment may** bring a task you are afraid of forgetting. Write a short reminder so the thought has a place without taking over the whole pause.",
      "step": "Write one reminder, then return to your quiet moment.",
      "alternative": "Keep rehearsing the task throughout the pause"
    },
    "sleep.caffeine": {
      "title": "A Quieter Evening",
      "explanation": "**A late coffee may** fit your afternoon habit while working against the quieter evening you want. Check when you are drinking it before adding more to a busy day.",
      "step": "Check caffeine timing before planning your quieter evening.",
      "alternative": "Use late coffee whenever the day feels difficult"
    },
    "anger.boring": {
      "title": "Check the Ordinary",
      "explanation": "**An ordinary need can** hide underneath a sharp or restless moment. Before judging your ability to stay calm, check food, water or the need for a pause.",
      "step": "Check one basic need before judging an unsettled mood.",
      "alternative": "Treat every restless moment as proof I cannot be calm"
    },
    "body.sitting": {
      "title": "Ease the Position",
      "explanation": "**A quiet pause can** become uncomfortable if you treat sitting still as a rule. Change your position gently so noticing the moment does not require ignoring your body.",
      "step": "Adjust your position comfortably during a quiet pause.",
      "alternative": "Hold an uncomfortable position to prove I am doing it properly"
    },
    "focus.badges": {
      "title": "Fewer Little Demands",
      "explanation": "**A red badge can** make a quiet moment feel like something needs an immediate response. Remove one unnecessary alert so fewer small demands interrupt your attention.",
      "step": "Turn off one unnecessary badge that interrupts quiet moments.",
      "alternative": "Clear every badge before allowing myself a pause"
    },
    "body.inertia": {
      "title": "Quiet After Waking",
      "explanation": "**The first foggy minutes** of a morning do not decide the tone of the whole day. Begin gently and allow a transition before demanding that you feel settled.",
      "step": "Give yourself a gentle transition after waking.",
      "alternative": "Judge my whole day by how I feel immediately awake"
    },
    "sleep.hours": {
      "title": "Leave Room for Rest",
      "explanation": "**A quieter day is** harder to arrange if every evening task pushes sleep later. Choose a stopping point that leaves realistic room for the night ahead.",
      "step": "Choose an evening stopping point that leaves room for sleep.",
      "alternative": "Keep adding evening tasks until nothing remains unfinished"
    },
    "anger.expectation": {
      "title": "Say What You Need",
      "explanation": "**A quiet relationship moment** can become tense when an unspoken expectation goes unmet. Say one concrete need plainly rather than waiting for someone to guess it.",
      "step": "State one small need clearly before resentment grows.",
      "alternative": "Stay silent and expect the other person to guess"
    },
    "sleep.wind": {
      "title": "A Quieter Ending",
      "explanation": "**An evening with no** boundary can carry the day’s activity right into bed. Choose one ordinary way to end the last busy task and begin winding down.",
      "step": "Choose a quieter final activity for your evening.",
      "alternative": "Keep switching between tasks until I collapse into bed"
    },
    "plan.carry": {
      "title": "Keep a Quiet Cue",
      "explanation": "**A quiet moment can** stay small after the plan ends. Choose one practice you can fit beside an ordinary part of the day without waiting for ideal conditions.",
      "step": "Give one quiet practice a realistic everyday cue.",
      "alternative": "Wait for a completely empty day before practising again"
    },
  },
  home: {
    "attention.anchor": {
      "title": "Return to One Spot",
      "explanation": "**When one surface leads** you to notice the whole room, attention can scatter before you finish anything. Practise returning to one prompt, then one chosen spot at home.",
      "step": "Return to one chosen home task after following the guide.",
      "alternative": "Restart the whole room whenever another mess catches my eye"
    },
    "attention.effort": {
      "title": "A Gentler Home Reset",
      "explanation": "**A home reset does** not need to become a test of effort. Follow the breathing guide comfortably, then choose a task small enough for the energy available.",
      "step": "Practise comfortably before one manageable home task.",
      "alternative": "Push through discomfort to prove I deserve a tidy home"
    },
    "attention.grows": {
      "title": "Pauses Around Tidying",
      "explanation": "**A short guide can** make a clear pause before returning to a small home task. Follow today’s listed practices without turning them into more jobs to complete perfectly.",
      "step": "Fit today’s listed pauses around one small home task.",
      "alternative": "Add extra practice before I am allowed to tidy anything"
    },
    "breath.exhale": {
      "title": "Pause Before Sorting",
      "explanation": "**When a cluttered space** feels like many decisions at once, use a comfortable breathing pause before choosing one item or one surface to work on.",
      "step": "Follow the breathing guide before sorting one small home area.",
      "alternative": "Plan the entire house during every breath"
    },
    "quiet.kind": {
      "title": "Mess Without Blame",
      "explanation": "**Seeing an untidy room** can bring a harsh judgment about yourself. Replace the judgment with a description of one thing you can put away now.",
      "step": "Replace one harsh judgment with a small home action.",
      "alternative": "Criticize myself until the whole room becomes tidy"
    },
    "focus.inbox": {
      "title": "A Place for Papers",
      "explanation": "**Mail and loose papers** can become many unfinished decisions spread across a room. Give incoming papers one clear place before deciding which single item needs action.",
      "step": "Gather loose home papers into one clear incoming place.",
      "alternative": "Read and resolve every paper while collecting it"
    },
    "body.appetite": {
      "title": "Care Before Chores",
      "explanation": "**After a rough night,** you may need food before tackling the mess. Meet an ordinary need and choose a smaller household task instead of expecting unlimited energy.",
      "step": "Eat if needed before choosing a smaller household task.",
      "alternative": "Skip food until every household chore is complete"
    },
    "focus.ready": {
      "title": "Begin the Small Job",
      "explanation": "**Waiting to feel ready** for the whole room can stop you from moving one cup. Choose a first action that does not require finishing the entire space.",
      "step": "Begin one small home task before feeling fully ready.",
      "alternative": "Wait until I feel ready to clean the entire home"
    },
    "focus.done": {
      "title": "A Home Stopping Point",
      "explanation": "**A room will keep** being used after you tidy it. Decide what this small tidy-up includes so you can finish without expanding it into every visible job.",
      "step": "Name a clear stopping point for one small tidy-up.",
      "alternative": "Keep adding chores whenever another unfinished item appears"
    },
    "plan.carry": {
      "title": "Keep One Home Cue",
      "explanation": "**A useful home habit** can be smaller than a complete tidy. Link one action, such as returning an item, to a moment that already happens at home.",
      "step": "Link one small home reset to an everyday cue.",
      "alternative": "Create a whole-house cleaning promise for every day"
    },
    "focus.return": {
      "title": "Return to One Home Step",
      "explanation": "**A missed tidy does** not mean every household job must be caught up at once. Choose one small home task that fits the time and energy you have now.",
      "step": "Return to one small home task without catching up.",
      "alternative": "Complete every missed chore before allowing a fresh start"
    },
    "focus.blocks": {
      "title": "A Small Home Block",
      "explanation": "**A whole room can** feel too big for the time you have. Give one small household job a bounded window so beginning does not commit you to cleaning everything.",
      "step": "Give one small home task a clear, short window.",
      "alternative": "Keep working until every room is completely finished"
    },
  },
  phone: {
    "attention.anchor": {
      "title": "Return From the Pull",
      "explanation": "**An urge to check** another app can interrupt even a short pause. Practise returning to the guide so you have a clear next move when your attention is pulled away.",
      "step": "Return to the guide when an urge to check appears.",
      "alternative": "Open another app every time the urge appears"
    },
    "breath.exhale": {
      "title": "Pause Before Opening",
      "explanation": "**An uncomfortable moment can** become an automatic reach for a feed. Follow a comfortable breathing pause before deciding whether you actually want to open the phone.",
      "step": "Follow the breathing guide before deciding whether to scroll.",
      "alternative": "Open a feed to avoid noticing what I need"
    },
    "attention.effort": {
      "title": "No Perfect Detox",
      "explanation": "**Changing phone habits does** not require doing every pause perfectly. Keep the breathing guide comfortable rather than making it another test to pass before putting the phone down.",
      "step": "Practise gently without requiring a perfect break from your phone.",
      "alternative": "Force the practice to prove I can quit scrolling"
    },
    "attention.grows": {
      "title": "Pauses Beyond the Feed",
      "explanation": "**Your plan offers short** guides that give the phone a clear purpose and an ending. Follow today’s list, then leave the app rather than drifting into another feed.",
      "step": "Finish today’s listed guides, then put the phone aside.",
      "alternative": "Treat finishing a guide as a cue to browse another feed"
    },
    "sleep.anchor": {
      "title": "A Morning Without Feed",
      "explanation": "**Your waking routine can** start with a choice before the feed starts choosing for you. Keep a realistic wake anchor and decide where the phone will wait.",
      "step": "Choose where your phone waits when you wake tomorrow.",
      "alternative": "Begin every morning in a feed before deciding what matters"
    },
    "quiet.thoughts": {
      "title": "Notice the Scroll Story",
      "explanation": "**The thought that you** might miss something can keep your thumb moving after you meant to stop. Notice the thought before deciding whether a check is actually useful.",
      "step": "Notice one fear-of-missing-out thought before reopening a feed.",
      "alternative": "Treat every thought about missing out as an instruction"
    },
    "focus.offline": {
      "title": "Rest Beyond the Screen",
      "explanation": "**A phone break can** be a useful pause, but another feed may fill it with more input. Choose one simple offline activity to try when you want an actual break.",
      "step": "Choose one offline activity for your next phone break.",
      "alternative": "Switch feeds whenever the current one stops feeling restful"
    },
    "sleep.threeam": {
      "title": "The Nighttime Check",
      "explanation": "**Waking in the night** can lead to checking the time, messages and then a feed. Keep the phone out of the chain and use an ordinary nearby cue instead.",
      "step": "Leave messages unopened if you wake during the night.",
      "alternative": "Check every notification before trying to settle again"
    },
    "quiet.kind": {
      "title": "After an Extra Scroll",
      "explanation": "**Scrolling longer than intended** does not erase your next choice. Replace the harsh verdict with one concrete stopping action that returns you to the day.",
      "step": "Use a kind instruction to end one unplanned scroll.",
      "alternative": "Punish myself before I am allowed to put the phone down"
    },
    "plan.carry": {
      "title": "Keep a Phone Boundary",
      "explanation": "**A useful phone boundary** needs an ordinary place in your day. Keep one stopping cue or offline alternative that you can repeat without building a perfect digital routine.",
      "step": "Choose one phone boundary and a realistic daily cue.",
      "alternative": "Promise never to feel an urge to check again"
    },
    "focus.phone": {
      "title": "A Deliberate Distance",
      "explanation": "**If the phone stays** within reach, a small urge can turn into an unplanned check. Pick one ordinary offline activity and choose where the phone will wait.",
      "step": "Move your phone out of reach during one offline activity.",
      "alternative": "Keep the phone beside my hand and rely on willpower"
    },
    "focus.badges": {
      "title": "Remove One Phone Cue",
      "explanation": "**An unread badge can** pull you into an app even when you had no reason to open it. Remove one unnecessary badge before the next automatic check.",
      "step": "Turn off one unnecessary badge that pulls you into checking.",
      "alternative": "Open every badge immediately so I never see an unread count"
    },
  },
  recovery: {
    "attention.anchor": {
      "title": "Return Without Catchup",
      "explanation": "**On a low-capacity day,** distraction can make even a short pause feel unfinished. Return to the current guide instead of adding more work to catch up.",
      "step": "Return to the current prompt without adding catch-up practice.",
      "alternative": "Restart the whole session whenever my attention drifts"
    },
    "breath.exhale": {
      "title": "A Low-Demand Pause",
      "explanation": "**When you have little** energy to spare, a breathing guide can be one bounded pause. Follow comfortably without making recovery another task you must perform well.",
      "step": "Follow the breathing guide gently on today’s low-capacity day.",
      "alternative": "Push my breathing harder to make recovery happen faster"
    },
    "attention.effort": {
      "title": "Care Within Capacity",
      "explanation": "**A tired day can** make you feel you should work harder at resting. Keep the breathing practice comfortable and small enough to fit the capacity you have now.",
      "step": "Use comfortable effort during today’s short recovery practice.",
      "alternative": "Force every prompt despite discomfort to prove I am recovering"
    },
    "attention.grows": {
      "title": "Small Separate Pauses",
      "explanation": "**More than one listed** practice does not need to become one large effort. Follow each guide in its own small window and let the list set the limit.",
      "step": "Give today’s listed practices separate, manageable places in your day.",
      "alternative": "Add more sessions because recovery should be a full-time task"
    },
    "sleep.anchor": {
      "title": "A Steadier Recovery Day",
      "explanation": "**When energy is low,** the whole day can lose its shape. A realistic waking anchor gives one predictable point without requiring a demanding routine around it.",
      "step": "Choose a realistic wake anchor for a low-capacity day.",
      "alternative": "Build an ambitious morning schedule to prove I am improving"
    },
    "body.sitting": {
      "title": "Comfort Counts Too",
      "explanation": "**Rest does not require** holding one position until it becomes uncomfortable. Adjust how you are sitting or lying so a recovery pause stays responsive to your needs.",
      "step": "Change position comfortably during a low-energy pause.",
      "alternative": "Stay in an uncomfortable position because rest means staying still"
    },
    "quiet.bodyfirst": {
      "title": "Listen Before Adding",
      "explanation": "**When you are depleted,** the next useful action may be responding to a tight jaw or an awkward position. Notice one body cue before adding another recovery task.",
      "step": "Respond gently to one body cue before adding another task.",
      "alternative": "Add more activities before noticing discomfort"
    },
    "sleep.light": {
      "title": "A Small Daylight Step",
      "explanation": "**A low-capacity day may** need the smallest available version of getting light. Choose a practical daylight moment without turning it into a demanding outing.",
      "step": "Choose an accessible daylight moment that fits today’s energy.",
      "alternative": "Plan a long outing before allowing a small light break"
    },
    "anger.bucket": {
      "title": "Lower the Load",
      "explanation": "**On a low-capacity day,** several small requests can already fill the available space. Remove or delay one nonessential demand before asking more of yourself.",
      "step": "Delay one nonessential demand when today’s capacity feels full.",
      "alternative": "Keep every obligation because resting must wait until everything is done"
    },
    "quiet.wander": {
      "title": "Rest With Thoughts",
      "explanation": "**A wandering mind does** not mean your pause has failed. On a tired day, notice the thought and return gently without making yourself solve it first.",
      "step": "Let one thought wait during a low-demand recovery pause.",
      "alternative": "Resolve every thought before I am allowed to rest"
    },
    "plan.carry": {
      "title": "Keep a Gentle Floor",
      "explanation": "**A recovery habit should** still fit on a day with little available energy. Choose one small action and leave an easier version ready for harder days.",
      "step": "Choose one gentle care action and its easier fallback.",
      "alternative": "Keep increasing the habit regardless of available energy"
    },
  },
  selfTrust: {
    "attention.anchor": {
      "title": "Return to Your Choice",
      "explanation": "**Distraction can make a** small promise feel broken before it is finished. Practise returning to one prompt so returning to your own chosen action feels like an available next move.",
      "step": "Return to your chosen action after following the current prompt.",
      "alternative": "Treat one distraction as proof I cannot trust myself"
    },
    "attention.effort": {
      "title": "A Promise That Fits",
      "explanation": "**A small promise does** not become more trustworthy when it requires discomfort. Follow the breathing guide gently and practise respecting the limits you notice today.",
      "step": "Respect comfort while following today’s guided practice.",
      "alternative": "Ignore discomfort to prove I keep every promise"
    },
    "attention.grows": {
      "title": "Choose Manageable Pauses",
      "explanation": "**Keeping a small commitment** works best when you know what it includes. Follow the practices listed today without adding extra demands to earn credit for showing up.",
      "step": "Follow today’s listed practices without adding a harder promise.",
      "alternative": "Add extra sessions before counting my effort"
    },
    "breath.exhale": {
      "title": "Pause Before Deciding",
      "explanation": "**Pressure to answer immediately** can make your own preference hard to hear. Use the breathing guide as a brief pause before choosing a small response you can stand behind.",
      "step": "Follow the breathing guide before one small personal decision.",
      "alternative": "Give an immediate answer just to stop feeling pressured"
    },
    "anger.cues": {
      "title": "Hear Your Early Cue",
      "explanation": "**A tight jaw or** urge to snap may appear when you have agreed to more than fits. Notice the cue before making the next promise to someone else.",
      "step": "Notice one tension cue before making another commitment.",
      "alternative": "Agree to another demand while ignoring my own warning signs"
    },
    "focus.badges": {
      "title": "Choose Your Attention",
      "explanation": "**An unread badge can** make someone else’s request feel like your next obligation. Decide whether to respond now instead of letting the alert choose for you.",
      "step": "Choose when to check one nonurgent alert.",
      "alternative": "Treat every unread badge as a promise I must keep immediately"
    },
    "quiet.kind": {
      "title": "A Reliable Inner Voice",
      "explanation": "**When a promise goes** wrong, harsh self-talk can turn one event into a verdict about you. Use a kind, accurate sentence that leaves room for a repair.",
      "step": "Replace one self-critical verdict with a realistic next step.",
      "alternative": "Use harsher criticism until I become reliable"
    },
    "quiet.moving": {
      "title": "A Promise in Motion",
      "explanation": "**A small action can** count even when you feel uncertain. Notice a few ordinary steps as you carry out a manageable choice instead of waiting for complete confidence.",
      "step": "Notice your steps while carrying out one small chosen action.",
      "alternative": "Wait for confidence before making any small move"
    },
    "anger.rumination": {
      "title": "Leave the Self-Trial",
      "explanation": "**Replaying a decision can** become an endless trial of whether you chose correctly. Name any useful repair once, then return to an action you can take now.",
      "step": "Name one useful repair instead of replaying a past choice.",
      "alternative": "Reopen the decision repeatedly until I feel completely certain"
    },
    "focus.words": {
      "title": "Make Space to Listen",
      "explanation": "**When you need to** choose what matters to you, background words can compete with your own train of thought. Change the sound around one small decision.",
      "step": "Reduce distracting speech while making one small personal choice.",
      "alternative": "Keep adding input whenever I feel unsure what I think"
    },
    "quiet.notice": {
      "title": "Name Your Feeling",
      "explanation": "**A feeling can be** useful information without having to decide everything for you. Name it plainly before choosing the next small action that fits your values and capacity.",
      "step": "Name one feeling before making a small choice.",
      "alternative": "Wait for the feeling to disappear before choosing anything"
    },
    "quiet.eyes": {
      "title": "Choose What Fits",
      "explanation": "**A quiet pause does** not need to look a particular way to count. Keep your eyes open if that is more comfortable and practise choosing an option that suits you.",
      "step": "Choose a comfortable way to follow your quiet practice.",
      "alternative": "Follow an uncomfortable posture because it looks more correct"
    },
    "anger.timeout": {
      "title": "A Boundary You Keep",
      "explanation": "**Asking for a pause** is a promise about how you will return. Name a realistic time and follow through rather than agreeing to continue when you cannot respond well.",
      "step": "Ask for a pause and name a realistic return time.",
      "alternative": "Agree to continue while ignoring my need to stop"
    },
    "body.movement": {
      "title": "Care You Can Do",
      "explanation": "**Self-trust can include an** ordinary care action rather than a demanding achievement. Choose one comfortable movement that matches the energy available and let that choice count.",
      "step": "Choose one comfortable movement you can follow through on.",
      "alternative": "Set an ambitious movement target to prove my worth"
    },
    "quiet.boredom": {
      "title": "A Choice Without Input",
      "explanation": "**An empty moment can** become another search for someone else’s answer. Stay with a brief ordinary pause before deciding what you actually want to do next.",
      "step": "Leave one brief empty moment before choosing your next action.",
      "alternative": "Seek more input before making even the smallest choice"
    },
    "quiet.gap": {
      "title": "Room for Your Answer",
      "explanation": "**A request can bring** an automatic yes before you have checked what fits. Use a small pause to consider the commitment you can actually keep.",
      "step": "Pause before answering one request for your time.",
      "alternative": "Say yes immediately and work out the cost later"
    },
    "focus.done": {
      "title": "A Promise With an End",
      "explanation": "**A commitment becomes hard** to judge when you keep enlarging it. Decide what done means for one small action so following through has a clear finish.",
      "step": "Define a clear finish for one small personal commitment.",
      "alternative": "Add more requirements whenever I reach the original finish"
    },
    "sleep.anchor": {
      "title": "A Realistic Care Cue",
      "explanation": "**An elaborate morning promise** can fail because its timing never fits. Choose a realistic waking anchor and attach one small care action to the day you actually have.",
      "step": "Attach one small care promise to a realistic waking cue.",
      "alternative": "Promise a perfect morning routine regardless of available time"
    },
    "anger.bucket": {
      "title": "Capacity Before Yes",
      "explanation": "**Several small commitments can** use up the space you have for a new one. Check what you are already carrying before giving another answer you hope to keep.",
      "step": "Check your existing commitments before saying yes again.",
      "alternative": "Promise more because declining would feel uncomfortable"
    },
    "body.thirst": {
      "title": "Believe a Small Need",
      "explanation": "**You do not have** to prove that a need is serious before responding to it. Check whether you want a drink and practise taking an ordinary cue seriously.",
      "step": "Respond to a small need for a drink if present.",
      "alternative": "Dismiss every small need until someone else confirms it"
    },
    "quiet.rested": {
      "title": "Choose Your Own Rest",
      "explanation": "**A break can become** more scrolling even when you wanted something quieter. Choose the kind of rest you intended and give yourself permission to follow that preference.",
      "step": "Choose one break that matches the rest you actually want.",
      "alternative": "Keep scrolling because changing my mind would be inconsistent"
    },
    "sleep.caffeine": {
      "title": "Respect Tomorrow Too",
      "explanation": "**A late coffee can** fit an immediate request while taking space from the night you intended. Consider your own evening before agreeing to keep pushing for someone else.",
      "step": "Consider your evening before choosing more caffeine for another task.",
      "alternative": "Keep pushing because someone else might prefer an immediate answer"
    },
    "body.inertia": {
      "title": "A Fair Morning Promise",
      "explanation": "**A foggy first minute** can lead to a harsh story about whether you keep promises. Give waking a transition and choose a first action small enough to honour.",
      "step": "Choose a small, realistic promise while waking gradually.",
      "alternative": "Judge my reliability before I have fully woken up"
    },
    "quiet.beginner": {
      "title": "Permission to Learn",
      "explanation": "**Trying a new habit** can feel like a test of whether you can rely on yourself. Let an imperfect first attempt be information for choosing the next small version.",
      "step": "Try a small new action without requiring immediate mastery.",
      "alternative": "Wait until I can guarantee I will do it perfectly"
    },
    "plan.carry": {
      "title": "Keep a Small Promise",
      "explanation": "**The plan can end** with one commitment that you choose for yourself. Give it a realistic cue and an easier version so you know how to return when life changes.",
      "step": "Choose one personal promise and a realistic cue for it.",
      "alternative": "Promise a perfect routine with no room to adjust"
    },
  },
} as const satisfies Record<string, Record<string, GoalLessonContext>>;
