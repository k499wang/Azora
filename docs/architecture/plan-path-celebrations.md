# Plan path celebrations

`InsightsScreen` supplies the calendar, settled completion dates, entitlement,
and the persisted per-enrollment `PathSeen` record. `PlanPath` waits for node and
banner layout, then completes its initial reveal before activating celebrations.

`usePathCelebration` owns the sequence and visibility lifecycle. It reveals the
stamp coin first and the waking coin separately, including across week dividers.
Each reveal waits for a stable position. A failed reveal gets three attempts;
after that the path draws its canonical state and keeps the unseen celebration
for the next visit. Retries and pending phases stop on blur, background, or
unmount, including when React rendering is frozen.

The visuals own phase duration. A celebrating coin's `AnimatedCoinPulse` or a
fresh keyed `DrawingTrail` reports its start and finish from Reanimated's UI
callbacks. The hook plays sound/haptics on the start acknowledgment and advances
only after the finish acknowledgment. Do not reintroduce a timer that starts
when React state is requested: a slow render would consume the animation's time.
Only the current animated coin owns finite animation listeners; static coins do
not instantiate that owner. Skia renders canvas children in a separate React
root, so `PathTrail` bridges the screen's navigation context into its drawing
owner. Keep that bridge: otherwise a frozen trail cannot observe route blur.

Callbacks close over the exact `PathCelebrationShow` instance for their phase.
The hook rejects callbacks from cancelled or replaced phases. A stamp or wake is
saved as seen only after its animation finishes. An interrupted phase can play
again; an already finished phase cannot. First visits and reduced motion seed the
record quietly. Audio readiness has a one-second deadline, and timed sounds skip
unready playback rather than queue a late cue.

Regression coverage lives in `usePathCelebration.test.mjs`,
`PlanPath.animations.test.mjs`, and `PlanPath.test.mjs`. It covers deferred
rendering, phase acknowledgments, failed reveals, week boundaries, fresh trail
progress, stale callbacks, and repeated focus/completion cycles. These tests use
native animation and layout stubs; they do not establish device frame timing.

For release validation, repeat 5–10 cycles using normal and gold completions,
next-day unlocking within a week and across a divider, and cold loading. Interrupt
the entrance, scroll, rise, trail, and pop by leaving or backgrounding the app.
Check that sounds align with the visible movement, each animated coin is on
screen, interrupted work resumes without repeating finished work, and no owned
animation, timer, or subscription continues while inactive.
