import type { IconName } from '../common/icons/Icon';

export type OnboardingStep =
  | 'azoChatInvite'
  | 'azoChat'
  | 'personalizeIntro'
  | 'intent'
  | 'intentPriority'
  | 'usageStyle'
  | 'intentReflection'
  | 'intentDepth1'
  | 'intentDepth2'
  | 'intentDepth3'
  | 'intentDepth4'
  | 'intentDepth5'
  | 'intentDepth6'
  | 'intentDepth7'
  | 'piecesTogether'
  | 'analyzeIntent'
  | 'cbtIntro'
  | 'routineBrain'
  | 'name'
  | 'greeting'
  | 'acquisitionSource'
  | 'attPriming'
  | 'stress'
  | 'overwhelmResponse'
  | 'supportSystem'
  | 'hiddenDrain'
  | 'childhoodStress'
  | 'lifeEvents'
  | 'sleep'
  | 'sleepDuration'
  | 'wakeEase'
  | 'dayEnergy'
  | 'sleepCause'
  | 'analyzeSleep'
  | 'sleepInsight'
  | 'brainFog'
  | 'routineHappiness'
  | 'choresOverwhelm'
  | 'distraction'
  | 'fallingBehind'
  | 'beforeAfter'
  | 'scrollInstead'
  | 'skipSelfCare'
  | 'drainedFrequency'
  | 'untappedPotential'
  | 'doingItFor'
  | 'loseMotivation'
  | 'habitAttempts'
  | 'selfDiscipline'
  | 'putOthersFirst'
  | 'sacrificeForOthers'
  | 'wishUnderstood'
  | 'socialMedia'
  | 'adhdStatus'
  | 'mentalHealth'
  | 'struggles'
  | 'analyzeLoad'
  | 'homeFeeling'
  | 'homeAtmosphere'
  | 'habitsToBreak'
  | 'halfway'
  | 'procrastinationArea'
  | 'procrastinationReason'
  | 'age'
  | 'gender'
  | 'analyzeDays'
  | 'habitsFocusInsight'
  | 'putOffGuilt'
  | 'habitsFocusScience1'
  | 'habitsFocusScience2'
  | 'habitsFocusScience3'
  | 'expertReview'
  | 'communityProof'
  | 'dailyTime'
  | 'wakeTime'
  | 'sleepTime'
  | 'doctorReferral'
  | 'planBoost'
  | 'stressAwareness'
  | 'cbtFamiliarity'
  | 'stressSignal'
  | 'planApproach'
  | 'planIntro'
  | 'planLoading'
  | 'diagnosis'
  | 'recommendedExercise'
  | 'planOutcome'
  | 'planPersonalization'
  | 'planDays'
  | 'habitPicks'
  | 'adhdSupport'
  | 'lifestyleHappiness'
  | 'habitMotivation'
  | 'greatDaysChart'
  | 'habitCurve'
  | 'scienceCredibility'
  | 'goalProof'
  | 'pact'
  | 'notifications'
  | 'paywall';

/**
 * The goals a user can pick during onboarding, and the single source of truth
 * for that set. Adding a goal here is what forces the rest of the app to
 * account for it — most importantly `INTENT_TECHNIQUE` in
 * `src/features/exercise/guidedBreathing/techniqueSelection.ts`, which will not
 * compile until the new goal has an exercise. Without that chain a new goal
 * silently falls through to the `other` default at runtime.
 */
export type OnboardingIntent =
  | 'scrolling'
  | 'burnout'
  | 'procrastination'
  | 'stress_relief'
  | 'calm_fast'
  | 'sleep'
  | 'focus'
  | 'energy'
  | 'self_acceptance'
  | 'emotional_balance'
  | 'self_care'
  | 'spiritual'
  | 'yoga'
  | 'heart_health'
  | 'cleaning'
  | 'daily_habit'
  | 'other';

export interface IntentOption {
  id: OnboardingIntent;
  icon: IconName;
  accent: string;
  title: string;
  /** Previous titles accepted when restoring goals saved before a copy update. */
  legacyTitles?: readonly string[];
  body: string;
}

export interface IntentValuePoint {
  icon: IconName;
  accent: string;
  label: string;
}

export interface PersonalizedIntentOption extends IntentOption {
  hook: string;
  goalPhrase: string;
  assessmentPlan: string;
  reflectionHeadline: string;
  reflectionBody: string;
  valuePoints: IntentValuePoint[];
}
