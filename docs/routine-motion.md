# Routine motion

`PlanScreen` owns completion celebrations and a fixed coin pool. `TodoListSection`
owns the task list, optimistic completion feedback, and grouped filing. Its
visual state is keyed by account and selected date.

- A synchronous per-goal guard rejects duplicate activations before React's
  pending observer updates. Different goals can save concurrently; each pending
  checkbox remains disabled until its own request settles.
- Completion/rollback retain the cached order and untouched row references.
  The list reuses its current plan instead of sorting it twice; pending-row
  checks share one set rather than scanning the pending list for every card.
- A new completion postpones the entire group's slot collapse. Cards already
  fading finish fading in place; their empty slots stay occupied until the
  final tap settles, so the next card never moves under the finger.
- Failed writes roll back their own row. Server reconciliation waits for the
  remaining completion writes before replacing the current list and wallet.
- Coin flights use at most 24 prebuilt views. Occupied slots finish their flight;
  saturation reduces decorative coins without queuing launches. Measurement
  callbacks from a previous visibility interval are ignored.
  Fully occupied pools skip native measurements on further launches.
- Confetti uses two prebuilt canvases. Further taps update the confirmation while
  occupied canvases finish, rather than restarting falling particles.
- Closed completed drawers release their row views after closing. Their clipped
  contents are hidden from accessibility navigation while closed.
- Blur/background clears filing timers, stops coin flights and counting, closes
  the drawer, and resets celebrations. Unmount cancels owned completion motion.
  Reduced motion suppresses decorative flight, pulse, and resizing animations.

## First load

- Cached task data remains visible during background refreshes. The initial
  placeholders wait for both task data and the saved order, avoiding a later
  reorder immediately after the cards appear.
- Row measurements commit once per animation frame. Equal measurements and
  stale events from removed rows do not publish another layout state; unmount
  cancels a queued flush.
- The calendar first renders the current week's seven cells. After its width is
  known, the paged calendar mounts at the current week's native offset, rather
  than first showing an older week and jumping forward.
- Coin SVG preparation waits for idle time with a 600 ms deadline, is cancelled
  on blur, and happens once. Reduced motion avoids building that pool and uses
  static loading placeholders. Early taps still complete the task normally.

## Release verification

Automated timer and cache tests verify logic, not frame pacing or native touch
arbitration. Before shipping, run 5–10 complete cycles on iOS and Android release
builds, including a slower device:

1. Tick several different tasks rapidly, then double-tap one pending checkbox.
   Expect one write/reward per accepted completion and stable unticked slots.
2. Tick another task as the previous group begins fading. Expect the group to
   keep its slots until the new hold ends, then one coordinated resize. Cards
   already fading should finish without flashing back into view.
3. Open/close the completed drawer rapidly; add or undo a task while it is open.
   Check wrapped titles, clipping, touch targets, and the scroll position near
   the bottom of the page.
4. Fail one request while another saves slowly. Only the failed row rolls back;
   the other tick stays visible and the final wallet matches the server.
5. Finish the last task, undo while completion motion is still visible, and add
   a task from the all-done state. Check for overlapping cards or stale flashes.
6. Switch dates, tabs, background/foreground, and leave during a delayed first
   win. Old-date state must not appear on the newly selected day, and hidden
   screens must not produce coin haptics or resume old decorative flights.
7. Repeat with reduced motion and VoiceOver/TalkBack. Closed drawer rows should
   not be focusable; pending checkboxes should announce their disabled state.

Profile frame pacing and mount cost with realistic and unusually large routine
lists. The existing draggable list still eagerly mounts active task cards;
these changes do not establish a measured maximum list size or guarantee a
particular frame rate.


## Confirmation and coin reliability

The Nice work confirmation owns its dismissal timer from the imperative
`confirm` event, rather than waiting for a later React commit to install an
effect. A newer confirmation replaces the deadline; a generation guard rejects
stale queued callbacks. Blur, backgrounding, inactivity, and unmount clear the
deadline and hide the toast.

A loaded coin balance still updates optimistically on a tick. After the final
pending to-do toggle for the user settles, the wallet refreshes in the
background, because the completion response does not contain the canonical
ledger. This also recovers ticks made before the wallet finishes loading.
Failures remove only their own temporary ledger entry and reconcile the goals
cache after pending writes settle. The animation and toast never own the saved
coin balance.

Runtime tests cover delayed React commits, rapid confirmations, stale timer
callbacks, cold wallet caches, concurrent ticks, rollback, and reconciliation
across list owners. Native-device verification is still required for frame
performance and the full interaction.
