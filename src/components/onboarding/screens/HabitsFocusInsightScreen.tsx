import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../../common/Text';
import Icon, { type IconName } from '../../common/icons/Icon';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { getOnboardingImageSource } from '../../../services/images/onboardingImageCache';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

interface HabitsFocusInsightScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

export default function HabitsFocusInsightScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: HabitsFocusInsightScreenProps) {
  return (
    <OnboardingScreenLayout
      title="Build Habits More Easily with Behavioural Science"
      progress={stepIndex / stepCount}
      onBack={onBack}
      centerCopy
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.body}>
        <Image
          source={getOnboardingImageSource('habitsFocusBrain')}
          style={styles.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
        />
        <View style={styles.factsCard}>
          <InsightRow
            icon="waves"
            lead="3X"
            leadColor={colors.playful.teal.base}
            sentence=" times more likely to achieve your goals with behavioral science."
          />
          <View style={styles.divider} />
          <InsightRow
            icon="sparkle"
            lead="93%"
            leadColor={colors.playful.violet.base}
            sentence=" of our users have accomplished at least one goal and built healthy habits."
          />
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

function InsightRow({
  icon,
  lead,
  leadColor,
  sentence,
}: {
  icon: IconName;
  lead: string;
  leadColor: string;
  sentence: string;
}) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={22} color={leadColor} />
      <View style={styles.copy}>
        <Text style={styles.statLine}>
          <Text style={[styles.statLead, { color: leadColor }]}>{lead}</Text>
          {sentence}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
    paddingTop: 0,
  },
  illustration: {
    width: '100%',
    height: 360,
    alignSelf: 'center',
    marginTop: -spacing.md,
  },
  factsCard: {
    ...card.base,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
    backgroundColor: colors.border.subtle,
  },
  statLine: {
    ...typography.heading.heading2,
    fontSize: 20,
    lineHeight: 28,
    color: colors.text.primary,
  },
  statLead: {
    ...typography.title.title2,
    fontSize: 20,
    lineHeight: 28,
  },
});
