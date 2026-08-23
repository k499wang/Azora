// Property naming convention:
// - Reserved keys (prefix `$`) are PostHog-owned — don't collide with them.
// - App-defined keys use snake_case with an `app_` prefix only when they would
//   otherwise shadow a PostHog reserved key (e.g. `app_screen_name`).
// - Use `null` for missing values, never `undefined`.
export const AnalyticsEvent = {
  AppOpened: 'app_opened',
  AppForegrounded: 'app_foregrounded',
  SessionEnded: 'session_ended',
  ScreenView: 'screen_view',

  OnboardingStarted: 'onboarding_started',
  OnboardingStepViewed: 'onboarding_step_viewed',
  OnboardingStepCompleted: 'onboarding_step_completed',
  OnboardingStepSkipped: 'onboarding_step_skipped',
  OnboardingBackPressed: 'onboarding_back_pressed',
  OnboardingIntentUpdated: 'onboarding_intent_updated',
  OnboardingAttributionAnswered: 'onboarding_attribution_answered',
  OnboardingProfileSaveStarted: 'onboarding_profile_save_started',
  OnboardingProfileSaveSucceeded: 'onboarding_profile_save_succeeded',
  OnboardingProfileSaveFailed: 'onboarding_profile_save_failed',
  OnboardingCompleted: 'onboarding_completed',

  DailyPlanStarted: 'daily_plan_started',
  DailyBreathHoldStarted: 'daily_breath_hold_started',
  DailyBreathHoldReleased: 'daily_breath_hold_released',
  DailyResultsViewed: 'daily_results_viewed',
  // All three dailies done. Distinct from `room_reward_unlocked`, which only
  // fires when a piece is actually claimable — a full room, or one already
  // claimed today, completes the dailies and earns nothing.
  DailiesCompleted: 'dailies_completed',

  // The room loop. `room_reward_unlocked` is the earn, not the placement: the
  // gap between the two is where a user who was handed a piece walks away
  // without using it, and only a separate event can show that.
  RoomRewardUnlocked: 'room_reward_unlocked',
  RoomPickerOpened: 'room_picker_opened',
  RoomDecorationPlaced: 'room_decoration_placed',
  RoomCompleted: 'room_completed',
  RoomStarted: 'room_started',

  RecentlyLoggedViewed: 'recently_logged_viewed',
  RecentlyLoggedSessionOpened: 'recently_logged_session_opened',

  BreathingTechniqueSelected: 'breathing_technique_selected',

  ExerciseSessionStarted: 'exercise_session_started',
  ExerciseSessionCompleted: 'exercise_session_completed',
  ExerciseSessionPaused: 'exercise_session_paused',
  ExerciseSessionAbandoned: 'exercise_session_abandoned',
  PostSessionMoodLogged: 'post_session_mood_logged',

  HeartRateMonitoringToggled: 'heart_rate_monitoring_toggled',
  HeartRateCaptureStarted: 'heart_rate_capture_started',
  HeartRateCaptureCompleted: 'heart_rate_capture_completed',
  HeartRateCaptureFailed: 'heart_rate_capture_failed',
  HeartRateCaptureHelpShown: 'heart_rate_capture_help_shown',
  HeartRateResultAction: 'heart_rate_result_action',
  PaywallViewed: 'paywall_viewed',
  PaywallPackageSelected: 'paywall_package_selected',
  PaywallPurchaseStarted: 'paywall_purchase_started',
  PaywallPurchaseCompleted: 'paywall_purchase_completed',
  PaywallPurchaseCancelled: 'paywall_purchase_cancelled',
  PaywallRestoreStarted: 'paywall_restore_started',
  PaywallRestoreCompleted: 'paywall_restore_completed',
  PaywallDismissed: 'paywall_dismissed',
  PaywallFailed: 'paywall_failed',
  // The discounted counter-offer. `paywall_*` already fires for it under
  // `placement: exit_discount`; these add what that cannot say — which exit
  // intent summoned it, and how it was refused.
  ExitOfferShown: 'exit_offer_shown',
  ExitOfferAccepted: 'exit_offer_accepted',
  ExitOfferDeclined: 'exit_offer_declined',
  FeatureGateHit: 'feature_gate_hit',
  ProfileAction: 'profile_action',

  ReviewPromptRequested: 'review_prompt_requested',

  NotificationScheduled: 'notification_scheduled',
  NotificationTapped: 'notification_tapped',
  NotificationPermissionResult: 'notification_permission_result',
} as const;

export type AnalyticsEventName =
  typeof AnalyticsEvent[keyof typeof AnalyticsEvent];
