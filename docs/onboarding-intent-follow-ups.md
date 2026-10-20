# Onboarding intent follow-up questions

New onboarding offers these nine goals in this order. The stored IDs remain distinct from display copy and from plan IDs:

| Goal | Intent ID | Default plan |
|---|---|---|
| Spending less time scrolling | `scrolling` | `phone` |
| Feeling less burned out | `burnout` | `recovery` |
| Putting things off less | `procrastination` | `focus` |
| Keeping my home tidy | `cleaning` | `home` |
| Overthinking less | `calm_fast` | `pressure` (overthinking lessons) |
| Feeling less stressed | `stress_relief` | `pressure` (stress lessons) |
| Sleeping better | `sleep` | `night` |
| Staying focused | `focus` | `focus` |
| Sticking to a routine | `daily_habit` | `selfTrust` |

Scrolling, burnout, and procrastination choose their plans directly; they do not require a follow-up answer to unlock the matching plan. Existing phone-related sleep/focus refinements still apply. The retired `energy` goal keeps its morning plan and its existing recovery refinement. Previous display titles remain lookup aliases, including older procrastination wording saved under `daily_habit`, so returning users keep their original goal and enrollment.

The three new goals each have a dedicated three-question sequence:

| Intent | Context | Attempts (multiple answers) | Stakes |
|---|---|---|---|
| `scrolling` | When do you get pulled into scrolling? (`when_scrolling`) | What have you tried to cut back? (`tried_scrolling`) | What would less scrolling give you back? (`stakes_scrolling`) |
| `burnout` | When do you feel most drained? (`when_burnout`) | What have you tried to make room for recovery? (`tried_burnout`) | What would feeling less drained give you back? (`stakes_burnout`) |
| `procrastination` | What do you tend to put off? (`when_procrastination`) | What have you tried to make starting easier? (`tried_procrastination`) | What would putting things off less give you back? (`stakes_procrastination`) |

Each question has its own answer IDs and echo copy in `intentFollowUps.ts`. Their habits-to-break, suggested habits, and starter tasks also remain distinct; routine consistency, task initiation, and phone use are separate goals even when they share a practice or plan territory.

Current copy from `src/components/onboarding/data/intentFollowUps.ts`. Most goals have three questions: the second allows multiple answers; the first and third allow one answer. Cleaning has six distinct questions: area, barriers (multiple answers), life impact, living situation, space condition, and tidying challenge. The barriers question replaces the overlapping avoidance question, and life impact replaces the former desired-outcome question. The cleaning path also skips the later chores-overwhelm, avoidance-area, starting-barrier, and guilt questions. The “Said back as” text is used in later personalized copy. Goal analysis quotes the third question, with life-impact answers phrased as what the user wants to regain. The plan report uses the new context answers for space condition, living situation, and cleaning barriers.

## Default / Something else

### What would you most like to be different?

| Answer | Said back as |
|---|---|
| Calmer days | calmer days |
| Better nights | better nights |
| A clearer head | a clearer head |
| More left in the tank | more left in the tank |
| A body I look after | a body you look after |
| A habit I actually keep | a habit you actually keep |

### What have you already tried? (choose all that apply)

| Answer | Said back as |
|---|---|
| Other apps | other apps |
| Meditation | meditation |
| Moving more | moving more |
| Therapy or coaching | therapy |
| Supplements | supplements |
| Nothing yet | nothing yet |

### What would that change most?

| Answer | Said back as |
|---|---|
| How my mornings start | your mornings |
| My patience with people I love | your patience with the people you love |
| My focus at work | your focus at work |
| Enjoying things I used to | the things you used to enjoy |
| My health, long term | your health |
| Time I will not get back | time you will not get back |

## Everything feels like too much (`stress_relief`)

### When does it all pile up?

| Answer | Said back as |
|---|---|
| Before the day has even started | it starts before the day does |
| Work, messages, or life admin | work, messages, or life admin pile up |
| When I get home to more to do | coming home to more to do is when it piles up |
| When I finally stop moving | stopping is when it all catches up with you |
| It never really stops | it never really stops |

### What have you tried to get on top of it? (choose all that apply)

| Answer | Said back as |
|---|---|
| Other apps | other apps |
| Meditation | meditation |
| Moving more | moving more |
| Therapy or coaching | therapy |
| A drink to take the edge off | a drink to take the edge off |
| Nothing yet | nothing yet |

### What is overwhelm taking from you?

| Answer | Said back as |
|---|---|
| My patience with people I love | your patience with the people you love |
| My sleep | your sleep |
| My focus at work | your focus at work |
| Enjoying things I used to | the things you used to enjoy |
| My health | your health |
| Time I will not get back | time you will not get back |

## I get overwhelmed and can’t start. (`calm_fast`)

### When does your brain start spiralling?

| Answer | Said back as |
|---|---|
| Around other people | being around people starts the spiral |
| Before I have to show up | having to show up starts the spiral |
| After conflict or a hard text | conflict or a hard text starts the spiral |
| When the pressure is on | pressure starts the spiral |
| It comes out of nowhere | spirals that come from nowhere |

### What do you do when it hits? (choose all that apply)

| Answer | Said back as |
|---|---|
| Wait it out | waiting it out |
| Leave the room | leaving the room |
| Try to breathe through it | breathing through it |
| Distract yourself | distracting yourself |
| Nothing that works | nothing that has worked |

### What does a spiral steal from you?

| Answer | Said back as |
|---|---|
| Saying what I actually think | the things you did not say |
| Rooms I have started avoiding | the rooms you have been avoiding |
| The rest of the day after one | the rest of the day after one |
| Sleep that night | your sleep |
| Trusting myself to hold it together | trust in yourself to hold it together |

## I can’t fall asleep (`sleep`)

The sleep path interleaves these questions with the early sleep assessment.
The first identifies the sleep difficulty, rather than repeating the separate
nighttime-barrier question. Hours and timing, morning rest and getting up, and
barriers follow it; previous attempts precede daytime energy and desired impact.
The later `habitsToBreak` question is retained.

### Which part of sleep is hardest for you?

| Answer | Said back as |
|---|---|
| Falling asleep | falling asleep feels difficult |
| Staying asleep | you wake during the night |
| Waking too early | you wake earlier than you want |
| Waking up unrested | you wake up feeling unrested |
| Several of these | more than one part of sleep feels difficult |

### What have you already tried to improve your sleep? (choose all that apply)

| Answer | Said back as |
|---|---|
| Melatonin or sleep aids | sleep aids |
| Cutting screens at night | cutting screens at night |
| Cutting caffeine | cutting caffeine |
| A stricter bedtime | a stricter bedtime |
| Other apps | other apps |
| Nothing yet | nothing yet |

### What would better sleep help you with most?

| Answer | Said back as |
|---|---|
| My mornings | your mornings |
| My focus at work | your focus at work |
| My patience with people I love | your patience with the people you love |
| My mood, all day | your mood for the whole day |
| Training and recovery | your training |
| My health, long term | your health |

## I’m behind on work or school (`focus`)

### What happens when you try to start?

| Answer | Said back as |
|---|---|
| I avoid it until it is urgent | getting started is the hard part |
| I open it, then drift | focus slips away once you begin |
| One interruption derails me | an interruption derails you |
| My phone wins every time | your phone keeps pulling you away |
| My mind is already too loud | your mind is already too loud |

### What have you tried to make yourself focus? (choose all that apply)

| Answer | Said back as |
|---|---|
| Caffeine | caffeine |
| App blockers | app blockers |
| Timers and pomodoros | timers |
| Lists I stop checking | lists |
| Medication or professional support | medication or professional support |
| Nothing has stuck | nothing that has stuck |

### What is this stealing from you?

| Answer | Said back as |
|---|---|
| Work that drags into my evenings | your evenings |
| Grades or results | the results you are working for |
| Feeling behind all the time | the feeling of being on top of it |
| My confidence | your confidence |
| Time with the people I like | time with the people you like |
| Time I will not get back | time you will not get back |

## I’m exhausted (`energy`)

### When are you already done?

| Answer | Said back as |
|---|---|
| I wake up tired | you wake up tired |
| By the middle of the day | the middle of the day empties you |
| The afternoon crash | the afternoon crash |
| There is nothing left after work | evenings have nothing left |
| I feel like this all day | it stays low all day |

### What do you reach for to get through? (choose all that apply)

| Answer | Said back as |
|---|---|
| Caffeine | caffeine |
| Sugar or energy drinks | energy drinks |
| Naps | naps |
| Moving more | moving more |
| Supplements | supplements |
| Nothing yet | nothing yet |

### What does running on empty take first?

| Answer | Said back as |
|---|---|
| My evenings | your evenings |
| Training and moving | your training |
| My patience with people I love | your patience with the people you love |
| My focus at work | your focus at work |
| Enjoying things I used to | the things you used to enjoy |
| Plans I end up cancelling | the plans you keep cancelling |

## Be kinder to myself (`self_acceptance`)

### When is the inner critic loudest?

| Answer | Said back as |
|---|---|
| Right after I get something wrong | it is loudest right after a mistake |
| When I measure myself against people | comparison sets it off |
| When I catch my reflection | your reflection sets it off |
| Once the day goes quiet | it arrives once the day goes quiet |
| It is running most of the time | it runs most of the time |

### What have you tried to quiet it? (choose all that apply)

| Answer | Said back as |
|---|---|
| Therapy or coaching | therapy |
| Writing it down | writing it down |
| Meditation | meditation |
| Affirmations | affirmations |
| Talking to people who know me | talking to the people who know you |
| Nothing yet | nothing yet |

### What does it stop you doing?

| Answer | Said back as |
|---|---|
| Taking chances | the chances you talk yourself out of |
| Resting without guilt | rest without the guilt |
| Letting people close | letting people close |
| Enjoying what I have done | credit for what you have already done |
| Saying what I actually want | the things you do not say |

## I can’t keep up with myself (`emotional_balance`)

### When do big feelings take over?

| Answer | Said back as |
|---|---|
| Conflict with someone | conflict sets it off |
| Feeling criticised or rejected | feeling criticised or rejected sets it off |
| Too much arriving at once | too much arriving at once |
| Once I am alone with my thoughts | once you are alone with your thoughts |
| They arrive with no warning | waves that arrive with no warning |

### What happens after? (choose all that apply)

| Answer | Said back as |
|---|---|
| I replay it for hours | replaying it for hours |
| I say things I regret | saying things you regret |
| I shut down | shutting down |
| I cannot focus on anything else | not being able to focus on anything else |
| I cancel plans or pull away | cancelling plans or pulling away |
| I do not know what helps | not knowing what helps |

### What would feeling steadier give you back?

| Answer | Said back as |
|---|---|
| A pause before I react | a pause before you react |
| More trust in myself | more trust in yourself |
| Better relationships | better relationships |
| A calmer rest of my day | a calmer rest of your day |
| Energy for the things I care about | energy for the things you care about |

## Make time for myself (`self_care`)

### What eats the time first?

| Answer | Said back as |
|---|---|
| Work | work takes it first |
| Family and everyone else | everyone else takes it first |
| Chores that never end | chores take it first |
| My phone | your phone takes it first |
| Guilt for taking any | guilt for taking any |

### What have you tried to protect it? (choose all that apply)

| Answer | Said back as |
|---|---|
| Blocking it out in my calendar | blocking it out in your calendar |
| Getting up before everyone | getting up before everyone |
| Saying no more often | saying no more often |
| A hobby or a class | a hobby or a class |
| Other apps | other apps |
| Nothing yet | nothing yet |

### What would a few minutes a day protect?

| Answer | Said back as |
|---|---|
| My evenings | your evenings |
| My patience with people I love | your patience with the people you love |
| My mornings | your mornings |
| Feeling like myself | the feeling of being yourself again |
| My health, long term | your health |

## Deepen practice (`spiritual`)

### What does your practice need most?

| Answer | Said back as |
|---|---|
| Getting to it at all | getting to it at all |
| Quieting the noise first | quieting the noise before you begin |
| Staying with it longer | staying with it longer |
| Carrying it into the day | carrying it into the day |
| A way back after a long gap | a way back after a long gap |

### What does your practice look like now? (choose all that apply)

| Answer | Said back as |
|---|---|
| Meditation | meditation |
| Prayer | prayer |
| Yoga | yoga |
| Reading or study | reading and study |
| Time outdoors | time outdoors |
| Nothing regular yet | nothing regular yet |

### What would more stillness open up?

| Answer | Said back as |
|---|---|
| A practice I actually keep | a practice you actually keep |
| Presence with the people in front of me | presence with the people in front of you |
| A quieter head | a quieter head |
| Space before I react | space before you react |
| Feeling connected again | the sense of being connected again |

## Support my yoga (`yoga`)

### Where does your practice need the breath most?

| Answer | Said back as |
|---|---|
| Holding the hard poses | holding the hard poses |
| Transitions between poses | your transitions |
| Stillness at the end | the stillness at the end |
| Getting on the mat at all | getting on the mat at all |
| Carrying it off the mat | carrying it off the mat |

### How does your practice run right now? (choose all that apply)

| Answer | Said back as |
|---|---|
| A studio or a class | classes at a studio |
| At home, following videos | practising at home |
| Self-led on the mat | a self-led practice |
| Some pranayama already | the pranayama you already do |
| On and off | an on-and-off practice |
| Just starting out | a practice you are just starting |

### What would steadier breath unlock?

| Answer | Said back as |
|---|---|
| Longer holds | longer holds |
| Calm in the hard postures | calm in the hard postures |
| A deeper savasana | a deeper savasana |
| Getting to the mat more often | a practice you get to more often |
| The same calm off the mat | the same calm off the mat |

## I want to understand my heart (`heart_health`)

### What do you want more clarity on?

| Answer | Said back as |
|---|---|
| A check-up or a number I did not like | a number you did not like |
| It runs in my family | what runs in your family |
| Stress I can feel in my chest | the stress you feel in your chest |
| Training and recovery | your training and recovery |
| Getting ahead of it | getting ahead of it |

### What are you using to understand it now? (choose all that apply)

| Answer | Said back as |
|---|---|
| A watch or a ring | the watch you already wear |
| Blood pressure at home | blood pressure at home |
| Check-ups and bloodwork | check-ups and bloodwork |
| Exercise and what I eat | exercise and what you eat |
| Nothing yet, I go on feel | nothing yet |

### What would more clarity give you?

| Answer | Said back as |
|---|---|
| Proof that it is working | proof that it is working |
| Warning before something does | warning before something does |
| Confidence in how I am recovering | confidence in how you are recovering |
| Something to show my doctor | something to show your doctor |
| One less thing to worry about | one less thing to worry about |

## My space is getting too messy. (`cleaning`)

### Which area feels most stressful to start?

| Answer | Said back as |
|---|---|
| Laundry | laundry feels hardest to start |
| Dishes | dishes feel hardest to start |
| My bedroom | your bedroom feels hardest to start |
| General clutter | general clutter feels hardest to start |
| Honestly, all of it | all of it feels hard to start |

### What makes it hard for you to clean? (choose all that apply)

| Answer | Said back as |
|---|---|
| I feel too tired | feeling too tired |
| I get overwhelmed | getting overwhelmed |
| I don't have time | not having enough time |
| I don't enjoy it | not enjoying cleaning |

### How is cleaning overwhelm affecting your life?

| Answer | Said back as |
|---|---|
| I can't relax at home | a home you can relax in |
| I feel guilty or ashamed | peace of mind when you look around |
| It drains my energy | energy for the rest of your day |
| I avoid inviting people over | confidence to invite people over |
| It causes tension with people I live with | a calmer home to share |
| It isn't affecting me much | more time for the things you enjoy |

### What is your current living situation?

| Answer | Said back as |
|---|---|
| I live on my own | you live on your own |
| I live with a partner | you share your home with a partner |
| I live with children | you have children at home |
| I live with family | you share your home with family |
| I live with roommates | you share your home with roommates |
| Something else | your living situation is your own |

### How clean is your space right now?

| Answer | Said back as |
|---|---|
| Mostly clean, with a little to tidy | your space mostly needs a little tidying |
| A few areas are cluttered | a few areas of your space are cluttered |
| Mess is building up in most rooms | mess is building up in most rooms |
| It feels too overwhelming to start | your space feels overwhelming to start |
| It changes from week to week | your space changes from week to week |

### What's the toughest part about keeping your home tidy?

| Answer | Said back as |
|---|---|
| Sticking to routines | sticking to routines is the toughest part |
| Dealing with clutter | dealing with clutter is the toughest part |
| Managing messes from others | managing messes from others is the toughest part |
| Balancing work and chores | balancing work and chores is the toughest part |
| Keeping up with kids' stuff | keeping up with your kids' stuff is the toughest part |

## I procrastinate (`daily_habit`)

### Where do your habits usually break?

| Answer | Said back as |
|---|---|
| Weekends | weekends are where it breaks |
| After one missed day | one missed day ends it |
| When work gets heavy | a heavy week ends it |
| Travel and odd weeks | travel ends it |
| After the first week or two | it fades after a week or two |

### What have you tried to make things stick? (choose all that apply)

| Answer | Said back as |
|---|---|
| Streaks and trackers | streaks and trackers |
| Reminders and alarms | reminders and alarms |
| Pinning it to something I already do | pinning it to something you already do |
| Doing it with someone | doing it with someone |
| Other apps | other apps |
| Nothing yet | nothing yet |

### What would sticking with it change?

| Answer | Said back as |
|---|---|
| How my mornings start | a morning that starts right |
| How I feel by Friday | something left by Friday |
| Trusting myself to follow through | trust in yourself to follow through |
| Everything else I want to build | the other things you want to build |
| My health, long term | a run at your long-term health |
