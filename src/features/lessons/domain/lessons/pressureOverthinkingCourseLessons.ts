import { definePressureCourseLesson } from './pressureCourseLesson';

/** Original extended teaching: attention, beliefs, problem solving, thinking, and uncertainty. */
export const PRESSURE_OVERTHINKING_COURSE_LESSONS = [
  definePressureCourseLesson({
    "id": "worry.courseeight",
    "day": 8,
    "title": "See the Whole Loop",
    "step": "Name the event, your thought, and what you did next.",
    "teaching": [
      "**A trigger is something that starts a reaction**. Your phone lights up, but the message is from a shop instead of your friend. You think, “They are avoiding me.” You then open your friend’s chat. The notification, the thought, and opening the chat are three different parts of this moment.",
      "**Look at what you do after the thought**. Checking may give you a moment of relief, followed by another urge to check. That repeated response can take up your afternoon even though no new message has arrived. You are learning to notice this pattern, rather than deciding that having the thought was wrong.",
      "**Describe one moment in plain words**: “A notification arrived. I guessed my friend was avoiding me. I checked their chat.” Then choose a different next action, such as putting the phone beside your bag and finishing your sandwich. You are finished when you have named the three parts and begun that next action."
    ],
    "interaction": {
      "kind": "reveal",
      "prompt": "Separate the three parts of the notification story.",
      "items": [
        {
          "label": "The event",
          "detail": "A shop notification appears. Your friend has still not replied."
        },
        {
          "label": "The thought",
          "detail": "You guess that your friend is avoiding you. The notification does not establish that."
        },
        {
          "label": "The response",
          "detail": "You open the chat again. You could instead put the phone beside your bag and finish lunch."
        }
      ]
    },
    "choice": {
      "prompt": "A shop notification arrives and you open your friend’s chat again. Which part is the response?",
      "options": [
        {
          "label": "Opening the chat",
          "feedback": "That is the action you took after the thought. Naming it shows where another next action is possible."
        },
        {
          "label": "My friend must be avoiding me",
          "feedback": "That is the guessed meaning, rather than an action. It remains a guess even when it feels convincing."
        }
      ]
    },
    "action": "**Name one event, the thought it brought, and your response**. Use the notification example or a moment from today. Then put the phone down and finish your sandwich or another small task you interrupted.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursenine",
    "day": 9,
    "title": "Where Attention Goes",
    "step": "Notice one detail in the task you are doing.",
    "teaching": [
      "**Attention is what you are noticing**. You can sit at a table with an open book while noticing only a worry about tomorrow. Your eyes may face the page, but you miss its meaning. This is a common shift, and you can notice it without calling yourself lazy or bad at concentrating.",
      "**Give attention a small, clear target**. If you are reading, choose the next sentence and find what it says. If you are washing a plate, look for the part that still has food on it. A specific target is easier to return to than the instruction “Stop being distracted all day.”",
      "**Try one return during an ordinary task**. Read one sentence, wash one plate, or fold one towel. When you notice your mind elsewhere, return to the next part of that same task. Complete the small part before deciding what to do next. Success means making a return, not never becoming distracted."
    ],
    "interaction": {
      "kind": "sequence",
      "prompt": "Return to one sentence in a book.",
      "steps": [
        "Notice that you have stopped following the words.",
        "Find the next sentence and read what it says.",
        "Finish that sentence before choosing the next one."
      ],
      "feedback": "The sentence is the target you return to. Finishing that small part is enough; you do not need to restart the whole book."
    },
    "choice": {
      "prompt": "You have reached the bottom of a page without following it. What is a manageable return?",
      "options": [
        {
          "label": "Read one sentence and find its meaning",
          "feedback": "A single sentence gives attention a clear target. You can build from that without demanding perfect concentration for the whole book."
        },
        {
          "label": "Restart the entire book",
          "feedback": "That makes the restart unnecessarily large. Losing track of a page does not erase everything you already read."
        }
      ]
    },
    "action": "**Choose one sentence, one plate, or one towel**. Notice a useful detail and complete that small part. Finish at the end of the sentence, plate, or towel; you do not need to check whether all distraction has stopped.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.courseten",
    "day": 10,
    "title": "Let the Thought Be There",
    "step": "Continue one task while an unwanted thought is present.",
    "teaching": [
      "**A thought does not need your answer immediately**. While folding a towel, you might remember an awkward comment from yesterday. You can notice the memory and still fold the towel. Having it in your mind does not require you to stop everything and decide exactly what everyone thought of you.",
      "**Fighting a thought can become another long task**. You might spend ten minutes testing whether it has gone away. Instead, name it briefly: “I am remembering that comment.” Look at the towel’s edges and bring them together. This gives you a next action without asking you to approve of the thought.",
      "**Finish the towel before checking your mood**. The memory may fade, remain, or return; you do not need to measure that. Put the folded towel away and choose the next item. If the comment needs a real apology, plan that separately. Today’s skill is continuing a task without first winning an argument inside your head."
    ],
    "interaction": {
      "kind": "reveal",
      "prompt": "What changes when you stop arguing with the memory?",
      "items": [
        {
          "label": "The memory appears",
          "detail": "An awkward comment comes to mind while you fold a towel. Its arrival does not require a full review."
        },
        {
          "label": "Your hands can continue",
          "detail": "Match the towel’s edges, fold it, and put it away while the memory is present."
        }
      ]
    },
    "choice": {
      "prompt": "The awkward memory remains after you start folding. What does that mean?",
      "options": [
        {
          "label": "I can finish folding while the memory is there",
          "feedback": "Continuing the task does not require approving of the memory or making it disappear. Your endpoint is the folded towel."
        },
        {
          "label": "I must stop and check whether I have accepted it correctly",
          "feedback": "That turns the return into another internal test. There is no required feeling to achieve before you can put away the towel."
        }
      ]
    },
    "action": "**Fold and put away one towel** while allowing a thought to be present. If you notice yourself testing whether it has disappeared, return to the edges of the towel. Stop when the towel is in its place.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.courseeleven",
    "day": 11,
    "title": "Preparing or Repeating?",
    "step": "Compare one preparation step with one repeated question.",
    "teaching": [
      "**Preparing produces something you can use**. Before a trip, you check the departure time and put your ticket in your bag. Repeating might sound like, “What if everything goes wrong?” without changing the plan. Both can feel serious, but only one has given you information or a useful action.",
      "**Ask what the thinking has produced**. Have you chosen a route, learned a departure time, or arranged a lift? Or have you returned to the same question with no new information? You do not need to judge every thought. Look at one short period and name the result you actually have.",
      "**Choose a finish line for preparation**. For tomorrow’s journey, check the time and place the ticket in your bag. Then close the timetable and continue your evening. You can respond if new information arrives. You do not need to imagine every possible delay before you are allowed to do something else."
    ],
    "interaction": {
      "kind": "list",
      "items": [
        {
          "term": "Useful result",
          "text": "The departure time tells you when to leave."
        },
        {
          "term": "Practical preparation",
          "text": "Putting the ticket in your bag makes it available for the journey."
        },
        {
          "term": "Repeated prediction",
          "text": "Imagining another delay gives you no new departure information."
        }
      ]
    },
    "choice": {
      "prompt": "The timetable is checked and your ticket is packed. You ask “What if it goes wrong?” again. What would help now?",
      "options": [
        {
          "label": "Use the plan and continue my evening",
          "feedback": "The needed information and materials are ready. More unchanged predictions do not add a practical step."
        },
        {
          "label": "Keep imagining delays until the journey feels guaranteed",
          "feedback": "Preparation cannot promise every part of the journey. A guarantee is an endpoint this thinking may never reach."
        }
      ]
    },
    "action": "**Choose one preparation with a visible endpoint**. Check a departure time and put the ticket ready, or prepare another ordinary item you need. Then close the information page and begin an evening task.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursetwelve",
    "day": 12,
    "title": "Show Care Through Action",
    "step": "Choose one caring action instead of another round of guessing.",
    "teaching": [
      "**Caring and worrying are not the same action**. You may worry about a friend and feel that stopping means you do not care. But care can show up in what you do: sending a kind message, keeping a promise, or listening when they speak. Repeated guessing is not the only way to stay connected.",
      "**Choose an action that fits the situation**. If your friend has a hard week, you could offer a short call when it suits them. Ask once and leave room for their answer. Sending many messages to make sure they are okay can put pressure on them without telling you more about what they need.",
      "**Finish the caring action and let it stand**. Send the offer or follow through on the help you agreed to give. Then return to your own day while your friend decides. You can care while eating lunch, working, or resting. You do not need to keep yourself worried as proof that the relationship matters."
    ],
    "interaction": {
      "kind": "reveal",
      "prompt": "Compare care with a demand for certainty.",
      "items": [
        {
          "label": "A caring offer",
          "detail": "“Would a short call help this week?” gives your friend a choice."
        },
        {
          "label": "A repeated test",
          "detail": "“Are you definitely okay with me?” asked repeatedly seeks certainty about their feelings."
        }
      ]
    },
    "choice": {
      "prompt": "You have offered your friend a call, and they have not answered yet. How can you respect the offer?",
      "options": [
        {
          "label": "Give them time to answer and continue my day",
          "feedback": "The offer remains available without repeated pressure. Their reply can guide what support they actually want."
        },
        {
          "label": "Send the offer repeatedly to prove I care",
          "feedback": "More messages may add pressure without making the offer more helpful. Caring is not measured by how worried you remain."
        }
      ]
    },
    "action": "**Choose one caring action**: offer a short call, listen, or follow through on agreed help. Do it once and allow the person room to respond. Finish by returning to your lunch, work, or another ordinary activity.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursethirteen",
    "day": 13,
    "title": "Choose Your Response",
    "step": "Notice a thought and choose one next action.",
    "teaching": [
      "**You do not choose every thought that arrives**. A memory, prediction, or uncomfortable question may appear while you are doing something else. Its arrival is different from what you do next. You may not be able to prevent the first thought, but you can practise choosing the next small action.",
      "**Avoid turning choice into blame**. If you get caught in repeated thinking, it does not mean you wanted to feel worried. Notice the point where you can return. For example, halfway through rereading an email, you can put the phone down and continue preparing the document you actually need to send.",
      "**Try a small response today**. When a familiar question arrives, say, “There is that question.” Choose the next visible action in your task, such as adding the document’s title. Finish that part before deciding what comes next. You are practising a response to a thought, not controlling which thoughts enter your mind."
    ],
    "interaction": {
      "kind": "sequence",
      "prompt": "Choose a response while working on a document.",
      "steps": [
        "Notice that you are rereading an unrelated email.",
        "Put the email aside and look at your document.",
        "Add the document’s title or its next useful sentence."
      ],
      "feedback": "The thought’s arrival is different from your next action. Putting the email aside lets you add something real to the document."
    },
    "choice": {
      "prompt": "A familiar thought appears without invitation. Which part can you practise choosing?",
      "options": [
        {
          "label": "The next small action I take",
          "feedback": "You may not control the thought’s arrival. Adding the next sentence is a practical response available now."
        },
        {
          "label": "Whether I ever have that thought again",
          "feedback": "That asks for control over every future thought. The lesson gives you a smaller choice you can actually practise."
        }
      ]
    },
    "action": "**Notice one thought without blaming yourself for its arrival**. Then add a title or sentence to a document, or complete a similarly small part of your task. Finish that part before choosing what comes next.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursefourteen",
    "day": 14,
    "title": "What Actually Helped?",
    "step": "Compare one useful action with what repeated worry added.",
    "teaching": [
      "**Look back at one ordinary concern** from this week. Perhaps you worried about getting to an appointment. You checked the address and chose a route, then spent time imagining awkward conversations. Separate those parts. Which gave you information or a useful plan? Which repeated a question that had no answer yet?",
      "**Avoid judging the whole day by its outcome**. A journey going well does not prove worry was necessary. A delay does not prove you should have worried more. Instead, look at what each action could actually do: checking the address helped you find the building; predicting every conversation did not determine what people said.",
      "**Keep the useful part for next time**. Write a short plan such as, “I will check the address and route, then return to my usual evening.” Close the note after that one decision. Finish by putting your appointment information where you can find it. You are choosing a practical routine, rather than rating yourself as a good or bad worrier."
    ],
    "interaction": {
      "kind": "reveal",
      "prompt": "Review a journey plan without judging the whole outcome.",
      "items": [
        {
          "label": "Useful action",
          "detail": "Checking the address helped you find the building."
        },
        {
          "label": "Repeated worry",
          "detail": "Imagining every conversation did not decide what the people there would say."
        },
        {
          "label": "A delay",
          "detail": "A delayed bus is not proof that you needed to worry for longer."
        }
      ]
    },
    "choice": {
      "prompt": "Your journey was delayed even after you checked the route. What is a fair review?",
      "options": [
        {
          "label": "The route check helped with directions; it could not control the bus",
          "feedback": "This separates what the action could do from circumstances it could not determine. You can keep the useful step."
        },
        {
          "label": "The delay proves I should have predicted more problems",
          "feedback": "More imagined outcomes would not necessarily change the bus. Review the actual preparation rather than blaming yourself for the whole journey."
        }
      ]
    },
    "action": "**Name one useful preparation from this week and what it actually did**. Choose whether to keep or adjust it next time. Put any needed information where you can find it, then end the review and return to your day.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursefifteen",
    "day": 15,
    "title": "Find a Solvable Problem",
    "step": "Separate one current problem from a question about possibilities.",
    "teaching": [
      "**A current problem has something specific to address**. Your internet bill shows a charge you do not recognise. You can check the bill and ask the provider about that charge. “What if all my bills become impossible forever?” is much broader. It asks about possibilities that you cannot settle in one phone call.",
      "**Turn a broad concern into a clear question if possible**. Ask, “What is happening now, and what information do I need?” You might need the amount, the date, or an explanation of one fee. If there is no current issue or useful planning step, repeated predictions do not become more solvable by taking longer.",
      "**Choose one response that fits**. For the unexpected charge, find the bill and mark the line you want explained. For a future possibility with no action today, leave it unanswered and begin an ordinary task. Do not postpone anything urgent. You are finished when you have identified the actual issue or returned to the day."
    ],
    "interaction": {
      "kind": "reveal",
      "prompt": "Sort these bill concerns.",
      "items": [
        {
          "label": "A current problem",
          "detail": "The bill includes an unfamiliar fee. You can ask the provider what it is."
        },
        {
          "label": "A broad possibility",
          "detail": "“What if every future bill is impossible?” cannot be answered by checking one current charge."
        }
      ]
    },
    "choice": {
      "prompt": "You notice an unfamiliar fee on this month’s bill. What turns the concern into a useful task?",
      "options": [
        {
          "label": "Find the fee and prepare a question about it",
          "feedback": "The amount and line on the bill give the provider something specific to explain."
        },
        {
          "label": "Try to settle the cost of every future bill",
          "feedback": "That expands one checkable issue into an unlimited future question. Start with the charge that exists now."
        }
      ]
    },
    "action": "**Find one real concern with an available next step**. Identify the line on the bill or another specific issue and prepare one question. If the concern has no action today, close the note and begin an ordinary task.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursesixteen",
    "day": 16,
    "title": "One Problem, Three Paths",
    "step": "Name one problem and list three realistic options.",
    "teaching": [
      "**A clear problem is easier to work on** than a verdict about your whole life. “I am terrible with paperwork” gives you no starting point. “I have an unopened letter about my electricity account” tells you where to look. Naming one problem does not deny the others; it lets you choose a manageable place to begin.",
      "**Describe the task before choosing an answer**. Open the letter and read what it asks. If you need to send a meter reading by Friday, possible steps might be using the provider’s website, calling their service line, or asking someone to help you understand the instructions. Keep options realistic for the time and access you have.",
      "**Choose a few possible routes, then stop collecting**. Three is enough for this small task. Check what each needs, such as an account number or someone’s agreement to help. Circle one workable option and put the letter ready. You are finished when you can name the actual problem and a possible way to address it."
    ],
    "interaction": {
      "kind": "list",
      "items": [
        {
          "term": "Problem",
          "text": "The letter asks for a meter reading by Friday."
        },
        {
          "term": "Possible routes",
          "text": "Check whether the provider accepts the reading online or by phone."
        },
        {
          "term": "Needed support",
          "text": "If instructions are unclear, ask someone to help you read them or contact the provider."
        }
      ]
    },
    "choice": {
      "prompt": "The letter asks for a meter reading. Which list gives you options you can compare?",
      "options": [
        {
          "label": "Use the website, call the provider, or ask for help with instructions",
          "feedback": "These are different practical routes. You can check access and requirements before choosing one."
        },
        {
          "label": "Become better at paperwork and never feel worried again",
          "feedback": "Those are broad ambitions, rather than options for sending this reading. They do not tell you what to do with the letter."
        }
      ]
    },
    "action": "**Describe one current problem in a sentence**. List up to three realistic ways to address it. Circle one possible route and put the letter or needed materials ready. Stop collecting options once you have a few workable choices.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.courseseventeen",
    "day": 17,
    "title": "Make the Plan Concrete",
    "step": "Write what you will do, how, and when.",
    "teaching": [
      "**A concrete plan says what will happen next**. “Sort out the form sometime” leaves the job vague. “After dinner on Thursday, I will complete the address section at the kitchen table” gives you a starting point. You can decide what materials and time you need because the task is now specific.",
      "**Use what, how, and when**. What: complete the address section. How: use the letter and account details already on the table. When: Thursday after dinner. If another person needs to help, include the arrangement you actually agreed. Keep the first step small enough to fit the time you have available.",
      "**Give the session an ending**. You might stop after one section or after checking the required information. Put away the documents safely and note the next step only if one remains. Planning does not guarantee that every obstacle disappears; it gives you something clear to start, so you can adjust if a real obstacle appears."
    ],
    "interaction": {
      "kind": "sequence",
      "prompt": "Make a plan for the address section.",
      "steps": [
        "Choose the address section as the first task.",
        "Put the letter and account details ready.",
        "Choose Thursday after dinner to complete that section."
      ],
      "feedback": "A task, materials, and a time make the starting point clear. You can finish at the end of the chosen section."
    },
    "choice": {
      "prompt": "Which plan tells you where to begin?",
      "options": [
        {
          "label": "Complete the address section after dinner using the documents on the table",
          "feedback": "The task, materials, and time are clear. You can start without deciding how to solve every piece of paperwork."
        },
        {
          "label": "Deal with everything when I finally feel ready",
          "feedback": "There is no specific task or time here. Waiting for a feeling can leave the same work undefined."
        }
      ]
    },
    "action": "**Write what, how, and when for one small action**. Gather what it needs or confirm any support you have agreed. Stop planning when the starting point and ending are clear, then take the step at its chosen time.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.courseeighteen",
    "day": 18,
    "title": "Try and Review",
    "step": "Carry out one planned step and check what happened.",
    "teaching": [
      "**Trying the plan gives you real information**. You may complete the address section, or discover that you need an account number you do not have. Either result tells you more than imagining the task repeatedly. The aim is to carry out a reasonable action and see what it changes, not force a perfect outcome.",
      "**Review the result with simple questions**. What did I do? What happened? Is another action needed? If a number is missing, finding it becomes the next problem. If the section is complete, leave it complete. You do not need to reopen it several times just because finishing feels unfamiliar or a doubt appears.",
      "**Choose the next step from what actually happened**. Find the missing number, schedule the next section, or put the completed form ready to send. End the review after that decision and put the materials away. A useful review helps you act; it does not ask you to judge your entire ability from one attempt."
    ],
    "interaction": {
      "kind": "reveal",
      "prompt": "What can an attempt tell you?",
      "items": [
        {
          "label": "The section is complete",
          "detail": "Put the completed work aside and choose the next section only if needed."
        },
        {
          "label": "An account number is missing",
          "detail": "Finding that number is the next practical task. It is information, not a judgement about your ability."
        }
      ]
    },
    "choice": {
      "prompt": "You start the form and discover a missing number. What is a useful review?",
      "options": [
        {
          "label": "Identify where to find the number and choose that next step",
          "feedback": "The attempt exposed a specific gap. You can update the plan using what actually happened."
        },
        {
          "label": "Decide the attempt failed and reopen the same blank section repeatedly",
          "feedback": "Repeatedly inspecting the blank field does not supply the number. The next useful action is finding the missing information."
        }
      ]
    },
    "action": "**Carry out one planned step**. Describe what happened and choose any next action the result requires. Put completed work away or gather the missing information. End the review once that next step is clear.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/problem-solving/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursenineteen",
    "day": 19,
    "title": "Facts Before Predictions",
    "step": "Separate one checkable fact from the meaning you guessed.",
    "teaching": [
      "**A fact describes what you can check**. A colleague sends “Can we talk tomorrow?” That tells you they want to talk and gives a time. It does not tell you that you made a mistake. “I must have done something wrong” adds a meaning that the message itself does not establish.",
      "**Write the message and the guess separately**. Keep the fact close to the actual words rather than adding a tone you cannot check. Then name your interpretation as a guess. You are not required to prove it false. The useful distinction is that one thing is known and the other still needs information.",
      "**Choose a response that fits the facts**. Confirm a suitable meeting time if needed and prepare any relevant work update. Then leave the guessed meaning unanswered until you know more. Put the appointment in your calendar and return to your current work. You are finished when the real arrangement is clear, not when you can predict the conversation."
    ],
    "interaction": {
      "kind": "reveal",
      "prompt": "Read “Can we talk tomorrow?” carefully.",
      "items": [
        {
          "label": "Known",
          "detail": "The person asked for a conversation tomorrow."
        },
        {
          "label": "Guessed",
          "detail": "They think you did something wrong. The message has not said this."
        },
        {
          "label": "Useful response",
          "detail": "Confirm the time and prepare a relevant update if appropriate."
        }
      ]
    },
    "choice": {
      "prompt": "The message gives no reason for the meeting. Which description stays closest to the facts?",
      "options": [
        {
          "label": "They want to talk; I do not know why yet",
          "feedback": "This keeps the request separate from its unknown meaning. You can arrange the meeting without claiming to know its outcome."
        },
        {
          "label": "They must be unhappy because the message is short",
          "feedback": "Message length does not establish their feelings. That interpretation adds information you have not received."
        }
      ]
    },
    "action": "**Choose one ambiguous message**. Name what it actually says and the meaning you guessed. Make any necessary arrangement, put it in your calendar, and return to your current task. Stop before trying to decode the person’s whole opinion.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/reframing-unhelpful-thoughts/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursetwenty",
    "day": 20,
    "title": "Write a Fairer Sentence",
    "step": "Write one balanced response and then take a practical step.",
    "teaching": [
      "**A balanced sentence includes what you know and what you do not**. After a quiet lunch, you might think, “My friend does not like me.” A fairer response is, “They were quiet today. I do not know why. I can be friendly without guessing their private thoughts.” This leaves the uncertainty visible.",
      "**Avoid replacing one certainty with another**. “Everyone definitely likes me” is not more checkable than the frightening claim. Look for a neutral account that helps you respond sensibly. You might acknowledge a real difficulty and still name an action you can take. The sentence should help you move on, rather than promise a particular feeling.",
      "**Write or say the sentence once**. If it points to a useful action, take that step. Otherwise return to the ordinary activity you interrupted. Do not keep editing the wording until it feels perfectly convincing. Finish by closing the note and doing the next small task, even if a little doubt remains."
    ],
    "interaction": {
      "kind": "list",
      "items": [
        {
          "term": "Fact",
          "text": "Your friend spoke less than usual at lunch."
        },
        {
          "term": "Guess",
          "text": "They no longer like spending time with you."
        },
        {
          "term": "Fairer sentence",
          "text": "They were quiet. You do not know why, and can remain friendly without deciding their private thoughts."
        }
      ]
    },
    "choice": {
      "prompt": "Which sentence is balanced without promising a happy outcome?",
      "options": [
        {
          "label": "They were quiet; I do not know why, and I can be friendly",
          "feedback": "This acknowledges both the observation and the missing information. It offers an ordinary response rather than a guarantee."
        },
        {
          "label": "They definitely like me and nothing can change that",
          "feedback": "That is another certainty you cannot check. A useful sentence can leave the question open."
        }
      ]
    },
    "action": "**Write or say one fairer sentence** about an assumed meaning. Include what you know and what remains unknown. Use it once, close the note, and begin the next small task instead of rewriting until you feel certain.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/reframing-unhelpful-thoughts/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursetwentyone",
    "day": 21,
    "title": "Read the Message Fairly",
    "step": "Use facts and a useful action for one ambiguous message.",
    "teaching": [
      "**Bring the thinking skills together with one message**. A colleague writes, “Please update this section.” The fact is that they requested an update. “They think I am incompetent” guesses their thoughts. “I will never get anything right” turns one request into an all-or-nothing judgement about your whole ability.",
      "**Look for the actual work needed**. Read which section they mean and what information should change. If the request is unclear, ask one specific question. You do not need to settle their entire opinion of you before you can update a paragraph. A fair response might be, “This section needs a change; I can clarify what change.”",
      "**Make the requested update or clarify it**. Follow your usual checking process and send the completed work when ready. Then close the document and begin another task. If you catch yourself rereading the message for hidden meanings, return to what you know: a change was requested, and you have taken the appropriate next step."
    ],
    "interaction": {
      "kind": "sequence",
      "prompt": "Handle a request to update a work section.",
      "steps": [
        "Read which section needs a change and what is requested.",
        "Clarify one genuinely missing detail if necessary.",
        "Make the update and follow the normal checking process."
      ],
      "feedback": "Read the actual request before guessing its meaning. Clarification and the normal check help complete the work the message asks for."
    },
    "choice": {
      "prompt": "A colleague asks for an update. You think this means you are incompetent. What should guide your next step?",
      "options": [
        {
          "label": "The actual requested change",
          "feedback": "The request identifies work you can do. A broad judgement about your ability adds no instructions for the update."
        },
        {
          "label": "Every hidden opinion the colleague might have",
          "feedback": "You cannot establish their entire opinion from this message. Trying may delay the clear task in front of you."
        }
      ]
    },
    "action": "**Use one request as a worked example**. Separate its actual instructions from any guessed judgement. Clarify a real gap if needed, make the change, and complete the normal check. Close the document when the task is finished.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/reframing-unhelpful-thoughts/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursetwentytwo",
    "day": 22,
    "title": "Enough for a Small Choice",
    "step": "Make one low-stakes choice with enough useful information.",
    "teaching": [
      "**Small everyday choices rarely need complete certainty**. You want a notebook for shopping lists. You can check that it fits in your bag and has enough pages. You may still wonder whether another colour would be better. That remaining doubt does not mean the choice requires an afternoon of comparison.",
      "**Decide what matters before comparing**. For this notebook, size and a price you can comfortably afford may be enough. Choose from a few suitable options rather than opening endless new searches. Keep this approach to ordinary low-stakes choices. Health, safety, legal, and important financial decisions still deserve their appropriate checks and qualified advice.",
      "**Choose and put the item to use**. Write the first shopping item in the notebook you already have or choose one within your budget. Then close the comparison pages. Finish by using your choice for its actual purpose. You do not need to prove that no better notebook exists anywhere before making a useful list."
    ],
    "interaction": {
      "kind": "list",
      "items": [
        {
          "term": "Main needs",
          "text": "The notebook fits your bag and has enough pages."
        },
        {
          "term": "Real limit",
          "text": "The price fits what you can comfortably afford."
        },
        {
          "term": "Endpoint",
          "text": "Choose a suitable notebook and use it for your shopping list."
        }
      ]
    },
    "choice": {
      "prompt": "Two affordable notebooks meet your needs. What is a reasonable endpoint for this small choice?",
      "options": [
        {
          "label": "Choose one and write the first shopping item",
          "feedback": "Using the notebook completes the actual task. You do not need to prove there is no better colour elsewhere."
        },
        {
          "label": "Search until I can rule out all regret",
          "feedback": "Future regret cannot be ruled out completely. That endpoint can keep a small decision open indefinitely."
        }
      ]
    },
    "action": "**Choose one low-stakes everyday item or activity** using a few real needs and limits. Make the choice and use it: write the first list item or begin the activity. Keep appropriate checks for important health, safety, legal, and financial decisions.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursetwentythree",
    "day": 23,
    "title": "Ask Once for Information",
    "step": "Ask one useful question instead of seeking the same reassurance.",
    "teaching": [
      "**An information question fills a specific gap**. “What time does the event begin?” can give you a fact you need. Reassurance asks for relief from doubt, such as repeatedly asking whether people will definitely enjoy your company. Another answer may feel good briefly without settling a question that nobody can guarantee.",
      "**Notice when the question has already been answered**. Your friend said they would like you to come. Asking again five different ways may be an attempt to feel completely certain about their feelings. You can use their actual answer without proving how they will feel throughout the event. People can also set boundaries about repeated questions.",
      "**Ask for any genuinely missing practical detail**. Confirm the location if needed, then make your ordinary arrival plan. If the urge to ask the same reassurance question returns, notice it and return to getting ready. Finish by putting the event details in your calendar or gathering what you need to take."
    ],
    "interaction": {
      "kind": "reveal",
      "prompt": "Two different questions before an event.",
      "items": [
        {
          "label": "Missing information",
          "detail": "“Where is the entrance?” can give you a detail you need to arrive."
        },
        {
          "label": "Repeated reassurance",
          "detail": "“Are you definitely sure you want me there?” after an invitation seeks a guarantee about feelings."
        }
      ]
    },
    "choice": {
      "prompt": "Your friend has invited you, but you do not know the address. What is useful to ask?",
      "options": [
        {
          "label": "Ask for the address",
          "feedback": "The answer fills a practical gap and helps you get there. It does not ask the friend to guarantee the whole social experience."
        },
        {
          "label": "Ask again whether they are absolutely sure they like me",
          "feedback": "The invitation already gives information about wanting you there. Repeating a feelings test may add pressure without settling your doubt."
        }
      ]
    },
    "action": "**Identify one practical detail you actually lack** and ask for it clearly. Use the answer in your plan. If the same reassurance question returns, use the information already given and continue getting ready. Finish when the needed event details are recorded.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursetwentyfour",
    "day": 24,
    "title": "A Check With an Ending",
    "step": "Finish one nonessential check after getting the information you need.",
    "teaching": [
      "**A useful check has a purpose**. Before a casual film outing, checking the start time helps you plan. Reopening the same unchanged listing ten times may add nothing. You are looking at a low-stakes information habit here, not changing safety routines, health instructions, security requirements, or checks that someone responsible has asked you to complete.",
      "**Name the information and the finish line**. You need the film time and cinema address. Check the official listing, add the details to your calendar, and close it. If the cinema sends a change notice, that is new information to review. A fresh feeling of doubt alone is not a changed listing.",
      "**Use the plan after completing the check**. Put what you need by your bag and begin another ordinary task. If you want to reopen the page, ask whether anything actually changed or whether you are seeking the same relief again. Finish by following the recorded plan, while keeping all necessary checks for important situations."
    ],
    "interaction": {
      "kind": "sequence",
      "prompt": "Finish a low-stakes film-time check.",
      "steps": [
        "Check the official film time and cinema address.",
        "Record the details where you will use them.",
        "Close the listing and prepare what you need to take."
      ],
      "feedback": "The recorded time and address give you information you can use. Closing the unchanged listing ends this nonessential repeat."
    },
    "choice": {
      "prompt": "You recorded the film time. Nothing changed, but you feel a new urge to check. What can guide you?",
      "options": [
        {
          "label": "Use the recorded details unless new information arrives",
          "feedback": "An unchanged listing is not made more informative by reopening it. A real change notice would be a reason to update the plan."
        },
        {
          "label": "Treat the urge itself as proof the time changed",
          "feedback": "A feeling of doubt does not establish a changed listing. This lesson concerns a nonessential repeat, not necessary safety or professional checks."
        }
      ]
    },
    "action": "**Complete one nonessential information check with an endpoint**. Record a casual event’s time, close the page, and prepare your bag. Consult the details when needed. Keep all required safety, health, security, and professional checks in place.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursetwentyfive",
    "day": 25,
    "title": "A Short Worry Review",
    "step": "Choose a bounded daytime slot for one nonurgent concern.",
    "teaching": [
      "**A worry review is a short planned time** to look at nonurgent concerns rather than following them throughout the day. The NHS suggests a slot such as 10 to 15 minutes. This is an option you can try, not a rule everyone must use. Choose a daytime time that fits your responsibilities.",
      "**Note a concern once if you need a reminder**. At the review time, ask whether it contains a real problem with an available action. Choose a small step if it does. If it asks for certainty about a future event, acknowledge what you cannot know yet. Repeating the question does not create an answer.",
      "**Give the review an ending and a next activity**. When the slot ends, close the note and start dinner or another planned task. In the evening, a single reminder can hold a nonurgent task for tomorrow. Do not postpone anything urgent. Stop adding predictions to the note; leave the next practical action ready for its appropriate time."
    ],
    "interaction": {
      "kind": "list",
      "items": [
        {
          "term": "Choose a slot",
          "text": "If useful, plan a daytime concern review of about 10 to 15 minutes."
        },
        {
          "term": "Review once",
          "text": "Choose an action for a solvable concern or acknowledge what remains unknown."
        },
        {
          "term": "End and continue",
          "text": "Close the note at the planned end and begin dinner or another ordinary task."
        }
      ]
    },
    "choice": {
      "prompt": "The review time ends with a future question still unanswered. What fits the plan?",
      "options": [
        {
          "label": "Close the note and start the chosen next activity",
          "feedback": "The slot is for choosing useful action, not settling every unknown. Its ending lets the rest of your day continue."
        },
        {
          "label": "Extend it until every future possibility feels safe",
          "feedback": "That removes the boundary and turns the review into another open-ended search. Urgent real needs should be handled when required, rather than saved for a slot."
        }
      ]
    },
    "action": "**Try a short daytime review only if it suits you**. Choose an ending and an activity afterward. At the end, close the note and begin that activity. For a nonurgent evening reminder, leave one practical step for tomorrow instead of adding predictions.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursetwentysix",
    "day": 26,
    "title": "After an Awkward Chat",
    "step": "Choose an actual repair or return to the next activity.",
    "teaching": [
      "**Replaying a conversation can mix a real concern with guesses**. You remember interrupting a friend, then imagine that they now dislike you. The interruption is something you may be able to address. Their entire private opinion is not something you can discover by replaying the same few seconds of the conversation.",
      "**Ask whether a simple repair is appropriate**. If you cut them off, you might say, “I interrupted earlier; I am sorry. What were you saying?” Then listen. If there is no specific action to repair, name the replay as a memory and return to your day. Avoid repeated apologies to get a guarantee that everything is fine.",
      "**Let one appropriate repair be one repair**. Send the brief message or listen when the person continues. Then finish an ordinary task, such as clearing the dishes. They can respond in their own time. You do not need to reconstruct every sentence or monitor their expression afterward to prove that the repair has worked perfectly."
    ],
    "interaction": {
      "kind": "reveal",
      "prompt": "Separate a repair from a replay.",
      "items": [
        {
          "label": "An actual interruption",
          "detail": "You can acknowledge that you cut your friend off and ask what they were saying."
        },
        {
          "label": "A guessed lasting opinion",
          "detail": "Replaying the conversation cannot establish every feeling they now have about you."
        },
        {
          "label": "A useful ending",
          "detail": "Listen after the apology, then let the conversation continue without asking repeatedly whether everything is fine."
        }
      ]
    },
    "choice": {
      "prompt": "You interrupted a friend and made one appropriate apology. What is useful next?",
      "options": [
        {
          "label": "Listen to what they wanted to say",
          "feedback": "This responds to the actual interruption. It gives the other person space rather than making them reassure you repeatedly."
        },
        {
          "label": "Repeat the apology until they guarantee no bad feelings",
          "feedback": "Repeated apologies can shift attention to obtaining certainty. One repair does not need to become an ongoing test of their reaction."
        }
      ]
    },
    "action": "**Choose a specific repair if one is needed**. Apologise briefly for the actual interruption and listen. If there is no repair to make, name the replay as a memory. Finish by clearing the dishes or completing another ordinary task.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursetwentyseven",
    "day": 27,
    "title": "Restart and Get Support",
    "step": "Choose one small skill to use at the next opportunity.",
    "teaching": [
      "**Missing practice does not erase a skill you learned**. You may have a busy week and return to repeated checking before you notice it. That gives you information about what happened during a difficult stretch. It does not require you to repeat the whole course or prove that you deserve to start again.",
      "**Choose the smallest useful restart**. At the next repeated message check, notice it and return to one task. At the next solvable concern, write one actual step. Avoid planning a huge catch-up session that is harder to fit into the same busy life. One real use of a skill is a clearer starting point.",
      "**Ask for specific support if it would help**. You might ask someone to help find information for a practical call, rather than guarantee its outcome. Choose one small opportunity to restart this week and write it down. Finish by preparing what it needs. If worry keeps disrupting daily life, consider support from a qualified mental health professional."
    ],
    "interaction": {
      "kind": "sequence",
      "prompt": "Restart with a practical call you have been avoiding.",
      "steps": [
        "Choose the next small step, such as finding the account number.",
        "Ask for specific help with the information if needed.",
        "Put the information ready for the call at an appropriate time."
      ],
      "feedback": "Finding the information makes the call easier to begin. Specific help supports the task without needing a promise about its outcome."
    },
    "choice": {
      "prompt": "You missed several days and need help making a practical call. What is a useful restart?",
      "options": [
        {
          "label": "Find the account number and ask someone for specific help if needed",
          "feedback": "This creates a manageable next action. Support can help with the task without promising a perfect outcome."
        },
        {
          "label": "Wait until I can restart every lesson and guarantee the call goes well",
          "feedback": "That makes beginning much larger and adds a guarantee no person can provide. A small real step is enough to restart."
        }
      ]
    },
    "action": "**Choose one small opportunity to restart this week**. Name the action and prepare what it needs. Ask for a specific kind of support if helpful. Stop when the materials or agreed help are ready, then use them at the chosen time.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
  definePressureCourseLesson({
    "id": "worry.coursetwentyeight",
    "day": 28,
    "title": "Your Own Return Plan",
    "step": "Write a short plan for responding to your next worry loop.",
    "teaching": [
      "**Keep the plan simple enough to use in real life**. Start by noticing the repeated question. Ask whether there is a current problem with an available action. If so, take or schedule one practical step. If you are assuming a meaning, separate facts from guesses. If an answer is unavailable, choose an ordinary activity to return to.",
      "**Use a completed action as your example**. You may have asked one clear question, corrected a document, or made lunch while a reply was pending. Write what you actually did and what helped you begin. This is more useful than promising you will never worry again. A thought returning does not erase the action you completed.",
      "**Choose the next ordinary situation for your plan**. Write a few lines you can recognise, then put the note away and start a real activity. Keep asking for appropriate help when a concern needs it. If worry continues to disrupt your life, professional support can help you decide what to try next. This plan is a starting point you can adjust."
    ],
    "interaction": {
      "kind": "list",
      "items": [
        {
          "term": "Act",
          "text": "For a current problem, take or schedule one practical next step."
        },
        {
          "term": "Check the meaning",
          "text": "For an assumed conclusion, separate facts from guesses and use a fair sentence."
        },
        {
          "term": "Return",
          "text": "For an unavailable answer, begin an ordinary activity while the question stays open."
        }
      ]
    },
    "choice": {
      "prompt": "You have sent a clear invitation and no answer is due yet. Which part of your return plan fits?",
      "options": [
        {
          "label": "Return to making lunch while the answer is pending",
          "feedback": "There is no new action needed right now. Preparing lunch uses the waiting time without claiming you know the reply."
        },
        {
          "label": "Repeat every skill until I cannot imagine an unwanted answer",
          "feedback": "The plan does not require eliminating every possibility. Repeatedly testing thoughts can become another investigation."
        }
      ]
    },
    "action": "**Write a short return plan using an action you actually completed**. Include when to act, when to check a guessed meaning, and when to return. Put the note away and begin today’s chosen task. Adjust the plan as you learn, and seek appropriate support when needed.",
    "source": "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Worry-and-Rumination https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/self-help-cbt-techniques/tackling-your-worries/ Original Azora teaching and examples; no affiliation."
  }),
] as const;
