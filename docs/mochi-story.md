# Mochi — The Story

The character canon. `docs/blob-mascot-spec.md` fixes how the blob is *drawn*;
this fixes who it is and what it wants, so copy written months apart still
sounds like one character.

---

## The whole story

Mochi has moved so many times he stopped unpacking. His room is empty and he has
given up decorating it. You decorate it for him, one thing a day.

That is the entire fiction and it should stay that size. He is sad, plainly and
on screen — slumped, still, mouth turned down — and what lifts him is the room
filling up.

Mochi is **he/him**.

---

## The loop, in the order a user meets it

Four sentences, one per screen. Each is a mechanic that already ships (see
`docs/room-hotel-plan.md`), stated as a plain fact rather than explained.

The four backstory beats open the flow; the loop is explained later, next to the
plan.

| Beat | Mechanic |
| --- | --- |
| This is Mochi. It just moved in. | floor 1 opens empty on the first placement |
| He's moved a lot. He stopped unpacking. | — backstory, told once |
| You decorate it for him. | the user places the piece |
| Three dailies a day — two breathing sessions and a breath hold. | `useDailiesCompletion` |
| Finish all three, Mochi gets one thing for the room. One a day. | one decoration per user per day |
| Seven things fill the room. Then Mochi starts a fresh one. | seven slots, then floor *n+1* |

Nothing else needs saying during onboarding. A user who understands those four
lines understands the whole feature.

---

## Rules

**1. Never explain the metaphor.** No line says breathing "represents" filling
the room. Finish your dailies, Mochi gets a thing. Stated once, left alone.

**2. Mochi is never at risk and never disappointed.** The shipped rule is that a
missed day pauses the sequence — nothing is lost. Copy must never imply Mochi
waited up, went without, or noticed. Our users are anxious people; a mascot
whose wellbeing depends on their consistency is a churn engine aimed at exactly
the wrong audience.

**3. No economy.** No money, no guests, no currency, no balance. The user earns
one thing a day by practising, and that is the only exchange in the product.

**3b. The user decorates; Mochi receives.** The room is furnished *for* him, not
*by* him. Copy says "you put something in his room", never "Mochi earns a
piece" — the second one makes him the player and the user the currency.

**4. The backstory is four sentences and it is over.** Mochi moved a lot and
stopped unpacking. That is all of it — no reason for the moves, no previous
home, no one it left behind, no answer to what Mochi is. It is told once, at the
start, and never referred to again. Every additional detail is one the loop does
not need and later copy has to stay consistent with.

**4b. Sad at his situation, never sad at the user.** He is sad on arrival,
before the user has done anything, and he cheers up as the room fills. What must
never ship is sadness *aimed at them*: he does not sulk over a missed day, does
not count how long it has been, and never asks. The `sad` prop is set by the
beat, never by the user's streak.

**5. The user is not responsible for Mochi.** They practise; Mochi decorates.
Two parties, one arrangement — which is why the pact screen reads as a promise
between them rather than a duty owed.

---

## Voice

Understated, plain, a little dry. Short sentences. No exclamation marks, no
whimsy, no pleading.

- Good: "It just moved in. The room is empty."
- Good: "One a day."
- Bad: "Poor Mochi needs your help!"
- Bad: "Let's build our dream room together!!"

Third person for narration, always: the copy describes Mochi, it does not speak
as it. Mochi speaks only in bubbles, and only in the room. Every line is a single word
or an ellipsis, and it is always a reaction — he never explains, instructs, or
describes the product.

He does **not** appear on the question screens. Putting the question in his
mouth has now been built and reverted twice — treat it as settled. The questions
are an assessment, and they read as one when the app asks them in a plain
heading; a mascot asking them makes the flow feel like a chat and buries the
subtitle that does the actual explaining. He frames the flow at either end
instead. He greets; he does not explain, instruct, or narrate the product. The
day he starts holding a conversation he becomes a chatbot with a face.

---

## Where it is told

The backstory opens the flow; the loop is explained next to the plan, where the
user has a reason to care about coming back. Copy for every one of these beats
lives in `src/components/onboarding/data/mochiStory.ts` (see `STEP_ORDER` in
`src/components/onboarding/OnboardingFlow.tsx` for the order).

| Screen | Line |
| --- | --- |
| `MochiStoryScreen` (`mochiIntro`) | "This is Mochi." / "He just moved in." — sad, bubble: "hi." |
| `MochiStoryScreen` (`mochiMoved`) | "He's moved a lot." / "Never long enough to unpack." — sad, bubble: "again." |
| `MochiStoryScreen` (`mochiUnpacked`) | "So his room is empty." / "He stopped bothering to decorate it." — sad, bubble: "..." |
| `MochiStoryScreen` (`mochiFresh`) | "You decorate it for him." / "One thing at a time." — bubble: "oh." |
| `MochiStoryScreen` (`mochiDailies`) | "Three dailies a day." / "Two breathing sessions and a breath hold." |
| `MochiPlaceScreen` | "Finish all three." / "You put something in his room. One thing a day." — bubble on landing: "thanks." |
| `MochiFloorScreen` | "Seven things fill the room." / "Then you start on his next one." — bubble when full: "home." |

After onboarding the room itself carries it, plus `RoomCompleteScreen`
("You filled every corner").

---

## The hotel

The app stacks finished rooms into a hotel — `HotelChip` on Home, the Hotel
screen, `createNextRoom`. That is a shipped feature and it stays.

It is deliberately **not part of the story we tell during onboarding.** A user
who has never finished a room does not need to know that finished rooms collect
somewhere; it is a second idea competing with the only one that matters, which
is that today's practice puts something in the room. The hotel is something they
find after their first full room, when it means something.

So: no hotel in onboarding copy, and no hotel framing anywhere that a
first-week user reads.
