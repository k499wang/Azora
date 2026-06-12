import PostHog from 'posthog-react-native'
import Constants from 'expo-constants'

const apiKey = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined
const isPostHogConfigured = Boolean(apiKey)

export const posthog = new PostHog(apiKey ?? 'placeholder_key', {
  host,
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
  errorTracking: {
    autocapture: {
      uncaughtExceptions: true,
      unhandledRejections: true,
      console: ['error'],
    },
  },
  enableSessionReplay: isPostHogConfigured,
  enablePersistSessionIdAcrossRestart: true,
  sessionReplayConfig: {
    maskAllTextInputs: true,
    maskAllImages: true,
    maskAllSandboxedViews: true,
    captureLog: true,
    captureNetworkTelemetry: true,
    androidDebouncerDelayMs: 1000,
    iOSdebouncerDelayMs: 1000,
  },
})

if (__DEV__) {
  posthog.debug(true)
}
