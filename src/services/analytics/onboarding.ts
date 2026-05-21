import { posthog } from '../../config/posthog';
import { AnalyticsEvent, type AnalyticsEventName } from './events';

type OnboardingAnalyticsValue = string | number | boolean | null;
type OnboardingAnalyticsProperties = Record<string, OnboardingAnalyticsValue>;
export type OnboardingCompletionPath =
  | 'purchase'
  | 'restore'
  | 'continue_without_pro';

type StepEventInput = {
  step: string;
  stepIndex: number;
  stepCount: number;
};

type StepTransitionInput = StepEventInput & {
  nextStep: string;
  action: 'continue' | 'skip' | 'back' | 'auto';
  properties?: OnboardingAnalyticsProperties;
};

function stepProperties(input: StepEventInput): OnboardingAnalyticsProperties {
  return {
    onboarding_step: input.step,
    onboarding_step_index: input.stepIndex,
    onboarding_step_count: input.stepCount,
  };
}

function capture(
  event: AnalyticsEventName,
  properties: OnboardingAnalyticsProperties,
): void {
  posthog.capture(event, properties);
}

function splitStepInput<T extends StepEventInput>(
  input: T,
): {
  step: StepEventInput;
  properties: Omit<T, keyof StepEventInput>;
} {
  const { step, stepIndex, stepCount, ...properties } = input;
  return {
    step: { step, stepIndex, stepCount },
    properties,
  };
}

export function trackOnboardingStarted(input: StepEventInput & {
  entry_state: 'new' | 'saved_profile';
}) {
  capture(AnalyticsEvent.OnboardingStarted, {
    ...stepProperties(input),
    entry_state: input.entry_state,
  });
}

export function trackOnboardingStepViewed(input: StepEventInput & {
  previousStep: string | null;
}) {
  capture(AnalyticsEvent.OnboardingStepViewed, {
    ...stepProperties(input),
    previous_step: input.previousStep,
  });
}

export function trackOnboardingStepCompleted({
  nextStep,
  action,
  properties,
  ...input
}: StepTransitionInput) {
  capture(AnalyticsEvent.OnboardingStepCompleted, {
    ...stepProperties(input),
    next_step: nextStep,
    action,
    ...properties,
  });
}

export function trackOnboardingStepSkipped({
  nextStep,
  action,
  properties,
  ...input
}: StepTransitionInput) {
  capture(AnalyticsEvent.OnboardingStepSkipped, {
    ...stepProperties(input),
    next_step: nextStep,
    action,
    ...properties,
  });
}

export function trackOnboardingBackPressed({
  nextStep,
  action,
  properties,
  ...input
}: StepTransitionInput) {
  capture(AnalyticsEvent.OnboardingBackPressed, {
    ...stepProperties(input),
    next_step: nextStep,
    action,
    ...properties,
  });
}

export function trackOnboardingIntentUpdated(input: StepEventInput & {
  intentId: string;
  selected: boolean;
  selectedIntentCount: number;
  hasCustomIntent: boolean;
}) {
  capture(AnalyticsEvent.OnboardingIntentUpdated, {
    ...stepProperties(input),
    intent_id: input.intentId,
    selected: input.selected,
    selected_intent_count: input.selectedIntentCount,
    has_custom_intent: input.hasCustomIntent,
  });
}

export function trackOnboardingProfileSaveStarted(
  input: StepEventInput & OnboardingAnalyticsProperties,
) {
  const { step, properties } = splitStepInput(input);
  capture(AnalyticsEvent.OnboardingProfileSaveStarted, {
    ...stepProperties(step),
    ...properties,
  });
}

export function trackOnboardingProfileSaveSucceeded(
  input: StepEventInput & OnboardingAnalyticsProperties,
) {
  const { step, properties } = splitStepInput(input);
  capture(AnalyticsEvent.OnboardingProfileSaveSucceeded, {
    ...stepProperties(step),
    ...properties,
  });
}

export function trackOnboardingProfileSaveFailed(
  input: StepEventInput & OnboardingAnalyticsProperties,
) {
  const { step, properties } = splitStepInput(input);
  capture(AnalyticsEvent.OnboardingProfileSaveFailed, {
    ...stepProperties(step),
    ...properties,
  });
}

export function trackOnboardingCompleted(input: StepEventInput & {
  completion_path: OnboardingCompletionPath;
}) {
  capture(AnalyticsEvent.OnboardingCompleted, {
    ...stepProperties(input),
    completion_path: input.completion_path,
  });
}
