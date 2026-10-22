# Focus timer product research

Researched October 22, 2026. This is a qualitative review of prominent apps,
their current product descriptions, public App Store reviews, and user
discussions. It is not a market-share ranking or a representative survey.
Featured App Store reviews include older versions; dated comments describe
those users' experiences, not necessarily current defects.

## What to borrow

| App | Product pattern | Specific user feedback | Application to Azora |
| --- | --- | --- | --- |
| Forest | A session grows a collectible tree; completed sessions build a forest. | Reviewers Jinxer52 (2022) and Jo_Wiley_49 (2019) describe tangible progress and accountability as reasons to keep focusing. | Consider connecting completed focus sessions to the existing room later. Keep collecting optional and completion quick. |
| Be Focused | Configurable work and break lengths, optional automatic transitions, accessible timer controls. | Sarahs1972 (2021) specifically likes manually starting breaks and a timer that keeps running through other phone activities. Elen Khachatryan (2020) praises the uncluttered interface. | Preserve explicit Start/Pause and duration controls. Let users choose when to begin a break. |
| Focus To-Do | Associate the timer with tasks and projects; summarize time spent. | Starfire11lily (2020) likes seeing where time went and feeling proud of completed work. Practigal (2019) values configurable timers and an intuitive interface. | An optional intention and a small daily focus total are more appropriate than adding another task manager. |
| Session | Set an intention, focus, rest, and optionally reflect. | schrutefarms9000 (2025) praises custom intervals, finishing slightly late, analytics, notes, and the breath before a session. | Consider a short optional breathing transition and a skippable reflection. Avoid forcing an abrupt stop or a journal form. |
| TIDE | Pair countdown/open-ended focus sessions with nature sounds and breathing. | baconisova (2020) misses quick access to focus and wants control over when audio starts. | Reuse existing audio capabilities if added later; default to user-controlled sound. |
| Opal | Block selected distracting apps, schedule blocks, and offer stronger commitment modes. | Public community discussions describe using strict scheduled blocks to maintain time away from distracting apps. | Treat blocking as a separate, optional native capability, after validating demand. |

Sources: [Forest listing and reviews](https://apps.apple.com/us/app/forest-focus-for-productivity/id866450515),
[Be Focused listing and reviews](https://apps.apple.com/us/app/be-focused-focus-timer/id973130201),
[Focus To-Do listing and reviews](https://apps.apple.com/us/app/focus-to-do-focus-timer-tasks/id966057213),
[Session listing and reviews](https://apps.apple.com/us/app/session-pomodoro-focus-timer/id1521432881),
[TIDE listing and reviews](https://apps.apple.com/us/app/tide-sleep-focus-meditation/id1077776989),
[Opal listing](https://apps.apple.com/us/app/opal-screen-time-control/id1497465230),
[Opal community setups](https://community.opalapp.com/t/how-do-you-set-up-your-app-groups-how-do-you-set-your-schedule/440).

## The clearest recent complaint: extra taps

An August 19, 2026 Forest discussion objects to changing session completion
from one tap to three. September 7 commenters likewise describe reward,
continue, and home screens as overhead, even when they like the new artwork.
A September 8 discussion also misses setting duration directly on the clock.
These are self-selected communities, but the concrete interaction complaints
are useful design evidence.

Sources: [August completion discussion](https://www.reddit.com/r/forestapp/comments/1vsr4ui/redesign_rant/),
[September interface discussion](https://www.reddit.com/r/forestapp/comments/1w9lnkk/new_ui/),
[September timer controls discussion](https://www.reddit.com/r/forestapp/comments/1wai7cp/switching_back_to_old_ui/).

## Recommended direction

The following is product judgment based on the research, not a claim that
these choices have been tested with Azora users.

1. First release: Explore entry, the existing routine timer visuals and timing
   behavior, a 25-minute starting duration, explicit Start, duration adjustment,
   Pause/Resume, background deadline tracking and permission-dependent alerts,
   and a clear finish. Standalone focus must not complete routine goals or award
   routine coins. Verify background behavior on a release device before shipping.
2. Next: convenient duration presets and remembering the last duration, then a
   user-started break with an optional short breathing exercise.
3. Later, after demand is clear: optional intention, daily minutes and sessions,
   quiet background sounds, and lock-screen visibility.
4. Keep optional: room rewards, reflection, and strict distraction blocking.
   Avoid mandatory reward-claim screens, elaborate setup, and punishment for
   ordinary interruptions.

Success should mean less effort to begin and return to work. Validate by
observing time to start, repeated session use, completion-to-next-session
friction, and whether people choose breathing breaks. These measurements are
recommendations; no new analytics collection is implied by this document.
