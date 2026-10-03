# Daily completion motion audit

Audited `DailyCompleteSheet`, its Home and SessionComplete callers, and the
shared reward presentation on 2026-10-02. These findings are from code review;
device frame timing has not been measured.

## Changes

- Each reward presentation owns fresh `onShow` state. Closing and reopening
  cannot reuse the previous modal's ready state and start the entrance early.
- One UI-thread clock drives the headline's character fades. Characters keep
  their existing geometry, spacing, and easing without individual delayed
  animations or lifecycle effects.
- The celebration's confetti palette has a stable identity, so unrelated
  renders do not rebuild its Skia scene or defeat its memoized boundary.
- Badge and exit animations are cancelled on sheet teardown.

Preserved: a single native modal through the reward handoff, UI-thread flame
transforms, one confetti canvas/clock, reduced-motion behavior, frozen display
state, and live entitlement checks.

## Remaining profiling candidates

- SessionComplete mounts its result chart, statistics, and feedback below an
  opaque cover. Measure the first commit before deferring content: moving that
  mount to dismissal could move the hitch rather than remove it.
- Home's coin/toast celebration work may overlap the final action's reward.
  Inspect this alongside the ongoing routine-motion changes before changing
  ownership or suppressing rewards.
- The flame uses a local image with no extra image transition, but its first
  decode can occur during celebration mounting if no previous flow warmed it.
  Compare cold and warm entrances before adding preloading.

## Release-device verification

1. On a physical device, compare the first entrance with 5–10 complete repeat
   cycles, using both a final Home to-do and a final exercise.
2. Record JS/UI frame timing and native mount cost across the final action,
   modal presentation, character reveal, confetti, and decoration handoff.
   Check against the device's refresh budget (about 16.7ms at 60Hz or 8.3ms
   at 120Hz); do not infer frame rate from a development build.
3. Tap Continue or Choose quickly during the sequence. Confirm no old haptics,
   flame loop, badge animation, or callbacks survive the dismissed sheet.
4. Verify reduced motion, short displays, long titles, and pending entitlement.
   Check stable text layout, live CTA behavior, route depth, and Back behavior.

The presentation regression test checks ownership in source. It does not
exercise native modal timing or prove frame-rate performance.
