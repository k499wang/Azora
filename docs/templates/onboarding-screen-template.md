# Onboarding Screen Template

Use this when adding a new step to the post-login onboarding flow.

Onboarding files should use this shape:

```text
src/components/onboarding/
  OnboardingFlow.tsx
  screens/
    IntentQuestionScreen.tsx
    ExperienceQuestionScreen.tsx
  data/
    intentOptions.ts
    experienceOptions.ts
  types.ts
```

Keep each screen presentational. Let `OnboardingFlow.tsx` own:

- current step state
- accumulated answers
- final `onComplete(...)` call
- submission/loading/error state

Use `data/` for static options and `types.ts` for shared answer/step types.

## 1. Create The Screen Component

Example:

```tsx
// src/components/onboarding/screens/ExperienceQuestionScreen.tsx
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { EXPERIENCE_OPTIONS } from '../data/experienceOptions';

interface ExperienceQuestionScreenProps {
  onSelect: (experienceLevel: string) => void;
}

export default function ExperienceQuestionScreen({
  onSelect,
}: ExperienceQuestionScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.title}>How familiar are you?</Text>
          <Text style={styles.subtitle}>
            This helps tune the first sessions we show you.
          </Text>
        </View>

        <View style={styles.options}>
          {EXPERIENCE_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              onPress={() => onSelect(option.id)}
              style={({ pressed }) => [
                styles.option,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={styles.optionTitle}>{option.title}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['3xl'],
    gap: spacing.xl,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title.title1,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    ...card.base,
    ...card.shadow,
    minHeight: 72,
    justifyContent: 'center',
    padding: spacing.md,
  },
  optionPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  optionTitle: {
    ...typography.heading.heading2,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
```

## 2. Export It

Add the screen to:

```ts
// src/components/onboarding/index.ts
export { default as ExperienceQuestionScreen } from './screens/ExperienceQuestionScreen';
```

If the screen uses static options, add them under `data/`:

```ts
// src/components/onboarding/data/experienceOptions.ts
export const EXPERIENCE_OPTIONS = [
  { id: 'new', title: 'I am new to breathwork' },
  { id: 'some', title: 'I have tried it before' },
  { id: 'regular', title: 'I practice regularly' },
];
```

## 3. Add It To The Flow

`OnboardingFlow.tsx` decides which onboarding screen is visible.

Use a small typed step state:

```tsx
type OnboardingStep = 'intent' | 'experience';

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>('intent');
  const [intent, setIntent] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);

  if (step === 'intent') {
    return (
      <IntentQuestionScreen
        onSelect={(nextIntent) => {
          setIntent(nextIntent);
          setStep('experience');
        }}
      />
    );
  }

  return (
    <ExperienceQuestionScreen
      onSelect={async (nextExperience) => {
        setExperience(nextExperience);

        if (intent == null) return;

        await onComplete({
          onboardingGoal: intent,
          onboardingExperienceLevel: nextExperience,
        });
      }}
    />
  );
}
```

Only call `onComplete(...)` on the final step. That writes `onboarding_completed_at`, and the app gate will move the user into the main app.

## 4. Store The New Answer

If the new screen needs to persist an answer, add a Supabase column first, for example:

```text
profiles.onboarding_experience_level text null
```

Then update:

- `src/services/supabase/database.types.ts`
- `src/services/profile/onboardingStatusService.ts`
- `src/queries/profile/useCompleteOnboardingMutation.ts` if the input shape changes

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
- Keep onboarding completion at the end of the flow.
- Use explicit prop types.
- Reuse `colors`, `spacing`, `typography`, and `card` tokens.
- Do not add a route unless onboarding needs real navigation history. Gate-level rendering through `RootNavigator` is the default.
