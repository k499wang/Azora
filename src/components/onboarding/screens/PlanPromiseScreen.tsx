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
import OnboardingOptionIcon, { type OnboardingOptionIconName } from '../OnboardingOptionIcon';
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
const MOOD_SIZE = 26;
const MOOD_GLYPH_SIZE = 18;

const FEEDBACK_MOODS: readonly { icon: OnboardingOptionIconName; hue: { soft: string; ink: string } }[] = [
  { icon: 'emoticon-happy-outline', hue: colors.playful.coral },
  { icon: 'sparkle', hue: colors.playful.sky },
  { icon: 'star', hue: colors.playful.teal },
];

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
          <View style={styles.feedbackHeader}>
            <Text style={styles.cardLabel}>Your Feedback</Text>
            <View style={styles.moods}>
              {FEEDBACK_MOODS.map(({ icon, hue }) => (
                <View key={icon} style={[styles.mood, { backgroundColor: hue.soft }]}>
                  <OnboardingOptionIcon name={icon} size={MOOD_GLYPH_SIZE} color={hue.ink} />
                </View>
              ))}
            </View>
          </View>
          <Bar fill="82%" track={colors.playful.amber.soft} color={colors.playful.amber.base} tall />
          <Text style={styles.compareLabel}>You vs Others</Text>
          <Bar fill="28%" track={colors.playful.teal.soft} color={colors.playful.teal.base} />
          <Bar fill="74%" track={colors.playful.teal.soft} color={colors.playful.teal.base} />
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

function Bar({ fill, track, color, tall = false }: {
  fill: `${number}%`;
  track: string;
  color: string;
  tall?: boolean;
}) {
  return (
    <View style={[styles.bar, tall && styles.barTall, { backgroundColor: track }]}>
      <View style={[styles.barFill, { width: fill, backgroundColor: color }]} />
    </View>
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
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  moods: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  mood: {
    width: MOOD_SIZE,
    height: MOOD_SIZE,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareLabel: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  bar: {
    height: spacing.md,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barTall: {
    height: spacing['2xl'],
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
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
    ...typography.body.small,
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
