import type { LessonDefinition } from '../lessonBlock';

/**
 * Temper, and the pressure underneath it.
 *
 * The spine is SAMHSA's cognitive behavioural anger management manual — the
 * anger meter, the four cue types, the A-B-C-D model, the aggression cycle,
 * assertiveness. It is a published curriculum, which is what lets these make
 * claims rather than gesture at them.
 *
 * `pressure` runs on these; `quiet` and `focus` take the ones about noticing.
 */
export const ANGER_LESSONS = [
  {
    id: 'anger.recovery',
    title: 'A short pause helps you reply well',
    step: 'When anger spikes, pause before you reply.',
    blocks: [
      {
        kind: 'text',
        text: 'When someone upsets you, the urge to answer can arrive before you have thought about what to say. Your face may feel hot or your jaw may tighten. Giving yourself **a short pause before replying** creates room to notice that reaction and choose your words.',
      },
      { kind: 'fact', value: '1 pause', caption: 'between feeling angry and choosing what to do' },
      {
        kind: 'text',
        text: 'Feeling angry is a normal part of being human, so you do not need to blame yourself for the first rush. What you can practise is **leaving a little space between the feeling and your response**. Even when you still feel upset, that space gives you another option.',
      },
      { kind: 'text', text: 'For example, your boss texts, “Why isn’t this done yet?” and you want to send a sharp reply. If you **put the phone down for a moment**, you can think about what they need to know and what you want to explain before sending anything.' },
      { kind: 'text', text: 'During that pause, breathe out gently, then read the message again and consider what you want your reply to do. If following instructions would help, Azora offers short guided practices called Resets. One is **5-4-3-2-1**, which walks you through noticing things you can see, hear, touch, smell, and taste. It gives you something simple to focus on before returning to the conversation.' },
      {
        kind: 'choice',
        prompt: 'Your boss texts, “Why isn’t this done yet?” Your face gets hot. What is your best next move?',
        options: [
          { label: 'Pause, breathe out, then read it again', feedback: 'A pause gives you time to decide what needs answering and how you want to explain it, even if the tone still bothers you.' },
          { label: 'Reply right now so the feeling is out', feedback: 'Sending immediately may express the feeling, but it leaves no time to review your words. A pause lets you choose what you want the person to receive.' },
        ],
      },
      { kind: 'sequence', prompt: 'A sharp message arrives. Put the steps in the right order.', steps: [
        'Notice the urge to snap back.',
        'Pause and read the message again.',
        'Reply with what happened and what you need.',
      ], feedback: 'Noticing the urge gives you a reason to pause. That pause lets you review the message before explaining what happened and what you need.' },
      {
        kind: 'do',
        text: 'Next time you feel the urge to reply in anger, **put the phone down for a moment**. Breathe out gently, read the message again, and explain what happened and what you need when you are ready.',
      },
    ],
    source: 'Aggression cycle and time-out skills: SAMHSA anger management manual, sessions 3–4.',
  },
  {
    id: 'anger.meter',
    title: 'Rate your anger to catch it early',
    step: 'When anger climbs, silently rate it from one to ten.',
    blocks: [
      {
        kind: 'text',
        text: 'Anger often builds before it becomes hard to manage. You might begin feeling slightly annoyed and later find yourself wanting to shout. To notice that change, you can **give your anger a number from one to ten**. This is called an anger meter, and it helps you check in with yourself.',
      },
      { kind: 'fact', value: '1–10', caption: 'your anger meter: 1 is calm, 10 is as angry as you get' },
      {
        kind: 'text',
        text: 'On this scale, one means calm or barely bothered, while ten means as angry as you get. There is no exact score you have to find. The point is to **notice how strong the feeling is right now**, so you can tell when it is growing.',
      },
      { kind: 'text', text: 'As you use the scale, pay attention to what happens in your body and behaviour. Your jaw might tighten at a three, your voice might grow louder at a five, and you might want to shout at a seven. These examples help you **work out what your own numbers feel like**.' },
      { kind: 'text', text: 'Once you notice those early signs, you have a chance to pause before the feeling grows stronger. At a three or four, try **breathing out gently, stepping away, or waiting before replying**. You do not have to wait until you feel close to losing your temper to take a break.' },
      {
        kind: 'choice',
        prompt: 'Your coworker interrupts you again. You notice you are at a 3 out of 10. What should you do?',
        options: [
          { label: 'Name the number and pause', feedback: 'Noticing a three gives you an early opportunity to pause. A gentle breath or a break can help you choose your response before the feeling gets stronger.' },
          { label: 'Wait and see if it gets worse', feedback: 'You do not have to wait for anger to become strong enough to shout. Noticing it at a three is already a useful reason to take a pause.' },
        ],
      },
      { kind: 'reveal', prompt: 'Tap each part of a quick anger check.', items: [
        { label: 'My number', detail: 'Say it silently: “I am at a 4.” The number tells you if anger is climbing.' },
        { label: 'My body sign', detail: 'Find where you feel it: a tight jaw, a hot face or a louder voice. That sign is your early alarm.' },
      ] },
      {
        kind: 'do',
        text: 'Next time you notice anger building, **silently give it a number from one to ten**. Notice one place you feel it in your body, and use that check to decide whether a pause would help.',
      },
    ],
    source: 'The anger meter, SAMHSA anger management manual (PEP19-02-01-001), session 2.',
  },
  {
    id: 'anger.cues',
    title: 'Spot the early warning signs of anger',
    step: 'Recall a recent anger and name the first sign you noticed.',
    blocks: [
      {
        kind: 'text',
        text: 'Anger can feel sudden, especially when you only notice the feeling after you have snapped at someone. Looking back more closely, you may find **a small change that happened first**, such as a tight jaw or a familiar thought. Learning that early sign gives you a reminder to slow down.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Body', text: 'Your jaw clenches, your shoulders rise, your face gets hot.' },
          { term: 'Thoughts', text: 'A sentence pops up, like “Here we go again.”' },
          { term: 'Feelings', text: 'Under the anger, you may feel hurt, embarrassed or scared.' },
          { term: 'Actions', text: 'You slam a door, raise your voice or type faster.' },
        ],
      },
      {
        kind: 'text',
        text: 'These signs can show up in your body, thoughts, feelings, or actions. You do not need to track all four at once. Start by **noticing the sign that tends to arrive first for you**, because that is the one you may be able to catch next time.',
      },
      { kind: 'text', text: 'Think about a recent argument and the moments before you raised your voice. Perhaps your shoulders tightened, or you thought, “They never listen.” By connecting that change with what followed, you can **recognize it as a cue to pause**, rather than only noticing anger afterward.' },
      { kind: 'text', text: 'If muscle tension is a sign you often miss, you can explore it during a quiet moment with **Muscle Release**. This is one of Azora’s Resets, or short guided practices. It asks you to gently tighten and then relax different muscles, helping you notice the difference between holding tension and letting it go.' },
      {
        kind: 'choice',
        prompt: 'You are in a tense talk and feel your jaw tighten. What can that sign do for you?',
        options: [
          { label: 'Tell me to slow down now', feedback: 'If a tight jaw is one of your early signs, noticing it gives you a reminder to pause before you speak. You can still discuss what bothered you afterward.' },
          { label: 'Nothing, so I ignore it', feedback: 'That feeling may be useful information about how you are reacting. If it often comes before you snap, you can use it as a reminder to slow down.' },
        ],
      },
      {
        kind: 'do',
        text: 'Think of a recent time you felt angry and **name the first change you noticed**. It might have been a body feeling, a thought, another emotion, or something you did. That is the sign to look for next time.',
      },
    ],
    source: 'Four cue types (physical, behavioural, emotional, cognitive), SAMHSA anger management manual, session 2.',
  },
  {
    id: 'anger.boring',
    title: 'Hunger and tiredness make anger stronger',
    step: 'When anger climbs, meet a basic need before deciding what to say.',
    blocks: [
      {
        kind: 'text',
        text: 'A small problem can feel much harder to handle when you are hungry, tired, uncomfortable, or rushing. Those needs may be adding to your anger even when the problem itself is real. Before deciding what to say, it can help to **check how you are doing physically**.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Hungry', text: 'Missed a meal? Food can take the edge off fast.' },
          { term: 'Short of sleep', text: 'Everything feels harder after a bad night.' },
          { term: 'Uncomfortable', text: 'Too hot, too loud, too crowded, or in pain.' },
          { term: 'Running late', text: 'Rushing leaves no room for patience.' },
        ],
      },
      {
        kind: 'text',
        text: 'Food, rest, comfort, and enough time all affect how much patience you have available. When one is missing, you may react more strongly than you would on another day. **Noticing that need gives you something to address**, without dismissing whatever upset you.',
      },
      { kind: 'text', text: 'For example, imagine waiting for a late bus at six in the evening after missing lunch. The delay is frustrating on its own, but being hungry can make the wait feel even worse. **Both the delay and the hunger matter** when you decide what would help.' },
      { kind: 'text', text: 'If you can, take care of one immediate need before responding. You might eat a snack, drink water, sit down, or find a quieter place. Then **return to the problem and decide what it needs**. You may still want to speak up, with a little more room to choose how.' },
      {
        kind: 'choice',
        prompt: 'You snap at a friend after a long day with no lunch. What should you check first?',
        options: [
          { label: 'Whether hunger or tiredness is adding pressure', feedback: 'Hunger or tiredness may be making the reaction stronger. Taking care of that need can give you more room to decide what still needs discussing.' },
          { label: 'Decide my friend caused all of it', feedback: 'Your friend may have done something, but hunger and tiredness can make it feel much bigger. Check your needs first.' },
        ],
      },
      {
        kind: 'do',
        text: 'Next time anger builds, **check whether you are hungry, tired, uncomfortable, or rushed**. Take care of one need if you can, then decide what you want to say about the problem.',
      },
    ],
    source: 'State factors in reactivity: hunger, sleep debt, thermal discomfort and time pressure all lower the threshold.',
  },
  {
    id: 'anger.belief',
    title: 'Check the story you tell yourself',
    step: 'Write one other explanation for something that annoyed you this week.',
    blocks: [
      {
        kind: 'text',
        text: 'When something upsetting happens, your mind quickly tries to explain why. That explanation can add to your anger, especially if it assumes someone meant to hurt or disrespect you. Before acting on it, you can **check what you know and what you are guessing**.',
      },
      {
        kind: 'text',
        text: 'The event and your explanation are two different parts of the situation. You might know that someone did not reply, without knowing why. If you notice the explanation your mind supplied, you can **leave room for information you do not have yet**.',
      },
      {
        kind: 'text',
        text: 'For example, a friend arrives thirty minutes late and you think, “They do not care about me.” Their arrival time is something you know, while their reason is still unclear. Traffic or losing track of time could also explain it. **Another explanation may fit the same facts**.',
      },
      { kind: 'text', text: 'To check your first explanation, ask what happened, what you thought it meant, and how that thought made you feel. Then consider **one other reason that fits what you know**. You do not have to make the situation sound good; you are simply checking whether your first conclusion is the only possibility.' },
      { kind: 'text', text: 'When it is appropriate, you can ask the person what happened rather than settling on a guess. **Getting more information can guide your response**. If they did behave unfairly, you can still explain the problem and ask for a change.' },
      {
        kind: 'choice',
        prompt: 'A coworker has not answered your message all day. You think, “They do not respect me.” What is a better next move?',
        options: [
          { label: 'Ask what else might explain the delay', feedback: 'The delay does not tell you its cause. Considering another explanation leaves room to ask what happened before you decide how to respond.' },
          { label: 'Treat my first thought as true', feedback: 'You know the reply is delayed, but you do not yet know why. You can notice your first thought without treating it as confirmed information.' },
        ],
      },
      {
        kind: 'do',
        text: 'Choose something that annoyed you this week. Write down what happened and **the explanation you gave it**, then add one other explanation that could fit the same facts.',
      },
    ],
    source: 'A-B-C-D model (activating event, belief, consequence, dispute), SAMHSA anger management manual, session 5.',
  },
  {
    id: 'anger.expectation',
    title: 'Ask for help out loud',
    step: 'Write down the help you wanted and whether you clearly asked.',
    blocks: [
      {
        kind: 'text',
        text: 'You may feel annoyed when someone does not offer the help you hoped for. Sometimes they knew what was needed and did not follow through; sometimes you never discussed it. Before deciding which happened, **check whether you clearly asked for the help you wanted**.',
      },
      {
        kind: 'text',
        text: 'When you are busy or tired, what needs doing may seem obvious to you. Another person may not see the same thing, even if they care about you. **Putting the request into words** gives you both a clearer understanding of what help is needed.',
      },
      {
        kind: 'text',
        text: 'For example, you spent the evening cleaning and hoped your partner would do the dishes. If you did not talk about it, they may not know that was your plan. Asking, **“Can you do the dishes tonight?”**, makes the request clear enough for them to answer.',
      },
      { kind: 'text', text: 'A useful request names the action and when it is needed. “Can you take the trash out before eight?” tells the person what you are asking. **Being specific makes it easier to discuss the task**, instead of arguing about a broad statement such as “You never help.”' },
      { kind: 'text', text: 'If you have already made clear requests several times and nothing changes, the issue may need a longer conversation. You can **talk about how to share the work fairly**, rather than assuming another small request will resolve the whole pattern.' },
      {
        kind: 'choice',
        prompt: 'You wanted help with dinner, but you never said so. Now you feel annoyed. What would help most?',
        options: [
          { label: 'Say clearly what help I want', feedback: 'Asking “Can you chop the onions?” explains the help you want, so the person can tell you whether they can do it.' },
          { label: 'Expect them to figure it out', feedback: 'They may not know which part you need help with. Putting the request into words gives you a clearer way to discuss the work together.' },
        ],
      },
      {
        kind: 'do',
        text: 'Think of a recent time you wanted help. **Write down what you wanted the person to do**, then check whether you told them clearly. If you did, consider whether a conversation about the agreement is needed.',
      },
    ],
    source: 'Expectancy violation as an antecedent in cognitive models of anger; unstated standards are the common case.',
  },
  {
    id: 'anger.bucket',
    title: 'Small stresses add up to big anger',
    step: 'List up to three other pressures behind a surprising reaction.',
    blocks: [
      {
        kind: 'text',
        text: 'After a difficult day, a small comment can bring out a much bigger reaction than you expected. Earlier pressures may still be affecting you. You can picture them as **water gradually filling a bucket**, with the final small problem adding enough to make it overflow.',
      },
      { kind: 'fact', value: '3 pressures', caption: 'can fill your bucket before the small thing hits' },
      {
        kind: 'text',
        text: 'Because the last thing happened just before your reaction, it can seem responsible for all of it. But poor sleep, a rushed morning, or money worries may already have left you stretched. **Looking at the whole day** can help you understand why that moment felt so hard.',
      },
      { kind: 'text', text: 'For example, you slept badly, your train was late, and a meeting went wrong. When your roommate mentions a light you left on, you yell. The comment may have bothered you, but **the pressure you were already carrying** helps explain the size of your reaction.' },
      { kind: 'text', text: 'When that happens, list a few pressures that were present before the final moment. Some may need immediate care, such as food or rest, while others need a plan or conversation. **Seeing the separate needs helps you choose where to begin**, and you can still take responsibility for how you responded.' },
      {
        kind: 'choice',
        prompt: 'A tiny problem makes you furious at the end of a hard day. What is probably going on?',
        options: [
          { label: 'Earlier stresses have added up', feedback: 'Earlier pressures may help explain why this moment felt so hard. Looking at them separately can show you what needs care or a practical plan.' },
          { label: 'The tiny problem explains everything', feedback: 'The final problem matters, and it may be only one part of what you were reacting to. Consider the earlier pressures before deciding what would help.' },
        ],
      },
      {
        kind: 'do',
        text: 'Think of a time your reaction surprised you. **List up to three pressures you were already carrying** that day, then notice whether one of them needed care or a practical next step.',
      },
    ],
    source: 'Cumulative load / allostatic framing: the proximate trigger is a poor predictor of response magnitude.',
  },
  {
    id: 'anger.control',
    title: 'Focus on what you can control',
    step: 'Write one action you can choose about a current problem.',
    blocks: [
      {
        kind: 'text',
        text: 'When someone behaves in a way that upsets you, you may want them to change immediately. You can ask for that change, but you cannot choose their response for them. It helps to **identify the part of the situation you can act on**, so you know what to do next.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Yours', text: 'What you say, when you say it, and what you do next.' },
          { term: 'Not yours', text: 'What they say, how they feel, and how it all turns out.' },
        ],
      },
      {
        kind: 'text',
        text: 'You can think of the situation in two parts: your choices and the other person’s choices. Your words, timing, and next action belong to you. Their words and decisions belong to them. **Knowing where your choice lies** helps you avoid spending all your effort trying to force an outcome.',
      },
      { kind: 'text', text: 'For example, a neighbour plays loud music late at night. You can ask them to turn it down, but they decide whether to agree. If they refuse, **you can consider another practical step**, such as contacting the landlord or using earplugs while you decide how to address it.' },
      { kind: 'text', text: 'If you feel stuck, ask yourself what one action is available now. You might make a request, explain a limit, or take a break from the conversation. **Choosing that next step gives you a way forward**, even when you cannot guarantee how the other person will react.' },
      {
        kind: 'choice',
        prompt: 'Someone keeps talking to you in a rude tone. What can you control?',
        options: [
          { label: 'My next sentence and whether I take a break', feedback: 'Yes. You cannot set their tone, but you can choose your words, ask for a change, or step away.' },
          { label: 'Make them speak nicely right now', feedback: 'You can ask them to change, but you cannot make them. Put your energy into your own next step instead.' },
        ],
      },
      {
        kind: 'do',
        text: 'Think of a current problem and **write one action you can choose**. Alongside it, name one outcome that depends on someone else as well, so you can see where to put your effort.',
      },
    ],
    source: 'Control appraisal: perceived controllability moderates anger intensity and predicts problem-focused coping.',
  },
  {
    id: 'anger.timeout',
    title: 'Take a break and say when you’ll return',
    step: 'Practise asking for a break and naming when you will return.',
    blocks: [
      {
        kind: 'text',
        text: 'When voices rise and you cannot think clearly, continuing an argument may make it harder to understand each other. **A short break gives you time before continuing**. In an ordinary disagreement, explaining that you will return helps the other person understand that you are pausing the talk rather than abandoning it.',
      },
      { kind: 'fact', value: '1 return time', caption: 'turns walking away into a real break' },
      {
        kind: 'text',
        text: 'This kind of break is often called a time-out. You explain that you are too upset to talk well and **agree on a time to return**. That gives the pause a clear purpose: making room to settle before you try to discuss the problem again.',
      },
      { kind: 'text', text: 'For example, you and your partner are arguing about money and both voices are getting louder. You could say, **“I’m too upset to talk well right now. Can we try again after dinner?”** Once you have agreed, step away for a quiet moment or a walk.' },
      { kind: 'text', text: 'During the break, try walking, stretching gently, or breathing comfortably rather than rehearsing more accusations. Return at the agreed time and begin with the problem you want to solve. **Keeping that agreement is part of the pause**. If the conversation feels unsafe, prioritize safety and support rather than returning to it.' },
      {
        kind: 'choice',
        prompt: 'You are too heated to talk clearly. What is a good time-out?',
        options: [
          { label: 'Say I need a break and when I will return', feedback: 'Explaining the break and agreeing on a return time tells the person that you intend to continue the discussion once you have had a pause.' },
          { label: 'Walk away without a word', feedback: 'In an ordinary disagreement, a clear explanation can help the other person understand the pause. If you feel unsafe, leaving for safety takes priority.' },
        ],
      },
      {
        kind: 'do',
        text: 'Practise a sentence you could use in an ordinary disagreement: **“I need a break. Can we talk again after dinner?”** Choose a time you can keep, and leave room to agree on it together.',
      },
    ],
    source: 'Time-out procedure, SAMHSA anger management manual, session 3: the announcement and the return are both part of it.',
  },
  {
    id: 'anger.assert',
    title: 'Ask clearly without attacking',
    step: 'Make one clear request today, naming the behaviour and what helps.',
    blocks: [
      {
        kind: 'text',
        text: 'If something needs to change, staying silent can leave the problem unresolved, while attacking the person can make it harder to talk. There is another approach: **say what happened and what you need clearly**. This is called being assertive, and it gives the conversation a specific issue to address.',
      },
      {
        kind: 'list',
        items: [
          { term: 'Passive', text: 'You say nothing, even though you need something to change.' },
          { term: 'Aggressive', text: 'You attack or blame the other person.' },
          { term: 'Assertive', text: 'You say what happened and ask for what you need, kindly and clearly.' },
        ],
      },
      {
        kind: 'text',
        text: 'Being assertive means explaining your concern without hiding it or insulting the person. You can be firm about what matters to you while **making a request they can understand**. The aim is to discuss a change, even if you do not agree about everything.',
      },
      { kind: 'text', text: 'For example, your roommate leaves dishes in the sink again. Instead of making a broad accusation, you could say, **“The dishes were left out again. Can you wash yours before bed?”** That names the problem and the change you want, giving them something specific to respond to.' },
      { kind: 'text', text: 'You can build your own request by naming what happened, how it affected you, and what would help next time. For example: “When plans change at the last minute, I feel rushed. Could you let me know earlier?” Then **leave space for their answer** so you can discuss what is possible.' },
      {
        kind: 'choice',
        prompt: 'You need to tell someone their comment hurt. Which opening is clearer?',
        options: [
          { label: 'When you said that, I felt hurt', feedback: 'Naming the moment and its effect gives the person a specific concern to respond to. You can then explain what you would like to change.' },
          { label: 'You always ruin everything', feedback: 'This judges the whole person without explaining the event. Naming the specific comment and its effect gives you a clearer starting point for the conversation.' },
        ],
      },
      {
        kind: 'do',
        text: 'Try one clear request today by **naming the behaviour and what would help**. Keep it specific, then listen to the answer before deciding whether another conversation is needed.',
      },
    ],
    source: 'Assertiveness training and the conflict resolution model, SAMHSA anger management manual, sessions 7–8.',
  },
  {
    id: 'anger.send',
    title: 'Reread an angry message before you send it',
    step: 'Leave an angry message in drafts and reread it before sending.',
    blocks: [
      {
        kind: 'text',
        text: 'When you are angry, a message can feel ready to send before you have decided what you want it to achieve. Once it arrives, the other person will read those words without knowing everything you were feeling. **Saving a draft gives you a chance to review it first**.',
      },
      { kind: 'fact', value: '1 reread', caption: 'before you hit send' },
      {
        kind: 'text',
        text: 'Writing privately can help you put your feelings into words. You can then decide which words belong in the message someone else receives. **Leaving the draft unsent for a while** lets you consider whether it explains the issue or says things you do not want to stand by.',
      },
      { kind: 'text', text: 'For example, a friend cancels for the third time and you type, “You are so selfish. Forget it.” If you save it and return later, you may choose something more specific: **“I was looking forward to this. Can we pick a date we can both keep?”**' },
      { kind: 'text', text: 'When you reread the draft, check whether it says what happened, what you need, and what you are asking the person to do. **Describe the event rather than judging the whole person**. If a reply is urgent, even a brief review gives you a chance to change words before sending them.' },
      {
        kind: 'choice',
        prompt: 'You have just typed an angry message. What is your next step?',
        options: [
          { label: 'Save it and reread it after a pause', feedback: 'An unsent draft gives you time to check whether the words explain what happened and what you need before the other person receives them.' },
          { label: 'Send it now to get it over with', feedback: 'Sending ends your chance to review the draft privately. Saving it for a pause lets you decide whether these are the words you want to send.' },
        ],
      },
      {
        kind: 'do',
        text: 'Next time you write an angry message, **leave it in drafts while you take a pause**. Reread it before sending and check whether it explains the issue and the response you want.',
      },
    ],
    source: 'Delay as a regulation strategy: the impulse to communicate anger decays faster than the appraisal behind it.',
  },
  {
    id: 'anger.rumination',
    title: 'Stop replaying the same fight',
    step: 'When a thought keeps replaying, ask what the next useful action is.',
    blocks: [
      {
        kind: 'text',
        text: 'After an argument, you may keep remembering what was said and imagining what you could have said instead. Sometimes this helps you decide what to do, but sometimes the same scene returns without anything new. **Noticing the repeated scene** helps you check whether the thinking is useful right now.',
      },
      { kind: 'fact', value: '1 next step', caption: 'turns replaying into planning' },
      {
        kind: 'text',
        text: 'Planning leads toward a decision or an action, such as arranging a calmer conversation. Replaying runs through the same words without adding information. **The difference is whether you find a next step**, rather than how much time you spend thinking about the argument.',
      },
      { kind: 'text', text: 'For example, you are in bed at eleven and go over the same conversation with your sister for the fifth time. If you still have no new information or plan, **you may be caught in a replay**. You can notice that without blaming yourself for the thought returning.' },
      { kind: 'text', text: 'At that point, ask whether there is one useful action available. If there is, write it down and decide when to do it. Otherwise, **choose something else to give your attention to for now**, such as reading or preparing for sleep. The thought may return; you can gently return to that activity again.' },
      {
        kind: 'choice',
        prompt: 'You have replayed an argument several times tonight. What will move you forward?',
        options: [
          { label: 'Name one thing I can do', feedback: 'Naming an action gives you something to plan. If no action is available tonight, you can choose another activity even if the thought returns.' },
          { label: 'Replay it until it feels settled', feedback: 'Another replay may leave the same question unanswered. Check for a useful action, then choose what to give your attention to for now.' },
        ],
      },
      {
        kind: 'do',
        text: 'When an argument keeps replaying, **ask what the next useful action is**. Write it down if there is one. If there is nothing to do now, choose another activity and return to the issue when needed.',
      },
    ],
    source: 'Rumination maintains and amplifies anger; distinguishing it from problem-solving is the standard intervention.',
  },
  {
    id: 'anger.driving',
    title: 'In traffic, keep your eyes on the road',
    step: 'If a driver upsets you, leave space and keep watching the road.',
    blocks: [
      {
        kind: 'text',
        text: 'If another driver cuts in front of you, you may feel angry and immediately assume they meant to be rude. You saw the move, but you may not know their reason. **Keeping that uncertainty in mind** can help you focus on the practical task of driving safely.',
      },
      { kind: 'fact', value: '1 sentence', caption: 'for when someone cuts you off: “I don’t know their reason.”' },
      {
        kind: 'text',
        text: 'The fact is that the driver moved in front of you. Their intention is less clear: they may not have seen you, or they may have made a poor decision. **You can respond to the road situation without deciding their motive**. Your attention is needed for what happens next.',
      },
      { kind: 'text', text: 'You do not need to find an excuse for dangerous driving or work out the other person’s story. Whatever their reason, **your immediate task is to protect the space around your car** and keep watching traffic. Following them to prove a point would create another risk.' },
      { kind: 'text', text: 'If it is safe, ease off the accelerator enough to leave more room and keep your eyes on the road ahead. You can remind yourself, “I don’t know their reason,” while letting them move away. **Space and attention are the useful response**, even if the anger is still there.' },
      {
        kind: 'choice',
        prompt: 'A driver cuts in front of you. What keeps you safe for the next minute?',
        options: [
          { label: 'Leave space and watch the road ahead', feedback: 'Yes. You can feel angry and still drive safely. Space and attention protect you, whatever their reason was.' },
          { label: 'Follow them to show they were wrong', feedback: 'Chasing them adds danger and changes nothing about what happened. Let them go and keep your focus ahead.' },
        ],
      },
      {
        kind: 'do',
        text: 'If another driver upsets you, **leave safe space and keep watching the road**. Remind yourself that you do not know their reason, and let them go rather than following them.',
      },
    ],
    source: 'Hostile attribution bias is unusually easy to observe in traffic, where intent is unknowable and assumed anyway.',
  },
  {
    id: 'anger.repair',
    title: 'Apologize clearly after you hurt someone',
    step: 'If you snapped at someone, name it and ask how to repair.',
    blocks: [
      {
        kind: 'text',
        text: 'If you spoke sharply or raised your voice, the other person may still feel hurt after you have calmed down. You can begin repairing that moment by **acknowledging what you did**. An apology gives you a way to take responsibility and discuss what would help next.',
      },
      { kind: 'fact', value: '1 repair', caption: 'names what you did and how it hurt' },
      {
        kind: 'text',
        text: 'A clear apology names your action, says you are sorry, and leaves room to hear what the other person needs. **Start with the effect of your behaviour**, rather than an explanation of why you were upset. You can discuss the original disagreement separately when you are both ready.',
      },
      { kind: 'text', text: 'For example, after yelling at your partner, you could say, **“I raised my voice earlier. I’m sorry. That wasn’t fair to you.”** This acknowledges your action directly, instead of making the apology depend on whether they admit to feeling upset.' },
      { kind: 'text', text: 'After apologizing, listen to their response. They may want time, or they may ask you to change something next time. **Choose a change you can follow through on**, such as asking for a break before raising your voice. Repair can take more than one conversation, and you cannot demand immediate forgiveness.' },
      {
        kind: 'choice',
        prompt: 'You spoke sharply to someone you care about. What is a good repair?',
        options: [
          { label: 'Name what I did and apologize', feedback: 'Naming your action shows what you are taking responsibility for. You can apologize, listen to the effect it had, and discuss what would help next.' },
          { label: 'Explain why I was right first', feedback: 'Your reasons may need their own conversation. Beginning with the action you regret keeps the apology focused on acknowledging the hurt you caused.' },
        ],
      },
      {
        kind: 'do',
        text: 'If you snapped at someone, wait until you are both ready to talk, then **name what you did and apologize**. Ask what would help and listen without requiring them to accept the apology immediately.',
      },
    ],
    source: 'Repair attempts after conflict predict relationship outcomes more strongly than conflict frequency does.',
  },
  {
    id: 'anger.oneproblem',
    title: 'Choose one problem to deal with',
    step: 'Write one specific problem and one action you can take about it.',
    blocks: [
      {
        kind: 'text',
        text: 'A delayed bus can remind you of work, money, and an argument at home all at once. With so much on your mind, it can be hard to decide where to begin. Start by **describing the problem happening right now**, such as “The bus is late and someone is waiting for me.”',
      },
      {
        kind: 'sequence',
        prompt: 'Put these steps in the order you would do them.',
        steps: [
          'Describe what happened in one sentence.',
          'Choose the part that needs attention now.',
          'Name one action you can take about that part.',
        ],
        feedback: 'Start by checking the situation. Then choose one clear action and follow the details you have checked.',
      },
      {
        kind: 'text',
        text: 'That description helps you see what needs a decision today. You may need to tell someone about the delay or check another route. **Choosing one problem to act on** leaves the other worries available for a separate time, when you have the information and attention they need.',
      },
      {
        kind: 'choice',
        prompt: 'Your journey is delayed and several worries come to mind. What could you do first?',
        options: [
          {
            label: 'Tell the person waiting about the delay',
            feedback: 'This handles one practical part of the current problem. You can then decide whether checking another route would help.',
          },
          {
            label: 'Check another route before sending a message',
            feedback: 'This can work if you need a better arrival estimate. Keep the search specific so you can make the next decision.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Some parts will still be outside your control. You cannot make the bus arrive sooner, but you may be able to check its arrival time or call the person waiting. **Look for the action that is actually available**. If there is none right now, record the concern and decide when to review it.',
      },
      {
        kind: 'do',
        text: 'Think of a current problem and **write what happened in one sentence**. Add one action you can take about it, keeping other worries on a separate note for later.',
      },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
  {
    id: 'anger.askhelp',
    title: 'Ask for the help you need',
    step: 'Ask a trusted person for one specific kind of help.',
    blocks: [
      {
        kind: 'text',
        text: 'When you are having a hard time, someone may want to support you without knowing what would help. You can make that conversation easier by **asking for one specific kind of help**. Perhaps you want them to listen, explain a form, or help carry the shopping.',
      },
      {
        kind: 'text',
        text: 'Include the detail they need to answer. For a task, say what needs doing and when; for a conversation, ask whether they have time. **Explaining the kind of support you want** also helps: you might want ideas, or you might simply want someone to listen while you describe what happened.',
      },
      {
        kind: 'choice',
        prompt: 'You are upset after a meeting and want someone to listen. What could you ask?',
        options: [
          {
            label: 'Do you have ten minutes to listen without giving advice?',
            feedback: 'This names the time and the kind of support you want. The person can tell you whether they are available now.',
          },
          {
            label: 'Can we talk later today about the meeting?',
            feedback: 'This lets you agree on a time. When you talk, explain whether you want listening, advice, or help with a particular next step.',
          },
        ],
      },
      {
        kind: 'list',
        items: [
          {
            term: 'Listening',
            text: 'Ask whether the person has time to hear what happened, and say whether you want advice or simply someone to listen.',
          },
          {
            term: 'Practical help',
            text: 'Explain the job you need help with and when it needs doing, so the person can check whether they are available.',
          },
          {
            term: 'Information',
            text: 'Describe the question you need answered, such as which part of a form to complete, rather than asking them to solve everything.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Even a clear request may reach someone who is busy or unable to help. Leave room for them to say what they can offer, then consider whether another person could support you. **An honest answer helps you make the next plan**, without assuming that a refusal means your need does not matter.',
      },
      {
        kind: 'do',
        text: 'Choose someone you trust and **ask for one specific kind of help**. Explain the task, question, or time to listen that you need, then give them room to say what they can offer.',
      },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/',
  },
  {
    id: 'anger.afterstress',
    title: 'Check what needs doing after stress',
    step: 'After a difficult conversation, check one practical need before moving on.',
    blocks: [
      {
        kind: 'text',
        text: 'After a difficult conversation, you may keep thinking about what was said. Before deciding whether to continue the discussion, **check what needs doing now**. An agreed task, such as sending a document, may need a plan. Remembering another sentence you could have said may not need an immediate reply.',
      },
      {
        kind: 'reveal',
        prompt: 'Check these questions before choosing what to do.',
        items: [
          {
            label: 'Is there an immediate safety concern?',
            detail: 'If you were threatened or feel unsafe, move to a safe place if you can. Contact someone who can help before continuing ordinary tasks.',
          },
          {
            label: 'Did we agree on a task or reply that needs doing?',
            detail: 'Write the actual agreement, such as send the document tomorrow. You do not need to write every sentence from the conversation.',
          },
          {
            label: 'What do I need before choosing my next activity?',
            detail: 'You may need water, a quiet moment, or someone to listen. Choose that first if it helps you decide what to do next.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'If you agreed to do something, write down the task and when it is needed. This lets you **keep track of the practical next step** without recording every word of the conversation. If a reply needs more thought, you can choose a suitable time to return to it.',
      },
      {
        kind: 'choice',
        prompt: 'After a tense call, you keep replaying it. You also agreed to send a document tomorrow. What could you do?',
        options: [
          {
            label: 'Note the document and choose when to send it',
            feedback: 'This records the practical next step. Once it is written down, you can decide what you need now before beginning another task.',
          },
          {
            label: 'Ask someone trusted to listen before doing more work',
            feedback: 'Support may be what you need first. Explain what happened and what help you want, then return to the practical next step when you can.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'Once any task is recorded, consider what you need before starting something else. Water, a quiet moment, or talking with someone you trust may help you decide. **Safety comes before ordinary tasks**: if the conversation involved threats or you feel unsafe, seek a safe place and support first.',
      },
      {
        kind: 'do',
        text: 'After your next difficult conversation, **check one practical need before moving on**. Record any agreed task, then choose a safe next activity or ask someone you trust for support.',
      },
    ],
    source: 'https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/',
  },
] as const satisfies readonly LessonDefinition[];
