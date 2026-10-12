# Azo — Story and onboarding voice

Azo is the user's companion, with a room they decorate as they complete their
Life Reset Plan. He is **he/him**. He has just moved into a new, empty place,
and the opening chat tells that backstory so the user wants to help him make it
a home.

## The opening conversation

The introduction uses an in-app message invitation followed by a bounded,
authored chat. The user's days lead the story; Azo is the speaker and guide.
This replaces the six consecutive story screens.

The order is:

1. “Hi, I’m Azo. It’s good to meet you.” stays above waving Azo, then hands the line
   over to “In 28 days, you’ll feel more in control of your day.”, which is
   left to be read and then fades out as the prompt takes its place. Each line is
   held long enough to be read before the next thing arrives, and ticks softly as
   it lands. The notification slides in on the double knock of a real notification
   and jolts as it lands, is left to be read in its turn, and then the prompt
   invites the user to tap it.
2. Azo says he just moved in and still needs a rug, desk, and lamp. By evening
   he is too exhausted to decorate, even choosing a lamp feels overwhelming, and he keeps
   putting it off. He asks whether they can help each other stay on track.
3. He offers to help the user stay on track, recognizes difficulty switching
   off, focusing, or finding energy, and describes dishes and laundry piling up
   while starting chores and keeping a routine feel hard.
4. The user chooses a short reply and Azo acknowledges it without diagnosing them.
5. Azo reassures the user that struggling does not mean they are lazy. He starts
   with what feels hardest, offers a next step small enough to try, and
   introduces the 7-day milestone.
6. He introduces a **personalized life reset plan** informed by the user's
   answers and science-based methods including CBT and Goal-Setting Theory.
   Each day includes a mood check-in, a short lesson and Reset exercise
   personalized to the user's goals, and one small task from a routine
   personalized to their goals and struggles. Guided breathing illustrates the
   exercise; cleaning and chores illustrate the daily tasks. A tidier home is
   framed as an example goal. He introduces AI tools for practical support,
   illustrated by cleaning help from a room photo.
7. Azo explains the reward in words, with no room preview: finish today's plan,
   choose a decoration, and add it to his place. Missing a day does not remove
   decorations. As the room fills, users can see the steps they have completed.
8. The last reply hands off to the existing personalization questions.

The dialogue lives in `src/components/onboarding/data/azoConversation.ts`.
`AzoMessageScreen` and `AzoChatScreen` render it; `OnboardingFlow` owns the
handoff. This is scripted onboarding with preset replies, not a remote AI chat.
Opening replies are local conversation state and are not saved assessment data.

The chat uses six authored turns plus an acknowledgment. Longer thoughts and
examples are split at natural pauses into separate message bubbles. Use the
existing `**emphasis**` markup only for the personalized life reset plan, the
routine's personalization to goals, and the 7-, 14-, and 28-day labels.
The opening milestones are more confidence getting started in 7 days, less
overwhelm from everyday tasks in 14 days, and more control of the day in 28 days
with a routine built around the user's goals. These are authored milestones
before the questionnaire; the later personalized plan promise uses the resolved
plan's actual duration and goal. The invitation also retains its 28-day line.

Incoming messages arrive one at a time, each felt as a buzz on the beat of its own
entrance, and replies animate when selected. The transcript follows the
delivery: a message that arrives while the reader is at the end is brought into
view, so no line of a turn is left below the fold unseen. A reader who has
scrolled back keeps their place, and the arriving group waits below until they
return to it. Choices appear after Azo's current message group is delivered. Back restores
the previous turn without replaying its messages. Reduced motion shows the
group immediately, and delivery pauses when the app is inactive. A bubble's
words are wrapped by the platform inside the room the chat leaves for a bubble,
so the bubble grows to hold every line it takes and one copy of the words is
never cut off at an edge.

The invitation reuses the animated waving Azo from the personalized greeting.
Both screens use `AzoGreeting` so playback has one shared visibility-aware
implementation. The chat uses Azora's cream canvas, warm cards, and blue replies
and controls.

The invitation uses one fixed screen. One slot holds the whole copy: the two
lines are read in it, and the prompt then arrives in the very place they leave,
so an empty box is never left for Azo to sit below. He stands directly under
that slot and takes the rest of the body, drawn as large as it leaves him rather
than shrinking to keep his centre — he is the thing the screen is about. Nothing
enters before the illustration has painted, so the copy never lands ahead of him
while it is still decoding. The notification/prompt entrance pauses while
inactive and replays when the screen is opened fresh, including through the
Lab's Replay control.

The entrance is a list of steps in `useAzoMessageEntrance`: each message arrives
on a stage and is then held for a beat long enough to read, so the timeline
counts six steps and the screen's own ranges are flat across the holds. The last
line's exit is a step of its own, which is what lets the prompt follow it in
rather than cross over it. Editing a step's duration is how a message is given
more or less time.

## Room rules

- The user earns and chooses the decoration; Azo receives it.
- Completing the daily plan earns one decoration per day.
- Seven decorations finish a room; the user then chooses a new room.
- Missing a day pauses progress. Existing decorations remain.
- Azo is never disappointed by absence, missed days, or a lost streak.
- Do not imply the user is responsible for his wellbeing.
- The opening chat shows no room; the later room teaching screens demonstrate
  actual placement.
- The room remains a literal reward. Do not explain it as a metaphor for the
  user's life, and do not introduce a currency or economy in this story.

## Voice

Mature, conversational, and warm. The opening chat speaks directly as Azo in
message bubbles, using sentence case and clear, concise sentences. Offer calm,
practical encouragement without buddy language, teasing, or exaggerated
enthusiasm. Preset replies follow the same tone.

Recognize a pattern before explaining the product. A reply such as “sometimes”
must not be treated as an admission that the user is always stuck. Reassurance
must not diagnose the cause of their feelings or promise a measured improvement.
Use **Reset**, **Life Reset Plan**, and **decoration** consistently.

The existing assessment remains its own flow. Do not turn every question into
chat merely because the introduction now uses it.

On Home, Azo's user-invoked reactions remain about positive live state: completed
Resets, an available decoration, a chosen decoration, or a completed room. They
never mention absence, missed days, disappointment, or a duty the user owes him.

## Where it is told

| Screen | Purpose |
| --- | --- |
| `AzoMessageScreen` (`azoChatInvite`) | Message card, invitation, mascot, and “Chat with Azo” CTA. |
| `AzoChatScreen` (`azoChat`) | Azo's move, recognition, reassurance, Life Reset premise, and the decoration reward. |

After onboarding, the room itself and completion moments carry the reward loop.
The user-facing noun is always a **decoration**, and seven decorations finish a
**room**.

## The hotel

Finished rooms collect in the Hotel feature. That remains a later discovery,
after the first room is complete. The opening conversation does not explain
hotel mechanics; its one reward idea is completing today's plan to decorate
Azo's room.
