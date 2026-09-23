import type { LessonDefinition } from '../lessonBlock';

/**
 * Plan-specific lessons for the life-reset presets.
 *
 * These are deliberately about the moment before a person starts, scrolls, or
 * turns on themselves. They teach a small change in approach; they do not turn
 * the plan into a task list or make a clinical claim.
 */
const BASE_LIFE_RESET_LESSONS = [
  {
    id: 'focus.home',
    title: 'A room is not a report card',
    blocks: [
      { kind: 'text', text: 'When a room is overwhelming, it can start to feel like **evidence about you**. It is not. It is a space holding the traces of a busy or hard stretch.' },
      { kind: 'text', text: 'Shame makes the whole room look like one enormous problem. **Naming one visible area** gives your attention a smaller place to land.' },
      { kind: 'text', text: 'You do not need to earn a calmer space by feeling motivated first. **A softer starting point** is often what makes beginning possible.' },
      { kind: 'do', text: 'If this feels familiar, ask: **Am I reading this room as a fact about me? What would be a fairer description?**' },
    ],
    source: 'Behavioural activation and self-compassion research both support reducing shame and making an avoided task more specific before approaching it.',
  },
  {
    id: 'focus.visible',
    title: 'Visible is smaller than everything',
    blocks: [
      { kind: 'text', text: '“The whole place” is too large for a brain to start with. **What is visible right now** is a real boundary, and boundaries make decisions lighter.' },
      { kind: 'text', text: 'You are not choosing what matters forever. You are choosing **where your eyes rest next**, which is a much kinder question.' },
      { kind: 'text', text: 'A small finish can change the feeling of a room without solving it. **Partial counts** because your nervous system can register an ending.' },
      { kind: 'do', text: 'If you want to begin, ask: **What part of this feels manageable to me right now?**' },
    ],
    source: 'Executive-function guidance commonly recommends breaking large domestic tasks into visible, bounded steps to reduce initiation overload.',
  },
  {
    id: 'focus.return',
    title: 'Returning matters more than catching up',
    blocks: [
      { kind: 'text', text: 'A hard week can make you believe you need a dramatic restart. Usually, **returning quietly** is more useful than trying to erase the gap.' },
      { kind: 'text', text: 'Catch-up plans carry every missed day into today. **Today only needs today**, and that is enough to rebuild trust with yourself.' },
      { kind: 'text', text: 'The next small reset does not have to prove you have changed. **It only has to be real** for the person you are this afternoon.' },
      { kind: 'do', text: 'If you have been away, ask: **What would returning look like without trying to make up for every missed day?**' },
    ],
    source: 'Relapse-prevention and habit-maintenance approaches emphasize restarting after lapses rather than using missed days as evidence of failure.',
  },
  {
    id: 'focus.loop',
    title: 'The loop starts before the scroll',
    blocks: [
      { kind: 'text', text: 'The scroll often begins before your thumb moves. **A feeling, a pause, or a bit of boredom** can quietly become the cue to reach for your phone.' },
      { kind: 'text', text: 'Seeing that cue is not meant to make you feel watched. **It gives you one extra second** in which something else can happen.' },
      { kind: 'text', text: 'You do not need to make your phone the enemy. **Noticing the beginning** is enough to loosen an automatic loop.' },
      { kind: 'do', text: 'If you notice yourself reaching for your phone, ask: **What was happening just before this?**' },
    ],
    source: 'Habit-loop models describe behaviour as cue, routine, and reward; noticing the cue creates an opportunity to choose a different response.',
  },
  {
    id: 'focus.pull',
    title: 'An urge is a passing signal',
    blocks: [
      { kind: 'text', text: 'An urge can feel like an instruction, especially when you are tired or unsettled. **Feeling pulled is not the same as needing to act.**' },
      { kind: 'text', text: 'Most urges change shape when they are given a little room. **A pause is not denial**; it is a chance to find out what the feeling actually needs.' },
      { kind: 'text', text: 'Sometimes you will still scroll. That does not cancel the pause. **Noticing is the practice**, even when the next choice stays the same.' },
      { kind: 'do', text: 'If you feel the pull, ask: **What am I hoping this will give me right now?**' },
    ],
    source: 'Mindfulness-based approaches use urge observation and brief pauses to reduce automatic responding without demanding perfection.',
  },
  {
    id: 'focus.offline',
    title: 'Rest needs less input sometimes',
    blocks: [
      { kind: 'text', text: 'Scrolling can look like rest because your body is still. But **less effort is not always restoration**, especially when your attention stays on alert.' },
      { kind: 'text', text: 'You do not need to replace every screen minute with something impressive. **A quieter kind of nothing** can be a real option too.' },
      { kind: 'text', text: 'The point is not to have a perfect offline life. **It is to recognise what leaves you fuller** and what leaves you more scattered.' },
      { kind: 'do', text: 'If you have a quiet moment, ask: **Does this kind of pause leave me more rested or more scattered?**' },
    ],
    source: 'Sleep and attention guidance recommends reducing stimulating screen use before rest and observing its effect on alertness and recovery.',
  },
  {
    id: 'body.capacity',
    title: 'Capacity changes from day to day',
    blocks: [
      { kind: 'text', text: 'Some days have more room than others. **Lower capacity is information**, not proof that you are lazy, broken, or going backwards.' },
      { kind: 'text', text: 'A plan that only works on high-energy days is too narrow. **A smaller version still belongs** to the life you are actually living.' },
      { kind: 'text', text: 'Meeting yourself where you are does not mean giving up. **It is how you save energy** for the next moment that matters.' },
      { kind: 'do', text: 'If your energy is low, ask: **What size of reset fits me today?**' },
    ],
    source: 'Pacing and self-management guidance recommends adjusting activity to current energy and avoiding all-or-nothing responses to difficult days.',
  },
  {
    id: 'body.gentle',
    title: 'Gentle can still move you',
    blocks: [
      { kind: 'text', text: 'When everything feels heavy, force can look like the only answer. Often, **gentleness is more sustainable** than trying to overpower your state.' },
      { kind: 'text', text: 'Gentle does not mean nothing happens. **It means the next step fits**, rather than asking you to borrow energy you do not have.' },
      { kind: 'text', text: 'A small act of care can make the next hour feel less sharp. **That is a meaningful shift**, even if it is not dramatic.' },
      { kind: 'do', text: 'If gentle feels too small, ask: **Would I call this effort meaningless if someone I cared about made it?**' },
    ],
    source: 'Behavioural activation and compassionate mind approaches support achievable, values-aligned actions rather than harsh self-criticism.',
  },
  {
    id: 'body.enough',
    title: 'Enough is a useful stopping point',
    blocks: [
      { kind: 'text', text: 'When you have fallen behind, it is tempting to keep raising the bar. **Enough gives the day an edge**, so care does not become another endless demand.' },
      { kind: 'text', text: 'Stopping at enough can feel unfamiliar if you are used to proving yourself. **A boundary protects tomorrow**, not just today.' },
      { kind: 'text', text: 'You are allowed to finish a small reset and leave the rest unfinished. **Completion is not the same as perfection.**' },
      { kind: 'do', text: 'If you find yourself moving the finish line, ask: **What would enough look like at my current capacity?**' },
    ],
    source: 'Pacing and behavioural activation approaches use achievable limits to reduce overwhelm and support repeated engagement over time.',
  },
  {
    id: 'quiet.trust',
    title: 'Trust grows through small evidence',
    blocks: [
      { kind: 'text', text: 'Self-trust rarely arrives as a big feeling. It grows when you notice **small evidence that you came back** after a difficult moment.' },
      { kind: 'text', text: 'A promise can be tiny: opening this plan, pausing before reacting, or resting when you need it. **Small promises still count.**' },
      { kind: 'text', text: 'The point is not never letting yourself down. **It is learning you can repair** the connection when you do.' },
      { kind: 'do', text: 'If your mind says you never follow through, ask: **Is there a small piece of evidence it is leaving out?**' },
    ],
    source: 'Self-efficacy research links confidence with repeated experiences of manageable action and recovery after setbacks.',
  },
  {
    id: 'quiet.voice',
    title: 'Your inner voice sets the weather',
    blocks: [
      { kind: 'text', text: 'The way you speak to yourself changes what a hard moment feels like. **A harsh voice makes the room smaller**, even when nobody else is there.' },
      { kind: 'text', text: 'You do not have to replace every thought with a cheerful one. **A fairer sentence** is often more believable and more useful.' },
      { kind: 'text', text: 'Fairness sounds like the way you would speak to someone you love on a rough day. **You deserve that tone too.**' },
      { kind: 'do', text: 'If you notice a harsh thought, ask: **What would be a fairer, believable sentence?**' },
    ],
    source: 'Self-compassion research links a less punitive inner response with resilience and willingness to re-engage after difficulty.',
  },
  {
    id: 'quiet.repair',
    title: 'Repair is part of self-trust',
    blocks: [
      { kind: 'text', text: 'A missed intention can feel like a verdict. It is usually just a moment that needs **repair instead of punishment**.' },
      { kind: 'text', text: 'Repair begins by telling the truth: that was hard, it did not happen, and you are here now. **Honesty without cruelty** leaves room to continue.' },
      { kind: 'text', text: 'You do not need a grand apology to yourself. **The next kind choice is repair** in a form you can actually use.' },
      { kind: 'do', text: 'If a missed intention is on your mind, ask: **What would repair look like from where I am now?**' },
    ],
    source: 'Relapse-prevention and self-compassion approaches frame setbacks as information and encourage a specific, non-punitive return to practice.',
  },
] as const satisfies readonly LessonDefinition[];

function resetLesson<Id extends string>(
  id: Id,
  title: string,
  claim: string,
  reason: string,
  insight: string,
  reflection: string,
  source: string,
) {
  const layout = [...id].reduce(
    (total, character, index) => total + character.charCodeAt(0) * (index + 1),
    0,
  ) % 4;
  const list = {
    kind: 'list' as const,
    items: [
      { term: 'The moment', text: claim },
      { term: 'The setup', text: reason },
    ],
  };
  const first = { kind: 'text' as const, text: `**The moment:** ${claim}` };
  const second = { kind: 'text' as const, text: `**Why it helps:** ${reason}` };
  const third = { kind: 'text' as const, text: insight };

  return {
    id,
    title,
    blocks: [
      ...(layout === 0 ? [first, second, third] : layout === 1 ? [list, first, third] : layout === 2 ? [first, list, third] : [first, second, list]),
      { kind: 'do' as const, text: `If this fits the moment you are in, **consider this question:** ${reflection}` },
    ],
    source,
  } as const;
}

const HOME_SOURCES = 'Implementation-intention and executive-function guidance support defining a visible, bounded next action and reducing friction in the environment.';
const PHONE_SOURCES = 'Habit-loop and attention research support noticing cues, reducing frictionless access, and creating a deliberate pause before automatic checking.';
const RECOVERY_SOURCES = 'Behavioural activation and pacing guidance support choosing an achievable form of care that fits the energy available in the present moment.';
const SELF_TRUST_SOURCES = 'Implementation-intention and self-compassion research support specific, achievable commitments and a non-punitive return after setbacks.';

const EXPANDED_LIFE_RESET_LESSONS = [
  resetLesson('focus.category', 'A category is not a next step', '“Laundry” or “the kitchen” names a category, not an action.', 'A category hides many decisions, while a physical first move makes the starting point visible.', 'A label can make a job feel endless. **A first move has an edge** you can recognise.', 'What would count as a first move for the thing on my mind?', HOME_SOURCES),
  resetLesson('focus.eyes', 'Start where your eyes already land', 'The visible friction point is often the easiest honest place to begin.', 'Choosing the theoretically perfect job can turn a small reset into a planning problem.', 'The urge to choose perfectly can become its own delay. **An obvious starting place is allowed** even if it is not the most important one.', 'Where does my attention keep landing, and would starting there help?', HOME_SOURCES),
  resetLesson('focus.sort', 'Sort later, return first', 'Putting something back can come before deciding on the ideal system for it.', 'Organising asks for many choices, while returning an item asks for one.', 'You do not need a complete system before anything can improve. **Returning and organising are different jobs.**', 'Am I asking myself to design a whole system when a simpler return would do?', HOME_SOURCES),
  resetLesson('focus.bin', 'The bin belongs near the decision', 'Clutter is easier to release when the next container is close by.', 'A useful tool works best where the decision actually happens, not where it looks tidiest.', 'Friction can look like a character flaw when the useful tool is simply too far away. **The setup is changeable.**', 'What in my space makes this choice harder than it needs to be?', HOME_SOURCES),
  resetLesson('focus.timer', 'A timer ends the negotiation', 'A short boundary can make starting feel less like signing away the evening.', 'Knowing there is an ending reduces the need to decide how much is enough while you are doing it.', 'An open-ended task can feel threatening when you are already tired. **An ending can be chosen in advance.**', 'What stopping point would make this feel possible for me?', HOME_SOURCES),
  resetLesson('focus.landing', 'Leave a landing strip', 'One clear surface can become a calmer home base for the next reset.', 'A protected spot reduces the number of decisions waiting for you when you return.', 'One usable spot can be enough to feel a little less crowded. **It does not have to represent the whole room.**', 'Is there a small place whose use matters to me right now?', HOME_SOURCES),
  resetLesson('focus.doorway', 'The doorway can carry a cue', 'Arriving home can hold one tiny reminder without becoming a routine to perform perfectly.', 'A cue already in your day asks less memory than a brand-new plan.', 'A cue works best when it meets you where life already happens. **You do not need another routine to remember.**', 'Where in my existing day might a gentle reminder fit?', HOME_SOURCES),
  resetLesson('focus.edge', 'Good enough has an edge', '“Done for today” needs a boundary or the task will keep expanding.', 'A clear finish line makes it easier to begin because you know what you are agreeing to.', 'Perfection keeps moving the finish line. **A chosen boundary lets a small effort be complete.**', 'What would enough mean for this situation today?', HOME_SOURCES),
  resetLesson('focus.livedin', 'A lived-in room is not a failed room', 'Use leaves traces, and those traces are not proof that a space is beyond repair.', 'Separating ordinary living from a harsh story makes it easier to see one next move.', 'A room can need care without saying anything about your worth. **The mess is a condition, not a verdict.**', 'What am I assuming this space says about me, and is that fair?', HOME_SOURCES),

  resetLesson('focus.ending', 'The feed has no natural ending', 'A feed is designed to offer another thing before the last one has settled.', 'Choosing a stopping point before opening it gives you a boundary the feed will not provide.', 'If there is always more to see, stopping has to come from you. **That is a design problem, not a failure of willpower.**', 'What would tell me I have got what I came for?', PHONE_SOURCES),
  resetLesson('focus.unlock', 'Unlocking is a fork in the day', 'The first tap can be a chance to remember why you picked up the phone.', 'A purpose does not have to be profound; it simply makes the next action less automatic.', 'The reason you reached for your phone can disappear in one tap. **Remembering it gives you a choice.**', 'What am I hoping to do or feel when I open my phone?', PHONE_SOURCES),
  resetLesson('focus.default', 'Make the default less inviting', 'An automatic loop is easier to interrupt when its first cue is less visible.', 'Changing one shortcut or visual prompt adds a moment in which you can choose.', 'A cue you see often asks for a decision often. **Changing the cue can lower the load on attention.**', 'Which cue makes checking feel automatic for me?', PHONE_SOURCES),
  resetLesson('focus.hands', 'Empty hands need a replacement', 'Putting a phone down can leave a small gap that feels stranger than expected.', 'Choosing what that first quiet minute contains makes the pause less empty.', 'The gap after putting a phone down may feel uncomfortable at first. **Discomfort is information, not an instruction.**', 'What am I hoping the phone will fill in this moment?', PHONE_SOURCES),
  resetLesson('focus.charger', 'Your charger chooses a side', 'Where a phone charges quietly shapes where it is most likely to be used.', 'A charging place can support the boundary you want before tiredness is making decisions.', 'An easy reach can quietly decide a tired moment for you. **Distance is one kind of support.**', 'Does where my phone lives support the rest I want?', PHONE_SOURCES),
  resetLesson('focus.save', 'Save the good part for later', 'Connection can be intentional without becoming constant checking.', 'Separating the person you want to reach from the feed around them protects the reason you opened the phone.', 'You can want connection and still want a boundary around the feed. **Both needs can be real.**', 'What was the good part I came here for?', PHONE_SOURCES),
  resetLesson('focus.wait', 'The pause can outlast the pull', 'An urge changes when it is given a little time instead of an instant answer.', 'Waiting is not a contest with yourself; it is space for the feeling to move.', 'A pull can feel permanent while it is happening. **You can make the choice after noticing it.**', 'Does this urge change at all when I give it a little space?', PHONE_SOURCES),
  resetLesson('focus.company', 'One screen is enough company', 'Stacked stimulation can make a tired mind feel even more scattered.', 'Reducing one layer of input lets your attention settle without requiring total silence.', 'More input can feel comforting and tiring at the same time. **You can notice which is true for you.**', 'How does this amount of input leave me feeling?', PHONE_SOURCES),
  resetLesson('focus.capture', 'Close the app, keep the thought', 'Sometimes the feed holds a thought you do not want to lose.', 'Capturing the thought elsewhere lets you leave without relying on the app to remember for you.', 'Staying in an app to remember one useful thought can keep you there longer than you wanted. **The thought can have another home.**', 'What do I actually want to keep from this moment?', PHONE_SOURCES),

  resetLesson('body.corner', 'Keep one corner of the day alive', 'A difficult day does not need every part of life restored at once.', 'One small area of care can make the next hour feel more possible without demanding a turnaround.', 'A rough day can invite an all-or-nothing story. **One part of the day can still be cared for.**', 'Is there one part of this day I still want to tend to?', RECOVERY_SOURCES),
  resetLesson('body.signal', 'Begin with a body signal', 'Light, water, food, air, or a change of position can mark a small restart.', 'A physical cue can be easier to notice than a big question about motivation.', 'You may not have a clear answer to why you feel stuck. **Noticing the body can be a gentler starting point.**', 'What is my body telling me about what I need?', RECOVERY_SOURCES),
  resetLesson('body.comfort', 'Comfort can give something back', 'Not every pause restores you in the same way.', 'Noticing whether a comfort leaves you fuller or more drained helps you choose it with more care.', 'Comfort is personal, and its effects can change with the day. **You are allowed to notice what actually helps.**', 'Which kind of comfort leaves me a little more able to return?', RECOVERY_SOURCES),
  resetLesson('body.floor', 'Lower the floor, not the standard', 'The minimum version can become smaller without becoming meaningless.', 'A low-capacity day needs a reachable floor more than an ambitious plan you cannot enter.', 'A minimum is meant to be reachable. **Making it smaller can keep the door open.**', 'What would a version of care I could enter today look like?', RECOVERY_SOURCES),
  resetLesson('body.sight', 'Care works better in sight', 'Useful choices are easier when they do not have to be remembered from another room.', 'Putting care where you can see it reduces the distance between intention and action.', 'Forgetting something helpful does not mean you did not care enough. **Visibility can carry some of the remembering.**', 'What support would be easier to choose if it were easier to notice?', RECOVERY_SOURCES),
  resetLesson('body.decision', 'Eat before the decision gets louder', 'Low fuel can make an ordinary afternoon feel sharper and more complicated.', 'A simple meal or snack can remove one avoidable layer from a hard decision.', 'When a decision feels unusually loud, there may be ordinary needs in the background. **You can check those before judging yourself.**', 'Have I met the basic needs that might be shaping this moment?', RECOVERY_SOURCES),
  resetLesson('body.hour', 'The next hour is still available', 'A rough morning does not decide what the rest of the day has to mean.', 'A small transition creates a new edge without asking you to pretend the earlier part was easy.', 'The thought that the day is ruined is a prediction, not a fact. **The next hour has not happened yet.**', 'What would make the next hour a little more workable for me?', RECOVERY_SOURCES),
  resetLesson('body.finish', 'Enough can be named', 'A humane finish line keeps care from turning into another impossible standard.', 'Naming enough lets your body stop bracing for a demand that keeps growing.', 'If enough is never named, care can become another endless demand. **A finish line is allowed, even on an unfinished day.**', 'How will I recognise enough for now?', RECOVERY_SOURCES),
  resetLesson('body.returnpath', 'Rest needs a return path', 'A restorative pause feels safer when you know what follows it.', 'A simple next step can make rest feel like a bridge instead of disappearing from the day.', 'Rest may be easier to allow when returning does not require a whole new plan. **A gentle re-entry can be enough.**', 'What would help me return after a pause, if I want to?', RECOVERY_SOURCES),

  resetLesson('quiet.when', 'Say what will happen when', 'A vague intention asks you to decide again at the hardest moment.', 'A time-and-place cue turns a hope into a smaller agreement with your future self.', 'A promise made in a calm moment can become vague later. **A cue can bridge those moments.**', 'When would my chosen intention naturally fit?', SELF_TRUST_SOURCES),
  resetLesson('quiet.cue', 'A promise needs a visible cue', 'A reminder works better when it lives in the place the action begins.', 'An object or familiar routine can carry the cue without asking memory to do all the work.', 'Needing a reminder is ordinary. **A visible cue can support an intention without testing your memory.**', 'What reminder would feel supportive rather than demanding?', SELF_TRUST_SOURCES),
  resetLesson('quiet.no', 'Make the plan survive a no', 'A hard day is easier to meet when the smaller alternative is already allowed.', 'Planning for the no protects the relationship with yourself from an all-or-nothing rule.', 'A missed version does not erase the whole intention. **A smaller version can still be honest.**', 'If the full plan does not fit, what would I still want to keep?', SELF_TRUST_SOURCES),
  resetLesson('quiet.yes', 'One honest yes makes room', 'Every commitment needs some protected space around it.', 'Deferring one thing can be a practical way to keep a more important promise possible.', 'A yes can be sincere and still need room to exist. **Making room is part of keeping it.**', 'What am I already carrying, and is there room for this promise?', SELF_TRUST_SOURCES),
  resetLesson('quiet.story', 'The next choice matters most', 'A missed action can become a long story about who you are.', 'Returning to the next available choice keeps the story from becoming the whole day.', 'One missed choice can trigger the thought that you always fail. **One event cannot prove an always.**', 'What happened here, without turning it into a story about who I am?', SELF_TRUST_SOURCES),
  resetLesson('quiet.yesterday', 'Borrow structure from yesterday', 'You do not need to redesign your life every time something works.', 'Reusing a time or setup that already helped turns experience into support.', 'You can use evidence from your own life instead of designing a perfect plan. **What helped once may help again.**', 'What has made this easier for me before?', SELF_TRUST_SOURCES),
  resetLesson('quiet.plain', 'Keep the agreement plain', 'A promise becomes harder to keep when it quietly grows while you are making it.', 'Plain words make the boundary visible before perfectionism can add more to it.', 'The extra rules can arrive quietly after the promise is made. **Clear words help you see what you actually agreed to.**', 'Have I added requirements that were never part of my intention?', SELF_TRUST_SOURCES),
  resetLesson('quiet.boundary', 'A boundary is future kindness', 'Protecting time or attention early can be kinder than trying to recover it later.', 'A boundary is not a punishment; it is a way of leaving room for what matters.', 'A boundary can protect a meaningful yes. **It does not need to be a judgment of anyone else.**', 'What deserves some room in my attention right now?', SELF_TRUST_SOURCES),
  resetLesson('quiet.receipt', 'Trust grows from receipts', 'Completed small actions are evidence that you can return to yourself.', 'The record is not a score of worth; it is a receipt for something real you did.', 'The mind may remember misses more readily than quiet follow-through. **A fair account includes both.**', 'What small evidence of showing up am I overlooking?', SELF_TRUST_SOURCES),
] as const;

export const LIFE_RESET_LESSONS = [
  ...BASE_LIFE_RESET_LESSONS,
  ...EXPANDED_LIFE_RESET_LESSONS,
] as const satisfies readonly LessonDefinition[];
