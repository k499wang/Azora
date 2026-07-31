import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import {
  ACQUISITION_SOURCE_OPTIONS,
  type AcquisitionSourceId,
} from '../data/acquisitionOptions';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionIcon, {
  type OnboardingOptionIconName,
} from '../OnboardingOptionIcon';

type AcquisitionSourceIcon = OnboardingOptionIconName | 'tiktok-custom';

const ACQUISITION_SOURCE_ICONS: Record<
  AcquisitionSourceId,
  AcquisitionSourceIcon
> = {
  instagram: 'instagram',
  tiktok: 'tiktok-custom',
  facebook: 'facebook',
  reddit: 'reddit',
  app_store_search: 'apple-ios',
  google_search: 'google',
  friend_or_family: 'account-group-outline',
  other: 'dots-horizontal-circle-outline',
};

interface AcquisitionSourceScreenProps {
  value: AcquisitionSourceId | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (id: AcquisitionSourceId) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function AcquisitionSourceScreen({
  value,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: AcquisitionSourceScreenProps) {
  const handleSelect = (id: AcquisitionSourceId) => {
    if (isHapticsEnabled()) Haptics.selectionAsync().catch(() => {});
    onSelect(id);
  };

  return (
    <OnboardingScreenLayout
      title="How did you first hear about Azora?"
      subtitle="It helps us keep making what actually reached you."
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
        {ACQUISITION_SOURCE_OPTIONS.map((option, index) => {
          const selected = value === option.id;
          const isFirst = index === 0;
          const icon = ACQUISITION_SOURCE_ICONS[option.id];

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
              {icon === 'tiktok-custom' ? (
                <View style={styles.iconSlot}>
                  <Icon
                    name="tiktok"
                    size={22}
                    color={selected ? colors.primary.blue600 : colors.accent[600]}
                  />
                </View>
              ) : (
                <OnboardingOptionIcon name={icon} selected={selected} />
              )}
              <Text
                style={[styles.optionTitle, selected && styles.optionTitleSelected]}
              >
                {option.title}
              </Text>
              <View style={[styles.radio, selected && styles.radioSelected]}>
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
  options: {
    marginTop: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  optionDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  optionPressed: {
    opacity: 0.6,
  },
  iconSlot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary.blue600,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.primary.blue600,
  },
});
