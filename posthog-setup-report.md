<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Azora breathing app. The integration adds the `posthog-react-native` SDK, wires it into `App.tsx` via `PostHogProvider`, and instruments 14 events across 6 files covering every key user action: breathing exercise sessions, daily breath holds, heart rate capture, and technique discovery. Environment variables are stored in `.env` and injected at build time through `app.config.js` using `expo-constants`. TypeScript passes with no errors.

| Event | Description | File |
|---|---|---|
| `breathing_technique_selected` | User taps a technique card in the breathing library | `src/components/home/BreathingLibrary.tsx` |
| `daily_plan_started` | User taps the daily plan card to begin the breath hold exercise | `src/components/home/DailyPlanCard.tsx` |
| `exercise_session_started` | User starts a breathing technique session | `src/screens/ExerciseSessionPage.tsx` |
| `exercise_session_paused` | User pauses an in-progress breathing session | `src/screens/ExerciseSessionPage.tsx` |
| `exercise_session_completed` | All rounds completed successfully | `src/screens/ExerciseSessionPage.tsx` |
| `exercise_session_abandoned` | User closes the session before completion | `src/screens/ExerciseSessionPage.tsx` |
| `heart_rate_monitoring_toggled` | User toggles real-time HR monitoring during a session | `src/screens/ExerciseSessionPage.tsx` |
| `daily_breath_hold_started` | User begins the daily breath hold inhale phase | `src/screens/DailyExercisePage.tsx` |
| `daily_breath_hold_released` | User releases the hold; records hold duration | `src/screens/DailyExercisePage.tsx` |
| `daily_results_viewed` | User navigates to the shareable result screen | `src/screens/DailyExercisePage.tsx` |
| `heart_rate_capture_started` | Heart rate camera capture session initiated | `src/components/heartRate/HeartRateCaptureFlow.tsx` |
| `heart_rate_capture_completed` | Measurement succeeded; records bpm, confidence, rmssd, sdnn | `src/components/heartRate/ResultScreen.tsx` |
| `heart_rate_capture_failed` | Measurement failed; records error type | `src/components/heartRate/ResultScreen.tsx` |
| `heart_rate_capture_retried` | User retries after a result (success or failure) | `src/components/heartRate/ResultScreen.tsx` |
| `recently_logged_viewed` | Home "Recently logged" section becomes visible after stats load | `src/screens/HomeScreen.tsx` |
| `recently_logged_session_opened` | User taps a recent heart-rate session card to open its detail | `src/screens/HomeScreen.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/395052/dashboard/1504647
- **Exercise Session Completion Rate** (funnel): https://us.posthog.com/project/395052/insights/NE6qRQqD
- **Heart Rate Capture Funnel**: https://us.posthog.com/project/395052/insights/Uj1AYoPK
- **Most Popular Breathing Techniques**: https://us.posthog.com/project/395052/insights/Lyt32gvB
- **Daily Breath Hold Duration Trend**: https://us.posthog.com/project/395052/insights/aSFmGNpQ
- **Heart Rate Capture Error Types**: https://us.posthog.com/project/395052/insights/KQtd1HSB

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-expo/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
