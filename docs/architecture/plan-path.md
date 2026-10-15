# Plan path

`InsightsScreen` supplies the calendar, completion dates, and live
entitlement. `PlanPath` draws completed checkmarks, gold days, available days,
and trails directly from those inputs. Completion and unlock states have no
animation sequence, replay record, sound cue, automatic scroll, or interaction
hold.

Trails are evenly spaced dots on the straight line between coin rims
(`domain/pathTrail.ts`): blue up to the furthest reached node, gold between two
gold coins, grey beyond.
Each dot is a static, absolutely positioned React Native view. The finite week's
fixed rows determine its position and color from one measured path width,
without per-node callbacks, a canvas surface, or redraw work on focus.
`domain/pathLayout.ts` shares coin sizes, gaps, margins, and hex proportions with
the rendered rows so the complete road is available in one render. The trail passes touches through and stays hidden from
accessibility.

Today's available coin keeps its idle hop, and tokens keep their press feedback.
The hop stops on blur, background, and unmount and respects reduced motion.
Each day has a compact day number and an authored lesson title beside its coin,
including future and locked days. `programDayLesson` reads the exact lesson
from the enrollment's resolved snapshot, preserving its revision and pressure
track. `planLessonTitle` supplies short topic titles for the lesson catalogue;
the full lesson copy stays unchanged. `dayCoinIcon` assigns a distinct decorative
motif to each day of the current plans. Available days show their motif;
completed days show a checkmark and locked days show a lock as the coin's icon.
Future detail cards keep their unlock timing and week purpose.
Today's label uses the week's ink color, while future and locked labels are
muted. Room hexagons show their week and a short room status. Labels sit on the
open side of the zigzag, use the measured path width, and cap names at two lines.
They do not participate in token sizing, trail measurement, or tap handling.
The path has one initial layout state: its root width. A positive-size native
root layout draws all coins and dots together and reports that it has drawn.
There is no opaque cover, reveal animation, or barrier waiting for individual
node or banner measurements, so a missing child callback cannot hide the road. Initial query loading has a visible loading message. Cached data
keeps the path mounted through background refreshes, and missing completion
dates fail soft to ordinary completed coins. Live entitlement still controls
locks and actions. A new enrollment remounts the path, even for the same plan.

The title and week card share one pinned header in normal native layout, above
the flex scroll view. The initial stat pills, week card and path share the
path's existing query readiness; loading stays visible and cached refreshes
keep them mounted. A fixed width for the stat group keeps the title from rewrapping as
score and streak values arrive. `TopBarWeekBanner` reserves the tallest week's
height on the first native layout: unseen full-width cards form a horizontal
row, with the active card filling the same box. No sizing callbacks position
the card or the path. `PlanPath` reports each week's top in scroll content
coordinates; the banner switches weeks as those starts pass the viewport's top.
The header's measured bottom is used only for window-coordinate today controls
and detail-card placement. Loading, errors and the path remain visible if a
native sizing callback is delayed or missing, including when the tab is frozen
and restored. The initial stat pills, week card and path mount together once
the existing enrollment, entitlement and completion-date reads settle; cached
background refreshes keep them mounted.

The floating controls share one measured placement: `pending`, `on-screen`,
`up`, or `down`. Pending shows neither control, on-screen shows Start, and an
off-screen node shows the arrow. The original Start fade and arrow zoom
animations are preserved; readiness prevents showing the wrong control first.
Native node layout, content size, and viewport
changes request a measurement; an initial missing or zero-sized callback gets
at most two frame retries. Generation checks discard callbacks and UI messages
from detached or replaced nodes. Scrolling follows the measured anchor on the
UI thread without measuring every frame.

Tapping a coin can still scroll its detail card into view. Initial native card
measurement has a deadline and rejects zero or nonfinite rectangles. New taps,
closing, and unmounting abort a pending opening, so late results cannot reopen
a stale card.

`PlanLabScreen` previews plain and gold completions, available days across week
boundaries, locked weeks, and delayed completion-date loading. Regression checks
in `PlanPath.animations.test.mjs`, `PlanWeekBanner.test.mjs`, `useTodayJump.test.mjs`, and
`InsightsScreen.loading.test.mjs` plus pure `domain/pathLayout.test.mjs` cover
layout, initial loading, control placement,
canonical coin state, and idle animation cleanup. These checks use native stubs;
device frame timing still requires release validation.
