# Current PostHog Events

This document lists the events currently emitted by the app's PostHog integration.

It is based on the actual `posthog.capture(...)` calls in the codebase.

## Global Events

- `app_opened`
- `screen_view`
- `$exception`

## Heart Rate Capture

- `heart_rate_capture_started`
- `heart_rate_capture_completed`
- `heart_rate_capture_failed`
- `heart_rate_capture_retried`

### Heart Rate Capture Properties

`heart_rate_capture_started`

- `context`

`heart_rate_capture_completed`

- `bpm`
- `confidence`
- `duration_ms`
- `sample_count`
- `rmssd_ms`
- `sdnn_ms`
- `hrv_availability_reason`
- `context`

`heart_rate_capture_failed`

- `error_type`
- `context`

`heart_rate_capture_retried`

- `previous_result`
- `error_type` when the previous result was a failure
- `context`

## Breathing Exercise Discovery

- `breathing_technique_selected`
- `daily_plan_started`

### Breathing Exercise Properties

`breathing_technique_selected`

- `technique_id`
- `technique_name`
- `technique_category`
- `pattern`

`daily_plan_started`

- `streak_days`

This event fires from Home's Today’s Dailies breath-hold action and Explore's
Daily Breathhold card.

## Daily Breath Hold

- `daily_breath_hold_started`
- `daily_breath_hold_released`
- `daily_results_viewed`
- `dailies_completed`

### Daily Breath Hold Properties

`daily_breath_hold_released`

- `hold_seconds`
- `best_hold_seconds`

`daily_results_viewed`

- `hold_seconds`
- `best_hold_seconds`

`dailies_completed`

- `is_pro` — `true` / `false` after entitlement resolves; `null` if the lookup failed
- `streak_days`
- `room_piece_earned` — whether the completion also earned a room decoration
- `floor`

All three dailies done, fired once per local date from whichever result screen
carries the third one. Deliberately separate from `room_reward_unlocked`: a full
room, or one already claimed today, completes the dailies and earns nothing, so
the room event alone would miss exactly the users who have been at this longest.

The once-per-date guard is persisted in an authenticated-user-scoped
`AsyncStorage` key. Its read-modify-write is serialized, so simultaneous result
effects cannot lose a claim and accounts on the same device cannot suppress one
another's events. Storage work is detached from the result UI.

Emitted from
[src/features/room/useTrackDailyCompletion.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/features/room/useTrackDailyCompletion.ts).

## Exercise Session

- `exercise_session_started`
- `exercise_session_paused`
- `exercise_session_completed`
- `exercise_session_abandoned`
- `heart_rate_monitoring_toggled`

### Exercise Session Properties

`exercise_session_started`

- `technique_id`
- `technique_name`
- `technique_category`
- `total_rounds`
- `hr_monitoring_enabled`

`exercise_session_paused`

- `technique_id`
- `technique_name`
- `round`
- `total_rounds`
- `elapsed_seconds`

`exercise_session_completed`

- `technique_id`
- `technique_name`
- `technique_category`
- `total_rounds`
- `elapsed_seconds`
- `hr_monitoring_enabled`

`exercise_session_abandoned`

- `technique_id`
- `technique_name`
- `round`
- `total_rounds`
- `elapsed_seconds`

`heart_rate_monitoring_toggled`

- `enabled`
- `technique_id`
- `technique_name`

## Room and Hotel

- `room_reward_unlocked`
- `room_picker_opened`
- `room_decoration_placed`
- `room_completed`
- `room_started`

These five are the room loop as a funnel, in order. `room_reward_unlocked` is
the *earn* and `room_decoration_placed` is the *placement*: they are separate
events because a user who is handed a piece and never places it is the loop's
most interesting failure, and one event cannot describe both ends of it.

`is_pro` rides on every one of them. It is resolved from the canonical shared
entitlement query without delaying the room action or mutation. A failed lookup
is recorded as `null`, never guessed to mean non-Pro.

The dev lab (`RoomLabScreen`) fabricates a room and short-circuits before the
mutations, so previews never reach these events.

Room screens themselves are covered by `screen_view` — `RoomDecorate`,
`RoomComplete`, `NextRoom`, `Hotel` — so there are no separate view events.

### Room and Hotel Properties

Shared by all five:

- `is_pro` — `true` / `false`, or `null` when entitlement resolution failed
- `floor` — position in the hotel; 1 is the ground floor

`room_reward_unlocked`

- `slot` — the slot the earned piece will fill, `day1`..`day7`
- `placed_count` — pieces already in the room, 0..6

`room_picker_opened`

- `slot`
- `placed_count`

`room_decoration_placed`

- `slot`
- `option_id` — which object, e.g. `checker_rug`
- `placed_count` — pieces in the room *after* this one, 1..7
- `completes_room`

`room_completed`

- no properties beyond the shared two

`room_started`

- `shell`
- `frame_hue`

Emitted from:

- [src/services/analytics/room.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/analytics/room.ts)
- [src/features/room/useTrackDailyCompletion.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/features/room/useTrackDailyCompletion.ts)
- [src/queries/room/usePlaceDecorationMutation.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/queries/room/usePlaceDecorationMutation.ts)
- [src/queries/room/useCreateNextRoomMutation.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/queries/room/useCreateNextRoomMutation.ts)
- [src/screens/RoomDecorateScreen.tsx](/Users/k3vinwvng/Documents/Azora/Azora/src/screens/RoomDecorateScreen.tsx)

See [room-loop-activation.md](/Users/k3vinwvng/Documents/Azora/Azora/docs/analytics/room-loop-activation.md)
for what these events are meant to measure.

## Recently Logged

- `recently_logged_viewed`
- `recently_logged_session_opened`

### Recently Logged Properties

`recently_logged_viewed`

- `item_count`
- `has_error`

`recently_logged_session_opened`

- `session_id`
- `position`
- `item_count`

## Paywall

- `paywall_viewed`
- `paywall_package_selected`
- `paywall_purchase_started`
- `paywall_purchase_completed`
- `paywall_purchase_cancelled`
- `paywall_restore_started`
- `paywall_restore_completed`
- `paywall_dismissed`
- `paywall_failed`

### Paywall Shared Properties

These properties are emitted through the shared paywall event builder when
available:

- `placement`
- `feature`
- `source_screen`
- `source_action`
- `paywall_view_id`
- `offering_id`
- `experiment_id`
- `experiment_variant`
- `weekly_product_id`
- `weekly_price`
- `weekly_price_cents`
- `annual_product_id`
- `annual_price`
- `annual_price_cents`
- `currency`
- `has_trial`

### Paywall Event-Specific Properties

`paywall_package_selected`

- `selected_package_id`

`paywall_purchase_started`

- `package_type`
- `selected_package_id`

`paywall_purchase_completed`

- `package_type`
- `selected_package_id`
- `is_pro`

`paywall_purchase_cancelled`

- `package_type`
- `selected_package_id`
- `cancel_reason`

`paywall_restore_completed`

- `is_pro`

`paywall_failed`

- `stage`
- `error_code`
- `error_message`

## Exit Offer

- `exit_offer_shown`
- `exit_offer_accepted`
- `exit_offer_declined`

The discounted counter-offer already emits the full `paywall_*` set under
`placement: exit_discount`, so these three exist only for what those cannot say:
which exit intent summoned the offer, and how it was refused.

### Exit Offer Properties

All three carry the shared paywall properties (placement, offering, both price
points, experiment variant) plus:

- `trigger` — `idle` | `purchase_cancelled` | `post_onboarding`

`exit_offer_accepted`

- `outcome` — `purchased` | `restored`

`exit_offer_declined`

- `decline_method` — `button` (the explicit control) | `system_close` (back
  gesture or hardware back, through the confirm dialog)

`exit_offer_shown` is emitted once only after the offering and paywall view ID
are ready, so its shared price, experiment, and view properties are complete.
Accept and decline behavior never waits on analytics; if a user can dismiss
before metadata is ready, the new `exit_offer_declined` event is skipped while
the existing paywall dismissal still runs.

The three triggers are not the same user. `purchase_cancelled` backed out of the
store sheet with a thumb on the button; `idle` may only have been reading;
`post_onboarding` already declined once and meets the offer over Home. The
offer is identical for all three, which is a decision worth being able to check.

Emitted from:

- [src/services/analytics/exitOffer.ts](/Users/k3vinwvng/Documents/Azora/Azora/src/services/analytics/exitOffer.ts)
- [src/components/paywall/ExitOfferSheet.tsx](/Users/k3vinwvng/Documents/Azora/Azora/src/components/paywall/ExitOfferSheet.tsx) — the two in-onboarding triggers
- [src/screens/ExitOfferScreen.tsx](/Users/k3vinwvng/Documents/Azora/Azora/src/screens/ExitOfferScreen.tsx) — the queued post-onboarding one

## Feature Gates

- `feature_gate_hit`

### Feature Gate Properties

`feature_gate_hit`

- `feature`
- `placement`
- `source_screen`
- `source_action`
- `reason`
- `used`
- `limit`
- `is_pro`

## Profile

- `profile_action`

### Profile Properties

`profile_action`

- `action`
- `error_message` on sign-out failure

## Automatic PostHog Capture

The app also has provider-level automatic capture enabled for:

- touch events
- app lifecycle events

See:

- [App.tsx](/Users/k3vinwvng/Documents/Azora/Azora/App.tsx)

Screen autocapture is currently disabled, so screen views are only tracked through the manual `screen_view` event.

## Notes

- The app only sends these events when PostHog is configured with a project token and host.
- This list should be updated when new `posthog.capture(...)` calls are added.
- `$exception` is used for caught exceptions in critical flows like heart-rate setup and exercise heart-rate toggling.


 1. App launches → bootstrapAnalytics() registers super props.          
  2. User lands on auth screen → any events here go to a throwaway
  PostHog anon ID (you don't care about these).                          
  3. User signs in → onUserSignedIn() → events now attributed to user.id,
   signup_date set on first sign-in.                                     
  4. User uses the app → every event has app_version, platform,
  os_version, is attributed to user.id.                                  
  5. User signs out → onUserSignedOut() → clean slate for the next user
  on this device.       
