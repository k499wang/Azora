import { Text } from '../../common/Text';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

export type DoctorReferral = 'doctor' | 'other_professional' | 'no';

const OPTIONS: {
  id: DoctorReferral;
  title: string;
}[] = [
  { id: 'doctor', title: 'Yes, by a doctor' },
  { id: 'other_professional', title: 'Yes, by another health professional' },
  { id: 'no', title: 'No' },
];

interface DoctorReferralScreenProps {
  value: DoctorReferral | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (value: DoctorReferral) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function DoctorReferralScreen({
  value,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: DoctorReferralScreenProps) {
  const handleSelect = (id: DoctorReferral) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onSelect(id);
  };

  return (
    <OnboardingScreenLayout
      title="Was Azora recommended to you by a doctor?"
      subtitle="Referrals from clinicians help us know what to build next."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={value == null}
        />
      }
    >
      <View style={styles.options}>
        {OPTIONS.map((option, index) => {
          const selected = value === option.id;
          const isFirst = index === 0;

          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => handleSelect(option.id)}
              style={({ pressed }) => [
                styles.option,
                !isFirst && styles.optionDivider,
                pressed && styles.optionPressed,
              ]}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: selected
                      ? colors.primary.blue600
                      : colors.border.default,
                  },
                ]}
              />
              <Text
                style={[
                  styles.optionTitle,
                  selected && styles.optionTitleSelected,
                ]}
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
    gap: spacing.lg,
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
    fontWeight: '500',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
