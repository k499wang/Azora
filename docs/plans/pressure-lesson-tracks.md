# Pressure lesson tracks

Pressure revision 3 introduced lesson tracks. New revision 4 enrollments keep
those tracks and replace retrospective practice reviews with teaching. The primary
onboarding intent:

| Intent | Track | Lesson purpose |
| --- | --- | --- |
| `stress_relief` | stress | Notice demands, choose a manageable step, and ask for help. |
| `calm_fast` | overthinking | Notice repeated worries, distinguish facts, and choose an available action. |
| `emotional_balance` | anger | Notice irritation, pause before responding, and repair after reacting. |
| Other or missing intent | stress | Broad support for feeling under pressure. |

The visible emotional-balance option is “I get irritated and snap too easily”.
The previous “I can’t keep up with myself” title remains a lookup alias for
saved profiles.

All three tracks share the existing 56-day reset schedule. Breathing lasts one
or two minutes. Day 3 introduces 5-4-3-2-1, day 6 introduces Muscle Release,
and day 8 explains the regular two-reset schedule. Tool lessons use the same
instructions, with examples and actions matched to each track's purpose.

The development-only Lesson Lab lists Stress, Overthinking, and Irritation /
anger separately, each with its complete 56-day lesson sequence. Choosing a
preview does not change an enrollment or count toward progress.

Onboarding passes the track when starting a plan. Insights uses the saved
primary goal when starting or restarting. The enrollment resolver (version 3)
stores the chosen lesson IDs and purpose copy in the existing resolved days.
Running plans read those stored days rather than recalculating from a profile.

Pressure revisions 1 and 2 retain their original lesson sequence, including
fallbacks for older snapshots without lesson IDs. Revision 3 retains all three
previous lesson tracks, including its review lessons. Historical preset definitions
and lesson IDs remain available. No database migration or contract change is
required. New lesson IDs follow the existing lowercase `subject.name` format.

New lesson paths teach attention during breathing on day 4 and comfortable
breathing effort on day 7, rather than asking about previous practice. The
muscle-release introductions start with the instructions instead of a review.
Other review slots teach removing starting friction, preparing an action, and
planning the next practice. No reset schedule changes are involved.
The lesson player also skips its automatic previous-action review card for
these editions; historical editions retain it. Starting a plan retries a failed
saved-goal read before assigning a track, rather than treating a read error as
an unspecified goal. A successfully loaded missing goal still defaults to stress.

Domain tests cover all three sequences, reset pairing, goal mapping, frozen
enrollments, and historical fallback. Onboarding tests cover plan creation.
Service tests cover all 11 current lesson paths through insert and decoded
snapshot round trips. Reset progression tests walk each full schedule, including
reloads, skipped calendar days, duplicate advancement, and a fresh restart.
These tests exercise client rules and mocked persistence; live PostgreSQL
trigger verification and device testing remain separate verification steps.
