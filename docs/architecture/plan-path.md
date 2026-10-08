# Plan path

`InsightsScreen` supplies the calendar, settled completion dates, and live
entitlement. `PlanPath` draws completed checkmarks, gold days, available days,
and trails directly from those inputs. Completion and unlock states have no
animation sequence, replay record, sound cue, automatic scroll, or interaction
hold.

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
The path's initial reveal and pinned week banner share layout and visibility
state; tapping a coin can still scroll its detail card into view.

`PlanLabScreen` previews plain and gold completions, available days across week
boundaries, locked weeks, and delayed completion-date loading. Regression checks
in `PlanPath.test.mjs` and `PlanPath.animations.test.mjs` cover layout, entrance,
canonical coin state, and idle animation cleanup. These checks use native stubs;
device frame timing still requires release validation.
