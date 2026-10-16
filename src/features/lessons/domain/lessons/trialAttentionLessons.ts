import type { LessonDefinition } from '../lessonBlock';

/** First-week teaching that applies beyond the app and its guided tools. */
export const TRIAL_ATTENTION_LESSONS = [
  {
    "id": "attention.trialskillsensesmorning",
    "title": "Begin Where You Are",
    "step": "Choose your next morning step from what is actually needed now.",
    "blocks": [
      {
        "kind": "text",
        "text": "A busy morning can begin before you have left bed: appointments, unfinished jobs, and yesterday’s mistakes all arrive together. **Separate this moment from the whole day**. The useful question is what needs your attention where you are, right now."
      },
      {
        "kind": "text",
        "text": "Look at the situation in plain language: the kettle is empty, your clothes are ready, or you have twenty minutes before leaving. **Describe before deciding**. Those details tell you more about the next step than a general verdict that you are already behind."
      },
      {
        "kind": "reveal",
        "prompt": "Look closer at the everyday decision.",
        "items": [
          {
            "label": "What to notice",
            "detail": "Imagine noticing an unanswered message while getting dressed."
          },
          {
            "label": "What to choose",
            "detail": "It may matter later, but reading it does not make it the next morning priority. **Match your action to the available time**: finish dressing, then decide whether a reply fits before you leave."
          }
        ]
      },
      {
        "kind": "text",
        "text": "A clear next step has an ordinary finish: fill the bottle, take the packed bag, or make something to eat. **Choose one finish you can recognize**. You do not need to plan every hour before the morning can begin moving."
      },
      {
        "kind": "text",
        "text": "If another demand appears, check whether it changes what is needed now. **Update without restarting the whole morning**. A late bus may change your departure; an interesting notification may simply wait. Your first choice can be useful without being the final choice of the day."
      },
      {
        "kind": "text",
        "text": "Today’s **5-4-3-2-1** offers another setting for noticing what is present. The everyday skill is using clear observations to choose where your attention goes next."
      },
      {
        "kind": "choice",
        "prompt": "You have ten minutes before leaving and notice an interesting group message. What best serves this morning?",
        "options": [
          {
            "label": "Finish packing what I need to leave",
            "feedback": "Your departure is the immediate situation. Packing has a clear finish, and you can choose a suitable time for the conversation afterward without treating every new message as a change of plan."
          },
          {
            "label": "Read the conversation before deciding what matters",
            "feedback": "The conversation may be worth reading, but opening it does not establish that it belongs in these ten minutes. First check what your actual departure needs so the newest demand does not automatically become the next task."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Name one fact about this morning**, then choose a small action that fits it. Finish that action before deciding what deserves the next part of your attention."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillsensesanger",
    "title": "Hear the Actual Request",
    "step": "Listen for the specific request before choosing your response.",
    "blocks": [
      {
        "kind": "text",
        "text": "In a frustrating conversation, you may begin preparing your reply before the other person finishes. **Listen for the actual request**. What are they asking you to do, change, or understand? Hearing that clearly gives your response a more useful starting point."
      },
      {
        "kind": "text",
        "text": "Separate the request from the whole argument. Someone saying they need ten minutes to finish a task is asking about timing. **Keep the immediate question small**. You can discuss the larger disagreement afterward without answering every concern in the same sentence."
      },
      {
        "kind": "reveal",
        "prompt": "Look closer at the everyday decision.",
        "items": [
          {
            "label": "What to notice",
            "detail": "Check your understanding in ordinary words: you want to finish this before we talk? **Reflect before responding**."
          },
          {
            "label": "What to choose",
            "detail": "This is a chance to correct a misunderstanding, not a promise that you will agree or give up the concern you brought."
          }
        ]
      },
      {
        "kind": "text",
        "text": "Once the request is clear, answer it directly. You might agree to a later time or say what timing you can manage. **Give a specific response**. I can talk after lunch makes the next step clearer than repeating that nobody ever listens."
      },
      {
        "kind": "text",
        "text": "If their request is unclear, ask one question about what they need next. **Understanding leaves your choice intact**. You can recognize what someone wants and still set a limit, disagree, or leave a conversation that is unsafe."
      },
      {
        "kind": "text",
        "text": "Today’s **5-4-3-2-1** offers another setting for noticing what is present. The everyday skill is using clear observations to choose where your attention goes next."
      },
      {
        "kind": "choice",
        "prompt": "Someone says they need ten minutes to finish before discussing a problem. What helps you answer the request?",
        "options": [
          {
            "label": "Check that they mean a short delay, then agree a time",
            "feedback": "You make the timing request clear and answer it directly. The problem can still be discussed; understanding this immediate request does not mean deciding that the larger concern is unimportant or resolved."
          },
          {
            "label": "Repeat my whole argument before they finish speaking",
            "feedback": "That may leave the timing question unanswered and make it harder to hear what they asked. First identify the immediate request, then choose a clear reply and a suitable place for the larger discussion."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Listen for one specific request in a safe conversation**. Check what the person means, then answer that request directly while keeping any boundary or concern you need to express."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillsensesfocus",
    "title": "Find the Task Again",
    "step": "Identify the exact place to resume an interrupted task.",
    "blocks": [
      {
        "kind": "text",
        "text": "After an interruption, the task you left can feel strangely hard to enter again. **Find your place before pushing harder**. The question is not how to become a focused person; it is where the next useful action starts in this particular task."
      },
      {
        "kind": "text",
        "text": "Look for something concrete: the unfinished paragraph, the unanswered question, or the materials still laid out. **Describe the current state**. Saying the report needs a conclusion gives you a more usable starting point than saying you have wasted the afternoon."
      },
      {
        "kind": "reveal",
        "prompt": "Look closer at the everyday decision.",
        "items": [
          {
            "label": "What to notice",
            "detail": "Choose a return action small enough to begin directly."
          },
          {
            "label": "What to choose",
            "detail": "Read the last two sentences and write the next point, or open the calculation that needs checking. **Name a visible action** rather than an ambition such as catch up or concentrate properly."
          }
        ]
      },
      {
        "kind": "text",
        "text": "Then reduce one competing demand if you can: close an unrelated tab or leave the incoming message until your chosen stopping point. **Protect this return**. You do not need a perfectly quiet environment to make the next few minutes more deliberate."
      },
      {
        "kind": "text",
        "text": "When another thought or interruption appears, repeat the same locating question: where was I, and what comes next? **Returning is part of working**. A useful work period can contain interruptions and several deliberate returns rather than one unbroken stretch."
      },
      {
        "kind": "text",
        "text": "Today’s **5-4-3-2-1** offers another setting for noticing what is present. The everyday skill is using clear observations to choose where your attention goes next."
      },
      {
        "kind": "choice",
        "prompt": "You return to a half-written document after answering a call. What is a useful first move?",
        "options": [
          {
            "label": "Read the last paragraph and write its next point",
            "feedback": "That locates the task and turns returning into an action you can begin. Once you have rejoined the work, you can decide whether you need more time, information, or a different stopping point."
          },
          {
            "label": "Plan how to make up for every distracted minute",
            "feedback": "That starts another planning task before you have rejoined the document. First find the specific place to resume; you can make a realistic time decision after the next action is clear."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Find the exact place to resume one task**. Name its next visible action, set aside one competing demand if possible, and begin without reviewing the whole day first."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillsensesquiet",
    "title": "Notice Before You Grade",
    "step": "Describe one ordinary experience before deciding whether you like it.",
    "blocks": [
      {
        "kind": "text",
        "text": "An ordinary moment can quickly become a review: this room is boring, the walk is too short, or I should feel more peaceful. **Notice before you grade**. Give the experience a little attention before deciding what it says about your day."
      },
      {
        "kind": "text",
        "text": "Description names what is present: cool air on your hands, footsteps nearby, or light across a wall. **Separate detail from evaluation**. You can notice those things without needing to call them beautiful, calming, distracting, or evidence that the moment is going well."
      },
      {
        "kind": "reveal",
        "prompt": "Look closer at the everyday decision.",
        "items": [
          {
            "label": "What to notice",
            "detail": "Imagine washing a cup and thinking you should be doing something more worthwhile."
          },
          {
            "label": "What to choose",
            "detail": "**Return to the activity itself**: the weight of the cup, the water, the surface becoming clear. You can finish this ordinary task without turning it into a performance review."
          }
        ]
      },
      {
        "kind": "text",
        "text": "An evaluation may still appear, and you do not need to argue with it. **Add a description alongside it**. The walk feels dull, and I can hear my footsteps gives your attention somewhere concrete to return without forcing a positive opinion."
      },
      {
        "kind": "text",
        "text": "You can use this during something pleasant too. **Let a moment remain ordinary** instead of checking whether you are enjoying it enough. Paying attention does not require creating a special experience or reaching the right verdict about the one you have."
      },
      {
        "kind": "text",
        "text": "Today’s **5-4-3-2-1** offers another setting for noticing what is present. The everyday skill is using clear observations to choose where your attention goes next."
      },
      {
        "kind": "choice",
        "prompt": "During a short walk, you keep judging whether it is peaceful enough. What could you try?",
        "options": [
          {
            "label": "Notice one detail without deciding how it should feel",
            "feedback": "That returns attention to the walk itself. You can hear a nearby sound or notice the air while leaving your opinion unresolved; the moment does not need a high rating before it can receive your attention."
          },
          {
            "label": "Keep comparing this walk with a better one",
            "feedback": "Comparison may keep the evaluation going without adding attention to this walk. Try one plain description of what is present, without requiring it to prove that you are having the right experience."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**During one ordinary activity, name a detail without rating it**. If a judgment appears, notice another detail alongside it and continue the activity without deciding how the moment should feel."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillsensesrecovery",
    "title": "Work With Today",
    "step": "Choose a next step that fits your current capacity.",
    "blocks": [
      {
        "kind": "text",
        "text": "On a depleted day, yesterday’s plan may no longer fit. **Start with today’s capacity** rather than treating the old plan as a test you must pass. The decision is what would be useful now, given the time, energy, and support available."
      },
      {
        "kind": "text",
        "text": "Describe the practical situation without turning it into an identity: you have little energy, a task is due, and help may be available. **Keep the information specific**. Saying I am useless adds a verdict without helping you choose what to do."
      },
      {
        "kind": "reveal",
        "prompt": "Look closer at the everyday decision.",
        "items": [
          {
            "label": "What to notice",
            "detail": "Consider three possibilities: reduce the task, postpone it with a clear message, or ask someone for help."
          },
          {
            "label": "What to choose",
            "detail": "**Change the demand when needed**. Finishing one essential part can be more realistic than beginning the full version and hoping capacity will appear."
          }
        ]
      },
      {
        "kind": "text",
        "text": "For example, preparing an elaborate meal may not fit, while eating something simple does. **Keep the underlying need visible**. You can change the way you meet a need without deciding that the need itself no longer matters."
      },
      {
        "kind": "text",
        "text": "Rest can also be a deliberate choice when it fits the situation. **Choose without earning permission through exhaustion**. If your circumstances or needs change, you can reconsider; the next step does not have to settle what every future day will require."
      },
      {
        "kind": "text",
        "text": "Today’s **5-4-3-2-1** offers another setting for noticing what is present. The everyday skill is using clear observations to choose where your attention goes next."
      },
      {
        "kind": "choice",
        "prompt": "You have little energy and planned a complicated dinner. Which adjustment keeps the need clear?",
        "options": [
          {
            "label": "Choose a simpler meal and leave the extra preparation",
            "feedback": "You preserve the need to eat while changing the amount of work involved. A practical adjustment responds to your current capacity without requiring you to complete the original plan before it counts."
          },
          {
            "label": "Start the full recipe and judge myself if I stop",
            "feedback": "That keeps the demand fixed while making your capacity the problem. You can revise the task before beginning and still take the underlying need seriously."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Name one need and your current capacity**. Choose a smaller way to meet it, ask for practical help, or arrange a realistic later time when postponing is possible."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillsensesselftrust",
    "title": "Count What You Did",
    "step": "Describe one completed action without turning it into a verdict.",
    "blocks": [
      {
        "kind": "text",
        "text": "Self-trust can be difficult to recognize if every action is followed by a new standard. **Name what you actually did** before deciding it was too small. Sending the message or keeping a brief commitment is an event, even if larger work remains."
      },
      {
        "kind": "text",
        "text": "Use plain evidence: I said I would put the document away, and I put it away. **Keep the promise visible**. You are noticing a link between a decision and an action, rather than trying to produce a confident feeling on demand."
      },
      {
        "kind": "reveal",
        "prompt": "Look closer at the everyday decision.",
        "items": [
          {
            "label": "What to notice",
            "detail": "A thought such as anyone could do that may arrive immediately."
          },
          {
            "label": "What to choose",
            "detail": "**Do not let comparison rewrite the event**. Other people’s abilities do not change whether you followed through on the agreement you made with yourself in your circumstances."
          }
        ]
      },
      {
        "kind": "text",
        "text": "You can also be accurate about an incomplete action. If you opened a form but did not send it, name both parts. **Accuracy supports the next decision**. Calling everything success or failure hides the useful information about what is finished and what remains."
      },
      {
        "kind": "text",
        "text": "Choose the next commitment from that information, rather than raising the difficulty to prove the last one counted. **Build a record you can believe**. A realistic promise and an honest description of what happened are more useful than a dramatic verdict about yourself."
      },
      {
        "kind": "text",
        "text": "Today’s **5-4-3-2-1** offers another setting for noticing what is present. The everyday skill is using clear observations to choose where your attention goes next."
      },
      {
        "kind": "choice",
        "prompt": "You kept a small promise, then think it was too easy to count. What is an accurate response?",
        "options": [
          {
            "label": "It was small, and I did what I said I would do",
            "feedback": "Both parts can be true. You recognize the actual follow-through without claiming it solves every problem or needing to compare the size of your promise with someone else’s work."
          },
          {
            "label": "It only counts if tomorrow’s promise is much harder",
            "feedback": "That moves the standard after the action is finished. A next promise can fit tomorrow’s circumstances; it does not need to prove that today’s completed agreement was real."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Record one promise and what happened** in plain language. Recognize the completed part, name anything unfinished accurately, and choose your next commitment without making it a test of your worth."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillphonebedtimesensesphone",
    "title": "Notice the Evening Cost",
    "step": "Choose what deserves the remaining part of your evening.",
    "blocks": [
      {
        "kind": "text",
        "text": "An evening feed offers a new reason to stay each time you look. **Notice what the next few minutes replace**. The choice is not only whether a post is interesting; it is also whether you want it to take this part of tonight."
      },
      {
        "kind": "text",
        "text": "Look at the actual situation: the time, the room, and the ordinary things you hoped to do before bed. **Use the evening you have**. A quiet conversation, washing up, or reading a little may matter even when the feed has more to offer."
      },
      {
        "kind": "reveal",
        "prompt": "Look closer at the everyday decision.",
        "items": [
          {
            "label": "What to notice",
            "detail": "Ask what you wanted when you picked up the phone. If you meant to check tomorrow’s weather, that purpose has a finish."
          },
          {
            "label": "What to choose",
            "detail": "**Separate the purpose from the continuation**. The useful check can end without deciding whether every possible update is worth seeing."
          }
        ]
      },
      {
        "kind": "text",
        "text": "When the original purpose is finished, choose where the next minutes go. **Make the tradeoff concrete**: another video or getting ready for bed. You do not need to dislike the phone to prefer what a different action gives you tonight."
      },
      {
        "kind": "text",
        "text": "If you notice late, work with the evening that remains. **Choose from this moment** instead of reviewing every minute already spent. A deliberate next action is still available, whether the remaining time is generous or much shorter than you planned."
      },
      {
        "kind": "text",
        "text": "Today’s **5-4-3-2-1** offers another setting for noticing what is present. The everyday skill is using clear observations to choose where your attention goes next."
      },
      {
        "kind": "choice",
        "prompt": "You checked the weather and have begun watching suggested clips. What helps you choose deliberately?",
        "options": [
          {
            "label": "Ask whether another clip is how I want to spend this part of tonight",
            "feedback": "That brings the evening tradeoff into view. You can choose to continue for a clear reason or close the feed for a bedtime activity without needing the content to become uninteresting first."
          },
          {
            "label": "Wait for the feed to stop offering something appealing",
            "feedback": "The next appealing item does not decide what your evening needs. Naming the original purpose and the available alternatives lets you choose a stopping point while interesting content still exists."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Notice one evening phone session after its original purpose is done**. Choose what you want the next few minutes to contain and move to that ordinary activity."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillphoneworksensesphone",
    "title": "Return With a Purpose",
    "step": "Choose one work action before reopening your task.",
    "blocks": [
      {
        "kind": "text",
        "text": "A quick check can leave you between two activities: the phone is still interesting, and the task feels distant. **Choose your return deliberately**. You do not have to recover a perfect work mood before deciding what deserves the next few minutes."
      },
      {
        "kind": "text",
        "text": "Look at the task you actually left. Perhaps a sentence is unfinished, a problem needs one calculation, or a message needs a reply. **Find the next visible action**. A clear return reduces the need to negotiate with a vague demand to be productive."
      },
      {
        "kind": "reveal",
        "prompt": "Look closer at the everyday decision.",
        "items": [
          {
            "label": "What to notice",
            "detail": "Before touching the phone again, ask whether it serves that action."
          },
          {
            "label": "What to choose",
            "detail": "A needed reference has a purpose; opening the feed to get ready does not supply the missing sentence. **Give each check a job** so a useful tool and an unrelated detour stay distinguishable."
          }
        ]
      },
      {
        "kind": "text",
        "text": "If another check truly is needed, decide its finish before opening it: find the address, read the answer, or confirm the appointment. **Return when the purpose is complete**. You can leave other updates for a later choice rather than attaching them to the useful check."
      },
      {
        "kind": "text",
        "text": "An interruption does not require a full restart of your workday. **Resume from the current place**. You can acknowledge that time passed, choose the remaining scope realistically, and do the next action without first making up for every distraction."
      },
      {
        "kind": "text",
        "text": "Today’s **5-4-3-2-1** offers another setting for noticing what is present. The everyday skill is using clear observations to choose where your attention goes next."
      },
      {
        "kind": "choice",
        "prompt": "You close a feed beside a half-finished assignment. What makes a useful return?",
        "options": [
          {
            "label": "Name the next question and write its first line",
            "feedback": "That reconnects you with the assignment in an observable way. Once you have begun, you can judge the remaining work more realistically than while standing between the feed and an undefined intention to focus."
          },
          {
            "label": "Check one more app until I feel ready to concentrate",
            "feedback": "Another app does not identify where the assignment resumes. Locate a small task action first; you can begin it while the urge to check is still present."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Name the exact next action in a task you interrupted**. Put the phone outside that action unless it is needed, and begin before deciding whether you feel fully ready."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillmusclesmorningready",
    "title": "Lower the Morning Load",
    "step": "Notice one sign of rushing and simplify the next morning action.",
    "blocks": [
      {
        "kind": "text",
        "text": "You may notice your jaw set, your hands gripping, or your movements becoming hurried while getting ready. **Use the cue to check the demand**. The sensation does not explain its cause, but can remind you to check what you are asking of this morning."
      },
      {
        "kind": "text",
        "text": "Ask a practical question: am I trying to fit three optional jobs into the time for one essential job? **Separate necessary from extra**. Packing what you need to leave may matter now; sorting the cupboard can belong to another time."
      },
      {
        "kind": "list",
        "items": [
          {
            "term": "Check the situation",
            "text": "Simplify the action rather than adding another standard to meet."
          },
          {
            "term": "Choose the response",
            "text": "**Choose the workable version**. A familiar breakfast can replace an elaborate one; a short message about being late can replace silently trying to achieve an impossible departure time."
          }
        ]
      },
      {
        "kind": "text",
        "text": "Changing the plan may feel uncomfortable when you wanted a different start. **Keep the choice honest**. You can be disappointed and still choose what fits, without making feeling relaxed another item you must complete before leaving."
      },
      {
        "kind": "text",
        "text": "If the cue remains after adjusting, you can still continue with the simpler plan. **Judge the decision by its fit** rather than by whether your shoulders immediately soften. What matters here is noticing a limit and responding in a way the morning can support."
      },
      {
        "kind": "text",
        "text": "Today’s **Muscle Release** offers a separate chance to notice physical sensations. The everyday skill remains checking the situation and choosing a response that fits."
      },
      {
        "kind": "choice",
        "prompt": "You are late and still trying to make a complicated breakfast. What could the hurried feeling remind you to check?",
        "options": [
          {
            "label": "Whether a simpler breakfast fits the time I have",
            "feedback": "That uses the cue to examine the demand. You keep the practical need to eat while choosing a version that fits the actual morning, rather than adding pressure to perform the original plan."
          },
          {
            "label": "Whether I can force myself to do everything faster",
            "feedback": "Speed may not resolve a plan that no longer fits. Check which parts are essential and which can change before treating more effort as the only available response."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Notice one cue that you are rushing**, check what is actually essential, and simplify one morning action. You can continue without waiting for a perfectly settled feeling."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillmusclesangerready",
    "title": "Catch the Early Moment",
    "step": "Notice an early cue and choose a response before continuing.",
    "blocks": [
      {
        "kind": "text",
        "text": "Anger may become noticeable in a gripping hand, a sharper voice, or the urge to interrupt. **Find your early moment**. These cues do not prove what someone intended; they can remind you to choose how you want to handle the next part."
      },
      {
        "kind": "text",
        "text": "Check what you are about to do: repeat an accusation, send a message, or speak over the other person. **Notice the next behavior**. A specific behavior is something you can change more directly than an instruction to stop feeling angry."
      },
      {
        "kind": "list",
        "items": [
          {
            "term": "Check the situation",
            "text": "Choose a response that gives the issue a chance to be addressed."
          },
          {
            "term": "Choose the response",
            "text": "**Keep the problem and change the approach**. You might lower your speaking pace, leave the message unsent for now, or say you need a pause before discussing the agreement."
          }
        ]
      },
      {
        "kind": "text",
        "text": "If you take a pause in an ordinary safe disagreement, explain when you can return if possible. **Make space understandable**. I need a few minutes; can we continue after lunch is clearer than disappearing and expecting the other person to understand what the silence means."
      },
      {
        "kind": "text",
        "text": "You can return with a direct request even if some anger remains. **Aim for a workable conversation**, not a perfect emotional state. If the situation is unsafe, getting distance and appropriate support takes priority over continuing a discussion or explaining yourself."
      },
      {
        "kind": "text",
        "text": "Today’s **Muscle Release** offers a separate chance to notice physical sensations. The everyday skill remains checking the situation and choosing a response that fits."
      },
      {
        "kind": "choice",
        "prompt": "You notice your voice getting louder during a disagreement. What could you do next?",
        "options": [
          {
            "label": "Name that I need a pause and suggest a time to continue",
            "feedback": "That changes your next behavior while keeping the issue available for discussion. In a safe disagreement, a clear return point can help the pause serve the conversation rather than leave its meaning unexplained."
          },
          {
            "label": "Finish every accusation before giving myself space",
            "feedback": "You do not need to complete an escalating response before choosing another approach. Notice the next behavior and interrupt it with a clear pause, a slower statement, or distance when safety requires it."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Identify one early cue you recognize in anger** and choose a response for that moment: pause a message, state a clear need, or take space before continuing a safe conversation."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillmusclesfocusready",
    "title": "Check Why You Stopped",
    "step": "Choose the right response to a work interruption.",
    "blocks": [
      {
        "kind": "text",
        "text": "You may notice yourself leaning rigidly toward the screen or gripping the pen while rereading the same line. **Check what has interrupted the work**. The bodily cue does not explain the cause; use it as a reminder to look at the actual obstacle."
      },
      {
        "kind": "text",
        "text": "Three situations can look similar: you need missing information, the next action is unclear, or it is time for a break. **Match the response to the obstacle**. More force is not the only way to deal with a task that has stopped moving."
      },
      {
        "kind": "list",
        "items": [
          {
            "term": "Check the situation",
            "text": "If information is missing, write the exact question. If the task is vague, choose one visible action."
          },
          {
            "term": "Choose the response",
            "text": "**Make the obstacle specific**. Find the invoice date or draft the opening sentence gives you something more useful than try harder at this."
          }
        ]
      },
      {
        "kind": "text",
        "text": "If you decide a break is appropriate, leave a return note before stepping away. **Keep your place available**. A short line such as check the second total makes rejoining the task simpler than relying on remembering the entire train of thought."
      },
      {
        "kind": "text",
        "text": "When you return, check whether the chosen response helped the work proceed. **Adjust the plan from what happens**. You are learning to respond to different obstacles, rather than treating every interruption as evidence that your ability to focus has failed."
      },
      {
        "kind": "text",
        "text": "Today’s **Muscle Release** offers a separate chance to notice physical sensations. The everyday skill remains checking the situation and choosing a response that fits."
      },
      {
        "kind": "choice",
        "prompt": "You reread a paragraph but cannot continue because a key date is missing. What addresses the obstacle?",
        "options": [
          {
            "label": "Find or request the date, then return to the paragraph",
            "feedback": "That names and addresses the missing information. A break or a change of posture may fit other circumstances, but here the work needs a specific fact before the next step can be completed."
          },
          {
            "label": "Keep rereading until I become focused enough",
            "feedback": "Rereading does not supply a fact that is absent. Check the obstacle before choosing the response so effort goes toward what the task actually needs."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**When a task stalls, name the obstacle**: missing information, an unclear next action, or a need to step away. Choose a fitting response and leave yourself a clear place to return."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillmusclesquietready",
    "title": "Make Room to Listen",
    "step": "Notice your own reactions without immediately acting on them.",
    "blocks": [
      {
        "kind": "text",
        "text": "While someone speaks, you may notice your mouth ready to answer or your hand moving toward the phone. **Notice the impulse before following it**. You can recognize a reaction without needing to suppress it or turn it immediately into the next action."
      },
      {
        "kind": "text",
        "text": "Give the person space to finish the current thought. **Listen for what is being said** rather than rehearsing the response you want to deliver. You can keep your own view and still wait long enough to hear the information in front of you."
      },
      {
        "kind": "list",
        "items": [
          {
            "term": "Check the situation",
            "text": "If you lose the thread, ask a specific question about their point."
          },
          {
            "term": "Choose the response",
            "text": "**Return through curiosity**. When you said the meeting was difficult, which part did you mean helps you rejoin the conversation more directly than pretending you heard everything."
          }
        ]
      },
      {
        "kind": "text",
        "text": "The same skill fits a quiet activity alone. You can notice an urge to switch songs or reach for a screen and choose whether to follow it. **An impulse is a decision point**. It need not become a command simply because you noticed it."
      },
      {
        "kind": "text",
        "text": "You will sometimes answer quickly or reach automatically. **Use the next moment available** instead of reviewing the whole interaction as a failure. Returning to a sentence, a question, or the current activity is still possible after you have been distracted."
      },
      {
        "kind": "text",
        "text": "Today’s **Muscle Release** offers a separate chance to notice physical sensations. The everyday skill remains checking the situation and choosing a response that fits."
      },
      {
        "kind": "choice",
        "prompt": "A friend pauses briefly and you feel ready to offer a solution. What could you try?",
        "options": [
          {
            "label": "Check whether they have finished and what they need from me",
            "feedback": "That leaves room to learn whether they want help, understanding, or time to finish. You can still offer your view, but you first make space for the person’s actual point and preference."
          },
          {
            "label": "Give advice immediately so I do not lose my thought",
            "feedback": "Your idea can matter without needing to interrupt the conversation. Check what the person is asking for before deciding that delivering your response is the most useful next action."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Notice one impulse during a conversation or quiet activity**. Give yourself a moment to choose whether following it serves what you want to be present for right now."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillmusclesrecoveryready",
    "title": "Adjust Before You Empty",
    "step": "Check your capacity before adding another demand.",
    "blocks": [
      {
        "kind": "text",
        "text": "When you are recovering your energy, it can be easy to notice limits only after doing too much. **Check before adding another demand**. A held posture or tired movement can prompt a practical check, without telling you exactly what caused the sensation."
      },
      {
        "kind": "text",
        "text": "Ask what the next activity requires and what remains available. **Include the whole cost**: preparation, travel, the task itself, and what still needs doing afterward. An activity that fits on paper may use more of your day than its headline duration suggests."
      },
      {
        "kind": "list",
        "items": [
          {
            "term": "Check the situation",
            "text": "Look for an adjustment before committing. **Change scope, timing, or support**."
          },
          {
            "term": "Choose the response",
            "text": "You might shorten the visit, ask for a lift, or do one part of an errand. Being specific gives other people something clear to respond to when help is possible."
          }
        ]
      },
      {
        "kind": "text",
        "text": "A smaller plan can also preserve room for basic needs later. **Leave capacity for the return**. If an outing uses all the energy you expected for dinner, consider the meal before leaving rather than making it an afterthought you must solve when depleted."
      },
      {
        "kind": "text",
        "text": "You do not need to identify a perfect limit in advance. **Use what this day teaches you**. If the plan turns out too large, revise the next commitment without turning that information into a judgment about your effort or your future."
      },
      {
        "kind": "text",
        "text": "Today’s **Muscle Release** offers a separate chance to notice physical sensations. The everyday skill remains checking the situation and choosing a response that fits."
      },
      {
        "kind": "choice",
        "prompt": "A short errand also involves travel and preparing dinner afterward. What helps you decide whether it fits?",
        "options": [
          {
            "label": "Include the journey and later needs, then adjust the plan",
            "feedback": "That gives you a fuller picture of the demand. You can choose a shorter errand, arrange help, or simplify dinner before committing, instead of counting only the minutes spent inside the shop."
          },
          {
            "label": "Count only the errand itself and sort out the rest later",
            "feedback": "Travel and later needs still use capacity even when they are outside the named task. Including them now gives you more room to make a realistic choice or request practical support."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Before one commitment, include its preparation, travel, and aftermath**. Adjust one part to fit your capacity, or ask for specific help before agreeing to the full demand."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillmusclesselftrustready",
    "title": "Resize the Promise",
    "step": "Revise an unrealistic commitment before dropping it silently.",
    "blocks": [
      {
        "kind": "text",
        "text": "A promise to yourself may feel different when the time comes to act. You might notice hesitation, a gripping posture, or the urge to avoid it. **Check the agreement before judging yourself**. The cue does not explain the difficulty; it invites a closer look."
      },
      {
        "kind": "text",
        "text": "Ask what you promised, what changed, and what still matters about it. **Keep the purpose visible**. If the aim was to prepare for tomorrow, you may not need the entire elaborate routine you imagined earlier in the day."
      },
      {
        "kind": "list",
        "items": [
          {
            "term": "Check the situation",
            "text": "Choose a smaller honest agreement if the original no longer fits."
          },
          {
            "term": "Choose the response",
            "text": "**Revise before disappearing**. Put the essential item by the door, or spend a brief period preparing the one thing you need, rather than silently treating the whole promise as abandoned."
          }
        ]
      },
      {
        "kind": "text",
        "text": "A revision should be explicit enough to recognize afterward. **Name the new finish**. I will pack the form I need is clearer than I will do something useful, and lets you describe whether you kept the revised agreement accurately."
      },
      {
        "kind": "text",
        "text": "Then review the fit when you make the next promise. **Learn from the size you could sustain**. Revising once does not require making every future commitment tiny, and keeping a promise does not require increasing its difficulty the following day."
      },
      {
        "kind": "text",
        "text": "Today’s **Muscle Release** offers a separate chance to notice physical sensations. The everyday skill remains checking the situation and choosing a response that fits."
      },
      {
        "kind": "choice",
        "prompt": "You planned an hour of preparation, but circumstances leave ten minutes. What is an honest revision?",
        "options": [
          {
            "label": "Choose the essential preparation and name its finish",
            "feedback": "You acknowledge the changed situation while keeping the promise’s purpose. A specific revised agreement lets you act and review what happened without pretending the original hour was still available."
          },
          {
            "label": "Leave the plan vague and decide later whether it counted",
            "feedback": "A vague replacement makes follow-through hard to recognize. Name the smaller action now, so the agreement is clear before you evaluate what you did."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Review one promise that no longer fits**. Name its purpose, choose a realistic revised action with a clear finish, and record what you actually do without raising the standard afterward."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillphonebedtimemusclesphoneready",
    "title": "Choose Before the Reach",
    "step": "Give the next phone check a purpose and a finish.",
    "blocks": [
      {
        "kind": "text",
        "text": "Your hand may reach for the phone during an evening pause before you have decided what you need. **Notice the reach as a choice point**. It does not mean the whole evening is lost; it gives you a moment to choose the next action."
      },
      {
        "kind": "text",
        "text": "Ask what this check is for. Replying to a practical message has a different finish from looking for something interesting. **Name the job before opening**. If there is no job, you can still choose entertainment, but make that choice in relation to tonight’s remaining time."
      },
      {
        "kind": "list",
        "items": [
          {
            "term": "Check the situation",
            "text": "For a necessary check, define what completes it: send the reply, confirm the alarm, or find the address."
          },
          {
            "term": "Choose the response",
            "text": "**Stop at the purpose**. You can leave unrelated updates unopened even when they appear beside the information you came to use."
          }
        ]
      },
      {
        "kind": "text",
        "text": "Afterward, choose where the phone belongs during your next bedtime activity. **Make the next action easier to follow**. Leaving it on a suitable surface while washing up is a practical arrangement, rather than a test of whether you can resist every possible notification."
      },
      {
        "kind": "text",
        "text": "If you pick it up again automatically, ask the same purpose question without restarting a verdict about yourself. **Choose from the next reach**. The useful skill is giving checks a boundary and returning to the evening activity you selected."
      },
      {
        "kind": "text",
        "text": "Today’s **Muscle Release** offers a separate chance to notice physical sensations. The everyday skill remains checking the situation and choosing a response that fits."
      },
      {
        "kind": "choice",
        "prompt": "You pick up the phone to confirm an alarm and notice new updates. What keeps the check purposeful?",
        "options": [
          {
            "label": "Confirm the alarm, then return to getting ready for bed",
            "feedback": "The original purpose has a clear finish. You can choose a different time for updates instead of letting their appearance silently change the alarm check into another open-ended session."
          },
          {
            "label": "Read every update before deciding whether the check is complete",
            "feedback": "New content does not change what confirming the alarm required. Decide whether you want a separate browsing session rather than allowing it to become an unspoken part of the necessary check."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Notice one evening reach for the phone**. Name its purpose and finish before opening it; afterward, put it somewhere that supports the bedtime activity you chose next."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  },
  {
    "id": "attention.trialskillphoneworkmusclesphoneready",
    "title": "Name the Urge’s Job",
    "step": "Choose a response to the need behind a workday phone reach.",
    "blocks": [
      {
        "kind": "text",
        "text": "A difficult work moment may come with your hand moving toward the phone. **Check what the reach is for**. You could need information, a break, contact with someone, or an escape from an unclear next step; the gesture alone does not tell you which."
      },
      {
        "kind": "text",
        "text": "Name the situation in concrete terms: I do not know how to start this paragraph, or I have been working and need to step away. **Identify the actual need**. That gives you more options than treating every reach as either useful checking or personal failure."
      },
      {
        "kind": "list",
        "items": [
          {
            "term": "Check the situation",
            "text": "If the task is unclear, choose its next small action or write the question you need answered."
          },
          {
            "term": "Choose the response",
            "text": "**Help the work directly**. A feed may be interesting without supplying the missing instruction, and closing it does not by itself make the task clearer."
          }
        ]
      },
      {
        "kind": "text",
        "text": "If a break is what you need, choose one deliberately and leave a return point. **Give the pause a shape**. You might get water or choose a bounded phone activity, then come back to the specific line or question you noted."
      },
      {
        "kind": "text",
        "text": "When contact or information is genuinely needed, use the phone for that purpose and stop when it is complete. **Match the response to the need**. The goal is purposeful use during work, including appropriate pauses, rather than judging every check by the same rule."
      },
      {
        "kind": "text",
        "text": "Today’s **Muscle Release** offers a separate chance to notice physical sensations. The everyday skill remains checking the situation and choosing a response that fits."
      },
      {
        "kind": "choice",
        "prompt": "You reach for a feed because you cannot work out the next step of an assignment. What addresses that moment?",
        "options": [
          {
            "label": "Write the missing question or choose the smallest clear task action",
            "feedback": "That responds to the obstacle in the assignment. If you also need a break, you can choose one with a return point; the feed does not need to stand in for solving an unclear instruction."
          },
          {
            "label": "Keep browsing until the assignment feels simpler",
            "feedback": "The assignment may remain unclear while more time passes. Name the missing instruction or next action first, so your decision about a break is separate from what the task itself needs."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Before one workday phone reach, name the need**: information, contact, a break, or a clearer task. Choose a fitting response and leave a specific return point for your work."
      }
    ],
    "source": "Author practical teaching and goal-specific everyday application. Attention and physical observations are treated as information, without diagnostic, causal, or clinical outcome claims."
  }
] as const satisfies readonly LessonDefinition[];

export const TRIAL_ATTENTION_REPLACEMENTS = {
  "attention.sensesmorning": "attention.trialskillsensesmorning",
  "attention.sensesstress": "attention.trialskillsensesstress",
  "attention.sensesoverthinking": "attention.trialskillsensesoverthinking",
  "attention.sensesanger": "attention.trialskillsensesanger",
  "attention.sensesfocus": "attention.trialskillsensesfocus",
  "attention.sensesquiet": "attention.trialskillsensesquiet",
  "attention.senseshome": "attention.trialskillsenseshome",
  "attention.sensesrecovery": "attention.trialskillsensesrecovery",
  "attention.sensesselftrust": "attention.trialskillsensesselftrust",
  "attention.phonebedtimesensesphone": "attention.trialskillphonebedtimesensesphone",
  "attention.phoneworksensesphone": "attention.trialskillphoneworksensesphone",
  "attention.musclesmorningready": "attention.trialskillmusclesmorningready",
  "attention.musclesstressready": "attention.trialskillmusclesstressready",
  "attention.musclesoverthinkingready": "attention.trialskillmusclesoverthinkingready",
  "attention.musclesangerready": "attention.trialskillmusclesangerready",
  "attention.musclesfocusready": "attention.trialskillmusclesfocusready",
  "attention.musclesquietready": "attention.trialskillmusclesquietready",
  "attention.muscleshomeready": "attention.trialskillmuscleshomeready",
  "attention.musclesrecoveryready": "attention.trialskillmusclesrecoveryready",
  "attention.musclesselftrustready": "attention.trialskillmusclesselftrustready",
  "attention.phonebedtimemusclesphoneready": "attention.trialskillphonebedtimemusclesphoneready",
  "attention.phoneworkmusclesphoneready": "attention.trialskillphoneworkmusclesphoneready"
} as const;
