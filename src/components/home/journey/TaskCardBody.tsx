import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import CoinWorth from '../../common/CoinWorth';
import { card, radius } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography, wrappedLineHeight } from '../../../theme/typography';
import { TODAY_JOURNEY_CARD_MIN_HEIGHT } from '../todayJourneyLayout';

export const TASK_TITLE_LINE_HEIGHT = wrappedLineHeight(typography.body.large.fontSize);
/** A long task gets the room it needs instead of being cut off at two lines. */
export const TASK_TITLE_MAX_LINES = 3;

interface Props {
  /** Already on its `card.taskIcon` tile. */
  icon: ReactNode;
  /** What finishing it pays; left out when it pays nothing. */
  coins?: number;
  /** A mark between the copy and the coin, like a featured to-do's star. */
  badge?: ReactNode;
  children: ReactNode;
}

/**
 * The inside of a plan row and a to-do card — icon, copy, what it pays — so a
 * row the app scheduled and a to-do you wrote stay the same shape. Drawn as
 * siblings into the caller's `taskCard.face`, which owns the press behaviour.
 */
export default function TaskCardBody({ icon, coins, badge, children }: Props) {
  return (
    <>
      <View style={taskCard.icon}>{icon}</View>
      <View style={taskCard.copy}>{children}</View>
      {badge == null ? null : <View style={taskCard.badge}>{badge}</View>}
      {coins == null ? null : <CoinWorth coins={coins} />}
    </>
  );
}

export const taskCard = StyleSheet.create({
  surface: {
    ...card.base,
    ...card.shadow,
    borderRadius: radius.medium,
  },
  face: {
    minHeight: TODAY_JOURNEY_CARD_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    paddingLeft: 0,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: {
    width: spacing['3xl'] + spacing.lg,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.xs,
    gap: 6,
  },
  badge: {
    marginRight: spacing.xs,
  },
  overline: {
    ...typography.overline,
    fontFamily: fonts.semibold,
    color: colors.text.tertiary,
  },
  title: {
    ...typography.body.large,
    lineHeight: TASK_TITLE_LINE_HEIGHT,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  detail: {
    ...typography.label.detail,
    color: colors.text.tertiary,
  },
});
