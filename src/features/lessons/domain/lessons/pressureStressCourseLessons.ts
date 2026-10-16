import { definePressureCourseLesson } from './pressureCourseLesson';

/** Original step-by-step stress course; the opening week lives in trialStressLessons. */
export const PRESSURE_STRESS_COURSE_LESSONS = [
  definePressureCourseLesson({
  "id": "stress.courseeight",
  "day": 8,
  "title": "Map One Stressful Moment",
  "step": "Describe one stressful moment in four short lines.",
  "teaching": [
    "A stressful moment can have several parts. Something happens, you give it a meaning, you notice how you feel, and you do something. **Describe one moment in pieces**. Separating the parts helps you understand your experience and find a practical choice. Start with an ordinary event, such as messages arriving while dinner is cooking.",
    "At dinner, three messages arrive. You think, “Everyone expects an answer now.” You notice that you are gripping your phone. You stop cooking to reply. **Each part tells you something different**. The messages are the situation. The expectation is your thought. Gripping is something you noticed. Replying is your action.",
    "You can use the example to find a choice. **Check one message’s actual deadline** before replying to all three. You might discover that two can wait until tomorrow. You do not have to change every part at once. Choose the part where a practical action is possible."
  ],
  "interaction": {
    "kind": "list",
    "items": [
      {
        "term": "Situation",
        "text": "Three messages arrived while dinner was cooking."
      },
      {
        "term": "Thought",
        "text": "“Everyone expects an answer now.” This interpretation still needs checking."
      },
      {
        "term": "Noticing",
        "text": "“I am gripping my phone.” This is something you noticed in the moment."
      },
      {
        "term": "Action",
        "text": "You stopped cooking to reply. Checking the deadlines could help you choose a different order."
      }
    ]
  },
  "choice": {
    "prompt": "Which note leaves room to investigate?",
    "options": [
      {
        "label": "“I thought every message was urgent.”",
        "feedback": "This identifies your thought. You can now check whether the messages actually have urgent deadlines."
      },
      {
        "label": "“The messages prove I cannot cope.”",
        "feedback": "This turns one moment into a broad judgment. Describe the situation and your response before drawing a conclusion."
      }
    ]
  },
  "action": "**Write four short lines** about one moment: what happened, what you thought, what you noticed, and what you did. Choose one detail you could check or one action you could change next time.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursenine",
  "day": 9,
  "title": "Leave Out Extra Effort",
  "step": "Put down one item you no longer need to hold.",
  "teaching": [
    "Sometimes you keep doing something after its purpose has ended. You grip a pen while listening, hold shopping bags after reaching a chair, or keep a phone in your hand between messages. **Notice one unnecessary effort**. The aim is to leave out an extra job, not to make every sensation disappear.",
    "For example, you finish writing a shopping list but keep squeezing the pen while checking the cupboard. **Put the pen on the table**. You can pick it up when you need it again. This is a small change to what you are doing. You do not need a special posture or a full inspection of your body.",
    "Choose what is comfortable and possible where you are. If you need to keep holding something for safety or support, leave it alone. **Ease only what you can comfortably change**. You can still have a busy day after setting down a pen. Small changes do not replace help with an excessive workload."
  ],
  "interaction": {
    "kind": "reveal",
    "prompt": "See how to leave out extra effort in an ordinary day.",
    "items": [
      {
        "label": "An item still needed",
        "detail": "Keep hold of a handrail when it helps you stand safely. There is no reason to give up useful support."
      },
      {
        "label": "An item you can set down",
        "detail": "Leave the phone on the desk while reading a paper document. Pick it up again when the task needs it."
      }
    ]
  },
  "choice": {
    "prompt": "You are listening after finishing your notes. What could you try?",
    "options": [
      {
        "label": "Set the pen down if comfortable",
        "feedback": "You stop an unnecessary action while keeping your attention on the conversation. You can pick it up for the next note."
      },
      {
        "label": "Force every part of yourself to relax",
        "feedback": "Trying to force a result creates another demand. Choose one comfortable change to what you are doing instead."
      }
    ]
  },
  "action": "**Notice one item you are holding**. If you no longer need it and can safely set it down, do that. Continue your task without holding it. Stop there; you do not need to search for more things to fix.",
  "source": "https://www.who.int/thailand/activities/doing-what-matters-in-times-of-stress Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.courseten",
  "day": 10,
  "title": "Give Breaks a Place",
  "step": "Choose a task ending as the start of a brief break.",
  "teaching": [
    "A break is easier to remember when it has a place in the day. “I will stop sometime” gives you no clear moment to notice. **Attach a brief break to a task ending**. For example, after you send the morning update, save your work and leave the screen for a short pause.",
    "Choose an ending you can recognize. Finishing one call, putting away the lunch dishes, or sending a document can work. **Use a small finished part**, rather than waiting until all your work is done. A full inbox may never be empty. One sent reply can still mark a reasonable stopping point.",
    "Keep the plan possible within your responsibilities. If you are caring for someone, choose a moment when they are safely settled. If your job limits breaks, use the time available and discuss missing opportunities with the appropriate person. **A useful plan fits the real setting**. It should not depend on a completely quiet day."
  ],
  "interaction": {
    "kind": "sequence",
    "prompt": "Put a brief break plan in a workable order.",
    "steps": [
      "Choose a task ending you can recognize today.",
      "Choose a brief break that fits your responsibilities.",
      "Try the pause at that safe opening and adjust if needed."
    ],
    "feedback": "A clear task ending gives you a starting point. Choosing a workable pause makes the plan easier to try."
  },
  "choice": {
    "prompt": "Which plan has a starting moment you can notice?",
    "options": [
      {
        "label": "Pause after the current call ends",
        "feedback": "The call has an identifiable ending. You can prepare a short pause before moving to the next demand."
      },
      {
        "label": "Pause only after the whole week is organized",
        "feedback": "This may keep moving out of reach. Choose an ordinary task ending that happens during the day."
      }
    ]
  },
  "action": "**Choose one task ending today** and write the brief break that will follow it. Use “After I finish ___, I will ___.” Try the plan once at a safe, workable time.",
  "source": "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.courseeleven",
  "day": 11,
  "title": "Separate Thought and Fact",
  "step": "Write one thought beside the facts you can check.",
  "teaching": [
    "A thought is an idea or interpretation in your mind. A fact is something you have reliable information for. **Separate what you know from what you assume**. This is useful when a stressful thought sounds certain. You are checking information, not insisting that every situation has a happy explanation.",
    "A manager sends “Can we talk tomorrow?” You think, “I have done something wrong.” The message does not say that. **The fact is the request to talk**. The reason is still unknown. There may be a problem, an ordinary update, or something else. You can prepare sensible questions without deciding the reason in advance.",
    "Write a fairer sentence that keeps the uncertainty: “I do not know the topic yet. I can ask what I should prepare.” **Pair the thought check with a useful action**. Asking about the topic gives you more information. Repeating reassuring guesses all evening would still leave you guessing about the same message."
  ],
  "interaction": {
    "kind": "reveal",
    "prompt": "See how to separate thought and fact in an ordinary day.",
    "items": [
      {
        "label": "Known information",
        "detail": "The message asks for a conversation tomorrow. You can quote that part without adding a motive."
      },
      {
        "label": "Unknown information",
        "detail": "The reason has not been given. Ask whether there is anything to bring or prepare if that would be useful."
      }
    ]
  },
  "choice": {
    "prompt": "Which sentence stays close to the available information?",
    "options": [
      {
        "label": "“We have a meeting; I do not know the topic yet.”",
        "feedback": "This includes the fact and the gap in your information. It leaves room to ask a practical question."
      },
      {
        "label": "“The short message means I am definitely in trouble.”",
        "feedback": "That is one interpretation, rather than information the message actually provides. Check what you know before acting on it."
      }
    ]
  },
  "action": "**Choose one stressful thought**. Write the facts you can check beside it. Add one honest sentence about what is still unknown, then choose a useful question or next action.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/reframing-unhelpful-thoughts/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursetwelve",
  "day": 12,
  "title": "Check the Worst Guess",
  "step": "Name a feared outcome and one other possible outcome.",
  "teaching": [
    "When a situation is uncertain, your mind may jump to its worst possible ending. **Notice when a prediction becomes a certainty**. A prediction is a guess about what will happen. It can matter without being proven. Checking a worst-case guess helps you prepare in proportion to what you actually know.",
    "You are late sending a document and think, “I will lose my job.” The delay is real. Losing the job is a predicted outcome. **Consider other possible responses**: the recipient may ask for an update, agree a new time, or raise a concern. You do not need to pick a cheerful ending; include plausible alternatives.",
    "Then handle the part you can act on. Send an honest update with a realistic completion time, or ask for help with the blocked part. **Preparation is different from predicting disaster**. If there is a genuine serious consequence, gather relevant information and support. Imagining the worst repeatedly does not supply that information."
  ],
  "interaction": {
    "kind": "reveal",
    "prompt": "See how to check the worst guess in an ordinary day.",
    "items": [
      {
        "label": "Prediction",
        "detail": "“One late document will end my job.” This describes a possible future, not an event that has already happened."
      },
      {
        "label": "Useful preparation",
        "detail": "Check the deadline, explain the delay, and agree the next step. Respond to the actual problem with information."
      }
    ]
  },
  "choice": {
    "prompt": "Which response helps with a late document?",
    "options": [
      {
        "label": "Check the consequences and send a realistic update",
        "feedback": "This addresses the real delay. It also gives the other person information they can respond to."
      },
      {
        "label": "Treat the worst imagined ending as settled",
        "feedback": "That may make acting harder while adding no new facts. Keep the prediction separate from the problem you can address."
      }
    ]
  },
  "action": "**Write one worst-case prediction** and one other plausible outcome. Circle the part you can check or act on today. Take that step, such as asking about a deadline or explaining a delay.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/reframing-unhelpful-thoughts/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursethirteen",
  "day": 13,
  "title": "Try a Dinner-Day Pause",
  "step": "Choose a workable pause before answering dinner-time messages.",
  "teaching": [
    "Let us return to dinner and the three messages. The pan needs attention, one message asks about tomorrow, and another asks for an answer this evening. **Check the situation before choosing a pause**. A useful pause must fit what is happening. Leaving cooking unattended is not a helpful way to create space.",
    "First make sure the immediate task is safely handled. Then read enough to find out what each request needs. **Separate now from later**. You could finish the cooking step, reply briefly to the evening request, and leave tomorrow’s question for a planned time. You are choosing an order rather than trying to answer everyone at once.",
    "Accessibility matters. A pause might mean sitting down, setting the phone aside, or simply not opening the next message yet. **Choose what is possible for you here**. You do not need to walk away, close your eyes, or find a quiet room. The useful part is making a deliberate choice before the next action."
  ],
  "interaction": {
    "kind": "sequence",
    "prompt": "Choose a workable order for the dinner situation.",
    "steps": [
      "Attend to the cooking that needs you now.",
      "Check which message actually needs a reply tonight.",
      "Choose a realistic response and an agreed time if needed."
    ],
    "feedback": "The immediate practical need comes first. Then use real deadlines to choose an order for the messages."
  },
  "choice": {
    "prompt": "What comes first while a pan needs your attention?",
    "options": [
      {
        "label": "Make the cooking situation safe before checking requests",
        "feedback": "The immediate practical need comes first. You can then choose a workable order for the messages."
      },
      {
        "label": "Leave immediately to find a perfect quiet place",
        "feedback": "The pause needs to fit your responsibilities. You can create a small decision point without abandoning a task that needs you."
      }
    ]
  },
  "action": "**Picture one busy household moment**. Write a safe, accessible pause and the decision that follows it: “After I finish this cooking step, I will check which message needs an answer tonight.” Try it when appropriate.",
  "source": "https://www.who.int/thailand/activities/doing-what-matters-in-times-of-stress Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursefourteen",
  "day": 14,
  "title": "Review One Helpful Change",
  "step": "Keep or adjust one action you tried this week.",
  "teaching": [
    "This week you noticed extra effort, made room for a break, and checked stressful thoughts. **Review one moment where you tried a skill**. You do not need to rank your whole week. Describe what you thought and what you did. “I checked the message deadline before replying” gives you something specific to learn from.",
    "Next ask what changed. Perhaps checking a deadline showed that a reply could wait. Perhaps a planned pause never happened because dinner needed attention. **Use the outcome as information**. A plan that did not fit tells you something about the setting. It does not prove that you are bad at managing your day.",
    "Keep a useful action, or change one part of an awkward one. If a break after a particular call was unreliable, choose a different task ending. **Make one small adjustment**. Avoid replacing the whole week with a demanding new routine. You are learning which actions fit your life well enough to repeat."
  ],
  "interaction": {
    "kind": "list",
    "items": [
      {
        "term": "Attempt",
        "text": "Name the thought check or practical action you tried in one real moment."
      },
      {
        "term": "Outcome",
        "text": "Describe what happened without turning it into a judgment about your whole week."
      },
      {
        "term": "Adjustment",
        "text": "Keep a useful part or change one detail that did not fit your circumstances."
      }
    ]
  },
  "choice": {
    "prompt": "Your planned pause was interrupted by urgent caring needs. What can you learn?",
    "options": [
      {
        "label": "The timing needs to fit the caring situation",
        "feedback": "You can look for another safe opening or ask about support. An interruption does not erase the purpose of rest."
      },
      {
        "label": "I should abandon breaks for the whole week",
        "feedback": "One difficult moment does not show that every opening will fail. Adjust the plan using what happened."
      }
    ]
  },
  "action": "**Write one action you tried and what happened**. Choose to keep it or change one detail. Finish with a realistic repeat plan: “After ___ tomorrow, I will ___.”",
  "source": "https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursefifteen",
  "day": 15,
  "title": "Check the Real Deadline",
  "step": "Confirm when one task is actually needed.",
  "teaching": [
    "An urgent feeling and an urgent deadline are different things. **Check when a task is actually needed**. A message can sound pressing without naming a time. A quiet envelope can contain a bill due today. Use the information on the task, rather than how loudly it competes for attention.",
    "Your list says “pay bill” and “send photos.” Open the bill and read the due date. Ask when the photos are needed. **Write the dates beside the jobs**. You may find that the bill needs action today and the photos can wait until the weekend. That gives you a reason for your order.",
    "Also check what happens if a task waits. A meal on the stove needs immediate attention. A routine filing job usually does not. **Use both time and consequences**. If two important deadlines conflict, ask the relevant person which can change. Do not silently move an agreed deadline because the list feels too full."
  ],
  "interaction": {
    "kind": "sequence",
    "prompt": "Sort a short list using the actual deadlines.",
    "steps": [
      "Check when each job is needed and what happens if it waits.",
      "Choose the job that needs your attention first.",
      "Begin its first small action or discuss a conflict."
    ],
    "feedback": "Check information before choosing the order. If important jobs conflict, make the problem visible rather than promising both."
  },
  "choice": {
    "prompt": "Which information helps you choose between two jobs?",
    "options": [
      {
        "label": "Their actual deadlines and the consequences of waiting",
        "feedback": "This gives you practical reasons for the order. You can discuss a conflict before either task becomes overdue."
      },
      {
        "label": "Which job makes me feel most guilty",
        "feedback": "Guilt does not show when the job is needed. Check the deadline and importance before deciding."
      }
    ]
  },
  "action": "**Check one real deadline today**. Read the original information or ask the person requesting the work. Put the confirmed date beside the task and choose when you will begin.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursesixteen",
  "day": 16,
  "title": "Make the First Step Clear",
  "step": "Rewrite one large job as a visible first action.",
  "teaching": [
    "A large job can hide its starting point. “Sort out money” includes many different decisions. **Name the first visible action**. A visible action is something you could describe someone doing, such as opening a statement or finding a bill. It gives you a starting point without needing to solve the whole problem at once.",
    "For example, “organize the appointment” becomes “find the letter with the booking number.” Once you have the number, the next step may be to call or use a booking page. **Let one step reveal the next**. You do not need a perfect plan for every possible complication before finding the letter.",
    "Choose a step that fits the time you have. Opening a file may fit a short gap; making a complicated call may need a longer opening. **Write an action, not another broad goal**. “Understand the situation” is vague. “Read the first page and note the due date” tells you where to start and where to stop."
  ],
  "interaction": {
    "kind": "sequence",
    "prompt": "Make a large job easier to begin.",
    "steps": [
      "Name the job and locate its starting information.",
      "Write the first small action someone could see you do.",
      "Do that action and use the result to choose what follows."
    ],
    "feedback": "A concrete action gives you a starting point without requiring a perfect plan for every later step."
  },
  "choice": {
    "prompt": "Which is a usable first action for a report?",
    "options": [
      {
        "label": "Open the draft and list the missing headings",
        "feedback": "You can begin this action directly. The missing headings then help you decide the next piece of work."
      },
      {
        "label": "Become completely organized before beginning",
        "feedback": "This adds another broad demand. Start by naming a concrete part of the actual report."
      }
    ]
  },
  "action": "**Choose one job you have been putting off**. Write its first visible action and do only that starting step. Then name the next step using the information you found.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.courseseventeen",
  "day": 17,
  "title": "Fit the Task to the Time",
  "step": "Estimate one task and define a clear stopping point.",
  "teaching": [
    "A plan becomes difficult when it assumes every minute will go perfectly. **Use the time the whole task really needs**. Include finding information, setting up, travel, and putting things away when those belong to the job. Use a recent similar task to estimate, rather than relying on an unusually fast attempt.",
    "Then decide what counts as finished today. If you are preparing a meeting agenda, the result may be the topics, owners, and meeting time sent to attendees. **Name the required result before starting**. Extra polishing does not automatically belong to the task. Follow any important requirements and check the expected scope if someone else depends on it.",
    "Suppose the agenda usually needs twenty minutes, but you have only ten. **Change the arrangement rather than inventing time**. You could move a flexible job, ask for help, or agree a smaller first draft. Leave room for an ordinary delay where possible. Make sure any change to a promised result is agreed with the person expecting it."
  ],
  "interaction": {
    "kind": "sequence",
    "prompt": "Plan the time and endpoint in a workable order.",
    "steps": [
      "Name the required result and check any agreed requirements.",
      "Estimate the whole task using a recent example, including setup.",
      "Find a realistic opening or discuss a change before committing."
    ],
    "feedback": "Knowing the result helps you estimate the actual work. If the work does not fit, change the arrangement instead of relying on an impossible schedule."
  },
  "choice": {
    "prompt": "The task usually needs twenty minutes, but only ten are available. What helps?",
    "options": [
      {
        "label": "Move flexible work or agree a smaller first result",
        "feedback": "This addresses the real time limit while keeping the expected result clear to anyone depending on it."
      },
      {
        "label": "Keep the same promise and assume no time will be needed for setup",
        "feedback": "Ignoring part of the task makes the plan less realistic. Estimate the whole job and discuss the conflict."
      }
    ]
  },
  "action": "**Choose one task for tomorrow**. Write its required result, estimate the whole time it needs, and find a realistic opening. If it will not fit, move flexible work or discuss a change before promising it.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.courseeighteen",
  "day": 18,
  "title": "Ask for a Named Task",
  "step": "Ask one person for a specific piece of help.",
  "teaching": [
    "A request is easier to answer when the other person knows what you need. **Name the task and the useful time**. “Can you help more?” may describe a real problem, but it leaves the next action unclear. “Could you collect the shopping on Thursday?” gives the person something specific to consider.",
    "Choose someone who could reasonably help with that part. A friend may collect a parcel; a manager may change work priorities. **Match the request to the person’s role**. You can also ask whether they know another source of help. You do not need to tell one person every detail before asking for a small practical task.",
    "Leave room for an honest answer. The person may say yes, no, or offer a different time. **Confirm what is actually agreed**. “Maybe” does not mean the shopping is covered. If the help is essential, check the arrangement and seek another option if needed rather than relying on an uncertain offer."
  ],
  "interaction": {
    "kind": "reveal",
    "prompt": "See how to ask for a named task in an ordinary day.",
    "items": [
      {
        "label": "A clear request",
        "detail": "“Could you collect the order on Thursday before six?” The task and timing are both visible."
      },
      {
        "label": "A confirmed arrangement",
        "detail": "“Thanks. You are collecting Thursday, and I will send the order number.” Both people know the next step."
      }
    ]
  },
  "choice": {
    "prompt": "Which request is easiest to answer?",
    "options": [
      {
        "label": "“Can you take the recycling out tonight?”",
        "feedback": "The person knows the task and when you need it. Their answer can lead to a clear arrangement."
      },
      {
        "label": "“Can you stop leaving everything to me?”",
        "feedback": "This may express real frustration, but it does not yet name the help you want next. Choose a specific task for the discussion."
      }
    ]
  },
  "action": "**Choose one task you could share**. Ask an appropriate person for that named task at a useful time. Check their answer and confirm the arrangement before treating the job as covered.",
  "source": "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursenineteen",
  "day": 19,
  "title": "Make an Honest Offer",
  "step": "Give a clear no or a smaller offer that genuinely fits.",
  "teaching": [
    "A smaller offer can help when you cannot do the whole request. **Offer only what you can actually manage**. If you have half an hour, say that rather than agreeing to an evening. A clear limit gives the other person information they need to make another plan for the remaining work.",
    "A friend asks you to help move on Saturday. You are available until eleven. You could say, **“I can carry boxes from ten until eleven.”** If you cannot help, say, “I cannot help on Saturday.” You can be considerate without giving a long defense of every commitment or inventing an excuse.",
    "Use the amount of choice you really have. A work instruction may need a priorities discussion rather than a simple refusal. **Make the conflict visible to the person who can decide**. At home, discuss important shared needs instead of assuming your limit automatically settles the whole arrangement. Clear information starts a practical conversation."
  ],
  "interaction": {
    "kind": "reveal",
    "prompt": "See how to make an honest offer in an ordinary day.",
    "items": [
      {
        "label": "A smaller offer",
        "detail": "“I can check the first page today.” This does not promise to review the whole document."
      },
      {
        "label": "A clear no",
        "detail": "“I cannot do the collection tomorrow.” Give enough notice for another arrangement where possible."
      }
    ]
  },
  "choice": {
    "prompt": "You can help for twenty minutes. Which reply fits?",
    "options": [
      {
        "label": "“I can help from two until two twenty.”",
        "feedback": "This offers the help that is actually available and makes the stopping time clear from the start."
      },
      {
        "label": "“I will stay as long as you need.”",
        "feedback": "This promises more than you know you can give. A realistic limit is more useful for both people’s planning."
      }
    ]
  },
  "action": "**Prepare one honest reply** to a current or likely request. Choose a clear no, a smaller offer, or a priorities question. Keep any offer within the time and responsibility you can genuinely take on.",
  "source": "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursetwenty",
  "day": 20,
  "title": "Agree a New Deadline",
  "step": "Request a deadline change and confirm the answer.",
  "teaching": [
    "A deadline change needs an agreement when another person depends on the result. **Ask before treating the date as moved**. Explaining a conflict early gives people more room to adjust. Silently planning to send work late leaves the other person unable to make an informed decision about their own plans.",
    "You need more time for a draft. Try: **“I can send a checked draft on Monday instead of Friday. Would that work?”** Include the practical reason briefly if useful. If Friday matters, ask whether a smaller agreed part would meet the immediate need. Do not promise a new time until you have checked it is possible.",
    "Listen to the answer and confirm the scope as well as the date. “Monday is fine” may refer to the full draft; “send the figures Friday” is a different agreement. **Write down what was decided**. If no change is possible, discuss other support or priorities rather than assuming you must somehow create extra time."
  ],
  "interaction": {
    "kind": "sequence",
    "prompt": "Request and confirm a changed deadline.",
    "steps": [
      "Check a realistic new date or smaller useful result.",
      "Ask the relevant person whether the change works.",
      "Record the date and result they actually agree to."
    ],
    "feedback": "A proposal becomes a new plan when the relevant person agrees. Record both the date and the expected result."
  },
  "choice": {
    "prompt": "When can you plan around a changed deadline?",
    "options": [
      {
        "label": "After the relevant person agrees to the new arrangement",
        "feedback": "Now you know which date and deliverable both people are expecting. Keep a note of the agreement."
      },
      {
        "label": "As soon as you decide the original deadline is difficult",
        "feedback": "Difficulty is a reason to start a conversation. It does not tell the other person that the agreement has changed."
      }
    ]
  },
  "action": "**Choose one deadline that needs discussion**. Check a realistic alternative, ask for the change, and record the answer. If it is not agreed, ask what support, reduced scope, or priority decision is available.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursetwentyone",
  "day": 21,
  "title": "Review a Practical Try",
  "step": "Review one planning or support action and adjust what follows.",
  "teaching": [
    "This week you checked deadlines, made a first step clear, planned with real time, and practiced requests. **Review one action you actually tried**. Name the action and the outcome. You might have started a delayed job, discovered a missing detail, or asked someone to share a task. Each result gives you information.",
    "If you asked for help, record the answer accurately. A partial yes covers only the part agreed. If you planned a job, compare the estimate with the work involved. **Match the next step to what happened**. A missing document may need finding. An unclear offer may need confirmation. Choose the real next requirement.",
    "Keep the part that worked and change one part that did not fit. **Do not make blame the adjustment**. An estimate that missed preparation needs more realistic time. A workload that stays too large needs a conversation about demands or support. The aim is a better next attempt, not a judgment about your worth."
  ],
  "interaction": {
    "kind": "list",
    "items": [
      {
        "term": "Action",
        "text": "Name what you did: “I asked for help with Thursday’s collection.”"
      },
      {
        "term": "Outcome",
        "text": "Record the actual answer or result, including any work still uncovered."
      },
      {
        "term": "Adjustment",
        "text": "Choose the next practical step, such as confirming the time or finding another option."
      }
    ]
  },
  "choice": {
    "prompt": "A task took longer because the details were missing. What should the next plan include?",
    "options": [
      {
        "label": "Finding the details before the task begins",
        "feedback": "You are using the actual difficulty to improve the next plan and give preparation a realistic place."
      },
      {
        "label": "The same estimate and a promise to try harder",
        "feedback": "This leaves out a real part of the work. Adjust the preparation or time using what happened."
      }
    ]
  },
  "action": "**Write one practical action you tried**, its outcome, and what remains. Choose one adjustment for the next attempt. Confirm any support or deadline agreement before relying on it.",
  "source": "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursetwentytwo",
  "day": 22,
  "title": "Leave a Shutdown Note",
  "step": "Write tomorrow’s first step before ending today’s work.",
  "teaching": [
    "An unfinished task can keep asking for attention after you stop working. **Leave a short shutdown note**. This is a record of where you reached and what comes next. It helps you return without trying to remember every detail during the evening. The note is for continuity, not a new long planning session.",
    "At the end of a report session, write: “Figures checked. Next: draft the summary from these three findings.” **Record the next visible action**. “Finish report” is less helpful because it hides the starting point again. Save the file and put the note where you will see it when you next work on the report.",
    "If someone needs an update before you stop, send a clear one within your responsibilities. Then use the agreed stopping arrangement. **Keep the note short enough to use**. A sentence or two can be enough. If work is routinely expected beyond your available hours, discuss the expectations rather than making the note responsible for fixing the workload."
  ],
  "interaction": {
    "kind": "sequence",
    "prompt": "Leave a useful note before ending work.",
    "steps": [
      "Save the work and check where you reached.",
      "Write the last completed part and the next visible action.",
      "Leave the note with the work for your return."
    ],
    "feedback": "The note preserves your place. Keep it short so it supports stopping rather than becoming another long planning task."
  },
  "choice": {
    "prompt": "Which shutdown note gives a useful return point?",
    "options": [
      {
        "label": "“Saved page two. Next: check the final totals.”",
        "feedback": "It tells you what is complete and where to begin next, without rebuilding the whole plan."
      },
      {
        "label": "“There is still so much to do.”",
        "feedback": "This describes the feeling but does not help you restart. Add the last completed part and one next action."
      }
    ]
  },
  "action": "**Before ending one task today**, save your progress and write a short return note. State where you stopped and the first action for next time. Leave the note with the work.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursetwentythree",
  "day": 23,
  "title": "Rest and Enjoyment Fit",
  "step": "Give one restful or enjoyable activity a realistic place.",
  "teaching": [
    "A full week can become a sequence of demands with nothing you choose for rest or enjoyment. **Make room before every job is finished**. Rest is not a reward for an empty list. Choose something realistically available with your time, energy, and responsibilities, such as sitting quietly, listening to music, or talking with a friend.",
    "After dinner, check which tasks genuinely need finishing tonight and which can wait. **Choose a small enjoyable activity that fits**. Listening to a favorite song may be possible even when a long outing is not. Put essential food away first and cover any caring needs. You can leave nonurgent papers for another day.",
    "Give the activity an actual opening rather than waiting for an unlikely spare hour. If it depends on another person, check their availability. **Keep enjoyment from becoming another performance**. You may still feel stressed afterwards. Its value does not depend only on changing a feeling. Review whether the arrangement fits before adding more steps."
  ],
  "interaction": {
    "kind": "reveal",
    "prompt": "See how to rest and enjoyment fit in an ordinary day.",
    "items": [
      {
        "label": "A manageable choice",
        "detail": "Listen to a song you enjoy during an available pause. Use something already accessible to you."
      },
      {
        "label": "A plan needing agreement",
        "detail": "Ask a friend whether a short call fits their evening before relying on that time together."
      }
    ]
  },
  "choice": {
    "prompt": "Which choice fits an especially busy day?",
    "options": [
      {
        "label": "Pick a small enjoyable activity that is actually available",
        "feedback": "A manageable choice gives enjoyment a real place without adding an elaborate project to the schedule."
      },
      {
        "label": "Create a demanding new hobby routine immediately",
        "feedback": "That may become another obligation. Start with something you already enjoy and can reasonably do."
      }
    ]
  },
  "action": "**Choose one thing you enjoy** and a workable time today or tomorrow. Prepare only what it needs. Let it be a chosen activity rather than a test of whether you can stop feeling stressed.",
  "source": "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursetwentyfour",
  "day": 24,
  "title": "Build a Simple Wind-Down",
  "step": "Choose one manageable cue for ending the evening.",
  "teaching": [
    "A wind-down is a short transition from the day’s activity toward bedtime. **Keep it simple enough for your real evening**. You might put tomorrow’s essentials by the door, finish a routine task, and choose a quieter activity. This is a practical routine to try, rather than a treatment or a guarantee of sleep.",
    "Choose one cue you can recognize, such as putting away the dinner dishes. **Follow it with one manageable action**. You could prepare the bag for morning or leave a note about tomorrow’s first job. Avoid creating a long checklist that makes bedtime feel like another performance to get exactly right.",
    "Work shifts, caring responsibilities, and shared living arrangements may limit the evening. Adapt the plan to what you can influence. **A consistent small action may fit better than an ideal schedule**. If sleep difficulties continue or affect daily life, seek appropriate professional guidance instead of adding more and more rules to the routine."
  ],
  "interaction": {
    "kind": "reveal",
    "prompt": "See how to build a simple wind-down in an ordinary day.",
    "items": [
      {
        "label": "A simple cue",
        "detail": "“After I put the dishes away…” This links the transition to something you already recognize in your evening."
      },
      {
        "label": "A manageable action",
        "detail": "“…I will set out tomorrow’s essentials.” Choose one task rather than building a long list of preparations."
      }
    ]
  },
  "choice": {
    "prompt": "Which wind-down plan is easier to try?",
    "options": [
      {
        "label": "One small action after an ordinary evening cue",
        "feedback": "You can see when to begin and what to do. Keep the plan within your actual time and responsibilities."
      },
      {
        "label": "A perfect routine with many rules that must never change",
        "feedback": "This may add pressure when the evening varies. Choose a small transition and adapt it when needed."
      }
    ]
  },
  "action": "**Choose one evening cue and one action** that helps you end the day. Try the small routine at a realistic time. Notice whether it fits your circumstances before adding anything else.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursetwentyfive",
  "day": 25,
  "title": "Handle the New Demand",
  "step": "Check a new request before changing your current plan.",
  "teaching": [
    "An unexpected request can make the whole plan feel cancelled. **Check the new demand before reshuffling everything**. Find out what is needed, when it is needed, and what happens if it waits. A request arriving now is not automatically a task that must be completed now.",
    "You are preparing dinner when a message asks for a document. Ask whether it is needed tonight or tomorrow afternoon. **Compare it with your existing commitments**. If tomorrow is fine, plan an opening then. If tonight genuinely matters, decide what can change and who needs to agree before you promise a response.",
    "Keep the first reply short and accurate. “I can check this after dinner; when do you need it?” gathers information without a premature promise. **Update the plan with the real answer**. If the new demand will displace other agreed work, make that conflict visible rather than quietly taking on both."
  ],
  "interaction": {
    "kind": "sequence",
    "prompt": "Handle a new demand before changing the plan.",
    "steps": [
      "Find out what is needed and the actual deadline.",
      "Compare the demand with your existing commitments.",
      "Give a realistic response and confirm any agreed change."
    ],
    "feedback": "Arrival time is not automatically deadline time. Check the demand before displacing an earlier commitment."
  },
  "choice": {
    "prompt": "A request arrives during a planned task. What comes first?",
    "options": [
      {
        "label": "Check its deadline and importance",
        "feedback": "You can decide whether the new task changes the plan using information rather than the interruption alone."
      },
      {
        "label": "Immediately abandon every earlier commitment",
        "feedback": "The new arrival may not be urgent. Check its needs before displacing work someone is already expecting."
      }
    ]
  },
  "action": "**Use one new request as a practice case**. Check what is needed and when, compare it with your commitments, and give a realistic response. Record any agreed change to the existing plan.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursetwentysix",
  "day": 26,
  "title": "Repair and Restart",
  "step": "Make one useful repair or restart without catching up.",
  "teaching": [
    "A mistake or missed day can turn into a broad story: “I have ruined everything.” **Start with what actually needs doing now**. A mistake may need a repair. A missed lesson usually needs a return to the current step. You do not need to punish yourself with extra work before continuing.",
    "If you send a document without its attachment, send the file with a brief acknowledgment. **Repair the actual problem**. If you missed yesterday’s planned pause, choose a workable opening today. These situations need different responses, but neither requires a judgment about your whole character. Keep important correction or reporting requirements when a mistake has consequences.",
    "After the repair or restart, choose one practical adjustment if it would help. You might attach a file before writing the message, or choose a more reliable break cue. **Continue from today rather than building a catch-up debt**. Adding every missed practice to the day can make returning harder than it needs to be."
  ],
  "interaction": {
    "kind": "reveal",
    "prompt": "Choose the response the situation actually needs.",
    "items": [
      {
        "label": "A missing attachment",
        "detail": "Send the correct file with a brief acknowledgment. Then use a simple check if it helps future messages."
      },
      {
        "label": "A missed practice day",
        "detail": "Choose today’s manageable action. You can return without doing every missed action first."
      }
    ]
  },
  "choice": {
    "prompt": "You missed yesterday’s planned practice. What is a useful restart?",
    "options": [
      {
        "label": "Choose a manageable action today and continue",
        "feedback": "This restores a usable next step without making the missed day into a growing catch-up requirement."
      },
      {
        "label": "Do every missed action before you are allowed to return",
        "feedback": "That can make restarting more demanding. Return with a small useful action that fits today."
      }
    ]
  },
  "action": "**Choose one repair or restart for today**. Correct an actual problem if needed, or return to a manageable course action. Add one practical adjustment only if it helps; do not create extra work as a punishment.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/reframing-unhelpful-thoughts/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursetwentyseven",
  "day": 27,
  "title": "Plan Your Next Week",
  "step": "Choose one repeat action and one source of support.",
  "teaching": [
    "A continuation plan is a short plan for using what helped after the course ends. **Choose one action worth repeating**. You do not need to schedule every skill. Look for something that fits a recurring problem, such as checking a request before answering or leaving a shutdown note when you finish work.",
    "Give the action a moment you can notice: “When a new request arrives, I will check its deadline and my list.” **Plan the small version for a busy day**. The small version might be asking one deadline question. Keeping it realistic is more useful than writing a routine that depends on spare time you rarely have.",
    "Add support for demands the action cannot solve. Name a person or service, what you would ask, and how to contact them. **Match support to the actual need**. A manager may discuss workload; a friend may share an errand. If stress affects daily life or feels hard to manage, consider speaking with a health professional."
  ],
  "interaction": {
    "kind": "sequence",
    "prompt": "Write a small continuation plan you can use.",
    "steps": [
      "Choose one helpful action and a moment you can notice.",
      "Name its smallest workable version for a busy day.",
      "Add who you can ask if the demand still exceeds your resources."
    ],
    "feedback": "The plan gives you a starting point, a manageable action, and a support route without requiring every skill every day."
  },
  "choice": {
    "prompt": "Which continuation plan is easiest to use?",
    "options": [
      {
        "label": "One repeat action with a clear moment and a support option",
        "feedback": "This gives you a practical starting point and acknowledges when the demand needs more than a personal skill."
      },
      {
        "label": "A long promise to use every skill perfectly every day",
        "feedback": "That adds a demanding routine. Choose the action that best fits the problem you actually face."
      }
    ]
  },
  "action": "**Write a one-week continuation plan**. Include one action, when you will use it, its smallest workable version, and who you can ask if the demand remains too large. Keep it where you will use it.",
  "source": "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
  definePressureCourseLesson({
  "id": "stress.coursetwentyeight",
  "day": 28,
  "title": "Keep Your Return Plan",
  "step": "Write a personal plan for the next stressful moment.",
  "teaching": [
    "The course ends with evidence from your own actions. **Name something you did differently**. Perhaps you checked a deadline, asked for a smaller task, finished one useful part, or returned after a missed day. A concrete example shows what you can repeat. You do not need to prove that stress has disappeared.",
    "Choose a likely future moment and match a skill to it. If requests pile up, check deadlines and discuss priorities. If you judge yourself harshly after an error, name the actual problem and repair it. **Use the skill that fits the situation**. There is no need to run through the entire course whenever a difficult moment arrives.",
    "Keep a short return plan: notice the moment, choose a useful action, and ask for support if demands remain too large. **Expect the plan to need adjustment sometimes**. A changed job, caring responsibility, or schedule may need different support. You can return to the plan, revise it, and continue without treating an awkward day as lost progress."
  ],
  "interaction": {
    "kind": "list",
    "items": [
      {
        "term": "Evidence",
        "text": "Keep one example of an action you completed and what it helped you discover."
      },
      {
        "term": "Return action",
        "text": "Match one skill to a likely stressful moment rather than using every skill at once."
      },
      {
        "term": "Support",
        "text": "Name who can help if the demand is still too much for the time and resources available."
      }
    ]
  },
  "choice": {
    "prompt": "What shows useful progress at the end of the course?",
    "options": [
      {
        "label": "A real example of an action you can use again",
        "feedback": "Completed actions give you evidence about what fits. Feeling stressed again does not erase those actions or the skills you practiced."
      },
      {
        "label": "A promise that you will never need help or feel stressed",
        "feedback": "That is not a realistic measure. Keep your useful actions and support options available for changing circumstances."
      }
    ]
  },
  "action": "**Write your personal return plan**: “When I notice ___, I will ___; if the demand is still too much, I can ask ___.” Add one real example of a helpful action you completed. Keep this note for your next stressful moment.",
  "source": "https://www.nhs.uk/every-mind-matters/mental-health-issues/stress/ Original Azora teaching and examples; course progression informed by https://www.stepiau.org/en/stress-control ."
}),
] as const;
