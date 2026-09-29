import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import FeatureInfoDialog from '../../components/common/FeatureInfoDialog';
import Icon from '../../components/common/icons/Icon';
import Skeleton from '../../components/common/Skeleton';
import ProgressRing from '../../components/common/ProgressRing';
import { azoraScoreIfTodayKept, type AzoraScore } from './domain/azoraScore';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

/** Sized so the card stands as tall as a two-line week banner under it. */
const RING_SIZE = 70;
const RING_STROKE = 7;

const AZORA_SCORE_INFO = {
  title: 'Azora Score',
  message:
    'Your Azora Score is your plan-completion rate. It is calculated as: days you completed part of your plan divided by days in the scoring window × 100.\n\nThe scoring window is the last seven days. For example, completing your plan on 5 of 7 days gives you a score of 71. During your first week, it uses only the days since your plan started — completing all 3 days of a new plan gives you 100.\n\nIt measures consistency, not overall progress through the plan. The score can go down when an earlier completed day moves out of the seven-day window.',
};

/** The plan screen's header: what the score counts on the left, the score on the right. */
export default function PlanHeroCard({
  score,
  isLoading,
}: {
  score: AzoraScore | null;
  isLoading: boolean;
}) {
  const [infoVisible, setInfoVisible] = useState(false);

  if (isLoading || score == null) {
    return (
      <View style={[card.base, card.shadow, styles.hero]}>
        <Skeleton width={RING_SIZE} height={RING_SIZE} radius={radius.full} />
      </View>
    );
  }

  const ifKept = azoraScoreIfTodayKept(score);

  return (
    <View style={[card.base, card.shadow, styles.hero]}>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Azora Score</Text>
          <Pressable
            accessibilityLabel="What is the Azora Score?"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => setInfoVisible(true)}
          >
            <Icon name="info" size={20} color={colors.text.tertiary} />
          </Pressable>
        </View>
        {/* One line, so the card keeps a week banner's height: what today would
            make it while today is open, what was kept once it is not. */}
        <Text style={styles.subtitle} numberOfLines={1}>
          {ifKept == null ? (
            `${score.daysKept} of ${score.daysAsked} ${score.daysAsked === 1 ? 'day' : 'days'} kept`
          ) : (
            <>
              Finish today for <Text style={styles.subtitleValue}>{ifKept}</Text>
            </>
          )}
        </Text>
      </View>

      <ProgressRing fill={score.score / 100} size={RING_SIZE} stroke={RING_STROKE}>
        <Text style={styles.value}>{score.score}</Text>
      </ProgressRing>

      <FeatureInfoDialog
        visible={infoVisible}
        onClose={() => setInfoVisible(false)}
        title={AZORA_SCORE_INFO.title}
        intro={AZORA_SCORE_INFO.message}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
  },
  subtitleValue: {
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  value: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
});
