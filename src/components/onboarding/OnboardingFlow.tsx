import { useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WelcomeScreen } from './steps/WelcomeScreen';
import { ScienceScreen } from './steps/ScienceScreen';
import { IntentScreen, type Intent } from './steps/IntentScreen';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface OnboardingFlowProps {
  onComplete: (data: { intents: Intent[] }) => void;
}

const TOTAL_STEPS = 3;

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [index, setIndex] = useState(0);
  const [intents, setIntents] = useState<Intent[]>([]);
  const insets = useSafeAreaInsets();

  const handleNext = useCallback(() => {
    if (index < TOTAL_STEPS - 1) {
      setIndex((i) => i + 1);
    } else {
      onComplete({ intents });
    }
  }, [index, intents, onComplete]);

  const handleBack = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
  }, [index]);

  const stepProps = {
    onNext: handleNext,
    onBack: handleBack,
    stepIndex: index,
    totalSteps: TOTAL_STEPS,
  };

  let step: React.ReactNode;
  if (index === 0) step = <WelcomeScreen {...stepProps} />;
  else if (index === 1) step = <ScienceScreen {...stepProps} />;
  else step = <IntentScreen {...stepProps} selected={intents} onChange={setIntents} />;

  return (
    <View style={styles.root}>
      {step}
      {__DEV__ && (
        <Pressable
          onPress={() => onComplete({ intents })}
          style={[styles.devButton, { top: insets.top + spacing.sm }]}
          hitSlop={8}
        >
          <Text style={styles.devButtonText}>DEV · Skip</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  devButton: {
    position: 'absolute',
    right: spacing.md,
    backgroundColor: colors.warning[100],
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.warning[500],
  },
  devButtonText: {
    ...typography.label.small,
    color: colors.warning[700],
  },
});
