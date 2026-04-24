export const AnalyticsEvent = {
  AppOpened: 'app_opened',
  ScreenView: 'screen_view',

  DailyPlanStarted: 'daily_plan_started',
  DailyBreathHoldStarted: 'daily_breath_hold_started',
  DailyBreathHoldReleased: 'daily_breath_hold_released',
  DailyResultsViewed: 'daily_results_viewed',

  BreathingTechniqueSelected: 'breathing_technique_selected',

  ExerciseSessionStarted: 'exercise_session_started',
  ExerciseSessionCompleted: 'exercise_session_completed',
  ExerciseSessionPaused: 'exercise_session_paused',
  ExerciseSessionAbandoned: 'exercise_session_abandoned',

  HeartRateMonitoringToggled: 'heart_rate_monitoring_toggled',
  HeartRateCaptureStarted: 'heart_rate_capture_started',
  HeartRateCaptureCompleted: 'heart_rate_capture_completed',
  HeartRateCaptureFailed: 'heart_rate_capture_failed',
  HeartRateCaptureRetried: 'heart_rate_capture_retried',
} as const;

export type AnalyticsEventName =
  typeof AnalyticsEvent[keyof typeof AnalyticsEvent];
