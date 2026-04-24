export const AnalyticsEvent = {
  AppOpened: 'app_opened',
  ScreenView: 'screen_view',
} as const;

export type AnalyticsEventName =
  typeof AnalyticsEvent[keyof typeof AnalyticsEvent];

