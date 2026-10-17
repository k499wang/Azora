import type { LessonDefinition } from '../lessonBlock';

/** Original household teaching, organized around a practical first-week progression. */
export const TRIAL_HOME_LESSONS = [
  {
    "id": "focus.trialhomevision",
    "title": "A Home That Works",
    "step": "Clear enough table space to eat a meal.",
    "blocks": [
      {
        "kind": "text",
        "text": "Before you clean, choose what you want to do in the space. **Make room to eat breakfast** is a clear goal. It tells you which part of the table to clear and when you have done enough. You can start with one everyday wish: sitting down to eat without moving a pile first."
      },
      {
        "kind": "text",
        "text": "A messy table can need three different jobs. **Decluttering means deciding what to keep**. Tidying means putting things back where you keep them. Cleaning means removing dirt, such as crumbs or sticky marks. For example, give away a mug you no longer want, put your keys away, then wipe the table."
      },
      {
        "kind": "text",
        "text": "Choose enough space for one plate and cup. Put rubbish in the bin. Put your own things back where you keep them. If something has no place yet, choose a place you can find again. **Clean the cleared part of the table** with a product its label says can be used there. You are finished when you can put down your plate and eat."
      },
      {
        "kind": "reveal",
        "prompt": "See the three different jobs.",
        "items": [
          {
            "label": "An extra mug you do not want",
            "detail": "Declutter: decide whether to keep your mug or give it away to someone who can use it."
          },
          {
            "label": "Keys on the table",
            "detail": "Tidy: put the keys in the place where you keep them."
          },
          {
            "label": "Crumbs on the table",
            "detail": "Clean: brush away the crumbs, then wipe as the table’s care instructions allow."
          }
        ]
      },
      {
        "kind": "choice",
        "prompt": "The table is covered and you want to eat. What could you finish first?",
        "options": [
          {
            "label": "Clear and wipe enough room for one plate and cup",
            "feedback": "You can check the result: there is room to sit and eat. The rest of the table can be another job."
          },
          {
            "label": "Buy baskets for every room first",
            "feedback": "First see what you want to keep and where it belongs. A new basket does not clear your eating space."
          }
        ]
      },
      {
        "kind": "do",
        "text": "Choose space for one plate and cup. **Then clear it**: put rubbish in the bin, put your things away, and wipe the table as its care instructions allow. Stop when you can sit down to eat."
      }
    ],
    "source": "https://konmari.com/about-the-konmari-method/ Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "breath.trialhome",
    "title": "Sort One Kind of Thing",
    "step": "Sort one sock drawer and put back the pairs you keep.",
    "blocks": [
      {
        "kind": "text",
        "text": "Marie Kondo is a tidying expert who created the KonMari Method, a way to decide what to keep and where to put it. **She sorts by category**: one type of thing, such as clothes or books. Her order is clothes, books, papers, komono, then sentimental items. Komono means other household things, such as kitchen tools. Sentimental items are things kept for their memories, such as old letters."
      },
      {
        "kind": "text",
        "text": "The method asks whether something sparks joy: **does it bring you pleasure or matter to you?** Also keep things you need, even if they are not exciting. Your work clothes, can opener, and important papers can have a clear use. You do not need to throw away something useful because it does not make you smile."
      },
      {
        "kind": "text",
        "text": "Today, take only your socks out of one drawer. Match the pairs. Keep the pairs you wear or need. Put those back in the drawer. Check local rules for giving away or recycling unwanted socks. **This small session is an Azora adaptation**, meaning our shorter version. Full KonMari gathers a whole category, such as all clothes, before choosing what stays."
      },
      {
        "kind": "sequence",
        "prompt": "Put these sock-sorting steps in order.",
        "steps": [
          "Take the socks out of one drawer and match the pairs.",
          "Choose which pairs you wear, need, and want to keep.",
          "Put those pairs back and choose what to do with the others."
        ],
        "feedback": "Put the pairs you keep back before opening another drawer. This leaves the first drawer ready to use."
      },
      {
        "kind": "choice",
        "prompt": "You have ten minutes. Which plan leaves your bed ready to use?",
        "options": [
          {
            "label": "Sort only the socks in one drawer",
            "feedback": "You can make the decisions and put the socks away before you stop."
          },
          {
            "label": "Empty all your clothes onto the bed",
            "feedback": "You may run out of time before putting them back. Start with the smaller job today."
          }
        ]
      },
      {
        "kind": "text",
        "text": "Today’s one-minute breathing Reset is a separate pause. **Follow its prompts comfortably**, breathe normally or stop if needed, and let the guide handle the timing."
      },
      {
        "kind": "do",
        "text": "**Sort the socks in one drawer**. Match the pairs, choose what to keep, and put those pairs back. Put unwanted socks in a bag while you check where they can go. Finish before opening another drawer."
      }
    ],
    "source": "https://konmari.com/about-the-konmari-method/ Course structure: https://learn.konmari.com/ Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "attention.trialskillsenseshome",
    "title": "A Home for Everyday Items",
    "step": "Choose a place to keep one thing you use every day.",
    "blocks": [
      {
        "kind": "text",
        "text": "An item’s home means **the place where you keep it**. If you leave your keys on the table every day, they may need a better place. Choose somewhere easy to reach near the door. Put a remote near the sofa, where you use it, rather than in a cupboard across the room."
      },
      {
        "kind": "text",
        "text": "**Use a tray you already own** for your keys. Give your bag a hook or a clear part of a shelf nearby. These places can help you put things away as soon as you come in. Keep old receipts and unrelated papers out of the key tray so you can see and reach the keys."
      },
      {
        "kind": "text",
        "text": "Try the new place once. Walk in, take your keys out, and put them in the tray. **Check whether putting them away is easy**. If you must move a pile or open a stuck drawer first, clear some space or move the tray. You are finished when you have chosen the place and put the item there."
      },
      {
        "kind": "reveal",
        "prompt": "Choose a place that is easy to use.",
        "items": [
          {
            "label": "Choose a nearby place",
            "detail": "Use a place you can reach easily when you come in, such as a shelf by the door."
          },
          {
            "label": "Give it one job",
            "detail": "Keep the key tray for keys. Choose another place for papers."
          },
          {
            "label": "Try it once",
            "detail": "Walk in and put your keys there. Clear anything that makes this difficult."
          }
        ]
      },
      {
        "kind": "choice",
        "prompt": "Your keys end up by the door, but their box is upstairs. What could make putting them away easier?",
        "options": [
          {
            "label": "Give them a clear place near the door",
            "feedback": "You can put them away as you arrive, without an extra trip upstairs."
          },
          {
            "label": "Keep telling myself to carry them upstairs",
            "feedback": "You still need to make the extra trip. First try a place closer to where you leave them."
          }
        ]
      },
      {
        "kind": "text",
        "text": "Today’s **5-4-3-2-1** is a separate noticing practice. When choosing a place for an item, notice where you already use it or leave it."
      },
      {
        "kind": "do",
        "text": "**Choose one place for your keys** near where you come in. Clear enough room, put the keys there, and try taking them out and putting them back. You are done when that place is ready to use."
      }
    ],
    "source": "https://konmari.com/about-the-konmari-method/ Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "focus.trialhomepasses",
    "title": "Tidy, Surfaces, Floors",
    "step": "Put things away, wipe the table, then clean the floor below.",
    "blocks": [
      {
        "kind": "text",
        "text": "Use three rounds to clean one small area. **Put things away, clean the surfaces, then clean the floor**. A surface is a part you can wipe, such as a tabletop or shelf. This order helps because dust and crumbs can fall onto the floor while you work above it."
      },
      {
        "kind": "text",
        "text": "Try the area around one small table. First, **remove the things covering it**. Put rubbish in the bin, take cups to the kitchen, and put other things where you keep them. Leave a big drawer-sorting job for another day. For now, you need room to reach and clean this table."
      },
      {
        "kind": "text",
        "text": "Next, **clean from high to low**. If there is a shelf above the table, dust that first. Then wipe the table using a product allowed by its label and the table’s care instructions. Last, sweep or vacuum the floor below. Mop only if the floor’s care instructions allow it. Stop when this table area is clean; the rest of the room can wait."
      },
      {
        "kind": "sequence",
        "prompt": "Put these cleaning steps in order.",
        "steps": [
          "Put rubbish in the bin and put loose things away.",
          "Dust the shelf first, then wipe the table below it.",
          "Sweep or vacuum the floor under the table."
        ],
        "feedback": "Loose things come off first so you can wipe. Dust the shelf before cleaning the floor so falling dust does not land on a clean floor."
      },
      {
        "kind": "choice",
        "prompt": "A shelf needs dusting above a dirty floor. What should you do first?",
        "options": [
          {
            "label": "Dust the shelf, then clean the floor",
            "feedback": "Any dust that falls will be picked up when you clean the floor."
          },
          {
            "label": "Mop the floor, then dust the shelf",
            "feedback": "Dust may fall onto the floor you just cleaned, so you could need to clean it twice."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Clean the area around one small table**. Put things away, dust above the table if needed, wipe the table, then clean the floor below. Stop at that area."
      }
    ],
    "source": "https://cleanmyspace.com/my-secret-system-to-cleaning-fast-effectively/ Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "focus.trialhomesort",
    "title": "Decide Before Storage",
    "step": "Sort your things and choose where unwanted items will go.",
    "blocks": [
      {
        "kind": "text",
        "text": "Before buying a basket for a full drawer, **decide what you want to keep**. Take out a few of your own things. For each one, ask: do I use this, need it, or want to keep it? Put the things you keep back in the drawer. You may already have enough room without buying anything."
      },
      {
        "kind": "text",
        "text": "To donate means to give something away, often to a charity or another person. **Only give away things you own**. Ask before moving or throwing away someone else’s things. Your housemate may still use a tool you never touch. Put their things aside safely until you can ask them."
      },
      {
        "kind": "text",
        "text": "**Give the bag of unwanted things a next step**. Check whether a charity accepts those items and what condition they must be in. Choose when you will take the bag there, or arrange a collection. Broken things may need repair, recycling, or the bin; check local rules. If you want to sell an item, choose when to list it and what you will do if it does not sell."
      },
      {
        "kind": "reveal",
        "prompt": "Choose what happens next.",
        "items": [
          {
            "label": "Keep",
            "detail": "Put the things you want back where you keep them. Check how much room is left before buying a box."
          },
          {
            "label": "Give away or sell",
            "detail": "Choose who can take the item and when you will give it to them or list it for sale."
          },
          {
            "label": "Someone else’s things",
            "detail": "Ask the person before giving away, throwing away, or moving their things."
          }
        ]
      },
      {
        "kind": "choice",
        "prompt": "You find your housemate’s screwdriver in a drawer you are sorting. What should you do?",
        "options": [
          {
            "label": "Ask them before deciding what happens to it",
            "feedback": "They may need it even if you have never used it. Decide about your own things while you wait."
          },
          {
            "label": "Give it away because I never use it",
            "feedback": "It belongs to your housemate. Your use of it does not tell you whether they need it."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Sort a few of your own things from one drawer**. Put what you keep back. For things you will give away, check who accepts them and choose when you will take them there."
      }
    ],
    "source": "https://konmari.com/about-the-konmari-method/ Category task and maintenance structure: https://cleanmyspace.com/courses/ Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "attention.trialskillmuscleshomeready",
    "title": "Your Small Cleaning Kit",
    "step": "Read the cleaner’s label before cleaning one table.",
    "blocks": [
      {
        "kind": "text",
        "text": "You can begin with a few cloths, a cleaner you already have, a brush, and a broom or vacuum. **Choose supplies for the thing you will clean**. For a table, read the cleaner’s label to check whether it can be used on that kind of table. Some products can damage wood or stone."
      },
      {
        "kind": "text",
        "text": "**Read the label before you start**. It tells you how much to use, whether to add water, and whether you need gloves or an open window. Never mix cleaning products. Keep them in their labelled containers and store them as directed, away from children and pets. Follow the table or floor maker’s care instructions too."
      },
      {
        "kind": "text",
        "text": "**Keep toilet cloths separate from kitchen cloths**. Use a fresh cloth when one gets dirty. Cleaning removes dirt. Disinfecting uses a product to kill germs and is a separate job when needed. A disinfectant may need to stay wet on the surface for a stated time. Follow that time and any rinsing instructions on its label."
      },
      {
        "kind": "list",
        "items": [
          {
            "term": "Check the surface",
            "text": "Read whether the product can be used on your table or floor. If told to test it first, use a small hidden spot."
          },
          {
            "term": "Use separate cloths",
            "text": "Do not use a toilet cloth on kitchen counters or other places where you prepare food."
          },
          {
            "term": "Follow the label",
            "text": "Use the stated amount. Do not add another cleaner or extra water unless the label says to."
          }
        ]
      },
      {
        "kind": "choice",
        "prompt": "A stain remains after you use a cleaner. What should you do before trying something else?",
        "options": [
          {
            "label": "Read the label and the instructions for the thing I am cleaning",
            "feedback": "Check what is safe to use and how to use it. Adding chemicals can damage things or cause harm."
          },
          {
            "label": "Add another cleaner to make it stronger",
            "feedback": "Never mix cleaning products. They can react and produce harmful gases or other dangers."
          }
        ]
      },
      {
        "kind": "text",
        "text": "Today’s **Muscle Release** is a separate guided practice. Follow it comfortably. For cleaning, use the instructions on the product label and for the thing you are cleaning."
      },
      {
        "kind": "do",
        "text": "**Get a clean cloth and one cleaner for a table**. Read the label and the table’s care instructions. Check that the product can be used there before cleaning."
      }
    ],
    "source": "https://www.cdc.gov/hygiene/about/when-and-how-to-clean-and-disinfect-your-home.html Original Azora teaching and examples; no affiliation or guaranteed outcome."
  },
  {
    "id": "focus.trialhomeroutine",
    "title": "A Rhythm for Chores",
    "step": "Choose when to do one daily job and one weekly job.",
    "blocks": [
      {
        "kind": "text",
        "text": "**Some chores happen often; others can wait longer**. Used dishes may need attention every day. Cleaning a bathroom may fit a weekly plan. Sorting a cupboard can be a separate job for a day when you have time. Change these timings to fit how many people use the space, pets, and how dirty it gets."
      },
      {
        "kind": "text",
        "text": "Choose **one job after something you already do**. That daily moment can remind you to start. For example: after dinner, I will wash the dishes I used. Then choose a day and time for one weekly job: on Saturday after breakfast, I will clean the bathroom sink. Give the cupboard its own date instead of adding it to every day."
      },
      {
        "kind": "text",
        "text": "Plan a smaller version for a busy day: wash one cup and clear the sink drain. **After a missed day, start again with the next small job**. Clean up urgent food waste or spills first. You do not have to double every chore to catch up. If you share a home, agree who will do each job and what they will finish."
      },
      {
        "kind": "reveal",
        "prompt": "Plan when each job will happen.",
        "items": [
          {
            "label": "Every day",
            "detail": "Choose one job, such as washing the dishes you used after dinner."
          },
          {
            "label": "Each week",
            "detail": "Choose a day, a time, and a person for one job, such as cleaning the bathroom sink."
          },
          {
            "label": "When there is time",
            "detail": "Give a bigger job, such as sorting a cupboard, its own day. It does not have to join the daily list."
          }
        ]
      },
      {
        "kind": "choice",
        "prompt": "You miss your planned Saturday clean. What helps you begin again?",
        "options": [
          {
            "label": "Deal with urgent mess, then choose the next time I can do one job",
            "feedback": "A specific job and time give you a clear way to return. It does not need to become a whole-house clean."
          },
          {
            "label": "Do twice as many chores before returning to the plan",
            "feedback": "That makes the next session bigger. Choose the job you can actually fit into the time you have."
          }
        ]
      },
      {
        "kind": "do",
        "text": "**Write one daily job and one weekly job**. Add when you will do each and a smaller version for busy days. If you share the work, agree who will do it."
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
