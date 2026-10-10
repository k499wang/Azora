# Azo — Story and onboarding voice

Azo is the user's companion, with a room they decorate as they complete their
Life Reset Plan. He is **he/him**. His empty room can remain part of the
character's background, but onboarding no longer narrates his moving-house
backstory.

## The opening conversation

The introduction uses an in-app message invitation followed by a bounded,
authored chat. The user's days lead the story; Azo is the speaker and guide.
This replaces the six consecutive story screens.

The order is:

1. A notification-style card invites the user to chat with Azo.
2. Azo describes a familiar loop: putting things off, guilt, and promising tomorrow.
3. The user chooses a short reply and Azo acknowledges it without diagnosing them.
4. Azo reassures them that it is okay to feel overwhelmed and start small.
5. He introduces the personalized **Life Reset Plan**, daily check-ins, lessons,
   small actions, guided Resets, and heart-rate checks.
6. A room preview explains the reward: finish today's plan, choose a decoration,
   and add it to his room. Missing a day does not remove decorations.
7. The last reply hands off to the existing personalization questions.

The dialogue lives in `src/components/onboarding/data/azoConversation.ts`.
`AzoMessageScreen` and `AzoChatScreen` render it; `OnboardingFlow` owns the
handoff. This is scripted onboarding with preset replies, not a remote AI chat.
Opening replies are local conversation state and are not saved assessment data.

Incoming messages arrive one at a time, and replies animate when selected.
Choices appear after Azo's current message group is delivered. Back restores
the previous turn without replaying its messages. Reduced motion shows the
group immediately, and delivery pauses when the app is inactive.

The invitation reuses the animated waving Azo from the personalized greeting.
Both screens use `AzoGreeting` so playback has one shared visibility-aware
implementation. The chat uses Azora's cream canvas, warm cards, and blue replies
and controls.

## Room rules

- The user earns and chooses the decoration; Azo receives it.
- Completing the daily plan earns one decoration per day.
- Seven decorations finish a room; the user then chooses a new room.
- Missing a day pauses progress. Existing decorations remain.
- Azo is never disappointed by absence, missed days, or a lost streak.
- Do not imply the user is responsible for his wellbeing.
- The opening room preview is illustrative and does not grant a reward or write
  room state. The later room teaching screens still demonstrate actual placement.
- The room remains a literal reward. Do not explain it as a metaphor for the
  user's life, and do not introduce a currency or economy in this story.

## Voice

Short, familiar, and warm. The opening chat speaks directly as Azo in message
bubbles. It is deliberately conversational, following the supplied Unrot
references, while retaining Azora's supportive premise.

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
| `AzoChatScreen` (`azoChat`) | Recognition, reassurance, Life Reset premise, and a read-only room preview. |
| `AzoPlaceScreen` | Demonstrates adding a decoration after completing today's plan. |
| `AzoFloorScreen` | Explains that seven completed days finish the room. |
| `AzoRoomsScreen` | Introduces choosing the next room. |

After onboarding, the room itself and completion moments carry the reward loop.
The user-facing noun is always a **decoration**, and seven decorations finish a
**room**.

## The hotel

Finished rooms collect in the Hotel feature. That remains a later discovery,
after the first room is complete. The opening conversation does not explain
hotel mechanics; its one reward idea is completing today's plan to decorate
Azo's room.
