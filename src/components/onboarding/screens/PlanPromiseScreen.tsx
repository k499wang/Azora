import { Fragment, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../common/Text';
import { JOURNEY_MARKS } from '../../paywall/PaywallPlanJourney';
import type { OnboardingPreset } from '../../../lib/onboardingPreset';
import { paywallPlanOutline } from '../../../lib/paywall/paywallPlanOutline';
import { card, radius } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import OnboardingOptionIcon from '../OnboardingOptionIcon';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import type { OnboardingIntent } from '../types';

interface PlanPromiseScreenProps {
  preset: OnboardingPreset;
  intent: OnboardingIntent;
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const PREVIEW_DAYS = 3;
const BADGE_SIZE = 40;
const BADGE_GLYPH_SIZE = 26;

/** A glimpse of what the answers are about to become, before the questions start. */
export default function PlanPromiseScreen({
  preset,
  intent,
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: PlanPromiseScreenProps) {
  const days = useMemo(
    () =>
      paywallPlanOutline(preset, intent, null)
        .flatMap((item) => (item.kind === 'day' ? [item] : []))
        .slice(0, PREVIEW_DAYS),
    [preset, intent],
  );

  return (
    <OnboardingScreenLayout
      title="Let us build you a plan!"
      subtitle={
        <>
          Get <Text style={styles.emphasis}>personalized feedback</Text> and a plan designed to{' '}
          <Text style={styles.emphasis}>unlock the potential</Text> within you.
        </>
      }
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Next" onPress={onContinue} />}
    >
      <View style={styles.stage}>
        <View style={[styles.card, styles.feedbackCard]}>
          <Text style={styles.cardLabel}>Your Feedback</Text>
          <View style={styles.day}>
            <View style={[styles.badge, { backgroundColor: colors.playful.teal.soft }]}>
              <OnboardingOptionIcon name="book" size={BADGE_GLYPH_SIZE} color={colors.playful.teal.ink} />
            </View>
            <View style={styles.dayCopy}>
              <Text style={styles.dayTitle}>Your first lesson</Text>
              <Text style={styles.lessonLine}>{days[0]?.line}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.planCard]}>
          <Text style={styles.cardLabel}>Your Plan</Text>
          {days.map((day, index) => {
            const { icon, hue } = JOURNEY_MARKS[index % JOURNEY_MARKS.length];
            return (
              <Fragment key={day.day}>
                {index > 0 ? <View style={styles.connector} /> : null}
                <View style={styles.day}>
                  <View style={[styles.badge, { backgroundColor: hue.soft }]}>
                    <OnboardingOptionIcon name={icon} size={BADGE_GLYPH_SIZE} color={hue.ink} />
                  </View>
                  <View style={styles.dayCopy}>
                    <Text style={styles.dayTitle}>{`Day ${day.day}: ${day.title}`}</Text>
                    <View style={[styles.placeholder, styles.placeholderLong]} />
                    <View style={[styles.placeholder, styles.placeholderShort]} />
                  </View>
                </View>
              </Fragment>
            );
          })}
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    gap: spacing.xl,
    justifyContent: 'center',
  },
  card: {
    ...card.base,
    ...card.shadow,
    padding: spacing.md,
    gap: spacing.sm,
  },
  feedbackCard: {
    width: '90%',
    alignSelf: 'flex-start',
    transform: [{ rotate: '-3deg' }],
  },
  planCard: {
    width: '90%',
    alignSelf: 'flex-end',
    transform: [{ rotate: '2deg' }],
  },
  cardLabel: {
    ...typography.body.large,
    color: colors.text.secondary,
  },
  lessonLine: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  day: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: spacing.xs,
    height: spacing.md,
    marginLeft: (BADGE_SIZE - spacing.xs) / 2,
    borderRadius: radius.full,
    backgroundColor: colors.skeleton.base,
  },
  dayCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  dayTitle: {
    ...typography.body.large,
    color: colors.text.primary,
  },
  placeholder: {
    height: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.skeleton.base,
  },
  placeholderLong: {
    width: '85%',
  },
  placeholderShort: {
    width: '55%',
  },
  emphasis: {
    color: colors.text.primary,
  },
});
