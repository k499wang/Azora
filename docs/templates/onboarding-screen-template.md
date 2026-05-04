# Onboarding Screen Template

Use this when adding a new step to the post-login onboarding flow.

Onboarding is currently a gated UI flow, not a React Navigation stack. `RootNavigator` renders `OnboardingFlow` when `useAppGate()` returns `needs_onboarding`, and `OnboardingFlow.tsx` owns the internal step state.

Current onboarding files:

```text
src/components/onboarding/
  OnboardingFlow.tsx
  OnboardingPrimaryButton.tsx
  OnboardingScreenLayout.tsx
  OnboardingHapticSlider.tsx
  screens/
    IntentQuestionScreen.tsx
    IntentReflectionScreen.tsx
    CustomIntentScreen.tsx
    AgeScreen.tsx
    GenderScreen.tsx
    DailyTimeScreen.tsx
  data/
    intentOptions.ts
    genderOptions.ts
  types.ts
```

Active wired steps are:

```text
IntentQuestionScreen
  -> IntentReflectionScreen
  -> complete onboarding

IntentQuestionScreen
  -> CustomIntentScreen
  -> complete onboarding
```

`AgeScreen`, `GenderScreen`, and `DailyTimeScreen` exist as UI building blocks, but they are not wired into `OnboardingFlow.tsx` yet.

Keep each screen presentational. Let `OnboardingFlow.tsx` own:

- current step state
- accumulated answers
- back and continue transitions
- final `onComplete(...)` call
- submission/loading/error state

Use `data/` for static options and `types.ts` for shared answer/step types.

## 1. Create The Screen Component

Prefer the current shared onboarding primitives over reimplementing layout in each screen:

- `OnboardingScreenLayout`
- `OnboardingPrimaryButton`
- `OnboardingHapticSlider` for numeric slider steps
- theme tokens from `src/theme/`

Example:

```tsx
// src/components/onboarding/screens/ExperienceQuestionScreen.tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import { EXPERIENCE_OPTIONS, type ExperienceOption } from '../data/experienceOptions';

interface ExperienceQuestionScreenProps {
  value: ExperienceOption['id'] | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (id: ExperienceOption['id']) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function ExperienceQuestionScreen({
  value,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
}: ExperienceQuestionScreenProps) {
  const handleSelect = (id: ExperienceOption['id']) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onSelect(id);
  };

  return (
    <OnboardingScreenLayout
      title="How familiar are you?"
      subtitle="This helps tune the first sessions we show you."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={value == null}
        />
      }
    >
      <View style={styles.options}>
        {EXPERIENCE_OPTIONS.map((option, index) => {
          const selected = value === option.id;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => handleSelect(option.id)}
              style={({ pressed }) => [
                styles.option,
                index !== 0 && styles.optionDivider,
                pressed && styles.optionPressed,
              ]}
            >
              <Text
                style={[styles.optionTitle, selected && styles.optionTitleSelected]}
              >
                {option.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  options: {
    marginTop: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  optionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  optionPressed: {
    opacity: 0.6,
  },
  optionTitle: {
    ...typography.body.medium,
    color: colors.text.primary,
    flex: 1,
  },
  optionTitleSelected: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
});
```

## 2. Add Static Data

If the screen uses fixed options, add a specific data file:

```ts
// src/components/onboarding/data/experienceOptions.ts
export interface ExperienceOption {
  id: 'new' | 'some' | 'regular';
  title: string;
}

export const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  { id: 'new', title: 'I am new to breathwork' },
  { id: 'some', title: 'I have tried it before' },
  { id: 'regular', title: 'I practice regularly' },
];
```

Avoid a generic `utils.ts` or catch-all options file. Name the data after the answer it collects.

## 3. Update Shared Types

Add the new step to `src/components/onboarding/types.ts`:

```ts
export type OnboardingStep =
  | 'intent'
  | 'intentReflection'
  | 'customIntent'
  | 'experience';
```

If the answer has a stable domain type, export it near the option data or from `types.ts`, whichever keeps imports clearer.

## 4. Add It To The Flow

`OnboardingFlow.tsx` decides which onboarding screen is visible. Add local state for the answer and a render branch for the step.

Example:

```tsx
const [experience, setExperience] = useState<ExperienceOption['id'] | null>(null);

if (step === 'experience') {
  return (
    <ExperienceQuestionScreen
      value={experience}
      stepIndex={3}
      stepCount={4}
      onSelect={setExperience}
      onBack={() => setStep('intentReflection')}
      onContinue={() => {
        if (experience == null || selectedIntent == null) return;

        void completeOnboarding(selectedIntent);
      }}
    />
  );
}
```

Only call `onComplete(...)` on the final step. That writes `onboarding_completed_at`, invalidates the onboarding status query, and lets the root gate move the user into the main app.

Do not add a route unless onboarding needs real navigation history, deep links, or route-level behavior. Gate-level rendering through `RootNavigator` is the default.

## 5. Persist The New Answer

If the new screen needs to persist an answer, add a Supabase column first, for example:

```text
profiles.onboarding_experience_level text null
```

Then update:

- `src/services/supabase/database.types.ts`
- `src/services/profile/onboardingStatusService.ts`
- `src/queries/profile/useCompleteOnboardingMutation.ts` if the input shape changes
- `src/components/onboarding/OnboardingFlow.tsx`

Example service input:

```ts
export interface CompleteOnboardingInput {
  onboardingGoal?: string | null;
  onboardingExperienceLevel?: string | null;
}
```

Example profile payload:

```ts
const profile: ProfileInsert = {
  user_id: userId,
  onboarding_goal: input.onboardingGoal ?? null,
  onboarding_experience_level: input.onboardingExperienceLevel ?? null,
  onboarding_completed_at: new Date().toISOString(),
};
```

## Rules

- Keep screen files UI-only.
- Keep Supabase writes in `services/`.
- Keep React Query invalidation in mutation hooks.
- Keep onboarding completion at the end of the flow.
- Use explicit prop types.
- Reuse onboarding primitives and theme tokens.
- Keep `stepIndex` and `stepCount` accurate for the active path.
- Do not introduce `useNavigation<any>()` or local route types for onboarding steps.
