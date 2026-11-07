import { StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import Icon from '../../common/icons/Icon';
import PlanDayCard from '../PlanDayCard';
import type { OnboardingPreset } from '../../../lib/onboardingPreset';
import { paywallPlanOutline, type PlanOutlineDreams } from '../../../lib/paywall/paywallPlanOutline';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import type { OnboardingIntent } from '../types';
import { paywallStepStyles } from './paywallStepStyles';

export function PaywallPlanOutline({ preset, intent, goalPhrase, dreams }: {
  preset: OnboardingPreset;
  intent: OnboardingIntent;
  goalPhrase?: string | null;
  dreams: PlanOutlineDreams;
}) {
  return (
    <View style={styles.container}>
      <View style={paywallStepStyles.stepHeader}>
        <Text style={paywallStepStyles.stepTitle}>It’s not about willpower.</Text>
        <Text style={styles.subtitle}>It’s about a plan that fits your life.</Text>
      </View>
      <Text style={styles.intro}>
        Your Personalized Plan guides you one small step at a time, built from your answers.
      </Text>
      <Text style={styles.sectionLabel}>Here’s what your first 7 days look like:</Text>
      {paywallPlanOutline(preset, intent, goalPhrase, dreams).map((item) => {
        if (item.kind === 'dream') {
          return (
            <View key={`dream-${item.day}`} style={styles.dream}>
              <View style={styles.dreamHeading}>
                <Icon name="sparkle" size={18} color={colors.primary.blue500} />
                <Text style={styles.dreamTitle}>By Day {item.day}</Text>
              </View>
              <Text style={styles.dreamOutcome}>{item.outcome}</Text>
            </View>
          );
        }
        return (
          <PlanDayCard
            key={`day-${item.day}`}
            title={`Day ${item.day}: ${item.title}`}
            line={item.line}
            index={item.day - 1}
            smallTitle
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  subtitle: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  intro: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sectionLabel: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  dream: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: spacing.md,
    borderCurve: 'continuous',
    backgroundColor: colors.primary.blue100,
  },
  dreamHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dreamTitle: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  dreamOutcome: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
