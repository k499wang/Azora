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

  DailyPlanStarted: 'daily_plan_started',
  DailyBreathHoldStarted: 'daily_breath_hold_started',
  DailyBreathHoldReleased: 'daily_breath_hold_released',
  DailyResultsViewed: 'daily_results_viewed',

  RecentlyLoggedViewed: 'recently_logged_viewed',
  RecentlyLoggedSessionOpened: 'recently_logged_session_opened',

  BreathingTechniqueSelected: 'breathing_technique_selected',

  ExerciseSessionStarted: 'exercise_session_started',
  ExerciseSessionCompleted: 'exercise_session_completed',
  ExerciseSessionPaused: 'exercise_session_paused',
  ExerciseSessionAbandoned: 'exercise_session_abandoned',

  HeartRateMonitoringToggled: 'heart_rate_monitoring_toggled',
  HeartRateCaptureStarted: 'heart_rate_capture_started',
  HeartRateCaptureCompleted: 'heart_rate_capture_completed',
  HeartRateCaptureFailed: 'heart_rate_capture_failed',
  HeartRateResultAction: 'heart_rate_result_action',
  PaywallViewed: 'paywall_viewed',
  PaywallPurchaseStarted: 'paywall_purchase_started',
  PaywallPurchaseCompleted: 'paywall_purchase_completed',
  PaywallPurchaseCancelled: 'paywall_purchase_cancelled',
  PaywallRestoreStarted: 'paywall_restore_started',
  PaywallRestoreCompleted: 'paywall_restore_completed',
  PaywallDismissed: 'paywall_dismissed',
  PaywallFailed: 'paywall_failed',
  ProfileAction: 'profile_action',
} as const;

export type AnalyticsEventName =
  typeof AnalyticsEvent[keyof typeof AnalyticsEvent];
