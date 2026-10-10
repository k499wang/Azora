# Unrot chat onboarding research and Azora adaptation

Researched 2026-10-10. Implemented as `azoChatInvite` → `azoChat`.
The final four-turn dialogue lives in
[`azoConversation.ts`](../../src/components/onboarding/data/azoConversation.ts).
Drafts below record the design discussion; that data file is the current copy.

## Evidence and limits

The three user-supplied screenshots are the strongest evidence for the desired
version: a message invitation, a conversation with selectable replies, and
testimonial cards inside the transcript. They do not establish animation timing,
what happens after each reply, or whether replies change later questions.

[ScreensDesign's captured flow](https://screensdesign.com/apps/unrot-earn-your-screentime/)
corroborates that sequence. Its recording places the chat invitation after name
and referral questions, problem framing at 00:23–01:17, social proof at
01:17–01:27, and a core-loop demo at 01:27–02:12. Personalization follows.
These are recording timestamps, not mandatory waits or measured completion
times. The complete capture also includes permissions, commitment, and a
paywall; this proposal concerns only Azora's opening.

[Unrot's website](https://www.unrot.com/) and
[App Store listing](https://apps.apple.com/us/app/unrot-earn-your-screen-time/id6746537171)
describe its product loop: healthy activities earn points that unlock apps.
That explains the demo after the chat. Azora needs to demonstrate its own daily
plan and decoration loop instead.

Some public screenshot descriptions call Brain an AI persona. They do not
establish a generative model, free-text conversation, or branching implementation.
The supplied screenshots show preset responses. A small authored conversation
is sufficient to reproduce the visible interaction.

A [public comparison of two onboarding versions](https://www.linkedin.com/posts/siro-r-8b1b39172_unrot-a-screen-time-blocker-app-making-activity-7474867793742512129-kAuc)
also describes the newer introduction as simulated chat with prewritten replies,
replacing a passive text story. This is third-party observation, not an official
technical description or a controlled experiment.

Public captures may represent an older build. No conversion results, current
in-app reproduction, or testimonial authenticity were verified. Revenue and
download estimates from design galleries are not evidence of onboarding success.

## What the screenshots show

| Reference | Visible design | Interpretation for Azora |
| --- | --- | --- |
| Image 1 | White background, back control, notification-style card, invitation headline, large mascot, quiet supporting copy, prominent chat CTA | Turn entry into a personal invitation. Make both the card and CTA open the same chat. Render the card inside the app; no notification permission is needed. |
| Image 2 | Fixed contact header with avatar and status, left-aligned gray messages, scrollable history, right-aligned pale-green suggested replies, no keyboard | Let people participate in the explanation. Keep responses short and visibly tappable. |
| Image 3 | Testimonial cards appear as incoming messages, followed by one suggested response | Evidence belongs next to the claim it supports. Use verified Azora material only; otherwise explain the real product with a preview. |

The design hypothesis is that recognition and small reply choices make the
introduction feel more personal than consecutive narrated screens. The sources
do not prove that this improves conversion or retention.

## Design discussion and earlier drafts

### Dialogue research update

The user requested a closer match to Unrot after reviewing an Azo-centered story.
The revised direction below supersedes the earlier four-turn draft: describe the
user's repeating pattern, let them react, reassure, then offer a way forward.

Two openly available captures were visually inspected:
[opening conversation](https://media.screensdesign.com/avs-pp/75fee0e659d0495eb0720e0258495d5c.webp)
and [response and reassurance](https://media.screensdesign.com/avs-pp/9aeac9bdc6d04dc889317da683c94cc4.webp).
The [open showcase](https://screensdesign.com/showcase/unrot-earn-your-screentime)
also introduces the character as the user's own brain, with a teasing reference
to being ignored late at night. Azo can use direct familiarity while retaining
his own identity.

- The opening greets the user by name and asks whether a pattern is familiar.
  It lays out scrolling, guilt, a promise to stop, more scrolling, and repetition.
  Those lines and three casual response options also appear in user Image 2.
- On the recorded response path, the chosen answer becomes a right-aligned
  bubble. Brain replies with reassurance, a teasing remark, and a numerical
  community claim, followed by two new choices. That claim is part of Unrot's
  copy, not independently verified evidence.
- User Image 3 establishes the later hope-and-testimonial beat followed by an
  invitation to see how the product works. The messages between these captures
  remain unknown; do not invent an exact Unrot transcript for that interval.

The closer narrative is the user's loop unfolding in chat. Azo is the speaker
and guide. The proposed Azo story about his own difficult day is retired.

### Revised conversation draft

These are newly authored Azora lines, designed around Unrot's visible sequence.
Each slash separates incoming bubbles. Replies appear after the group.

| Beat | Azo's messages | Suggested replies |
| --- | --- | --- |
| Personal invitation | Message card: “hey. can we talk?” | “Chat with Azo” |
| Recognizable loop | “hey.” / “does this happen to you?” / “you have things you want to do” / “it all feels like too much” / “so you put them off” / “feel guilty” / “promise yourself tomorrow will be different” / “then tomorrow feels the same” | “yeah, that's me” / “okay, you caught me” / “sometimes” |
| Reassurance | Acknowledge the selected reply without assuming it happens to everyone. Then: “it's okay to feel overwhelmed.” / “feeling that way doesn't make you a failure.” / “you don't have to sort everything out today.” | “then where do I start?” / “I keep trying, though” |
| Shift | “let's make the starting point smaller.” / “a moment to check in.” / “something useful to learn.” / “one thing you can do today.” | “show me how” |
| Product explanation | “that's what your daily plan is for.” / “a check-in, a short lesson, and one small thing to do.” / “guided breathing sessions are part of the plan too.” | “okay, I'm listening” |
| Room introduction | “oh, there's something else.” / “this is my room.” / “when you finish today's plan, you earn a decoration.” / “you choose it.” / “and add it to my room.” | “so I get to decorate?” |
| Room payoff and handoff | “yep.” / “one decoration a day.” / “seven decorations finish a room.” / “then a new room opens.” / “miss a day? your decorations stay.” / “ready to find your starting point?” | “let's make my plan” |

The response to “I keep trying, though” should acknowledge that effort before
continuing, rather than giving the same reassurance regardless of the reply.
Do not tell the user they are damaged, diagnose the cause of their feelings, or
promise recovery. Do not copy Unrot's community count or customer endorsements.
Verified Azora proof can be added in the corresponding narrative position later.

The user requested that the room feature be introduced in the opening too.
Show a small room preview as an incoming chat card beside “this is my room,”
then preview one decoration appearing after the explanation. This demonstrates
the reward without restoring Azo's moving-house backstory. Preserve the user's
choice and placement of the actual earned decoration later; the chat preview
must not claim a reward or write room state.

The emotional connection is that small daily actions create visible progress.
Azo is welcoming, never disappointed by missed days. The later interactive room
teaching can demonstrate placement without repeating this entire explanation.

### Initial implementation boundary

Replace the six opening story beats with one invitation and one continuous
conversation. Keep Azo as the character, using Azora's existing mascot and theme.
The change in onboarding voice is intentional: Azo speaks directly here rather
than being described in third person as in `docs/azo-story.md`.

Do not interpolate a name at this point: the current flow asks for it later.
Preserve the existing name step and goal assessment for the first implementation.
Opening replies are conversational choices, not saved assessment answers.

**Invitation**

- Message card: Azo — “Hey. Got a minute?”
- Headline: “Azo sent you a message.”
- Supporting copy: “Let's talk about you.”
- CTA: “Chat with Azo”

**Earlier conversation draft (superseded above)**

| Turn | Azo's messages | Suggested replies |
| --- | --- | --- |
| Recognition | “Some days there's a lot going on.” / “Even a small thing can feel hard to start.” / “Does that sound familiar?” | “Pretty often” / “Sometimes” / “I'm just curious” |
| Acknowledgment | Often: “That can be a lot to carry.” Sometimes: “Let's make room for those days.” Curious: “I'll show you what we do here.” Then: “You can start small.” | “How small?” |
| Product explanation | “A check-in.” / “A short lesson.” / “One small thing to do.” / “Your plan brings them together.” | “And the breathing?” |
| Breathing and reward | “Short guided breathing sessions are part of the plan too.” / “Complete today's plan and you get a decoration for my room.” / “Miss a day? Pick up when you're ready.” | “Let's make my plan” |

This is newly authored Azora copy, not a reconstruction of missing Unrot lines.
Check final wording against the canonical plan and decoration rules before
shipping, especially because those areas currently have local changes.

The implemented opening uses four exchanges; measure actual completion time. Avoid making the
user tap through every individual message. Present the next choices once a
message group is readable. Respect reduced motion and screen-reader reading
order. Let a reader scroll back without being pulled to the bottom.

The draft keeps reassurance explicit and avoids making the user responsible for
Azo's happiness. Unrot's guilt-focused language fits its own framing; Azora's
stress and self-care introduction should use recognition without blame.

For a minimal replacement, leave the existing `communityProof` step in its
current place. An optional later revision could move verified proof into the
chat and remove the separate screen in the same change. Do not repeat it twice
or reuse Unrot's customer quotes as Azora endorsements.

## Implemented ownership boundary

Replaced opening in `src/components/onboarding/OnboardingFlow.tsx`:

```text
azoIntro → azoMoved → azoNewRoom → azoBusy → azoFresh → azoPlan
→ personalizeIntro → communityProof → scienceCredibility → …
```

Current replacement:

```text
azoChatInvite → azoChat → personalizeIntro → communityProof
→ scienceCredibility → …
```

- Keep the transcript content in a local typed data file under
  `src/components/onboarding/data/`.
- Put the invitation and chat UI alongside the existing onboarding screens.
  Keep local reply/transcript state in the chat; extract a hook only if reveal
  timing and lifecycle ownership justify it.
- `OnboardingFlow` continues to own step transitions and the handoff. A completed
  chat emits `onContinue`; it does not choose root routes itself.
- Use a finite authored transcript with a single acknowledgment branch. No
  remote chat service, dependency, generic conversation framework, or global
  store is necessary.
- Define Back behavior deliberately: undo the latest exchange, then return to
  the invitation at the first exchange. Clear pending reveals when inactive,
  unmounted, or going back, and prevent repeated taps adding duplicate messages.
- Replace the old six beats rather than retaining a second opening. Update step
  types, ordering, progress, inbound Back targets, flow sequence tests, and
  onboarding docs together. Review any analytics references to removed step IDs
  against the repo's analytics guidance.
- Test choice progression, Back behavior, duplicate taps, and handoff. Smoke-test
  5–10 complete release-build cycles for route depth and timer/animation cleanup,
  plus large text, small screens, reduced motion, and screen readers.

## Summary of learnings

The useful pattern is an invitation followed by recognition, participation,
evidence, and a demonstration of the real product. Azora can adopt that opening
while keeping its mascot, supportive voice, existing assessment, and daily plan
mechanics. Exact Unrot timing, branching, and conversion impact remain unknown.

## Verification and preview

The final invitation and chat can be previewed together under **Azo message +
Life Reset chat** in Onboarding Lab. The invitation keeps “Let’s talk about you.”
above waving Azo, brings in the notification with a notification haptic, and
reveals the tap prompt. It uses the existing waving greeting animation and Azora's blue primary
button. The illustration fits the remaining height on one fixed, non-scrolling
screen. The Lab renders the same invitation as onboarding. The chat uses a fixed contact header, warm incoming
cards, blue right-aligned replies, and a read-only room preview on the cream
canvas. Community proof remains at its existing later step; Unrot's
testimonials and community counts were not imported.

Conversation progression is pure and bounded. Invalid, stale, duplicate, or
surplus replies cannot skip a turn. `OnboardingFlow` owns accepted replies so
returning from personalization restores the transcript. Back removes the latest
reply before returning to the invitation. Incoming messages arrive individually;
choices wait until that turn is delivered. Selected replies animate before the
next group or final handoff. Delivery pauses while inactive, Back cancels pending
delivery, and reduced motion delivers immediately. The conversation remains
authored and local. Screens do not choose root navigation routes.

Static-title/notification-buzz update checks passed: TypeScript and all 2,303
tests. The preceding entrance update also passed an iOS bundle export. Delivery
tests include ten complete conversations with visibility
pauses, Back, and cancelled final continuations. Entrance hook tests cover the
title/card/prompt order, one buzz at notification arrival, reduced motion, native
snapshot races, late callbacks, and ten fresh mounts. Notification feedback uses
the existing system pattern and respects the app's Haptics setting. Native visual
and physical-device haptic QA and release-build
cycle smoke tests remain outstanding: the temporary simulator preview server
could not start in the sandbox during the initial implementation.
