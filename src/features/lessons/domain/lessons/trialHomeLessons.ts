import type { LessonDefinition } from '../lessonBlock';

/** Original household teaching, organized around a practical first-week progression. */
export const TRIAL_HOME_LESSONS = [
  {
    "id": "focus.trialhomevision",
    "title": "When Is Clean Enough?",
    "step": "Clear enough table space to eat a meal.",
    "blocks": [
      {
        "kind": "text",
        "text": "It’s 7pm. You’re holding your dinner and **there’s nowhere to put it down**. The table now belongs to the mail, a charger, three mugs, and a hoodie nobody remembers taking off. So you eat on the couch. Again."
      },
      {
        "kind": "text",
        "text": "Then the thought shows up: **I really need to clean this whole place.** Just like that, one table has turned into the entire house. Your brain takes one look and reaches for your phone. Nobody finishes a race with no finish line, and “clean the house” doesn’t have one."
      },
      {
        "kind": "text",
        "text": "So let’s draw one. Forget the house. Tonight’s whole mission is **room for one plate and one cup**. When your dinner fits on the table, you win. You’re allowed to stop right there, even if the other end still looks like a yard sale."
      },
      {
        "kind": "text",
        "text": "Now look at that pile again. It’s three different jobs wearing one big coat. **Decluttering means deciding what stays**, like that chipped mug you never use. Tidying means putting things back where they live, like your keys. Cleaning means removing the gunk, like crumbs and that sticky ring."
      },
      {
        "kind": "text",
        "text": "Try all three at once and you end up holding one old receipt for ten minutes, reading it like a mystery novel. Keep it simple instead. **Bin the trash, put your things back, wipe the spot.** If something has no home yet, pick one now, somewhere you’ll remember. Then set your plate down and eat at your own table, like the fancy person you are. **That’s clean enough.** The rest of the table can have its turn another day. Trust us, it isn’t going anywhere."
      },
      {
        "kind": "reveal",
        "prompt": "Three things on your table. Tap to see which job each one is.",
        "items": [
          {
            "label": "The chipped mug you never use",
            "detail": "Declutter. Keep it or let it go. Either answer is fine, as long as you actually pick one."
          },
          {
            "label": "Your keys, hiding under the mail",
            "detail": "Tidy. You still want them, they’re just in the wrong spot. Back to their hook or bowl they go."
          },
          {
            "label": "Crumbs and a sticky ring",
            "detail": "Clean. Brush off the crumbs, wipe up the ring, and enjoy feeling a little smug about it."
          }
        ]
      },
      {
        "kind": "choice",
        "prompt": "It’s dinnertime and the table is buried. What do you do first?",
        "options": [
          {
            "label": "Clear a spot for one plate and cup",
            "feedback": "Yes. A few minutes from now you’re sitting down to eat, and the rest of the table can wait its turn."
          },
          {
            "label": "Order baskets for every room",
            "feedback": "So tempting, and so fun to browse. But a basket won’t clear your table tonight, and you don’t know what needs one yet. Dinner first."
          }
        ]
      },
      {
        "kind": "do",
        "text": "Go make your spot: **room for one plate and one cup**. Trash in the bin, your things back where they live, one good wipe. Then stop and sit down. You’re done."
      }
    ],
    "source": "https://konmari.com/about-the-konmari-method/ Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "breath.trialhome",
    "title": "Marie Kondo's Joy Test",
    "step": "Sort one sock drawer and put back the pairs you keep.",
    "blocks": [
      {
        "kind": "text",
        "text": "Marie Kondo is a tidying expert who created the KonMari Method, a way to decide what to keep and where to put it. She’s known for thanking her clothes before letting them go. Her big move? **She sorts by category**, one type of thing at a time. Her order goes clothes, books, papers, komono, then sentimental items. Komono is everything else around the house, like kitchen tools. Sentimental items, like old letters, come last because they can swallow a whole afternoon."
      },
      {
        "kind": "text",
        "text": "Then comes her famous question: does it spark joy? Hold something and ask, **does it make you happy or matter to you?** Also keep things you need, even the boring ones. Nobody has ever felt a rush of delight holding a can opener, and you’re still going to want it on soup night."
      },
      {
        "kind": "text",
        "text": "Now open your sock drawer. There’s the lonely one with no partner, and the pair with a hole you’ve been meaning to fix for years. Today it’s just socks. Take them out of one drawer, match the pairs, and put back the ones you wear. **This small session is an Azora adaptation**, our shorter version. Full KonMari gathers a whole category, like every piece of clothing you own, before choosing what stays."
      },
      {
        "kind": "sequence",
        "prompt": "Put your sock mission in order.",
        "steps": [
          "Take the socks out of one drawer and match the pairs.",
          "Choose the pairs you wear, need, and want to keep.",
          "Put those pairs back and decide where the others go."
        ],
        "feedback": "One drawer, finished and ready for tomorrow morning, before you’ve even looked at the next one."
      },
      {
        "kind": "choice",
        "prompt": "You have ten minutes, and you’d like to sleep in your bed tonight. Which plan do you pick?",
        "options": [
          {
            "label": "Just the socks in one drawer",
            "feedback": "Nice. You can make every decision and have the socks away before your ten minutes are up."
          },
          {
            "label": "Dump all my clothes on the bed",
            "feedback": "Bold. It’s also a great way to end up sleeping next to a mountain of sweaters. Stick with the socks today."
          }
        ]
      },
      {
        "kind": "text",
        "text": "Today you also have a one-minute breathing Reset, a short guided pause. **Follow along comfortably**, breathe normally, and stop whenever you like. The guide handles the timing, so there’s nothing to keep track of."
      },
      {
        "kind": "do",
        "text": "**Sort the socks in one drawer**. Match the pairs, keep the ones you’ll wear, and put them back. Anything else goes in a bag while you check where it can go. Then close the drawer. You’re done."
      }
    ],
    "source": "https://konmari.com/about-the-konmari-method/ Course structure: https://learn.konmari.com/ Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "attention.trialskillsenseshome",
    "title": "Lost Your Keys Again?",
    "step": "Choose a place to keep one thing you use every day.",
    "blocks": [
      {
        "kind": "text",
        "text": "You’re already late. You pat your pockets, check yesterday’s jacket, and look in the fridge for some reason. The keys turn up under the mail. **Your keys don’t have a home**, so they live wherever you happened to stop walking."
      },
      {
        "kind": "text",
        "text": "An item’s home means **the place where you keep it**, and the best one is right where you already use the thing. Keys go by the door. The remote goes by the couch. A cupboard across the room might look neater, but nobody crosses a room to put away a remote."
      },
      {
        "kind": "text",
        "text": "You don’t need to buy anything for this. **Grab a tray you already own** and set it by the door for your keys. Give your bag a hook or a patch of shelf nearby. Then guard that tray. Let one receipt move in, and soon you can’t find your keys in there either."
      },
      {
        "kind": "text",
        "text": "Now do a test run. Walk in, take out your keys, and drop them in the tray. **Was that easy?** If you had to move a pile or fight a stuck drawer, clear some space or move the tray. A good home takes no effort to use, which is why you’ll keep using it."
      },
      {
        "kind": "reveal",
        "prompt": "Three things make a good home. Tap to see each one.",
        "items": [
          {
            "label": "It’s close",
            "detail": "You can reach it the second you walk in, like a shelf by the door. If it takes a trip upstairs, it won’t happen."
          },
          {
            "label": "It has one job",
            "detail": "The key tray holds keys. Papers get their own spot, or your tray turns into a tiny version of the pile you just escaped."
          },
          {
            "label": "It passes the test",
            "detail": "Walk in and drop your keys there. If anything gets in your way, clear it or move the home."
          }
        ]
      },
      {
        "kind": "choice",
        "prompt": "Your keys always land by the door, but their little box is upstairs. What do you do?",
        "options": [
          {
            "label": "Give them a spot by the door",
            "feedback": "Exactly. They’ve been telling you where they want to live this whole time. Now they get put away on your way in."
          },
          {
            "label": "Keep telling myself to carry them up",
            "feedback": "You’ve been telling yourself that for a while now, and here we are. Try a spot closer to where they already land."
          }
        ]
      },
      {
        "kind": "text",
        "text": "Today’s **5-4-3-2-1** is a short practice where you stop and notice what’s around you. Bring the same eyes to your search for a home: where does this thing already end up?"
      },
      {
        "kind": "do",
        "text": "**Pick one home for your keys**, close to where you walk in. Clear a little room, drop them there, then take them out and put them back once. That’s the whole job."
      }
    ],
    "source": "https://konmari.com/about-the-konmari-method/ Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "focus.trialhomepasses",
    "title": "Stop Cleaning Twice",
    "step": "Put things away, wipe the table, then clean the floor below.",
    "blocks": [
      {
        "kind": "text",
        "text": "You just mopped. The floor looks amazing and you feel like a real adult. Then you spot the dusty shelf, give it a swipe, and watch a small gray snowfall land on your clean floor. **Gravity doesn’t care how hard you worked**, so the order you clean in matters."
      },
      {
        "kind": "text",
        "text": "Here’s the order that saves you. Three rounds: **put things away, clean the surfaces, then clean the floor**. A surface is anything you can wipe, like a tabletop or a shelf. Whatever you knock loose falls down, so the floor goes last and picks it all up."
      },
      {
        "kind": "text",
        "text": "Try it on one small table. Round one is to **get everything off it**. Trash in the bin, cups to the kitchen, and the rest back where it lives. If a drawer starts calling your name, ignore it. That’s a job for another day. Right now you only need room to wipe."
      },
      {
        "kind": "text",
        "text": "For rounds two and three, **clean from high to low**. Dust the shelf above the table first, then wipe the table with a product whose label says it’s okay there. Finally, sweep or vacuum the floor below, and mop only if that floor can take it. Then stop, even if the rest of the room is giving you a look."
      },
      {
        "kind": "sequence",
        "prompt": "Put your three rounds in order.",
        "steps": [
          "Put trash in the bin and loose things away.",
          "Dust the shelf, then wipe the table below it.",
          "Sweep or vacuum the floor under the table."
        ],
        "feedback": "Top to bottom, so everything lands right where you’re about to clean. No snowfall on your nice floor."
      },
      {
        "kind": "choice",
        "prompt": "A dusty shelf sits above a dirty floor. Which comes first?",
        "options": [
          {
            "label": "Dust the shelf, then do the floor",
            "feedback": "Right. Whatever falls gets picked up on your way out."
          },
          {
            "label": "Mop the floor, then dust the shelf",
            "feedback": "Hello again, gray snowfall. You’d be cleaning that floor twice."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Clean the area around one small table**. Things away, dust up high, wipe the table, then do the floor below. Then put your supplies away and walk off like you own the place."
      }
    ],
    "source": "https://cleanmyspace.com/my-secret-system-to-cleaning-fast-effectively/ Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "focus.trialhomesort",
    "title": "Don't Buy That Basket",
    "step": "Sort your things and choose where unwanted items will go.",
    "blocks": [
      {
        "kind": "text",
        "text": "The drawer won’t close, so now you’re in a store holding a beautiful woven basket and imagining a whole new life. Then it comes home and fills up, and you own a full drawer and a full basket. Before buying a basket, **decide what you want to keep**."
      },
      {
        "kind": "text",
        "text": "Take a few of your own things out of the drawer. For each one, ask: **do I use this, need it, or want it?** The yeses go back in. A lot of drawers turn out to have plenty of room once the dead pens and ancient takeout menus leave."
      },
      {
        "kind": "text",
        "text": "One rule before you get carried away. **Only give away things you own**. To donate means giving something away, usually to a charity or another person. That weird tool you’ve never touched might be your roommate’s favorite thing in the world. Set other people’s stuff aside safely, then ask them."
      },
      {
        "kind": "text",
        "text": "Now watch out for the donation bag, which can sit by the door until it’s basically furniture. **Give the bag a next step**: check that a charity takes those items, then choose when you will take the bag there, or arrange a collection. Broken things may need repair, recycling, or the trash, so check local rules. Selling something? Pick a day to list it, plus a plan for if nobody bites."
      },
      {
        "kind": "reveal",
        "prompt": "Everything in the drawer goes one of three ways. Tap to see them.",
        "items": [
          {
            "label": "Keep",
            "detail": "It goes back where it lives. Then check how much room is left, because you might not need that basket after all."
          },
          {
            "label": "Give away or sell",
            "detail": "Pick who’s taking it and when it’s leaving, so it actually leaves."
          },
          {
            "label": "Someone else’s things",
            "detail": "Ask first, before you give away, toss, or even move them."
          }
        ]
      },
      {
        "kind": "choice",
        "prompt": "You’re sorting a drawer and find your roommate’s screwdriver. What now?",
        "options": [
          {
            "label": "Ask them what they want done with it",
            "feedback": "Good call. They may need it, even if you’ve never touched it. Keep sorting your own things while you wait."
          },
          {
            "label": "Give it away, since I never use it",
            "feedback": "That’s a great way to start an awkward conversation the next time a shelf comes loose. It’s their call, so ask."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Sort a few of your own things from one drawer**. Put the keepers back. For anything leaving, check who accepts it and pick the day it goes. No basket required."
      }
    ],
    "source": "https://konmari.com/about-the-konmari-method/ Category task and maintenance structure: https://cleanmyspace.com/courses/ Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "attention.trialskillmuscleshomeready",
    "title": "Before You Spray",
    "step": "Read the cleaner’s label before cleaning one table.",
    "blocks": [
      {
        "kind": "text",
        "text": "Open the cupboard under your sink. It may look like a small museum of half-empty bottles, including one left by whoever lived there before you. Good news: you need very little. **A few cloths and a cleaner you already have**, plus a brush and a broom or vacuum, will do."
      },
      {
        "kind": "text",
        "text": "Now picture spraying your nice wooden table with whatever bottle is closest. Some products can damage wood or stone, and you only find out when the mark shows up. So **read the label before you start**. It tells you where the product can go, how much to use, whether to add water, and if you need gloves or an open window."
      },
      {
        "kind": "text",
        "text": "Here’s the one rule with no wiggle room. **Never mix cleaning products.** They can react and make harmful gases. Keep each one in its labelled bottle, stored as directed, away from children and pets. And **keep toilet cloths separate from kitchen cloths**, for reasons you already know. Grab a fresh cloth whenever yours gets dirty."
      },
      {
        "kind": "text",
        "text": "One more thing that’s easy to mix up. Cleaning removes dirt. Disinfecting uses a product to kill germs, and it’s a separate job for when you need it. **A disinfectant may need to stay wet on the surface for a stated time**, so a quick spray and wipe can miss the point. Follow the time and any rinsing steps on its label."
      },
      {
        "kind": "list",
        "items": [
          {
            "term": "Check the surface",
            "text": "See whether the product works on your table or floor. If it says to test it first, try a small hidden spot."
          },
          {
            "term": "Use separate cloths",
            "text": "A toilet cloth never goes near kitchen counters or anywhere you make food."
          },
          {
            "term": "Follow the label",
            "text": "Use the amount it says. No bonus cleaner and no extra water, unless the label tells you to."
          }
        ]
      },
      {
        "kind": "choice",
        "prompt": "A stain is still there after you cleaned it. What do you do before trying something else?",
        "options": [
          {
            "label": "Read the label and the care instructions",
            "feedback": "Right. They tell you what’s safe to use on that surface, and how to use it."
          },
          {
            "label": "Add another cleaner to make it stronger",
            "feedback": "Put the bottle down. Cleaning products can react and make harmful gases, so they never get mixed."
          }
        ]
      },
      {
        "kind": "text",
        "text": "Today’s **Muscle Release** is a short guided practice for letting go of tension in your body. Follow along comfortably. All that scrubbing has earned it."
      },
      {
        "kind": "do",
        "text": "**Grab a clean cloth and one cleaner for a table**. Read the label and check the table’s care instructions. Make sure that product belongs on that table before you clean."
      }
    ],
    "source": "https://www.cdc.gov/hygiene/about/when-and-how-to-clean-and-disinfect-your-home.html Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "focus.trialhomeroutine",
    "title": "How Tidy Homes Stay Tidy",
    "step": "Choose when to do one daily job and one weekly job.",
    "blocks": [
      {
        "kind": "text",
        "text": "You know the big weekend clean. Six hours, one playlist, and the whole place sparkles. By Wednesday there are dishes in the sink and a hoodie on a chair. **Tidy homes rarely come from heroic weekends.** They come from small jobs that keep showing up."
      },
      {
        "kind": "text",
        "text": "Start by sorting chores by how often they really come up. Used dishes may need attention every day. Cleaning a bathroom may fit a weekly plan. Sorting a cupboard can wait for a slow afternoon. **Adjust all of this to your home**, because kids, pets, and roommates change the math."
      },
      {
        "kind": "text",
        "text": "Next, tie each job to something you already do. **After dinner, I’ll wash the dishes I used.** Now dinner is your reminder, so you have one less thing to remember. Weekly jobs get a day and a time: on Saturday after breakfast, I’ll clean the bathroom sink. The cupboard gets its own date, far away from your daily list."
      },
      {
        "kind": "text",
        "text": "Here’s the part that saves the whole plan. Some days will fall apart, so make a smaller version for a busy day: wash one cup and clear the sink drain. **Missed a day? Start again with the next small job.** Deal with spills and old food first, but you do not have to double every chore to catch up. If you share your home, agree on who does what."
      },
      {
        "kind": "reveal",
        "prompt": "Every chore has its own rhythm. Tap to see all three.",
        "items": [
          {
            "label": "Every day",
            "detail": "One job tied to something you already do, like washing your dishes after dinner."
          },
          {
            "label": "Each week",
            "detail": "A day, a time, and a person. Saturday morning, bathroom sink, you."
          },
          {
            "label": "When there’s time",
            "detail": "Big jobs, like sorting a cupboard, get their own day and stay off your daily list."
          }
        ]
      },
      {
        "kind": "choice",
        "prompt": "You miss your big Saturday clean. What gets you back on track?",
        "options": [
          {
            "label": "Handle anything urgent, then pick one job and a time",
            "feedback": "That’s it. One job at one time gets you back in, with no whole-house clean required."
          },
          {
            "label": "Do twice the chores to make up for it",
            "feedback": "It sounds noble, but a bigger session is harder to start. Pick a job that fits the time you actually have."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Write down one daily job and one weekly job**, plus when each one happens and a tiny version for busy days. If you share the work, agree who does what. Now your home has a plan."
      }
    ],
    "source": "https://www.flylady.net/morning-musing/babystep-your-way-to-routines Original Azora teaching and examples; no affiliation or guaranteed outcome."
  }
] as const satisfies readonly LessonDefinition[];

export const TRIAL_HOME_REPLACEMENTS = {
  'focus.visible': 'focus.trialhomevision',
  'focus.home': 'breath.trialhome',
  'focus.timer': 'focus.trialhomepasses',
  'focus.sort': 'focus.trialhomesort',
  'focus.homeshared': 'focus.trialhomeroutine',
} as const;
