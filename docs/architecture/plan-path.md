# Plan path

`InsightsScreen` supplies the calendar, settled completion dates, and live
entitlement. `PlanPath` draws completed checkmarks, gold days, available days,
and trails directly from those inputs. Completion and unlock states have no
animation sequence, replay record, sound cue, automatic scroll, or interaction
hold.

Today's available coin keeps its idle hop, and tokens keep their press feedback.
The hop stops on blur, background, and unmount and respects reduced motion.
The path's initial reveal and pinned week banner share layout and visibility
state; tapping a coin can still scroll its detail card into view.

`PlanLabScreen` previews plain and gold completions, available days across week
boundaries, locked weeks, and delayed completion-date loading. Regression checks
in `PlanPath.test.mjs` and `PlanPath.animations.test.mjs` cover layout, entrance,
canonical coin state, and idle animation cleanup. These checks use native stubs;
device frame timing still requires release validation.
