import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Icon, { type IconName } from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

export type ExperienceLevel = 'never' | 'little' | 'regular';

const OPTIONS: {
  id: ExperienceLevel;
  icon: IconName;
  title: string;
  body: string;
}[] = [
  {
    id: 'never',
    icon: 'sparkle',
    title: 'New to this',
    body: "I haven't really tried breathwork before.",
  },
  {
    id: 'little',
    icon: 'waves',
    title: 'Dabbled a bit',
    body: 'I\'ve tried it a few times but nothing consistent.',
  },
  {
    id: 'regular',
    icon: 'meditation',
    title: 'I practice regularly',
    body: 'Breathwork or meditation is part of my routine.',
  },
];

interface ExperienceScreenProps {
  value: ExperienceLevel | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (value: ExperienceLevel) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function ExperienceScreen({
  value,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
}: ExperienceScreenProps) {
  const handleSelect = (id: ExperienceLevel) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onSelect(id);
  };

  return (
    <OnboardingScreenLayout
      title="Have you tried breathwork before?"
      subtitle="We'll tailor the app to your experience."
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
      <View style={styles.list}>
        {OPTIONS.map((option, index) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => handleSelect(option.id)}
              style={({ pressed }) => [
                styles.row,
                index !== 0 && styles.rowDivider,
                pressed && styles.rowPressed,
              ]}
            >
              <Icon
                name={option.icon}
                size={26}
                color={selected ? colors.primary.blue600 : colors.text.tertiary}
              />
              <View style={styles.text}>
                <Text
                  style={[
                    styles.title,
                    selected && styles.titleSelected,
                  ]}
                >
                  {option.title}
                </Text>
                <Text style={styles.body}>{option.body}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  selected && styles.radioSelected,
                ]}
              >
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  rowPressed: {
    opacity: 0.6,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.body.medium,
    color: colors.text.primary,
  },
  titleSelected: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
  },
  body: {
    ...typography.body.small,
    fontSize: 13,
    color: colors.text.secondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary.blue600,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary.blue600,
  },
});
